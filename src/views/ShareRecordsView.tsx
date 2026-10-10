import React, { useEffect, useState } from 'react';
import {
  Share2,
  Clock,
  ShieldCheck,
  Ban,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Eye,
  Calendar,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { ShareGrant, MedicalDocument } from '../types/medical.ts';
import { fetchShareGrants, createShareGrant, revokeShareGrant } from '../services/api.ts';

interface ShareRecordsViewProps {
  documents: MedicalDocument[];
  onOpenSharedDoctorView: (token: string) => void;
}

export const ShareRecordsView: React.FC<ShareRecordsViewProps> = ({
  documents,
  onOpenSharedDoctorView
}) => {
  const [grants, setGrants] = useState<ShareGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // New Grant Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [label, setLabel] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientRole, setRecipientRole] = useState('Consulting Physician');
  const [expiryHours, setExpiryHours] = useState(72);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'prescription',
    'lab_report',
    'consultation_note'
  ]);

  const refreshData = async () => {
    try {
      setLoading(true);
      const [g] = await Promise.all([fetchShareGrants()]);
      setGrants(g);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/#share=${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleRevoke = async (id: string) => {
    if (window.confirm('Revoke this share link immediately? The recipient will instantly lose access.')) {
      await revokeShareGrant(id);
      refreshData();
    }
  };

  const handleCreateGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !recipientName.trim()) return;

    await createShareGrant({
      label,
      recipientName,
      recipientRole,
      allowedCategories: selectedCategories,
      expiryHours
    });

    setShowCreateModal(false);
    setLabel('');
    setRecipientName('');
    refreshData();
  };

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Patient-Controlled Record Sharing</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate unguessable, scoped, read-only links with automatic expiry and instant revocation
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Share Link</span>
        </button>
      </div>

      {/* Security Principles Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 sm:p-5 flex items-start space-x-3 text-xs text-teal-900">
        <Lock className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm">Strict Security & Patient Data Boundary</p>
          <p className="leading-relaxed">
            Every share grant is protected by an unguessable 128-bit cryptographically secure token.
            Recipients are limited strictly to the categories you choose.
            Access is limited to the categories and expiry shown below.
            <em> Note: A recipient could copy or print information legitimately shown while active; revocation prevents subsequent access.</em>
          </p>
        </div>
      </div>

      {/* Active & Expired Grants */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Active & Previous Sharing Sessions ({grants.length})</h2>

        <div className="space-y-3">
          {grants.map(grant => {
            const isExpired = new Date() > new Date(grant.expiresAt);
            const isInactive = grant.isRevoked || isExpired;

            return (
              <div
                key={grant.id}
                className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all space-y-3 ${
                  isInactive ? 'border-slate-200 opacity-75' : 'border-teal-300 shadow-xs'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-base text-slate-900">{grant.label}</h3>
                      {grant.isRevoked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                          Revoked by Patient
                        </span>
                      ) : isExpired ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                          Active Valid Link
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">
                      Authorized for: <strong className="text-slate-800">{grant.recipientName}</strong> ({grant.recipientRole})
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {!isInactive && (
                      <>
                        <button
                          onClick={() => onOpenSharedDoctorView(grant.token)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-teal-300 text-teal-800 hover:bg-teal-50 text-xs font-semibold cursor-pointer"
                          title="Preview the exact screen the doctor sees"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview Doctor View</span>
                        </button>

                        <button
                          onClick={() => handleCopyLink(grant.token)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          {copiedToken === grant.token ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Copied Link</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-white" />
                              <span>Copy Secure Link</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleRevoke(grant.id)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Revoke Access</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Scopes & Expiry details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                  <div>
                    <span className="font-semibold block text-slate-700">Permitted Categories:</span>
                    <span className="capitalize">{grant.allowedCategories.join(', ').replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-700">Access Expiry:</span>
                    <span>{new Date(grant.expiresAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {grants.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Share2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-700 text-xs font-semibold">No share links created yet.</p>
              <p className="text-slate-400 text-xs mt-1">Create one when visiting a new clinic or specialist.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Share Grant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create Patient-Controlled Share Link</h3>
            <form onSubmit={handleCreateGrant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handover for Dr. Kavya Rao (Endocrinologist)"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Kavya Rao"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Specialty / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Endocrinologist"
                    value={recipientRole}
                    onChange={e => setRecipientRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Link Expiry Duration</label>
                <select
                  value={expiryHours}
                  onChange={e => setExpiryHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500 bg-white"
                >
                  <option value={24}>24 Hours (Single consultation day)</option>
                  <option value={72}>72 Hours (3 days - Recommended)</option>
                  <option value={168}>7 Days (1 week)</option>
                  <option value={720}>30 Days (Ongoing monthly review)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Allowed Record Categories (Scope Selection)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'prescription', label: 'Prescriptions' },
                    { id: 'lab_report', label: 'Laboratory Reports' },
                    { id: 'consultation_note', label: 'Consultation Notes' },
                    { id: 'imaging_scan', label: 'Imaging & Scans' },
                    { id: 'discharge_summary', label: 'Discharge Summaries' },
                    { id: 'allergy_record', label: 'Allergy Records' }
                  ].map(cat => (
                    <label key={cat.id} className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Generate Share Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
