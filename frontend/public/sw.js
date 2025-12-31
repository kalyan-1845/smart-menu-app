const CACHE_NAME = 'smart-menu-cache-v1';

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event
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

// Fetch Event (The Fix)
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