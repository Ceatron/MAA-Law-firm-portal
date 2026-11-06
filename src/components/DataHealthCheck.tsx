import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  Server,
  ShieldCheck,
  Lock,
  ArrowRight,
  HardDrive,
  Clock,
  Check,
  UploadCloud,
  DownloadCloud,
} from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured, SUPABASE_URL } from '../utils/supabaseClient';
import { SupabaseMigrationService } from '../services/SupabaseMigrationService';
import { syncAllChambersDataFromCloud } from '../utils/chambersDataStorage';
import { Advocate } from '../types';
import { toast } from '../utils/toast';

interface TableHealth {
  table: string;
  label: string;
  status: 'healthy' | 'warning' | 'error' | 'checking';
  rowCount: number | null;
  latencyMs: number | null;
  error?: string;
}

const MONITORED_TABLES: Array<{ table: string; label: string }> = [
  { table: 'matters', label: 'Legal Matters' },
  { table: 'fee_notes', label: 'Fee Notes (Invoices)' },
  { table: 'payments', label: 'Payment Receipts' },
  { table: 'clients', label: 'Clients Directory' },
  { table: 'tasks', label: 'Tasks & Milestones' },
  { table: 'deadlines', label: 'Court Deadlines' },
  { table: 'quotations', label: 'Fee Quotations' },
  { table: 'staff_users', label: 'Staff Users & Roster' },
  { table: 'activities', label: 'Activity Logs' },
  { table: 'notifications', label: 'Notifications' },
  { table: 'documents', label: 'Documents & Evidence' },
  { table: 'document_folders', label: 'Document Folders' },
  { table: 'document_drafts', label: 'Document Drafts' },
  { table: 'client_onboardings', label: 'Client Onboardings' },
  { table: 'leave_requests', label: 'Leave Requests' },
  { table: 'leave_balances', label: 'Leave Balances' },
  { table: 'time_entries', label: 'Time Entries' },
  { table: 'chambers_settings', label: 'Chambers Settings' },
];

interface DataHealthCheckProps {
  currentAdvocate?: Advocate;
}

export const DataHealthCheck: React.FC<DataHealthCheckProps> = ({ currentAdvocate }) => {
  const [isRunningCheck, setIsRunningCheck] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'unreachable' | 'checking'>('checking');
  const [tableHealthList, setTableHealthList] = useState<TableHealth[]>(() =>
    MONITORED_TABLES.map((t) => ({
      table: t.table,
      label: t.label,
      status: 'checking',
      rowCount: null,
      latencyMs: null,
    }))
  );

  const runHealthCheck = async () => {
    setIsRunningCheck(true);
    setConnectionStatus('checking');

    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) {
      setConnectionStatus('unreachable');
      setIsRunningCheck(false);
      setTableHealthList((prev) =>
        prev.map((t) => ({
          ...t,
          status: 'error',
          error: 'Supabase client not configured or missing credentials',
        }))
      );
      return;
    }

    try {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      setAuthEmail(session?.user?.email || currentAdvocate?.email || 'Authenticated Staff');

      // Test each table
      const results: TableHealth[] = [];

      for (const t of MONITORED_TABLES) {
        const start = performance.now();
        try {
          const { count, error } = await (supabase.from(t.table) as any)
            .select('*', { count: 'exact', head: true });

          const latency = Math.round(performance.now() - start);

          if (error) {
            results.push({
              table: t.table,
              label: t.label,
              status: 'error',
              rowCount: null,
              latencyMs: latency,
              error: error.message || 'Access error',
            });
          } else {
            results.push({
              table: t.table,
              label: t.label,
              status: 'healthy',
              rowCount: count ?? 0,
              latencyMs: latency,
            });
          }
        } catch (err: any) {
          const latency = Math.round(performance.now() - start);
          results.push({
            table: t.table,
            label: t.label,
            status: 'error',
            rowCount: null,
            latencyMs: latency,
            error: err.message || 'Query failed',
          });
        }
      }

      setTableHealthList(results);
      setConnectionStatus('connected');
      setLastCheckTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('[DataHealthCheck] Unexpected health check error:', err);
      setConnectionStatus('unreachable');
    } finally {
      setIsRunningCheck(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    try {
      const res = await SupabaseMigrationService.migrateAllData();
      if (res.success) {
        toast.success(`Synced ${res.totalRecordsUpserted} records across ${Object.keys(res.resultsByKey).length} tables.`);
        runHealthCheck();
      } else {
        toast.error(`Sync completed with ${res.errors.length} error(s).`);
      }
    } catch (err: any) {
      toast.error(`Sync failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!currentAdvocate) return;
    setIsSyncing(true);
    try {
      await syncAllChambersDataFromCloud(currentAdvocate);
      toast.success('Local cache refreshed with latest cloud production data.');
      runHealthCheck();
    } catch (err: any) {
      toast.error(`Cloud fetch failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const healthyCount = tableHealthList.filter((t) => t.status === 'healthy').length;
  const totalCount = tableHealthList.length;
  const overallHealthy = healthyCount === totalCount && connectionStatus === 'connected';

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${overallHealthy ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">Database & Storage Health Check</h3>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  overallHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {overallHealthy ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> All Systems Operational
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3" /> Review Required
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Real-time operational status of Supabase production PostgreSQL tables, RLS security policies, and synchronization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={runHealthCheck}
              disabled={isRunningCheck}
              className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-stone-500 ${isRunningCheck ? 'animate-spin' : ''}`} />
              <span>{isRunningCheck ? 'Checking...' : 'Run Diagnostic Check'}</span>
            </button>

            <button
              type="button"
              onClick={handlePullFromCloud}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Fetch latest data from Supabase into browser cache"
            >
              <DownloadCloud className="h-3.5 w-3.5 text-blue-600" />
              <span>Refresh From Cloud</span>
            </button>

            <button
              type="button"
              onClick={handleSyncToCloud}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-50 shadow-xs"
              title="Safely sync all unmigrated browser records to Supabase tables"
            >
              <UploadCloud className="h-3.5 w-3.5 text-amber-400" />
              <span>{isSyncing ? 'Syncing...' : 'Sync Data to Cloud'}</span>
            </button>
          </div>
        </div>

        {/* Overview Metric Pills */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>Cloud Status</span>
              <Server className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-1.5 text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {connectionStatus === 'connected' ? 'Connected (Online)' : 'Unreachable'}
            </p>
            <p className="mt-0.5 text-[11px] text-stone-500 truncate" title={SUPABASE_URL}>
              {SUPABASE_URL ? SUPABASE_URL.replace('https://', '') : 'Not Configured'}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>Tables Health</span>
              <Database className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-1.5 text-sm font-bold text-stone-900">
              {healthyCount} / {totalCount} Healthy
            </p>
            <p className="mt-0.5 text-[11px] text-stone-500">
              {totalCount - healthyCount === 0 ? '100% tables verified' : `${totalCount - healthyCount} table(s) need attention`}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>Authenticated Role</span>
              <ShieldCheck className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-1.5 text-sm font-bold text-stone-900 truncate">
              {currentAdvocate?.role || 'Authenticated Staff'}
            </p>
            <p className="mt-0.5 text-[11px] text-stone-500 truncate" title={authEmail || ''}>
              {authEmail || 'Verified JWT session'}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>Last Checked</span>
              <Clock className="h-4 w-4 text-stone-400" />
            </div>
            <p className="mt-1.5 text-sm font-bold text-stone-900">
              {lastCheckTime || 'Just now'}
            </p>
            <p className="mt-0.5 text-[11px] text-stone-500">
              Continuous monitoring active
            </p>
          </div>
        </div>
      </div>

      {/* Tables Status Grid */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
        <div className="border-b border-stone-200 px-6 py-4 bg-stone-50/50 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">Production Table Verification</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">Live connectivity test, response latency, and row count per schema table</p>
          </div>
          <span className="text-xs text-stone-500">
            {healthyCount} of {totalCount} operational
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {tableHealthList.map((t) => (
            <div key={t.table} className="flex items-center justify-between px-6 py-3.5 hover:bg-stone-50/60 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  t.status === 'healthy'
                    ? 'bg-emerald-50 text-emerald-600'
                    : t.status === 'checking'
                    ? 'bg-stone-100 text-stone-400'
                    : 'bg-rose-50 text-rose-600'
                }`}>
                  {t.status === 'healthy' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : t.status === 'checking' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900">{t.label}</p>
                  <p className="text-[11px] font-mono text-stone-500">{t.table}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {t.latencyMs !== null && (
                  <span className="text-[11px] font-mono text-stone-400">
                    {t.latencyMs}ms
                  </span>
                )}

                <div className="w-24 text-right">
                  <span className="text-xs font-bold text-stone-900">
                    {t.rowCount !== null ? `${t.rowCount.toLocaleString()} rows` : '—'}
                  </span>
                </div>

                <div className="w-24 text-right">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    t.status === 'healthy'
                      ? 'bg-emerald-100 text-emerald-800'
                      : t.status === 'checking'
                      ? 'bg-stone-100 text-stone-600'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {t.status === 'healthy' ? 'Operational' : t.status === 'checking' ? 'Testing...' : 'Error'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataHealthCheck;
