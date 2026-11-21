const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(700);
  await p.click('#tabs .tab[data-v=loto]'); await p.waitForTimeout(400);
  for (const job of ['motor', 'cyl', 'water', 'comp']) {
    await p.evaluate((j) => { const s = document.querySelector('.pr-sel'); s.value = j; s.dispatchEvent(new Event('change')); [...document.querySelectorAll('.pr-task .btn')].find((b) => /Show me/.test(b.textContent)).click(); }, job);
    await p.waitForTimeout(job === 'motor' ? 30000 : 34000);
    const r = await p.evaluate(() => (document.querySelector('.pr-res') || {}).innerText);
    console.log(job, '=>', (r || 'NO RESULT').replace(/\n/g, ' | ').slice(0, 330));
  }
  // negative: wrong isolation (control only) must fail
  await p.evaluate(() => { const s = document.querySelector('.pr-sel'); s.value = 'motor'; s.dispatchEvent(new Event('change')); [...document.querySelectorAll('.pr-task .btn')].find((b) => /Reset/.test(b.textContent)).click(); });
  const tap = async (pt) => { const box = await p.evaluate((id) => { const r = document.querySelector('.prsvg [data-pt="' + id + '"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, pt); await p.mouse.click(box.x, box.y); await p.waitForTimeout(120); };
  await tap('plugB'); await tap('plugR'); await tap('pb1'); await tap('pb5');
  await p.evaluate(() => [...document.querySelectorAll('.pr-task .btn')].find((b) => /Check/.test(b.textContent)).click());
  console.log('negative =>', await p.evaluate(() => document.querySelector('.pr-res').innerText.replace(/\n/g, ' | ').slice(0, 120)));
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
