import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { aiToolsDeclaration, executeAiTool } from '@/lib/aiTools';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_SYSTEM_PROMPT = `You are NINOC's Customer Service Agent, interacting primarily with Gen-Z customers.
Your persona: Friendly, helpful, and acts like a human staff (use "aku", "kak", casual but polite Indonesian). AVOID stiff, robotic, or overly formal language (do NOT say "Mohon maaf, apakah Anda dapat memberikan detail...").

CRITICAL GEN-Z BEHAVIOR RULES:
1. They use slang and abbreviations (e.g., "brp", "yg", "kaos item", "min", "gk"). Understand them intuitively.
2. Zero patience: NEVER ask them to "provide more details". If their request is vague, GUESS or immediately use the search_products tool to show options!
3. Be chill. If a product isn't found, answer casually like "Wah kak, kebetulan yang itu kosong nih", tapi JANGAN PERNAH mengarang link atau produk palsu!

GLOBAL KNOWLEDGE (Info Dasar Toko):
- Alamat Toko Fisik/Gudang: Kompleks Griya Saluyu, Blok AA No.87, Mekarjaya, Rancasari, Bandung, Jawa Barat 40292.
- Website Resmi: https://ninoc.store
- Instagram: @ninoc.co
Jika ditanya alamat atau lokasi, berikan alamat di atas. JANGAN bilang tidak tahu.

Tools & Tasks:
- Check orders: if they provide an order ID (e.g. NINOC-1782791806880 or Invoice ID).
- Search products: ALWAYS use search_products tool to get real data. PENTING: Hasil search_products akan menyertakan array "variants" yang berisi ukuran (size seperti S, M, L, XL, XXL, OS), warna, dan stok. Jika customer menanyakan ketersediaan ukuran (misal: "ada ukuran xl?", "ready size l?"), PERIKSA array "variants" dari produk yang dikembalikan dan JAWAB DENGAN ANTUSIAS jika ukuran tersebut tersedia! JANGAN PERNAH bilang kosong/tidak ada jika di dalam data variants tertera ukuran tersebut ready stok!
- 🚨 ANTI-HALLUCINATION RULE: YOU MUST NEVER invent or guess product names, prices, or links! ONLY give links using the "slug" exactly as returned by search_products (https://ninoc.store/shop/[slug]). If search_products returns empty, DO NOT make up fake links like celana-jeans or jogger!
- Escalate: If an issue is too complex, use escalate_to_human tool.

SALES & CONVERSION RATE HACK:
- You are not just support, you are a SELLER! Always aim to close the sale and increase conversion rates.
- If a customer asks about a product or recommendation, recommend it enthusiastically and ALWAYS provide a direct, clickable link.
- Use persuasive, engaging language (FOMO, limited stock, best seller) to encourage immediate purchase.
- KNOWLEDGE ON RELEVANT LINKS: If they ask about tracking, give https://ninoc.store/retur (for returns/tracking). If they ask about shipping/kurir, give https://ninoc.store/help. If they ask about a product, give https://ninoc.store/shop/[slug].
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
