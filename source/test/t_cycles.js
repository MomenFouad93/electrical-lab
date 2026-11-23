// Station cycles on the Stilmas project (drain, start-up from empty, flushes, hot sanitisations). Slow: about 2 min.
const EL = require('./load.js');
const W = EL.water, PL = EL.plant;
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const load = () => { const c = EL.projects.load('stilmas'); EL.runSeconds(c, 300, {}, 0.5); return c; };
const by = (c, t) => PL.byTag(c.plant, t);
const bad = (c) => PL.problems(c).filter((x) => x[0] === 'bad');
function run(c, id, maxH) {
  const u = by(c, 'CB2'); ok(W.cycStart(c, u, id), id + ' starts');
  let t = 0; while (u.state.cyN && t < (maxH || 10) * 3600) { EL.tick(c, 1, {}); t++; }
  ok(!u.state.cyN && u.state.cyDone && !u.state.cyAb, id + ' completes in ' + (t / 60).toFixed(1) + ' min');
  return { u, t, st: u.state };
}
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// the station still runs as before
let c = load();
ok(near(by(c, 'FT50-14B').state.q * 3600, 950, 0.08), 'PW production about 950 L/h: ' + Math.round(by(c, 'FT50-14B').state.q * 3600));
ok(!bad(c).length, 'no problems in normal production');
const u0 = by(c, 'CB2');
ok(W.CYC.filter((k) => W.cycAvail(c, u0, k)).length === 9, 'all 9 cycles available on the Stilmas station');

// drain the whole station: Torricelli estimate within 35 % of the simulated time
let r = run(c, 'drain', 2);
ok(['TK-Z1', 'TK50A', 'TK-PW'].every((t) => by(c, t).state.lvl < 2), 'all tanks below 2 %');
ok(near(r.st.cs3, r.st.ce3, 0.35), 'drain time ' + (r.st.cs3 / 60).toFixed(1) + ' min vs estimate ' + (r.st.ce3 / 60).toFixed(1));
ok(!by(c, 'XV-RW').props.open && !by(c, 'XV-PWD').props.open && !c.plant.units.find((k) => k.type === 'VALVE' && /D$|DR$/.test(k.tag) && k.props.open), 'drains closed, city inlet left closed');
ok(!by(c, 'CB2').props.prod && !by(c, 'CB2').props.dist, 'station left stopped');
ok(r.st.cyDr > 2500, 'drained litres counted: ' + Math.round(r.st.cyDr));
EL.runSeconds(c, 300, {}, 1);
ok(by(c, 'TK-Z1').state.lvl < 2, 'raw tank does not refill while the inlet is closed');

// start-up from empty: tanks fill, divert rinses first, PW tank reaches 90 %, inlet reopened
r = run(c, 'fill', 6);
ok(by(c, 'TK-PW').state.lvl >= 89, 'PW tank full: ' + by(c, 'TK-PW').state.lvl.toFixed(1) + ' %');
ok(by(c, 'XV-RW').props.open, 'city inlet open again');
ok(r.st.cs3 >= 100, 'RO start-up rinse to the break tank for at least 2 min: ' + Math.round(r.st.cs3) + ' s');
ok(near(r.st.cs6, r.st.ce6, 0.15), 'PW tank fill ' + (r.st.cs6 / 60).toFixed(0) + ' min vs estimate ' + (r.st.ce6 / 60).toFixed(0));
ok(r.st.cs4 < r.st.cs6 / 3, 'loop started at the minimum level, long before the tank is full');
const aw = by(c, 'AE-PW').state.wq; ok(aw && W.condRaw(aw, 20) < 1.1, 'loop water in spec after the start-up: ' + (aw ? W.condRaw(aw, 20).toFixed(2) : '-') + ' µS/cm');
ok(!bad(c).length, 'no problems after the start-up: ' + bad(c).map((x) => x[1] + ' ' + x[2][0]).join(' | '));

// RO fast flush: low pressure, product back to the break tank, settings restored
c = load();
let u = by(c, 'CB2'); W.cycStart(c, u, 'flushro');
for (let t = 0; t < 120; t++) EL.tick(c, 1, {});
ok(Math.abs(by(c, 'P50B').state.s) > 0.2 && !by(c, 'P50B').state.cav, 'pass 2 flushed too, no cavitation');
ok(u.state.cyI === 1 && by(c, 'BRO-28').state.pin < 8, 'fast flush: BRO-28 feed at low pressure ' + by(c, 'BRO-28').state.pin.toFixed(1) + ' bar');
ok(by(c, 'XV50-27A/B').state.div === 1, 'product diverted during the flush');
ok(!PL.problems(c).some((x) => x[0] !== 'info' && /Recovery below/.test(x[2][0])), 'no low-recovery warning during the flush');
while (u.state.cyN) EL.tick(c, 1, {});
ok(by(c, 'P50A').props.spd === 100 && by(c, 'FCV50-11A').props.kv === 0.5 && by(c, 'P50B').props.spd === 100, 'pump speeds and reject valve restored');

// stop a cycle half way: everything goes back
c = load(); u = by(c, 'CB2'); W.cycStart(c, u, 'flushloop');
for (let t = 0; t < 60; t++) EL.tick(c, 1, {});
ok(by(c, 'POU1').props.open, 'loop flush opens POU1');
W.cycStop(c, u);
ok(!by(c, 'POU1').props.open && u.state.cyAb === 1 && !u.state.cyN, 'stop closes POU1 and reports "stopped"');

// hot sanitisation of the RO: valves, temperature limits, PW tank stays cold
c = load(); u = by(c, 'CB2'); W.cycStart(c, u, 'sanro');
let maxRO = 0, maxPW = 0, sawValves = false;
let maxP = 0;
for (let t = 0; t < 4 * 3600 && u.state.cyN; t++) { EL.tick(c, 1, {}); if (u.state.cyI >= 1 && u.state.cyI <= 3) maxP = Math.max(maxP, by(c, 'BRO-28').state.pin || 0); maxRO = Math.max(maxRO, by(c, 'BRO-28').state.Tf || 0); maxPW = Math.max(maxPW, by(c, 'TK-PW').state.T); if (u.state.cyI === 2 && !by(c, 'XV50-12A').props.open && by(c, 'XV50-13A').props.open) sawValves = true; }
ok(!u.state.cyN && !u.state.cyAb, 'RO sanitisation completes in ' + (u.state.cyT / 60).toFixed(0) + ' min');
ok(sawValves, 'drain XV50-12A closed and recycle XV50-13A open during the hold');
ok(maxP <= 4, 'hot membranes kept at low pressure: max ' + maxP.toFixed(1) + ' bar');
ok(by(c, 'P50A').props.spd === 100 && by(c, 'PD67-25').props.on && by(c, 'MD50').props.on, 'pump speed, dosing and degasser restored');
ok(maxRO <= 88, 'RO feed never above 88 °C: ' + maxRO.toFixed(1));
ok(maxPW < 30, 'PW tank never warmed: ' + maxPW.toFixed(1) + ' °C');
ok(near(u.state.cs1, u.state.ce1, 0.25), 'heat-up ' + (u.state.cs1 / 60).toFixed(0) + ' min vs estimate ' + (u.state.ce1 / 60).toFixed(0));
ok(u.state.cyKh > 10, 'steam energy counted: ' + u.state.cyKh.toFixed(1) + ' kWh');

// hot sanitisation of the PW tank and loop: production stops, tank held at 80 °C, bacteria killed, cooled back
c = load(); u = by(c, 'CB2'); by(c, 'TK-PW').state.wq[5] = 50; W.cycStart(c, u, 'sanloop');
let prodRan = false, maxT = 0, minBact = 1e9, pouHot = 0;
for (let t = 0; t < 8 * 3600 && u.state.cyN; t++) { EL.tick(c, 1, {}); if (u.state.cyI === 2 && by(c, 'POU2').props.open) pouHot++; if (u.state.cyI >= 1 && u.state.cyI <= 3 && Math.abs(by(c, 'P50A').state.s || 0) > 0.1) prodRan = true; maxT = Math.max(maxT, by(c, 'TK-PW').state.T); if (u.state.cyI === 3) minBact = Math.min(minBact, by(c, 'TK-PW').state.wq[5]); }
ok(!u.state.cyN && !u.state.cyAb, 'loop sanitisation completes in ' + (u.state.cyT / 3600).toFixed(1) + ' h');
ok(!prodRan, 'production stopped during the loop sanitisation');
ok(pouHot >= 25 && pouHot <= 35, 'each point of use opened about 30 s during the hold: POU2 ' + pouHot + ' s');
ok(by(c, 'UV-PW').props.on && !by(c, 'POU1').props.open, 'UV back on, points of use closed');
ok(maxT >= 80 && maxT < 90, 'PW tank held at 80-90 °C: max ' + maxT.toFixed(1));
ok(minBact < 1, 'bacteria in the PW tank killed: ' + minBact.toExponential(1) + ' CFU/mL');
ok(by(c, 'TK-PW').state.T < 31 && by(c, 'CB2').props.prod, 'cooled below 30 °C and production back on');

console.log(fail ? fail + ' FAILED' : 'ALL OK');
process.exit(fail ? 1 : 0);
