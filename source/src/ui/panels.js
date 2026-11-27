/* Hide / show the left and right columns of every work view on a laptop (Bench, PCB, Programming, Mechanical),
   so the drawing gets the whole width. Each view gets two edge handles on the drawing; the bench also keeps
   its toolbar buttons. Remembered per view in localStorage (ellab.panels). Phones use sheets instead. */
(function (g) {
  const EL = g.EL, ui = EL.ui, h = EL.h, T = ui.T, $ = ui.$;
  const P = (ui.panels = {});
  const KEY = 'ellab.panels';
  const icon = (right) => '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M' + (right ? 15 : 9) + ' 4v16"/></svg>';
  const chev = '<svg viewBox="0 0 12 24" width="12" height="24" aria-hidden="true"><path d="M8 5 L3 12 L8 19" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let all = {};
  const views = {};
  function load() { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && typeof v === 'object') return v; } catch (e) {} return {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {} }
  function stOf(id) {
    if (!all[id] || typeof all[id] !== 'object') all[id] = { l: false, r: id === 'bench' && (g.innerWidth || 1400) < 1000 };
    return all[id];
  }
  function apply(id) {
    const v = views[id]; if (!v) return; const st = stOf(id);
    v.lay.classList.toggle('hideL', !!st.l); v.lay.classList.toggle('hideR', !!st.r);
    const tl = T(st.l ? (v.lt || ['Show the list', 'اظهر القايمة']) : ['Hide the list', 'اخفي القايمة']);
    const trr = T(st.r ? (v.rt || ['Show the side panel', 'اظهر اللوحة الجانبية']) : ['Hide the side panel', 'اخفي اللوحة الجانبية']);
    for (const [b, closed, t] of [[v.hl, st.l, tl], [v.hr, st.r, trr], [v.bl, st.l, tl], [v.br, st.r, trr]]) {
      if (!b) continue; b.title = t; b.setAttribute('aria-label', t); b.setAttribute('aria-pressed', closed ? 'false' : 'true'); b.classList.toggle('on', !closed); b.classList.toggle('closed', !!closed);
    }
  }
  function refit(id) { const v = views[id]; if (v && v.refit) requestAnimationFrame(() => { try { v.refit(); } catch (e) {} }); }
  P.toggle = function (side, id) { id = id || 'bench'; const st = stOf(id); st[side] = !st[side]; save(); apply(id); refit(id); };
  P.show = function (side, id) { id = id || 'bench'; if (stOf(id)[side]) P.toggle(side, id); };
  P.state = (id) => Object.assign({}, stOf(id || 'bench'));
  /* attach handles to a 3-column layout; safe to call again after the stage is rebuilt */
  P.attach = function (id, lay, stage, o) {
    if (!lay || !stage) return; o = o || {};
    const v = (views[id] = Object.assign(views[id] || {}, { lay, refit: o.refit, lt: o.lt, rt: o.rt }));
    if (!v.hl || !stage.contains(v.hl)) {
      v.hl = h('button', { class: 'fold-h fold-l', type: 'button', html: chev, onclick: () => P.toggle('l', id) });
      v.hr = h('button', { class: 'fold-h fold-r', type: 'button', html: chev, onclick: () => P.toggle('r', id) });
      stage.append(v.hl, v.hr);
    }
    lay.classList.add('foldable');
    apply(id);
  };
  P.sync = function () { for (const id in views) apply(id); };
  P.init = function () {
    all = load();
    if (all && (typeof all.l === 'boolean' || typeof all.r === 'boolean')) all = { bench: { l: !!all.l, r: !!all.r } }; // old format (bench only)
    const bench = $('#v-bench .bench'), tb = $('#v-bench .tb');
    if (bench && tb) {
      const v = (views.bench = { lay: bench });
      v.bl = h('button', { class: 'btn pnl-btn', type: 'button', html: icon(false), onclick: () => P.toggle('l', 'bench') });
      v.br = h('button', { class: 'btn pnl-btn', type: 'button', html: icon(true), onclick: () => P.toggle('r', 'bench') });
      tb.insertBefore(v.bl, tb.firstChild); tb.appendChild(v.br);
      P.attach('bench', bench, $('#v-bench .stage'), {
        lt: ['Show the parts list', 'اظهر قايمة الأجهزة'], rt: ['Show the side panel (part, meters, diagnosis)', 'اظهر اللوحة الجانبية (الجهاز، الأجهزة، الدايجنوسس)'],
        refit: () => { const B = EL.bench; if (B.view === 'plant' && ui.plant) ui.plant.fit(); else if (B.view === 'line' && ui.line) ui.line.fit(); else if (B.ed && B.ed.fit) B.ed.fit(); },
      });
    }
    P.attach('pcb', $('#v-pcb .bench'), $('#v-pcb .stage'), { refit: () => { if (EL.pcb && EL.pcb.ed && EL.pcb.ed.fit) EL.pcb.ed.fit(); } });
    P.attach('prog', $('#v-prog .prog'), $('#v-prog .stage'), { lt: ['Show the instructions', 'اظهر الأوامر'], refit: () => { if (ui.ladder && ui.ladder.onShow) ui.ladder.onShow(); } });
    ui.mpanels = { sync: () => { const r = $('#mechRoot'), s = r && r.querySelector('.m-stage'); if (r && s) P.attach('mech', r, s, { lt: ['Show the parts library', 'اظهر مكتبة القطع'], rt: ['Show the explanation', 'اظهر الشرح'] }); } };
    ui.onRefresh(P.sync);
  };
})(typeof window !== 'undefined' ? window : globalThis);
