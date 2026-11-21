/* Line view: draw a packaging line on a 0.5 m grid and run cartons through it. */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, $ = ui.$;
  const LN = EL.line, CELL = LN.CELL, NS = 'http://www.w3.org/2000/svg';
  const LU = (ui.line = { sel: null, view: { x: 40, y: 40, k: 0.12 } });
  const B = () => EL.bench;
  const C = () => B().ed.c;
  const line = (make) => { const c = C(); if (!c.line && make) c.line = LN.newLine(); return c.line; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const DIR = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  let host, svg, world, layEl, layCar, layOver, tools, last = 0, elSig = '';

  LU.init = function () {
    host = $('#lineHost');
    svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'cv lncv');
    svg.innerHTML = `<defs><pattern id="lnGrid" width="${CELL}" height="${CELL}" patternUnits="userSpaceOnUse"><path d="M${CELL} 0 H0 V${CELL}" fill="none" stroke="#1f2b42" stroke-width="6"/></pattern>
      <pattern id="lnChain" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#4a5568"/><path d="M0 20 H40" stroke="#5f6b80" stroke-width="16"/><path d="M20 0 V40" stroke="#3a4456" stroke-width="3"/></pattern></defs>
`;
    world = document.createElementNS(NS, 'g');
    world.innerHTML = '<rect x="-100000" y="-100000" width="200000" height="200000" fill="url(#lnGrid)" class="ln-bg"/>';
    layEl = document.createElementNS(NS, 'g'); layCar = document.createElementNS(NS, 'g'); layOver = document.createElementNS(NS, 'g');
    world.append(layEl, layCar, layOver); svg.appendChild(world); host.appendChild(svg);
    chrome();
    ui.onRefresh(() => { if (tools) tools.remove(); const e = $('#lnEmpty'); if (e) e.remove(); chrome(); elSig = ''; LU.render(true); });
    bindPointer();
  };
  function chrome() {
    tools = h('div', { class: 'pl-tools' },
      h('button', { class: 'btn sm pri', onclick: () => LU.addMenu(), text: '+ ' + T(['Add at the end of the line', 'ضيف في آخر الخط']) }),
      h('button', { class: 'btn sm ln-run', onclick: () => { const ln = line(); if (!ln) return; ln.run = !ln.run; ui.click(); LU.render(true); }, text: '' }),
      h('button', { class: 'btn sm', onclick: () => { const ln = line(); if (ln) { LN.clearJam(ln); ui.toast(['Jam cleared, line running.', 'الزنقة اتشالت والخط شغال.'], 'ok'); LU.render(true); } }, text: T(['Clear jam', 'شيل الزنقة']) }),
      h('button', { class: 'btn sm', onclick: () => { const ln = line(); if (ln) { LN.reset(ln); LU.render(true); LU.inspector(); } }, text: T(['Empty the line', 'فضّي الخط']) }),
      h('button', { class: 'btn sm', onclick: () => LU.zoom(1.25), text: '+' }), h('button', { class: 'btn sm', onclick: () => LU.zoom(0.8), text: '−' }),
      h('button', { class: 'btn sm', onclick: () => LU.fit(), text: T(['Fit', 'ملّي']) }),
      h('button', { class: 'btn sm ln-rot', onclick: () => LU.rotate(), text: '⟳ ' + T(['Rotate', 'لف']) }),
      h('button', { class: 'btn sm bad ln-del', onclick: () => LU.del(), text: T(['Delete', 'حذف']) }),
      h('button', { class: 'btn sm', onclick: () => LU.guide(), text: T(['Design rules', 'قواعد التصميم']) }));
    host.appendChild(tools);
    host.appendChild(h('div', { class: 'pl-empty', id: 'lnEmpty' }, h('b', { text: T(['No line yet', 'مفيش خط لسه']) }),
      h('p', { class: 'mute', text: T(['Start with the cartoner discharge, then add conveyors, the checkweigher, serialization, the reject station, turners and the case packer. Each new element is added at the end of the line, facing the same way.', 'ابدأ بخروج الكارتونر، وبعدين ضيف سيور والميزان والسيريالايزيشن ومحطة الرفض والترنر والكيس باكر. كل عنصر جديد بيتضاف في آخر الخط وفي نفس الاتجاه.']) }),
      h('div', { class: 'row wrap', style: { justifyContent: 'center' } }, h('button', { class: 'btn pri', onclick: () => { LU.add('SRC'); }, text: '+ ' + T(['Cartoner discharge', 'خروج الكارتونر']) }), h('button', { class: 'btn', onclick: () => EL.projects.open('line', 'line'), text: T(['Open the example line', 'افتح الخط المثال']) }))));
  }
  function applyView() { world.setAttribute('transform', `translate(${LU.view.x},${LU.view.y}) scale(${LU.view.k})`); }
  LU.zoom = function (f, cx, cy) { const r = host.getBoundingClientRect(), v = LU.view; cx = cx == null ? r.width / 2 : cx - r.left; cy = cy == null ? r.height / 2 : cy - r.top; const k = Math.max(0.03, Math.min(0.8, v.k * f)); v.x = cx - ((cx - v.x) * k) / v.k; v.y = cy - ((cy - v.y) * k) / v.k; v.k = k; applyView(); };
  LU.fit = function () {
    const ln = line(), r = host.getBoundingClientRect();
    if (!ln || !ln.els.length || !r.width) { LU.view = { x: 40, y: 40, k: 0.12 }; applyView(); return; }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const e of ln.els) for (const c of LN.geom(e).cells) { x0 = Math.min(x0, c[0]); y0 = Math.min(y0, c[1]); x1 = Math.max(x1, c[0] + 1); y1 = Math.max(y1, c[1] + 1); }
    x0 = (x0 - 1) * CELL; y0 = (y0 - 1) * CELL; x1 = (x1 + 1) * CELL; y1 = (y1 + 1) * CELL;
    const k = Math.max(0.03, Math.min(0.5, Math.min(r.width / (x1 - x0), (r.height - 50) / (y1 - y0))));
    LU.view = { k, x: (r.width - (x1 - x0) * k) / 2 - x0 * k, y: 50 + (r.height - 50 - (y1 - y0) * k) / 2 - y0 * k };
    applyView();
  };
  const toWorld = (cx, cy) => { const r = svg.getBoundingClientRect(), v = LU.view; return { x: (cx - r.left - v.x) / v.k, y: (cy - r.top - v.y) / v.k }; };

  /* ---------- drawing ---------- */
  function band(e, G, w, fill, extra) {
    if (!G.curve) { const d = DIR[G.din], n = [-d[1], d[0]], a = G.a, b = G.b; const p = (pt, s) => (pt[0] + n[0] * s) + ' ' + (pt[1] + n[1] * s); return `<path d="M${p(a, w / 2)} L${p(b, w / 2)} L${p(b, -w / 2)} L${p(a, -w / 2)} Z" fill="${fill}" ${extra || ''}/>`; }
    const r1 = G.R - w / 2, r2 = G.R + w / 2, c = G.ctr, a = G.a, b = G.b;
    const u = (pt, r) => { const vx = pt[0] - c[0], vy = pt[1] - c[1], L = Math.hypot(vx, vy); return (c[0] + vx / L * r) + ' ' + (c[1] + vy / L * r); };
    const sw = e.props.left ? 0 : 1;
    return `<path d="M${u(a, r2)} A${r2} ${r2} 0 0 ${sw} ${u(b, r2)} L${u(b, r1)} A${r1} ${r1} 0 0 ${1 - sw} ${u(a, r1)} Z" fill="${fill}" ${extra || ''}/>`;
  }
  function guides(e, G, w) {
    if (!G.curve) { const d = DIR[G.din], n = [-d[1], d[0]], a = G.a, b = G.b; let s = ''; for (const sg of [1, -1]) s += `<line x1="${a[0] + n[0] * w / 2 * sg}" y1="${a[1] + n[1] * w / 2 * sg}" x2="${b[0] + n[0] * w / 2 * sg}" y2="${b[1] + n[1] * w / 2 * sg}" class="ln-guide"/>`; return s; }
    const c = G.ctr, sw = e.props.left ? 0 : 1; let s = '';
    for (const r of [G.R - w / 2, G.R + w / 2]) { const u = (pt) => { const vx = pt[0] - c[0], vy = pt[1] - c[1], L = Math.hypot(vx, vy); return (c[0] + vx / L * r) + ' ' + (c[1] + vy / L * r); }; s += `<path d="M${u(G.a)} A${r} ${r} 0 0 ${sw} ${u(G.b)}" class="ln-guide" fill="none"/>`; }
    return s;
  }
  const MCOL = { CW: '#2b6fd6', SER: '#7b4bd1', TE: '#1f9e8f', REJ: '#c8402a', TURN: '#b88a18', TWIST: '#b88a18', CP: '#1f7a3a', SRC: '#3a4a6b', EXIT: '#3a4a6b', GAP: '#556' };
  const ICON = { CW: '⚖', SER: '▦', TE: '✓', REJ: '✕', TURN: '↻', TWIST: '⤾', CP: '▣', SRC: '▶', EXIT: '⏏', GAP: '⇥', BUF: '≡' };
  function drawEl(e, sel, ln) {
    const G = LN.geom(e), D = LN.defs[e.type], st = e.st || {};
    const chain = +e.props.chain || 152, gw = +e.props.guide || chain;
    let s = `<g data-e="${e.id}" class="ln-el${sel ? ' sel' : ''}">`;
    const cells = G.cells;
    if (sel) for (const c of cells) s += `<rect x="${c[0] * CELL + 15}" y="${c[1] * CELL + 15}" width="${CELL - 30}" height="${CELL - 30}" rx="40" class="ln-selbox"/>`;
    for (const c of cells) s += `<rect x="${c[0] * CELL}" y="${c[1] * CELL}" width="${CELL}" height="${CELL}" fill="transparent"/>`;
    if (e.type === 'SRC' || D.sink) {
      const x0 = Math.min(...cells.map((c) => c[0])) * CELL, y0 = Math.min(...cells.map((c) => c[1])) * CELL, x1 = (Math.max(...cells.map((c) => c[0])) + 1) * CELL, y1 = (Math.max(...cells.map((c) => c[1])) + 1) * CELL;
      s += `<rect x="${x0 + 30}" y="${y0 + 30}" width="${x1 - x0 - 60}" height="${y1 - y0 - 60}" rx="40" fill="${MCOL[e.type] || '#3a4a6b'}" stroke="#9aa5b6" stroke-width="12" ${st.stop ? 'stroke-dasharray="60 40"' : ''}/>`;
      s += `<text class="ln-icon" x="${(x0 + x1) / 2}" y="${(y0 + y1) / 2 + 60}" text-anchor="middle">${ICON[e.type] || ''}</text>`;
      s += `<text class="ln-tag" x="${(x0 + x1) / 2}" y="${y1 + 110}" text-anchor="middle">${esc(e.tag)}</text>`;
    } else {
      s += band(e, G, chain + 40, '#2a3344') + band(e, G, chain, e.props.belt ? '#1d2430' : 'url(#lnChain)');
      s += guides(e, G, gw);
      if (D.machine) {
        const m = LN.at(e, G, G.len / 2), d = DIR[G.din], n = [-d[1], d[0]], hw = Math.max(gw, chain) / 2 + 70, hl = G.len / 2 - 40;
        const pts = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, b]) => (m.x + d[0] * hl * a + n[0] * hw * b) + ' ' + (m.y + d[1] * hl * a + n[1] * hw * b)).join(' L');
        s += `<path d="M${pts} Z" fill="${MCOL[e.type]}" fill-opacity=".35" stroke="${MCOL[e.type]}" stroke-width="14" ${st.stop ? 'stroke-dasharray="60 40"' : ''}/>`;
        s += `<text class="ln-icon" x="${m.x - n[0] * (hw + 110)}" y="${m.y - n[1] * (hw + 110) + 50}" text-anchor="middle">${ICON[e.type] || ''}</text>`;
      }

      // flow arrow
      const m2 = LN.at(e, G, G.len * 0.15);
      const dd = G.curve ? DIR[G.din] : DIR[G.din];
      if (!D.machine) s += `<path d="M${m2.x - dd[0] * 40 + dd[1] * 30} ${m2.y - dd[1] * 40 - dd[0] * 30} L${m2.x + dd[0] * 40} ${m2.y + dd[1] * 40} L${m2.x - dd[0] * 40 - dd[1] * 30} ${m2.y - dd[1] * 40 + dd[0] * 30}" fill="none" stroke="#FDC300" stroke-width="12"/>`;
    }
    const lp = LN.at(e, G, G.len / 2), d = DIR[G.din], n = [-d[1], d[0]];
    if (!(D.sink || e.type === 'SRC')) {
    const off = (Math.max(gw, chain) / 2 + (D.machine ? 330 : 150));
    const sg = D.machine ? -1 : 1;
    s += `<text class="ln-tag" x="${lp.x - n[0] * off * sg}" y="${lp.y - n[1] * off * sg + 30}" text-anchor="middle">${esc(e.tag)}${e.props.speed != null && !D.sink && !D.machine && e.type !== 'SRC' ? ' · ' + e.props.speed + ' m/min' : ''}${e.type === 'BUF' && st.fill != null ? ' · ' + Math.round(st.fill * 100) + ' %' : ''}</text>`;
    }
    if (ln && ln.jam && ln.jam.id === e.id) s += `<circle cx="${lp.x}" cy="${lp.y}" r="260" class="ln-jam"/>`;
    return s + '</g>';
  }
  function drawCartons(ln) {
    const r = LN.route(ln), car = ln.carton;
    let s = '';
    for (const k of ln.cartons || []) {
      const p = LN.pos(r, k.s); if (!p) continue;
      const f = LN.foot(car, k.o), ang = p.h * 90 + (p.ang ? p.ang * 180 / Math.PI : 0);
      const stand = f.h > f.al || f.h > f.ac;
      const fill = k.jam ? '#ff5a4a' : stand ? '#a9bfe0' : '#eef3fa';
      s += `<g transform="translate(${p.x.toFixed(0)},${p.y.toFixed(0)}) rotate(${ang.toFixed(1)})"><rect x="${-f.al / 2}" y="${-f.ac / 2}" width="${f.al}" height="${f.ac}" rx="4" fill="${fill}" stroke="${k.flag ? '#ff3b30' : '#2b4a7a'}" stroke-width="${k.flag ? 8 : 3}"/>` +
        (k.o === 'fa' || k.o === 'fl' ? `<rect x="${-f.al / 2 + 6}" y="${-f.ac / 2 + 6}" width="${Math.min(f.al, f.ac) * 0.35}" height="${Math.min(f.al, f.ac) * 0.35}" fill="${k.serial ? '#111' : '#cfd9e6'}"/>` : `<line x1="${-f.al / 2}" y1="0" x2="${f.al / 2}" y2="0" stroke="#2b4a7a" stroke-width="4"/>`) + '</g>';
    }
    return s;
  }
  LU.render = function (force) {
    if (!svg) return;
    const ln = line(), now = performance.now();
    if (!force && now - last < 80) return; last = now;
    const em = $('#lnEmpty'); if (em) em.style.display = ln && ln.els.length ? 'none' : '';
    tools.querySelector('.ln-del').style.display = LU.sel ? '' : 'none';
    tools.querySelector('.ln-rot').style.display = LU.sel ? '' : 'none';
    const rb = tools.querySelector('.ln-run'); rb.textContent = ln && ln.run !== false ? '■ ' + T(['Stop line', 'وقّف الخط']) : '▶ ' + T(['Start line', 'شغّل الخط']); rb.className = 'btn sm ln-run ' + (ln && ln.run !== false ? 'ok' : 'warn');
    if (!ln) { layEl.innerHTML = ''; layCar.innerHTML = ''; return; }
    if (LU.sel && !ln.els.some((e) => e.id === LU.sel)) LU.sel = null;
    const sig = JSON.stringify(ln.els.map((e) => [e.id, e.x, e.y, e.d, e.props, e.st && e.st.stop, e.st && e.st.fill != null ? Math.round(e.st.fill * 20) : 0])) + LU.sel + (ln.jam ? ln.jam.id : '');
    if (force || sig !== elSig) {
      elSig = sig;
      const r = LN.route(ln), onRoute = new Set(r.els.map((e) => e.id));
      let s = '';
      for (const e of ln.els) s += drawEl(e, LU.sel === e.id, ln).replace('class="ln-el', 'class="ln-el' + (onRoute.has(e.id) ? '' : ' off'));
      // path trace
      if (r.els.length > 1) { let d = ''; for (let x = 0; x <= r.total; x += 60) { const p = LN.pos(r, x); d += (d ? ' L' : 'M') + p.x.toFixed(0) + ' ' + p.y.toFixed(0); } s += `<path d="${d}" class="ln-path"/>`; }
      layEl.innerHTML = s;
    }
    layCar.innerHTML = drawCartons(ln);
  };
  LU.frame = function () { if (B().view === 'line') { LU.render(); const t = performance.now(); if (t - (LU._lt || 0) > 400) { LU._lt = t; LU.live(); } } };

  LU.preview = function (ln, w, hh) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const e of ln.els) for (const c of LN.geom(e).cells) { x0 = Math.min(x0, c[0]); y0 = Math.min(y0, c[1]); x1 = Math.max(x1, c[0] + 1); y1 = Math.max(y1, c[1] + 1); }
    if (x0 > x1) return '';
    const vb = [(x0 - 1) * CELL, (y0 - 1) * CELL, (x1 - x0 + 2) * CELL, (y1 - y0 + 2) * CELL].join(' ');
    return `<svg viewBox="${vb}" width="${w}" height="${hh}" preserveAspectRatio="xMidYMid meet" style="background:#0d1524;width:100%;height:auto"><defs><pattern id="lnChainP" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#4a5568"/></pattern></defs>${ln.els.map((e) => drawEl(e, false, null).replace(/url\(#lnChain\)/g, 'url(#lnChainP)')).join('')}</svg>`;
  };
  const GUIDE = [
    ['The cartoner sets the pace. Everything after it must be 10-30 % faster (the V-curve).', 'الكارتونر هو اللي بيحدد سرعة الخط. كل حاجة بعده لازم تبقى أسرع منه بـ 10 لـ 30 % (منحنى V).'],
    ['Guides = carton width across the flow + 3 to 5 mm. Too tight jams, too loose twists.', 'الجايد = عرض العلبة اللي بالعرض على الخط + 3 لـ 5 مم. لو ضيق العلبة تزنق، ولو واسع العلبة تلف.'],
    ['Check which side of the carton is across the flow before choosing a chain width.', 'قبل ما تختار عرض الجنزير، شوف أنهي جنب من العلبة بالعرض على الخط.'],
    ['Pitch = speed / rate. Before the checkweigher, the gap must leave only one carton on the weigh pan.', 'المسافة بين العلبتين = السرعة ÷ المعدل. قبل الميزان لازم المسافة تسيب علبة واحدة بس على كفة الميزان.'],
    ['Raise speed in steps (no more than 1.5x at once, 1.3x for standing cartons) to open gaps without tipping or shingling.', 'زوّد السرعة على مراحل (مش أكتر من 1.5 مرة في المرة، و1.3 للعلبة الواقفة) عشان تفتح مسافة من غير ما العلبة تقع أو تركب على اللي قدامها.'],
    ['A curve changes direction, not orientation. Only turners and twist belts turn the carton.', 'الكيرف بيغيّر الاتجاه بس، مش وضع العلبة. اللي بيلف العلبة هو الترنر أو السير الملفوف (twist).'],
    ['Keep cartons flat-across through serialization and tamper-evident labeling, then turn them for the case packer.', 'خلي العلبة نايمة وطولها بالعرض في السيريالايزيشن والليبل اللي بيقفل العلبة، وبعدين لفها قبل الكيس باكر.'],
    ['Put a buffer before the slowest downstream machine (the case packer pauses at every case change), sized for 30-60 s, with high and low level sensors. After a buffer, open the gaps again with a spacing belt before any turner.', 'حط بافر قبل أبطأ ماكينة بعد الكارتونر (الكيس باكر بيقف مع كل تغيير كرتونة)، يكفي 30 لـ 60 ثانية، وعليه حساس مستوى عالي وحساس مستوى واطي. بعد البافر افتح المسافات تاني بسير فتح مسافات قبل أي ترنر.'],
    ['Every reject must be confirmed by a sensor. If it is not confirmed, the line stops. A bad carton must never reach a case.', 'أي علبة مرفوضة لازم حساس يتأكد إنها وقعت في الصندوق. لو ما اتأكدش، الخط يقف. مفيش علبة غلط توصل الكرتونة أبدًا.'],
    ['Output = the slowest element x OEE. Find the bottleneck first, then fix stops, speed losses and rejects.', 'إنتاج الخط = أبطأ ماكينة × الـ OEE. دوّر على الماكينة البطيئة الأول، وبعدين قلل الوقفات والبطء والمرفوض.'],
  ];
  LU.guide = function () { ui.modal([h('h3', { text: T(['Line design rules', 'قواعد تصميم الخط']) }), h('div', { class: 'ln-guidebox' }, h('ol', null, GUIDE.map((g2) => h('li', { text: T(g2) }))))]); };

  /* ---------- pointer ---------- */
  function bindPointer() {
    const ptrs = new Map(); let g0 = null, pinch = null;
    svg.addEventListener('pointerdown', (e) => {
      svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: LU.view.k }; g0 = null; return; }
      const el = e.target.closest && e.target.closest('[data-e]');
      g0 = { x: e.clientX, y: e.clientY, moved: false, vx: LU.view.x, vy: LU.view.y };
      if (el) { const it = line().els.find((x) => x.id === el.dataset.e); g0.el = it; g0.ex = it.x; g0.ey = it.y; }
    });
    svg.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; LU.zoom((pinch.k * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d / LU.view.k, (a.x + b.x) / 2, (a.y + b.y) / 2); return; }
      if (!g0) return;
      const dx = e.clientX - g0.x, dy = e.clientY - g0.y;
      if (!g0.moved && Math.hypot(dx, dy) > 7) { g0.moved = true; if (g0.el && B().ed.mode === 'build') B().ed.push(); }
      if (!g0.moved) return;
      if (g0.el && B().ed.mode === 'build') { const nx = g0.ex + Math.round(dx / LU.view.k / CELL), ny = g0.ey + Math.round(dy / LU.view.k / CELL); if (nx !== g0.el.x || ny !== g0.el.y) { g0.el.x = nx; g0.el.y = ny; LN.dirty(line()); LU.render(true); } return; }
      LU.view.x = g0.vx + dx; LU.view.y = g0.vy + dy; applyView();
    });
    const end = (e) => {
      ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
      if (!g0) return; const G0 = g0; g0 = null;
      if (G0.moved) { if (G0.el) changed(); return; }
      if (G0.el) {
        if (B().ed.mode === 'test' && (LN.defs[G0.el.type].machine || G0.el.type === 'SRC')) { G0.el.st.stop = !G0.el.st.stop; ui.click(); ui.toast(G0.el.tag + ': ' + (G0.el.st.stop ? T(['stopped', 'واقف']) : T(['running', 'شغال'])), G0.el.st.stop ? 'warn' : 'ok', 1800); }
        select(G0.el.id);
      } else select(null);
    };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.addEventListener('wheel', (e) => { e.preventDefault(); LU.zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); }, { passive: false });
  }
  function changed() { LN.dirty(line()); elSig = ''; LU.render(true); LU.inspector(); B().save(); }
  function select(id) { LU.sel = id; LU.render(true); LU.inspector(); }
  LU.select = select;
  LU.del = function () { const ln = line(); if (!ln || !LU.sel) return; B().ed.push(); LN.remove(ln, LU.sel); LU.sel = null; changed(); };
  LU.rotate = function () { const ln = line(); const e = ln && ln.els.find((x) => x.id === LU.sel); if (!e) return; if (B().ed.mode !== 'build') { ui.toast(['Switch to Build mode to change the layout.', 'حوّل لوضع البناء عشان تغيّر الشكل.'], 'warn'); return; } B().ed.push(); e.d = (e.d + 1) & 3; changed(); };
  LU.keydown = function (e) {
    if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && B().ed.mode === 'build') { LU.del(); e.preventDefault(); }
    else if (e.key === 'r' || e.key === 'R') LU.rotate();
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.shiftKey ? B().ed.redo() : B().ed.undo(); e.preventDefault(); }
    else if (e.key === 'Escape') select(null);
  };
  LU.add = function (type) {
    const ln = line(true);
    if (type === 'SRC' && ln.els.some((e) => e.type === 'SRC')) { ui.toast(['The line already has a cartoner discharge.', 'الخط فيه خروج كارتونر بالفعل.'], 'warn'); return; }
    B().ed.push();
    const e = type === 'SRC' || !ln.els.length ? LN.add(ln, type, 1, 2, 0) : LN.append(ln, type);
    if (B().ed.mode !== 'build') B().setMode('build');
    select(e.id); changed();
    ui.toast(T(['Added ', 'اتضاف ']) + e.tag + '. ' + T(['Tap "Rotate" or drag it to change the layout.', 'اضغط "لف" أو اسحبه عشان تغيّر الشكل.']), 'ok', 3500);
    requestAnimationFrame(() => { const r = host.getBoundingClientRect(), G = LN.geom(e), v = LU.view, sx = v.x + G.b[0] * v.k, sy = v.y + G.b[1] * v.k; if (sx < 20 || sx > r.width - 20 || sy < 60 || sy > r.height - 20) LU.fit(); });
  };
  LU.addMenu = function () {
    const grid = h('div', { class: 'pl-menu' });
    const m = ui.modal([h('h3', { text: T(['Add at the end of the line', 'ضيف في آخر الخط']) }), grid]);
    for (const k of LN.order) grid.appendChild(h('button', { class: 'pl-mi', onclick: () => { m.remove(); LU.add(k); } }, icon(k), h('span', { text: T(LN.defs[k].name) })));
  };
  function icon(k) {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 100 60');
    s.innerHTML = `<rect x="4" y="20" width="92" height="20" rx="4" fill="#4a5568"/><rect x="${LN.defs[k].machine || LN.defs[k].sink || k === 'SRC' ? 25 : 40}" y="${LN.defs[k].machine || LN.defs[k].sink || k === 'SRC' ? 6 : 22}" width="${LN.defs[k].machine || LN.defs[k].sink || k === 'SRC' ? 50 : 20}" height="${LN.defs[k].machine || LN.defs[k].sink || k === 'SRC' ? 48 : 16}" rx="6" fill="${MCOL[k] || '#eef3fa'}"/><text x="50" y="38" text-anchor="middle" font-size="20" fill="#fff">${ICON[k] || (k === 'CURVE' ? '↰' : '')}</text>`;
    return s;
  }
  LU.palette = function (root, q) {
    root.innerHTML = '';
    const term = (q || '').trim().toLowerCase(), items = h('div', { class: 'pitems' });
    for (const k of LN.order) { const n = T(LN.defs[k].name); if (term && !n.toLowerCase().includes(term)) continue; items.appendChild(h('div', { class: 'pit', onclick: () => { LU.add(k); if (window.innerWidth <= 900) B().sheet(null); } }, icon(k), h('span', { text: n }))); }
    root.appendChild(h('div', { class: 'pgrp' }, h('div', { class: 'pgh' }, h('span', { text: T(['Line elements (added at the end)', 'عناصر الخط (بتتضاف في الآخر)']) })), items));
  };

  /* ---------- inspector ---------- */
  const LAB = { rate: ['Rate (cartons/min)', 'المعدل (علبة/د)'], ori: ['Carton leaves as', 'العلبة بتطلع'], speed: ['Speed (m/min)', 'السرعة (متر/د)'], len: ['Length (cells of 0.5 m)', 'الطول (خانات 0.5 متر)'], belt: ['Belt (not chain)', 'سير مطاط (مش جنزير)'], chain: ['Chain width (mm)', 'عرض الجنزير (مم)'], guide: ['Guide width (mm)', 'عرض الجايد (مم)'], left: ['Turns left', 'بيلف شمال'], ri: ['Inner radius (mm)', 'نص القطر الداخلي (مم)'], hl: ['High-level eye (%)', 'حساس المستوى العالي (%)'], ll: ['Low-level eye (%)', 'حساس المستوى الواطي (%)'], pan: ['Weigh pan length (mm)', 'طول كفة الميزان (مم)'], nom: ['Nominal weight (g)', 'الوزن المظبوط (جم)'], tol: ['Tolerance ± (g)', 'السماحية ± (جم)'], maxcpm: ['Max rate (cartons/min)', 'أقصى معدل (علبة/د)'], mingap: ['Min gap for the sensor (mm)', 'أقل مسافة للحساس (مم)'], bin: ['Bin capacity (cartons)', 'سعة الصندوق (علبة)'], per: ['Cartons per case', 'علب في الكرتونة'], need: ['Needs cartons', 'محتاج العلب'], air: ['Reject air OK (confirmation works)', 'هوا الرفض تمام (التأكيد شغال)'], consec: ['Stop after rejects in a row', 'يقف بعد رفض ورا بعض'], change: ['Case change time (s)', 'زمن تغيير الكرتونة (ث)'] };
  const ORIS = () => LN.ORI.map((o) => [o, T(LN.oriName[o])]);
  LU.inspector = function () {
    if (B().view !== 'line') return;
    const root = $('#pane-part'); root.innerHTML = '';
    const ln = line(), e = ln && LU.sel ? ln.els.find((x) => x.id === LU.sel) : null;
    const edit = (fn) => { B().ed.push(); fn(); changed(); };
    if (!e) {
      const c = ln ? ln.carton : LN.newLine().carton;
      const card = h('div', { class: 'card' }, h('h3', { text: T(['Carton', 'العلبة']) }), h('p', { class: 'mute sm', text: T(['L = between the end flaps, W, H = thickness. Pick a pack or type the sizes.', 'L = بين الطرفين، W العرض، H السُمك. اختار علبة جاهزة أو اكتب المقاسات.']) }));
      const pre = [['1×10', 105, 50, 18, 15], ['2×10', 115, 60, 22, 28], ['3×10', 120, 60, 25, 40], ['6×10', 140, 80, 50, 90]];
      card.appendChild(h('div', { class: 'row wrap' }, pre.map(([n, L, W, H, gg]) => h('button', { class: 'btn sm', onclick: () => edit(() => { const l2 = line(true); Object.assign(l2.carton, { L, W, H, g: gg }); for (const x of l2.els) if (x.type === 'CW') x.props.nom = gg; }), text: n }))));
      for (const k of ['L', 'W', 'H', 'g']) { card.appendChild(h('label', { class: 'f', text: k === 'g' ? T(['Weight (g)', 'الوزن (جم)']) : k + ' (mm)' })); card.appendChild(h('input', { type: 'number', value: c[k], min: 1, max: 1000, onchange: (ev) => { const v = +ev.target.value; if (v > 0 && v < 1000) edit(() => { line(true).carton[k] = v; }); else { ev.target.value = c[k]; ui.toast(['Use a size between 1 and 999.', 'اكتب مقاس بين 1 و999.'], 'warn'); } } })); }
      root.appendChild(card);
      root.appendChild(h('div', { class: 'card', id: 'lnStats' }));
      root.appendChild(h('div', { class: 'card', id: 'lnChecks' }));
      LU.live(true);
      return;
    }
    const D = LN.defs[e.type];
    root.appendChild(h('div', { class: 'card' }, h('div', { class: 'row' }, h('input', { type: 'text', value: e.tag, maxlength: 10, style: { maxWidth: '100px' }, onchange: (ev) => { const v = ev.target.value.replace(/[^\w\-.]/g, '').slice(0, 10); if (v) edit(() => { e.tag = v; }); } }), h('b', { class: 'grow', text: T(D.name) })), h('p', { class: 'mute', text: T(D.info) }),
      h('div', { class: 'row wrap' }, h('button', { class: 'btn', onclick: () => LU.rotate(), text: '⟳ ' + T(['Rotate', 'لف']) }), D.machine || e.type === 'SRC' ? h('button', { class: 'btn ' + (e.st.stop ? 'ok' : 'warn'), onclick: () => { e.st.stop = !e.st.stop; LU.render(true); LU.inspector(); }, text: e.st.stop ? T(['Start it', 'شغّله']) : T(['Stop it (simulate a stop)', 'وقّفه (محاكاة وقفة)']) }) : null, h('button', { class: 'btn bad', onclick: () => LU.del(), text: T(['Delete', 'حذف']) }))));
    const card = h('div', { class: 'card' }, h('h3', { text: T(['Settings', 'الإعدادات']) }));
    for (const k of Object.keys(e.props)) {
      const v = e.props[k]; let inp;
      if (k === 'ori' || k === 'need') inp = h('select', { onchange: (ev) => edit(() => { e.props[k] = ev.target.value; }) }, ORIS().map(([a, b]) => h('option', { value: a, selected: a === v ? true : null, text: b })));
      else if (k === 'chain') inp = h('select', { onchange: (ev) => edit(() => { e.props.chain = +ev.target.value; }) }, LN.CHAINS.map((w) => h('option', { value: w, selected: w === +v ? true : null, text: w + ' mm' })));
      else if (k === 'ri') inp = h('select', { onchange: (ev) => edit(() => { e.props.ri = +ev.target.value; }) }, [150, 300, 500].map((w) => h('option', { value: w, selected: w === +v ? true : null, text: w + ' mm' })));
      else if (typeof v === 'boolean') inp = h('button', { class: 'btn ' + (v ? 'on' : ''), onclick: () => edit(() => { e.props[k] = !e.props[k]; }), text: v ? T(['Yes', 'أيوه']) : T(['No', 'لأ']) });
      else if (typeof v === 'number') inp = h('input', { type: 'number', value: v, step: 'any', min: 0, onchange: (ev) => { const x = +ev.target.value; if (isFinite(x) && x >= 0) edit(() => { e.props[k] = k === 'len' ? Math.max(1, Math.min(24, Math.round(x))) : Math.min(100000, x); }); } });
      else continue;
      card.appendChild(h('label', { class: 'f', text: T(LAB[k] || [k, k]) })); card.appendChild(inp);
    }
    if (e.props.speed != null) {
      const mot = C().parts.filter((p) => ['MOT3', 'MOT1', 'MOTDC'].includes(p.type));
      card.appendChild(h('label', { class: 'f', text: T(['Drive motor on the panel (optional)', 'موتور التشغيل في اللوحة (اختياري)']) }));
      card.appendChild(h('select', { onchange: (ev) => edit(() => { e.props.motor = ev.target.value; }) }, [h('option', { value: '', text: T(['(none: runs with the line)', '(مفيش: بيمشي مع الخط)']) })].concat(mot.map((p) => h('option', { value: p.tag, selected: p.tag === e.props.motor ? true : null, text: p.tag })))));
    }
    root.appendChild(card);
  };
  LU.live = function (force) {
    if (B().view !== 'line') return;
    const ln = line(), st = $('#lnStats'), ck = $('#lnChecks');
    if (st) {
      const S = ln && ln.stats ? ln.stats : null;
      let s = `<h3>${esc(T(['Line results', 'نتايج الخط']))}</h3>`;
      if (!S) s += `<p class="mute">${esc(T(['Start the line to see results.', 'شغّل الخط عشان تشوف النتايج.']))}</p>`;
      else {
        const row = (k, v) => `<div class="kv"><span>${esc(T(k))}</span><b class="ltr">${esc(v)}</b></div>`;
        s += row(['Output', 'الإنتاج'], LN.rate(ln).toFixed(0) + ' / min') + row(['Good cartons', 'علب سليمة'], S.good) + row(['Cases filled', 'كراتين اتقفلت'], S.cases + (S.inCase ? ' + ' + S.inCase : '')) + row(['Transit time (start to end)', 'زمن الرحلة (من البداية للآخر)'], LN.transit(ln).toFixed(1) + ' s') + row(['On the line now', 'على الخط دلوقتي'], (ln.cartons || []).length) + row(['Cartoner stops (buffer full)', 'وقفات الكارتونر (البافر اتملى)'], S.stops);
        for (const k of Object.keys(S.rej)) s += row(T(['Rejected: ', 'مرفوض: ']) + T(LN.REJ[k] || [k, k]), S.rej[k]);
        if (ln.jam) s += `<div class="pl-prob bad">${esc(T(ln.jam.msg))}</div>`;
      }
      if (force || s !== st._s) { st._s = s; st.innerHTML = s; }
    }
    if (ck) {
      const iss = ln ? LN.checks(ln) : [];
      const sig = iss.map((x) => x.lvl + x.tag + T(x.msg)).join('|');
      if (force || sig !== ck._s) {
        ck._s = sig; ck.innerHTML = '';
        ck.appendChild(h('h3', { text: T(['Line check', 'فحص الخط']) }));
        if (!iss.length) ck.appendChild(h('p', { class: 'mute', text: ln && ln.els.length ? T(['No problems found.', 'مفيش مشاكل.']) : T(['Empty.', 'فاضي.']) }));
        for (const x of iss) ck.appendChild(h('div', { class: 'pl-prob ' + x.lvl, onclick: () => { if (x.id) select(x.id); } }, x.tag ? h('b', { text: x.tag }) : null, ' ', T(x.msg)));
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
