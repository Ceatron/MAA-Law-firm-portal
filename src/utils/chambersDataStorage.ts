/**
 * Chambers Central Data Storage & Synchronization Service
 * 
 * ARCHITECTURAL DIRECTIVE:
 * - Supabase Postgres is the primary firm-wide source of truth.
 * - LocalStorage is utilized solely as an instant-load offline cache and fallback layer.
 * - Every CRUD operation (Create, Read, Update, Delete) pushes mutations directly to
 *   Supabase via ChambersCloudService, guaranteeing that all firm staff see the latest state.
 * - Windows custom events ('chambers-matters-updated', 'chambers-tasks-updated', etc.)
 *   are dispatched on any local or realtime remote update so that React views re-render reactively.
 */

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
  TimeEntry,
  LeaveRequest,
  LeaveBalance,
  Advocate,
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
  mockTimeEntries,
} from '../data/mockData';
import ChambersCloudService from '../services/chambersCloudService';

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
  TIME_ENTRIES: 'muthoni_ahago_time_entries_v1',
  LEAVE_REQUESTS: 'muthoni_ahago_leave_requests_v1',
  LEAVE_BALANCES: 'muthoni_ahago_leave_balances_v1',
  DB_STATUS: 'muthoni_ahago_db_status_v1',
};

// Generic Safe Storage Helpers
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

// ============================================================================
// 1. MATTERS
// ============================================================================
export const loadSavedMatters = (): LegalMatter[] => {
  return safeGet<LegalMatter[]>(STORAGE_KEYS.MATTERS, mockMatters);
};

export const saveStoredMattersCache = (matters: LegalMatter[]): void => {
  safeSet(STORAGE_KEYS.MATTERS, matters);
  window.dispatchEvent(new CustomEvent('chambers-matters-updated', { detail: matters }));
};

export const saveStoredMatters = async (matters: LegalMatter[]): Promise<void> => {
  saveStoredMattersCache(matters);
  // Asynchronously synchronize all modified matters to Supabase
  for (const matter of matters) {
    ChambersCloudService.upsertMatter(matter).catch((err) =>
      console.warn('[Storage] Background matter upsert failed:', err)
    );
  }
};

export const persistSingleMatter = async (matter: LegalMatter): Promise<void> => {
  // 1. Immediately persist to cloud
  await ChambersCloudService.upsertMatter(matter);
  // 2. Update local cache & notify UI
  const current = loadSavedMatters();
  const idx = current.findIndex((m) => m.id === matter.id);
  const updated = idx >= 0 ? current.map((m) => (m.id === matter.id ? matter : m)) : [matter, ...current];
  saveStoredMattersCache(updated);
};

export const deleteStoredMatter = async (matterId: string): Promise<void> => {
  // 1. Immediately delete from cloud
  await ChambersCloudService.deleteMatter(matterId);
  // 2. Update local cache & notify UI
  const current = loadSavedMatters().filter((m) => m.id !== matterId);
  saveStoredMattersCache(current);
};

// ============================================================================
// 2. CLIENTS
// ============================================================================
export const loadSavedClients = (): Client[] => {
  return safeGet<Client[]>(STORAGE_KEYS.CLIENTS, mockClients);
};

export const saveStoredClientsCache = (clients: Client[]): void => {
  safeSet(STORAGE_KEYS.CLIENTS, clients);
  window.dispatchEvent(new CustomEvent('chambers-clients-updated', { detail: clients }));
};

export const saveStoredClients = async (clients: Client[]): Promise<void> => {
  saveStoredClientsCache(clients);
  for (const client of clients) {
    ChambersCloudService.upsertClient(client).catch((err) =>
      console.warn('[Storage] Background client upsert failed:', err)
    );
  }
};

export const persistSingleClient = async (client: Client): Promise<void> => {
  await ChambersCloudService.upsertClient(client);
  const current = loadSavedClients();
  const idx = current.findIndex((c) => c.id === client.id);
  const updated = idx >= 0 ? current.map((c) => (c.id === client.id ? client : c)) : [client, ...current];
  saveStoredClientsCache(updated);
};

export const deleteStoredClient = async (clientId: string): Promise<void> => {
  await ChambersCloudService.deleteClient(clientId);
  const current = loadSavedClients().filter((c) => c.id !== clientId);
  saveStoredClientsCache(current);
};

// ============================================================================
// 3. TASKS
// ============================================================================
export const loadSavedTasks = (): TaskItem[] => {
  return safeGet<TaskItem[]>(STORAGE_KEYS.TASKS, mockTasks);
};

export const saveStoredTasksCache = (tasks: TaskItem[]): void => {
  safeSet(STORAGE_KEYS.TASKS, tasks);
  window.dispatchEvent(new CustomEvent('chambers-tasks-updated', { detail: tasks }));
};

export const saveStoredTasks = async (tasks: TaskItem[]): Promise<void> => {
  saveStoredTasksCache(tasks);
  for (const task of tasks) {
    ChambersCloudService.upsertTask(task).catch((err) =>
      console.warn('[Storage] Background task upsert failed:', err)
    );
  }
};

export const persistSingleTask = async (task: TaskItem): Promise<void> => {
  await ChambersCloudService.upsertTask(task);
  const current = loadSavedTasks();
  const idx = current.findIndex((t) => t.id === task.id);
  const updated = idx >= 0 ? current.map((t) => (t.id === task.id ? task : t)) : [task, ...current];
  saveStoredTasksCache(updated);
};

export const deleteStoredTask = async (taskId: string): Promise<void> => {
  await ChambersCloudService.deleteTask(taskId);
  const current = loadSavedTasks().filter((t) => t.id !== taskId);
  saveStoredTasksCache(current);
};

// ============================================================================
// 4. DEADLINES
// ============================================================================
export const loadSavedDeadlines = (): DeadlineItem[] => {
  return safeGet<DeadlineItem[]>(STORAGE_KEYS.DEADLINES, mockDeadlines);
};

export const saveStoredDeadlinesCache = (deadlines: DeadlineItem[]): void => {
  safeSet(STORAGE_KEYS.DEADLINES, deadlines);
  window.dispatchEvent(new CustomEvent('chambers-deadlines-updated', { detail: deadlines }));
};

export const saveStoredDeadlines = async (deadlines: DeadlineItem[]): Promise<void> => {
  saveStoredDeadlinesCache(deadlines);
  for (const dl of deadlines) {
    ChambersCloudService.upsertDeadline(dl).catch((err) =>
      console.warn('[Storage] Background deadline upsert failed:', err)
    );
  }
};

export const persistSingleDeadline = async (deadline: DeadlineItem): Promise<void> => {
  await ChambersCloudService.upsertDeadline(deadline);
  const current = loadSavedDeadlines();
  const idx = current.findIndex((d) => d.id === deadline.id);
  const updated = idx >= 0 ? current.map((d) => (d.id === deadline.id ? deadline : d)) : [deadline, ...current];
  saveStoredDeadlinesCache(updated);
};

export const deleteStoredDeadline = async (deadlineId: string): Promise<void> => {
  await ChambersCloudService.deleteDeadline(deadlineId);
  const current = loadSavedDeadlines().filter((d) => d.id !== deadlineId);
  saveStoredDeadlinesCache(current);
};

// ============================================================================
// 5. ACTIVITIES
// ============================================================================
export const loadSavedActivities = (): ActivityLog[] => {
  return safeGet<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, mockActivities);
};

export const saveStoredActivitiesCache = (activities: ActivityLog[]): void => {
  safeSet(STORAGE_KEYS.ACTIVITIES, activities);
  window.dispatchEvent(new CustomEvent('chambers-activities-updated', { detail: activities }));
};

export const saveStoredActivities = async (activities: ActivityLog[]): Promise<void> => {
  saveStoredActivitiesCache(activities);
};

export const persistSingleActivity = async (activity: ActivityLog): Promise<void> => {
  await ChambersCloudService.recordActivity(activity);
  const current = loadSavedActivities();
  const updated = [activity, ...current.filter((a) => a.id !== activity.id)].slice(0, 100);
  saveStoredActivitiesCache(updated);
};

export const deleteStoredActivity = async (activityId: string): Promise<void> => {
  await ChambersCloudService.deleteActivity(activityId);
  const current = loadSavedActivities().filter((a) => a.id !== activityId);
  saveStoredActivitiesCache(current);
};

// ============================================================================
// 6. NOTIFICATIONS
// ============================================================================
export const loadSavedNotifications = (): NotificationItem[] => {
  return safeGet<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, mockNotifications);
};

export const saveStoredNotificationsCache = (notifications: NotificationItem[]): void => {
  safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
  window.dispatchEvent(new CustomEvent('chambers-notifications-updated', { detail: notifications }));
};

export const saveStoredNotifications = async (notifications: NotificationItem[]): Promise<void> => {
  saveStoredNotificationsCache(notifications);
};

export const persistSingleNotification = async (notification: NotificationItem): Promise<void> => {
  await ChambersCloudService.upsertNotification(notification);
  const current = loadSavedNotifications();
  const idx = current.findIndex((n) => n.id === notification.id);
  const updated = idx >= 0 ? current.map((n) => (n.id === notification.id ? notification : n)) : [notification, ...current];
  saveStoredNotificationsCache(updated);
};

export const deleteStoredNotification = async (notificationId: string): Promise<void> => {
  await ChambersCloudService.deleteNotification(notificationId);
  const current = loadSavedNotifications().filter((n) => n.id !== notificationId);
  saveStoredNotificationsCache(current);
};

// ============================================================================
// 7. BILLING: FEE NOTES (INVOICES)
// ============================================================================
export const loadSavedFeeNotes = (): FeeNote[] => {
  return safeGet<FeeNote[]>(STORAGE_KEYS.FEE_NOTES, mockFeeNotes);
};

export const saveStoredFeeNotesCache = (feeNotes: FeeNote[]): void => {
  safeSet(STORAGE_KEYS.FEE_NOTES, feeNotes);
  window.dispatchEvent(new CustomEvent('chambers-invoices-updated', { detail: feeNotes }));
};

export const saveStoredFeeNotes = async (feeNotes: FeeNote[]): Promise<void> => {
  saveStoredFeeNotesCache(feeNotes);
  for (const fn of feeNotes) {
    ChambersCloudService.upsertFeeNote(fn).catch((err) =>
      console.warn('[Storage] Background feeNote upsert failed:', err)
    );
  }
};

export const persistSingleFeeNote = async (feeNote: FeeNote): Promise<void> => {
  await ChambersCloudService.upsertFeeNote(feeNote);
  const current = loadSavedFeeNotes();
  const idx = current.findIndex((fn) => fn.id === feeNote.id);
  const updated = idx >= 0 ? current.map((fn) => (fn.id === feeNote.id ? feeNote : fn)) : [feeNote, ...current];
  saveStoredFeeNotesCache(updated);
};

export const deleteStoredFeeNote = async (feeNoteId: string): Promise<void> => {
  await ChambersCloudService.deleteFeeNote(feeNoteId);
  const current = loadSavedFeeNotes().filter((fn) => fn.id !== feeNoteId);
  saveStoredFeeNotesCache(current);
};

// ============================================================================
// 8. BILLING: PAYMENTS
// ============================================================================
export const loadSavedPayments = (): PaymentRecord[] => {
  return safeGet<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, mockPayments);
};

export const saveStoredPaymentsCache = (payments: PaymentRecord[]): void => {
  safeSet(STORAGE_KEYS.PAYMENTS, payments);
  window.dispatchEvent(new CustomEvent('chambers-payments-updated', { detail: payments }));
};

export const saveStoredPayments = async (payments: PaymentRecord[]): Promise<void> => {
  saveStoredPaymentsCache(payments);
  for (const pay of payments) {
    ChambersCloudService.upsertPayment(pay).catch((err) =>
      console.warn('[Storage] Background payment upsert failed:', err)
    );
  }
};

export const persistSinglePayment = async (payment: PaymentRecord): Promise<void> => {
  await ChambersCloudService.upsertPayment(payment);
  const current = loadSavedPayments();
  const idx = current.findIndex((p) => p.id === payment.id);
  const updated = idx >= 0 ? current.map((p) => (p.id === payment.id ? payment : p)) : [payment, ...current];
  saveStoredPaymentsCache(updated);
};

export const deleteStoredPayment = async (paymentId: string): Promise<void> => {
  await ChambersCloudService.deletePayment(paymentId);
  const current = loadSavedPayments().filter((p) => p.id !== paymentId);
  saveStoredPaymentsCache(current);
};

// ============================================================================
// 9. BILLING: QUOTATIONS
// ============================================================================
export const loadSavedQuotes = (): Quotation[] => {
  return safeGet<Quotation[]>(STORAGE_KEYS.QUOTES, mockQuotes);
};

export const saveStoredQuotesCache = (quotes: Quotation[]): void => {
  safeSet(STORAGE_KEYS.QUOTES, quotes);
  window.dispatchEvent(new CustomEvent('chambers-quotes-updated', { detail: quotes }));
};

export const saveStoredQuotes = async (quotes: Quotation[]): Promise<void> => {
  saveStoredQuotesCache(quotes);
  for (const q of quotes) {
    ChambersCloudService.upsertQuote(q).catch((err) =>
      console.warn('[Storage] Background quote upsert failed:', err)
    );
  }
};

export const persistSingleQuote = async (quote: Quotation): Promise<void> => {
  await ChambersCloudService.upsertQuote(quote);
  const current = loadSavedQuotes();
  const idx = current.findIndex((q) => q.id === quote.id);
  const updated = idx >= 0 ? current.map((q) => (q.id === quote.id ? quote : q)) : [quote, ...current];
  saveStoredQuotesCache(updated);
};

export const deleteStoredQuote = async (quoteId: string): Promise<void> => {
  await ChambersCloudService.deleteQuote(quoteId);
  const current = loadSavedQuotes().filter((q) => q.id !== quoteId);
  saveStoredQuotesCache(current);
};

// ============================================================================
// 10. DOCUMENTS & FOLDERS & DRAFTS
// ============================================================================
export const loadSavedDocumentItems = (): DocumentItem[] => {
  return safeGet<DocumentItem[]>(STORAGE_KEYS.DOCUMENTS, mockDocuments);
};

export const saveStoredDocumentItemsCache = (docs: DocumentItem[]): void => {
  safeSet(STORAGE_KEYS.DOCUMENTS, docs);
  window.dispatchEvent(new CustomEvent('chambers-documents-updated', { detail: docs }));
};

export const saveStoredDocumentItems = async (docs: DocumentItem[]): Promise<void> => {
  saveStoredDocumentItemsCache(docs);
  for (const d of docs) {
    ChambersCloudService.upsertDocument(d).catch((err) =>
      console.warn('[Storage] Background document upsert failed:', err)
    );
  }
};

export const persistSingleDocumentItem = async (doc: DocumentItem): Promise<void> => {
  await ChambersCloudService.upsertDocument(doc);
  const current = loadSavedDocumentItems();
  const idx = current.findIndex((d) => d.id === doc.id);
  const updated = idx >= 0 ? current.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...current];
  saveStoredDocumentItemsCache(updated);
};

export const deleteStoredDocumentItem = async (docId: string): Promise<void> => {
  await ChambersCloudService.deleteDocument(docId);
  const current = loadSavedDocumentItems().filter((d) => d.id !== docId);
  saveStoredDocumentItemsCache(current);
};

export const loadSavedDocumentFolders = (): DocumentFolder[] => {
  return safeGet<DocumentFolder[]>(STORAGE_KEYS.FOLDERS, mockFolders);
};

export const saveStoredDocumentFoldersCache = (folders: DocumentFolder[]): void => {
  safeSet(STORAGE_KEYS.FOLDERS, folders);
  window.dispatchEvent(new CustomEvent('chambers-folders-updated', { detail: folders }));
};

export const saveStoredDocumentFolders = async (folders: DocumentFolder[]): Promise<void> => {
  saveStoredDocumentFoldersCache(folders);
  for (const f of folders) {
    ChambersCloudService.upsertFolder(f).catch((err) =>
      console.warn('[Storage] Background folder upsert failed:', err)
    );
  }
};

export const persistSingleDocumentFolder = async (folder: DocumentFolder): Promise<void> => {
  await ChambersCloudService.upsertFolder(folder);
  const current = loadSavedDocumentFolders();
  const idx = current.findIndex((f) => f.id === folder.id);
  const updated = idx >= 0 ? current.map((f) => (f.id === folder.id ? folder : f)) : [folder, ...current];
  saveStoredDocumentFoldersCache(updated);
};

export const deleteStoredDocumentFolder = async (folderId: string): Promise<void> => {
  await ChambersCloudService.deleteFolder(folderId);
  const current = loadSavedDocumentFolders().filter((f) => f.id !== folderId);
  saveStoredDocumentFoldersCache(current);
};

export const loadSavedDocumentDrafts = (): DocumentDraft[] => {
  return safeGet<DocumentDraft[]>(STORAGE_KEYS.DRAFTS, mockDrafts);
};

export const saveStoredDocumentDraftsCache = (drafts: DocumentDraft[]): void => {
  safeSet(STORAGE_KEYS.DRAFTS, drafts);
  window.dispatchEvent(new CustomEvent('chambers-drafts-updated', { detail: drafts }));
};

export const saveStoredDocumentDrafts = async (drafts: DocumentDraft[]): Promise<void> => {
  saveStoredDocumentDraftsCache(drafts);
  for (const d of drafts) {
    ChambersCloudService.upsertDraft(d).catch((err) =>
      console.warn('[Storage] Background draft upsert failed:', err)
    );
  }
};

export const persistSingleDocumentDraft = async (draft: DocumentDraft): Promise<void> => {
  await ChambersCloudService.upsertDraft(draft);
  const current = loadSavedDocumentDrafts();
  const idx = current.findIndex((d) => d.id === draft.id);
  const updated = idx >= 0 ? current.map((d) => (d.id === draft.id ? draft : d)) : [draft, ...current];
  saveStoredDocumentDraftsCache(updated);
};

export const deleteStoredDocumentDraft = async (draftId: string): Promise<void> => {
  await ChambersCloudService.deleteDraft(draftId);
  const current = loadSavedDocumentDrafts().filter((d) => d.id !== draftId);
  saveStoredDocumentDraftsCache(current);
};

// ============================================================================
// 11. CLIENT ONBOARDINGS
// ============================================================================
export const loadSavedOnboardings = (): ClientOnboardingSubmission[] => {
  return safeGet<ClientOnboardingSubmission[]>(STORAGE_KEYS.ONBOARDINGS, mockOnboardingSubmissions);
};

export const saveStoredOnboardingsCache = (onboardings: ClientOnboardingSubmission[]): void => {
  safeSet(STORAGE_KEYS.ONBOARDINGS, onboardings);
  window.dispatchEvent(new CustomEvent('chambers-onboardings-updated', { detail: onboardings }));
};

export const saveStoredOnboardings = async (onboardings: ClientOnboardingSubmission[]): Promise<void> => {
  saveStoredOnboardingsCache(onboardings);
  for (const o of onboardings) {
    ChambersCloudService.upsertOnboarding(o).catch((err) =>
      console.warn('[Storage] Background onboarding upsert failed:', err)
    );
  }
};

export const persistSingleOnboarding = async (submission: ClientOnboardingSubmission): Promise<void> => {
  await ChambersCloudService.upsertOnboarding(submission);
  const current = loadSavedOnboardings();
  const idx = current.findIndex((o) => o.id === submission.id);
  const updated = idx >= 0 ? current.map((o) => (o.id === submission.id ? submission : o)) : [submission, ...current];
  saveStoredOnboardingsCache(updated);
};

export const deleteStoredOnboarding = async (onboardingId: string): Promise<void> => {
  await ChambersCloudService.deleteOnboarding(onboardingId);
  const current = loadSavedOnboardings().filter((o) => o.id !== onboardingId);
  saveStoredOnboardingsCache(current);
};

// ============================================================================
// 12. TIME ENTRIES
// ============================================================================
export const loadSavedTimeEntries = (): TimeEntry[] => {
  return safeGet<TimeEntry[]>(STORAGE_KEYS.TIME_ENTRIES, mockTimeEntries);
};

export const saveStoredTimeEntriesCache = (entries: TimeEntry[]): void => {
  safeSet(STORAGE_KEYS.TIME_ENTRIES, entries);
  window.dispatchEvent(new CustomEvent('chambers-time-entries-updated', { detail: entries }));
};

export const saveStoredTimeEntries = async (entries: TimeEntry[]): Promise<void> => {
  saveStoredTimeEntriesCache(entries);
  for (const te of entries) {
    ChambersCloudService.upsertTimeEntry(te).catch((err) =>
      console.warn('[Storage] Background time entry upsert failed:', err)
    );
  }
};

export const persistSingleTimeEntry = async (entry: TimeEntry): Promise<void> => {
  await ChambersCloudService.upsertTimeEntry(entry);
  const current = loadSavedTimeEntries();
  const idx = current.findIndex((te) => te.id === entry.id);
  const updated = idx >= 0 ? current.map((te) => (te.id === entry.id ? entry : te)) : [entry, ...current];
  saveStoredTimeEntriesCache(updated);
};

export const deleteStoredTimeEntry = async (entryId: string): Promise<void> => {
  await ChambersCloudService.deleteTimeEntry(entryId);
  const current = loadSavedTimeEntries().filter((te) => te.id !== entryId);
  saveStoredTimeEntriesCache(current);
};

// ============================================================================
// 13. HRM: LEAVE REQUESTS & BALANCES
// ============================================================================
export type StoredLeaveRequest = LeaveRequest;
export type StoredLeaveBalance = LeaveBalance;

export const loadSavedLeaveRequests = (): StoredLeaveRequest[] => {
  return safeGet<StoredLeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, []);
};

export const saveStoredLeaveRequestsCache = (requests: StoredLeaveRequest[]): void => {
  safeSet(STORAGE_KEYS.LEAVE_REQUESTS, requests);
  window.dispatchEvent(new CustomEvent('chambers-leave-requests-updated', { detail: requests }));
};

export const saveStoredLeaveRequests = async (requests: StoredLeaveRequest[]): Promise<void> => {
  saveStoredLeaveRequestsCache(requests);
  for (const lr of requests) {
    ChambersCloudService.upsertLeaveRequest(lr).catch((err) =>
      console.warn('[Storage] Background leave request upsert failed:', err)
    );
  }
};

export const persistSingleLeaveRequest = async (request: StoredLeaveRequest): Promise<void> => {
  await ChambersCloudService.upsertLeaveRequest(request);
  const current = loadSavedLeaveRequests();
  const idx = current.findIndex((lr) => lr.id === request.id);
  const updated = idx >= 0 ? current.map((lr) => (lr.id === request.id ? request : lr)) : [request, ...current];
  saveStoredLeaveRequestsCache(updated);
};

export const deleteStoredLeaveRequest = async (requestId: string): Promise<void> => {
  await ChambersCloudService.deleteLeaveRequest(requestId);
  const current = loadSavedLeaveRequests().filter((lr) => lr.id !== requestId);
  saveStoredLeaveRequestsCache(current);
};

export const loadSavedLeaveBalances = (fallback?: StoredLeaveBalance[]): StoredLeaveBalance[] => {
  return safeGet<StoredLeaveBalance[]>(STORAGE_KEYS.LEAVE_BALANCES, fallback || []);
};

export const saveStoredLeaveBalancesCache = (balances: StoredLeaveBalance[]): void => {
  safeSet(STORAGE_KEYS.LEAVE_BALANCES, balances);
  window.dispatchEvent(new CustomEvent('chambers-leave-balances-updated', { detail: balances }));
};

export const saveStoredLeaveBalances = async (balances: StoredLeaveBalance[]): Promise<void> => {
  saveStoredLeaveBalancesCache(balances);
  for (const lb of balances) {
    ChambersCloudService.upsertLeaveBalance(lb).catch((err) =>
      console.warn('[Storage] Background leave balance upsert failed:', err)
    );
  }
};

export const persistSingleLeaveBalance = async (balance: StoredLeaveBalance): Promise<void> => {
  await ChambersCloudService.upsertLeaveBalance(balance);
  const current = loadSavedLeaveBalances();
  const exists = current.some((b) => b.staffName === balance.staffName && b.role === balance.role);
  const updated = exists
    ? current.map((b) => (b.staffName === balance.staffName && b.role === balance.role ? balance : b))
    : [...current, balance];
  saveStoredLeaveBalancesCache(updated);
};

// ============================================================================
// 14. CENTRAL CLOUD SYNCHRONIZATION RUNNER
// ============================================================================
/**
 * Hydrates all collections directly from Supabase, updating regional caches.
 */
export async function syncAllChambersDataFromCloud(user: Advocate): Promise<{
  matters: LegalMatter[];
  tasks: TaskItem[];
  clients: Client[];
  deadlines: DeadlineItem[];
  activities: ActivityLog[];
  notifications: NotificationItem[];
  feeNotes: FeeNote[];
  payments: PaymentRecord[];
  quotes: Quotation[];
  documents: DocumentItem[];
  folders: DocumentFolder[];
  drafts: DocumentDraft[];
  onboardings: ClientOnboardingSubmission[];
  timeEntries: TimeEntry[];
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
}> {
  const [
    matters,
    tasks,
    clients,
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
    timeEntries,
    leaveRequests,
    leaveBalances,
  ] = await Promise.all([
    ChambersCloudService.fetchMatters(user),
    ChambersCloudService.fetchTasks(user),
    ChambersCloudService.fetchClients(),
    ChambersCloudService.fetchDeadlines(user),
    ChambersCloudService.fetchActivities(),
    ChambersCloudService.fetchNotifications(user.email),
    ChambersCloudService.fetchFeeNotes(),
    ChambersCloudService.fetchPayments(),
    ChambersCloudService.fetchQuotes(),
    ChambersCloudService.fetchDocuments(),
    ChambersCloudService.fetchFolders(),
    ChambersCloudService.fetchDrafts(),
    ChambersCloudService.fetchOnboardings(),
    ChambersCloudService.fetchTimeEntries(),
    ChambersCloudService.fetchLeaveRequests(),
    ChambersCloudService.fetchLeaveBalances(),
  ]);

  if (matters) saveStoredMattersCache(matters);
  if (tasks) saveStoredTasksCache(tasks);
  if (clients) saveStoredClientsCache(clients);
  if (deadlines) saveStoredDeadlinesCache(deadlines);
  if (activities) saveStoredActivitiesCache(activities);
  if (notifications) saveStoredNotificationsCache(notifications);
  if (feeNotes) saveStoredFeeNotesCache(feeNotes);
  if (payments) saveStoredPaymentsCache(payments);
  if (quotes) saveStoredQuotesCache(quotes);
  if (documents) saveStoredDocumentItemsCache(documents);
  if (folders) saveStoredDocumentFoldersCache(folders);
  if (drafts) saveStoredDocumentDraftsCache(drafts);
  if (onboardings) saveStoredOnboardingsCache(onboardings);
  if (timeEntries) saveStoredTimeEntriesCache(timeEntries);
  if (leaveRequests) saveStoredLeaveRequestsCache(leaveRequests);
  if (leaveBalances) saveStoredLeaveBalancesCache(leaveBalances);

  return {
    matters: matters || loadSavedMatters(),
    tasks: tasks || loadSavedTasks(),
    clients: clients || loadSavedClients(),
    deadlines: deadlines || loadSavedDeadlines(),
    activities: activities || loadSavedActivities(),
    notifications: notifications || loadSavedNotifications(),
    feeNotes: feeNotes || loadSavedFeeNotes(),
    payments: payments || loadSavedPayments(),
    quotes: quotes || loadSavedQuotes(),
    documents: documents || loadSavedDocumentItems(),
    folders: folders || loadSavedDocumentFolders(),
    drafts: drafts || loadSavedDocumentDrafts(),
    onboardings: onboardings || loadSavedOnboardings(),
    timeEntries: timeEntries || loadSavedTimeEntries(),
    leaveRequests: leaveRequests || loadSavedLeaveRequests(),
    leaveBalances: leaveBalances || loadSavedLeaveBalances(),
  };
}

export function initChambersDatabaseSync(): () => void {
  // Returns cleanup
  return () => {};
}
