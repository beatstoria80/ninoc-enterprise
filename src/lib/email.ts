import nodemailer from 'nodemailer';
import { getAppUrl } from './utils';

// Nodemailer transporter helper (lazily reads process.env)
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

// ─── Base Email Template Engine (NINOC ENTERPRISE Ultra-Luxury Design) ──────────

interface BaseEmailOptions {
  title: string;
  preheader: string;
  badgeText: string;
  customerName: string;
  headline: string;
  bodyMessage: string;
  orderId: string;
  orderNumber?: string;
  orderDate: string;
  itemsHtml?: string;
  subtotalStr?: string;
  shippingCostStr?: string;
  totalPriceStr?: string;
  ctaText?: string;
  ctaUrl?: string;
  metaBoxExtraHtml?: string;
}

function buildNinocLuxuryEmailHtml(options: BaseEmailOptions): string {
  const appUrl = getAppUrl();
  const logoUrl = `${appUrl}/logo.png`;
  const trackingUrl = options.ctaUrl || `${appUrl}/track?order_number=${options.orderNumber || options.orderId}`;
  const ctaButtonText = options.ctaText || 'Lacak Pesanan';

  return `<!DOCTYPE html>
<html lang="id" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<title>${options.title}</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body,table,td { -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; }
  table,td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { border:0; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; display:block; }
  body { margin:0; padding:0; width:100%!important; background-color:#EDEBE7; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; }
  a { text-decoration:none; }
  .wrap { width:100%; background-color:#EDEBE7; }
  .container { width:600px; max-width:600px; }
  .eyebrow { font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#8A8680; font-weight:600; }
  .h1 { font-size:24px; line-height:32px; color:#111111; font-weight:700; letter-spacing:-0.3px; }
  .body-text { font-size:14px; line-height:22px; color:#4A4842; font-weight:400; }
  .label { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#9A9690; font-weight:600; }
  .value { font-size:14px; color:#111111; font-weight:600; }
  .divider { border-top:1px solid #E4E1DB; font-size:0; line-height:0; }
  .btn-shell { background-color:#111111; }
  .btn-text { font-size:13px; letter-spacing:2px; text-transform:uppercase; color:#FFFFFF; font-weight:600; }
  .footer-link { font-size:12px; color:#8A8680; }
  .footer-text { font-size:11px; line-height:18px; color:#A6A29B; }
  @media only screen and (max-width:600px) {
    .container { width:100% !important; }
    .fluid { width:100% !important; max-width:100% !important; height:auto !important; }
    .stack { display:block !important; width:100% !important; }
    .px-24 { padding-left:20px !important; padding-right:20px !important; }
    .h1 { font-size:21px !important; line-height:28px !important; }
    .product-thumb { width:64px !important; }
  }
</style>
</head>
<body>
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${options.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

<table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="padding:32px 16px;">

<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFFF;border-radius:14px;overflow:hidden;">

  <!-- HEADER -->
  <tr>
    <td style="background-color:#111111;padding:36px 40px 30px;" class="px-24">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:22px;letter-spacing:5px;color:#FFFFFF;font-weight:700;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin-right:12px;">
              <tr>
                <td><img src="${logoUrl}" alt="NINOC Logo" width="32" height="32" style="display:block;border:0;" /></td>
              </tr>
            </table>
            NINOC<span style="color:#8A8680;font-weight:400;letter-spacing:3px;"> ENTERPRISE</span>
          </td>
        </tr>
        <tr><td style="height:14px;font-size:0;">&nbsp;</td></tr>
        <tr>
          <td style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B8B4AC;">${options.badgeText}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- GREETING -->
  <tr>
    <td style="padding:36px 40px 8px;" class="px-24">
      <p class="eyebrow" style="margin:0 0 10px;">Hai ${options.customerName}</p>
      <p class="h1" style="margin:0 0 14px;">${options.headline}</p>
      <p class="body-text" style="margin:0;">${options.bodyMessage}</p>
    </td>
  </tr>

  <!-- ORDER META -->
  <tr>
    <td style="padding:26px 40px 0;" class="px-24">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F6F5F2;border-radius:10px;">
        <tr>
          <td style="padding:18px 22px;" class="stack" width="50%">
            <p class="label" style="margin:0 0 6px;">Order ID</p>
            <p class="value" style="margin:0;font-family:monospace;">#${options.orderId.toUpperCase()}</p>
          </td>
          <td style="padding:18px 22px;" class="stack" width="50%" align="right">
            <p class="label" style="margin:0 0 6px;">Tanggal</p>
            <p class="value" style="margin:0;">${options.orderDate}</p>
          </td>
        </tr>
        ${options.metaBoxExtraHtml ? `
        <tr>
          <td colspan="2" style="padding:0 22px 18px;" class="stack">
            ${options.metaBoxExtraHtml}
          </td>
        </tr>
        ` : ''}
      </table>
    </td>
  </tr>

  <!-- ORDER SUMMARY -->
  ${options.itemsHtml ? `
  <tr>
    <td style="padding:30px 40px 0;" class="px-24">
      <p class="label" style="margin:0 0 16px;">Ringkasan Pesanan</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${options.itemsHtml}
      </table>
    </td>
  </tr>
  ` : ''}

  <!-- TOTALS -->
  ${options.totalPriceStr ? `
  <tr>
    <td style="padding:24px 40px 0;" class="px-24">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="divider">&nbsp;</td></tr>
        <tr><td style="height:18px;font-size:0;">&nbsp;</td></tr>
        ${options.subtotalStr ? `
        <tr>
          <td style="font-size:13px;color:#8A8680;">Subtotal</td>
          <td align="right" style="font-size:13px;color:#4A4842;">${options.subtotalStr}</td>
        </tr>
        <tr><td style="height:8px;font-size:0;">&nbsp;</td></tr>
        ` : ''}
        ${options.shippingCostStr ? `
        <tr>
          <td style="font-size:13px;color:#8A8680;">Pengiriman</td>
          <td align="right" style="font-size:13px;color:#4A4842;">${options.shippingCostStr}</td>
        </tr>
        <tr><td style="height:16px;font-size:0;">&nbsp;</td></tr>
        ` : ''}
        <tr>
          <td style="font-size:15px;font-weight:700;color:#111111;">Total Pembayaran</td>
          <td align="right" style="font-size:17px;font-weight:700;color:#111111;">${options.totalPriceStr}</td>
        </tr>
        <tr><td style="height:8px;font-size:0;">&nbsp;</td></tr>
      </table>
    </td>
  </tr>
  ` : ''}

  <!-- CTA BUTTON -->
  <tr>
    <td style="padding:30px 40px 6px;" class="px-24" align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" class="btn-shell" style="border-radius:8px;">
            <a href="${trackingUrl}" target="_blank" class="btn-text" style="display:block;padding:16px 24px;">${ctaButtonText}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:14px 40px 0;" class="px-24" align="center">
      <p class="footer-text" style="margin:0;">Atau gunakan Order ID <strong style="color:#4A4842;">#${options.orderId.toUpperCase()}</strong> di halaman <a href="${appUrl}/track" style="color:#4A4842;text-decoration:underline;">Track Order</a></p>
    </td>
  </tr>

  <!-- REASSURANCE STRIP -->
  <tr>
    <td style="padding:32px 40px 0;" class="px-24">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F6F5F2;border-radius:10px;">
        <tr>
          <td style="padding:20px 22px;" class="stack" width="33.33%" valign="top">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#111111;">Diperiksa Tangan</p>
            <p style="margin:0;font-size:11px;line-height:16px;color:#8A8680;">Tiap produk dicek dengan teliti sebelum dikemas.</p>
          </td>
          <td style="padding:20px 22px;" class="stack" width="33.33%" valign="top">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#111111;">Pembayaran Aman</p>
            <p style="margin:0;font-size:11px;line-height:16px;color:#8A8680;">Diproses via Midtrans, terenkripsi sempurna.</p>
          </td>
          <td style="padding:20px 22px;" class="stack" width="33.34%" valign="top">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#111111;">Butuh Bantuan?</p>
            <p style="margin:0;font-size:11px;line-height:16px;color:#8A8680;">Balas email ini, tim CS kami siap merespon.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- EDITORIAL / CROSS-SELL TEASER -->
  <tr>
    <td style="padding:34px 40px 0;" class="px-24">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="divider">&nbsp;</td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:26px 40px 6px;" class="px-24">
      <p class="label" style="margin:0 0 10px;">Selagi Menunggu</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:22px;color:#111111;font-weight:600;">Baca cerita di balik koleksi kami di Jurnal — proses, bahan, dan orang-orang yang membuatnya.</p>
      <a href="${appUrl}/logbook" style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#111111;font-weight:700;border-bottom:1px solid #111111;padding-bottom:2px;">Buka Jurnal →</a>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="padding:36px 40px 28px;" class="px-24">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="divider" style="padding-bottom:24px;">&nbsp;</td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;color:#111111;font-weight:700;">NINOC® ENTERPRISE DESIGN STUDIO</p>
            <p class="footer-text" style="margin:0 0 14px;">EST. 2024 · Bandung, Indonesia</p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:16px;">
            <a href="https://instagram.com/ninoc.co" class="footer-link" style="margin-right:14px;">Instagram</a>
            <a href="https://tiktok.com/@ninocenterprise" class="footer-link" style="margin-right:14px;">TikTok</a>
            <a href="mailto:ninocenterprise@gmail.com" class="footer-link">Email</a>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:16px;">
            <a href="${appUrl}/help" class="footer-text" style="margin-right:10px;">Bantuan</a>
            <a href="${appUrl}/shipping-policy" class="footer-text" style="margin-right:10px;">Kebijakan Pengiriman</a>
            <a href="${appUrl}/refund-policy" class="footer-text" style="margin-right:10px;">Retur &amp; Refund</a>
            <a href="${appUrl}/privacy-policy" class="footer-text">Privasi</a>
          </td>
        </tr>
        <tr>
          <td>
            <p class="footer-text" style="margin:0;">Aman &nbsp;·&nbsp; Terenkripsi &nbsp;·&nbsp; Verified Merchant (Midtrans Secure)</p>
            <p class="footer-text" style="margin:8px 0 0;">© ${new Date().getFullYear()} NINOC. Semua hak dilindungi. Kamu menerima email ini karena melakukan pemesanan di ninoc.store.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}

// ─── Items Renderer Helper ───────────────────────────────────────────────────

function buildItemsHtml(items: any[]): string {
  if (!items || items.length === 0) {
    return `
      <tr>
        <td colspan="4" style="padding: 12px 0; font-size: 14px; color: #8A8680;">Rincian produk tidak tersedia.</td>
      </tr>
    `;
  }

  return items
    .map((item: any, idx: number) => {
      const price = Number(item.price_at_purchase || item.price || 0);
      const imgUrl = item.image_url || item.image || '';

      return `
        <tr key="${idx}">
          <td width="72" valign="top" style="padding-bottom:16px;">
            ${
              imgUrl
                ? `<img src="${imgUrl}" alt="${item.product_name || 'Produk'}" width="64" height="64" style="width:64px;height:64px;object-fit:cover;border-radius:8px;display:block;" />`
                : `<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="product-thumb" width="64" style="background-color:#111111;border-radius:8px;">
                    <tr><td style="height:64px;width:64px;text-align:center;vertical-align:middle;color:#8A8680;font-size:9px;letter-spacing:1px;">NINOC<br>ITEM</td></tr>
                   </table>`
            }
          </td>
          <td width="16">&nbsp;</td>
          <td valign="top" style="padding-bottom:16px;">
            <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111111;line-height:20px;">${item.product_name || item.name || 'Produk NINOC'}</p>
            <p style="margin:0;font-size:12px;color:#9A9690;">Size: ${item.size || 'OS'} &nbsp;·&nbsp; Qty: ${item.quantity || 1}</p>
          </td>
          <td width="110" valign="top" align="right" style="padding-bottom:16px;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#111111;">IDR ${price.toLocaleString('id-ID')}</p>
          </td>
        </tr>
      `;
    })
    .join('');
}

// ─── Exported Email Notification Functions ──────────

/**
 * 1. Invoice Email (Payment Success)
 */
export async function sendEmailInvoice(order: any, customerEmail: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return;
  if (!customerEmail) return;

  const orderId = order.order_number || order.id || 'NINOC-ORDER';
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const customerName = order.shipping_address?.name || order.customer_name || 'Pelanggan';
  const items = order.order_items || order.items || [];
  const totalPrice = Number(order.total_price || order.gross_amount || 0);
  const shippingCost = Number(order.shipping_address?.shipping_cost || 12000);
  const subtotal = totalPrice > shippingCost ? totalPrice - shippingCost : totalPrice;

  const html = buildNinocLuxuryEmailHtml({
    title: `Invoice NINOC ENTERPRISE #${orderId.toUpperCase()}`,
    preheader: `Pembayaran pesanan #${orderId} telah kami terima — pesananmu sedang kami siapkan untuk pengiriman.`,
    badgeText: 'Pembayaran Dikonfirmasi & Lunas',
    customerName,
    headline: 'Terima kasih, pesananmu sedang kami siapkan.',
    bodyMessage:
      'Setiap barang di NINOC dipilih dan diperiksa dengan tangan sebelum dikemas. Pembayaran Anda telah kami terima dan pesanan Anda sedang kami siapkan — kabar pengiriman akan menyusul segera.',
    orderId,
    orderDate,
    itemsHtml: buildItemsHtml(items),
    subtotalStr: `IDR ${subtotal.toLocaleString('id-ID')}`,
    shippingCostStr: `IDR ${shippingCost.toLocaleString('id-ID')}`,
    totalPriceStr: `IDR ${totalPrice.toLocaleString('id-ID')}`,
    ctaText: 'Lacak Pesanan',
  });

  try {
    const info = await getTransporter().sendMail({
      from: `"NINOC ENTERPRISE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `Invoice NINOC #${orderId.toUpperCase()} - Pembayaran Berhasil`,
      html,
    });
    console.log(`[Email] Invoice sent to ${customerEmail}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('[Email] Error sending invoice email:', error);
  }
}

/**
 * 2. Order Reminder / Pending Payment Email
 */
export async function sendEmailReminder(order: any, customerEmail: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return;
  if (!customerEmail) return;

  const orderId = order.order_number || order.id || 'NINOC-ORDER';
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const customerName = order.shipping_address?.name || 'Pelanggan';
  const items = order.order_items || order.items || [];
  const totalPrice = Number(order.total_price || 0);

  const html = buildNinocLuxuryEmailHtml({
    title: `Menunggu Pembayaran #${orderId.toUpperCase()}`,
    preheader: `Pesanan #${orderId} belum menyelesaikan pembayaran — selesaikan dalam 24 jam untuk mengamankan stok.`,
    badgeText: 'Menunggu Pembayaran',
    customerName,
    headline: 'Pesananmu sudah kami catat — selesaikan pembayaran.',
    bodyMessage:
      'Terima kasih telah memesan di NINOC ENTERPRISE. Stok produk di keranjang Anda telah diamankan sementara. Silakan selesaikan pembayaran agar pesanan dapat segera kami kemas.',
    orderId,
    orderDate,
    itemsHtml: buildItemsHtml(items),
    totalPriceStr: `IDR ${totalPrice.toLocaleString('id-ID')}`,
    ctaText: 'Selesaikan Pembayaran',
  });

  try {
    await getTransporter().sendMail({
      from: `"NINOC ENTERPRISE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[Menunggu Pembayaran] Pesanan #${orderId.toUpperCase()}`,
      html,
    });
    console.log(`[Email] Payment reminder sent to ${customerEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send reminder to ${customerEmail}:`, error);
  }
}

/**
 * 3. Shipping / Resi Tracking Email
 */
export async function sendEmailShipping(order: any, customerEmail: string, trackingId: string, courierName: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return;
  if (!customerEmail) return;

  const orderId = order.order_number || order.id || 'NINOC-ORDER';
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const customerName = order.shipping_address?.name || 'Pelanggan';
  const items = order.order_items || order.items || [];

  const metaBoxExtraHtml = `
    <div style="border-top:1px solid #E4E1DB;padding-top:12px;margin-top:12px;">
      <p class="label" style="margin:0 0 4px;color:#059669;">Nomor Resi & Kurir</p>
      <p class="value" style="margin:0;font-size:15px;color:#111111;">${trackingId} &nbsp;·&nbsp; <span style="font-weight:400;color:#666;">${courierName}</span></p>
    </div>
  `;

  const html = buildNinocLuxuryEmailHtml({
    title: `Pesanan Dikirim #${orderId.toUpperCase()}`,
    preheader: `Paket #${orderId} telah diserahkan kepada kurir ${courierName} — nomor resi ${trackingId}.`,
    badgeText: 'Paket Dalam Pengiriman',
    customerName,
    headline: 'Kabar gembira, pesananmu sedang dalam perjalanan!',
    bodyMessage: `Pesanan Anda telah lolos pemeriksaan kualitas dan telah kami serahkan kepada mitra logistik **${courierName}**. Anda dapat memantau pergerakan posisi paket secara real-time.`,
    orderId,
    orderDate,
    itemsHtml: buildItemsHtml(items),
    metaBoxExtraHtml,
    ctaText: 'Lacak Posisi Paket',
  });

  try {
    await getTransporter().sendMail({
      from: `"NINOC ENTERPRISE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[Pesanan Dikirim] Paket Anda dari NINOC sedang dalam perjalanan`,
      html,
    });
    console.log(`[Email] Shipping notification sent to ${customerEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send shipping email to ${customerEmail}:`, error);
  }
}

/**
 * 4. Delivered Email
 */
export async function sendEmailDelivered(order: any, customerEmail: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return;
  if (!customerEmail) return;

  const orderId = order.order_number || order.id || 'NINOC-ORDER';
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const customerName = order.shipping_address?.name || 'Pelanggan';

  const html = buildNinocLuxuryEmailHtml({
    title: `Pesanan Tiba #${orderId.toUpperCase()}`,
    preheader: `Paket #${orderId} telah dinyatakan tiba di alamat tujuan oleh kurir.`,
    badgeText: 'Paket Berhasil Diterima',
    customerName,
    headline: 'Pesananmu telah tiba di tujuan.',
    bodyMessage:
      'Mitra kurir kami melaporkan bahwa paket pesanan Anda telah berhasil diserahkan di alamat penerima. Selamat menikmati koleksi produk dari NINOC ENTERPRISE!',
    orderId,
    orderDate,
    ctaText: 'Beri Ulasan Produk',
  });

  try {
    await getTransporter().sendMail({
      from: `"NINOC ENTERPRISE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[Pesanan Tiba] Paket NINOC Anda telah sampai di tujuan`,
      html,
    });
    console.log(`[Email] Delivered notification sent to ${customerEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send delivered email to ${customerEmail}:`, error);
  }
}

/**
 * 5. Retur Request Confirmation Email
 */
export async function sendEmailReturConfirmation(returRequest: any, order: any, customerEmail: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return;
  if (!customerEmail) return;

  const orderId = order.order_number || order.id || 'NINOC-ORDER';
  const returnDate = new Date(returRequest.created_at || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const customerName = order.shipping_address?.name || 'Pelanggan';

  const metaBoxExtraHtml = `
    <div style="border-top:1px solid #E4E1DB;padding-top:12px;margin-top:12px;">
      <p class="label" style="margin:0 0 4px;color:#9A9690;">Jenis & Alasan Retur</p>
      <p class="value" style="margin:0;font-size:14px;color:#111111;">${returRequest.return_type === 'exchange' ? 'Tukar Barang' : 'Refund Dana'} &nbsp;·&nbsp; <span style="font-weight:400;color:#666;">${returRequest.reason_label || returRequest.reason || 'Sesuai Pengajuan'}</span></p>
    </div>
  `;

  const html = buildNinocLuxuryEmailHtml({
    title: `Pengajuan Retur #${orderId.toUpperCase()}`,
    preheader: `Pengajuan retur #${orderId} telah kami terima — tim audit sedang meninjau kelengkapan data & video unboxing.`,
    badgeText: 'Pengajuan Retur Diterima',
    customerName,
    headline: 'Pengajuan returmu sedang kami tinjau.',
    bodyMessage:
      'Kami telah menerima pengajuan retur Anda. Tim Audit Logistik kami sedang memeriksa kelengkapan data dan bukti video unboxing. Peninjauan biasanya memakan waktu 1x24 jam kerja.',
    orderId,
    orderDate: returnDate,
    metaBoxExtraHtml,
    ctaText: 'Cek Status Retur',
  });

  try {
    await getTransporter().sendMail({
      from: `"NINOC ENTERPRISE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `Konfirmasi Pengajuan Retur Pesanan #${orderId.toUpperCase()}`,
      html,
    });
    console.log(`[Email] Retur confirmation sent to ${customerEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send retur confirmation to ${customerEmail}:`, error);
  }
}

/**
 * 6. Retur Status Update Email
 */
export async function sendEmailReturStatusUpdate(returRequest: any, order: any, customerEmail: string, newStatus: string, adminNotes?: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return;
  if (!customerEmail) return;

  const orderId = order.order_number || order.id || 'NINOC-ORDER';
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const customerName = order.shipping_address?.name || 'Pelanggan';

  let statusText = '';
  let message = '';

  if (newStatus === 'approved') {
    statusText = 'DISETUJUI (APPROVED)';
    message = 'Kabar baik! Pengajuan retur Anda telah kami **Setujui**. Silakan segera mengemas barang fisik dan mengirimkannya kembali ke Gudang Utama kami.';
  } else if (newStatus === 'rejected') {
    statusText = 'DITOLAK (REJECTED)';
    message = 'Mohon maaf, pengajuan retur Anda belum dapat disetujui karena tidak memenuhi batas 2x24 jam garansi atau bukti video tidak lengkap.';
  } else if (newStatus === 'completed') {
    statusText = 'SELESAI (COMPLETED)';
    message = 'Barang retur Anda telah tiba di Gudang kami dan selesai melewati QC Audit. Proses pengembalian dana / penukaran barang telah rampung.';
  } else {
    return;
  }

  const metaBoxExtraHtml = `
    <div style="border-top:1px solid #E4E1DB;padding-top:12px;margin-top:12px;">
      <p class="label" style="margin:0 0 4px;color:#111111;">Status Terbaru</p>
      <p class="value" style="margin:0;font-size:14px;color:#111111;">${statusText}</p>
      ${adminNotes ? `<p style="margin:6px 0 0 0;font-size:12px;color:#4A4842;"><strong>Catatan Admin:</strong> ${adminNotes}</p>` : ''}
    </div>
  `;

  const html = buildNinocLuxuryEmailHtml({
    title: `Pembaruan Retur #${orderId.toUpperCase()}`,
    preheader: `Status pengajuan retur #${orderId} telah diperbarui menjadi ${statusText}.`,
    badgeText: `Status Retur: ${statusText}`,
    customerName,
    headline: `Pembaruan status pengajuan returmu: ${statusText}.`,
    bodyMessage: message,
    orderId,
    orderDate,
    metaBoxExtraHtml,
    ctaText: 'Cek Rincian Retur',
  });

  try {
    await getTransporter().sendMail({
      from: `"NINOC ENTERPRISE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[${statusText}] Status Retur Pesanan #${orderId.toUpperCase()}`,
      html,
    });
    console.log(`[Email] Retur status update sent to ${customerEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send retur status update to ${customerEmail}:`, error);
  }
}

/**
 * 7. Order Cancelled Email
 */
export async function sendEmailOrderCancelled(order: any, customerEmail: string, reason: string, refundStatus: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return;
  if (!customerEmail) return;

  const orderId = order.order_number || order.id || 'NINOC-ORDER';
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const customerName = order.shipping_address?.name || 'Pelanggan';

  const metaBoxExtraHtml = `
    <div style="border-top:1px solid #E4E1DB;padding-top:12px;margin-top:12px;">
      <p class="label" style="margin:0 0 4px;color:#E11D48;">Alasan Pembatalan</p>
      <p class="value" style="margin:0;font-size:14px;color:#111111;">${reason} &nbsp;·&nbsp; <span style="font-weight:400;color:#666;">Refund Status: ${refundStatus}</span></p>
    </div>
  `;

  const html = buildNinocLuxuryEmailHtml({
    title: `Pembatalan Pesanan #${orderId.toUpperCase()}`,
    preheader: `Pesanan #${orderId} telah dibatalkan — rincian pengembalian dana tertera di dalam email.`,
    badgeText: 'Pesanan Dibatalkan',
    customerName,
    headline: 'Pesananmu telah dibatalkan.',
    bodyMessage: `Pesanan Anda #${orderId.toUpperCase()} telah dibatalkan. Jika Anda sudah melakukan pembayaran, pengembalian dana (refund) akan diproses secara otomatis oleh sistem gateway Midtrans ke saldo / rekening Anda.`,
    orderId,
    orderDate,
    metaBoxExtraHtml,
    ctaText: 'Hubungi Customer Support',
  });

  try {
    await getTransporter().sendMail({
      from: `"NINOC ENTERPRISE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[Dibatalkan] Pesanan #${orderId.toUpperCase()} & Informasi Refund`,
      html,
    });
    console.log(`[Email] Cancelled notification sent to ${customerEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send order cancelled email to ${customerEmail}:`, error);
  }
}
