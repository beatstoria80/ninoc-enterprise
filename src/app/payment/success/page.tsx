import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import SuccessContent from './SuccessContent';

interface Props {
  searchParams: Promise<{ order_id?: string; order_number?: string; courier?: string }>;
}

async function fetchOrder(orderId?: string, orderNumber?: string) {
  const selectFields = '*, order_items(*)';
  if (orderId) {
    const { data } = await supabase
      .from('orders')
      .select(selectFields)
      .eq('id', orderId)
      .single();
    return data;
  }
  if (orderNumber) {
    const { data } = await supabase
      .from('orders')
      .select(selectFields)
      .eq('order_number', orderNumber)
      .single();
    return data;
  }
  return null;
}

export default async function SuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderId = params.order_id;
  const orderNumber = params.order_number;
  const courierName = params.courier || 'Standard Shipping';

  const order = await fetchOrder(orderId, orderNumber);
  const isValid = order && (order.status === 'paid' || order.status === 'pending');

  return (
    <Suspense fallback={
      <main className="min-h-screen bg-cr flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rose/20 border-t-rose rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs md:text-[10px] text-ink/50 uppercase tracking-widest">Loading...</p>
        </div>
      </main>
    }>
      <SuccessContent order={isValid ? order : null} courierName={courierName} isInvalid={!isValid} />
    </Suspense>
  );
}