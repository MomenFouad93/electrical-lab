/* QA area 4: Ladder view on the tank project. */
const Q = require('./qa_lib.js');
const { ok, sleep } = Q;
(async () => {
  const { b, p, errs } = await Q.start();
  const lastLog = () => p.evaluate(() => (EL.ui.logs.slice(-1)[0] || {}).m || '');
  const W = () => p.evaluate(() => JSON.parse(JSON.stringify(EL.ui.ladder.work)));
  const pill = () => p.$eval('#ladHost .ld-bar .pill', (e) => e.textContent);
  const barBtn = (re) => p.evaluateHandle((re) => [...document.querySelectorAll('#ladHost .ld-bar button')].find((b) => new RegExp(re).test(b.textContent)), re);
  const clickBar = async (re) => { const h = await barBtn(re); const el = h.asElement(); if (!el) { ok(false, 'bar button ' + re + ' exists'); return; } await el.click(); await sleep(250); };
  const bit = (a) => p.evaluate((a) => { const pl = EL.bench.ed.c.parts.find((x) => x.tag === 'KF1'); return EL.ladder.mem(pl.state, 6).bit(a); }, a);
  const netCount = () => p.$$eval('#ladHost .ld-net', (a) => a.length);
  const clickItem = async (ni, sel, keep) => { if (!keep) await p.evaluate(() => { EL.ui.ladder.sel = null; EL.ui.ladder.render(); }); await p.evaluate(([ni, sel]) => { const el = document.querySelector(`#ladHost .ld-net[data-n="${ni}"] ${sel} .ld-hit`); el.scrollIntoView({ block: 'center' }); }, [ni, sel]); await sleep(150); const bx = await p.evaluate(([ni, sel]) => { const r = document.querySelector(`#ladHost .ld-net[data-n="${ni}"] ${sel} .ld-hit`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, [ni, sel]); await p.mouse.click(bx.x, bx.y); await sleep(200); };
  const done = async () => { await p.click('.modal .btn.pri >> text=Done'); await sleep(200); };

  await p.click('#tabs .tab[data-v=projects]'); await sleep(200);
  await p.click('#projRoot .pj-card >> nth=0 >> button >> text=Open the program'); await sleep(1500);
  ok(await p.isVisible('#ladHost'), 'ladder host visible');
  const N0 = await netCount(); const X = N0; ok(N0 >= 6, 'tank ladder shows ' + N0 + ' networks');
  ok((await pill()) === 'ONLINE', 'pill shows ONLINE', await pill());
  await Q.shot(p, 'ld_tank_online');
  // palette content
  const pal = await p.$$eval('#gplist .pit span', (a) => a.map((x) => x.textContent));
  ok(pal.length === 18, 'ladder palette has 18 instructions', pal.join(','));
  // side pane
  ok(await p.evaluate(() => !!document.querySelector('#gpane #ldWatch') && /KF1/.test(document.querySelector('#gpane').textContent)), 'Part pane shows PLC + watch table');
  // Why is it OFF (pump not running at start, level 30% -> net 3 Q0.0 off because M0.0 off)
  await sleep(500);
  const why = await p.$$eval('#ladHost .ld-why', (a) => a.map((x) => x.textContent).filter(Boolean));
  ok(why.length > 0 && /Why is it OFF/.test(why[0]), 'Why is it OFF? text on an off rung', why.join(' || ').slice(0, 300));
  console.log('     why:', why[0] && why[0].slice(0, 200));
  // + Network
  await clickBar('Network');
  ok((await netCount()) === N0 + 1 && /NOT DOWNLOADED/.test(await pill()), '+ Network adds network 7, pill NOT DOWNLOADED');
  ok(await p.evaluate(() => !!document.querySelector('#ladHost .ld-note')), '"Edited offline" note shows');
  // Download
  await clickBar('Download');
  ok((await pill()) === 'ONLINE' && (await p.evaluate(() => JSON.parse(EL.bench.ed.c.parts.find((x) => x.tag === 'KF1').props.lad).nets.length)) === N0 + 1, 'Download to PLC: ONLINE, N0+1 nets in PLC');
  console.log('     download toast:', await lastLog());
  // Check program
  await clickBar('Check program');
  ok(/Check/.test(await lastLog()) && (await p.evaluate(() => /Program check/.test(document.querySelector('#gpane').textContent))), 'Check program: toast + Program check card', await lastLog());
  const iss = await p.$$('#gpane .pl-prob');
  if (iss.length) { await iss[0].click(); await sleep(300); ok(true, 'check finding is clickable (' + iss.length + ')'); }
  // RUN/STOP
  await clickBar('RUN → STOP');
  ok((await pill()) === 'STOP' && !(await p.evaluate(() => EL.bench.ed.c.parts.find((x) => x.tag === 'KF1').state.run)), 'RUN → STOP stops the PLC', await pill());
  await clickBar('STOP → RUN');
  await sleep(300);
  ok((await pill()) === 'ONLINE', 'STOP → RUN back online', await pill());
  // Symbols dialog
  await clickBar('Symbols');
  ok((await Q.modalCount(p)) === 1, 'Symbols dialog opens');
  const nIn = await p.$$eval('.modal .ld-symtab input', (a) => a.length);
  await p.fill('.modal .ld-symtab >> nth=0 >> input >> nth=0', 'Start button');
  const last2 = await p.$$('.modal .ld-symtab >> nth=1 >> input');
  await last2[0].fill('ZZ9'); await last2[1].fill('Bad');
  await done();
  ok((await Q.modalCount(p)) === 1 && /valid address/.test(await lastLog()), 'Symbols: invalid new address refused, dialog stays', await lastLog());
  await last2[0].fill('i0.5'); await last2[1].fill('Spare <b>in</b>');
  await done();
  let w = await W();
  ok((await Q.modalCount(p)) === 0 && w.sym['I0.5'] === 'Spare bin/b' && Object.values(w.sym).includes('Start button'), 'Symbols edit + add saved: ' + JSON.stringify(w.sym).slice(0, 200), nIn);
  // net ops on net 7 (index 6)
  const opBtn = async (ni, op) => { await p.click(`#ladHost .ld-net[data-n="${ni}"] [data-op="${op}"]`); await sleep(200); };
  w = await W(); const n6 = JSON.stringify(w.nets[X]), n5 = JSON.stringify(w.nets[X - 1]);
  await opBtn(X, 'up'); w = await W();
  ok(JSON.stringify(w.nets[X - 1]) === n6 && JSON.stringify(w.nets[X]) === n5, 'network ↑ moves it up');
  await opBtn(X - 1, 'down'); w = await W();
  ok(JSON.stringify(w.nets[X]) === n6, 'network ↓ moves it down');
  await opBtn(X, 'dup'); w = await W();
  ok(w.nets.length === N0 + 2 && JSON.stringify(w.nets[X + 1]) === n6, 'network ⧉ duplicates');
  await opBtn(X + 1, 'del'); w = await W();
  ok(w.nets.length === N0 + 1, 'network ✕ deletes (confirm accepted)');
  await opBtn(0, 'up'); ok((await W()).nets.length === N0 + 1, '↑ on first network is harmless');
  await p.click(`#ladHost .ld-net[data-n="${X}"] .ld-cmt`); await sleep(200);
  ok((await Q.modalCount(p)) === 1, 'comment click opens dialog');
  await p.fill('.modal input', 'My <test> comment'); await done();
  w = await W();
  ok(w.nets[X].c === 'My test comment' && (await p.$eval(`#ladHost .ld-net[data-n="${X}"] .ld-cmt`, (e) => e.textContent)) === 'My test comment', 'comment saved and shown: ' + w.nets[X].c);
  // select contact on net 6 (NO I0.0) and selbar buttons
  await clickItem(X, '[data-k="0"]');
  const sb = await p.$$eval('#ladHost .ld-selbar button', (a) => a.map((x) => x.textContent));
  ok(sb.length === 7, 'selection bar for contact: ' + sb.join(' | '));
  await p.click('#ladHost .ld-selbar button >> text=Edit'); await sleep(200);
  ok((await Q.modalCount(p)) === 1, 'selbar Edit opens contact dialog');
  // change to NC via seg button, Done
  await p.click('.modal .seg .btn[data-t=NC]'); await sleep(100); await done();
  w = await W(); ok(w.nets[X].s[0].t === 'NC', 'contact dialog: switch to NC saved');
  // invalid address in contact dialog
  await clickItem(X, '[data-k="0"]'); await p.click('#ladHost .ld-selbar button >> text=Edit'); await sleep(200);
  await p.fill('.modal input >> nth=0', 'X9.9'); await done();
  let errTxt = await p.$eval('.modal .ld-err', (e) => e.textContent).catch(() => '');
  ok((await Q.modalCount(p)) === 1 && errTxt.length > 0, 'invalid contact address X9.9 shows error, not saved: ' + errTxt);
  await p.fill('.modal input >> nth=0', 'I0.9'); await done();
  errTxt = await p.$eval('.modal .ld-err', (e) => e.textContent).catch(() => '');
  ok((await Q.modalCount(p)) === 1 && errTxt.length > 0, 'out-of-range contact address I0.9 shows error: ' + errTxt);
  await p.fill('.modal input >> nth=0', 'Start button'); await done();
  w = await W(); ok((await Q.modalCount(p)) === 0 && w.nets[X].s[0].a === 'I0.0', 'symbol name "Start button" resolves to I0.0: ' + w.nets[X].s[0].a);
  // + Contact after
  await clickItem(X, '[data-k="0"]'); await p.click('#ladHost .ld-selbar button >> text=Contact after'); await sleep(200);
  ok((await Q.modalCount(p)) === 1, '+ Contact after opens dialog for the new contact'); await done();
  w = await W(); ok(w.nets[X].s.length === 2, '+ Contact after adds 2nd contact');
  // ← →
  const s0 = JSON.stringify(w.nets[X].s);
  await clickItem(X, '[data-k="1"]'); await p.click('#ladHost .ld-selbar button >> text=←'); await sleep(200);
  w = await W(); ok(JSON.stringify(w.nets[X].s) === JSON.stringify([JSON.parse(s0)[1], JSON.parse(s0)[0]]) && (await p.evaluate(() => EL.ui.ladder.sel.key)) === '0', '← swaps left, selection follows');
  await p.click('#ladHost .ld-selbar button >> text=→'); await sleep(200);
  w = await W(); ok(JSON.stringify(w.nets[X].s) === s0, '→ swaps back');
  // Parallel branch
  await clickItem(X, '[data-k="0"]'); await p.click('#ladHost .ld-selbar button >> text=Parallel branch'); await sleep(200);
  ok((await Q.modalCount(p)) === 1, 'Parallel branch opens dialog for the new branch contact');
  const addPath = await p.$('.modal button >> text=Add a path to this parallel block');
  ok(!!addPath, 'branch dialog has "Add a path" button');
  if (addPath) { await addPath.click(); await sleep(200); }
  w = await W(); ok(w.nets[X].s[0].t === 'PAR' && w.nets[X].s[0].br.length === 3, 'Parallel branch creates PAR, Add a path makes 3 branches: ' + JSON.stringify(w.nets[X].s[0]).slice(0, 120));
  // select nested contact and delete it
  await clickItem(X, '[data-k="0/2:0"]');
  await p.click('#ladHost .ld-selbar button >> text=Delete'); await sleep(200);
  w = await W(); ok(w.nets[X].s[0].t === 'PAR' && w.nets[X].s[0].br.length === 2, 'Delete nested branch contact');
  // + Output
  await clickItem(X, '[data-k="0/0:0"]'); await p.click('#ladHost .ld-selbar button >> text=Output'); await sleep(200);
  ok((await Q.modalCount(p)) === 1, '+ Output opens output dialog'); await done();
  w = await W(); ok(w.nets[X].o.length === 2, '+ Output adds a coil (' + JSON.stringify(w.nets[X].o) + ')');
  // select output, double click edit, invalid address
  await clickItem(X, '[data-o="1"]'); await clickItem(X, '[data-o="1"]', true);
  ok((await Q.modalCount(p)) === 1, 'tap selected output again opens edit');
  await p.fill('.modal input >> nth=0', 'Q0.9'); await done();
  errTxt = await p.$eval('.modal .ld-err', (e) => e.textContent).catch(() => '');
  ok((await Q.modalCount(p)) === 1 && errTxt.length > 0, 'invalid coil Q0.9 shows error: ' + errTxt);
  await p.click('.modal .btn.bad >> text=Delete'); await sleep(200);
  w = await W(); ok((await Q.modalCount(p)) === 0 && w.nets[X].o.length === 1, 'Delete in output dialog removes output');
  // palette: every instruction
  const insts = await p.evaluate(() => EL.ladder.CONTACTS.concat(EL.ladder.OUTS));
  const fails = [];
  for (let i = 0; i < insts.length; i++) {
    const t = insts[i];
    await p.evaluate((X) => { EL.ui.ladder.sel = { ni: X }; }, X);
    const before = await W();
    await (await p.$$('#gplist .pit'))[i].click(); await sleep(200);
    if ((await Q.modalCount(p)) !== 1) { fails.push(t + ': no dialog'); await Q.closeModals(p); continue; }
    await done();
    if ((await Q.modalCount(p)) !== 0) { fails.push(t + ': Done refused: ' + (await p.$eval('.modal .ld-err', (e) => e.textContent).catch(() => '?'))); await Q.closeModals(p); continue; }
    const after = await W();
    const isC = i < 5;
    const arr = isC ? after.nets[X].s : after.nets[X].o, arr0 = isC ? before.nets[X].s : before.nets[X].o;
    if (arr.length !== arr0.length + 1 || arr[arr.length - 1].t !== t) fails.push(t + ': not inserted ' + JSON.stringify(arr[arr.length - 1]));
    if (!isC && after.nets[X].o.length >= 6) { await p.evaluate((X) => { EL.ui.ladder.work.nets[X].o.splice(1); }, X); }
  }
  ok(!fails.length, 'every palette instruction inserts and its dialog saves (' + insts.length + ')', fails.join('; '));
  await Q.shot(p, 'ld_after_palette');
  // edit dialogs per output type: invalid fields
  const invalid = [];
  const tryOut = async (t, fill, label) => {
    await p.evaluate(([t, X]) => { const n = EL.ui.ladder.work.nets[X]; n.o = [{ t: 'COIL', a: 'M1.0' }]; EL.ui.ladder.sel = { ni: X, oi: 0 }; EL.ui.ladder.render(); }, [t, X]);
    await p.click('#ladHost .ld-selbar button >> text=Edit'); await sleep(150);
    await p.selectOption('.modal select >> nth=0', t); await sleep(100);
    await fill(); await done();
    const still = (await Q.modalCount(p)) === 1; const e = still ? await p.$eval('.modal .ld-err', (x) => x.textContent) : '';
    if (!still || !e) invalid.push(label + ' (saved: ' + JSON.stringify((await W()).nets[X].o[0]) + ')');
    else console.log('      ok error for', label, '->', e);
    await Q.closeModals(p);
  };
  await tryOut('TON', async () => { await p.fill('.modal input[type=text] >> nth=0', 'T99'); }, 'TON T99');
  await tryOut('CTU', async () => { await p.fill('.modal input[type=text] >> nth=0', 'C99'); }, 'CTU C99');
  await tryOut('MOVE', async () => { await p.fill('.modal input[type=text] >> nth=1', 'I0.0'); }, 'MOVE out=I0.0 (bit as word)');
  await tryOut('ADD', async () => { await p.fill('.modal input[type=text] >> nth=2', '5'); }, 'ADD out=5 (constant out)');
  await tryOut('SCALE', async () => { await p.fill('.modal input[type=text] >> nth=0', 'QQ'); }, 'SCALE in=QQ');
  await tryOut('SET', async () => { await p.fill('.modal input[type=text] >> nth=0', 'I0.0'); }, 'SET I0.0 (input as output)');
  ok(!invalid.length, 'invalid output fields show an error instead of saving', invalid.join('; '));
  await p.evaluate((X) => { EL.ui.ladder.work.nets.splice(X); EL.ui.ladder.sel = null; EL.ui.ladder.render(); }, X);
  // program actually runs after download: NO I0.0 -> COIL Q0.3 (Q0.3 also = alarm in net 6 → put ours last)
  await clickBar('Network'); await sleep(200);
  await Q.closeModals(p);
  w = await W();
  const ni = w.nets.length - 1;
  await p.evaluate((ni) => { EL.ui.ladder.sel = { ni, oi: 0 }; EL.ui.ladder.render(); }, ni);
  await p.click('#ladHost .ld-selbar button >> text=Edit'); await sleep(150);
  await p.fill('.modal input[type=text] >> nth=0', 'Q0.3'); await done();
  w = await W(); console.log('     new net', JSON.stringify(w.nets[ni]));
  await clickBar('Download'); await sleep(600);
  const q3a = await bit('Q0.3');
  // press S1 physically on the panel
  await p.evaluate(() => { EL.ui.show('bench'); EL.bench.setView('panel'); }); await sleep(400);
  const xy = await p.evaluate(() => { const ed = EL.bench.ed; const q = ed.c.parts.find((x) => x.tag === 'S1'); const d = EL.defs[q.type]; const r = ed.svg.getBoundingClientRect(); return { x: r.left + ed.view.x + (q.x + d.w / 2) * ed.view.k, y: r.top + ed.view.y + (q.y + d.h / 2) * ed.view.k }; });
  await p.mouse.move(xy.x, xy.y); await p.mouse.down(); await sleep(500);
  const q3b = await bit('Q0.3'); const i0 = await bit('I0.0');
  await p.mouse.up(); await sleep(500);
  const q3c = await bit('Q0.3');
  ok(!q3a && i0 && q3b && !q3c, `program runs after Download: Q0.3 ${+q3a} -> pressed ${+q3b} (I0.0=${+i0}) -> released ${+q3c}`);
  // pump started? (net 3 latches)
  await sleep(1500);
  const km = await p.evaluate(() => ['KM1', 'KM2', 'KM3'].map((t) => EL.bench.ed.c.parts.find((x) => x.tag === t).state.closed));
  console.log('     KM1/KM2/KM3 after S1:', km);
  // watch table M bit toggle
  await p.evaluate(() => EL.ui.show('prog')); await sleep(500);
  const rows = await p.$$eval('#ldWatch .ld-wrow', (a) => a.map((x) => x.dataset.a + (x.classList.contains('tog') ? '*' : '')));
  ok(rows.length > 5, 'watch table rows: ' + rows.join(' '));
  // stop the plant first via RUN->STOP? No: toggle M0.0 (Automatic) while running
  const m0 = await bit('M0.0');
  const rowXY = (a) => p.evaluate((a) => { const e = document.querySelector(`#ldWatch .ld-wrow[data-a="${a}"]`); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, a);
  let rr = await rowXY('M0.0'); await p.mouse.click(rr.x, rr.y); await sleep(150);
  const m1 = await bit('M0.0');
  ok(!!m1 === !m0, `watch table tap toggles M0.0 (${m0} -> ${m1})`);
  await sleep(400);
  const m2 = await bit('M0.0');
  console.log('     M0.0 after 400 ms scan (latched by program may rewrite):', m2);
  // toggling a non-M row does nothing
  const qv = await bit('Q0.0'); rr = await rowXY('Q0.0'); await p.mouse.click(rr.x, rr.y); await sleep(100);
  ok((await bit('Q0.0')) === qv, 'tapping a Q row does not force it');
  // keyboard: Delete key in ladder view should not delete panel parts
  const pc = await p.evaluate(() => EL.bench.ed.c.parts.length);
  await p.keyboard.press('Delete'); await sleep(100);
  ok((await p.evaluate(() => EL.bench.ed.c.parts.length)) === pc, 'Delete key in Ladder view does not delete panel parts');
  await Q.shot(p, 'ld_final');
  Q.summary(errs);
  await b.close(); process.exit(Q.fails ? 1 : 0);
})();
