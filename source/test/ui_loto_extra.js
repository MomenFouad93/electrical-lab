const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const mode = process.argv[2] || 'd';
  const b = await chromium.launch(); const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1360, height: 900 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(500);
  await p.click('#tabs .tab[data-v=loto]'); await p.waitForTimeout(300);
  const S = '/tmp/claude-0/shots/lx_' + mode;
  // trainer: inside view button
  await p.evaluate(() => EL.loto.start('conv')); await p.waitForTimeout(300);
  const btn = await p.$('button:has-text("Look inside this device")'); console.log('inside btn', !!btn);
  await btn.scrollIntoViewIfNeeded(); await p.screenshot({ path: S + '_trainer.png' });
  await btn.click(); await p.waitForTimeout(300); await p.screenshot({ path: S + '_trainer_detail.png' });
  // spot link: open panel detail, tap spot with link, then button
  await p.evaluate(() => { document.querySelectorAll('.modal').forEach((m) => m.remove()); window._m = EL.lotoBoard.openDetail('panel'); window._m._st.inside = true; window._m._redraw(); }); await p.waitForTimeout(200);
  await p.evaluate(() => { const g = document.querySelector('.spot[data-i="0"]'); const r = g.getBoundingClientRect(); window._xy = [r.x + r.width / 2, r.y + r.height / 2]; });
  const xy = await p.evaluate(() => window._xy); await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(200);
  const link = await p.$('.ld-note button:has-text("Open this part")'); console.log('link btn', !!link);
  if (link) { await link.click(); await p.waitForTimeout(300); console.log('modals', await p.evaluate(() => document.querySelectorAll('.modal').length)); await p.screenshot({ path: S + '_link.png' }); }
  await p.evaluate(() => document.querySelectorAll('.modal').forEach((m) => m.remove()));
  // tester steps
  await p.evaluate(() => { window._m = EL.lotoBoard.openDetail('tester'); }); await p.waitForTimeout(200);
  for (const k of [1, 2]) { await p.evaluate((k) => { const st = window._m._st; st.k = k; st.on = k === 0; window._m._redraw(); }, k); await p.waitForTimeout(80); const el = await p.$('.ld-stage'); await el.screenshot({ path: S + '_tester' + k + '.png' }); }
  await p.evaluate(() => document.querySelectorAll('.modal').forEach((m) => m.remove()));
  // catalog tile
  await p.evaluate(() => { EL.loto.tab = 'catalog'; EL.loto.render(); }); await p.waitForTimeout(200);
  const n = await p.evaluate(() => { const c = [...document.querySelectorAll('.catgrid .dev')].filter((e) => e.style.cursor === 'pointer'); c[0].click(); return c.length; }); await p.waitForTimeout(250);
  console.log('catalog clickable', n, 'modal', await p.evaluate(() => !!document.querySelector('.modal .ld-svg'))); await p.screenshot({ path: S + '_cat_detail.png' });
  await p.evaluate(() => document.querySelectorAll('.modal').forEach((m) => m.remove()));
  // photo slot
  await p.evaluate(() => { window._m = EL.lotoBoard.openDetail('rotary'); }); await p.waitForTimeout(250);
  const fi = await p.$('.ld input[type=file]'); await fi.setInputFiles('/tmp/claude-0/shots/testphoto.png'); await p.waitForTimeout(700);
  const th = await p.$$('.phth'); console.log('photo thumbs', th.length);
  if (th.length) { await th[0].click(); await p.waitForTimeout(300); await p.screenshot({ path: S + '_photo.png' });
    const svg = await p.$('.modal:last-of-type .ld-svg'); if (svg) { const bb = await svg.boundingBox(); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(250); await p.screenshot({ path: S + '_photo_pin.png' }); } }
  console.log(errs.length ? errs.join('\n') : 'LOTO EXTRA: no errors');
  await b.close();
})();
