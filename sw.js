/* Living Your Dream — offline support. Bump VERSION on every release. */
const VERSION = 'lyd-v14';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/privacy.html',
  '/ic-icon-192.png', '/ic-icon-512.png', '/ic-maskable-512.png', '/ic-apple-touch-icon.png',
  '/lora-latin-400-normal.woff2', '/lora-latin-500-normal.woff2', '/lora-latin-700-normal.woff2',
  '/lora-latin-400-italic.woff2', '/lora-latin-700-italic.woff2',
  '/poppins-latin-300-normal.woff2', '/poppins-latin-400-normal.woff2',
  '/poppins-latin-500-normal.woff2', '/poppins-latin-600-normal.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;                       // AI proxy POSTs always go to the network
  if (url.origin === location.origin) {
    if (req.mode === 'navigate') {                        // network first so updates arrive; cache fallback offline
      e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('/index.html', copy)); return r; })
        .catch(() => caches.match('/index.html')));
      return;
    }
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; })));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; }).catch(() => hit)));
  }
  // everything else (geocoding, reference links) is network-only
});
