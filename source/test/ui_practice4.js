const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(700);
  await p.click('#tabs .tab[data-v=loto]'); await p.waitForTimeout(500);
  const tap = async (sel) => { const bx = await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel); await p.touchscreen.tap(bx.x, bx.y); await p.waitForTimeout(200); };
  await tap('.prsvg [data-pt="plugR"]'); await tap('.prsvg [data-pt="plugB"]');
  await p.waitForTimeout(4000);
  await tap('.prsvg [data-pt="pb1"]');
  console.log(await p.evaluate(() => document.querySelector('.pr-stat').innerText.replace(/\n/g, ' | ')));
  // phone: board fills the width, tool from the dock
  console.log('board width', await p.evaluate(() => Math.round(document.querySelector('.prsvg').getBoundingClientRect().width)));
  await tap('.pr-dock .pr-k:nth-child(1)'); await p.waitForTimeout(100);
  console.log('tool in hand', await p.evaluate(() => EL.lotoPractice.tool));
  await p.screenshot({ path: '/tmp/claude-0/shots/pr_m_zoom.png' });
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
