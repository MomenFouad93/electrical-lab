const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  p.on('console', (m) => console.log('[c]', m.text()));
  p.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(1000);
  const code = process.argv[2];
  const r = await p.evaluate(code);
  console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1));
  await b.close();
})();
