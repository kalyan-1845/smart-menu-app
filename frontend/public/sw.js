const CACHE_NAME = "bitebox-v5"; // 👈 Version Bump to force update
const DYNAMIC_CACHE = "bitebox-dynamic-v5";

// 1. STATIC ASSETS (The "Shell" of your app)
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png"
];

// 2. INSTALL: Cache the Shell immediately
self.addEventListener("install", (event) => {
  self.skipWaiting(); // ⚡ Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("✅ SW: Caching App Shell");
      return cache.addAll(ASSETS);
    })
  );
});

// 3. ACTIVATE: Delete OLD Caches (Self-Cleaning)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // If the cache name doesn't match V5, delete it
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log("🧹 SW: Cleaning Old Cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 4. FETCH: The Smart Logic
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // --- RULE A: IGNORE API & NON-GET REQUESTS (Network Only) ---
  // This is CRITICAL. It ensures Orders/Logins NEVER get stuck in cache.
  if (
    url.pathname.startsWith("/api") || 
    url.href.includes("onrender.com") || // 🛡️ Extra Safety for your Backend
    event.request.method !== "GET"
  ) {
    return; // Let the browser handle it (Internet Only)
  }

  // --- RULE B: CACHE STATIC FILES (Stale-While-Revalidate) ---
  // Images, CSS, JS load from cache first (Fast), then update in background.
  event.respondWith(
    caches.match(event.request).then((cachedRes) => {
      // 1. Return cached file if found (Instant Load)
      if (cachedRes) {
        // (Optional) Update cache in background for next time
        fetch(event.request)
            .then(res => caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, res.clone())))
            .catch(() => {}); 
        return cachedRes;
      }

      // 2. If not in cache, fetch from internet
      return fetch(event.request)
        .then((fetchRes) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            // Save it for next time
            cache.put(event.request.url, fetchRes.clone());
            return fetchRes;
          });
        })
        .catch(() => {
          // 3. OFFLINE FALLBACK (If internet dies)
          if (event.request.headers.get("accept").includes("text/html")) {
            return caches.match("/index.html");
          }
        });
    })
  );
});