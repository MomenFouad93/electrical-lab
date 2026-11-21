const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const lang of ['ar', 'fr', 'zh', 'ru', 'hu']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    p.on('console', (m) => { if (m.type() === 'error') errs.push(lang + ' ' + m.text()); });
    p.on('pageerror', (e) => errs.push(lang + ' PAGEERR ' + e.message));
    await p.addInitScript((l) => { try { localStorage.setItem('ellab.lang', l); } catch (e) {} }, lang);
    await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(700);
    await p.click('#tabs .tab[data-v=loto]'); await p.waitForTimeout(500);
    await p.evaluate(() => { const s = document.querySelector('.pr-sel'); s.value = 'cyl'; s.dispatchEvent(new Event('change')); document.querySelectorAll('.pr-task .btn')[1].click(); });
    await p.waitForTimeout(9000);
    await p.screenshot({ path: `/tmp/claude-0/shots/prl_${lang}.png` });
    const left = await p.evaluate(() => [...document.querySelectorAll('.pr-task, .pr-side')].map((e) => e.innerText).join('\n').split('\n').filter((t) => /^[A-Za-z][A-Za-z ,.'():;-]{12,}$/.test(t)).slice(0, 8));
    console.log(lang, JSON.stringify(left));
    await ctx.close();
  }
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
