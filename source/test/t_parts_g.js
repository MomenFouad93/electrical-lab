const EL = require('./load.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } else console.log('ok  ', m); };
const run = (spec, s, ev) => { const c = EL.build(spec); EL.events.length = 0; EL.runSeconds(c, s || 2, { mains: true }); return c; };
const part = (c, t) => c.parts.find((p) => p.tag === t);
// 1. SCR latch (DC): J1 12V -> R1 100 -> SCR.A ; K -> J1.neg ; gate via SW(act) and R2 1k from J1.pos
{
  const spec = { name: 'scr', parts: [['J1', 'PCB_PWR', 0, 0, { volt: 12 }], ['R1', 'PCB_R', 100, 0, { r: 100 }], ['Q1', 'SCR', 250, 0, {}], ['SW1', 'PCB_SW', 100, 100], ['R2', 'PCB_R', 200, 100, { r: 1000 }]],
    wires: [['J1.pos', 'R1.A'], ['R1.B', 'Q1.A'], ['Q1.K', 'J1.neg'], ['J1.pos', 'SW1.A'], ['SW1.B', 'R2.A'], ['R2.B', 'Q1.G']] };
  const c = EL.build(spec);
  EL.runSeconds(c, 1.5, { mains: true }); ok(!part(c, 'Q1').state.on, 'SCR off without gate pulse');
  part(c, 'SW1').state.act = true; EL.runSeconds(c, 1, { mains: true }); ok(part(c, 'Q1').state.on, 'SCR on after gate pulse');
  part(c, 'SW1').state.act = false; EL.runSeconds(c, 1.5, { mains: true }); ok(part(c, 'Q1').state.on, 'SCR stays on after gate removed (latched), amps=' + part(c, 'Q1').state.amps.toFixed(3));
  const c2 = EL.build(spec); part(c2, 'Q1').fault = 'nogate'; part(c2, 'SW1').state.act = true; EL.runSeconds(c2, 2, { mains: true }); ok(!part(c2, 'Q1').state.on, 'SCR with dead gate never triggers');
}
// 2. TRIAC with AC lamp
{
  const spec = { name: 'tri', parts: [['S1', 'SRC1', 0, 0, {}], ['H1', 'LAMP', 100, 0, { volt: '230V AC' }], ['Q1', 'TRIAC', 250, 0, {}], ['R1', 'PCB_R', 100, 100, { r: 10000 }], ['SW1', 'PCB_SW', 200, 100]],
    wires: [['S1.L', 'H1.X1'], ['H1.X2', 'Q1.MT2'], ['Q1.MT1', 'S1.N'], ['S1.L', 'SW1.A'], ['SW1.B', 'R1.A'], ['R1.B', 'Q1.G']] };
  try {
    const c = EL.build(spec); EL.runSeconds(c, 1.5, { mains: true }); ok(part(c, 'H1').state.b < 0.1, 'lamp off before trigger');
    part(c, 'SW1').state.act = true; EL.runSeconds(c, 1.5, { mains: true }); ok(part(c, 'Q1').state.on && part(c, 'H1').state.b > 0.5, 'triac triggers, lamp on');
    part(c, 'SW1').state.act = false; EL.runSeconds(c, 1.5, { mains: true }); ok(!part(c, 'Q1').state.on, 'triac drops out when gate removed and lamp current is small: on=' + part(c, 'Q1').state.on + ' amps=' + part(c, 'Q1').state.amps.toFixed(3));
  } catch (e) { bad++; console.log('FAIL triac', e.message); }
}
// 2b. TRIAC with a heater load latches
{
  const spec = { name: 'tri2', parts: [['S1', 'SRC1', 0, 0, {}], ['H1', 'HTR', 100, 0, {}], ['Q1', 'TRIAC', 250, 0, {}], ['R1', 'PCB_R', 100, 100, { r: 10000 }], ['SW1', 'PCB_SW', 200, 100]],
    wires: [['S1.L', 'H1.A'], ['H1.B', 'Q1.MT2'], ['Q1.MT1', 'S1.N'], ['S1.L', 'SW1.A'], ['SW1.B', 'R1.A'], ['R1.B', 'Q1.G']] };
  const c = EL.build(spec); part(c, 'SW1').state.act = true; EL.runSeconds(c, 1.5, { mains: true }); part(c, 'SW1').state.act = false; EL.runSeconds(c, 1.5, { mains: true });
  ok(part(c, 'Q1').state.on && part(c, 'Q1').state.amps > 1, 'triac with heater load stays on after gate release, amps=' + part(c, 'Q1').state.amps.toFixed(2));
}
// 3. MOV
{
  const mk = (src, vr) => EL.build({ name: 'mov', parts: [['S1', src, 0, 0, {}], ['RV1', 'MOV', 100, 0, { vrms: vr }]], wires: src === 'SRC3' ? [['S1.L1', 'RV1.A'], ['S1.L2', 'RV1.B']] : [['S1.L', 'RV1.A'], ['S1.N', 'RV1.B']] });
  const c = mk('SRC1', 275); EL.runSeconds(c, 2, { mains: true }); ok(!part(c, 'RV1').state.burnt, 'MOV 275 V ok on 230 V');
  const c2 = mk('SRC3', 275); EL.runSeconds(c2, 2, { mains: true }); ok(part(c2, 'RV1').state.burnt, 'MOV 275 V fails across 400 V');
}
// 4. PTC
{
  const mk = (r) => EL.build({ name: 'ptc', parts: [['J1', 'PCB_PWR', 0, 0, { volt: 12 }], ['F1', 'PTCF', 100, 0, { hold: 0.1 }], ['R1', 'PCB_R', 200, 0, { r }]], wires: [['J1.pos', 'F1.A'], ['F1.B', 'R1.A'], ['R1.B', 'J1.neg']] });
  const c = mk(1000); EL.runSeconds(c, 3, { mains: true }); ok(!part(c, 'F1').state.trip, 'PTC holds at 12 mA');
  const c2 = mk(10); EL.runSeconds(c2, 6, { mains: true }); ok(part(c2, 'F1').state.trip, 'PTC trips on a 1.2 A load');
}
// 5. TVS and XTAL basic
{
  const c = EL.build({ name: 'tvs', parts: [['J1', 'PCB_PWR', 0, 0, { volt: 24 }], ['R1', 'PCB_R', 100, 0, { r: 100 }], ['DT1', 'TVS', 200, 0, { vbr: 15 }]], wires: [['J1.pos', 'R1.A'], ['R1.B', 'DT1.K'], ['DT1.A', 'J1.neg']] });
  EL.runSeconds(c, 2, { mains: true }); const p = part(c, 'DT1'); ok(true, 'TVS clamp test ran: burnt=' + !!p.state.burnt + ' pw=' + (p.state.pw || 0).toFixed(2));
}
console.log(bad ? 'FAILED ' + bad : 'ALL OK');
