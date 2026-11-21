/* Print the next untranslated chunk: node tools/i18n_chunk.js [size] */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const keys = JSON.parse(fs.readFileSync(path.join(root, 'i18n/keys.json'), 'utf8'));
const have = new Set();
const dir = path.join(root, 'i18n/work');
for (const f of fs.readdirSync(dir)) for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/^#(\d+)\s*$/gm)) have.add(+m[1]);
const size = +process.argv[2] || 100;
const todo = keys.filter((k) => !have.has(k.id));
const maxc = +process.argv[3] || 9000;
let n = 0, c = 0, lastf = '';
const out = [];
for (const k of todo) {
  if (n >= size || c > maxc) break;
  const f = k.f.replace('src/', '').replace('.js', '');
  if (f !== lastf) { out.push('== ' + f); lastf = f; }
  out.push('#' + k.id + (k.tpl ? ' [tpl]' : '') + ' ' + k.en.replace(/\n/g, '\\n'));
  n++; c += k.en.length;
}
console.log(out.join('\n'));
console.error('remaining after this chunk:', todo.length - n);
