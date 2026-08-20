import crypto from 'crypto';

// Server-side environment variables
const CAPI_TOKEN = process.env.META_CAPI_TOKEN;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const META_GRAPH_VERSION = 'v19.0';

/**
 * Normalizes and hashes user data according to Meta CAPI requirements
 * (Lowercase, trimmed, SHA256 hashed hex string)
 */
function hashData(data: string | undefined): string | undefined {
  if (!data) return undefined;
  const normalized = data.trim().toLowerCase();
  if (normalized === '') return undefined;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Normalizes phone numbers (removes all non-numeric characters except leading +)
 */
function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  // Meta expects country code without leading + or 00, just numbers.
  // e.g. 628211983774
  let num = phone.replace(/[^\d]/g, '');
  if (num.startsWith('0')) {
    num = '62' + num.substring(1);
  }
  return hashData(num);
}

export interface PurchaseEventPayload {
  orderId: string;
  value: number;
  currency?: string;
  email?: string;
  phone?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  items?: Array<{ id: string; quantity: number; item_price: number }>;
}

/**
 * Sends a Purchase event to Meta Conversions API (CAPI)
 */
export async function sendPurchaseEventCAPI(payload: PurchaseEventPayload) {
  if (!CAPI_TOKEN || !PIXEL_ID) {
    console.warn('[Meta CAPI] Skipping event: Token or Pixel ID not configured.');
    return;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Construct the event data array as expected by Graph API
    const eventData = {
      event_name: 'Purchase',
      event_time: timestamp,
      action_source: 'website',
      user_data: {
        em: [hashData(payload.email)].filter(Boolean),
        ph: [normalizePhone(payload.phone)].filter(Boolean),
        client_ip_address: payload.clientIpAddress,
        client_user_agent: payload.clientUserAgent,
      },
      custom_data: {
        currency: payload.currency || 'IDR',
        value: payload.value,
        contents: payload.items?.map(item => ({
          id: item.id,
          quantity: item.quantity,
          item_price: item.item_price,
        })),
      },
      event_id: `purchase_${payload.orderId}`, // Deduplication key
    };

    const apiUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [eventData] }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Meta CAPI] Error response:', JSON.stringify(result));
    } else {
      console.log(`[Meta CAPI] Purchase event sent successfully for order ${payload.orderId}. Events received: ${result.events_received}`);
    }
  } catch (error) {
    console.error('[Meta CAPI] Failed to send event:', error);
  }
}
