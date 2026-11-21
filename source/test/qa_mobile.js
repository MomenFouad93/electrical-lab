/* QA area 6: phone layout 390x844 touch. */
const Q = require('./qa_lib.js');
const { ok, sleep } = Q;
(async () => {
  const { b, p, errs } = await Q.start({ mobile: true });
  const rect = (s) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height, vis: getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' }; }, s);
  const inVP = (r) => r && r.l >= -1 && r.r <= 391 && r.t >= -1 && r.b <= 845 && r.w > 0;
  const tap = async (s) => { const r = await rect(s); await p.touchscreen.tap(r.l + r.w / 2, r.t + r.h / 2); await sleep(250); };
  const hscroll = () => p.evaluate(() => [document.documentElement.scrollWidth, document.body.scrollWidth]);
  // projects tab
  await tap('#tabs .tab[data-v=projects]');
  ok((await p.evaluate(() => EL.ui.view())) === 'projects', 'tap Projects tab');
  let hs = await hscroll(); ok(hs[0] <= 390, 'Projects: no horizontal page scroll ' + hs);
  const offs = await p.evaluate(() => [...document.querySelectorAll('#projRoot button, #projRoot summary, #projRoot label.btn')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.left < 0 || r.right > 390); }).map((e) => e.textContent));
  ok(!offs.length, 'Projects: all buttons inside the screen width', offs.join(','));
  const tabs = await p.evaluate(() => [...document.querySelectorAll('#tabs .tab')].map((t) => { const r = t.getBoundingClientRect(); return t.dataset.v + ':' + Math.round(r.left) + '-' + Math.round(r.right); }));
  console.log('     tabs', tabs.join(' '));
  await Q.shot(p, 'm_projects');
  // Open tank via tap
  const ob = await p.$('#projRoot .pj-card >> nth=0 >> button >> text=Open');
  await ob.scrollIntoViewIfNeeded(); const bb = await ob.boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(1200);
  ok((await p.evaluate(() => EL.bench.view)) === 'plant', 'tap Open -> plant view');
  await Q.shot(p, 'm_plant');
  // key controls on screen
  for (const s of ['#viewSeg', '#viewSeg .btn[data-v=line]', '#modeSeg', '#dock', '#plantHost .pl-tools']) {
    const r = await rect(s); ok(r && r.vis && inVP(r), `phone: ${s} visible on screen`, JSON.stringify(r));
  }
  hs = await hscroll(); ok(hs[0] <= 390, 'Bench: no horizontal page scroll ' + hs);
  // overlap: pl-tools vs viewSeg / dock
  const ov = await p.evaluate(() => { const R = (s) => document.querySelector(s).getBoundingClientRect(); const x = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top); return { toolsDock: x(R('#plantHost .pl-tools'), R('#dock')), toolsSeg: x(R('#plantHost .pl-tools'), R('#viewSeg')) }; });
  ok(!ov.toolsDock && !ov.toolsSeg, 'plant tools do not overlap dock / view switch', JSON.stringify(ov));
  // dock buttons
  const dock = await p.$$eval('#dock button', (a) => a.map((x) => x.textContent.trim()));
  for (let i = 0; i < dock.length; i++) {
    await tap(`#dock button:nth-child(${i + 1})`);
    const st = await p.evaluate(() => ({ pal: document.querySelector('#palette').classList.contains('open'), side: document.querySelector('#side').classList.contains('open'), pane: (document.querySelector('#side .spane.on') || {}).id }));
    const sheet = await rect(i === 0 ? '#palette' : '#side');
    ok((i === 0 ? st.pal : st.side) && inVP(sheet), `dock "${dock[i]}" opens its sheet on screen`, JSON.stringify(st) + JSON.stringify(sheet));
    if (i === 0) { const items = await p.$$eval('#plist .pit', (a) => a.length); ok(items === await p.evaluate(() => EL.plant.order.length), 'Parts sheet in Plant view lists every unit'); }
    if (i > 0) ok(st.pane === 'pane-' + ['part', 'meters', 'diag', 'assist'][i - 1], `dock "${dock[i]}" shows its pane`, st.pane);
    await Q.shot(p, 'm_dock_' + i);
    await tap(`#dock button:nth-child(${i + 1})`);
    const st2 = await p.evaluate(() => [document.querySelector('#palette').classList.contains('open'), document.querySelector('#side').classList.contains('open')]);
    ok(!st2[0] && !st2[1], `dock "${dock[i]}" tap again closes the sheet`, st2);
  }
  // plant: tap a palette unit in build mode -> adds, sheet closes
  await tap('#modeSeg .btn[data-m=build]');
  await tap('#dock button:nth-child(1)');
  const u0 = await p.evaluate(() => EL.bench.ed.c.plant.units.length);
  const pit = await p.$('#plist .pit >> nth=3'); const pb = await pit.boundingBox(); await p.touchscreen.tap(pb.x + pb.width / 2, pb.y + pb.height / 2); await sleep(300);
  ok((await p.evaluate(() => EL.bench.ed.c.plant.units.length)) === u0 + 1 && !(await p.evaluate(() => document.querySelector('#palette').classList.contains('open'))), 'tap a unit in Parts sheet adds it and closes the sheet');
  // tap port -> tap port
  await p.evaluate(() => { const PU = EL.ui.plant, pl = EL.bench.ed.c.plant, a = pl.units.find((x) => x.tag === 'T1'), b = pl.units.slice(-1)[0]; PU.view.k = 0.3; const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2; PU.view.x = 195 - cx * 0.3; PU.view.y = 380 - cy * 0.3; PU.zoom(1); PU.render(true); }); await sleep(200);
  const portScr = (ref) => p.evaluate((ref) => { const PU = EL.ui.plant, pl = EL.bench.ed.c.plant, [t, port] = ref.split('.'), u = pl.units.find((x) => x.tag === t), q = EL.plant.portPos(u, port), r = document.querySelector('#plantHost svg').getBoundingClientRect(); return { x: r.left + PU.view.x + q.x * PU.view.k, y: r.top + PU.view.y + q.y * PU.view.k }; }, ref);
  const newTag = await p.evaluate(() => EL.bench.ed.c.plant.units.slice(-1)[0].tag);
  const pc = await p.evaluate(() => EL.bench.ed.c.plant.pipes.length);
  const a = await portScr('T1.out2'), c = await portScr(newTag + '.a');
  console.log('     ports on screen', JSON.stringify(a), JSON.stringify(c));
  await p.touchscreen.tap(a.x, a.y); await sleep(200); await p.touchscreen.tap(c.x, c.y); await sleep(300);
  ok((await p.evaluate(() => EL.bench.ed.c.plant.pipes.length)) === pc + 1, 'phone: tap port -> tap port lays a pipe');
  // tap a unit -> select, then Part dock shows inspector
  await p.evaluate(() => EL.ui.plant.select(null, null));
  const v1 = await p.evaluate(() => { const PU = EL.ui.plant, u = EL.bench.ed.c.plant.units.find((x) => x.tag === 'V1'), d = EL.plant.defs[u.type], r = document.querySelector('#plantHost svg').getBoundingClientRect(); return { x: r.left + PU.view.x + (u.x + d.w / 2) * PU.view.k, y: r.top + PU.view.y + (u.y + d.h / 2) * PU.view.k }; });
  await p.touchscreen.tap(v1.x, v1.y); await sleep(250);
  ok(!!(await p.evaluate(() => EL.ui.plant.sel)), 'phone: tap unit selects it');
  const del = await rect('#plantHost .pl-del'); ok(del && del.vis && inVP(del), 'phone: toolbar Delete visible when selected', JSON.stringify(del));
  await tap('#dock button:nth-child(2)');
  ok(/Manual valve|V1/.test(await p.evaluate(() => document.querySelector('#pane-part').textContent)), 'phone: Part sheet shows unit inspector');
  await Q.shot(p, 'm_plant_inspector');
  await tap('#dock button:nth-child(2)');
  // + Add menu modal fits
  await tap('#plantHost .pl-tools .btn.pri');
  const mb = await rect('.modal .box'); ok(mb && mb.l >= 0 && mb.r <= 390, 'phone: + Add menu fits the width', JSON.stringify(mb));
  await Q.shot(p, 'm_addmenu');
  await Q.closeModals(p);
  // Ladder
  await tap('#tabs .tab[data-v=prog]'); await sleep(400);
  ok((await p.evaluate(() => EL.ui.view())) === 'prog', 'phone: Programming tab');
  await Q.shot(p, 'm_ladder');
  const lb = await p.evaluate(() => [...document.querySelectorAll('#ladHost .ld-bar > *')].map((e) => { const r = e.getBoundingClientRect(); return (e.textContent || e.tagName).slice(0, 14) + ':' + Math.round(r.left) + '-' + Math.round(r.right) + '/' + Math.round(r.top); }));
  console.log('     ladder bar', lb.join(' | '));
  const barR = await rect('#ladHost .ld-bar'); ok(barR && barR.r <= 391, 'ladder bar within width', JSON.stringify(barR));
  const barOff = await p.evaluate(() => { const host = document.querySelector('#ladHost').getBoundingClientRect(); return [...document.querySelectorAll('#ladHost .ld-bar button')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > host.right + 1 || r.left < host.left - 1; }).map((e) => e.textContent); });
  ok(!barOff.length, 'all ladder bar buttons reachable without scrolling (else need to scroll the bar)', barOff.join(','));
  // tap a contact twice -> edit dialog
  await p.evaluate(() => { const el = document.querySelector('#ladHost .ld-net[data-n="1"] [data-k="1"] .ld-hit'); el.scrollIntoView({ block: 'center', inline: 'center' }); }); await sleep(300);
  const cxy = await p.evaluate(() => { const r = document.querySelector('#ladHost .ld-net[data-n="1"] [data-k="1"] .ld-hit').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.touchscreen.tap(cxy.x, cxy.y); await sleep(300);
  ok(!!(await p.evaluate(() => EL.ui.ladder.sel && EL.ui.ladder.sel.key)), 'phone: tap contact selects it');
  const sb = await rect('#ladHost .ld-selbar'); const dk = await rect('#dock');
  ok(sb && inVP(sb) && (!dk || !dk.vis || !dk.w || sb.b <= dk.t + 1), 'phone: selection bar on screen and above the dock', JSON.stringify(sb) + ' dock ' + JSON.stringify(dk));
  const sbOff = await p.evaluate(() => [...document.querySelectorAll('#ladHost .ld-selbar button')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > 391 || r.left < -1 || r.width === 0; }).map((e) => e.textContent));
  ok(!sbOff.length, 'phone: all selection-bar buttons on screen', sbOff.join(','));
  await Q.shot(p, 'm_ladder_sel');
  const c2 = await p.evaluate(() => { const r = document.querySelector('#ladHost .ld-net[data-n="1"] [data-k="1"] .ld-hit').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.touchscreen.tap(c2.x, c2.y); await sleep(300);
  ok((await Q.modalCount(p)) === 1, 'phone: second tap opens edit dialog');
  const md = await rect('.modal .box'); ok(md && md.l >= 0 && md.r <= 390 && md.b <= 845, 'phone: edit dialog fits screen', JSON.stringify(md));
  await Q.shot(p, 'm_ladder_dialog');
  await Q.closeModals(p);
  // ladder instruction picker on the phone (Programming tab has its own buttons instead of the dock)
  await tap('.ld-mob'); await sleep(300);
  ok((await p.$$eval('.modal .pit', (a) => a.length)) === 18, 'phone: instruction picker shows 18 instructions');
  const it0 = await p.$('.modal .pit >> nth=0'); const ib = await it0.boundingBox(); await p.touchscreen.tap(ib.x + ib.width / 2, ib.y + ib.height / 2); await sleep(300);
  ok((await Q.modalCount(p)) <= 1, 'phone: tap NO in the picker -> picker closes');
  await Q.closeModals(p);
  const e0c = errs.length;
  const chk = await p.evaluateHandle(() => [...document.querySelectorAll('#ladHost .ld-bar button')].find((b) => /Check/.test(b.textContent)));
  const ck = chk.asElement() ? await chk.asElement().boundingBox() : null;
  if (ck) { await p.touchscreen.tap(ck.x + ck.width / 2, ck.y + ck.height / 2); await sleep(300); ok(errs.length === e0c, 'phone: Check program runs without errors'); }
  else ok(false, 'phone: Check program button reachable', JSON.stringify(ck));
  await Q.closeModals(p);
  await Q.shot(p, 'm_ladder_check');
  // close side, watch table M toggle by tap
  hs = await hscroll(); ok(hs[0] <= 390, 'Ladder: no horizontal page scroll ' + hs);
  Q.summary(errs);
  await b.close(); process.exit(Q.fails ? 1 : 0);
})();
