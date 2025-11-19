// Whylee — PWA Service Worker

const STATIC = "whylee-static-v3.8.0";
const RUNTIME = "whylee-runtime-v3.8.0";

const ASSETS = [
  "/", "/index.html",
  "/style.css", "/app.js", "/shell.js",
  "/favicon.svg","/app-icon.svg","/header-graphic.svg",
  "/icon-192.png","/icon-512.png",
  "/site.webmanifest",
  "/poster-01-start.jpg",
  "/questions.csv"
];

self.addEventListener("install", (evt)=>{
  evt.waitUntil(
    caches.open(STATIC).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evt)=>{
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key=>{
        if (![STATIC, RUNTIME].includes(key)) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch",(evt)=>{
  const req = evt.request;
  const url = new URL(req.url);

  // Only GET
  if (req.method !== "GET") return;

  // Same-origin
  if (url.origin === location.origin){

    // Asset → cache-first
    if (ASSETS.includes(url.pathname)){
      evt.respondWith(
        caches.open(STATIC).then(async cache=>{
          const cached = await cache.match(req);
          if (cached) return cached;

          const net = await fetch(req);
          if (net && net.ok) cache.put(req, net.clone());
          return net;
        })
      );
      return;
    }

    // Others → stale-while-revalidate
    evt.respondWith(
      caches.open(RUNTIME).then(async cache=>{
        const cached = await cache.match(req);
        const fetchPromise = fetch(req).then(net=>{
          if (net && net.ok) cache.put(req, net.clone());
          return net;
        });
        return cached || fetchPromise;
      })
    );

    return;
  }

  // External → network fallback to cache
  evt.respondWith(
    fetch(req).catch(()=>caches.match(req))
  );
});
