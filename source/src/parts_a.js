/* Parts A: sources, protection, bus bar, transformer, PSU, VFD */
(function (g) {
  const EL = g.EL;
  const { P, INT, Z, VS, cabs } = EL;
  const RC = EL.R_CLOSED;
  const D = EL.defs;

  EL.newPart = function (type, x, y) {
    const d = D[type];
    const p = { id: 'P' + (EL._pid = (EL._pid || 0) + 1), type, x: x || 0, y: y || 0, tag: '', props: {}, state: {}, fault: 'none' };
    for (const pr of d.props || []) p.props[pr.k] = pr.def;
    if (d.init) d.init(p);
    return p;
  };
  EL.pin = (p, id) => EL.pinsOf(p).find((q) => q.id === id);
  EL.pinPos = (p, id) => { const q = EL.pin(p, id); return q ? { x: p.x + q.x, y: p.y + q.y, dir: q.dir } : null; };

  /* ---- drawing helpers ---- */
  const T = (x, y, s, cls, anchor) => `<text class="${cls || 'psub'}" x="${x}" y="${y}" text-anchor="${anchor || 'middle'}">${s}</text>`;
  EL.T = T;
  const body = (w, h, extra) => `<rect class="pbody" x="0" y="0" width="${w}" height="${h}" rx="7" ${extra || ''}/>`;
  EL.body = body;
  const sine = (cx, cy, r) => `<path d="M${cx - r} ${cy} q${r / 2} ${-r} ${r} 0 t${r} 0" fill="none" stroke="var(--cyan)" stroke-width="2"/>`;
  const lockIcon = (x, y) => `<g transform="translate(${x},${y})"><rect x="-6" y="0" width="12" height="9" rx="2" fill="#FDC300" stroke="#6b5200"/><path d="M-4 0 v-4 a4 4 0 0 1 8 0 v4" fill="none" stroke="#c9ccd6" stroke-width="2"/><rect x="8" y="1" width="9" height="12" rx="1" fill="#F55B41" stroke="#7a1d10"/></g>`;
  EL.lockIcon = lockIcon;
  const pin = (id, label, x, y, dir, extra) => Object.assign({ id, label, x, y, dir }, extra || {});
  EL.mkpin = pin;

  /* ---------------- sources ---------------- */
  D.SRC3 = {
    cat: 'source', prefix: 'G', name: ['3-phase supply 400V', 'مصدر 3 فاز 400 فولت'], w: 160, h: 70,
    info: ['Utility / MDB feed: L1, L2, L3, neutral and earth. 400 V line to line, 230 V to neutral, 50 Hz. Neutral is bonded to earth at the source (TN-S).', 'مصدر الكهرباء من اللوحة الرئيسية: L1 L2 L3 ونيوترال وأرضي. 400 فولت بين الفازات و230 فولت بين الفاز والنيوترال، 50 هرتز. النيوترال متوصل بالأرضي عند المصدر.'],
    pins: [pin('L1', 'L1', 20, 70, 'd', { role: 'L1' }), pin('L2', 'L2', 50, 70, 'd', { role: 'L2' }), pin('L3', 'L3', 80, 70, 'd', { role: 'L3' }), pin('N', 'N', 110, 70, 'd', { role: 'N', earth: true }), pin('PE', 'PE', 140, 70, 'd', { role: 'PE', earth: true })],
    props: [],
    ties: () => [['N', 'PE']],
    elements(p, ctx) {
      const on = ctx.mains === false || ctx.dead ? 0 : 1, V = 400 / Math.sqrt(3);
      const out = [];
      ['L1', 'L2', 'L3'].forEach((ph, i) => {
        const n = INT(p, ph);
        out.push(VS(P(p, 'N'), n, { vac: V * on, ph: -120 * i, f: 50, tag: 'e' + ph }));
        out.push(Z(n, P(p, ph), 0.02, 0, { tag: 'z' + ph }));
      });
      return out;
    },
    draw(p) { return body(160, 70) + sine(48, 28, 10) + T(110, 24, '3~ 400V 50Hz', 'ptitle') + T(80, 50, EL.lang === 'ar' ? 'Supply / مصدر' : EL.tx('Supply'), 'psub'); },
  };
  D.SRC1 = {
    cat: 'source', prefix: 'G', name: ['1-phase supply 230V', 'مصدر فاز واحد 230 فولت'], w: 100, h: 70,
    info: ['Single phase 230 V 50 Hz feed (L, N, PE).', 'مصدر فاز واحد 230 فولت 50 هرتز (L و N و PE).'],
    pins: [pin('L', 'L', 20, 70, 'd', { role: 'L1' }), pin('N', 'N', 50, 70, 'd', { role: 'N', earth: true }), pin('PE', 'PE', 80, 70, 'd', { role: 'PE', earth: true })],
    props: [],
    ties: () => [['N', 'PE']],
    elements(p, ctx) {
      const on = ctx.mains === false || ctx.dead ? 0 : 1, n = INT(p, 'e');
      return [VS(P(p, 'N'), n, { vac: 230 * on, ph: 0, f: 50, tag: 'e' }), Z(n, P(p, 'L'), 0.03, 0, { tag: 'z' })];
    },
    draw() { return body(100, 70) + sine(30, 28, 10) + T(70, 24, '1~ 230V', 'ptitle') + T(50, 50, 'Supply', 'psub'); },
  };
  D.DC24 = {
    cat: 'source', prefix: 'G', name: ['DC supply (battery / floating)', 'مصدر DC (بطارية / عايم)'], w: 90, h: 70,
    info: ['Floating DC source (not tied to earth). Choose 12, 24 or 48 V. Use it for control circuits, sensors and loops.', 'مصدر DC عايم (مش متوصل بالأرضي). اختار 12 أو 24 أو 48 فولت. للتحكم والسنسورات والـloops.'],
    pins: [pin('pos', '+', 25, 70, 'd', { role: 'pos' }), pin('neg', '−', 65, 70, 'd', { role: 'neg' })],
    props: [{ k: 'volt', label: ['Voltage (V)', 'الجهد (فولت)'], t: 'sel', opts: [[12, '12 V'], [24, '24 V'], [48, '48 V']], def: 24 }],
    elements(p, ctx) {
      const n = INT(p, 'e'), v = ctx.dead ? 0 : +p.props.volt;
      return [VS(P(p, 'neg'), n, { vdc: v, tag: 'e' }), Z(n, P(p, 'pos'), 0.05, 0, { tag: 'z' })];
    },
    draw(p) { return body(90, 70) + T(45, 30, p.props.volt + ' V', 'ptitle') + T(45, 48, 'DC', 'psub') + T(25, 60, '+', 'plab') + T(65, 60, '−', 'plab'); },
  };
  D.PSU = {
    cat: 'source', prefix: 'G', name: ['Power supply 230VAC to 24VDC', 'باور سبلاي 230 AC إلى 24 DC'], w: 130, h: 100,
    info: ['Switch-mode PSU. Input 90 to 265 V AC. Output 24 V DC, 5 A, isolated and floating. Shuts down on overload.', 'باور سبلاي 24 فولت DC. دخل 90 إلى 265 فولت AC وخرج 24 فولت 5 أمبير معزول. بيفصل لو اتحمل زيادة.'],
    pins: [pin('L', 'L', 25, 0, 'u'), pin('N', 'N', 55, 0, 'u'), pin('PE', 'PE', 105, 0, 'u', { earth: true }), pin('pos', '+24V', 35, 100, 'd', { role: 'pos' }), pin('neg', '0V', 95, 100, 'd', { role: 'neg' })],
    props: [],
    faults: [['none', ['None', 'سليم']], ['dead', ['Dead (no output)', 'ميت (مفيش خرج)']]],
    electronic: true,
    init(p) { p.state = { ok: false, ocp: 0 }; },
    elements(p, ctx) {
      const out = [Z(P(p, 'L'), P(p, 'N'), 3500, 0, { tag: 'in' })];
      if (p.state.ok && p.fault !== 'dead' && !ctx.dead) {
        const n = INT(p, 'o');
        out.push(VS(P(p, 'neg'), n, { vdc: 24, tag: 'o' }), Z(n, P(p, 'pos'), 0.05, 0, { tag: 'oz' }));
      }
      return out;
    },
    update(p, sim, dt) {
      const vin = EL.eRead(sim, p.id, 'in').vac;
      const iout = Math.abs(EL.eRead(sim, p.id, 'o').idc);
      if (p.state.ocp > 0) { p.state.ocp -= dt; p.state.ok = false; return; }
      if (iout > 6.5) { p.state.ocp = 3; p.state.ok = false; EL.emit('trip', p, 'PSU overload'); return; }
      p.state.ok = vin >= 90 && vin <= 265;
    },
    draw(p) {
      return body(130, 100) + T(65, 30, 'AC 230V', 'psub') + T(65, 48, '▼', 'ptitle') + T(65, 66, 'DC 24V 5A', 'ptitle') +
        `<circle cx="112" cy="40" r="4" class="led ${p.state.ok ? 'ledg' : ''}"/>`;
    },
  };
  D.TRAFO = {
    cat: 'source', prefix: 'TC', name: ['Control transformer', 'ترانس تحكم'], w: 130, h: 110,
    info: ['Isolating transformer. Primary 230 V (or 400 V between two phases). Secondary 24 / 110 / 230 V. 100 VA.', 'ترانس عزل. الابتدائي 230 فولت (أو 400 بين فازتين). الثانوي 24 أو 110 أو 230 فولت. قدرة 100 فولت أمبير.'],
    pins: [pin('P1', 'P1', 30, 0, 'u'), pin('P2', 'P2', 100, 0, 'u'), pin('S1', 'S1', 30, 110, 'd', { role: 'sec' }), pin('S2', 'S2', 100, 110, 'd', { role: 'sec' })],
    props: [
      { k: 'pri', label: ['Primary (V)', 'الابتدائي (فولت)'], t: 'sel', opts: [[230, '230 V'], [400, '400 V']], def: 400 },
      { k: 'sec', label: ['Secondary (V)', 'الثانوي (فولت)'], t: 'sel', opts: [[24, '24 V'], [110, '110 V'], [230, '230 V']], def: 24 },
    ],
    faults: [['none', ['None', 'سليم']], ['open_pri', ['Open primary winding', 'الابتدائي مقطوع']]],
    init(p) { p.state = { vp: 0, ph: 0 }; },
    elements(p, ctx) {
      const out = [];
      if (p.fault !== 'open_pri') out.push(Z(P(p, 'P1'), P(p, 'P2'), p.props.pri * p.props.pri / 100, 0, { tag: 'pri' }));
      const v = (ctx.dead ? 0 : p.state.vp) * (p.props.sec / p.props.pri);
      if (p.fault !== 'open_pri') {
        const n = INT(p, 's');
        out.push(VS(P(p, 'S2'), n, { vac: v, ph: p.state.ph, f: 50, tag: 's' }), Z(n, P(p, 'S1'), 0.3, 0, { tag: 'sz' }));
      }
      return out;
    },
    update(p, sim) {
      const e = sim.e(p.id, 'pri');
      if (!e) { p.state.vp = 0; return; }
      p.state.vp = cabs(e.r_.vac);
      p.state.ph = EL.carg(e.r_.vac);
    },
    draw(p) {
      return body(130, 110) + `<circle cx="52" cy="55" r="18" fill="none" stroke="var(--cyan)" stroke-width="2"/><circle cx="78" cy="55" r="18" fill="none" stroke="var(--cyan)" stroke-width="2"/>` +
        T(65, 26, p.props.pri + ' / ' + p.props.sec + ' V', 'ptitle') + T(65, 92, '100 VA', 'psub');
    },
  };

  /* ---------------- breakers ---------------- */
  function breaker(kind, poles) {
    const ids = poles === 1 ? [['1', '2']] : [['1', '2'], ['3', '4'], ['5', '6']];
    const w = poles === 1 ? 40 : 100, h = 100;
    const ratings = [[2, '2 A'], [4, '4 A'], [6, '6 A'], [10, '10 A'], [16, '16 A'], [20, '20 A'], [25, '25 A'], [32, '32 A'], [40, '40 A'], [63, '63 A'], [100, '100 A']];
    const d = {
      cat: 'protect', prefix: kind === 'ISOL' ? 'QS' : 'QF', w, h,
      pins: ids.flatMap(([a, b], i) => [pin(a, a, 20 + i * 30, 0, 'u'), pin(b, b, 20 + i * 30, h, 'd')]),
      lockable: true,
      props: kind === 'MPCB'
        ? [{ k: 'set', label: ['Setting Ir (A)', 'ضبط Ir (أمبير)'], t: 'num', min: 0.4, max: 32, step: 0.1, def: 4 }, { k: 'locked', label: ['Locked out', 'مقفول بلوتو'], t: 'bool', def: false }]
        : kind === 'ISOL'
          ? [{ k: 'rating', label: ['Rating (A)', 'التيار (أمبير)'], t: 'sel', opts: ratings, def: 32 }, { k: 'locked', label: ['Locked out', 'مقفول بلوتو'], t: 'bool', def: false }]
          : [{ k: 'rating', label: ['Rating (A)', 'التيار (أمبير)'], t: 'sel', opts: ratings, def: 16 }, { k: 'curve', label: ['Curve', 'المنحنى'], t: 'sel', opts: [['B', 'B (5x)'], ['C', 'C (10x)'], ['D', 'D (20x)']], def: 'C' }, { k: 'locked', label: ['Locked out', 'مقفول بلوتو'], t: 'bool', def: false }],
      faults: poles === 3 ? [['none', ['None', 'سليم']], ['pole2_open', ['Middle pole not conducting', 'البول الأوسط مش بيوصل']], ['wont_close', ['Will not close', 'مش بيقفل']]] : [['none', ['None', 'سليم']], ['pole2_open', ['Contact not conducting', 'الكونتاكت مش بيوصل']], ['wont_close', ['Will not close', 'مش بيقفل']]],
      init(p) { p.state = { on: false, tripped: false, heat: 0 }; },
      rated(p) { return kind === 'MPCB' ? +p.props.set : +p.props.rating; },
      elements(p) {
        const out = [];
        if (!p.state.on || p.state.tripped) return out;
        ids.forEach(([a, b], i) => {
          if (p.fault === 'pole2_open' && i === Math.min(1, ids.length - 1)) return;
          out.push(Z(P(p, a), P(p, b), RC, 0, { tag: 'k' + i }));
        });
        return out;
      },
      update(p, sim, dt) {
        const st = p.state;
        if (!st.on || st.tripped) { st.heat = Math.max(0, st.heat - dt / 120 * st.heat); st.amps = 0; return; }
        let I = 0;
        ids.forEach((x, i) => { const r = EL.eRead(sim, p.id, 'k' + i); I = Math.max(I, r.iac, Math.abs(r.idc)); });
        st.amps = I;
        if (kind === 'ISOL') return;
        const In = d.rated(p);
        const mag = kind === 'MPCB' ? 13 : { B: 5, C: 10, D: 20 }[p.props.curve] || 10;
        if (I > mag * In) { st.tripped = true; st.on = false; st.cause = 'short'; EL.emit('trip', p, 'magnetic'); return; }
        const r = I / In;
        const K = kind === 'MPCB' ? 508 : 250;
        if (r > 1.13) st.heat += dt * (r * r - 1) / K; else st.heat = Math.max(0, st.heat - dt * st.heat / 120);
        if (st.heat >= 1) { st.tripped = true; st.on = false; st.cause = 'overload'; EL.emit('trip', p, 'thermal'); }
      },
      press(p, ev) {
        if (ev.type !== 'down') return;
        if (p.props.locked) return { msg: ['Locked out. Remove the lock first (LOTO).', 'مقفول بقفل لوتو. شيل القفل الأول.'] };
        const st = p.state;
        if (st.tripped) { st.tripped = false; st.on = false; st.heat = Math.min(st.heat, 0.5); EL.emit('click', p); return { msg: ['Reset to OFF. Switch ON again.', 'رجّعته OFF. اقفله ON تاني.'] }; }
        if (!st.on && p.fault === 'wont_close') return { msg: ['Handle will not stay ON (mechanism fault).', 'المقبض مش بيثبت على ON (عطل ميكانيكي).'] };
        st.on = !st.on; EL.emit('click', p);
      },
      draw(p) {
        const st = p.state, on = st.on && !st.tripped;
        const rating = kind === 'MPCB' ? (+p.props.set).toFixed(1) + ' A' : p.props.rating + ' A';
        let s = body(w, h);
        const poles3 = poles === 3;
        if (poles3) s += `<line x1="35" y1="8" x2="35" y2="92" stroke="#3b4d73"/><line x1="65" y1="8" x2="65" y2="92" stroke="#3b4d73"/>`;
        const hx = poles3 ? 12 : 8, hw = poles3 ? 76 : 24;
        const col = st.tripped ? '#FDC300' : on ? '#91C361' : '#7b879f';
        const hy = st.tripped ? 40 : on ? 20 : 52;
        const handleFill = kind === 'ISOL' ? '#FDC300' : col;
        s += `<rect x="${hx}" y="${hy}" width="${hw}" height="26" rx="4" fill="${handleFill}" stroke="#0e1626"/>`;
        s += T(w / 2, hy + 17, kind === 'ISOL' ? (on ? 'I' : '0') : st.tripped ? 'TRIP' : on ? 'ON' : 'OFF', 'pbtn');
        s += T(w / 2, h / 2 + (poles3 ? 24 : 22), (kind === 'MCB' ? p.props.curve : kind) + (kind === 'ISOL' ? ' ' : '') + ' ' + rating, 'psub');
        if (p.props.locked) s += lockIcon(w / 2 - 8, 32);
        return s;
      },
      info: kind === 'MCB' ? ['Miniature circuit breaker. Protects the cable against overload (thermal) and short circuit (magnetic). Curve C trips instantly above 10x rating.', 'ميني بريكر. بيحمي الكابل من الأوفرلود (حراري) والشورت (مغناطيسي). منحنى C بيفصل لحظيًا فوق 10 أضعاف التيار.'] :
        kind === 'MPCB' ? ['Motor protection circuit breaker (like a GV2). Adjustable thermal setting Ir plus magnetic trip at 13x. Set Ir to the motor nameplate current.', 'بريكر حماية موتور (زي GV2). ضبط حراري Ir قابل للتعديل ومغناطيسي عند 13 ضعف. اضبط Ir على تيار لوحة الموتور.'] :
          ['Isolator switch. Manual disconnect with no protection. Lockable, so it is the usual LOTO point for a panel.', 'سويتش عزل يدوي بدون حماية. بيتقفل بقفل لوتو وهو نقطة العزل المعتادة للوحة.'],
    };
    return d;
  }
  D.MCB1 = Object.assign(breaker('MCB', 1), { name: ['MCB 1-pole', 'ميني بريكر 1 بول'] });
  D.MCB3 = Object.assign(breaker('MCB', 3), { name: ['MCB 3-pole', 'ميني بريكر 3 بول'] });
  D.MPCB = Object.assign(breaker('MPCB', 3), { name: ['Motor protection breaker', 'بريكر حماية موتور'] });
  D.ISOL3 = Object.assign(breaker('ISOL', 3), { name: ['Isolator switch 3-pole', 'سويتش عزل 3 بول'] });

  D.FUSE = {
    cat: 'protect', prefix: 'FU', name: ['Fuse holder', 'قاعدة فيوز'], w: 40, h: 90, lockable: false,
    info: ['Cartridge fuse in a holder. Blows on overload or short circuit. Replace only with the same rating.', 'فيوز في قاعدة. بيقطع عند الأوفرلود أو الشورت. غيّره بنفس القيمة بس.'],
    pins: [pin('1', '1', 20, 0, 'u'), pin('2', '2', 20, 90, 'd')],
    props: [{ k: 'rating', label: ['Rating (A)', 'التيار (أمبير)'], t: 'sel', opts: [[1, '1 A'], [2, '2 A'], [4, '4 A'], [6, '6 A'], [10, '10 A'], [16, '16 A'], [25, '25 A']], def: 2 }],
    faults: [['none', ['None', 'سليم']], ['blown', ['Blown', 'محروق']]],
    init(p) { p.state = { heat: 0 }; },
    elements(p) { return p.fault === 'blown' || p.state.blown ? [] : [Z(P(p, '1'), P(p, '2'), RC, 0, { tag: 'k' })]; },
    update(p, sim, dt) {
      if (p.state.blown || p.fault === 'blown') return;
      const r = EL.eRead(sim, p.id, 'k');
      const I = Math.max(r.iac, Math.abs(r.idc)), In = +p.props.rating;
      if (I > 10 * In) { p.state.blown = true; EL.emit('blow', p); return; }
      const x = I / In;
      if (x > 1.2) p.state.heat += dt * (x * x - 1) / 120; else p.state.heat = Math.max(0, p.state.heat - dt * p.state.heat / 60);
      if (p.state.heat >= 1) { p.state.blown = true; EL.emit('blow', p); }
    },
    press(p, ev) {
      if (ev.type === 'down' && (p.state.blown || p.fault === 'blown')) { p.state.blown = false; p.state.heat = 0; p.fault = 'none'; return { msg: ['Fuse replaced with a new one.', 'اتغير الفيوز بواحد جديد.'] }; }
    },
    draw(p) {
      const bl = p.state.blown || p.fault === 'blown';
      return `<rect class="pbody" x="8" y="14" width="24" height="62" rx="4"/><rect x="14" y="22" width="12" height="46" rx="2" fill="${bl ? '#3a2a2a' : '#e9d9b0'}" stroke="#0e1626"/>` +
        (bl ? `<path d="M20 28 l-4 14 l8 6 l-4 14" stroke="#F55B41" fill="none" stroke-width="2"/>` : `<line x1="20" y1="24" x2="20" y2="66" stroke="#555" stroke-width="1.5"/>`) + T(20, 88, p.props.rating + 'A', 'psub');
    },
  };

  D.BUS = {
    cat: 'protect', prefix: 'X', name: ['Terminal bar / bus bar', 'بار توصيل (Terminal bar)'], w: 150, h: 34, lockable: false,
    info: ['A bar that ties all its terminals together. Use it as PE bar, neutral bar, 24 V or 0 V rail. The PE type is bonded to earth.', 'بار بيوصل كل الأطراف مع بعض. استخدمه كبار أرضي أو نيوترال أو 24 فولت أو 0. النوع PE متوصل بالأرضي.'],
    pins: [14, 38, 62, 86, 110, 134].map((x, i) => pin('t' + (i + 1), '', x, 34, 'd')),
    props: [{ k: 'kind', label: ['Bar type', 'نوع البار'], t: 'sel', opts: [['PE', 'PE (earth)'], ['N', 'N (neutral)'], ['L1', 'L1'], ['L2', 'L2'], ['L3', 'L3'], ['24V', '+24V'], ['0V', '0V'], ['X', 'Other']], def: 'N' }],
    earth: (p) => p.props.kind === 'PE',
    ties: () => [['t1', 't2', 't3', 't4', 't5', 't6']],
    elements: () => [],
    draw(p) {
      const k = p.props.kind;
      const col = { PE: 'url(#pegy)', N: '#47BFD9', L1: '#8a5a2b', L2: '#222', L3: '#8c8c8c', '24V': '#F55B41', '0V': '#323C8E', X: '#7b879f' }[k];
      return `<rect x="0" y="6" width="150" height="16" rx="3" fill="${col}" stroke="#0e1626"/>` + T(75, 18, k, 'pbtn');
    },
  };
  // pins with empty labels are shown without text

  /* ---------------- VFD ---------------- */
  const KW_I = { 0.37: 1.1, 0.75: 1.9, 1.5: 3.5, 2.2: 5.0, 3: 6.4, 4: 8.5, 5.5: 11.5, 7.5: 15.5, 11: 22 };
  EL.KW_I = KW_I;
  D.VFD = {
    cat: 'power', prefix: 'U', name: ['Inverter (VFD)', 'انفرتر (VFD)'], w: 230, h: 250,
    info: ['Variable frequency drive. Input R/S/T (400 V), output U/V/W to the motor. Run with a 24 V contact on DI1 (forward) or DI2 (reverse). Set speed from the keypad or from 0-10 V on AI1. The DC bus stays charged after power-off, so wait and measure before touching.', 'انفرتر لتغيير سرعة الموتور. الدخل R/S/T والخرج U/V/W للموتور. التشغيل بكونتاكت 24 فولت على DI1 (أمامي) أو DI2 (عكسي). السرعة من الكيباد أو من 0-10 فولت على AI1. الـDC bus بيفضل مشحون بعد الفصل، استنى وقيس قبل ما تلمس.'],
    pins: [pin('R', 'R/L1', 25, 0, 'u'), pin('S', 'S/L2', 55, 0, 'u'), pin('T', 'T/L3', 85, 0, 'u'), pin('PE', 'PE', 115, 0, 'u', { earth: true }), pin('BP', 'DC+', 155, 0, 'u'), pin('BN', 'DC-', 190, 0, 'u'),
      pin('U', 'U', 30, 250, 'd'), pin('V', 'V', 70, 250, 'd'), pin('W', 'W', 110, 250, 'd'), pin('PE2', 'PE', 150, 250, 'd', { earth: true }),
      pin('P24', '+24V', 230, 50, 'r'), pin('DCM', 'DCOM', 230, 80, 'r'), pin('DI1', 'DI1 FWD', 230, 110, 'r'), pin('DI2', 'DI2 REV', 230, 140, 'r'), pin('P10', '+10V', 230, 175, 'r'), pin('AI1', 'AI1', 230, 205, 'r'), pin('AGM', 'AGND', 230, 235, 'r')],
    props: [
      { k: 'kw', label: ['Drive size (kW)', 'قدرة الانفرتر (kW)'], t: 'sel', opts: [[0.75, '0.75'], [1.5, '1.5'], [2.2, '2.2'], [4, '4'], [5.5, '5.5'], [7.5, '7.5'], [11, '11']], def: 1.5 },
      { k: 'ctrl', label: ['Run command from', 'أمر التشغيل من'], t: 'sel', opts: [['term', 'Terminals DI1/DI2'], ['key', 'Keypad']], def: 'term' },
      { k: 'ref', label: ['Speed reference', 'مرجع السرعة'], t: 'sel', opts: [['key', 'Keypad'], ['ai', 'AI1 0-10 V']], def: 'key' },
      { k: 'fset', label: ['Keypad frequency (Hz)', 'التردد من الكيباد (Hz)'], t: 'num', min: 1, max: 100, step: 1, def: 50 },
      { k: 'ramp', label: ['Ramp time (s)', 'زمن الـRamp (ثانية)'], t: 'num', min: 0.5, max: 30, step: 0.5, def: 3 },
    ],
    faults: [['none', ['None', 'سليم']], ['dead', ['Dead (no display)', 'ميت (الشاشة مطفية)']]],
    electronic: true,
    init(p) { p.state = { bus: 0, f: 0, fwd: 1, run: false, fault: '', kRun: false, kDir: 1, pin: 25 }; },
    elements(p, ctx) {
      const s = p.state, out = [];
      if (p.fault === 'dead') { return out; }
      const star = INT(p, 'sn'), Rin = Math.max(200, (230 * 230) / (s.pin / 3));
      for (const ph of ['R', 'S', 'T']) out.push(Z(P(p, ph), star, Rin, 0, { tag: 'in' + ph }));
      if (s.bus > 5 && !ctx.dead) { const n = INT(p, 'bus'); out.push(VS(P(p, 'BN'), n, { vdc: s.bus, tag: 'bus' }), Z(n, P(p, 'BP'), 500, 0, { tag: 'busz' })); }
      if (s.bus > 300 && !ctx.dead) {
        const a = INT(p, 'v24'); out.push(VS(P(p, 'DCM'), a, { vdc: 24, tag: 'v24' }), Z(a, P(p, 'P24'), 50, 0, { tag: 'v24z' }));
        const b = INT(p, 'v10'); out.push(VS(P(p, 'AGM'), b, { vdc: 10, tag: 'v10' }), Z(b, P(p, 'P10'), 1000, 0, { tag: 'v10z' }));
      }
      out.push(Z(P(p, 'DI1'), P(p, 'DCM'), 3500, 0, { tag: 'di1' }), Z(P(p, 'DI2'), P(p, 'DCM'), 3500, 0, { tag: 'di2' }), Z(P(p, 'AI1'), P(p, 'AGM'), 100000, 0, { tag: 'ai' }));
      if (s.out && s.f > 0.05 && !ctx.dead) {
        const ns = INT(p, 'ns'), f = s.f, ratio = Math.min(1, 0.04 + 0.96 * f / 50), Vph = (400 / Math.sqrt(3)) * ratio;
        const sg = s.fwd >= 0 ? 1 : -1;
        ['U', 'V', 'W'].forEach((ph, i) => {
          const n = INT(p, 'o' + ph);
          out.push(VS(ns, n, { vac: Vph, ph: -120 * i * sg, f, tag: 'o' + ph }), Z(n, P(p, ph), 0.3, 0, { tag: 'oz' + ph }));
        });
      }
      return out;
    },
    update(p, sim, dt, ctx) {
      const s = p.state, kw = +p.props.kw, Inom = KW_I[kw] || 4;
      if (p.fault === 'dead') { s.bus *= Math.exp(-dt / 150); s.f = 0; s.out = false; return; }
      const vr = (a, b) => cabs(sim.vac(P(p, a), P(p, b)));
      const lines = [vr('R', 'S'), vr('S', 'T'), vr('T', 'R')];
      const vin = (lines[0] + lines[1] + lines[2]) / 3, vmax = Math.max(...lines), vmin = Math.min(...lines);
      const powered = vin > 300 && vmin > 0.6 * vmax;
      if (vin > 100 && vmin < 0.6 * vmax && s.bus > 100) { if (!s.fault) { s.fault = 'PHASE LOSS'; EL.emit('fault', p, 'phase loss'); } }
      if (vin > 520 && !s.fault) { s.fault = 'OVERVOLT'; EL.emit('fault', p, 'ov'); }
      if (powered) {
        const tgt = 1.414 * vin;
        s.bus += (tgt - s.bus) * Math.min(1, dt / 0.6);
      } else {
        s.bus *= Math.exp(-dt / 150);
        if (s.bus < 450 && s.out) { s.out = false; }
      }
      if (s.bus < 5) s.bus = 0;
      if (s.bus < 350) { s.f = 0; s.out = false; s.run = false; return; }
      // commands
      const di1 = sim.vdc(P(p, 'DI1'), P(p, 'DCM')) > 15, di2 = sim.vdc(P(p, 'DI2'), P(p, 'DCM')) > 15;
      let run = false, dir = 1;
      if (p.props.ctrl === 'term') { run = (di1 ^ di2) === 1; dir = di2 ? -1 : 1; } else { run = s.kRun; dir = s.kDir; }
      s.run = run;
      const fmax = 50;
      let fr = p.props.ref === 'ai' ? fmax * Math.max(0, Math.min(1, sim.vdc(P(p, 'AI1'), P(p, 'AGM')) / 10)) : +p.props.fset;
      fr = Math.min(fr, 100);
      s.fref = fr;
      if (s.fault) { s.out = false; s.f = Math.max(0, s.f - dt * 50); if (s.f < 0.05) s.f = 0; return; }
      if (run) {
        if (dir !== s.fwd && s.f > 0.5) { // decelerate to zero before reversing
          s.f = Math.max(0, s.f - dt * 50 / p.props.ramp);
          if (s.f <= 0.5) { s.fwd = dir; }
        } else {
          s.fwd = dir;
          const step = dt * 50 / p.props.ramp;
          if (s.f < fr) s.f = Math.min(fr, s.f + step); else s.f = Math.max(fr, s.f - step);
        }
        s.out = true;
      } else {
        s.f = Math.max(0, s.f - dt * 50 / p.props.ramp);
        s.out = s.f > 0.05;
      }
      // output current protection and input power estimation
      let Iu = 0;
      for (const ph of ['U', 'V', 'W']) { const r = sim.iPin(P(p, ph)); Iu = Math.max(Iu, cabs(r.ac)); }
      s.iout = Iu;
      if (Iu > 2.5 * Inom) { s.fault = 'OVERCURRENT'; s.out = false; EL.emit('fault', p, 'oc'); }
      const vll = (400) * Math.min(1, 0.04 + 0.96 * s.f / 50);
      const pout = Math.sqrt(3) * vll * Iu * 0.8;
      s.pin = 25 + pout / 0.96;
    },
    press(p, ev) {
      const s = p.state;
      if (ev.type !== 'down') return;
      const k = ev.btn;
      if (k === 'run') { if (p.props.ctrl === 'key') { s.kRun = true; return { msg: ['Keypad RUN', 'RUN من الكيباد'] }; } return { msg: ['Run command is set to terminals (DI1/DI2). Change it in properties.', 'أمر التشغيل على الترمينال. غيّره من الخصائص.'] }; }
      if (k === 'stop') { s.kRun = false; return; }
      if (k === 'rev') { s.kDir = -s.kDir; return; }
      if (k === 'up') { p.props.fset = Math.min(100, +p.props.fset + 1); return; }
      if (k === 'down') { p.props.fset = Math.max(1, +p.props.fset - 1); return; }
      if (k === 'reset') { s.fault = ''; return; }
    },
    draw(p) {
      const s = p.state, w = 230, h = 250;
      const dead = p.fault === 'dead' || s.bus < 350;
      let disp = dead ? '' : s.fault ? 'F: ' + s.fault : s.f.toFixed(1) + ' Hz';
      let sub = dead ? '' : s.fault ? '' : (s.run ? (s.fwd >= 0 ? 'FWD RUN' : 'REV RUN') : 'STOP') + (s.iout != null ? '  ' + (s.iout || 0).toFixed(1) + ' A' : '');
      let r = body(w, h);
      r += `<rect x="20" y="30" width="150" height="62" rx="5" class="lcd"/>`;
      r += `<text x="95" y="62" class="lcdt" text-anchor="middle" font-size="22">${disp}</text><text x="95" y="82" class="lcdt" text-anchor="middle" font-size="11">${sub}</text>`;
      const btn = (x, y, lab, id, col) => `<g class="vbtn" data-btn="${id}"><rect x="${x}" y="${y}" width="40" height="24" rx="4" fill="${col || '#3b4d73'}" stroke="#0e1626"/><text x="${x + 20}" y="${y + 16}" class="pbtn" text-anchor="middle">${lab}</text></g>`;
      r += btn(20, 104, 'RUN', 'run', '#2f7d3f') + btn(65, 104, 'STOP', 'stop', '#a33a2a') + btn(110, 104, 'F/R', 'rev') + btn(20, 134, '▲', 'up') + btn(65, 134, '▼', 'down') + btn(110, 134, 'RST', 'reset', '#8a6a1a');
      r += T(95, 186, 'Fset ' + p.props.fset + ' Hz  ramp ' + p.props.ramp + ' s', 'psub');
      r += T(95, 204, 'DC bus ' + Math.round(s.bus) + ' V', 'psub');
      r += T(95, 222, p.props.kw + ' kW  3~ 400V', 'psub');
      r += `<circle cx="150" cy="116" r="4" class="led ${s.run && !s.fault ? 'ledg' : ''}"/><circle cx="150" cy="146" r="4" class="led ${s.fault ? 'ledr' : ''}"/>`;
      return r;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
