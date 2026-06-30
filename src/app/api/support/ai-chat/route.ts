import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';
import { aiToolsDeclaration, executeAiTool } from '@/lib/aiTools';

const systemPrompt = `You are NINOC's Customer Service Agent.
Your job is to assist customers politely, professionally, and accurately.
You can look up their order details if they provide an order ID (e.g. NCO-XXXX).
If an issue is too complex or requires a refund/manual review, use the escalate_to_human tool.
Respond in Indonesian (Bahasa Indonesia). Keep responses concise and friendly.
Format your responses using clean markdown (e.g., bold for important terms).`;

// Fallback response when AI is unavailable
const FALLBACK_RESPONSE = 'Terima kasih telah menghubungi kami! 😊 Saat ini layanan AI kami sedang dalam perbaikan. Tim customer service kami akan segera membalas pesan Anda secara manual. Mohon ditunggu ya!';

export async function POST(req: Request) {
  try {
    const { ticketId, message } = await req.json();

    if (!ticketId || !message) {
      return NextResponse.json({ 
        response: 'Pesan tidak dapat diproses. Silakan coba lagi.',
        error: 'Missing ticketId or message' 
      }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[AI-Chat] GEMINI_API_KEY is missing.');
      // Save fallback to DB and return
      await saveFallbackResponse(ticketId, FALLBACK_RESPONSE);
      return NextResponse.json({ response: FALLBACK_RESPONSE });
    }

    // Initialize Gemini AI
    let ai: GoogleGenAI;
    try {
      ai = new GoogleGenAI({ apiKey });
    } catch (initError: any) {
      console.error('[AI-Chat] Failed to initialize GoogleGenAI:', initError.message);
      await saveFallbackResponse(ticketId, FALLBACK_RESPONSE);
      return NextResponse.json({ response: FALLBACK_RESPONSE });
    }

    // 1. Fetch chat history for context
    const { data: historyData } = await supabase
      .from('support_messages')
      .select('message, sender_role')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
      .limit(10);

    const contents: Array<{ role: string; parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }> }> = [];
    if (historyData) {
      for (const msg of historyData) {
        contents.push({
          role: msg.sender_role === 'customer' ? 'user' : 'model',
          parts: [{ text: msg.message }]
        });
      }
    }
    
    // Ensure the last message is the current user message
    if (!contents.length || contents[contents.length - 1].parts[0].text !== message) {
      contents.push({ role: 'user', parts: [{ text: message }] });
    }

    // Ensure contents don't start with 'model' role (Gemini requires 'user' first)
    while (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    // If contents is empty after filtering, add the user message
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: message }] });
    }

    // 2. Call Gemini with retry logic for rate limiting
    let response;
    const MAX_RETRIES = 2;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
            tools: [aiToolsDeclaration],
          }
        });
        break; // Success, exit retry loop
      } catch (genError: any) {
        const isRateLimit = genError.status === 429 || genError.message?.includes('RESOURCE_EXHAUSTED');
        const isAuthError = genError.status === 401 || genError.status === 403 || genError.message?.includes('API_KEY_INVALID');
        
        if (isRateLimit && attempt < MAX_RETRIES) {
          // Wait before retrying (exponential backoff: 2s, 4s)
          const waitMs = Math.pow(2, attempt + 1) * 1000;
          console.warn(`[AI-Chat] Rate limited (429). Retrying in ${waitMs}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
          continue;
        }
        
        if (isRateLimit) {
          console.error('[AI-Chat] ⚠️ Gemini quota exhausted. Check billing at https://ai.dev/rate-limit');
        } else if (isAuthError) {
          console.error('[AI-Chat] ⚠️ GEMINI_API_KEY is invalid. Update in .env.local from https://aistudio.google.com/apikey');
        } else {
          console.error('[AI-Chat] Gemini generateContent failed:', genError.message, genError.status || '');
        }
        
        await saveFallbackResponse(ticketId, FALLBACK_RESPONSE);
        return NextResponse.json({ response: FALLBACK_RESPONSE });
      }
    }

    let finalResponseText = response.text || '';
    
    // 3. Handle tool/function calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      
      try {
        const result = await executeAiTool(call.name || '', call.args as Record<string, any>);
        
        // Send tool result back to Gemini for final answer
        contents.push({
          role: 'model',
          parts: [{ functionCall: call }]
        });
        contents.push({
          role: 'user',
          parts: [{ functionResponse: { name: call.name || '', response: result } }]
        });
        
        const followUpResponse = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents,
          config: { systemInstruction: systemPrompt, tools: [aiToolsDeclaration] }
        });
        
        finalResponseText = followUpResponse.text || '';
      } catch (toolError: any) {
        console.error('[AI-Chat] Tool execution/follow-up failed:', toolError.message);
        // If tool fails, use the initial text response if available
        if (!finalResponseText) {
          finalResponseText = 'Mohon maaf, saya mengalami kendala saat mencari informasi Anda. Silakan coba lagi atau hubungi tim kami.';
        }
      }
    }

    // 4. Ensure we have a response
    if (!finalResponseText.trim()) {
      finalResponseText = FALLBACK_RESPONSE;
    }

    // 5. Save AI response to Supabase
    await supabase.from('support_messages').insert({
      ticket_id: ticketId,
      sender_id: null,
      sender_role: 'admin',
      message: finalResponseText,
      is_auto_reply: true,
    });

    return NextResponse.json({ response: finalResponseText });

  } catch (error: any) {
    console.error('[AI-Chat] Unexpected error:', error.message || error);
    // Even on unexpected errors, return a user-friendly response
    return NextResponse.json({ 
      response: FALLBACK_RESPONSE 
    });
  }
}

// Helper to save fallback response to DB
async function saveFallbackResponse(ticketId: string, responseText: string) {
  try {
    await supabase.from('support_messages').insert({
      ticket_id: ticketId,
      sender_id: null,
      sender_role: 'admin',
      message: responseText,
      is_auto_reply: true,
    });
  } catch (dbError: any) {
    console.error('[AI-Chat] Failed to save fallback response to DB:', dbError.message);
  }
}
