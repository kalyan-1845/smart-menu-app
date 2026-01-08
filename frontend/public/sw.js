const CACHE_NAME = 'kovixa-forever-v5.2'; // ⬆️ Bumping version to force "Forever" update

// 1. Install Event - Force immediate takeover
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// 2. Activate Event - Clear all old caches automatically
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Clearing old system cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// 3. Push Event - Staff Alerts (Retained from your code)
self.addEventListener('push', function(event) {
    if (!event.data) return;
    try {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/logo192.png',
            badge: '/logo192.png',
            vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40], 
            data: { url: data.url || '/' },
            tag: 'staff-alert', 
            renotify: true, 
            requireInteraction: true,
            actions: [
                { action: 'open', title: '✅ Open Dashboard' },
                { action: 'close', title: '❌ Dismiss' }
            ]
        };
        event.waitUntil(self.registration.showNotification(data.title, options));
    } catch (err) {
        console.error('Push error:', err);
    }
});

// 4. Notification Click
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    if (event.action === 'close') return;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            const targetUrl = event.notification.data.url;
            for (let client of clientList) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});

// 5. Fetch Event - "FOREVER" CACHE STRATEGY
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 🔴 SAFETY 1: IGNORE API & SOCKETS (Never cache these)
    // This ensures your Live Orders are ALWAYS real-time.
    if (url.pathname.startsWith('/api/') || url.hostname.includes('socket.io')) {
        return; 
    }

    // 🔴 SAFETY 2: IGNORE EXTENSIONS (Fixes console errors)
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
        return;
    }

    // ✅ STRATEGY A: HTML (Navigation) -> NETWORK FIRST
    // We ALWAYS try to fetch the new index.html first.
    // This prevents the "MIME Type" error because it updates the pointer to the JS files.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    const copy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    return networkResponse;
                })
                .catch(() => {
                    // Offline? Serve the last cached HTML
                    return caches.match(event.request);
                })
        );
        return;
    }

    // ✅ STRATEGY B: ASSETS (JS, CSS, Images) -> CACHE FIRST (FOREVER)
    // We check the cache first. If it's there, we return it instantly.
    // Because your built files have unique hashes (e.g. index-A1b2.js),
    // we never need to update them. They live forever until deleted.
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // 🚀 Return immediately from storage
            }

            return fetch(event.request).then((networkResponse) => {
                // Verify valid response
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Save to cache for next time (Forever)
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            });
        })
    );
});