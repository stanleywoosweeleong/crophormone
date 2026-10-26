/* Offline support and update detection.
   Changes to app or data files are found by fingerprinting their contents, so no version number needs bumping. */
/* Cache storage is shared by every site on stanleywoosweeleong.github.io, so this app's caches carry its own prefix
   and only those (plus the unprefixed names this app used before) are ever deleted. */
const PREFIX = 'crophormone-';
const APP_CACHE = PREFIX + 'app-v1';
const CDN_CACHE = PREFIX + 'cdn-v1';
const META_CACHE = PREFIX + 'meta-v1';
const OLD_CACHES = ['app-v1', 'cdn-v1', 'cdn-v2', 'meta-v1'];
const APP_FILES = [
  './', 'index.html', 'styles.css', 'app.js', 'update.js', 'install.js', 'report.html', 'report.md', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'data/hormone_evidence.csv', 'data/regulators.csv', 'data/soil_persistence.csv', 'data/fruit_mrls.csv', 'data/ripening_ethylene.csv', 'data/flowering_mango_leaf.csv',
  'data/flowering_longan.csv', 'data/flowering_pct_change.csv', 'data/fruitset_fold.csv'
];
/* Files whose contents decide whether the app has changed. */
const WATCHED = APP_FILES.filter(f => f !== './' && !f.startsWith('icons/'));
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
/* The chart library is stored at install, so the app works offline from the second launch even if the browser's own
   cache has dropped it. Kept in step with the script tag in index.html. */
const CDN_FILES = ['https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'];

self.addEventListener('install', event => {
  event.waitUntil(Promise.all([
    caches.open(APP_CACHE).then(c => c.addAll(APP_FILES)),
    /* Best effort: a CDN hiccup must not stop the app files from installing; the fetch handler stores it later. */
    caches.open(CDN_CACHE).then(c => c.addAll(CDN_FILES.map(u => new Request(u, {mode: 'cors', credentials: 'omit'})))).catch(() => {})
  ]).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  const keep = [APP_CACHE, CDN_CACHE, META_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(k => (k.startsWith(PREFIX) && !keep.includes(k)) || OLD_CACHES.includes(k))
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* App files: network first so updates show straight away, falling back to the cached copy offline. On a stalled
   connection the cached copy is used after a few seconds, and the network answer still refreshes the cache. */
const NETWORK_TIMEOUT_MS = 4000;
async function networkFirst(event) {
  const {request} = event;
  const cache = await caches.open(APP_CACHE);
  const cachedCopy = () => cache.match(request, {ignoreSearch: true})
    .then(hit => hit || (request.mode === 'navigate' ? cache.match('index.html') : undefined));
  /* no-cache: revalidate with the server rather than trusting the browser's HTTP cache (Pages caches for 10 minutes).
     A new Request from the URL, because a page navigation request can't be re-sent with changed options. */
  const network = fetch(new Request(request.url, {cache: 'no-cache', credentials: 'same-origin'})).then(async response => {
    /* Store under the address without ?v=…, so each file keeps one offline copy whatever its fingerprint. */
    if (response.ok) {
      cache.put(request.url.split('?')[0], response.clone()).catch(() => {});
      return response;
    }
    /* A server error (404, 503…) must not replace a good offline copy. */
    return (await cachedCopy()) || response;
  });
  event.waitUntil(network.catch(() => {}));
  let timer;
  const slow = new Promise(resolve => { timer = setTimeout(resolve, NETWORK_TIMEOUT_MS); })
    .then(cachedCopy).then(hit => hit || network);
  try {
    return await Promise.race([network, slow]);
  } catch (err) {
    const hit = await cachedCopy();
    if (hit) return hit;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* Libraries and fonts never change at a pinned URL: cache first. */
async function cacheFirst(request) {
  const cache = await caches.open(CDN_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  /* Only a readable success: the pages load these with crossorigin, so a CDN error is never stored. */
  if (response.ok) cache.put(request, response.clone()).catch(() => {});
  return response;
}

self.addEventListener('fetch', event => {
  const {request} = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) event.respondWith(networkFirst(event));
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
  const source = event.source, reason = event.data.reason;
  /* One check at a time; a second request waits for the same answer. */
  running = running || check().finally(() => { running = null; });
  event.waitUntil(running
    .then(async changed => {
      /* The asking tab learns either way; when files changed every other open tab is told too, since the stored
         fingerprint is now updated and their own checks would no longer see the change. */
      if (source) source.postMessage({type: 'UPDATE_CHECKED', changed, reason});
      if (!changed) return;
      const others = (await self.clients.matchAll({type: 'window'})).filter(c => !source || c.id !== source.id);
      others.forEach(c => c.postMessage({type: 'UPDATE_CHECKED', changed, reason: 'resume'}));
    })
    .catch(() => {}));
});
