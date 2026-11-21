/* QA area 7 (languages) + area 9 (older tabs regression). */
const Q = require('./qa_lib.js');
const { ok, sleep } = Q;
(async () => {
  const { b, p, errs } = await Q.start();
  const langs = await p.evaluate(() => EL.langs.map((l) => l.c + (l.rtl ? '(rtl)' : '')));
  console.log('     languages:', langs.join(' '));
  const pick = async (code) => {
    await p.click('#btnLang'); await sleep(200);
    const items = await p.$$eval('.lmenu button', (a) => a.length);
    const idx = await p.evaluate((c) => EL.langs.findIndex((l) => l.c === c), code);
    await (await p.$$('.lmenu button'))[idx].click(); await sleep(500);
    return items;
  };
  const english = /\b(Network|Download to PLC|Symbols|Check program|Process check|Add a unit|Ready projects|What to try|Open the panel|Save the bench|Properties and links|Live values|Contacts and compare|Coils and boxes|Watch table|Why is it OFF)\b/g;
  for (const code of ['ar', langs.map((x) => x.replace('(rtl)', '')).find((c) => c !== 'ar' && c !== 'en')]) {
    const n = await pick(code);
    const st = await p.evaluate(() => ({ lang: EL.lang, dir: document.documentElement.dir || document.body.dir }));
    ok(st.lang === code, `language menu (${n} items) switches to ${code}`, JSON.stringify(st));
    if (code === 'ar') ok(st.dir === 'rtl', 'Arabic sets dir=rtl', st.dir);
    const e0 = errs.length;
    await p.click('#tabs .tab[data-v=projects]'); await sleep(400);
    const pj = await p.evaluate(() => ({ cards: document.querySelectorAll('#projRoot .pj-card').length, txt: document.querySelector('#projRoot').innerText }));
    ok(pj.cards === await p.evaluate(() => EL.projects.list.length), `[${code}] Projects tab renders all cards`);
    await Q.shot(p, 'lang_' + code + '_projects');
    await (await p.$$('#projRoot .pj-card >> nth=0 >> button'))[2].click(); await sleep(1000);
    const views = {};
    for (const v of ['ladder', 'plant', 'line', 'panel']) {
      if (v === 'ladder') { await p.click('#tabs .tab[data-v=prog]'); await sleep(500); } else { await p.click('#tabs .tab[data-v=bench]'); await sleep(200); await p.click(`#viewSeg .btn[data-v=${v}]`); await sleep(500); }
      if (v === 'line' && !(await p.evaluate(() => EL.bench.ed.c.line))) { await p.evaluate(() => { EL.bench.ed.c.line = EL.line.build(EL.projects.map.line.line); EL.ui.line.render(true); EL.ui.line.inspector(); }); await sleep(300); }
      const t = await p.evaluate((v) => { const host = { panel: '#benchHost', plant: '#plantHost', ladder: '#ladHost', line: '#lineHost' }[v]; return { seg: v === 'ladder' ? document.querySelector('#tabs .tab[data-v=prog]').textContent : document.querySelector(`#viewSeg .btn[data-v=${v}]`).textContent, pal: document.querySelector(v === 'ladder' ? '#gplist' : '#plist').innerText.slice(0, 2000), side: document.querySelector(v === 'ladder' ? '#gpane' : '#pane-part').innerText.slice(0, 2000), host: document.querySelector(host).innerText.slice(0, 3000), n: document.querySelectorAll(host + ' svg *').length }; }, v);
      views[v] = t;
      ok(t.n > 10, `[${code}] ${v} view renders (${t.n} svg nodes), seg label "${t.seg}"`);
      if (v === 'plant') { await p.evaluate(() => { const u = EL.bench.ed.c.plant.units.find((x) => x.tag === 'T1'); EL.ui.plant.select(u.id, null); }); await sleep(300); views.plantSel = await p.evaluate(() => document.querySelector('#pane-part').innerText); await p.click('#plantHost .pl-tools .btn.pri'); await sleep(200); views.addMenu = await p.evaluate(() => document.querySelector('.modal').innerText); await Q.shot(p, 'lang_' + code + '_addmenu'); await Q.closeModals(p); }
      if (v === 'ladder') { await p.evaluate(() => { EL.ui.ladder.sel = { ni: 1, key: '0' }; EL.ui.ladder.render(); }); await sleep(200); views.selbar = await p.evaluate(() => document.querySelector('#ladHost .ld-selbar').innerText); await p.click('#ladHost .ld-selbar .btn.pri'); await sleep(200); views.dlg = await p.evaluate(() => (document.querySelector('.modal') || {}).innerText || ''); await Q.closeModals(p); }
      await Q.shot(p, `lang_${code}_${v}`);
    }
    ok(errs.length === e0, `[${code}] no errors in new views`, errs.slice(e0).join(' | '));
    if (code !== 'en') {
      const all = [pj.txt, ...Object.values(views).map((x) => (typeof x === 'string' ? x : x.pal + '\n' + x.side + '\n' + x.host + '\n' + x.seg))].join('\n');
      const eng = [...new Set(all.match(english) || [])];
      console.log(`     [${code}] English UI strings still visible: ${eng.length ? eng.join(', ') : 'none'}`);
    }
  }
  // back to English
  await pick('en');
  ok((await p.evaluate(() => EL.lang)) === 'en', 'switch back to English');
  // regression: older tabs
  for (const t of ['loto', 'pcb', 'inspect', 'guide']) {
    const e0 = errs.length;
    await p.click(`#tabs .tab[data-v=${t}]`); await sleep(800);
    const r = await p.evaluate((t) => { const v = document.querySelector('#v-' + t); return { on: v.classList.contains('on'), txt: v.innerText.length, btns: v.querySelectorAll('button').length }; }, t);
    ok(r.on && r.txt > 100 && r.btns > 2, `${t} tab renders (${r.txt} chars, ${r.btns} buttons)`);
    // click the first few visible non-destructive buttons
    const clicked = await p.evaluate((t) => { const v = document.querySelector('#v-' + t); const bs = [...v.querySelectorAll('button')].filter((b) => b.offsetParent && !/bad|Delete|Clear|Reset/i.test(b.className + b.textContent)).slice(0, 6); bs.forEach((b) => b.click()); return bs.map((b) => b.textContent.trim().slice(0, 20)); }, t);
    await sleep(600); await Q.closeModals(p);
    ok(errs.length === e0, `${t} tab: first buttons clicked without errors [${clicked.join(' | ')}]`, errs.slice(e0).join(' | '));
    await Q.shot(p, 'reg_' + t);
  }
  await p.click('#tabs .tab[data-v=bench]'); await sleep(500);
  Q.summary(errs);
  await b.close(); process.exit(Q.fails ? 1 : 0);
})();
