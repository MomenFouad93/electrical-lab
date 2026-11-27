// S7CPU (14 DI / 10 DQ / 2 AI): byte 1 addresses I1.x / Q1.x run in EL.tick; the 8/6 PLCs keep I1.x / Q1.x invalid.
const EL = require('./load.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const LD = EL.ladder, P = (c, t) => c.parts.find((p) => p.tag === t);
const d = EL.defs.S7CPU;
ok(d && d.diag.kind === 'plc' && d.diag.nI === 14 && d.diag.nQ === 10, 'S7CPU defined: 14 DI, 10 DQ');
const ids = d.pins.map((q) => q.id);
ok(['LP', 'M', 'AI0', 'AI1'].every((x) => ids.includes(x)) && ids.filter((x) => /^I\d+$/.test(x)).length === 14 && ids.filter((x) => /^Q\d+$/.test(x)).length === 10 && !ids.includes('AO0'), 'pins L+, M, I0..I13, Q0..Q9, AI0, AI1, no AO');
ok(d.pins.find((q) => q.id === 'I10').label === 'I1.2' && d.pins.find((q) => q.id === 'Q9').label === 'Q1.1', 'pin labels are S7 addresses (I10 = I1.2, Q9 = Q1.1)');
ok(d.pins.every((q) => q.x >= 0 && q.x <= d.w && (q.y === 0 || q.y === d.h)), 'pins on the footprint edges');
// address mapping
ok(LD.bitInfo('I1.2', 10, 14).i === 10 && LD.bitInfo('Q1.1', 10, 14).i === 9 && LD.bitInfo('I1.5', 10, 14).i === 13, 'I1.2 -> 10, Q1.1 -> 9, I1.5 -> 13');
ok(!LD.bitInfo('I1.6', 10, 14) && !LD.bitInfo('Q1.2', 10, 14) && !LD.bitInfo('I2.0', 10, 14), 'I1.6, Q1.2, I2.0 invalid on the 1214C');
ok(!LD.bitInfo('I1.0', 6) && !LD.bitInfo('Q1.0', 6) && !LD.bitInfo('Q0.6', 6) && LD.bitInfo('I0.7', 6).i === 7 && LD.bitInfo('Q0.5', 6).i === 5, 'small PLC unchanged: I1.x / Q1.x / Q0.6 invalid');
// circuit: S1 on I1.2 (pin I10), lamp on Q1.1 (pin Q9); latch with stop S2 on I0.1
const c = EL.build({ name: 's7', parts: [['G1', 'DC24', 0, 300, { volt: 24 }], ['KF1', 'S7CPU', 100, 40], ['S1', 'PB_NO', 300, 300], ['S2', 'PB_NC', 400, 300], ['H1', 'LAMP', 620, 300, { volt: '24VDC' }]],
  wires: [['G1.pos', 'KF1.LP'], ['G1.neg', 'KF1.M'], ['G1.pos', 'S1.3'], ['S1.4', 'KF1.I10'], ['G1.pos', 'S2.1'], ['S2.2', 'KF1.I1'], ['KF1.Q9', 'H1.X1'], ['H1.X2', 'G1.neg']] });
const kf = P(c, 'KF1');
kf.props.mode = 'ladder';
kf.props.lad = JSON.stringify(LD.sanitize({ sym: { 'I1.2': 'Start', 'I0.1': 'Stop', 'Q1.1': 'Lamp' }, nets: [{ c: 'latch', s: [{ t: 'PAR', br: [[{ t: 'NO', a: 'I1.2' }], [{ t: 'NO', a: 'Q1.1' }]] }, { t: 'NO', a: 'I0.1' }], o: [{ t: 'COIL', a: 'Q1.1' }] }] }));
const iss = LD.check(LD.progOf(kf), kf, c);
ok(!iss.length, 'check: no findings ' + iss.map((x) => x.msg[0]).join(' | '));
EL.runSeconds(c, 0.5, {});
ok(kf.state.sup && !kf.state.q[9], 'CPU powered, Q1.1 off');
P(c, 'S1').state.act = true; EL.runSeconds(c, 0.3, {}); ok(kf.state.i[10] === 1, 'I1.2 reads the pressed S1'); P(c, 'S1').state.act = false; EL.runSeconds(c, 0.5, {});
ok(kf.state.q[9] === 1 && P(c, 'H1').state.b > 0.5, 'Q1.1 latched on, lamp lit (b=' + (P(c, 'H1').state.b || 0).toFixed(2) + ')');
P(c, 'S2').state.act = true; EL.runSeconds(c, 0.3, {}); P(c, 'S2').state.act = false; EL.runSeconds(c, 0.3, {});
ok(!kf.state.q[9], 'stop drops Q1.1');
// check messages use S7 addresses for byte 1
const k2 = JSON.parse(kf.props.lad); k2.nets.push({ c: '', s: [{ t: 'NO', a: 'I1.5' }], o: [{ t: 'COIL', a: 'Q1.0' }] }); kf.props.lad = JSON.stringify(k2);
const iss2 = LD.check(LD.progOf(kf), kf, c).map((x) => x.msg[0]).join(' | ');
ok(/terminal I1\.5/.test(iss2) && /terminal Q1\.0/.test(iss2), 'unwired byte-1 I/O named by address: ' + iss2);
ok(LD.check(LD.sanitize({ nets: [{ s: [{ t: 'NO', a: 'I1.6' }], o: [{ t: 'COIL', a: 'Q1.2' }] }] }), kf, null).filter((x) => x.lvl === 'bad').length === 2, 'I1.6 and Q1.2 rejected on the 1214C');
// SVG draws
const svg = d.draw(kf); ok(/CPU 1214C/.test(svg) && /RUN/.test(svg) && (svg.match(/<rect/g) || []).length > 60, 'draw(): body, terminals, LEDs');
// serialize round trip keeps the part
const c3 = EL.deserialize(EL.serialize(c)); ok(P(c3, 'KF1') && P(c3, 'KF1').type === 'S7CPU', 'serialize round trip');
console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
