const EL = require('./load.js');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const part = (c, tag) => c.parts.find((p) => p.tag === tag);
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* 1. LED with resistor, LED without resistor */
{
  const c = EL.build({ name: 'led', parts: [['B', 'BATT', 0, 0, { volt: 9 }], ['R', 'RES', 100, 0, { r: 470 }], ['D', 'LEDX', 200, 0, { col: 'red' }]], wires: [['B.pos', 'R.A'], ['R.B', 'D.A'], ['D.K', 'B.neg']] });
  EL.runSeconds(c, 1, {});
  const d = part(c, 'D');
  ok(near(d.state.amps, (9 - 0.3 * 0 - 1.9 - 0) / (470 + 4 + 1.2), 0.004), 'LED current ' + (d.state.amps * 1000).toFixed(1) + ' mA');
  ok(d.state.b > 0.8, 'LED bright');
  const c2 = EL.build({ name: 'led2', parts: [['B', 'BATT', 0, 0, { volt: 9 }], ['D', 'LEDX', 200, 0, { col: 'red' }]], wires: [['B.pos', 'D.A'], ['D.K', 'B.neg']] });
  EL.runSeconds(c2, 1, {});
  ok(part(c2, 'D').state.burnt, 'LED without resistor burns');
  // reversed
  const c3 = EL.build({ name: 'led3', parts: [['B', 'BATT', 0, 0, { volt: 9 }], ['R', 'RES', 100, 0, { r: 470 }], ['D', 'LEDX', 200, 0, { col: 'red' }]], wires: [['B.pos', 'R.A'], ['R.B', 'D.K'], ['D.A', 'B.neg']] });
  EL.runSeconds(c3, 1, {});
  ok(part(c3, 'D').state.b === 0 && !part(c3, 'D').state.burnt, 'reversed LED dark, not burnt');
}
/* 2. NPN switch */
for (const model of ['small']) {
  const mkc = (baseOn) => EL.build({
    name: 'npn', parts: [['B', 'BATT', 0, 0, { volt: 9 }], ['Rb', 'RES', 100, 0, { r: 10000 }], ['Q', 'NPN', 200, 0, { model }], ['Rc', 'RES', 300, 0, { r: 470 }], ['D', 'LEDX', 400, 0, { col: 'green' }]],
    wires: [['B.pos', 'Rc.A'], ['Rc.B', 'D.A'], ['D.K', 'Q.C'], ['Q.E', 'B.neg']].concat(baseOn ? [['B.pos', 'Rb.A'], ['Rb.B', 'Q.B']] : [['Rb.B', 'Q.B'], ['Rb.A', 'B.neg']]),
  });
  const c = mkc(true); EL.runSeconds(c, 2, {});
  const d = part(c, 'D'), q = part(c, 'Q');
  ok(d.state.amps > 0.011 && d.state.b > 0.8, 'NPN on: LED ' + (d.state.amps * 1000).toFixed(1) + ' mA, Vce ' + q.state.vce.toFixed(2) + ' V, rce ' + q.state.rce.toFixed(1));
  const c0 = mkc(false); EL.runSeconds(c0, 2, {});
  ok(part(c0, 'D').state.b < 0.01, 'NPN off: LED dark');
  // base directly to 9 V burns
  const cb = EL.build({ name: 'npnb', parts: [['B', 'BATT', 0, 0, { volt: 9 }], ['Q', 'NPN', 200, 0, {}], ['Rc', 'RES', 300, 0, { r: 470 }]], wires: [['B.pos', 'Rc.A'], ['Rc.B', 'Q.C'], ['Q.E', 'B.neg'], ['B.pos', 'Q.B']] });
  EL.runSeconds(cb, 2, {});
  ok(part(cb, 'Q').state.burnt, 'NPN with base straight to 9 V burns');
}
/* 3. N-MOSFET gate drive */
{
  const mkc = (g) => EL.build({ name: 'fet', parts: [['B', 'BATT', 0, 0, { volt: 9 }], ['Q', 'NMOS', 200, 0, {}], ['Rc', 'RES', 300, 0, { r: 100 }], ['T', 'TOG', 50, 100]], wires: [['B.pos', 'Rc.A'], ['Rc.B', 'Q.D'], ['Q.S', 'B.neg'], ['B.pos', 'T.A'], ['T.B', 'Q.G']] });
  const c = mkc(); part(c, 'T').state.on = true; EL.runSeconds(c, 2, {});
  const q = part(c, 'Q');
  ok(q.state.id > 0.08 && q.state.vds < 0.5, 'MOSFET on: Id ' + q.state.id.toFixed(3) + ' A, Vds ' + q.state.vds.toFixed(3));
  part(c, 'T').state.on = false; EL.runSeconds(c, 2, {});
  ok(q.state.id < 0.001, 'MOSFET off with floating gate pulled by 100 Mohm? Id ' + q.state.id.toExponential(1));
}
/* 4. zener shunt regulator */
{
  const c = EL.build({ name: 'z', parts: [['B', 'BATT', 0, 0, { volt: 12 }], ['R', 'RES', 100, 0, { r: 470 }], ['Z', 'ZENR', 200, 0, { vz: 5.1 }]], wires: [['B.pos', 'R.A'], ['R.B', 'Z.K'], ['Z.A', 'B.neg']] });
  EL.runSeconds(c, 1, {});
  const z = part(c, 'Z');
  ok(near(-z.state.v, 0, 99) && near(EL.eRead(c.sim || EL.simulate(c, {}), z.id, 'z').vdc, 5.1, 0.35), 'zener holds about 5.1 V');
}
/* 5. optocoupler */
{
  const c = EL.build({ name: 'opto', parts: [['B', 'BATT', 0, 0, { volt: 9 }], ['R1', 'RES', 100, 0, { r: 1000 }], ['U', 'OPTO', 200, 0, {}], ['R2', 'RES', 300, 0, { r: 1000 }]], wires: [['B.pos', 'R1.A'], ['R1.B', 'U.A'], ['U.K', 'B.neg'], ['B.pos', 'R2.A'], ['R2.B', 'U.C'], ['U.E', 'B.neg']] });
  EL.runSeconds(c, 2, {});
  const u = part(c, 'U');
  ok(u.state.on && u.state.ic > 0.005, 'opto output conducts ' + (u.state.ic * 1000).toFixed(1) + ' mA');
}
/* 6. IC supply, relay */
{
  const c = EL.build({ name: 'ic', parts: [['B', 'BATT', 0, 0, { volt: 6 }], ['U', 'IC8', 100, 0, {}]], wires: [['B.pos', 'U.p8'], ['B.neg', 'U.p4']] });
  EL.runSeconds(c, 1, {});
  ok(part(c, 'U').state.pw, 'IC powered');
  const c2 = EL.build({ name: 'rl', parts: [['B', 'BATT', 0, 0, { volt: 12 }], ['K', 'RELAY5', 100, 0, { v: 12 }], ['T', 'TOG', 0, 100], ['B2', 'BATT', 0, 200, { volt: 9 }], ['R', 'RES', 100, 200, { r: 1000 }]], wires: [['B.pos', 'T.A'], ['T.B', 'K.A'], ['K.B', 'B.neg'], ['B2.pos', 'K.COM'], ['K.NO', 'R.A'], ['R.B', 'B2.neg']] });
  EL.runSeconds(c2, 1, {});
  const k = part(c2, 'K'); ok(!k.state.on, 'relay off');
  part(c2, 'T').state.on = true; EL.runSeconds(c2, 1, {});
  ok(k.state.on, 'relay on');
}
/* 7. rectifier from a transformer */
{
  const c = EL.build({ name: 'br', parts: [['G', 'SRC1', 0, 0], ['TR', 'TRAFO', 100, 0, { pri: 230, sec: 12 }], ['BR', 'BRIDGE', 250, 0, { cap: 2200 }], ['R', 'RES', 400, 0, { r: 100 }]], wires: [['G.L', 'TR.P1'], ['G.N', 'TR.P2'], ['TR.S1', 'BR.AC1'], ['TR.S2', 'BR.AC2'], ['BR.POS', 'R.A'], ['R.B', 'BR.NEG']] });
  EL.runSeconds(c, 3, {});
  const br = part(c, 'BR');
  ok(br.state.vout > 12 && br.state.vout < 17, 'rectified output ' + br.state.vout.toFixed(1) + ' V (12 V AC with cap)');
}
console.log(fail ? fail + ' FAILED' : 'ALL OK');
process.exit(fail ? 1 : 0);
