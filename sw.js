/**
 * FILE: sw.js
 * LOCATION: repository root (same level as game.html and index.html)
 *
 * Service Worker for Infusion Arcade — Dosecraft
 * Strategy: Cache-first for static assets, network-first for HTML pages.
 *
 * Why this matters for Companion Mode:
 *   The infusion session timer lives in localStorage + React state, NOT in network
 *   requests. This SW never touches localStorage. Caching assets here only speeds
 *   up resource loading; it cannot cause the timer to reset.
 *
 * Cache invalidation: bump CACHE_VERSION whenever you deploy a new build.
 */

const CACHE_VERSION = 'v1.0.17';
const CACHE_NAME    = `infusion-arcade-${CACHE_VERSION}`;

// ─── Core files to pre-cache on install ──────────────────────────────────────
// These are the files that must load for the game to start at all.
// Adjust paths if your repo structure differs from the standard layout.
const PRECACHE_URLS = [
  '/game.html',
  '/index.html',
  '/InfusionArcade.js',
  '/homeInfusionApp.js',
  '/homeInfusionStore.js',
  '/homeInfusionCopy.js',
  '/drugCatalog.js',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// ─── Install: pre-cache core assets ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll() is atomic — if any URL fails the whole install fails gracefully.
      // We catch per-URL so a single 404 doesn't break the whole SW on GitHub Pages.
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Pre-cache skipped (${url}):`, err.message);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: delete old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('infusion-arcade-') && key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: tiered caching strategy ──────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests (don't intercept CDN calls for Babel/React)
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests (POST, etc.)
  if (request.method !== 'GET') return;

  // Skip browser-extension and chrome-extension URLs
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

  // ── HTML pages: Network-first so users always get the freshest markup ──
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request).then(c => c || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // ── Static assets (JS, CSS, images, fonts): Cache-first ──
  // Audio files are excluded from caching — browsers fetch them with range
  // requests (status 206) which cache.put() rejects. Let audio load direct.
  const isAudio = request.url.match(/\.(mp3|ogg|wav|webm|aac|m4a)(\?|$)/i);
  if (isAudio) return; // let the browser handle audio natively

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((networkResponse) => {
        // Only cache complete responses (status 200). Skip 206 partial content.
        if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Network failed and no cache hit — return nothing gracefully.
        // This prevents the unhandled rejection noise in the console.
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
