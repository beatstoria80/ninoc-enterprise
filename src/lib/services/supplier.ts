import { cache } from 'react';
import { createClient } from '@/utils/supabase/server';

/**
 * Cached service to get the current supplier's identity.
 * This prevents N+1 queries across layouts and nested server components.
 */
export const getCurrentSupplier = cache(async () => {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }

  // Create an admin client to bypass the broken RLS infinite recursion on supplier_users
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: supplierUser, error } = await supabaseAdmin
    .from('supplier_users')
    .select('*, suppliers(name, status)')
    .eq('user_id', session.user.id)
    .limit(1)
    .single();

  if (!supplierUser || error) {
    console.error("getCurrentSupplier Error:", error);
    return null;
  }

  return {
    ...supplierUser,
    session,
  };
});
