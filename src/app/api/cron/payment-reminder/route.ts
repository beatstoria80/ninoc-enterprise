import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendTemplateMessage, formatPhoneNumber, WA_TEMPLATES } from '@/lib/whatsapp';

// Vercel Cron configuration
// Runs every hour. 
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max 60 seconds execution

export async function GET(req: Request) {
  try {
    // 1. Verify cron secret (if running in Vercel)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[Cron] Starting Payment Reminder (Abandoned Cart) scan...');

    // 2. Find pending orders created between 2 hours and 24 hours ago, that haven't received a reminder
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: abandonedOrders, error } = await supabase
      .from('orders')
      .select('id, customer_name, shipping_address, total_price')
      .eq('status', 'pending')
      .eq('wa_reminder_sent', false)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .lte('created_at', twoHoursAgo.toISOString());

    if (error) {
      throw error;
    }

    if (!abandonedOrders || abandonedOrders.length === 0) {
      return NextResponse.json({ status: 'OK', message: 'No abandoned carts found.' });
    }

    console.log(`[Cron] Found ${abandonedOrders.length} pending orders to remind.`);

    let sentCount = 0;
    const failedIds: string[] = [];

    // 3. Process each order and send WA Reminder
    for (const order of abandonedOrders) {
      const phoneRaw = (order.shipping_address as any)?.phone || '';
      const phone = formatPhoneNumber(phoneRaw);
      const customerName = order.customer_name || (order.shipping_address as any)?.name || 'Pelanggan';
      
      if (!phone) {
        failedIds.push(order.id);
        continue;
      }

      // We use PROMO_BROADCAST template for now, or preferably a dedicated PAYMENT_REMINDER template.
      // Since WA_TEMPLATES only has PROMO_BROADCAST currently, we'll adapt it.
      // E.g., "Hai [Nama], Anda memiliki pesanan yang belum dibayar. Selesaikan sekarang sebelum kehabisan!"
      const reminderText = `Anda memiliki pesanan sebesar Rp ${Number(order.total_price).toLocaleString('id-ID')} yang belum diselesaikan (Order ID: ${order.id}). Stok sangat terbatas! Silakan lakukan pembayaran segera.`;

      const waRes = await sendTemplateMessage(WA_TEMPLATES.PROMO_BROADCAST, phone, [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: reminderText },
          ],
        },
      ]);

      if (waRes.success) {
        sentCount++;
        // Flag it so we don't spam them again
        await supabase
          .from('orders')
          .update({ wa_reminder_sent: true, wa_reminder_sent_at: new Date().toISOString() })
          .eq('id', order.id);
      } else {
        console.error(`[Cron] Failed to send reminder for order ${order.id}:`, waRes.error);
        failedIds.push(order.id);
      }
    }

    return NextResponse.json({ 
      status: 'OK', 
      processed: abandonedOrders.length, 
      sent: sentCount, 
      failed: failedIds.length,
      failed_ids: failedIds 
    });

  } catch (err) {
    const error = err as Error;
    console.error('[Cron] Payment Reminder Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
