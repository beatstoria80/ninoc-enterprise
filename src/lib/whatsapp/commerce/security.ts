/**
 * NINOC WhatsApp Commerce — Security Module
 *
 * Handles webhook signature verification, anti-replay protection,
 * and message deduplication for the WhatsApp Commerce channel.
 *
 * CRITICAL: This module is the first line of defense against
 * webhook spoofing and replay attacks. Do NOT bypass these checks.
 */

import crypto from 'crypto';

// ─── HMAC-SHA256 Signature Verification ────────────────────────────────────────

/**
 * Verify the X-Hub-Signature-256 header from Meta's webhook.
 *
 * Meta signs every webhook POST request with HMAC-SHA256 using
 * the App Secret as the key. We MUST verify this to ensure the
 * request genuinely came from Meta, not from an attacker.
 *
 * @param rawBody - The raw request body as string (MUST be raw, not parsed JSON)
 * @param signatureHeader - Value of the 'x-hub-signature-256' header
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) {
    console.error('[WA-Commerce-Security] Missing x-hub-signature-256 header');
    return false;
  }

  const appSecret = process.env.WA_APP_SECRET;
  if (!appSecret) {
    console.error('[WA-Commerce-Security] WA_APP_SECRET not configured');
    return false;
  }

  const expectedSignature =
    'sha256=' +
    crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );
  } catch {
    // Buffers of different lengths will throw — this means invalid signature
    console.error('[WA-Commerce-Security] Signature length mismatch');
    return false;
  }
}

// ─── Anti-Replay: Timestamp Validation ─────────────────────────────────────────

const MAX_TIMESTAMP_AGE_SECONDS = 300; // 5 minutes

/**
 * Validate that the message timestamp is within acceptable range.
 * Rejects messages older than 5 minutes to prevent replay attacks.
 *
 * @param messageTimestamp - Unix timestamp from the webhook payload (seconds)
 * @returns true if timestamp is within acceptable range
 */
export function isTimestampValid(messageTimestamp: string | number): boolean {
  const timestamp =
    typeof messageTimestamp === 'string'
      ? parseInt(messageTimestamp, 10)
      : messageTimestamp;

  if (isNaN(timestamp) || timestamp <= 0) {
    console.error(
      '[WA-Commerce-Security] Invalid timestamp:',
      messageTimestamp
    );
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const ageSeconds = Math.abs(nowSeconds - timestamp);

  if (ageSeconds > MAX_TIMESTAMP_AGE_SECONDS) {
    console.warn(
      `[WA-Commerce-Security] Stale message: ${ageSeconds}s old (max ${MAX_TIMESTAMP_AGE_SECONDS}s)`
    );
    return false;
  }

  return true;
}

// ─── Message Deduplication (In-Memory LRU) ─────────────────────────────────────

/**
 * Simple LRU-style set for message deduplication.
 * Prevents processing the same webhook delivery twice
 * (Meta may retry webhooks if they don't get a 200 response quickly).
 *
 * Uses a Map to maintain insertion order for LRU eviction.
 */
const MAX_DEDUP_ENTRIES = 5000;
const processedMessageIds = new Map<string, number>(); // messageId → timestamp

/**
 * Check if a message has already been processed.
 * If not, mark it as processed.
 *
 * @param messageId - The unique WA message ID (wamid.xxx)
 * @returns true if this is a NEW message (not a duplicate)
 */
export function deduplicateMessage(messageId: string): boolean {
  if (!messageId) return true; // No ID = can't dedup, process anyway

  if (processedMessageIds.has(messageId)) {
    console.warn(
      `[WA-Commerce-Security] Duplicate message detected: ${messageId}`
    );
    return false;
  }

  // Add to dedup set
  processedMessageIds.set(messageId, Date.now());

  // Evict oldest entries if over capacity (LRU)
  if (processedMessageIds.size > MAX_DEDUP_ENTRIES) {
    const oldestKey = processedMessageIds.keys().next().value;
    if (oldestKey !== undefined) {
      processedMessageIds.delete(oldestKey);
    }
  }

  return true;
}

// ─── Rate Limiting (Per Phone Number) ──────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // Max 30 messages per minute per phone

const rateLimitMap = new Map<
  string,
  { count: number; windowStart: number }
>();

/**
 * Check if a phone number has exceeded the rate limit.
 *
 * @param phoneNumber - The sender's phone number
 * @returns true if the request is within rate limits
 */
export function checkRateLimit(phoneNumber: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(phoneNumber);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitMap.set(phoneNumber, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    console.warn(
      `[WA-Commerce-Security] Rate limit exceeded for ${phoneNumber}: ${entry.count}/${RATE_LIMIT_MAX_REQUESTS} in window`
    );
    return false;
  }

  entry.count++;
  return true;
}

// ─── Cleanup (periodic eviction for long-running serverless) ───────────────────

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
let lastCleanup = Date.now();

/**
 * Run periodic cleanup of dedup and rate limit maps.
 * Should be called on each webhook request to prevent memory leaks.
 */
export function runSecurityCleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;

  // Cleanup old dedup entries (older than 10 minutes)
  const tenMinutesAgo = now - 10 * 60 * 1000;
  for (const [key, timestamp] of processedMessageIds) {
    if (timestamp < tenMinutesAgo) {
      processedMessageIds.delete(key);
    }
  }

  // Cleanup old rate limit windows
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(key);
    }
  }
}
