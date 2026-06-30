/**
 * NINOC Service Worker — Push Notifications & Offline Support
 */

// ─── Push Notification Handler ────────────────────────────────────────────────
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || 'Anda memiliki pemberitahuan baru.',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        timestamp: data.timestamp || Date.now(),
      },
      actions: [
        { action: 'open', title: 'Lihat' },
        { action: 'dismiss', title: 'Tutup' },
      ],
      tag: 'ninoc-notification',
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'NINOC', options)
    );
  } catch (err) {
    console.error('[SW] Failed to parse push data:', err);
  }
});

// ─── Notification Click Handler ───────────────────────────────────────────────
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise, open a new window
      return clients.openWindow(url);
    })
  );
});

// ─── Install & Activate ──────────────────────────────────────────────────────
self.addEventListener('install', function (event) {
  console.log('[SW] Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  console.log('[SW] Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// ─── PWA Requirement (Fetch Listener) ─────────────────────────────────────────
// A minimal fetch listener is required by Chrome and Safari to treat the site
// as a valid PWA and allow "Add to Home Screen" or Push Notification prompts.
self.addEventListener('fetch', function (event) {
  // Pass through all requests without modifying them
  return;
});
