/* Cycles panel beside the plant: start-up, drain, washes and sanitisations of a station with an HMI (CTRL) unit.
   The panel only shows the engine state (EL.water.cyc*); timers are simulated time. */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, $ = ui.$;
  const PL = EL.plant, W = () => EL.water;
  const CU = (ui.cycles = { open: true, min: false, sel: null });
  let host, box, hd, bd, tbtn, sig = '', live = [], estT = 0, estCache = {};

  const C = () => EL.bench.ed.c;
  const ctrl = () => { const c = C(); return c && c.plant && W() ? W().ctrl(c.plant) : null; };
  const pad = (n) => String(Math.floor(n)).padStart(2, '0');
  const hms = (s) => { s = Math.max(0, Math.round(s || 0)); return pad(s / 3600) + ':' + pad((s % 3600) / 60) + ':' + pad(s % 60); };
  const dur = (s) => { s = Math.max(0, s || 0); if (s < 90) return Math.round(s) + ' s'; if (s < 5400) return Math.round(s / 60) + ' min'; return (s / 3600).toFixed(1) + ' h'; };
  const L = (txt, cls, key) => { const el = h('span', { class: cls || '', text: txt }); if (key) live.push([el, key]); return el; };

  CU.init = function (hostEl) {
    host = hostEl;
    CU.min = (g.innerWidth || 1000) <= 700 || (g.innerHeight || 800) <= 500; // phones: start as a slim bar so the plant stays visible
    box = h('div', { class: 'pl-cyc', id: 'plCyc', role: 'region', 'aria-label': 'Cycles' });
    hd = h('button', { class: 'pl-cyc-hd', type: 'button', onclick: () => { CU.min = !CU.min; sig = ''; CU.update(true); } });
    bd = h('div', { class: 'pl-cyc-bd' });
    box.append(hd, bd);
    host.appendChild(box);
    ui.onRefresh(() => { sig = ''; CU.update(true); });
    CU.update(true);
  };
  /* the "Cycles" button in the plant toolbar */
  CU.toolButton = function () {
    tbtn = h('button', { class: 'btn sm', onclick: () => { CU.open = !CU.open; CU.min = false; sig = ''; CU.update(true); }, text: T(['Cycles', 'الدورات']) });
    return tbtn;
  };

  function setSpeed(s) {
    const B = EL.bench;
    if (s >= 300 && C().parts.length) s = 60; // fast steps only for a process-only project
    B.speed = s; B.paused = false;
    const b = $('#btnSpeed'); if (b) b.textContent = s + 'x';
    const p = $('#btnPause'); if (p) p.classList.remove('on');
    sig = ''; CU.update(true);
  }
  function speedRow() {
    const B = EL.bench, row = h('div', { class: 'pl-cyc-spd' }, h('span', { class: 'mute sm', text: T(['Speed', 'السرعة']) }));
    for (const s of [1, 20, 60, 300]) if (!(s >= 300 && C().parts.length)) row.appendChild(h('button', { class: 'btn xs' + (B.speed === s && !B.paused ? ' on' : ''), onclick: () => setSpeed(s), text: s + 'x' }));
    return row;
  }

  function stepsOf(u, id) { try { return W().cycSteps(C(), u, id); } catch (e) { return []; } }

  CU.update = function (force) {
    if (!box) return;
    const u = ctrl(), Wt = W(), view = EL.bench.view === 'plant';
    if (tbtn) tbtn.style.display = u ? '' : 'none';
    box.style.display = u && view && CU.open ? '' : 'none';
    if (!u || !view || !CU.open) return;
    const st = u.state, run = Wt.cycRunning(u), now = performance.now();
    if (!run && !st.cyDone && (now - estT > 4000 || force)) { estT = now; estCache = {}; for (const cy of Wt.CYC) if (Wt.cycAvail(C(), u, cy)) estCache[cy.id] = Wt.cycEst(C(), u, cy.id); }
    const s = [EL.lang, CU.min, CU.sel, st.cyN || 0, st.cyI || 0, st.cyDone || 0, st.cyLate || 0, EL.bench.speed, EL.bench.paused, C().parts.length, u.id].join('|');
    if (force || s !== sig) { sig = s; build(u); }
    // live numbers
    for (const [el, k] of live) {
      let v = '';
      if (k === 'T') v = hms(st.cyT);
      else if (k === 'Ts') v = hms(st.cyTs);
      else if (k === 'tot') v = '≈ ' + dur(totalEst(u));
      else if (k === 'bar') { el.style.width = Math.round(100 * progress(u)) + '%'; continue; }
      else if (k.startsWith('e:')) { const e = estCache[k.slice(2)]; v = e ? '≈ ' + dur(e.reduce((a, b) => a + b, 0)) : ''; }
      if (el.textContent !== v) el.textContent = v;
    }
  };
  function totalEst(u) {
    const st = u.state, n = stepsOf(u, W().cycRunning(u).id).length; let t = 0;
    for (let i = 0; i < n; i++) t += i < st.cyI ? st['cs' + i] || 0 : i === st.cyI ? Math.max(st['ce' + i] || 0, st.cyTs || 0) : st['cp' + i] || 0;
    return t;
  }
  function progress(u) { const t = totalEst(u); return t > 0 ? Math.min(1, (u.state.cyT || 0) / t) : 0; }

  let lastMode = '';
  function build(u) {
    const keep = bd.scrollTop;
    live = []; bd.innerHTML = '';
    const m0 = u.state.cyN ? 'run' + u.state.cyN : u.state.cyDone ? 'rep' : CU.sel ? 'det' + CU.sel : 'list';
    const same = m0 === lastMode; lastMode = m0;
    requestAnimationFrame(() => { // new view: back to the top; a running cycle keeps its current step in view
      const now = bd.querySelector('li.now');
      const tp = bd.querySelector('.pl-cyc-run');
      if (now) bd.scrollTop = Math.max(0, now.offsetTop - bd.offsetTop - (tp ? tp.offsetHeight : 0) - 12); else bd.scrollTop = same ? keep : 0;
    });
    const Wt = W(), st = u.state, run = Wt.cycRunning(u);
    hd.innerHTML = '';
    const nSteps = run ? stepsOf(u, run.id).length : 0;
    hd.append(h('b', { text: T(['Cycles', 'الدورات']) }), run ? h('span', { class: 'pl-cyc-clock' }, L('', 'ltr', 'T'), h('span', { class: 'pl-cyc-stepn', text: T(['step', 'خطوة']) + ' ' + ((st.cyI || 0) + 1) + '/' + nSteps })) : h('span', { class: 'mute sm', text: T(['start-up, drain, wash, sanitise', 'تشغيل، تصفية، غسيل، تعقيم']) }), h('span', { class: 'pl-cyc-chev', 'aria-hidden': 'true', text: CU.min ? '▴' : '▾' }));
    hd.setAttribute('aria-expanded', CU.min ? 'false' : 'true');
    box.classList.toggle('min', CU.min);
    if (CU.min) return;
    if (run) return buildRun(u, run);
    if (st.cyDone) return buildReport(u);
    if (CU.sel) { const cy = Wt.CYC.find((k) => k.id === CU.sel); if (cy && Wt.cycAvail(C(), u, cy)) return buildDetail(u, cy); CU.sel = null; }
    const groups = Object.keys(Wt.CYGRP).filter((gk) => Wt.CYC.some((k) => k.grp === gk && Wt.cycAvail(C(), u, k)));
    if (!groups.includes(CU.grp)) CU.grp = groups[0];
    const tabs = h('div', { class: 'pl-cyc-tabs', role: 'tablist' });
    for (const gk of groups) tabs.appendChild(h('button', { class: 'pl-cyc-tab' + (gk === CU.grp ? ' on' : ''), role: 'tab', 'aria-selected': gk === CU.grp ? 'true' : 'false', type: 'button', onclick: () => { CU.grp = gk; sig = ''; CU.update(true); }, text: T(Wt.CYGRP[gk]) }));
    bd.appendChild(tabs);
    for (const gk of [CU.grp]) {
      const cs = Wt.CYC.filter((k) => k.grp === gk && Wt.cycAvail(C(), u, k));
      for (const cy of cs) bd.appendChild(h('button', { class: 'pl-cyc-item', type: 'button', onclick: () => { CU.sel = cy.id; sig = ''; CU.update(true); } }, h('span', { text: T(cy.name) }), L('', 'mute sm ltr', 'e:' + cy.id)));
    }
    bd.appendChild(speedRow());
  }

  function buildDetail(u, cy) {
    const Wt = W(), steps = stepsOf(u, cy.id), est = Wt.cycEst(C(), u, cy.id), tot = est.reduce((a, b) => a + b, 0);
    bd.append(h('div', { class: 'pl-cyc-title', text: T(cy.name) }), h('p', { class: 'sm', text: T(cy.desc) }));
    const ol = h('ol', { class: 'pl-cyc-steps' });
    steps.forEach((s, i) => ol.appendChild(h('li', null, h('span', { text: T(s.n) }), h('span', { class: 'mute sm ltr', text: '≈ ' + dur(est[i]) }))));
    bd.append(ol, h('div', { class: 'kv' }, h('span', { text: T(['Estimated total', 'الوقت المتوقع كله']) }), h('b', { class: 'ltr', text: dur(tot) })));
    bd.appendChild(h('div', { class: 'row wrap' },
      h('button', { class: 'btn pri', onclick: () => start(u, cy), text: '▶ ' + T(['Start', 'ابدأ']) }),
      h('button', { class: 'btn', onclick: () => { CU.sel = null; sig = ''; CU.update(true); }, text: T(['Back', 'رجوع']) })));
    bd.appendChild(speedRow());
    bd.appendChild(h('p', { class: 'mute sm', text: T(['Timers run on simulated time: use 300x for the long ones.', 'التايمرات بزمن المحاكاة: استخدم 300x للدورات الطويلة.']) }));
  }
  function start(u, cy) {
    const B = EL.bench;
    if (B.ed.push) B.ed.push();
    if (!W().cycStart(C(), u, cy.id)) { ui.toast(T(['This cycle cannot start now.', 'الدورة دي مش هتبدأ دلوقتي.']), 'warn'); return; }
    CU.sel = null; ui.click();
    if (B.paused) setSpeed(B.speed); else { sig = ''; CU.update(true); }
    if (B.save) B.save();
  }

  function buildRun(u, cy) {
    const st = u.state, steps = stepsOf(u, cy.id), cur = steps[st.cyI || 0];
    // the running dashboard stays on top while the step list scrolls under it
    const top = h('div', { class: 'pl-cyc-run' },
      h('div', { class: 'pl-cyc-title', text: T(cy.name) }),
      h('div', { class: 'pl-cyc-big' }, L('', 'ltr', 'T'), h('span', { class: 'mute sm' }, T(['estimate', 'المتوقع']) + ' ', L('', 'ltr', 'tot'))),
      h('div', { class: 'pl-cyc-prog' }, L('', '', 'bar')),
      cur ? h('div', { class: 'pl-cyc-cur' }, h('b', { text: T(['Step', 'الخطوة']) + ' ' + ((st.cyI || 0) + 1) + '/' + steps.length }), h('span', { class: 'ltr' }, L('', '', 'Ts'), ' / ≈ ' + dur(st['ce' + (st.cyI || 0)]))) : null,
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn sm', onclick: () => { W().cycSkip(u); ui.click(); }, text: '⏭ ' + T(['Skip step', 'تخطّى الخطوة']) }),
        h('button', { class: 'btn sm bad', onclick: () => { W().cycStop(C(), u); sig = ''; CU.update(true); EL.bench.save(); }, text: '■ ' + T(['Stop cycle', 'وقّف الدورة']) })),
      speedRow());
    bd.appendChild(top);
    if (st.cyLate) bd.appendChild(h('p', { class: 'pl-prob warn', text: T(['This step is taking much longer than its estimate. Check the process check list and the alarms.', 'الخطوة دي واخدة وقت أطول بكتير من المتوقع. شوف فحص العملية والإنذارات.']) }));
    const ol = h('ol', { class: 'pl-cyc-steps' });
    steps.forEach((s, i) => {
      const cls = i < st.cyI ? 'done' : i === st.cyI ? 'now' : '';
      const right = i < st.cyI ? h('span', { class: 'sm ltr', text: dur(st['cs' + i]) + ' / ≈ ' + dur(st['ce' + i]) + (st['cx' + i] ? ' ⏭' : '') })
        : i === st.cyI ? h('span', { class: 'sm ltr' }, L('', '', 'Ts'), ' / ≈ ' + dur(st['ce' + i]))
          : h('span', { class: 'mute sm ltr', text: '≈ ' + dur(st['cp' + i]) });
      ol.appendChild(h('li', { class: cls, 'aria-current': i === st.cyI ? 'step' : null }, h('span', { text: T(s.n) }), right));
    });
    bd.appendChild(ol);
  }

  function buildReport(u) {
    const Wt = W(), st = u.state, cy = Wt.CYC[st.cyDone - 1];
    if (!cy) { Wt.cycClear(u); sig = ''; return; }
    const steps = stepsOf(u, cy.id);
    let tot = 0, est = 0; steps.forEach((s, i) => { tot += st['cs' + i] || 0; est += st['ce' + i] || 0; });
    bd.append(h('div', { class: 'pl-cyc-title', text: T(cy.name) }),
      h('p', { class: st.cyAb ? 'pl-prob warn' : 'pl-prob info', text: st.cyAb ? T(['Stopped before the end.', 'اتوقفت قبل ما تخلص.']) : T(['Complete.', 'خلصت.']) }));
    const row = (k, v) => bd.appendChild(h('div', { class: 'kv' }, h('span', { text: T(k) }), h('b', { class: 'ltr', text: v })));
    row(['Total time', 'الوقت كله'], hms(st.cyT) + '  (≈ ' + dur(est) + ')');
    const ol = h('ol', { class: 'pl-cyc-steps' });
    steps.forEach((s, i) => { if (st['cs' + i] == null) return; ol.appendChild(h('li', { class: 'done' }, h('span', { text: T(s.n) }), h('span', { class: 'sm ltr', text: dur(st['cs' + i]) + ' / ≈ ' + dur(st['ce' + i]) + (st['cx' + i] ? ' ⏭' : '') }))); });
    bd.appendChild(ol);
    if (st.cyKh > 0.05) row(['Steam (heating)', 'البخار (تسخين)'], st.cyKh.toFixed(1) + ' kWh');
    if (st.cyKc > 0.05) row(['Chilled water (cooling)', 'المية المتلجة (تبريد)'], st.cyKc.toFixed(1) + ' kWh');
    if (st.cyDr > 0.5) row(['Water to drain', 'مية راحت الصرف'], Math.round(st.cyDr) + ' L');
    if (st.cyPo > 0.5) row(['Water from the points of use', 'مية من نقط الاستخدام'], Math.round(st.cyPo) + ' L');
    bd.appendChild(h('p', { class: 'mute sm', text: T(['Estimates are hand calculations (Torricelli, m·4.186·ΔT/kW, volume/flow). The simulator also counts pipe friction, heat losses and controls, so the real timer differs a little: that difference is worth discussing.', 'التقديرات حسابات باليد (تورشيللي، الكتلة×4.186×فرق الحرارة÷الكيلووات، الحجم÷الفلو). المحاكي بيحسب كمان احتكاك المواسير وفقد الحرارة والتحكم، فالتايمر الحقيقي بيفرق شوية: والفرق ده يستاهل نتكلم فيه.']) }));
    bd.appendChild(h('div', { class: 'row wrap' }, h('button', { class: 'btn pri', onclick: () => { Wt.cycClear(u); sig = ''; CU.update(true); }, text: T(['Close report', 'اقفل التقرير']) })));
  }
})(typeof window !== 'undefined' ? window : globalThis);
