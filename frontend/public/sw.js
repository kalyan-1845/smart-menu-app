const CACHE_NAME = 'bitebox-v2';

// 1. Install Event - Force update to the latest logic immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// 2. Activate Event - Clean up old cache versions to save mobile storage
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
    return self.clients.claim();
});

// 3. Push Event - The Brains of Staff Alerts (Chef & Waiter Notifications)
self.addEventListener('push', function(event) {
    if (!event.data) return;

    try {
        const data = event.data.json();
        
        // Critical for Staff: Intense vibration and persistent visibility
        const options = {
            body: data.body,
            icon: '/logo192.png',
            badge: '/logo192.png',
            // Attention-grabbing vibration pattern: SOS style
            vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40], 
            data: { url: data.url || '/' },
            tag: 'staff-alert', 
            renotify: true, 
            requireInteraction: true, // IMPORTANT: Notification stays until swiped/clicked
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

// 4. Notification Click Event - Smart Window Management
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    if (event.action === 'close') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            const targetUrl = event.notification.data.url;

            // If a staff member already has the dashboard open, just focus it
            for (let client of clientList) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Otherwise, open a fresh window (App View)
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// 5. Fetch Event - Optimized for High-Speed & Low Bandwidth
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // ✅ BYPASS CACHE for real-time traffic
    // We never cache API calls, Socket.io, or external alert sounds
    if (url.pathname.startsWith('/api/') || 
        url.hostname.includes('socket.io') || 
        url.hostname.includes('mixkit.co')) {
        return; 
    }

    // ✅ CACHE-FIRST for Static Assets (Images, CSS, JS)
    // This makes the menu load in < 200ms for returning customers
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                // Cache only valid UI assets
                if (event.request.method === 'GET' && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Return a custom offline message for the Menu
                if (event.request.mode === 'navigate') {
                    return new Response(
                        '<h1>Connection Lost</h1><p>BiteBox requires internet for live menu updates.</p>', 
                        { headers: { 'Content-Type': 'text/html' } }
                    );
                }
            });
        })
    );
});