import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const systemPrompt = `You are NINOC's Customer Service Agent.
Your job is to assist customers politely, professionally, and accurately.
You can look up their order details if they provide an order ID (e.g. NCO-XXXX).
If an issue is too complex or requires a refund/manual review, politely tell the customer that you will escalate to a human agent.
Respond in Indonesian (Bahasa Indonesia). Keep responses concise and friendly.
Format your responses using clean text (no markdown formatting like ** or ##).`;

const FALLBACK_RESPONSE = 'Terima kasih telah menghubungi kami! 😊 Saat ini layanan AI kami sedang dalam perbaikan. Tim customer service kami akan segera membalas pesan Anda secara manual. Mohon ditunggu ya!';

// ─── Chat History ───────────────────────────────────────────────────────────
async function fetchChatHistory(ticketId: string, currentMessage: string) {
  const { data: historyData } = await supabase
    .from('support_messages')
    .select('message, sender_role')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
    .limit(10);

  const messages: Array<{ role: string; content: string }> = [];
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
async function callGroq(messages: Array<{ role: string; content: string }>): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[AI-Chat] GROQ_API_KEY not set.');
    return null;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[AI-Chat] Groq API error:', response.status, JSON.stringify(errorData));
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
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

    const chatMessages = await fetchChatHistory(ticketId, message);

    // Call Groq AI
    let aiResponse = await callGroq(chatMessages);

    if (!aiResponse) {
      aiResponse = FALLBACK_RESPONSE;
      console.warn('[AI-Chat] Groq failed, using fallback.');
    } else {
      console.log(`[AI-Chat] ✅ Groq response (${aiResponse.length} chars)`);
    }

    // Save to Supabase
    await supabase.from('support_messages').insert({
      ticket_id: ticketId,
      sender_id: null,
      sender_role: 'admin',
      message: aiResponse,
      is_auto_reply: true,
    });

    return NextResponse.json({ response: aiResponse });

  } catch (error: any) {
    console.error('[AI-Chat] Unexpected error:', error.message || error);
    return NextResponse.json({ response: FALLBACK_RESPONSE });
  }
}
