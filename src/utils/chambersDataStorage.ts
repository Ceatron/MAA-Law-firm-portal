import {
  LegalMatter,
  Client,
  TaskItem,
  DeadlineItem,
  ActivityLog,
  NotificationItem,
  FeeNote,
  PaymentRecord,
  Quotation,
  DocumentItem,
  DocumentFolder,
  DocumentDraft,
  ClientOnboardingSubmission,
} from '../types';
import {
  mockMatters,
  mockClients,
  mockTasks,
  mockDeadlines,
  mockActivities,
  mockNotifications,
  mockFeeNotes,
  mockPayments,
  mockQuotes,
  mockDocuments,
  mockFolders,
  mockDrafts,
  mockOnboardingSubmissions,
} from '../data/mockData';
import {
  fetchAllDbData,
  fetchDbStatus,
  saveRecordToDb,
  deleteRecordFromDb,
  syncStateWithDb,
  DbStatusResponse,
} from '../services/chambersDbClient';

// Storage Keys
const STORAGE_KEYS = {
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
  DB_STATUS: 'muthoni_ahago_db_status_v1',
};

// Generic Safe Storage Helper
function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== undefined && parsed !== null ? parsed : fallback;
  } catch (err) {
    console.warn(`[Storage] Failed to read ${key} from localStorage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[Storage] Failed to save ${key} to localStorage:`, err);
  }
}

// ==========================================
// MATTERS
// ==========================================
export const loadSavedMatters = (): LegalMatter[] => {
  return safeGet<LegalMatter[]>(STORAGE_KEYS.MATTERS, mockMatters);
};

export const saveStoredMatters = (matters: LegalMatter[]): void => {
  safeSet(STORAGE_KEYS.MATTERS, matters);
  window.dispatchEvent(new CustomEvent('chambers-matters-updated', { detail: matters }));
  // Asynchronously sync to central database
  syncStateWithDb({ matters }).catch((err) =>
    console.warn('[DB Sync] Failed to sync matters:', err)
  );
};

export const persistSingleMatter = async (matter: LegalMatter): Promise<void> => {
  const current = loadSavedMatters();
  const idx = current.findIndex((m) => m.id === matter.id);
  const updated = idx >= 0 ? current.map((m) => (m.id === matter.id ? matter : m)) : [matter, ...current];
  safeSet(STORAGE_KEYS.MATTERS, updated);
  window.dispatchEvent(new CustomEvent('chambers-matters-updated', { detail: updated }));
  await saveRecordToDb('matters', matter);
};

export const deleteStoredMatter = async (matterId: string): Promise<void> => {
  const current = loadSavedMatters().filter((m) => m.id !== matterId);
  safeSet(STORAGE_KEYS.MATTERS, current);
  window.dispatchEvent(new CustomEvent('chambers-matters-updated', { detail: current }));
  await deleteRecordFromDb('matters', matterId);
};

// ==========================================
// CLIENTS
// ==========================================
export const loadSavedClients = (): Client[] => {
  return safeGet<Client[]>(STORAGE_KEYS.CLIENTS, mockClients);
};

export const saveStoredClients = (clients: Client[]): void => {
  safeSet(STORAGE_KEYS.CLIENTS, clients);
  window.dispatchEvent(new CustomEvent('chambers-clients-updated', { detail: clients }));
  syncStateWithDb({ clients }).catch((err) =>
    console.warn('[DB Sync] Failed to sync clients:', err)
  );
};

// ==========================================
// TASKS
// ==========================================
export const loadSavedTasks = (): TaskItem[] => {
  return safeGet<TaskItem[]>(STORAGE_KEYS.TASKS, mockTasks);
};

export const saveStoredTasks = (tasks: TaskItem[]): void => {
  safeSet(STORAGE_KEYS.TASKS, tasks);
  window.dispatchEvent(new CustomEvent('chambers-tasks-updated', { detail: tasks }));
  // Asynchronously sync to central database
  syncStateWithDb({ tasks }).catch((err) =>
    console.warn('[DB Sync] Failed to sync tasks:', err)
  );
};

export const persistSingleTask = async (task: TaskItem): Promise<void> => {
  const current = loadSavedTasks();
  const idx = current.findIndex((t) => t.id === task.id);
  const updated = idx >= 0 ? current.map((t) => (t.id === task.id ? task : t)) : [task, ...current];
  safeSet(STORAGE_KEYS.TASKS, updated);
  window.dispatchEvent(new CustomEvent('chambers-tasks-updated', { detail: updated }));
  await saveRecordToDb('tasks', task);
};

export const deleteStoredTask = async (taskId: string): Promise<void> => {
  const current = loadSavedTasks().filter((t) => t.id !== taskId);
  safeSet(STORAGE_KEYS.TASKS, current);
  window.dispatchEvent(new CustomEvent('chambers-tasks-updated', { detail: current }));
  await deleteRecordFromDb('tasks', taskId);
};

// ==========================================
// DEADLINES
// ==========================================
export const loadSavedDeadlines = (): DeadlineItem[] => {
  return safeGet<DeadlineItem[]>(STORAGE_KEYS.DEADLINES, mockDeadlines);
};

export const saveStoredDeadlines = (deadlines: DeadlineItem[]): void => {
  safeSet(STORAGE_KEYS.DEADLINES, deadlines);
  window.dispatchEvent(new CustomEvent('chambers-deadlines-updated', { detail: deadlines }));
  syncStateWithDb({ deadlines }).catch((err) =>
    console.warn('[DB Sync] Failed to sync deadlines:', err)
  );
};

// ==========================================
// ACTIVITIES
// ==========================================
export const loadSavedActivities = (): ActivityLog[] => {
  return safeGet<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, mockActivities);
};

export const saveStoredActivities = (activities: ActivityLog[]): void => {
  safeSet(STORAGE_KEYS.ACTIVITIES, activities);
  syncStateWithDb({ activities }).catch((err) =>
    console.warn('[DB Sync] Failed to sync activities:', err)
  );
};

// ==========================================
// NOTIFICATIONS
// ==========================================
export const loadSavedNotifications = (): NotificationItem[] => {
  return safeGet<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, mockNotifications);
};

export const saveStoredNotifications = (notifications: NotificationItem[]): void => {
  safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
};

// ==========================================
// BILLING: FEE NOTES (INVOICES)
// ==========================================
export const loadSavedFeeNotes = (): FeeNote[] => {
  return safeGet<FeeNote[]>(STORAGE_KEYS.FEE_NOTES, mockFeeNotes);
};

export const saveStoredFeeNotes = (feeNotes: FeeNote[]): void => {
  safeSet(STORAGE_KEYS.FEE_NOTES, feeNotes);
  window.dispatchEvent(new CustomEvent('chambers-invoices-updated', { detail: feeNotes }));
  syncStateWithDb({ fee_notes: feeNotes }).catch((err) =>
    console.warn('[DB Sync] Failed to sync fee notes:', err)
  );
};

// ==========================================
// BILLING: PAYMENTS
// ==========================================
export const loadSavedPayments = (): PaymentRecord[] => {
  return safeGet<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, mockPayments);
};

export const saveStoredPayments = (payments: PaymentRecord[]): void => {
  safeSet(STORAGE_KEYS.PAYMENTS, payments);
  window.dispatchEvent(new CustomEvent('chambers-payments-updated', { detail: payments }));
};

// ==========================================
// BILLING: QUOTATIONS
// ==========================================
export const loadSavedQuotes = (): Quotation[] => {
  return safeGet<Quotation[]>(STORAGE_KEYS.QUOTES, mockQuotes);
};

export const saveStoredQuotes = (quotes: Quotation[]): void => {
  safeSet(STORAGE_KEYS.QUOTES, quotes);
  window.dispatchEvent(new CustomEvent('chambers-quotes-updated', { detail: quotes }));
};

// ==========================================
// DOCUMENTS & FOLDERS
// ==========================================
export const loadSavedDocumentItems = (): DocumentItem[] => {
  return safeGet<DocumentItem[]>(STORAGE_KEYS.DOCUMENTS, mockDocuments);
};

export const saveStoredDocumentItems = (docs: DocumentItem[]): void => {
  safeSet(STORAGE_KEYS.DOCUMENTS, docs);
};

export const loadSavedDocumentFolders = (): DocumentFolder[] => {
  return safeGet<DocumentFolder[]>(STORAGE_KEYS.FOLDERS, mockFolders);
};

export const saveStoredDocumentFolders = (folders: DocumentFolder[]): void => {
  safeSet(STORAGE_KEYS.FOLDERS, folders);
};

export const loadSavedDocumentDrafts = (): DocumentDraft[] => {
  return safeGet<DocumentDraft[]>(STORAGE_KEYS.DRAFTS, mockDrafts);
};

export const saveStoredDocumentDrafts = (drafts: DocumentDraft[]): void => {
  safeSet(STORAGE_KEYS.DRAFTS, drafts);
};

export const loadSavedOnboardings = (): ClientOnboardingSubmission[] => {
  return safeGet<ClientOnboardingSubmission[]>(STORAGE_KEYS.ONBOARDINGS, mockOnboardingSubmissions);
};

export const saveStoredOnboardings = (onboardings: ClientOnboardingSubmission[]): void => {
  safeSet(STORAGE_KEYS.ONBOARDINGS, onboardings);
};

// ==========================================
// HRM: LEAVE REQUESTS & BALANCES
// ==========================================
export interface StoredLeaveRequest {
  id: string;
  staffName: string;
  role: string;
  leaveType: 'Annual Leave' | 'Sick Leave' | 'Maternity / Paternity' | 'Study / CLE Leave' | 'Compassionate Leave';
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  reliefStaff: string;
  status: 'Pending' | 'Approved' | 'Declined';
  requestedOn: string;
  approvedBy?: string;
}

export interface StoredLeaveBalance {
  staffName: string;
  role: string;
  annualTotal: number;
  annualUsed: number;
  sickTotal: number;
  sickUsed: number;
  cleTotal: number;
  cleUsed: number;
}

export const loadSavedLeaveRequests = (): StoredLeaveRequest[] => {
  return safeGet<StoredLeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, []);
};

export const saveStoredLeaveRequests = (requests: StoredLeaveRequest[]): void => {
  safeSet(STORAGE_KEYS.LEAVE_REQUESTS, requests);
};

export const loadSavedLeaveBalances = (fallback?: StoredLeaveBalance[]): StoredLeaveBalance[] => {
  return safeGet<StoredLeaveBalance[]>(STORAGE_KEYS.LEAVE_BALANCES, fallback || []);
};

export const saveStoredLeaveBalances = (balances: StoredLeaveBalance[]): void => {
  safeSet(STORAGE_KEYS.LEAVE_BALANCES, balances);
};

// ==========================================
// CENTRAL DATABASE SYNCHRONIZATION ENGINE
// ==========================================
let isSyncRunning = false;
let lastSyncedTimestamp = '';
let syncIntervalId: any = null;

/**
 * Initializes full synchronization between client local state and the centralized chambers database.
 * - Runs immediately on app mount.
 * - Polls periodically so changes created by other advocates on other browsers are received.
 */
export function initChambersDatabaseSync(): () => void {
  const performSync = async () => {
    if (isSyncRunning) return;
    isSyncRunning = true;

    try {
      // 1. Check database status
      const status: DbStatusResponse | null = await fetchDbStatus();
      if (status) {
        safeSet(STORAGE_KEYS.DB_STATUS, status);
        window.dispatchEvent(new CustomEvent('chambers-db-status', { detail: status }));

        // If data has been updated on server or first run
        if (status.lastUpdated !== lastSyncedTimestamp) {
          const remoteData = await fetchAllDbData();
          if (remoteData) {
            lastSyncedTimestamp = status.lastUpdated;

            // Merge matters
            if (Array.isArray(remoteData.matters) && remoteData.matters.length > 0) {
              const localMatters = loadSavedMatters();
              const mergedMatters = mergeCollections(remoteData.matters, localMatters);
              safeSet(STORAGE_KEYS.MATTERS, mergedMatters);
              window.dispatchEvent(new CustomEvent('chambers-matters-updated', { detail: mergedMatters }));
            }

            // Merge clients
            if (Array.isArray(remoteData.clients) && remoteData.clients.length > 0) {
              const localClients = loadSavedClients();
              const mergedClients = mergeCollections(remoteData.clients, localClients);
              safeSet(STORAGE_KEYS.CLIENTS, mergedClients);
              window.dispatchEvent(new CustomEvent('chambers-clients-updated', { detail: mergedClients }));
            }

            // Merge tasks
            if (Array.isArray(remoteData.tasks) && remoteData.tasks.length > 0) {
              const localTasks = loadSavedTasks();
              const mergedTasks = mergeCollections(remoteData.tasks, localTasks);
              safeSet(STORAGE_KEYS.TASKS, mergedTasks);
              window.dispatchEvent(new CustomEvent('chambers-tasks-updated', { detail: mergedTasks }));
            }

            // Merge deadlines
            if (Array.isArray(remoteData.deadlines) && remoteData.deadlines.length > 0) {
              const localDeadlines = loadSavedDeadlines();
              const mergedDeadlines = mergeCollections(remoteData.deadlines, localDeadlines);
              safeSet(STORAGE_KEYS.DEADLINES, mergedDeadlines);
              window.dispatchEvent(new CustomEvent('chambers-deadlines-updated', { detail: mergedDeadlines }));
            }

            // Merge activities
            if (Array.isArray(remoteData.activities) && remoteData.activities.length > 0) {
              const localActivities = loadSavedActivities();
              const mergedActivities = mergeCollections(remoteData.activities, localActivities);
              safeSet(STORAGE_KEYS.ACTIVITIES, mergedActivities);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Chambers DB Sync] Background sync cycle warning:', err);
    } finally {
      isSyncRunning = false;
    }
  };

  // Immediate initial pull
  performSync();

  // Periodic live check every 6 seconds
  if (syncIntervalId) clearInterval(syncIntervalId);
  syncIntervalId = setInterval(performSync, 6000);

  return () => {
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
      syncIntervalId = null;
    }
  };
}

function mergeCollections(remoteList: any[], localList: any[]): any[] {
  const map = new Map<string, any>();
  // Put remote items first (server authoritative)
  for (const item of remoteList) {
    if (item && item.id) map.set(item.id, item);
  }
  // If local has items not on remote yet, keep them
  for (const item of localList) {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}
