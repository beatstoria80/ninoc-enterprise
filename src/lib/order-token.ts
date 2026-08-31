/**
 * NINOC WhatsApp Commerce — Order Token Generator
 *
 * Generates and validates secure, time-limited tokens for
 * cross-channel handoff (Web → WhatsApp).
 *
 * When a user clicks "Lanjut via WhatsApp" on the checkout page,
 * we generate a token that encodes their cart and redirect them
 * to WhatsApp with this token. The bot uses the token to retrieve
 * the cart data and start the checkout flow.
 *
 * Security: UUID v4 + random suffix = 128+ bits of entropy.
 * Tokens expire after 24 hours.
 */

import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { CartSnapshot, WAOrderSession } from './whatsapp/commerce/types';

// ─── Token Generation ──────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure order token.
 *
 * Format: "NINOC-{UUID}-{random6chars}"
 * Example: "NINOC-a1b2c3d4-e5f6-7890-abcd-ef1234567890-X7K9P2"
 *
 * The prefix "NINOC-" makes it easy for the WA bot to identify
 * order tokens in incoming messages.
 */
export function generateOrderToken(): string {
  const uuid = crypto.randomUUID();
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `NINOC-${uuid}-${suffix}`;
}

// ─── Session Management ────────────────────────────────────────────────────────

/**
 * Create a new WA order session with cart snapshot.
 * Called when user clicks "Lanjut via WhatsApp" on checkout page.
 */
export async function createOrderSession(
  cartSnapshot: CartSnapshot,
  isSandbox = true
): Promise<{ token: string; deepLink: string } | { error: string }> {
  const token = generateOrderToken();
  const supabase = getSupabaseAdmin();

  const waPhoneNumber =
    process.env.WA_COMMERCE_BUSINESS_PHONE ||
    process.env.WHATSAPP_BUSINESS_PHONE ||
    process.env.NEXT_PUBLIC_ADMIN_WA_NUMBER ||
    '';

  if (!waPhoneNumber) {
    return { error: 'WhatsApp business phone number not configured' };
  }

  // Insert session into database
  const { error } = await supabase.from('wa_commerce_sessions').insert({
    order_token: token,
    cart_snapshot: cartSnapshot,
    payment_status: 'pending',
    is_sandbox: isSandbox,
    // expires_at is set by database default (NOW() + 24 hours)
  });

  if (error) {
    console.error('[WA-Commerce] Failed to create order session:', error);
    return { error: 'Failed to create order session' };
  }

  // Generate WhatsApp deep link
  // User sends the token to our WA business number to start the flow
  const message = encodeURIComponent(
    `Hai NINOC! Saya ingin melanjutkan order saya.\n\nKode: ${token}`
  );
  const deepLink = `https://wa.me/${waPhoneNumber}?text=${message}`;

  return { token, deepLink };
}

/**
 * Retrieve an order session by token.
 * Validates that the token exists and hasn't expired.
 */
export async function getOrderSession(
  token: string
): Promise<WAOrderSession | null> {
  // Validate token format
  if (!token || !token.startsWith('NINOC-')) {
    return null;
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('wa_commerce_sessions')
    .select('*')
    .eq('order_token', token)
    .single();

  if (error || !data) {
    console.warn(`[WA-Commerce] Order session not found for token: ${token}`);
    return null;
  }

  // Check expiration
  const now = new Date();
  const expiresAt = new Date(data.expires_at);
  if (now > expiresAt) {
    console.warn(`[WA-Commerce] Order session expired: ${token}`);
    return null;
  }

  return data as WAOrderSession;
}

/**
 * Update an order session (e.g., add shipping address, courier, payment status).
 */
export async function updateOrderSession(
  token: string,
  updates: Partial<
    Pick<
      WAOrderSession,
      | 'user_phone'
      | 'shipping_address'
      | 'selected_courier'
      | 'midtrans_snap_token'
      | 'payment_status'
      | 'wa_message_id'
      | 'bot_state'
    >
  >
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('wa_commerce_sessions')
    .update(updates)
    .eq('order_token', token);

  if (error) {
    console.error(`[WA-Commerce] Failed to update session ${token}:`, error);
    return false;
  }

  return true;
}

/**
 * Extract order token from an incoming WhatsApp message text.
 * Searches for the "NINOC-{uuid}-{suffix}" pattern.
 */
export function extractOrderToken(messageText: string): string | null {
  const match = messageText.match(
    /NINOC-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[A-F0-9]{6}/i
  );
  return match ? match[0] : null;
}

/**
 * Retrieve the active order session for a specific phone number.
 */
export async function getActiveSessionByPhone(
  phone: string
): Promise<WAOrderSession | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('wa_commerce_sessions')
    .select('*')
    .eq('user_phone', phone)
    .eq('payment_status', 'pending')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as WAOrderSession;
}
