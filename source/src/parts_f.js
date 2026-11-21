/* Parts F: electronics and board-level parts (work on the bench and in the PCB tab) */
(function (g) {
  const EL = g.EL;
  const { P, INT, Z, VS } = EL;
  const D = EL.defs;
  const T = EL.T, pin = EL.mkpin;
  const F0 = ['none', ['None', 'سليم']];
  const wl = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="wl"/>`;
  const smoke = (x, y) => `<g class="smoke"><circle cx="${x}" cy="${y}" r="5" fill="#222" opacity=".8"/><circle cx="${x + 6}" cy="${y - 6}" r="4" fill="#444" opacity=".7"/></g>`;
  const OMEGA = 2 * Math.PI * 50;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const eng = (v, u) => { const a = Math.abs(v); if (a >= 1e6) return +(v / 1e6).toFixed(2) + 'M' + u; if (a >= 1e3) return +(v / 1e3).toFixed(2) + 'k' + u; if (a >= 1) return +v.toFixed(2) + u; if (a >= 1e-3) return +(v * 1e3).toFixed(2) + 'm' + u; return +(v * 1e6).toFixed(2) + 'u' + u; };
  const mk = (o) => Object.assign({ cat: 'elec', pcb: true, faults: [F0], props: [], diag: { kind: 'passive' } }, o);
  /* geometric relaxation of a controlled resistance toward a target (one step per tick) */
  function relax(st, key, target) {
    const cur = st[key] || 1e9, t = clamp(target, 0.05, 1e9);
    st[key] = Math.exp(Math.log(cur) + 0.8 * (Math.log(t) - Math.log(cur)));
  }

  /* ================= passives ================= */
  D.CAPP = mk({
    prefix: 'C', name: ['Capacitor', 'كباسيتور'], w: 50, h: 80,
    info: ['Blocks DC at steady state and passes AC (reactance = 1 / (2 pi f C)). Charging transients are not simulated. Electrolytic types have a + pin: reverse polarity or too much voltage makes them vent. Faults: short, leaky, open.', 'بيقفل الـDC في الحالة المستقرة وبيمرر الـAC (المعاوقة = 1 / (2 pi f C)). الشحن اللحظي مش بيتحاكى. النوع الإلكتروليتي له طرف + : عكس القطبية أو جهد زيادة بيخليه ينفخ. الأعطال: ماس، تسريب، مفتوح.'],
    pins: [pin('A', '+', 25, 0, 'u'), pin('B', '-', 25, 80, 'd')],
    props: [{ k: 'uf', label: ['Capacitance (uF)', 'السعة (ميكروفاراد)'], t: 'num', min: 0.0001, max: 100000, step: 0.1, def: 100 }, { k: 'vr', label: ['Voltage rating (V)', 'جهد التشغيل (فولت)'], t: 'num', min: 3, max: 1000, step: 1, def: 25 }, { k: 'pol', label: ['Type', 'النوع'], t: 'sel', opts: [['elec', 'Electrolytic (+/-)'], ['film', 'Film / ceramic']], def: 'elec' }],
    faults: [F0, ['short', ['Shorted', 'ماس']], ['leak', ['Leaky (3 kohm)', 'بيسرّب (3 كيلو)']], ['open', ['Open', 'مفتوح']]],
    diag: { kind: 'passive', fail: 'short' },
    elements(p) {
      const C = +p.props.uf * 1e-6, st = p.state;
      if (st.burnt || p.fault === 'short') return [Z(P(p, 'A'), P(p, 'B'), 0.05, 0, { tag: 's' })];
      const out = [];
      if (p.fault !== 'open') out.push(Z(P(p, 'A'), P(p, 'B'), 0.05 + 0.5 / Math.sqrt(Math.max(1, +p.props.uf)), -1 / (OMEGA * OMEGA * C), { tag: 'c', noDC: true }));
      if (p.fault === 'leak') out.push(Z(P(p, 'A'), P(p, 'B'), 3000, 0, { tag: 'lk', noAC: true }));
      return out;
    },
    update(p, sim, dt) {
      const st = p.state, e = EL.eRead(sim, p.id, p.fault === 'leak' ? 'lk' : 'c'), v = p.fault === 'leak' ? e.vdc : EL.eRead(sim, p.id, 'c').vdc;
      st.v = v;
      const bad = (p.props.pol === 'elec' && v < -1.5) || Math.abs(v) > 1.25 * +p.props.vr || EL.eRead(sim, p.id, 'c').vac * 1.4 > 1.4 * +p.props.vr;
      if (bad && !st.burnt) { st.stress = (st.stress || 0) + dt; if (st.stress > 0.6) { st.burnt = true; EL.emit('burn', p, 'capacitor vented (reverse polarity or overvoltage)'); } } else if (!bad) st.stress = 0;
    },
    draw(p) {
      const el = p.props.pol === 'elec', b = p.state.burnt;
      return wl(25, 0, 25, 14) + wl(25, 66, 25, 80) + (el ? `<rect x="12" y="14" width="26" height="52" rx="5" fill="${b ? '#222' : '#1f3b8a'}" stroke="#0e1626"/><rect x="12" y="14" width="8" height="52" fill="#c9ccd6"/>` + T(32, 38, '+', 'pbtn') : `<rect x="12" y="22" width="26" height="36" rx="4" fill="${b ? '#222' : '#c58b2a'}" stroke="#0e1626"/>`) + T(25, el ? 56 : 44, eng(+p.props.uf * 1e-6, 'F'), 'psub') + (b ? smoke(20, 20) : '');
    },
  });
  D.IND = mk({
    prefix: 'L', name: ['Inductor / coil', 'ملف (inductor)'], w: 50, h: 80,
    info: ['Inductor with a DC resistance. Passes DC (only its winding resistance), opposes AC (reactance = 2 pi f L). Open winding is the common failure.', 'ملف له مقاومة DC. بيمرر الـDC (بمقاومة اللفات بس) ويعارض الـAC (المعاوقة = 2 pi f L). قطع اللفات هو العطل المعتاد.'],
    pins: [pin('A', 'A', 25, 0, 'u'), pin('B', 'B', 25, 80, 'd')],
    props: [{ k: 'mh', label: ['Inductance (mH)', 'الحث (ملي هنري)'], t: 'num', min: 0.001, max: 100000, step: 0.1, def: 10 }, { k: 'dcr', label: ['DC resistance (ohm)', 'مقاومة DC (أوم)'], t: 'num', min: 0.001, max: 10000, step: 0.1, def: 1 }],
    faults: [F0, ['open', ['Winding open', 'اللفات مقطوعة']], ['short', ['Shorted turns', 'لفات ماس']]],
    elements(p) { if (p.fault === 'open') return []; return [Z(P(p, 'A'), P(p, 'B'), p.fault === 'short' ? 0.05 : +p.props.dcr, p.fault === 'short' ? 0 : +p.props.mh / 1000, { tag: 'l' })]; },
    draw(p) { return wl(25, 0, 25, 16) + wl(25, 64, 25, 80) + `<path d="M25 16 c14 0 14 8 0 8 c14 0 14 8 0 8 c14 0 14 8 0 8 c14 0 14 8 0 8" fill="none" stroke="#c78b4b" stroke-width="3"/>` + T(25, 76, eng(+p.props.mh * 1e-3, 'H'), 'psub', 'middle'); },
  });
  D.NTC = mk({
    prefix: 'RT', name: ['NTC thermistor', 'ثيرمستور NTC'], w: 50, h: 80,
    info: ['Resistance falls as temperature rises. R25 is the value at 25 C, beta 3950. Measure it in ohm with the power off and compare with the temperature.', 'المقاومة بتنزل لما الحرارة تزيد. R25 هي القيمة عند 25 درجة وبيتا 3950. قيسها بالأوم والكهرباء فاصلة وقارنها بالحرارة.'],
    pins: [pin('A', 'A', 25, 0, 'u'), pin('B', 'B', 25, 80, 'd')],
    props: [{ k: 'r25', label: ['R at 25 C (ohm)', 'القيمة عند 25 (أوم)'], t: 'sel', opts: [[1000, '1 k'], [5000, '5 k'], [10000, '10 k'], [47000, '47 k'], [100000, '100 k']], def: 10000 }, { k: 'temp', label: ['Temperature (C)', 'الحرارة (درجة)'], t: 'num', min: -40, max: 200, step: 1, def: 25 }],
    faults: [F0, ['open', ['Open', 'مفتوح']], ['short', ['Shorted', 'ماس']]],
    elements(p) { if (p.fault === 'open') return []; const t = +p.props.temp + 273.15, r = p.fault === 'short' ? 1 : +p.props.r25 * Math.exp(3950 * (1 / t - 1 / 298.15)); return [Z(P(p, 'A'), P(p, 'B'), r, 0, { tag: 'r' })]; },
    draw(p) { return wl(25, 0, 25, 18) + wl(25, 62, 25, 80) + `<rect x="14" y="18" width="22" height="44" rx="4" fill="#2a2a2e" stroke="#7b879f"/><path d="M8 66 L42 14" stroke="#e8edf5" stroke-width="2"/>` + T(25, 46, 'NTC', 'psub') + T(25, 76, p.props.temp + ' C', 'psub'); },
  });
  D.LDR = mk({
    prefix: 'RL', name: ['LDR (light sensor)', 'LDR (حساس ضوء)'], w: 50, h: 80,
    info: ['Resistance falls as light increases: about 1 megohm in the dark, about 1 kohm in bright light.', 'المقاومة بتنزل لما الضوء يزيد: حوالي 1 ميجا في الضلمة وحوالي 1 كيلو في الضوء القوي.'],
    pins: [pin('A', 'A', 25, 0, 'u'), pin('B', 'B', 25, 80, 'd')],
    props: [{ k: 'lux', label: ['Light (lux)', 'الضوء (لوكس)'], t: 'num', min: 0.1, max: 100000, step: 1, def: 100 }],
    faults: [F0, ['open', ['Open', 'مفتوح']]],
    elements(p) { if (p.fault === 'open') return []; return [Z(P(p, 'A'), P(p, 'B'), clamp(100000 * Math.pow(10 / Math.max(0.1, +p.props.lux), 0.9) / 10, 100, 2e6), 0, { tag: 'r' })]; },
    draw(p) { return wl(25, 0, 25, 18) + wl(25, 62, 25, 80) + `<circle cx="25" cy="40" r="20" fill="#2a2a2e" stroke="#7b879f"/><path d="M14 34 q4 -6 8 0 t8 0 t8 0 M14 46 q4 -6 8 0 t8 0 t8 0" fill="none" stroke="#c78b4b" stroke-width="2"/><path d="M-2 14 l10 8 M0 28 l9 3" stroke="#FDC300" stroke-width="2"/>` + T(25, 76, p.props.lux + ' lx', 'psub'); },
  });

  /* ================= diodes ================= */
  D.ZENR = mk({
    prefix: 'DZ', name: ['Zener diode', 'زينر دايود'], w: 40, h: 80,
    info: ['Conducts forward like a diode (0.7 V) and in reverse above its zener voltage. Used as a simple voltage reference. Needs a series resistor: without one it burns.', 'بيوصل أمامي زي الدايود (0.7 فولت) وعكسي فوق جهد الزينر. بيستخدم كمرجع جهد بسيط. محتاج مقاومة على التوالي وإلا بيتحرق.'],
    pins: [pin('A', 'A', 20, 0, 'u'), pin('K', 'K', 20, 80, 'd')],
    props: [{ k: 'vz', label: ['Zener voltage (V)', 'جهد الزينر (فولت)'], t: 'sel', opts: [[3.3, '3.3'], [5.1, '5.1'], [6.2, '6.2'], [9.1, '9.1'], [12, '12'], [15, '15'], [24, '24']], def: 5.1 }, { k: 'w', label: ['Power (W)', 'القدرة (وات)'], t: 'sel', opts: [[0.5, '0.5 W'], [1, '1 W'], [5, '5 W']], def: 0.5 }],
    faults: [F0, ['open', ['Open', 'مفتوح']], ['short', ['Shorted', 'ماس']]],
    diag: { kind: 'diode', fail: 'short' },
    elements(p) {
      if (p.state.burnt || p.fault === 'short') return [Z(P(p, 'A'), P(p, 'K'), 0.1, 0, { tag: 's' })];
      if (p.fault === 'open') return [];
      return [{ kind: 'D', a: P(p, 'A'), b: P(p, 'K'), vf: 0.7, rd: 2, tag: 'f' }, { kind: 'D', a: P(p, 'K'), b: P(p, 'A'), vf: +p.props.vz, rd: 4, tag: 'z' }];
    },
    update(p, sim, dt) {
      const st = p.state, f = EL.eRead(sim, p.id, 'f'), z = EL.eRead(sim, p.id, 'z');
      const iz = Math.abs(z.idc), pw = iz * +p.props.vz + Math.abs(f.idc) * 0.7;
      st.iz = iz; st.pw = pw; st.v = f.vdc;
      if (pw > +p.props.w * 1.1) { st.heat = (st.heat || 0) + dt * (pw / +p.props.w - 1) / 2; if (st.heat >= 1 && !st.burnt) { st.burnt = true; EL.emit('burn', p, 'zener overheated'); } } else st.heat = Math.max(0, (st.heat || 0) - dt / 20);
    },
    draw(p) { return wl(20, 0, 20, 24) + wl(20, 56, 20, 80) + `<path d="M8 24 H32 L20 56 Z" fill="#e8edf5" opacity=".15" stroke="#e8edf5" stroke-width="2"/><path d="M8 56 H32 M8 56 l-4 -5 M32 56 l4 5" stroke="#e8edf5" stroke-width="2.5" fill="none"/>` + T(34, 44, p.props.vz + 'V', 'psub', 'start') + (p.state.burnt ? smoke(22, 30) : ''); },
  });
  const LEDC = { red: [1.9, '#ff4a3a'], yellow: [2.0, '#ffd83a'], green: [2.1, '#5fe05f'], blue: [3.0, '#4aa8ff'], white: [3.1, '#f4f4ff'], ir: [1.2, '#7a1a1a'] };
  D.LEDX = mk({
    prefix: 'D', name: ['LED (colour)', 'LED (ألوان)'], w: 40, h: 80,
    info: ['Light emitting diode. Anode A is the longer leg. Always use a series resistor: R = (supply - forward voltage) / current. About 10 to 20 mA gives full light. Above 50 mA it burns out. Reverse polarity: no light, no damage (up to 5 V).', 'دايود مضيء. الأنود A هو الرجل الأطول. استخدم مقاومة على التوالي دايما: R = (الجهد - جهد الـLED) / التيار. من 10 لـ20 ملي بيدي إضاءة كاملة. فوق 50 ملي بيتحرق. عكس القطبية: مفيش إضاءة ومفيش ضرر (لحد 5 فولت).'],
    pins: [pin('A', 'A', 20, 0, 'u'), pin('K', 'K', 20, 80, 'd')],
    props: [{ k: 'col', label: ['Colour', 'اللون'], t: 'sel', opts: [['red', 'Red 1.9 V'], ['yellow', 'Yellow 2.0 V'], ['green', 'Green 2.1 V'], ['blue', 'Blue 3.0 V'], ['white', 'White 3.1 V'], ['ir', 'Infrared 1.2 V']], def: 'red' }],
    faults: [F0, ['open', ['Open', 'مفتوح']], ['short', ['Shorted', 'ماس']]],
    diag: { kind: 'led', fail: 'open' },
    init(p) { p.state = { b: 0 }; },
    elements(p) {
      if (p.state.burnt || p.fault === 'open') return [];
      if (p.fault === 'short') return [Z(P(p, 'A'), P(p, 'K'), 0.2, 0, { tag: 's' })];
      return [{ kind: 'D', a: P(p, 'A'), b: P(p, 'K'), vf: LEDC[p.props.col][0], rd: 4, tag: 'd' }];
    },
    update(p, sim, dt) {
      const st = p.state, e = EL.eRead(sim, p.id, p.fault === 'short' ? 's' : 'd'), i = Math.abs(e.idc);
      st.amps = i; st.b = p.props.col === 'ir' ? 0 : clamp(i / 0.012, 0, 1.2); st.v = e.vdc;
      if (i > 0.05 && !st.burnt && p.fault === 'none') { st.stress = (st.stress || 0) + dt; if (st.stress > 0.2) { st.burnt = true; EL.emit('burn', p, 'LED burned (no current limiting resistor)'); } } else st.stress = 0;
    },
    draw(p) {
      const c = LEDC[p.props.col][1], b = p.state.b, dead = p.state.burnt;
      return wl(20, 0, 20, 22) + wl(20, 58, 20, 80) + (b > 0.05 ? `<circle cx="20" cy="40" r="${20 + 8 * b}" fill="${c}" opacity="${(0.15 + 0.4 * Math.min(1, b)).toFixed(2)}"/>` : '') + `<path d="M8 22 H32 L20 56 Z" fill="${dead ? '#333' : c}" opacity="${dead ? 1 : (0.35 + 0.65 * Math.min(1, b)).toFixed(2)}" stroke="#e8edf5" stroke-width="2"/><path d="M8 58 H32" stroke="#e8edf5" stroke-width="2.5"/><path d="M34 26 l8 -6 M36 36 l8 -6" stroke="#e8edf5" stroke-width="1.5"/>` + (dead ? smoke(24, 20) : '');
    },
  });

  /* bridge rectifier with optional smoothing: DC side is a source derived from the AC side each tick */
  D.BRIDGE = mk({
    prefix: 'BR', name: ['Bridge rectifier', 'كوبري دايودات (Bridge)'], w: 90, h: 90,
    info: ['AC1/AC2 take AC, + and - give DC. Output about 0.9 x Vrms - 1.4 V without a capacitor, or about 1.414 x Vrms - 1.4 V with a smoothing capacitor. A shorted diode shorts the AC side; an open diode halves the output.', 'AC1/AC2 دخل AC و+ و- خرج DC. الخرج حوالي 0.9 x الفولت الفعال - 1.4 من غير كباسيتور أو 1.414 x الفعال - 1.4 مع كباسيتور فلتر. دايود ماس بيعمل ماس على جانب الـAC ودايود مفتوح بيخلي الخرج النص.'],
    pins: [pin('AC1', '~', 25, 0, 'u'), pin('AC2', '~', 65, 0, 'u'), pin('POS', '+', 25, 90, 'd'), pin('NEG', '-', 65, 90, 'd')],
    props: [{ k: 'cap', label: ['Smoothing capacitor', 'كباسيتور فلتر'], t: 'sel', opts: [[0, 'None'], [470, '470 uF'], [2200, '2200 uF'], [4700, '4700 uF']], def: 2200 }],
    faults: [F0, ['open_d', ['One diode open', 'دايود مفتوح']], ['short_d', ['One diode shorted', 'دايود ماس']]],
    diag: { kind: 'rectifier' },
    init(p) { p.state = { vout: 0, rin: 1e8, vac: 0 }; },
    elements(p) {
      const st = p.state, out = [Z(P(p, 'AC1'), P(p, 'AC2'), 1e7, 0, { tag: 'ac', noDC: true })];
      if (p.fault === 'short_d') { out.push(Z(P(p, 'AC1'), P(p, 'AC2'), 0.4, 0, { tag: 'sh', noDC: true })); return out; }
      if (st.burnt) return out;
      out.push(Z(P(p, 'AC1'), P(p, 'AC2'), clamp(st.rin, 0.5, 1e8), 0, { tag: 'in', noDC: true }));
      if (st.vout > 0.1) out.push(VS(P(p, 'NEG'), INT(p, 'o'), { vdc: st.vout, tag: 'o' }), Z(INT(p, 'o'), P(p, 'POS'), 0.8 + (p.fault === 'open_d' ? 1.5 : 0), 0, { tag: 'oz' }));
      else out.push(Z(P(p, 'POS'), P(p, 'NEG'), 1e8, 0, { tag: 'oz', noAC: true }));
      return out;
    },
    update(p, sim, dt) {
      const st = p.state, vac = EL.eRead(sim, p.id, 'ac').vac, o = EL.eRead(sim, p.id, 'o');
      const idc = Math.abs(o.idc), f = 50, C = +p.props.cap * 1e-6;
      st.vac = vac; st.idc = idc;
      let vout = 0;
      if (vac > 3) {
        const half = p.fault === 'open_d' ? 0.5 : 1;
        vout = C > 0 ? Math.max(0, 1.414 * vac - 1.4 - idc / (2 * f * C) / 2) : Math.max(0, 0.9 * vac - 1.4);
        vout *= half;
      }
      st.vout += (vout - st.vout) * 0.5;
      st.rin = idc > 1e-4 && vac > 1 ? vac / Math.max(1e-4, 1.1 * idc * (st.vout / Math.max(1, vac))) : 1e8;
      if (vac > 450) { st.burnt = true; EL.emit('burn', p, 'bridge overvoltage'); }
    },
    draw(p) {
      const st = p.state;
      return wl(25, 0, 25, 14) + wl(65, 0, 65, 14) + wl(25, 76, 25, 90) + wl(65, 76, 65, 90) + `<rect x="10" y="14" width="70" height="62" rx="6" fill="#1a2238" stroke="#7b879f" stroke-width="2"/><path d="M45 22 L72 45 L45 68 L18 45 Z" fill="none" stroke="#e8edf5" stroke-width="2"/><path d="M33 33 l8 8 M57 33 l-8 8 M33 57 l8 -8 M57 57 l-8 -8" stroke="#47BFD9" stroke-width="2"/>` + T(25, 30, '~', 'pbtn') + T(65, 30, '~', 'pbtn') + T(25, 66, '+', 'pbtn') + T(65, 66, '-', 'pbtn') + (st.burnt ? smoke(30, 20) : '');
    },
  });

  /* ================= transistors ================= */
  const BJTM = { small: { name: 'BC547', hfe: 200, ic: 0.1, pw: 0.5, vce: 45, ib: 0.01, vbe: 0.65 }, med: { name: 'BD139', hfe: 100, ic: 1.5, pw: 12, vce: 80, ib: 0.1, vbe: 0.7 }, power: { name: 'TIP122', hfe: 1000, ic: 5, pw: 65, vce: 100, ib: 0.2, vbe: 1.4 } };
  function bjt(pol) {
    const npn = pol === 'N', top = npn ? 'C' : 'E', bot = npn ? 'E' : 'C';
    return mk({
      prefix: 'Q', name: npn ? ['NPN transistor', 'ترانزستور NPN'] : ['PNP transistor', 'ترانزستور PNP'], w: 70, h: 90,
      info: npn
        ? ['NPN: a small base current (B to E) lets a large current flow from C to E (gain hFE). Use a base resistor. Switch a load between +V and C, with E to 0 V. Burns if the base has no resistor or the load is too large for the type.', 'NPN: تيار صغير في القاعدة (B لـE) بيسمح بتيار كبير من C لـE (الكسب hFE). استخدم مقاومة على القاعدة. حط الحمل بين +V وC والـE على 0 فولت. بيتحرق لو القاعدة من غير مقاومة أو الحمل أكبر من طاقة النوع.']
        : ['PNP: pull the base below the emitter (B to E current out of the base) to switch on. Emitter to +V, load from C to 0 V. A high-side switch.', 'PNP: اسحب القاعدة تحت الإيميتر عشان يشتغل. الإيميتر على +V والحمل من C لـ0 فولت. سويتش على الجانب الموجب.'],
      pins: [pin('B', 'B', 0, 45, 'l'), pin(top, top, 55, 0, 'u'), pin(bot, bot, 55, 90, 'd')],
      props: [{ k: 'model', label: ['Type', 'النوع'], t: 'sel', opts: [['small', 'Small signal (100 mA)'], ['med', 'Medium (1.5 A)'], ['power', 'Power Darlington (5 A)']], def: 'small' }],
      faults: [F0, ['open_c', ['Collector open', 'الكولكتور مفتوح']], ['open_b', ['Base open', 'القاعدة مفتوحة']], ['short_ce', ['C-E shorted', 'C-E ماس']]],
      diag: { kind: 'bjt', pol },
      init(p) { p.state = { rce: 1e9, heat: 0, ib: 0, ic: 0 }; },
      elements(p) {
        const st = p.state, m = BJTM[p.props.model], out = [];
        if (st.burnt || p.fault === 'short_ce') return [Z(P(p, 'C'), P(p, 'E'), 0.4, 0, { tag: 'ce' })];
        if (p.fault !== 'open_b') out.push(npn ? { kind: 'D', a: P(p, 'B'), b: P(p, 'E'), vf: m.vbe, rd: 15, tag: 'be' } : { kind: 'D', a: P(p, 'E'), b: P(p, 'B'), vf: m.vbe, rd: 15, tag: 'be' });
        if (p.fault !== 'open_c') out.push(npn ? Z(P(p, 'C'), P(p, 'E'), st.rce, 0, { tag: 'ce' }) : Z(P(p, 'E'), P(p, 'C'), st.rce, 0, { tag: 'ce' }));
        return out;
      },
      update(p, sim, dt) {
        const st = p.state, m = BJTM[p.props.model], be = EL.eRead(sim, p.id, 'be'), ce = EL.eRead(sim, p.id, 'ce');
        const ib = Math.abs(be.idc), vce = Math.abs(ce.vdc), ic = Math.abs(ce.idc);
        st.ib = ib; st.ic = ic; st.vce = vce; st.vbe = Math.abs(be.vdc);
        if (st.burnt || p.fault === 'short_ce') return;
        const icd = Math.min(m.hfe * ib, m.ic * 3);
        const lo = 0.2 / Math.max(ic, 1e-3);
        relax(st, 'rce', ib < 2e-6 ? 1e9 : Math.max(lo, vce > 0.02 ? vce / icd : 0.05));
        const pw = vce * ic;
        if (pw > m.pw * 1.05 || ic > m.ic * 1.4 || ib > m.ib * 1.5 || vce > m.vce * 1.3) {
          const k = Math.max(pw / m.pw, ic / m.ic, ib / m.ib);
          st.heat += dt * (k > 3 ? 4 : 0.6) * (k - 0.9); if (st.heat >= 1) { st.burnt = true; EL.emit('burn', p, 'transistor destroyed (overload)'); }
        } else st.heat = Math.max(0, st.heat - dt / 15);
        st.on = ic > 0.003 && vce < 1;
      },
      draw(p) {
        const st = p.state, on = st.ic > 0.003;
        return wl(0, 45, 24, 45) + wl(55, 0, 55, 22) + wl(55, 68, 55, 90) + `<circle cx="38" cy="45" r="28" fill="${on ? 'rgba(145,195,97,.18)' : 'none'}" stroke="${st.burnt ? '#F55B41' : '#e8edf5'}" stroke-width="2"/><path d="M24 25 V65" stroke="#e8edf5" stroke-width="4"/><path d="M24 36 L55 22 M24 54 L55 68" stroke="#e8edf5" stroke-width="3" fill="none"/>` +
          (npn ? `<path d="M55 68 l-10 -2 l4 -8 z" fill="#e8edf5" transform="translate(-4,0)"/>` : `<path d="M30 52 l10 -1 l-3 8 z" fill="#e8edf5"/>`) + T(8, 38, 'B', 'psub') + T(66, 18, top, 'psub', 'start') + T(66, 86, bot, 'psub', 'start') + T(38, 8, BJTM[p.props.model].name, 'psub') + (st.burnt ? smoke(40, 30) : '');
      },
    });
  }
  D.NPN = bjt('N');
  D.PNP = bjt('P');

  const FETM = { logic: { name: 'IRLZ44N', vth: 1.8, vfull: 4.5, rds: 0.025, id: 40, pw: 100, vds: 55 }, std: { name: 'IRF540', vth: 3.5, vfull: 10, rds: 0.044, id: 25, pw: 100, vds: 100 }, small: { name: '2N7000', vth: 2.1, vfull: 5, rds: 3, id: 0.2, pw: 0.4, vds: 60 } };
  function fet(pol) {
    const n = pol === 'N', top = n ? 'D' : 'S', bot = n ? 'S' : 'D';
    return mk({
      prefix: 'Q', name: n ? ['N-MOSFET', 'موسفيت N'] : ['P-MOSFET', 'موسفيت P'], w: 70, h: 90,
      info: n
        ? ['Voltage controlled switch: when Vgs (gate to source) is above the threshold, D to S conducts with a low resistance. The gate draws no current. Do not exceed 20 V on the gate. Load between +V and D, S to 0 V.', 'سويتش بيتحكم فيه الجهد: لما Vgs (من الجيت للسورس) يعدي العتبة D لـS بيوصل بمقاومة صغيرة. الجيت مبيسحبش تيار. متعديش 20 فولت على الجيت. الحمل بين +V وD والـS على 0 فولت.']
        : ['P-channel high-side switch: source to +V, gate pulled below the source by more than the threshold turns it on. Load from D to 0 V.', 'موسفيت P سويتش على الجانب الموجب: السورس على +V والجيت لازم ينزل عن السورس بأكتر من العتبة. الحمل من D لـ0 فولت.'],
      pins: [pin('G', 'G', 0, 45, 'l'), pin(top, top, 55, 0, 'u'), pin(bot, bot, 55, 90, 'd')],
      props: [{ k: 'model', label: ['Type', 'النوع'], t: 'sel', opts: [['logic', 'Logic level (IRLZ44N)'], ['std', 'Standard (IRF540, needs 10 V)'], ['small', 'Small (2N7000, 200 mA)']], def: 'logic' }],
      faults: [F0, ['open_d', ['Drain open', 'الدرين مفتوح']], ['short_ds', ['D-S shorted', 'D-S ماس']], ['gate_dead', ['Gate oxide damaged (G-S short)', 'الجيت تالف (G-S ماس)']]],
      diag: { kind: 'mosfet', pol },
      init(p) { p.state = { rds: 1e9, heat: 0, vgs: 0 }; },
      elements(p) {
        const st = p.state, out = [];
        if (st.burnt || p.fault === 'short_ds') return [Z(P(p, 'D'), P(p, 'S'), 0.1, 0, { tag: 'ds' }), Z(P(p, 'G'), P(p, 'S'), p.fault === 'gate_dead' ? 100 : 1e8, 0, { tag: 'gs', noAC: true })];
        out.push(Z(P(p, 'G'), P(p, 'S'), p.fault === 'gate_dead' ? 100 : 1e8, 0, { tag: 'gs', noAC: true }));
        if (p.fault !== 'open_d') out.push(Z(P(p, 'D'), P(p, 'S'), st.rds, 0, { tag: 'ds' }), n ? { kind: 'D', a: P(p, 'S'), b: P(p, 'D'), vf: 0.7, rd: 0.05, tag: 'bd' } : { kind: 'D', a: P(p, 'D'), b: P(p, 'S'), vf: 0.7, rd: 0.05, tag: 'bd' });
        return out;
      },
      update(p, sim, dt) {
        const st = p.state, m = FETM[p.props.model];
        const vgs = n ? sim.vdc(P(p, 'G'), P(p, 'S')) : sim.vdc(P(p, 'S'), P(p, 'G'));
        const ds = EL.eRead(sim, p.id, 'ds'), id = Math.abs(ds.idc), vds = Math.abs(ds.vdc);
        st.vgs = vgs; st.id = id; st.vds = vds;
        if (st.burnt || p.fault === 'short_ds') return;
        if (Math.abs(vgs) > 22 && p.fault === 'none') { p.fault = 'gate_dead'; EL.emit('burn', p, 'gate oxide destroyed (Vgs above 20 V)'); }
        const f = clamp((vgs - m.vth) / (m.vfull - m.vth), 0, 1);
        relax(st, 'rds', f <= 0 ? 1e9 : Math.min(1e7, m.rds / (f * f)));
        const pw = vds * id;
        if (pw > m.pw * 0.9 || id > m.id * 1.4 || vds > m.vds * 1.3) { st.heat += dt * 0.8 * Math.max(pw / m.pw, id / m.id); if (st.heat >= 1) { st.burnt = true; EL.emit('burn', p, 'MOSFET destroyed (overload)'); } } else st.heat = Math.max(0, st.heat - dt / 15);
        st.on = f > 0.5;
      },
      draw(p) {
        const st = p.state, on = st.on;
        return wl(0, 45, 20, 45) + wl(55, 0, 55, 22) + wl(55, 68, 55, 90) + `<circle cx="38" cy="45" r="28" fill="${on ? 'rgba(145,195,97,.18)' : 'none'}" stroke="${st.burnt ? '#F55B41' : '#e8edf5'}" stroke-width="2"/><path d="M20 28 V62" stroke="#e8edf5" stroke-width="3"/><path d="M28 28 V38 M28 40 V50 M28 52 V62" stroke="#e8edf5" stroke-width="3"/><path d="M28 33 H55 V22 M28 57 H55 V68 M28 45 H55" stroke="#e8edf5" stroke-width="2.5" fill="none"/>` + T(8, 38, 'G', 'psub') + T(66, 18, top, 'psub', 'start') + T(66, 86, bot, 'psub', 'start') + T(38, 8, FETM[p.props.model].name, 'psub') + (st.burnt ? smoke(40, 30) : '');
      },
    });
  }
  D.NMOS = fet('N');
  D.PMOS = fet('P');

  D.OPTO = mk({
    prefix: 'U', name: ['Optocoupler (4N35 style)', 'أوبتوكابلر (زي 4N35)'], w: 90, h: 90,
    info: ['An LED (A-K) drives a phototransistor (C-E) with galvanic isolation. Current transfer ratio about 100 %: collector current is about the LED current. Use a resistor for the LED (about 10 mA). Used to isolate PLC and field signals.', 'LED (A-K) بيشغل ترانزستور ضوئي (C-E) بعزل جلفاني. نسبة نقل التيار حوالي 100%: تيار الكولكتور تقريبا تيار الـLED. استخدم مقاومة للـLED (حوالي 10 ملي). بيستخدم لعزل إشارات الـPLC والحقل.'],
    pins: [pin('A', 'A', 20, 0, 'u'), pin('K', 'K', 20, 90, 'd'), pin('C', 'C', 70, 0, 'u'), pin('E', 'E', 70, 90, 'd')],
    props: [{ k: 'ctr', label: ['Transfer ratio (%)', 'نسبة النقل (%)'], t: 'sel', opts: [[50, '50 %'], [100, '100 %'], [200, '200 %']], def: 100 }],
    faults: [F0, ['dead_led', ['LED side dead', 'جانب الـLED ميت']], ['dead_tr', ['Transistor side dead', 'جانب الترانزستور ميت']]],
    diag: { kind: 'opto' }, electronic: true,
    init(p) { p.state = { rce: 1e9 }; },
    elements(p) {
      const st = p.state, out = [];
      if (st.burnt) return out;
      if (p.fault !== 'dead_led') out.push({ kind: 'D', a: P(p, 'A'), b: P(p, 'K'), vf: 1.2, rd: 10, tag: 'led' });
      if (p.fault !== 'dead_tr') out.push(Z(P(p, 'C'), P(p, 'E'), st.rce, 0, { tag: 'ce' }));
      return out;
    },
    update(p, sim, dt) {
      const st = p.state, l = EL.eRead(sim, p.id, 'led'), ce = EL.eRead(sim, p.id, 'ce'), i = Math.abs(l.idc), vce = Math.abs(ce.vdc), ic = Math.abs(ce.idc);
      st.if = i; st.ic = ic;
      if (i > 0.06 && !st.burnt) { st.stress = (st.stress || 0) + dt; if (st.stress > 0.3) { st.burnt = true; EL.emit('burn', p, 'optocoupler LED overloaded'); } } else st.stress = 0;
      const icd = Math.min(i * (+p.props.ctr / 100), 0.05);
      relax(st, 'rce', icd < 2e-6 ? 1e9 : Math.max(0.2 / Math.max(ic, 1e-3), vce > 0.02 ? vce / icd : 0.05));
      st.on = ic > 0.001;
    },
    draw(p) {
      const st = p.state;
      return wl(20, 0, 20, 20) + wl(20, 70, 20, 90) + wl(70, 0, 70, 22) + wl(70, 68, 70, 90) + `<rect x="8" y="10" width="74" height="70" rx="6" fill="#1a2238" stroke="#7b879f" stroke-width="2"/><path d="M12 28 H28 L20 46 Z" fill="${st.if > 0.001 ? '#FDC300' : 'none'}" stroke="#e8edf5" stroke-width="2"/><path d="M12 46 H28" stroke="#e8edf5" stroke-width="2"/><path d="M34 30 l12 6 M34 40 l12 6" stroke="#FDC300" stroke-width="2"/><path d="M58 28 V62 M58 38 L70 28 M58 54 L70 64" stroke="#e8edf5" stroke-width="2.5" fill="none"/>` + (st.burnt ? smoke(24, 24) : '');
    },
  });

  /* ================= switches and sources ================= */
  D.TOG = mk({
    prefix: 'S', name: ['Toggle switch (on-off)', 'مفتاح توجل (on-off)'], w: 50, h: 70,
    info: ['Maintained on-off switch. Click it to flip.', 'مفتاح ثابت on-off. اضغط عليه تقلبه.'],
    pins: [pin('A', 'A', 25, 0, 'u'), pin('B', 'B', 25, 70, 'd')], faults: [F0, ['open', ['Contacts worn (never close)', 'الكونتاكتات بايظة']]],
    diag: { kind: 'switch' }, op: ['on'],
    init(p) { p.state = { on: false }; },
    elements(p) { return p.state.on && p.fault !== 'open' ? [Z(P(p, 'A'), P(p, 'B'), EL.R_CLOSED, 0, { tag: 'k' })] : []; },
    press(p, ev) { if (ev.type === 'down') { p.state.on = !p.state.on; EL.emit('click', p); } },
    draw(p) { return wl(25, 0, 25, 18) + wl(25, 52, 25, 70) + `<rect x="10" y="18" width="30" height="34" rx="5" fill="#1a2238" stroke="#7b879f"/><circle cx="25" cy="46" r="3" fill="#e8edf5"/><path d="M25 46 L${p.state.on ? 25 : 36} ${p.state.on ? 24 : 26}" stroke="#e8edf5" stroke-width="3" stroke-linecap="round"/>`; },
  });
  D.SPDT = mk({
    prefix: 'S', name: ['Slide switch (SPDT)', 'مفتاح انزلاق (SPDT)'], w: 60, h: 70,
    info: ['Changeover switch: C connects to 1 or to 2. Click to flip.', 'مفتاح تبديل: C بيتوصل بـ1 أو بـ2. اضغط تقلبه.'],
    pins: [pin('C', 'C', 30, 0, 'u'), pin('P1', '1', 12, 70, 'd'), pin('P2', '2', 48, 70, 'd')], faults: [F0, ['open', ['Contacts worn', 'الكونتاكتات بايظة']]],
    diag: { kind: 'switch' }, op: ['pos'],
    init(p) { p.state = { pos: 1 }; },
    elements(p) { return p.fault === 'open' ? [] : [Z(P(p, 'C'), P(p, p.state.pos === 2 ? 'P2' : 'P1'), EL.R_CLOSED, 0, { tag: 'k' })]; },
    press(p, ev) { if (ev.type === 'down') { p.state.pos = p.state.pos === 2 ? 1 : 2; EL.emit('click', p); } },
    draw(p) { return wl(30, 0, 30, 16) + wl(12, 70, 12, 54) + wl(48, 70, 48, 54) + `<rect x="4" y="16" width="52" height="38" rx="5" fill="#1a2238" stroke="#7b879f"/><circle cx="30" cy="22" r="3" fill="#e8edf5"/><path d="M30 22 L${p.state.pos === 2 ? 48 : 12} 50" stroke="#e8edf5" stroke-width="3" stroke-linecap="round"/>`; },
  });
  D.BATT = mk({
    prefix: 'BT', name: ['Battery / cell', 'بطارية'], w: 50, h: 80,
    info: ['DC cell or battery with internal resistance. A flat battery shows a lower voltage that collapses under load: measure it with a load, not open circuit.', 'خلية أو بطارية DC بمقاومة داخلية. البطارية الفاضية جهدها أقل وبينهار تحت الحمل: قيسها وهي شغالة على حمل مش مفتوحة.'],
    pins: [pin('pos', '+', 25, 0, 'u', { role: 'pos' }), pin('neg', '-', 25, 80, 'd', { role: 'neg' })],
    props: [{ k: 'volt', label: ['Voltage (V)', 'الجهد (فولت)'], t: 'sel', opts: [[1.5, '1.5'], [3, '3'], [4.5, '4.5'], [6, '6'], [9, '9'], [12, '12']], def: 9 }],
    faults: [F0, ['flat', ['Flat (60 % voltage, high internal resistance)', 'فاضية (60% جهد ومقاومة داخلية عالية)']]],
    diag: { kind: 'source' },
    elements(p) { const flat = p.fault === 'flat', v = +p.props.volt * (flat ? 0.6 : 1), ri = (0.3 + +p.props.volt * 0.1) * (flat ? 25 : 1); return [VS(P(p, 'neg'), INT(p, 'e'), { vdc: v, tag: 'e' }), Z(INT(p, 'e'), P(p, 'pos'), ri, 0, { tag: 'ri', noAC: true })]; },
    draw(p) { return wl(25, 0, 25, 14) + wl(25, 66, 25, 80) + `<rect x="10" y="14" width="30" height="52" rx="4" fill="#2a3552" stroke="#7b879f" stroke-width="2"/><rect x="18" y="8" width="14" height="6" fill="#c9ccd6"/>` + T(25, 40, p.props.volt + 'V', 'pbtn') + T(25, 28, '+', 'pbtn') + T(25, 60, '-', 'pbtn'); },
  });
  D.USB5 = mk({
    prefix: 'J', name: ['USB 5 V port', 'منفذ USB 5 فولت'], w: 130, h: 80,
    info: ['5 V supply with a 0.5 A resettable fuse. D+ and D- are for tracing only. More than about 0.9 A and the port shuts down for a few seconds.', 'مصدر 5 فولت بفيوز 0.5 أمبير بيرجع لوحده. D+ وD- للرسم بس. أكتر من 0.9 أمبير تقريبا والمنفذ بيفصل كام ثانية.'],
    pins: [pin('VBUS', '5V', 20, 80, 'd', { role: 'pos' }), pin('DM', 'D-', 50, 80, 'd'), pin('DP', 'D+', 80, 80, 'd'), pin('GND', 'GND', 110, 80, 'd', { role: 'neg' })],
    faults: [F0, ['dead', ['No output', 'مفيش خرج']]], diag: { kind: 'source' },
    init(p) { p.state = { off: 0 }; },
    elements(p) { const st = p.state; if (p.fault === 'dead' || st.off > 0) return [Z(P(p, 'VBUS'), P(p, 'GND'), 1e7, 0, { tag: 'x', noAC: true })]; return [VS(P(p, 'GND'), INT(p, 'e'), { vdc: 5.0, tag: 'e' }), Z(INT(p, 'e'), P(p, 'VBUS'), 0.35, 0, { tag: 'z', noAC: true })]; },
    update(p, sim, dt) { const st = p.state; if (st.off > 0) { st.off = Math.max(0, st.off - dt); return; } const z = EL.eRead(sim, p.id, 'z'); st.amps = Math.abs(z.idc); if (st.amps > 0.9) { st.off = 3; EL.emit('trip', p, 'USB overcurrent'); } },
    draw(p) { return `<rect x="6" y="4" width="118" height="60" rx="5" fill="#c9ccd6" stroke="#0e1626" stroke-width="2"/><rect x="20" y="18" width="90" height="26" fill="#1a2238"/><rect x="26" y="28" width="78" height="6" fill="#47BFD9"/>` + [20, 50, 80, 110].map((x) => wl(x, 64, x, 80)).join('') + T(65, 14, p.state.off > 0 ? 'OVERLOAD' : 'USB 5V', 'psub'); },
  });
  D.DCJ = mk({
    prefix: 'J', name: ['DC adapter jack', 'مدخل أدابتور DC'], w: 90, h: 90,
    info: ['Barrel jack fed by a wall adapter: choose its voltage and current limit. An adapter overloaded by more than 30 % trips for a few seconds and retries.', 'مدخل أدابتور: اختار جهده وحد التيار. الأداباتور المحمّل أكتر من 30% بيفصل كام ثانية ويحاول تاني.'],
    pins: [pin('pos', '+', 25, 90, 'd', { role: 'pos' }), pin('neg', '-', 65, 90, 'd', { role: 'neg' })],
    props: [{ k: 'volt', label: ['Voltage (V)', 'الجهد (فولت)'], t: 'sel', opts: [[5, '5'], [9, '9'], [12, '12'], [19, '19'], [24, '24']], def: 12 }, { k: 'amps', label: ['Current limit (A)', 'حد التيار (أمبير)'], t: 'sel', opts: [[0.5, '0.5'], [1, '1'], [2, '2'], [3, '3'], [5, '5']], def: 1 }],
    faults: [F0, ['dead', ['No output', 'مفيش خرج']]], diag: { kind: 'source' },
    init(p) { p.state = { off: 0 }; },
    elements(p) { const st = p.state; if (p.fault === 'dead' || st.off > 0) return [Z(P(p, 'pos'), P(p, 'neg'), 1e7, 0, { tag: 'x', noAC: true })]; return [VS(P(p, 'neg'), INT(p, 'e'), { vdc: +p.props.volt, tag: 'e' }), Z(INT(p, 'e'), P(p, 'pos'), 0.3, 0, { tag: 'z', noAC: true })]; },
    update(p, sim, dt) { const st = p.state; if (st.off > 0) { st.off = Math.max(0, st.off - dt); return; } const z = EL.eRead(sim, p.id, 'z'); st.amps = Math.abs(z.idc); if (st.amps > +p.props.amps * 1.3) { st.off = 3; EL.emit('trip', p, 'adapter overload'); } },
    draw(p) { return `<rect x="8" y="6" width="74" height="60" rx="8" fill="#1a2238" stroke="#7b879f" stroke-width="2"/><circle cx="45" cy="36" r="20" fill="#0e1626" stroke="#7b879f"/><circle cx="45" cy="36" r="6" fill="#c9ccd6"/>` + wl(25, 66, 25, 90) + wl(65, 66, 65, 90) + T(45, 20, p.props.volt + 'V ' + p.props.amps + 'A', 'psub') + T(25, 78, '+', 'pbtn') + T(65, 78, '-', 'pbtn') + (p.state.off > 0 ? T(45, 52, 'OVERLOAD', 'psub') : ''); },
  });
  D.RELAY5 = mk({
    prefix: 'K', name: ['PCB relay (SPDT, 5/12/24 V coil)', 'ريلاي كارت (SPDT وكويل 5/12/24)'], w: 100, h: 90,
    info: ['Small PCB relay. Coil A-B (about 0.36 W) pulls in above 75 % of its voltage and drops out below 15 %. Contact COM switches to NO when energised, NC when not. Put a flyback diode across the coil when a transistor drives it.', 'ريلاي صغير للكروت. الكويل A-B (حوالي 0.36 وات) بيشتغل فوق 75% من جهده وبيقع تحت 15%. الكونتاكت COM بيروح لـNO وهو شغال ولـNC وهو فاصل. حط دايود فلاي باك على الكويل لو ترانزستور بيشغله.'],
    pins: [pin('A', 'A', 20, 0, 'u'), pin('B', 'B', 20, 90, 'd'), pin('COM', 'COM', 80, 0, 'u'), pin('NC', 'NC', 60, 90, 'd'), pin('NO', 'NO', 90, 90, 'd')],
    props: [{ k: 'v', label: ['Coil voltage', 'جهد الكويل'], t: 'sel', opts: [[5, '5 V DC'], [12, '12 V DC'], [24, '24 V DC']], def: 12 }],
    faults: [F0, ['open_coil', ['Coil open', 'الكويل مقطوع']], ['stuck', ['Contact stuck (never moves)', 'الكونتاكت لاصق']]],
    diag: { kind: 'relay' },
    init(p) { p.state = { on: false }; },
    elements(p) {
      const st = p.state, out = [];
      if (p.fault !== 'open_coil' && !st.burnt) out.push(Z(P(p, 'A'), P(p, 'B'), (p.props.v * p.props.v) / 0.36, 0, { tag: 'c', noAC: true }));
      const on = p.fault === 'stuck' ? false : st.on;
      out.push(Z(P(p, 'COM'), P(p, on ? 'NO' : 'NC'), EL.R_CLOSED, 0, { tag: 'k' }));
      return out;
    },
    update(p, sim, dt) {
      const st = p.state, v = Math.abs(EL.eRead(sim, p.id, 'c').vdc);
      st.v = v;
      if (v >= 0.75 * p.props.v) st.on = true; else if (v <= 0.15 * p.props.v) st.on = false;
      if (v > 1.6 * p.props.v) { st.stress = (st.stress || 0) + dt; if (st.stress > 1 && !st.burnt) { st.burnt = true; EL.emit('burn', p, 'relay coil overvoltage'); } } else st.stress = 0;
    },
    draw(p) {
      const on = p.fault === 'stuck' ? false : p.state.on;
      return wl(20, 0, 20, 14) + wl(20, 76, 20, 90) + wl(80, 0, 80, 30) + wl(60, 90, 60, 66) + wl(90, 90, 90, 66) + `<rect x="6" y="14" width="40" height="62" rx="4" fill="${p.state.on ? '#2b5a8a' : '#1a2238'}" stroke="#7b879f" stroke-width="2"/>` + T(26, 50, 'K', 'pbtn') + `<line x1="80" y1="30" x2="${on ? 90 : 60}" y2="64" stroke="${on ? '#91C361' : '#e8edf5'}" stroke-width="2.5"/>` + T(70, 10, 'COM', 'psub', 'end') + T(26, 28, p.props.v + 'V', 'psub') + (p.state.burnt ? smoke(24, 20) : '');
    },
  });

  /* ================= connectors, headers, ICs ================= */
  function header(n) {
    const w = 24 * n + 8, pins = [];
    for (let i = 0; i < n; i++) pins.push(pin('p' + (i + 1), '' + (i + 1), 16 + 24 * i, 16, 'u'));
    return mk({
      prefix: 'J', name: ['Pin header ' + n + ' pin', 'هيدر ' + n + ' بن'], w, h: 32,
      info: ['Single-row pin header. Every pin is separate. Use it to draw connectors on a board you are tracing.', 'صف دبابيس. كل بن مستقل. استخدمه لرسم الكونيكتورات في كارت بتعمل له تتبع.'],
      pins, diag: { kind: 'wire' },
      draw() { let r = `<rect x="2" y="2" width="${w - 4}" height="28" rx="3" fill="#1a1a1e" stroke="#7b879f"/>`; for (let i = 0; i < n; i++) r += `<rect x="${10 + 24 * i}" y="10" width="12" height="12" fill="#d9a441" stroke="#7a5b1a"/>` + T(16 + 24 * i, 40, '' + (i + 1), 'psub'); return r; },
    });
  }
  D.HDR2 = header(2); D.HDR4 = header(4); D.HDR6 = header(6);
  function conn(n) {
    const w = 24 * n + 16, h = 76, pins = [], faults = [F0];
    for (let i = 1; i <= n; i++) { pins.push(pin('a' + i, '' + i, 8 + 24 * (i - 1) + 12, 0, 'u'), pin('b' + i, '' + i, 8 + 24 * (i - 1) + 12, h, 'd')); faults.push(['open_' + i, ['Pin ' + i + ' dirty / loose (open)', 'البن ' + i + ' متسخ / سايب (مفتوح)']]); }
    return mk({
      prefix: 'X', name: ['Mated connector ' + n + ' pin', 'كونيكتور متوصل ' + n + ' بن'], w, h,
      info: ['A plug and socket joined together. Pin n on the top joins pin n on the bottom. Dirty or loose pins are a common field fault.', 'فيشة وبريزة متوصلين. البن n فوق بيتوصل بالبن n تحت. البنات المتسخة أو السايبة عطل مشهور في الحقل.'],
      pins, faults, diag: { kind: 'wire' },
      ties(p) { const o = []; for (let i = 1; i <= n; i++) if (p.fault !== 'open_' + i) o.push(['a' + i, 'b' + i]); return o; },
      draw(p) { let r = `<rect x="2" y="16" width="${w - 4}" height="20" rx="3" fill="#2a3552" stroke="#7b879f"/><rect x="2" y="40" width="${w - 4}" height="20" rx="3" fill="#c9ccd6" stroke="#0e1626"/>`; for (let i = 1; i <= n; i++) { const x = 8 + 24 * (i - 1) + 12; r += wl(x, 0, x, 20) + wl(x, 56, x, h) + `<circle cx="${x}" cy="26" r="4" fill="${p.fault === 'open_' + i ? '#F55B41' : '#d9a441'}"/><circle cx="${x}" cy="50" r="4" fill="#7b879f"/>` + T(x, 12, '' + i, 'psub'); } return r; },
    });
  }
  D.CONN4 = conn(4); D.CONN8 = conn(8);
  function ic(n, nm, vcc, gnd) {
    const half = n / 2, w = 80, h = 28 + 22 * half, pins = [];
    for (let i = 1; i <= half; i++) pins.push(pin('p' + i, '' + i, 0, 20 + 22 * (i - 1), 'l'));
    for (let k = half + 1; k <= n; k++) pins.push(pin('p' + k, '' + k, w, 20 + 22 * (n - k), 'r'));
    return mk({
      prefix: 'U', name: nm, w, h,
      info: ['Generic ' + n + '-pin chip for tracing a real board. Its function is not simulated, but it is powered from its VCC and GND pins (set in Properties), so the diagnosis can tell if the chip has its supply. Pin 1 is at the top left, pins count down the left side and up the right side.', 'شريحة عامة ' + n + ' رجل لتتبع كارت حقيقي. وظيفتها مش بتتحاكى، لكن بتتغذى من رجل VCC وGND (من الخصائص) فالدايجنوسس يعرف لو الشريحة واخدة تغذيتها. الرجل 1 فوق الشمال والعدد بينزل على الشمال ويطلع على اليمين.'],
      pins, props: [{ k: 'label', label: ['Chip name', 'اسم الشريحة'], t: 'text1', max: 12, def: 'IC' }, { k: 'vcc', label: ['VCC pin number', 'رقم رجل VCC'], t: 'num', min: 0, max: n, step: 1, def: vcc }, { k: 'gnd', label: ['GND pin number', 'رقم رجل GND'], t: 'num', min: 0, max: n, step: 1, def: gnd }],
      faults: [F0, ['dead', ['Chip dead', 'الشريحة ميتة']]], diag: { kind: 'ic', unmodeled: true },
      init(p) { p.state = { pw: false }; },
      elements(p) { const a = +p.props.vcc, b = +p.props.gnd; if (!a || !b || a === b || p.state.burnt) return []; return [Z(P(p, 'p' + a), P(p, 'p' + b), p.fault === 'dead' ? 1e6 : 600, 0, { tag: 's', noAC: true })]; },
      update(p, sim, dt) { const st = p.state, a = +p.props.vcc, b = +p.props.gnd; if (!a || !b) { st.pw = false; return; } const v = sim.vdc(P(p, 'p' + a), P(p, 'p' + b)); st.v = v; st.pw = p.fault !== 'dead' && v >= 2.7 && v <= 16; if (v > 18 && !st.burnt) { st.burnt = true; EL.emit('burn', p, 'chip overvoltage'); } },
      draw(p) { let r = `<rect x="10" y="6" width="${w - 20}" height="${h - 12}" rx="4" fill="#1a1a1e" stroke="#7b879f" stroke-width="2"/><circle cx="22" cy="18" r="3" fill="#7b879f"/>`; for (const q of pins) r += `<rect x="${q.x === 0 ? 0 : w - 10}" y="${q.y - 4}" width="10" height="8" fill="#c9ccd6"/>` + T(q.x === 0 ? 20 : w - 20, q.y + 3, q.label, 'psub'); r += T(w / 2, h / 2 + 2, String(p.props.label || '').slice(0, 10), 'pbtn') + `<circle cx="${w - 22}" cy="18" r="3.5" class="led ${p.state.pw ? 'ledg' : ''}"/>`; return r + (p.state.burnt ? smoke(w / 2, 20) : ''); },
    });
  }
  D.IC8 = ic(8, ['IC 8-pin (generic DIP)', 'شريحة 8 رجل (عامة)'], 8, 4);
  D.IC14 = ic(14, ['IC 14-pin (generic DIP)', 'شريحة 14 رجل (عامة)'], 14, 7);
  D.IC16 = ic(16, ['IC 16-pin (generic DIP)', 'شريحة 16 رجل (عامة)'], 16, 8);

  /* extend existing parts so they also appear in the PCB palette */
  for (const k of ['RES', 'DIO', 'POT', 'BUZ']) if (D[k]) D[k].pcb = true;
  if (D.BUZ) D.BUZ.props[0].opts = [['5VDC', '5 V DC'], ['12VDC', '12 V DC']].concat(D.BUZ.props[0].opts);
})(typeof window !== 'undefined' ? window : globalThis);
