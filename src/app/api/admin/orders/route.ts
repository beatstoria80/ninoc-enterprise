/**
 * GET /api/admin/orders
 * Returns orders from Supabase for test order selection in Biteship Activation form.
 * Query params:
 *   status: 'delivered' | 'cancelled' | 'all'
 *   limit: number (default 20)
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let query = supabase
      .from('orders')
      .select('id, order_number, status, tracking_id, courier, created_at, total_price, customer_name')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status === 'delivered') {
      query = query.eq('status', 'delivered');
    } else if (status === 'cancelled') {
      query = query.eq('status', 'cancelled');
    }

    const { data, error } = await query;

    if (error) {
      console.error('[api/admin/orders] fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      orders: data || [],
      count: data?.length || 0,
      status_filter: status,
    });

  } catch (err) {
    console.error('[api/admin/orders] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}