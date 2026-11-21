/* Build a tank project from scratch through the UI: plant units, pipes, create-and-link, PLC kit, ladder, run. */
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const mode = process.argv[2] || 'd';
  const b = await chromium.launch(); const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const errs = []; let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
  p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(700);
  await p.click('#tabs .tab[data-v=projects]'); await p.waitForTimeout(300);
  await p.click('text=Start an empty project'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => EL.bench.view === 'plant' && EL.bench.ed.c.parts.length === 0), 'empty project in Plant view');
  for (const t of ['SUPPLY', 'PUMP', 'TANK', 'VALVE', 'DRAIN']) await p.evaluate((x) => EL.ui.plant.add(x), t);
  const pl = await p.evaluate(() => EL.bench.ed.c.plant.units.map((u) => [u.tag, u.x, u.y]));
  console.log(JSON.stringify(pl));
  ok(new Set(pl.map((u) => u[1])).size === 5, 'units placed side by side, not on top of each other');
  // pipes by tapping ports
  const tap = async (ref) => { await p.evaluate((r) => { const c = EL.bench.ed.c; EL.ui.plant.focus(c.plant.units.find((u) => u.id === r.split('.')[0]), true); }, ref); await p.waitForTimeout(100); const box = await p.evaluate((r) => { const g = document.querySelector('[data-port="' + r + '"] circle'); const b = g.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, ref); if (mode === 'm') await p.touchscreen.tap(box[0], box[1]); else await p.mouse.click(box[0], box[1]); await p.waitForTimeout(150); };
  await p.evaluate(() => EL.ui.plant.fit()); await p.waitForTimeout(200);
  const id = await p.evaluate(() => Object.fromEntries(EL.bench.ed.c.plant.units.map((u) => [u.tag, u.id])));
  for (const [a, c] of [[id.S1 + '.out', id.P1 + '.in'], [id.P1 + '.out', id.T1 + '.inA'], [id.T1 + '.out1', id.V1 + '.a'], [id.V1 + '.b', id.D1 + '.in']]) { await tap(a); await tap(c); }
  console.log('pipes', await p.evaluate(() => EL.bench.ed.c.plant.pipes.map((x) => EL.plant.refLabel(EL.bench.ed.c.plant, x.a) + '>' + EL.plant.refLabel(EL.bench.ed.c.plant, x.b)).join(' ')));
  ok(await p.evaluate(() => EL.bench.ed.c.plant.pipes.length) === 4, 'four pipes laid by tapping ports');
  // PLC kit from the ladder view
  await p.evaluate(() => EL.bench.setView('ladder')); await p.waitForTimeout(300);
  await p.click('text=Add a PLC with its 24 V supply'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => EL.ui.view() === 'prog' && EL.bench.ed.c.parts.some((x) => x.type === 'PLC24R')), 'PLC kit added, still in the Programming tab');
  // link pump motor + tank float + LT via "create on the panel"
  await p.evaluate(() => { EL.ui.show('bench'); EL.bench.setView('plant'); }); await p.waitForTimeout(300);
  await p.evaluate((u) => EL.ui.plant.select(u, null), id.P1); await p.waitForTimeout(200);
  await p.selectOption('#pane-part select:not(.pl-preset) >> nth=0', '__new'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => { const u = EL.plant.byTag(EL.bench.ed.c.plant, 'P1'); return !!EL.bench.ed.c.parts.find((x) => x.tag === u.props.motor && x.type === 'MOT3'); }), 'pump linked to a new motor with its starter');
  await p.evaluate((u) => EL.ui.plant.select(u, null), id.T1); await p.waitForTimeout(200);
  await p.selectOption('#pane-part select:not(.pl-preset) >> nth=0', '__new'); await p.waitForTimeout(300);
  await p.evaluate((u) => EL.ui.plant.select(u, null), id.T1); await p.waitForTimeout(200);
  await p.selectOption('#pane-part .pl-swrow select >> nth=0', '__new'); await p.waitForTimeout(300);
  const st = await p.evaluate(() => { const c = EL.bench.ed.c, t = EL.plant.byTag(c.plant, 'T1'), plc = c.parts.find((x) => x.type === 'PLC24R'); return { lt: t.props.lt, sw: t.props.sw[0].t, lad: JSON.parse(plc.props.lad).sym, wires: c.wires.length }; });
  console.log(JSON.stringify(st));
  ok(st.lt && st.sw && st.lad['IW64'] && st.lad['I0.0'], 'transmitter on AI0 and LSHH float on I0.0 with names in the symbol table');
  // ladder: one network NO I0.0 (LSHH OK) -> Q0.3 ; download ; run
  await p.evaluate(() => EL.bench.setView('ladder')); await p.waitForTimeout(300);
  await p.evaluate(() => EL.ui.ladder.addNet()); await p.waitForTimeout(300);
  await p.click('text=Download to PLC'); await p.waitForTimeout(800);
  const q = await p.evaluate(() => { const plc = EL.bench.ed.c.parts.find((x) => x.type === 'PLC24R'); return [plc.state.sup, plc.state.i.join(''), plc.state.q.join(''), plc.props.mode]; });
  console.log(JSON.stringify(q));
  ok(q[0] && q[3] === 'ladder', 'PLC powered and running the ladder');
  await p.screenshot({ path: `/tmp/claude-0/shots/scratch_${mode}_lad.png` });
  await p.evaluate(() => EL.bench.setView('plant')); await p.waitForTimeout(500);
  await p.screenshot({ path: `/tmp/claude-0/shots/scratch_${mode}_plant.png` });
  await p.evaluate(() => EL.bench.setView('panel')); await p.waitForTimeout(700);
  await p.screenshot({ path: `/tmp/claude-0/shots/scratch_${mode}_panel.png` });
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  await b.close(); console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
})();
