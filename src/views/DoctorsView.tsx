import React, { useState } from 'react';
import {
  UserCheck2,
  Folder,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Plus,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Stethoscope
} from 'lucide-react';
import { Provider, MedicalDocument } from '../types/medical.ts';
import { createProvider } from '../services/api.ts';

interface DoctorsViewProps {
  providers: Provider[];
  documents: MedicalDocument[];
  onSelectDocument: (doc: MedicalDocument) => void;
  onRefreshProviders: () => void;
  onPrepareForDoctor: (provider: Provider) => void;
}

export const DoctorsView: React.FC<DoctorsViewProps> = ({
  providers,
  documents,
  onSelectDocument,
  onRefreshProviders,
  onPrepareForDoctor
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Consultant Doctor');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newFacility, setNewFacility] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const selectedProvider = providers.find(p => p.id === selectedProviderId) || providers[0];
  const linkedDocuments = documents.filter(
    d => d.providerId === selectedProvider?.id || d.providerName.toLowerCase().includes(selectedProvider?.name.toLowerCase() || '___')
  );

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createProvider({
      name: newName,
      role: newRole,
      specialty: newSpecialty || 'General Practice',
      facility: newFacility || 'Clinic',
      phone: newPhone
    });
    setShowAddModal(false);
    setNewName('');
    onRefreshProviders();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">My Healthcare Providers</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Dedicated folder system connecting consultations, prescriptions, and lab reports by provider
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Provider</span>
        </button>
      </div>

      {/* Main Grid: Left Provider Folders, Right Provider Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Folders column */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Provider Folders ({providers.length})
          </h2>

          <div className="space-y-2">
            {providers.map(prov => {
              const count = documents.filter(
                d => d.providerId === prov.id || d.providerName.toLowerCase().includes(prov.name.toLowerCase())
              ).length;
              const isSelected = selectedProvider?.id === prov.id;

              return (
                <div
                  key={prov.id}
                  onClick={() => setSelectedProviderId(prov.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex items-start justify-between ${
                    isSelected
                      ? 'bg-teal-50 border-teal-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Folder className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{prov.name}</h3>
                      <p className="text-xs font-semibold text-teal-700">{prov.specialty}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">
                        {prov.facility}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? 'bg-white text-teal-800 border-teal-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {count} records
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Provider Deep View */}
        <div className="lg:col-span-8 space-y-6">
          {selectedProvider ? (
            <>
              {/* Provider Card Top Details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold">
                      <Stethoscope className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {selectedProvider.role}
                      </span>
                      <h2 className="text-xl font-extrabold text-slate-900 mt-1">{selectedProvider.name}</h2>
                      <p className="text-xs font-semibold text-slate-600">{selectedProvider.specialty}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onPrepareForDoctor(selectedProvider)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Prepare Handover for this Provider</span>
                  </button>
                </div>

                {/* Contact info badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="truncate">{selectedProvider.facility}</span>
                  </div>
                  {selectedProvider.phone && (
                    <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="truncate">{selectedProvider.phone}</span>
                    </div>
                  )}
                  {selectedProvider.email && (
                    <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="truncate">{selectedProvider.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Records Filed Under this Provider */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Filed Records ({linkedDocuments.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Linked to {selectedProvider.name} and unified in the global health timeline
                    </p>
                  </div>
                </div>

                {linkedDocuments.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {linkedDocuments.map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => onSelectDocument(doc)}
                        className="py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                              {doc.category.replace('_', ' ')}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900">{doc.title}</h4>
                          </div>
                          <p className="text-xs text-slate-500">
                            Date: <strong>{doc.documentDate}</strong> • Condition: {doc.primaryCondition || 'General review'}
                          </p>
                          {doc.notes && <p className="text-xs text-slate-600 italic">"{doc.notes}"</p>}
                        </div>

                        <span className="text-xs font-semibold text-teal-700 flex items-center space-x-1">
                          <span>View Details</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No records filed under this doctor yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Upload a prescription or report selecting this provider.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500 text-sm">Select a provider folder on the left.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Healthcare Provider</h3>
            <form onSubmit={handleAddProvider} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Provider Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Khanna"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiologist, General Physician, Diagnostic Lab"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology, Endocrinology, Pathology"
                  value={newSpecialty}
                  onChange={e => setNewSpecialty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Facility / Hospital / Clinic</label>
                <input
                  type="text"
                  placeholder="e.g. City General Hospital, Clinic 301"
                  value={newFacility}
                  onChange={e => setNewFacility(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 000-0000"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
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
                  Save Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
