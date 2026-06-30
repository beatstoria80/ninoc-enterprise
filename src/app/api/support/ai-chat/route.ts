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

export async function POST(req: Request) {
  try {
    const { ticketId, message } = await req.json();

    if (!ticketId || !message) {
      return NextResponse.json({ error: 'Missing ticketId or message' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. Falling back to generic response.");
      return NextResponse.json({ 
        response: 'Mohon maaf, layanan AI Customer Service kami saat ini sedang dalam pemeliharaan (API Key tidak ditemukan). Tim kami akan membalas pesan Anda secara manual segera.' 
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1. Fetch chat history
    const { data: historyData } = await supabase
      .from('support_messages')
      .select('message, sender_role')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
      .limit(10); // get last 10 messages for context

    const contents = [];
    if (historyData) {
      for (const msg of historyData) {
        contents.push({
          role: msg.sender_role === 'customer' ? 'user' : 'model',
          parts: [{ text: msg.message }]
        });
      }
    }
    
    // Add current user message if not already in history (it should be, but just in case)
    if (!contents.length || contents[contents.length - 1].parts[0].text !== message) {
        contents.push({ role: 'user', parts: [{ text: message }] });
    }

    // 2. Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        tools: [aiToolsDeclaration],
      }
    });

    let finalResponseText = response.text || '';
    
    // 3. Check for tool calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      const result = await executeAiTool(call.name || '', call.args as Record<string, any>);
      
      // Send tool result back to Gemini to get final answer
      contents.push({
          role: 'model',
          parts: [{ functionCall: call }]
      });
      contents.push({
          role: 'user',
          parts: [{ functionResponse: { name: call.name || '', response: result } }]
      });
      
      const followUpResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: { systemInstruction: systemPrompt, tools: [aiToolsDeclaration] }
      });
      
      finalResponseText = followUpResponse.text || '';
    }

    // 4. Save response to Supabase
    if (finalResponseText) {
      await supabase.from('support_messages').insert({
        ticket_id: ticketId,
        sender_id: null,
        sender_role: 'admin',
        message: finalResponseText,
        is_auto_reply: true,
      });
    }

    return NextResponse.json({ response: finalResponseText });

  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
