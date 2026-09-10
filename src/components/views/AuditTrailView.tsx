import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Activity,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  User,
  Scale,
  FileText,
  Banknote,
  RotateCcw,
  UserCheck,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
  X,
  Briefcase,
  Layers,
  Table as TableIcon,
  ListOrdered,
} from 'lucide-react';
import { ActivityLog, LegalMatter, Advocate } from '../../types';
import { loadVisibleStaffRoster } from '../../utils/staffStorage';
import { formatActivityDateTime } from '../../utils/activityDateFormatter';

interface AuditTrailViewProps {
  activities: ActivityLog[];
  matters?: LegalMatter[];
  currentAdvocate?: Advocate;
  isManagingAdvocate?: boolean;
  onSelectMatter?: (matter: LegalMatter) => void;
  allAdvocates?: Advocate[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  activities,
  matters = [],
  currentAdvocate,
  isManagingAdvocate = true,
  onSelectMatter,
  allAdvocates = loadVisibleStaffRoster(),
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedUser, setSelectedUser] = useState<string>('All');
  const [selectedMatterRef, setSelectedMatterRef] = useState<string>('All');
  const [timeRange, setTimeRange] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [selectedActivityForModal, setSelectedActivityForModal] = useState<ActivityLog | null>(null);

  // Filter out any test matter or mock reference containing 735 or MAA/CIV/2026/735
  const sanitizedActivities = useMemo(() => {
    return activities.filter(
      (act) =>
        act &&
        act.matterRef !== 'MAA/CIV/2026/735' &&
        !act.matterRef?.includes('735') &&
        !act.description?.includes('735') &&
        !act.title?.includes('735')
    );
  }, [activities]);

  const sanitizedMatters = useMemo(() => {
    return matters.filter(
      (m) =>
        m &&
        m.referenceNumber !== 'MAA/CIV/2026/735' &&
        !m.referenceNumber?.includes('735')
    );
  }, [matters]);

  // Unique users found in activities
  const uniqueUsers = useMemo(() => {
    const users = new Set<string>();
    sanitizedActivities.forEach((act) => {
      if (act.user) users.add(act.user);
    });
    return Array.from(users);
  }, [sanitizedActivities]);

  // Unique matter refs found in activities
  const uniqueMatterRefs = useMemo(() => {
    const refs = new Set<string>();
    sanitizedActivities.forEach((act) => {
      if (act.matterRef) refs.add(act.matterRef);
    });
    return Array.from(refs);
  }, [sanitizedActivities]);

  // Filtered activities based on all criteria
  const filteredActivities = useMemo(() => {
    return sanitizedActivities.filter((act) => {
      // Type match
      if (selectedType !== 'All') {
        if (selectedType === 'Documents' && act.type !== 'Document') return false;
        if (selectedType === 'Financials' && act.type !== 'Billing') return false;
        if (selectedType === 'Status' && act.type !== 'Status Change') return false;
        if (selectedType === 'Court' && act.type !== 'Court Event') return false;
        if (selectedType === 'Team' && act.type !== 'Team Action') return false;
      }

      // User match
      if (selectedUser !== 'All' && act.user !== selectedUser) {
        return false;
      }

      // Matter match
      if (selectedMatterRef !== 'All' && act.matterRef !== selectedMatterRef) {
        return false;
      }

      // Time range filter
      if (timeRange !== 'All') {
        const now = new Date();
        const actDate = new Date(act.timestamp);
        if (!isNaN(actDate.getTime())) {
          const diffHours = (now.getTime() - actDate.getTime()) / (1000 * 60 * 60);
          if (timeRange === 'Today' && diffHours > 24) return false;
          if (timeRange === 'Week' && diffHours > 24 * 7) return false;
          if (timeRange === 'Month' && diffHours > 24 * 30) return false;
        }
      }

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(q);
        const matchesDesc = act.description.toLowerCase().includes(q);
        const matchesUser = act.user.toLowerCase().includes(q);
        const matchesRef = act.matterRef ? act.matterRef.toLowerCase().includes(q) : false;
        const matchesType = act.type.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesUser && !matchesRef && !matchesType) {
          return false;
        }
      }

      return true;
    });
  }, [sanitizedActivities, selectedType, selectedUser, selectedMatterRef, timeRange, searchTerm]);

  // Statistics counters
  const totalCount = sanitizedActivities.length;
  const courtCount = sanitizedActivities.filter((a) => a.type === 'Court Event').length;
  const documentCount = sanitizedActivities.filter((a) => a.type === 'Document').length;
  const billingCount = sanitizedActivities.filter((a) => a.type === 'Billing').length;
  const statusCount = sanitizedActivities.filter((a) => a.type === 'Status Change').length;

  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'Document':
        return <FileText className="h-4 w-4 text-[#0070ba]" />;
      case 'Billing':
        return <Banknote className="h-4 w-4 text-[#1b6338]" />;
      case 'Status Change':
        return <RotateCcw className="h-4 w-4 text-[#e9572b]" />;
      case 'Court Event':
        return <Scale className="h-4 w-4 text-[#0070ba]" />;
      case 'Team Action':
        return <UserCheck className="h-4 w-4 text-[#5c6f84]" />;
      default:
        return <Activity className="h-4 w-4 text-[#5c6f84]" />;
    }
  };

  const getActivityBadge = (type: ActivityLog['type']) => {
    switch (type) {
      case 'Document':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800 border border-blue-200">
            <FileText className="h-3 w-3 text-blue-600" />
            Document
          </span>
        );
      case 'Billing':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
            <Banknote className="h-3 w-3 text-emerald-600" />
            Billing & Fee
          </span>
        );
      case 'Status Change':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
            <RotateCcw className="h-3 w-3 text-amber-600" />
            Status Change
          </span>
        );
      case 'Court Event':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800 border border-sky-200">
            <Scale className="h-3 w-3 text-sky-600" />
            Court Event
          </span>
        );
      case 'Team Action':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-800 border border-purple-200">
            <UserCheck className="h-3 w-3 text-purple-600" />
            Team Action
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800 border border-slate-200">
            <Activity className="h-3 w-3 text-slate-600" />
            {type}
          </span>
        );
    }
  };

  const handleExportCsv = () => {
    if (filteredActivities.length === 0) return;
    const headers = ['Event ID', 'Date', 'Time', 'Actor/Staff', 'Category', 'Title', 'Matter Reference', 'Description'];
    const rows = filteredActivities.map((act) => {
      const dt = formatActivityDateTime(act.timestamp);
      return [
        `"${act.id}"`,
        `"${dt.date}"`,
        `"${dt.time}"`,
        `"${act.user}"`,
        `"${act.type}"`,
        `"${act.title.replace(/"/g, '""')}"`,
        `"${(act.matterRef || 'N/A').replace(/"/g, '""')}"`,
        `"${act.description.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Chambers_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedType('All');
    setSelectedUser('All');
    setSelectedMatterRef('All');
    setTimeRange('All');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedType !== 'All' ||
    selectedUser !== 'All' ||
    selectedMatterRef !== 'All' ||
    timeRange !== 'All';

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                Audit Trail & Activity Log
              </h1>
              <p className="text-xs text-slate-500">
                Immutable, firm-wide registry of filings, hearings, fee notes, client status changes, and staff operations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredActivities.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download formatted CSV report of current audit log view"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Total Logged</span>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">{totalCount}</p>
          <span className="text-[10px] text-slate-400">All firm activities</span>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-sky-700">
            <span className="text-[11px] font-semibold">Court Events</span>
            <Scale className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-sky-950">{courtCount}</p>
          <span className="text-[10px] text-sky-600">Hearings & filings</span>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[11px] font-semibold">Documents</span>
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-blue-950">{documentCount}</p>
          <span className="text-[10px] text-blue-600">Pleadings & drafts</span>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-semibold">Financial & Fees</span>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-950">{billingCount}</p>
          <span className="text-[10px] text-emerald-600">Fee notes & payments</span>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3.5 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-semibold">Status Transitions</span>
            <RotateCcw className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-amber-950">{statusCount}</p>
          <span className="text-[10px] text-amber-600">Lifecycle shifts</span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by keyword, title, advocate, matter number, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle & Reset */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListOrdered className="h-3.5 w-3.5" />
                <span>Timeline</span>
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-800 focus:border-slate-400 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Court">Court Events</option>
              <option value="Documents">Documents & Pleadings</option>
              <option value="Financials">Financials & Billing</option>
              <option value="Status">Status Changes</option>
              <option value="Team">Team Actions</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Staff / Actor</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-800 focus:border-slate-400 focus:outline-none cursor-pointer"
            >
              <option value="All">All Staff Members</option>
              {uniqueUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Matter Reference</label>
            <select
              value={selectedMatterRef}
              onChange={(e) => setSelectedMatterRef(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-800 focus:border-slate-400 focus:outline-none cursor-pointer"
            >
              <option value="All">All Connected Matters</option>
              {uniqueMatterRefs.map((ref) => (
                <option key={ref} value={ref}>
                  {ref}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Time Period</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-800 focus:border-slate-400 focus:outline-none cursor-pointer"
            >
              <option value="All">All Recorded History</option>
              <option value="Today">Past 24 Hours</option>
              <option value="Week">Past 7 Days</option>
              <option value="Month">Past 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredActivities.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Audit Trail Records Found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {sanitizedActivities.length === 0
              ? 'No firm-wide audit logs have been recorded yet. Activity logs are recorded automatically as matters, filings, fee notes, and status changes occur in production.'
              : 'No activity logs match your active search terms or filter selection. Clear your filters to view all entries.'}
          </p>
          {hasActiveFilters && (
            <div className="mt-4">
              <button
                type="button"
                onClick={clearAllFilters}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Detailed Table View */
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                  <th className="py-3 px-4 w-44">Date & Time</th>
                  <th className="py-3 px-4 w-48">Actor / Advocate</th>
                  <th className="py-3 px-4 w-36">Category</th>
                  <th className="py-3 px-4 min-w-[240px]">Action & Details</th>
                  <th className="py-3 px-4 w-48">Matter Reference</th>
                  <th className="py-3 px-4 w-20 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredActivities.map((act) => {
                  const connectedMatter = sanitizedMatters.find(
                    (m) => m.referenceNumber === act.matterRef || m.id === act.matterRef
                  );

                  return (
                    <tr
                      key={act.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedActivityForModal(act)}
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {(() => {
                          const dt = formatActivityDateTime(act.timestamp);
                          return (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-[11px]">
                                <Calendar className="h-3 w-3 text-slate-500 shrink-0" />
                                <span>{dt.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                                <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{dt.time}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Actor / Staff */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                            <User className="h-3 w-3" />
                          </div>
                          <span className="font-semibold text-slate-900 truncate max-w-[140px]">
                            {act.user}
                          </span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActivityBadge(act.type)}
                      </td>

                      {/* Action & Details */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 group-hover:text-[#0070ba] transition-colors">
                            {act.title}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {act.description}
                          </p>
                        </div>
                      </td>

                      {/* Matter Reference */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {act.matterRef ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {act.matterRef}
                            </span>
                            {connectedMatter && onSelectMatter && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectMatter(connectedMatter);
                                }}
                                className="text-amber-800 hover:text-amber-950 p-1 rounded hover:bg-amber-50 transition cursor-pointer"
                                title="Open connected legal matter file"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">General Chambers</span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedActivityForModal(act);
                          }}
                          className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 transition cursor-pointer"
                          title="View complete audit record"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Showing <span className="font-semibold text-slate-800">{filteredActivities.length}</span> of{' '}
              <span className="font-semibold text-slate-800">{totalCount}</span> total events
            </span>
            <span className="text-[11px] text-slate-400">
              Compliant with LSK Practice Directives & Chambers Record Standards
            </span>
          </div>
        </div>
      ) : (
        /* Timeline View */
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="relative space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredActivities.map((act) => {
              const connectedMatter = sanitizedMatters.find(
                (m) => m.referenceNumber === act.matterRef || m.id === act.matterRef
              );

              return (
                <div key={act.id} className="relative flex items-start space-x-4 pl-1">
                  {/* Timeline node icon */}
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-2xs">
                    {getActivityIcon(act.type)}
                  </div>

                  {/* Card Content */}
                  <div
                    onClick={() => setSelectedActivityForModal(act)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-xs cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        {getActivityBadge(act.type)}
                        <h4 className="font-bold text-slate-900 text-sm">{act.title}</h4>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                        {(() => {
                          const dt = formatActivityDateTime(act.timestamp);
                          return (
                            <>
                              <div className="flex items-center gap-1 text-slate-800 font-semibold">
                                <Calendar className="h-3 w-3 text-slate-500 shrink-0" />
                                <span>{dt.date}</span>
                              </div>
                              <span className="text-slate-300">·</span>
                              <div className="flex items-center gap-1 text-slate-500">
                                <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{dt.time}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {act.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>Logged by: {act.user}</span>
                      </div>

                      {act.matterRef && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">Matter:</span>
                          <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {act.matterRef}
                          </span>
                          {connectedMatter && onSelectMatter && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectMatter(connectedMatter);
                              }}
                              className="text-amber-800 hover:underline inline-flex items-center gap-0.5 text-[11px] font-semibold cursor-pointer"
                            >
                              <span>Open</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Detail Modal */}
      {selectedActivityForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          onClick={() => setSelectedActivityForModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getActivityBadge(selectedActivityForModal.type)}
                  <span className="font-mono text-[10px] text-slate-400">ID: {selectedActivityForModal.id}</span>
                </div>
                <h3 className="font-heading text-lg font-bold text-slate-900">
                  {selectedActivityForModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivityForModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                {(() => {
                  const dt = formatActivityDateTime(selectedActivityForModal.timestamp);
                  return (
                    <>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Date:
                        </span>
                        <span className="font-semibold text-slate-900">
                          {dt.date}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-t border-slate-200/50">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          Time:
                        </span>
                        <span className="font-mono font-semibold text-slate-800">
                          {dt.time}
                        </span>
                      </div>
                    </>
                  );
                })()}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Actor / Staff:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedActivityForModal.user}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Category:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedActivityForModal.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Matter Reference:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedActivityForModal.matterRef || 'General Chambers Operation'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Event Description & Audit Narrative
                </h4>
                <p className="rounded-lg border border-slate-200 bg-white p-3 text-slate-700 leading-relaxed">
                  {selectedActivityForModal.description}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedActivityForModal(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
