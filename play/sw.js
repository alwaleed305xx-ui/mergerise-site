// MergeRise service worker: offline shell, network-first for app files so updates land fast.
// Fonts are bundled (fonts/ + css/fonts.css), so the game itself never talks to another origin.
const CACHE = 'mergerise-v11';
const FONTS = ['baloo2-800-latin', 'baloo2-800-latin-ext', 'cairo-var-arabic', 'cairo-var-latin', 'cairo-var-latin-ext',
  'poppins-500-latin', 'poppins-500-latin-ext', 'poppins-600-latin', 'poppins-600-latin-ext',
  'poppins-700-latin', 'poppins-700-latin-ext', 'poppins-800-latin', 'poppins-800-latin-ext'].map(f => `./fonts/${f}.woff2`);
const SHELL = ['./', './index.html', './manifest.json', './css/fonts.css?v=1', './css/app.css?v=7', './css/style.css?v=4', './css/rivals.css?v=3', './css/daily.css?v=3', './js/build-config.js', './js/app.js?v=5', './icons/icon-192.png', './icons/icon-512.png', ...FONTS];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // nothing third-party is cached
  if (url.pathname.includes('/fonts/')) { // font files never change under the same name: cache-first
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })));
    return;
  }
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
