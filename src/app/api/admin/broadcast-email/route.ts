import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Helper to wrap the raw message in the NINOC HTML template
function buildNewsletterHtml(subject: string, messageHtml: string) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('supabase') ? process.env.NEXT_PUBLIC_APP_URL : 'https://ninoc.store');
  
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- HEADER -->
    <div style="background-color: #111111; padding: 32px 40px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 4px; font-weight: 600; text-transform: uppercase;">
        NINOC
      </h1>
      <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">
        Archive
      </p>
    </div>

    <!-- CONTENT -->
    <div style="padding: 40px; color: #333333;">
      <h2 style="font-size: 18px; margin-top: 0; margin-bottom: 24px; color: #111111; font-weight: 500;">
        ${subject}
      </h2>
      
      <div style="font-size: 14px; color: #555555; margin-bottom: 32px; white-space: pre-wrap;">
        ${messageHtml}
      </div>
      
      <div style="text-align: center; margin-top: 40px;">
        <a href="${appUrl}" style="display: inline-block; background-color: #111111; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; border-radius: 4px;">
          Kunjungi Website
        </a>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="background-color: #fafafa; padding: 32px 40px; border-top: 1px solid #eeeeee; text-align: center;">
      <p style="margin: 0; font-size: 11px; color: #888888; margin-bottom: 8px;">
        Email ini dikirim oleh sistem otomatis NINOC Archive.
      </p>
      <p style="margin: 0; font-size: 11px; color: #888888;">
        &copy; ${new Date().getFullYear()} NINOC. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function POST(req: Request) {
  try {
    const { subject, messageHtml, recipients } = await req.json();

    if (!subject || !messageHtml || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ─── Double Submission Check (Idempotency) ───
    // Prevent sending the exact same subject within 1 minute
    const { data: recentLogs } = await supabase
      .from('operational_expenses')
      .select('created_at')
      .eq('description', `Email Broadcast: ${subject}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentLogs) {
      const diffSeconds = (new Date().getTime() - new Date(recentLogs.created_at).getTime()) / 1000;
      if (diffSeconds < 60) {
        return NextResponse.json({ error: 'Email dengan subjek ini baru saja dikirim. Harap tunggu 1 menit untuk mengirim ulang.' }, { status: 429 });
      }
    }

    const { SMTP_EMAIL, SMTP_PASSWORD } = process.env;

    if (!SMTP_EMAIL || !SMTP_PASSWORD) {
      return NextResponse.json({ error: 'SMTP credentials not configured on the server.' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD,
      },
    });

    const fullHtml = buildNewsletterHtml(subject, messageHtml);

    // Using BCC to send to multiple recipients while keeping their emails private
    const mailOptions = {
      from: `"NINOC Archive" <${SMTP_EMAIL}>`,
      to: SMTP_EMAIL, // Send to self
      bcc: recipients.join(', '), // BCC to everyone else
      subject: subject,
      html: fullHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Broadcast Email] Sent successfully. Message ID: ${info.messageId}, Recipients: ${recipients.length}`);

    // Log to operational_expenses to prevent double submission and track activity
    await adminClient.from('operational_expenses').insert({
      category: 'marketing',
      description: `Email Broadcast: ${subject}`,
      amount: 0, // Free
      expense_date: new Date().toISOString().split('T')[0],
      created_by: 'System (Email API)'
    });

    return NextResponse.json({ 
      success: true, 
      sentCount: recipients.length 
    });

  } catch (error: any) {
    console.error('[Broadcast Email] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send broadcast email' }, { status: 500 });
  }
}

