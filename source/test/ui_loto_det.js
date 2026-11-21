// usage: node test/ui_loto_det.js <id,id,...|all> [d|m]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const ids = process.argv[2] || 'wallsw,plug'; const mode = process.argv[3] || 'd';
  const b = await chromium.launch(); const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1360, height: 900 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(600);
  await p.click('#tabs .tab[data-v=loto]'); await p.waitForTimeout(300);
  const list = ids === 'all' ? await p.evaluate(() => EL.lotoDet.list.map((d) => d.id)) : ids.split(',');
  for (const id of list) {
    await p.evaluate((id) => { document.querySelectorAll('.modal').forEach((m) => m.remove()); window._m = EL.lotoBoard.openDetail(id); }, id);
    await p.waitForTimeout(150);
    const variants = process.argv[4] === 'full' ? [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1]] : [[0, 0, 0], [1, 0, 0], [0, 1, 0]];
    let n = 0;
    for (const [inside, lock, on] of variants) {
      await p.evaluate(([i, l, o]) => { const st = window._m._st; st.inside = !!i; st.lock = !!l; st.on = !!o; if (l) st.on = false; st.sel = 0; window._m._redraw(); }, [inside, lock, on]);
      await p.waitForTimeout(80);
      const el = await p.$('.ld-stage'); await el.screenshot({ path: `/tmp/claude-0/shots/det_${id}_${n++}.png` });
    }
    await p.screenshot({ path: `/tmp/claude-0/shots/det_${id}_full.png` });
  }
  console.log(errs.length ? errs.join('\n') : 'DET UI: no errors');
  await b.close();
})();
