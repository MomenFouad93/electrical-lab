/* Parts D: wiring and terminals, cables, house wiring, extra classic control devices, extra loads, drawing helpers */
(function (g) {
  const EL = g.EL;
  const { P, INT, Z, VS, IS } = EL;
  const RC = EL.R_CLOSED;
  const D = EL.defs;
  const T = EL.T, body = EL.body, pin = EL.mkpin;
  const F0 = ['none', ['None', 'سليم']];
  const wl = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="wl"/>`;
  const smoke = (x, y) => `<g class="smoke"><circle cx="${x}" cy="${y}" r="5" fill="#222" opacity=".8"/><circle cx="${x + 6}" cy="${y - 6}" r="4" fill="#444" opacity=".7"/></g>`;
  const fmtV = (s) => String(s).replace('VAC', 'V~').replace('VDC', 'V=');
  const VOLTS = [['24VDC', '24 V DC'], ['24VAC', '24 V AC'], ['230VAC', '230 V AC']];

  /* ================= TERMINALS ================= */
  function termStrip(n, nm) {
    const w = 28 * n + 24, h = 70, pins = [];
    for (let i = 1; i <= n; i++) pins.push(pin('t' + i, '' + i, 28 * i - 4, 0, 'u'), pin('b' + i, '' + i, 28 * i - 4, h, 'd'));
    const faults = [F0];
    for (let i = 1; i <= n; i++) faults.push(['open_' + i, ['Terminal ' + i + ' loose (open)', 'ترمينال ' + i + ' سايب (مفتوح)']]);
    return {
      cat: 'wiring', prefix: 'X', name: nm, w, h, pcb: true,
      info: ['DIN-rail feed-through terminal strip. Each number joins the top and the bottom screw. Use it to number and organise field wiring. A loose screw is a classic fault: set it in Fault simulation.', 'صف ترمينالات على DIN rail. كل رقم بيوصل الفيشة اللي فوق باللي تحت. بيستخدم لترقيم وتنظيم أسلاك الحقل. المسمار السايب عطل مشهور: اختاره من محاكاة العطل.'],
      pins, props: [], faults,
      diag: { kind: 'wire' },
      ties(p) { const out = []; for (let i = 1; i <= n; i++) if (p.fault !== 'open_' + i) out.push(['t' + i, 'b' + i]); return out; },
      elements() { return []; },
      draw(p) {
        let r = `<rect x="0" y="22" width="${w}" height="26" rx="3" fill="#2a3552" stroke="#0e1626"/>`;
        for (let i = 1; i <= n; i++) {
          const x = 12 + 28 * (i - 1), bad = p.fault === 'open_' + i;
          r += `<rect x="${x}" y="8" width="24" height="54" rx="3" fill="${bad ? '#6b2b22' : '#c9ccd6'}" stroke="#0e1626"/><circle cx="${x + 12}" cy="22" r="5" fill="#8a93a6" stroke="#0e1626"/><circle cx="${x + 12}" cy="48" r="5" fill="#8a93a6" stroke="#0e1626"/>` + wl(x + 12, 0, x + 12, 8) + wl(x + 12, 62, x + 12, h) + T(x + 12, 39, '' + i, 'psub');
        }
        return r;
      },
    };
  }
  D.TERM1 = termStrip(1, ['Terminal block (1 way)', 'ترمينال (مكان واحد)']);
  D.TERM4 = termStrip(4, ['Terminal strip 4 way', 'صف ترمينال 4 أماكن']);
  D.TERM8 = termStrip(8, ['Terminal strip 8 way', 'صف ترمينال 8 أماكن']);
  D.TERM12 = termStrip(12, ['Terminal strip 12 way', 'صف ترمينال 12 مكان']);

  D.TERMPE = {
    cat: 'wiring', prefix: 'PE', name: ['PE terminal (earth)', 'ترمينال أرضي PE'], w: 60, h: 70, pcb: true,
    info: ['Green and yellow protective-earth terminal. Both screws are earth. Join every metal enclosure and motor frame to it.', 'ترمينال أرضي أخضر وأصفر. المسمارين أرضي. وصّل بيه كل هيكل معدن وبدن موتور.'],
    pins: [pin('p1', 'PE', 30, 0, 'u', { earth: true, role: 'PE' }), pin('p2', 'PE', 30, 70, 'd', { earth: true, role: 'PE' })], props: [], faults: [F0],
    diag: { kind: 'wire' },
    draw() { return wl(30, 0, 30, 10) + wl(30, 60, 30, 70) + `<rect x="10" y="10" width="40" height="50" rx="4" fill="#FDC300" stroke="#0e1626"/><rect x="10" y="35" width="40" height="25" rx="0" fill="#2f7d3f"/><path d="M10 35 h40" stroke="#0e1626"/>` + T(30, 48, 'PE', 'pbtn'); },
  };
  D.JBOX = {
    cat: 'wiring', prefix: 'JB', name: ['Junction box (6 way)', 'علبة توصيل (6 أطراف)'], w: 140, h: 76, pcb: true,
    info: ['Junction box. All six terminals are one point. Use it to split or join a cable, or as a common point.', 'علبة توصيل. الستة أطراف نقطة واحدة. بتستخدم لتفريع أو توصيل كابل أو كنقطة مشتركة.'],
    pins: [pin('a1', '', 30, 0, 'u'), pin('a2', '', 70, 0, 'u'), pin('a3', '', 110, 0, 'u'), pin('b1', '', 30, 76, 'd'), pin('b2', '', 70, 76, 'd'), pin('b3', '', 110, 76, 'd')],
    props: [], faults: [F0, ['open_a', ['Top-left terminal loose', 'الطرف العلوي الشمال سايب']]],
    diag: { kind: 'wire' },
    ties(p) { return [['a1', 'a2', 'a3', 'b1', 'b2', 'b3'].filter((x) => !(p.fault === 'open_a' && x === 'a1'))]; },
    draw() { return `<rect x="8" y="12" width="124" height="52" rx="8" fill="#c9ccd6" stroke="#0e1626" stroke-width="2"/><path d="M30 12 V34 H110 V12 M30 64 V42 H110 V64" fill="none" stroke="#7b879f" stroke-width="3"/>` + [30, 70, 110].map((x) => wl(x, 0, x, 12) + wl(x, 64, x, 76) + `<circle cx="${x}" cy="12" r="4" fill="#8a93a6"/><circle cx="${x}" cy="64" r="4" fill="#8a93a6"/>`).join('') + T(70, 42, 'JB', 'psub'); },
  };
  D.LUG = {
    cat: 'wiring', prefix: 'LG', name: ['Cable lug / ferrule', 'ودنة كابل (lug / ferrule)'], w: 40, h: 90,
    info: ['A crimped end on a conductor: ring lug, fork lug, pin or ferrule. A bad crimp or a loose screw makes heat. Faults: open crimp, or high resistance (hot).', 'نهاية مضغوطة على الموصل: ring lug أو fork أو pin أو ferrule. الكبس السيئ أو المسمار السايب بيسخّن. الأعطال: كبس مقطوع، أو مقاومة عالية (سخونة).'],
    pins: [pin('c', 'wire', 20, 0, 'u'), pin('s', 'screw', 20, 90, 'd')],
    props: [{ k: 'kind', label: ['Type', 'النوع'], t: 'sel', opts: [['ring', 'Ring lug'], ['fork', 'Fork lug'], ['pin', 'Pin lug'], ['ferrule', 'Ferrule (bootlace)']], def: 'ring' }, { k: 'sec', label: ['Cable size (mm²)', 'مقطع الكابل (مم²)'], t: 'sel', opts: [[0.5, '0.5'], [1, '1'], [1.5, '1.5'], [2.5, '2.5'], [4, '4'], [6, '6'], [10, '10'], [16, '16']], def: 2.5 }],
    faults: [F0, ['open', ['Crimp open (wire pulled out)', 'الكبس مقطوع (السلك طلع)']], ['hot', ['High resistance (loose / oxidised)', 'مقاومة عالية (سايب / أكسدة)']]],
    diag: { kind: 'wire' },
    ties(p) { return p.fault === 'none' ? [['c', 's']] : []; },
    elements(p) { return p.fault === 'hot' ? [Z(P(p, 'c'), P(p, 's'), 6, 0, { tag: 'h' })] : []; },
    update(p, sim, dt) { if (p.fault === 'hot') { const r = EL.eRead(sim, p.id, 'h'); const i = Math.max(r.idc < 0 ? -r.idc : r.idc, r.iac); p.state.amps = i; p.state.temp = 25 + i * i * 6 * 0.9; } else { p.state.amps = 0; p.state.temp = 25; } },
    draw(p) {
      const k = p.props.kind, hot = p.fault === 'hot', open = p.fault === 'open';
      let r = wl(20, 0, 20, 24) + wl(20, 66, 20, 90);
      const col = hot ? '#d9532b' : '#c78b4b';
      if (k === 'ring') r += `<rect x="14" y="24" width="12" height="22" fill="${col}" stroke="#0e1626"/><circle cx="20" cy="56" r="10" fill="none" stroke="${col}" stroke-width="6"/>`;
      else if (k === 'fork') r += `<rect x="14" y="24" width="12" height="22" fill="${col}" stroke="#0e1626"/><path d="M12 66 V50 h6 v12 h4 V50 h6 v16 z" fill="${col}" stroke="#0e1626"/>`;
      else if (k === 'pin') r += `<rect x="14" y="24" width="12" height="22" fill="${col}" stroke="#0e1626"/><rect x="18" y="46" width="4" height="22" fill="#c9ccd6" stroke="#0e1626"/>`;
      else r += `<rect x="15" y="24" width="10" height="42" fill="#d6d6d6" stroke="#0e1626"/><rect x="15" y="24" width="10" height="16" fill="#47BFD9" stroke="#0e1626"/>`;
      if (open) r += `<path d="M10 40 L30 52" stroke="#F55B41" stroke-width="3"/>`;
      if (hot && (p.state.amps || 0) > 1) r += `<circle cx="20" cy="45" r="16" fill="#F55B41" opacity="${Math.min(0.6, (p.state.amps || 0) / 40).toFixed(2)}"/>`;
      return r + T(34, 8, p.props.sec, 'psub', 'start');
    },
  };

  /* ================= CABLES ================= */
  const CORE_COL = { BN: '#8a5a2b', BU: '#2a8bd6', BK: '#1a1a1a', GY: '#9aa0ab', GNYE: 'url(#pegy)', WH: '#f2f2f2', RD: '#d9372b', OR: '#e8830c', YE: '#ecd400', GN: '#2f9c4a', VT: '#8b3ac9' };
  const SECS = [[0.5, '0.5'], [0.75, '0.75'], [1, '1'], [1.5, '1.5'], [2.5, '2.5'], [4, '4'], [6, '6'], [10, '10'], [16, '16'], [25, '25'], [35, '35']];
  const AMPACITY = { 0.5: 6, 0.75: 9, 1: 12, 1.5: 18, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 101, 35: 125 }; // IEC 60364 method C, PVC, 3 loaded cores (rounded)
  EL.AMPACITY = AMPACITY;
  function cable(id, nm, names, cols, std, info) {
    const n = names.length, w = 34 * n + 16, h = 140;
    const faults = [F0];
    for (let i = 1; i <= n; i++) faults.push(['open_' + i, ['Core ' + names[i - 1] + ' broken', 'الكور ' + names[i - 1] + ' مقطوع']]);
    if (n >= 2) faults.push(['short_12', ['Cores ' + names[0] + ' and ' + names[1] + ' touching', 'الكورين ' + names[0] + ' و' + names[1] + ' لامسين بعض']]);
    if (n >= 3) faults.push(['leak', ['Insulation leak ' + names[0] + ' to ' + names[n - 1], 'تسريب عزل بين ' + names[0] + ' و' + names[n - 1]]]);
    const pins = [];
    for (let i = 0; i < n; i++) pins.push(pin('a' + (i + 1), names[i], 24 + 34 * i, 0, 'u'), pin('b' + (i + 1), names[i], 24 + 34 * i, h, 'd'));
    return {
      cat: 'wiring', prefix: 'W', name: nm, w, h, pcb: id === 'CAB2', info, pins,
      props: [{ k: 'sec', label: ['Core size (mm²)', 'مقطع الكور (مم²)'], t: 'sel', opts: SECS, def: std.sec }, { k: 'len', label: ['Length (m)', 'الطول (متر)'], t: 'num', min: 1, max: 500, step: 1, def: std.len }],
      faults, diag: { kind: 'cable', n },
      elements(p) {
        const R = Math.max(0.001, (0.0175 * +p.props.len) / +p.props.sec), out = [];
        for (let i = 1; i <= n; i++) if (p.fault !== 'open_' + i) out.push(Z(P(p, 'a' + i), P(p, 'b' + i), R, 0, { tag: 'c' + i }));
        if (p.fault === 'short_12') out.push(Z(P(p, 'a1'), P(p, 'a2'), 0.05, 0, { tag: 'sh' }));
        if (p.fault === 'leak') out.push(Z(P(p, 'a1'), P(p, 'a' + n), 6000, 0, { tag: 'lk' }));
        return out;
      },
      update(p, sim) {
        let m = 0;
        for (let i = 1; i <= n; i++) { const e = sim.e(p.id, 'c' + i); if (e) { const r = e.r_; m = Math.max(m, Math.abs(r.idc), EL.cabs(r.iac)); } }
        p.state.amps = m; p.state.amp = AMPACITY[+p.props.sec] || 10;
      },
      draw(p) {
        const over = (p.state.amps || 0) > (AMPACITY[+p.props.sec] || 10);
        let r = `<rect x="6" y="34" width="${w - 12}" height="72" rx="10" fill="${over ? '#5b2a22' : '#232b3d'}" stroke="${over ? '#F55B41' : '#4a5672'}" stroke-width="2"/>`;
        for (let i = 0; i < n; i++) {
          const x = 24 + 34 * i, c = cols[i], bad = p.fault === 'open_' + (i + 1);
          r += `<line x1="${x}" y1="0" x2="${x}" y2="40" stroke="${CORE_COL[c]}" stroke-width="6"/><line x1="${x}" y1="100" x2="${x}" y2="${h}" stroke="${CORE_COL[c]}" stroke-width="6"/>` + (c === 'GNYE' ? `<line x1="${x}" y1="0" x2="${x}" y2="40" stroke="#2f7d3f" stroke-width="3" stroke-dasharray="5 5"/><line x1="${x}" y1="100" x2="${x}" y2="${h}" stroke="#2f7d3f" stroke-width="3" stroke-dasharray="5 5"/>` : '') +
            (bad ? `<path d="M${x - 9} 62 L${x + 9} 78" stroke="#F55B41" stroke-width="3"/>` : `<line x1="${x}" y1="44" x2="${x}" y2="96" stroke="${CORE_COL[c]}" stroke-width="3" opacity=".5"/>`);
        }
        r += T(w / 2, 70, (names.length > 6 ? n + 'x' : n + 'G') + p.props.sec, 'pbtn') + T(w / 2, 86, p.props.len + ' m', 'psub');
        if (over) r += T(w / 2, 120, 'OVERLOAD', 'psub');
        return r;
      },
    };
  }
  D.CAB2 = cable('CAB2', ['Cable 2-core (DC / control)', 'كابل 2 كور (DC / كنترول)'], ['+', '0V'], ['BN', 'BU'], { sec: 1.5, len: 10 }, ['2-core cable. Core resistance is real: a long thin cable drops voltage. Faults: broken core, cores touching.', 'كابل 2 كور. مقاومة الكور حقيقية: الكابل الطويل الرفيع بيعمل هبوط جهد. الأعطال: كور مقطوع، أو كورين لامسين بعض.']);
  D.CAB3 = cable('CAB3', ['Cable 3-core (L N PE)', 'كابل 3 كور (L N PE)'], ['L', 'N', 'PE'], ['BN', 'BU', 'GNYE'], { sec: 2.5, len: 10 }, ['3-core single-phase cable: brown L, blue N, green-yellow PE. Check size against the breaker: 1.5 mm² 16 A, 2.5 mm² 24 A (method C, rounded).', 'كابل 3 كور فاز واحد: بني L وأزرق N وأخضر-أصفر PE. راجع المقطع مع البريكر: 1.5 مم² تحمل 18 أمبير تقريبا و2.5 مم² تحمل 24.']);
  D.CAB4 = cable('CAB4', ['Cable 4-core (3-phase + PE)', 'كابل 4 كور (3 فاز + PE)'], ['L1', 'L2', 'L3', 'PE'], ['BN', 'BK', 'GY', 'GNYE'], { sec: 2.5, len: 10 }, ['4-core motor cable: L1 brown, L2 black, L3 grey, PE green-yellow.', 'كابل موتور 4 كور: L1 بني وL2 أسود وL3 رمادي وPE أخضر-أصفر.']);
  D.CAB5 = cable('CAB5', ['Cable 5-core (3-phase + N + PE)', 'كابل 5 كور (3 فاز + N + PE)'], ['L1', 'L2', 'L3', 'N', 'PE'], ['BN', 'BK', 'GY', 'BU', 'GNYE'], { sec: 4, len: 10 }, ['5-core cable: L1 L2 L3 N PE. Common for a panel feeder.', 'كابل 5 كور: L1 L2 L3 N PE. شائع كمغذي للوحة.']);
  D.CAB7 = cable('CAB7', ['Control cable 7-core (numbered)', 'كابل كنترول 7 كور (مرقم)'], ['1', '2', '3', '4', '5', '6', '7'], ['WH', 'BK', 'RD', 'OR', 'YE', 'GN', 'VT'], { sec: 1, len: 20 }, ['Numbered control cable. Cores are identified by number, not colour. Always ring out the cores before landing them.', 'كابل كنترول مرقم. الكورات بتتميّز بالرقم مش باللون. اعمل ring out للكورات قبل ما توصلها.']);
  D.CAB7.w = 34 * 7 + 16;

  /* ================= HOUSE WIRING ================= */
  D.SOCK = {
    cat: 'wiring', prefix: 'XS', name: ['Wall socket 230 V with appliance', 'بريزة 230 فولت مع جهاز'], w: 90, h: 120,
    info: ['Socket outlet. Wire L, N and PE to its terminals. Choose the appliance plugged in. A faulty appliance can leak current to earth: test an RCD with it.', 'بريزة. وصّل L وN وPE على أطرافها. اختار الجهاز المركّب فيها. الجهاز التالف ممكن يسرّب تيار للأرضي: جرّب بيه الـRCD.'],
    pins: [pin('L', 'L', 20, 0, 'u', { role: 'L1' }), pin('N', 'N', 45, 0, 'u', { role: 'N' }), pin('PE', 'PE', 70, 0, 'u', { role: 'PE' })],
    props: [{ k: 'w', label: ['Appliance (W)', 'الجهاز (وات)'], t: 'sel', opts: [[0, 'Nothing plugged'], [60, '60 W lamp'], [500, '500 W'], [1000, '1000 W heater'], [2000, '2000 W kettle'], [3000, '3000 W oven']], def: 0 }],
    faults: [F0, ['leak', ['Appliance leaks to earth (about 50 mA)', 'الجهاز بيسرّب للأرضي (حوالي 50 ملي)']], ['short', ['Appliance short circuit', 'الجهاز فيه ماس']]],
    diag: { kind: 'load', feed: ['L', 'N'], volt: () => 230, active: (p) => (p.state.amps || 0) > 0.05 },
    init(p) { p.state = { amps: 0 }; },
    elements(p) {
      const out = [];
      if (+p.props.w > 0 && p.fault !== 'short') out.push(Z(P(p, 'L'), P(p, 'N'), (230 * 230) / +p.props.w, 0, { tag: 'a' }));
      if (p.fault === 'short') out.push(Z(P(p, 'L'), P(p, 'N'), 0.08, 0, { tag: 'a' }));
      if (p.fault === 'leak') out.push(Z(P(p, 'L'), P(p, 'PE'), 4600, 0, { tag: 'lk' }));
      return out;
    },
    update(p, sim) { const e = sim.e(p.id, 'a'); p.state.amps = e ? EL.cabs(e.r_.iac) : 0; const v = e ? EL.cabs(e.r_.vac) : 0; p.state.v = v; },
    draw(p) {
      const on = (p.state.amps || 0) > 0.05;
      return wl(20, 0, 20, 20) + wl(45, 0, 45, 20) + wl(70, 0, 70, 20) + `<rect x="6" y="20" width="78" height="86" rx="10" fill="#e8e8ea" stroke="#0e1626" stroke-width="2"/><circle cx="45" cy="63" r="28" fill="#d4d4d8" stroke="#8a93a6" stroke-width="2"/><circle cx="34" cy="63" r="5" fill="#2a2a2e"/><circle cx="56" cy="63" r="5" fill="#2a2a2e"/><rect x="42" y="38" width="6" height="6" fill="#8a93a6"/><rect x="42" y="82" width="6" height="6" fill="#8a93a6"/>` +
        (on ? `<circle cx="45" cy="63" r="30" fill="#91C361" opacity=".18"/>` : '') + T(45, 116, +p.props.w ? p.props.w + ' W' : 'empty', 'psub');
    },
  };
  D.LAMPH = {
    cat: 'wiring', prefix: 'EL', name: ['Lampholder with ceiling rose', 'سوكت لمبة (روزيتة سقف)'], w: 80, h: 110,
    info: ['Ceiling rose with a lamp. L is the switched live, N is neutral, PE is the earth. Lights at about 230 V.', 'روزيتة سقف بلمبة. L هو الفاز بعد المفتاح وN هو النيوترال وPE الأرضي. بتنور على 230 فولت تقريبا.'],
    pins: [pin('L', 'L', 15, 0, 'u', { role: 'L1' }), pin('N', 'N', 40, 0, 'u', { role: 'N' }), pin('PE', 'PE', 65, 0, 'u', { role: 'PE' })],
    props: [{ k: 'w', label: ['Lamp (W)', 'اللمبة (وات)'], t: 'sel', opts: [[5, '5 W LED'], [9, '9 W LED'], [18, '18 W'], [40, '40 W'], [60, '60 W'], [100, '100 W']], def: 9 }],
    faults: [F0, ['blown', ['Lamp blown', 'اللمبة محروقة']], ['leak', ['Leak to earth', 'تسريب للأرضي']]],
    diag: { kind: 'load', feed: ['L', 'N'], volt: () => 230, active: (p) => (p.state.b || 0) > 0.3 },
    init(p) { p.state = { b: 0 }; },
    elements(p) {
      const out = [];
      if (!p.state.burnt && p.fault !== 'blown') out.push(Z(P(p, 'L'), P(p, 'N'), (230 * 230) / +p.props.w, 0, { tag: 'l' }));
      if (p.fault === 'leak') out.push(Z(P(p, 'L'), P(p, 'PE'), 4600, 0, { tag: 'lk' }));
      return out;
    },
    update(p, sim, dt) {
      const e = sim.e(p.id, 'l'), v = e ? EL.cabs(e.r_.vac) : 0;
      p.state.b = Math.max(0, Math.min(1, (v / 230 - 0.4) / 0.5)); p.state.v = v;
      if (v > 310) { p.state.stress = (p.state.stress || 0) + dt; if (p.state.stress > 0.5) { p.state.burnt = true; EL.emit('burn', p); } } else p.state.stress = 0;
    },
    draw(p) {
      const b = p.state.b, bu = p.state.burnt || p.fault === 'blown';
      return wl(15, 0, 15, 14) + wl(40, 0, 40, 14) + wl(65, 0, 65, 14) + `<ellipse cx="40" cy="22" rx="30" ry="9" fill="#e8e8ea" stroke="#0e1626"/>` +
        (b > 0.05 ? `<circle cx="40" cy="72" r="34" fill="#FDC300" opacity="${(b * 0.4).toFixed(2)}"/>` : '') + `<rect x="34" y="30" width="12" height="14" fill="#9aa0ab" stroke="#0e1626"/><path d="M40 44 C14 52 20 100 40 100 C60 100 66 52 40 44 Z" fill="${bu ? '#222' : '#FDC300'}" opacity="${bu ? 1 : (0.25 + 0.75 * b).toFixed(2)}" stroke="#0e1626" stroke-width="2"/>` + (bu ? `<path d="M30 70 L40 85 L50 70" fill="none" stroke="#777"/>` : '');
    },
  };
  function wallSwitch(id, nm, pins, pos2, info) {
    return {
      cat: 'wiring', prefix: 'SW', name: nm, w: 70, h: 90, info, pins,
      props: [], faults: [F0, ['open', ['Contacts burnt (never connect)', 'الكونتاكتات محروقة (مش بتوصل)']]],
      diag: { kind: 'switch' }, op: ['pos'],
      init(p) { p.state = { pos: 1 }; },
      elements(p) { if (p.fault === 'open') return []; const pr = pos2(p.state.pos); return pr.map(([a, b], i) => Z(P(p, a), P(p, b), RC, 0, { tag: 'k' + i })); },
      press(p, ev) { if (ev.type === 'down') { p.state.pos = p.state.pos === 1 ? 2 : 1; EL.emit('click', p); } },
      draw(p) {
        const up = p.state.pos === 2;
        let r = pins.map((q) => wl(q.x, q.y, q.x, q.y === 0 ? 18 : 72)).join('');
        r += `<rect x="8" y="18" width="54" height="54" rx="6" fill="#e8e8ea" stroke="#0e1626" stroke-width="2"/><rect x="20" y="28" width="30" height="34" rx="4" fill="#cfcfd4" stroke="#8a93a6"/><rect x="20" y="${up ? 28 : 45}" width="30" height="17" rx="3" fill="#fff" stroke="#8a93a6"/>`;
        return r + T(35, 84, id === 'WSW1' ? '1-way' : id === 'WSW2' ? '2-way' : 'inter.', 'psub');
      },
    };
  }
  D.WSW1 = wallSwitch('WSW1', ['Wall switch 1-way', 'مفتاح حيط (اتجاه واحد)'], [pin('C', 'C', 20, 0, 'u'), pin('L1', 'L1', 20, 90, 'd')], (pos) => (pos === 2 ? [['C', 'L1']] : []), ['One-way wall switch. Click to flip. It makes the C to L1 contact when up.', 'مفتاح حيط اتجاه واحد. اضغط تقلبه. بيوصل C بـL1 وهو فوق.']);
  D.WSW2 = wallSwitch('WSW2', ['Wall switch 2-way', 'مفتاح سلم (اتجاهين)'], [pin('C', 'C', 14, 0, 'u'), pin('L1', 'L1', 14, 90, 'd'), pin('L2', 'L2', 56, 90, 'd')], (pos) => (pos === 2 ? [['C', 'L2']] : [['C', 'L1']]), ['Two-way switch for staircase wiring. Common C goes to L1 or L2. Two of them control one lamp from two places.', 'مفتاح اتجاهين للسلم. الـC بيروح لـL1 أو L2. اتنين منهم بيتحكموا في لمبة من مكانين.']);
  D.WSWX = wallSwitch('WSWX', ['Intermediate switch (cross)', 'مفتاح وسط (cross)'], [pin('a1', 'a1', 14, 0, 'u'), pin('a2', 'a2', 56, 0, 'u'), pin('b1', 'b1', 14, 90, 'd'), pin('b2', 'b2', 56, 90, 'd')], (pos) => (pos === 2 ? [['a1', 'b2'], ['a2', 'b1']] : [['a1', 'b1'], ['a2', 'b2']]), ['Intermediate switch. Straight or crossed connection. Put it between two 2-way switches to control a lamp from three places.', 'مفتاح وسط. توصيل مستقيم أو متقاطع. حطه بين مفتاحين اتجاهين عشان تتحكم في لمبة من 3 أماكن.']);

  D.RCD2 = {
    cat: 'protect', prefix: 'FI', name: ['RCD / ELCB 2-pole', 'قاطع تسريب RCD (2 بول)'], w: 100, h: 120,
    info: ['Residual current device. It trips when the current in L and N differs by more than its sensitivity: that current is leaking to earth (a person or a faulty appliance). 30 mA protects people. Press the T button to test.', 'قاطع تسريب. بيفصل لما تيار L يختلف عن تيار N بأكتر من حساسيته: يعني فيه تيار بيسرّب للأرضي (إنسان أو جهاز تالف). 30 ملي بيحمي الأشخاص. اضغط زرار T للاختبار.'],
    pins: [pin('L1', 'L', 25, 0, 'u', { role: 'L1' }), pin('N1', 'N', 65, 0, 'u', { role: 'N' }), pin('L2', 'L', 25, 120, 'd', { role: 'L1' }), pin('N2', 'N', 65, 120, 'd', { role: 'N' })],
    props: [{ k: 'rating', label: ['Rating (A)', 'التيار (أمبير)'], t: 'sel', opts: [[16, '16'], [25, '25'], [40, '40'], [63, '63']], def: 25 }, { k: 'sens', label: ['Sensitivity (mA)', 'الحساسية (ملي)'], t: 'sel', opts: [[10, '10 mA'], [30, '30 mA'], [100, '100 mA'], [300, '300 mA']], def: 30 }, { k: 'locked', label: ['Locked out', 'مقفول بلوتو'], t: 'bool', def: false }],
    faults: [F0, ['wont_trip', ['Does not trip on leakage (dangerous)', 'مش بيفصل على التسريب (خطر)']], ['nuisance', ['Trips at half sensitivity', 'بيفصل على نص الحساسية']]],
    diag: { kind: 'protect' }, op: ['on'],
    init(p) { p.state = { on: false, tripped: false, leak: 0 }; },
    elements(p) { return p.state.on && !p.state.tripped ? [Z(P(p, 'L1'), P(p, 'L2'), RC, 0, { tag: 'l' }), Z(P(p, 'N1'), P(p, 'N2'), RC, 0, { tag: 'n' })] : []; },
    update(p, sim) {
      const st = p.state; if (!st.on || st.tripped) { st.leak = 0; return; }
      const a = sim.e(p.id, 'l'), b = sim.e(p.id, 'n'); if (!a || !b) return;
      const s = EL.cabs([a.r_.iac[0] + b.r_.iac[0], a.r_.iac[1] + b.r_.iac[1]]);
      st.leak = s; st.amps = Math.max(EL.cabs(a.r_.iac), EL.cabs(b.r_.iac));
      const lim = (+p.props.sens / 1000) * (p.fault === 'nuisance' ? 0.5 : 1);
      if (p.fault !== 'wont_trip' && s > lim) { st.tripped = true; st.on = false; st.cause = 'leak'; EL.emit('trip', p, 'earth leakage ' + Math.round(s * 1000) + ' mA'); }
      if (st.amps > 2.0 * p.props.rating) { st.tripped = true; st.on = false; EL.emit('trip', p, 'overload'); }
    },
    press(p, ev) {
      if (ev.type !== 'down') return;
      const st = p.state;
      if (ev.lx != null && ev.lx > 58 && ev.ly > 84 && ev.ly < 112) { // test button
        if (st.on && !st.tripped) { if (p.fault !== 'wont_trip') { st.tripped = true; st.on = false; st.cause = 'test'; EL.emit('trip', p, 'test button'); return { msg: ['Test button: tripped. The RCD works.', 'زرار الاختبار: فصل. الـRCD سليم.'] }; } return { msg: ['Test button pressed: it did NOT trip. Replace the RCD.', 'ضغطت الاختبار: مفصلش. غيّر الـRCD.'] }; }
        return { msg: ['Switch it ON first, then test.', 'شغّله ON الأول وبعدين اختبره.'] };
      }
      if (p.props.locked) return { msg: ['Locked out. Remove the lock first (LOTO).', 'مقفول بقفل لوتو. شيل القفل الأول.'] };
      if (st.tripped) { st.tripped = false; st.on = false; EL.emit('click', p); return { msg: ['Reset to OFF. Switch ON again.', 'رجّعته OFF. اقفله ON تاني.'] }; }
      st.on = !st.on; EL.emit('click', p);
    },
    draw(p) {
      const st = p.state, on = st.on && !st.tripped;
      let r = body(100, 120) + wl(25, 0, 25, 8) + wl(65, 0, 65, 8) + wl(25, 112, 25, 120) + wl(65, 112, 65, 120);
      r += `<rect x="12" y="${st.tripped ? 30 : on ? 20 : 44}" width="76" height="26" rx="4" fill="${st.tripped ? '#FDC300' : on ? '#91C361' : '#7b879f'}" stroke="#0e1626"/>` + T(50, (st.tripped ? 30 : on ? 20 : 44) + 17, st.tripped ? 'TRIP' : on ? 'ON' : 'OFF', 'pbtn');
      r += `<rect x="60" y="86" width="26" height="22" rx="4" fill="#47BFD9" stroke="#0e1626"/>` + T(73, 101, 'T', 'pbtn') + T(34, 100, p.props.sens + ' mA', 'psub') + T(34, 112, p.props.rating + ' A', 'psub');
      if (p.props.locked) r += EL.lockIcon(42, 50);
      return r;
    },
  };

  /* ================= EXTRA CLASSIC CONTROL ================= */
  D.BUZ = {
    cat: 'load', prefix: 'HA', name: ['Buzzer / horn', 'جرس / هورن'], w: 60, h: 80,
    info: ['Buzzer or horn, 3 W. Sounds above 80 % of its voltage. DC types are polarity sensitive in real life, here only the voltage matters.', 'جرس أو هورن 3 وات. بيصوت فوق 80% من جهده.'],
    pins: [pin('pos', '+', 30, 0, 'u'), pin('neg', '−', 30, 80, 'd')],
    props: [{ k: 'volt', label: ['Rated voltage', 'الجهد المقنن'], t: 'sel', opts: VOLTS, def: '24VDC' }],
    faults: [F0, ['open', ['Burnt out', 'محروق']]],
    diag: { kind: 'load', feed: ['pos', 'neg'], volt: (p) => parseInt(p.props.volt, 10), active: (p) => !!p.state.on },
    init(p) { p.state = { on: false }; },
    elements(p) { if (p.state.burnt || p.fault === 'open') return []; const V = parseInt(p.props.volt, 10); return [Z(P(p, 'pos'), P(p, 'neg'), (V * V) / 3, 0, { tag: 'b' })]; },
    update(p, sim, dt) { const e = sim.e(p.id, 'b'), V = parseInt(p.props.volt, 10); const v = e ? Math.max(EL.cabs(e.r_.vac), Math.abs(e.r_.vdc)) : 0; p.state.on = v >= 0.8 * V; p.state.v = v; if (v > 1.4 * V) { p.state.stress = (p.state.stress || 0) + dt; if (p.state.stress > 0.5) { p.state.burnt = true; EL.emit('burn', p); } } else p.state.stress = 0; },
    draw(p) {
      const on = p.state.on;
      return wl(30, 0, 30, 20) + wl(30, 62, 30, 80) + `<circle cx="30" cy="41" r="21" fill="#1a2238" stroke="#7b879f" stroke-width="2"/><circle cx="30" cy="41" r="6" fill="#0e1626"/>` + (on ? `<path d="M52 28 q8 13 0 26 M58 22 q13 19 0 38" fill="none" stroke="#FDC300" stroke-width="2.5"/>` : '') + T(30, 76, fmtV(p.props.volt), 'psub');
    },
  };
  const PB2base = EL.mkSw({ id: 'PB_NO', name: ['', ''], kind: 'NO', mode: 'mom', p1: '3', p2: '4', info: ['', ''] });
  D.PB2 = {
    cat: 'control', prefix: 'SB', name: ['Pushbutton 1NO + 1NC', 'زرار 1 NO + 1 NC'], w: 70, h: 90,
    info: ['Pushbutton with two contacts: 1-2 normally closed and 3-4 normally open. Press to flip both. Handy for start-stop in one button.', 'زرار بكونتاكتين: 1-2 NC و3-4 NO. لما تضغط الاتنين بيتقلبوا.'],
    pins: [pin('1', '1', 15, 0, 'u'), pin('2', '2', 15, 90, 'd'), pin('3', '3', 55, 0, 'u'), pin('4', '4', 55, 90, 'd')],
    props: [], faults: [F0, ['open', ['Contacts dirty (never close)', 'الكونتاكتات متسخة']]],
    diag: { kind: 'switch' }, op: ['act', 'hold'],
    init(p) { p.state = { act: false, hold: false }; },
    elements(p) { if (p.fault === 'open') return []; return p.state.act ? [Z(P(p, '3'), P(p, '4'), RC, 0, { tag: 'no' })] : [Z(P(p, '1'), P(p, '2'), RC, 0, { tag: 'nc' })]; },
    press: PB2base.press,
    draw(p) {
      const act = p.state.act;
      return wl(15, 0, 15, 20) + wl(55, 0, 55, 20) + wl(15, 70, 15, 90) + wl(55, 70, 55, 90) + `<circle cx="35" cy="42" r="22" fill="#1a2238" stroke="#7b879f" stroke-width="2"/><circle cx="35" cy="42" r="${act ? 14 : 17}" fill="#91C361" stroke="#0e1626"/>` + T(35, 46, 'I/O', 'pbtn') + T(15, 84, 'NC', 'psub') + T(55, 84, 'NO', 'psub');
    },
  };
  D.KEY = EL.mkSw({ id: 'KEY', prefix: 'SA', name: ['Key selector switch', 'سلكتور بمفتاح'], kind: 'NO', mode: 'latch', p1: '3', p2: '4', info: ['Two-position selector you can only turn with a key. Used for local/remote or maintenance modes.', 'سلكتور وضعين بيلف بمفتاح بس. بيستخدم لوضع local/remote أو الصيانة.'] });
{
  const base = D.KEY.draw;
  D.KEY.draw = function (p) {
    const act = p.state.act, on = this.closed(p);
    return `<line x1="20" y1="0" x2="20" y2="20" class="wl"/><line x1="20" y1="70" x2="20" y2="90" class="wl"/><circle cx="20" cy="36" r="17" fill="#1a2238" stroke="#7b879f" stroke-width="2"/><g transform="rotate(${act ? 45 : -45} 20 36)"><rect x="16" y="22" width="8" height="26" rx="3" fill="#cfd5e3" stroke="#0e1626"/><circle cx="20" cy="26" r="4" fill="#0e1626"/></g>` + T(20, 82, act ? 'ON' : 'OFF', 'psub') + `<rect x="2" y="86" width="36" height="3" fill="${on ? 'var(--green)' : 'transparent'}"/>`;
  };
}
  D.FLOAT = EL.mkLimit('FLOAT', ['Float / level switch (changeover)', 'فلوت / سويتش مستوى (CO)'], ['Level switch with a changeover contact. Click to simulate the float rising to the set level.', 'سويتش مستوى بكونتاكت CO. اضغط عليه تعمل إن الفلوت وصل للمستوى.'], 'SL');
  D.FLOW = EL.mkLimit('FLOW', ['Flow switch (changeover)', 'فلو سويتش (CO)'], ['Flow switch with a changeover contact. Click to simulate flow present.', 'سويتش سريان بكونتاكت CO. اضغط عليه تعمل إن في سريان.'], 'SF');
  D.THERMO = EL.mkLimit('THERMO', ['Thermostat (changeover)', 'ثرموستات (CO)'], ['Thermostat with a changeover contact. Click to simulate that the set temperature is reached.', 'ثرموستات بكونتاكت CO. اضغط عليه تعمل إن الحرارة المضبوطة وصلت.'], 'ST');
  for (const k of ['FLOAT', 'FLOW', 'THERMO']) { D[k].diag = { kind: 'switch' }; D[k].op = ['act']; }

  D.TOFF = {
    cat: 'control', prefix: 'KT', name: ['Off-delay timer', 'تايمر Off-delay'], w: 110, h: 120,
    info: ['Off-delay timer with trigger. Keep A1-A2 powered all the time. While B1 has voltage the contact is energised (15-18 closed). When B1 loses voltage the contact falls back after the set time.', 'تايمر Off-delay بزرار تحفيز. خلي A1-A2 عليهم كهرباء دايما. طول ما B1 عليه جهد الكونتاكت شغال (15-18 مقفول). لما B1 يفقد الجهد الكونتاكت بيرجع بعد الزمن المضبوط.'],
    pins: [pin('A1', 'A1', 18, 0, 'u'), pin('B1', 'B1', 48, 0, 'u'), pin('A2', 'A2', 18, 120, 'd'), pin('15', '15', 80, 0, 'u'), pin('16', '16', 70, 120, 'd'), pin('18', '18', 95, 120, 'd')],
    props: [{ k: 'time', label: ['Delay (s)', 'الزمن (ثانية)'], t: 'num', min: 0.5, max: 60, step: 0.5, def: 5 }],
    faults: [F0, ['dead', ['Dead', 'ميت']]], diag: { kind: 'logic' }, electronic: true,
    init(p) { p.state = { t: 0, on: false, trig: false, sup: false }; },
    elements(p) { const out = []; if (!p.state.burnt) out.push(Z(P(p, 'A1'), P(p, 'A2'), 15000, 0, { tag: 'in' }), Z(P(p, 'B1'), P(p, 'A2'), 40000, 0, { tag: 'tr' })); out.push(Z(P(p, '15'), P(p, p.state.on ? '18' : '16'), RC, 0, { tag: 'c' })); return out; },
    update(p, sim, dt) {
      const st = p.state, a = EL.eRead(sim, p.id, 'in'), b = EL.eRead(sim, p.id, 'tr');
      const va = Math.max(a.vac, Math.abs(a.vdc)), vb = Math.max(b.vac, Math.abs(b.vdc));
      if (va > 280) { st.burnt = true; EL.emit('burn', p); }
      st.sup = !st.burnt && va >= 20 && p.fault !== 'dead'; st.trig = vb >= 20;
      if (!st.sup) { st.on = false; st.t = 0; return; }
      if (st.trig) { st.on = true; st.t = 0; } else if (st.on) { st.t += dt; if (st.t >= p.props.time) st.on = false; }
    },
    draw(p) {
      const st = p.state;
      return body(110, 120) + wl(18, 0, 18, 20) + wl(48, 0, 48, 20) + wl(80, 0, 80, 40) + wl(70, 120, 70, 92) + wl(95, 120, 95, 92) + `<line x1="80" y1="40" x2="${st.on ? 95 : 70}" y2="90" stroke="${st.on ? '#91C361' : '#e8edf5'}" stroke-width="2.5"/>` +
        `<rect x="8" y="30" width="56" height="46" rx="5" fill="#1a2238" stroke="#7b879f"/><text class="pbtn" x="36" y="50" text-anchor="middle">OFF-DLY</text><text class="pbtn" x="36" y="64" text-anchor="middle">${p.props.time}s</text><circle cx="40" cy="22" r="4" class="led ${st.sup ? 'ledg' : ''}"/>` + (st.burnt ? smoke(20, 40) : '');
    },
  };
  D.PHR = {
    cat: 'control', prefix: 'KP', name: ['Phase failure relay', 'ريلاي فقد فاز'], w: 120, h: 120,
    info: ['Monitors the three phases. If a phase is missing or the voltage drops by more than about 20 %, the contact 15-18 opens. Put it in the control circuit of every important motor.', 'بيراقب الفازات التلاتة. لو فاز راح أو الجهد نقص أكتر من 20% تقريبا الكونتاكت 15-18 بيفتح. حطه في كنترول أي موتور مهم.'],
    pins: [pin('L1', 'L1', 20, 0, 'u'), pin('L2', 'L2', 50, 0, 'u'), pin('L3', 'L3', 80, 0, 'u'), pin('15', '15', 100, 0, 'u'), pin('16', '16', 85, 120, 'd'), pin('18', '18', 105, 120, 'd')],
    props: [], faults: [F0, ['dead', ['Dead', 'ميت']]], diag: { kind: 'logic' }, electronic: true,
    init(p) { p.state = { ok: false }; },
    elements(p) { return [Z(P(p, 'L1'), P(p, 'L2'), 120000, 0, { tag: 'a' }), Z(P(p, 'L2'), P(p, 'L3'), 120000, 0, { tag: 'b' }), Z(P(p, 'L3'), P(p, 'L1'), 120000, 0, { tag: 'c' }), Z(P(p, '15'), P(p, p.state.ok ? '18' : '16'), RC, 0, { tag: 'k' })]; },
    update(p, sim) {
      const v = ['a', 'b', 'c'].map((t) => { const e = sim.e(p.id, t); return e ? EL.cabs(e.r_.vac) : 0; });
      p.state.v = v; p.state.ok = p.fault !== 'dead' && Math.min(...v) >= 320 && Math.max(...v) < 460;
    },
    draw(p) {
      const ok = p.state.ok;
      return body(120, 120) + wl(20, 0, 20, 20) + wl(50, 0, 50, 20) + wl(80, 0, 80, 20) + wl(100, 0, 100, 40) + wl(85, 120, 85, 92) + wl(105, 120, 105, 92) + `<line x1="100" y1="40" x2="${ok ? 105 : 85}" y2="90" stroke="${ok ? '#91C361' : '#e8edf5'}" stroke-width="2.5"/>` +
        `<rect x="8" y="30" width="70" height="50" rx="5" fill="#1a2238" stroke="#7b879f"/><circle cx="26" cy="46" r="5" class="led ${ok ? 'ledg' : 'ledr'}"/><text class="pbtn" x="43" y="64" text-anchor="middle">PHASE</text><text class="pbtn" x="43" y="75" text-anchor="middle">RELAY</text>`;
    },
  };

  /* ================= EXTRA LOADS ================= */
  D.MOT1 = {
    cat: 'load', prefix: 'M', name: ['Single-phase motor 230 V', 'موتور فاز واحد 230 فولت'], w: 120, h: 130,
    info: ['230 V single-phase induction motor (capacitor run). Draws about 6 times its running current for the first moments. A stalled motor overheats and burns. The nameplate in the Part panel gives In, cosφ and efficiency.', 'موتور حثي فاز واحد 230 فولت (بمكثف تشغيل). بيسحب حوالي 6 أضعاف تياره في أول لحظات. الموتور المحبوس بيسخن ويتحرق. لوحة البيانات في خانة الجهاز فيها In و cosφ والكفاءة.'],
    pins: [pin('L', 'L', 25, 0, 'u', { role: 'L1' }), pin('N', 'N', 60, 0, 'u', { role: 'N' }), pin('PE', 'PE', 95, 0, 'u', { role: 'PE' })],
    props: [{ k: 'kw', label: ['Power (kW)', 'القدرة (kW)'], t: 'sel', opts: [[0.18, '0.18'], [0.37, '0.37'], [0.75, '0.75'], [1.5, '1.5'], [2.2, '2.2']], def: 0.37 }, { k: 'ins', label: ['Insulation (MΩ)', 'العزل (ميجا أوم)'], t: 'num', min: 0.01, max: 10000, step: 1, def: 500 }],
    faults: [F0, ['stalled', ['Shaft seized (stalled)', 'العمود محبوس']], ['open_winding', ['Winding open', 'الملف مقطوع']], ['leak', ['Winding leaks to frame', 'الملف بيسرّب للبدن']]],
    diag: { kind: 'load', feed: ['L', 'N'], volt: () => 230, active: (p) => (p.state.w || 0) > 0.1, motor: true },
    init(p) { p.state = { w: 0, amps: 0, heat: 0 }; },
    elements(p, ctx) {
      const out = [], I = EL.motorPlate(p).inom, Zn = 230 / I, w = p.fault === 'stalled' ? 0 : p.state.w || 0, k = 1 + (5 * Math.max(0, 1 - w - 0.03)) / 0.97;
      if (p.fault !== 'open_winding' && !p.state.burnt) out.push(Z(P(p, 'L'), P(p, 'N'), (0.8 * Zn) / k, (0.6 * Zn) / k / (2 * Math.PI * 50), { tag: 'w' }));
      if (p.fault === 'leak') out.push(Z(P(p, 'L'), P(p, 'PE'), 4600, 0, { tag: 'lk' }));
      if (ctx.dead) out.push(Z(P(p, 'L'), P(p, 'PE'), (p.fault === 'leak' ? 0.2 : +p.props.ins) * 1e6, 0, { tag: 'ins', noAC: true }));
      return out;
    },
    update(p, sim, dt) {
      const st = p.state, e = sim.e(p.id, 'w'), v = e ? EL.cabs(e.r_.vac) : 0, I = EL.motorPlate(p).inom;
      st.volts = v; st.amps = e ? EL.cabs(e.r_.iac) : 0;
      const tq = v > 20 ? (v / 230) * (v / 230) : 0;
      if (p.fault === 'stalled') st.w = 0; else { st.w += (dt * (tq * (1.4 - 0.6 * st.w) - (typeof st.pl === 'number' ? st.pl * 1.1 : 0.7) * (0.1 + 0.9 * st.w * st.w))) / 1.5; st.w = Math.max(0, Math.min(0.97, st.w)); }
      const r = st.amps / I;
      if (r > 1.3) st.heat += dt * (r * r - 1) / 40; else st.heat = Math.max(0, st.heat - dt / 60);
      if (st.heat >= 1 && !st.burnt) { st.burnt = true; EL.emit('burn', p, 'motor overheated'); }
      st.rpm = Math.round(st.w * 1400);
    },
    draw(p) {
      const st = p.state, dur = st.w > 0.03 ? Math.max(0.12, 1.1 / st.w) : 0;
      const bl = [0, 120, 240].map((a) => `<path d="M60 65 L60 35 A30 30 0 0 1 ${60 + 30 * Math.sin((40 * Math.PI) / 180)} ${65 - 30 * Math.cos((40 * Math.PI) / 180)} Z" fill="#47BFD9" opacity=".75" transform="rotate(${a} 60 65)"/>`).join('');
      return `<rect class="pbody" x="0" y="0" width="120" height="130" rx="10"/>` + wl(25, 0, 25, 12) + wl(60, 0, 60, 12) + wl(95, 0, 95, 12) + `<circle cx="60" cy="68" r="40" fill="#16203a" stroke="#7b879f" stroke-width="3"/><g class="${dur ? 'spin' : ''}" style="${dur ? 'animation-duration:' + dur.toFixed(2) + 's;' : ''}transform-box:fill-box;transform-origin:center">${bl}</g><circle cx="60" cy="68" r="9" fill="#0e1626" stroke="#7b879f"/><text class="pbtn" x="60" y="72" text-anchor="middle">M</text>` +
        T(60, 124, p.props.kw + ' kW 1~', 'psub') + (st.burnt ? smoke(30, 30) : '') + T(60, 24, st.w > 0.03 ? st.rpm + ' rpm' : 'stopped', 'psub');
    },
  };
  D.MOTDC = {
    cat: 'load', prefix: 'M', name: ['DC motor 24 V', 'موتور DC 24 فولت'], w: 100, h: 110,
    info: ['24 V DC motor. Runs one way with + on top and the other way if you swap the polarity. High starting current, then a lower running current.', 'موتور DC 24 فولت. بيلف في اتجاه لو الموجب فوق وفي الاتجاه التاني لو عكست القطبية. تيار بدء عالي وبعدين تيار تشغيل أقل.'],
    pins: [pin('pos', '+', 30, 0, 'u'), pin('neg', '−', 70, 0, 'u')],
    props: [{ k: 'w', label: ['Power (W)', 'القدرة (وات)'], t: 'sel', opts: [[10, '10 W'], [25, '25 W'], [60, '60 W'], [120, '120 W'], [250, '250 W']], def: 60 }],
    faults: [F0, ['stalled', ['Shaft seized', 'العمود محبوس']], ['open', ['Brushes worn (open)', 'الفحمات خلصت (مفتوح)']]],
    diag: { kind: 'load', feed: ['pos', 'neg'], volt: () => 24, active: (p) => Math.abs(p.state.w || 0) > 0.1, motor: true },
    init(p) { p.state = { w: 0, amps: 0, heat: 0 }; },
    elements(p) { if (p.fault === 'open' || p.state.burnt) return []; const I = +p.props.w / (24 * 0.7), w = p.fault === 'stalled' ? 0 : Math.abs(p.state.w || 0); return [Z(P(p, 'pos'), P(p, 'neg'), 24 / (I * (1 + 5 * Math.pow(1 - w, 2))), 0, { tag: 'a' })]; },
    update(p, sim, dt) {
      const st = p.state, e = sim.e(p.id, 'a'), v = e ? e.r_.vdc : 0, I = +p.props.w / (24 * 0.7);
      st.amps = e ? Math.abs(e.r_.idc) : 0;
      const target = p.fault === 'stalled' ? 0 : Math.max(-1, Math.min(1, v / 24)) * (Math.abs(v) > 6 ? 1 : 0);
      st.w += (target - st.w) * Math.min(1, dt / 0.6);
      const r = st.amps / I;
      if (r > 1.4) st.heat += dt * (r * r - 1) / 30; else st.heat = Math.max(0, st.heat - dt / 60);
      if (st.heat >= 1 && !st.burnt) { st.burnt = true; EL.emit('burn', p, 'motor overheated'); }
    },
    draw(p) {
      const st = p.state, w = Math.abs(st.w), dur = w > 0.03 ? Math.max(0.12, 1.1 / w) : 0;
      return `<rect class="pbody" x="0" y="0" width="100" height="110" rx="10"/>` + wl(30, 0, 30, 14) + wl(70, 0, 70, 14) + `<circle cx="50" cy="62" r="34" fill="#16203a" stroke="#7b879f" stroke-width="3"/><g class="${dur ? (st.w < 0 ? 'spinr' : 'spin') : ''}" style="${dur ? 'animation-duration:' + dur.toFixed(2) + 's;' : ''}transform-box:fill-box;transform-origin:center"><path d="M50 62 L50 36 M50 62 L72 75 M50 62 L28 75" stroke="#47BFD9" stroke-width="6" stroke-linecap="round"/></g><circle cx="50" cy="62" r="8" fill="#0e1626" stroke="#7b879f"/>` + T(50, 106, p.props.w + ' W  24 V=', 'psub') + (st.burnt ? smoke(26, 28) : '');
    },
  };
  D.HTR = {
    cat: 'load', prefix: 'EH', name: ['Heater element 230 V', 'سخان 230 فولت'], w: 100, h: 100,
    info: ['Resistive heater. Resistance is V squared over power. You can measure its resistance with the multimeter when the supply is off. Faults: element open, leakage to the metal sheath.', 'سخان مقاومي. المقاومة = الجهد² / القدرة. تقدر تقيسها بالملتيميتر والكهرباء مفصولة. الأعطال: عنصر مقطوع، تسريب للغلاف المعدني.'],
    pins: [pin('A', 'A', 25, 0, 'u'), pin('B', 'B', 75, 0, 'u'), pin('PE', 'PE', 100, 50, 'r', { earth: true })],
    props: [{ k: 'w', label: ['Power (W)', 'القدرة (وات)'], t: 'sel', opts: [[500, '500 W'], [1000, '1000 W'], [2000, '2000 W'], [3000, '3000 W']], def: 2000 }, { k: 'ins', label: ['Insulation (MΩ)', 'العزل (ميجا أوم)'], t: 'num', min: 0.01, max: 10000, step: 1, def: 200 }],
    faults: [F0, ['open', ['Element open', 'العنصر مقطوع']], ['leak', ['Leakage to sheath', 'تسريب للغلاف']]],
    diag: { kind: 'load', feed: ['A', 'B'], volt: () => 230, active: (p) => (p.state.temp || 20) > 60 },
    init(p) { p.state = { temp: 20 }; },
    elements(p, ctx) { const out = []; if (p.fault !== 'open') out.push(Z(P(p, 'A'), P(p, 'B'), (230 * 230) / +p.props.w, 0, { tag: 'h' })); if (p.fault === 'leak') out.push(Z(P(p, 'A'), P(p, 'PE'), 4600, 0, { tag: 'lk' })); if (ctx.dead) out.push(Z(P(p, 'A'), P(p, 'PE'), (p.fault === 'leak' ? 0.2 : +p.props.ins) * 1e6, 0, { tag: 'ins', noAC: true })); return out; },
    update(p, sim, dt) { const e = sim.e(p.id, 'h'), v = e ? EL.cabs(e.r_.vac) : 0, pw = (v * v) / ((230 * 230) / +p.props.w), tgt = 20 + 380 * Math.min(1.3, pw / +p.props.w); p.state.temp += (tgt - p.state.temp) * Math.min(1, dt / 20); p.state.v = v; },
    draw(p) {
      const t = p.state.temp || 20, hot = Math.max(0, Math.min(1, (t - 40) / 300));
      return wl(25, 0, 25, 16) + wl(75, 0, 75, 16) + wl(100, 50, 88, 50) + `<rect x="8" y="16" width="84" height="70" rx="8" fill="#1a2238" stroke="#7b879f" stroke-width="2"/><path d="M20 30 h60 v14 h-60 v14 h60 v14 h-60" fill="none" stroke="rgb(${Math.round(120 + 135 * hot)},${Math.round(120 - 60 * hot)},${Math.round(120 - 80 * hot)})" stroke-width="5"/>` + T(50, 96, Math.round(t) + ' C', 'psub');
    },
  };

  /* ================= NET LABEL, NOTES, FRAMES ================= */
  D.NETLBL = {
    cat: 'draw', prefix: 'NL', name: ['Net label (GND, +24V...)', 'اسم شبكة (GND, +24V...)'], w: 70, h: 26, pcb: true, netlabel: true,
    info: ['Every net label with the same name is joined electrically, without drawing a wire. Use GND, +24V, 0V, L1... to keep big drawings tidy.', 'أي اسم شبكة بنفس الاسم بيتوصل كهربيا من غير ما ترسم سلك. استخدم GND و+24V و0V وL1 عشان الرسم الكبير يفضل نضيف.'],
    pins: [pin('n', '', 6, 13, 'l')], props: [{ k: 'name', label: ['Name', 'الاسم'], t: 'text1', def: 'GND' }], faults: [F0], diag: { kind: 'label' },
    draw(p) { return `<path d="M6 13 H16 L22 3 H64 V23 H22 Z" fill="#2a3552" stroke="#47BFD9" stroke-width="1.5"/>` + T(43, 17, String(p.props.name || '').slice(0, 7), 'pbtn'); },
  };
  D.NOTE = {
    cat: 'draw', prefix: 'NT', name: ['Note (text)', 'ملاحظة (نص)'], w: 170, h: 70, pcb: true, back: true, hitH: 70,
    info: ['A free text note. Write the name of the machine, the power rating, a warning or a reminder.', 'ملاحظة نص حر. اكتب اسم الماكينة أو القدرة أو تحذير أو تذكير.'],
    pins: [], props: [{ k: 'text', label: ['Text', 'النص'], t: 'text', def: 'Note' }], faults: [F0], diag: { kind: 'decor' },
    draw(p) {
      const lines = String(p.props.text || '').split('\n').slice(0, 4);
      return `<rect x="0" y="0" width="170" height="70" rx="6" fill="#3a3516" stroke="#FDC300" stroke-width="1.5"/>` + lines.map((s, i) => `<text class="psub" x="8" y="${18 + i * 14}" text-anchor="start" style="font-size:11px">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;').slice(0, 30)}</text>`).join('');
    },
  };
  function frame(id, nm, w, h) {
    return {
      cat: 'draw', prefix: 'FR', name: nm, w, h, pcb: true, back: true, hitH: 24,
      info: ['A drawing frame for a panel, an enclosure or a field area (for example QC1, Field box, Motor room). It does not change the circuit. Drag it by its title bar.', 'إطار رسم للوحة أو علبة أو منطقة حقل (مثلا QC1 أو Field box أو غرفة الموتورات). مش بيأثر على الدايرة. اسحبه من شريط العنوان.'],
      pins: [], props: [{ k: 'text', label: ['Title', 'العنوان'], t: 'text1', max: 40, def: 'Panel' }], faults: [F0], diag: { kind: 'decor' },
      draw(p) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="10" fill="rgba(71,191,217,.05)" stroke="#47BFD9" stroke-width="1.8" stroke-dasharray="8 5"/><rect x="0" y="0" width="${w}" height="24" rx="10" fill="rgba(71,191,217,.22)"/>` + `<text class="pbtn" x="12" y="16" text-anchor="start">${String(p.props.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').slice(0, 40)}</text>`; },
    };
  }
  D.FRAME_S = frame('FRAME_S', ['Panel frame (small)', 'إطار لوحة (صغير)'], 260, 180);
  D.FRAME_M = frame('FRAME_M', ['Panel frame (medium)', 'إطار لوحة (وسط)'], 420, 300);
  D.FRAME_L = frame('FRAME_L', ['Panel frame (large)', 'إطار لوحة (كبير)'], 640, 440);
})(typeof window !== 'undefined' ? window : globalThis);
