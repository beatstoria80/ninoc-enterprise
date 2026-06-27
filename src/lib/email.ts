import nodemailer from 'nodemailer';

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL, // e.g., ninoc.archive@gmail.com
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
      from: '"NINOC STORE" <ninoc.archive@gmail.com>',
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
      from: '"NINOC STORE" <ninoc.archive@gmail.com>',
      to: customerEmail,
      subject: `[${statusText}] Status Retur Pesanan #${orderIdShort}`,
      html: emailHtml,
    });
    console.log(`[Email] Retur status (${newStatus}) update sent to ${customerEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send retur status update to ${customerEmail}:`, error);
  }
}

