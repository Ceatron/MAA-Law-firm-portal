import React from 'react';
import {
  Briefcase,
  Plus,
  ArrowRight,
  User,
} from 'lucide-react';
import { LegalMatter, DeadlineItem, Advocate, ActivityLog, Client, FeeNote, TaskItem } from '../types';
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
  onOpenNewMatter: () => void;
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
  const activeMatters = matters.filter((m) => m.status !== 'Archived');

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFirstName = () => {
    if (!currentAdvocate?.name) return 'Counsel';
    // Clean titles like "Adv.", "Dr.", "Mr.", "Mrs.", "Ms." etc.
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
          <p className="text-xs font-semibold tracking-[0.16em] text-amber-700">
            {formattedDate}
          </p>
          <h1 className="mt-1 font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {getTimeGreeting()}, {getFirstName()}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here’s what needs your attention across the firm workspace.
          </p>
        </div>

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
        onOpenNewMatter={onOpenNewMatter}
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Matters Preview Table (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
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
                  <button
                    type="button"
                    onClick={onOpenNewMatter}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-900 shadow-2xs cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Lodge New Matter</span>
                  </button>
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
                            {matter.matterNumber}
                          </p>
                        </td>
                        <td className="py-3.5 pr-4 text-slate-600 font-medium">
                          {matter.clientName}
                        </td>
                        <td className="py-3.5 pr-4 text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[120px]">
                              {matter.responsibleAdvocateName.replace('Adv. ', '')}
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
            onOpenNewDeadlineModal={onOpenNewMatter}
            currentAdvocate={currentAdvocate}
            isManagingAdvocate={isManagingAdvocate}
          />

          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
};

