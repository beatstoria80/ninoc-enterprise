/**
 * NINOC WhatsApp Cloud API — Server-Side Service
 *
 * This file MUST ONLY be imported in server-side contexts:
 * - API Routes (route.ts)
 * - Server Components
 * - Background Jobs / Cron
 *
 * NEVER import this in client components (.tsx with "use client")
 * because it contains WHATSAPP_ACCESS_TOKEN (secret).
 */

const WHATSAPP_API_VERSION = 'v18.0';
const BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WASendResult {
  success: boolean;
  message_id?: string;
  error?: string;
  error_code?: string;
}

export interface WAComponent {
  type: 'header' | 'body' | 'button';
  parameters?: WAParameter[];
}

export interface WAParameter {
  type: 'text' | 'image' | 'document' | 'video';
  text?: string;
  image?: { link: string };
  document?: { link: string; filename: string };
  video?: { link: string };
}

export const WA_TEMPLATES = {
  INVOICE_SUCCESS: 'invoice_success',
  SHIPPING_UPDATE: 'shipping_update',
  ORDER_DELIVERED: 'order_delivered',
  PROMO_BROADCAST: 'promo_broadcast',
  RETUR_STATUS_UPDATE: 'retur_status_update',
  ORDER_CANCELLED: 'order_cancelled',
} as const;

export type WATemplateKey = keyof typeof WA_TEMPLATES;

// ─── Phone Number Formatter ────────────────────────────────────────────────────

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  if (digits.startsWith('62') && digits.length >= 10 && digits.length <= 15) {
    return digits;
  }
  console.warn(`[WhatsApp] Invalid phone format: ${phone} → ${digits}`);
  return '';
}

// ─── Core HTTP Client ──────────────────────────────────────────────────────────

async function callWhatsAppAPI(payload: Record<string, unknown>): Promise<WASendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    const err = 'WhatsApp credentials not configured (WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN)';
    console.error(`[WhatsApp] ${err}`);
    return { success: false, error: err };
  }

  try {
    const res = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[WhatsApp] API error:', data);
      return {
        success: false,
        error: data.error?.message || 'WhatsApp API error',
        error_code: String(data.error?.code || res.status),
      };
    }

    return { success: true, message_id: data.messages?.[0]?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    console.error('[WhatsApp] Call error:', msg);
    return { success: false, error: msg };
  }
}

// ─── Template Message Sender ───────────────────────────────────────────────────

export async function sendTemplateMessage(
  templateName: string,
  to: string,
  components: WAComponent[] = []
): Promise<WASendResult> {
  if (!to) return { success: false, error: 'Missing recipient phone' };

  const firstAttempt = await callWhatsAppAPI({
    messaging_product: 'whatsapp',
    to,
    recipient_type: 'individual',
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'id' },
      components,
    },
  });

  // If template expects 0 parameters (e.g. static template), automatically retry without components
  if (!firstAttempt.success && firstAttempt.error_code === '132000' && components.length > 0) {
    console.warn(`[WhatsApp] Template ${templateName} parameter mismatch (132000). Retrying without components...`);
    return callWhatsAppAPI({
      messaging_product: 'whatsapp',
      to,
      recipient_type: 'individual',
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'id' },
      },
    });
  }

  return firstAttempt;
}

// ─── Public Message Functions ──────────────────────────────────────────────────

/**
 * Send invoice notification WhatsApp message
 * Triggered from payment webhook when payment_status = success
 */
export async function sendInvoiceWA(params: {
  phone: string;
  customer_name: string;
  order_id: string;
  total_price: string;
  payment_url?: string;
}): Promise<WASendResult> {
  return sendTemplateMessage(WA_TEMPLATES.INVOICE_SUCCESS, params.phone, [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.customer_name },
        { type: 'text', text: params.order_id },
        { type: 'text', text: params.total_price },
      ],
    },
  ]);
}

/**
 * Send shipping / tracking update WhatsApp message
 * Triggered from admin when order status → shipped
 */
export async function sendShippingWA(params: {
  phone: string;
  customer_name: string;
  order_id: string;
  tracking_id: string;
  courier_name: string;
  estimated_delivery?: string;
}): Promise<WASendResult> {
  return sendTemplateMessage(WA_TEMPLATES.SHIPPING_UPDATE, params.phone, [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.customer_name },
        { type: 'text', text: params.order_id },
        { type: 'text', text: params.tracking_id },
        { type: 'text', text: params.courier_name },
        { type: 'text', text: params.estimated_delivery || '2-5 hari kerja' },
      ],
    },
  ]);
}

/**
 * Send order delivered notification
 */
export async function sendDeliveredWA(params: {
  phone: string;
  customer_name: string;
  order_id: string;
}): Promise<WASendResult> {
  return sendTemplateMessage(WA_TEMPLATES.ORDER_DELIVERED, params.phone, [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.customer_name },
        { type: 'text', text: params.order_id },
      ],
    },
  ]);
}

/**
 * Send broadcast message to single recipient
 */
export async function sendBroadcastWA(params: {
  phone: string;
  customer_name: string;
  promo_text: string;
}): Promise<WASendResult> {
  return sendTemplateMessage(WA_TEMPLATES.PROMO_BROADCAST, params.phone, [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.customer_name },
        { type: 'text', text: params.promo_text },
      ],
    },
  ]);
}

/**
 * Send retur status update notification
 */
export async function sendWAReturStatusUpdate(params: {
  phone: string;
  customer_name: string;
  order_id: string;
  new_status: string;
  additional_notes?: string;
}): Promise<WASendResult> {
  return sendTemplateMessage(WA_TEMPLATES.RETUR_STATUS_UPDATE, params.phone, [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.customer_name || 'Customer' },
        { type: 'text', text: params.order_id },
        { type: 'text', text: params.new_status },
        { type: 'text', text: params.additional_notes || '-' },
      ],
    },
  ]);
}

// ─── Rate Limiter ──────────────────────────────────────────────────────────────
// Meta limit: 80 messages/minute per phone number
// Simple token-bucket: 80 messages per 60 seconds

let messageCount = 0;
let windowStart = Date.now();

export async function sendWithRateLimit(
  fn: () => Promise<WASendResult>
): Promise<WASendResult> {
  const now = Date.now();
  if (now - windowStart > 60_000) {
    messageCount = 0;
    windowStart = now;
  }

  if (messageCount >= 75) {
    const waitMs = 60_000 - (now - windowStart);
    console.log(`[WhatsApp] Rate limit approaching, waiting ${waitMs}ms`);
    await new Promise(resolve => setTimeout(resolve, waitMs));
    messageCount = 0;
    windowStart = Date.now();
  }

  messageCount++;
  return fn();
}

// ─── Configuration Status ──────────────────────────────────────────────────────

export function isWAConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_WABA_ID
  );
}

/**
 * Send order cancellation and refund status update via WhatsApp
 */
export async function sendCancelledWA(params: {
  phone: string;
  customer_name: string;
  order_id: string;
  reason: string;
  refund_status: string;
}): Promise<WASendResult> {
  return sendTemplateMessage(WA_TEMPLATES.ORDER_CANCELLED, params.phone, [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.customer_name || 'Pelanggan' },
        { type: 'text', text: params.order_id },
        { type: 'text', text: params.reason || 'Dibatalkan oleh Admin' },
        { type: 'text', text: params.refund_status || 'Diproses' },
      ],
    },
  ]);
}

