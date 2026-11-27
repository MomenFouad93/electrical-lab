/* Circuit container helpers */
(function (g) {
  const EL = g.EL;
  EL.newCircuit = () => ({ parts: [], wires: [], time: 0, notes: '' });
  EL.nextTag = function (c, type) {
    const d = EL.defs[type], pre = d.prefix || 'X';
    let n = 1;
    const used = new Set(c.parts.map((p) => p.tag));
    while (used.has(pre + n)) n++;
    return pre + n;
  };
  EL.addPart = function (c, type, x, y, props, tag) {
    const p = EL.newPart(type, x, y);
    p.tag = tag || EL.nextTag(c, type);
    if (props) Object.assign(p.props, props);
    c.parts.push(p);
    return p;
  };
  EL.partByTag = (c, tag) => c.parts.find((p) => p.tag === tag);
  EL.partById = (c, id) => c.parts.find((p) => p.id === id);
  EL.refOf = function (c, s) { // 'KM1.A1' -> 'P3.A1'
    const i = s.lastIndexOf('.');
    const tag = s.slice(0, i), pin = s.slice(i + 1);
    const p = EL.partByTag(c, tag);
    if (!p) return null;
    return p.id + '.' + pin;
  };
  EL.refLabel = function (c, ref) { // 'P3.A1' -> 'KM1:A1'
    const i = ref.indexOf('.');
    const p = EL.partById(c, ref.slice(0, i));
    if (!p) return ref;
    const q = EL.pin(p, ref.slice(i + 1));
    return p.tag + ':' + (q ? q.label || q.id : ref.slice(i + 1));
  };
  EL.addWire = function (c, a, b, o) {
    if (a === b) return null;
    if (c.wires.some((w) => (w.a === a && w.b === b) || (w.a === b && w.b === a))) return null;
    const w = Object.assign({ id: 'W' + (EL._wid = (EL._wid || 0) + 1), a, b, bend: 0 }, o || {});
    c.wires.push(w);
    return w;
  };
  /* ---------- wire cross-section (panel wires only; PCB traces have w.kind) ----------
     Iz: copper, PVC insulated, in conduit, IEC 60364-5-52 Table B.52.2 method B2, 2 loaded conductors, 30 °C, rounded down.
     0.5 / 0.75 / 1 mm² are not in that table (control wiring): conservative values. */
  const WS = (EL.WIRE = {
    sizes: [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16],
    iz: { 0.5: 3, 0.75: 6, 1: 10, 1.5: 16, 2.5: 23, 4: 30, 6: 38, 10: 52, 16: 69 },
    width: { 0.5: 1.5, 0.75: 1.9, 1: 2.2, 1.5: 2.6, 2.5: 3.2, 4: 3.9, 6: 4.6, 10: 5.6, 16: 6.8 },
    tAmb: 30, tMax: 70, tHot: 120, tSc: 160, tBurn: 230, // °C: ambient, PVC limit, red, PVC short-circuit limit, insulation chars
    std: ['Current-carrying capacity Iz: copper wire, PVC insulation, in conduit, IEC 60364-5-52 Table B.52.2 method B2, 2 loaded conductors, 30 °C (rounded down). 0.5 to 1 mm² are control sizes, not in that table: conservative values. A three-phase circuit (3 loaded conductors) carries about 5-10 % less (1.5 mm²: 15.5 A).', 'تحمّل السلك Iz: نحاس عزل PVC جوه ماسورة، IEC 60364-5-52 جدول B.52.2 طريقة B2، موصلين محمّلين، 30 درجة (مقرّب لتحت). 0.5 لحد 1 مم² مقاسات كنترول مش في الجدول ده: قيم محافظة. الدايرة التلات فاز (3 موصلات محمّلة) بتشيل أقل بحوالي 5-10٪ (1.5 مم²: 15.5 أمبير).'],
  });
  WS.ok = (v) => WS.sizes.indexOf(+v) >= 0;
  WS.label = (mm2) => String(mm2).replace(/^0\./, '0.') + ' mm²';
  /* thermal time constant (s): about half the adiabatic constant of a real cable (k = 115 for PVC), so a trainee sees it in tens of seconds */
  WS.tau = (mm2) => { const s = +mm2 || 1.5, iz = WS.iz[s] || 16; return Math.max(15, Math.min(90, 0.5 * (40 * 115 * 115 * s * s) / (90 * iz * iz))); };
  const PWR_T = /^(MOT3|MOT1|MOTDC|HTR|SRC3|SOCK|ISOL3|MCB3|MPCB|CAB3|CAB4|CAB5|RCD2|LAMPH|WSW1|WSW2|WSWX)$/;
  const CTL_T = /^(LAMP|SOL|BUZ|DC24|RES|DIO|POT|NETLBL)$/;
  /* 'P' power terminal, 'C' control terminal, null: cannot tell (terminals, fuses, 1-pole MCB) */
  WS.pinKind = function (p, pid) {
    const t = p.type, d = EL.defs[t]; if (!d) return null;
    if (t === 'CONT3' || t === 'OL') return /^[1-6]$/.test(pid) ? 'P' : 'C';
    if (t === 'VFD') return /^(R|S|T|U|V|W|PE|PE2|BP|BN)$/.test(pid) ? 'P' : 'C';
    if (t === 'PSU') return /^(L|N|PE)$/.test(pid) ? null : 'C';
    if (t === 'SSR') return /^(A|B)$/.test(pid) ? null : 'C';
    if (PWR_T.test(t)) return 'P';
    if (t === 'BUS') return /^(24V|0V)$/.test(p.props.kind) ? 'C' : null;
    if (CTL_T.test(t) || /^(control|auto|field|elec)$/.test(d.cat)) return 'C';
    return null;
  };
  const findPart = (c, id, map) => (map ? map.get(id) : c.parts.find((x) => x.id === id));
  WS.kindOf = function (c, w, map) {
    let k = null;
    for (const ref of [w.a, w.b]) { const i = ref.indexOf('.'), p = findPart(c, ref.slice(0, i), map); const r = p ? WS.pinKind(p, ref.slice(i + 1)) : null; if (r === 'P') return 'P'; if (r) k = r; }
    return k;
  };
  /* size of a wire: its own mm2, else 1.5 mm² for power and 0.75 mm² for control (1.5 when it cannot tell) */
  WS.mm2 = (c, w, map) => (WS.ok(w.mm2) ? +w.mm2 : WS.kindOf(c, w, map) === 'C' ? 0.75 : 1.5);
  WS.izOf = (c, w, map) => WS.iz[WS.mm2(c, w, map)];
  WS.label2 = (c, w) => EL.refLabel(c, w.a) + ' – ' + EL.refLabel(c, w.b);
  WS.temp = (c, w) => { const s = c.wth && c.wth[w.id]; return s ? WS.tAmb + (WS.tMax - WS.tAmb) * s.th : WS.tAmb; };
  WS.replace = function (w, c) { w.cut = false; w.burnt = false; w.hidden = false; if (c && c.wth) delete c.wth[w.id]; };
  EL.removePart = function (c, id) {
    c.parts = c.parts.filter((p) => p.id !== id);
    c.wires = c.wires.filter((w) => w.a.split('.')[0] !== id && w.b.split('.')[0] !== id);
  };
  EL.build = function (spec) {
    const c = EL.newCircuit();
    c.name = spec.name;
    for (const [tag, type, x, y, props] of spec.parts) EL.addPart(c, type, x, y, props, tag);
    for (const w of spec.wires) {
      const a = EL.refOf(c, w[0]), b = EL.refOf(c, w[1]);
      if (!a || !b) throw new Error('bad wire ' + w.join(' -> '));
      if (!EL.pin(EL.partById(c, a.split('.')[0]), a.split('.')[1])) throw new Error('bad pin ' + w[0]);
      if (!EL.pin(EL.partById(c, b.split('.')[0]), b.split('.')[1])) throw new Error('bad pin ' + w[1]);
      EL.addWire(c, a, b, w[2]);
    }
    if (spec.setup) spec.setup(c);
    return c;
  };
  EL.serialize = function (c) {
    const o = { v: 1, parts: c.parts.map((p) => ({ id: p.id, type: p.type, x: p.x, y: p.y, tag: p.tag, props: p.props, state: p.state, fault: p.fault, hid: p.hid })), wires: c.wires, notes: c.notes || '', name: c.name || '' };
    if (c.plant && c.plant.units && (c.plant.units.length || c.plant.pipes.length)) o.plant = { units: c.plant.units.map((u) => ({ id: u.id, type: u.type, x: u.x, y: u.y, tag: u.tag, props: u.props, state: plainState(u.state) })), pipes: c.plant.pipes.map((p) => Object.assign({ id: p.id, a: p.a, b: p.b }, +p.dn > 0 ? { dn: p.dn, mat: p.mat, len: p.len, loop: !!p.loop } : {})) };
    if (c.line && EL.line && c.line.els && c.line.els.length) o.line = EL.line.plain(c.line);
    if (c.proj) o.proj = c.proj;
    return JSON.stringify(o);
  };
  function plainState(st) { const o = {}; for (const k of Object.keys(st || {})) if (k[0] !== '_' && typeof st[k] === 'number' && isFinite(st[k])) o[k] = st[k]; return o; }

  /* Files and pasted text come from outside: cap the size and keep only well-formed values,
     so a crafted file cannot inject markup or freeze the page. */
  const MAX_TEXT = 4 * 1024 * 1024;
  const clean = (v, n) => String(v == null ? '' : v).replace(/[<>`]/g, '').slice(0, n);
  function cleanVal(v, depth) {
    if (depth > 6) return undefined;
    if (v == null || typeof v === 'boolean') return v;
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    if (typeof v === 'string') return v.replace(/[<>`]/g, '').slice(0, 80000);
    if (Array.isArray(v)) return v.slice(0, 2000).map((x) => cleanVal(x, depth + 1));
    if (typeof v === 'object') { const o = {}; for (const k of Object.keys(v).slice(0, 400)) { if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue; o[k] = cleanVal(v[k], depth + 1); } return o; }
    return undefined;
  }
  EL.cleanVal = cleanVal;
  EL.deserialize = function (s) {
    if (typeof s === 'string' && s.length > MAX_TEXT) throw new Error('file too large');
    const o = typeof s === 'string' ? JSON.parse(s) : s;
    if (!o || !Array.isArray(o.parts)) throw new Error('not a circuit');
    const c = EL.newCircuit();
    let maxP = 0, maxW = 0;
    const ids = new Set();
    for (const q of o.parts.slice(0, 800)) {
      if (!q || !EL.defs[q.type]) continue;
      const id = /^P\d{1,7}$/.test(String(q.id)) ? String(q.id) : null;
      if (!id || ids.has(id)) continue;
      const p = EL.newPart(q.type, +q.x || 0, +q.y || 0);
      p.id = id; p.tag = clean(q.tag, 16).replace(/["'&]/g, '') || p.tag || 'X';
      const pr = cleanVal(q.props || {}, 0) || {};
      // program text keeps < and >: the ladder sanitiser and the text compiler validate it, and it is never rendered as markup
      for (const k of ['lad', 'prog']) if (q.props && typeof q.props[k] === 'string') pr[k] = q.props[k].slice(0, 80000);
      for (const k of Object.keys(p.props)) if (pr[k] !== undefined && pr[k] !== null) p.props[k] = pr[k];
      for (const k of Object.keys(pr)) if (!(k in p.props) && /^(lad|mode|proc)$/.test(k)) p.props[k] = pr[k];
      const st = cleanVal(q.state || {}, 0);
      if (st && typeof st === 'object' && JSON.stringify(st).length < 60000) p.state = Object.assign(p.state, st);
      p.fault = typeof q.fault === 'string' && (EL.defs[q.type].faults || []).some((f) => f[0] === q.fault) ? q.fault : 'none';
      p.hid = !!q.hid;
      ids.add(id); c.parts.push(p);
      maxP = Math.max(maxP, parseInt(id.slice(1), 10) || 0);
    }
    const pinRe = /^P\d{1,7}\.[A-Za-z0-9_+\-]{1,12}$/;
    for (const w of (Array.isArray(o.wires) ? o.wires : []).slice(0, 3000)) {
      if (!w || !pinRe.test(String(w.a)) || !pinRe.test(String(w.b))) continue;
      if (!ids.has(w.a.split('.')[0]) || !ids.has(w.b.split('.')[0])) continue;
      const id = /^W\d{1,7}$/.test(String(w.id)) ? String(w.id) : 'W' + (maxW + 1);
      const nw = { id, a: w.a, b: w.b, bend: +w.bend || 0 };
      for (const k of Object.keys(w).slice(0, 20)) if (!(k in nw) && k !== '__proto__') nw[k] = cleanVal(w[k], 1);
      // cross-section: only the listed sizes; a burnt wire stays open until it is replaced
      if ('mm2' in nw) { if (WS.ok(nw.mm2)) nw.mm2 = +nw.mm2; else delete nw.mm2; }
      if ('burnt' in nw) { if (nw.burnt === true) nw.cut = true; else delete nw.burnt; }
      c.wires.push(nw); maxW = Math.max(maxW, parseInt(id.slice(1), 10) || 0);
    }
    EL._pid = Math.max(EL._pid || 0, maxP); EL._wid = Math.max(EL._wid || 0, maxW);
    c.notes = clean(o.notes, 4000);
    c.name = Array.isArray(o.name) ? o.name.slice(0, 2).map((x) => clean(x, 120)) : clean(o.name, 120);
    if (o.plant && EL.plant) c.plant = EL.plant.sanitize(o.plant);
    if (o.line && EL.line) c.line = EL.line.sanitize(o.line);
    if (o.proj && typeof o.proj === 'object') c.proj = { id: clean(o.proj.id, 24) };
    return c;
  };
})(typeof window !== 'undefined' ? window : globalThis);
