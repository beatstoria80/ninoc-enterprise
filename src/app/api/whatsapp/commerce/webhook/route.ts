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
  buildCourierSelection,
} from '@/lib/whatsapp/commerce/message-builder';
import {
  extractOrderToken,
  getOrderSession,
  updateOrderSession,
  getActiveSessionByPhone,
} from '@/lib/order-token';
import { getSnapApiSingleton } from '@/lib/midtrans';
import { isFeatureEnabled } from '@/lib/feature-flags';
import type {
  WAWebhookPayload,
  WAIncomingMessage,
  WAContact,
} from '@/lib/whatsapp/commerce/types';
import { BUTTON_IDS } from '@/lib/whatsapp/commerce/types';
import { parseAddressText } from '@/lib/whatsapp/commerce/address-parser';

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

  // 5. Process all messages concurrently to prevent Meta webhook timeout
  // Meta expects a 200 OK extremely fast. Processing sequentially causes 504 Gateway Timeouts.
  const messagePromises: Promise<void>[] = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue;

      const value = change.value;
      const contacts = value.contacts || [];
      const messages = value.messages || [];

      // Process message statuses (delivery reports) asynchronously
      if (value.statuses) {
        for (const status of value.statuses) {
          console.log(
            `[WA-Commerce-Webhook] Status update: ${status.id} → ${status.status}`
          );
          // TODO: Update wa_commerce_message_log with delivery status
        }
      }

      // Queue all incoming messages for concurrent processing
      for (const message of messages) {
        const contact = contacts.find((c) => c.wa_id === message.from);
        messagePromises.push(handleIncomingMessage(message, contact || null));
      }
    }
  }

  // Wait for all message processing to complete (or fail) safely
  if (messagePromises.length > 0) {
    const results = await Promise.allSettled(messagePromises);
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(
        `[WA-Commerce-Webhook] ${failures.length} messages failed to process:`,
        failures
      );
      // We still return 200 OK so Meta doesn't retry the entire batch
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

  // No order token — check if user is in an active session (e.g. typing address)
  const activeSession = await getActiveSessionByPhone(from);
  
  if (activeSession && activeSession.bot_state === 'pending') {
    // Treat this text as an address input
    const addressData = parseAddressText(text, from);
    
    if (!addressData) {
      await sendTextMessage(
        from, 
        '⚠️ Format alamat tidak dikenali.\n\nMohon pastikan mencantumkan *Kode Pos* (5 digit angka) agar kami bisa menghitung ongkos kirim. Silakan coba kirim ulang alamatnya.'
      );
      return;
    }

    // Save address and update state
    await updateOrderSession(activeSession.order_token, {
      shipping_address: addressData,
      bot_state: 'address_collected'
    });

    // Fetch Biteship couriers
    try {
      const apiKey = process.env.BITESHIP_API_KEY;
      if (!apiKey) throw new Error('Biteship API Key missing');

      const payload = {
        origin_postal_code: '40292',
        destination_postal_code: addressData.postal_code,
        items: activeSession.cart_snapshot.items.map(i => ({
          name: i.product_name,
          value: i.price,
          quantity: i.quantity,
          weight: i.weight_grams || 100
        })),
        couriers: 'jne,jnt,sicepat,grab,gojek'
      };

      const rateRes = await fetch('https://api.biteship.com/v1/rates/couriers', {
        method: 'POST',
        headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const rateData = await rateRes.json();
      if (!rateData.success || !rateData.pricing || rateData.pricing.length === 0) {
        await sendTextMessage(from, '⚠️ Gagal mendapatkan tarif pengiriman untuk kode pos tersebut. Silakan periksa kembali alamat atau kode pos kamu.');
        return;
      }

      const couriers = rateData.pricing.map((r: any) => ({
        courier_code: r.company,
        courier_name: r.courier_name,
        service_type: r.courier_service_code,
        service_name: r.courier_service_name,
        price: r.price,
        estimated_days: r.duration
      }));

      // Update state
      await updateOrderSession(activeSession.order_token, { bot_state: 'courier_selected' });

      // Send List Message
      const listMessage = buildCourierSelection(couriers);
      await sendInteractiveMessage(from, listMessage);
    } catch (e) {
      console.error('[Biteship Fetch Error]', e);
      await sendTextMessage(from, '⚠️ Maaf, layanan kurir sedang gangguan. Silakan coba beberapa saat lagi.');
    }

    return;
  }

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
      const activeSession = await getActiveSessionByPhone(from);
      if (!activeSession) {
        await sendTextMessage(from, '❌ Sesi order tidak ditemukan atau sudah kedaluwarsa. Silakan checkout ulang dari website.');
        break;
      }
      
      // Update bot state to pending (waiting for address)
      await updateOrderSession(activeSession.order_token, { bot_state: 'pending' });

      await sendTextMessage(
        from,
        '📍 *Informasi Pengiriman*\n\nMohon balas pesan ini dengan rincian alamat pengiriman kamu dengan format bebas, pastikan data berikut ada:\n\n- Nama Penerima\n- No HP\n- Kota/Kabupaten\n- Kode Pos (Wajib 5 angka)\n- Alamat Lengkap Jalan'
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
        const parts = buttonId.split('_'); // courier_jne_reg_15000
        if (parts.length >= 4) {
          const company = parts[1];
          const serviceType = parts[2];
          const price = parseInt(parts[3], 10);

          const activeSession = await getActiveSessionByPhone(from);
          if (activeSession && activeSession.shipping_address) {
            
            // Calculate Total
            const grossAmount = activeSession.cart_snapshot.subtotal + price;

            // Generate Midtrans Snap Token
            try {
              const snap = getSnapApiSingleton();
              const transactionParams = {
                transaction_details: {
                  order_id: activeSession.order_token,
                  gross_amount: grossAmount
                },
                customer_details: {
                  first_name: activeSession.shipping_address.recipient_name,
                  phone: activeSession.shipping_address.phone,
                },
                item_details: [
                  ...activeSession.cart_snapshot.items.map(i => ({
                    id: i.product_id,
                    price: i.price,
                    quantity: i.quantity,
                    name: i.product_name.substring(0, 50)
                  })),
                  {
                    id: 'SHIPPING',
                    price: price,
                    quantity: 1,
                    name: `Ongkir ${company.toUpperCase()} ${serviceType.toUpperCase()}`
                  }
                ]
              };

              const transaction = await snap.createTransaction(transactionParams);
              const snapToken = transaction.token;
              const redirectUrl = transaction.redirect_url;

              // Save to session
              await updateOrderSession(activeSession.order_token, {
                selected_courier: {
                  courier_code: company,
                  courier_name: company.toUpperCase(),
                  service_type: serviceType,
                  service_name: serviceType.toUpperCase(),
                  price: price,
                  estimated_days: 'Sesuai Layanan'
                },
                midtrans_snap_token: snapToken,
                bot_state: 'paid' // Actually waiting for payment, but we let standard webhook handle the "paid" update
              });

              // Send Payment CTA Button
              await sendInteractiveMessage(from, {
                type: 'button',
                header: { type: 'text', text: '💳 Pembayaran' },
                body: { text: `Total Tagihan: *Rp ${grossAmount.toLocaleString('id-ID')}*\n\nSilakan klik tombol di bawah untuk membayar pesanan kamu.` },
                action: {
                  buttons: [
                    {
                      type: 'reply',
                      reply: { id: BUTTON_IDS.PAY_NOW, title: '💳 Bayar Sekarang' }
                    }
                  ]
                }
              });

              // Send the real clickable link as fallback since CTA_URL requires specific Meta approval for Sandbox
              await sendTextMessage(from, `Atau buka link ini untuk membayar:\n${redirectUrl}`);
              return;

            } catch (err) {
              console.error('[Midtrans Error]', err);
              await sendTextMessage(from, '⚠️ Terjadi kesalahan saat membuat link pembayaran. Silakan coba lagi nanti.');
              return;
            }
          }
        }
      }
      
      await sendTextMessage(from, 'Maaf, saya tidak mengenali pilihan tersebut. Ketik "menu" untuk melihat opsi.');
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
