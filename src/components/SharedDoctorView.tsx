import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Clock,
  Printer,
  FileText,
  Pill,
  GitCommitVertical,
  AlertTriangle,
  HeartPulse,
  User,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { fetchPublicSharedData } from '../services/api.ts';

interface SharedDoctorViewProps {
  token: string;
  onExit: () => void;
}

export const SharedDoctorView: React.FC<SharedDoctorViewProps> = ({ token, onExit }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchPublicSharedData(token);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Access link invalid, expired, or revoked.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <HeartPulse className="w-12 h-12 text-teal-600 animate-pulse mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Verifying LockMyHealth Secure Access Grant...</h2>
        <p className="text-xs text-slate-500 mt-1">Validating token expiry, scopes, and logging access event</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-sm text-slate-600 mt-2 mb-6">
          {error || 'This record link could not be validated. It may have expired, been revoked by the patient, or never existed.'}
        </p>
        <button
          onClick={onExit}
          className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors cursor-pointer"
        >
          Return to LockMyHealth Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Clinician Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={onExit}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              title="Return to patient app"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base text-slate-900">
                  LockMyHealth Clinical Viewer
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 uppercase">
                  Patient Authorized
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Grant: {data.grant.label} • Recipient: {data.grant.recipientName} ({data.grant.recipientRole})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Handover</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Clinical Summary */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Patient Demographic & Expiry Notice */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Patient File</span>
              <h1 className="text-xl font-bold text-slate-900">{data.patient.name}</h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Age: {data.patient.age}y • Gender: {data.patient.gender} • Blood Group: <strong className="text-rose-700">{data.patient.bloodGroup}</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center space-x-1.5 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Expires: {new Date(data.grant.expiresAt).toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Read-only link • Access count: {data.grant.accessCount}</p>
          </div>
        </div>

        {/* Section 1: Active Medications */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center space-x-2 mb-4">
            <Pill className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Current Confirmed Medications ({data.activeMedications.length})</h2>
          </div>

          {data.activeMedications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.activeMedications.map((m: any) => (
                <div key={m.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <strong className="text-sm font-bold text-slate-800">{m.name}</strong>
                      <span className="ml-2 font-semibold text-teal-700">{m.dose}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800">
                      Confirmed Active
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 font-medium">{m.frequency} • {m.instructions}</p>
                  <p className="text-slate-400 text-[11px] mt-1">Prescribed by {m.providerName} (Started {m.startDate || 'N/A'})</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No active medications included in this share grant.</p>
          )}
        </div>

        {/* Section 2: Patient-Shared Medical Documents */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">Authorized Medical Documents ({data.documents.length})</h2>
            </div>
            <span className="text-xs text-slate-500">Filtered by patient scope</span>
          </div>

          {data.documents.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.documents.map((doc: any) => (
                <div key={doc.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {doc.category.replace('_', ' ')}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">{doc.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Doctor/Facility: <strong className="text-slate-700">{doc.providerName}</strong> • Date: {doc.documentDate}
                    </p>
                    {doc.notes && <p className="text-xs text-slate-600 italic">"{doc.notes}"</p>}
                  </div>

                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-teal-300 text-teal-700 hover:bg-teal-50 text-xs font-semibold cursor-pointer"
                  >
                    <span>View File</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No documents found matching the authorized category filter.</p>
          )}
        </div>

        {/* Section 3: Timeline Events */}
        {data.timelineEvents && data.timelineEvents.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center space-x-2 mb-4">
              <GitCommitVertical className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">Health History Timeline ({data.timelineEvents.length})</h2>
            </div>
            <div className="space-y-3">
              {data.timelineEvents.map((evt: any) => (
                <div key={evt.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                    <span>{evt.date}</span>
                    <span className="font-semibold text-slate-700">{evt.providerName}</span>
                  </div>
                  <h4 className="font-bold text-slate-900">{evt.title}</h4>
                  <p className="text-slate-600 mt-1">{evt.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legal & Security Banner */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 text-center">
          <p>
            <strong>Security & Privacy Notice:</strong> This link is governed by patient-controlled revocable permissions.
            Access to this session has been securely logged with client timestamps for patient transparency.
          </p>
        </div>
      </div>
    </div>
  );
};
