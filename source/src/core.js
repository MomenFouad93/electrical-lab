/* Core: namespace, language helper, circuit solver (complex MNA, per island, DC + AC superposition) */
(function (g) {
  const EL = (g.EL = g.EL || {});
  EL.lang = 'en';
  EL.tr = function (p) {
    if (Array.isArray(p)) return EL.lang === 'ar' ? (p[1] != null ? p[1] : p[0]) : p[0];
    return p;
  };
  EL.defs = {}; // part definitions (geometry, draw, props)
  EL.models = EL.defs; // runtime models live on the same objects as the geometry
  EL.TICK = 0.05;

  let GMIN = 1e-10;
  const R_CLOSED = 0.005;
  EL.R_CLOSED = R_CLOSED;

  /* ---------- helpers ---------- */
  EL.P = (part, pin) => part.id + '.' + pin;
  EL.INT = (part, n) => '#' + part.id + ':' + n;
  EL.Z = (a, b, r, l, x) => Object.assign({ kind: 'Z', a, b, r: Math.max(r, 1e-4), l: l || 0 }, x || {});
  // voltage source: neg terminal a, pos terminal b
  EL.VS = (a, b, x) => Object.assign({ kind: 'V', a, b }, x || {});
  // current source pushing current a -> b inside, i.e. out of b into circuit
  EL.IS = (a, b, idc, x) => Object.assign({ kind: 'I', a, b, idc }, x || {});
  EL.cabs = (c) => Math.hypot(c[0], c[1]);
  EL.cpolar = (m, deg) => [m * Math.cos((deg * Math.PI) / 180), m * Math.sin((deg * Math.PI) / 180)];
  EL.csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  EL.cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  EL.cconj = (a) => [a[0], -a[1]];
  EL.carg = (a) => (Math.atan2(a[1], a[0]) * 180) / Math.PI;

  class UF {
    constructor() { this.p = new Map(); }
    add(x) { if (!this.p.has(x)) this.p.set(x, x); }
    find(x) {
      this.add(x);
      let r = x;
      while (this.p.get(r) !== r) r = this.p.get(r);
      while (this.p.get(x) !== r) { const n = this.p.get(x); this.p.set(x, r); x = n; }
      return r;
    }
    union(a, b) {
      const ra = this.find(a), rb = this.find(b);
      if (ra !== rb) {
        // keep EARTH as root so it keeps its name
        if (rb === 'EARTH') this.p.set(ra, rb); else this.p.set(rb, ra);
      }
    }
  }
  EL.UF = UF;

  /* ---------- dense complex gaussian elimination ---------- */
  function solveLinear(n, Ar, Ai, br, bi) {
    for (let c = 0; c < n; c++) {
      let piv = c, best = -1;
      for (let r = c; r < n; r++) {
        const m = Ar[r * n + c] ** 2 + Ai[r * n + c] ** 2;
        if (m > best) { best = m; piv = r; }
      }
      if (best < 1e-40) return null;
      if (piv !== c) {
        for (let k = 0; k < n; k++) {
          let t = Ar[c * n + k]; Ar[c * n + k] = Ar[piv * n + k]; Ar[piv * n + k] = t;
          t = Ai[c * n + k]; Ai[c * n + k] = Ai[piv * n + k]; Ai[piv * n + k] = t;
        }
        let t = br[c]; br[c] = br[piv]; br[piv] = t;
        t = bi[c]; bi[c] = bi[piv]; bi[piv] = t;
      }
      const pr = Ar[c * n + c], pi = Ai[c * n + c], pd = pr * pr + pi * pi;
      for (let r = c + 1; r < n; r++) {
        const xr = Ar[r * n + c], xi = Ai[r * n + c];
        if (xr === 0 && xi === 0) continue;
        const fr = (xr * pr + xi * pi) / pd, fi = (xi * pr - xr * pi) / pd;
        for (let k = c; k < n; k++) {
          const ur = Ar[c * n + k], ui = Ai[c * n + k];
          Ar[r * n + k] -= fr * ur - fi * ui;
          Ai[r * n + k] -= fr * ui + fi * ur;
        }
        br[r] -= fr * br[c] - fi * bi[c];
        bi[r] -= fr * bi[c] + fi * br[c];
      }
    }
    const xr = new Float64Array(n), xi = new Float64Array(n);
    for (let r = n - 1; r >= 0; r--) {
      let sr = br[r], si = bi[r];
      for (let k = r + 1; k < n; k++) {
        sr -= Ar[r * n + k] * xr[k] - Ai[r * n + k] * xi[k];
        si -= Ar[r * n + k] * xi[k] + Ai[r * n + k] * xr[k];
      }
      const pr = Ar[r * n + r], pi = Ai[r * n + r], pd = pr * pr + pi * pi;
      xr[r] = (sr * pr + si * pi) / pd;
      xi[r] = (si * pr - sr * pi) / pd;
    }
    return { xr, xi };
  }

  /* solve one island in one mode. returns {V:Map node->[re,im], i:Map elem->[re,im]} or null if singular */
  function solveMode(isl, mode, omega) {
    const nodes = isl.nodes, ref = isl.ref;
    const idx = new Map();
    let n = 0;
    for (const nd of nodes) if (nd !== ref) idx.set(nd, n++);
    const vs = isl.elems.filter((e) => e.kind === 'V');
    const N = n + vs.length;
    const Ar = new Float64Array(N * N), Ai = new Float64Array(N * N);
    const br = new Float64Array(N), bi = new Float64Array(N);
    const ix = (nd) => (nd === ref ? -1 : idx.get(nd));
    for (let i = 0; i < n; i++) Ar[i * N + i] += GMIN;
    const addY = (a, b, yr, yi) => {
      const ia = ix(a), ib = ix(b);
      if (ia >= 0) { Ar[ia * N + ia] += yr; Ai[ia * N + ia] += yi; }
      if (ib >= 0) { Ar[ib * N + ib] += yr; Ai[ib * N + ib] += yi; }
      if (ia >= 0 && ib >= 0) {
        Ar[ia * N + ib] -= yr; Ai[ia * N + ib] -= yi;
        Ar[ib * N + ia] -= yr; Ai[ib * N + ia] -= yi;
      }
    };
    const inj = (nd, vr, vi) => { const k = ix(nd); if (k >= 0) { br[k] += vr; bi[k] += vi; } };
    let k = 0;
    for (const e of isl.elems) {
      if (e.kind === 'Z') {
        if (mode === 'dc' && e.noDC) continue;
        if (mode === 'ac' && e.noAC) continue;
        let zr = (mode === 'ac' && e.rac != null) ? e.rac : e.r, zi = 0;
        if (mode === 'ac') zi = omega * e.l;
        const d = zr * zr + zi * zi;
        addY(e.a, e.b, zr / d, -zi / d);
      } else if (e.kind === 'V') {
        const row = n + k++;
        const ia = ix(e.a), ib = ix(e.b);
        if (ia >= 0) { Ar[ia * N + row] += 1; Ar[row * N + ia] -= 1; }
        if (ib >= 0) { Ar[ib * N + row] -= 1; Ar[row * N + ib] += 1; }
        let er = 0, ei = 0;
        if (e.lim) { er = e.limV; }
        else if (mode === 'dc') er = e.vdc || 0;
        else if (e.vac && (!isl.f || Math.abs((e.f || 0) - isl.f) < 1e-6)) { const c = EL.cpolar(e.vac, e.ph || 0); er = c[0]; ei = c[1]; }
        br[row] = er; bi[row] = ei;
      } else if (e.kind === 'I') {
        if (mode === 'dc' && !e.lim && !e.off) { inj(e.b, e.idc || 0, 0); inj(e.a, -(e.idc || 0), 0); }
      } else if (e.kind === 'D') {
        if (mode === 'dc' && e.on) {
          const gd = 1 / (e.rd || 0.5);
          addY(e.a, e.b, gd, 0);
          inj(e.a, gd * e.vf, 0); inj(e.b, -gd * e.vf, 0);
        }
      }
    }
    if (N === 0) return { V: new Map([[ref, [0, 0]]]), x: null, vs, idx, n };
    const sol = solveLinear(N, Ar, Ai, br, bi);
    if (!sol) return null;
    const V = new Map();
    V.set(ref, [0, 0]);
    for (const [nd, i] of idx) V.set(nd, [sol.xr[i], sol.xi[i]]);
    return { V, sol, vs, idx, n };
  }

  function elemResult(e, mode, omega, V, sol, vsIndex, n) {
    const va = V.get(e.a) || [0, 0], vb = V.get(e.b) || [0, 0];
    const dv = [va[0] - vb[0], va[1] - vb[1]];
    if (e.kind === 'Z') {
      if ((mode === 'dc' && e.noDC) || (mode === 'ac' && e.noAC)) return { v: dv, i: [0, 0] };
      const zi = mode === 'ac' ? omega * e.l : 0;
      const zr = (mode === 'ac' && e.rac != null) ? e.rac : e.r;
      const d = zr * zr + zi * zi;
      // i = dv / Z = dv * conj(Z) / |Z|^2
      return { v: dv, i: [(dv[0] * zr + dv[1] * zi) / d, (dv[1] * zr - dv[0] * zi) / d] };
    }
    if (e.kind === 'V') {
      const k = vsIndex.get(e);
      return { v: dv, i: [sol.xr[n + k], sol.xi[n + k]] };
    }
    if (e.kind === 'I') {
      if (mode === 'dc' && !e.lim && !e.off) return { v: dv, i: [e.idc || 0, 0] };
      return { v: dv, i: [0, 0] };
    }
    if (e.kind === 'D') {
      if (mode === 'dc' && e.on) return { v: dv, i: [(dv[0] - e.vf) / (e.rd || 0.5), 0] };
      return { v: dv, i: [0, 0] };
    }
    return { v: dv, i: [0, 0] };
  }

  function solveIsland(isl) {
    const hasAC = isl.elems.some((e) => e.kind === 'V' && e.vac > 0);
    const hasDC = true;
    isl.res = new Map(); // elem -> {vdc,idc,vac:[],iac:[]}
    isl.Vdc = new Map(); isl.Vac = new Map();
    isl.singular = false;
    // frequency
    let f = 0;
    if (hasAC) {
      if (isl.forceF) f = isl.forceF;
      else for (const e of isl.elems) if (e.kind === 'V' && e.vac > 0) f = Math.max(f, e.f || 50);
      const fs = new Set(isl.elems.filter((e) => e.kind === 'V' && e.vac > 0).map((e) => e.f || 50));
      isl.mixedFreq = fs.size > 1 && !isl.forceF;
    }
    isl.f = f;
    // nonlinear iteration for DC
    const nl = isl.elems.filter((e) => e.kind === 'D' || (e.kind === 'I' && (e.vmax || e.vmin)));
    for (const e of nl) { e.on = false; e.lim = false; e.off = false; e.wasI = e.kind === 'I'; }
    let dc = null;
    for (let it = 0; it < 12; it++) {
      dc = solveMode(isl, 'dc', 0);
      if (!dc) break;
      let changed = false;
      for (const e of nl) {
        const va = dc.V.get(e.a)[0], vb = dc.V.get(e.b)[0];
        if (e.kind === 'D') {
          if (!e.on && va - vb > e.vf) { e.on = true; changed = true; }
          else if (e.on && (va - vb - e.vf) / (e.rd || 0.5) < -1e-9) { e.on = false; changed = true; }
        } else if (e.kind === 'I') {
          if (e.vmax && vb - va > e.vmax) { e.kind = 'V'; e.lim = true; e.limV = e.vmax; changed = true; }
          else if (e.vmin && !e.off && va - vb < e.vmin && (e.idc || 0) !== 0) { e.off = true; changed = true; }
        } else if (e.kind === 'V' && e.wasI && e.lim) {
          const k = dc.vs.indexOf(e);
          const ideliv = dc.sol ? dc.sol.xr[dc.n + k] : 0;
          if (ideliv > (e.idc || 0) + 1e-9) { e.kind = 'I'; e.lim = false; changed = true; }
        }
      }
      if (!changed) break;
    }
    if (!dc) {
      for (const e of nl) if (e.wasI) e.kind = 'I';
      isl.singular = true;
      for (const nd of isl.nodes) { isl.Vdc.set(nd, 0); isl.Vac.set(nd, [0, 0]); }
      for (const e of isl.elems) isl.res.set(e, { vdc: 0, idc: 1e5, vac: [0, 0], iac: [0, 0] });
      return;
    }
    const vsIdx = new Map(); dc.vs.forEach((e, k) => vsIdx.set(e, k));
    for (const [nd, v] of dc.V) isl.Vdc.set(nd, v[0]);
    for (const e of isl.elems) {
      const r = elemResult(e, 'dc', 0, dc.V, dc.sol, vsIdx, dc.n);
      isl.res.set(e, { vdc: r.v[0], idc: r.i[0], vac: [0, 0], iac: [0, 0] });
    }
    // restore limited current sources before the AC pass
    for (const e of nl) if (e.wasI) { e.kind = 'I'; }
    const ac = hasAC ? solveMode(isl, 'ac', 2 * Math.PI * f) : null;
    if (hasAC && !ac) isl.singular = true;
    const acIdx = new Map(); if (ac) ac.vs.forEach((e, k) => acIdx.set(e, k));
    for (const nd of isl.nodes) isl.Vac.set(nd, ac ? ac.V.get(nd) : [0, 0]);
    if (ac) for (const e of isl.elems) {
      const ra = elemResult(e, 'ac', 2 * Math.PI * f, ac.V, ac.sol, acIdx, ac.n);
      const o = isl.res.get(e);
      o.vac = ra.v; o.iac = ra.i;
    }
  }

  /* ---------- netlist + simulate ---------- */
  EL.pinsOf = function (part) {
    const d = EL.defs[part.type];
    if (!d) return [];
    return typeof d.pins === 'function' ? d.pins(part) : d.pins;
  };

  EL.simulate = function (circuit, ctx) {
    ctx = ctx || {};
    GMIN = ctx.gmin || 1e-10;
    const uf = new UF();
    uf.add('EARTH');
    const pinRefs = [];
    const partById = new Map();
    for (const p of circuit.parts) {
      partById.set(p.id, p);
      const d = EL.defs[p.type];
      if (!d) continue;
      for (const pin of EL.pinsOf(p)) {
        const ref = EL.P(p, pin.id);
        uf.add(ref); pinRefs.push(ref);
        if ((pin.earth && !d.floatPE) || (d.earth && d.earth(p, pin))) uf.union('EARTH', ref);
      }
      const ties = d.ties ? d.ties(p) : [];
      for (const t of ties) for (let i = 1; i < t.length; i++) uf.union(EL.P(p, t[0]), EL.P(p, t[i]));
    }
    for (const w of circuit.wires) {
      if (w.cut) continue;
      if (!partById.has(w.a.split('.')[0]) || !partById.has(w.b.split('.')[0])) continue;
      uf.union(w.a, w.b);
    }
    // net labels: parts of the same name are one net
    const nlab = new Map();
    for (const p of circuit.parts) {
      const d = EL.defs[p.type];
      if (!d || !d.netlabel) continue;
      const nm = String(p.props.name || '').trim().toUpperCase();
      if (!nm) continue;
      const ref = EL.P(p, 'n');
      if (nlab.has(nm)) uf.union(nlab.get(nm), ref); else nlab.set(nm, ref);
    }
    // elements
    const elems = [];
    for (const p of circuit.parts) {
      const m = EL.models[p.type];
      if (!m || !m.elements) continue;
      const list = m.elements(p, ctx, circuit) || [];
      for (const e of list) { e.part = p.id; elems.push(e); }
    }
    if (ctx.extra) for (const e of ctx.extra) { e.part = e.part || '_x'; elems.push(e); }
    const node = (ref) => uf.find(ref);
    for (const e of elems) { e.na = e.a; e.nb = e.b; e.a = node(e.a); e.b = node(e.b); }
    // islands
    const iuf = new UF();
    for (const e of elems) iuf.union(e.a, e.b);
    const islands = new Map();
    const nodeIsland = new Map();
    for (const e of elems) {
      const r = iuf.find(e.a);
      if (!islands.has(r)) islands.set(r, { nodes: new Set(), elems: [] });
      const isl = islands.get(r);
      isl.nodes.add(e.a); isl.nodes.add(e.b); isl.elems.push(e);
    }
    const list = [];
    let id = 0;
    for (const isl of islands.values()) {
      isl.nodes = [...isl.nodes].sort();
      isl.ref = isl.nodes.includes('EARTH') ? 'EARTH' : isl.nodes[0];
      isl.id = id++;
      if (ctx.forceF && isl.elems.some((e) => e.kind === 'V' && e.vac > 0)) isl.forceF = ctx.forceF;
      solveIsland(isl);
      for (const nd of isl.nodes) nodeIsland.set(nd, isl);
      list.push(isl);
    }
    const sim = { uf, islands: list, nodeIsland, elems, ctx, partById };
    // per element lookup + pin currents
    sim.byTag = new Map();
    sim.pinI = new Map();
    for (const e of elems) {
      const isl = nodeIsland.get(e.a);
      const r = isl.res.get(e);
      e.r_ = r;
      if (e.tag) sim.byTag.set(e.part + ':' + e.tag, e);
      const add = (ref, sign) => {
        if (!ref || ref[0] === '#') return;
        let o = sim.pinI.get(ref);
        if (!o) { o = { dc: 0, ac: [0, 0] }; sim.pinI.set(ref, o); }
        o.dc += sign * r.idc; o.ac[0] += sign * r.iac[0]; o.ac[1] += sign * r.iac[1];
      };
      add(e.na, 1); add(e.nb, -1);
    }
    // parts whose tie groups merge terminals (motor delta links): terminal current = sum over the group
    for (const p of circuit.parts) {
      const d = EL.defs[p.type];
      if (!d || !d.sumTies) continue;
      const exposed = new Set(EL.pinsOf(p).map((q) => q.id));
      for (const grp of d.ties(p)) {
        const tot = { dc: 0, ac: [0, 0] };
        for (const id of grp) { const o = sim.pinI.get(EL.P(p, id)); if (o) { tot.dc += o.dc; tot.ac[0] += o.ac[0]; tot.ac[1] += o.ac[1]; } }
        for (const id of grp) if (exposed.has(id)) sim.pinI.set(EL.P(p, id), { dc: tot.dc, ac: tot.ac.slice() });
      }
    }
    sim.net = (ref) => uf.find(ref);
    sim.isl = (ref) => nodeIsland.get(uf.find(ref)) || null;
    sim.vdcAt = (ref) => { const nd = uf.find(ref), isl = nodeIsland.get(nd); return isl ? isl.Vdc.get(nd) : 0; };
    sim.vacAt = (ref) => { const nd = uf.find(ref), isl = nodeIsland.get(nd); return isl ? isl.Vac.get(nd) : [0, 0]; };
    sim.freqAt = (ref) => { const isl = nodeIsland.get(uf.find(ref)); return isl ? isl.f : 0; };
    sim.sameIsland = (a, b) => { const x = sim.isl(a), y = sim.isl(b); return !!x && x === y; };
    sim.vdc = (a, b) => (sim.sameIsland(a, b) ? sim.vdcAt(a) - sim.vdcAt(b) : 0);
    sim.vac = (a, b) => (sim.sameIsland(a, b) ? EL.csub(sim.vacAt(a), sim.vacAt(b)) : [0, 0]);
    sim.vacMag = (a, b) => EL.cabs(sim.vac(a, b));
    sim.e = (pid, tag) => sim.byTag.get(pid + ':' + tag);
    sim.iPin = (ref) => sim.pinI.get(ref) || { dc: 0, ac: [0, 0] };
    return sim;
  };

  /* effective measurement of an element: returns {vdc,vac,idc,iac} (magnitudes, RMS) */
  EL.eRead = function (sim, pid, tag) {
    const e = sim.e(pid, tag);
    if (!e) return { vdc: 0, vac: 0, idc: 0, iac: 0, f: 0, ph: 0 };
    const r = e.r_;
    const isl = sim.nodeIsland.get(e.a);
    return { vdc: r.vdc, vac: EL.cabs(r.vac), idc: r.idc, iac: EL.cabs(r.iac), f: isl ? isl.f : 0, vacC: r.vac, iacC: r.iac };
  };

  /* ---------- tick ---------- */
  EL.events = [];
  EL.emit = function (type, part, msg) { EL.events.push({ type, part: part && part.id, tag: part && part.tag, msg }); };
  EL.tick = function (circuit, dt, ctx) {
    ctx = ctx || {};
    const sim = EL.simulate(circuit, ctx);
    circuit.time = (circuit.time || 0) + dt;
    sim.shorts = [];
    for (const isl of sim.islands) {
      let worst = 0;
      for (const e of isl.elems) {
        if (e.kind === 'V' && e.vac > 0 || e.kind === 'V' && e.vdc) {
          const r = isl.res.get(e);
          const i = Math.max(Math.abs(r.idc), EL.cabs(r.iac));
          worst = Math.max(worst, i);
        }
      }
      isl.maxSrcI = worst;
      if (isl.singular || worst > 800) {
        isl.short = true;
        sim.shorts.push(isl);
      }
    }
    for (const p of circuit.parts) {
      const m = EL.models[p.type];
      if (m && m.update) m.update(p, sim, dt, ctx, circuit);
    }
    if (circuit.plant && EL.plant && !ctx.noPlant) EL.plant.step(circuit, dt);
    circuit.sim = sim;
    return sim;
  };
  EL.runSeconds = function (circuit, s, ctx, dt) {
    dt = dt || EL.TICK;
    let sim;
    for (let t = 0; t < s; t += dt) sim = EL.tick(circuit, dt, ctx);
    return sim;
  };
})(typeof window !== 'undefined' ? window : globalThis);
