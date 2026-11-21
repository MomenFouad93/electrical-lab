// structural check of every LOTO detail inside the built page
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('file:///home/claude/lab/dist/electrical-lab.html'); await p.waitForTimeout(400);
  const res = await p.evaluate(() => {
    const out = []; const DT = EL.lotoDet, L = EL.lotoData;
    const bad = (id, m) => out.push(id + ': ' + m);
    const isStr = (x) => typeof x === 'string' && x.trim().length > 0;
    const pair = (id, name, a) => { if (!Array.isArray(a) || !isStr(a[0]) || !isStr(a[1])) bad(id, 'missing bilingual ' + name); };
    for (const d of DT.list) {
      const id = d.id;
      pair(id, 'name', d.name); pair(id, 'simple', d.simple);
      if (!L.ICON[d.icon]) bad(id, 'icon missing ' + d.icon);
      if (d.lock) d.lock.forEach((x, i) => pair(id, 'lock' + i, x));
      if (d.prove) d.prove.forEach((x, i) => pair(id, 'prove' + i, x));
      if (d.mistakes) d.mistakes.forEach((x, i) => pair(id, 'mistake' + i, x));
      if (d.std) pair(id, 'std', d.std);
      if (d.state) d.state.forEach((x, i) => pair(id, 'state' + i, x));
      if (!d.lock || !d.lock.length) { if (d.cls === 'iso') bad(id, 'no lock steps'); }
      const states = [];
      for (const inside of (d.hasInside === false ? [0] : [0, 1])) for (const lock of [0, 1]) for (const k of (d.multi ? [0, 1, 2] : [0, 1])) states.push({ inside: !!inside, lock: !!lock, on: d.multi ? k === 0 : !!k, k });
      for (const st of states) {
        let svg; try { svg = d.draw(st); } catch (e) { bad(id, 'draw threw ' + e.message + ' ' + JSON.stringify(st)); continue; }
        if (/undefined|NaN|\[object/.test(svg)) bad(id, 'bad token in svg ' + JSON.stringify(st) + ' ' + (svg.match(/.{20}(undefined|NaN|\[object).{20}/) || [''])[0]);
        const sp = st.inside ? d.in : d.out; const list = (typeof sp === 'function' ? sp(st) : sp) || [];
        if (st.inside && d.hasInside === false) continue;
        list.forEach((s, i) => {
          if (!(s[0] >= 0 && s[0] <= 420 && s[1] >= 0 && s[1] <= 300)) bad(id, 'spot ' + i + ' out of box ' + s[0] + ',' + s[1] + ' ' + JSON.stringify(st));
          if (!isStr(s[2]) || !isStr(s[3]) || !isStr(s[4]) || !isStr(s[5])) bad(id, 'spot ' + i + ' not bilingual');
          if (s[6] && !DT.map[s[6]]) bad(id, 'spot link ' + s[6] + ' unknown');
          if (s[0] > 380 && s[1] < 92) bad(id, 'spot ' + i + ' under zoom buttons');
        });
        // overlapping spots
        for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) if (Math.hypot(list[i][0] - list[j][0], list[i][1] - list[j][1]) < 18) bad(id, 'spots ' + (i + 1) + ' and ' + (j + 1) + ' overlap ' + JSON.stringify(st));
      }
      if (!(d.hasInside === false) && !(d.in && (typeof d.in === 'function' || d.in.length))) bad(id, 'has inside view but no inside spots');
    }
    return { n: DT.list.length, out, ids: DT.list.map((d) => d.id).join(' ') };
  });
  console.log('details', res.n, res.ids); res.out.forEach((x) => console.log(' ', x));
  console.log(errs.length ? errs.join('\n') : 'no page errors', res.out.length ? 'ISSUES ' + res.out.length : 'ALL OK');
  await b.close();
})();
