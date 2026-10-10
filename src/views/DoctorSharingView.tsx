import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Share2,
  QrCode,
  KeyRound,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  Copy,
  Check,
  Ban,
  FileText,
  TestTube2,
  Pill,
  FolderArchive,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  User,
  Stethoscope,
  X,
  Eye
} from 'lucide-react';
import {
  MedicalDocument,
  ConsultationSession,
  DocumentCategory
} from '../types/medical.ts';
import {
  createConsultationSession,
  fetchActivePatientSession,
  fetchPatientSharingHistory,
  endPatientConsultation
} from '../services/api.ts';

interface DoctorSharingViewProps {
  documents: MedicalDocument[];
  onSelectDocument?: (doc: MedicalDocument) => void;
}

export const DoctorSharingView: React.FC<DoctorSharingViewProps> = ({
  documents,
  onSelectDocument
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'history'>('share');
  const [activeSession, setActiveSession] = useState<ConsultationSession | null>(null);
  const [history, setHistory] = useState<ConsultationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  // New Session Creation Form State
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [expiryMinutes, setExpiryMinutes] = useState<number>(30);
  const [recordFilterTab, setRecordFilterTab] = useState<'all' | 'labs' | 'prescriptions' | 'other'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [inspectedSession, setInspectedSession] = useState<ConsultationSession | null>(null);

  // Load current active session and history
  const loadSessions = async () => {
    try {
      setLoading(true);
      const [activeRes, histRes] = await Promise.all([
        fetchActivePatientSession(),
        fetchPatientSharingHistory()
      ]);
      setActiveSession(activeRes.session);
      setHistory(histRes);
    } catch (err) {
      console.error('Error loading consultation sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Generate QR code whenever activeSession changes
  useEffect(() => {
    if (activeSession && activeSession.status !== 'ended') {
      const shareUrl = `${window.location.origin}/#doctor-code=${activeSession.sessionCode}`;
      QRCode.toDataURL(shareUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f766e',
          light: '#ffffff'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Error rendering QR code:', err));
    } else {
      setQrDataUrl('');
    }
  }, [activeSession]);

  // Default selection: preselect recent records if none selected
  useEffect(() => {
    if (selectedRecordIds.length === 0 && documents.length > 0) {
      setSelectedRecordIds(documents.slice(0, 3).map(d => d.id));
    }
  }, [documents]);

  const toggleRecordSelection = (id: string) => {
    setSelectedRecordIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCategory = (cat: 'labs' | 'prescriptions' | 'other' | 'all') => {
    if (cat === 'all') {
      setSelectedRecordIds(documents.map(d => d.id));
    } else if (cat === 'labs') {
      const labIds = documents.filter(d => d.category === 'lab_report').map(d => d.id);
      setSelectedRecordIds(prev => Array.from(new Set([...prev, ...labIds])));
    } else if (cat === 'prescriptions') {
      const presIds = documents.filter(d => d.category === 'prescription').map(d => d.id);
      setSelectedRecordIds(prev => Array.from(new Set([...prev, ...presIds])));
    } else {
      const otherIds = documents.filter(d => d.category !== 'lab_report' && d.category !== 'prescription').map(d => d.id);
      setSelectedRecordIds(prev => Array.from(new Set([...prev, ...otherIds])));
    }
  };

  const handleDeselectAll = () => {
    setSelectedRecordIds([]);
  };

  const handleStartSession = async () => {
    if (selectedRecordIds.length === 0) {
      alert('Please select at least one medical record to share with your doctor.');
      return;
    }

    setIsCreating(true);
    try {
      const session = await createConsultationSession({
        sharedRecordIds: selectedRecordIds,
        expiryMinutes
      });
      setActiveSession(session);
      await loadSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to start consultation session');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    if (window.confirm('End this consultation sharing session immediately? The doctor will lose all access instantly.')) {
      setIsEnding(true);
      try {
        await endPatientConsultation(activeSession.id);
        setActiveSession(null);
        await loadSessions();
      } catch (err: any) {
        alert(err.message || 'Failed to end session');
      } finally {
        setIsEnding(false);
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredDocs = documents.filter(d => {
    if (recordFilterTab === 'labs') return d.category === 'lab_report';
    if (recordFilterTab === 'prescriptions') return d.category === 'prescription';
    if (recordFilterTab === 'other') return d.category !== 'lab_report' && d.category !== 'prescription';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Doctor Consultation Sharing
            </h1>
            <span className="text-xs font-bold uppercase bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200">
              Single-Session Access
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select exact records, generate a secure consultation QR code, and track active sessions.
          </p>
        </div>

        {/* Tab Switcher: Share vs History */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('share')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'share' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Consultation Session</span>
            {activeSession && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'history' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Sharing History ({history.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'share' && (
        <div className="space-y-6">
          {/* Active Session Card (If session is active) */}
          {activeSession ? (
            <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-md border border-teal-700/50 space-y-6 relative overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold border border-emerald-400/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Active Sharing Session in Progress</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Show this QR Code or Share Code to Your Doctor
                  </h2>
                  <p className="text-teal-100 text-xs sm:text-sm leading-relaxed">
                    Your doctor can scan this QR code with their mobile device or enter the 6-character code
                    in the Doctor Portal. Only the <strong className="text-white">{activeSession.sharedRecordIds.length} selected records</strong> are shared.
                  </p>
                </div>

                <button
                  onClick={handleEndSession}
                  disabled={isEnding}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>{isEnding ? 'Ending Access...' : 'End Session Now'}</span>
                </button>
              </div>

              {/* QR and Code Display Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* QR Code */}
                <div className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center text-slate-900 shadow-sm space-y-3">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Consultation QR Code" className="w-48 h-48 object-contain rounded-lg" />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                      Generating QR...
                    </div>
                  )}
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Doctor Camera Scan
                    </span>
                    <span className="text-[10px] text-slate-400">Scan via phone camera or clinic tablet</span>
                  </div>
                </div>

                {/* Manual 6-Digit Code */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-teal-200 uppercase tracking-wider block">
                      Manual Sharing Code
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-3xl sm:text-4xl font-black text-white tracking-wider">
                        {activeSession.sessionCode}
                      </span>
                      <button
                        onClick={() => handleCopyCode(activeSession.sessionCode)}
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                        title="Copy code"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-teal-200 leading-relaxed">
                      If scanning is unavailable, tell your doctor to enter this code directly into their portal.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs">
                    <div className="flex justify-between text-teal-200">
                      <span>Status:</span>
                      <span className="font-bold text-white capitalize">{activeSession.status}</span>
                    </div>
                    <div className="flex justify-between text-teal-200">
                      <span>Doctor:</span>
                      <span className="font-bold text-white">{activeSession.doctorName || 'Awaiting doctor scan...'}</span>
                    </div>
                    <div className="flex justify-between text-teal-200">
                      <span>Expires At:</span>
                      <span className="font-mono text-white">{new Date(activeSession.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Selected Records in this Session */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-teal-200 uppercase tracking-wider block mb-2">
                      Authorized Records ({activeSession.sharedRecordIds.length})
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {activeSession.sharedRecordDetails.map(rec => (
                        <div key={rec.id} className="p-2 rounded-xl bg-white/10 text-xs text-teal-100 flex items-center space-x-2">
                          {rec.category === 'prescription' && <Pill className="w-3.5 h-3.5 text-teal-300 shrink-0" />}
                          {rec.category === 'lab_report' && <TestTube2 className="w-3.5 h-3.5 text-teal-300 shrink-0" />}
                          {rec.category !== 'prescription' && rec.category !== 'lab_report' && <FileText className="w-3.5 h-3.5 text-teal-300 shrink-0" />}
                          <span className="truncate font-medium">{rec.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] text-teal-200/80">
                    * Other records in your vault remain completely private and locked.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Create New Sharing Session Panel */
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    <h2 className="text-lg font-bold text-slate-900">Start a Consultation Sharing Session</h2>
                  </div>
                  <p className="text-xs text-slate-500">
                    Step 1: Select the exact medical records your doctor needs for this consultation.
                  </p>
                </div>

                {/* Expiry Selector */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500 font-semibold">Session Duration:</span>
                  <select
                    value={expiryMinutes}
                    onChange={e => setExpiryMinutes(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-teal-600 cursor-pointer"
                  >
                    <option value={15}>15 minutes (Quick consult)</option>
                    <option value={30}>30 minutes (Standard visit)</option>
                    <option value={60}>1 hour (Extended review)</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              {/* Record Category Filter Tabs & Quick Select */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setRecordFilterTab('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      recordFilterTab === 'all' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    All Vault Records ({documents.length})
                  </button>
                  <button
                    onClick={() => setRecordFilterTab('labs')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      recordFilterTab === 'labs' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Lab Reports ({documents.filter(d => d.category === 'lab_report').length})
                  </button>
                  <button
                    onClick={() => setRecordFilterTab('prescriptions')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      recordFilterTab === 'prescriptions' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Prescriptions ({documents.filter(d => d.category === 'prescription').length})
                  </button>
                  <button
                    onClick={() => setRecordFilterTab('other')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      recordFilterTab === 'other' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Other Scans & Notes ({documents.filter(d => d.category !== 'lab_report' && d.category !== 'prescription').length})
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => handleSelectAllCategory(recordFilterTab)}
                    className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer underline"
                  >
                    Select All in Category
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>

              {/* Records Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredDocs.map(doc => {
                  const isSelected = selectedRecordIds.includes(doc.id);
                  return (
                    <div
                      key={doc.id}
                      onClick={() => toggleRecordSelection(doc.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/50 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div onClick
                        className="mt-1 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">{doc.title}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            doc.category === 'prescription' ? 'bg-indigo-100 text-indigo-800' :
                            doc.category === 'lab_report' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {doc.category.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                          <span>{doc.documentDate}</span>
                          <span>•</span>
                          <span className="truncate">{doc.providerName}</span>
                        </div>

                        {doc.notes && (
                          <p className="text-[11px] text-slate-600 line-clamp-1 italic">{doc.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Review & Launch Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm">
                    {selectedRecordIds.length}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {selectedRecordIds.length === 1 ? '1 Record Selected' : `${selectedRecordIds.length} Records Selected`}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Doctor will access only these specific items during the session.
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleStartSession}
                  disabled={isCreating || selectedRecordIds.length === 0}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center space-x-2 ${
                    selectedRecordIds.length > 0 && !isCreating
                      ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isCreating ? 'Generating Code...' : 'Generate Sharing QR & Code'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sharing History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Patient Sharing History</h2>
              <p className="text-xs text-slate-500">
                Log of clinical consultations and the exact medical records shared during each session.
              </p>
            </div>
            <button
              onClick={loadSessions}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <History className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold">No previous sharing sessions recorded.</p>
              <p className="text-xs">Start a session above to generate your first doctor consultation code.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => {
                const isItemActive = item.status === 'active' || item.status === 'created';
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all bg-white flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {item.sessionCode}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          item.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'created' ? 'bg-amber-100 text-amber-800' :
                          item.endedBy === 'expired' ? 'bg-slate-100 text-slate-600' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {item.status === 'ended' ? `Ended (by ${item.endedBy || 'patient'})` : item.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700">
                        <strong>Doctor:</strong> {item.doctorName || 'Not scanned yet'}{' '}
                        {item.doctorSpecialty && <span className="text-slate-500">({item.doctorSpecialty})</span>}
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.sharedRecordDetails.map(rec => (
                          <span
                            key={rec.id}
                            className="inline-flex items-center space-x-1 text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                          >
                            <FileText className="w-3 h-3 text-teal-600" />
                            <span className="truncate max-w-[180px]">{rec.title}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setInspectedSession(item)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect Records</span>
                      </button>

                      {isItemActive && (
                        <button
                          onClick={handleEndSession}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
                        >
                          End Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Session Details Modal */}
      {inspectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Sharing Session Details ({inspectedSession.sessionCode})
                </h3>
                <p className="text-xs text-slate-500">
                  {new Date(inspectedSession.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setInspectedSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Doctor</span>
                  <span className="font-semibold text-slate-900">{inspectedSession.doctorName || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-semibold text-slate-900 capitalize">{inspectedSession.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Created</span>
                  <span>{new Date(inspectedSession.createdAt).toLocaleTimeString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Ended At</span>
                  <span>{inspectedSession.endedAt ? new Date(inspectedSession.endedAt).toLocaleTimeString() : 'Active'}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-2">
                  Records Shared in This Session ({inspectedSession.sharedRecordDetails.length}):
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {inspectedSession.sharedRecordDetails.map(rec => (
                    <div key={rec.id} className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{rec.title}</span>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {rec.category.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Date: {rec.documentDate} {rec.providerName && `• Provider: ${rec.providerName}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedSession(null)}
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
