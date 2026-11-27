// Render mechanical components to PNG for checking: node tools/mech_shot.js <id...> | --check | --all
const fs = require('fs'), path = require('path');
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const LAB = path.join(__dirname, '..');
const data = fs.readdirSync(path.join(LAB, 'src')).filter((f) => /^mech_.*\.js$/.test(f)).sort();
const OUT = '/tmp/mech'; fs.mkdirSync(OUT, { recursive: true });
const html = `<!doctype html><meta charset=utf-8><style>body{margin:0;background:#18202e}#h{width:900px;height:640px;position:relative}.mc-labels{position:absolute;inset:0;pointer-events:none}.mc-lab{position:absolute;transform:translate(-50%,-50%);font:12px sans-serif;color:#fff;background:#0009;padding:1px 5px;border-radius:4px;white-space:nowrap}</style><div id=h></div>
<script>window.EL={lang:'en',ui:{T:(x)=>Array.isArray(x)?x[0]:x},h:{esc:(s)=>String(s).replace(/[<>&]/g,'')}};</script>
<script src="${LAB}/src/vendor/three.js"></script><script src="${LAB}/src/mech.js"></script>
${data.map((f) => `<script src="${LAB}/src/${f}"></script>`).join('')}
<script src="${LAB}/src/ui/mech3d.js"></script>`;
fs.writeFileSync(OUT + '/view.html', html);
(async () => {
  const args = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 640 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto('file://' + OUT + '/view.html'); await p.waitForTimeout(300);
  const info = await p.evaluate(() => ({ ids: EL.mech.lib.map((c) => c.id), errors: EL.mech.errors }));
  if (info.errors.length) console.log('FORMAT ERRORS:\n' + info.errors.join('\n'));
  console.log(info.ids.length + ' components: ' + info.ids.join(' '));
  if (args[0] === '--check') { console.log(errs.length ? errs.join('\n') : 'no page errors'); await b.close(); return; }
  const ids = args[0] === '--all' ? info.ids : args;
  for (const id of ids) {
    const r = await p.evaluate(async (id) => {
      const c = EL.mech.byId[id]; if (!c) return 'missing ' + id;
      if (!window.V) { window.V = EL.mech.viewer(document.getElementById('h'), { keep: true }); }
      V.show(c); V.setLabels(true); V.renderNow(); return 'ok ' + c.parts.length + ' parts';
    }, id);
    console.log(id, r); if (!r.startsWith('ok')) continue;
    await p.waitForTimeout(150); await p.screenshot({ path: `${OUT}/${id}_a.png` });
    await p.evaluate(() => { V.setExplode(1, true); V.renderNow(); }); await p.waitForTimeout(100); await p.screenshot({ path: `${OUT}/${id}_b.png` });
    await p.evaluate(() => { V.setExplode(0, true); V.setCut(true); V.setLabels(false); V.renderNow(); }); await p.waitForTimeout(100); await p.screenshot({ path: `${OUT}/${id}_c.png` });
    const an = await p.evaluate(() => { V.setCut(false); if (!V.cur.c.anim) return false; V.operate(true); for (let i = 0; i < 90; i++) V.renderNow(); return true; });
    if (an) { await p.waitForTimeout(100); await p.screenshot({ path: `${OUT}/${id}_d.png` }); }
  }
  console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
  await b.close();
})();
