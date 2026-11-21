const fs = require('fs');
const fs2 = fs; for (const f of ['core','parts_a','parts_b','parts_c','logic','parts_d','parts_e','parts_f','parts_g','pcbparts','diag_meta','diag','diag_ts','ai','kb','kb_a','kb_b','circuit','instruments','plant','ladder','parts_h','projects']) { if (fs.existsSync(__dirname+'/../src/'+f+'.js')) require('../src/'+f+'.js'); }
if (fs.existsSync(__dirname+'/../src/templates.js')) require('../src/templates.js');
module.exports = globalThis.EL;
