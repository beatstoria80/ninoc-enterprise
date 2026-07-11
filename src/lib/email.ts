import nodemailer from 'nodemailer';

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL, // e.g., ninocenterprise@gmail.com
    pass: process.env.SMTP_PASSWORD, // Google App Password
  },
});

export async function sendEmailInvoice(order: any, customerEmail: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.error('[Email] SMTP credentials not configured. Skipping email send.');
    return;
  }

  if (!customerEmail) {
    console.error('[Email] No customer email provided.');
    return;
  }

  const orderIdShort = order.id.toUpperCase();
  const orderDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate items summary
  let itemsHtml = '';
  if (order.order_items && order.order_items.length > 0) {
    itemsHtml = order.order_items.map((item: any) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea; font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: #141414;">
          <strong>${item.product_name}</strong><br/>
          <span style="color: #666; font-size: 12px;">Size: ${item.size || 'OS'} | Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea; font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: #141414; text-align: right;">
          IDR ${item.price_at_purchase.toLocaleString('id-ID')}
        </td>
      </tr>
    `).join('');
  } else {
    itemsHtml = `
      <tr>
        <td colspan="2" style="padding: 12px 0; border-bottom: 1px solid #eaeaea; font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: #666;">
          Items not found in details.
        </td>
      </tr>
    `;
  }

  const trackingUrl = `https://ninoc.store/track?order_number=${order.order_number}&phone=${encodeURIComponent(order.shipping_address?.phone || '')}`;

  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Invoice NINOC #${orderIdShort}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f6f6f6; font-family: Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <!-- Header -->
      <tr>
        <td style="background-color: #141414; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px;">NINOC <span style="font-size: 14px; font-weight: 400; letter-spacing: 4px;">ARCHIVE</span></h1>
          <p style="color: #a0a0a0; margin: 10px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Payment Receipt</p>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 40px 30px;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #141414; line-height: 1.5;">
            Hi <strong>${order.shipping_address?.name || 'Customer'}</strong>,<br/><br/>
            Terima kasih telah berbelanja di NINOC. Pembayaran Anda telah kami terima dan pesanan Anda sedang kami proses untuk pengiriman.
          </p>

          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9f9f9; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
            <tr>
              <td style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px;">Order ID</td>
              <td style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px; text-align: right;">Date</td>
            </tr>
            <tr>
              <td style="font-size: 16px; font-weight: bold; color: #141414; font-family: monospace;">#${order.id.toUpperCase()}</td>
              <td style="font-size: 14px; font-weight: bold; color: #141414; text-align: right;">${orderDate}</td>
            </tr>
          </table>

          <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #141414; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #141414; padding-bottom: 10px;">Order Summary</h3>
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
            ${itemsHtml}
            <tr>
              <td style="padding: 20px 0 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: #141414; font-weight: bold; text-align: right;">
                TOTAL
              </td>
              <td style="padding: 20px 0 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 18px; color: #141414; font-weight: bold; text-align: right;">
                IDR ${order.total_price.toLocaleString('id-ID')}
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
            <a href="${trackingUrl}" style="background-color: #141414; color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; display: inline-block;">
              Lacak Pesanan (Track Order)
            </a>
          </div>
          <p style="text-align: center; font-size: 12px; color: #666;">
            Atau gunakan Order ID Anda (<strong style="color:#141414; font-family:monospace;">${order.id}</strong>) pada halaman Track Order di website kami.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eaeaea;">
          <p style="margin: 0; font-size: 12px; color: #999;">
            &copy; ${new Date().getFullYear()} NINOC ARCHIVE. All rights reserved.<br/>
            Bandung, Indonesia.
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"NINOC STORE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `Invoice NINOC #${orderIdShort} - Pembayaran Berhasil`,
      html: emailHtml,
    });
    console.log(`[Email] Invoice sent to ${customerEmail}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('[Email] Error sending invoice email:', error);
  }
}

export async function sendEmailReturConfirmation(returRequest: any, order: any, customerEmail: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.error('[Email] SMTP credentials not configured. Skipping retur email.');
    return;
  }

  if (!customerEmail) {
    console.error('[Email] No customer email provided for retur confirmation.');
    return;
  }

  const orderIdShort = order.id.toUpperCase();
  const returnDate = new Date(returRequest.created_at || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const trackingUrl = `https://ninoc.store/retur`;

  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Konfirmasi Pengajuan Retur #${orderIdShort}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f6f6f6; font-family: Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <!-- Header -->
      <tr>
        <td style="background-color: #141414; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px;">NINOC <span style="font-size: 14px; font-weight: 400; letter-spacing: 4px;">ARCHIVE</span></h1>
          <p style="color: #a0a0a0; margin: 10px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Return Request Received</p>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 40px 30px;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #141414; line-height: 1.5;">
            Hi <strong>${order.shipping_address?.name || 'Customer'}</strong>,<br/><br/>
            Kami telah menerima pengajuan retur Anda. Saat ini, tim kami sedang meninjau kelengkapan data dan bukti video unboxing yang Anda unggah.
          </p>

          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9f9f9; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
            <tr>
              <td style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px;">Order ID</td>
              <td style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px; text-align: right;">Date</td>
            </tr>
            <tr>
              <td style="font-size: 16px; font-weight: bold; color: #141414; font-family: monospace;">#${order.id.toUpperCase()}</td>
              <td style="font-size: 14px; font-weight: bold; color: #141414; text-align: right;">${returnDate}</td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; padding-top: 15px; padding-bottom: 4px;">Jenis Retur</td>
              <td style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; padding-top: 15px; padding-bottom: 4px; text-align: right;">Alasan</td>
            </tr>
            <tr>
              <td style="font-size: 14px; font-weight: bold; color: #141414;">${returRequest.return_type === 'exchange' ? 'Tukar Barang' : 'Refund Dana'}</td>
              <td style="font-size: 14px; font-weight: bold; color: #141414; text-align: right;">${returRequest.reason_label}</td>
            </tr>
          </table>

          <p style="margin: 0 0 30px 0; font-size: 14px; color: #666; line-height: 1.6;">
            Proses peninjauan biasanya memakan waktu <strong>1-2 hari kerja</strong>. Kami akan menginformasikan kembali hasil peninjauan (disetujui atau ditolak) melalui email ini.
          </p>

          <!-- Button -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 40px;">
            <tr>
              <td align="center">
                <a href="${trackingUrl}" style="display: inline-block; background-color: #141414; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">Lacak Status Retur</a>
              </td>
            </tr>
          </table>

          <div style="border-top: 1px solid #eaeaea; padding-top: 20px; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #a0a0a0;">NINOC STORE</p>
            <p style="margin: 0; font-size: 12px; color: #a0a0a0;">Jika Anda memiliki pertanyaan, balas email ini atau hubungi Customer Service kami.</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    await transporter.sendMail({
      from: `"NINOC STORE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `Konfirmasi Retur Pesanan #${orderIdShort}`,
      html: emailHtml,
    });
    console.log(`[Email] Retur confirmation sent to ${customerEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send retur confirmation to ${customerEmail}:`, error);
  }
}

export async function sendEmailReturStatusUpdate(returRequest: any, order: any, customerEmail: string, newStatus: string, adminNotes?: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return;
  if (!customerEmail) return;

  const orderIdShort = order.id.toUpperCase();
  const trackingUrl = `https://ninoc.store/retur`;
  
  let statusText = '';
  let color = '#141414';
  let message = '';

  if (newStatus === 'approved') {
    statusText = 'DISETUJUI';
    color = '#059669'; // emerald
    message = 'Kabar baik! Pengajuan retur Anda telah kami <strong>Setujui</strong>. Silakan segera mengirimkan fisik barang kembali ke Gudang kami dan menginput nomor resi (AWB) pada halaman pelacakan agar tim Gudang dapat memprosesnya saat tiba.';
  } else if (newStatus === 'rejected') {
    statusText = 'DITOLAK';
    color = '#e11d48'; // rose
    message = 'Mohon maaf, pengajuan retur Anda terpaksa kami <strong>Tolak</strong> karena tidak memenuhi persyaratan kebijakan retur kami (misal: video tidak valid atau telah melewati batas 2x24 jam).';
  } else if (newStatus === 'completed') {
    statusText = 'SELESAI';
    color = '#4f46e5'; // indigo
    message = 'Barang retur Anda telah sampai di Gudang kami dan selesai melewati proses Audit QC. Pengembalian dana (Refund) atau penukaran barang akan segera diproses oleh tim kami dalam 1x24 jam kerja.';
  } else {
    return; // Don't send emails for other statuses (e.g., reviewed, pending)
  }

  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin: 0; padding: 0; background-color: #f6f6f6; font-family: Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <tr>
        <td style="background-color: ${color}; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">Update Status Retur</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Order #${orderIdShort}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 40px 30px;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #141414; line-height: 1.5;">
            Hi <strong>${order.shipping_address?.name || 'Customer'}</strong>,<br/><br/>
            ${message}
          </p>
          
          ${adminNotes ? `
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 14px; color: #b45309;"><strong>Catatan Admin:</strong><br/>${adminNotes}</p>
          </div>
          ` : ''}

          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 40px; margin-top: 20px;">
            <tr>
              <td align="center">
                <a href="${trackingUrl}" style="display: inline-block; background-color: #141414; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">Lacak Status Retur</a>
              </td>
            </tr>
          </table>
          <div style="border-top: 1px solid #eaeaea; padding-top: 20px; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #a0a0a0;">NINOC STORE</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    await transporter.sendMail({
      from: `"NINOC STORE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[${statusText}] Status Retur Pesanan #${orderIdShort}`,
      html: emailHtml,
    });
    console.log(`[Email] Retur status (${newStatus}) update sent to ${customerEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send retur status update to ${customerEmail}:`, error);
  }
}

export async function sendEmailReminder(order: any, customerEmail: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.error('[Email] SMTP credentials not configured. Skipping email send.');
    return;
  }

  if (!customerEmail) {
    console.error('[Email] No customer email provided.');
    return;
  }

  const orderIdShort = order.id.toUpperCase();
  const trackingUrl = `https://ninoc.store/track?order_number=${order.order_number || order.id}&phone=${encodeURIComponent(order.shipping_address?.phone || '')}`;

  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Selesaikan Pembayaran Anda</title>
  </head>
  <body style="font-family: Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 20px; margin: 0; line-height: 1.6; color: #141414;">
    <table style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden; width: 100%; border: 1px solid #eaeaea; border-collapse: collapse;">
      <tr>
        <td style="padding: 30px; text-align: center; background-color: #141414; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">NINOC</h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #141414;">Menunggu Pembayaran</h2>
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">
            Halo ${order.customer_name || order.shipping_address?.name || 'Pelanggan'},<br><br>
            Kami mengingatkan bahwa pesanan Anda <strong>#${orderIdShort}</strong> senilai <strong>Rp ${Number(order.total_price).toLocaleString('id-ID')}</strong> masih menunggu pembayaran.
          </p>
          <p style="margin: 0 0 30px 0; font-size: 14px; color: #666;">
            Harap segera selesaikan pembayaran Anda agar pesanan dapat segera diproses oleh tim kami. Pesanan yang tidak dibayar akan kadaluarsa secara otomatis.
          </p>
          <table style="width: 100%; text-align: center; margin-bottom: 30px;">
            <tr>
              <td>
                <a href="${trackingUrl}" style="display: inline-block; background-color: #141414; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">Bayar Sekarang</a>
              </td>
            </tr>
          </table>
          <div style="border-top: 1px solid #eaeaea; padding-top: 20px; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #a0a0a0;">NINOC STORE</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    await transporter.sendMail({
      from: `"NINOC STORE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[Menunggu Pembayaran] Pesanan #${orderIdShort}`,
      html: emailHtml,
    });
    console.log(`[Email] Payment reminder sent to ${customerEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send payment reminder to ${customerEmail}:`, error);
  }
}

export async function sendEmailShipping(order: any, customerEmail: string, trackingId: string, courierName: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return;
  if (!customerEmail) return;

  const orderIdShort = order.id.toUpperCase();
  const trackingUrl = `https://ninoc.store/track?order_number=${order.order_number || order.id}&phone=${encodeURIComponent(order.shipping_address?.phone || '')}`;

  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin: 0; padding: 0; background-color: #f6f6f6; font-family: Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <tr>
        <td style="background-color: #141414; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">Pesanan Anda Sedang Dikirim</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Order #${orderIdShort}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 40px 30px;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #141414; line-height: 1.5;">
            Hi <strong>${order.customer_name || order.shipping_address?.name || 'Customer'}</strong>,<br/><br/>
            Kabar gembira! Pesanan Anda telah diserahkan ke pihak kurir <strong>${courierName}</strong> dan saat ini sedang dalam perjalanan menuju alamat Anda.
          </p>
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9f9f9; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
            <tr>
              <td style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px;">Kurir</td>
              <td style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px; text-align: right;">Nomor Resi</td>
            </tr>
            <tr>
              <td style="font-size: 16px; font-weight: bold; color: #141414;">${courierName}</td>
              <td style="font-size: 16px; font-weight: bold; color: #141414; text-align: right; font-family: monospace;">${trackingId}</td>
            </tr>
          </table>

          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
            <tr>
              <td align="center">
                <a href="${trackingUrl}" style="display: inline-block; background-color: #141414; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">Lacak Pengiriman</a>
              </td>
            </tr>
          </table>
          <div style="border-top: 1px solid #eaeaea; padding-top: 20px; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #a0a0a0;">NINOC STORE</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    await transporter.sendMail({
      from: `"NINOC STORE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[Pesanan Dikirim] Paket Anda dari NINOC sedang dalam perjalanan`,
      html: emailHtml,
    });
    console.log(`[Email] Shipping notification sent to ${customerEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send shipping notification to ${customerEmail}:`, error);
  }
}

export async function sendEmailDelivered(order: any, customerEmail: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return;
  if (!customerEmail) return;

  const orderIdShort = order.id.toUpperCase();
  const trackingUrl = `https://ninoc.store/track?order_number=${order.order_number || order.id}&phone=${encodeURIComponent(order.shipping_address?.phone || '')}`;

  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin: 0; padding: 0; background-color: #f6f6f6; font-family: Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <tr>
        <td style="background-color: #059669; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">Paket Anda Telah Tiba!</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Order #${orderIdShort}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 40px 30px;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #141414; line-height: 1.5;">
            Hi <strong>${order.customer_name || order.shipping_address?.name || 'Customer'}</strong>,<br/><br/>
            Berdasarkan laporan dari kurir, paket pesanan Anda telah berhasil dikirimkan ke alamat tujuan.
          </p>
          
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #b45309; font-weight: bold;">Mohon Segera Cek Barang Anda!</p>
            <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.5;">Jangan lupa untuk merekam <strong>Video Unboxing 1-shot (tanpa edit/jeda)</strong> saat membuka paket. Jika ada barang cacat atau tidak sesuai, Anda dapat mengajukan retur dalam batas maksimal <strong>2x24 jam</strong> sejak paket diterima.</p>
          </div>

          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
            <tr>
              <td align="center">
                <a href="${trackingUrl}" style="display: inline-block; background-color: #141414; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">Konfirmasi Terima / Ajukan Retur</a>
              </td>
            </tr>
          </table>
          
          <p style="font-size: 13px; color: #666; text-align: center; margin-bottom: 20px;">
            Jika Anda sudah mengecek dan merasa puas dengan produk kami, konfirmasi pesanan sangat kami apresiasi!
          </p>

          <div style="border-top: 1px solid #eaeaea; padding-top: 20px; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #a0a0a0;">NINOC STORE</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    await transporter.sendMail({
      from: `"NINOC STORE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[Pesanan Tiba] Paket NINOC Anda telah sampai di tujuan`,
      html: emailHtml,
    });
    console.log(`[Email] Delivered notification sent to ${customerEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send delivered notification to ${customerEmail}:`, error);
  }
}

export async function sendEmailOrderCancelled(order: any, customerEmail: string, reason: string, refundStatus: string) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return;
  if (!customerEmail) return;

  const orderNumber = order.order_number || order.id.toUpperCase();
  const customerName = order.customer_name || (order.shipping_address as any)?.name || 'Pelanggan';
  const totalPriceFormatted = (order.total_price || 0).toLocaleString('id-ID');
  const isManualRefund = refundStatus.toLowerCase().includes('manual');
  const isRefunded = refundStatus.toLowerCase().includes('refunded') || refundStatus.toLowerCase().includes('cancelled before');

  let refundNoticeHtml = '';
  if (isManualRefund) {
    refundNoticeHtml = `
      <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 15px; margin-top: 20px; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #9f1239; line-height: 1.5;">
          <strong>⚠️ Informasi Refund Manual:</strong><br/>
          Metode pembayaran yang Anda gunakan memerlukan transfer refund manual antarbank. Tim Finance kami akan menghubungi Anda melalui WhatsApp atau Email dalam 1x24 jam kerja untuk memverifikasi nomor rekening tujuan transfer dana refund Anda.
        </p>
      </div>
    `;
  } else if (isRefunded) {
    refundNoticeHtml = `
      <div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 15px; margin-top: 20px; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #065f46; line-height: 1.5;">
          <strong>✅ Informasi Refund Otomatis:</strong><br/>
          Dana transaksi Anda telah diproses pengembaliannya secara otomatis melalui sistem Midtrans ke metode pembayaran asal. Estimasi dana masuk tergantung kebijakan bank/penerbit (1-7 hari kerja).
        </p>
      </div>
    `;
  } else {
    refundNoticeHtml = `
      <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin-top: 20px; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
          <strong>ℹ️ Status Pengembalian Dana:</strong> ${refundStatus}<br/>
          Jika ada pertanyaan mengenai pengembalian dana, silakan hubungi tim dukungan pelanggan kami melalui Live Chat di web atau WhatsApp.
        </p>
      </div>
    `;
  }

  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin: 0; padding: 0; background-color: #f6f6f6; font-family: Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <tr>
        <td style="background-color: #e11d48; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">Pesanan Dibatalkan</h1>
          <p style="color: #ffe4e6; margin: 10px 0 0 0; font-size: 14px;">Pemberitahuan Resmi NINOC STORE</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 30px;">
          <p style="font-size: 16px; color: #333333; margin-top: 0;">Halo <strong>${customerName}</strong>,</p>
          <p style="font-size: 14px; color: #555555; line-height: 1.6;">
            Mohon maaf sebesar-besarnya, pesanan Anda dengan nomor <strong>#${orderNumber}</strong> terpaksa kami batalkan dan tidak dapat diproses lebih lanjut.
          </p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-top: 20px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-size: 13px; color: #64748b; padding-bottom: 8px;" width="40%">Nomor Pesanan:</td>
                <td style="font-size: 13px; color: #0f172a; font-weight: bold; padding-bottom: 8px;">#${orderNumber}</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #64748b; padding-bottom: 8px;">Total Tagihan:</td>
                <td style="font-size: 13px; color: #0f172a; font-weight: bold; padding-bottom: 8px;">Rp ${totalPriceFormatted}</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #64748b; padding-bottom: 8px;">Alasan Pembatalan:</td>
                <td style="font-size: 13px; color: #e11d48; font-weight: bold; padding-bottom: 8px;">${reason}</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #64748b;">Status Refund:</td>
                <td style="font-size: 13px; color: #0f172a; font-weight: bold;">${refundStatus}</td>
              </tr>
            </table>
          </div>

          ${refundNoticeHtml}

          <p style="font-size: 14px; color: #555555; line-height: 1.6; margin-top: 25px;">
            Atas ketidaknyamanan ini, kami mohon maaf yang sebesar-besarnya. Kami senantiasa berusaha meningkatkan kualitas manajemen stok dan layanan operasional kami agar kejadian ini tidak terulang kembali.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://ninoc.store/profile" style="display: inline-block; background-color: #141414; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-size: 14px; font-weight: bold;">Lihat Status Pesanan di Akun Saya</a>
          </div>

          <div style="border-top: 1px solid #eaeaea; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #a0a0a0;">NINOC STORE &mdash; Customer & Finance Care</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    await transporter.sendMail({
      from: `"NINOC STORE" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[Dibatalkan] Pesanan #${orderNumber} & Informasi Pengembalian Dana`,
      html: emailHtml,
    });
    console.log(`[Email] Order cancelled notification sent to ${customerEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send order cancelled notification to ${customerEmail}:`, error);
  }
}
