import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import OrdersClient, { Order, OrderItem, TrackingLog } from './OrdersClient';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  if (!id) {
    redirect('/profile');
  }

  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    redirect('/login');
  }

  // 1. Fetch Order Header
  const { data: orderData } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', authUser.id)
    .single();

  if (!orderData) {
    redirect('/profile');
  }

  // 2. Fetch Order Items
  const { data: itemData } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id);

  // 3. Fetch Tracking Logs
  const { data: logData } = await supabase
    .from('tracking_logs')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: false });

  // 4. Check for existing return request
  const { data: returnData } = await supabase
    .from('retur_requests')
    .select('id, status')
    .eq('order_id', id)
    .eq('user_id', authUser.id)
    .single();

  return (
    <OrdersClient 
      userId={authUser.id}
      initialOrder={orderData as Order}
      initialItems={(itemData || []) as OrderItem[]}
      initialLogs={(logData || []) as TrackingLog[]}
      initialReturnRequest={returnData}
    />
  );
}
