/* Service worker — site-root scope so it controls all HTML pages.
   Strategy:
   - /api/* and /login.html  → never intercept (always hit the network).
   - HTML pages              → network-first (so auth gating / fresh content always reach the user).
   - Static assets           → cache-first with background refresh.
   Bump CACHE on every meaningful asset change. */
const CACHE = 'cca-foundations-v3';

const PRECACHE = [
  '/assets/css/course.css',
  '/assets/css/enhance.css',
  '/assets/js/course.js',
  '/assets/js/enhance.js',
  '/assets/js/sync.js',
  '/assets/favicon.svg',
  '/assets/manifest.webmanifest',
  '/assets/data/flashcards.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(PRECACHE.map(u => c.add(u).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

function isHtmlRequest(req) {
  if (req.mode === 'navigate') return true;
  const a = req.headers.get('accept') || '';
  return a.includes('text/html');
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Never intercept auth / API / login page — they must always be live.
  if (url.pathname.startsWith('/api/') || url.pathname === '/login.html') return;

  if (isHtmlRequest(req)) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        // Only cache successful 2xx HTML responses (skip 3xx redirects to /login.html).
        if (fresh && fresh.ok && (fresh.headers.get('content-type') || '').includes('text/html')) {
          const c = await caches.open(CACHE);
          c.put(req, fresh.clone());
        }
        return fresh;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Cache-first for static assets, with stale-while-revalidate.
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const networkPromise = fetch(req).then(r => {
      if (r && r.ok) caches.open(CACHE).then(c => c.put(req, r.clone()));
      return r;
    }).catch(() => null);
    return cached || (await networkPromise) ||
      new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});
