import { supabase } from './supabase';

export const aiToolsDeclaration = [
  {
    type: 'function',
    function: {
      name: 'get_order_details',
      description: 'Dapatkan detail pesanan berdasarkan ID pesanan (misal: NINOC-1782791806880 atau ID Invoice). Gunakan ini saat pelanggan menanyakan status pesanan, resi, atau kendala pengiriman.',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'ID Pesanan / Invoice ID (contoh: NINOC-1782791806880)',
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
      description: 'Cari produk dan varian (ukuran/size seperti S, M, L, XL, XXL atau warna) di database. Gunakan ini saat pelanggan menanyakan ketersediaan produk, harga, ukuran yang ready, atau warna. Hasil akan mengembalikan daftar produk beserta field "variants" (berisi ukuran, warna, stock) dan "slug" untuk link https://ninoc.store/shop/[slug]',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: 'Kata kunci pencarian (contoh: Kaos, XL, hitam, L, baru, promo). Jika menanyakan ukuran tertentu, masukkan ukuran tersebut (misal: "XL" atau "L").',
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
    const kw = (keyword || '').toLowerCase().trim();
    const selectFields = 'id, name, price, description, category, slug, variants(color, size, stock, sku)';
    
    if (kw.includes('baru') || kw.includes('new') || kw.includes('terbaru') || kw === '' || kw.includes('promo') || kw.includes('diskon') || kw.includes('discount')) {
      const { data, error } = await supabase.from('products').select(selectFields).order('created_at', { ascending: false }).limit(5);
      if (error || !data || data.length === 0) {
        return { error: 'Tidak ditemukan produk di database.' };
      }
      return { success: true, products: data };
    }

    // Clean keyword (remove filler words so sizes/colors stand out)
    const cleanKw = kw.replace(/ukuran|size|ada|ready|kaos|baju|celana|apakah|gak|ga|gk|enggak|nggak|disini|di sini/gi, '').trim() || kw;
    
    // 1. Check if keyword matches a variant attribute in variants table (color, size, sku)
    const { data: varData } = await supabase
      .from('variants')
      .select('product_id')
      .or(`size.ilike.%${cleanKw}%,size.ilike.%${kw}%,color.ilike.%${cleanKw}%,color.ilike.%${kw}%,sku.ilike.%${kw}%`)
      .limit(20);
    
    const variantProductIds = Array.from(new Set(varData?.map(v => v.product_id).filter(Boolean) || []));
    
    let productsQuery = supabase.from('products').select(selectFields);
    if (variantProductIds.length > 0) {
      productsQuery = productsQuery.or(`id.in.(${variantProductIds.join(',')}),name.ilike.%${kw}%,description.ilike.%${kw}%,category.ilike.%${kw}%`).limit(10);
    } else {
      productsQuery = productsQuery.or(`name.ilike.%${kw}%,description.ilike.%${kw}%,category.ilike.%${kw}%,name.ilike.%${cleanKw}%,description.ilike.%${cleanKw}%`).limit(10);
    }

    const { data, error } = await productsQuery;
    
    if (error || !data || data.length === 0) {
      // Fallback: If literal match fails, return newest products with ALL their sizes/variants so AI can check and answer accurately!
      const { data: fallbackData } = await supabase.from('products').select(selectFields).order('created_at', { ascending: false }).limit(5);
      if (fallbackData && fallbackData.length > 0) {
        return { 
          success: true, 
          note: `Pencarian kata kunci "${kw}" tidak menemukan kecocokan nama produk langsung. Berikut adalah daftar produk terbaru beserta SELURUH varian (ukuran/size, warna, stock) yang tersedia di gudang untuk diperiksa dan direkomendasikan kepada customer:`,
          products: fallbackData 
        };
      }
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
