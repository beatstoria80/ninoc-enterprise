/* global clients */
// ═══════════════════════════════════════════════════════════════
// SERVICE WORKER — Manager Content Professional
// Handles: Push Notifications, Background Sync, Caching
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'mc-pro-v1';

// Install
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Push Notification received
self.addEventListener('push', (event) => {
  let data = { title: 'Manager Content', body: 'Ada notifikasi baru!', icon: '📋' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.msg || 'Ada pesan baru untuk Anda',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'mc-notif-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: self.registration.scope,
      type: data.type || 'info'
    },
    actions: [
      { action: 'open', title: '📱 Buka App' },
      { action: 'dismiss', title: '✕ Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Manager Content', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(self.registration.scope);
    })
  );
});

// Background sync for checking notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-notifs') {
    event.waitUntil(checkForNewNotifications());
  }
});

// Periodic background check
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifs-periodic') {
    event.waitUntil(checkForNewNotifications());
  }
});

async function checkForNewNotifications() {
  // This will be triggered by the main app
  const allClients = await clients.matchAll();
  allClients.forEach(client => {
    client.postMessage({ type: 'CHECK_NOTIFS' });
  });
}

// Listen for messages from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, type } = event.data;
    self.registration.showNotification(title || '📢 Manager Content', {
      body: body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      tag: tag || 'mc-msg-' + Date.now(),
      renotify: true,
      requireInteraction: true,
      data: { url: self.registration.scope, type: type || 'info' },
      actions: [
        { action: 'open', title: '📱 Buka' },
        { action: 'dismiss', title: '✕' }
      ]
    });
  }
});
