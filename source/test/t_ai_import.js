/* Draw from a picture / PDF (src/ai_import.js): catalog size, parsing of messy answers, validation, building.
   No real AI calls: the answers are canned. */
const fs = require('fs');
const EL = require('./load.js');
require('../src/mech.js');
for (const f of fs.readdirSync(__dirname + '/../src').filter((f) => /^mech_.*\.js$/.test(f)).sort()) require('../src/' + f);
require('../src/ai_import.js');
const A = EL.aiImport;
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };

/* ---- catalog and prompt ---- */
for (const k of A.KINDS) { const n = A.size(k); ok(n > 1500 && n < 25000 * 3, k + ' prompt ' + n + ' chars (~' + Math.round(n / 3.5) + ' tokens, limit ~25k tokens)'); }
const pc = A.panelCatalog();
ok(/^CONT3 \|.*pins: 1 3 5 A1/m.test(pc), 'panel catalog lists CONT3 with its pins');
ok(/^MOT3 \|.*pins: U1 V1 W1 PE/m.test(pc), 'function pins (MOT3) come from EL.pinsOf');
ok(!/^PCB_/m.test(pc) && !/^NOTE /m.test(pc), 'PCB / board-only parts and notes are left out');
ok(/coil=24VDC\/24VAC/.test(pc), 'sel props list allowed values');
ok(/^TANK \|.*ports: inA inB out1 out2.*lt=<panel tag>/m.test(A.plantCatalog()), 'plant catalog: TANK ports and link props');
ok(A.mechCatalog().split('\n').length === EL.mech.lib.length && EL.mech.lib.length > 20, 'mech catalog lists every 3D item (' + EL.mech.lib.length + ')');
const pr = A.prompt('panel', { lang: 'Answer in Egyptian Arabic.', note: 'only the <b>motor</b> starter', page: 'page 12' });
ok(/Egyptian Arabic/.test(pr.text) && /page 12/.test(pr.text) && /motor/.test(pr.text) && !/<b>/.test(pr.text), 'prompt carries language, page hint, note (markup stripped)');
const msg = A.messages('plant', [{ kind: 'image', data: 'AAAA' }, { kind: 'pdf', data: 'BBBB' }], {});
ok(msg.messages[0].content[0].type === 'image' && msg.messages[0].content[1].type === 'document' && msg.messages[0].content[1].source.media_type === 'application/pdf' && msg.messages[0].content[2].type === 'text', 'messages: image block, PDF document block, then the text');

/* ---- parsing ---- */
const J = { parts: [['G1', 'SRC3', 40, 20]], wires: [] };
const s = JSON.stringify(J);
ok(A.extractJSON(s).parts.length === 1, 'plain JSON');
ok(A.extractJSON('Here it is:\n```json\n' + s + '\n```\nHope it helps {not json}').parts[0][0] === 'G1', 'fenced JSON with prose around');
ok(A.extractJSON('Sure! ' + s.replace(']]', '],]') + ' done').parts.length === 1, 'trailing comma fixed');
ok(A.extractJSON('{“parts”: [[“G1”, “SRC3”, 40, 20]], “wires”: []}').parts[0][1] === 'SRC3', 'smart quotes fixed');
const cut = '{"parts":[["G1","SRC3",40,20],["QF1","MCB3",40,150,{"rating":16}],["KM1","CONT3",40,3';
const r1 = A.extractJSON(cut); ok(r1.parts.length === 2 && r1.parts[1][0] === 'QF1', 'answer cut off at the length limit: complete items kept');
ok(A.extractJSON('{"notes":["a } inside a string"],"parts":[]}').notes[0] === 'a } inside a string', 'braces inside strings');
let threw = false; try { A.extractJSON('I cannot read this picture.'); } catch (e) { threw = e.code === 'json'; } ok(threw, 'no JSON -> error code json');

/* ---- validation ---- */
const bad = A.check('panel', {
  parts: [['G1', 'SRC3', 40, 20], ['KM1', 'CONT3', 40, 320, { coil: '230vac', bogus: 1 }], ['KM1', 'CONT3', 100, 320], ['X9', 'FLUXCAP', 0, 0], ['<i>H9', 'LAMP', 900, 900], ['M1', 'MOT3', 30, 800, { kw: '1.5', ins: 1e9 }], ['QF1', 'mcb3', 40, 150, { rating: 17 }]],
  wires: [['G1.L1', 'QF1.1'], ['QF1.2', 'KM1.1'], ['KM1.2', 'M1.U1'], ['KM1.A9', 'G1.N'], ['X9.1', 'G1.N'], ['G1.L1', 'QF1.1'], ['QF1.1', 'G1.L1'], ['G1.PE', 'M1.pe']],
  notes: ['<script>x</script> read from page 1'], unsure: 'wire 3 colour',
});
const tags = bad.spec.parts.map((p) => p[0]);
ok(tags.includes('KM1') && tags.includes('KM1_2'), 'duplicate tag renamed: ' + tags.join(','));
ok(bad.rep.renamed.some((x) => /KM1_2/.test(x)), 'rename reported');
ok(!tags.includes('X9') && bad.rep.dropped.some((x) => /FLUXCAP/.test(x)), 'unknown type dropped and listed');
ok(tags.includes('iH9'), 'markup stripped from tag');
ok(bad.spec.parts.find((p) => p[1] === 'CONT3')[4].coil === '230VAC' && !('bogus' in bad.spec.parts.find((p) => p[1] === 'CONT3')[4]), 'sel value matched case-insensitively, unknown prop dropped');
ok(bad.spec.parts.find((p) => p[1] === 'MOT3')[4].ins === 10000 && bad.spec.parts.find((p) => p[1] === 'MOT3')[4].kw === 1.5, 'numbers clamped / coerced to the option value');
ok(!('rating' in bad.spec.parts.find((p) => p[0] === 'QF1')[4]) && bad.rep.dropped.some((x) => /rating=17/.test(x)), 'value not in the list dropped');
ok(bad.spec.wires.length === 4, 'bad pin, unknown part and duplicate wires dropped (' + bad.spec.wires.length + ' kept)');
ok(bad.rep.dropped.some((x) => /no pin A9/.test(x)), 'bad pin listed');
ok(bad.spec.wires.some((w) => w[1] === 'M1.PE'), 'pin id matched case-insensitively (pe -> PE)');
ok(!/[<>]/.test(bad.rep.notes[0]) && bad.rep.unsure.length === 1, 'notes escaped, unsure as a list');
ok(bad.rep.moved >= 1, 'overlapping KM1/KM1_2 or missing places moved: ' + bad.rep.moved);
// overlap check after layout
const over = (spec, defOf) => { const b = spec.map((p) => ({ x: p[2], y: p[3], w: defOf(p[1]).w, h: defOf(p[1]).h })); for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) { const a = b[i], c = b[j]; if (a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h) return true; } return false; };
const lay = A.check('panel', { parts: [['G1', 'SRC3'], ['QF1', 'MCB3'], ['KM1', 'CONT3', 0, 0], ['KM2', 'CONT3', 10, 10], ['FR1', 'OL'], ['M1', 'MOT3'], ['S1', 'PB_NO'], ['S2', 'PB_NC'], ['H1', 'LAMP'], ['KF1', 'S7CPU']], wires: [] });
ok(lay.spec.parts.every((p) => isFinite(p[2]) && isFinite(p[3])) && !over(lay.spec.parts, (t) => EL.defs[t]), 'auto-layout: every part placed, no overlaps');

/* ---- build a DOL circuit from a canned answer ---- */
const DOL = '```json\n' + JSON.stringify({
  parts: [['G1', 'SRC3', 40, 20], ['QF1', 'MCB3', 40, 150, { rating: 16, curve: 'C' }], ['KM1', 'CONT3', 40, 320, { coil: '230VAC' }], ['FR1', 'OL', 40, 590, { set: 3.5 }], ['M1', 'MOT3', 30, 800, { kw: 1.5, conn: 'delta' }],
    ['FU1', 'FUSE', 400, 150, { rating: 2 }], ['SB1', 'PB_NC', 340, 280], ['SB2', 'PB_NO', 430, 280], ['HL1', 'LAMP', 520, 420, { volt: '230VAC', color: 'green' }]],
  wires: [['G1.L1', 'QF1.1'], ['G1.L2', 'QF1.3'], ['G1.L3', 'QF1.5'], ['QF1.2', 'KM1.1'], ['QF1.4', 'KM1.3'], ['QF1.6', 'KM1.5'], ['KM1.2', 'FR1.1'], ['KM1.4', 'FR1.3'], ['KM1.6', 'FR1.5'],
    ['FR1.2', 'M1.U1'], ['FR1.4', 'M1.V1'], ['FR1.6', 'M1.W1'], ['G1.PE', 'M1.PE'], ['QF1.2', 'FU1.1'], ['FU1.2', 'SB1.1'], ['SB1.2', 'SB2.3'], ['SB1.2', 'KM1.13'], ['SB2.4', 'KM1.14'], ['SB2.4', 'FR1.95'], ['FR1.96', 'KM1.A1'], ['KM1.A2', 'G1.N'],
    ['FU1.2', 'KM1.23'], ['KM1.24', 'HL1.X1'], ['HL1.X2', 'G1.N']],
  notes: ['Control voltage 230 V AC from L1'], unsure: [],
}) + '\n```';
const rd = A.check('panel', A.extractJSON(DOL));
ok(rd.rep.dropped.length === 0 && rd.rep.moved === 0, 'DOL: nothing dropped, nothing moved');
const c = A.build(rd, 'DOL from a picture');
ok(c.parts.length === 9 && c.wires.length === 24, 'DOL builds: ' + c.parts.length + ' parts, ' + c.wires.length + ' wires');
const P = (t) => c.parts.find((p) => p.tag === t);
P('QF1').state.on = true;
EL.runSeconds(c, 0.3, { mains: true });
P('SB2').state.act = true; EL.runSeconds(c, 0.3, { mains: true }); P('SB2').state.act = false; EL.runSeconds(c, 2, { mains: true });
ok(P('KM1').state.closed && Math.abs(P('M1').state.w || 0) > 0.3, 'DOL from the canned answer runs: KM1 seals in, motor turns');

/* ---- tank -> pump plant ---- */
const PLANT = 'The P&ID shows: ' + JSON.stringify({
  units: [['S1', 'SUPPLY', 0, 300], ['T1', 'TANK', 200, 80, { vol: 500, lt: 'B1', sw: [{ n: 'LSL1', l: 15, t: 'SL1' }] }], ['P1', 'PUMP', 460, 300, { motor: 'M1', head: 20 }], ['V1', 'VALVE', 700, 300, { open: 'true', vt: 'dia' }], ['D1', 'DRAIN', 900, 300], ['Q1', 'NOPE', 1, 1]],
  pipes: [['S1.out', 'T1.inA', { dn: 25, mat: 'ss', len: 5 }], ['T1.out1', 'P1.in'], ['P1.out', 'V1.a', { dn: 33 }], ['V1.b', 'D1.in'], ['V1.b', 'D1.inlet'], ['T1.out1', 'V1.a']],
  parts: [['M1', 'MOT3', 40, 20], ['B1', 'TXV', 300, 20]], wires: [],
});
const rp = A.check('plant', A.extractJSON(PLANT));
ok(rp.spec.units.length === 5 && rp.rep.dropped.some((x) => /NOPE/.test(x)), 'plant: unknown unit dropped');
ok(rp.spec.pipes.length === 4, 'plant: bad port and a second pipe on a used port dropped (' + rp.spec.pipes.length + ' kept)');
ok(rp.rep.dropped.some((x) => /already used/.test(x)) && rp.rep.dropped.some((x) => /no port inlet/.test(x)), 'pipe problems listed');
ok(rp.spec.pipes[2].length === 2, 'bad DN option ignored');
ok(rp.rep.links.some((x) => /SL1/.test(x)) && !rp.rep.links.some((x) => /M1|B1/.test(x)), 'missing link target SL1 reported, M1/B1 found');
const cp = A.build(rp);
ok(cp.plant.units.length === 5 && cp.plant.pipes.length === 4 && cp.parts.length === 2, 'plant builds with its 2 panel parts');
ok(EL.plant.byTag(cp.plant, 'V1').props.open === true && EL.plant.byTag(cp.plant, 'T1').props.lt === 'B1', 'props kept after hardening');
EL.runSeconds(cp, 1, { mains: true });
ok(true, 'plant steps without error');
const lay2 = A.check('plant', { units: [['S1', 'SUPPLY'], ['T1', 'TANK'], ['P1', 'PUMP'], ['V1', 'VALVE', 5, 5], ['V2', 'VALVE', 5, 5]], pipes: [] });
ok(!over(lay2.spec.units, (t) => EL.plant.defs[t]), 'plant auto-layout: no overlaps');

/* ---- mechanical ---- */
const id0 = EL.mech.lib[0].id, n1 = EL.mech.lib[1].name[0];
const rm = A.check('mech', A.extractJSON(JSON.stringify({ title: 'Pump <i>end</i>', summary: 'A pump.', how_it_works: 'It turns.', parts: [{ name: '1 - casing', qty: '2', material: 'SS316', function: 'holds', lib: id0 }, { name: '2 - thing', qty: 1, lib: 'not_an_id' }, { name: '3 - ' + n1, lib: n1 }, { qty: 3 }, 'x'], assembly_order: ['a', 'b'], checks: ['c'] })));
ok(rm.mech.parts.length === 3 && rm.mech.parts[0].lib === id0 && rm.mech.parts[0].qty === 2, 'mech: valid lib id kept, qty coerced, empty parts dropped');
ok(rm.mech.parts[1].lib === null && rm.rep.dropped.some((x) => /not_an_id/.test(x)), 'mech: unknown id -> null, reported');
ok(rm.mech.parts[2].lib === EL.mech.lib[1].id, 'mech: name given instead of id is matched');
ok(!/[<>]/.test(rm.mech.title) && rm.mech.assembly_order.length === 2 && rm.counts.matched === 2, 'mech: text escaped, lists kept, matched count');

console.log(fail ? fail + ' FAILED' : 'all ok');
process.exit(fail ? 1 : 0);
