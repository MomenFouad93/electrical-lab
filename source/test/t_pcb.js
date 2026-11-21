const EL = require('./load.js'); require('../src/pcbparts.js');
// extract BOARDS by evaluating pcb.js with stubs
global.window = global; global.EL = EL; EL.h = () => ({}); EL.ui = { T: (x) => x[0], $: () => null, $$: () => [] };
require('../src/ui/pcb.js');
for (const id of Object.keys(EL.pcb.boards)) {
  const b = EL.pcb.boards[id];
  const c = EL.build(Object.assign({ name: b.name }, b.spec)); b.setup(c);
  EL.events.length = 0;
  EL.runSeconds(c, 2, { mains: true });
  const d = c.parts.find((p) => p.tag === 'D1');
  const r0 = b.check(c); 
  console.log(id, 'led', d ? d.state.b.toFixed(2) : '-', 'check', JSON.stringify(r0 && r0[0]));
  // apply the intended fix
  if (id === 'crack') EL.addWire(c, c.parts.find((p) => p.tag === 'TP1').id + '.p', c.parts.find((p) => p.tag === 'TP2').id + '.p', { kind: 'jumper' });
  if (id === 'burnt') { const r = c.parts.find((p) => p.tag === 'R1'); r.fault = 'none'; }
  if (id === 'fuse') { const cp = c.parts.find((p) => p.tag === 'C1'); cp.fault = 'none'; const f = c.parts.find((p) => p.tag === 'F1'); f.fault = 'none'; f.state = { heat: 0, blown: false }; }
  if (id === 'reg') { c.parts.find((p) => p.tag === 'U1').fault = 'none'; c.parts.find((p) => p.tag === 'SW1').state.act = true; }
  EL.runSeconds(c, 2, { mains: true });
  const r1 = b.check(c);
  console.log('   after fix led', d ? d.state.b.toFixed(2) : '-', 'check', JSON.stringify(r1 && r1[0]));
}
