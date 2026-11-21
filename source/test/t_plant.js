const EL = require('./load.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const c = EL.build({ name: 'p', parts: [['G1', 'SRC3', 0, 0], ['QF1', 'MCB3', 0, 150, { rating: 16 }], ['M1', 'MOT3', 0, 300, { kw: 1.5, conn: 'delta' }], ['SL1', 'FLOAT', 300, 0], ['B1', 'TX', 400, 0, { proc: 0 }]],
  wires: [['G1.L1', 'QF1.1'], ['G1.L2', 'QF1.3'], ['G1.L3', 'QF1.5'], ['QF1.2', 'M1.U1'], ['QF1.4', 'M1.V1'], ['QF1.6', 'M1.W1']] });
c.plant = EL.plant.build({ units: [['S1', 'SUPPLY', 0, 0, { bar: 0.3 }], ['P1', 'PUMP', 150, 0, { motor: 'M1' }], ['T1', 'TANK', 400, 0, { lvl0: 10, lt: 'B1', sw: [{ n: 'LSH', l: 80, t: 'SL1' }] }], ['V1', 'VALVE', 650, 0, { open: true }], ['D1', 'DRAIN', 800, 0]],
  pipes: [['S1.out', 'P1.in'], ['P1.out', 'T1.inA'], ['T1.out1', 'V1.a'], ['V1.b', 'D1.in']] });
c.parts.find((p) => p.tag === 'QF1').state.on = true;
const T1 = EL.plant.byTag(c.plant, 'T1'), P1 = EL.plant.byTag(c.plant, 'P1'), M1 = c.parts.find((p) => p.tag === 'M1');
EL.runSeconds(c, 3, { mains: true });
console.log('speed', M1.state.w.toFixed(2), 'seqdir', M1.state.seqdir, 'pump q L/min', (P1.state.q * 60).toFixed(1), 'lvl', T1.state.lvl.toFixed(1), 'amps', M1.state.amps && M1.state.amps.toFixed(2));
ok(M1.state.w > 0.9, 'motor runs');
ok(P1.state.q * 60 > 40, 'pump delivers flow');
const l0 = T1.state.lvl; EL.runSeconds(c, 20, { mains: true });
ok(T1.state.lvl > l0, 'tank fills ' + T1.state.lvl.toFixed(1));
ok(Math.abs(c.parts.find((p) => p.tag === 'B1').props.proc - T1.state.lvl) < 1, 'LT follows level');
// close outlet valve, pump on, until LSH
EL.plant.byTag(c.plant, 'V1').props.open = false;
const ampsOpen = M1.state.amps;
EL.runSeconds(c, 200, { mains: true });
ok(T1.state.lvl > 80 && c.parts.find((p) => p.tag === 'SL1').state.act, 'LSH operates above 80%: lvl ' + T1.state.lvl.toFixed(1));
// stop motor: open MCB
c.parts.find((p) => p.tag === 'QF1').state.on = false; c.parts.find((p) => p.tag === 'QF1').state.closed = false;
// dry run test: tank empty suction
const c2 = EL.build({ name: 'p2', parts: [['G1', 'SRC3', 0, 0], ['M1', 'MOT3', 0, 300, { kw: 1.5, conn: 'delta' }]], wires: [['G1.L1', 'M1.U1'], ['G1.L2', 'M1.V1'], ['G1.L3', 'M1.W1']] });
c2.plant = EL.plant.build({ units: [['T1', 'TANK', 0, 0, { lvl0: 1, vol: 50 }], ['P1', 'PUMP', 200, 0, { motor: 'M1' }], ['T2', 'TANK', 400, 0, { lvl0: 0 }]], pipes: [['T1.out1', 'P1.in'], ['P1.out', 'T2.inA']] });
EL.runSeconds(c2, 30, { mains: true });
const p2 = EL.plant.byTag(c2.plant, 'P1');
ok(EL.plant.byTag(c2.plant, 'T1').state.v < 0.2, 'suction tank emptied ' + EL.plant.byTag(c2.plant, 'T1').state.v.toFixed(2));
ok(p2.state.cav, 'pump cavitates when suction tank empty');
ok(EL.plant.problems(c2).some((x) => /Suction starved/.test(x[2][0])), 'problem reported');
// RO + HX
const c3 = EL.build({ name: 'p3', parts: [['G1', 'SRC3', 0, 0], ['M1', 'MOT3', 0, 300, { kw: 2.2, conn: 'delta' }]], wires: [['G1.L1', 'M1.U1'], ['G1.L2', 'M1.V1'], ['G1.L3', 'M1.W1']] });
c3.plant = EL.plant.build({ units: [['S1', 'SUPPLY', 0, 0, { bar: 2, temp: 15 }], ['S2', 'SUPPLY', 0, 300, { bar: 1, temp: 70 }], ['E1', 'HX', 150, 0], ['D2', 'DRAIN', 300, 300], ['P1', 'PUMP', 300, 0, { motor: 'M1', head: 120, qmax: 40 }], ['R1', 'RO', 500, 0], ['T1', 'TANK', 800, 0, { lvl0: 0 }], ['D1', 'DRAIN', 800, 300]],
  pipes: [['S1.out', 'E1.cin'], ['E1.cout', 'P1.in'], ['S2.out', 'E1.hin'], ['E1.hout', 'D2.in'], ['P1.out', 'R1.in'], ['R1.perm', 'T1.inA'], ['R1.rej', 'D1.in']] });
EL.runSeconds(c3, 5, { mains: true });
const R1 = EL.plant.byTag(c3.plant, 'R1'), E1 = EL.plant.byTag(c3.plant, 'E1');
console.log('RO pin', R1.state.pin.toFixed(2), 'qp', (R1.state.qp * 60).toFixed(2), 'qr', (R1.state.qr * 60).toFixed(2), 'rec', R1.state.rec.toFixed(1), 'Tf', R1.state.Tf.toFixed(1), 'HX', JSON.stringify(E1.state.tc));
ok(R1.state.qp > 0 && R1.state.rec > 5 && R1.state.rec < 90, 'RO produces permeate');
ok(R1.state.Tf > 20, 'HX warms the feed');
// serialize round trip
const c4 = EL.deserialize(EL.serialize(c));
ok(c4.plant && c4.plant.units.length === 5 && c4.plant.pipes.length === 4, 'plant survives save/load');
const evil = JSON.parse(EL.serialize(c)); evil.plant.units[0].tag = '<img src=x onerror=alert(1)>'; evil.parts[0].tag = '"><script>x</script>';
const c5 = EL.deserialize(JSON.stringify(evil));
ok(!/[<>]/.test(c5.plant.units[0].tag) && !/[<>"]/.test(c5.parts[0].tag), 'hostile tags cleaned: ' + c5.plant.units[0].tag + ' / ' + c5.parts[0].tag);
console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
