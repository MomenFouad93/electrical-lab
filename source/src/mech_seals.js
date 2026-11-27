/* Mechanical: seals and gaskets (axis X, centred at the origin) */
(function (g) {
  const EL = g.EL, M = EL.mech;
  // crisp edges: three.js LatheGeometry blends vertex normals across corners (rings look like doughnuts).
  // Insert a point 0.004 cm each side of every sharp corner, and build ring cylinders / ring nuts as lathes.
  const crisp = (pts) => {
    const o = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i - 1], c = pts[i], b = pts[i + 1];
      const ux = a[0] - c[0], uy = a[1] - c[1], vx = b[0] - c[0], vy = b[1] - c[1], lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy);
      if (lu < 1e-6 || lv < 1e-6 || -(ux * vx + uy * vy) / (lu * lv) > 0.9) { o.push(c); continue; }
      const d = Math.min(0.004, lu / 4, lv / 4);
      o.push([c[0] + (ux / lu) * d, c[1] + (uy / lu) * d], c, [c[0] + (vx / lv) * d, c[1] + (vy / lv) * d]);
    }
    o.push(pts[pts.length - 1]); return o;
  };
  const ringPts = (ri, r1, r2, h) => [[ri, -h / 2], [r2, -h / 2], [r1, h / 2], [ri, h / 2], [ri, -h / 2]];
  const fix = (s) => {
    if (s.t === 'lathe') return Object.assign({}, s, { pts: crisp(s.pts) });
    if ((s.t === 'cyl' || s.t === 'hex') && s.ri) {
      const h = s.h || 1, r1 = s.r1 != null ? s.r1 : s.r, r2 = s.r2 != null ? s.r2 : s.r;
      const o = Object.assign({}, s, { t: 'lathe', pts: crisp(ringPts(s.ri, r1, r2, h)), seg: s.t === 'hex' ? 6 : s.seg || 48 });
      delete o.r; delete o.ri; delete o.r1; delete o.r2; delete o.h; return o;
    }
    return s;
  };
  const add = (c) => { for (const p of c.parts) p.s = p.s.map(fix); M.add(c); };
  const D = Math.PI / 180;
  const rad = (R, a, x) => [x, R * Math.cos(a * D), R * Math.sin(a * D)]; // point at radius R, angle a from +Y toward +Z
  const mir = (pts) => pts.map(([r, x]) => [r, -x]).reverse();
  const SP = (sp) => ({ rot: [1, 0, 0], speed: sp });
  const diag = [45, 135, 225, 315];

  /* ---------- single component mechanical seal ---------- */
  add({
    id: 'mech_seal_single', cat: 'seals',
    name: ['Mechanical seal (single, component type)', 'ميكانيكال سيل (مفرد، كومبوننت)'],
    info: {
      what: ['A rotating carbon face is pushed by a spring against a stationary silicon carbide seat. The very thin liquid film between the two lapped faces is what seals the shaft.', 'وش كربون بيلف ومضغوط بسوستة على سيت ثابت من سيليكون كاربيد. طبقة السايل الرفيعة جداً بين الوشين المعمول لهم لابنج (مسطحين جداً) هي اللي بتقفل على العمود.'],
      use: ['Centrifugal pumps on purified water, cooling and chilled water, CIP return and utility pumps. Product-contact WFI pumps use sanitary seal designs.', 'الطلمبات الطاردة على المية المنقاة، مية التبريد والمية المثلجة، راجع الـ CIP وطلمبات المرافق. طلمبات الـ WFI اللي ملامسة للمنتج بتستخدم سيلات صحية (سانيتري).'],
      how: ['Drive collar, spring, holder, O-ring and carbon turn with the shaft. The seat is held still in the gland by its O-ring. The O-rings stop leaks along the shaft and around the seat.', 'الكولار والسوستة والهولدر والأورينج والكربون بيلفوا مع العمود. السيت ثابت في الجلاند بالأورينج بتاعه. الأورينجات بتمنع التسريب على العمود وحوالين السيت.'],
      fail: ['A steady drip or spray, cracked or heat-checked faces after dry running, chipped carbon, hard or swollen O-rings, low spring force from a wrong setting length.', 'تنقيط مستمر أو رش، أوجه مشروخة أو محروقة من الشغل على الناشف، كربون مكسور الحرف، أورينجات ناشفة أو منفوخة، ضغط سوستة ضعيف من طول تركيب غلط.'],
      pm: ['Never run dry: fill and vent the pump first. Set the working length from the drawing before tightening the set screws. Keep faces clean and dry, lubricate O-rings only with a compatible lubricant, tighten gland nuts evenly crosswise.', 'متشغلهاش على الناشف أبداً: املا الطلمبة وطلّع الهوا الأول. اظبط طول التشغيل من الرسمة قبل ما تربط مسامير الزنق. خلي الأوجه نضيفة وناشفة، وشحّم الأورينجات بس بمادة مناسبة، واربط صواميل الجلاند بالتساوي بالتقاطع.'],
    },
    cut: 'z',
    parts: [
      { id: 'chamber', name: ['Seal chamber (pump back plate)', 'حجرة السيل (الغطا الخلفي للطلمبة)'], role: ['Bore around the shaft where the seal works in the pumped liquid; studs hold the gland.', 'التجويف حوالين العمود اللي السيل بيشتغل فيه جوه السايل؛ والجوايط ماسكة الجلاند.'], mat: 'castg', ex: [7, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[3.0, -1.1], [4.6, -1.1], [4.6, 4.6], [1.95, 4.6], [1.95, 4.0], [3.0, 4.0], [3.0, -1.1]] },
          ...diag.map((a) => ({ t: 'cyl', ax: 'x', r: 0.3, h: 3.6, p: rad(3.9, a, -1.3), m: 'steel' })),
          { t: 'cyl', r: 0.35, ri: 0.18, h: 0.9, p: [1.5, 4.9, 0], m: 'brass' }] },
      { id: 'shaft', name: ['Pump shaft (Ø35 mm)', 'عمود الطلمبة (35 مم)'], role: ['Turns the impeller; the rotating seal parts are fixed on it.', 'بيلف الريشة؛ وأجزاء السيل اللي بتلف متثبتة عليه.'], mat: 'steel', ex: [0, 0, 0], cut: false,
        s: [{ t: 'cyl', ax: 'x', r: 1.75, h: 13, p: [0.5, 0, 0] }] },
      { id: 'collar', name: ['Drive collar with set screws', 'الكولار بمسامير الزنق'], role: ['Locked on the shaft at the setting length; drives the spring and gives it its preload.', 'بيتقفل على العمود على طول التركيب؛ بيلف السوستة وبيديها الضغط المسبق.'], mat: 'sst', ex: [-4.5, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.65, ri: 1.755, h: 0.9, p: [3.05, 0, 0] },
          { t: 'cyl', r: 0.18, h: 0.95, p: rad(2.25, 0, 3.05), m: 'black' }, { t: 'cyl', r: 0.18, h: 0.95, p: rad(2.25, 180, 3.05), rot: [180, 0, 0], m: 'black' }] },
      { id: 'spring', name: ['Spring', 'السوستة'], role: ['Keeps the faces closed when the pump is stopped and takes up face wear.', 'بتخلي الأوجه مقفولة والطلمبة واقفة وبتعوّض تآكل الأوجه.'], mat: 'sst', ex: [-6.2, 0, 0],
        s: [{ t: 'spring', ax: 'x', R: 2.15, r: 0.12, turns: 4.5, len: 2.2, p: [1.5, 0, 0] }] },
      { id: 'holder', name: ['Rotary holder (retainer)', 'الهولدر (حامل الوش الدوّار)'], role: ['Holds the carbon face and the shaft O-ring; slides axially as the faces wear.', 'ماسك وش الكربون وأورينج العمود؛ بيتحرك محورياً مع تآكل الأوجه.'], mat: 'sst', ex: [-7.6, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 56, pts: [[2.405, -0.9], [2.55, -0.9], [2.55, 0.4], [1.95, 0.4], [1.95, -0.555], [2.405, -0.555], [2.405, -0.9]] }] },
      { id: 'oring2', name: ['Shaft O-ring (secondary seal)', 'أورينج العمود (سيل تانوي)'], role: ['Seals between holder and shaft while still letting the holder slide.', 'بيقفل بين الهولدر والعمود ويسيب الهولدر يتحرك.'], mat: 'epdm', ex: [-9.2, 0, 0],
        s: [{ t: 'torus', ax: 'x', R: 1.85, r: 0.1, p: [-0.25, 0, 0] }] },
      { id: 'rotary', name: ['Rotary face (carbon)', 'الوش الدوّار (كربون)'], role: ['Carbon-graphite ring with a narrow lapped nose that runs on the seat.', 'حلقة كربون جرافيت ليها مناخير ضيقة معمول لها لابنج بتلف على السيت.'], mat: 'carbon', ex: [-9.9, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 56, pts: [[2.05, -1.045], [2.3, -1.045], [2.3, -0.95], [2.4, -0.95], [2.4, -0.56], [1.85, -0.56], [1.85, -0.95], [2.05, -0.95], [2.05, -1.045]] }] },
      { id: 'gasket', name: ['Gland gasket', 'جوان الجلاند'], role: ['Flat gasket between gland plate and seal chamber face.', 'جوان مسطح بين الجلاند ووش حجرة السيل.'], mat: 'grey', ex: [-13.9, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 4.4, ri: 3.05, h: 0.096, p: [-1.15, 0, 0] }] },
      { id: 'seat_oring', name: ['Seat O-ring', 'أورينج السيت'], role: ['Seals around the seat and cushions it in the gland pocket.', 'بيقفل حوالين السيت وبيسنده في تجويف الجلاند.'], mat: 'epdm', ex: [-12.6, 0, 0],
        s: [{ t: 'torus', ax: 'x', R: 2.52, r: 0.075, p: [-1.47, 0, 0] }] },
      { id: 'seat', name: ['Stationary seat (silicon carbide)', 'السيت الثابت (سيليكون كاربيد)'], role: ['Hard, flat lapped face that does not turn; the carbon runs on it.', 'وش جامد ومسطح ومعمول له لابنج ومبيلفش؛ الكربون بيلف عليه.'], mat: 'sic', ex: [-11.4, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 56, pts: [[1.95, -1.69], [2.45, -1.69], [2.45, -1.25], [2.35, -1.25], [2.35, -1.05], [2.0, -1.05], [2.0, -1.25], [1.95, -1.25], [1.95, -1.69]] }] },
      { id: 'gland', name: ['Gland plate', 'الجلاند (غطا السيل)'], role: ['Holds the seat in its pocket and closes the seal chamber; bolted with four nuts.', 'ماسك السيت في التجويف وبيقفل حجرة السيل؛ متربط بأربع صواميل.'], mat: 'sst', ex: [-15.2, 0, 0],
        s: [{ t: 'flange', ax: 'x', r: 4.6, ri: 2.6, h: 1.2, holes: 4, pcd: 3.9, hr: 0.36, p: [-1.8, 0, 0] },
          { t: 'cyl', ax: 'x', r: 2.61, ri: 1.95, h: 0.7, p: [-2.05, 0, 0] },
          { t: 'cyl', ax: 'x', r: 2.98, ri: 2.6, h: 0.4, p: [-1.0, 0, 0] }] },
      { id: 'nuts', name: ['Gland nuts', 'صواميل الجلاند'], role: ['Pull the gland evenly onto the chamber; tighten crosswise.', 'بتشد الجلاند بالتساوي على الحجرة؛ اربط بالتقاطع.'], mat: 'steel', ex: [-16.9, 0, 0],
        s: diag.map((a) => ({ t: 'hex', ax: 'x', r: 0.6, ri: 0.3, h: 0.5, p: rad(3.9, a, -2.655) })) },
    ],
    steps: ['chamber', 'shaft', 'collar', 'spring', 'holder', 'oring2', 'rotary', 'gasket', 'seat_oring', 'seat', 'gland', 'nuts'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft: SP(1), collar: SP(1), spring: SP(1), holder: SP(1), oring2: SP(1), rotary: SP(1) } },
    quiz: [
      { q: ['What actually seals between the seal faces?', 'إيه اللي بيقفل فعلاً بين أوجه السيل؟'], a: ['A very thin liquid film between the lapped faces', 'طبقة سايل رفيعة جداً بين الأوجه المعمول لها لابنج'], w: [['The spring', 'السوستة'], ['Grease packed between them', 'شحم متحط بينهم'], ['The gland gasket', 'جوان الجلاند']] },
      { q: ['A new seal leaks after a few minutes and the faces are cracked. Most likely cause?', 'سيل جديد سرّب بعد كام دقيقة والأوجه مشروخة. السبب الأغلب؟'], a: ['The pump ran dry', 'الطلمبة اشتغلت على الناشف'], w: [['The gland nuts were too loose', 'صواميل الجلاند كانت سايبة'], ['The water was too cold', 'المية كانت ساقعة'], ['Wrong motor rotation only', 'اتجاه الموتور بس']] },
      { q: ['Which parts of this seal turn with the shaft?', 'أنهي أجزاء في السيل ده بتلف مع العمود؟'], a: ['Collar, spring, holder, shaft O-ring and carbon face', 'الكولار والسوستة والهولدر وأورينج العمود ووش الكربون'], w: [['Seat and gland', 'السيت والجلاند'], ['Only the spring', 'السوستة بس'], ['Seat, seat O-ring and gasket', 'السيت وأورينجه والجوان']] },
    ],
  });

  /* ---------- double cartridge mechanical seal ---------- */
  const glandBody = [[2.45, -3.4], [4.0, -3.4], [4.0, 0], [3.3, 0], [3.3, 1.6], [3.05, 1.6], [3.05, 0.4], [2.45, 0.4], [2.45, 0.2], [3.2, 0.2], [3.2, -1.9], [3.05, -1.9], [3.05, -3.2], [2.45, -3.2], [2.45, -3.4]];
  const springSet = (x, len) => [0, 45, 90, 135, 180, 225, 270, 315].map((a) => ({ t: 'spring', ax: 'x', R: 0.1, r: 0.025, turns: 5, len, p: rad(2.72, a + 22.5, x) }));
  const port = (a, cap) => [{ t: 'cyl', r: 0.32, ri: 0.16, h: 1.2, p: rad(4.5, a, -1.5), rot: [a, 0, 0], m: 'brass' }, { t: 'hex', r: 0.42, h: 0.3, p: rad(4.75, a, -1.5), rot: [a, 0, 0], m: 'brass' }, { t: 'cyl', r: 0.34, h: 0.15, p: rad(5.15, a, -1.5), rot: [a, 0, 0], m: cap }];
  const clip = (a) => [{ t: 'box', w: 0.1, h: 0.7, d: 0.9, p: rad(3.6, a, -3.455), rot: [a, 0, 0] }, { t: 'box', w: 1.1, h: 0.18, d: 0.9, p: rad(3.3, a, -3.96), rot: [a, 0, 0] },
    { t: 'box', w: 0.18, h: 0.38, d: 0.9, p: rad(3.11, a, -4.2), rot: [a, 0, 0] }, { t: 'cyl', ax: 'x', r: 0.13, h: 0.3, p: rad(3.75, a, -3.66), m: 'black' }];
  add({
    id: 'mech_seal_cartridge', cat: 'seals',
    name: ['Cartridge mechanical seal (double, with barrier fluid)', 'ميكانيكال سيل كارتريدج دبل (بسايل حاجز)'],
    info: {
      what: ['A pre-assembled double seal on its own sleeve: two pairs of faces with a barrier fluid between them. Set at the factory; setting clips hold the working length until it is installed.', 'سيل دبل متجمّع جاهز على جلبة خاصة بيه: طقمين أوجه وبينهم سايل حاجز. متظبط من المصنع؛ وكلبسات الضبط ماسكة طول التشغيل لحد ما يتركب.'],
      use: ['Agitators on reactors and process vessels, hot WFI and solvent pumps: anywhere product must not leak to the room and air must not get in.', 'الأجيتيتور على الريأكتورات وتانكات التصنيع، طلمبات الـ WFI السخنة والمذيبات: أي مكان المنتج ممنوع يسرّب للغرفة والهوا ممنوع يدخل.'],
      how: ['Barrier fluid kept at a higher pressure than the product (for example API Plan 53) enters at IN and leaves at OUT, cooling both seals. If the inner seal wears, clean barrier leaks into the product instead of product leaking out.', 'السايل الحاجز بضغط أعلى من المنتج (زي API Plan 53) بيدخل من IN ويخرج من OUT وبيبرّد السيلين. لو السيل الجواني داب، السايل النضيف هو اللي يسرّب للمنتج بدل ما المنتج يطلع بره.'],
      fail: ['Barrier level falling (a face leaking), level rising (product getting in), pressure dropping, hot gland, damage when the setting clips are left on at start-up.', 'مستوى السايل الحاجز بيقل (وش بيسرّب)، أو بيزيد (منتج داخل)، الضغط بينزل، الجلاند سخن، وتلف لو كلبسات الضبط اتسابت والطلمبة اشتغلت.'],
      pm: ['Bolt the gland, tighten the collar set screws, then remove the setting clips before start (keep them for removal). Connect IN at the bottom and OUT at the top and vent the air. Check barrier pressure and level every shift.', 'اربط الجلاند، اربط مسامير الكولار، وبعدين شيل كلبسات الضبط قبل التشغيل (واحتفظ بيها للفك). وصّل IN من تحت وOUT من فوق وطلّع الهوا. اتأكد من ضغط ومستوى السايل الحاجز كل وردية.'],
    },
    cut: 'z',
    parts: [
      { id: 'chamber', name: ['Seal chamber / vessel nozzle', 'حجرة السيل / رقبة التانك'], role: ['Equipment face the cartridge bolts onto; the inboard seal sits inside its bore.', 'وش المعدة اللي الكارتريدج بيتربط عليه؛ والسيل الجواني قاعد جوه تجويفه.'], mat: 'castg', ex: [7, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[3.4, 0.1], [5.6, 0.1], [5.6, 3.2], [2.2, 3.2], [2.2, 2.7], [3.4, 2.7], [3.4, 0.1]] },
          ...diag.map((a) => ({ t: 'cyl', ax: 'x', r: 0.33, h: 3.0, p: rad(4.8, a, -0.1), m: 'steel' }))] },
      { id: 'shaft', name: ['Shaft (Ø40 mm)', 'العمود (40 مم)'], role: ['Agitator or pump shaft; the cartridge sleeve is locked on it.', 'عمود الخلاط أو الطلمبة؛ وجلبة الكارتريدج متقفلة عليه.'], mat: 'steel', ex: [0, 0, 0], cut: false,
        s: [{ t: 'cyl', ax: 'x', r: 2.0, h: 13 }] },
      { id: 'sleeve', name: ['Sleeve with O-ring', 'الجلبة بالأورينج'], role: ['Carries both rotating faces, so the shaft is never touched by the faces. Its O-ring seals to the shaft.', 'شايلة الوشين الدوارين فالأوجه مبتلمسش العمود. والأورينج بتاعها بيقفل على العمود.'], mat: 'sst', ex: [0, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[2.005, -4.8], [2.3, -4.8], [2.3, -1.6], [2.8, -1.6], [2.8, -1.4], [2.3, -1.4], [2.3, 2.1], [3.0, 2.1], [3.0, 2.6], [2.005, 2.6], [2.005, -4.8]] },
          { t: 'torus', ax: 'x', R: 2.095, r: 0.085, p: [2.3, 0, 0], m: 'epdm' }] },
      { id: 'face_in_rot', name: ['Inboard rotary face (SiC)', 'الوش الدوّار الجواني (SiC)'], role: ['Turns with the sleeve on the product side.', 'بيلف مع الجلبة ناحية المنتج.'], mat: 'sic', ex: [1.6, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.95, ri: 2.35, h: 0.49, p: [1.85, 0, 0] }] },
      { id: 'face_in_stat', name: ['Inboard stationary face (carbon)', 'الوش الثابت الجواني (كربون)'], role: ['Spring-loaded carbon face held in the gland spigot.', 'وش كربون عليه سوست وماسكه طرف الجلاند.'], mat: 'carbon', ex: [0.25, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 56, pts: [[2.4, 1.1], [2.95, 1.1], [2.95, 1.5], [2.85, 1.5], [2.85, 1.595], [2.5, 1.595], [2.5, 1.5], [2.4, 1.5], [2.4, 1.1]] }] },
      { id: 'springs_in', name: ['Inboard springs', 'سوست الجواني'], role: ['Eight small springs push the inboard carbon onto its rotary face.', 'تمن سوست صغيرة بتزق الكربون الجواني على الوش الدوّار.'], mat: 'sst', ex: [-0.4, 0, 0],
        s: springSet(0.75, 0.7) },
      { id: 'gasket', name: ['Gland gasket', 'جوان الجلاند'], role: ['Seals the gland flange to the equipment face.', 'بيقفل بين فلانشة الجلاند ووش المعدة.'], mat: 'grey', ex: [-1.0, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 4.35, ri: 3.35, h: 0.096, p: [0.05, 0, 0] }] },
      { id: 'gland', name: ['Gland with IN / OUT ports', 'الجلاند بفتحات IN / OUT'], role: ['Holds both stationary faces and forms the barrier chamber; IN (blue) and OUT (red) ports for the barrier fluid.', 'ماسك الوشين الثابتين وبيعمل حجرة السايل الحاجز؛ فيه فتحة IN (أزرق) وOUT (أحمر) للسايل.'], mat: 'sst', ex: [-6.0, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: glandBody },
          { t: 'flange', ax: 'x', r: 5.6, ri: 3.95, h: 0.8, holes: 4, pcd: 4.8, hr: 0.4, p: [-0.4, 0, 0] },
          ...port(35, 'blue'), ...port(-35, 'red')] },
      { id: 'face_out_rot', name: ['Outboard rotary face (SiC)', 'الوش الدوّار البراني (SiC)'], role: ['Second rotating face, against the sleeve shoulder.', 'الوش الدوّار التاني، ساند على كتف الجلبة.'], mat: 'sic', ex: [0, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.9, ri: 2.35, h: 0.49, p: [-1.85, 0, 0] }] },
      { id: 'face_out_stat', name: ['Outboard stationary face (carbon)', 'الوش الثابت البراني (كربون)'], role: ['Atmosphere-side carbon face; keeps barrier fluid in.', 'وش الكربون ناحية الجو؛ بيحبس السايل الحاجز جوه.'], mat: 'carbon', ex: [-0.9, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 56, pts: [[2.4, -2.6], [2.95, -2.6], [2.95, -2.2], [2.85, -2.2], [2.85, -2.1], [2.5, -2.1], [2.5, -2.2], [2.4, -2.2], [2.4, -2.6]] }] },
      { id: 'springs_out', name: ['Outboard springs', 'سوست البراني'], role: ['Push the outboard carbon toward its rotary face.', 'بتزق الكربون البراني على الوش الدوّار.'], mat: 'sst', ex: [-1.2, 0, 0],
        s: springSet(-2.9, 0.6) },
      { id: 'nuts', name: ['Gland nuts', 'صواميل الجلاند'], role: ['Pull the gland flange evenly onto the gasket.', 'بتشد فلانشة الجلاند بالتساوي على الجوان.'], mat: 'steel', ex: [-7.0, 0, 0],
        s: diag.map((a) => ({ t: 'hex', ax: 'x', r: 0.62, ri: 0.33, h: 0.5, p: rad(4.8, a, -1.06) })) },
      { id: 'collar', name: ['Drive collar with set screws', 'الكولار بمسامير الزنق'], role: ['Three set screws go through the sleeve into the shaft and drive it.', 'تلات مسامير زنق بتعدي من الجلبة للعمود وبتلفها.'], mat: 'sst', ex: [-6.5, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 56, pts: [[2.305, -4.8], [3.2, -4.8], [3.2, -4.3], [2.9, -4.3], [2.9, -4.1], [3.2, -4.1], [3.2, -3.6], [2.305, -3.6], [2.305, -4.8]] },
          ...[60, 180, 300].map((a) => ({ t: 'cyl', r: 0.17, h: 1.2, p: rad(2.6, a, -3.85), rot: [a, 0, 0], m: 'black' }))] },
      { id: 'clips', name: ['Setting clips (remove before start)', 'كلبسات الضبط (تتشال قبل التشغيل)'], role: ['Hold the sleeve centred at the right length during fitting. Remove them after the set screws are tight.', 'ماسكين الجلبة في النص وعلى الطول الصح وقت التركيب. تتشال بعد ربط مسامير الزنق.'], mat: 'orange', ex: [-8.5, 0, 0],
        s: [0, 120, 240].flatMap(clip) },
    ],
    steps: ['chamber', 'shaft', 'sleeve', 'face_in_rot', 'face_in_stat', 'springs_in', 'gasket', 'gland', 'face_out_rot', 'face_out_stat', 'springs_out', 'collar', 'clips', 'nuts'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft: SP(1), sleeve: SP(1), face_in_rot: SP(1), face_out_rot: SP(1), collar: SP(1) } },
    quiz: [
      { q: ['When are the setting clips removed?', 'كلبسات الضبط بتتشال إمتى؟'], a: ['After the gland is bolted and the set screws are tight, before start-up', 'بعد ربط الجلاند ومسامير الزنق، وقبل التشغيل'], w: [['Before bolting the gland', 'قبل ربط الجلاند'], ['Never, they stay on', 'مبتتشالش خالص'], ['After the first hour of running', 'بعد أول ساعة تشغيل']] },
      { q: ['The barrier fluid level keeps dropping. This means…', 'مستوى السايل الحاجز بيقل باستمرار. يعني…'], a: ['One of the seal faces is leaking barrier fluid', 'وش من أوجه السيل بيسرّب السايل الحاجز'], w: [['The product is entering the barrier system', 'المنتج داخل على السايل الحاجز'], ['It is normal evaporation only', 'تبخير طبيعي وخلاص'], ['The shaft is turning too slowly', 'العمود بيلف ببطء']] },
      { q: ['Why is the barrier pressure kept above the product pressure?', 'ليه ضغط السايل الحاجز أعلى من ضغط المنتج؟'], a: ['So any inboard leak is clean barrier into the product, not product out', 'عشان لو الجواني سرّب يبقى السايل النضيف داخل للمنتج مش المنتج طالع'], w: [['To cool the motor', 'عشان يبرّد الموتور'], ['To push the shaft axially', 'عشان يزق العمود محورياً'], ['It is not, it must be lower', 'لأ، لازم يكون أقل']] },
    ],
  });

  /* ---------- lip seal (radial shaft seal, 40x52x7) ---------- */
  add({
    id: 'lip_seal', cat: 'seals',
    name: ['Lip seal / oil seal (40x52x7)', 'أويل سيل (سيل شفة 40x52x7)'],
    info: {
      what: ['Radial shaft seal: a rubber lip pressed onto the shaft by a garter spring, with a metal case for stiffness and press fit. A second dust lip keeps dirt out.', 'سيل قطري للعمود: شفة كاوتش مضغوطة على العمود بسوستة دائرية، وجواه شاسيه حديد بيديله صلابة وتركيب بالكبس. وفيه شفة تانية للتراب.'],
      use: ['Gearboxes, motor and pump bearing housings, conveyor geared motors, gear pumps.', 'الجيربوكسات، هاوزنج البلي في المواتير والطلمبات، مواتير السيور بالجير، طلمبات التروس.'],
      how: ['The main lip faces the oil; the spring keeps contact as the lip wears. A very thin oil film under the lip edge lubricates it, so it must never run dry.', 'الشفة الأساسية وشها ناحية الزيت؛ والسوستة بتحافظ على التلامس مع تآكل الشفة. طبقة زيت رفيعة جداً تحت حرف الشفة بتزيّتها فمينفعش تشتغل على الناشف.'],
      fail: ['Oil leak, hard and cracked lip from heat, groove worn into the shaft, lip turned over during fitting, spring jumped off, damage from a dry or rough shaft.', 'تسريب زيت، شفة ناشفة ومشروخة من السخونية، مجرى محفور في العمود، الشفة اتقلبت وقت التركيب، السوستة نطت، تلف من عمود ناشف أو خشن.'],
      pm: ['Press in square with a fitting tool on the case, spring side toward the oil. Cover keyways and threads with a fitting sleeve and oil the lip. If the shaft is grooved, fit a repair sleeve or set the seal a few mm deeper.', 'اكبسه على استقامة بعدة كبس على الشاسيه، ناحية السوستة للزيت. غطّي مجرى الخابور والقلاووظ بجلبة تركيب وزيّت الشفة. لو العمود محفور، ركّب جلبة إصلاح أو دخّل السيل كام مللي لجوه.'],
    },
    cut: 'z',
    parts: [
      { id: 'housing', name: ['Housing bore', 'تجويف الهاوزنج'], role: ['Bore with a lead-in chamfer; the seal is pressed in up to the shoulder side.', 'تجويف بشطفة دخول؛ السيل بيتكبس لحد ناحية الكتف.'], mat: 'castg', ex: [0, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[2.75, -0.6], [3.8, -0.6], [3.8, 1.4], [2.25, 1.4], [2.25, 0.5], [2.6, 0.5], [2.6, -0.45], [2.75, -0.6]] }] },
      { id: 'case', name: ['Metal case', 'الشاسيه الحديد'], role: ['L-shaped steel insert that gives the seal stiffness for the press fit.', 'شريحة حديد على شكل L بتدي السيل صلابة للتركيب بالكبس.'], mat: 'steel', ex: [-5.4, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.55, ri: 2.45, h: 0.6 }, { t: 'cyl', ax: 'x', r: 2.55, ri: 2.2, h: 0.1, p: [-0.3, 0, 0] }] },
      { id: 'rubber', name: ['Rubber body and main lip', 'جسم الكاوتش والشفة الأساسية'], role: ['Rubber outside diameter seals in the bore; the sharp lip edge seals on the shaft.', 'الكاوتش من بره بيقفل في التجويف؛ وحرف الشفة الحاد بيقفل على العمود.'], mat: 'rubber', ex: [-3.8, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[2.2, -0.247], [2.447, -0.247], [2.447, 0.3], [2.38, 0.3], [2.38, 0.0], [2.25, 0.05], [2.15, 0.3], [2.003, 0.12], [2.12, -0.1], [2.2, -0.247]] },
          { t: 'cyl', ax: 'x', r: 2.598, ri: 2.553, h: 0.7 }] },
      { id: 'spring', name: ['Garter spring', 'السوستة الدائرية'], role: ['Ring spring behind the lip; keeps a constant radial force on the shaft.', 'سوستة حلقة ورا الشفة؛ بتحافظ على ضغط ثابت على العمود.'], mat: 'steel', ex: [-2.2, 0, 0],
        s: [{ t: 'torus', ax: 'x', R: 2.29, r: 0.07, p: [0.15, 0, 0] }] },
      { id: 'dust_lip', name: ['Dust lip', 'شفة التراب'], role: ['Small outer lip without spring that keeps dust and wash water out.', 'شفة صغيرة براني من غير سوستة بتمنع التراب ومية الغسيل.'], mat: 'rubber', ex: [-7, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[2.003, -0.45], [2.08, -0.45], [2.25, -0.3], [2.25, -0.25], [2.17, -0.25], [2.003, -0.45]] }] },
      { id: 'shaft', name: ['Shaft (Ø40 mm)', 'العمود (40 مم)'], role: ['Ground, polished running surface under the lip; chamfered end so the lip is not cut.', 'سطح مجلّخ ومصقول تحت الشفة؛ وطرفه مشطوف عشان الشفة متتقطعش.'], mat: 'steel', ex: [7, 0, 0], cut: false,
        s: [{ t: 'lathe', ax: 'x', seg: 56, pts: [[0, -4], [1.85, -4], [2.0, -3.85], [2.0, 4], [0, 4], [0, -4]] }] },
    ],
    steps: ['housing', 'case', 'rubber', 'spring', 'dust_lip', 'shaft'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft: SP(1) } },
    quiz: [
      { q: ['Which side of the lip seal faces the oil?', 'أنهي ناحية في الأويل سيل تبقى ناحية الزيت؟'], a: ['The spring side (main lip)', 'ناحية السوستة (الشفة الأساسية)'], w: [['The flat case side', 'ناحية الشاسيه المسطحة'], ['The dust lip side', 'ناحية شفة التراب'], ['Either side', 'أي ناحية']] },
      { q: ['The old seal wore a groove in the shaft. What do you do?', 'السيل القديم حفر مجرى في العمود. تعمل إيه؟'], a: ['Fit a repair sleeve or set the new seal at a different depth', 'تركّب جلبة إصلاح أو تدخّل السيل الجديد على عمق مختلف'], w: [['Fit the new seal in the same place', 'تركّب الجديد في نفس المكان'], ['Add grease under the lip', 'تحط شحم تحت الشفة'], ['Remove the garter spring', 'تشيل السوستة']] },
    ],
  });

  /* ---------- O-ring in a groove with backup ring (static radial, hydraulic cover) ---------- */
  const ell = (rc, xc, a, b, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = (i / n) * Math.PI * 2; o.push([rc + a * Math.cos(t), xc + b * Math.sin(t)]); } return o; };
  add({
    id: 'o_ring', cat: 'seals',
    name: ['O-ring in a groove (with backup ring)', 'أورينج في مجرى (بحلقة ساندة)'],
    info: {
      what: ['A round rubber ring in a rectangular groove. It is squeezed (about 15-30 % for static seals) between the groove bottom and the mating bore, so it seals even at zero pressure.', 'حلقة كاوتش مدورة في مجرى مستطيل. بتتزنق (حوالي 15 لـ 30% في السيل الثابت) بين قاع المجرى والتجويف المقابل، فبتقفل حتى من غير ضغط.'],
      use: ['Valves, tri-clamp and sanitary fittings, filter housings, hydraulic and pneumatic cylinders, pump casings, inside mechanical seals.', 'المحابس، وصلات الترايكلامب والوصلات الصحية، هاوزنج الفلاتر، السلندرات الهيدروليك والنيوماتيك، أجسام الطلمبات، وجوه الميكانيكال سيل.'],
      how: ['Pressure pushes the ring to the low-pressure side of the groove and makes it seal harder. A PTFE backup ring on that side stops the rubber extruding into the clearance gap at high pressure.', 'الضغط بيزق الأورينج لناحية الضغط الواطي في المجرى وبيخليه يقفل أكتر. وحلقة تيفلون ساندة في الناحية دي بتمنع الكاوتش يتعصر في الخلوص على الضغط العالي.'],
      fail: ['Nibbled or extruded edge (gap too big, no backup ring), flat set (heat, old age), swelling or softening (wrong rubber for the fluid), cuts from sharp edges at fitting.', 'حرف متاكل أو متعصر (خلوص كبير أو مفيش حلقة ساندة)، اتفلطح (حرارة أو قِدم)، انتفخ أو طري (كاوتش مش مناسب للسايل)، قطع من الحروف الحادة وقت التركيب.'],
      pm: ['Choose the material for the fluid: EPDM for water and steam (not oil), NBR for oil, FKM for heat and solvents; product contact needs FDA / USP Class VI. Lubricate, never roll it over threads, measure ID and cross-section.', 'اختار الخامة حسب السايل: EPDM للمية والبخار (مش للزيت)، NBR للزيت، FKM للحرارة والمذيبات؛ واللي ملامس للمنتج لازم FDA / USP Class VI. زيّته، ومتعدّيهوش على قلاووظ، وقيس القطر الداخلي وسُمك المقطع.'],
    },
    cut: 'z',
    parts: [
      { id: 'plug', name: ['Cover / plug with groove', 'الغطا (البلج) بالمجرى'], role: ['Male part with the rectangular groove (gland) cut in it; tapped hole for a puller.', 'الجزء الداخل وفيه المجرى المستطيل؛ وخرم مقلوظ للساحب.'], mat: 'steel', ex: [-3, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[0.25, -0.75], [0.95, -0.75], [1.0, -0.7], [1.0, -0.3], [0.738, -0.3], [0.738, 0.3], [1.0, 0.3], [1.0, 0.55], [0.95, 0.6], [0, 0.6], [0, -0.35], [0.25, -0.35], [0.25, -0.75]] }] },
      { id: 'backup', name: ['Backup ring (PTFE)', 'الحلقة الساندة (تيفلون)'], role: ['On the low-pressure side: bridges the gap so the O-ring cannot squeeze out.', 'ناحية الضغط الواطي: بتقفل الخلوص فالأورينج ميتعصرش لبره.'], mat: 'ptfe', ex: [-4.3, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 1.015, ri: 0.741, h: 0.12, p: [-0.237, 0, 0] }] },
      { id: 'o_ring', name: ['O-ring (squeezed)', 'الأورينج (متزنق)'], role: ['3.53 mm cord squeezed about 20 % into an oval between groove bottom and bore.', 'مقطع 3.53 مم متزنق حوالي 20% وبقى بيضاوي بين قاع المجرى والتجويف.'], mat: 'red', ex: [-5, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: ell(0.879, 0.1, 0.141, 0.2, 28) }] },
      { id: 'housing', name: ['Housing bore (pressure side)', 'تجويف الهاوزنج (ناحية الضغط)'], role: ['Bore the plug fits into, with a small clearance gap; oil pressure comes from the port side.', 'التجويف اللي الغطا بيدخل فيه بخلوص صغير؛ وضغط الزيت جاي من ناحية الفتحة.'], mat: 'cast', ex: [2.2, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[1.02, -1.2], [1.9, -1.2], [1.9, 1.6], [0.5, 1.6], [0.5, 1.2], [1.02, 1.2], [1.02, -0.78], [1.15, -0.78], [1.15, -0.9], [1.02, -0.9], [1.02, -1.2]] },
          { t: 'cyl', ax: 'x', r: 1.0, h: 0.59, p: [0.9, 0, 0], m: 'oil' },
          { t: 'cyl', r: 0.25, ri: 0.12, h: 0.7, p: [0.9, 2.1, 0], m: 'brass' }] },
      { id: 'circlip', name: ['Internal circlip', 'سيكلبس داخلي'], role: ['Snap ring in the bore groove that holds the cover against the pressure.', 'حلقة سوستة في مجرى التجويف ماسكة الغطا ضد الضغط.'], mat: 'black', ex: [-5.2, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 1.14, ri: 0.8, h: 0.1, p: [-0.84, 0, 0] }, { t: 'box', w: 0.1, h: 0.3, d: 0.2, p: [-0.84, 0.86, 0.2] }, { t: 'box', w: 0.1, h: 0.3, d: 0.2, p: [-0.84, 0.86, -0.2] }] },
    ],
    steps: ['plug', 'backup', 'o_ring', 'housing', 'circlip'],
    anim: { mode: 'toggle', label: ['Apply pressure', 'اضغط'], parts: { o_ring: { slide: [-0.08, 0, 0] } } },
    quiz: [
      { q: ['Why is the backup ring fitted?', 'ليه بنركّب الحلقة الساندة؟'], a: ['To stop the O-ring extruding into the gap at high pressure', 'عشان الأورينج ميتعصرش في الخلوص على الضغط العالي'], w: [['To make the O-ring tighter at zero pressure', 'عشان الأورينج يقفل أكتر من غير ضغط'], ['To stop the plug rotating', 'عشان الغطا ميلفش'], ['It replaces lubrication', 'بدل التزييت']] },
      { q: ['An EPDM O-ring is fitted in a mineral-oil hydraulic system. It will…', 'أورينج EPDM اتركب في سيستم هيدروليك بزيت معدني. هيحصل…'], a: ['Swell, soften and fail', 'ينتفخ ويطري ويبوظ'], w: [['Last longer than NBR', 'يعيش أكتر من NBR'], ['Work normally', 'يشتغل عادي'], ['Shrink and get harder only', 'ينكمش ويشد بس']] },
      { q: ['On which side of the O-ring is the backup ring placed?', 'الحلقة الساندة بتتحط في أنهي ناحية من الأورينج؟'], a: ['The low-pressure side', 'ناحية الضغط الواطي'], w: [['The high-pressure side', 'ناحية الضغط العالي'], ['Under the O-ring', 'تحت الأورينج'], ['Either side', 'أي ناحية']] },
    ],
  });

  /* ---------- gland packing (stuffing box) ---------- */
  const ringP = (id, n, x, a, ex) => ({ id, name: ['Packing ring ' + n, 'حلقة حشو ' + n], role: [n === 1 ? 'First ring at the bottom of the box; joint cut on a mandrel and staggered.' : 'Braided ring with its joint turned 90° from the ring before.', n === 1 ? 'أول حلقة في قاع الصندوق؛ القطع على مندريل ومتبادل مع اللي بعدها.' : 'حلقة مضفّرة والقطع بتاعها لافف 90 درجة عن اللي قبلها.'], mat: 'ptfe', ex: [ex, 0, 0],
    s: [{ t: 'cyl', ax: 'x', r: 2.995, ri: 2.005, h: 0.99, p: [x, 0, 0] }, { t: 'box', w: 1.0, h: 1.04, d: 0.05, p: rad(2.5, a, x), rot: [a, 0, 0], m: 'black' }] });
  add({
    id: 'gland_packing', cat: 'seals',
    name: ['Gland packing (stuffing box)', 'حشو جلاند (باكنج)'],
    info: {
      what: ['Rings of braided packing are squeezed by a gland follower around the shaft sleeve. Unlike a mechanical seal it must leak a little to cool and lubricate itself.', 'حلقات حشو مضفّرة بيضغطها الجلاند حوالين جلبة العمود. وعكس الميكانيكال سيل لازم يسرّب شوية عشان يبرّد ويزيّت نفسه.'],
      use: ['Older pumps on cooling towers, raw and fire water, slow agitators and large valve stems.', 'الطلمبات القديمة على أبراج التبريد، المية الخام ومية الحريق، الخلاطات البطيئة وأعمدة المحابس الكبيرة.'],
      how: ['Tightening the gland nuts compresses the rings so they grip the sleeve. The lantern ring lines up with the flush port so clean water reaches the middle of the box.', 'ربط صواميل الجلاند بيضغط الحلقات فتمسك على الجلبة. وحلقة اللانترن بتيجي قصاد فتحة الفلاش عشان المية النضيفة توصل لنص الصندوق.'],
      fail: ['Too tight: no leak, smoke, hot gland and a deep groove worn in the sleeve. Too loose: heavy leak. Burnt, hard rings and a scored sleeve.', 'زيادة ربط: مفيش تسريب، دخان، جلاند سخن ومجرى عميق في الجلبة. سايب: تسريب كتير. حلقات محروقة وناشفة وجلبة مخدوشة.'],
      pm: ['Cut rings on a mandrel of the sleeve size, stagger the joints 90°, seat each ring on its own, put the lantern ring under the flush port. Tighten the nuts evenly in small steps until a steady drip (about 40-60 drops per minute).', 'اقطع الحلقات على مندريل بمقاس الجلبة، لف القطع 90 درجة بين كل حلقة والتانية، دخّل كل حلقة لوحدها، وحط اللانترن تحت فتحة الفلاش. اربط الصواميل بالتساوي على خطوات صغيرة لحد تنقيط ثابت (حوالي 40 لـ 60 نقطة في الدقيقة).'],
    },
    cut: 'z',
    parts: [
      { id: 'box', name: ['Stuffing box with flush port', 'صندوق الحشو بفتحة الفلاش'], role: ['Bore that holds the packing; studs for the gland and a flush water port at the lantern ring.', 'التجويف اللي فيه الحشو؛ وفيه جوايط للجلاند وفتحة مية فلاش قصاد اللانترن.'], mat: 'castg', ex: [8, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[3.0, 0], [5.4, 0], [5.4, 1.2], [4.0, 1.2], [4.0, 7.6], [2.2, 7.6], [2.2, 7.0], [3.0, 7.0], [3.0, 0]] },
          { t: 'cyl', r: 0.35, ri: 0.18, h: 1.4, p: [4.4, 4.5, 0], m: 'brass' },
          { t: 'cyl', ax: 'x', r: 0.35, h: 3.2, p: [-0.6, 0, 4.3], m: 'steel' }, { t: 'cyl', ax: 'x', r: 0.35, h: 3.2, p: [-0.6, 0, -4.3], m: 'steel' }] },
      { id: 'shaft', name: ['Pump shaft', 'عمود الطلمبة'], role: ['Turns inside the box; protected by the sleeve.', 'بيلف جوه الصندوق؛ ومحمي بالجلبة.'], mat: 'steel', ex: [0, 0, 0], cut: false,
        s: [{ t: 'cyl', ax: 'x', r: 1.7, h: 14, p: [3, 0, 0] }] },
      { id: 'sleeve', name: ['Shaft sleeve', 'جلبة العمود'], role: ['Hard-faced replaceable sleeve, so the packing wears the sleeve and not the shaft.', 'جلبة مقسّاة بتتغير، فالحشو ياكل الجلبة مش العمود.'], mat: 'chrome', ex: [0, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.0, ri: 1.705, h: 9.5, p: [3.25, 0, 0] }] },
      ringP('ring1', 1, 6.5, 0, 0.3),
      ringP('ring2', 2, 5.5, 90, -0.4),
      { id: 'lantern', name: ['Lantern ring', 'حلقة اللانترن'], role: ['Grooved, drilled ring under the flush port: spreads flush water round the sleeve.', 'حلقة بمجاري وخروم تحت فتحة الفلاش: بتوزع مية الفلاش حوالين الجلبة.'], mat: 'bronze', ex: [-1.2, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 56, pts: [[2.05, 3.805], [2.95, 3.805], [2.95, 4.1], [2.7, 4.1], [2.7, 4.7], [2.95, 4.7], [2.95, 4.995], [2.05, 4.995], [2.05, 4.7], [2.3, 4.7], [2.3, 4.1], [2.05, 4.1], [2.05, 3.805]] },
          ...[0, 90, 180, 270].map((a) => ({ t: 'cyl', r: 0.12, h: 0.42, p: rad(2.5, a, 4.4), rot: [a, 0, 0], m: 'black' }))] },
      ringP('ring3', 3, 3.3, 180, -2.0),
      ringP('ring4', 4, 2.3, 270, -2.8),
      ringP('ring5', 5, 1.3, 0, -3.6),
      { id: 'follower', name: ['Gland follower', 'الجلاند (الضاغط)'], role: ['Pushes the packing in. It must never bottom on the box face.', 'بيزق الحشو لجوه. ولازم ميوصلش لوش الصندوق.'], mat: 'cast', ex: [-4.5, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.95, ri: 2.1, h: 0.995, p: [0.2975, 0, 0] }, { t: 'flange', ax: 'x', r: 5.2, ri: 2.1, h: 0.8, holes: 2, pcd: 4.3, hr: 0.42, p: [-0.6, 0, 0] }] },
      { id: 'nuts', name: ['Gland nuts', 'صواميل الجلاند'], role: ['Tightened evenly a little at a time to set the leak rate.', 'بتتربط بالتساوي شوية شوية عشان تظبط التنقيط.'], mat: 'steel', ex: [-5.25, 0, 0],
        s: [{ t: 'hex', ax: 'x', r: 0.65, ri: 0.35, h: 0.5, p: [-1.255, 0, 4.3] }, { t: 'hex', ax: 'x', r: 0.65, ri: 0.35, h: 0.5, p: [-1.255, 0, -4.3] }] },
    ],
    steps: ['box', 'shaft', 'sleeve', 'ring1', 'ring2', 'lantern', 'ring3', 'ring4', 'ring5', 'follower', 'nuts'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft: SP(1), sleeve: SP(1) } },
    quiz: [
      { q: ['Why are the packing ring joints staggered?', 'ليه بنلف قطعات حلقات الحشو عن بعض؟'], a: ['So the joints do not line up into a leak path', 'عشان القطعات متيجيش ورا بعض وتعمل طريق للتسريب'], w: [['To make fitting faster', 'عشان التركيب يبقى أسرع'], ['To balance the shaft', 'عشان توزن العمود'], ['It does not matter', 'مش فارقة']] },
      { q: ['The gland is hot and there is no leak at all. This means…', 'الجلاند سخن ومفيش تنقيط خالص. يعني…'], a: ['It is over-tightened: loosen and re-adjust', 'متربط زيادة: فكّ شوية واظبط تاني'], w: [['Perfect setting', 'ظبط مثالي'], ['The flush is too strong', 'الفلاش جامد'], ['The packing is missing', 'الحشو مش موجود']] },
    ],
  });

  /* ---------- bolted flange joint, DN100 PN16 raised face, spiral wound gasket ---------- */
  const flL = [[5.35, -9.0], [5.715, -9.0], [5.715, -5.2], [6.5, -2.3], [6.5, -0.4], [7.9, -0.4], [7.9, -0.165], [5.35, -0.165], [5.35, -9.0]];
  const bolt8 = (f) => [0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) => f(22.5 + 45 * i, i));
  const bands = []; for (let i = 0; i < 6; i++) bands.push({ t: 'cyl', ax: 'x', r: 5.75 + (i + 1) * 0.275, ri: 5.75 + i * 0.275, h: 0.326, m: i % 2 ? 'carbon' : 'sst' });
  add({
    id: 'flange_gasket_joint', cat: 'seals',
    name: ['Flange joint with spiral wound gasket (DN100 PN16)', 'وصلة فلانشة بجوان سبيرال (DN100 PN16)'],
    info: {
      what: ['Two raised-face weld neck flanges squeeze a gasket with 8 bolts. The joint seals only when the bolt load is high enough and even all round.', 'فلانشتين ويلد نك بوش بارز بيضغطوا جوان بـ 8 مسامير. الوصلة متقفلش غير لو شد المسامير كفاية ومتساوي على الدايرة كلها.'],
      use: ['Steam and condensate, plant and chilled water, vessel nozzles, heat exchangers and utility headers.', 'البخار والكوندنسيت، مية المصنع والمية المثلجة، فتحات التانكات، المبادلات الحرارية وخطوط المرافق الرئيسية.'],
      how: ['Bolt tension presses the gasket into the face finish. Spiral wound: steel winding with graphite filler; the outer centring ring centres it on the bolts and stops over-compression.', 'شد المسامير بيضغط الجوان في تشطيب الوش. السبيرال: شريط ستانلس ملفوف مع حشو جرافيت؛ والحلقة البرانية بتسنتره على المسامير وبتمنع الضغط الزيادة.'],
      fail: ['Leaks after heat cycles (bolt relaxation), crushed or off-centre gasket, uneven tightening that tilts the flanges, corroded or short bolts.', 'تسريب بعد السخونية والتبريد (المسامير ارتخت)، جوان مفعوص أو مش في النص، ربط مش متساوي بيميّل الفلانشات، مسامير مصدية أو قصيرة.'],
      pm: ['Always a new gasket, clean faces, lubricated threads. Number the bolts clockwise 1-8 and tighten in a star: 1-5-3-7-2-6-4-8, in passes of about 30 %, 60 % and 100 % torque, then one round clockwise at 100 %. 2-3 threads should show past the nut.', 'جوان جديد دايماً، أوجه نضيفة، وقلاووظ متشحم. رقّم المسامير مع عقارب الساعة من 1 لـ 8 واربط نجمة: 1-5-3-7-2-6-4-8، على مراحل 30% و60% و100% من العزم، وبعدين لفة أخيرة مع عقارب الساعة على 100%. لازم يبان 2 لـ 3 سنون بعد الصامولة.'],
    },
    cut: 'z',
    parts: [
      { id: 'flange_l', name: ['Weld neck flange (left)', 'فلانشة ويلد نك (شمال)'], role: ['Raised face flange welded to the pipe; the tapered hub spreads the stress.', 'فلانشة بوش بارز ملحومة على الماسورة؛ والرقبة المخروطية بتوزع الإجهاد.'], mat: 'steel', ex: [-6, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 72, pts: flL }, { t: 'flange', ax: 'x', r: 11, ri: 6.4, h: 2.0, holes: 8, pcd: 9.0, hr: 0.9, p: [-1.365, 0, 0] },
          { t: 'torus', ax: 'x', R: 5.72, r: 0.12, p: [-5.2, 0, 0], m: 'grey' }] },
      { id: 'gasket', name: ['Spiral wound gasket', 'جوان سبيرال (ملفوف)'], role: ['Winding of steel strip and graphite with an inner ring and a coloured outer centring ring.', 'لفة شريط ستانلس وجرافيت بحلقة داخلية وحلقة سنترة برانية ملونة.'], mat: 'sst', ex: [0, 0, 0],
        s: [...bands, { t: 'cyl', ax: 'x', r: 5.75, ri: 5.4, h: 0.3 }, { t: 'cyl', ax: 'x', r: 8.15, ri: 7.4, h: 0.3, m: 'green' }] },
      { id: 'flange_r', name: ['Weld neck flange (right)', 'فلانشة ويلد نك (يمين)'], role: ['Matching flange; bolt holes must line up straddling the centre line.', 'الفلانشة المقابلة؛ الخروم لازم تيجي على بعض ومتوزعة حوالين خط النص.'], mat: 'steel', ex: [6, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 72, pts: mir(flL) }, { t: 'flange', ax: 'x', r: 11, ri: 6.4, h: 2.0, holes: 8, pcd: 9.0, hr: 0.9, p: [1.365, 0, 0] },
          { t: 'torus', ax: 'x', R: 5.72, r: 0.12, p: [5.2, 0, 0], m: 'grey' }] },
      { id: 'bolts', name: ['Bolts M16 (8)', 'مسامير M16 (8)'], role: ['Stretch like springs and keep the gasket loaded. The yellow nut marks bolt 1; number the rest clockwise.', 'بتتمط زي السوست وبتفضل ضاغطة على الجوان. الصامولة الصفرا علامة مسمار 1؛ وكمّل الترقيم مع عقارب الساعة.'], mat: 'steel', ex: [-14, 0, 0],
        s: bolt8((a) => [{ t: 'hex', ax: 'x', r: 1.39, h: 1.0, p: rad(9, a, -3.165) }, { t: 'cyl', ax: 'x', r: 0.8, h: 7.0, p: rad(9, a, 0.835) }]) },
      { id: 'washers_h', name: ['Washers (head side)', 'الوردة (ناحية الراس)'], role: ['Hardened washers give a smooth face so torque turns into bolt tension.', 'وردة مقسّاة بتدي وش ناعم فالعزم يتحول لشد في المسمار.'], mat: 'steel', ex: [-12, 0, 0],
        s: bolt8((a) => [{ t: 'cyl', ax: 'x', r: 1.5, ri: 0.85, h: 0.296, p: rad(9, a, -2.515) }]) },
      { id: 'washers_n', name: ['Washers (nut side)', 'الوردة (ناحية الصامولة)'], role: ['Same hardened washers under the nuts.', 'نفس الوردة المقسّاة تحت الصواميل.'], mat: 'steel', ex: [8, 0, 0],
        s: bolt8((a) => [{ t: 'cyl', ax: 'x', r: 1.5, ri: 0.85, h: 0.296, p: rad(9, a, 2.515) }]) },
      { id: 'nuts', name: ['Nuts', 'الصواميل'], role: ['Tightened in the star order with a torque wrench.', 'بتتربط بترتيب النجمة بمفتاح عزم.'], mat: 'steel', ex: [10, 0, 0],
        s: bolt8((a, i) => [{ t: 'hex', ax: 'x', r: 1.39, h: 1.3, p: rad(9, a, 3.315), m: i === 0 ? 'yellow' : 'steel' }]) },
    ],
    steps: ['flange_l', 'gasket', 'flange_r', 'bolts', 'washers_h', 'washers_n', 'nuts'],
    quiz: [
      { q: ['Bolts numbered clockwise 1-8. What is the tightening order?', 'المسامير مترقمة مع عقارب الساعة من 1 لـ 8. ترتيب الربط إيه؟'], a: ['1-5-3-7-2-6-4-8 (star)', '1-5-3-7-2-6-4-8 (نجمة)'], w: [['1-2-3-4-5-6-7-8', '1-2-3-4-5-6-7-8'], ['1-3-5-7-2-4-6-8', '1-3-5-7-2-4-6-8'], ['Any order, full torque at once', 'أي ترتيب وعلى العزم الكامل مرة واحدة']] },
      { q: ['Can a used spiral wound gasket be fitted again?', 'ينفع نركّب جوان سبيرال مستعمل تاني؟'], a: ['No, always fit a new one', 'لأ، دايماً جوان جديد'], w: [['Yes, if it looks clean', 'آه لو شكله نضيف'], ['Yes, turned over', 'آه لو قلبته'], ['Yes, with extra torque', 'آه مع عزم زيادة']] },
    ],
  });

  /* ---------- tri-clamp (sanitary clamp) joint, 2" ---------- */
  const ferL = [[2.375, -3.0], [2.54, -3.0], [2.54, -0.8], [3.2, -0.4], [3.2, -0.1], [2.95, -0.1], [2.95, -0.18], [2.75, -0.18], [2.75, -0.1], [2.375, -0.1], [2.375, -3.0]];
  const HY = -4.15; // hinge pin height (part origin of the clamp halves)
  const half = (side, ri, ro) => { // half ring outline for ext ax:'x' (pts [a,b] -> y=-a, z=-b), shifted for origin HY
    const o = []; const n = 24;
    for (let i = 0; i <= n; i++) { const p = (8 + (164 * i) / n) * D; o.push([-(ro * Math.cos(p) - HY), -(side * ro * Math.sin(p))]); }
    for (let i = n; i >= 0; i--) { const p = (8 + (164 * i) / n) * D; o.push([-(ri * Math.cos(p) - HY), -(side * ri * Math.sin(p))]); }
    return o;
  };
  const clampHalf = (side) => [
    { t: 'ext', ax: 'x', d: 1.1, pts: half(side, 3.25, 3.9) },
    { t: 'ext', ax: 'x', d: 0.35, p: [-0.725, 0, 0], pts: half(side, 3.0, 3.9) },
    { t: 'ext', ax: 'x', d: 0.35, p: [0.725, 0, 0], pts: half(side, 3.0, 3.9) },
    { t: 'box', w: 1.1, h: 1.1, d: 0.35, p: [0, 4.3 - HY, side * 0.55] },
    { t: 'box', w: 0.5, h: 0.6, d: 0.6, p: [-0.3 * side, -3.95 - HY, side * 0.3] },
    { t: 'cyl', ax: 'x', r: 0.38, h: 0.5, p: [-0.3 * side, 0, 0] },
  ];
  add({
    id: 'triclamp_joint', cat: 'seals',
    name: ['Tri-clamp sanitary joint (2")', 'وصلة ترايكلامب صحية (2 بوصة)'],
    info: {
      what: ['Sanitary clamp joint: two ferrules with tapered backs, a gasket between them, held by a hinged clamp. The tapered groove of the clamp pulls the ferrules together as the wing nut is tightened.', 'وصلة صحية بكلامب: فيرول اتنين ضهرهم مخروطي وبينهم جوان، والكلامب أبو مفصلة ماسكهم. المجرى المخروطي في الكلامب بيقرّب الفيرولين لبعض لما تربط صامولة الفراشة.'],
      use: ['Purified water and WFI loops, CIP and SIP lines, product transfer, tank nozzles, instrument and sampling connections in pharma.', 'لوبات المية المنقاة والـ WFI، خطوط الـ CIP والـ SIP، نقل المنتج، فتحات التانكات، وصلات أجهزة القياس ونقط العينات في مصانع الأدوية.'],
      how: ['The gasket bead sits in the ferrule grooves and its bore is flush with the tube bore: no crevice, so it drains and cleans well. Opens in seconds for inspection and cleaning.', 'بروز الجوان بيقعد في مجاري الفيرول، وقطره الداخلي على نفس سطح الماسورة: مفيش جيوب، فبتتصفى وبتتنضف كويس. وبتتفتح في ثواني للفحص والتنضيف.'],
      fail: ['Gasket pushed into the bore (over-tightening or heat) making a dead zone, cracked or hardened EPDM after many steam cycles, leaks from wrong gasket size, clamp loose from vibration.', 'الجوان داخل جوه الماسورة (ربط زيادة أو حرارة) فيعمل منطقة ميتة، EPDM مشروخ أو ناشف بعد بخار كتير، تسريب من جوان مقاسه غلط، كلامب فكّ من الاهتزاز.'],
      pm: ['Tighten the wing nut by hand only. Replace gaskets on a fixed schedule and after any intrusion. Use certified gaskets (FDA / USP Class VI) with batch traceability, and match gasket size and material to the line.', 'اربط صامولة الفراشة بإيدك بس. غيّر الجوانات على جدول ثابت وبعد أي دخول للجوان جوه الماسورة. استخدم جوانات معتمدة (FDA / USP Class VI) ليها تتبع للتشغيلة، وخلّي المقاس والخامة مناسبين للخط.'],
    },
    cut: 'y',
    parts: [
      { id: 'ferrule_l', name: ['Ferrule (left)', 'الفيرول (شمال)'], role: ['Orbital-welded to the tube; tapered back face for the clamp, groove in the face for the gasket bead.', 'ملحوم أوربيتال على الماسورة؛ ضهره مخروطي للكلامب، ووشه فيه مجرى لبروز الجوان.'], mat: 'sst', ex: [-4, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 72, pts: ferL }] },
      { id: 'gasket', name: ['Gasket (EPDM / PTFE)', 'الجوان (EPDM / PTFE)'], role: ['Flanged gasket with a bead on each face; its bore is flush with the tube.', 'جوان ليه بروز على كل وش؛ وقطره الداخلي على نفس سطح الماسورة.'], mat: 'ptfe', ex: [0, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 3.15, ri: 2.375, h: 0.196 }, { t: 'torus', ax: 'x', R: 2.85, r: 0.078, p: [-0.1, 0, 0] }, { t: 'torus', ax: 'x', R: 2.85, r: 0.078, p: [0.1, 0, 0] }] },
      { id: 'ferrule_r', name: ['Ferrule (right)', 'الفيرول (يمين)'], role: ['Same ferrule on the other tube.', 'نفس الفيرول على الماسورة التانية.'], mat: 'sst', ex: [4, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 72, pts: mir(ferL) }] },
      { id: 'clamp_b', name: ['Clamp half with hinge pin', 'نص الكلامب بمسمار المفصلة'], role: ['Half ring with a V-groove; carries the hinge pin and the eye bolt pivot.', 'نص حلقة بمجرى V؛ شايل مسمار المفصلة ومحور المسمار أبو عين.'], mat: 'sst', o: [0, HY, 0], ex: [0, 0, -4.5],
        s: [...clampHalf(-1), { t: 'cyl', ax: 'x', r: 0.15, h: 1.3, m: 'steel' }] },
      { id: 'clamp_a', name: ['Clamp half (swing side)', 'نص الكلامب (الناحية اللي بتفتح)'], role: ['Swings open on the hinge; its ear takes the wing nut.', 'بيفتح على المفصلة؛ والودن بتاعته عليها صامولة الفراشة.'], mat: 'sst', o: [0, HY, 0], ex: [0, 0, 4.5],
        s: clampHalf(1) },
      { id: 'wingnut', name: ['Eye bolt and wing nut', 'المسمار أبو عين وصامولة الفراشة'], role: ['Closes the clamp; hand-tight is enough.', 'بيقفل الكلامب؛ الربط باليد كفاية.'], mat: 'sst', o: [0, HY, 0], ex: [0, 1.5, -4.5],
        s: [{ t: 'cyl', ax: 'z', r: 0.22, h: 2.0, p: [0, 4.35 - HY, 0.2] }, { t: 'cyl', ax: 'x', r: 0.3, h: 0.5, p: [0, 4.35 - HY, -0.95] },
          { t: 'cyl', ax: 'z', r: 0.4, h: 0.4, p: [0, 4.35 - HY, 0.95], m: 'brass' }, { t: 'box', w: 1.8, h: 0.6, d: 0.15, p: [0, 4.6 - HY, 0.95], m: 'brass' }] },
    ],
    steps: ['ferrule_l', 'gasket', 'ferrule_r', 'clamp_b', 'clamp_a', 'wingnut'],
    anim: { mode: 'toggle', label: ['Open / close clamp', 'افتح / اقفل الكلامب'], parts: { clamp_a: { rot: [1, 0, 0], a: [0, 32] }, clamp_b: { rot: [1, 0, 0], a: [0, -32] }, wingnut: { rot: [1, 0, 0], a: [0, -32] } } },
    quiz: [
      { q: ['What is the main hygienic risk of an over-tightened tri-clamp?', 'إيه أكبر خطر صحي لو الترايكلامب اتربط زيادة؟'], a: ['The gasket pushes into the bore and makes a dead zone that is hard to clean', 'الجوان يدخل جوه الماسورة ويعمل منطقة ميتة صعب تتنضف'], w: [['The clamp gets too hot', 'الكلامب يسخن'], ['The flow increases', 'التصرف يزيد'], ['Nothing, tighter is always better', 'ولا حاجة، كل ما تربط أكتر أحسن']] },
      { q: ['How should the wing nut be tightened?', 'صامولة الفراشة بتتربط إزاي؟'], a: ['By hand', 'باليد'], w: [['With a pipe wrench', 'بمفتاح مواسير'], ['With a hammer', 'بالشاكوش'], ['With an impact gun', 'بالإمباكت (مفك الصدمات)']] },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
