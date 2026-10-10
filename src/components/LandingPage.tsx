import React, { useState } from 'react';
import {
  Shield,
  Stethoscope,
  User,
  QrCode,
  Lock,
  ArrowRight,
  FileCheck2,
  Clock,
  Sparkles,
  KeyRound,
  EyeOff,
  Hospital,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { loginUser, registerUser } from '../services/api.ts';
import { UserProfile } from '../types/medical.ts';

interface LandingPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [activeModalTab, setActiveModalTab] = useState<'patient' | 'doctor' | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('Internal Medicine');
  const [hospital, setHospital] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide an email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const isDoctor = activeModalTab === 'doctor';
      const role = isDoctor ? 'doctor' : 'patient';
      const accountName = authMode === 'signup' ? name.trim() : (isDoctor ? (doctorName.trim() || name.trim()) : name.trim());
      const res = authMode === 'signup'
        ? await registerUser({
            email: email.trim(), password, name: accountName, role,
            specialty: isDoctor ? specialty : undefined,
            hospitalOrFacility: isDoctor ? hospital : undefined
          })
        : await loginUser({
            email: email.trim(), password, role,
            name: isDoctor ? (doctorName ? (doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`) : undefined) : undefined,
            specialty: isDoctor ? specialty : undefined,
            hospitalOrFacility: isDoctor ? hospital : undefined
          });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || (authMode === 'signup' ? 'Account creation failed' : 'Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center shadow-sm shadow-teal-700/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">LockMyHealth</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Role-Protected
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Your health, locked & connected.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                setActiveModalTab('patient');
                setAuthMode('signin');
                setError(null);
              }}
              className="text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-900 px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer"
            >
              Patient Sign In
            </button>
            <button
              onClick={() => {
                setActiveModalTab('doctor');
                setAuthMode('signin');
                setError(null);
              }}
              className="text-xs sm:text-sm font-semibold bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Portal Switcher */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-teal-600" />
            <span>Zero-Leakage Patient–Doctor Consultation Access</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Take Control of Your Medical Records. <br />
            <span className="bg-gradient-to-r from-teal-700 to-teal-500 bg-clip-text text-transparent">
              Share With Confidence.
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            LockMyHealth allows patients to keep an encrypted, organized medical records vault,
            select only the specific reports needed for an upcoming visit, and grant temporary single-session
            access via secure QR codes or short tokens.
          </p>
        </div>

        {/* Two Clearly Separated Role Portals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* 1. Patient Portal Card */}
          <div className="bg-white rounded-3xl border-2 border-teal-200 shadow-sm hover:shadow-md transition-all p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-teal-50 rounded-bl-full -mr-6 -mt-6 transition-all group-hover:scale-105 pointer-events-none" />

            <div className="space-y-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30">
                <User className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold text-slate-900">Patient Portal</h2>
                  <span className="text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-md">
                    Full Vault
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Upload and organize prescriptions, diagnostic lab panels, scans, and consultation notes.
                  Start controlled sharing sessions and revoke clinician access at any time.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center space-x-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Granular record selection (pick specific labs & prescriptions)</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Generate unique 6-character code & consultation QR</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Track sharing history & instantly end active sessions</span>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-3 relative z-10">
              <button
                onClick={() => {
                  setActiveModalTab('patient');
                  setError(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Enter Patient Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Doctor Portal Card */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-teal-300 shadow-sm hover:shadow-md transition-all p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-slate-100 rounded-bl-full -mr-6 -mt-6 transition-all group-hover:scale-105 pointer-events-none" />

            <div className="space-y-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/30">
                <Stethoscope className="w-7 h-7 text-teal-400" />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold text-slate-900">Doctor Portal</h2>
                  <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                    Clinical Review
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Scan patient QR codes or type sharing tokens during consultations.
                  Access strictly authorized records in a streamlined clinical view, then end the consultation.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center space-x-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Camera QR scanner & manual code verification</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Access restricted strictly to patient-selected records</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Previously treated patient list (no permanent record access)</span>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-3 relative z-10">
              <button
                onClick={() => {
                  setActiveModalTab('doctor');
                  setError(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Enter Doctor Portal</span>
                <ArrowRight className="w-4 h-4 text-teal-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Security Principles Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-5xl mx-auto shadow-2xs space-y-6">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">Why LockMyHealth is Safe for Sensitive Medical Data</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-teal-800 font-bold text-sm">
                <KeyRound className="w-4 h-4 text-teal-600" />
                <span>Zero Permanent Access</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Doctors do not get persistent access to your charts. Every visit requires a freshly generated session code that expires automatically.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-teal-800 font-bold text-sm">
                <EyeOff className="w-4 h-4 text-teal-600" />
                <span>Server-Side Enforced Scoping</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you select 2 out of 10 reports, the backend API strictly filters out the remaining 8. Clinicians cannot bypass filters or peek into unshared files.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-teal-800 font-bold text-sm">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Instant Patient Revocation</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clicking "End Session" immediately terminates server access. A clinician who already has the page open is immediately locked out.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} LockMyHealth — Privacy-First Patient-Doctor Continuity Vault. Secure patient and clinician record management.</p>
        </div>
      </footer>

      {/* Role Sign-In Modal */}
      {activeModalTab && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  {activeModalTab === 'doctor' ? <Stethoscope className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {authMode === 'signup' ? (activeModalTab === 'doctor' ? 'Create Doctor Account' : 'Create Patient Account') : (activeModalTab === 'doctor' ? 'Doctor Portal Sign In' : 'Patient Portal Sign In')}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalTab(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Role switch toggle */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab('patient');
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  activeModalTab === 'patient' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                Patient Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab('doctor');
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  activeModalTab === 'doctor' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                Doctor / Clinician
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{activeModalTab === 'doctor' ? 'Full Name' : 'Full Name'}</label>
                  <input
                    type="text"
                    required
                    placeholder={activeModalTab === 'doctor' ? 'e.g. Maya Sharma' : 'e.g. Aarav Mehta'}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-teal-600"
                  />
                </div>
              )}
              {activeModalTab === 'doctor' && authMode === 'signup' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty</label>
                    <input
                      type="text"
                      placeholder="e.g. Cardiology"
                      value={specialty}
                      onChange={e => setSpecialty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Clinic</label>
                    <input
                      type="text"
                      placeholder="e.g. City Care Clinic"
                      value={hospital}
                      onChange={e => setHospital(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-teal-600"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder={activeModalTab === 'doctor' ? 'doctor@clinic.org' : 'patient@example.org'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={authMode === 'signup' ? 8 : undefined}
                  placeholder={authMode === 'signup' ? 'At least 8 characters' : 'Password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-teal-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>{loading ? (authMode === 'signup' ? 'Creating account...' : 'Authenticating...') : authMode === 'signup' ? 'Create Account' : (activeModalTab === 'doctor' ? 'Sign In as Doctor' : 'Sign In as Patient')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                }}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
              >
                {authMode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
