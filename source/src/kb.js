/* Inspection knowledge base + reasoning engine (offline).
   Each equipment type has symptoms, visible findings, failure modes with likelihoods, and checks (measurements / inspections) with the outcome each failure mode predicts.
   The engine ranks failure modes, picks the most informative next check, and learns from the cases the user saves. */
(function (g) {
  const EL = g.EL;
  const KB = (EL.kb = { types: {}, order: [], cases: [] });
  const A = (a, b) => [a, b];
  KB.A = A;

  /* ---------- builders used by the data files ---------- */
  KB.type = function (id, name, guide) { const t = { id, name, guide: guide || [], symptoms: [], findings: [], modes: [], tests: [] }; KB.types[id] = t; KB.order.push(id); return t; };
  KB.sym = (t, id, en, ar) => t.symptoms.push({ id, name: A(en, ar) });
  KB.find = (t, id, en, ar, ill) => t.findings.push({ id, name: A(en, ar), ill: ill || null });
  KB.mode = function (t, id, en, ar, prior, sev, sym, find, fixEn, fixAr, prevEn, prevAr) {
    t.modes.push({ id, name: A(en, ar), prior, sev, sym: sym || {}, find: find || {}, fix: A(fixEn, fixAr), prevent: prevEn ? A(prevEn, prevAr) : null });
  };
  /* outs: [[key, en, ar], ...]; pred: { modeId: key | {key:p} }; def: key predicted for modes not listed */
  KB.test = function (t, id, nameEn, nameAr, howEn, howAr, outs, pred, def, cost, safeEn, safeAr) {
    t.tests.push({ id, name: A(nameEn, nameAr), how: A(howEn, howAr), outs: outs.map((o) => ({ k: o[0], name: A(o[1], o[2]) })), pred: pred || {}, def, cost: cost || 1.5, safety: safeEn ? A(safeEn, safeAr) : null });
  };

  /* ---------- learning from saved cases ---------- */
  const KEY = 'ellab.kbcases';
  let loaded = false;
  function load() { if (loaded) return; loaded = true; try { const s = localStorage.getItem(KEY); if (s) KB.cases = JSON.parse(s) || []; } catch (e) { KB.cases = []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(KB.cases.slice(-200))); } catch (e) { /* storage full: thumbnails are the usual cause */ try { localStorage.setItem(KEY, JSON.stringify(KB.cases.slice(-200).map((c) => Object.assign({}, c, { thumb: null })))); } catch (e2) {} } }
  KB.casesOf = (type) => { load(); return KB.cases.filter((c) => c.type === type); };
  KB.addCase = (c) => { load(); let t = Date.now(); while (KB.cases.some((x) => x.t === t)) t++; const row = Object.assign({}, c, { t }); KB.cases.push(row); save(); return row; };
  KB.removeCase = (t) => { load(); KB.cases = KB.cases.filter((c) => c.t !== t); save(); };
  KB.exportCases = () => { load(); return JSON.stringify({ app: 'ellab-kb', v: 1, cases: KB.cases }); };
  KB.importCases = (txt) => { load(); const o = JSON.parse(txt); if (!o || !Array.isArray(o.cases)) throw new Error('bad'); let n = 0; for (const c of o.cases) if (c && c.type && !KB.cases.some((x) => x.t === c.t)) { KB.cases.push(c); n++; } save(); return n; };
  KB.clearCases = () => { load(); KB.cases = []; save(); };

  /* the modes of a type as the engine sees them: built-in ones, with learned priors / likelihoods, plus the user's own causes */
  KB.modesOf = function (typeId) {
    const t = KB.types[typeId]; if (!t) return [];
    load();
    const cs = KB.cases.filter((c) => c.type === typeId && c.cause);
    const count = (m) => cs.filter((c) => c.cause === m).length;
    const K = 3;
    const out = t.modes.map((m) => {
      const n = count(m.id), sub = cs.filter((c) => c.cause === m.id);
      const sym = Object.assign({}, m.sym), find = Object.assign({}, m.find);
      if (n >= 2) {
        for (const s of t.symptoms) { const c1 = sub.filter((c) => (c.symptoms || []).includes(s.id)).length; const l0 = m.sym[s.id] == null ? 0.05 : m.sym[s.id]; sym[s.id] = (c1 + K * l0) / (n + K); }
        for (const f of t.findings) { const c1 = sub.filter((c) => (c.findings || []).includes(f.id)).length; const l0 = m.find[f.id] == null ? 0.05 : m.find[f.id]; find[f.id] = (c1 + K * l0) / (n + K); }
      }
      return Object.assign({}, m, { sym, find, prior: m.prior * (1 + 0.8 * Math.min(n, 8)), learned: n });
    });
    // user defined causes
    const custom = new Map();
    for (const c of cs) if (/^u:/.test(c.cause)) { if (!custom.has(c.cause)) custom.set(c.cause, []); custom.get(c.cause).push(c); }
    for (const [id, list] of custom) {
      const n = list.length, sym = {}, find = {};
      for (const s of t.symptoms) sym[s.id] = (list.filter((c) => (c.symptoms || []).includes(s.id)).length + K * 0.05) / (n + K);
      for (const f of t.findings) find[f.id] = (list.filter((c) => (c.findings || []).includes(f.id)).length + K * 0.05) / (n + K);
      const last = list[list.length - 1];
      out.push({ id, name: A(last.causeName || id, last.causeName || id), prior: 0.04 * (1 + 0.8 * Math.min(n, 8)), sev: 'med', sym, find, fix: A(last.fix || 'Use the fix you recorded in the case.', last.fix || 'استخدم الحل اللي سجلته في الحالة.'), prevent: null, learned: n, custom: true });
    }
    return out;
  };

  /* ---------- session ---------- */
  const MISS = 0.035;
  KB.begin = function (typeId, o) {
    o = o || {};
    const t = KB.types[typeId];
    return { type: typeId, t, symptoms: new Set(o.symptoms || []), finds: new Map(), tests: [], skip: new Set(), modes: KB.modesOf(typeId) };
  };
  KB.setFinding = (s, id, v) => { if (v == null) s.finds.delete(id); else s.finds.set(id, !!v); };
  KB.toggleSymptom = (s, id) => { if (s.symptoms.has(id)) s.symptoms.delete(id); else s.symptoms.add(id); };

  function testDist(t, test, mode) {
    const p = test.pred[mode.id] !== undefined ? test.pred[mode.id] : test.def;
    const d = {};
    if (typeof p === 'string') { for (const o of test.outs) d[o.k] = o.k === p ? 1 - MISS * (test.outs.length - 1) : MISS; }
    else { let sum = 0; for (const o of test.outs) { d[o.k] = p[o.k] == null ? MISS : p[o.k]; sum += d[o.k]; } for (const k in d) d[k] /= sum; }
    return d;
  }
  KB.testDist = testDist;
  KB.rank = function (s) {
    const list = []; let sum = 0;
    for (const m of s.modes) {
      let w = m.prior;
      for (const id of s.symptoms) w *= m.sym[id] == null ? 0.04 : Math.max(0.04, m.sym[id]);
      for (const [id, present] of s.finds) { const l = m.find[id] == null ? 0.05 : m.find[id]; w *= present ? Math.max(0.04, l) : Math.max(0.08, 1 - l); }
      for (const a of s.tests) { const test = s.t.tests.find((x) => x.id === a.id); if (!test) continue; w *= Math.max(0.01, testDist(s.t, test, m)[a.out] || MISS); }
      list.push({ m, w }); sum += w;
    }
    for (const r of list) r.p = sum ? r.w / sum : 0;
    list.sort((a, b) => b.p - a.p);
    return list;
  };
  const entropy = (d) => { let e = 0; for (const k in d) if (d[k] > 0) e -= d[k] * Math.log2(d[k]); return e; };
  /* next most informative question: a check, or a visible finding that is still unanswered */
  KB.next = function (s) {
    const ranked = KB.rank(s), live = ranked.filter((r) => r.p > 0.004);
    const answered = new Set(s.tests.map((x) => x.id));
    let best = null;
    for (const test of s.t.tests) {
      if (answered.has(test.id) || s.skip.has('t:' + test.id)) continue;
      const d = {};
      for (const r of live) { const dm = testDist(s.t, test, r.m); for (const k in dm) d[k] = (d[k] || 0) + r.p * dm[k]; }
      const e = entropy(d), score = e / test.cost;
      if (e > 0.12 && (!best || score > best.score)) best = { kind: 'test', test, score, e, dist: d };
    }
    for (const f of s.t.findings) {
      if (s.finds.has(f.id) || s.skip.has('f:' + f.id)) continue;
      let py = 0; for (const r of live) py += r.p * Math.max(0.04, r.m.find[f.id] == null ? 0.05 : r.m.find[f.id]);
      const e = entropy({ y: py, n: 1 - py }), score = e / 0.7;
      if (e > 0.25 && (!best || score > best.score)) best = { kind: 'find', f, score, e, dist: { y: py, n: 1 - py } };
    }
    return { ranked, live, best };
  };
  /* what each answer to a check would point to */
  KB.outcomes = function (s, test, live) {
    return test.outs.map((o) => {
      const rows = live.map((r) => ({ m: r.m, p: r.p * (testDist(s.t, test, r.m)[o.k] || 0) })).filter((x) => x.p > 0.001).sort((a, b) => b.p - a.p);
      const tot = rows.reduce((a, x) => a + x.p, 0);
      return { o, p: tot, top: rows.slice(0, 2).map((x) => x.m) };
    });
  };
  KB.answer = function (s, testId, out) { s.tests = s.tests.filter((x) => x.id !== testId); s.tests.push({ id: testId, out }); };
  KB.undo = function (s) { s.tests.pop(); };

  /* cases similar to the current situation */
  KB.similar = function (s, n) {
    load();
    const mine = new Set([...s.symptoms].map((x) => 's:' + x).concat([...s.finds].filter((x) => x[1]).map((x) => 'f:' + x[0])));
    if (!mine.size) return [];
    const rows = [];
    for (const c of KB.cases.filter((c) => c.type === s.type)) {
      const theirs = new Set((c.symptoms || []).map((x) => 's:' + x).concat((c.findings || []).map((x) => 'f:' + x)));
      let inter = 0; for (const x of mine) if (theirs.has(x)) inter++;
      const sim = inter / (mine.size + theirs.size - inter);
      if (sim >= 0.3) rows.push({ c, sim });
    }
    rows.sort((a, b) => b.sim - a.sim);
    return rows.slice(0, n || 3);
  };
})(typeof window !== 'undefined' ? window : globalThis);
