// Cycles panel on the Stilmas project: list, details, start at 300x, live timer, report (desktop d / phone m)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const mode = process.argv[2] || 'd';
  const b = await chromium.launch(); const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = []; let fail = 0;
  const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  p.on('dialog', (d) => d.accept());
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(800);
  await p.click('#tabs .tab[data-v=projects]'); await p.waitForTimeout(500);
  await p.evaluate(() => { const card = [...document.querySelectorAll('.pj-card')].find((c) => /Stilmas/.test(c.textContent)); card.querySelector('.btn.pri').click(); });
  await p.waitForTimeout(1500);
  const S = (n) => p.screenshot({ path: `/tmp/claude-0/shots/cy_${mode}_${n}.png` });
  ok(await p.isVisible('#plCyc'), 'cycles panel visible on the Stilmas plant');
  if (mode === 'm') { ok(!(await p.isVisible('.pl-cyc-item')), 'phone: panel starts as a slim bar'); await p.click('.pl-cyc-hd'); await p.waitForTimeout(300); }
  const items = await p.$$eval('.pl-cyc-item', (a) => a.map((x) => x.textContent));
  ok(items.length === 9, '9 cycles listed: ' + items.length);
  await S(1);
  // collapse and expand
  await p.click('.pl-cyc-hd'); await p.waitForTimeout(200); ok(!(await p.isVisible('.pl-cyc-item')), 'header collapses the panel');
  await p.click('.pl-cyc-hd'); await p.waitForTimeout(200); ok(await p.isVisible('.pl-cyc-item'), 'header expands it again');
  // drain details
  await p.click('.pl-cyc-item >> nth=1'); await p.waitForTimeout(300);
  const st = await p.$$eval('.pl-cyc-steps li', (a) => a.length); ok(st === 5, 'drain shows 5 steps: ' + st);
  await S(2);
  await p.click('.pl-cyc-bd .btn.pri'); await p.waitForTimeout(300);
  await p.click('.pl-cyc-spd .btn >> text=300x'); await p.waitForTimeout(1200);
  const run = await p.evaluate(() => { const u = EL.water.ctrl(EL.bench.ed.c.plant); return { n: u.state.cyN, i: u.state.cyI, t: u.state.cyT, clock: document.querySelector('.pl-cyc-clock') && document.querySelector('.pl-cyc-clock').textContent }; });
  ok(run.n === 2 && run.t > 60, 'drain running at 300x: ' + JSON.stringify(run));
  await S(3);
  await p.waitForFunction(() => { const u = EL.water.ctrl(EL.bench.ed.c.plant); return !u.state.cyN && u.state.cyDone; }, null, { timeout: 60000 });
  await p.waitForTimeout(500);
  ok(/Complete|خلصت/.test(await p.textContent('.pl-cyc-bd')), 'drain report shown');
  const lv = await p.evaluate(() => ['TK-Z1', 'TK50A', 'TK-PW'].map((t) => EL.plant.byTag(EL.bench.ed.c.plant, t).state.lvl));
  ok(lv.every((x) => x < 2), 'all tanks drained: ' + lv.map((x) => x.toFixed(1)));
  await S(4);
  await p.click('.pl-cyc-bd .btn.pri'); await p.waitForTimeout(300); // close report
  // fill from empty, then stop it half way
  await p.click('.pl-cyc-item >> nth=0'); await p.waitForTimeout(200); await p.click('.pl-cyc-bd .btn.pri'); await p.waitForTimeout(6000);
  const f = await p.evaluate(() => { const u = EL.water.ctrl(EL.bench.ed.c.plant); return { n: u.state.cyN, i: u.state.cyI }; });
  ok(f.n === 1 && f.i >= 1, 'fill from empty running: ' + JSON.stringify(f));
  await S(5);
  await p.click('.pl-cyc-bd .btn.bad'); await p.waitForTimeout(400);
  ok(/Stopped|اتوقفت/.test(await p.textContent('.pl-cyc-bd')), 'stopping shows the report');
  // Arabic
  await p.evaluate(() => { const c = document.querySelector('.pl-cyc-bd .btn.pri'); if (c) c.click(); EL.ui.setLang ? EL.ui.setLang('ar') : null; });
  await p.waitForTimeout(500);
  await S(6);
  // the HMI drawing still works
  ok(await p.evaluate(() => !!document.querySelector('[data-act=prod]')), 'HMI buttons drawn');
  // overlap check on phones: panel stays inside the viewport
  const bb = await p.evaluate(() => { const r = document.querySelector('#plCyc').getBoundingClientRect(); return [r.left, r.right, r.top, r.bottom, innerWidth, innerHeight]; });
  ok(bb[0] >= 0 && bb[1] <= bb[4] + 1 && bb[3] <= bb[5] + 1, 'panel inside the viewport ' + bb.map(Math.round));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  console.log(fail ? fail + ' FAILED' : 'ALL OK');
  await b.close();
})();
