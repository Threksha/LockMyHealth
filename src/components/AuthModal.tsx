import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  User,
  KeyRound,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { loginUser } from '../services/api.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await loginUser({ email: 'demo@LockMyHealth.org', password: 'demo123', isDemo: true, role: 'patient' });
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await loginUser({ email: email.trim(), password: password.trim(), role: 'patient' });
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">LockMyHealth Access & Accounts</h2>
            <p className="text-xs text-slate-500">Switch between Synthetic Demo Mode and Personal Accounts</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Option 1: Instant Synthetic Demo for Judges */}
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-300 space-y-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-sm text-teal-900">Synthetic Demo Mode (Judge Sandbox)</h3>
          </div>
          <p className="text-xs text-teal-800 leading-relaxed">
            Preloaded with a realistic clinical history for <strong>Rajesh Kumar (58y)</strong> across multiple doctors, prescriptions, lab trends, and reconciliation alerts.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Explore as Synthetic Patient (Rajesh Kumar)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-2 text-xs text-slate-400 font-semibold uppercase">
            Or Personal Account
          </span>
        </div>

        {/* Option 2: Personal Patient Account */}
        <form onSubmit={handleCustomLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email / Patient Identifier</label>
            <input
              type="email"
              required
              placeholder="e.g. sarah.jenkins@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In / Create Isolated Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
};
