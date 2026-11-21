/* Electrical training lab: offline cache. The page is loaded network-first so every open with internet gets the newest version. */
const CACHE = 'ellab-20261121.0136';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.indexOf('ellab-') === 0 && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return; // never touch other sites
  if (u.pathname.endsWith('/version.json')) return; // always from the network
  const page = req.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname);
  if (page) {
    e.respondWith(caches.open(CACHE).then((c) => new Promise((res) => {
      let done = false; const fin = (r) => { if (!done && r) { done = true; res(r); } };
      const tm = setTimeout(() => c.match('index.html').then((h) => h && fin(h)), 5000);
      fetch(req, { cache: 'no-cache' }).then((r) => { if (r && r.ok) { c.put('index.html', r.clone()); clearTimeout(tm); fin(r); } else return c.match('index.html').then((h) => fin(h || r)); })
        .catch(() => c.match('index.html').then((h) => { clearTimeout(tm); fin(h || Response.error()); }));
    })));
    return;
  }
  e.respondWith(caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true }).then((hit) => {
    const net = fetch(req).then((r) => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => hit || c.match('index.html'));
    return hit || net;
  })));
});
