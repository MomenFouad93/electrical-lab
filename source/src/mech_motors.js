/* Mechanical: motors and gearboxes (TEFC induction motor, worm gearbox, inline helical gearbox) */
(function (g) {
  const EL = g.EL, M = EL.mech;
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const yz = (pts) => pts.map((q) => [r3(-q[0]), r3(-q[1])]); // ext ax 'x': real [y, z] -> outline [a, b]
  // ball bearing: centre c [x,y,z], axis 'x' or 'z'
  function brg(c, ri, ro, w, ax) {
    ax = ax || 'x';
    const t = ro - ri, R = (ri + ro) / 2, br = Math.min(0.3 * t, 0.42 * w), n = Math.max(7, Math.floor((2 * Math.PI * R) / (2.4 * br)));
    return [{ t: 'cyl', ax, r: ro, ri: r3(ro - 0.3 * t), h: w, p: c }, { t: 'cyl', ax, r: r3(ri + 0.3 * t), ri, h: w, p: c }, { t: 'balls', ax, n, R, r: r3(br), p: c, m: 'chrome' }];
  }
  function toothOff(n, rot, bc) { const da = 360 / n; let d = (((180 + da * 0.35 + rot - bc) % da) + da) % da; if (d > da / 2) d -= da; return d; }
  function meshRot(n1, rot1, bc1, n2, bc2, r1, r2) { const d = toothOff(n1, rot1, bc1), da = 360 / n2, tg = bc2 - (d * r1) / r2; return r3((((tg - 180 - da * 0.85) % da) + da) % da); }
  // helical gear look: thin spur slices turned a little each (axis X)
  function hel(o) {
    const S = 5, out = [];
    for (let k = 0; k < S; k++) out.push({ t: 'gear', ax: 'x', r: o.r, rr: o.rr, teeth: o.n, h: r3(o.h / S + 0.01), ri: o.ri, p: [r3(o.x - o.h / 2 + (o.h / S) * (k + 0.5)), 0, 0], rot: [r3(o.rot + o.tw * (k / (S - 1) - 0.5)), 0, 0], m: o.m });
    return out;
  }
  const mirX = (pts, x0) => pts.map((q) => [q[0], r3(2 * x0 - q[1])]); // mirror a lathe profile about x = x0 (also flips the winding)

  /* ---------- TEFC induction motor (IEC, foot mounted, B3) ---------- */
  const fins = [];
  for (let a = 0; a < 360; a += 15) { if (a <= 30 || a >= 330 || (a >= 150 && a <= 210)) continue; const ra = (a * Math.PI) / 180; fins.push({ t: 'box', w: 24.4, h: 1.3, d: 0.35, p: [-0.5, r3(10.25 * Math.cos(ra)), r3(10.25 * Math.sin(ra))], rot: [a, 0, 0] }); }
  const foot = (x) => ({ t: 'ext', d: 1.0, pts: [[x - 2, -9.5], [x + 2, -9.5], [x + 2, 9.5], [x - 2, 9.5]], holes: [{ c: [x, -7.6], r: 0.6 }, { c: [x, 7.6], r: 0.6 }], p: [0, -10.7, 0] });
  const shieldDE = [[1.7, 15.2], [3.9, 15.2], [4.4, 13.4], [9.6, 12.8], [9.6, 11.6], [8.6, 11.6], [8.6, 12.0], [3.1, 12.2], [3.1, 14.1], [1.7, 14.1], [1.7, 15.2]];
  const endWind = [[5.9, 0], [7.9, 0], [8.0, 1.0], [7.4, 2.0], [6.4, 2.0], [5.8, 1.0], [5.9, 0]];
  const tbx = -1; // terminal box centre (x)
  M.add({
    id: 'induction_motor', cat: 'motors',
    name: ['Induction motor (TEFC, IEC foot mounted)', 'موتور حثي (TEFC، IEC برجول)'],
    info: {
      what: ['Three-phase squirrel-cage motor, totally enclosed and fan cooled. A shaft-mounted fan under the cowl blows air over the finned frame.', 'موتور تلات فاز قفص سنجاب، مقفول تماماً ومتبرد بمروحة. مروحة على العمود تحت الطاسة بتنفخ هوا على زعانف الجسم.'],
      use: ['Drives almost everything on site: pumps, AHU fans, compressors, chillers, mixers, conveyors and packaging machines.', 'بيشغّل تقريباً كل حاجة في المصنع: طلمبات، مراوح وحدات التكييف، كمبروسرات، تشيلرات، خلاطات، سيور ومكن التغليف.'],
      how: ['Three-phase current in the stator windings makes a rotating magnetic field. It induces current in the rotor bars, which drags the rotor round a little slower than the field (slip).', 'التيار التلات فاز في ملفات الستاتور بيعمل مجال مغناطيسي دوّار. المجال بيولد تيار في أسياخ الروتور فيسحبه يلف أبطأ شوية من المجال (الانزلاق).'],
      fail: ['Hot or noisy bearings, winding burn-out from overload, single phasing or moisture, low insulation (megger), overheating from dirty fins or a blocked cowl, vibration from misalignment or soft foot.', 'رولمان سخن أو بيزن، ملفات محروقة من الأوفرلود أو فصل فاز أو رطوبة، عزل واطي (ميجر)، سخونية من زعانف وسخة أو طاسة مسدودة، رعشة من عدم استعدال أو رجل مش راكبة (سوفت فوت).'],
      pm: ['Measure current on all three phases, megger the windings, grease to the nameplate amount (not more), keep fins and cowl clean, check vibration, terminal tightness and soft foot.', 'قيس التيار على التلات فازات، اعمل ميجر للملفات، شحّم بالكمية اللي على اليافطة (مش أكتر)، نضف الزعانف والطاسة، اتأكد من الرعشة وربط الترامل والسوفت فوت.'],
    },
    cut: 'z',
    parts: [
      { id: 'frame', name: ['Finned frame with feet', 'الجسم بالزعانف والرجول'], role: ['Cast frame that holds the stator; fins carry the heat away; feet bolt to the base.', 'جسم زهر شايل الستاتور؛ الزعانف بتطلّع الحرارة؛ الرجول بتتربط في القاعدة.'], mat: 'cast', ex: [0, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 8.6, r: 9.6, h: 25, p: [-0.5, 0, 0] }, ...fins, foot(-8), foot(7),
          { t: 'box', w: 4, h: 3.6, d: 12, p: [-8, -8.6, 0] }, { t: 'box', w: 4, h: 3.6, d: 12, p: [7, -8.6, 0] },
          { t: 'torus', ax: 'z', R: 1.0, r: 0.3, p: [9.5, 10.6, 0] }] },
      { id: 'stator', name: ['Stator core and windings', 'قلب الستاتور والملفات'], role: ['Stack of thin steel laminations with copper coils in the slots; makes the rotating field.', 'رقايق صاج سيليكون رفيعة فيها ملفات نحاس في المجاري؛ بتعمل المجال الدوّار.'], mat: 'iron', ex: [0, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 5.6, r: 8.6, h: 15, p: [-0.5, 0, 0] },
          { t: 'lathe', ax: 'x', pts: endWind, p: [7, 0, 0], m: 'copper' }, { t: 'lathe', ax: 'x', pts: mirX(endWind, 0).reverse(), p: [-8, 0, 0], m: 'copper' }] },
      { id: 'shaft', name: ['Shaft', 'العمود'], role: ['Carries the rotor, bearings and fan; the drive end sticks out with a keyway.', 'شايل الروتور والرولمان والمروحة؛ طرف الإدارة طالع بره وفيه مجرى خابور.'], mat: 'steel', ex: [32, 0, 0],
        s: [{ t: 'lathe', ax: 'x', pts: [[0, -20], [1.2, -20], [1.2, -15.6], [1.5, -15.6], [1.5, -13], [1.8, -13], [1.8, 12], [1.5, 12], [1.5, 14.6], [1.4, 14.6], [1.4, 21], [0, 21]] }] },
      { id: 'rotor', name: ['Squirrel-cage rotor', 'روتور قفص السنجاب'], role: ['Laminated core with aluminium bars shorted by end rings; no brushes, no connections.', 'قلب رقايق فيه أسياخ ألومنيوم مقفولة بحلقات في الطرفين؛ من غير فحمات ولا توصيلات.'], mat: 'iron', ex: [32, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 1.8, r: 5.2, h: 15, p: [-0.5, 0, 0] }, { t: 'rollers', ax: 'x', n: 28, R: 5.2, r: 0.3, l: 15, p: [-0.5, 0, 0], m: 'alu' },
          { t: 'cyl', ax: 'x', ri: 2.6, r: 5.5, h: 0.9, p: [-8.45, 0, 0], m: 'alu' }, { t: 'cyl', ax: 'x', ri: 2.6, r: 5.5, h: 0.9, p: [7.45, 0, 0], m: 'alu' }] },
      { id: 'bearing_de', name: ['DE bearing (drive end)', 'رولمان ناحية الإدارة (DE)'], role: ['Ball bearing at the drive end; carries the belt or coupling load.', 'بلية ناحية طرف الإدارة؛ شايلة حمل السير أو الكوبلنج.'], mat: 'steel', ex: [32, 0, 0], cut: false, s: brg([13.3, 0, 0], 1.5, 3.1, 1.6) },
      { id: 'bearing_nde', name: ['NDE bearing (fan end)', 'رولمان ناحية المروحة (NDE)'], role: ['Ball bearing at the fan end; one of the two bearings locates the shaft axially, the other floats.', 'بلية ناحية المروحة؛ واحدة من البليتين بتثبّت العمود محورياً والتانية سايبة (فلوتينج).'], mat: 'steel', ex: [32, 0, 0], cut: false, s: brg([-14.3, 0, 0], 1.5, 3.1, 1.6) },
      { id: 'shield_de', name: ['DE end shield', 'الغطا الأمامي (DE)'], role: ['Cast cover that centres the rotor and holds the DE bearing.', 'غطا زهر بيوسّط الروتور وشايل رولمان الـDE.'], mat: 'cast', ex: [44, 0, 0],
        s: [{ t: 'lathe', ax: 'x', pts: shieldDE.slice().reverse() }] },
      { id: 'shield_nde', name: ['NDE end shield', 'الغطا الخلفي (NDE)'], role: ['Holds the NDE bearing; the fan sits just behind it.', 'شايل رولمان الـNDE؛ المروحة وراه على طول.'], mat: 'cast', ex: [-4, 0, 0],
        s: [{ t: 'lathe', ax: 'x', pts: mirX(shieldDE, -0.5) }] },
      { id: 'fan', name: ['Cooling fan', 'مروحة التبريد'], role: ['Straight-bladed fan on the shaft; cools in both directions of rotation.', 'مروحة ريشها مستقيم على العمود؛ بتبرد في الاتجاهين.'], mat: 'plastic', ex: [-9, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 1.2, r: 2.0, h: 1.8, p: [-17.6, 0, 0] }, { t: 'cyl', ax: 'x', ri: 1.9, r: 8.3, h: 0.3, p: [-16.85, 0, 0] }, { t: 'vanes', ax: 'x', n: 9, r1: 2, r2: 8.3, h: 1.6, curve: 0, thick: 0.3, p: [-17.8, 0, 0] }] },
      { id: 'cowl', name: ['Fan cowl', 'طاسة المروحة'], role: ['Sheet-steel guard that guides the fan air along the fins; keep its grille clean.', 'غطا صاج بيوجّه هوا المروحة على الزعانف؛ خلي الشبكة نضيفة.'], mat: 'cast', ex: [-15, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 10.0, r: 10.3, h: 8.2, p: [-17, 0, 0] }, { t: 'flange', ax: 'x', r: 10.3, ri: 1.5, h: 0.3, holes: 12, pcd: 6.8, hr: 1.4, p: [-20.95, 0, 0] }] },
      { id: 'key', name: ['Shaft key', 'خابور العمود'], role: ['Parallel key that drives the pulley or coupling hub.', 'خابور متوازي بيشغّل الطارة أو هب الكوبلنج.'], mat: 'steel', ex: [32, 2.5, 0],
        s: [{ t: 'box', w: 4.5, h: 0.5, d: 0.8, p: [17.8, 1.35, 0] }] },
      { id: 'tbox', name: ['Terminal box', 'علبة الترامل'], role: ['Box on top of the frame where the supply cable enters through a gland.', 'علبة فوق الجسم بيدخلها كابل التغذية من جلاند.'], mat: 'cast', ex: [0, 0, 0],
        s: [{ t: 'box', w: 9, h: 0.6, d: 9, p: [tbx, 9.9, 0] }, { t: 'box', w: 0.5, h: 3.8, d: 9, p: [tbx - 4.25, 11.5, 0] }, { t: 'box', w: 0.5, h: 3.8, d: 9, p: [tbx + 4.25, 11.5, 0] },
          { t: 'box', w: 9, h: 3.8, d: 0.5, p: [tbx, 11.5, -4.25] }, { t: 'box', w: 9, h: 3.8, d: 0.5, p: [tbx, 11.5, 4.25] },
          { t: 'cyl', ax: 'z', ri: 0.5, r: 0.9, h: 1.5, p: [tbx, 11.3, 5.2], m: 'black' }] },
      { id: 'terminals', name: ['Terminal board U V W', 'بورد الترامل U V W'], role: ['Six studs of the winding ends; links set star or delta, supply goes to U1 V1 W1.', 'ست مسامير لأطراف الملفات؛ الكباري بتعمل ستار أو دلتا، والتغذية على U1 V1 W1.'], mat: 'white', ex: [0, 7, 0],
        s: [{ t: 'box', w: 6.6, h: 0.8, d: 4.4, p: [tbx, 10.6, 0] }, ...[-2.2, 0, 2.2].flatMap((dx) => [-1.1, 1.1].flatMap((dz) => [{ t: 'cyl', r: 0.25, h: 1.6, p: [tbx + dx, 11.6, dz], m: 'brass' }, { t: 'hex', r: 0.45, h: 0.3, p: [tbx + dx, 11.5, dz], m: 'brass' }])),
          { t: 'box', w: 5.0, h: 0.15, d: 0.6, p: [tbx, 12.0, 1.1], m: 'copper' }] },
      { id: 'tb_lid', name: ['Terminal box lid', 'غطا علبة الترامل'], role: ['Gasketed lid; refit it with all screws to keep IP55.', 'غطا بجوان؛ ركّبه بكل مساميره عشان يفضل IP55.'], mat: 'cast', ex: [0, 12, 0],
        s: [{ t: 'box', w: 9.4, h: 0.6, d: 9.4, p: [tbx, 13.7, 0] }] },
    ],
    steps: ['frame', 'stator', 'shaft', 'rotor', 'bearing_de', 'bearing_nde', 'shield_de', 'shield_nde', 'fan', 'cowl', 'key', 'tbox', 'terminals', 'tb_lid'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft: { rot: [1, 0, 0] }, rotor: { rot: [1, 0, 0] }, bearing_de: { rot: [1, 0, 0] }, bearing_nde: { rot: [1, 0, 0] }, fan: { rot: [1, 0, 0] }, key: { rot: [1, 0, 0] } } },
    quiz: [
      { q: ['A 4-pole motor on 50 Hz runs at about…', 'موتور 4 بول على 50 هرتز بيلف حوالي…'], a: ['1450 rpm (1500 minus slip)', '1450 لفة/دقيقة (1500 ناقص الانزلاق)'], w: [['3000 rpm', '3000 لفة/دقيقة'], ['1500 rpm exactly', '1500 بالظبط'], ['750 rpm', '750 لفة/دقيقة']] },
      { q: ['The motor is hot but the current is normal. First thing to check?', 'الموتور سخن والتيار طبيعي. أول حاجة تبص عليها؟'], a: ['Cooling: dirty fins, blocked cowl grille, broken fan', 'التبريد: زعانف وسخة، شبكة الطاسة مسدودة، مروحة مكسورة'], w: [['The key', 'الخابور'], ['The terminal box lid', 'غطا علبة الترامل'], ['The feet bolts', 'مسامير الرجول']] },
      { q: ['Why must you not over-grease motor bearings?', 'ليه منزودش الشحم في رولمان الموتور؟'], a: ['Too much grease churns, heats the bearing and can get into the windings', 'الشحم الزيادة بيتخض ويسخّن الرولمان وممكن يدخل على الملفات'], w: [['Grease is expensive', 'الشحم غالي'], ['It makes the motor run faster', 'بيخلي الموتور يلف أسرع'], ['It lowers the voltage', 'بيقلل الجهد']] },
    ],
  });

  /* ---------- worm gearbox (right angle, hollow output) ---------- */
  const WY = -5; // worm axis height
  const wallX = yz([[5.2, 3.6], [5.2, -3.6], [-8, -3.6], [-8, 3.6]]);
  M.add({
    id: 'worm_gearbox', cat: 'motors',
    name: ['Worm gearbox (hollow output)', 'جيربوكس دودي (خرج مجوف)'],
    info: {
      what: ['Right-angle reducer: a steel worm on the input turns a bronze worm wheel; the wheel hub is a hollow output bore with keyway.', 'مخفض بزاوية قايمة: دودة صلب على الدخول بتلف ترس دودي برونز؛ هب الترس هو الخرج المجوف وفيه مجرى خابور.'],
      use: ['Conveyors, packaging-line drives, slow mixers and agitators, rotary tables and doors where a compact high ratio is needed.', 'السيور، إدارة خطوط التغليف، الخلاطات البطيئة، الترابيزات الدوارة والأبواب، مكان ما محتاج نسبة تخفيض عالية في حجم صغير.'],
      how: ['Each turn of a single-start worm moves the wheel one tooth, so a 30-tooth wheel gives 30:1. The teeth slide on each other, so efficiency is lower and heat higher than helical gears.', 'كل لفة لدودة بسن واحد بتحرك الترس سنة واحدة، فترس 30 سنة يدي 30:1. السنون بتنزلق على بعض فالكفاءة أقل والسخونية أعلى من التروس الحلزونية.'],
      fail: ['Bronze wear (bronze glitter in the oil), overheating, oil leaks at the seals, growing backlash, noise from dry or wrong oil.', 'البرونز بيدوب (لمعة برونز في الزيت)، سخونية، تسريب زيت من السيلات، خلوص (باكلاش) بيزيد، صوت من زيت ناقص أو غلط.'],
      pm: ['Keep the right oil type and level (many are filled with synthetic PG oil: never mix with mineral oil), check temperature and backlash, renew leaking seals. Do not rely on self-locking as a brake.', 'خلي نوع ومستوى الزيت صح (كتير منهم متعبي زيت صناعي PG: متخلطوش بزيت معدني)، تابع الحرارة والخلوص، غيّر السيلات اللي بتسرب. متعتمدش على القفل الذاتي كفرامل.'],
    },
    cut: 'z',
    parts: [
      { id: 'housing', name: ['Housing', 'الجسم (الكارتير)'], role: ['Aluminium case with the worm bearing bores along X and the output bore along Z; holds the oil.', 'جسم ألومنيوم فيه بيوت رولمان الدودة على X وبيت الخرج على Z؛ شايل الزيت.'], mat: 'alu', ex: [0, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 0.8, pts: wallX, holes: [{ c: [5, 0], r: 2.35 }], p: [-5.1, 0, 0] }, { t: 'ext', ax: 'x', d: 0.8, pts: wallX, holes: [{ c: [5, 0], r: 2.35 }], p: [5.1, 0, 0] },
          { t: 'cyl', ax: 'x', ri: 2.35, r: 3.0, h: 1.6, p: [-5.9, WY, 0] }, { t: 'cyl', ax: 'x', ri: 2.35, r: 3.0, h: 1.6, p: [5.9, WY, 0] },
          { t: 'cyl', ax: 'x', ri: 1.75, r: 3.0, h: 0.7, p: [-7.05, WY, 0] },
          { t: 'ext', ax: 'z', d: 0.8, pts: [[-4.7, -8], [4.7, -8], [4.7, 5.2], [-4.7, 5.2]], holes: [{ c: [0, 0], r: 3.1 }], p: [0, 0, -3.2] },
          { t: 'cyl', ax: 'z', ri: 3.1, r: 3.9, h: 0.5, p: [0, 0, -3.85] }, { t: 'cyl', ax: 'z', ri: 2.6, r: 3.9, h: 0.7, p: [0, 0, -4.45] },
          { t: 'box', w: 9.4, h: 0.8, d: 7.2, p: [0, 4.8, 0] }, { t: 'box', w: 9.4, h: 0.8, d: 7.2, p: [0, -7.6, 0] },
          { t: 'hex', r: 0.7, h: 0.6, p: [2.5, 5.5, 0], m: 'steel' }] },
      { id: 'worm_bearing_a', name: ['Worm bearing (far end)', 'رولمان الدودة (الطرف البعيد)'], role: ['Supports the worm and takes its thrust in one direction.', 'ساند الدودة وشايل الدفع المحوري في اتجاه.'], mat: 'steel', ex: [5, 0, 0], cut: false, s: brg([5.6, WY, 0], 1.0, 2.35, 1.4) },
      { id: 'worm', name: ['Worm (input shaft)', 'الدودة (عمود الدخول)'], role: ['Hardened steel screw on the input shaft; the motor drives it.', 'بريمة صلب مقسّى على عمود الدخول؛ الموتور بيلفها.'], mat: 'steel', o: [0, WY, 0], ex: [-22, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 1.0, h: 16.3, p: [-1.85, 0, 0] }, { t: 'cyl', ax: 'x', r: 0.85, h: 6.4 }, { t: 'spring', ax: 'x', R: 1.05, r: 0.32, turns: 5, len: 6 }] },
      { id: 'worm_bearing_b', name: ['Worm bearing (input end)', 'رولمان الدودة (ناحية الدخول)'], role: ['Second worm bearing; takes the thrust the other way.', 'رولمان الدودة التاني؛ شايل الدفع في الاتجاه التاني.'], mat: 'steel', ex: [-5, 0, 0], cut: false, s: brg([-5.6, WY, 0], 1.0, 2.35, 1.4) },
      { id: 'seal_in', name: ['Input oil seal', 'أويل سيل الدخول'], role: ['Lip seal on the input shaft.', 'سيل شفة على عمود الدخول.'], mat: 'rubber', ex: [-6, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 1.0, r: 1.75, h: 0.7, p: [-7.05, WY, 0] }] },
      { id: 'end_cap', name: ['Blind end cap', 'غطا الطرف المقفول'], role: ['Closes the far worm bore.', 'بيقفل بيت الدودة من الناحية التانية.'], mat: 'alu', ex: [9, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 3.0, h: 0.6, p: [7.0, WY, 0] }] },
      { id: 'key', name: ['Input key', 'خابور الدخول'], role: ['Locks the motor coupling to the worm shaft.', 'بيقفل الكوبلنج على عمود الدودة.'], mat: 'steel', o: [0, WY, 0], ex: [-22, 2.5, 0],
        s: [{ t: 'box', w: 2.5, h: 0.35, d: 0.5, p: [-8.5, 1.0, 0] }] },
      { id: 'wheel_bearing_a', name: ['Output bearing (housing side)', 'رولمان الخرج (ناحية الجسم)'], role: ['Carries the hollow output in the housing.', 'شايل الخرج المجوف في الجسم.'], mat: 'steel', ex: [0, 0, -5], s: brg([0, 0, -3.4], 1.75, 3.1, 1.4, 'z') },
      { id: 'seal_out_a', name: ['Output oil seal (housing side)', 'أويل سيل الخرج (ناحية الجسم)'], role: ['Seals the hollow output on the housing side.', 'بيقفل الخرج المجوف من ناحية الجسم.'], mat: 'rubber', ex: [0, 0, -8],
        s: [{ t: 'cyl', ax: 'z', ri: 1.75, r: 2.6, h: 0.7, p: [0, 0, -4.45] }] },
      { id: 'wheel', name: ['Worm wheel with hollow hub', 'الترس الدودي بالهب المجوف'], role: ['Bronze toothed rim on a hub; the hub bore with keyway is the output that slides onto the machine shaft.', 'طوق برونز مسنن على هب؛ خرم الهب بمجرى الخابور هو الخرج اللي بيدخل على عمود الماكينة.'], mat: 'bronze', ex: [0, 0, 9],
        s: [{ t: 'gear', ax: 'z', r: 4.2, rr: 3.75, teeth: 30, h: 2.2, ri: 3.0 }, { t: 'cyl', ax: 'z', ri: 1.75, r: 3.05, h: 1.2, m: 'castg' },
          { t: 'cyl', ax: 'z', ri: 1.25, r: 1.75, h: 10.5, p: [0, 0, 0.45], m: 'steel' }, { t: 'box', w: 0.8, h: 0.25, d: 10.4, p: [0, 1.38, 0.45], m: 'black' }] },
      { id: 'wheel_bearing_b', name: ['Output bearing (cover side)', 'رولمان الخرج (ناحية الغطا)'], role: ['Second output bearing, in the cover.', 'رولمان الخرج التاني، في الغطا.'], mat: 'steel', ex: [0, 0, 14], s: brg([0, 0, 4.1], 1.75, 3.1, 1.4, 'z') },
      { id: 'cover', name: ['Side cover', 'الغطا الجانبي'], role: ['Bolted flange that closes the opening the wheel goes in through.', 'فلانشة بتتربط وبتقفل الفتحة اللي الترس بيدخل منها.'], mat: 'alu', ex: [0, 0, 18],
        s: [{ t: 'ext', ax: 'z', d: 0.8, pts: [[-5.9, -8.4], [5.9, -8.4], [5.9, 5.6], [-5.9, 5.6]], holes: [{ c: [0, 0], r: 3.1 }, { c: [-5, -7.4], r: 0.35 }, { c: [5, -7.4], r: 0.35 }, { c: [-5, 4.6], r: 0.35 }, { c: [5, 4.6], r: 0.35 }], p: [0, 0, 4.0] },
          { t: 'cyl', ax: 'z', ri: 3.1, r: 3.9, h: 0.6, p: [0, 0, 4.7] }, { t: 'cyl', ax: 'z', ri: 2.6, r: 3.9, h: 0.7, p: [0, 0, 5.35] }] },
      { id: 'seal_out_b', name: ['Output oil seal (cover side)', 'أويل سيل الخرج (ناحية الغطا)'], role: ['Seals the hollow output on the cover side.', 'بيقفل الخرج المجوف من ناحية الغطا.'], mat: 'rubber', ex: [0, 0, 22],
        s: [{ t: 'cyl', ax: 'z', ri: 1.75, r: 2.6, h: 0.7, p: [0, 0, 5.35] }] },
    ],
    steps: ['housing', 'worm_bearing_a', 'worm', 'worm_bearing_b', 'seal_in', 'end_cap', 'wheel_bearing_a', 'seal_out_a', 'wheel', 'wheel_bearing_b', 'cover', 'seal_out_b', 'key'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { worm: { rot: [1, 0, 0] }, key: { rot: [1, 0, 0] }, wheel: { rot: [0, 0, 1], speed: -0.1 } } },
    quiz: [
      { q: ['A single-start worm drives a 40-tooth wheel. The ratio is…', 'دودة بسن واحد بتلف ترس 40 سنة. النسبة…'], a: ['40:1', '40:1'], w: [['1:40 (speed up)', '1:40 (بتزوّد السرعة)'], ['4:1', '4:1'], ['20:1', '20:1']] },
      { q: ['Shiny bronze particles appear in the gearbox oil. What is wearing?', 'ظهر برادة برونز لامعة في زيت الجيربوكس. إيه اللي بيدوب؟'], a: ['The worm wheel teeth', 'سنون الترس الدودي'], w: [['The steel worm', 'الدودة الصلب'], ['The housing', 'الجسم'], ['The oil seal', 'الأويل سيل']] },
      { q: ['Can you use a worm gearbox self-locking as the safety brake of a lift?', 'ينفع تعتمد على القفل الذاتي للجيربوكس الدودي كفرامل أمان لرافعة؟'], a: ['No: vibration and wear can let it back-drive; use a real brake', 'لأ: الرعشة والتآكل ممكن يخلوه يلف بالعكس؛ استخدم فرامل حقيقية'], w: [['Yes, always', 'أيوه دايماً'], ['Yes, if the oil is new', 'أيوه لو الزيت جديد'], ['Only on 3-phase motors', 'بس مع المواتير التلات فاز']] },
    ],
  });

  /* ---------- inline helical gearbox (two stage) ---------- */
  const CY = -6; // countershaft height
  const r1 = meshRot(13, 0, 180, 36, 0, 1.6, 4.4), p2 = 0, r2 = meshRot(12, p2, 0, 28, 180, 1.8, 4.2);
  const TW1 = 12, TW2 = 10;
  const wallRect = yz([[5.6, 5.8], [5.6, -5.8], [-11.6, -5.8], [-11.6, 5.8]]);
  M.add({
    id: 'helical_gearbox', cat: 'motors',
    name: ['Inline helical gearbox (two stage)', 'جيربوكس حلزوني على خط واحد (مرحلتين)'],
    info: {
      what: ['Speed reducer with input and output on the same axis. Two pairs of helical gears in series, carried by a countershaft below.', 'مخفض سرعة الدخول والخرج على نفس المحور. جوزين تروس حلزونية ورا بعض على عمود وسيط تحت.'],
      use: ['Conveyor drives, agitators and mixers, process pumps and screw feeders; often as a geared motor with the motor bolted to the input flange.', 'إدارة السيور، الخلاطات والقلابات، الطلمبات وبريمات التغذية؛ غالباً موتور بجيربوكس والموتور مربوط في فلانشة الدخول.'],
      how: ['The input pinion turns a big gear on the countershaft (stage 1); a small pinion on the same countershaft turns the output gear (stage 2). The two ratios multiply. Helical teeth run quieter but push sideways, so the bearings also take axial load.', 'ترس الدخول الصغير بيلف ترس كبير على العمود الوسيط (المرحلة الأولى)؛ ترس صغير على نفس العمود بيلف ترس الخرج (المرحلة التانية). النسبتين بيتضربوا في بعض. السنون الحلزونية أهدى بس بتزق جنب، فالرولمان شايل حمل محوري كمان.'],
      fail: ['Pitting or broken teeth, bearing noise and heat, oil leaks at the seals or breather, overheating from wrong oil level.', 'تنقير أو كسر في السنون، رولمان بيزن ويسخن، تسريب زيت من السيلات أو فتحة التنفيس، سخونية من مستوى زيت غلط.'],
      pm: ['Change oil at the interval (sample it for metal), check level with the box stopped, keep the breather clean, check vibration and temperature, align the output coupling.', 'غيّر الزيت في ميعاده (خد عينة وشوف المعادن)، شوف المستوى والجيربوكس واقف، نضف فتحة التنفيس، تابع الرعشة والحرارة، اظبط استعدال كوبلنج الخرج.'],
    },
    cut: 'z',
    parts: [
      { id: 'housing', name: ['Housing', 'الجسم (الكارتير)'], role: ['Cast iron oil bath with the internal web, bearing seats and feet.', 'حوض زيت زهر فيه الحيطة الداخلية وبيوت الرولمان والرجول.'], mat: 'castg', ex: [0, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 1.4, pts: yz([[4.8, 5], [4.8, -5], [-10.8, -5], [-10.8, 5]]), holes: [{ c: [0, 0], r: 2.1 }, { c: [6, 0], r: 1.4 }], p: [-3.1, 0, 0] },
          { t: 'ext', ax: 'x', d: 1.4, pts: yz([[4.8, 5], [4.8, -5], [-10.8, -5], [-10.8, 5]]), holes: [{ c: [0, 0], r: 2.35 }, { c: [6, 0], r: 1.4 }], p: [-1.7, 0, 0] },
          { t: 'ext', ax: 'x', d: 1.4, pts: wallRect, holes: [{ c: [0, 0], r: 3.1 }, { c: [6, 0], r: 1.7 }], p: [6.5, 0, 0] },
          { t: 'box', w: 17.8, h: 0.8, d: 11.6, p: [-1.7, 5.2, 0] }, { t: 'box', w: 17.8, h: 0.8, d: 11.6, p: [-1.7, -11.2, 0] },
          { t: 'box', w: 17.8, h: 17.2, d: 0.8, p: [-1.7, -3, -5.4] }, { t: 'box', w: 17.8, h: 17.2, d: 0.8, p: [-1.7, -3, 5.4] },
          { t: 'box', w: 17.0, h: 1.2, d: 16, p: [-1.7, -12.2, 0] },
          { t: 'cyl', ax: 'x', ri: 2.6, r: 3.8, h: 0.7, p: [7.55, 0, 0] }, { t: 'cyl', ax: 'x', r: 2.2, h: 0.5, p: [7.45, CY, 0] },
          { t: 'cyl', r: 0.6, h: 1.0, p: [-5, 6.0, 0], m: 'steel' }, { t: 'hex', r: 0.8, h: 0.5, p: [-5, 6.7, 0], m: 'steel' }] },
      { id: 'countershaft', name: ['Countershaft with stage-2 pinion', 'العمود الوسيط بترس المرحلة التانية'], role: ['Intermediate shaft; its pinion is cut on the shaft and drives the output gear.', 'عمود وسيط؛ الترس الصغير مقطوع في العمود نفسه وبيلف ترس الخرج.'], mat: 'steel', o: [0, CY, 0], ex: [0, -16, 0], cut: false,
        s: [{ t: 'cyl', ax: 'x', r: 0.85, h: 19.2, p: [-2.4, 0, 0] }, ...hel({ r: 2.1, rr: 1.42, n: 12, h: 3.0, ri: 0, x: 1.0, rot: p2, tw: TW2 })] },
      { id: 'gear1', name: ['Stage-1 gear', 'ترس المرحلة الأولى'], role: ['Large helical gear keyed to the countershaft; driven by the input pinion.', 'ترس حلزوني كبير بخابور على العمود الوسيط؛ بيلف من ترس الدخول.'], mat: 'steel', o: [0, CY, 0], ex: [-12, -16, 0], cut: false,
        s: hel({ r: 4.65, rr: 4.09, n: 36, h: 2.4, ri: 0.85, x: -6, rot: r1, tw: (-TW1 * 1.6) / 4.4 }) },
      { id: 'brg_cs', name: ['Countershaft bearings', 'رولمان العمود الوسيط'], role: ['One bearing in the input flange, one in the output wall.', 'بلية في فلانشة الدخول وبلية في حيطة الخرج.'], mat: 'steel', o: [0, CY, 0], ex: [0, -16, 0], cut: false, s: [...brg([-11.3, 0, 0], 0.85, 1.7, 1.2), ...brg([6.5, 0, 0], 0.85, 1.7, 1.2)] },
      { id: 'output_shaft', name: ['Output shaft', 'عمود الخرج'], role: ['Coaxial with the input; the keyed end drives the machine.', 'على نفس محور الدخول؛ طرفه بالخابور بيشغّل الماكينة.'], mat: 'steel', ex: [20, 0, 0], cut: false,
        s: [{ t: 'lathe', ax: 'x', pts: [[0, -2.2], [1.25, -2.2], [1.25, -0.6], [1.9, -0.6], [1.9, 7.2], [1.75, 7.2], [1.75, 15], [0, 15]] }] },
      { id: 'output_gear', name: ['Stage-2 output gear', 'ترس الخرج (المرحلة التانية)'], role: ['Large helical gear on the output shaft.', 'ترس حلزوني كبير على عمود الخرج.'], mat: 'steel', ex: [10, 0, 0], cut: false,
        s: hel({ r: 4.5, rr: 3.82, n: 28, h: 3.0, ri: 1.9, x: 1.0, rot: r2, tw: (-TW2 * 1.8) / 4.2 }) },
      { id: 'brg_out', name: ['Output bearings', 'رولمان الخرج'], role: ['Inner bearing in the web, outer bearing in the output wall; they take the output load and gear thrust.', 'بلية جوه في الحيطة الداخلية وبلية بره في حيطة الخرج؛ شايلين حمل الخرج ودفع التروس.'], mat: 'steel', ex: [20, 0, 0], cut: false, s: [...brg([-1.6, 0, 0], 1.25, 2.35, 1.2), ...brg([6.5, 0, 0], 1.9, 3.1, 1.2)] },
      { id: 'seal_out', name: ['Output oil seal', 'أويل سيل الخرج'], role: ['Lip seal on the output shaft.', 'سيل شفة على عمود الخرج.'], mat: 'rubber', ex: [7, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 1.75, r: 2.6, h: 0.7, p: [7.55, 0, 0] }] },
      { id: 'key_out', name: ['Output key', 'خابور الخرج'], role: ['Drives the coupling or sprocket on the output shaft.', 'بيشغّل الكوبلنج أو الترس اللي على عمود الخرج.'], mat: 'steel', ex: [20, 2, 0], cut: false,
        s: [{ t: 'box', w: 5, h: 0.4, d: 0.6, p: [12, 1.85, 0] }] },
      { id: 'input_shaft', name: ['Input shaft with pinion', 'عمود الدخول بالترس الصغير'], role: ['Motor-side shaft with the stage-1 pinion cut on it.', 'عمود ناحية الموتور والترس الصغير للمرحلة الأولى مقطوع فيه.'], mat: 'steel', ex: [-24, 0, 0], cut: false,
        s: [{ t: 'cyl', ax: 'x', r: 1.0, h: 14.4, p: [-9.8, 0, 0] }, ...hel({ r: 1.85, rr: 1.29, n: 13, h: 2.4, ri: 0, x: -6, rot: 0, tw: TW1 }), { t: 'box', w: 2.5, h: 0.3, d: 0.4, p: [-15.5, 1.0, 0] }] },
      { id: 'brg_in', name: ['Input bearings', 'رولمان الدخول'], role: ['One bearing in the input flange, one in the web.', 'بلية في فلانشة الدخول وبلية في الحيطة الداخلية.'], mat: 'steel', ex: [-24, 0, 0], cut: false, s: [...brg([-11.3, 0, 0], 1.0, 2.1, 1.2), ...brg([-3.2, 0, 0], 1.0, 2.1, 1.2)] },
      { id: 'input_flange', name: ['Input flange (cover)', 'فلانشة الدخول (الغطا)'], role: ['Closes the input end, carries two bearings; the motor is bolted to it.', 'بتقفل ناحية الدخول وشايلة بليتين؛ الموتور بيتربط فيها.'], mat: 'castg', ex: [-8, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 1.4, pts: wallRect, holes: [{ c: [0, 0], r: 2.1 }, { c: [6, 0], r: 1.7 }], p: [-11.3, 0, 0] },
          { t: 'cyl', ax: 'x', ri: 2.0, r: 4.5, h: 1.0, p: [-12.5, 0, 0] }, { t: 'cyl', ax: 'x', r: 2.2, h: 0.5, p: [-12.25, CY, 0] }] },
      { id: 'seal_in', name: ['Input oil seal', 'أويل سيل الدخول'], role: ['Lip seal on the input shaft.', 'سيل شفة على عمود الدخول.'], mat: 'rubber', ex: [-10, 0, 0],
        s: [{ t: 'cyl', ax: 'x', ri: 1.0, r: 2.0, h: 0.6, p: [-12.6, 0, 0] }] },
    ],
    steps: ['housing', 'countershaft', 'gear1', 'brg_cs', 'output_shaft', 'output_gear', 'brg_out', 'seal_out', 'key_out', 'input_shaft', 'brg_in', 'input_flange', 'seal_in'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { input_shaft: { rot: [1, 0, 0] }, gear1: { rot: [1, 0, 0], speed: -0.364 }, countershaft: { rot: [1, 0, 0], speed: -0.364 }, output_gear: { rot: [1, 0, 0], speed: 0.156 }, output_shaft: { rot: [1, 0, 0], speed: 0.156 }, key_out: { rot: [1, 0, 0], speed: 0.156 } } },
    quiz: [
      { q: ['Stage 1 is 3:1 and stage 2 is 4:1. Total ratio?', 'المرحلة الأولى 3:1 والتانية 4:1. النسبة الكلية؟'], a: ['12:1', '12:1'], w: [['7:1', '7:1'], ['1.33:1', '1.33:1'], ['4:1', '4:1']] },
      { q: ['Why do helical gearboxes need bearings that take axial load?', 'ليه الجيربوكس الحلزوني محتاج رولمان يشيل حمل محوري؟'], a: ['The angled teeth push the gears sideways along the shaft', 'السنون المايلة بتزق التروس جنب على طول العمود'], w: [['Because the oil is heavy', 'عشان الزيت تقيل'], ['Because the motor vibrates', 'عشان الموتور بيترعش'], ['They do not', 'مش محتاج']] },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
