/* LOTO master board: device detail window (zoom, inside view, lockout on/off, numbered notes, own photos) and the full board scene. */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, $ = ui.$, L = EL.lotoData, DT = EL.lotoDet;
  if (!DT) return;
  const LB = (EL.lotoBoard = { photos: null });
  const nm = (a) => T(a);

  /* ---------- zoom and pan on an SVG viewBox (wheel, drag, pinch, double tap) ---------- */
  LB.zoomify = function (svg, box, opts) {
    opts = opts || {};
    let vb = opts.vb ? Object.assign({}, opts.vb) : { x: box.x, y: box.y, w: box.w, h: box.h };
    const minW = box.w / (opts.maxZoom || 8), maxW = box.w;
    const apply = () => { svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h); if (opts.onZoom) opts.onZoom(box.w / vb.w); };
    const clamp = () => {
      vb.w = Math.max(minW, Math.min(maxW, vb.w)); vb.h = vb.w * box.h / box.w;
      vb.x = Math.max(box.x - vb.w * 0.25, Math.min(box.x + box.w - vb.w * 0.75, vb.x));
      vb.y = Math.max(box.y - vb.h * 0.25, Math.min(box.y + box.h - vb.h * 0.75, vb.y));
    };
    const pt = (cx, cy) => { const r = svg.getBoundingClientRect(); return { x: vb.x + (cx - r.left) / r.width * vb.w, y: vb.y + (cy - r.top) / r.height * vb.h, r }; };
    const zoomAt = (cx, cy, f) => { const p = pt(cx, cy); const nw = Math.max(minW, Math.min(maxW, vb.w / f)); const k = nw / vb.w; vb.x = p.x - (p.x - vb.x) * k; vb.y = p.y - (p.y - vb.y) * k; vb.w = nw; vb.h = nw * box.h / box.w; clamp(); apply(); };
    const ptrs = new Map(); let moved = 0, last = null, pinch = null, downT = 0;
    svg.style.touchAction = 'none';
    svg.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.18 : 1 / 1.18); }, { passive: false });
    svg.addEventListener('pointerdown', (e) => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { svg.setPointerCapture(e.pointerId); } catch (x) { /* synthetic events */ }
      moved = 0; downT = Date.now();
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; }
      last = { x: e.clientX, y: e.clientY };
    });
    svg.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2 && pinch) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch.d > 8) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch.d); pinch.d = d; moved = 99; return;
      }
      if (ptrs.size === 1 && last) {
        const dx = e.clientX - last.x, dy = e.clientY - last.y; moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 6) { const r = svg.getBoundingClientRect(); vb.x -= dx * vb.w / r.width; vb.y -= dy * vb.h / r.height; clamp(); apply(); }
        last = { x: e.clientX, y: e.clientY };
      }
    });
    const up = (e) => {
      const was = ptrs.has(e.pointerId); ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
      if (was && ptrs.size === 0 && moved <= 6 && Date.now() - downT < 600 && opts.onTap) opts.onTap(e, pt(e.clientX, e.clientY), document.elementFromPoint(e.clientX, e.clientY));
      if (ptrs.size === 1) last = [...ptrs.values()][0];
    };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', (e) => { ptrs.delete(e.pointerId); pinch = null; });
    svg.addEventListener('dblclick', (e) => { e.preventDefault(); if (vb.w < box.w * 0.9) { vb = { x: box.x, y: box.y, w: box.w, h: box.h }; apply(); } else zoomAt(e.clientX, e.clientY, 2.6); });
    const api = {
      zoom: (f) => { const r = svg.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, f); },
      reset: () => { vb = { x: box.x, y: box.y, w: box.w, h: box.h }; apply(); },
      focus: (x, y, k) => { const nw = Math.max(minW, box.w / (k || 2.4)); vb.w = nw; vb.h = nw * box.h / box.w; vb.x = x - vb.w / 2; vb.y = y - vb.h / 2; clamp(); apply(); },
      get vb() { return Object.assign({}, vb); }, scale: () => box.w / vb.w,
    };
    apply();
    return api;
  };

  /* ---------- own photos (kept on this device) ---------- */
  const PKEY = 'ellab.lotophotos';
  const loadP = () => { if (LB.photos) return LB.photos; try { LB.photos = JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; } catch (e) { LB.photos = {}; } return LB.photos; };
  const saveP = () => { try { localStorage.setItem(PKEY, JSON.stringify(LB.photos)); return true; } catch (e) { return false; } };
  LB.photosOf = (id) => loadP()[id] || [];
  function readImage(file, max, q) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = rej;
      fr.onload = () => {
        const im = new Image(); im.onerror = rej;
        im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res({ url: c.toDataURL('image/jpeg', q), w: c.width, h: c.height }); };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function photoViewer(id, idx, after) {
    const ph = loadP()[id][idx]; if (!ph) return;
    const box = { x: 0, y: 0, w: ph.w, h: ph.h };
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'ld-svg'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    let pend = null, zv = null, sel = -1;
    const info = h('div', { class: 'ld-note' });
    const form = h('div', { class: 'row', style: { margin: '6px 0' } });
    const paint = () => {
      const k = zv ? zv.scale() : 1, R = Math.max(ph.w, ph.h) * 0.018 / k;
      svg.innerHTML = '<image href="' + ph.url + '" x="0" y="0" width="' + ph.w + '" height="' + ph.h + '"/>' + (ph.pins || []).map((p, i) => '<g data-i="' + i + '"><circle cx="' + p.x + '" cy="' + p.y + '" r="' + R + '" fill="' + (i === sel ? '#FDC300' : '#e5483b') + '" stroke="#fff" stroke-width="' + R * 0.14 + '"/><text x="' + p.x + '" y="' + (p.y + R * 0.38) + '" text-anchor="middle" font-size="' + R * 1.1 + '" font-weight="800" fill="' + (i === sel ? '#222' : '#fff') + '">' + (i + 1) + '</text></g>').join('') + (pend ? '<circle cx="' + pend.x + '" cy="' + pend.y + '" r="' + R + '" fill="none" stroke="#FDC300" stroke-width="' + R * 0.2 + '"/>' : '');
    };
    const drawForm = () => {
      form.innerHTML = '';
      if (!pend) return;
      const inp = h('input', { type: 'text', placeholder: T(['What is this part? (e.g. toggle, terminal L1)', 'الجزء ده إيه؟ (مثلا المقبض، طرف L1)']), style: { flex: '1' } });
      form.appendChild(inp);
      form.appendChild(h('button', { class: 'btn pri sm', text: T(['Add label', 'ضيف الاسم']), onclick: () => { const v = inp.value.trim(); if (!v) return; (ph.pins = ph.pins || []).push({ x: pend.x, y: pend.y, label: v }); pend = null; saveP(); drawForm(); paint(); list(); } }));
      form.appendChild(h('button', { class: 'btn sm', text: T(['Cancel', 'إلغاء']), onclick: () => { pend = null; drawForm(); paint(); } }));
      setTimeout(() => inp.focus(), 50);
    };
    const listBox = h('div', {});
    const list = () => {
      listBox.innerHTML = '';
      (ph.pins || []).forEach((p, i) => listBox.appendChild(h('div', { class: 'kv', style: { alignItems: 'center' } }, h('span', { style: { cursor: 'pointer' }, onclick: () => { sel = i; paint(); info.textContent = (i + 1) + '. ' + p.label; zv.focus(p.x, p.y, 3); }, text: (i + 1) + '. ' + p.label }), h('button', { class: 'btn sm', text: '×', onclick: () => { ph.pins.splice(i, 1); saveP(); sel = -1; paint(); list(); } }))));
      if (!(ph.pins || []).length) listBox.appendChild(h('p', { class: 'mute sm', text: T(['No labels yet. Tap the picture where a part is, then name it. Your labels are kept on this device.', 'مفيش أسماء لسه. اضغط على الصورة مكان الجزء وسمّيه. الأسماء بتتحفظ على الجهاز ده.']) }));
    };
    const wrap = h('div', { class: 'ld-stage' }, svg);
    const m = ui.modal([h('div', { class: 'row' }, h('b', { class: 'grow', text: T(['My photo', 'صورتي']) }), h('button', { class: 'btn sm', text: T(['Delete photo', 'امسح الصورة']), onclick: () => { loadP()[id].splice(idx, 1); saveP(); m.remove(); if (after) after(); } }), h('button', { class: 'btn sm', text: T(['Close', 'اقفل']), onclick: () => { m.remove(); if (after) after(); } })), h('p', { class: 'mute sm', text: T(['Pinch or scroll to zoom. Tap a part to label it.', 'كبّر بالقرص أو العجلة. اضغط على جزء عشان تسمّيه.']) }), wrap, form, info, listBox]);
    m.firstChild.classList.add('ld');
    zv = LB.zoomify(svg, box, { maxZoom: 10, onZoom: () => paint(), onTap: (e, p, el) => { const gi = el && el.closest && el.closest('[data-i]'); if (gi) { sel = +gi.dataset.i; const q = ph.pins[sel]; info.textContent = (sel + 1) + '. ' + q.label; paint(); return; } pend = { x: Math.round(p.x), y: Math.round(p.y) }; drawForm(); paint(); } });
    paint(); list();
  }
  function photoCard(id, refresh) {
    const card = h('div', { class: 'card' });
    card.appendChild(h('b', { text: T(['My photos of this device', 'صوري للجهاز ده']) }));
    card.appendChild(h('p', { class: 'mute sm', text: T(['Add a photo of the real one in your plant, zoom in and label its parts. Photos stay on this device only.', 'ضيف صورة للجهاز الحقيقي في مصنعك، كبّرها وسمّي أجزاءه. الصور بتتحفظ على الجهاز ده بس.']) }));
    const row = h('div', { class: 'row wrap' });
    LB.photosOf(id).forEach((ph, i) => row.appendChild(h('div', { class: 'phth', onclick: () => photoViewer(id, i, refresh) }, h('img', { src: ph.url, alt: '' }), (ph.pins || []).length ? h('span', { class: 'pill', text: String(ph.pins.length) }) : null)));
    const file = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onchange: async (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      try { const im = await readImage(f, 1100, 0.78); const P = loadP(); (P[id] = P[id] || []).push({ url: im.url, w: im.w, h: im.h, pins: [] }); if (!saveP()) { P[id].pop(); ui.toast(['The phone storage is full. Delete an older photo first.', 'مساحة التخزين مليانة. امسح صورة قديمة الأول.'], 'warn'); } else refresh(); } catch (er) { ui.toast(['Could not read this photo.', 'مقدرتش أقرا الصورة دي.'], 'warn'); }
    } });
    row.appendChild(h('button', { class: 'btn', text: '+ ' + T(['Add photo', 'ضيف صورة']), onclick: () => file.click() }));
    card.appendChild(row); card.appendChild(file);
    return card;
  }

  /* ---------- device detail window ---------- */
  const CLS = { iso: [['Isolation device', 'جهاز عزل'], 'ok'], ctrl: [['Control device: NOT isolation', 'جهاز تحكم: مش عزل'], 'warn'], load: [['Machine / load', 'ماكينة / حمل'], ''], source: [['Energy source', 'مصدر طاقة'], ''], stored: [['Stored energy', 'طاقة مخزنة'], 'info'], tool: [['LOTO kit item', 'من عدة اللوتو'], '']};
  LB.openDetail = function (id, opts) {
    const d = DT.map[id]; if (!d) return null;
    opts = opts || {};
    const st = { inside: !!opts.inside, lock: opts.lock != null ? !!opts.lock : !!d.defLock, on: false, sel: -1 };
    if (d.states) st.state = 0;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'ld-svg'); svg.setAttribute('viewBox', '0 0 420 300'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const BOX = d.box || { x: 0, y: 0, w: 420, h: 300 };
    const stage = h('div', { class: 'ld-stage' }, svg);
    const note = h('div', { class: 'ld-note' });
    const spotsOf = () => { const s = st.inside ? d.in : d.out; return (typeof s === 'function' ? s(st) : s) || []; };
    let zv = null;
    const bg = '<rect x="-800" y="-600" width="2020" height="1500" fill="#0c1424"/><path d="' + (() => { let p = ''; for (let x = -800; x < 1220; x += 30) p += 'M' + x + ' -600 V900 '; for (let y = -600; y < 900; y += 30) p += 'M-800 ' + y + ' H1220 '; return p; })() + '" stroke="#16213a" stroke-width="1"/>';
    const paint = () => {
      const k = zv ? zv.scale() : 1, R = 10.5 / Math.sqrt(k);
      const sp = spotsOf();
      svg.innerHTML = bg + d.draw(st) + sp.map((s, i) => '<g class="spot" data-i="' + i + '" style="cursor:pointer"><circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + R * 1.9 + '" fill="transparent"/><circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + R + '" fill="' + (i === st.sel ? '#FDC300' : '#1f6fe0') + '" stroke="#fff" stroke-width="' + (1.6 / Math.sqrt(k)) + '"/><text x="' + s[0] + '" y="' + (s[1] + R * 0.36) + '" text-anchor="middle" font-size="' + (R * 1.05) + '" font-weight="800" fill="' + (i === st.sel ? '#222' : '#fff') + '" font-family="system-ui,sans-serif">' + (i + 1) + '</text></g>').join('');
    };
    const noteBox = () => {
      note.innerHTML = '';
      const sp = spotsOf();
      if (st.sel >= 0 && sp[st.sel]) { const s = sp[st.sel]; note.appendChild(h('b', { text: (st.sel + 1) + '. ' + nm([s[2], s[3]]) })); note.appendChild(h('div', { text: nm([s[4], s[5]]) })); if (s[6] && DT.map[s[6]] && s[6] !== id) note.appendChild(h('button', { class: 'btn sm', style: { marginTop: '6px' }, text: T(['Open this part', 'افتح الجزء ده']), onclick: () => LB.openDetail(s[6]) })); }
      else if (st.msg) note.appendChild(h('div', { text: st.msg }));
      else note.appendChild(h('span', { class: 'mute', text: T(['Tap a blue number to see what that part does. Pinch or scroll to zoom, drag to move.', 'اضغط على رقم أزرق تعرف الجزء ده بيعمل إيه. كبّر بالقرص أو العجلة وحرّك بالسحب.']) }));
    };
    const segs = h('div', { class: 'row wrap', style: { gap: '8px', marginBottom: '8px' } });
    const bar = () => {
      segs.innerHTML = '';
      const sg = (items, cur, set) => { const w = h('div', { class: 'seg' }); items.forEach((it, i) => w.appendChild(h('button', { class: 'btn' + (cur === i ? ' on' : ''), onclick: () => set(i), text: T(it) }))); return w; };
      if (d.hasInside !== false) segs.appendChild(sg([['Outside', 'من برا'], ['Inside (cutaway)', 'من جوه (قطاع)']], st.inside ? 1 : 0, (i) => { st.inside = !!i; st.sel = -1; st.msg = ''; redraw(); }));
      if (d.lockable !== false) segs.appendChild(sg([['Normal', 'عادي'], ['LOTO applied', 'اللوتو متركب']], st.lock ? 1 : 0, (i) => { st.lock = !!i; if (st.lock) { st.on = false; } st.msg = ''; redraw(); }));
      if (d.state && d.multi) segs.appendChild(sg(d.state, st.k || 0, (i) => { st.k = i; st.on = i === 0; st.msg = ''; redraw(); }));
      else if (d.state) segs.appendChild(sg(d.state, st.on ? 1 : 0, (i) => { if (i && st.lock) { st.msg = nm(d.block || ['Blocked: the lockout device and padlock stop the handle from moving to ON. That is the whole idea.', 'ممنوع: جهاز اللوتو والقفل مانعين المقبض يروح ON. ده هو الهدف بالظبط.']); noteBox(); ui.buzz && ui.buzz(120); return; } st.on = !!i; st.msg = ''; redraw(); }));
    };
    const redraw = () => { bar(); paint(); noteBox(); };
    const zbtn = h('div', { class: 'ld-zoom' }, h('button', { class: 'btn sm', text: '+', onclick: () => zv.zoom(1.5) }), h('button', { class: 'btn sm', text: '−', onclick: () => zv.zoom(1 / 1.5) }), h('button', { class: 'btn sm', text: '⟲', onclick: () => zv.reset() }));
    stage.appendChild(zbtn);
    const left = h('div', { class: 'ld-left' }, segs, stage, note);
    const right = h('div', { class: 'ld-right' });
    const fill = () => {
      right.innerHTML = '';
      right.appendChild(h('div', { class: 'card' }, h('b', { text: T(['In simple words', 'ببساطة']) }), h('p', { text: nm(d.simple) }), d.feeds ? h('p', { class: 'mute sm', text: nm(d.feeds) }) : null));
      if (d.lock && d.lock.length) right.appendChild(h('div', { class: 'card' }, h('b', { text: T(['How to lock it', 'إزاي تقفله']) }), h('ol', { class: 'ld-ol' }, d.lock.map((x) => h('li', { text: nm(x) })))));
      if (d.prove && d.prove.length) right.appendChild(h('div', { class: 'card' }, h('b', { text: T(['How to prove it is safe', 'إزاي تتأكد إنه آمن']) }), h('ul', { class: 'ld-ol' }, d.prove.map((x) => h('li', { text: nm(x) })))));
      if (d.mistakes && d.mistakes.length) right.appendChild(h('div', { class: 'card bad' }, h('b', { text: T(['Common mistakes', 'أخطاء شائعة']) }), h('ul', { class: 'ld-ol' }, d.mistakes.map((x) => h('li', { text: nm(x) })))));
      if (d.std) right.appendChild(h('p', { class: 'mute sm', text: '📖 ' + nm(d.std) }));
      right.appendChild(photoCard(id, fill));
    };
    const c = CLS[d.cls] || CLS.load;
    const head = h('div', { class: 'row', style: { marginBottom: '8px' } }, h('span', { html: L.icon(d.icon, 46) }), h('div', { class: 'grow' }, h('b', { style: { fontSize: '16px' }, text: nm(d.name) }), h('div', {}, h('span', { class: 'pill ' + c[1], text: T(c[0]) }))), h('button', { class: 'btn sm', onclick: () => m.remove(), text: T(['Close', 'اقفل']) }));
    const m = ui.modal([head, h('div', { class: 'ld-grid' }, left, right)]);
    m.firstChild.classList.add('ld');
    zv = LB.zoomify(svg, BOX, { maxZoom: 7, onZoom: () => paint(), onTap: (e, p, el) => { const sg = el && el.closest && el.closest('.spot'); if (sg) { st.sel = +sg.dataset.i; st.msg = ''; paint(); noteBox(); } else if (st.sel >= 0) { st.sel = -1; paint(); noteBox(); } } });
    redraw(); fill();
    m._st = st; m._zv = zv; m._redraw = redraw;
    return m;
  };
  /* catalog device id -> detail id, and isolation point type -> detail id */
  LB.devMap = { mcb_clip: 'mcb1', mcb3_clip: 'mcb3', mccb_clip: 'mccb', ball_lock: 'ballvalve', gate_lock: 'gatevalve', bfly_lock: 'butterfly', plug_lock: 'plug', cable_lock: 'plug', qdc_lock: 'qdc', fuse_lock: 'fuse', pb_cover: 'estop', sw_lock: 'wallsw', hasp: 'hasp', lockbox: 'lockbox', tag: 'tag', tester: 'tester', block: 'ram', bleed: 'receiver', dstick: 'capbank', pl_red: 'padlock', pl_blue: 'padlock', pl_yel: 'padlock', pl_master: 'padlock' };
  for (const d of DT.list) if (d.ptype && !DT.byType[d.ptype]) DT.byType[d.ptype] = d.id;
  LB.has = (id) => !!DT.map[id];
})(typeof window !== 'undefined' ? window : globalThis);
