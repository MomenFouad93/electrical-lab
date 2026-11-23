const EL = require('./load.js');
const W = EL.water, PL = EL.plant;
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const load = () => EL.projects.load('stilmas');
const by = (c, t) => PL.byTag(c.plant, t);
const probs = (c) => PL.problems(c).filter((x) => x[0] !== 'info');
const has = (c, tag, re) => probs(c).some((x) => x[1].includes(tag) && re.test(x[2][0]));
const lh = (q) => q * 3600;

// 1. normal production matches the drawings: 1400 L/h soft water in, about 1000 L/h PW out
let c = load(); EL.runSeconds(c, 300, {});
ok(!probs(c).length, 'runs with no problems: ' + probs(c).map((x) => x[1] + ' ' + x[2][0]).join(' | '));
const pw = lh(by(c, 'FT50-14B').state.q), drain = lh(by(c, 'FT50-11A').state.q);
ok(pw > 900 && pw < 1100, 'PW production about 1000 L/h (' + Math.round(pw) + ')');
ok(pw + drain > 1250 && pw + drain < 1550, 'soft water use about 1400 L/h (' + Math.round(pw + drain) + ')');
ok(by(c, 'BRO-28').state.pin > 10 && by(c, 'BRO-28').state.pin < 17, 'BRO 28 feed pressure 10-17 bar (' + by(c, 'BRO-28').state.pin.toFixed(1) + ')');
ok(lh(by(c, 'FCV50-67A').state.q) > 50 && lh(by(c, 'FT50-14A').state.q) > 1000, 'concentrate recycle to the break tank flows (' + Math.round(lh(by(c, 'FCV50-67A').state.q)) + ' L/h)');
ok(by(c, 'XV50-27A/B').state.div === 0 && W.spec(by(c, 'AE50-17B').state.wq, by(c, 'AE50-17B').state.T, 'PW').every((x) => x.ok), 'RO pass 2 product meets PW and goes to the tank');
const eta = W.tankETA(by(c, 'TK-PW')); ok(eta && eta.fill && eta.full > 9000 && eta.full < 13000, '3 m³ PW tank fills in about 3 h at 1000 L/h (' + W.fmtT(eta.full) + ')');
// 2. HMI off stops production
by(c, 'CB2').props.prod = false; EL.runSeconds(c, 20, {});
ok(Math.abs(by(c, 'FT50-14B').state.q) < 1e-4 && by(c, 'P50A').state.s === 0, 'Production OFF stops the RO pumps');
by(c, 'CB2').props.dist = false; EL.runSeconds(c, 10, {});
ok(by(c, 'P-PW1').state.s === 0, 'Loop OFF stops the PW loop pump');
// 3. points of use empty the tank; level control restarts production
c = load(); by(c, 'TK-PW').state.v = 2100; for (const t of ['POU1', 'POU2', 'POU3']) by(c, t).props.open = true; EL.runSeconds(c, 120, {});
const e2 = W.tankETA(by(c, 'TK-PW')); ok(by(c, 'POU1').state.q > 0.1 && e2 && !e2.fill, 'open POUs empty the PW tank (empties in ' + (e2 ? W.fmtT(e2.s) : '-') + ')');
ok(by(c, 'P50A').state.s > 0.5, 'tank below 65 %: production runs');
// 4. SMBS off: chlorine reaches BRO 28
c = load(); by(c, 'PD67-25').props.on = false; EL.runSeconds(c, 120, {});
ok(has(c, 'BRO-28', /Chlorine reaches the membrane/), 'SMBS off: chlorine at BRO 28 is flagged');
// 5. degasser and NaOH off: conductivity rises
c = load(); EL.runSeconds(c, 120, {}); const g = W.condRaw(by(c, 'AE50-17B').state.wq, 25);
by(c, 'MD50').props.on = false; by(c, 'PD67-10').props.on = false; EL.runSeconds(c, 60, {});
const b2 = W.condRaw(by(c, 'AE50-17B').state.wq, 25); ok(b2 > g * 1.5, 'degasser and NaOH off: PW conductivity rises ' + g.toFixed(2) + ' -> ' + b2.toFixed(2));
// 6. hot sanitisation: heat, hold, cool down; no hot water to the PW tank
c = load(); EL.runSeconds(c, 60, {}); const v0 = by(c, 'TK-PW').state.v;
by(c, 'CB2').props.sanit = true; EL.runSeconds(c, 600, {});
ok(by(c, 'XV50-12A').props.open === false && by(c, 'XV50-13A').props.open === true && by(c, 'XV50-27A/B').state.div === 1, 'sanitisation: XV50-12A to drain closed, XV50-13A recycle open, product returns to TK50A');
ok(by(c, 'TK50A').state.T > 25 && by(c, 'TK-PW').state.T < 30 && by(c, 'TK-PW').state.v <= v0 + 1, 'break tank heats (' + by(c, 'TK50A').state.T.toFixed(0) + ' °C), PW tank stays cold');
ok(!probs(c).some((x) => /45 °C|Recovery too high/.test(x[2][0])), 'hot-water sanitisable membranes: no false alarms');
let tH = 0; while (by(c, 'CB2').props.sanit && tH < 3 * 3600) { EL.runSeconds(c, 300, {}); tH += 300; }
ok(by(c, 'CB2').props.sanit === false && by(c, 'CB2').state.done === 1 && by(c, 'XV50-12A').props.open === true && by(c, 'XV50-13A').props.open === false, 'sanitisation ends after heat-up and the 30 min hold (' + Math.round((600 + tH) / 60) + ' min), valves back');
let tC = 0; while (by(c, 'XV50-27A/B').state.div && tC < 4 * 3600) { EL.runSeconds(c, 300, {}); tC += 300; }
ok(by(c, 'XV50-27A/B').state.div === 0 && tC >= 900, 'cool-down on 12 kW chilled water takes ' + Math.round(tC / 60) + ' min, then PW goes to the tank again');
// 7. save / load
const c2 = EL.deserialize(EL.serialize(load()));
ok(by(c2, 'CB2') && by(c2, 'P50A').props.grp === 'prod' && by(c2, 'BRO-28').props.hot === true && by(c2, 'XV50-27A/B').props.tmax === 40 && by(c2, 'E50').props.kwh === 18, 'station survives save/load');
console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
