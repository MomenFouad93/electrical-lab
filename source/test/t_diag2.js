const EL = require('./load.js');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const codes = (r) => r.findings.map((f) => f.code);
const dump = (r) => r.findings.map((f) => f.sev + ':' + f.code + ':' + f.msg[0]).join('\n      ');
const mut = (tpl, fn) => { const c = EL.loadTemplate(tpl); fn(c); return EL.diag.analyze(c); };
const part = (c, t) => c.parts.find((p) => p.tag === t);
const rmWire = (c, a, b) => { const i = c.wires.findIndex((w) => (w.a.endsWith(a) && w.b.endsWith(b)) || (w.b.endsWith(a) && w.a.endsWith(b))); if (i < 0) throw new Error('wire not found ' + a + b); c.wires.splice(i, 1); };
const tagRef = (c, ref) => { const [t, pin] = ref.split('.'); return part(c, t).id + '.' + pin; };
const rmW = (c, a, b) => { const A = tagRef(c, a), B = tagRef(c, b); const i = c.wires.findIndex((w) => (w.a === A && w.b === B) || (w.a === B && w.b === A)); if (i < 0) throw new Error('wire not found ' + a + ' ' + b); c.wires.splice(i, 1); };

/* 1. DOL: remove the seal-in wire -> no_seal */
let r = mut('dol', (c) => rmW(c, 'SB2.4', 'KM1.14'));
console.log('  remove SB2.4-KM1.14:\n      ' + dump(r));
ok(r.verdict === 'fail' || r.verdict === 'warn', 'dol without wire 14 not ok');
/* 2. DOL: remove coil return */
r = mut('dol', (c) => rmW(c, 'KM1.A2', 'G1.N'));
console.log('  remove coil return:\n      ' + dump(r));
ok(codes(r).includes('unwired_pin') || codes(r).includes('never'), 'coil return missing detected');
ok(r.marks.some((m) => m.sym === 'x' || m.sym === 'q'), 'marks produced');
/* 3. DOL: motor wire V1 missing */
r = mut('dol', (c) => rmW(c, 'FR1.4', 'M1.V1'));
console.log('  motor V1 missing:\n      ' + dump(r));
ok(codes(r).includes('unwired_pin'), 'motor open phase pin');
/* 4. DOL: undersized FR setting */
r = mut('dol', (c) => { part(c, 'FR1').props.set = 1.0; });
console.log('  FR set 1.0:\n      ' + dump(r));
ok(codes(r).includes('ol_low') || codes(r).includes('trip'), 'ol_low or trip');
/* 5. DOL: remove PE */
r = mut('dol', (c) => rmW(c, 'G1.PE', 'M1.PE'));
console.log('  no PE:\n      ' + dump(r));
ok(codes(r).includes('no_pe'), 'no_pe');
/* 6. DOL: lamp 24V on 230 */
r = mut('dol', (c) => { part(c, 'HL1').props.volt = '24VDC'; });
console.log('  lamp 24VDC on 230:\n      ' + dump(r));
ok(codes(r).includes('overvolt') || codes(r).includes('burn'), 'overvolt or burn');
/* 7. DOL: stop NC in wrong branch (bypassed) */
r = mut('dol', (c) => { const f = c.wires.find((w) => true); });
/* 8. basic: LED w/o resistor */
{
  const c = EL.build({ name: 'led', parts: [['B', 'BATT', 0, 0, { volt: 9 }], ['D', 'LEDX', 200, 0, { col: 'red' }]], wires: [['B.pos', 'D.A'], ['D.K', 'B.neg']] });
  r = EL.diag.analyze(c); console.log('  led no R:\n      ' + dump(r));
  ok(codes(r).includes('burn'), 'LED without resistor flagged');
  const c2 = EL.build({ name: 'led', parts: [['B', 'BATT', 0, 0, { volt: 9 }], ['R', 'RES', 100, 0, { r: 470 }], ['D', 'LEDX', 200, 0, { col: 'red' }]], wires: [['B.pos', 'R.A'], ['R.B', 'D.K'], ['D.A', 'B.neg']] });
  r = EL.diag.analyze(c2); console.log('  led reversed:\n      ' + dump(r));
  ok(codes(r).includes('reversed') || codes(r).includes('never'), 'reversed LED flagged');
  const c3 = EL.build({ name: 'led', parts: [['B', 'BATT', 0, 0, { volt: 9 }], ['R', 'RES', 100, 0, { r: 470 }], ['D', 'LEDX', 200, 0, { col: 'red' }]], wires: [['B.pos', 'R.A'], ['R.B', 'D.A'], ['D.K', 'B.neg']] });
  r = EL.diag.analyze(c3); console.log('  led good:\n      ' + dump(r));
  ok(r.verdict === 'ok', 'good LED circuit ok');
}
/* 9. cable undersized */
{
  const c = EL.build({ name: 'cab', parts: [['G', 'SRC1', 0, 0], ['F', 'MCB1', 0, 100, { rating: 32 }], ['W', 'CAB3', 100, 0, { sec: 1.5, len: 20 }], ['H', 'HTR', 300, 0, { w: 3000 }]], wires: [['G.L', 'F.1'], ['F.2', 'W.a1'], ['W.b1', 'H.A'], ['G.N', 'W.a2'], ['W.b2', 'H.B'], ['G.PE', 'W.a3'], ['W.b3', 'H.PE']] });
  try { r = EL.diag.analyze(c); console.log('  cable:\n      ' + dump(r)); } catch (e) { console.log('cable test err', e.message); }
}
/* 10. PLC circuit */
{
  const c = EL.build({
    name: 'plc', parts: [['G', 'DC24', 0, 0, { volt: 24 }], ['PLC', 'PLC24', 200, 0], ['S1', 'PB_NO', 0, 200], ['S2', 'PB_NC', 80, 200], ['H1', 'LAMP', 400, 300, { volt: '24VDC' }]],
    wires: [['G.pos', 'PLC.LP'], ['G.neg', 'PLC.M'], ['G.pos', 'S1.3'], ['S1.4', 'PLC.I0'], ['G.pos', 'S2.1'], ['S2.2', 'PLC.I1'], ['PLC.Q0', 'H1.X1'], ['H1.X2', 'G.neg']],
  });
  r = EL.diag.analyze(c); console.log('  plc:\n      ' + dump(r) + '\n      table: ' + r.table.map((t) => t.tag + '=' + t.status).join(' '));
  rmW(c, 'H1.X2', 'G.neg');
  r = EL.diag.analyze(c); console.log('  plc lamp return removed:\n      ' + dump(r));
  ok(codes(r).includes('unwired_pin') || codes(r).includes('never'), 'plc lamp return missing');
}
/* 11. safety relay */
{
  const c = EL.build({
    name: 'safe', parts: [['G', 'DC24', 0, 0, { volt: 24 }], ['K', 'SAFE', 200, 0, { reset: 'manual' }], ['ES', 'ESTOP2', 0, 200], ['ST', 'PB_NO', 80, 200]],
    wires: [['G.pos', 'K.A1'], ['G.neg', 'K.A2'], ['K.S11', 'ES.11'], ['ES.12', 'K.S12'], ['K.S21', 'ES.21'], ['ES.22', 'K.S22'], ['K.S33', 'ST.3'], ['ST.4', 'K.S34']],
  });
  r = EL.diag.analyze(c); console.log('  safety:\n      ' + dump(r) + '\n      table: ' + r.table.map((t) => t.tag + '=' + t.status).join(' '));
}
/* 12. hidden fault -> blind symptom */
{
  const c = EL.loadTemplate('dol');
  const f = part(c, 'KM1'); f.fault = 'open_coil'; f.hid = true;
  r = EL.diag.analyze(c); console.log('  hidden coil fault:\n      ' + dump(r) + '\n      table: ' + r.table.map((t) => t.tag + '=' + t.status).join(' '));
  ok(r.blind && codes(r).includes('symptom'), 'hidden fault produces symptom');
  ok(!JSON.stringify(r.findings).includes('coil_open'), 'hidden fault is not revealed');
}
console.log(fail ? fail + ' FAILED' : 'ALL OK');
process.exit(fail ? 1 : 0);
