import React, { useState } from 'react';
import {
  FolderArchive,
  Search,
  Filter,
  FileText,
  Trash2,
  Edit2,
  ExternalLink,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Eye,
  AlertCircle,
  X
} from 'lucide-react';
import { MedicalDocument, DocumentCategory, Provider } from '../types/medical.ts';
import { deleteDocument, updateDocument } from '../services/api.ts';

interface VaultViewProps {
  documents: MedicalDocument[];
  providers: Provider[];
  onOpenUpload: () => void;
  onRefreshDocuments: () => void;
  selectedDoc?: MedicalDocument | null;
  onClearSelectedDoc?: () => void;
}

export const VaultView: React.FC<VaultViewProps> = ({
  documents,
  providers,
  onOpenUpload,
  onRefreshDocuments,
  selectedDoc,
  onClearSelectedDoc
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<MedicalDocument | null>(selectedDoc || null);

  React.useEffect(() => {
    if (selectedDoc) {
      setPreviewDoc(selectedDoc);
    }
  }, [selectedDoc]);

  const handleClosePreview = () => {
    setPreviewDoc(null);
    onClearSelectedDoc?.();
  };
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<MedicalDocument | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Records' },
    { id: 'prescription', label: 'Prescriptions' },
    { id: 'lab_report', label: 'Lab Reports' },
    { id: 'consultation_note', label: 'Doctor Notes' },
    { id: 'imaging_scan', label: 'Imaging & Scans' },
    { id: 'discharge_summary', label: 'Discharge Summaries' },
    { id: 'allergy_record', label: 'Allergies' },
    { id: 'other', label: 'Other' }
  ];

  const filteredDocs = documents.filter(doc => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
    if (selectedProvider !== 'all' && doc.providerId !== selectedProvider) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = `${doc.title} ${doc.providerName} ${doc.primaryCondition || ''} ${doc.notes || ''} ${doc.ocrTextPreview || ''}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document from your vault? Associated timeline references will also be removed.')) {
      setIsDeleting(id);
      try {
        await deleteDocument(id);
        if (previewDoc?.id === id) setPreviewDoc(null);
        onRefreshDocuments();
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleStartEdit = (doc: MedicalDocument) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditNotes(doc.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    await updateDocument(editingDoc.id, {
      title: editTitle,
      notes: editNotes
    });
    setEditingDoc(null);
    onRefreshDocuments();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Health Vault</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Centralized, searchable medical-document archive with OCR previews and verified extraction
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => {
          const isSelected = selectedCategory === cat.id;
          const count = cat.id === 'all'
            ? documents.length
            : documents.filter(d => d.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search & Provider Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents by title, doctor, condition, or extracted text..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-teal-500"
          />
        </div>

        <select
          value={selectedProvider}
          onChange={e => setSelectedProvider(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 focus:outline-teal-500 bg-white"
        >
          <option value="all">All Care Providers</option>
          {providers.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map(doc => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-400 hover:shadow-xs transition-all p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                  {doc.category.replace('_', ' ')}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {doc.documentDate}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 line-clamp-1">{doc.title}</h3>
                <p className="text-xs font-semibold text-teal-700 mt-0.5">{doc.providerName}</p>
                {doc.primaryCondition && (
                  <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                    {doc.primaryCondition}
                  </span>
                )}
              </div>

              {doc.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                  "{doc.notes}"
                </p>
              )}

              {/* OCR preview snippet */}
              {doc.ocrTextPreview && (
                <div className="text-[11px] text-slate-400 line-clamp-2 font-mono bg-slate-50/50 p-2 rounded-lg">
                  {doc.ocrTextPreview}
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setPreviewDoc(doc)}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Details</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleStartEdit(doc)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Edit metadata"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={isDeleting === doc.id}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Delete record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <FolderArchive className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No documents found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or upload a new medical document to your LockMyHealth vault.
          </p>
        </div>
      )}

      {/* Document Details & OCR Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                  {previewDoc.category.replace('_', ' ')}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{previewDoc.title}</h2>
                <p className="text-xs text-slate-500">
                  {previewDoc.providerName} • Recorded {previewDoc.documentDate}
                </p>
              </div>
              <button
                onClick={handleClosePreview}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Extracted Data Section */}
            {previewDoc.extractedData && (
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-3">
                <div className="flex items-center space-x-2 text-teal-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Structured Extracted Clinical Facts</span>
                </div>

                {previewDoc.extractedData.medications && previewDoc.extractedData.medications.length > 0 && (
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-slate-700">Prescribed Medications:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                      {previewDoc.extractedData.medications.map((m, i) => (
                        <li key={i}>
                          <strong>{m.name}</strong> {m.dose} ({m.frequency || 'Daily'})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {previewDoc.extractedData.labResults && previewDoc.extractedData.labResults.length > 0 && (
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-slate-700">Laboratory Values:</span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {previewDoc.extractedData.labResults.map((l, i) => (
                        <div key={i} className="p-2 bg-white rounded border border-teal-200">
                          <strong>{l.testName}</strong>: {l.value} {l.unit}
                          <p className="text-[10px] text-slate-500">Ref: {l.referenceRange || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Document Text Content / OCR */}
            {previewDoc.ocrTextPreview && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Document Text Preview
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {previewDoc.ocrTextPreview}
                </div>
              </div>
            )}

            {/* File Reference & Metadata */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-500">
              <p>File: <strong className="text-slate-700">{previewDoc.fileName}</strong> ({(previewDoc.fileSize / 1024).toFixed(0)} KB)</p>
              <p>Uploaded: {new Date(previewDoc.uploadedAt).toLocaleString()}</p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <a
                href={previewDoc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold cursor-pointer"
              >
                <span>Open Raw Document</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleClosePreview}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Edit Document Metadata</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Personal Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
