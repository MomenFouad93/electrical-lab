const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const mobile = process.argv[2] === 'm';
  const ctx = await b.newContext({ viewport: mobile ? { width: 390, height: 800 } : { width: 1360, height: 860 }, hasTouch: mobile });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(900);
  const tag = mobile ? 'm' : 'd';
  // 1. break the DOL (remove wire to coil) then diagnose
  await p.evaluate(() => {
    const ed = EL.bench.ed; const k = ed.c.parts.find((x) => x.tag === 'KM1');
    const w = ed.c.wires.find((x) => x.a === k.id + '.A2' || x.b === k.id + '.A2'); ed.c.wires = ed.c.wires.filter((x) => x !== w); ed.render(); ed.changed();
  });
  if (mobile) { await p.click('#dock button[data-p=diag]'); await p.waitForTimeout(300); await p.click('.dg-run'); }
  else await p.click('#btnDiag');
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `/tmp/claude-0/shots/diag_${tag}1.png` });
  console.log('marks', await p.evaluate(() => document.querySelectorAll('.mk').length));
  // 2. troubleshooting setup
  await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-diag .btn')].find((x) => /^(Start|ابدأ)$/.test(x.textContent)); b && b.click(); });
  await p.waitForTimeout(500);
  await p.screenshot({ path: `/tmp/claude-0/shots/diag_${tag}2.png` });
  console.log(errs.length ? errs.join('\n') : 'UI DIAG: no errors');
  await b.close();
})();
