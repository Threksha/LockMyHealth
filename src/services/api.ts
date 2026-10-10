import {
  UserProfile,
  Provider,
  MedicalDocument,
  TimelineEvent,
  MedicationRecord,
  MedicationConflict,
  LabTestRecord,
  Appointment,
  ShareGrant,
  EmergencyHealthCard,
  HandoverSummary,
  ConsultationSession,
  DoctorConsultationRecord
} from '../types/medical.ts';

const TOKEN_KEY = 'lockmyhealth_token';

export function getStoredToken(): string {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('LockMyHealth_token') || '';
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('LockMyHealth_token');
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getStoredToken()}`
  };
}

export async function loginUser(params: {
  email?: string;
  password?: string;
  isDemo?: boolean;
  role?: 'patient' | 'doctor';
  doctorId?: string;
  name?: string;
  specialty?: string;
  hospitalOrFacility?: string;
}): Promise<{ token: string; user: UserProfile; isDemo: boolean }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      isDemoMode: params.isDemo,
      role: params.role || 'patient',
      doctorId: params.doctorId,
      name: params.name,
      specialty: params.specialty,
      hospitalOrFacility: params.hospitalOrFacility
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  setStoredToken(data.token);
  return data;
}

export async function registerUser(params: {
  email: string;
  password: string;
  name: string;
  role: 'patient' | 'doctor';
  specialty?: string;
  hospitalOrFacility?: string;
}): Promise<{ token: string; user: UserProfile; isDemo: boolean }> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not create your account.');
  setStoredToken(data.token);
  return data;
}

export async function getCurrentUser(): Promise<{ user: UserProfile; isDemo: boolean }> {
  const res = await fetch('/api/auth/me', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function fetchProviders(): Promise<Provider[]> {
  const res = await fetch('/api/providers', { headers: authHeaders() });
  return res.json();
}

export async function createProvider(provider: Omit<Provider, 'id'>): Promise<Provider> {
  const res = await fetch('/api/providers', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(provider)
  });
  return res.json();
}

export async function fetchDocuments(): Promise<MedicalDocument[]> {
  const res = await fetch('/api/documents', { headers: authHeaders() });
  return res.json();
}

export async function fetchDocumentById(id: string): Promise<MedicalDocument> {
  const res = await fetch(`/api/documents/${id}`, { headers: authHeaders() });
  return res.json();
}

export async function uploadDocumentFile(file: File): Promise<{ fileUrl: string; fileName: string; fileSize: number; fileMimeType: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/documents/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getStoredToken()}` },
    body: formData
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export async function createDocument(doc: Omit<MedicalDocument, 'id' | 'userId' | 'uploadedAt'>): Promise<MedicalDocument> {
  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(doc)
  });
  return res.json();
}

export async function updateDocument(id: string, updates: Partial<MedicalDocument>): Promise<MedicalDocument> {
  const res = await fetch(`/api/documents/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  await fetch(`/api/documents/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
}

export async function fetchTimeline(): Promise<TimelineEvent[]> {
  const res = await fetch('/api/timeline', { headers: authHeaders() });
  return res.json();
}

export async function createTimelineEvent(evt: Omit<TimelineEvent, 'id' | 'userId'>): Promise<TimelineEvent> {
  const res = await fetch('/api/timeline', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(evt)
  });
  return res.json();
}

export async function fetchMedications(): Promise<MedicationRecord[]> {
  const res = await fetch('/api/medications', { headers: authHeaders() });
  return res.json();
}

export async function createMedication(med: Omit<MedicationRecord, 'id' | 'userId'>): Promise<MedicationRecord> {
  const res = await fetch('/api/medications', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(med)
  });
  return res.json();
}

export async function updateMedication(id: string, updates: Partial<MedicationRecord>): Promise<MedicationRecord> {
  const res = await fetch(`/api/medications/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function deleteMedication(id: string): Promise<void> {
  await fetch(`/api/medications/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
}

export async function fetchMedicationConflicts(): Promise<MedicationConflict[]> {
  const res = await fetch('/api/medications/reconciliation', { headers: authHeaders() });
  return res.json();
}

export async function fetchLabResults(): Promise<LabTestRecord[]> {
  const res = await fetch('/api/labs', { headers: authHeaders() });
  return res.json();
}

export async function createLabResult(lab: Omit<LabTestRecord, 'id' | 'userId'>): Promise<LabTestRecord> {
  const res = await fetch('/api/labs', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(lab)
  });
  return res.json();
}

export async function deleteLabResult(id: string): Promise<void> {
  await fetch(`/api/labs/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const res = await fetch('/api/appointments', { headers: authHeaders() });
  return res.json();
}

export async function createAppointment(apt: Omit<Appointment, 'id' | 'userId'>): Promise<Appointment> {
  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(apt)
  });
  return res.json();
}

export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
  const res = await fetch(`/api/appointments/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function deleteAppointment(id: string): Promise<void> {
  await fetch(`/api/appointments/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
}

export async function fetchShareGrants(): Promise<ShareGrant[]> {
  const res = await fetch('/api/share/grants', { headers: authHeaders() });
  return res.json();
}

export async function createShareGrant(params: {
  label: string;
  recipientName: string;
  recipientRole: string;
  allowedCategories: string[];
  expiryHours: number;
  specificDocumentIds?: string[];
}): Promise<ShareGrant> {
  const res = await fetch('/api/share/create', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params)
  });
  return res.json();
}

export async function revokeShareGrant(id: string): Promise<void> {
  await fetch(`/api/share/revoke/${id}`, {
    method: 'POST',
    headers: authHeaders()
  });
}

// Patient Doctor-Sharing Consultation Sessions
export async function createConsultationSession(params: {
  allowedCategories?: string[];
  sharedRecordIds?: string[];
  expiryMinutes?: number;
}): Promise<ConsultationSession> {
  const res = await fetch('/api/consultation/create', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to create sharing session');
  return res.json();
}

export async function fetchActivePatientSession(): Promise<{ session: ConsultationSession | null }> {
  const res = await fetch('/api/consultation/patient-active', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch active session');
  return res.json();
}

export async function fetchPatientSharingHistory(): Promise<ConsultationSession[]> {
  const res = await fetch('/api/consultation/patient-history', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch sharing history');
  return res.json();
}

export async function endPatientConsultation(sessionId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/consultation/patient-end/${sessionId}`, {
    method: 'POST',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to end session');
  return res.json();
}

// Doctor Consultation API
export async function validateDoctorSession(codeOrToken: string): Promise<any> {
  const res = await fetch('/api/consultation/doctor-validate', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ codeOrToken })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to validate consultation code');
  }
  return data;
}

export async function fetchDoctorActiveSession(): Promise<any> {
  const res = await fetch('/api/consultation/doctor-active', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch doctor session');
  return res.json();
}

export async function endDoctorConsultation(): Promise<{ success: boolean }> {
  const res = await fetch('/api/consultation/doctor-end', {
    method: 'POST',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to end consultation');
  return res.json();
}

export async function fetchDoctorPreviousPatients(): Promise<DoctorConsultationRecord[]> {
  const res = await fetch('/api/consultation/doctor-previous-patients', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch previous patients');
  return res.json();
}

export async function fetchPublicSharedData(token: string): Promise<any> {
  const res = await fetch(`/api/share/public/${token}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Unable to access shared record');
  }
  return res.json();
}

export async function fetchEmergencyCard(): Promise<EmergencyHealthCard> {
  const res = await fetch('/api/emergency-card', { headers: authHeaders() });
  return res.json();
}

export async function updateEmergencyCard(card: Partial<EmergencyHealthCard>): Promise<EmergencyHealthCard> {
  const res = await fetch('/api/emergency-card', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(card)
  });
  return res.json();
}

export async function fetchHandoverSummary(): Promise<HandoverSummary> {
  const res = await fetch('/api/handover-summary', { headers: authHeaders() });
  return res.json();
}


export async function sendChatMessage(message: string, history: Array<{ role: 'user' | 'assistant'; text: string }>): Promise<{
  success: boolean;
  text: string;
  referencedDocuments?: Array<{ id: string; title: string; date: string; provider: string }>;
}> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message, history })
  });
  return res.json();
}

export async function explainLabAI(testName: string, value: string, unit: string, referenceRange: string): Promise<any> {
  const res = await fetch('/api/ai/explain-lab', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ testName, value, unit, referenceRange })
  });
  return res.json();
}

export async function resetDemoData(): Promise<void> {
  await fetch('/api/system/reset-demo', {
    method: 'POST',
    headers: authHeaders()
  });
}
