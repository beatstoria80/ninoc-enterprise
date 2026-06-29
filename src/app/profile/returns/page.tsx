import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ReturnsClient, { ReturRequest } from './ReturnsClient';

export default async function ReturnsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('retur_requests')
    .select(`
      id,
      order_id,
      reason,
      reason_label,
      description,
      video_url,
      video_duration_seconds,
      status,
      fraud_suspected,
      fraud_reasons,
      admin_notes,
      refund_amount,
      refund_method,
      created_at,
      updated_at,
      resolved_at,
      return_awb,
      return_courier,
      return_shipped_at
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const returnsData = (data || []) as any[];

  // Fetch refund_bank_details for these orders
  const orderIds = returnsData.map(r => r.order_id);
  let ordersData: any[] = [];
  if (orderIds.length > 0) {
    const { data: orders } = await supabase
      .from('orders')
      .select('id, refund_bank_details')
      .in('id', orderIds);
    ordersData = orders || [];
  }

  // Merge the data
  const mergedReturns = returnsData.map(ret => {
    const matchedOrder = ordersData.find(o => o.id === ret.order_id);
    return {
      ...ret,
      order: matchedOrder ? { refund_bank_details: matchedOrder.refund_bank_details } : undefined
    };
  }) as ReturRequest[];

  return <ReturnsClient initialReturns={mergedReturns} userId={user.id} />;
}