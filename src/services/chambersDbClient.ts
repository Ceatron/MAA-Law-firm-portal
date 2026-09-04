/**
 * Client-Side API Connector for Central Chambers Database
 * Connects frontend state directly with the centralized server database & Supabase.
 */

export interface DbStatusResponse {
  status: string;
  provider: string;
  supabaseConfigured: boolean;
  lastUpdated: string;
  recordCounts: Record<string, number>;
}

export async function fetchDbStatus(): Promise<DbStatusResponse | null> {
  try {
    const res = await fetch('/api/db/status');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[DB Client] Status check failed:', err);
    return null;
  }
}

export async function fetchAllDbData(): Promise<any | null> {
  try {
    const res = await fetch('/api/db/all');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[DB Client] Fetch all collections failed:', err);
    return null;
  }
}

export async function saveRecordToDb(collection: string, record: any): Promise<boolean> {
  try {
    const res = await fetch('/api/db/save-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, record }),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[DB Client] Failed to save record to ${collection}:`, err);
    return false;
  }
}

export async function deleteRecordFromDb(collection: string, id: string): Promise<boolean> {
  try {
    const res = await fetch('/api/db/delete-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, id }),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[DB Client] Failed to delete record from ${collection}:`, err);
    return false;
  }
}

export async function syncStateWithDb(data: Record<string, any[]>): Promise<any | null> {
  try {
    const res = await fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('[DB Client] Sync failed:', err);
    return null;
  }
}
