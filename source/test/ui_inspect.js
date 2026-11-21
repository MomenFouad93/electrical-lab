const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const mode = process.argv[2] || 'd';
  const ctx = await b.newContext({ viewport: mode === 'm' ? { width: 390, height: 820 } : { width: 1360, height: 900 }, hasTouch: mode === 'm', acceptDownloads: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(800);
  if (mode === 'ar') await p.click('#btnLang');
  await p.click('#tabs .tab[data-v=inspect]'); await p.waitForTimeout(400);
  const S = (n) => p.screenshot({ path: `/tmp/claude-0/shots/ins_${mode}_${n}.png` });
  await S('1grid');
  console.log('type cards:', await p.$$eval('.tcard', (a) => a.length));
  await p.click('.tcard:nth-child(1)'); await p.waitForTimeout(300);
  await S('2motor');
  // synthetic photo: green board with dark burn patch and brown patch and pale crust
  await p.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 900; c.height = 600; const x = c.getContext('2d');
    x.fillStyle = '#7a8aa0'; x.fillRect(0, 0, 900, 600);
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${150 + (i * 7) % 60},${150 + (i * 5) % 50},${160 + (i * 3) % 40},.5)`; x.fillRect((i * 83) % 900, (i * 47) % 600, 90, 70); }
    const g = x.createRadialGradient(300, 280, 5, 300, 280, 90); g.addColorStop(0, '#050403'); g.addColorStop(1, 'rgba(30,20,10,0)'); x.fillStyle = g; x.beginPath(); x.arc(300, 280, 90, 0, 7); x.fill();
    x.fillStyle = '#8a5a1c'; x.fillRect(560, 120, 110, 80);
    x.fillStyle = '#cfe8dc'; x.fillRect(650, 420, 120, 70);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png')); const f = new File([blob], 'test.png', { type: 'image/png' });
    EL.inspect._load(f);
  });
  await p.waitForTimeout(900);
  console.log('hints:', await p.evaluate(() => EL.inspect._state().hints.map((h) => h.k + ':' + Math.round(h.x) + ',' + Math.round(h.y)).join(' ')));
  await S('3photo');
  // zoom / pan via wheel
  const box = await p.$eval('.ins-photo', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await p.mouse.move(box.x + box.w / 2, box.y + box.h / 2); await p.mouse.wheel(0, -300); await p.waitForTimeout(200);
  console.log('zoom k:', await p.evaluate(() => EL.inspect._state().view.k.toFixed(2)));
  // Mark tool
  await p.click('.ins-tools .btn:nth-child(1)'); await p.mouse.click(box.x + 150, box.y + 150); await p.waitForTimeout(300);
  console.log('pins:', await p.evaluate(() => EL.inspect._state().pins.length));
  await p.keyboard.type('Burnt end winding'); await p.waitForTimeout(100);
  // select hint adoption: tap on a hint (screen coords)
  const hp = await p.evaluate(() => { const s = EL.inspect._state(); const hh = s.hints[0]; if (!hh) return null; const r = document.querySelector('.ins-svg').getBoundingClientRect(); return { x: r.x + hh.x * s.view.k + s.view.x, y: r.y + hh.y * s.view.k + s.view.y }; });
  if (hp) { await p.mouse.click(hp.x, hp.y); await p.waitForTimeout(300); console.log('pins after hint tap:', await p.evaluate(() => EL.inspect._state().pins.length)); }
  const clickTxt = async (sel, re, nth) => { const ok = await p.evaluate(({ sel, re, nth }) => { const r = new RegExp(re); const bs = [...document.querySelectorAll(sel)].filter((x) => r.test(x.textContent.trim())); const b = bs[nth || 0]; if (b) { b.click(); return true; } return false; }, { sel, re, nth }); if (!ok) console.log('NOT FOUND', re); await p.waitForTimeout(250); };
  await clickTxt('.ichip', 'hums|بيهم');
  // finding: One phase group burnt -> Yes
  await p.evaluate(() => { const rows = [...document.querySelectorAll('.frow')]; const r = rows.find((x) => /One phase group burnt|مجموعة فاز واحدة/.test(x.textContent)); r.querySelectorAll('button')[1].click(); });
  await p.waitForTimeout(300);
  const rank = await p.$$eval('.dg-sus', (a) => a.map((x) => x.textContent.trim()));
  console.log('rank:', rank.slice(0, 3).join(' | '));
  await S('4rank');
  const nextT = await p.$eval('.ins-work .card:nth-of-type(n) .dg-nt', (e) => e.textContent).catch(() => 'none');
  console.log('next:', nextT);
  // answer the supply voltage check
  await p.evaluate(() => { const s = EL.inspect._state(); EL.kb.answer(s.S, 'volt', 'missing'); }); await p.evaluate(() => EL.inspect.onShow()); await p.waitForTimeout(300);
  console.log('concl:', await p.$eval('.dg-concl .dg-nt', (e) => e.textContent).catch(() => 'none'));
  await p.evaluate(() => document.querySelector('.dg-concl') && document.querySelector('.dg-concl').scrollIntoView());
  await S('5concl');
  // save case
  await clickTxt('.btn', '^(Save case|احفظ الحالة)$');
  console.log('cases:', await p.evaluate(() => EL.kb.cases.length));
  // report download
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 4000 }).catch(() => null), clickTxt('.btn', 'Download report|نزّل التقرير')]);
  if (dl) { const path = '/tmp/claude-0/shots/ins_report.html'; await dl.saveAs(path); console.log('report saved', require('fs').statSync(path).size); } else console.log('NO DOWNLOAD');
  // gallery
  await clickTxt('.ins-head .btn', '^(Gallery|المعرض)$'); await S('6gallery');
  await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelector('.modal') && document.querySelector('.modal').remove());
  await clickTxt('.fthumb', '.*'); await S('7ill');
  console.log(errs.length ? errs.join('\n') : 'INSPECT UI: no errors');
  await b.close();
})();
