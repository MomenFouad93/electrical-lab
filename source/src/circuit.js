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
