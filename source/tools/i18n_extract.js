/* Extract all translatable English strings (with Arabic pair) from src/*.js and shell.html.
   Output: i18n/keys.json  [{id, en, ar, f, tpl?}]  (tpl = dynamic template with {1}.. placeholders) */
const fs = require('fs'), path = require('path');
const acorn = require('/opt/npm-tools/node_modules/acorn'), walk = require('/opt/npm-tools/node_modules/acorn-walk');
const root = path.join(__dirname, '..');
const AR = /[؀-ۿ]/;
const files = [];
(function w(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) w(p); else if (/\.js$/.test(f)) files.push(p); } })(path.join(root, 'src'));
const rel = (p) => path.relative(root, p);
const pri = (f) => /shell|app|base|langmenu|editor|bench/.test(f) ? 1 : /assistant/.test(f) ? 2 : /guide/.test(f) ? 3 : /parts_|pcbparts|templates|instruments|inst_/.test(f) ? 4 : /loto/.test(f) ? 5 : /diag|inspect|pcb/.test(f) ? 6 : /kb/.test(f) ? 7 : 8;
const str = (n) => { if (!n) return null; if (n.type === 'Literal' && typeof n.value === 'string') return n.value; if (n.type === 'TemplateLiteral' && n.expressions.length === 0) return n.quasis[0].value.cooked; return null; };
/* flatten a + chain / template literal to parts: strings and expression source text */
function parts(n, src) {
  if (n.type === 'Literal' && typeof n.value === 'string') return [{ s: n.value }];
  if (n.type === 'TemplateLiteral') { const o = []; n.quasis.forEach((q, i) => { if (q.value.cooked) o.push({ s: q.value.cooked }); if (i < n.expressions.length) o.push({ e: src.slice(n.expressions[i].start, n.expressions[i].end) }); }); return o; }
  if (n.type === 'BinaryExpression' && n.operator === '+') return parts(n.left, src).concat(parts(n.right, src));
  if (n.type === 'ParenthesizedExpression') return parts(n.expression, src);
  return [{ e: src.slice(n.start, n.end) }];
}
const isTextual = (n) => n.type === 'Literal' && typeof n.value === 'string' || n.type === 'TemplateLiteral' || (n.type === 'BinaryExpression' && n.operator === '+');
const out = new Map(), tpls = new Map();
function add(en, ar, f) { if (!out.has(en)) out.set(en, { ar, f }); }
for (const p of files) {
  const src = fs.readFileSync(p, 'utf8'), f = rel(p);
  let ast; try { ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'script' }); } catch (e) { console.error('PARSE FAIL', f, e.message); continue; }
  const test = (a, b) => {
    if (!a || !b || !isTextual(a) || !isTextual(b)) return;
    const e = str(a), r = str(b);
    if (e != null && r != null) { if (AR.test(r) && !AR.test(e)) add(e, r, f); return; }
    /* dynamic: build templates; placeholders keyed by expression source */
    const pa = parts(a, src), pb = parts(b, src);
    if (!pb.some((x) => x.s && AR.test(x.s))) return;
    if (pa.some((x) => x.s && AR.test(x.s))) return;
    const exprs = []; for (const x of pa) if (x.e != null && !exprs.includes(x.e)) exprs.push(x.e);
    if (!exprs.length) return;
    const build = (ps) => ps.map((x) => x.s != null ? x.s : '{' + (exprs.indexOf(x.e) + 1) + '}').join('');
    if (pb.some((x) => x.e != null && !exprs.includes(x.e))) { /* ar has expressions not in en: skip */ }
    const en = build(pa), ar = build(pb);
    if (/\{0\}/.test(en)) return;
    if (!tpls.has(en)) tpls.set(en, { ar, f, n: exprs.length });
  };
  walk.full(ast, (n) => {
    const list = n.type === 'ArrayExpression' ? n.elements : (n.type === 'CallExpression' || n.type === 'NewExpression') ? n.arguments : null;
    if (list) for (let i = 0; i + 1 < list.length; i++) test(list[i], list[i + 1]);
  });
}
/* shell.html */
{
  const html = fs.readFileSync(path.join(root, 'src/ui/shell.html'), 'utf8');
  for (const m of html.matchAll(/data-(?:t|ph|ti)="([^"]*)"/g)) { const [en, ar] = m[1].split('|'); if (en) add(en, ar || '', 'src/ui/shell.html'); }
}
const skip = (en) => !/[a-zA-Z]{3,}/.test(en.replace(/\{\d+\}/g, ''));
const list = [];
let id = 0;
const all = [...out].map(([en, v]) => ({ en, ar: v.ar, f: v.f })).filter((x) => !skip(x.en));
all.sort((a, b) => pri(a.f) - pri(b.f) || a.f.localeCompare(b.f));
for (const x of all) list.push({ id: ++id, ...x });
const tl = [...tpls].map(([en, v]) => ({ en, ar: v.ar, f: v.f })).filter((x) => !skip(x.en) && !out.has(x.en));
tl.sort((a, b) => pri(a.f) - pri(b.f) || a.f.localeCompare(b.f));
for (const x of tl) list.push({ id: ++id, tpl: true, ...x });
fs.mkdirSync(path.join(root, 'i18n'), { recursive: true });
fs.writeFileSync(path.join(root, 'i18n/keys.json'), JSON.stringify(list));
const chars = list.reduce((s, x) => s + x.en.length, 0);
console.log('keys', list.filter((x) => !x.tpl).length, 'templates', list.filter((x) => x.tpl).length, 'chars', chars);
