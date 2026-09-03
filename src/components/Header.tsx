import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  Calendar,
  User,
  SlidersHorizontal,
  Briefcase,
  CheckCircle2,
  LogOut,
  Scale,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { Advocate } from '../types';
import { loadVisibleStaffRoster, isSysAdminUser } from '../utils/staffStorage';
import { ChangePasswordModal } from './ChangePasswordModal';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenAIAssistant?: () => void;
  setMobileOpen: (open: boolean) => void;
  unreadCount: number;
  currentAdvocate: Advocate;
  onSelectAdvocate: (advocate: Advocate) => void;
  onLogout?: () => void;
  advocates?: Advocate[];
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenNotifications,
  onOpenAIAssistant,
  setMobileOpen,
  unreadCount,
  currentAdvocate,
  onSelectAdvocate,
  onLogout,
  advocates = loadVisibleStaffRoster(),
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getRoleBadgeInfo = (adv: Advocate) => {
    const role =
      adv.role ||
      (adv.isSystemAdmin || adv.isDeveloper
        ? 'System Admin'
        : adv.title.toLowerCase().includes('managing')
        ? 'Managing Advocate'
        : adv.title.toLowerCase().includes('consultant')
        ? 'Consultant Advocate'
        : adv.title.toLowerCase().includes('manager')
        ? 'Office Manager'
        : adv.title.toLowerCase().includes('clerk') ||
          adv.title.toLowerCase().includes('assistant')
        ? 'Legal Support Clerk'
        : 'Advocate');

    switch (role) {
      case 'System Admin':
        return {
          label: 'System Admin',
          badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200',
          ruleDesc:
            'System Administrator / Developer: Unrestricted superuser access to all files, registries, financial audits & system settings.',
        };
      case 'Managing Advocate':
        return {
          label: 'Managing Advocate',
          badgeClass: 'text-amber-800 bg-amber-50 border-amber-200',
          ruleDesc:
            'Managing Advocate: Full firmwide authority over all matters, trust accounts, SLA compliance & staff assignments.',
        };
      case 'Consultant Advocate':
        return {
          label: 'Consultant Advocate',
          badgeClass: 'text-purple-700 bg-purple-50 border-purple-200',
          ruleDesc:
            'Consultant Advocate: High-level advisory access to consulted matters, legal opinions, client briefs & billable time logs.',
        };
      case 'Advocate':
        return {
          label: 'Advocate',
          badgeClass: 'text-blue-700 bg-blue-50 border-blue-200',
          ruleDesc:
            'Advocate: Full case handling for assigned litigation, conveyancing & commercial files, hearings & court documents.',
        };
      case 'Office Manager':
        return {
          label: 'Office Manager',
          badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          ruleDesc:
            'Office Manager: Full operational oversight over firm workspace registry, billing fee notes, HRM leave & client services.',
        };
      case 'Legal Support Clerk':
        return {
          label: 'Legal Support Clerk',
          badgeClass: 'text-teal-700 bg-teal-50 border-teal-200',
          ruleDesc:
            'Legal Support Clerk: CTS e-filing registry, process service tracking, client reception inquiries & court document delivery.',
        };
      default:
        return {
          label: role,
          badgeClass: 'text-slate-700 bg-slate-100 border-slate-200',
          ruleDesc: 'Staff Member: Access to firm workspace and assigned tasks.',
        };
    }
  };

  const currentRoleInfo = getRoleBadgeInfo(currentAdvocate);

  const isDevAdmin =
    Boolean(currentAdvocate.isDeveloper) ||
    Boolean(currentAdvocate.isSystemAdmin) ||
    currentAdvocate.id === 'dev-admin';

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(currentDate);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
      {/* Title & Mobile Nav Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden cursor-pointer"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-amber-700">
            Firm Workspace
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Header Actions: Search, AI Co-Pilot, Notifications, Advocate Switcher */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Global Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-2 text-xs text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-900 focus:outline-none cursor-pointer shadow-2xs"
          aria-label="Search matters and clients"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden sm:inline text-slate-600 font-normal">Search matters or clients...</span>
          <span className="inline sm:hidden text-slate-600">Search</span>
          <kbd className="hidden items-center rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 md:inline-flex shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Legal Assistant Quick Trigger */}
        {onOpenAIAssistant && (
          <button
            type="button"
            onClick={onOpenAIAssistant}
            className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 shadow-xs cursor-pointer"
            title="Open Wakili AI Assistant"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Ask Wakili AI</span>
          </button>
        )}

        {/* Notifications Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative rounded-xl border border-slate-200/90 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer shadow-2xs"
          title="Firm Notifications"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950 ring-2 ring-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Profile / Advocate Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white p-1.5 pr-2.5 transition hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <img
              src={currentAdvocate.avatar}
              alt={currentAdvocate.name}
              className="h-7 w-7 rounded-lg object-cover ring-1 ring-slate-200"
            />
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold leading-none text-slate-900 flex items-center gap-1">
                <span>{currentAdvocate.name}</span>
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500 font-mono">
                {currentAdvocate.lskRollNo}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-150">
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900">
                      {currentAdvocate.name}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentRoleInfo.badgeClass}`}
                    >
                      {currentRoleInfo.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                    {currentAdvocate.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500 font-mono">
                    ID / Roll: {currentAdvocate.lskRollNo} • Active
                  </p>
                </div>

                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Switch Counsel / Role</span>
                  <span className="text-[9px] text-slate-500 lowercase font-normal">all firm roles</span>
                </div>

                <div className="max-h-56 overflow-y-auto px-1 space-y-0.5">
                  {advocates.filter((adv) => !isSysAdminUser(adv)).map((adv) => {
                    const advRoleInfo = getRoleBadgeInfo(adv);
                    return (
                      <button
                        key={adv.id}
                        type="button"
                        onClick={() => {
                          onSelectAdvocate(adv);
                          setProfileDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                          adv.id === currentAdvocate.id
                            ? 'bg-amber-50/80 font-medium text-amber-900'
                            : 'text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <img
                          src={adv.avatar}
                          alt={adv.name}
                          className="h-6 w-6 rounded-md object-cover"
                        />
                        <div className="truncate flex-1">
                          <div className="flex items-center justify-between">
                            <p className="truncate font-medium">{adv.name}</p>
                            <span
                              className={`ml-1 text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${advRoleInfo.badgeClass}`}
                            >
                              {advRoleInfo.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">
                            {adv.title}
                          </p>
                        </div>
                        {adv.id === currentAdvocate.id && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-1 border-t border-slate-100 pt-1">
                  <div className="px-4 py-2 text-[11px] text-slate-500 bg-slate-50/80">
                    <span className="font-semibold text-slate-800">Role Scope:</span>{' '}
                    {currentRoleInfo.ruleDesc}
                  </div>

                  <div className="p-1 border-t border-slate-100 space-y-0.5">
                    <button
                      type="button"
                      id="btn-header-change-password"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setIsChangePasswordOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                      <span>Change Account Password</span>
                    </button>

                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onLogout();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5 text-rose-600" />
                        <span>Sign Out of Portal</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          currentAdvocate={currentAdvocate}
          onPasswordUpdated={(updated) => {
            onSelectAdvocate(updated);
          }}
        />
      )}
    </header>
  );
};


