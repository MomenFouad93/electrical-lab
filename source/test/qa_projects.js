/* QA area 1: Projects tab, every button. */
const Q = require('./qa_lib.js');
const fs = require('fs');
const { ok, sleep } = Q;
(async () => {
  const { b, p, errs } = await Q.start();
  const lastLog = () => p.evaluate(() => (EL.ui.logs.slice(-1)[0] || {}).m || '');
  const goProj = async () => { await p.click('#tabs .tab[data-v=projects]'); await sleep(300); };
  const cur = () => p.evaluate(() => ({ view: EL.ui.view(), bview: EL.bench.view, mode: EL.bench.ed.mode, parts: EL.bench.ed.c.parts.length, units: (EL.bench.ed.c.plant || { units: [] }).units.length, proj: EL.bench.ed.c.proj && EL.bench.ed.c.proj.id, name: JSON.stringify(EL.bench.ed.c.name || '') }));
  await goProj();
  ok(await p.isVisible('#projRoot .pj-hero'), 'Projects tab renders hero');
  const cards = await p.$$eval('#projRoot .pj-card', (a) => a.map((c) => ({ h: c.querySelector('h3').textContent, btns: [...c.querySelectorAll('button')].map((x) => x.textContent), thumb: !!c.querySelector('.pj-thumb svg') })));
  ok(cards.length === await p.evaluate(() => EL.projects.list.length), 'all ready project cards', JSON.stringify(cards));
  ok(cards.every((c) => c.thumb), 'every card has a plant thumbnail', JSON.stringify(cards.map((c) => c.thumb)));
  await Q.shot(p, 'p1_projects');
  // every card button
  for (let ci = 0; ci < cards.length; ci++) {
    for (let bi = 0; bi < cards[ci].btns.length; bi++) {
      await goProj();
      // What to try details
      const det = (await p.$$('#projRoot .pj-card details'))[ci];
      await (await det.$('summary')).click(); await sleep(100);
      const open = await det.evaluate((d) => d.open && d.querySelectorAll('li').length);
      ok(open > 0, `card ${ci} "What to try" opens (${open} tasks)`);
      const btn = (await (await p.$$('#projRoot .pj-card'))[ci].$$('button'))[bi];
      const label = await btn.textContent();
      await btn.click(); await sleep(900);
      const s = await cur();
      const P = await p.evaluate((ci) => { const id = EL.projects.list[ci]; const P = EL.projects.map[id]; return { view: P.view || 'plant', circuit: !!P.circuit }; }, ci);
      const want = /program/i.test(label) ? 'prog' : /panel/i.test(label) ? 'panel' : P.view;
      ok((want === 'prog' ? s.view === 'prog' : s.view === 'bench' && s.bview === want) && s.mode === 'test' && (s.parts > 0 || !P.circuit), `card ${ci} [${label}] -> ${want}/test`, JSON.stringify(s));
      if (want === 'ladder') ok(await p.evaluate(() => document.querySelectorAll('#ladHost .ld-net').length > 0), `card ${ci} ladder shows networks`);
      if (want === 'plant') ok(await p.evaluate(() => document.querySelectorAll('#plantHost [data-u]').length > 0 && getComputedStyle(document.querySelector('#plantHost')).display !== 'none'), `card ${ci} plant shows units`);
      if (want === 'panel') ok(await p.evaluate(() => getComputedStyle(document.querySelector('#benchHost')).display !== 'none'), `card ${ci} panel host visible`);
    }
  }
  await Q.shot(p, 'p1_after_cards');
  // Start an empty project
  await goProj();
  await p.click('#projRoot .pj-hero .btn.pri'); await sleep(700);
  let s = await cur();
  ok(s.view === 'bench' && s.bview === 'plant' && s.mode === 'build' && s.parts === 0 && s.units === 0, 'Start an empty project -> empty plant in build', JSON.stringify(s));
  ok(await p.isVisible('#plEmpty'), 'empty plant shows the "No process yet" card');
  // the plEmpty buttons
  await p.click('#plEmpty .btn.pri'); await sleep(300);
  ok(await Q.modalCount(p) === 1, 'plEmpty "+ Add a unit" opens the add menu');
  await Q.closeModals(p);
  await p.click('#plEmpty .btn:not(.pri)'); await sleep(300);
  ok(await p.evaluate(() => EL.ui.view()) === 'projects', 'plEmpty "Open a ready project" goes to Projects');
  // Go to the bench
  await p.click('#projRoot .pj-hero .btn:not(.pri)'); await sleep(500);
  s = await cur();
  ok(s.view === 'bench' && s.bview === 'plant', 'Go to the bench -> bench plant view', JSON.stringify(s));
  // open tank then Save bench as project (no name)
  await p.evaluate(() => EL.projects.open('tank', 'plant')); await sleep(500);
  await goProj();
  await p.click('#projRoot .card .btn.pri >> text=Save the bench as a project'); await sleep(300);
  let list = await p.evaluate(() => JSON.parse(localStorage.getItem('ellab.projects') || '[]').map((x) => x.name));
  ok(list.length === 1, 'Save without name saves 1 project: ' + JSON.stringify(list));
  ok(await p.$$eval('#projRoot .pj-row', (a) => a.length) === 1, 'my-projects list shows row');
  // with a name, hostile
  await p.fill('#projRoot input[type=text]', 'Tank <b>"copy"</b> & co');
  await p.click('#projRoot .card .btn.pri >> text=Save the bench as a project'); await sleep(300);
  list = await p.evaluate(() => JSON.parse(localStorage.getItem('ellab.projects') || '[]').map((x) => x.name));
  ok(list.length === 2 && list.includes('Tank bcopy/b  co'), 'Save with name (markup stripped): ' + JSON.stringify(list));
  // same name overwrites
  await p.fill('#projRoot input[type=text]', 'Tank <b>"copy"</b> & co');
  await p.click('#projRoot .card .btn.pri >> text=Save the bench as a project'); await sleep(300);
  list = await p.evaluate(() => JSON.parse(localStorage.getItem('ellab.projects') || '[]').map((x) => x.name));
  ok(list.length === 2, 'same name overwrites, still 2');
  // Download
  const rows = await p.$$('#projRoot .pj-row');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 4000 }).catch(() => null), (await rows[0].$('button >> text=Download')).click()]);
  let dlPath = null;
  if (dl) { dlPath = Q.SHOT + 'dl_' + dl.suggestedFilename(); await dl.saveAs(dlPath); }
  ok(dl && fs.statSync(dlPath).size > 1000, 'Download gives a file: ' + (dl && dl.suggestedFilename()));
  // Open from list: change bench first
  await p.evaluate(() => EL.projects.open('booster', 'panel')); await sleep(400);
  await goProj();
  await (await (await p.$$('#projRoot .pj-row'))[0].$('button >> text=Open')).click(); await sleep(700);
  s = await cur();
  ok(s.view === 'bench' && s.parts > 10 && s.bview === 'plant', 'my project Open -> bench with saved tank', JSON.stringify(s));
  ok(await p.evaluate(() => EL.bench.ed.c.parts.some((x) => x.tag === 'KF1') && EL.bench.ed.c.plant.units.length > 3), 'opened project has PLC and plant');
  // Delete
  await goProj();
  await (await (await p.$$('#projRoot .pj-row'))[0].$('button >> text=Delete')).click(); await sleep(300);
  list = await p.evaluate(() => JSON.parse(localStorage.getItem('ellab.projects') || '[]').map((x) => x.name));
  ok(list.length === 1, 'Delete removes one: ' + JSON.stringify(list));
  ok(await p.$$eval('#projRoot .pj-row', (a) => a.length) === 1, 'list re-rendered after delete');
  // Open a project file: valid
  await p.evaluate(() => EL.projects.open('booster', 'panel')); await sleep(300);
  await goProj();
  await p.setInputFiles('#projRoot input[type=file]', dlPath); await sleep(900);
  s = await cur();
  ok(s.view === 'bench' && s.parts > 10 && s.units > 3, 'Open a project file (valid downloaded file) loads it', JSON.stringify(s));
  // same file again (input value not reset?)
  await p.evaluate(() => EL.projects.open('booster', 'panel')); await sleep(300);
  await goProj();
  await p.evaluate(() => { const i = document.querySelector('#projRoot input[type=file]'); i.__v = i.value; });
  await p.setInputFiles('#projRoot input[type=file]', dlPath); await sleep(900);
  s = await cur();
  ok(s.view === 'bench' && s.units > 3 && s.parts > 10 && !(await p.evaluate(() => EL.bench.ed.c.parts.some((x) => x.tag === 'U1'))), 'Open the same file a second time also loads it', JSON.stringify(s));
  // garbage
  const mk = (n, t) => { const f = Q.SHOT + n; fs.writeFileSync(f, t); return f; };
  for (const [n, t, desc] of [
    ['garbage.json', 'this is not json {{{', 'garbage text'],
    ['empty.json', '', 'empty file'],
    ['arr.json', '[1,2,3]', 'JSON array'],
    ['num.json', '42', 'JSON number'],
    ['nullparts.json', '{"v":1,"parts":null,"wires":"x","plant":{"units":"no","pipes":5}}', 'wrong-typed fields'],
    ['proto.json', '{"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":2}},"v":1,"parts":[],"wires":[]}', 'prototype pollution'],
    ['badtype.json', JSON.stringify({ v: 1, parts: [{ id: 'X', type: 'NOPE', x: 'a', y: null, tag: 'X' }, { id: 'L', type: 'LAMP', x: 1e308, y: -1e308, tag: 'L', props: { volt: 'zzz' } }], wires: [{ a: 'X.1', b: 'Q.9' }], plant: { units: [{ id: 'U', type: 'BAD' }, { id: 'T', type: 'TANK', x: 'NaN', y: 1, props: { vol: -5, sw: 'x' } }], pipes: [{ a: 'U.a', b: 'T.out1' }] } }), 'unknown types and NaN'],
  ]) {
    await p.evaluate(() => EL.projects.open('booster', 'panel')); await sleep(300);
    await goProj(); await Q.clearToasts(p);
    const before = await p.evaluate(() => EL.bench.ed.c.parts.length);
    const e0 = errs.length;
    await p.setInputFiles('#projRoot input[type=file]', mk(n, t)); await sleep(800);
    const st = await cur(); const lg = await lastLog();
    const polluted = await p.evaluate(() => ({}).polluted);
    ok(!polluted, `${desc}: no prototype pollution`);
    ok(errs.length === e0, `${desc}: no page error`, errs.slice(e0).join(' | '));
    console.log('     ', desc, '->', JSON.stringify(st), 'toast:', lg);
    if (['garbage text', 'empty file', 'JSON array', 'JSON number'].includes(desc)) ok(/not a lab project/i.test(lg) && st.view === 'projects' && st.parts === before, `${desc}: rejected with toast, bench unchanged`, lg + ' ' + JSON.stringify(st));
    if (st.view === 'bench') { await sleep(600); await p.evaluate(() => EL.bench.setView('plant')); await sleep(400); await p.evaluate(() => EL.bench.setView('ladder')); await sleep(300); ok(errs.length === e0, `${desc}: plant + ladder render after load`, errs.slice(e0).join(' | ')); await Q.shot(p, 'p1_load_' + n.replace('.json', '')); }
  }
  // oversized
  await goProj(); await Q.clearToasts(p);
  const big = Q.SHOT + 'big.json'; fs.writeFileSync(big, '{"v":1,"pad":"' + 'x'.repeat(3.2 * 1024 * 1024) + '"}');
  await p.setInputFiles('#projRoot input[type=file]', big); await sleep(600);
  ok(/too large/i.test(await lastLog()) && (await p.evaluate(() => EL.ui.view())) === 'projects', 'oversized file (3.2 MB) rejected with toast', await lastLog());
  // hostile with markup -> XSS
  const evil = Q.SHOT + 'evil.json';
  fs.writeFileSync(evil, JSON.stringify({ v: 1, name: '<img src=x onerror="window.__xss=1">', parts: [{ id: 'P1', type: 'PLC24R', x: 0, y: 0, tag: '<svg onload="window.__xss=2">', props: { mode: 'ladder', lad: JSON.stringify({ v: 1, sym: { 'I0.0': '<img src=x onerror=window.__xss=5>' }, nets: [{ c: '<img src=x onerror=window.__xss=6>', s: [{ t: 'NO', a: '<b>' }], o: [{ t: 'COIL', a: 'Q0.0' }] }] }) } }], wires: [], plant: { units: [{ id: 'U1', type: 'TANK', x: 0, y: 0, tag: '"><img src=x onerror=window.__xss=4>', props: { lt: '<img src=x onerror=window.__xss=7>', sw: [{ n: '<b onmouseover=x>', l: 50, t: '<img src=x onerror=window.__xss=8>' }] } }], pipes: [] } }));
  await p.setInputFiles('#projRoot input[type=file]', evil); await sleep(800);
  await p.evaluate(() => EL.bench.setView('plant')); await sleep(400);
  await p.evaluate(() => { const u = document.querySelector('#plantHost [data-u]'); if (u) EL.ui.plant.select(u.dataset.u, null); }); await sleep(300);
  await p.evaluate(() => EL.bench.setView('ladder')); await sleep(400);
  await p.evaluate(() => EL.bench.setView('panel')); await sleep(300);
  await goProj(); await sleep(200);
  ok(!(await p.evaluate(() => window.__xss)), 'hostile project: no script ran in plant/ladder/projects');
  ok(!(await p.evaluate(() => document.querySelector('img[src=x], [onerror], [onload]'))), 'hostile project: no injected elements');
  Q.summary(errs);
  await b.close(); process.exit(Q.fails ? 1 : 0);
})();
