import React from 'react';
import {
  Menu,
  HeartPulse,
  FileText,
  UploadCloud,
  ShieldAlert,
  User,
  Sparkles,
  LogOut
} from 'lucide-react';
import { UserProfile } from '../types/medical.ts';

interface HeaderProps {
  user: UserProfile | null;
  onOpenMobileMenu: () => void;
  onOpenUpload: () => void;
  onOpenEmergencyCard: () => void;
  onOpenPrepareVisit: () => void;
  activeTabTitle: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenMobileMenu,
  onOpenUpload,
  onOpenEmergencyCard,
  onOpenPrepareVisit,
  activeTabTitle,
  onLogout
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {activeTabTitle}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            LockMyHealth • Patient Health Continuity Command Center
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Prepare for next visit primary action */}
        <button
          onClick={onOpenPrepareVisit}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 hover:text-teal-900 transition-colors shadow-2xs cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="hidden md:inline">Prepare for Visit</span>
          <span className="md:hidden">Handover</span>
        </button>

        {/* Upload Document action */}
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer"
        >
          <UploadCloud className="w-4 h-4 text-white shrink-0" />
          <span className="hidden sm:inline">Upload Record</span>
          <span className="sm:hidden">Upload</span>
        </button>

        {/* Emergency Health Card button */}
        <button
          onClick={onOpenEmergencyCard}
          className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
          title="Open Emergency Medical Information Card"
        >
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="hidden sm:inline">Emergency Card</span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Log out of LockMyHealth"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Logout</span>
        </button>

        {/* Patient Profile Badge */}
        <div className="hidden lg:flex items-center pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <User className="w-4 h-4" />
          </div>
          <div className="ml-2 text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">
              {user?.name || 'there'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {user?.isDemo ? 'Synthetic Demo' : 'Verified Patient'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
