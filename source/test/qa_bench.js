/* QA area 2 (view switch, palettes, side pane, undo/redo, save round trip) and area 5 (end-to-end runs). */
const Q = require('./qa_lib.js');
const fs = require('fs');
const { ok, sleep } = Q;
(async () => {
  const { b, ctx, p, errs } = await Q.start();
  const lastLog = () => p.evaluate(() => (EL.ui.logs.slice(-1)[0] || {}).m || '');
  const vis = (sel) => p.evaluate((s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; }, sel);
  await p.evaluate(() => EL.projects.open('tank', 'panel')); await sleep(800);
  const sig = {};
  for (const mode of ['build', 'test']) {
    await p.click(`#modeSeg .btn[data-m=${mode}]`); await sleep(150);
    for (const v of ['panel', 'plant', 'line', 'panel']) {
      await p.click(`#viewSeg .btn[data-v=${v}]`); await sleep(400);
      const r = await p.evaluate(() => ({ view: document.querySelector('#v-bench').dataset.view, on: document.querySelector('#viewSeg .btn.on').dataset.v, pal: [...document.querySelectorAll('#plist .pgh')].map((x) => x.textContent).join('|'), side: document.querySelector('#pane-part').textContent.slice(0, 60), mode: EL.bench.ed.mode }));
      const host = { panel: '#benchHost', plant: '#plantHost', line: '#lineHost' }[v];
      const others = ['#benchHost', '#plantHost', '#lineHost'].filter((x) => x !== host);
      const hv = await vis(host), ov = await Promise.all(others.map(vis));
      ok(r.view === v && r.on === v && hv && !ov.some(Boolean) && r.mode === mode, `[${mode}] view ${v}: host shown, others hidden, seg on`, JSON.stringify(r) + ' others ' + ov);
      sig[mode + v] = r;
      const want = { panel: /Sources|Protection/, plant: /Process units/, line: /Line elements/ }[v];
      ok(want.test(r.pal), `[${mode}] ${v} palette content`, r.pal);
      const wantSide = { panel: /Nothing selected|Properties|Live/, plant: /Process|Properties/, line: /Carton|Line results/ }[v];
      ok(wantSide.test(r.side), `[${mode}] ${v} side pane content`, r.side);
      await Q.shot(p, `bv_${mode}_${v}`);
    }
  }
  // palette search per view
  await p.click('#viewSeg .btn[data-v=plant]'); await sleep(200);
  await p.fill('#psearch', 'pump'); await sleep(200);
  const n1 = await p.$$eval('#plist .pit', (a) => a.length);
  ok(n1 >= 1 && n1 <= 3, 'plant palette search "pump" finds the pumps', n1);
  await p.fill('#psearch', ''); await sleep(100);
  await p.click('#tabs .tab[data-v=prog]'); await sleep(300);
  await p.fill('#gsearch', 'zzz'); await sleep(200);
  const n2 = await p.$$eval('#gplist .pit', (a) => a.length);
  ok(n2 === 0 || n2 === 18, 'ladder palette with search text: ' + n2 + ' items (search ignored in ladder view = ' + (n2 === 18) + ')');
  await p.fill('#gsearch', ''); await sleep(100);
  // view remembered after reload
  await p.click('#tabs .tab[data-v=bench]'); await sleep(200); await p.click('#viewSeg .btn[data-v=plant]'); await sleep(300);
  await p.evaluate(() => EL.bench.save());
  await p.reload(); await sleep(1500);
  const rl = await p.evaluate(() => ({ v: EL.bench.view, view: EL.ui.view(), units: (EL.bench.ed.c.plant || { units: [] }).units.length, lad: !!EL.bench.ed.c.parts.find((x) => x.tag === 'KF1').props.lad }));
  ok(rl.v === 'plant' && rl.units === 5 && rl.lad, 'reload restores bench with plant + ladder and the Plant view', JSON.stringify(rl));
  // undo/redo across views
  await p.click('#modeSeg .btn[data-m=build]'); await sleep(100);
  await p.click('#viewSeg .btn[data-v=panel]'); await sleep(300);
  const pc0 = await p.evaluate(() => EL.bench.ed.c.parts.length);
  await p.evaluate(() => { const ed = EL.bench.ed; ed.sel = ed.c.parts.find((x) => x.tag === 'H1').id; ed.delSel(); });
  await sleep(200);
  ok((await p.evaluate(() => EL.bench.ed.c.parts.length)) === pc0 - 1, 'panel delete H1');
  await p.click('#viewSeg .btn[data-v=plant]'); await sleep(300);
  await p.evaluate(() => { const PU = EL.ui.plant, pl = EL.bench.ed.c.plant; PU.select(pl.units.find((u) => u.tag === 'D1').id, null); PU.delSel(); }); await sleep(200);
  const u1 = await p.evaluate(() => EL.bench.ed.c.plant.units.length);
  await p.click('#btnUndo'); await sleep(300);
  const u2 = await p.evaluate(() => EL.bench.ed.c.plant.units.length);
  ok(u2 === u1 + 1 && (await vis('#plantHost')) && (await p.$$eval('#plantHost [data-u]', (a) => a.length)) === u2, 'Undo in Plant view restores the unit and redraws', u1 + '->' + u2);
  await p.click('#btnUndo'); await sleep(300);
  ok((await p.evaluate(() => EL.bench.ed.c.parts.length)) === pc0, 'second Undo (from Plant view) restores panel part H1');
  await p.click('#btnRedo'); await p.click('#btnRedo'); await sleep(300);
  ok((await p.evaluate(() => EL.bench.ed.c.parts.length)) === pc0 - 1 && (await p.evaluate(() => EL.bench.ed.c.plant.units.length)) === u1, 'Redo x2 re-applies both');
  await p.click('#btnUndo'); await p.click('#btnUndo'); await sleep(300);
  // ladder dirty edit survives a view switch?
  await p.click('#tabs .tab[data-v=prog]'); await sleep(400);
  await p.click('#ladHost .ld-bar button >> text=Network'); await sleep(200); await Q.closeModals(p);
  const nn = await p.evaluate(() => EL.ui.ladder.work.nets.length);
  await p.click('#tabs .tab[data-v=bench]'); await sleep(200); await p.click('#viewSeg .btn[data-v=plant]'); await sleep(300);
  await p.click('#tabs .tab[data-v=prog]'); await sleep(300);
  ok((await p.evaluate(() => EL.ui.ladder.work.nets.length)) === nn && (await p.evaluate(() => EL.ui.ladder.dirty)), 'undownloaded ladder edit survives a Plant/Ladder switch');
  // Ctrl+Z in plant view
  await p.click('#tabs .tab[data-v=bench]'); await sleep(200); await p.click('#viewSeg .btn[data-v=plant]'); await sleep(300);
  await p.evaluate(() => { const PU = EL.ui.plant, pl = EL.bench.ed.c.plant; PU.select(pl.units.find((u) => u.tag === 'D1').id, null); PU.delSel(); }); await sleep(200);
  const k1 = await p.evaluate(() => EL.bench.ed.c.plant.units.length);
  await p.keyboard.press('Control+z'); await sleep(300);
  const k2 = await p.evaluate(() => EL.bench.ed.c.plant.units.length);
  ok(k2 === k1 + 1, 'Ctrl+Z works in Plant view (' + k1 + ' -> ' + k2 + ')');
  if (k2 === k1) { await p.click('#btnUndo'); await sleep(300); }
  // Save / open dialog round trip
  await p.evaluate(() => { EL.ui.show('prog'); }); await sleep(200);
  await p.evaluate(() => EL.ui.ladder.download()); await sleep(200);
  await p.click('#tabs .tab[data-v=bench]'); await sleep(300);
  const ref = await p.evaluate(() => ({ units: EL.bench.ed.c.plant.units.map((u) => u.tag + u.x + u.y).join(','), pipes: EL.bench.ed.c.plant.pipes.length, lad: EL.bench.ed.c.parts.find((x) => x.tag === 'KF1').props.lad }));
  await p.click('#btnFile'); await sleep(200);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 4000 }).catch(() => null), p.click('.modal .btn.pri >> text=Download circuit file')]);
  const f = Q.SHOT + 'roundtrip.json'; if (dl) await dl.saveAs(f);
  ok(dl && fs.existsSync(f), 'Save dialog: Download circuit file gives a file ' + (dl && dl.suggestedFilename()));
  const txt = fs.readFileSync(f, 'utf8'); const js = JSON.parse(txt);
  ok(js.plant && js.plant.units.length === 5 && /nets/.test(JSON.stringify(js)), 'downloaded file contains plant and ladder');
  await Q.closeModals(p);
  await p.evaluate(() => EL.projects.open('booster', 'panel')); await sleep(500);
  await p.click('#btnFile'); await sleep(200);
  await p.setInputFiles('.modal input[type=file]', f); await sleep(800);
  const got = await p.evaluate(() => ({ units: EL.bench.ed.c.plant.units.map((u) => u.tag + u.x + u.y).join(','), pipes: EL.bench.ed.c.plant.pipes.length, lad: (EL.bench.ed.c.parts.find((x) => x.tag === 'KF1') || { props: {} }).props.lad, modal: document.querySelectorAll('.modal').length }));
  ok(got.units === ref.units && got.pipes === ref.pipes && got.lad === ref.lad && got.modal === 0, 'Open file in Save dialog restores plant + ladder exactly', JSON.stringify(got).slice(0, 200));
  await p.click('#viewSeg .btn[data-v=plant]'); await sleep(400);
  ok((await p.$$eval('#plantHost [data-u]', (a) => a.length)) === 5, 'plant view redraws loaded plant');
  // paste text path
  await p.evaluate(() => EL.projects.open('booster', 'panel')); await sleep(400);
  await p.click('#btnFile'); await sleep(200);
  await p.fill('.modal textarea', txt);
  await p.click('.modal .btn >> text=Load pasted text'); await sleep(500);
  ok((await p.evaluate(() => EL.bench.ed.c.plant.units.length)) === 5 && (await Q.modalCount(p)) === 0, 'Load pasted text restores the project');
  await p.click('#btnFile'); await sleep(200);
  await p.click('.modal .btn >> text=Show text of this circuit'); await sleep(200);
  ok((await p.$eval('.modal textarea', (t) => t.value.length)) > 1000, 'Show text fills the textarea');
  await p.fill('.modal textarea', 'garbage'); await p.click('.modal .btn >> text=Load pasted text'); await sleep(200);
  ok(/Bad text/.test(await lastLog()), 'Load pasted garbage -> "Bad text" toast');
  await Q.closeModals(p);

  /* ---------------- area 5: run the 3 projects ---------------- */
  const simT = () => p.evaluate(() => EL.bench.ed.c.time || 0);
  const runTo = async (secs, cond, maxReal = 60000) => { const t0 = await simT(), r0 = Date.now(); while (Date.now() - r0 < maxReal) { const t = await simT(); const c = cond ? await p.evaluate(cond) : false; if (c || t - t0 >= secs) return { t: t - t0, c }; await sleep(150); } return { t: (await simT()) - t0, c: false, timeout: true }; };
  const pressS1 = async () => { await p.evaluate(() => EL.bench.setView('panel')); await sleep(300); await p.evaluate(() => EL.bench.ed.fit()); await sleep(300); const xy = await p.evaluate(() => { const ed = EL.bench.ed; const q = ed.c.parts.find((x) => x.tag === 'S1'); const d = EL.defs[q.type]; const r = ed.svg.getBoundingClientRect(); return { x: r.left + ed.view.x + (q.x + d.w / 2) * ed.view.k, y: r.top + ed.view.y + (q.y + d.h / 2) * ed.view.k }; }); await p.mouse.move(xy.x, xy.y); await p.mouse.down(); await sleep(250); await p.mouse.up(); await sleep(100); };
  const KM = () => p.evaluate(() => ['KM1', 'KM2', 'KM3'].map((t) => (EL.bench.ed.c.parts.find((x) => x.tag === t) || { state: {} }).state.closed ? 1 : 0).join(''));
  // speed button cycles 1 -> 5 -> 20
  await p.evaluate(() => EL.projects.open('tank', 'plant')); await sleep(800);
  await p.click('#btnSpeed'); await p.click('#btnSpeed'); await sleep(100);
  ok((await p.evaluate(() => EL.bench.speed)) === 20 && (await p.textContent('#btnSpeed')) === '20x', '#btnSpeed cycles to 20x');
  // TANK
  const lvl = () => p.evaluate(() => EL.bench.ed.c.plant.units.find((u) => u.tag === 'T1').state.lvl || 0);
  console.log('     tank start level', (await lvl()).toFixed(1), 'KM', await KM());
  await pressS1();
  let r = await runTo(2, () => { const k = ['KM1', 'KM2'].map((t) => EL.bench.ed.c.parts.find((x) => x.tag === t).state.closed); return k[0] && k[1]; });
  const star = await KM();
  ok(star === '110', 'tank: S1 -> KM1+KM2 star (' + star + ') after ' + r.t.toFixed(1) + ' s sim');
  r = await runTo(15, () => EL.bench.ed.c.parts.find((x) => x.tag === 'KM3').state.closed);
  const delta = await KM();
  ok(delta === '101' && r.t < 12, `tank: delta KM1+KM3 (${delta}) after the star time (${r.t.toFixed(1)} s)`);
  const pumpQ = await p.evaluate(() => { const u = EL.bench.ed.c.plant.units.find((x) => x.tag === 'P1'); return [u.state.s, u.state.q * 60]; });
  console.log('     pump speed/flow', pumpQ.map((x) => (+x).toFixed(2)));
  await p.evaluate(() => EL.bench.setView('plant')); await sleep(400);
  // close V1 by tapping it in plant (test mode)
  const v = await p.evaluate(() => { const PU = EL.ui.plant, u = EL.bench.ed.c.plant.units.find((x) => x.tag === 'V1'), d = EL.plant.defs[u.type], rr = document.querySelector('#plantHost svg').getBoundingClientRect(); return { x: rr.left + PU.view.x + (u.x + d.w / 2) * PU.view.k, y: rr.top + PU.view.y + (u.y + d.h / 2) * PU.view.k }; });
  await p.mouse.click(v.x, v.y); await sleep(200);
  ok(!(await p.evaluate(() => EL.bench.ed.c.plant.units.find((x) => x.tag === 'V1').props.open)), 'tank: tap V1 in Test mode closes it');
  await p.click('#btnSpeed'); await sleep(50); // 60x
  r = await runTo(900, () => !EL.bench.ed.c.parts.find((x) => x.tag === 'KM1').state.closed, 90000);
  const lv = await lvl();
  ok(r.c && lv > 86 && lv < 95, `tank: pump stops near 90 % (level ${lv.toFixed(1)} %, after ${r.t.toFixed(0)} s sim, KM ${await KM()})`);
  await Q.shot(p, 'e2e_tank_full');
  // RO
  await p.evaluate(() => { EL.bench.speed = 20; EL.projects.open('ro', 'plant'); }); await sleep(800);
  await pressS1();
  r = await runTo(5, () => EL.bench.ed.c.parts.find((x) => x.tag === 'KM1').state.closed);
  ok(r.c, 'RO: S1 starts the HP pump KM1 (' + r.t.toFixed(1) + ' s)');
  await runTo(5);
  const ro = await p.evaluate(() => { const u = EL.bench.ed.c.plant.units.find((x) => x.tag === 'RO1'); return { perm: u.state.qp * 60, rec: u.state.rec, pin: u.state.pin }; });
  console.log('     RO running', JSON.stringify(ro));
  ok(ro.perm > 0.5, 'RO: permeate flows ' + ro.perm.toFixed(1) + ' L/min');
  await p.evaluate(() => EL.bench.setView('plant')); await sleep(400);
  await p.evaluate(() => { const PU = EL.ui.plant; const u = EL.bench.ed.c.plant.units.find((x) => x.tag === 'V1'); PU.select(u.id, null); }); await sleep(150);
  await p.click('#pane-part .btn >> text=Close valve'); await sleep(100);
  r = await runTo(30, () => !EL.bench.ed.c.parts.find((x) => x.tag === 'KM1').state.closed);
  const h1 = await p.evaluate(() => { const q = EL.bench.ed.c.parts.find((x) => x.tag === 'H1'); return q.state.on || q.state.b > 0.5; });
  ok(r.c && h1, `RO: V1 closed -> pump trips after ${r.t.toFixed(1)} s, H1 lit=${h1}`);
  await Q.shot(p, 'e2e_ro_trip');
  // BOOSTER
  await p.evaluate(() => { EL.bench.speed = 20; EL.projects.open('booster', 'plant'); }); await sleep(800);
  await p.evaluate(() => { const sa = EL.bench.ed.c.parts.find((x) => x.tag === 'SA1'); console.log(JSON.stringify(sa.state)); });
  const press = () => p.evaluate(() => { const u = EL.bench.ed.c.plant.units.find((x) => x.tag === 'PT1'); return u.state.p || 0; });
  // turn SA1 to run via its press handler (UI click on the selector)
  await p.evaluate(() => EL.bench.setView('panel')); await sleep(300);
  const sxy = await p.evaluate(() => { const ed = EL.bench.ed; const q = ed.c.parts.find((x) => x.tag === 'SA1'); const d = EL.defs[q.type]; const r = ed.svg.getBoundingClientRect(); return { x: r.left + ed.view.x + (q.x + d.w / 2) * ed.view.k, y: r.top + ed.view.y + (q.y + d.h / 2) * ed.view.k }; });
  await p.mouse.click(sxy.x, sxy.y); await sleep(200);
  await runTo(15);
  const pA = await press();
  await p.evaluate(() => { const rv = EL.bench.ed.c.parts.find((x) => x.tag === 'RV1'); EL.bench.ed.sel = rv.id; EL.bench.inspector(EL.bench.ed); });
  await sleep(200);
  const potIn = await p.evaluate(() => { const i = [...document.querySelectorAll('#pane-part input[type=number], #pane-part input[type=range]')]; return i.map((x) => x.type + ':' + x.value); });
  console.log('     RV1 inspector inputs', potIn.join(' '));
  await p.evaluate(() => { const rv = EL.bench.ed.c.parts.find((x) => x.tag === 'RV1'); rv.props.pos = 40; });
  await runTo(15);
  const pB = await press();
  ok(pA > 0.3 && pB < pA * 0.8, `booster: PT1 pressure follows RV1 (85 % -> ${pA.toFixed(2)} bar, 40 % -> ${pB.toFixed(2)} bar)`);
  Q.summary(errs);
  await b.close(); process.exit(Q.fails ? 1 : 0);
})();
