const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const mode = process.argv[2] || 'd';
  const b = await chromium.launch(); const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  p.on('dialog', (d) => d.accept());
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(800);
  await p.click('#tabs .tab[data-v=projects]'); await p.waitForTimeout(500);
  await p.screenshot({ path: `/tmp/claude-0/shots/pj_${mode}_0.png`, fullPage: false });
  await p.evaluate(() => [...document.querySelectorAll('.pj-card .btn.pri')][0].click());
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `/tmp/claude-0/shots/pj_${mode}_1.png` });
  // press start S1 through the model
  await p.evaluate(() => { const c = EL.bench.ed.c; const s1 = c.parts.find((x) => x.tag === 'S1'); s1.state.act = true; setTimeout(() => { s1.state.act = false; }, 500); });
  await p.waitForTimeout(3500);
  await p.screenshot({ path: `/tmp/claude-0/shots/pj_${mode}_2.png` });
  await p.evaluate(() => EL.bench.setView('ladder')); await p.waitForTimeout(1200);
  await p.screenshot({ path: `/tmp/claude-0/shots/pj_${mode}_3.png` });
  await p.evaluate(() => EL.bench.setView('panel')); await p.waitForTimeout(800);
  await p.screenshot({ path: `/tmp/claude-0/shots/pj_${mode}_4.png` });
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
