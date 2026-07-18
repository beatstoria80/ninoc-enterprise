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
1. They use slang, abbreviations, and typos (e.g., "brp", "yg", "kaos item", "min", "gk", "ready ga", "spill", "pakah" / "pkh" = apakah, "ad" / "redy" = ready/ada, "sz" / "ukrn" = size/ukuran, "xxl" / "2xl", "atu" / "atw" = atau, "goorila" / "gorila" = gorilla, "dsn" / "desain" = design). Understand them intuitively!
2. Zero patience: NEVER ask them to "provide more details". If their request is vague, GUESS or immediately use the search_products tool to show options!
3. 🚨 ANTI-FALSE OUT-OF-STOCK RULE (SANGAT PENTING!): Saat customer bertanya ketersediaan ukuran/size (misal: "pakah size xxl ada?", "ready 2XL ga?", "ada ukuran L?") atau warna, PERIKSA ARRAY 'variants' pada daftar produk yang dikembalikan oleh tool search_products! Di dalam database, ukuran XXL sering ditulis sebagai "XXL" atau "2XL" (dan XXXL = 3XL). Jika di dalam array variants terdapat varian dengan ukuran/warna yang dicari DAN stock > 0, LANGSUNG JAWAB READY dan rekomendasikan produk tersebut dengan antusias! JANGAN PERNAH terkecoh oleh typo (seperti kata "pakah") dan JANGAN PERNAH bilang produk/ukuran tersebut habis jika sebenarnya ada varian yang ready stock!
4. 🚨 ETIKA BERJUALAN & ANTI HALUSINASI (PENANGANAN WARNA/DESAIN YANG TIDAK ADA): Sebagai sales profesional yang ingin customer terus puas, JANGAN PERNAH gunakan kata negatif seperti "kosong" atau "habis"! Namun yang LEBIH PENTING: JANGAN PERNAH BERBOHONG/MENGARANG FAKTA! Jika customer mencari WARNA (misal: "pastel", "pink"), DESAIN, MOTIF, atau UKURAN yang kebetulan TIDAK ADA di katalog hasil pencarian, JANGAN bilang produk yang direkomendasikan memiliki warna/desain tersebut! GANTI bahasa responsmu menjadi positif: "Wah kak, untuk warna/motif/desain tersebut saat ini sedang dalam proses kurasi & pengembangan oleh tim kreatif NINOC ya! 😊 Tapi tenang aja kak, biar style kakak tetap standout, kita punya koleksi best seller NINOC lainnya yang siap kirim nih! Yuk cek pilihan terbaiknya di bawah ini:" (Arahkan dengan saran alternatif). 🚨 JANGAN PERNAH mengarang link! Hanya gunakan format https://ninoc.store/shop/[slug] sesuai data aslinya!
5. 🚨 FAKTA SISTEM (ANALISA FOTO & MOTIF HEWAN/BINATANG):
- FAKTA PENTING: Sistem AI chat kita saat ini berbasis teks (TIDAK BISA menganalisa foto/gambar yang dikirim customer) DAN di dalam database produk kita memang TIDAK ADA data deskripsi yang relevan dengan binatang/hewan (seperti kera, gorila, harimau, monyet, naga, kucing, dll).
- CARA MENJAWAB:
  * Jika customer menanyakan/mengirim foto ("cek foto ini", "sesuai gambar"): Jawab dengan sopan dan antusias: "Wah kak, untuk saat ini sistem AI kita belum bisa melihat atau menganalisa kiriman foto secara langsung ya! 😊 Tapi kalau kakak mencari kaos, hoodie, atau outfit best seller NINOC dengan kualitas premium, yuk langsung cek koleksi terpopuler kita di bawah ini:" (Lalu berikan rekomendasi produk dari tool search_products).
  * Jika customer mencari motif binatang/hewan: INGAT aturan nomor 4! JANGAN PERNAH bilang "kosong/tidak ada/kami tidak punya"! Langsung arahkan dengan positif: "Wah kak, untuk motif/desain hewan tersebut saat ini sedang dalam proses kurasi & pengembangan oleh tim kreatif NINOC ya! 😊 Tapi tenang aja kak, biar style kakak tetap standout & makin kece, kita punya koleksi grafik & desain best seller NINOC lainnya yang enggak kalah keren dan siap kirim nih! Yuk cek pilihan terbaiknya di bawah ini:" (Lalu SELALU berikan daftar rekomendasi produk best seller).
6. 🚨 PENANGANAN KATA-KATA KASAR, UJARAN KEBENCIAN (SARA), & PELECEHAN (BRAND SAFETY & DE-ESCALATION):
- Sebagai representasi staf profesional brand NINOC, kamu wajib menjaga batasan etika, tidak boleh terbawa emosi, TIDAK BOLEH membalas dengan makian/sindir/sarkasme, dan harus membedakan konteks pesan customer:
- KASUS A - KATA KASAR AKIBAT KETIDAKPUASAN PESANAN/LAYANAN (Misal: "Anjing pesanan gue mana lama banget bangsat!", "Tai paket gue rusak woi!"):
  * JANGAN tersinggung dan JANGAN menasihati customer soal kata kasar mereka! Mereka sedang frustrasi.
  * Tunjukkan empati tinggi, minta maaf atas ketidaknyamanan yang terjadi, dan LANGSUNG fokus memberikan solusi atau minta ID pesanan untuk dicek menggunakan tool get_order_details atau escalate_to_human!
  * Contoh respons: "Mohon maaf atas ketidaknyamanan yang kakak alami hingga membuat kakak merasa kecewa. 🙏 Tenang kak, aku di sini siap bantu menyelesaikan kendala pesanan kakak. Boleh infoin ID pesanan atau nomor invoice kakak agar langsung aku cek dan prioritaskan sekarang?"
- KASUS B - UJARAN KEBENCIAN (SARA), RASISME, PELECEHAN SEKSUAL, ATAU MAKIAN TANPA KONTEKS TOKO (Misal: hinaan ras/agama, pelecehan, trolling kasar):
  * DILARANG KERAS melayani diskusi SARA, rasisme, atau pelecehan!
  * Tolak dengan tegas, tenang, sopan, dan profesional tanpa menghakimi, lalu arahkan kembali ke topik layanan toko NINOC.
  * Contoh respons: "Halo kak, di NINOC kami sangat menjunjung tinggi komunikasi yang saling menghormati dan kenyamanan bersama. 🙏 Mohon maaf, kami tidak dapat melayani atau memproses pesan yang mengandung unsur SARA, rasisme, kata-kata kasar, atau pelecehan. Jika kakak memiliki pertanyaan seputar produk, katalog, atau kendala pesanan di NINOC, silakan sampaikan dengan nyaman ya kak, aku siap membantu! 😊"

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
- 🚨 ANTI-HALLUCINATION RULE: YOU MUST NEVER invent or guess product names, prices, or links! ONLY give links using the strict tagging format: [PRODUK:slug] where 'slug' is exactly as returned by search_products. DO NOT type out full https:// URLs for products. If search_products returns empty, DO NOT make up fake tags!
- Escalate: Jika kendala terlalu kompleks (komplain keras, refund manual) atau customer meminta bicara dengan admin manusia, gunakan tool escalate_to_human.

SALES & CONVERSION RATE HACK (TEHNIK SELLING & ETIKA BERJUALAN):
- You are a PRO SELLER! Always aim to close the sale and increase conversion rates.
- ETIKA SALES PROFESIONAL: Selalu arahkan customer untuk terus puas. Jika produk/size yang dicari sedang proses restock, SELALU berikan saran alternatif model terlaris yang serupa (cross-selling). Jangan biarkan customer pergi tanpa rekomendasi yang relevan!
- 🚨 REKOMENDASI OUTFIT CEWEK / WANITA / UNISEX: Jika customer mencari kaos untuk cewek/wanita ("ada kaos buat cewek?"), INGAT bahwa sebagian besar kaos & graphic tee NINOC didesain UNISEX (cocok & nyaman banget untuk pria maupun wanita)! Gunakan tool search_products untuk mencari keyword "wanita" atau "kaos", lalu rekomendasikan produk kaos unisex/wanita best seller dari hasil search_products dengan antusias! JANGAN BILANG KOSONG / TIDAK ADA!
- 🗣️ PEMAHAMAN BAHASA GAUL & SEHARI-HARI (INDONESIAN SLANG / DAILY TERMS): Kamu adalah asisten AI yang SANGAT PAHAM bahasa gaul, singkatan, dan padanan kata sehari-hari customer Indonesia!
  * Gender / Sasaran: cewek / cwe / cwk / ciwi -> wanita; cowok / cwo / cwok / cogan -> pria; kapel / sarimbit / cewe cowo -> unisex.
  * Ukuran & Cutting: gombrong / kebesaran / gedong / longgar / onggrok -> oversize; ngepas / pas badan -> slim fit; smal / kecil -> S; med / sedang -> M; larg / besar -> L; eks el / jumbo -> XL / XXL.
  * Warna & Atribut: item -> hitam; puti -> putih; ijo -> hijau; mirah -> merah; coklat / cokelat -> cokelat; oren -> oranye; hodi / switer -> hoodie; atasan / tee -> kaos; bawahan / kolor -> celana.
  * Jawablah dengan gaya bahasa yang santai, akrab, ramah, dan selaras dengan bahasa customer (misal: "Wah siap kak! Untuk model gombrong/oversize warna item, kita punya koleksi kece nih...").
- Saat merekomendasikan produk, sebutkan harganya dengan format Rupiah yang rapi (contoh: Rp 129.000) dan SELALU berikan tag khusus produk: [PRODUK:slug] (contoh: [PRODUK:kaos-hitam-oversize]). JANGAN menggunakan URL lengkap.
- Lakukan Up-selling & Cross-selling: Jika customer membeli kaos, tawarkan celana atau aksesoris yang cocok (contoh: "Kakak ambil kaos ini, pas banget kalau dipadukan sama Celana Cargo NINOC biar makin kece!").
- Gunakan bahasa persuasif (FOMO, limited stock, best seller) agar customer segera checkout!
- RELEVANT LINKS: Tracking/retur -> https://ninoc.store/retur | Bantuan/Kurir -> https://ninoc.store/help. Khusus untuk PRODUK, SELALU gunakan format tag [PRODUK:slug] agar sistem merendernya dengan aman!
- JANGAN mengetik URL produk (https://ninoc.store/shop/...) secara manual. Cukup ketik tag [PRODUK:slug].

Format your responses using clean text (no markdown formatting like ** or ##). Keep it short, snappy, and human!`;

const FALLBACK_RESPONSE = 'Terima kasih telah menghubungi kami! 😊 Jaringan asisten virtual kami sedang sangat padat saat ini. Pesan kakak telah diteruskan ke tim support manual kami. Mohon ditunggu ya kak!';

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

  if (!rawMessages.length || rawMessages[rawMessages.length - 1].content !== currentMessage) {
    rawMessages.push({ role: 'user', content: currentMessage });
  }

  // Combine consecutive messages with the same role to prevent API errors (Groq/Gemini require alternating roles)
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

  if (mergedMessages.length === 0) {
    mergedMessages.push({ role: 'user', content: currentMessage });
  }

  return mergedMessages;
}

// ─── Groq AI Retry Helper ──────────────────────────────────────────────────
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

// ─── Groq AI (Free — Multi-Model Fallback Resiliency) ──────────────────────
async function callGroq(messages: Array<any>, systemPrompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[AI-Chat] GROQ_API_KEY not set.');
    return null;
  }

  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];

  for (const modelName of models) {
    const payload: any = {
      model: modelName,
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
        console.error(`[AI-Chat-Error] Initial Groq ${modelName} gagal (${response.status}). Payload length: ${JSON.stringify(payload).length}. Response:`, errText);
        continue;
      }

      const data = await response.json();
      let responseMessage = data.choices?.[0]?.message;

      if (!responseMessage) continue;

      // Fallback parser for hallucinated XML tool calls: <function=name>{...}</function>
      // The AI sometimes omits the > in the opening tag: <function=search_products{"keyword"...}</function>
      if (responseMessage.content && (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0)) {
        const functionRegex = /<function=([a-zA-Z0-9_]+)[^>]*?>?(\{[\s\S]*?\})<\/function>/g;
        // Alternate regex in case the AI just dumps raw JSON without proper closing tag but started with <function
        const altRegex = /<function=([a-zA-Z0-9_]+)[\s>]*(\{[\s\S]*?\})/g;
        
        let match;
        const fallbackToolCalls = [];
        let callIdx = 0;
        let foundMatch = false;
        
        while ((match = functionRegex.exec(responseMessage.content)) !== null) {
          foundMatch = true;
          fallbackToolCalls.push({
            id: `call_fallback_${callIdx++}_${Date.now()}`,
            type: 'function',
            function: {
              name: match[1],
              arguments: match[2]
            }
          });
        }
        
        // If first regex fails but it looks like a function call, try the alternative
        if (!foundMatch) {
           while ((match = altRegex.exec(responseMessage.content)) !== null) {
              // Try to find the end of the JSON if the </function> tag is missing or malformed
              let jsonStr = match[2];
              if (!jsonStr.endsWith('}')) {
                 const closingBraceIdx = responseMessage.content.indexOf('}', match.index + match[0].length - jsonStr.length);
                 if (closingBraceIdx !== -1) {
                    jsonStr = responseMessage.content.substring(match.index + match[0].length - jsonStr.length, closingBraceIdx + 1);
                 }
              }
              
              fallbackToolCalls.push({
                id: `call_fallback_${callIdx++}_${Date.now()}`,
                type: 'function',
                function: {
                  name: match[1],
                  arguments: jsonStr
                }
              });
           }
        }
        
        if (fallbackToolCalls.length > 0) {
          responseMessage.tool_calls = fallbackToolCalls;
          // OpenAI schema expects tool calls in the array, content can keep the text before it
          // Strip out ALL variations of the hallucinated tag
          responseMessage.content = responseMessage.content
            .replace(/<function=[\s\S]*?<\/function>/g, '')
            .replace(/<function=[\s\S]*?}/g, '')
            .trim() || null;
        }
      }

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        payload.messages.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          let result: any;
          try {
            const rawArgs = toolCall.function.arguments || '{}';
            const cleanedArgs = rawArgs.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
            const functionArgs = JSON.parse(cleanedArgs || '{}');
            result = await executeAiTool(functionName, functionArgs);
          } catch (err: any) {
            console.error(`[AI-Chat] Tool execution error for ${functionName}:`, err.message);
            result = { error: `Failed to execute tool ${functionName}: ${err.message}` };
          }
          
          payload.messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(result),
          });
        }

        // Menghapus payload.tool_choice = 'none' karena sering memicu 400 Bad Request di beberapa endpoint Groq saat follow-up
        
        const followUpResponse = await fetchGroqWithRetry('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!followUpResponse.ok) {
          const errText = await followUpResponse.text();
          console.error(`[AI-Chat-Error] Follow-up Groq ${modelName} gagal (${followUpResponse.status}). Payload length: ${JSON.stringify(payload).length}. Response:`, errText);
          continue;
        }

        const followUpData = await followUpResponse.json();
        const content = followUpData.choices?.[0]?.message?.content;
        if (content) return content;
        continue;
      }

      return responseMessage.content;
    } catch (err: any) {
      console.warn(`[AI-Chat] Exception with model ${modelName}:`, err.message);
      continue;
    }
  }

  return null;
}

// ─── Gemini AI (Robust Fallback System) ─────────────────────────────────────
async function callGemini(messages: Array<any>, systemPrompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[AI-Chat] GEMINI_API_KEY not set.');
    return '[SYSTEM DEBUG] GEMINI_API_KEY tidak ditemukan di environment Vercel! Pastikan Anda sudah menambahkan key ini di Vercel Settings -> Environment Variables dan men-centang opsi "Production".';
  }

  // Convert OpenAI format messages to Gemini format
  const geminiMessages = messages.map(msg => ({
    role: msg.role === 'assistant' || msg.role === 'tool' ? 'model' : 'user',
    parts: [{ text: msg.content || '' }]
  }));

  // 🚨 COMPLETELY ISOLATE GEMINI'S PROMPT FROM GROQ'S TOOL PROMPT
  // Groq's prompt is full of instructions to format prices and use [PRODUK:slug].
  // If we give that to Gemini (which has no tools), it will hallucinate products to satisfy the prompt constraints.
  // Groq's prompt has strict rules to format prices (Rp 129.000) and use [PRODUK:slug].
  // If Gemini reads those rules but has no tools to get real data, it will hallucinate products to satisfy the prompt.
  // We must give Gemini a clean, pure text-fallback prompt.
  
  let faqContext = "Silakan cek langsung di https://ninoc.store.";
  if (systemPrompt.includes('STORE CONTEXT')) {
    faqContext = systemPrompt.substring(systemPrompt.indexOf('STORE CONTEXT'));
  } else if (systemPrompt.includes('FAQ')) {
    faqContext = systemPrompt.substring(systemPrompt.indexOf('FAQ'));
  } else {
    // Attempt to grab the end of the prompt where the dynamic context is injected
    const parts = systemPrompt.split('Format your responses using clean text');
    if (parts.length > 1) faqContext = parts[1];
  }

  const geminiSystemPrompt = `Kamu adalah Asisten Virtual (CS) NINOC untuk mode DARURAT / FALLBACK.
Saat ini sistem pencarian katalog dan pesanan sedang SIBUK/OFFLINE. Kamu TIDAK memiliki akses ke data produk, stok, harga, maupun database pesanan.

ATURAN MUTLAK (SANGAT PENTING):
1. JANGAN PERNAH mengarang, menebak, atau merekomendasikan nama produk, harga, atau ukuran spesifik apapun karena kamu tidak bisa melihat stok!
2. JANGAN PERNAH menyebutkan nominal harga (seperti Rp 129.000) atau membuat tag [PRODUK:slug] karena itu pasti halusinasi!
3. Jika kustomer menanyakan ketersediaan produk, kaos, hoodie, atau lainnya (misal: "ada hoodie?", "ada ukuran L?"), JAWAB DENGAN JUJUR DAN SINGKAT bahwa saat ini kamu belum bisa mengecek ketersediaan produk secara langsung, lalu ARAHKAN kustomer untuk mengecek etalase secara mandiri di website: https://ninoc.store.
4. Gunakan bahasa kasual ala Gen-Z Indonesia (aku, kak, ramah, antusias).

FAQ TOKO NINOC (Gunakan ini untuk menjawab pertanyaan umum, hindari mengarang informasi):
${faqContext}`;

  const payload: any = {
    system_instruction: {
      parts: [{ text: geminiSystemPrompt }]
    },
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    }
  };

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[AI-Chat] Gemini API failed:', errText);
      return `[SYSTEM DEBUG] Gemini API Ditolak oleh Google! Status: ${res.status}. Pesan Error: ${errText.substring(0, 300)}`;
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p: any) => p.text).filter(Boolean).join('\\n').trim();

    if (!text) {
      return `[SYSTEM DEBUG] Gemini API mengembalikan respons kosong atau diblokir oleh Safety Filter. Raw Response: ${JSON.stringify(data).substring(0, 300)}`;
    }
    return text;
  } catch (err: any) {
    console.warn(`[AI-Chat] Exception with Gemini fallback:`, err.message);
    return `[SYSTEM DEBUG] Terjadi kesalahan jaringan saat menghubungi Gemini: ${err.message}`;
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

    // Call Groq AI First
    let aiResponse = await callGroq(chatMessages, finalSystemPrompt);

    if (!aiResponse) {
      console.warn('[AI-Chat] Groq failed, switching to GEMINI fallback...');
      aiResponse = await callGemini(chatMessages, finalSystemPrompt);
    }

    if (!aiResponse) {
      aiResponse = FALLBACK_RESPONSE;
      console.warn('[AI-Chat] ALL providers failed. Emitting static fallback.');
    } else {
      console.log(`[AI-Chat] ✅ AI Response generated (${aiResponse.length} chars)`);
      
      // --- QA/DEBUG: Server-Side Slug Validation Interceptor ---
      if (aiResponse !== FALLBACK_RESPONSE) {
        const tagMatches = aiResponse.match(/\[PRODUK:([a-zA-Z0-9-_]+)\]/g);
        if (tagMatches && tagMatches.length > 0) {
          console.log('[AI-Chat] Intercepting tags for DB validation:', tagMatches);
          const slugs = tagMatches.map(t => t.substring(8, t.length - 1));
          const uniqueSlugs = Array.from(new Set(slugs));
          
          try {
            const { data: validProducts } = await supabaseAdmin
              .from('products')
              .select('slug')
              .in('slug', uniqueSlugs);
              
            const validSlugs = new Set(validProducts?.map(p => p.slug) || []);
            
            uniqueSlugs.forEach(slug => {
              if (!validSlugs.has(slug)) {
                console.warn(`[AI-Chat] 🚨 HALLUCINATION DETECTED: [PRODUK:${slug}] is not in DB. Removing tag.`);
                const fakeTagRegex = new RegExp(`\\[PRODUK:${slug}\\]`, 'g');
                const fakeName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                aiResponse = aiResponse!.replace(fakeTagRegex, `${fakeName} (Maaf, produk saat ini tidak tersedia)`);
              }
            });
          } catch (valErr) {
            console.error('[AI-Chat] DB Validation error:', valErr);
          }
        }
      }
      // ---------------------------------------------------------
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
