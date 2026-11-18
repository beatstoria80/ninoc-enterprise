import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { executeAiTool } from '@/lib/aiTools';

// ─── STRICT SYSTEM PROMPT TEMPLATE (Closed-Domain RAG & Zero-Hallucination) ─
const STRICT_SYSTEM_PROMPT_TEMPLATE = `Kamu adalah Asisten Informasi Resmi Aplikasi. Tugasmu adalah menjawab pertanyaan pengguna HANYA dan EKSKLUSIF berdasarkan "BASIS PENGETAHUAN RESMI (KNOWLEDGE BASE)" yang dilampirkan di bawah ini.

==================================================
BASIS PENGETAHUAN RESMI (KNOWLEDGE BASE):
{{INSERT_KNOWLEDGE_BASE_HERE}}

==================================================
ATURAN KETAT MENJAWAB (ZERO-HALLUCINATION GUARDRAILS):

PRINSIP SUMBER TERTUTUP (STRICT GROUNDING):
- Kamu HANYA diperbolehkan mengambil fakta, data, definisi, dan instruksi dari BASIS PENGETAHUAN di atas.
- DILARANG menggunakan pengetahuan eksternal, asumsi, perkiraan, atau beropini di luar dokumen yang diberikan.
- Pahami variasi penulisan bahasa Indonesia sehari-hari, singkatan, serta salah ketik (typo) wajar pengguna (contoh: "pemgiriman" = pengiriman, "tersesdia" = tersedia, "ongkir" = ongkos kirim, "resi" = nomor resi/tracking).
- Jika pengguna menanyakan seputar fashion, produk pakaian, koleksi terbaru, new arrivals, kaos, hoodie, polo, pesanan, pengiriman, pembayaran, atau panduan toko, kamu WAJIB menjawab secara ramah, jelas, dan informatif berdasarkan data pada BASIS PENGETAHUAN di atas. Sebutkan informasi faktual secara lugas.

PENANGANAN PERTANYAAN DI LUAR BASIS DATA (FALLBACK PROTOCOL):
- Jika jawaban atas pertanyaan pengguna TIDAK DITEMUKAN atau TIDAK DISEBUTKAN secara eksplisit di dalam Basis Pengetahuan, kamu WAJIB menjawab persis dengan kalimat berikut: "Mohon maaf, informasi mengenai hal tersebut belum tersedia di dalam pusat data panduan resmi aplikasi kami. Silakan ajukan pertanyaan seputar fitur atau panduan yang tersedia."
- DILARANG mengarang jawaban alternatif atau berspekulasi jika data tidak ada.

DILARANG MELEBAR (NO DRIFTING):
- Jawab hanya hal spesifik yang ditanyakan pengguna.
- Jangan menambahkan materi, tips, atau saran ekstra yang tidak relevan dengan pertanyaan langsung.

FORMAT & KEBERSIHAN TEKS (MOBILE/WEB FRIENDLY):
- DILARANG menggunakan tanda pagar heading markdown (#, ##, ###, dst).
- DILARANG menggunakan tag HTML mentah (<br>, <p>, <div>, dst).
- Gunakan teks tebal "kata kunci" untuk penekanan.
- Gunakan bullet point ("- ") atau penomoran ("1. ", "2. ") jika menyajikan langkah-langkah agar ringkas dan enak dibaca.`;

const FALLBACK_RESPONSE = 'Mohon maaf, informasi mengenai hal tersebut belum tersedia di dalam pusat data panduan resmi aplikasi kami. Silakan ajukan pertanyaan seputar fitur atau panduan yang tersedia.';

// ─── RAG PRODUCT CATALOG RETRIEVER ──────────────────────────────────────────
async function fetchProductsForRAG(query: string) {
  const SELECT_FIELDS = 'id, name, price, category, slug, variants(color, size, stock_quantity, sku)';

  try {
    // 1. Fetch latest published products
    const { data: latest } = await supabaseAdmin
      .from('products')
      .select(SELECT_FIELDS)
      .order('created_at', { ascending: false })
      .limit(8);

    // 2. Fetch specific matching products if query has relevant keywords
    const qClean = (query || '').toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
    const stopWords = new Set(['apa', 'yang', 'dari', 'ada', 'dan', 'ini', 'itu', 'saya', 'kak', 'min', 'bisa', 'dong']);
    const tokens = qClean.split(/\s+/).filter(t => t.length > 2 && !stopWords.has(t));

    let matched: any[] = [];
    if (tokens.length > 0) {
      const orFilter = tokens
        .slice(0, 4)
        .map(t => `name.ilike.%${t}%,category.ilike.%${t}%,description.ilike.%${t}%`)
        .join(',');

      const { data: mData } = await supabaseAdmin
        .from('products')
        .select(SELECT_FIELDS)
        .or(orFilter)
        .limit(6);

      if (mData) matched = mData;
    }

    // Combine and deduplicate
    const map = new Map<string, any>();
    [...matched, ...(latest || [])].forEach((p: any) => {
      if (p?.id && !map.has(p.id)) {
        map.set(p.id, p);
      }
    });

    return Array.from(map.values()).slice(0, 8);
  } catch (err: any) {
    console.error('[AI-Chat-RAG] Product fetch error:', err.message);
    return [];
  }
}

// ─── RAG KNOWLEDGE BASE RETRIEVER ──────────────────────────────────────────
async function buildKnowledgeBase(ticketId: string, userMessage: string): Promise<string> {
  const sections: string[] = [];

  // 1. Identitas & Kebijakan Standar Toko Resmi NINOC
  sections.push(`[PROFIL & INFORMASI RESMI TOKO]
- Nama Toko: NINOC
- Website Resmi: https://ninoc.store
- Instagram Resmi: @ninoc.co
- Kategori Fashion Resmi yang Dijual: Kaos / Graphic T-Shirt Streetwear (Pria, Wanita, Unisex), Hoodie Street Art & Graffiti, Polo Shirt Gothic, Aksesoris & Skateboard Tech Deck.
- Alamat Toko Fisik & Gudang: Kompleks Griya Saluyu, Blok AA No.87, Mekarjaya, Rancasari, Bandung, Jawa Barat 40292
- Layanan Ekspedisi Pengiriman: JNE, J&T, Sicepat, serta Instant/Sameday (Grab/Gojek)
- Jangkauan Wilayah Pengiriman: Mendukung pengiriman ke SELURUH INDONESIA (termasuk Papua, Maluku, Sulawesi, Kalimantan, Sumatra, Bali, Nusa Tenggara, dan Pulau Jawa) menggunakan ekspedisi reguler & kargo nasional (JNE, J&T, SiCepat). Ongkos kirim dihitung secara otomatis saat proses checkout di website sesuai alamat lengkap tujuan.
- Pengiriman Instant / Sameday: Tersedia khusus wilayah Bandung dan sekitarnya menggunakan Grab/Gojek.
- Metode Pembayaran Resmi: QRIS, Transfer Bank (BCA, Mandiri, BNI, BRI), E-Wallet (GoPay, OVO, ShopeePay), Virtual Account, Kartu Kredit
- Kebijakan Pengembalian & Garansi (Return Policy): Garansi tukar size atau pengembalian dana (refund) apabila produk cacat, rusak, atau tidak sesuai pesanan. Form pengajuan retur: https://ninoc.store/retur
- Panduan Ukuran Standar (Size Guide):
  * Tinggi 150-165 cm, Berat 45-55 kg: Size S atau M
  * Tinggi 165-175 cm, Berat 55-68 kg: Size M atau L
  * Tinggi 175-183 cm, Berat 68-80 kg: Size L atau XL
  * Tinggi >180 cm atau Berat >80 kg: Size XL atau XXL / 2XL
- Pusat Bantuan Resmi: https://ninoc.store/help`);

  // 2. Panduan & Dokumen dari Atelier Settings (CMS Database)
  try {
    const keys = [
      'help_guide_customer_care',
      'help_guide_payment',
      'help_guide_return',
      'help_guide_shipping',
      'help_guide_how_to_order',
    ];
    const { data: helpGuides } = await supabaseAdmin
      .from('atelier_settings')
      .select('key, value')
      .in('key', keys);

    if (helpGuides && helpGuides.length > 0) {
      const guideLines = helpGuides
        .filter(item => item.value)
        .map(item => `- Panduan ${item.key.replace('help_guide_', '').toUpperCase()}: ${item.value}`);
      if (guideLines.length > 0) {
        sections.push(`[PANDUAN OPERASIONAL & BANTUAN SISTEM]\n${guideLines.join('\n')}`);
      }
    }
  } catch (err: any) {
    console.error('[AI-Chat-RAG] Failed to load atelier help guides:', err.message);
  }

  // 3. Retrieval Data Pesanan Pelanggan (Jika Tiket / Chat Terkait Pesanan)
  try {
    let orderId: string | null = null;

    if (!ticketId.startsWith('guest-')) {
      const { data: ticketData } = await supabaseAdmin
        .from('support_tickets')
        .select('order_id')
        .eq('id', ticketId)
        .single();

      if (ticketData?.order_id) {
        orderId = ticketData.order_id;
      }
    }

    if (!orderId) {
      const orderMatch = userMessage.match(/NINOC-\d+|INV-[A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (orderMatch) {
        orderId = orderMatch[0];
      }
    }

    if (orderId) {
      const orderResult = await executeAiTool('get_order_details', { order_id: orderId });
      if (orderResult?.success && orderResult.order) {
        const o = orderResult.order;
        const items = Array.isArray(o.order_items)
          ? o.order_items.map((it: any) => `${it.product_name || 'Produk'} (Qty: ${it.quantity || 1}, Size: ${it.size || '-'}, Warna: ${it.color || '-'})`).join(', ')
          : '-';

        sections.push(`[DATA PESANAN PENGGUNA TERVERIFIKASI]
- Nomor Pesanan: ${o.id}
- Status Pesanan: ${o.status}
- Kurir Pengiriman: ${o.courier || '-'}
- Nomor Resi: ${o.tracking_code || 'Belum terbit (pesanan sedang diproses gudang)'}
- Total Nilai Pesanan: Rp ${(o.total_amount || 0).toLocaleString('id-ID')}
- Daftar Produk: ${items}
- Tanggal Pesanan: ${o.created_at || '-'}`);
      }
    }
  } catch (err: any) {
    console.error('[AI-Chat-RAG] Failed to load order context:', err.message);
  }

  // 4. Retrieval Katalog Produk & Koleksi Fashion Resmi (RAG Terverifikasi Database)
  const products = await fetchProductsForRAG(userMessage);
  if (products.length > 0) {
    const productLines = products.map((p: any) => {
      const variants = Array.isArray(p.variants)
        ? p.variants.map((v: any) => `${v.size || 'OS'}${v.color ? ` (${v.color})` : ''}: Stok ${v.stock_quantity ?? 0}`).join(', ')
        : 'Cek di website';
      return `- Nama Produk: ${p.name}
  Kategori: ${p.category || 'Pakaian'}
  Harga Resmi: Rp ${(p.price || 0).toLocaleString('id-ID')}
  Varian & Ketersediaan Stok: ${variants}
  Tautan Halaman Produk: https://ninoc.store/shop/${p.slug} [PRODUK:${p.slug}]`;
    });

    sections.push(`[KOLEKSI FASHION TERBARU & KATALOG PRODUK RESMI NINOC]
Koleksi fashion terbaru, rilisan anyar (new arrivals), dan produk ready stock saat ini meliputi:
${productLines.join('\n\n')}`);
  }

  return sections.join('\n\n==================================================\n\n');
}

// ─── Chat History Helper ────────────────────────────────────────────────────
async function fetchChatHistory(ticketId: string, currentMessage: string) {
  const { data: historyData } = await supabaseAdmin
    .from('support_messages')
    .select('message, sender_role')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
    .limit(6);

  const rawMessages: Array<any> = [];
  if (historyData) {
    const chronologicalData = [...historyData].reverse();
    for (const msg of chronologicalData) {
      rawMessages.push({
        role: msg.sender_role === 'customer' ? 'user' : 'assistant',
        content: msg.message,
      });
    }
  }

  // Safely append currentMessage if missing
  const lastRaw = rawMessages.length > 0 ? rawMessages[rawMessages.length - 1] : null;
  const isDuplicateUserMessage = lastRaw && lastRaw.role === 'user' && lastRaw.content === currentMessage;
  
  if (!isDuplicateUserMessage) {
    rawMessages.push({ role: 'user', content: currentMessage });
  }

  // Combine consecutive messages with the same role
  const mergedMessages: Array<any> = [];
  for (const msg of rawMessages) {
    if (mergedMessages.length > 0 && mergedMessages[mergedMessages.length - 1].role === msg.role) {
      mergedMessages[mergedMessages.length - 1].content += `\n${msg.content}`;
    } else {
      mergedMessages.push({ role: msg.role, content: msg.content });
    }
  }

  // Ensure the history starts with a user message
  while (mergedMessages.length > 0 && mergedMessages[0].role === 'assistant') {
    mergedMessages.shift();
  }

  // Safety Net: History MUST end with a user prompt
  if (mergedMessages.length === 0 || mergedMessages[mergedMessages.length - 1].role === 'assistant') {
    mergedMessages.push({ role: 'user', content: currentMessage });
  }

  return mergedMessages;
}

// ─── Groq API Retry Helper ─────────────────────────────────────────────────
async function fetchGroqWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, options);
    if (res.ok || (res.status !== 429 && res.status < 500)) {
      return res;
    }
    console.warn(`[AI-Chat] Groq API status ${res.status}, retrying ${i + 1}/${retries}...`);
    if (i < retries) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    } else {
      return res;
    }
  }
  return fetch(url, options);
}

// ─── Groq Cloud (Strict Zero-Hallucination Closed-Domain Configuration) ─────
async function callGroq(messages: Array<any>, systemPrompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[AI-Chat] GROQ_API_KEY not set.');
    return null;
  }

  // High-performance Groq Models with Zero-Hallucination & Closed-Domain RAG
  const models = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
  ];

  for (const modelName of models) {
    // Hyperparameters designed for Zero-Hallucination & Closed-Domain RAG
    const payload: any = {
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.1,        // WAJIB RENDAH: 0.0 - 0.2 agar AI patuh 100% pada teks basis data
      top_p: 0.85,             // Menjaga fokus pada token probabilitas tertinggi
      max_tokens: 1000,        // Mencegah jawaban bertele-tele
      presence_penalty: 0.0,   // Netral agar tidak memicu topik baru di luar konteks
      frequency_penalty: 0.0,
      stream: false,
    };

    try {
      const response = await fetchGroqWithRetry('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[AI-Chat-Error] Groq ${modelName} gagal (${response.status}):`, errText);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && typeof content === 'string' && content.trim().length > 0) {
        return content.trim();
      }
    } catch (err: any) {
      console.warn(`[AI-Chat] Exception with Groq model ${modelName}:`, err.message);
      continue;
    }
  }

  return null;
}

// ─── Gemini AI (Strict Fallback Resiliency) ─────────────────────────────────
async function callGemini(messages: Array<any>, systemPrompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[AI-Chat] GEMINI_API_KEY not set in environment.');
    return null;
  }

  const geminiMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content || '' }],
  }));

  const payload: any = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.1,
      topP: 0.85,
      maxOutputTokens: 1000,
    },
  };

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[AI-Chat] Gemini API failed:', errText);
      return null;
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p: any) => p.text).filter(Boolean).join('\n').trim();

    return text || null;
  } catch (err: any) {
    console.error('[AI-Chat] Exception with Gemini fallback:', err.message);
    return null;
  }
}

// ─── Main Route Handler ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { ticketId, message } = await req.json();

    if (!ticketId || !message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({
        response: 'Pesan tidak dapat diproses. Silakan coba lagi.',
      }, { status: 400 });
    }

    const trimmedMessage = message.trim();

    // 1. RAG Step: Bangun Basis Pengetahuan Resmi (Closed-Domain Knowledge Base)
    const knowledgeBase = await buildKnowledgeBase(ticketId, trimmedMessage);

    // 2. Injeksi Basis Pengetahuan ke Blueprint Strict System Prompt
    const finalSystemPrompt = STRICT_SYSTEM_PROMPT_TEMPLATE.replace('{{INSERT_KNOWLEDGE_BASE_HERE}}', knowledgeBase);

    // 3. Ambil Riwayat Chat
    const chatMessages = await fetchChatHistory(ticketId, trimmedMessage);

    // 4. Eksekusi LLM: Groq Cloud (Prioritas Utama)
    let aiResponse = await callGroq(chatMessages, finalSystemPrompt);

    // 5. Fallback ke Gemini jika Groq tidak merespon
    if (!aiResponse) {
      console.warn('[AI-Chat] Groq unavailable, switching to Gemini fallback...');
      aiResponse = await callGemini(chatMessages, finalSystemPrompt);
    }

    // 6. Final Static Fallback Protocol
    if (!aiResponse) {
      aiResponse = FALLBACK_RESPONSE;
      console.warn('[AI-Chat] All AI providers failed. Using static fallback protocol.');
    } else {
      console.log(`[AI-Chat] ✅ Zero-Hallucination AI Response generated (${aiResponse.length} chars)`);
    }

    // 7. Simpan Pesan Respon ke Database Supabase (support_messages)
    const { error: insertError } = await supabaseAdmin.from('support_messages').insert({
      ticket_id: ticketId,
      sender_id: null,
      sender_role: 'admin',
      message: aiResponse,
      is_auto_reply: true,
    });

    if (insertError) {
      console.error('[AI-Chat] Insert error to support_messages:', insertError);
    }

    return NextResponse.json({ response: aiResponse });

  } catch (error: any) {
    console.error('[AI-Chat] Unexpected error:', error.message || error);
    return NextResponse.json({ response: FALLBACK_RESPONSE });
  }
}
