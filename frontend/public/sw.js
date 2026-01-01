const CACHE_NAME = 'bitebox-cache-v2'; // Incremented version for update detection

// 1. Install Event
self.addEventListener('install', (event) => {
  // Force the new service worker to take control immediately
  self.skipWaiting();
});

// 2. Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Cleaning old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control of all clients immediately
  return self.clients.claim();
});

// 3. Push Event (The Brains of Staff Alerts)
self.addEventListener('push', function(event) {
    if (!event.data) return;

    try {
        const data = event.data.json();
        
        // --- 🛠️ SUGGESTION: ADD ACTIONS ---
        // This allows staff to interact directly from the notification bar
        const options = {
            body: data.body,
            icon: '/logo192.png',
            badge: '/logo192.png',
            vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40], // Long Attention Pattern
            data: { url: data.url || '/' },
            tag: 'staff-alert', // Groups notifications to prevent clutter
            renotify: true, // Forces phone to vibrate even if previous notification is still there
            requireInteraction: true, // Keeps notification on screen until staff clicks it
            actions: [
                { action: 'open', title: '✅ Open Dashboard' },
                { action: 'close', title: '❌ Dismiss' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    } catch (err) {
        console.error('Push handling error:', err);
    }
});

// 4. Notification Click Event
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    // Handle button actions
    if (event.action === 'close') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // Find the target URL from the push data
            const targetUrl = event.notification.data.url;

            // If a window is already open, focus it and navigate to the specific path
            for (let client of clientList) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// 5. Fetch Event (Optimized for 100k+ users)
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // STRATEGY: Bypass cache for Audio and API to ensure real-time accuracy
  if (url.includes('mixkit') || url.includes('/api/') || url.includes('socket.io')) {
    return; 
  }

  // STRATEGY: Cache-First for UI Assets (CSS/JS/Images) to save bandwidth
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
          // Only cache successful GET requests for UI files
          if (event.request.method === 'GET' && fetchRes.status === 200) {
              return caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, fetchRes.clone());
                  return fetchRes;
              });
          }
          return fetchRes;
      }).catch(() => {
        // Fallback for offline mode
        return new Response('Offline: BiteBox requires internet for live updates.', { 
            status: 503, 
            headers: { 'Content-Type': 'text/plain' } 
        });
      });
    })
  );
});