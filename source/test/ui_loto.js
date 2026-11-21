const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const mode = process.argv[2] || 'd';
  const b = await chromium.launch(); const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1360, height: 860 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(800);
  if (mode === 'ar') await p.evaluate(() => EL.ui.setLang && EL.ui.setLang('ar'));
  await p.click('#tabs .tab[data-v=loto]'); await p.waitForTimeout(500);
  await p.screenshot({ path: `/tmp/claude-0/shots/loto_${mode}_pick.png` });
  await p.evaluate(() => EL.loto.start('pump')); await p.waitForTimeout(300);
  await p.screenshot({ path: `/tmp/claude-0/shots/loto_${mode}_run.png` });
  await p.evaluate(() => { EL.loto.tab = 'catalog'; EL.loto.render(); }); await p.waitForTimeout(300);
  await p.screenshot({ path: `/tmp/claude-0/shots/loto_${mode}_cat.png` });
  console.log(errs.length ? errs.join('\n') : 'LOTO UI: no errors');
  await b.close();
})();
