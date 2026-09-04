import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

/**
 * Supabase Client Factory for Muthoni Ahago Advocates Web Portal
 * 
 * SECURITY DIRECTIVES:
 * 1. ONLY uses the public anonymous key (VITE_SUPABASE_ANON_KEY).
 * 2. NEVER exposes or stores the Supabase service-role key in browser code.
 * 3. Lazy initialized - does NOT crash or halt the portal if environment variables are unset.
 * 4. Existing localStorage operations remain 100% active and untouched during this phase.
 */

let supabaseInstance: SupabaseClient<Database> | null = null;
let hasLoggedConfigNotice = false;

const getEnvVar = (name: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[name];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }
  return undefined;
};

export const isSupabaseConfigured = (): boolean => {
  const url = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
  const key = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');
  return Boolean(url && key && url.trim().length > 0 && key.trim().length > 0);
};

export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!hasLoggedConfigNotice) {
      console.info(
        '[Supabase Foundation] Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set. ' +
        'The portal is operating in localStorage mode. Data preservation is active.'
      );
      hasLoggedConfigNotice = true;
    }
    return null;
  }

  try {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    return supabaseInstance;
  } catch (err) {
    console.warn('[Supabase Foundation] Failed to initialize Supabase client:', err);
    return null;
  }
};

/**
 * Lightweight connection test for System Administrators.
 * Strictly read-only; does NOT write, mutate, or migrate any data.
 */
export const testSupabaseConnection = async (): Promise<{
  connected: boolean;
  message: string;
  latencyMs?: number;
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase credentials (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are not configured in environment variables.',
    };
  }

  const startTime = Date.now();
  try {
    // Perform a non-destructive query to verify connection
    const { error } = await client.from('staff_users').select('id').limit(1);
    const latencyMs = Date.now() - startTime;

    if (error) {
      // If table doesn't exist yet, it's still reachable but schema pending
      if (error.code === '42P01') {
        return {
          connected: true,
          message: `Connected to Supabase endpoint (${latencyMs}ms), but database schema migrations have not been applied yet.`,
          latencyMs,
        };
      }
      return {
        connected: false,
        message: `Supabase responded with code ${error.code}: ${error.message}`,
        latencyMs,
      };
    }

    return {
      connected: true,
      message: `Successfully connected to Supabase PostgreSQL (${latencyMs}ms). Ready for future verified migrations.`,
      latencyMs,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Network or connection failure: ${err?.message || 'Unknown error'}`,
    };
  }
};
