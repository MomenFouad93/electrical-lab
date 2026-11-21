/* Serve pwa/ over http, check: no CSP violations, features work under CSP, offline reload, update banner, hostile files. */
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'pwa');
let version = null;
const srv = http.createServer((q, r) => {
  let f = decodeURIComponent(q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html';
  if (f === '/version.json' && version) { r.writeHead(200, { 'content-type': 'application/json' }); return r.end(version); }
  const p = path.join(ROOT, f);
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) { r.writeHead(404); return r.end(); }
  const ct = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' }[path.extname(p)] || 'application/octet-stream';
  r.writeHead(200, { 'content-type': ct }); fs.createReadStream(p).pipe(r);
}).listen(8099);
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  const p = await ctx.newPage(); const errs = [], csp = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); if (/Content Security Policy|Refused to/.test(m.text())) csp.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  p.on('dialog', (d) => d.accept());
  await p.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); });
  await p.goto('http://127.0.0.1:8099/'); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => !!(window.EL && EL.bench && EL.bench.ed)), 'app started under CSP');
  // use the main features
  await p.click('#tabs .tab[data-v=projects]'); await p.waitForTimeout(300);
  for (const id of ['tank', 'booster', 'ro']) { await p.evaluate((x) => EL.projects.open(x, 'plant'), id); await p.waitForTimeout(700); await p.evaluate(() => EL.bench.setView('ladder')); await p.waitForTimeout(400); await p.evaluate(() => EL.bench.setView('panel')); await p.waitForTimeout(300); }
  for (const t of ['loto', 'pcb', 'inspect', 'guide', 'bench']) { await p.click('#tabs .tab[data-v=' + t + ']'); await p.waitForTimeout(500); }
  const v1 = await p.evaluate(() => window.__csp);
  ok(!v1.length && !csp.length, 'no CSP violations while using every tab: ' + JSON.stringify(v1.concat(csp)).slice(0, 300));
  // service worker + offline
  const sw = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  ok(sw, 'service worker active');
  await p.reload(); await p.waitForTimeout(1200);
  await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => !!(window.EL && EL.bench && EL.bench.ed && document.querySelector('#tabs'))), 'opens offline from the cache');
  await ctx.setOffline(false);
  // update banner
  const build = await p.evaluate(() => EL.BUILD);
  version = JSON.stringify({ build: '9' + build, note: 'test note' });
  await p.evaluate(() => EL.checkUpdate(true)); await p.waitForTimeout(800);
  ok(await p.evaluate(() => !!document.querySelector('.upd-bar')), 'update bar shows when a newer build is published');
  version = null;
  // hostile project file
  const evil = JSON.stringify({ v: 1, name: '<img src=x onerror="window.__xss=1">', parts: [{ id: 'P1', type: 'LAMP', x: 0, y: 0, tag: '<svg onload="window.__xss=2">', props: { volt: '230VAC' } }], wires: [{ id: 'W1', a: 'P1.X1', b: 'P1.X2', evil: '<script>window.__xss=3</script>' }], plant: { units: [{ id: 'U1', type: 'TANK', x: 0, y: 0, tag: '"><img src=x onerror=window.__xss=4>', props: { sw: [{ n: '<b onmouseover=x>', l: 50, t: '' }] } }], pipes: [] } });
  fs.writeFileSync('/tmp/claude-0/evil.json', evil);
  await p.click('#tabs .tab[data-v=projects]'); await p.waitForTimeout(300);
  await p.evaluate(() => { const u = document.querySelector('.upd-bar'); if (u) u.remove(); });
  await p.setInputFiles('#projRoot input[type=file]', '/tmp/claude-0/evil.json'); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => EL.bench.ed.c.parts.length === 1 && EL.bench.ed.c.plant.units.length === 1), 'hostile file still loads its harmless parts');
  await p.evaluate(() => EL.bench.setView('plant')); await p.waitForTimeout(600);
  ok(await p.evaluate(() => !window.__xss), 'hostile project file runs no script');
  ok(await p.evaluate(() => !document.querySelector('#v-bench img[src=x], #v-bench [onerror], #v-bench [onload]')), 'no injected elements in the page');
  // ladder JSON with markup
  const ok2 = await p.evaluate(() => { const pr = EL.ladder.sanitize({ sym: { 'I0.0': '<img src=x onerror=alert(1)>' }, nets: [{ c: '<script>x</script>', s: [{ t: 'NO', a: '"><svg onload=1>' }], o: [{ t: 'COIL', a: 'Q0.0' }] }] }); return !/[<>]/.test(JSON.stringify(pr)); });
  ok(ok2, 'ladder sanitiser strips markup');
  ok(!errs.filter((e) => !/favicon|404/.test(e)).length, 'no page errors: ' + errs.join(' | ').slice(0, 300));
  await b.close(); srv.close();
  console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
})();
