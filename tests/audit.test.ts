import fs from 'fs';
import path from 'path';
import { db } from '../server/db.ts';
import { chatWithLockMyHealth } from '../server/ai.ts';

async function runAudit() {
  console.log('====================================================');
  console.log('       LockMyHealth COMPREHENSIVE SYSTEM AUDIT        ');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function test(description: string, fn: () => boolean) {
    try {
      const res = fn();
      if (res) {
        console.log(`[PASS] ${description}`);
        passed++;
      } else {
        console.error(`[FAIL] ${description}`);
        failed++;
      }
    } catch (err: any) {
      console.error(`[FAIL] ${description}: ${err.message}`);
      failed++;
    }
  }

  async function testAsync(description: string, fn: () => Promise<boolean>) {
    try {
      const res = await fn();
      if (res) {
        console.log(`[PASS] ${description}`);
        passed++;
      } else {
        console.error(`[FAIL] ${description}`);
        failed++;
      }
    } catch (err: any) {
      console.error(`[FAIL] ${description}: ${err.message}`);
      failed++;
    }
  }

  // 1. User Isolation & Authentication Boundaries
  const userAlphaId: string = 'patient-alpha-101';
  const userBetaId: string = 'patient-beta-202';

  test('User isolation: Initial state of separate users is clean', () => {
    const userA = db.getOrCreateUser(userAlphaId, 'alpha@example.org', 'Alpha Patient');
    const userB = db.getOrCreateUser(userBetaId, 'beta@example.org', 'Beta Patient');
    return userA.id === userAlphaId && userB.id === userBetaId && (userA.id as string) !== (userB.id as string);
  });

  // 2. Record Upload & Creation Isolation
  let alphaDocId = '';
  test('Record creation: Upload record for User Alpha', () => {
    const docA = db.addDocument(userAlphaId, {
      title: 'Alpha Echo Cardiology Report',
      category: 'imaging_scan',
      providerId: 'prov-heart',
      providerName: 'City Cardiology Center',
      documentDate: '2026-10-01',
      fileUrl: '/uploads/mock_echo.pdf',
      fileName: 'mock_echo.pdf',
      fileSize: 524288,
      fileMimeType: 'application/pdf',
      primaryCondition: 'Sinus Tachycardia',
      isVerified: true,
      notes: 'EF 60%, normal wall motion'
    });
    alphaDocId = docA.id;
    return docA.id.startsWith('doc-') && docA.userId === userAlphaId;
  });

  test('Security boundary: User Beta CANNOT view User Alpha document', () => {
    const betaDocAccess = db.getDocument(userBetaId, alphaDocId);
    return betaDocAccess === null;
  });

  test('Security boundary: User Beta CANNOT delete User Alpha document', () => {
    const attemptedDelete = db.deleteDocument(userBetaId, alphaDocId);
    const alphaStillHasDoc = db.getDocument(userAlphaId, alphaDocId);
    return attemptedDelete === false && alphaStillHasDoc !== null;
  });

  // 3. Persistence After Refresh Simulation
  test('Persistence: Re-reading from disk file preserves newly created record', () => {
    const dataFilePath = path.resolve(process.cwd(), 'data/LockMyHealth_data.json');
    if (!fs.existsSync(dataFilePath)) return false;
    const raw = fs.readFileSync(dataFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const alphaDocsInJson = parsed.documents[userAlphaId];
    return Array.isArray(alphaDocsInJson) && alphaDocsInJson.some((d: any) => d.id === alphaDocId);
  });

  // 4. Appointments & Reminders (Create, Reschedule, Checklist, Status)
  let testAptId = '';
  test('Reminders: Create appointment with preparation checklist', () => {
    const apt = db.addAppointment(userAlphaId, {
      title: 'Quarterly Cardiology Stress Test',
      providerId: 'prov-heart',
      providerName: 'City Cardiology Center',
      date: '2026-11-15',
      time: '08:30',
      timeZone: 'America/Los_Angeles',
      type: 'in_person',
      status: 'upcoming',
      reason: 'Evaluate cardiovascular response to exercise',
      userConfirmed: true,
      checklist: [
        { id: 'c1', text: 'Wear comfortable running shoes', checked: false },
        { id: 'c2', text: 'Do not consume caffeine 12 hours prior', checked: true }
      ],
      reminderEnabled: true
    });
    testAptId = apt.id;
    return apt.status === 'upcoming' && apt.checklist.length === 2;
  });

  test('Reminders: Reschedule appointment updates date and status', () => {
    const updated = db.updateAppointment(userAlphaId, testAptId, {
      date: '2026-11-20',
      time: '09:00',
      status: 'rescheduled'
    });
    return updated?.status === 'rescheduled' && updated.date === '2026-11-20' && updated.time === '09:00';
  });

  test('Reminders: Mark appointment completed', () => {
    const completed = db.updateAppointment(userAlphaId, testAptId, {
      status: 'completed'
    });
    return completed?.status === 'completed';
  });

  // 5. Medication Reconciliation
  test('Medication Reconciliation: Detects dose conflict when multiple active doses exist', () => {
    db.addMedication(userAlphaId, {
      name: 'Amlodipine',
      dose: '5 mg',
      frequency: 'Once daily',
      instructions: 'Take in morning',
      providerId: 'prov-1',
      providerName: 'Clinic One',
      status: 'active_confirmed'
    });
    db.addMedication(userAlphaId, {
      name: 'Amlodipine',
      dose: '10 mg',
      frequency: 'Once daily',
      instructions: 'Take in morning',
      providerId: 'prov-2',
      providerName: 'Clinic Two',
      status: 'active_confirmed'
    });

    const conflicts = db.getMedicationConflicts(userAlphaId);
    return conflicts.some(c => c.medicationName.toLowerCase().includes('amlodipine') && c.type === 'dose_mismatch');
  });

  // 6. Sharing Tokens: Scoping, Expiry, and Revocation
  let activeToken = '';
  let grantId = '';
  test('Share Grants: Generates unguessable token with scoped categories', () => {
    const grant = db.createShareGrant(userAlphaId, {
      label: 'Cardiology Referral',
      recipientName: 'Dr. Evans',
      recipientRole: 'Cardiologist',
      allowedCategories: ['imaging_scan'],
      expiryHours: 48
    });
    activeToken = grant.token;
    grantId = grant.id;
    return grant.token.startsWith('mt_share_') && grant.token.length >= 24;
  });

  test('Share Grants: Active token returns scoped records only', () => {
    const res = db.getSharedDataByToken(activeToken, { ip: '127.0.0.1', userAgent: 'AuditRunner' });
    if (res.status !== 'active') return false;
    // Check that imaging_scan is returned and non-permitted categories are excluded
    const hasEcho = res.documents.some(d => d.title.includes('Echo'));
    const onlyPermitted = res.documents.every(d => d.category === 'imaging_scan');
    return hasEcho && onlyPermitted;
  });

  test('Share Grants: Access event logged in audit trail', () => {
    const auditLogs = db.getShareAuditLogs(userAlphaId);
    return auditLogs.some(log => log.token === activeToken);
  });

  test('Share Grants: Immediate revocation rejects access with revoked status', () => {
    const revokedOk = db.revokeShareGrant(userAlphaId, grantId);
    const res = db.getSharedDataByToken(activeToken, { ip: '127.0.0.1', userAgent: 'AuditRunner' });
    return revokedOk && res.status === 'revoked';
  });

  test('Share Grants: Non-existent token returns not_found status', () => {
    const res = db.getSharedDataByToken('mt_share_non_existent_fake_token', { ip: '127.0.0.1', userAgent: 'AuditRunner' });
    return res.status === 'not_found';
  });

  test('Share Grants: Expired share token returns expired status', () => {
    // Create an expired grant
    const expiredGrant = db.createShareGrant(userAlphaId, {
      label: 'Expired Consultation Share',
      recipientName: 'Dr. Past',
      recipientRole: 'Doctor',
      allowedCategories: ['prescription'],
      expiryHours: -1 // Expired 1 hour ago
    });
    const res = db.getSharedDataByToken(expiredGrant.token, { ip: '127.0.0.1', userAgent: 'AuditRunner' });
    return res.status === 'expired' && !!res.expiredAt;
  });

  // 7. Emergency Health Card Customization & Persistence
  test('Emergency Card: Update blood group and contact details', () => {
    const updated = db.updateEmergencyCard(userAlphaId, {
      bloodGroup: 'AB+',
      confirmedAllergies: ['SULFA DRUGS (Urticaria)'],
      emergencyContact: {
        name: 'Maria Alpha',
        relationship: 'Spouse',
        phone: '+1 (555) 777-8888'
      }
    });
    return updated.bloodGroup === 'AB+' && updated.confirmedAllergies.includes('SULFA DRUGS (Urticaria)');
  });

  // 8. Handover Summary Synthesis
  test('Handover Summary: Structured briefing includes conditions, allergies, and medications', () => {
    const summary = db.generateHandoverSummary(userAlphaId);
    return summary.patientName.includes('Alpha') &&
      summary.allergies.some(a => a.allergen.includes('SULFA')) &&
      summary.activeMedications.length > 0 &&
      summary.unresolvedConflicts.length > 0;
  });

  // 9. Chatbot Source References & Safety Boundaries
  await testAsync('Chatbot: Grounded reply returns referenced source documents', async () => {
    const reply = await chatWithLockMyHealth('demo-patient-001', 'What did my last prescription say?');
    return reply.success === true &&
      Array.isArray(reply.referencedDocuments) &&
      reply.referencedDocuments.length > 0 &&
      typeof reply.referencedDocuments[0].title === 'string' &&
      typeof reply.referencedDocuments[0].date === 'string';
  });

  await testAsync('Chatbot: Emergency query triggers emergency warning without diagnosing', async () => {
    const reply = await chatWithLockMyHealth('demo-patient-001', 'I have sudden severe chest pain and cannot catch my breath');
    return reply.success === true &&
      reply.text.toLowerCase().includes('emergency') &&
      reply.text.toLowerCase().includes('911');
  });

  // 10. Clean-up user alpha records
  test('Data clean-up: Delete document and ensure associated state cleaned up', () => {
    const ok = db.deleteDocument(userAlphaId, alphaDocId);
    const remaining = db.getDocuments(userAlphaId);
    return ok && remaining.length === 0;
  });

  console.log('====================================================');
  console.log(`Audit Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit();
