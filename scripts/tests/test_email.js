// Test Email SMTP - Verifikasi credentials Gmail App Password
const nodemailer = require('nodemailer');

const SMTP_EMAIL = 'ninocenterprise@gmail.com';
const SMTP_PASSWORD = 'ywokfowxmnacbycj';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASSWORD,
  },
});

async function testEmail() {
  console.log('🔍 Testing SMTP connection...');
  console.log(`   Email: ${SMTP_EMAIL}`);
  console.log(`   Password: ${SMTP_PASSWORD.substring(0, 4)}****`);
  
  try {
    // 1. Verify SMTP connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');
    
    // 2. Send test email to yourself
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"NINOC Enterprise" <${SMTP_EMAIL}>`,
      to: SMTP_EMAIL, // Send to self for testing
      subject: '✅ NINOC Email Test — Sistem Notifikasi Aktif',
      html: `
        <div style="font-family: Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="font-size: 18px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">NINOC</h2>
          <p style="font-size: 14px; color: #666; margin-bottom: 24px;">Email Notification System Test</p>
          <div style="background: #f5f5f5; padding: 20px; border-left: 4px solid #141414;">
            <p style="margin: 0; font-size: 14px;">Jika Anda menerima email ini, berarti konfigurasi SMTP <strong>berhasil</strong> dan siap digunakan untuk notifikasi invoice, pengiriman, dan konfirmasi pesanan.</p>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 24px;">Test dilakukan pada ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>
        </div>
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Sent to: ${SMTP_EMAIL}`);
    console.log('\n📬 Cek inbox ninocenterprise@gmail.com untuk memastikan email masuk.');
    
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  Google App Password mungkin sudah expired atau tidak valid.');
      console.error('   Buka: https://myaccount.google.com/apppasswords');
      console.error('   Buat App Password baru dan update SMTP_PASSWORD di .env.local dan Vercel.');
    }
  }
}

testEmail();
