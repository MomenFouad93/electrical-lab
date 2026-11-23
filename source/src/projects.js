/* Ready projects: a panel (circuit), a process (plant) and, when there is a PLC, a ladder program. */
(function (g) {
  const EL = g.EL;
  const E = (en, ar) => [en, ar];
  const PJ = (EL.projects = { map: {}, list: [] });
  const add = (id, o) => { PJ.map[id] = o; PJ.list.push(id); };
  PJ.add = add; // private project files (not in the public build) add themselves here
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

  /* ---------- 4. Blister packaging line: cartoner to case packer ---------- */
  add('line', {
    view: 'line',
    name: E('Packaging line: cartoner to case packer', 'خط تعبئة: من الكارتونر للكيس باكر'),
    desc: E('Cartons leave the cartoner at 120 per minute, pass the checkweigher, serialization, tamper-evident labeling and the reject station, turn on a curve, wait in a buffer, get turned and packed 96 to a case.', 'العلب بتطلع من الكارتونر 120 في الدقيقة، وتعدي على الميزان والسيريالايزيشن والليبل والرفض، وتلف في كيرف، وتستنى في البافر، وتتلف وتتعبى 96 في الكرتونة.'),
    tasks: [
      E('Start the line and watch one carton from the cartoner to the case packer. Read the transit time.', 'شغّل الخط وتابع علبة واحدة من الكارتونر للكيس باكر. اقرا زمن الرحلة.'),
      E('Slow C1 and CW1 to 15 m/min: two cartons sit on the weigh pan and good cartons get rejected.', 'هدّي C1 وCW1 لـ 15 متر/د: علبتين يقعدوا على كفة الميزان وعلب سليمة تترفض.'),
      E('In Test mode tap the case packer to stop it: the buffer fills and the cartoner stops at the high level.', 'في وضع الاختبار اضغط على الكيس باكر عشان توقفه: البافر يتملى والكارتونر يقف عند المستوى العالي.'),
      E('Make the C1 guide 121 mm: the carton jams. Fix it to carton width + 3 to 5 mm.', 'خلي جايد C1 121 مم: العلبة تزنق. صلّحه لعرض العلبة + 3 لـ 5 مم.'),
      E('Change the carton to a 6x10 pack and read the line check.', 'غيّر العلبة لـ 6×10 واقرا فحص الخط.'),
    ],
    line: { carton: { L: 120, W: 60, H: 25, g: 40 }, els: [['SRC', { rate: 120, speed: 30 }], ['CONV', { len: 3, speed: 30 }], ['CW', { speed: 45 }], ['SER', { speed: 45 }], ['TE', { speed: 45 }], ['REJ', { speed: 45 }], ['CURVE', { left: true, speed: 45 }], ['BUF', { len: 6, speed: 50 }], ['GAP', { speed: 65 }], ['TURN', { speed: 65 }], ['CONV', { len: 2, speed: 65, chain: 82.5, guide: 65 }], ['CP', { per: 96, maxcpm: 140, need: 'fl' }]] },
  });

  /* ---------- 5. Pharma water: city water to PW and WFI ---------- */
  const LOOP40 = { dn: 40, mat: 'ss', len: 20, loop: true }, LOOP25 = { dn: 25, mat: 'ss', len: 15, loop: true }, POUB = { dn: 15, mat: 'ss', len: 0.03 };
  const PVC32 = { dn: 32, mat: 'pvc', len: 3 }, SS25 = { dn: 25, mat: 'ss', len: 3 };
  add('water', {
    view: 'plant',
    name: E('Pharma water: city water to PW and WFI', 'مية الدوا: من مية البلد لـ PW و WFI'),
    desc: E('Break tank, multimedia and carbon filters, softener, antiscalant, 5 and 1 µm cartridges, two RO passes with NaOH, EDI, UV and a divert valve fill a 2000 L PW tank. A DN40 loop feeds two points of use and a still that fills a 600 L hot WFI tank with its own loop. Each analyser checks the water against USP / Ph. Eur.', 'تانك كسر، فلتر رمل وكربون، سوفتنر، مانع ترسيب، كارتريدج 5 و1 ميكرون، مرحلتين RO بينهم صودا، EDI، UV ومحبس تحويل بيملوا تانك PW 2000 لتر. لوب DN40 بيغذي نقطتين استخدام ومقطّر بيملا تانك WFI سخن 600 لتر وله لوب. كل محلل بيقارن المية بحدود الـUSP والأوروبي.'),
    tasks: [
      E('Run at 20x and watch the conductivity fall from 450 µS/cm (city) to about 0.1 after the EDI. The PW tank reads more because air CO2 dissolves through the vent. Read the PW and WFI tank fill times.', 'شغّل على 20x وتابع الكونداكتيفيتي وهي بتنزل من 450 (مية البلد) لحوالي 0.1 بعد الـEDI. تانك الـPW بيقرا أكتر عشان الـCO2 اللي في الهوا بيدوب من فلتر التهوية. اقرا زمن ملو تانك الـPW والـWFI.'),
      E('Set the carbon filter F2 to "Sand": chlorine reaches RO1. Watch the alarm and the permanent damage.', 'خلي فلتر الكربون F2 "رمل": الكلور يوصل لـ RO1. شوف الإنذار والتلف اللي مالوش رجوع.'),
      E('Turn the NaOH dosing DP2 off: CO2 passes RO2 and the EDI product gets worse. Turn the EDI off: the divert valve sends water to drain.', 'اقفل حقن الصودا DP2: الـCO2 يعدّي من RO2 والـEDI يسوء. اقفل الـEDI: محبس التحويل يرمي المية على الصرف.'),
      E('Change the PW loop pipes to DN65: the velocity falls below 1 m/s. Make the POU2 branch 0.5 m long: dead-leg alarm.', 'غيّر مواسير لوب الـPW لـ DN65: السرعة تنزل تحت 1 م/ث. خلي فرع POU2 طوله 0.5 م: إنذار رجل ميتة.'),
      E('Open POU1 and POU2 together and watch the PW tank level and its empty time. Change T2 to 600 L and compare.', 'افتح POU1 وPOU2 مع بعض وراقب مستوى تانك الـPW وزمن تفريغه. غيّر T2 لـ 600 لتر وقارن.'),
      E('Turn off the steam jacket of T3 (0 °C): the WFI cools below 70 °C and fails.', 'اقفل جاكيت البخار بتاع T3 (0 درجة): الـWFI يبرد تحت 70 درجة ويفشل.'),
    ],
    plant: {
      units: [
        ['S1', 'SUPPLY', 0, 200, { bar: 1.2, temp: 22, wq: 'city' }],
        ['T1', 'TANK', 140, 60, { vol: 3000, hgt: 2.0, lvl0: 60, fv: 90, q0: 'city', sw: [] }],
        ['P1', 'PUMP', 380, 216, { flip: true, local: true, qbep: 4, hbep: 45, eta: 0.55, lvt: 'T2', lon: 65, loff: 90, stk: 'T1' }],
        ['F1', 'FILTER', 560, 100, { kind: 'sand', dirt: 0.1 }],
        ['F2', 'FILTER', 690, 100, { kind: 'carbon', dirt: 0.1 }],
        ['SF1', 'SOFT', 820, 100, {}],
        ['DP1', 'DOSE', 960, 164, { chem: 'anti' }],
        ['F3', 'FILTER', 1100, 100, { kind: 'cart', dirt: 0.04 }],
        ['F4', 'FILTER', 1230, 100, { kind: 'cart1', dirt: 0.03 }],
        ['P2', 'PUMP', 1370, 164, { flip: true, local: true, qbep: 3.5, hbep: 120, eta: 0.55, lvt: 'T2', lon: 65, loff: 90, psl: 0.7 }],
        ['RO1', 'RO', 1500, 40, { rej: 9, area: 2, mrej: 98.5 }],
        ['D1', 'DRAIN', 1800, 120, {}],
        ['DP2', 'DOSE', 0, 560, { chem: 'naoh' }],
        ['P3', 'PUMP', 130, 570, { flip: true, local: true, qbep: 2.6, hbep: 100, eta: 0.5, lvt: 'T2', lon: 65, loff: 90 }],
        ['RO2', 'RO', 290, 440, { rej: 5, area: 5, mrej: 97 }],
        ['EDI1', 'EDI', 590, 420, {}],
        ['D2', 'DRAIN', 820, 520, {}],
        ['UV1', 'UV', 800, 394, {}],
        ['AIT1', 'QA', 960, 360, { grade: 'PW' }],
        ['XV1', 'DIV', 1090, 390, { lim: 1.1 }],
        ['D3', 'DRAIN', 1180, 560, {}],
        ['T2', 'TANK', 1280, 280, { vol: 2000, hgt: 1.8, lvl0: 55, q0: 'pw', sw: [] }],
        ['P4', 'PUMP', 1520, 436, { flip: true, local: true, qbep: 6, hbep: 45, eta: 0.55, lvt: 'T2', lon: 15, loff: 10, spd: 80 }],
        ['UV2', 'UV', 1640, 280, {}],
        ['J1', 'JUNC', 1810, 318, {}], ['J2', 'JUNC', 1930, 318, {}], ['J3', 'JUNC', 2050, 318, {}],
        ['POU1', 'POU', 1783, 400, { grade: 'PW' }], ['POU2', 'POU', 1903, 400, { grade: 'PW' }],
        ['AIT2', 'QA', 2130, 246, { grade: 'PW' }],
        ['V1', 'VALVE', 2270, 292, { dn: 40, vt: 'dia' }],
        ['WS1', 'STILL', 200, 1040, { steam: true, bar: 6, lvt: 'T3', lon: 65, loff: 90 }],
        ['D4', 'DRAIN', 340, 1300, {}],
        ['T3', 'TANK', 500, 980, { vol: 600, hgt: 1.2, lvl0: 50, q0: 'wfi', t0: 82, jkt: 82, sw: [] }],
        ['P5', 'PUMP', 740, 1136, { flip: true, local: true, qbep: 3, hbep: 40, eta: 0.45, lvt: 'T3', lon: 15, loff: 10, spd: 80 }],
        ['J4', 'JUNC', 880, 1060, {}], ['J5', 'JUNC', 1000, 1060, {}],
        ['POU3', 'POU', 853, 1140, { grade: 'WFI' }], ['POU4', 'POU', 973, 1140, { grade: 'WFI' }],
        ['AIT3', 'QA', 1080, 988, { grade: 'WFI' }],
        ['V2', 'VALVE', 1220, 1034, { dn: 25, vt: 'dia' }],
      ],
      pipes: [
        ['S1.out', 'T1.inA', { dn: 32, mat: 'pvc', len: 30 }], ['T1.out1', 'P1.in', { dn: 40, mat: 'pvc', len: 2 }], ['P1.out', 'F1.in', PVC32], ['F1.out', 'F2.in', PVC32], ['F2.out', 'SF1.in', PVC32], ['SF1.out', 'DP1.a', PVC32], ['DP1.b', 'F3.in', PVC32], ['F3.out', 'F4.in', PVC32], ['F4.out', 'P2.in', SS25],
        ['P2.out', 'RO1.in', SS25], ['RO1.rej', 'D1.in', { dn: 20, mat: 'ss', len: 3 }], ['RO1.perm', 'DP2.a', { dn: 25, mat: 'ss', len: 12 }], ['DP2.b', 'P3.in', SS25], ['P3.out', 'RO2.in', SS25], ['RO2.rej', 'D2.in', { dn: 20, mat: 'ss', len: 3 }],
        ['RO2.perm', 'EDI1.in', SS25], ['EDI1.rej', 'D2.in', { dn: 15, mat: 'ss', len: 3 }], ['EDI1.prod', 'UV1.a', SS25], ['UV1.b', 'AIT1.a', SS25], ['AIT1.b', 'XV1.in', SS25], ['XV1.drain', 'D3.in', SS25], ['XV1.out', 'T2.inA', SS25],
        ['T2.out1', 'P4.in', { dn: 50, mat: 'ss', len: 2 }], ['P4.out', 'UV2.a', LOOP40], ['UV2.b', 'J1.a', LOOP40], ['J1.b', 'J2.a', LOOP40], ['J2.b', 'J3.a', LOOP40], ['J3.b', 'AIT2.a', LOOP40], ['AIT2.b', 'V1.a', LOOP40], ['V1.b', 'T2.inB', LOOP40],
        ['J1.d', 'POU1.in', POUB], ['J2.d', 'POU2.in', POUB], ['J3.d', 'WS1.in', { dn: 20, mat: 'ss', len: 4 }], ['WS1.blow', 'D4.in', { dn: 15, mat: 'ss', len: 2 }], ['WS1.dist', 'T3.inA', { dn: 20, mat: 'ss', len: 4 }],
        ['T3.out1', 'P5.in', { dn: 32, mat: 'ss', len: 2 }], ['P5.out', 'J4.a', LOOP25], ['J4.b', 'J5.a', LOOP25], ['J5.b', 'AIT3.a', LOOP25], ['AIT3.b', 'V2.a', LOOP25], ['V2.b', 'T3.inB', LOOP25],
        ['J4.d', 'POU3.in', POUB], ['J5.d', 'POU4.in', POUB],
      ],
    },
  });

  /* ---------- 6. New Stilmas water station: pretreatment, two-pass RO, hot sanitisation, 3 m³ PW tank ---------- */
  const SW25 = { dn: 25, mat: 'ss', len: 3 }, SW40 = { dn: 40, mat: 'ss', len: 2 }, ROW25 = { dn: 25, mat: 'ss', len: 4 }, PW20 = { dn: 20, mat: 'ss', len: 4 }, LOOPS = { dn: 25, mat: 'ss', len: 15, loop: true };
  add('stilmas', {
    view: 'plant',
    name: E('New Stilmas water station (PW)', 'محطة مية Stilmas الجديدة (PW)'),
    desc: E('A two-pass RO purified-water station: soft water through a 5 µm cartridge into the 300 L break tank TK50A, SMBS and NaOH dosing, the E50 heater/cooler, RO pass 1 BRO 28 (3 vessels), membrane degasser MD50, RO pass 2 PHRO 24 (2 vessels), divert valves XV50-27A/B and 1000 L/h of PW into a 3 m³ tank with a UV loop. Start, stop and hot-sanitise it from the CB2 panel.', 'محطة مية منقاة بـRO على مرحلتين: مية سوفت بتعدي على كارتريدج 5 ميكرون لتانك الكسر TK50A ‏300 لتر، حقن SMBS وصودا، المسخّن/المبرّد E50، المرحلة الأولى BRO 28 (3 فيسلز)، الديجاسر MD50، المرحلة التانية PHRO 24 (2 فيسل)، محابس التحويل XV50-27A/B، و1000 لتر/ساعة PW لتانك 3 م³ بلوب فيه UV. شغّلها ووقّفها وعقّمها بالسخونية من لوحة CB2.'),
    tasks: [
      E('Run at 20x. Read the PW production on FT50-14B (about 1000 L/h, 17 L/min) and the fill time of the 3 m³ PW tank TK-PW. Turn Production OFF on CB2 and watch the station stop.', 'شغّل على 20x. اقرا إنتاج الـPW على FT50-14B (حوالي 1000 لتر/ساعة، 17 لتر/دقيقة) وزمن ملو تانك الـPW ‏3 م³ TK-PW. اقفل الإنتاج من CB2 وشوف المحطة بتقف.'),
      E('Open POU1, POU2 and POU3 and read the PW tank empty time. Production starts by itself when the tank falls below 65 %.', 'افتح POU1 وPOU2 وPOU3 واقرا زمن تفريغ تانك الـPW. الإنتاج بيشتغل لوحده لما التانك ينزل تحت 65٪.'),
      E('Turn the SMBS dosing PD67-25 off: chlorine reaches BRO-28. There is no carbon filter in this design, so the SMBS and the redox meter protect the membranes.', 'اقفل حقن الـSMBS ‏PD67-25: الكلور يوصل لـBRO-28. التصميم ده مفيهوش فلتر كربون، فالـSMBS وجهاز الـredox هما اللي بيحموا الممبرين.'),
      E('Turn the degasser MD50 off or the NaOH dosing PD67-10 off: CO2 passes and the PW conductivity rises. Watch XV50-27A/B send the water back to the break tank through XV50-59.', 'اقفل الديجاسر MD50 أو حقن الصودا PD67-10: الـCO2 يعدّي وكونداكتيفيتي الـPW تزيد. شوف XV50-27A/B بيرجّع المية لتانك الكسر عن طريق XV50-59.'),
      E('Press "Hot sanit" on CB2: XV50-12A to drain closes, XV50-13A opens, and E50 heats the RO loop to 80 °C with 18 kW of steam. Hot water goes back to TK50A, never to the PW tank. Read the heat-up time, the 30 min hold and the cool-down.', 'اضغط "Hot sanit" على CB2: XV50-12A اللي على الصرف بيقفل، وXV50-13A بيفتح، والـE50 بيسخّن لوب الـRO لـ80 درجة ببخار 18 ك.و. المية السخنة بترجع لـTK50A ومش بتروح لتانك الـPW أبدًا. اقرا زمن التسخين والتثبيت 30 دقيقة والتبريد.'),
      E('Assumed values: the 1 m³ raw tank TK-Z1 and its pump, the filter STF-SA-20, the softener STS-A-80D, the PW loop pump (a duty / standby pair on site, one shown), UV, the DN25 loop with 3 points of use, and the divert limits 1.1 µS/cm and 40 °C.', 'قيم مفترضة: تانك المية الخام 1 م³ TK-Z1 وطلمبته، فلتر STF-SA-20، السوفتنر STS-A-80D، طلمبة لوب الـPW (في الموقع اتنين شغال واحتياطي، مرسوم واحدة)، الـUV، اللوب DN25 بـ3 نقط استخدام، وحدود التحويل 1.1 ميكروسيمنز و40 درجة.'),
    ],
    plant: {
      units: [
        ['CB2', 'CTRL', 130, -230, { prod: true, sanit: false, dist: true, hold: 30, stank: 'TK50A', dclose: 'XV50-12A', dopen: 'XV50-13A' }],
        ['RW1', 'SUPPLY', 0, 140, { bar: 0.5, temp: 22, wq: 'city' }],
        ['TK-Z1', 'TANK', 130, 0, { vol: 1000, hgt: 1.3, lvl0: 70, fv: 90, q0: 'city', sw: [] }],
        ['P-Z1', 'PUMP', 360, 156, { flip: true, local: true, grp: 'prod', qbep: 1.8, hbep: 40, eta: 0.5, stk: 'TK-Z1' }],
        ['STF-SA-20', 'FILTER', 540, 40, { kind: 'sand', dirt: 0.08 }],
        ['STS-A-80D', 'SOFT', 660, 40, { cap: 30 }],
        ['CF64-12', 'FILTER', 790, 40, { kind: 'cart', dirt: 0.04 }],
        ['J-SW', 'JUNC', 870, 152, {}],
        ['XV64-85', 'VALVE', 700, 250, { dn: 0, kv: 4 }],
        ['TK50A', 'TANK', 920, 0, { vol: 300, hgt: 1.0, lvl0: 70, fv: 85, q0: 'pw', ins: true, sw: [] }],
        ['PD67-25', 'DOSE', 1150, 170, { chem: 'smbs' }],
        ['P50-2A', 'PUMP', 1270, 156, { flip: true, local: true, grp: 'prod', sanrun: true, qbep: 1.8, hbep: 30, eta: 0.5, lvt: 'TK-PW', lon: 65, loff: 90, stk: 'TK50A' }],
        ['PD67-10', 'DOSE', 1470, 170, { chem: 'naoh' }],
        ['E50', 'TEMP', 1590, 136, { set: 16, san: 80, kwh: 18, kwc: 12 }],
        ['P50A', 'PUMP', 1740, 156, { flip: true, local: true, grp: 'prod', sanrun: true, qbep: 1.6, hbep: 115, eta: 0.5, lvt: 'TK-PW', lon: 65, loff: 90, psl: 0.5 }],
        ['PT50-4A', 'PG', 1910, 96, { range: 25 }],
        ['BRO-28', 'RO', 2000, 40, { rej: 100, area: 1.0, mrej: 99, hot: true }],
        ['J-REJ', 'JUNC', 2270, 84, {}],
        ['FT50-11A', 'FM', 2330, 58, {}],
        ['FCV50-11A', 'VALVE', 2450, 58, { dn: 0, kv: 0.5 }],
        ['J-11', 'JUNC', 2560, 84, {}],
        ['XV50-12A', 'VALVE', 2620, 58, { dn: 20, vt: 'dia' }],
        ['M2B', 'DRAIN', 2730, 78, {}],
        ['XV50-13A', 'VALVE', 2520, 200, { dn: 20, vt: 'dia', open: false }],
        ['FCV50-67A', 'VALVE', 2250, 200, { dn: 0, kv: 0.18 }],
        ['FT50-67A', 'FM', 2110, 220, {}],
        ['FT50-14A', 'FM', 120, 440, {}],
        ['MD50', 'DEG', 250, 470, { on: true }],
        ['P50B', 'PUMP', 360, 556, { flip: true, local: true, grp: 'prod', sanrun: true, qbep: 1.2, hbep: 100, eta: 0.5, lvt: 'TK-PW', lon: 65, loff: 90 }],
        ['PT50-4B', 'PG', 540, 496, { range: 25 }],
        ['PHRO-24', 'RO', 630, 440, { rej: 2, area: 1, mrej: 98, hot: true }],
        ['AE50-17B', 'QA', 900, 400, { grade: 'PW' }],
        ['FT50-14B', 'FM', 1030, 446, {}],
        ['XV50-27A/B', 'DIV', 1150, 430, { lim: 1.1, tmax: 40 }],
        ['XV50-59', 'VALVE', 1170, 560, { dn: 20, vt: 'dia' }],
        ['TK-PW', 'TANK', 1330, 330, { vol: 3000, hgt: 2.0, lvl0: 60, q0: 'pw', ins: true, sw: [] }],
        ['P-PW1', 'PUMP', 1620, 516, { flip: true, local: true, grp: 'dist', qbep: 3, hbep: 40, eta: 0.5, lvt: 'TK-PW', lon: 15, loff: 10, spd: 85 }],
        ['UV-PW', 'UV', 1900, 420, {}],
        ['J1', 'JUNC', 2080, 458, {}], ['J2', 'JUNC', 2200, 458, {}], ['J3', 'JUNC', 2320, 458, {}],
        ['POU1', 'POU', 2053, 540, { grade: 'PW' }], ['POU2', 'POU', 2173, 540, { grade: 'PW' }], ['POU3', 'POU', 2293, 540, { grade: 'PW' }],
        ['AE-PW', 'QA', 2400, 380, { grade: 'PW' }],
        ['V-BP', 'VALVE', 2540, 426, { dn: 25, vt: 'dia' }],
      ],
      pipes: [
        ['RW1.out', 'TK-Z1.inA', { dn: 32, mat: 'pvc', len: 20 }], ['TK-Z1.out1', 'P-Z1.in', { dn: 40, mat: 'pvc', len: 2 }], ['P-Z1.out', 'STF-SA-20.in', SW25], ['STF-SA-20.out', 'STS-A-80D.in', SW25], ['STS-A-80D.out', 'CF64-12.in', SW25], ['CF64-12.out', 'J-SW.a', SW25],
        ['J-SW.b', 'TK50A.inA', SW25], ['J-SW.d', 'XV64-85.a', SW25], ['XV64-85.b', 'TK-Z1.inB', { dn: 25, mat: 'ss', len: 10 }],
        ['TK50A.out1', 'PD67-25.a', SW40], ['PD67-25.b', 'P50-2A.in', SW40], ['P50-2A.out', 'PD67-10.a', SW25], ['PD67-10.b', 'E50.a', SW25], ['E50.b', 'P50A.in', SW25], ['P50A.out', 'PT50-4A.a', SW25], ['PT50-4A.b', 'BRO-28.in', SW25],
        ['BRO-28.rej', 'J-REJ.a', { dn: 20, mat: 'ss', len: 1 }], ['J-REJ.b', 'FT50-11A.a', { dn: 20, mat: 'ss', len: 1 }], ['FT50-11A.b', 'FCV50-11A.a', { dn: 20, mat: 'ss', len: 1 }], ['FCV50-11A.b', 'J-11.a', { dn: 25, mat: 'ss', len: 1 }],
        ['J-11.b', 'XV50-12A.a', { dn: 25, mat: 'ss', len: 1 }], ['XV50-12A.b', 'M2B.in', { dn: 40, mat: 'ss', len: 5 }], ['J-11.d', 'XV50-13A.a', { dn: 25, mat: 'ss', len: 1 }], ['XV50-13A.b', 'TK50A.inB', ROW25],
        ['J-REJ.d', 'FCV50-67A.a', { dn: 20, mat: 'ss', len: 1 }], ['FCV50-67A.b', 'FT50-67A.a', { dn: 20, mat: 'ss', len: 1 }], ['FT50-67A.b', 'TK50A.inB', ROW25],
        ['BRO-28.perm', 'FT50-14A.a', ROW25], ['FT50-14A.b', 'MD50.a', ROW25], ['MD50.b', 'P50B.in', ROW25], ['P50B.out', 'PT50-4B.a', PW20], ['PT50-4B.b', 'PHRO-24.in', PW20], ['PHRO-24.rej', 'TK50A.inB', { dn: 20, mat: 'ss', len: 8 }],
        ['PHRO-24.perm', 'AE50-17B.a', PW20], ['AE50-17B.b', 'FT50-14B.a', PW20], ['FT50-14B.b', 'XV50-27A/B.in', PW20], ['XV50-27A/B.out', 'TK-PW.inA', PW20], ['XV50-27A/B.drain', 'XV50-59.a', PW20], ['XV50-59.b', 'TK50A.inB', PW20],
        ['TK-PW.out1', 'P-PW1.in', { dn: 40, mat: 'ss', len: 2 }], ['P-PW1.out', 'UV-PW.a', LOOPS],
        ['UV-PW.b', 'J1.a', LOOPS], ['J1.b', 'J2.a', LOOPS], ['J2.b', 'J3.a', LOOPS], ['J3.b', 'AE-PW.a', LOOPS], ['AE-PW.b', 'V-BP.a', LOOPS], ['V-BP.b', 'TK-PW.inB', LOOPS],
        ['J1.d', 'POU1.in', POUB], ['J2.d', 'POU2.in', POUB], ['J3.d', 'POU3.in', POUB],
      ],
    },
  });

  /* empty project */
  PJ.empty = function () { const c = EL.newCircuit(); c.plant = EL.plant.newPlant(); c.name = E('My project', 'مشروعي'); c.proj = { id: 'mine' }; return c; };

  PJ.load = function (id) {
    const P = PJ.map[id];
    if (!P) return null;
    const c = P.circuit ? EL.build(Object.assign({ name: P.name }, P.circuit)) : Object.assign(EL.newCircuit(), { name: P.name });
    for (const t of (P.circuit && P.circuit.on) || []) { const p = c.parts.find((x) => x.tag === t); if (p) p.state.on = true; }
    c.plant = P.plant ? EL.plant.build(P.plant) : EL.plant.newPlant();
    if (P.line && EL.line) c.line = EL.line.build(P.line);
    c.proj = { id };
    if (P.plc && P.ladder) {
      const plc = c.parts.find((x) => x.tag === P.plc);
      if (plc) { plc.props.mode = 'ladder'; plc.props.lad = JSON.stringify(EL.ladder.sanitize(P.ladder)); }
    }
    return c;
  };
})(typeof window !== 'undefined' ? window : globalThis);
