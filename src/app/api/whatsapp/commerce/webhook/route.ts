/**
 * NINOC WhatsApp Commerce — Webhook Handler
 *
 * API route that receives incoming messages from Meta WhatsApp Cloud API.
 *
 * GET  → Meta webhook verification (challenge-response handshake)
 * POST → Process incoming messages (text, interactive replies, flow responses)
 *
 * Security layers:
 * 1. HMAC-SHA256 signature verification
 * 2. Timestamp validation (anti-replay, max 5 minutes)
 * 3. Message deduplication (in-memory LRU)
 * 4. Rate limiting (30 msg/min per phone)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookSignature,
  isTimestampValid,
  deduplicateMessage,
  checkRateLimit,
  runSecurityCleanup,
} from '@/lib/whatsapp/commerce/security';
import {
  sendTextMessage,
  sendInteractiveMessage,
  markAsRead,
} from '@/lib/whatsapp/commerce/client';
import {
  buildWelcomeMessage,
  buildOrderSummary,
} from '@/lib/whatsapp/commerce/message-builder';
import {
  extractOrderToken,
  getOrderSession,
  updateOrderSession,
} from '@/lib/order-token';
import { isFeatureEnabled } from '@/lib/feature-flags';
import type {
  WAWebhookPayload,
  WAIncomingMessage,
  WAContact,
} from '@/lib/whatsapp/commerce/types';
import { BUTTON_IDS } from '@/lib/whatsapp/commerce/types';

// ─── GET: Webhook Verification ─────────────────────────────────────────────────

/**
 * Meta sends a GET request to verify the webhook URL.
 * We must respond with the hub.challenge value if the verify token matches.
 *
 * @see https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WA_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WA-Commerce-Webhook] Verification successful ✅');
    return new NextResponse(challenge, { status: 200 });
  }

  console.error('[WA-Commerce-Webhook] Verification failed ❌', {
    mode,
    tokenMatch: token === verifyToken,
  });
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// ─── POST: Process Incoming Messages ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Run periodic cleanup of security maps
  runSecurityCleanup();

  // 1. Read raw body for signature verification
  const rawBody = await req.text();

  // 2. Verify HMAC-SHA256 signature
  const signature = req.headers.get('x-hub-signature-256');
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[WA-Commerce-Webhook] Invalid signature — rejecting');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3. Parse payload
  let payload: WAWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 4. Respond 200 immediately (Meta requires fast response)
  //    Process messages asynchronously after responding.
  //    In serverless (Vercel), we process inline since there's no
  //    background thread, but we keep processing fast.

  // 5. Process each entry/change
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue;

      const value = change.value;
      const contacts = value.contacts || [];
      const messages = value.messages || [];

      // Process message statuses (delivery reports)
      if (value.statuses) {
        for (const status of value.statuses) {
          console.log(
            `[WA-Commerce-Webhook] Status update: ${status.id} → ${status.status}`
          );
          // TODO: Update wa_commerce_message_log with delivery status
        }
      }

      // Process incoming messages
      for (const message of messages) {
        const contact = contacts.find((c) => c.wa_id === message.from);
        await handleIncomingMessage(message, contact || null);
      }
    }
  }

  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

// ─── Message Handler ───────────────────────────────────────────────────────────

async function handleIncomingMessage(
  message: WAIncomingMessage,
  contact: WAContact | null
): Promise<void> {
  const from = message.from;
  const messageId = message.id;
  const timestamp = message.timestamp;

  console.log(
    `[WA-Commerce-Webhook] Incoming ${message.type} from ${from}`,
    contact?.profile?.name || 'Unknown'
  );

  // Security checks
  if (!isTimestampValid(timestamp)) {
    console.warn(`[WA-Commerce-Webhook] Stale message from ${from} — skipping`);
    return;
  }

  if (!deduplicateMessage(messageId)) {
    console.warn(`[WA-Commerce-Webhook] Duplicate ${messageId} — skipping`);
    return;
  }

  if (!checkRateLimit(from)) {
    console.warn(`[WA-Commerce-Webhook] Rate limited ${from} — skipping`);
    await sendTextMessage(
      from,
      '⚠️ Terlalu banyak pesan. Mohon tunggu sebentar.'
    );
    return;
  }

  // Mark message as read
  await markAsRead(messageId);

  // Check if commerce feature is enabled
  if (!isFeatureEnabled('WA_COMMERCE_ENABLED')) {
    // Feature disabled — send simple fallback
    await sendTextMessage(
      from,
      'Hai! Terima kasih menghubungi NINOC. 🙏\n\nUntuk berbelanja, silakan kunjungi website kami di ninoc.store'
    );
    return;
  }

  // Route by message type
  switch (message.type) {
    case 'text':
      await handleTextMessage(from, message.text?.body || '', contact);
      break;

    case 'interactive':
      await handleInteractiveReply(from, message);
      break;

    case 'nfm_reply':
      await handleFlowResponse(from, message);
      break;

    default:
      // Unsupported message type
      await sendTextMessage(
        from,
        'Maaf, saya belum bisa memproses jenis pesan ini. Silakan kirim teks atau gunakan tombol yang tersedia. 🙏'
      );
      break;
  }
}

// ─── Text Message Handler ──────────────────────────────────────────────────────

async function handleTextMessage(
  from: string,
  text: string,
  contact: WAContact | null
): Promise<void> {
  // Check if the message contains an order token
  const token = extractOrderToken(text);

  if (token) {
    // User sent an order token — start checkout flow
    const session = await getOrderSession(token);

    if (!session) {
      await sendTextMessage(
        from,
        '❌ Kode order tidak ditemukan atau sudah kedaluwarsa.\n\nSilakan buat order baru di ninoc.store'
      );
      return;
    }

    if (session.payment_status === 'paid') {
      await sendTextMessage(
        from,
        '✅ Order ini sudah dibayar. Pesanan kamu sedang diproses!'
      );
      return;
    }

    // Link phone number to session
    await updateOrderSession(token, { user_phone: from });

    // Send order summary with action buttons
    const summary = buildOrderSummary(session.cart_snapshot, token);
    await sendInteractiveMessage(from, summary);
    return;
  }

  // No order token — general message
  // Check for keywords
  const lowerText = text.toLowerCase().trim();

  if (
    lowerText.includes('halo') ||
    lowerText.includes('hai') ||
    lowerText.includes('hi') ||
    lowerText === 'menu'
  ) {
    const welcome = buildWelcomeMessage();
    await sendInteractiveMessage(from, welcome);
    return;
  }

  if (
    lowerText.includes('cek pesanan') ||
    lowerText.includes('status order') ||
    lowerText.includes('track')
  ) {
    await sendTextMessage(
      from,
      '📦 Untuk cek status pesanan, silakan kirimkan kode order kamu (format: NINOC-xxxxx).\n\nAtau kunjungi ninoc.store/track untuk tracking lengkap.'
    );
    return;
  }

  // Default: send welcome message
  const welcome = buildWelcomeMessage();
  await sendInteractiveMessage(from, welcome);
}

// ─── Interactive Reply Handler ─────────────────────────────────────────────────

async function handleInteractiveReply(
  from: string,
  message: WAIncomingMessage
): Promise<void> {
  const reply = message.interactive;
  if (!reply) return;

  const buttonId =
    reply.button_reply?.id || reply.list_reply?.id || '';

  console.log(`[WA-Commerce-Webhook] Interactive reply: ${buttonId}`);

  switch (buttonId) {
    case BUTTON_IDS.CONTINUE_CHECKOUT:
      // TODO: Phase 2 — Check if address exists, trigger Flow or courier selection
      await sendTextMessage(
        from,
        '🚧 Fitur checkout via WhatsApp sedang dalam pengembangan. Stay tuned! 🎉\n\nSementara ini, silakan checkout di ninoc.store'
      );
      break;

    case BUTTON_IDS.EDIT_CART:
      await sendTextMessage(
        from,
        '🛒 Silakan edit keranjang belanja kamu di website:\n👉 ninoc.store/cart'
      );
      break;

    case BUTTON_IDS.CANCEL_ORDER:
      await sendTextMessage(
        from,
        '❌ Order dibatalkan. Keranjang belanja kamu tetap tersimpan di website.\n\nKunjungi ninoc.store untuk melanjutkan kapan saja.'
      );
      break;

    case BUTTON_IDS.BROWSE_PRODUCTS:
      await sendTextMessage(
        from,
        '🛍️ Kunjungi koleksi lengkap kami di:\n👉 ninoc.store/shop\n\nSetelah menemukan produk yang kamu suka, tambahkan ke keranjang dan pilih "Lanjut via WhatsApp" saat checkout!'
      );
      break;

    case BUTTON_IDS.CHECK_ORDER:
      await sendTextMessage(
        from,
        '📦 Kirimkan kode order kamu (format: NINOC-xxxxx) untuk cek status.\n\nAtau kunjungi ninoc.store/track'
      );
      break;

    case BUTTON_IDS.HELP:
      await sendTextMessage(
        from,
        '❓ *Bantuan NINOC*\n\n' +
          '1️⃣ *Cara Order via WA:*\n' +
          '   Pilih produk di ninoc.store → Checkout → Pilih "Lanjut via WhatsApp"\n\n' +
          '2️⃣ *Cek Status Pesanan:*\n' +
          '   Kirim kode order (NINOC-xxxxx)\n\n' +
          '3️⃣ *Hubungi CS:*\n' +
          '   Ketik "CS" untuk dihubungkan dengan tim kami\n\n' +
          '📧 Email: support@ninoc.store'
      );
      break;

    default:
      // Handle courier selection
      if (buttonId.startsWith('courier_')) {
        // TODO: Phase 2 — Process courier selection
        await sendTextMessage(
          from,
          '🚧 Pemilihan kurir sedang dikembangkan. Stay tuned!'
        );
      } else {
        await sendTextMessage(
          from,
          'Maaf, saya tidak mengenali pilihan tersebut. Ketik "menu" untuk melihat opsi.'
        );
      }
      break;
  }
}

// ─── Flow Response Handler ─────────────────────────────────────────────────────

async function handleFlowResponse(
  from: string,
  message: WAIncomingMessage
): Promise<void> {
  const flowReply = message.nfm_reply;
  if (!flowReply) return;

  console.log(
    '[WA-Commerce-Webhook] Flow response:',
    flowReply.name,
    flowReply.response_json
  );

  // TODO: Phase 2 — Process flow responses (address form, etc.)
  try {
    const responseData = JSON.parse(flowReply.response_json);
    console.log('[WA-Commerce-Webhook] Flow data:', responseData);

    await sendTextMessage(
      from,
      '✅ Data berhasil diterima! Sedang memproses...'
    );
  } catch (err) {
    console.error('[WA-Commerce-Webhook] Failed to parse flow response:', err);
    await sendTextMessage(
      from,
      '⚠️ Terjadi kesalahan. Silakan coba lagi atau hubungi CS kami.'
    );
  }
}
