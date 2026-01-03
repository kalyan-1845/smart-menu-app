const CACHE_NAME = 'bitebox-v3.0'; // ✅ Bumping to v3.0 forces a clean slate for all users

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

// 3. Push Event - Staff Alerts
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

// 5. Fetch Event - Optimized to fix MIME type & Reference Errors

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // ✅ BYPASS CACHE: Always get real-time data from server
    if (url.pathname.startsWith('/api/') || url.hostname.includes('socket.io')) {
        return; 
    }

    // ✅ NETWORK-FIRST: Scripts and Styles
    // This stops the "MIME type text/html" error by checking the server for the latest file hashes
    if (event.request.destination === 'script' || event.request.destination === 'style') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // ✅ CACHE-FIRST: Images and Static Assets
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((response) => {
                if (response.status === 200) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                }
                return response;
            });
        })
    );
});