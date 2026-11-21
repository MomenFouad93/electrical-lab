/* UI base: DOM helper, i18n, toast, sound */
(function (g) {
  const EL = g.EL;
  const ui = (EL.ui = EL.ui || {});
  ui.refreshers = [];
  ui.onRefresh = (f) => ui.refreshers.push(f);

  EL.h = function (tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) for (const k of Object.keys(attrs)) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (let i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  };
  function add(el, k) {
    if (k == null || k === false) return;
    if (Array.isArray(k)) k.forEach((x) => add(el, x));
    else if (k.nodeType) el.appendChild(k);
    else el.appendChild(document.createTextNode(String(k)));
  }
  const h = EL.h;
  ui.$ = (s, r) => (r || document).querySelector(s);
  ui.$$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const T = (a) => EL.tr(a);
  ui.T = T;

  /* static text: data-t="English|عربي" */
  ui.applyStatic = function () {
    for (const el of ui.$$('[data-t]')) {
      const [en, ar] = el.dataset.t.split('|');
      el.textContent = EL.tr([en, ar || en]);
    }
    for (const el of ui.$$('[data-ph]')) {
      const [en, ar] = el.dataset.ph.split('|');
      el.placeholder = EL.tr([en, ar || en]);
    }
    for (const el of ui.$$('[data-ti]')) {
      const [en, ar] = el.dataset.ti.split('|');
      el.title = EL.tr([en, ar || en]);
    }
    const li = EL.langInfo();
    document.documentElement.lang = li.bcp;
    document.documentElement.dir = li.rtl ? 'rtl' : 'ltr';
    document.documentElement.dataset.lang = li.c;
    if (ui.syncLang) ui.syncLang();
  };
  ui.setLang = function (l) {
    if (!EL.langs.some((x) => x.c === l)) l = 'en';
    EL.lang = l;
    try { localStorage.setItem('ellab.lang', l); } catch (e) {}
    ui.applyStatic();
    ui.refreshers.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  };

  /* toasts */
  ui.toast = function (msg, kind, ms) {
    const host = ui.$(ui.view && ui.view() === 'pcb' ? '#ptoasts' : ui.view && ui.view() === 'prog' ? '#gtoasts' : '#toasts');
    if (!host) return;
    const t = h('div', { class: 'toast ' + (kind || ''), text: Array.isArray(msg) ? T(msg) : msg });
    host.appendChild(t);
    while (host.children.length > 3) host.removeChild(host.firstChild);
    setTimeout(() => t.remove(), ms || 4200);
    ui.log(Array.isArray(msg) ? T(msg) : msg, kind);
  };
  ui.logs = [];
  ui.log = function (m, kind) {
    ui.logs.push({ t: Date.now(), m, kind });
    if (ui.logs.length > 60) ui.logs.shift();
    if (ui.onLog) ui.onLog();
  };

  /* sound (WebAudio, started on first touch) */
  let ac = null, osc = null, gain = null;
  ui.muted = false;
  function ctx() {
    if (!ac) { try { ac = new (g.AudioContext || g.webkitAudioContext)(); } catch (e) { ac = false; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  ui.unlockAudio = ctx;
  ui.click = function () {
    const a = ui.muted ? null : ctx(); if (!a) return;
    const o = a.createOscillator(), gn = a.createGain();
    o.type = 'square'; o.frequency.value = 180; gn.gain.value = 0.05;
    o.connect(gn); gn.connect(a.destination); o.start(); gn.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.06); o.stop(a.currentTime + 0.07);
  };
  ui.beep = function (on) {
    const a = ui.muted ? null : ctx(); if (!a) return;
    if (on && !osc) {
      osc = a.createOscillator(); gain = a.createGain();
      osc.type = 'sine'; osc.frequency.value = 2400; gain.gain.value = 0.06;
      osc.connect(gain); gain.connect(a.destination); osc.start();
    } else if (!on && osc) { try { osc.stop(); } catch (e) {} osc.disconnect(); osc = null; }
  };
  ui.buzz = function (ms) {
    const a = ui.muted ? null : ctx(); if (!a) return;
    const o = a.createOscillator(), gn = a.createGain();
    o.type = 'sawtooth'; o.frequency.value = 110; gn.gain.value = 0.05;
    o.connect(gn); gn.connect(a.destination); o.start(); o.stop(a.currentTime + (ms || 300) / 1000);
  };

  ui.modal = function (content) {
    const m = h('div', { class: 'modal', onclick: (e) => { if (e.target === m) m.remove(); } }, h('div', { class: 'box' }, h('button', { class: 'mx', 'aria-label': 'close', title: ui.T(['Close', 'اقفل']), onclick: () => m.remove(), text: '✕' }), content));
    document.body.appendChild(m);
    return m;
  };
  ui.download = function (name, text, type) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: type || 'application/json' })), download: name });
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
})(typeof window !== 'undefined' ? window : globalThis);
