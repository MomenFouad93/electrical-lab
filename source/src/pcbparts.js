/* Board (PCB) parts for the repair trainer */
(function (g) {
  const EL = g.EL, D = EL.defs, { P, INT, Z, VS, IS } = EL, pin = EL.mkpin, T = EL.T;
  const RC = EL.R_CLOSED;
  const pad = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#d9a441" stroke="#7a5b1a" stroke-width="1.5"/>`;
  const smd = (x, w, label, fill) => `<rect x="${x}" y="3" width="${w}" height="20" rx="2" fill="${fill || '#1d1d1f'}" stroke="#555"/><text x="${x + w / 2}" y="17" text-anchor="middle" font-size="9" font-weight="700" fill="#ddd" font-family="monospace">${label}</text>`;
  const base = { cat: 'board', board: true };

  D.PCB_PAD = Object.assign({}, base, { prefix: 'TP', name: ['Test pad / via', 'نقطة قياس / فيا'], w: 24, h: 24, pins: [pin('p', 'p', 12, 12, 'u')], props: [],
    info: ['A bare copper pad. Place it on a trace to give the probes a place to touch. Wire it with traces like any other pin.', 'وسادة نحاس عارية. حطها على مسار عشان تدي البروبات مكان تلمسه. وصّلها بمسارات زي أي طرف.'], draw: () => '<circle cx="12" cy="12" r="8" fill="#d9a441" stroke="#7a5b1a" stroke-width="1.5"/>' });
  D.PCB_PWR = Object.assign({}, base, { prefix: 'J', name: ['Power input (5 / 12 / 24 V)', 'دخل الكهرباء (5 / 12 / 24 فولت)'], w: 70, h: 64,
    pins: [pin('pos', '+', 35, 12, 'u', { role: 'pos' }), pin('neg', '−', 35, 52, 'd', { role: 'neg' })],
    props: [{ k: 'volt', label: ['Voltage (V)', 'الجهد (فولت)'], t: 'sel', opts: [[5, '5 V'], [12, '12 V'], [24, '24 V']], def: 5 }],
    info: ['Power connector of the board. The top pin is + and the bottom pin is the 0 V (ground). The top-bar Supply switch turns it on and off.', 'كونكتور كهرباء الكارت. الطرف اللي فوق + والطرف اللي تحت 0 فولت (الجراوند). مفتاح الكهرباء فوق بيشغله ويقفله.'],
    elements(p, ctx) { const n = INT(p, 'e'), v = ctx.mains === false || ctx.dead ? 0 : +p.props.volt; return [VS(P(p, 'neg'), n, { vdc: v, tag: 'e' }), Z(n, P(p, 'pos'), 0.05, 0, { tag: 'z' })]; },
    draw(p) { return `<rect x="8" y="2" width="54" height="60" rx="5" fill="#2f7d3f" stroke="#17401f" stroke-width="2"/>${pad(35, 12)}${pad(35, 52)}<text x="35" y="34" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${p.props.volt} V</text><text x="52" y="16" font-size="11" fill="#fff">+</text><text x="52" y="56" font-size="11" fill="#fff">−</text>`; } });
  D.PCB_R = Object.assign({}, base, { prefix: 'R', name: ['Resistor (SMD)', 'مقاومة (SMD)'], w: 78, h: 26, pins: [pin('A', 'A', 7, 13, 'l'), pin('B', 'B', 71, 13, 'r')],
    props: [{ k: 'r', label: ['Resistance (Ω)', 'المقاومة (أوم)'], t: 'num', min: 0.1, max: 10000000, step: 1, def: 330 }], faults: D.RES.faults, info: D.RES.info, elements: D.RES.elements,
    draw(p) { return smd(18, 42, EL.fmtR(+p.props.r)) + pad(7, 13) + pad(71, 13); } });
  const ledDraw = (p, isLed) => { const c = ({ red: '#F55B41', green: '#91C361', amber: '#FDC300', blue: '#47BFD9', white: '#f2f2f2', diode: '#9aa5bd' })[p.props.kind], b = p.state.b || 0; return (isLed && b > 0.03 ? `<circle cx="39" cy="13" r="26" fill="${c}" opacity="${(b * 0.45).toFixed(2)}"/>` : '') + `<rect x="18" y="3" width="42" height="20" rx="3" fill="${isLed ? c : '#222'}" opacity="${isLed ? 0.35 + 0.65 * b : 1}" stroke="#ddd"/><path d="M30 6 L30 20 L46 13 Z" fill="none" stroke="#fff" stroke-width="1.5"/><line x1="46" y1="6" x2="46" y2="20" stroke="#fff" stroke-width="2"/>` + pad(7, 13) + pad(71, 13) + (p.state.burnt ? '<g class="smoke"><circle cx="39" cy="4" r="5" fill="#222" opacity=".8"/></g>' : ''); };
  D.PCB_LED = Object.assign({}, base, { prefix: 'D', name: ['LED (SMD)', 'LED (SMD)'], w: 78, h: 26, pins: [pin('A', 'A', 7, 13, 'l'), pin('K', 'K', 71, 13, 'r')], props: [Object.assign({}, D.DIO.props[0], { def: 'green' })],
    faults: D.DIO.faults, info: D.DIO.info, electronic: true, init: D.DIO.init, elements: D.DIO.elements, update: D.DIO.update, draw: (p) => ledDraw(p, true) });
  D.PCB_D = Object.assign({}, base, { prefix: 'D', name: ['Diode (SMD)', 'دايود (SMD)'], w: 78, h: 26, pins: [pin('A', 'A', 7, 13, 'l'), pin('K', 'K', 71, 13, 'r')], props: [Object.assign({}, D.DIO.props[0], { def: 'diode' })],
    faults: D.DIO.faults, info: D.DIO.info, electronic: true, init: D.DIO.init, elements: D.DIO.elements, update: D.DIO.update, draw: (p) => ledDraw(p, p.props.kind !== 'diode') });
  D.PCB_FUSE = Object.assign({}, base, { prefix: 'F', name: ['Fuse (SMD)', 'فيوز (SMD)'], w: 78, h: 26, pins: [pin('A', 'A', 7, 13, 'l'), pin('B', 'B', 71, 13, 'r')],
    props: [{ k: 'rating', label: ['Rating (A)', 'التيار (أمبير)'], t: 'sel', opts: [[0.5, '0.5 A'], [1, '1 A'], [2, '2 A']], def: 1 }],
    faults: [['none', ['None', 'سليم']], ['open', ['Blown', 'محروق']]], info: ['Fast fuse. Blows above about 1.6 times its rating. Replace with the same value only.', 'فيوز سريع. بيقطع فوق 1.6 ضعف تياره. غيّره بنفس القيمة بس.'],
    init(p) { p.state = { heat: 0, blown: false }; },
    elements(p) { if (p.state.blown || p.fault === 'open') return []; return [Z(P(p, 'A'), P(p, 'B'), 0.1, 0, { tag: 'f' })]; },
    update(p, sim, dt) { if (p.state.blown || p.fault === 'open') return; const r = EL.eRead(sim, p.id, 'f'), i = Math.max(r.idc, Math.abs(r.idc), r.iac), rt = +p.props.rating; if (i > 1.6 * rt) { p.state.heat += dt * Math.min(20, i / rt); if (p.state.heat > 0.4) { p.state.blown = true; EL.emit('trip', p, 'fuse blown'); } } else p.state.heat = Math.max(0, p.state.heat - dt); },
    draw(p) { const bl = p.state.blown || p.fault === 'open'; return `<rect x="16" y="3" width="46" height="20" rx="4" fill="#e9e2c8" stroke="#555"/>` + (bl ? '<path d="M24 13 l6 -4 l4 8 l6 -8 l6 6" fill="none" stroke="#999" stroke-width="1.5" stroke-dasharray="2 2"/>' : '<path d="M20 13 h38" stroke="#c9a227" stroke-width="2"/>') + `<text x="39" y="35" text-anchor="middle" font-size="8" fill="#ddd">${p.props.rating}A</text>` + pad(7, 13) + pad(71, 13); } });
  D.PCB_SW = Object.assign({}, base, { prefix: 'SW', name: ['Tact switch', 'زرار صغير (tact)'], w: 78, h: 26, pins: [pin('A', 'A', 7, 13, 'l'), pin('B', 'B', 71, 13, 'r')], props: [],
    info: ['Momentary pushbutton. Closes while pressed (Test mode).', 'زرار لحظي. بيقفل وهو مضغوط (وضع الاختبار).'], init(p) { p.state = { act: false }; },
    press(p, ev) { if (ev.type === 'down') p.state.act = true; else if (ev.type === 'up') p.state.act = false; },
    elements(p) { return p.state.act ? [Z(P(p, 'A'), P(p, 'B'), RC, 0, { tag: 's' })] : []; },
    draw(p) { return `<rect x="22" y="2" width="34" height="22" rx="3" fill="#333" stroke="#777"/><circle cx="39" cy="13" r="7" fill="${p.state.act ? '#F55B41' : '#888'}" stroke="#111"/>` + pad(7, 13) + pad(71, 13); } });
  D.PCB_CAP = Object.assign({}, base, { prefix: 'C', name: ['Capacitor', 'كباسيتور'], w: 78, h: 26, pins: [pin('A', '+', 7, 13, 'l'), pin('B', '−', 71, 13, 'r')],
    props: [{ k: 'uf', label: ['Value (µF)', 'القيمة (ميكروفاراد)'], t: 'sel', opts: [[10, '10 µF'], [100, '100 µF'], [470, '470 µF']], def: 100 }],
    faults: [['none', ['None', 'سليم']], ['short', ['Shorted', 'متقصر']], ['leaky', ['Leaky (220 Ω)', 'بيسرّب (220 أوم)']]],
    info: ['Electrolytic capacitor. Blocks DC when healthy (reads open on ohms). A shorted capacitor across the supply is a classic cause of a blown fuse.', 'كباسيتور إلكتروليتي. بيمنع الـDC وهو سليم (بيقرا مفتوح في الأوم). الكباسيتور المتقصر على المصدر سبب كلاسيكي لحرق الفيوز.'],
    elements(p) { const r = p.fault === 'short' ? 1.5 : p.fault === 'leaky' ? 220 : 5e8; return [Z(P(p, 'A'), P(p, 'B'), r, 0, { tag: 'c' })]; },
    draw(p) { return `<rect x="20" y="1" width="38" height="24" rx="6" fill="#26364f" stroke="#889"/><rect x="20" y="1" width="9" height="24" fill="#aab"/><text x="43" y="16" text-anchor="middle" font-size="9" fill="#ddd">${p.props.uf}µ</text>` + pad(7, 13) + pad(71, 13); } });
  D.PCB_REG = Object.assign({}, base, { prefix: 'U', name: ['Voltage regulator (78xx)', 'منظم جهد (78xx)'], w: 78, h: 48, electronic: true,
    pins: [pin('IN', 'IN', 7, 14, 'l'), pin('GND', 'GND', 39, 40, 'd'), pin('OUT', 'OUT', 71, 14, 'r')],
    props: [{ k: 'out', label: ['Output (V)', 'الخرج (فولت)'], t: 'sel', opts: [[5, '5 V'], [3.3, '3.3 V'], [12, '12 V']], def: 5 }],
    faults: [['none', ['None', 'سليم']], ['dead', ['Dead (no output)', 'ميت (مفيش خرج)']]],
    info: ['Linear regulator. Needs at least 2 V more at IN than the output. Gives a steady OUT between OUT and GND. The test voltage of an insulation tester destroys it.', 'منظم جهد. محتاج على IN أعلى من الخرج بـ 2 فولت على الأقل. بيدي خرج ثابت بين OUT وGND. جهد الميجر بيحرقه.'],
    init(p) { p.state = { ok: false, iq: 0.005 }; },
    elements(p, ctx) {
      if (ctx.dead) return [Z(P(p, 'IN'), P(p, 'GND'), 5e5, 0, { tag: 'in' }), Z(P(p, 'OUT'), P(p, 'GND'), 5e5, 0, { tag: 'o2' })];
      const out = [IS(P(p, 'IN'), P(p, 'GND'), p.state.ok ? Math.min(2, p.state.iq) : 0, { tag: 'in', vmin: 0.5 })];
      if (p.state.ok && p.fault !== 'dead') { const n = INT(p, 'o'); out.push(VS(P(p, 'GND'), n, { vdc: +p.props.out, tag: 'o' }), Z(n, P(p, 'OUT'), 0.5, 0, { tag: 'oz' })); }
      return out;
    },
    update(p, sim) {
      const vin = sim.vdcAt(P(p, 'IN')) - sim.vdcAt(P(p, 'GND'));
      p.state.ok = vin >= +p.props.out + 1.8 && vin < 36 && p.fault !== 'dead';
      const o = EL.eRead(sim, p.id, 'oz'); p.state.iq = 0.005 + Math.abs(o.idc);
    },
    draw(p) { return `<rect x="16" y="2" width="46" height="26" rx="3" fill="#222" stroke="#666"/><rect x="16" y="2" width="46" height="8" fill="#555"/><text x="39" y="22" text-anchor="middle" font-size="10" font-weight="700" fill="#ddd">${p.props.out === 3.3 ? '3V3' : '78' + (p.props.out === 5 ? '05' : '12')}</text>` + pad(7, 14) + pad(39, 40) + pad(71, 14) + `<circle cx="56" cy="8" r="2.5" fill="${p.state.ok ? '#5dff7c' : '#333'}"/>`; } });
})(typeof window !== 'undefined' ? window : globalThis);
