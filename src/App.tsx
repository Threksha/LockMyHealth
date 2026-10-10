import React, { useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  Provider,
  MedicalDocument,
  TimelineEvent,
  MedicationRecord,
  MedicationConflict,
  LabTestRecord,
  Appointment,
  EmergencyHealthCard
} from './types/medical.ts';
import {
  getCurrentUser,
  fetchProviders,
  fetchDocuments,
  fetchTimeline,
  fetchMedications,
  fetchMedicationConflicts,
  fetchLabResults,
  fetchAppointments,
  fetchEmergencyCard,
  resetDemoData,
  getStoredToken,
  clearStoredToken
} from './services/api.ts';

import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DemoBanner } from './components/DemoBanner.tsx';
import { EmergencyCardModal } from './components/EmergencyCardModal.tsx';
import { DocumentUploadModal } from './components/DocumentUploadModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { SharedDoctorView } from './components/SharedDoctorView.tsx';
import { PrepareVisitModal } from './components/PrepareVisitModal.tsx';

import { OverviewView } from './views/OverviewView.tsx';
import { DoctorsView } from './views/DoctorsView.tsx';
import { TimelineView } from './views/TimelineView.tsx';
import { VaultView } from './views/VaultView.tsx';
import { MedicationsView } from './views/MedicationsView.tsx';
import { LabResultsView } from './views/LabResultsView.tsx';
import { AppointmentsView } from './views/AppointmentsView.tsx';
import { AskLockMyHealthView } from './views/AskLockMyHealthView.tsx';
import { PrepareVisitView } from './views/PrepareVisitView.tsx';
import { ShareRecordsView } from './views/ShareRecordsView.tsx';
import { DoctorDashboardView } from './views/DoctorDashboardView.tsx';
import { DoctorSharingView } from './views/DoctorSharingView.tsx';
import { PrivacySettingsView } from './views/PrivacySettingsView.tsx';

export default function App() {
  // Routing / Token for shared doctor view
  const [sharedToken, setSharedToken] = useState<string | null>(null);

  // Core App State
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [conflicts, setConflicts] = useState<MedicationConflict[]>([]);
  const [labs, setLabs] = useState<LabTestRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [emergencyCard, setEmergencyCard] = useState<EmergencyHealthCard | null>(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isPrepareOpen, setIsPrepareOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Inspect document from other views
  const [inspectedDoc, setInspectedDoc] = useState<MedicalDocument | null>(null);

  // Check URL hash for shared access token e.g. #share=mt_share_... or /shared/...
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      const token = hash.replace('#share=', '');
      if (token) setSharedToken(token);
    } else if (hash.startsWith('#/shared/')) {
      const token = hash.replace('#/shared/', '');
      if (token) setSharedToken(token);
    }
  }, []);

  // Fetch all user records
  const loadAllData = useCallback(async () => {
    try {
      const [uData, pData, dData, tData, mData, cData, lData, aData, eData] = await Promise.all([
        getCurrentUser(),
        fetchProviders(),
        fetchDocuments(),
        fetchTimeline(),
        fetchMedications(),
        fetchMedicationConflicts(),
        fetchLabResults(),
        fetchAppointments(),
        fetchEmergencyCard()
      ]);

      setUser(uData.user);
      setIsDemo(uData.isDemo);
      setProviders(pData);
      setDocuments(dData);
      setTimeline(tData);
      setMedications(mData);
      setConflicts(cData);
      setLabs(lData);
      setAppointments(aData);
      setEmergencyCard(eData);
    } catch (err) {
      console.error('Error loading LockMyHealth data:', err);
      // A server restart or expired session invalidates in-memory auth sessions.
      // Clear stale browser tokens so the sign-in screen can be shown again.
      clearStoredToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (getStoredToken()) loadAllData();
  }, [loadAllData]);

  // Handle Demo Reset
  const handleResetDemo = async () => {
    if (window.confirm('Reset all demo data to initial synthetic patient baseline?')) {
      await resetDemoData();
      await loadAllData();
    }
  };

  // If a clinician opens a shared link, render the standalone read-only view
  if (sharedToken) {
    return (
      <SharedDoctorView
        token={sharedToken}
        onExit={() => {
          setSharedToken(null);
          window.location.hash = '';
        }}
      />
    );
  }

  // Unauthenticated visitors start at the Patient / Doctor login page.
  if (!getStoredToken()) {
    return (
      <LandingPage
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setIsDemo(loggedInUser.isDemo);
          if (loggedInUser.role === 'patient') {
            loadAllData();
          }
        }}
      />
    );
  }

  // Doctors use a dedicated consultation dashboard rather than the patient vault.
  if (user?.role === 'doctor') {
    return (
      <DoctorDashboardView
        doctor={user}
        onLogout={() => {
          clearStoredToken();
          setUser(null);
          window.location.reload();
        }}
      />
    );
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Command Center Overview';
      case 'doctors': return 'My Healthcare Providers';
      case 'timeline': return 'Unified Health Timeline';
      case 'vault': return 'Medical Document Vault';
      case 'medications': return 'Medications & Reconciliation';
      case 'labs': return 'Lab Results & Trends';
      case 'appointments': return 'Appointments & Reminders';
      case 'ask': return 'Ask LockMyHealth AI Assistant';
      case 'share': return 'Patient-Controlled Sharing';
      case 'settings': return 'Settings & Privacy Center';
      default: return 'LockMyHealth';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased">
      {/* Synthetic Demo Notification Banner */}
      <DemoBanner
        isDemo={isDemo}
        onResetDemo={handleResetDemo}
        onSwitchAccount={() => setIsAuthOpen(true)}
      />

      <div className="flex-1 flex">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          conflictCount={conflicts.length}
          upcomingCount={appointments.filter(a => a.status === 'upcoming').length}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <Header
            user={user}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenEmergencyCard={() => setIsEmergencyOpen(true)}
            onOpenPrepareVisit={() => setIsPrepareOpen(true)}
            activeTabTitle={getTabTitle()}
            onLogout={() => {
              clearStoredToken();
              setUser(null);
              window.location.reload();
            }}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {activeTab === 'overview' && (
              <OverviewView
                user={user}
                providers={providers}
                documents={documents}
                timeline={timeline}
                medications={medications}
                conflicts={conflicts}
                labs={labs}
                appointments={appointments}
                onNavigate={setActiveTab}
                onOpenUpload={() => setIsUploadOpen(true)}
                onOpenEmergencyCard={() => setIsEmergencyOpen(true)}
                onOpenPrepareVisit={() => setIsPrepareOpen(true)}
                onSelectDocument={(doc) => {
                  setInspectedDoc(doc);
                  setActiveTab('vault');
                }}
              />
            )}

            {activeTab === 'doctors' && (
              <DoctorsView
                providers={providers}
                documents={documents}
                onSelectDocument={(doc) => {
                  setInspectedDoc(doc);
                  setActiveTab('vault');
                }}
                onRefreshProviders={loadAllData}
                onPrepareForDoctor={() => setIsPrepareOpen(true)}
              />
            )}

            {activeTab === 'timeline' && (
              <TimelineView
                timeline={timeline}
                providers={providers}
                documents={documents}
                onSelectDocument={(doc) => {
                  setInspectedDoc(doc);
                  setActiveTab('vault');
                }}
                onRefreshTimeline={loadAllData}
              />
            )}

            {activeTab === 'vault' && (
              <VaultView
                documents={documents}
                providers={providers}
                onOpenUpload={() => setIsUploadOpen(true)}
                onRefreshDocuments={loadAllData}
                selectedDoc={inspectedDoc}
                onClearSelectedDoc={() => setInspectedDoc(null)}
              />
            )}

            {activeTab === 'medications' && (
              <MedicationsView
                medications={medications}
                conflicts={conflicts}
                providers={providers}
                documents={documents}
                onRefreshMedications={loadAllData}
                onSelectDocument={(doc) => {
                  setInspectedDoc(doc);
                  setActiveTab('vault');
                }}
              />
            )}

            {activeTab === 'labs' && (
              <LabResultsView
                labs={labs}
                providers={providers}
                documents={documents}
                onRefreshLabs={loadAllData}
                onSelectDocument={(doc) => {
                  setInspectedDoc(doc);
                  setActiveTab('vault');
                }}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentsView
                appointments={appointments}
                providers={providers}
                documents={documents}
                onRefreshAppointments={loadAllData}
                onSelectDocument={(doc) => {
                  setInspectedDoc(doc);
                  setActiveTab('vault');
                }}
              />
            )}

            {activeTab === 'ask' && (
              <AskLockMyHealthView
                documents={documents}
                onSelectDocument={(doc) => {
                  setInspectedDoc(doc);
                  setActiveTab('vault');
                }}
              />
            )}

            {activeTab === 'share' && (
              <DoctorSharingView
                documents={documents}
                onSelectDocument={(doc) => {
                  setInspectedDoc(doc);
                  setActiveTab('vault');
                }}
              />
            )}

            {activeTab === 'settings' && (
              <PrivacySettingsView
                user={user}
                onRefreshAll={loadAllData}
                onOpenEmergencyModal={() => setIsEmergencyOpen(true)}
              />
            )}
          </main>
        </div>
      </div>

      {/* Upload Document Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        providers={providers}
        onUploadSuccess={loadAllData}
      />

      {/* Emergency Card Modal */}
      <EmergencyCardModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        card={emergencyCard}
        onEditSettings={() => {
          setIsEmergencyOpen(false);
          setActiveTab('settings');
        }}
      />

      {/* Prepare for Next Visit Modal */}
      <PrepareVisitModal
        isOpen={isPrepareOpen}
        onClose={() => setIsPrepareOpen(false)}
      />

      {/* Auth / Demo Switcher Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={loadAllData}
      />
    </div>
  );
}
