/* LOTO practice board: the drawing. One SVG, ids on every part that changes (see loto_pr.js paint()). */
(function (g) {
  const EL = g.EL, L = EL.lotoData;
  if (!L) return;
  const A = (EL.lotoPrArt = {});
  const ICON = L.ICON;
  const ic = (k, x, y, s, extra) => `<g transform="translate(${x} ${y}) scale(${s / 64})"${extra || ''}>${ICON[k] || ''}</g>`;
  A.ic = ic;
  A.W = 1100; A.H = 1500;

  /* centre of every tappable point: x, y, hit radius */
  A.PT = {
    plugB: { x: 960, y: 330, r: 44 }, plugR: { x: 1040, y: 330, r: 44 },
    q1: { x: 204, y: 390, r: 56 }, pb1: { x: 140, y: 262, r: 30 }, pb2: { x: 268, y: 262, r: 30 },
    mccbA: { x: 422, y: 520, r: 52 }, mccbB: { x: 552, y: 520, r: 52 }, mcbC: { x: 700, y: 520, r: 62 },
    pb3: { x: 400, y: 379, r: 28 }, pb4: { x: 480, y: 379, r: 28 }, pb5: { x: 560, y: 379, r: 32 }, pb6: { x: 640, y: 379, r: 28 },
    bvA: { x: 470, y: 890, r: 34 }, dump: { x: 656, y: 948, r: 30 },
    w1: { x: 240, y: 1100, r: 34 }, w2: { x: 600, y: 1250, r: 34 }, w3: { x: 792, y: 1124, r: 46 },
    tp1: { x: 204, y: 322, r: 18 }, tp2: { x: 204, y: 460, r: 18 }, tp3: { x: 112, y: 1090, r: 18 }, tp4: { x: 170, y: 818, r: 18 }, tp5: { x: 420, y: 262, r: 22 },
    motor: { x: 190, y: 565, r: 60 }, comp: { x: 150, y: 885, r: 60 }, recv: { x: 322, y: 892, r: 70 }, frl: { x: 592, y: 892, r: 40 }, cyl: { x: 740, y: 890, r: 50 },
    pump: { x: 150, y: 1140, r: 52 }, vess: { x: 475, y: 1170, r: 46 },
    g1: { x: 594, y: 842, r: 26 }, g2: { x: 322, y: 818, r: 28 }, g3: { x: 400, y: 1060, r: 26 }, g4: { x: 560, y: 1160, r: 26 },
  };
  const P = A.PT;
  /* where the lock icons sit */
  A.LK = {
    q1: { x: 300, y: 372, s: 52 }, mccbA: { x: 422, y: 508, s: 66 }, mccbB: { x: 552, y: 508, s: 66 }, mcbC: { x: 700, y: 508, s: 78 },
    plugB: { x: 960, y: 330, s: 54 }, plugR: { x: 1040, y: 330, s: 54 },
    bvA: { x: 470, y: 858, s: 62 }, dump: { x: 700, y: 948, s: 52 }, w1: { x: 240, y: 1068, s: 62 }, w2: { x: 600, y: 1218, s: 62 }, w3: { x: 792, y: 1108, s: 80 },
    pb1: { x: 140, y: 262, s: 44 }, pb2: { x: 268, y: 262, s: 44 }, pb3: { x: 400, y: 379, s: 40 }, pb4: { x: 480, y: 379, s: 40 }, pb5: { x: 560, y: 379, s: 44 }, pb6: { x: 640, y: 379, s: 40 },
  };

  /* ---------- small parts ---------- */
  const gauge = (id, cx, cy, r, mx) => {
    let t = '';
    for (let i = 0; i <= 10; i++) {
      const a = (-135 + i * 27) * Math.PI / 180, s = Math.sin(a), c = -Math.cos(a), r1 = r - 3, r2 = r - (i % 5 === 0 ? 9 : 6);
      t += `<line x1="${(cx + s * r1).toFixed(1)}" y1="${(cy + c * r1).toFixed(1)}" x2="${(cx + s * r2).toFixed(1)}" y2="${(cy + c * r2).toFixed(1)}" stroke="#222" stroke-width="${i % 5 === 0 ? 2 : 1}"/>`;
    }
    const rz = `<path d="M${(cx + Math.sin(0.4 * Math.PI) * (r - 3)).toFixed(1)} ${(cy - Math.cos(0.4 * Math.PI) * (r - 3)).toFixed(1)} A${r - 3} ${r - 3} 0 0 1 ${(cx + Math.sin(0.75 * Math.PI) * (r - 3)).toFixed(1)} ${(cy - Math.cos(0.75 * Math.PI) * (r - 3)).toFixed(1)}" fill="none" stroke="#d9342b" stroke-width="3" opacity=".0"/>`;
    return `<g><circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="#8d96a6" stroke="#333" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fbfbf5" stroke="#222" stroke-width="1.5"/>${t}${rz}` +
      `<text x="${cx}" y="${cy + r * 0.52}" font-size="${(r * 0.42).toFixed(1)}" text-anchor="middle" fill="#444" font-weight="700">bar</text>` +
      `<g id="${id}n" transform="rotate(-135 ${cx} ${cy})"><path d="M${cx - 2.5} ${cy + 4} L${cx} ${cy - r + 7} L${cx + 2.5} ${cy + 4} Z" fill="#c62828"/></g><circle cx="${cx}" cy="${cy}" r="3.5" fill="#222"/></g>` +
      `<text id="${id}t" x="${cx}" y="${cy + r + 20}" font-size="14" text-anchor="middle" fill="#111" font-weight="700">0.0</text>`;
  };
  /* ball valve on a horizontal pipe, red lever; open = lever along the pipe, closed = across */
  const ball = (id, cx, cy, rot) => `<g${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}><rect x="${cx - 24}" y="${cy - 10}" width="48" height="20" rx="3" fill="#b8c0cf" stroke="#333" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="14" fill="#d8dde8" stroke="#333" stroke-width="2"/><g id="${id}l" transform="rotate(0 ${cx} ${cy})"><rect x="${cx - 4}" y="${cy - 5}" width="46" height="10" rx="5" fill="#d9342b" stroke="#601510" stroke-width="1.5"/><rect x="${cx + 34}" y="${cy - 7}" width="10" height="14" rx="4" fill="#b8231b" stroke="#601510"/></g><circle cx="${cx}" cy="${cy}" r="5" fill="#333"/></g>`;
  const pbtn = (id, cx, cy, r, collar) => `${collar ? `<circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="#f2c200" stroke="#222" stroke-width="2"/>` : ''}<circle cx="${cx}" cy="${cy}" r="${r}" fill="#2b2f3a" stroke="#111" stroke-width="2"/><g id="${id}c"><circle cx="${cx}" cy="${cy}" r="${r - 4}" fill="#e23b2e" stroke="#7d1a12" stroke-width="2"/><circle cx="${cx - r * 0.25}" cy="${cy - r * 0.28}" r="${r * 0.3}" fill="#fff" opacity=".28"/></g>`;
  const lamp = (id, cx, cy, r, on) => `<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="#222"/><circle id="${id}" cx="${cx}" cy="${cy}" r="${r}" fill="${on}" stroke="#111"/>`;
  const dot = (id, x, y) => `<circle id="${id}" class="ld" cx="${x}" cy="${y}" r="6" fill="#555" stroke="#111" stroke-width="1.5"/>`;
  const tag = (x, y, w, t, fs) => `<rect x="${x}" y="${y}" width="${w}" height="${(fs || 12) + 8}" rx="3" fill="#fff" stroke="#222" stroke-width="1.2"/><text x="${x + w / 2}" y="${y + (fs || 12) + 1}" font-size="${fs || 12}" text-anchor="middle" fill="#111" font-weight="700">${t}</text>`;
  const bolt = (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="#9a9a9a" stroke="#333"/><path d="M${x - 3} ${y} h6" stroke="#333" stroke-width="1.5"/>`;
  const tab = (x, y, w, t, col) => `<g><path d="M${x} ${y} h${w} l14 34 h-${w + 14} z" fill="#111"/><text x="${x + 14}" y="${y + 24}" font-size="19" font-weight="800" fill="${col || '#ffd21f'}" letter-spacing="1.5">${t}</text></g>`;

  /* ---------- the plug (face on) ---------- */
  const plug = (id, col, dark, pins, label) => `<g id="${id}"><g class="plugbody"><circle r="36" fill="${dark}" stroke="#111" stroke-width="2.5"/><circle r="29" fill="${col}" stroke="#111" stroke-width="1.5"/><circle r="19" fill="#1b1f27"/>` +
    pins.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.2" fill="#d4af37" stroke="#111"/>`).join('') + `<rect x="-4" y="-27" width="8" height="8" rx="2" fill="#d4af37"/></g></g>`;

  A.svg = function () {
    let s = '';
    s += `<defs>
      <pattern id="haz" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="44" height="44" fill="#f2c200"/><rect width="22" height="44" fill="#141414"/></pattern>
      <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfd5de"/><stop offset="1" stop-color="#aeb7c4"/></linearGradient>
      <linearGradient id="yel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd33a"/><stop offset="1" stop-color="#f2bd10"/></linearGradient>
      <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7dce5"/><stop offset="1" stop-color="#aab2c0"/></linearGradient>
      <linearGradient id="grn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#58bd63"/><stop offset="1" stop-color="#2f8a3b"/></linearGradient>
      <linearGradient id="tealg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd1e6"/><stop offset="1" stop-color="#2a97ad"/></linearGradient>
      <filter id="shd" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity=".35"/></filter>
      <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>`;
    /* wall */
    s += `<rect x="0" y="0" width="1100" height="1500" fill="url(#wall)"/><g opacity=".18" stroke="#fff">${Array.from({ length: 20 }, (_, i) => `<line x1="880" y1="${i * 78}" x2="1100" y2="${i * 78}"/>`).join('')}</g>`;
    /* board frame and plate */
    s += `<g filter="url(#shd)"><rect x="20" y="20" width="860" height="1460" rx="14" fill="url(#haz)" stroke="#111" stroke-width="4"/></g><rect x="46" y="46" width="808" height="1408" rx="6" fill="url(#yel)" stroke="#111" stroke-width="3"/>`;
    s += `<rect x="80" y="62" width="740" height="64" rx="10" fill="#c8261c" stroke="#5e0f0a" stroke-width="3"/><text x="450" y="108" font-size="40" font-weight="900" text-anchor="middle" fill="#fff" letter-spacing="4">LOTOTO TRAINING BOARD</text>${bolt(94, 76)}${bolt(806, 76)}${bolt(94, 112)}${bolt(806, 112)}`;

    /* ===== ELECTRICAL ===== */
    s += `<rect x="66" y="146" width="768" height="556" rx="8" fill="none" stroke="#111" stroke-width="3" stroke-dasharray="2 0"/>${tab(66, 146, 190, 'ELECTRICAL')}`;
    /* enclosure */
    s += `<rect x="84" y="200" width="240" height="270" rx="10" fill="url(#metal)" stroke="#4b5566" stroke-width="3" filter="url(#shd)"/><rect x="94" y="210" width="220" height="250" rx="6" fill="none" stroke="#fff" opacity=".45"/>${bolt(98, 214)}${bolt(300, 214)}${bolt(98, 456)}${bolt(300, 456)}`;
    s += pbtn('pb1', 140, 262, 24) + pbtn('pb2', 268, 262, 24) + lamp('lmpRun', 204, 262, 9, '#1f3b27');
    s += tag(112, 296, 56, 'START', 12) + tag(240, 296, 56, 'STOP', 12) + tag(180, 278, 48, 'RUN', 10);
    /* rotary isolator Q1 */
    s += `<rect x="140" y="332" width="128" height="116" rx="8" fill="#f5c518" stroke="#111" stroke-width="3"/><circle cx="204" cy="390" r="40" fill="#e9b400" stroke="#111" stroke-width="2"/>` +
      `<text x="204" y="350" font-size="16" font-weight="800" text-anchor="middle" fill="#111">0</text><text x="252" y="396" font-size="16" font-weight="800" text-anchor="middle" fill="#111">I</text>` +
      `<g id="q1k" transform="rotate(0 204 390)"><rect x="196" y="352" width="16" height="48" rx="6" fill="#d9342b" stroke="#601510" stroke-width="2"/><circle cx="204" cy="390" r="12" fill="#b8231b" stroke="#601510" stroke-width="2"/></g>` +
      `<g fill="#444"><circle cx="176" cy="338" r="3.5"/><circle cx="204" cy="338" r="3.5"/><circle cx="232" cy="338" r="3.5"/><circle cx="176" cy="442" r="3.5"/><circle cx="204" cy="442" r="3.5"/><circle cx="232" cy="442" r="3.5"/></g>`;
    /* built-in multi-lock hasp beside the handle */
    s += `<rect x="276" y="352" width="44" height="64" rx="5" fill="#d9342b" stroke="#222" stroke-width="2"/><g fill="#222"><circle cx="298" cy="364" r="5"/><circle cx="298" cy="384" r="5"/><circle cx="298" cy="404" r="5"/></g>`;
    s += dot('ldQ1a', 236, 322) + dot('ldQ1b', 236, 460);
    s += `<text x="204" y="486" font-size="13" text-anchor="middle" fill="#111" font-weight="800">Q1 ISOLATOR</text>`;
    /* motor */
    s += `<path id="wM" d="M204 470 V510 H178 V528" fill="none" stroke="#333" stroke-width="6" stroke-linecap="round"/>`;
    s += `<rect x="120" y="528" width="150" height="70" rx="16" fill="url(#tealg)" stroke="#12525f" stroke-width="3"/><g stroke="#12525f" stroke-width="2" opacity=".6">${Array.from({ length: 8 }, (_, i) => `<line x1="${136 + i * 16}" y1="532" x2="${136 + i * 16}" y2="594"/>`).join('')}</g><rect x="158" y="512" width="40" height="18" rx="3" fill="#2a97ad" stroke="#12525f" stroke-width="2"/>` +
      `<rect x="270" y="556" width="26" height="14" fill="#9aa3b5" stroke="#333" stroke-width="2"/><g class="spin" id="fanM"><circle cx="318" cy="563" r="24" fill="#cfd5e3" stroke="#333" stroke-width="2"/><path d="M318 541 v44 M296 563 h44 M302 547 l32 32 M334 547 l-32 32" stroke="#555" stroke-width="3"/><circle cx="318" cy="563" r="5" fill="#333"/></g>`;
    s += `<text x="204" y="618" font-size="14" text-anchor="middle" fill="#111" font-weight="800">M1 MOTOR</text>`;
    /* sockets */
    s += `<g><circle cx="420" cy="262" r="42" fill="#1d5fc6" stroke="#0c2a5c" stroke-width="3"/><circle cx="420" cy="262" r="30" fill="#161b24"/><g fill="#d4af37"><circle cx="404" cy="268" r="4.5"/><circle cx="436" cy="268" r="4.5"/><circle cx="420" cy="250" r="4.5"/></g><rect x="416" y="226" width="8" height="8" fill="#161b24"/></g>`;
    s += `<g><circle cx="560" cy="262" r="42" fill="#c62828" stroke="#5e0f0a" stroke-width="3"/><circle cx="560" cy="262" r="30" fill="#161b24"/><g fill="#d4af37"><circle cx="544" cy="270" r="4.5"/><circle cx="576" cy="270" r="4.5"/><circle cx="552" cy="250" r="4.5"/><circle cx="568" cy="250" r="4.5"/></g><rect x="556" y="226" width="8" height="8" fill="#161b24"/></g>`;
    s += tag(366, 312, 108, '230 V  1-PH', 12) + tag(506, 312, 108, '400 V  3-PH', 12);
    s += dot('ldSB', 458, 224) + dot('ldSR', 598, 224);
    /* supply lamps */
    s += `<rect x="642" y="212" width="176" height="104" rx="8" fill="#2b2f3a" stroke="#111" stroke-width="2"/><text x="730" y="232" font-size="12" text-anchor="middle" fill="#ffd21f" font-weight="800">SUPPLY ON</text>`;
    s += lamp('lmpL1', 668, 262, 10, '#1f3b27') + lamp('lmpL2', 706, 262, 10, '#1f3b27') + lamp('lmpL3', 744, 262, 10, '#1f3b27') + lamp('lmpN', 794, 262, 10, '#1f3b27');
    s += `<g font-size="12" fill="#fff" text-anchor="middle" font-weight="700"><text x="668" y="292">L1</text><text x="706" y="292">L2</text><text x="744" y="292">L3</text><text x="794" y="292">230 V</text></g>`;
    /* trunking with four pushbuttons */
    s += `<rect x="350" y="344" width="470" height="70" rx="8" fill="url(#metal)" stroke="#4b5566" stroke-width="3" filter="url(#shd)"/><g stroke="#8a93a3" stroke-width="1.5" opacity=".7"><line x1="356" y1="351" x2="814" y2="351"/><line x1="356" y1="407" x2="814" y2="407"/></g>`;
    s += pbtn('pb3', 400, 379, 20) + pbtn('pb4', 480, 379, 20) + pbtn('pb5', 560, 379, 20, true) + pbtn('pb6', 640, 379, 20);
    s += `<g>${tag(368, 420, 64, 'CYL OUT', 11)}${tag(448, 420, 64, 'CYL IN', 11)}${tag(528, 420, 64, 'E-STOP', 11)}${tag(608, 420, 64, 'RESET', 11)}</g>`;
    s += lamp('lmpCyl', 716, 379, 9, '#3a2f12') + lamp('lmpEst', 776, 379, 9, '#3a1512');
    s += `<g font-size="10" fill="#111" text-anchor="middle" font-weight="800"><text x="716" y="408">CYL</text><text x="776" y="408">E-STOP</text></g>`;
    /* breaker panel with clear cover */
    s += `<rect x="350" y="446" width="470" height="244" rx="10" fill="#27303f" stroke="#111" stroke-width="3"/><rect x="358" y="478" width="454" height="12" fill="#9aa3b5"/><rect x="358" y="598" width="454" height="10" fill="#9aa3b5"/>`;
    const mccb = (id, x, nm) => `<rect x="${x}" y="456" width="100" height="136" rx="6" fill="#3a4354" stroke="#111" stroke-width="2.5"/><rect x="${x + 14}" y="466" width="72" height="62" rx="4" fill="#171c26"/><g id="${id}h"><rect x="${x + 34}" y="470" width="32" height="26" rx="4" fill="#e9edf5" stroke="#111" stroke-width="2"/></g><text id="${id}s" x="${x + 50}" y="548" font-size="15" font-weight="800" text-anchor="middle" fill="#fff">OFF</text><text x="${x + 50}" y="576" font-size="12" text-anchor="middle" fill="#bcc5d6">MCCB 63 A</text>` + tag(x + 4, 600, 92, nm, 11);
    s += mccb('mA', 372, 'A  to M1') + mccb('mB', 502, 'B  to PUMP');
    s += `<g><rect x="640" y="456" width="120" height="136" rx="6" fill="#3a4354" stroke="#111" stroke-width="2.5"/><g stroke="#111" stroke-width="2"><line x1="680" y1="456" x2="680" y2="592"/><line x1="720" y1="456" x2="720" y2="592"/></g><rect x="648" y="466" width="104" height="62" rx="4" fill="#171c26"/><g id="mCh"><rect x="650" y="470" width="100" height="26" rx="4" fill="#e9edf5" stroke="#111" stroke-width="2"/></g><text id="mCs" x="700" y="548" font-size="15" font-weight="800" text-anchor="middle" fill="#fff">OFF</text><text x="700" y="576" font-size="12" text-anchor="middle" fill="#bcc5d6">MCB 3-pole C16</text>${tag(646, 600, 108, 'C  to COMPRESSOR', 11)}</g>`;
    s += dot('ldAi', 414, 452) + dot('ldAo', 414, 597) + dot('ldBi', 544, 452) + dot('ldBo', 544, 597) + dot('ldCi', 692, 452) + dot('ldCo', 692, 597);
    s += `<rect x="350" y="446" width="470" height="244" rx="10" fill="#bfe3ff" opacity=".16" stroke="#9ed0f5" stroke-width="3" pointer-events="none"/><path d="M360 458 L420 458 L360 504 Z" fill="#fff" opacity=".18" pointer-events="none"/>`;
    /* feeder wires */
    s += `<path id="wB" d="M552 622 V664 H56 V1130 H84" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path id="wC" d="M700 622 V650 H62 V850 H90" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/>`;

    /* ===== PNEUMATIC ===== */
    s += `<rect x="66" y="722" width="768" height="290" rx="8" fill="none" stroke="#111" stroke-width="3"/>${tab(66, 722, 170, 'PNEUMATIC')}`;
    const tube = (id, d) => `<path id="${id}" d="${d}" fill="none" stroke="#2f5d9e" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += tube('t1', 'M200 912 H226 V890 H252') + tube('t2', 'M392 890 H448') + tube('t3', 'M492 890 H552') + tube('t4', 'M632 890 H680') + tube('t5', 'M656 890 V932');
    /* compressor */
    s += `<g id="compG"><rect x="90" y="882" width="112" height="62" rx="22" fill="#2f5d9e" stroke="#142c52" stroke-width="3"/><rect x="108" y="826" width="84" height="56" rx="6" fill="#3d4757" stroke="#111" stroke-width="2.5"/><g stroke="#8a93a3" stroke-width="2">${Array.from({ length: 5 }, (_, i) => `<line x1="${118 + i * 16}" y1="832" x2="${118 + i * 16}" y2="876"/>`).join('')}</g><rect x="92" y="836" width="22" height="30" rx="3" fill="#d6dbe5" stroke="#333" stroke-width="2"/>${lamp('lmpPS', 103, 851, 5, '#1f3b27')}<circle cx="96" cy="960" r="7" fill="#222"/><circle cx="196" cy="960" r="7" fill="#222"/><rect x="88" y="944" width="116" height="8" fill="#555"/></g>`;
    s += `<text x="146" y="982" font-size="13" font-weight="800" text-anchor="middle" fill="#111">COMPRESSOR C1</text>`;
    /* receiver */
    s += `<rect x="252" y="850" width="140" height="80" rx="38" fill="url(#grn)" stroke="#1d5a26" stroke-width="3" filter="url(#shd)"/><path d="M322 850 V838" stroke="#333" stroke-width="6"/><rect x="262" y="862" width="120" height="10" rx="5" fill="#fff" opacity=".25"/>` + gauge('g2', 322, 810, 24, 10);
    s += `<text x="322" y="952" font-size="13" font-weight="800" text-anchor="middle" fill="#111">RECEIVER</text>`;
    /* valve BV-A */
    s += ball('bvA', 470, 890) + `<text id="bvAs" x="470" y="930" font-size="11" font-weight="800" text-anchor="middle" fill="#111">OPEN</text><text x="470" y="946" font-size="12" font-weight="800" text-anchor="middle" fill="#111">AIR ISOLATOR</text>`;
    /* FRL */
    s += `<rect x="552" y="872" width="80" height="14" rx="3" fill="#8f98ab" stroke="#333" stroke-width="2"/><rect x="556" y="886" width="22" height="38" rx="6" fill="#9fd4f2" stroke="#333" stroke-width="2" opacity=".9"/><rect x="584" y="886" width="22" height="30" rx="4" fill="#c5ccd9" stroke="#333" stroke-width="2"/><rect x="612" y="886" width="18" height="38" rx="6" fill="#f0b25b" stroke="#333" stroke-width="2"/><path d="M594 872 V860" stroke="#333" stroke-width="5"/>` + gauge('g1', 594, 836, 22, 10);
    s += `<text x="592" y="944" font-size="13" font-weight="800" text-anchor="middle" fill="#111">FRL</text>`;
    /* dump valve */
    s += ball('dmp', 656, 948, 90) + `<g id="dmpf" opacity="0"><circle cx="656" cy="982" r="5" fill="#cfe9ff"/><circle cx="644" cy="990" r="4" fill="#cfe9ff"/><circle cx="668" cy="992" r="4" fill="#cfe9ff"/><circle cx="656" cy="1000" r="3" fill="#cfe9ff"/></g>`;
    s += `<text id="dmps" x="690" y="962" font-size="11" font-weight="800" fill="#111">CLOSED</text><text x="690" y="978" font-size="12" font-weight="800" fill="#111">DUMP VALVE</text>`;
    /* cylinder: rod first so it hides inside the body when retracted */
    s += `<g id="cyR"><rect x="740" y="884" width="60" height="12" fill="#c9ced9" stroke="#333" stroke-width="2"/><rect x="798" y="874" width="14" height="32" rx="3" fill="#e9b400" stroke="#333" stroke-width="2"/></g>` +
      `<rect x="680" y="866" width="84" height="48" rx="6" fill="url(#metal)" stroke="#333" stroke-width="3"/><rect x="676" y="862" width="10" height="56" rx="3" fill="#555"/><rect x="758" y="862" width="10" height="56" rx="3" fill="#555"/><text x="722" y="896" font-size="12" font-weight="800" text-anchor="middle" fill="#222">CYL</text>`;
    s += `<text x="740" y="946" font-size="12" font-weight="800" text-anchor="middle" fill="#111">CYLINDER</text>`;
    s += dot('ldCmp', 192, 822);

    /* ===== WATER ===== */
    s += `<rect x="66" y="1030" width="768" height="272" rx="8" fill="none" stroke="#111" stroke-width="3"/>${tab(66, 1030, 270, 'WATER / HYDRAULIC')}`;
    const pipe = (id, d) => `<path id="${id}" d="${d}" fill="none" stroke="#2e7d32" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path id="${id}c" d="${d}" fill="none" stroke="#b9e6c0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += pipe('pw1', 'M190 1100 H740 V1250 H176 V1176') + `<path id="flow" d="M190 1100 H740 V1250 H176" fill="none" stroke="#7fd0ff" stroke-width="4" stroke-dasharray="10 14" opacity="0"/>`;
    s += pipe('pw2', 'M475 1100 V1135') + pipe('pw3', 'M740 1150 H792');
    /* pump */
    s += `<g id="pumpG"><rect x="84" y="1100" width="62" height="78" rx="8" fill="#3d4757" stroke="#111" stroke-width="2.5"/><g stroke="#8a93a3" stroke-width="2">${Array.from({ length: 4 }, (_, i) => `<line x1="${94 + i * 16}" y1="1106" x2="${94 + i * 16}" y2="1172"/>`).join('')}</g><circle cx="178" cy="1140" r="36" fill="#8ea3bd" stroke="#2a3a52" stroke-width="3"/><g class="spin" id="pumpI"><circle cx="178" cy="1140" r="20" fill="#cfd9e8" stroke="#2a3a52" stroke-width="2"/><path d="M178 1124 v32 M162 1140 h32 M167 1129 l22 22 M189 1129 l-22 22" stroke="#4b5b75" stroke-width="3"/></g></g>`;
    s += `<text x="132" y="1204" font-size="13" font-weight="800" text-anchor="middle" fill="#111">PUMP P1</text>` + dot('ldPmp', 112, 1090);
    /* vessel */
    s += `<rect x="440" y="1135" width="70" height="78" rx="24" fill="url(#grn)" stroke="#1d5a26" stroke-width="3" filter="url(#shd)"/><rect id="vesF" x="448" y="1200" width="54" height="0" rx="10" fill="#7fd0ff" opacity=".85"/><path d="M510 1176 H538" stroke="#333" stroke-width="5"/>` + gauge('g4', 560, 1158, 22, 10);
    s += `<text x="475" y="1234" font-size="13" font-weight="800" text-anchor="middle" fill="#111">VESSEL V1</text>`;
    s += gauge('g3', 400, 1060, 22, 10) + `<path d="M400 1082 V1092" stroke="#333" stroke-width="5"/>`;
    /* valves */
    s += ball('w1', 240, 1100) + `<text id="w1s" x="226" y="1134" font-size="11" font-weight="800" fill="#111">OPEN</text><text x="226" y="1150" font-size="12" font-weight="800" fill="#111">SUPPLY VALVE</text>`;
    s += ball('w2', 600, 1250) + `<text id="w2s" x="600" y="1288" font-size="11" font-weight="800" text-anchor="middle" fill="#111">OPEN</text><text x="660" y="1274" font-size="12" font-weight="800" fill="#111">OUTLET VALVE</text>`;
    /* big red gate valve with handwheel */
    s += `<rect x="776" y="1140" width="32" height="24" rx="3" fill="#b8c0cf" stroke="#333" stroke-width="2"/><rect x="786" y="1118" width="12" height="24" fill="#8f98ab" stroke="#333" stroke-width="2"/><g id="w3w"><circle cx="792" cy="1100" r="26" fill="#d9342b" stroke="#601510" stroke-width="3"/><circle cx="792" cy="1100" r="17" fill="#f2c200" stroke="#601510" stroke-width="2"/><path d="M792 1076 v48 M768 1100 h48 M775 1083 l34 34 M809 1083 l-34 34" stroke="#601510" stroke-width="3"/></g><text id="w3s" x="826" y="1192" font-size="11" font-weight="800" text-anchor="end" fill="#111">CLOSED</text><text x="826" y="1208" font-size="12" font-weight="800" text-anchor="end" fill="#111">DRAIN VALVE</text><g id="w3f" opacity="0"><circle cx="824" cy="1158" r="4" fill="#7fd0ff"/><circle cx="826" cy="1172" r="3" fill="#7fd0ff"/></g>`;

    /* ===== KIT RAIL ===== */
    s += `<rect x="66" y="1320" width="768" height="126" rx="8" fill="none" stroke="#111" stroke-width="3"/>${tab(66, 1320, 140, 'LOTO KIT')}<rect x="84" y="1368" width="732" height="10" rx="5" fill="#7d8697" stroke="#333" stroke-width="2"/>`;
    const KIT = A.KIT = ['pl_red', 'pl_blue', 'pl_yel', 'pl_master', 'hasp', 'mccb_clip', 'mcb3_clip', 'ball_lock', 'gate_lock', 'plug_lock', 'tag', 'tester', 'key'];
    KIT.forEach((k, i) => {
      const x = 92 + i * 56;
      s += `<g class="kit" data-tool="${k}"><rect x="${x - 4}" y="1372" width="56" height="70" rx="6" fill="transparent"/><path d="M${x + 24} 1372 v10" stroke="#555" stroke-width="3"/>${k === 'key' ? A.keyIcon(x, 1382, 48) : ic(L.dev(k).icon, x, 1382, 48)}</g>`;
    });

    /* ===== WALL: supply box, plugs, PPE ===== */
    s += `<rect x="930" y="96" width="140" height="84" rx="8" fill="#e9ecf1" stroke="#555" stroke-width="3" filter="url(#shd)"/><text x="1000" y="128" font-size="15" font-weight="800" text-anchor="middle" fill="#222">SUPPLY</text><text x="1000" y="150" font-size="12" text-anchor="middle" fill="#555">wall outlet box</text><path d="M946 160 h108" stroke="#c62828" stroke-width="4"/><circle cx="950" cy="180" r="4" fill="#444"/><circle cx="1050" cy="180" r="4" fill="#444"/>`;
    s += `<path d="M960 270 q0 -14 0 -22" stroke="#444" stroke-width="3"/><path d="M1040 270 q0 -14 0 -22" stroke="#444" stroke-width="3"/><path d="M946 262 h28 M1026 262 h28" stroke="#555" stroke-width="5" stroke-linecap="round"/>`;
    s += `<path id="cabB" d="M960 184 V300" fill="none" stroke="#111" stroke-width="12" stroke-linecap="round"/><path id="cabBi" d="M960 184 V300" fill="none" stroke="#2a6fe0" stroke-width="7" stroke-linecap="round"/>`;
    s += `<path id="cabR" d="M1040 184 V300" fill="none" stroke="#111" stroke-width="12" stroke-linecap="round"/><path id="cabRi" d="M1040 184 V300" fill="none" stroke="#e03a2e" stroke-width="7" stroke-linecap="round"/>`;
    s += plug('plugB', '#2a6fe0', '#143e86', [[-12, 7], [12, 7], [0, -10]]) + plug('plugR', '#e03a2e', '#7d1a12', [[-14, 10], [14, 10], [-8, -10], [8, -10]]);
    s += `<g id="plugLabs" font-size="12" font-weight="800" text-anchor="middle" fill="#222"><text x="960" y="392">1-PH 230 V</text><text x="1040" y="392">3-PH 400 V</text></g>`;
    /* PPE poster */
    s += `<g filter="url(#shd)"><rect x="910" y="560" width="170" height="210" rx="10" fill="#1d5fc6" stroke="#fff" stroke-width="4"/></g><text x="995" y="592" font-size="18" font-weight="900" text-anchor="middle" fill="#fff">WEAR PPE</text>`;
    s += `<g fill="#fff" stroke="none"><path d="M940 650 a22 22 0 0 1 44 0 v6 h-44z"/><rect x="934" y="654" width="56" height="7" rx="3"/>` +
      `<g fill="none" stroke="#fff" stroke-width="4"><circle cx="1020" cy="640" r="11"/><circle cx="1048" cy="640" r="11"/><path d="M1031 640 h6"/></g>` +
      `<path d="M944 700 h12 v10 h6 v-10 h6 v12 h6 v-12 h8 v26 a10 10 0 0 1 -10 10 h-18 a10 10 0 0 1 -10 -10z"/>` +
      `<path d="M1020 704 h18 v24 h22 a8 8 0 0 1 0 16 h-40 z"/></g>`;
    s += `<g font-size="11" fill="#fff" text-anchor="middle" font-weight="700"><text x="962" y="680">Helmet</text><text x="1034" y="672">Glasses</text><text x="962" y="758">Gloves</text><text x="1038" y="758">Boots</text></g>`;
    s += `<g filter="url(#shd)"><rect x="910" y="800" width="170" height="108" rx="8" fill="#fff" stroke="#c62828" stroke-width="4"/><rect x="910" y="800" width="170" height="30" rx="6" fill="#c62828"/></g><text x="995" y="822" font-size="16" font-weight="900" text-anchor="middle" fill="#fff">LOTO</text><g font-size="13" font-weight="800" fill="#222"><text x="924" y="852">1 Stop</text><text x="924" y="870">2 Isolate</text><text x="924" y="888">3 Lock + tag</text><text x="1008" y="852">4 Release</text><text x="1008" y="870">5 Test</text><text x="1008" y="888">6 Try</text></g>`;

    /* ===== overlays: test points, lock layers, selection ring ===== */
    s += `<g id="tpn" font-size="14" font-weight="800" fill="#111" pointer-events="none"></g>`;
    s += Object.keys(A.LK).map((k) => `<g id="lk_${k}" pointer-events="none"></g>`).join('');
    s += `<circle id="sel" cx="-50" cy="-50" r="30" fill="none" stroke="#00d4ff" stroke-width="5" stroke-dasharray="10 6" pointer-events="none"/>`;
    /* hit areas (kept last so they sit under nothing but the lock layers do not block them) */
    const hit = (k, o) => `<g class="hit" data-pt="${k}"><circle cx="${P[k].x}" cy="${P[k].y}" r="${P[k].r}" fill="transparent"/></g>`;
    s += ['plugB', 'plugR', 'q1', 'pb1', 'pb2', 'mccbA', 'mccbB', 'pb3', 'pb4', 'pb5', 'pb6', 'bvA', 'dump', 'w1', 'w2', 'w3', 'motor', 'comp', 'recv', 'frl', 'cyl', 'pump', 'vess', 'g1', 'g2', 'g3', 'g4'].map(hit).join('');
    s += `<g class="hit" data-pt="mcbC"><rect x="640" y="456" width="120" height="136" fill="transparent"/></g>`;
    s += `<g class="hit" data-pt="mccbA"><rect x="372" y="456" width="100" height="136" fill="transparent"/></g><g class="hit" data-pt="mccbB"><rect x="502" y="456" width="100" height="136" fill="transparent"/></g>`;
    s += `<g class="hit" data-pt="plugB"><circle cx="420" cy="262" r="42" fill="transparent"/></g><g class="hit" data-pt="plugR"><circle cx="560" cy="262" r="42" fill="transparent"/></g>`;
    s += `<g id="tps" style="display:none">${['tp1', 'tp2', 'tp3', 'tp4', 'tp5'].map((k) => `<g class="tp" data-pt="${k}"><circle cx="${P[k].x}" cy="${P[k].y}" r="15" fill="#ffe14a" stroke="#111" stroke-width="2.5"/><path d="M${P[k].x - 5} ${P[k].y - 6} l5 12 l5 -12" fill="none" stroke="#111" stroke-width="2.5"/><circle cx="${P[k].x}" cy="${P[k].y}" r="${P[k].r + 4}" fill="transparent"/></g>`).join('')}</g>`;
    return s;
  };
  A.keyIcon = (x, y, sz) => `<g transform="translate(${x} ${y}) scale(${sz / 64})"><circle cx="20" cy="22" r="13" fill="#d8b74a" stroke="#222" stroke-width="2.5"/><circle cx="20" cy="22" r="5" fill="#555"/><path d="M30 30 L56 56" stroke="#d8b74a" stroke-width="8" stroke-linecap="round"/><path d="M30 30 L56 56" stroke="#222" stroke-width="2" opacity=".5"/><path d="M46 46 l7 -6 M52 52 l7 -6" stroke="#d8b74a" stroke-width="6" stroke-linecap="round"/></g>`;
})(typeof window !== 'undefined' ? window : globalThis);
