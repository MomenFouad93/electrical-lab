// Ladder -> S7-1200 SCL + TIA tag table (src/plc_scl.js). Prints the SCL of the tank project for review.
const EL = require('./load.js');
const fs = require('fs'), cp = require('child_process');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const LD = EL.ladder, SC = EL.scl;
const count = (s, re) => (s.match(re) || []).length;

/* ---------- structure checks on one result ---------- */
function structure(r, prog, label) {
  const s = r.scl;
  ok(count(s, /^FUNCTION_BLOCK "FB_Main"\r$/mg) === 1 && count(s, /^END_FUNCTION_BLOCK\r$/mg) === 1 && count(s, /^DATA_BLOCK "IDB_Main"\r$/mg) === 1 && count(s, /^END_DATA_BLOCK\r$/mg) === 1 && count(s, /^ORGANIZATION_BLOCK "Main"\r$/mg) === 1 && count(s, /^END_ORGANIZATION_BLOCK\r$/mg) === 1, label + ': FB, instance DB and OB1 blocks once each');
  ok(count(s, /\{ S7_Optimized_Access := 'TRUE' \}/g) === 3 && count(s, /^VERSION : 0\.1\r$/mg) === 3 && /"IDB_Main"\(\);/.test(s) && /^"FB_Main"\r$/m.test(s), label + ': optimized access, VERSION, OB1 calls the instance DB');
  ok(!/\n(?!\r)/.test(s.replace(/\r\n/g, '')) && !/[^\r]\n/.test(s), label + ': CRLF line ends');
  ok(count(s, /\bIF\b[^\r\n]*\bTHEN\b/g) === count(s, /\bEND_IF;/g), label + ': balanced IF / END_IF (' + count(s, /\bEND_IF;/g) + ')');
  ok(count(s, /^\s*BEGIN\r$/mg) === 3 && count(s, /^\s*VAR \r$/mg) === 1 && count(s, /^\s*END_VAR\r$/mg) === 2, label + ': BEGIN / VAR / END_VAR');
  const miss = prog.nets.map((n, i) => i).filter((i) => !new RegExp('^\\t// Network ' + (i + 1) + ': ', 'm').test(s));
  ok(!miss.length, label + ': every network has its comment line' + (miss.length ? ' missing ' + miss.join(',') : ''));
  prog.nets.forEach((n, i) => { if (n.c) ok(s.includes('// Network ' + (i + 1) + ': ' + n.c), label + ': N' + (i + 1) + ' keeps its comment'); });
  ok(count(s, /#rung := /g) === prog.nets.length, label + ': one rung result per network');
  // timers / counters declared once
  const ks = new Set(); prog.nets.forEach((n) => n.o.forEach((o) => { if (/^(TON|TOF|TP|CTU)$/.test(o.t)) ks.add(LD.norm(o.a)); }));
  for (const k of ks) ok(count(s, new RegExp('^\\s+' + k + ' : (TON|TOF|TP|CTU)_(TIME|INT);', 'mg')) === 1, label + ': ' + k + ' declared once');
  // every output coil appears as an assignment
  const ref = (a) => { const t = r.tags.find((x) => x.abs === LD.norm(a)); return r.symbolic ? '"' + t.name + '"' : t.addr; };
  prog.nets.forEach((n, i) => n.o.forEach((o) => {
    if (o.t === 'COIL') ok(s.includes(ref(o.a) + ' := #rung;'), label + ': N' + (i + 1) + ' coil ' + o.a + ' -> ' + ref(o.a) + ' := #rung');
    if (o.t === 'SET' || o.t === 'RST') ok(s.includes(ref(o.a) + ' := ' + (o.t === 'SET' ? 'TRUE' : 'FALSE') + ';'), label + ': N' + (i + 1) + ' ' + o.t + ' ' + o.a);
  }));
  ok(!r.warnings.some((w) => w.lvl === 'todo') && !/TODO/.test(s), label + ': no unknown elements / TODO');
  // tag names: valid, unique, quoted refs all declared
  ok(r.tags.every((t) => /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(t.name)) && new Set(r.tags.map((t) => t.name.toLowerCase())).size === r.tags.length, label + ': tag names valid and unique');
  const quoted = [...new Set((s.match(/"[^"\r\n]+"/g) || []).map((x) => x.slice(1, -1)))].filter((x) => !['FB_Main', 'IDB_Main', 'Main', 'Main Program Sweep (Cycle)'].includes(x));
  ok(quoted.every((q) => r.tags.some((t) => t.name === q)), label + ': every quoted name is in the tag table');
  ok(r.tags.every((t) => /^%(I|Q|M)\d+\.\d$|^%(MW|IW|QW)\d+$/.test(t.addr) && (t.type === 'Bool') === /\./.test(t.addr)), label + ': addresses %I0.0 / %MW10 style, Bool / Int');
}

/* ---------- rung logic: SCL expression evaluated in JS == EL.ladder.run rung, on random states ---------- */
function rungEquivalence(part, r, prog, label, trials) {
  const nQ = LD.ioOf(part).nQ, nI = LD.ioOf(part).nI;
  const byName = new Map(r.tags.map((t) => [t.name, t.abs]));
  const rungs = [...r.scl.matchAll(/#rung := ([\s\S]*?);\r\n/g)].map((m) => m[1]);
  const edgesClk = new Map([...r.scl.matchAll(/#([PN]_N\d+_\d+)\(CLK := ([^)]*)\);/g)].map((m) => [m[1], m[2]]));
  let bad = 0;
  const toJs = (e) => e.replace(/\(\*[^*]*\*\)/g, '').replace(/#([PN]_N\d+_\d+)\.Q/g, (m, n) => (n[0] === 'N' ? 'false' : '(' + toJs(edgesClk.get(n)) + ')')) /* first scan: previous value 0 */
    .replace(/DINT_TO_REAL\(TIME_TO_DINT\(#(T\d+)\.ET\)\) \/ 1000\.0/g, "W('$1')").replace(/#(C\d+)\.CV/g, "W('$1')").replace(/#([TC]\d+)\.QU?/g, "B('$1')")
    .replace(/"([^"]+)"/g, (m, n) => (/\./.test(byName.get(n)) ? "B('" + byName.get(n) + "')" : "W('" + byName.get(n) + "')"))
    .replace(/%([IQM]\d+\.\d)/g, "B('$1')").replace(/%((MW|IW|QW)\d+)/g, "W('$1')")
    .replace(/\b(INT|DINT)_TO_(REAL|DINT|INT)\(/g, '(').replace(/\bNOT\b/g, '!').replace(/\bAND\b/g, '&&').replace(/\bOR\b/g, '||').replace(/\bTRUE\b/g, 'true').replace(/\bFALSE\b/g, 'false').replace(/ = /g, ' == ').replace(/ <> /g, ' != ');
  for (let t = 0; t < trials; t++) {
    prog.nets.forEach((n, ni) => {
      const st = { i: Array.from({ length: nI }, () => +(Math.random() < 0.5)), q: Array.from({ length: nQ }, () => +(Math.random() < 0.5)), ai: [Math.random() * 10, Math.random() * 10], ao: [0], mb: Array.from({ length: 128 }, () => +(Math.random() < 0.5)), mw: {}, tm: {}, ct: {}, ed: {} };
      for (let k = 0; k <= 62; k += 2) st.mw[k] = Math.round(Math.random() * 120 - 10);
      for (let k = 0; k < 32; k++) st.tm['T' + k] = { et: Math.round(Math.random() * 120) / 10, q: +(Math.random() < 0.5), run: 0, pin: 0 };
      for (let k = 0; k < 16; k++) st.ct['C' + k] = { cv: Math.round(Math.random() * 20), q: +(Math.random() < 0.5), pin: 0 };
      const M = LD.mem(JSON.parse(JSON.stringify(st)), nQ, nI);
      const B = (a) => !!M.bit(a), W = (a) => M.word(a);
      let js; try { js = eval(toJs(rungs[ni])); } catch (e) { js = 'ERR ' + e.message + ' in ' + toJs(rungs[ni]); }
      const fake = { type: part.type, props: { lad: JSON.stringify({ sym: {}, nets: [{ c: '', s: n.s, o: [] }] }) }, state: st };
      const tr = LD.run(fake, JSON.parse(JSON.stringify(st)), 0, null, nQ);
      if (js !== tr[0].rung) { if (bad++ < 3) console.log('   mismatch', label, 'N' + (ni + 1), 'scl', js, 'ladder', tr[0].rung, toJs(rungs[ni])); }
    });
  }
  ok(!bad, label + ': SCL rung logic = ladder rung on ' + trials * prog.nets.length + ' random states' + (bad ? ' (' + bad + ' mismatches)' : ''));
}

/* ---------- the zip / xlsx ---------- */
function unzip(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let e = u8.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('no end of central directory');
  const n = dv.getUint16(e + 10, true), cdSize = dv.getUint32(e + 12, true), cdOff = dv.getUint32(e + 16, true);
  if (cdOff + cdSize !== e) throw new Error('central directory size/offset');
  const out = {}; let p = cdOff;
  for (let i = 0; i < n; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('central header ' + i);
    const crc = dv.getUint32(p + 16, true), size = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    const name = Buffer.from(u8.subarray(p + 46, p + 46 + nl)).toString('utf8');
    if (dv.getUint32(lo, true) !== 0x04034b50) throw new Error('local header ' + name);
    if (dv.getUint16(lo + 8, true) !== 0) throw new Error('not stored ' + name);
    const lnl = dv.getUint16(lo + 26, true), lxl = dv.getUint16(lo + 28, true), data = u8.subarray(lo + 30 + lnl + lxl, lo + 30 + lnl + lxl + size);
    if (SC.crc32(data) !== crc || dv.getUint32(lo + 14, true) !== crc) throw new Error('crc ' + name);
    out[name] = Buffer.from(data).toString('utf8');
    p += 46 + nl + xl + cl;
  }
  return out;
}

/* ---------- ready projects with a ladder ---------- */
let tankRes = null;
const withLad = EL.projects.list.filter((id) => EL.projects.map[id].ladder && EL.projects.map[id].plc);
ok(withLad.includes('tank') && withLad.length >= 2, 'projects with a ladder: ' + withLad.join(', '));
for (const id of withLad) {
  const c = EL.projects.load(id), part = c.parts.find((p) => p.tag === EL.projects.map[id].plc), prog = LD.progOf(part);
  const r = SC.convert(part, c);
  structure(r, prog, id);
  rungEquivalence(part, r, prog, id, 40);
  const ra = SC.convert(part, c, { symbolic: false });
  ok(!/"(?!FB_Main|IDB_Main|Main)[^"\r\n]*"/.test(ra.scl.replace('"Main Program Sweep (Cycle)"', '')) && /%I0\.0/.test(ra.scl), id + ': absolute mode uses %I0.0 and no tag names');
  structure(ra, prog, id + ' (absolute)');
  rungEquivalence(part, ra, prog, id + ' (absolute)', 10);
  if (id === 'tank') tankRes = r;
}
// the tank in detail
{
  const r = tankRes;
  ok(/#T1\(IN := #rung, PT := T#10S\);/.test(r.scl) && /#T2\(IN := #rung, PT := T#3S\);/.test(r.scl) && /#T3\(IN := #rung, PT := T#1S\);/.test(r.scl), 'tank: TON calls with T#10S / T#3S / T#1S');
  ok(/NOT #T1\.Q/.test(r.scl) && /AND #T1\.Q AND/.test(r.scl), 'tank: star / delta use #T1.Q');
  ok(/NORM_X\(MIN := 0, VALUE := LIMIT\(MN := 0, IN := "LT1_level", MX := 27648\), MAX := 27648\)/.test(r.scl) && /SCALE_X\(MIN := 0\.0, VALUE := #norm, MAX := 100\.0\)/.test(r.scl) && /"Level_pct" := REAL_TO_INT\(#scaled\);/.test(r.scl), 'tank: SCALE -> NORM_X / SCALE_X like the S7-1200');
  ok(r.tags.find((t) => t.abs === 'I0.0').name === 'Start_reset' && /S1/.test(r.tags.find((t) => t.abs === 'I0.0').comment) && r.tags.find((t) => t.abs === 'IW64').type === 'Int', 'tank: tag names from the symbols, wired device in the comment');
  ok(r.cpu.text === 'S7-1200 CPU 1214C DC/DC/RLY (14 DI / 10 DO / 2 AI)' && !r.beyond.length, 'tank: CPU note, nothing beyond the 1214C');
}

/* ---------- every element type ---------- */
{
  const c = EL.newCircuit(); const part = EL.addPart(c, 'PLC24', 0, 0, null, 'KF9');
  const NO = (a) => ({ t: 'NO', a }), NC = (a) => ({ t: 'NC', a });
  const lad = { sym: { 'I0.0': 'Start', 'I0.1': 'Stop', 'MW12': 'Count copy', 'M1.0': 'تشغيل' }, nets: [
    { c: 'edges', s: [{ t: 'P', a: 'I0.0' }, { t: 'PAR', br: [[{ t: 'N', a: 'I0.1' }], [NO('M0.0'), NC('M0.1')], [{ t: 'PAR', br: [[NO('I0.2')], [NO('I0.3'), NO('TRUE')]] }]] }], o: [{ t: 'SET', a: 'M0.5' }, { t: 'RST', a: 'M0.6' }] },
    { c: 'compares', s: [{ t: 'CMP', op: '==', a: 'MW10', b: '5' }, { t: 'CMP', op: '<>', a: 'MW12', b: 'MW14' }, { t: 'CMP', op: '>', a: 'T1', b: '2.5' }, { t: 'CMP', op: '<=', a: 'C1', b: '3' }], o: [{ t: 'COIL', a: 'Q0.5' }] },
    { c: 'timers', s: [NO('I0.4')], o: [{ t: 'TON', a: 'T1', pt: 2.5 }, { t: 'TOF', a: 'T2', pt: 90 }, { t: 'TP', a: 'T3', pt: 3725.25 > 3600 ? 3600 : 0 }] },
    { c: 'counter', s: [NO('I0.5')], o: [{ t: 'CTU', a: 'C1', pv: 10, r: 'I0.6' }, { t: 'CTU', a: 'C2', pv: 5 }] },
    { c: 'boxes', s: [], o: [{ t: 'SCALE', in: 'IW66', lo: -10, hi: 50.5, out: 'MW20' }, { t: 'MOVE', in: 'C1', out: 'MW12' }, { t: 'MOVE', in: 'T1', out: 'MW22' }, { t: 'ADD', a: 'MW10', b: '1', out: 'MW24' }, { t: 'SUB', a: 'MW10', b: 'T1', out: 'MW26' }, { t: 'MUL', a: 'MW10', b: '3', out: 'MW28' }] },
    { c: 'divide + analog out', s: [NO('M1.0')], o: [{ t: 'DIV', a: 'MW10', b: 'MW30', out: 'MW32' }, { t: 'MOVE', in: 'MW20', out: 'QW80' }, { t: 'COIL', a: 'M1.0' }] },
    { c: 'C2 done', s: [NO('C2'), NC('T2'), NO('T3')], o: [{ t: 'COIL', a: 'Q0.4' }] },
  ] };
  part.props.mode = 'ladder'; part.props.lad = JSON.stringify(LD.sanitize(lad));
  const prog = LD.progOf(part), r = SC.convert(part, c);
  structure(r, prog, 'all elements');
  rungEquivalence(part, r, prog, 'all elements', 60);
  const s = r.scl;
  ok(/P_N1_1 : R_TRIG;/.test(s) && /N_N1_2 : F_TRIG;/.test(s) && /#P_N1_1\(CLK := "Start"\);/.test(s) && /#N_N1_2\(CLK := "Stop"\);/.test(s), 'edges: R_TRIG / F_TRIG instances called with CLK');
  ok(/T1 : TON_TIME;/.test(s) && /T2 : TOF_TIME;/.test(s) && /T3 : TP_TIME;/.test(s) && /PT := T#2S500MS/.test(s) && /PT := T#1M30S/.test(s) && /PT := T#1H\)/.test(s), 'TON / TOF / TP instances and TIME literals');
  ok(/C1 : CTU_INT;/.test(s) && /#C1\(CU := #rung, R := %I0\.6|#C1\(CU := #rung, R := "[^"]+", PV := 10\);/.test(s) && /#C2\(CU := #rung, R := FALSE, PV := 5\);/.test(s) && /#C2\.Q AND NOT #T2\.Q AND #T3\.Q/.test(s), 'CTU with and without reset, done bits');
  ok(/\("[^"]+" = 5\)/.test(s) && /\("Count_copy" <> "[^"]+"\)/.test(s) && /\(DINT_TO_REAL\(TIME_TO_DINT\(#T1\.ET\)\) \/ 1000\.0\) > 2\.5\)/.test(s) && /\(#C1\.CV <= 3\)/.test(s), 'compares: =, <>, timer seconds as REAL, counter value');
  ok(/SCALE_X\(MIN := -10\.0, VALUE := #norm, MAX := 50\.5\)/.test(s) && /"Count_copy" := #C1\.CV;/.test(s) && /:= REAL_TO_INT\(DINT_TO_REAL\(TIME_TO_DINT\(#T1\.ET\)\) \/ 1000\.0\);/.test(s), 'SCALE limits, MOVE of a counter and of timer seconds');
  ok(/:= "[^"]+" \+ 1;/.test(s) && /:= REAL_TO_INT\(INT_TO_REAL\("[^"]+"\) - \(DINT_TO_REAL/.test(s) && /:= "[^"]+" \* 3;/.test(s) && /IF "[^"]+" <> 0 THEN/.test(s) && /REAL_TO_INT\(INT_TO_REAL\("[^"]+"\) \/ INT_TO_REAL\("[^"]+"\)\)/.test(s), 'ADD / SUB (mixed REAL) / MUL / DIV with zero guard');
  ok(r.tags.find((t) => t.abs === 'M1.0').name === 'Tag_M1_0' && r.tags.find((t) => t.abs === 'M1.0').comment === 'تشغيل', 'Arabic symbol: ASCII tag name, Arabic kept in the comment');
  ok(r.beyond.includes('QW80') && r.warnings.some((w) => /QW80/.test(w.msg[0]) && /analog output/.test(w.msg[0])), 'QW80 listed beyond the 1214C (no built-in analog output)');
  ok(r.warnings.some((w) => /MW10 uses the same memory bytes/.test(w.msg[0])) === false && !r.warnings.some((w) => /MW0 /.test(w.msg[0])), 'no false MB overlap warning');
  // raw JSON with unknown things and CTD / CTUD
  const raw = { nets: [{ c: 'raw', s: [{ t: 'XYZ', a: 'I0.0' }, NO('I0.7')], o: [{ t: 'CTD', a: 'C3', pv: 4, ld: 'I0.1' }, { t: 'CTUD', a: 'C4', pv: 40000, cd: 'I0.2', r: 'I0.3' }, { t: 'PID', a: 'x' }, { t: 'COIL', a: 'Q0.9' }] }, { c: '', s: [NO('C4'), NO('M1.1')], o: [{ t: 'COIL', a: 'Q0.0' }] }, { c: 'word over bits', s: [], o: [{ t: 'MOVE', in: '1', out: 'MW0' }] }] };
  const r2 = SC.convert(raw, c, { part });
  const todos = r2.warnings.filter((w) => w.lvl === 'todo').map((w) => w.msg[0]).join(' | ');
  ok(/XYZ/.test(todos) && /PID/.test(todos) && /Q0\.9/.test(todos) && count(r2.scl, /TODO/g) >= 3, 'unknown elements and invalid addresses -> warnings + TODO, never dropped: ' + todos);
  ok(/C3 : CTD_INT;/.test(r2.scl) && /#C3\(CD := #rung, LD := "Tag_I0_1", PV := 4\);/.test(r2.scl) && /C4 : CTUD_INT;/.test(r2.scl) && /PV := 32767\);/.test(r2.scl) && /#C4\.QU/.test(r2.scl), 'CTD / CTUD from raw JSON, PV clamped to INT');
  ok(r2.warnings.some((w) => /MW0 uses the same memory bytes \(MB0, MB1\)/.test(w.msg[0])), 'MW0 over M1.1 overlap warned');
  ok(count(r2.scl, /\bIF\b[^\r\n]*\bTHEN\b/g) === count(r2.scl, /\bEND_IF;/g), 'raw: balanced IF');
  ok(SC.convert('{broken', c, { part }).warnings.some((w) => w.lvl === 'todo'), 'broken JSON reported');
}

/* ---------- S7CPU: byte 1 ---------- */
if (EL.defs.S7CPU) {
  const c = EL.newCircuit(); const part = EL.addPart(c, 'S7CPU', 0, 0, null, 'KF2');
  part.props.lad = JSON.stringify(LD.sanitize({ sym: { 'I1.2': 'Start B', 'Q1.1': 'Lamp B' }, nets: [{ c: 'x', s: [NO_('I1.2'), { t: 'NC', a: 'I1.5' }], o: [{ t: 'COIL', a: 'Q1.1' }, { t: 'COIL', a: 'Q0.7' }] }] }));
  function NO_(a) { return { t: 'NO', a }; }
  const r = SC.convert(part, c);
  ok(/"Start_B" AND NOT "Tag_I1_5"/.test(r.scl) && /"Lamp_B" := #rung;/.test(r.scl) && r.tags.some((t) => t.addr === '%I1.2') && r.tags.some((t) => t.addr === '%Q1.1') && !r.beyond.length, 'S7CPU: I1.2 / I1.5 / Q1.1 map to %I1.2 / %Q1.1, nothing beyond the CPU');
  ok(r.cpu.text === 'S7-1200 CPU 1214C DC/DC/DC (14 DI / 10 DO / 2 AI)', 'S7CPU: DC/DC/DC note');
  structure(r, LD.progOf(part), 'S7CPU');
}

/* ---------- tag table files ---------- */
{
  const r = tankRes, x = SC.tagsXlsx(r.tags);
  let z = null; try { z = unzip(x); } catch (e) { console.log('   zip error', e.message); }
  ok(z && ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/worksheets/sheet1.xml', 'xl/styles.xml', 'xl/sharedStrings.xml'].every((n) => z[n]), 'xlsx: valid zip (local headers, central directory, CRC) with the OOXML parts');
  ok(z && /<sheet name="PLC Tags"/.test(z['xl/workbook.xml']) && SC.COLS.every((h) => z['xl/sharedStrings.xml'].includes('<t xml:space="preserve">' + h + '</t>')), 'xlsx: sheet "PLC Tags" with the TIA columns');
  const csv = SC.tagsCsv(r.tags);
  ok(csv.startsWith('﻿Name,Path,Data Type,Logical Address,Comment,Hmi Visible,Hmi Accessible,Hmi Writeable,Typeobject ID,Version ID\r\n') && csv.includes('Start_reset,Default tag table,Bool,%I0.0,') && csv.split('\r\n').length === r.tags.length + 2, 'csv: header + one row per tag');
  fs.writeFileSync('/tmp/t_scl_tags.xlsx', Buffer.from(x)); fs.writeFileSync('/tmp/t_scl_tank.scl', r.scl);
  const py = `import sys\ntry:\n import openpyxl\nexcept Exception:\n print('NOOPENPYXL'); sys.exit(0)\nwb=openpyxl.load_workbook('/tmp/t_scl_tags.xlsx')\nws=wb['PLC Tags']\nrows=[[c if c is not None else '' for c in r] for r in ws.iter_rows(values_only=True)]\nimport json; print(json.dumps(rows, ensure_ascii=False))`;
  let out = ''; try { out = cp.execFileSync('python3', ['-I', '-c', py], { encoding: 'utf8' }).trim(); } catch (e) { out = 'ERR ' + e.message; }
  if (out === 'NOOPENPYXL') console.log('   (openpyxl not installed: round trip skipped)');
  else {
    let rows = null; try { rows = JSON.parse(out); } catch (e) { console.log('   openpyxl:', out.slice(0, 300)); }
    const exp = [SC.COLS].concat(SC.rows(r.tags));
    ok(rows && JSON.stringify(rows) === JSON.stringify(exp), 'openpyxl opens the xlsx and reads back the same ' + (rows ? rows.length - 1 : 0) + ' tag rows');
  }
}
ok(SC.timeLit(0) === 'T#0MS' && SC.timeLit(0.1) === 'T#100MS' && SC.timeLit(65) === 'T#1M5S' && SC.timeLit(3600) === 'T#1H', 'TIME literals');
ok(SC.tagName('Stop (NC)') === 'Stop_NC' && SC.tagName('Level %') === 'Level_pct' && SC.tagName('1st pump') === 'X_1st_pump' && SC.tagName('AND') === 'AND_tag' && SC.tagName('مضخة') === '', 'tag name rules');

console.log('\n================ SCL of the tank project ================\n' + tankRes.scl.replace(/\r\n/g, '\n'));
console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
