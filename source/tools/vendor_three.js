// Turn the three.js ES module build into a classic script that sets EL.THREE (bundled inline, MIT licence kept)
// Usage: node tools/vendor_three.js /path/to/three.module.min.js
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
const i = src.lastIndexOf('export{');
if (i < 0) throw new Error('no export block');
const j = src.indexOf('};', i);
const map = src.slice(i + 7, j).split(',').map((s) => { const m = s.trim().match(/^(\S+) as (\S+)$/); return m ? m[2] + ':' + m[1] : s.trim() + ':' + s.trim(); });
const body = src.slice(0, i) + 'EL.THREE={' + map.join(',') + '};' + src.slice(j + 2);
const out = '/* three.js r170, MIT licence, Copyright 2010-2024 Three.js Authors (https://github.com/mrdoob/three.js) */\n(function(){"use strict";var EL=window.EL;' + body + '\n})();\n';
fs.writeFileSync('src/vendor/three.js', out);
console.log('vendor three', (out.length / 1024).toFixed(0) + ' KB', map.length + ' exports');
