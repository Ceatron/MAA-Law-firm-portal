import React, { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  CreditCard,
  FileText,
  UserCheck,
  Settings,
  ShieldCheck,
  Building2,
  X,
  CheckSquare,
  CalendarDays,
  Plus,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Megaphone,
  Headphones,
  Scale,
  FileStack,
} from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenNewMatter: () => void;
  onLogout?: () => void;
  mattersCount?: number;
  clientsCount?: number;
  openTasksCount?: number;
  courtEventsCount?: number;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  canAccessBilling?: boolean;
}

interface NavSection {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    count?: number;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  onOpenNewMatter,
  onLogout,
  mattersCount = 0,
  clientsCount = 0,
  openTasksCount = 0,
  courtEventsCount = 0,
  isCollapsed: controlledIsCollapsed,
  setIsCollapsed: controlledSetIsCollapsed,
  canAccessBilling = false,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chambers_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    if (controlledSetIsCollapsed) {
      controlledSetIsCollapsed(nextVal);
    } else {
      setInternalCollapsed(nextVal);
    }
    try {
      localStorage.setItem('chambers_sidebar_collapsed', String(nextVal));
    } catch {}
  };

  const navSections: NavSection[] = [
    {
      title: 'Workspace',
      items: [
        { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'NoticeBoard', label: 'Notice Board', icon: Megaphone, badge: 'News' },
        { id: 'Matters', label: 'Matters', icon: Briefcase, count: mattersCount },
        { id: 'Clients', label: 'Clients', icon: Users, count: clientsCount },
        { id: 'ClientServices', label: 'Client Services', icon: Headphones, badge: 'Hub' },
        {
          id: 'Tasks',
          label: openTasksCount > 0 ? `Tasks [${openTasksCount}]` : 'Tasks',
          icon: CheckSquare,
          badge: openTasksCount > 0 ? `${openTasksCount} Pending` : undefined,
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          id: 'Calendar',
          label: 'Calendar',
          icon: CalendarDays,
          badge: courtEventsCount > 0 ? `${courtEventsCount}` : undefined,
        },
        { id: 'HRM', label: 'HRM', icon: Users },
        ...(canAccessBilling ? [{ id: 'Billing', label: 'Billing', icon: CreditCard }] : []),
        { id: 'Documents', label: 'Documents', icon: FileText },
        { id: 'AuditTrail', label: 'Audit Trail', icon: ShieldCheck },
      ],
    },
    {
      title: 'Administration',
      items: [
        { id: 'Team', label: 'Team', icon: UserCheck },
        { id: 'Settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="app-main-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex flex-col justify-between bg-[#0b1f2d] text-slate-300 p-4 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-72 lg:w-20 lg:p-3' : 'w-72 lg:w-64'}`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Firm Logo & Emblem */}
          <div className="mb-6 flex items-center justify-between">
            {!isCollapsed ? (
              <div className="flex-1 overflow-hidden pr-2">
                <CompanyLogo variant="horizontal" size="sm" darkBg={true} />
              </div>
            ) : (
              <div className="hidden lg:flex items-center justify-center w-full py-0.5">
                <CompanyLogo variant="icon" size="sm" darkBg={true} />
              </div>
            )}

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer shrink-0"
              aria-label="Close navigation"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Primary Action Button: New Matter */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                onOpenNewMatter();
                setMobileOpen(false);
              }}
              title="Create New Matter"
              className={`flex items-center justify-center gap-2 rounded-xl bg-amber-400 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 active:bg-amber-500 shadow-md shadow-amber-950/20 cursor-pointer ${
                isCollapsed
                  ? 'w-full py-3 px-2 lg:py-3 lg:px-0 space-x-0'
                  : 'w-full px-3 py-3'
              }`}
            >
              <Plus className="h-4.5 w-4.5 shrink-0 text-slate-950" />
              <span className={isCollapsed ? 'inline lg:hidden' : 'inline'}>New matter</span>
            </button>
          </div>

          {/* Grouped Navigation Links */}
          <nav className="flex-1 space-y-6 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.title}>
                {!isCollapsed ? (
                  <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.18em] text-slate-500">
                    {section.title}
                  </p>
                ) : (
                  <div className="hidden lg:block my-2 border-t border-slate-800" />
                )}

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileOpen(false);
                        }}
                        title={isCollapsed ? item.label : undefined}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition cursor-pointer ${
                          isActive
                            ? 'bg-white/10 text-white shadow-xs font-medium'
                            : 'hover:bg-white/5 hover:text-white text-slate-300'
                        } ${isCollapsed ? 'justify-between lg:justify-center lg:px-0' : 'justify-between'}`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Icon
                            className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                              isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-white'
                            }`}
                          />
                          <span className={isCollapsed ? 'inline lg:hidden truncate' : 'inline truncate'}>
                            {item.label}
                          </span>
                        </div>

                        {/* Count / Badge */}
                        {!isCollapsed && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.count !== undefined && item.count > 0 && (
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                                {item.count}
                              </span>
                            )}
                            {item.badge && (
                              <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 tracking-wide">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer: Collapse & Sign out */}
        <div className="pt-4 mt-auto border-t border-white/10 space-y-1">
          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={toggleCollapse}
            className={`hidden items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer lg:flex ${
              isCollapsed ? 'justify-center w-full' : 'w-full'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5 text-amber-400" />
            ) : (
              <>
                <PanelLeftClose className="h-4.5 w-4.5" />
                <span>Collapse</span>
              </>
            )}
          </button>

          {/* Sign Out Action */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer w-full ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={isCollapsed ? 'inline lg:hidden' : 'inline'}>Sign out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};


