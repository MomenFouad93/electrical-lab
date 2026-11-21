const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['fr', 'zh', 'ru'];
const SH = '/tmp/claude-0/shots/';
const collect = () => {
  const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { const t = n.nodeValue.replace(/\s+/g, ' ').trim(); if (!t) continue; const pe = n.parentElement; if (!pe || /^(SCRIPT|STYLE)$/.test(pe.tagName) || !pe.getClientRects().length) continue; const cs = getComputedStyle(pe); if (cs.visibility === 'hidden' || cs.display === 'none') continue; out.push(t); }
  return out;
};
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [dev, opts] of [['d', { viewport: { width: 1360, height: 860 } }], ['m', { viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
    const ctx = await b.newContext(opts); const p = await ctx.newPage();
    p.on('console', (m) => { if (m.type() === 'error') errs.push(dev + ' ' + m.text()); });
    p.on('pageerror', (e) => errs.push(dev + ' PAGEERR ' + e.message));
    await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(500);
    for (const L of langs) {
      await p.evaluate((L) => EL.ui.setLang(L), L); await p.waitForTimeout(250);
      const seen = new Set(); const grab = async () => { for (const t of await p.evaluate(collect)) seen.add(t); };
      await p.click('#tabs .tab[data-v=bench]'); await p.waitForTimeout(200);
      const ids = await p.evaluate(() => Object.keys(EL.templates));
      for (const id of ids.slice(0, 3)) {
        await p.evaluate((id) => EL.bench.loadTemplate(id), id); await p.waitForTimeout(400);
        try { await p.click('#btnDiag', { timeout: 2000 }); await p.waitForTimeout(900); await grab(); } catch (e) { errs.push('diag click ' + e.message.slice(0, 80)); }
        if (id === ids[0]) await p.screenshot({ path: `${SH}flow_${dev}_${L}_diag.png` });
      }
      await p.click('#tabs .tab[data-v=loto]'); await p.waitForTimeout(500); await grab();
      await p.screenshot({ path: `${SH}flow_${dev}_${L}_loto.png` });
      await p.click('#tabs .tab[data-v=pcb]'); await p.waitForTimeout(500); await grab();
      await p.screenshot({ path: `${SH}flow_${dev}_${L}_pcb.png` });
      await p.click('#tabs .tab[data-v=inspect]'); await p.waitForTimeout(500); await grab();
      await p.screenshot({ path: `${SH}flow_${dev}_${L}_inspect.png` });
      await p.click('#tabs .tab[data-v=guide]'); await p.waitForTimeout(400); await grab();
      await p.screenshot({ path: `${SH}flow_${dev}_${L}_guide.png` });
      const res = await p.evaluate(({ seen, L }) => {
        const tgt = new Set((EL.I18N[L] || []).filter(Boolean)); const keys = new Set(EL.I18N.keys); const miss = [], ar = [];
        for (const s of seen) { if (/[؀-ۿ]/.test(s)) { ar.push(s); continue; } if (!/[A-Za-z]{3,}[^A-Za-z]+[A-Za-z]{3,}/.test(s) || tgt.has(s) || EL.tx(s) !== s) continue;
          if (keys.has(s) || /\b(the|and|with|your|this|that|must|when|should|before|after|because|only|are|from|into|check|not|open|is)\b/i.test(s)) miss.push(s); }
        return { total: seen.size, miss, ar, ovf: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
      }, { seen: [...seen], L });
      console.log(`== ${dev} ${L}: nodes=${res.total} english-left=${res.miss.length} ar-leak=${res.ar.length} pageOverflow=${res.ovf}`);
      res.miss.slice(0, 15).forEach((s) => console.log('   MISS ' + s.slice(0, 120)));
      res.ar.slice(0, 5).forEach((s) => console.log('   AR   ' + s.slice(0, 80)));
    }
    await ctx.close();
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
  await b.close();
})();
