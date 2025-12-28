const CACHE_NAME = "bitebox-v9"; // Changed version
const DYNAMIC_CACHE = "bitebox-dynamic-v9";

const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png"
];

// 1. INSTALL
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. FETCH (THE FIX)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 🚨 IGNORE API & SOCKET REQUESTS
  if (
    url.pathname.startsWith("/api") || 
    url.pathname.startsWith("/socket.io") || 
    url.hostname === "localhost" || // Ignore local backend
    url.port === "5000" // Ignore backend port
  ) {
    return; // Let it go to the network directly
  }

  event.respondWith(
    caches.match(event.request).then((cachedRes) => {
      return (
        cachedRes ||
        fetch(event.request).then((fetchRes) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request.url, fetchRes.clone());
            return fetchRes;
          });
        })
      );
    })
  );
});