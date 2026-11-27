/* Mechanical: fasteners and joints (bolt axis vertical, head up; circlips on a shaft along X) */
(function (g) {
  const EL = g.EL, M = EL.mech, D = Math.PI / 180;
  const f3 = (v) => Math.round(v * 1000) / 1000;
  // lathe profiles get smooth normals at every point: split sharp corners so flat faces stay flat
  const sharp = (pts, e) => {
    e = e || 0.02; const closed = pts.length > 2 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
    const P = closed ? pts.slice(0, -1) : pts.slice(), n = P.length, o = [];
    for (let i = 0; i < n; i++) {
      const c = P[i], a = P[(i - 1 + n) % n], b = P[(i + 1) % n];
      if (!closed && (i === 0 || i === n - 1)) { o.push(c); continue; }
      const l1 = Math.hypot(c[0] - a[0], c[1] - a[1]), l2 = Math.hypot(b[0] - c[0], b[1] - c[1]);
      const d1 = [(c[0] - a[0]) / l1, (c[1] - a[1]) / l1], d2 = [(b[0] - c[0]) / l2, (b[1] - c[1]) / l2];
      if (d1[0] * d2[0] + d1[1] * d2[1] > 0.87 || l1 < 5 * e || l2 < 5 * e) { o.push(c); continue; }
      o.push([f3(c[0] - 2 * e * d1[0]), f3(c[1] - 2 * e * d1[1])], [f3(c[0] - e * d1[0]), f3(c[1] - e * d1[1])], [f3(c[0] + e * d2[0]), f3(c[1] + e * d2[1])], [f3(c[0] + 2 * e * d2[0]), f3(c[1] + 2 * e * d2[1])]);
    }
    if (closed) o.push(o[0]);
    return o;
  };
  const arc = (r, a0, a1, n, cx, cy) => { const o = []; for (let i = 0; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * D; o.push([f3((cx || 0) + Math.cos(a) * r), f3((cy || 0) + Math.sin(a) * r)]); } return o; };
  const rect = (x0, z0, x1, z1) => [[x0, -z0], [x1, -z0], [x1, -z1], [x0, -z1]];   // ext (ax y) outline from world x/z
  const hole = (x, z, r) => ({ c: [x, -z], r });
  const threads = (x, y0, y1, R, pitch, z) => { const o = []; for (let y = y0; y <= y1 + 1e-6; y += pitch) o.push({ t: 'torus', R, r: f3(pitch * 0.26), p: [x, f3(y), z || 0] }); return o; };
  const capScrew = (x, yTop, len, z) => [   // M8 socket head cap screw standing on its head face at yTop - 0.8
    { t: 'cyl', r: 0.65, h: 0.8, p: [x, f3(yTop - 0.4), z || 0] }, { t: 'hex', r: 0.346, h: 0.012, p: [x, f3(yTop + 0.006), z || 0], m: 'black' },
    { t: 'cyl', r: 0.4, h: len, p: [x, f3(yTop - 0.8 - len / 2), z || 0] }, ...threads(x, f3(yTop - 0.8 - len + 0.05), f3(yTop - 0.8 - len * 0.45), 0.4, 0.125, z)];

  /* ---------------- hex bolt, washers, nut ---------------- */
  (function () {
    const eight = (x) => [{ t: 'torus', R: 0.1, r: 0.022, p: [x, 2.01, -0.1], m: 'black' }, { t: 'torus', R: 0.1, r: 0.022, p: [x, 2.01, 0.1], m: 'black' }];
    M.add({
      id: 'bolt_nut_washer', cat: 'fasteners',
      name: ['Hex bolt, washers and nut (M12, 8.8)', 'مسمار سداسي وورد وصامولة (M12، 8.8)'],
      info: {
        what: ['Bolted joint: the bolt is stretched like a stiff spring and its tension clamps the plates together. Washers spread the load; the nut carries the thread load.', 'وصلة بمسمار: المسمار بيتمط زي سوستة جامدة وشدّه هو اللي بيزنق الألواح على بعض. الوردة بتوزع الحمل والصامولة شايلة حمل السن.'],
        use: ['Machine frames, motor and pump bases, pipe flanges, supports and guards everywhere on site.', 'شاسيهات المكن، قواعد المواتير والطلمبات، فلانشات المواسير، الحوامل والجاردات في كل حتة.'],
        how: ['"8.8" on the head: tensile strength 800 MPa, yield 0.8 × 800 = 640 MPa. Tighten to the chart torque (M12 8.8 about 80 N·m, lightly oiled) so the bolt stretches to the right clamp force.', '"8.8" على الراس: مقاومة الشد 800 ميجا باسكال والخضوع 0.8 × 800 = 640. اربط بالعزم اللي في الجدول (M12 8.8 حوالي 80 نيوتن متر، متزيت خفيف) عشان المسمار يتمط للزنقة المظبوطة.'],
        fail: ['Loosening under vibration, thread stripping, bolt stretched past yield (necked), fatigue crack under the head or at the first engaged thread, corrosion.', 'بيفك من الرعشة، السن بيتقشر، المسمار اتمط بعد الخضوع (رقبته رفّعت)، شرخ إجهاد تحت الراس أو عند أول سنة شغالة، صدا.'],
        pm: ['Use the grade and length in the drawing (2-3 threads out of the nut), torque with a calibrated wrench, never reuse stretched bolts. A spring washer adds little locking on 8.8 bolts: under vibration use a locking nut or thread locker.', 'استخدم الرتبة والطول اللي في الرسمة (2-3 سنات بره الصامولة)، اربط بمفتاح عزم متعاير، ومترجعش تستخدم مسمار اتمط. الوردة السوستة قفلها ضعيف مع 8.8: مع الرعشة استخدم صامولة قفل أو سائل تثبيت السن (ثريد لوكر).'],
      },
      cut: 'z',
      parts: [
        { id: 'plate_bottom', name: ['Lower plate', 'اللوح التحتاني'], role: ['Clamped part with a 13 mm clearance hole.', 'الجزء المزنوق، فيه خرم خلوص 13 مم.'], mat: 'castg', ex: [0, 0, 0],
          s: [{ t: 'ext', d: 1.0, p: [0, -0.5, 0], pts: rect(-3.5, -2.5, 3.5, 2.5), holes: [hole(0, 0, 0.66)] }] },
        { id: 'plate_top', name: ['Upper plate', 'اللوح الفوقاني'], role: ['Second clamped part.', 'الجزء التاني المزنوق.'], mat: 'blue', ex: [0, 1.8, 0],
          s: [{ t: 'ext', d: 1.0, p: [0, 0.5, 0], pts: rect(-3.5, -2.5, 3.5, 2.5), holes: [hole(0, 0, 0.66)] }] },
        { id: 'washer_head', name: ['Flat washer (head side)', 'وردة مبسوطة (ناحية الراس)'], role: ['Spreads the head load and protects the surface when you turn.', 'بتوزع حمل الراس وبتحمي السطح وانت بتلف.'], mat: 'steel', ex: [0, 3.2, 0],
          s: [{ t: 'cyl', r: 1.2, ri: 0.65, h: 0.25, p: [0, 1.125, 0] }] },
        { id: 'bolt', name: ['Hex bolt M12 × 45, grade 8.8', 'مسمار سداسي M12 × 45 رتبة 8.8'], role: ['Head marked 8.8; coarse thread, 1.75 mm pitch.', 'الراس مكتوب عليها 8.8؛ سن خشن خطوته 1.75 مم.'], mat: 'steel', ex: [0, 8, 0],
          s: [{ t: 'hex', r: 1.04, h: 0.75, p: [0, 1.625, 0] }, { t: 'cyl', r: 0.6, h: 4.5, p: [0, -1.0, 0] }, { t: 'cone', r1: 0.6, r2: 0.48, h: 0.12, p: [0, -3.31, 0] },
            ...threads(0, -3.2, -0.55, 0.6, 0.175), ...eight(-0.32), ...eight(0.32), { t: 'sph', r: 0.035, p: [0, 2.01, 0.2], m: 'black' }] },
        { id: 'washer_flat', name: ['Flat washer (nut side)', 'وردة مبسوطة (ناحية الصامولة)'], role: ['Hard flat face for the nut to turn on.', 'وش ناشف مستوي الصامولة تلف عليه.'], mat: 'steel', ex: [0, -2.5, 0],
          s: [{ t: 'cyl', r: 1.2, ri: 0.65, h: 0.25, p: [0, -1.125, 0] }] },
        { id: 'spring_washer', name: ['Spring (split) washer', 'وردة سوستة (مشقوقة)'], role: ['Split, twisted ring: gives a little spring under the nut.', 'حلقة مشقوقة ومبرومة: بتدي شوية مرونة تحت الصامولة.'], mat: 'black', ex: [0, -4, 0],
          s: [{ t: 'torus', R: 0.84, r: 0.16, arc: 340, rot: [4, 0, 0], p: [0, -1.41, 0] }] },
        { id: 'nut', name: ['Hex nut M12, class 8', 'صامولة M12 رتبة 8'], role: ['Nut class must match the bolt grade (8 with 8.8).', 'رتبة الصامولة لازم تناسب المسمار (8 مع 8.8).'], mat: 'steel', ex: [0, -6, 0],
          s: [{ t: 'hex', r: 1.04, h: 1.0, ri: 0.6, p: [0, -2.07, 0] }] },
      ],
      steps: ['plate_bottom', 'plate_top', 'washer_head', 'bolt', 'washer_flat', 'spring_washer', 'nut'],
      anim: { mode: 'toggle', label: ['Loosen / tighten', 'فك / اربط'], parts: { nut: { slide: [0, -0.7, 0], rot: [0, 1, 0], a: [0, -1440] } } },
      quiz: [
        { q: ['What does 8.8 on a bolt head mean?', 'يعني إيه 8.8 على راس المسمار؟'], a: ['800 MPa tensile, yield 80 % of that', 'شد 800 ميجا باسكال والخضوع 80% منها'], w: [['8.8 mm diameter', 'قطر 8.8 مم'], ['Tighten to 88 N·m', 'اربط على 88 نيوتن متر'], ['8 threads per 8 mm', '8 سنات كل 8 مم']] },
        { q: ['How many threads should stick out of the nut?', 'كام سنة المفروض تطلع بره الصامولة؟'], a: ['About 2 to 3', 'حوالي 2 لـ 3'], w: [['None, flush is best', 'ولا سنة، على الحرف أحسن'], ['At least 10', '10 على الأقل'], ['Half the bolt length', 'نص طول المسمار']] },
      ],
    });
  })();

  /* ---------------- socket head cap screw in counterbore with thread insert ---------------- */
  M.add({
    id: 'socket_screw', cat: 'fasteners',
    name: ['Socket cap screw in counterbore, with thread insert', 'مسمار ألن في نُقرة، بسلك قلاووظ (إنسرت سلك)'],
    info: {
      what: ['Socket head cap screw (usually grade 12.9) sitting below the surface in a counterbore, screwed into an aluminium part through a stainless helical wire thread insert.', 'مسمار راس ألن (غالباً رتبة 12.9) غاطس تحت السطح في نُقرة، متربط في قطعة ألومنيوم عن طريق سلك قلاووظ استانلس حلزوني.'],
      use: ['Change parts, forming and sealing tools, guides and frames on blister, cartoning and labelling machines; inserts in aluminium plates that are opened often.', 'قطع التغيير وعدد التشكيل واللحام، الدلايل والشاسيهات في مكن البليستر والكرتونة والليبل؛ وسلك القلاووظ في ألواح الألومنيوم اللي بتتفك كتير.'],
      how: ['The counterbore keeps the head flush so nothing catches. Soft aluminium threads wear out; the hard steel insert gives a strong, wear-proof thread and also repairs a stripped hole.', 'النُقرة بتخلي الراس غاطسة فمفيش حاجة تتشبك فيها. سن الألومنيوم الطري بيدوب، والسلك الاستانلس بيدي سن قوي ميدوبش وكمان بيصلّح الخرم المقشور.'],
      fail: ['Rounded hex socket (worn key, key not fully in), stripped thread in aluminium, insert pulled out or tang left in a through hole, screw seized in the insert.', 'خرم الألن اتبوّظ (مفتاح دايب أو مش داخل للآخر)، سن الألومنيوم اتقشر، السلك طلع أو اللسان فضل في الخرم النافذ، المسمار ناشف في السلك.'],
      pm: ['Use a good metric key fully inserted, torque to the aluminium/insert value, not the 12.9 steel value. Fit inserts with the special STI tap and tool, break off and remove the tang.', 'استخدم مفتاح مللي سليم وداخل للآخر، واربط بعزم الألومنيوم/السلك مش عزم 12.9 على حديد. ركّب السلك بالذكر الخاص STI وعدته، واكسر اللسان وشيله.'],
    },
    cut: 'z',
    parts: [
      { id: 'base', name: ['Aluminium base', 'قاعدة ألومنيوم'], role: ['Soft part with a tapped hole sized for the insert.', 'قطعة طرية فيها خرم مقلوظ على مقاس السلك.'], mat: 'alu', ex: [0, 0, 0],
        s: [{ t: 'ext', d: 2.5, p: [0, -1.25, 0], pts: rect(-4, -3, 4, 3), holes: [hole(0, 0, 0.52)] }, { t: 'box', w: 8, h: 1.5, d: 6, p: [0, -3.25, 0] }] },
      { id: 'insert', name: ['Helical thread insert', 'سلك قلاووظ (إنسرت سلك)'], role: ['Diamond-section stainless coil: inside it is a standard M8 thread.', 'سلك استانلس حلزوني، من جوه بيدي سن M8 عادي.'], mat: 'sst', ex: [0, 2.2, 0], cut: false,
        s: [{ t: 'spring', R: 0.46, r: 0.06, turns: 13, len: 1.6, p: [0, -1.0, 0] }] },
      { id: 'plate', name: ['Clamped plate with counterbore', 'اللوح المربوط وفيه النُقرة'], role: ['Through hole 9 mm and a 14 mm counterbore for the head.', 'خرم نافذ 9 مم ونُقرة 14 مم للراس.'], mat: 'steel', ex: [0, 2.5, 0],
        s: [{ t: 'ext', d: 1.1, p: [0, 0.55, 0], pts: rect(-4, -3, 4, 3), holes: [hole(0, 0, 0.45)] }, { t: 'ext', d: 0.9, p: [0, 1.55, 0], pts: rect(-4, -3, 4, 3), holes: [hole(0, 0, 0.7)] }] },
      { id: 'screw', name: ['Socket head cap screw M8 × 30, 12.9', 'مسمار ألن M8 × 30 رتبة 12.9'], role: ['High-strength screw driven by a 6 mm hex key.', 'مسمار عالي المقاومة بيتلف بمفتاح ألن 6.'], mat: 'black', ex: [0, 7, 0],
        s: capScrew(0, 1.95, 3.05) },
      { id: 'key', name: ['Hex key 6 mm', 'مفتاح ألن 6'], role: ['Short arm in the socket, long arm for torque.', 'الدراع القصير في المسمار والطويل للعزم.'], mat: 'chrome', ex: [0, 10, 0], cut: false,
        s: [{ t: 'hex', r: 0.346, h: 2.45, p: [0, 2.975, 0] }, { t: 'sph', r: 0.34, p: [0, 4.2, 0] }, { t: 'hex', r: 0.346, h: 8.6, ax: 'x', p: [4.3, 4.2, 0] }] },
    ],
    steps: ['base', 'insert', 'plate', 'screw', 'key'],
    anim: { mode: 'toggle', label: ['Tighten', 'اربط'], parts: { screw: { rot: [0, 1, 0], a: [0, -180] }, key: { rot: [0, 1, 0], a: [0, -180] } } },
    quiz: [
      { q: ['Why fit a steel thread insert in aluminium?', 'ليه نركب سلك قلاووظ في الألومنيوم؟'], a: ['Aluminium threads wear and strip; the insert is strong and wear-proof', 'سن الألومنيوم بيدوب ويتقشر، والسلك قوي ومبيدوبش'], w: [['To make the screw lighter', 'عشان المسمار يبقى أخف'], ['To insulate electrically', 'عشان يعزل كهربا'], ['To change metric to inch', 'عشان يحوّل مللي لبوصة']] },
      { q: ['What is the counterbore for?', 'النُقرة دي لازمتها إيه؟'], a: ['The head sits below the surface, nothing catches on it', 'الراس تبقى غاطسة ومحدش يتشبك فيها'], w: [['It locks the screw', 'بتقفل المسمار'], ['It holds grease', 'بتشيل شحم'], ['It centres the drill', 'بتسنتر البنطة']] },
    ],
  });

  /* ---------------- thread locking methods ---------------- */
  (function () {
    const X = [-7.5, -2.5, 2.5, 7.5];
    const bolts = [];
    X.forEach((x) => { bolts.push({ t: 'hex', r: 1.04, h: 0.75, p: [x, -1.375, 0] }, { t: 'cyl', r: 0.6, h: 3.3, p: [x, 0.65, 0] }, ...threads(x, 0.08, 2.2, 0.6, 0.175)); });
    bolts.push({ t: 'cyl', r: 0.15, h: 1.22, ax: 'x', p: [2.5, 1.35, 0], m: 'black' });
    const crowns = []; for (let k = 0; k < 6; k++) { const a = 30 + k * 60; crowns.push({ t: 'box', w: 0.4, h: 0.6, d: 0.42, rot: [0, -a, 0], p: [f3(2.5 + 0.8 * Math.cos(a * D)), 1.3, f3(0.8 * Math.sin(a * D))] }); }
    M.add({
      id: 'lock_methods', cat: 'fasteners',
      name: ['Thread locking methods', 'طرق تأمين المسامير من الفك'],
      info: {
        what: ['Four common ways to stop nuts loosening under vibration: nylon insert nut, jam nut pair, castle nut with split pin, and anaerobic thread locker.', 'أشهر 4 طرق تمنع الصواميل تفك من الرعشة: صامولة بحلقة نايلون، صامولتين على بعض (كونترا)، صامولة تاج بتيلة، وسائل تثبيت السن (ثريد لوكر).'],
        use: ['Vibrating screens and sieves, fans and blowers, pumps and motors, conveyor rollers, tablet press and blister machine parts, rotating shafts.', 'المناخل والهزازات، المراوح والبلاورات، الطلمبات والمواتير، رولات السيور، أجزاء المكابس والبليستر، العمدان الدوارة.'],
        how: ['Nyloc: the nylon ring grips the thread. Jam nut: thin nut first, full nut on top, tightened against each other. Castle nut: split pin through the slot and bolt hole, a positive lock. Thread locker: liquid that hardens without air inside the thread.', 'النايلوك: حلقة النايلون بتمسك في السن. الكونترا: الصامولة الرفيعة الأول والتخينة فوقيها ويتربطوا على بعض. التاج: التيلة بتعدي في الشق وخرم المسمار، قفل أكيد. سائل التثبيت: سائل بيجمد جوه السن من غير هوا.'],
        fail: ['Reused nyloc that turns freely, jam nuts in the wrong order or not locked against each other, old or missing split pin, thread locker on oily threads that never cures.', 'نايلوك متستخدم قبل كده وبيلف بالإيد، كونترا مقلوبة أو مش مقفولة على بعض، تيلة قديمة أو مش موجودة، سائل تثبيت على سن مزيت فمبيجمدش.'],
        pm: ['Replace nylocs and split pins every time they are removed. To line up a castle nut, tighten further, never back off. Clean and degrease threads for thread locker: blue (medium) comes off with hand tools, red (high) needs heat.', 'غيّر النايلوك والتيلة كل مرة تتفك. عشان تظبط شق التاج اربط زيادة متفكش. نضّف وشيل الزيت من السن قبل سائل التثبيت: الأزرق (متوسط) بيتفك بالعدة العادية، والأحمر (قوي) محتاج تسخين.'],
      },
      cut: 'z',
      parts: [
        { id: 'plate', name: ['Mounting plate', 'لوح التركيب'], role: ['Part being held, 4 holes.', 'القطعة المربوطة، فيها 4 خروم.'], mat: 'castg', ex: [0, 0, 0],
          s: [{ t: 'ext', d: 1.0, p: [0, -0.5, 0], pts: rect(-10, -2.2, 10, 2.2), holes: X.map((x) => hole(x, 0, 0.66)) }] },
        { id: 'bolts', name: ['Bolts M12', 'مسامير M12'], role: ['Same bolt, four locking methods. The third one has a cross hole for the split pin.', 'نفس المسمار بـ 4 طرق قفل. التالت فيه خرم عرضي للتيلة.'], mat: 'steel', ex: [0, -4.5, 0], s: bolts },
        { id: 'nyloc', name: ['Nylon insert lock nut', 'صامولة نايلوك'], role: ['Nylon ring smaller than the thread: grips it and resists turning. Single use.', 'حلقة نايلون أصغر من السن بتمسكه وتقاوم اللف. استخدام مرة واحدة.'], mat: 'steel', ex: [0, 4, 0],
          s: [{ t: 'hex', r: 1.04, h: 1.0, ri: 0.6, p: [-7.5, 0.5, 0] }, { t: 'cyl', r: 0.95, ri: 0.7, h: 0.4, p: [-7.5, 1.2, 0] }, { t: 'cyl', r: 0.7, ri: 0.55, h: 0.32, p: [-7.5, 1.2, 0], m: 'white' }] },
        { id: 'jam_nut', name: ['Jam nut (thin)', 'صامولة كونترا (رفيعة)'], role: ['Goes on first, next to the joint.', 'بتتركب الأول، لازقة في الوصلة.'], mat: 'steel', ex: [0, 3, 0],
          s: [{ t: 'hex', r: 1.04, h: 0.6, ri: 0.6, p: [-2.5, 0.3, 0] }] },
        { id: 'main_nut', name: ['Full nut on top', 'الصامولة التخينة فوق'], role: ['Tightened against the jam nut: it then carries the bolt load.', 'بتتربط على الكونترا، وبعدها هي اللي شايلة حمل المسمار.'], mat: 'steel', ex: [0, 6, 0],
          s: [{ t: 'hex', r: 1.04, h: 1.0, ri: 0.6, p: [-2.5, 1.1, 0] }] },
        { id: 'castle_nut', name: ['Castle (slotted) nut', 'صامولة تاج (مشقوقة)'], role: ['Slots on top line up with the hole in the bolt.', 'الشقوق اللي فوق بتيجي على خرم المسمار.'], mat: 'steel', ex: [0, 4, 0],
          s: [{ t: 'hex', r: 1.04, h: 1.0, ri: 0.6, p: [2.5, 0.5, 0] }, ...crowns] },
        { id: 'split_pin', name: ['Split pin (cotter pin)', 'تيلة (خابور مشقوق)'], role: ['Goes through slot and bolt; legs bent back. Always a new one.', 'بتعدي في الشق والمسمار ورجليها بتتني. دايماً واحدة جديدة.'], mat: 'steel', ex: [0, 7.5, 0], cut: false,
          s: [{ t: 'torus', R: 0.2, r: 0.06, ax: 'z', p: [1.1, 1.35, 0] },
            { t: 'tube', r: 0.06, path: [[1.3, 1.35, 0.065], [3.55, 1.35, 0.065], [3.7, 1.6, 0.065], [3.45, 2.42, 0.065], [2.4, 2.48, 0.065]] },
            { t: 'tube', r: 0.06, path: [[1.3, 1.35, -0.065], [3.55, 1.35, -0.065], [3.7, 1.1, -0.065], [3.62, 0.35, -0.065]] }] },
        { id: 'locker', name: ['Thread locker (blue, medium)', 'سائل تثبيت أزرق (متوسط)'], role: ['Anaerobic liquid that fills the thread gaps and hardens.', 'سائل بيملا فراغات السن ويجمد من غير هوا.'], mat: '#2f62d0', ex: [0, 2.6, 0],
          s: [{ t: 'cyl', r: 0.64, h: 1.5, p: [7.5, 0.8, 0] }] },
        { id: 'plain_nut', name: ['Plain nut (on thread locker)', 'صامولة عادية (على سائل التثبيت)'], role: ['Ordinary nut, locked by the cured liquid.', 'صامولة عادية، بيقفلها السائل لما يجمد.'], mat: 'steel', ex: [0, 5, 0],
          s: [{ t: 'hex', r: 1.04, h: 1.0, ri: 0.6, p: [7.5, 0.5, 0] }] },
      ],
      steps: ['plate', 'bolts', 'nyloc', 'jam_nut', 'main_nut', 'castle_nut', 'split_pin', 'locker', 'plain_nut'],
      quiz: [
        { q: ['The castle nut slot is just past the hole. What do you do?', 'شق صامولة التاج عدّى الخرم بشوية. تعمل إيه؟'], a: ['Tighten further to the next slot', 'اربط زيادة لحد الشق اللي بعده'], w: [['Back the nut off to the slot', 'فك الصامولة لحد الشق'], ['Drill a new hole', 'اخرم خرم جديد'], ['Leave out the split pin', 'متحطش تيلة']] },
        { q: ['Which nut goes first in a jam nut pair?', 'أنهي صامولة تتركب الأول في الكونترا؟'], a: ['The thin nut', 'الرفيعة'], w: [['The full nut', 'التخينة'], ['Either one', 'أي واحدة'], ['Both together', 'الاتنين مع بعض']] },
        { q: ['Can a nyloc nut be reused?', 'ينفع ترجّع تستخدم صامولة النايلوك؟'], a: ['No, replace it after removal', 'لأ، غيّرها بعد ما تتفك'], w: [['Yes, always', 'آه دايماً'], ['Yes, if you heat it', 'آه لو سخنتها'], ['Only with grease', 'بس مع شحم']] },
      ],
    });
  })();

  /* ---------------- dowel pin joint ---------------- */
  (function () {
    const dowel = (x) => ({ t: 'lathe', p: [x, 0, 0], pts: sharp([[0, -1.2], [0.33, -1.2], [0.4, -1.12], [0.4, 1.12], [0.33, 1.2], [0, 1.2]], 0.01) });
    M.add({
      id: 'dowel_pin_joint', cat: 'fasteners',
      name: ['Dowel pin joint', 'وصلة بأصابع تسنتر (دوِل)'],
      info: {
        what: ['Two hardened, ground pins fitted in reamed holes fix the exact position of one part on another. Screws give the clamping force; dowels only locate.', 'صباعين مقسّيين ومجلّخين في خروم مبرغلة بيثبتوا مكان قطعة على التانية بالظبط. المسامير هي اللي بتزنق، والدوِل بس بيحدد المكان.'],
        use: ['Change parts and sealing/forming tools on blister and cartoning machines, gearbox halves, bearing housings, fixtures and jigs: anything that must go back in exactly the same place.', 'قطع التغيير وعدد اللحام والتشكيل في البليستر والكرتونة، نصين الجيربوكس، كراسي البلي، الفيكستشرات: أي حاجة لازم ترجع مكانها بالظبط.'],
        how: ['The pin is a light press fit in one part (H7 hole, m6 pin) and a sliding fit in the other, so the parts come apart and go back with no setting. Two dowels, as far apart as possible.', 'الصباع مكبوس خفيف في قطعة (خرم H7 وصباع m6) وداخل منزلق في التانية، فالقطع تتفك وترجع من غير ضبط. اتنين دوِل وأبعد ما يمكن عن بعض.'],
        fail: ['Worn or oval holes from parts moving (loose screws), sheared dowels when they carry load, pins hammered in crooked, dowel stuck in a blind hole.', 'خروم دابت أو بيضاوية من حركة القطع (مسامير سايبة)، دوِل اتقص لما شال حمل، صباع اتخبط مايل، صباع محشور في خرم مسدود.'],
        pm: ['Clean pins and holes before refitting, tighten the screws so the dowels never carry the load, use pull-out (internally threaded) dowels in blind holes, never ream oversize without a new pin.', 'نضّف الصوابع والخروم قبل التركيب، اربط المسامير عشان الدوِل ميشيلش حمل، استخدم دوِل بسن من جوه في الخروم المسدودة، ومتوسعش الخرم من غير صباع جديد.'],
      },
      cut: 'z',
      parts: [
        { id: 'base', name: ['Base part', 'القطعة الأساسية'], role: ['Has two reamed dowel holes and two tapped holes.', 'فيها خرمين مبرغلين للدوِل وخرمين مقلوظين.'], mat: 'castg', ex: [0, 0, 0],
          s: [{ t: 'ext', d: 3, p: [0, -1.5, 0], pts: rect(-6.5, -3, 6.5, 3), holes: [hole(-5, 0, 0.4), hole(5, 0, 0.4), hole(-2, 0, 0.34), hole(2, 0, 0.34)] }] },
        { id: 'dowel_a', name: ['Dowel pin 1 (Ø8 m6)', 'صباع تسنتر 1 (Ø8 m6)'], role: ['Hardened and ground; chamfered ends help it start.', 'مقسّى ومجلّخ، وأطرافه مشطوفة عشان يدخل.'], mat: 'chrome', ex: [0, 2.5, 0], s: [dowel(-5)] },
        { id: 'dowel_b', name: ['Dowel pin 2 (Ø8 m6)', 'صباع تسنتر 2 (Ø8 m6)'], role: ['Second pin far from the first: stops rotation.', 'الصباع التاني بعيد عن الأول: بيمنع اللف.'], mat: 'chrome', ex: [0, 2.5, 0], s: [dowel(5)] },
        { id: 'top', name: ['Located part', 'القطعة المتسنترة'], role: ['Reamed holes for the dowels and clearance holes for the screws.', 'خروم مبرغلة للدوِل وخروم خلوص للمسامير.'], mat: 'steel', ex: [0, 5, 0],
          s: [{ t: 'ext', d: 2, p: [0, 1.0, 0], pts: rect(-6.5, -3, 6.5, 3), holes: [hole(-5, 0, 0.4), hole(5, 0, 0.4), hole(-2, 0, 0.45), hole(2, 0, 0.45)] }] },
        { id: 'screws', name: ['Cap screws M8', 'مسامير ألن M8'], role: ['Clamp the parts together; they do not locate.', 'بتزنق القطع على بعض، بس مش بتحدد المكان.'], mat: 'black', ex: [0, 10, 0], s: [...capScrew(-2, 2.8, 4.2), ...capScrew(2, 2.8, 4.2)] },
      ],
      steps: ['base', 'dowel_a', 'dowel_b', 'top', 'screws'],
      anim: { mode: 'toggle', label: ['Lift / fit', 'ارفع / ركّب'], parts: { top: { slide: [0, 3, 0] }, screws: { slide: [0, 3, 0] } } },
      quiz: [
        { q: ['What carries the clamping load in a doweled joint?', 'مين اللي شايل حمل الزنق في وصلة الدوِل؟'], a: ['The screws', 'المسامير'], w: [['The dowel pins', 'الدوِل'], ['Both equally', 'الاتنين بالتساوي'], ['The reamed holes', 'الخروم المبرغلة']] },
        { q: ['Why are the two dowels placed far apart?', 'ليه الصباعين بعاد عن بعض؟'], a: ['Better angular accuracy, no rotation', 'دقة أحسن في الزاوية ومفيش لف'], w: [['To save material', 'توفير خامة'], ['Easier to hammer', 'أسهل في الدق'], ['For cooling', 'للتبريد']] },
      ],
    });
  })();

  /* ---------------- circlips: external on a shaft, internal in a bore ---------------- */
  (function () {
    const YZ = (pts) => pts.map(([y, z]) => [f3(-y), f3(-z)]);   // ext with ax 'x' maps [px, py] to (y = -px, z = -py)
    const ring = (ri, ro, gap) => YZ([...arc(ro, 90 + gap, 450 - gap, 40), ...arc(ri, 450 - gap, 90 + gap, 40)]);
    const ear = (R, ang, r, hr) => { const c = [f3(R * Math.cos(ang * D)), f3(R * Math.sin(ang * D))]; return { t: 'ext', ax: 'x', d: 0.12, pts: YZ(arc(r, 0, 360, 24, c[0], c[1]).slice(0, -1)), holes: [{ c: [-c[0], -c[1]], r: hr }] }; };
    M.add({
      id: 'circlip_retaining', cat: 'fasteners',
      name: ['Circlips (external and internal)', 'سيكلبس (خارجي وداخلي)'],
      info: {
        what: ['Spring-steel retaining rings that snap into grooves: external (DIN 471) on a shaft, internal (DIN 472) in a bore. They stop parts sliding along the axis.', 'حلقات صلب سوست بتتركب في مجاري: الخارجي (DIN 471) على العمود والداخلي (DIN 472) في الخرم. بتمنع القطع تتزحلق على طول المحور.'],
        use: ['Holding bearings on shafts and in housings of motors, pumps, gearboxes, rollers and conveyor pulleys; pins and levers on machines.', 'تثبيت البلي على العمدان وجوه الكراسي في المواتير والطلمبات والجيربوكس والرولات وطنابير السيور، والبنوز والدراعات في المكن.'],
        how: ['Circlip pliers in the lug holes open the external ring over the shaft or close the internal ring into the bore until it springs into its groove. The ring takes axial load against the groove wall.', 'زرادية السيكلبس في خروم الودان بتفتح الخارجي على العمود أو تقفل الداخلي في الخرم لحد ما ينط في مجراه. الحلقة بتشيل الحمل المحوري على حيطة المجرى.'],
        fail: ['Over-stretched ring that does not sit tight in the groove, ring jumped out (worn groove, wrong size), bent ring, part pushing it out under thrust.', 'حلقة اتفتحت زيادة ومبقتش قاعدة في المجرى، الحلقة نطت (مجرى دايب أو مقاس غلط)، حلقة معووجة، حمل محوري بيزقها لبره.'],
        pm: ['Open or close only as much as needed, use a new ring if it was over-stretched, check it rotates in the groove and is fully seated. Fit stamped rings with the sharp edge away from the part they hold.', 'افتح أو اقفل على قد الحاجة، غيّر الحلقة لو اتفتحت زيادة، اتأكد إنها بتلف في المجرى وقاعدة كويس. ركّب الحلقة المكبوسة وحرفها الحاد بعيد عن القطعة اللي ماسكاها.'],
      },
      cut: 'z',
      parts: [
        { id: 'shaft', name: ['Shaft with shoulder and groove', 'العمود والكتف والمجرى'], role: ['Shoulder on one side of the bearing, circlip groove on the other.', 'كتف على ناحية من البلية ومجرى السيكلبس على الناحية التانية.'], mat: 'steel', ex: [0, 0, 0],
          s: [{ t: 'lathe', ax: 'x', pts: sharp([[0, -6], [1.3, -6], [1.3, -1.2], [1.0, -1.2], [1.0, 0.22], [0.93, 0.22], [0.93, 0.42], [1.0, 0.42], [1.0, 6], [0, 6]], 0.01) }] },
        { id: 'bearing', name: ['Ball bearing 6204', 'بلية 6204'], role: ['Held on the shaft by shoulder + external circlip, in the housing by shoulder + internal circlip.', 'ماسكها على العمود الكتف والسيكلبس الخارجي، وفي الكرسي الكتف والسيكلبس الداخلي.'], mat: 'steel', ex: [4, 0, 0],
          s: [{ t: 'cyl', r: 2.35, ri: 2.03, h: 1.4, ax: 'x', p: [-0.5, 0, 0] }, { t: 'cyl', r: 1.32, ri: 1.0, h: 1.4, ax: 'x', p: [-0.5, 0, 0] }, { t: 'balls', n: 8, R: 1.67, r: 0.34, ax: 'x', p: [-0.5, 0, 0], m: 'chrome' }] },
        { id: 'ext_circlip', name: ['External circlip (DIN 471)', 'سيكلبس خارجي (DIN 471)'], role: ['Ring smaller than the shaft: opened with pliers, springs into the shaft groove.', 'حلقة أصغر من العمود، بتتفتح بالزرادية وتنط في مجرى العمود.'], mat: 'black', ex: [7.5, 0, 0], cut: false,
          s: [{ t: 'ext', ax: 'x', d: 0.12, p: [0.32, 0, 0], pts: ring(0.94, 1.2, 22) }, { ...ear(1.32, 112, 0.22, 0.08), p: [0.32, 0, 0] }, { ...ear(1.32, 68, 0.22, 0.08), p: [0.32, 0, 0] }] },
        { id: 'housing', name: ['Housing with bore groove', 'الكرسي ومجرى الخرم'], role: ['Bore with a shoulder on one side and a circlip groove on the other.', 'خرم فيه كتف من ناحية ومجرى سيكلبس من الناحية التانية.'], mat: 'cast', ex: [-9.5, 0, 0],
          s: [{ t: 'lathe', ax: 'x', seg: 64, pts: sharp([[2.0, -3], [4.0, -3], [4.0, 1.5], [2.35, 1.5], [2.35, 0.4], [2.52, 0.4], [2.52, 0.22], [2.35, 0.22], [2.35, -1.2], [2.0, -1.2], [2.0, -3]], 0.02) }] },
        { id: 'int_circlip', name: ['Internal circlip (DIN 472)', 'سيكلبس داخلي (DIN 472)'], role: ['Ring bigger than the bore: closed with pliers, springs out into the bore groove.', 'حلقة أكبر من الخرم، بتتقفل بالزرادية وتفتح في مجرى الخرم.'], mat: 'black', ex: [10, 0, 0], cut: false,
          s: [{ t: 'ext', ax: 'x', d: 0.12, p: [0.31, 0, 0], pts: ring(2.12, 2.5, 14) }, { ...ear(1.92, 106, 0.24, 0.09), p: [0.31, 0, 0] }, { ...ear(1.92, 74, 0.24, 0.09), p: [0.31, 0, 0] }] },
      ],
      steps: ['shaft', 'bearing', 'ext_circlip', 'housing', 'int_circlip'],
      quiz: [
        { q: ['Which circlip goes on a shaft?', 'أنهي سيكلبس بيتركب على العمود؟'], a: ['External (DIN 471)', 'الخارجي (DIN 471)'], w: [['Internal (DIN 472)', 'الداخلي (DIN 472)'], ['Either', 'أي واحد'], ['A split pin', 'تيلة']] },
        { q: ['A circlip was opened too far during fitting. What now?', 'السيكلبس اتفتح زيادة وانت بتركبه. تعمل إيه؟'], a: ['Fit a new one', 'ركّب واحد جديد'], w: [['Squeeze it back with pliers', 'اقفله تاني بالزرادية'], ['Use it, it will settle', 'ركّبه هيظبط لوحده'], ['Weld the gap', 'الحم الفتحة']] },
      ],
    });
  })();
})(typeof window !== 'undefined' ? window : globalThis);
