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
    <linearGradient id="plSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7e8999"/><stop offset=".2" stop-color="#eef2f6"/><stop offset=".5" stop-color="#b9c3cf"/><stop offset=".8" stop-color="#f2f5f8"/><stop offset="1" stop-color="#76818f"/></linearGradient>
    <linearGradient id="plBrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6da86"/><stop offset=".45" stop-color="#c99a2e"/><stop offset="1" stop-color="#7a5710"/></linearGradient>
    <linearGradient id="plMotor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6db4f2"/><stop offset=".4" stop-color="#2373c8"/><stop offset="1" stop-color="#0e3a72"/></linearGradient>
    <linearGradient id="plCast" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dfe5ec"/><stop offset=".6" stop-color="#9aa5b4"/><stop offset="1" stop-color="#5f6a7a"/></linearGradient>
    <linearGradient id="plCoil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b414b"/><stop offset=".5" stop-color="#1b1f25"/><stop offset="1" stop-color="#0a0c10"/></linearGradient>
    <linearGradient id="plYel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset=".5" stop-color="#f5c200"/><stop offset="1" stop-color="#b88c00"/></linearGradient>
    <linearGradient id="plChem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9be36a"/><stop offset="1" stop-color="#3f9a2a"/></linearGradient>
    <linearGradient id="plGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfe9ff" stop-opacity=".45"/><stop offset=".35" stop-color="#ffffff" stop-opacity=".25"/><stop offset="1" stop-color="#8fb8d8" stop-opacity=".35"/></linearGradient>
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

  /* ---------------- shared bits ---------------- */
  const mode = () => (EL.bench && EL.bench.ed && EL.bench.ed.mode) || 'test';
  // dark status strip under a machine: "PUMP:OFF · EV:SHUT ..."; full size in Test mode, small while building
  const strip = (cx, y, text, cls) => {
    const sm = mode() === 'build', fs = sm ? 8.5 : 10.5, hh = sm ? 13 : 17, w = String(text).length * fs * 0.62 + 14;
    return `<g class="pl-strip${sm ? ' sm' : ''}${cls ? ' ' + cls : ''}"><rect x="${(cx - w / 2).toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${hh}" rx="3"/><text x="${cx}" y="${y + hh - (sm ? 3.5 : 4.5)}" text-anchor="middle">${esc(text)}</text></g>`;
  };
  PA.strip = strip;
  const led = (x, y, on, col, r) => `<circle cx="${x}" cy="${y}" r="${r || 3.2}" fill="${on ? col || '#ffb020' : '#2a2418'}" stroke="#05080e" stroke-width=".8"/>${on ? `<circle cx="${x}" cy="${y}" r="${(r || 3.2) * 2.2}" fill="${col || '#ffb020'}" opacity=".3"/>` : ''}`;
  const wires3 = (x, y) => [['#8a5a2b', 'BN'], ['#1a1a1a', 'BK'], ['#2a8bd6', 'BU']].map(([c, n], i) => `<circle cx="${x + i * 11}" cy="${y}" r="3" fill="${c}" stroke="#c9d1dc" stroke-width=".7"/><text class="pl-xs" x="${x + i * 11}" y="${y + 9}" text-anchor="middle">${n}</text>`).join('');
  // 3-wire PNP sensor head (box with name, LED and BN/BK/BU)
  const sensorBox = (x, y, name, on, link) => `<rect x="${x}" y="${y}" width="44" height="26" rx="3" fill="#0f1726" stroke="${on ? '#ffb020' : '#47BFD9'}" stroke-width="1.3"/>` +
    `<text class="pl-xs b" x="${x + 4}" y="${y + 9}">${esc(name)}</text>` + led(x + 37, y + 6, on) + wires3(x + 8, y + 15) + (link ? `<text class="pl-xs" x="${x + 22}" y="${y + 36}" text-anchor="middle">${esc(link)}</text>` : '');
  // motor body seen from the side, with fins, fan cowl and a terminal box
  const motorSide = (x, y, w, hgt, run) => {
    let s = `<rect x="${x - 9}" y="${y + 4}" width="11" height="${hgt - 8}" rx="4" fill="url(#plMetalV)" stroke="#3d4656"/>`;
    for (let i = 0; i < 4; i++) s += `<line x1="${x - 7 + i * 2.5}" y1="${y + 8}" x2="${x - 7 + i * 2.5}" y2="${y + hgt - 8}" stroke="#2a3140" stroke-width="1"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="6" fill="url(#plMotor)" stroke="#0b2a52" stroke-width="1.5"/>`;
    for (let yy = y + 6; yy < y + hgt - 3; yy += 5.5) s += `<line x1="${x + 3}" y1="${yy}" x2="${x + w - 3}" y2="${yy}" stroke="#0b3566" stroke-width="1.6" opacity=".55"/>`;
    s += `<rect x="${x + w - 4}" y="${y + 3}" width="5" height="${hgt - 6}" rx="2" fill="#174f8f"/>`;
    return s + (run ? `<circle cx="${x + w / 2}" cy="${y + hgt / 2}" r="${hgt / 2 - 2}" fill="#9fd0ff" opacity=".08"/>` : '');
  };

  /* ---------------- per unit ---------------- */
  const D = {};
  D.SUPPLY = (u) => {
    const st = u.state, pr = u.props, hot = (+pr.temp || 20) > 40, stock = +pr.stock || 0, left = stock > 0 ? (st.left == null ? stock : st.left) : null;
    if (pr.style === 'ibc') {
      // 1000 L IBC tote on a raised stand; its bottom tap is the outlet
      const fr = left == null ? 0.8 : Math.max(0, Math.min(1, left / stock)), x0 = 6, x1 = 80, y0 = -30, y1 = 30, wy = y1 - 4 - (y1 - y0 - 8) * fr;
      let s = `<rect x="10" y="40" width="5" height="40" fill="#5c6677"/><rect x="72" y="40" width="5" height="40" fill="#5c6677"/><rect x="40" y="44" width="4" height="36" fill="#4b5566"/><rect x="6" y="62" width="76" height="3" fill="#4b5566"/><rect x="4" y="77" width="80" height="4" rx="1" fill="#3f4858"/>`;
      s += `<rect x="4" y="36" width="80" height="6" rx="1" fill="#26292f"/><rect x="${x0 + 2}" y="${y0 + 3}" width="${x1 - x0 - 4}" height="${y1 - y0 - 4}" rx="6" fill="#e9eef2" opacity=".2" stroke="#d9e1e8" stroke-width="1"/>`;
      if (fr > 0.005) s += `<rect x="${x0 + 4}" y="${wy.toFixed(1)}" width="${x1 - x0 - 8}" height="${(y1 - 3 - wy).toFixed(1)}" rx="4" fill="url(#${hot ? 'plHot' : 'plChem'})" opacity=".85"/>`;
      for (const yy of [y0, -10, 10, y1]) s += `<line x1="${x0}" y1="${yy}" x2="${x1}" y2="${yy}" stroke="#a3adbb" stroke-width="2.4"/>`;
      for (const xx of [x0, 24.5, 43, 61.5, x1]) s += `<line x1="${xx}" y1="${y0}" x2="${xx}" y2="${y1}" stroke="#a3adbb" stroke-width="2.4"/>`;
      s += `<rect x="36" y="${y0 - 6}" width="14" height="6" rx="1" fill="#e6e9ee" stroke="#8792a5"/><rect x="28" y="-4" width="22" height="13" rx="1" fill="#f4f6f8"/><path d="M33 1 l5 -4 l5 4 l-5 4 z" fill="none" stroke="#e5483b" stroke-width="1.4"/>`;
      s += `<rect x="80" y="26" width="12" height="8" fill="url(#plMetalV)"/><rect x="86" y="26" width="10" height="20" fill="url(#plMetal)"/><rect x="83" y="22" width="7" height="14" rx="2" fill="#2b6fd6" stroke="#0b1422"/>` + nozzle(100, 40, 'r', 8);
      s += tx(43, y0 - 12, u.tag, 'pl-tag');
      return s + strip(44, 88, u.tag + ' · ' + (left == null ? '∞' : Math.round(left) + '/' + Math.round(stock) + ' L') + ' · ' + lpm(st.q) + ' L/min', left != null && left <= 0.001 ? 'alarm' : '');
    }
    return `<rect x="4" y="22" width="80" height="50" rx="6" fill="#18263d" stroke="#5b6b86" stroke-width="2"/>` +
      `<path d="M10 46 q10 -6 20 0 t20 0 t20 0 t12 0 V68 H10 Z" fill="url(#${hot ? 'plHot' : 'plWater'})" opacity=".9"/>` +
      nozzle(100, 40, 'r', 18) + tx(44, 16, u.tag, 'pl-tag') +
      tx(44, 88, f1(+pr.bar) + ' bar  ' + Math.round(+pr.temp) + ' °C', 'pl-s') + tx(44, 100, lpm(st.q) + ' L/min' + (left != null ? '  ' + Math.round(left) + ' L left' : ''), left != null && left <= 0.001 ? 'pl-bad' : 'pl-s');
  };
  D.DRAIN = (u) => `<rect x="10" y="20" width="62" height="36" rx="4" fill="#3a4354" stroke="#6b7486" stroke-width="2"/>` + [0, 1, 2, 3, 4].map((i) => `<rect x="${18 + i * 11}" y="26" width="5" height="24" rx="1" fill="#1a2030"/>`).join('') +
    nozzle(0, 24, 'l', 12) + tx(41, 14, u.tag, 'pl-tag') + tx(41, 70, lpm(u.state.q) + ' L/min', 'pl-s');

  /* tank shapes: liquid range top..bot, wall x for switches, outline path, back / front extras */
  const header = (y) => `<rect x="0" y="${y - 6}" width="180" height="12" fill="url(#plMetalV)"/>`;
  const legs = (xs, yA, yB, op) => xs.map((x) => `<g opacity="${op || 1}"><rect x="${x - 3}" y="${yA}" width="6" height="${yB - yA}" fill="url(#plMetal)"/><rect x="${x - 8}" y="${yB}" width="16" height="4" rx="1" fill="#6b7486"/></g>`).join('');
  const TSHAPE = {
    open: () => ({ x0: 14, x1: 166, top: 26, bot: 226, path: 'M14 26 H166 V226 H14 Z', info: 218, hy: 212, jk: [66, 150], nz: 22,
      back: `<rect x="30" y="226" width="14" height="14" fill="#4b5566"/><rect x="136" y="226" width="14" height="14" fill="#4b5566"/>`, front: `<rect x="8" y="20" width="164" height="8" rx="2" fill="#8792a5"/>` }),
    cone: () => ({ x0: 34, x1: 146, top: 20, bot: 196, path: 'M34 34 Q34 16 90 16 Q146 16 146 34 V156 L96 196 H84 L34 156 Z', info: 146, hy: 140, jk: [40, 110], nz: 30,
      back: legs([90], 150, 232, 0.55), front: `<rect x="84" y="196" width="12" height="20" fill="url(#plMetal)"/>` + header(222) + `<rect x="80" y="214" width="20" height="5" rx="1" fill="#9aa5b6"/>` + legs([38, 142], 120, 232) + `<rect x="30" y="150" width="120" height="4" fill="#9aa5b6" opacity=".9"/>` }),
    vessel: () => ({ x0: 36, x1: 144, top: 14, bot: 198, path: 'M36 40 A54 28 0 0 1 144 40 V170 A54 28 0 0 1 36 170 Z', info: 160, hy: 150, jk: [44, 120], nz: 32,
      back: legs([90], 160, 232, 0.55), front: `<rect x="84" y="196" width="12" height="20" fill="url(#plMetal)"/>` + header(222) + legs([44, 136], 150, 232) +
        `<rect x="22" y="56" width="8" height="110" rx="3" fill="#0f1726" stroke="#c9d1dc"/><rect x="31" y="58" width="5" height="4" fill="#9aa5b6"/><rect x="31" y="160" width="5" height="4" fill="#9aa5b6"/>` }),
    ibc: () => ({ x0: 16, x1: 164, top: 28, bot: 206, path: 'M22 28 Q22 24 32 24 H148 Q158 24 158 34 V200 Q158 208 148 208 H32 Q22 208 22 200 Z', info: 196, hy: 190, jk: [40, 140], nz: 20, ibc: true,
      back: `<rect x="12" y="212" width="156" height="6" fill="#26292f"/><rect x="16" y="218" width="18" height="16" fill="#26292f"/><rect x="81" y="218" width="18" height="16" fill="#26292f"/><rect x="146" y="218" width="18" height="16" fill="#26292f"/><rect x="12" y="232" width="156" height="6" fill="#1d1f24"/>`,
      front: (() => { let c = ''; for (const yy of [18, 66, 114, 162, 210]) c += `<line x1="16" y1="${yy}" x2="164" y2="${yy}" stroke="#a3adbb" stroke-width="3.4"/><line x1="16" y1="${yy - 1}" x2="164" y2="${yy - 1}" stroke="#e3e8ee" stroke-width=".8"/>`;
        for (const xx of [16, 53, 90, 127, 164]) c += `<line x1="${xx}" y1="18" x2="${xx}" y2="210" stroke="#a3adbb" stroke-width="3.4"/>`;
        return c + `<rect x="60" y="120" width="40" height="24" rx="2" fill="#f4f6f8" opacity=".9"/><text class="pl-xs" x="80" y="135" text-anchor="middle" style="fill:#1b2433">IBC</text>` +
          `<rect x="80" y="10" width="20" height="10" rx="2" fill="#e6e9ee" stroke="#8792a5"/><rect x="84" y="206" width="12" height="16" fill="url(#plMetal)"/><rect x="78" y="204" width="24" height="9" rx="2" fill="#2b2f36"/><rect x="96" y="200" width="16" height="5" rx="2" fill="#2b6fd6"/>` + header(222); })() }),
  };
  D.TANK = (u) => {
    const st = u.state, pr = u.props, lvl = Math.max(0, Math.min(100, st.lvl == null ? (100 * (st.v || 0)) / (+pr.vol || 1) : st.lvl));
    const sty = TSHAPE[pr.style] ? pr.style : 'open', G = TSHAPE[sty](), { x0, x1 } = G, y0 = G.top, y1 = G.bot, H = y1 - y0, wy = y1 - (H * lvl) / 100;
    const T = st.T == null ? 20 : st.T, hot = T > 35, cid = 'plTk' + String(u.id).replace(/\W/g, '') + sty;
    const ly = (l) => y1 - (H * Math.max(0, Math.min(100, +l || 0))) / 100;
    let s = G.back;
    s += `<clipPath id="${cid}"><path d="${G.path}"/></clipPath>`;
    s += `<path d="${G.path}" fill="${G.ibc ? 'rgba(233,238,242,.13)' : '#121c2c'}"/>`;
    s += `<g clip-path="url(#${cid})"><rect x="0" y="${wy}" width="180" height="${Math.max(0, y1 - wy + 2)}" fill="url(#${hot ? 'plHot' : 'plWater'})" opacity=".85"/>`;
    if (lvl > 1) s += `<path class="pl-wave" d="M0 ${wy} q12 -4 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 V${wy + 6} H0 Z" fill="#8ee0ff" opacity=".45"/>`;
    if (!G.ibc) s += `<rect x="${(x0 + x1) / 2 - 24}" y="0" width="14" height="260" fill="#fff" opacity=".05"/>`;
    s += '</g>';
    for (let i = 1; i < 10; i++) { const y = ly(i * 10); s += `<line x1="${x0 + 3}" y1="${y}" x2="${x0 + (i % 5 ? 9 : 15)}" y2="${y}" stroke="#7d8aa1" stroke-width="1.3"/>`; if (sty !== 'open' && !(i % 5)) s += `<text class="pl-xs" x="${x0 + 18}" y="${y + 3}">${Math.round((+pr.vol * i) / 10)} L</text>`; }
    if (!G.ibc) s += `<path d="${G.path}" fill="none" stroke="url(#${sty === 'open' ? 'plMetal' : 'plSteel'})" stroke-width="${sty === 'open' ? 5 : 4.5}"/>`;
    s += G.front;
    s += tx(90, wy - 8 < y0 + 26 ? y0 + 26 : Math.min(wy - 8, G.info - 18), Math.round(lvl) + ' %', 'pl-big');
    if (sty === 'vessel') s += `<rect x="${x0 - 13}" y="${wy < 56 ? 56 : Math.min(166, wy)}" width="6" height="${Math.max(0, 166 - Math.max(56, Math.min(166, wy)))}" fill="url(#${hot ? 'plHot' : 'plWater'})"/>`;
    // level transmitter on the roof
    if (pr.lt) {
      s += `<rect x="78" y="${y0 - 18}" width="24" height="14" rx="3" fill="#3a4660" stroke="#9aa5b6"/><path d="M86 ${y0 + 2} L94 ${y0 + 2} L${100} ${wy - 2} L${80} ${wy - 2} Z" fill="#c9b47a" opacity=".18"/>`;
      s += tx(176, y0 - 14, 'LT ' + pr.lt, 'pl-s', 'start') + tx(176, y0 - 2, Math.round(lvl) + ' %', 'pl-s', 'start');
    }
    // level switches: floats or 3-wire PNP capacitive sensors on the wall
    (pr.sw || []).forEach((sw, i) => {
      if (!sw || !sw.n) return;
      const y = ly(sw.l), on = st.sw ? !!st.sw[i] : lvl > sw.l;
      if (sw.k === 'pnp') {
        s += `<rect x="${x1 - 12}" y="${y - 4}" width="18" height="8" rx="2" fill="url(#plMetalV)" stroke="#3d4656"/><rect x="${x1 + 6}" y="${y - 6}" width="6" height="12" rx="1" fill="#2a3140"/>`;
        s += sensorBox(x1 + 12, y - 13, sw.n, on, sw.t);
        return;
      }
      const fy = on ? y - 8 : y + 6;
      s += `<line x1="${x1 - 6}" y1="${y}" x2="${x1 - 20}" y2="${fy}" stroke="#0b1422" stroke-width="2"/><rect x="${x1 - 32}" y="${fy - 10}" width="14" height="20" rx="6" fill="#2b6fd6" stroke="#e5483b" stroke-width="1.5"/>`;
      s += `<path d="M${x1 + 2} ${y} H${x1 + 12} L${x1 + 16} ${y}" fill="none" stroke="#7d8aa1"/>` + lampDot(x1 + 22, y, on) + tx(x1 + 32, y + 4, sw.n + (sw.t ? ' (' + sw.t + ')' : ''), 'pl-s', 'start');
    });
    if (st.heatW > 1 || pr.htr) s += `<path d="M${x0 + 20} ${G.hy - 2} h30 v-6 h-30 v-6 h30" fill="none" stroke="${st.heatW > 1 ? '#ff6b3a' : '#7d8aa1'}" stroke-width="3"/>` + tx(x0 + 60, G.hy, (st.heatW > 1 ? Math.round(st.heatW) + ' W' : 'heater ' + pr.htr), 'pl-s', 'start');
    s += tx(90, G.info, Math.round(st.v || 0) + ' / ' + Math.round(+pr.vol) + ' L   ' + T.toFixed(1) + ' °C', 'pl-s halo');
    if (+pr.jkt > 0) s += `<rect x="${x0 - 9}" y="${y0 + G.jk[0]}" width="5" height="${G.jk[1]}" fill="#c8402a" opacity=".7"/><rect x="${x1 + 4}" y="${y0 + G.jk[0]}" width="5" height="${G.jk[1]}" fill="#c8402a" opacity=".7"/>`;
    if (st.ovf > 0.001) s += `<path class="pl-spill" d="M${x1 + 2} ${y0} q14 10 10 60" stroke="#4cc3ff" stroke-width="5" fill="none"/>` + tx(90, y0 - 10, 'OVERFLOW', 'pl-bad');
    s += nozzle(40, 0, 'u', G.nz) + nozzle(140, 0, 'u', G.nz) + nozzle(180, 222, 'r', 16) + nozzle(0, 222, 'l', 16);
    s += sty === 'open' ? tx(14, 12, u.tag, 'pl-tag', 'start') : tx(x0 - 4, 14, u.tag, 'pl-tag', 'end');
    const sws = (pr.sw || []).map((sw, i) => [sw, st.sw ? !!st.sw[i] : lvl > sw.l]).filter(([sw]) => sw && sw.n).sort((a, b) => (+a[0].l || 0) - (+b[0].l || 0));
    s += strip(90, 244, (sws.length ? sws.map(([sw, on]) => sw.n + ':' + (on ? 1 : 0)).join(' ') : u.tag) + ' · ' + Math.round(st.v || 0) + '/' + Math.round(+pr.vol) + ' L', st.ovf > 0.001 ? 'alarm' : '');
    const eta = EL.water && EL.water.tankETA(u);
    if (eta) s += tx(90, 276, (eta.fill ? 'to 90 % in ' : 'to 10 % in ') + EL.water.fmtT(eta.s), eta.fill ? 'pl-ok' : 'pl-warn');
    return s;
  };
  D.PUMP = (u) => {
    const st = u.state, pr = u.props, s1 = Math.abs(st.s || 0), run = s1 > 0.05, flip = !!pr.flip, w = 170, X = (x) => (flip ? w - x : x);
    let g = `<rect x="2" y="84" width="166" height="12" rx="2" fill="#262d39" stroke="#5c6677"/><rect x="12" y="78" width="48" height="6" fill="#1c2230"/><rect x="96" y="80" width="32" height="5" fill="#3f4858"/>`;
    g += [8, 162].map((x) => `<circle cx="${x}" cy="90" r="2.2" fill="#8792a5"/>`).join('');
    g += motorSide(12, 34, 50, 46, run);
    g += `<rect x="25" y="22" width="26" height="13" rx="2" fill="url(#plMotor)" stroke="#0b2a52"/><rect x="27" y="24" width="22" height="9" rx="1" fill="#0d1b30"/>` + [31, 38, 45].map((x) => `<circle cx="${x}" cy="27" r="1.6" fill="#d9c07a"/>`).join('');
    g += `<rect x="61" y="54" width="34" height="8" fill="url(#plMetalV)"/><rect x="62" y="46" width="28" height="26" rx="2" fill="url(#plYel)" stroke="#7a5d00"/>` + [67, 73, 79, 85].map((x) => `<rect x="${x}" y="50" width="2.4" height="18" fill="#3b2f00" opacity=".7"/>`).join('');
    g += `<rect x="88" y="52" width="8" height="18" fill="url(#plCast)" stroke="#4b5566"/>`;
    g += nozzle(112, 0, 'u', 40) + `<rect x="134" y="58" width="36" height="16" fill="url(#plMetalV)"/><rect x="164" y="54" width="6" height="24" rx="1" fill="#9aa5b6"/><rect x="134" y="55" width="5" height="22" rx="1" fill="#9aa5b6"/>`;
    g += `<circle cx="112" cy="62" r="25" fill="url(#plCast)" stroke="#4b5566" stroke-width="2"/><circle cx="112" cy="62" r="11" fill="#2f3744" stroke="#9aa5b6"/>`;
    g += `<g class="${run ? 'pl-spin' : ''}" style="${run ? 'animation-duration:' + Math.max(0.15, 0.8 / s1).toFixed(2) + 's;' : ''}transform-origin:112px 62px">` + [0, 60, 120, 180, 240, 300].map((a) => `<line x1="112" y1="62" x2="${112 + 9 * Math.cos((a * Math.PI) / 180)}" y2="${62 + 9 * Math.sin((a * Math.PI) / 180)}" stroke="#c9d1dc" stroke-width="2"/>`).join('') + '</g>';
    let s = flip ? `<g transform="translate(${w},0) scale(-1,1)">${g}</g>` : g;
    s += `<text class="pl-xs" x="${X(38)}" y="20" text-anchor="middle">U1 V1 W1</text>` + led(X(56), 28, run, '#5fe07a', 2.6);
    s += tx(X(37), 12, u.tag + (pr.motor ? '  -' + pr.motor : pr.local ? '  VFD ' + Math.round(+pr.spd) + ' %' : ''), 'pl-tag');
    s += `<text class="pl-np" x="85" y="93.5" text-anchor="middle">${esc(+pr.qbep > 0 ? 'Q ' + pr.qbep + ' m³/h · H ' + pr.hbep + ' m' : 'H ' + Math.round(+pr.head) + ' m · Q ' + Math.round(+pr.qmax) + ' L/min')}</text>`;
    const state = st.cav ? 'CAVITATION' : st.trip ? 'TRIP' : run ? 'RUN · ' + f1(st.dp || 0) + ' bar · ' + lpm(st.q) + ' L/min' : 'OFF';
    s += strip(85, 104, u.tag + ' ' + state, st.cav || st.trip ? 'alarm' : run ? 'run' : '');
    if (st.s < -0.05) s += tx(85, 136, 'REVERSE ROTATION', 'pl-bad');
    else if (pr.local && pr.lvt && st.lstop) s += tx(85, 136, 'level control: stopped', 'pl-s');
    else if (pr.local && run) s += tx(85, 136, (+pr.qbep > 0 ? (Math.abs(st.q || 0) * 3.6).toFixed(2) + ' m³/h  ' : '') + (st.kw || 0).toFixed(2) + ' kW', 'pl-s');
    else if (!pr.motor && !pr.local) s += tx(85, 136, 'no motor linked', 'pl-warn');
    return s;
  };
  const valveBody = (open, col) => `<path d="M10 30 L40 44 L10 58 Z M70 30 L40 44 L70 58 Z" fill="${col}" stroke="#0b1422" stroke-width="1.5"/><circle cx="40" cy="44" r="6" fill="#d3dae4"/>`;
  D.VALVE = (u) => {
    const st = u.state, pos = st.pos == null ? (u.props.open ? 1 : 0) : st.pos, open = pos > 0.5, col = open ? '#2fb25a' : '#d5463a', ang = -(1 - Math.max(0, Math.min(1, pos))) * 90;
    let s = inlinePipe(80, 44) + `<rect x="10" y="33" width="13" height="22" rx="2" fill="url(#plMetal)" stroke="#4b5566"/><rect x="57" y="33" width="13" height="22" rx="2" fill="url(#plMetal)" stroke="#4b5566"/>`;
    s += `<rect x="21" y="29" width="38" height="30" rx="12" fill="url(#plSteel)" stroke="#4b5566" stroke-width="1.5"/><circle cx="40" cy="44" r="7" fill="${open ? '#1b3a26' : '#3a1b1b'}" opacity=".35"/>`;
    s += `<rect x="36" y="18" width="8" height="12" fill="url(#plMetal)" stroke="#4b5566"/><rect x="33" y="16" width="14" height="4" rx="1" fill="#9aa5b6"/>`;
    s += `<g data-act="toggle" style="cursor:pointer"><rect x="0" y="-26" width="80" height="44" fill="transparent"/><g transform="rotate(${ang.toFixed(1)} 40 18)"><rect x="35" y="14.5" width="40" height="7" rx="2.5" fill="#cfd6df" stroke="#4b5566"/><rect x="56" y="13" width="22" height="10" rx="4" fill="${col}" stroke="#0b1422"/></g><circle cx="40" cy="18" r="3.5" fill="#5c6677"/></g>`;
    return s + strip(40, 66, u.tag + ' ' + (open ? 'OPEN' : 'SHUT') + ' · ' + lpm(st.q) + ' L/min', open ? 'run' : '');
  };
  D.SOLV = (u) => {
    const st = u.state, pos = st.pos || 0, open = pos > 0.5, en = !!st.en;
    let s = inlinePipe(80, 60) + `<rect x="5" y="50" width="13" height="20" rx="2" fill="url(#plBrass)" stroke="#6b4e10"/><rect x="62" y="50" width="13" height="20" rx="2" fill="url(#plBrass)" stroke="#6b4e10"/>`;
    s += `<rect x="16" y="45" width="48" height="29" rx="6" fill="url(#plBrass)" stroke="#6b4e10" stroke-width="1.5"/><path d="M26 66 h22 m-5 -4 l5 4 l-5 4" stroke="#6b4e10" stroke-width="1.6" fill="none"/>`;
    s += `<rect x="34" y="31" width="12" height="15" fill="url(#plMetal)" stroke="#4b5566"/>`;
    s += `<rect x="23" y="6" width="34" height="27" rx="3" fill="url(#plCoil)" stroke="#000"/><rect x="24" y="8" width="3" height="23" fill="#fff" opacity=".12"/><text class="pl-ev" x="38" y="24" text-anchor="middle">EV</text>`;
    s += `<rect x="57" y="9" width="15" height="20" rx="2" fill="#2a2f38" stroke="#0b1422"/><circle cx="64.5" cy="24" r="2" fill="#8792a5"/>` + led(64.5, 14.5, en, '#ffb020', 2.8);
    s += tx(40, -2, u.props.sol ? '-' + u.props.sol : '', 'pl-s');
    return s + strip(40, 80, u.tag + ' ' + (open ? 'OPEN' : 'SHUT') + (open ? ' · ' + lpm(st.q) + ' L/min' : ''), open ? 'run' : '');
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
    const st = u.state, n = Math.max(1, Math.min(6, Math.round(+u.props.ves || 1))), pass = Math.round(+u.props.pass || 0);
    let s = '';
    if (n === 1) s += `<rect x="10" y="22" width="200" height="36" rx="18" fill="#e8eef6" stroke="#8792a5" stroke-width="2"/><rect x="18" y="26" width="184" height="28" rx="14" fill="#cfd9e6"/>` + [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<line x1="${34 + i * 19}" y1="27" x2="${30 + i * 19}" y2="53" stroke="#9fb0c6"/>`).join('');
    else { // one tube per pressure vessel, fed from a common feed header, permeate and reject headers on the right
      const hh = 48 / n;
      for (let i = 0; i < n; i++) { const y = 16 + i * hh, th = Math.max(6, hh - 3); s += `<rect x="18" y="${y.toFixed(1)}" width="184" height="${th.toFixed(1)}" rx="${(th / 2).toFixed(1)}" fill="#dfe7f1" stroke="#8792a5" stroke-width="1.5"/>` + [0, 1, 2, 3, 4, 5, 6].map((k) => `<line x1="${44 + k * 22}" y1="${(y + 2).toFixed(1)}" x2="${40 + k * 22}" y2="${(y + th - 2).toFixed(1)}" stroke="#9fb0c6"/>`).join('') + tx(110, y + th / 2 + 3.5, 'PV' + (i + 1), 'pl-s'); }
    }
    s += `<rect x="4" y="14" width="10" height="52" rx="3" fill="#465169"/><rect x="206" y="14" width="10" height="52" rx="3" fill="#465169"/>`;
    s += nozzle(0, 40, 'l', 8) + nozzle(220, 18, 'r', 10) + nozzle(220, 62, 'r', 10);
    s += tx(110, -4, u.tag + (pass ? '  RO pass ' + pass : '  RO membrane') + (n > 1 ? ' · ' + n + ' vessels' : ''), 'pl-tag');
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

  /* bottle filling and capping conveyor (side view) */
  D.BOTTLE = (u) => {
    const st = u.state, pr = u.props, G = EL.plant.bottleGeo, bvol = Math.max(0.01, +pr.bvol || 0.5), ext = Math.max(0, Math.min(1, st.ext || 0));
    let B = Array.isArray(st.b) ? st.b : [];
    if (u.id === 'x' && !B.length) B = [{ x: 0.2, f: 0, cap: 0 }, { x: G.xf, f: 0.3, cap: 0 }, { x: G.xc, f: bvol, cap: 1 }, { x: 2.1, f: bvol, cap: 1 }]; // palette preview
    const run = !!st.run, fpx = G.fpx, cpx = G.cpx, rodY = 72 + 22 * ext;
    let s = `<line x1="0" y1="222" x2="520" y2="222" stroke="#3a4558" stroke-width="2" stroke-dasharray="10 6"/>`;
    // frame
    s += [44, 270, 500].map((x) => `<rect x="${x - 4}" y="166" width="8" height="50" fill="url(#plMetal)"/><rect x="${x - 9}" y="214" width="18" height="5" rx="1" fill="#6b7486"/>`).join('') + `<rect x="44" y="196" width="226" height="4" fill="#7d8899"/>`;
    // filler gantry and capper frame (behind the bottles)
    s += `<rect x="146" y="30" width="6" height="122" fill="url(#plMetal)"/><rect x="208" y="30" width="6" height="122" fill="url(#plMetal)"/><rect x="140" y="26" width="80" height="8" rx="1" fill="url(#plMetalV)"/>`;
    s += `<rect x="290" y="14" width="6" height="138" fill="url(#plMetal)"/><rect x="408" y="14" width="6" height="138" fill="url(#plMetal)"/><rect x="284" y="10" width="136" height="8" rx="1" fill="url(#plMetalV)"/>`;
    // belt, rollers, side rail
    s += `<rect x="22" y="148" width="476" height="20" rx="10" fill="#161b22" stroke="#0a0d12"/><rect x="30" y="148" width="460" height="5" fill="#2a313b"/>`;
    s += `<line class="pl-belt${run ? ' on' : ''}" x1="32" y1="150.5" x2="488" y2="150.5" style="${run ? 'animation-duration:' + Math.max(0.2, 2.4 / Math.max(0.05, Math.abs(st.v) * 5)).toFixed(2) + 's;' + (st.v < 0 ? 'animation-direction:reverse' : '') : ''}"/>`;
    s += [32, 488].map((x) => `<circle cx="${x}" cy="158" r="9" fill="url(#plCast)" stroke="#3d4656"/><circle cx="${x}" cy="158" r="2.5" fill="#3d4656"/>`).join('');
    s += `<rect x="40" y="157" width="440" height="11" rx="2" fill="url(#plMetalV)" stroke="#5c6677"/><line x1="40" y1="162.5" x2="480" y2="162.5" stroke="#5c6677" stroke-width=".8"/>`;
    // bottles
    for (const b of B) {
      const x = G.px(b.x), fr = Math.max(0, Math.min(1, b.f / bvol)), lt = 149 - 38 * fr;
      s += `<path d="M${x - 10} 149 V114 Q${x - 10} 108 ${x - 5} 106 V99 H${x + 5} V106 Q${x + 10} 108 ${x + 10} 114 V149 Z" fill="url(#plGlass)" stroke="#a9d2f0" stroke-width="1.2"/>`;
      if (fr > 0.01) s += `<rect x="${x - 8.5}" y="${lt.toFixed(1)}" width="17" height="${(149 - lt).toFixed(1)}" rx="1.5" fill="url(#plChem)" opacity=".85"/>`;
      if (fr >= 0.95) s += `<rect x="${x - 3.5}" y="104" width="7" height="${fr > 0.999 ? 4 : 2}" fill="url(#plChem)" opacity=".85"/>`;
      if (b.cap) s += `<rect x="${x - 6.5}" y="95" width="13" height="6" rx="1.5" fill="#F55B41" stroke="#7a1f12"/>`;
    }
    // filling nozzle (port 'fill' on top)
    s += nozzle(fpx, 0, 'u', 58) + `<rect x="${fpx - 13}" y="56" width="26" height="22" rx="3" fill="url(#plSteel)" stroke="#4b5566"/><rect x="${fpx - 3}" y="78" width="6" height="14" fill="url(#plMetal)"/>`;
    s += `<rect x="${fpx + 14}" y="58" width="22" height="11" rx="2" fill="#0f1726"/><text class="pl-xs" x="${fpx + 25}" y="66" text-anchor="middle">FILL</text>`;
    const fq = st.fq || 0, bf = B.find((b) => Math.abs(b.x - G.xf) < G.fTol);
    if (fq > 1e-5) {
      const ty = bf ? 149 - 38 * Math.max(0, Math.min(1, bf.f / bvol)) : 218;
      s += `<path class="pl-spill" d="M${fpx} 92 V${ty.toFixed(1)}" stroke="#7fdc5a" stroke-width="${Math.min(5, 1.5 + fq * 6).toFixed(1)}" fill="none"/>`;
    } else if (st.drip) s += `<circle cx="${fpx}" cy="96" r="1.8" fill="#7fdc5a"/>`;
    if ((st.spill || 0) > 0.01) s += `<ellipse cx="${fpx}" cy="219" rx="${Math.min(70, 10 + Math.sqrt(st.spill) * 28).toFixed(1)}" ry="4" fill="#7fdc5a" opacity=".55"/>`;
    // capping cylinder with its 5/2 valve and reed switches
    s += `<rect x="327" y="18" width="26" height="8" rx="1" fill="#5c6677"/><rect x="329" y="26" width="22" height="36" fill="url(#plSteel)" stroke="#4b5566"/><rect x="327" y="60" width="26" height="7" rx="1" fill="#5c6677"/>`;
    s += `<rect x="337" y="67" width="6" height="${(rodY - 67).toFixed(1)}" fill="url(#plMetal)"/><rect x="329" y="${rodY.toFixed(1)}" width="22" height="6" rx="1" fill="#3d4656"/><rect x="333.5" y="${(rodY + 6).toFixed(1)}" width="13" height="${ext > 0.95 && B.find((b) => Math.abs(b.x - G.xc) < G.fTol) ? 0 : 5}" rx="1.5" fill="#F55B41" opacity=".9"/>`;
    s += `<rect x="360" y="30" width="28" height="16" rx="2" fill="#2b3550" stroke="#9aa5b6"/><rect x="388" y="28" width="13" height="20" rx="2" fill="url(#plCoil)" stroke="#000"/>` + led(394.5, 34, ext > 0.05 && st.cyle, '#ffb020', 2.6) + `<text class="pl-xs" x="374" y="41" text-anchor="middle">5/2</text>`;
    s += `<path d="M360 36 H356 V22 H353 M360 42 H356 V64 H353" fill="none" stroke="#47BFD9" stroke-width="1.8"/>`;
    s += `<rect x="321" y="27" width="7" height="9" rx="1" fill="#1a2238"/>` + led(324.5, 31.5, !!st.ru, '#5fe07a', 2.2) + `<rect x="321" y="51" width="7" height="9" rx="1" fill="#1a2238"/>` + led(324.5, 55.5, !!st.rd, '#5fe07a', 2.2);
    s += `<text class="pl-xs" x="318" y="34" text-anchor="end">${esc(pr.rup || 'UP')}</text><text class="pl-xs" x="318" y="58" text-anchor="end">${esc(pr.rdn || 'DN')}</text><text class="pl-xs" x="374" y="56" text-anchor="middle">${esc(pr.cyl || '')}</text>`;
    // sensors under the belt
    s += `<rect x="${fpx - 2}" y="168" width="4" height="8" fill="#5c6677"/>` + sensorBox(fpx - 22, 175, 'S1', !!st.s1, pr.s1);
    s += `<rect x="${cpx - 2}" y="168" width="4" height="8" fill="#5c6677"/>` + sensorBox(cpx - 22, 175, 'S2', !!st.s2, pr.s2);
    // gear motor and its nameplate
    s += motorSide(398, 178, 52, 26, run) + `<rect x="412" y="170" width="20" height="9" rx="1" fill="url(#plMotor)" stroke="#0b2a52"/>` + led(428, 174.5, run, '#5fe07a', 2);
    s += `<rect x="450" y="172" width="34" height="36" rx="4" fill="url(#plCast)" stroke="#4b5566"/><circle cx="472" cy="186" r="7" fill="#7d8899" stroke="#3d4656"/><line x1="472" y1="186" x2="488" y2="160" stroke="#3d4656" stroke-width="3"/>`;
    s += `<rect x="398" y="207" width="54" height="11" rx="1.5" fill="#e8edf3" stroke="#8792a5"/><text class="pl-xs" x="425" y="215" text-anchor="middle" style="fill:#1b2433">${esc((pr.motor || 'M') + ' 3~ 0.37 kW')}</text>`;
    // counters (HMI)
    s += `<rect x="14" y="14" width="112" height="62" rx="5" fill="#0d1420" stroke="#47BFD9" stroke-width="1.2"/><rect x="20" y="20" width="100" height="50" rx="2" fill="#0a1a12"/>`;
    s += `<text class="pl-hmi ok" x="26" y="33">OK  ${st.ok || 0}</text><text class="pl-hmi bad" x="26" y="47">BAD ${st.bad || 0}</text><text class="pl-hmi" x="26" y="61">SPILL ${f1(st.spill || 0)} L</text>`;
    if (st.jam) s += `<g data-act="reset" style="cursor:pointer"><rect class="pl-blink" x="132" y="14" width="56" height="22" rx="4" fill="#b3261e" stroke="#ff8a7a"/><text class="pl-xs b" x="160" y="29" text-anchor="middle" style="fill:#fff">JAM ⟲</text></g>`;
    s += `<text class="pl-xs" x="24" y="92" text-anchor="middle">IN</text><path d="M34 89 h8 m-3 -3 l3 3 l-3 3" stroke="#b8c4d8" fill="none"/><text class="pl-xs" x="496" y="92" text-anchor="middle">OUT</text><path d="M474 89 h8 m-3 -3 l3 3 l-3 3" stroke="#b8c4d8" fill="none"/>`;
    s += tx(260, 32, u.tag + (pr.motor ? '  -' + pr.motor : ''), 'pl-tag');
    const txt = 'M:' + (st.jam ? 'JAM' : run ? 'RUN' : 'OFF') + ' · S1:' + (st.s1 ? 1 : 0) + ' · S2:' + (st.s2 ? 1 : 0) + ' · CYL:' + (ext > 0.95 ? 'DOWN' : ext < 0.05 ? 'UP' : 'MOVING') + ' · OK ' + (st.ok || 0) + ' · BAD ' + (st.bad || 0) + ' · SPILL ' + f1(st.spill || 0) + ' L';
    return s + strip(260, 228, txt, st.jam || st.ovf ? 'alarm' : run ? 'run' : '');
  };

  PA.D = D; PA.H = { tx, f1, lpm, nozzle, lampDot, inlinePipe, valveBody, strip, led, sensorBox, motorSide };
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
