/* App: tabs, language, main loop */
(function (g) {
  const EL = g.EL, ui = EL.ui, $ = ui.$;
  let view = 'bench';
  ui.view = () => view;
  ui.activeEd = () => (view === 'bench' || view === 'prog' ? EL.bench.ed : view === 'pcb' && EL.pcb ? EL.pcb.ed : null);
  ui.show = function (v) {
    const prev = view; view = v;
    for (const t of ui.$$('#tabs .tab')) t.classList.toggle('on', t.dataset.v === v);
    for (const s of ui.$$('main .view')) s.classList.toggle('on', s.id === 'v-' + v);
    if ((v === 'bench' || v === 'pcb') && prev !== v) {
      EL.inst.probes = { red: null, black: null, clamp: null, ncv: null };
      const ed = ui.activeEd();
      if (ed) requestAnimationFrame(() => { ed.applyView(); if (!ed._fitted) { ed._fitted = true; ed.fit(); } });
      if (ui.inst) ui.inst.mount(v === 'bench' ? $('#pane-meters') : $('#ppane-meters'));
      if (v === 'pcb' && EL.pcb && EL.pcb.onShow) EL.pcb.onShow();
    }
    if (v === 'loto' && EL.loto) EL.loto.onShow();
    if (v === 'mech' && EL.mechUI) EL.mechUI.onShow();
    if (v === 'inspect' && EL.inspect) EL.inspect.onShow();
    if (v === 'guide' && EL.guide) EL.guide.onShow();
    if (v === 'projects' && EL.projects && EL.projects.onShow) EL.projects.onShow();
    if (v === 'prog' && ui.ladder) ui.ladder.onShow();
    try { localStorage.setItem('ellab.view', v); } catch (e) {}
  };
  function loop(t) {
    try { if (view === 'bench' || view === 'pcb' || view === 'prog') EL.bench.frame(t); if (view === 'prog' && ui.ladder) ui.ladder.frame(); } catch (e) { console.error(e); if (!loop.err) { loop.err = 1; ui.toast('Error: ' + e.message, 'bad', 9000); } }
    requestAnimationFrame(loop);
  }
  g.addEventListener('DOMContentLoaded', () => {
    let lang = '';
    try { lang = localStorage.getItem('ellab.lang') || ''; } catch (e) {}
    if (!EL.langs.some((x) => x.c === lang)) lang = EL.detectLang();
    EL.lang = lang;
    ui.initLangMenu($('#btnLang'));
    ui.applyStatic();
    for (const t of ui.$$('#tabs .tab')) t.addEventListener('click', () => ui.show(t.dataset.v));
    EL.bench.init();
    if (ui.panels) ui.panels.init();
    if (ui.plant) ui.plant.init();
    if (ui.line) ui.line.init();
    if (ui.ladder) ui.ladder.init();
    if (EL.projects && EL.projects.init) EL.projects.init();
    if (ui.inst) { ui.inst.init(); ui.inst.mount($('#pane-meters')); }
    if (ui.assist) ui.assist.init();
    if (EL.loto) EL.loto.init();
    if (EL.mechUI) EL.mechUI.init();
    if (EL.pcb) EL.pcb.init();
    if (EL.inspect) EL.inspect.init();
    if (EL.guide) EL.guide.init();
    if (ui.diag) {
      ui.diag.attach('bench', EL.bench.ed, $('#pane-diag'), () => EL.bench.openPane('diag'));
      if (EL.pcb && EL.pcb.ed) ui.diag.attach('pcb', EL.pcb.ed, $('#ppane-diag'), () => { EL.pcb.pane('diag'); if (window.innerWidth <= 900 && !$('#pside').classList.contains('open')) EL.pcb.sheet('side'); });
      $('#btnDiag').addEventListener('click', () => ui.diag.open('bench'));
    }
    requestAnimationFrame(() => { EL.bench.ed.fit(); EL.bench.ed._fitted = true; });
    requestAnimationFrame(loop);
    g.addEventListener('error', (e) => { try { ui.toast('Error: ' + e.message, 'bad', 9000); } catch (x) {} });
  });
})(typeof window !== 'undefined' ? window : globalThis);
