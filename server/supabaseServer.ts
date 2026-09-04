/**
 * Server-Side Supabase Client (Node.js / Express context only)
 * 
 * SECURITY DIRECTIVE:
 * This module is STRICTLY for server-side use. It accesses process.env.SUPABASE_SERVICE_ROLE_KEY.
 * It is NEVER bundled or exposed to the client-side browser.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverSupabaseClient: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient | null {
  if (serverSupabaseClient) {
    return serverSupabaseClient;
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  try {
    serverSupabaseClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return serverSupabaseClient;
  } catch (err) {
    console.error('[Server Supabase] Failed to initialize server client:', err);
    return null;
  }
}
