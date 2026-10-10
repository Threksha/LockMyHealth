import React, { useState } from 'react';
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Bell,
  MapPin,
  CheckSquare,
  Square,
  Sparkles,
  FileText
} from 'lucide-react';
import { Appointment, Provider, MedicalDocument } from '../types/medical.ts';
import { createAppointment, updateAppointment, deleteAppointment } from '../services/api.ts';

interface AppointmentsViewProps {
  appointments: Appointment[];
  providers: Provider[];
  documents: MedicalDocument[];
  onRefreshAppointments: () => void;
  onSelectDocument: (doc: MedicalDocument) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  providers,
  documents,
  onRefreshAppointments,
  onSelectDocument
}) => {
  const [filterTab, setFilterTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [providerId, setProviderId] = useState(providers[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [type, setType] = useState<Appointment['type']>('in_person');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([
    'Bring current medication list and inhaler canister',
    'Carry last lab report summary'
  ]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Notification status
  const [notifGranted, setNotifGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifGranted(perm === 'granted');
    }
  };

  const filtered = appointments.filter(a => {
    if (filterTab === 'upcoming') return a.status === 'upcoming' || a.status === 'rescheduled';
    if (filterTab === 'completed') return a.status === 'completed' || a.status === 'cancelled';
    return true;
  });

  const handleToggleChecklist = async (apt: Appointment, itemId: string) => {
    const updatedChecklist = apt.checklist.map(c => (c.id === itemId ? { ...c, checked: !c.checked } : c));
    await updateAppointment(apt.id, { checklist: updatedChecklist });
    onRefreshAppointments();
  };

  const handleUpdateStatus = async (apt: Appointment, status: Appointment['status']) => {
    await updateAppointment(apt.id, { status });
    onRefreshAppointments();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this appointment reminder?')) {
      await deleteAppointment(id);
      onRefreshAppointments();
    }
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const prov = providers.find(p => p.id === providerId);

    const checklist = checklistItems.map((text, idx) => ({
      id: `chk-${Date.now()}-${idx}`,
      text,
      checked: false
    }));

    if (editingApt) {
      await updateAppointment(editingApt.id, {
        title,
        providerId,
        providerName: prov?.name || editingApt.providerName,
        date,
        time,
        type,
        location,
        reason,
        notes
      });
      setEditingApt(null);
    } else {
      await createAppointment({
        title,
        providerId,
        providerName: prov?.name || 'Healthcare Provider',
        date,
        time,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
        type,
        status: 'upcoming',
        location,
        reason,
        notes,
        userConfirmed: true,
        checklist,
        reminderEnabled: true
      });
      setShowAddModal(false);
    }

    // Reset
    setTitle('');
    setReason('');
    setNotes('');
    onRefreshAppointments();
  };

  const handleStartEdit = (apt: Appointment) => {
    setEditingApt(apt);
    setTitle(apt.title);
    setProviderId(apt.providerId);
    setDate(apt.date);
    setTime(apt.time);
    setType(apt.type);
    setLocation(apt.location || '');
    setReason(apt.reason);
    setNotes(apt.notes || '');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Appointments & Care Reminders</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Consultations, pre-visit checklists, and extracted follow-up tracking
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {!notifGranted && (
            <button
              onClick={requestNotificationPermission}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              title="Enable browser notifications"
            >
              <Bell className="w-3.5 h-3.5 text-teal-600" />
              <span>Enable Notifications</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingApt(null);
              setTitle('');
              setShowAddModal(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Appointment</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        {[
          { id: 'upcoming', label: `Upcoming (${appointments.filter(a => a.status === 'upcoming' || a.status === 'rescheduled').length})` },
          { id: 'completed', label: `Completed / Past (${appointments.filter(a => a.status === 'completed' || a.status === 'cancelled').length})` },
          { id: 'all', label: `All Reminders (${appointments.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id as any)}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              filterTab === tab.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointment Cards */}
      <div className="space-y-4">
        {filtered.map(apt => {
          const linkedDoc = documents.find(d => d.id === apt.linkedDocumentId);
          return (
            <div
              key={apt.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 hover:border-teal-300 transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      apt.status === 'upcoming' ? 'bg-teal-100 text-teal-800' :
                      apt.status === 'rescheduled' ? 'bg-amber-100 text-amber-800' :
                      apt.status === 'completed' ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {apt.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 capitalize">
                      {apt.type.replace('_', ' ')}
                    </span>
                    {apt.extractedFromDoc && (
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center">
                        <Sparkles className="w-3 h-3 mr-1" />
                        From Prescription Follow-Up
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{apt.title}</h3>
                  <p className="text-xs font-semibold text-teal-700">{apt.providerName}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleStartEdit(apt)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Edit or Reschedule"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(apt.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Date, Time, Location Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Date: <strong>{apt.date}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Time: <strong>{apt.time}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="truncate">{apt.location || 'Clinic Location'}</span>
                </div>
              </div>

              {apt.reason && (
                <p className="text-xs text-slate-600">
                  <strong>Reason for Visit:</strong> {apt.reason}
                </p>
              )}

              {/* Visit Preparation Checklist */}
              {apt.checklist && apt.checklist.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Preparation Checklist ({apt.checklist.filter(c => c.checked).length}/{apt.checklist.length} Completed)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {apt.checklist.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleChecklist(apt, item.id)}
                        className={`p-2.5 rounded-xl border flex items-center space-x-2 text-xs transition-colors cursor-pointer ${
                          item.checked
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 line-through opacity-80'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-teal-400'
                        }`}
                      >
                        {item.checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status buttons footer */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100">
                {linkedDoc && (
                  <button
                    onClick={() => onSelectDocument(linkedDoc)}
                    className="text-teal-700 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Originating Document: {linkedDoc.title}</span>
                  </button>
                )}

                <div className="flex items-center space-x-2 ml-auto">
                  {apt.status === 'upcoming' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(apt, 'completed')}
                        className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200 cursor-pointer"
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(apt, 'cancelled')}
                        className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
            <CalendarClock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-700 text-xs font-semibold">No appointments in this view.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Appointment Modal */}
      {(showAddModal || editingApt) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingApt ? 'Edit / Reschedule Appointment' : 'Schedule Care Appointment'}
            </h3>

            <form onSubmit={handleSaveAppointment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Endocrine 3-Month Follow-Up"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time *</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Provider</label>
                  <select
                    value={providerId}
                    onChange={e => setProviderId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500 bg-white"
                  >
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Visit Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500 bg-white"
                  >
                    <option value="in_person">In-Person Consultation</option>
                    <option value="video_consult">Telehealth Video</option>
                    <option value="lab_draw">Diagnostic Lab Draw</option>
                    <option value="follow_up">Nurse / Clinic Follow-up</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Clinic Suite</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Endocrine Care, Suite 300"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Consultation</label>
                <input
                  type="text"
                  placeholder="e.g. Review fasting blood glucose and HbA1c progress"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingApt(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
