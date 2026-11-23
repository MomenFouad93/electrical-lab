/* Plant drawings: one SVG string per unit, in the unit's own coordinates. */
(function (g) {
  const EL = g.EL;
  const PA = (EL.plantArt = {});
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  PA.esc = esc;
  const tx = (x, y, s, cls, anchor, extra) => `<text class="${cls || 'pl-t'}" x="${x}" y="${y}" text-anchor="${anchor || 'middle'}" ${extra || ''}>${esc(s)}</text>`;
  const f1 = (v) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1));
  const lpm = (q) => f1(Math.abs(q || 0) * 60);

  PA.defs = `<defs>
    <linearGradient id="plMetal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6f7a8c"/><stop offset=".45" stop-color="#d3dae4"/><stop offset="1" stop-color="#5c6677"/></linearGradient>
    <linearGradient id="plMetalV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f7a8c"/><stop offset=".45" stop-color="#d3dae4"/><stop offset="1" stop-color="#5c6677"/></linearGradient>
    <linearGradient id="plGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fe07a"/><stop offset=".5" stop-color="#1fa548"/><stop offset="1" stop-color="#0d6a2c"/></linearGradient>
    <linearGradient id="plWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4cc3ff"/><stop offset="1" stop-color="#1680d8"/></linearGradient>
    <linearGradient id="plHot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8f6b"/><stop offset="1" stop-color="#c8402a"/></linearGradient>
    <linearGradient id="plVessel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a3446"/><stop offset=".5" stop-color="#3b4860"/><stop offset="1" stop-color="#232c3c"/></linearGradient>
    <pattern id="plSand" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#b89a5e"/><circle cx="2" cy="2" r="1.2" fill="#8d7342"/><circle cx="6" cy="5" r="1.1" fill="#d8bf86"/></pattern>
    <pattern id="plGrid" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1.1" fill="#2a3852"/></pattern>
  </defs>`;

  const nozzle = (x, y, dir, len) => {
    len = len || 14;
    if (dir === 'u') return `<rect x="${x - 6}" y="${y}" width="12" height="${len}" fill="url(#plMetal)"/><rect x="${x - 10}" y="${y}" width="20" height="4" rx="1" fill="#9aa5b6"/>`;
    if (dir === 'd') return `<rect x="${x - 6}" y="${y - len}" width="12" height="${len}" fill="url(#plMetal)"/><rect x="${x - 10}" y="${y - 4}" width="20" height="4" rx="1" fill="#9aa5b6"/>`;
    if (dir === 'l') return `<rect x="${x}" y="${y - 6}" width="${len}" height="12" fill="url(#plMetalV)"/><rect x="${x}" y="${y - 10}" width="4" height="20" rx="1" fill="#9aa5b6"/>`;
    return `<rect x="${x - len}" y="${y - 6}" width="${len}" height="12" fill="url(#plMetalV)"/><rect x="${x - 4}" y="${y - 10}" width="4" height="20" rx="1" fill="#9aa5b6"/>`;
  };
  const lampDot = (x, y, on, col) => `<circle cx="${x}" cy="${y}" r="6" fill="${on ? col || '#5fe07a' : '#1d3326'}" stroke="#0b1422"/>${on ? `<circle cx="${x}" cy="${y}" r="10" fill="${col || '#5fe07a'}" opacity=".25"/>` : ''}`;
  const inlinePipe = (w, y) => `<rect x="0" y="${y - 7}" width="${w}" height="14" fill="url(#plMetalV)"/>`;

  /* ---------------- per unit ---------------- */
  const D = {};
  D.SUPPLY = (u) => {
    const st = u.state, hot = (+u.props.temp || 20) > 40;
    return `<rect x="4" y="22" width="80" height="50" rx="6" fill="#18263d" stroke="#5b6b86" stroke-width="2"/>` +
      `<path d="M10 46 q10 -6 20 0 t20 0 t20 0 t12 0 V68 H10 Z" fill="url(#${hot ? 'plHot' : 'plWater'})" opacity=".9"/>` +
      nozzle(100, 40, 'r', 18) + tx(44, 16, u.tag, 'pl-tag') +
      tx(44, 88, f1(+u.props.bar) + ' bar  ' + Math.round(+u.props.temp) + ' °C', 'pl-s') + tx(44, 100, lpm(st.q) + ' L/min', 'pl-s');
  };
  D.DRAIN = (u) => `<rect x="10" y="20" width="62" height="36" rx="4" fill="#3a4354" stroke="#6b7486" stroke-width="2"/>` + [0, 1, 2, 3, 4].map((i) => `<rect x="${18 + i * 11}" y="26" width="5" height="24" rx="1" fill="#1a2030"/>`).join('') +
    nozzle(0, 24, 'l', 12) + tx(41, 14, u.tag, 'pl-tag') + tx(41, 70, lpm(u.state.q) + ' L/min', 'pl-s');
  D.TANK = (u) => {
    const st = u.state, pr = u.props, lvl = Math.max(0, Math.min(100, st.lvl == null ? (100 * (st.v || 0)) / (+pr.vol || 1) : st.lvl));
    const x0 = 14, x1 = 166, y0 = 26, y1 = 226, H = y1 - y0, wy = y1 - (H * lvl) / 100;
    const T = st.T == null ? 20 : st.T, hot = T > 35;
    let s = `<rect x="30" y="${y1}" width="14" height="14" fill="#4b5566"/><rect x="136" y="${y1}" width="14" height="14" fill="#4b5566"/>`;
    s += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${H}" fill="#121c2c" stroke="url(#plMetal)" stroke-width="5"/>`;
    s += `<rect x="${x0 + 3}" y="${wy}" width="${x1 - x0 - 6}" height="${Math.max(0, y1 - wy - 2)}" fill="url(#${hot ? 'plHot' : 'plWater'})" opacity=".85"/>`;
    if (lvl > 1) s += `<path class="pl-wave" d="M${x0 + 3} ${wy} q12 -4 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 V${wy + 6} H${x0 + 3} Z" fill="#8ee0ff" opacity=".45"/>`;
    for (let i = 1; i < 10; i++) { const y = y1 - (H * i) / 10; s += `<line x1="${x0 + 3}" y1="${y}" x2="${x0 + 12}" y2="${y}" stroke="#7d8aa1" stroke-width="1.4"/>`; }
    s += `<rect x="${x0 - 6}" y="${y0 - 6}" width="${x1 - x0 + 12}" height="8" rx="2" fill="#8792a5"/>`;
    s += tx(90, wy - 8 < y0 + 26 ? y0 + 26 : wy - 8, Math.round(lvl) + ' %', 'pl-big');
    // level transmitter on the roof
    if (pr.lt) {
      s += `<rect x="78" y="${y0 - 18}" width="24" height="14" rx="3" fill="#3a4660" stroke="#9aa5b6"/><path d="M86 ${y0 + 2} L94 ${y0 + 2} L${100} ${wy - 2} L${80} ${wy - 2} Z" fill="#c9b47a" opacity=".18"/>`;
      s += tx(176, y0 - 14, 'LT ' + pr.lt, 'pl-s', 'start') + tx(176, y0 - 2, Math.round(lvl) + ' %', 'pl-s', 'start');
    }
    // float switches
    (pr.sw || []).forEach((sw, i) => {
      if (!sw || !sw.n) return;
      const y = y1 - (H * Math.max(0, Math.min(100, +sw.l || 0))) / 100, on = st.sw ? !!st.sw[i] : lvl > sw.l, fy = on ? y - 8 : y + 6;
      s += `<line x1="${x1 - 6}" y1="${y}" x2="${x1 - 20}" y2="${fy}" stroke="#0b1422" stroke-width="2"/><rect x="${x1 - 32}" y="${fy - 10}" width="14" height="20" rx="6" fill="#2b6fd6" stroke="#e5483b" stroke-width="1.5"/>`;
      const ly = Math.min(y, y1 - 30 - (pr.sw.length - 1 - i) * 0);
      s += `<path d="M${x1 + 2} ${y} H${x1 + 12} L${x1 + 16} ${ly}" fill="none" stroke="#7d8aa1"/>` + lampDot(x1 + 22, ly, on) + tx(x1 + 32, ly + 4, sw.n + (sw.t ? ' (' + sw.t + ')' : ''), 'pl-s', 'start');
    });
    if (st.heatW > 1 || pr.htr) s += `<path d="M${x0 + 20} ${y1 - 14} h30 v-6 h-30 v-6 h30" fill="none" stroke="${st.heatW > 1 ? '#ff6b3a' : '#7d8aa1'}" stroke-width="3"/>` + tx(x0 + 60, y1 - 10, (st.heatW > 1 ? Math.round(st.heatW) + ' W' : 'heater ' + pr.htr), 'pl-s', 'start');
    s += tx(90, y1 - 8, Math.round(st.v || 0) + ' / ' + Math.round(+pr.vol) + ' L   ' + T.toFixed(1) + ' °C', 'pl-s');
    const eta = EL.water && EL.water.tankETA(u);
    if (eta) s += tx(90, y1 + 30, (eta.fill ? 'to 90 % in ' : 'to 10 % in ') + EL.water.fmtT(eta.s), eta.fill ? 'pl-ok' : 'pl-warn');
    if (+pr.jkt > 0) s += `<rect x="${x0 - 9}" y="${y0 + 40}" width="5" height="${H - 50}" fill="#c8402a" opacity=".7"/><rect x="${x1 + 4}" y="${y0 + 40}" width="5" height="${H - 50}" fill="#c8402a" opacity=".7"/>`;
    if (st.ovf > 0.001) s += `<path class="pl-spill" d="M${x1 + 2} ${y0} q14 10 10 60" stroke="#4cc3ff" stroke-width="5" fill="none"/>` + tx(90, y0 - 10, 'OVERFLOW', 'pl-bad');
    s += nozzle(40, 0, 'u', 22) + nozzle(140, 0, 'u', 22) + nozzle(180, 222, 'r', 16) + nozzle(0, 222, 'l', 16);
    s += tx(14, 12, u.tag, 'pl-tag', 'start');
    return s;
  };
  D.PUMP = (u) => {
    const st = u.state, s1 = Math.abs(st.s || 0), run = s1 > 0.05, flip = !!u.props.flip, w = 170;
    let g = `<rect x="4" y="34" width="66" height="50" rx="8" fill="url(#plGreen)" stroke="#0b3a1b"/>`;
    for (let i = 0; i < 6; i++) g += `<line x1="${10 + i * 10}" y1="38" x2="${10 + i * 10}" y2="80" stroke="#0e6a2e" stroke-width="3"/>`;
    g += `<rect x="70" y="52" width="14" height="14" fill="#8792a5"/><rect x="18" y="84" width="40" height="8" fill="#3f4858"/><rect x="88" y="90" width="52" height="8" fill="#3f4858"/>`;
    g += nozzle(112, 0, 'u', 28) + `<rect x="138" y="58" width="32" height="16" fill="url(#plMetalV)"/><rect x="166" y="54" width="4" height="24" fill="#9aa5b6"/>`;
    g += `<circle cx="112" cy="62" r="30" fill="url(#plGreen)" stroke="#0b3a1b" stroke-width="2"/><circle cx="112" cy="62" r="17" fill="#0d6a2c" stroke="#5fe07a" stroke-width="2"/>`;
    g += `<g class="${run ? 'pl-spin' : ''}" style="${run ? 'animation-duration:' + Math.max(0.15, 0.8 / s1).toFixed(2) + 's;' : ''}transform-origin:112px 62px">` + [0, 60, 120, 180, 240, 300].map((a) => `<circle cx="${112 + 10 * Math.cos((a * Math.PI) / 180)}" cy="${62 + 10 * Math.sin((a * Math.PI) / 180)}" r="3" fill="#a6f5b8"/>`).join('') + '</g>';
    let s = flip ? `<g transform="translate(${w},0) scale(-1,1)">${g}</g>` : g;
    const lx = flip ? w - 37 : 37;
    s += tx(lx, 26, u.tag + (u.props.motor ? '  -' + u.props.motor : u.props.local ? '  VFD ' + Math.round(+u.props.spd) + ' %' : ''), 'pl-tag');
    s += tx(85, 114, run ? lpm(st.q) + ' L/min  Δp ' + f1(st.dp || 0) + ' bar' : 'stopped', 'pl-s');
    if (st.cav) s += tx(85, 128, 'CAVITATION / DRY', 'pl-bad');
    else if (st.s < -0.05) s += tx(85, 128, 'REVERSE ROTATION', 'pl-bad');
    else if (u.props.local && u.props.lvt && st.lstop) s += tx(85, 128, 'level control: stopped', 'pl-s');
    else if (u.props.local && run) s += tx(85, 128, (+u.props.qbep > 0 ? (Math.abs(st.q || 0) * 3.6).toFixed(2) + ' m³/h  ' : '') + (st.kw || 0).toFixed(2) + ' kW', 'pl-s');
    else if (!u.props.motor && !u.props.local) s += tx(85, 128, 'no motor linked', 'pl-warn');
    return s;
  };
  const valveBody = (open, col) => `<path d="M10 30 L40 44 L10 58 Z M70 30 L40 44 L70 58 Z" fill="${col}" stroke="#0b1422" stroke-width="1.5"/><circle cx="40" cy="44" r="6" fill="#d3dae4"/>`;
  D.VALVE = (u) => {
    const st = u.state, pos = st.pos == null ? (u.props.open ? 1 : 0) : st.pos, open = pos > 0.5, col = open ? '#2fb25a' : '#d5463a';
    return inlinePipe(80, 44) + valveBody(open, col) + `<line x1="40" y1="44" x2="40" y2="14" stroke="#d3dae4" stroke-width="4"/>` +
      `<g data-act="toggle" style="cursor:pointer"><rect x="10" y="0" width="60" height="22" fill="transparent"/><line x1="${40 - 22 * Math.cos(((1 - pos) * Math.PI) / 2)}" y1="${12 - 0}" x2="${40 + 22 * Math.cos(((1 - pos) * Math.PI) / 2)}" y2="12" stroke="${col}" stroke-width="7" stroke-linecap="round"/></g>` +
      tx(40, 76, u.tag + (open ? ' OPEN' : ' CLOSED'), open ? 'pl-ok' : 'pl-bad') + tx(40, 89, lpm(st.q) + ' L/min', 'pl-s');
  };
  D.SOLV = (u) => {
    const st = u.state, pos = st.pos || 0, open = pos > 0.5, col = open ? '#2fb25a' : '#d5463a';
    return inlinePipe(80, 60) + `<g transform="translate(0,16)">${valveBody(open, col)}</g><rect x="28" y="6" width="24" height="30" rx="3" fill="#2b3550" stroke="#9aa5b6"/><path d="M32 12 h16 M32 18 h16 M32 24 h16 M32 30 h16" stroke="#c9a24a" stroke-width="2"/>` +
      tx(40, 92, u.tag + (u.props.sol ? ' (' + u.props.sol + ')' : ''), 'pl-tag') + tx(40, 105, Math.round(pos * 100) + ' %  ' + lpm(st.q) + ' L/min', 'pl-s');
  };
  D.CHECK = (u) => inlinePipe(70, 22) + `<rect x="16" y="8" width="38" height="28" rx="5" fill="#465169" stroke="#9aa5b6"/><path d="M24 22 h18 M36 15 l8 7 l-8 7" stroke="#e7edf8" stroke-width="2.5" fill="none"/>` + tx(35, 52, u.tag, 'pl-tag');
  D.FILTER = (u) => {
    const st = u.state, clog = Math.min(1, (st.clog || 0) / 2), cart = u.props.kind === 'cart' || u.props.kind === 'cart1', carbon = u.props.kind === 'carbon';
    let s = `<rect x="14" y="8" width="52" height="128" rx="22" fill="url(#plVessel)" stroke="#8792a5" stroke-width="2"/>`;
    s += cart ? `<rect x="30" y="24" width="20" height="98" rx="6" fill="rgb(${Math.round(230 - 100 * clog)},${Math.round(225 - 120 * clog)},${Math.round(210 - 150 * clog)})" stroke="#8792a5"/>` + [0, 1, 2, 3, 4, 5, 6].map((i) => `<line x1="30" y1="${32 + i * 13}" x2="50" y2="${32 + i * 13}" stroke="#9a8f7a"/>`).join('')
      : carbon ? `<rect x="20" y="40" width="40" height="84" rx="10" fill="#1d1f24"/>` + [0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${26 + (i % 3) * 14}" cy="${56 + Math.floor(i / 3) * 30}" r="3" fill="#3a3e47"/>`).join('')
      : `<rect x="20" y="60" width="40" height="64" rx="10" fill="url(#plSand)"/><rect x="20" y="60" width="40" height="${Math.round(30 * clog)}" fill="#5a4a2a" opacity=".75"/>`;
    s += nozzle(0, 26, 'l', 16) + nozzle(80, 130, 'r', 16);
    s += tx(40, 150, u.tag + (u.props.kind === 'cart1' ? ' 1 µm' : cart ? ' 5 µm' : carbon ? ' carbon' : ' sand'), 'pl-tag') + tx(40, 163, 'Δp ' + f1(Math.max(0, st.dp || 0)) + ' bar', clog > 0.6 ? 'pl-warn' : 'pl-s');
    return s;
  };
  D.RO = (u) => {
    const st = u.state;
    let s = `<rect x="10" y="22" width="200" height="36" rx="18" fill="#e8eef6" stroke="#8792a5" stroke-width="2"/><rect x="18" y="26" width="184" height="28" rx="14" fill="#cfd9e6"/>` + [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<line x1="${34 + i * 19}" y1="27" x2="${30 + i * 19}" y2="53" stroke="#9fb0c6"/>`).join('');
    s += `<rect x="4" y="18" width="10" height="44" rx="3" fill="#465169"/><rect x="206" y="18" width="10" height="44" rx="3" fill="#465169"/>`;
    s += nozzle(0, 40, 'l', 8) + nozzle(220, 18, 'r', 10) + nozzle(220, 62, 'r', 10);
    s += tx(110, 14, u.tag + '  RO membrane', 'pl-tag');
    s += tx(110, 76, 'feed ' + f1(st.pin || 0) + ' bar  ' + f1(st.Tf == null ? 20 : st.Tf) + ' °C', 'pl-s');
    s += tx(110, 89, 'permeate ' + lpm(st.qp) + '  reject ' + lpm(st.qr) + ' L/min', 'pl-s');
    s += tx(110, 102, 'recovery ' + Math.round(st.rec || 0) + ' %  ' + (st.us ? (st.us < 10 ? st.us.toFixed(2) : Math.round(st.us)) + ' µS/cm' : ''), 'pl-s');
    s += tx(214, 10, 'perm', 'pl-s', 'end') + tx(214, 82, 'rej', 'pl-s', 'end');
    return s;
  };
  D.HX = (u) => {
    const st = u.state;
    let s = `<rect x="22" y="6" width="76" height="108" rx="4" fill="#5a6478" stroke="#9aa5b6" stroke-width="2"/>`;
    for (let i = 0; i < 9; i++) s += `<rect x="${28 + i * 7.6}" y="12" width="5" height="96" fill="${i % 2 ? '#e5483b' : '#2b8fe0'}" opacity=".75"/>`;
    s += nozzle(0, 22, 'l', 22) + nozzle(120, 22, 'r', 22) + nozzle(0, 98, 'l', 22) + nozzle(120, 98, 'r', 22);
    s += `<circle cx="10" cy="12" r="4" fill="#e5483b"/><circle cx="110" cy="108" r="4" fill="#e5483b"/><circle cx="10" cy="108" r="4" fill="#2b8fe0"/><circle cx="110" cy="12" r="4" fill="#2b8fe0"/>`;
    s += tx(60, -6, u.tag + '  heat exchanger', 'pl-tag');
    if (st.th && st.tc) s += tx(60, 128, 'hot ' + f1(st.th[0]) + '→' + f1(st.th[1]) + ' °C', 'pl-s') + tx(60, 141, 'cold ' + f1(st.tc[0]) + '→' + f1(st.tc[1]) + ' °C', 'pl-s');
    return s;
  };
  const head = (u, body, val, cls) => inlinePipe(60, 64) + `<rect x="27" y="40" width="6" height="18" fill="#8792a5"/>` + body + tx(30, 92, u.tag, 'pl-tag') + tx(30, 105, val, cls || 'pl-s');
  D.PT = (u) => head(u, `<rect x="8" y="6" width="44" height="34" rx="6" fill="#2b3550" stroke="#47BFD9" stroke-width="2"/><rect x="13" y="12" width="34" height="14" rx="2" fill="#c8d5b0"/>` + tx(30, 23, f1(u.state.p || 0), 'pl-lcd') + tx(30, 36, u.props.tx || '-', 'pl-s'), f1(u.state.p || 0) + ' bar');
  D.PS = (u) => head(u, `<rect x="8" y="6" width="44" height="34" rx="6" fill="#2b3550" stroke="#9aa5b6" stroke-width="2"/>` + lampDot(30, 22, !!u.state.on, '#FDC300') + tx(30, 36, u.props.sw || '-', 'pl-s'), '> ' + f1(+u.props.set) + ' bar: ' + (u.state.on ? 'ON' : 'off'), u.state.on ? 'pl-ok' : 'pl-s');
  D.TT = (u) => head(u, `<rect x="8" y="6" width="44" height="34" rx="6" fill="#2b3550" stroke="#e5483b" stroke-width="2"/><rect x="13" y="12" width="34" height="14" rx="2" fill="#c8d5b0"/>` + tx(30, 23, f1(u.state.T == null ? 20 : u.state.T), 'pl-lcd') + tx(30, 36, u.props.tx || '-', 'pl-s'), f1(u.state.T == null ? 20 : u.state.T) + ' °C');
  D.FS = (u) => inlinePipe(60, 54) + `<rect x="10" y="10" width="40" height="30" rx="5" fill="#2b3550" stroke="#9aa5b6" stroke-width="2"/>` + lampDot(30, 25, !!u.state.on, '#FDC300') + `<rect x="27" y="40" width="6" height="8" fill="#8792a5"/>` +
    tx(30, 80, u.tag + (u.props.sw ? ' (' + u.props.sw + ')' : ''), 'pl-tag') + tx(30, 93, lpm(u.state.q) + ' / ' + u.props.set + ' L/min', u.state.on ? 'pl-ok' : 'pl-s');
  D.PG = (u) => {
    const p = u.state.p || 0, r = +u.props.range || 10, a = -135 + 270 * Math.max(0, Math.min(1, p / r));
    let s = `<circle cx="30" cy="22" r="20" fill="#f2f4f7" stroke="#8792a5" stroke-width="3"/>`;
    for (let i = 0; i <= 10; i++) { const b = ((-135 + 27 * i - 90) * Math.PI) / 180; s += `<line x1="${30 + 15 * Math.cos(b)}" y1="${22 + 15 * Math.sin(b)}" x2="${30 + 18 * Math.cos(b)}" y2="${22 + 18 * Math.sin(b)}" stroke="#333" stroke-width="1"/>`; }
    s += `<line x1="30" y1="22" x2="${30 + 14 * Math.cos(((a - 90) * Math.PI) / 180)}" y2="${22 + 14 * Math.sin(((a - 90) * Math.PI) / 180)}" stroke="#d5463a" stroke-width="2.5"/><circle cx="30" cy="22" r="2.5" fill="#333"/>`;
    return head(u, s, f1(p) + ' bar');
  };
  D.FM = (u) => inlinePipe(90, 44) + `<rect x="18" y="4" width="54" height="30" rx="5" fill="#2b3550" stroke="#47BFD9" stroke-width="2"/><rect x="22" y="9" width="46" height="14" rx="2" fill="#c8d5b0"/>` + tx(45, 20, lpm(u.state.q), 'pl-lcd') + tx(45, 31, 'L/min', 'pl-s') +
    `<rect x="36" y="34" width="18" height="16" fill="#465169"/>` + tx(45, 66, u.tag + '  Σ ' + Math.round(u.state.tot || 0) + ' L', 'pl-s');
  D.JUNC = () => `<rect x="0" y="12" width="36" height="12" fill="url(#plMetalV)"/><rect x="12" y="0" width="12" height="36" fill="url(#plMetal)"/><circle cx="18" cy="18" r="9" fill="#9aa5b6" stroke="#5c6677"/>`;

  PA.D = D; PA.H = { tx, f1, lpm, nozzle, lampDot, inlinePipe, valveBody };
  PA.draw = function (u) { const f = D[u.type]; try { return f ? f(u) : ''; } catch (e) { return ''; } };

  /* pipe route: orthogonal path out of each port */
  const OFF = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] };
  PA.route = function (A, B) {
    const st = 18, a = { x: A.x + OFF[A.dir][0] * st, y: A.y + OFF[A.dir][1] * st }, b = { x: B.x + OFF[B.dir][0] * st, y: B.y + OFF[B.dir][1] * st };
    const pts = [[A.x, A.y], [a.x, a.y]];
    const vA = A.dir === 'u' || A.dir === 'd', vB = B.dir === 'u' || B.dir === 'd';
    if (vA && vB && A.dir === B.dir) { const y = A.dir === 'u' ? Math.min(a.y, b.y) : Math.max(a.y, b.y); pts.push([a.x, y], [b.x, y]); }
    else if (vA && !vB) pts.push([a.x, b.y]);
    else if (!vA && vB) pts.push([b.x, a.y]);
    else if (!vA && !vB) { const mx = (a.x + b.x) / 2; pts.push([mx, a.y], [mx, b.y]); }
    else { const my = (a.y + b.y) / 2; pts.push([a.x, my], [b.x, my]); }
    pts.push([b.x, b.y], [B.x, B.y]);
    const clean = [];
    for (const p of pts) { const l = clean[clean.length - 1]; if (!l || Math.abs(l[0] - p[0]) > 0.5 || Math.abs(l[1] - p[1]) > 0.5) clean.push(p); }
    return 'M' + clean.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  };

  /* small static preview of a whole plant (projects page) */
  PA.preview = function (pl, w, h) {
    if (!pl || !pl.units.length) return `<svg viewBox="0 0 ${w} ${h}"></svg>`;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const u of pl.units) { const d = EL.plant.defs[u.type]; x0 = Math.min(x0, u.x); y0 = Math.min(y0, u.y - 20); x1 = Math.max(x1, u.x + d.w + 60); y1 = Math.max(y1, u.y + d.h + 40); }
    let s = `<svg class="pl-prev" viewBox="${x0 - 20} ${y0 - 20} ${x1 - x0 + 40} ${y1 - y0 + 40}" preserveAspectRatio="xMidYMid meet">${PA.defs}`;
    for (const p of pl.pipes) {
      const [ia, pa] = p.a.split('.'), [ib, pb] = p.b.split('.');
      const ua = pl.units.find((u) => u.id === ia), ub = pl.units.find((u) => u.id === ib);
      if (!ua || !ub) continue;
      const d = PA.route(EL.plant.portPos(ua, pa), EL.plant.portPos(ub, pb));
      s += `<path d="${d}" fill="none" stroke="#8b96a8" stroke-width="12" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#3aa2e6" stroke-width="6" stroke-linejoin="round"/>`;
    }
    for (const u of pl.units) s += `<g transform="translate(${u.x},${u.y})">${PA.draw(u)}</g>`;
    return s + '</svg>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
