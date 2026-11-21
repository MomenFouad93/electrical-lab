const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const [,, out = 'bench', w = '1280', h = '800', actions = ''] = process.argv;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, hasTouch: +w < 700 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html');
  await p.waitForTimeout(1200);
  if (actions) { try { await eval('(async()=>{' + require('./helpers.js') + actions + '})()'); } catch (e) { errs.push('ACTION ERR ' + e.message); } await p.waitForTimeout(800); }
  await p.screenshot({ path: '/tmp/claude-0/shots/' + out + '.png' });
  console.log(errs.join('\n') || 'no console errors');
  await b.close();
})();
