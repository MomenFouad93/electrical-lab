/* Make the installable web app (PWA) from dist/electrical-lab.html -> pwa/
   Adds manifest + icons + a hash-based Content-Security-Policy, writes sw.js and version.json. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'pwa');
const ICONS = process.env.ICONS || '/home/claude/electrical-lab/icons';
const NOTE = process.env.NOTE || '';
let html = fs.readFileSync(path.join(ROOT, 'dist/electrical-lab.html'), 'utf8');
const BUILD = fs.readFileSync(path.join(ROOT, 'dist/build.txt'), 'utf8').trim();
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true });
for (const f of fs.readdirSync(ICONS)) fs.copyFileSync(path.join(ICONS, f), path.join(OUT, 'icons', f));

// hashes of every inline script
const hashes = [];
html.replace(/<script>([\s\S]*?)<\/script>/g, (m, body) => { hashes.push("'sha256-" + crypto.createHash('sha256').update(body, 'utf8').digest('base64') + "'"); return m; });
const csp = ["default-src 'none'", 'script-src ' + hashes.join(' '), "style-src 'unsafe-inline'", "img-src 'self' data: blob:", "media-src 'self' data: blob:", "font-src 'self' data:",
  "connect-src 'self' https://api.anthropic.com", "worker-src 'self'", "manifest-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"].join('; ');
const head = `<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="no-referrer">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-title" content="Electrical Lab">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="mobile-web-app-capable" content="yes">`;
html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + head);
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
  name: 'Electrical training lab', short_name: 'Electrical Lab', id: './', start_url: './', scope: './', display: 'standalone', orientation: 'any',
  description: 'Electrical bench, process plant and PLC ladder projects, LOTO practice board, PCB repair and inspection trainer.',
  background_color: '#0c1423', theme_color: '#0c1423',
  icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
}, null, 2));
fs.writeFileSync(path.join(OUT, 'version.json'), JSON.stringify({ build: BUILD, note: NOTE }));
fs.writeFileSync(path.join(OUT, 'sw.js'), `/* Electrical training lab: offline cache. The page is loaded network-first so every open with internet gets the newest version. */
const CACHE = 'ellab-${BUILD}';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.indexOf('ellab-') === 0 && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return; // never touch other sites
  if (u.pathname.endsWith('/version.json')) return; // always from the network
  const page = req.mode === 'navigate' || /\\/(index\\.html)?$/.test(u.pathname);
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
`);
console.log('pwa', BUILD, 'scripts', hashes.length, (fs.statSync(path.join(OUT, 'index.html')).size / 1024).toFixed(0) + ' KB');
