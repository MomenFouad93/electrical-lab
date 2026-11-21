const EL = require('./load.js');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const show = (name, r) => {
  console.log('==', name, '->', r.verdict, '|', r.summary[0], '| scen', r.scenarios);
  for (const f of r.findings) console.log('   ', f.sev.padEnd(5), f.code.padEnd(12), f.msg[0]);
  for (const t of r.table) console.log('    table', t.tag, t.status);
};
for (const id of EL.templateList) {
  const c = EL.loadTemplate(id);
  const t0 = Date.now();
  const r = EL.diag.analyze(c);
  show(id + ' (' + (Date.now() - t0) + ' ms)', r);
}
process.exit(fail ? 1 : 0);
