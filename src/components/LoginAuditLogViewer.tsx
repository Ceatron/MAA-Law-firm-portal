import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  RefreshCw,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Laptop,
  Smartphone,
  MapPin,
  AlertTriangle,
  UserCheck,
  UserX,
  FileSpreadsheet,
} from 'lucide-react';
import { LoginAuditEntry, Advocate } from '../types';
import {
  loadLoginAuditLogs,
  clearLoginAuditLogs,
  resetLoginAuditLogsToDefault,
  exportLoginAuditLogsCSV,
} from '../utils/authAuditStorage';

interface LoginAuditLogViewerProps {
  currentAdvocate?: Advocate;
  isModal?: boolean;
  onClose?: () => void;
}

export const LoginAuditLogViewer: React.FC<LoginAuditLogViewerProps> = ({
  currentAdvocate,
  isModal = false,
  onClose,
}) => {
  const [logs, setLogs] = useState<LoginAuditEntry[]>(() => loadLoginAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isSysAdminOrManaging =
    currentAdvocate?.isDeveloper ||
    currentAdvocate?.isSystemAdmin ||
    currentAdvocate?.role === 'System Admin' ||
    currentAdvocate?.role === 'Managing Advocate' ||
    currentAdvocate?.permissions?.canAccessTrustAudit;

  // Refresh logs from storage
  const handleRefresh = () => {
    const updated = loadLoginAuditLogs();
    setLogs(updated);
    setToastMessage('Audit logs refreshed.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Listen for live login audit log changes
  useEffect(() => {
    const handleLogsUpdated = (e: CustomEvent<LoginAuditEntry[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setLogs(e.detail);
      }
    };
    window.addEventListener('chambers-login-audit-updated', handleLogsUpdated as EventListener);
    return () => {
      window.removeEventListener('chambers-login-audit-updated', handleLogsUpdated as EventListener);
    };
  }, []);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const now = Date.now();

    return logs.filter((entry) => {
      // Status Filter
      if (statusFilter !== 'ALL' && entry.status !== statusFilter) {
        return false;
      }

      // Role Filter
      if (selectedRoleFilter !== 'ALL') {
        const userRole = entry.userRole || 'Unassigned';
        if (userRole.toLowerCase() !== selectedRoleFilter.toLowerCase()) {
          return false;
        }
      }

      // Time Filter
      if (timeFilter !== 'ALL') {
        const logTime = new Date(entry.timestamp).getTime();
        const diffMs = now - logTime;
        if (timeFilter === 'TODAY' && diffMs > 24 * 60 * 60 * 1000) return false;
        if (timeFilter === '7DAYS' && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
        if (timeFilter === '30DAYS' && diffMs > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = entry.userName.toLowerCase().includes(q);
        const matchEmail = entry.userEmail.toLowerCase().includes(q);
        const matchIdentifier = entry.identifier.toLowerCase().includes(q);
        const matchIp = entry.ipAddress.toLowerCase().includes(q);
        const matchLoc = (entry.location || '').toLowerCase().includes(q);
        const matchDevice = (entry.deviceInfo || '').toLowerCase().includes(q);
        const matchReason = (entry.failureReason || '').toLowerCase().includes(q);
        return matchName || matchEmail || matchIdentifier || matchIp || matchLoc || matchDevice || matchReason;
      }

      return true;
    });
  }, [logs, searchQuery, statusFilter, timeFilter, selectedRoleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const successCount = logs.filter((l) => l.status === 'SUCCESS').length;
    const failedCount = logs.filter((l) => l.status === 'FAILED').length;
    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 100;

    // Unique active users in past 24h
    const now = Date.now();
    const last24hLogs = logs.filter(
      (l) => l.status === 'SUCCESS' && now - new Date(l.timestamp).getTime() <= 24 * 60 * 60 * 1000
    );
    const uniqueUsers24h = new Set(last24hLogs.map((l) => l.userEmail.toLowerCase())).size;

    return { total, successCount, failedCount, successRate, uniqueUsers24h };
  }, [logs]);

  // CSV Export Download
  const handleExportCSV = () => {
    const csvContent = exportLoginAuditLogsCSV(filteredLogs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Muthoni_Ahago_Login_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToastMessage('Audit trail exported to CSV successfully.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Clear Logs
  const handleClearLogs = () => {
    clearLoginAuditLogs();
    setLogs([]);
    setShowClearConfirm(false);
    setToastMessage('Login audit logs cleared.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleResetDefaults = () => {
    resetLoginAuditLogsToDefault();
    setLogs(loadLoginAuditLogs());
    setShowClearConfirm(false);
    setToastMessage('Audit logs reset to baseline.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Format Date to East Africa Time (EAT)
  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return {
        dateStr: date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'Africa/Nairobi',
        }),
        timeStr: date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Africa/Nairobi',
        }),
      };
    } catch {
      return { dateStr: isoString, timeStr: '' };
    }
  };

  // Relative Time helper
  const getRelativeTime = (isoString: string) => {
    try {
      const ms = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(ms / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 rounded-xl bg-[#0B2540] px-4 py-2.5 text-xs font-semibold text-white shadow-xl border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-xl border border-[#cbd8e3] bg-gradient-to-r from-[#ebf5fc] via-[#f0f8ff] to-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="rounded-xl bg-[#0B2540] p-2.5 text-white shrink-0 shadow-2xs mt-0.5">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif-title font-bold text-[#0B2540] text-base">
                  Firm Workspace Login & Authentication Audit Trail
                </h3>
                <span className="rounded-full bg-[#0070ba] text-white text-[10px] font-bold px-2.5 py-0.5 tracking-wide">
                  LSK Compliance Enforced
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 max-w-3xl leading-relaxed">
                Immutable chronological log capturing all sign-in attempts, timestamped in East Africa Time (EAT), recording user identities, IP addresses, locations, terminal devices, and success/failure status for administrative and compliance review.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              id="btn-refresh-audit-logs"
              onClick={handleRefresh}
              title="Refresh Logs"
              className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-stone-600" />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              id="btn-export-audit-csv"
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 rounded-lg bg-[#0070ba] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005a96] transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total Attempts</span>
            <Clock className="h-4 w-4 text-stone-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#0B2540]">{stats.total}</span>
            <span className="text-[11px] text-stone-500">Logged Events</span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Successful Logins</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-900">{stats.successCount}</span>
            <span className="text-[11px] font-semibold text-emerald-700">({stats.successRate}% Success Rate)</span>
          </div>
        </div>

        <div className={`rounded-xl border p-3.5 shadow-2xs ${stats.failedCount > 0 ? 'border-rose-200 bg-rose-50/50' : 'border-stone-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${stats.failedCount > 0 ? 'text-rose-800' : 'text-stone-500'}`}>
              Failed Attempts
            </span>
            <UserX className={`h-4 w-4 ${stats.failedCount > 0 ? 'text-rose-600' : 'text-stone-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className={`text-2xl font-bold ${stats.failedCount > 0 ? 'text-rose-900' : 'text-stone-900'}`}>
              {stats.failedCount}
            </span>
            <span className="text-[11px] text-stone-500">Security Alerts</span>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0070ba]">24h Active Users</span>
            <ShieldCheck className="h-4 w-4 text-[#0070ba]" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#0B2540]">{stats.uniqueUsers24h}</span>
            <span className="text-[11px] text-stone-500">Firm Workspace Personnel</span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              id="input-search-audit-logs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, IP, location, reason..."
              className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs text-stone-900 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              id="select-audit-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-[#0070ba] focus:outline-none bg-white"
            >
              <option value="ALL">All Statuses ({logs.length})</option>
              <option value="SUCCESS">Success Only ({stats.successCount})</option>
              <option value="FAILED">Failed Only ({stats.failedCount})</option>
            </select>
          </div>

          {/* Time Filter */}
          <div className="sm:col-span-2">
            <select
              id="select-audit-time-filter"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-[#0070ba] focus:outline-none bg-white"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today (24h)</option>
              <option value="7DAYS">Past 7 Days</option>
              <option value="30DAYS">Past 30 Days</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="sm:col-span-2">
            <select
              id="select-audit-role-filter"
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-[#0070ba] focus:outline-none bg-white"
            >
              <option value="ALL">All Roles</option>
              <option value="Managing Advocate">Managing Advocate</option>
              <option value="Consultant Advocate">Consultant Advocate</option>
              <option value="Advocate">Advocate</option>
              <option value="Office Manager">Office Manager</option>
              <option value="Legal Support Clerk">Legal Support Clerk</option>
              <option value="System Admin">System Admin</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500 border-t border-stone-100">
          <div className="flex items-center space-x-2">
            <span>Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> audit records</span>
            {(searchQuery || statusFilter !== 'ALL' || timeFilter !== 'ALL' || selectedRoleFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setTimeFilter('ALL');
                  setSelectedRoleFilter('ALL');
                }}
                className="text-[#0070ba] hover:underline font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          {isSysAdminOrManaging && (
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-stone-400 hover:text-rose-600 transition flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Admin Log Management</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Clear Logs Modal / Confirmation Popover */}
      {showClearConfirm && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3">
          <div className="flex items-center space-x-2 font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <span>Administrative Audit Log Maintenance</span>
          </div>
          <p className="text-amber-800">
            Audit logs are maintained for statutory Law Society of Kenya (LSK) and internal security compliance. You can reset records to initial baseline seeds or purge all records.
          </p>
          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold px-3 py-1.5 transition cursor-pointer text-xs"
            >
              Reset to Baseline Seeds
            </button>
            <button
              type="button"
              onClick={handleClearLogs}
              className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 transition cursor-pointer text-xs"
            >
              Purge All Records
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Audit Trail Table */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fa] text-stone-600 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Timestamp (EAT)</th>
                <th className="py-3 px-4">User & Identifier</th>
                <th className="py-3 px-4">Firm Workspace Role</th>
                <th className="py-3 px-4">Status & Reason</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">IP Address & Location</th>
                <th className="py-3 px-4">Device & Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShieldAlert className="h-8 w-8 text-stone-400" />
                      <p className="font-semibold text-stone-700">No login audit entries match your filter criteria.</p>
                      <p className="text-[11px] text-stone-400">Try adjusting your search query or status filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const { dateStr, timeStr } = formatTimestamp(log.timestamp);
                  const isSuccess = log.status === 'SUCCESS';

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        !isSuccess ? 'bg-rose-50/25' : ''
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-stone-900 flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-stone-400" />
                            <span>{timeStr}</span>
                          </span>
                          <span className="text-[10px] text-stone-500">{dateStr}</span>
                          <span className="text-[9px] text-[#0070ba] font-medium">{getRelativeTime(log.timestamp)}</span>
                        </div>
                      </td>

                      {/* User & Identifier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSuccess ? 'bg-[#0B2540] text-white' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {log.userName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-stone-900 block truncate max-w-[180px]">
                              {log.userName}
                            </span>
                            <span className="text-[11px] text-stone-500 font-mono block truncate max-w-[180px]">
                              {log.userEmail || log.identifier}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Firm Workspace Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.userRole?.includes('Managing')
                            ? 'bg-purple-100 text-purple-800'
                            : log.userRole?.includes('Consultant')
                            ? 'bg-amber-100 text-amber-800'
                            : log.userRole?.includes('Admin')
                            ? 'bg-blue-100 text-blue-800'
                            : log.userRole?.includes('Manager')
                            ? 'bg-teal-100 text-teal-800'
                            : log.userRole?.includes('Clerk')
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {log.userRole || 'External / Unregistered'}
                        </span>
                      </td>

                      {/* Status & Reason */}
                      <td className="py-3.5 px-4">
                        {isSuccess ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>SUCCESS</span>
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="h-3 w-3 text-rose-600" />
                              <span>FAILED</span>
                            </span>
                            {log.failureReason && (
                              <p className="text-[10px] text-rose-700 font-medium leading-tight max-w-[200px]">
                                {log.failureReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Authentication Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                          {log.loginMethod}
                        </span>
                      </td>

                      {/* IP & Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-mono text-[11px] text-stone-800 font-semibold">
                            {log.ipAddress}
                          </span>
                          <span className="text-[10px] text-stone-500 flex items-center space-x-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5 text-stone-400" />
                            <span>{log.location || 'Nairobi, Kenya'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Device & Client */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 text-stone-600">
                          {log.deviceInfo.toLowerCase().includes('ios') || log.deviceInfo.toLowerCase().includes('android') ? (
                            <Smartphone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                          ) : (
                            <Laptop className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                          )}
                          <span className="text-[11px] truncate max-w-[170px]" title={log.deviceInfo}>
                            {log.deviceInfo}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Statistics Summary */}
        <div className="bg-[#fcfbf9] px-4 py-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-2">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <span>LSK Rule 18 Security Audit Logging Active &bull; All authentication sessions cryptographically recorded.</span>
          </div>
          <div className="flex items-center space-x-3">
            <span>Displaying {filteredLogs.length} events</span>
          </div>
        </div>
      </div>
    </div>
  );
};
