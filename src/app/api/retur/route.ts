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
      user_id: body_user_id,
    } = body;

    if (!order_id || !reason || !reason_label) {
      return NextResponse.json({ error: 'order_id, reason, and reason_label are required' }, { status: 400 });
    }

    if (!video_url) {
      return NextResponse.json({ error: 'Bukti video WAJIB — upload video sebelum提交 retur' }, { status: 400 });
    }

    // Get current user (guest or authenticated)
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id || body_user_id || null;

    // Duplicate check:不许 duplicate retur for same order in pending/reviewed state
    if (uid) {
      const { data: existing } = await adminClient
        .from('retur_requests')
        .select('id, status')
        .eq('order_id', order_id)
        .eq('user_id', uid)
        .in('status', ['pending', 'reviewed'])
        .maybeSingle();
      if (existing) {
        return NextResponse.json({
          error: `Pengajuan retur untuk order ini sudah ada (status: ${existing.status}). Gunakan tiket yang sudah ada.`
        }, { status: 409 });
      }
    }

    // Fraud detection: flag if video duration < 30 seconds
    const fraudSuspected = video_duration_seconds && video_duration_seconds < 30;
    const fraudReasons: string[] = [];
    if (fraudSuspected) fraudReasons.push('Durasi video kurang dari 30 detik — kurang dari minimum yang diizinkan (1-shot, 30 detik)');

    const { data, error } = await adminClient
      .from('retur_requests')
      .insert({
        user_id: uid,
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
        fraud_reasons: fraudReasons,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (uid) {
      await adminClient.from('customer_activity_log').insert({
        user_id: uid,
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