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

  const { data: supplierUser } = await supabase
    .from('supplier_users')
    .select('*, suppliers(name, status)')
    .eq('user_id', session.user.id)
    .single();

  if (!supplierUser) {
    return null;
  }

  return {
    ...supplierUser,
    session,
  };
});
