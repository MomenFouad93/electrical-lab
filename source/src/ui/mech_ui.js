/* Mechanical tab: Library (3D, explode, cutaway, operate, assemble game), Workshop (build a station on slots,
   drag and drop or tap), Quiz (name the part). State kept in localStorage ellab.mech. */
(function (g) {
  const EL = g.EL, ui = EL.ui, h = EL.h, T = ui.T, $ = ui.$;
  const M = EL.mech;
  const MC = (EL.mechUI = {});
  const KEY = 'ellab.mech';
  let st = { mode: 'lib', id: null, cat: '', q: '', best: {}, quizBest: 0, build: null };
  try { Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ mode: st.mode, id: st.id, cat: st.cat, best: st.best, quizBest: st.quizBest, build: st.build })); } catch (e) {} };
  let V = null, inited = false, root, list, stage, side, host, ctl, tray, toasts;
  const phone = () => (g.innerWidth || 1200) <= 900;
  const catOf = (id) => M.cats.find((c) => c.id === id) || { ic: '•', name: [id, id] };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function toast(msg, kind, ms) { const t = h('div', { class: 'toast ' + (kind || ''), text: Array.isArray(msg) ? T(msg) : msg }); toasts.appendChild(t); while (toasts.children.length > 3) toasts.firstChild.remove(); setTimeout(() => t.remove(), ms || 3800); }

  /* ---------------- thumbnails (one small offscreen renderer) ---------------- */
  const thumbs = new Map(); let tr = null, tq = [], tbusy = false;
  function thumb(id, img) {
    if (thumbs.has(id)) { img.src = thumbs.get(id); return; }
    tq.push([id, img]); if (!tbusy) { tbusy = true; setTimeout(runThumbs, 30); }
  }
  function runThumbs() {
    const job = tq.shift(); if (!job) { tbusy = false; return; }
    const [id, img] = job;
    if (thumbs.has(id)) { img.src = thumbs.get(id); return setTimeout(runThumbs, 0); }
    try {
      const T3 = EL.THREE;
      if (!tr) {
        const r = new T3.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true }); r.setSize(192, 144, false); r.toneMapping = T3.ACESFilmicToneMapping;
        const sc = new T3.Scene(); sc.add(new T3.HemisphereLight(0xe8eeff, 0x303846, 1.1)); const d = new T3.DirectionalLight(0xffffff, 1.8); d.position.set(5, 9, 7); sc.add(d);
        const pm = new T3.PMREMGenerator(r), es = new T3.Scene(); es.add(new T3.Mesh(new T3.BoxGeometry(10, 10, 10), new T3.MeshBasicMaterial({ color: 0x8890a0, side: T3.BackSide }))); sc.environment = pm.fromScene(es).texture;
        tr = { r, sc, cam: new T3.PerspectiveCamera(32, 4 / 3, 0.01, 5000) };
      }
      const c = M.byId[id], it = M.build(c, {}); tr.sc.add(it.root);
      const box = new T3.Box3().setFromObject(it.root), sph = box.getBoundingSphere(new T3.Sphere()), dd = sph.radius / Math.sin(16 * Math.PI / 180) * 1.02;
      tr.cam.position.set(sph.center.x + dd * 0.6, sph.center.y + dd * 0.42, sph.center.z + dd * 0.68); tr.cam.near = dd / 100; tr.cam.far = dd * 10; tr.cam.updateProjectionMatrix(); tr.cam.lookAt(sph.center);
      tr.r.render(tr.sc, tr.cam); const url = tr.r.domElement.toDataURL('image/png'); thumbs.set(id, url); img.src = url;
      tr.sc.remove(it.root); it.root.traverse((m) => { if (m.isMesh) { m.geometry.dispose(); m.material.dispose(); } });
    } catch (e) { thumbs.set(id, ''); }
    setTimeout(runThumbs, 0);
  }

  /* ---------------- layout ---------------- */
  function seg() {
    return h('div', { class: 'seg', id: 'mModes' },
      [['lib', ['Library', 'المكتبة']], ['work', ['Workshop: build', 'الورشة: ابني']], ['quiz', ['Quiz', 'اختبر نفسك']]].map(([m, n]) =>
        h('button', { class: 'btn' + (st.mode === m ? ' on' : ''), type: 'button', 'data-m': m, text: T(n), onclick: () => setMode(m) })));
  }
  function frame() {
    root.innerHTML = '';
    list = h('aside', { id: 'mlist', class: 'm-list' });
    host = h('div', { class: 'm-host', id: 'mHost' });
    ctl = h('div', { class: 'm-ctl' }); tray = h('div', { class: 'm-tray' }); toasts = h('div', { class: 'statusbar', id: 'mtoasts' });
    stage = h('div', { class: 'stage m-stage' }, h('div', { class: 'tb', id: 'mtb' }, h('button', { class: 'btn m-back', type: 'button', html: '‹ <span>' + T(['All items', 'كل القطع']) + '</span>', onclick: () => { root.classList.remove('m-open'); renderList(); } }), seg()), host, ctl, tray, toasts);
    side = h('aside', { id: 'mside', class: 'm-side' });
    root.append(list, stage, side);
  }
  function ensureViewer() {
    if (V) return V;
    V = M.viewer(host, {});
    if (V) V.onPick = (pid) => { if (st.mode === 'lib') renderSide(); };
    return V;
  }
  function setMode(m) {
    if (game) endGame(true);
    st.mode = m; save(); root.dataset.mode = m;
    for (const b of $('#mModes', root).children) b.classList.toggle('on', b.dataset.m === m);
    tray.innerHTML = ''; ctl.innerHTML = '';
    if (V) { V.onTap = null; V.extra = null; V.onSlot = null; V.auto = false; }
    if (m === 'lib') { renderList(); if (st.id && M.byId[st.id]) openItem(st.id, true); else if (!phone()) openItem(M.lib[0] && M.lib[0].id, true); }
    else if (m === 'work') { root.classList.add('m-open'); WS.start(); }
    else { root.classList.add('m-open'); QZ.start(); }
    if (ui.mpanels) ui.mpanels.sync();
  }

  /* ---------------- library list ---------------- */
  function renderList() {
    if (st.mode === 'work') return WS.renderList();
    if (st.mode === 'quiz') return QZ.renderList();
    list.innerHTML = '';
    const q = h('input', { type: 'search', class: 'm-q', placeholder: T(['Search (valve, seal, bearing...)', 'دور (محبس، سيل، بلي...)']), value: st.q || '', oninput: () => { st.q = q.value; fill(); } });
    const chips = h('div', { class: 'm-cats' }, h('button', { type: 'button', class: 'chip' + (!st.cat ? ' on' : ''), text: T(['All', 'الكل']), onclick: () => { st.cat = ''; save(); renderList(); } }),
      M.cats.filter((c) => M.lib.some((x) => x.cat === c.id)).map((c) => h('button', { type: 'button', class: 'chip' + (st.cat === c.id ? ' on' : ''), title: T(c.name), text: c.ic + ' ' + T(c.name), onclick: () => { st.cat = c.id; save(); renderList(); } })));
    const box = h('div', { class: 'm-items' });
    const ph = seg(); ph.removeAttribute('id'); ph.classList.add('m-modes-ph');
    list.append(ph, h('div', { class: 'phead' }, q), chips, box);
    function fill() {
      box.innerHTML = '';
      const s = (st.q || '').trim().toLowerCase();
      for (const cat of M.cats) {
        if (st.cat && st.cat !== cat.id) continue;
        const items = M.lib.filter((c) => c.cat === cat.id && (!s || (c.name[0] + ' ' + c.name[1] + ' ' + T(c.name) + ' ' + c.parts.map((p) => p.name[0] + ' ' + p.name[1]).join(' ')).toLowerCase().includes(s)));
        if (!items.length) continue;
        box.append(h('div', { class: 'pcat', text: cat.ic + '  ' + T(cat.name) }));
        const grid = h('div', { class: 'pitems' });
        for (const c of items) {
          const img = h('img', { alt: '', class: 'm-th' }); thumb(c.id, img);
          grid.append(h('button', { type: 'button', class: 'pit m-item' + (st.id === c.id ? ' on' : ''), 'data-id': c.id, onclick: () => openItem(c.id) }, img, h('span', { text: T(c.name) })));
        }
        box.append(grid);
      }
      if (!box.children.length) box.append(h('p', { class: 'mute', text: T(['Nothing found.', 'مفيش نتايج.']) }));
    }
    fill();
  }

  /* ---------------- library item ---------------- */
  let cur = null;
  function openItem(id, quiet) {
    const c = M.byId[id]; if (!c) return;
    if (st.mode !== 'lib') { st.mode = 'lib'; root.dataset.mode = 'lib'; for (const b of $('#mModes', root).children) b.classList.toggle('on', b.dataset.m === 'lib'); }
    if (game) endGame(true);
    st.id = id; save(); cur = c; root.classList.add('m-open');
    for (const b of list.querySelectorAll('.m-item')) b.classList.toggle('on', b.dataset.id === id);
    if (!ensureViewer()) return;
    V.onTap = null; V.extra = null;
    V.show(c); V.setLabels(st.labels === true && !phone()); V.auto = false; tray.innerHTML = '';
    renderCtl(); renderSide();
    if (phone()) root.scrollTop = 0;
  }
  function renderCtl() {
    ctl.innerHTML = '';
    const c = cur; if (!c) return;
    const ex = h('input', { dir: 'ltr', type: 'range', min: 0, max: 100, value: Math.round((V.kT || 0) * 100), 'aria-label': T(['Explode', 'فكّ']), oninput: () => { V.setExplode(ex.value / 100); } , onchange: () => V.fitK(ex.value / 100) });
    const tog = (on, ic, n, f) => h('button', { type: 'button', class: 'btn' + (on ? ' on' : ''), html: ic + ' <span>' + T(n) + '</span>', onclick: (e) => { f(); e.currentTarget.classList.toggle('on'); } });
    ctl.append(
      h('label', { class: 'm-ex' }, h('span', { text: T(['Take apart', 'فكّ']) }), ex),
      tog(V.cut, '✂', ['Cutaway', 'قطاع'], () => V.setCut(!V.cut)),
      tog(V.labels, '🏷', ['Names', 'الأسماء'], () => { st.labels = !V.labels; V.setLabels(!V.labels); }),
      c.anim ? h('button', { type: 'button', class: 'btn pri', html: '▶ <span>' + T(c.anim.label || ['Operate', 'شغّل']) + '</span>', onclick: () => V.operate() }) : null,
      h('button', { type: 'button', class: 'btn', html: '🧩 <span>' + T(['Assemble it', 'ركّبها بنفسك']) + '</span>', onclick: startGame }),
      tog(V.auto, '⟳', ['Turn', 'لف'], () => { V.auto = !V.auto; V.kick(); }),
      h('button', { type: 'button', class: 'btn', title: T(['Reset view', 'رجّع المنظر']), text: '⌂', onclick: () => { V.setExplode(0); ex.value = 0; V.setCut(false); V.select(null); V.hidden.clear(); V.apply(); V.fit(); renderCtl(); renderSide(); } }));
  }
  function sec(title, txt, open) { return h('details', { class: 'm-sec', open: open ? true : null }, h('summary', { text: T(title) }), h('p', { text: T(txt) })); }
  function renderSide() {
    if (st.mode !== 'lib' || !cur) return;
    const c = cur; side.innerHTML = '';
    const cat = catOf(c.cat);
    side.append(h('div', { class: 'm-head' }, h('div', { class: 'mute', text: cat.ic + ' ' + T(cat.name) }), h('h2', { text: T(c.name) })));
    if (V.sel) {
      const p = M.part(c, V.sel);
      if (p) side.append(h('div', { class: 'card m-pcard' }, h('b', { text: T(p.name) }), h('p', { text: T(p.role) }),
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn', text: T(['Only this', 'دي بس']), onclick: () => { for (const q of c.parts) V.setHidden(q.id, q.id !== p.id); V.fit(V.cur.parts.get(p.id).g, true); renderSide(); } }),
          h('button', { type: 'button', class: 'btn', text: T(['Show all', 'اظهر الكل']), onclick: () => { for (const q of c.parts) V.setHidden(q.id, false); V.select(null); V.fit(null, true); renderSide(); } }))));
    }
    const best = st.best[c.id];
    side.append(sec(['What is it', 'ده إيه'], c.info.what, true), sec(['Where you find it', 'بتلاقيه فين'], c.info.use, true), sec(['How it works', 'بيشتغل إزاي'], c.info.how, true),
      sec(['Common failures', 'الأعطال المشهورة'], c.info.fail, true), sec(['Checks and maintenance', 'الفحص والصيانة'], c.info.pm, true));
    const pl = h('div', { class: 'm-parts' });
    c.parts.forEach((p, i) => {
      const eye = h('button', { type: 'button', class: 'm-eye', title: T(['Show / hide', 'اظهر / اخفي']), text: V.hidden.has(p.id) ? '○' : '●', onclick: (e) => { e.stopPropagation(); V.setHidden(p.id, !V.hidden.has(p.id)); eye.textContent = V.hidden.has(p.id) ? '○' : '●'; } });
      pl.append(h('div', { class: 'm-prow' + (V.sel === p.id ? ' on' : ''), role: 'button', tabindex: 0, onclick: () => { V.select(V.sel === p.id ? null : p.id); }, onkeydown: (e) => { if (e.key === 'Enter') V.select(V.sel === p.id ? null : p.id); } },
        h('span', { class: 'm-n', text: String(i + 1) }), h('span', { class: 'm-pn', text: T(p.name) }), eye));
    });
    side.append(h('h3', { text: T(['Parts inside', 'المكونات']) + ' (' + c.parts.length + ')' }), h('p', { class: 'mute small', text: T(['Tap a part in 3D or in the list.', 'اضغط على أي جزء في الـ3D أو في القايمة.']) }), pl);
    if (best) side.append(h('p', { class: 'mute small', text: T(['Your best assembly: ', 'أحسن تركيب ليك: ']) + best.t + ' s, ' + best.e + ' ' + T(['mistakes', 'غلطات']) }));
    side.append(h('button', { type: 'button', class: 'btn pri wide', html: '🧩 ' + T(['Assemble it in the right order', 'ركّبها بالترتيب الصح']), onclick: startGame }));
  }

  /* ---------------- assemble game ---------------- */
  let game = null;
  function startGame() {
    const c = cur; if (!c || !V) return;
    const steps = M.steps(c);
    V.select(null); V.setCut(false); V.setExplode(0, true); V.fitK(0);
    for (const p of c.parts) V.setHidden(p.id, p.id !== steps[0]);
    game = { c, steps, i: 1, err: 0, t0: Date.now(), miss: 0, order: shuffle(steps.slice(1)) };
    renderTray(); toast(['Pick the parts in the order you would fit them.', 'اختار الأجزاء بالترتيب اللي هتركّبها بيه.'], 'info');
  }
  function renderTray() {
    tray.innerHTML = ''; if (!game) return;
    const left = game.steps.slice(game.i);
    const head = h('div', { class: 'm-tray-h' }, h('b', { text: T(['Assemble', 'ركّب']) + ' ' + game.i + '/' + game.steps.length }), h('span', { class: 'mute', text: ' ' + T(['mistakes', 'غلطات']) + ': ' + game.err }),
      h('button', { type: 'button', class: 'btn', text: T(['Hint', 'تلميح']), onclick: () => { game.err++; toast(T(['Next: ', 'اللي عليه الدور: ']) + T(M.part(game.c, game.steps[game.i]).name), 'warn'); renderTray(); } }),
      h('button', { type: 'button', class: 'btn', text: T(['Stop', 'وقّف']), onclick: () => endGame(true) }));
    tray.append(head, h('div', { class: 'm-chips' }, game.order.filter((pid) => left.includes(pid)).map((pid) => h('button', { type: 'button', class: 'chip', text: T(M.part(game.c, pid).name), onclick: (e) => pick(pid, e.currentTarget) }))));
  }
  function pick(pid, el) {
    const want = game.steps[game.i];
    if (pid !== want) {
      game.err++; el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 400); ui.buzz && ui.buzz(120);
      const p = M.part(game.c, pid);
      toast(T(['Not yet: ', 'لسه: ']) + T(p.name) + T([' goes in later.', ' بيتركّب بعدين.']), 'warn');
      const em = tray.querySelector('.m-tray-h .mute'); if (em) em.textContent = ' ' + T(['mistakes', 'غلطات']) + ': ' + game.err; return;
    }
    const pp = V.cur.parts.get(pid);
    V.setHidden(pid, false);
    const from = pp.base.clone().addScaledVector(pp.ex.lengthSq() > 0.01 ? pp.ex : new EL.THREE.Vector3(0, 5, 0), 1.4);
    pp.flying = { from, to: pp.base.clone(), t: 0 }; V.kick(); ui.click && ui.click();
    game.i++;
    if (game.i >= game.steps.length) {
      const t = Math.round((Date.now() - game.t0) / 1000), b = st.best[game.c.id];
      if (!b || game.err < b.e || (game.err === b.e && t < b.t)) st.best[game.c.id] = { t, e: game.err }; save();
      tray.innerHTML = ''; tray.append(h('div', { class: 'm-tray-h done' }, h('b', { text: '✔ ' + T(['Assembled!', 'اتركبت!']) }), h('span', { text: ' ' + t + ' s, ' + game.err + ' ' + T(['mistakes', 'غلطات']) }),
        h('button', { type: 'button', class: 'btn pri', text: T(['Again', 'تاني']), onclick: startGame }), h('button', { type: 'button', class: 'btn', text: T(['Close', 'اقفل']), onclick: () => { tray.innerHTML = ''; } })));
      game = null; renderSide();
      if (cur && cur.anim) setTimeout(() => V && V.operate(true), 700);
      return;
    }
    renderTray();
  }
  function endGame(quiet) { game = null; tray.innerHTML = ''; if (V && cur && V.cur && V.cur.c === cur) { for (const p of cur.parts) V.setHidden(p.id, false); } if (!quiet) renderSide(); }

  /* ---------------- workshop ---------------- */
  const WS = {};
  let ws = null; // { b, placed: {slotId: {id, rec}}, sel: slotId, checked }
  WS.start = function () {
    side.innerHTML = ''; ctl.innerHTML = ''; tray.innerHTML = '';
    if (!M.builds.length) { list.innerHTML = ''; side.append(h('p', { class: 'mute', text: T(['No workshop projects yet.', 'مفيش مشاريع ورشة لسه.']) })); return; }
    const b = M.builds.find((x) => x.id === st.build) || M.builds[0];
    const keep = ws && ws.b.id === b.id ? Object.fromEntries(Object.entries(ws.placed).map(([k, v]) => [k, v.id])) : null;
    WS.open(b.id, keep);
  };
  WS.open = function (bid, keep) {
    const b = M.builds.find((x) => x.id === bid); if (!b || !ensureViewer()) return;
    st.build = bid; save();
    ws = { b, placed: {}, sel: null, checked: false, running: false };
    V.show({ id: 'base_' + b.id, parts: b.base, cut: 'z', anim: b.anim }); V.setLabels(false);
    V.extra = () => b.slots.map((s) => ({ id: s.id, p: s.lp || s.p, text: (ws.placed[s.id] ? (ws.checked ? (s.opts[ws.placed[s.id].id] && s.opts[ws.placed[s.id].id].ok ? '✔ ' : '✖ ') : '● ') : '+ ') + T(s.name), cls: (ws.sel === s.id ? 'on ' : '') + (ws.placed[s.id] ? 'full' : '') + (ws.checked && ws.placed[s.id] ? (s.opts[ws.placed[s.id].id] && s.opts[ws.placed[s.id].id].ok ? ' ok' : ' bad') : ws.checked && s.need ? ' bad' : '') }));
    V.onSlot = (sid) => { ws.sel = sid; WS.renderList(); WS.renderSide(); V.kick(); };
    V.onTap = (hit) => {
      if (!hit) return;
      for (const sid in ws.placed) { const r = ws.placed[sid].rec; let o = hit.object; while (o) { if (o === r.root) { ws.sel = sid; WS.renderList(); WS.renderSide(); V.kick(); return; } o = o.parent; } }
    };
    { const T3 = EL.THREE, box = new T3.Box3().setFromObject(V.cur.root); for (const sl of b.slots) box.expandByPoint(new T3.Vector3(...sl.p)); V.orbit.th = 0.32; V.orbit.ph = 1.12; V.fit({ isBoxProxy: true, box }, true); }
    if (keep) { for (const sid in keep) WS.place(sid, keep[sid], true); ws.sel = null; }
    WS.renderList(); WS.renderSide(); WS.ctl();
  };
  WS.ctl = function () {
    ctl.innerHTML = '';
    ctl.append(h('button', { type: 'button', class: 'btn pri', html: '✔ <span>' + T(['Check my build', 'افحص التركيبة']) + '</span>', onclick: WS.check }),
      h('button', { type: 'button', class: 'btn', html: '▶ <span>' + T(['Run', 'شغّل']) + '</span>', onclick: WS.run }),
      h('button', { type: 'button', class: 'btn', html: '↺ <span>' + T(['Start again', 'ابدأ من الأول']) + '</span>', onclick: () => WS.open(ws.b.id) }),
      h('button', { type: 'button', class: 'btn', title: T(['Reset view', 'رجّع المنظر']), text: '⌂', onclick: () => V.fitAll() }));
  };
  function candidates() { const ids = new Set(); for (const s of ws.b.slots) for (const id in s.opts) if (M.byId[id]) ids.add(id); return [...ids]; }
  WS.renderList = function () {
    if (!ws) return;
    list.innerHTML = '';
    list.append(h('div', { class: 'phead' }, h('select', { class: 'm-q', 'aria-label': T(['Project', 'المشروع']), onchange: (e) => WS.open(e.target.value) }, M.builds.map((b) => h('option', { value: b.id, selected: b.id === ws.b.id ? true : null, text: T(b.name) })))));
    const s = ws.sel && ws.b.slots.find((x) => x.id === ws.sel);
    if (s) list.append(h('button', { type: 'button', class: 'btn m-allb', text: T(['Show all parts', 'اظهر كل القطع']), onclick: () => { ws.sel = null; WS.renderList(); WS.renderSide(); V.kick(); } }));
    list.append(h('p', { class: 'mute small m-pad', text: s ? T(['Choose what goes on: ', 'اختار اللي يتركّب في: ']) + T(s.name) : T(['Drag a part onto a + point, or tap a point first.', 'اسحب القطعة وحطها على علامة +، أو اضغط على العلامة الأول.']) }));
    const ids = s ? Object.keys(s.opts).filter((id) => M.byId[id]) : candidates();
    const grid = h('div', { class: 'pitems' });
    for (const id of ids) {
      const c = M.byId[id], img = h('img', { alt: '', class: 'm-th', draggable: 'false' }); thumb(id, img);
      const b = h('button', { type: 'button', class: 'pit m-item', 'data-id': id }, img, h('span', { text: T(c.name) }));
      b.addEventListener('pointerdown', (e) => dragStart(e, id));
      b.addEventListener('click', () => { if (dragMoved) return; if (s) WS.place(s.id, id); else toast(['Tap a + point on the drawing first, or drag the part onto it.', 'اضغط على علامة + في الرسمة الأول، أو اسحب القطعة عليها.'], 'info'); });
      grid.append(b);
    }
    list.append(grid);
  };
  let drag = null, dragMoved = false;
  function dragStart(e, id) {
    if (e.button && e.button !== 0) return;
    dragMoved = false; drag = { id, x: e.clientX, y: e.clientY, ghost: null };
    const mv = (ev) => {
      if (!drag) return;
      if (!drag.ghost && Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) > 8) { dragMoved = true; drag.ghost = h('div', { class: 'm-ghost', text: T(M.byId[id].name) }); document.body.append(drag.ghost); }
      if (drag.ghost) { drag.ghost.style.left = ev.clientX + 'px'; drag.ghost.style.top = ev.clientY + 'px'; const sid = V.slotAt(ev.clientX, ev.clientY); for (const b of host.querySelectorAll('.mc-slot')) b.classList.toggle('hot', b.dataset.slot === sid); ev.preventDefault(); }
    };
    const upf = (ev) => {
      g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', upf); g.removeEventListener('pointercancel', upf);
      if (drag && drag.ghost) {
        drag.ghost.remove();
        const sid = V.slotAt(ev.clientX, ev.clientY);
        if (sid) WS.place(sid, id); else toast(['Drop it on a + point.', 'سيبها على علامة +.'], 'info');
      }
      drag = null; setTimeout(() => { dragMoved = false; }, 0);
    };
    g.addEventListener('pointermove', mv, { passive: false }); g.addEventListener('pointerup', upf); g.addEventListener('pointercancel', upf);
  }
  WS.place = function (sid, id, quiet) {
    const s = ws.b.slots.find((x) => x.id === sid), c = M.byId[id]; if (!s || !c) return;
    if (!s.opts[id]) { toast(T(c.name) + T([' does not fit on ', ' مش مكانها في ']) + T(s.name), 'warn'); return; }
    if (ws.placed[sid]) V.remove(ws.placed[sid].rec);
    const o = Object.assign({}, s, s.opts[id].place || {});
    const rec = V.add(c, { p: o.p, r: o.rot, size: o.size, tag: sid });
    ws.placed[sid] = { id, rec }; ws.sel = sid; ws.checked = false; ws.running = false;
    for (const k in ws.placed) ws.placed[k].rec.running = false;
    if (quiet) return;
    ui.click && ui.click(); WS.renderList(); WS.renderSide(); V.kick();
  };
  WS.check = function (quiet) {
    ws.checked = true; let ok = 0, tot = 0;
    for (const s of ws.b.slots) { if (!s.need && !ws.placed[s.id]) continue; tot++; const p = ws.placed[s.id]; if (p && s.opts[p.id] && s.opts[p.id].ok) ok++; }
    WS.renderSide(); V.fitAll();
    if (!quiet) toast(ok === tot ? ['All correct. Press Run.', 'كله صح. دوس شغّل.'] : T(['Correct: ', 'الصح: ']) + ok + '/' + tot, ok === tot ? 'ok' : 'warn', 5000);
    return ok === tot;
  };
  WS.run = function () {
    if (!WS.check(true)) { toast(['Fix the red points first.', 'صلّح العلامات الحمرا الأول.'], 'warn'); return; }
    ws.running = !ws.running;
    for (const k in ws.placed) { const r = ws.placed[k].rec; r.running = ws.running && !!(r.c.anim); }
    V.run = ws.running; V.kick();
    if (ws.running && ws.b.done) toast(ws.b.done, 'ok', 7000);
  };
  WS.renderSide = function () {
    side.innerHTML = '';
    const b = ws.b;
    side.append(h('div', { class: 'm-head' }, h('div', { class: 'mute', text: '🛠 ' + T(['Workshop', 'الورشة']) }), h('h2', { text: T(b.name) })), h('p', { text: T(b.intro) }));
    const s = ws.sel && b.slots.find((x) => x.id === ws.sel);
    if (s) {
      const p = ws.placed[s.id], o = p && s.opts[p.id];
      const card = h('div', { class: 'card m-pcard' }, h('b', { text: T(s.name) }), s.hint ? h('p', { class: 'mute', text: T(s.hint) }) : null);
      if (p) {
        card.append(h('p', { text: '→ ' + T(M.byId[p.id].name) }));
        if (ws.checked && o) card.append(h('p', { class: o.ok ? 'okc' : 'badc', text: (o.ok ? '✔ ' : '✖ ') + T(o.why) }));
        card.append(h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn', text: T(['See inside', 'شوف من جوه']), onclick: () => { MC.open(p.id); } }),
          h('button', { type: 'button', class: 'btn', text: T(['Remove', 'شيلها']), onclick: () => { V.remove(p.rec); delete ws.placed[s.id]; ws.checked = false; WS.renderSide(); WS.renderList(); V.kick(); } })));
      }
      side.append(card);
    }
    const ul = h('div', { class: 'm-parts' });
    for (const sl of b.slots) {
      const p = ws.placed[sl.id], o = p && sl.opts[p.id];
      const mark = !p ? (sl.need ? '○' : '◌') : !ws.checked ? '●' : o && o.ok ? '✔' : '✖';
      ul.append(h('div', { class: 'm-prow' + (ws.sel === sl.id ? ' on' : '') + (ws.checked ? (p ? (o && o.ok ? ' okr' : ' badr') : sl.need ? ' badr' : '') : ''), role: 'button', tabindex: 0, onclick: () => { ws.sel = sl.id; WS.renderList(); WS.renderSide(); V.kick(); } },
        h('span', { class: 'm-n', text: mark }), h('span', { class: 'm-pn', text: T(sl.name) + (p ? ' → ' + T(M.byId[p.id].name) : sl.need ? '' : ' ' + T(['(optional)', '(اختياري)'])) })));
    }
    side.append(h('h3', { text: T(['Build points', 'نقط التركيب']) }), ul);
    if (ws.checked) for (const sl of b.slots) { const p = ws.placed[sl.id]; if (!p && sl.need) side.append(h('p', { class: 'badc small', text: '✖ ' + T(sl.name) + ': ' + T(sl.miss || ['missing', 'ناقصة']) })); }
  };

  /* ---------------- quiz ---------------- */
  const QZ = {};
  let qz = null;
  QZ.start = function () {
    if (!ensureViewer()) return;
    qz = { n: 0, ok: 0, of: 10, q: null, answered: false };
    V.extra = null; V.onSlot = null; V.onTap = () => {}; ctl.innerHTML = ''; tray.innerHTML = '';
    QZ.renderList(); QZ.next();
  };
  QZ.renderList = function () {
    list.innerHTML = '';
    list.append(h('div', { class: 'm-pad' }, h('h3', { text: T(['Quiz', 'اختبر نفسك']) }), h('p', { class: 'mute', text: T(['10 questions from the 3D library: name the highlighted part, name the item, and practical questions.', '10 أسئلة من المكتبة: اسم الجزء المنوّر، اسم القطعة، وأسئلة عملية.']) }),
      h('p', { text: T(['Best score: ', 'أحسن نتيجة: ']) + (st.quizBest || 0) + '/10' }), h('button', { type: 'button', class: 'btn pri', text: T(['New quiz', 'اختبار جديد']), onclick: QZ.start })));
  };
  function makeQ() {
    const lib = M.lib.filter((c) => c.parts.length >= 4), kind = Math.random();
    if (kind < 0.5 && lib.length) {
      const c = lib[Math.floor(Math.random() * lib.length)], p = c.parts[Math.floor(Math.random() * c.parts.length)];
      const wrong = shuffle(c.parts.filter((x) => x.id !== p.id && T(x.name) !== T(p.name))).slice(0, 3).map((x) => x.name);
      return { c, sel: p.id, cut: !!p.cut || true, q: T(['What is the highlighted part of the ', 'إيه اسم الجزء المنوّر في ']) + T(c.name) + T(['?', '؟']), a: p.name, opts: shuffle([p.name, ...wrong]), why: p.role };
    }
    const withQ = M.lib.filter((c) => c.quiz && c.quiz.length);
    if (kind < 0.8 && withQ.length) {
      const c = withQ[Math.floor(Math.random() * withQ.length)], it = c.quiz[Math.floor(Math.random() * c.quiz.length)];
      return { c, q: T(it.q), a: it.a, opts: shuffle([it.a, ...it.w.slice(0, 3)]) };
    }
    const c = M.lib[Math.floor(Math.random() * M.lib.length)];
    const same = shuffle(M.lib.filter((x) => x.id !== c.id && x.cat === c.cat)), other = shuffle(M.lib.filter((x) => x.id !== c.id && x.cat !== c.cat));
    return { c, q: T(['What is this?', 'ده إيه؟']), a: c.name, opts: shuffle([c.name, ...same.concat(other).slice(0, 3).map((x) => x.name)]), why: c.info.what, hideName: true };
  }
  QZ.next = function () {
    if (qz.n >= qz.of) return QZ.end();
    const q = makeQ(); qz.q = q; qz.answered = false; qz.n++;
    V.show(q.c); V.setLabels(false);
    if (q.sel) { V.setCut(true); V.select(q.sel); V.fit(V.cur.parts.get(q.sel).g, false); V.fit(null, true); }
    side.innerHTML = '';
    side.append(h('div', { class: 'm-head' }, h('div', { class: 'mute', text: T(['Question', 'سؤال']) + ' ' + qz.n + '/' + qz.of + ' · ' + T(['score', 'النتيجة']) + ' ' + qz.ok }), h('h2', { text: q.q })));
    const box = h('div', { class: 'm-opts' });
    for (const o of q.opts) box.append(h('button', { type: 'button', class: 'btn m-opt', text: T(o), onclick: (e) => QZ.answer(o, e.currentTarget, box) }));
    side.append(box);
    if (phone()) side.scrollIntoView({ block: 'nearest' });
  };
  QZ.answer = function (o, el, box) {
    if (qz.answered) return; qz.answered = true;
    const right = T(o) === T(qz.q.a); if (right) qz.ok++;
    for (const b of box.children) { if (b.textContent === T(qz.q.a)) b.classList.add('okb'); }
    if (!right) el.classList.add('badb');
    side.append(h('p', { class: right ? 'okc' : 'badc', text: (right ? '✔ ' : '✖ ') + (right ? T(['Right.', 'صح.']) : T(['Answer: ', 'الإجابة: ']) + T(qz.q.a)) }));
    if (qz.q.why) side.append(h('p', { class: 'mute', text: T(qz.q.why) }));
    if (qz.q.hideName) V.setLabels(false);
    side.append(h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn pri', text: qz.n >= qz.of ? T(['See result', 'شوف النتيجة']) : T(['Next', 'التالي']), onclick: QZ.next }),
      h('button', { type: 'button', class: 'btn', text: T(['Open in library', 'افتحها في المكتبة']), onclick: () => MC.open(qz.q.c.id) })));
  };
  QZ.end = function () {
    if (qz.ok > (st.quizBest || 0)) { st.quizBest = qz.ok; save(); }
    side.innerHTML = '';
    side.append(h('div', { class: 'm-head' }, h('h2', { text: T(['Result', 'النتيجة']) + ': ' + qz.ok + '/' + qz.of })), h('p', { text: qz.ok >= 8 ? T(['Very good.', 'ممتاز.']) : qz.ok >= 5 ? T(['Good. Review the items you missed in the library.', 'كويس. راجع اللي غلطت فيه في المكتبة.']) : T(['Open the library, take items apart and try again.', 'افتح المكتبة، فك القطع وجرب تاني.']) }),
      h('button', { type: 'button', class: 'btn pri', text: T(['New quiz', 'اختبار جديد']), onclick: QZ.start }));
    QZ.renderList();
  };

  /* ---------------- public ---------------- */
  MC.open = function (id) { if (ui.show && ui.view && ui.view() !== 'mech') ui.show('mech'); st.mode = 'lib'; root.dataset.mode = 'lib'; for (const b of $('#mModes', root).children) b.classList.toggle('on', b.dataset.m === 'lib'); renderList(); openItem(id); };
  MC.init = function () {
    root = $('#mechRoot'); if (!root) return;
    ui.onRefresh(() => { if (!inited) return; const keep = st.mode; frameRefresh(keep); });
  };
  function frameRefresh(mode) {
    const id = st.id, wasV = V; if (V) { V.dispose(); V = null; }
    frame(); setMode(mode); if (id && mode === 'lib' && M.byId[id]) openItem(id, true);
    void wasV;
  }
  MC.onShow = function () {
    if (!inited) {
      inited = true; frame();
      if (M.errors.length) console.warn('mech data', M.errors);
      setMode(st.mode || 'lib');
      if (phone() && st.mode === 'lib') root.classList.remove('m-open');
    } else if (V) { V.kick(); }
    if (ui.mpanels) ui.mpanels.sync();
  };
  MC.openBuild = function (bid) { st.build = bid; save(); if (ui.show && ui.view && ui.view() !== 'mech') ui.show('mech'); if (!inited) MC.onShow(); setMode('work'); };
  MC.viewer = () => V;
  MC.state = () => ({ mode: st.mode, id: st.id, ws, qz, game });
})(typeof window !== 'undefined' ? window : globalThis);
