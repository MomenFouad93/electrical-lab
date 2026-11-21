const EL = require('./load.js');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const part = (c, t) => c.parts.find((p) => p.tag === t);
function drive(tpl, mutate, expectCls, opts) {
  opts = opts || {};
  const c = EL.loadTemplate(tpl); mutate(c);
  const sym = EL.ts.autoSymptoms(c);
  const t0 = Date.now();
  const s = EL.ts.begin(c, { reality: c, symptoms: sym });
  EL.ts.work(s, 1e9);
  const tb = Date.now() - t0;
  const log = [];
  let steps = 0, top;
  for (; steps < 14; steps++) {
    const n = EL.ts.next(s); const gs = EL.ts.groups(s, n.ranked); top = n.ranked[0];
    if (gs[0].p >= 0.8 || !n.best) break;
    const cd = n.best.cd; const r = EL.ts.readReality(s, cd);
    const d = EL.ts.describe(s, cd);
    log.push(d.title[0] + ' -> ' + r.out + (r.value != null ? ' (' + r.value.toFixed(1) + ')' : ''));
    EL.ts.answer(s, cd, r.out, r.value);
  }
  const n = EL.ts.next(s); top = n.ranked[0]; const gs = EL.ts.groups(s, n.ranked);
  console.log('  ' + tpl + ' | symptoms ' + JSON.stringify(Object.keys(sym).map((id) => part(c, EL.partById(c, id).tag).tag + '=' + sym[id])) + ' | hyps ' + s.hyps.length + ' build ' + tb + 'ms | steps ' + steps);
  log.forEach((l) => console.log('     ' + l));
  console.log('   -> ' + gs[0].label[0] + ' ' + (gs[0].p * 100).toFixed(0) + '%  (2nd: ' + (gs[1] ? gs[1].label[0] + ' ' + (gs[1].p * 100).toFixed(0) + '%' : '-') + ')');
  top.group = gs[0];
  return { s, top, steps, n };
}
/* 1. DOL: coil open */
let r = drive('dol', (c) => { part(c, 'KM1').fault = 'open_coil'; part(c, 'KM1').hid = true; }, 'CONT3:open_coil');
ok(r.top.group.hs.some((h) => h.cls === 'CONT3:open_coil') && r.top.group.p > 0.6, 'coil open found');
/* 2. DOL: loose stop wire */
r = drive('dol', (c) => { const w = c.wires.find((x) => x.a.endsWith('SB1.2') || x.b.endsWith('SB1.2')); const p = part(c, 'SB1'); const ww = c.wires.find((x) => x.a === p.id + '.2' || x.b === p.id + '.2'); ww.cut = true; ww.hidden = true; }, 'wire');
ok(r.top.group.hs.some((h) => h.kind === 'wire' && h.label[0].includes('SB1:2')), 'right wire found: ' + r.top.group.label[0]);
/* 3. DOL: fuse blown */
r = drive('dol', (c) => { part(c, 'FU1').fault = 'blown'; part(c, 'FU1').hid = true; }, 'FUSE:blown');
ok(r.top.group.hs.some((h) => h.cls === 'FUSE:blown'), 'fuse found');
/* 4. DOL: OL aux contact bad */
r = drive('dol', (c) => { part(c, 'FR1').fault = 'bad95'; part(c, 'FR1').hid = true; }, 'OL:bad95');
ok(r.top.group.hs.some((h) => h.cls === 'OL:bad95'), 'OL aux contact found');
/* 5. motor winding open */
r = drive('dol', (c) => { part(c, 'M1').fault = 'open_winding'; part(c, 'M1').hid = true; }, 'MOT3:open_winding');
ok(r.top.group.hs.some((h) => h.cls === 'MOT3:open_winding'), 'open winding found');
/* 6. star-delta */
r = drive('stardelta', (c) => { part(c, 'KM3').fault = 'open_coil'; part(c, 'KM3').hid = true; }, 'CONT3:open_coil');
ok(r.top.group.hs.some((h) => h.cls === 'CONT3:open_coil'), 'KM3 coil found');
console.log(fail ? fail + ' FAILED' : 'ALL OK');
process.exit(fail ? 1 : 0);
