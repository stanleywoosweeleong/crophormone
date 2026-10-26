/* Offline support. Bump VERSION whenever app files change so phones pick up the new copy. */
const VERSION = 'v1';
const APP_CACHE = `app-${VERSION}`;
const CDN_CACHE = 'cdn-v1';
const APP_FILES = [
  './', 'index.html', 'styles.css', 'app.js', 'report.html', 'report.md', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'data/lifecycle_direction.csv', 'data/ripening_ethylene.csv', 'data/flowering_mango_leaf.csv',
  'data/flowering_longan.csv', 'data/flowering_pct_change.csv', 'data/fruitset_fold.csv'
];
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('app-') && k !== APP_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* App files: network first so updates show straight away, falling back to the cached copy offline. */
async function networkFirst(request) {
  const cache = await caches.open(APP_CACHE);
  try {
    /* no-cache: revalidate with the server rather than trusting the browser's HTTP cache (Pages caches for 10 minutes). */
    const response = await fetch(request, {cache: 'no-cache'});
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request, {ignoreSearch: true});
    if (cached) return cached;
    if (request.mode === 'navigate') return cache.match('index.html');
    throw err;
  }
}

/* Libraries and fonts never change at a pinned URL: cache first. */
async function cacheFirst(request) {
  const cache = await caches.open(CDN_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const {request} = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) event.respondWith(networkFirst(request));
  else if (CDN_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(request));
});
