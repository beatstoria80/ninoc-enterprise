import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');
    const orderId = searchParams.get('order_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = adminClient
      .from('retur_requests')
      .select('*, user:user_id(id, email, raw_user_meta_data)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (orderId) {
      query = query.ilike('order_id', `%${orderId}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ retur_requests: data, total: count });
  } catch (err) {
    console.error('[GET /api/retur]', err);
    return NextResponse.json({ error: 'Failed to fetch retur requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      reason,
      reason_label,
      description,
      video_url,
      video_duration_seconds,
      video_filename,
      ticket_id,
    } = body;

    if (!order_id || !reason || !reason_label) {
      return NextResponse.json({ error: 'order_id, reason, and reason_label are required' }, { status: 400 });
    }

    // Get current user (guest or authenticated)
    const { data: { user } } = await supabase.auth.getUser();

    // Fraud detection: flag if video duration < 10 seconds
    const fraudSuspected = video_duration_seconds && video_duration_seconds < 10;

    const { data, error } = await adminClient
      .from('retur_requests')
      .insert({
        user_id: user?.id || null,
        order_id,
        reason,
        reason_label,
        description,
        video_url,
        video_duration_seconds,
        video_filename,
        ticket_id,
        status: 'pending',
        fraud_suspected: fraudSuspected,
        fraud_reasons: fraudSuspected ? ['Video duration less than 10 seconds'] : [],
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (user?.id) {
      await adminClient.from('customer_activity_log').insert({
        user_id: user.id,
        activity_type: 'retur_submitted',
        description: `Retur diajukan untuk order ${order_id}`,
        metadata: { retur_id: data.id, order_id, reason },
      });
    }

    return NextResponse.json({ retur_request: data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/retur]', err);
    return NextResponse.json({ error: 'Failed to create retur request' }, { status: 500 });
  }
}