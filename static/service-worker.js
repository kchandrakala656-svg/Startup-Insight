/**
 * Startup Insight — service-worker.js
 * PWA Service Worker: Cache-first for static assets, network-first for API calls.
 * Enables offline access to all 4 HTML pages.
 */

const CACHE_NAME = 'startup-insight-v1';
const RUNTIME_CACHE = 'startup-insight-runtime-v1';

/** Static assets to pre-cache on install */
const PRECACHE_ASSETS = [
  '/',
  '/predict',
  '/result',
  '/history',

  '/static/styles.css',
  '/static/app.js',
  '/static/manifest.json',

  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png'
];

/** Routes that should always go to the network (API calls) */
const NETWORK_ONLY_PATTERNS = [
  '/history-data',
  '/delete-history',
  '/api/',
];

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing…');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating…');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // 2. Network-only for API routes (Flask backend)
  if (NETWORK_ONLY_PATTERNS.some(p => url.pathname.startsWith(p))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3. Cache-first for same-origin static assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        // Not in cache: fetch, clone, cache, return
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          return response;
        }).catch(() => {
          // Offline fallback for HTML pages
          if (event.request.destination === 'document') {
return caches.match('/');          }
        });
      })
    );
    return;
  }

  // 4. Stale-while-revalidate for third-party assets (Google Fonts, etc.)
  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) =>
      cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    )
  );
});

// ── Background Sync placeholder (for future Flask integration) ──
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-predictions') {
    console.log('[SW] Background sync: sync-predictions');
    // Future: flush queued offline predictions to Flask backend
  }
});

// ── Push Notifications placeholder ───────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'Startup Insight', body: 'Your prediction is ready!' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/static/icons/icon-192.png',
badge: '/static/icons/icon-192.png',
    })
  );
});
