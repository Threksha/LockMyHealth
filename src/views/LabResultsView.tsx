import React, { useState } from 'react';
import {
  TestTube2,
  TrendingUp,
  Activity,
  Search,
  Sparkles,
  FileText,
  AlertCircle,
  Plus,
  HelpCircle,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { LabTestRecord, Provider, MedicalDocument } from '../types/medical.ts';
import { createLabResult, explainLabAI } from '../services/api.ts';
import { FormattedAIExplanation } from '../components/FormattedAIExplanation.tsx';

interface LabResultsViewProps {
  labs: LabTestRecord[];
  providers: Provider[];
  documents: MedicalDocument[];
  onRefreshLabs: () => void;
  onSelectDocument: (doc: MedicalDocument) => void;
  onOpenUpload?: () => void;
  onNavigateToSharing?: () => void;
}

export const LabResultsView: React.FC<LabResultsViewProps> = ({
  labs,
  providers,
  documents,
  onRefreshLabs,
  onSelectDocument,
  onOpenUpload,
  onNavigateToSharing
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [explainingLab, setExplainingLab] = useState<LabTestRecord | null>(null);
  const [aiExplanationText, setAiExplanationText] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // New Lab Form State
  const [newTestName, setNewTestName] = useState('Hemoglobin A1c (HbA1c)');
  const [newCategory, setNewCategory] = useState<LabTestRecord['category']>('Metabolic');
  const [newValue, setNewValue] = useState('');
  const [newUnit, setNewUnit] = useState('%');
  const [newRefRange, setNewRefRange] = useState('4.0 - 5.6%');
  const [newTestDate, setNewTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProviderId, setNewProviderId] = useState(providers[0]?.id || '');
  const [newIsAbnormal, setNewIsAbnormal] = useState(false);

  const categories = ['all', 'Metabolic', 'Lipid', 'Renal', 'Endocrine'];

  const filteredLabs = labs.filter(lab => {
    if (selectedCategory !== 'all' && lab.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = `${lab.testName} ${lab.providerName} ${lab.value} ${lab.unit}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  // Group repeated tests over time for longitudinal trend charts
  const testGroups: Record<string, LabTestRecord[]> = {};
  for (const lab of labs) {
    if (!testGroups[lab.testName]) testGroups[lab.testName] = [];
    testGroups[lab.testName].push(lab);
  }

  // Pick top test with multiple entries for trend visualization (e.g. HbA1c or Fasting Blood Sugar)
  const trendTests = Object.entries(testGroups).filter(([_, items]) => items.length >= 2);
  const [selectedTrendTest, setSelectedTrendTest] = useState<string>(
    trendTests[0]?.[0] || 'Hemoglobin A1c (HbA1c)'
  );

  const trendData = (testGroups[selectedTrendTest] || []).slice().sort(
    (a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
  );

  const handleExplain = async (lab: LabTestRecord) => {
    setExplainingLab(lab);
    setIsExplaining(true);
    setAiExplanationText(null);
    try {
      const res = await explainLabAI(lab.testName, lab.value, lab.unit, lab.referenceRange);
      setAiExplanationText(res.explanation);
    } catch (err) {
      setAiExplanationText('Could not retrieve AI explanation. Please check connection.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestName.trim() || !newValue.trim()) return;
    const prov = providers.find(p => p.id === newProviderId);
    await createLabResult({
      testName: newTestName,
      category: newCategory,
      value: newValue,
      numericValue: parseFloat(newValue) || 0,
      unit: newUnit,
      referenceRange: newRefRange,
      isAbnormal: newIsAbnormal,
      testDate: newTestDate,
      providerId: newProviderId,
      providerName: prov?.name || 'Greenfield Diagnostics'
    });
    setShowAddModal(false);
    setNewValue('');
    onRefreshLabs();
  };

  // Helper to draw clean responsive SVG line chart
  const renderTrendChart = () => {
    if (trendData.length < 2) return null;

    const values = trendData.map(d => d.numericValue || parseFloat(d.value) || 0);
    const minVal = Math.min(...values) * 0.9;
    const maxVal = Math.max(...values) * 1.1;
    const range = maxVal - minVal || 1;

    const width = 600;
    const height = 180;
    const padding = 40;

    const points = trendData.map((d, idx) => {
      const x = padding + (idx / (trendData.length - 1)) * (width - 2 * padding);
      const val = d.numericValue || parseFloat(d.value) || 0;
      const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
      return { x, y, val, date: d.testDate };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-xs font-bold text-slate-800">{selectedTrendTest}</span>
            <span className="text-xs text-slate-500 ml-2">({trendData[0]?.unit}) Longitudinal Trend</span>
          </div>
          <select
            value={selectedTrendTest}
            onChange={e => setSelectedTrendTest(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-teal-500"
          >
            {trendTests.map(([name]) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[650px] mx-auto overflow-visible">
            {/* Guide gridlines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3 3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />

            {/* Path */}
            <path d={pathD} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Points & Labels */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#0d9488" strokeWidth="2.5" />
                <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f766e">
                  {p.val}
                </text>
                <text x={p.x} y={height - padding + 15} textAnchor="middle" fontSize="9" fill="#64748b">
                  {p.date}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Lab Results & Diagnostic Trends</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Compare repeated test parameters over time with documented reference ranges
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-teal-300 hover:bg-teal-50 text-teal-800 text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Upload Lab Report</span>
            </button>
          )}

          {onNavigateToSharing && (
            <button
              onClick={onNavigateToSharing}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-900 text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Share With Doctor</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lab Entry</span>
          </button>
        </div>
      </div>

      {/* Trend Chart Card (if tests repeated) */}
      {trendTests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 text-teal-800 font-bold text-sm">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>Serial Parameter Comparison Over Time</span>
          </div>
          {renderTrendChart()}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search test names, laboratory facilities, values..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-teal-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lab Results Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-5 py-3">Test Parameter</th>
                <th className="px-4 py-3">Result & Units</th>
                <th className="px-4 py-3">Reference Range</th>
                <th className="px-4 py-3">Test Date</th>
                <th className="px-4 py-3">Laboratory</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLabs.map(lab => {
                const linkedDoc = documents.find(d => d.id === lab.documentId);
                return (
                  <tr key={lab.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{lab.testName}</div>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {lab.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-base text-slate-900">{lab.value}</span>
                        <span className="text-xs text-slate-500 font-medium">{lab.unit}</span>
                      </div>
                      {lab.isAbnormal ? (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Attention / Out of Range
                        </span>
                      ) : (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Within Range
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 font-mono">
                      {lab.referenceRange || 'Not documented'}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">
                      {lab.testDate}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      {lab.providerName}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleExplain(lab)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 cursor-pointer"
                        title="AI clinical parameter explanation"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span>Explain</span>
                      </button>

                      {linkedDoc && (
                        <button
                          onClick={() => onSelectDocument(linkedDoc)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Open original lab report PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLabs.length === 0 && (
          <div className="p-8 text-center">
            <TestTube2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600 text-xs font-semibold">No lab results found matching this filter.</p>
          </div>
        )}
      </div>

      {/* AI Parameter Explanation Modal */}
      {explainingLab && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Understanding {explainingLab.testName}</h3>
                  <p className="text-xs text-slate-500">
                    Result: <strong>{explainingLab.value} {explainingLab.unit}</strong> • Ref: {explainingLab.referenceRange}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExplainingLab(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isExplaining ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <Sparkles className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
                Generating patient-friendly clinical explanation via Gemini...
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {aiExplanationText}
              </div>
            )}

            <div className="pt-2 text-[11px] text-slate-400">
              * Informational educational explanation. Always discuss laboratory findings with your prescribing clinician.
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setExplainingLab(null)}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lab Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Laboratory Result</h3>
            <form onSubmit={handleCreateLab} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hemoglobin A1c, Serum Creatinine"
                  value={newTestName}
                  onChange={e => setNewTestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500 bg-white"
                  >
                    <option value="Metabolic">Metabolic</option>
                    <option value="Lipid">Lipid</option>
                    <option value="Renal">Renal</option>
                    <option value="Endocrine">Endocrine</option>
                    <option value="Hematology">Hematology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Date *</label>
                  <input
                    type="date"
                    required
                    value={newTestDate}
                    onChange={e => setNewTestDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Value *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6.8"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. %, mg/dL"
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Range</label>
                <input
                  type="text"
                  placeholder="e.g. 4.0 - 5.6%"
                  value={newRefRange}
                  onChange={e => setNewRefRange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnostic Facility</label>
                <select
                  value={newProviderId}
                  onChange={e => setNewProviderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500 bg-white"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chkAbnormal"
                  checked={newIsAbnormal}
                  onChange={e => setNewIsAbnormal(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="chkAbnormal" className="text-xs font-medium text-slate-700">
                  Flag as out-of-range / Requires clinical attention
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Lab Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
