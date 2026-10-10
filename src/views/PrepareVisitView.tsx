import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Printer,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Pill,
  Heart,
  HelpCircle,
  Clock,
  Download,
  Plus,
  Trash2,
  Calendar,
  User
} from 'lucide-react';
import { HandoverSummary } from '../types/medical.ts';
import { fetchHandoverSummary } from '../services/api.ts';

export const PrepareVisitView: React.FC = () => {
  const [summary, setSummary] = useState<HandoverSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientQuestions, setPatientQuestions] = useState<string[]>([]);
  const [newQuestionText, setNewQuestionText] = useState('');

  useEffect(() => {
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
  }, []);

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

  if (loading || !summary) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Sparkles className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Synthesizing clinical consultation handover summary...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Print Control Bar (Hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Prepare for My Next Doctor Visit
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 uppercase">
              1-Click Handover
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Structured clinical briefing with verified medications, allergy alerts, and questions to ask
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Clinical Handover Document */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 print-container text-slate-900">
        {/* Document Header */}
        <div className="border-b-2 border-teal-700 pb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight text-teal-900">LockMyHealth</span>
              <span className="text-xs font-bold text-slate-400">|</span>
              <span className="text-xs font-semibold text-slate-600">Patient Clinical Continuity Handover</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-2">{summary.patientName}</h2>
            <p className="text-xs text-slate-600">
              Age: {summary.age}y • Gender: {summary.gender} • Generated: {new Date(summary.generatedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <span className="inline-block px-2.5 py-1 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200 mb-1">
              Personal Medical Summary
            </span>
            <p>Confidential • Patient Prepared</p>
          </div>
        </div>

        {/* Section 1: Chronic Conditions & Confirmed Allergies */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Heart className="w-4 h-4 text-teal-600" />
              <span>Documented Chronic Conditions</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {summary.conditions.map((c, i) => (
                <span key={i} className="px-2.5 py-1 rounded bg-white text-teal-900 border border-teal-200 text-xs font-semibold">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
            <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Critical Allergies & Sensitivities</span>
            </div>
            <div className="space-y-1">
              {summary.allergies.map((a, i) => (
                <div key={i} className="text-xs font-bold text-rose-900 bg-white p-2 rounded border border-rose-200">
                  ⚠️ {a.allergen}
                  <span className="text-[10px] text-slate-500 font-normal ml-2">(Confirmed: {a.confirmedDate})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Active Medications List */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <Pill className="w-4 h-4 text-teal-600" />
            <span>Active Confirmed Medications ({summary.activeMedications.length})</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-2.5">Medication</th>
                  <th className="p-2.5">Dose & Frequency</th>
                  <th className="p-2.5">Prescribed By</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.activeMedications.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-900">{m.name}</td>
                    <td className="p-2.5 text-slate-700">{m.dose} ({m.frequency})</td>
                    <td className="p-2.5 text-slate-600">{m.provider}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Medication Conflicts & Discrepancies */}
        {summary.unresolvedConflicts.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Unresolved Record Discrepancies to Confirm with Doctor</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-amber-900">
              {summary.unresolvedConflicts.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 4: Recent Lab Highlights */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Recent Laboratory Test Highlights</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {summary.recentLabHighlights.map((lab, i) => (
              <div key={i} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-[11px] text-slate-500">{lab.test}</div>
                <div className="text-base font-extrabold text-slate-900">
                  {lab.value} <span className="text-xs font-normal text-slate-500">{lab.unit}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{lab.date} • {lab.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Patient's Questions for this Visit */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
              <HelpCircle className="w-4 h-4 text-teal-600" />
              <span>Questions to Ask Your Doctor</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {patientQuestions.map((q, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                <span className="font-medium">Q{idx + 1}: {q}</span>
                <button
                  onClick={() => handleRemoveQuestion(idx)}
                  className="no-print text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  title="Remove question"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add custom question input (no-print) */}
          <div className="no-print flex items-center space-x-2 pt-1">
            <input
              type="text"
              placeholder="Add your own custom question for this visit..."
              value={newQuestionText}
              onChange={e => setNewQuestionText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddQuestion()}
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-teal-500"
            />
            <button
              onClick={handleAddQuestion}
              className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 cursor-pointer"
            >
              Add Question
            </button>
          </div>
        </div>

        {/* Legal & Medical Disclaimer Footer */}
        <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 italic text-center">
          {summary.disclaimer}
        </div>
      </div>
    </div>
  );
};
