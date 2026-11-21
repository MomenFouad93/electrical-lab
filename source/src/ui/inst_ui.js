/* Instrument faceplates, search by name, learn mode */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, I = EL.inst, D = EL.instDocs;
  const inst = (ui.inst = { root: null, refs: {}, face: null, last: 0 });
  const curC = () => { const ed = ui.activeEd(); return ed ? ed.c : null; };
  I.learn = false;
  const RG = {
    VAC: [{ m: 6, u: 'V' }, { m: 60, u: 'V' }, { m: 600, u: 'V' }, { m: 1000, u: 'V' }],
    VDC: [{ m: 6, u: 'V' }, { m: 60, u: 'V' }, { m: 600, u: 'V' }, { m: 1000, u: 'V' }],
    MV: [{ m: 600, u: 'mV', s: 1000 }],
    MA: [{ m: 60, u: 'mA', s: 1000 }, { m: 400, u: 'mA', s: 1000 }],
    A: [{ m: 10, u: 'A' }],
    OHM: [{ m: 600, u: 'Ω' }, { m: 6, u: 'kΩ', s: 1e-3 }, { m: 60, u: 'kΩ', s: 1e-3 }, { m: 600, u: 'kΩ', s: 1e-3 }, { m: 6, u: 'MΩ', s: 1e-6 }, { m: 60, u: 'MΩ', s: 1e-6 }],
  };
  const dec = (m) => (m <= 6 ? 3 : m <= 60 ? 2 : m <= 600 ? 1 : 0);

  /* ---------- helpers ---------- */
  function docFor(id) { const d = D[I.sel]; return d && d.ctl.find((c) => c[0] === id); }
  function explain(id) {
    const c = docFor(id), box = inst.refs.learn; if (!c || !box) return;
    box.innerHTML = ''; box.appendChild(h('b', { text: T(c[1]) })); box.appendChild(h('p', { text: T(c[2]) }));
    box.style.display = '';
    for (const e of ui.$$('[data-ctl]', inst.root)) e.style.outline = e.dataset.ctl === id ? '3px solid #F55B41' : '';
  }
  inst.explain = explain;
  // wrap a control: in learn mode explain, otherwise act
  function ctl(id, el, act, down, up) {
    el.dataset.ctl = id;
    if (down) {
      el.addEventListener('pointerdown', (e) => { ui.unlockAudio(); if (I.learn) { explain(id); return; } e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) {} down(); sync(); });
      const u = () => { if (!I.learn && up) { up(); sync(); } };
      el.addEventListener('pointerup', u); el.addEventListener('pointercancel', u);
    } else el.addEventListener('click', () => { ui.unlockAudio(); if (I.learn) { explain(id); return; } act(); ui.click(); sync(); });
    return el;
  }
  function sync() { if (inst.face && inst.face.sync) inst.face.sync(); updateChips(); }
  function lcd() {
    const tg = h('div', { class: 'tg' }), v = h('span', { class: 'v' }), u = h('span', { class: 'u' }), sb = h('div', { class: 'sb' });
    const box = h('div', { class: 'lcdbox' }, tg, h('div', { class: 'big' }, v, u), sb);
    return { box, tg, v, u, sb };
  }
  function warnBox() { return h('div', { class: 'warn', style: { display: 'none' } }); }
  function setWarn(el, list) {
    const s = (list || []).map((w) => T(w)).join('\n');
    if (el.dataset.s !== s) { el.dataset.s = s; el.textContent = s; el.style.display = s ? '' : 'none'; el.style.whiteSpace = 'pre-line'; }
  }
  function dial(pos, cur, pick, cls) {
    const n = pos.length, span = Math.min(300, (n - 1) * 40), a0 = -span / 2, step = n > 1 ? span / (n - 1) : 0;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '-130 -130 260 260');
    let s = '';
    pos.forEach((p, i) => {
      const a = (a0 + i * step) * Math.PI / 180, x = Math.sin(a) * 100, y = -Math.cos(a) * 100;
      s += `<g data-pos="${p[0]}" style="cursor:pointer"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="19" fill="transparent"/><text class="dlab" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle">${p[1]}</text></g>`;
      const x1 = Math.sin(a) * 66, y1 = -Math.cos(a) * 66, x2 = Math.sin(a) * 76, y2 = -Math.cos(a) * 76;
      s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#222" stroke-width="2"/>`;
    });
    s += '<circle r="60" fill="#1a1a1a" stroke="#444" stroke-width="3"/><circle r="50" fill="#2b2b2b"/><g class="ptr" style="transform-origin:0 0;transition:transform .22s"><path d="M-8 -18 L0 -54 L8 -18Z" fill="#FDC300"/><circle r="7" fill="#444"/></g>';
    svg.innerHTML = s;
    const wrap = h('div', { class: 'dialwrap' }, svg);
    const ptr = svg.querySelector('.ptr');
    const idx = () => Math.max(0, pos.findIndex((p) => p[0] === cur()));
    const place = () => { ptr.style.transform = `rotate(${a0 + idx() * step}deg)`; };
    svg.addEventListener('click', (e) => {
      ui.unlockAudio();
      const gp = e.target.closest('[data-pos]');
      const id = gp ? gp.dataset.pos : pos[(idx() + 1) % n][0];
      if (I.learn) { explain(id); return; }
      pick(id); ui.click(); place(); sync();
    });
    for (const gp of svg.querySelectorAll('[data-pos]')) gp.dataset.ctl = gp.dataset.pos;
    wrap.dataset.ctl = '';
    return { wrap, place };
  }
  function keyBtn(label, id, act, cls) { return ctl(id, h('button', { class: 'key ' + (cls || ''), text: label }), act); }

  /* ---------- DMM ---------- */
  function dmmFmt(o) {
    const d = I.dmm;
    if (d.dial === 'OFF') return { t: '', u: '', tags: [] };
    const tags = [];
    if (d.fuseBlown) return { t: 'FUSE', u: '', tags };
    let t = o.t, u = o.u || '', val = o.val;
    const R = RG[d.dial];
    const mm = d.minmax ? d.mmView || 'live' : null;
    if (mm === 'max' && d.max != null) val = d.max; else if (mm === 'min' && d.min != null) val = d.min;
    const textual = ['OL', 'Err', 'FUSE', '----', ''].includes(t);
    if (R && val != null && isFinite(val) && !textual && !(d.dial === 'VAC' && d.hz)) {
      if (d.rel) val -= d.relRef;
      let rs = R.map((r) => Math.abs(val * (r.s || 1)) <= r.m);
      let i = d.manual ? Math.min(d.rangeIdx || 0, R.length - 1) : Math.max(0, rs.indexOf(true));
      if (!d.manual && rs.indexOf(true) < 0) i = R.length - 1;
      const r = R[i], x = val * (r.s || 1);
      if (Math.abs(x) > r.m * 1.1) t = 'OL'; else t = x.toFixed(dec(r.m));
      const sym = (u.match(/[~⎓]$/) || [''])[0];
      u = r.u + (d.dial === 'OHM' ? '' : sym);
      if (!d.manual) tags.push('AUTO'); else tags.push('RANGE ' + (i + 1));
    }
    if (d.hold) tags.push('HOLD');
    if (d.rel) tags.push('REL');
    if (mm) tags.push(mm === 'live' ? 'MIN MAX' : mm === 'max' ? 'MAX' : 'MIN');
    if (d.hz && d.dial === 'VAC') tags.push('Hz');
    if (d.dial === 'CONT') tags.push('•))');
    if (d.dial === 'DIODE') tags.push('▷|');
    return { t, u, tags };
  }
  function resetDmmModes() { const d = I.dmm; d.hold = false; d.held = null; d.manual = false; d.minmax = false; d.min = d.max = null; d.rel = false; d.hz = false; d.mmView = null; }
  function faceDmm() {
    const d = I.dmm, L = lcd(), W = warnBox(), root = h('div', { class: 'fp dmm' });
    const POS = [['OFF', 'OFF'], ['VAC', 'V~'], ['VDC', 'V⎓'], ['MV', 'mV'], ['OHM', 'Ω'], ['CONT', '•))'], ['DIODE', '▷|'], ['MA', 'mA'], ['A', 'A']];
    const dl = dial(POS, () => d.dial, (id) => { d.dial = id; resetDmmModes(); if (id === 'MA' || id === 'A') d.acdc = d.acdc || 'DC'; if (id === 'VAC') d.acdc = 'AC'; if (id === 'VDC') d.acdc = 'DC'; }, 'dmm');
    const keys = h('div', { class: 'keys', style: { gridTemplateColumns: 'repeat(3,1fr)' } });
    const kHold = keyBtn('HOLD', 'HOLD', () => { d.hold = !d.hold; d.held = d.hold ? { t: L.v.textContent, u: L.u.textContent } : null; });
    const kRange = keyBtn('RANGE', 'RANGE', () => { const R = RG[d.dial]; if (!R) return; if (!d.manual) { d.manual = true; const v = lastVal; const rs = R.map((r) => Math.abs((v || 0) * (r.s || 1)) <= r.m); d.rangeIdx = Math.max(0, rs.indexOf(true)); } else if (d.rangeIdx + 1 >= R.length) { d.manual = false; } else d.rangeIdx++; });
    const kMM = keyBtn('MIN MAX', 'MINMAX', () => { if (!d.minmax) { d.minmax = true; d.min = d.max = null; d.mmView = 'live'; } else if (d.mmView === 'live') d.mmView = 'max'; else if (d.mmView === 'max') d.mmView = 'min'; else { d.minmax = false; d.mmView = null; } });
    const kRel = keyBtn('REL Δ', 'REL', () => { d.rel = !d.rel; d.relRef = d.rel ? lastVal || 0 : 0; });
    const kHz = keyBtn('Hz', 'HZ', () => { if (d.dial === 'VAC') d.hz = !d.hz; });
    const kY = keyBtn('~ / ⎓', 'YEL', () => { if (d.dial === 'MA' || d.dial === 'A') d.acdc = d.acdc === 'AC' ? 'DC' : 'AC'; }, 'y');
    keys.append(kHold, kRange, kMM, kRel, kHz, kY);
    const jacks = h('div', { class: 'jacks' });
    const J = [['A', '10 A'], ['mA', 'mA µA'], ['COM', 'COM'], ['V', 'VΩ']];
    const jEls = {};
    for (const [id, lab] of J) {
      const b = h('button', { 'aria-label': lab });
      const el = h('div', { class: 'jack' + (id === 'COM' ? '' : ' red') }, b, h('div', { text: lab }));
      if (id !== 'COM') ctl('jack', b, () => { d.jack = id; }); else b.addEventListener('click', () => { if (I.learn) explain('jack'); });
      jEls[id] = el; jacks.appendChild(el);
    }
    const fuseBtn = h('button', { class: 'btn sm', style: { display: 'none', marginTop: '6px' }, text: T(['Replace fuse', 'غيّر الفيوز']), onclick: () => { d.fuseBlown = false; I.msg = ''; sync(); } });
    let lastVal = 0;
    root.append(L.box, dl.wrap, keys, jacks, W, fuseBtn);
    return {
      el: root, sync() {
        dl.place();
        kHold.classList.toggle('on', d.hold); kRange.classList.toggle('on', d.manual); kMM.classList.toggle('on', d.minmax); kRel.classList.toggle('on', d.rel); kHz.classList.toggle('on', d.hz);
        for (const k of Object.keys(jEls)) jEls[k].classList.toggle('sel', k === d.jack);
        fuseBtn.style.display = d.fuseBlown ? '' : 'none';
      },
      frame(sim, c) {
        const o = EL.dmmRead(c, sim); lastVal = o.val;
        let f = dmmFmt(o);
        if (d.hold && d.held) f = { t: d.held.t, u: d.held.u, tags: f.tags };
        L.tg.textContent = f.tags.join('  '); L.v.textContent = f.t; L.u.textContent = f.u; L.sb.textContent = o.sub || '';
        setWarn(W, (o.warn || []).concat(I.msg && d.fuseBlown ? [I.msg] : []));
        ui.beep(!!(o.beep && d.dial === 'CONT'));
      },
    };
  }

  /* ---------- Clamp ---------- */
  function faceClamp() {
    const k = I.clamp, L = lcd(), W = warnBox(), root = h('div', { class: 'fp clamp' });
    const POS = [['OFF', 'OFF'], ['AAC', 'A~'], ['ADC', 'A⎓'], ['VAC', 'V~'], ['VDC', 'V⎓'], ['OHM', 'Ω'], ['CONT', '•))']];
    const dl = dial(POS, () => k.dial, (id) => { k.dial = id; k.hold = false; k.held = null; k.inrush = false; k.minmax = false; k.peak = 0; });
    const jaw = h('div', { style: { textAlign: 'center', margin: '4px 0' }, html: '<svg viewBox="0 0 120 60" width="120" height="60"><path d="M20 55 V30 a40 40 0 0 1 80 0 V55" fill="none" stroke="#222" stroke-width="12"/><path d="M20 55 V30 a40 40 0 0 1 80 0 V55" fill="none" stroke="#FDC300" stroke-width="6" opacity=".0"/><rect x="52" y="22" width="16" height="30" fill="#c06a2b" rx="3"/></svg>' });
    jaw.dataset.ctl = 'jaw'; jaw.addEventListener('click', () => { if (I.learn) explain('jaw'); });
    const keys = h('div', { class: 'keys' });
    const kH = keyBtn('HOLD', 'HOLD', () => { k.hold = !k.hold; k.held = k.hold ? { t: L.v.textContent, u: L.u.textContent } : null; });
    const kI = keyBtn('INRUSH', 'INRUSH', () => { if (!k.inrush) { k.inrush = true; k.minmax = false; } k.peak = 0; }, 'y');
    const kM = keyBtn('MIN MAX', 'MINMAX', () => { k.minmax = !k.minmax; k.inrush = false; k.peak = 0; });
    const kZ = keyBtn('ZERO', 'ZERO', () => { k.peak = 0; k.inrush = false; k.minmax = false; });
    keys.append(kH, kI, kM, kZ);
    root.append(L.box, jaw, dl.wrap, keys, W);
    return {
      el: root, sync() { dl.place(); kH.classList.toggle('on', k.hold); kI.classList.toggle('on', k.inrush); kM.classList.toggle('on', k.minmax); },
      frame(sim, c) {
        const o = EL.clampRead(c, sim);
        let t = o.t, u = o.u;
        if (k.hold && k.held) { t = k.held.t; u = k.held.u; }
        L.tg.textContent = [k.hold ? 'HOLD' : '', k.inrush ? 'INRUSH' : '', k.minmax ? 'MAX' : ''].filter(Boolean).join('  ');
        L.v.textContent = t; L.u.textContent = u; L.sb.textContent = o.sub || '';
        setWarn(W, o.warn); ui.beep(!!(o.beep && k.dial === 'CONT'));
      },
    };
  }

  /* ---------- Megger ---------- */
  function faceMeg() {
    const m = I.meg, L = lcd(), W = warnBox(), root = h('div', { class: 'fp meg' });
    const volts = h('div', { class: 'seg', style: { margin: '8px 0' } });
    const vb = [250, 500, 1000].map((v) => ctl('volt', h('button', { class: 'btn', text: v + ' V' }), () => { m.v = v; m.result = null; }));
    vb.forEach((b, i) => { b.dataset.v = [250, 500, 1000][i]; volts.appendChild(b); });
    const bar = h('div', { class: 'bar' }, h('i'));
    const verdict = h('div', { style: { fontWeight: '700', marginTop: '6px', minHeight: '20px' } });
    const test = ctl('TEST', h('button', { class: 'key', style: { width: '100%', fontSize: '16px', padding: '14px', background: '#c42' }, text: 'TEST (hold)' }), null, () => { m.testing = true; m.t = 0; }, () => { if (!m.lock) m.testing = false; });
    test.textContent = T(['TEST (hold)', 'TEST (اضغط واستنى)']);
    const lockB = ctl('TEST', h('button', { class: 'key', text: 'LOCK' }), () => { m.lock = !m.lock; if (m.lock) m.testing = true; else m.testing = false; });
    const labels = h('div', { class: 'row', style: { justifyContent: 'space-around', margin: '8px 0', fontWeight: '700', fontSize: '12px' } },
      ctl('LINE', h('span', { text: '● LINE (red)', style: { color: '#c22' } }), () => {}), ctl('EARTH', h('span', { text: '● EARTH (black)' }), () => {}));
    for (const e of labels.children) e.addEventListener('click', () => { if (I.learn) explain(e.dataset.ctl); });
    const read = h('div', { class: 'row', style: { marginTop: '8px' } }, h('span', { class: 'grow' }, test), h('span', {}, lockB));
    read.firstChild.style.flex = '1';
    root.append(L.box, bar, verdict, volts, read, labels, W);
    const readInfo = ctl('read', h('div', { class: 'mute', style: { fontSize: '11px', marginTop: '4px', color: '#444' }, text: T(['Tap in Learn mode to read about the verdict.', 'اضغط في وضع التعلم عشان تقرا عن الحكم.']) }), () => {});
    readInfo.addEventListener('click', () => { if (I.learn) explain('read'); });
    root.appendChild(readInfo);
    return {
      el: root, sync() { for (const b of vb) b.classList.toggle('on', +b.dataset.v === m.v); lockB.classList.toggle('on', !!m.lock); },
      frame(sim, c, dt) {
        const o = EL.megRead(c, sim);
        if (m.testing) m.t += dt; 
        let t = o.t, u = o.u, sub = o.sub, v = '', bp = 0;
        if (o.state === 'test' && m.testing) {
          const R = o.val * (1 - Math.exp(-m.t / 2.5)), mo = R / 1e6;
          t = o.val >= 1e10 && m.t > 8 ? '>10000' : mo >= 100 ? mo.toFixed(0) : mo >= 10 ? mo.toFixed(1) : mo.toFixed(2);
          u = 'MΩ'; sub = m.v + ' V   ' + m.t.toFixed(0) + ' s';
          bp = Math.max(0, Math.min(1, (Math.log10(Math.max(mo, 0.001)) + 3) / 7));
          v = mo >= 100 ? 'GOOD' : mo >= 10 ? 'OK' : mo >= 1 ? 'MARGINAL' : 'FAIL';
          if (m.t > 6) m.result = R; else m.result = null;
          m._v = v;
        } else if (o.state === 'idle' && m.result != null) { const mo = m.result / 1e6; t = mo >= 100 ? mo.toFixed(0) : mo >= 10 ? mo.toFixed(1) : mo.toFixed(2); u = 'MΩ'; sub = T(['last result', 'آخر نتيجة']); v = m._v || ''; bp = Math.max(0, Math.min(1, (Math.log10(Math.max(mo, 0.001)) + 3) / 7)); }
        L.tg.textContent = m.testing ? T(['TESTING ', 'بيختبر ']) + m.v + ' V' : '';
        L.v.textContent = t; L.u.textContent = u; L.sb.textContent = sub || '';
        bar.firstChild.style.width = (bp * 100).toFixed(0) + '%';
        const vt = { GOOD: T(['GOOD', 'ممتاز']), OK: T(['ACCEPTABLE', 'مقبول']), MARGINAL: T(['MARGINAL', 'ضعيف']), FAIL: T(['FAIL: insulation breakdown', 'فاشل: العزل منهار']) }[v] || '';
        verdict.textContent = vt; verdict.style.color = v === 'FAIL' ? '#c00' : v === 'MARGINAL' ? '#a60' : '#276';
        setWarn(W, o.warn);
      },
    };
  }

  /* ---------- Calibrator ---------- */
  function faceCal() {
    const k = I.cal, L = lcd(), W = warnBox(), root = h('div', { class: 'fp cal' });
    const modes = [['src_mA', ['Source mA', 'مصدر mA']], ['src_V', ['Source V', 'مصدر V']], ['meas_mA', ['Measure mA', 'قياس mA']], ['loop', ['Loop power', 'باور لوب']], ['sim_tx', ['Sim TX', 'محاكاة TX']]];
    const mrow = h('div', { class: 'row wrap', style: { margin: '8px 0' } });
    const mb = modes.map(([id, nm]) => { const b = ctl('mode', h('button', { class: 'btn sm', text: T(nm), 'data-m': id }), () => { k.mode = id; k.on = false; }); mrow.appendChild(b); return b; });
    const num = h('input', { type: 'number', step: '0.01', style: { width: '90px', textAlign: 'end' }, onchange: (e) => { if (I.learn) return; const v = +e.target.value; if (k.mode === 'src_V') k.V = Math.max(0, Math.min(10, v)); else k.mA = Math.max(0, Math.min(24, v)); sync(); } });
    const stepB = h('button', { class: 'btn sm', text: 'step 1' });
    let coarse = true;
    const pcts = h('div', { class: 'keys', style: { gridTemplateColumns: 'repeat(5,1fr)' } });
    [0, 25, 50, 75, 100].forEach((p) => pcts.appendChild(ctl('pct', h('button', { class: 'key', text: p + '%' }), () => { k.mA = 4 + 16 * p / 100; })));
    const row = h('div', { class: 'row wrap', style: { marginTop: '8px' } });
    const minus = ctl('step', h('button', { class: 'key', style: { width: '48px' }, text: '−' }), () => { const s = coarse ? 1 : 0.01; if (k.mode === 'src_V') k.V = Math.max(0, +(k.V - s).toFixed(3)); else k.mA = Math.max(0, +(k.mA - s).toFixed(3)); });
    const plus = ctl('step', h('button', { class: 'key', style: { width: '48px' }, text: '+' }), () => { const s = coarse ? 1 : 0.01; if (k.mode === 'src_V') k.V = Math.min(10, +(k.V + s).toFixed(3)); else k.mA = Math.min(24, +(k.mA + s).toFixed(3)); });
    const stp = ctl('step', stepB, () => { coarse = !coarse; stepB.textContent = coarse ? 'step 1' : 'step 0.01'; });
    const b24 = ctl('24', h('button', { class: 'key', text: '24 mA' }), () => { k.mA = 24; });
    const out = ctl('out', h('button', { class: 'key', style: { flex: '1', background: '#2f6b3a' }, text: 'OUTPUT' }), () => { k.on = !k.on; });
    row.append(minus, num, plus, stp, b24, out);
    const note = h('div', { class: 'mute', style: { marginTop: '6px', fontSize: '11px', color: '#b8c4df' } });
    root.append(mrow, L.box, pcts, row, note, W);
    return {
      el: root, sync() {
        for (const b of mb) b.classList.toggle('on', b.dataset.m === k.mode);
        out.classList.toggle('on', k.on); out.textContent = k.on ? T(['OUTPUT ON', 'الخرج شغال']) : T(['OUTPUT OFF', 'الخرج مقفول']);
        const v = k.mode === 'src_V' ? k.V : k.mA; if (document.activeElement !== num) num.value = v;
        const gen = k.mode === 'src_mA' || k.mode === 'src_V' || k.mode === 'sim_tx';
        pcts.style.display = k.mode === 'src_V' ? 'none' : gen ? '' : 'none'; row.style.display = gen ? '' : 'none';
        note.textContent = { src_mA: T(['OUT+ (red) to the device +, OUT− (black) to the device −.', 'OUT+ (الأحمر) على + الجهاز و OUT− (الأسود) على −.']), src_V: T(['0 to 10 V output, max about 25 mA.', 'خرج 0 لـ 10 فولت، الأقصى حوالي 25 ملي.']), meas_mA: T(['Put the meter in series with the loop.', 'حط الجهاز على التوالي مع اللوب.']), loop: T(['Gives 24 V to a 2-wire transmitter and reads the loop current.', 'بيدي 24 فولت للترانسميتر ويقرا تيار اللوب.']), sim_tx: T(['Acts as a transmitter on an external 24 V loop.', 'بيتصرف كترانسميتر على لوب 24 فولت خارجي.']) }[k.mode];
      },
      frame(sim, c) {
        const o = EL.calRead(c, sim);
        L.tg.textContent = k.on ? (k.mode === 'src_mA' || k.mode === 'src_V' || k.mode === 'sim_tx' ? 'OUTPUT ON' : '') : '';
        L.v.textContent = o.t; L.u.textContent = o.u; L.sb.textContent = (o.main2 || o.sub || '');
        setWarn(W, o.warn);
      },
    };
  }

  /* ---------- Two-pole tester ---------- */
  function faceTester() {
    const t = I.tester, root = h('div', { class: 'fp tester' });
    const LV = [12, 24, 50, 120, 230, 400, 690], rows = LV.map((v) => h('div', { text: v + ' V' }));
    const ladder = ctl('ladder', h('div', { class: 'ladder' }, rows), () => {});
    ladder.addEventListener('click', () => { if (I.learn) explain('ladder'); });
    const acL = h('span', {}, h('span', { class: 'lamp' }), 'AC'), pL = h('span', {}, h('span', { class: 'lamp' }), '+'), nL = h('span', {}, h('span', { class: 'lamp r' }), '−');
    const pol = ctl('pol', h('div', { class: 'row', style: { gap: '14px', fontWeight: '700' } }, acL, pL, nL), () => {});
    pol.addEventListener('click', () => { if (I.learn) explain('pol'); });
    const self = ctl('self', h('button', { class: 'key', style: { width: '100%', marginTop: '8px' }, text: T(['SELF TEST (hold)', 'اختبار ذاتي (اضغط)']) }), null, () => { t.self = true; }, () => { t.self = false; });
    const msg = h('div', { style: { minHeight: '20px', fontWeight: '700', marginTop: '8px' } });
    const W = warnBox();
    const prove = h('div', { class: 'mute', style: { fontSize: '11px', color: '#ffe', marginTop: '6px' }, text: T(['Prove-test-prove: test a known live source, then your circuit, then the known source again.', 'اختبر-اختبر-اختبر: مصدر معروف، وبعدين دايرتك، وبعدين المصدر المعروف تاني.']) });
    prove.dataset.ctl = 'prove'; prove.addEventListener('click', () => { if (I.learn) explain('prove'); });
    root.append(ladder, pol, self, msg, prove, W);
    return {
      el: root, sync() {},
      frame(sim, c) {
        const o = EL.testerRead(c, sim);
        rows.forEach((r, i) => r.classList.toggle('on', o.levels.includes(LV[i])));
        acL.firstChild.classList.toggle('on', !!o.ac && !t.self); pL.firstChild.classList.toggle('on', !!o.pos); nL.firstChild.classList.toggle('on', !!o.neg);
        msg.textContent = o.msg || (o.live ? Math.round(o.v) + ' V ~' : '');
        setWarn(W, o.warn);
      },
    };
  }

  /* ---------- NCV pen ---------- */
  function faceNcv() {
    const n = I.ncv, root = h('div', { class: 'fp ncv' });
    const led = h('div', { style: { width: '70px', height: '70px', borderRadius: '50%', background: '#511', margin: '10px auto', border: '4px solid #222', transition: 'all .1s' } });
    led.dataset.ctl = 'led'; led.addEventListener('click', () => { if (I.learn) explain('led'); });
    const msg = h('div', { style: { textAlign: 'center', fontWeight: '700', minHeight: '38px' } });
    const sens = ctl('sens', h('button', { class: 'key', style: { width: '100%' }, text: 'HI' }), () => { n.hi = !n.hi; });
    const lim = h('div', { class: 'mute', style: { fontSize: '11px', marginTop: '6px', color: '#333' }, text: T(['Quick screening only. Never use it to prove a circuit is dead.', 'للفحص السريع بس. ماتستخدمهوش لإثبات إن الدايرة ميتة.']) });
    lim.dataset.ctl = 'limits'; lim.addEventListener('click', () => { if (I.learn) explain('limits'); });
    root.append(led, msg, sens, lim);
    return {
      el: root, sync() { sens.textContent = (n.hi ? 'HI' : 'LO') + ' ' + T(['sensitivity', 'حساسية']); },
      frame(sim, c) {
        const o = EL.ncvRead(c, sim);
        led.style.background = o.det ? '#f33' : '#511'; led.style.boxShadow = o.det ? '0 0 24px #f33' : 'none';
        msg.textContent = o.det ? T(['Voltage detected!', 'فيه جهد!']) : o.msg || T(['No field', 'مفيش مجال']);
        ui.beep(o.det);
      },
    };
  }
  const FACES = { dmm: faceDmm, clamp: faceClamp, meg: faceMeg, cal: faceCal, tester: faceTester, ncv: faceNcv };

  /* ---------- panel ---------- */
  function iconFor(id) {
    const s = { dmm: '<rect x="8" y="3" width="20" height="30" rx="4" fill="#FDC300" stroke="#222"/><rect x="11" y="6" width="14" height="8" fill="#c8d5b0"/><circle cx="18" cy="23" r="5" fill="#222"/>', clamp: '<path d="M8 30 V14 a10 10 0 0 1 20 0 V30" fill="none" stroke="#FDC300" stroke-width="6"/><rect x="12" y="20" width="12" height="14" fill="#222"/>', meg: '<rect x="5" y="9" width="26" height="22" rx="4" fill="#bbb" stroke="#222"/><rect x="8" y="12" width="20" height="8" fill="#c8d5b0"/><circle cx="18" cy="26" r="3" fill="#c33"/>', cal: '<rect x="7" y="4" width="22" height="28" rx="4" fill="#2b3550" stroke="#789"/><rect x="10" y="7" width="16" height="8" fill="#c8d5b0"/><text x="18" y="26" fill="#fff" font-size="8" text-anchor="middle">mA</text>', tester: '<rect x="14" y="4" width="8" height="26" rx="3" fill="#d9342b"/><path d="M18 30 L10 34 M18 30 L26 34" stroke="#222" stroke-width="2"/>', ncv: '<rect x="14" y="2" width="8" height="30" rx="3" fill="#e8bf1c"/><circle cx="18" cy="6" r="3" fill="#f33"/>' }[id];
    return h('span', { html: '<svg viewBox="0 0 36 36">' + s + '</svg>' });
  }
  inst.render = function () {
    const root = inst.root; if (!root) return;
    ui.beep(false);
    root.innerHTML = ''; root.classList.toggle('learnmode', I.learn);
    // search
    const sug = h('div', { class: 'sugg', style: { display: 'none' } });
    const pick = (id) => { sug.style.display = 'none'; inst.choose(id); };
    const si = h('input', { type: 'search', placeholder: T(['Pick a tool by name (multimeter, megger, clamp...)', 'اختار الأداة بالاسم (ملتيميتر، ميجر، كلامب...)']), oninput: () => {
      const q = si.value.trim().toLowerCase(); sug.innerHTML = '';
      if (!q) { sug.style.display = 'none'; return; }
      const m = EL.instList.filter((x) => (x[1].join(' ') + ' ' + x[2]).toLowerCase().includes(q));
      m.forEach((x) => sug.appendChild(h('div', { text: T(x[1]), onclick: () => { si.value = ''; pick(x[0]); } })));
      sug.style.display = m.length ? '' : 'none';
    }, onkeydown: (e) => { if (e.key === 'Enter' && sug.firstChild) { sug.firstChild.click(); } } });
    root.appendChild(h('div', { class: 'search' }, si, sug));
    const grid = h('div', { class: 'instpick' });
    for (const [id, nm] of EL.instList) grid.appendChild(h('button', { class: 'ipick' + (I.sel === id ? ' on' : ''), onclick: () => inst.choose(id) }, iconFor(id), h('div', { text: T(nm) })));
    root.appendChild(grid);
    // learn toggle
    root.appendChild(h('div', { class: 'row', style: { marginBottom: '8px' } },
      h('b', { class: 'grow', text: T(D[I.sel].name) }),
      h('button', { class: 'btn sm' + (I.learn ? ' on' : ''), onclick: () => { I.learn = !I.learn; inst.render(); }, text: I.learn ? T(['Learn mode: ON', 'وضع التعلم: شغال']) : T(['Learn mode', 'وضع التعلم']) })));
    if (I.learn) root.appendChild(h('div', { class: 'mute', style: { marginBottom: '6px' }, text: T(['Tap any button, dial position or jack to see what it does. Nothing is operated in this mode.', 'اضغط على أي زرار أو وضع على الدايل أو فتحة عشان تشوف بتعمل إيه. مفيش حاجة بتتشغل في الوضع ده.']) }));
    inst.face = FACES[I.sel]();
    root.appendChild(inst.face.el);
    inst.refs.chips = h('div', { class: 'probechips row wrap' }); root.appendChild(inst.refs.chips);
    inst.refs.learn = h('div', { class: 'learnbox', style: { display: 'none' } }); root.appendChild(inst.refs.learn);
    // docs
    const det = h('details', { open: I.learn ? true : null }, h('summary', { style: { cursor: 'pointer', fontWeight: '700', margin: '10px 0 4px' }, text: T(['What every control does', 'كل زرار بيعمل إيه']) }));
    det.appendChild(h('p', { class: 'mute', text: T(D[I.sel].intro) }));
    for (const c of D[I.sel].ctl) det.appendChild(h('div', { class: 'learnrow', onclick: () => explain(c[0]) }, h('b', { text: T(c[1]) }), h('span', { class: 'grow', text: T(c[2]) })));
    root.appendChild(det);
    inst.face.sync(); updateChips();
  };
  function chipFor(k, lab) {
    const ref = I.probes[k], c = curC();
    const tx = ref && c ? EL.refLabel(c, ref) : T(['not placed', 'مش متحط']);
    const need = EL.instNeeds[I.sel] || [];
    if (!need.includes(k)) return null;
    return h('button', { class: 'btn sm' + (I.active === k && need.length > 1 ? ' on' : ''), onclick: () => { if (need.length > 1) I.active = k; if (ref && I.active === k && false) I.probes[k] = null; updateChips(); }, title: T(['Tap to choose this probe, then tap a terminal on the circuit', 'اضغط عشان تختار البروب ده وبعدين اضغط على طرف في الدايرة']) },
      lab + ': ', h('span', { class: 'ltr', text: tx }), ref ? h('span', { text: ' ✕', onclick: (e) => { e.stopPropagation(); I.probes[k] = null; updateChips(); } }) : null);
  }
  function updateChips() {
    const el = inst.refs.chips; if (!el) return;
    el.innerHTML = '';
    const lab = { red: T(['Red', 'أحمر']), black: T(['Black', 'أسود']), clamp: T(['Clamp', 'فك']), ncv: T(['Pen', 'قلم']) };
    for (const k of ['red', 'black', 'clamp', 'ncv']) { const c = chipFor(k, lab[k]); if (c) el.appendChild(c); }
    const ed = ui.activeEd();
    const hint = ed && ed.mode === 'build' ? T(['Switch to Test mode, then tap terminals.', 'حوّل لوضع الاختبار وبعدين اضغط على الأطراف.']) : T(['Tap a terminal on the circuit to place the selected probe.', 'اضغط على طرف في الدايرة عشان تحط البروب المختار.']);
    el.appendChild(h('div', { class: 'mute', style: { width: '100%', fontSize: '12px' }, text: hint }));
  }
  inst.onProbe = updateChips;
  inst.choose = function (id) {
    I.sel = id; I.active = (EL.instNeeds[id] || ['red'])[0];
    inst.render();
    const ed = ui.activeEd();
    if (ed && ed.mode === 'build') { if (EL.bench.ed === ed) EL.bench.setMode('test'); else if (EL.pcb && EL.pcb.setMode) EL.pcb.setMode('test'); }
    ui.toast(T(D[id].name) + ': ' + T(['tap terminals on the circuit to place the probes.', 'اضغط على الأطراف في الدايرة عشان تحط البروبات.']), '', 3500);
  };
  inst.init = function () { ui.onRefresh(() => inst.render()); };
  inst.mount = function (root) { inst.root = root; inst.render(); };
  let lastT = 0;
  inst.frame = function (sim, now) {
    if (!inst.face || !inst.root || !inst.root.offsetParent) { if (I.sel !== 'dmm' || true) { /* keep updating min/max even when hidden */ } return; }
    const dt = (now - lastT) / 1000; if (dt < 0.1) return; lastT = now;
    const c = curC(); if (!c) return;
    try { inst.face.frame(sim, c, Math.min(dt, 0.5)); } catch (e) { console.error(e); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
