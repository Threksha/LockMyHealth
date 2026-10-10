import React, { useState } from 'react';
import {
  Pill,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Archive,
  Plus,
  Edit2,
  Trash2,
  FileText,
  UserCheck2,
  ShieldAlert,
  HelpCircle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import {
  MedicationRecord,
  MedicationConflict,
  Provider,
  MedicalDocument,
  MedicationStatus
} from '../types/medical.ts';
import {
  createMedication,
  updateMedication,
  deleteMedication
} from '../services/api.ts';

interface MedicationsViewProps {
  medications: MedicationRecord[];
  conflicts: MedicationConflict[];
  providers: Provider[];
  documents: MedicalDocument[];
  onRefreshMedications: () => void;
  onSelectDocument: (doc: MedicalDocument) => void;
}

export const MedicationsView: React.FC<MedicationsViewProps> = ({
  medications,
  conflicts,
  providers,
  documents,
  onRefreshMedications,
  onSelectDocument
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMed, setEditingMed] = useState<MedicationRecord | null>(null);

  // New med form state
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [instructions, setInstructions] = useState('');
  const [providerId, setProviderId] = useState(providers[0]?.id || '');
  const [status, setStatus] = useState<MedicationStatus>('active_confirmed');
  const [condition, setCondition] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredMeds = medications.filter(m => {
    if (filterStatus === 'all') return true;
    return m.status === filterStatus;
  });

  const getStatusBadge = (st: MedicationStatus) => {
    switch (st) {
      case 'active_confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active Confirmed
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <HelpCircle className="w-3 h-3 mr-1" />
            Needs Clinician Review
          </span>
        );
      case 'historical':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 mr-1" />
            Historical Baseline
          </span>
        );
      case 'discontinued_confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Archive className="w-3 h-3 mr-1" />
            Discontinued
          </span>
        );
    }
  };

  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dose.trim()) return;
    const prov = providers.find(p => p.id === providerId);

    if (editingMed) {
      await updateMedication(editingMed.id, {
        name,
        dose,
        frequency,
        instructions,
        providerId,
        providerName: prov?.name || editingMed.providerName,
        status,
        condition,
        startDate
      });
      setEditingMed(null);
    } else {
      await createMedication({
        name,
        dose,
        frequency,
        instructions,
        providerId,
        providerName: prov?.name || 'Healthcare Provider',
        status,
        condition,
        startDate
      });
      setShowAddModal(false);
    }

    // Reset fields
    setName('');
    setDose('');
    setInstructions('');
    onRefreshMedications();
  };

  const handleQuickStatusChange = async (med: MedicationRecord, newStatus: MedicationStatus) => {
    await updateMedication(med.id, {
      status: newStatus,
      lastReviewedDate: new Date().toISOString().split('T')[0]
    });
    onRefreshMedications();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this medication record? Note: If this was part of an uploaded prescription, the original document remains in your vault.')) {
      await deleteMedication(id);
      onRefreshMedications();
    }
  };

  const handleStartEdit = (med: MedicationRecord) => {
    setEditingMed(med);
    setName(med.name);
    setDose(med.dose);
    setFrequency(med.frequency);
    setInstructions(med.instructions);
    setProviderId(med.providerId);
    setStatus(med.status);
    setCondition(med.condition || '');
    setStartDate(med.startDate || new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Medication History & Reconciliation</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Automated conflict detection, dosage tracking, and clinician handover verification
          </p>
        </div>

        <button
          onClick={() => {
            setEditingMed(null);
            setName('');
            setDose('');
            setShowAddModal(true);
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Medication Reconciliation Alerts Banner */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-900">
                Active Medication Reconciliation Center ({conflicts.length} findings)
              </h2>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Differences detected across uploaded prescriptions and provider consults.
                These prompts are formulated for review by your doctor or pharmacist.
                <strong> LockMyHealth does not alter your doses or advise stopping medications independently.</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {conflicts.map(cnf => (
              <div key={cnf.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-sm">{cnf.medicationName}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    cnf.severity === 'warning' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cnf.type.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-slate-700 font-medium">{cnf.description}</p>

                <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-semibold text-[11px] flex items-start space-x-1.5">
                  <span className="shrink-0">💡</span>
                  <span>{cnf.clinicalPrompt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: `All Medications (${medications.length})` },
          { id: 'active_confirmed', label: `Active Confirmed (${medications.filter(m => m.status === 'active_confirmed').length})` },
          { id: 'needs_review', label: `Needs Review (${medications.filter(m => m.status === 'needs_review').length})` },
          { id: 'historical', label: `Historical (${medications.filter(m => m.status === 'historical').length})` },
          { id: 'discontinued_confirmed', label: `Discontinued (${medications.filter(m => m.status === 'discontinued_confirmed').length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterStatus === tab.id
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Medications List */}
      <div className="space-y-3">
        {filteredMeds.map(med => {
          const linkedDoc = documents.find(d => d.id === med.documentId);
          return (
            <div
              key={med.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-teal-300 transition-all flex flex-wrap items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-[280px]">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">{med.name}</h3>
                  <span className="text-sm font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                    {med.dose}
                  </span>
                  {getStatusBadge(med.status)}
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">
                    Instructions: <span className="font-normal">{med.instructions || med.frequency}</span>
                  </p>
                  <p className="text-slate-500">
                    Prescribed by <strong className="text-slate-700">{med.providerName}</strong>
                    {med.startDate && ` • Started ${med.startDate}`}
                    {med.endDate && ` • Discontinued ${med.endDate}`}
                    {med.condition && ` • For: ${med.condition}`}
                  </p>
                  {med.patientNotes && (
                    <p className="text-[11px] text-teal-800 bg-teal-50/70 p-1.5 rounded inline-block">
                      Patient note: {med.patientNotes}
                    </p>
                  )}
                </div>

                {linkedDoc && (
                  <div className="pt-1 flex items-center space-x-2 text-xs">
                    <span className="text-slate-400">Supporting prescription:</span>
                    <button
                      onClick={() => onSelectDocument(linkedDoc)}
                      className="text-teal-700 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{linkedDoc.title}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Status toggles & Edit buttons */}
              <div className="flex flex-col sm:items-end space-y-2">
                <div className="flex items-center space-x-1.5">
                  <select
                    value={med.status}
                    onChange={e => handleQuickStatusChange(med, e.target.value as MedicationStatus)}
                    className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-teal-500"
                  >
                    <option value="active_confirmed">Active Confirmed</option>
                    <option value="needs_review">Needs Review</option>
                    <option value="historical">Historical</option>
                    <option value="discontinued_confirmed">Discontinued</option>
                  </select>

                  <button
                    onClick={() => handleStartEdit(med)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Edit record"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(med.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {med.lastReviewedDate && (
                  <span className="text-[10px] text-slate-400">
                    Reviewed {med.lastReviewedDate}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredMeds.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <Pill className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-700 font-semibold text-xs">No medications in this category.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Medication Modal */}
      {(showAddModal || editingMed) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingMed ? 'Edit Medication Entry' : 'Add Medication Entry'}
            </h3>

            <form onSubmit={handleSaveMedication} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medication Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metformin ER"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dose / Strength *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1000 mg"
                    value={dose}
                    onChange={e => setDose(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    placeholder="e.g. Once daily with dinner"
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as MedicationStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500 bg-white"
                  >
                    <option value="active_confirmed">Active Confirmed</option>
                    <option value="needs_review">Needs Review</option>
                    <option value="historical">Historical Baseline</option>
                    <option value="discontinued_confirmed">Discontinued</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prescribing Doctor</label>
                <select
                  value={providerId}
                  onChange={e => setProviderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500 bg-white"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions & Precautions</label>
                <input
                  type="text"
                  placeholder="e.g. Take with food, avoid alcohol, monitor glucose"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Condition Treated</label>
                  <input
                    type="text"
                    placeholder="e.g. Type 2 Diabetes"
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMed(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
