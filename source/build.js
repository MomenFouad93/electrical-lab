const fs = require('fs'), path = require('path');
const R = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const E = (f) => fs.existsSync(path.join(__dirname, f));
const js = ['core', 'i18n', 'i18n_data', 'parts_a', 'parts_b', 'parts_c', 'logic', 'parts_d', 'parts_e', 'parts_f', 'parts_g', 'circuit', 'instruments', 'templates', 'plant', 'water', 'ladder', 'line', 'parts_h', 'projects', 'pcbparts', 'diag_meta', 'diag', 'diag_ts', 'ai', 'kb', 'kb_a', 'kb_b', 'ui/base', 'ui/langmenu', 'ui/editor', 'ui/bench', 'ui/inst_docs', 'ui/inst_ui', 'ui/assistant', 'ui/plant_art', 'ui/water_art', 'ui/autowire', 'ui/plant_ui', 'ui/line_ui', 'ui/ladder_ui', 'ui/projects_ui', 'ui/loto_data', 'ui/loto_art', 'ui/loto_det', 'ui/loto_det_a', 'ui/loto_det_b', 'ui/loto_det_c', 'ui/loto_board', 'ui/loto_master', 'ui/loto_pr_art', 'ui/loto_pr', 'ui/loto', 'ui/diag_ui', 'ui/inspect_ill', 'ui/inspect', 'ui/pcb', 'ui/pcb_more', 'ui/guide', 'ui/update', 'ui/app']
  .map((f) => 'src/' + f + '.js').filter(E).map((f) => '/* ' + f + ' */\n' + R(f)).join('\n');
const BUILD = process.env.BUILD || new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})(\d{4})$/, '$1.$2');
let html = R('src/ui/shell.html');
html = html.replace('/*CSS*/', () => R('src/ui/style.css')).replace('/*JS*/', () => ('window.EL = window.EL || {}; window.EL.BUILD = ' + JSON.stringify(BUILD) + ';\n' + js).replace(/<\/script/gi, '<\\/script'));
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/electrical-lab.html'), html);
fs.writeFileSync(path.join(__dirname, 'dist/build.txt'), BUILD);
console.log('built', BUILD, (html.length / 1024).toFixed(0) + ' KB');
