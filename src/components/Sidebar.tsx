import React from 'react';
import {
  LayoutDashboard,
  UserCheck2,
  GitCommitVertical,
  FolderArchive,
  Pill,
  TestTube2,
  CalendarClock,
  Sparkles,
  Share2,
  Shield,
  HeartPulse,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'doctors'
  | 'timeline'
  | 'vault'
  | 'medications'
  | 'labs'
  | 'appointments'
  | 'ask'
  | 'share'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  conflictCount?: number;
  upcomingCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  conflictCount = 0,
  upcomingCount = 0,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'overview' as ActiveTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'doctors' as ActiveTab, label: 'My Doctors', icon: UserCheck2 },
    { id: 'timeline' as ActiveTab, label: 'Health Timeline', icon: GitCommitVertical },
    { id: 'vault' as ActiveTab, label: 'Health Vault', icon: FolderArchive },
    {
      id: 'medications' as ActiveTab,
      label: 'Medications',
      icon: Pill,
      badge: conflictCount > 0 ? `${conflictCount} alert` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    { id: 'labs' as ActiveTab, label: 'Lab Results', icon: TestTube2 },
    {
      id: 'appointments' as ActiveTab,
      label: 'Appointments & Reminders',
      icon: CalendarClock,
      badge: upcomingCount > 0 ? `${upcomingCount}` : undefined,
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300'
    },
    {
      id: 'ask' as ActiveTab,
      label: 'Ask LockMyHealth',
      icon: Sparkles,
      highlight: true
    },
    { id: 'share' as ActiveTab, label: 'Share Records', icon: Share2 },
    { id: 'settings' as ActiveTab, label: 'Settings & Privacy', icon: Shield }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Branding */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/30">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-900 text-lg tracking-tight">LockMyHealth</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                  Health
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">Your health, connected.</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Care Management
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                    : item.highlight
                    ? 'text-teal-700 bg-teal-50/70 hover:bg-teal-100/70 hover:text-teal-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-teal-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center space-x-1.5 ml-2">
                  {item.badge && (
                    <span
                      className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full border ${
                        isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Quick Continuity Safeguard footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 m-2 rounded-xl">
          <div className="flex items-start space-x-2 text-xs text-slate-600">
            <Shield className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Private Health Vault</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Isolated storage, encrypted in transit. Controlled revocable sharing.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
