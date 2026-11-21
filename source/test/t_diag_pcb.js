const EL = require('./load.js'); require('../src/pcbparts.js');
global.window = global; global.EL = EL; EL.h = () => ({}); EL.ui = { T: (x) => x[0], $: () => null, $$: () => [] };
require('../src/ui/pcb.js');
for (const id of Object.keys(EL.pcb.boards)) {
  const b = EL.pcb.boards[id];
  const c = EL.build(Object.assign({ name: b.name }, b.spec)); b.setup(c);
  const t0 = Date.now(); const r = EL.diag.analyze(c);
  console.log('==', id, r.verdict, 'blind', r.blind, (Date.now() - t0) + 'ms |', r.summary[0]);
  for (const f of r.findings) console.log('    ', f.sev, f.code, f.msg[0]);
  console.log('     table', r.table.map((t) => t.tag + '=' + t.status).join(' '), '| parts', c.parts.map(p=>p.tag+(p.hid?'*':'')).join(','));
}
