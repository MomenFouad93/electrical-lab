const EL = require('./load.js'); const KB = EL.kb;
let bad = 0; const fail = (m) => { bad++; console.log('FAIL', m); };
for (const id of KB.order) {
  const t = KB.types[id]; const sy = new Set(t.symptoms.map((x) => x.id)), fi = new Set(t.findings.map((x) => x.id)), mo = new Set(t.modes.map((x) => x.id));
  if (mo.size !== t.modes.length) fail(id + ' dup modes');
  if (sy.size !== t.symptoms.length) fail(id + ' dup symptoms');
  if (fi.size !== t.findings.length) fail(id + ' dup findings');
  for (const m of t.modes) {
    for (const k in m.sym) if (!sy.has(k)) fail(id + '.' + m.id + ' unknown symptom ' + k);
    for (const k in m.find) if (!fi.has(k)) fail(id + '.' + m.id + ' unknown finding ' + k);
    if (!m.fix[0] || !m.fix[1]) fail(id + '.' + m.id + ' no fix');
    if (!(m.prior > 0)) fail(id + '.' + m.id + ' prior');
  }
  const tids = new Set();
  for (const te of t.tests) {
    if (tids.has(te.id)) fail(id + ' dup test ' + te.id); tids.add(te.id);
    const ok = new Set(te.outs.map((o) => o.k));
    if (!ok.has(te.def)) fail(id + '.' + te.id + ' def not an outcome');
    for (const m in te.pred) { if (!mo.has(m)) fail(id + '.' + te.id + ' unknown mode ' + m); const p = te.pred[m]; if (typeof p === 'string') { if (!ok.has(p)) fail(id + '.' + te.id + ' bad pred ' + p); } else for (const k in p) if (!ok.has(k)) fail(id + '.' + te.id + ' bad outcome key ' + k + ' for ' + m); }
    if (!te.how[0] || !te.how[1]) fail(id + '.' + te.id + ' no how');
  }
  // each mode should be distinguishable: appears in at least one test pred or has symptoms
  for (const m of t.modes) if (!t.tests.some((te) => te.pred[m.id])) console.log('note: no test separates', id + '.' + m.id);
  console.log(id, 'symptoms', sy.size, 'findings', fi.size, 'modes', mo.size, 'tests', t.tests.length);
}
// scenario: motor, single phasing
{
  const s = KB.begin('motor', { symptoms: ['no_hum'] }); KB.setFinding(s, 'w_one', true);
  let r = KB.rank(s); console.log('motor top:', r.slice(0, 3).map((x) => x.m.id + ' ' + x.p.toFixed(2)).join(', '));
  if (r[0].m.id !== 'single') fail('motor single phasing not top');
  const n = KB.next(s); console.log('next:', n.best && (n.best.test ? n.best.test.id : n.best.f.id));
  KB.answer(s, 'volt', 'missing'); r = KB.rank(s); console.log('after volt missing:', r[0].m.id, r[0].p.toFixed(2));
  if (r[0].m.id !== 'single' || r[0].p < 0.8) fail('after volt should be >0.8 single');
}
// scenario: VFD OV on decel
{
  const s = KB.begin('vfd', { symptoms: ['ovf'] }); KB.setFinding(s, 'f_brake', true);
  const r = KB.rank(s); console.log('vfd top:', r.slice(0, 3).map((x) => x.m.id + ' ' + x.p.toFixed(2)).join(', '));
  if (r[0].m.id !== 'overvolt_regen') fail('vfd regen not top');
}
// learning
{
  KB.clearCases = KB.clearCases; global.localStorage = { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = v; } };
  for (let i = 0; i < 4; i++) KB.addCase({ type: 'contactor', cause: 'u:humid', causeName: 'Humidity in panel', symptoms: ['chatter'], findings: ['c_dust'], fix: 'Fit a heater' });
  const s = KB.begin('contactor', { symptoms: ['chatter'] }); KB.setFinding(s, 'c_dust', true);
  const r = KB.rank(s); console.log('learned:', r.slice(0, 3).map((x) => x.m.id + ' ' + x.p.toFixed(2)).join(', '));
  if (!r.some((x) => x.m.id === 'u:humid')) fail('custom cause not present');
  console.log('similar:', KB.similar(s, 2).length);
  const ex = KB.exportCases(); KB.clearCases(); console.log('imported', KB.importCases(ex));
}
console.log(bad ? 'FAILED ' + bad : 'ALL OK');
