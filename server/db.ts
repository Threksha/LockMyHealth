import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
  ShareAuditLog,
  EmergencyHealthCard,
  HandoverSummary,
  ConsultationSession,
  DoctorConsultationRecord,
  SharedRecordSummary,
  DocumentCategory
} from '../src/types/medical.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'lockmyhealth_data.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface AppDatabase {
  users: Record<string, UserProfile>;
  providers: Record<string, Provider[]>; // keyed by userId
  documents: Record<string, MedicalDocument[]>; // keyed by userId
  timelineEvents: Record<string, TimelineEvent[]>; // keyed by userId
  medications: Record<string, MedicationRecord[]>; // keyed by userId
  labResults: Record<string, LabTestRecord[]>; // keyed by userId
  appointments: Record<string, Appointment[]>; // keyed by userId
  shareGrants: Record<string, ShareGrant[]>; // keyed by userId
  shareAuditLogs: ShareAuditLog[];
  emergencyCards: Record<string, EmergencyHealthCard>; // keyed by userId
  consultationSessions: Record<string, ConsultationSession[]>; // keyed by patientId
  doctorConsultations: Record<string, DoctorConsultationRecord[]>; // keyed by doctorId
}

// Initial synthetic dataset for demo mode
function createSyntheticDemoData(): AppDatabase {
  const demoUserId = 'demo-patient-001';
  const demoDoctorId = 'demo-doctor-001';
  const demoDoctor2Id = 'demo-doctor-002';

  const demoUser: UserProfile = {
    id: demoUserId,
    email: 'rajesh.kumar@example-health.org',
    name: 'Rajesh Kumar',
    role: 'patient',
    age: 58,
    gender: 'Male',
    bloodGroup: 'B+',
    isDemo: true,
    emergencyContact: {
      name: 'Priya Kumar (Daughter)',
      relationship: 'Daughter',
      phone: '+1 (555) 349-8291'
    }
  };

  const demoDoctor1: UserProfile = {
    id: demoDoctorId,
    email: 'dr.sharma@sunriseclinic.org',
    name: 'Dr. Ananya Sharma',
    role: 'doctor',
    isDemo: true,
    specialty: 'Internal & General Medicine',
    licenseNumber: 'MD-83921-IM',
    hospitalOrFacility: 'Sunrise Family Clinic'
  };

  const demoDoctor2: UserProfile = {
    id: demoDoctor2Id,
    email: 'dr.rao@apexendocrine.org',
    name: 'Dr. Kavya Rao',
    role: 'doctor',
    isDemo: true,
    specialty: 'Endocrinology & Diabetes',
    licenseNumber: 'MD-48209-END',
    hospitalOrFacility: 'Apex Endocrine & Metabolic Care'
  };

  const providers: Provider[] = [
    {
      id: 'prov-1',
      name: 'Dr. Ananya Sharma',
      role: 'Consultant Physician',
      specialty: 'Internal & General Medicine',
      facility: 'Sunrise Family Clinic, Suite 402',
      phone: '+1 (555) 234-5678',
      email: 'dr.sharma@sunriseclinic.org',
      address: '742 Evergreen Medical Park, Sector 4',
      color: '#0d9488'
    },
    {
      id: 'prov-2',
      name: 'Dr. Kavya Rao',
      role: 'Chief Endocrinologist',
      specialty: 'Endocrinology & Diabetes',
      facility: 'Apex Endocrine & Metabolic Care',
      phone: '+1 (555) 345-6789',
      email: 'dr.rao@apexendocrine.org',
      address: '12 Health Boulevard, Pavilion B',
      color: '#0284c7'
    },
    {
      id: 'prov-3',
      name: 'Greenfield Diagnostics',
      role: 'Reference Diagnostic Laboratory',
      specialty: 'Clinical Pathology & Biochemistry',
      facility: 'Greenfield Central Lab, ISO 15189',
      phone: '+1 (555) 456-7890',
      email: 'reports@greenfielddiagnostics.com',
      address: '88 Innovation Way, Diagnostic Wing',
      color: '#059669'
    },
    {
      id: 'prov-4',
      name: 'Dr. Marcus Sterling',
      role: 'Pulmonologist',
      specialty: 'Respiratory Care & Allergy',
      facility: 'Metro Chest Institute',
      phone: '+1 (555) 567-8901',
      email: 'm.sterling@metrochest.org',
      address: '500 Pulmonology Tower, 6th Floor',
      color: '#7c3aed'
    }
  ];

  const documents: MedicalDocument[] = [
    {
      id: 'doc-001',
      userId: demoUserId,
      title: 'Endocrine Review & Diabetes Prescription',
      category: 'prescription',
      providerId: 'prov-2',
      providerName: 'Dr. Kavya Rao',
      documentDate: '2026-08-14',
      uploadedAt: '2026-08-14T14:30:00Z',
      fileUrl: '/mock-files/prescription_aug_2026.pdf',
      fileName: 'Prescription_DrRao_Aug2026.pdf',
      fileSize: 420500,
      fileMimeType: 'application/pdf',
      primaryCondition: 'Type 2 Diabetes Mellitus',
      tags: ['Diabetes', 'Metformin', 'Glimepiride', 'Dr. Rao'],
      notes: 'Reviewed 3-month HbA1c (6.8%). Titrated Metformin up to 1000mg ER with evening meal.',
      isVerified: true,
      extractedData: {
        documentType: 'Outpatient Prescription',
        providerName: 'Dr. Kavya Rao (Apex Endocrine)',
        documentDate: '2026-08-14',
        diagnoses: ['Type 2 Diabetes Mellitus (E11.9)', 'Essential Hypertension (I10)'],
        medications: [
          { name: 'Metformin ER', dose: '1000 mg', route: 'Oral', frequency: 'Once daily with dinner', duration: '90 days', verified: true },
          { name: 'Glimepiride', dose: '1 mg', route: 'Oral', frequency: 'Once daily before breakfast', duration: '90 days', verified: true },
          { name: 'Telmisartan', dose: '80 mg', route: 'Oral', frequency: 'Once daily in the morning', duration: '90 days', verified: true }
        ],
        followUpRecommendations: 'Repeat HbA1c and fasting lipid panel in 3 months (November 2026).'
      },
      ocrTextPreview: 'Apex Endocrine Care - Dr. Kavya Rao, MD DM. Patient: Rajesh Kumar (58/M). Diagnosis: Type 2 Diabetes, controlled. Rx: 1. Tab Metformin ER 1000mg 1-0-0 post-dinner. 2. Tab Glimepiride 1mg 1-0-0 ac breakfast. 3. Tab Telmisartan 80mg 1-0-0 morning. Follow-up: 3 months with HbA1c.'
    },
    {
      id: 'doc-002',
      userId: demoUserId,
      title: 'Comprehensive Metabolic & Lipid Panel',
      category: 'lab_report',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics',
      documentDate: '2026-08-10',
      uploadedAt: '2026-08-10T11:00:00Z',
      fileUrl: '/mock-files/lab_report_aug_2026.pdf',
      fileName: 'Greenfield_Lipid_Metabolic_Aug2026.pdf',
      fileSize: 612000,
      fileMimeType: 'application/pdf',
      primaryCondition: 'Metabolic Evaluation',
      tags: ['HbA1c', 'Glucose', 'Lipids', 'Creatinine'],
      notes: 'Quarterly routine monitoring. HbA1c improved to 6.8%. Fasting glucose 118 mg/dL.',
      isVerified: true,
      extractedData: {
        documentType: 'Clinical Pathology Report',
        providerName: 'Greenfield Diagnostics',
        documentDate: '2026-08-10',
        labResults: [
          { testName: 'Hemoglobin A1c (HbA1c)', value: '6.8', numericValue: 6.8, unit: '%', referenceRange: '4.0 - 5.6', isAbnormal: true, verified: true },
          { testName: 'Fasting Plasma Glucose', value: '118', numericValue: 118, unit: 'mg/dL', referenceRange: '70 - 99', isAbnormal: true, verified: true },
          { testName: 'Serum Creatinine', value: '1.02', numericValue: 1.02, unit: 'mg/dL', referenceRange: '0.70 - 1.20', isAbnormal: false, verified: true },
          { testName: 'eGFR', value: '88', numericValue: 88, unit: 'mL/min/1.73m²', referenceRange: '> 60', isAbnormal: false, verified: true },
          { testName: 'Total Cholesterol', value: '174', numericValue: 174, unit: 'mg/dL', referenceRange: '< 200', isAbnormal: false, verified: true },
          { testName: 'LDL Cholesterol', value: '94', numericValue: 94, unit: 'mg/dL', referenceRange: '< 100', isAbnormal: false, verified: true },
          { testName: 'Triglycerides', value: '148', numericValue: 148, unit: 'mg/dL', referenceRange: '< 150', isAbnormal: false, verified: true }
        ]
      },
      ocrTextPreview: 'Greenfield Diagnostics. Patient: Rajesh Kumar, 58/M. HbA1c: 6.8% (Target < 7.0 for adult T2DM). Fasting Blood Sugar: 118 mg/dL. Creatinine: 1.02 mg/dL. Total Chol: 174 mg/dL. LDL: 94 mg/dL. Triglycerides: 148 mg/dL.'
    },
    {
      id: 'doc-003',
      userId: demoUserId,
      title: 'General Physician Assessment & Blood Pressure Log',
      category: 'consultation_note',
      providerId: 'prov-1',
      providerName: 'Dr. Ananya Sharma',
      documentDate: '2026-05-20',
      uploadedAt: '2026-05-20T16:15:00Z',
      fileUrl: '/mock-files/dr_sharma_consult_may2026.pdf',
      fileName: 'DrSharma_Consultation_May2026.pdf',
      fileSize: 318000,
      fileMimeType: 'application/pdf',
      primaryCondition: 'Hypertension Monitoring',
      tags: ['Blood Pressure', 'Telmisartan', 'Sunrise Clinic'],
      notes: 'Blood pressure in clinic: 126/82 mmHg. Well controlled on Telmisartan 80mg. Advised regular home BP logs.',
      isVerified: true,
      extractedData: {
        documentType: 'Clinical Progress Note',
        providerName: 'Dr. Ananya Sharma',
        documentDate: '2026-05-20',
        diagnoses: ['Essential Hypertension (controlled)', 'Mild intermittent asthma'],
        medications: [
          { name: 'Telmisartan', dose: '80 mg', route: 'Oral', frequency: 'Once daily morning', duration: 'Refill 180 days', verified: true },
          { name: 'Atorvastatin', dose: '20 mg', route: 'Oral', frequency: 'Once daily bedtime', duration: 'Refill 180 days', verified: true }
        ],
        followUpRecommendations: 'Review in 6 months or if home BP exceeds 135/85 mmHg.'
      },
      ocrTextPreview: 'Sunrise Family Clinic - Dr. Ananya Sharma. Pt: Rajesh Kumar. Vitals: BP 126/82 mmHg, HR 72 bpm, SpO2 98%. Review: Hypertension well managed. Continue Telmisartan 80mg and Atorvastatin 20mg. Allergy alert noted: Penicillin (severe urticaria/rash).'
    },
    {
      id: 'doc-004',
      userId: demoUserId,
      title: 'Pulmonary Function & Asthma Action Plan',
      category: 'consultation_note',
      providerId: 'prov-4',
      providerName: 'Dr. Marcus Sterling',
      documentDate: '2026-03-12',
      uploadedAt: '2026-03-12T10:00:00Z',
      fileUrl: '/mock-files/asthma_plan_mar2026.pdf',
      fileName: 'MetroChest_AsthmaPlan_Mar2026.pdf',
      fileSize: 495000,
      fileMimeType: 'application/pdf',
      primaryCondition: 'Bronchial Asthma',
      tags: ['Asthma', 'Inhaler', 'Spirometry'],
      notes: 'Spirometry demonstrated FEV1/FVC 78% (improved from 68% in 2025). Mild seasonal bronchospasm.',
      isVerified: true,
      extractedData: {
        documentType: 'Specialist Consultation Note',
        providerName: 'Dr. Marcus Sterling (Metro Chest Institute)',
        documentDate: '2026-03-12',
        diagnoses: ['Moderate Persistent Bronchial Asthma (J45.40)'],
        medications: [
          { name: 'Budesonide / Formoterol Inhaler', dose: '160/4.5 mcg', route: 'Inhaled', frequency: '2 puffs twice daily + PRN relief', duration: 'Ongoing', verified: true }
        ],
        allergies: ['Penicillin (Anaphylactoid rash)', 'Aspirin/NSAIDs (Bronchospasm trigger)'],
        followUpRecommendations: 'Peak flow diary for 2 weeks during pollen season. Review in 1 year.'
      },
      ocrTextPreview: 'Metro Chest Institute. Dr. Marcus Sterling. Patient: Rajesh Kumar. FEV1 84% predicted. Asthma Action Plan updated: Green zone: Budesonide/Formoterol 160/4.5 2 puffs BID. Caution: Avoid NSAIDs (aspirin sensitivity reported).'
    },
    {
      id: 'doc-005',
      userId: demoUserId,
      title: 'Previous Care Prescription — Telmisartan 40mg (Historical)',
      category: 'prescription',
      providerId: 'prov-1',
      providerName: 'Sunrise Clinic (Dr. Ananya Sharma)',
      documentDate: '2025-10-15',
      uploadedAt: '2025-10-15T09:00:00Z',
      fileUrl: '/mock-files/prescription_oct_2025.pdf',
      fileName: 'Old_Prescription_Sunrise_Oct2025.pdf',
      fileSize: 289000,
      fileMimeType: 'application/pdf',
      primaryCondition: 'Hypertension Initiation',
      tags: ['Telmisartan', 'Historical', 'Old Prescription'],
      notes: 'Older prescription starting Telmisartan at lower dose of 40mg. Superseded by 80mg in May 2026.',
      isVerified: true,
      extractedData: {
        documentType: 'Historical Prescription',
        providerName: 'Dr. Ananya Sharma',
        documentDate: '2025-10-15',
        medications: [
          { name: 'Telmisartan', dose: '40 mg', route: 'Oral', frequency: 'Once daily morning', duration: '90 days', verified: true },
          { name: 'Metformin', dose: '500 mg', route: 'Oral', frequency: 'Twice daily with meals', duration: '90 days', verified: true }
        ]
      },
      ocrTextPreview: 'Sunrise Clinic. Rajesh Kumar. Rx: Telmisartan 40mg once daily. Metformin 500mg twice daily with meals.'
    }
  ];

  const timelineEvents: TimelineEvent[] = [
    {
      id: 'evt-001',
      userId: demoUserId,
      date: '2026-08-14',
      type: 'consultation',
      title: 'Endocrinology Consultation & Medication Titration',
      description: 'Dr. Kavya Rao evaluated glycemic control. HbA1c improved to 6.8%. Titrated Metformin ER to 1000mg. Maintained Glimepiride 1mg.',
      providerId: 'prov-2',
      providerName: 'Dr. Kavya Rao',
      documentId: 'doc-001',
      condition: 'Type 2 Diabetes Mellitus',
      sourceType: 'extracted'
    },
    {
      id: 'evt-002',
      userId: demoUserId,
      date: '2026-08-10',
      type: 'lab_result',
      title: 'Greenfield Quarterly Pathology Results',
      description: 'HbA1c: 6.8% (Target < 7.0%). Fasting Blood Glucose: 118 mg/dL. Normal renal indices (Creatinine 1.02 mg/dL, eGFR 88). Lipid goals achieved.',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics',
      documentId: 'doc-002',
      condition: 'Metabolic & Renal',
      sourceType: 'extracted'
    },
    {
      id: 'evt-003',
      userId: demoUserId,
      date: '2026-05-20',
      type: 'consultation',
      title: 'Cardiovascular & Blood Pressure Follow-up',
      description: 'Clinic BP checked at 126/82 mmHg. Telmisartan 80mg confirmed effective. Penicillin allergy confirmed and highlighted.',
      providerId: 'prov-1',
      providerName: 'Dr. Ananya Sharma',
      documentId: 'doc-003',
      condition: 'Essential Hypertension',
      sourceType: 'extracted'
    },
    {
      id: 'evt-004',
      userId: demoUserId,
      date: '2026-03-12',
      type: 'consultation',
      title: 'Pulmonary Assessment & Spirometry',
      description: 'FEV1/FVC improved to 78%. Maintained maintenance Budesonide/Formoterol inhaler. Noted NSAID asthma trigger precaution.',
      providerId: 'prov-4',
      providerName: 'Dr. Marcus Sterling',
      documentId: 'doc-004',
      condition: 'Bronchial Asthma',
      sourceType: 'extracted'
    },
    {
      id: 'evt-005',
      userId: demoUserId,
      date: '2025-10-15',
      type: 'prescription',
      title: 'Initial Antihypertensive & Metformin Therapy',
      description: 'Historical baseline: Telmisartan started at 40mg, Metformin 500mg BID. Superseded by newer regimen.',
      providerId: 'prov-1',
      providerName: 'Dr. Ananya Sharma',
      documentId: 'doc-005',
      condition: 'Hypertension & Diabetes',
      sourceType: 'extracted'
    }
  ];

  const medications: MedicationRecord[] = [
    {
      id: 'med-001',
      userId: demoUserId,
      name: 'Metformin ER',
      dose: '1000 mg',
      frequency: 'Once daily',
      instructions: 'Take with dinner to prevent GI irritation. Extended release formulation.',
      providerId: 'prov-2',
      providerName: 'Dr. Kavya Rao',
      documentId: 'doc-001',
      startDate: '2026-08-14',
      status: 'active_confirmed',
      condition: 'Type 2 Diabetes Mellitus',
      patientNotes: 'Switched from 500mg BID to 1000mg ER with evening meal.',
      lastReviewedDate: '2026-08-14'
    },
    {
      id: 'med-002',
      userId: demoUserId,
      name: 'Glimepiride',
      dose: '1 mg',
      frequency: 'Once daily',
      instructions: 'Take 15-30 minutes before breakfast. Monitor for signs of hypoglycemia.',
      providerId: 'prov-2',
      providerName: 'Dr. Kavya Rao',
      documentId: 'doc-001',
      startDate: '2026-08-14',
      status: 'active_confirmed',
      condition: 'Type 2 Diabetes Mellitus',
      lastReviewedDate: '2026-08-14'
    },
    {
      id: 'med-003',
      userId: demoUserId,
      name: 'Telmisartan',
      dose: '80 mg',
      frequency: 'Once daily',
      instructions: 'Take in the morning with water. Up-titrated from 40mg in May 2026.',
      providerId: 'prov-1',
      providerName: 'Dr. Ananya Sharma',
      documentId: 'doc-003',
      startDate: '2026-05-20',
      status: 'active_confirmed',
      condition: 'Essential Hypertension',
      patientNotes: 'Home BP now steady between 120-128 systolic.',
      lastReviewedDate: '2026-08-14'
    },
    {
      id: 'med-004',
      userId: demoUserId,
      name: 'Atorvastatin',
      dose: '20 mg',
      frequency: 'Once daily',
      instructions: 'Take at bedtime for lipid cardioprotection.',
      providerId: 'prov-1',
      providerName: 'Dr. Ananya Sharma',
      documentId: 'doc-003',
      startDate: '2026-05-20',
      status: 'active_confirmed',
      condition: 'Dyslipidemia / Cardiovascular Protection',
      lastReviewedDate: '2026-05-20'
    },
    {
      id: 'med-005',
      userId: demoUserId,
      name: 'Budesonide / Formoterol Inhaler',
      dose: '160/4.5 mcg',
      frequency: '2 puffs twice daily',
      instructions: 'Rinse mouth with water after inhalation. Use 1 additional puff PRN for wheezing.',
      providerId: 'prov-4',
      providerName: 'Dr. Marcus Sterling',
      documentId: 'doc-004',
      startDate: '2026-03-12',
      status: 'active_confirmed',
      condition: 'Bronchial Asthma',
      lastReviewedDate: '2026-03-12'
    },
    {
      id: 'med-006',
      userId: demoUserId,
      name: 'Telmisartan (Historical Baseline)',
      dose: '40 mg',
      frequency: 'Once daily',
      instructions: 'Superseded by 80mg dose on 2026-05-20.',
      providerId: 'prov-1',
      providerName: 'Dr. Ananya Sharma',
      documentId: 'doc-005',
      startDate: '2025-10-15',
      endDate: '2026-05-20',
      status: 'historical',
      condition: 'Essential Hypertension',
      lastReviewedDate: '2026-05-20'
    },
    {
      id: 'med-007',
      userId: demoUserId,
      name: 'Metformin Standard Release (Historical Baseline)',
      dose: '500 mg',
      frequency: 'Twice daily',
      instructions: 'Discontinued. Replaced by Metformin ER 1000mg.',
      providerId: 'prov-1',
      providerName: 'Dr. Ananya Sharma',
      documentId: 'doc-005',
      startDate: '2025-10-15',
      endDate: '2026-08-14',
      status: 'discontinued_confirmed',
      condition: 'Type 2 Diabetes Mellitus',
      lastReviewedDate: '2026-08-14'
    }
  ];

  const labResults: LabTestRecord[] = [
    // HbA1c longitudinal trend
    {
      id: 'lab-001',
      userId: demoUserId,
      testName: 'Hemoglobin A1c (HbA1c)',
      category: 'Metabolic',
      value: '6.8',
      numericValue: 6.8,
      unit: '%',
      referenceRange: '4.0 - 5.6% (Target < 7.0% in T2DM)',
      minNormal: 4.0,
      maxNormal: 5.6,
      isAbnormal: true,
      testDate: '2026-08-10',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics',
      documentId: 'doc-002',
      aiExplanation: 'Reflects 3-month average blood glucose. Controlled and under target 7.0% threshold.'
    },
    {
      id: 'lab-002',
      userId: demoUserId,
      testName: 'Hemoglobin A1c (HbA1c)',
      category: 'Metabolic',
      value: '7.1',
      numericValue: 7.1,
      unit: '%',
      referenceRange: '4.0 - 5.6%',
      minNormal: 4.0,
      maxNormal: 5.6,
      isAbnormal: true,
      testDate: '2026-04-12',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics',
      notes: 'Spring assessment before Metformin dose adjustment.'
    },
    {
      id: 'lab-003',
      userId: demoUserId,
      testName: 'Hemoglobin A1c (HbA1c)',
      category: 'Metabolic',
      value: '7.6',
      numericValue: 7.6,
      unit: '%',
      referenceRange: '4.0 - 5.6%',
      minNormal: 4.0,
      maxNormal: 5.6,
      isAbnormal: true,
      testDate: '2025-12-05',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics',
      notes: 'Winter follow-up.'
    },
    {
      id: 'lab-004',
      userId: demoUserId,
      testName: 'Hemoglobin A1c (HbA1c)',
      category: 'Metabolic',
      value: '8.2',
      numericValue: 8.2,
      unit: '%',
      referenceRange: '4.0 - 5.6%',
      minNormal: 4.0,
      maxNormal: 5.6,
      isAbnormal: true,
      testDate: '2025-09-18',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics',
      notes: 'Baseline prior to comprehensive endocrinology care.'
    },

    // Fasting Blood Glucose longitudinal trend
    {
      id: 'lab-005',
      userId: demoUserId,
      testName: 'Fasting Plasma Glucose',
      category: 'Metabolic',
      value: '118',
      numericValue: 118,
      unit: 'mg/dL',
      referenceRange: '70 - 99 mg/dL',
      minNormal: 70,
      maxNormal: 99,
      isAbnormal: true,
      testDate: '2026-08-10',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics',
      documentId: 'doc-002'
    },
    {
      id: 'lab-006',
      userId: demoUserId,
      testName: 'Fasting Plasma Glucose',
      category: 'Metabolic',
      value: '128',
      numericValue: 128,
      unit: 'mg/dL',
      referenceRange: '70 - 99 mg/dL',
      minNormal: 70,
      maxNormal: 99,
      isAbnormal: true,
      testDate: '2026-04-12',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics'
    },
    {
      id: 'lab-007',
      userId: demoUserId,
      testName: 'Fasting Plasma Glucose',
      category: 'Metabolic',
      value: '142',
      numericValue: 142,
      unit: 'mg/dL',
      referenceRange: '70 - 99 mg/dL',
      minNormal: 70,
      maxNormal: 99,
      isAbnormal: true,
      testDate: '2025-12-05',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics'
    },
    {
      id: 'lab-008',
      userId: demoUserId,
      testName: 'Fasting Plasma Glucose',
      category: 'Metabolic',
      value: '165',
      numericValue: 165,
      unit: 'mg/dL',
      referenceRange: '70 - 99 mg/dL',
      minNormal: 70,
      maxNormal: 99,
      isAbnormal: true,
      testDate: '2025-09-18',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics'
    },

    // Renal Function & Lipids
    {
      id: 'lab-009',
      userId: demoUserId,
      testName: 'Serum Creatinine',
      category: 'Renal',
      value: '1.02',
      numericValue: 1.02,
      unit: 'mg/dL',
      referenceRange: '0.70 - 1.20 mg/dL',
      minNormal: 0.70,
      maxNormal: 1.20,
      isAbnormal: false,
      testDate: '2026-08-10',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics',
      documentId: 'doc-002',
      aiExplanation: 'Normal kidney filtration function. Safe for ongoing Metformin therapy.'
    },
    {
      id: 'lab-010',
      userId: demoUserId,
      testName: 'LDL Cholesterol',
      category: 'Lipid',
      value: '94',
      numericValue: 94,
      unit: 'mg/dL',
      referenceRange: '< 100 mg/dL',
      minNormal: 0,
      maxNormal: 100,
      isAbnormal: false,
      testDate: '2026-08-10',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics',
      documentId: 'doc-002',
      aiExplanation: 'Within optimal cardiovascular target for diabetic patients taking Atorvastatin.'
    },
    {
      id: 'lab-011',
      userId: demoUserId,
      testName: 'Thyroid Stimulating Hormone (TSH)',
      category: 'Endocrine',
      value: '2.4',
      numericValue: 2.4,
      unit: 'uIU/mL',
      referenceRange: '0.40 - 4.50 uIU/mL',
      minNormal: 0.40,
      maxNormal: 4.50,
      isAbnormal: false,
      testDate: '2026-04-12',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics',
      aiExplanation: 'Normal thyroid functioning.'
    }
  ];

  const appointments: Appointment[] = [
    {
      id: 'apt-001',
      userId: demoUserId,
      title: 'Quarterly Endocrine Follow-up & Diabetes Review',
      providerId: 'prov-2',
      providerName: 'Dr. Kavya Rao',
      date: '2026-11-18',
      time: '10:30',
      timeZone: 'America/Los_Angeles',
      type: 'in_person',
      status: 'upcoming',
      location: 'Apex Endocrine Care, Suite 300',
      reason: 'Evaluate glycemic response to Metformin ER 1000mg + Glimepiride. Review next HbA1c.',
      notes: 'Bring glucose log and questions regarding morning lightheadedness.',
      linkedDocumentId: 'doc-001',
      userConfirmed: true,
      reminderEnabled: true,
      checklist: [
        { id: 'chk-1', text: 'Fast for 10 hours prior to morning lab draw', checked: false },
        { id: 'chk-2', text: 'Bring home blood glucose tracking log', checked: true },
        { id: 'chk-3', text: 'Bring current medication list and inhaler canister', checked: true },
        { id: 'chk-4', text: 'Ask Dr. Rao about adjusting evening walk timing', checked: false }
      ]
    },
    {
      id: 'apt-002',
      userId: demoUserId,
      title: 'Annual Cardiovascular & Blood Pressure Check',
      providerId: 'prov-1',
      providerName: 'Dr. Ananya Sharma',
      date: '2026-11-25',
      time: '14:00',
      timeZone: 'America/Los_Angeles',
      type: 'in_person',
      status: 'upcoming',
      location: 'Sunrise Family Clinic',
      reason: 'Review 6-month blood pressure stability on Telmisartan 80mg and lipid levels.',
      userConfirmed: true,
      reminderEnabled: true,
      checklist: [
        { id: 'chk-5', text: 'Log home blood pressure twice daily for 7 days before visit', checked: true },
        { id: 'chk-6', text: 'Request 6-month prescription refills for Telmisartan & Atorvastatin', checked: false }
      ]
    },
    {
      id: 'apt-003',
      userId: demoUserId,
      title: 'Fast-Track Lab Draw (HbA1c & Fasting Glucose)',
      providerId: 'prov-3',
      providerName: 'Greenfield Diagnostics',
      date: '2026-11-12',
      time: '08:00',
      timeZone: 'America/Los_Angeles',
      type: 'lab_draw',
      status: 'upcoming',
      location: 'Greenfield Central Lab, Station 2',
      reason: 'Routine quarterly pre-consultation lab tests as recommended in Dr. Rao prescription.',
      linkedDocumentId: 'doc-001',
      extractedFromDoc: true,
      userConfirmed: true,
      reminderEnabled: true,
      checklist: [
        { id: 'chk-7', text: 'Complete overnight fast (water allowed)', checked: false },
        { id: 'chk-8', text: 'Carry insurance card and doctor requisition', checked: true }
      ]
    }
  ];

  const shareGrants: ShareGrant[] = [
    {
      id: 'grant-001',
      token: 'mt_share_drkavya_9f81ac',
      userId: demoUserId,
      label: 'Endocrinology Handover Access',
      recipientName: 'Dr. Kavya Rao (Apex Endocrine)',
      recipientRole: 'Endocrinologist',
      allowedCategories: ['prescription', 'lab_report', 'consultation_note'],
      createdAt: '2026-08-14T10:00:00Z',
      expiresAt: '2026-11-30T23:59:59Z',
      isRevoked: false,
      accessCount: 3,
      lastAccessedAt: '2026-08-14T14:45:00Z'
    }
  ];

  const emergencyCard: EmergencyHealthCard = {
    patientName: 'Rajesh Kumar',
    dob: '1968-04-15',
    bloodGroup: 'B+',
    selectedConditions: [
      'Type 2 Diabetes Mellitus',
      'Essential Hypertension',
      'Mild Intermittent Bronchial Asthma'
    ],
    confirmedAllergies: [
      'PENICILLIN (Severe rash / urticaria)',
      'ASPIRIN / NSAIDs (Asthma trigger / bronchospasm)'
    ],
    confirmedMedications: [
      { name: 'Metformin ER', dose: '1000 mg', frequency: 'Once daily with dinner' },
      { name: 'Glimepiride', dose: '1 mg', frequency: 'Once daily before breakfast' },
      { name: 'Telmisartan', dose: '80 mg', frequency: 'Once daily morning' },
      { name: 'Atorvastatin', dose: '20 mg', frequency: 'Once daily bedtime' },
      { name: 'Budesonide/Formoterol Inhaler', dose: '160/4.5 mcg', frequency: '2 puffs BID + PRN' }
    ],
    emergencyContact: {
      name: 'Priya Kumar',
      relationship: 'Daughter',
      phone: '+1 (555) 349-8291'
    },
    primaryPhysician: {
      name: 'Dr. Ananya Sharma',
      phone: '+1 (555) 234-5678',
      hospital: 'Sunrise Family Clinic'
    },
    hospitalPreference: 'Memorial City Medical Center',
    notes: 'Carry glucose tablets for hypoglycemia symptoms. Inhaler in front coat pocket.',
    lastUpdated: '2026-08-15T09:00:00Z'
  };

  const sampleEndedSession: ConsultationSession = {
    id: 'sess-init-001',
    sessionCode: 'LMH-9482',
    token: 'lmh_sess_demo_prev_token_4821',
    patientId: demoUserId,
    patientName: 'Rajesh Kumar',
    patientAge: 58,
    patientGender: 'Male',
    patientBloodGroup: 'B+',
    doctorId: demoDoctorId,
    doctorName: 'Dr. Ananya Sharma',
    doctorSpecialty: 'Internal & General Medicine',
    status: 'ended',
    createdAt: '2026-09-24T09:00:00Z',
    activatedAt: '2026-09-24T09:05:00Z',
    expiresAt: '2026-09-24T10:00:00Z',
    endedAt: '2026-09-24T09:45:00Z',
    endedBy: 'doctor',
    allowedCategories: ['prescription', 'lab_report', 'consultation_note'],
    sharedRecordIds: ['doc-001', 'doc-002', 'doc-003'],
    sharedRecordDetails: [
      { id: 'doc-001', title: 'Comprehensive Metabolic & Glycemic Prescription', category: 'prescription', documentDate: '2026-08-14', providerName: 'Dr. Kavya Rao' },
      { id: 'doc-002', title: 'Comprehensive Diagnostic Laboratory Panel', category: 'lab_report', documentDate: '2026-08-10', providerName: 'Greenfield Diagnostics' },
      { id: 'doc-003', title: 'Annual Comprehensive Clinical Review Note', category: 'consultation_note', documentDate: '2026-05-20', providerName: 'Dr. Ananya Sharma' }
    ]
  };

  const sampleDoctorConsultation: DoctorConsultationRecord = {
    id: 'dcr-001',
    sessionId: 'sess-init-001',
    patientId: demoUserId,
    patientName: 'Rajesh Kumar',
    patientAge: 58,
    patientGender: 'Male',
    consultationDate: '2026-09-24',
    recordsSharedCount: 3,
    summaryCategories: ['prescription', 'lab_report', 'consultation_note'],
    endedAt: '2026-09-24T09:45:00Z',
    endedBy: 'doctor',
    notes: 'Reviewed HbA1c trajectory and Metformin ER titration.'
  };

  return {
    users: {
      [demoUserId]: demoUser,
      [demoDoctorId]: demoDoctor1,
      [demoDoctor2Id]: demoDoctor2
    },
    providers: { [demoUserId]: providers },
    documents: { [demoUserId]: documents },
    timelineEvents: { [demoUserId]: timelineEvents },
    medications: { [demoUserId]: medications },
    labResults: { [demoUserId]: labResults },
    appointments: { [demoUserId]: appointments },
    shareGrants: { [demoUserId]: shareGrants },
    shareAuditLogs: [
      {
        id: 'log-001',
        grantId: 'grant-001',
        token: 'mt_share_drkavya_9f81ac',
        timestamp: '2026-08-14T14:45:00Z',
        clientIpMasked: '192.168.***.***',
        userAgentSnippet: 'Mozilla/5.0 Medical Station Apex'
      }
    ],
    emergencyCards: { [demoUserId]: emergencyCard },
    consultationSessions: { [demoUserId]: [sampleEndedSession] },
    doctorConsultations: { [demoDoctorId]: [sampleDoctorConsultation] }
  };
}

class DatabaseManager {
  private data: AppDatabase;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): AppDatabase {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // The supplied data.json-derived store is the single source of truth.
        // Do not merge in the legacy Rajesh/Ananya/Kavya demo dataset.
        return {
          users: parsed.users || {}, providers: parsed.providers || {}, documents: parsed.documents || {},
          timelineEvents: parsed.timelineEvents || {}, medications: parsed.medications || {},
          labResults: parsed.labResults || {}, appointments: parsed.appointments || {},
          shareGrants: parsed.shareGrants || {}, shareAuditLogs: parsed.shareAuditLogs || [],
          emergencyCards: parsed.emergencyCards || {}, consultationSessions: parsed.consultationSessions || {},
          doctorConsultations: parsed.doctorConsultations || {}
        };
      }
    } catch (err) {
      console.warn('Failed to load database file, reinitializing with synthetic data:', err);
    }
    const demo = createSyntheticDemoData();
    this.persist(demo);
    return demo;
  }

  private persist(newData?: AppDatabase) {
    try {
      const toWrite = newData || this.data;
      fs.writeFileSync(DATA_FILE, JSON.stringify(toWrite, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  // --- User Operations ---
  public getUser(userId: string): UserProfile | null {
    return this.data.users[userId] || null;
  }

  public getOrCreateUser(
    userId: string,
    email?: string,
    name?: string,
    role: 'patient' | 'doctor' = 'patient',
    specialty?: string,
    hospitalOrFacility?: string
  ): UserProfile {
    if (!this.data.users[userId]) {
      this.data.users[userId] = {
        id: userId,
        email: email || `${userId}@user.lockmyhealth.org`,
        name: name || (role === 'doctor' ? 'Dr. Medical Provider' : 'Patient User'),
        role,
        specialty,
        hospitalOrFacility,
        age: role === 'patient' ? 42 : undefined,
        gender: role === 'patient' ? 'Not specified' : undefined,
        bloodGroup: role === 'patient' ? 'O+' : undefined,
        isDemo: userId.startsWith('demo-'),
        emergencyContact: role === 'patient' ? {
          name: 'Emergency Contact Person',
          relationship: 'Family Member',
          phone: '+1 (555) 000-0000'
        } : undefined
      };
      if (role === 'patient') {
        this.data.providers[userId] = [];
        this.data.documents[userId] = [];
        this.data.timelineEvents[userId] = [];
        this.data.medications[userId] = [];
        this.data.labResults[userId] = [];
        this.data.appointments[userId] = [];
        this.data.shareGrants[userId] = [];
        this.data.consultationSessions[userId] = [];
        this.data.emergencyCards[userId] = {
          patientName: name || 'Patient User',
          dob: '1984-01-01',
          bloodGroup: 'O+',
          selectedConditions: [],
          confirmedAllergies: [],
          confirmedMedications: [],
          emergencyContact: {
            name: 'Emergency Contact Person',
            relationship: 'Family Member',
            phone: '+1 (555) 000-0000'
          },
          primaryPhysician: {
            name: 'Dr. Primary Physician',
            phone: '+1 (555) 000-0000',
            hospital: 'General Clinic'
          },
          lastUpdated: new Date().toISOString()
        };
      } else {
        this.data.doctorConsultations[userId] = [];
      }
      this.persist();
    }
    return this.data.users[userId];
  }

  // --- Providers ---
  public getProviders(userId: string): Provider[] {
    return this.data.providers[userId] || [];
  }

  public addProvider(userId: string, provider: Omit<Provider, 'id'>): Provider {
    const newProv: Provider = {
      ...provider,
      id: `prov-${crypto.randomUUID().slice(0, 8)}`
    };
    if (!this.data.providers[userId]) this.data.providers[userId] = [];
    this.data.providers[userId].push(newProv);
    this.persist();
    return newProv;
  }

  // --- Documents ---
  public getDocuments(userId: string): MedicalDocument[] {
    return this.data.documents[userId] || [];
  }

  public getDocument(userId: string, docId: string): MedicalDocument | null {
    const docs = this.data.documents[userId] || [];
    return docs.find(d => d.id === docId) || null;
  }

  public addDocument(userId: string, doc: Omit<MedicalDocument, 'id' | 'userId' | 'uploadedAt'>): MedicalDocument {
    const newDoc: MedicalDocument = {
      ...doc,
      id: `doc-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      uploadedAt: new Date().toISOString()
    };
    if (!this.data.documents[userId]) this.data.documents[userId] = [];
    this.data.documents[userId].unshift(newDoc);

    // Also auto-generate a timeline event for this document
    const eventType = doc.category === 'prescription' ? 'prescription' :
      doc.category === 'lab_report' ? 'lab_result' :
      doc.category === 'consultation_note' ? 'consultation' : 'diagnosis';

    this.addTimelineEvent(userId, {
      date: newDoc.documentDate,
      type: eventType,
      title: newDoc.title,
      description: newDoc.notes || `Uploaded ${newDoc.category} from ${newDoc.providerName}`,
      providerId: newDoc.providerId,
      providerName: newDoc.providerName,
      documentId: newDoc.id,
      condition: newDoc.primaryCondition,
      sourceType: 'extracted'
    });

    this.persist();
    return newDoc;
  }

  public updateDocument(userId: string, docId: string, updates: Partial<MedicalDocument>): MedicalDocument | null {
    const docs = this.data.documents[userId] || [];
    const idx = docs.findIndex(d => d.id === docId);
    if (idx === -1) return null;
    docs[idx] = { ...docs[idx], ...updates };
    this.persist();
    return docs[idx];
  }

  public deleteDocument(userId: string, docId: string): boolean {
    const docs = this.data.documents[userId] || [];
    const idx = docs.findIndex(d => d.id === docId);
    if (idx === -1) return false;
    docs.splice(idx, 1);

    // Remove associated timeline events & lab results if linked
    if (this.data.timelineEvents[userId]) {
      this.data.timelineEvents[userId] = this.data.timelineEvents[userId].filter(e => e.documentId !== docId);
    }
    if (this.data.labResults[userId]) {
      this.data.labResults[userId] = this.data.labResults[userId].filter(l => l.documentId !== docId);
    }
    this.persist();
    return true;
  }

  // --- Timeline Events ---
  public getTimelineEvents(userId: string): TimelineEvent[] {
    const list = this.data.timelineEvents[userId] || [];
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public addTimelineEvent(userId: string, evt: Omit<TimelineEvent, 'id' | 'userId'>): TimelineEvent {
    const newEvt: TimelineEvent = {
      ...evt,
      id: `evt-${crypto.randomUUID().slice(0, 8)}`,
      userId
    };
    if (!this.data.timelineEvents[userId]) this.data.timelineEvents[userId] = [];
    this.data.timelineEvents[userId].push(newEvt);
    this.persist();
    return newEvt;
  }

  // --- Medications & Reconciliation ---
  public getMedications(userId: string): MedicationRecord[] {
    return this.data.medications[userId] || [];
  }

  public addMedication(userId: string, med: Omit<MedicationRecord, 'id' | 'userId'>): MedicationRecord {
    const newMed: MedicationRecord = {
      ...med,
      id: `med-${crypto.randomUUID().slice(0, 8)}`,
      userId
    };
    if (!this.data.medications[userId]) this.data.medications[userId] = [];
    this.data.medications[userId].push(newMed);
    this.persist();
    return newMed;
  }

  public updateMedication(userId: string, medId: string, updates: Partial<MedicationRecord>): MedicationRecord | null {
    const list = this.data.medications[userId] || [];
    const idx = list.findIndex(m => m.id === medId);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.persist();
    return list[idx];
  }

  public deleteMedication(userId: string, medId: string): boolean {
    const list = this.data.medications[userId] || [];
    const idx = list.findIndex(m => m.id === medId);
    if (idx === -1) return false;
    list.splice(idx, 1);
    this.persist();
    return true;
  }

  public getMedicationConflicts(userId: string): MedicationConflict[] {
    const meds = this.getMedications(userId);
    const conflicts: MedicationConflict[] = [];

    // Group by normalized drug name
    const grouped: Record<string, MedicationRecord[]> = {};
    for (const m of meds) {
      const normalized = m.name.toLowerCase()
        .replace(/\(.*\)/g, '')
        .replace(/tab|tablet|cap|capsule|inj|injection|er|sr|xr/g, '')
        .trim();
      const key = normalized.split(' ')[0] || normalized; // base ingredient like metformin, telmisartan
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    }

    let conflictCounter = 1;
    for (const [key, items] of Object.entries(grouped)) {
      if (items.length > 1) {
        const activeItems = items.filter(i => i.status === 'active_confirmed' || i.status === 'needs_review');
        const doses = new Set(items.map(i => i.dose.trim().toLowerCase()));

        // Dose mismatch or duplicate active prescriptions
        if (activeItems.length > 1) {
          if (doses.size > 1) {
            conflicts.push({
              id: `cnf-${conflictCounter++}`,
              type: 'dose_mismatch',
              medicationName: items[0].name,
              records: items,
              severity: 'warning',
              description: `Multiple active records found for ${items[0].name} with differing doses (${Array.from(doses).join(' vs ')}).`,
              clinicalPrompt: `Verify with prescribing clinician which dosage is current and whether previous strengths should be officially marked as discontinued.`
            });
          } else {
            conflicts.push({
              id: `cnf-${conflictCounter++}`,
              type: 'duplicate',
              medicationName: items[0].name,
              records: items,
              severity: 'caution',
              description: `Potential duplicate active entry for ${items[0].name}. Prescribed across multiple records.`,
              clinicalPrompt: `Confirm if the patient is unintentionally filling duplicate prescriptions from different providers.`
            });
          }
        }

        // Status conflict: both active and discontinued/historical records without clear transition
        const hasActive = items.some(i => i.status === 'active_confirmed');
        const hasDiscontinued = items.some(i => i.status === 'discontinued_confirmed' || i.status === 'historical');
        if (hasActive && hasDiscontinued && !conflicts.some(c => c.medicationName === items[0].name)) {
          conflicts.push({
            id: `cnf-${conflictCounter++}`,
            type: 'status_conflict',
            medicationName: items[0].name,
            records: items,
            severity: 'info',
            description: `Documented transition between active and historical versions of ${items[0].name}.`,
            clinicalPrompt: `Ensure older records remain marked as historical so healthcare providers do not restart prior dosages.`
          });
        }
      }

      // Check for unclear instructions
      for (const m of items) {
        if (!m.instructions || m.instructions.trim().length < 5 || m.instructions.toLowerCase().includes('as directed')) {
          conflicts.push({
            id: `cnf-${conflictCounter++}`,
            type: 'unclear_instructions',
            medicationName: m.name,
            records: [m],
            severity: 'caution',
            description: `Unclear dosing instructions for ${m.name}: "${m.instructions || 'None provided'}".`,
            clinicalPrompt: `Clarify specific timing (e.g., with meals, bedtime, morning) and route with pharmacist.`
          });
        }
      }
    }

    return conflicts;
  }

  // --- Lab Results ---
  public getLabResults(userId: string): LabTestRecord[] {
    const list = this.data.labResults[userId] || [];
    return [...list].sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
  }

  public addLabResult(userId: string, lab: Omit<LabTestRecord, 'id' | 'userId'>): LabTestRecord {
    const newLab: LabTestRecord = {
      ...lab,
      id: `lab-${crypto.randomUUID().slice(0, 8)}`,
      userId
    };
    if (!this.data.labResults[userId]) this.data.labResults[userId] = [];
    this.data.labResults[userId].push(newLab);
    this.persist();
    return newLab;
  }

  public deleteLabResult(userId: string, labId: string): boolean {
    const list = this.data.labResults[userId] || [];
    const idx = list.findIndex(l => l.id === labId);
    if (idx === -1) return false;
    list.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Appointments & Reminders ---
  public getAppointments(userId: string): Appointment[] {
    const list = this.data.appointments[userId] || [];
    return [...list].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  }

  public addAppointment(userId: string, apt: Omit<Appointment, 'id' | 'userId'>): Appointment {
    const newApt: Appointment = {
      ...apt,
      id: `apt-${crypto.randomUUID().slice(0, 8)}`,
      userId
    };
    if (!this.data.appointments[userId]) this.data.appointments[userId] = [];
    this.data.appointments[userId].push(newApt);
    this.persist();
    return newApt;
  }

  public updateAppointment(userId: string, aptId: string, updates: Partial<Appointment>): Appointment | null {
    const list = this.data.appointments[userId] || [];
    const idx = list.findIndex(a => a.id === aptId);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.persist();
    return list[idx];
  }

  public deleteAppointment(userId: string, aptId: string): boolean {
    const list = this.data.appointments[userId] || [];
    const idx = list.findIndex(a => a.id === aptId);
    if (idx === -1) return false;
    list.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Share Grants & Controlled Access ---
  public getShareGrants(userId: string): ShareGrant[] {
    return this.data.shareGrants[userId] || [];
  }

  public createShareGrant(
    userId: string,
    params: {
      label: string;
      recipientName: string;
      recipientRole: string;
      allowedCategories: MedicalDocument['category'][];
      expiryHours: number;
      specificDocumentIds?: string[];
    }
  ): ShareGrant {
    const token = `mt_share_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + params.expiryHours * 60 * 60 * 1000).toISOString();

    const grant: ShareGrant = {
      id: `grant-${crypto.randomUUID().slice(0, 8)}`,
      token,
      userId,
      label: params.label,
      recipientName: params.recipientName,
      recipientRole: params.recipientRole,
      allowedCategories: params.allowedCategories,
      specificDocumentIds: params.specificDocumentIds,
      createdAt: new Date().toISOString(),
      expiresAt,
      isRevoked: false,
      accessCount: 0
    };

    if (!this.data.shareGrants[userId]) this.data.shareGrants[userId] = [];
    this.data.shareGrants[userId].unshift(grant);
    this.persist();
    return grant;
  }

  public revokeShareGrant(userId: string, grantId: string): boolean {
    const list = this.data.shareGrants[userId] || [];
    const grant = list.find(g => g.id === grantId);
    if (!grant) return false;
    grant.isRevoked = true;
    this.persist();
    return true;
  }

  public getSharedDataByToken(token: string, clientInfo: { ip: string; userAgent: string }) {
    // Search across all users
    let foundGrant: ShareGrant | null = null;
    let foundUserId: string | null = null;

    for (const [userId, grants] of Object.entries(this.data.shareGrants)) {
      const g = grants.find(item => item.token === token);
      if (g) {
        foundGrant = g;
        foundUserId = userId;
        break;
      }
    }

    if (!foundGrant || !foundUserId) {
      return { status: 'not_found' as const };
    }

    if (foundGrant.isRevoked) {
      return { status: 'revoked' as const, label: foundGrant.label };
    }

    if (new Date() > new Date(foundGrant.expiresAt)) {
      return { status: 'expired' as const, label: foundGrant.label, expiredAt: foundGrant.expiresAt };
    }

    // Record audit event
    foundGrant.accessCount += 1;
    foundGrant.lastAccessedAt = new Date().toISOString();

    const auditLog: ShareAuditLog = {
      id: `log-${crypto.randomUUID().slice(0, 8)}`,
      grantId: foundGrant.id,
      token: foundGrant.token,
      timestamp: new Date().toISOString(),
      clientIpMasked: clientInfo.ip.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.***.***'),
      userAgentSnippet: clientInfo.userAgent.slice(0, 80)
    };
    this.data.shareAuditLogs.push(auditLog);
    this.persist();

    // Fetch user and filtered documents
    const user = this.data.users[foundUserId];
    const allDocs = this.data.documents[foundUserId] || [];
    const allMeds = this.data.medications[foundUserId] || [];
    const allTimeline = this.data.timelineEvents[foundUserId] || [];

    const allowedDocs = allDocs.filter(d => {
      if (foundGrant!.specificDocumentIds && foundGrant!.specificDocumentIds.length > 0) {
        return foundGrant!.specificDocumentIds.includes(d.id);
      }
      return foundGrant!.allowedCategories.includes(d.category);
    });

    const activeMeds = allMeds.filter(m => m.status === 'active_confirmed');

    return {
      status: 'active' as const,
      grant: {
        label: foundGrant.label,
        recipientName: foundGrant.recipientName,
        recipientRole: foundGrant.recipientRole,
        expiresAt: foundGrant.expiresAt,
        accessCount: foundGrant.accessCount
      },
      patient: {
        name: user.name,
        age: user.age,
        gender: user.gender,
        bloodGroup: user.bloodGroup
      },
      documents: allowedDocs,
      activeMedications: activeMeds,
      timelineEvents: allTimeline.filter(e => allowedDocs.some(d => d.id === e.documentId))
    };
  }

  public getShareAuditLogs(userId: string): ShareAuditLog[] {
    const userGrants = this.data.shareGrants[userId] || [];
    const grantIds = new Set(userGrants.map(g => g.id));
    return this.data.shareAuditLogs.filter(log => grantIds.has(log.grantId));
  }

  // --- Emergency Health Card ---
  public getEmergencyCard(userId: string): EmergencyHealthCard {
    if (!this.data.emergencyCards[userId]) {
      const u = this.getUser(userId);
      this.data.emergencyCards[userId] = {
        patientName: u?.name || 'Patient',
        dob: '1970-01-01',
        bloodGroup: u?.bloodGroup || 'O+',
        selectedConditions: [],
        confirmedAllergies: [],
        confirmedMedications: [],
        emergencyContact: u?.emergencyContact || { name: 'Emergency Contact', relationship: 'Family', phone: '+1-555-000-0000' },
        primaryPhysician: { name: 'Dr. Primary', phone: '+1-555-000-0000', hospital: 'Clinic' },
        lastUpdated: new Date().toISOString()
      };
      this.persist();
    }
    return this.data.emergencyCards[userId];
  }

  public updateEmergencyCard(userId: string, card: Partial<EmergencyHealthCard>): EmergencyHealthCard {
    const existing = this.getEmergencyCard(userId);
    this.data.emergencyCards[userId] = {
      ...existing,
      ...card,
      lastUpdated: new Date().toISOString()
    };
    this.persist();
    return this.data.emergencyCards[userId];
  }

  // --- Consultation Sessions & Secure Doctor Sharing ---
  public createConsultationSession(
    patientId: string,
    params: {
      allowedCategories?: DocumentCategory[];
      sharedRecordIds?: string[];
      expiryMinutes?: number;
    }
  ): ConsultationSession {
    const user = this.getUser(patientId);
    if (!this.data.consultationSessions[patientId]) {
      this.data.consultationSessions[patientId] = [];
    }

    // Auto-end any existing active or created session for this patient to ensure single active session
    const now = new Date();
    for (const existing of this.data.consultationSessions[patientId]) {
      if (existing.status === 'created' || existing.status === 'active') {
        existing.status = 'ended';
        existing.endedAt = now.toISOString();
        existing.endedBy = 'patient';
      }
    }

    const expiryMins = params.expiryMinutes || 30;
    const expiresAt = new Date(now.getTime() + expiryMins * 60 * 1000).toISOString();

    // Human-friendly unique 6-char code: "LMH-" + 4 random digits
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const sessionCode = `LMH-${randomDigits}`;
    const token = `lmh_sess_${crypto.randomBytes(16).toString('hex')}`;

    const allDocs = this.data.documents[patientId] || [];
    const selectedRecordIds = params.sharedRecordIds || [];
    const allowedCategories = params.allowedCategories || ['prescription', 'lab_report', 'consultation_note', 'imaging_scan', 'discharge_summary'];

    // If specific records provided, filter them. If only categories provided, filter docs in those categories.
    const selectedDocs = allDocs.filter(d => {
      if (selectedRecordIds.length > 0) {
        return selectedRecordIds.includes(d.id);
      }
      return allowedCategories.includes(d.category);
    });

    const finalSharedRecordIds = selectedDocs.map(d => d.id);
    const sharedRecordDetails: SharedRecordSummary[] = selectedDocs.map(d => ({
      id: d.id,
      title: d.title,
      category: d.category,
      documentDate: d.documentDate,
      providerName: d.providerName
    }));

    const session: ConsultationSession = {
      id: `sess-${crypto.randomUUID().slice(0, 8)}`,
      sessionCode,
      token,
      patientId,
      patientName: user?.name || 'Patient',
      patientAge: user?.age,
      patientGender: user?.gender,
      patientBloodGroup: user?.bloodGroup,
      status: 'created',
      createdAt: now.toISOString(),
      expiresAt,
      allowedCategories,
      sharedRecordIds: finalSharedRecordIds,
      sharedRecordDetails
    };

    this.data.consultationSessions[patientId].unshift(session);
    this.persist();
    return session;
  }

  public getActivePatientSession(patientId: string): ConsultationSession | null {
    const sessions = this.data.consultationSessions[patientId] || [];
    const now = new Date();
    for (const session of sessions) {
      if (session.status === 'created' || session.status === 'active') {
        if (now > new Date(session.expiresAt)) {
          session.status = 'ended';
          session.endedAt = session.expiresAt;
          session.endedBy = 'expired';
          this.persist();
          continue;
        }
        return session;
      }
    }
    return null;
  }

  public getPatientSharingHistory(patientId: string): ConsultationSession[] {
    const sessions = this.data.consultationSessions[patientId] || [];
    const now = new Date();
    let updated = false;
    for (const s of sessions) {
      if ((s.status === 'created' || s.status === 'active') && now > new Date(s.expiresAt)) {
        s.status = 'ended';
        s.endedAt = s.expiresAt;
        s.endedBy = 'expired';
        updated = true;
      }
    }
    if (updated) this.persist();
    return sessions;
  }

  public endPatientConsultation(patientId: string, sessionId: string): boolean {
    const sessions = this.data.consultationSessions[patientId] || [];
    const session = sessions.find(s => s.id === sessionId);
    if (!session || session.status === 'ended') return false;

    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    session.endedBy = 'patient';

    // Record in doctor history if a doctor was active in this session
    if (session.doctorId) {
      if (!this.data.doctorConsultations[session.doctorId]) {
        this.data.doctorConsultations[session.doctorId] = [];
      }
      const existingRecord = this.data.doctorConsultations[session.doctorId].find(r => r.sessionId === session.id);
      if (!existingRecord) {
        this.data.doctorConsultations[session.doctorId].unshift({
          id: `dcr-${crypto.randomUUID().slice(0, 8)}`,
          sessionId: session.id,
          patientId: session.patientId,
          patientName: session.patientName,
          patientAge: session.patientAge,
          patientGender: session.patientGender,
          consultationDate: session.activatedAt?.slice(0, 10) || session.createdAt.slice(0, 10),
          recordsSharedCount: session.sharedRecordIds.length,
          summaryCategories: session.allowedCategories,
          endedAt: session.endedAt,
          endedBy: 'patient',
          notes: 'Consultation session concluded by patient.'
        });
      }
    }

    this.persist();
    return true;
  }

  public validateDoctorSessionAccess(doctor: UserProfile, codeOrToken: string) {
    const cleanInput = codeOrToken.trim();
    const upperInput = cleanInput.toUpperCase();

    // Check if this doctor currently has an active session with another patient
    for (const [pId, sessions] of Object.entries(this.data.consultationSessions)) {
      for (const s of sessions) {
        if (s.doctorId === doctor.id && s.status === 'active') {
          // If the doctor is requesting the SAME active session, that is permitted
          if (s.sessionCode === upperInput || s.token === cleanInput) {
            return this.buildDoctorConsultationData(s);
          }
          // Different session: doctor must end previous consultation first!
          return {
            status: 'doctor_busy' as const,
            message: `You currently have an active consultation with ${s.patientName}. You must end that consultation before opening another patient's records.`
          };
        }
      }
    }

    // Find session by code or token
    let foundSession: ConsultationSession | null = null;
    for (const [pId, sessions] of Object.entries(this.data.consultationSessions)) {
      const match = sessions.find(s => s.sessionCode === upperInput || s.token === cleanInput);
      if (match) {
        foundSession = match;
        break;
      }
    }

    if (!foundSession) {
      return {
        status: 'not_found' as const,
        message: 'Invalid consultation code or QR code. Please verify the code with the patient.'
      };
    }

    const now = new Date();
    if (now > new Date(foundSession.expiresAt)) {
      foundSession.status = 'ended';
      foundSession.endedAt = foundSession.expiresAt;
      foundSession.endedBy = 'expired';
      this.persist();
      return {
        status: 'expired' as const,
        message: 'This consultation sharing session has expired. The patient must generate a new code.',
        expiredAt: foundSession.expiresAt
      };
    }

    if (foundSession.status === 'ended') {
      return {
        status: 'ended' as const,
        message: 'This consultation session has ended and records are no longer accessible.',
        endedBy: foundSession.endedBy,
        endedAt: foundSession.endedAt
      };
    }

    // Activate the session for this doctor
    foundSession.status = 'active';
    foundSession.doctorId = doctor.id;
    foundSession.doctorName = doctor.name;
    foundSession.doctorSpecialty = doctor.specialty || 'Consulting Physician';
    foundSession.activatedAt = foundSession.activatedAt || now.toISOString();

    this.persist();
    return this.buildDoctorConsultationData(foundSession);
  }

  public getDoctorActiveSession(doctorId: string) {
    const now = new Date();
    for (const [pId, sessions] of Object.entries(this.data.consultationSessions)) {
      for (const s of sessions) {
        if (s.doctorId === doctorId && s.status === 'active') {
          if (now > new Date(s.expiresAt)) {
            s.status = 'ended';
            s.endedAt = s.expiresAt;
            s.endedBy = 'expired';
            this.persist();
            return {
              status: 'expired' as const,
              message: 'Consultation session has expired.'
            };
          }
          return this.buildDoctorConsultationData(s);
        }
      }
    }
    return { status: 'none' as const };
  }

  public endDoctorCurrentSession(doctorId: string): boolean {
    for (const [pId, sessions] of Object.entries(this.data.consultationSessions)) {
      for (const s of sessions) {
        if (s.doctorId === doctorId && s.status === 'active') {
          s.status = 'ended';
          s.endedAt = new Date().toISOString();
          s.endedBy = 'doctor';

          // Record in doctor history
          if (!this.data.doctorConsultations[doctorId]) {
            this.data.doctorConsultations[doctorId] = [];
          }
          this.data.doctorConsultations[doctorId].unshift({
            id: `dcr-${crypto.randomUUID().slice(0, 8)}`,
            sessionId: s.id,
            patientId: s.patientId,
            patientName: s.patientName,
            patientAge: s.patientAge,
            patientGender: s.patientGender,
            consultationDate: s.activatedAt?.slice(0, 10) || s.createdAt.slice(0, 10),
            recordsSharedCount: s.sharedRecordIds.length,
            summaryCategories: s.allowedCategories,
            endedAt: s.endedAt,
            endedBy: 'doctor',
            notes: 'Consultation completed by clinician.'
          });

          this.persist();
          return true;
        }
      }
    }
    return false;
  }

  public getDoctorPreviousPatients(doctorId: string): DoctorConsultationRecord[] {
    return this.data.doctorConsultations[doctorId] || [];
  }

  private buildDoctorConsultationData(session: ConsultationSession) {
    const patientId = session.patientId;
    const allDocs = this.data.documents[patientId] || [];
    const allMeds = this.data.medications[patientId] || [];
    const allLabs = this.data.labResults[patientId] || [];
    const allTimeline = this.data.timelineEvents[patientId] || [];
    const emergencyCard = this.getEmergencyCard(patientId);
    const user = this.getUser(patientId);

    // Strictly filter to the records explicitly shared!
    const sharedDocs = allDocs.filter(d => session.sharedRecordIds.includes(d.id));
    const sharedMeds = allMeds.filter(m => sharedDocs.some(d => d.id === m.documentId) || (session.allowedCategories.includes('prescription') && m.status === 'active_confirmed'));
    const sharedLabs = allLabs.filter(l => sharedDocs.some(d => d.id === l.documentId) || session.allowedCategories.includes('lab_report'));
    const sharedTimeline = allTimeline.filter(e => sharedDocs.some(d => d.id === e.documentId));

    return {
      status: 'active' as const,
      session,
      patient: {
        id: session.patientId,
        name: session.patientName,
        age: session.patientAge || user?.age,
        gender: session.patientGender || user?.gender,
        bloodGroup: session.patientBloodGroup || user?.bloodGroup,
        confirmedAllergies: emergencyCard.confirmedAllergies || [],
        confirmedConditions: emergencyCard.selectedConditions || [],
        emergencyContact: emergencyCard.emergencyContact
      },
      documents: sharedDocs,
      prescriptions: sharedMeds,
      labResults: sharedLabs,
      timelineEvents: sharedTimeline
    };
  }

  // --- Handover Summary Generation ---
  public generateHandoverSummary(userId: string): HandoverSummary {
    const user = this.getUser(userId) || { name: 'Patient', age: 50, gender: 'Unknown' } as UserProfile;
    const docs = this.getDocuments(userId);
    const meds = this.getMedications(userId);
    const labs = this.getLabResults(userId);
    const timeline = this.getTimelineEvents(userId);
    const conflicts = this.getMedicationConflicts(userId);
    const card = this.getEmergencyCard(userId);

    const conditions = Array.from(new Set(
      docs.flatMap(d => d.extractedData?.diagnoses || []).concat(card.selectedConditions || [])
    )).filter(Boolean);

    const allergies = (card.confirmedAllergies || []).map(a => ({
      allergen: a,
      confirmedDate: '2026-08-15',
      sourceDocId: docs.find(d => d.extractedData?.allergies?.some(al => al.toLowerCase().includes(a.toLowerCase().slice(0, 5))))?.id
    }));

    const activeMedications = meds.filter(m => m.status === 'active_confirmed' || m.status === 'needs_review').map(m => ({
      name: m.name,
      dose: m.dose,
      frequency: m.frequency,
      provider: m.providerName,
      status: m.status === 'active_confirmed' ? 'Confirmed Active' : 'Needs Clinician Review'
    }));

    // Highlights of recent labs
    const recentLabHighlights = labs.slice(0, 5).map(l => ({
      test: l.testName,
      value: l.value,
      unit: l.unit,
      date: l.testDate,
      status: l.isAbnormal ? 'Flagged / Attention' : 'Within Reference Range'
    }));

    // Recent consultations
    const recentConsultations = timeline.filter(t => t.type === 'consultation').slice(0, 3).map(c => ({
      date: c.date,
      provider: c.providerName,
      summary: c.title + ': ' + c.description
    }));

    const unresolvedConflicts = conflicts.map(c => `${c.medicationName}: ${c.description} -> ${c.clinicalPrompt}`);

    const missingInformationNotices: string[] = [];
    if (activeMedications.length === 0) missingInformationNotices.push('No confirmed current medications on record.');
    if (allergies.length === 0) missingInformationNotices.push('Allergy history not explicitly verified. Confirm at triage.');
    if (labs.length === 0) missingInformationNotices.push('No recent baseline biochemistry or metabolic reports uploaded.');

    const patientQuestions = [
      'Should my Metformin dosage remain at 1000mg ER with evening meal?',
      'Is my blood pressure goal of <130/80 mmHg well maintained on Telmisartan 80mg?',
      'Are there any duplicate or conflicting prescriptions between my clinic and specialist?'
    ];

    const nextSteps = [
      'Review medication reconciliation findings with physician.',
      'Check fasting glucose and HbA1c prior to consultation.',
      'Log blood pressure for 7 days if requested.'
    ];

    return {
      generatedAt: new Date().toISOString(),
      patientName: user.name,
      age: user.age ?? 0,
      gender: user.gender ?? 'Unknown',
      conditions: conditions.length > 0 ? conditions : ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
      allergies: allergies.length > 0 ? allergies : [{ allergen: 'Penicillin (Severe rash)', confirmedDate: '2026-05-20' }],
      activeMedications,
      recentLabHighlights,
      recentConsultations,
      unresolvedConflicts,
      missingInformationNotices,
      patientQuestions,
      nextSteps,
      disclaimer: 'This consultation summary is an AI-assisted record overview compiled from user-uploaded and verified medical documents. It is provided for personal preparation and does not substitute for qualified clinical examination, diagnosis, or prescription.'
    };
  }

  // --- Reset / Purge ---
  public resetToSyntheticDemo(): void {
    const demo = createSyntheticDemoData();
    this.data = demo;
    this.persist(demo);
  }
}

export const db = new DatabaseManager();
