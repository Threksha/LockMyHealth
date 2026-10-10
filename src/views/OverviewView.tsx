import React from 'react';
import {
  FileText,
  UserCheck2,
  Calendar,
  Activity,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Pill,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Plus
} from 'lucide-react';
import {
  UserProfile,
  Provider,
  MedicalDocument,
  TimelineEvent,
  MedicationRecord,
  MedicationConflict,
  LabTestRecord,
  Appointment
} from '../types/medical.ts';

interface OverviewViewProps {
  user: UserProfile | null;
  providers: Provider[];
  documents: MedicalDocument[];
  timeline: TimelineEvent[];
  medications: MedicationRecord[];
  conflicts: MedicationConflict[];
  labs: LabTestRecord[];
  appointments: Appointment[];
  onNavigate: (tab: any) => void;
  onOpenUpload: () => void;
  onOpenEmergencyCard: () => void;
  onOpenPrepareVisit: () => void;
  onSelectDocument?: (doc: MedicalDocument) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  user,
  providers,
  documents,
  timeline,
  medications,
  conflicts,
  labs,
  appointments,
  onNavigate,
  onOpenUpload,
  onOpenEmergencyCard,
  onOpenPrepareVisit,
  onSelectDocument
}) => {
  const activeMeds = medications.filter(m => m.status === 'active_confirmed');
  const upcomingAppointments = appointments.filter(a => a.status === 'upcoming');
  const recentDocs = documents.slice(0, 4);
  const recentTimeline = timeline.slice(0, 4);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome & Continuity Handover Action Card */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-teal-900 rounded-2xl text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-teal-100 backdrop-blur-2xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Health Continuity Command Center</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good day, {user?.name || 'there'}
          </h1>

          <p className="text-teal-100 text-sm sm:text-base leading-relaxed">
            Your centralized medical vault connects <strong className="text-white">{providers.length} healthcare providers</strong>,{' '}
            <strong className="text-white">{documents.length} verified records</strong>, and{' '}
            <strong className="text-white">{activeMeds.length} active prescriptions</strong> into a single unified health timeline.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenPrepareVisit}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-teal-900 font-bold text-sm shadow-md hover:bg-teal-50 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span>Prepare for My Next Visit</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onOpenEmergencyCard}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Emergency Health Card</span>
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-80 h-80 rounded-full bg-white/5 pointer-events-none blur-2xl" />
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('vault')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Records</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{documents.length}</div>
          <p className="text-xs text-slate-500 mt-1">Prescriptions, labs & scans</p>
        </div>

        <div
          onClick={() => onNavigate('doctors')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Care Providers</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <UserCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{providers.length}</div>
          <p className="text-xs text-slate-500 mt-1">Doctors, clinics & labs</p>
        </div>

        <div
          onClick={() => onNavigate('appointments')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Upcoming Visits</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{upcomingAppointments.length}</div>
          <p className="text-xs text-slate-500 mt-1">Next: {upcomingAppointments[0]?.date || 'None'}</p>
        </div>

        <div
          onClick={() => onNavigate('labs')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recent Lab Tests</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{labs.length}</div>
          <p className="text-xs text-slate-500 mt-1">HbA1c, Lipids & Renal</p>
        </div>
      </div>

      {/* Medication Reconciliation Alerts Notice (if conflicts detected) */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  {conflicts.length} Medication Reconciliation {conflicts.length > 1 ? 'Alerts' : 'Alert'} Detected
                </h3>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Differing doses or transitions detected between care providers (e.g., {conflicts[0].medicationName}).
                  Review with your doctor or pharmacist before your next refill.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('medications')}
              className="px-3.5 py-1.5 rounded-lg bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition-colors cursor-pointer shrink-0"
            >
              Resolve in Medications →
            </button>
          </div>
        </div>
      )}

      {/* Grid: Connected Care Providers (My Doctors) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Care Providers</h2>
            <p className="text-xs text-slate-500">Doctors, clinics, and laboratories managing your health records</p>
          </div>
          <button
            onClick={() => onNavigate('doctors')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Folders</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers.map(provider => {
            const providerDocs = documents.filter(d => d.providerId === provider.id || d.providerName.toLowerCase().includes(provider.name.toLowerCase()));
            return (
              <div
                key={provider.id}
                onClick={() => onNavigate('doctors')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                    {provider.name.replace('Dr. ', '').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {providerDocs.length} records
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                  {provider.name}
                </h3>
                <p className="text-xs font-medium text-teal-700 truncate">{provider.specialty}</p>
                <p className="text-[11px] text-slate-400 truncate mt-1">{provider.facility}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Split Section: Health Activity Timeline & Active Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Activity Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Health Activity</h2>
            <button
              onClick={() => onNavigate('timeline')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>Full Timeline</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentTimeline.map(item => (
              <div
                key={item.id}
                onClick={() => onNavigate('timeline')}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">{item.providerName}</span>
                  <span className="text-[11px] text-slate-400">{item.date}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Medications Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Medications Summary</h2>
              <p className="text-xs text-slate-500">{activeMeds.length} confirmed active prescriptions</p>
            </div>
            <button
              onClick={() => onNavigate('medications')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>Manage Meds</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            {activeMeds.slice(0, 4).map(med => (
              <div
                key={med.id}
                className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{med.name}</span>
                    <span className="text-teal-700 font-semibold">{med.dose}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{med.frequency} • {med.instructions}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                  Confirmed Active
                </span>
              </div>
            ))}
          </div>

          {/* Missing info notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Continuity Note:</span> Always carry your current medication packaging or digital summary to specialist consultations.
          </div>
        </div>
      </div>

      {/* Recently Uploaded Records Vault row */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recently Uploaded Documents</h2>
            <p className="text-xs text-slate-500">Persistent encrypted document vault</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={() => onNavigate('vault')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentDocs.map(doc => (
            <div
              key={doc.id}
              onClick={() => onSelectDocument ? onSelectDocument(doc) : onNavigate('vault')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                  {doc.category.replace('_', ' ')}
                </span>
                <span className="text-slate-400 text-[11px]">{doc.documentDate}</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                {doc.title}
              </h4>
              <p className="text-xs text-slate-500 truncate mt-0.5">{doc.providerName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
