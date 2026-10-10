import React, { useState } from 'react';
import {
  GitCommitVertical,
  Calendar,
  Filter,
  Search,
  FileText,
  UserCheck2,
  Stethoscope,
  Pill,
  TestTube2,
  AlertCircle,
  Plus,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { TimelineEvent, Provider, MedicalDocument } from '../types/medical.ts';
import { createTimelineEvent } from '../services/api.ts';

interface TimelineViewProps {
  timeline: TimelineEvent[];
  providers: Provider[];
  documents: MedicalDocument[];
  onSelectDocument: (doc: MedicalDocument) => void;
  onRefreshTimeline: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  providers,
  documents,
  onSelectDocument,
  onRefreshTimeline
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newType, setNewType] = useState<TimelineEvent['type']>('consultation');
  const [newProviderId, setNewProviderId] = useState(providers[0]?.id || '');
  const [newDescription, setNewDescription] = useState('');
  const [newCondition, setNewCondition] = useState('');

  // Filter events
  const filteredEvents = timeline.filter(evt => {
    if (selectedProvider !== 'all' && evt.providerId !== selectedProvider) return false;
    if (selectedType !== 'all' && evt.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${evt.title} ${evt.description} ${evt.providerName} ${evt.condition || ''}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const prov = providers.find(p => p.id === newProviderId);
    await createTimelineEvent({
      title: newTitle,
      date: newDate,
      type: newType,
      providerId: newProviderId,
      providerName: prov?.name || 'Care Provider',
      description: newDescription,
      condition: newCondition || undefined,
      sourceType: 'patient_entered'
    });
    setShowAddModal(false);
    setNewTitle('');
    setNewDescription('');
    onRefreshTimeline();
  };

  const getSourceBadge = (sourceType: TimelineEvent['sourceType']) => {
    switch (sourceType) {
      case 'extracted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">Extracted from Source</span>;
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Clinician Confirmed</span>;
      case 'ai_explanation':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">AI Synthesized</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">Patient Entered</span>;
    }
  };

  const getTypeIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'prescription':
        return <Pill className="w-4 h-4 text-amber-600" />;
      case 'lab_result':
        return <TestTube2 className="w-4 h-4 text-blue-600" />;
      case 'consultation':
        return <Stethoscope className="w-4 h-4 text-teal-600" />;
      default:
        return <Calendar className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Unified Health Timeline</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Chronological continuum uniting doctor consultations, lab tests, diagnoses, and prescriptions
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Timeline Event</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search timeline events, conditions, doctors..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedProvider}
            onChange={e => setSelectedProvider(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 focus:outline-teal-500 bg-white"
          >
            <option value="all">All Providers</option>
            {providers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 focus:outline-teal-500 bg-white"
          >
            <option value="all">All Event Types</option>
            <option value="consultation">Consultations</option>
            <option value="prescription">Prescriptions</option>
            <option value="lab_result">Lab Results</option>
            <option value="diagnosis">Diagnoses</option>
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-teal-200">
        {filteredEvents.map(evt => {
          const linkedDoc = documents.find(d => d.id === evt.documentId);
          return (
            <div key={evt.id} className="relative group">
              {/* Timeline marker */}
              <div className="absolute -left-6 sm:-left-8 top-3 w-6 sm:w-8 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <div className="w-2 h-2 rounded-full bg-teal-600" />
                </div>
              </div>

              {/* Event card */}
              <div
                onClick={() => setSelectedEvent(evt)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                      {getTypeIcon(evt.type)}
                    </div>
                    <span className="text-xs font-bold text-slate-700">{evt.providerName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-semibold text-slate-500">{evt.date}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {evt.condition && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {evt.condition}
                      </span>
                    )}
                    {getSourceBadge(evt.sourceType)}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {evt.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                {linkedDoc && (
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                    <span className="text-slate-500 flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span>Supporting Document: <strong>{linkedDoc.title}</strong></span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDocument(linkedDoc);
                      }}
                      className="text-teal-700 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Open Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-600 text-sm font-semibold">No timeline events matched your filters.</p>
            <p className="text-slate-400 text-xs mt-1">Try clearing search terms or selecting all providers.</p>
          </div>
        )}
      </div>

      {/* Add Timeline Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Health Timeline Event</h3>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow-up consultation, medication titration"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Type *</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500 bg-white"
                  >
                    <option value="consultation">Doctor Consultation</option>
                    <option value="prescription">Prescription / Medication Change</option>
                    <option value="lab_result">Lab Results Review</option>
                    <option value="diagnosis">Diagnosis Documented</option>
                    <option value="hospital_visit">Hospital Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Provider *</label>
                <select
                  value={newProviderId}
                  onChange={e => setNewProviderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500 bg-white"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Condition</label>
                <input
                  type="text"
                  placeholder="e.g. Type 2 Diabetes, Hypertension"
                  value={newCondition}
                  onChange={e => setNewCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Details</label>
                <textarea
                  rows={3}
                  placeholder="Clinical observations, dosage instructions, patient progress..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
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
                  Save Timeline Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
