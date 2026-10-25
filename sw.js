// Service worker: lets the installed app open offline with the last loaded data.
// Network first (so standings are always fresh when online), cache as fallback.
const CACHE = 'fpl-admin-v1';
const CACHEABLE_HOSTS = [
  self.location.host,
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Live FPL / proxy requests are never cached: the app has its own fallbacks
  if (!CACHEABLE_HOSTS.includes(url.host)) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: url.host === self.location.host })
        .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html', { ignoreSearch: true }) : undefined)))
  );
});
