/* Pharma water: pipe and valve sizes, pump curves, water quality through the plant, and the
   units from city water to PW and WFI (softener, dosing, EDI, UV, still, divert valve, points of use,
   quality analyser). Hooks into plant.js through PL.X (per-unit net/step), PL.pipeG and PL.quality.
   Numbers come from the team spec (typical values, not validated design values). */
(function (g) {
  const EL = g.EL, PL = EL.plant, U = PL.defs;
  const E = (en, ar) => [en, ar];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const W = (EL.water = {});

  /* ---------- sizes ---------- */
  W.DN = [15, 20, 25, 32, 40, 50, 65, 80];
  W.ID = { ss: { 15: 16, 20: 20, 25: 26, 32: 32, 40: 38, 50: 50, 65: 66, 80: 81 }, pvc: { 15: 17, 20: 21.2, 25: 27.2, 32: 34, 40: 42.6, 50: 53.6, 65: 64, 80: 76.8 } };
  W.KV = { dia: { 15: 4, 20: 7, 25: 13, 32: 22, 40: 35, 50: 60, 65: 100, 80: 150 }, ball: { 15: 17, 20: 35, 25: 60, 32: 100, 40: 160, 50: 260, 65: 450, 80: 650 }, bfly: { 15: 20, 20: 30, 25: 45, 32: 60, 40: 90, 50: 140, 65: 260, 80: 400 } };
  W.TANKS = [600, 1000, 2000, 3000, 5000, 10000];
  W.tankDims = (vol) => { const D = Math.cbrt((4 * vol / 1000) / (Math.PI * 1.5)); return { D, H: Math.round(1.5 * D * 100) / 100 }; };
  W.PUMPS = {
    feed: { n: E('Raw water feed pump (4 m³/h, 45 m, 1.5 kW)', 'طلمبة تغذية مية خام (4 م³/س، 45 م، 1.5 ك.و)'), q: 4, h: 45, eta: 0.55, kw: 1.5 },
    ro1: { n: E('RO pass 1 high-pressure pump (3.5 m³/h, 120 m, 3 kW)', 'طلمبة ضغط عالي RO أولى (3.5 م³/س، 120 م، 3 ك.و)'), q: 3.5, h: 120, eta: 0.55, kw: 3 },
    ro2: { n: E('RO pass 2 high-pressure pump (2.6 m³/h, 100 m, 2.2 kW)', 'طلمبة ضغط عالي RO تانية (2.6 م³/س، 100 م، 2.2 ك.و)'), q: 2.6, h: 100, eta: 0.5, kw: 2.2 },
    pwloop: { n: E('PW loop pump (6 m³/h, 45 m, 2.2 kW)', 'طلمبة لوب PW (6 م³/س، 45 م، 2.2 ك.و)'), q: 6, h: 45, eta: 0.55, kw: 2.2 },
    medfeed: { n: E('Still feed pump (0.6 m³/h, 60 m, 1.1 kW)', 'طلمبة تغذية المقطّر (0.6 م³/س، 60 م، 1.1 ك.و)'), q: 0.6, h: 60, eta: 0.35, kw: 1.1 },
    wfiloop: { n: E('WFI loop pump (3 m³/h, 40 m, 1.5 kW)', 'طلمبة لوب WFI (3 م³/س، 40 م، 1.5 ك.و)'), q: 3, h: 40, eta: 0.45, kw: 1.5 },
  };
  const NU = 1.0e-6;
  W.nu = (T) => (T >= 80 ? 0.37e-6 : T >= 40 ? 0.66e-6 - (T - 40) * 0.0072e-6 : NU - (T - 20) * 0.017e-6);
  W.pipeInfo = function (pp, q, T) {
    if (!(+pp.dn > 0)) return null;
    const id = (W.ID[pp.mat === 'pvc' ? 'pvc' : 'ss'][+pp.dn] || 26) / 1000, A = Math.PI * id * id / 4, v = Math.abs(q || 0) / 1000 / A, Re = v * id / W.nu(T == null ? 20 : T);
    const L = Math.max(0.01, +pp.len || 5), dp = (1.5 * 0.02 * (L / id) * 1000 * v * v / 2) / 1e5;
    return { id: id * 1000, v, Re, dp, LD: L / id };
  };
  /* pipe conductance (L/s per bar), Darcy f = 0.02 + 50 % for fittings, linearised on last flow */
  PL.pipeG = function (pp, pl) {
    if (!(+pp.dn > 0)) return 40;
    const id = (W.ID[pp.mat === 'pvc' ? 'pvc' : 'ss'][+pp.dn] || 26) / 1000, A = Math.PI * id * id / 4, L = Math.max(0.01, +pp.len || 5);
    const R = (1.5 * 0.02 * (L / id) * 1000 / 2) / (A * A) / 1e6 / 1e5; // bar per (L/s)^2
    const q0 = Math.max(Math.abs((pl._Q && pl._Q[pp.id]) || 0), 0.25 * A * 1000); // at least 0.25 m/s
    return clamp(1 / (R * q0), 0.01, 400);
  };
  W.valveG = function (u, pos) {
    const kv = (W.KV[u.props.vt] || W.KV.dia)[+u.props.dn] || 13, k = kv * (u.props.vt === 'ball' ? pos * pos : pos) / 3.6; // L/s at 1 bar
    const q0 = Math.max(Math.abs(u.state.q || 0), k * 0.3);
    return clamp(k * k / q0, 1e-4, 400);
  };
  /* pump with a curve H = H0 - k Q^2 (linearised around the last flow) */
  W.pumpBranch = function (u, s) {
    const pr = u.props, qb = +pr.qbep / 3.6, hb = +pr.hbep; // L/s, m
    const H0 = 1.25 * hb * 0.0981, k = 0.25 * hb * 0.0981 / (qb * qb);
    const q0 = Math.max(Math.abs(u.state.q || 0), 0.3 * qb * Math.max(0.2, Math.abs(s)));
    const Gp = 1 / (2 * k * q0);
    const H = (H0 * s * s * (s < 0 ? 0.35 : 1)) + k * q0 * q0;
    return { G: Gp, H: Math.abs(s) < 0.02 ? 0 : H, Gstop: 1 / (2 * k * Math.max(q0, 0.3 * qb)) };
  };

  /* ---------- water quality ---------- */
  // cond: salt conductivity at 25 C (uS/cm), hard mg/L CaCO3, cl2 mg/L, toc ppb, sio2 ppm, bact CFU/mL, endo EU/mL, sdi, co2 ppm, anti mg/L
  W.K = ['cond', 'hard', 'cl2', 'toc', 'sio2', 'bact', 'endo', 'sdi', 'co2', 'anti'];
  const I = {}; W.K.forEach((k, i) => (I[k] = i));
  W.I = I;
  W.PRE = { city: [450, 160, 0.8, 2500, 10, 10, 5, 5, 5, 0], well: [900, 350, 0, 1500, 25, 50, 2, 3, 20, 0], pw: [0.1, 0, 0, 30, 0.005, 0.5, 0.005, 0, 0.2, 0], wfi: [0.3, 0, 0, 10, 0, 0.0001, 0.0005, 0, 0.2, 0] };
  W.condRaw = (w, T) => (w[0] + 1.25 * Math.sqrt(Math.max(0, w[8]))) * (1 + 0.02 * ((T == null ? 25 : T) - 25));
  const ST1 = [0.6, 0.8, 0.9, 1.0, 1.1, 1.3, 1.4, 1.5, 1.7, 1.8, 1.9, 2.1, 2.2, 2.4, 2.5, 2.7, 2.7, 2.7, 2.7, 2.9, 3.1];
  W.stage1 = (T) => ST1[clamp(Math.floor((T || 0) / 5), 0, 20)];
  const EPPW = [[0, 2.4], [10, 3.6], [20, 4.3], [25, 5.1], [30, 5.4], [40, 6.5], [50, 7.1], [60, 8.1], [70, 9.1], [75, 9.7], [80, 9.7], [90, 9.7], [100, 10.2]];
  W.epPW = (T) => { for (let i = 1; i < EPPW.length; i++) if (T <= EPPW[i][0]) { const [a, b] = [EPPW[i - 1], EPPW[i]]; return a[1] + (b[1] - a[1]) * (T - a[0]) / (b[0] - a[0]); } return 10.2; };
  W.GRADES = { PW: E('Purified water (USP)', 'مية منقاة PW (USP)'), PWEP: E('Purified water (Ph. Eur.)', 'مية منقاة PW (الأوروبي)'), WFI: E('Water for injection (WFI)', 'مية حقن WFI') };
  /* spec check: returns [{k, val, lim, ok, unit}] */
  W.spec = function (w, T, grade) {
    if (!w) return [];
    const raw = W.condRaw(w, T), lim = grade === 'PWEP' ? W.epPW(T) : W.stage1(T);
    const out = [{ k: E('Conductivity (not compensated)', 'الكونداكتيفيتي (من غير تعويض)'), val: raw, lim, ok: raw <= lim, unit: 'µS/cm', d: 2 }, { k: E('TOC', 'TOC'), val: w[3], lim: 500, ok: w[3] <= 500, unit: 'ppb', d: 0 }];
    if (grade === 'WFI') {
      out.push({ k: E('Bacteria (lab result, action level)', 'البكتيريا (نتيجة معمل، حد إجراء)'), val: w[5] * 100, lim: 10, ok: w[5] * 100 <= 10, unit: 'CFU/100 mL', d: 2, act: true });
      out.push({ k: E('Endotoxin', 'الإندوتوكسين'), val: w[6], lim: 0.25, ok: w[6] < 0.25, unit: 'EU/mL', d: 3 });
      out.push({ k: E('Hot loop ≥ 70 °C (control limit)', 'اللوب السخن ≥ 70 درجة (حد تشغيل)'), val: T, lim: 70, ok: T >= 70, unit: '°C', d: 1, min: true, ctl: true });
    } else out.push({ k: E('Bacteria (lab result, action level)', 'البكتيريا (نتيجة معمل، حد إجراء)'), val: w[5], lim: 100, ok: w[5] <= 100, unit: 'CFU/mL', d: 1, act: true });
    return out;
  };
  W.fmt = (v, d) => (v == null || !isFinite(v) ? '-' : v >= 1000 ? Math.round(v).toString() : v < 0.001 && v > 0 ? v.toExponential(1) : v.toFixed(d == null ? 2 : d));

  /* ---------- new units ---------- */
  U.SOFT = {
    pre: 'SF', name: E('Water softener (resin)', 'سوفتنر (ريزن)'), w: 90, h: 160,
    info: E('Swaps calcium and magnesium for sodium so the RO and EDI do not scale. Its resin runs out after a set volume: then hardness breaks through. Regenerate it with brine.', 'بيبدّل الكالسيوم والماغنسيوم بصوديوم عشان الـRO والـEDI ما يعملوش قشور. الريزن بيخلص بعد حجم معين: ساعتها العسر بيعدّي. اعمله ريجينريشن بالملح.'),
    ports: [['in', 0, 26, 'l'], ['out', 90, 140, 'r']], props: { cap: 50 },
    init(u) { u.state = { used: 0 }; },
  };
  U.DOSE = {
    pre: 'DP', name: E('Dosing pump (chemical)', 'طلمبة حقن (كيماوي)'), w: 90, h: 100,
    info: E('Injects a chemical into the line: NaOH between the RO passes (CO2 to bicarbonate), SMBS to kill chlorine, antiscalant before the RO, or NaOCl to chlorinate.', 'بتحقن كيماوي في الخط: صودا كاوية بين مرحلتين الـRO (الـCO2 يبقى بيكربونات)، أو SMBS يشيل الكلور، أو مانع ترسيب قبل الـRO، أو كلور.'),
    ports: [['a', 0, 76, 'l'], ['b', 90, 76, 'r']], props: { chem: 'naoh', on: true },
  };
  U.EDI = {
    pre: 'EDI', name: E('EDI (electro-deionisation)', 'EDI (تأيين كهربي)'), w: 170, h: 110,
    info: E('Polishes RO water to below 0.1 µS/cm with a DC field and resin, no chemicals. Needs soft, chlorine-free water with little CO2. The DC trips when the product flow is too low.', 'بيلمّع مية الـRO لأقل من 0.1 ميكروسيمنز بالكهربا والريزن من غير كيماويات. محتاج مية سوفت ومن غير كلور والـCO2 فيها قليل. الكهربا بتفصل لو الفلو قليل.'),
    ports: [['in', 0, 55, 'l'], ['prod', 170, 30, 'r'], ['rej', 170, 86, 'r']], props: { on: true, rec: 95 },
  };
  U.UV = {
    pre: 'UV', name: E('UV steriliser', 'معقّم UV'), w: 130, h: 80,
    info: E('254 nm kills bacteria (about 2.5 log at 100 % intensity). 185 nm also breaks organics (TOC). Below 70 % intensity the lamp alarms and stops working.', 'الـ254 نانومتر بيقتل البكتيريا (حوالي 2.5 لوج على 100٪). الـ185 كمان بيكسر المواد العضوية (TOC). تحت 70٪ اللمبة بتعمل إنذار ومبتشتغلش.'),
    ports: [['a', 0, 56, 'l'], ['b', 130, 56, 'r']], props: { on: true, int: 100, nm: 254 },
  };
  U.STILL = {
    pre: 'WS', name: E('Multi-effect still (WFI)', 'مقطّر متعدد المراحل (WFI)'), w: 180, h: 210,
    info: E('Boils purified water with plant steam and condenses it as WFI at about 85 °C. Removes salts, bacteria and endotoxin (3 log or more). About 10 % leaves as blowdown.', 'بيغلي المية المنقاة ببخار المصنع ويكثفها WFI على حوالي 85 درجة. بيشيل الأملاح والبكتيريا والإندوتوكسين (3 لوج أو أكتر). حوالي 10٪ بيخرج بلو داون.'),
    ports: [['in', 0, 180, 'l'], ['dist', 180, 150, 'r'], ['blow', 90, 210, 'd']], props: { steam: true, bar: 6, lvt: '', lon: 65, loff: 90 },
    init(u) { u.state = { warm: 120 }; },
  };
  U.POU = {
    pre: 'POU', name: E('Point of use / sample valve', 'نقطة استخدام / محبس عينة'), w: 90, h: 110,
    info: E('Where production takes water. Open it to draw. It also shows the water quality against the limits. Keep the branch short: a dead leg longer than 2 pipe diameters grows bacteria.', 'المكان اللي الإنتاج بياخد منه مية. افتحه عشان تسحب. وبيعرض جودة المية قدام الحدود. خلي الفرع قصير: الرجل الميتة الأطول من 2 قطر ماسورة بتربي بكتيريا.'),
    ports: [['in', 45, 0, 'u']], props: { open: false, dn: 15, grade: 'PW' },
  };
  U.QA = {
    pre: 'AIT', name: E('Quality analyser (conductivity, TOC)', 'محلل جودة (كونداكتيفيتي، TOC)'), w: 100, h: 110,
    info: E('Online conductivity and TOC with lab results for bacteria and endotoxin. Checks the water against USP / Ph. Eur. limits for PW or WFI. Conductivity is not temperature compensated (Stage 1 table).', 'كونداكتيفيتي وTOC أونلاين ومعاهم نتايج المعمل للبكتيريا والإندوتوكسين. بيقارن المية بحدود الـUSP والأوروبي للـPW أو الـWFI. الكونداكتيفيتي من غير تعويض حرارة (جدول Stage 1).'),
    ports: [['a', 0, 90, 'l'], ['b', 100, 90, 'r']], props: { grade: 'PW' },
  };
  U.DIV = {
    pre: 'XV', name: E('Divert-to-drain valve', 'محبس تحويل للصرف'), w: 110, h: 100,
    info: E('Sends the water to drain while its conductivity is above the limit, so bad water never reaches the storage tank. Returns to the tank 2 minutes after it is good again.', 'بيرمي المية على الصرف طول ما الكونداكتيفيتي فوق الحد، فالمية الوحشة عمرها ما توصل للتانك. بيرجع للتانك بعد دقيقتين من ما ترجع كويسة.'),
    ports: [['in', 0, 60, 'l'], ['out', 110, 60, 'r'], ['drain', 55, 100, 'd']], props: { lim: 1.1 },
    init(u) { u.state = { div: 1, ok: 0 }; },
  };
  U.TEMP = {
    pre: 'E', name: E('Feed heater / cooler (chilled water and steam)', 'مسخّن / مبرّد الدخول (مية متلجة وبخار)'), w: 120, h: 130,
    info: E('Holds the RO feed at its set temperature with chilled water, so the membranes give a steady flow. During hot sanitisation, low-pressure steam heats the loop to 80 °C.', 'بيثبّت حرارة دخول الـRO على الضبط بالمية المتلجة، عشان الممبرين يدّي فلو ثابت. وقت التعقيم السخن، البخار بيسخّن اللوب لـ80 درجة.'),
    ports: [['a', 0, 96, 'l'], ['b', 120, 96, 'r']], props: { set: 20, san: 80, kwh: 0, kwc: 0 },
  };
  U.DEG = {
    pre: 'MD', name: E('Membrane degasser (removes CO2)', 'ممبرين إزالة الغازات (بيشيل الـCO2)'), w: 70, h: 170,
    info: E('Hollow fibres with clean air on the other side pull dissolved CO2 out of the RO permeate, so the second pass gives lower conductivity. Needs the strip air on.', 'ألياف مفرّغة والهوا النضيف على الناحية التانية بيسحب الـCO2 الدايب من مية الـRO، فالمرحلة التانية تطلع كونداكتيفيتي أقل. محتاج هوا الكسح يكون شغال.'),
    ports: [['a', 0, 150, 'l'], ['b', 70, 20, 'r']], props: { on: true },
  };
  U.CTRL = {
    pre: 'HMI', name: E('Station control panel (HMI)', 'لوحة تشغيل المحطة (HMI)'), w: 300, h: 170,
    info: E('Start and stop the whole station from here: production (pretreatment and RO), hot sanitisation at 80 °C, and the distribution loop. Pumps in a group follow these buttons and their own level control.', 'شغّل ووقّف المحطة كلها من هنا: الإنتاج (المعالجة الأولية والـRO)، التعقيم السخن على 80 درجة، ولوب التوزيع. الطلمبات اللي في مجموعة بتمشي ورا الزراير دي وورا تحكم المستوى بتاعها.'),
    ports: [], props: { prod: true, sanit: false, dist: true, hold: 30, stank: '', dclose: '', dopen: '' },
    init(u) { u.state = { held: 0 }; },
  };
  for (const k of ['SOFT', 'DOSE', 'EDI', 'UV', 'STILL', 'DIV', 'QA', 'POU', 'TEMP', 'DEG', 'CTRL']) if (!PL.order.includes(k)) PL.order.splice(PL.order.indexOf('HX'), 0, k);
  // extra props on existing units (kept compatible: 0 / '' = old behaviour)
  Object.assign(U.SUPPLY.props, { wq: 'city' });
  Object.assign(U.TANK.props, { fv: 0, q0: 'city', jkt: 0, ins: false });
  Object.assign(U.VALVE.props, { dn: 0, vt: 'dia' });
  Object.assign(U.PUMP.props, { qbep: 0, hbep: 0, eta: 0.55, local: false, spd: 100, lvt: '', lon: 65, loff: 90, stk: '', psl: 0, grp: '', sanrun: false });
  Object.assign(U.DIV.props, { tmax: 0 });
  Object.assign(U.RO.props, { mrej: 98.5, area: 1, hot: false });

  /* ---------- per-unit network and step ---------- */
  const X = (PL.X = {});
  X.SOFT = { net: (u, o) => o.B(o.p('in'), o.p('out'), 2.5, { u, k: 'soft' }) };
  X.DOSE = { net: (u, o) => o.B(o.p('a'), o.p('b'), 80, { u, k: 'dose' }) };
  X.UV = { net: (u, o) => o.B(o.p('a'), o.p('b'), 60, { u, k: 'uv' }) };
  X.QA = { net: (u, o) => o.B(o.p('a'), o.p('b'), 80, { u, k: 'qa' }) };
  X.EDI = {
    net(u, o) {
      const r = clamp(+u.props.rec || 95, 50, 99) / 100;
      o.B(o.p('in'), o.p('prod'), 1.6, { u, k: 'edi', one: true });
      o.B(o.p('in'), o.p('rej'), 1.6 * (1 - r) / r, { u, k: 'edirej', one: true });
    },
  };
  X.STILL = {
    net(u, o) {
      const st = u.state, pr = u.props;
      if (pr.lvt) { const t = PL.byTag(o.pl, pr.lvt); if (t && t.type === 'TANK') { const lv = 100 * (t.state.v || 0) / Math.max(1, +t.props.vol); if (lv >= +pr.loff) st.lstop = 1; else if (lv <= +pr.lon) st.lstop = 0; } } else st.lstop = 0;
      const on = !!pr.steam && !st.lstop, f = clamp((+pr.bar || 0) / 6, 0, 1.3);
      st.run = on && f > 0.05;
      if (st.run) o.B(o.p('in'), o.p((st.warm || 0) >= 120 ? 'dist' : 'blow'), 0.11 * f, { u, k: 'dist', one: true, Tout: 85 }); // first 2 min: distillate to drain
      o.B(o.p('in'), o.p('blow'), st.run ? 0.006 : 0.0005, { u, k: 'blow', one: true });
    },
  };
  X.DIV = { net(u, o) { o.B(o.p('in'), o.p(u.state.div ? 'drain' : 'out'), 60, { u, k: 'div', one: true }); } };
  X.POU = {
    net(u, o) {
      o.F(u.id + '#d', 0);
      if (u.props.open) { const kv = (W.KV.dia[+u.props.dn] || 4) / 3.6, q0 = Math.max(Math.abs(u.state.q || 0), kv * 0.3); o.B(o.p('in'), u.id + '#d', clamp(kv * kv / q0, 0.001, 50), { u, k: 'pou', one: true }); }
    },
  };
  W.ctrl = (pl) => pl.units.find((x) => x.type === 'CTRL') || null;
  W.sanit = (pl) => { const c = W.ctrl(pl); return !!(c && c.props.sanit); };
  X.TEMP = {
    net(u, o) {
      const pr = u.props, st = u.state, tgt = W.sanit(o.pl) ? +pr.san || 80 : +pr.set || 20, Tin = st.Tin == null ? tgt : st.Tin, q = Math.abs(st.q || 0);
      let dT = tgt - Tin; // the steam and chilled-water duty limit how fast it can change the temperature
      if (q > 1e-4) { const q1 = q * 1.15; if (+pr.kwh > 0) dT = Math.min(dT, +pr.kwh / (4.186 * q1)); if (+pr.kwc > 0) dT = Math.max(dT, -+pr.kwc / (4.186 * q1)); }
      o.B(o.p('a'), o.p('b'), 40, { u, k: 'temp', Tout: Tin + dT });
    },
  };
  X.DEG = { net: (u, o) => o.B(o.p('a'), o.p('b'), 40, { u, k: 'deg' }) };
  X.CTRL = { net() {} };
  const q1 = (net, u, k) => net.br.find((x) => x.u === u && x.k === k);
  X.TEMP.step = (u, s) => { const x = q1(s.net, u, 'temp'), st = u.state; st.q = x ? x.q : 0; st.Tin = s.T('a') == null ? 20 : s.T('a'); st.Tout = x ? x.Tout : null; st.heat = W.sanit(s.pl); st.kw = x ? 4.186 * Math.abs(x.q) * ((x.Tout || 0) - st.Tin) : 0; };
  X.DEG.step = (u, s) => { const x = q1(s.net, u, 'deg'); u.state.q = x ? x.q : 0; };
  /* station control: the hot sanitisation sequence (heat, hold, cool down) */
  X.CTRL.step = (u, s) => {
    const pr = u.props, st = u.state, pl = s.pl;
    const tags = String(pr.dclose || '').split(/[,\s]+/).filter(Boolean);
    const opn = String(pr.dopen || '').split(/[,\s]+/).filter(Boolean);
    const shut = (on) => {
      for (const t of tags) { const v = PL.byTag(pl, t); if (v && v.type === 'VALVE') v.props.open = !on; }
      for (const t of opn) { const v = PL.byTag(pl, t); if (v && v.type === 'VALVE') v.props.open = !!on; }
    };
    if (pr.sanit && !st.was) { st.was = 1; st.held = 0; st.done = 0; shut(true); EL.emit('alarm', { id: u.id, tag: u.tag }, 'Hot sanitisation started: heating to ' + (W.sanT(pl)) + ' °C'); }
    if (!pr.sanit && st.was) { st.was = 0; shut(false); }
    if (st.done) st.doneT = (st.doneT || 0) + s.dt;
    if (pr.sanit) {
      const t = pr.stank ? PL.byTag(pl, pr.stank) : null, T = t ? (t.state.T == null ? 20 : t.state.T) : 20;
      st.T = T;
      if (T >= W.sanT(pl) - 3) st.held = (st.held || 0) + s.dt;
      if (st.held >= Math.max(1, +pr.hold || 30) * 60) { pr.sanit = false; st.was = 0; st.done = 1; st.doneT = 0; shut(false); EL.emit('alarm', { id: u.id, tag: u.tag }, 'Hot sanitisation complete: cooling down'); }
    }
  };
  W.sanT = (pl) => { const t = pl.units.find((x) => x.type === 'TEMP'); return t ? +t.props.san || 80 : 80; };
  /* buttons on the HMI drawing */
  W.ctrlAct = function (u, act) {
    const pr = u.props;
    if (act === 'prod') { pr.prod = !pr.prod; return pr.prod ? E('Production ON', 'الإنتاج شغال') : E('Production OFF', 'الإنتاج واقف'); }
    if (act === 'dist') { pr.dist = !pr.dist; return pr.dist ? E('Distribution loop ON', 'لوب التوزيع شغال') : E('Distribution loop OFF', 'لوب التوزيع واقف'); }
    if (act === 'sanit') { pr.sanit = !pr.sanit; return pr.sanit ? E('Hot sanitisation started', 'التعقيم السخن بدأ') : E('Hot sanitisation stopped', 'التعقيم السخن وقف'); }
    return null;
  };
  X.SOFT.step = (u, s) => { const x = q1(s.net, u, 'soft'); u.state.q = x ? x.q : 0; u.state.dp = s.p('in') - s.p('out'); };
  X.DOSE.step = (u, s) => { const x = q1(s.net, u, 'dose'); u.state.q = x ? x.q : 0; };
  X.UV.step = (u, s) => { const x = q1(s.net, u, 'uv'); u.state.q = x ? x.q : 0; };
  X.QA.step = (u, s) => { const x = q1(s.net, u, 'qa'); u.state.q = x ? x.q : 0; u.state.T = s.T('a') == null ? 20 : s.T('a'); };
  X.EDI.step = (u, s) => {
    const a = q1(s.net, u, 'edi'), b = q1(s.net, u, 'edirej'), st = u.state;
    st.qp = a ? Math.max(0, a.q) : 0; st.qr = b ? Math.max(0, b.q) : 0;
    const low = st.qp < 0.15; // about 0.5 m3/h minimum
    if (u.props.on && low && st.qp + st.qr > 1e-4 && !st.trip) { st.trip = 1; EL.emit('trip', { id: u.id, tag: u.tag }, 'EDI DC off: product flow too low'); }
    if (!low) st.trip = 0;
    st.dc = !!u.props.on && !st.trip && st.qp > 0.15;
  };
  X.STILL.step = (u, s) => { const a = q1(s.net, u, 'dist'), b = q1(s.net, u, 'blow'), st = u.state; st.warm = st.run ? (st.warm || 0) + s.dt : 0; st.qd = a && st.warm >= 120 ? Math.max(0, a.q) : 0; st.qb = (b ? Math.max(0, b.q) : 0) + (a && st.warm < 120 ? Math.max(0, a.q) : 0); st.pin = s.p('in'); };
  X.DIV.step = (u, s) => { const x = q1(s.net, u, 'div'); u.state.q = x ? x.q : 0; };
  X.POU.step = (u, s) => { const x = q1(s.net, u, 'pou'), st = u.state; st.q = x ? x.q : 0; st.p = s.p('in'); st.T = s.T('in') == null ? 20 : s.T('in'); st.tot = (st.tot || 0) + Math.max(0, st.q) * s.dt; };

  /* ---------- quality transforms per branch ---------- */
  const TF = {
    flt(w, x) {
      const k = x.u.props.kind;
      if (k === 'carbon') { const st = x.u.state; const exh = (st.bv || 0) > 3e5; w[2] = exh ? w[2] * 0.5 : Math.max(0.02, w[2] * 0.01); if (w[2] < 0.02) w[2] = Math.min(w[2], 0.02); w[3] *= exh ? 0.9 : 0.5; w[5] = Math.min(1e4, w[5] * 10); }
      else if (k === 'cart') w[7] = Math.max(1.5, w[7] - 0.5);
      else if (k === 'cart1') w[7] = Math.max(1.5, w[7] - 0.3);
      else { w[7] *= 0.7; w[5] *= 0.85; }
    },
    soft(w, x) { const st = x.u.state, left = st.used < (+x.u.props.cap || 50) * 160 * 1000; if (left) { w[1] = Math.max(0.3, w[1] * 0.003); w[0] *= 1.03; } else w[1] *= 0.8; w[5] *= 1.5; },
    dose(w, x) {
      if (!x.u.props.on) return;
      const c = x.u.props.chem;
      if (c === 'naoh') { w[0] += 1.0 * w[8] * 0.95 + 0.5; w[8] *= 0.05; }
      else if (c === 'smbs') { w[2] = 0; w[0] += 5; }
      else if (c === 'anti') w[9] = 3;
      else if (c === 'naocl') w[2] += 1;
    },
    uv(w, x) { const pr = x.u.props, int = clamp(+pr.int || 0, 0, 100); if (!pr.on || int < 70) return; w[5] *= Math.pow(10, -2.5 * int / 100); if (+pr.nm === 185) { w[3] *= 0.6; w[0] += 0.03; } },
    perm(w, x) {
      const st = x.u.state, R = clamp((st.rec || 50) / 100, 0.02, 0.95), CF = 1 / (1 - R), fac = Math.log(CF) / R;
      const rej = clamp((+x.u.props.mrej || 98.5) / 100 - (st.dmg || 0), 0.3, 0.999);
      w[0] = w[0] * fac * (1 - rej); w[1] *= fac * 0.01; w[2] = 0; w[3] *= 0.05; w[4] *= fac * 0.01 * (1 + 10 * (st.dmg || 0)); w[5] *= 0.01; w[6] *= 0.01; w[7] = 0; w[9] = 0;
    },
    rej(w, x) { const R = clamp((x.u.state.rec || 50) / 100, 0, 0.95), CF = 1 / (1 - R); for (const i of [0, 1, 3, 4, 9]) w[i] *= CF; },
    edi(w, x) {
      const st = x.u.state;
      if (!st.dc) return;
      const scale = (st.scale || 0) > 0.5;
      w[0] = Math.max(0.055, 0.06 + 0.002 * w[0] + 0.05 * w[8]) * (scale ? 4 : 1); w[1] *= 0.01; w[4] *= 0.05; w[3] *= 0.6; w[5] *= 0.3; w[8] *= 0.005;
    },
    temp(w, x) { if ((x.Tout || 0) >= 75) { w[5] *= 1e-3; } },
    deg(w, x) { if (x.u.props.on) w[8] *= 0.1; },
    dist(w) { w[0] = 0.25; w[1] = 0; w[2] = 0; w[3] *= 0.1; w[4] *= 0.001; w[5] *= 1e-6; w[6] *= Math.pow(10, -3.5); w[7] = 0; w[8] = Math.min(w[8], 0.2); w[9] = 0; },
  };

  /* runs every 0.25 s of simulated time: node quality, tank mixing, unit wear */
  PL.quality = function (c, net, P, Tn, dt) {
    const pl = c.plant;
    pl._wqT = (pl._wqT || 0) + dt;
    if (pl._wqT < 0.25 && pl._W) return;
    const DT = pl._wqT; pl._wqT = 0;
    const n = net.nodes.size, prevW = pl._W || {}, Wn = new Array(n);
    const keys = []; for (const [k, i] of net.nodes) { keys[i] = k; Wn[i] = prevW[k] ? prevW[k].slice() : null; }
    const fixed = new Map();
    for (const u of pl.units) {
      if (u.type === 'SUPPLY') fixed.set(net.nodes.get(u.id + '#s'), (W.PRE[u.props.wq] || W.PRE.city).slice());
      if (u.type === 'TANK') { if (!u.state.wq) u.state.wq = (W.PRE[u.props.q0] || W.PRE.city).slice(); fixed.set(net.nodes.get(u.id + '#bot'), u.state.wq); }
    }
    const flows = net.br.filter((x) => Math.abs(x.q || 0) > 1e-7);
    for (let pass = 0; pass < 14; pass++) {
      const acc = new Array(n), qs = new Float64Array(n);
      for (const x of flows) {
        const from = x.q > 0 ? x.a : x.b, to = x.q > 0 ? x.b : x.a;
        const src = fixed.has(from) ? fixed.get(from) : Wn[from];
        if (!src) continue;
        const w = src.slice();
        if (x.k && TF[x.k]) TF[x.k](w, x);
        const q = Math.abs(x.q);
        if (!acc[to]) acc[to] = new Float64Array(10);
        for (let j = 0; j < 10; j++) acc[to][j] += q * w[j];
        qs[to] += q;
      }
      let ch = 0;
      for (let i = 0; i < n; i++) {
        if (fixed.has(i)) { Wn[i] = fixed.get(i); continue; }
        if (!acc[i]) continue;
        const v = Array.from(acc[i], (s) => s / qs[i]);
        if (!Wn[i] || Math.abs(v[0] - Wn[i][0]) > 1e-6 * (1 + v[0]) || Math.abs(v[5] - Wn[i][5]) > 1e-9) ch++;
        Wn[i] = v;
      }
      if (!ch) break;
    }
    const out = {}; for (let i = 0; i < n; i++) if (Wn[i]) out[keys[i]] = Wn[i];
    pl._W = out;
    const wAt = (ref) => out[ref] || null;
    for (const u of pl.units) {
      const st = u.state, pr = u.props;
      const wIn = (port) => wAt(u.id + '.' + port);
      if (u.type === 'TANK') {
        let vin = 0; const sum = new Float64Array(10);
        for (const x of net.br) if (x.u === u && Math.abs(x.q || 0) > 1e-7) {
          const inflow = (x.k === 'tin' && x.q > 0) || (x.k === 'tout' && x.q < 0);
          if (!inflow) continue;
          const w = out[keys[x.k === 'tin' ? x.a : x.b]]; if (!w) continue;
          const q = Math.abs(x.q); vin += q; for (let j = 0; j < 10; j++) sum[j] += q * w[j];
        }
        const m = Math.max(5, st.v || 0), wq = st.wq;
        if (vin > 1e-6) { const f = Math.min(1, vin * DT / m); for (let j = 0; j < 10; j++) wq[j] += f * (sum[j] / vin - wq[j]); }
        // in the tank: CO2 from the vent air, bacteria grow or die with temperature (sped up 24x for training)
        if (wq[8] < 0.25) wq[8] += (0.25 - wq[8]) * Math.min(1, DT / 3600);
        const T = st.T == null ? 20 : st.T, gph = T >= 80 ? 1e-4 : T >= 65 ? 0.05 : T >= 50 ? 0.5 : T >= 25 ? 3 : T >= 15 ? 1.3 : 1.1;
        wq[5] = clamp(Math.max(wq[5], gph > 1 ? 1e-4 : 0) * Math.pow(gph, DT / 3600), 0, 1e6);
        if (gph > 1) wq[6] = Math.min(50, wq[6] + wq[5] * 1e-5 * DT / 3600);
        if (wq[2] > 0) wq[2] *= Math.pow(0.93, DT / 3600);
      }
      if (u.type === 'FILTER' && pr.kind === 'carbon') st.bv = (st.bv || 0) + Math.abs(st.q || 0) * DT;
      if (u.type === 'SOFT') { const w = wIn('in'); if (w && st.q > 0) st.used = (st.used || 0) + st.q * DT * w[1]; st.left = Math.max(0, 100 - 100 * (st.used || 0) / ((+pr.cap || 50) * 160 * 1000)); }
      if (u.type === 'RO') {
        const w = wIn('in');
        if (w && st.qp > 1e-4) {
          if (w[2] > 0.1) st.cl2h = (st.cl2h || 0) + w[2] * DT * 3; // ppm.h, sped up about 10000x for training
          st.dmg = Math.min(0.5, Math.max(0, (st.cl2h || 0) - 1000) * 0.0005);
          const CF = 1 / (1 - clamp((st.rec || 0) / 100, 0, 0.95));
          st.scaling = w[1] * CF > 20 && w[9] < 1;
          if (st.scaling) st.scale = Math.min(0.6, (st.scale || 0) + DT / 3600 * 0.5 * 24); // flux falls (sped up)
          st.wf = w.slice();
        }
        const wp = wAt(u.id + '.perm'); if (wp) st.us = W.condRaw(wp, st.Tf);
      }
      if (u.type === 'EDI') { const w = wIn('in'); if (w && st.dc) { if (w[1] > 1) st.scale = Math.min(1, (st.scale || 0) + DT / 3600 * 6); st.cl2 = w[2] > 0.05; } st.wi = w ? w.slice() : null; const wp = wAt(u.id + '.prod'); st.us = wp ? W.condRaw(wp, 25) : null; }
      if (u.type === 'STILL') { const w = wIn('in'); st.bad = !!(w && (w[4] > 1 || w[2] > 0.05)); }
      if (u.type === 'DIV') {
        const w = wIn('in'), T = PL.tempAt(pl, u.id + '.in'), cond = w ? W.condRaw(w, 25) : 99;
        st.cond = w ? cond : null;
        st.hot = (+pr.tmax > 0 && T > +pr.tmax) || (+pr.tmax > 0 && W.sanit(pl)); // hot water or a sanitisation running: never to the storage tank
        if (cond > +pr.lim || !w || st.hot) { st.div = 1; st.ok = 0; } else if (Math.abs(st.q || 0) > 1e-4) { st.ok = (st.ok || 0) + DT; if (st.ok >= 120) st.div = 0; }
        void T;
      }
      if (u.type === 'QA' || u.type === 'POU') { const w = wIn(u.type === 'QA' ? 'a' : 'in'); st.wq = w ? w.slice() : null; }
    }
  };

  /* ---------- level control and local VFD for pumps ---------- */
  W.pumpSpeed = function (u, pl) {
    const pr = u.props, st = u.state;
    if (!pr.local) return null;
    if (st.trip) return 0;
    let s = clamp(+pr.spd || 0, 0, 100) / 100;
    const ctl = pr.grp ? W.ctrl(pl) : null, san = !!(ctl && ctl.props.sanit);
    if (ctl) { const on = pr.grp === 'dist' ? ctl.props.dist : ctl.props.prod || san; if (!on) { st.lstop = 0; return 0; } }
    if (pr.stk) { const t = PL.byTag(pl, pr.stk); if (t && t.type === 'TANK') { const lv = 100 * (t.state.v || 0) / Math.max(1, +t.props.vol); if (lv < 10) st.sstop = 1; else if (lv > 20) st.sstop = 0; if (st.sstop) return 0; } }
    if (pr.lvt) {
      const t = PL.byTag(pl, pr.lvt);
      if (t && t.type === 'TANK') {
        const lvl = t.state.lvl == null ? 100 * (t.state.v || 0) / Math.max(1, +t.props.vol) : t.state.lvl;
        const stopAbove = +pr.loff > +pr.lon; // generation: run below 'start', stop above 'stop'
        if (stopAbove) { if (lvl >= +pr.loff) st.lstop = 1; else if (lvl <= +pr.lon) st.lstop = 0; }
        else { if (lvl <= +pr.loff) st.lstop = 1; else if (lvl >= +pr.lon) st.lstop = 0; } // suction protection: stop at low level
        if (st.lstop && !(san && pr.sanrun)) s = 0;
      }
    }
    return s;
  };

  /* ---------- tank times ---------- */
  W.tankETA = function (u) {
    const st = u.state, V = Math.max(1, +u.props.vol), v = st.v || 0, q = st.qin || 0; // L/s
    if (q > 1e-4) return { fill: true, s: Math.max(0, (0.9 * V - v) / q), full: V / q };
    if (q < -1e-4) return { fill: false, s: Math.max(0, (v - 0.1 * V) / -q), full: V / -q };
    return null;
  };
  W.fmtT = function (s) { if (s == null || !isFinite(s)) return '-'; if (s < 90) return Math.round(s) + ' s'; if (s < 5400) return Math.round(s / 60) + ' min'; return (s / 3600).toFixed(1) + ' h'; };

  /* ---------- problems in plain words ---------- */
  W.problems = function (c, out) {
    const pl = c.plant; if (!pl) return;
    for (const u of pl.units) {
      const st = u.state || {}, pr = u.props;
      if (u.type === 'RO' && st.qp > 1e-4) {
        if (st.wf && st.wf[2] > 0.1) out.push(['bad', u.tag, E('Chlorine reaches the membrane (' + st.wf[2].toFixed(2) + ' mg/L). The damage cannot be undone. Check the carbon filter or SMBS dosing.', 'الكلور واصل للممبرين (' + st.wf[2].toFixed(2) + ' مجم/لتر). التلف ده مالوش رجوع. افحص فلتر الكربون أو حقن الـSMBS.')]);
        if ((st.dmg || 0) > 0.01) out.push(['bad', u.tag, E('Membrane damaged by chlorine: salt passage is up. Replace the membranes.', 'الممبرين اتلف من الكلور: الأملاح بتعدي أكتر. غيّر الممبرين.')]);
        if (st.scaling) out.push(['warn', u.tag, E('Hardness × concentration factor above 20 mg/L with no antiscalant: the membrane scales. Fix the softener or dose antiscalant.', 'العسر × معامل التركيز فوق 20 مجم/لتر ومفيش مانع ترسيب: الممبرين هيعمل قشور. صلّح السوفتنر أو احقن مانع ترسيب.')]);
      }
      if (u.type === 'PUMP' && st.trip) out.push(['bad', u.tag, E('Tripped on low suction pressure (below ' + pr.psl + ' bar for 5 s). Check the feed pump, the filters and the break tank, then press "Reset trip".', 'فصلت على ضغط سحب واطي (أقل من ' + pr.psl + ' بار لمدة 5 ثواني). افحص طلمبة التغذية والفلاتر وتانك الكسر، وبعدين اضغط "ريست الفصل".')]);
      if (u.type === 'PUMP' && st.sstop) out.push(['warn', u.tag, E('Stopped: suction tank ' + pr.stk + ' below 10 % (dry-run protection).', 'واقفة: تانك السحب ' + pr.stk + ' تحت 10٪ (حماية من الشغل على الناشف).')]);
      if (u.type === 'SOFT' && (st.left != null) && st.left <= 0) out.push(['bad', u.tag, E('Resin exhausted: hardness breaks through. Regenerate the softener.', 'الريزن خلص: العسر بيعدّي. اعمل ريجينريشن للسوفتنر.')]);
      else if (u.type === 'SOFT' && st.left != null && st.left < 15) out.push(['warn', u.tag, E('Resin almost exhausted (' + Math.round(st.left) + ' % left).', 'الريزن قرب يخلص (فاضل ' + Math.round(st.left) + '٪).')]);
      if (u.type === 'FILTER' && pr.kind === 'carbon' && (st.bv || 0) > 3e5) out.push(['bad', u.tag, E('Carbon exhausted: chlorine breaks through. Replace the carbon.', 'الكربون خلص: الكلور بيعدّي. غيّر الكربون.')]);
      if (u.type === 'EDI') {
        if (pr.on && st.trip) out.push(['bad', u.tag, E('DC power tripped on low product flow. Restore the flow, the DC comes back by itself.', 'كهربا الـDC فصلت عشان الفلو قليل. رجّع الفلو والكهربا هترجع لوحدها.')]);
        if ((st.scale || 0) > 0.3) out.push(['bad', u.tag, E('EDI scaling: hardness above 1 mg/L at the feed. Product conductivity is rising.', 'الـEDI بيعمل قشور: العسر فوق 1 مجم/لتر في الدخول. الكونداكتيفيتي بتاعة المنتج بتزيد.')]);
        if (st.cl2) out.push(['bad', u.tag, E('Chlorine at the EDI feed damages the resin and membranes.', 'كلور في دخول الـEDI بيتلف الريزن والممبرين.')]);
        if (!pr.on) out.push(['warn', u.tag, E('EDI power is off: water passes without polishing.', 'كهربا الـEDI مقفولة: المية بتعدي من غير تلميع.')]);
      }
      if (u.type === 'UV' && (!pr.on || +pr.int < 70)) out.push(['warn', u.tag, E('UV lamp off or below 70 % intensity: no disinfection. Change the lamp.', 'لمبة الـUV مطفية أو تحت 70٪: مفيش تعقيم. غيّر اللمبة.')]);
      if (u.type === 'STILL' && pr.steam && st.bad) out.push(['bad', u.tag, E('Still feed has silica above 1 ppm or chlorine: corrosion and scaling. Feed it purified water.', 'دخول المقطّر فيه سيليكا فوق 1 جزء في المليون أو كلور: تآكل وقشور. غذّيه بمية منقاة.')]);
      if (u.type === 'DIV' && st.div && Math.abs(st.q || 0) > 1e-4) {
        if (st.hot) out.push(['info', u.tag, E('Hot water or sanitisation running: recirculating, not sent to the PW tank.', 'مية سخنة أو تعقيم شغال: بتلف تاني، مش رايحة لتانك الـPW.')]);
        else if (st.cond == null || st.cond > +pr.lim) out.push(['warn', u.tag, E('Diverting to drain: conductivity ' + W.fmt(st.cond, 2) + ' µS/cm is above ' + pr.lim + '.', 'بيحوّل على الصرف: الكونداكتيفيتي ' + W.fmt(st.cond, 2) + ' ميكروسيمنز فوق ' + pr.lim + '.')]);
        else out.push(['info', u.tag, E('Water is good again: back to the tank after 2 minutes in spec (' + Math.round(st.ok || 0) + ' s).', 'المية رجعت كويسة: هترجع للتانك بعد دقيقتين جوه المواصفات (' + Math.round(st.ok || 0) + ' ث).')]);
      }
      if ((u.type === 'QA' || u.type === 'POU') && st.wq && (u.type === 'QA' || pr.open || Math.abs(PL.pressAt(pl, u.id + '.in')) > 0.05)) {
        const T = u.type === 'QA' ? st.T : PL.tempAt(pl, u.id + '.in');
        const sp = W.spec(st.wq, T, pr.grade), bad = sp.filter((x) => !x.ok && !x.act && !x.ctl), act = sp.filter((x) => !x.ok && x.act), ctl = sp.filter((x) => !x.ok && x.ctl);
        const L = (a, i) => a.map((x) => x.k[i] + ' ' + W.fmt(x.val, x.d) + ' ' + x.unit).join(i ? '، ' : ', ');
        if (bad.length) out.push(['bad', u.tag, E('Out of specification for ' + W.GRADES[pr.grade][0] + ': ' + L(bad, 0), 'خارج المواصفات لـ' + W.GRADES[pr.grade][1] + ': ' + L(bad, 1))]);
        if (act.length) out.push(['warn', u.tag, E('Action level exceeded: ' + L(act, 0) + '. Investigate and sanitise.', 'عدّى حد الإجراء: ' + L(act, 1) + '. حقق وعقّم.')]);
        if (ctl.length) out.push(['bad', u.tag, E('WFI below 70 °C: block the points of use until it is hot again.', 'الـWFI تحت 70 درجة: اقفل نقط الاستخدام لحد ما يسخن تاني.')]);
      }
      if (u.type === 'TANK' && st.wq && st.wq[5] > 100 && (pr.q0 === 'pw' || pr.q0 === 'wfi')) out.push(['bad', u.tag, E('Bacteria growing in the tank (' + Math.round(st.wq[5]) + ' CFU/mL). Sanitise at 80 °C or keep it hot.', 'البكتيريا بتزيد في التانك (' + Math.round(st.wq[5]) + ' CFU/مل). عقّم على 80 درجة أو خليه سخن.')]);
    }
    // pipes: loop velocity, laminar flow, dead legs
    const byPort = new Map(); for (const p of pl.pipes) for (const r of [p.a, p.b]) { const id = r.split('.')[0]; (byPort.get(id) || byPort.set(id, []).get(id)).push(p); }
    for (const p of pl.pipes) {
      if (!(+p.dn > 0)) continue;
      const q = (pl._Q && pl._Q[p.id]) || 0, T = PL.tempAt(pl, p.a), pi = W.pipeInfo(p, q, T), lab = 'DN' + p.dn + ' ' + PL.refLabel(pl, p.a) + '→' + PL.refLabel(pl, p.b);
      if (p.loop && Math.abs(q) > 1e-4) {
        if (pi.v < 0.6) out.push(['bad', lab, E('Loop velocity ' + pi.v.toFixed(2) + ' m/s (below 0.6): biofilm grows. Use a smaller pipe or more flow.', 'سرعة اللوب ' + pi.v.toFixed(2) + ' م/ث (أقل من 0.6): البيوفيلم بيكبر. صغّر الماسورة أو زوّد الفلو.')]);
        else if (pi.v < 0.9) out.push(['warn', lab, E('Loop velocity ' + pi.v.toFixed(2) + ' m/s: keep at least 1 m/s at the return.', 'سرعة اللوب ' + pi.v.toFixed(2) + ' م/ث: خلّيها 1 م/ث على الأقل في الراجع.')]);
        if (pi.Re < 4000) out.push(['bad', lab, E('Laminar flow (Re ' + Math.round(pi.Re) + '): no scouring of the pipe wall.', 'سريان طبقي (Re ' + Math.round(pi.Re) + '): مفيش كسح لجدار الماسورة.')]);
      }
      if (pi.v > 3 && (+p.len || 5) >= 1) out.push(['warn', lab, E('Velocity ' + pi.v.toFixed(1) + ' m/s is high: noise, erosion and a big pressure drop. Use a larger pipe.', 'السرعة ' + pi.v.toFixed(1) + ' م/ث عالية: صوت وتآكل وفقد ضغط كبير. كبّر الماسورة.')]);
      if (Math.abs(q) < 1e-4) {
        for (const end of [p.a, p.b]) {
          const id = end.split('.')[0], j = pl.units.find((x) => x.id === id);
          if (!j || j.type !== 'JUNC') continue;
          const live = (byPort.get(id) || []).some((o) => o !== p && o.loop && Math.abs((pl._Q && pl._Q[o.id]) || 0) > 1e-3); // dead legs matter on the PW / WFI loops
          if (!live) continue;
          if (pi.LD > 3) out.push(['bad', lab, E('Dead leg: ' + (+p.len).toFixed(2) + ' m = ' + pi.LD.toFixed(1) + ' D with no flow (limit 2 D). Bacteria grow here: shorten it or use a zero-dead-leg valve.', 'رجل ميتة: ' + (+p.len).toFixed(2) + ' م = ' + pi.LD.toFixed(1) + ' قطر من غير سريان (الحد 2 قطر). البكتيريا بتتربى هنا: قصّرها أو استخدم محبس zero dead leg.')]);
          else if (pi.LD > 2) out.push(['warn', lab, E('Dead leg ' + pi.LD.toFixed(1) + ' D (limit 2 D).', 'رجل ميتة ' + pi.LD.toFixed(1) + ' قطر (الحد 2 قطر).')]);
        }
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
