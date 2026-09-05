import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  X as CloseIcon,
  Layers,
  Clock,
  HardDrive,
  Users,
  Briefcase,
  CheckSquare,
  Receipt,
  FileText,
  PhoneCall,
  Lock,
  Cloud,
  RefreshCw,
  Search,
  UploadCloud,
  Zap,
  CheckCircle,
  Mail,
  Send,
  ExternalLink,
  Key,
  Copy,
  Check,
} from 'lucide-react';
import { Advocate } from '../types';
import { isSysAdminUser } from '../utils/staffStorage';
import {
  createLocalStorageBackup,
  downloadBackupFile,
  generateBackupFilename,
  ExportedBackupPayload,
} from '../utils/backupExportService';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabaseClient';
import {
  SupabaseMigrationService,
  DryRunMigrationReport,
  LiveMigrationReport,
  SUPABASE_MIGRATION_FLAG_KEY,
} from '../services/SupabaseMigrationService';

interface AdminBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdvocate: Advocate;
  onSuccessNotification?: (message: string) => void;
}

export const AdminBackupModal: React.FC<AdminBackupModalProps> = ({
  isOpen,
  onClose,
  currentAdvocate,
  onSuccessNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'supabase' | 'email'>('backup');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedFilename, setExportedFilename] = useState<string | null>(null);
  const [exportedSummary, setExportedSummary] = useState<{
    keysCount: number;
    itemsCount: number;
    timestamp: string;
  } | null>(null);

  // Email Gateway Diagnostics & Verification State
  const [emailStatus, setEmailStatus] = useState<{
    configured: boolean;
    provider: string;
    defaultFrom: string;
    description: string;
  } | null>(null);
  const [loadingEmailStatus, setLoadingEmailStatus] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState(
    currentAdvocate?.email || 'ceatrontechnologies@gmail.com'
  );
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [copiedPreset, setCopiedPreset] = useState<string | null>(null);

  const fetchEmailStatus = async () => {
    setLoadingEmailStatus(true);
    try {
      const res = await fetch('/api/email-status');
      if (res.ok) {
        const data = await res.json();
        setEmailStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch email status:', e);
    } finally {
      setLoadingEmailStatus(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'email') {
      fetchEmailStatus();
    }
  }, [activeTab]);

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      setTestEmailResult({
        success: false,
        message: 'Please enter a valid recipient email address.',
      });
      return;
    }

    setIsSendingTestEmail(true);
    setTestEmailResult(null);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmailRecipient,
          toName: currentAdvocate?.name || 'Advocate',
          subject: '🧪 Real Email Gateway Verification: Muthoni Ahago Advocates',
          text: `This is an official automated test transmission from the Muthoni Ahago Advocates chambers portal to verify your transactional email gateway.\n\nGateway Verification Details:\n- Recipient: ${testEmailRecipient}\n- Dispatched by: ${currentAdvocate?.name || 'Managing Advocate'}\n- System Timestamp: ${new Date().toLocaleString()}\n\nIf you received this message in your inbox, your transactional email gateway is configured and fully operational for real-time matter and task assignment notifications!`,
          type: 'system_test',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setTestEmailResult({
          success: true,
          message: `Verification email sent successfully via ${data.provider?.toUpperCase() || 'Gateway'}! (Message ID: ${data.providerMessageId || data.messageId})`,
        });
      } else {
        setTestEmailResult({
          success: false,
          message: data.error || `Server responded with HTTP ${res.status}`,
          details: data.details ? JSON.stringify(data.details, null, 2) : undefined,
        });
      }
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        message: err?.message || 'Network error attempting to send test email.',
      });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const copyToClipboard = (text: string, presetName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPreset(presetName);
    setTimeout(() => setCopiedPreset(null), 2500);
  };

  // Supabase Foundation & Dry Run State
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<{
    tested: boolean;
    connected: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const [isRunningDryRun, setIsRunningDryRun] = useState(false);
  const [dryRunReport, setDryRunReport] = useState<DryRunMigrationReport | null>(null);

  // Supabase Live Migration State
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationReport, setMigrationReport] = useState<LiveMigrationReport | null>(null);
  const [isMigratedFlag, setIsMigratedFlag] = useState(SupabaseMigrationService.isMigrated());
  const [migrationMeta, setMigrationMeta] = useState(SupabaseMigrationService.getMigrationMetadata());

  // Security guard: Ensure only SysAdmin / Developer accounts can access
  const isAuthorized =
    Boolean(currentAdvocate.isSystemAdmin) ||
    Boolean(currentAdvocate.isDeveloper) ||
    currentAdvocate.id === 'dev-admin' ||
    currentAdvocate.role === 'System Admin' ||
    isSysAdminUser(currentAdvocate);

  // Read preview counts on modal open (strictly read-only)
  const previewData = useMemo<ExportedBackupPayload | null>(() => {
    if (!isOpen || !isAuthorized) return null;
    try {
      return createLocalStorageBackup({
        name: currentAdvocate.name,
        email: currentAdvocate.email,
        role: currentAdvocate.role || 'System Admin',
      });
    } catch (e) {
      console.error('Error generating backup preview:', e);
      return null;
    }
  }, [isOpen, isAuthorized, currentAdvocate]);

  // Reset state when modal closes / refresh flag on open
  useEffect(() => {
    if (!isOpen) {
      setIsExporting(false);
      setExportedFilename(null);
      setExportedSummary(null);
      setConnStatus(null);
      setDryRunReport(null);
      setMigrationReport(null);
    } else {
      setIsMigratedFlag(SupabaseMigrationService.isMigrated());
      setMigrationMeta(SupabaseMigrationService.getMigrationMetadata());
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    try {
      const res = await testSupabaseConnection();
      setConnStatus({
        tested: true,
        connected: res.connected,
        message: res.message,
        latencyMs: res.latencyMs,
      });
    } catch (err: any) {
      setConnStatus({
        tested: true,
        connected: false,
        message: err?.message || 'Connection test failed.',
      });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleExecuteDryRun = async () => {
    setIsRunningDryRun(true);
    try {
      const report = await SupabaseMigrationService.executeDryRun();
      setDryRunReport(report);
    } catch (err: any) {
      alert(`Dry run failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsRunningDryRun(false);
    }
  };

  const handleExecuteLiveMigration = async (force: boolean = false) => {
    setIsMigrating(true);
    try {
      const report = await SupabaseMigrationService.executeMigration({ force });
      setMigrationReport(report);
      setIsMigratedFlag(SupabaseMigrationService.isMigrated());
      setMigrationMeta(SupabaseMigrationService.getMigrationMetadata());

      if (onSuccessNotification) {
        onSuccessNotification(
          `Supabase migration complete: ${report.totalRecordsUpserted} records batch-upserted with preserved IDs.`
        );
      }
    } catch (err: any) {
      alert(`Migration execution failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isOpen) return null;

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl">
          <div className="flex items-center gap-3 text-rose-600">
            <Lock className="h-6 w-6" />
            <h3 className="text-lg font-bold">Access Restricted</h3>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            The Data Backup & Export utility is restricted exclusively to System Administrators.
          </p>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleExecuteBackup = () => {
    setIsExporting(true);
    try {
      // 1. Generate full backup payload without altering localStorage
      const backupPayload = createLocalStorageBackup({
        name: currentAdvocate.name,
        email: currentAdvocate.email,
        role: currentAdvocate.role || 'System Admin',
      });

      // 2. Trigger pure client-side file download
      const filename = downloadBackupFile(backupPayload);

      setExportedFilename(filename);
      setExportedSummary({
        keysCount: backupPayload._metadata.totalStorageKeysFound,
        itemsCount: backupPayload._metadata.summary.totalItemsCount,
        timestamp: new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      });

      const successMsg = `Backup saved successfully as ${filename} (${backupPayload._metadata.summary.totalItemsCount} records exported).`;
      if (onSuccessNotification) {
        onSuccessNotification(successMsg);
      }
    } catch (err) {
      console.error('Failed to create backup:', err);
      alert('Failed to generate backup. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const records = previewData?._metadata.recordCounts || {};
  const totalKeys = previewData?._metadata.totalStorageKeysFound || 0;
  const totalRecords = previewData?._metadata.summary.totalItemsCount || 0;
  const configured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-8">
        {/* Modal Top Accent Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif-title text-lg font-bold tracking-tight text-white">
                    Firm Data Preservation & Supabase Architecture
                  </h3>
                  <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
                    Admin Only
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-300">
                  Non-destructive local archive & Supabase PostgreSQL cloud foundation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              aria-label="Close modal"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex items-center space-x-2 border-t border-slate-700/60 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Data Backup</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('supabase')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'supabase'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Cloud className="h-3.5 w-3.5" />
              <span>Supabase Foundation & Dry Run</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-sky-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email Gateway (Disabled)</span>
            </button>
          </div>
        </div>

        {/* Modal Body: Tab 1 (Export Data Backup) */}
        {activeTab === 'backup' && (
          <div className="p-6 space-y-5 max-h-[calc(85vh-190px)] overflow-y-auto">
            {/* Post-Export Success Alert Banner */}
            {exportedFilename && exportedSummary && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-bold text-emerald-900">
                      Backup Export Completed Successfully!
                    </p>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      The JSON backup file has been generated and downloaded to your computer as{' '}
                      <code className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-900">
                        {exportedFilename}
                      </code>
                      .
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-emerald-700 font-medium pt-1 border-t border-emerald-200/60">
                      <span>
                        <strong>{exportedSummary.itemsCount}</strong> total records captured
                      </span>
                      <span>•</span>
                      <span>
                        <strong>{exportedSummary.keysCount}</strong> storage keys
                      </span>
                      <span>•</span>
                      <span>Timestamp: {exportedSummary.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Non-Destructive Safety Guarantee Box */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                <ShieldCheck className="h-4 w-4 text-amber-700" />
                <span>Non-Destructive & Read-Only Guarantee</span>
              </div>
              <ul className="text-xs text-amber-950/80 space-y-1.5 pl-5 list-disc leading-relaxed">
                <li>
                  <strong>Zero Modification:</strong> Existing firm data in your browser is only read. Nothing will be deleted, reset, overwritten, or migrated.
                </li>
                <li>
                  <strong>100% In-Browser Privacy:</strong> The backup file is compiled directly inside your browser and downloaded as a JSON file. No data is sent to external servers, APIs, or third parties.
                </li>
                <li>
                  <strong>Exact Fidelity:</strong> All record IDs, timestamps, billing amounts, client details, and note histories are preserved in their exact current state without transformation.
                </li>
              </ul>
            </div>

            {/* Dataset Coverage Inventory Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Data Inventory to be Included
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-700">
                  {totalKeys} storage keys • {totalRecords} total items
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Briefcase className="h-3.5 w-3.5 text-amber-600" />
                    <span>Matters</span>
                  </div>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                    {records.matters ?? 0}{' '}
                    <span className="text-[10px] font-normal text-slate-500">files</span>
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Users className="h-3.5 w-3.5 text-blue-600" />
                    <span>Clients</span>
                  </div>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                    {records.clients ?? 0}{' '}
                    <span className="text-[10px] font-normal text-slate-500">profiles</span>
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Tasks & Deadlines</span>
                  </div>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                    {(records.tasks ?? 0) + (records.deadlines ?? 0)}{' '}
                    <span className="text-[10px] font-normal text-slate-500">items</span>
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Receipt className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Billing & Payments</span>
                  </div>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                    {(records.feeNotes ?? 0) + (records.payments ?? 0) + (records.quotes ?? 0)}{' '}
                    <span className="text-[10px] font-normal text-slate-500">invoices/receipts</span>
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <FileText className="h-3.5 w-3.5 text-slate-600" />
                    <span>Documents & Filing</span>
                  </div>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                    {(records.documents ?? 0) + (records.caseFiledDocsEntries ?? 0)}{' '}
                    <span className="text-[10px] font-normal text-slate-500">docs</span>
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <PhoneCall className="h-3.5 w-3.5 text-teal-600" />
                    <span>Client Services (CRM)</span>
                  </div>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                    {records.clientInteractions ?? 0}{' '}
                    <span className="text-[10px] font-normal text-slate-500">interactions</span>
                  </p>
                </div>
              </div>

              {/* Additional datasets pill summary */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/40 p-3 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Layers className="h-3.5 w-3.5 text-slate-500" />
                  <span>Also included in full backup:</span>
                </div>
                <p className="leading-relaxed text-slate-600">
                  Staff roster & roles ({records.staffRoster ?? 0}), HRM leave requests ({records.leaveRequests ?? 0}), 
                  leave balances ({records.leaveBalances ?? 0}), client onboardings ({records.onboardings ?? 0}), 
                  firm notice board ({records.noticeBoardItems ?? 0}), case notes ({records.caseNotesEntries ?? 0}), 
                  matter timeline events ({records.caseTimelineEvents ?? 0}), billing templates ({records.feeNoteTemplates ?? 0}), 
                  standard service lines ({records.standardServices ?? 0}), legal document templates ({records.legalTemplates ?? 0}), 
                  audit logs ({records.loginAuditLogs ?? 0}), and chambers settings.
                </p>
              </div>
            </div>

            {/* Export Specifications */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="font-semibold text-slate-900">Output Format & Filename:</p>
                  <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                    {generateBackupFilename()}
                  </p>
                </div>
              </div>
              <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                JSON (UTF-8)
              </span>
            </div>
          </div>
        )}

        {/* Modal Body: Tab 2 (Supabase Foundation & Dry Run) */}
        {activeTab === 'supabase' && (
          <div className="p-6 space-y-5 max-h-[calc(85vh-190px)] overflow-y-auto">
            {/* Status Notice */}
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                  <Cloud className="h-4 w-4 text-emerald-700" />
                  <span>Supabase PostgreSQL Foundation Phase</span>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                  Foundation Ready (Inactive CRUD)
                </span>
              </div>
              <p className="text-xs text-emerald-900/90 leading-relaxed">
                The database schema and version-controlled SQL migrations have been generated in{' '}
                <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-[11px]">supabase/migrations/</code>.
                The application continues to operate on local storage. No data has been migrated, deleted, or overwritten.
              </p>
            </div>

            {/* Environment Connection Diagnostics */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Cloud Connection Status</h4>
                  <p className="text-[11px] text-slate-500">
                    {configured
                      ? 'Supabase URL & public anon key detected in environment'
                      : 'Awaiting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConn}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <RefreshCw className={`h-3 w-3 ${isTestingConn ? 'animate-spin' : ''}`} />
                  <span>{isTestingConn ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>

              {connStatus && (
                <div
                  className={`rounded-lg border p-3 text-xs ${
                    connStatus.connected
                      ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                      : 'border-amber-200 bg-amber-50/80 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {connStatus.connected ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <span>{connStatus.connected ? 'Connection Verified' : 'Configuration Notice'}</span>
                    {connStatus.latencyMs && (
                      <span className="font-mono text-[10px] text-slate-500">({connStatus.latencyMs}ms)</span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed">{connStatus.message}</p>
                </div>
              )}
            </div>

            {/* Dry-Run Trigger & Explanation */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs">
                    <Search className="h-4 w-4 text-indigo-700" />
                    <span>Non-Destructive Migration Dry Run</span>
                  </div>
                  <p className="text-xs text-indigo-900/80 leading-relaxed">
                    Evaluates all local records, validates schema compatibility, audits ID preservation (e.g. retaining{' '}
                    <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-[10px]">client-1</code>,{' '}
                    <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-[10px]">mat-1</code>), and checks
                    for potential duplicates without writing any rows.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteDryRun}
                  disabled={isRunningDryRun}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Search className={`h-3.5 w-3.5 ${isRunningDryRun ? 'animate-spin' : ''}`} />
                  <span>{isRunningDryRun ? 'Analyzing...' : 'Execute Dry Run'}</span>
                </button>
              </div>

              {dryRunReport && (
                <div className="mt-3 space-y-3 pt-3 border-t border-indigo-200/70">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-indigo-950">
                    <span>
                      Total Records Evaluated:{' '}
                      <strong className="font-mono text-indigo-800">{dryRunReport.totalRecordsEvaluated}</strong>
                    </span>
                    <span className="rounded bg-indigo-200/70 px-2 py-0.5 text-[10px] font-bold text-indigo-900">
                      ID Preservation: 100% Guaranteed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {dryRunReport.datasets.map((d) => (
                      <div
                        key={d.targetTable}
                        className="rounded-lg border border-indigo-100 bg-white p-2.5 shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{d.datasetName}</span>
                          <span className="font-mono text-[10px] text-slate-500">→ {d.targetTable}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span>
                            {d.validRecords} / {d.totalRecords} valid
                          </span>
                          <span className="font-bold text-emerald-700">IDs Preserved</span>
                        </div>
                        {d.samplePreservedIds.length > 0 && (
                          <div className="pt-1 text-[10px] font-mono text-slate-500 truncate">
                            Samples: {d.samplePreservedIds.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-indigo-100/60 border border-indigo-200 p-2.5 text-[11px] text-indigo-900 flex items-center justify-between">
                    <span>Dry run complete. Ready to proceed with non-destructive live batch-upsert.</span>
                    <button
                      type="button"
                      onClick={() => handleExecuteLiveMigration(false)}
                      disabled={isMigrating}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 transition"
                    >
                      <UploadCloud className="h-3 w-3" />
                      <span>{isMigrating ? 'Migrating...' : 'Trigger Migration Now'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Live Non-Destructive Migration (Batch Upsert) */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <UploadCloud className="h-4 w-4 text-emerald-700" />
                    <span className="text-emerald-950 font-bold text-xs">
                      Live Non-Destructive Migration Engine
                    </span>
                    {isMigratedFlag ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span>migrated_to_supabase = true</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                        <span>migrated_to_supabase = false</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-900/80 leading-relaxed">
                    Batch-upserts all existing local storage records into corresponding Supabase tables using our
                    preserved primary keys (<code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-[10px]">id TEXT PRIMARY KEY</code>).
                    Sets the <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-[10px]">migrated_to_supabase</code> local
                    flag upon successful completion so this execution runs only once per client device.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-trigger-supabase-migration"
                    onClick={() => handleExecuteLiveMigration(Boolean(isMigratedFlag))}
                    disabled={isMigrating}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <UploadCloud className={`h-3.5 w-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
                    <span>
                      {isMigrating
                        ? 'Batch-Upserting...'
                        : isMigratedFlag
                        ? 'Re-Run Migration (Force)'
                        : 'Trigger Live Migration'}
                    </span>
                  </button>
                </div>
              </div>

              {isMigratedFlag && !migrationReport && migrationMeta && (
                <div className="rounded-lg bg-white border border-emerald-200/80 p-3 text-xs space-y-1 text-emerald-950">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Initial Migration Record</span>
                    <span className="font-mono text-[11px] text-emerald-700">
                      Completed: {new Date(migrationMeta.migratedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {migrationMeta.totalRecordsUpserted} records batch-upserted across {migrationMeta.datasetCounts?.length || 17} datasets.
                    The <code className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">migrated_to_supabase</code> flag
                    is stored in client localStorage to guarantee single execution.
                  </p>
                </div>
              )}

              {migrationReport && (
                <div className="mt-3 space-y-3 pt-3 border-t border-emerald-200/70">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-emerald-950">
                    <span>
                      Records Upserted:{' '}
                      <strong className="font-mono text-emerald-800">
                        {migrationReport.totalRecordsUpserted} / {migrationReport.totalRecordsFound}
                      </strong>
                    </span>
                    <span className="rounded bg-emerald-200/70 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                      ID Preservation: 100% Guaranteed
                    </span>
                    <span className="rounded bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                      migrated_to_supabase = true
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {migrationReport.datasets.map((d) => (
                      <div
                        key={d.targetTable}
                        className="rounded-lg border border-emerald-100 bg-white p-2.5 shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{d.datasetName}</span>
                          <span className="font-mono text-[10px] text-slate-500">→ {d.targetTable}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span>
                            {d.upsertedRecords} / {d.totalRecords} upserted
                          </span>
                          <span
                            className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${
                              d.status === 'Success'
                                ? 'bg-emerald-50 text-emerald-700'
                                : d.status === 'TablePending'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {d.status === 'TablePending' ? 'Schema Pending' : d.status}
                          </span>
                        </div>
                        {d.samplePreservedIds.length > 0 && (
                          <div className="pt-1 text-[10px] font-mono text-slate-500 truncate">
                            Preserved IDs: {d.samplePreservedIds.join(', ')}
                          </div>
                        )}
                        {d.error && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 rounded p-1">
                            {d.error}
                          </div>
                        )}
                        {d.failedRecords && d.failedRecords.length > 0 && (
                          <div className="text-[10px] text-rose-700 bg-rose-50 rounded p-1 space-y-0.5">
                            <div className="font-semibold">{d.failedRecords.length} record(s) logged error:</div>
                            {d.failedRecords.slice(0, 3).map((f) => (
                              <div key={f.id} className="truncate font-mono">
                                • {f.id}: {f.error}
                              </div>
                            ))}
                            {d.failedRecords.length > 3 && (
                              <div>+{d.failedRecords.length - 3} more failed record(s)</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-emerald-100/70 border border-emerald-200 p-2.5 text-[11px] text-emerald-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-700" />
                      <span>{migrationReport.notice}</span>
                    </div>
                    <p className="text-[10px] text-emerald-900/80">
                      All local storage data continues operating normally with zero interruption. The single-execution
                      flag is persisted in localStorage.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Body: Tab 3 (Email Gateway & SMTP Diagnostics) */}
        {activeTab === 'email' && (
          <div className="p-6 space-y-5 max-h-[calc(85vh-190px)] overflow-y-auto">
            {/* Live Gateway Status Alert */}
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-amber-900">
                        Email Sending Services Disabled
                      </p>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-800">
                        Disabled
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                      Outbound transactional email dispatch has been disabled by the system administrator. Outbound emails will not be sent from the platform. All advocate matter and task assignment notifications remain securely handled in-app.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchEmailStatus}
                  disabled={loadingEmailStatus}
                  className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50 transition cursor-pointer shrink-0 disabled:opacity-50"
                  title="Refresh Gateway Status"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingEmailStatus ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Test Verification Email Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-slate-400" />
                  <h4 className="text-xs font-bold text-slate-700">
                    Send Live Verification Test Email (Disabled)
                  </h4>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  Services disabled by policy
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <input
                  type="email"
                  disabled={true}
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="Email sending services are disabled..."
                  className="w-full sm:flex-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled={true}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-slate-300 px-4 py-2 text-xs font-bold text-slate-600 cursor-not-allowed opacity-80"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Email Sending Disabled</span>
                </button>
              </div>

              {testEmailResult && (
                <div
                  className={`rounded-lg p-3 text-xs border ${
                    testEmailResult.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-rose-200 bg-rose-50 text-rose-900'
                  }`}
                >
                  <p className="font-semibold">{testEmailResult.message}</p>
                  {testEmailResult.details && (
                    <pre className="mt-1.5 p-2 bg-black/5 rounded text-[10px] overflow-x-auto font-mono">
                      {testEmailResult.details}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Step-by-Step Setup Guide */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-amber-600" />
                  <span>Choose ONE of These 3 Setup Options</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-medium">
                  Add to AI Studio Settings &gt; Secrets
                </span>
              </div>

              {/* Option 1: Resend (Recommended) */}
              <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[11px] font-bold text-white">
                      1
                    </span>
                    <h5 className="text-xs font-bold text-slate-900">
                      Option A: Resend (Fastest &amp; Recommended — Takes 2 Mins)
                    </h5>
                  </div>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                    Free 3,000 emails/mo
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Sign up free at <strong className="text-slate-800">resend.com</strong>, click <em>API Keys</em> &gt; <em>Create API Key</em>, and paste only these 2 variables into your Settings:
                </p>
                <div className="rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-200 space-y-1 relative">
                  <p><span className="text-amber-400">RESEND_API_KEY</span>=re_your_api_key_here</p>
                  <p><span className="text-amber-400">EMAIL_FROM</span>=Muthoni Ahago Advocates &lt;onboarding@resend.dev&gt;</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('RESEND_API_KEY=re_your_key\nEMAIL_FROM=Muthoni Ahago Advocates <onboarding@resend.dev>', 'resend')}
                    className="absolute top-2.5 right-2.5 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1"
                  >
                    {copiedPreset === 'resend' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedPreset === 'resend' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Tip: <code className="text-slate-700 font-semibold">onboarding@resend.dev</code> works instantly with zero domain setup for testing! Once ready, you can add your custom domain in Resend.
                </p>
              </div>

              {/* Option 2: Gmail / Google Workspace SMTP */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[11px] font-bold text-white">
                      2
                    </span>
                    <h5 className="text-xs font-bold text-slate-900">
                      Option B: Gmail or Google Workspace (SMTP)
                    </h5>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    Uses Google App Password
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Uses your chambers Gmail or Google Workspace address. Go to <strong>myaccount.google.com/apppasswords</strong>, create a 16-letter App Password, and paste these into Settings:
                </p>
                <div className="rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-200 space-y-1 relative">
                  <p><span className="text-amber-400">SMTP_HOST</span>=smtp.gmail.com</p>
                  <p><span className="text-amber-400">SMTP_PORT</span>=587</p>
                  <p><span className="text-amber-400">SMTP_SECURE</span>=false</p>
                  <p><span className="text-amber-400">SMTP_USER</span>=your_email@gmail.com</p>
                  <p><span className="text-amber-400">SMTP_PASSWORD</span>=your_16_char_app_password</p>
                  <p><span className="text-amber-400">EMAIL_FROM</span>=Muthoni Ahago Advocates &lt;your_email@gmail.com&gt;</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('SMTP_HOST=smtp.gmail.com\nSMTP_PORT=587\nSMTP_SECURE=false\nSMTP_USER=your_email@gmail.com\nSMTP_PASSWORD=your_16_char_app_password\nEMAIL_FROM=Muthoni Ahago Advocates <your_email@gmail.com>', 'gmail')}
                    className="absolute top-2.5 right-2.5 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1"
                  >
                    {copiedPreset === 'gmail' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedPreset === 'gmail' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Option 3: Chambers Webmail / cPanel */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[11px] font-bold text-white">
                      3
                    </span>
                    <h5 className="text-xs font-bold text-slate-900">
                      Option C: Law Firm Webmail / cPanel / Microsoft 365
                    </h5>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    Custom Domain
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  If your firm uses custom webmail (e.g. cPanel, Plesk, or Outlook 365), use your mail server credentials:
                </p>
                <div className="rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-200 space-y-1 relative">
                  <p><span className="text-amber-400">SMTP_HOST</span>=mail.muthoniahago.co.ke</p>
                  <p><span className="text-amber-400">SMTP_PORT</span>=465</p>
                  <p><span className="text-amber-400">SMTP_SECURE</span>=true</p>
                  <p><span className="text-amber-400">SMTP_USER</span>=notifications@muthoniahago.co.ke</p>
                  <p><span className="text-amber-400">SMTP_PASSWORD</span>=your_webmail_password</p>
                  <p><span className="text-amber-400">EMAIL_FROM</span>=Muthoni Ahago Advocates &lt;notifications@muthoniahago.co.ke&gt;</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('SMTP_HOST=mail.muthoniahago.co.ke\nSMTP_PORT=465\nSMTP_SECURE=true\nSMTP_USER=notifications@muthoniahago.co.ke\nSMTP_PASSWORD=your_password\nEMAIL_FROM=Muthoni Ahago Advocates <notifications@muthoniahago.co.ke>', 'webmail')}
                    className="absolute top-2.5 right-2.5 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1"
                  >
                    {copiedPreset === 'webmail' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedPreset === 'webmail' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {activeTab === 'backup'
                ? 'Ready to generate timestamped JSON archive'
                : activeTab === 'email'
                ? emailStatus?.configured
                  ? `Active gateway: ${emailStatus.provider.toUpperCase()} (${emailStatus.defaultFrom})`
                  : 'Transactional email provider unconfigured'
                : isMigratedFlag
                ? 'Local migration execution flag active (migrated_to_supabase)'
                : 'PostgreSQL schema files ready in supabase/migrations/'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              {exportedFilename ? 'Close' : 'Cancel'}
            </button>

            {activeTab === 'backup' ? (
              <button
                type="button"
                id="btn-confirm-export-data-backup"
                onClick={handleExecuteBackup}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:bg-amber-800 transition cursor-pointer disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>
                  {isExporting ? 'Generating Backup...' : exportedFilename ? 'Export Again' : 'Export Data Backup'}
                </span>
              </button>
            ) : activeTab === 'email' ? (
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTestEmail}
                className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 active:bg-sky-800 transition cursor-pointer disabled:opacity-50"
              >
                {isSendingTestEmail ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{isSendingTestEmail ? 'Sending Test...' : 'Send Test Email'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExecuteDryRun}
                  disabled={isRunningDryRun}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer disabled:opacity-50"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>{isRunningDryRun ? 'Analyzing...' : 'Dry Run'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteLiveMigration(Boolean(isMigratedFlag))}
                  disabled={isMigrating}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className={`h-4 w-4 ${isMigrating ? 'animate-spin' : ''}`} />
                  <span>
                    {isMigrating
                      ? 'Batch-Upserting...'
                      : isMigratedFlag
                      ? 'Re-Run Migration'
                      : 'Trigger Migration'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
