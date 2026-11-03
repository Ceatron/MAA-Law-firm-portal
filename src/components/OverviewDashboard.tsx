import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  ArrowRight,
  User,
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  Building2,
  Landmark,
  Phone,
  Mail,
  Globe,
  MapPin,
  Sliders,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { LegalMatter, DeadlineItem, Advocate, ActivityLog, Client, FeeNote, TaskItem, ChambersSettings } from '../types';
import { canUserViewAll, isMatterVisibleToUser, isTaskVisibleToUser } from '../utils/visibilityRules';
import { loadChambersSettings } from '../utils/settingsStorage';
import { MetricCards } from './MetricCards';
import { UpcomingDeadlines } from './UpcomingDeadlines';
import { ActivityFeed } from './ActivityFeed';
import { TaskPerformanceCard } from './TaskPerformanceCard';

interface OverviewDashboardProps {
  onNavigateTab: (tab: string) => void;
  matters: LegalMatter[];
  deadlines: DeadlineItem[];
  clients: Client[];
  activities: ActivityLog[];
  tasks?: TaskItem[];
  feeNotes?: FeeNote[];
  currentAdvocate?: Advocate;
  isManagingAdvocate?: boolean;
  canAccessBilling?: boolean;
  onOpenNewMatter?: () => void;
  onToggleDeadline: (id: string) => void;
  onSelectMatter?: (matter: LegalMatter) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigateTab,
  matters,
  deadlines,
  clients,
  activities,
  tasks = [],
  feeNotes,
  currentAdvocate,
  isManagingAdvocate = true,
  canAccessBilling = true,
  onOpenNewMatter,
  onToggleDeadline,
  onSelectMatter,
}) => {
  const [settings, setSettings] = useState<ChambersSettings>(() => loadChambersSettings());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ChambersSettings>;
      if (customEvent.detail) setSettings(customEvent.detail);
    };
    window.addEventListener('chambers-settings-updated', handleUpdate);
    return () => window.removeEventListener('chambers-settings-updated', handleUpdate);
  }, []);

  const effectiveCanViewAll = isManagingAdvocate || canUserViewAll(currentAdvocate);

  // Scoped matters based on role
  const userMatters = effectiveCanViewAll
    ? matters.filter((m) => m.status !== 'Archived')
    : matters.filter(
        (m) => m.status !== 'Archived' && isMatterVisibleToUser(m, currentAdvocate)
      );

  const activeMatters = userMatters;

  // Scoped tasks based on role (Managing Advocate & System Admin see ALL tasks)
  const userTasks = (effectiveCanViewAll
    ? tasks
    : tasks.filter((t) => isTaskVisibleToUser(t, currentAdvocate, matters))
  ).filter(
    (t) =>
      t &&
      t.id !== 'tsk-1' &&
      t.id !== 'tsk-4' &&
      !t.title?.includes('Draft Replying Affidavit on Injunction Notice of Motion') &&
      !t.title?.includes('E-file Hearing Bundle on CTS and Serve Milimani Commercial Registry')
  );

  // Open / Pending tasks (matching sidebar count by excluding Completed and closed)
  const openTasks = userTasks.filter((t) => {
    const s = (t.status || '').toLowerCase();
    return s !== 'completed' && s !== 'closed';
  });

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFirstName = () => {
    if (!currentAdvocate?.name) return 'Counsel';
    const cleaned = currentAdvocate.name
      .replace(/^(Adv\.?|Advocate|Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Miss|Senior\s+Counsel|SC|Hon\.?)\s+/i, '')
      .trim();
    const parts = cleaned.split(/\s+/);
    return parts[0] || 'Counsel';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active - In Court':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Active - Discovery':
      case 'Active - Pre-Trial':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Active - Settlement':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="space-y-8">
      {/* Top Welcome Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-bold tracking-[0.12em] uppercase text-amber-800">
              {settings.firmName}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs italic text-slate-500 font-medium">
              "{settings.tagline}"
            </span>
            {settings.lskFirmRegNo && (
              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200/80">
                LSK: {settings.lskFirmRegNo}
              </span>
            )}
            {settings.kraPin && (
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-600 border border-slate-200">
                PIN: {settings.kraPin}
              </span>
            )}
          </div>
          <h1 className="mt-1 font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {getTimeGreeting()}, {getFirstName()}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {formattedDate} • Here’s what needs your attention across {settings.firmName}.
          </p>
        </div>

        {onOpenNewMatter && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenNewMatter}
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New matter</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 Metric KPI Cards */}
      <MetricCards
        onNavigateTab={onNavigateTab}
        currentAdvocate={currentAdvocate}
        isManagingAdvocate={isManagingAdvocate}
        canAccessBilling={canAccessBilling}
        matters={matters}
        deadlines={deadlines}
        clients={clients}
        feeNotes={feeNotes}
        tasks={tasks}
        onOpenNewMatter={onOpenNewMatter}
      />

      {/* Firm Practice Profile & Workspace Registration (Visible to advocates with practice management rights) */}
      {effectiveCanViewAll && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 shadow-2xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-heading text-base font-bold text-slate-900">
                    Firm Workspace Registration & Contact Information
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                    Verified Chambers
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official practice profile, contact details, regulatory identifiers, and trust escrow accounts
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('Settings')}
              className="inline-flex items-center space-x-1.5 self-start sm:self-auto rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Configure Practice Settings</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Entity Identification */}
            <div className="rounded-xl bg-slate-50/70 border border-slate-200/70 p-3.5 space-y-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
                Practice Entity
              </span>
              <p className="font-bold text-slate-900 text-sm">{settings.firmName}</p>
              <p className="text-[11px] italic text-slate-600">"{settings.tagline}"</p>
              <div className="pt-1 text-[11px] text-slate-600">
                <span className="text-slate-400">Managing Partner: </span>
                <span className="font-semibold text-slate-800">{settings.managingPartner || 'Adv. Costa Kimathi'}</span>
              </div>
            </div>

            {/* Registration & Regulators */}
            <div className="rounded-xl bg-slate-50/70 border border-slate-200/70 p-3.5 space-y-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
                Statutory Identifiers
              </span>
              <div>
                <span className="text-[10px] text-slate-500 block">LSK Firm Registration No:</span>
                <span className="font-mono font-semibold text-slate-900 text-[11px]">
                  {settings.lskFirmRegNo || 'LSK/FIRM/2026/0411'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">KRA Tax PIN:</span>
                <span className="font-mono font-semibold text-slate-900 text-[11px]">
                  {settings.kraPin || 'P0512839401Z'}
                </span>
              </div>
              <div className="pt-0.5 text-[11px] text-slate-500 flex items-start gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span className="truncate" title={settings.physicalAddress}>
                  {settings.physicalAddress}
                </span>
              </div>
            </div>

            {/* Official Communications */}
            <div className="rounded-xl bg-slate-50/70 border border-slate-200/70 p-3.5 space-y-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
                Official Channels
              </span>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium">{settings.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 truncate" title={settings.email}>
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{settings.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 truncate" title={settings.website}>
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate text-blue-700 font-medium">{settings.website}</span>
              </div>
            </div>

            {/* Client Trust & Bank Escrow Accounts */}
            <div className="rounded-xl bg-slate-50/70 border border-slate-200/70 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
                  Trust & Escrow Accounts
                </span>
                <Landmark className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="font-bold text-slate-900 truncate" title={settings.bankDetails.bankName}>
                {settings.bankDetails.bankName}
              </p>
              <div className="text-[11px] text-slate-600 truncate" title={settings.bankDetails.accountName}>
                {settings.bankDetails.accountName}
              </div>
              <div className="font-mono text-[11px] text-slate-800">
                A/C: <span className="font-bold">{settings.bankDetails.accountNumber}</span>
                {settings.bankDetails.branch && <span className="text-slate-500"> ({settings.bankDetails.branch})</span>}
              </div>
              <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-500 font-mono">
                {settings.bankDetails.paybillNumber && (
                  <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-semibold text-slate-700">
                    Paybill: {settings.bankDetails.paybillNumber}
                  </span>
                )}
                {settings.bankDetails.swiftCode && (
                  <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    SWIFT: {settings.bankDetails.swiftCode}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Matters Preview Table & Open Tasks List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Matters Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-heading text-lg font-bold text-slate-900">
                    Active matters
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {activeMatters.length} open
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Recently updated work</p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('Matters')}
                className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Matters Table */}
            <div className="mt-5 overflow-x-auto">
              {activeMatters.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Briefcase className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No active matters registered</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Open a new case file to start tracking matters, filings, and deadlines.</p>
                  {onOpenNewMatter && (
                    <button
                      type="button"
                      onClick={onOpenNewMatter}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-900 shadow-2xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Lodge New Matter</span>
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold tracking-wider text-slate-400">
                      <th className="pb-3 pr-4">Matter & Ref</th>
                      <th className="pb-3 pr-4">Client</th>
                      <th className="pb-3 pr-4">Lead</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeMatters.slice(0, 5).map((matter) => (
                      <tr
                        key={matter.id}
                        onClick={() => onSelectMatter ? onSelectMatter(matter) : onNavigateTab('Matters')}
                        className="group transition hover:bg-slate-50/70 cursor-pointer"
                      >
                        <td className="py-3.5 pr-4">
                          <p className="font-bold text-slate-900 group-hover:text-amber-700 transition">
                            {matter.title}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {matter.referenceNumber || (matter as any).matterNumber}
                          </p>
                        </td>
                        <td className="py-3.5 pr-4 text-slate-600 font-medium">
                          {matter.clientName}
                        </td>
                        <td className="py-3.5 pr-4 text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[120px]">
                              {(matter.responsibleAdvocateName || '').replace('Adv. ', '')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadge(matter.status)}`}>
                            {matter.status.replace('Active - ', '')}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectMatter) onSelectMatter(matter);
                              else onNavigateTab('Matters');
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Open Tasks Preview Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-heading text-lg font-bold text-slate-900">
                    Open tasks
                  </h3>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                    {openTasks.length} pending
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Assigned work and pending deliverables across matters</p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('Tasks')}
                className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition cursor-pointer"
              >
                <span>View all ({openTasks.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-5">
              {openTasks.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <CheckSquare className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No open tasks pending</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All assigned chambers tasks are up to date.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {openTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onNavigateTab('Tasks')}
                      className="group flex items-start justify-between py-3.5 transition hover:bg-slate-50/70 cursor-pointer rounded-xl px-2.5 -mx-2.5"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition truncate">
                            {task.title}
                          </p>
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                              (task.priority || '').toLowerCase() === 'high' || (task.priority || '').toLowerCase() === 'critical'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : (task.priority || '').toLowerCase() === 'medium'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {task.priority || 'Normal'}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          {task.matterRef && (
                            <span className="font-mono text-slate-500 font-medium">
                              {task.matterRef}
                            </span>
                          )}
                          {task.clientName && (
                            <span className="truncate max-w-[160px] text-slate-600">
                              {task.clientName}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-400">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-[130px]">{task.assignedTo || 'Unassigned'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {task.dueDate && (
                          <div className="flex items-center justify-end gap-1 text-[11px] font-medium text-slate-500">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{task.dueDate}</span>
                          </div>
                        )}
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {task.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Task Performance, Upcoming Deadlines & Activity Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <TaskPerformanceCard
            tasks={tasks}
            onViewTasks={() => onNavigateTab('Tasks')}
          />

          <UpcomingDeadlines
            deadlines={deadlines}
            onToggleComplete={onToggleDeadline}
            onOpenNewDeadlineModal={onOpenNewMatter || (() => {})}
            currentAdvocate={currentAdvocate}
            isManagingAdvocate={isManagingAdvocate}
          />

          <ActivityFeed
            activities={activities}
            onViewFullPage={() => onNavigateTab('AuditTrail')}
          />
        </div>
      </div>
    </div>
  );
};
