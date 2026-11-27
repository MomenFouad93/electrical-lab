/* Wire cross-section, wire currents, wire heating / burning, In <= Iz and nameplate checks */
const EL = require('./load.js');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const WS = EL.WIRE;
const tag = (c, t) => c.parts.find((p) => p.tag === t);
const ref = (c, s) => EL.refOf(c, s);
const wireOf = (c, a, b) => { const A = ref(c, a), B = ref(c, b); return c.wires.find((w) => (w.a === A && w.b === B) || (w.a === B && w.b === A)); };
const codes = (r) => r.findings.map((f) => f.code);

/* 1. Iz table: IEC 60364-5-52 B.52.2, B2, 2 loaded conductors, PVC copper (rounded down) */
const IZ = { 0.5: 3, 0.75: 6, 1: 10, 1.5: 16, 2.5: 23, 4: 30, 6: 38, 10: 52, 16: 69 };
ok(WS.sizes.join() === '0.5,0.75,1,1.5,2.5,4,6,10,16', 'sizes 0.5 ... 16 mm²');
ok(Object.keys(IZ).every((k) => WS.iz[k] === IZ[k]), 'Iz table ' + JSON.stringify(WS.iz));
ok(/60364-5-52/.test(WS.std[0]) && /B2/.test(WS.std[0]), 'info text cites IEC 60364-5-52 method B2');
ok(WS.sizes.every((s, i) => !i || WS.width[s] > WS.width[WS.sizes[i - 1]]) && WS.width[1.5] === 2.6, 'drawn width grows with size, 1.5 mm² = the old look');

/* 2. defaults: power 1.5, control 0.75 */
{
  const c = EL.loadTemplate('dol');
  const pw = wireOf(c, 'FR1.2', 'M1.U1'), ct = c.wires.find((w) => /A1$/.test(w.b) || /A1$/.test(w.a));
  ok(WS.mm2(c, pw) === 1.5 && WS.izOf(c, pw) === 16, 'motor wire defaults to 1.5 mm² (16 A)');
  ok(ct && WS.mm2(c, ct) === 0.75, 'coil wire defaults to 0.75 mm² (control)');
  pw.mm2 = 4; ok(WS.mm2(c, pw) === 4 && WS.izOf(c, pw) === 30, 'own size wins (4 mm² -> 30 A)');
}

/* 3. serialize / deserialize */
{
  const c = EL.loadTemplate('dol');
  c.wires[0].mm2 = 2.5; c.wires[1].mm2 = 3.3; c.wires[2].mm2 = '<b>'; c.wires[3].burnt = true;
  const d = EL.deserialize(EL.serialize(c));
  ok(d.wires[0].mm2 === 2.5, 'mm2 kept');
  ok(!('mm2' in d.wires[1]) && !('mm2' in d.wires[2]), 'bad sizes dropped');
  ok(d.wires[3].burnt === true && d.wires[3].cut === true, 'a burnt wire stays open after reload');
  const old = EL.deserialize(JSON.stringify({ v: 1, parts: JSON.parse(EL.serialize(EL.loadTemplate('dol'))).parts, wires: JSON.parse(EL.serialize(EL.loadTemplate('dol'))).wires }));
  ok(old.wires.every((w) => !('mm2' in w)), 'old files load unchanged (no mm2)');
}

/* 4. wire currents from the solver: a simple heater circuit, and the DOL motor */
function heater(w, mm2, rating) {
  const c = EL.build({ parts: [['G1', 'SRC1', 0, 0], ['QF1', 'MCB1', 0, 120, { rating, curve: 'C' }], ['E1', 'HTR', 0, 260, { w }]],
    wires: [['G1.L', 'QF1.1'], ['QF1.2', 'E1.A'], ['E1.B', 'G1.N']] });
  tag(c, 'QF1').state.on = true;
  for (const x of c.wires) x.mm2 = mm2;
  return c;
}
{
  const c = heater(2000, 1.5, 16); const sim = EL.runSeconds(c, 0.5, { mains: true });
  const I = sim.wireI.get(c.wires[1].id);
  ok(near(I, 2000 / 230, 0.15), 'heater wire current ' + I.toFixed(2) + ' A (2000 W / 230 V = 8.7 A)');
  ok(near(sim.wireI.get(c.wires[2].id), I, 0.01), 'return wire carries the same current');
}
{
  const c = EL.loadTemplate('dol'); for (const p of c.parts) if (/MCB|MPCB/.test(p.type)) p.state.on = true;
  EL.runSeconds(c, 0.5, { mains: true }); tag(c, 'SB2').state.act = true; EL.runSeconds(c, 0.5, { mains: true }); tag(c, 'SB2').state.act = false;
  const sim = EL.runSeconds(c, 4, { mains: true }), m = tag(c, 'M1');
  const Iw = sim.wireI.get(wireOf(c, 'FR1.2', 'M1.U1').id);
  ok(m.state.w > 0.9 && near(Iw, m.state.amps, 0.05), 'motor wire current ' + Iw.toFixed(2) + ' A = motor terminal current ' + m.state.amps.toFixed(2) + ' A');
  const coil = c.wires.find((x) => x.b === ref(c, 'KM1.A1') || x.a === ref(c, 'KM1.A1'));
  ok(sim.wireI.get(coil.id) > 0.01 && sim.wireI.get(coil.id) < 1, 'coil wire current ' + sim.wireI.get(coil.id).toFixed(3) + ' A');
}
{ // parallel wires (a loop) share the current
  const c = EL.build({ parts: [['G1', 'SRC1', 0, 0], ['E1', 'HTR', 0, 200, { w: 2000 }], ['X1', 'TERM1', 200, 100]],
    wires: [['G1.L', 'E1.A'], ['G1.L', 'X1.t1'], ['X1.b1', 'E1.A'], ['E1.B', 'G1.N']] });
  const sim = EL.runSeconds(c, 0.3, { mains: true });
  const a = sim.wireI.get(c.wires[0].id), b = sim.wireI.get(c.wires[1].id), tot = 2000 / 230;
  ok(near(a + b, tot, 0.2) && near(a, 2 * b, 0.2), 'two parallel paths share ' + a.toFixed(2) + ' + ' + b.toFixed(2) + ' A (the path with two wires in series takes half)');
}

/* 5. heating: below Iz stays cool, 2 x Iz gets hot but survives, 2.5 x Iz burns */
{
  const c = heater(2000, 1.5, 40); EL.runSeconds(c, 120, { mains: true });
  ok(WS.temp(c, c.wires[1]) < WS.tMax && !c.wires[1].burnt, '8.7 A on 1.5 mm² (Iz 16): ' + WS.temp(c, c.wires[1]).toFixed(0) + ' °C');
}
{
  const c = heater(3000, 0.75, 40); // 13 A on 0.75 mm² (Iz 6): 2.17 x
  EL.events.length = 0; EL.runSeconds(c, 25, { mains: true });
  const t1 = WS.temp(c, c.wires[1]);
  ok(t1 > WS.tMax && !c.wires[1].burnt, '2.2 x Iz: hot after 25 s (' + t1.toFixed(0) + ' °C), not burnt');
  ok(EL.events.some((e) => e.type === 'alarm' && e.part === c.wires[1].id), 'overheat warning emitted for the wire');
  EL.runSeconds(c, 400, { mains: true });
  ok(!c.wires[1].burnt && WS.temp(c, c.wires[1]) > WS.tSc, '2.2 x Iz sustained: ' + WS.temp(c, c.wires[1]).toFixed(0) + ' °C, damaged but not open');
}
{
  const c = heater(2000, 0.5, 40); // 8.7 A on 0.5 mm² (Iz 3): 2.9 x
  EL.events.length = 0; let t = 0;
  while (!c.wires[1].burnt && t < 300) { EL.runSeconds(c, 1, { mains: true }); t++; }
  ok(c.wires[1].burnt && c.wires[1].cut, '2.9 x Iz: insulation burns after ' + t + ' s and the wire opens');
  ok(t > 10 && t < 120, 'burn time in tens of seconds (' + t + ' s)');
  ok(EL.events.some((e) => e.type === 'burn' && e.part === c.wires[1].id), 'burn event for the toast');
  const sim = EL.runSeconds(c, 0.5, { mains: true });
  ok(tag(c, 'E1').state.v < 1, 'heater lost its supply after the wire burnt');
  ok(c.wires.every((w) => w.burnt), 'all three wires in series carried the same overload and burnt');
  for (const w of c.wires) { WS.replace(w, c); w.mm2 = 1.5; }
  EL.runSeconds(c, 1, { mains: true });
  ok(tag(c, 'E1').state.v > 200 && !c.wires.some((w) => w.cut) && WS.temp(c, c.wires[1]) < 40, 'replaced with 1.5 mm²: heater works again, wire cool');
}
{
  const c = heater(2000, 2.5, 40); for (const x of c.wires) x.mm2 = 0.75; // 2.5 x of 0.75? 8.7/6 = 1.45x
  c.wires[1].mm2 = 1; // 8.7/10: below Iz
  EL.runSeconds(c, 200, { mains: true });
  ok(!c.wires[0].burnt && WS.temp(c, c.wires[0]) > WS.tMax && WS.temp(c, c.wires[0]) < WS.tSc, '1.45 x Iz: warm (' + WS.temp(c, c.wires[0]).toFixed(0) + ' °C) but safe from burning');
}
{ // a short circuit that the breaker clears magnetically does not burn a 1.5 mm² wire
  const c = EL.build({ parts: [['G1', 'SRC1', 0, 0], ['QF1', 'MCB1', 0, 120, { rating: 16, curve: 'C' }], ['X1', 'TERM1', 0, 260]],
    wires: [['G1.L', 'QF1.1'], ['QF1.2', 'X1.t1'], ['X1.b1', 'G1.N']] });
  tag(c, 'QF1').state.on = true; c.wires.forEach((w) => (w.mm2 = 1.5));
  EL.runSeconds(c, 0.3, { mains: true });
  ok(tag(c, 'QF1').state.tripped && !c.wires.some((w) => w.burnt), 'short circuit cleared by the MCB: wire survives (' + WS.temp(c, c.wires[1]).toFixed(0) + ' °C)');
}

/* 6. diagnosis: In <= Iz, motor cable, burnt wire */
{
  const c = EL.loadTemplate('dol');
  let r = EL.diag.analyze(c);
  ok(!codes(r).some((x) => /in_gt_iz|motor_cable|ol_low|ol_high|wire_over/.test(x)), 'DOL template is clean: ' + codes(r).join(','));
  wireOf(c, 'QF1.2', 'KM1.1').mm2 = 1;
  r = EL.diag.analyze(c);
  const f = r.findings.find((x) => x.code === 'in_gt_iz');
  ok(f && /QF1/.test(f.msg[0]) && /Iz 10 A/.test(f.msg[0]), 'QF1 16 A on a 1 mm² wire: ' + (f && f.msg[0]));
  ok(r.marks.some((m) => m.ref === tag(c, 'QF1').id), 'QF1 marked on the drawing');
}
{
  const c = EL.loadTemplate('dol'); tag(c, 'M1').props.kw = 7.5; tag(c, 'FR1').props.set = 14.3; tag(c, 'QF1').props.rating = 20;
  for (const w of c.wires) if (/U1|V1|W1/.test(w.b + w.a) && (w.a.startsWith(tag(c, 'M1').id) || w.b.startsWith(tag(c, 'M1').id))) w.mm2 = 1;
  const r = EL.diag.analyze(c), f = r.findings.find((x) => x.code === 'motor_cable');
  ok(f && /M1/.test(f.msg[0]), '7.5 kW motor on 1 mm² wires: ' + (f && f.msg[0]));
}
{
  const c = EL.loadTemplate('dol'); c.wires[2].burnt = true; c.wires[2].cut = true;
  const r = EL.diag.analyze(c);
  ok(codes(r).includes('wire_burnt'), 'burnt wire reported');
}

/* 7. motor nameplate */
{
  const m = EL.newPart('MOT3', 0, 0); m.props.kw = 0.75; m.props.poles = 4; m.props.volt = '230D';
  const np = EL.motorPlate(m);
  ok(near(np.iY, 1.8, 0.1), '0.75 kW 4P: In ' + np.iY + ' A at 400 V Y (about 1.8 A)');
  ok(near(np.iD, 3.1, 0.15), '0.75 kW 4P: In ' + np.iD + ' A at 230 V Δ (about 3.1 A)');
  ok(np.eta === 82.5 && np.cos === 0.76 && np.rpm === 1410 && np.frame === '80M', 'IE3 82.5 %, cosφ 0.76, 1410 rpm, frame 80M');
  ok(np.ip === 'IP55' && np.ins === 'F' && np.duty === 'S1' && np.ie === 'IE3', 'IP55, class F, S1, IE3');
  m.props.poles = 2; ok(EL.motorPlate(m).rpm > 2750 && EL.motorPlate(m).rpm < 2900, '2-pole rpm ' + EL.motorPlate(m).rpm);
  m.props.poles = 6; ok(EL.motorPlate(m).rpm > 880 && EL.motorPlate(m).rpm < 980, '6-pole rpm ' + EL.motorPlate(m).rpm);
  m.props.kw = 1.5; m.props.poles = 4; m.props.volt = '400D'; const p15 = EL.motorPlate(m);
  ok(near(p15.iD, 3.2, 0.15) && p15.uD === 400 && p15.uY === 690, '1.5 kW 400 V Δ / 690 V Y: ' + p15.iD + ' / ' + p15.iY + ' A');
  const all = [0.37, 0.75, 1.5, 2.2, 3, 4, 5.5, 7.5, 11].map((kw) => { m.props.kw = kw; return EL.motorPlate(m).i400; });
  ok(all.every((x, i) => !i || x > all[i - 1]), 'In rises with power: ' + all.join(' '));
  const q = EL.newPart('MOT1', 0, 0); q.props.kw = 0.75; const p1 = EL.motorPlate(q);
  ok(p1.ph === 1 && near(p1.inom, 4.9, 0.4), 'MOT1 0.75 kW 230 V: ' + p1.inom + ' A');
}
{ // the simulated motor draws its nameplate current at the normal load
  const c = EL.loadTemplate('dol'); for (const p of c.parts) if (/MCB|MPCB/.test(p.type)) p.state.on = true;
  EL.runSeconds(c, 0.5, { mains: true }); tag(c, 'SB2').state.act = true; EL.runSeconds(c, 0.5, { mains: true }); tag(c, 'SB2').state.act = false;
  EL.runSeconds(c, 4, { mains: true }); const m = tag(c, 'M1');
  ok(near(m.state.amps, EL.motorPlate(m).i400, 0.15), 'running current ' + m.state.amps.toFixed(2) + ' A ~ nameplate ' + EL.motorPlate(m).i400 + ' A');
}
{ // 230/400 V winding: star on 400 V runs normally, delta on 400 V is flagged
  const c = EL.loadTemplate('dol'); const m = tag(c, 'M1'); m.props.volt = '230D'; m.props.conn = 'star';
  let r = EL.diag.analyze(c);
  ok(!codes(r).includes('motor_delta400'), '230/400 V motor in star on 400 V: ok');
  m.props.conn = 'delta'; r = EL.diag.analyze(c);
  ok(codes(r).includes('motor_delta400'), '230/400 V motor in delta on 400 V: error');
}
/* 8. overload relay / MPCB setting against In */
{
  const c = EL.loadTemplate('dol'); const fr = tag(c, 'FR1'), In = EL.motorPlate(tag(c, 'M1')).i400;
  fr.props.set = +(0.85 * In).toFixed(1); let r = EL.diag.analyze(c);
  ok(r.findings.some((f) => f.code === 'ol_low' && /nameplate|below/.test(f.msg[0] + f.fix[0])), 'FR1 at 0.85 In: set too low');
  fr.props.set = +(1.2 * In).toFixed(1); r = EL.diag.analyze(c);
  ok(codes(r).includes('ol_high'), 'FR1 at 1.2 In: set too high');
  fr.props.set = +In.toFixed(1); r = EL.diag.analyze(c);
  ok(!codes(r).includes('ol_high') && !codes(r).includes('ol_low'), 'FR1 at In: fine');
}
{ // star-delta with the relay in one winding branch: judged against In / √3
  const c = EL.loadTemplate('stardelta'); const fr = tag(c, 'FR1'), M = tag(c, 'M1');
  const G = EL.diag.wireUtil.staticNets(c), ds = EL.diag.wireUtil.downstream(c, G, fr, true);
  ok(near(EL.diag.wireUtil.motorAmps(M, ds.motors.map((x) => x[1])), EL.motorPlate(M).i400, 0.01), 'star-delta template: FR1 before the split sees line current');
  ok(near(EL.diag.wireUtil.motorAmps(M, ['U1', 'V1', 'W1']), EL.motorPlate(M).i400 / Math.sqrt(3), 0.01), 'relay in one winding branch sees In / √3');
}
console.log(fail ? fail + ' FAILED' : 'all wire tests passed');
process.exit(fail ? 1 : 0);
