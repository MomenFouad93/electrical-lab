/* Parts C: motor, loads, sensors, field instruments */
(function (g) {
  const EL = g.EL;
  const { P, INT, Z, IS, cabs } = EL;
  const D = EL.defs;
  const T = EL.T, body = EL.body, pin = EL.mkpin;
  const KW_I = EL.KW_I;

  /* ---------------- motor nameplate (IEC 60034-1 rating plate) ----------------
     Efficiency = IE3 minimum of IEC 60034-30-1 at 50 Hz, power factor and slip = typical catalogue values,
     frame = IEC 60072 standard frame for the power and pole number. In = P / (√3 · U · η · cosφ). */
  const PL = {
    kw: [0.18, 0.37, 0.75, 1.5, 2.2, 3, 4, 5.5, 7.5, 11],
    eta: { 2: [65.9, 73.8, 80.7, 84.2, 85.9, 87.1, 88.1, 89.2, 90.1, 91.2], 4: [69.9, 77.3, 82.5, 85.3, 86.7, 87.7, 88.6, 89.6, 90.4, 91.4], 6: [63.9, 73.5, 78.9, 82.5, 84.3, 85.6, 86.8, 88.0, 89.1, 90.3] },
    cos: { 2: [0.78, 0.80, 0.82, 0.85, 0.86, 0.87, 0.88, 0.88, 0.88, 0.89], 4: [0.66, 0.70, 0.76, 0.79, 0.81, 0.82, 0.82, 0.83, 0.84, 0.85], 6: [0.62, 0.66, 0.70, 0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.80] },
    slip: [7.5, 6.5, 6, 4.5, 4, 3.7, 3.3, 3, 2.7, 2.3],
    frame: { 2: ['63M', '71M', '80M', '90S', '90L', '100L', '112M', '132S', '132S', '160M'], 4: ['63M', '71M', '80M', '90L', '100L', '100L', '112M', '132S', '132M', '160M'], 6: ['71M', '80M', '90S', '100L', '112M', '132S', '132M', '132M', '160M', '160L'] },
  };
  const r2 = (x) => Math.round(x * 100) / 100, near = (kw) => { let b = 0; PL.kw.forEach((k, i) => { if (Math.abs(k - kw) < Math.abs(PL.kw[b] - kw)) b = i; }); return b; };
  EL.motorPlate = function (p) {
    const kw = +p.props.kw || 1.5, i = near(kw);
    if (p.type === 'MOT1') {
      const eta = [60, 66, 72, 76, 78][[0.18, 0.37, 0.75, 1.5, 2.2].indexOf(kw)] || 70, cos = [0.85, 0.9, 0.92, 0.95, 0.96][[0.18, 0.37, 0.75, 1.5, 2.2].indexOf(kw)] || 0.9;
      return { ph: 1, kw, poles: 4, rpm: Math.round(1500 * (1 - 1.3 * PL.slip[i] / 100) / 5) * 5, eta, cos, inom: r2((kw * 1000) / (230 * (eta / 100) * cos)), volt: '230', frame: PL.frame[4][i], ip: 'IP55', ins: 'F', duty: 'S1', ie: '', hz: 50 };
    }
    const poles = [2, 4, 6].indexOf(+p.props.poles) >= 0 ? +p.props.poles : 4, eta = PL.eta[poles][i], cos = PL.cos[poles][i];
    const ns = 6000 / poles, slip = PL.slip[i] * (poles === 6 ? 1.25 : 1);
    const i400 = (kw * 1000) / (Math.sqrt(3) * 400 * (eta / 100) * cos);
    const low = p.props.volt === '230D'; // 230 V Δ / 400 V Y winding, else 400 V Δ / 690 V Y
    return { ph: 3, kw, poles, rpm: Math.round(ns * (1 - slip / 100) / 5) * 5, eta, cos, i400: r2(i400), inom: r2(i400), volt: low ? '230D' : '400D',
      uD: low ? 230 : 400, uY: low ? 400 : 690, iD: r2(low ? i400 * Math.sqrt(3) : i400), iY: r2(low ? i400 : i400 / Math.sqrt(3)), frame: PL.frame[poles][i], ip: 'IP55', ins: 'F', duty: 'S1', ie: 'IE3', hz: 50 };
  };
  EL.motorPlate.table = PL;

  /* ---------------- 3-phase motor ---------------- */
  function Tm(s) { const a = Math.min(1, Math.abs(s)); const t = 5 / (a / 0.1 + 0.1 / Math.max(a, 1e-6)) + 1.6 * a ** 4; return s < 0 ? -t : t; }
  EL.Tm = Tm;
  D.MOT3 = {
    cat: 'load', prefix: 'M', name: ['3-phase motor', 'موتور 3 فاز'], w: 150, h: 140,
    info: ['Squirrel-cage induction motor (IE3). Winding 400 V Δ / 690 V Y (default): delta gives full power on 400 V, star on 400 V gives only 1/3 torque (that is what a star-delta starter uses at start). Winding 230 V Δ / 400 V Y (usual for small motors): on a 400 V supply connect it in STAR; delta on 400 V overloads the windings. The nameplate in the Part panel gives In, cosφ, efficiency and speed. Swap two phases to reverse.', 'موتور قفص سنجابي (IE3). الملفات 400 فولت دلتا / 690 ستار (الافتراضي): الدلتا بتدي القدرة الكاملة على 400 فولت، والستار على 400 بيدي ثلث العزم بس (وده اللي بيستخدمه ستار-دلتا وقت التشغيل). الملفات 230 دلتا / 400 ستار (المعتاد في الموتورات الصغيرة): على مصدر 400 وصّله ستار؛ الدلتا على 400 بتحمّل الملفات زيادة. لوحة البيانات في خانة الجهاز فيها In و cosφ والكفاءة والسرعة. بدّل فازتين للعكس.'],
    pins(p) {
      const a = [pin('U1', 'U1', 30, 0, 'u'), pin('V1', 'V1', 75, 0, 'u'), pin('W1', 'W1', 120, 0, 'u'), pin('PE', 'PE', 150, 70, 'r', { earth: true })];
      if (p.props.conn === '6wire') a.push(pin('W2', 'W2', 30, 140, 'd'), pin('U2', 'U2', 75, 140, 'd'), pin('V2', 'V2', 120, 140, 'd'));
      return a;
    },
    props: [
      { k: 'kw', label: ['Power (kW)', 'القدرة (kW)'], t: 'sel', opts: [[0.37, '0.37'], [0.75, '0.75'], [1.5, '1.5'], [2.2, '2.2'], [3, '3'], [4, '4'], [5.5, '5.5'], [7.5, '7.5'], [11, '11']], def: 1.5 },
      { k: 'poles', label: ['Poles (speed)', 'عدد الأقطاب (السرعة)'], t: 'sel', opts: [[2, '2P (3000 rpm)'], [4, '4P (1500 rpm)'], [6, '6P (1000 rpm)']], def: 4 },
      { k: 'volt', label: ['Winding voltage', 'جهد الملفات'], t: 'sel', opts: [['400D', '400 V Δ / 690 V Y'], ['230D', '230 V Δ / 400 V Y']], def: '400D' },
      { k: 'conn', label: ['Terminal box links', 'توصيل علبة الموتور'], t: 'sel', opts: [['delta', 'Delta (400 V)'], ['star', 'Star'], ['6wire', '6 wires (open)']], def: 'delta' },
      { k: 'load', label: ['Mechanical load', 'الحمل الميكانيكي'], t: 'sel', opts: [[0.3, 'Light (fan)'], [0.6, 'Normal (pump)'], [1.0, 'Heavy (crusher)']], def: 0.6 },
      { k: 'ins', label: ['Insulation (MΩ)', 'العزل (ميجا أوم)'], t: 'num', min: 0.01, max: 10000, step: 1, def: 800 },
    ],
    faults: [['none', ['None', 'سليم']], ['open_winding', ['Winding W open', 'ملف W مقطوع']], ['low_ins', ['Low insulation to earth', 'عزل ضعيف مع الأرضي']], ['turn_short', ['Shorted turns in winding U', 'لفات متقصرة في ملف U']], ['seized', ['Rotor seized (jammed)', 'الموتور محبوس (بيتحبس)']]],
    sumTies: true,
    ties(p) { return p.props.conn === 'delta' ? [['U1', 'W2'], ['V1', 'U2'], ['W1', 'V2']] : p.props.conn === 'star' ? [['U2', 'V2', 'W2']] : []; },
    init(p) { p.state = { w: 0, ws: 1, dir: 0, amps: 0 }; },
    elements(p, ctx) {
      // rated line current at 400 V from the nameplate; winding impedance from the winding voltage (a 230 V winding has 1/3 of the impedance)
      const I = EL.motorPlate(p).i400, Zn = p.props.volt === '230D' ? 230 / I : 400 / (I / Math.sqrt(3));
      const st = p.state, ws = st.ws > 0.02 ? st.ws : 1;
      const slip = Math.min(1, Math.max(0, (ws - st.w) / ws));
      const k = 1 + 5 * Math.max(0, slip - 0.03) / 0.97;
      const lf = typeof st.pl === 'number' ? Math.max(0.5, 0.4 + 0.6 * st.pl) : 1; // a linked pump sets the load: less flow, less active current
      const rdc = Math.max(0.5, 0.04 * Zn), rac = Zn * 0.82 / k / lf, xl = (Zn * 0.572 / k) / (2 * Math.PI * 50);
      const out = [];
      [['U', 'U1', 'U2'], ['V', 'V1', 'V2'], ['W', 'W1', 'W2']].forEach(([ph, a, b]) => {
        if (ph === 'W' && p.fault === 'open_winding') return;
        const sc = ph === 'U' && p.fault === 'turn_short' ? 0.35 : 1;
        out.push(Z(P(p, a), P(p, b), rdc * sc, xl * sc, { tag: 'w' + ph, rac: rac * sc }));
      });
      if (ctx.dead) {
        const ins = (p.fault === 'low_ins' ? 0.25 : +p.props.ins) * 1e6;
        for (const a of ['U1', 'V1', 'W1']) out.push(Z(P(p, a), P(p, 'PE'), ins * 3, 0, { tag: 'ins' + a, noAC: true }));
      }
      return out;
    },
    update(p, sim, dt) {
      const st = p.state;
      const rd = (t) => { const e = sim.e(p.id, t); return e ? EL.cabs(e.r_.vac) : 0; };
      const vU = rd('wU'), vV = rd('wV'), vW = rd('wW');
      const f = sim.freqAt(P(p, 'U1'));
      const vavg = (vU + vV + vW) / 3, vmin = Math.min(vU, vV, p.fault === 'open_winding' ? vV : vW);
      st.ws = f / 50;
      let tq = 0;
      if (st.ws > 0.02 && vavg > 5) {
        const vr = vavg / ((p.props.volt === '230D' ? 230 : 400) * Math.max(st.ws, 0.04));
        const unb = vmin / Math.max(vavg, 1e-6);
        tq = vr * vr * unb * unb;
        if (p.fault === 'open_winding') tq *= 0.4;
      }
      // direction by phase sequence
      const Ua = sim.vacAt(P(p, 'U1')), Va = sim.vacAt(P(p, 'V1')), Wa = sim.vacAt(P(p, 'W1'));
      const mean = [(Ua[0] + Va[0] + Wa[0]) / 3, (Ua[1] + Va[1] + Wa[1]) / 3];
      const u = EL.csub(Ua, mean), v = EL.csub(Va, mean), w = EL.csub(Wa, mean);
      const seq = EL.cmul(EL.cconj(u), v)[1] + EL.cmul(EL.cconj(v), w)[1] + EL.cmul(EL.cconj(w), u)[1];
      if (Math.hypot(u[0], u[1]) > 20 && tq > 0.02) st.seqdir = seq < 0 ? 1 : -1;
      const load = typeof st.pl === 'number' ? st.pl : +p.props.load; // st.pl: load set by a linked pump in the plant
      const n = Math.max(1, Math.ceil(dt / 0.02)), h = dt / n;
      for (let i = 0; i < n; i++) {
        const s = st.ws > 0.02 ? (st.ws - st.w) / st.ws : 1;
        const torque = st.ws > 0.02 ? tq * Tm(s) : 0;
        const L = load * (0.1 + 0.9 * st.w * st.w);
        st.w += (h * (torque - L)) / 2.5;
        if (st.w < 0) st.w = 0;
        if (st.w > 1.05) st.w = 1.05;
      }
      if (p.fault === 'seized') st.w = 0;
      st.dir = st.w > 0.03 ? (st.seqdir || 1) : 0;
      const ia = sim.iPin(P(p, 'U1'));
      st.amps = cabs(ia.ac);
      st.volts = vavg; st.tq = tq;
      st.rpm = Math.round(st.w * 6000 / ([2, 4, 6].indexOf(+p.props.poles) >= 0 ? +p.props.poles : 4));
    },
    draw(p) {
      const st = p.state, I = EL.motorPlate(p).i400;
      let r = `<rect class="pbody" x="0" y="0" width="150" height="140" rx="10"/>`;
      r += `<circle cx="75" cy="70" r="44" fill="#16203a" stroke="#7b879f" stroke-width="3"/>`;
      const dur = st.w > 0.03 ? Math.max(0.12, 1.1 / st.w) : 0;
      const blades = [0, 120, 240].map((a) => `<path d="M75 70 L75 36 A34 34 0 0 1 ${75 + 34 * Math.sin((40 * Math.PI) / 180)} ${70 - 34 * Math.cos((40 * Math.PI) / 180)} Z" fill="#47BFD9" opacity=".75" transform="rotate(${a} 75 70)"/>`).join('');
      r += `<g class="${dur ? (st.dir < 0 ? 'spinr' : 'spin') : ''}" style="${dur ? 'animation-duration:' + dur.toFixed(2) + 's;' : ''}transform-box:fill-box;transform-origin:center">${blades}</g>`;
      r += `<circle cx="75" cy="70" r="10" fill="#0e1626" stroke="#7b879f"/><text class="pbtn" x="75" y="74" text-anchor="middle">M</text>`;
      r += T(75, 128, p.props.kw + ' kW  ' + I + ' A  ' + (p.props.conn === 'star' ? 'Y' : p.props.conn === 'delta' ? 'Δ' : 'Y/Δ'), 'psub');
      r += `<text class="psub" x="75" y="22" text-anchor="middle" font-size="10">${st.w > 0.03 ? Math.round(st.w * 0.966 * 6000 / EL.motorPlate(p).poles) + ' rpm ' + (st.dir < 0 ? 'REV' : 'FWD') : 'stopped'}</text>`;
      return r;
    },
  };

  /* ---------------- lamp ---------------- */
  D.LAMP = {
    cat: 'load', prefix: 'HL', name: ['Pilot lamp', 'لمبة بيان'], w: 40, h: 80,
    info: ['Pilot lamp, 2 W. Lights when it gets about its rated voltage. More than 130 % burns it.', 'لمبة بيان 2 وات. بتنور لما يجيلها جهدها المقنن. أكتر من 130% بتتحرق.'],
    pins: [pin('X1', 'X1', 20, 0, 'u'), pin('X2', 'X2', 20, 80, 'd')],
    props: [
      { k: 'volt', label: ['Rated voltage', 'الجهد المقنن'], t: 'sel', opts: [['24VDC', '24 V DC'], ['24VAC', '24 V AC'], ['230VAC', '230 V AC']], def: '230VAC' },
      { k: 'color', label: ['Colour', 'اللون'], t: 'sel', opts: [['green', 'Green'], ['red', 'Red'], ['amber', 'Amber'], ['white', 'White'], ['blue', 'Blue']], def: 'green' },
    ],
    faults: [['none', ['None', 'سليم']], ['burnt', ['Burnt out', 'محروقة']]],
    init(p) { p.state = { b: 0 }; },
    elements(p) { if (p.state.burnt || p.fault === 'burnt') return []; const V = parseInt(p.props.volt, 10); return [Z(P(p, 'X1'), P(p, 'X2'), (V * V) / 2, 0, { tag: 'l' })]; },
    update(p, sim, dt) {
      const r = EL.eRead(sim, p.id, 'l'), V = parseInt(p.props.volt, 10), v = Math.max(r.vac, Math.abs(r.vdc));
      p.state.b = Math.max(0, Math.min(1, (v / V - 0.35) / 0.55));
      p.state.v = v;
      if (v > 1.3 * V) { p.state.stress = (p.state.stress || 0) + dt; if (p.state.stress > 0.5) { p.state.burnt = true; EL.emit('burn', p); } } else p.state.stress = 0;
    },
    draw(p) {
      const col = { green: '#91C361', red: '#F55B41', amber: '#FDC300', white: '#f2f2f2', blue: '#47BFD9' }[p.props.color];
      const b = p.state.b, bu = p.state.burnt || p.fault === 'burnt';
      return `<line x1="20" y1="0" x2="20" y2="22" class="wl"/><line x1="20" y1="58" x2="20" y2="80" class="wl"/>` +
        (b > 0.05 ? `<circle cx="20" cy="40" r="26" fill="${col}" opacity="${(b * 0.45).toFixed(2)}"/>` : '') +
        `<circle cx="20" cy="40" r="18" fill="${bu ? '#1b1b1b' : col}" opacity="${bu ? 1 : (0.25 + 0.75 * b).toFixed(2)}" stroke="#0e1626" stroke-width="2"/>` +
        `<path d="M10 30 L30 50 M30 30 L10 50" stroke="#0e1626" stroke-width="2"/>` + T(20, 76, p.props.volt.replace('VAC', 'V~').replace('VDC', 'V='), 'psub');
    },
  };

  /* ---------------- solenoid / I-P valve ---------------- */
  const SOLM = {
    std: { R: 192, V: 24, name: ['24 V DC solenoid valve (3 W)', 'سولينويد 24 فولت DC (3 وات)'] },
    lp: { R: 576, V: 12, name: ['Low-power solenoid 12 V (0.25 W)', 'سولينويد قدرة منخفضة 12 فولت (0.25 وات)'] },
    ip: { R: 250, V: 0, name: ['I/P valve positioner 4-20 mA', 'I/P مقوم صمام 4-20 ملي أمبير'] },
  };
  D.SOL = {
    cat: 'load', prefix: 'YV', name: ['Solenoid / control valve', 'سولينويد / فالف تحكم'], w: 80, h: 100,
    info: ['Three models. 24 V solenoid: needs about 100 mA. Low-power coil: opens from about 17 mA, so a 24 mA calibrator can drive it, but 24 V burns it. I/P positioner: valve opens in proportion to the 4-20 mA signal.', 'تلات موديلات. سولينويد 24 فولت: محتاج حوالي 100 ملي أمبير. كويل قدرة منخفضة: بيفتح من حوالي 17 ملي أمبير فالكاليبريتور 24 ملي بيشغله، لكن 24 فولت بتحرقه. I/P: الفالف بيفتح بنسبة إشارة 4-20 ملي أمبير.'],
    pins: [pin('pos', '+', 40, 0, 'u'), pin('neg', '−', 40, 100, 'd')],
    props: [{ k: 'model', label: ['Model', 'الموديل'], t: 'sel', opts: [['std', '24 V solenoid (3 W)'], ['lp', 'Low-power 12 V (0.25 W)'], ['ip', 'I/P 4-20 mA']], def: 'std' }],
    faults: [['none', ['None', 'سليم']], ['open_coil', ['Coil open', 'الكويل مقطوع']], ['stuck', ['Valve stuck closed', 'الفالف محبوس مقفول']]],
    init(p) { p.state = { pos: 0 }; },
    elements(p) { if (p.state.burnt || p.fault === 'open_coil') return []; return [Z(P(p, 'pos'), P(p, 'neg'), SOLM[p.props.model].R, 0, { tag: 'c', noAC: false })]; },
    update(p, sim, dt) {
      const st = p.state, m = p.props.model, r = EL.eRead(sim, p.id, 'c'), V = Math.abs(r.vdc), I = r.idc;
      st.v = V; st.i = I;
      const M = SOLM[m];
      let target = 0;
      if (m === 'ip') {
        target = Math.max(0, Math.min(1, (I * 1000 - 4) / 16));
        if (I * 1000 < 3.6) target = 0;
        if (I > 0.06) { st.stress = (st.stress || 0) + dt; if (st.stress > 0.5) { st.burnt = true; EL.emit('burn', p); } } else st.stress = 0;
      } else {
        const on = V >= (st.pos > 0.5 ? 0.4 : 0.8) * M.V;
        target = on ? 1 : 0;
        if (V > 1.4 * M.V) { st.stress = (st.stress || 0) + dt; if (st.stress > 0.5) { st.burnt = true; EL.emit('burn', p); } } else st.stress = 0;
      }
      if (p.fault === 'stuck') target = 0;
      const rate = m === 'ip' ? 1.5 : 8;
      st.pos += Math.max(-rate * dt, Math.min(rate * dt, target - st.pos));
    },
    draw(p) {
      const st = p.state, pc = Math.round(st.pos * 100), m = p.props.model;
      let r = `<line x1="40" y1="0" x2="40" y2="14" class="wl"/><line x1="40" y1="86" x2="40" y2="100" class="wl"/>`;
      r += `<rect x="22" y="14" width="36" height="22" rx="4" fill="${st.burnt ? '#2a1d1d' : '#1a2238'}" stroke="#7b879f" stroke-width="2"/><path d="M26 25 q3 -6 6 0 t6 0 t6 0 t6 0" fill="none" stroke="#47BFD9" stroke-width="2"/>`;
      r += `<line x1="40" y1="36" x2="40" y2="50" stroke="#7b879f" stroke-width="3"/>`;
      r += `<path d="M10 62 L40 76 L10 90 Z M70 62 L40 76 L70 90 Z" fill="${st.pos > 0.5 ? '#2f7d3f' : '#3b4d73'}" stroke="#0e1626"/>`;
      r += `<rect x="34" y="${70 - st.pos * 10}" width="12" height="14" fill="#FDC300" stroke="#0e1626"/>`;
      r += T(40, 56, m === 'ip' ? pc + '%' : st.pos > 0.5 ? 'OPEN' : 'CLOSED', 'pbtn') + (st.burnt ? burntMark(30, 25) : '');
      return r;
    },
  };
  const burntMark = (x, y) => `<g class="smoke"><circle cx="${x}" cy="${y}" r="5" fill="#222" opacity=".8"/><circle cx="${x + 6}" cy="${y - 6}" r="4" fill="#444" opacity=".7"/></g>`;

  /* ---------------- resistor / diode / pot ---------------- */
  const fmtR = (r) => (r >= 1e6 ? (r / 1e6).toFixed(r % 1e6 ? 2 : 0) + ' MΩ' : r >= 1e3 ? (r / 1e3).toFixed(r % 1e3 ? 2 : 0) + ' kΩ' : r.toFixed(r % 1 ? 1 : 0) + ' Ω');
  EL.fmtR = fmtR;
  const bands = (r) => {
    const col = ['#000', '#7a3b00', '#c0261b', '#e8830c', '#ecd400', '#2c9c35', '#2a54c4', '#8b3ac9', '#888', '#fff'];
    const e = Math.floor(Math.log10(Math.max(r, 1))), mant = Math.round(r / Math.pow(10, e - 1));
    const a = Math.floor(mant / 10), b = mant % 10, mul = Math.max(0, Math.min(9, e - 1));
    return [col[a % 10], col[b], col[mul], '#c9a227'];
  };
  D.RES = {
    cat: 'load', prefix: 'R', name: ['Resistor / resistive load', 'مقاومة / حمل مقاومي'], w: 40, h: 90,
    info: ['Plain resistor. Set the value in properties. Use it to practise ohm and voltage-divider measurements.', 'مقاومة عادية. حدد قيمتها من الخصائص. استخدمها لتجارب الأوم والمقسم.'],
    pins: [pin('A', 'A', 20, 0, 'u'), pin('B', 'B', 20, 90, 'd')],
    props: [{ k: 'r', label: ['Resistance (Ω)', 'المقاومة (أوم)'], t: 'num', min: 0.1, max: 10000000, step: 1, def: 1000 }],
    faults: [['none', ['None', 'سليم']], ['open', ['Open (burnt)', 'مقطوعة (محروقة)']], ['drift', ['Value drifted x3', 'القيمة زادت 3 أضعاف']]],
    elements(p) { if (p.fault === 'open') return []; return [Z(P(p, 'A'), P(p, 'B'), (+p.props.r) * (p.fault === 'drift' ? 3 : 1), 0, { tag: 'r' })]; },
    draw(p) {
      const b = bands(+p.props.r);
      return `<line x1="20" y1="0" x2="20" y2="22" class="wl"/><line x1="20" y1="68" x2="20" y2="90" class="wl"/><rect x="10" y="22" width="20" height="46" rx="6" fill="#d9c9a3" stroke="#0e1626"/>` +
        b.map((c, i) => `<rect x="10" y="${28 + i * 9}" width="20" height="4" fill="${c}"/>`).join('') + `<text class="psub" x="38" y="50" text-anchor="start" font-size="9">${fmtR(+p.props.r)}</text>`;
    },
  };
  const LEDS = { red: [1.9, '#F55B41'], green: [2.1, '#91C361'], amber: [2.0, '#FDC300'], blue: [3.0, '#47BFD9'], white: [3.1, '#f2f2f2'], diode: [0.7, '#9aa5bd'] };
  D.DIO = {
    cat: 'load', prefix: 'D', name: ['LED / diode', 'LED / دايود'], w: 40, h: 80,
    info: ['LED or diode. Conducts from A (anode) to K (cathode) only. An LED needs a series resistor: without one it burns.', 'LED أو دايود. بيوصل من A (anode) إلى K (cathode) بس. الـLED لازم مقاومة على التوالي وإلا بيتحرق.'],
    pins: [pin('A', 'A', 20, 0, 'u'), pin('K', 'K', 20, 80, 'd')],
    props: [{ k: 'kind', label: ['Type', 'النوع'], t: 'sel', opts: [['red', 'LED red'], ['green', 'LED green'], ['amber', 'LED amber'], ['blue', 'LED blue'], ['white', 'LED white'], ['diode', 'Diode 1N4007']], def: 'red' }],
    faults: [['none', ['None', 'سليم']], ['open', ['Open', 'مقطوع']], ['shorted', ['Shorted', 'متقصر']]],
    electronic: true,
    init(p) { p.state = { b: 0 }; },
    elements(p) {
      if (p.state.burnt || p.fault === 'open') return [];
      if (p.fault === 'shorted') return [Z(P(p, 'A'), P(p, 'K'), 0.05, 0, { tag: 'd' })];
      return [{ kind: 'D', a: P(p, 'A'), b: P(p, 'K'), vf: LEDS[p.props.kind][0], rd: p.props.kind === 'diode' ? 0.1 : 3, tag: 'd' }];
    },
    update(p, sim, dt) {
      const r = EL.eRead(sim, p.id, 'd'), I = r.idc, led = p.props.kind !== 'diode';
      p.state.i = I; p.state.b = led ? Math.max(0, Math.min(1, I / 0.012)) : 0;
      const lim = led ? 0.06 : 1.5;
      if (I > lim) { p.state.stress = (p.state.stress || 0) + dt; if (p.state.stress > 0.3) { p.state.burnt = true; EL.emit('burn', p); } } else p.state.stress = 0;
    },
    draw(p) {
      const c = LEDS[p.props.kind][1], b = p.state.b, led = p.props.kind !== 'diode';
      return `<line x1="20" y1="0" x2="20" y2="24" class="wl"/><line x1="20" y1="56" x2="20" y2="80" class="wl"/>` + (led && b > 0.03 ? `<circle cx="20" cy="40" r="26" fill="${c}" opacity="${(b * 0.5).toFixed(2)}"/>` : '') +
        `<path d="M8 24 L32 24 L20 54 Z" fill="${led ? c : '#1a2238'}" opacity="${led ? 0.35 + 0.65 * b : 1}" stroke="#e8edf5" stroke-width="2"/><line x1="8" y1="54" x2="32" y2="54" stroke="#e8edf5" stroke-width="3"/>` + (p.state.burnt ? burntMark(30, 30) : '');
    },
  };
  D.POT = {
    cat: 'load', prefix: 'RV', name: ['Potentiometer', 'بوتنشيوميتر'], w: 80, h: 90,
    info: ['Potentiometer with ends 1 and 3 and wiper W. Use it with a 10 V reference to give 0-10 V to an inverter AI1. Click the knob to turn it up by 10 %.', 'بوتنشيوميتر أطرافه 1 و3 والمنزلق W. استخدمه مع 10 فولت عشان يدي 0-10 فولت للـAI1 في الانفرتر. اضغط على الأكرة تزود 10%.'],
    pins: [pin('1', '1', 20, 0, 'u'), pin('3', '3', 20, 90, 'd'), pin('W', 'W', 80, 45, 'r')],
    props: [{ k: 'r', label: ['Total (kΩ)', 'الإجمالي (كيلو أوم)'], t: 'sel', opts: [[1, '1 kΩ'], [5, '5 kΩ'], [10, '10 kΩ'], [100, '100 kΩ']], def: 10 }, { k: 'pos', label: ['Position (%)', 'الوضع (%)'], t: 'num', min: 0, max: 100, step: 1, def: 50 }],
    elements(p) { const R = p.props.r * 1000, x = Math.max(0.001, Math.min(0.999, p.props.pos / 100)); return [Z(P(p, '1'), P(p, 'W'), R * (1 - x), 0, { tag: 'a' }), Z(P(p, 'W'), P(p, '3'), R * x, 0, { tag: 'b' })]; },
    press(p, ev) { if (ev.type === 'down') { p.props.pos = (Math.round(p.props.pos / 10) * 10 + 10) % 110; if (p.props.pos > 100) p.props.pos = 0; } },
    draw(p) {
      const a = -135 + 2.7 * p.props.pos;
      return `<line x1="20" y1="0" x2="20" y2="20" class="wl"/><line x1="20" y1="70" x2="20" y2="90" class="wl"/><line x1="80" y1="45" x2="62" y2="45" class="wl"/>` +
        `<circle cx="38" cy="45" r="22" fill="#1a2238" stroke="#7b879f" stroke-width="2"/><line x1="38" y1="45" x2="38" y2="27" stroke="#FDC300" stroke-width="3" transform="rotate(${a} 38 45)"/>` + T(38, 84, p.props.pos + '%', 'psub');
    },
  };

  /* ---------------- field instruments ---------------- */
  D.TX = {
    cat: 'field', prefix: 'B', name: ['2-wire transmitter 4-20 mA', 'ترانسميتر 2 سلك 4-20 ملي'], w: 90, h: 110,
    info: ['Loop-powered pressure transmitter. Needs at least 10.5 V across its terminals. It sets the loop current: 4 mA at 0 % and 20 mA at 100 %. Set the process value in properties.', 'ترانسميتر ضغط بيشتغل من اللوب نفسه. محتاج 10.5 فولت على أطرافه على الأقل. بيظبط تيار اللوب: 4 ملي عند 0% و20 ملي عند 100%. غيّر قيمة العملية من الخصائص.'],
    pins: [pin('pos', '+', 45, 0, 'u'), pin('neg', '−', 45, 110, 'd')],
    props: [{ k: 'proc', label: ['Process value (%)', 'قيمة العملية (%)'], t: 'num', min: 0, max: 100, step: 1, def: 50 }],
    faults: [['none', ['None', 'سليم']], ['dead', ['Dead (0 mA)', 'ميت (0 ملي)']], ['low', ['Stuck at 3.8 mA', 'ثابت على 3.8 ملي']], ['high', ['Stuck at 21.5 mA', 'ثابت على 21.5 ملي']]],
    electronic: true,
    elements(p, ctx) {
      if (ctx.dead) return [];
      let mA = 4 + 16 * p.props.proc / 100;
      if (p.fault === 'dead') mA = 0; if (p.fault === 'low') mA = 3.8; if (p.fault === 'high') mA = 21.5;
      return [IS(P(p, 'pos'), P(p, 'neg'), mA / 1000, { vmin: 10.5, tag: 'tx' })];
    },
    update(p, sim) { const r = EL.eRead(sim, p.id, 'tx'); p.state.mA = Math.abs(r.idc) * 1000; p.state.v = Math.abs(r.vdc); },
    draw(p) {
      return `<line x1="45" y1="0" x2="45" y2="18" class="wl"/><line x1="45" y1="92" x2="45" y2="110" class="wl"/><rect x="14" y="18" width="62" height="74" rx="8" fill="#1a2238" stroke="#7b879f" stroke-width="2"/>` +
        `<rect x="22" y="26" width="46" height="22" rx="3" class="lcd"/><text class="lcdt" x="45" y="42" text-anchor="middle" font-size="13">${(p.state.mA || 0).toFixed(2)}</text>` + T(45, 62, 'mA', 'psub') + T(45, 80, p.props.proc + ' %', 'pbtn');
    },
  };
  D.AI250 = {
    cat: 'field', prefix: 'A', name: ['PLC analog input (250 Ω)', 'مدخل أنالوج PLC (250 أوم)'], w: 100, h: 100,
    info: ['PLC analog input card, 4-20 mA with a 250 Ω shunt (1-5 V). It shows the loop current, and flags a wire break below 3.6 mA.', 'كارت مدخل أنالوج PLC بمقاومة 250 أوم (1-5 فولت). بيعرض تيار اللوب وبينبه على قطع السلك تحت 3.6 ملي.'],
    pins: [pin('pos', 'AI+', 50, 0, 'u'), pin('neg', 'AI-', 50, 100, 'd')],
    props: [], electronic: true,
    elements(p) { return [Z(P(p, 'pos'), P(p, 'neg'), 250, 0, { tag: 'z' })]; },
    update(p, sim) { const r = EL.eRead(sim, p.id, 'z'); p.state.mA = r.idc * 1000; },
    draw(p) {
      const mA = p.state.mA || 0, pc = (mA - 4) / 16 * 100;
      const msg = mA < -0.5 ? 'REVERSED' : mA < 3.6 ? 'WIRE BREAK' : mA > 21 ? 'OVER RANGE' : pc.toFixed(1) + ' %';
      return `<line x1="50" y1="0" x2="50" y2="16" class="wl"/><line x1="50" y1="84" x2="50" y2="100" class="wl"/><rect x="8" y="16" width="84" height="68" rx="6" fill="#1a2238" stroke="#7b879f" stroke-width="2"/>` +
        `<rect x="14" y="22" width="72" height="26" rx="3" class="lcd"/><text class="lcdt" x="50" y="40" text-anchor="middle" font-size="14">${mA.toFixed(2)} mA</text>` + T(50, 66, msg, 'pbtn') + T(50, 78, 'AI 4-20 mA', 'psub');
    },
  };
  D.PROX = {
    cat: 'field', prefix: 'B', name: ['Proximity sensor (3-wire)', 'بروكسيميتي سنسور (3 سلك)'], w: 90, h: 120,
    info: ['Inductive 3-wire sensor. BN brown = +24 V, BU blue = 0 V, BK black = output. PNP switches +24 V to the output, NPN switches 0 V. Click the sensor to bring a metal target near.', 'سنسور حثي 3 سلك. البني BN = +24 فولت والأزرق BU = 0 والأسود BK = الخرج. PNP بيطلّع +24 على الخرج وNPN بيطلّع 0. اضغط عليه عشان تقرّب معدن منه.'],
    pins: [pin('BN', 'BN', 15, 120, 'd'), pin('BK', 'BK', 45, 120, 'd'), pin('BU', 'BU', 75, 120, 'd')],
    props: [{ k: 'out', label: ['Output type', 'نوع الخرج'], t: 'sel', opts: [['PNP', 'PNP'], ['NPN', 'NPN']], def: 'PNP' }, { k: 'logic', label: ['Contact', 'الكونتاكت'], t: 'sel', opts: [['NO', 'NO'], ['NC', 'NC']], def: 'NO' }],
    faults: [['none', ['None', 'سليم']], ['dead', ['Dead', 'ميت']]],
    electronic: true,
    init(p) { p.state = { target: false, active: false, sup: false }; },
    elements(p, ctx) {
      const out = [Z(P(p, 'BN'), P(p, 'BU'), 4700, 0, { tag: 'sup', noAC: true })];
      if (p.state.active && !ctx.dead) out.push(p.props.out === 'PNP' ? Z(P(p, 'BN'), P(p, 'BK'), 60, 0, { tag: 'o' }) : Z(P(p, 'BK'), P(p, 'BU'), 60, 0, { tag: 'o' }));
      return out;
    },
    update(p, sim, dt) {
      const st = p.state, v = sim.vdc(P(p, 'BN'), P(p, 'BU'));
      st.sup = p.fault !== 'dead' && v >= 10 && v <= 30;
      const o = EL.eRead(sim, p.id, 'o');
      if (st.active && Math.abs(o.idc) > 0.3) { st.scT = 2; }
      if (st.scT > 0) { st.scT -= dt; st.active = false; return; }
      st.active = st.sup && (st.target !== (p.props.logic === 'NC'));
    },
    press(p, ev) { if (ev.type === 'down') { p.state.target = !p.state.target; EL.emit('click', p); } },
    draw(p) {
      const st = p.state;
      let r = `<line x1="15" y1="120" x2="15" y2="96" stroke="#8a5a2b" stroke-width="3"/><line x1="45" y1="120" x2="45" y2="96" stroke="#222" stroke-width="3"/><line x1="75" y1="120" x2="75" y2="96" stroke="#47BFD9" stroke-width="3"/>`;
      r += `<rect x="12" y="24" width="66" height="72" rx="6" fill="#2a3552" stroke="#7b879f" stroke-width="2"/><rect x="12" y="8" width="66" height="16" rx="3" fill="#47BFD9" opacity=".35" stroke="#7b879f"/>`;
      r += `<circle cx="45" cy="58" r="9" fill="${st.active ? '#FDC300' : '#1a2238'}" stroke="#0e1626"/>` + T(45, 90, p.props.out + ' ' + p.props.logic, 'psub');
      if (st.target) r += `<rect x="20" y="-10" width="50" height="12" fill="#c9ccd6" stroke="#0e1626"/>`;
      return r;
    },
  };
  D.PLCDI = {
    cat: 'field', prefix: 'A', name: ['PLC digital input (24 V)', 'مدخل ديجيتال PLC (24 فولت)'], w: 90, h: 100,
    info: ['PLC digital input, sinking or sourcing depending on how you wire the common. Needs 15 V or more on I0 relative to 0V to read ON.', 'مدخل ديجيتال PLC. محتاج 15 فولت أو أكتر على I0 بالنسبة لـ0V عشان يقرا ON.'],
    pins: [pin('I0', 'I0', 45, 0, 'u'), pin('M', '0V', 45, 100, 'd')],
    props: [], electronic: true, init(p) { p.state = { on: false }; },
    elements(p) { return [Z(P(p, 'I0'), P(p, 'M'), 3500, 0, { tag: 'in', noAC: true })]; },
    update(p, sim) { const v = sim.vdc(P(p, 'I0'), P(p, 'M')); p.state.v = v; p.state.on = v >= 15; },
    draw(p) {
      const on = p.state.on;
      return `<line x1="45" y1="0" x2="45" y2="14" class="wl"/><line x1="45" y1="86" x2="45" y2="100" class="wl"/><rect x="10" y="14" width="70" height="72" rx="6" fill="#1a2238" stroke="#7b879f" stroke-width="2"/>` +
        `<circle cx="45" cy="40" r="11" fill="${on ? '#91C361' : '#2a3552'}" stroke="#0e1626"/>` + T(45, 66, 'DI 0 = ' + (on ? '1' : '0'), 'pbtn') + T(45, 78, (p.state.v || 0).toFixed(1) + ' V', 'psub');
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
