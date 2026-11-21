const EL = require('./load.js'); require('../src/pcbparts.js');
global.window = global; global.EL = EL; EL.h = () => ({}); EL.ui = { T: (x) => x[0], $: () => null, $$: () => [] };
require('../src/ui/pcb.js');
let fail = 0;
for (const id of ['crack', 'burnt', 'fuse', 'reg']) {
  const b = EL.pcb.boards[id];
  const c = EL.build(Object.assign({ name: b.name }, b.spec)); b.setup(c);
  const sym = EL.ts.autoSymptoms(c);
  const t0 = Date.now();
  const s = EL.ts.begin(c, { reality: c, symptoms: sym }); EL.ts.work(s, 1e9);
  const tb = Date.now() - t0; let steps = 0; const log = [];
  for (; steps < 12; steps++) {
    const n = EL.ts.next(s), gs = EL.ts.groups(s, n.ranked);
    if (gs[0].p >= 0.8 || !n.best) break;
    const r = EL.ts.readReality(s, n.best.cd); log.push(EL.ts.describe(s, n.best.cd).title[0] + ' -> ' + r.out + (r.value != null ? ' (' + (+r.value).toFixed(2) + ')' : ''));
    EL.ts.answer(s, n.best.cd, r.out, r.value);
  }
  const n = EL.ts.next(s), gs = EL.ts.groups(s, n.ranked);
  console.log('==', id, 'symptoms', JSON.stringify(sym), 'hyps', s.hyps.length, 'build', tb, 'ms steps', steps, 'poles', s.plan.poles.map((p) => p.name).join(','), 'cands', s.plan.cands.length);
  log.forEach((l) => console.log('     ' + l));
  console.log('   ->', gs[0].label[0], (gs[0].p * 100).toFixed(0) + '%', '| truth parts hidden:', c.parts.filter((p) => p.hid).map((p) => p.tag + ':' + p.fault).join(','), c.wires.filter((w) => w.hidden).map((w) => 'wire ' + w.a + '-' + w.b).join(','));
}
