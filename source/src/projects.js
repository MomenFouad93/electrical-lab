/* Ready projects: a panel (circuit), a process (plant) and, when there is a PLC, a ladder program. */
(function (g) {
  const EL = g.EL;
  const E = (en, ar) => [en, ar];
  const PJ = (EL.projects = { map: {}, list: [] });
  const add = (id, o) => { PJ.map[id] = o; PJ.list.push(id); };
  const NO = (a) => ({ t: 'NO', a }), NC = (a) => ({ t: 'NC', a }), CMP = (a, op, b) => ({ t: 'CMP', op, a, b }), PAR = (...br) => ({ t: 'PAR', br });
  const COIL = (a) => ({ t: 'COIL', a });

  /* ---------- 1. Water tank, star-delta pump, PLC ---------- */
  add('tank', {
    name: E('Water tank: PLC star-delta pump', 'تانك مية: طلمبة ستار-دلتا بـPLC'),
    desc: E('A sump pump fills a tank. A compact PLC runs the pump star-delta from the level transmitter: start below 20 %, stop at 90 %. LSHH (wired fail-safe), a dead transmitter or a contactor that does not pull in trip it and light the alarm.', 'طلمبة بتملا تانك من البيارة. PLC صغير بيشغل الطلمبة ستار-دلتا من ترانسميتر المستوى: تبدأ تحت 20% وتقف عند 90%. LSHH (متوصل أمان) أو ترانسميتر ميت أو كونتاكتور مش بيلقط بيفصلوها ويولعوا الإنذار.'),
    tasks: [
      E('Switch on QM1 and F1, then press S1 (Start). Watch KM1 + KM2 (star), then KM3 (delta) after 10 s.', 'شغّل QM1 وF1، واضغط S1 (تشغيل). راقب KM1 + KM2 (ستار) وبعد 10 ثواني KM3 (دلتا).'),
      E('Open the Ladder view: follow the green power flow while it runs.', 'افتح شاشة اللادر: تابع الباور الأخضر وهو شغال.'),
      E('Clamp the meter on motor cable U1: in star it carries the line current, in delta only the winding current (line current ÷ 1.73).', 'حط الكلامب على كابل الموتور U1: في الستار بيشيل تيار الخط، وفي الدلتا تيار الملف بس (تيار الخط ÷ 1.73).'),
      E('Close V1 in the Plant view: the tank fills to 90 % and the pump stops.', 'اقفل V1 في شاشة العملية: التانك يتملى لحد 90% والطلمبة تقف.'),
      E('Fail-safe test: give B1 the fault "Dead" or delete the wire SL1:12. The PLC stops the pump and lights H1. Press S1 to reset after repair.', 'اختبار الأمان: ادّي B1 عطل "ميت" أو امسح سلك SL1:12. الـPLC بيوقف الطلمبة ويولع H1. اضغط S1 للريست بعد الإصلاح.'),
      E('Break something (Part, Fault simulation) and find it with the meters and the ladder diagnosis.', 'بوّظ حاجة (الجهاز، محاكاة عطل) ودوّر عليها بالأجهزة وتشخيص اللادر.'),
    ],
    circuit: {
      parts: [
        ['G1', 'SRC3', 40, 20], ['QM1', 'MPCB', 40, 150, { set: 3.5 }],
        ['KM1', 'CONT3', 40, 320, { coil: '230VAC' }], ['KM3', 'CONT3', 340, 590, { coil: '230VAC' }], ['KM2', 'CONT3', 340, 860, { coil: '230VAC' }],
        ['M1', 'MOT3', 30, 860, { kw: 1.5, conn: '6wire' }],
        ['F1', 'MCB1', 700, 20, { rating: 6 }], ['G2', 'PSU', 800, 20],
        ['KF1', 'PLC24R', 700, 330],
        ['S1', 'PB_NO', 680, 600], ['S2', 'PB_NC', 770, 600], ['SL1', 'FLOAT', 860, 600], ['B1', 'TXV', 960, 600, { proc: 40 }],
        ['H1', 'LAMP', 1040, 330, { volt: '230VAC', color: 'red' }],
      ],
      wires: [
        ['G1.L1', 'QM1.1'], ['G1.L2', 'QM1.3'], ['G1.L3', 'QM1.5'],
        ['QM1.2', 'KM1.1'], ['QM1.4', 'KM1.3'], ['QM1.6', 'KM1.5'],
        ['KM1.2', 'M1.U1'], ['KM1.4', 'M1.V1'], ['KM1.6', 'M1.W1'],
        ['KM1.2', 'KM3.1'], ['KM1.4', 'KM3.3'], ['KM1.6', 'KM3.5'],
        ['KM3.2', 'M1.W2'], ['KM3.4', 'M1.U2'], ['KM3.6', 'M1.V2'],
        ['KM2.1', 'M1.W2'], ['KM2.3', 'M1.U2'], ['KM2.5', 'M1.V2'], ['KM2.2', 'KM2.4'], ['KM2.4', 'KM2.6'],
        ['G1.PE', 'M1.PE'],
        ['G1.L1', 'F1.1'], ['F1.2', 'G2.L'], ['G1.N', 'G2.N'], ['G1.PE', 'G2.PE'],
        ['G2.pos', 'KF1.LP'], ['G2.neg', 'KF1.M'],
        ['G2.pos', 'S1.3'], ['S1.4', 'KF1.I0'], ['G2.pos', 'S2.1'], ['S2.2', 'KF1.I1'],
        ['G2.pos', 'SL1.11'], ['SL1.12', 'KF1.I2'], ['G2.pos', 'KM1.13'], ['KM1.14', 'KF1.I3'],
        ['G2.pos', 'B1.pos'], ['G2.neg', 'B1.com'], ['B1.out', 'KF1.AI0'],
        ['F1.2', 'KF1.C0'], ['F1.2', 'KF1.C1'], ['F1.2', 'KF1.C2'], ['F1.2', 'KF1.C3'],
        ['KF1.Q0', 'KM1.A1'],
        ['KF1.Q1', 'KM3.31'], ['KM3.32', 'KM2.A1'],
        ['KF1.Q2', 'KM2.31'], ['KM2.32', 'KM3.A1'],
        ['KF1.Q3', 'H1.X1'], ['H1.X2', 'G1.N'],
        ['KM1.A2', 'G1.N'], ['KM2.A2', 'G1.N'], ['KM3.A2', 'G1.N'],
      ],
      on: ['QM1', 'F1'],
    },
    plant: {
      units: [
        ['S1', 'SUPPLY', 0, 400, { bar: 0.05, temp: 20 }],
        ['P1', 'PUMP', 150, 354, { motor: 'M1', head: 12, qmax: 150, flip: true }],
        ['T1', 'TANK', 420, 80, { vol: 200, hgt: 1.2, lvl0: 30, lt: 'B1', sw: [{ n: 'LSHH1', l: 95, t: 'SL1' }, { n: 'LSH1', l: 80, t: '' }, { n: 'LSL1', l: 20, t: '' }, { n: 'LSLL1', l: 8, t: '' }] }],
        ['V1', 'VALVE', 660, 258, { open: true, kv: 400 }],
        ['D1', 'DRAIN', 800, 278],
      ],
      pipes: [['S1.out', 'P1.in'], ['P1.out', 'T1.inA'], ['T1.out1', 'V1.a'], ['V1.b', 'D1.in']],
    },
    plc: 'KF1',
    ladder: {
      sym: { 'I0.0': 'Start / reset', 'I0.1': 'Stop (NC)', 'I0.2': 'LSHH1 OK (NC)', 'I0.3': 'KM1 feedback', 'IW64': 'LT1 level', 'MW10': 'Level %', 'M0.0': 'Automatic', 'M0.2': 'LSHH trip', 'M0.3': 'LT1 fault', 'M0.4': 'KM1 fault', 'Q0.0': 'Line KM1', 'Q0.1': 'Star KM2', 'Q0.2': 'Delta KM3', 'Q0.3': 'Alarm H1', 'T1': 'Star time', 'T2': 'LT1 fault delay', 'T3': 'KM1 check' },
      nets: [
        { c: 'The level in %: the transmitter reads 0 - 27648', s: [], o: [{ t: 'SCALE', in: 'IW64', lo: 0, hi: 100, out: 'MW10' }] },
        { c: 'Automatic: on by Start, off by Stop', s: [PAR([NO('I0.0')], [NO('M0.0')]), NO('I0.1')], o: [COIL('M0.0')] },
        { c: 'Line contactor: by Start or a low tank, until it is full, only with no fault', s: [PAR([NO('I0.0')], [CMP('MW10', '<=', '20')], [NO('Q0.0')]), NO('M0.0'), CMP('MW10', '<', '90'), NO('I0.2'), NC('M0.2'), NC('M0.3'), NC('M0.4')], o: [COIL('Q0.0'), { t: 'TON', a: 'T1', pt: 10 }] },
        { c: 'Star while the time runs (never with delta)', s: [NO('Q0.0'), NC('T1'), NC('Q0.2')], o: [COIL('Q0.1')] },
        { c: 'Delta once the time is over (never with star)', s: [NO('Q0.0'), NO('T1'), NC('Q0.1')], o: [COIL('Q0.2')] },
        { c: 'LSHH is wired NC (fail-safe): a high level or a broken wire trips and latches', s: [NC('I0.2')], o: [{ t: 'SET', a: 'M0.2' }] },
        { c: 'Transmitter below 2 % for 3 s = dead sensor or broken wire (0-10 V has no live zero)', s: [CMP('MW10', '<', '2')], o: [{ t: 'TON', a: 'T2', pt: 3 }] },
        { c: 'Latch the transmitter fault', s: [NO('T2')], o: [{ t: 'SET', a: 'M0.3' }] },
        { c: 'KM1 must confirm within 1 s (coil, contactor or wiring fault)', s: [NO('Q0.0'), NC('I0.3')], o: [{ t: 'TON', a: 'T3', pt: 1 }] },
        { c: 'Latch the contactor fault', s: [NO('T3')], o: [{ t: 'SET', a: 'M0.4' }] },
        { c: 'Start resets the trips once the cause is gone', s: [NO('I0.0'), NO('I0.2')], o: [{ t: 'RST', a: 'M0.2' }, { t: 'RST', a: 'M0.4' }] },
        { c: 'Start resets the transmitter fault when it reads again', s: [NO('I0.0'), CMP('MW10', '>=', '2')], o: [{ t: 'RST', a: 'M0.3' }] },
        { c: 'Alarm lamp for any latched fault', s: [PAR([NO('M0.2')], [NO('M0.3')], [NO('M0.4')])], o: [COIL('Q0.3')] },
      ],
    },
  });

  /* ---------- 2. Booster pump on an inverter ---------- */
  add('booster', {
    name: E('Booster pump on an inverter (VFD)', 'طلمبة بوستر على انفرتر'),
    desc: E('A pump on a VFD circulates water from a break tank through a consumer valve. Change the speed with RV1 and watch pressure and flow. B1 gives the pressure as 0-10 V: measure it.', 'طلمبة على انفرتر بتلف المية من تانك من خلال محبس استهلاك. غيّر السرعة من RV1 وراقب الضغط والتصرف. B1 بيطلع الضغط 0-10 فولت: قيسه.'),
    tasks: [
      E('Switch on QF1, turn SA1 to run, then turn RV1: pressure grows with the speed squared.', 'شغّل QF1 ولف SA1 للتشغيل، وبعدين لف RV1: الضغط بيزيد مع مربع السرعة.'),
      E('Close V1 slowly: flow drops, pressure rises, the motor current falls.', 'اقفل V1 بالراحة: التصرف يقل والضغط يزيد وتيار الموتور يقل.'),
      E('Measure B1 OUT to 0V with the multimeter and compare with PT1.', 'قيس B1 OUT مع 0V بالملتيميتر وقارنه بـPT1.'),
    ],
    circuit: {
      parts: [
        ['G1', 'SRC3', 40, 20], ['QF1', 'MCB3', 40, 150, { rating: 10, curve: 'C' }], ['U1', 'VFD', 20, 320, { kw: 1.5, ctrl: 'term', ref: 'ai', ramp: 4 }],
        ['M1', 'MOT3', 40, 640, { kw: 1.5, conn: 'delta' }],
        ['SA1', 'SEL2', 330, 440], ['RV1', 'POT', 330, 560, { r: 10, pos: 85 }],
        ['G2', 'DC24', 560, 420, { volt: 24 }], ['B1', 'TXV', 560, 560, { kind: 'press', proc: 0 }],
      ],
      wires: [
        ['G1.L1', 'QF1.1'], ['G1.L2', 'QF1.3'], ['G1.L3', 'QF1.5'],
        ['QF1.2', 'U1.R'], ['QF1.4', 'U1.S'], ['QF1.6', 'U1.T'],
        ['U1.U', 'M1.U1'], ['U1.V', 'M1.V1'], ['U1.W', 'M1.W1'],
        ['G1.PE', 'U1.PE'], ['U1.PE2', 'M1.PE'],
        ['U1.P24', 'SA1.3'], ['SA1.4', 'U1.DI1'],
        ['U1.P10', 'RV1.1'], ['RV1.3', 'U1.AGM'], ['RV1.W', 'U1.AI1'],
        ['G2.pos', 'B1.pos'], ['G2.neg', 'B1.com'],
      ],
      on: ['QF1'],
    },
    plant: {
      units: [
        ['T1', 'TANK', 0, 60, { vol: 1000, hgt: 2, lvl0: 70 }],
        ['P1', 'PUMP', 230, 216, { motor: 'M1', head: 40, qmax: 160, flip: true }],
        ['NRV1', 'CHECK', 300, 120],
        ['PT1', 'PT', 420, 78, { tx: 'B1', range: 6 }], ['PI1', 'PG', 520, 78, { range: 6 }],
        ['V1', 'VALVE', 620, 98, { open: true, kv: 30 }], ['FI1', 'FM', 750, 98],
      ],
      pipes: [['T1.out1', 'P1.in'], ['P1.out', 'NRV1.a'], ['NRV1.b', 'PT1.a'], ['PT1.b', 'PI1.a'], ['PI1.b', 'V1.a'], ['V1.b', 'FI1.a'], ['FI1.b', 'T1.inB']],
    },
  });

  /* ---------- 3. RO water station with a heat exchanger ---------- */
  add('ro', {
    name: E('RO water station with heat exchanger', 'محطة مية RO بمبادل حراري'),
    desc: E('City water is warmed in a plate heat exchanger, filtered (sand + cartridge), then a high-pressure pump feeds the RO membrane. Permeate goes to a tank, reject to drain. The PLC trips the pump on low suction pressure and stops it when the tank is full.', 'مية المدينة بتسخن في مبادل ألواح وتتفلتر (رمل + كارتريدج)، وبعدين طلمبة ضغط عالي بتغذي ممبرين RO. المية النقية لتانك والريجكت للصرف. الـPLC بيفصل الطلمبة لو ضغط السحب واطي وبيوقفها لما التانك يتملى.'),
    tasks: [
      E('Switch on QM1 and F1, press S1. Read the recovery and permeate on RO1.', 'شغّل QM1 وF1 واضغط S1. اقرا نسبة الاسترجاع والمية النقية على RO1.'),
      E('Close V3 (hot water): the feed cools and the permeate drops.', 'اقفل V3 (المية السخنة): الدخول يبرد والمية النقية تقل.'),
      E('Close V1 (inlet): PS1 drops, after 3 s the PLC trips the pump and lights H1. Press S1 to reset.', 'اقفل V1 (الدخول): PS1 يفصل، وبعد 3 ثواني الـPLC يوقف الطلمبة ويولع H1. اضغط S1 للريست.'),
      E('Let it run fast (x20): the filters clog. Backwash them from their properties.', 'شغّلها بسرعة (x20): الفلاتر بتتسد. اعملها باك واش من خصائصها.'),
    ],
    circuit: {
      parts: [
        ['G1', 'SRC3', 40, 20], ['QM1', 'MPCB', 40, 150, { set: 5 }], ['KM1', 'CONT3', 40, 320, { coil: '230VAC' }],
        ['M1', 'MOT3', 40, 600, { kw: 2.2, conn: 'delta' }],
        ['F1', 'MCB1', 700, 20, { rating: 6 }], ['G2', 'PSU', 800, 20], ['KF1', 'PLC24R', 700, 330],
        ['S1', 'PB_NO', 680, 600], ['S2', 'PB_NC', 770, 600], ['PS1', 'PRESS', 860, 600], ['SL1', 'FLOAT', 950, 600],
        ['H1', 'LAMP', 1040, 330, { volt: '230VAC', color: 'red' }],
      ],
      wires: [
        ['G1.L1', 'QM1.1'], ['G1.L2', 'QM1.3'], ['G1.L3', 'QM1.5'],
        ['QM1.2', 'KM1.1'], ['QM1.4', 'KM1.3'], ['QM1.6', 'KM1.5'],
        ['KM1.2', 'M1.U1'], ['KM1.4', 'M1.V1'], ['KM1.6', 'M1.W1'], ['G1.PE', 'M1.PE'],
        ['G1.L1', 'F1.1'], ['F1.2', 'G2.L'], ['G1.N', 'G2.N'], ['G1.PE', 'G2.PE'],
        ['G2.pos', 'KF1.LP'], ['G2.neg', 'KF1.M'],
        ['G2.pos', 'S1.3'], ['S1.4', 'KF1.I0'], ['G2.pos', 'S2.1'], ['S2.2', 'KF1.I1'],
        ['G2.pos', 'PS1.11'], ['PS1.14', 'KF1.I2'], ['G2.pos', 'SL1.11'], ['SL1.12', 'KF1.I3'],
        ['F1.2', 'KF1.C0'], ['F1.2', 'KF1.C1'],
        ['KF1.Q0', 'KM1.A1'], ['KM1.A2', 'G1.N'],
        ['KF1.Q1', 'H1.X1'], ['H1.X2', 'G1.N'],
      ],
      on: ['QM1', 'F1'],
    },
    plant: {
      units: [
        ['S1', 'SUPPLY', 0, 60, { bar: 2.0, temp: 15 }], ['V1', 'VALVE', 130, 56, { open: true, kv: 120 }],
        ['S2', 'SUPPLY', 0, 330, { bar: 1.0, temp: 40 }], ['V3', 'VALVE', 130, 326, { open: true, kv: 30 }],
        ['E1', 'HX', 260, 78], ['D2', 'DRAIN', 450, 352],
        ['F1', 'FILTER', 450, 74, { kind: 'sand' }], ['F2', 'FILTER', 580, 74, { kind: 'cart' }],
        ['PS1', 'PS', 700, 140, { sw: 'PS1', set: 0.45 }], ['PI1', 'PG', 790, 140, { range: 6 }],
        ['P1', 'PUMP', 880, 138, { motor: 'M1', head: 140, qmax: 30, flip: true }],
        ['PI2', 'PG', 1060, 60, { range: 16 }],
        ['RO1', 'RO', 1150, 84, { rej: 30 }],
        ['FI1', 'FM', 1420, 58], ['T1', 'TANK', 1560, 0, { vol: 300, hgt: 1.2, lvl0: 30, sw: [{ n: 'LSH1', l: 85, t: 'SL1' }, { n: 'LSL1', l: 15, t: '' }] }],
        ['V2', 'VALVE', 1420, 186, { open: true, kv: 30 }], ['D1', 'DRAIN', 1560, 300],
      ],
      pipes: [
        ['S1.out', 'V1.a'], ['V1.b', 'E1.cin'], ['S2.out', 'V3.a'], ['V3.b', 'E1.hin'], ['E1.hout', 'D2.in'],
        ['E1.cout', 'F1.in'], ['F1.out', 'F2.in'], ['F2.out', 'PS1.a'], ['PS1.b', 'PI1.a'], ['PI1.b', 'P1.in'],
        ['P1.out', 'PI2.a'], ['PI2.b', 'RO1.in'], ['RO1.perm', 'FI1.a'], ['FI1.b', 'T1.inA'], ['RO1.rej', 'V2.a'], ['V2.b', 'D1.in'],
      ],
    },
    plc: 'KF1',
    ladder: {
      sym: { 'I0.0': 'Start / reset', 'I0.1': 'Stop (NC)', 'I0.2': 'PS1 suction OK', 'I0.3': 'LSH1 not full (NC)', 'M0.0': 'Automatic', 'M0.1': 'LP fault', 'Q0.0': 'HP pump KM1', 'Q0.1': 'Fault lamp H1', 'T1': 'LP delay' },
      nets: [
        { c: 'Automatic: on by Start, off by Stop', s: [PAR([NO('I0.0')], [NO('M0.0')]), NO('I0.1')], o: [COIL('M0.0')] },
        { c: 'Low suction pressure for 3 s while running', s: [NO('M0.0'), NC('I0.2')], o: [{ t: 'TON', a: 'T1', pt: 3 }] },
        { c: 'Latch the low-pressure fault', s: [NO('T1')], o: [{ t: 'SET', a: 'M0.1' }] },
        { c: 'Start resets the fault', s: [NO('I0.0')], o: [{ t: 'RST', a: 'M0.1' }] },
        { c: 'HP pump: automatic, tank not full (LSH1 wired NC), no fault', s: [NO('M0.0'), NO('I0.3'), NC('M0.1')], o: [COIL('Q0.0')] },
        { c: 'Fault lamp', s: [NO('M0.1')], o: [COIL('Q0.1')] },
      ],
    },
  });

  /* empty project */
  PJ.empty = function () { const c = EL.newCircuit(); c.plant = EL.plant.newPlant(); c.name = E('My project', 'مشروعي'); c.proj = { id: 'mine' }; return c; };

  PJ.load = function (id) {
    const P = PJ.map[id];
    if (!P) return null;
    const c = EL.build(Object.assign({ name: P.name }, P.circuit));
    for (const t of P.circuit.on || []) { const p = c.parts.find((x) => x.tag === t); if (p) p.state.on = true; }
    c.plant = EL.plant.build(P.plant);
    c.proj = { id };
    if (P.plc && P.ladder) {
      const plc = c.parts.find((x) => x.tag === P.plc);
      if (plc) { plc.props.mode = 'ladder'; plc.props.lad = JSON.stringify(EL.ladder.sanitize(P.ladder)); }
    }
    return c;
  };
})(typeof window !== 'undefined' ? window : globalThis);
