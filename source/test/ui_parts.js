const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(800);
  const cats = await p.evaluate(() => [...document.querySelectorAll('#pane-parts .pgh span:first-child, .pgh span:first-child')].map((e) => e.textContent));
  console.log('palette groups:', cats.join(' | '));
  // lay out all new bench parts
  const types = await p.evaluate(() => Object.keys(EL.defs).filter((k) => ['wiring', 'auto', 'elec', 'draw'].includes(EL.defs[k].cat)));
  console.log('new types', types.length);
  await p.evaluate((types) => {
    EL.bench.loadTemplate && 0;
    const ed = EL.bench.ed; ed.c.parts.length = 0; ed.c.wires.length = 0;
    let x = 20, y = 20, rowH = 0;
    for (const t of types) { const d = EL.defs[t]; if (d.back) continue; if (x + d.w > 1500) { x = 20; y += rowH + 60; rowH = 0; } ed.addPart(t, x, y); x += d.w + 50; rowH = Math.max(rowH, d.h); }
    ed.render(); ed.fit && ed.fit();
  }, types);
  await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/claude-0/ui_parts_bench.png' });
  // PCB tab
  await p.click('#tabs .tab[data-v=pcb]'); await p.waitForTimeout(500);
  const ptypes = await p.evaluate(() => Object.keys(EL.defs).filter((k) => EL.defs[k].pcb && !EL.defs[k].board));
  await p.evaluate((types) => { EL.pcb.load('free'); const ed = EL.pcb.ed; ed.c.parts.length = 0; ed.c.wires.length = 0; let x = 20, y = 20, rowH = 0; for (const t of types) { const d = EL.defs[t]; if (d.back) continue; if (x + d.w > 1200) { x = 20; y += rowH + 50; rowH = 0; } ed.addPart(t, x, y); x += d.w + 40; rowH = Math.max(rowH, d.h); } ed.render(); ed.fit && ed.fit(); }, ptypes);
  await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/claude-0/ui_parts_pcb.png' });
  console.log(errs.length ? errs.join('\n') : 'UI PARTS: no errors');
  await b.close();
})();
