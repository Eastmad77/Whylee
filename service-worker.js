// ======================================================
// Whylee — Service Worker v3.8.0 (poster assets + CSV)
// ======================================================

const STATIC = 'whylee-static-v3.8.0';
const RUNTIME = 'whylee-runtime-v3.8.0';

const ASSETS = [
  '/', '/index.html',
  '/style.css', '/app.js', '/shell.js',
  '/about.html','/contact.html','/privacy.html','/terms.html','/signin.html','/pro.html','/admin.html','/menu.html','/404.html',
  '/favicon.svg','/app-icon.svg','/header-graphic.svg','/icon-192.png','/icon-512.png',
  '/site.webmanifest',
  // Posters
  '/poster-01-start.jpg','/poster-level2.jpg','/poster-06-challenge.jpg','/poster-gameover.jpg','/poster-night.jpg',
  // Data
  '/questions.csv'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => {
      if (![STATIC, RUNTIME].includes(key)) return caches.delete(key);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (ASSETS.includes(url.pathname)) {
      event.respondWith(cacheFirst(req));
    } else {
      event.respondWith(staleWhileRevalidate(req));
    }
    return;
  }

  event.respondWith(fetch(req).catch(() => caches.match(req)));
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((res) => {
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => cached || Response.error());
  return cached || fetchPromise;
}
