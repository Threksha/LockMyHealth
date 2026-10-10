import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope,
  QrCode,
  KeyRound,
  Search,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Clock,
  User,
  ShieldCheck,
  FileText,
  TestTube2,
  Pill,
  GitCommitVertical,
  LogOut,
  Camera,
  CameraOff,
  Eye,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Download,
  AlertCircle
} from 'lucide-react';
import {
  UserProfile,
  ConsultationSession,
  DoctorConsultationRecord,
  MedicalDocument,
  LabTestRecord,
  MedicationRecord,
  TimelineEvent
} from '../types/medical.ts';
import {
  validateDoctorSession,
  fetchDoctorActiveSession,
  endDoctorConsultation,
  fetchDoctorPreviousPatients
} from '../services/api.ts';

interface DoctorDashboardViewProps {
  doctor: UserProfile;
  onLogout: () => void;
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({
  doctor,
  onLogout
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active consultation state
  const [activeConsultation, setActiveConsultation] = useState<{
    session: ConsultationSession;
    patient: {
      id: string;
      name: string;
      age?: number;
      gender?: string;
      bloodGroup?: string;
      confirmedAllergies: string[];
      confirmedConditions: string[];
      emergencyContact?: { name: string; relationship: string; phone: string };
    };
    documents: MedicalDocument[];
    prescriptions: MedicationRecord[];
    labResults: LabTestRecord[];
    timelineEvents: TimelineEvent[];
  } | null>(null);

  // Previously treated patients state
  const [previousPatients, setPreviousPatients] = useState<DoctorConsultationRecord[]>([]);
  const [selectedPrevPatient, setSelectedPrevPatient] = useState<DoctorConsultationRecord | null>(null);
  const [activeConsultTab, setActiveConsultTab] = useState<'overview' | 'timeline' | 'labs' | 'prescriptions' | 'other'>('overview');
  const [inspectingDoc, setInspectingDoc] = useState<MedicalDocument | null>(null);

  // Camera QR Scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check URL hash for shared code or active consultation on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#doctor-code=')) {
      const code = hash.replace('#doctor-code=', '');
      if (code) {
        setCodeInput(code);
        handleValidateCode(code);
      }
    }
  }, []);

  const refreshDoctorState = async () => {
    try {
      const [activeRes, prevRes] = await Promise.all([
        fetchDoctorActiveSession(),
        fetchDoctorPreviousPatients()
      ]);

      if (activeRes && activeRes.status === 'active') {
        setActiveConsultation(activeRes);
      } else {
        setActiveConsultation(null);
      }
      setPreviousPatients(prevRes);
    } catch (err) {
      console.error('Error fetching doctor state:', err);
    }
  };

  useEffect(() => {
    refreshDoctorState();
  }, []);

  // Polling check to ensure if patient ends session, doctor view updates immediately
  useEffect(() => {
    if (!activeConsultation) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetchDoctorActiveSession();
        if (!res || res.status !== 'active') {
          setActiveConsultation(null);
          alert('This consultation sharing session has been concluded by the patient.');
          refreshDoctorState();
        }
      } catch (e) {
        // ignore network glitches
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [activeConsultation]);

  // Camera start / stop logic
  const startCamera = async () => {
    setErrorMsg(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
      } else {
        setErrorMsg('Camera access is not supported by your browser. Please enter the sharing code manually.');
      }
    } catch (err: any) {
      console.warn('Camera access denied or failed:', err);
      setErrorMsg('Camera access was denied or is unavailable. Please enter the sharing code manually.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleValidateCode = async (codeToTest?: string) => {
    const code = (codeToTest || codeInput).trim();
    if (!code) {
      setErrorMsg('Please enter a 6-character consultation code or scan a QR code.');
      return;
    }

    setIsValidating(true);
    setErrorMsg(null);
    try {
      const res = await validateDoctorSession(code);
      if (res.status === 'active') {
        setActiveConsultation(res);
        setCodeInput('');
        stopCamera();
        window.location.hash = '';
        await refreshDoctorState();
      } else if (res.status === 'doctor_busy') {
        setErrorMsg(res.message);
      } else if (res.status === 'expired') {
        setErrorMsg('This consultation session has expired. The patient must generate a new code.');
      } else if (res.status === 'ended') {
        setErrorMsg(`This consultation session has already been ended (by ${res.endedBy || 'patient'}).`);
      } else {
        setErrorMsg(res.message || 'Invalid consultation code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to validate consultation code.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleEndConsultation = async () => {
    if (window.confirm('End this consultation session? Patient record access will be terminated immediately and you will return to your dashboard.')) {
      try {
        await endDoctorConsultation();
        setActiveConsultation(null);
        await refreshDoctorState();
      } catch (err: any) {
        alert(err.message || 'Failed to end consultation');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased">
      {/* Top Clinician Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Stethoscope className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">LockMyHealth</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Doctor Station
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {doctor.name} • {doctor.specialty || 'General Medicine'} {doctor.hospitalOrFacility && `(${doctor.hospitalOrFacility})`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {activeConsultation && (
              <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Consultation Active: {activeConsultation.patient.name}</span>
              </span>
            )}

            <button
              onClick={onLogout}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Doctor Dashboard Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* If Consultation is Active: Render the Consultation Interface */}
        {activeConsultation ? (
          <div className="space-y-6">
            {/* Active Consultation Top Action Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-3xl shadow-sm border border-teal-800/40 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-300">
                    Active Clinical Consultation
                  </span>
                  <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded text-white">
                    Code: {activeConsultation.session.sessionCode}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {activeConsultation.patient.name}
                  {activeConsultation.patient.age && ` • ${activeConsultation.patient.age} yrs`}
                  {activeConsultation.patient.gender && ` • ${activeConsultation.patient.gender}`}
                </h1>

                <p className="text-xs text-teal-200">
                  Patient granted access to <strong>{activeConsultation.documents.length} verified records</strong>.
                  All other medical records remain encrypted and inaccessible.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleEndConsultation}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>End Consultation & Close Records</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs for Active Consultation */}
            <div className="flex items-center space-x-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setActiveConsultTab('overview')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeConsultTab === 'overview' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient Overview</span>
              </button>
              <button
                onClick={() => setActiveConsultTab('timeline')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeConsultTab === 'timeline' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitCommitVertical className="w-3.5 h-3.5" />
                <span>Medical Timeline ({activeConsultation.timelineEvents.length})</span>
              </button>
              <button
                onClick={() => setActiveConsultTab('labs')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeConsultTab === 'labs' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TestTube2 className="w-3.5 h-3.5" />
                <span>Lab Reports & Tests ({activeConsultation.labResults.length})</span>
              </button>
              <button
                onClick={() => setActiveConsultTab('prescriptions')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeConsultTab === 'prescriptions' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Prescriptions ({activeConsultation.prescriptions.length})</span>
              </button>
              <button
                onClick={() => setActiveConsultTab('other')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeConsultTab === 'other' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>All Documents ({activeConsultation.documents.length})</span>
              </button>
            </div>

            {/* TAB 1: Patient Overview */}
            {activeConsultTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Clinical Vitals & Demographics */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <User className="w-4 h-4 text-teal-600" />
                    <span>Demographics & Contact</span>
                  </h3>

                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Full Name</span>
                      <span className="font-bold text-slate-900">{activeConsultation.patient.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Age / Gender</span>
                      <span className="font-semibold text-slate-900">
                        {activeConsultation.patient.age || 'N/A'} yrs • {activeConsultation.patient.gender || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Blood Group</span>
                      <span className="font-bold text-teal-800">{activeConsultation.patient.bloodGroup || 'O+'}</span>
                    </div>
                    {activeConsultation.patient.emergencyContact && (
                      <div className="pt-2">
                        <span className="text-slate-400 block mb-1">Emergency Contact</span>
                        <span className="font-semibold text-slate-900 block">
                          {activeConsultation.patient.emergencyContact.name} ({activeConsultation.patient.emergencyContact.relationship})
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {activeConsultation.patient.emergencyContact.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirmed Allergies & Documented Conditions */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Confirmed Allergies</span>
                  </h3>

                  {activeConsultation.patient.confirmedAllergies.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-50 text-slate-500 text-xs">
                      No documented drug allergies shared in this consultation.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeConsultation.patient.confirmedAllergies.map((allergy, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                          ⚠️ {allergy}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Documented Diagnoses in Shared Records
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeConsultation.patient.confirmedConditions.map((cond, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-medium">
                          {cond}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active Shared Medications Summary */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span>Current Active Prescriptions</span>
                  </h3>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeConsultation.prescriptions.map(med => (
                      <div key={med.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{med.name}</span>
                          <span className="text-teal-700">{med.dose}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{med.instructions} • {med.frequency}</p>
                        <span className="text-[10px] text-slate-400 block">Prescribed by {med.providerName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Medical Timeline */}
            {activeConsultTab === 'timeline' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Chronological Medical Timeline of Shared Records</h3>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {activeConsultation.timelineEvents.map(evt => (
                    <div key={evt.id} className="relative">
                      <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-teal-600 shadow-xs" />
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{evt.title}</span>
                          <span className="text-slate-400 font-mono">{evt.date}</span>
                        </div>
                        <p className="text-xs text-slate-600">{evt.description}</p>
                        <span className="text-[11px] text-teal-700 font-semibold block pt-1">
                          Attributed Provider: {evt.providerName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Lab Reports & Test Results */}
            {activeConsultTab === 'labs' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Shared Laboratory Reports & Diagnostic Parameters</h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    {activeConsultation.labResults.length} parameters available
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Test Name</th>
                        <th className="py-2.5 px-3">Result Value</th>
                        <th className="py-2.5 px-3">Reference Range</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Facility</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeConsultation.labResults.map(lab => (
                        <tr key={lab.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-900">{lab.testName}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {lab.value} <span className="text-slate-500 text-[11px]">{lab.unit}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono">{lab.referenceRange}</td>
                          <td className="py-3 px-3 text-slate-500">{lab.testDate}</td>
                          <td className="py-3 px-3 text-slate-500">{lab.providerName}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              lab.isAbnormal ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {lab.isAbnormal ? 'Flagged / Attention' : 'Normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: Prescriptions */}
            {activeConsultTab === 'prescriptions' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Shared Prescriptions & Dosages</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeConsultation.prescriptions.map(med => (
                    <div key={med.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{med.name}</span>
                        <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                          {med.dose}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p><strong>Frequency:</strong> {med.frequency}</p>
                        <p><strong>Directions:</strong> "{med.instructions}"</p>
                        <p><strong>Prescriber:</strong> {med.providerName}</p>
                        {med.startDate && <p className="text-slate-400">Initiated: {med.startDate}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: All Shared Documents / Vault Records */}
            {activeConsultTab === 'other' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">All Individual Documents Shared in This Consultation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeConsultation.documents.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => setInspectingDoc(doc)}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all bg-white cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-teal-800 transition-colors">
                            {doc.title}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {doc.documentDate} • {doc.providerName}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {doc.category.replace('_', ' ')}
                        </span>
                      </div>

                      {doc.notes && (
                        <p className="text-xs text-slate-600 italic line-clamp-2">{doc.notes}</p>
                      )}

                      <div className="pt-2 flex items-center justify-between text-xs text-teal-700 font-semibold">
                        <span>Inspect Full Document Details</span>
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* NO CONSULTATION ACTIVE: Doctor Waiting Room & Verification Dashboard */
          <div className="space-y-8">
            {/* Start New Patient Consultation Card */}
            <div className="bg-white rounded-3xl border-2 border-teal-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="max-w-xl space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                  <QrCode className="w-3.5 h-3.5 text-teal-600" />
                  <span>Ready for Patient Access</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Access Patient Consultation Records
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Ask the patient to open their LockMyHealth app and show their consultation QR code,
                  or request their 6-character code (e.g. <span className="font-mono font-bold text-teal-800">LMH-XXXX</span>).
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Code Verification Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
                {/* Manual Code Input Form */}
                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Enter Patient Sharing Code
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. LMH-8392"
                      value={codeInput}
                      onChange={e => setCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-base font-bold tracking-wider uppercase bg-white focus:outline-teal-600"
                    />
                    <button
                      onClick={() => handleValidateCode()}
                      disabled={isValidating || !codeInput.trim()}
                      className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0"
                    >
                      <span>{isValidating ? 'Validating...' : 'Verify Code'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Codes are strictly single-session and expire automatically.
                  </p>
                </div>

                {/* Camera QR Scanner Box */}
                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Camera QR Code Scanner
                  </span>

                  {isCameraActive ? (
                    <div className="relative w-full max-w-[280px] h-48 bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                      <div className="absolute inset-4 border-2 border-teal-400 border-dashed rounded-lg pointer-events-none" />
                      <button
                        onClick={stopCamera}
                        className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-slate-900/80 text-white text-[10px] font-semibold cursor-pointer"
                      >
                        Stop Camera
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 py-2">
                      <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-slate-500 max-w-xs">
                        Use your clinic tablet or mobile device camera to instantly scan the patient's screen.
                      </p>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 rounded-xl bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 font-bold text-xs transition-colors cursor-pointer inline-flex items-center space-x-1.5 shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-teal-600" />
                        <span>Activate Camera Scanner</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Previously Treated Patients Section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Previously Treated Patients</h3>
                  <p className="text-xs text-slate-500">
                    Previously treated patients and their basic profile details. Medical records are not shown here.
                  </p>
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                  {previousPatients.length} Previous Sessions
                </span>
              </div>

              {previousPatients.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No previous consultation records for this clinician account.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {previousPatients.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedPrevPatient(item)}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all bg-white cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-teal-800 transition-colors">
                          {item.patientName}
                        </span>
                        <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {item.consultationDate}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 space-y-0.5">
                        <p>{[item.patientAge != null ? `${item.patientAge} years` : '', item.patientGender || '', item.patientBloodGroup ? `Blood group ${item.patientBloodGroup}` : ''].filter(Boolean).join(' • ') || 'Basic details unavailable'}</p>
                        <p className="text-[11px] text-slate-400">Consultation date: {item.consultationDate}</p>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[11px] text-teal-700 font-semibold">
                        <span>View Consultation Log</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Inspect Document Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{inspectingDoc.title}</h3>
                <p className="text-xs text-slate-500">
                  {inspectingDoc.documentDate} • {inspectingDoc.providerName}
                </p>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="font-bold text-slate-800 block">Category</span>
                <span className="capitalize">{inspectingDoc.category.replace('_', ' ')}</span>
              </div>

              {inspectingDoc.notes && (
                <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-800 block">Clinical Notes</span>
                  <p>{inspectingDoc.notes}</p>
                </div>
              )}

              {inspectingDoc.ocrTextPreview && (
                <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-800 block">Extracted Text Content</span>
                  <p className="font-mono text-[11px] whitespace-pre-wrap">{inspectingDoc.ocrTextPreview}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectingDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Previous Patient Consultation Log Modal (Read-only basic information, NO permanent record access) */}
      {selectedPrevPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Consultation Record: {selectedPrevPatient.patientName}
                </h3>
                <p className="text-xs text-slate-500">
                  Date: {selectedPrevPatient.consultationDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedPrevPatient(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 space-y-1">
                <span className="font-bold block flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Access Boundary Notice</span>
                </span>
                <p className="text-[11px] leading-relaxed">
                  Medical records access for this session expired when the consultation was concluded.
                  To review this patient's medical records again, the patient must initiate a new sharing session.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient:</span>
                  <span className="font-bold text-slate-900">{selectedPrevPatient.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Session ID:</span>
                  <span className="font-mono text-slate-700">{selectedPrevPatient.sessionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Records Shared:</span>
                  <span className="font-semibold text-slate-900">{selectedPrevPatient.recordsSharedCount} records</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ended By:</span>
                  <span className="font-semibold text-slate-900 capitalize">{selectedPrevPatient.endedBy}</span>
                </div>
                {selectedPrevPatient.notes && (
                  <div className="pt-1 border-t border-slate-200">
                    <span className="text-slate-400 block mb-0.5">Summary Note:</span>
                    <p className="italic text-slate-700">{selectedPrevPatient.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPrevPatient(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
