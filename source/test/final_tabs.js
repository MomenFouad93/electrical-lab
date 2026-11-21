const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const out = [];
  for (const [name, opts] of [['d', { viewport: { width: 1360, height: 860 } }], ['m', { viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
    const ctx = await b.newContext(opts); const p = await ctx.newPage();
    p.on('console', (m) => { if (m.type() === 'error') errs.push(name + ' ' + m.text()); });
    p.on('pageerror', (e) => errs.push(name + ' PAGEERR ' + e.message));
    await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(600);
    for (const v of ['bench', 'loto', 'pcb', 'inspect', 'guide']) {
      await p.click('#tabs .tab[data-v=' + v + ']'); await p.waitForTimeout(350);
      const ok = await p.evaluate((v) => { const el = document.querySelector('#view_' + v) || document.querySelector('[data-view=' + v + ']') || document.querySelector('#' + v + 'Root'); return !!el && el.offsetParent !== null; }, v);
      out.push(name + ' ' + v + ' visible=' + ok);
      await p.screenshot({ path: '/tmp/claude-0/shots/final_' + name + '_' + v + '.png' });
    }
    await ctx.close();
  }
  console.log(out.join('\n')); console.log(errs.length ? errs.join('\n') : 'FINAL TABS: no errors');
  await b.close();
})();
