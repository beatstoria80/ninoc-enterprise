import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: NextRequest) {
  try {
    // Delete all support messages first due to foreign key constraints
    const { error: msgErr } = await supabaseAdmin
      .from('support_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (msgErr) console.error('[purge] error deleting support_messages:', msgErr);

    // Delete all support tickets
    const { error: tktErr } = await supabaseAdmin
      .from('support_tickets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
      
    if (tktErr) console.error('[purge] error deleting support_tickets:', tktErr);

    // Also clear CRM status mappings in atelier_settings if needed
    await supabaseAdmin
      .from('atelier_settings')
      .upsert({ key: 'crm_ticket_statuses', value: {}, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    return NextResponse.json({ success: true, message: 'All chat conversations purged successfully.' });
  } catch (err) {
    console.error('[api/admin/support/purge] DELETE error:', err);
    return NextResponse.json({ error: 'Failed to purge chats' }, { status: 500 });
  }
}
