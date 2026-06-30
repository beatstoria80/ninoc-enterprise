import { supabase } from './supabase';
import { Type, Tool } from '@google/genai';

export const aiToolsDeclaration: Tool = {
  functionDeclarations: [
    {
      name: 'get_order_details',
      description: 'Get details of an order, including status, shipping address, and tracking number. Use this when the user asks about their order status or when diagnosing a product issue.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          order_id: {
            type: Type.STRING,
            description: 'The order ID (e.g., NCO-1234567890)',
          },
        },
        required: ['order_id'],
      },
    },
    {
      name: 'escalate_to_human',
      description: 'Use this tool to escalate the issue to a human agent when the AI cannot confidently resolve it, or if the user requests human assistance. This updates the ticket status and alerts the human team.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          ticket_id: {
            type: Type.STRING,
            description: 'The support ticket ID',
          },
          reason: {
            type: Type.STRING,
            description: 'The reason for escalating to a human',
          },
        },
        required: ['ticket_id', 'reason'],
      },
    }
  ]
};

export async function executeAiTool(name: string, args: Record<string, any>) {
  if (name === 'get_order_details') {
    const { order_id } = args;
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total_amount, shipping_status, tracking_number, items, created_at')
      .eq('id', order_id)
      .single();
    
    if (error) {
      return { error: 'Order not found or invalid order ID.' };
    }
    return { success: true, order: data };
  }

  if (name === 'escalate_to_human') {
    const { ticket_id, reason } = args;
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: 'escalated' })
      .eq('id', ticket_id);

    if (error) {
      return { error: 'Failed to escalate ticket.' };
    }

    // Add a note
    await supabase.from('support_messages').insert({
      ticket_id,
      sender_id: null,
      sender_role: 'admin',
      message: `[SYSTEM] Ticket escalated to human agent. Reason: ${reason}`,
      is_auto_reply: true,
    });

    return { success: true, message: 'Ticket escalated.' };
  }

  return { error: `Unknown tool ${name}` };
}
