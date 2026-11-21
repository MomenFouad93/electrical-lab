/* Optional online AI helper. Everything works without it. The key stays in this browser only. */
(function (g) {
  const EL = g.EL;
  const AI = (EL.ai = {});
  const K = 'ellab.ai';
  let cfg = { key: '', model: 'claude-sonnet-5-5', url: 'https://api.anthropic.com/v1/messages' };
  try { const s = localStorage.getItem(K); if (s) cfg = Object.assign(cfg, JSON.parse(s)); } catch (e) {}
  AI.cfg = () => cfg;
  AI.save = (o) => { cfg = Object.assign(cfg, o); try { localStorage.setItem(K, JSON.stringify(cfg)); } catch (e) {} };
  AI.ready = () => !!(cfg.key && cfg.key.length > 20);

  AI.SYSTEM = 'You are a senior electrical, automation and electronics engineer with 25 years in pharmaceutical manufacturing (GMP). ' +
    'You help engineers and factory technicians. Be concrete and short. Reference IEC 60364, IEC 60204-1, IEC 60947, IEC 61439, ISO 13849 and ISO 13850 where they apply. ' +
    'Say what you are sure of and what is an assumption. Name the measurement that would confirm each suspicion, and the safe way to do it. Always require isolation and lock out (LOTO) before hands-on work on a live circuit. ' +
    'Never invent facts about a specific product; say when you need the datasheet or the nameplate.';

  /* a compact text description of a drawing */
  AI.describe = function (c) {
    const D = EL.defs, uf = new EL.UF(), L = [];
    for (const w of c.wires) { if (w.cut && !w.hidden) continue; uf.add(w.a); uf.add(w.b); uf.union(w.a, w.b); }
    L.push('PARTS:');
    for (const p of c.parts) {
      const d = D[p.type]; if (!d) continue;
      const pr = (d.props || []).filter((x) => x.t !== 'text').map((x) => x.k + '=' + p.props[x.k]).join(', ');
      L.push('- ' + p.tag + ': ' + d.name[0] + (pr ? ' (' + pr + ')' : '') + (p.fault && p.fault !== 'none' && !p.hid ? ' [fault: ' + p.fault + ']' : ''));
    }
    const nets = new Map();
    for (const w of c.wires) { if (w.cut && !w.hidden) continue; for (const r of [w.a, w.b]) { const n = uf.find(r); if (!nets.has(n)) nets.set(n, new Set()); nets.get(n).add(EL.refLabel(c, r)); } }
    L.push('CONNECTIONS (each line is one electrical node; every terminal listed is joined):');
    let i = 1; for (const s of nets.values()) L.push('N' + i++ + ': ' + [...s].join(', '));
    return L.join('\n');
  };

  AI.ask = async function (messages, o) {
    o = o || {};
    if (!AI.ready()) throw new Error(EL.tr(['Add your API key first.', 'حط مفتاح الـAPI الأول.']));
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), o.timeout || 60000);
    let res;
    try {
      res = await fetch(cfg.url, {
        method: 'POST', signal: ctl.signal,
        headers: { 'content-type': 'application/json', 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: cfg.model, max_tokens: o.max || 1400, system: o.system || AI.SYSTEM, messages }),
      });
    } catch (e) {
      throw new Error(EL.tr(['Could not reach the AI service. Check the internet connection. Company networks often block it.', 'مقدرتش أوصل لخدمة الذكاء الاصطناعي. اتأكد من النت. شبكات الشركات غالبا بتحجبها.']));
    } finally { clearTimeout(to); }
    let j = null; try { j = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error((j && j.error && j.error.message) || 'HTTP ' + res.status);
    return (j.content || []).filter((x) => x.type === 'text').map((x) => x.text).join('\n').trim();
  };
  AI.lang = () => (EL.lang === 'ar' ? 'Answer in Egyptian Arabic (technical terms may stay in English).' : EL.lang === 'en' ? 'Answer in English.' : 'Answer in ' + EL.langInfo().ai + ' (technical terms and standard names may stay in English).');
})(typeof window !== 'undefined' ? window : globalThis);
