// MindSpace service worker — makes the app installable and usable offline.
// Strategy: API calls always hit the network; page navigations are network-first
// (falling back to the cached shell when offline); other same-origin static assets
// are served cache-first. Kept deliberately simple to avoid serving stale builds.
const CACHE = 'mindspace-shell-v3';
const SHELL = ['/', '/index.html', '/logo.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Never intercept API traffic — it must always be live.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // Page navigations: try the network, fall back to the cached shell offline.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/index.html')));
    return;
  }

  // Static assets: serve from cache, then network; cache fresh copies as we go.
  event.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
    )
  );
});
