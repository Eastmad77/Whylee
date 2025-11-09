/**
 * Whylee Service Worker v7.0
 * -------------------------------------------
 * Provides offline caching for static assets,
 * poster transitions, icons, and manifest.
 */

const CACHE_NAME = "whylee-cache-v7";
const ASSETS = [
  "/",                    // root
  "/index.html",
  "/style.css",
  "/app.js",
  "/shell.js",
  "/site.webmanifest",
  "/favicon.svg",
  "/app-icon.svg",
  "/header-graphic.svg",
  "/icon-192.png",
  "/icon-512.png",

  // --- Posters (for splash transitions) ---
  "/poster-01-start.jpg",
  "/poster-level2.jpg",
  "/poster-06-challenge.jpg",
  "/poster-gameover.jpg",
  "/poster-night.jpg",

  // --- Fallback CSV ---
  "/questions.csv"
];

// -------- INSTALL --------
self.addEventListener("install", (event) => {
  console.log("[Whylee SW] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// -------- ACTIVATE --------
self.addEventListener("activate", (event) => {
  console.log("[Whylee SW] Activating new service worker...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Whylee SW] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// -------- FETCH HANDLER --------
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Never cache POST or API generation calls
  if (request.method !== "GET" || request.url.includes("/api/")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((res) => {
          if (!res || res.status !== 200 || res.type !== "basic") {
            return res;
          }
          const cloned = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return res;
        })
        .catch(() => cached || caches.match("/index.html"));

      // Return cache first, update in background
      return cached || networkFetch;
    })
  );
});

// -------- MESSAGE (skipWaiting) --------
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

console.log("[Whylee SW] Registered and running 🎯");
