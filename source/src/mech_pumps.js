/* Mechanical: pumps (centrifugal end-suction, external gear, AODD, peristaltic) */
(function (g) {
  const EL = g.EL, M = EL.mech;
  const r3 = (v) => Math.round(v * 1000) / 1000;
  // ext with ax 'x': outline point [a, b] lands at y = -a, z = -b. yz() takes real [y, z] points.
  const yz = (pts) => pts.map((q) => [r3(-q[0]), r3(-q[1])]);
  // ball bearing on axis X at x: outer ring, inner ring, balls (rows 1 or 2)
  function brg(x, ri, ro, w, rows) {
    const t = ro - ri, R = (ri + ro) / 2, br = Math.min(0.3 * t, (rows === 2 ? 0.22 : 0.42) * w), n = Math.max(7, Math.floor((2 * Math.PI * R) / (2.4 * br)));
    const s = [{ t: 'cyl', ax: 'x', r: ro, ri: r3(ro - 0.3 * t), h: w, p: [x, 0, 0] }, { t: 'cyl', ax: 'x', r: r3(ri + 0.3 * t), ri, h: w, p: [x, 0, 0] }];
    if (rows === 2) s.push({ t: 'balls', ax: 'x', n, R, r: r3(br), p: [r3(x - w / 4), 0, 0], m: 'chrome' }, { t: 'balls', ax: 'x', n, R, r: r3(br), p: [r3(x + w / 4), 0, 0], m: 'chrome', a0: 180 / n });
    else s.push({ t: 'balls', ax: 'x', n, R, r: r3(br), p: [x, 0, 0], m: 'chrome' });
    return s;
  }
  // gear phasing: gear shape (ax 'x') tooth centres sit at beta = 180 + da*(i+0.35) + rot (beta measured from +y toward +z)
  function toothOff(n, rot, bc) { const da = 360 / n; let d = (((180 + da * 0.35 + rot - bc) % da) + da) % da; if (d > da / 2) d -= da; return d; }
  function meshRot(n1, rot1, bc1, n2, bc2, r1, r2) { const d = toothOff(n1, rot1, bc1), da = 360 / n2, tg = bc2 - (d * r1) / r2; return r3((((tg - 180 - da * 0.85) % da) + da) % da); }

  /* ---------- centrifugal pump (end suction, back pull-out) ---------- */
  const volute = [];
  for (let i = 0; i <= 48; i++) { const th = (i / 48) * Math.PI * 2, r = 10.9 + 3.3 * (i / 48); volute.push([r * Math.cos(th), r * Math.sin(th)]); }
  const ribs = [45, 135, 225, 315].map((a) => ({ t: 'box', w: 4.8, h: 2.6, d: 1.4, p: [-8.2, r3(7 * Math.cos((a * Math.PI) / 180)), r3(7 * Math.sin((a * Math.PI) / 180))], rot: [a, 0, 0] }));
  M.add({
    id: 'centrifugal_pump', cat: 'pumps',
    name: ['Centrifugal pump (end suction, back pull-out)', 'طلمبة طرد مركزي (سحب من الوش، باك بول أوت)'],
    info: {
      what: ['Single-stage end-suction pump: a closed impeller spins inside a spiral volute casing. The bearing frame carries the shaft, seal and impeller as one unit.', 'طلمبة مرحلة واحدة السحب من الوش: ريشة (إمبلر) مقفولة بتلف جوه جسم حلزوني (فوليوت). فريم الرولمان شايل العمود والسيل والريشة كوحدة واحدة.'],
      use: ['Chilled water, cooling tower, hot water and condenser loops, boiler feed, utility transfer and HVAC circuits on the site.', 'دواير المية المثلجة، برج التبريد، المية السخنة، تغذية الغلاية، نقل المرافق ودواير التكييف في المصنع.'],
      how: ['Liquid enters the eye on the axis, the vanes fling it outward and the volute turns the speed into pressure at the top discharge. Back pull-out: the frame, seal and impeller come out without disconnecting the pipes.', 'السايل بيدخل من العين في النص، الريش بترميه لبره والحلزون بيحول السرعة لضغط عند الطرد من فوق. باك بول أوت: الفريم والسيل والريشة بيطلعوا من غير ما تفك المواسير.'],
      fail: ['Seal leaking, hot or noisy bearings, gravel noise and falling pressure from cavitation, lower flow from a worn wear ring, vibration from misalignment.', 'السيل بيسرّب، رولمان سخن أو بيزن، صوت زلط وضغط بيقع من التكهف (كافيتيشن)، تصرف أقل من حلقة تآكل دايبة، رعشة من عدم الاستعدال.'],
      pm: ['Check oil level, bearing temperature and vibration; never run dry or long against a closed valve; laser-align after every job; replace the wear ring when the clearance doubles.', 'اتأكد من مستوى الزيت وحرارة الرولمان والرعشة؛ متشغلهاش ناشفة ولا كتير على محبس مقفول؛ اعمل ضبط استعدال بالليزر بعد أي شغلانة؛ غيّر حلقة التآكل لما الخلوص يبقى الضعف.'],
    },
    cut: 'z',
    parts: [
      { id: 'shaft', name: ['Pump shaft', 'عمود الطلمبة'], role: ['Carries the impeller at the front and the coupling at the back; runs in the two bearings.', 'شايل الريشة من قدام والكوبلنج من ورا، ولافف على البلتين.'], mat: 'steel', ex: [0, -22, 0], cut: false,
        s: [{ t: 'lathe', ax: 'x', pts: [[0, -42], [1.2, -42], [1.2, -33.8], [1.5, -33.8], [1.5, -10.4], [1.25, -10.4], [1.25, -2.1], [1.0, -2.1], [1.0, 0.9], [0.8, 0.9], [0.8, 1.75], [0, 1.75]] }] },
      { id: 'bearing_ib', name: ['Inboard bearing', 'رولمان بلي الداخلي'], role: ['Deep-groove ball bearing next to the pump end; takes the radial load.', 'بلية مجرى عميق ناحية الطلمبة؛ شايلة الحمل القطري.'], mat: 'steel', ex: [0, -22, 0], cut: false, s: brg(-13.25, 1.5, 3.6, 1.7) },
      { id: 'bearing_ob', name: ['Outboard bearing (double row)', 'رولمان بلي الخارجي (صفين)'], role: ['Double-row angular contact bearing; holds the axial thrust of the impeller.', 'بلية صفين تلامس زاوي؛ شايلة الدفع المحوري بتاع الريشة.'], mat: 'steel', ex: [0, -22, 0], cut: false, s: brg(-29.8, 1.5, 3.6, 2.6, 2) },
      { id: 'frame', name: ['Bearing frame with adapter', 'فريم الرولمان مع الأدابتر'], role: ['Oil-filled housing for the bearings, with its own foot; the adapter bolts it to the back plate.', 'جسم فيه زيت للرولمان وليه رجل؛ الأدابتر بيربطه في الغطا الخلفي.'], mat: 'cast', ex: [0, 0, 0],
        s: [{ t: 'lathe', ax: 'x', pts: [[2.6, -10.6], [2.6, -11.8], [3.6, -11.8], [3.6, -15], [5, -15], [5, -27.6], [3.6, -27.6], [3.6, -32.2], [2.6, -32.2], [2.6, -33.4], [6, -33.4], [6, -10.6], [2.6, -10.6]] },
          { t: 'cyl', ax: 'x', ri: 8.2, r: 10.6, h: 0.8, p: [-5.4, 0, 0] }, ...ribs,
          { t: 'box', w: 4, h: 9.2, d: 10, p: [-27, -10.4, 0] },
          { t: 'hex', r: 0.7, h: 0.8, p: [-20, 6.3, 0], m: 'steel' },
          { t: 'cyl', ax: 'z', r: 1, h: 0.6, p: [-21, -2.2, 5.8], m: 'oil' }] },
      { id: 'oil_seal', name: ['Oil seals (lip seals)', 'أويل سيل (سيل شفايف)'], role: ['Rubber lip seals at both frame ends keep the oil in and dirt out.', 'سيل كاوتش بشفة في طرفي الفريم يمسك الزيت جوه والوسخ بره.'], mat: 'rubber', ex: [0, 9, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 1.5, r: 2.6, h: 0.7, p: [-11.2, 0, 0] }, { t: 'cyl', ax: 'x', ri: 1.5, r: 2.6, h: 0.7, p: [-32.8, 0, 0] }] },
      { id: 'backplate', name: ['Back plate (seal chamber)', 'الغطا الخلفي (غرفة السيل)'], role: ['Closes the back of the casing and forms the chamber around the mechanical seal.', 'بيقفل ضهر الجسم وبيعمل الغرفة اللي حوالين الميكانيكال سيل.'], mat: 'cast', ex: [8, 0, 0],
        s: [{ t: 'flange', ax: 'x', r: 12.2, ri: 2.7, h: 1.0, holes: 8, pcd: 11.4, hr: 0.4, p: [-4.45, 0, 0] }, { t: 'cyl', ax: 'x', ri: 2.7, r: 3.5, h: 4.05, p: [-6.975, 0, 0] }] },
      { id: 'seal', name: ['Mechanical seal', 'ميكانيكال سيل'], role: ['Spring-loaded carbon face turns against a fixed SiC seat held in the gland plate. A thin liquid film between the faces seals and cools them.', 'وش كربون عليه سوستة بيلف على سيت سيليكون كاربايد ثابت في الجلاند. طبقة سايل رفيعة بين الوشين بتقفل وبتبرد.'], mat: 'steel', ex: [16, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 1.25, r: 2.1, h: 0.8, p: [-5.8, 0, 0] }, { t: 'spring', ax: 'x', R: 1.7, r: 0.14, turns: 5, len: 2.2, p: [-7.3, 0, 0] },
          { t: 'cyl', ax: 'x', ri: 1.3, r: 2.1, h: 0.6, p: [-8.7, 0, 0], m: 'carbon' }, { t: 'cyl', ax: 'x', ri: 1.45, r: 2.4, h: 0.7, p: [-9.35, 0, 0], m: 'sic' },
          { t: 'flange', ax: 'x', r: 4.8, ri: 2.45, h: 0.9, holes: 2, pcd: 4.0, hr: 0.35, p: [-9.45, 0, 0], m: 'sst' }, { t: 'cyl', ax: 'x', ri: 1.5, r: 2.45, h: 0.2, p: [-9.8, 0, 0], m: 'sst' }] },
      { id: 'key', name: ['Keys (impeller and coupling)', 'الخوابير (الريشة والكوبلنج)'], role: ['Parallel keys lock the impeller and the coupling hub to the shaft.', 'خوابير متوازية بتقفل الريشة وهب الكوبلنج على العمود.'], mat: 'steel', ex: [0, -17, 0], cut: false,
        s: [{ t: 'box', w: 2.6, h: 0.4, d: 0.5, p: [-0.6, 1.0, 0] }, { t: 'box', w: 5, h: 0.4, d: 0.5, p: [-38.5, 1.2, 0] }] },
      { id: 'impeller', name: ['Closed impeller', 'ريشة مقفولة (إمبلر)'], role: ['Curved vanes between two shrouds; the eye faces the suction.', 'ريش مقوسة بين قرصين؛ العين في وش السحب.'], mat: 'bronze', ex: [14, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 8, h: 0.35, p: [-1.4, 0, 0] },
          { t: 'vanes', ax: 'x', n: 6, r1: 2.4, r2: 7.9, h: 2.4, curve: 70, thick: 0.28 },
          { t: 'lathe', ax: 'x', pts: [[2.25, 3.4], [2.25, 1.6], [2.6, 1.55], [8, 0.95], [8, 1.25], [2.55, 1.9], [2.55, 3.4], [2.25, 3.4]] },
          { t: 'cyl', ax: 'x', ri: 1.0, r: 1.9, h: 3.0, p: [-0.6, 0, 0] }] },
      { id: 'nut', name: ['Impeller nut', 'صامولة الريشة'], role: ['Holds the impeller on the shaft end; thread is against the rotation so it self-tightens.', 'ماسكة الريشة في طرف العمود؛ السن عكس اللف عشان تربط نفسها.'], mat: 'sst', ex: [18, 0, 0], cut: false,
        s: [{ t: 'hex', ax: 'x', r: 1.15, h: 0.8, p: [1.3, 0, 0] }] },
      { id: 'gasket', name: ['Casing gasket', 'جوان الجسم'], role: ['Seals the joint between casing and back plate.', 'بيقفل الوصلة بين الجسم والغطا الخلفي.'], mat: 'black', ex: [25, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 10.4, r: 12.2, h: 0.15, p: [-3.875, 0, 0] }] },
      { id: 'wear_ring', name: ['Casing wear ring', 'حلقة التآكل (ويرنج)'], role: ['Renewable ring with a small gap to the impeller eye; stops discharge leaking back to suction.', 'حلقة بتتغير وخلوصها صغير مع عين الريشة؛ بتمنع رجوع الطرد للسحب.'], mat: 'brass', ex: [21, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 2.6, r: 3.3, h: 1.2, p: [3.0, 0, 0] }] },
      { id: 'casing', name: ['Volute casing', 'الجسم الحلزوني (فوليوت)'], role: ['Spiral casing with axial suction (+X) and top discharge; stays bolted to the pipes.', 'جسم حلزوني السحب من الوش والطرد من فوق؛ بيفضل مربوط في المواسير.'], mat: 'castg', ex: [30, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 5.2, pts: yz(volute), holes: [{ c: [0, 0], r: 10.4 }] },
          { t: 'lathe', ax: 'x', pts: [[2.6, 9.6], [2.6, 3.6], [3.3, 3.6], [3.3, 2.4], [5.5, 2.4], [10.8, 2.0], [10.8, 2.7], [5.5, 3.5], [3.2, 4.4], [3.2, 9.6], [2.6, 9.6]] },
          { t: 'cyl', ax: 'x', ri: 10.4, r: 12.4, h: 1.2, p: [-3.2, 0, 0] },
          { t: 'flange', ax: 'x', r: 8.25, ri: 2.6, h: 1.4, holes: 4, pcd: 6.25, hr: 0.8, p: [8.9, 0, 0] },
          { t: 'cyl', ri: 1.6, r: 2.3, h: 8, p: [0, 14.6, 0] },
          { t: 'flange', r: 7, ri: 1.6, h: 1.4, holes: 4, pcd: 5.5, hr: 0.8, p: [0, 18.3, 0] },
          { t: 'box', w: 5, h: 3, d: 14, p: [0, -13.5, 0] }] },
    ],
    steps: ['shaft', 'bearing_ib', 'bearing_ob', 'frame', 'oil_seal', 'backplate', 'seal', 'key', 'impeller', 'nut', 'gasket', 'wear_ring', 'casing'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft: { rot: [1, 0, 0] }, bearing_ib: { rot: [1, 0, 0] }, bearing_ob: { rot: [1, 0, 0] }, key: { rot: [1, 0, 0] }, impeller: { rot: [1, 0, 0] }, nut: { rot: [1, 0, 0] } } },
    quiz: [
      { q: ['Why must a pump with a mechanical seal never run dry?', 'ليه الطلمبة اللي فيها ميكانيكال سيل متشتغلش ناشفة أبداً؟'], a: ['The seal faces lose their liquid film, overheat and crack', 'أوشاش السيل بتفقد طبقة السايل وتسخن وتشرخ'], w: [['The motor overloads', 'الموتور يفصل أوفرلود'], ['The volute rusts', 'الحلزون يصدّي'], ['The coupling slips', 'الكوبلنج يفوّت']] },
      { q: ['Gravel noise at the pump and the discharge pressure keeps dropping. Most likely cause?', 'صوت زلط في الطلمبة وضغط الطرد بيقع. السبب الأقرب؟'], a: ['Cavitation: suction pressure too low (blocked strainer, low tank level)', 'تكهف: ضغط السحب واطي (مصفاة مسدودة، مستوى تانك واطي)'], w: [['Too much oil in the frame', 'زيت زيادة في الفريم'], ['Wear ring too tight', 'حلقة التآكل مزنوقة'], ['Motor running in star', 'الموتور شغال ستار']] },
      { q: ['Main advantage of the back pull-out design?', 'أهم ميزة في تصميم الباك بول أوت؟'], a: ['Impeller, seal and bearings come out without touching the pipes', 'الريشة والسيل والرولمان بيطلعوا من غير ما تلمس المواسير'], w: [['It needs no alignment', 'مش محتاجة ضبط استعدال'], ['It is self-priming', 'بتسحب لوحدها (سلف برايمنج)'], ['It has no seal', 'مفيهاش سيل']] },
    ],
  });

  /* ---------- external gear pump ---------- */
  // figure-8 cavity around two gear bores (ext ax 'x' coordinates)
  function fig8(c1, c2, R, n) {
    const d = Math.hypot(c2[0] - c1[0], c2[1] - c1[1]), ph = Math.acos(d / (2 * R)), out = [];
    const a12 = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]), a21 = a12 + Math.PI;
    for (let i = 0; i <= n; i++) { const a = a12 + ph + ((2 * Math.PI - 2 * ph) * i) / n; out.push([r3(c1[0] + R * Math.cos(a)), r3(c1[1] + R * Math.sin(a))]); }
    for (let i = 0; i <= n; i++) { const a = a21 + ph + ((2 * Math.PI - 2 * ph) * i) / n; out.push([r3(c2[0] + R * Math.cos(a)), r3(c2[1] + R * Math.sin(a))]); }
    return out;
  }
  const GZ = -3.2; // idler gear centre (z); drive gear on the main axis
  const gRect = yz([[3, 2.8], [3, GZ - 2.8], [-3, GZ - 2.8], [-3, 2.8]]);
  const idRot = meshRot(12, 0, 270, 12, 90, 1.6, 1.6);
  const bolts = [[2.4, 2.1], [2.4, GZ - 2.1], [-2.4, 2.1], [-2.4, GZ - 2.1]];
  M.add({
    id: 'gear_pump', cat: 'pumps',
    name: ['External gear pump', 'طلمبة تروس خارجية'],
    info: {
      what: ['Positive-displacement pump: two equal spur gears turn in a close-fitting body; one is driven, the other follows.', 'طلمبة إزاحة موجبة: ترسين زي بعض بيلفوا جوه جسم مظبوط عليهم؛ واحد بيتشغل والتاني ماشي معاه.'],
      use: ['Lube-oil systems, hydraulic power packs, and transfer of thick liquids such as syrups, glycerin and ointment bases.', 'دواير زيت التزييت، الباور باك الهيدروليك، ونقل السوايل التقيلة زي الشراب والجليسرين وقواعد المراهم.'],
      how: ['Where the teeth come out of mesh a space opens and sucks liquid in; it is carried round the outside between the teeth and the body and pushed out where the teeth mesh again. Flow is set by speed, not by pressure.', 'مكان ما السنون بتفك من بعض بيتعمل فراغ يسحب السايل؛ بيلف حوالين بره بين السنة والجسم وبيتزق لبره مكان ما السنون بتعشق تاني. التصرف بيتحدد بالسرعة مش بالضغط.'],
      fail: ['Worn bushings and side plates give internal slip and low flow; whining noise from cavitation with thick liquid; shaft seal leaks; a closed discharge without relief valve can burst the body or break the shaft.', 'الجلب والجوانب لما تدوب السايل يرجع جوه والتصرف يقل؛ صفير من التكهف مع السايل التقيل؛ سيل العمود يسرّب؛ لو الطرد اتقفل من غير صمام أمان ممكن الجسم يتفرتك أو العمود يتكسر.'],
      pm: ['Always fit a relief valve; never run dry or with the discharge closed; keep a suction strainer; check flow and pressure at rated speed to judge wear.', 'لازم صمام أمان (ريليف)؛ متشغلهاش ناشفة ولا والطرد مقفول؛ خلي مصفاة على السحب؛ قيس التصرف والضغط على السرعة المقننة عشان تعرف التآكل.'],
    },
    cut: 'x',
    parts: [
      { id: 'body', name: ['Pump body', 'جسم الطلمبة'], role: ['Figure-8 bore that fits closely round the gear tips; discharge port on top.', 'جسم فيه تجويف على شكل 8 مظبوط على رؤوس السنون؛ فتحة الطرد من فوق.'], mat: 'castg', ex: [0, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 2.6, pts: gRect, holes: [fig8([0, 0], [0, -GZ], 1.9, 28)] },
          { t: 'cyl', ri: 0.7, r: 1.3, h: 1.0, p: [0, 3.5, GZ / 2] }] },
      { id: 'drive_shaft', name: ['Drive shaft', 'عمود الإدارة'], role: ['Turned by the motor through a coupling; drives the drive gear.', 'بيلف من الموتور عن طريق الكوبلنج؛ بيشغّل ترس الإدارة.'], mat: 'steel', ex: [-6, 9, 0],
        s: [{ t: 'cyl', ax: 'x', r: 0.6, h: 10.4, p: [-2.3, 0, 0] }] },
      { id: 'key', name: ['Shaft key', 'خابور العمود'], role: ['Locks the coupling hub to the drive shaft.', 'بيقفل هب الكوبلنج على عمود الإدارة.'], mat: 'steel', ex: [-6, 10.5, 0], cut: false,
        s: [{ t: 'box', w: 2.2, h: 0.3, d: 0.3, p: [-6.2, 0.6, 0] }] },
      { id: 'drive_gear', name: ['Drive gear', 'ترس الإدارة'], role: ['Keyed to the drive shaft; turns the idler gear.', 'متركب بخابور على عمود الإدارة؛ بيلف الترس التاني.'], mat: 'steel', ex: [0, 9, 0],
        s: [{ t: 'gear', ax: 'x', r: 1.85, rr: 1.3, teeth: 12, h: 2.6, ri: 0.6 }] },
      { id: 'idler_gear', name: ['Idler gear', 'الترس التابع'], role: ['Driven by the drive gear, turns the other way.', 'بيلف من ترس الإدارة في الاتجاه العكسي.'], mat: 'steel', o: [0, 0, GZ], ex: [0, 9, 0],
        s: [{ t: 'gear', ax: 'x', r: 1.85, rr: 1.3, teeth: 12, h: 2.6, ri: 0.6, rot: [idRot, 0, 0] }] },
      { id: 'idler_shaft', name: ['Idler shaft', 'عمود الترس التابع'], role: ['Short shaft supported in a bushing at each end.', 'عمود قصير مسنود على جلبة في كل طرف.'], mat: 'steel', o: [0, 0, GZ], ex: [6, 9, 0],
        s: [{ t: 'cyl', ax: 'x', r: 0.6, h: 5.6, p: [0.1, 0, 0] }] },
      { id: 'bush_front', name: ['Front bushings', 'الجلب الأمامية'], role: ['Bronze sleeve bearings in the front cover, lubricated by the pumped liquid.', 'جلب برونز في الغطا الأمامي، بتتزيت من السايل نفسه.'], mat: 'bronze', ex: [-3.5, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 0.6, r: 0.9, h: 1.4, p: [-2.0, 0, 0] }, { t: 'cyl', ax: 'x', ri: 0.6, r: 0.9, h: 1.4, p: [-2.0, 0, GZ] }] },
      { id: 'front_cover', name: ['Front cover with mounting flange', 'الغطا الأمامي بفلانشة التركيب'], role: ['Holds the front bushings and shaft seal; the pilot centres the pump on the bracket.', 'شايل الجلب الأمامية وسيل العمود؛ السنتر بيوسّط الطلمبة على الحامل.'], mat: 'castg', ex: [-6, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 1.5, pts: gRect, holes: [{ c: [0, 0], r: 0.9 }, { c: [0, -GZ], r: 0.9 }], p: [-2.05, 0, 0] },
          { t: 'ext', ax: 'x', d: 0.5, pts: gRect, holes: [{ c: [0, 0], r: 0.9 }], p: [-3.05, 0, 0] },
          { t: 'ext', ax: 'x', d: 0.5, pts: yz([[3, 6], [3, GZ - 6], [-3, GZ - 6], [-3, 6]]), holes: [{ c: [0, -4.5], r: 0.5 }, { c: [0, -GZ + 4.5], r: 0.5 }, { c: [0, 0], r: 0.9 }], p: [-3.55, 0, 0] }] },
      { id: 'shaft_seal', name: ['Shaft lip seal', 'سيل العمود (شفة)'], role: ['Stops leakage where the drive shaft leaves the pump.', 'بيمنع التسريب مكان ما العمود بيطلع من الطلمبة.'], mat: 'rubber', ex: [-10, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 0.6, r: 0.9, h: 0.45, p: [-3.05, 0, 0] }] },
      { id: 'bush_rear', name: ['Rear bushings', 'الجلب الخلفية'], role: ['Second pair of bronze bushings in the rear cover.', 'تاني جوز جلب برونز في الغطا الخلفي.'], mat: 'bronze', ex: [3.5, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 0.6, r: 0.9, h: 1.4, p: [2.0, 0, 0] }, { t: 'cyl', ax: 'x', ri: 0.6, r: 0.9, h: 1.4, p: [2.0, 0, GZ] }] },
      { id: 'rear_cover', name: ['Rear cover with suction port', 'الغطا الخلفي بفتحة السحب'], role: ['Closes the body; suction enters here (+X) below the gear mesh.', 'بيقفل الجسم؛ السحب بيدخل منه (+X) تحت تعشيق التروس.'], mat: 'castg', ex: [6, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 1.8, pts: gRect, holes: [{ c: [0, 0], r: 0.9 }, { c: [0, -GZ], r: 0.9 }], p: [2.2, 0, 0] },
          { t: 'cyl', ax: 'x', r: 0.9, h: 0.3, p: [2.95, 0, 0] }, { t: 'cyl', ax: 'x', r: 0.9, h: 0.3, p: [2.95, 0, GZ] },
          { t: 'cyl', ax: 'x', ri: 0.75, r: 1.3, h: 1.0, p: [3.6, -1.9, GZ / 2] }] },
      { id: 'bolts', name: ['Through bolts', 'مسامير التجميع'], role: ['Four long cap screws clamp covers and body together; tighten crosswise.', 'أربع مسامير طويلة بتزنق الغطيان والجسم مع بعض؛ اربط بالتقاطع.'], mat: 'black', ex: [0, -8, 0],
        s: bolts.flatMap(([y, z]) => [{ t: 'cyl', ax: 'x', r: 0.25, h: 6.6, p: [-0.3, y, z] }, { t: 'cyl', ax: 'x', r: 0.42, h: 0.4, p: [3.3, y, z] }]) },
    ],
    steps: ['body', 'bush_front', 'front_cover', 'drive_shaft', 'drive_gear', 'idler_shaft', 'idler_gear', 'bush_rear', 'rear_cover', 'bolts', 'shaft_seal', 'key'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { drive_shaft: { rot: [1, 0, 0], speed: -1 }, key: { rot: [1, 0, 0], speed: -1 }, drive_gear: { rot: [1, 0, 0], speed: -1 }, idler_gear: { rot: [1, 0, 0], speed: 1 }, idler_shaft: { rot: [1, 0, 0], speed: 1 } } },
    quiz: [
      { q: ['The discharge valve of a running gear pump is closed and there is no relief valve. What happens?', 'محبس الطرد لطلمبة تروس شغالة اتقفل ومفيش صمام أمان. إيه اللي يحصل؟'], a: ['Pressure rises until something breaks or the motor trips', 'الضغط يعلى لحد ما حاجة تتكسر أو الموتور يفصل'], w: [['Flow just stops safely', 'التصرف يقف بأمان'], ['It recirculates like a centrifugal pump', 'بتلف السايل جواها زي الطرد المركزي'], ['The gears slip on the shaft', 'التروس تفوّت على العمود']] },
      { q: ['Flow of a gear pump falls with age at the same speed. Usual cause?', 'تصرف طلمبة التروس بيقل مع الوقت على نفس السرعة. السبب المعتاد؟'], a: ['Worn bushings and side faces increase internal slip', 'الجلب والجوانب داب فالسايل بيرجع جوه أكتر'], w: [['The motor got stronger', 'الموتور بقى أقوى'], ['Viscosity increased', 'اللزوجة زادت'], ['The key is missing', 'الخابور مش موجود']] },
    ],
  });

  /* ---------- air operated double diaphragm (AODD) pump ---------- */
  const PX = 9.5; // check valve / port line
  const mir = (pts, sx) => { const q = pts.map((a) => [a[0], r3(a[1] * sx)]); return sx < 0 ? q.reverse() : q; }; // lathe profiles stay counter-clockwise
  const dia = (sx) => ({ t: 'lathe', ax: 'x', pts: mir([[0, 0], [11, 0], [11, 0.5], [8.6, 0.5], [7.6, 1.2], [6.6, 0.5], [0, 0.5], [0, 0]], sx) });
  const chamber = (sx) => [
    { t: 'lathe', ax: 'x', pts: mir([[10.6, 7.75], [11.6, 7.75], [11.6, 8.4], [10.4, 9.1], [6, 11.7], [0, 12.4], [0, 11.6], [5.6, 11.0], [9.6, 8.9], [10.6, 8.4], [10.6, 7.75]], sx) },
    { t: 'cyl', ri: 1.6, r: 2.3, h: 6.8, p: [PX * sx, -11.4, 0] }, { t: 'cyl', ri: 1.6, r: 2.3, h: 6.8, p: [PX * sx, 11.4, 0] }];
  const checks = (y0) => [-1, 1].flatMap((sx) => [{ t: 'cyl', ri: 0.9, r: 1.6, h: 0.5, p: [PX * sx, y0, 0], m: 'ptfe' }, { t: 'sph', r: 1.35, p: [PX * sx, y0 + 1.6, 0], m: 'white', cut: false }]);
  M.add({
    id: 'aodd_pump', cat: 'pumps',
    name: ['Air operated double diaphragm pump (AODD)', 'طلمبة دايافرام مزدوجة بالهوا (AODD)'],
    info: {
      what: ['Positive-displacement pump driven only by compressed air: two diaphragms joined by a shaft, an air valve and four ball check valves.', 'طلمبة إزاحة موجبة بتشتغل بالهوا المضغوط بس: دايافرامين متوصلين بعمود، صمام هوا، وأربع بلوف بكورة.'],
      use: ['Drum and IBC transfer of ethanol and IPA in granulation and coating, detergents, sludge and sumps. No electric parts, so it is used in Ex (ATEX) zones.', 'تفريغ البراميل والـIBC للإيثانول والأيزوبروبانول في الجرانيوليشن والكوتنج، المنظفات، الحمأة والبيارات. مفيهاش كهربا فبتستخدم في مناطق الانفجار (ATEX).'],
      how: ['Air pushes one diaphragm out, discharging that chamber, while the shaft pulls the other in and fills it. At the end of the stroke the air valve shifts and the motion reverses. The balls let liquid flow upward only.', 'الهوا بيزق دايافرام لبره فيطرد الغرفة دي، والعمود بيشد التاني لجوه فيسحب. في آخر الشوط صمام الهوا بيعكس والحركة ترجع. الكور بتخلي السايل يمشي لفوق بس.'],
      fail: ['Liquid out of the air exhaust = torn diaphragm. Pump stalls or runs erratic: air valve sticking or icing. Low flow with normal strokes: worn balls or seats.', 'سايل طالع من الشكمان = دايافرام مقطوع. الطلمبة بتقف أو بتشتغل متقطع: صمام الهوا لازق أو عليه تلج. تصرف قليل والشوط طبيعي: كور أو سيتات دايبة.'],
      pm: ['Feed clean, dry, regulated air; earth the pump with solvents (static); check the muffler for liquid; replace diaphragms on schedule and torque the chamber bolts evenly.', 'غذّيها بهوا نضيف وناشف ومظبوط بمنظم؛ اعمل أرضي للطلمبة مع المذيبات (كهربا استاتيكية)؛ بص على الشكمان لو فيه سايل؛ غيّر الدايافرام في ميعاده واربط مسامير الغرف بالتساوي.'],
    },
    cut: 'z',
    parts: [
      { id: 'center', name: ['Centre section (air chambers)', 'الجسم الأوسط (غرف الهوا)'], role: ['Holds the shaft bushing and forms the air side behind each diaphragm.', 'شايل جلبة العمود وبيعمل جهة الهوا ورا كل دايافرام.'], mat: 'alu', ex: [0, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 0.85, r: 6, h: 8 },
          { t: 'lathe', ax: 'x', pts: [[0.85, 4], [6, 4], [10.4, 6.2], [11.6, 6.7], [11.6, 7.25], [10.8, 7.25], [9.8, 6.6], [6, 5], [0.85, 5], [0.85, 4]] },
          { t: 'lathe', ax: 'x', pts: [[0.85, -4], [0.85, -5], [6, -5], [9.8, -6.6], [10.8, -7.25], [11.6, -7.25], [11.6, -6.7], [10.4, -6.2], [6, -4], [0.85, -4]] }] },
      { id: 'shaft', name: ['Diaphragm shaft', 'عمود الدايافرام'], role: ['Joins both diaphragms so one pushes while the other sucks.', 'بيربط الدايافرامين فواحد يطرد والتاني يسحب.'], mat: 'sst', o: [-0.8, 0, 0], ex: [0, 0, 0], cut: false,
        s: [{ t: 'cyl', ax: 'x', r: 0.8, h: 18.4, p: [0.8, 0, 0] }] },
      { id: 'diaphragm_l', name: ['Diaphragm (left) with plates', 'الدايافرام الشمال بالأقراص'], role: ['Flexible PTFE-faced membrane clamped at the rim, bolted to the shaft between two plates.', 'غشا مرن وشه تيفلون متزنق من البرواز، ومربوط في العمود بين قرصين.'], mat: 'ptfe', o: [-0.8, 0, 0], ex: [-7, 0, 0],
        s: [{ ...dia(-1), p: [-6.45, 0, 0] }, { t: 'cyl', ax: 'x', r: 5, h: 0.5, p: [-6.25, 0, 0], m: 'sst' }, { t: 'cyl', ax: 'x', r: 4.2, h: 0.6, p: [-7.8, 0, 0], m: 'sst' }, { t: 'hex', ax: 'x', r: 1.1, h: 0.7, p: [-8.4, 0, 0], m: 'sst' }] },
      { id: 'diaphragm_r', name: ['Diaphragm (right) with plates', 'الدايافرام اليمين بالأقراص'], role: ['Same as the left one; works opposite to it.', 'زي الشمال بالظبط؛ بيشتغل عكسه.'], mat: 'ptfe', o: [-0.8, 0, 0], ex: [7, 0, 0],
        s: [{ ...dia(1), p: [8.05, 0, 0] }, { t: 'cyl', ax: 'x', r: 5, h: 0.5, p: [7.85, 0, 0], m: 'sst' }, { t: 'cyl', ax: 'x', r: 4.2, h: 0.6, p: [9.4, 0, 0], m: 'sst' }, { t: 'hex', ax: 'x', r: 1.1, h: 0.7, p: [10.0, 0, 0], m: 'sst' }] },
      { id: 'chamber_l', name: ['Liquid chamber (left)', 'غرفة السايل الشمال'], role: ['Outer chamber on the liquid side, with inlet and outlet necks.', 'الغرفة الخارجية ناحية السايل، فيها رقبة دخول ورقبة خروج.'], mat: 'sst', ex: [-14, 0, 0], s: chamber(-1) },
      { id: 'chamber_r', name: ['Liquid chamber (right)', 'غرفة السايل اليمين'], role: ['Mirror of the left chamber.', 'نسخة معكوسة من الغرفة الشمال.'], mat: 'sst', ex: [14, 0, 0], s: chamber(1) },
      { id: 'checks_in', name: ['Inlet ball checks', 'بلوف الكورة على الدخول'], role: ['Ball lifts off its seat when the chamber sucks, drops back when it pushes.', 'الكورة بتترفع من السيت لما الغرفة تسحب، وتقع تاني لما تطرد.'], mat: 'ptfe', ex: [0, -8, 0], s: checks(-14.4) },
      { id: 'checks_out', name: ['Outlet ball checks', 'بلوف الكورة على الخروج'], role: ['Open when the chamber pushes, close when it sucks so discharge cannot come back.', 'بتفتح لما الغرفة تطرد وتقفل لما تسحب عشان الطرد ميرجعش.'], mat: 'ptfe', ex: [0, 8, 0], s: checks(10.6) },
      { id: 'inlet_manifold', name: ['Inlet manifold with feet', 'مانيفولد الدخول بالرجول'], role: ['Bottom manifold feeds both chambers; suction port on the +X end.', 'المانيفولد اللي تحت بيغذي الغرفتين؛ فتحة السحب في طرف +X.'], mat: 'sst', ex: [0, -14, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 1.6, r: 2.2, h: 24.2, p: [0.9, -17.5, 0] }, { t: 'cyl', ax: 'x', r: 2.2, h: 0.4, p: [-11.0, -17.5, 0] },
          { t: 'cyl', ri: 1.6, r: 2.2, h: 2.4, p: [-PX, -15.6, 0] }, { t: 'cyl', ri: 1.6, r: 2.2, h: 2.4, p: [PX, -15.6, 0] },
          { t: 'flange', ax: 'x', r: 4.5, ri: 1.6, h: 1.0, holes: 4, pcd: 3.4, hr: 0.4, p: [12.6, -17.5, 0] },
          { t: 'box', w: 3, h: 2.6, d: 12, p: [-PX, -20.6, 0] }, { t: 'box', w: 3, h: 2.6, d: 12, p: [PX, -20.6, 0] }] },
      { id: 'outlet_manifold', name: ['Outlet manifold', 'مانيفولد الخروج'], role: ['Top manifold collects both chambers; discharge port points up.', 'المانيفولد اللي فوق بيجمع الغرفتين؛ فتحة الطرد لفوق.'], mat: 'sst', ex: [0, 14, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 1.6, r: 2.2, h: 21.4, p: [0, 17.5, 0] },
          { t: 'cyl', ri: 1.6, r: 2.2, h: 2.4, p: [-PX, 15.6, 0] }, { t: 'cyl', ri: 1.6, r: 2.2, h: 2.4, p: [PX, 15.6, 0] },
          { t: 'cyl', ri: 1.6, r: 2.2, h: 3.4, p: [0, 20.4, 0] }, { t: 'flange', r: 4.5, ri: 1.6, h: 1.0, holes: 4, pcd: 3.4, hr: 0.4, p: [0, 22.4, 0] }] },
      { id: 'air_valve', name: ['Air valve with muffler', 'صمام الهوا والشكمان'], role: ['Spool valve that sends air to one side and vents the other, shifting at each stroke end; the muffler quietens the exhaust.', 'صمام بكرة بيبعت الهوا لناحية ويطلّع الناحية التانية، وبيعكس في آخر كل شوط؛ الشكمان بيهدّي صوت العادم.'], mat: 'alu', ex: [0, 4, 10],
        s: [{ t: 'box', w: 6, h: 3.2, d: 6, p: [0, 7.4, 0] }, { t: 'cyl', ax: 'x', r: 0.7, h: 7, p: [0, 7.6, 0], m: 'chrome' },
          { t: 'cyl', ax: 'z', ri: 0.4, r: 0.8, h: 1.6, p: [0, 7.6, 3.8], m: 'brass' }, { t: 'cyl', ax: 'z', r: 1.3, h: 4, p: [0, 7.4, -5], m: 'black' }] },
    ],
    steps: ['center', 'shaft', 'diaphragm_l', 'diaphragm_r', 'chamber_l', 'chamber_r', 'checks_in', 'inlet_manifold', 'checks_out', 'outlet_manifold', 'air_valve'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft: { slide: [1.6, 0, 0], speed: 0.6 }, diaphragm_l: { slide: [1.6, 0, 0], speed: 0.6 }, diaphragm_r: { slide: [1.6, 0, 0], speed: 0.6 } } },
    quiz: [
      { q: ['Product is coming out of the air exhaust muffler. What failed?', 'المنتج طالع من شكمان الهوا. إيه اللي باظ؟'], a: ['A diaphragm is torn', 'دايافرام مقطوع'], w: [['An inlet ball is stuck', 'كورة دخول لازقة'], ['The air pressure is too low', 'ضغط الهوا قليل'], ['The outlet manifold is blocked', 'مانيفولد الخروج مسدود']] },
      { q: ['Why is an AODD pump a good choice for ethanol transfer?', 'ليه طلمبة الدايافرام بالهوا اختيار كويس لنقل الإيثانول؟'], a: ['No electric motor or sparks, it can run dry and can be stalled safely', 'مفيهاش موتور ولا شرر، تستحمل تشتغل ناشفة وتقف على الضغط بأمان'], w: [['It gives very high pressure', 'بتدي ضغط عالي جداً'], ['It needs no air', 'مش محتاجة هوا'], ['It never needs earthing', 'مش محتاجة أرضي أبداً']] },
    ],
  });

  /* ---------- peristaltic (hose) pump ---------- */
  const RH = 5.5; // hose centre radius in the track
  const track = [];
  for (let i = 0; i <= 24; i++) { const th = Math.PI / 2 + (Math.PI * i) / 24; track.push([7.8 * Math.cos(th), 7.8 * Math.sin(th)]); }
  track.push([8, -7.8], [8, -6.3]);
  for (let i = 24; i >= 0; i--) { const th = Math.PI / 2 + (Math.PI * i) / 24; track.push([6.3 * Math.cos(th), 6.3 * Math.sin(th)]); }
  track.push([8, 6.3], [8, 7.8]);
  const hosePath = [[0, 11.5, RH], [0, 3, RH]];
  for (let i = 0; i <= 16; i++) { const th = Math.PI / 2 + (Math.PI * i) / 16; hosePath.push([0, r3(RH * Math.cos(th)), r3(RH * Math.sin(th))]); }
  hosePath.push([0, 3, -RH], [0, 11.5, -RH]);
  M.add({
    id: 'peristaltic_pump', cat: 'pumps',
    name: ['Peristaltic (hose) pump', 'طلمبة بيرستالتيك (خرطوم)'],
    info: {
      what: ['Positive-displacement pump where rollers squeeze a flexible hose against a curved track. The liquid only touches the inside of the hose.', 'طلمبة إزاحة موجبة: بكر بيعصر خرطوم مرن على مجرى مقوس. السايل مش بيلمس غير جوه الخرطوم.'],
      use: ['Chemical dosing in the water plant (hypochlorite, SMBS, antiscalant), lab and sterile transfers, filling small volumes and shear-sensitive liquids.', 'حقن الكيماويات في محطة المية (هيبوكلوريت، SMBS، مانع ترسيب)، نقل في المعمل ونقل معقم، تعبئة كميات صغيرة وسوايل حساسة للقص.'],
      how: ['Each roller closes the hose and pushes the trapped pocket forward; behind it the hose springs back round and sucks in new liquid. Flow is proportional to speed and it can run dry.', 'كل بكرة بتقفل الخرطوم وبتزق الجيب المحبوس لقدام؛ وراها الخرطوم بيرجع لشكله ويسحب سايل جديد. التصرف على قد السرعة وممكن تشتغل ناشفة.'],
      fail: ['Hose burst or crack from fatigue (liquid in the housing), flow drop as the hose loses its spring, too much squeeze wears hoses fast, too little lets liquid slip back.', 'الخرطوم يتفرتك أو يشرخ من الإجهاد (سايل جوه الجسم)، التصرف يقل لما الخرطوم يفقد مرونته، العصر الزيادة بيبوّظ الخرطوم بسرعة والقليل بيرجّع السايل.'],
      pm: ['Change the hose by running hours, set the roller gap (occlusion) to the hose wall, check the leak detector, keep the track clean and lubricated as the maker says.', 'غيّر الخرطوم بعدد ساعات التشغيل، اظبط خلوص البكر على سُمك الخرطوم، اتأكد من حساس التسريب، خلي المجرى نضيف ومتزيت حسب الكتالوج.'],
    },
    cut: 'x',
    parts: [
      { id: 'back_plate', name: ['Back plate / gearmotor flange', 'الضهر / فلانشة الموتور'], role: ['Rigid plate the housing and gearmotor bolt to; holds the shaft bearing.', 'لوح جامد بيتربط فيه الجسم والموتور بالجيربوكس؛ فيه بلية العمود.'], mat: 'castg', ex: [-6, 0, 0],
        s: [{ t: 'box', w: 0.8, h: 20, d: 18, p: [-1.9, 1.5, 0] }, { t: 'cyl', ax: 'x', ri: 0.8, r: 2.2, h: 2.4, p: [-3.5, 0, 0] }] },
      { id: 'shaft', name: ['Drive shaft', 'عمود الإدارة'], role: ['Gearmotor output shaft that turns the rotor slowly.', 'عمود خروج الموتور بالجيربوكس، بيلف الروتور ببطء.'], mat: 'steel', ex: [-12, 0, 0], cut: false,
        s: [{ t: 'cyl', ax: 'x', r: 0.8, h: 8.5, p: [-4.25, 0, 0] }, { t: 'box', w: 2, h: 0.3, d: 0.4, p: [-0.5, 0.8, 0] }] },
      { id: 'housing', name: ['Pump housing (track)', 'جسم الطلمبة (المجرى)'], role: ['U-shaped track the hose is pressed against.', 'مجرى على شكل U الخرطوم بيتعصر عليه.'], mat: 'castg', ex: [0, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 2.6, pts: yz(track) }, { t: 'ext', ax: 'x', d: 0.4, pts: yz([[8.6, 8.6], [8.6, -8.6], [-8.6, -8.6], [-8.6, 8.6]]), p: [-1.5, 0, 0] }] },
      { id: 'hose', name: ['Hose', 'الخرطوم'], role: ['Reinforced elastomer hose; the only part wetted by the liquid. Wear item.', 'خرطوم كاوتش مسلح؛ الجزء الوحيد اللي بيلمس السايل. قطعة استهلاك.'], mat: 'orange', ex: [0, 12, 0],
        s: [{ t: 'tube', path: hosePath, r: 0.8, rs: 14 }] },
      { id: 'rotor', name: ['Rotor', 'الروتور'], role: ['Two-arm rotor keyed on the shaft; carries the rollers.', 'روتور بدراعين متركب بخابور على العمود؛ شايل البكر.'], mat: 'alu', ex: [6, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 0.8, r: 1.6, h: 2.2 }, { t: 'box', w: 0.5, h: 10, d: 2.2, p: [-0.85, 0, 0] }, { t: 'box', w: 0.5, h: 10, d: 2.2, p: [0.85, 0, 0] }] },
      { id: 'rollers', name: ['Rollers on pins', 'البكر على البنوز'], role: ['Free-turning rollers that squeeze the hose shut and roll along it.', 'بكر بيلف حر، بيقفل الخرطوم بالعصر وبيمشي عليه.'], mat: 'sst', ex: [12, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 1.2, h: 1.2, p: [0, 4.5, 0] }, { t: 'cyl', ax: 'x', r: 1.2, h: 1.2, p: [0, -4.5, 0] }, { t: 'cyl', ax: 'x', r: 0.3, h: 2.2, p: [0, 4.5, 0], m: 'steel' }, { t: 'cyl', ax: 'x', r: 0.3, h: 2.2, p: [0, -4.5, 0], m: 'steel' }] },
      { id: 'clamps', name: ['Hose clamps', 'مشابك الخرطوم'], role: ['Hold the hose ends so the rollers cannot drag the hose round.', 'ماسكة أطراف الخرطوم عشان البكر ميسحبهوش معاه.'], mat: 'sst', ex: [0, 17, 0],
        s: [{ t: 'cyl', ri: 0.8, r: 1.2, h: 1.6, p: [0, 9.2, RH] }, { t: 'cyl', ri: 0.8, r: 1.2, h: 1.6, p: [0, 9.2, -RH] }, { t: 'box', w: 2.2, h: 0.6, d: 14, p: [0, 8.6, 0] }] },
      { id: 'cover', name: ['Clear front cover', 'الغطا الشفاف'], role: ['Guards the rotor and lets you watch the hose; an interlock may stop the pump when it is opened.', 'حماية للروتور وبتخليك تشوف الخرطوم؛ ممكن يكون عليه إنترلوك يوقف الطلمبة لما يتفتح.'], mat: 'glass', ex: [10, 0, 0],
        s: [{ t: 'box', w: 0.4, h: 17.2, d: 17.2, p: [1.6, 0, 0] }] },
    ],
    steps: ['back_plate', 'shaft', 'housing', 'rotor', 'rollers', 'hose', 'clamps', 'cover'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft: { rot: [1, 0, 0], speed: 0.5 }, rotor: { rot: [1, 0, 0], speed: 0.5 }, rollers: { rot: [1, 0, 0], speed: 0.5 } } },
    quiz: [
      { q: ['Liquid is found inside the housing of a peristaltic pump. First thing to check?', 'لقيت سايل جوه جسم طلمبة البيرستالتيك. أول حاجة تبص عليها؟'], a: ['The hose: it has cracked or burst', 'الخرطوم: اتشرخ أو اتفرتك'], w: [['The motor bearings', 'رولمان الموتور'], ['The cover interlock', 'إنترلوك الغطا'], ['The rotor key', 'خابور الروتور']] },
      { q: ['Why are peristaltic pumps used for sterile or aggressive liquids?', 'ليه طلمبات البيرستالتيك بتستخدم للسوايل المعقمة أو الكاوية؟'], a: ['The liquid touches only the hose, there are no seals or valves', 'السايل مش بيلمس غير الخرطوم ومفيش سيل ولا بلوف'], w: [['They run at very high speed', 'بتلف بسرعة عالية جداً'], ['The rollers sterilise the liquid', 'البكر بيعقم السايل'], ['They give no flow pulses', 'مفيهاش نبض في التصرف']] },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
