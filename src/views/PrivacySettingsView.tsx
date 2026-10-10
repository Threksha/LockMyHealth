import React, { useEffect, useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Download,
  RefreshCw,
  User,
  Heart,
  Phone,
  AlertTriangle,
  Lock,
  FileCheck,
  Check
} from 'lucide-react';
import { EmergencyHealthCard, UserProfile } from '../types/medical.ts';
import { fetchEmergencyCard, updateEmergencyCard, resetDemoData } from '../services/api.ts';

interface PrivacySettingsViewProps {
  user: UserProfile | null;
  onRefreshAll: () => void;
  onOpenEmergencyModal: () => void;
}

export const PrivacySettingsView: React.FC<PrivacySettingsViewProps> = ({
  user,
  onRefreshAll,
  onOpenEmergencyModal
}) => {
  const [card, setCard] = useState<EmergencyHealthCard | null>(null);
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await fetchEmergencyCard();
      setCard(data);
      setBloodGroup(data.bloodGroup || 'B+');
      setContactName(data.emergencyContact?.name || '');
      setContactPhone(data.emergencyContact?.phone || '');
    }
    load();
  }, []);

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    setIsSaving(true);
    await updateEmergencyCard({
      bloodGroup,
      emergencyContact: {
        ...card.emergencyContact,
        name: contactName,
        phone: contactPhone
      }
    });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportData = () => {
    window.open('/api/documents', '_blank');
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset all demo patient data to the original synthetic clinical baseline?')) {
      await resetDemoData();
      onRefreshAll();
      alert('Demo data restored to initial synthetic baseline.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Settings & Privacy Center</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your emergency health card, security parameters, and data governance
        </p>
      </div>

      {/* Emergency Health Card Customization Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Emergency Health Card Configuration</h2>
            <p className="text-xs text-slate-500">
              Control the critical data displayed on your printable emergency triage card
            </p>
          </div>

          <button
            onClick={onOpenEmergencyModal}
            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 cursor-pointer"
          >
            Preview Emergency Card →
          </button>
        </div>

        <form onSubmit={handleSaveCard} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500 bg-white"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center">
                <Check className="w-4 h-4 mr-1 text-emerald-600" />
                Emergency card settings updated.
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="ml-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Card Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Data Governance & Export */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Data Governance & Ownership</h2>
          <p className="text-xs text-slate-500">
            Export your entire medical history or restore synthetic demo data
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center">
              <Download className="w-4 h-4 text-teal-600 mr-1.5" />
              Download Vault Archive (JSON)
            </h3>
            <p className="text-xs text-slate-600">
              Download all document metadata, prescriptions, and lab values in structured JSON format.
            </p>
            <button
              onClick={handleExportData}
              className="mt-2 px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-800 text-xs font-semibold cursor-pointer"
            >
              Export JSON Records
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center">
              <RefreshCw className="w-4 h-4 text-teal-600 mr-1.5" />
              Reset Synthetic Demo Data
            </h3>
            <p className="text-xs text-slate-600">
              Restores this patient account to its baseline state.
            </p>
            <button
              onClick={handleResetDemo}
              className="mt-2 px-3.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
            >
              Reset Demo Records
            </button>
          </div>
        </div>
      </div>

      {/* Security Architecture Guarantee */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xs text-slate-600 space-y-2.5">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
          <Lock className="w-4 h-4 text-teal-600" />
          <span>Security Architecture & Non-Negotiable Boundaries</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-600">
          <li><strong>Data Isolation:</strong> Records are strictly partitioned by patient ID and validated server-side.</li>
          <li><strong>Zero Secret Leakage:</strong> Gemini API keys are maintained exclusively on the server backend.</li>
          <li><strong>Scoped Sharing:</strong> Share tokens enforce strict category and date filtering without exposing database IDs.</li>
          <li><strong>Access Audit:</strong> All token access attempts are recorded in an audit log with client timestamps.</li>
        </ul>
      </div>
    </div>
  );
};
