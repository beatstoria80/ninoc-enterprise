import { NextResponse } from 'next/server';
import { coreApi } from '@/lib/midtrans';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const notificationJson = await req.json();

    // 1. Verify notification authenticity with Midtrans
    const statusResponse = await coreApi.transaction.notification(notificationJson);
    
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`Transaction notification received. Order ID: ${orderId}. Status: ${transactionStatus}. Fraud: ${fraudStatus}`);

    let orderUpdateStatus = '';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        orderUpdateStatus = 'pending';
      } else if (fraudStatus === 'accept') {
        orderUpdateStatus = 'paid';
      }
    } else if (transactionStatus === 'settlement') {
      orderUpdateStatus = 'paid';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      orderUpdateStatus = 'cancelled';
    } else if (transactionStatus === 'pending') {
      orderUpdateStatus = 'pending';
    }

    if (orderUpdateStatus) {
      // 2. Update order status in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ status: orderUpdateStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
      }

      // 3. Handle stock updates if paid
      if (orderUpdateStatus === 'paid') {
        // Logic to decrease stock would go here
        // Usually you fetch order_items and update products/variants stock
      }
    }

    return NextResponse.json({ status: 'OK' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
