// The bench opens on the own electrical work; ready projects are visits (Continue / My bench)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const mode = process.argv[2] || 'd';
  const b = await chromium.launch(); let fail = 0; const ok = (c, m) => { if (!c) fail++; console.log(c ? 'ok  ' : 'FAIL', m); };
  const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1288, height: 760 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); let dialogs = 0; p.on('dialog', (d) => { dialogs++; d.accept(); });
  const url = 'file:///home/claude/lab/dist/electrical-lab.html';
  await p.goto(url); await p.waitForTimeout(800);
  // old state: the last project left on the bench (as after yesterday's update)
  await p.evaluate(() => { const c = EL.projects.load('stilmas'); localStorage.setItem('ellab.bench', EL.serialize(c)); localStorage.setItem('ellab.bview', 'plant'); localStorage.removeItem('ellab.benchHome'); });
  await p.reload(); await p.waitForTimeout(1000);
  const s1 = await p.evaluate(() => ({ view: EL.bench.view, parts: EL.bench.ed.c.parts.length, proj: EL.bench.ed.c.proj && EL.bench.ed.c.proj.id, last: !!localStorage.getItem('ellab.projLast'), tab: document.querySelector('#tabs .tab.on').dataset.v }));
  ok(s1.tab === 'bench' && s1.view === 'panel' && s1.parts > 0 && !s1.proj, 'app opens on the electrical bench (Panel, ' + s1.parts + ' parts)');
  ok(s1.last, 'the water project is kept for Continue');
  if (mode === 'd') ok(await p.isVisible('#palette'), 'parts list visible');
  ok(!(await p.isVisible('#btnHome')), 'no "My bench" button on the own bench');
  // own work: add a part so we can check it survives a project visit
  const n0 = await p.evaluate(() => { const c = EL.bench.ed.c; c.parts[0].tag = 'MYWORK'; EL.bench.save(); return c.parts.length; });
  await p.click('#tabs .tab[data-v=projects]'); await p.waitForTimeout(400);
  ok(await p.isVisible('.pj-cont'), 'Projects shows "Continue where you stopped"');
  const d0 = dialogs;
  await p.evaluate(() => { const card = [...document.querySelectorAll('.pj-card')].find((c) => /Stilmas/.test(c.textContent)); card.querySelector('.btn.pri').click(); }); await p.waitForTimeout(1200);
  ok(dialogs === d0, 'opening a ready project asks nothing (own work kept aside)');
  ok(await p.evaluate(() => EL.bench.view === 'plant' && EL.bench.ed.c.proj.id === 'stilmas'), 'Stilmas opens in the Plant view');
  ok(await p.isVisible('#btnHome'), '"My bench" button shown on a project');
  await p.click('#btnHome'); await p.waitForTimeout(600);
  const s2 = await p.evaluate(() => ({ view: EL.bench.view, n: EL.bench.ed.c.parts.length, tag: EL.bench.ed.c.parts[0].tag }));
  ok(s2.view === 'panel' && s2.n === n0 && s2.tag === 'MYWORK', '"My bench" brings back my own work: ' + JSON.stringify(s2));
  await p.click('#tabs .tab[data-v=projects]'); await p.waitForTimeout(300);
  await p.click('.pj-cont .btn.pri'); await p.waitForTimeout(1000);
  ok(await p.evaluate(() => EL.bench.ed.c.proj && EL.bench.ed.c.proj.id === 'stilmas' && EL.bench.view === 'plant'), 'Continue reopens the project where it was');
  await p.reload(); await p.waitForTimeout(1000);
  ok(await p.evaluate(() => EL.bench.view === 'panel' && !EL.bench.ed.c.proj && EL.bench.ed.c.parts[0].tag === 'MYWORK'), 'reload starts on my own bench again');
  await p.evaluate(() => EL.ui.setLang('ar')); await p.waitForTimeout(300);
  await p.click('#tabs .tab[data-v=projects]'); await p.waitForTimeout(300);
  ok(/كمّل/.test(await p.textContent('.pj-cont')), 'Continue card in Arabic');
  console.log(errs.length ? errs : 'no errors'); console.log(fail ? fail + ' FAILED' : 'ALL OK'); await b.close();
})();
