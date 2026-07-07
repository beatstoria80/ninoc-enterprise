import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const metaMap: Record<string, any> = {};

    // 1. Fetch old crm_ticket_statuses fallback first
    try {
      const { data: oldSetting } = await supabaseAdmin
        .from('atelier_settings')
        .select('value')
        .eq('key', 'crm_ticket_statuses')
        .single();
      if (oldSetting?.value) {
        Object.entries(oldSetting.value).forEach(([id, status]) => {
          metaMap[id] = { crm_status: status, priority: 'medium', is_taken_over: false, assigned_admin: null };
        });
      }
    } catch (e) {
      // ignore
    }

    // 2. Fetch new crm_ticket_metadata from atelier_settings
    try {
      const { data: setting } = await supabaseAdmin
        .from('atelier_settings')
        .select('value')
        .eq('key', 'crm_ticket_metadata')
        .single();
      if (setting?.value) {
        Object.entries(setting.value).forEach(([id, meta]) => {
          metaMap[id] = { ...(metaMap[id] || {}), ...(meta as object) };
        });
      }
    } catch (e) {
      // ignore
    }

    // 3. Try to fetch from support_tickets table directly if columns exist
    try {
      const { data: tickets, error } = await supabaseAdmin
        .from('support_tickets')
        .select('*');
      if (!error && tickets) {
        tickets.forEach((t: any) => {
          metaMap[t.id] = {
            crm_status: t.crm_status || metaMap[t.id]?.crm_status || 'general',
            priority: t.priority || metaMap[t.id]?.priority || 'medium',
            assigned_admin: t.assigned_admin || metaMap[t.id]?.assigned_admin || null,
            is_taken_over: t.is_taken_over ?? (metaMap[t.id]?.is_taken_over || false),
          };
        });
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ data: metaMap });
  } catch (err) {
    console.error('[api/admin/support/ticket-meta] GET error:', err);
    return NextResponse.json({ data: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, crm_status, priority, assigned_admin, is_taken_over, sendTakeoverMessage, adminName } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId is required' }, { status: 400 });
    }

    // 1. Fetch current metadata map from atelier_settings
    let currentMap: Record<string, any> = {};
    try {
      const { data: setting } = await supabaseAdmin
        .from('atelier_settings')
        .select('value')
        .eq('key', 'crm_ticket_metadata')
        .single();
      if (setting?.value) currentMap = setting.value;
    } catch (e) {
      // ignore
    }

    const currentMeta = currentMap[ticketId] || { crm_status: 'general', priority: 'medium', assigned_admin: null, is_taken_over: false };
    const updatedMeta = {
      ...currentMeta,
      ...(crm_status !== undefined && { crm_status }),
      ...(priority !== undefined && { priority }),
      ...(assigned_admin !== undefined && { assigned_admin }),
      ...(is_taken_over !== undefined && { is_taken_over }),
      updated_at: new Date().toISOString()
    };

    currentMap[ticketId] = updatedMeta;

    // 2. Save to atelier_settings
    await supabaseAdmin
      .from('atelier_settings')
      .upsert({
        key: 'crm_ticket_metadata',
        value: currentMap,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    // 3. Try to update columns on support_tickets table directly if they exist
    try {
      const updatePayload: any = {};
      if (crm_status !== undefined) updatePayload.crm_status = crm_status;
      if (priority !== undefined) updatePayload.priority = priority;
      if (assigned_admin !== undefined) updatePayload.assigned_admin = assigned_admin;
      if (is_taken_over !== undefined) updatePayload.is_taken_over = is_taken_over;

      if (Object.keys(updatePayload).length > 0) {
        await supabaseAdmin
          .from('support_tickets')
          .update(updatePayload)
          .eq('id', ticketId);
      }
    } catch (e) {
      // ignore if columns don't exist
    }

    // 4. Send takeover greeting message if requested
    if (sendTakeoverMessage && adminName) {
      const femaleTitles: Record<string, string> = {
        'Gita': 'Senior Customer Success Specialist',
        'Alpin': 'VIP Lead Relationship Specialist',
        'Nadia': 'Logistics & Care Coordinator',
        'Siti': 'Order & Billing Advisor',
        'Amanda': 'Product & Styling Advisor',
      };
      const roleTitle = femaleTitles[adminName] || 'Customer Care Specialist';
      const greeting = `🌸 Halo kak! Percakapan ini telah diambil alih dari layanan AI Otomatis dan sekarang akan dilanjutkan secara langsung oleh Admin **${adminName}** (${roleTitle} NINOC).\n\nAda yang bisa ${adminName} bantu periksa atau bantu selesaikan untuk pesanan atau konsultasi produk kakak hari ini? 😊`;

      await supabaseAdmin
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: '00000000-0000-0000-0000-000000000000',
          sender_role: 'admin',
          message: greeting,
          is_read: false,
          is_auto_reply: false
        });
    }

    return NextResponse.json({ success: true, meta: updatedMeta });
  } catch (err) {
    console.error('[api/admin/support/ticket-meta] POST error:', err);
    return NextResponse.json({ error: 'Failed to update ticket metadata' }, { status: 500 });
  }
}
