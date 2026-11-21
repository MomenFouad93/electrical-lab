/* Ladder view: edit the PLC program as LAD networks, download it, watch it online, ask why a rung is off. */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, $ = ui.$;
  const LD = EL.ladder, esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const LU = (ui.ladder = { plcId: null, work: null, workFor: null, dirty: false, sel: null, issues: null, why: {} });
  const B = () => EL.bench;
  const C = () => B().ed.c;
  const plcs = () => C().parts.filter((p) => p.type === 'PLC24' || p.type === 'PLC24R');
  const plc = () => { const l = plcs(); let p = l.find((x) => x.id === LU.plcId); if (!p) { p = l[0] || null; LU.plcId = p ? p.id : null; } return p; };
  const nQ = (p) => (EL.defs[p.type].diag || {}).nQ || 6;
  let host, bar, scroll, nets, selbar, lastFrame = 0;

  /* ---------- geometry ---------- */
  const CW = 100, CMPW = 116, RH = 86, LY = 50, PADB = 12, COILW = 96, BOXW = 170;
  const ON = '#3ddc6a', OFF = '#56657f';
  function mSeries(items) { let w = 0, hh = RH; for (const it of items) { const m = mItem(it); w += m.w; hh = Math.max(hh, m.h); } return { w: Math.max(w, items.length ? 0 : 40), h: hh }; }
  function mItem(it) { if (it.t === 'PAR') { let w = 0, hh = 0; for (const b of it.br) { const m = mSeries(b); w = Math.max(w, m.w); hh += m.h; } return { w: w + 2 * PADB, h: hh }; } return { w: it.t === 'CMP' ? CMPW : CW, h: RH }; }
  const boxH = (o) => (['COIL', 'SET', 'RST'].includes(o.t) ? RH : o.t === 'SCALE' || ['ADD', 'SUB', 'MUL', 'DIV'].includes(o.t) ? 138 : 124);
  const col = (on) => (on ? ON : OFF);
  const line = (x1, y1, x2, y2, on, w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col(on)}" stroke-width="${w || 3}" stroke-linecap="square"/>`;
  const tt = (x, y, s, cls, a) => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${a || 'middle'}">${esc(s)}</text>`;
  function name(prog, a) { return LD.symName(prog, a); }

  function drawItem(it, x, y, key, ctx) {
    const r = ctx.tr ? ctx.tr.items[key] : null, pin = r ? r.pin : false, pout = r ? r.pout : false, ly = y + LY;
    const sel = ctx.sel === key;
    if (it.t === 'PAR') {
      const m = mItem(it);
      let s = '', by = y, ends = [];
      it.br.forEach((b, bi) => {
        const bm = mSeries(b), bl = by + LY;
        const res = drawSeries(b, x + PADB, by, key + '/' + bi + ':', ctx);
        s += res.s;
        const bend = ctx.tr ? lastPower(b, key + '/' + bi + ':', ctx, pin) : false;
        s += line(x + PADB + bm.w, bl, x + m.w - PADB, bl, bend);
        s += line(x, bl, x + PADB, bl, pin) ;
        ends.push(bl);
        by += bm.h;
      });
      s += line(x, ly, x, ends[ends.length - 1], pin) + line(x + m.w, ly, x + m.w, ends[ends.length - 1], pout);
      s += line(x + m.w - PADB, ly, x + m.w, ly, pout);
      return s;
    }
    const w = it.t === 'CMP' ? CMPW : CW, cx = x + w / 2;
    let s = `<g data-k="${esc(key)}" class="ld-it${sel ? ' sel' : ''}"><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${RH - 4}" rx="6" class="ld-hit"/>`;
    if (it.t === 'CMP') {
      s += line(x, ly, cx - 36, ly, pin) + line(cx + 36, ly, x + w, ly, pout);
      const st = r ? r.st : false;
      s += `<rect x="${cx - 36}" y="${ly - 18}" width="72" height="36" rx="3" fill="${ctx.tr && st ? 'rgba(61,220,106,.18)' : '#141f33'}" stroke="${ctx.tr && st ? ON : '#9aa5b6'}" stroke-width="2"/>`;
      s += tt(cx, ly + 6, it.op === '<>' ? '≠' : it.op === '<=' ? '≤' : it.op === '>=' ? '≥' : it.op, 'ld-op');
      s += tt(cx, y + 14, name(ctx.prog, it.a) || '', 'ld-sym') + tt(cx, y + 28, LD.norm(it.a), 'ld-adr');
      s += tt(cx, ly + 32, LD.norm(it.b) + (name(ctx.prog, it.b) ? ' ' + name(ctx.prog, it.b) : ''), 'ld-adr2');
      if (r && r.val) s += tt(cx - 40, ly - 22, String(r.val[0]), 'ld-val', 'start');
    } else {
      const closed = r ? r.st : false;
      s += line(x, ly, cx - 10, ly, pin) + line(cx + 10, ly, x + w, ly, pout);
      const c2 = ctx.tr && closed ? ON : '#d3dae4';
      s += `<line x1="${cx - 10}" y1="${ly - 15}" x2="${cx - 10}" y2="${ly + 15}" stroke="${c2}" stroke-width="3.5"/><line x1="${cx + 10}" y1="${ly - 15}" x2="${cx + 10}" y2="${ly + 15}" stroke="${c2}" stroke-width="3.5"/>`;
      if (ctx.tr && closed) s += `<rect x="${cx - 8}" y="${ly - 13}" width="16" height="26" fill="rgba(61,220,106,.25)"/>`;
      if (it.t === 'NC') s += `<line x1="${cx - 14}" y1="${ly + 16}" x2="${cx + 14}" y2="${ly - 16}" stroke="${c2}" stroke-width="2.5"/>`;
      if (it.t === 'P' || it.t === 'N') s += tt(cx, ly + 5, it.t, 'ld-op');
      s += tt(cx, y + 14, name(ctx.prog, it.a) || '', 'ld-sym') + tt(cx, y + 30, LD.norm(it.a), 'ld-adr');
      if (r && ctx.tr) s += tt(cx, ly + 32, r.val ? '1' : '0', r.val ? 'ld-v1' : 'ld-v0');
    }
    return s + '</g>';
  }
  function lastPower(items, path, ctx, pin) { if (!items.length) return pin; const r = ctx.tr.items[path + (items.length - 1)]; return r ? r.pout : false; }
  function drawSeries(items, x, y, path, ctx) {
    let s = '', cx = x;
    items.forEach((it, i) => { const m = mItem(it); s += drawItem(it, cx, y, path + i, ctx); cx += m.w; });
    return { s, w: cx - x };
  }
  function drawOut(o, oi, x, y, ctx) {
    const r = ctx.tr ? ctx.tr.outs[oi] : null, pin = r ? r.pin : false, ly = y + LY, sel = ctx.selO === oi;
    let s = `<g data-o="${oi}" class="ld-it${sel ? ' sel' : ''}">`;
    if (['COIL', 'SET', 'RST'].includes(o.t)) {
      const cx = x + COILW / 2, mem = ctx.plc ? LD.mem(ctx.plc.state, nQ(ctx.plc)) : null, on = ctx.tr && mem ? !!mem.bit(o.a) : false;
      s += `<rect x="${x + 2}" y="${y + 2}" width="${COILW - 4}" height="${RH - 4}" rx="6" class="ld-hit"/>`;
      s += line(x, ly, cx - 15, ly, pin);
      const c2 = on ? ON : '#d3dae4';
      s += `<path d="M${cx - 8} ${ly - 16} Q${cx - 18} ${ly} ${cx - 8} ${ly + 16}" fill="none" stroke="${c2}" stroke-width="3"/><path d="M${cx + 8} ${ly - 16} Q${cx + 18} ${ly} ${cx + 8} ${ly + 16}" fill="none" stroke="${c2}" stroke-width="3"/>`;
      if (o.t !== 'COIL') s += tt(cx, ly + 5, o.t === 'SET' ? 'S' : 'R', 'ld-op');
      s += line(cx + 15, ly, x + COILW, ly, false, 1.5);
      s += tt(cx, y + 14, name(ctx.prog, o.a) || '', 'ld-sym') + tt(cx, y + 30, LD.norm(o.a), 'ld-adr');
      return s + '</g>';
    }
    const bh = boxH(o) - 36, bx = x + 16, bw = BOXW - 32;
    s += `<rect x="${x + 2}" y="${y + 2}" width="${BOXW - 4}" height="${boxH(o) - 4}" rx="6" class="ld-hit"/>`;
    s += line(x, ly, bx, ly, pin);
    const eno = r ? r.eno : false;
    s += `<rect x="${bx}" y="${y + 14}" width="${bw}" height="${bh}" rx="3" fill="#141f33" stroke="${ctx.tr && pin ? ON : '#9aa5b6'}" stroke-width="2"/>`;
    s += tt(bx + bw / 2, y + 32, o.t === 'TON' || o.t === 'TOF' || o.t === 'TP' ? LD.norm(o.a) + '  ' + o.t : o.t, 'ld-box');
    s += tt(bx + 6, ly + 4, 'EN', 'ld-pin', 'start') + tt(bx + bw - 6, ly + 4, o.t === 'TON' || o.t === 'TOF' || o.t === 'TP' || o.t === 'CTU' ? 'Q' : 'ENO', 'ld-pin', 'end');
    s += line(bx + bw, ly, x + BOXW, ly, ctx.tr && eno, 2);
    const L = [];
    if (o.t === 'TON' || o.t === 'TOF' || o.t === 'TP') L.push('PT ' + o.pt + ' s');
    else if (o.t === 'CTU') L.push('PV ' + o.pv, o.r ? 'R ' + LD.norm(o.r) : '');
    else if (o.t === 'SCALE') L.push('IN ' + LD.norm(o.in), LD.FULL ? '0..' + LD.FULL + ' → ' + o.lo + '..' + o.hi : '', 'OUT ' + LD.norm(o.out));
    else if (o.t === 'MOVE') L.push('IN ' + LD.norm(o.in), 'OUT ' + LD.norm(o.out));
    else L.push('IN1 ' + LD.norm(o.a), 'IN2 ' + LD.norm(o.b), 'OUT ' + LD.norm(o.out));
    L.filter(Boolean).forEach((t, i) => { s += tt(bx + 8, ly + 22 + i * 14, t, 'ld-pin', 'start'); });
    if (r && ctx.tr && r.val != null) {
      let v = '';
      if (o.t === 'TON' || o.t === 'TOF' || o.t === 'TP') v = 'ET ' + (+r.val).toFixed(1) + ' s';
      else if (o.t === 'CTU') v = 'CV ' + r.val;
      else if (o.t === 'SCALE' || o.t === 'MOVE') v = 'IN ' + r.val[0] + '   ' + LD.norm(o.out) + ' = ' + r.val[1];
      else v = LD.norm(o.out) + ' = ' + r.val[2];
      s += tt(bx, y + boxH(o) - 6, v, 'ld-val', 'start');
    }
    return s + '</g>';
  }
  LU.svgFor = function (n, ni, ctx) {
    const sm = mSeries(n.s), x0 = 20;
    let s = '', outH = 0, ow = 0;
    n.o.forEach((o) => { outH += boxH(o); ow = Math.max(ow, ['COIL', 'SET', 'RST'].includes(o.t) ? COILW : BOXW); });
    const xo = x0 + Math.max(sm.w, 40) + 30, W = xo + Math.max(ow, COILW) + 40, H = Math.max(sm.h, outH, RH) + 8;
    const rung = ctx.tr ? ctx.tr.rung : false;
    s += `<line x1="${x0 - 8}" y1="0" x2="${x0 - 8}" y2="${H}" stroke="${ctx.tr ? ON : '#9aa5b6'}" stroke-width="5"/>`;
    s += `<line x1="${W - 12}" y1="0" x2="${W - 12}" y2="${H}" stroke="#9aa5b6" stroke-width="5"/>`;
    s += line(x0 - 8, LY, x0, LY, !!ctx.tr);
    if (!n.s.length) s += line(x0, LY, x0 + 40, LY, !!ctx.tr);
    const ser = drawSeries(n.s, x0, 0, '', ctx);
    s += ser.s;
    s += line(x0 + Math.max(sm.w, 40), LY, xo, LY, rung);
    let oy = 0;
    n.o.forEach((o, oi) => {
      if (oi > 0) s += line(xo - 14, LY, xo - 14, oy + LY, rung) + line(xo - 14, oy + LY, xo, oy + LY, rung);
      s += drawOut(o, oi, xo, oy, ctx);
      const ow2 = ['COIL', 'SET', 'RST'].includes(o.t) ? COILW : BOXW;
      s += line(xo + ow2, oy + LY, W - 12, oy + LY, false, 1.5);
      oy += boxH(o);
    });
    if (!n.o.length) s += tt(xo + 40, LY + 5, T(['(no output)', '(مفيش خرج)']), 'ld-sym');
    return `<svg class="ld-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="width:100%;max-width:${W}px;min-width:${Math.round(W * 0.6)}px;height:auto">${s}</svg>`;
  };

  /* ---------- work copy ---------- */
  function syncWork() {
    const p = plc();
    if (!p) { LU.work = null; LU.workFor = null; return; }
    const txt = String(p.props.lad || '');
    if (LU.workFor !== p.id || (!LU.dirty && LU._txt !== txt)) {
      LU.work = LD.sanitize(txt ? safeParse(txt) : null);
      LU.workFor = p.id; LU._txt = txt; LU.dirty = false; LU.sel = null; LU.issues = null;
    }
  }
  function safeParse(t) { try { return JSON.parse(t); } catch (e) { return null; } }
  const online = (p) => p && p.props.mode === 'ladder' && !LU.dirty && p.state.sup && p.state.run;
  function mark() { LU.dirty = true; LU.issues = null; render(); }

  /* ---------- path helpers ---------- */
  function resolve(series, key) {
    // '2' = item 2; '2/1:0' = item 0 of branch 1 of the parallel block at 2; deeper levels repeat '/b:i'
    const segs = String(key).split('/');
    let arr = series, idx = +segs[0];
    for (let i = 1; i < segs.length; i++) {
      const par = arr[idx];
      if (!par || par.t !== 'PAR') return null;
      const [bi, ii] = segs[i].split(':').map(Number);
      arr = par.br[bi];
      if (!arr) return null;
      idx = ii;
    }
    return { arr, idx, item: arr[idx] };
  }
  function parentPar(series, key) { const i = key.lastIndexOf('/'); if (i < 0) return null; const r = resolve(series, key.slice(0, i)); return r && r.item && r.item.t === 'PAR' ? r.item : null; }
  function tidy(series) {
    for (let i = series.length - 1; i >= 0; i--) {
      const it = series[i];
      if (it.t !== 'PAR') continue;
      it.br.forEach(tidy);
      it.br = it.br.filter((b) => b.length);
      if (!it.br.length) series.splice(i, 1);
      else if (it.br.length === 1) series.splice(i, 1, ...it.br[0]);
    }
  }

  /* ---------- defaults ---------- */
  function nextFree(prefix, max, used) { for (let i = 1; i <= max; i++) if (!used.includes(prefix + i)) return prefix + i; return prefix + 1; }
  function defItem(t) {
    if (t === 'CMP') return { t: 'CMP', op: '<', a: 'MW10', b: '50' };
    return { t, a: t === 'NC' ? 'I0.1' : 'I0.0' };
  }
  function defOut(t) {
    const used = LU.work ? LD.used(LU.work) : [];
    if (['COIL', 'SET', 'RST'].includes(t)) { let q = 'Q0.0'; for (let i = 0; i < nQ(plc()); i++) if (!used.includes('Q0.' + i)) { q = 'Q0.' + i; break; } return { t, a: t === 'COIL' ? q : 'M0.1' }; }
    if (['TON', 'TOF', 'TP'].includes(t)) return { t, a: nextFree('T', 31, used), pt: 5 };
    if (t === 'CTU') return { t, a: nextFree('C', 15, used), pv: 10, r: '' };
    if (t === 'SCALE') return { t, in: 'IW64', lo: 0, hi: 100, out: 'MW10' };
    if (t === 'MOVE') return { t, in: '0', out: 'MW12' };
    return { t, a: 'MW10', b: '1', out: 'MW12' };
  }
  LU.insert = function (t) {
    syncWork();
    if (!LU.work) { ui.toast(['Add a PLC to the panel first.', 'ضيف PLC في اللوحة الأول.'], 'warn'); return; }
    const W = LU.work;
    if (!W.nets.length) W.nets.push({ c: '', s: [], o: [] });
    const s = LU.sel, ni = s ? s.ni : W.nets.length - 1, n = W.nets[ni];
    if (LD.CONTACTS.includes(t)) {
      const it = defItem(t);
      if (s && s.key != null) { const r = resolve(n.s, s.key); if (r) { r.arr.splice(r.idx + 1, 0, it); LU.sel = { ni, key: s.key.replace(/(\d+)$/, (m) => String(+m + 1)) }; } }
      else { n.s.push(it); LU.sel = { ni, key: String(n.s.length - 1) }; }
    } else {
      if (n.o.length >= 6) { ui.toast(['Six outputs per network at most.', 'أقصى حاجة 6 مخارج في النتورك.'], 'warn'); return; }
      n.o.push(defOut(t)); LU.sel = { ni, oi: n.o.length - 1 };
    }
    mark(); editSel();
  };

  /* ---------- edit dialogs ---------- */
  function addrList(p) {
    const W = LU.work, o = [];
    for (let i = 0; i < 8; i++) o.push('I0.' + i);
    for (let i = 0; i < nQ(p); i++) o.push('Q0.' + i);
    for (let i = 0; i < 16; i++) o.push('M' + Math.floor(i / 8) + '.' + (i % 8));
    for (let i = 1; i <= 6; i++) o.push('T' + i);
    for (let i = 1; i <= 4; i++) o.push('C' + i);
    for (let i = 10; i <= 20; i += 2) o.push('MW' + i);
    o.push('IW64', 'IW66', 'QW80');
    return o.map((a) => [a, (W.sym && W.sym[a]) || '']);
  }
  function addrInput(val, p, kind) {
    const id = 'ldal' + Math.random().toString(36).slice(2, 7);
    const dl = h('datalist', { id }, addrList(p).filter(([a]) => (kind === 'bit' ? LD.bitInfo(a, nQ(p)) : LD.wordInfo(a))).map(([a, n]) => h('option', { value: a, text: n ? a + '  ' + n : a })));
    const inp = h('input', { type: 'text', value: val || '', list: id, maxlength: 12, class: 'ltr', autocapitalize: 'characters', spellcheck: false });
    return { el: h('div', null, inp, dl), get: () => resolveName(inp.value) };
  }
  function resolveName(v) { v = String(v || '').trim(); const W = LU.work; for (const k of Object.keys(W.sym || {})) if (W.sym[k] && W.sym[k].toLowerCase() === v.toLowerCase()) return k; return LD.norm(v); }
  function editSel() {
    const s = LU.sel, W = LU.work, p = plc();
    if (!s || !W || !p) return;
    const n = W.nets[s.ni]; if (!n) return;
    const err = h('p', { class: 'ld-err' });
    if (s.oi != null) {
      const o = n.o[s.oi]; if (!o) return;
      const typeSel = h('select', null, LD.OUTS.map((t) => h('option', { value: t, selected: t === o.t ? true : null, text: OUTNAME[t] ? t + '  ' + T(OUTNAME[t]) : t })));
      const box = h('div');
      let get = null;
      const build = () => {
        box.innerHTML = ''; const t = typeSel.value, cur = t === o.t ? o : defOut(t);
        if (['COIL', 'SET', 'RST'].includes(t)) { const a = addrInput(cur.a, p, 'bit'); const nm = symInp(cur.a); box.append(h('label', { class: 'f', text: T(['Address (Q0.x output or M memory bit)', 'العنوان (مخرج Q0.x أو بت ميموري M)']) }), a.el, nm.lab, nm.el); get = () => ({ v: { t, a: a.get() }, sym: [a.get(), nm.get()] }); }
        else if (['TON', 'TOF', 'TP'].includes(t)) { const a = addrInput(cur.a, p, 'bit'), pt = h('input', { type: 'number', value: cur.pt, min: 0, max: 3600, step: 0.1 }); const nm = symInp(cur.a); box.append(h('label', { class: 'f', text: T(['Timer (T1-T31)', 'التايمر (T1-T31)']) }), a.el, h('label', { class: 'f', text: T(['Preset time PT (s)', 'الوقت PT (ثانية)']) }), pt, nm.lab, nm.el); get = () => ({ v: { t, a: a.get(), pt: +pt.value }, sym: [a.get(), nm.get()] }); }
        else if (t === 'CTU') { const a = addrInput(cur.a, p, 'bit'), pv = h('input', { type: 'number', value: cur.pv, min: 0 }), rr = addrInput(cur.r, p, 'bit'); box.append(h('label', { class: 'f', text: T(['Counter (C1-C15)', 'العداد (C1-C15)']) }), a.el, h('label', { class: 'f', text: T(['Preset PV', 'العدد PV']) }), pv, h('label', { class: 'f', text: T(['Reset bit (optional)', 'بت الريست (اختياري)']) }), rr.el); get = () => ({ v: { t, a: a.get(), pv: +pv.value, r: rr.get() } }); }
        else if (t === 'SCALE') { const i1 = addrInput(cur.in, p, 'word'), lo = h('input', { type: 'number', value: cur.lo, step: 'any' }), hi = h('input', { type: 'number', value: cur.hi, step: 'any' }), o1 = addrInput(cur.out, p, 'word'); box.append(h('p', { class: 'mute sm', text: T(['Turns a raw analog value 0-27648 (0-10 V) into engineering units.', 'بيحوّل القيمة الأنالوج 0-27648 (0-10 فولت) لوحدات هندسية.']) }), h('label', { class: 'f', text: 'IN' }), i1.el, h('label', { class: 'f', text: T(['Low limit', 'الحد الأدنى']) }), lo, h('label', { class: 'f', text: T(['High limit', 'الحد الأعلى']) }), hi, h('label', { class: 'f', text: 'OUT' }), o1.el); get = () => ({ v: { t, in: i1.get(), lo: +lo.value, hi: +hi.value, out: o1.get() } }); }
        else if (t === 'MOVE') { const i1 = addrInput(cur.in, p, 'word'), o1 = addrInput(cur.out, p, 'word'); box.append(h('label', { class: 'f', text: 'IN' }), i1.el, h('label', { class: 'f', text: 'OUT' }), o1.el); get = () => ({ v: { t, in: i1.get(), out: o1.get() } }); }
        else { const a = addrInput(cur.a, p, 'word'), b2 = addrInput(cur.b, p, 'word'), o1 = addrInput(cur.out, p, 'word'); box.append(h('label', { class: 'f', text: 'IN1' }), a.el, h('label', { class: 'f', text: 'IN2' }), b2.el, h('label', { class: 'f', text: 'OUT' }), o1.el); get = () => ({ v: { t, a: a.get(), b: b2.get(), out: o1.get() } }); }
      };
      typeSel.addEventListener('change', build); build();
      dialog(T(['Output', 'الخرج']), [h('label', { class: 'f', text: T(['Instruction', 'الأمر']) }), typeSel, box, err], () => {
        const r = get(); const tmp = { nets: [{ c: '', s: [], o: [r.v] }] }; const iss = LD.check(LD.sanitize(tmp), p, null).filter((x) => x.lvl === 'bad');
        if (iss.length) { err.textContent = T(iss[0].msg); return false; }
        n.o[s.oi] = LD.sanitize(tmp).nets[0].o[0]; if (r.sym) setSym(r.sym[0], r.sym[1]); mark(); return true;
      }, () => { n.o.splice(s.oi, 1); LU.sel = null; mark(); });
      return;
    }
    const rr = resolve(n.s, s.key); if (!rr || !rr.item || rr.item.t === 'PAR') return;
    const it = rr.item;
    const seg = h('div', { class: 'seg' });
    let kind = it.t;
    const box = h('div');
    let get = null;
    const build = () => {
      for (const b of seg.children) b.classList.toggle('on', b.dataset.t === kind);
      box.innerHTML = '';
      if (kind === 'CMP') {
        const cur = it.t === 'CMP' ? it : defItem('CMP');
        const a = addrInput(cur.a, p, 'word'), op = h('select', null, LD.OPS.map((x) => h('option', { value: x, selected: x === cur.op ? true : null, text: x }))), b2 = addrInput(cur.b, p, 'word');
        box.append(h('label', { class: 'f', text: T(['Value A', 'القيمة A']) }), a.el, h('label', { class: 'f', text: T(['Compare', 'المقارنة']) }), op, h('label', { class: 'f', text: T(['Value B (number or address)', 'القيمة B (رقم أو عنوان)']) }), b2.el);
        get = () => ({ v: { t: 'CMP', op: op.value, a: a.get(), b: b2.get() } });
      } else {
        const a = addrInput(it.a || 'I0.0', p, 'bit'), nm = symInp(it.a);
        box.append(h('label', { class: 'f', text: T(['Address (I, Q, M, T, C)', 'العنوان (I، Q، M، T، C)']) }), a.el, nm.lab, nm.el);
        get = () => ({ v: { t: kind, a: a.get() }, sym: [a.get(), nm.get()] });
      }
    };
    for (const k of ['NO', 'NC', 'P', 'N', 'CMP']) seg.appendChild(h('button', { class: 'btn sm', 'data-t': k, onclick: () => { kind = k; build(); }, text: CNAME[k] ? T(CNAME[k]) : k }));
    build();
    const parp = parentPar(n.s, s.key);
    dialog(T(['Contact', 'الكونتاكت']), [seg, box, err], () => {
      const r = get(); const tmp = LD.sanitize({ nets: [{ c: '', s: [r.v], o: [{ t: 'COIL', a: 'M15.7' }] }] }); const iss = LD.check(tmp, p, null).filter((x) => x.lvl === 'bad');
      if (iss.length) { err.textContent = T(iss[0].msg); return false; }
      rr.arr[rr.idx] = tmp.nets[0].s[0]; if (r.sym) setSym(r.sym[0], r.sym[1]); mark(); return true;
    }, () => { rr.arr.splice(rr.idx, 1); tidy(n.s); LU.sel = null; mark(); }, parp);
  }
  const CNAME = { NO: ['NO ┤ ├', 'NO ┤ ├'], NC: ['NC ┤/├', 'NC ┤/├'], P: ['Rising ┤P├', 'صاعد ┤P├'], N: ['Falling ┤N├', 'هابط ┤N├'], CMP: ['Compare', 'مقارنة'] };
  const OUTNAME = { COIL: ['coil', 'كويل'], SET: ['set', 'سِت'], RST: ['reset', 'ريست'], TON: ['on-delay timer', 'تايمر تأخير تشغيل'], TOF: ['off-delay timer', 'تايمر تأخير فصل'], TP: ['pulse timer', 'تايمر نبضة'], CTU: ['up counter', 'عداد'], SCALE: ['scale analog', 'تحويل أنالوج'], MOVE: ['move value', 'نقل قيمة'], ADD: ['add', 'جمع'], SUB: ['subtract', 'طرح'], MUL: ['multiply', 'ضرب'], DIV: ['divide', 'قسمة'] };
  function symInp(a) {
    const W = LU.work, inp = h('input', { type: 'text', maxlength: 24, value: (W.sym && W.sym[LD.norm(a)]) || '' });
    return { lab: h('label', { class: 'f', text: T(['Name (symbol), optional', 'الاسم (اختياري)']) }), el: inp, get: () => inp.value.replace(/[<>`"&]/g, '').trim() };
  }
  function setSym(a, nm) { const W = LU.work; a = LD.norm(a); if (!a) return; if (nm) W.sym[a] = nm.slice(0, 24); else if (W.sym[a] && nm === '') delete W.sym[a]; }
  function dialog(title, body, onOk, onDel, parp) {
    const extra = [];
    if (parp) extra.push(h('button', { class: 'btn', onclick: () => { m.remove(); parp.br.push([defItem('NO')]); mark(); }, text: T(['Add a path to this parallel block', 'ضيف مسار للبلوك المتوازي']) }));
    const m = ui.modal([h('h3', { text: title }), ...body,
      h('div', { class: 'row wrap', style: { marginTop: '12px' } },
        h('button', { class: 'btn pri', onclick: () => { if (onOk() !== false) m.remove(); }, text: T(['Done', 'تمام']) }),
        h('button', { class: 'btn', onclick: () => m.remove(), text: T(['Cancel', 'إلغاء']) }),
        onDel ? h('button', { class: 'btn bad', onclick: () => { m.remove(); onDel(); }, text: T(['Delete', 'حذف']) }) : null, ...extra)]);
    const f = m.querySelector('input'); if (f) setTimeout(() => f.focus(), 30);
  }

  /* ---------- network operations ---------- */
  function netOp(ni, op) {
    const W = LU.work, n = W.nets[ni];
    if (op === 'up' && ni > 0) { W.nets.splice(ni, 1); W.nets.splice(ni - 1, 0, n); LU.sel = null; }
    else if (op === 'down' && ni < W.nets.length - 1) { W.nets.splice(ni, 1); W.nets.splice(ni + 1, 0, n); LU.sel = null; }
    else if (op === 'dup') { if (W.nets.length >= 64) return; W.nets.splice(ni + 1, 0, JSON.parse(JSON.stringify(n))); }
    else if (op === 'del') { if (!confirm(T(['Delete network ', 'تمسح نتورك ']) + (ni + 1) + '?')) return; W.nets.splice(ni, 1); LU.sel = null; }
    else if (op === 'comment') {
      const inp = h('input', { type: 'text', maxlength: 120, value: n.c || '' });
      dialog(T(['Network comment', 'تعليق النتورك']), [inp], () => { n.c = inp.value.replace(/[<>`"&]/g, ''); mark(); return true; });
      return;
    }
    mark();
  }
  LU.addNet = function () {
    syncWork(); if (!LU.work) return;
    if (LU.work.nets.length >= 64) { ui.toast(['64 networks at most.', 'أقصى حاجة 64 نتورك.'], 'warn'); return; }
    LU.work.nets.push({ c: '', s: [defItem('NO')], o: [defOut('COIL')] });
    LU.sel = { ni: LU.work.nets.length - 1, key: '0' };
    mark();
    requestAnimationFrame(() => { const el = nets && nets.lastElementChild; if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  };
  function selAction(a) {
    const s = LU.sel, W = LU.work; if (!s || !W) return;
    const n = W.nets[s.ni];
    if (a === 'edit') return editSel();
    if (a === 'del') {
      if (s.oi != null) n.o.splice(s.oi, 1); else { const r = resolve(n.s, s.key); if (r) { r.arr.splice(r.idx, 1); tidy(n.s); } }
      LU.sel = null; mark(); return;
    }
    if (s.key == null) return;
    const r = resolve(n.s, s.key); if (!r) return;
    if (a === 'after') { r.arr.splice(r.idx + 1, 0, defItem('NO')); LU.sel = { ni: s.ni, key: s.key.replace(/(\d+)$/, (m) => String(+m + 1)) }; mark(); editSel(); }
    else if (a === 'before') { r.arr.splice(r.idx, 0, defItem('NO')); mark(); editSel(); }
    else if (a === 'branch') {
      const it = r.arr[r.idx];
      r.arr[r.idx] = { t: 'PAR', br: [[it], [defItem('NO')]] };
      LU.sel = { ni: s.ni, key: s.key + '/1:0' }; mark(); editSel();
    }
    else if (a === 'left' && r.idx > 0) { const t = r.arr[r.idx]; r.arr[r.idx] = r.arr[r.idx - 1]; r.arr[r.idx - 1] = t; LU.sel = { ni: s.ni, key: s.key.replace(/(\d+)$/, (m) => String(+m - 1)) }; mark(); }
    else if (a === 'right' && r.idx < r.arr.length - 1) { const t = r.arr[r.idx]; r.arr[r.idx] = r.arr[r.idx + 1]; r.arr[r.idx + 1] = t; LU.sel = { ni: s.ni, key: s.key.replace(/(\d+)$/, (m) => String(+m + 1)) }; mark(); }
  }

  /* ---------- download / check / symbols ---------- */
  LU.download = function () {
    const p = plc(); if (!p || !LU.work) return;
    B().ed.push();
    p.props.mode = 'ladder';
    p.props.lad = LD.toText(LD.sanitize(LU.work));
    LU._txt = p.props.lad; LU.dirty = false;
    B().ed.touch(); B().save();
    LU.issues = LD.check(LD.progOf(p), p, C());
    const bad = LU.issues.filter((x) => x.lvl === 'bad').length, warn = LU.issues.filter((x) => x.lvl === 'warn').length;
    ui.click();
    ui.toast(T(['Downloaded to ', 'اتنزل على ']) + p.tag + (bad || warn ? T([': ', ': ']) + bad + T([' errors, ', ' أخطاء، ']) + warn + T([' warnings. See the Part panel.', ' تحذيرات. شوف لوحة الجهاز.']) : T([': no problems found. It runs now.', ': مفيش مشاكل. شغال دلوقتي.'])), bad ? 'bad' : warn ? 'warn' : 'ok', 6000);
    render(); LU.side(true);
  };
  LU.check = function () { const p = plc(); if (!p || !LU.work) return; LU.issues = LD.check(LD.sanitize(LU.work), p, C()); LU.side(true); if (window.innerWidth <= 900) B().openPane('part'); ui.toast(LU.issues.length ? T(['Check: ', 'الفحص: ']) + LU.issues.length + T([' findings in the Part panel.', ' ملاحظة في لوحة الجهاز.']) : T(['Check: no problems found.', 'الفحص: مفيش مشاكل.']), LU.issues.length ? 'warn' : 'ok'); };
  LU.symbols = function () {
    syncWork(); if (!LU.work) return;
    const W = LU.work, rows = h('div', { class: 'ld-symtab' });
    const all = [...new Set(LD.used(W).concat(Object.keys(W.sym)))].sort();
    const inputs = [];
    for (const a of all) { const inp = h('input', { type: 'text', maxlength: 24, value: W.sym[a] || '' }); inputs.push([a, inp]); rows.append(h('div', { class: 'ltr ld-adrcell', text: a }), inp); }
    const na = h('input', { type: 'text', maxlength: 12, placeholder: 'I0.5', class: 'ltr' }), nn = h('input', { type: 'text', maxlength: 24 });
    dialog(T(['Symbol table', 'جدول الأسماء']), [h('p', { class: 'mute sm', text: T(['Give addresses a name. The names show above each contact and coil.', 'ادّي العناوين أسماء. الأسماء بتظهر فوق كل كونتاكت وكويل.']) }), rows, h('h4', { text: T(['Add', 'إضافة']) }), h('div', { class: 'ld-symtab' }, na, nn)], () => {
      for (const [a, inp] of inputs) setSym(a, inp.value.replace(/[<>`"&]/g, '').trim());
      const a = LD.norm(na.value);
      if (a) { if (!LD.bitInfo(a, nQ(plc())) && !LD.wordInfo(a)) { ui.toast(['Not a valid address.', 'عنوان مش صحيح.'], 'bad'); return false; } setSym(a, nn.value.replace(/[<>`"&]/g, '').trim()); }
      mark(); return true;
    });
  };

  /* ---------- side pane: watch table + check results ---------- */
  LU.side = function (force) {
    if (B().view !== 'ladder') return;
    const root = $('#pane-part'), p = plc();
    if (force || !root.querySelector('#ldWatch')) {
      root.innerHTML = '';
      if (!p) { root.appendChild(h('div', { class: 'card' }, h('h3', { text: T(['No PLC', 'مفيش PLC']) }), h('p', { class: 'mute', text: T(['Add a PLC to the panel to write a ladder program.', 'ضيف PLC في اللوحة عشان تكتب برنامج لادر.']) }))); return; }
      root.appendChild(h('div', { class: 'card' }, h('h3', { text: p.tag + '  ' + T(EL.defs[p.type].name) }), h('div', { id: 'ldStat' })));
      if (LU.issues) {
        const c = h('div', { class: 'card' }, h('h3', { text: T(['Program check', 'فحص البرنامج']) }));
        if (!LU.issues.length) c.appendChild(h('p', { class: 'mute', text: T(['No problems found.', 'مفيش مشاكل.']) }));
        for (const x of LU.issues) c.appendChild(h('div', { class: 'pl-prob ' + x.lvl, onclick: () => { LU.sel = null; const el = nets.children[x.ni]; if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1200); } } }, h('b', { text: 'N' + (x.ni + 1) }), ' ', T(x.msg)));
        root.appendChild(c);
      }
      root.appendChild(h('div', { class: 'card' }, h('h3', { text: T(['Watch table', 'جدول المراقبة']) }), h('p', { class: 'mute sm', text: T(['Live values from the PLC. Tap an M bit to change it (modify).', 'القيم الحية من الـPLC. اضغط على بت M عشان تغيّره.']) }), h('div', { id: 'ldWatch', class: 'ld-watch' })));
    }
    watch();
  };
  let wsig = '';
  function watch() {
    const p = plc(), box = $('#ldWatch'), st = $('#ldStat');
    if (!p || !box) return;
    const s = p.state;
    if (st) st.innerHTML = `<div class="kv"><span>${esc(T(['Supply 24 V', 'تغذية 24 فولت']))}</span><b>${s.sup ? 'OK ' + (s.v || 0).toFixed(1) + ' V' : esc(T(['NO POWER', 'مفيش كهرباء']))}</b></div><div class="kv"><span>${esc(T(['Mode', 'الوضع']))}</span><b>${p.props.mode === 'ladder' ? 'LAD' : 'TEXT'} · ${s.run ? 'RUN' : 'STOP'}</b></div><div class="kv"><span>${esc(T(['Errors in scan', 'أخطاء التنفيذ']))}</span><b>${s.err || 0}</b></div>`;
    const prog = LU.work || LD.progOf(p), M = LD.mem(s, nQ(p));
    const used = LD.used(prog);
    let html = '';
    for (const a of used) {
      const b = LD.bitInfo(a, nQ(p)), w = LD.wordInfo(a);
      let v = '';
      if (b && b.area !== 'K') { const on = M.bit(a); v = `<span class="pill ${on ? 'ok' : ''}">${on ? 1 : 0}</span>`; if (b.area === 'T') { const t = s.tm && s.tm[b.k]; v += ` <span class="mute sm">${t ? t.et.toFixed(1) : '0.0'} s</span>`; } if (b.area === 'C') { const c2 = s.ct && s.ct[b.k]; v += ` <span class="mute sm">${c2 ? c2.cv : 0}</span>`; } }
      else if (w) v = `<b>${M.word(a)}</b>`;
      html += `<div class="ld-wrow${b && b.area === 'M' ? ' tog' : ''}" data-a="${esc(a)}"><span class="ltr">${esc(a)}</span><span class="mute">${esc(LD.symName(prog, a))}</span><span>${v}</span></div>`;
    }
    if (html !== wsig) { wsig = html; box.innerHTML = html || `<p class="mute">${esc(T(['No addresses yet.', 'مفيش عناوين لسه.']))}</p>`; }
  }

  /* ---------- view ---------- */
  LU.init = function () {
    host = $('#ladHost');
    bar = h('div', { class: 'ld-bar' });
    scroll = h('div', { class: 'ld-scroll' });
    nets = h('div', { class: 'ld-nets' });
    selbar = h('div', { class: 'ld-selbar' });
    scroll.appendChild(nets);
    host.append(bar, scroll, selbar);
    nets.addEventListener('click', (e) => {
      const card = e.target.closest('.ld-net'); if (!card) return;
      const ni = +card.dataset.n;
      const btn = e.target.closest('[data-op]'); if (btn) { netOp(ni, btn.dataset.op); return; }
      const it = e.target.closest('[data-k]'), o = e.target.closest('[data-o]');
      const prev = LU.sel;
      if (it) LU.sel = { ni, key: it.dataset.k };
      else if (o) LU.sel = { ni, oi: +o.dataset.o };
      else LU.sel = { ni };
      const again = prev && LU.sel && prev.ni === LU.sel.ni && prev.key === LU.sel.key && prev.oi === LU.sel.oi && (it || o);
      render();
      if (again) editSel();
    });
    nets.addEventListener('dblclick', (e) => { if (e.target.closest('[data-k],[data-o]')) editSel(); });
    $('#v-bench').addEventListener('pointerdown', (e) => { const r = e.target.closest && e.target.closest('.ld-wrow.tog'); if (!r) return; const p = plc(); if (!p) return; const M = LD.mem(p.state, nQ(p)); M.setBit(r.dataset.a, !M.bit(r.dataset.a)); ui.click(); watch(); });
    ui.onRefresh(() => render());
  };
  LU.openFor = function (p) { LU.plcId = p.id; B().setView('ladder'); };
  function render() {
    if (!host) return;
    syncWork();
    const p = plc();
    bar.innerHTML = ''; nets.innerHTML = ''; selbar.innerHTML = '';
    if (!p) {
      nets.appendChild(h('div', { class: 'pl-empty static' }, h('b', { text: T(['No PLC on the panel', 'مفيش PLC في اللوحة']) }), h('p', { class: 'mute', text: T(['Ladder programs run in a PLC. Add one, wire its inputs and outputs, then come back here.', 'برامج اللادر بتشتغل في PLC. ضيف واحد ووصّل مداخله ومخارجه وارجع هنا.']) }),
        h('div', { class: 'row wrap', style: { justifyContent: 'center' } }, h('button', { class: 'btn pri', onclick: () => { const k = ui.autowire.plcKit(); LU.plcId = k.id; LU.workFor = null; render(); }, text: T(['Add a PLC with its 24 V supply', 'ضيف PLC بالتغذية 24 فولت بتاعته']) }), h('button', { class: 'btn', onclick: () => ui.show('projects'), text: T(['Open a ready project', 'افتح مشروع جاهز']) }))));
      LU.side(true);
      return;
    }
    const list = plcs();
    const sel = list.length > 1 ? h('select', { class: 'ld-plcsel', onchange: (e) => { LU.plcId = e.target.value; LU.workFor = null; render(); LU.side(true); } }, list.map((x) => h('option', { value: x.id, selected: x.id === p.id ? true : null, text: x.tag }))) : h('b', { class: 'ld-plcname', text: p.tag });
    const on = online(p);
    bar.append(sel,
      h('span', { class: 'pill ' + (on ? 'ok' : LU.dirty ? 'warn' : ''), text: on ? 'ONLINE' : LU.dirty ? T(['NOT DOWNLOADED', 'لسه ما اتنزلش']) : !p.state.sup ? T(['NO POWER', 'مفيش كهرباء']) : p.props.mode !== 'ladder' ? 'TEXT' : 'STOP' }),
      h('button', { class: 'btn sm ' + (LU.dirty || p.props.mode !== 'ladder' ? 'pri' : ''), onclick: () => LU.download(), text: '⤓ ' + T(['Download to PLC', 'نزّل على الـPLC']) }),
      h('button', { class: 'btn sm', onclick: () => LU.addNet(), text: '+ ' + T(['Network', 'نتورك']) }),
      h('button', { class: 'btn sm', onclick: () => LU.symbols(), text: T(['Symbols', 'الأسماء']) }),
      h('button', { class: 'btn sm', onclick: () => LU.check(), text: T(['Check program', 'افحص البرنامج']) }),
      h('button', { class: 'btn sm', onclick: () => { p.state.run = !p.state.run; ui.click(); render(); }, text: p.state.run ? 'RUN → STOP' : 'STOP → RUN' }));
    if (p.props.mode !== 'ladder' && !String(p.props.lad || '') && !LU.dirty) {
      nets.appendChild(h('div', { class: 'pl-empty static' }, h('b', { text: T(['This PLC runs a text program', 'الـPLC ده شغال ببرنامج نصي']) }), h('p', { class: 'mute', text: T(['Start a ladder program. The text program stays saved and you can go back to it from the PLC properties.', 'ابدأ برنامج لادر. البرنامج النصي هيفضل محفوظ وتقدر ترجعله من خصائص الـPLC.']) }),
        h('button', { class: 'btn pri', onclick: () => { LU.work = { v: 1, sym: { 'I0.0': 'Start', 'I0.1': 'Stop (NC)' }, nets: [{ c: 'Start / stop latch', s: [{ t: 'PAR', br: [[{ t: 'NO', a: 'I0.0' }], [{ t: 'NO', a: 'Q0.0' }]] }, { t: 'NO', a: 'I0.1' }], o: [{ t: 'COIL', a: 'Q0.0' }] }] }; mark(); }, text: T(['Start a ladder program', 'ابدأ برنامج لادر']) })));
      LU.side(true);
      return;
    }
    const W = LU.work, trs = on ? LD.trace(p) : [];
    if (LU.dirty) nets.appendChild(h('div', { class: 'ld-note', text: T(['Edited offline. Press "Download to PLC" to run the changes and see live values.', 'اتعدل أوفلاين. اضغط "نزّل على الـPLC" عشان التعديلات تشتغل وتشوف القيم الحية.']) }));
    W.nets.forEach((n, ni) => {
      const card = h('div', { class: 'ld-net' + (LU.sel && LU.sel.ni === ni ? ' on' : ''), 'data-n': ni });
      card.appendChild(h('div', { class: 'ld-nhead' }, h('b', { text: T(['Network ', 'نتورك ']) + (ni + 1) + ':' }), h('span', { class: 'ld-cmt', 'data-op': 'comment', text: n.c || T(['(add a comment)', '(ضيف تعليق)']) }),
        h('span', { class: 'grow' }), h('button', { class: 'btn sm', 'data-op': 'up', text: '↑', title: 'up' }), h('button', { class: 'btn sm', 'data-op': 'down', text: '↓', title: 'down' }), h('button', { class: 'btn sm', 'data-op': 'dup', text: '⧉', title: 'copy' }), h('button', { class: 'btn sm bad', 'data-op': 'del', text: '✕', title: 'delete' })));
      const wrap = h('div', { class: 'ld-svgwrap' });
      wrap.innerHTML = LU.svgFor(n, ni, ctxFor(n, ni, p, W, trs));
      card.appendChild(wrap);
      card.appendChild(h('div', { class: 'ld-why' }));
      nets.appendChild(card);
    });
    if (!W.nets.length) nets.appendChild(h('p', { class: 'mute', text: T(['Empty program. Press + Network.', 'برنامج فاضي. اضغط + نتورك.']) }));
    nets.appendChild(h('button', { class: 'btn', style: { margin: '6px 0 90px' }, onclick: () => LU.addNet(), text: '+ ' + T(['Add network', 'ضيف نتورك']) }));
    whyAll(p, on);
    // selection bar
    if (LU.sel && (LU.sel.key != null || LU.sel.oi != null)) {
      const s = LU.sel, isItem = s.key != null;
      selbar.append(h('span', { class: 'mute sm', text: 'N' + (s.ni + 1) + ' ' }),
        h('button', { class: 'btn sm pri', onclick: () => selAction('edit'), text: T(['Edit', 'تعديل']) }),
        isItem ? h('button', { class: 'btn sm', onclick: () => selAction('after'), text: '+ ' + T(['Contact after', 'كونتاكت بعده']) }) : null,
        isItem ? h('button', { class: 'btn sm', onclick: () => selAction('branch'), text: '⑂ ' + T(['Parallel branch', 'فرع متوازي']) }) : null,
        isItem ? h('button', { class: 'btn sm', onclick: () => selAction('left'), text: '←' }) : null,
        isItem ? h('button', { class: 'btn sm', onclick: () => selAction('right'), text: '→' }) : null,
        h('button', { class: 'btn sm', onclick: () => { LU.sel = { ni: s.ni }; LU.insert('COIL'); }, text: '+ ' + T(['Output', 'خرج']) }),
        h('button', { class: 'btn sm bad', onclick: () => selAction('del'), text: T(['Delete', 'حذف']) }));
    } else selbar.appendChild(h('span', { class: 'mute sm', text: T(['Tap a contact or coil to select it, tap again to edit. Add instructions from the Parts list.', 'اضغط على كونتاكت أو كويل عشان تختاره، واضغط تاني تعدّله. ضيف أوامر من قائمة القطع.']) }));
    LU.side(true);
  }
  LU.render = render;
  function ctxFor(n, ni, p, W, trs) {
    const s = LU.sel && LU.sel.ni === ni ? LU.sel : null;
    return { prog: W, tr: trs[ni] || null, plc: p, sel: s && s.key != null ? s.key : null, selO: s && s.oi != null ? s.oi : null };
  }
  function whyAll(p, on) {
    const cards = nets.querySelectorAll('.ld-net');
    cards.forEach((card) => {
      const ni = +card.dataset.n, box = card.querySelector('.ld-why'), n = LU.work.nets[ni];
      if (!on || !n || !n.o.some((o) => ['COIL', 'TON', 'TOF', 'TP'].includes(o.t))) { box.innerHTML = ''; return; }
      const lines = LD.why(p, ni, C());
      if (!lines.length || lines[0].ok) { box.innerHTML = ''; return; }
      const s = lines.map((l) => `<div class="${l.sub ? 'sub' : ''}">${esc(T(l.msg))}</div>`).join('');
      if (box._s !== s) { box._s = s; box.innerHTML = `<b>${esc(T(['Why is it OFF?', 'ليه مطفي؟']))}</b>` + s; }
    });
  }
  LU.frame = function () {
    if (B().view !== 'ladder' || !host) return;
    const now = performance.now(); if (now - lastFrame < 180) return; lastFrame = now;
    const p = plc();
    if (!p || !LU.work) { if (!nets.children.length) render(); return; }
    if (LU.workFor !== p.id || (!LU.dirty && LU._txt !== String(p.props.lad || ''))) { render(); return; }
    const on = online(p), trs = on ? LD.trace(p) : [];
    nets.querySelectorAll('.ld-net').forEach((card) => { const ni = +card.dataset.n, n = LU.work.nets[ni]; if (!n) return; const w = card.querySelector('.ld-svgwrap'); const s = LU.svgFor(n, ni, ctxFor(n, ni, p, LU.work, trs)); if (w._s !== s) { w._s = s; w.innerHTML = s; } });
    whyAll(p, on);
    const pill = bar.querySelector('.pill'); if (pill) { const txt = on ? 'ONLINE' : LU.dirty ? T(['NOT DOWNLOADED', 'لسه ما اتنزلش']) : !p.state.sup ? T(['NO POWER', 'مفيش كهرباء']) : p.props.mode !== 'ladder' ? 'TEXT' : 'STOP'; if (pill.textContent !== txt) { pill.textContent = txt; pill.className = 'pill ' + (on ? 'ok' : LU.dirty ? 'warn' : ''); } }
    watch();
  };

  /* palette when the Ladder view is on */
  LU.palette = function (root, q) {
    root.innerHTML = '';
    const term = (q || '').trim().toLowerCase();
    const mk = (list, title) => {
      const items = h('div', { class: 'pitems' });
      for (const t of list) {
        const label = CNAME[t] ? T(CNAME[t]) : t + (OUTNAME[t] ? ' ' + T(OUTNAME[t]) : '');
        if (term && !label.toLowerCase().includes(term) && !t.toLowerCase().includes(term)) continue;
        const it = h('div', { class: 'pit', onclick: () => { LU.insert(t); if (window.innerWidth <= 900) B().sheet(null); } });
        it.innerHTML = `<svg viewBox="0 0 100 60">${iconFor(t)}</svg>`;
        it.appendChild(h('span', { text: (CNAME[t] ? T(CNAME[t]) : t + (OUTNAME[t] ? ' ' + T(OUTNAME[t]) : '')) }));
        items.appendChild(it);
      }
      root.appendChild(h('div', { class: 'pgrp' }, h('div', { class: 'pgh' }, h('span', { text: T(title) })), items));
    };
    mk(LD.CONTACTS, ['Contacts and compare', 'كونتاكتات ومقارنة']);
    mk(LD.OUTS, ['Coils and boxes', 'كويلات وبلوكات']);
  };
  function iconFor(t) {
    const l = '<line x1="4" y1="30" x2="40" y2="30" stroke="#9aa5b6" stroke-width="3"/><line x1="60" y1="30" x2="96" y2="30" stroke="#9aa5b6" stroke-width="3"/>';
    const bars = '<line x1="40" y1="16" x2="40" y2="44" stroke="#e7edf8" stroke-width="4"/><line x1="60" y1="16" x2="60" y2="44" stroke="#e7edf8" stroke-width="4"/>';
    if (t === 'NO') return l + bars;
    if (t === 'NC') return l + bars + '<line x1="36" y1="46" x2="64" y2="14" stroke="#e7edf8" stroke-width="3"/>';
    if (t === 'P' || t === 'N') return l + bars + `<text x="50" y="36" fill="#FDC300" font-size="16" text-anchor="middle" font-weight="700">${t}</text>`;
    if (t === 'CMP') return '<line x1="4" y1="30" x2="24" y2="30" stroke="#9aa5b6" stroke-width="3"/><line x1="76" y1="30" x2="96" y2="30" stroke="#9aa5b6" stroke-width="3"/><rect x="24" y="14" width="52" height="32" fill="none" stroke="#e7edf8" stroke-width="3"/><text x="50" y="36" fill="#FDC300" font-size="16" text-anchor="middle">&lt;</text>';
    if (t === 'COIL' || t === 'SET' || t === 'RST') return '<line x1="4" y1="30" x2="36" y2="30" stroke="#9aa5b6" stroke-width="3"/><path d="M42 14 Q32 30 42 46 M58 14 Q68 30 58 46" fill="none" stroke="#e7edf8" stroke-width="3.5"/>' + (t !== 'COIL' ? `<text x="50" y="36" fill="#FDC300" font-size="16" text-anchor="middle" font-weight="700">${t[0]}</text>` : '');
    return `<rect x="18" y="8" width="64" height="44" rx="3" fill="none" stroke="#e7edf8" stroke-width="3"/><text x="50" y="36" fill="#FDC300" font-size="${t.length > 4 ? 13 : 15}" text-anchor="middle" font-weight="700">${t}</text>`;
  }
})(typeof window !== 'undefined' ? window : globalThis);
