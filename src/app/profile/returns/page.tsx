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
    .from('order_returns')
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
      resolved_at
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const returnsData = (data || []) as ReturRequest[];

  return <ReturnsClient initialReturns={returnsData} userId={user.id} />;
}