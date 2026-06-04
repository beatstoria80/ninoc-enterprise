import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('order_number');
    const phone = searchParams.get('phone');

    if (!orderNumber || !phone) {
      return NextResponse.json({ error: 'order_number and phone are required' }, { status: 400 });
    }

    // Lookup order by order_number + phone (guest access — no auth required)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, total_price, courier, tracking_id, created_at, shipping_address, customer_name, customer_phone')
      .eq('order_number', orderNumber)
      .eq('customer_phone', phone)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found. Check your order number and phone number.' }, { status: 404 });
    }

    // Fetch order items
    const { data: items } = await supabase
      .from('order_items')
      .select('id, product_name, size, quantity, price_at_purchase')
      .eq('order_id', order.id);

    // Fetch tracking logs
    const { data: logs } = await supabase
      .from('tracking_logs')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ order, items: items || [], logs: logs || [] });

  } catch (err) {
    console.error('[api/track] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
