// A&D MAX service worker: makes the site installable and lets the installed app open offline.
// Pages are network-first (always fresh); only the app shell is cached as an offline fallback.
// API, media and cross-origin requests are never touched.
const SHELL = 'admax-shell-v1';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.add('/')).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== SHELL).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.mode !== 'navigate' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(SHELL).then(cache => cache.put('/', copy)); }
    return response;
  }).catch(() => caches.match('/')));
});

// Full sign-out cleanup (formerly auth-service-worker.js).
self.addEventListener('message', event => {
  if (event.data?.type !== 'LOGOUT') return;
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).map(key => caches.delete(key)));
    if (self.indexedDB?.databases) for (const db of await self.indexedDB.databases()) if (db.name) self.indexedDB.deleteDatabase(db.name);
    for (const client of await self.clients.matchAll()) client.postMessage({ type: 'LOGOUT_CLEANUP_COMPLETE', timestamp: new Date().toISOString() });
  })());
});
