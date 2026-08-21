'use server';

import { createClient } from '@/utils/supabase/server';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  if (user.email === 'admin@ninoc.store') return supabase;

  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (!roleData) throw new Error('Unauthorized');
  
  return supabase;
}

export async function fetchCustomersAction() {
  try {
    const supabase = await verifyAdmin();
    const { data: customerData, error } = await supabase
      .from('customer_profiles')
      .select('*')
      .order('customer_number', { ascending: true });
      
    if (error) throw error;
    return { success: true, data: customerData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function fetchPendingReturnsCountAction() {
  try {
    const supabase = await verifyAdmin();
    const { count, error } = await supabase
      .from('retur_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'reviewed']);
      
    if (error) throw error;
    return { success: true, count: count || 0 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
