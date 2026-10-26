/* Offline support and update detection.
   Changes to app or data files are found by fingerprinting their contents, so no version number needs bumping. */
const APP_CACHE = 'app-v1';
const CDN_CACHE = 'cdn-v1';
const META_CACHE = 'meta-v1';
const APP_FILES = [
  './', 'index.html', 'styles.css', 'app.js', 'update.js', 'install.js', 'report.html', 'report.md', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'data/hormone_evidence.csv', 'data/regulators.csv', 'data/soil_persistence.csv', 'data/fruit_mrls.csv', 'data/ripening_ethylene.csv', 'data/flowering_mango_leaf.csv',
  'data/flowering_longan.csv', 'data/flowering_pct_change.csv', 'data/fruitset_fold.csv'
];
/* Files whose contents decide whether the app has changed. */
const WATCHED = APP_FILES.filter(f => f !== './' && !f.startsWith('icons/'));
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  const keep = [APP_CACHE, CDN_CACHE, META_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !keep.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* App files: network first so updates show straight away, falling back to the cached copy offline. */
async function networkFirst(request) {
  const cache = await caches.open(APP_CACHE);
  try {
    /* no-cache: revalidate with the server rather than trusting the browser's HTTP cache (Pages caches for 10 minutes).
       A new Request from the URL, because a page navigation request can't be re-sent with changed options. */
    const response = await fetch(new Request(request.url, {cache: 'no-cache', credentials: 'same-origin'}));
    /* Store under the address without ?v=…, so each file keeps one offline copy whatever its fingerprint. */
    if (response.ok) cache.put(request.url.split('?')[0], response.clone());
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

/* ---------- update detection ---------- */
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

/* Fetch every watched file fresh, refresh the offline copy, and hash the lot. */
async function fingerprint() {
  const cache = await caches.open(APP_CACHE);
  const parts = await Promise.all(WATCHED.map(async file => {
    const response = await fetch(file, {cache: 'no-cache'});
    if (!response.ok) throw new Error(`${file}: ${response.status}`);
    await cache.put(file, response.clone());
    return file + ':' + hex(await crypto.subtle.digest('SHA-256', await response.arrayBuffer()));
  }));
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.join('\n'))));
}

/* Compare with the fingerprint seen last time. The first run only records it. */
async function check() {
  const meta = await caches.open(META_CACHE);
  const stored = await meta.match('fingerprint');
  const previous = stored ? await stored.text() : null;
  const current = await fingerprint();
  if (current !== previous) await meta.put('fingerprint', new Response(current));
  return previous !== null && current !== previous;
}

let running = null;
self.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'CHECK_FOR_UPDATE') return;
  const source = event.source;
  /* One check at a time; a second request waits for the same answer. */
  running = running || check().finally(() => { running = null; });
  event.waitUntil(running
    .then(changed => source && source.postMessage({type: 'UPDATE_CHECKED', changed, reason: event.data.reason}))
    .catch(() => {}));
});
