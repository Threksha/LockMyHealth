import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { db } from './server/db.ts';
import { chatWithLockMyHealth, explainLabParameter } from './server/ai.ts';

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Upload directory & storage configuration
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Create mock file folder if not present for synthetic demo files
const MOCK_FILES_DIR = path.resolve(process.cwd(), 'public/mock-files');
if (!fs.existsSync(MOCK_FILES_DIR)) {
  fs.mkdirSync(MOCK_FILES_DIR, { recursive: true });
  // Create sample mock PDF/text placeholders
  const samplePdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF';
  ['prescription_aug_2026.pdf', 'lab_report_aug_2026.pdf', 'dr_sharma_consult_may2026.pdf', 'asthma_plan_mar2026.pdf', 'prescription_oct_2025.pdf'].forEach(fn => {
    const fPath = path.join(MOCK_FILES_DIR, fn);
    if (!fs.existsSync(fPath)) fs.writeFileSync(fPath, samplePdfContent);
  });
}

// Authentication accounts are stored separately from clinical profiles. Passwords are
// salted and hashed with Node's built-in scrypt; plain-text passwords are never persisted.
type AuthAccount = { email: string; userId: string; role: 'patient' | 'doctor'; salt: string; passwordHash: string };
const AUTH_FILE = path.resolve(process.cwd(), 'data/auth_accounts.json');
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const sessions = new Map<string, { userId: string; expiresAt: number }>();
let authAccounts: AuthAccount[] = [];

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}
function saveAuthAccounts(): void {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(authAccounts, null, 2), 'utf8');
}
function createAuthAccount(email: string, userId: string, role: 'patient' | 'doctor', password: string): AuthAccount {
  const salt = crypto.randomBytes(16).toString('hex');
  const account = { email: email.trim().toLowerCase(), userId, role, salt, passwordHash: hashPassword(password, salt) };
  authAccounts.push(account);
  saveAuthAccounts();
  return account;
}
function verifyPassword(account: AuthAccount, password: string): boolean {
  const candidate = Buffer.from(hashPassword(password, account.salt), 'hex');
  const expected = Buffer.from(account.passwordHash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}
function seedAuthAccounts(): void {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
      authAccounts = Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.warn('Could not read authentication accounts; starting with seeded demo accounts.', error);
    authAccounts = [];
  }

  // The six patient accounts and four clinician profiles from data.json are pre-registered.
  // Demo password for these fictional accounts: Demo@123. Users can create their own accounts too.
  const seededIds = [
    'patient-001', 'patient-002', 'patient-003', 'patient-004', 'patient-005', 'patient-006',
    'doctor-001', 'doctor-002', 'doctor-003', 'doctor-004'
  ];
  let changed = false;
  for (const userId of seededIds) {
    const user = db.getUser(userId);
    if (!user?.email) continue;
    const email = user.email.trim().toLowerCase();
    if (!authAccounts.some(account => account.email === email)) {
      const salt = crypto.randomBytes(16).toString('hex');
      authAccounts.push({ email, userId, role: user.role, salt, passwordHash: hashPassword('Demo@123', salt) });
      changed = true;
    }
  }
  if (changed || !fs.existsSync(AUTH_FILE)) saveAuthAccounts();
}
seedAuthAccounts();

function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

// Resolve only valid authenticated session tokens.
function getAuthUserId(req: express.Request): string {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return '';
  const token = authHeader.substring(7).trim();
  const session = sessions.get(token);
  if (!session) return '';
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return '';
  }
  return session.userId;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Auth & Session
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const requestedRole: 'patient' | 'doctor' = role === 'doctor' ? 'doctor' : 'patient';
  const account = authAccounts.find(item => item.email === normalizedEmail && item.role === requestedRole);
  if (!account || typeof password !== 'string' || !verifyPassword(account, password)) {
    return res.status(401).json({ error: 'Email, password, or account type is incorrect. If you are new, create an account first.' });
  }
  const user = db.getUser(account.userId);
  if (!user) return res.status(401).json({ error: 'This account profile could not be found.' });
  return res.json({ token: createSession(user.id), user, isDemo: false });
});

app.post('/api/auth/signup', (req, res) => {
  const { email, password, name, role, specialty, hospitalOrFacility } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const requestedRole: 'patient' | 'doctor' = role === 'doctor' ? 'doctor' : 'patient';
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Use a password with at least 8 characters.' });
  }
  if (!cleanName) return res.status(400).json({ error: 'Enter your name to create an account.' });
  if (authAccounts.some(account => account.email === normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
  }

  const userId = `${requestedRole === 'doctor' ? 'doc' : 'user'}_${crypto.createHash('sha256').update(normalizedEmail).digest('hex').slice(0, 16)}`;
  const user = db.getOrCreateUser(
    userId, normalizedEmail, requestedRole === 'doctor' && !cleanName.startsWith('Dr.') ? `Dr. ${cleanName}` : cleanName,
    requestedRole, typeof specialty === 'string' ? specialty.trim() : undefined,
    typeof hospitalOrFacility === 'string' ? hospitalOrFacility.trim() : undefined
  );
  createAuthAccount(normalizedEmail, userId, requestedRole, password);
  return res.status(201).json({ token: createSession(userId), user, isDemo: false });
});

app.get('/api/auth/me', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  const user = db.getUser(userId);
  if (!user) return res.status(401).json({ error: 'Account profile could not be found.' });
  res.json({ user, isDemo: user.isDemo });
});

// 2. Providers
app.get('/api/providers', (req, res) => {
  const userId = getAuthUserId(req);
  res.json(db.getProviders(userId));
});

app.post('/api/providers', (req, res) => {
  const userId = getAuthUserId(req);
  const prov = db.addProvider(userId, req.body);
  res.status(201).json(prov);
});

// 3. Documents
app.get('/api/documents', (req, res) => {
  const userId = getAuthUserId(req);
  const docs = db.getDocuments(userId);
  res.json(docs);
});

app.get('/api/documents/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const doc = db.getDocument(userId, req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
});

app.post('/api/documents/upload', (req, res) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload rejected.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or file exceeds size limit.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileMimeType: req.file.mimetype
    });
  });
});

app.post('/api/documents', (req, res) => {
  const userId = getAuthUserId(req);
  const doc = db.addDocument(userId, req.body);
  res.status(201).json(doc);
});

app.put('/api/documents/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const updated = db.updateDocument(userId, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Document not found' });
  res.json(updated);
});

app.delete('/api/documents/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const deleted = db.deleteDocument(userId, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Document not found' });
  res.json({ success: true });
});

// 4. Timeline
app.get('/api/timeline', (req, res) => {
  const userId = getAuthUserId(req);
  res.json(db.getTimelineEvents(userId));
});

app.post('/api/timeline', (req, res) => {
  const userId = getAuthUserId(req);
  const evt = db.addTimelineEvent(userId, req.body);
  res.status(201).json(evt);
});

// 5. Medications & Reconciliation
app.get('/api/medications', (req, res) => {
  const userId = getAuthUserId(req);
  res.json(db.getMedications(userId));
});

app.post('/api/medications', (req, res) => {
  const userId = getAuthUserId(req);
  const med = db.addMedication(userId, req.body);
  res.status(201).json(med);
});

app.put('/api/medications/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const updated = db.updateMedication(userId, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Medication not found' });
  res.json(updated);
});

app.delete('/api/medications/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const ok = db.deleteMedication(userId, req.params.id);
  if (!ok) return res.status(404).json({ error: 'Medication not found' });
  res.json({ success: true });
});

app.get('/api/medications/reconciliation', (req, res) => {
  const userId = getAuthUserId(req);
  const conflicts = db.getMedicationConflicts(userId);
  res.json(conflicts);
});

// 6. Lab Results
app.get('/api/labs', (req, res) => {
  const userId = getAuthUserId(req);
  res.json(db.getLabResults(userId));
});

app.post('/api/labs', (req, res) => {
  const userId = getAuthUserId(req);
  const lab = db.addLabResult(userId, req.body);
  res.status(201).json(lab);
});

app.delete('/api/labs/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const ok = db.deleteLabResult(userId, req.params.id);
  if (!ok) return res.status(404).json({ error: 'Lab result not found' });
  res.json({ success: true });
});

// 7. Appointments & Reminders
app.get('/api/appointments', (req, res) => {
  const userId = getAuthUserId(req);
  res.json(db.getAppointments(userId));
});

app.post('/api/appointments', (req, res) => {
  const userId = getAuthUserId(req);
  const apt = db.addAppointment(userId, req.body);
  res.status(201).json(apt);
});

app.put('/api/appointments/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const updated = db.updateAppointment(userId, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Appointment not found' });
  res.json(updated);
});

app.delete('/api/appointments/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const ok = db.deleteAppointment(userId, req.params.id);
  if (!ok) return res.status(404).json({ error: 'Appointment not found' });
  res.json({ success: true });
});

// 8. Patient Doctor-Sharing & Consultation Sessions
// Patient: Start new sharing session
app.post('/api/consultation/create', (req, res) => {
  const userId = getAuthUserId(req);
  const { allowedCategories, sharedRecordIds, expiryMinutes } = req.body;
  const session = db.createConsultationSession(userId, {
    allowedCategories,
    sharedRecordIds,
    expiryMinutes: Number(expiryMinutes) || 30
  });
  res.status(201).json(session);
});

// Patient: Get current active session
app.get('/api/consultation/patient-active', (req, res) => {
  const userId = getAuthUserId(req);
  const session = db.getActivePatientSession(userId);
  res.json({ session });
});

// Patient: Get sharing history
app.get('/api/consultation/patient-history', (req, res) => {
  const userId = getAuthUserId(req);
  const history = db.getPatientSharingHistory(userId);
  res.json(history);
});

// Patient: End active session
app.post('/api/consultation/patient-end/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const success = db.endPatientConsultation(userId, req.params.id);
  res.json({ success });
});

// Doctor: Validate code or QR token
app.post('/api/consultation/doctor-validate', (req, res) => {
  const doctorId = getAuthUserId(req);
  const doctor = db.getUser(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor authentication required.' });
  }
  const { codeOrToken } = req.body;
  if (!codeOrToken || typeof codeOrToken !== 'string') {
    return res.status(400).json({ error: 'Sharing code or QR code is required.' });
  }

  const result = db.validateDoctorSessionAccess(doctor, codeOrToken);
  if (result.status === 'doctor_busy') {
    return res.status(409).json(result);
  }
  if (result.status === 'not_found') {
    return res.status(404).json(result);
  }
  if (result.status === 'expired') {
    return res.status(410).json(result);
  }
  if (result.status === 'ended') {
    return res.status(403).json(result);
  }
  res.json(result);
});

// Doctor: Get current active consultation records
app.get('/api/consultation/doctor-active', (req, res) => {
  const doctorId = getAuthUserId(req);
  const doctor = db.getUser(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor authentication required.' });
  }
  const active = db.getDoctorActiveSession(doctorId);
  res.json(active);
});

// Doctor: End active consultation
app.post('/api/consultation/doctor-end', (req, res) => {
  const doctorId = getAuthUserId(req);
  const doctor = db.getUser(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor authentication required.' });
  }
  const success = db.endDoctorCurrentSession(doctorId);
  res.json({ success });
});

// Doctor: Get previously treated patients
app.get('/api/consultation/doctor-previous-patients', (req, res) => {
  const doctorId = getAuthUserId(req);
  const doctor = db.getUser(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor authentication required.' });
  }
  const previous = db.getDoctorPreviousPatients(doctorId);
  res.json(previous);
});

// Backward-compatible record sharing grants
app.get('/api/share/grants', (req, res) => {
  const userId = getAuthUserId(req);
  res.json(db.getShareGrants(userId));
});

app.post('/api/share/create', (req, res) => {
  const userId = getAuthUserId(req);
  const { label, recipientName, recipientRole, allowedCategories, expiryHours, specificDocumentIds } = req.body;
  if (!label || !recipientName) {
    return res.status(400).json({ error: 'Label and recipient name are required' });
  }
  const grant = db.createShareGrant(userId, {
    label,
    recipientName,
    recipientRole: recipientRole || 'Doctor',
    allowedCategories: allowedCategories || ['prescription', 'lab_report', 'consultation_note'],
    expiryHours: Number(expiryHours) || 72,
    specificDocumentIds
  });
  res.status(201).json(grant);
});

app.post('/api/share/revoke/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const ok = db.revokeShareGrant(userId, req.params.id);
  if (!ok) return res.status(404).json({ error: 'Grant not found' });
  res.json({ success: true });
});

// Public read-only secure share endpoint
app.get('/api/share/public/:token', (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';

  const result = db.getSharedDataByToken(req.params.token, {
    ip: clientIp,
    userAgent
  });

  if (result.status === 'not_found') {
    return res.status(404).json({ error: 'Share link not found or invalid.' });
  }
  if (result.status === 'revoked') {
    return res.status(403).json({ error: 'This access link has been revoked by the patient.' });
  }
  if (result.status === 'expired') {
    return res.status(410).json({ error: 'This access link has expired.', expiredAt: result.expiredAt });
  }

  res.json(result);
});

// 9. Emergency Card
app.get('/api/emergency-card', (req, res) => {
  const userId = getAuthUserId(req);
  res.json(db.getEmergencyCard(userId));
});

app.put('/api/emergency-card', (req, res) => {
  const userId = getAuthUserId(req);
  const updated = db.updateEmergencyCard(userId, req.body);
  res.json(updated);
});

// 10. Handover Summary
app.get('/api/handover-summary', (req, res) => {
  const userId = getAuthUserId(req);
  res.json(db.generateHandoverSummary(userId));
});

// 11. AI Routes (Gemini 3.8 Flash)

app.post('/api/ai/chat', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const reply = await chatWithLockMyHealth(userId, message, history || []);
    res.json(reply);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chat query failed' });
  }
});

app.post('/api/ai/explain-lab', async (req, res) => {
  try {
    const { testName, value, unit, referenceRange } = req.body;
    const result = await explainLabParameter(testName, value, unit, referenceRange);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Explanation failed' });
  }
});

// 12. Reset Demo System
app.post('/api/system/reset-demo', (_req, res) => {
  db.resetToSyntheticDemo();
  res.json({ success: true, message: 'Demo data successfully reset to synthetic baseline.' });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'LockMyHealth Core Full-Stack Server',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Setup Vite middleware in dev or serve dist in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LockMyHealth] Server running at http://0.0.0.0:${PORT} (Production: ${isProduction})`);
  });
}

startServer();
