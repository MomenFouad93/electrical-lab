/* Whole plant view (Bench > "Whole plant"): the process (Plant) on top and the electrical panel below, both live,
   with the site cables drawn between every plant item and the panel device it is linked to by tag
   (motor cable, sensor cable, valve coil cable, transmitter cable), and a live PLC I/O strip.
   Drawing only: the simulation and the links are the ones the Plant and Panel views already use. */
(function (g) {
  const EL = g.EL, ui = EL.ui, h = EL.h, T = ui.T, $ = ui.$;
  const FL = (ui.floor = {});
  const B = () => EL.bench;
  const NS = 'http://www.w3.org/2000/svg';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let ov = null, split = null, io = null, chip = null, stage = null, on = false, lastT = 0, sig = '';
  const KEY = 'ellab.floor';
  let st = { cables: true, io: true, split: 52 };
  try { Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  /* cable type by the panel device at the other end */
  function cableOf(part) {
    const t = part.type;
    if (/^MOT/.test(t)) return { k: 'pow', lab: t === 'MOT1' ? '3G1.5' : t === 'MOTDC' ? '2x1.5' : '4G1.5' };
    if (t === 'HTR') return { k: 'pow', lab: '4G2.5' };
    if (t === 'VFD') return { k: 'pow', lab: '4G1.5 shielded' };
    if (t === 'SOL') return { k: 'coil', lab: '3G1' };
    if (/^(PROX|PHOTO)$/.test(t)) return { k: 'sens', lab: '3x0.75 BN BK BU' };
    if (/^(TX|TXV|AI250|PT100)$/.test(t)) return { k: 'ana', lab: t === 'PT100' ? '3x0.5 shielded' : '2x0.75 shielded' };
    return { k: 'sig', lab: '2x0.75' };
  }
  function active(part) {
    const s = part.state || {};
    return !!(s.active || s.on || s.act || s.closed || s.energized || (s.pos || 0) > 0.5 || Math.abs(s.w || 0) > 0.05 || (s.b || 0) > 0.05 || (s.p || 0) > 0.05);
  }
  /* every plant item <-> panel device link (any string prop equal to a panel tag, and tank switches) */
  FL.links = function () {
    const c = B().ed.c, pl = c.plant; if (!pl) return [];
    const byTag = new Map(); for (const p of c.parts) if (p.tag) byTag.set(p.tag, p);
    const out = [];
    for (const u of pl.units) {
      const seen = new Set();
      const add = (tag, why) => { const p = byTag.get(tag); if (!p || seen.has(p.id)) return; seen.add(p.id); out.push({ u, p, why }); };
      for (const k in u.props) { const v = u.props[k]; if (k !== 'tag' && typeof v === 'string' && v) add(v, k); }
      if (Array.isArray(u.props.sw)) for (const s of u.props.sw) if (s && s.t) add(s.t, s.n || 'sw');
    }
    return out;
  };

  function ensure() {
    stage = $('#v-bench .stage');
    if (!ov) {
      ov = document.createElementNS(NS, 'svg'); ov.setAttribute('class', 'fl-ov'); ov.setAttribute('aria-hidden', 'true');
      split = h('div', { class: 'fl-split', role: 'separator', title: T(['Drag to share the screen between the process and the panel', 'اسحب عشان تقسم الشاشة بين العملية واللوحة']) }, h('span'));
      io = h('div', { class: 'fl-io' });
      io.addEventListener('click', (e) => { if (e.target.closest('[data-more]')) { st.ioFull = !st.ioFull; save(); ioSig = ''; paintIO(); } });
      chip = h('div', { class: 'fl-chips' },
        h('button', { type: 'button', class: 'btn sm fl-cab', onclick: () => { st.cables = !st.cables; save(); paint(true); } }),
        h('button', { type: 'button', class: 'btn sm fl-iob', onclick: () => { st.io = !st.io; save(); paint(true); } }),
        h('button', { type: 'button', class: 'btn sm fl-doc', text: '📄 ' + T(['Documents', 'المستندات']), onclick: () => ui.docs && ui.docs.open() }));
      stage.append(ov, split, io, chip);
      dragSplit();
    }
  }
  function dragSplit() {
    split.addEventListener('pointerdown', (e) => {
      e.preventDefault(); split.setPointerCapture(e.pointerId);
      const r = stage.getBoundingClientRect(), top = $('#plantHost').getBoundingClientRect().top, bot = r.bottom;
      const mv = (ev) => { st.split = Math.max(22, Math.min(78, ((ev.clientY - top) / (bot - top)) * 100)); stage.style.setProperty('--fsplit', st.split + '%'); paint(true); };
      const upf = () => { split.removeEventListener('pointermove', mv); split.removeEventListener('pointerup', upf); save(); refit(); };
      split.addEventListener('pointermove', mv); split.addEventListener('pointerup', upf);
    });
  }
  function refit() { requestAnimationFrame(() => { try { ui.plant.fit(); B().ed.fit(); } catch (e) {} paint(true); }); }

  FL.enter = function () {
    ensure(); on = true; stage.classList.add('fl-on'); stage.style.setProperty('--fsplit', st.split + '%');
    ui.plant.render(true); refit(); setTimeout(refit, 60);
  };
  FL.leave = function () { on = false; if (stage) stage.classList.remove('fl-on'); if (ov) ov.innerHTML = ''; sig = ''; };
  FL.frame = function () { if (!on) return; const t = performance.now(); if (t - lastT < 90) return; lastT = t; paint(); };

  function rectOf(el) { const r = el.getBoundingClientRect(); return r.width || r.height ? r : null; }
  function paint(force) {
    if (!on || !ov) return;
    const sr = stage.getBoundingClientRect(), ph = $('#plantHost').getBoundingClientRect(), bh = $('#benchHost').getBoundingClientRect();
    const phone = (g.innerWidth || 1200) <= 900;
    chip.style.top = (phone ? ph.top - sr.top + 50 : ph.top - sr.top + 8) + 'px';
    io.classList.toggle('full', !!st.ioFull); io.style.bottom = 'auto'; io.style.top = Math.max(ph.top - sr.top + 40, ph.bottom - sr.top - io.offsetHeight - 8) + 'px';
    const cab = chip.querySelector('.fl-cab'), iob = chip.querySelector('.fl-iob');
    const cabT = T(st.cables ? ['Site cables: on', 'كابلات الموقع: ظاهرة'] : ['Site cables: off', 'كابلات الموقع: مخفية']);
    cab.textContent = phone ? '🔌' : '🔌 ' + cabT; cab.title = cabT; cab.classList.toggle('on', st.cables);
    iob.textContent = phone ? '▦' : '▦ ' + T(['PLC I/O', 'مداخل ومخارج الـPLC']); iob.title = T(['PLC I/O', 'مداخل ومخارج الـPLC']); iob.classList.toggle('on', st.io);
    const dcb = chip.querySelector('.fl-doc'); if (dcb) { dcb.textContent = phone ? '📄' : '📄 ' + T(['Documents', 'المستندات']); dcb.title = T(['Documents', 'المستندات']); }
    let s = '';
    if (st.cables) {
      const L = FL.links(), per = new Map();
      L.forEach((l, i) => {
        const ue = $('#plantHost g[data-u="' + CSS.escape(l.u.id) + '"]'), pe = $('#benchHost g.part[data-id="' + CSS.escape(l.p.id) + '"]');
        if (!ue || !pe) return;
        const a = rectOf(ue), b = rectOf(pe); if (!a || !b) return;
        const n = (per.get(l.u.id) || 0); per.set(l.u.id, n + 1);
        let x1 = a.left + a.width * Math.min(0.9, 0.3 + n * 0.14), y1 = a.bottom - 4, x2 = b.left + b.width / 2, y2 = b.top + 4;
        const clip1 = y1 > ph.bottom || y1 < ph.top || x1 < ph.left || x1 > ph.right, clip2 = y2 < bh.top || y2 > bh.bottom || x2 < bh.left || x2 > bh.right;
        x1 = Math.max(ph.left + 6, Math.min(ph.right - 6, x1)); y1 = Math.max(ph.top + 6, Math.min(ph.bottom - 4, y1));
        x2 = Math.max(bh.left + 6, Math.min(bh.right - 6, x2)); y2 = Math.max(bh.top + 4, Math.min(bh.bottom - 6, y2));
        x1 -= sr.left; y1 -= sr.top; x2 -= sr.left; y2 -= sr.top;
        const cb = cableOf(l.p), live = active(l.p), dy = Math.max(30, Math.abs(y2 - y1) * 0.5);
        const d = `M${x1.toFixed(1)} ${y1.toFixed(1)} C${x1.toFixed(1)} ${(y1 + dy).toFixed(1)} ${x2.toFixed(1)} ${(y2 - dy).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
        s += `<path class="fl-c ${cb.k}${live ? ' live' : ''}${clip1 || clip2 ? ' off' : ''}" d="${d}"/>`;
        s += `<circle class="fl-end ${cb.k}" cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="3.5"/><circle class="fl-end ${cb.k}" cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="3.5"/>`;
        const selU = ui.plant && ui.plant.sel === l.u.id, selP = B().ed.sel === l.p.id;
        if (selU || selP) {
          const mx = (x1 + x2) / 2 + (i % 3 - 1) * 8, my = (y1 + y2) / 2 + (i % 2 ? 9 : -9), txt = l.u.tag + ' ⇄ ' + l.p.tag + ' · ' + cb.lab, w = Math.max(80, txt.length * 6.2 + 16);
          s += `<g class="fl-lab sel${live ? ' live' : ''}" transform="translate(${mx.toFixed(1)},${my.toFixed(1)})"><rect x="${-w / 2}" y="-9" width="${w}" height="18" rx="9"/><text y="4">${esc(txt)}</text></g>`;
        } else s += `<g class="fl-tag${live ? ' live' : ''}" transform="translate(${x2.toFixed(1)},${(y2 - 10 - (i % 3) * 11).toFixed(1)})"><text>${esc(l.p.tag)}</text></g>`;
      });
    }
    if (force || s !== sig) { sig = s; ov.innerHTML = s; }
    paintIO();
  }
  let ioSig = '';
  function paintIO() {
    if (!st.io) { if (io.innerHTML) { io.innerHTML = ''; ioSig = ''; } io.hidden = true; return; }
    io.hidden = false;
    const c = B().ed.c, LD = EL.ladder, p = c.parts.find((x) => EL.defs[x.type] && (EL.defs[x.type].diag || {}).kind === 'plc' && x.props.mode === 'ladder');
    let html;
    if (!p || !LD) html = `<span class="mute">${esc(T(['No PLC with a ladder program on this panel.', 'مفيش PLC ببرنامج لادر في اللوحة دي.']))}</span>`;
    else {
      const d = EL.defs[p.type].diag || {}, prog = LD.progOf(p), M = LD.mem(p.state, d.nQ), used = LD.used(prog).filter((a) => /^[IQ]\d/.test(a));
      const s = p.state || {};
      html = `<b class="ltr">${esc(p.tag)}</b><span class="fl-run ${s.sup && s.run ? 'ok' : 'bad'}">${esc(s.sup ? (s.run ? 'RUN' : 'STOP') : T(['NO 24 V', 'مفيش 24 فولت']))}</span>`;
      for (const area of ['I', 'Q']) {
        html += `<span class="fl-area">${area === 'I' ? T(['In', 'دخل']) : T(['Out', 'خرج'])}</span>`;
        for (const a of used.filter((x) => x[0] === area)) {
          const v = M.bit(a), nm = LD.symName(prog, a) || '';
          html += `<span class="fl-bit${v ? ' on' : ''}" title="${esc(a + ' ' + nm)}"><i></i><span class="ltr">${esc(a)}</span>${st.ioFull ? ' ' + esc(nm) : ''}</span>`;
        }
      }
      html += `<button type="button" class="fl-more" data-more="1">${esc(st.ioFull ? T(['Short', 'مختصر']) : T(['Names', 'الأسماء']))}</button>`;
    }
    if (html !== ioSig) { ioSig = html; io.innerHTML = html; }
  }
})(typeof window !== 'undefined' ? window : globalThis);
