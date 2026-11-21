const EL = require('./load.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const P = (c, t) => c.parts.find((p) => p.tag === t), U = (c, t) => EL.plant.byTag(c.plant, t);
for (const id of EL.projects.list) { const c = EL.projects.load(id); EL.runSeconds(c, 1, { mains: true }); ok(EL.projects.map[id].line ? c.line && c.line.els.length > 5 : EL.projects.map[id].circuit ? c.parts.length && c.plant.units.length : c.plant.units.length > 20, id + ' loads, problems: ' + EL.plant.problems(c).filter((x) => x[0] !== 'info').map((x) => x[1] + ':' + x[2][0]).join(' | ')); const plc = c.parts.find((p) => /PLC/.test(p.type)); if (plc) { const iss = EL.ladder.check(EL.ladder.progOf(plc), plc, c); ok(!iss.some((x) => x.lvl === 'bad'), id + ' ladder check: ' + iss.map((x) => x.lvl + ' N' + (x.ni + 1) + ' ' + x.msg[0]).join(' | ')); } }
// tank project
{
  const c = EL.projects.load('tank');
  const kf = P(c, 'KF1');
  EL.runSeconds(c, 1, { mains: true });
  ok(kf.state.sup, 'PLC powered');
  console.log('i', kf.state.i.join(''), 'ai', kf.state.ai[0].toFixed(2), 'MW10', kf.state.mw[10], 'lvl', U(c, 'T1').state.lvl.toFixed(1));
  ok(Math.abs(kf.state.mw[10] - U(c, 'T1').state.lvl) < 2, 'MW10 follows the tank level');
  ok(!kf.state.q[0], 'pump off before start');
  P(c, 'S1').state.act = true; EL.runSeconds(c, 0.4, { mains: true }); P(c, 'S1').state.act = false;
  EL.runSeconds(c, 1.5, { mains: true });
  ok(kf.state.q[0] && kf.state.q[1] && !kf.state.q[2], 'KM1 + star');
  ok(P(c, 'KM1').state.closed && P(c, 'KM2').state.closed && !P(c, 'KM3').state.closed, 'contactors line + star closed');
  const starA = P(c, 'M1').state.amps;
  EL.runSeconds(c, 10, { mains: true });
  ok(kf.state.q[0] && !kf.state.q[1] && kf.state.q[2], 'delta after 10 s');
  ok(P(c, 'KM3').state.closed && !P(c, 'KM2').state.closed, 'delta contactor closed, star open');
  console.log('motor w', P(c, 'M1').state.w.toFixed(2), 'amps star/delta', starA && starA.toFixed(2), P(c, 'M1').state.amps.toFixed(2), 'pump q', (U(c, 'P1').state.q * 60).toFixed(1), 'L/min');
  ok(U(c, 'P1').state.q * 60 > 40, 'pump flows');
  let t = 0; while (kf.state.q[0] && t < 600) { EL.runSeconds(c, 5, { mains: true }); t += 5; }
  console.log('stopped after', t, 's, lvl', U(c, 'T1').state.lvl.toFixed(1), 'MW10', kf.state.mw[10]);
  ok(!kf.state.q[0] && U(c, 'T1').state.lvl >= 88 && U(c, 'T1').state.lvl < 96, 'stops at 90 %');
  t = 0; while (!kf.state.q[0] && t < 2000) { EL.runSeconds(c, 5, { mains: true }); t += 5; }
  console.log('restarted after', t, 's, lvl', U(c, 'T1').state.lvl.toFixed(1));
  ok(kf.state.q[0] && U(c, 'T1').state.lvl <= 21, 'restarts automatically at 20 %');
  // why: stop the auto with S2; ask why Q0.0 is off
  P(c, 'S2').state.act = true; EL.runSeconds(c, 0.5, { mains: true });
  const why = EL.ladder.why(kf, 2, c);
  console.log('WHY N3:', why.map((x) => x.msg[0]).join(' || '));
  ok(why.some((x) => /M0.0/.test(x.msg[0])), 'diagnosis points at M0.0 (Automatic)');
  const why2 = EL.ladder.why(kf, 1, c);
  console.log('WHY N2:', why2.map((x) => x.msg[0]).join(' || '));
  ok(why2.some((x) => /S2/.test(x.msg[0])), 'diagnosis points at S2 wiring');
  P(c, 'S2').state.act = false;
  // break the stop wire: check the program warns
  const c2 = EL.projects.load('tank'); const k2 = P(c2, 'KF1');
  c2.wires = c2.wires.filter((w) => !(w.a === k2.id + '.I1' || w.b === k2.id + '.I1'));
  const iss = EL.ladder.check(EL.ladder.progOf(k2), k2, c2);
  ok(iss.some((x) => /I0.1/.test(x.msg[0]) && /wired/.test(x.msg[0])), 'check warns: I0.1 not wired');
}
// tank fail-safe
for (const [name, brk] of [['dead transmitter', (c) => { P(c, 'B1').fault = 'dead'; }], ['broken LSHH wire', (c) => { const k = P(c, 'SL1'); c.wires = c.wires.filter((w) => w.a !== k.id + '.12' && w.b !== k.id + '.12'); }], ['KM1 coil open', (c) => { P(c, 'KM1').fault = 'open_coil'; }]]) {
  const c = EL.projects.load('tank'), kf = P(c, 'KF1');
  EL.runSeconds(c, 1, { mains: true }); P(c, 'S1').state.act = true; EL.runSeconds(c, 0.4, { mains: true }); P(c, 'S1').state.act = false; EL.runSeconds(c, 12, { mains: true });
  ok(kf.state.q[0], name + ': running before the fault');
  brk(c); EL.runSeconds(c, 6, { mains: true });
  ok(!kf.state.q[0] && kf.state.q[3], name + ': pump stopped and alarm on (q ' + kf.state.q.join('') + ')');
}
// RO project
{
  const c = EL.projects.load('ro'); const kf = P(c, 'KF1');
  EL.runSeconds(c, 1, { mains: true });
  P(c, 'S1').state.act = true; EL.runSeconds(c, 0.4, { mains: true }); P(c, 'S1').state.act = false;
  EL.runSeconds(c, 8, { mains: true });
  const ro = U(c, 'RO1');
  console.log('RO: Q0', kf.state.q[0], 'i', kf.state.i.join(''), 'pin', ro.state.pin.toFixed(2), 'perm', (ro.state.qp * 60).toFixed(2), 'rej', (ro.state.qr * 60).toFixed(2), 'rec', ro.state.rec.toFixed(1), 'Tf', ro.state.Tf.toFixed(1), 'suction', U(c, 'PS1').state.p.toFixed(2));
  ok(kf.state.q[0] && ro.state.qp * 60 > 2, 'RO running and producing');
  ok(ro.state.Tf > 18, 'feed warmed');
  U(c, 'V1').props.open = false; EL.runSeconds(c, 6, { mains: true });
  console.log('after closing V1: suction', U(c, 'PS1').state.p.toFixed(2), 'i', kf.state.i.join(''), 'q', kf.state.q.join(''), 'pump cav', U(c, 'P1').state.cav);
  ok(!kf.state.q[0] && kf.state.q[1], 'LP trip: pump off, fault lamp on');
  U(c, 'V1').props.open = true; EL.runSeconds(c, 2, { mains: true });
  ok(!kf.state.q[0], 'stays tripped until reset');
  P(c, 'S1').state.act = true; EL.runSeconds(c, 0.4, { mains: true }); P(c, 'S1').state.act = false; EL.runSeconds(c, 3, { mains: true });
  ok(kf.state.q[0] && !kf.state.q[1], 'reset by Start');
}
// booster
{
  const c = EL.projects.load('booster');
  P(c, 'SA1').state.act = true; EL.runSeconds(c, 8, { mains: true });
  const p1 = U(c, 'P1');
  console.log('booster: f', P(c, 'U1').state.f, 'w', P(c, 'M1').state.w.toFixed(2), 'q', (p1.state.q * 60).toFixed(1), 'p', U(c, 'PT1').state.p.toFixed(2), 'B1 V', P(c, 'B1').state.vout && P(c, 'B1').state.vout.toFixed(2), 'amps', P(c, 'M1').state.amps.toFixed(2));
  ok(p1.state.q * 60 > 20 && U(c, 'PT1').state.p > 0.5, 'booster gives flow and pressure');
  ok(Math.abs(P(c, 'B1').state.vout - 10 * U(c, 'PT1').state.p / 6) < 0.3, 'B1 output matches pressure');
  const a1 = P(c, 'M1').state.amps; U(c, 'V1').props.open = false; EL.runSeconds(c, 4, { mains: true });
  console.log('closed valve: q', (p1.state.q * 60).toFixed(1), 'p', U(c, 'PT1').state.p.toFixed(2), 'amps', P(c, 'M1').state.amps.toFixed(2));
  ok(P(c, 'M1').state.amps < a1, 'current drops on closed discharge');
}
console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
