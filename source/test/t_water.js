const EL = require('./load.js');
const W = EL.water, PL = EL.plant;
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const load = () => EL.projects.load('water');
const by = (c, t) => PL.byTag(c.plant, t);
const probs = (c) => PL.problems(c).filter((x) => x[0] !== 'info');
const has = (c, tag, re) => probs(c).some((x) => x[1].includes(tag) && re.test(x[2][0]));
const spec = (c, t) => { const u = by(c, t); return W.spec(u.state.wq, u.type === 'QA' ? u.state.T : PL.tempAt(c.plant, u.id + '.in'), u.props.grade); };

// 1. normal run
let c = load(); EL.runSeconds(c, 200, {});
ok(!probs(c).length, 'demo plant runs with no problems: ' + probs(c).map((x) => x[1] + ' ' + x[2][0]).join(' | '));
const ro1 = by(c, 'RO1').state, ro2 = by(c, 'RO2').state, edi = by(c, 'EDI1').state;
ok(ro1.pin > 9 && ro1.pin < 15, 'RO1 feed pressure about 11-13 bar (' + ro1.pin.toFixed(1) + ')');
ok(ro1.rec > 65 && ro1.rec < 80, 'RO1 recovery about 75 % (' + Math.round(ro1.rec) + ')');
ok(edi.qp * 3.6 > 1.6 && edi.qp * 3.6 < 2.6, 'PW generation about 2 m3/h (' + (edi.qp * 3.6).toFixed(2) + ')');
ok(spec(c, 'AIT1').every((x) => x.ok) && W.condRaw(by(c, 'AIT1').state.wq, 25) < 1, 'EDI product meets PW spec, below 1 µS/cm');
ok(spec(c, 'AIT2').every((x) => x.ok), 'PW loop meets USP PW');
ok(spec(c, 'AIT3').every((x) => x.ok), 'WFI loop meets WFI spec');
ok(by(c, 'RO1').state.wf[2] < 0.05 && by(c, 'RO1').state.wf[1] < 1, 'RO feed: chlorine and hardness removed');
const loop = c.plant.pipes.find((p) => p.loop && p.dn === 40), pi = W.pipeInfo(loop, c.plant._Q[loop.id], 22);
ok(pi.v > 1 && pi.v < 2.5 && pi.Re > 10000, 'PW loop velocity ' + pi.v.toFixed(2) + ' m/s, Re ' + Math.round(pi.Re));
const eta = W.tankETA(by(c, 'T2'));
ok(eta && eta.fill && eta.s > 60, 'PW tank fill time shown: ' + W.fmtT(eta.s));

// 2. carbon filter replaced by sand: chlorine reaches RO1
c = load(); by(c, 'F2').props.kind = 'sand'; EL.runSeconds(c, 60, {});
ok(has(c, 'RO1', /Chlorine reaches the membrane/), 'chlorine at RO1 is flagged');
EL.runSeconds(c, 400, {}); ok(has(c, 'RO1', /damaged by chlorine/), 'chlorine damages RO1 over time (training speed)');

// 3. NaOH off: CO2 passes, EDI product worse; EDI off: divert to drain
c = load(); EL.runSeconds(c, 60, {}); const good = W.condRaw(by(c, 'AIT1').state.wq, 25);
by(c, 'DP2').props.on = false; EL.runSeconds(c, 60, {});
const worse = W.condRaw(by(c, 'AIT1').state.wq, 25); ok(worse > good * 1.3, 'NaOH off: EDI product conductivity rises ' + good.toFixed(3) + ' -> ' + worse.toFixed(3));
by(c, 'EDI1').props.on = false; EL.runSeconds(c, 20, {});
ok(by(c, 'XV1').state.div === 1 && Math.abs(by(c, 'D3').state.q) > 0.1, 'EDI off: divert valve sends water to drain');
ok(has(c, 'XV1', /Diverting to drain/), 'divert is reported');

// 4. loop too big; dead leg
c = load(); for (const p of c.plant.pipes) if (p.loop && p.dn === 40) p.dn = 65; EL.runSeconds(c, 30, {});
ok(probs(c).some((x) => /Loop velocity/.test(x[2][0])), 'DN65 loop: low velocity flagged');
c = load(); const br = c.plant.pipes.find((p) => p.b === by(c, 'POU2').id + '.in'); br.len = 0.5; EL.runSeconds(c, 10, {});
ok(probs(c).some((x) => /Dead leg/.test(x[2][0])), 'long POU branch: dead leg flagged');

// 5. points of use draw water: tank falls; WFI without jacket cools and fails
c = load(); EL.runSeconds(c, 20, {}); const l0 = by(c, 'T2').state.lvl;
by(c, 'POU1').props.open = true; by(c, 'POU2').props.open = true; EL.runSeconds(c, 120, {});
ok(by(c, 'POU1').state.q > 0.1 && by(c, 'T2').state.lvl < l0, 'open POUs draw water, PW tank level falls ' + l0.toFixed(1) + ' -> ' + by(c, 'T2').state.lvl.toFixed(1));
c = load(); by(c, 'T3').props.jkt = 0; by(c, 'WS1').props.steam = false; EL.runSeconds(c, 900, {});
ok(by(c, 'T3').state.T < 70 && has(c, 'AIT3', /below 70/), 'WFI without the steam jacket falls below 70 °C and fails (' + by(c, 'T3').state.T.toFixed(1) + ' °C)');

// 6. softener exhausts; save / load keeps pipe sizes
c = load(); by(c, 'SF1').props.cap = 0.01; EL.runSeconds(c, 60, {});
ok(has(c, 'SF1', /Resin exhausted/) && by(c, 'RO1').state.wf[1] > 20, 'exhausted softener: hardness reaches RO1');
const c2 = EL.deserialize(EL.serialize(load()));
ok(c2.plant.pipes.filter((p) => p.loop && p.dn === 40).length === 7 && c2.plant.pipes.some((p) => p.len === 0.03), 'pipe sizes survive save/load');
// 7. tank sizes: 600 L fills faster than 2000 L at the same flow
c = load(); by(c, 'T2').props.vol = 600; by(c, 'T2').state.v = 300; EL.runSeconds(c, 200, {}); const e6 = W.tankETA(by(c, 'T2'));
ok(e6 && e6.full < eta.full, '600 L tank fills faster than 2000 L (' + W.fmtT(e6.full) + ' vs ' + W.fmtT(eta.full) + ')');
console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
