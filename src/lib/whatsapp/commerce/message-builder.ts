/**
 * NINOC WhatsApp Commerce — Message Builder
 *
 * Factory functions for building structured WhatsApp messages
 * used in the commerce checkout flow.
 *
 * Each function returns the interactive content payload that
 * can be passed to sendInteractiveMessage() from the client.
 */

import {
  WAInteractiveButtons,
  WAInteractiveList,
  CartSnapshot,
  SelectedCourier,
  ShippingAddress,
  BUTTON_IDS,
} from './types';

// ─── Formatters ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Order Summary Message ─────────────────────────────────────────────────────

/**
 * Build an order summary with action buttons.
 * Sent when the bot receives a valid order token from a user.
 */
export function buildOrderSummary(
  cart: CartSnapshot,
  orderToken: string
): WAInteractiveButtons {
  const itemLines = cart.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.product_name}${item.variant_label ? ` (${item.variant_label})` : ''}\n   ${item.quantity}x ${formatCurrency(item.price)}`
    )
    .join('\n');

  const bodyText =
    `🛒 *Ringkasan Pesanan*\n` +
    `Kode: \`${orderToken}\`\n\n` +
    `${itemLines}\n\n` +
    `*Subtotal:* ${formatCurrency(cart.subtotal)}\n` +
    `_(Belum termasuk ongkir)_`;

  return {
    type: 'button',
    header: { type: 'text', text: '🏷️ NINOC Order' },
    body: { text: bodyText },
    footer: { text: 'Pilih aksi di bawah untuk melanjutkan' },
    action: {
      buttons: [
        {
          type: 'reply',
          reply: { id: BUTTON_IDS.CONTINUE_CHECKOUT, title: '✅ Lanjutkan' },
        },
        {
          type: 'reply',
          reply: { id: BUTTON_IDS.EDIT_CART, title: '✏️ Edit di Web' },
        },
        {
          type: 'reply',
          reply: { id: BUTTON_IDS.CANCEL_ORDER, title: '❌ Batalkan' },
        },
      ],
    },
  };
}

// ─── Address Confirmation Message ──────────────────────────────────────────────

/**
 * Build address confirmation for users who already have a saved address.
 */
export function buildAddressConfirmation(
  address: ShippingAddress
): WAInteractiveButtons {
  const bodyText =
    `📍 *Alamat Pengiriman*\n\n` +
    `*${address.recipient_name}*\n` +
    `${address.phone}\n` +
    `${address.full_address}\n` +
    `${address.district}, ${address.city}\n` +
    `${address.province} ${address.postal_code}`;

  return {
    type: 'button',
    body: { text: bodyText },
    footer: { text: 'Apakah alamat ini benar?' },
    action: {
      buttons: [
        {
          type: 'reply',
          reply: { id: BUTTON_IDS.ADDRESS_CONFIRM, title: '✅ Ya, Benar' },
        },
        {
          type: 'reply',
          reply: { id: BUTTON_IDS.ADDRESS_CHANGE, title: '📝 Ganti Alamat' },
        },
      ],
    },
  };
}

// ─── Courier Selection (List Message) ──────────────────────────────────────────

export interface CourierOption {
  courier_code: string;
  courier_name: string;
  service_type: string;
  service_name: string;
  price: number;
  estimated_days: string;
}

/**
 * Build courier selection list from Biteship rates.
 */
export function buildCourierSelection(
  couriers: CourierOption[]
): WAInteractiveList {
  const regularCouriers = couriers.filter(
    (c) => !['instant', 'same_day'].includes(c.service_type.toLowerCase())
  );
  const expressCouriers = couriers.filter((c) =>
    ['instant', 'same_day'].includes(c.service_type.toLowerCase())
  );

  const sections = [];

  if (regularCouriers.length > 0) {
    sections.push({
      title: '📦 Reguler',
      rows: regularCouriers.slice(0, 5).map((c) => ({
        id: `courier_${c.courier_code}_${c.service_type}`,
        title: `${c.courier_name} ${c.service_name}`,
        description: `${formatCurrency(c.price)} • Est. ${c.estimated_days}`,
      })),
    });
  }

  if (expressCouriers.length > 0) {
    sections.push({
      title: '⚡ Express & Instant',
      rows: expressCouriers.slice(0, 5).map((c) => ({
        id: `courier_${c.courier_code}_${c.service_type}`,
        title: `${c.courier_name} ${c.service_name}`,
        description: `${formatCurrency(c.price)} • Est. ${c.estimated_days}`,
      })),
    });
  }

  return {
    type: 'list',
    header: { type: 'text', text: '🚚 Pilih Kurir' },
    body: {
      text: 'Pilih layanan pengiriman yang kamu inginkan. Harga sudah termasuk asuransi.',
    },
    footer: { text: 'Powered by Biteship' },
    action: {
      button: 'Lihat Opsi Kurir',
      sections,
    },
  };
}

// ─── Order Review (Final Confirmation) ─────────────────────────────────────────

/**
 * Build final order review before payment.
 */
export function buildOrderReview(
  cart: CartSnapshot,
  address: ShippingAddress,
  courier: SelectedCourier,
  orderToken: string
): WAInteractiveButtons {
  const itemLines = cart.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.product_name} x${item.quantity} — ${formatCurrency(item.price * item.quantity)}`
    )
    .join('\n');

  const shippingCost = courier.price;
  const total = cart.subtotal + shippingCost;

  const bodyText =
    `📋 *Review Pesanan*\n` +
    `Kode: \`${orderToken}\`\n\n` +
    `*Produk:*\n${itemLines}\n\n` +
    `*Pengiriman:*\n` +
    `📍 ${address.recipient_name}\n` +
    `${address.district}, ${address.city}\n` +
    `🚚 ${courier.courier_name} ${courier.service_name}\n` +
    `Est. ${courier.estimated_days}\n\n` +
    `─────────────────\n` +
    `Subtotal: ${formatCurrency(cart.subtotal)}\n` +
    `Ongkir: ${formatCurrency(shippingCost)}\n` +
    `*TOTAL: ${formatCurrency(total)}*`;

  return {
    type: 'button',
    header: { type: 'text', text: '💳 Konfirmasi Pembayaran' },
    body: { text: bodyText },
    footer: { text: 'Tekan Bayar untuk mendapatkan link pembayaran' },
    action: {
      buttons: [
        {
          type: 'reply',
          reply: { id: BUTTON_IDS.PAY_NOW, title: '💳 Bayar Sekarang' },
        },
        {
          type: 'reply',
          reply: { id: BUTTON_IDS.CANCEL_ORDER, title: '❌ Batalkan' },
        },
      ],
    },
  };
}

// ─── Payment Success Confirmation ──────────────────────────────────────────────

/**
 * Build payment success notification message.
 */
export function buildPaymentSuccess(
  orderToken: string,
  totalPaid: number
): WAInteractiveButtons {
  const bodyText =
    `✅ *Pembayaran Berhasil!*\n\n` +
    `Kode Order: \`${orderToken}\`\n` +
    `Total Dibayar: ${formatCurrency(totalPaid)}\n\n` +
    `Pesanan kamu sedang diproses. Kami akan mengirim update pengiriman via WhatsApp.\n\n` +
    `Terima kasih telah berbelanja di NINOC! 🙏`;

  return {
    type: 'button',
    header: { type: 'text', text: '🎉 Terima Kasih!' },
    body: { text: bodyText },
    action: {
      buttons: [
        {
          type: 'reply',
          reply: { id: BUTTON_IDS.TRACK_ORDER, title: '📦 Track Pesanan' },
        },
        {
          type: 'reply',
          reply: { id: BUTTON_IDS.SHOP_MORE, title: '🛍️ Belanja Lagi' },
        },
      ],
    },
  };
}

// ─── Welcome / Greeting Message ────────────────────────────────────────────────

/**
 * Build welcome message for users who message the bot
 * without an order token (general inquiry).
 */
export function buildWelcomeMessage(): WAInteractiveButtons {
  return {
    type: 'button',
    header: { type: 'text', text: '👋 Halo! Selamat datang di NINOC' },
    body: {
      text:
        'Hai! Saya NINOC Bot. Saya bisa membantu kamu:\n\n' +
        '🛒 Melanjutkan checkout dari website\n' +
        '📦 Cek status pesanan\n' +
        '💬 Tanya seputar produk\n\n' +
        'Jika kamu punya kode order dari website, silakan kirimkan di sini.',
    },
    footer: { text: 'ninoc.store' },
    action: {
      buttons: [
        {
          type: 'reply',
          reply: { id: BUTTON_IDS.BROWSE_PRODUCTS, title: '🛍️ Lihat Produk' },
        },
        {
          type: 'reply',
          reply: { id: BUTTON_IDS.CHECK_ORDER, title: '📦 Cek Pesanan' },
        },
        {
          type: 'reply',
          reply: { id: BUTTON_IDS.HELP, title: '❓ Bantuan' },
        },
      ],
    },
  };
}
