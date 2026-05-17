/* Service worker — site-root scope so it controls all HTML pages.
   Strategy:
   - HTML pages: network-first (always try to get fresh content, fall back to cache offline).
   - Static assets (CSS/JS/SVG/JSON): cache-first with background refresh.
   Bump CACHE on every meaningful asset change. */
const CACHE = 'cca-foundations-v2';

const PRECACHE = [
  'index.html',
  'domain1_study_guide.html', 'domain1_practice.html', 'domain1_build_exercise.html',
  'domain2_study_guide.html', 'domain2_practice.html', 'domain2_build_exercise.html',
  'domain3_study_guide.html', 'domain3_practice.html', 'domain3_build_exercise.html',
  'domain4_study_guide.html', 'domain4_practice.html', 'domain4_build_exercise.html',
  'domain5_study_guide.html', 'domain5_practice.html', 'domain5_build_exercise.html',
  'anti_patterns.html',
  'mock_exam.html',
  'flashcards.html',
  'report.html',
  'assets/css/course.css',
  'assets/css/enhance.css',
  'assets/js/course.js',
  'assets/js/enhance.js',
  'assets/favicon.svg',
  'assets/manifest.webmanifest',
  'assets/data/flashcards.json'
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

  if (isHtmlRequest(req)) {
    // Network-first for HTML so deploys propagate; fall back to cache offline.
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
          const c = await caches.open(CACHE);
          c.put(req, fresh.clone());
        }
        return fresh;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        const home = await caches.match('index.html');
        if (home) return home;
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
