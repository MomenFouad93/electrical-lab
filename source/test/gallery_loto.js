const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(600);
  await p.evaluate(() => {
    const keys = Object.keys(EL.lotoData.ICON);
    const d = document.createElement('div'); d.id = 'gal'; d.style.cssText = 'position:fixed;inset:0;z-index:999;background:#0f1626;overflow:auto;padding:10px;display:flex;flex-wrap:wrap;gap:8px';
    for (const k of keys) { const c = document.createElement('div'); c.style.cssText = 'width:150px;text-align:center;font:10px sans-serif;color:#9fb;background:#1a2438;border-radius:8px;padding:4px'; c.innerHTML = EL.lotoData.icon(k, 120) + '<div>' + k + '</div>'; d.appendChild(c); }
    document.body.appendChild(d);
  });
  await p.screenshot({ path: '/tmp/claude-0/shots/gal_loto.png' });
  console.log(errs.length ? errs.join('\n') : 'gallery ok');
  await b.close();
})();
