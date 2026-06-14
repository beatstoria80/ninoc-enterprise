/**
 * WhatsApp Broadcast API
 * POST /api/whatsapp/broadcast
 *
 * Creates a broadcast campaign:
 * 1. Fetches recipients based on segment
 * 2. Creates a broadcast session
 * 3. Queues all messages into wa_broadcast_queue
 * Processing is done by the queue cron endpoint.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatPhoneNumber } from '@/lib/whatsapp';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ─── POST: Create a broadcast campaign ────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, segment, template_name, promo_text, recipient_ids } = body;

    // ─── Validate ────────────────────────────────────────────────────────
    if (!name || !segment) {
      return NextResponse.json({ error: 'Missing required fields: name, segment' }, { status: 400 });
    }

    const validSegments = ['all', 'has_order', 'new_customer', 'specific'];
    if (!validSegments.includes(segment)) {
      return NextResponse.json({ error: `Invalid segment. Must be one of: ${validSegments.join(', ')}` }, { status: 400 });
    }

    if (!promo_text || promo_text.trim().length === 0) {
      return NextResponse.json({ error: 'Missing promo_text message' }, { status: 400 });
    }

    if (promo_text.length > 1024) {
      return NextResponse.json({ error: 'promo_text exceeds maximum length (1024 characters)' }, { status: 400 });
    }

    // ─── Double Submission Check (Idempotency) ───
    const { data: recentSession } = await adminClient
      .from('wa_broadcast_sessions')
      .select('created_at')
      .eq('name', name)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentSession) {
      const diffSeconds = (new Date().getTime() - new Date(recentSession.created_at).getTime()) / 1000;
      if (diffSeconds < 60) {
        return NextResponse.json({ error: 'Campaign WA dengan nama ini baru saja dibuat. Harap tunggu 1 menit untuk menghindari pengiriman ganda.' }, { status: 429 });
      }
    }

    // ─── 1. Fetch recipients ─────────────────────────────────────────────
    let recipients: { id: string; name: string; phone: string }[] = [];

    if (segment === 'specific' && Array.isArray(recipient_ids) && recipient_ids.length > 0) {
      // Specific user IDs
      const { data } = await adminClient
        .from('user_profiles')
        .select('id, full_name, phone')
        .in('id', recipient_ids.slice(0, 1000)); // max 1000 per broadcast

      recipients = (data || [])
        .map(r => ({
          id: r.id,
          name: r.full_name || 'Pelanggan',
          phone: formatPhoneNumber(r.phone || ''),
        }))
        .filter(r => r.phone);

    } else if (segment === 'all') {
      const { data } = await adminClient
        .from('user_profiles')
        .select('id, full_name, phone')
        .not('phone', 'is', null)
        .neq('phone', '');

      recipients = (data || [])
        .map(r => ({
          id: r.id,
          name: r.full_name || 'Pelanggan',
          phone: formatPhoneNumber(r.phone || ''),
        }))
        .filter(r => r.phone);

    } else if (segment === 'has_order') {
      // Customers who have at least one order
      const { data } = await adminClient
        .from('orders')
        .select('user_id, shipping_address')
        .eq('status', 'delivered');

      // Deduplicate by user_id
      const seen = new Set<string>();
      const unique = (data || []).filter(o => {
        if (seen.has(o.user_id || '')) return false;
        seen.add(o.user_id || '');
        return true;
      });

      // Fetch profiles
      const userIds = [...seen].filter(Boolean);
      if (userIds.length > 0) {
        const { data: profiles } = await adminClient
          .from('user_profiles')
          .select('id, full_name, phone')
          .in('id', userIds);

        recipients = (profiles || [])
          .map(r => ({
            id: r.id,
            name: r.full_name || 'Pelanggan',
            phone: formatPhoneNumber(r.phone || ''),
          }))
          .filter(r => r.phone);
      }

    } else if (segment === 'new_customer') {
      // Customers who registered in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await adminClient
        .from('user_profiles')
        .select('id, full_name, phone')
        .not('phone', 'is', null)
        .neq('phone', '')
        .gte('created_at', thirtyDaysAgo.toISOString());

      recipients = (data || [])
        .map(r => ({
          id: r.id,
          name: r.full_name || 'Pelanggan',
          phone: formatPhoneNumber(r.phone || ''),
        }))
        .filter(r => r.phone);
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients found for this segment' }, { status: 400 });
    }

    // ─── 2. Create broadcast session ────────────────────────────────────
    const { data: session, error: sessionError } = await adminClient
      .from('wa_broadcast_sessions')
      .insert({
        name,
        segment,
        template_name: template_name || 'promo_broadcast',
        template_message: promo_text,
        total_recipients: recipients.length,
        status: 'queued',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error('[Broadcast API] Session create error:', sessionError);
      return NextResponse.json({ error: 'Failed to create broadcast session' }, { status: 500 });
    }

    // ─── 3. Queue all messages ──────────────────────────────────────────
    const queueItems = recipients.map(r => ({
      broadcast_id: session.id,
      phone: r.phone,
      customer_name: r.name,
      customer_id: r.id,
      template_name: template_name || 'promo_broadcast',
      message_preview: promo_text,
      status: 'pending' as const,
    }));

    // Batch insert in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < queueItems.length; i += chunkSize) {
      const chunk = queueItems.slice(i, i + chunkSize);
      await adminClient.from('wa_broadcast_queue').insert(chunk);
    }

    // ─── 4. Update session status ───────────────────────────────────────
    await adminClient
      .from('wa_broadcast_sessions')
      .update({ status: 'queued' })
      .eq('id', session.id);

    // ─── 5. Inject OPEX (Operational Expenses) ──────────────────────────
    const COST_PER_MSG = 450; // IDR
    const total_cost = recipients.length * COST_PER_MSG;
    
    if (total_cost > 0) {
      const { error: opexError } = await adminClient
        .from('operational_expenses')
        .insert({
          category: 'marketing',
          description: `WA Broadcast: ${name}`,
          amount: total_cost,
          expense_date: new Date().toISOString().slice(0, 10),
          created_by: 'System (WA API)'
        });
        
      if (opexError) {
        console.error('[Broadcast API] Failed to inject OPEX:', opexError);
      } else {
        console.log(`[Broadcast API] Injected Rp ${total_cost} to OPEX for campaign "${name}".`);
      }
    }

    console.log(`[Broadcast API] Campaign "${name}" created with ${recipients.length} recipients. Session ID: ${session.id}`);

    return NextResponse.json({
      success: true,
      broadcast_id: session.id,
      campaign_name: name,
      total_recipients: recipients.length,
      segment,
      status: 'queued',
    });

  } catch (err) {
    console.error('[Broadcast API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─── GET: List broadcast sessions ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');

  let query = adminClient
    .from('wa_broadcast_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: sessions, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }

  return NextResponse.json({ sessions: sessions || [] });
}
