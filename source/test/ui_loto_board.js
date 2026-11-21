// usage: node test/ui_loto_board.js [d|m] [ar]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const mode = process.argv[2] || 'd', ar = process.argv.includes('ar');
  const b = await chromium.launch(); const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1360, height: 900 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(500);
  if (ar) { await p.evaluate(() => { EL.lang = 'ar'; EL.ui.setLang && EL.ui.setLang('ar'); }); await p.waitForTimeout(300); }
  await p.click('#tabs .tab[data-v=loto]'); await p.waitForTimeout(400); await p.evaluate(() => { EL.loto.tab = 'board'; EL.loto.render(); }); await p.waitForTimeout(300);
  const S = '/tmp/claude-0/shots/mb_' + mode + (ar ? '_ar' : '');
  await p.screenshot({ path: S + '_before.png' });
  const full = async (name) => { const h = await p.evaluate(() => { const r = document.querySelector('#lotoRoot'); return r.parentElement.scrollHeight; }); await p.screenshot({ path: S + '_' + name + '.png', fullPage: false }); return h; };
  await p.evaluate(() => { document.querySelector('#lotoRoot').parentElement.scrollTop = 900; }); await p.waitForTimeout(150);
  await p.screenshot({ path: S + '_before2.png' });
  await p.evaluate(() => { EL.lotoMaster.mode = 'after'; EL.loto.render(); document.querySelector('#lotoRoot').parentElement.scrollTop = 0; }); await p.waitForTimeout(200);
  await p.screenshot({ path: S + '_after.png' });
  await p.evaluate(() => { document.querySelector('#lotoRoot').parentElement.scrollTop = 1100; }); await p.waitForTimeout(150);
  await p.screenshot({ path: S + '_after2.png' });
  // open a tile
  await p.evaluate(() => { document.querySelectorAll('.mb-tile')[3].click(); }); await p.waitForTimeout(300);
  await p.screenshot({ path: S + '_tile.png' });
  await p.evaluate(() => document.querySelectorAll('.modal').forEach((m) => m.remove()));
  await p.evaluate(() => { EL.lotoMaster.mode = 'audit'; EL.loto.render(); document.querySelector('#lotoRoot').parentElement.scrollTop = 0; }); await p.waitForTimeout(200);
  await p.screenshot({ path: S + '_audit.png' });
  await p.evaluate(() => { const a = EL.lotoMaster.audit; a.forEach(([id, , ok]) => { EL.lotoMaster.ans[id] = id === 'rotary' ? false : ok; }); EL.lotoMaster.checked = true; EL.loto.render(); document.querySelector('#lotoRoot').parentElement.scrollTop = 300; }); await p.waitForTimeout(200);
  await p.screenshot({ path: S + '_audit2.png' });
  console.log(errs.length ? errs.join('\n') : 'BOARD UI: no errors');
  await b.close();
})();
