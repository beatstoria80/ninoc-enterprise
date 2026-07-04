import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// NINOC ENTERPRISE — SERVERLESS SINGLETON SUPABASE ADMIN CLIENT
// ============================================================================
// In serverless / edge environments (Next.js App Router on Vercel), creating
// new Supabase client instances on every route invocation causes memory bloat,
// cold-start latency spikes, and risks database connection pool exhaustion.
//
// This module implements a thread-safe singleton pattern using Node's globalThis
// caching to ensure a single Supabase Admin client instance is reused across
// all server-side API routes and cron jobs.
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface CustomGlobal extends Global {
  _supabaseAdminInstance?: SupabaseClient;
}

const globalForSupabase = globalThis as unknown as CustomGlobal;

/**
 * Returns a singleton instance of the Supabase Admin client with service_role privileges.
 * WARNING: Never import or use this client in client-side React components!
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      '[SupabaseAdmin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Database operations will fail.'
    );
  }

  if (!globalForSupabase._supabaseAdminInstance) {
    globalForSupabase._supabaseAdminInstance = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        db: {
          schema: 'public',
        },
      }
    );
  }

  return globalForSupabase._supabaseAdminInstance;
}

// Export singleton instance directly for seamless drop-in replacement across routes
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
