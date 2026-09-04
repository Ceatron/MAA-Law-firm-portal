/**
 * Backup Export Service (Read-Only)
 *
 * Provides non-destructive, read-only backup capabilities for all browser
 * localStorage application data. Does NOT modify, delete, overwrite, or
 * alter any existing keys or values in localStorage.
 */

export interface BackupMetadata {
  applicationName: string;
  backupFormatVersion: string;
  exportTimestamp: string;
  exportedBy: {
    name: string;
    email: string;
    role: string;
  };
  totalStorageKeysFound: number;
  storageKeysIncluded: string[];
  recordCounts: Record<string, number>;
  summary: {
    totalItemsCount: number;
    dynamicMatterKeysCount: number;
    additionalKeysCount: number;
  };
}

export interface ExportedBackupPayload {
  _metadata: BackupMetadata;
  datasets: {
    matters: any;
    clients: any;
    tasks: any;
    deadlines: any;
    activities: any;
    notifications: any;
    feeNotes: any;
    payments: any;
    quotes: any;
    documents: any;
    folders: any;
    drafts: any;
    onboardings: any;
    leaveRequests: any;
    leaveBalances: any;
    staffRoster: any;
    authSession: any;
    loginAuditLogs: any;
    chambersSettings: any;
    feeNoteTemplates: any;
    standardServices: any;
    legalTemplates: any;
    clientInteractions: any;
    clientServicesConfig: any;
    noticeBoardItems: any;
    outboundEmails: any;
    aiAgentChat: any;
    caseNotes: Record<string, any>;
    caseTimelineEvents: Record<string, any>;
    caseFiledDocs: Record<string, any>;
    additionalStorage: Record<string, any>;
  };
  rawLocalStorageDump: Record<string, any>;
}

// Known Application Storage Keys
export const KNOWN_STORAGE_KEYS = {
  MATTERS: 'muthoni_ahago_matters_v1',
  CLIENTS: 'muthoni_ahago_clients_v1',
  TASKS: 'muthoni_ahago_tasks_v1',
  DEADLINES: 'muthoni_ahago_deadlines_v1',
  ACTIVITIES: 'muthoni_ahago_activities_v1',
  NOTIFICATIONS: 'muthoni_ahago_notifications_v1',
  FEE_NOTES: 'muthoni_ahago_fee_notes_v1',
  PAYMENTS: 'muthoni_ahago_payments_v1',
  QUOTES: 'muthoni_ahago_quotes_v1',
  DOCUMENTS: 'muthoni_ahago_documents_v1',
  FOLDERS: 'muthoni_ahago_folders_v1',
  DRAFTS: 'muthoni_ahago_drafts_v1',
  ONBOARDINGS: 'muthoni_ahago_onboardings_v1',
  LEAVE_REQUESTS: 'muthoni_ahago_leave_requests_v1',
  LEAVE_BALANCES: 'muthoni_ahago_leave_balances_v1',
  STAFF_ROSTER: 'muthoni_ahago_staff_roster_v12',
  AUTH_SESSION: 'muthoni_ahago_auth_session_v2',
  LOGIN_AUDIT_LOGS: 'muthoni_ahago_login_audit_logs_v2',
  CHAMBERS_SETTINGS: 'muthoni_ahago_chambers_settings_v1',
  FEE_NOTE_TEMPLATES: 'maa_chambers_fee_note_templates_v1',
  STANDARD_SERVICES: 'maa_chambers_standard_services_v1',
  LEGAL_TEMPLATES: 'maa_chambers_legal_templates_v1',
  CLIENT_INTERACTIONS: 'chambers_client_interactions_clean_v2',
  CLIENT_SERVICES_CONFIG: 'chambers_client_services_config_v1',
  NOTICE_BOARD: 'chambers_notice_board_items_v3',
  OUTBOUND_EMAILS: 'chambers_outbound_emails',
  AI_CHAT: 'chambers_ai_agent_chat',
  SIDEBAR_STATE: 'chambers_sidebar_collapsed',
} as const;

/**
 * Safely parses raw string from localStorage without altering anything.
 * If string is valid JSON, returns the parsed JSON object/array;
 * if not, returns the raw string as stored.
 */
function readStorageRaw(key: string): any {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch (err) {
    console.warn(`[BackupExport] Could not read key "${key}" from localStorage:`, err);
    return null;
  }
}

/**
 * Collects complete backup payload from browser localStorage.
 * READ-ONLY operation. Does not modify any data.
 */
export function createLocalStorageBackup(exporterInfo?: {
  name?: string;
  email?: string;
  role?: string;
}): ExportedBackupPayload {
  const timestamp = new Date().toISOString();
  const keysIncludedSet = new Set<string>();

  // 1. Read all standard predefined datasets
  const matters = readStorageRaw(KNOWN_STORAGE_KEYS.MATTERS);
  const clients = readStorageRaw(KNOWN_STORAGE_KEYS.CLIENTS);
  const tasks = readStorageRaw(KNOWN_STORAGE_KEYS.TASKS);
  const deadlines = readStorageRaw(KNOWN_STORAGE_KEYS.DEADLINES);
  const activities = readStorageRaw(KNOWN_STORAGE_KEYS.ACTIVITIES);
  const notifications = readStorageRaw(KNOWN_STORAGE_KEYS.NOTIFICATIONS);
  const feeNotes = readStorageRaw(KNOWN_STORAGE_KEYS.FEE_NOTES);
  const payments = readStorageRaw(KNOWN_STORAGE_KEYS.PAYMENTS);
  const quotes = readStorageRaw(KNOWN_STORAGE_KEYS.QUOTES);
  const documents = readStorageRaw(KNOWN_STORAGE_KEYS.DOCUMENTS);
  const folders = readStorageRaw(KNOWN_STORAGE_KEYS.FOLDERS);
  const drafts = readStorageRaw(KNOWN_STORAGE_KEYS.DRAFTS);
  const onboardings = readStorageRaw(KNOWN_STORAGE_KEYS.ONBOARDINGS);
  const leaveRequests = readStorageRaw(KNOWN_STORAGE_KEYS.LEAVE_REQUESTS);
  const leaveBalances = readStorageRaw(KNOWN_STORAGE_KEYS.LEAVE_BALANCES);
  const staffRoster = readStorageRaw(KNOWN_STORAGE_KEYS.STAFF_ROSTER);
  const authSession = readStorageRaw(KNOWN_STORAGE_KEYS.AUTH_SESSION);
  const loginAuditLogs = readStorageRaw(KNOWN_STORAGE_KEYS.LOGIN_AUDIT_LOGS);
  const chambersSettings = readStorageRaw(KNOWN_STORAGE_KEYS.CHAMBERS_SETTINGS);
  const feeNoteTemplates = readStorageRaw(KNOWN_STORAGE_KEYS.FEE_NOTE_TEMPLATES);
  const standardServices = readStorageRaw(KNOWN_STORAGE_KEYS.STANDARD_SERVICES);
  const legalTemplates = readStorageRaw(KNOWN_STORAGE_KEYS.LEGAL_TEMPLATES);
  const clientInteractions = readStorageRaw(KNOWN_STORAGE_KEYS.CLIENT_INTERACTIONS);
  const clientServicesConfig = readStorageRaw(KNOWN_STORAGE_KEYS.CLIENT_SERVICES_CONFIG);
  const noticeBoardItems = readStorageRaw(KNOWN_STORAGE_KEYS.NOTICE_BOARD);
  const outboundEmails = readStorageRaw(KNOWN_STORAGE_KEYS.OUTBOUND_EMAILS);
  const aiAgentChat = readStorageRaw(KNOWN_STORAGE_KEYS.AI_CHAT);

  // Track standard keys
  Object.values(KNOWN_STORAGE_KEYS).forEach((k) => {
    if (localStorage.getItem(k) !== null) {
      keysIncludedSet.add(k);
    }
  });

  // 2. Scan localStorage for dynamic matter notes, timeline events, filed docs & other keys
  const caseNotes: Record<string, any> = {};
  const caseTimelineEvents: Record<string, any> = {};
  const caseFiledDocs: Record<string, any> = {};
  const additionalStorage: Record<string, any> = {};
  const rawLocalStorageDump: Record<string, any> = {};

  const knownKeysSet = new Set<string>(Object.values(KNOWN_STORAGE_KEYS));

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const rawVal = readStorageRaw(key);
      rawLocalStorageDump[key] = rawVal;
      keysIncludedSet.add(key);

      if (key.startsWith('chambers_matter_notes_')) {
        const matterId = key.replace('chambers_matter_notes_', '');
        caseNotes[matterId] = rawVal;
      } else if (key.startsWith('chambers_timeline_events_')) {
        const matterId = key.replace('chambers_timeline_events_', '');
        caseTimelineEvents[matterId] = rawVal;
      } else if (key.startsWith('maa_case_filed_docs_')) {
        const matterId = key.replace('maa_case_filed_docs_', '');
        caseFiledDocs[matterId] = rawVal;
      } else if (!knownKeysSet.has(key)) {
        additionalStorage[key] = rawVal;
      }
    }
  } catch (err) {
    console.warn('[BackupExport] Error iterating localStorage keys:', err);
  }

  // 3. Compute record counts
  const countOf = (val: any): number => {
    if (Array.isArray(val)) return val.length;
    if (val && typeof val === 'object') return Object.keys(val).length;
    return val !== null && val !== undefined ? 1 : 0;
  };

  const countSubItems = (recordMap: Record<string, any>): number => {
    let sum = 0;
    Object.values(recordMap).forEach((item) => {
      if (Array.isArray(item)) sum += item.length;
      else if (item !== null && item !== undefined) sum += 1;
    });
    return sum;
  };

  const recordCounts: Record<string, number> = {
    matters: countOf(matters),
    clients: countOf(clients),
    tasks: countOf(tasks),
    deadlines: countOf(deadlines),
    activities: countOf(activities),
    notifications: countOf(notifications),
    feeNotes: countOf(feeNotes),
    payments: countOf(payments),
    quotes: countOf(quotes),
    documents: countOf(documents),
    folders: countOf(folders),
    drafts: countOf(drafts),
    onboardings: countOf(onboardings),
    leaveRequests: countOf(leaveRequests),
    leaveBalances: countOf(leaveBalances),
    staffRoster: countOf(staffRoster),
    authSession: authSession ? 1 : 0,
    loginAuditLogs: countOf(loginAuditLogs),
    chambersSettings: chambersSettings ? 1 : 0,
    feeNoteTemplates: countOf(feeNoteTemplates),
    standardServices: countOf(standardServices),
    legalTemplates: countOf(legalTemplates),
    clientInteractions: countOf(clientInteractions),
    clientServicesConfig: clientServicesConfig ? 1 : 0,
    noticeBoardItems: countOf(noticeBoardItems),
    outboundEmails: countOf(outboundEmails),
    aiAgentChat: countOf(aiAgentChat),
    caseNotesEntries: countSubItems(caseNotes),
    caseTimelineEventsEntries: countSubItems(caseTimelineEvents),
    caseFiledDocsEntries: countSubItems(caseFiledDocs),
    additionalStorageKeys: Object.keys(additionalStorage).length,
  };

  const totalItemsCount = Object.values(recordCounts).reduce((a, b) => a + b, 0);

  const metadata: BackupMetadata = {
    applicationName: 'Muthoni Ahago Advocates V2 (MAA Law Firm Portal)',
    backupFormatVersion: '1.0.0',
    exportTimestamp: timestamp,
    exportedBy: {
      name: exporterInfo?.name || 'System Administrator',
      email: exporterInfo?.email || 'eahago@gmail.com',
      role: exporterInfo?.role || 'System Admin',
    },
    totalStorageKeysFound: keysIncludedSet.size,
    storageKeysIncluded: Array.from(keysIncludedSet).sort(),
    recordCounts,
    summary: {
      totalItemsCount,
      dynamicMatterKeysCount:
        Object.keys(caseNotes).length +
        Object.keys(caseTimelineEvents).length +
        Object.keys(caseFiledDocs).length,
      additionalKeysCount: Object.keys(additionalStorage).length,
    },
  };

  return {
    _metadata: metadata,
    datasets: {
      matters,
      clients,
      tasks,
      deadlines,
      activities,
      notifications,
      feeNotes,
      payments,
      quotes,
      documents,
      folders,
      drafts,
      onboardings,
      leaveRequests,
      leaveBalances,
      staffRoster,
      authSession,
      loginAuditLogs,
      chambersSettings,
      feeNoteTemplates,
      standardServices,
      legalTemplates,
      clientInteractions,
      clientServicesConfig,
      noticeBoardItems,
      outboundEmails,
      aiAgentChat,
      caseNotes,
      caseTimelineEvents,
      caseFiledDocs,
      additionalStorage,
    },
    rawLocalStorageDump,
  };
}

/**
 * Generates sensible timestamped filename for the backup.
 * Example: maa-law-portal-backup-2026-09-04-10-30.json
 */
export function generateBackupFilename(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `maa-law-portal-backup-${year}-${month}-${day}-${hours}-${minutes}.json`;
}

/**
 * Triggers a secure, pure client-side browser file download of the backup JSON.
 * Does NOT transmit data across the network or to any third party.
 */
export function downloadBackupFile(
  backupPayload: ExportedBackupPayload,
  customFilename?: string
): string {
  const filename = customFilename || generateBackupFilename();
  const jsonString = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup reference
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }, 300);

  return filename;
}
