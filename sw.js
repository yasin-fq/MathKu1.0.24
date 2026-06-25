/* ================================================================
   MathKu Service Worker
   Versi cache: v1.0.25 (Beta) + PWA
   Strategi: Cache-first untuk aset statis, network-first untuk halaman
   ================================================================ */

var CACHE_VERSION = 'mathku-v1.0.25-pwa';
var STATIC_CACHE = CACHE_VERSION + '-static';
var RUNTIME_CACHE = CACHE_VERSION + '-runtime';

// Daftar aset inti yang di-cache saat install (app shell)
var APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icons/favicon-32x32.png',
  './icons/icon-192x192.png',
  './icons/icon-256x256.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon-180x180.png'
];

/* ============== INSTALL: pre-cache app shell ============== */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(function(cache) {
        console.log('[SW] Pre-caching app shell');
        // Gunakan addAll tapi tangani error per-file agar tidak gagal total
        return Promise.all(
          APP_SHELL.map(function(url) {
            return cache.add(url).catch(function(err) {
              console.warn('[SW] Failed to cache:', url, err.message);
            });
          })
        );
      })
      .then(function() {
        console.log('[SW] App shell cached');
        // Force activate immediately
        return self.skipWaiting();
      })
  );
});

/* ============== ACTIVATE: cleanup old caches ============== */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(
          keys
            .filter(function(key) {
              // Hapus cache versi lama
              return key.indexOf(CACHE_VERSION) !== 0;
            })
            .map(function(key) {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(function() {
        console.log('[SW] Activated, taking control');
        return self.clients.claim();
      })
  );
});

/* ============== FETCH: strategi caching ============== */
self.addEventListener('fetch', function(event) {
  var req = event.request;

  // Hanya tangani GET request
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  // Skip cross-origin requests (CDN, dll)
  if (url.origin !== self.location.origin) return;

  // Skip browser extension requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Strategi 1: Network-first untuk halaman HTML (agar update terlihat)
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(req)
        .then(function(res) {
          // Cache halaman baru
          var copy = res.clone();
          caches.open(RUNTIME_CACHE).then(function(cache) {
            cache.put(req, copy);
          });
          return res;
        })
        .catch(function() {
          // Jika offline, ambil dari cache
          return caches.match(req).then(function(cached) {
            if (cached) return cached;
            // Fallback ke root
            return caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Strategi 2: Cache-first untuk aset statis (gambar, CSS, JS, font)
  event.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) {
        // Update cache di background (stale-while-revalidate)
        fetch(req)
          .then(function(res) {
            if (res && res.status === 200) {
              var copy = res.clone();
              caches.open(RUNTIME_CACHE).then(function(cache) {
                cache.put(req, copy);
              });
            }
          })
          .catch(function() { /* offline, biarkan cache */ });
        return cached;
      }
      // Tidak ada di cache, fetch dari network
      return fetch(req)
        .then(function(res) {
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          var copy = res.clone();
          caches.open(RUNTIME_CACHE).then(function(cache) {
            cache.put(req, copy);
          });
          return res;
        })
        .catch(function() {
          // Untuk gambar yang gagal, bisa return placeholder (opsional)
          return new Response('', { status: 404 });
        });
    })
  );
});

/* ============== MESSAGE: handle skipWaiting dari page ============== */
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
