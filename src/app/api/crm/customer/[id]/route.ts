import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user profile
    const { data: userProfile } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    // Get activity log
    const { data: activities } = await adminClient
      .from('customer_activity_log')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get support tickets
    const { data: tickets } = await adminClient
      .from('support_tickets')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    // Get retur requests
    const { data: returs } = await adminClient
      .from('retur_requests')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    // Get orders (if orders table exists)
    let orders: unknown[] = [];
    try {
      const { data } = await adminClient
        .from('orders')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(20);
      orders = data || [];
    } catch {
      // orders table might not exist or not have user_id column
    }

    // Calculate summary stats
    const totalTickets = tickets?.length || 0;
    const totalReturs = returs?.length || 0;
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved').length || 0;

    return NextResponse.json({
      user: userProfile,
      summary: {
        totalTickets,
        resolvedTickets,
        resolutionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
        totalReturs,
      },
      activities,
      tickets,
      returs,
      orders,
    });
  } catch (err) {
    console.error('[GET /api/crm/customer/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch customer data' }, { status: 500 });
  }
}