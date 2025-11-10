/**
 * =====================================================
 * Whylee — Service Worker v7.4
 * Offline-first caching with update detection + safe filters
 * =====================================================
 */

const CACHE_NAME = "whylee-cache-v7-4";

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
  console.log("[Whylee SW] Activating new service worker...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => key !== CACHE_NAME && caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---------- FETCH ----------
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests or invalid schemes (chrome-extension, data:, etc.)
  if (
    request.method !== "GET" ||
    !request.url.startsWith("http") ||
    request.url.startsWith("chrome-extension://") ||
    request.url.startsWith("data:")
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(request, resClone);
            } catch (err) {
              console.warn("[Whylee SW] Skipped non-cacheable:", request.url);
            }
          });
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
    console.log("[Whylee SW] Update triggered via SKIP_WAITING");
    self.skipWaiting();
  }
});

console.log("[Whylee SW] Registered and running 🎯");
