import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';



export async function GET(req: NextRequest) {
  try {
    // 1. Try to fetch from support_tickets table if column exists
    const { data: tickets, error } = await supabaseAdmin
      .from('support_tickets')
      .select('id, crm_status');
      
    if (!error && tickets) {
      const map: Record<string, string> = {};
      tickets.forEach((t: any) => { if (t.crm_status) map[t.id] = t.crm_status; });
      return NextResponse.json({ data: map });
    }
  } catch (e) {
    // Column might not exist yet, fallback to settings
  }

  // 2. Fallback to atelier_settings
  try {
    const { data: setting } = await supabaseAdmin
      .from('atelier_settings')
      .select('value')
      .eq('key', 'crm_ticket_statuses')
      .single();
    return NextResponse.json({ data: setting?.value || {} });
  } catch (err) {
    return NextResponse.json({ data: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, status } = body;

    if (!ticketId || !status) {
      return NextResponse.json({ error: 'ticketId and status are required' }, { status: 400 });
    }

    // 1. Try updating table column directly
    try {
      await supabaseAdmin
        .from('support_tickets')
        .update({ crm_status: status })
        .eq('id', ticketId);
    } catch (e) {
      // ignore if column does not exist
    }

    // 2. Always update atelier_settings as bulletproof persistent backup
    const { data: setting } = await supabaseAdmin
      .from('atelier_settings')
      .select('value')
      .eq('key', 'crm_ticket_statuses')
      .single();
      
    const currentMap = (setting?.value || {}) as Record<string, string>;
    currentMap[ticketId] = status;
    
    await supabaseAdmin
      .from('atelier_settings')
      .upsert({ 
        key: 'crm_ticket_statuses', 
        value: currentMap, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'key' });

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error('[api/admin/support/crm-status] POST error:', err);
    return NextResponse.json({ error: 'Failed to save CRM status' }, { status: 500 });
  }
}
