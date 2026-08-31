import { WAIncomingMessage } from '../types';
import { getActiveSessionByPhone, updateOrderSession } from '@/lib/order-token';
import { sendTextMessage, sendInteractiveMessage } from '../client';
import { BUTTON_IDS } from '../types';
import { getSnapApiSingleton } from '@/lib/midtrans';

export async function handleInteractiveReply(
  from: string,
  message: WAIncomingMessage
): Promise<void> {
  const reply = message.interactive;
  if (!reply) return;

  const buttonId = reply.button_reply?.id || reply.list_reply?.id || '';
  console.log(`[WA-Commerce-Webhook] Interactive reply: ${buttonId}`);

  switch (buttonId) {
    case BUTTON_IDS.CONTINUE_CHECKOUT:
      const activeSession = await getActiveSessionByPhone(from);
      if (!activeSession) {
        await sendTextMessage(from, '❌ Sesi order tidak ditemukan atau sudah kedaluwarsa. Silakan checkout ulang dari website.');
        break;
      }
      
      await updateOrderSession(activeSession.order_token, { bot_state: 'pending' });
      await sendTextMessage(
        from,
        '📍 *Informasi Pengiriman*\n\nMohon balas pesan ini dengan rincian alamat pengiriman kamu dengan format bebas, pastikan data berikut ada:\n\n- Nama Penerima\n- No HP\n- Kota/Kabupaten\n- Kode Pos (Wajib 5 angka)\n- Alamat Lengkap Jalan'
      );
      break;

    case BUTTON_IDS.EDIT_CART:
      await sendTextMessage(from, '🛒 Silakan edit keranjang belanja kamu di website:\n👉 ninoc.store/cart');
      break;

    case BUTTON_IDS.CANCEL_ORDER:
      await sendTextMessage(from, '❌ Order dibatalkan. Keranjang belanja kamu tetap tersimpan di website.\n\nKunjungi ninoc.store untuk melanjutkan kapan saja.');
      break;

    case BUTTON_IDS.BROWSE_PRODUCTS:
      await sendTextMessage(from, '🛍️ Kunjungi koleksi lengkap kami di:\n👉 ninoc.store/shop\n\nSetelah menemukan produk yang kamu suka, tambahkan ke keranjang dan pilih "Lanjut via WhatsApp" saat checkout!');
      break;

    case BUTTON_IDS.CHECK_ORDER:
      await sendTextMessage(from, '📦 Kirimkan kode order kamu (format: NINOC-xxxxx) untuk cek status.\n\nAtau kunjungi ninoc.store/track');
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
      if (buttonId.startsWith('courier_')) {
        const parts = buttonId.split('_'); 
        if (parts.length >= 4) {
          const company = parts[1];
          const serviceType = parts[2];
          const price = parseInt(parts[3], 10);

          const activeSession = await getActiveSessionByPhone(from);
          if (activeSession && activeSession.shipping_address) {
            const grossAmount = activeSession.cart_snapshot.subtotal + price;

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
                bot_state: 'paid'
              });

              await sendInteractiveMessage(from, {
                type: 'button',
                header: { type: 'text', text: '💳 Pembayaran' },
                body: { text: `Total Tagihan: *Rp ${grossAmount.toLocaleString('id-ID')}*\n\nSilakan klik tombol di bawah untuk membayar pesanan kamu.` },
                action: {
                  buttons: [
                    { type: 'reply', reply: { id: BUTTON_IDS.PAY_NOW, title: '💳 Bayar Sekarang' } }
                  ]
                }
              });

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
