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
 */

import { getSupabaseClient, isSupabaseConfigured } from '../utils/supabaseClient';
import { canUserViewAll } from '../utils/visibilityRules';
import {
  loadSavedMatters,
  saveStoredMatters,
  loadSavedTasks,
  saveStoredTasks,
  loadSavedClients,
  saveStoredClients,
  loadSavedDeadlines,
  saveStoredDeadlines,
} from '../utils/chambersDataStorage';
import {
  Advocate,
  LegalMatter,
  Client,
  TaskItem,
  DeadlineItem,
  ActivityLog,
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
  if (
    trimmed === '' ||
    trimmed.toLowerCase() === 'none scheduled' ||
    trimmed.toLowerCase() === 'n/a' ||
    trimmed.toLowerCase() === 'none'
  ) {
    return null;
  }
  return trimmed;
}

// ============================================================================
// DATA MAPPERS (CamelCase Frontend <-> Snake_Case Supabase)
// ============================================================================

export function mapSupabaseMatterToClient(row: any): LegalMatter {
  return {
    id: row.id,
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

export function mapSupabaseTaskToClient(row: any): TaskItem {
  return {
    id: row.id,
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
    description: String(task.description || ''),
    matter_id: task.matterId ? String(task.matterId) : null,
    matter_ref: task.matterRef || null,
    client_name: task.clientName || null,
    assigned_to: String(task.assignedTo || ''),
    assigned_to_id: task.assignedToId ? String(task.assignedToId) : null,
    assigned_to_email: task.assignedToEmail || null,
    created_by: String(task.createdBy || ''),
    created_by_id: task.createdById ? String(task.createdById) : null,
    due_date: sanitizeDate(task.dueDate) || new Date().toISOString().split('T')[0],
    start_date: sanitizeDate(task.startDate),
    priority: task.priority || 'Medium',
    status: task.status || 'Not Started',
    estimated_hours: Number(task.estimatedHours || 0),
    actual_hours: Number(task.actualHours || 0),
    subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    comments_count: Number(task.commentsCount || 0),
    updated_at: new Date().toISOString(),
  };
}

export function mapSupabaseClientToClient(row: any): Client {
  return {
    id: row.id,
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

export function mapSupabaseDeadlineToClient(row: any): DeadlineItem {
  return {
    id: row.id,
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
    matter_id: dl.matterId ? String(dl.matterId) : 'general-matter',
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

export function mapSupabaseActivityToClient(row: any): ActivityLog {
  return {
    id: row.id,
    type: (row.type as any) || 'Court Event',
    title: row.title || '',
    description: row.description || '',
    timestamp: row.timestamp || 'Just now',
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
    matter_id: act.matterId || null,
    matter_ref: act.matterRef || null,
  };
}

// ============================================================================
// CHAMBERS CLOUD SERVICE
// ============================================================================

export class ChambersCloudService {
  /**
   * Subscribe to live database changes via Supabase Realtime channel.
   * Updates regional application storage and emits custom events upon mutations.
   */
  static subscribeToRealtimeChanges(): () => void {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) {
      return () => {};
    }

    const channel = supabase
      .channel('chambers-realtime-channel')
      
      // Matters Realtime Listener
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matters' },
        (payload) => {
          const currentMatters = loadSavedMatters();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseMatterToClient(payload.new);
            if (!currentMatters.some((m) => m.id === newItem.id)) {
              saveStoredMatters([newItem, ...currentMatters]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapSupabaseMatterToClient(payload.new);
            saveStoredMatters(currentMatters.map((m) => (m.id === updatedItem.id ? updatedItem : m)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredMatters(currentMatters.filter((m) => m.id !== payload.old.id));
          }
        }
      )

      // Tasks Realtime Listener
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          const currentTasks = loadSavedTasks();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseTaskToClient(payload.new);
            if (!currentTasks.some((t) => t.id === newItem.id)) {
              saveStoredTasks([newItem, ...currentTasks]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapSupabaseTaskToClient(payload.new);
            saveStoredTasks(currentTasks.map((t) => (t.id === updatedItem.id ? updatedItem : t)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredTasks(currentTasks.filter((t) => t.id !== payload.old.id));
          }
        }
      )

      // Clients Realtime Listener
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          const currentClients = loadSavedClients();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseClientToClient(payload.new);
            if (!currentClients.some((c) => c.id === newItem.id)) {
              saveStoredClients([newItem, ...currentClients]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapSupabaseClientToClient(payload.new);
            saveStoredClients(currentClients.map((c) => (c.id === updatedItem.id ? updatedItem : c)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredClients(currentClients.filter((c) => c.id !== payload.old.id));
          }
        }
      )

      // Deadlines Realtime Listener
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deadlines' },
        (payload) => {
          const currentDeadlines = loadSavedDeadlines();
          if (payload.eventType === 'INSERT') {
            const newItem = mapSupabaseDeadlineToClient(payload.new);
            if (!currentDeadlines.some((d) => d.id === newItem.id)) {
              saveStoredDeadlines([newItem, ...currentDeadlines]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapSupabaseDeadlineToClient(payload.new);
            saveStoredDeadlines(currentDeadlines.map((d) => (d.id === updatedItem.id ? updatedItem : d)));
          } else if (payload.eventType === 'DELETE') {
            saveStoredDeadlines(currentDeadlines.filter((d) => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Fetch Matters directly from Supabase with Multi-User Role Scoping
   */
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

      // Order by created_date to align with existing table schema
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

  /**
   * Direct Cloud Upsert for Matters
   */
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

  /**
   * Direct Cloud Delete for Matters
   */
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

  /**
   * Fetch Tasks directly from Supabase with Multi-User Role Scoping
   */
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

  /**
   * Direct Cloud Upsert for Tasks
   */
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

  /**
   * Direct Cloud Delete for Tasks
   */
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

  /**
   * Fetch Clients directly from Supabase
   */
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

  /**
   * Direct Cloud Upsert for Clients
   */
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

  /**
   * Direct Cloud Delete for Clients
   */
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

  /**
   * Fetch Deadlines with Multi-User Role Scoping
   */
  static async fetchDeadlines(user: Advocate): Promise<DeadlineItem[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      let query = supabase.from('deadlines').select('*');

      if (!canUserViewAll(user)) {
        query = query.or(
          `advocate_name.ilike.%${user.name}%`
        );
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

  /**
   * Direct Cloud Upsert for Deadlines
   */
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

  /**
   * Fetch Activities directly from Supabase
   */
  static async fetchActivities(): Promise<ActivityLog[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

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

  /**
   * Record Activity directly to Supabase
   */
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
}

export default ChambersCloudService;
