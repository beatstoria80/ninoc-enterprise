/**
 * NINOC Multi-Channel Notification Engine
 * 
 * Centralized service for sending notifications across all channels:
 * - In-App (user_notifications table + realtime badge)
 * - Web Push (Service Worker + VAPID)
 * - WhatsApp (Cloud API)
 * - Email (SMTP)
 * 
 * SERVER-SIDE ONLY — never import in client components.
 */

import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ─── VAPID Setup ──────────────────────────────────────────────────────────────
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@ninoc.store';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationPayload {
  userId?: string | null;       // null = guest (no in-app / push)
  title: string;
  message: string;
  actionLink?: string;          // e.g. /profile/orders/ORDER_ID
  icon?: string;                // Push notification icon
}

// ─── 1. In-App Notification ───────────────────────────────────────────────────

export async function insertInAppNotification(
  userId: string,
  title: string,
  message: string,
  actionLink?: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('user_notifications')
      .insert({
        user_id: userId,
        title,
        message,
        action_link: actionLink || null,
        is_read: false,
      });
    
    if (error) {
      console.error('[Notification] In-App insert failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Notification] In-App error:', err);
    return false;
  }
}

// ─── 2. Web Push Notification ─────────────────────────────────────────────────

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url?: string
): Promise<{ sent: number; failed: number }> {
  const result = { sent: 0, failed: 0 };

  try {
    // Fetch all push subscriptions for this user
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (error || !subscriptions || subscriptions.length === 0) {
      return result;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      url: url || '/',
      timestamp: Date.now(),
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        result.sent++;
      } catch (pushError: any) {
        result.failed++;
        // If subscription expired (410 Gone or 404), remove it
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
          console.log(`[Push] Removed expired subscription: ${sub.id}`);
        } else {
          console.error(`[Push] Failed to send to ${sub.endpoint}:`, pushError.message);
        }
      }
    }
  } catch (err) {
    console.error('[Push] Unexpected error:', err);
  }

  return result;
}

// ─── 3. Orchestrator: Notify All Channels ─────────────────────────────────────

export async function notifyAllChannels(payload: NotificationPayload): Promise<void> {
  const { userId, title, message, actionLink } = payload;

  if (!userId) {
    // Guest user — skip in-app and push (no user ID to target)
    console.log('[Notification] Skipping in-app/push for guest order.');
    return;
  }

  // Fire all notifications in parallel (don't block each other)
  const results = await Promise.allSettled([
    // 1. In-App Notification (badge in header)
    insertInAppNotification(userId, title, message, actionLink),

    // 2. Web Push Notification (browser/mobile)
    sendPushNotification(userId, title, message, actionLink),
  ]);

  const inAppResult = results[0];
  const pushResult = results[1];

  console.log(
    `[Notification] userId=${userId} | In-App=${inAppResult.status} | Push=${pushResult.status === 'fulfilled' ? JSON.stringify(pushResult.value) : 'failed'}`
  );
}
