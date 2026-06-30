import { supabase } from './supabase';

export const aiToolsDeclaration = [
  {
    type: 'function',
    function: {
      name: 'get_order_details',
      description: 'Dapatkan detail pesanan berdasarkan ID pesanan (misal: NCO-123456). Gunakan ini saat pelanggan menanyakan status pesanan, resi, atau kendala pengiriman.',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'ID Pesanan (contoh: NCO-123456)',
          },
        },
        required: ['order_id'],
      },
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Cari produk di database berdasarkan kata kunci nama produk. Gunakan ini saat pelanggan menanyakan ketersediaan produk, harga, atau detail produk tertentu.',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: 'Kata kunci pencarian nama produk (contoh: Kaos, Worn Not Born, dll)',
          },
        },
        required: ['keyword'],
      },
    }
  },
  {
    type: 'function',
    function: {
      name: 'escalate_to_human',
      description: 'Gunakan ini jika AI tidak bisa menjawab, informasi terlalu kompleks, butuh campur tangan manusia (misal: refund, komplain keras), atau customer meminta admin manusia.',
      parameters: {
        type: 'object',
        properties: {
          ticket_id: {
            type: 'string',
            description: 'ID tiket support',
          },
          reason: {
            type: 'string',
            description: 'Alasan eskalasi ke manusia',
          },
        },
        required: ['ticket_id', 'reason'],
      },
    }
  }
];

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

  if (name === 'search_products') {
    const { keyword } = args;
    const { data, error } = await supabase
      .from('products')
      .select('name, price, stock, description, colors')
      .ilike('name', `%${keyword}%`)
      .limit(5);
    
    if (error || !data || data.length === 0) {
      return { error: 'Tidak ditemukan produk dengan kata kunci tersebut.' };
    }
    return { success: true, products: data };
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

    // Add an internal system note
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
