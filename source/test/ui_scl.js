const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
  for (const mode of ['d', 'm']) for (const lang of ['en', 'ar']) {
    const ctx = await b.newContext(Object.assign(mode === 'm' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 768 } }, { acceptDownloads: true }));
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
    await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(700);
    await p.evaluate((l) => EL.ui.setLang(l), lang); await p.waitForTimeout(200);
    await p.click('#tabs .tab[data-v=projects]'); await p.waitForTimeout(300);
    await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Open the program|افتح البرنامج/.test(x.textContent)); b.click(); }); await p.waitForTimeout(900);
    ok(await p.locator('#btnS7code').isVisible() && await p.locator('#btnTia').isVisible(), mode + lang + ' toolbar buttons visible');
    await p.click('#btnS7code'); await p.waitForTimeout(400);
    ok(await p.locator('.scl-code .scl-l').count() > 80, mode + lang + ' code with line numbers');
    ok(await p.evaluate(() => document.querySelector('.scl-l .n').textContent === '1' && getComputedStyle(document.querySelector('.scl-code')).direction === 'ltr'), mode + lang + ' line numbers, LTR');
    await p.screenshot({ path: `/tmp/claude-0/shots/scl_code_${mode}_${lang}.png` });
    let dl = p.waitForEvent('download'); await p.click('.scl-body [data-dl=scl]'); let d = await dl;
    ok(/_FB_Main\.scl$/.test(d.suggestedFilename()), mode + lang + ' download .scl ' + d.suggestedFilename());
    const scl = require('fs').readFileSync(await d.path(), 'utf8'); ok(/^FUNCTION_BLOCK "FB_Main"/.test(scl) && /END_ORGANIZATION_BLOCK/.test(scl), mode + lang + ' .scl content');
    await p.click('.scl-body [data-act=copy]'); await p.waitForTimeout(300);
    // toggle absolute
    await p.click('#sclSym'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => /%I0\.0/.test(document.querySelector('.scl-code').textContent) && localStorage.getItem('ellab.sclSym') === 'off'), mode + lang + ' absolute addresses toggle');
    await p.click('#sclSym'); await p.waitForTimeout(200);
    await p.click('.scl-tabs [data-tab=tia]'); await p.waitForTimeout(300);
    ok(await p.locator('.scl-steps li').count() === 6 && await p.locator('.scl-tags span').count() >= 14 * 4, mode + lang + ' TIA steps + tag list');
    await p.screenshot({ path: `/tmp/claude-0/shots/scl_tia_${mode}_${lang}.png` });
    if (mode === 'm') { await p.evaluate(() => { const c = document.querySelector('.scl-box'); c.scrollTop = c.scrollHeight; }); await p.screenshot({ path: `/tmp/claude-0/shots/scl_tia_${mode}_${lang}_end.png` }); }
    for (const k of ['scl', 'xlsx', 'csv']) { dl = p.waitForEvent('download'); await p.click('.scl-body [data-dl=' + k + ']'); d = await dl; const buf = require('fs').readFileSync(await d.path()); ok(d.suggestedFilename().endsWith('.' + k) && buf.length > 200 && (k !== 'xlsx' || buf[0] === 0x50 && buf[1] === 0x4b), mode + lang + ' download ' + d.suggestedFilename() + ' ' + buf.length + ' B'); if (k === 'xlsx') require('fs').writeFileSync('/tmp/ui_tags.xlsx', buf); }
    await p.click('.scl-modal .mx'); await p.waitForTimeout(200);
    ok(!(await p.locator('.scl-modal').count()), mode + lang + ' close');
    await p.click('#btnTia'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.querySelector('.scl-tabs [data-tab=tia]').classList.contains('on')), mode + lang + ' TIA button opens on the TIA tab');
    await p.evaluate(() => document.querySelector('.scl-modal').remove());
    ok(!errs.length, mode + lang + ' no page errors ' + errs.join(' | '));
    await ctx.close();
  }
  await b.close(); console.log(fail ? fail + ' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
})();
