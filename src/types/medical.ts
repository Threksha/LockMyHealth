export type DocumentCategory =
  | 'prescription'
  | 'lab_report'
  | 'imaging_scan'
  | 'discharge_summary'
  | 'consultation_note'
  | 'allergy_record'
  | 'other';

export type MedicationStatus =
  | 'needs_review'
  | 'active_confirmed'
  | 'historical'
  | 'discontinued_confirmed';

export type EventType =
  | 'consultation'
  | 'diagnosis'
  | 'prescription'
  | 'lab_result'
  | 'hospital_visit'
  | 'medication_change'
  | 'follow_up';

export interface Provider {
  id: string;
  name: string;
  role: string;
  specialty: string;
  facility: string;
  phone?: string;
  email?: string;
  address?: string;
  color?: string;
}

export interface ExtractedMedication {
  name: string;
  dose: string;
  route?: string;
  frequency?: string;
  duration?: string;
  verified?: boolean;
}

export interface ExtractedLabResult {
  testName: string;
  value: string;
  numericValue?: number;
  unit: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  verified?: boolean;
}

export interface ExtractedData {
  documentType?: string;
  providerName?: string;
  documentDate?: string;
  diagnoses?: string[];
  medications?: ExtractedMedication[];
  labResults?: ExtractedLabResult[];
  allergies?: string[];
  followUpRecommendations?: string;
  notes?: string;
  confidenceScore?: number;
  rawSummary?: string;
}

export interface MedicalDocument {
  id: string;
  userId: string;
  title: string;
  category: DocumentCategory;
  providerId: string;
  providerName: string;
  documentDate: string;
  uploadedAt: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  primaryCondition?: string;
  tags?: string[];
  notes?: string;
  extractedData?: ExtractedData;
  isVerified: boolean;
  ocrTextPreview?: string;
}

export interface TimelineEvent {
  id: string;
  userId: string;
  date: string;
  type: EventType;
  title: string;
  description: string;
  providerId: string;
  providerName: string;
  documentId?: string;
  condition?: string;
  sourceType: 'extracted' | 'patient_entered' | 'confirmed' | 'ai_explanation';
  details?: Record<string, any>;
}

export interface MedicationRecord {
  id: string;
  userId: string;
  name: string;
  dose: string;
  frequency: string;
  instructions: string;
  providerId: string;
  providerName: string;
  documentId?: string;
  startDate?: string;
  endDate?: string;
  status: MedicationStatus;
  condition?: string;
  patientNotes?: string;
  markedForReview?: boolean;
  lastReviewedDate?: string;
}

export interface MedicationConflict {
  id: string;
  type: 'duplicate' | 'dose_mismatch' | 'status_conflict' | 'unclear_instructions';
  medicationName: string;
  records: MedicationRecord[];
  description: string;
  clinicalPrompt: string;
  severity: 'warning' | 'caution' | 'info';
}

export interface LabTestRecord {
  id: string;
  userId: string;
  testName: string;
  category: 'Metabolic' | 'Lipid' | 'Renal' | 'Endocrine' | 'Hematology' | 'Vitals' | 'Other';
  value: string;
  numericValue: number;
  unit: string;
  referenceRange: string;
  minNormal?: number;
  maxNormal?: number;
  isAbnormal: boolean;
  testDate: string;
  providerId: string;
  providerName: string;
  documentId?: string;
  notes?: string;
  aiExplanation?: string;
}

export interface AppointmentChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  linkedDocumentId?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  title: string;
  providerId: string;
  providerName: string;
  date: string;
  time: string;
  timeZone: string;
  type: 'in_person' | 'video_consult' | 'lab_draw' | 'follow_up';
  status: 'upcoming' | 'completed' | 'cancelled' | 'rescheduled';
  location?: string;
  reason: string;
  notes?: string;
  linkedDocumentId?: string;
  extractedFromDoc?: boolean;
  userConfirmed: boolean;
  checklist: AppointmentChecklistItem[];
  reminderEnabled: boolean;
}

export interface ShareGrant {
  id: string;
  token: string;
  userId: string;
  label: string;
  recipientName: string;
  recipientRole: string;
  allowedCategories: DocumentCategory[];
  startDateFilter?: string;
  endDateFilter?: string;
  specificDocumentIds?: string[];
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
  accessCount: number;
  lastAccessedAt?: string;
}

export interface ShareAuditLog {
  id: string;
  grantId: string;
  token: string;
  timestamp: string;
  clientIpMasked: string;
  userAgentSnippet: string;
}

export interface EmergencyHealthCard {
  patientName: string;
  dob: string;
  bloodGroup: string;
  selectedConditions: string[];
  confirmedAllergies: string[];
  confirmedMedications: Array<{ name: string; dose: string; frequency: string }>;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  primaryPhysician: {
    name: string;
    phone: string;
    hospital: string;
  };
  hospitalPreference?: string;
  notes?: string;
  lastUpdated: string;
}

export interface HandoverSummary {
  generatedAt: string;
  patientName: string;
  age: number;
  gender: string;
  conditions: string[];
  allergies: Array<{ allergen: string; confirmedDate: string; sourceDocId?: string }>;
  activeMedications: Array<{ name: string; dose: string; frequency: string; provider: string; status: string }>;
  recentLabHighlights: Array<{ test: string; value: string; unit: string; date: string; status: string }>;
  recentConsultations: Array<{ date: string; provider: string; summary: string }>;
  unresolvedConflicts: string[];
  missingInformationNotices: string[];
  patientQuestions: string[];
  nextSteps: string[];
  disclaimer: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  referencedDocuments?: Array<{ id: string; title: string; date: string; provider: string }>;
  isConflicting?: boolean;
  safetyNotice?: string;
}

export type UserRole = 'patient' | 'doctor';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  isDemo: boolean;
  specialty?: string;
  licenseNumber?: string;
  hospitalOrFacility?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export type ConsultationSessionStatus = 'created' | 'active' | 'ended';

export interface SharedRecordSummary {
  id: string;
  title: string;
  category: DocumentCategory;
  documentDate: string;
  providerName?: string;
}

export interface ConsultationSession {
  id: string;
  sessionCode: string; // e.g. "LMH-8392"
  token: string;       // unguessable token
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientBloodGroup?: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  status: ConsultationSessionStatus;
  createdAt: string;
  activatedAt?: string;
  expiresAt: string;
  endedAt?: string;
  endedBy?: 'patient' | 'doctor' | 'expired';
  allowedCategories: DocumentCategory[];
  sharedRecordIds: string[];
  sharedRecordDetails: SharedRecordSummary[];
}

export interface DoctorConsultationRecord {
  id: string;
  sessionId: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientBloodGroup?: string;
  consultationDate: string;
  recordsSharedCount: number;
  summaryCategories: string[];
  endedAt: string;
  endedBy: 'patient' | 'doctor' | 'expired';
  notes?: string;
}
