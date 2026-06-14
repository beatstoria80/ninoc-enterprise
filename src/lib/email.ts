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

  const orderIdShort = order.id.slice(0, 8).toUpperCase();
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

  const trackingUrl = `https://ninoc.store/track?id=${order.id}`;

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
              <td style="font-size: 16px; font-weight: bold; color: #141414; font-family: monospace;">#${orderIdShort}</td>
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
