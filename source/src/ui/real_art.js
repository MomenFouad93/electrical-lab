/* Realistic look for the common panel parts (drawn, no brand names). Same size and terminals as the symbol
   drawing, so circuits and tests do not change. Used when the bench "Real look" option is on. Also the
   DIN rail and wire duct parts that other devices snap onto. */
(function (g) {
  const EL = g.EL;
  const R = (EL.real = {});
  const D = EL.defs;
  const T = (x, y, s, cls, a, extra) => `<text class="${cls || 'psub'}" x="${x}" y="${y}" text-anchor="${a || 'middle'}" ${extra || ''}>${s}</text>`;
  const t = (x, y, s, size, col, w, a) => `<text x="${x}" y="${y}" text-anchor="${a || 'middle'}" style="font:${w || 700} ${size || 9}px system-ui,Segoe UI,Arial;fill:${col || '#2b3240'}">${s}</text>`;
  /* shared gradients live in one hidden svg so every drawing can use them */
  function defs() {
    if (typeof document === 'undefined' || document.getElementById('realDefs')) return;
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('id', 'realDefs'); s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true'); s.style.position = 'absolute';
    s.innerHTML = '<defs>' +
      '<linearGradient id="rgWhite" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9dde3"/><stop offset=".12" stop-color="#fbfbfc"/><stop offset=".85" stop-color="#eef0f3"/><stop offset="1" stop-color="#c6cad2"/></linearGradient>' +
      '<linearGradient id="rgGrey" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d737d"/><stop offset=".15" stop-color="#9aa1ab"/><stop offset=".85" stop-color="#8b929c"/><stop offset="1" stop-color="#5c626b"/></linearGradient>' +
      '<linearGradient id="rgDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a505a"/><stop offset="1" stop-color="#22262d"/></linearGradient>' +
      '<radialGradient id="rgScrew" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c9ced6"/><stop offset="1" stop-color="#7c838e"/></radialGradient>' +
      '<radialGradient id="rgChrome" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#b9c0c9"/><stop offset="1" stop-color="#626973"/></radialGradient>' +
      '<linearGradient id="rgBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f86d8"/><stop offset=".5" stop-color="#2a5db0"/><stop offset="1" stop-color="#173c7a"/></linearGradient>' +
      '<linearGradient id="rgFins" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f62b0"/><stop offset=".5" stop-color="#5a8fe0"/><stop offset="1" stop-color="#1d4688"/></linearGradient>' +
      '<linearGradient id="rgRail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9edf2"/><stop offset=".25" stop-color="#9aa2ad"/><stop offset=".5" stop-color="#d4dae2"/><stop offset=".75" stop-color="#8b939e"/><stop offset="1" stop-color="#c9cfd8"/></linearGradient>' +
      '<pattern id="rgSlots" width="14" height="10" patternUnits="userSpaceOnUse"><rect width="14" height="10" fill="#8f969f"/><rect x="2" y="2" width="10" height="6" rx="1" fill="#59606a"/></pattern>' +
      '</defs>';
    (document.body || document.documentElement).appendChild(s);
  }
  if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', defs); else defs(); }
  R.defs = defs;

  /* phase colours: IEC (brown, black, grey) or the old red, yellow, blue */
  R.scheme = () => { try { return localStorage.getItem('ellab.phcol') === 'ryb' ? 'ryb' : 'iec'; } catch (e) { return 'iec'; } };
  R.phCol = (role) => {
    const ryb = R.scheme() === 'ryb';
    return { L1: ryb ? '#e0352b' : '#8a5a2b', L2: ryb ? '#f2c21b' : '#2a2a2a', L3: ryb ? '#2f6ee0' : '#9aa0a8', N: '#3d8fe0', PE: '#5fb04a' }[role] || '#c9ced6';
  };
  const screw = (x, y, r) => `<g><circle cx="${x}" cy="${y}" r="${r || 6.5}" fill="url(#rgScrew)" stroke="#5d646e" stroke-width="1"/><path d="M${x - (r || 6.5) * 0.6} ${y}h${(r || 6.5) * 1.2}M${x} ${y - (r || 6.5) * 0.6}v${(r || 6.5) * 1.2}" stroke="#4b525c" stroke-width="1.6"/></g>`;
  const socket = (x, y, col) => `<circle cx="${x}" cy="${y}" r="8" fill="${col}" stroke="#1d2129" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="3.4" fill="#1d2129"/><circle cx="${x - 2.5}" cy="${y - 3}" r="1.6" fill="#fff" opacity=".55"/>`;
  const shade = (w, h, rx) => `<rect x="1.5" y="3" width="${w}" height="${h}" rx="${rx || 6}" fill="#000" opacity=".28"/>`;
  const lock = (x, y) => (EL.lockIcon ? EL.lockIcon(x, y) : '');

  /* ---------- sources ---------- */
  function supply(p, d, phases) {
    const w = d.w, h = d.h;
    let s = shade(w, h, 8) + `<rect x="0" y="0" width="${w}" height="${h}" rx="8" fill="url(#rgWhite)" stroke="#9097a3" stroke-width="1.2"/>`;
    s += `<rect x="${w / 2 - 44}" y="7" width="88" height="17" rx="4" fill="#23272f"/>` + t(w / 2, 19.5, phases === 3 ? '3Ø SOURCE 400V' : '1Ø SOURCE 230V', 8.5, '#f1f3f6');
    for (const q of d.pins) { const role = q.role || q.id; s += t(q.x, 38, q.label || q.id, 8.5, '#3a4150') + socket(q.x, 53, R.phCol(role === 'L' ? 'L1' : role)); }
    return s;
  }
  R.SRC3 = (p) => supply(p, D.SRC3, 3);
  R.SRC1 = (p) => supply(p, D.SRC1, 1);

  /* ---------- DIN rail devices ---------- */
  function dinBody(w, h, top, bot) {
    let s = shade(w, h, 4) + `<rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="url(#rgWhite)" stroke="#8f96a2" stroke-width="1.2"/>`;
    s += `<rect x="2" y="${top}" width="${w - 4}" height="1.5" fill="#a9afb9"/><rect x="2" y="${h - bot}" width="${w - 4}" height="1.5" fill="#a9afb9"/>`;
    return s;
  }
  function breaker(kind) {
    return function (p) {
      const d = D[p.type], w = d.w, h = d.h, st = p.state || {}, on = st.on && !st.tripped, poles = d.pins.length / 2;
      let s = dinBody(w, h, 22, 22);
      const tops = d.pins.filter((q) => q.y === 0), bots = d.pins.filter((q) => q.y === h);
      tops.forEach((q) => { s += screw(q.x, 11) + t(q.x, 31, q.label, 7.5, '#4a5160'); });
      bots.forEach((q) => { s += screw(q.x, h - 11) + t(q.x, h - 25, q.label, 7.5, '#4a5160'); });
      const cx = w / 2;
      if (kind === 'MPCB') {
        s += `<circle cx="${cx}" cy="${h / 2}" r="17" fill="url(#rgDark)" stroke="#111"/><rect x="${cx - 3}" y="${h / 2 - 16}" width="6" height="14" rx="2" fill="#e8ecf2" transform="rotate(${on ? 0 : st.tripped ? 45 : 90} ${cx} ${h / 2})"/>`;
        s += t(cx - 28, h / 2 - 12, 'I', 9, on ? '#2e8b43' : '#7a808a') + t(cx + 28, h / 2 + 4, 'O', 9, !on ? '#c23b2a' : '#7a808a');
        s += `<rect x="8" y="${h - 40}" width="${w - 16}" height="12" rx="3" fill="#2f3540"/>` + t(cx, h - 31, 'Ir ' + (+p.props.set).toFixed(1) + ' A', 8, '#e8ecf2');
      } else if (kind === 'ISOL') {
        s += `<rect x="10" y="34" width="${w - 20}" height="${h - 68}" rx="4" fill="#f2c21b" stroke="#a5820f"/>`;
        s += `<circle cx="${cx}" cy="${h / 2}" r="15" fill="#d23a2a" stroke="#7a1d14"/><rect x="${cx - 4}" y="${h / 2 - 22}" width="8" height="44" rx="3" fill="#d23a2a" stroke="#7a1d14" transform="rotate(${on ? 0 : -90} ${cx} ${h / 2})"/>`;
        s += t(cx, 44, on ? 'I  ON' : '', 8, '#3a2c00') + t(cx, h - 38, on ? '' : '0  OFF', 8, '#3a2c00');
      } else {
        const hy = st.tripped ? h / 2 - 6 : on ? h / 2 - 15 : h / 2 + 2;
        s += t(10, 46, 'C' + (p.props.rating || ''), 10, '#20252e', 800, 'start');
        s += `<rect x="${cx - (poles > 1 ? 34 : 9)}" y="${h / 2 - 22}" width="${poles > 1 ? 68 : 18}" height="40" rx="3" fill="#2f3540"/>`;
        s += `<rect x="${cx - (poles > 1 ? 30 : 7)}" y="${hy}" width="${poles > 1 ? 60 : 14}" height="13" rx="2" fill="#15181d" stroke="#000"/>`;
        for (let i = 0; i < poles; i++) { const x = poles > 1 ? 20 + i * 30 : cx; s += `<rect x="${x - 6}" y="${h / 2 + 22}" width="12" height="6" rx="1" fill="${st.tripped ? '#f2c21b' : on ? '#3aa356' : '#d23a2a'}"/>`; }
      }
      if (p.props.locked) s += lock(cx - 8, 34);
      return s;
    };
  }
  R.MCB1 = breaker('MCB'); R.MCB3 = breaker('MCB'); R.MPCB = breaker('MPCB'); R.ISOL3 = breaker('ISOL');
  R.FUSE = (p) => {
    const blown = p.fault === 'blown' || (p.state && p.state.blown);
    let s = dinBody(40, 90, 20, 20) + screw(20, 10) + screw(20, 80);
    s += `<rect x="8" y="26" width="24" height="38" rx="3" fill="#2f3540"/><rect x="12" y="30" width="16" height="30" rx="2" fill="#e9e2cf" stroke="#9a8e6e"/>`;
    s += `<rect x="16" y="40" width="8" height="10" rx="1" fill="${blown ? '#d23a2a' : '#7a6f55'}"/>` + t(20, 72, p.props.rating + 'A', 8, '#20252e');
    return s;
  };

  /* ---------- contactor + overload ---------- */
  R.CONT3 = (p) => {
    const st = p.state || {}, cl = st.closed, lit = st.energized;
    let s = shade(128, 210, 6) + `<rect x="0" y="0" width="128" height="210" rx="6" fill="url(#rgGrey)" stroke="#3f454e"/>`;
    s += `<rect x="134" y="0" width="104" height="210" rx="5" fill="url(#rgGrey)" stroke="#3f454e"/>`;
    s += `<rect x="6" y="22" width="116" height="20" rx="3" fill="#3a3f48"/><rect x="6" y="168" width="116" height="20" rx="3" fill="#3a3f48"/>`;
    for (const q of D.CONT3.pins) s += screw(q.x, q.y === 0 ? 11 : 199);
    ['1/L1', '3/L2', '5/L3', 'A1'].forEach((l, i) => { s += t([20, 50, 80, 115][i], 36, l, 7.5, '#e8ecf2'); });
    ['2/T1', '4/T2', '6/T3', 'A2'].forEach((l, i) => { s += t([20, 50, 80, 115][i], 182, l, 7.5, '#e8ecf2'); });
    s += `<rect x="14" y="56" width="100" height="98" rx="6" fill="#c9ced6" stroke="#6b717b"/>`;
    s += `<rect x="38" y="66" width="52" height="34" rx="4" fill="#15181d"/><rect x="44" y="${cl ? 80 : 71}" width="40" height="15" rx="2" fill="${cl ? '#3aa356' : '#8a9099'}"/>` + t(64, cl ? 91 : 82, cl ? 'I' : 'O', 10, '#fff', 800);
    s += t(64, 118, 'KM', 11, '#20252e', 800) + t(64, 132, (p.props.coil || '').replace('VAC', 'V~ 50Hz').replace('VDC', 'V='), 7.5, '#20252e');
    s += `<circle cx="104" cy="66" r="5" fill="${lit ? '#4fd1ff' : '#3a3f48'}" stroke="#20252e"/>`;
    s += `<rect x="140" y="22" width="92" height="20" rx="3" fill="#3a3f48"/><rect x="140" y="168" width="92" height="20" rx="3" fill="#3a3f48"/>`;
    [['13', 145], ['23', 170], ['31', 195], ['41', 220]].forEach(([l, x]) => { s += t(x, 36, l, 7.5, '#e8ecf2'); });
    [['14', 145], ['24', 170], ['32', 195], ['42', 220]].forEach(([l, x]) => { s += t(x, 182, l, 7.5, '#e8ecf2'); });
    s += `<rect x="146" y="70" width="80" height="70" rx="5" fill="#c9ced6" stroke="#6b717b"/>` + t(186, 92, 'AUX', 9, '#20252e', 800) + t(186, 108, '2NO + 2NC', 8, '#20252e') + `<rect x="170" y="116" width="32" height="12" rx="2" fill="${cl ? '#3aa356' : '#8a9099'}"/>`;
    if (st.burnt || p.fault === 'burnt') s += `<path d="M98 108 l10 -10 l2 8 l8 -6" fill="none" stroke="#ff5a3a" stroke-width="3"/>` + t(64, 148, 'BURNT', 9, '#d23a2a', 800);
    return s;
  };
  R.OL = (p) => {
    const st = p.state || {};
    let s = shade(160, 140, 6) + `<rect x="0" y="0" width="160" height="140" rx="6" fill="url(#rgGrey)" stroke="#3f454e"/>`;
    s += `<rect x="6" y="20" width="148" height="18" rx="3" fill="#3a3f48"/><rect x="6" y="102" width="148" height="18" rx="3" fill="#3a3f48"/>`;
    for (const q of D.OL.pins) s += screw(q.x, q.y === 0 ? 10 : 130);
    [['1', 20], ['3', 50], ['5', 80], ['95', 115], ['97', 145]].forEach(([l, x]) => { s += t(x, 33, l, 7.5, '#e8ecf2'); });
    [['2/T1', 20], ['4/T2', 50], ['6/T3', 80], ['96', 115], ['98', 145]].forEach(([l, x]) => { s += t(x, 115, l, 7.5, '#e8ecf2'); });
    s += `<rect x="10" y="44" width="140" height="52" rx="5" fill="#c9ced6" stroke="#6b717b"/>`;
    s += `<circle cx="40" cy="70" r="17" fill="#2a5db0" stroke="#173c7a"/><rect x="38.5" y="55" width="3" height="15" rx="1" fill="#fff" transform="rotate(${Math.min(270, (+p.props.set / 40) * 270) - 135} 40 70)"/>` + t(40, 93, (+p.props.set).toFixed(1) + ' A', 7.5, '#20252e');
    s += `<rect x="70" y="54" width="34" height="14" rx="3" fill="${st.tripped ? '#f2c21b' : '#8a9099'}"/>` + t(87, 64.5, st.tripped ? 'TRIP' : 'OK', 7.5, '#20252e', 800);
    s += `<rect x="70" y="74" width="16" height="14" rx="3" fill="#d23a2a"/>` + t(78, 84, 'T', 7, '#fff') + `<rect x="90" y="74" width="16" height="14" rx="3" fill="#2a5db0"/>` + t(98, 84, 'R', 7, '#fff');
    s += `<rect x="112" y="56" width="32" height="30" rx="3" fill="#15181d"/><rect x="114" y="${76 - 18 * Math.min(1, st.heat || 0)}" width="28" height="${18 * Math.min(1, st.heat || 0) + 2}" fill="${(st.heat || 0) > 0.7 ? '#d23a2a' : '#f2c21b'}"/>` + t(128, 66, 'cl.' + p.props.cls, 7, '#e8ecf2');
    return s;
  };

  /* ---------- operators: pushbuttons, selectors, e-stop, lamps ---------- */
  function operator(p, kind) {
    const st = p.state || {}, act = st.act;
    let s = `<rect x="6" y="56" width="28" height="24" rx="3" fill="url(#rgWhite)" stroke="#8f96a2"/>` + screw(20, 6.5, 5.5) + screw(20, 83.5, 5.5);
    s += `<rect x="13" y="10" width="14" height="12" rx="2" fill="#e9ecf0" stroke="#9097a3"/>`;
    s += `<circle cx="20" cy="36" r="17" fill="url(#rgChrome)" stroke="#5b626c"/>`;
    if (kind === 'ESTOP') {
      s += `<circle cx="20" cy="36" r="19" fill="#f2c21b" stroke="#8a6d08"/><circle cx="20" cy="36" r="${act ? 13 : 15}" fill="#d23a2a" stroke="#7a1d14"/><circle cx="15" cy="31" r="4" fill="#fff" opacity=".35"/>`;
    } else if (kind === 'SEL' || kind === 'KEY') {
      s += `<circle cx="20" cy="36" r="13" fill="#1c1f25"/><rect x="17" y="24" width="6" height="24" rx="3" fill="${kind === 'KEY' ? '#c9a24a' : '#e8ecf2'}" transform="rotate(${act ? 45 : -45} 20 36)"/>`;
    } else {
      const col = kind === 'NC' ? '#d23a2a' : kind === 'NO' ? '#3aa356' : '#2f6ee0';
      s += `<circle cx="20" cy="36" r="${act ? 11 : 13}" fill="${col}" stroke="#20252e"/><circle cx="16" cy="32" r="3.5" fill="#fff" opacity=".35"/>` + t(20, 40, kind === 'NC' ? 'O' : 'I', 10, '#fff', 800);
    }
    if (st.hold) s += t(36, 16, 'hold', 8, '#f2c21b', 700, 'start');
    s += t(20, 72, kind === 'NC' || kind === 'ESTOP' ? 'NC' : 'NO', 7.5, '#20252e');
    return s;
  }
  R.PB_NO = (p) => operator(p, 'NO'); R.PB_NC = (p) => operator(p, 'NC'); R.ESTOP = (p) => operator(p, 'ESTOP'); R.SEL2 = (p) => operator(p, 'SEL'); R.KEY = (p) => operator(p, 'KEY');
  R.LAMP = (p) => {
    const col = { green: '#5fdc6a', red: '#ff4b3a', amber: '#ffc21b', white: '#ffffff', blue: '#4fb8ff' }[p.props.color] || '#5fdc6a';
    const st = p.state || {}, b = st.b || 0, bu = st.burnt || p.fault === 'burnt';
    let s = screw(20, 6.5, 5.5) + screw(20, 73.5, 5.5) + `<rect x="8" y="52" width="24" height="16" rx="3" fill="url(#rgWhite)" stroke="#8f96a2"/>`;
    if (b > 0.05 && !bu) s += `<circle cx="20" cy="34" r="${22 + 6 * b}" fill="${col}" opacity="${(0.35 * b).toFixed(2)}"/>`;
    s += `<circle cx="20" cy="34" r="16" fill="url(#rgChrome)" stroke="#5b626c"/><circle cx="20" cy="34" r="12" fill="${bu ? '#222' : col}" opacity="${bu ? 1 : (0.35 + 0.65 * b).toFixed(2)}" stroke="#20252e"/>`;
    s += `<circle cx="16" cy="30" r="3.5" fill="#fff" opacity="${(0.25 + 0.5 * b).toFixed(2)}"/>` + t(20, 64, p.props.volt.replace('VAC', 'V~').replace('VDC', 'V='), 7, '#20252e');
    return s;
  };

  /* ---------- motor: blue TEFC motor driving a pump / fan / gear load ---------- */
  R.MOT3 = (p) => {
    const st = p.state || {}, run = st.w > 0.03, dur = run ? Math.max(0.12, 1.1 / st.w) : 0, six = p.props.conn === '6wire';
    const load = +p.props.load;
    let s = `<ellipse cx="75" cy="133" rx="70" ry="6" fill="#000" opacity=".3"/>`;
    s += `<rect x="22" y="112" width="96" height="14" rx="3" fill="#1d4688"/><rect x="28" y="122" width="16" height="10" fill="#173c7a"/><rect x="96" y="122" width="16" height="10" fill="#173c7a"/>`;
    s += `<rect x="10" y="44" width="112" height="74" rx="14" fill="url(#rgFins)" stroke="#173c7a"/>`;
    for (let i = 0; i < 7; i++) s += `<rect x="16" y="${52 + i * 9}" width="100" height="3" rx="1.5" fill="#173c7a" opacity=".55"/>`;
    s += `<rect x="2" y="50" width="14" height="62" rx="5" fill="#2a5db0" stroke="#173c7a"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="4" y="${55 + i * 9}" width="10" height="2.5" fill="#173c7a"/>`;
    s += `<rect x="12" y="3" width="126" height="34" rx="5" fill="url(#rgBlue)" stroke="#173c7a"/><rect x="18" y="37" width="114" height="9" fill="#1d4688"/>`;
    s += `<rect x="18" y="9" width="114" height="22" rx="3" fill="#e8742a" opacity=".92"/>`;
    for (const [l, x] of [['U', 30], ['V', 75], ['W', 120]]) s += screw(x, 15, 6) + t(x, 29, l + (six ? '1' : ''), 7, '#20252e');
    if (!six) s += `<path d="M36 19 L69 19 M81 19 L114 19" stroke="#c8743a" stroke-width="2.4" opacity="${p.props.conn === 'delta' ? 0 : 0}"/>`;
    s += `<circle cx="142" cy="70" r="4" fill="#5fb04a"/>`;
    s += `<rect x="40" y="70" width="48" height="24" rx="2" fill="#dfe3e8" stroke="#6b717b"/>` + t(64, 80, (p.props.kw || '') + ' kW  ' + (p.props.conn === 'star' ? 'Y' : p.props.conn === 'delta' ? 'Δ' : 'Y/Δ'), 7, '#20252e') + t(64, 90, '1450 rpm  400V', 6.5, '#3a4150');
    // shaft / coupling / load at the right end (within the 150 px footprint)
    s += `<rect x="122" y="76" width="10" height="10" fill="url(#rgChrome)"/>`;
    const spin = `class="${dur ? (st.dir < 0 ? 'spinr' : 'spin') : ''}" style="${dur ? 'animation-duration:' + dur.toFixed(2) + 's;' : ''}transform-box:fill-box;transform-origin:center"`;
    if (load <= 0.35) s += `<g ${spin}>${[0, 120, 240].map((a) => `<ellipse cx="142" cy="66" rx="5" ry="15" fill="#9aa0a8" transform="rotate(${a} 142 81)"/>`).join('')}<circle cx="142" cy="81" r="4" fill="#5c626b"/></g>`;
    else if (load <= 0.7) s += `<circle cx="140" cy="81" r="13" fill="url(#rgBlue)" stroke="#173c7a"/><rect x="134" y="52" width="12" height="16" fill="#2a5db0" stroke="#173c7a"/><rect x="131" y="48" width="18" height="5" fill="#1d4688"/><g ${spin}><path d="M140 72 v18 M131 81 h18" stroke="#9fc3ff" stroke-width="2"/></g>`;
    else s += `<rect x="130" y="66" width="18" height="30" rx="3" fill="#7d838c" stroke="#4b515a"/><g ${spin}><circle cx="139" cy="81" r="6" fill="none" stroke="#2f3540" stroke-width="2" stroke-dasharray="3 2"/></g>`;
    if (six) for (const [l, x] of [['W2', 30], ['U2', 75], ['V2', 120]]) s += `<line x1="${x}" y1="126" x2="${x}" y2="140" stroke="#8a9099" stroke-width="2"/>` + t(x, 138, l, 6.5, '#e8ecf2');
    s += T(75, 106, run ? Math.round(st.w * 1450) + ' rpm ' + (st.dir < 0 ? 'REV' : 'FWD') : '', 'psub', 'middle', 'style="font-size:9px;fill:#fff"');
    if (p.fault === 'seized') s += t(64, 64, 'JAMMED', 8, '#f2c21b', 800);
    return s;
  };

  /* ---------- DIN rail and wire duct (back layer, snap target) ---------- */
  function rail(len) {
    return {
      cat: 'draw', prefix: 'RAIL', name: ['DIN rail ' + len / 10 + ' cm', 'ريل DIN ' + len / 10 + ' سم'], w: len, h: 24, back: true, hitH: 24, pcb: false,
      info: ['35 mm DIN rail. Drop breakers, contactors and terminals near it: they clip onto it in a line, like in a real panel.', 'ريل DIN مقاس 35 مم. حط البريكرات والكونتاكتورات والترمينالات جنبه: هتتركّب عليه في صف زي اللوحة الحقيقية.'],
      pins: [], props: [], faults: [['none', ['None', 'سليم']]], diag: { kind: 'decor' }, rail: true,
      draw() { return `<rect x="0" y="0" width="${len}" height="24" rx="2" fill="url(#rgRail)" stroke="#6b737e"/>` + Array.from({ length: Math.floor(len / 40) }, (_, i) => `<rect x="${14 + i * 40}" y="9" width="16" height="6" rx="3" fill="#59606a"/>`).join(''); },
    };
  }
  function duct(len, vert) {
    const w = vert ? 40 : len, h = vert ? len : 40;
    return {
      cat: 'draw', prefix: 'WD', name: vert ? ['Wire duct (vertical)', 'مجرى أسلاك (رأسي)'] : ['Wire duct (horizontal)', 'مجرى أسلاك (أفقي)'], w, h, back: true, hitH: Math.min(h, 40), pcb: false,
      info: ['Slotted wire duct (trunking). Run the wires inside it between the rows of devices.', 'مجرى أسلاك مشقوق (ترنكنج). عدّي الأسلاك جواه بين صفوف الأجهزة.'],
      pins: [], props: [], faults: [['none', ['None', 'سليم']]], diag: { kind: 'decor' },
      draw() { return `<rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="url(#rgSlots)" stroke="#5d646e"/><rect x="${vert ? 8 : 4}" y="${vert ? 4 : 8}" width="${vert ? 24 : w - 8}" height="${vert ? h - 8 : 24}" rx="2" fill="#a3aab3" opacity=".9"/>`; },
    };
  }
  function plate(w, h) {
    return {
      cat: 'draw', prefix: 'MP', name: ['Mounting plate ' + w / 10 + ' x ' + h / 10, 'ضهر لوحة ' + w / 10 + ' × ' + h / 10], w, h, back: true, hitH: 30, pcb: false,
      info: ['Galvanised mounting plate of a panel. Put DIN rails and ducts on it, then the devices.', 'ضهر لوحة مجلفن. ركّب عليه الريلات والمجاري وبعدين الأجهزة.'],
      pins: [], props: [{ k: 'text', label: ['Title', 'العنوان'], t: 'text1', max: 40, def: 'Panel' }], faults: [['none', ['None', 'سليم']]], diag: { kind: 'decor' },
      draw(p) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="6" fill="#c3c8cf" stroke="#7a818b" stroke-width="2"/><rect x="0" y="0" width="${w}" height="30" rx="6" fill="#9aa1ab"/>` + `<text x="14" y="20" style="font:700 13px system-ui;fill:#1d2129">${String((p && p.props.text) || 'Panel').replace(/[<&]/g, '')}</text>` + [[12, 12], [w - 12, 12], [12, h - 12], [w - 12, h - 12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#7a818b"/>`).join(''); },
    };
  }
  D.PLATE = plate(700, 520);
  D.RAIL40 = rail(400); D.RAIL60 = rail(600);
  D.DUCTH = duct(600, false); D.DUCTV = duct(400, true);
  R.isRail = (p) => !!(D[p.type] && D[p.type].rail);
})(typeof window !== 'undefined' ? window : globalThis);
