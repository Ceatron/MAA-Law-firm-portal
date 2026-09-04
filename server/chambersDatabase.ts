/**
 * Centralized Chambers Database Server Engine
 * 
 * Provides:
 * 1. Immediate, shared server-side database persistence (shared across all browsers, users, and devices).
 * 2. Automatic dual-write and synchronization to Supabase PostgreSQL when SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY are configured.
 * 3. Seed data initialization for fresh deployments so matters, tasks, and clients exist immediately.
 */

import fs from 'fs';
import path from 'path';
import { getServerSupabase } from './supabaseServer';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'chambers_db.json');

export interface ChambersDatabaseState {
  version: number;
  lastUpdated: string;
  matters: any[];
  clients: any[];
  tasks: any[];
  deadlines: any[];
  activities: any[];
  notifications: any[];
  fee_notes: any[];
  payments: any[];
  quotes: any[];
  documents: any[];
  staff_roster: any[];
}

// Initial Chambers Data Seeding
const INITIAL_SEED_DATA: ChambersDatabaseState = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  matters: [
    {
      id: 'mat-1',
      referenceNumber: 'MAA/HC/COM/2026/0142',
      title: 'Stanbic Bank Kenya Ltd v. Prime Logistics EA Ltd & 2 Others',
      clientName: 'Stanbic Bank Kenya Limited',
      clientId: 'client-1',
      practiceArea: 'Commercial Litigation',
      courtRegistry: 'High Court Commercial Div. - Milimani',
      courtCaseNumber: 'Civil Suit No. E142 of 2026',
      ctsFilingId: 'CTS-2026-NBI-8492',
      responsibleAdvocateId: 'adv-1',
      responsibleAdvocateName: 'Adv. Costa Kimathi',
      status: 'Active - In Court',
      nextDeadlineDate: '12 Mar 2026',
      nextDeadlineDescription: 'Hearing of Interlocutory Injunction Application',
      nextCourtDate: '12 Mar 2026',
      courtDatePurpose: 'Hearing',
      estimatedFeeKES: 850000,
      feeToBeDiscussedLater: false,
      billedKES: 450000,
      paidKES: 300000,
      createdDate: '14 Jan 2026',
      lodgedDate: '14 Jan 2026',
      description: 'Defending recovery suit against unauthorized charge execution over mortgaged industrial park in Ruiru.',
      priority: 'High',
      documentsCount: 14,
      opposingParty: 'Prime Logistics EA Ltd & Anor',
      conflictCheckStatus: 'Cleared',
      conflictCertificateRef: 'LSK-CONF-2026-0041',
      tags: ['Commercial', 'Injunction', 'High Value', 'Banking'],
      createdByAdvocateId: 'adv-1',
      createdByName: 'Adv. Costa Kimathi',
    },
    {
      id: 'mat-2',
      referenceNumber: 'MAA/ELC/ENV/2026/0088',
      title: 'Apex Properties Ltd v. National Environment Management Authority (NEMA)',
      clientName: 'Apex Properties Limited',
      clientId: 'client-2',
      practiceArea: 'Environment & Land',
      courtRegistry: 'Environment and Land Court - Nairobi',
      courtCaseNumber: 'ELC Petition No. 88 of 2026',
      ctsFilingId: 'CTS-2026-NBI-3391',
      responsibleAdvocateId: 'adv-moraa',
      responsibleAdvocateName: 'Wendy Moraa',
      status: 'Active - Discovery',
      nextDeadlineDate: '19 Mar 2026',
      nextDeadlineDescription: 'Filing of supplementary expert environmental affidavit',
      nextCourtDate: '19 Mar 2026',
      courtDatePurpose: 'Mention',
      estimatedFeeKES: 1200000,
      feeToBeDiscussedLater: false,
      billedKES: 600000,
      paidKES: 600000,
      createdDate: '02 Feb 2026',
      lodgedDate: '02 Feb 2026',
      description: 'Challenging stoppage order issued against commercial high-rise mixed-use development along Eastern Bypass.',
      priority: 'High',
      documentsCount: 22,
      opposingParty: 'NEMA & Nairobi City County',
      conflictCheckStatus: 'Cleared',
      conflictCertificateRef: 'LSK-CONF-2026-0092',
      tags: ['Land', 'Environmental', 'NEMA', 'Conveyancing'],
      createdByAdvocateId: 'adv-1',
      createdByName: 'Adv. Costa Kimathi',
    },
    {
      id: 'mat-3',
      referenceNumber: 'MAA/SC/TAX/2025/0019',
      title: 'East Africa Grain Mills Ltd v. Kenya Revenue Authority (KRA)',
      clientName: 'East Africa Grain Mills Limited',
      clientId: 'client-3',
      practiceArea: 'Tax & Revenue',
      courtRegistry: 'Tax Appeals Tribunal - Nairobi',
      courtCaseNumber: 'TAT Appeal No. 19 of 2025',
      ctsFilingId: 'CTS-2025-TAT-0112',
      responsibleAdvocateId: 'adv-allan',
      responsibleAdvocateName: 'Allan Khasabuli',
      status: 'Active - Pre-Trial',
      nextDeadlineDate: '26 Mar 2026',
      nextDeadlineDescription: 'Filing statement of agreed tax computation & legal authorities',
      nextCourtDate: '26 Mar 2026',
      courtDatePurpose: 'Case Conference',
      estimatedFeeKES: 1500000,
      feeToBeDiscussedLater: false,
      billedKES: 750000,
      paidKES: 500000,
      createdDate: '10 Nov 2025',
      lodgedDate: '10 Nov 2025',
      description: 'Appeal contesting VAT input deduction disallowed by Commissioner for Domestic Taxes regarding raw material importation.',
      priority: 'High',
      documentsCount: 31,
      opposingParty: 'Commissioner of Domestic Taxes (KRA)',
      conflictCheckStatus: 'Cleared',
      conflictCertificateRef: 'LSK-CONF-2025-0814',
      tags: ['Tax', 'TAT', 'Corporate Advisory', 'Appeals'],
      createdByAdvocateId: 'adv-1',
      createdByName: 'Adv. Costa Kimathi',
    },
    {
      id: 'mat-4',
      referenceNumber: 'MAA/CORP/ADV/2026/0007',
      title: 'CrossBorder Telecom Ltd - Cross-Border Asset Acquisition & Restructuring',
      clientName: 'CrossBorder Telecom Kenya Ltd',
      clientId: 'client-4',
      practiceArea: 'Corporate & Commercial',
      courtRegistry: 'Registrar of Companies / Competition Authority',
      courtCaseNumber: 'CAK/MERG/2026/04',
      ctsFilingId: undefined,
      responsibleAdvocateId: 'adv-1',
      responsibleAdvocateName: 'Adv. Costa Kimathi',
      status: 'Active - Discovery',
      nextDeadlineDate: '15 Apr 2026',
      nextDeadlineDescription: 'Submission of COMESA Competition Commission merger clearance questionnaire',
      nextCourtDate: '15 Apr 2026',
      courtDatePurpose: 'Advisory Review',
      estimatedFeeKES: 2400000,
      feeToBeDiscussedLater: false,
      billedKES: 1200000,
      paidKES: 1200000,
      createdDate: '20 Jan 2026',
      lodgedDate: '20 Jan 2026',
      description: 'Structuring shareholder agreement, statutory legal due diligence, and regulatory filings for $8.2M fibre asset acquisition.',
      priority: 'Medium',
      documentsCount: 45,
      opposingParty: 'N/A (Transaction Counsel)',
      conflictCheckStatus: 'Cleared',
      conflictCertificateRef: 'LSK-CONF-2026-0012',
      tags: ['Corporate', 'M&A', 'Regulatory', 'Competition'],
      createdByAdvocateId: 'adv-1',
      createdByName: 'Adv. Costa Kimathi',
    }
  ],
  clients: [
    {
      id: 'client-1',
      name: 'Stanbic Bank Kenya Limited',
      type: 'Corporate',
      industry: 'Banking & Financial Services',
      kraPin: 'P051102934X',
      contactPerson: 'Martin Oduor (Head of Remedial Legal)',
      email: 'legal.remedial@stanbic.co.ke',
      phone: '+254 20 326 8000',
      city: 'Nairobi',
      activeMattersCount: 1,
      totalBilledKES: 450000,
      retainerStatus: 'Monthly Retainer',
    },
    {
      id: 'client-2',
      name: 'Apex Properties Limited',
      type: 'Corporate',
      industry: 'Real Estate & Infrastructure',
      kraPin: 'P051839201A',
      contactPerson: 'David Mwangi (Managing Director)',
      email: 'dmwangi@apexproperties.co.ke',
      phone: '+254 722 550 440',
      city: 'Nairobi',
      activeMattersCount: 1,
      totalBilledKES: 600000,
      retainerStatus: 'Per-Matter',
    },
    {
      id: 'client-3',
      name: 'East Africa Grain Mills Limited',
      type: 'Corporate',
      industry: 'Agri-Processing & Manufacturing',
      kraPin: 'P051394821M',
      contactPerson: 'Zahra Kassim (CFO)',
      email: 'zkassim@eagrainmills.co.ke',
      phone: '+254 733 900 120',
      city: 'Thika',
      activeMattersCount: 1,
      totalBilledKES: 750000,
      retainerStatus: 'Monthly Retainer',
    },
    {
      id: 'client-4',
      name: 'CrossBorder Telecom Kenya Ltd',
      type: 'Corporate',
      industry: 'Telecommunications & ICT',
      kraPin: 'P052098441K',
      contactPerson: 'Brenda Cherono (General Counsel)',
      email: 'legal@crossbordertelecom.co.ke',
      phone: '+254 700 880 770',
      city: 'Nairobi',
      activeMattersCount: 1,
      totalBilledKES: 1200000,
      retainerStatus: 'Per-Matter',
    }
  ],
  tasks: [
    {
      id: 'tsk-1',
      title: 'Draft Replying Affidavit on Injunction Notice of Motion',
      description: 'Review defendant replying affidavits and draft response contesting status quo order over mortgaged property.',
      matterId: 'mat-1',
      matterRef: 'MAA/HC/COM/2026/0142',
      clientName: 'Stanbic Bank Kenya Limited',
      assignedTo: 'Adv. Costa Kimathi',
      assignedToId: 'adv-1',
      assignedToEmail: 'muthoni@muthoniahagolaw.co.ke',
      createdBy: 'Adv. Costa Kimathi',
      createdById: 'adv-1',
      dueDate: '2026-03-08',
      priority: 'High',
      status: 'In Progress',
      tags: ['Drafting', 'High Court'],
      createdAt: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'tsk-2',
      title: 'Conduct Environmental Site Expert Conference & Obtain Soil Analysis',
      description: 'Liaise with registered NEMA lead expert to formulate counter-report on drainage compliance for Apex Properties.',
      matterId: 'mat-2',
      matterRef: 'MAA/ELC/ENV/2026/0088',
      clientName: 'Apex Properties Limited',
      assignedTo: 'Wendy Moraa',
      assignedToId: 'adv-moraa',
      assignedToEmail: 'wendy@muthoniahagolaw.co.ke',
      createdBy: 'Adv. Costa Kimathi',
      createdById: 'adv-1',
      dueDate: '2026-03-14',
      priority: 'High',
      status: 'Pending',
      tags: ['ELC', 'Discovery'],
      createdAt: '2026-03-02T09:30:00.000Z',
    },
    {
      id: 'tsk-3',
      title: 'Prepare Statement of Agreed Issues & Tax Computation Summary',
      description: 'Reconcile input tax ledgers with forensic accountant for submission before the Tax Appeals Tribunal.',
      matterId: 'mat-3',
      matterRef: 'MAA/SC/TAX/2025/0019',
      clientName: 'East Africa Grain Mills Limited',
      assignedTo: 'Allan Khasabuli',
      assignedToId: 'adv-allan',
      assignedToEmail: 'allan@muthoniahagolaw.co.ke',
      createdBy: 'Adv. Costa Kimathi',
      createdById: 'adv-1',
      dueDate: '2026-03-20',
      priority: 'High',
      status: 'Pending',
      tags: ['Tax', 'TAT'],
      createdAt: '2026-03-03T11:00:00.000Z',
    },
    {
      id: 'tsk-4',
      title: 'E-file Hearing Bundle on CTS and Serve Milimani Commercial Registry',
      description: 'Collate court bundle, execute CTS online filing, and ensure physical stamping on opposing counsel.',
      matterId: 'mat-1',
      matterRef: 'MAA/HC/COM/2026/0142',
      clientName: 'Stanbic Bank Kenya Limited',
      assignedTo: 'Enrique Irungu',
      assignedToId: 'staff-clerk-1',
      assignedToEmail: 'irungu@muthoniahagolaw.co.ke',
      createdBy: 'Adv. Costa Kimathi',
      createdById: 'adv-1',
      dueDate: '2026-03-10',
      priority: 'High',
      status: 'Pending',
      tags: ['Court Registry', 'CTS Filing'],
      createdAt: '2026-03-03T14:15:00.000Z',
    }
  ],
  deadlines: [
    {
      id: 'dl-1',
      title: 'Stanbic Bank Kenya Ltd v. Prime Logistics EA Ltd - Interlocutory Injunction Hearing',
      category: 'Court Hearing',
      matterId: 'mat-1',
      matterRef: 'MAA/HC/COM/2026/0142',
      matterTitle: 'Stanbic Bank Kenya Ltd v. Prime Logistics EA Ltd & 2 Others',
      courtLocation: 'High Court Commercial Div. - Milimani (Court 4)',
      dueDate: '2026-03-12',
      time: '09:00 AM',
      advocateName: 'Adv. Costa Kimathi',
      advocateId: 'adv-1',
      presidingJudge: 'Hon. Lady Justice Chepkwony',
      completed: false,
      priority: 'High',
    },
    {
      id: 'dl-2',
      title: 'Apex Properties v. NEMA - Supplementary Environmental Affidavit Filing',
      category: 'Court Filing',
      matterId: 'mat-2',
      matterRef: 'MAA/ELC/ENV/2026/0088',
      matterTitle: 'Apex Properties Ltd v. National Environment Management Authority (NEMA)',
      courtLocation: 'Environment & Land Court - Milimani',
      dueDate: '2026-03-19',
      time: '02:00 PM',
      advocateName: 'Wendy Moraa',
      advocateId: 'adv-moraa',
      presidingJudge: 'Hon. Justice Mabeya',
      completed: false,
      priority: 'High',
    },
    {
      id: 'dl-3',
      title: 'East Africa Grain Mills v. KRA - Mention for Compliance at TAT',
      category: 'Court Hearing',
      matterId: 'mat-3',
      matterRef: 'MAA/SC/TAX/2025/0019',
      matterTitle: 'East Africa Grain Mills Ltd v. Kenya Revenue Authority (KRA)',
      courtLocation: 'Tax Appeals Tribunal - 5th Floor, KICC',
      dueDate: '2026-03-26',
      time: '10:30 AM',
      advocateName: 'Allan Khasabuli',
      advocateId: 'adv-allan',
      presidingJudge: 'Hon. Tribunal Panel Chair',
      completed: false,
      priority: 'High',
    }
  ],
  activities: [
    {
      id: 'act-1',
      title: 'Chambers Database Initialized',
      description: 'Central chambers database service mounted and active with live multi-user synchronization.',
      timestamp: new Date().toISOString(),
      type: 'system',
      advocateName: 'Eric',
    }
  ],
  notifications: [
    {
      id: 'notif-1',
      title: 'Chambers Database Synchronized',
      message: 'Persistent server database online. All matters and tasks are centrally synchronized across all advocates and devices.',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'system',
    }
  ],
  fee_notes: [],
  payments: [],
  quotes: [],
  documents: [],
  staff_roster: [],
};

// Ensure data directory exists
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// In-memory cache
let inMemoryDb: ChambersDatabaseState | null = null;

export function loadDatabase(): ChambersDatabaseState {
  ensureDataDir();

  if (inMemoryDb) {
    return inMemoryDb;
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        inMemoryDb = {
          ...INITIAL_SEED_DATA,
          ...parsed,
          matters: Array.isArray(parsed.matters) && parsed.matters.length > 0 ? parsed.matters : INITIAL_SEED_DATA.matters,
          clients: Array.isArray(parsed.clients) && parsed.clients.length > 0 ? parsed.clients : INITIAL_SEED_DATA.clients,
          tasks: Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks : INITIAL_SEED_DATA.tasks,
          deadlines: Array.isArray(parsed.deadlines) && parsed.deadlines.length > 0 ? parsed.deadlines : INITIAL_SEED_DATA.deadlines,
        };
        return inMemoryDb!;
      }
    }
  } catch (err) {
    console.error('[Chambers DB] Error reading DB file, using initial seed data:', err);
  }

  // Initialize and write seed data
  inMemoryDb = { ...INITIAL_SEED_DATA };
  saveDatabase(inMemoryDb);
  return inMemoryDb;
}

export function saveDatabase(data: ChambersDatabaseState): void {
  ensureDataDir();
  data.lastUpdated = new Date().toISOString();
  inMemoryDb = data;

  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[Chambers DB] Error saving DB to file:', err);
  }
}

/**
 * Returns database health and synchronization status.
 */
export function getDatabaseStatus(): {
  status: string;
  provider: string;
  supabaseConfigured: boolean;
  lastUpdated: string;
  recordCounts: Record<string, number>;
} {
  const db = loadDatabase();
  const supabase = getServerSupabase();

  return {
    status: 'online',
    provider: supabase ? 'supabase_postgresql' : 'central_server_persistence',
    supabaseConfigured: Boolean(supabase),
    lastUpdated: db.lastUpdated,
    recordCounts: {
      matters: db.matters.length,
      clients: db.clients.length,
      tasks: db.tasks.length,
      deadlines: db.deadlines.length,
      activities: db.activities.length,
      notifications: db.notifications.length,
      fee_notes: db.fee_notes.length,
    },
  };
}

/**
 * Gets all data across all collections.
 */
export async function getAllData(): Promise<ChambersDatabaseState> {
  const db = loadDatabase();
  const supabase = getServerSupabase();

  // If Supabase is connected, attempt to fetch latest matters & tasks from Supabase
  if (supabase) {
    try {
      const [mattersRes, clientsRes, tasksRes, deadlinesRes] = await Promise.all([
        supabase.from('matters').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('deadlines').select('*').order('created_at', { ascending: false }),
      ]);

      if (mattersRes.data && mattersRes.data.length > 0) {
        // Map snake_case to CamelCase if retrieved from Supabase
        db.matters = mattersRes.data.map(mapSupabaseMatterToClient);
      }
      if (clientsRes.data && clientsRes.data.length > 0) {
        db.clients = clientsRes.data.map(mapSupabaseClientToClient);
      }
      if (tasksRes.data && tasksRes.data.length > 0) {
        db.tasks = tasksRes.data.map(mapSupabaseTaskToClient);
      }
      if (deadlinesRes.data && deadlinesRes.data.length > 0) {
        db.deadlines = deadlinesRes.data.map(mapSupabaseDeadlineToClient);
      }
    } catch (sbErr) {
      console.warn('[Chambers DB] Supabase live query failed, serving from persistent server store:', sbErr);
    }
  }

  return db;
}

/**
 * Inserts or updates a single record in the specified collection.
 */
export async function upsertRecord(collection: keyof ChambersDatabaseState, record: any): Promise<any> {
  if (!record || !record.id) {
    throw new Error('Record must have an id.');
  }

  const db = loadDatabase();
  const items = (db[collection] as any[]) || [];
  const index = items.findIndex((item: any) => item.id === record.id);

  if (index >= 0) {
    items[index] = { ...items[index], ...record };
  } else {
    items.unshift(record);
  }

  (db as any)[collection] = items;
  saveDatabase(db);

  // If Supabase is configured, write to Supabase asynchronously
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      if (collection === 'matters') {
        await supabase.from('matters').upsert(mapClientMatterToSupabase(record));
      } else if (collection === 'clients') {
        await supabase.from('clients').upsert(mapClientClientToSupabase(record));
      } else if (collection === 'tasks') {
        await supabase.from('tasks').upsert(mapClientTaskToSupabase(record));
      } else if (collection === 'deadlines') {
        await supabase.from('deadlines').upsert(mapClientDeadlineToSupabase(record));
      }
    } catch (sbErr) {
      console.warn(`[Chambers DB] Background sync to Supabase for ${collection} failed:`, sbErr);
    }
  }

  return record;
}

/**
 * Deletes a record from the specified collection.
 */
export async function deleteRecord(collection: keyof ChambersDatabaseState, id: string): Promise<boolean> {
  const db = loadDatabase();
  const items = (db[collection] as any[]) || [];
  const initialLength = items.length;
  const filtered = items.filter((item: any) => item.id !== id);

  if (filtered.length !== initialLength) {
    (db as any)[collection] = filtered;
    saveDatabase(db);

    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const table = collection === 'matters' ? 'matters' : collection === 'clients' ? 'clients' : collection === 'tasks' ? 'tasks' : collection === 'deadlines' ? 'deadlines' : null;
        if (table) {
          await supabase.from(table).delete().eq('id', id);
        }
      } catch (sbErr) {
        console.warn(`[Chambers DB] Background delete from Supabase for ${collection} failed:`, sbErr);
      }
    }
    return true;
  }

  return false;
}

/**
 * Synchronizes client collections with the server database.
 * Merges client records into server state and returns the authoritative state.
 */
export async function syncCollections(incoming: Partial<ChambersDatabaseState>): Promise<ChambersDatabaseState> {
  const db = loadDatabase();

  const mergeArray = (existing: any[], incomingList?: any[]) => {
    if (!incomingList || !Array.isArray(incomingList)) return existing;
    const map = new Map<string, any>();
    // First existing items
    for (const item of existing) {
      if (item && item.id) map.set(item.id, item);
    }
    // Then incoming items overwrite/add
    for (const item of incomingList) {
      if (item && item.id) {
        const prev = map.get(item.id);
        map.set(item.id, prev ? { ...prev, ...item } : item);
      }
    }
    return Array.from(map.values());
  };

  if (incoming.matters) db.matters = mergeArray(db.matters, incoming.matters);
  if (incoming.clients) db.clients = mergeArray(db.clients, incoming.clients);
  if (incoming.tasks) db.tasks = mergeArray(db.tasks, incoming.tasks);
  if (incoming.deadlines) db.deadlines = mergeArray(db.deadlines, incoming.deadlines);
  if (incoming.activities) db.activities = mergeArray(db.activities, incoming.activities);
  if (incoming.notifications) db.notifications = mergeArray(db.notifications, incoming.notifications);
  if (incoming.fee_notes) db.fee_notes = mergeArray(db.fee_notes, incoming.fee_notes);

  saveDatabase(db);

  // Sync to Supabase if available
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      if (incoming.matters && incoming.matters.length > 0) {
        await supabase.from('matters').upsert(incoming.matters.map(mapClientMatterToSupabase));
      }
      if (incoming.tasks && incoming.tasks.length > 0) {
        await supabase.from('tasks').upsert(incoming.tasks.map(mapClientTaskToSupabase));
      }
      if (incoming.clients && incoming.clients.length > 0) {
        await supabase.from('clients').upsert(incoming.clients.map(mapClientClientToSupabase));
      }
    } catch (sbErr) {
      console.warn('[Chambers DB] Supabase sync error:', sbErr);
    }
  }

  return db;
}

/**
 * Maps Supabase PostgreSQL record to Client-side LegalMatter.
 */
function mapSupabaseMatterToClient(row: any): any {
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

function mapClientMatterToSupabase(matter: any): any {
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
    next_deadline_date: matter.nextDeadlineDate || null,
    next_deadline_description: matter.nextDeadlineDescription || null,
    next_court_date: matter.nextCourtDate || matter.nextDeadlineDate || null,
    court_date_purpose: matter.courtDatePurpose || null,
    estimated_fee_kes: Number(matter.estimatedFeeKES || 0),
    fee_to_be_discussed_later: Boolean(matter.feeToBeDiscussedLater),
    fee_notes: matter.feeNotes || null,
    billed_kes: Number(matter.billedKES || 0),
    paid_kes: Number(matter.paidKES || 0),
    created_date: String(matter.createdDate || new Date().toISOString()),
    lodged_date: matter.lodgedDate || null,
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
  };
}

function mapSupabaseTaskToClient(row: any): any {
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
    priority: row.priority || 'Medium',
    status: row.status || 'Pending',
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapClientTaskToSupabase(task: any): any {
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
    due_date: task.dueDate || null,
    priority: task.priority || 'Medium',
    status: task.status || 'Pending',
    tags: Array.isArray(task.tags) ? task.tags : [],
  };
}

function mapSupabaseClientToClient(row: any): any {
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

function mapClientClientToSupabase(cli: any): any {
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
  };
}

function mapSupabaseDeadlineToClient(row: any): any {
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
    advocateId: row.advocate_id || undefined,
    presidingJudge: row.presiding_judge || '',
    completed: Boolean(row.completed),
    priority: row.priority || 'High',
  };
}

function mapClientDeadlineToSupabase(dl: any): any {
  return {
    id: String(dl.id),
    title: String(dl.title || ''),
    category: dl.category || 'Hearing',
    matter_id: dl.matterId ? String(dl.matterId) : null,
    matter_ref: dl.matterRef || null,
    matter_title: dl.matterTitle || null,
    court_location: dl.courtLocation || null,
    due_date: dl.dueDate || null,
    time: dl.time || null,
    advocate_name: String(dl.advocateName || ''),
    advocate_id: dl.advocateId ? String(dl.advocateId) : null,
    presiding_judge: dl.presidingJudge || null,
    completed: Boolean(dl.completed),
    priority: dl.priority || 'High',
  };
}
