/**
 * Chambers Central Cloud Data Service (Direct Supabase Access)
 * 
 * DIRECTIVES:
 * 1. Direct cloud reads and writes via Supabase client (no intermediate local-only mock layers).
 * 2. Enforces multi-user role-based visibility at the database query level:
 *    - Managing Advocate and System Admin query all records across the firm.
 *    - Regular advocates query records they are responsible for, created, or are assigned to.
 * 3. Graceful fallback when cloud client is unconfigured or temporarily unavailable.
 * 4. Provides Supabase Realtime channel subscriptions to broadcast live database changes across users.
 * 5. Full CRUD support across ALL practice management entities: Matters, Tasks, Clients, Deadlines,
 *    Activities, Notifications, Fee Notes / Invoices, Payments, Quotes, Documents, Folders, Drafts,
 *    Client Onboardings, Time Entries, Leave Requests, and Leave Balances.
 */

import { getSupabaseClient, isSupabaseConfigured } from '../utils/supabaseClient';
import { canUserViewAll } from '../utils/visibilityRules';
import {
  loadSavedMatters,
  saveStoredMattersCache,
  loadSavedTasks,
  saveStoredTasksCache,
  loadSavedClients,
  saveStoredClientsCache,
  loadSavedDeadlines,
  saveStoredDeadlinesCache,
  loadSavedActivities,
  saveStoredActivitiesCache,
  loadSavedNotifications,
  saveStoredNotificationsCache,
  loadSavedFeeNotes,
  saveStoredFeeNotesCache,
  loadSavedPayments,
  saveStoredPaymentsCache,
  loadSavedQuotes,
  saveStoredQuotesCache,
  loadSavedDocumentItems,
  saveStoredDocumentItemsCache,
  loadSavedDocumentFolders,
  saveStoredDocumentFoldersCache,
  loadSavedDocumentDrafts,
  saveStoredDocumentDraftsCache,
  loadSavedOnboardings,
  saveStoredOnboardingsCache,
  loadSavedTimeEntries,
  saveStoredTimeEntriesCache,
  loadSavedLeaveRequests,
  saveStoredLeaveRequestsCache,
  loadSavedLeaveBalances,
  saveStoredLeaveBalancesCache,
} from '../utils/chambersDataStorage';
import {
  Advocate,
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
} from '../types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sanitizes input values for Supabase date fields.
 * Prevents "invalid input syntax for type date: 'None Scheduled'" errors.
 */
function sanitizeDate(dateStr: any): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  const invalidValues = ['none scheduled', 'n/a', 'none', 'null', 'undefined', ''];
  if (invalidValues.includes(trimmed.toLowerCase())) {
    return null;
  }
  // Try to match YYYY-MM-DD or parse valid ISO date
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10);
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return null;
}

// ============================================================================
// DATA MAPPERS (CamelCase Frontend <-> Snake_Case Supabase)
// ============================================================================

// --- 1. MATTERS ---
export function mapSupabaseMatterToClient(row: any): LegalMatter {
  return {
    id: String(row.id),
    referenceNumber: row.reference_number || row.id,
    title: row.title || 'Untitled Matter',
    clientName: row.client_name || '',
    clientId: row.client_id || '',
    practiceArea: row.practice_area || 'Civil Litigation',
    courtRegistry: row.court_registry || undefined,
    courtCaseNumber: row.court_case_number || undefined,
    ctsFilingId: row.cts_filing_id || undefined,
    responsibleAdvocateId: row.responsible_advocate_id || '',
    responsibleAdvocateName: row.responsible_advocate_name || '',
    status: row.status || 'Active - In Court',
    nextDeadlineDate: row.next_deadline_date || '',
    nextDeadlineDescription: row.next_deadline_description || '',
    nextCourtDate: row.next_court_date || row.next_deadline_date || '',
    courtDatePurpose: row.court_date_purpose || undefined,
    estimatedFeeKES: Number(row.estimated_fee_kes || 0),
    feeToBeDiscussedLater: Boolean(row.fee_to_be_discussed_later),
    feeNotes: row.fee_notes || '',
    billedKES: Number(row.billed_kes || 0),
    paidKES: Number(row.paid_kes || 0),
    createdDate: row.created_date || new Date().toISOString(),
    lodgedDate: row.lodged_date || undefined,
    description: row.description || '',
    priority: row.priority || 'Medium',
    documentsCount: Number(row.documents_count || 0),
    opposingParty: row.opposing_party || '',
    conflictCheckStatus: row.conflict_check_status || 'Cleared',
    conflictCertificateRef: row.conflict_certificate_ref || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    archivedAt: row.archived_at || undefined,
    archivedBy: row.archived_by || undefined,
    archiveReason: row.archive_reason || undefined,
    createdByAdvocateId: row.created_by_advocate_id || undefined,
    createdByName: row.created_by_name || undefined,
  };
}

export function mapClientMatterToSupabase(matter: LegalMatter): any {
  return {
    id: String(matter.id),
    reference_number: String(matter.referenceNumber || matter.id),
    title: String(matter.title || 'Untitled Matter'),
    client_name: String(matter.clientName || ''),
    client_id: matter.clientId ? String(matter.clientId) : null,
    practice_area: String(matter.practiceArea || 'Civil Litigation'),
    court_registry: matter.courtRegistry || null,
    court_case_number: matter.courtCaseNumber || null,
    cts_filing_id: matter.ctsFilingId || null,
    responsible_advocate_id: matter.responsibleAdvocateId ? String(matter.responsibleAdvocateId) : null,
    responsible_advocate_name: String(matter.responsibleAdvocateName || ''),
    status: String(matter.status || 'Active - In Court'),
    next_deadline_date: sanitizeDate(matter.nextDeadlineDate),
    next_deadline_description: matter.nextDeadlineDescription || null,
    next_court_date: sanitizeDate(matter.nextCourtDate) || sanitizeDate(matter.nextDeadlineDate),
    court_date_purpose: matter.courtDatePurpose || null,
    estimated_fee_kes: Number(matter.estimatedFeeKES || 0),
    fee_to_be_discussed_later: Boolean(matter.feeToBeDiscussedLater),
    fee_notes: matter.feeNotes || null,
    billed_kes: Number(matter.billedKES || 0),
    paid_kes: Number(matter.paidKES || 0),
    created_date: String(matter.createdDate || new Date().toISOString()),
    lodged_date: sanitizeDate(matter.lodgedDate),
    description: String(matter.description || ''),
    priority: String(matter.priority || 'Medium'),
    documents_count: Number(matter.documentsCount || 0),
    opposing_party: matter.opposingParty || null,
    conflict_check_status: matter.conflictCheckStatus || 'Cleared',
    conflict_certificate_ref: matter.conflictCertificateRef || null,
    tags: Array.isArray(matter.tags) ? matter.tags : [],
    archived_at: matter.archivedAt || null,
    archived_by: matter.archivedBy || null,
    archive_reason: matter.archiveReason || null,
    created_by_advocate_id: matter.createdByAdvocateId ? String(matter.createdByAdvocateId) : null,
    created_by_name: matter.createdByName || null,
    updated_at: new Date().toISOString(),
  };
}

// --- 2. TASKS ---
export function mapSupabaseTaskToClient(row: any): TaskItem {
  return {
    id: String(row.id),
    title: row.title || 'Untitled Task',
    description: row.description || '',
    matterId: row.matter_id || '',
    matterRef: row.matter_ref || '',
    clientName: row.client_name || '',
    assignedTo: row.assigned_to || '',
    assignedToId: row.assigned_to_id || undefined,
    assignedToEmail: row.assigned_to_email || undefined,
    createdBy: row.created_by || '',
    createdById: row.created_by_id || undefined,
    dueDate: row.due_date || '',
    startDate: row.start_date || '',
    priority: row.priority || 'Medium',
    status: row.status || 'Not Started',
    estimatedHours: Number(row.estimated_hours || 0),
    actualHours: Number(row.actual_hours || 0),
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
    commentsCount: Number(row.comments_count || 0),
  };
}

export function mapClientTaskToSupabase(task: TaskItem): any {
  return {
    id: String(task.id),
    title: String(task.title || 'Untitled Task'),
    description: task.description ? String(task.description) : null,
    matter_id: task.matterId ? String(task.matterId) : null,
    matter_ref: task.matterRef ? String(task.matterRef) : null,
    client_name: task.clientName ? String(task.clientName) : null,
    assigned_to: String(task.assignedTo || ''),
    assigned_to_id: task.assignedToId ? String(task.assignedToId) : null,
    assigned_to_email: task.assignedToEmail ? String(task.assignedToEmail) : null,
    created_by: String(task.createdBy || ''),
    created_by_id: task.createdById ? String(task.createdById) : null,
    due_date: sanitizeDate(task.dueDate) || new Date().toISOString().split('T')[0],
    start_date: sanitizeDate(task.startDate),
    priority: String(task.priority || 'Medium'),
    status: String(task.status || 'Not Started'),
    estimated_hours: Number(task.estimatedHours || 0),
    actual_hours: Number(task.actualHours || 0),
    subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    comments_count: Number(task.commentsCount || 0),
    updated_at: new Date().toISOString(),
  };
}

// --- 3. CLIENTS ---
export function mapSupabaseClientToClient(row: any): Client {
  return {
    id: String(row.id),
    name: row.name || 'Unnamed Client',
    type: row.type || 'Corporate',
    industry: row.industry || '',
    kraPin: row.kra_pin || '',
    contactPerson: row.contact_person || '',
    email: row.email || '',
    phone: row.phone || '',
    city: row.city || 'Nairobi',
    activeMattersCount: Number(row.active_matters_count || 0),
    totalBilledKES: Number(row.total_billed_kes || 0),
    retainerStatus: row.retainer_status || 'Per-Matter',
  };
}

export function mapClientClientToSupabase(cli: Client): any {
  return {
    id: String(cli.id),
    name: String(cli.name || 'Unnamed Client'),
    type: String(cli.type || 'Corporate'),
    industry: cli.industry || null,
    kra_pin: cli.kraPin || null,
    contact_person: cli.contactPerson || null,
    email: cli.email || null,
    phone: cli.phone || null,
    city: cli.city || 'Nairobi',
    active_matters_count: Number(cli.activeMattersCount || 0),
    total_billed_kes: Number(cli.totalBilledKES || 0),
    retainer_status: cli.retainerStatus || 'Per-Matter',
    updated_at: new Date().toISOString(),
  };
}

// --- 4. DEADLINES ---
export function mapSupabaseDeadlineToClient(row: any): DeadlineItem {
  return {
    id: String(row.id),
    title: row.title || '',
    category: row.category || 'Hearing',
    matterId: row.matter_id || '',
    matterRef: row.matter_ref || '',
    matterTitle: row.matter_title || '',
    courtLocation: row.court_location || '',
    dueDate: row.due_date || '',
    time: row.time || '09:00 AM',
    advocateName: row.advocate_name || '',
    presidingJudge: row.presiding_judge || '',
    completed: Boolean(row.completed),
    priority: row.priority || 'High',
  };
}

export function mapClientDeadlineToSupabase(dl: DeadlineItem): any {
  return {
    id: String(dl.id),
    title: String(dl.title || ''),
    category: dl.category || 'Hearing',
    matter_id: dl.matterId ? String(dl.matterId) : null,
    matter_ref: dl.matterRef || null,
    matter_title: dl.matterTitle || 'General',
    court_location: dl.courtLocation || null,
    due_date: sanitizeDate(dl.dueDate) || new Date().toISOString().split('T')[0],
    time: dl.time || '09:00 AM',
    advocate_name: String(dl.advocateName || ''),
    presiding_judge: dl.presidingJudge || null,
    completed: Boolean(dl.completed),
    priority: dl.priority || 'High',
    updated_at: new Date().toISOString(),
  };
}

// --- 5. ACTIVITIES ---
export function mapSupabaseActivityToClient(row: any): ActivityLog {
  return {
    id: String(row.id),
    type: (row.type as any) || 'Court Event',
    title: row.title || '',
    description: row.description || '',
    timestamp: row.timestamp || new Date().toISOString(),
    user: row.user_name || 'Advocate',
    matterId: row.matter_id || undefined,
    matterRef: row.matter_ref || undefined,
  };
}

export function mapClientActivityToSupabase(act: ActivityLog): any {
  return {
    id: String(act.id),
    type: String(act.type || 'Court Event'),
    title: String(act.title || ''),
    description: act.description || null,
    timestamp: act.timestamp || new Date().toISOString(),
    user_name: String(act.user || 'Advocate'),
    matter_id: act.matterId ? String(act.matterId) : null,
    matter_ref: act.matterRef || null,
  };
}

// --- 6. NOTIFICATIONS ---
export function mapSupabaseNotificationToClient(row: any): NotificationItem {
  return {
    id: String(row.id),
    title: row.title || '',
    message: row.message || '',
    timestamp: row.timestamp || new Date().toISOString(),
    read: Boolean(row.read),
    type: row.type || 'System',
    recipientEmail: row.recipient_email || undefined,
    emailPayload: row.email_payload || undefined,
  };
}

export function mapClientNotificationToSupabase(notif: NotificationItem): any {
  return {
    id: String(notif.id),
    title: String(notif.title || ''),
    message: String(notif.message || ''),
    timestamp: notif.timestamp || new Date().toISOString(),
    read: Boolean(notif.read),
    type: String(notif.type || 'System'),
    recipient_email: notif.recipientEmail || null,
    email_payload: notif.emailPayload || null,
  };
}

// --- 7. FEE NOTES (INVOICES) ---
export function mapSupabaseFeeNoteToClient(row: any): FeeNote {
  return {
    id: String(row.id),
    invoiceNumber: row.invoice_number || row.id,
    clientName: row.client_name || '',
    clientId: row.client_id || undefined,
    clientEmail: row.client_email || undefined,
    clientKraPin: row.client_kra_pin || undefined,
    clientAddress: row.client_address || undefined,
    matterId: row.matter_id || undefined,
    matterRef: row.matter_ref || undefined,
    matterTitle: row.matter_title || '',
    dateIssued: row.date_issued || new Date().toISOString().split('T')[0],
    dueDate: row.due_date || new Date().toISOString().split('T')[0],
    items: Array.isArray(row.items) ? row.items : [],
    subtotalKES: Number(row.subtotal_kes || 0),
    discountKES: Number(row.discount_kes || 0),
    taxableAmountKES: Number(row.taxable_amount_kes || 0),
    nonTaxableAmountKES: Number(row.non_taxable_amount_kes || 0),
    disbursementsKES: Number(row.disbursements_kes || 0),
    amountKES: Number(row.amount_kes || 0),
    vatRatePercent: Number(row.vat_rate_percent || 16),
    vatKES: Number(row.vat_kes || 0),
    totalKES: Number(row.total_kes || 0),
    amountPaidKES: Number(row.amount_paid_kes || 0),
    balanceKES: Number(row.balance_kes !== undefined ? row.balance_kes : (Number(row.total_kes || 0) - Number(row.amount_paid_kes || 0))),
    status: row.status || 'Unpaid',
    paymentRef: row.payment_ref || undefined,
    quoteId: row.quote_id || undefined,
    quoteNumber: row.quote_number || undefined,
    notes: row.notes || undefined,
    bankDetails: row.bank_details || undefined,
    paymentsCount: Number(row.payments_count || 0),
  };
}

export function mapClientFeeNoteToSupabase(fn: FeeNote): any {
  return {
    id: String(fn.id),
    invoice_number: String(fn.invoiceNumber || fn.id),
    client_name: String(fn.clientName || ''),
    client_id: fn.clientId ? String(fn.clientId) : null,
    client_email: fn.clientEmail || null,
    client_kra_pin: fn.clientKraPin || null,
    client_address: fn.clientAddress || null,
    matter_id: fn.matterId ? String(fn.matterId) : null,
    matter_ref: fn.matterRef || null,
    matter_title: String(fn.matterTitle || 'General Representation'),
    date_issued: sanitizeDate(fn.dateIssued) || new Date().toISOString().split('T')[0],
    due_date: sanitizeDate(fn.dueDate) || new Date().toISOString().split('T')[0],
    items: Array.isArray(fn.items) ? fn.items : [],
    subtotal_kes: Number(fn.subtotalKES || 0),
    discount_kes: Number(fn.discountKES || 0),
    taxable_amount_kes: Number(fn.taxableAmountKES || 0),
    non_taxable_amount_kes: Number(fn.nonTaxableAmountKES || 0),
    disbursements_kes: Number(fn.disbursementsKES || 0),
    amount_kes: Number(fn.amountKES || 0),
    vat_rate_percent: Number(fn.vatRatePercent || 16),
    vat_kes: Number(fn.vatKES || 0),
    total_kes: Number(fn.totalKES || 0),
    amount_paid_kes: Number(fn.amountPaidKES || 0),
    balance_kes: Number(fn.balanceKES !== undefined ? fn.balanceKES : (Number(fn.totalKES || 0) - Number(fn.amountPaidKES || 0))),
    status: String(fn.status || 'Unpaid'),
    payment_ref: fn.paymentRef || null,
    quote_id: fn.quoteId || null,
    quote_number: fn.quoteNumber || null,
    notes: fn.notes || null,
    bank_details: fn.bankDetails || null,
    payments_count: Number(fn.paymentsCount || 0),
    updated_at: new Date().toISOString(),
  };
}

// --- 8. PAYMENTS ---
export function mapSupabasePaymentToClient(row: any): PaymentRecord {
  return {
    id: String(row.id),
    receiptNumber: row.receipt_number || row.id,
    paymentReference: row.payment_reference || '',
    invoiceId: row.invoice_id || '',
    invoiceNumber: row.invoice_number || '',
    clientId: row.client_id || '',
    clientName: row.client_name || '',
    matterTitle: row.matter_title || undefined,
    amountKES: Number(row.amount_kes || 0),
    paymentMethod: row.payment_method || 'Bank Transfer',
    paymentDate: row.payment_date || new Date().toISOString().split('T')[0],
    notes: row.notes || undefined,
    receivedBy: row.received_by || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapClientPaymentToSupabase(pay: PaymentRecord): any {
  return {
    id: String(pay.id),
    receipt_number: String(pay.receiptNumber || pay.id),
    payment_reference: String(pay.paymentReference || ''),
    invoice_id: pay.invoiceId ? String(pay.invoiceId) : null,
    invoice_number: String(pay.invoiceNumber || ''),
    client_id: pay.clientId ? String(pay.clientId) : null,
    client_name: String(pay.clientName || ''),
    matter_title: pay.matterTitle || null,
    amount_kes: Number(pay.amountKES || 0),
    payment_method: String(pay.paymentMethod || 'Bank Transfer'),
    payment_date: sanitizeDate(pay.paymentDate) || new Date().toISOString().split('T')[0],
    notes: pay.notes || null,
    received_by: pay.receivedBy || null,
  };
}

// --- 9. QUOTATIONS ---
export function mapSupabaseQuoteToClient(row: any): Quotation {
  return {
    id: String(row.id),
    quoteNumber: row.quote_number || row.id,
    title: row.title || 'Quotation',
    clientId: row.client_id || '',
    clientName: row.client_name || '',
    clientEmail: row.client_email || undefined,
    clientPhone: row.client_phone || undefined,
    clientAddress: row.client_address || undefined,
    clientKraPin: row.client_kra_pin || undefined,
    matterId: row.matter_id || undefined,
    matterRef: row.matter_ref || undefined,
    matterTitle: row.matter_title || undefined,
    quoteDate: row.quote_date || new Date().toISOString().split('T')[0],
    expiryDate: row.expiry_date || new Date().toISOString().split('T')[0],
    items: Array.isArray(row.items) ? row.items : [],
    subtotalKES: Number(row.subtotal_kes || 0),
    discountPercent: Number(row.discount_percent || 0),
    discountKES: Number(row.discount_kes || 0),
    taxableAmountKES: Number(row.taxable_amount_kes || 0),
    nonTaxableAmountKES: Number(row.non_taxable_amount_kes || 0),
    vatKES: Number(row.vat_kes || 0),
    totalKES: Number(row.total_kes || 0),
    status: row.status || 'Draft',
    notes: row.notes || undefined,
    termsAndConditions: row.terms_and_conditions || undefined,
    convertedInvoiceId: row.converted_invoice_id || undefined,
    convertedInvoiceNumber: row.converted_invoice_number || undefined,
    convertedDate: row.converted_date || undefined,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
  };
}

export function mapClientQuoteToSupabase(q: Quotation): any {
  return {
    id: String(q.id),
    quote_number: String(q.quoteNumber || q.id),
    title: String(q.title || 'Quotation'),
    client_id: q.clientId ? String(q.clientId) : null,
    client_name: String(q.clientName || ''),
    client_email: q.clientEmail || null,
    client_phone: q.clientPhone || null,
    client_address: q.clientAddress || null,
    client_kra_pin: q.clientKraPin || null,
    matter_id: q.matterId ? String(q.matterId) : null,
    matter_ref: q.matterRef || null,
    matter_title: q.matterTitle || null,
    quote_date: sanitizeDate(q.quoteDate) || new Date().toISOString().split('T')[0],
    expiry_date: sanitizeDate(q.expiryDate) || new Date().toISOString().split('T')[0],
    items: Array.isArray(q.items) ? q.items : [],
    subtotal_kes: Number(q.subtotalKES || 0),
    discount_percent: Number(q.discountPercent || 0),
    discount_kes: Number(q.discountKES || 0),
    taxable_amount_kes: Number(q.taxableAmountKES || 0),
    non_taxable_amount_kes: Number(q.nonTaxableAmountKES || 0),
    vat_kes: Number(q.vatKES || 0),
    total_kes: Number(q.totalKES || 0),
    status: String(q.status || 'Draft'),
    notes: q.notes || null,
    terms_and_conditions: q.termsAndConditions || null,
    converted_invoice_id: q.convertedInvoiceId || null,
    converted_invoice_number: q.convertedInvoiceNumber || null,
    converted_date: sanitizeDate(q.convertedDate),
    created_by: q.createdBy || null,
    updated_at: new Date().toISOString(),
  };
}

// --- 10. DOCUMENTS & FOLDERS & DRAFTS ---
export function mapSupabaseDocumentToClient(row: any): DocumentItem {
  return {
    id: String(row.id),
    title: row.title || 'Untitled Document',
    matterRef: row.matter_ref || '',
    category: row.category || 'Pleading',
    fileSize: row.file_size || '1.0 MB',
    uploadedBy: row.uploaded_by || 'Advocate',
    uploadedDate: row.uploaded_date || new Date().toISOString().split('T')[0],
    ctsReceiptNo: row.cts_receipt_no || undefined,
    currentVersion: row.current_version || 'v1.0',
    versions: Array.isArray(row.versions) ? row.versions : [],
    folderId: row.folder_id || null,
  };
}

export function mapClientDocumentToSupabase(doc: DocumentItem): any {
  return {
    id: String(doc.id),
    title: String(doc.title || 'Untitled Document'),
    matter_ref: String(doc.matterRef || ''),
    category: String(doc.category || 'Pleading'),
    file_size: String(doc.fileSize || '1.0 MB'),
    uploaded_by: String(doc.uploadedBy || 'Advocate'),
    uploaded_date: sanitizeDate(doc.uploadedDate) || new Date().toISOString().split('T')[0],
    cts_receipt_no: doc.ctsReceiptNo || null,
    current_version: doc.currentVersion || 'v1.0',
    versions: Array.isArray(doc.versions) ? doc.versions : [],
    folder_id: doc.folderId ? String(doc.folderId) : null,
    updated_at: new Date().toISOString(),
  };
}

export function mapSupabaseFolderToClient(row: any): DocumentFolder {
  return {
    id: String(row.id),
    name: row.name || 'Folder',
    parentId: row.parent_id || null,
    matterRef: row.matter_ref || undefined,
    createdDate: row.created_date || new Date().toISOString().split('T')[0],
    itemCount: Number(row.item_count || 0),
  };
}

export function mapClientFolderToSupabase(f: DocumentFolder): any {
  return {
    id: String(f.id),
    name: String(f.name || 'Folder'),
    parent_id: f.parentId ? String(f.parentId) : null,
    matter_ref: f.matterRef || null,
    created_date: sanitizeDate(f.createdDate) || new Date().toISOString().split('T')[0],
    item_count: Number(f.itemCount || 0),
  };
}

export function mapSupabaseDraftToClient(row: any): DocumentDraft {
  return {
    id: String(row.id),
    title: row.title || 'Draft',
    matterRef: row.matter_ref || '',
    folderId: row.folder_id || undefined,
    category: row.category || 'Pleading',
    content: row.content || '',
    author: row.author || 'Advocate',
    lastModified: row.last_modified || new Date().toISOString(),
    status: row.status || 'Draft',
  };
}

export function mapClientDraftToSupabase(d: DocumentDraft): any {
  return {
    id: String(d.id),
    title: String(d.title || 'Draft'),
    matter_ref: String(d.matterRef || ''),
    folder_id: d.folderId ? String(d.folderId) : null,
    category: String(d.category || 'Pleading'),
    content: String(d.content || ''),
    author: String(d.author || 'Advocate'),
    last_modified: d.lastModified || new Date().toISOString(),
    status: String(d.status || 'Draft'),
    updated_at: new Date().toISOString(),
  };
}

// --- 11. CLIENT ONBOARDING ---
export function mapSupabaseOnboardingToClient(row: any): ClientOnboardingSubmission {
  return {
    id: String(row.id),
    clientName: row.client_name || '',
    clientType: row.client_type || 'Individual',
    idOrRegNo: row.id_or_reg_no || '',
    email: row.email || '',
    phone: row.phone || '',
    address: row.address || '',
    matterType: row.matter_type || '',
    assignedAdvocate: row.assigned_advocate || '',
    retainerFeeKES: Number(row.retainer_fee_kes || 0),
    status: row.status || 'Pending Review',
    submittedDate: row.submitted_date || new Date().toISOString().split('T')[0],
    notes: row.notes || undefined,
  };
}

export function mapClientOnboardingToSupabase(o: ClientOnboardingSubmission): any {
  return {
    id: String(o.id),
    client_name: String(o.clientName || ''),
    client_type: String(o.clientType || 'Individual'),
    id_or_reg_no: String(o.idOrRegNo || ''),
    email: o.email || null,
    phone: o.phone || null,
    address: o.address || null,
    matter_type: o.matterType || null,
    assigned_advocate: o.assignedAdvocate || null,
    retainer_fee_kes: Number(o.retainerFeeKES || 0),
    status: String(o.status || 'Pending Review'),
    submitted_date: sanitizeDate(o.submittedDate) || new Date().toISOString().split('T')[0],
    notes: o.notes || null,
    updated_at: new Date().toISOString(),
  };
}

// --- 12. TIME ENTRIES ---
export function mapSupabaseTimeEntryToClient(row: any): TimeEntry {
  return {
    id: String(row.id),
    matterId: row.matter_id || '',
    matterRef: row.matter_ref || '',
    advocateName: row.advocate_name || '',
    date: row.date || new Date().toISOString().split('T')[0],
    activityType: row.activity_type || 'Legal Research',
    description: row.description || '',
    durationMinutes: Number(row.duration_minutes || 0),
    billable: Boolean(row.billable),
    hourlyRateKES: Number(row.hourly_rate_kes || 0),
    totalFeeKES: Number(row.total_fee_kes || 0),
    billed: Boolean(row.billed),
  };
}

export function mapClientTimeEntryToSupabase(te: TimeEntry): any {
  return {
    id: String(te.id),
    matter_id: te.matterId ? String(te.matterId) : null,
    matter_ref: te.matterRef || null,
    advocate_name: String(te.advocateName || 'Advocate'),
    date: sanitizeDate(te.date) || new Date().toISOString().split('T')[0],
    activity_type: String(te.activityType || 'Legal Research'),
    description: String(te.description || ''),
    duration_minutes: Number(te.durationMinutes || 0),
    billable: Boolean(te.billable),
    hourly_rate_kes: Number(te.hourlyRateKES || 0),
    total_fee_kes: Number(te.totalFeeKES || 0),
    billed: Boolean(te.billed),
    updated_at: new Date().toISOString(),
  };
}

// --- 13. LEAVE REQUESTS ---
export function mapSupabaseLeaveRequestToClient(row: any): LeaveRequest {
  return {
    id: String(row.id),
    staffName: row.staff_name || '',
    role: row.role || 'Advocate',
    leaveType: row.leave_type || 'Annual Leave',
    startDate: row.start_date || new Date().toISOString().split('T')[0],
    endDate: row.end_date || new Date().toISOString().split('T')[0],
    daysRequested: Number(row.days_requested || 1),
    reason: row.reason || '',
    reliefStaff: row.relief_staff || '',
    status: row.status || 'Pending',
    requestedOn: row.requested_on || new Date().toISOString().split('T')[0],
    approvedBy: row.approved_by || undefined,
  };
}

export function mapClientLeaveRequestToSupabase(lr: LeaveRequest): any {
  return {
    id: String(lr.id),
    staff_name: String(lr.staffName || ''),
    role: String(lr.role || 'Advocate'),
    leave_type: String(lr.leaveType || 'Annual Leave'),
    start_date: sanitizeDate(lr.startDate) || new Date().toISOString().split('T')[0],
    end_date: sanitizeDate(lr.endDate) || new Date().toISOString().split('T')[0],
    days_requested: Number(lr.daysRequested || 1),
    reason: String(lr.reason || ''),
    relief_staff: lr.reliefStaff || null,
    status: String(lr.status || 'Pending'),
    requested_on: sanitizeDate(lr.requestedOn) || new Date().toISOString().split('T')[0],
    approved_by: lr.approvedBy || null,
    updated_at: new Date().toISOString(),
  };
}

// --- 14. LEAVE BALANCES ---
export function mapSupabaseLeaveBalanceToClient(row: any): LeaveBalance {
  return {
    staffName: row.staff_name || '',
    role: row.role || 'Advocate',
    annualTotal: Number(row.annual_total || 21),
    annualUsed: Number(row.annual_used || 0),
    sickTotal: Number(row.sick_total || 14),
    sickUsed: Number(row.sick_used || 0),
    cleTotal: Number(row.cle_total || 7),
    cleUsed: Number(row.cle_used || 0),
  };
}

export function mapClientLeaveBalanceToSupabase(lb: LeaveBalance): any {
  return {
    staff_name: String(lb.staffName || ''),
    role: String(lb.role || 'Advocate'),
    annual_total: Number(lb.annualTotal || 21),
    annual_used: Number(lb.annualUsed || 0),
    sick_total: Number(lb.sickTotal || 14),
    sick_used: Number(lb.sickUsed || 0),
    cle_total: Number(lb.cleTotal || 7),
    cle_used: Number(lb.cleUsed || 0),
    updated_at: new Date().toISOString(),
  };
}

// ============================================================================
// CHAMBERS CLOUD SERVICE
// ============================================================================

export class ChambersCloudService {
  /**
   * Subscribe to live database changes across ALL legal practice tables via Supabase Realtime.
   * Updates regional application storage and emits custom events upon mutations.
   */
  static subscribeToRealtimeChanges(): () => void {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) {
      return () => {};
    }

    const channel = supabase
      .channel('chambers-realtime-channel')
      
      // 1. Matters
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matters' },
        (payload) => {
          const currentMatters = loadSavedMatters();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseMatterToClient(payload.new);
            if (!currentMatters.some((m) => m.id === newItem.id)) {
              saveStoredMattersCache([newItem, ...currentMatters]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapSupabaseMatterToClient(payload.new);
            saveStoredMattersCache(currentMatters.map((m) => (m.id === updatedItem.id ? updatedItem : m)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredMattersCache(currentMatters.filter((m) => m.id !== payload.old.id));
          }
        }
      )

      // 2. Tasks
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          const currentTasks = loadSavedTasks();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseTaskToClient(payload.new);
            if (!currentTasks.some((t) => t.id === newItem.id)) {
              saveStoredTasksCache([newItem, ...currentTasks]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapSupabaseTaskToClient(payload.new);
            saveStoredTasksCache(currentTasks.map((t) => (t.id === updatedItem.id ? updatedItem : t)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredTasksCache(currentTasks.filter((t) => t.id !== payload.old.id));
          }
        }
      )

      // 3. Clients
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          const currentClients = loadSavedClients();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseClientToClient(payload.new);
            if (!currentClients.some((c) => c.id === newItem.id)) {
              saveStoredClientsCache([newItem, ...currentClients]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapSupabaseClientToClient(payload.new);
            saveStoredClientsCache(currentClients.map((c) => (c.id === updatedItem.id ? updatedItem : c)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredClientsCache(currentClients.filter((c) => c.id !== payload.old.id));
          }
        }
      )

      // 4. Deadlines
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deadlines' },
        (payload) => {
          const currentDeadlines = loadSavedDeadlines();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseDeadlineToClient(payload.new);
            if (!currentDeadlines.some((d) => d.id === newItem.id)) {
              saveStoredDeadlinesCache([newItem, ...currentDeadlines]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapSupabaseDeadlineToClient(payload.new);
            saveStoredDeadlinesCache(currentDeadlines.map((d) => (d.id === updatedItem.id ? updatedItem : d)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredDeadlinesCache(currentDeadlines.filter((d) => d.id !== payload.old.id));
          }
        }
      )

      // 5. Activities
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        (payload) => {
          const current = loadSavedActivities();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseActivityToClient(payload.new);
            if (!current.some((a) => a.id === newItem.id)) {
              saveStoredActivitiesCache([newItem, ...current]);
            }
          } else if (payload.eventType === 'DELETE') {
            saveStoredActivitiesCache(current.filter((a) => a.id !== payload.old.id));
          }
        }
      )

      // 6. Notifications
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          const current = loadSavedNotifications();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseNotificationToClient(payload.new);
            if (!current.some((n) => n.id === newItem.id)) {
              saveStoredNotificationsCache([newItem, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapSupabaseNotificationToClient(payload.new);
            saveStoredNotificationsCache(current.map((n) => (n.id === updated.id ? updated : n)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredNotificationsCache(current.filter((n) => n.id !== payload.old.id));
          }
        }
      )

      // 7. Fee Notes (Invoices)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fee_notes' },
        (payload) => {
          const current = loadSavedFeeNotes();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseFeeNoteToClient(payload.new);
            if (!current.some((fn) => fn.id === newItem.id)) {
              saveStoredFeeNotesCache([newItem, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapSupabaseFeeNoteToClient(payload.new);
            saveStoredFeeNotesCache(current.map((fn) => (fn.id === updated.id ? updated : fn)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredFeeNotesCache(current.filter((fn) => fn.id !== payload.old.id));
          }
        }
      )

      // 8. Payments
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          const current = loadSavedPayments();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabasePaymentToClient(payload.new);
            if (!current.some((p) => p.id === newItem.id)) {
              saveStoredPaymentsCache([newItem, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapSupabasePaymentToClient(payload.new);
            saveStoredPaymentsCache(current.map((p) => (p.id === updated.id ? updated : p)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredPaymentsCache(current.filter((p) => p.id !== payload.old.id));
          }
        }
      )

      // 9. Quotations
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotations' },
        (payload) => {
          const current = loadSavedQuotes();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseQuoteToClient(payload.new);
            if (!current.some((q) => q.id === newItem.id)) {
              saveStoredQuotesCache([newItem, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapSupabaseQuoteToClient(payload.new);
            saveStoredQuotesCache(current.map((q) => (q.id === updated.id ? updated : q)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredQuotesCache(current.filter((q) => q.id !== payload.old.id));
          }
        }
      )

      // 10. Documents
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          const current = loadSavedDocumentItems();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseDocumentToClient(payload.new);
            if (!current.some((d) => d.id === newItem.id)) {
              saveStoredDocumentItemsCache([newItem, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapSupabaseDocumentToClient(payload.new);
            saveStoredDocumentItemsCache(current.map((d) => (d.id === updated.id ? updated : d)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredDocumentItemsCache(current.filter((d) => d.id !== payload.old.id));
          }
        }
      )

      // 11. Document Folders
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'document_folders' },
        (payload) => {
          const current = loadSavedDocumentFolders();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseFolderToClient(payload.new);
            if (!current.some((f) => f.id === newItem.id)) {
              saveStoredDocumentFoldersCache([newItem, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapSupabaseFolderToClient(payload.new);
            saveStoredDocumentFoldersCache(current.map((f) => (f.id === updated.id ? updated : f)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredDocumentFoldersCache(current.filter((f) => f.id !== payload.old.id));
          }
        }
      )

      // 12. Document Drafts
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'document_drafts' },
        (payload) => {
          const current = loadSavedDocumentDrafts();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseDraftToClient(payload.new);
            if (!current.some((d) => d.id === newItem.id)) {
              saveStoredDocumentDraftsCache([newItem, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapSupabaseDraftToClient(payload.new);
            saveStoredDocumentDraftsCache(current.map((d) => (d.id === updated.id ? updated : d)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredDocumentDraftsCache(current.filter((d) => d.id !== payload.old.id));
          }
        }
      )

      // 13. Client Onboardings
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_onboardings' },
        (payload) => {
          const current = loadSavedOnboardings();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseOnboardingToClient(payload.new);
            if (!current.some((o) => o.id === newItem.id)) {
              saveStoredOnboardingsCache([newItem, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapSupabaseOnboardingToClient(payload.new);
            saveStoredOnboardingsCache(current.map((o) => (o.id === updated.id ? updated : o)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredOnboardingsCache(current.filter((o) => o.id !== payload.old.id));
          }
        }
      )

      // 14. Time Entries
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_entries' },
        (payload) => {
          const current = loadSavedTimeEntries();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseTimeEntryToClient(payload.new);
            if (!current.some((te) => te.id === newItem.id)) {
              saveStoredTimeEntriesCache([newItem, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapSupabaseTimeEntryToClient(payload.new);
            saveStoredTimeEntriesCache(current.map((te) => (te.id === updated.id ? updated : te)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredTimeEntriesCache(current.filter((te) => te.id !== payload.old.id));
          }
        }
      )

      // 15. Leave Requests
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        (payload) => {
          const current = loadSavedLeaveRequests();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseLeaveRequestToClient(payload.new);
            if (!current.some((lr) => lr.id === newItem.id)) {
              saveStoredLeaveRequestsCache([newItem, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapSupabaseLeaveRequestToClient(payload.new);
            saveStoredLeaveRequestsCache(current.map((lr) => (lr.id === updated.id ? updated : lr)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredLeaveRequestsCache(current.filter((lr) => lr.id !== payload.old.id));
          }
        }
      )

      // 16. Leave Balances
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_balances' },
        (payload) => {
          const current = loadSavedLeaveBalances();
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = mapSupabaseLeaveBalanceToClient(payload.new);
            const exists = current.some((b) => b.staffName === updated.staffName && b.role === updated.role);
            if (exists) {
              saveStoredLeaveBalancesCache(
                current.map((b) => (b.staffName === updated.staffName && b.role === updated.role ? updated : b))
              );
            } else {
              saveStoredLeaveBalancesCache([...current, updated]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // ==========================================================================
  // MATTERS CRUD
  // ==========================================================================
  static async fetchMatters(user: Advocate): Promise<LegalMatter[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      let query = supabase.from('matters').select('*');

      if (!canUserViewAll(user)) {
        query = query.or(
          `responsible_advocate_id.eq.${user.id},created_by_advocate_id.eq.${user.id},responsible_advocate_name.ilike.%${user.name}%`
        );
      }

      const { data, error } = await query.order('created_date', { ascending: false });

      if (error) {
        console.warn('[ChambersCloudService] fetchMatters query error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseMatterToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchMatters exception:', err);
      return null;
    }
  }

  static async upsertMatter(matter: LegalMatter): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientMatterToSupabase(matter);
      const { error } = await supabase.from('matters').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertMatter error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertMatter exception:', err);
      return false;
    }
  }

  static async deleteMatter(matterId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('matters').delete().eq('id', matterId);
      if (error) {
        console.error('[ChambersCloudService] deleteMatter error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteMatter exception:', err);
      return false;
    }
  }

  // ==========================================================================
  // TASKS CRUD
  // ==========================================================================
  static async fetchTasks(user: Advocate, userMatters?: LegalMatter[]): Promise<TaskItem[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      let query = supabase.from('tasks').select('*');

      if (!canUserViewAll(user)) {
        let filterStr = `assigned_to_id.eq.${user.id},created_by_id.eq.${user.id},assigned_to.ilike.%${user.name}%`;
        
        if (userMatters && userMatters.length > 0) {
          const matterIds = userMatters.map((m) => m.id).filter(Boolean);
          if (matterIds.length > 0) {
            const matterIdClause = matterIds.map((id) => `matter_id.eq.${id}`).join(',');
            filterStr += `,${matterIdClause}`;
          }
        }

        query = query.or(filterStr);
      }

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) {
        console.warn('[ChambersCloudService] fetchTasks query error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseTaskToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchTasks exception:', err);
      return null;
    }
  }

  static async upsertTask(task: TaskItem): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientTaskToSupabase(task);
      const { error } = await supabase.from('tasks').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertTask error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertTask exception:', err);
      return false;
    }
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) {
        console.error('[ChambersCloudService] deleteTask error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteTask exception:', err);
      return false;
    }
  }

  // ==========================================================================
  // CLIENTS CRUD
  // ==========================================================================
  static async fetchClients(): Promise<Client[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('[ChambersCloudService] fetchClients error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseClientToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchClients exception:', err);
      return null;
    }
  }

  static async upsertClient(client: Client): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientClientToSupabase(client);
      const { error } = await supabase.from('clients').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertClient error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertClient exception:', err);
      return false;
    }
  }

  static async deleteClient(clientId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) {
        console.error('[ChambersCloudService] deleteClient error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteClient exception:', err);
      return false;
    }
  }

  // ==========================================================================
  // DEADLINES CRUD
  // ==========================================================================
  static async fetchDeadlines(user?: Advocate): Promise<DeadlineItem[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      let query = supabase.from('deadlines').select('*');

      if (user && !canUserViewAll(user)) {
        query = query.or(`advocate_name.ilike.%${user.name}%`);
      }

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) {
        console.warn('[ChambersCloudService] fetchDeadlines error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseDeadlineToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchDeadlines exception:', err);
      return null;
    }
  }

  static async upsertDeadline(deadline: DeadlineItem): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientDeadlineToSupabase(deadline);
      const { error } = await supabase.from('deadlines').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertDeadline error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertDeadline exception:', err);
      return false;
    }
  }

  static async deleteDeadline(deadlineId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('deadlines').delete().eq('id', deadlineId);
      if (error) {
        console.error('[ChambersCloudService] deleteDeadline error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteDeadline exception:', err);
      return false;
    }
  }

  // ==========================================================================
  // ACTIVITIES CRUD
  // ==========================================================================
  static async fetchActivities(): Promise<ActivityLog[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('[ChambersCloudService] fetchActivities error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseActivityToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchActivities exception:', err);
      return null;
    }
  }

  static async recordActivity(activity: ActivityLog): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientActivityToSupabase(activity);
      const { error } = await supabase.from('activities').insert(payload);

      if (error) {
        console.error('[ChambersCloudService] recordActivity error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] recordActivity exception:', err);
      return false;
    }
  }

  static async deleteActivity(activityId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('activities').delete().eq('id', activityId);
      if (error) {
        console.error('[ChambersCloudService] deleteActivity error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteActivity exception:', err);
      return false;
    }
  }

  // ==========================================================================
  // NOTIFICATIONS CRUD
  // ==========================================================================
  static async fetchNotifications(recipientEmail?: string): Promise<NotificationItem[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      let query = supabase.from('notifications').select('*');
      if (recipientEmail) {
        query = query.or(`recipient_email.eq.${recipientEmail},recipient_email.is.null`);
      }
      const { data, error } = await query.order('timestamp', { ascending: false }).limit(50);

      if (error) {
        console.warn('[ChambersCloudService] fetchNotifications error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseNotificationToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchNotifications exception:', err);
      return null;
    }
  }

  static async upsertNotification(notification: NotificationItem): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientNotificationToSupabase(notification);
      const { error } = await supabase.from('notifications').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertNotification error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertNotification exception:', err);
      return false;
    }
  }

  static async deleteNotification(notificationId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
      if (error) {
        console.error('[ChambersCloudService] deleteNotification error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteNotification exception:', err);
      return false;
    }
  }

  static async markAllNotificationsRead(recipientEmail?: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      let query = (supabase.from('notifications') as any).update({ read: true });
      if (recipientEmail) {
        query = query.or(`recipient_email.eq.${recipientEmail},recipient_email.is.null`);
      } else {
        query = query.neq('id', '');
      }
      const { error } = await query;
      if (error) {
        console.error('[ChambersCloudService] markAllNotificationsRead error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] markAllNotificationsRead exception:', err);
      return false;
    }
  }

  // ==========================================================================
  // FEE NOTES (INVOICES) CRUD
  // ==========================================================================
  static async fetchFeeNotes(): Promise<FeeNote[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('fee_notes')
        .select('*')
        .order('date_issued', { ascending: false });

      if (error) {
        console.warn('[ChambersCloudService] fetchFeeNotes error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseFeeNoteToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchFeeNotes exception:', err);
      return null;
    }
  }

  static async upsertFeeNote(feeNote: FeeNote): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientFeeNoteToSupabase(feeNote);
      const { error } = await supabase.from('fee_notes').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertFeeNote error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertFeeNote exception:', err);
      return false;
    }
  }

  static async deleteFeeNote(feeNoteId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('fee_notes').delete().eq('id', feeNoteId);
      if (error) {
        console.error('[ChambersCloudService] deleteFeeNote error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteFeeNote exception:', err);
      return false;
    }
  }

  // ==========================================================================
  // PAYMENTS CRUD
  // ==========================================================================
  static async fetchPayments(): Promise<PaymentRecord[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (error) {
        console.warn('[ChambersCloudService] fetchPayments error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabasePaymentToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchPayments exception:', err);
      return null;
    }
  }

  static async upsertPayment(payment: PaymentRecord): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientPaymentToSupabase(payment);
      const { error } = await supabase.from('payments').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertPayment error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertPayment exception:', err);
      return false;
    }
  }

  static async deletePayment(paymentId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('payments').delete().eq('id', paymentId);
      if (error) {
        console.error('[ChambersCloudService] deletePayment error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deletePayment exception:', err);
      return false;
    }
  }

  // ==========================================================================
  // QUOTATIONS CRUD
  // ==========================================================================
  static async fetchQuotes(): Promise<Quotation[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('quote_date', { ascending: false });

      if (error) {
        console.warn('[ChambersCloudService] fetchQuotes error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseQuoteToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchQuotes exception:', err);
      return null;
    }
  }

  static async upsertQuote(quote: Quotation): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientQuoteToSupabase(quote);
      const { error } = await supabase.from('quotations').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertQuote error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertQuote exception:', err);
      return false;
    }
  }

  static async deleteQuote(quoteId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('quotations').delete().eq('id', quoteId);
      if (error) {
        console.error('[ChambersCloudService] deleteQuote error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteQuote exception:', err);
      return false;
    }
  }

  // ==========================================================================
  // DOCUMENTS & FOLDERS & DRAFTS CRUD
  // ==========================================================================
  static async fetchDocuments(): Promise<DocumentItem[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('uploaded_date', { ascending: false });

      if (error) {
        console.warn('[ChambersCloudService] fetchDocuments error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseDocumentToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchDocuments exception:', err);
      return null;
    }
  }

  static async upsertDocument(doc: DocumentItem): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientDocumentToSupabase(doc);
      const { error } = await supabase.from('documents').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertDocument error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertDocument exception:', err);
      return false;
    }
  }

  static async deleteDocument(docId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('documents').delete().eq('id', docId);
      if (error) {
        console.error('[ChambersCloudService] deleteDocument error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteDocument exception:', err);
      return false;
    }
  }

  static async fetchFolders(): Promise<DocumentFolder[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('document_folders')
        .select('*')
        .order('created_date', { ascending: false });

      if (error) {
        console.warn('[ChambersCloudService] fetchFolders error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseFolderToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchFolders exception:', err);
      return null;
    }
  }

  static async upsertFolder(folder: DocumentFolder): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientFolderToSupabase(folder);
      const { error } = await supabase.from('document_folders').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertFolder error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertFolder exception:', err);
      return false;
    }
  }

  static async deleteFolder(folderId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('document_folders').delete().eq('id', folderId);
      if (error) {
        console.error('[ChambersCloudService] deleteFolder error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteFolder exception:', err);
      return false;
    }
  }

  static async fetchDrafts(): Promise<DocumentDraft[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('document_drafts')
        .select('*')
        .order('last_modified', { ascending: false });

      if (error) {
        console.warn('[ChambersCloudService] fetchDrafts error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseDraftToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchDrafts exception:', err);
      return null;
    }
  }

  static async upsertDraft(draft: DocumentDraft): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientDraftToSupabase(draft);
      const { error } = await supabase.from('document_drafts').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertDraft error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertDraft exception:', err);
      return false;
    }
  }

  static async deleteDraft(draftId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('document_drafts').delete().eq('id', draftId);
      if (error) {
        console.error('[ChambersCloudService] deleteDraft error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteDraft exception:', err);
      return false;
    }
  }

  // ==========================================================================
  // CLIENT ONBOARDING CRUD
  // ==========================================================================
  static async fetchOnboardings(): Promise<ClientOnboardingSubmission[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('client_onboardings')
        .select('*')
        .order('submitted_date', { ascending: false });

      if (error) {
        console.warn('[ChambersCloudService] fetchOnboardings error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseOnboardingToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchOnboardings exception:', err);
      return null;
    }
  }

  static async upsertOnboarding(submission: ClientOnboardingSubmission): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientOnboardingToSupabase(submission);
      const { error } = await supabase.from('client_onboardings').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertOnboarding error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertOnboarding exception:', err);
      return false;
    }
  }

  static async deleteOnboarding(onboardingId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('client_onboardings').delete().eq('id', onboardingId);
      if (error) {
        console.error('[ChambersCloudService] deleteOnboarding error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteOnboarding exception:', err);
      return false;
    }
  }

  // ==========================================================================
  // TIME ENTRIES CRUD
  // ==========================================================================
  static async fetchTimeEntries(matterId?: string): Promise<TimeEntry[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      let query = supabase.from('time_entries').select('*');
      if (matterId) {
        query = query.eq('matter_id', matterId);
      }
      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        console.warn('[ChambersCloudService] fetchTimeEntries error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseTimeEntryToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchTimeEntries exception:', err);
      return null;
    }
  }

  static async upsertTimeEntry(entry: TimeEntry): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientTimeEntryToSupabase(entry);
      const { error } = await supabase.from('time_entries').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertTimeEntry error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertTimeEntry exception:', err);
      return false;
    }
  }

  static async deleteTimeEntry(entryId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('time_entries').delete().eq('id', entryId);
      if (error) {
        console.error('[ChambersCloudService] deleteTimeEntry error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteTimeEntry exception:', err);
      return false;
    }
  }

  // ==========================================================================
  // HRM LEAVE REQUESTS & BALANCES CRUD
  // ==========================================================================
  static async fetchLeaveRequests(): Promise<LeaveRequest[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .order('requested_on', { ascending: false });

      if (error) {
        console.warn('[ChambersCloudService] fetchLeaveRequests error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseLeaveRequestToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchLeaveRequests exception:', err);
      return null;
    }
  }

  static async upsertLeaveRequest(request: LeaveRequest): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientLeaveRequestToSupabase(request);
      const { error } = await supabase.from('leave_requests').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[ChambersCloudService] upsertLeaveRequest error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertLeaveRequest exception:', err);
      return false;
    }
  }

  static async deleteLeaveRequest(requestId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase.from('leave_requests').delete().eq('id', requestId);
      if (error) {
        console.error('[ChambersCloudService] deleteLeaveRequest error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] deleteLeaveRequest exception:', err);
      return false;
    }
  }

  static async fetchLeaveBalances(): Promise<LeaveBalance[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .order('staff_name', { ascending: true });

      if (error) {
        console.warn('[ChambersCloudService] fetchLeaveBalances error:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseLeaveBalanceToClient);
    } catch (err) {
      console.error('[ChambersCloudService] fetchLeaveBalances exception:', err);
      return null;
    }
  }

  static async upsertLeaveBalance(balance: LeaveBalance): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return false;

    try {
      const payload = mapClientLeaveBalanceToSupabase(balance);
      const { error } = await supabase.from('leave_balances').upsert(payload, { onConflict: 'staff_name,role' });

      if (error) {
        console.error('[ChambersCloudService] upsertLeaveBalance error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[ChambersCloudService] upsertLeaveBalance exception:', err);
      return false;
    }
  }
}

export default ChambersCloudService;
