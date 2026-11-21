const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const LANGS = ['en','ar','fr','pt','zh','ru','pl','hu','es'];
(async () => {
  const b = await chromium.launch(); const errs = []; const out = [];
  for (const [name, opts] of [['d', { viewport: { width: 1360, height: 860 } }], ['m', { viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
    const ctx = await b.newContext(opts); const p = await ctx.newPage();
    p.on('console', (m) => { if (m.type() === 'error') errs.push(name + ' ' + m.text()); });
    p.on('pageerror', (e) => errs.push(name + ' PAGEERR ' + e.message));
    await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(500);
    for (const L of LANGS) {
      await p.click('#btnLang'); await p.waitForTimeout(150);
      const items = await p.$$eval('.lmenu button', (bs) => bs.length);
      await p.click('.lmenu button[lang="' + ({ en:'en', ar:'ar', fr:'fr', pt:'pt-BR', zh:'zh-CN', ru:'ru', pl:'pl', hu:'hu', es:'es' }[L]) + '"]');
      await p.waitForTimeout(250);
      const st = await p.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, ls: localStorage.getItem('ellab.lang'), cur: EL.lang, btn: document.querySelector('#btnLang .lc').textContent }));
      const tabsTxt = await p.$$eval('#tabs .tab', (t) => t.map((x) => x.textContent.trim()).join(' | '));
      const ovf = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      out.push(`${name} ${L} items=${items} html.lang=${st.lang} dir=${st.dir} ls=${st.ls} btn=${st.btn} ovf=${ovf} :: ${tabsTxt}`);
      if (['fr','zh','ar','ru'].includes(L)) await p.screenshot({ path: `/tmp/claude-0/shots/lang_${name}_${L}_bench.png` });
    }
    await ctx.close();
  }
  console.log(out.join('\n')); console.log(errs.length ? errs.join('\n') : 'LANG TEST: no console errors');
  await b.close();
})();
