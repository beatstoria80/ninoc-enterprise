import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Uses @supabase/ssr createBrowserClient to read/write auth tokens from cookies
// (not localStorage). This ensures session parity with middleware and login flow.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
