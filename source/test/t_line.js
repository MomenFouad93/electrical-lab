const EL = require('./load.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const LN = EL.line;
const spec = { carton: { L: 120, W: 60, H: 25, g: 40 }, els: [['SRC', { rate: 120, speed: 30 }], ['CONV', { len: 3, speed: 30 }], ['CW', { speed: 45 }], ['SER', { speed: 45 }], ['TE', { speed: 45 }], ['REJ', { speed: 45 }], ['CURVE', { left: true, speed: 45 }], ['BUF', { len: 6, speed: 50 }], ['GAP', { speed: 65 }], ['TURN', { speed: 65 }], ['CONV', { len: 2, speed: 65, chain: 82.5, guide: 65 }], ['CP', { per: 96, maxcpm: 140, need: 'fl' }]] };
const c = EL.newCircuit(); c.line = LN.build(spec);
const r = LN.route(c.line);
ok(r.els.length === 12 && !r.broken, 'route follows all 12 elements (' + r.els.length + ')');
console.log('route length m', (r.total / 1000).toFixed(2));
const iss = LN.checks(c.line); console.log(iss.map((x) => x.lvl + ' ' + x.tag + ' ' + x.msg[0]).join('\n') || 'no issues');
ok(!iss.some((x) => x.lvl === 'bad'), 'example line has no blocking issues');
EL.runSeconds(c, 120, {});
const S = c.line.stats;
console.log('made', S.made, 'good', S.good, 'rej', JSON.stringify(S.rej), 'rate', LN.rate(c.line).toFixed(1), 'transit', LN.transit(c.line).toFixed(1), 's cases', S.cases, 'jam', c.line.jam && c.line.jam.msg[0]);
ok(!c.line.jam, 'no jam');
ok(LN.rate(c.line) > 105 && LN.rate(c.line) < 125, 'output about 120 cartons/min');
ok(LN.transit(c.line) > 10 && LN.transit(c.line) < 20, 'transit time about 14 s');
// slow conveyor before the checkweigher -> two on the pan
const s2 = JSON.parse(JSON.stringify(spec)); s2.els[2][1].speed = 15; s2.els[1][1].speed = 15;
const c2 = EL.newCircuit(); c2.line = LN.build(s2);
ok(LN.checks(c2.line).some((x) => /two cartons on the pan/.test(x.msg[0])), 'check warns: two cartons on the pan');
EL.runSeconds(c2, 60, {}); console.log('slow: rej', JSON.stringify(c2.line.stats.rej));
ok((c2.line.stats.rej.pan || 0) >= 5 && c2.line.jam && /rejects in a row/.test(c2.line.jam.msg[0]), 'false rejects at the checkweigher, line stops after 5 in a row');
// narrow guide -> jam
const s3 = JSON.parse(JSON.stringify(spec)); s3.els[1][1].guide = 121;
const c3 = EL.newCircuit(); c3.line = LN.build(s3); EL.runSeconds(c3, 10, {});
ok(c3.line.jam && /jammed/.test(c3.line.jam.msg[0]), 'narrow guide jams: ' + (c3.line.jam && c3.line.jam.msg[0]));
// tight curve with flat-along cartons
const s4 = JSON.parse(JSON.stringify(spec)); s4.els.splice(1, 0, ['TURN', {}]); s4.els[7][1].ri = 150; s4.els[7][1].guide = 65; s4.els[0][1].rate = 60;
const c4 = EL.newCircuit(); c4.line = LN.build(s4);
ok(LN.checks(c4.line).some((x) => /Curve too tight/.test(x.msg[0])), 'tight curve flagged');
// stop the case packer: buffer fills, cartoner held
const c5 = EL.newCircuit(); c5.line = LN.build(spec); EL.runSeconds(c5, 30, {});
c5.line.els.find((e) => e.type === 'CP').st.stop = true; EL.runSeconds(c5, 60, {});
const buf = c5.line.els.find((e) => e.type === 'BUF');
console.log('buffer fill', buf.st.fill.toFixed(2), 'held', c5.line.held, 'stops', c5.line.stats.stops);
ok(c5.line.held && buf.st.fill >= 0.8, 'buffer high level stops the cartoner');
const c6 = EL.deserialize(EL.serialize(c)); ok(c6.line && c6.line.els.length === 12 && !LN.route(c6.line).broken, 'line survives save/load');
// reject before the last inspection: flagged
const s7 = JSON.parse(JSON.stringify(spec)); const rj = s7.els.splice(5, 1)[0]; s7.els.splice(3, 0, rj);
const c7 = EL.newCircuit(); c7.line = LN.build(s7);
ok(LN.checks(c7.line).some((x) => x.lvl === 'bad' && /No reject station after/.test(x.msg[0])), 'reject before serialization is flagged');
// reject air off: bad carton not confirmed, line stops
const c8 = EL.newCircuit(); c8.line = LN.build(spec); c8.line.carton.g = 44; c8.line.els.find((e) => e.type === 'REJ').props.air = false; EL.runSeconds(c8, 30, {});
ok(c8.line.jam && /not confirmed/.test(c8.line.jam.msg[0]) && !c8.line.stats.escaped, 'reject with no air: not confirmed, line stops, nothing escapes');
// recipe mismatch: wrong weight rejects
const c9 = EL.newCircuit(); c9.line = LN.build(spec); c9.line.carton.g = 90; EL.runSeconds(c9, 20, {});
ok((c9.line.stats.rej.weight || 0) >= 1, 'carton weight not matching the checkweigher recipe is rejected');
// case change pause
const c10 = EL.newCircuit(); c10.line = LN.build(spec); c10.line.els.find((e) => e.type === 'CP').props.per = 10; EL.runSeconds(c10, 40, {});
ok(c10.line.stats.cases >= 2 && !c10.line.jam, 'case packer pauses for each case change and the buffer absorbs it');
console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);

