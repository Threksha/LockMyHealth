import React from 'react';
import {
  X,
  ShieldAlert,
  Phone,
  Printer,
  Heart,
  AlertOctagon,
  Pill,
  Hospital,
  QrCode,
  CheckCircle2
} from 'lucide-react';
import { EmergencyHealthCard } from '../types/medical.ts';

interface EmergencyCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: EmergencyHealthCard | null;
  onEditSettings?: () => void;
}

export const EmergencyCardModal: React.FC<EmergencyCardModalProps> = ({
  isOpen,
  onClose,
  card,
  onEditSettings
}) => {
  if (!isOpen || !card) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="bg-rose-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Emergency Health Card</h2>
              <p className="text-xs text-rose-100">Critical Medical Information for First Responders</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
              title="Print Emergency Card"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Content (Printable zone) */}
        <div className="p-6 space-y-6 printable-card">
          {/* Patient Core Identifier */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Patient Full Name</span>
              <h3 className="text-xl font-bold text-slate-900">{card.patientName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Date of Birth: {card.dob}</p>
            </div>
            <div className="text-right flex items-center space-x-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-rose-100 border border-rose-200 text-rose-800 text-center">
                <span className="text-[10px] font-bold block uppercase tracking-wider">Blood Group</span>
                <span className="text-lg font-extrabold">{card.bloodGroup || 'B+'}</span>
              </div>
            </div>
          </div>

          {/* Critical Allergies (Highest priority alert) */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
            <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm mb-2">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Confirmed Severe Allergies & Sensitivities</span>
            </div>
            {card.confirmedAllergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {card.confirmedAllergies.map((allergy, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-white text-rose-800 border border-rose-300 shadow-2xs"
                  >
                    ⚠️ {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600">No known critical drug allergies confirmed on file.</p>
            )}
          </div>

          {/* Chronic Medical Conditions */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm mb-2">
              <Heart className="w-4 h-4 text-teal-600" />
              <span>Documented Chronic Conditions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {card.selectedConditions.map((cond, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200"
                >
                  {cond}
                </span>
              ))}
            </div>
          </div>

          {/* Current Confirmed Medications */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm mb-2">
              <Pill className="w-4 h-4 text-blue-600" />
              <span>Confirmed Active Daily Medications</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {card.confirmedMedications.map((med, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <strong className="text-slate-800">{med.name}</strong> - {med.dose}
                  <p className="text-slate-500 text-[11px] mt-0.5">{med.frequency}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contacts: Emergency Contact & Primary Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-700 font-semibold text-xs mb-1">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>Primary Emergency Contact</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{card.emergencyContact.name}</p>
              <p className="text-xs text-slate-600">{card.emergencyContact.relationship}</p>
              <p className="text-xs font-semibold text-teal-700 mt-1">{card.emergencyContact.phone}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-700 font-semibold text-xs mb-1">
                <Hospital className="w-3.5 h-3.5 text-teal-600" />
                <span>Attending Physician</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{card.primaryPhysician.name}</p>
              <p className="text-xs text-slate-600">{card.primaryPhysician.hospital}</p>
              <p className="text-xs font-semibold text-teal-700 mt-1">{card.primaryPhysician.phone}</p>
            </div>
          </div>

          {/* Access-Controlled Verification Notice & QR representation */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-teal-300 flex items-center justify-center shrink-0">
                <QrCode className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <p className="font-bold">Access-Controlled Emergency Link</p>
                <p className="text-[11px] text-teal-800">
                  Points to emergency triage records with access auditing. No public sensitive URL exposed.
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-1 bg-white text-teal-800 rounded border border-teal-300">
              Verified Card
            </span>
          </div>

          {/* Instructions disclaimer */}
          <p className="text-[11px] text-slate-400 text-center">
            Last updated: {new Date(card.lastUpdated).toLocaleDateString()} • LockMyHealth Patient Vault
          </p>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              if (onEditSettings) onEditSettings();
            }}
            className="text-xs font-medium text-slate-600 hover:text-teal-700 cursor-pointer"
          >
            Customize Card in Settings & Privacy →
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
