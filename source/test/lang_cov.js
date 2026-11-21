const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['fr', 'pt', 'zh', 'ru', 'pl', 'hu', 'es'];
const collect = () => {
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const t = n.nodeValue.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const pe = n.parentElement; if (!pe || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(pe.tagName)) continue;
    const r = pe.getClientRects(); if (!r.length) continue;
    const cs = getComputedStyle(pe); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    out.push(t);
  }
  document.querySelectorAll('[placeholder],[title],[aria-label]').forEach((e) => { for (const a of ['placeholder', 'title', 'aria-label']) { const v = e.getAttribute(a); if (v && v.trim()) out.push('@' + v.trim()); } });
  return out;
};
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1360, height: 860 } }); const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(500);
  for (const L of langs) {
    await p.evaluate((L) => EL.ui.setLang(L), L); await p.waitForTimeout(250);
    const seen = new Set();
    const grab = async () => { for (const t of await p.evaluate(collect)) seen.add(t); };
    for (const v of ['bench', 'loto', 'pcb', 'inspect', 'guide']) {
      await p.click('#tabs .tab[data-v=' + v + ']'); await p.waitForTimeout(300); await grab();
    }
    await p.click('#tabs .tab[data-v=bench]'); await p.waitForTimeout(200);
    for (const sel of ['#stabs .stab[data-p=meters]', '#stabs .stab[data-p=diag]', '#stabs .stab[data-p=assist]', '#btnTpl', '#btnFile']) {
      try { await p.click(sel, { timeout: 1500 }); await p.waitForTimeout(250); await grab(); await p.evaluate(() => document.querySelectorAll('.modal').forEach((m) => m.remove())); } catch (e) {}
    }
    const res = await p.evaluate(({ seen, L }) => {
      const tgt = new Set((EL.I18N[L] || []).filter(Boolean));
      const keys = new Set(EL.I18N.keys);
      const miss = [], ar = [], same = [];
      for (const s0 of seen) { const s = s0.replace(/^@/, ''); if (/[\u0600-\u06FF]/.test(s)) { ar.push(s); continue; }
        if (!/[A-Za-z]{3,}[^A-Za-z]+[A-Za-z]{3,}/.test(s)) continue;
        if (tgt.has(s)) continue;
        if (EL.tx(s) !== s) continue;
        if (keys.has(s)) { same.push(s); continue; }
        if (/\b(the|and|with|your|this|that|must|when|should|before|after|because|only|are|from|into|check|not|open)\b/i.test(s)) miss.push(s); }
      return { total: seen.length, miss, ar, same };
    }, { seen: [...seen], L });
    console.log(`== ${L}: nodes=${res.total} not-in-keys=${res.miss.length} kept-english=${res.same.length} arabic-leak=${res.ar.length}`);
    res.miss.slice(0, 25).forEach((s) => console.log('   MISS  ' + s.slice(0, 110)));
    res.same.slice(0, 12).forEach((s) => console.log('   SAME  ' + s.slice(0, 90)));
    res.ar.slice(0, 5).forEach((s) => console.log('   AR    ' + s.slice(0, 80)));
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
  await b.close();
})();
