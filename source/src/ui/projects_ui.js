/* Projects: the Panel / Plant / Ladder switch on the bench, and the Projects tab (ready projects + my projects). */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, $ = ui.$;
  const PJ = EL.projects, PA = EL.plantArt;
  const B = () => EL.bench;
  const KEY = 'ellab.projects', MAXP = 30;
  /* The bench keeps the trainee's own electrical work. A ready project opened from the Projects tab is a visit:
     the own work waits in ellab.benchHome, the last ready project in ellab.projLast, and the app always starts on the own bench. */
  const HOME = 'ellab.benchHome', LAST = 'ellab.projLast';
  const lsg = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lss = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} };
  const isReady = (c) => !!(c && c.proj && PJ.map[c.proj.id]);
  const hasWork = (c) => !!(c && (c.parts.length || (c.plant && c.plant.units && c.plant.units.length) || (c.line && c.line.els && c.line.els.length)));
  function stash(cur) { if (isReady(cur)) lss(LAST, EL.serialize(cur)); else if (hasWork(cur)) lss(HOME, EL.serialize(cur)); }
  function homeCircuit() { try { const s = lsg(HOME); if (s) { const c = EL.deserialize(s); if (hasWork(c)) return c; } } catch (e) {} return EL.loadTemplate('dol'); }
  function homeBtn() {
    const b = $('#btnHome'); if (!b) return;
    const on = isReady(B().ed.c);
    b.style.display = on ? '' : 'none';
    if (on) b.title = b.ariaLabel = T(['Back to my own bench (this project stays in Projects > Continue)', 'ارجع للمعمل بتاعي (المشروع ده بيفضل في المشاريع > كمّل)']);
  }

  /* ---------- bench view switch ---------- */
  const VIEWS = [['panel', ['Panel', 'اللوحة']], ['plant', ['Plant', 'العملية']], ['line', ['Line', 'الخط']]];
  function setView(v) {
    if (v === 'ladder') { ui.show('prog'); return; }
    if (!VIEWS.some((x) => x[0] === v)) v = 'panel';
    const b = B(), prev = b.view;
    b.view = v;
    $('#v-bench').dataset.view = v;
    for (const x of ui.$$('#viewSeg .btn')) x.classList.toggle('on', x.dataset.v === v);
    if (b.rebuildPalette) b.rebuildPalette();
    if (v === 'panel') { requestAnimationFrame(() => { if (b._fitPanel) { b._fitPanel = false; b.ed.fit(); } else b.ed.applyView(); }); b.inspector(b.ed); if (b.ed.hint) b.ed.hint(''); }
    if (v === 'plant') { ui.plant.render(true); if (prev !== 'plant' && !setView.fitted) { setView.fitted = true; requestAnimationFrame(() => ui.plant.fit()); } ui.plant.inspector(); }
    if (v !== 'plant' && ui.plant.pending) { ui.plant.pending = null; }
    if (v === 'line') { ui.line.render(true); if (prev !== 'line' && !setView.lfit) { setView.lfit = true; requestAnimationFrame(() => ui.line.fit()); } ui.line.inspector(); }
    try { localStorage.setItem('ellab.bview', v); } catch (e) {}
  }
  function hookBench() {
    const b = B();
    b.view = 'panel';
    b.setView = setView;
    b.sideFor = function () { if (b.view === 'plant') ui.plant.inspector(); else if (b.view === 'line') ui.line.inspector(); };
    const seg = $('#viewSeg');
    for (const x of ui.$$('#viewSeg .btn')) x.addEventListener('click', () => { setView(x.dataset.v); ui.click(); });
    void seg;
    const frame0 = b.frame;
    let liveT = 0;
    b.frame = function (now) {
      frame0(now);
      if (b.view === 'plant') { ui.plant.frame(); if (now - liveT > 300) { liveT = now; ui.plant.updateLive(); } }
      else if (b.view === 'line') ui.line.frame();
    };
    const setMode0 = b.setMode;
    b.setMode = function (m) { setMode0(m); if (b.view === 'plant') { ui.plant.render(true); ui.plant.inspector(); } else if (b.view === 'line') { ui.line.render(true); ui.line.inspector(); } };
    let lastC = b.ed.c;
    b.ed.hooks.push((ed) => {
      if (ed.c !== lastC) { lastC = ed.c; b._fitPanel = b.view !== 'panel'; ui.plant.sel = null; ui.plant.selPipe = null; ui.plant.pending = null; ui.ladder.workFor = null; ui.ladder.dirty = false; ui.line.sel = null; setView.lfit = false; if (b.view === 'line') { ui.line.render(true); ui.line.inspector(); requestAnimationFrame(() => ui.line.fit()); } if (b.view === 'plant') { ui.plant.render(true); ui.plant.inspector(); } if (ui.view() === 'prog') ui.ladder.render(); }
    });
    let v0 = 'panel';
    try { v0 = localStorage.getItem('ellab.bview') || 'panel'; } catch (e) {}
    if (isReady(b.ed.c)) { stash(b.ed.c); b.ed.setCircuit(homeCircuit()); b.save(); v0 = 'panel'; b._fitPanel = true; } // the app opens on the own bench, not on the last project
    else if (b.ed.c.parts.length) v0 = 'panel';
    const seg2 = $('#viewSeg');
    if (seg2 && !$('#btnHome')) seg2.after(h('button', { class: 'btn', id: 'btnHome', type: 'button', style: { display: 'none' }, onclick: () => { PJ.home(); ui.click(); } }, '⌂', h('span', { class: 'hm-l', text: ' ' + T(['My bench', 'المعمل بتاعي']) })));
    b.ed.hooks.push(() => homeBtn());
    ui.onRefresh(() => { const x = $('#btnHome .hm-l'); if (x) x.textContent = ' ' + T(['My bench', 'المعمل بتاعي']); homeBtn(); });
    setView(v0); homeBtn();
  }

  /* ---------- my projects (this browser) ---------- */
  function loadList() { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a.filter((x) => x && typeof x.data === 'string').slice(0, MAXP) : []; } catch (e) { return []; } }
  function saveList(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, MAXP))); return true; } catch (e) { ui.toast(['Not saved: the browser storage is full. Download the project as a file instead.', 'ما اتحفظش: مساحة المتصفح مليانة. نزّل المشروع كملف بدل كده.'], 'bad', 7000); return false; } }
  const clean = (s, n) => String(s || '').replace(/[<>`"&]/g, '').trim().slice(0, n);
  function openCircuit(c, msg) {
    const b = B();
    const cur = b.ed.c;
    if (isReady(c) || isReady(cur)) stash(cur); // a ready project never costs the own bench work: it is kept aside
    else if (hasWork(cur) && !confirm(T(['Replace what is on the bench now? (Save it as a project first if you need it.)', 'تستبدل اللي على المعمل دلوقتي؟ (احفظه كمشروع الأول لو محتاجه.)']))) return false;
    EL.inst.probes = { red: null, black: null, clamp: null, ncv: null };
    b.ed.setCircuit(c);
    b.save();
    ui.show('bench');
    const th = document.querySelector('#toasts'); if (th) th.innerHTML = '';
    if (msg) ui.toast(msg, 'ok', 6000);
    return true;
  }
  /* back to the trainee's own bench (electrical panel) */
  PJ.home = function (quiet) {
    const b = B(), cur = b.ed.c;
    if (isReady(cur)) stash(cur);
    EL.inst.probes = { red: null, black: null, clamp: null, ncv: null };
    b.ed.setCircuit(homeCircuit());
    b.save();
    b._fitPanel = true; setView('panel'); homeBtn();
    if (!quiet) ui.toast(['Back on your own bench. The project waits in Projects > Continue.', 'رجعت للمعمل بتاعك. المشروع مستنيك في المشاريع > كمّل.'], 'ok', 4000);
  };
  PJ.resume = function () {
    let c = null; try { c = EL.deserialize(lsg(LAST)); } catch (e) {}
    if (!isReady(c)) { lss(LAST, null); render(); return; }
    if (!openCircuit(c, T(['Continued: ', 'كمّلت: ']) + T(PJ.map[c.proj.id].name))) return;
    setView.fitted = false; setView(c.plant && c.plant.units.length ? 'plant' : c.line && c.line.els && c.line.els.length ? 'line' : 'panel');
  };
  PJ.open = function (id, view) {
    const c = PJ.load(id); if (!c) return;
    const P = PJ.map[id];
    if (!openCircuit(c, T(P.name) + ': ' + T(P.tasks[0]))) return;
    B().setMode('test');
    setView.fitted = false;
    if (view === 'ladder') { setView('plant'); ui.show('prog'); } else setView(view || 'plant');
    requestAnimationFrame(() => { if (B().view === 'panel') B().ed.fit(); else if (B().view === 'line') ui.line.fit(); else ui.plant.fit(); });
  };
  PJ.openEmpty = function () {
    if (!openCircuit(PJ.empty(), T(['Empty project: add parts on the panel, units in the plant and a ladder program.', 'مشروع فاضي: ضيف أجهزة في اللوحة ووحدات في العملية وبرنامج لادر.']))) return;
    B().setMode('build'); setView('plant');
  };
  function saveCurrent(name) {
    name = clean(name, 40) || T(['My project', 'مشروعي']) + ' ' + new Date().toLocaleDateString();
    const data = EL.serialize(B().ed.c);
    if (data.length > 1500000) { ui.toast(['Too big to keep in the browser. Use Download.', 'كبير قوي على المتصفح. استخدم التنزيل.'], 'bad'); return; }
    const a = loadList();
    const i = a.findIndex((x) => x.name === name);
    const item = { id: 'p' + Date.now().toString(36), name, t: Date.now(), data };
    if (i >= 0) a[i] = Object.assign(a[i], { t: item.t, data }); else a.unshift(item);
    if (a.length > MAXP) { ui.toast(T(['You can keep ', 'تقدر تحتفظ بـ']) + MAXP + T([' projects. Delete one first.', ' مشروع. امسح واحد الأول.']), 'warn'); return; }
    if (saveList(a)) { ui.toast(T(['Saved: ', 'اتحفظ: ']) + name, 'ok'); render(); }
  }

  /* ---------- Projects tab ---------- */
  let root;
  function render() {
    if (!root) return;
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'pj-hero' },
      h('h2', { text: T(['Projects', 'المشاريع']) }),
      h('p', { text: T(['Build a whole system and run it: wire the panel, lay out the process with tanks, pumps, valves and pipes, and program the PLC in ladder. Then measure it, break it and find the fault.', 'ابني سيستم كامل وشغّله: وصّل اللوحة، وارسم العملية بالتانكات والطلمبات والمحابس والمواسير، وبرمج الـPLC لادر. وبعدين قيس وبوّظ ودوّر على العطل.']) }),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn pri', onclick: () => PJ.openEmpty(), text: '+ ' + T(['Start an empty project', 'ابدأ مشروع فاضي']) }),
        h('button', { class: 'btn', onclick: () => { PJ.openEmpty(); ui.toast(['Water station from zero: drag units from the list (supply, break tank, pumps, filters, RO, UV, tanks) and join them with pipes. Press Test to run.', 'محطة مية من الصفر: اسحب الوحدات من القايمة (مصدر، بريك تانك، طلمبات، فلاتر، RO، UV، تانكات) ووصّلها بمواسير. دوس اختبار عشان تشغّل.'], 'info', 9000); }, text: '💧 ' + T(['Build a water station from zero', 'ابني محطة مية من الصفر']) }),
        h('button', { class: 'btn', onclick: () => { if (EL.mechUI && EL.mechUI.openBuild) EL.mechUI.openBuild('pump'); }, text: '⚙️ ' + T(['Build a mechanical skid', 'ابني شاسيه ميكانيكا']) }),
        h('button', { class: 'btn', onclick: () => { if (isReady(B().ed.c)) PJ.home(true); ui.show('bench'); }, text: T(['Go to the bench', 'روح للمعمل']) }))));
    { let last = null; try { const s = lsg(LAST); if (s) last = EL.deserialize(s); } catch (e) {}
      const cur = B().ed.c, open = isReady(cur) ? cur : null, P = open ? PJ.map[open.proj.id] : last && isReady(last) ? PJ.map[last.proj.id] : null;
      if (P) root.appendChild(h('div', { class: 'card pj-cont' }, h('b', { text: T(['Continue where you stopped: ', 'كمّل من مكان ما وقفت: ']) + T(P.name) }),
        h('div', { class: 'row wrap' }, h('button', { class: 'btn pri', onclick: () => { if (open) { ui.show('bench'); } else PJ.resume(); }, text: '▶ ' + T(['Continue', 'كمّل']) })))); }
    root.appendChild(h('h3', { class: 'pj-sec', text: T(['Ready projects', 'مشاريع جاهزة']) }));
    const grid = h('div', { class: 'pj-grid' });
    for (const id of PJ.list) {
      const P = PJ.map[id];
      const pv = h('div', { class: 'pj-thumb' });
      try { pv.innerHTML = P.line && !P.plant ? ui.line.preview(EL.line.build(P.line), 400, 220) : PA.preview(EL.plant.build(P.plant), 400, 220); } catch (e) { pv.textContent = ''; }
      const tasks = h('ol', { class: 'pj-tasks' }, P.tasks.map((t) => h('li', { text: T(t) })));
      grid.appendChild(h('div', { class: 'card pj-card' }, pv, h('h3', { text: T(P.name) }), h('p', { class: 'mute', text: T(P.desc) }),
        h('details', null, h('summary', { text: T(['What to try', 'جرّب إيه']) }), tasks),
        h('div', { class: 'row wrap' },
          h('button', { class: 'btn pri', onclick: () => PJ.open(id, P.view || 'plant'), text: T(['Open', 'افتح']) }),
          P.circuit ? h('button', { class: 'btn', onclick: () => PJ.open(id, 'panel'), text: T(['Open the panel', 'افتح اللوحة']) }) : null,
          P.plc ? h('button', { class: 'btn', onclick: () => PJ.open(id, 'ladder'), text: T(['Open the program', 'افتح البرنامج']) }) : null)));
    }
    root.appendChild(grid);
    // my projects
    root.appendChild(h('h3', { class: 'pj-sec', text: T(['My projects (saved on this device)', 'مشاريعي (محفوظة على الجهاز ده)']) }));
    const nameIn = h('input', { type: 'text', maxlength: 40, placeholder: T(['Project name', 'اسم المشروع']) });
    root.appendChild(h('div', { class: 'card' }, h('p', { class: 'mute', text: T(['Save what is on the bench now (panel, plant and ladder) under a name. Download it to keep a copy or to send it to a colleague.', 'احفظ اللي على المعمل دلوقتي (اللوحة والعملية واللادر) باسم. نزّله عشان تحتفظ بنسخة أو تبعته لزميل.']) }),
      h('div', { class: 'row wrap' }, h('div', { class: 'grow', style: { minWidth: '180px' } }, nameIn), h('button', { class: 'btn pri', onclick: () => saveCurrent(nameIn.value), text: T(['Save the bench as a project', 'احفظ المعمل كمشروع']) }),
        h('label', { class: 'btn' }, T(['Open a project file', 'افتح ملف مشروع']), h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' }, onchange: (e) => importFile(e.target.files[0]) })))));
    const list = loadList();
    if (!list.length) root.appendChild(h('p', { class: 'mute', text: T(['Nothing saved yet.', 'مفيش حاجة محفوظة لسه.']) }));
    for (const it of list) {
      root.appendChild(h('div', { class: 'card pj-row' },
        h('div', { class: 'grow' }, h('b', { text: it.name }), h('div', { class: 'mute sm', text: new Date(it.t).toLocaleString() + '  ·  ' + Math.round(it.data.length / 1024) + ' KB' })),
        h('button', { class: 'btn pri', onclick: () => { try { const c = EL.deserialize(it.data); if (openCircuit(c, T(['Opened: ', 'اتفتح: ']) + it.name)) { setView.fitted = false; setView(c.plant && c.plant.units.length ? 'plant' : 'panel'); } } catch (e) { ui.toast(['This project could not be read.', 'المشروع ده مش مقروء.'], 'bad'); } }, text: T(['Open', 'افتح']) }),
        h('button', { class: 'btn', onclick: () => ui.download('project-' + it.name.replace(/[^\w\-]+/g, '-') + '.json', it.data), text: T(['Download', 'نزّل']) }),
        h('button', { class: 'btn bad', onclick: () => { if (confirm(T(['Delete project ', 'تمسح مشروع ']) + it.name + '?')) { saveList(loadList().filter((x) => x.id !== it.id)); render(); } }, text: T(['Delete', 'حذف']) })));
    }
  }
  function importFile(f) {
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) { ui.toast(['File too large (3 MB max).', 'الملف كبير (أقصى حاجة 3 ميجا).'], 'bad'); return; }
    const r = new FileReader();
    r.onload = () => {
      try {
        const c = EL.deserialize(String(r.result));
        if (openCircuit(c, T(['Project opened from the file.', 'المشروع اتفتح من الملف.']))) { setView.fitted = false; setView(c.plant && c.plant.units.length ? 'plant' : 'panel'); }
      } catch (e) { ui.toast(['This file is not a lab project.', 'الملف ده مش مشروع للمعمل.'], 'bad'); }
    };
    r.readAsText(f);
  }

  PJ.init = function () {
    root = $('#projRoot');
    render();
    ui.onRefresh(render);
    hookBench();
  };
  PJ.onShow = render;
})(typeof window !== 'undefined' ? window : globalThis);
