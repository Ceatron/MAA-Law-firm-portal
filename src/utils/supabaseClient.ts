/**
 * Supabase Client Export & Configuration Bridge
 * Location: src/utils/supabaseClient.ts
 * 
 * Provides unified access to the Supabase client using environment variables:
 * - VITE_SUPABASE_URL (e.g., https://kbvtwmrpszmyznfhkagy.supabase.co)
 * - VITE_SUPABASE_ANON_KEY
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const getEnvVar = (name: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[name];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }
  return undefined;
};

export const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL') || '';
export const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY') || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('placeholder') &&
    !SUPABASE_ANON_KEY.includes('placeholder')
  );
};

let clientInstance: SupabaseClient<Database> | null = null;

export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  if (clientInstance) return clientInstance;

  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    clientInstance = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
    return clientInstance;
  } catch (err) {
    console.warn('[Supabase Client] Failed to initialize Supabase client:', err);
    return null;
  }
};

export const supabase: SupabaseClient<Database> | null = getSupabaseClient();
export default getSupabaseClient;
