const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(800);
  for (const t of await p.evaluate(() => EL.templateList)) {
    await p.evaluate((t) => { EL.bench.loadTemplate(t); EL.bench.setMode('test'); }, t);
    await p.waitForTimeout(1200);
    for (const inst of ['dmm', 'clamp', 'meg', 'cal', 'tester', 'ncv']) { await p.evaluate((i) => EL.ui.inst.choose(i), inst); await p.waitForTimeout(150); }
    console.log(t, 'ok parts', await p.evaluate(() => EL.bench.ed.c.parts.length));
  }
  for (const id of ['crack', 'burnt', 'fuse', 'reg', 'free']) { await p.click('#tabs .tab[data-v=pcb]'); await p.evaluate((id) => EL.pcb.load(id), id); await p.waitForTimeout(500); await p.evaluate(() => EL.pcb.setMode('test')); await p.waitForTimeout(600); await p.click('#tabs .tab[data-v=bench]'); }
  for (const v of ['loto', 'guide']) { await p.click('#tabs .tab[data-v=' + v + ']'); await p.waitForTimeout(300); }
  console.log(errs.length ? errs.join('\n') : 'SMOKE: no errors');
  await b.close();
})();
