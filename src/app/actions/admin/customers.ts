'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  if (user.email?.toLowerCase() === 'admin@ninoc.store') {
    return await createAdminClient();
  }

  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('email', user.email?.toLowerCase() || '')
    .single();

  if (!roleData) throw new Error('Unauthorized');
  
  return await createAdminClient();
}

export async function fetchCustomersAction() {
  try {
    const supabase = await verifyAdmin();
    const { data: customerData, error } = await supabase
      .from('customer_profiles')
      .select('*')
      .order('customer_number', { ascending: true });
      
    if (error) throw error;
    const safeData = JSON.parse(JSON.stringify(customerData || []));
    return { success: true, data: safeData };
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
