const CACHE_NAME = "habibs-main-v2";

self.addEventListener("install", (event) => self.skipWaiting());
self.addEventListener("activate", (event) => self.clients.claim());

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ✅ only same-origin GET
  if (req.method !== "GET" || url.origin !== location.origin) return;

  // ✅ cache Next static files (css/js/images/fonts)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;

        const res = await fetch(req);
        cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // ✅ network first for pages, fallback to cache
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
