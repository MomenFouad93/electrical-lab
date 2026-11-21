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
  // hide a fault in the DOL: loose wire at SB1:2 (blind)
  await p.evaluate(() => {
    const ed = EL.bench.ed; const k = ed.c.parts.find((x) => x.tag === 'FU1');
    k.fault = 'blown'; k.hid = true; ed.render(); ed.changed();
  });
  if (mobile) { await p.click('#dock button[data-p=diag]'); await p.waitForTimeout(300); }
  else await p.click('#stabs .stab[data-p=diag]');
  const clickTxt = async (re) => { const ok = await p.evaluate((src) => { const r = new RegExp(src); const b = [...document.querySelectorAll('#pane-diag button')].find((x) => r.test(x.textContent.trim())); if (b) { b.click(); return true; } return false; }, re); if (!ok) console.log('NOT FOUND', re); await p.waitForTimeout(400); };
  const scrollTs = async () => p.evaluate(() => { const el = document.querySelector('#pane-diag .dg-ts'); if (el) el.scrollIntoView({ block: 'start' }); });
  await clickTxt('^Start$'); await scrollTs(); await p.waitForTimeout(300);
  await p.screenshot({ path: `/tmp/claude-0/shots/ts_${tag}1.png` });
  await clickTxt('^Find the fault$'); await p.waitForTimeout(2500); await scrollTs();
  await p.screenshot({ path: `/tmp/claude-0/shots/ts_${tag}2.png` });
  // measure for me until done
  for (let i = 0; i < 8; i++) {
    const has = await p.evaluate(() => !![...document.querySelectorAll('#pane-diag button')].find((x) => /^Measure it for me$/.test(x.textContent.trim())));
    if (!has) break; await clickTxt('^Measure it for me$');
  }
  await scrollTs(); await p.waitForTimeout(300);
  await p.screenshot({ path: `/tmp/claude-0/shots/ts_${tag}3.png` });
  console.log(errs.length ? errs.join('\n') : 'UI TS: no errors');
  await b.close();
})();
