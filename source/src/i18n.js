/* i18n: language list and English-keyed translation lookup.
   Source text everywhere is [English, Arabic]. Other languages are looked up by the English text
   in EL.I18N (built from i18n/*.json by build.js). Missing entries fall back to English. */
(function (g) {
  const EL = g.EL;
  /* c: code, n: native name, s: short label, bcp: html lang, loc: date locale, sp: speech recognition, ai: language named in AI prompts */
  EL.langs = [
    { c: 'en', n: 'English', s: 'EN', bcp: 'en', loc: 'en-GB', sp: 'en-US', ai: 'English' },
    { c: 'ar', n: 'العربية', s: 'AR', bcp: 'ar', loc: 'ar-EG', sp: 'ar-EG', ai: 'Egyptian Arabic (technical terms may stay in English)', rtl: true },
    { c: 'fr', n: 'Français', s: 'FR', bcp: 'fr', loc: 'fr-FR', sp: 'fr-FR', ai: 'French' },
    { c: 'pt', n: 'Português (Brasil)', s: 'PT', bcp: 'pt-BR', loc: 'pt-BR', sp: 'pt-BR', ai: 'Brazilian Portuguese' },
    { c: 'zh', n: '中文（简体）', s: '中文', bcp: 'zh-CN', loc: 'zh-CN', sp: 'zh-CN', ai: 'Simplified Chinese' },
    { c: 'ru', n: 'Русский', s: 'RU', bcp: 'ru', loc: 'ru-RU', sp: 'ru-RU', ai: 'Russian' },
    { c: 'pl', n: 'Polski', s: 'PL', bcp: 'pl', loc: 'pl-PL', sp: 'pl-PL', ai: 'Polish' },
    { c: 'hu', n: 'Magyar', s: 'HU', bcp: 'hu', loc: 'hu-HU', sp: 'hu-HU', ai: 'Hungarian' },
    { c: 'es', n: 'Español', s: 'ES', bcp: 'es', loc: 'es-ES', sp: 'es-ES', ai: 'Spanish' },
  ];
  EL.langInfo = (c) => EL.langs.find((l) => l.c === (c || EL.lang)) || EL.langs[0];
  EL.isRtl = () => !!EL.langInfo().rtl;
  EL.detectLang = function () {
    let arr = [];
    try { arr = (navigator.languages && navigator.languages.length ? [...navigator.languages] : [navigator.language]).filter(Boolean); } catch (e) {}
    for (const x of arr) {
      const c = String(x).toLowerCase().slice(0, 2);
      if (EL.langs.some((l) => l.c === c)) return c;
    }
    return 'en';
  };

  /* ---- lookup ---- */
  EL.I18N = EL.I18N || { keys: [] };
  let kidx = null, tpls = null;
  const memo = {};
  function index() {
    if (kidx) return;
    kidx = new Map();
    const K = EL.I18N.keys || [];
    for (let i = 0; i < K.length; i++) kidx.set(K[i], i);
    tpls = [];
    for (const t of EL.I18N.tpl || []) {
      const parts = t.en.split(/\{\d+\}/).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const re = new RegExp('^' + parts.join('([\\s\\S]+?)') + '$');
      tpls.push({ re, t, len: t.en.replace(/\{\d+\}/g, '').length, order: [...t.en.matchAll(/\{(\d+)\}/g)].map((m) => +m[1]) });
    }
    tpls.sort((a, b) => b.len - a.len);
  }
  /* translate one English string to the current language (English if there is no entry) */
  EL.tx = function (en, lang) {
    lang = lang || EL.lang;
    if (lang === 'en' || typeof en !== 'string' || !en) return en;
    index();
    const D = EL.I18N, arr = D[lang];
    if (!arr) return en;
    const i = kidx.get(en);
    if (i != null) { const v = arr[i]; return v ? v : en; }
    const mk = lang + '\u0001' + en;
    if (mk in memo) return memo[mk];
    let out = en;
    for (const p of tpls) {
      const m = p.re.exec(en);
      const tt = m && p.t[lang];
      if (tt) { out = tt.replace(/\{(\d+)\}/g, (_, n) => { const k = p.order.indexOf(+n); return k >= 0 ? EL.tx(m[k + 1], lang) : ''; }); break; }
    }
    memo[mk] = out;
    return out;
  };
  EL.tr = function (p) {
    if (Array.isArray(p)) {
      const l = EL.lang;
      if (l === 'en') return p[0];
      if (l === 'ar') return p[1] != null ? p[1] : p[0];
      return EL.tx(p[0], l);
    }
    return p;
  };
})(typeof window !== 'undefined' ? window : globalThis);
