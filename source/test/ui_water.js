const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const mode = process.argv[2] || 'd';
  const b = await chromium.launch(); const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const errs = []; let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
  p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(700);
  await p.click('#tabs .tab[data-v=projects]'); await p.waitForTimeout(300);
  const card = p.locator('.pj-card', { hasText: 'Pharma water' });
  ok(await card.count() === 1, 'water project card');
  ok(!(await card.locator('text=Open the panel').count()), 'no "Open the panel" button on a plant-only project');
  await card.locator('button', { hasText: /^Open$/ }).click(); await p.waitForTimeout(900);
  ok(await p.evaluate(() => EL.bench.view === 'plant' && EL.bench.ed.c.plant.units.length > 30), 'opens the plant view with the water plant');
  await p.evaluate(() => { EL.bench.speed = 20; }); await p.waitForTimeout(8000);
  ok(await p.evaluate(() => EL.plant.byTag(EL.bench.ed.c.plant, 'EDI1').state.dc === true), 'EDI running in the browser');
  ok(await p.locator('#plantHost text', { hasText: /PASS PW/ }).count() >= 1, 'analysers show PASS');
  ok(await p.locator('#plantHost text', { hasText: /^DN40/ }).count() >= 5, 'pipe sizes and velocities shown');
  await p.screenshot({ path: `/tmp/claude-0/shots/water_${mode}.png` });
  // select a pipe and change its size
  const pid = await p.evaluate(() => { const pl = EL.bench.ed.c.plant; const pp = pl.pipes.find((x) => x.loop && x.dn === 40); EL.ui.plant.selPipe = pp.id; EL.ui.plant.sel = null; EL.ui.plant.inspector(); return pp.id; });
  if (mode === 'd') {
    await p.waitForTimeout(600);
    ok(await p.locator('#plPipeV .kv').count() === 4, 'pipe inspector: velocity, Re, Δp, L/D');
    await p.locator('#pane-part select').first().selectOption('65'); await p.waitForTimeout(300);
    ok(await p.evaluate((id) => EL.bench.ed.c.plant.pipes.find((x) => x.id === id).dn === 65, pid), 'pipe size changed to DN65');
    // tank size preset
    await p.evaluate(() => { const t = EL.plant.byTag(EL.bench.ed.c.plant, 'T2'); EL.ui.plant.sel = t.id; EL.ui.plant.selPipe = null; EL.ui.plant.inspector(); });
    await p.locator('#pane-part select.pl-preset').selectOption('600'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => EL.plant.byTag(EL.bench.ed.c.plant, 'T2').props.vol === 600), 'tank size preset sets 600 L');
    await p.waitForTimeout(800);
    ok(await p.locator('#plLive .kv', { hasText: /in$|Reaches|Falls/ }).count() >= 1 || await p.locator('#plLive', { hasText: 'Conductivity' }).count() === 1, 'tank live values with quality');
    // pump preset
    await p.evaluate(() => { const t = EL.plant.byTag(EL.bench.ed.c.plant, 'P4'); EL.ui.plant.sel = t.id; EL.ui.plant.inspector(); });
    await p.locator('#pane-part select.pl-preset').selectOption('wfiloop'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => EL.plant.byTag(EL.bench.ed.c.plant, 'P4').props.qbep === 3), 'pump size preset');
  }
  // POU: tap in Test mode opens it
  await p.evaluate(() => { EL.bench.setMode('test'); const u = EL.plant.byTag(EL.bench.ed.c.plant, 'POU1'); EL.ui.plant.focus(u, true); });
  await p.waitForTimeout(400);
  const pou = await p.evaluate(() => { const u = EL.plant.byTag(EL.bench.ed.c.plant, 'POU1'); return u.id; });
  const bb = await p.evaluate((id) => { const r = document.querySelector('#plantHost [data-u="' + id + '"]').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, pou);
  await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height * 0.35); await p.waitForTimeout(600);
  ok(await p.evaluate(() => EL.plant.byTag(EL.bench.ed.c.plant, 'POU1').props.open === true), 'tap opens POU1 in Test mode');
  // guide
  await p.click('#plantHost >> text=Water guide'); await p.waitForTimeout(300);
  ok(await p.locator('.modal .ln-guidebox ol li').count() === 15, 'water guide: 15 steps');
  ok(await p.locator('.modal .ln-guidebox ul li').count() === 7, 'water guide: motors and electrics');
  await p.evaluate(() => document.querySelector('.modal').remove());
  // add each new unit from the menu
  await p.evaluate(() => EL.bench.setMode('build'));
  for (const t of ['SOFT', 'DOSE', 'EDI', 'UV', 'STILL', 'DIV', 'QA', 'POU']) await p.evaluate((t) => EL.ui.plant.add(t), t);
  await p.waitForTimeout(400);
  ok(await p.evaluate(() => ['SF', 'DP', 'EDI', 'UV', 'WS', 'XV', 'AIT', 'POU'].every((pre) => EL.bench.ed.c.plant.units.some((u) => u.tag.startsWith(pre)))), 'all new units can be added');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  await b.close(); console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
})();
