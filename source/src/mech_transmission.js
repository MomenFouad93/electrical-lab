/* Mechanical: transmission (couplings, belts, chains, keyed shaft) */
(function (g) {
  const EL = g.EL, M = EL.mech;
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const D = Math.PI / 180;
  const yz = (pts) => pts.map((q) => [r3(-q[0]), r3(-q[1])]); // ext ax 'x': real [y, z] -> outline [a, b]
  const pol = (r, b) => [r * Math.cos(b * D), r * Math.sin(b * D)]; // [y, z] at angle b (deg, from +y toward +z)
  // annulus sector [y,z] polygon centred on angle b, width w (deg)
  function sector(r1, r2, b, w) { const o = [], n = 8; for (let i = 0; i <= n; i++) o.push(pol(r2, b - w / 2 + (w * i) / n)); for (let i = n; i >= 0; i--) o.push(pol(r1, b - w / 2 + (w * i) / n)); return yz(o); }
  // same outline the renderer uses for a 'gear' shape (shape coordinates), for internal teeth holes
  function gearPoly(ro, rr, n, e) { e = e || 0; const o = []; for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2, da = (Math.PI * 2) / n; [[rr, a0 - da * e], [ro, a0 + da * (0.22 - e)], [ro, a0 + da * (0.48 + e)], [rr, a0 + da * (0.7 + e)]].forEach(([r, a]) => o.push([r3(Math.cos(a) * r), r3(Math.sin(a) * r)])); } return o; }
  const circ = (r, n) => { const o = []; for (let i = 0; i < n; i++) o.push([r3(r * Math.cos((i / n) * Math.PI * 2)), r3(r * Math.sin((i / n) * Math.PI * 2))]); return o; };
  // open belt / chain loop round two wheels with axes along X at z = zA (radius a) and z = zB (radius b); returns [[z, y]...]
  function loop(zA, a, zB, b, step) {
    const d = Math.abs(zA - zB), s = Math.sign(zA - zB), ph = Math.asin((b - a) / d), out = [];
    const at = (zc, r, th) => [zc + r * s * Math.cos(th), r * Math.sin(th)];
    const arc = (zc, r, t0, t1) => { const n = Math.max(6, Math.ceil((Math.abs(t1 - t0) * r) / step)); for (let i = 0; i < n; i++) out.push(at(zc, r, t0 + ((t1 - t0) * i) / n)); };
    const line = (p, q) => { const n = Math.max(2, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / step)); for (let i = 0; i < n; i++) out.push([p[0] + ((q[0] - p[0]) * i) / n, p[1] + ((q[1] - p[1]) * i) / n]); };
    const t = Math.PI / 2 + ph;
    arc(zA, a, t, -t); line(at(zA, a, -t), at(zB, b, -t)); arc(zB, b, -t, -(2 * Math.PI - t)); line(at(zB, b, t), at(zA, a, t));
    return out;
  }
  // resample a closed polyline into n equal steps: [{p:[z,y], t:[tz,ty]}]
  function even(pts, n) {
    const seg = [], L = [0];
    for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; seg.push([p, q]); L.push(L[i] + Math.hypot(q[0] - p[0], q[1] - p[1])); }
    const tot = L[L.length - 1], out = []; let j = 0;
    for (let k = 0; k < n; k++) {
      const u = (tot * k) / n; while (L[j + 1] < u) j++;
      const [p, q] = seg[j], f = (u - L[j]) / (L[j + 1] - L[j] || 1), len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
      out.push({ p: [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f], t: [(q[0] - p[0]) / len, (q[1] - p[1]) / len] });
    }
    return { pts: out, len: tot };
  }
  const plen = (pts) => { let s = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += Math.hypot(q[0] - p[0], q[1] - p[1]); } return s; };
  const psi = (t) => r3(Math.atan2(-t[1], t[0]) / D); // rotation about X that turns +Z onto tangent [tz, ty]
  // gear-shape rotation (ax 'x', part origin on the wheel axis) that puts a tooth gap (root) at angle b
  const gapRot = (n, b) => { const da = 360 / n; return r3((((b - 180 - da * 0.85) % da) + da) % da); };
  const angOf = (y, z) => Math.atan2(z, y) / D; // [y,z] -> angle from +y toward +z

  /* ---------- jaw coupling ---------- */
  const jaws = (b0, x) => [0, 120, 240].map((b) => ({ t: 'ext', ax: 'x', d: 1.9, pts: sector(1.8, 3.2, b0 + b, 39), p: [x, 0, 0] }));
  const hubJ = (sx) => [{ t: 'cyl', ax: 'x', ri: 1.25, r: 3.2, h: 3.6, p: [2.8 * sx, 0, 0] }, ...jaws(sx < 0 ? 0 : 60, 0.05 * sx), { t: 'box', w: 3.6, h: 0.3, d: 0.8, p: [2.8 * sx, 1.35, 0], m: 'black' }];
  const shaftJ = (sx) => [{ t: 'cyl', ax: 'x', r: 1.25, h: 12.8, p: [7.6 * sx, 0, 0] }, { t: 'box', w: 3.4, h: 0.55, d: 0.8, p: [2.9 * sx, 1.2, 0] }];
  M.add({
    id: 'jaw_coupling', cat: 'transmission',
    name: ['Jaw coupling (spider type)', 'كوبلنج فكوك (بالعنكبوت)'],
    info: {
      what: ['Flexible coupling: two metal hubs with three jaws each, and an elastomer spider between the jaws.', 'كوبلنج مرن: هبين معدن في كل واحد تلات فكوك، وعنكبوت كاوتش (سبايدر) بين الفكوك.'],
      use: ['Motor to pump, small fans, gearboxes and conveyors on the site; very common on utility pumps.', 'بين الموتور والطلمبة، المراوح الصغيرة، الجيربوكسات والسيور في المصنع؛ منتشر جداً على طلمبات المرافق.'],
      how: ['Torque passes from the jaws through the spider legs in compression. The spider soaks up shocks and allows a little misalignment; if it fails, the jaws still drive (fail-safe).', 'العزم بيعدي من الفكوك على رجول العنكبوت بالضغط. العنكبوت بيمتص الصدمات ويستحمل عدم استعدال بسيط؛ ولو باظ الفكوك بتفضل شغالة (فيل سيف).'],
      fail: ['Worn or cracked spider (rubber dust under the coupling), knocking at start, jaws worn from metal contact, hub slipping on a loose set screw.', 'عنكبوت دايب أو مشروخ (تراب كاوتش تحت الكوبلنج)، خبط في البداية، فكوك دايبة من احتكاك معدن بمعدن، هب بيفوّت من مسمار تثبيت سايب.'],
      pm: ['Inspect the spider at each PM, keep the gap between hubs as the maker says, align with a laser or dial gauge, lock set screws with thread locker, keep the guard on.', 'افحص العنكبوت في كل صيانة، خلي المسافة بين الهبين زي الكتالوج، اظبط الاستعدال بالليزر أو الساعة، ثبّت مسامير التثبيت بمانع فك (ثريد لوكر)، وخلي الجارد مركب.'],
    },
    cut: 'z',
    parts: [
      { id: 'shaft_a', name: ['Motor shaft with key', 'عمود الموتور بالخابور'], role: ['Driving shaft; the key sits half in the shaft, half in the hub.', 'العمود الدافع؛ الخابور نصه في العمود ونصه في الهب.'], mat: 'steel', ex: [-10, 0, 0], s: shaftJ(-1) },
      { id: 'hub_a', name: ['Motor-side hub', 'هب ناحية الموتور'], role: ['Bored and keyed hub with three jaws.', 'هب مخروم وبمجرى خابور وعليه تلات فكوك.'], mat: 'alu', ex: [-5, 0, 0], s: hubJ(-1) },
      { id: 'spider', name: ['Spider (elastomer insert)', 'العنكبوت (السبايدر)'], role: ['Six-leg polyurethane star between the jaws; the wear part.', 'نجمة بولي يوريثان بست رجول بين الفكوك؛ القطعة اللي بتدوب.'], mat: 'yellow', ex: [0, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 0.9, r: 1.8, h: 1.8 }, ...[30, 90, 150, 210, 270, 330].map((b) => ({ t: 'ext', ax: 'x', d: 1.8, pts: sector(1.75, 3.1, b, 20) }))] },
      { id: 'hub_b', name: ['Pump-side hub', 'هب ناحية الطلمبة'], role: ['Second hub; its jaws sit between the jaws of the first one.', 'الهب التاني؛ فكوكه بتقعد بين فكوك الأول.'], mat: 'alu', ex: [5, 0, 0], s: hubJ(1) },
      { id: 'shaft_b', name: ['Pump shaft with key', 'عمود الطلمبة بالخابور'], role: ['Driven shaft.', 'العمود المتشغّل.'], mat: 'steel', ex: [10, 0, 0], s: shaftJ(1) },
      { id: 'set_screws', name: ['Set screws', 'مسامير التثبيت (جراب سكرو)'], role: ['Socket set screws over the keys; stop the hubs sliding on the shafts.', 'مسامير ألن بدون راس فوق الخوابير؛ بتمنع الهبات تزحف على العمدان.'], mat: 'black', ex: [0, 5, 0],
        s: [-1, 1].map((sx) => ({ t: 'cyl', r: 0.3, h: 0.6, p: [3.3 * sx, 2.95, 0] })) },
    ],
    steps: ['shaft_a', 'hub_a', 'spider', 'shaft_b', 'hub_b', 'set_screws'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft_a: { rot: [1, 0, 0] }, hub_a: { rot: [1, 0, 0] }, spider: { rot: [1, 0, 0] }, hub_b: { rot: [1, 0, 0] }, shaft_b: { rot: [1, 0, 0] }, set_screws: { rot: [1, 0, 0] } } },
    quiz: [
      { q: ['Fine yellow or black rubber dust is found under a jaw coupling guard. Meaning?', 'لقيت تراب كاوتش ناعم تحت جارد كوبلنج الفكوك. معناه؟'], a: ['The spider is wearing: check alignment and replace it', 'العنكبوت بيدوب: راجع الاستعدال وغيّره'], w: [['Normal, ignore it', 'طبيعي، سيبه'], ['The motor bearing is failing', 'رولمان الموتور بايظ'], ['Too much grease', 'شحم زيادة']] },
      { q: ['Does a flexible coupling mean you can skip alignment?', 'هل الكوبلنج المرن معناه إنك تستغنى عن ضبط الاستعدال؟'], a: ['No: misalignment still loads the bearings and kills the spider', 'لأ: عدم الاستعدال بيحمّل الرولمان وبيموّت العنكبوت'], w: [['Yes, it takes any misalignment', 'أيوه، بيستحمل أي حاجة'], ['Only on big motors', 'بس في المواتير الكبيرة'], ['Only for pumps', 'بس للطلمبات']] },
    ],
  });

  /* ---------- gear coupling (double engagement, flanged) ---------- */
  const GT = 30, gIn = gearPoly(4.08, 3.55, GT, 0.04); // a little backlash round the hub teeth
  const bolt6 = [0, 1, 2, 3, 4, 5].map((i) => { const a = ((i + 0.5) / 6) * Math.PI * 2; return [r3(-6.4 * Math.cos(a)), r3(-6.4 * Math.sin(a))]; }); // [y, z] of flange holes
  const hubG = (sx) => [{ t: 'cyl', ax: 'x', ri: 1.6, r: 3.0, h: 5, p: [5.5 * sx, 0, 0] }, { t: 'gear', ax: 'x', r: 4.0, rr: 3.5, teeth: GT, h: 2.0, ri: 1.6, p: [2.0 * sx, 0, 0] }, { t: 'box', w: 7, h: 0.3, d: 0.8, p: [4.5 * sx, 1.7, 0], m: 'black' }];
  const sleeveG = (sx) => [{ t: 'ext', ax: 'x', d: 2.2, pts: circ(5.3, 64), holes: [gIn], p: [2.0 * sx, 0, 0] },
    { t: 'cyl', ax: 'x', ri: 3.15, r: 5.3, h: 3.0, p: [4.6 * sx, 0, 0] },
    { t: 'flange', ax: 'x', r: 7.5, ri: 4.05, h: 1.0, holes: 6, pcd: 6.4, hr: 0.4, p: [0.55 * sx, 0, 0] },
    { t: 'hex', r: 0.4, h: 0.4, p: [4.2 * sx, 5.4, 0], m: 'steel' }];
  M.add({
    id: 'gear_coupling', cat: 'transmission',
    name: ['Gear coupling (flanged, double engagement)', 'كوبلنج تروس (بفلانشة، تعشيق مزدوج)'],
    info: {
      what: ['All-metal flexible coupling: two hubs with crowned external teeth mesh with internal teeth in two flanged sleeves bolted together.', 'كوبلنج مرن معدن كله: هبين عليهم سنون خارجية مقوسة بتعشق في سنون داخلية في جلبتين بفلانشة متربطين في بعض.'],
      use: ['High-torque drives: large pumps, compressors, chillers, fans and heavy conveyors.', 'الإدارات اللي عزمها عالي: طلمبات كبيرة، كمبروسرات، تشيلرات، مراوح وسيور تقيلة.'],
      how: ['The crowned teeth can rock inside the sleeve teeth, so each mesh takes a small angle; two meshes together take parallel offset. It must run in grease or oil.', 'السنون المقوسة بتقدر تتمايل جوه سنون الجلبة، فكل تعشيقة بتاخد زاوية صغيرة؛ والتعشيقتين مع بعض بياخدوا الإزاحة. لازم يشتغل في شحم أو زيت.'],
      fail: ['Grease loss through worn seals leads to fast tooth wear, heat, noise and vibration; high misalignment makes the teeth lock and push the bearings.', 'الشحم لما يهرب من سيلات دايبة السنون بتدوب بسرعة وتسخن ويطلع صوت ورعشة؛ عدم الاستعدال الكبير بيخلي السنون تقفش وتزق على الرولمان.'],
      pm: ['Regrease at the interval with coupling grease, check seals and lube plugs, align within limits, check bolt torque.', 'شحّم في الميعاد بشحم الكوبلنج، اتأكد من السيلات وطبات الشحم، اظبط الاستعدال في الحدود، واتأكد من عزم المسامير.'],
    },
    cut: 'z',
    parts: [
      { id: 'hub_a', name: ['Hub A (crowned teeth)', 'الهب A (سنون مقوسة)'], role: ['Keyed to the motor shaft; external crowned teeth.', 'متركب بخابور على عمود الموتور؛ سنونه خارجية مقوسة.'], mat: 'steel', ex: [-12, 0, 0], s: hubG(-1) },
      { id: 'seal_a', name: ['Seal ring A', 'حلقة السيل A'], role: ['O-ring that keeps the grease in at sleeve end A.', 'أورينج بيمسك الشحم في طرف الجلبة A.'], mat: 'rubber', ex: [-7, 0, 0], s: [{ t: 'torus', ax: 'x', R: 3.12, r: 0.15, p: [-5.7, 0, 0] }] },
      { id: 'sleeve_a', name: ['Sleeve A (internal teeth)', 'الجلبة A (سنون داخلية)'], role: ['Flanged sleeve with internal teeth around hub A; has a grease plug.', 'جلبة بفلانشة وسنون داخلية حوالين الهب A؛ فيها طبة شحم.'], mat: 'castg', ex: [-4, 0, 0], s: sleeveG(-1) },
      { id: 'gasket', name: ['Flange gasket', 'جوان الفلانشة'], role: ['Seals the joint between the two sleeve flanges.', 'بيقفل بين فلانشتين الجلب.'], mat: 'black', ex: [0, 0, 0],
        s: [{ t: 'flange', ax: 'x', r: 7.5, ri: 4.2, h: 0.1, holes: 6, pcd: 6.4, hr: 0.4 }] },
      { id: 'sleeve_b', name: ['Sleeve B', 'الجلبة B'], role: ['Second flanged sleeve around hub B.', 'الجلبة التانية حوالين الهب B.'], mat: 'castg', ex: [4, 0, 0], s: sleeveG(1) },
      { id: 'seal_b', name: ['Seal ring B', 'حلقة السيل B'], role: ['O-ring at sleeve end B.', 'أورينج في طرف الجلبة B.'], mat: 'rubber', ex: [7, 0, 0], s: [{ t: 'torus', ax: 'x', R: 3.12, r: 0.15, p: [5.7, 0, 0] }] },
      { id: 'hub_b', name: ['Hub B', 'الهب B'], role: ['Keyed to the driven shaft.', 'متركب بخابور على العمود المتشغّل.'], mat: 'steel', ex: [12, 0, 0], s: hubG(1) },
      { id: 'bolts', name: ['Flange bolts', 'مسامير الفلانشة'], role: ['Fitted bolts and nuts that join the sleeves; tighten to torque crosswise.', 'مسامير وصواميل مظبوطة بتربط الجلب؛ اربط بالعزم بالتقاطع.'], mat: 'steel', ex: [0, 0, 0], cut: false,
        s: bolt6.flatMap(([y, z]) => [{ t: 'cyl', ax: 'x', r: 0.35, h: 3.4, p: [0, y, z] }, { t: 'hex', ax: 'x', r: 0.6, h: 0.45, p: [-1.33, y, z] }, { t: 'hex', ax: 'x', r: 0.6, h: 0.45, p: [1.33, y, z] }]) },
    ],
    steps: ['sleeve_a', 'seal_a', 'hub_a', 'sleeve_b', 'seal_b', 'hub_b', 'gasket', 'bolts'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { hub_a: { rot: [1, 0, 0] }, seal_a: { rot: [1, 0, 0] }, sleeve_a: { rot: [1, 0, 0] }, gasket: { rot: [1, 0, 0] }, sleeve_b: { rot: [1, 0, 0] }, seal_b: { rot: [1, 0, 0] }, hub_b: { rot: [1, 0, 0] }, bolts: { rot: [1, 0, 0] } } },
    quiz: [
      { q: ['Why must sleeves and seals be slid onto the shafts before the hubs are fitted?', 'ليه الجلب والسيلات لازم تدخل على العمدان قبل تركيب الهبات؟'], a: ['They cannot pass over the hub teeth afterwards', 'مش هتعدي على سنون الهب بعد كده'], w: [['To warm them up', 'عشان تسخن'], ['So the grease stays clean', 'عشان الشحم يفضل نضيف'], ['It does not matter', 'مش فارقة']] },
      { q: ['A gear coupling runs hot and noisy. First check?', 'كوبلنج التروس سخن وبيعمل صوت. أول حاجة تتأكد منها؟'], a: ['Grease level and seals, then alignment', 'الشحم والسيلات، بعدين الاستعدال'], w: [['Motor voltage', 'جهد الموتور'], ['Paint colour', 'لون الدهان'], ['Bolt length', 'طول المسامير']] },
    ],
  });

  /* ---------- V-belt drive (2 x SPA on taper-lock pulleys) ---------- */
  const ZA = 15, ZB = -15, RA = 5.2, RB = 9.7;
  const grooves = (Ro) => [[Ro, -1.75], [Ro, -1.38], [Ro - 1.4, -0.93], [Ro - 1.4, -0.57], [Ro, -0.12], [Ro, 0.12], [Ro - 1.4, 0.57], [Ro - 1.4, 0.93], [Ro, 1.38], [Ro, 1.75]];
  const pulA = [[2.4, -1.75], ...grooves(RA), [2.2, 1.75], [2.4, -1.75]];
  const pulB = [[2.9, -1.75], [4.3, -1.75], [4.3, -0.5], [RB - 2.0, -0.5], [RB - 2.0, -1.75], ...grooves(RB), [RB - 2.0, 1.75], [RB - 2.0, 0.5], [4.3, 0.5], [4.3, 1.75], [2.7, 1.75], [2.9, -1.75]];
  const bush = (ri, ro, ro2) => [{ t: 'lathe', ax: 'x', pts: [[ri, -1.75], [ro, -1.75], [ro2, 1.75], [ri, 1.75], [ri, -1.75]] },
    { t: 'cyl', ax: 'x', r: 0.3, h: 1.2, p: [1.0, (ri + ro) / 2, 0], m: 'black' }, { t: 'cyl', ax: 'x', r: 0.3, h: 1.2, p: [1.0, r3(-(ri + ro) / 4), r3(((ri + ro) / 2) * 0.866)], m: 'black' },
    { t: 'box', w: 3.5, h: 0.3, d: 0.8, p: [0, ri + 0.1, 0], m: 'black' }];
  const vPath = loop(ZA, RA - 0.65, ZB, RB - 0.65, 0.5);
  const belt = (x) => ({ t: 'tube', path: vPath.map(([z, y]) => [x, r3(y), r3(z)]), closed: true, r: 0.5, rs: 8, seg: 220 });
  const shaftV = (r, z) => [{ t: 'cyl', ax: 'x', r, h: 13.9, p: [-5.05, 0, 0] }, { t: 'box', w: 3.2, h: 0.5, d: 0.8, p: [0, r - 0.05, 0] }];
  M.add({
    id: 'v_belt_drive', cat: 'transmission',
    name: ['V-belt drive (taper-lock pulleys)', 'إدارة بسيور V (طارات تيبر لوك)'],
    info: {
      what: ['Two grooved pulleys joined by matched V-belts; each pulley is clamped to its shaft by a split taper-lock bush.', 'طارتين بمجاري متوصلين بسيور V متطابقة؛ كل طارة متزنقة على عمودها بجلبة تيبر لوك مشقوقة.'],
      use: ['AHU and extract fans, compressors, cooling tower fans and older machines where speed is changed by pulley size.', 'مراوح وحدات التكييف والشفط، الكمبروسرات، مراوح برج التبريد والمكن القديم اللي السرعة بتتغير فيه بمقاس الطارة.'],
      how: ['Tension wedges the belt sides into the groove; friction on the sides carries the power. Speed ratio = big pulley ÷ small pulley diameter.', 'الشد بيخلي جناب السير تتزنق في المجرى؛ الاحتكاك على الجناب بينقل القدرة. نسبة السرعة = قطر الطارة الكبيرة ÷ الصغيرة.'],
      fail: ['Squeal and slip from low tension, glazed or cracked belts, belt bottoming in worn grooves, belts turning over from misalignment, bearing damage from over-tension.', 'صويت وتفويت من شد قليل، سيور ملمعة أو مشققة، السير قاعد في قاع مجرى دايب، سيور بتتقلب من عدم الاستعدال، رولمان بايظ من شد زيادة.'],
      pm: ['Set tension with a tension gauge (deflection or frequency), align pulleys with a straight edge or laser, check grooves with a gauge, replace all belts of a set together, re-tension after the first hours.', 'اظبط الشد بجهاز شد (ترخيم أو تردد)، اعمل استعدال الطارات بمسطرة أو ليزر، افحص المجاري بمقياس، غيّر طقم السيور كله مع بعض، وارجع اشده بعد أول ساعات تشغيل.'],
    },
    cut: 'y',
    parts: [
      { id: 'shaft_a', name: ['Motor shaft with key', 'عمود الموتور بالخابور'], role: ['Driving shaft.', 'العمود الدافع.'], mat: 'steel', o: [0, 0, ZA], ex: [0, 0, 0], s: shaftV(1.4) },
      { id: 'bush_a', name: ['Taper-lock bush (driver)', 'جلبة تيبر لوك (الطارة الدافعة)'], role: ['Split tapered bush; two screws pull it into the pulley and grip the shaft.', 'جلبة مخروطية مشقوقة؛ مسمارين بيشدوها جوه الطارة فتقفش على العمود.'], mat: 'castg', o: [0, 0, ZA], ex: [6, 0, 0], s: bush(1.4, 2.4, 2.2) },
      { id: 'pulley_a', name: ['Driver pulley (small)', 'الطارة الدافعة (الصغيرة)'], role: ['Two-groove SPA pulley on the motor.', 'طارة SPA بمجريين على الموتور.'], mat: 'castg', o: [0, 0, ZA], ex: [12, 0, 0], s: [{ t: 'lathe', ax: 'x', pts: pulA }] },
      { id: 'shaft_b', name: ['Fan shaft with key', 'عمود المروحة بالخابور'], role: ['Driven shaft.', 'العمود المتشغّل.'], mat: 'steel', o: [0, 0, ZB], ex: [0, 0, 0], s: shaftV(1.75) },
      { id: 'bush_b', name: ['Taper-lock bush (driven)', 'جلبة تيبر لوك (الطارة المتشغلة)'], role: ['Same type of bush, bigger bore.', 'نفس نوع الجلبة بخرم أكبر.'], mat: 'castg', o: [0, 0, ZB], ex: [6, 0, 0], s: bush(1.75, 2.9, 2.7) },
      { id: 'pulley_b', name: ['Driven pulley (large)', 'الطارة المتشغلة (الكبيرة)'], role: ['Bigger pulley: lower speed, more torque.', 'طارة أكبر: سرعة أقل وعزم أكبر.'], mat: 'castg', o: [0, 0, ZB], ex: [12, 0, 0], s: [{ t: 'lathe', ax: 'x', pts: pulB }] },
      { id: 'belts', name: ['V-belts (matched set)', 'سيور V (طقم متطابق)'], role: ['Wedge belts with cord inside; always changed as a set.', 'سيور إسفينية جواها حبال شد؛ بتتغير دايماً طقم كامل.'], mat: 'rubber', ex: [18, 0, 0], s: [belt(-0.75), belt(0.75)] },
    ],
    steps: ['shaft_a', 'shaft_b', 'bush_a', 'pulley_a', 'bush_b', 'pulley_b', 'belts'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft_a: { rot: [1, 0, 0] }, bush_a: { rot: [1, 0, 0] }, pulley_a: { rot: [1, 0, 0] }, shaft_b: { rot: [1, 0, 0], speed: 0.5 }, bush_b: { rot: [1, 0, 0], speed: 0.5 }, pulley_b: { rot: [1, 0, 0], speed: 0.5 } } },
    quiz: [
      { q: ['One belt of a 3-belt set is broken. What do you replace?', 'سير واحد من طقم 3 سيور اتقطع. تغيّر إيه؟'], a: ['All three, as a matched set', 'التلاتة، طقم متطابق'], w: [['Only the broken one', 'المقطوع بس'], ['Two of them', 'اتنين منهم'], ['The pulleys', 'الطارات']] },
      { q: ['Motor pulley 100 mm, fan pulley 200 mm, motor 1450 rpm. Fan speed?', 'طارة الموتور 100 مم، طارة المروحة 200 مم، الموتور 1450 لفة. سرعة المروحة؟'], a: ['About 725 rpm', 'حوالي 725 لفة'], w: [['2900 rpm', '2900 لفة'], ['1450 rpm', '1450 لفة'], ['362 rpm', '362 لفة']] },
    ],
  });

  /* ---------- roller chain drive ---------- */
  const CP = 1.27, CA = 11, CB = -11, NA = 13, NB = 26;
  const pa = CP / (2 * Math.sin(Math.PI / NA)), pb = CP / (2 * Math.sin(Math.PI / NB));
  const chPath = loop(CA, pa, CB, pb, 0.2), NL = Math.round(plen(chPath) / CP) & ~1; // even number of pitches
  const rol = even(chPath, NL).pts;
  const rotA = gapRot(NA, angOf(rol[0].p[1], rol[0].p[0] - CA));
  let kb = 0; rol.forEach((q, k) => { if (q.p[0] < rol[kb].p[0]) kb = k; });
  const rotB = gapRot(NB, angOf(rol[kb].p[1], rol[kb].p[0] - CB));
  const chain = [], master = [];
  rol.forEach((q, k) => {
    chain.push({ t: 'cyl', ax: 'x', r: 0.4, h: 0.8, p: [0, r3(q.p[1]), r3(q.p[0])] });
    const n = rol[(k + 1) % NL], mid = [(q.p[0] + n.p[0]) / 2, (q.p[1] + n.p[1]) / 2], t = [n.p[0] - q.p[0], n.p[1] - q.p[1]], len = Math.hypot(t[0], t[1]);
    const outer = k % 2 === 1, xo = outer ? 0.62 : 0.47;
    for (const sx of [-1, 1]) {
      const pl = { t: 'box', w: 0.12, h: 0.95, d: r3(len + 0.55), p: [sx * xo, r3(mid[1]), r3(mid[0])], rot: [psi([t[0] / len, t[1] / len]), 0, 0] };
      (k === 1 ? master : chain).push(k === 1 ? Object.assign(pl, { m: 'chrome' }) : pl);
    }
    if (k === 1) master.push({ t: 'box', w: 0.1, h: 0.5, d: r3(len + 0.3), p: [0.72, r3(mid[1]), r3(mid[0])], rot: [psi([t[0] / len, t[1] / len]), 0, 0], m: 'red' });
  });
  // slack (bottom) span: straight line between the tangent points
  const tB = rol.filter((q) => q.p[1] < 0 && Math.abs(q.p[0]) < 3);
  const yLow = tB.length ? Math.min(...tB.map((q) => q.p[1])) : -4;
  const slope = r3(Math.atan2(-(pb - pa), CA - CB) / D);
  const sprocket = (n, pr, ri, rot) => [{ t: 'gear', ax: 'x', r: r3(pr + 0.35), rr: r3(pr - 0.42), teeth: n, h: 0.7, ri, rot: [rot, 0, 0] }, { t: 'cyl', ax: 'x', ri, r: r3(ri + 0.8), h: 2.0, p: [-1.35, 0, 0] }, { t: 'hex', r: 0.3, h: 0.4, p: [-1.35, r3(ri + 0.85), 0], m: 'black' }];
  M.add({
    id: 'chain_drive', cat: 'transmission',
    name: ['Roller chain drive with tensioner', 'إدارة بجنزير بكر مع شداد'],
    info: {
      what: ['Two sprockets joined by a roller chain (pins, bushes, rollers, inner and outer plates); a spring-loaded shoe takes up the slack.', 'ترسين جنزير (سبروكت) متوصلين بجنزير بكر (بنوز، جلب، بكر، بلتات جوه وبره)؛ جزمة عليها سوستة بتاخد الرخاوة.'],
      use: ['Conveyors and transfer tables, packaging machines, rotary feeders, lifting gear and slow heavy drives.', 'السيور والترابيزات الناقلة، مكن التغليف، المغذيات الدوارة، أجهزة الرفع والإدارات البطيئة التقيلة.'],
      how: ['Sprocket teeth push on the chain rollers, so there is no slip. The tight side pulls; the slack side returns and is guided by the tensioner. Ratio = teeth of driven ÷ teeth of driver.', 'سنون الترس بتزق على بكر الجنزير فمفيش تفويت. الناحية المشدودة هي اللي بتشد؛ الناحية الرخوة راجعة والشداد بيوجهها. النسبة = سنون المتشغّل ÷ سنون الدافع.'],
      fail: ['Chain elongation from pin and bush wear (it rides high and jumps teeth), hooked sprocket teeth, stiff links from dry or dirty chain, noise and whipping from wrong slack or misaligned sprockets.', 'الجنزير بيطول من تآكل البنوز والجلب (بيركب عالي ويفط من السنون)، سنون الترس بتبقى معقوفة، عقل ناشفة من قلة التزييت أو الوسخ، صوت وخبط من رخاوة غلط أو تروس مش على خط واحد.'],
      pm: ['Lubricate regularly, measure elongation over several links (replace at about 2-3 %), replace sprockets with the chain, keep about 2 % slack of the span, align sprockets with a straight edge.', 'زيّت بانتظام، قيس الطول على كذا عقلة (غيّر عند حوالي 2-3%)، غيّر التروس مع الجنزير، خلي الرخاوة حوالي 2% من المسافة، واعمل استعدال التروس بمسطرة.'],
    },
    cut: 'y',
    parts: [
      { id: 'shaft_a', name: ['Driver shaft', 'العمود الدافع'], role: ['Gearmotor output shaft.', 'عمود خرج الموتور بالجيربوكس.'], mat: 'steel', o: [0, 0, CA], ex: [0, 0, 0], s: [{ t: 'cyl', ax: 'x', r: 1.0, h: 11, p: [-4.5, 0, 0] }] },
      { id: 'sprocket_a', name: ['Driver sprocket (13 T)', 'الترس الدافع (13 سنة)'], role: ['Small sprocket; few teeth wear faster.', 'ترس صغير؛ السنون القليلة بتدوب أسرع.'], mat: 'steel', o: [0, 0, CA], ex: [4, 0, 0], s: sprocket(NA, pa, 1.0, rotA) },
      { id: 'shaft_b', name: ['Driven shaft', 'العمود المتشغّل'], role: ['Conveyor head shaft.', 'عمود راس السير.'], mat: 'steel', o: [0, 0, CB], ex: [0, 0, 0], s: [{ t: 'cyl', ax: 'x', r: 1.25, h: 11, p: [-4.5, 0, 0] }] },
      { id: 'sprocket_b', name: ['Driven sprocket (26 T)', 'الترس المتشغّل (26 سنة)'], role: ['Large sprocket: half the speed, double the torque.', 'ترس كبير: نص السرعة وضعف العزم.'], mat: 'steel', o: [0, 0, CB], ex: [4, 0, 0], s: sprocket(NB, pb, 1.25, rotB) },
      { id: 'chain', name: ['Roller chain', 'جنزير البكر'], role: ['Rollers on pins between inner and outer link plates; pitch 12.7 mm.', 'بكر على بنوز بين بلتات العقل الجوانية والبرانية؛ الخطوة 12.7 مم.'], mat: 'steel', ex: [9, 0, 0], s: chain },
      { id: 'master_link', name: ['Connecting link with spring clip', 'عقلة التوصيل بالكلبس'], role: ['Removable outer link that closes the chain; the clip opening faces away from the travel direction.', 'عقلة برانية بتتفك وبتقفل الجنزير؛ فتحة الكلبس عكس اتجاه الحركة.'], mat: 'chrome', ex: [14, 4, 0], s: master },
      { id: 'tensioner', name: ['Chain tensioner', 'شداد الجنزير'], role: ['Spring-loaded arm with a plastic shoe pressing on the slack span.', 'دراع عليه سوستة وجزمة بلاستيك بتضغط على الناحية الرخوة.'], mat: 'steel', ex: [0, -8, 0],
        s: [{ t: 'box', w: 1.4, h: 0.6, d: 7, p: [0, r3(yLow - 0.75), 0], rot: [slope, 0, 0], m: 'green' },
          { t: 'box', w: 0.5, h: 0.4, d: 6, p: [-0.95, r3(yLow - 1.4), 2.5], rot: [slope, 0, 0] },
          { t: 'cyl', ax: 'x', r: 0.45, h: 1.4, p: [-0.95, r3(yLow - 1.6), 5.4] },
          { t: 'spring', R: 0.35, r: 0.07, turns: 7, len: 2.6, p: [-0.95, r3(yLow - 2.9), -0.6] },
          { t: 'box', w: 0.5, h: 0.4, d: 2, p: [-0.95, r3(yLow - 4.4), -0.6] }] },
    ],
    steps: ['shaft_a', 'shaft_b', 'sprocket_a', 'sprocket_b', 'chain', 'master_link', 'tensioner'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft_a: { rot: [1, 0, 0] }, sprocket_a: { rot: [1, 0, 0] }, shaft_b: { rot: [1, 0, 0], speed: 0.5 }, sprocket_b: { rot: [1, 0, 0], speed: 0.5 } } },
    quiz: [
      { q: ['When do you replace a roller chain?', 'امتى تغيّر جنزير البكر؟'], a: ['When elongation reaches about 2-3 %, and the sprockets with it', 'لما يطول حوالي 2-3%، وتغيّر التروس معاه'], w: [['Only when it breaks', 'لما يتقطع بس'], ['Every month', 'كل شهر'], ['When it gets dirty', 'لما يتوسخ']] },
      { q: ['Which way should the spring clip of a connecting link face?', 'فتحة كلبس عقلة التوصيل تبقى في أنهي اتجاه؟'], a: ['Open end trailing, away from the direction of travel', 'الفتحة لورا، عكس اتجاه الحركة'], w: [['Open end leading', 'الفتحة لقدام'], ['Toward the sprocket', 'ناحية الترس'], ['It does not matter', 'مش فارقة']] },
    ],
  });

  /* ---------- timing (synchronous) belt drive ---------- */
  const TP = 0.8, TA = 10, TB = -10, MA = 22, MB = 44;
  const ta = (TP * MA) / (2 * Math.PI), tb = (TP * MB) / (2 * Math.PI);
  const tPath = loop(TA, ta, TB, tb, 0.15), NT = Math.round(plen(tPath) / TP);
  const tq = even(tPath, NT).pts, belt8 = [];
  tq.forEach((q) => {
    const n = [q.t[1], -q.t[0]], ps = psi(q.t); // inward normal [z, y]
    belt8.push({ t: 'box', w: 2.0, h: 0.22, d: r3(TP + 0.04), p: [0, r3(q.p[1] - n[1] * 0.04), r3(q.p[0] - n[0] * 0.04)], rot: [ps, 0, 0] });
    belt8.push({ t: 'box', w: 2.0, h: 0.34, d: 0.42, p: [0, r3(q.p[1] + n[1] * 0.24), r3(q.p[0] + n[0] * 0.24)], rot: [ps, 0, 0] });
  });
  const rotTA = gapRot(MA, angOf(tq[0].p[1], tq[0].p[0] - TA));
  let kt = 0; tq.forEach((q, k) => { if (q.p[0] < tq[kt].p[0]) kt = k; });
  const rotTB = gapRot(MB, angOf(tq[kt].p[1], tq[kt].p[0] - TB));
  const lowT = tq.filter((q) => q.p[1] < 0 && Math.abs(q.p[0]) < 1.5);
  const yT = lowT.length ? Math.min(...lowT.map((q) => q.p[1])) : -4;
  M.add({
    id: 'timing_belt_drive', cat: 'transmission',
    name: ['Timing belt drive (HTD 8M)', 'إدارة بسير مسنن (تايمنج HTD 8M)'],
    info: {
      what: ['Toothed belt on toothed pulleys: a positive drive with no slip, so both shafts stay in step.', 'سير مسنن على طارات مسننة: إدارة موجبة من غير تفويت، فالعمودين بيفضلوا ماشيين مع بعض بالظبط.'],
      use: ['Packaging machines (cartoners, blister and labelling machines), servo axes, indexing and conveyor drives that must stay timed.', 'مكن التغليف (الكرتونة، البليستر، اللابلنج)، محاور السيرفو، الإدارات بالخطوة والسيور اللي لازم تفضل متزامنة.'],
      how: ['Belt teeth sit in the pulley grooves; glass or aramid cords carry the load and do not stretch. A flanged pulley keeps the belt on; an idler on the slack side sets tension.', 'سنون السير بتقعد في مجاري الطارة؛ حبال فايبر جلاس أو أراميد شايلة الحمل ومبتمطش. الطارة اللي بحروف بتمسك السير؛ والبكرة الشدادة على الناحية الرخوة بتظبط الشد.'],
      fail: ['Sheared teeth from shock or low tension (tooth jump), worn belt edges from misalignment, cracks on the back, noise from over-tension, worn pulley grooves.', 'سنون مقصوصة من صدمة أو شد قليل (نط سنة)، حروف السير دايبة من عدم الاستعدال، شروخ في ضهر السير، صوت من شد زيادة، مجاري الطارة دايبة.'],
      pm: ['Set tension with a frequency meter, align pulleys, never crimp or lever a belt on, check teeth and edges, replace worn pulleys with the belt.', 'اظبط الشد بجهاز قياس التردد، اعمل استعدال للطارات، متثنيش السير ولا تركبه بالعتلة، افحص السنون والحروف، غيّر الطارات الدايبة مع السير.'],
    },
    cut: 'y',
    parts: [
      { id: 'shaft_a', name: ['Servo motor shaft', 'عمود موتور السيرفو'], role: ['Driving shaft.', 'العمود الدافع.'], mat: 'steel', o: [0, 0, TA], ex: [0, 0, 0], s: [{ t: 'cyl', ax: 'x', r: 0.95, h: 10.5, p: [-3.75, 0, 0] }] },
      { id: 'pulley_a', name: ['Driver pulley (22 T, flanged)', 'الطارة الدافعة (22 سنة، بحروف)'], role: ['Small toothed pulley with flanges that keep the belt on.', 'طارة مسننة صغيرة بحروف بتمسك السير.'], mat: 'alu', o: [0, 0, TA], ex: [5, 0, 0],
        s: [{ t: 'gear', ax: 'x', r: r3(ta - 0.07), rr: r3(ta - 0.41), teeth: MA, h: 2.8, ri: 0.95, rot: [rotTA, 0, 0] }, { t: 'flange', ax: 'x', r: r3(ta + 0.5), ri: 0.95, h: 0.15, p: [-1.475, 0, 0] }, { t: 'flange', ax: 'x', r: r3(ta + 0.5), ri: 0.95, h: 0.15, p: [1.475, 0, 0] },
          { t: 'cyl', ax: 'x', ri: 0.95, r: 1.7, h: 1.6, p: [-2.35, 0, 0] }, { t: 'hex', r: 0.3, h: 0.4, p: [-2.35, 1.75, 0], m: 'black' }] },
      { id: 'shaft_b', name: ['Driven shaft', 'العمود المتشغّل'], role: ['Machine axis driven in step with the motor.', 'محور الماكينة اللي ماشي متزامن مع الموتور.'], mat: 'steel', o: [0, 0, TB], ex: [0, 0, 0], s: [{ t: 'cyl', ax: 'x', r: 1.25, h: 10.5, p: [-3.75, 0, 0] }] },
      { id: 'pulley_b', name: ['Driven pulley (44 T)', 'الطارة المتشغلة (44 سنة)'], role: ['Large toothed pulley: 2:1 reduction.', 'طارة مسننة كبيرة: تخفيض 2:1.'], mat: 'alu', o: [0, 0, TB], ex: [5, 0, 0],
        s: [{ t: 'gear', ax: 'x', r: r3(tb - 0.07), rr: r3(tb - 0.41), teeth: MB, h: 2.8, ri: 1.25, rot: [rotTB, 0, 0] }, { t: 'cyl', ax: 'x', ri: 1.25, r: 2.2, h: 1.6, p: [-2.2, 0, 0] }] },
      { id: 'belt', name: ['Timing belt', 'السير المسنن'], role: ['Neoprene or polyurethane belt with curved teeth and tension cords.', 'سير نيوبرين أو بولي يوريثان بسنون مقوسة وحبال شد.'], mat: 'black', ex: [10, 0, 0], s: belt8 },
      { id: 'idler', name: ['Tension idler', 'بكرة الشد'], role: ['Plain roller on the back of the slack span; its bracket slides in a slot to set tension.', 'بكرة ملسا على ضهر الناحية الرخوة؛ الحامل بتاعها بيتحرك في مجرى عشان يظبط الشد.'], mat: 'steel', ex: [0, -7, 0],
        s: [{ t: 'cyl', ax: 'x', r: 1.3, h: 2.4, p: [0, r3(yT - 1.47), 0] }, { t: 'cyl', ax: 'x', r: 0.35, h: 3.6, p: [-0.6, r3(yT - 1.47), 0] },
          { t: 'ext', ax: 'x', d: 0.4, pts: yz([[yT - 1.0, -1.2], [yT - 1.0, 1.2], [yT - 6, 1.2], [yT - 6, -1.2]]), holes: [yz([[yT - 3.2, -0.3], [yT - 3.2, 0.3], [yT - 5.2, 0.3], [yT - 5.2, -0.3]])], p: [-2.2, 0, 0], m: 'castg' },
          { t: 'hex', ax: 'x', r: 0.55, h: 0.4, p: [-2.6, r3(yT - 4.2), 0] }] },
    ],
    steps: ['shaft_a', 'shaft_b', 'pulley_a', 'pulley_b', 'belt', 'idler'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft_a: { rot: [1, 0, 0] }, pulley_a: { rot: [1, 0, 0] }, shaft_b: { rot: [1, 0, 0], speed: 0.5 }, pulley_b: { rot: [1, 0, 0], speed: 0.5 } } },
    quiz: [
      { q: ['Why is a timing belt used instead of a V-belt on a cartoner axis?', 'ليه بنستخدم سير مسنن بدل سير V على محور ماكينة الكرتونة؟'], a: ['It cannot slip, so the axes stay in step', 'مبيفوّتش، فالمحاور بتفضل متزامنة'], w: [['It is cheaper', 'أرخص'], ['It needs no tension', 'مش محتاج شد'], ['It runs hotter', 'بيسخن أكتر']] },
      { q: ['How should a new timing belt be fitted?', 'إزاي تركّب سير مسنن جديد؟'], a: ['Slacken the idler or centre distance, never lever it over a flange', 'ارخي بكرة الشد أو المسافة، ومتركبهوش بالعتلة على الحرف أبداً'], w: [['Lever it over the flange', 'اركبه بالعتلة على الحرف'], ['Heat it first', 'سخنه الأول'], ['Fold it in half to fit', 'اطبقه نصين عشان يدخل']] },
    ],
  });

  /* ---------- keyed shaft with hub, circlip and collar ---------- */
  const b1 = Math.asin(0.4 / 1.5) / D, kw = [];
  for (let i = 0; i <= 36; i++) kw.push(pol(1.5, b1 + ((360 - 2 * b1) * i) / 36));
  kw.push([1.1, -0.4], [1.1, 0.4]);
  const hubBore = []; const b2 = Math.asin(0.4 / 1.52) / D;
  for (let i = 0; i <= 36; i++) hubBore.push(pol(1.52, b2 + ((360 - 2 * b2) * i) / 36));
  hubBore.push([1.85, -0.4], [1.85, 0.4]);
  const clip = [];
  for (let b = 20; b <= 35; b += 5) clip.push(pol(2.35, b));
  for (let b = 35; b <= 325; b += 10) clip.push(pol(1.85, b));
  for (let b = 325; b <= 340; b += 5) clip.push(pol(2.35, b));
  for (let b = 340; b >= 20; b -= 10) clip.push(pol(1.38, b));
  const ear = (b) => { const q = pol(2.05, b); return { c: [r3(-q[0]), r3(-q[1])], r: 0.13 }; };
  M.add({
    id: 'keyed_shaft', cat: 'transmission',
    name: ['Keyed shaft (key, circlip, collar)', 'عمود بخابور (خابور، كلبس، طوق)'],
    info: {
      what: ['A shaft joined to a hub (gear, pulley, coupling) by a parallel key; a circlip and a shaft collar fix the hub along the shaft.', 'عمود متوصل بهب (ترس، طارة، كوبلنج) بخابور متوازي؛ الكلبس وطوق العمود بيثبتوا الهب على طول العمود.'],
      use: ['Every motor, gearbox, pump and conveyor shaft on the site carries keyed hubs.', 'كل عمود موتور وجيربوكس وطلمبة وسير في المصنع عليه هبات بخوابير.'],
      how: ['The key sits half in the shaft keyway and half in the hub keyway and carries the torque in shear. The key does not hold the hub axially: the circlip and collar do.', 'الخابور قاعد نصه في مجرى العمود ونصه في مجرى الهب وبيشيل العزم بالقص. الخابور مش بيمسك الهب محورياً: الكلبس والطوق هم اللي بيمسكوه.'],
      fail: ['Loose key: fretting (red-brown rust powder), widened keyways and backlash, a sheared key after a jam, hub walking along the shaft when the circlip is missing or the collar screw is loose.', 'خابور سايب: صدا أحمر ناعم من الاحتكاك، مجاري بتوسع وخلوص، خابور مقصوص بعد زرجنة، الهب بيمشي على العمود لو الكلبس ناقص أو مسمار الطوق سايب.'],
      pm: ['Fit the key to the keyway width (tap fit, not hammered), check no rocking, use the correct circlip pliers and seat the clip fully in its groove, tighten the collar screw onto a flat.', 'ظبط الخابور على عرض المجرى (يدخل بالخبط الخفيف مش بالشاكوش)، اتأكد إنه مش بيتهز، استخدم زرادية الكلبس الصح وخلي الكلبس قاعد في مجراه كويس، واربط مسمار الطوق على مكان ممسوح.'],
    },
    cut: 'z',
    parts: [
      { id: 'shaft', name: ['Shaft with keyway and groove', 'العمود بمجرى الخابور ومجرى الكلبس'], role: ['Milled keyway for the key and a turned groove for the circlip.', 'مجرى خابور متفرز ومجرى مخروط للكلبس.'], mat: 'steel', ex: [0, 0, 0],
        s: [{ t: 'lathe', ax: 'x', pts: [[0, -12], [1.3, -12], [1.5, -11.8], [1.5, -6.35], [0, -6.35]] },
          { t: 'ext', ax: 'x', d: 4.2, pts: yz(kw), p: [-4.25, 0, 0] },
          { t: 'lathe', ax: 'x', pts: [[0, -2.15], [1.5, -2.15], [1.5, -1.85], [1.35, -1.85], [1.35, -1.55], [1.5, -1.55], [1.5, 5.8], [1.3, 6], [0, 6]] }] },
      { id: 'collar', name: ['Shaft collar', 'طوق العمود'], role: ['Ring with a set screw; a fixed stop on one side of the hub.', 'حلقة بمسمار تثبيت؛ مصد ثابت على ناحية من الهب.'], mat: 'steel', ex: [-7, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 1.52, r: 2.6, h: 1.4, p: [-7.25, 0, 0] }] },
      { id: 'set_screw', name: ['Collar set screw', 'مسمار تثبيت الطوق'], role: ['Socket set screw that clamps the collar to the shaft.', 'مسمار ألن بدون راس بيزنق الطوق على العمود.'], mat: 'black', ex: [-7, 3, 0], cut: false,
        s: [{ t: 'cyl', r: 0.3, h: 1.0, p: [-7.25, 2.1, 0] }] },
      { id: 'key', name: ['Parallel key', 'خابور متوازي'], role: ['Square steel key that transmits the torque.', 'خابور صلب مربع بينقل العزم.'], mat: 'steel', ex: [0, 4, 0], cut: false,
        s: [{ t: 'box', w: 4.0, h: 0.7, d: 0.78, p: [-4.15, 1.45, 0] }] },
      { id: 'hub', name: ['Gear hub with keyway', 'ترس بهب ومجرى خابور'], role: ['Hub bored to the shaft with a matching keyway.', 'هب مخروم على مقاس العمود وفيه مجرى خابور قصاد مجرى العمود.'], mat: 'castg', ex: [14, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 4.6, pts: yz(circ(2.6, 48).map((q) => [q[1], q[0]])), holes: [yz(hubBore)], p: [-4.15, 0, 0] },
          { t: 'gear', ax: 'x', r: 3.8, rr: 3.3, teeth: 26, h: 1.4, ri: 2.5, p: [-3.0, 0, 0], m: 'steel' }] },
      { id: 'circlip', name: ['External circlip', 'كلبس خارجي'], role: ['Spring-steel ring in the shaft groove; stops the hub sliding off.', 'حلقة صلب سوستة في مجرى العمود؛ بتمنع الهب يطلع.'], mat: 'black', ex: [18, 0, 0], cut: false,
        s: [{ t: 'ext', ax: 'x', d: 0.15, pts: yz(clip), holes: [ear(27.5), ear(332.5)], p: [-1.7, 0, 0] }] },
    ],
    steps: ['shaft', 'collar', 'set_screw', 'key', 'hub', 'circlip'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft: { rot: [1, 0, 0] }, collar: { rot: [1, 0, 0] }, set_screw: { rot: [1, 0, 0] }, key: { rot: [1, 0, 0] }, hub: { rot: [1, 0, 0] }, circlip: { rot: [1, 0, 0] } } },
    quiz: [
      { q: ['Which part carries the torque from shaft to hub?', 'أنهي جزء بينقل العزم من العمود للهب؟'], a: ['The key', 'الخابور'], w: [['The circlip', 'الكلبس'], ['The collar', 'الطوق'], ['The set screw', 'مسمار التثبيت']] },
      { q: ['Red-brown powder at a hub on a shaft means…', 'بودرة حمرا بنية عند هب على عمود معناها…'], a: ['Fretting: the fit or key is loose and parts are rubbing', 'احتكاك (فريتنج): التركيب أو الخابور سايب والأجزاء بتحك'], w: [['Paint is peeling', 'الدهان بيقشّر'], ['Normal grease colour', 'لون شحم عادي'], ['The shaft is overheating from current', 'العمود سخن من الكهربا']] },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
