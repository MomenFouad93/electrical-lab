/* Inspect tab: photo + guided fault finding for real equipment (motors, drives, boards, panels...).
   Offline: the knowledge base (EL.kb) ranks causes from symptoms, what you see and what you measure, and picks the next check.
   Optional: an AI vision call with the user's own API key. */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, $ = ui.$, KB = EL.kb, ILL = EL.ill;
  const IN = (EL.inspect = {});
  const NS = 'http://www.w3.org/2000/svg';
  let st = null, root = null, scrollEl = null;

  const ICONS = {
    motor: '<circle cx="11" cy="12" r="7"/><path d="M7.5 15V9l3.5 4 3.5-4v6M18 12h4"/>',
    motor1: '<circle cx="11" cy="12" r="7"/><path d="M9 10l2-1v6M13 14c1-2 2-2 3 0M18 12h4"/>',
    vfd: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7 12c1.5-4 3-4 4.5 0s3 4 4.5 0M8 17h8"/>',
    contactor: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v4M12 3v4M15 3v4M9 17v4M12 17v4M15 17v4M8 14l8-4"/>',
    breaker: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M12 7v6l3-1M9 17h6"/>',
    wiring: '<path d="M2 8h8l3 8h9"/><rect x="9" y="5" width="5" height="6" rx="1"/><circle cx="20" cy="16" r="2"/>',
    psu: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 12h4M9 10v4M14 12h4"/>',
    plc: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="7" cy="9" r="1"/><circle cx="7" cy="13" r="1"/><circle cx="11" cy="9" r="1"/><circle cx="11" cy="13" r="1"/><path d="M15 8h3M15 12h3M15 16h3"/>',
    pcb: '<rect x="3" y="5" width="18" height="14" rx="1"/><rect x="8" y="9" width="6" height="6"/><path d="M5 9h3M5 12h3M14 10h3l2 2M14 14h5"/>',
    sensor: '<path d="M4 9h10v6H4z"/><path d="M14 10c3 0 5 1 6 2-1 1-3 2-6 2M6 15v4"/>',
    trafo: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/><path d="M2 12h2M20 12h2"/>',
    solenoid: '<rect x="3" y="7" width="12" height="10" rx="1"/><path d="M6 7v10M9 7v10M12 7v10M15 12h6"/>',
    heater: '<path d="M3 12h3l1.5-4 3 8 3-8 3 8 1.5-4H21"/>',
    hmi: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M7 13l3-3 3 2 4-4"/>',
    ups: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M9 9l-2 3h4l-2 3"/>',
  };
  const icon = (id) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[id] || ICONS.pcb) + '</svg>';
  const btn = (label, fn, cls, attrs) => h('button', Object.assign({ class: 'btn ' + (cls || ''), onclick: fn }, attrs || {}), label);
  const pct = (p) => (p >= 0.995 ? '99%' : p < 0.01 ? '<1%' : Math.round(p * 100) + '%');
  const nm = (a) => T(a);
  const find = (id) => st.S.t.findings.find((x) => x.id === id);
  const sym = (id) => st.S.t.symptoms.find((x) => x.id === id);

  /* ---------------- state ---------------- */
  function fresh(type) {
    return { type, S: KB.begin(type, {}), photo: null, img: null, view: { x: 0, y: 0, k: 1 }, pins: [], hints: [], tool: 'pan', enhance: false, showHints: true,
      meta: { tag: '', place: '', who: '', note: '' }, open: null, forced: null, ai: {}, aiObs: [], saved: null, ph: null, nextPin: 1 };
  }
  try { IN.who = localStorage.getItem('ellab.who') || ''; } catch (e) { IN.who = ''; }

  /* ---------------- photo handling ---------------- */
  function loadFile(file) {
    if (!file) return;
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const max = 1600, s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * s)), hh = Math.max(1, Math.round(img.naturalHeight * s));
      const c = document.createElement('canvas'); c.width = w; c.height = hh;
      c.getContext('2d').drawImage(img, 0, 0, w, hh);
      URL.revokeObjectURL(url);
      const data = c.toDataURL('image/jpeg', 0.86);
      const im2 = new Image();
      im2.onload = () => {
        st.photo = { url: data, w, h: hh, name: file.name || 'photo' }; st.img = im2;
        st.pins = []; st.aiObs = []; st.hints = computeHints(c); st.nextPin = 1;
        buildPhoto(); fitView(); ui.toast(st.hints.length ? ['Photo loaded. Dashed circles are rough colour hints, check them yourself.', 'الصورة اتحملت. الدواير المتقطعة تلميحات لونية تقريبية، اتأكد منها بنفسك.'] : ['Photo loaded.', 'الصورة اتحملت.'], 'ok');
        render();
      };
      im2.src = data;
    };
    img.onerror = () => { URL.revokeObjectURL(url); ui.toast(['Could not read that image.', 'مقدرتش أقرا الصورة دي.'], 'bad'); };
    img.src = url;
  }
  /* rough colour hints: dark/charred, brown, pale crust. Not a diagnosis. */
  function computeHints(src) {
    const GW = 80, GH = Math.max(8, Math.round(GW * src.height / src.width));
    const c = document.createElement('canvas'); c.width = GW; c.height = GH;
    const x = c.getContext('2d'); x.drawImage(src, 0, 0, GW, GH);
    let d; try { d = x.getImageData(0, 0, GW, GH).data; } catch (e) { return []; }
    const N = GW * GH, lum = new Float32Array(N), cls = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const r = d[i * 4] / 255, gg = d[i * 4 + 1] / 255, b = d[i * 4 + 2] / 255;
      lum[i] = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
    }
    const sorted = Array.from(lum).sort((a, b) => a - b), med = sorted[N >> 1];
    for (let i = 0; i < N; i++) {
      const r = d[i * 4] / 255, gg = d[i * 4 + 1] / 255, b = d[i * 4 + 2] / 255;
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), s = mx ? (mx - mn) / mx : 0;
      let hue = 0; if (mx !== mn) { if (mx === r) hue = ((gg - b) / (mx - mn)) * 60; else if (mx === gg) hue = (2 + (b - r) / (mx - mn)) * 60; else hue = (4 + (r - gg) / (mx - mn)) * 60; if (hue < 0) hue += 360; }
      if (med > 0.22 && lum[i] < Math.min(0.15, med * 0.42)) cls[i] = 1;
      else if (hue >= 14 && hue <= 42 && s > 0.5 && mx > 0.2 && mx < 0.62) cls[i] = 2;
      else if (s < 0.45 && s > 0.08 && mx > 0.62 && hue >= 85 && hue <= 200 && gg >= r + 0.03) cls[i] = 3;
    }
    const seen = new Uint8Array(N), out = [];
    for (let i = 0; i < N; i++) {
      if (!cls[i] || seen[i]) continue;
      const k = cls[i], q = [i]; seen[i] = 1; let n = 0, sx = 0, sy = 0, head = 0;
      while (head < q.length) { const j = q[head++]; n++; const jx = j % GW, jy = (j / GW) | 0; sx += jx; sy += jy; for (const nb of [j - 1, j + 1, j - GW, j + GW]) { if (nb < 0 || nb >= N || seen[nb] || cls[nb] !== k) continue; if ((nb === j - 1 && jx === 0) || (nb === j + 1 && jx === GW - 1)) continue; seen[nb] = 1; q.push(nb); } }
      const frac = n / N;
      if (frac < 0.003 || frac > 0.18) continue;
      out.push({ k, n, x: (sx / n + 0.5) / GW, y: (sy / n + 0.5) / GH, r: Math.sqrt(n / Math.PI) / GW * 1.5 });
    }
    out.sort((a, b) => b.n - a.n);
    const names = { 1: ['Dark or charred area?', 'منطقة غامقة أو متفحمة؟'], 2: ['Brown discolouration?', 'تغير لون بني؟'], 3: ['Pale crust or corrosion?', 'قشرة باهتة أو تآكل؟'] };
    return out.slice(0, 7).map((o, i) => ({ id: 'h' + i, k: o.k, x: o.x * src.width, y: o.y * src.height, r: Math.max(0.04, o.r) * src.width, label: names[o.k] }));
  }
  function annotated(maxSide, withPins) {
    if (!st.img) return null;
    const s = Math.min(1, maxSide / Math.max(st.photo.w, st.photo.h)), w = Math.round(st.photo.w * s), hh = Math.round(st.photo.h * s);
    const c = document.createElement('canvas'); c.width = w; c.height = hh; const x = c.getContext('2d');
    x.drawImage(st.img, 0, 0, w, hh);
    if (withPins) {
      x.lineWidth = Math.max(2, w / 300); x.font = 'bold ' + Math.max(12, Math.round(w / 40)) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (const p of st.pins) { const rr = Math.max(10, w / 45); x.beginPath(); x.arc(p.x * s, p.y * s, rr, 0, 7); x.fillStyle = 'rgba(229,72,61,.85)'; x.fill(); x.strokeStyle = '#fff'; x.stroke(); x.fillStyle = '#fff'; x.fillText(String(p.n), p.x * s, p.y * s + 1); }
    }
    return c;
  }
  const thumb = () => { const c = annotated(220, true); return c ? c.toDataURL('image/jpeg', 0.6) : null; };

  /* ---------------- photo viewer (persistent element) ---------------- */
  function fitView() {
    const P = st.ph; if (!P || !st.photo) return;
    const cw = P.host.clientWidth || 600, ch = P.host.clientHeight || 400;
    const k = Math.min(cw / st.photo.w, ch / st.photo.h);
    st.view = { k, x: (cw - st.photo.w * k) / 2, y: (ch - st.photo.h * k) / 2 };
    placeAll();
  }
  function zoomAt(f, cx, cy) {
    const v = st.view, nk = Math.max(0.05, Math.min(40, v.k * f)), r = nk / v.k;
    v.x = cx - (cx - v.x) * r; v.y = cy - (cy - v.y) * r; v.k = nk; placeAll();
  }
  function placeAll() {
    const P = st.ph; if (!P || !P.world) return;
    const v = st.view;
    P.world.setAttribute('transform', 'translate(' + v.x.toFixed(2) + ' ' + v.y.toFixed(2) + ') scale(' + v.k.toFixed(5) + ')');
    for (const e of P.items) {
      const sx = e.o.x * v.k + v.x, sy = e.o.y * v.k + v.y;
      e.g.setAttribute('transform', 'translate(' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ')');
      if (e.ring) e.ring.setAttribute('r', Math.max(12, e.o.r * v.k).toFixed(1));
    }
  }
  const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); return e; };
  function buildPhoto() {
    const P = st.ph;
    P.svg.innerHTML = ''; P.items = [];
    if (!st.photo) { P.host.classList.add('empty'); return; }
    P.host.classList.remove('empty');
    P.world = el('g'); const im = el('image', { href: st.photo.url, x: 0, y: 0, width: st.photo.w, height: st.photo.h });
    im.style.filter = st.enhance ? 'brightness(1.55) contrast(1.35) saturate(1.2)' : '';
    P.im = im; P.world.appendChild(im); P.svg.appendChild(P.world);
    P.over = el('g'); P.svg.appendChild(P.over);
    if (st.showHints) for (const hh of st.hints) {
      const gg = el('g', { class: 'ins-hint' }); const ring = el('circle', { r: 20, fill: 'rgba(253,195,0,.08)', stroke: '#FDC300', 'stroke-width': 2, 'stroke-dasharray': '5 4' });
      const t = el('text', { y: -4, 'text-anchor': 'middle' }); t.textContent = '?';
      gg.appendChild(ring); gg.appendChild(t); gg.appendChild(el('title')).textContent = T(hh.label);
      P.over.appendChild(gg); P.items.push({ g: gg, o: hh, ring, kind: 'hint' });
    }
    for (const o of st.aiObs) {
      const gg = el('g', { class: 'ins-ai' }); const ring = el('circle', { r: 20, fill: 'rgba(71,191,217,.12)', stroke: '#47BFD9', 'stroke-width': 2.5 });
      const t = el('text', { y: 4, 'text-anchor': 'middle' }); t.textContent = 'AI';
      gg.appendChild(ring); gg.appendChild(t); P.over.appendChild(gg); P.items.push({ g: gg, o: { x: o.x, y: o.y, r: o.r, label: o.label }, ring, kind: 'ai' });
    }
    for (const p of st.pins) {
      const gg = el('g', { class: 'ins-pin' }); const c = el('circle', { r: 13, fill: '#e5483b', stroke: '#fff', 'stroke-width': 2 });
      const t = el('text', { y: 4.5, 'text-anchor': 'middle' }); t.textContent = String(p.n);
      gg.appendChild(c); gg.appendChild(t); P.over.appendChild(gg); P.items.push({ g: gg, o: { x: p.x, y: p.y, r: 0 }, kind: 'pin', pin: p });
    }
    placeAll();
  }
  function bindGestures(P) {
    const ptrs = new Map(); let pinch = null, moved = 0;
    const loc = (e) => { const r = P.svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    P.svg.addEventListener('pointerdown', (e) => {
      if (!st.photo) return;
      P.svg.setPointerCapture(e.pointerId); const l = loc(e); ptrs.set(e.pointerId, { x: l.x, y: l.y, sx: l.x, sy: l.y });
      moved = ptrs.size > 1 ? 99 : 0;
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1 }; }
    });
    P.svg.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId); if (!p) return; const l = loc(e);
      if (ptrs.size === 1) { const dx = l.x - p.x, dy = l.y - p.y; moved += Math.abs(dx) + Math.abs(dy); if (moved > 6) { st.view.x += dx; st.view.y += dy; placeAll(); } p.x = l.x; p.y = l.y; }
      else if (ptrs.size === 2) {
        p.x = l.x; p.y = l.y; const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        if (pinch) { zoomAt(d / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); pinch.d = d; }
      }
    });
    const up = (e) => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const wasSingle = ptrs.size === 1; ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
      if (wasSingle && moved <= 6) tap(p.sx, p.sy);
    };
    P.svg.addEventListener('pointerup', up); P.svg.addEventListener('pointercancel', up);
    P.svg.addEventListener('wheel', (e) => { if (!st.photo) return; e.preventDefault(); const l = loc(e); zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, l.x, l.y); }, { passive: false });
    P.svg.addEventListener('dblclick', (e) => { if (!st.photo) return; const l = loc(e); zoomAt(2, l.x, l.y); });
  }
  function tap(sx, sy) {
    const P = st.ph, v = st.view;
    let best = null, bd = 1e9;
    for (const e of P.items) { const cx = e.o.x * v.k + v.x, cy = e.o.y * v.k + v.y, d = Math.hypot(cx - sx, cy - sy), rad = Math.max(16, e.ring ? e.o.r * v.k : 16); if (d <= rad && d < bd) { bd = d; best = e; } }
    if (best) {
      if (best.kind === 'hint') { adoptHint(best.o); return; }
      if (best.kind === 'pin') { st.open = 'pin' + best.pin.id; renderPins(); const inp = $('#pin-' + best.pin.id); if (inp) inp.focus(); return; }
      if (best.kind === 'ai') { ui.toast(best.o.label || 'AI', 'info', 5000); return; }
    }
    if (st.tool === 'mark') addPin((sx - v.x) / v.k, (sy - v.y) / v.k, '');
  }
  const HINT_ILL = { 1: ['burnt', 'wind_all', 'coil'], 2: ['burnt', 'terminal', 'wind_all'], 3: ['corrosion', 'capbulge'] };
  function addPin(x, y, label, suggest) {
    const p = { id: st.nextPin, n: st.nextPin, x, y, label: label || '', find: null, suggest: suggest || null }; st.nextPin++;
    st.pins.push(p); buildPhoto(); renderPins();
    setTimeout(() => { const i = $('#pin-' + p.id); if (i) i.focus(); }, 30);
  }
  function adoptHint(hh) {
    st.hints = st.hints.filter((x) => x !== hh);
    let sug = null; for (const ill of HINT_ILL[hh.k] || []) { const f = st.S.t.findings.find((x) => x.ill === ill); if (f) { sug = f.id; break; } }
    addPin(hh.x, hh.y, T(hh.label).replace(/[?\u061f]/g, '').trim(), sug);
  }
  function renderPins() {
    const P = st.ph; if (!P) return; P.pinsBox.innerHTML = '';
    if (!st.pins.length) { P.pinsBox.appendChild(h('div', { class: 'mute sm', text: st.photo ? T(['Tip: switch to Mark, tap on the photo where you see something, and name it. Link it to what you see in the list on the right.', 'نصيحة: غيّر لوضع علّم، اضغط على الصورة في المكان اللي شايف فيه حاجة، وسمّيها. اربطها بالملاحظات في القايمة اللي على اليمين.']) : '' })); return; }
    for (const p of st.pins) {
      const sel = h('select', { onchange: (e) => { p.find = e.target.value || null; if (p.find) { st.S.finds.set(p.find, true); p.suggest = null; } render(); } },
        h('option', { value: '', text: T(['Link to a finding...', 'اربطها بملاحظة...']) }),
        st.S.t.findings.map((f) => h('option', { value: f.id, text: nm(f.name), selected: p.find === f.id })));
      const row = h('div', { class: 'pinrow' },
        h('span', { class: 'pn', text: String(p.n) }),
        h('input', { type: 'text', id: 'pin-' + p.id, value: p.label, placeholder: T(['What is this?', 'ده إيه؟']), oninput: (e) => { p.label = e.target.value; } }),
        sel,
        p.suggest && !p.find ? btn(T(['Use: ', 'استخدم: ']) + nm(find(p.suggest).name), () => { p.find = p.suggest; st.S.finds.set(p.suggest, true); p.suggest = null; render(); }, 'sm') : null,
        btn('✕', () => { st.pins = st.pins.filter((x) => x !== p); buildPhoto(); renderPins(); }, 'sm', { 'aria-label': 'remove' }));
      P.pinsBox.appendChild(row);
    }
  }
  function photoCol() {
    if (st.ph) return st.ph.wrap;
    const P = (st.ph = { items: [] });
    P.svg = el('svg', { class: 'ins-svg' });
    const file = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onchange: (e) => { loadFile(e.target.files[0]); e.target.value = ''; } });
    const empty = h('div', { class: 'ins-empty' }, h('div', { class: 'big', html: icon(st.type) }),
      h('p', { text: T(['Take or choose a photo of the equipment. You can also work without a photo.', 'صوّر الجهاز أو اختار صورة. تقدر تشتغل من غير صورة كمان.']) }),
      btn(T(['Take / choose photo', 'صوّر / اختار صورة']), () => file.click(), 'pri'));
    P.host = h('div', { class: 'ins-photo empty' }, P.svg, empty);
    const zin = btn('+', () => zoomAt(1.4, P.host.clientWidth / 2, P.host.clientHeight / 2), 'sm', { 'aria-label': 'zoom in' });
    const zout = btn('−', () => zoomAt(1 / 1.4, P.host.clientWidth / 2, P.host.clientHeight / 2), 'sm', { 'aria-label': 'zoom out' });
    const toolB = btn(T(['Mark', 'علّم']), () => { st.tool = st.tool === 'mark' ? 'pan' : 'mark'; toolB.classList.toggle('on', st.tool === 'mark'); P.host.classList.toggle('marking', st.tool === 'mark'); }, 'sm');
    const enh = btn(T(['Brighten', 'أنوّر']), () => { st.enhance = !st.enhance; enh.classList.toggle('on', st.enhance); if (P.im) P.im.style.filter = st.enhance ? 'brightness(1.55) contrast(1.35) saturate(1.2)' : ''; }, 'sm');
    const hin = btn(T(['Hints', 'تلميحات']), () => { st.showHints = !st.showHints; hin.classList.toggle('on', st.showHints); buildPhoto(); }, 'sm' + (st.showHints ? ' on' : ''));
    P.tools = h('div', { class: 'row wrap ins-tools' }, toolB, zin, zout, btn(T(['Fit', 'ملّي']), fitView, 'sm'), enh, hin,
      btn(T(['Photo', 'صورة']), () => file.click(), 'sm'), btn(T(['Remove', 'شيل']), () => { st.photo = null; st.img = null; st.pins = []; st.hints = []; st.aiObs = []; buildPhoto(); renderPins(); render(); }, 'sm'), file);
    P.pinsBox = h('div', { class: 'ins-pins' });
    P.wrap = h('div', { class: 'ins-photo-wrap' }, P.host, P.tools, P.pinsBox);
    P.empty = empty;
    bindGestures(P);
    if (g.ResizeObserver) { let last = ''; new ResizeObserver(() => { const k = P.host.clientWidth + 'x' + P.host.clientHeight; if (k !== last && P.host.clientWidth) { last = k; if (st && st.photo) fitView(); } }).observe(P.host); }
    buildPhoto(); renderPins();
    return P.wrap;
  }

  /* ---------------- workflow column ---------------- */
  function evidenceCount() { let n = st.S.symptoms.size + st.S.tests.length; for (const v of st.S.finds.values()) if (v) n++; return n; }
  function whyList(m) {
    const S = st.S, out = [];
    for (const id of S.symptoms) if ((m.sym[id] || 0) >= 0.45 && sym(id)) out.push(nm(sym(id).name));
    for (const [id, pres] of S.finds) { const f = find(id); if (f && pres && (m.find[id] || 0) >= 0.35) out.push(nm(f.name)); }
    for (const a of S.tests) {
      const te = S.t.tests.find((x) => x.id === a.id); if (!te) continue;
      const d = KB.testDist(S.t, te, m), top = Object.keys(d).sort((p, q) => d[q] - d[p])[0];
      if (top === a.out) { const o = te.outs.find((x) => x.k === a.out); out.push(nm(te.name) + ': ' + (o ? nm(o.name) : a.out)); }
    }
    return out;
  }
  function sevPill(m) { const map = { high: ['High risk', 'خطر عالي', 'bad'], med: ['Medium', 'متوسط', 'warn'], low: ['Low', 'منخفض', 'info'] }; const x = map[m.sev] || map.med; return h('span', { class: 'pill ' + x[2], text: T([x[0], x[1]]) }); }

  function symptomsCard() {
    const c = h('div', { class: 'card' }, h('h3', { text: T(['1. What is wrong?', '1. إيه المشكلة؟']) }));
    const box = h('div', { class: 'chips' });
    for (const s of st.S.t.symptoms) box.appendChild(h('button', { class: 'ichip' + (st.S.symptoms.has(s.id) ? ' on' : ''), text: nm(s.name), onclick: () => { KB.toggleSymptom(st.S, s.id); render(); } }));
    c.appendChild(box); return c;
  }
  function findingsCard() {
    const c = h('div', { class: 'card' }, h('h3', { text: T(['2. What do you see?', '2. إيه اللي شايفه؟']) }),
      h('div', { class: 'mute sm', text: T(['Answer only what you can see. Leave the rest. Tap a picture to see what it looks like.', 'جاوب على اللي شايفه بس. سيب الباقي. اضغط على الرسمة تشوف شكله إيه.']) }));
    for (const f of st.S.t.findings) {
      const v = st.S.finds.has(f.id) ? (st.S.finds.get(f.id) ? 'y' : 'n') : '';
      const set = (val) => { if ((val === 'y' && v === 'y') || (val === 'n' && v === 'n')) KB.setFinding(st.S, f.id, null); else KB.setFinding(st.S, f.id, val === 'y'); render(); };
      c.appendChild(h('div', { class: 'frow' },
        f.ill && ILL.has(f.ill) ? h('button', { class: 'fthumb', html: ILL.html(f.ill), onclick: () => showIll(f.ill), 'aria-label': 'example' }) : h('span', { class: 'fthumb none' }),
        h('div', { class: 'grow ftxt', text: nm(f.name) }),
        h('div', { class: 'seg' }, h('button', { class: 'btn sm' + (v === 'y' ? ' ok' : ''), text: T(['Yes', 'أيوه']), onclick: () => set('y') }), h('button', { class: 'btn sm' + (v === 'n' ? ' bad' : ''), text: T(['No', 'لأ']), onclick: () => set('n') }))));
    }
    return c;
  }
  function rankCard(r) {
    const c = h('div', { class: 'card' }, h('h3', { text: T(['3. Likely causes', '3. الأسباب المحتملة']) }));
    if (!evidenceCount()) { c.appendChild(h('p', { class: 'mute', text: T(['Pick at least one symptom or something you see. The list ranks itself as you add facts.', 'اختار عرض واحد على الأقل أو حاجة شايفها. القايمة بتترتب لوحدها كل ما تضيف معلومة.']) })); return c; }
    for (const x of r.slice(0, 6)) {
      if (x.p < 0.01 && x !== r[0]) continue;
      const open = st.open === x.m.id;
      const row = h('div', { class: 'dg-sus', onclick: () => { st.open = open ? null : x.m.id; render(); } }, h('div', { class: 'dg-bar' }, h('i', { style: { width: Math.max(2, x.p * 100) + '%' } })), h('span', { class: 'dg-sl', text: nm(x.m.name) + (x.m.learned ? '  (' + x.m.learned + ')' : '') }), h('b', { text: pct(x.p) }));
      c.appendChild(row);
      if (open) {
        const w = whyList(x.m);
        c.appendChild(h('div', { class: 'dg-fb' }, sevPill(x.m),
          w.length ? h('p', { text: T(['Matches: ', 'متوافق مع: ']) + w.join('، ') }) : null,
          h('p', {}, h('b', { text: T(['Fix: ', 'الإصلاح: ']) }), nm(x.m.fix)),
          x.m.prevent ? h('p', {}, h('b', { text: T(['Prevent: ', 'الوقاية: ']) }), nm(x.m.prevent)) : null));
      }
    }
    return c;
  }
  function checkCard(n) {
    const S = st.S, c = h('div', { class: 'card' }, h('h3', { text: T(['4. Next check', '4. الفحص الجاي']) }));
    if (!evidenceCount()) { c.appendChild(h('p', { class: 'mute', text: T(['Add symptoms first.', 'ضيف الأعراض الأول.']) })); return c; }
    let best = n.best;
    if (st.forced) { const te = S.t.tests.find((x) => x.id === st.forced); if (te && !S.tests.some((a) => a.id === te.id)) best = { kind: 'test', test: te }; else st.forced = null; }
    if (!best) { c.appendChild(h('p', { class: 'mute', text: T(['No more useful checks left. If the top cause does not fit, teach the app what you found at the end.', 'مفيش فحوصات مفيدة تانية. لو أعلى سبب مش مطابق، علّم التطبيق باللي لقيته في الآخر.']) })); return c; }
    if (best.kind === 'find') {
      const f = best.f;
      c.appendChild(h('div', { class: 'dg-next' }, h('div', { class: 'dg-nt', text: T(['Look for this', 'دوّر على ده']) }),
        f.ill && ILL.has(f.ill) ? h('div', { class: 'ill-big', html: ILL.html(f.ill), onclick: () => showIll(f.ill) }) : null,
        h('p', { text: nm(f.name) }),
        h('div', { class: 'row wrap' }, btn(T(['Yes, I see it', 'أيوه شايفه']), () => { KB.setFinding(S, f.id, true); render(); }, 'ok'), btn(T(['No', 'لأ']), () => { KB.setFinding(S, f.id, false); render(); }, 'bad'), btn(T(['Can\'t tell', 'مش عارف']), () => { S.skip.add('f:' + f.id); render(); }))));
    } else {
      const te = best.test, live = n.live, outs = KB.outcomes(S, te, live);
      const box = h('div', { class: 'dg-next' }, h('div', { class: 'dg-nt', text: nm(te.name) }), h('p', { text: nm(te.how) }), te.safety ? h('div', { class: 'dg-safe', text: '⚠ ' + nm(te.safety) }) : null,
        h('div', { class: 'mute sm', text: T(['What did you get? Tap the answer.', 'جبت إيه؟ اضغط على الإجابة.']) }));
      const ob = h('div', { class: 'dg-outs' });
      for (const o of outs) ob.appendChild(h('button', { class: 'dg-out', onclick: () => { KB.answer(S, te.id, o.o.k); st.forced = null; render(); } }, h('b', { text: nm(o.o.name) }), o.top.length && o.p > 0.02 ? h('span', { class: 'mute', text: T(['points to: ', 'بيشاور على: ']) + o.top.map((m) => nm(m.name)).join(' / ') }) : null));
      box.appendChild(ob);
      box.appendChild(h('div', { class: 'row wrap' }, btn(T(['I can\'t do this check', 'مقدرش أعمل الفحص ده']), () => { S.skip.add('t:' + te.id); st.forced = null; render(); }, 'sm')));
      c.appendChild(box);
    }
    const rest = S.t.tests.filter((te) => !S.tests.some((a) => a.id === te.id));
    if (rest.length > 1) {
      const d = h('details', { class: 'ins-more' }, h('summary', { text: T(['Choose a different check', 'اختار فحص تاني']) }));
      for (const te of rest) d.appendChild(h('div', { class: 'dg-hi' }, h('a', { href: '#', text: nm(te.name), onclick: (e) => { e.preventDefault(); st.forced = te.id; render(); } })));
      c.appendChild(d);
    }
    if (S.tests.length) {
      const hist = h('div', { class: 'dg-hist' });
      for (const a of S.tests) { const te = S.t.tests.find((x) => x.id === a.id), o = te && te.outs.find((x) => x.k === a.out); if (te) hist.appendChild(h('div', { class: 'dg-hi' }, h('span', { text: '✓' }), h('span', { class: 'grow', text: nm(te.name) + ': ' + (o ? nm(o.name) : a.out) }))); }
      hist.appendChild(h('div', { class: 'row' }, btn(T(['Undo last', 'رجّع آخر واحدة']), () => { KB.undo(S); render(); }, 'sm')));
      c.appendChild(hist);
    }
    return c;
  }
  function conclusionCard(r) {
    const top = r[0], S = st.S; let yes = 0; for (const v of S.finds.values()) if (v) yes++;
    if (!(top.p >= 0.7 && evidenceCount() >= 2 && (S.tests.length >= 1 || yes >= 2))) return null;
    const m = top.m;
    return h('div', { class: 'dg-concl' }, h('div', { class: 'dg-nt', text: T(['Most likely cause: ', 'السبب الأرجح: ']) + nm(m.name) + ' (' + pct(top.p) + ')' }), sevPill(m),
      h('p', {}, h('b', { text: T(['Fix: ', 'الإصلاح: ']) }), nm(m.fix)),
      m.prevent ? h('p', {}, h('b', { text: T(['Prevent: ', 'الوقاية: ']) }), nm(m.prevent)) : null,
      h('p', { class: 'mute sm', text: T(['This is a ranked estimate from what you entered, not a certainty. Confirm with the measurement before you replace parts.', 'ده تقدير مرتب من اللي دخلته، مش يقين. أكّد بالقياس قبل ما تغيّر قطع.']) }));
  }
  function metaCard() {
    const M = st.meta;
    const f = (lab, key, ph) => h('div', {}, h('label', { class: 'f', text: lab }), h('input', { type: 'text', value: M[key], placeholder: ph || '', oninput: (e) => { M[key] = e.target.value; if (key === 'who') { IN.who = e.target.value; try { localStorage.setItem('ellab.who', IN.who); } catch (x) {} } } }));
    if (!M.who) M.who = IN.who;
    return h('details', { class: 'card ins-meta' }, h('summary', { text: T(['Equipment details (for the report)', 'بيانات الجهاز (للتقرير)']) }),
      f(T(['Tag / asset number', 'رقم الجهاز / الأصل']), 'tag', 'M-101'), f(T(['Location', 'المكان']), 'place', ''), f(T(['Inspector', 'الفاحص']), 'who', ''),
      h('label', { class: 'f', text: T(['Notes', 'ملاحظات']) }), h('textarea', { rows: 2, oninput: (e) => { M.note = e.target.value; } }, M.note));
  }
  function teachCard(r) {
    const S = st.S;
    if (!evidenceCount()) return null;
    const c = h('div', { class: 'card' }, h('h3', { text: T(['5. Teach the app', '5. علّم التطبيق']) }),
      h('div', { class: 'mute sm', text: T(['When you know the real cause, save the case. The app uses your cases to rank causes better next time. Cases stay on this device.', 'لما تعرف السبب الحقيقي احفظ الحالة. التطبيق بيستخدم حالاتك يرتب الأسباب أحسن المرة الجاية. الحالات بتفضل على الجهاز ده.']) }));
    const sel = h('select', {}, r.map((x) => h('option', { value: x.m.id, text: nm(x.m.name) })), h('option', { value: '__other', text: T(['Other: I will describe it', 'سبب تاني: هكتبه']) }));
    const nameI = h('input', { type: 'text', placeholder: T(['Name of the real cause', 'اسم السبب الحقيقي']) }), fixI = h('textarea', { rows: 2, placeholder: T(['What fixed it?', 'إيه اللي صلّحه؟']) });
    const other = h('div', { style: { display: 'none' } }, nameI, fixI);
    sel.addEventListener('change', () => { other.style.display = sel.value === '__other' ? '' : 'none'; });
    const out = h('div', {});
    c.appendChild(h('label', { class: 'f', text: T(['The real cause was', 'السبب الحقيقي كان']) })); c.appendChild(sel); c.appendChild(other);
    c.appendChild(h('div', { class: 'row wrap', style: { marginTop: '8px' } },
      btn(T(['Save case', 'احفظ الحالة']), () => {
        let cause = sel.value, causeName = null, fix = null;
        if (cause === '__other') { const n = nameI.value.trim(); if (!n) { ui.toast(['Write the cause name.', 'اكتب اسم السبب.'], 'warn'); return; } cause = 'u:' + n.toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, '_').slice(0, 40); causeName = n; fix = fixI.value.trim(); }
        const row = KB.addCase({ type: st.type, cause, causeName, fix, symptoms: [...S.symptoms], findings: [...S.finds].filter((x) => x[1]).map((x) => x[0]), tests: S.tests.map((a) => ({ id: a.id, out: a.out })), meta: { tag: st.meta.tag, place: st.meta.place, note: st.meta.note }, thumb: st.photo ? thumb() : null, pins: st.pins.map((p) => ({ n: p.n, label: p.label, find: p.find })) });
        st.saved = row; ui.toast(['Case saved. The app will weigh it next time.', 'الحالة اتحفظت. التطبيق هيحسبها المرة الجاية.'], 'ok'); render();
      }, 'pri'), btn(T(['Cases (' + KB.casesOf(st.type).length + ')', 'الحالات (' + KB.casesOf(st.type).length + ')']), casesModal, '')));
    if (st.saved) c.appendChild(h('p', { class: 'dg-tip', text: T(['Saved. You can start a new inspection.', 'اتحفظت. تقدر تبدأ فحص جديد.']) }));
    const sim = KB.similar(S, 3);
    if (sim.length) {
      c.appendChild(h('h4', { text: T(['Similar cases you saved', 'حالات مشابهة حفظتها']) }));
      for (const x of sim) { const mm = KB.modesOf(st.type).find((m) => m.id === x.c.cause); c.appendChild(h('div', { class: 'dg-case' }, x.c.thumb ? h('img', { src: x.c.thumb, class: 'cthumb' }) : null, h('div', { class: 'grow' }, h('b', { text: mm ? nm(mm.name) : x.c.causeName || x.c.cause }), h('div', { class: 'mute sm', text: Math.round(x.sim * 100) + '% ' + T(['match', 'تطابق']) + (x.c.meta && x.c.meta.tag ? ' · ' + x.c.meta.tag : '') })))); }
    }
    return c;
  }
  function reportCard(r) {
    if (!evidenceCount()) return null;
    return h('div', { class: 'card' }, h('h3', { text: T(['6. Report', '6. التقرير']) }),
      h('div', { class: 'row wrap' }, btn(T(['Download report (.html)', 'نزّل التقرير (.html)']), () => { ui.download('inspection-' + (st.meta.tag || st.type) + '.html', reportHtml(r), 'text/html'); }, 'pri'),
        btn(T(['Copy summary', 'انسخ الملخص']), () => { const txt = reportText(r); if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => ui.toast(['Copied.', 'اتنسخ.'], 'ok'), () => ui.toast(['Could not copy.', 'مقدرتش أنسخ.'], 'warn')); else ui.toast(['Copy is not available in this browser.', 'النسخ مش متاح في المتصفح ده.'], 'warn'); })));
  }
  /* ---- AI vision ---- */
  function aiCard() {
    const cfg = EL.ai.cfg(), c = h('details', { class: 'card' }, h('summary', { text: T(['Optional: ask online AI to look at the photo', 'اختياري: اسأل الذكاء الاصطناعي ينظر في الصورة']) }));
    c.appendChild(h('p', { class: 'mute sm', text: T(['Needs internet and your own API key. The photo and your notes go to the AI service. Do not use it for anything confidential. Company networks often block it. The built-in method above works without it.', 'محتاج إنترنت ومفتاح API بتاعك. الصورة وملاحظاتك بتتبعت لخدمة الذكاء الاصطناعي. متستخدمهوش في حاجة سرية. شبكات الشركات غالبا بتحجبه. الطريقة المدمجة فوق شغالة من غيره.']) }));
    const key = h('input', { type: 'password', value: cfg.key || '', placeholder: 'sk-ant-...' }), model = h('input', { type: 'text', value: cfg.model || 'claude-sonnet-5-5' });
    c.appendChild(h('label', { class: 'f', text: 'API key' })); c.appendChild(key); c.appendChild(h('label', { class: 'f', text: 'Model' })); c.appendChild(model);
    const out = h('div', { class: 'dg-aitext' });
    if (st.ai.busy) out.textContent = T(['Looking at the photo...', 'بيبص على الصورة...']);
    else if (st.ai.err) { out.textContent = st.ai.err; out.classList.add('bad-t'); }
    else if (st.ai.text) out.textContent = st.ai.text;
    c.appendChild(h('div', { class: 'row wrap', style: { marginTop: '8px' } },
      btn(T(['Analyse photo with AI', 'حلل الصورة بالذكاء الاصطناعي']), () => { EL.ai.save({ key: key.value.trim(), model: model.value.trim() || 'claude-sonnet-5-5' }); aiLook(); }, 'pri', st.photo ? {} : { disabled: true }),
      st.aiObs.length ? btn(T(['Add AI marks as pins', 'حوّل علامات الذكاء الاصطناعي لدبابيس']), () => { for (const o of st.aiObs) { const p = { id: st.nextPin, n: st.nextPin, x: o.x, y: o.y, label: o.label || 'AI', find: null, suggest: null }; st.nextPin++; st.pins.push(p); } st.aiObs = []; buildPhoto(); renderPins(); render(); }, 'sm') : null));
    c.appendChild(out);
    if (st.ai.busy || st.ai.err || st.ai.text) c.open = true;
    return c;
  }
  async function aiLook() {
    if (!st.photo) return;
    st.ai = { busy: true }; render();
    try {
      const S = st.S, r = KB.rank(S);
      const data = st.photo.url.split(',')[1];
      const facts = 'Equipment type: ' + S.t.name[0] + '\nSymptoms reported: ' + ([...S.symptoms].map((id) => sym(id).name[0]).join('; ') || 'none') +
        '\nThings the inspector sees: ' + ([...S.finds].filter((x) => x[1]).map((x) => find(x[0]).name[0]).join('; ') || 'none') +
        '\nMeasurements: ' + (S.tests.map((a) => { const te = S.t.tests.find((x) => x.id === a.id); const o = te && te.outs.find((x) => x.k === a.out); return te ? te.name[0] + ' = ' + (o ? o.name[0] : a.out) : ''; }).join('; ') || 'none') +
        '\nBuilt-in ranking: ' + r.slice(0, 4).map((x) => x.m.name[0] + ' ' + pct(x.p)).join('; ');
      const prompt = facts + '\n\nLook at the photo as an experienced maintenance and electronics engineer. Return ONLY one JSON object, no other text, with keys:\n' +
        '"summary": 2 to 4 sentences on what you see and the most likely cause;\n"observations": list of up to 8 objects {"x":0..1,"y":0..1,"r":0..0.2,"label":"short text"} where x,y is the centre of a visible defect as a fraction of image width and height and r is its radius as a fraction of width;\n' +
        '"likely": list of {"cause":"..","why":".."};\n"checks": list of {"what":"..","how":"..","safety":".."} in the order you would do them. Do not invent anything you cannot see. Say when the photo is not enough. ' + EL.ai.lang();
      const text = await EL.ai.ask([{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } }, { type: 'text', text: prompt }] }], { max: 1800, timeout: 90000 });
      let j = null; try { const a = text.indexOf('{'), b = text.lastIndexOf('}'); j = JSON.parse(text.slice(a, b + 1)); } catch (e) {}
      if (j) {
        st.aiObs = (j.observations || []).filter((o) => isFinite(o.x) && isFinite(o.y)).slice(0, 8).map((o) => ({ x: Math.max(0, Math.min(1, +o.x)) * st.photo.w, y: Math.max(0, Math.min(1, +o.y)) * st.photo.h, r: Math.max(0.03, Math.min(0.25, +o.r || 0.06)) * st.photo.w, label: String(o.label || '') }));
        st.ai = { text: [j.summary || '', '', (j.likely || []).map((x) => '• ' + x.cause + (x.why ? ': ' + x.why : '')).join('\n'), '', (j.checks || []).map((x, i) => (i + 1) + '. ' + x.what + (x.how ? ' (' + x.how + ')' : '') + (x.safety ? ' [' + x.safety + ']' : '')).join('\n')].join('\n').trim() };
        buildPhoto();
      } else st.ai = { text };
    } catch (e) { st.ai = { err: String(e.message || e) }; }
    render();
  }

  /* ---------------- report ---------------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function reportData(r) {
    const S = st.S;
    return {
      type: T(S.t.name), date: new Date().toLocaleString(EL.langInfo().loc),
      syms: [...S.symptoms].map((id) => T(sym(id).name)),
      seen: [...S.finds].filter((x) => x[1]).map((x) => T(find(x[0]).name)), notseen: [...S.finds].filter((x) => !x[1]).map((x) => T(find(x[0]).name)),
      tests: S.tests.map((a) => { const te = S.t.tests.find((x) => x.id === a.id), o = te && te.outs.find((x) => x.k === a.out); return te ? { n: T(te.name), v: o ? T(o.name) : a.out } : null; }).filter(Boolean),
      causes: r.slice(0, 4).filter((x) => x.p >= 0.02 || x === r[0]).map((x) => ({ n: T(x.m.name), p: pct(x.p), fix: T(x.m.fix), prevent: x.m.prevent ? T(x.m.prevent) : '' })),
      pins: st.pins.map((p) => ({ n: p.n, t: p.label, f: p.find ? T(find(p.find).name) : '' })),
    };
  }
  function reportText(r) {
    const d = reportData(r), L = [];
    L.push(T(['Inspection report: ', 'تقرير فحص: ']) + d.type + (st.meta.tag ? ' (' + st.meta.tag + ')' : '')); L.push(d.date + (st.meta.who ? ' · ' + st.meta.who : '') + (st.meta.place ? ' · ' + st.meta.place : ''));
    if (d.syms.length) L.push(T(['Symptoms: ', 'الأعراض: ']) + d.syms.join(EL.lang === 'ar' ? '، ' : ', '));
    if (d.seen.length) L.push(T(['Observed: ', 'ملاحظات: ']) + d.seen.join(EL.lang === 'ar' ? '، ' : ', '));
    for (const t of d.tests) L.push('- ' + t.n + ': ' + t.v);
    L.push(T(['Likely causes:', 'الأسباب المرجحة:'])); for (const c of d.causes) L.push('- ' + c.n + ' ' + c.p + ' | ' + T(['Fix: ', 'الإصلاح: ']) + c.fix);
    if (st.meta.note) L.push(T(['Notes: ', 'ملاحظات: ']) + st.meta.note);
    return L.join('\n');
  }
  function reportHtml(r) {
    const d = reportData(r), c = st.photo ? annotated(1100, true) : null, img = c ? c.toDataURL('image/jpeg', 0.8) : null;
    const li = (a) => a.map((x) => '<li>' + esc(x) + '</li>').join('');
    return '<!doctype html><html lang="' + T(['en', 'ar']) + '" dir="' + T(['ltr', 'rtl']) + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(d.type) + '</title><style>body{font:15px/1.55 system-ui,Segoe UI,Tahoma,sans-serif;max-width:820px;margin:18px auto;padding:0 14px;color:#111}h1{font-size:20px;border-bottom:3px solid #F55B41;padding-bottom:6px}h2{font-size:15px;margin:18px 0 4px;color:#333}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:5px 8px;text-align:start;vertical-align:top}img{max-width:100%;border:1px solid #bbb}.m{color:#555;font-size:13px}@media print{body{margin:0}}</style></head><body>' +
      '<h1>' + esc(T(['Inspection report: ', 'تقرير فحص: ']) + d.type) + '</h1><p class="m">' + esc(d.date) + '</p>' +
      '<table><tr><th>' + T(['Tag', 'الجهاز']) + '</th><td>' + esc(st.meta.tag) + '</td><th>' + T(['Location', 'المكان']) + '</th><td>' + esc(st.meta.place) + '</td></tr><tr><th>' + T(['Inspector', 'الفاحص']) + '</th><td colspan="3">' + esc(st.meta.who) + '</td></tr></table>' +
      (img ? '<h2>' + T(['Photo', 'الصورة']) + '</h2><img src="' + img + '" alt="photo">' + (d.pins.length ? '<ol>' + d.pins.map((p) => '<li value="' + p.n + '">' + esc(p.t) + (p.f ? ' (' + esc(p.f) + ')' : '') + '</li>').join('') + '</ol>' : '') : '') +
      (d.syms.length ? '<h2>' + T(['Symptoms', 'الأعراض']) + '</h2><ul>' + li(d.syms) + '</ul>' : '') +
      (d.seen.length ? '<h2>' + T(['Observed', 'اللي اتشاف']) + '</h2><ul>' + li(d.seen) + '</ul>' : '') +
      (d.tests.length ? '<h2>' + T(['Checks and measurements', 'الفحوصات والقياسات']) + '</h2><table>' + d.tests.map((t) => '<tr><td>' + esc(t.n) + '</td><td>' + esc(t.v) + '</td></tr>').join('') + '</table>' : '') +
      '<h2>' + T(['Likely causes', 'الأسباب المرجحة']) + '</h2><table><tr><th>' + T(['Cause', 'السبب']) + '</th><th>%</th><th>' + T(['Fix', 'الإصلاح']) + '</th><th>' + T(['Prevention', 'الوقاية']) + '</th></tr>' + d.causes.map((c1) => '<tr><td>' + esc(c1.n) + '</td><td>' + esc(c1.p) + '</td><td>' + esc(c1.fix) + '</td><td>' + esc(c1.prevent) + '</td></tr>').join('') + '</table>' +
      (st.meta.note ? '<h2>' + T(['Notes', 'ملاحظات']) + '</h2><p>' + esc(st.meta.note) + '</p>' : '') +
      '<p class="m">' + T(['A ranked estimate from the entered facts, not a certainty. Confirm by measurement and the maker\'s documentation before replacing parts. Isolate and lock out before hands-on work.', 'تقدير مرتب من المعلومات المدخلة وليس يقينا. أكّد بالقياس وبمراجعة كتالوج الشركة المصنعة قبل تغيير قطع. اعزل واعمل LOTO قبل أي شغل.']) + '</p></body></html>';
  }

  /* ---------------- modals ---------------- */
  function showIll(id) {
    if (!ILL.has(id)) return;
    const c = ILL[id].cap;
    ui.modal([h('div', { class: 'ill-modal', html: ILL.html(id) }), h('h3', { text: nm(c.title) }), h('p', {}, h('b', { text: T(['What to look for: ', 'دوّر على إيه: ']) }), nm(c.look)), h('p', {}, h('b', { text: T(['What it means: ', 'معناه إيه: ']) }), nm(c.mean)),
      h('p', { class: 'mute sm', text: T(['A drawn reference, not a photo of your equipment.', 'رسمة مرجعية، مش صورة معداتك.']) })]);
  }
  function galleryModal() {
    const box = h('div', { class: 'ill-grid' });
    for (const id of ILL.ids()) box.appendChild(h('button', { class: 'ill-card', onclick: () => showIll(id) }, h('div', { html: ILL.html(id) }), h('span', { text: nm(ILL[id].cap.title) })));
    ui.modal([h('h3', { text: T(['Defect gallery', 'معرض العيوب']) }), h('p', { class: 'mute sm', text: T(['Tap a picture for what to look for and what it means.', 'اضغط على رسمة تشوف تدوّر على إيه ومعناها إيه.']) }), box]);
  }
  function casesModal() {
    const body = h('div', {});
    const draw = () => {
      body.innerHTML = '';
      const cs = KB.cases.slice().reverse();
      body.appendChild(h('p', { class: 'mute sm', text: T([cs.length + ' saved cases on this device. Export them to share with a colleague or keep a backup.', cs.length + ' حالة محفوظة على الجهاز ده. صدّرها عشان تشاركها مع زميل أو تحتفظ بنسخة.']) }));
      const file = h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' }, onchange: (e) => { const f = e.target.files[0]; if (!f) return; f.text().then((tx) => { try { const n = KB.importCases(tx); ui.toast([n + ' cases imported.', n + ' حالة اتضافت.'], 'ok'); draw(); render(); } catch (x) { ui.toast(['That file is not a cases export.', 'الملف ده مش تصدير حالات.'], 'bad'); } }); } });
      body.appendChild(h('div', { class: 'row wrap' }, btn(T(['Export', 'تصدير']), () => ui.download('inspection-cases.json', KB.exportCases()), 'sm'), btn(T(['Import', 'استيراد']), () => file.click(), 'sm'), btn(T(['Clear all', 'امسح الكل']), () => { if (g.confirm && !g.confirm(T(['Delete all saved cases?', 'تمسح كل الحالات؟']))) return; KB.clearCases(); draw(); render(); }, 'sm bad'), file));
      for (const c of cs.slice(0, 60)) {
        const ty = KB.types[c.type], mm = KB.modesOf(c.type).find((m) => m.id === c.cause);
        body.appendChild(h('div', { class: 'dg-case' }, c.thumb ? h('img', { src: c.thumb, class: 'cthumb' }) : null, h('div', { class: 'grow' }, h('b', { text: mm ? nm(mm.name) : c.causeName || c.cause }), h('div', { class: 'mute sm', text: (ty ? nm(ty.name) : c.type) + (c.meta && c.meta.tag ? ' · ' + c.meta.tag : '') + ' · ' + new Date(c.t).toLocaleDateString() })), btn('✕', () => { KB.removeCase(c.t); draw(); render(); }, 'sm')));
      }
    };
    draw(); ui.modal([h('h3', { text: T(['Saved cases', 'الحالات المحفوظة']) }), body]);
  }

  /* ---------------- main render ---------------- */
  function head() {
    return h('div', { class: 'row wrap ins-head' }, h('h2', { class: 'grow', text: T(['Inspect and diagnose', 'فحص وتشخيص']) }),
      btn(T(['Gallery', 'المعرض']), galleryModal, 'sm'), btn(T(['Cases (' + KB.cases.length + ')', 'الحالات (' + KB.cases.length + ')']), casesModal, 'sm'),
      st ? btn(T(['New inspection', 'فحص جديد']), () => { st = null; render(); }, 'sm') : null);
  }
  function typeGrid() {
    const c = h('div', {}, h('p', { class: 'mute', text: T(['Pick the equipment. Then add a photo, what is wrong, what you see, and the app guides you through the checks, one at a time, until the cause is clear.', 'اختار الجهاز. وبعدين ضيف صورة وإيه المشكلة وإيه اللي شايفه، والتطبيق هيمشّيك في الفحوصات واحدة واحدة لحد ما السبب يبان.']) }));
    const grid = h('div', { class: 'tgrid' });
    for (const id of KB.order) { const t = KB.types[id], n = KB.casesOf(id).length; grid.appendChild(h('button', { class: 'tcard', onclick: () => { st = fresh(id); render(); } }, h('span', { class: 'ti', html: icon(id) }), h('b', { text: nm(t.name) }), h('span', { class: 'mute sm', text: t.symptoms.length + ' ' + T(['symptoms', 'عرض']) + (n ? ' · ' + n + ' ' + T(['cases', 'حالة']) : '') }))); }
    c.appendChild(grid);
    c.appendChild(h('p', { class: 'mute sm', text: T(['The built-in knowledge works offline. It ranks causes using typical failure patterns and what you enter. It is a guide, not a substitute for the maker\'s documentation or a competent person.', 'المعرفة المدمجة شغالة من غير نت. بترتب الأسباب حسب أنماط الأعطال الشائعة واللي بتدخله. هي دليل، مش بديل عن كتالوج الشركة أو شخص مؤهل.']) }));
    return c;
  }
  function workCol() {
    const S = st.S, r = KB.rank(S), n = KB.next(S), t = S.t;
    const col = h('div', { class: 'ins-work' });
    col.appendChild(h('div', { class: 'card ins-type' }, h('span', { class: 'ti', html: icon(st.type) }), h('div', { class: 'grow' }, h('b', { text: nm(t.name) }), h('div', { class: 'mute sm', text: T(['Isolate and lock out before you touch anything.', 'اعزل واعمل لوتو قبل ما تلمس أي حاجة.']) })),
      btn(T(['Change', 'غيّر']), () => { st = null; render(); }, 'sm')));
    col.appendChild(h('details', { class: 'card ins-guide' }, h('summary', { text: T(['Before you start', 'قبل ما تبدأ']) }), t.guide.map((x) => h('p', { text: nm(x) }))));
    col.appendChild(metaCard());
    col.appendChild(symptomsCard()); col.appendChild(findingsCard());
    const concl = conclusionCard(r);
    col.appendChild(rankCard(r));
    if (concl) col.appendChild(concl);
    col.appendChild(checkCard(n));
    const tc = teachCard(r); if (tc) col.appendChild(tc);
    const rc = reportCard(r); if (rc) col.appendChild(rc);
    col.appendChild(aiCard());
    return col;
  }
  function render() {
    if (!root) return;
    const top = scrollEl ? scrollEl.scrollTop : 0;
    const oldPhoto = st && st.ph ? st.ph.wrap : null;
    root.innerHTML = '';
    root.appendChild(head());
    if (!st) root.appendChild(typeGrid());
    else { root.appendChild(h('div', { class: 'ins-grid' }, h('div', { class: 'ins-left' }, photoCol()), workCol())); if (st.photo) requestAnimationFrame(() => { if (st && st.ph && !st.ph.fitted) { st.ph.fitted = true; fitView(); } }); }
    if (scrollEl) scrollEl.scrollTop = top;
  }
  IN.init = function () { root = $('#inspectRoot'); scrollEl = root && root.parentNode; ui.onRefresh(() => { if (st) st.ph = null; render(); }); render(); };
  IN.onShow = function () { render(); };
  IN._state = () => st;
  IN._open = (type) => { st = fresh(type); render(); return st; };
  IN._load = loadFile;
  IN._hints = computeHints;
})(typeof window !== 'undefined' ? window : globalThis);
