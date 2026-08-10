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
  ORDER_PENDING: 'order_pending_id',
} as const;

export type WATemplateKey = keyof typeof WA_TEMPLATES;

// ─── Phone Number Formatter ────────────────────────────────────────────────────

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  else if (digits.startsWith('8')) digits = '62' + digits;
  
  if (digits.startsWith('62') && digits.length >= 10 && digits.length <= 15) {
    return digits;
  }
  console.warn(`[WhatsApp] Invalid phone format: ${phone} → ${digits}`);
  return '';
}

// ─── Core HTTP Client with Robust Exponential Backoff & Timeout ────────────────

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeTextParam(val: unknown, fallback = '-'): string {
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  if (!str) return fallback;
  return str.slice(0, 1024);
}

async function callWhatsAppAPI(payload: Record<string, unknown>, retries = 3, baseDelay = 1000): Promise<WASendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    const err = 'WhatsApp credentials not configured (WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN)';
    console.error(`[WhatsApp] ${err}`);
    return { success: false, error: err };
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10s fetch timeout protection
      });

      const data = await res.json();

      if (!res.ok) {
        // Retry on rate limit (429) or server errors (500+)
        if (res.status === 429 || res.status >= 500) {
          throw new Error(`Transient API Error: ${res.status} - ${data.error?.message || 'Unknown'}`);
        }

        // Fatal errors (e.g., 400 Bad Request) do not retry
        console.error(`[WhatsApp] Fatal API error on attempt ${attempt}:`, data);
        return {
          success: false,
          error: data.error?.message || 'WhatsApp API error',
          error_code: String(data.error?.code || res.status),
        };
      }

      return { success: true, message_id: data.messages?.[0]?.id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.warn(`[WhatsApp] Call error on attempt ${attempt}: ${msg}`);
      
      if (attempt === retries) {
        console.error(`[WhatsApp] Exhausted all ${retries} retries for payload. Giving up.`);
        return { success: false, error: msg };
      }
      
      const backoffMs = baseDelay * (2 ** (attempt - 1));
      console.log(`[WhatsApp] Retrying in ${backoffMs}ms...`);
      await delay(backoffMs);
    }
  }

  return { success: false, error: 'Unexpected exit in retry loop' };
}

// ─── Template Message Sender ───────────────────────────────────────────────────

export async function sendTemplateMessage(
  templateName: string,
  to: string,
  components: WAComponent[] = []
): Promise<WASendResult> {
  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) return { success: false, error: 'Invalid or missing recipient phone number' };

  // Sanitize components parameters text values
  const sanitizedComponents = components.map(comp => {
    if (!comp.parameters) return comp;
    return {
      ...comp,
      parameters: comp.parameters.map(p => {
        if (p.type === 'text') {
          return { ...p, text: sanitizeTextParam(p.text) };
        }
        return p;
      })
    };
  });

  const firstAttempt = await callWhatsAppAPI({
    messaging_product: 'whatsapp',
    to: formattedPhone,
    recipient_type: 'individual',
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'id' },
      components: sanitizedComponents,
    },
  });

  // If template expects 0 parameters (e.g. static template), automatically retry without components
  if (!firstAttempt.success && firstAttempt.error_code === '132000' && sanitizedComponents.length > 0) {
    console.warn(`[WhatsApp] Template ${templateName} parameter mismatch (132000). Retrying without components...`);
    return callWhatsAppAPI({
      messaging_product: 'whatsapp',
      to: formattedPhone,
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
 * Send order pending / checkout confirmation WhatsApp message
 * Triggered from checkout service when order is created but not yet paid
 */
export async function sendCheckoutPendingWA(params: {
  phone: string;
  customer_name: string;
  order_id: string;
  estimated_delivery?: string;
}): Promise<WASendResult> {
  return sendTemplateMessage(WA_TEMPLATES.ORDER_PENDING, params.phone, [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.customer_name },
        { type: 'text', text: params.order_id },
        { type: 'text', text: params.estimated_delivery || '2-5 hari kerja' },
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

// ─── Configuration Status ──────────────────────────────────────────────────────

export function isWAConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_WABA_ID
  );
}
