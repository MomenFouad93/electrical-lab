const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const mode = process.argv[2] || 'd';
  const b = await chromium.launch(); const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const errs = []; let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
  p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(700);
  await p.click('#tabs .tab[data-v=projects]'); await p.waitForTimeout(300);
  await p.click('text=Open the program'); await p.waitForTimeout(900);
  ok(await p.evaluate(() => EL.ui.view() === 'prog' && document.querySelectorAll('#ladHost .ld-net').length > 5), 'Programming tab shows the tank program');
  ok(await p.evaluate(() => !document.querySelector('#viewSeg [data-v=ladder]')), 'no Ladder button left on the bench');
  // press S1 from the watch table
  if (mode === 'm') { await p.click('.ld-mob >> text=Watch'); await p.waitForTimeout(300); }
  const btn = mode === 'm' ? '.modal [data-io]' : '#gpane [data-io]';
  ok(await p.locator(btn).count() >= 2, 'operate buttons next to wired inputs');
  const s1 = p.locator(btn).first(); const bb = await s1.boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(500); await p.mouse.up(); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => EL.bench.ed.c.parts.find((x) => x.tag === 'KF1').state.q[0] === 1), 'pressing S1 from the Programming tab starts the pump (Q0.0 = 1)');
  if (mode === 'm') { await p.evaluate(() => document.querySelector('.modal').remove()); await p.click('.ld-mob >> text=Instruction'); await p.waitForTimeout(300); ok(await p.locator('.modal .pit').count() === 18, 'instruction picker on phone'); await p.evaluate(() => document.querySelector('.modal').remove()); }
  else ok(await p.locator('#gplist .pit').count() === 18, 'instruction palette on the left');
  await p.screenshot({ path: `/tmp/claude-0/shots/prog_${mode}.png` });
  await p.click('text=Go to the panel'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => EL.ui.view() === 'bench' && EL.bench.view === 'panel'), 'Go to the panel works');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  await b.close(); console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
})();
