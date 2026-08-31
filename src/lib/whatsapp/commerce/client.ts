/**
 * NINOC WhatsApp Commerce — Cloud API Client
 *
 * HTTP client for Meta WhatsApp Cloud API v21.0.
 * Handles sending interactive messages, Flows, CTA URLs,
 * and text messages for the commerce checkout flow.
 *
 * This builds ON TOP of the existing `src/lib/whatsapp.ts` client
 * (which handles template messages). This module adds support
 * for interactive messages and Flows needed for commerce.
 *
 * Uses separate env vars (WA_COMMERCE_*) to allow independent
 * sandbox testing without affecting production notification flow.
 */

import { formatPhoneNumber } from '@/lib/whatsapp';
import type {
  WACloudAPIConfig,
  WACommerceAPIResponse,
  WAOutgoingTextMessage,
  WAOutgoingInteractiveMessage,
  WAOutgoingCTAMessage,
} from './types';

// ─── Configuration ─────────────────────────────────────────────────────────────

const WA_COMMERCE_API_VERSION = 'v21.0';
const WA_COMMERCE_BASE_URL = `https://graph.facebook.com/${WA_COMMERCE_API_VERSION}`;

let cachedConfig: WACloudAPIConfig | null = null;

function getCommerceConfig(): WACloudAPIConfig {
  if (cachedConfig) return cachedConfig;

  cachedConfig = {
    apiVersion: WA_COMMERCE_API_VERSION,
    phoneNumberId:
      process.env.WA_COMMERCE_PHONE_NUMBER_ID ||
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      '',
    businessAccountId:
      process.env.WA_COMMERCE_WABA_ID ||
      process.env.WHATSAPP_WABA_ID ||
      '',
    accessToken:
      process.env.WA_COMMERCE_ACCESS_TOKEN ||
      process.env.WHATSAPP_ACCESS_TOKEN ||
      '',
    appSecret: process.env.WA_APP_SECRET || '',
    verifyToken: process.env.WA_VERIFY_TOKEN || '',
  };

  return cachedConfig;
}

/**
 * Check if WhatsApp Commerce is properly configured.
 */
export function isCommerceConfigured(): boolean {
  const config = getCommerceConfig();
  return !!(config.phoneNumberId && config.accessToken);
}

// ─── Core HTTP Client (with retry) ─────────────────────────────────────────────

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callCommerceAPI(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>,
  retries = 3,
  baseDelay = 1000
): Promise<WACommerceAPIResponse> {
  const config = getCommerceConfig();

  if (!config.phoneNumberId || !config.accessToken) {
    const err =
      'WhatsApp Commerce credentials not configured. Set WA_COMMERCE_PHONE_NUMBER_ID and WA_COMMERCE_ACCESS_TOKEN.';
    console.error(`[WA-Commerce] ${err}`);
    return { success: false, error: err };
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(
        `${WA_COMMERCE_BASE_URL}/${config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        // Retry on rate limit or server errors
        if (res.status === 429 || res.status >= 500) {
          throw new Error(
            `Transient error: ${res.status} - ${data.error?.message || 'Unknown'}`
          );
        }

        // Fatal errors — do not retry
        console.error(
          `[WA-Commerce] Fatal API error (attempt ${attempt}):`,
          data
        );
        return {
          success: false,
          error: data.error?.message || 'WhatsApp Commerce API error',
          error_code: String(data.error?.code || res.status),
        };
      }

      return { success: true, message_id: data.messages?.[0]?.id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.warn(`[WA-Commerce] Error (attempt ${attempt}): ${msg}`);

      if (attempt === retries) {
        console.error(
          `[WA-Commerce] Exhausted ${retries} retries. Giving up.`
        );
        return { success: false, error: msg };
      }

      const backoffMs = baseDelay * 2 ** (attempt - 1);
      console.log(`[WA-Commerce] Retrying in ${backoffMs}ms...`);
      await delay(backoffMs);
    }
  }

  return { success: false, error: 'Unexpected exit in retry loop' };
}

// ─── Public API: Send Messages ─────────────────────────────────────────────────

/**
 * Send a plain text message.
 */
export async function sendTextMessage(
  to: string,
  body: string
): Promise<WACommerceAPIResponse> {
  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid phone number format' };
  }

  const payload: WAOutgoingTextMessage = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'text',
    text: { body, preview_url: false },
  };

  return callCommerceAPI(payload);
}

/**
 * Send an interactive message (buttons or list).
 */
export async function sendInteractiveMessage(
  to: string,
  interactive: WAOutgoingInteractiveMessage['interactive']
): Promise<WACommerceAPIResponse> {
  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid phone number format' };
  }

  const payload: WAOutgoingInteractiveMessage = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'interactive',
    interactive,
  };

  return callCommerceAPI(payload);
}

/**
 * Send a CTA URL button (e.g., for Midtrans payment link).
 *
 * This creates a message with a single tappable button that
 * opens an external URL — perfect for payment gateway redirects.
 */
export async function sendCTAUrlMessage(
  to: string,
  bodyText: string,
  buttonText: string,
  url: string,
  options?: {
    headerText?: string;
    footerText?: string;
  }
): Promise<WACommerceAPIResponse> {
  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid phone number format' };
  }

  const payload: WAOutgoingCTAMessage = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      ...(options?.headerText && {
        header: { type: 'text', text: options.headerText },
      }),
      body: { text: bodyText },
      ...(options?.footerText && { footer: { text: options.footerText } }),
      action: {
        name: 'cta_url',
        parameters: {
          display_text: buttonText,
          url,
        },
      },
    },
  };

  return callCommerceAPI(payload);
}

/**
 * Send a WhatsApp Flow trigger message.
 *
 * This sends an interactive message that, when the user taps the CTA,
 * opens a WhatsApp Flow (native form experience) inside the chat.
 */
export async function sendFlowMessage(
  to: string,
  bodyText: string,
  flowCTA: string,
  flowId: string,
  flowToken: string,
  initialScreen: string,
  initialData?: Record<string, unknown>,
  options?: {
    headerText?: string;
    footerText?: string;
  }
): Promise<WACommerceAPIResponse> {
  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid phone number format' };
  }

  const payload: WAOutgoingInteractiveMessage = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'interactive',
    interactive: {
      type: 'flow',
      ...(options?.headerText && {
        header: { type: 'text', text: options.headerText },
      }),
      body: { text: bodyText },
      ...(options?.footerText && { footer: { text: options.footerText } }),
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: flowToken,
          flow_id: flowId,
          flow_cta: flowCTA,
          flow_action: 'navigate',
          flow_action_payload: {
            screen: initialScreen,
            ...(initialData && { data: initialData }),
          },
        },
      },
    },
  };

  return callCommerceAPI(payload);
}

/**
 * Send an image message (e.g., QRIS payment QR code).
 */
export async function sendImageMessage(
  to: string,
  imageUrl: string,
  caption?: string
): Promise<WACommerceAPIResponse> {
  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid phone number format' };
  }

  return callCommerceAPI({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'image',
    image: {
      link: imageUrl,
      ...(caption && { caption }),
    },
  });
}

/**
 * Mark a message as "read" (blue checkmarks).
 */
export async function markAsRead(
  messageId: string
): Promise<WACommerceAPIResponse> {
  const config = getCommerceConfig();

  if (!config.phoneNumberId || !config.accessToken) {
    return { success: false, error: 'Commerce credentials not configured' };
  }

  try {
    const res = await fetch(
      `${WA_COMMERCE_BASE_URL}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      return { success: false, error: `Mark-read failed: ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}
