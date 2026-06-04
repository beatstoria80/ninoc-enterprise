import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/returns — list returns (admin)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('order_returns')
      .select(`
        *,
        order:orders(
          id, total_price, created_at, status,
          customer:customer_profiles(full_name, phone),
          order_items(id, product_name, quantity, price_at_purchase)
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ returns: data || [] });
  } catch (err) {
    console.error('[api/returns] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/returns — create return request (consumer)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, user_id, type, reason, items } = body;

    if (!order_id || !user_id || !type || !reason || !items?.length) {
      return NextResponse.json({ error: 'order_id, user_id, type, reason, and items are required' }, { status: 400 });
    }

    if (!['refund', 'exchange'].includes(type)) {
      return NextResponse.json({ error: 'type must be refund or exchange' }, { status: 400 });
    }

    // Verify order belongs to user and is delivered
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, total_price, user_id')
      .eq('id', order_id)
      .eq('user_id', user_id)
      .eq('status', 'delivered')
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found or not eligible for return' }, { status: 404 });
    }

    // Create return request
    const { data: returnReq, error: returnError } = await supabaseAdmin
      .from('order_returns')
      .insert({
        order_id,
        user_id,
        type,
        status: 'requested',
        reason,
        refund_amount: type === 'refund' ? order.total_price : null,
      })
      .select()
      .single();

    if (returnError) throw returnError;

    // Insert return items
    const returnItems = items.map((item: { order_item_id: string; quantity: number; reason: string }) => ({
      return_id: returnReq.id,
      order_item_id: item.order_item_id,
      quantity: item.quantity,
      reason: item.reason,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('return_items')
      .insert(returnItems);

    if (itemsError) throw itemsError;

    return NextResponse.json({ return: returnReq }, { status: 201 });
  } catch (err) {
    console.error('[api/returns] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
