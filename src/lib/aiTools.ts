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
      description: 'Cari dan urutkan produk di katalog toko (termasuk cek ukuran/size S, M, L, XL, XXL, warna, stok, harga termurah, termahal, promo, dan filter budget/harga). Gunakan selalu tool ini saat customer bertanya seputar produk, harga, diskon, atau rekomendasi.',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: 'Kata kunci nama produk, ukuran (misal: "XL", "L"), warna ("hitam", "putih"), atau kategori ("kaos", "celana", "hoodie", "jaket", "totebag").',
          },
          sort_by: {
            type: 'string',
            enum: ['newest', 'cheapest', 'most_expensive', 'popular'],
            description: 'Urutan produk: "cheapest" (termurah/paling murah), "most_expensive" (termahal/paling mahal), "newest" (terbaru/new arrival), "popular" (terlaris/best seller/rekomendasi).',
          },
          min_price: {
            type: 'number',
            description: 'Harga minimal (misal: 100000 jika customer mencari harga di atas 100rb).',
          },
          max_price: {
            type: 'number',
            description: 'Harga maksimal/budget (misal: 150000 jika customer mencari harga di bawah 150rb atau budget 150rb).',
          },
          category: {
            type: 'string',
            description: 'Filter kategori spesifik jika disebutkan (contoh: "pakaian", "aksesoris", "utilities", "kaos", "celana", "hoodie", "outer", "jacket").',
          },
        },
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
    const { keyword, sort_by, min_price, max_price, category } = args;
    const kw = (keyword || '').toLowerCase().trim();
    const selectFields = 'id, name, price, description, category, slug, variants(color, size, stock, sku)';
    
    let productsQuery = supabase.from('products').select(selectFields);

    // Filter by category if provided
    if (category && typeof category === 'string' && category.trim() !== '') {
      const cat = category.toLowerCase().trim();
      productsQuery = productsQuery.or(`category.ilike.%${cat}%,name.ilike.%${cat}%,description.ilike.%${cat}%`);
    }

    // Filter by min/max price (e.g. budget under 150rb or cheapest above 100rb)
    if (min_price && typeof min_price === 'number' && !isNaN(min_price)) {
      productsQuery = productsQuery.gte('price', min_price);
    }
    if (max_price && typeof max_price === 'number' && !isNaN(max_price)) {
      productsQuery = productsQuery.lte('price', max_price);
    }

    // Handle sort_by
    let isSorted = false;
    if (sort_by === 'cheapest' || kw.includes('termurah') || kw.includes('paling murah') || kw === 'murah') {
      productsQuery = productsQuery.order('price', { ascending: true });
      isSorted = true;
    } else if (sort_by === 'most_expensive' || kw.includes('termahal') || kw.includes('paling mahal') || kw === 'mahal') {
      productsQuery = productsQuery.order('price', { ascending: false });
      isSorted = true;
    } else if (sort_by === 'newest' || kw.includes('terbaru') || kw.includes('new arrival') || kw.includes('baru') || kw === '') {
      productsQuery = productsQuery.order('created_at', { ascending: false });
      isSorted = true;
    } else if (sort_by === 'popular' || kw.includes('terlaris') || kw.includes('best seller') || kw.includes('paling laris') || kw.includes('rekomendasi') || kw.includes('favorit')) {
      productsQuery = productsQuery.order('created_at', { ascending: false });
      isSorted = true;
    }

    // If there is a keyword and it's not just generic sort/promo words
    const isGenericWord = ['baru', 'new', 'terbaru', 'promo', 'diskon', 'discount', 'sale', 'murah', 'termurah', 'mahal', 'termahal', 'best seller', 'terlaris', 'rekomendasi', 'paling murah', 'paling mahal', 'paling laris', 'budget', 'semua', 'all', 'produk', 'barang', 'baju'].some(w => kw === w || kw.includes(w));
    
    if (kw && !isGenericWord) {
      // Clean keyword (remove filler words so sizes/colors stand out)
      const cleanKw = kw.replace(/ukuran|size|ada|ready|kaos|baju|celana|apakah|gak|ga|gk|enggak|nggak|disini|di sini|harga|termurah|termahal|murah|mahal|di bawah|di atas|budget|paling/gi, '').trim() || kw;
      
      // 1. Check if keyword matches a variant attribute in variants table (color, size, sku)
      const { data: varData } = await supabase
        .from('variants')
        .select('product_id')
        .or(`size.ilike.%${cleanKw}%,size.ilike.%${kw}%,color.ilike.%${cleanKw}%,color.ilike.%${kw}%,sku.ilike.%${kw}%`)
        .limit(20);
      
      const variantProductIds = Array.from(new Set(varData?.map(v => v.product_id).filter(Boolean) || []));
      
      if (variantProductIds.length > 0) {
        productsQuery = productsQuery.or(`id.in.(${variantProductIds.join(',')}),name.ilike.%${kw}%,description.ilike.%${kw}%,category.ilike.%${kw}%`);
      } else {
        productsQuery = productsQuery.or(`name.ilike.%${kw}%,description.ilike.%${kw}%,category.ilike.%${kw}%,name.ilike.%${cleanKw}%,description.ilike.%${cleanKw}%`);
      }
    }

    if (!isSorted) {
      productsQuery = productsQuery.order('created_at', { ascending: false });
    }

    productsQuery = productsQuery.limit(10);

    const { data, error } = await productsQuery;
    
    if (error || !data || data.length === 0) {
      // Fallback: If query match fails, return products sorted according to requested sort_by or newest with ALL their sizes/variants
      let fallbackQuery = supabase.from('products').select(selectFields);
      if (sort_by === 'cheapest' || kw.includes('termurah') || kw.includes('murah')) {
        fallbackQuery = fallbackQuery.order('price', { ascending: true });
      } else if (sort_by === 'most_expensive' || kw.includes('termahal') || kw.includes('mahal')) {
        fallbackQuery = fallbackQuery.order('price', { ascending: false });
      } else {
        fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
      }
      
      const { data: fallbackData } = await fallbackQuery.limit(6);
      if (fallbackData && fallbackData.length > 0) {
        return { 
          success: true, 
          note: `Pencarian dengan spesifikasi tersebut tidak menemukan produk dengan nama yang cocok secara langsung. Berikut adalah daftar produk rekomendasi toko beserta SELURUH varian (ukuran/size, warna, stock, harga) untuk diperiksa dan direkomendasikan kepada customer:`,
          products: fallbackData 
        };
      }
      return { error: 'Tidak ditemukan produk di database.' };
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
