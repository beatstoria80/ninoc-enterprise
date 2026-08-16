/**
 * WhatsApp Queue Processor
 * POST /api/whatsapp/queue
 *
 * Vercel Cron job (runs every 1 minute):
 * - Fetches next batch of pending messages (max 10 per run)
 * - Sends each via WhatsApp Cloud API
 * - Updates queue status
 * - Respects Meta rate limit (80 msg/min)
 *
 * To enable: add to vercel.json cron config:
 * {
 *   "crons": [{
 *     "path": "/api/whatsapp/queue",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin as adminClient } from '@/lib/supabaseAdmin';
import { sendBroadcastWA } from '@/lib/whatsapp';



const BATCH_SIZE = 10;       // Messages per cron run (stay under 80/min limit)
const MAX_RETRIES = 3;

export async function POST() {
  try {
    // ─── 1. Fetch next batch ───────────────────────────────────────────
    const { data: batch, error: fetchError } = await adminClient
      .rpc('get_next_wa_queue_batch', { batch_size: BATCH_SIZE })
      .select('*');

    if (fetchError) {
      console.error('[Queue] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch queue batch' }, { status: 500 });
    }

    if (!batch || batch.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No pending messages' });
    }

    console.log(`[Queue] Processing batch of ${batch.length} messages`);

    // ─── 2. Process each message ───────────────────────────────────────
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const item of batch) {
      // Mark as processing
      await adminClient
        .from('wa_broadcast_queue')
        .update({ status: 'processing', processing_at: new Date().toISOString() })
        .eq('id', item.id);

      // Apply rate limit delay (60s / 80 ≈ 750ms per message)
      await new Promise(resolve => setTimeout(resolve, 800));

      const result = await sendBroadcastWA({
        phone: item.phone,
        customer_name: item.customer_name || 'Pelanggan',
        promo_text: item.message_preview || '',
      });

      if (result.success) {
        // Mark as sent
        await adminClient
          .from('wa_broadcast_queue')
          .update({
            status: 'sent',
            whatsapp_message_id: result.message_id,
            sent_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        sent++;
      } else {
        // Determine if should retry
        const shouldRetry = (item.retry_count || 0) < MAX_RETRIES;

        await adminClient
          .from('wa_broadcast_queue')
          .update({
            status: shouldRetry ? 'retry' : 'failed',
            error_message: result.error,
            retry_count: (item.retry_count || 0) + 1,
            next_retry_at: shouldRetry
              ? new Date(Date.now() + Math.pow(2, item.retry_count + 1) * 60_000).toISOString()
              : null,
          })
          .eq('id', item.id);

        if (shouldRetry) {
          console.log(`[Queue] Message ${item.id} failed, will retry (attempt ${item.retry_count + 1})`);
        } else {
          console.warn(`[Queue] Message ${item.id} permanently failed: ${result.error}`);
        }

        failed++;
      }
    }

    // ─── 3. Update session counters ────────────────────────────────────
    const broadcastIds = [...new Set(batch.map((b: { broadcast_id: string }) => b.broadcast_id))];

    for (const bId of broadcastIds) {
      const { data: session } = await adminClient
        .from('wa_broadcast_queue')
        .select('status, broadcast_id')
        .eq('broadcast_id', bId);

      const totalSent = session?.filter((m: { status: string }) => m.status === 'sent').length || 0;
      const totalFailed = session?.filter((m: { status: string }) => m.status === 'failed').length || 0;

      await adminClient
        .from('wa_broadcast_sessions')
        .update({
          total_sent: totalSent,
          total_failed: totalFailed,
          status: 'processing',
        })
        .eq('id', bId);
    }

    // ─── 4. Check if all done ──────────────────────────────────────────
    for (const bId of broadcastIds) {
      const { count: pendingCount } = await adminClient
        .from('wa_broadcast_queue')
        .select('*', { count: 'exact', head: true })
        .eq('broadcast_id', bId)
        .in('status', ['pending', 'processing', 'retry']);

      if (pendingCount === 0) {
        await adminClient
          .from('wa_broadcast_sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', bId);

        console.log(`[Queue] Broadcast session ${bId} completed`);
      }
    }

    return NextResponse.json({
      batch_size: batch.length,
      sent,
      failed,
      skipped,
      processed: sent + failed,
    });

  } catch (err) {
    console.error('[Queue] Fatal error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─── GET: Queue status ────────────────────────────────────────────────────

export async function GET() {
  const { count: pending } = await adminClient
    .from('wa_broadcast_queue')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'retry']);

  const { count: processing } = await adminClient
    .from('wa_broadcast_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processing');

  const { count: sentToday } = await adminClient
    .from('wa_broadcast_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('sent_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

  return NextResponse.json({
    pending: pending || 0,
    processing: processing || 0,
    sent_today: sentToday || 0,
  });
}
