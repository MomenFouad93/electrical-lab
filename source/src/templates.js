/* Ready-made circuits */
(function (g) {
  const EL = g.EL;
  const T = (en, ar) => [en, ar];
  const TPL = (EL.templates = {});

  /* ---- 1. DOL starter ---- */
  TPL.dol = {
    name: T('DOL motor starter', 'تشغيل موتور مباشر (DOL)'),
    desc: T('Start/stop with seal-in contact, thermal overload and two indicator lamps. Switch QF1 ON, then press SB2.', 'ستارت/ستوب بكونتاكت تثبيت وثيرمال أوفرلود ولمبتين بيان. اقفل QF1 وبعدين اضغط SB2.'),
    spec() {
      return {
        parts: [
          ['G1', 'SRC3', 40, 20], ['QF1', 'MCB3', 40, 150, { rating: 16, curve: 'C' }], ['KM1', 'CONT3', 40, 320, { coil: '230VAC' }],
          ['FR1', 'OL', 40, 590, { set: 3.5 }], ['M1', 'MOT3', 30, 800, { kw: 1.5, conn: 'delta' }],
          ['FU1', 'FUSE', 400, 150, { rating: 2 }], ['SB1', 'PB_NC', 340, 280], ['SB2', 'PB_NO', 430, 280],
          ['HL1', 'LAMP', 520, 420, { volt: '230VAC', color: 'green' }], ['HL2', 'LAMP', 590, 420, { volt: '230VAC', color: 'red' }],
        ],
        wires: [
          ['G1.L1', 'QF1.1'], ['G1.L2', 'QF1.3'], ['G1.L3', 'QF1.5'],
          ['QF1.2', 'KM1.1'], ['QF1.4', 'KM1.3'], ['QF1.6', 'KM1.5'],
          ['KM1.2', 'FR1.1'], ['KM1.4', 'FR1.3'], ['KM1.6', 'FR1.5'],
          ['FR1.2', 'M1.U1'], ['FR1.4', 'M1.V1'], ['FR1.6', 'M1.W1'], ['G1.PE', 'M1.PE'],
          ['QF1.2', 'FU1.1'], ['FU1.2', 'SB1.1'], ['SB1.2', 'SB2.3'], ['SB1.2', 'KM1.13'], ['SB2.4', 'KM1.14'], ['SB2.4', 'FR1.95'], ['FR1.96', 'KM1.A1'], ['KM1.A2', 'G1.N'],
          ['FU1.2', 'KM1.23'], ['KM1.24', 'HL1.X1'], ['HL1.X2', 'G1.N'],
          ['FU1.2', 'FR1.97'], ['FR1.98', 'HL2.X1'], ['HL2.X2', 'G1.N'],
        ],
      };
    },
  };

  /* ---- 2. Star-delta ---- */
  TPL.stardelta = {
    name: T('Star-delta starter', 'ستار-دلتا'),
    desc: T('Main KM1, star KM2, delta KM3 with interlocks and a star-delta timer KT1. Press SB2 and watch the current and speed.', 'مين KM1 وستار KM2 ودلتا KM3 بإنترلوك وتايمر KT1. اضغط SB2 وراقب التيار والسرعة.'),
    spec() {
      return {
        parts: [
          ['G1', 'SRC3', 40, 20], ['QF1', 'MCB3', 40, 150, { rating: 16, curve: 'C' }],
          ['KM1', 'CONT3', 40, 320, { coil: '230VAC' }],
          ['FR1', 'OL', 40, 590, { set: 3.5 }],
          ['KM3', 'CONT3', 340, 590, { coil: '230VAC' }],
          ['KM2', 'CONT3', 340, 860, { coil: '230VAC' }],
          ['M1', 'MOT3', 30, 860, { kw: 1.5, conn: '6wire' }],
          ['FU1', 'FUSE', 700, 150, { rating: 2 }], ['SB1', 'PB_NC', 640, 280], ['SB2', 'PB_NO', 720, 280],
          ['KT1', 'SDT', 640, 420, { time: 6 }],
          ['HL1', 'LAMP', 860, 600, { volt: '230VAC', color: 'amber' }], ['HL2', 'LAMP', 920, 600, { volt: '230VAC', color: 'green' }],
        ],
        wires: [
          ['G1.L1', 'QF1.1'], ['G1.L2', 'QF1.3'], ['G1.L3', 'QF1.5'],
          ['QF1.2', 'KM1.1'], ['QF1.4', 'KM1.3'], ['QF1.6', 'KM1.5'],
          ['KM1.2', 'FR1.1'], ['KM1.4', 'FR1.3'], ['KM1.6', 'FR1.5'],
          ['FR1.2', 'M1.U1'], ['FR1.4', 'M1.V1'], ['FR1.6', 'M1.W1'],
          ['FR1.2', 'KM3.1'], ['FR1.4', 'KM3.3'], ['FR1.6', 'KM3.5'],
          ['KM3.2', 'M1.W2'], ['KM3.4', 'M1.U2'], ['KM3.6', 'M1.V2'],
          ['KM2.1', 'M1.W2'], ['KM2.3', 'M1.U2'], ['KM2.5', 'M1.V2'],
          ['KM2.2', 'KM2.4'], ['KM2.4', 'KM2.6'],
          ['G1.PE', 'M1.PE'],
          ['QF1.2', 'FU1.1'], ['FU1.2', 'FR1.95'], ['FR1.96', 'SB1.1'], ['SB1.2', 'SB2.3'], ['SB1.2', 'KM1.13'],
          ['SB2.4', 'KM1.14'], ['SB2.4', 'KM1.A1'], ['SB2.4', 'KT1.A1'], ['SB2.4', 'KT1.17'], ['SB2.4', 'KT1.27'],
          ['KT1.18', 'KM3.31'], ['KM3.32', 'KM2.A1'],
          ['KT1.28', 'KM2.31'], ['KM2.32', 'KM3.A1'],
          ['KM1.A2', 'G1.N'], ['KM2.A2', 'G1.N'], ['KM3.A2', 'G1.N'], ['KT1.A2', 'G1.N'],
          ['SB2.4', 'KM2.13'], ['KM2.14', 'HL1.X1'], ['HL1.X2', 'G1.N'],
          ['SB2.4', 'KM3.13'], ['KM3.14', 'HL2.X1'], ['HL2.X2', 'G1.N'],
        ],
      };
    },
  };

  /* ---- 3. Forward / reverse ---- */
  TPL.fwdrev = {
    name: T('Forward / reverse starter', 'تشغيل أمامي / عكسي'),
    desc: T('Two contactors with electrical interlock (NC contacts in each coil circuit). Swaps L1 and L3 for reverse.', 'كونتاكتورين بإنترلوك كهربائي (NC في دائرة كل كويل). بيبدّل L1 مع L3 للعكس.'),
    spec() {
      return {
        parts: [
          ['G1', 'SRC3', 40, 20], ['QF1', 'MPCB', 40, 150, { set: 3.5 }],
          ['KM1', 'CONT3', 40, 320, { coil: '230VAC' }], ['KM2', 'CONT3', 340, 320, { coil: '230VAC' }],
          ['FR1', 'OL', 40, 600, { set: 3.5 }], ['M1', 'MOT3', 30, 810, { kw: 1.5, conn: 'delta' }],
          ['FU1', 'FUSE', 700, 100, { rating: 2 }], ['SB1', 'PB_NC', 640, 240], ['SB2', 'PB_NO', 720, 240], ['SB3', 'PB_NO', 800, 240],
          ['HL1', 'LAMP', 760, 520, { volt: '230VAC', color: 'green' }], ['HL2', 'LAMP', 830, 520, { volt: '230VAC', color: 'amber' }],
        ],
        wires: [
          ['G1.L1', 'QF1.1'], ['G1.L2', 'QF1.3'], ['G1.L3', 'QF1.5'],
          ['QF1.2', 'KM1.1'], ['QF1.4', 'KM1.3'], ['QF1.6', 'KM1.5'],
          ['QF1.2', 'KM2.1'], ['QF1.4', 'KM2.3'], ['QF1.6', 'KM2.5'],
          ['KM2.2', 'KM1.6'], ['KM2.4', 'KM1.4'], ['KM2.6', 'KM1.2'],
          ['KM1.2', 'FR1.1'], ['KM1.4', 'FR1.3'], ['KM1.6', 'FR1.5'],
          ['FR1.2', 'M1.U1'], ['FR1.4', 'M1.V1'], ['FR1.6', 'M1.W1'], ['G1.PE', 'M1.PE'],
          ['QF1.2', 'FU1.1'], ['FU1.2', 'FR1.95'], ['FR1.96', 'SB1.1'],
          ['SB1.2', 'SB2.3'], ['SB1.2', 'KM1.13'], ['SB2.4', 'KM1.14'], ['SB2.4', 'KM2.31'], ['KM2.32', 'KM1.A1'],
          ['SB1.2', 'SB3.3'], ['SB1.2', 'KM2.13'], ['SB3.4', 'KM2.14'], ['SB3.4', 'KM1.31'], ['KM1.32', 'KM2.A1'],
          ['KM1.A2', 'G1.N'], ['KM2.A2', 'G1.N'],
          ['FU1.2', 'KM1.23'], ['KM1.24', 'HL1.X1'], ['HL1.X2', 'G1.N'],
          ['FU1.2', 'KM2.23'], ['KM2.24', 'HL2.X1'], ['HL2.X2', 'G1.N'],
        ],
      };
    },
  };

  /* ---- 4. VFD ---- */
  TPL.vfd = {
    name: T('Inverter (VFD) with pot and start switch', 'انفرتر مع بوت وسويتش تشغيل'),
    desc: T('Motor on an inverter. Turn SA1 for run, set speed with RV1 (0-10 V to AI1). Try measuring the DC bus after switching off.', 'موتور على انفرتر. لف SA1 للتشغيل واظبط السرعة من RV1 (0-10 فولت على AI1). جرب تقيس DC bus بعد الفصل.'),
    spec() {
      return {
        parts: [
          ['G1', 'SRC3', 40, 20], ['QF1', 'MCB3', 40, 150, { rating: 10, curve: 'C' }], ['U1', 'VFD', 20, 320, { kw: 1.5, ctrl: 'term', ref: 'ai', ramp: 4 }],
          ['M1', 'MOT3', 40, 640, { kw: 1.5, conn: 'delta' }],
          ['SA1', 'SEL2', 330, 440], ['RV1', 'POT', 330, 560, { r: 10, pos: 60 }],
        ],
        wires: [
          ['G1.L1', 'QF1.1'], ['G1.L2', 'QF1.3'], ['G1.L3', 'QF1.5'],
          ['QF1.2', 'U1.R'], ['QF1.4', 'U1.S'], ['QF1.6', 'U1.T'],
          ['U1.U', 'M1.U1'], ['U1.V', 'M1.V1'], ['U1.W', 'M1.W1'],
          ['G1.PE', 'U1.PE'], ['U1.PE2', 'M1.PE'],
          ['U1.P24', 'SA1.3'], ['SA1.4', 'U1.DI1'],
          ['U1.P10', 'RV1.1'], ['RV1.3', 'U1.AGM'], ['RV1.W', 'U1.AI1'],
        ],
      };
    },
  };

  /* ---- 5. 4-20 mA loop ---- */
  TPL.loop = {
    name: T('4-20 mA loop', 'لوب 4-20 ملي أمبير'),
    desc: T('24 V supply, 2-wire transmitter and a PLC analog input. TB1 is a disconnect terminal: press it to open the loop and put your meter in series.', '24 فولت وترانسميتر 2 سلك ومدخل أنالوج PLC. TB1 ترمينال فصل: اضغط عليه عشان تفتح اللوب وتحط الميتر على التوالي.'),
    spec() {
      return {
        parts: [
          ['G1', 'DC24', 60, 40, { volt: 24 }], ['B1', 'TX', 240, 140, { proc: 50 }], ['TB1', 'PB_NC', 250, 330], ['A1', 'AI250', 380, 340],
        ],
        wires: [['G1.pos', 'B1.pos'], ['B1.neg', 'TB1.1'], ['TB1.2', 'A1.pos'], ['A1.neg', 'G1.neg']],
      };
    },
  };

  /* ---- 6. Valve bench for the mA calibrator ---- */
  TPL.valves = {
    name: T('Valve bench (mA calibrator practice)', 'ترابيزة فالفات (تدريب الكاليبريتور)'),
    desc: T('Three unwired valves: 24 V solenoid, low-power solenoid, I/P valve. Choose the mA calibrator, clip OUT+ and OUT- on a valve and source a current.', 'تلات فالفات من غير توصيل: سولينويد 24 فولت وسولينويد قدرة منخفضة وI/P. اختار الكاليبريتور وحط OUT+ وOUT- على فالف وولّد تيار.'),
    spec() {
      return {
        parts: [['YV1', 'SOL', 60, 60, { model: 'std' }], ['YV2', 'SOL', 220, 60, { model: 'lp' }], ['YV3', 'SOL', 380, 60, { model: 'ip' }], ['G1', 'DC24', 560, 60], ['SA1', 'SEL2', 580, 240], ['YV4', 'SOL', 560, 380, { model: 'std' }]],
        wires: [['G1.pos', 'SA1.3'], ['SA1.4', 'YV4.pos'], ['YV4.neg', 'G1.neg']],
      };
    },
  };

  /* ---- 7. Sensor to PLC ---- */
  TPL.sensor = {
    name: T('Proximity sensor to PLC input', 'سنسور بروكسيميتي لمدخل PLC'),
    desc: T('PNP sensor wired to a PLC input. Click the sensor to bring a metal target near and read the DI.', 'سنسور PNP متوصل بمدخل PLC. اضغط على السنسور عشان تقرّب معدن واقرا الـDI.'),
    spec() {
      return {
        parts: [['G1', 'DC24', 60, 40], ['B1', 'PROX', 240, 80, { out: 'PNP', logic: 'NO' }], ['A1', 'PLCDI', 400, 160]],
        wires: [['G1.pos', 'B1.BN'], ['G1.neg', 'B1.BU'], ['B1.BK', 'A1.I0'], ['A1.M', 'G1.neg']],
      };
    },
  };

  /* ---- 8. Basic circuit ---- */
  TPL.basic = {
    name: T('Basic DC circuit (meter practice)', 'دائرة DC بسيطة (تدريب الميتر)'),
    desc: T('24 V supply, switch, 3 resistors and an LED with its series resistor. Measure voltage drops and current.', '24 فولت وسويتش و3 مقاومات وLED بمقاومته. قيس هبوط الجهد والتيار.'),
    spec() {
      return {
        parts: [['G1', 'DC24', 40, 60], ['SA1', 'SEL2', 200, 40], ['R1', 'RES', 320, 40, { r: 1000 }], ['R2', 'RES', 440, 40, { r: 2200 }], ['R3', 'RES', 560, 40, { r: 4700 }], ['R4', 'RES', 320, 240, { r: 1000 }], ['D1', 'DIO', 440, 240, { kind: 'green' }]],
        wires: [['G1.pos', 'SA1.3'], ['SA1.4', 'R1.A'], ['R1.B', 'R2.A'], ['R2.B', 'R3.A'], ['R3.B', 'G1.neg'], ['SA1.4', 'R4.A'], ['R4.B', 'D1.A'], ['D1.K', 'G1.neg']],
      };
    },
  };

  /* ---- 9. Power supply + relay ---- */
  TPL.psu = {
    name: T('24 V control with PSU and relay', 'تحكم 24 فولت بباور سبلاي وريلاي'),
    desc: T('230 V to 24 V DC supply drives a relay KA1. The relay contact switches a 230 V lamp.', 'باور سبلاي 230 إلى 24 فولت DC بيشغل ريلاي KA1. كونتاكت الريلاي بيشغل لمبة 230 فولت.'),
    spec() {
      return {
        parts: [['G1', 'SRC1', 40, 20], ['QF1', 'MCB1', 60, 150, { rating: 6, curve: 'C' }], ['PS1', 'PSU', 180, 150], ['SA1', 'SEL2', 220, 330], ['KA1', 'RLY2', 340, 330, { coil: '24VDC' }], ['HL1', 'LAMP', 360, 560, { volt: '230VAC', color: 'white' }]],
        wires: [
          ['G1.L', 'QF1.1'], ['QF1.2', 'PS1.L'], ['G1.N', 'PS1.N'], ['G1.PE', 'PS1.PE'],
          ['PS1.pos', 'SA1.3'], ['SA1.4', 'KA1.A1'], ['KA1.A2', 'PS1.neg'],
          ['QF1.2', 'KA1.11'], ['KA1.14', 'HL1.X1'], ['HL1.X2', 'G1.N'],
        ],
      };
    },
  };

  EL.templateList = ['dol', 'stardelta', 'fwdrev', 'vfd', 'loop', 'valves', 'sensor', 'basic', 'psu'];
  EL.loadTemplate = function (id) { const t = TPL[id]; const c = EL.build(Object.assign({ name: t.name }, t.spec())); c.tpl = id; return c; };
})(typeof window !== 'undefined' ? window : globalThis);
