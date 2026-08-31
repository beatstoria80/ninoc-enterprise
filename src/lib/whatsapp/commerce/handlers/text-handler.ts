import { WAContact } from '../types';
import { extractOrderToken, getOrderSession, updateOrderSession, getActiveSessionByPhone } from '@/lib/order-token';
import { sendTextMessage, sendInteractiveMessage } from '../client';
import { buildOrderSummary, buildWelcomeMessage, buildCourierSelection } from '../message-builder';
import { parseAddressText } from '../address-parser';

export async function handleTextMessage(
  from: string,
  text: string,
  contact: WAContact | null
): Promise<void> {
  // Check if the message contains an order token
  const token = extractOrderToken(text);

  if (token) {
    const session = await getOrderSession(token);
    if (!session) {
      await sendTextMessage(from, '❌ Kode order tidak ditemukan atau sudah kedaluwarsa.\n\nSilakan buat order baru di ninoc.store');
      return;
    }

    if (session.payment_status === 'paid') {
      await sendTextMessage(from, '✅ Order ini sudah dibayar. Pesanan kamu sedang diproses!');
      return;
    }

    await updateOrderSession(token, { user_phone: from });
    const summary = buildOrderSummary(session.cart_snapshot, token);
    await sendInteractiveMessage(from, summary);
    return;
  }

  // Check active session for address input
  const activeSession = await getActiveSessionByPhone(from);
  
  if (activeSession && activeSession.bot_state === 'pending') {
    const addressData = parseAddressText(text, from);
    
    if (!addressData) {
      await sendTextMessage(from, '⚠️ Format alamat tidak dikenali.\n\nMohon pastikan mencantumkan *Kode Pos* (5 digit angka) agar kami bisa menghitung ongkos kirim. Silakan coba kirim ulang alamatnya.');
      return;
    }

    await updateOrderSession(activeSession.order_token, {
      shipping_address: addressData,
      bot_state: 'address_collected'
    });

    try {
      const apiKey = process.env.BITESHIP_API_KEY;
      if (!apiKey) throw new Error('Biteship API Key missing');

      const dynamicOrigin = activeSession.cart_snapshot.items[0]?.origin_postal_code || '40292';

      const payload = {
        origin_postal_code: dynamicOrigin,
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

      await updateOrderSession(activeSession.order_token, { bot_state: 'courier_selected' });
      const listMessage = buildCourierSelection(couriers);
      await sendInteractiveMessage(from, listMessage);
    } catch (e) {
      console.error('[Biteship Fetch Error]', e);
      await sendTextMessage(from, '⚠️ Maaf, layanan kurir sedang gangguan. Silakan coba beberapa saat lagi.');
    }
    return;
  }

  // Keywords
  const lowerText = text.toLowerCase().trim();
  if (lowerText.includes('halo') || lowerText.includes('hai') || lowerText.includes('hi') || lowerText === 'menu') {
    const welcome = buildWelcomeMessage();
    await sendInteractiveMessage(from, welcome);
    return;
  }

  if (lowerText.includes('cek pesanan') || lowerText.includes('status order') || lowerText.includes('track')) {
    await sendTextMessage(from, '📦 Untuk cek status pesanan, silakan kirimkan kode order kamu (format: NINOC-xxxxx).\n\nAtau kunjungi ninoc.store/track untuk tracking lengkap.');
    return;
  }

  const welcome = buildWelcomeMessage();
  await sendInteractiveMessage(from, welcome);
}
