/* Bottle filling and capping conveyor (plant unit BOTTLE) + 3-wire PNP level switches on a tank. */
const EL = require('./load.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const PL = EL.plant, G = PL.bottleGeo;
const c = EL.build({ name: 'bottle', parts: [
  ['G1', 'SRC3', 0, 0], ['QF1', 'MCB3', 0, 150, { rating: 16 }], ['M1', 'MOT3', 0, 300, { kw: 0.75, conn: 'delta' }],
  ['G2', 'DC24', 300, 0], ['QF2', 'MCB1', 300, 150, { rating: 6 }], ['YV1', 'SOL', 300, 300], ['QF3', 'MCB1', 450, 150, { rating: 6 }], ['YV2', 'SOL', 450, 300],
  ['B1', 'PROX', 600, 0], ['B2', 'PHOTO', 700, 0], ['SQ1', 'LIM', 800, 0], ['SQ2', 'LIM', 900, 0], ['B5', 'PROX', 1000, 0], ['B6', 'PROX', 1100, 0]],
wires: [['G1.L1', 'QF1.1'], ['G1.L2', 'QF1.3'], ['G1.L3', 'QF1.5'], ['QF1.2', 'M1.U1'], ['QF1.4', 'M1.V1'], ['QF1.6', 'M1.W1'],
  ['G2.pos', 'QF2.1'], ['QF2.2', 'YV1.pos'], ['YV1.neg', 'G2.neg'], ['G2.pos', 'QF3.1'], ['QF3.2', 'YV2.pos'], ['YV2.neg', 'G2.neg'],
  ['G2.pos', 'B1.BN'], ['B1.BU', 'G2.neg'], ['G2.pos', 'B5.BN'], ['B5.BU', 'G2.neg']] });
c.plant = PL.build({ units: [['S1', 'SUPPLY', 0, 0, { bar: 0.4 }], ['YV1', 'SOLV', 150, 0, { sol: 'YV1' }], ['CV1', 'BOTTLE', 300, 0, { motor: 'M1', s1: 'B1', s2: 'B2', cyl: 'YV2', rup: 'SQ1', rdn: 'SQ2', bvol: 0.5, rate: 30, speed: 12 }],
  ['T1', 'TANK', 0, 400, { vol: 100, lvl0: 50, style: 'cone', sw: [{ n: 'HL', l: 80, t: 'B5', k: 'pnp' }, { n: 'LL', l: 20, t: 'B6', k: 'pnp' }] }]],
pipes: [['S1.out', 'YV1.a'], ['YV1.b', 'CV1.fill']] });
const P = (t) => c.parts.find((p) => p.tag === t), cv = PL.byTag(c.plant, 'CV1'), st = cv.state;
const sw = (t, on) => { P(t).state.on = on; if (!on) P(t).state.closed = false; };
const run = (s) => EL.runSeconds(c, s, { mains: true });
const near = (x0) => st.b.find((b) => Math.abs(b.x - x0) < G.sTol);

// 1. nothing moves without the motor
run(3);
ok(st.b.length >= 1, 'infeed puts a bottle on the belt: ' + st.b.length);
const x0 = st.b.map((b) => b.x).join(',');
run(2);
ok(st.b.map((b) => b.x).join(',') === x0 && st.v === 0, 'bottles stay put while the motor is off');
ok(st.b.length <= Math.floor(G.L / G.pitch) && st.b.every((b, i) => !i || st.b[i - 1].x - b.x >= G.pitch - 1e-9), 'bottles keep the minimum gap');
// 2. motor on: bottles move, S1 sees a bottle at the filler
sw('QF1', true);
let s1seen = false, t = 0;
for (; t < 20 && !s1seen; t += 0.05) { EL.tick(c, 0.05, { mains: true }); if (st.s1) s1seen = true; }
ok(st.v > 0.1 && P('M1').state.w > 0.5, 'motor runs the belt: ' + st.v.toFixed(3) + ' m/s');
ok(s1seen && P('B1').state.target === true, 'S1 operates the linked PROX when a bottle is under the nozzle');
// stop at S1 (as a PLC would), check it stays
sw('QF1', false); run(1);
ok(st.v === 0 && near(G.xf), 'belt stops with a bottle under the filler (brake motor)');
ok(P('B1').state.active === true, 'powered PNP sensor output is on');
const bf = near(G.xf);
// 3. filling only with the valve open
run(2);
ok(bf.f === 0, 'no filling with the valve closed');
sw('QF2', true);
let n = 0; while (bf.f < 0.5 && n++ < 400) EL.tick(c, 0.05, { mains: true });
ok(PL.byTag(c.plant, 'YV1').state.en === 1, 'SOLV knows its coil is energised');
ok(bf.f >= 0.5 - 1e-9 && st.fq > 0, 'bottle fills through the open valve: ' + bf.f.toFixed(3) + ' L');
const sp0 = st.spill;
run(1);
ok(st.spill > sp0 && st.ovf, 'overfill spills: ' + st.spill.toFixed(3) + ' L');
sw('QF2', false); run(1);
ok(st.fq < 1e-6, 'valve closed: no more flow');
// 4. spill without a bottle: move the bottle away, open the valve
sw('QF1', true); run(1.2); sw('QF1', false); run(0.3);
ok(!st.b.find((b) => Math.abs(b.x - G.xf) < G.fTol), 'no bottle under the nozzle');
const sp1 = st.spill; sw('QF2', true); run(1); sw('QF2', false); run(0.5);
ok(st.spill > sp1 + 0.05, 'liquid spills on the floor without a bottle: +' + (st.spill - sp1).toFixed(3) + ' L');
// 5. bring the filled bottle to the capper (S2), cap it
sw('QF1', true);
let s2seen = false; for (t = 0; t < 20 && !s2seen; t += 0.05) { EL.tick(c, 0.05, { mains: true }); if (st.s2 && near(G.xc) === bf) s2seen = true; }
sw('QF1', false); run(0.5);
ok(s2seen && P('B2').state.target === true, 'S2 sees the bottle under the capper');
ok(P('SQ1').state.act === true && P('SQ2').state.act === false, 'reed switches: cylinder up');
sw('QF3', true); run(0.3);
ok(st.ext > 0.2 && st.ext < 0.9, 'cylinder is on its way down: ' + st.ext.toFixed(2));
run(0.6);
ok(st.ext === 1 && P('SQ2').state.act === true && P('SQ1').state.act === false, 'cylinder down, lower reed on');
ok(bf.cap === 1, 'bottle capped');
// 6. jam: run the belt with the cylinder down
sw('QF1', true); run(1);
ok(st.jam === 1 && st.v === 0, 'belt moving with the cylinder down jams the line');
ok(PL.problems(c).some((x) => x[1] === 'CV1' && /jammed/.test(x[2][0])), 'jam reported in the process check');
const xj = bf.x; run(1);
ok(bf.x === xj, 'jammed belt does not move');
sw('QF1', false); sw('QF3', false); run(1);
ok(st.ext === 0, 'cylinder back up');
PL.bottleReset(cv);
ok(st.jam === 0, 'reset clears the jam');
// 7. counters at the outfeed
sw('QF1', true); run(14);
ok(st.ok >= 1, 'good bottle counted: ' + st.ok);
ok(st.bad >= 1, 'unfilled / uncapped bottles counted bad: ' + st.bad);
sw('QF1', false); run(0.5);
// 8. PNP level switches on the tank drive 3-wire sensors
const T1 = PL.byTag(c.plant, 'T1');
ok(P('B6').state.target === true && P('B5').state.target === false, 'tank at 50 %: LL sensor sees liquid, HL does not');
ok(P('B6').state.active === false, 'unpowered PNP sensor gives no output');
T1.state.v = 90; run(0.2);
ok(P('B5').state.target === true && P('B5').state.active === true, 'tank at 90 %: HL powered PNP output on');
// 9. SUPPLY as an IBC with a finite stock
const c4 = EL.build({ name: 'ibc', parts: [['G1', 'SRC3', 0, 0]], wires: [] });
c4.plant = PL.build({ units: [['CHM', 'SUPPLY', 0, 0, { style: 'ibc', stock: 3, bar: 0.2 }], ['D1', 'DRAIN', 200, 0]], pipes: [['CHM.out', 'D1.in']] });
const ibc = PL.byTag(c4.plant, 'CHM'), dr = PL.byTag(c4.plant, 'D1');
EL.runSeconds(c4, 0.5, { mains: true });
ok(ibc.state.q > 0 && ibc.state.left < 3, 'IBC delivers and its stock goes down: ' + ibc.state.left.toFixed(2) + ' L');
EL.runSeconds(c4, 30, { mains: true });
ok(ibc.state.left === 0 && Math.abs(ibc.state.q) < 1e-6 && Math.abs(dr.state.tot - 3) < 0.05, 'empty IBC stops the flow after 3 L: drained ' + dr.state.tot.toFixed(2));
ok(PL.problems(c4).some((x) => x[1] === 'CHM' && /empty/.test(x[2][0])), 'empty source reported');
// 10. save / load keeps props, style and switch kinds; hostile values cleaned
const c2 = EL.deserialize(EL.serialize(c)), cv2 = PL.byTag(c2.plant, 'CV1'), t2 = PL.byTag(c2.plant, 'T1');
ok(cv2 && cv2.props.cyl === 'YV2' && cv2.props.rdn === 'SQ2' && Array.isArray(cv2.state.b) && cv2.state.ok === st.ok, 'BOTTLE survives save/load');
ok(t2.props.style === 'cone' && t2.props.sw[0].k === 'pnp' && t2.props.sw[0].t === 'B5', 'tank style and pnp switch survive save/load');
const evil = JSON.parse(EL.serialize(c)); const eu = evil.plant.units.find((u) => u.tag === 'T1'); eu.props.style = '<x>'; eu.props.sw[0].k = 'evil';
const c3 = EL.deserialize(JSON.stringify(evil)), t3 = PL.byTag(c3.plant, 'T1');
ok(t3.props.style === 'open' && !t3.props.sw[0].k, 'unknown style / switch kind fall back');
console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
