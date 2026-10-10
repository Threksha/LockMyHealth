import React from 'react';
import { ShieldCheck, RefreshCw, UserCheck } from 'lucide-react';

interface DemoBannerProps {
  isDemo: boolean;
  onResetDemo: () => void;
  onSwitchAccount: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ isDemo, onResetDemo, onSwitchAccount }) => {
  if (!isDemo) return null;

  return (
    <div className="bg-teal-50 border-b border-teal-200 px-4 py-2.5 text-xs sm:text-sm text-teal-900 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center space-x-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-200 text-teal-800">
          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-teal-700" />
          Synthetic Demo Mode
        </span>
        <span className="text-teal-800">
          Exploring as <strong>Rajesh Kumar</strong> (58y, T2D & Hypertension). All clinical data is synthetic.
        </span>
      </div>

      <div className="flex items-center space-x-2 ml-auto">
        <button
          onClick={onResetDemo}
          className="inline-flex items-center px-2.5 py-1 rounded border border-teal-300 bg-white text-teal-700 hover:bg-teal-100 hover:text-teal-900 transition-colors shadow-2xs font-medium text-xs cursor-pointer"
          title="Reset synthetic data to baseline"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Reset Demo Data
        </button>
        <button
          onClick={onSwitchAccount}
          className="inline-flex items-center px-2.5 py-1 rounded bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-2xs font-medium text-xs cursor-pointer"
        >
          <UserCheck className="w-3 h-3 mr-1" />
          Switch / New Account
        </button>
      </div>
    </div>
  );
};
