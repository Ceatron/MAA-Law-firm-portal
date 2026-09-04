import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';

/**
 * Supabase Realtime Architecture Preparation
 * 
 * DESIGN:
 * This module prepares the client-side infrastructure for future live multi-device synchronization.
 * It remains INACTIVE by default during this phase so that existing localStorage workflows
 * continue without interruption.
 * 
 * Target Architecture:
 * React Application <-> Data Layer <-> Supabase Realtime <-> Authorised Users
 */

export type RealtimeTable =
  | 'matters'
  | 'tasks'
  | 'deadlines'
  | 'notifications'
  | 'client_interactions'
  | 'fee_notes'
  | 'notice_board';

export interface RealtimeSubscriptionOptions<T = any> {
  table: RealtimeTable;
  onInsert?: (record: T) => void;
  onUpdate?: (record: T) => void;
  onDelete?: (recordId: string) => void;
}

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to live table changes.
   * Gracefully returns null if Supabase is not configured or in offline/localStorage mode.
   */
  public subscribe<T = any>(options: RealtimeSubscriptionOptions<T>): (() => void) | null {
    const client = getSupabaseClient();
    if (!client) {
      // Inactive in localStorage mode - returns no-op cleanup
      return null;
    }

    const channelName = `realtime_${options.table}_${Date.now()}`;
    try {
      const channel = client
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: options.table,
          },
          (payload) => {
            if (payload.eventType === 'INSERT' && options.onInsert) {
              options.onInsert(payload.new as T);
            } else if (payload.eventType === 'UPDATE' && options.onUpdate) {
              options.onUpdate(payload.new as T);
            } else if (payload.eventType === 'DELETE' && options.onDelete) {
              options.onDelete(payload.old?.id);
            }
          }
        )
        .subscribe();

      this.channels.set(channelName, channel);

      return () => {
        channel.unsubscribe();
        this.channels.delete(channelName);
      };
    } catch (err) {
      console.warn(`[Realtime Architecture] Failed to subscribe to ${options.table}:`, err);
      return null;
    }
  }

  /**
   * Unsubscribes from all active realtime channels.
   */
  public unsubscribeAll(): void {
    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels.clear();
  }
}

export const realtimeManager = new RealtimeManager();
