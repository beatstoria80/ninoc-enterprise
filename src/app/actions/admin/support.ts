'use server';

import { createClient } from '@/utils/supabase/server';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  if (user.email === 'admin@ninoc.store') return { supabase, user };

  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (!roleData) throw new Error('Unauthorized');
  
  return { supabase, user };
}

export async function fetchSupportTicketsAction() {
  try {
    const { supabase } = await verifyAdmin();
    
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (ticketsError) throw ticketsError;
    
    if (!ticketsData || ticketsData.length === 0) {
      return { success: true, data: [] };
    }

    const ticketIds = ticketsData.map((t: any) => t.id);
    const { data: allMessages, error: msgError } = await supabase
      .from('support_messages')
      .select('*')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    return { success: true, tickets: ticketsData, messages: allMessages };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markSupportMessagesReadAction(ticketId: string) {
  try {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('ticket_id', ticketId)
      .eq('sender_role', 'customer');
      
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendSupportMessageAction(ticketId: string, message: string) {
  try {
    const { supabase, user } = await verifyAdmin();
    
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_role: 'admin',
        message: message,
        is_read: false
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Update ticket status to answered
    await supabase
      .from('support_tickets')
      .update({ status: 'answered', updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
