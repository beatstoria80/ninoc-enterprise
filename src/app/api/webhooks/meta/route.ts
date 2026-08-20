import { NextResponse } from 'next/server';

// Meta Business Agent & Instagram/FB Webhook receiver
// Docs: https://developers.facebook.com/docs/messenger-platform/webhooks

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'ninoc_meta_agent_2026';

/**
 * GET is used by Meta to verify the webhook URL.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[Meta Webhook] Verification successful.');
      // Meta expects the challenge string back as plain text
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.warn('[Meta Webhook] Verification failed. Token mismatch.');
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return new NextResponse('Invalid request', { status: 400 });
}

/**
 * POST is used to receive messages and events from Meta (Business Agent AI).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if it's a page event
    if (body.object === 'page' || body.object === 'instagram') {
      // Iterate over each entry - there may be multiple if batched
      body.entry?.forEach((entry: any) => {
        // Gets the body of the webhook event
        const webhook_event = entry.messaging?.[0];
        console.log('[Meta Webhook] Received event:', JSON.stringify(webhook_event));
        
        // TODO: In the future, pass webhook_event to AI logic 
        // or support ticketing system.
      });

      // Returns a '200 OK' response to all requests
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } else {
      // Return a '404 Not Found' if event is not from a page subscription
      return new NextResponse('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error('[Meta Webhook] Error processing event:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
