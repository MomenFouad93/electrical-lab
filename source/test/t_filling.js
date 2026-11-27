/* Ready project 'filling': IBC -> tank -> hopper -> bottle filler + capper on an S7CPU ladder program.
   Runs the whole line in Auto and checks the sequence, the counters and the protections. */
const EL = require('./load.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const c = EL.projects.load('filling');
const P = (t) => c.parts.find((p) => p.tag === t), U = (t) => EL.plant.byTag(c.plant, t);
const on = (t, v) => { P(t).state.on = v; };
const act = (t, v) => { P(t).state.act = v; };
const run = (s, cb) => { for (let t = 0; t < s; t += 0.05) { EL.tick(c, 0.05, { mains: true }); if (cb) cb(); } };
ok(!!c && P('KF1').type === 'S7CPU' && P('KF1').props.mode === 'ladder', 'project loads with the S7CPU in ladder mode');
const iss = EL.ladder.check(EL.ladder.progOf(P('KF1')), P('KF1'), c);
ok(!iss.some((x) => x.lvl === 'bad'), 'ladder check has no errors: ' + iss.map((x) => x.lvl + ':' + (x.msg ? x.msg[0] : '')).join(' | '));
for (const t of ['QS1', 'Q1', 'Q2', 'F1']) on(t, true);
act('S0', true); // Auto (selector held in position)
run(1);
ok(P('KF1').state.sup && P('KF1').state.run, 'PLC powered and in RUN');
act('S3', true); run(0.5); act('S3', false); run(0.5); // safety relay manual reset
ok(P('KM0').state.closed, 'safety reset S3 pulls in KM0');
act('S1', true); run(0.5); act('S1', false);
let pumpRan = false, convRan = false, filled = false, capped = false, maxJam = 0;
run(150, () => { const cv = U('CV1').state; if (P('KM1').state.closed) pumpRan = true; if (Math.abs(P('M2').state.w || 0) > 0.3) convRan = true; if (P('YV2').state.pos > 0.5) filled = true; if (cv.ext > 0.9) capped = true; maxJam = Math.max(maxJam, cv.jam || 0); });
const cv = U('CV1').state;
ok(pumpRan, 'transfer pump ran to fill the hopper');
ok(convRan && filled && capped, 'conveyor ran, the filler opened and the capper went down');
ok(maxJam === 0, 'never jammed (the belt never moved with the cylinder down)');
ok(cv.ok >= 3, 'good bottles out: ' + cv.ok + ', bad ' + cv.bad + ', spill ' + (cv.spill || 0).toFixed(2) + ' L');
ok((cv.spill || 0) < 0.1 * Math.max(1, (P('KF1').state.ct || {}).C1 ? P('KF1').state.ct.C1.cv : 1), 'small overflow: under 0.1 L per bottle');
ok(P('H1').state.b > 0.5, 'running lamp on');
const C1 = (P('KF1').state.ct || {}).C1; ok(C1 && C1.cv >= cv.ok, 'PLC counter C1 counts capped bottles: ' + (C1 && C1.cv));
// dry run: empty the tank and check the pump stops and H3 lights
U('T1').state.v = U('T1').props.vol * 0.05; U('CHM').props.stock = 0.0001;
run(8);
ok(!P('KM1').state.closed, 'dry-run protection: pump off with the tank below LSL1');
ok(P('H3').state.b > 0.5, 'tank low lamp on');
// E-stop latches a fault and stops the line
act('SB0', true); run(1);
ok(!P('KM2').state.closed && P('H2').state.b > 0.5, 'E-stop stops the conveyor and lights the fault lamp');
console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
