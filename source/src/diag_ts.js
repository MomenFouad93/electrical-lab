/* Guided troubleshooter (offline).
   Model based: every single fault (part fault, loose wire, tripped device) is simulated against the same operator procedure the person used,
   the person's symptoms and measurements rule hypotheses in or out, and the next check is the one that separates the remaining suspects best.
   Cases that were solved before raise the odds of the same fault type next time. */
(function (g) {
  const EL = g.EL, D = EL.defs, Dg = EL.diag, U = Dg.util;
  const Ts = (EL.ts = {});
  const A = (a, b) => [a, b];
  const DT = EL.TICK;
  const cabs = EL.cabs;
  const MISS = 0.03; // how much a wrong prediction counts against a suspect (people misread meters, models are not perfect)
  const f1 = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2));
  const fmtOhm = (r) => (!isFinite(r) || r > 5e7 ? 'OL' : r >= 1e6 ? (r / 1e6).toFixed(1) + ' MΩ' : r >= 1e3 ? (r / 1e3).toFixed(1) + ' kΩ' : f1(r) + ' Ω');

  /* ---------- operator procedure ---------- */
  Ts.opKeys = function (p) {
    const d = D[p.type];
    if (d && d.op) return d.op.filter((k) => typeof k === 'string' && k !== 'run' && k !== 'hold');
    return ['on', 'act', 'pos', 'target'].filter((k) => p.state && k in p.state && typeof p.state[k] !== 'object');
  };
  Ts.snapOps = function (c) {
    const o = {};
    for (const p of c.parts) { const ks = Ts.opKeys(p); if (ks.length) { o[p.id] = {}; for (const k of ks) o[p.id][k] = p.state[k]; } }
    return o;
  };
  Ts.defaultProc = function (c) {
    const proc = [], parts = c.parts.filter((p) => D[p.type]);
    for (const p of parts) if (U.isBreaker(p) && (!p.state.on || p.state.tripped) && !p.props.locked) proc.push({ id: p.id, k: 'on', v: true, t: 1.2 });
    for (const p of parts) {
      const m = U.meta(p);
      if (U.isMom(p) || U.isEstop(p) || U.isBreaker(p) || m.sensor || m.kind === 'sensor' || U.kindOf(p) === 'plc' || U.kindOf(p) === 'drive') continue;
      for (const o of U.opsOf(p)) {
        const cur = p.state[o.k];
        let v = o.vals.find((x) => String(x) !== String(cur));
        if (typeof cur === 'boolean') v = true; else if (p.type === 'HOA') v = 'H';
        if (v !== undefined && String(v) !== String(cur)) proc.push({ id: p.id, k: o.k, v, t: 1.5 });
      }
    }
    const start = parts.find((p) => U.isMom(p) && !U.isEstop(p) && !U.isNC(p) && U.opsOf(p).some((x) => x.k === 'act'));
    if (start) { proc.push({ id: start.id, k: 'act', v: true, t: 1.0 }); proc.push({ id: start.id, k: 'act', v: false, t: 3.0 }); }
    return proc;
  };
  Ts.procText = function (c, proc) {
    const out = [];
    for (const s of proc) {
      const p = EL.partById(c, s.id); if (!p) continue;
      const t = p.tag, d = Math.round(s.t * 10) / 10;
      if (s.k === 'act') out.push(s.v ? A('Press ' + t + ' and hold ' + d + ' s', 'اضغط ' + t + ' واستنى ' + d + ' ث') : A('Release ' + t + ', wait ' + d + ' s', 'سيب ' + t + '، واستنى ' + d + ' ث'));
      else if (s.k === 'on') out.push(s.v ? A('Switch ' + t + ' ON', 'شغّل ' + t + ' (ON)') : A('Switch ' + t + ' OFF', 'اقفل ' + t + ' (OFF)'));
      else out.push(A('Set ' + t + ' ' + s.k + ' = ' + s.v, 'خلّي ' + t + ' ' + s.k + ' = ' + s.v));
    }
    return out;
  };
  function runFor(c, secs) { const n = Math.max(1, Math.round(secs / DT)); for (let i = 0; i < n; i++) EL.tick(c, DT, { mains: true }); }
  function runProc(c, proc, tail) {
    runFor(c, 1.5);
    for (const s of proc) { const p = EL.partById(c, s.id); if (p) U.applyOp(p, s.k, s.v); runFor(c, Math.max(0.3, Math.min(12, s.t || 1))); }
    runFor(c, tail == null ? 4 : tail);
  }
  function prepare(c0, init) {
    const c = U.clone(c0); c.time = 0;
    if (init) for (const id in init) { const p = EL.partById(c, id); if (p) for (const k in init[id]) p.state[k] = init[id][k]; }
    return c;
  }

  /* ---------- fault knowledge ---------- */
  const PRI = { blown: 3, open_coil: 1.5, burnt: 1.4, no_close: 1, welded: 0.5, bad95: 1, pole_open: 0.8, open: 1.2, shorted: 0.5, open_winding: 1, low_ins: 0.8, turn_short: 0.5, seized: 0.5, stuck: 1, drift: 0.8, dead: 1, leak: 0.6, wont_close: 0.8, pole2_open: 0.8, dirty: 1.2, flat: 1.5, short: 0.6 };
  const priorOf = (p, key) => { let w = PRI[key]; if (w == null) w = /^open_\d+$|^open_[a-d]$/.test(key) ? 0.35 : 0.6; return w; };
  const FIX = {
    blown: A('Replace the fuse/lamp with the same rating. First find out why it blew (overload, short, wrong rating).', 'غيّر الفيوز/اللمبة بنفس التقدير. وقبلها اعرف ليه اتحرق (أوفرلود، ماس، تقدير غلط).'),
    open_coil: A('Replace the coil (or the whole contactor/relay). Check the coil resistance with the power off.', 'غيّر الكويل (أو الكونتاكتور/الريلاي كله). قيس مقاومة الكويل والكهرباء فاصلة.'),
    burnt: A('Replace the part. Look for the cause: overvoltage, wrong coil voltage, shorted turns.', 'غيّر القطعة. دوّر على السبب: جهد زيادة، كويل بجهد غلط، لفات ماسة.'),
    no_close: A('Contacts or armature are stuck or dirty. Clean/replace the contactor.', 'الكونتاكتات أو الحديدة معلقة أو مبوّظة. نضّف أو غيّر الكونتاكتور.'),
    welded: A('Contacts are welded. Replace the contactor and find the cause (overload, short, wrong size).', 'الكونتاكتات لحمت. غيّر الكونتاكتور ودوّر على السبب (أوفرلود، ماس، مقاس غلط).'),
    bad95: A('The overload auxiliary contact 95-96 is open. Replace the relay or the contact block.', 'كونتاكت 95-96 بتاع الأوفرلود مفتوح. غيّر الريلاي أو بلوك الكونتاكت.'),
    pole_open: A('One pole of the overload relay is open. Replace it.', 'قطب من الأوفرلود مقطوع. غيّره.'),
    open: A('The part is open inside. Replace it.', 'القطعة مفتوحة من جوه. غيّرها.'),
    shorted: A('The part is shorted inside. Replace it.', 'القطعة ماسة من جوه. غيّرها.'),
    open_winding: A('A motor winding is open. Check the three windings with the power off; rewind or replace the motor.', 'ملف في الموتور مقطوع. قيس الملفات التلاتة والكهرباء فاصلة؛ إعادة لف أو غيّر الموتور.'),
    low_ins: A('The insulation is weak. Megger the winding; dry or rewind, or replace the motor.', 'العزل ضعيف. اعمل ميجر للملفات؛ تجفيف أو إعادة لف أو غيّر الموتور.'),
    turn_short: A('Shorted turns in a winding. Compare the three winding resistances; rewind or replace.', 'لفات ماسة في ملف. قارن مقاومة الملفات التلاتة؛ إعادة لف أو استبدال.'),
    seized: A('The motor or the driven machine is stuck. Check bearings and the load by hand with the power off.', 'الموتور أو الماكينة معلقة. افحص الرولمان والحمل بإيدك والكهرباء فاصلة.'),
    wire: A('A connection is loose or broken. Re-terminate it at both ends (check the ferrule and the screw torque).', 'فيه توصيلة سايبة أو مقطوعة. اعمل لها توصيل جديد من الطرفين (الفيرول وعزم الشد).'),
    tripped: A('Reset it after you find why it tripped (overload, short, earth leakage). Do not just reset repeatedly.', 'اعمل له ريسيت بعد ما تعرف ليه فصل (أوفرلود، ماس، تسريب). متعملش ريسيت متكرر من غير ما تعرف السبب.'),
    estop: A('An emergency stop is pushed in. Check why, then release it by twisting.', 'زرار طوارئ مضغوط. اعرف السبب وبعدين فكه بالتدوير.'),
    dead: A('The device is dead. Check its supply first; if the supply is correct, replace it.', 'الجهاز ميت. اتأكد من التغذية الأول؛ ولو سليمة غيّره.'),
    drift: A('The value has drifted. Replace the part.', 'القيمة اتغيرت. غيّر القطعة.'),
    stuck: A('The device is stuck. Clean or replace it.', 'الجهاز معلق. نضّفه أو غيّره.'),
    leak: A('Insulation leakage to earth. Isolate the circuit and test each part with a megger.', 'تسريب للأرضي. اعزل الدايرة واختبر كل جزء بالميجر.'),
    flat: A('The battery is flat. Replace or charge it.', 'البطارية فاضية. غيّرها أو اشحنها.'),
    _: A('Replace or repair the part.', 'غيّر أو صلّح القطعة.'),
  };
  const TIPS = {
    voltage: A('A reading of tens of volts on an open wire can be ghost voltage from nearby cables. Use a low-impedance (LoZ) meter or a tester with a load.', 'قراية عشرات الفولتات على سلك مفصول ممكن تكون جهد شبح من كابلات قريبة. استخدم ملتيميتر LoZ أو تستر بحمل.'),
    ohm: A('Never measure resistance on a live circuit. Switch off, lock out, test dead, then lift one lead of the part to measure it alone.', 'متقيسش مقاومة على دايرة عليها كهرباء. افصل، اعمل لوتو، اتأكد إنها ميتة، وفك طرف واحد من القطعة وقيسها لوحدها.'),
    obs: A('Start with what you can see and hear. It costs nothing and removes many suspects.', 'ابدأ باللي تقدر تشوفه وتسمعه. ببلاش ويشيل شكوك كتير.'),
    wire: A('Loose terminals are the most common cause in the field. After finding one, pull-test the neighbours.', 'التوصيلات السايبة أكتر سبب في الميدان. بعد ما تلاقي واحدة، شد التانية اللي جنبها.'),
    coil: A('A coil that gets full voltage but does not pull in is open, burnt, or mechanically jammed. Resistance of the coil tells which.', 'كويل واصله الجهد كامل ومش بيشد يبقى مقطوع أو محروق أو معلق ميكانيكي. مقاومة الكويل بتفرّق.'),
    fuse: A('A blown fuse is a symptom. Measure the load and the cable before replacing it.', 'الفيوز المحروق عرض مش سبب. قيس الحمل والكابل قبل ما تغيّره.'),
    motor: A('If a motor hums and does not turn, check for a missing phase and a seized load before anything else.', 'لو الموتور بيهم ومش بيدور شوف فاز ناقصة وحمل معلق قبل أي حاجة.'),
  };
  Ts.fixOf = function (h) { return FIX[h.fix] || FIX[h.fault] || FIX._; };

  /* ---------- hypotheses ---------- */
  const labelOf = (c, ref) => EL.refLabel(c, ref);
  function genHyps(design, cases) {
    const hyps = [], c = design;
    const boost = (cls) => (Ts.cases ? Ts.cases.boost(cls, c) : 1);
    for (const p of c.parts) {
      const d = D[p.type]; if (!d) continue;
      const k = U.kindOf(p);
      if (k === 'decor' || k === 'label' || k === 'source' || p.type === 'NETLBL') continue;
      for (const f of d.faults || []) {
        if (f[0] === 'none') continue;
        const cls = p.type + ':' + f[0];
        hyps.push({ id: 'p:' + p.id + ':' + f[0], kind: 'part', pid: p.id, fault: f[0], cls, label: A(p.tag + ': ' + f[1][0], p.tag + ': ' + f[1][1]), prior: priorOf(p, f[0]) * boost(cls), fix: f[0] });
      }
      if (U.meta(p).kind === 'protect' && !U.meta(p).fuse && !U.isBreaker(p)) hyps.push({ id: 's:' + p.id + ':tripped', kind: 'state', what: 'tripped', pid: p.id, cls: p.type + ':tripped', label: A(p.tag + ' has tripped (needs reset)', p.tag + ' فاصل (محتاج ريسيت)'), prior: 2.5 * boost(p.type + ':tripped'), fix: 'tripped' });
      if (U.isEstop(p)) hyps.push({ id: 's:' + p.id + ':estop', kind: 'state', what: 'estop', pid: p.id, cls: p.type + ':pressed', label: A(p.tag + ' is pushed in', p.tag + ' مضغوط'), prior: 1.5, fix: 'estop' });
    }
    const seen = new Set();
    for (const w of c.wires) {
      const key = [w.a, w.b].sort().join('|'); if (seen.has(key)) continue; seen.add(key);
      hyps.push({ id: 'w:' + w.id, kind: 'wire', wid: w.id, cls: 'wire', label: A('Wire ' + labelOf(c, w.a) + ' to ' + labelOf(c, w.b) + ' is loose / broken', 'السلك ' + labelOf(c, w.a) + ' إلى ' + labelOf(c, w.b) + ' سايب / مقطوع'), prior: 0.7 * boost('wire'), fix: 'wire', refs: [w.a, w.b] });
    }
    hyps.sort((a, b) => b.prior - a.prior);
    return hyps.slice(0, 420);
  }
  function inject(c, h) {
    if (h.kind === 'part') { const p = EL.partById(c, h.pid); if (p) { p.fault = h.fault; p.hid = false; } }
    else if (h.kind === 'wire') { const w = c.wires.find((x) => x.id === h.wid); if (w) w.cut = true; }
    else if (h.kind === 'state') { const p = EL.partById(c, h.pid); if (!p) return; if (h.what === 'tripped') { p.state.tripped = true; if ('on' in p.state && U.isBreaker(p)) p.state.on = false; } else if (h.what === 'estop') p.state.act = true; }
  }

  /* ---------- measurement plan ---------- */
  function poleList(c, sim) {
    const out = [], seen = new Set();
    for (const p of c.parts) {
      if (U.kindOf(p) !== 'source') continue;
      for (const q of EL.pinsOf(p)) {
        if (q.earth && q.role !== 'N') { if (!/^(L|N|pos|neg|24V|0V)/.test(q.role || '')) continue; }
        if (q.role === 'PE' || !q.role) continue;
        const ref = p.id + '.' + q.id, n = sim.uf.find(ref);
        if (seen.has(n)) continue; seen.add(n); out.push({ ref, net: n, name: (q.role === 'pos' ? '+' : q.role === 'neg' ? '0 V' : q.role) });
      }
    }
    return out;
  }
  function makePlan(design, proc, init) {
    const c = prepare(design, init); runProc(c, proc);
    const sim = c.sim, uf = sim.uf;
    const real = c.parts.filter((p) => D[p.type] && U.kindOf(p) !== 'decor' && U.kindOf(p) !== 'label' && p.type !== 'NETLBL');
    const plan = { cands: [], acts: [], trips: [], poles: poleList(c, sim) };
    for (const p of real) {
      if (U.isFunctional(p) || U.meta(p).kind === 'sensor') plan.acts.push(p.id);
      if (U.meta(p).kind === 'protect' && !U.meta(p).fuse) plan.trips.push(p.id);
    }
    for (const id of plan.acts) plan.cands.push({ key: 'o:' + id, k: 'obs', pid: id, cost: 1, outs: ['yes', 'no'] });
    for (const id of plan.trips) plan.cands.push({ key: 't:' + id, k: 'trip', pid: id, cost: 1, outs: ['yes', 'no'] });
    // voltage candidates: one per net x pole
    const nets = new Map();
    for (const p of real) for (const q of EL.pinsOf(p)) {
      if (q.earth || q.role === 'PE') continue;
      const ref = p.id + '.' + q.id, n = uf.find(ref);
      if (!nets.has(n)) nets.set(n, []); nets.get(n).push(ref);
    }
    const wiredRef = new Set(); for (const w of c.wires) { wiredRef.add(w.a); wiredRef.add(w.b); }
    // one candidate per wired terminal (a cut wire splits a net, so each physical point matters) x source pole
    for (const [n, refs] of nets) {
      const wr = refs.filter((r) => wiredRef.has(r)); if (!wr.length) continue;
      for (const ref of wr) for (const pole of plan.poles) {
        if (pole.net === n) continue;
        plan.cands.push({ key: 'v:' + ref + '|' + pole.ref, k: 'volt', ref, pole: pole.ref, poleName: pole.name, cost: 1.5, outs: ['zero', 'part', 'full'] });
      }
    }
    // line current (clamp) on motors and other big loads
    for (const p of real) {
      const m = U.meta(p); if (!m.feed || !['motor', 'load', 'drive'].includes(m.kind) || m.feed.length < 2) continue;
      for (const id of m.feed.slice(0, 3)) plan.cands.push({ key: 'a:' + p.id + '|' + id, k: 'amp', pid: p.id, ref: p.id + '.' + id, cost: 1.8, outs: ['zero', 'part', 'full'] });
    }
    // isolated component resistance
    for (const p of real) {
      if (!(D[p.type].faults || []).length) continue;
      const m = U.meta(p), ids = EL.pinsOf(p).map((q) => q.id), pairs = [];
      if (m.feed && m.feed.length >= 2 && ['coil', 'load', 'motor', 'led', 'logic'].includes(m.kind)) { pairs.push([m.feed[0], m.feed[1]]); if (m.feed.length === 3) pairs.push([m.feed[1], m.feed[2]]); }
      else if (m.fuse || p.type === 'FUSE' || p.type === 'PCB_FUSE') pairs.push([ids[0], ids[1]]);
      else if (p.type === 'HTR' || p.type === 'RES' || p.type === 'PCB_R' || p.type === 'LAMPH') pairs.push(p.type === 'LAMPH' ? ['L', 'N'] : ['A', 'B']);
      else if (/^CAB\d$/.test(p.type)) ids.filter((x) => /^a\d$/.test(x)).forEach((x) => pairs.push([x, 'b' + x.slice(1)]));
      for (const [a, b] of pairs.slice(0, 4)) if (ids.includes(a) && ids.includes(b)) plan.cands.push({ key: 'r:' + p.id + '|' + a + '|' + b, k: 'ohm', pid: p.id, a, b, cost: 2.3, outs: ['open', 'normal', 'low'] });
    }
    // contacts at rest (power off): overload auxiliary contact, push buttons, selectors, limit switches
    for (const p of real) {
      const m = U.meta(p); if (!(D[p.type].faults || []).length) continue;
      if (!(m.kind === 'switch' || (m.kind === 'protect' && m.thermal && !U.isBreaker(p)))) continue;
      const pairs = Dg.contactPairs(p).sort((x, y) => (+y[0] > 10) - (+x[0] > 10)).slice(0, 3);
      for (const [a, b] of pairs) plan.cands.push({ key: 'c:' + p.id + '|' + a + '|' + b, k: 'contact', pid: p.id, a, b, cost: 2.1, outs: ['open', 'normal', 'low'] });
    }
    plan.cands.forEach((cd, i) => { cd.i = i; });
    plan.byKey = new Map(plan.cands.map((x) => [x.key, x.i]));
    return plan;
  }
  function isolatedOhm(p0, fault, a, b, rest) {
    const mini = EL.newCircuit();
    const q = JSON.parse(JSON.stringify(p0)); q.fault = fault || 'none'; q.hid = false;
    if (rest) { const f = EL.newPart(p0.type, 0, 0); q.state = f.state; q.id = p0.id; }
    mini.parts.push(q);
    let sim; try { sim = EL.simulate(mini, { dead: true }); } catch (e) { return NaN; }
    try { const r = EL.ohmsBetween(mini, sim, q.id + '.' + a, q.id + '.' + b); return r.r; } catch (e) { return NaN; }
  }
  function measure(c, plan, ohmCache) {
    const sim = c.sim, out = { acts: {}, trip: {}, v: new Float64Array(plan.cands.length), r: {} };
    for (const id of plan.acts) { const p = EL.partById(c, id); out.acts[id] = p ? !!Dg.activeOf(p) : false; }
    for (const id of plan.trips) { const p = EL.partById(c, id); out.trip[id] = !!(p && (p.state.tripped || (U.isBreaker(p) && !p.state.on))); }
    for (const cd of plan.cands) {
      if (cd.k === 'volt') {
        const a = cd.ref, b = cd.pole; let v = 0;
        try { if (sim.sameIsland(a, b)) v = Math.max(cabs(sim.vac(a, b)), Math.abs(sim.vdc(a, b))); } catch (e) { v = 0; }
        out.v[cd.i] = v;
      } else if (cd.k === 'amp') {
        const o = sim.pinI.get(cd.ref); out.v[cd.i] = o ? Math.max(Math.abs(o.dc), cabs(o.ac)) : 0;
      }
    }
    return out;
  }

  /* classification of readings */
  function classV(cd, v) { const fs = cd.fs || 1, z = cd.k === 'amp' ? Math.max(0.1 * fs, 0.02) : Math.max(0.1 * fs, 0.3); if (v < z) return 'zero'; if (v >= 0.72 * fs) return 'full'; return 'part'; }
  function classR(cd, r) {
    const nom = cd.nom == null ? 1 : cd.nom, nomOpen = !isFinite(nom) || nom > 5e5;
    const open = !isFinite(r) || r > 5e5;
    if (nomOpen) return open ? 'normal' : r < 50 ? 'low' : 'normal';
    if (open || r > Math.max(20 * nom, 50)) return 'open';
    if (r < 0.4 * nom && nom > 2) return 'low';
    return 'normal';
  }
  Ts.classOf = function (cd, value) { return cd.k === 'volt' || cd.k === 'amp' ? classV(cd, value) : cd.k === 'ohm' || cd.k === 'contact' ? classR(cd, value) : value ? 'yes' : 'no'; };

  /* ---------- session ---------- */
  Ts.begin = function (c0, o) {
    o = o || {};
    const design = Dg.heal(U.clone(c0));
    const reality = o.reality || c0;
    const proc = o.proc || Ts.defaultProc(design);
    const init = o.init || null;
    const sess = { design, reality, proc, init, symptoms: Object.assign({}, o.symptoms), obs: [], hyps: [], plan: null, queue: [], base: null, ready: false, ohmCache: new Map(), skip: new Set(), realityCache: null, solved: null, tips: [] };
    sess.plan = makePlan(design, proc, init);
    const h0 = prepare(design, init); runProc(h0, proc);
    sess.base = measure(h0, sess.plan);
    for (const cd of sess.plan.cands) if (cd.k === 'volt') { try { cd.ac = cabs(h0.sim.vac(cd.ref, cd.pole)) >= Math.abs(h0.sim.vdc(cd.ref, cd.pole)); } catch (e) { cd.ac = true; } }
    // full-scale (nominal) values come from the healthy circuit; points that are dead by design borrow the highest value seen in any fault
    for (const cd of sess.plan.cands) if (cd.k === 'volt' || cd.k === 'amp') { cd.nomH = sess.base.v[cd.i]; cd.fs = cd.nomH >= (cd.k === 'amp' ? 0.05 : 1) ? cd.nomH : 0; }
    sess.hyps = genHyps(design);
    sess.queue = sess.hyps.slice();
    sess.total = sess.hyps.length;
    return sess;
  };
  Ts.work = function (sess, ms) {
    const t0 = Date.now();
    while (sess.queue.length && Date.now() - t0 < ms) {
      const h = sess.queue.shift();
      const c = prepare(sess.design, sess.init); inject(c, h); runProc(c, sess.proc);
      h.pred = measure(c, sess.plan);
      for (const cd of sess.plan.cands) if ((cd.k === 'volt' || cd.k === 'amp') && cd.nomH < (cd.k === 'amp' ? 0.05 : 1)) cd.fs = Math.max(cd.fs || 0, h.pred.v[cd.i]);
      // isolated resistance of the faulted part (other hypotheses keep the healthy value)
      h.pred.r = {};
      if (h.kind === 'part') for (const cd of sess.plan.cands) if ((cd.k === 'ohm' || cd.k === 'contact') && cd.pid === h.pid) h.pred.r[cd.key] = isolatedOhm(EL.partById(sess.design, h.pid), h.fault, cd.a, cd.b, cd.k === 'contact');
    }
    if (!sess.queue.length && !sess.ready) finish(sess);
    return sess.ready;
  };
  function finish(sess) {
    const plan = sess.plan;
    for (const cd of plan.cands) if (cd.k === 'ohm' || cd.k === 'contact') {
      const p = EL.partById(sess.design, cd.pid); cd.nom = isolatedOhm(p, 'none', cd.a, cd.b, cd.k === 'contact');
      if (cd.k === 'ohm' && (!isFinite(cd.nom) || cd.nom < 1e-3)) cd.nom = 1;
    }
    // prefer the pole that gives the lowest healthy voltage (control voltage to neutral, not phase to phase)
    const bestPole = new Map();
    for (const cd of plan.cands) if (cd.k === 'volt' && cd.nomH >= 1) { const b = bestPole.get(cd.ref); if (!b || cd.nomH < b.v - 1e-6) bestPole.set(cd.ref, { v: cd.nomH, key: cd.key }); }
    for (const cd of plan.cands) if (cd.k === 'volt') { const b = bestPole.get(cd.ref); cd.cost = b ? (b.key === cd.key ? 1.5 : 2.2) : 1.8; }
    // a point that is never energised in any case tells nothing
    plan.cands = plan.cands.filter((cd) => !((cd.k === 'volt' || cd.k === 'amp') && !(cd.fs >= (cd.k === 'amp' ? 0.05 : 1))));
    plan.byKey = new Map(plan.cands.map((x) => [x.key, x]));
    sess.ready = true;
    for (const h of sess.hyps) classify(sess, h);
    sess.healthyCls = classify(sess, { id: 'H0', pred: sess.base, kind: 'none' });
    // does the healthy design reproduce the symptoms? then the fault is not in the hardware but in the drawing
    sess.healthyMatches = Object.keys(sess.symptoms).length > 0 && Object.keys(sess.symptoms).every((id) => (id.startsWith('trip:') ? sess.base.trip[id.slice(5)] : sess.base.acts[id]) === sess.symptoms[id]);
  }
  function classify(sess, h) {
    const out = h.cls2 = {};
    for (const cd of sess.plan.cands) {
      if (cd.k === 'obs') out[cd.key] = h.pred.acts[cd.pid] ? 'yes' : 'no';
      else if (cd.k === 'trip') out[cd.key] = h.pred.trip[cd.pid] ? 'yes' : 'no';
      else if (cd.k === 'volt' || cd.k === 'amp') out[cd.key] = classV(cd, h.pred.v[cd.i] || 0);
      else if (cd.k === 'ohm' || cd.k === 'contact') { const r = h.pred.r && h.pred.r[cd.key] != null ? h.pred.r[cd.key] : cd.nom; out[cd.key] = classR(cd, r); }
    }
    return out;
  }
  Ts.progress = (sess) => (sess.total ? 1 - sess.queue.length / sess.total : 1);

  /* ---------- scoring ---------- */
  Ts.rank = function (sess) {
    const list = [];
    let sum = 0;
    for (const h of sess.hyps) {
      if (!h.cls2) continue;
      let w = h.prior, mm = 0;
      for (const id in sess.symptoms) { const want = sess.symptoms[id]; const got = id.startsWith('trip:') ? h.pred.trip[id.slice(5)] : h.pred.acts[id]; if (got !== undefined && got !== want) { w *= MISS; mm++; } }
      for (const ob of sess.obs) { const got = h.cls2[ob.key]; if (got !== undefined && got !== ob.out) { w *= MISS; mm++; } }
      h.w = w; h.mm = mm; sum += w;
    }
    for (const h of sess.hyps) if (h.cls2) list.push({ h, p: sum ? h.w / sum : 0 });
    list.sort((a, b) => b.p - a.p);
    return list;
  };
  const entropy = (m) => { let t = 0; for (const k in m) t += m[k]; if (!t) return 0; let e = 0; for (const k in m) if (m[k] > 0) { const p = m[k] / t; e -= p * Math.log2(p); } return e; };
  /* hypotheses that no available check can tell apart are one answer */
  Ts.groups = function (sess, ranked) {
    const map = new Map();
    for (const r of ranked) {
      const h = r.h, sig = Object.keys(h.cls2).map((k) => h.cls2[k]).join('') + '|' + Object.keys(h.pred.acts).map((k) => (h.pred.acts[k] ? 1 : 0)).join('') + Object.keys(h.pred.trip).map((k) => (h.pred.trip[k] ? 1 : 0)).join('') + '|' + (h.kind === 'part' ? h.pid : h.id);
      if (!map.has(sig)) map.set(sig, { hs: [], p: 0 });
      const g = map.get(sig); g.hs.push(h); g.p += r.p;
    }
    const out = [...map.values()].sort((a, b) => b.p - a.p);
    for (const g of out) {
      g.main = g.hs[0];
      g.label = g.hs.length === 1 ? g.hs[0].label : A(g.hs.slice(0, 3).map((x) => x.label[0]).join('  /  '), g.hs.slice(0, 3).map((x) => x.label[1]).join('  /  '));
    }
    return out;
  };
  Ts.next = function (sess) {
    const ranked = Ts.rank(sess);
    const live = ranked.filter((r) => r.p > 0.002);
    const asked = new Set(sess.obs.map((o) => o.key));
    let best = null;
    for (const cd of sess.plan.cands) {
      if (asked.has(cd.key) || (sess.skip && sess.skip.has(cd.key))) continue;
      const m = {};
      for (const r of live) { const o = r.h.cls2[cd.key]; m[o] = (m[o] || 0) + r.p; }
      const e = entropy(m);
      if (e < 0.08) continue;
      let score = e / cd.cost;
      if (cd.k === 'volt' && sess.obs.some((o) => o.cd.k === 'volt' && o.cd.ref === cd.ref)) score *= 0.3;
      if (!best || score > best.score) best = { cd, score, e, split: m };
    }
    return { ranked, live, best };
  };
  /* what the suspects look like for every possible answer */
  Ts.outcomes = function (sess, cd, live) {
    const out = [];
    for (const key of cd.outs) {
      const hs = live.filter((r) => r.h.cls2[cd.key] === key);
      out.push({ key, p: hs.reduce((a, r) => a + r.p, 0), top: hs.slice(0, 3).map((r) => r.h) });
    }
    return out;
  };
  Ts.answer = function (sess, cd, key, value) { sess.obs = sess.obs.filter((o) => o.key !== cd.key); sess.obs.push({ key: cd.key, cd, out: key, value: value == null ? null : value }); };
  Ts.answerNumber = function (sess, cd, x) { return Ts.answer(sess, cd, Ts.classOf(cd, x), x); };
  Ts.undo = function (sess) { sess.obs.pop(); };

  /* ---------- text for a check ---------- */
  Ts.describe = function (sess, cd) {
    const c = sess.design, T = (id) => (EL.partById(c, id) || { tag: id }).tag, N = (id) => { const p = EL.partById(c, id); return p ? D[p.type].name : ['', '']; };
    if (cd.k === 'obs') {
      const p = EL.partById(c, cd.pid), kind = U.kindOf(p);
      const act = kind === 'led' || p.type === 'LAMP' || p.type === 'LAMPH' ? A('lit', 'منوّر') : kind === 'motor' ? A('turning', 'بيدور') : kind === 'coil' ? A('pulled in (you hear a click, the armature moves)', 'شادّ (بتسمع كليك والحديدة بتتحرك)') : A('working', 'شغال');
      return { title: A('Look at ' + p.tag, 'بُص على ' + p.tag), how: A('Is ' + p.tag + ' (' + N(cd.pid)[0] + ') ' + act[0] + '?', 'هل ' + p.tag + ' (' + N(cd.pid)[1] + ') ' + act[1] + '؟'), safety: null, tip: TIPS.obs, yes: A('Yes, it is', 'أيوه شغال'), no: A('No, it is not', 'لأ مش شغال') };
    }
    if (cd.k === 'trip') return { title: A('Check ' + T(cd.pid), 'افحص ' + T(cd.pid)), how: A('Is ' + T(cd.pid) + ' tripped (handle in the middle or down, flag out, reset button popped)?', 'هل ' + T(cd.pid) + ' فاصل (الهاندل في النص أو تحت، علم طالع، زرار الريسيت طالع)؟'), safety: null, tip: null, yes: A('Yes, tripped', 'أيوه فاصل'), no: A('No, it is on', 'لأ شغال') };
    if (cd.k === 'volt') {
      const ac = cd.fs > 0 && cd.fs > 0, live = cd.fs > 50;
      const alt = '';
      const ptxt = cd.poleName === '+' ? '+' : cd.poleName;
      return {
        title: A('Measure voltage at ' + labelOf(c, cd.ref), 'قيس الجهد عند ' + labelOf(c, cd.ref)),
        how: A('Set the meter to volts. Black lead on ' + labelOf(c, cd.pole) + ' (' + ptxt + '), red lead on ' + labelOf(c, cd.ref) + '. Measure exactly at this terminal. Expected when healthy: about ' + f1(cd.fs) + ' V.', 'ظبّط الجهاز على فولت. الأسود على ' + labelOf(c, cd.pole) + ' (' + ptxt + ')، والأحمر على ' + labelOf(c, cd.ref) + '. قيس عند الطرف ده بالظبط. المتوقع وهي سليمة حوالي ' + f1(cd.fs) + ' فولت.'),
        safety: live ? A('Live work above 50 V: use a CAT III/IV meter with fused leads, one hand, and follow your site permit.', 'شغل على جهد فوق 50 فولت: ملتيميتر CAT III/IV بأسلاك مفيوزة، إيد واحدة، وحسب تصريح الموقع.') : null,
        tip: TIPS.voltage, zero: A('0 V (or a few volts)', '0 فولت (أو كام فولت)'), part: A('Something in between', 'حاجة في النص'), full: A('Full voltage (about ' + f1(cd.fs) + ' V)', 'جهد كامل (حوالي ' + f1(cd.fs) + ' فولت)'), dial: cd.fs > 0 ? 'V' : 'V',
      };
    }
    if (cd.k === 'amp') {
      const p = EL.partById(c, cd.pid);
      return {
        title: A('Measure the current in ' + labelOf(c, cd.ref), 'قيس التيار في ' + labelOf(c, cd.ref)),
        how: A('Clamp meter (A~) around the single conductor at ' + labelOf(c, cd.ref) + ' while ' + p.tag + ' is running. Healthy: about ' + f1(cd.fs) + ' A. Compare the three phases: they should be nearly equal.', 'كلامب (A~) حوالين موصل واحد عند ' + labelOf(c, cd.ref) + ' و' + p.tag + ' شغال. السليم: حوالي ' + f1(cd.fs) + ' أمبير. قارن الفازات التلاتة: المفروض متقاربة.'),
        safety: A('Clamp only around one conductor. Keep clear of live terminals.', 'الكلامب حوالين موصل واحد بس. ابعد عن الأطراف الحية.'), tip: null,
        zero: A('0 A', '0 أمبير'), part: A('Lower than healthy / unbalanced', 'أقل من السليم / مش متزن'), full: A('About ' + f1(cd.fs) + ' A', 'حوالي ' + f1(cd.fs) + ' أمبير'),
      };
    }
    if (cd.k === 'contact') {
      const p = EL.partById(c, cd.pid), nomOpen = !isFinite(cd.nom) || cd.nom > 5e5;
      return {
        title: A('Check the contact ' + labelOf(c, p.id + '.' + cd.a) + ' to ' + labelOf(c, p.id + '.' + cd.b), 'افحص الكونتاكت ' + labelOf(c, p.id + '.' + cd.a) + ' إلى ' + labelOf(c, p.id + '.' + cd.b)),
        how: A('Power OFF and locked out. With ' + p.tag + ' in its rest position (not pressed, not tripped), measure continuity across that contact with one wire lifted. Healthy: ' + (nomOpen ? 'open (OL)' : 'closed, near 0 Ω') + '.', 'افصل الكهرباء واعمل لوتو. و' + p.tag + ' في وضع الراحة (مش مضغوط ولا فاصل)، قيس التوصيل على الكونتاكت وسلك واحد مفكوك. السليم: ' + (nomOpen ? 'مفتوح (OL)' : 'مقفول، قرب الصفر') + '.'),
        safety: A('Isolate and lock out first (LOTO).', 'اعزل واعمل لوتو الأول.'), tip: TIPS.ohm,
        open: A('Open (OL)', 'مفتوح (OL)'), normal: nomOpen ? A('Open, as it should be', 'مفتوح زي ما المفروض') : A('Closed (near 0 Ω)', 'مقفول (قرب الصفر)'), low: A('Shorted when it should be open', 'مقفول وهو المفروض مفتوح'),
      };
    }
    const p = EL.partById(c, cd.pid);
    return {
      title: A('Measure the resistance of ' + p.tag, 'قيس مقاومة ' + p.tag),
      how: A('Power OFF, locked out and tested dead. Lift one wire of ' + p.tag + ' so it is alone. Ohm range between ' + labelOf(c, p.id + '.' + cd.a) + ' and ' + labelOf(c, p.id + '.' + cd.b) + '. A healthy one reads about ' + fmtOhm(cd.nom) + '.', 'افصل الكهرباء واعمل لوتو واتأكد إنها ميتة. فك سلك من ' + p.tag + ' عشان يبقى لوحده. على الأوم بين ' + labelOf(c, p.id + '.' + cd.a) + ' و' + labelOf(c, p.id + '.' + cd.b) + '. السليم بيقرا حوالي ' + fmtOhm(cd.nom) + '.'),
      safety: A('Isolate and lock out first (LOTO). Never measure ohms on a live circuit.', 'اعزل واعمل لوتو الأول. متقيسش أوم على دايرة عليها كهرباء.'), tip: TIPS.ohm,
      open: A('Open (OL, no continuity)', 'مفتوح (OL، مفيش توصيل)'), normal: A('About ' + fmtOhm(cd.nom), 'حوالي ' + fmtOhm(cd.nom)), low: A('Much lower (shorted)', 'أقل بكتير (ماس)'),
    };
  };
  Ts.outLabel = function (sess, cd, key) { const d = Ts.describe(sess, cd); return (cd.k === 'obs' || cd.k === 'trip') ? d[key] : d[key]; };

  /* ---------- reality (training boards: the faulted circuit is the machine) ---------- */
  Ts.readReality = function (sess, cd) {
    if (!sess.realityCache) { const c = prepare(sess.reality, sess.init); runProc(c, sess.proc); sess.realityCache = c; }
    const c = sess.realityCache, sim = c.sim;
    if (cd.k === 'obs') { const p = EL.partById(c, cd.pid); return { out: Dg.activeOf(p) ? 'yes' : 'no' }; }
    if (cd.k === 'trip') { const p = EL.partById(c, cd.pid); return { out: p.state.tripped || (U.isBreaker(p) && !p.state.on) ? 'yes' : 'no' }; }
    if (cd.k === 'volt') {
      let v = 0; try { if (sim.sameIsland(cd.ref, cd.pole)) v = Math.max(cabs(sim.vac(cd.ref, cd.pole)), Math.abs(sim.vdc(cd.ref, cd.pole))); } catch (e) { v = 0; }
      return { out: classV(cd, v), value: v };
    }
    if (cd.k === 'amp') { const o = sim.pinI.get(cd.ref); const v = o ? Math.max(Math.abs(o.dc), cabs(o.ac)) : 0; return { out: classV(cd, v), value: v }; }
    const p = EL.partById(c, cd.pid); const r = isolatedOhm(p, p.fault, cd.a, cd.b, cd.k === 'contact');
    return { out: classR(cd, r), value: r };
  };
  /* symptoms read from the faulted circuit (what the person would see on the real machine) */
  Ts.autoSymptoms = function (c0, proc) {
    const sess = { design: Dg.heal(U.clone(c0)), reality: c0, proc: proc || Ts.defaultProc(Dg.heal(U.clone(c0))), init: null };
    const a = prepare(sess.design); runProc(a, sess.proc); const b = prepare(c0); runProc(b, sess.proc);
    const sym = {};
    for (const p of a.parts) {
      if (!(U.isFunctional(p) && (U.meta(p).active || U.meta(p).feed))) continue;
      const e = !!Dg.activeOf(p), r = !!Dg.activeOf(EL.partById(b, p.id));
      if (e !== r) sym[p.id] = r;
    }
    for (const p of a.parts) {
      if (!(U.meta(p).kind === 'protect' && !U.meta(p).fuse)) continue;
      const q = EL.partById(b, p.id), tr = (x) => !!(x.state.tripped || (U.isBreaker(x) && !x.state.on));
      if (tr(p) !== tr(q)) sym['trip:' + p.id] = tr(q);
    }
    return sym;
  };
  Ts.verifyFix = function (sess, h) {
    const c = U.clone(sess.reality);
    if (h.kind === 'part') { const p = EL.partById(c, h.pid); if (p && p.fault === h.fault) { p.fault = 'none'; p.hid = false; p.state.burnt = false; p.state.blown = false; if (p.state.heat != null) p.state.heat = 0; } }
    else if (h.kind === 'wire') { const w = c.wires.find((x) => x.id === h.wid); if (w) { w.cut = false; w.hidden = false; } }
    else if (h.kind === 'state') { const p = EL.partById(c, h.pid); if (p) { p.state.tripped = false; p.state.act = false; } }
    const r = prepare(c, sess.init); runProc(r, sess.proc);
    const ok = Object.keys(sess.symptoms).every((id) => { const p = EL.partById(r, id); return p && !!Dg.activeOf(p) === !sess.symptoms[id]; });
    return { ok, circuit: c };
  };
  /* apply the repair to a circuit (used by the UI after the person confirms) */
  Ts.applyFix = function (c, h) {
    if (h.kind === 'part') { const p = EL.partById(c, h.pid); if (p) { p.fault = 'none'; p.hid = false; p.state.burnt = false; p.state.blown = false; p.state.tripped = false; if (p.state.heat != null) p.state.heat = 0; } }
    else if (h.kind === 'wire') { const w = c.wires.find((x) => x.id === h.wid); if (w) { w.cut = false; w.hidden = false; } }
    else if (h.kind === 'state') { const p = EL.partById(c, h.pid); if (p) { p.state.tripped = false; p.state.act = false; } }
  };
  /* inject a random fault the engine can see as a symptom (training mode on the person's own drawing) */
  Ts.challenge = function (c, rnd) {
    rnd = rnd || Math.random;
    const design = Dg.heal(U.clone(c)), proc = Ts.defaultProc(design);
    const hyps = genHyps(design).filter((h) => h.kind !== 'state' || h.what !== 'estop');
    const a = prepare(design); runProc(a, proc);
    const cands = [];
    for (const h of hyps) {
      if (h.prior < 0.3) continue;
      const t = prepare(design); inject(t, h); runProc(t, proc);
      let diff = false; for (const p of a.parts) { if (!(U.isFunctional(p) && (U.meta(p).active || U.meta(p).feed))) continue; if (!!Dg.activeOf(p) !== !!Dg.activeOf(EL.partById(t, p.id))) diff = true; }
      if (diff) cands.push(h);
    }
    if (!cands.length) return null;
    const h = cands[Math.floor(rnd() * cands.length)];
    inject(c, h);
    if (h.kind === 'part') { const p = EL.partById(c, h.pid); p.hid = true; }
    else if (h.kind === 'wire') { const w = c.wires.find((x) => x.id === h.wid); w.hidden = true; }
    return h;
  };

  /* ---------- learning from solved cases ---------- */
  const KEY = 'ellab.cases';
  const sigOf = (c) => c.parts.map((p) => p.type).filter((t) => D[t] && U.kindOf({ type: t }) !== 'decor').sort().join(',');
  const store = { list: [], loaded: false };
  function load() { if (store.loaded) return; store.loaded = true; try { const s = localStorage.getItem(KEY); if (s) store.list = JSON.parse(s) || []; } catch (e) { store.list = []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store.list.slice(-300))); } catch (e) {} }
  Ts.cases = {
    list() { load(); return store.list; },
    add(rec) { load(); store.list.push(Object.assign({ t: Date.now() }, rec)); save(); },
    remove(i) { load(); store.list.splice(i, 1); save(); },
    clear() { load(); store.list = []; save(); },
    boost(cls, c) { load(); let n = 0; const sig = c ? sigOf(c) : ''; for (const r of store.list) if (r.cls === cls) n += r.sig === sig ? 2 : 1; return 1 + 1.2 * Math.min(n, 6); },
    export() { load(); return JSON.stringify({ app: 'ellab', v: 1, cases: store.list }, null, 1); },
    import(text) { load(); const o = JSON.parse(text); if (!o || !Array.isArray(o.cases)) throw new Error('bad file'); let n = 0; for (const r of o.cases) if (r && r.cls && !store.list.some((x) => x.t === r.t && x.cls === r.cls)) { store.list.push(r); n++; } save(); return n; },
    sig: sigOf,
  };
  Ts.saveCase = function (sess, h, note) {
    Ts.cases.add({ cls: h.cls, sig: sigOf(sess.design), circuit: sess.design.name || '', label: h.label, symptoms: Object.keys(sess.symptoms).map((id) => (EL.partById(sess.design, id) || {}).tag + (sess.symptoms[id] ? ' works' : ' does not work')), steps: sess.obs.length, note: note || '' });
  };
  Ts.tipFor = function (h) {
    if (h.kind === 'wire') return TIPS.wire;
    if (h.fault === 'blown') return TIPS.fuse;
    if (/coil/.test(h.fault) || h.fault === 'no_close') return TIPS.coil;
    if (/winding|seized|turn_short/.test(h.fault)) return TIPS.motor;
    return null;
  };
})(typeof window !== 'undefined' ? window : globalThis);
