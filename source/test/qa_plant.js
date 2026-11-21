/* QA area 3: Plant view. */
const Q = require('./qa_lib.js');
const { ok, sleep } = Q;
(async () => {
  const { b, p, errs } = await Q.start();
  const lastLog = () => p.evaluate(() => (EL.ui.logs.slice(-1)[0] || {}).m || '');
  const st = () => p.evaluate(() => { const pl = EL.bench.ed.c.plant || { units: [], pipes: [] }; return { units: pl.units.length, pipes: pl.pipes.length, sel: EL.ui.plant.sel, selPipe: EL.ui.plant.selPipe, mode: EL.bench.ed.mode }; });
  const uScr = (tag, fx = 0.5, fy = 0.5) => p.evaluate(([tag, fx, fy]) => { const PU = EL.ui.plant, pl = EL.bench.ed.c.plant, u = pl.units.find((x) => x.tag === tag), d = EL.plant.defs[u.type], r = document.querySelector('#plantHost svg').getBoundingClientRect(); return { x: r.left + PU.view.x + (u.x + d.w * fx) * PU.view.k, y: r.top + PU.view.y + (u.y + d.h * fy) * PU.view.k, id: u.id }; }, [tag, fx, fy]);
  const portScr = (ref) => p.evaluate((ref) => { const PU = EL.ui.plant, pl = EL.bench.ed.c.plant, [t, port] = ref.split('.'), u = pl.units.find((x) => x.tag === t), q = EL.plant.portPos(u, port), r = document.querySelector('#plantHost svg').getBoundingClientRect(); return { x: r.left + PU.view.x + q.x * PU.view.k, y: r.top + PU.view.y + q.y * PU.view.k }; }, ref);
  const hitAt = (x, y) => p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); const g = e && e.closest('[data-u],[data-port],[data-pipe]'); return g ? (g.dataset.u || g.dataset.port || 'pipe:' + g.dataset.pipe) : (e ? e.tagName + '.' + e.className.baseVal : null); }, [x, y]);

  // empty project
  await p.click('#tabs .tab[data-v=projects]'); await sleep(200);
  await p.click('#projRoot .pj-hero .btn.pri'); await sleep(600);
  // palette shows process units
  const pal = await p.$$eval('#plist .pit span', (a) => a.map((x) => x.textContent));
  ok(pal.length === 17, 'plant palette lists 17 process units', pal.join(','));
  // + Add menu: every unit type
  const order = await p.evaluate(() => EL.plant.order);
  for (let i = 0; i < order.length; i++) {
    await p.click('#plantHost .pl-tools .btn.pri'); await sleep(150);
    const n = await p.$$eval('.modal .pl-mi', (a) => a.length);
    if (i === 0) ok(n === 17, '+ Add menu shows 17 types', n);
    const before = (await st()).units;
    await (await p.$$('.modal .pl-mi'))[i].click(); await sleep(150);
    const s = await st();
    const t = await p.evaluate((id) => { const u = EL.bench.ed.c.plant.units.find((x) => x.id === id); return u && u.type; }, s.sel);
    ok(s.units === before + 1 && t === order[i] && (await Q.modalCount(p)) === 0, `+ Add ${order[i]} adds and selects it`, JSON.stringify(s) + ' ' + t);
  }
  await p.click('#plantHost .pl-tools .btn >> text=Fit'); await sleep(200);
  await Q.shot(p, 'pl_all_units');
  // palette tap adds
  let s0 = await st();
  await p.click('#plist .pit >> nth=1'); await sleep(200);
  ok((await st()).units === s0.units + 1, 'palette tap adds a unit');
  // palette drag
  s0 = await st();
  const pit = await (await p.$('#plist .pit >> nth=2')).boundingBox();
  const hb = await (await p.$('#plantHost')).boundingBox();
  await p.mouse.move(pit.x + 20, pit.y + 20); await p.mouse.down(); await p.mouse.move(hb.x + 300, hb.y + 300, { steps: 8 }); await p.mouse.up(); await sleep(200);
  ok((await st()).units === s0.units + 1, 'palette drag-drop onto canvas adds a unit');
  // zoom + fit
  const k0 = await p.evaluate(() => EL.ui.plant.view.k);
  await p.click('#plantHost .pl-tools [aria-label="zoom in"]'); await sleep(50);
  const k1 = await p.evaluate(() => EL.ui.plant.view.k);
  await p.click('#plantHost .pl-tools [aria-label="zoom out"]'); await p.click('#plantHost .pl-tools [aria-label="zoom out"]'); await sleep(50);
  const k2 = await p.evaluate(() => EL.ui.plant.view.k);
  ok(k1 > k0 && k2 < k1, `zoom +/- change scale ${k0.toFixed(2)} -> ${k1.toFixed(2)} -> ${k2.toFixed(2)}`);
  await p.mouse.move(hb.x + 400, hb.y + 300); await p.mouse.wheel(0, -300); await sleep(100);
  ok((await p.evaluate(() => EL.ui.plant.view.k)) > k2, 'mouse wheel zooms');

  // fresh clean layout for interactions: empty project + T1, P1, V1 via API placement
  await p.evaluate(() => { EL.projects.openEmpty(); });
  await sleep(400);
  await p.evaluate(() => { const PU = EL.ui.plant; PU.add('TANK', 0, 0); PU.add('PUMP', 300, 150); PU.add('VALVE', 560, 160); PU.add('DRAIN', 760, 160); PU.select(null, null); PU.fit(); });
  await sleep(300);
  // drag a unit
  const before = await p.evaluate(() => { const u = EL.bench.ed.c.plant.units.find((x) => x.tag === 'P1'); return [u.x, u.y]; });
  let c = await uScr('P1', 0.5, 0.5);
  ok((await hitAt(c.x, c.y)) === c.id, 'P1 body is hit-testable at its center', await hitAt(c.x, c.y));
  await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.mouse.move(c.x + 80, c.y + 60, { steps: 6 }); await p.mouse.up(); await sleep(200);
  const after = await p.evaluate(() => { const u = EL.bench.ed.c.plant.units.find((x) => x.tag === 'P1'); return [u.x, u.y]; });
  ok(after[0] > before[0] + 40 && after[1] > before[1] + 30, 'dragging a unit moves it ' + before + ' -> ' + after);
  // undo the drag
  await p.click('#btnUndo'); await sleep(200);
  const und = await p.evaluate(() => { const u = EL.bench.ed.c.plant.units.find((x) => x.tag === 'P1'); return [u.x, u.y]; });
  ok(und[0] === before[0] && und[1] === before[1], 'Undo puts the dragged unit back ' + und);
  await p.click('#btnRedo'); await sleep(200);
  const red = await p.evaluate(() => { const u = EL.bench.ed.c.plant.units.find((x) => x.tag === 'P1'); return [u.x, u.y]; });
  ok(red[0] === after[0] && red[1] === after[1], 'Redo re-applies the drag ' + red);
  // pipe tap -> tap
  const ports = await p.evaluate(() => EL.bench.ed.c.plant.units.map((u) => u.tag + ':' + EL.plant.portsOf(u).map((q) => q.id).join('/')));
  console.log('     ports', ports.join('  '));
  let a = await portScr('T1.out1'), bb = await portScr('P1.in');
  ok((await hitAt(a.x, a.y)) && String(await hitAt(a.x, a.y)).includes('.out1'), 'T1.out1 port hit-testable', await hitAt(a.x, a.y));
  await p.mouse.click(a.x, a.y); await sleep(150);
  ok((await p.evaluate(() => EL.ui.plant.pending)) != null, 'tap port sets pending');
  await p.mouse.click(bb.x, bb.y); await sleep(200);
  let s = await st();
  ok(s.pipes === 1 && /Pipe laid/.test(await lastLog()), 'tap port -> tap port lays pipe', JSON.stringify(s) + ' ' + (await lastLog()));
  // pipe drag port -> port
  a = await portScr('P1.out'); bb = await portScr('V1.a');
  await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + bb.x) / 2, (a.y + bb.y) / 2, { steps: 4 });
  ok(await p.evaluate(() => !!document.querySelector('#plantHost .pl-rubber')), 'rubber line shows while dragging from a port');
  await p.mouse.move(bb.x, bb.y, { steps: 4 }); await p.mouse.up(); await sleep(200);
  s = await st();
  ok(s.pipes === 2, 'drag port -> port lays pipe', JSON.stringify(s));
  a = await portScr('V1.b'); bb = await portScr('D1.in');
  await p.mouse.click(a.x, a.y); await sleep(100); await p.mouse.click(bb.x, bb.y); await sleep(150);
  // same-unit pipe
  a = await portScr('P1.in'); bb = await portScr('P1.out');
  await p.mouse.click(a.x, a.y); await sleep(100); await p.mouse.click(bb.x, bb.y); await sleep(150);
  ok(/two different units/.test(await lastLog()), 'pipe to same unit refused with toast', await lastLog());
  // duplicate pipe
  const pc0 = (await st()).pipes; await Q.clearToasts(p);
  const ul0 = await p.evaluate(() => EL.bench.ed.undoS.length);
  a = await portScr('T1.out1'); bb = await portScr('P1.in');
  await p.mouse.click(a.x, a.y); await sleep(100); await p.mouse.click(bb.x, bb.y); await sleep(150);
  const ul1 = await p.evaluate(() => EL.bench.ed.undoS.length);
  const dupMsg = await p.evaluate(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join('|'));
  ok((await st()).pipes === pc0, 'duplicate pipe not added');
  ok(dupMsg.length > 0, 'duplicate pipe gives feedback (toast)', 'no toast; undo stack grew by ' + (ul1 - ul0));
  // select pipe by click on its path
  const mid = await p.evaluate(() => { const g = document.querySelector('#plantHost [data-pipe] .pl-hit'); const L = g.getTotalLength(); const pt = g.getPointAtLength(L / 2); const m = g.getScreenCTM(); return { x: pt.x * m.a + pt.y * m.c + m.e, y: pt.x * m.b + pt.y * m.d + m.f, id: g.parentNode.dataset.pipe }; });
  await p.mouse.click(mid.x, mid.y); await sleep(200);
  s = await st();
  ok(s.selPipe === mid.id, 'click on pipe selects it', JSON.stringify(s));
  ok(await p.evaluate(() => /Pipe/.test(document.querySelector('#pane-part').textContent)), 'pipe inspector shows');
  ok(await p.isVisible('#plantHost .pl-del'), 'toolbar Delete appears when pipe selected');
  await p.click('#plantHost .pl-del'); await sleep(200);
  s = await st();
  ok(s.pipes === 2 && !s.selPipe, 'toolbar Delete removes pipe', JSON.stringify(s));
  // select another pipe + Delete key
  const mid2 = await p.evaluate(() => { const g = document.querySelector('#plantHost [data-pipe] .pl-hit'); const L = g.getTotalLength(); const pt = g.getPointAtLength(L / 2); const m = g.getScreenCTM(); return { x: pt.x * m.a + pt.y * m.c + m.e, y: pt.x * m.b + pt.y * m.d + m.f }; });
  await p.mouse.click(mid2.x, mid2.y); await sleep(150);
  await p.keyboard.press('Delete'); await sleep(200);
  ok((await st()).pipes === 1, 'Delete key removes selected pipe');
  // inspector Delete pipe button
  const mid3 = await p.evaluate(() => { const g = document.querySelector('#plantHost [data-pipe] .pl-hit'); const L = g.getTotalLength(); const pt = g.getPointAtLength(L / 2); const m = g.getScreenCTM(); return { x: pt.x * m.a + pt.y * m.c + m.e, y: pt.x * m.b + pt.y * m.d + m.f }; });
  await p.mouse.click(mid3.x, mid3.y); await sleep(150);
  await p.click('#pane-part .btn.bad >> text=Delete pipe'); await sleep(200);
  ok((await st()).pipes === 0, 'inspector "Delete pipe" removes it');
  await p.click('#btnUndo'); await sleep(200);
  ok((await st()).pipes === 1, 'Undo restores deleted pipe');
  // delete unit via Delete key and inspector button
  c = await uScr('D1'); await p.mouse.click(c.x, c.y); await sleep(150);
  ok((await st()).sel === c.id, 'click unit selects it');
  await p.keyboard.press('Delete'); await sleep(200);
  ok((await st()).units === 3, 'Delete key removes unit');
  c = await uScr('V1'); await p.mouse.click(c.x, c.y); await sleep(150);
  await p.click('#pane-part .btn.bad >> text=Delete'); await sleep(200);
  s = await st();
  ok(s.units === 2, 'inspector Delete removes unit (and its pipes: ' + s.pipes + ')');
  await p.click('#btnUndo'); await sleep(200);
  ok((await st()).units === 3, 'Undo restores unit');
  // Mirror
  c = await uScr('P1'); await p.mouse.click(c.x, c.y); await sleep(150);
  const f0 = await p.evaluate(() => EL.bench.ed.c.plant.units.find((x) => x.tag === 'P1').props.flip);
  await p.click('#pane-part .btn >> text=Mirror'); await sleep(150);
  ok((await p.evaluate(() => EL.bench.ed.c.plant.units.find((x) => x.tag === 'P1').props.flip)) === !f0, 'Mirror flips the pump');
  // Escape clears
  await p.keyboard.press('Escape'); await sleep(100);
  ok(!(await st()).sel, 'Escape clears selection');
  // Test mode: tap valve toggles
  await p.click('#modeSeg .btn[data-m=test]'); await sleep(200);
  c = await uScr('V1'); const o0 = await p.evaluate(() => EL.bench.ed.c.plant.units.find((x) => x.tag === 'V1').props.open);
  await p.mouse.click(c.x, c.y); await sleep(200);
  const o1 = await p.evaluate(() => EL.bench.ed.c.plant.units.find((x) => x.tag === 'V1').props.open);
  ok(o1 === !o0, `Test mode tap on valve toggles it (${o0} -> ${o1})`);
  ok(!(await p.evaluate(() => document.querySelector('#plantHost [data-port]'))), 'no ports shown in Test mode');
  // Delete key in test mode should not delete
  await p.keyboard.press('Delete'); await sleep(100);
  ok((await st()).units === 3, 'Delete key ignored in Test mode');
  await p.click('#pane-part .btn >> text=/Open valve|Close valve/'); await sleep(150);
  ok((await p.evaluate(() => EL.bench.ed.c.plant.units.find((x) => x.tag === 'V1').props.open)) === o0, 'inspector Open/Close valve button toggles');

  /* ---------- inspector on the RO project (has panel parts to link) ---------- */
  await p.evaluate(() => EL.projects.open('ro', 'plant')); await sleep(800);
  await p.click('#modeSeg .btn[data-m=build]'); await sleep(200);
  // add missing types so every inspector is covered
  await p.evaluate(() => { const have = new Set(EL.bench.ed.c.plant.units.map((u) => u.type)); for (const t of EL.plant.order) if (!have.has(t)) EL.ui.plant.add(t, 1200 + Math.random() * 300, 600); });
  await sleep(300);
  const units = await p.evaluate(() => EL.bench.ed.c.plant.units.map((u) => ({ id: u.id, tag: u.tag, type: u.type })));
  const report = [];
  for (const u of units) {
    await p.evaluate((id) => EL.ui.plant.select(id, null), u.id); await sleep(80);
    // number inputs
    const nNum = await p.$$eval('#pane-part input[type=number]', (a) => a.length);
    for (let i = 0; i < nNum; i++) {
      const r = await p.evaluate(([id, i]) => {
        const inp = document.querySelectorAll('#pane-part input[type=number]')[i]; const u = EL.bench.ed.c.plant.units.find((x) => x.id === id);
        const snap = JSON.stringify(u.props); const nv = (+inp.value || 0) + 7; inp.value = nv; inp.dispatchEvent(new Event('change', { bubbles: true }));
        const u2 = EL.bench.ed.c.plant.units.find((x) => x.id === id); return JSON.stringify(u2.props) !== snap;
      }, [u.id, i]);
      if (!r) report.push(u.tag + ' number#' + i + ' no effect');
      await sleep(30);
    }
    const nSel = await p.$$eval('#pane-part select', (a) => a.length);
    for (let i = 0; i < nSel; i++) {
      const r = await p.evaluate(([id, i]) => {
        const s = document.querySelectorAll('#pane-part select')[i]; if (s.options.length < 2) return 'single-option:' + s.options[0].text; const u = EL.bench.ed.c.plant.units.find((x) => x.id === id);
        const snap = JSON.stringify(u.props); s.selectedIndex = (s.selectedIndex + 1) % s.options.length; s.dispatchEvent(new Event('change', { bubbles: true }));
        const u2 = EL.bench.ed.c.plant.units.find((x) => x.id === id); return JSON.stringify(u2.props) !== snap ? true : 'no-change';
      }, [u.id, i]);
      if (r !== true) report.push(u.tag + ' select#' + i + ' ' + r);
      await sleep(30);
    }
    // text inputs (tag + float names)
    const tagOk = await p.evaluate((id) => { const inp = document.querySelector('#pane-part input[type=text]'); inp.value = 'Z' + id; inp.dispatchEvent(new Event('change', { bubbles: true })); return EL.bench.ed.c.plant.units.find((x) => x.id === id).tag === 'Z' + id; }, u.id);
    if (!tagOk) report.push(u.tag + ' tag edit no effect');
    // bool buttons in Properties card (Yes/No)
    const boolR = await p.evaluate((id) => { const out = []; const btns = [...document.querySelectorAll('#pane-part .card')].filter((c) => /Properties/.test(c.textContent)).flatMap((c) => [...c.querySelectorAll('button')]); for (let i = 0; i < btns.length; i++) { const u = EL.bench.ed.c.plant.units.find((x) => x.id === id); const snap = JSON.stringify(u.props); const b = [...document.querySelectorAll('#pane-part .card')].filter((c) => /Properties/.test(c.textContent)).flatMap((c) => [...c.querySelectorAll('button')])[i]; if (!b) break; b.click(); if (JSON.stringify(EL.bench.ed.c.plant.units.find((x) => x.id === id).props) === snap) out.push('bool#' + i); } return out; }, u.id);
    for (const x of boolR) report.push(u.tag + ' ' + x + ' no effect');
    console.log(`      ${u.type.padEnd(6)} ${u.tag.padEnd(5)} num=${nNum} sel=${nSel}`);
  }
  ok(!report.length, 'every inspector input/select/bool changes the unit', report.join('; '));
  await Q.shot(p, 'pl_ro_inspector');
  // filter actions
  const fl = await p.evaluate(() => EL.bench.ed.c.plant.units.filter((u) => u.type === 'FILTER').map((u) => ({ id: u.id, kind: u.props.kind })));
  for (const f of fl) {
    await p.evaluate((id) => { const u = EL.bench.ed.c.plant.units.find((x) => x.id === id); u.state.clog = 1.5; EL.ui.plant.select(id, null); }, f.id); await sleep(80);
    const lab = await p.evaluate(() => [...document.querySelectorAll('#pane-part .btn.ok')].map((b) => b.textContent).join('|'));
    await p.click('#pane-part .btn.ok >> text=/Backwash|Change cartridge/'); await sleep(150);
    const cl = await p.evaluate((id) => EL.bench.ed.c.plant.units.find((x) => x.id === id).state.clog, f.id);
    ok(cl === 0, `filter (${f.kind}) "${lab}" clears clog`, cl);
  }
  // tank actions
  const tk = await p.evaluate(() => EL.bench.ed.c.plant.units.find((u) => u.type === 'TANK').id);
  await p.evaluate((id) => EL.ui.plant.select(id, null), tk); await sleep(80);
  const e0 = errs.length;
  await p.click('#pane-part .btn >> text=Empty it'); await sleep(400);
  const v0 = await p.evaluate((id) => EL.bench.ed.c.plant.units.find((x) => x.id === id).state.v, tk);
  ok(v0 < 1, 'Empty it sets tank volume to 0: ' + v0);
  ok(errs.length === e0, 'Empty tank renders without console errors', errs.slice(e0).join(' | '));
  await Q.shot(p, 'pl_tank_empty');
  await p.click('#pane-part .btn >> text=Reset level'); await sleep(150);
  const v1 = await p.evaluate((id) => { const u = EL.bench.ed.c.plant.units.find((x) => x.id === id); return [u.state.v, u.props.vol * u.props.lvl0 / 100]; }, tk);
  ok(Math.abs(v1[0] - v1[1]) < 2, 'Reset level restores start level ' + v1);
  // negative volume from inspector
  const e1 = errs.length;
  await p.evaluate((id) => { const inp = document.querySelectorAll('#pane-part input[type=number]')[0]; inp.value = -20; inp.dispatchEvent(new Event('change', { bubbles: true })); }, tk); await sleep(500);
  const vv = await p.evaluate((id) => EL.bench.ed.c.plant.units.find((x) => x.id === id).props.vol, tk);
  ok(vv > 0, 'tank Volume input rejects negative values (got ' + vv + ')');
  ok(errs.length === e1, 'negative volume causes no console errors', errs.slice(e1).join(' | ').slice(0, 200));
  await p.click('#btnUndo'); await sleep(200);
  // process check items clickable
  await p.evaluate(() => EL.ui.plant.select(null, null)); await sleep(300);
  const probs = await p.$$eval('#plProblems .pl-prob', (a) => a.map((x) => x.textContent));
  console.log('     process check:', probs.length, probs.slice(0, 4).join(' / '));
  ok(probs.length > 0, 'Process check lists items (after adding unlinked units)');
  let clicked = 0;
  for (let i = 0; i < probs.length; i++) {
    await p.evaluate(() => EL.ui.plant.select(null, null)); await sleep(80);
    const tag = probs[i].split(' ')[0];
    const items = await p.$$('#plProblems .pl-prob'); if (!items[i]) break;
    await items[i].click(); await sleep(100);
    const sel = await p.evaluate(() => { const u = EL.bench.ed.c.plant.units.find((x) => x.id === EL.ui.plant.sel); return u && u.tag; });
    if (sel === tag) clicked++; else console.log('      check item not selecting:', probs[i], '->', sel);
  }
  ok(clicked === probs.length, `every Process check item selects its unit (${clicked}/${probs.length})`);
  Q.summary(errs);
  await b.close(); process.exit(Q.fails ? 1 : 0);
})();
