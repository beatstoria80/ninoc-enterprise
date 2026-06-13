import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get('ref');
  const orderNumber = searchParams.get('order_number');
  const phone = searchParams.get('phone');

  try {
    // 1. Handle Affiliate Tracking
    if (ref) {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('code', ref.toUpperCase())
        .single();

      if (affiliate) {
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
        await supabase.from('affiliate_clicks').insert({
          affiliate_id: affiliate.id,
          ip_address: ip
        });
      }
      
      // If ONLY ref is provided, return success
      if (!orderNumber) {
        return NextResponse.json({ success: true });
      }
    }

    // 2. Handle Order Tracking
    if (orderNumber && phone) {
      // Clean order number (remove # if user typed it)
      const cleanOrderNumber = orderNumber.replace(/^#/, '').trim();
      
      // Since order_number is an integer in DB, only query it if input is numeric
      const isNumeric = /^\d+$/.test(cleanOrderNumber);
      const orQuery = isNumeric 
        ? `order_number.eq.${cleanOrderNumber},id.eq.${cleanOrderNumber}`
        : `id.eq.${cleanOrderNumber}`;

      // Find order by order_number or id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          payment_status,
          total_price,
          courier,
          tracking_id,
          created_at,
          customer_name,
          shipping_address
        `)
        .or(orQuery)
        .single();

      if (orderError || !order) {
        console.error('Order query error:', orderError);
        return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
      }

      // Verify phone number (last 4 digits or exact match)
      const orderPhone = order.shipping_address?.phone?.replace(/\D/g, '') || '';
      const inputPhone = phone.replace(/\D/g, '');
      
      if (orderPhone !== inputPhone && !orderPhone.endsWith(inputPhone) && !inputPhone.endsWith(orderPhone)) {
        return NextResponse.json({ error: 'Nomor WhatsApp tidak cocok dengan pesanan ini' }, { status: 403 });
      }

      // Get items
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      // Get tracking logs
      const { data: logs } = await supabase
        .from('tracking_logs')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        success: true,
        order: {
          ...order,
          order_number: order.order_number || order.id // fallback
        },
        items: items || [],
        logs: logs || []
      });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
