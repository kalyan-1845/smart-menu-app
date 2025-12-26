const CACHE_NAME = "bitebox-v4";
const DYNAMIC_CACHE = "bitebox-dynamic-v4";

// 1. FILES TO CACHE IMMEDIATELY (Static Assets)
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png"
];

// 2. INSTALL EVENT
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force activation immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("✅ SW: Caching Shell Assets");
      return cache.addAll(ASSETS);
    })
  );
});

// 3. ACTIVATE EVENT (Cleanup Old Caches)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log("🧹 SW: Removing Old Cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 4. FETCH EVENT (The Smart Interceptor)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // A. IGNORE API CALLS (Network Only)
  // We NEVER cache API calls because they change constantly (e.g., Order Status)
  if (url.pathname.startsWith("/api") || event.request.method !== "GET") {
    return; // Let the browser handle it normally
  }

  // B. HANDLE STATIC FILES (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedRes) => {
      return (
        cachedRes ||
        fetch(event.request)
          .then((fetchRes) => {
            return caches.open(DYNAMIC_CACHE).then((cache) => {
              // Cache new files for next time
              cache.put(event.request.url, fetchRes.clone());
              return fetchRes;
            });
          })
          .catch(() => {
            // C. OFFLINE FALLBACK (Optional)
            if (event.request.headers.get("accept").includes("text/html")) {
              return caches.match("/index.html");
            }
          })
      );
    })
  );
});