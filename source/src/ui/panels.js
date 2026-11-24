/* Hide / show the left (parts) and right (part, meters, diagnosis) columns of the bench on a laptop,
   so the drawing gets the whole width. Remembered in localStorage (ellab.panels). Phones use sheets instead. */
(function (g) {
  const EL = g.EL, ui = EL.ui, h = EL.h, T = ui.T, $ = ui.$;
  const P = (ui.panels = {});
  const KEY = 'ellab.panels';
  const icon = (right) => '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M' + (right ? 15 : 9) + ' 4v16"/></svg>';
  let st = null, bench, bl, br;
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function refit() {
    requestAnimationFrame(() => {
      const B = EL.bench;
      if (B.view === 'plant' && ui.plant) ui.plant.fit();
      else if (B.view === 'line' && ui.line) ui.line.fit();
      else if (B.ed && B.ed.fit) B.ed.fit();
    });
  }
  function apply() {
    bench.classList.toggle('hideL', !!st.l); bench.classList.toggle('hideR', !!st.r);
    bl.classList.toggle('on', !st.l); br.classList.toggle('on', !st.r);
    bl.setAttribute('aria-pressed', st.l ? 'false' : 'true'); br.setAttribute('aria-pressed', st.r ? 'false' : 'true');
    bl.title = T(st.l ? ['Show the parts list', 'اظهر قايمة الأجهزة'] : ['Hide the parts list', 'اخفي قايمة الأجهزة']);
    br.title = T(st.r ? ['Show the side panel (part, meters, diagnosis)', 'اظهر اللوحة الجانبية (الجهاز، الأجهزة، الدايجنوسس)'] : ['Hide the side panel', 'اخفي اللوحة الجانبية']);
    bl.setAttribute('aria-label', bl.title); br.setAttribute('aria-label', br.title);
  }
  P.toggle = function (side) { st[side] = !st[side]; save(); apply(); refit(); };
  P.show = function (side) { if (st && st[side]) P.toggle(side); };
  P.state = () => Object.assign({}, st);
  P.init = function () {
    bench = $('#v-bench .bench'); const tb = $('#v-bench .tb');
    if (!bench || !tb) return;
    const w = g.innerWidth || 1400;
    st = load() || { l: false, r: w < 1000 }; // the parts list is the bench: shown by default
    bl = h('button', { class: 'btn pnl-btn', type: 'button', html: icon(false), onclick: () => P.toggle('l') });
    br = h('button', { class: 'btn pnl-btn', type: 'button', html: icon(true), onclick: () => P.toggle('r') });
    tb.insertBefore(bl, tb.firstChild); tb.appendChild(br);
    apply();
    ui.onRefresh(apply);
  };
})(typeof window !== 'undefined' ? window : globalThis);
