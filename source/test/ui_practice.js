const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const mode = process.argv[2] || 'd';
  const b = await chromium.launch(); const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(800);
  await p.click('#tabs .tab[data-v=loto]'); await p.waitForTimeout(600);
  await p.screenshot({ path: `/tmp/claude-0/shots/pr_${mode}_0.png` });
  await p.evaluate(() => { document.querySelectorAll('.pr-task .btn')[0].click(); });
  await p.waitForTimeout(6500);
  await p.screenshot({ path: `/tmp/claude-0/shots/pr_${mode}_1.png` });
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
