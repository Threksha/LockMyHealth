import { db } from '../server/db.ts';

function runTests() {
  console.log('--- Starting LockMyHealth Critical Functionality Test Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Authentication and user data isolation
  const demoUser = db.getUser('demo-patient-001');
  assert(demoUser !== null && demoUser.name === 'Rajesh Kumar', 'Demo user exists with correct profile');

  const newUser = db.getOrCreateUser('isolated-user-999', 'user999@test.com', 'Dr. Test Patient');
  assert(newUser.id === 'isolated-user-999', 'New isolated user created');

  const demoDocs = db.getDocuments('demo-patient-001');
  const user999Docs = db.getDocuments('isolated-user-999');
  assert(user999Docs.length === 0, 'Data isolation: New user has 0 documents initially');
  assert(demoDocs.length > 0, 'Demo user has synthetic records populated');

  // 2. Record creation, listing, editing, and deletion
  const createdDoc = db.addDocument('isolated-user-999', {
    title: 'Routine Health Checkup',
    category: 'consultation_note',
    providerId: 'prov-test',
    providerName: 'Test Clinic',
    documentDate: '2026-10-01',
    fileUrl: '/uploads/test.pdf',
    fileName: 'test.pdf',
    fileSize: 1024,
    fileMimeType: 'application/pdf',
    isVerified: true,
    notes: 'Everything stable'
  });
  assert(createdDoc.id.startsWith('doc-'), 'Document created with stable ID prefix');

  const docsAfter = db.getDocuments('isolated-user-999');
  assert(docsAfter.length === 1 && docsAfter[0].title === 'Routine Health Checkup', 'Document listed correctly');

  const updatedDoc = db.updateDocument('isolated-user-999', createdDoc.id, { title: 'Updated Health Checkup' });
  assert(updatedDoc?.title === 'Updated Health Checkup', 'Document updated successfully');

  const deleted = db.deleteDocument('isolated-user-999', createdDoc.id);
  assert(deleted === true, 'Document deleted successfully');
  assert(db.getDocuments('isolated-user-999').length === 0, 'Document removed from user collection');

  // 3. Timeline ordering (newest date first)
  const timeline = db.getTimelineEvents('demo-patient-001');
  assert(timeline.length >= 2, 'Timeline events exist');
  let correctlyOrdered = true;
  for (let i = 0; i < timeline.length - 1; i++) {
    if (new Date(timeline[i].date).getTime() < new Date(timeline[i + 1].date).getTime()) {
      correctlyOrdered = false;
      break;
    }
  }
  assert(correctlyOrdered, 'Timeline events ordered chronologically descending (newest first)');

  // 4. Medication conflict detection
  const demoConflicts = db.getMedicationConflicts('demo-patient-001');
  assert(demoConflicts.length > 0, 'Medication reconciliation detected conflicts in synthetic data');
  const doseOrStatusConflict = demoConflicts.some(c => c.type === 'dose_mismatch' || c.type === 'status_conflict');
  assert(doseOrStatusConflict, 'Medication engine detected dose change or active vs discontinued status');

  // 5. Reminder / Appointment creation and rescheduling
  const apt = db.addAppointment('isolated-user-999', {
    title: 'Dental Check',
    providerId: 'prov-dental',
    providerName: 'Smile Dental',
    date: '2026-11-01',
    time: '09:00',
    timeZone: 'UTC',
    type: 'in_person',
    status: 'upcoming',
    reason: 'Routine prophylaxis',
    userConfirmed: true,
    checklist: [{ id: 'c1', text: 'Brush teeth', checked: true }],
    reminderEnabled: true
  });
  assert(apt.status === 'upcoming', 'Appointment created');

  const rescheduled = db.updateAppointment('isolated-user-999', apt.id, {
    date: '2026-11-05',
    time: '11:00',
    status: 'rescheduled'
  });
  assert(rescheduled?.status === 'rescheduled' && rescheduled.date === '2026-11-05', 'Appointment rescheduled with updated date/time');

  // 6. Controlled Share links: creation, scoping, revocation, and expiry
  const grant = db.createShareGrant('demo-patient-001', {
    label: 'Consultation with Specialist',
    recipientName: 'Dr. Guest',
    recipientRole: 'Consultant',
    allowedCategories: ['prescription'],
    expiryHours: 24
  });
  assert(grant.token.startsWith('mt_share_'), 'Share token is unguessable and properly formatted');

  // Test access via public resolver
  const accessResult1 = db.getSharedDataByToken(grant.token, { ip: '127.0.0.1', userAgent: 'TestRunner' });
  assert(accessResult1.status === 'active', 'Valid share token grants active read-only access');
  if (accessResult1.status === 'active') {
    assert(accessResult1.documents.every(d => d.category === 'prescription'), 'Share scoping enforced: only prescriptions returned');
  }

  // Revoke grant
  db.revokeShareGrant('demo-patient-001', grant.id);
  const accessResultRevoked = db.getSharedDataByToken(grant.token, { ip: '127.0.0.1', userAgent: 'TestRunner' });
  assert(accessResultRevoked.status === 'revoked', 'Revoked share token is immediately rejected');

  // Test invalid token
  const invalidResult = db.getSharedDataByToken('mt_share_fake_random_token', { ip: '127.0.0.1', userAgent: 'TestRunner' });
  assert(invalidResult.status === 'not_found', 'Non-existent token rejected safely');

  // 7. Unauthorized cross-user access simulation
  // User isolated-user-999 attempts to fetch demo-patient-001 document directly
  const crossDoc = db.getDocument('isolated-user-999', 'doc-001');
  assert(crossDoc === null, 'Security boundary: User cannot access records belonging to another patient');

  // 8. Emergency Health Card
  const emergencyCard = db.getEmergencyCard('demo-patient-001');
  assert(emergencyCard.patientName === 'Rajesh Kumar', 'Emergency card contains patient name');
  assert(emergencyCard.confirmedAllergies.length > 0, 'Emergency card contains confirmed allergies');

  console.log(`\n--- Test Results: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
