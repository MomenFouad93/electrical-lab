/* Drawings for the pharma water units (softener, dosing, EDI, UV, still, divert valve, analyser, point of use). */
(function (g) {
  const EL = g.EL, PA = EL.plantArt, W = EL.water, D = PA.D, { tx, f1, lpm, nozzle, lampDot, inlinePipe, valveBody } = PA.H;
  const pass = (u, w, T) => { const sp = W.spec(w, T, u.props.grade); return { sp, ok: sp.length && sp.every((x) => x.ok || x.act || x.ctl), act: sp.some((x) => !x.ok && x.act), ctl: sp.some((x) => !x.ok && x.ctl) }; };

  D.SOFT = (u) => {
    const st = u.state, left = st.left == null ? 100 : st.left;
    let s = `<rect x="14" y="8" width="60" height="132" rx="24" fill="url(#plVessel)" stroke="#8792a5" stroke-width="2"/>`;
    s += `<rect x="22" y="40" width="44" height="88" rx="10" fill="#d9b44a"/><rect x="22" y="40" width="44" height="${Math.round(88 * (1 - left / 100))}" fill="#7a5a20" opacity=".8"/>`;
    for (let i = 0; i < 10; i++) s += `<circle cx="${28 + (i % 4) * 11}" cy="${50 + Math.floor(i / 4) * 26}" r="2.5" fill="#f3dd8a"/>`;
    s += nozzle(0, 26, 'l', 16) + nozzle(90, 140, 'r', 16);
    return s + tx(45, 156, u.tag + ' softener', 'pl-tag') + tx(45, 169, 'resin ' + Math.round(left) + ' %', left < 15 ? 'pl-bad' : 'pl-s');
  };
  const CHEM = { naoh: ['NaOH', '#7b4bd1'], smbs: ['SMBS', '#1f9e8f'], anti: ['anti-scal.', '#b88a18'], naocl: ['NaOCl', '#2b6fd6'] };
  D.DOSE = (u) => {
    const on = !!u.props.on, [nm, col] = CHEM[u.props.chem] || CHEM.naoh;
    return inlinePipe(90, 76) + `<rect x="8" y="6" width="34" height="46" rx="6" fill="${col}" opacity=".55" stroke="#9aa5b6"/><rect x="12" y="${on ? 20 : 34}" width="26" height="${on ? 28 : 14}" fill="${col}"/>` +
      `<rect x="52" y="20" width="28" height="22" rx="4" fill="#2b3550" stroke="#9aa5b6"/>` + lampDot(66, 31, on, '#5fe07a') + `<path d="M66 42 V70" stroke="#c9d1dc" stroke-width="3"/>` +
      tx(45, 104, u.tag + ' ' + nm, 'pl-tag') + tx(45, 117, on ? 'dosing' : 'off', on ? 'pl-ok' : 'pl-warn');
  };
  D.EDI = (u) => {
    const st = u.state, dc = !!st.dc;
    let s = `<rect x="16" y="10" width="138" height="90" rx="6" fill="#3a4660" stroke="#9aa5b6" stroke-width="2"/>`;
    for (let i = 0; i < 9; i++) s += `<rect x="${26 + i * 14}" y="18" width="8" height="74" fill="${i % 2 ? '#d9b44a' : '#9fb0c6'}" opacity=".85"/>`;
    s += `<rect x="60" y="-6" width="50" height="16" rx="3" fill="#2b3550" stroke="#9aa5b6"/>` + tx(85, 6, dc ? 'DC ON' : 'DC OFF', dc ? 'pl-ok' : 'pl-bad');
    s += nozzle(0, 55, 'l', 16) + nozzle(170, 30, 'r', 16) + nozzle(170, 86, 'r', 16);
    s += tx(85, 118, u.tag + '  EDI', 'pl-tag') + tx(85, 131, lpm(st.qp) + ' L/min  ' + (st.us != null ? W.fmt(st.us, 3) + ' µS/cm' : ''), 'pl-s');
    return s + tx(166, 22, 'prod', 'pl-s', 'end') + tx(166, 104, 'rej', 'pl-s', 'end');
  };
  D.UV = (u) => {
    const pr = u.props, ok = pr.on && +pr.int >= 70;
    return inlinePipe(130, 56) + `<rect x="10" y="30" width="110" height="40" rx="18" fill="url(#plMetalV)" stroke="#5c6677"/>` +
      `<rect x="20" y="44" width="90" height="12" rx="6" fill="${ok ? '#b48cff' : '#3a3550'}"/>${ok ? '<rect x="14" y="38" width="102" height="24" rx="12" fill="#b48cff" opacity=".25"/>' : ''}` +
      tx(65, 22, u.tag + ' UV ' + (+pr.nm === 185 ? '185' : '254') + ' nm', 'pl-tag') + tx(65, 88, pr.on ? Math.round(+pr.int) + ' %' + (+pr.int < 70 ? ' LOW' : '') : 'OFF', ok ? 'pl-s' : 'pl-bad');
  };
  D.STILL = (u) => {
    const st = u.state, on = !!u.props.steam;
    let s = '';
    for (let i = 0; i < 4; i++) { const x = 12 + i * 40; s += `<rect x="${x}" y="${20 + i * 8}" width="32" height="${150 - i * 8}" rx="12" fill="url(#plMetal)" stroke="#5c6677"/>` + (on ? `<rect x="${x + 6}" y="${120}" width="20" height="${40}" fill="url(#plHot)" opacity=".6"/>` : ''); }
    s += `<path d="M28 20 C28 4 148 4 148 32" fill="none" stroke="${on ? '#ff9a7a' : '#5c6677'}" stroke-width="5"/>`;
    s += nozzle(0, 180, 'l', 14) + nozzle(180, 150, 'r', 14) + nozzle(90, 210, 'd', 14);
    s += tx(90, -6, u.tag + '  still (MED)', 'pl-tag');
    s += tx(90, 196, on ? 'steam ' + f1(+u.props.bar) + ' bar' : 'steam OFF', on ? 'pl-s' : 'pl-warn');
    s += tx(176, 140, st.run ? ((st.warm || 0) < 120 ? 'start-up: to drain' : 'WFI ' + lpm(st.qd) + ' L/min') : st.lstop ? 'standby (tank full)' : 'stopped', st.run && (st.warm || 0) < 120 ? 'pl-warn' : 'pl-s', 'end');
    return s;
  };
  D.DIV = (u) => {
    const st = u.state, div = !!st.div;
    let s = `<rect x="0" y="53" width="110" height="14" fill="url(#plMetalV)"/><rect x="48" y="60" width="14" height="40" fill="url(#plMetal)"/>`;
    s += `<g transform="translate(15,16)">${valveBody(!div, div ? '#d5463a' : '#2fb25a')}</g>`;
    s += `<rect x="40" y="6" width="30" height="24" rx="4" fill="#2b3550" stroke="#9aa5b6"/>` + lampDot(55, 18, div, '#ff6b5a');
    s += tx(55, -2, u.tag + ' divert', 'pl-tag') + tx(55, 118, div ? (st.hot ? 'HOT: DIVERTED' : 'DIVERTED') : 'to tank', div ? 'pl-bad' : 'pl-ok') + tx(55, 131, st.cond != null ? W.fmt(st.cond, 2) + ' / ' + u.props.lim + ' µS/cm @25°C' : '', 'pl-s');
    return s;
  };
  const qaBox = (u, w, T, x, y) => {
    if (!w) return tx(x, y, 'no flow', 'pl-s');
    const { sp, ok, act, ctl } = pass(u, w, T);
    return tx(x, y, W.fmt(sp[0].val, 2) + ' µS  ' + W.fmt(w[3], 0) + ' ppb', 'pl-s') + tx(x, y + 14, (ok ? 'PASS ' : 'FAIL ') + u.props.grade + (ctl ? ' <70°C' : act ? ' micro!' : ''), ok && !ctl ? (act ? 'pl-warn' : 'pl-ok') : 'pl-bad');
  };
  D.QA = (u) => {
    const st = u.state;
    return inlinePipe(100, 90) + `<rect x="10" y="6" width="80" height="60" rx="6" fill="#2b3550" stroke="#47BFD9" stroke-width="2"/><rect x="16" y="12" width="68" height="22" rx="2" fill="#c8d5b0"/>` +
      tx(50, 28, st.wq ? W.fmt(W.condRaw(st.wq, st.T), 2) : '-', 'pl-lcd') + tx(50, 50, 'µS/cm  TOC', 'pl-s') + `<rect x="44" y="66" width="12" height="16" fill="#8792a5"/>` +
      tx(50, -4, u.tag, 'pl-tag') + qaBox(u, st.wq, st.T, 50, 116);
  };
  D.POU = (u) => {
    const st = u.state, open = !!u.props.open, col = open ? '#2fb25a' : '#7d8aa1';
    let s = `<rect x="39" y="0" width="12" height="20" fill="url(#plMetal)"/><g transform="translate(5,0)">${valveBody(open, col)}</g>`;
    s += `<g data-act="toggle" style="cursor:pointer"><rect x="20" y="20" width="50" height="50" fill="transparent"/></g>`;
    s += `<path d="M45 58 V74" stroke="#9aa5b6" stroke-width="6"/>` + (open ? `<path d="M45 76 q-4 12 0 22" stroke="#4cc3ff" stroke-width="4" fill="none" class="pl-spill"/>` : '');
    s += tx(45, 90, u.tag + (open ? ' OPEN' : ''), open ? 'pl-ok' : 'pl-tag') + tx(45, 103, open ? lpm(st.q) + ' L/min' : 'closed', 'pl-s');
    return s + (st.wq ? qaBox(u, st.wq, st.T, 45, 118) : '');
  };
  D.TEMP = (u) => {
    const st = u.state, hot = !!st.heat;
    let s = inlinePipe(120, 96) + `<rect x="22" y="10" width="76" height="76" rx="6" fill="url(#plMetal)" stroke="#5c6677" stroke-width="2"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${30 + i * 11}" y="16" width="6" height="64" fill="${hot ? '#ff9a7a' : '#7fc6ff'}" opacity=".75"/>`;
    s += tx(60, 4, u.tag + (hot ? ' steam' : ' chilled'), 'pl-tag');
    return s + tx(60, 122, st.Tout != null && Math.abs(st.q || 0) > 1e-4 ? f1(st.Tin) + ' → ' + f1(st.Tout) + ' °C  ' + Math.round(Math.abs(st.kw || 0)) + ' kW' : 'set ' + (hot ? u.props.san : u.props.set) + ' °C', hot ? 'pl-warn' : 'pl-s');
  };
  D.DEG = (u) => {
    const on = !!u.props.on;
    let s = `<rect x="14" y="10" width="42" height="150" rx="10" fill="url(#plMetalV)" stroke="#5c6677" stroke-width="2"/>`;
    for (let i = 0; i < 5; i++) s += `<path d="M${22 + i * 6} 22 V148" stroke="#e8eef7" stroke-width="2" opacity=".7"/>`;
    s += nozzle(0, 150, 'l', 14) + nozzle(70, 20, 'r', 14);
    return s + tx(35, 2, u.tag, 'pl-tag') + tx(35, 182, on ? 'CO2 out' : 'air OFF', on ? 'pl-ok' : 'pl-warn');
  };
  D.CTRL = (u) => {
    const pr = u.props, st = u.state, h = Math.round((st.held || 0) / 60), H = Math.max(1, +pr.hold || 30);
    const mode = pr.sanit ? (h > 0 ? 'SANITISING ' + h + '/' + H + ' min' : 'HEATING to 80 °C ' + (st.T != null ? f1(st.T) : '')) : st.done && (st.doneT || 0) < 1800 ? 'SANIT DONE: cooling ' + (st.T != null ? '' : '') : pr.prod ? 'PRODUCTION' : 'STOPPED';
    const btn = (act, x, label, on, col) => `<g data-act="${act}" style="cursor:pointer"><rect x="${x}" y="88" width="88" height="56" rx="8" fill="${on ? col : '#2b3550'}" stroke="#c9d1dc" stroke-width="2"/><text x="${x + 44}" y="112" text-anchor="middle" class="pl-tag">${label}</text><text x="${x + 44}" y="132" text-anchor="middle" class="${on ? 'pl-ok' : 'pl-s'}">${on ? 'ON' : 'OFF'}</text></g>`;
    let s = `<rect x="0" y="0" width="300" height="170" rx="10" fill="#1d2436" stroke="#47BFD9" stroke-width="2"/><rect x="12" y="26" width="276" height="48" rx="4" fill="#c8d5b0"/>`;
    s += tx(150, 18, u.tag + '  station control', 'pl-tag') + tx(150, 56, mode, 'pl-lcd');
    s += btn('prod', 12, 'Production', !!pr.prod, '#1f7a3a') + btn('sanit', 106, 'Hot sanit', !!pr.sanit, '#b5452a') + btn('dist', 200, 'Loop', !!pr.dist, '#1f5fa8');
    return s + tx(150, 162, 'tap a button', 'pl-s');
  };
})(typeof window !== 'undefined' ? window : globalThis);
