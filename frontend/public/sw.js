'use strict';

const CACHE      = 'emdadx-v1';
const APP_SHELL  = ['/', '/index.html', '/manifest.json'];
const DB_NAME    = 'emdadx-offline';
const QUEUE_STORE = 'sync_queue';
const SNAP_STORE  = 'data_snapshot';

/* ── Install: cache app shell ── */
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL).catch(() => {}))
  );
});

/* ── Activate: claim clients ── */
self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

/* ── Fetch: serve from cache when offline ── */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only intercept same-origin GET requests for app shell
  if (e.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return; // never cache API

  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request)
        .then(res => {
          if (res && res.status === 200 && res.type !== 'opaque') {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached); // offline fallback
      return cached || networkFetch;
    })
  );
});

/* ── Background Sync: flush queue when online ── */
self.addEventListener('sync', e => {
  if (e.tag === 'emdadx-sync') {
    e.waitUntil(flushQueue());
  }
});

/* ── Message from page: queue an API call ── */
self.addEventListener('message', e => {
  if (e.data?.type === 'QUEUE_SAVE') {
    queueSave(e.data.payload).then(() => {
      e.ports[0]?.postMessage({ ok: true });
      // Try immediate flush
      flushQueue();
    });
  }
  if (e.data?.type === 'FLUSH_NOW') {
    flushQueue().then(result => {
      e.ports[0]?.postMessage(result);
    });
  }
});

/* ── IndexedDB helpers ── */
function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE))
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains(SNAP_STORE))
        db.createObjectStore(SNAP_STORE, { keyPath: 'key' });
    };
    req.onsuccess = e => res(e.target.result);
    req.onerror  = () => rej(req.error);
  });
}

async function queueSave(payload) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).add({ payload, ts: Date.now() });
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
}

async function getQueue() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(QUEUE_STORE).objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror   = () => rej(req.error);
  });
}

async function clearQueue() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).clear();
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
}

async function flushQueue() {
  const items = await getQueue();
  if (!items.length) return { flushed: 0 };

  // Take the LATEST snapshot only (no need to send all intermediate states)
  const latest = items[items.length - 1];
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Offline-Sync': '1' },
      body: JSON.stringify(latest.payload)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    await clearQueue();

    // Notify all open windows
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => c.postMessage({ type: 'SYNC_COMPLETE', ts: Date.now() }));

    return { flushed: items.length, ok: true };
  } catch (e) {
    return { flushed: 0, error: e.message };
  }
}
