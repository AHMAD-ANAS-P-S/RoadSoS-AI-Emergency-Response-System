// public/service-worker.js
// RoadSoS PWA Service Worker — offline caching + Background Sync for SOS

const CACHE_NAME = 'roadsos-v1.2';
const API_BASE = self.location.origin;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sql-wasm.wasm',
  '/data/india_tn.sqlite',
];

// ─── INSTALL: cache static assets ────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.filter(Boolean));
    }).then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE: clean old caches ──────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH: offline-first strategy ───────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin API calls
  if (event.request.method !== 'GET') return;
  if (url.hostname !== self.location.hostname && url.hostname !== 'overpass-api.de') return;

  // Network-first for Overpass API (map data), cache fallback
  if (url.hostname === 'overpass-api.de') {
    event.respondWith(
      fetch(event.request, { signal: AbortSignal.timeout(8000) })
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ─── BACKGROUND SYNC: send queued SOS messages ───────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'send-sos') {
    event.waitUntil(sendQueuedSOS());
  }
});

async function sendQueuedSOS() {
  const dbReq = indexedDB.open('roadsos_db', 1);
  dbReq.onsuccess = async (e) => {
    const db = e.target.result;
    const tx = db.transaction(['sos_queue'], 'readwrite');
    const store = tx.objectStore('sos_queue');
    const all = await getAllFromStore(store);

    for (const item of all) {
      try {
        const resp = await fetch(`${API_BASE}/api/sos/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (resp.ok) {
          store.delete(item.id);
          console.log('[SW] Queued SOS sent:', item.id);
        }
      } catch (err) {
        console.warn('[SW] SOS send retry failed:', err);
      }
    }
  };
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || '🚨 RoadSoS Alert', {
      body: data.body || 'Emergency SOS received',
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'roadsos-sos',
      requireInteraction: true,
      actions: [{ action: 'call', title: '📞 Call Now' }, { action: 'dismiss', title: 'Dismiss' }]
    })
  );
});
