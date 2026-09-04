'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { OrderStatus } from '@/components/admin/types';

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

export async function fetchOrdersAction(limit = 100) {
  try {
    const supabase = await verifyAdmin();
    const { data: orderData, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    const safeData = JSON.parse(JSON.stringify(orderData || []));
    return { success: true, data: safeData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  try {
    const supabase = await verifyAdmin();
    // Shipped status uses WA API in client component, so we just update DB here
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
      
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTrackingIdAction(orderId: string, trackingId: string) {
  try {
    const supabase = await verifyAdmin();
    const { error } = await supabase
      .from('orders')
      .update({ tracking_id: trackingId, updated_at: new Date().toISOString() })
      .eq('id', orderId);
      
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
