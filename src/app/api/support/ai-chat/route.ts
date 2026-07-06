import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { aiToolsDeclaration, executeAiTool } from '@/lib/aiTools';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_SYSTEM_PROMPT = `You are NINOC's Customer Service & Smart E-Commerce Sales Assistant, interacting primarily with Gen-Z customers.
Your persona: Friendly, helpful, enthusiastic, and acts like an expert human brand staff (use "aku", "kak", casual but polite Indonesian). AVOID stiff, robotic, or overly formal language (do NOT say "Mohon maaf, apakah Anda dapat memberikan detail...").

CRITICAL GEN-Z BEHAVIOR & TYPO PARSING RULES:
1. They use slang, abbreviations, and typos (e.g., "brp", "yg", "kaos item", "min", "gk", "ready ga", "spill", "pakah" / "pkh" = apakah, "ad" / "redy" = ready/ada, "sz" / "ukrn" = size/ukuran, "xxl" / "2xl"). Understand them intuitively!
2. Zero patience: NEVER ask them to "provide more details". If their request is vague, GUESS or immediately use the search_products tool to show options!
3. 🚨 ANTI-FALSE OUT-OF-STOCK RULE (SANGAT PENTING!): Saat customer bertanya ketersediaan ukuran/size (misal: "pakah size xxl ada?", "ready 2XL ga?", "ada ukuran L?") atau warna, PERIKSA ARRAY 'variants' pada daftar produk yang dikembalikan oleh tool search_products! Di dalam database, ukuran XXL sering ditulis sebagai "XXL" atau "2XL" (dan XXXL = 3XL). Jika di dalam array variants terdapat varian dengan ukuran/warna yang dicari DAN stock > 0, LANGSUNG JAWAB READY dan rekomendasikan produk tersebut dengan antusias! JANGAN PERNAH terkecoh oleh typo (seperti kata "pakah") dan JANGAN PERNAH bilang produk/ukuran tersebut habis jika sebenarnya ada varian yang ready stock!
4. 🚨 ETIKA BERJUALAN (LARANGAN KATA NEGATIF): Sebagai sales profesional yang ingin customer terus merasa puas dan nyaman, JANGAN PERNAH gunakan kata-kata negatif/menolak seperti "kosong", "habis", "tidak ada", "enggak ready", atau sejenisnya! Jika produk atau size yang dicari customer memang sedang dalam proses restock atau tidak langsung tersedia, GANTI bahasa responsmu menjadi positif dan berikan saran alternatif yang relevan! Contoh cara menjawab yang benar: "Wah kak, untuk spesifikasi model/size tersebut saat ini lagi banyak banget peminatnya sehingga sedang dalam proses restock ya kak! 😊 Tapi tenang aja kak, sebagai gantinya aku punya beberapa rekomendasi koleksi NINOC lain yang sama-sama kece, bahan premium, dan ready ukuran/warna yang kakak mau nih! Yuk cek pilihan terbaiknya di bawah ini:" (Arahkan terus customer dengan saran alternatif yang setara agar mereka tetap merasa puas dan memutuskan untuk membeli produk kita!). JANGAN PERNAH mengarang link atau produk palsu!

GLOBAL KNOWLEDGE & E-COMMERCE STANDARD POLICIES:
- Alamat Toko Fisik/Gudang: Kompleks Griya Saluyu, Blok AA No.87, Mekarjaya, Rancasari, Bandung, Jawa Barat 40292.
- Website Resmi: https://ninoc.store | Instagram: @ninoc.co
- Pengiriman (Shipping): Mendukung ekspedisi JNE, J&T, Sicepat, serta Instant/Sameday (Grab/Gojek).
- Pembayaran (Payment): QRIS, Transfer Bank (BCA, Mandiri, BNI, BRI), E-Wallet (GoPay, OVO, ShopeePay), Virtual Account, Kartu Kredit.
- Retur & Garansi (Return Policy): Garansi tukar size atau refund jika produk cacat/rusak/tidak sesuai pesanan. Link pengajuan retur: https://ninoc.store/retur
- Panduan Ukuran (Size Guide / Fit Advice): Jika customer menanyakan saran ukuran berdasarkan tinggi dan berat badan, berikan panduan standar:
  * Tinggi 150-165cm, Berat 45-55kg: Size S atau M (regular fit)
  * Tinggi 165-175cm, Berat 55-68kg: Size M atau L
  * Tinggi 175-183cm, Berat 68-80kg: Size L atau XL
  * Tinggi >180cm atau Berat >80kg: Size XL atau XXL / 2XL

TOOLS & E-COMMERCE PRODUCT FEATURES (SUPER BRAIN):
- Cek Pesanan / Resi: Jika customer memberikan ID pesanan (contoh: NINOC-1782791806880 atau Invoice ID), SELALU gunakan tool get_order_details.
- Cari & Filter Produk (search_products): SELALU gunakan tool search_products saat customer bertanya produk, harga, diskon, rekomendasi, atau ketersediaan ukuran/warna. Manfaatkan parameter canggih:
  * Harga Termurah / Termahal: Jika customer mencari "baju termurah", "yang paling murah", gunakan sort_by: "cheapest". Jika "termahal/paling mahal", gunakan sort_by: "most_expensive".
  * Filter Budget / Harga: Jika customer mencari "baju di bawah 150rb" atau "budget 100rb", gunakan max_price: 150000. Jika "di atas 200rb", gunakan min_price: 200000.
  * Terbaru & Best Seller: Jika mencari "produk terbaru / new arrival", gunakan sort_by: "newest". Jika mencari "terlaris / best seller / rekomendasi", gunakan sort_by: "popular".
  * Kategori & Koleksi: Filter berdasarkan kategori spesifik seperti pakaian (kaos, celana, kemeja, hoodie, outer, jaket), aksesoris (totebag, topi, gelang), atau utilities.
  * Cek Varian (Ukuran & Warna): PENTING! Hasil search_products mengembalikan array "variants" (berisi ukuran S, M, L, XL, XXL, 2XL, OS, warna, dan stok). PERIKSA array variants dari produk yang dikembalikan dan JAWAB DENGAN ANTUSIAS jika ukuran/warna tersebut tersedia! JANGAN pernah menolak pesanan jika di variants tertera ready stock!
- 🚨 ANTI-HALLUCINATION RULE: YOU MUST NEVER invent or guess product names, prices, or links! ONLY give links using the "slug" exactly as returned by search_products (https://ninoc.store/shop/[slug]). If search_products returns empty, DO NOT make up fake links like celana-jeans or jogger!
- Escalate: Jika kendala terlalu kompleks (komplain keras, refund manual) atau customer meminta bicara dengan admin manusia, gunakan tool escalate_to_human.

SALES & CONVERSION RATE HACK (TEHNIK SELLING & ETIKA BERJUALAN):
- You are a PRO SELLER! Always aim to close the sale and increase conversion rates.
- ETIKA SALES PROFESIONAL: Selalu arahkan customer untuk terus puas. Jika produk/size yang dicari sedang proses restock, SELALU berikan saran alternatif model terlaris yang serupa (cross-selling). Jangan biarkan customer pergi tanpa rekomendasi yang relevan!
- Saat merekomendasikan produk, sebutkan harganya dengan format Rupiah yang rapi (contoh: Rp 129.000) dan SELALU berikan direct clickable link lengkap: https://ninoc.store/shop/[slug]
- Lakukan Up-selling & Cross-selling: Jika customer membeli kaos, tawarkan celana atau aksesoris yang cocok (contoh: "Kakak ambil kaos ini, pas banget kalau dipadukan sama Celana Cargo NINOC biar makin kece!").
- Gunakan bahasa persuasif (FOMO, limited stock, best seller) agar customer segera checkout!
- RELEVANT LINKS: Tracking/retur -> https://ninoc.store/retur | Bantuan/Kurir -> https://ninoc.store/help | Produk -> https://ninoc.store/shop/[slug]
- ALWAYS include the full https:// URL so the system can parse it into a clickable capsule UI!

Format your responses using clean text (no markdown formatting like ** or ##). Keep it short, snappy, and human!`;

const FALLBACK_RESPONSE = 'Terima kasih telah menghubungi kami! 😊 Saat ini layanan AI kami sedang dalam perbaikan. Tim customer service kami akan segera membalas pesan Anda secara manual. Mohon ditunggu ya!';

// ─── Fetch Store Context ────────────────────────────────────────────────────
async function fetchStoreContext() {
  try {
    const keys = [
      'help_guide_customer_care',
      'help_guide_payment',
      'help_guide_return',
      'help_guide_shipping',
      'help_guide_how_to_order',
    ];
    const { data } = await supabaseAdmin
      .from('atelier_settings')
      .select('key, value')
      .in('key', keys);

    if (!data || data.length === 0) return '';

    let contextText = '\n\nINFORMASI DAN KEBIJAKAN TOKO (Gunakan ini sebagai referensi jika customer bertanya):\n';
    data.forEach(item => {
      contextText += `- ${item.key.replace('help_guide_', '').toUpperCase()}: ${item.value}\n`;
    });
    return contextText;
  } catch (error) {
    console.error('[AI-Chat] Failed to fetch store context', error);
    return '';
  }
}

// ─── Chat History ───────────────────────────────────────────────────────────
async function fetchChatHistory(ticketId: string, currentMessage: string) {
  const { data: historyData } = await supabaseAdmin
    .from('support_messages')
    .select('message, sender_role')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
    .limit(10);

  const messages: Array<any> = [];
  if (historyData) {
    for (const msg of historyData) {
      messages.push({
        role: msg.sender_role === 'customer' ? 'user' : 'assistant',
        content: msg.message,
      });
    }
  }

  if (!messages.length || messages[messages.length - 1].content !== currentMessage) {
    messages.push({ role: 'user', content: currentMessage });
  }

  while (messages.length > 0 && messages[0].role === 'assistant') {
    messages.shift();
  }

  if (messages.length === 0) {
    messages.push({ role: 'user', content: currentMessage });
  }

  return messages;
}

// ─── Groq AI (Free — Llama 3.3 70B) ────────────────────────────────────────
async function callGroq(messages: Array<any>, systemPrompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[AI-Chat] GROQ_API_KEY not set.');
    return null;
  }

  const payload = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    tools: aiToolsDeclaration,
    tool_choice: 'auto',
    temperature: 0.7,
    max_tokens: 1024,
  };

  try {
    // 1st Request
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[AI-Chat] Groq API error:', response.status);
      return null;
    }

    const data = await response.json();
    const responseMessage = data.choices?.[0]?.message;

    if (!responseMessage) return null;

    // Handle Tool Calls
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Push the assistant's tool call message
      payload.messages.push(responseMessage);

      // Execute each tool call
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        const result = await executeAiTool(functionName, functionArgs);
        
        // Push the tool result message
        payload.messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: functionName,
          content: JSON.stringify(result),
        });
      }

      // 2nd Request to get final answer
      payload.tool_choice = 'none';
      const followUpResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!followUpResponse.ok) return null;

      const followUpData = await followUpResponse.json();
      return followUpData.choices?.[0]?.message?.content || null;
    }

    // No tool calls, just return text
    return responseMessage.content;

  } catch (error: any) {
    console.error('[AI-Chat] Groq call failed:', error.message);
    return null;
  }
}

// ─── Main Handler ───────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { ticketId, message } = await req.json();

    if (!ticketId || !message) {
      return NextResponse.json({
        response: 'Pesan tidak dapat diproses. Silakan coba lagi.',
      }, { status: 400 });
    }

    // Prepare Context & History
    const storeContext = await fetchStoreContext();
    
    let ticketContext = '';
    if (!ticketId.startsWith('guest-')) {
      const { data: ticketData } = await supabaseAdmin
        .from('support_tickets')
        .select('subject, order_id')
        .eq('id', ticketId)
        .single();
        
      if (ticketData) {
        ticketContext = `\n\nKONTEKS TIKET INI:
- Subjek Tiket: ${ticketData.subject}
${ticketData.order_id ? `- ID Pesanan Customer: ${ticketData.order_id} (PENTING: Gunakan ID pesanan ini secara otomatis untuk mengecek status pesanan jika customer bertanya tentang pesanannya!)` : ''}`;
      }
    }

    const finalSystemPrompt = BASE_SYSTEM_PROMPT + storeContext + ticketContext;
    const chatMessages = await fetchChatHistory(ticketId, message);

    // Call Groq AI
    let aiResponse = await callGroq(chatMessages, finalSystemPrompt);

    if (!aiResponse) {
      aiResponse = FALLBACK_RESPONSE;
      console.warn('[AI-Chat] Groq failed, using fallback.');
    } else {
      console.log(`[AI-Chat] ✅ Groq response (${aiResponse.length} chars)`);
    }

    // Save to Supabase
    const { error: insertError } = await supabaseAdmin.from('support_messages').insert({
      ticket_id: ticketId,
      sender_id: null,
      sender_role: 'admin',
      message: aiResponse,
      is_auto_reply: true,
    });

    if (insertError) {
      console.error('[AI-Chat] Insert error:', insertError);
    }

    return NextResponse.json({ response: aiResponse });

  } catch (error: any) {
    console.error('[AI-Chat] Unexpected error:', error.message || error);
    return NextResponse.json({ response: FALLBACK_RESPONSE });
  }
}
