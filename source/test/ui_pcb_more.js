const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1360, height: 860 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(800);
  await p.click('#tabs .tab[data-v=pcb]'); await p.waitForTimeout(500);
  for (const id of ['npn', 'opto', 'relay', 'psu', 'usb', 'mov']) {
    await p.evaluate((id) => EL.pcb.load(id), id); await p.waitForTimeout(500);
    await p.evaluate(() => { EL.pcb.ed.fit(); EL.pcb.ed.showHidden = true; EL.pcb.ed.touch(); });
    await p.waitForTimeout(400);
    await p.screenshot({ path: `/tmp/claude-0/shots/pcbm_${id}.png` });
  }
  console.log(errs.length ? errs.join('\n') : 'PCB MORE: no errors');
  await b.close();
})();
