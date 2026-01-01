const CACHE_NAME = 'smart-menu-cache-v1';

// 1. Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. Push Event (The New System for Notifications)
self.addEventListener('push', function(event) {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/logo192.png',
            badge: '/logo192.png',
            vibrate: [300, 100, 300], // Kitchen vibration pattern
            data: { url: data.url || '/' },
            tag: 'new-order-alert', // Prevents multiple alerts from stacking too much
            renotify: true
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    } catch (err) {
        console.error('Push handling error:', err);
    }
});

// 4. Notification Click Event (Open App when clicked)
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // If the app is already open, focus it. Otherwise, open it.
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow(event.notification.data.url);
        })
    );
});

// 5. Fetch Event (Your Existing Fix)
self.addEventListener('fetch', (event) => {
  // Ignore requests for audio files or external APIs to prevent crashing
  if (event.request.url.includes('mixkit') || event.request.url.includes('/api/')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // If fetch fails (offline), just return nothing instead of crashing
        return new Response('', { status: 408, statusText: 'Request timed out' });
      });
    })
  );
});