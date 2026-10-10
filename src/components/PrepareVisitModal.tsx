import React, { useEffect, useState } from 'react';
import {
  X,
  Printer,
  Sparkles,
  FileText,
  AlertTriangle,
  AlertOctagon,
  Pill,
  Heart,
  HelpCircle,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { HandoverSummary } from '../types/medical.ts';
import { fetchHandoverSummary } from '../services/api.ts';

interface PrepareVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrepareVisitModal: React.FC<PrepareVisitModalProps> = ({ isOpen, onClose }) => {
  const [summary, setSummary] = useState<HandoverSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientQuestions, setPatientQuestions] = useState<string[]>([]);
  const [newQuestionText, setNewQuestionText] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchHandoverSummary();
        setSummary(data);
        setPatientQuestions(data.patientQuestions || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    setPatientQuestions([...patientQuestions, newQuestionText.trim()]);
    setNewQuestionText('');
  };

  const handleRemoveQuestion = (idx: number) => {
    setPatientQuestions(patientQuestions.filter((_, i) => i !== idx));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="bg-teal-700 px-6 py-4 text-white flex items-center justify-between no-print shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Prepare for My Next Visit</h2>
              <p className="text-xs text-teal-100">AI-Assisted Clinical Handover & Consultation Briefing</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 printable-handover">
          {loading || !summary ? (
            <div className="py-12 text-center text-slate-500">
              <Sparkles className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold">Synthesizing clinical consultation handover summary...</p>
            </div>
          ) : (
            <>
              {/* Document Header */}
              <div className="border-b-2 border-teal-700 pb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-black tracking-tight text-teal-900">LockMyHealth Handover</span>
                    <span className="text-xs font-bold text-slate-300">|</span>
                    <span className="text-xs font-semibold text-slate-500">Clinical Continuity Document</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{summary.patientName}</h3>
                  <p className="text-xs text-slate-600">
                    Age: {summary.age}y • Gender: {summary.gender} • Generated: {new Date(summary.generatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="px-2.5 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                    Patient Vault Briefing
                  </span>
                </div>
              </div>

              {/* Conditions & Allergies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                    <Heart className="w-4 h-4 text-teal-600" />
                    <span>Documented Conditions</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {summary.conditions.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white text-teal-900 border border-teal-200 font-semibold">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold uppercase tracking-wider text-[11px]">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>Confirmed Allergies</span>
                  </div>
                  <div className="space-y-1">
                    {summary.allergies.map((a, i) => (
                      <div key={i} className="font-bold text-rose-900 bg-white p-1.5 rounded border border-rose-200 text-[11px]">
                        ⚠️ {a.allergen}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Medications */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2 font-bold text-slate-800 text-sm">
                  <Pill className="w-4 h-4 text-teal-600" />
                  <span>Current Confirmed Medications ({summary.activeMedications.length})</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-2">Medication</th>
                        <th className="p-2">Dose / Frequency</th>
                        <th className="p-2">Prescriber</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary.activeMedications.map((m, i) => (
                        <tr key={i}>
                          <td className="p-2 font-bold text-slate-900">{m.name}</td>
                          <td className="p-2 text-slate-700">{m.dose} ({m.frequency})</td>
                          <td className="p-2 text-slate-600">{m.provider}</td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Unresolved Conflicts */}
              {summary.unresolvedConflicts.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Items for Clinician Confirmation / Medication Reconciliation</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1">
                    {summary.unresolvedConflicts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent Labs */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2 font-bold text-slate-800">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Recent Diagnostic Test Highlights</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {summary.recentLabHighlights.map((l, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block truncate">{l.test}</span>
                      <strong className="text-sm text-slate-900">{l.value} {l.unit}</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{l.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions to Ask Doctor */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2 font-bold text-slate-800">
                  <HelpCircle className="w-4 h-4 text-teal-600" />
                  <span>Patient Questions to Ask</span>
                </div>

                <div className="space-y-1.5">
                  {patientQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-800">Q{idx + 1}: {q}</span>
                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        className="no-print text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="no-print flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom question for your consultation..."
                    value={newQuestionText}
                    onChange={e => setNewQuestionText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddQuestion()}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-teal-500"
                  />
                  <button
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-slate-400 italic text-center pt-2 border-t border-slate-200">
                {summary.disclaimer}
              </p>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between no-print shrink-0">
          <span className="text-xs text-slate-500">
            Click 'Print / PDF' to save or print this briefing for your doctor.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
