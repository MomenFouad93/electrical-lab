const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const mode = process.argv[2] || 'd';
  const b = await chromium.launch(); const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1360, height: 900 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(500);
  await p.click('#tabs .tab[data-v=loto]'); await p.waitForTimeout(300);
  const ids = await p.evaluate(() => EL.lotoData.scenarios.map((s) => s.id));
  const res = [];
  for (const id of ids) {
    const r = await p.evaluate((id) => {
      EL.loto.start(id); const R = EL.loto.run; const out = {};
      out.fresh = EL.loto.review(R).items.length + ':' + EL.loto.review(R).state;
      // do everything right (state only)
      R.f.notified = R.f.reviewed = R.f.stopped = R.f.tried = true;
      for (const p of R.sc.points) if (p.needed) { const s = R.pt[p.id]; s.on = false; s.locks = R.sc.crew.map((_, i) => ({ owner: i, lock: 'pl_red' })); s.tag = 1; }
      for (const e of R.sc.energies) { R.en[e.id].rel = true; R.en[e.id].gauge = true; R.ts[e.id] = { before: true, after: true, tested: ['L1-L2', 'L2-L3', 'L1-L3', 'L1-PE', 'L2-PE', 'L3-PE', 'L-N', 'N-PE', '+24V to 0V', '+24V to PE'] }; }
      R.f.block = true; R.f.wait = 5;
      const done = EL.loto.review(R);
      out.done = done.state + ' bad=' + done.items.filter((x) => x.kind === 'bad').length + ' warn=' + done.items.filter((x) => x.kind === 'warn').length;
      out.nobilingual = done.items.concat(EL.loto.review(EL.loto.run).items).filter((x) => !x.text[0] || !x.text[1] || /undefined/.test(x.text.join())).length;
      return out;
    }, id);
    res.push(id + ' ' + JSON.stringify(r));
  }
  console.log(res.join('\n'));
  // screenshots of the card
  await p.evaluate(() => { EL.loto.start('pump'); EL.loto.run.rev = { shown: true }; EL.loto.render(); }); await p.waitForTimeout(300);
  const card = await p.$('.lr-sum'); if (card) { await card.scrollIntoViewIfNeeded(); }
  await p.screenshot({ path: `/tmp/claude-0/shots/lr_${mode}.png` });
  console.log(errs.length ? errs.join('\n') : 'REVIEW UI: no errors');
  await b.close();
})();
