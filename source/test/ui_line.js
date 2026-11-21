const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const mode = process.argv[2] || 'd';
  const b = await chromium.launch(); const ctx = await b.newContext(mode === 'm' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const errs = []; let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
  p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(700);
  await p.click('#tabs .tab[data-v=projects]'); await p.waitForTimeout(300);
  const card = p.locator('.pj-card', { hasText: 'Packaging line' });
  ok(await card.locator('svg').count() === 1, 'line project card has a preview');
  await card.locator('text=Open').first().click(); await p.waitForTimeout(800);
  ok(await p.evaluate(() => EL.ui.view() === 'bench' && EL.bench.view === 'line'), 'opens in the Line view');
  ok(await p.locator('#lineHost [data-e]').count() === 12, '12 elements drawn');
  await p.waitForTimeout(6000);
  const n = await p.evaluate(() => document.querySelectorAll('#lineHost svg g[transform]').length);
  ok(n > 5, 'cartons moving on the line (' + n + ')');
  if (mode === 'd') {
    ok(await p.locator('#lnStats .kv').count() >= 5, 'results shown');
    ok(await p.locator('#lnChecks h3').count() === 1, 'line check shown');
  }
  await p.screenshot({ path: `/tmp/claude-0/shots/line_${mode}.png` });
  // select the case packer, stop it from the inspector (desktop) / in Test mode by tap
  const cp = p.locator('#lineHost [data-e]').last(); const bb = await cp.boundingBox();
  if (bb) { await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(400); }
  ok(await p.evaluate(() => { const e = EL.bench.ed.c.line.els.find((x) => x.type === 'CP'); return e.st.stop === true; }), 'tap in Test mode stops the case packer');
  await p.waitForTimeout(500);
  // design rules
  await p.click('#lineHost >> text=Design rules'); await p.waitForTimeout(300);
  ok(await p.locator('.modal .ln-guidebox li').count() === 10, 'design rules: 10 steps');
  await p.evaluate(() => document.querySelector('.modal').remove());
  // build from scratch
  await p.evaluate(() => { EL.bench.setMode('build'); EL.bench.ed.c.line = null; EL.ui.line.render(true); EL.ui.line.inspector(); });
  await p.waitForTimeout(200);
  ok(await p.locator('#lnEmpty').isVisible(), 'empty-line help shows');
  await p.locator('#lnEmpty button').first().click(); await p.waitForTimeout(300);
  for (const nm of ['Flat-top chain', 'Checkweigher', 'Case packer']) {
    await p.click('#lineHost >> text=Add at the end of the line'); await p.waitForTimeout(250);
    await p.locator('.modal .pl-mi', { hasText: nm }).first().click(); await p.waitForTimeout(250);
  }
  ok(await p.evaluate(() => { const ln = EL.bench.ed.c.line; return ln.els.length === 4 && !EL.line.route(ln).broken; }), 'built 4 elements in a connected route');
  await p.click('#lineHost .ln-rot'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => EL.bench.ed.c.line.els[3].d === 1), 'rotate turns the selected element');
  await p.evaluate(() => EL.bench.ed.undo()); await p.waitForTimeout(200);
  ok(await p.evaluate(() => EL.bench.ed.c.line.els[3].d === 0), 'undo rotation');
  await p.evaluate(() => EL.ui.line.select(EL.bench.ed.c.line.els[3].id)); await p.click('#lineHost .ln-del'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => EL.bench.ed.c.line.els.length === 3), 'delete');
  // switch views
  await p.click('#viewSeg [data-v=panel]'); await p.waitForTimeout(200);
  ok(await p.locator('#benchHost').isVisible() && !(await p.locator('#lineHost').isVisible()), 'Panel view hides the line');
  await p.click('#viewSeg [data-v=line]'); await p.waitForTimeout(200);
  ok(await p.locator('#lineHost').isVisible(), 'back to Line');
  await p.reload(); await p.waitForTimeout(900);
  ok(await p.evaluate(() => EL.bench.view === 'line' && EL.bench.ed.c.line && EL.bench.ed.c.line.els.length === 3), 'line kept after reload');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  await b.close(); console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
})();
