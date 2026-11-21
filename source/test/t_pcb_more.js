const EL = require('./load.js'); require('../src/pcbparts.js');
global.window = global; global.EL = EL; EL.h = () => ({}); EL.ui = { T: (x) => x[0], $: () => null, $$: () => [] };
require('../src/ui/pcb.js'); require('../src/ui/pcb_more.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } else console.log('ok  ', m); };
const part = (c, t) => c.parts.find((p) => p.tag === t);
for (const id of ['npn', 'opto', 'relay', 'psu', 'usb', 'mov']) {
  const b = EL.pcb.boards[id];
  const c = EL.build(Object.assign({ name: b.name }, b.spec)); b.setup(c);
  EL.events.length = 0; EL.runSeconds(c, 3, { mains: true });
  const r0 = b.check(c);
  ok(!r0, id + ': broken board is not solved');
  const led = c.parts.find((p) => p.tag === 'D1' || p.tag === 'D3' || p.tag === 'H1');
  // apply the fix = replace all hidden faulty parts
  for (const p of c.parts) if (p.hid) { p.fault = 'none'; p.hid = false; const d = EL.defs[p.type]; if (d.init) d.init(p); }
  if (id === 'usb') { EL.runSeconds(c, 1, { mains: false }); EL.runSeconds(c, 5, { mains: false }); EL.runSeconds(c, 3, { mains: true }); }
  else EL.runSeconds(c, 3, { mains: true });
  const r1 = b.check(c);
  ok(r1 && r1[0] === 'ok', id + ': solved after replacing the faulty part (led b=' + (led ? (led.state.b || 0).toFixed(2) : '-') + ')');
  if (!(r1 && r1[0] === 'ok')) console.log('   events', JSON.stringify(EL.events.slice(0, 5)));
}
console.log(bad ? 'FAILED ' + bad : 'ALL OK');
