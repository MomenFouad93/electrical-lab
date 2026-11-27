/* Diagnosis engine (offline, rule + simulation based).
   analyze(c)  : runs the circuit through test scenarios on a copy, checks wiring, voltages, protection and behaviour,
                 reports what works / what does not, why, and where to put the marks on the drawing.
   why(c, id)  : traces why one device is not energised. */
(function (g) {
  const EL = g.EL, D = EL.defs;
  const Dg = (EL.diag = EL.diag || {});
  const A = (en, ar) => [en, ar];
  const DT = EL.TICK;
  const meta = (p) => (D[p.type] && D[p.type].diag) || {};
  const kindOf = (p) => meta(p).kind || 'unknown';
  const clone = (c) => EL.deserialize(EL.serialize(c));
  const cabs = EL.cabs;
  const fix1 = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2));
  const SYMPRI = { x: 4, q: 3, w: 2, ok: 1 };
  Dg.util = { meta, kindOf, clone };

  /* ---------- device knowledge ---------- */
  function opsOf(p) {
    const d = D[p.type];
    if (!d || !d.op) return [];
    return d.op.filter((k) => typeof k === 'string' ? k !== 'run' && k !== 'hold' : true).map((o) => (typeof o === 'string' ? { k: o, vals: o === 'pos' ? (p.type === 'HOA' ? ['0', 'H', 'A'] : [1, 2]) : [false, true] } : o));
  }
  const isMom = (p) => (D[p.type] && D[p.type].mode === 'mom') || meta(p).mom;
  const isNC = (p) => (D[p.type] && D[p.type].kind === 'NC') || meta(p).nc === true;
  const isEstop = (p) => !!meta(p).estop;
  const isBreaker = (p) => kindOf(p) === 'protect' && opsOf(p).some((o) => o.k === 'on');
  function applyOp(p, k, v) {
    const s = p.state;
    if (k === 'on' && v) { s.tripped = false; s.on = true; if (s.heat != null) s.heat = Math.min(s.heat, 0.2); return; }
    s[k] = v;
  }
  function contactPairs(p) {
    const ids = EL.pinsOf(p).map((q) => q.id).filter((x) => /^\d+$/.test(x)).map(Number), out = [], has = (n) => ids.includes(n);
    for (const n of ids) {
      if (n % 2 === 1 && has(n + 1)) out.push([String(n), String(n + 1)]);
      if (n > 10 && n % 10 === 1 && has(n + 3)) out.push([String(n), String(n + 3)]);
      if (n === 15) { if (has(16)) out.push(['15', '16']); if (has(18)) out.push(['15', '18']); }
    }
    const t = p.type;
    if (/^(WSW1)$/.test(t)) out.push(['C', 'L1']);
    if (/^(WSW2|SPDT)$/.test(t)) out.push(t === 'WSW2' ? ['C', 'L1'] : ['C', 'P1'], t === 'WSW2' ? ['C', 'L2'] : ['C', 'P2']);
    if (t === 'WSWX') out.push(['a1', 'b1'], ['a2', 'b2'], ['a1', 'b2'], ['a2', 'b1']);
    if (/^(MCB1|MCB3|MPCB|ISOL3)$/.test(t)) { /* numeric pairs already */ }
    if (t === 'TOG' || t === 'PCB_SW') out.push(['A', 'B']);
    if (t === 'RELAY5') out.push(['COM', 'NO'], ['COM', 'NC']);
    if (t === 'SAFE') out.push(['13', '14'], ['23', '24']);
    if (t === 'PLC24R' || t === 'PLC24') for (const q of EL.pinsOf(p)) if (/^Q\d$/.test(q.id) && t === 'PLC24R') out.push([q.id, 'C' + q.id.slice(1)]);
    if (t === 'SSR') out.push(['A', 'B']);
    if (t === 'RCD2') out.push(['L1', 'L2'], ['N1', 'N2']);
    if (/^(FUSE|PCB_FUSE)$/.test(t)) { const pr = EL.pinsOf(p).map((q) => q.id); if (pr.length === 2 && !out.length) out.push(pr); }
    return out;
  }
  Dg.contactPairs = contactPairs;
  const labelOf = (c, ref) => EL.refLabel(c, ref);
  const tagOf = (c, id) => { const p = EL.partById(c, id); return p ? p.tag : id; };
  const nameOf = (p) => (D[p.type] ? EL.tr ? D[p.type].name : D[p.type].name : p.type);
  const pName = (p) => D[p.type].name;
  const hiddenIn = (c) => c.parts.some((p) => p.hid) || c.wires.some((w) => w.hidden);
  function heal(c) {
    for (const p of c.parts) if (p.hid) { p.fault = 'none'; p.hid = false; if (p.state) { p.state.burnt = false; p.state.blown = false; } }
    for (const w of c.wires) if (w.hidden) { w.cut = false; w.hidden = false; }
    return c;
  }
  Dg.heal = heal;
  function feedVolts(sim, c, p, m) {
    const f = m.feed; if (!f) return null;
    const pr = (id) => p.id + '.' + id;
    const pairs = f.length === 2 ? [[f[0], f[1]]] : f.length === 3 ? [[f[0], f[1]], [f[1], f[2]], [f[2], f[0]]] : [];
    let vac = 1e9, vdc = 1e9;
    for (const [a, b] of pairs) {
      if (!sim.sameIsland(pr(a), pr(b))) { vac = 0; vdc = 0; continue; }
      vac = Math.min(vac, cabs(sim.vac(pr(a), pr(b)))); vdc = Math.min(vdc, Math.abs(sim.vdc(pr(a), pr(b))));
    }
    return { vac: vac === 1e9 ? 0 : vac, vdc: vdc === 1e9 ? 0 : vdc };
  }
  function pinMax(sim, p) { let m = 0; for (const q of EL.pinsOf(p)) { const o = sim.pinI.get(p.id + '.' + q.id); if (o) m = Math.max(m, Math.abs(o.dc), cabs(o.ac)); } return m; }
  function activeOf(p) {
    const m = meta(p);
    if (m.active) { try { return !!m.active(p); } catch (e) { return false; } }
    const s = p.state || {};
    return !!(s.on || s.closed || s.energized || (s.b || 0) > 0.3 || (s.w || 0) > 0.2 || s.active || s.pos === 'on');
  }
  Dg.activeOf = activeOf;
  const FUNCTIONAL = new Set(['load', 'coil', 'motor', 'led', 'logic', 'plc', 'mcu', 'safety', 'drive', 'relay', 'rectifier', 'ic', 'opto', 'reg']);
  const isFunctional = (p) => { const m = meta(p); return FUNCTIONAL.has(m.kind) && (m.active || m.feed); };

  /* ---------- scenario runner ---------- */
  Dg.runScenario = function (c0, o) {
    o = o || {};
    const c = clone(c0); c.time = 0;
    if (o.heal) heal(c);
    const ctx = { mains: o.mains !== false };
    const rec = { c, steps: [], edges: new Map(), peak: {}, events: [], shorts: [], loads: {}, ops: {} };
    EL.events.length = 0;
    const sample = (sim, last) => {
      for (const p of c.parts) {
        const pk = rec.peak[p.id] || (rec.peak[p.id] = { amps: 0, v: 0, heat: 0, w: 0 });
        const s = p.state || {};
        if (typeof s.amps === 'number') pk.amps = Math.max(pk.amps, Math.abs(s.amps));
        if (typeof s.heat === 'number') pk.heat = Math.max(pk.heat, s.heat);
        if (typeof s.w === 'number') pk.w = Math.max(pk.w, Math.abs(s.w));
      }
      if (sim.shorts && sim.shorts.length && rec.shorts.length < 3) {
        const pins = []; for (const [ref, o2] of sim.pinI) { const i = Math.max(Math.abs(o2.dc), cabs(o2.ac)); if (i > 150) pins.push([ref, i]); }
        pins.sort((a, b) => b[1] - a[1]);
        rec.shorts.push({ step: rec.steps.length, label: rec.curLabel, pins: pins.slice(0, 10), kind: rec.curKind });
      }
      for (const e of sim.elems) {
        if (e.kind !== 'Z' || !e.na || String(e.part)[0] === '_' || e.r > 2e4 || e.tag === 'lk' || e.tag === 'ins') continue;
        const key = e.part + ':' + e.tag;
        if (!rec.edges.has(key)) rec.edges.set(key, { na: e.na, nb: e.nb, part: e.part, tag: e.tag, r: e.r });
      }
    };
    const run = (secs) => { const n = Math.max(1, Math.round(secs / DT)); for (let i = 0; i < n; i++) { const sim = EL.tick(c, DT, ctx); sample(sim); } return c.sim; };
    const snap = (label, kind, extra) => {
      const sim = c.sim, parts = {};
      for (const p of c.parts) {
        const m = meta(p), fv = m.feed ? feedVolts(sim, c, p, m) : null;
        const s = p.state || {};
        parts[p.id] = { pi: pinMax(sim, p), act: activeOf(p), lv: m.volt && fv ? Math.max(fv.vac, fv.vdc) > 0.5 * (m.volt(p) || 1) : activeOf(p), vac: fv ? fv.vac : 0, vdc: fv ? fv.vdc : 0, amps: s.amps || 0, closed: !!s.closed, on: !!s.on, tripped: !!s.tripped, blown: !!s.blown, burnt: !!s.burnt, act2: !!s.act };
      }
      const closed = new Set();
      for (const e of sim.elems) if (e.kind === 'Z' && e.na && e.r < 2e4 && e.tag !== 'lk' && e.tag !== 'ins') closed.add(e.part + ':' + e.tag);
      const ev = EL.events.splice(0);
      rec.events.push(...ev.map((x) => Object.assign({ step: rec.steps.length }, x)));
      const wires = {}; if (sim.wireI) for (const [k, v] of sim.wireI) wires[k] = v;
      rec.steps.push(Object.assign({ label, kind, parts, closed, wires, t: c.time, shorts: !!(sim.shorts && sim.shorts.length) }, extra || {}));
    };
    const L = (en, ar) => A(en, ar);
    const step = (label, kind, secs, mut, hold) => { rec.curLabel = label; rec.curKind = kind; if (mut) mut(); run(secs); snap(label, kind); if (hold) hold(); };

    const parts = c.parts;
    const breakers = parts.filter((p) => isBreaker(p));
    const moms = parts.filter((p) => !isEstop(p) && isMom(p) && opsOf(p).some((x) => x.k === 'act'));
    const startBtns = moms.filter((p) => !isNC(p)), stopBtns = moms.filter((p) => isNC(p));
    const estops = parts.filter((p) => isEstop(p));
    const latched = parts.filter((p) => !isMom(p) && !isEstop(p) && !isBreaker(p) && opsOf(p).length && kindOf(p) !== 'plc' && kindOf(p) !== 'drive');
    rec.ops = { breakers: breakers.map((p) => p.id), start: startBtns.map((p) => p.id), stop: stopBtns.map((p) => p.id), estop: estops.map((p) => p.id), latched: latched.map((p) => p.id) };

    const delays = parts.filter((p) => ['TON', 'SDT', 'TOFF'].includes(p.type)).map((p) => +p.props.time || 0);
    const T1 = Math.max(1.6, (delays.length ? Math.max(...delays) : 0) + 1.5);
    const resetStops = (tagL) => { for (const q of stopBtns) { step(L('Press ' + q.tag + ' (stop)', 'اضغط ' + q.tag + ' (ستوب)'), 'stoppress', 1.2, () => { q.state.act = true; }); step(L('Release ' + q.tag, 'سيب ' + q.tag), 'stop', 1.6, () => { q.state.act = false; }); rec.steps[rec.steps.length - 1].op = { id: q.id, k: 'act', v: false, after: tagL }; } };
    step(L('As drawn', 'زي ما هي مرسومة'), 'init', 2);
    if (breakers.some((p) => !p.state.on || p.state.tripped)) step(L('All breakers ON', 'كل البريكرات ON'), 'power', 2, () => { for (const p of breakers) if (!p.props.locked) applyOp(p, 'on', true); });
    else rec.steps[rec.steps.length - 1].kind = 'power';
    for (const p of latched) {
      for (const o2 of opsOf(p)) {
        const cur = p.state[o2.k];
        for (const v of o2.vals) {
          if (String(v) === String(cur)) continue;
          step(L(p.tag + ' set to ' + (typeof v === 'boolean' ? (v ? 'ON' : 'OFF') : v), p.tag + ' على ' + (typeof v === 'boolean' ? (v ? 'ON' : 'OFF') : v)), 'sw', T1, () => applyOp(p, o2.k, v), null);
          rec.steps[rec.steps.length - 1].op = { id: p.id, k: o2.k, v };
        }
        step(L(p.tag + ' back', p.tag + ' رجع'), 'swback', 1.2, () => applyOp(p, o2.k, cur));
      }
    }
    for (const p of startBtns) {
      step(L('Press ' + p.tag, 'اضغط ' + p.tag), 'press', 0.9, () => { p.state.act = true; });
      rec.steps[rec.steps.length - 1].op = { id: p.id, k: 'act', v: true };
      p.state.act = false; run(0.6); snap(L('Released (0.6 s)', 'بعد السيب (0.6 ث)'), 'startmid'); rec.steps[rec.steps.length - 1].op = { id: p.id, k: 'act', v: false };
      step(L('Release ' + p.tag, 'سيب ' + p.tag), 'start', T1 - 0.6, () => {});
      rec.steps[rec.steps.length - 1].op = { id: p.id, k: 'act', v: false };
      resetStops(p.id);
    }
    if (startBtns.length > 1) {
      step(L('Press all START buttons together', 'اضغط كل أزرار START مع بعض'), 'startall', 1.2, () => { for (const p of startBtns) p.state.act = true; });
      step(L('Release all', 'سيب الكل'), 'startall_rel', 1.2, () => { for (const p of startBtns) p.state.act = false; });
      resetStops('all');
    }
    // steady state: start one button and let motors reach speed so currents are the running values
    if (startBtns.length) { const p = startBtns[0]; p.state.act = true; run(0.9); p.state.act = false; }
    step(L('Running (steady state)', 'شغال (حالة مستقرة)'), 'steady', 10);
    if (estops.length) {
      rec.steps[rec.steps.length - 1].kind = 'preestop';
      for (const p of estops) {
        step(L('Push ' + p.tag + ' (emergency stop)', 'اضغط ' + p.tag + ' (طوارئ)'), 'estop', 2.5, () => { p.state.act = true; });
        rec.steps[rec.steps.length - 1].op = { id: p.id, k: 'act', v: true };
      }
    }
    for (const p of parts) {
      const m = meta(p); if (!isFunctional(p) && !(m.kind === 'sensor')) continue;
      const st = rec.steps.map((s) => !!s.parts[p.id].act), pv = Math.max(0, ...rec.steps.map((s) => Math.max(s.parts[p.id].vac, s.parts[p.id].vdc)));
      rec.loads[p.id] = { id: p.id, ever: st.some(Boolean), steps: st, peakV: pv };
    }
    return rec;
  };

  /* ---------- graph of possible conduction ---------- */
  function buildGraph(rec) {
    const uf = rec.c.sim.uf, adj = new Map();
    const add = (n, e) => { if (!adj.has(n)) adj.set(n, []); adj.get(n).push(e); };
    for (const [key, e] of rec.edges) {
      const a = uf.find(e.na), b = uf.find(e.nb); if (a === b) continue;
      const ed = { key, a, b, part: e.part, tag: e.tag, na: e.na, nb: e.nb };
      add(a, { to: b, e: ed }); add(b, { to: a, e: ed });
    }
    return adj;
  }
  function sourceNets(c, uf) {
    const m = new Map();
    for (const p of c.parts) {
      if (kindOf(p) !== 'source') continue;
      for (const q of EL.pinsOf(p)) { const n = uf.find(p.id + '.' + q.id); if (!m.has(n)) m.set(n, []); m.get(n).push(p.id + '.' + q.id); }
    }
    return m;
  }
  function bfs(adj, start, skipPart, gates) {
    const seen = new Map([[start, null]]), q = [start];
    while (q.length) {
      const n = q.shift();
      for (const { to, e } of adj.get(n) || []) { if (e.part === skipPart || seen.has(to)) continue; seen.set(to, { from: n, e }); q.push(to); }
      if (gates) for (const { to, gate } of gates.get(n) || []) { if (gate.part === skipPart || seen.has(to)) continue; seen.set(to, { from: n, e: gate, gated: true }); q.push(to); }
    }
    return seen;
  }
  function gateMap(c, uf) {
    const m = new Map();
    for (const p of c.parts) {
      for (const [a, b] of contactPairs(p)) {
        const na = uf.find(p.id + '.' + a), nb = uf.find(p.id + '.' + b); if (na === nb) continue;
        const gate = { part: p.id, a, b, gate: true };
        for (const [x, y] of [[na, nb], [nb, na]]) { if (!m.has(x)) m.set(x, []); m.get(x).push({ to: y, gate }); }
      }
    }
    return m;
  }
  function pathTo(seen, node) { const out = []; let cur = node; while (seen.get(cur)) { const s = seen.get(cur); out.push(s.e); cur = s.from; } return out.reverse(); }

  function gateHint(c, g) {
    const p = EL.partById(c, g.part); if (!p) return A('a contact', 'كونتاكت');
    const pr = g.a + '-' + g.b, t = p.tag, m = meta(p);
    if (m.kind === 'switch' || /^(PB|SEL|KEY|HOA|ESTOP|LIM|PRESS|FLOAT|FLOW|THERMO|TOG|SPDT|WSW)/.test(p.type)) {
      if (m.estop) return A(t + ' contact ' + pr + ' must be closed: release the emergency stop', 'كونتاكت ' + t + ' ' + pr + ' لازم يكون مقفول: فك زرار الطوارئ');
      if (isMom(p) && !isNC(p)) return A(t + ' (' + pr + ') closes only while it is pressed', t + ' (' + pr + ') بيقفل وانت ضاغط بس');
      if (isNC(p)) return A(t + ' (' + pr + ') is a normally-closed contact: it must be closed (not pressed, not broken)', t + ' (' + pr + ') كونتاكت NC: لازم يكون مقفول (مش مضغوط ولا بايظ)');
      return A('turn ' + t + ' to the position that closes ' + pr, 'لف ' + t + ' للوضع اللي بيقفل ' + pr);
    }
    if (m.kind === 'protect') return A(t + ' must be ON (switch it on or reset it if it tripped)', t + ' لازم يكون ON (شغّله أو اعمل له ريسيت لو فاصل)');
    if (m.kind === 'coil' || m.kind === 'logic' || m.kind === 'relay' || m.kind === 'safety') return A('contact ' + pr + ' of ' + t + ' closes only when ' + t + ' is energised', 'كونتاكت ' + pr + ' بتاع ' + t + ' بيقفل لما ' + t + ' يكون شغال');
    return A(t + ' (' + pr + ') must conduct', t + ' (' + pr + ') لازم يوصل');
  }

  /* ---------- why is this device not energised ---------- */
  function whyNot(rec, p, blind) {
    const c = rec.c, sim = c.sim, uf = sim.uf, m = meta(p);
    const out = { steps: [], marks: [], cause: null };
    const mk = (ref, sym, txt) => out.marks.push({ ref, sym, txt });
    const ids = m.feed || [];
    const pins = ids.map((i) => p.id + '.' + i);
    const wired = (ref) => c.wires.some((w) => !w.cut && (w.a === ref || w.b === ref));
    // visible fault
    if (p.fault && p.fault !== 'none' && !(blind && p.hid)) {
      const f = (D[p.type].faults || []).find((x) => x[0] === p.fault);
      out.steps.push(A(p.tag + ' has a fault set: ' + (f ? f[1][0] : p.fault), p.tag + ' فيه عطل متحدد: ' + (f ? f[1][1] : p.fault)));
      mk(p.id, 'x', A('fault: ' + (f ? f[1][0] : p.fault), 'عطل: ' + (f ? f[1][1] : p.fault)));
      out.cause = { type: 'fault', id: p.id };
      return out;
    }
    if (p.state && p.state.burnt) { out.steps.push(A(p.tag + ' is burnt', p.tag + ' محروق')); mk(p.id, 'x', A('burnt', 'محروق')); out.cause = { type: 'burnt', id: p.id }; return out; }
    const missing = pins.filter((r) => !wired(r) && !sim.uf.find(r).startsWith('EARTH') );
    const unw = pins.filter((r) => !wired(r));
    if (unw.length && !m.tiedFeed) {
      for (const r of unw) { out.steps.push(A('Terminal ' + labelOf(c, r) + ' is not connected to anything', 'الطرف ' + labelOf(c, r) + ' مش متوصل بأي حاجة')); mk(r, 'x', A('not connected', 'مش متوصل')); }
      out.cause = { type: 'unwired', refs: unw };
      return out;
    }
    if (!pins.length) return out;
    const adj = buildGraph(rec), srcs = sourceNets(c, uf), gates = gateMap(c, uf);
    const nets = pins.map((r) => uf.find(r));
    // reachability with the possible (ever closed) edges, then with gates
    const reach = nets.map((n) => bfs(adj, n, p.id, null));
    const terms = reach.map((seen) => { const t = []; for (const [n, refs] of srcs) if (seen.has(n)) t.push(...refs); return t; });
    const failing = [];
    nets.forEach((n, i) => { if (!terms[i].length) failing.push(i); });
    if (failing.length) {
      for (const i of failing) {
        const seenG = bfs(adj, nets[i], p.id, gates);
        const reachableG = [...srcs.keys()].filter((n) => seenG.has(n));
        out.steps.push(A('From ' + labelOf(c, pins[i]) + ' there is no closed path to the supply', 'من ' + labelOf(c, pins[i]) + ' مفيش مسار مقفول للمصدر'));
        mk(pins[i], 'q', A('no path to supply', 'مفيش مسار للمصدر'));
        if (reachableG.length) {
          const path = pathTo(seenG, reachableG[0]).filter((e) => e.gate);
          for (const g1 of path.slice(0, 4)) { const h = gateHint(c, g1); out.steps.push(A('It would conduct if: ' + h[0], 'هيوصل لو: ' + h[1])); mk(g1.part + '.' + g1.a, 'q', gateHint(c, g1)); }
          out.cause = { type: 'gate', gates: path };
        } else {
          // frontier: unwired pins of parts attached to this side
          const side = [...seenG.keys()];
          const cand = [];
          for (const q of c.parts) {
            if (q.id === p.id || kindOf(q) === 'decor' || kindOf(q) === 'label') continue;
            for (const pn of EL.pinsOf(q)) {
              const ref = q.id + '.' + pn.id, nn = uf.find(ref);
              if (side.includes(nn) && !wired(ref) && !pn.earth) cand.push(ref);
            }
          }
          const near = cand.slice(0, 3);
          if (near.length) for (const r of near) { out.steps.push(A('Terminal ' + labelOf(c, r) + ' on this side is left open: is a wire missing here?', 'الطرف ' + labelOf(c, r) + ' في الناحية دي سايب: ممكن سلك ناقص هنا؟')); mk(r, 'q', A('open end', 'طرف سايب')); }
          else out.steps.push(A('No wire or device connects this side to the supply. A wire is missing.', 'مفيش سلك أو جهاز بيوصل الناحية دي بالمصدر. فيه سلك ناقص.'));
          out.cause = { type: 'nopath', pin: pins[i] };
        }
      }
      return out;
    }
    // both pins reach a source: do they reach different poles?
    const same = terms.length > 1 && terms.every((t) => t.length && t.every((r) => terms[0].includes(r)) && terms[0].every((r) => t.includes(r)));
    if (pins.length === 2 && terms[0].length === 1 && terms[0][0] === terms[1][0]) {
      out.steps.push(A('Both terminals of ' + p.tag + ' connect to the same supply pole (' + labelOf(c, terms[0][0]) + '). There is no return path, so no current flows.', 'طرفين ' + p.tag + ' متوصلين بنفس قطب المصدر (' + labelOf(c, terms[0][0]) + '). مفيش مسار رجوع فمفيش تيار.'));
      mk(pins[0], 'q', A('same pole as the other terminal', 'نفس قطب الطرف التاني')); mk(pins[1], 'q', A('same pole as the other terminal', 'نفس قطب الطرف التاني'));
      out.cause = { type: 'samepole' };
      return out;
    }
    // paths exist: show what is open right now, using the best step
    const last = rec.steps[rec.steps.length - 1];
    const bestStep = rec.steps.reduce((b, s) => ((s.parts[p.id].vac + s.parts[p.id].vdc) > (b.parts[p.id].vac + b.parts[p.id].vdc) ? s : b), rec.steps[0]);
    const openNow = [];
    pins.forEach((r, i) => {
      const seen = reach[i];
      const tn = [...srcs.keys()].find((n) => seen.has(n));
      for (const e of pathTo(seen, tn)) if (!bestStep.closed.has(e.key) && !openNow.some((x) => x.key === e.key)) openNow.push(e);
    });
    const vmax = Math.max(bestStep.parts[p.id].vac, bestStep.parts[p.id].vdc);
    if (openNow.length && vmax < 0.3 * (m.volt ? m.volt(p) : 24)) {
      for (const e of openNow.slice(0, 4)) { const q = EL.partById(c, e.part); if (!q) continue; const h = gateHint(c, { part: e.part, a: e.na.split('.')[1], b: e.nb.split('.')[1] }); out.steps.push(A('It only gets power when: ' + h[0], 'مش بيجيله كهرباء غير لما: ' + h[1])); mk(e.part + '.' + e.na.split('.')[1], 'q', h); }
      out.cause = { type: 'conditions', edges: openNow };
      return out;
    }
    // voltage reaches it but it does not act: the device itself
    out.steps.push(A('The supply reaches ' + p.tag + ' (' + fix1(vmax) + ' V) but it does not operate: the device itself is faulty or not what it should be', 'الكهرباء واصلة لـ' + p.tag + ' (' + fix1(vmax) + ' فولت) بس مش بيشتغل: الجهاز نفسه فيه عطل أو مش المناسب'));
    mk(p.id, 'q', A('powered but not working', 'واصله كهرباء ومش شغال'));
    out.cause = { type: 'device' };
    return out;
  }
  Dg.whyNot = whyNot;

  /* ---------- wires: In <= Iz, motor cables, overload settings against the nameplate ---------- */
  const PASS3 = [['1', '2'], ['3', '4'], ['5', '6']];
  const OCP = /^(MCB1|MCB3|MPCB|FUSE|OL)$/; // overcurrent protective devices
  function passPairs(p) {
    const t = p.type;
    if (/^(CONT3|MCB3|MPCB|ISOL3|OL)$/.test(t)) return PASS3;
    if (/^(MCB1|FUSE)$/.test(t)) return [['1', '2']];
    if (/^CAB\d$/.test(t)) return EL.pinsOf(p).filter((q) => /^a\d$/.test(q.id)).map((q) => [q.id, 'b' + q.id.slice(1)]);
    return contactPairs(p);
  }
  function staticNets(c) {
    const uf = new EL.UF(), add = (r) => uf.add(r);
    for (const p of c.parts) { const d = D[p.type]; if (!d) continue; for (const q of EL.pinsOf(p)) add(p.id + '.' + q.id); if (d.ties) for (const t of d.ties(p)) for (let i = 1; i < t.length; i++) uf.union(p.id + '.' + t[0], p.id + '.' + t[i]); }
    const lab = new Map();
    for (const p of c.parts) { const d = D[p.type]; if (!d || !d.netlabel) continue; const nm = String(p.props.name || '').trim().toUpperCase(); if (!nm) continue; const r = p.id + '.n'; if (lab.has(nm)) uf.union(lab.get(nm), r); else lab.set(nm, r); }
    const pw = c.wires.filter((w) => !w.kind && EL.partById(c, w.a.split('.')[0]) && EL.partById(c, w.b.split('.')[0]));
    for (const w of pw) { add(w.a); add(w.b); uf.union(w.a, w.b); }
    const nets = new Map(), net = (n) => nets.get(n) || nets.set(n, { pins: [], wires: [] }).get(n);
    for (const p of c.parts) if (D[p.type]) for (const q of EL.pinsOf(p)) net(uf.find(p.id + '.' + q.id)).pins.push(p.id + '.' + q.id);
    for (const w of pw) net(uf.find(w.a)).wires.push(w);
    return { uf, nets, find: (r) => uf.find(r), get: (n) => nets.get(n) || { pins: [], wires: [] } };
  }
  /* nets downstream of a device: through switching contacts, cables and terminals; stops at other protective devices */
  function downstream(c, G, dev, passOL) {
    const pinIds = EL.pinsOf(dev).map((q) => q.id), outs0 = pinIds.filter((x) => /^[246]$/.test(x)), ins0 = pinIds.filter((x) => /^[135]$/.test(x));
    const isSrcNet = (n) => G.get(n).pins.some((r) => { const q = EL.partById(c, r.split('.')[0]); return q && kindOf(q) === 'source'; });
    let outs = outs0; if (outs0.some((x) => isSrcNet(G.find(dev.id + '.' + x))) && !ins0.some((x) => isSrcNet(G.find(dev.id + '.' + x)))) outs = ins0; // fed from the bottom
    const seen = new Set(), q = [], wires = [], motors = [];
    for (const x of outs) { const n = G.find(dev.id + '.' + x); if (!seen.has(n)) { seen.add(n); q.push(n); } }
    while (q.length) {
      const n = q.shift(), N = G.get(n);
      for (const w of N.wires) if (!wires.includes(w)) wires.push(w);
      for (const r of N.pins) {
        const [pid, pin] = r.split('.'); if (pid === dev.id) continue;
        const p = EL.partById(c, pid); if (!p) continue;
        if (/^(MOT3|MOT1)$/.test(p.type)) { motors.push([p, pin]); continue; }
        if (OCP.test(p.type) && !(passOL && p.type === 'OL')) continue;
        if (kindOf(p) === 'source' || kindOf(p) === 'drive') continue;
        for (const [a, b] of passPairs(p)) { const o = pin === a ? b : pin === b ? a : null; if (!o) continue; const m = G.find(pid + '.' + o); if (!seen.has(m)) { seen.add(m); q.push(m); } }
      }
    }
    return { wires, motors };
  }
  /* current a motor draws through one line of a feeder at rated load (6-wire motor fed only on one winding end: phase current) */
  function motorAmps(p, ends) {
    const np = EL.motorPlate(p);
    if (p.type !== 'MOT3' || p.props.conn !== '6wire') return np.inom;
    const s1 = ends.some((x) => /^[UVW]1$/.test(x)), s2 = ends.some((x) => /^[UVW]2$/.test(x));
    return s1 && s2 ? np.i400 : np.i400 / Math.sqrt(3);
  }
  function wireChecks(c0, c, rec, steady, add, mark) {
    const WS = EL.WIRE, G = staticNets(c0), wl = (w) => WS.label2(c0, w), mm = (w) => WS.mm2(c0, w), iz = (w) => WS.izOf(c0, w), std = 'IEC 60364-4-43 §433.1 (Ib ≤ In ≤ Iz), IEC 60364-5-52 B2';
    // 1. protective device rating against the wires it protects
    for (const dev of c0.parts) {
      if (!OCP.test(dev.type) || !meta(dev).rating) continue;
      const In = meta(dev).rating(dev); if (!(In > 0)) continue;
      const ds = downstream(c0, G, dev, false), bad = ds.wires.filter((w) => In > iz(w) + 1e-9);
      if (!bad.length) continue;
      bad.sort((a, b) => iz(a) - iz(b));
      const w = bad[0], more = bad.length - 1, devTxt = dev.tag + ' (' + (dev.type === 'OL' || dev.type === 'MPCB' ? 'Ir ' : '') + (Number.isInteger(In) ? In : fix1(In)) + ' A)';
      add('warn', 'in_gt_iz', A(devTxt + ' protects wire ' + wl(w) + ' of ' + mm(w) + ' mm², which carries only Iz ' + iz(w) + ' A' + (more ? ' (and ' + more + ' more wire(s) too small)' : '') + '. In must not be above Iz.', devTxt + ' بيحمي السلك ' + wl(w) + ' مقاس ' + mm(w) + ' مم² وتحمّله Iz ' + iz(w) + ' أمبير بس' + (more ? ' (و' + more + ' سلك تاني صغيرين)' : '') + '. لازم In ميزيدش عن Iz.'),
        { refs: [dev.id, w.a], std, why: A('An overload between Iz and In heats the wire above 70 °C and the protection does not trip.', 'أي حمل زيادة بين Iz و In بيسخّن السلك فوق 70 درجة والحماية مش بتفصل.'), fix: A('Use a bigger wire (select the wire, Wire size) or a smaller rating for ' + dev.tag + '.', 'استخدم سلك أكبر (اختار السلك، مقاس السلك) أو قيمة أصغر لـ' + dev.tag + '.') });
      mark(dev.id, 'q', A('rating above the wire Iz', 'القيمة أكبر من تحمّل السلك')); mark(w.a, 'q', A('wire too small for ' + dev.tag, 'السلك صغير على ' + dev.tag));
    }
    // 2. motor cables and overload settings against the nameplate
    for (const p of c0.parts) {
      if (!/^(MOT3|MOT1)$/.test(p.type) || !EL.motorPlate) continue;
      const np = EL.motorPlate(p), main = p.type === 'MOT3' ? ['U1', 'V1', 'W1', 'U2', 'V2', 'W2'] : ['L', 'N'];
      for (const pin of main) {
        if (!EL.pin(p, pin)) continue;
        const N = G.get(G.find(p.id + '.' + pin)), need = p.type === 'MOT3' && p.props.conn === '6wire' ? np.i400 / Math.sqrt(3) : np.inom;
        const w = N.wires.find((x) => (x.a === p.id + '.' + pin || x.b === p.id + '.' + pin) && iz(x) < need - 1e-9);
        if (!w) continue;
        add('warn', 'motor_cable', A('Wire ' + wl(w) + ' is ' + mm(w) + ' mm² (Iz ' + iz(w) + ' A) but ' + p.tag + ' draws ' + fix1(need) + ' A in it at full load (nameplate In ' + fix1(np.inom) + ' A).', 'السلك ' + wl(w) + ' مقاس ' + mm(w) + ' مم² (تحمّله ' + iz(w) + ' أمبير) و' + p.tag + ' بيسحب فيه ' + fix1(need) + ' أمبير على الحمل الكامل (In على اللوحة ' + fix1(np.inom) + ' أمبير).'), { refs: [p.id, w.a], std, fix: A('Use a wire with Iz at least the motor current.', 'استخدم سلك تحمّله على الأقل قد تيار الموتور.') });
        mark(p.id + '.' + pin, 'q', A('motor wire too small', 'سلك الموتور صغير'));
        break;
      }
      if (p.type === 'MOT3' && p.props.volt === '230D' && p.props.conn === 'delta') {
        const st = steady && steady.parts[p.id];
        if (st && st.vac > 300) { add('error', 'motor_delta400', A(p.tag + ' has a 230 V Δ / 400 V Y winding but is linked in DELTA on ' + Math.round(st.vac) + ' V: each winding gets 400 V instead of 230 V.', p.tag + ' ملفاته 230 دلتا / 400 ستار ومتوصل دلتا على ' + Math.round(st.vac) + ' فولت: كل ملف واخد 400 بدل 230.'), { refs: [p.id], std: 'IEC 60034-1 (rated voltage)', fix: A('Link the terminal box in STAR (Y) for a 400 V supply.', 'غيّر كباري علبة الموتور لستار (Y) على مصدر 400 فولت.') }); mark(p.id, 'x', A('wrong winding connection', 'توصيل الملفات غلط')); }
      }
    }
    for (const dev of c0.parts) {
      if (!/^(OL|MPCB)$/.test(dev.type)) continue;
      const ds = downstream(c0, G, dev, true); if (!ds.motors.length) continue;
      const byM = new Map(); for (const [m, pin] of ds.motors) byM.set(m, (byM.get(m) || []).concat(pin));
      if (byM.size !== 1) continue; // one protective device per motor; group protection is not judged
      const [m, ends] = [...byM][0], Ireq = motorAmps(m, ends), set = meta(dev).rating(dev), np = EL.motorPlate(m);
      const ph = Math.abs(Ireq - np.inom) > 0.01 ? A(' (phase current = In / √3, it sits in one winding branch)', ' (تيار الفاز = In / √3، لأنه في فرع ملف واحد)') : A('', '');
      if (set < 0.9 * Ireq) { add('warn', 'ol_low', A(dev.tag + ' is set to ' + fix1(set) + ' A, below ' + fix1(Ireq) + ' A for ' + m.tag + ph[0] + '. It will trip in normal running.', dev.tag + ' مضبوط على ' + fix1(set) + ' أمبير، أقل من ' + fix1(Ireq) + ' أمبير لـ' + m.tag + ph[1] + '. هيفصل وهو شغال عادي.'), { refs: [dev.id, m.id], std: 'IEC 60947-4-1, IEC 60204-1 §7.3', fix: A('Set it to the nameplate current: ' + fix1(Ireq) + ' A (allowed 0.9 to 1.15 x).', 'اضبطه على تيار اللوحة: ' + fix1(Ireq) + ' أمبير (المسموح من 0.9 لـ 1.15 ضعف).') }); mark(dev.id, 'q', A('set too low for the nameplate', 'مضبوط أقل من اللوحة')); }
      else if (set > 1.15 * Ireq) { add('warn', 'ol_high', A(dev.tag + ' is set to ' + fix1(set) + ' A, above 1.15 x ' + fix1(Ireq) + ' A of ' + m.tag + ph[0] + '. The motor can overheat without a trip.', dev.tag + ' مضبوط على ' + fix1(set) + ' أمبير، أكتر من 1.15 × ' + fix1(Ireq) + ' أمبير لـ' + m.tag + ph[1] + '. الموتور ممكن يسخن من غير ما يفصل.'), { refs: [dev.id, m.id], std: 'IEC 60947-4-1, IEC 60204-1 §7.3', fix: A('Set it to the nameplate current: ' + fix1(Ireq) + ' A.', 'اضبطه على تيار اللوحة: ' + fix1(Ireq) + ' أمبير.') }); mark(dev.id, 'q', A('set too high for the nameplate', 'مضبوط أعلى من اللوحة')); }
    }
    // 3. what the simulation saw: wires above Iz while running, wires burnt
    const sw = (steady && steady.wires) || {};
    for (const w of c0.wires) {
      if (w.kind) continue;
      if (w.burnt) { add('error', 'wire_burnt', A('Wire ' + wl(w) + ' is burnt (open). Replace it: select it and press Replace wire.', 'السلك ' + wl(w) + ' محروق (مفتوح). غيّره: اختاره واضغط غيّر السلك.'), { refs: [w.a, w.b] }); mark(w.a, 'x', A('burnt wire', 'سلك محروق')); continue; }
      const I = sw[w.id] || 0, z = iz(w); if (I <= z * 1.02) continue;
      const burn = I > 2.2 * z;
      add(burn ? 'error' : 'warn', 'wire_over', A('Wire ' + wl(w) + ' (' + mm(w) + ' mm², Iz ' + z + ' A) carries ' + fix1(I) + ' A while running' + (burn ? ': its insulation will burn.' : ': it overheats.'), 'السلك ' + wl(w) + ' (' + mm(w) + ' مم²، تحمّله ' + z + ' أمبير) بيعدّي فيه ' + fix1(I) + ' أمبير وهو شغال' + (burn ? ': عزله هيتحرق.' : ': بيسخن زيادة.')), { refs: [w.a, w.b], std, fix: A('Use a bigger wire or reduce the load.', 'استخدم سلك أكبر أو قلل الحمل.') });
      mark(w.a, burn ? 'x' : 'q', A('wire overloaded', 'السلك عليه حمل زيادة'));
    }
  }
  Dg.wireUtil = { staticNets, downstream, motorAmps };

  /* ---------- main analysis ---------- */
  Dg.analyze = function (c0, o) {
    /* wiring walk: does a coil / load get its supply from a given kind of device (PLC output, safety relay)? */
    const viaDev = (c, p, test, depth) => {
      const seen = new Set(EL.pinsOf(p).map((q) => p.id + '.' + q.id)); let front = [...seen];
      for (let k = 0; k < (depth || 3); k++) {
        const nx = [];
        for (const r of front) for (const w of c.wires) {
          const o = w.a === r ? w.b : w.b === r ? w.a : null; if (!o || seen.has(o)) continue; seen.add(o);
          const [id, pin] = o.split('.'), q = c.parts.find((x) => x.id === id); if (!q || q.id === p.id) continue;
          if (test(q, pin)) return q;
          if (/^(OL|TERM\d*|TERMPE|JBOX|LUG)$/.test(q.type)) for (const qq of EL.pinsOf(q)) { const r2 = id + '.' + qq.id; if (!seen.has(r2) && (q.type !== 'OL' || /^9[5-8]$/.test(qq.id))) { seen.add(r2); nx.push(r2); } }
        }
        front = nx;
      }
      return null;
    };
    const plcOut = (q, pin) => (EL.defs[q.type].diag || {}).kind === 'plc' && /^Q\d+$/.test(pin) && q.props.mode === 'ladder';
    const safetyOut = (q) => q.type === 'SAFE';
    const hasProcess = !!(c0.plant && c0.plant.units && c0.plant.units.length);
    o = o || {};
    const F = [], marks = new Map();
    const hid = hiddenIn(c0), blind = hid;
    const add = (sev, code, msg, extra) => { const f = Object.assign({ sev, code, msg }, extra || {}); F.push(f); return f; };
    const mark = (ref, sym, txt) => { if (!ref) return; const cur = marks.get(ref); if (!cur || SYMPRI[sym] > SYMPRI[cur.sym]) marks.set(ref, { ref, sym, txt: txt || null }); };
    const parts = c0.parts.filter((p) => D[p.type]);
    const real = parts.filter((p) => kindOf(p) !== 'decor' && kindOf(p) !== 'label');
    if (!real.length) return { verdict: 'empty', summary: A('The drawing is empty. Add parts and wires, then press Diagnosis.', 'الرسم فاضي. حط أجزاء وأسلاك وبعدين دوس دايجنوسس.'), findings: [], table: [], marks: [], blind: false };
    const rec = Dg.runScenario(c0);
    const exp = hid ? Dg.runScenario(c0, { heal: true }) : rec;
    const c = rec.c, sim = c.sim;
    const wired = (ref) => c.wires.some((w) => !w.cut && (w.a === ref || w.b === ref));
    const ptag = (id) => tagOf(c, id);
    const stepOf = (kind) => rec.steps.filter((s) => s.kind === kind);
    const labelRef = (ref) => labelOf(c, ref);

    // sources
    const sources = real.filter((p) => kindOf(p) === 'source');
    const loadsAll = real.filter((p) => isFunctional(p));
    if (!sources.length && real.length > 1) { add('error', 'no_source', A('There is no power source in the drawing.', 'مفيش مصدر كهرباء في الرسم.'), { fix: A('Add a supply (Sources group) and wire it to the circuit.', 'ضيف مصدر (مجموعة المصادر) ووصّله بالدايرة.') }); }

    // pins that must be wired + parts not wired at all
    const need = (p) => {
      const m = meta(p), t = p.type;
      if (m.feed) return m.feed;
      if (['passive', 'diode', 'led'].includes(m.kind) && !m.unmodeled) return EL.pinsOf(p).map((q) => q.id);
      if (m.kind === 'bjt') return ['B', 'C', 'E'];
      if (m.kind === 'mosfet') return ['G', 'D', 'S'];
      if (m.kind === 'opto') return ['A', 'K', 'C', 'E'];
      if (m.kind === 'ic') { const a = +p.props.vcc, b = +p.props.gnd; return [a ? 'p' + a : null, b ? 'p' + b : null].filter(Boolean); }
      return [];
    };
    for (const p of real) {
      const m = meta(p);
      const all = EL.pinsOf(p);
      if (!all.length) continue;
      const anyWired = all.some((q) => wired(p.id + '.' + q.id)) || (m.netlabel);
      const tiedAll = D[p.type].netlabel;
      if (!anyWired && !tiedAll && !(D[p.type].netlabel)) { add('warn', 'floating', A(p.tag + ' is not wired to anything.', p.tag + ' مش متوصل بأي حاجة.'), { refs: [p.id], fix: A('Wire it into the circuit or delete it.', 'وصّله بالدايرة أو امسحه.') }); mark(p.id, 'q', A('not wired', 'مش متوصل')); continue; }
      const unw = need(p).filter((id) => !wired(p.id + '.' + id) && !(EL.pin(p, id) || {}).earth);
      if (unw.length && (m.kind !== 'source')) {
        if (m.kind === 'ic') { for (const id of unw) { add('error', 'ic_supply_pin', A(p.tag + ': the supply pin ' + id.slice(1) + ' is not connected.', p.tag + ': رجل التغذية ' + id.slice(1) + ' مش متوصلة.'), { refs: [p.id + '.' + id] }); mark(p.id + '.' + id, 'x', A('supply pin open', 'رجل التغذية سايبة')); } }
        else for (const id of unw) { add('error', 'unwired_pin', A('Terminal ' + labelRef(p.id + '.' + id) + ' is not connected. ' + p.tag + ' cannot work with an open terminal.', 'الطرف ' + labelRef(p.id + '.' + id) + ' مش متوصل. ' + p.tag + ' مش هيشتغل وطرفه سايب.'), { refs: [p.id + '.' + id], fix: A('Connect the terminal.', 'وصّل الطرف.') }); mark(p.id + '.' + id, 'x', A('not connected', 'مش متوصل')); }
      }
    }
    // earth (protective conductor)
    for (const p of real) {
      const m = meta(p), pe = m.pe; if (!pe || !EL.pin(p, pe)) continue;
      const ref = p.id + '.' + pe, n = sim.uf.find(ref);
      const wiredPe = n === sim.uf.find('EARTH') || (wired(ref) && sim.sameIsland(ref, 'EARTH'));
      if (!wiredPe) { add('warn', 'no_pe', A(p.tag + ' has no protective earth connection.', p.tag + ' مفيش له توصيل أرضي (PE).'), { refs: [ref], std: 'IEC 60364-4-41, IEC 60204-1 §8.2', why: A('A fault to the metal body would leave the body live.', 'لو حصل تماس مع الهيكل المعدن هيفضل الهيكل عليه جهد.'), fix: A('Connect the PE terminal to the earth bar / PE of the supply.', 'وصّل طرف PE بالأرضي / PE المصدر.') }); mark(ref, 'x', A('earth missing', 'الأرضي ناقص')); }
    }
    // short circuit
    if (rec.shorts.length) {
      const s0 = rec.shorts[0], refs = s0.pins.map((x) => x[0]);
      const tags = [...new Set(refs.map((r) => ptag(r.split('.')[0])))].slice(0, 6);
      const inter = s0.kind === 'startall';
      add(inter ? 'warn' : 'error', inter ? 'interlock' : 'short', inter ? A('Pressing the START buttons together shorts the supply (' + tags.join(', ') + '). Forward and reverse contactors can close at the same time.', 'ضغط أزرار START مع بعض بيعمل ماس في المصدر (' + tags.join(', ') + '). كونتاكتورات الأمام والعكس ممكن يقفلوا مع بعض.') : A('Short circuit during "' + s0.label[0] + '". The current path includes: ' + tags.join(', ') + '.', 'ماس كهربي أثناء "' + s0.label[1] + '". مسار التيار فيه: ' + tags.join(', ') + '.'), { refs: refs.map((r) => r.split('.')[0]), std: inter ? 'IEC 60947-4-1, IEC 60204-1 §9.3.4' : 'IEC 60364-4-43', fix: inter ? A('Add an electrical interlock (NC contact of each contactor in series with the other coil) and a mechanical interlock.', 'ضيف انترلوك كهربي (كونتاكت NC من كل كونتاكتور على التوالي مع كويل التاني) وانترلوك ميكانيكي.') : A('Find the wire or part that joins the two poles. Look at the marked parts.', 'دوّر على السلك أو الجهاز اللي بيوصل القطبين. بص على الأجزاء المعلّمة.') });
      for (const r of refs) mark(r.split('.')[0], 'x', A('in the short-circuit path', 'في مسار الماس'));
    }
    // events: burnt / tripped parts
    const seen = new Set();
    for (const e of rec.events) {
      if (!e.part || seen.has(e.type + e.part + e.msg)) continue;
      if (e.type !== 'burn' && e.type !== 'trip') continue;
      seen.add(e.type + e.part + e.msg);
      const p = EL.partById(c, e.part); if (!p) continue;
      const st = rec.steps[e.step];
      if (st && (st.kind === 'startall' || st.kind === 'startall_rel')) continue;
      const msg = e.msg ? String(e.msg) : '';
      const pre = hid && p.hid ? null : p;
      if (!pre) continue;
      if (e.type === 'burn') { add('error', 'burn', A(p.tag + ' burns in the simulation' + (msg ? ': ' + msg : '') + ' (' + (st ? st.label[0] : '') + ').', p.tag + ' بيتحرق في المحاكاة' + (msg ? ': ' + msg : '') + ' (' + (st ? st.label[1] : '') + ').'), { refs: [p.id], fix: A('Check the voltage rating, polarity, current limiting and protection of ' + p.tag + '.', 'راجع جهد وقطبية وتحديد التيار والحماية لـ' + p.tag + '.') }); mark(p.id, 'x', A('burns' + (msg ? ': ' + msg : ''), 'بيتحرق' + (msg ? ': ' + msg : ''))); }
      else if (!/^(?:test button)/.test(msg)) { add('warn', 'trip', A(p.tag + ' trips' + (msg ? ' (' + msg + ')' : '') + ' (' + (st ? st.label[0] : '') + ').', p.tag + ' بيفصل' + (msg ? ' (' + msg + ')' : '') + ' (' + (st ? st.label[1] : '') + ').'), { refs: [p.id], why: A('The current went above what the protection allows.', 'التيار عدّى اللي الحماية بتسمح بيه.') }); mark(p.id, 'q', A('trips', 'بيفصل')); }
    }
    // voltage checks on loads
    for (const p of loadsAll) {
      const m = meta(p); if (!m.feed || !m.volt) continue;
      const L = rec.loads[p.id], rated = m.volt(p); if (!rated) continue;
      const st = rec.steps.map((s) => s.parts[p.id]);
      const vmax = Math.max(...st.map((s) => Math.max(s.vac, s.vdc))), acRated = m.ac ? m.ac(p) : null;
      const bestAc = Math.max(...st.map((s) => s.vac)), bestDc = Math.max(...st.map((s) => s.vdc));
      if (vmax > 1.3 * rated && !(p.state && p.state.burnt && false)) { add('error', 'overvolt', A(p.tag + ' is rated ' + rated + ' V but sees ' + fix1(vmax) + ' V.', p.tag + ' مقنن ' + rated + ' فولت وواصله ' + fix1(vmax) + ' فولت.'), { refs: [p.id], std: 'IEC 60204-1 §4.3', fix: A('Use the correct supply for this device (transformer / 24 V PSU) or a device with the right rating.', 'استخدم المصدر المناسب للجهاز (ترانس / باور 24 فولت) أو جهاز بالجهد الصح.') }); mark(p.id, 'x', A('overvoltage ' + fix1(vmax) + ' V', 'جهد زيادة ' + fix1(vmax) + ' فولت')); }
      else if (!L.ever && vmax > 0.12 * rated && vmax < 0.75 * rated) { add('warn', 'undervolt', A(p.tag + ' needs about ' + rated + ' V but gets only ' + fix1(vmax) + ' V.', p.tag + ' محتاج حوالي ' + rated + ' فولت ومش واصله غير ' + fix1(vmax) + ' فولت.'), { refs: [p.id], fix: A('Check the supply voltage, the cable voltage drop and any series device in the path.', 'راجع جهد المصدر وهبوط الجهد في الكابل وأي جهاز على التوالي في المسار.') }); mark(p.id, 'q', A('low voltage ' + fix1(vmax) + ' V', 'جهد قليل ' + fix1(vmax) + ' فولت')); }
      if (acRated != null && vmax > 0.6 * rated) { if (acRated && bestAc < 0.3 * rated && bestDc > 0.6 * rated) { add('error', 'dc_on_ac', A(p.tag + ' is an AC device but gets DC.', p.tag + ' جهاز AC بس واصله DC.'), { refs: [p.id] }); mark(p.id, 'x', A('DC on AC device', 'DC على جهاز AC')); } else if (!acRated && bestDc < 0.3 * rated && bestAc > 0.6 * rated) { add('error', 'ac_on_dc', A(p.tag + ' is a DC device but gets AC.', p.tag + ' جهاز DC بس واصله AC.'), { refs: [p.id] }); mark(p.id, 'x', A('AC on DC device', 'AC على جهاز DC')); } }
    }
    // polarity of LEDs, diodes, electrolytics
    for (const p of real) {
      const m = meta(p); if (!m.pol) continue;
      const [a, b] = m.pol, ra = p.id + '.' + a, rb = p.id + '.' + b;
      let worst = 0; for (const s of rec.steps) { void s; }
      const sims = sim; if (!sims.sameIsland(ra, rb)) continue;
      const lastV = sims.vdc(ra, rb);
      const st = rec.steps;
      const wasRev = st.some((s) => s.parts[p.id] && s.parts[p.id].vdc > 1.2 && !s.parts[p.id].act);
      if (lastV < -1.2 && (m.kind === 'led' || m.kind === 'diode' || p.type === 'CAPP')) { add(p.type === 'CAPP' ? 'error' : 'warn', 'reversed', A(p.tag + ' is connected the wrong way round (' + labelRef(ra) + ' is at the lower voltage).', p.tag + ' متوصل بالمقلوب (' + labelRef(ra) + ' على الجهد الأقل).'), { refs: [p.id], fix: A('Swap its two connections.', 'بدّل توصيلتين.') }); mark(p.id, 'x', A('reversed', 'مقلوب')); }
    }
    const steady = rec.steps.filter((s0) => s0.kind === 'steady' || s0.kind === 'preestop').pop();
    const steadyAmps = (p) => (steady ? steady.parts[p.id].pi : Math.max(0, ...rec.steps.map((s0) => s0.parts[p.id].pi)));
    // cables
    const adjR = buildGraph(rec), srcMap = sourceNets(c, sim.uf);
    for (const p of real) {
      if (kindOf(p) !== 'cable') continue;
      const pk = { amps: steadyAmps(p) }, amp = EL.AMPACITY ? EL.AMPACITY[+p.props.sec] : 0;
      if (amp && pk.amps > amp) { add('error', 'cable_over', A(p.tag + ' (' + p.props.sec + ' mm²) carries up to ' + fix1(pk.amps) + ' A but is rated about ' + amp + ' A.', p.tag + ' (' + p.props.sec + ' مم²) بيمر فيه لحد ' + fix1(pk.amps) + ' أمبير وتقديره حوالي ' + amp + ' أمبير.'), { refs: [p.id], std: 'IEC 60364-5-52', fix: A('Use a larger cross-section or reduce the load.', 'استخدم مقطع أكبر أو قلل الحمل.') }); mark(p.id, 'x', A('overloaded', 'زيادة حمل')); }
      else if (amp && pk.amps > 0.85 * amp) { add('info', 'cable_near', A(p.tag + ' runs at ' + Math.round((100 * pk.amps) / amp) + ' % of its rating.', p.tag + ' شغال على ' + Math.round((100 * pk.amps) / amp) + ' % من تقديره.'), { refs: [p.id] }); }
      // upstream protection bigger than cable?
      const n0 = sim.uf.find(p.id + '.a1');
      const seenC = bfs(adjR, n0, p.id, null);
      let best = null, bestD = 99;
      for (const [net] of seenC) { const sr = pathTo(seenC, net); for (const e of sr) { const q = EL.partById(c, e.part); if (q && meta(q).rating && meta(q).kind === 'protect' && !meta(q).thermal && sr.length < bestD) { best = q; bestD = sr.length; } } }
      if (best && amp && meta(best).rating(best) > amp) { add('warn', 'cable_unprot', A(best.tag + ' (' + meta(best).rating(best) + ' A) is larger than the rating of ' + p.tag + ' (' + amp + ' A). The cable is not protected against overload.', best.tag + ' (' + meta(best).rating(best) + ' أمبير) أكبر من تقدير ' + p.tag + ' (' + amp + ' أمبير). الكابل مش محمي من الأوفرلود.'), { refs: [best.id, p.id], std: 'IEC 60364-4-43 (Ib ≤ In ≤ Iz)', fix: A('Use a breaker not larger than the cable rating, or a larger cable.', 'استخدم بريكر مش أكبر من تقدير الكابل أو كابل أكبر.') }); mark(p.id, 'q', A('breaker too big for this cable', 'البريكر أكبر من الكابل')); }
    }
    // motors: overload protection
    for (const p of real) {
      const m = meta(p); if (!m.thermalNeeded) continue;
      const pin0 = p.id + '.' + (EL.pinsOf(p)[0].id), n0 = sim.uf.find(pin0);
      const seenM = bfs(adjR, n0, p.id, null);
      let prot = null;
      for (const [net] of seenM) for (const e of pathTo(seenM, net)) { const q = EL.partById(c, e.part); if (q && (meta(q).thermal || kindOf(q) === 'drive')) prot = q; }
      const everRan = rec.loads[p.id] && rec.loads[p.id].ever;
      if (!prot && (everRan || EL.pinsOf(p).every((q) => wired(p.id + '.' + q.id) || q.id === 'PE'))) { add('warn', 'no_overload', A(p.tag + ' has no overload protection (thermal overload relay, motor protection breaker or drive) in its supply path.', p.tag + ' مفيش له حماية أوفرلود (ثيرمال أو MPCB أو انفرتر) في مسار تغذيته.'), { refs: [p.id], std: 'IEC 60204-1 §7.3, IEC 60947-4-1', fix: A('Add a thermal overload relay (set to the nameplate current) or an MPCB.', 'ضيف ثيرمال أوفرلود (مضبوط على تيار اللوحة) أو MPCB.') }); mark(p.id, 'q', A('no overload protection', 'من غير حماية أوفرلود')); }
      else if (prot && meta(prot).rating && meta(prot).thermal && !(EL.motorPlate && /^(MOT3|MOT1)$/.test(p.type) && /^(OL|MPCB)$/.test(prot.type))) { // nameplate motors: judged on In below
        const run = steadyAmps(p);
        const set = meta(prot).rating(prot);
        if (run > 0.5 && set > 1.25 * run) { add('warn', 'ol_high', A(prot.tag + ' is set to ' + fix1(set) + ' A but ' + p.tag + ' runs at about ' + fix1(run) + ' A. It will not protect the motor.', prot.tag + ' مضبوط على ' + fix1(set) + ' أمبير و' + p.tag + ' شغال على حوالي ' + fix1(run) + ' أمبير. مش هيحمي الموتور.'), { refs: [prot.id, p.id], fix: A('Set it to the motor nameplate current.', 'اضبطه على تيار لوحة الموتور.') }); mark(prot.id, 'q', A('set too high', 'مضبوط عالي')); }
        else if (run > 0.5 && set < 0.85 * run) { add('warn', 'ol_low', A(prot.tag + ' is set to ' + fix1(set) + ' A, below the motor current of about ' + fix1(run) + ' A. It will trip during normal running.', prot.tag + ' مضبوط على ' + fix1(set) + ' أمبير أقل من تيار الموتور حوالي ' + fix1(run) + ' أمبير. هيفصل وهو شغال عادي.'), { refs: [prot.id, p.id], fix: A('Set it to the motor nameplate current.', 'اضبطه على تيار لوحة الموتور.') }); mark(prot.id, 'q', A('set too low', 'مضبوط واطي')); }
      }
    }
    // wire sizes, protection against overload (In <= Iz) and motor nameplates
    if (EL.WIRE) wireChecks(c0, c, rec, steady, add, mark);
    // E-stop / stop / start behaviour (judged on the circuit as it is wired; hidden faults are not revealed)
    const beh = exp; // behaviour is judged on the circuit as designed (hidden faults are symptoms, not design errors)
    const ES = beh.steps.find((s) => s.kind === 'estop'), PRE = beh.steps.find((s) => s.kind === 'preestop');
    if (ES && PRE) for (const p of real) { const m = meta(p); if (!m.hazard) continue; if (PRE.parts[p.id].lv && ES.parts[p.id].lv) { add('error', 'estop_fail', A('The emergency stop does not stop ' + p.tag + '.', 'زرار الطوارئ مش بيوقّف ' + p.tag + '.'), { refs: [p.id], std: 'IEC 60204-1 §9.2.3, §10.7, ISO 13850', why: A('The E-stop contact must interrupt every hazardous load (stop category 0 or 1).', 'كونتاكت الطوارئ لازم يقطع كل الأحمال الخطرة (فئة إيقاف 0 أو 1).'), fix: A('Wire the E-stop NC contact in series with the supply of the contactor coils (or into a safety relay).', 'وصّل كونتاكت NC بتاع الطوارئ على التوالي مع تغذية كويلات الكونتاكتورات (أو مع ريلاي أمان).') }); mark(p.id, 'x', A('E-stop does not stop it', 'الطوارئ مش بتوقفه')); } }
    for (const sid of beh.ops.start) {
      const rel = beh.steps.find((s0) => s0.kind === 'start' && s0.op && s0.op.id === sid), mid = beh.steps.find((s0) => s0.kind === 'startmid' && s0.op && s0.op.id === sid), prs = beh.steps.find((s0) => s0.kind === 'press' && s0.op && s0.op.id === sid);
      const stp = beh.steps.find((s0) => s0.kind === 'stop' && s0.op && s0.op.after === sid);
      for (const p of real) {
        const m = meta(p); if (!m.hazard || !rel) continue;
        const hasCoil = real.some((q) => kindOf(q) === 'coil' && meta(q).hazard);
        if (stp && rel.parts[p.id].lv && stp.parts[p.id].lv && !viaDev(c0, EL.partById(c0, p.id) || p, safetyOut, 2) && !F.some((f) => f.code === 'no_stop' && f.refs[0] === p.id)) { add('warn', 'no_stop', A(p.tag + ' keeps running after the STOP button is pressed.', p.tag + ' بيفضل شغال بعد ما بدوس ستوب.'), { refs: [p.id], fix: A('Check that the STOP contact (NC) is in series with the coil circuit and in the right branch.', 'اتأكد إن كونتاكت الستوب (NC) على التوالي مع دايرة الكويل وفي الفرع الصح.') }); mark(p.id, 'q', A('does not stop', 'مش بيقف')); }
        if (prs && mid && prs.parts[p.id].lv && !mid.parts[p.id].lv && !rel.parts[p.id].lv && (m.kind === 'coil' || !hasCoil) && !F.some((f) => f.code === 'no_seal' && f.refs[0] === p.id)) { add(beh.ops.stop.length ? 'warn' : 'info', 'no_seal', A(p.tag + ' runs only while the START button is held (no hold-in contact).', p.tag + ' بيشتغل وانت ضاغط START بس (مفيش كونتاكت حجز).'), { refs: [p.id], why: A('A self-holding (seal-in) contact from the contactor in parallel with START is normally used for motor control.', 'كونتاكت الحجز من الكونتاكتور على التوازي مع START هو المعتاد في كنترول الموتور.') }); mark(p.id, 'w', A('no hold-in', 'من غير حجز')); }
      }
    }
    // control voltage hint
    for (const p of real) { const m = meta(p); if (m.kind === 'coil' && m.volt && m.ac && m.volt(p) >= 230 && p.type === 'CONT3' && !F.some((f) => f.code === 'ctrl230')) add('info', 'ctrl230', A('Control circuit at 230 V. For safety use a control transformer or 24 V supply.', 'دايرة الكنترول على 230 فولت. للأمان استخدم ترانس كنترول أو مصدر 24 فولت.'), { std: 'IEC 60204-1 §9.1' }); }
    // net labels used once
    const nl = new Map(); for (const p of real) if (D[p.type].netlabel) { const n = String(p.props.name || '').trim().toUpperCase(); nl.set(n, (nl.get(n) || []).concat(p.id)); }
    for (const [n, ids] of nl) if (ids.length === 1) { add('warn', 'label_once', A('Net label "' + n + '" is used once, so it connects nothing.', 'اسم الشبكة "' + n + '" مستخدم مرة واحدة فمش بيوصل حاجة.'), { refs: ids }); mark(ids[0], 'q', A('only one label with this name', 'اسم واحد بس')); }
    // ICs without supply
    for (const p of real) { if (kindOf(p) !== 'ic') continue; const L = rec.steps.some((s) => s.parts[p.id].act); if (!L && a2(p, 'vcc') && a2(p, 'gnd') && wired(p.id + '.p' + p.props.vcc) && wired(p.id + '.p' + p.props.gnd)) { const v = p.state.v || 0; add('error', 'ic_nopower', A(p.tag + ' (' + (p.props.label || 'IC') + ') does not get its supply: ' + fix1(v) + ' V between the VCC and GND pins.', p.tag + ' (' + (p.props.label || 'IC') + ') مش واصله تغذية: ' + fix1(v) + ' فولت بين رجل VCC وGND.'), { refs: [p.id] }); mark(p.id, 'x', A('no supply', 'مفيش تغذية')); } }
    function a2(p, k) { return +p.props[k] > 0; }

    // what works and what does not
    const table = [];
    for (const p of real) {
      if (!isFunctional(p) && kindOf(p) !== 'source') continue;
      if (kindOf(p) === 'source') continue;
      const L = rec.loads[p.id]; if (!L) continue;
      const E = exp.loads[p.id] || L;
      const name = pName(p);
      let status, reason = null;
      const shouldWork = E.ever;
      if (L.ever) status = 'works';
      else if (hid && shouldWork) { status = 'symptom'; }
      else { status = 'never'; }
      const row = { id: p.id, tag: p.tag, name, status, ever: L.ever, expected: shouldWork, peakV: L.peakV };
      if (status === 'never' || status === 'symptom') {
        if (kindOf(p) === 'ic' && !F.some((f) => f.code === 'ic_nopower' && f.refs && f.refs[0] === p.id)) { row.status = 'never'; }
        const w = status === 'symptom' ? whyNot(exp, EL.partById(exp.c, p.id), true) : whyNot(rec, p, blind);
        row.why = w.steps; row.cause = w.cause;
        row._gp = ((w.cause && w.cause.gates) || []).map((g) => g.part).concat(((w.cause && w.cause.edges) || []).map((e) => e.part));
        const condOnly = w.cause && (w.cause.type === 'gate' || w.cause.type === 'conditions');
        if (status === 'never' && hasProcess && viaDev(c0, EL.partById(c0, p.id) || p, plcOut, 3) && !F.some((f) => f.refs && f.refs.includes(p.id) && f.code !== 'cond_only')) {
          row.status = 'untested'; add('info', 'plc_process', A(p.tag + ' is switched by the PLC program from process signals (levels, bottles, positions). My automatic tests cannot create them: run the line in Test mode and watch it.', p.tag + ' بيتشغل من برنامج الـPLC حسب إشارات العملية (مستويات، زجاجات، أماكن). اختباراتي الأوتوماتيك مش بتقدر تعملها: شغّل الخط في وضع الاختبار وراقبه.'), { refs: [p.id] });
        } else if (status === 'never' && condOnly && !F.some((f) => f.refs && f.refs.includes(p.id))) {
          row.status = 'untested'; add('info', 'cond_only', A(p.tag + ' did not operate in my tests. It has a supply path but only operates under conditions I did not create' + (w.steps[1] ? ' (' + w.steps[1][0] + ')' : '') + '.', p.tag + ' ما اشتغلش في اختباراتي. له مسار تغذية بس بيشتغل بشروط ما عملتهاش' + (w.steps[1] ? ' (' + w.steps[1][1] + ')' : '') + '.'), { refs: [p.id], steps: w.steps }); mark(p.id, 'w', A('works only on a condition (alarm / trip lamp?)', 'بيشتغل بشرط (لمبة إنذار؟)'));
        } else if (status === 'never' && !F.some((f) => f.refs && f.refs.some((r) => r.split('.')[0] === p.id) && (f.code === 'unwired_pin' || f.code === 'burn' || f.code === 'floating' || f.code === 'ic_supply_pin' || f.code === 'ic_nopower'))) {
          const fd = add('error', 'never', A(p.tag + ' never ' + (kindOf(p) === 'led' || p.type === 'LAMP' || p.type === 'LAMPH' ? 'lights' : kindOf(p) === 'motor' ? 'runs' : 'operates') + ' in any of the tests I ran.', p.tag + ' مش ' + (kindOf(p) === 'led' || p.type === 'LAMP' || p.type === 'LAMPH' ? 'بينور' : kindOf(p) === 'motor' ? 'بيدور' : 'بيشتغل') + ' في أي اختبار عملته.'), { refs: [p.id], why: w.steps[0] || null, steps: w.steps });
          for (const mk2 of w.marks) mark(mk2.ref, mk2.sym, mk2.txt);
          mark(p.id, 'x', A('does not work', 'مش شغال'));
        } else if (status === 'symptom') {
          const fd = add('error', 'symptom', A(p.tag + ' should work in this circuit but does not. Something in the real circuit is faulty.', p.tag + ' المفروض يشتغل في الدايرة دي بس مش شغال. فيه حاجة عاطلة في الدايرة الحقيقية.'), { refs: [p.id], troubleshoot: p.id, fix: A('Use "Troubleshoot" below: it tells you what to measure first.', 'استخدم "Troubleshoot" تحت: بيقولك تقيس إيه الأول.') });
          mark(p.id, 'x', A('should work, does not', 'المفروض يشتغل ومش شغال'));
        }
      } else if (kindOf(p) !== 'sensor') { mark(p.id, 'ok', A('works', 'شغال')); }
      table.push(row);
    }
    // a device that waits on a part which is itself broken is simply not working (no extra note)
    for (const row of table) {
      if (row.status !== 'untested' || !row._gp) continue;
      const bad = row._gp.find((id) => F.some((f) => f.sev === 'error' && f.refs && f.refs.some((r) => String(r).split('.')[0] === id)));
      if (!bad) continue;
      row.status = 'never'; row.blockedBy = tagOf(c, bad);
      const i = F.findIndex((f) => f.code === 'cond_only' && f.refs && f.refs[0] === row.id); if (i >= 0) F.splice(i, 1);
      mark(row.id, 'x', A('does not work (waits for ' + row.blockedBy + ')', 'مش شغال (مستني ' + row.blockedBy + ')'));
    }
    // always on
    const nOps = rec.ops.start.length + rec.ops.latched.length + rec.ops.breakers.length;
    if (nOps) for (const p of real) { const L = rec.loads[p.id]; if (!L || !L.ever || !meta(p).hazard && !['load', 'led'].includes(kindOf(p))) continue; if (L.steps.length > 3 && L.steps.every(Boolean) && p.type !== 'PLC24' && kindOf(p) !== 'ic') { add('info', 'always_on', A(p.tag + ' is energised in every test: no switch in the circuit controls it.', p.tag + ' شغال في كل اختبار: مفيش مفتاح في الدايرة بيتحكم فيه.'), { refs: [p.id] }); mark(p.id, 'w', A('always on', 'شغال دايما')); } }
    // sort findings
    const order = { error: 0, warn: 1, info: 2, ok: 3 };
    F.sort((a, b) => order[a.sev] - order[b.sev]);
    const nErr = F.filter((f) => f.sev === 'error').length, nWarn = F.filter((f) => f.sev === 'warn').length;
    const works = table.filter((r) => r.status === 'works').length, bad = table.filter((r) => r.status !== 'works').length;
    let verdict = nErr ? 'fail' : nWarn ? 'warn' : 'ok';
    if (!table.length && !nErr && !nWarn) verdict = real.length > 1 ? 'ok' : 'empty';
    const summary = verdict === 'ok'
      ? A('The circuit is correct. Everything I tested works and I found no problems.' + (table.length ? ' ' + works + ' working device(s).' : ''), 'الدايرة سليمة. كل اللي اختبرته شغال ومالقيتش مشاكل.' + (table.length ? ' ' + works + ' جهاز شغال.' : ''))
      : verdict === 'warn' ? A('The circuit works but has ' + nWarn + ' point(s) to fix for safety or reliability.', 'الدايرة شغالة بس فيها ' + nWarn + ' نقطة تتصلّح للأمان أو الاعتمادية.')
        : A('The circuit has ' + nErr + ' error(s)' + (bad ? ': ' + bad + ' device(s) will not work' : '') + '. See the marks on the drawing.', 'الدايرة فيها ' + nErr + ' خطأ' + (bad ? ': ' + bad + ' جهاز مش هيشتغل' : '') + '. بص على العلامات على الرسم.');
    return { verdict, summary, findings: F, table, marks: [...marks.values()], blind, hidden: hid, rec: { steps: rec.steps.map((s) => ({ label: s.label, kind: s.kind })), ops: rec.ops }, scenarios: rec.steps.length };
  };
  Dg.util = Object.assign(Dg.util, { opsOf, isMom, isNC, isEstop, isBreaker, applyOp, isFunctional, labelOf, tagOf });
  Dg.why = function (c, id, o) {
    const rec = Dg.runScenario(c, { heal: !!(o && o.heal) });
    const p = EL.partById(rec.c, id); if (!p) return null;
    return whyNot(rec, p, !!(o && o.blind));
  };
})(typeof window !== 'undefined' ? window : globalThis);
