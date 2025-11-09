/**
 * Whylee Service Worker v7.1
 * Offline-first caching with auto-update and graceful fallbacks.
 */
const CACHE_NAME = "whylee-cache-v7-1";

const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/shell.js",
  "/favicon.svg",
  "/app-icon.svg",
  "/header-graphic.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/poster-01-start.jpg",
  "/poster-level2.jpg",
  "/poster-06-challenge.jpg",
  "/poster-gameover.jpg",
  "/poster-night.jpg",
  "/questions.csv",
  "/site.webmanifest"
];

// ---------- INSTALL ----------
self.addEventListener("install", (event) => {
  console.log("[Whylee SW] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ---------- ACTIVATE ----------
self.addEventListener("activate", (event) => {
  console.log("[Whylee SW] Activating...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// ---------- FETCH ----------
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || request.url.includes("/api/")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic")
            return response;
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
          return response;
        })
        .catch(() => cached || caches.match("/index.html"));
      return cached || fetchPromise;
    })
  );
});

// ---------- MESSAGE ----------
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[Whylee SW] Updating now...");
    self.skipWaiting();
  }
});

console.log("[Whylee SW] Registered and running 🎯");
