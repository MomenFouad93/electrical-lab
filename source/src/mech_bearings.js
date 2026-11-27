/* Mechanical: bearings (axis X, centred at the origin) */
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
  // lathe profile helpers: points are [radius, x] (lathe with ax:'x' turns y into +x)
  const arc = (rc, rr, sgn, xa, xb, n) => { const o = []; n = n || 10; for (let i = 0; i <= n; i++) { const x = xa + (xb - xa) * i / n; o.push([rc + sgn * Math.sqrt(Math.max(0, rr * rr - x * x)), x]); } return o; };
  const shx = (pts, dx) => pts.map(([r, x]) => [r, x + dx]);
  const mir = (pts) => pts.map(([r, x]) => [r, -x]).reverse();
  const SP = (sp) => ({ rot: [1, 0, 0], speed: sp });
  const helix = (R, x0, x1, turns) => { const o = [], N = Math.round(turns * 28); for (let i = 0; i <= N; i++) { const t = i / N, a = t * turns * Math.PI * 2; o.push([x0 + (x1 - x0) * t, R * Math.cos(a), R * Math.sin(a)]); } return o; };
  const rad = (R, a, x) => [x, R * Math.cos(a * Math.PI / 180), R * Math.sin(a * Math.PI / 180)]; // point at radius R, angle a from +Y toward +Z

  /* ---------- deep groove ball bearing 6205-2RS (25 x 52 x 15) ---------- */
  const dgOuter = [[2.32, -0.75], [2.55, -0.75], [2.6, -0.7], [2.6, 0.7], [2.55, 0.75], [2.32, 0.75], [2.32, 0.6], [2.2, 0.6], [2.2, 0.311], ...arc(1.925, 0.415, 1, 0.311, -0.311), [2.2, -0.311], [2.2, -0.6], [2.32, -0.6], [2.32, -0.75]];
  const dgInner = [[1.3, -0.75], [1.6, -0.75], [1.65, -0.7], [1.65, -0.311], ...arc(1.925, 0.415, -1, -0.311, 0.311), [1.65, 0.7], [1.6, 0.75], [1.3, 0.75], [1.25, 0.7], [1.25, -0.7], [1.3, -0.75]];
  add({
    id: 'deep_groove_bearing', cat: 'bearings',
    name: ['Deep groove ball bearing (6205-2RS)', 'رولمان بلي مجرى عميق (6205-2RS)'],
    info: {
      what: ['The most common rolling bearing: one row of balls running in deep grooves of the inner and outer rings. Takes radial load and some axial load in both directions.', 'أشهر رولمان بلي: صف بلي واحد ماشي في مجاري عميقة في الحلقة الداخلية والخارجية. بيشيل حمل قطري وشوية حمل محوري في الاتجاهين.'],
      use: ['Electric motors, AHU fans, pump motors, conveyor rollers and small gearboxes on packaging lines. 6205 and 6305 sizes are everywhere on site.', 'المواتير، مراوح الـ AHU، مواتير الطلمبات، رولات السيور والجيربوكسات الصغيرة في خطوط التعبئة. مقاسات 6205 و6305 موجودة في كل حتة في المصنع.'],
      how: ['The inner ring turns with the shaft, the balls roll between the two raceways and the cage keeps them evenly spaced. 2RS = rubber seal both sides, 2Z = metal shields, C3 = more internal clearance.', 'الحلقة الداخلية بتلف مع العمود، البلي بيدحرج بين المجريين والقفص بيوزّع البلي بمسافات متساوية. 2RS يعني سيل كاوتش من الناحيتين، 2Z غطا حديد، C3 خلوص داخلي أكبر.'],
      fail: ['Growling noise, heat, rising vibration, grease leaking out, rust or dents from hammering, washboard marks (fluting) from VFD current, blue raceways from overheating.', 'صوت خشن (زنّة)، سخونية، اهتزاز بيزيد، شحم بيخرج، صدا أو علامات من الخبط بالشاكوش، تمويج في المجرى من تيار الإنفرتر، لون أزرق من السخونية.'],
      pm: ['Trend vibration and temperature. Sealed bearings are greased for life. Press only on the ring you are fitting, never through the balls. Heat with an induction heater to max 110 °C, never with a torch.', 'تابع الاهتزاز والحرارة. البلي المقفول متشحم مدى الحياة. اضغط على الحلقة اللي بتركّبها بس ومتضغطش عن طريق البلي. سخّن بسخان حثي لحد 110 درجة بالكتير ومتسخنش بالشعلة.'],
    },
    cut: 'z',
    parts: [
      { id: 'outer', name: ['Outer ring', 'الحلقة الخارجية'], role: ['Sits in the housing; its groove is the outer raceway. Recesses at the ends hold the seals.', 'بتقعد في الهاوزنج؛ المجرى اللي فيها هو مسار البلي البراني. والتجويف اللي على الأطراف ماسك السيلات.'], mat: 'steel', ex: [-2.4, 0, 0],
        s: [{ t: 'lathe', ax: 'x', pts: dgOuter, seg: 64 }] },
      { id: 'inner', name: ['Inner ring', 'الحلقة الداخلية'], role: ['Fits on the shaft and turns with it. Its groove is the inner raceway.', 'بتتركب على العمود وبتلف معاه. المجرى اللي عليها هو مسار البلي الجواني.'], mat: 'steel', ex: [3, 0, 0],
        s: [{ t: 'lathe', ax: 'x', pts: dgInner, seg: 64 }, { t: 'box', w: 0.02, h: 0.22, d: 0.12, p: [0.76, 1.45, 0], m: 'black' }] },
      { id: 'balls', name: ['Balls', 'البلي'], role: ['9 hardened steel balls carry the load by rolling between the raceways.', '9 بليات صلب مقسّى بيشيلوا الحمل وهما بيدحرجوا بين المجاري.'], mat: 'chrome', ex: [0, 0, 0],
        s: [{ t: 'balls', ax: 'x', n: 9, R: 1.925, r: 0.4 }] },
      { id: 'cage', name: ['Cage (pressed steel)', 'القفص (صاج مكبوس)'], role: ['Two riveted halves keep the balls apart so they do not rub on each other.', 'نصين متبرشمين بيفصلوا البلي عن بعض عشان ميحتكوش في بعض.'], mat: 'brass', ex: [1.2, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.1, ri: 1.75, h: 0.08, p: [-0.42, 0, 0] }, { t: 'cyl', ax: 'x', r: 2.1, ri: 1.75, h: 0.08, p: [0.42, 0, 0] },
          { t: 'rollers', ax: 'x', n: 9, R: 1.925, r: 0.06, l: 0.92, a0: 20 }] },
      { id: 'seal1', name: ['Seal (RS, side 1)', 'السيل (RS، الناحية الأولى)'], role: ['Rubber seal with a steel insert: keeps grease in and dust and wash water out.', 'سيل كاوتش جواه شريحة حديد: بيحافظ على الشحم جوه ويمنع التراب ومية الغسيل.'], mat: 'rubber', ex: [-4.2, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.31, ri: 1.66, h: 0.08, p: [-0.66, 0, 0] }] },
      { id: 'seal2', name: ['Seal (RS, side 2)', 'السيل (RS، الناحية التانية)'], role: ['Second seal; its lip touches the inner ring shoulder.', 'السيل التاني؛ الشفة بتاعته لامسة كتف الحلقة الداخلية.'], mat: 'rubber', ex: [4.5, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.31, ri: 1.66, h: 0.08, p: [0.66, 0, 0] }] },
    ],
    steps: ['outer', 'inner', 'balls', 'cage', 'seal1', 'seal2'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { inner: SP(1), balls: SP(0.4), cage: SP(0.4) } },
    quiz: [
      { q: ['What does the suffix 2RS mean?', 'يعني إيه 2RS في رقم البلية؟'], a: ['Rubber seals on both sides', 'سيل كاوتش من الناحيتين'], w: [['Two rows of balls', 'صفين بلي'], ['Extra internal clearance', 'خلوص داخلي زيادة'], ['Stainless steel rings', 'حلقات ستانلس']] },
      { q: ['Fitting the bearing on a shaft, you press on…', 'وانت بتركّب البلية على العمود، تضغط على…'], a: ['The inner ring', 'الحلقة الداخلية'], w: [['The outer ring', 'الحلقة الخارجية'], ['The seal', 'السيل'], ['Any face, it does not matter', 'أي وش، مش فارقة']] },
      { q: ['Blue-coloured raceways on a removed bearing point to…', 'لو لقيت المجرى لونه أزرق في بلية مفكوكة يبقى السبب…'], a: ['Overheating (lack of grease or too tight a fit)', 'سخونية زيادة (شحم ناقص أو تركيب زنق زيادة)'], w: [['Water in the grease', 'مية في الشحم'], ['Normal wear', 'تآكل عادي'], ['Wrong cage material', 'خامة القفص غلط']] },
    ],
  });

  /* ---------- cylindrical roller bearing NJ 206 + HJ 206 (30 x 62 x 16) ---------- */
  add({
    id: 'cyl_roller_bearing', cat: 'bearings',
    name: ['Cylindrical roller bearing (NJ 206 + HJ angle ring)', 'رولمان بلي أسطواني رولر (NJ 206 + حلقة HJ)'],
    info: {
      what: ['Rollers in line contact with the raceways carry heavy radial loads. NJ type: two ribs on the outer ring and one on the inner ring; with an HJ angle ring it locates the shaft in both directions.', 'رولات أسطوانية لامسة المجرى على خط كامل فبتشيل أحمال قطرية تقيلة. نوع NJ: كتفين في الحلقة الخارجية وكتف واحد في الداخلية؛ ومع حلقة HJ بتثبّت العمود في الاتجاهين.'],
      use: ['Drive end of large motors with belt or gear load, gearboxes, compressors, big fans. NU type (no inner ribs) is the non-locating bearing that lets the shaft grow with heat.', 'ناحية الطارة في المواتير الكبيرة اللي عليها سيور أو تروس، الجيربوكسات، الكومبريسورات، المراوح الكبيرة. نوع NU (من غير أكتاف داخلية) هو البلية السايبة اللي بتسيب العمود يتمدد بالحرارة.'],
      how: ['The rings separate: outer ring, rollers and cage are one unit, the inner ring is loose. So each ring can be fitted on its own and the inner ring can be heated and shrunk onto the shaft.', 'الحلقات بتتفك عن بعض: الخارجية والرولات والقفص حتة واحدة، والداخلية لوحدها. فكل حلقة تتركب لوحدها والداخلية تتسخن وتتلبس على العمود.'],
      fail: ['Skid smearing when run with too little load, wear on the roller ends and ribs from axial load, scratched raceways from careless assembly, noise.', 'تزحلق وعلامات مسح لو اشتغلت على حمل قليل جداً، تآكل في أطراف الرولات والأكتاف من الحمل المحوري، خدوش في المجرى من التركيب بالعافية، صوت.'],
      pm: ['Needs a minimum radial load: do not run the machine unloaded for long. Slide the parts together straight and turning, never forced. Regrease per the motor nameplate interval and quantity.', 'محتاجة حمل قطري أدنى: متشغلش الماكينة على الفاضي فترة طويلة. دخّل الأجزاء في بعض على استقامة وانت بتلف، متزقّش بالعافية. اشحم حسب المدة والكمية المكتوبة على يافطة الموتور.'],
    },
    cut: 'z',
    parts: [
      { id: 'outer', name: ['Outer ring (two ribs)', 'الحلقة الخارجية (بكتفين)'], role: ['The two ribs guide the rollers and hold them in the outer ring.', 'الكتفين بيوجهوا الرولات وماسكينها في الحلقة الخارجية.'], mat: 'steel', ex: [-3.5, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[2.45, -0.8], [3.05, -0.8], [3.1, -0.75], [3.1, 0.75], [3.05, 0.8], [2.45, 0.8], [2.45, 0.47], [2.75, 0.47], [2.75, -0.47], [2.45, -0.47], [2.45, -0.8]] }] },
      { id: 'rollers', name: ['Cylindrical rollers', 'الرولات الأسطوانية'], role: ['13 rollers in line contact: much higher radial capacity than balls of the same size.', '13 رول ملامسين على خط: بيشيلوا حمل قطري أكبر بكتير من البلي اللي في نفس المقاس.'], mat: 'chrome', ex: [0, 0, 0],
        s: [{ t: 'rollers', ax: 'x', n: 13, R: 2.3, r: 0.45, l: 0.9 }] },
      { id: 'cage', name: ['Cage (machined brass)', 'القفص (نحاس مخروط)'], role: ['Brass cage with bars between the rollers; strong against vibration and shock.', 'قفص نحاس فيه عوارض بين الرولات؛ مستحمل للاهتزاز والخبط.'], mat: 'brass', ex: [-1.5, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.43, ri: 2.13, h: 0.13, p: [-0.545, 0, 0] }, { t: 'cyl', ax: 'x', r: 2.43, ri: 2.13, h: 0.13, p: [0.545, 0, 0] },
          { t: 'rollers', ax: 'x', n: 13, R: 2.3, r: 0.08, l: 1.1, a0: 13.85 }] },
      { id: 'inner', name: ['Inner ring (one rib)', 'الحلقة الداخلية (بكتف واحد)'], role: ['Shrunk onto the shaft. Its single rib takes axial load in one direction.', 'بتتلبس على العمود سخنة. الكتف الوحيد بيشيل الحمل المحوري في اتجاه واحد.'], mat: 'steel', ex: [2, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[1.55, -0.8], [2.1, -0.8], [2.1, -0.47], [1.85, -0.47], [1.85, 0.8], [1.55, 0.8], [1.5, 0.75], [1.5, -0.75], [1.55, -0.8]] }] },
      { id: 'hj', name: ['HJ angle ring', 'حلقة HJ (زاوية)'], role: ['Loose L-shaped ring that acts as the second rib, so the bearing locates the shaft both ways.', 'حلقة على شكل L بتشتغل ككتف تاني، فالبلية تثبّت العمود في الاتجاهين.'], mat: 'steel', ex: [3.8, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[1.86, 0.47], [2.1, 0.47], [2.1, 1.05], [1.5, 1.05], [1.5, 0.81], [1.86, 0.81], [1.86, 0.47]] }] },
    ],
    steps: ['outer', 'rollers', 'cage', 'inner', 'hj'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { inner: SP(1), hj: SP(1), rollers: SP(0.4), cage: SP(0.4) } },
    quiz: [
      { q: ['Why does an NU bearing let the shaft grow with heat?', 'ليه بلية NU بتسيب العمود يتمدد بالحرارة؟'], a: ['Its inner ring has no ribs, so it can slide axially under the rollers', 'الحلقة الداخلية ملهاش أكتاف فبتتزحلق محورياً تحت الرولات'], w: [['The rollers are made of rubber', 'الرولات كاوتش'], ['It has extra radial clearance only', 'عشان الخلوص القطري زيادة بس'], ['The cage bends', 'القفص بيتني']] },
      { q: ['Compared with a ball bearing of the same size, a cylindrical roller bearing…', 'مقارنة بالرولمان البلي من نفس المقاس، البلية الأسطوانية…'], a: ['Carries a much higher radial load', 'بتشيل حمل قطري أعلى بكتير'], w: [['Carries more axial load', 'بتشيل حمل محوري أكتر'], ['Runs faster with no lubrication', 'بتلف أسرع من غير تزييت'], ['Self-aligns with the shaft', 'بتظبط نفسها مع ميل العمود']] },
    ],
  });

  /* ---------- taper roller bearing 30206 (30 x 62 x 17.25) ---------- */
  add({
    id: 'taper_roller_bearing', cat: 'bearings',
    name: ['Taper roller bearing (30206)', 'رولمان بلي مخروطي (30206)'],
    info: {
      what: ['Cone (inner ring with tapered rollers and cage) running in a separate cup (outer ring). The tapered raceways meet at one point on the axis, so it takes radial load plus axial load in one direction.', 'الكون (الحلقة الداخلية بالرولات المخروطية والقفص) بيلف جوه الكاب (الحلقة الخارجية) المنفصل. المجاري المخروطية بتتقابل في نقطة على المحور فبتشيل حمل قطري ومحوري في اتجاه واحد.'],
      use: ['Gearboxes, agitator and mixer drives, wheel hubs of trolleys and forklifts, conveyor head shafts. Always used in pairs facing each other.', 'الجيربوكسات، مواتير الخلاطات والأجيتيتور، عجل الترولي والكلارك، أعمدة رأس السيور. دايماً بتتركب اتنين قصاد بعض.'],
      how: ['The axial clearance (end play) or preload is set at assembly with an adjusting nut or shims. The big rib on the cone guides the large roller ends.', 'الخلوص المحوري (اللعب) أو الشد المسبق بيتظبط وقت التركيب بصامولة ضبط أو شيمز. الكتف الكبير في الكون بيوجه الأطراف الكبيرة للرولات.'],
      fail: ['Set too tight: heat and early spalling. Set too loose: noise, roller skew and fretting of the cup in the housing. Mixing cups and cones of different sets.', 'لو متربطة زيادة: سخونية وتقشير بدري. لو سايبة: صوت ورولات بتميل وتآكل في قعدة الكاب. وخلط كاب من طقم مع كون من طقم تاني.'],
      pm: ['Set end play with a dial gauge to the manual value, turning the shaft while tightening so the rollers seat on the rib. Keep each cup with its own cone.', 'اظبط اللعب المحوري بساعة قياس على القيمة اللي في الكتالوج، ولف العمود وانت بتربط عشان الرولات تقعد على الكتف. خلي كل كاب مع الكون بتاعه.'],
    },
    cut: 'z',
    parts: [
      { id: 'shaft', name: ['Shaft (threaded end)', 'العمود (طرفه مقلوظ)'], role: ['Carries the cone; the thread at the end takes the adjusting lock nut.', 'شايل الكون؛ والقلاووظ اللي في الطرف عليه صامولة الضبط.'], mat: 'steel', ex: [0, 0, 0], cut: false,
        s: [{ t: 'cyl', ax: 'x', r: 1.495, h: 5.4, p: [-0.4, 0, 0] }, { t: 'cyl', ax: 'x', r: 1.45, h: 1.1, p: [2.85, 0, 0], m: 'iron' }] },
      { id: 'cone', name: ['Cone (inner ring)', 'الكون (الحلقة الداخلية)'], role: ['Tapered inner raceway with a small front rib and a big back rib that takes the roller thrust.', 'مجرى داخلي مخروطي فيه كتف صغير قدام وكتف كبير ورا بيشيل زق الرولات.'], mat: 'steel', ex: [3.6, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[1.55, -0.8], [1.95, -0.8], [1.95, -0.6], [1.84, -0.6], [2.026, 0.68], [2.28, 0.68], [2.28, 0.9], [2.23, 0.95], [1.55, 0.95], [1.5, 0.9], [1.5, -0.75], [1.55, -0.8]] }] },
      { id: 'rollers', name: ['Tapered rollers', 'الرولات المخروطية'], role: ['16 tapered rollers; their axes point to the same apex on the shaft axis so they roll without sliding.', '16 رول مخروطي؛ محاورهم رايحة لنفس النقطة على محور العمود فبيدحرجوا من غير زحلقة.'], mat: 'chrome', ex: [-1.6, 0, 0],
        s: [{ t: 'rollers', ax: 'x', n: 16, R: 2.25, r1: 0.36, r2: 0.28, l: 1.2, tilt: 12 }] },
      { id: 'cage', name: ['Cage (pressed steel window)', 'القفص (صاج بشبابيك)'], role: ['Holds the rollers on the cone, so the cone assembly does not fall apart when the cup is removed.', 'ماسك الرولات على الكون، فلو شلت الكاب الكون ميفرطش.'], mat: 'brass', ex: [0.9, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.3, ri: 1.98, h: 0.08, p: [-0.74, 0, 0] }, { t: 'cyl', ax: 'x', r: 2.62, ri: 2.38, h: 0.08, p: [0.76, 0, 0] },
          { t: 'rollers', ax: 'x', n: 16, R: 2.3, r: 0.06, l: 1.35, tilt: 12, a0: 11.25 }] },
      { id: 'cup', name: ['Cup (outer ring)', 'الكاب (الحلقة الخارجية)'], role: ['Separate outer ring with a tapered raceway; pressed into the housing.', 'حلقة خارجية منفصلة بمجرى مخروطي؛ بتتكبس في الهاوزنج.'], mat: 'steel', ex: [-4.2, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[2.384, -0.7], [3.05, -0.7], [3.1, -0.65], [3.1, 0.67], [3.05, 0.72], [2.786, 0.72], [2.384, -0.7]] }] },
      { id: 'washer', name: ['Tab washer (MB)', 'وردة التأمين (MB)'], role: ['Inner tab sits in the shaft keyway; one outer tab is bent into a nut slot to lock it.', 'اللسان الداخلي في مجرى العمود؛ ولسان براني بيتني في مجرى الصامولة عشان يقفلها.'], mat: 'steel', ex: [5.4, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.05, ri: 1.5, h: 0.1, p: [1.0, 0, 0] }, { t: 'box', w: 0.75, h: 0.1, d: 0.45, p: [1.38, 2.1, 0] }] },
      { id: 'nut', name: ['Lock nut (KM)', 'صامولة الضبط (KM)'], role: ['Slotted nut tightened with a hook spanner: it pushes the cone into the cup and sets the end play.', 'صامولة بمجاري بتتربط بمفتاح خطاف: بتزق الكون جوه الكاب وبتظبط اللعب.'], mat: 'steel', ex: [6.6, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.25, ri: 1.5, h: 0.7, p: [1.4, 0, 0] },
          ...[0, 90, 180, 270].map((a) => ({ t: 'box', w: 0.72, h: 0.22, d: 0.5, p: rad(2.16, a, 1.4), rot: [a, 0, 0], m: 'black' }))] },
    ],
    steps: ['shaft', 'cone', 'rollers', 'cage', 'cup', 'washer', 'nut'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft: SP(1), cone: SP(1), washer: SP(1), nut: SP(1), rollers: SP(0.42), cage: SP(0.42) } },
    quiz: [
      { q: ['A single taper roller bearing takes axial load…', 'بلية مخروطية واحدة بتشيل الحمل المحوري…'], a: ['In one direction only', 'في اتجاه واحد بس'], w: [['In both directions', 'في الاتجاهين'], ['Not at all', 'مبتشيلش خالص'], ['Only when it is hot', 'وهي سخنة بس']] },
      { q: ['How is the clearance of a taper roller pair set?', 'خلوص طقم البلي المخروطي بيتظبط إزاي؟'], a: ['With an adjusting nut or shims, checked with a dial gauge', 'بصامولة ضبط أو شيمز وتتأكد بساعة قياس'], w: [['It is fixed by the factory', 'متظبط من المصنع وخلاص'], ['By adding more grease', 'بزيادة الشحم'], ['By heating the cup', 'بتسخين الكاب']] },
    ],
  });

  /* ---------- spherical roller bearing 22210 E (50 x 90 x 23) ---------- */
  const RS = 3.94;
  const sphOuter = [[3.77, -1.15], [4.45, -1.15], [4.5, -1.1], [4.5, -0.3], [4.38, -0.3], [4.38, 0.3], [4.5, 0.3], [4.5, 1.1], [4.45, 1.15], [3.77, 1.15], ...arc(0, RS, 1, 1.15, -1.15, 20)];
  const sphInner = [[2.55, -1.15], [3.05, -1.15], [3.05, -1.0], [2.923, -1.0], [3.071, -0.06], [3.071, 0.06], [2.923, 1.0], [3.05, 1.0], [3.05, 1.15], [2.55, 1.15], [2.5, 1.1], [2.5, -1.1], [2.55, -1.15]];
  const barrel = (x, tilt) => [{ r: 0.45, l: 0.5 }, { r: 0.41, l: 0.66 }, { r: 0.35, l: 0.8 }].map((b) => ({ t: 'rollers', ax: 'x', n: 18, R: 3.45, r: b.r, l: b.l, tilt, p: [x, 0, 0] }));
  add({
    id: 'spherical_roller_bearing', cat: 'bearings',
    name: ['Spherical roller bearing (22210 E)', 'رولمان بلي كروي سفريكال رولر (22210 E)'],
    info: {
      what: ['Two rows of barrel-shaped rollers in one spherical outer raceway. Self-aligning (about 1.5-2°) and with very high load capacity.', 'صفين رولات على شكل برميل في مجرى خارجي كروي واحد. بتظبط نفسها مع ميل العمود (حوالي 1.5 لـ 2 درجة) وبتشيل أحمال عالية جداً.'],
      use: ['Big AHU and dust collector fans in plummer blocks, vibrating screens, heavy conveyors, crushers and large pulley shafts.', 'المراوح الكبيرة للـ AHU والدست كولكتور في كراسي بلوك، الغرابيل الهزازة، السيور التقيلة، الكسارات وأعمدة البكر الكبيرة.'],
      how: ['The inner ring, rollers and cage can swivel inside the spherical outer ring, so shaft bending or base misalignment does not overload the rollers. K types have a tapered bore and sit on an adapter sleeve.', 'الحلقة الداخلية والرولات والقفص يقدروا يميلوا جوه الحلقة الخارجية الكروية، فانحناء العمود أو ميل القاعدة ميحمّلش على الرولات. نوع K بتجويف مخروطي وبيتركب على جلبة ربط (أدابتر).'],
      fail: ['Wide wear band in the outer raceway, cage damage, heat from over-greasing, inner ring creeping on a loose adapter sleeve.', 'شريط تآكل عريض في المجرى الخارجي، كسر في القفص، سخونية من زيادة الشحم، الحلقة الداخلية بتلف على جلبة الربط لو سايبة.'],
      pm: ['On adapter sleeves measure the radial clearance with feeler gauges before and after driving up and lock the nut. Grease through the W33 groove and holes; do not fill the housing more than about half.', 'على جلبة الربط قيس الخلوص القطري بالفيلر قبل وبعد الدق واقفل الصامولة. اشحم من مجرى وخروم W33؛ ومتملاش الهاوزنج أكتر من النص تقريباً.'],
    },
    cut: 'z',
    parts: [
      { id: 'inner', name: ['Inner ring (two raceways)', 'الحلقة الداخلية (مجريين)'], role: ['Two inclined raceways, one for each roller row; no fixed lips in the E design, the guide ring guides the rollers.', 'فيها مجريين مايلين، واحد لكل صف رولات؛ في تصميم E مفيش أكتاف ثابتة، وحلقة التوجيه هي اللي بتوجّه الرولات.'], mat: 'steel', ex: [6.5, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 72, pts: sphInner }] },
      { id: 'guide', name: ['Floating guide ring', 'حلقة التوجيه السايبة'], role: ['Loose ring between the rows that guides the inner roller ends.', 'حلقة سايبة بين الصفين بتوجّه الأطراف الجوانية للرولات.'], mat: 'steel', ex: [0.6, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 3.2, ri: 3.072, h: 0.16, seg: 72 }] },
      { id: 'cage', name: ['Cage (two steel window cages)', 'القفص (قفصين صاج بشبابيك)'], role: ['One window cage per row with a centre ring; keeps the rollers spaced and upright.', 'قفص بشبابيك لكل صف وحلقة في النص؛ بيحافظ على مسافات الرولات واستقامتها.'], mat: 'brass', ex: [-1.8, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 3.62, ri: 3.35, h: 0.16, seg: 72 },
          { t: 'rollers', ax: 'x', n: 18, R: 3.5, r: 0.07, l: 0.85, tilt: 9, a0: 10, p: [-0.55, 0, 0] },
          { t: 'rollers', ax: 'x', n: 18, R: 3.5, r: 0.07, l: 0.85, tilt: -9, a0: 10, p: [0.55, 0, 0] }] },
      { id: 'rollers_a', name: ['Barrel rollers, row 1', 'رولات البرميل، الصف الأول'], role: ['18 symmetric barrel rollers; their curve matches the spherical outer raceway.', '18 رول برميل متماثل؛ التقويسة بتاعتهم مطابقة للمجرى الكروي البراني.'], mat: 'chrome', ex: [-4.5, 0, 0],
        s: barrel(-0.55, 9) },
      { id: 'rollers_b', name: ['Barrel rollers, row 2', 'رولات البرميل، الصف التاني'], role: ['Second row, inclined the other way: together they take radial and axial load both ways.', 'الصف التاني مايل في الاتجاه العكسي: الاتنين مع بعض بيشيلوا حمل قطري ومحوري في الاتجاهين.'], mat: 'chrome', ex: [2.8, 0, 0],
        s: barrel(0.55, -9) },
      { id: 'outer', name: ['Outer ring (spherical raceway, W33)', 'الحلقة الخارجية (مجرى كروي، W33)'], role: ['Its raceway is part of a sphere, which gives self-alignment. W33 = lube groove and 3 holes in the outside.', 'المجرى بتاعها جزء من كورة، ودا اللي بيخليها تظبط نفسها. W33 يعني مجرى تزييت و3 خروم من بره.'], mat: 'steel', ex: [-7.5, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 72, pts: sphOuter },
          ...[0, 120, 240].map((a) => ({ t: 'cyl', r: 0.15, h: 0.5, p: rad(4.15, a, 0), rot: [a, 0, 0], m: 'black' }))] },
    ],
    steps: ['inner', 'guide', 'cage', 'rollers_a', 'rollers_b', 'outer'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { inner: SP(1), guide: SP(1), rollers_a: SP(0.4), rollers_b: SP(0.4), cage: SP(0.4) } },
    quiz: [
      { q: ['Why can a spherical roller bearing run with a slightly misaligned shaft?', 'ليه البلية الكروية تقدر تشتغل والعمود مايل شوية؟'], a: ['Its outer raceway is part of a sphere', 'المجرى الخارجي جزء من كورة'], w: [['The rollers are soft', 'الرولات طرية'], ['It has a rubber seal', 'عشان فيها سيل كاوتش'], ['Its cage is flexible', 'عشان القفص مرن']] },
      { q: ['What is W33 on this bearing?', 'يعني إيه W33 في البلية دي؟'], a: ['A lubrication groove and three holes in the outer ring', 'مجرى تزييت و3 خروم في الحلقة الخارجية'], w: [['Width 33 mm', 'العرض 33 مم'], ['Stainless steel version', 'نسخة ستانلس'], ['Extra clearance class', 'درجة خلوص أكبر']] },
    ],
  });

  /* ---------- angular contact ball bearings 7205 BEP, matched pair back-to-back ---------- */
  const acOuter = [[2.3, -0.75], [2.55, -0.75], [2.6, -0.7], [2.6, 0.7], [2.55, 0.75], [2.18, 0.75], [2.18, 0.333], ...arc(1.925, 0.42, 1, 0.333, -0.08), [2.3, -0.08], [2.3, -0.75]];
  const acInner = [[1.3, -0.75], [1.67, -0.75], [1.67, -0.333], ...arc(1.925, 0.42, -1, -0.333, 0.08), [1.55, 0.08], [1.55, 0.75], [1.3, 0.75], [1.25, 0.7], [1.25, -0.7], [1.3, -0.75]];
  const acCage = (x) => ({ t: 'cyl', ax: 'x', r: 2.0, ri: 1.85, h: 0.55, p: [x, 0, 0] });
  add({
    id: 'angular_contact_bearing', cat: 'bearings',
    name: ['Angular contact ball bearings (7205 BEP pair, back-to-back)', 'رولمان بلي زاوي أنجيولار (طقم 7205 BEP ضهر لضهر)'],
    info: {
      what: ['The raceways are offset so the load passes through the balls at a contact angle (40° for suffix B). One bearing takes high axial load in one direction, so they are mounted in matched pairs.', 'المجاري مزاحة فالحمل بيعدي في البلي بزاوية (40 درجة لحرف B). البلية الواحدة بتشيل حمل محوري عالي في اتجاه واحد، عشان كده بتتركب أطقم متطابقة.'],
      use: ['Thrust end of centrifugal pumps (for example a 7310 BEP pair in the bearing frame), machine tool spindles, worm gearboxes, high speed fans.', 'ناحية الزق في الطلمبات الطاردة المركزية (زي طقم 7310 BEP في البيرنج فريم)، أعمدة المخارط والفرايز، جيربوكس الدودة، المراوح السريعة.'],
      how: ['Back-to-back (O, DB): contact lines spread apart, stiff against tilting. Face-to-face (X, DF): more tolerant to misalignment. Tandem (DT): both carry thrust in the same direction.', 'ضهر لضهر (O أو DB): خطوط التلامس بتفتح لبره فالطقم جامد ضد الميل. وش لوش (X أو DF): بيستحمل ميل أكتر. ترادفي (DT): الاتنين بيشيلوا الزق في نفس الاتجاه.'],
      fail: ['Pair mounted the wrong way round fails in hours, too much preload gives heat, balls skid at light load, mixing single bearings from different sets.', 'لو الطقم اتركب بالمقلوب يبوظ في ساعات، الشد المسبق الزيادة بيسخّن، البلي بيتزحلق على الحمل الخفيف، وخلط بلي من أطقم مختلفة.'],
      pm: ['Follow the V mark on the outer rings: it points the way of the pair and the thrust. Never mix bearings from different pairs. Press both rings with the same tool and check the shaft turns freely.', 'امشي على علامة V اللي على الحلقات الخارجية: بتوريك اتجاه الطقم والزق. متخلطش بلي من أطقم مختلفة. اكبس الحلقتين بنفس العدة واتأكد إن العمود بيلف بحرية.'],
    },
    cut: 'z',
    parts: [
      { id: 'outer_a', name: ['Outer ring, bearing A', 'الحلقة الخارجية، البلية A'], role: ['High shoulder on one side takes the thrust; the low shoulder lets the balls go in.', 'الكتف العالي من ناحية بيشيل الزق؛ والكتف الواطي بيسمح بدخول البلي.'], mat: 'steel', ex: [-4.6, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: shx(acOuter, -0.755) }] },
      { id: 'balls_a', name: ['Balls, bearing A', 'البلي، البلية A'], role: ['12 balls loaded along a line at 40° to the radial plane.', '12 بلية الحمل عليهم ماشي في خط مايل 40 درجة.'], mat: 'chrome', ex: [-3.1, 0, 0],
        s: [{ t: 'balls', ax: 'x', n: 12, R: 1.925, r: 0.4, p: [-0.75, 0, 0] }] },
      { id: 'cage_a', name: ['Cage, bearing A (machined brass)', 'القفص، البلية A (نحاس مخروط)'], role: ['Machined window cage, balls snap into the pockets.', 'قفص مخروط بشبابيك والبلي بيدخل فيه بالكبس.'], mat: 'brass', ex: [-2.2, 0, 0],
        s: [acCage(-0.75)] },
      { id: 'inner_a', name: ['Inner ring, bearing A', 'الحلقة الداخلية، البلية A'], role: ['Its high shoulder faces away from the outer ring high shoulder: that sets the contact angle.', 'الكتف العالي بتاعها في الناحية العكسية لكتف الحلقة الخارجية: ودا اللي بيعمل زاوية التلامس.'], mat: 'steel', ex: [-0.9, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: shx(acInner, -0.755) }] },
      { id: 'inner_b', name: ['Inner ring, bearing B', 'الحلقة الداخلية، البلية B'], role: ['Mirror of bearing A: the pair now holds the shaft in both axial directions.', 'عكس البلية A: الطقم كده ماسك العمود في الاتجاهين المحوريين.'], mat: 'steel', ex: [0.9, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: shx(mir(acInner), 0.755) }] },
      { id: 'cage_b', name: ['Cage, bearing B', 'القفص، البلية B'], role: ['Same cage, second bearing.', 'نفس القفص للبلية التانية.'], mat: 'brass', ex: [2.2, 0, 0],
        s: [acCage(0.75)] },
      { id: 'balls_b', name: ['Balls, bearing B', 'البلي، البلية B'], role: ['Contact line inclined the other way.', 'خط التلامس مايل في الاتجاه التاني.'], mat: 'chrome', ex: [3.1, 0, 0],
        s: [{ t: 'balls', ax: 'x', n: 12, R: 1.925, r: 0.4, a0: 15, p: [0.75, 0, 0] }] },
      { id: 'outer_b', name: ['Outer ring, bearing B', 'الحلقة الخارجية، البلية B'], role: ['Back faces of the two bearings touch in the middle (O arrangement).', 'ضهور البليتين لامسة بعض في النص (ترتيب O).'], mat: 'steel', ex: [4.6, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: shx(mir(acOuter), 0.755) }] },
    ],
    steps: ['outer_a', 'balls_a', 'cage_a', 'inner_a', 'inner_b', 'cage_b', 'balls_b', 'outer_b'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { inner_a: SP(1), inner_b: SP(1), balls_a: SP(0.4), cage_a: SP(0.4), balls_b: SP(0.4), cage_b: SP(0.4) } },
    quiz: [
      { q: ['Two angular contact bearings with the contact lines spreading apart (O shape) are mounted…', 'بليتين زاوي خطوط التلامس بتاعتهم فاتحة لبره (شكل O) يبقوا متركبين…'], a: ['Back-to-back (DB)', 'ضهر لضهر (DB)'], w: [['Face-to-face (DF)', 'وش لوش (DF)'], ['In tandem (DT)', 'ترادفي (DT)'], ['Wrongly, it must be X', 'غلط، لازم X']] },
      { q: ['Why do pump thrust ends often use a pair of 40° angular contact bearings?', 'ليه ناحية الزق في الطلمبات بتستخدم طقم بلي زاوي 40 درجة؟'], a: ['To carry high axial thrust in both directions', 'عشان تشيل زق محوري عالي في الاتجاهين'], w: [['Because they need no lubrication', 'عشان مش محتاجة تزييت'], ['To allow shaft misalignment', 'عشان تستحمل ميل العمود'], ['Because they are cheaper than ball bearings', 'عشان أرخص من البلي العادي']] },
    ],
  });

  /* ---------- pillow block UCP 205 ---------- */
  const yz = (pts) => pts.map(([y, z]) => [-y, -z]); // ext with ax:'x' maps [a,b] -> y=-a, z=-b
  const bodyOut = (() => { const o = [[-3.65, -3.6], [-2.15, -4.6], [-1.49, -3.0]]; for (let i = 1; i < 24; i++) { const a = (-116.4 + (232.8 * i) / 24) * Math.PI / 180; o.push([3.35 * Math.cos(a), 3.35 * Math.sin(a)]); } o.push([-1.49, 3.0], [-2.15, 4.6], [-3.65, 3.6]); return o; })();
  const ucOuter = [[2.2, -0.85], ...arc(0, 2.6, 1, -0.85, 0.85, 12), [2.2, 0.85], [2.2, 0.323], ...arc(1.925, 0.425, 1, 0.323, -0.323), [2.2, -0.85]];
  const ucInner = [[1.3, -1.4], [1.6, -1.4], [1.65, -1.35], [1.65, -0.323], ...arc(1.925, 0.425, -1, -0.323, 0.323), [1.65, 1.95], [1.6, 2.0], [1.3, 2.0], [1.25, 1.95], [1.25, -1.35], [1.3, -1.4]];
  const foot = (z) => ({ t: 'ext', ax: 'y', d: 1.5, p: [0, -2.9, z], pts: [[-1.9, -2.0], [1.9, -2.0], [1.9, 2.0], [-1.9, 2.0]], holes: [{ c: [0, -0.25 * Math.sign(z)], r: 0.6 }] });
  add({
    id: 'pillow_block', cat: 'bearings',
    name: ['Pillow block bearing unit (UCP 205)', 'كرسي بلي بيلو بلوك (UCP 205)'],
    info: {
      what: ['A ready mounted unit: cast iron housing with a sealed insert bearing. The spherical outside of the insert lets it self-align in the housing. Locked to the shaft with two set screws.', 'وحدة جاهزة: هاوزنج زهر وجواه بلية إنسرت مقفولة. السطح الكروي البراني للإنسرت بيخليها تظبط نفسها جوه الهاوزنج. بتتقفل على العمود بمسمارين زنق (set screw).'],
      use: ['Conveyor drums and rollers on packaging lines, AHU and dust collector fan shafts, screw conveyors, top support of slow agitators.', 'درامات ورولات السيور في خطوط التعبئة، أعمدة مراوح الـ AHU والدست كولكتور، البريمة الناقلة، الكرسي العلوي للخلاطات البطيئة.'],
      how: ['The UC insert has a wide inner ring with two set screws at 120°. The insert can tilt a little in the housing bore to take mounting misalignment, not running misalignment.', 'إنسرت UC ليه حلقة داخلية عريضة فيها مسمارين زنق بينهم 120 درجة. الإنسرت يقدر يميل شوية جوه الهاوزنج عشان ياخد ميل التركيب، مش ميل وقت التشغيل.'],
      fail: ['Loose set screws let the inner ring spin on the shaft (scored shaft, squeal, heat). Over-greasing pushes out the seals. Housing feet crack when bolted down on an uneven base.', 'لو مسامير الزنق فكّت الحلقة الداخلية تلف على العمود (العمود يتاكل، صريخ، سخونية). زيادة الشحم بتطلّع السيلات. رجول الهاوزنج تتشرخ لو اتربطت على قاعدة مش مستوية.'],
      pm: ['Align and tighten the set screws to the torque value with thread locker. Grease slowly through the nipple while turning, a few shots only. Shim the base flat and tighten the base bolts evenly.', 'اظبط الاستقامة واربط مسامير الزنق على العزم المطلوب بلاصق مسامير. اشحم بالراحة من البز والعمود بيلف، كام ضربة بس. ظبط القاعدة بالشيمز واربط مسامير القاعدة بالتساوي.'],
    },
    cut: 'z',
    parts: [
      { id: 'housing', name: ['Housing (cast iron)', 'الهاوزنج (زهر)'], role: ['Holds the insert in a spherical bore and carries the two slotted feet.', 'ماسك الإنسرت في تجويف كروي وفيه الرجلين بالخروم.'], mat: 'cast', ex: [0, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[2.356, -1.1], [3.35, -1.1], [3.35, 1.1], [2.356, 1.1], ...arc(0, 2.62, 1, 1.1, -1.1, 14)] },
          { t: 'ext', ax: 'x', d: 2.2, pts: yz(bodyOut), holes: [{ c: [0, 0], r: 3.2 }] },
          foot(5.0), foot(-5.0)] },
      { id: 'outer', name: ['Insert outer ring (spherical OD)', 'الحلقة الخارجية للإنسرت (كروية من بره)'], role: ['Spherical outside sits in the housing bore; has a lube hole under the grease nipple.', 'السطح الكروي بيقعد في تجويف الهاوزنج؛ وفيها خرم تزييت تحت بز الشحم.'], mat: 'steel', ex: [5, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: ucOuter }, { t: 'cyl', r: 0.12, h: 0.42, p: [0, 2.4, 0], m: 'black' }] },
      { id: 'seals', name: ['Seals with flingers', 'السيلات والفلنجر'], role: ['Rubber seals on both sides plus steel flingers on the inner ring that throw dirt away.', 'سيلات كاوتش من الناحيتين وفلنجر صاج على الحلقة الداخلية بيرمي التراب بعيد.'], mat: 'rubber', ex: [7.2, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.18, ri: 1.68, h: 0.07, p: [-0.78, 0, 0] }, { t: 'cyl', ax: 'x', r: 2.18, ri: 1.68, h: 0.07, p: [0.78, 0, 0] },
          { t: 'cyl', ax: 'x', r: 2.05, ri: 1.66, h: 0.05, p: [-0.88, 0, 0], m: 'steel' }, { t: 'cyl', ax: 'x', r: 2.05, ri: 1.66, h: 0.05, p: [0.88, 0, 0], m: 'steel' }] },
      { id: 'balls', name: ['Balls', 'البلي'], role: ['9 balls in deep grooves, like a 6205 bearing.', '9 بليات في مجاري عميقة زي بلية 6205.'], mat: 'chrome', ex: [9.4, 0, 0],
        s: [{ t: 'balls', ax: 'x', n: 9, R: 1.925, r: 0.42 }] },
      { id: 'inner', name: ['Wide inner ring', 'الحلقة الداخلية العريضة'], role: ['Extended inner ring that slides on the shaft; the set screws go through it.', 'حلقة داخلية طويلة بتتزحلق على العمود؛ ومسامير الزنق بتعدي فيها.'], mat: 'steel', ex: [12.2, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: ucInner }] },
      { id: 'shaft', name: ['Shaft (Ø25 mm)', 'العمود (25 مم)'], role: ['Plain shaft, h7 or h9 tolerance; no shoulder needed.', 'عمود ساده بتفاوت h7 أو h9؛ مش محتاج كتف.'], mat: 'steel', ex: [-11, 0, 0], cut: false,
        s: [{ t: 'cyl', ax: 'x', r: 1.245, h: 10 }] },
      { id: 'screws', name: ['Set screws (2, at 120°)', 'مسامير الزنق (2 بينهم 120°)'], role: ['Cup-point set screws bite into the shaft and lock the inner ring.', 'مسامير براس مقعّرة بتعض في العمود وبتقفل الحلقة الداخلية.'], mat: 'black', ex: [12.2, 1.6, 0],
        s: [{ t: 'cyl', r: 0.25, h: 0.55, p: rad(1.525, 0, 1.5), rot: [0, 0, 0] }, { t: 'cyl', r: 0.25, h: 0.55, p: rad(1.525, 120, 1.5), rot: [120, 0, 0] }] },
      { id: 'nipple', name: ['Grease nipple', 'بز الشحم (نبل)'], role: ['Grease goes from the gun through the housing into the insert lube hole.', 'الشحم بيدخل من المسدس عن طريق الهاوزنج لخرم تزييت الإنسرت.'], mat: 'brass', ex: [0, 3.5, 0],
        s: [{ t: 'hex', r: 0.45, h: 0.35, p: [0, 3.52, 0] }, { t: 'cyl', r: 0.18, h: 0.5, p: [0, 3.95, 0] }, { t: 'sph', r: 0.27, p: [0, 4.3, 0] }] },
      { id: 'bolts', name: ['Base bolts with washers', 'مسامير القاعدة والوردة'], role: ['Two bolts through the slotted feet; slots allow alignment before tightening.', 'مسمارين في خروم الرجلين الطولية؛ الخروم الطولية بتسمح بالظبط قبل الربط.'], mat: 'steel', ex: [0, 4.5, 0],
        s: [-5.25, 5.25].flatMap((z) => [{ t: 'cyl', r: 1.0, ri: 0.55, h: 0.2, p: [0, -2.05, z] }, { t: 'hex', r: 0.95, h: 0.65, p: [0, -1.625, z] }, { t: 'cyl', r: 0.5, h: 2.65, p: [0, -3.275, z] }]) },
    ],
    steps: ['housing', 'outer', 'balls', 'inner', 'seals', 'nipple', 'shaft', 'screws', 'bolts'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { shaft: SP(1), inner: SP(1), screws: SP(1), balls: SP(0.4) } },
    quiz: [
      { q: ['What is the spherical outside of the insert for?', 'السطح الكروي البراني للإنسرت فايدته إيه؟'], a: ['It self-aligns in the housing during mounting', 'بيظبط نفسه جوه الهاوزنج وقت التركيب'], w: [['It holds more grease', 'بيشيل شحم أكتر'], ['It lets the bearing run faster', 'بيخلي البلية تلف أسرع'], ['It stops the shaft moving axially', 'بيمنع العمود يتحرك محورياً']] },
      { q: ['The shaft is scored and polished under the insert. The cause is…', 'العمود متاكل ولامع تحت الإنسرت. السبب…'], a: ['The set screws were loose and the inner ring spun', 'مسامير الزنق كانت سايبة والحلقة الداخلية لفت على العمود'], w: [['Too much grease', 'شحم زيادة'], ['The housing is cast iron', 'عشان الهاوزنج زهر'], ['Normal wear', 'تآكل طبيعي']] },
    ],
  });

  /* ---------- needle roller bearing: drawn cup HK 2516 on IR 20x25x16, in an idler gear ---------- */
  add({
    id: 'needle_bearing', cat: 'bearings',
    name: ['Needle roller bearing (drawn cup HK 2516)', 'رولمان إبر نيدل (كاب مكبوس HK 2516)'],
    info: {
      what: ['Long thin rollers (needles) give the highest radial capacity for the smallest section height. Drawn cup type: a thin pressed steel shell with needles and cage, running on a hardened shaft or an inner ring.', 'رولات رفيعة وطويلة (إبر) بتشيل أعلى حمل قطري في أقل سُمك. نوع الكاب المكبوس: جلبة صاج رفيعة جواها إبر وقفص، بتلف على عمود مقسّى أو حلقة داخلية.'],
      use: ['Idler and planet gears, cam followers on cartoner and blister machine cams, rocker arms, universal joints, small gear pumps.', 'التروس الوسيطة والكوكبية، بكر الكامات في ماكينات الكرتونة والبليستر، الأذرع المتأرجحة، الكردان، طلمبات التروس الصغيرة.'],
      how: ['The thin cup is pressed into the housing; the housing bore gives it its final round shape. Here the gear turns on a fixed shaft. No axial load capacity.', 'الكاب الرفيع بيتكبس في الهاوزنج؛ وتجويف الهاوزنج هو اللي بيديله الاستدارة النهائية. هنا الترس بيلف على عمود ثابت. مبتشيلش حمل محوري.'],
      fail: ['Dents and flaking on the shaft raceway, cracked cup from hammering or a wrong press tool, skewed needles, wear when the shaft is not hard enough.', 'تنقير وتقشير في مسار العمود، شرخ في الكاب من الدق أو عدة كبس غلط، إبر مايلة، تآكل لو العمود مش مقسّى كفاية.'],
      pm: ['Press in with a stepped mandrel on the marked (stamped) end, never hammer. The shaft raceway must be hardened (about 58 HRC) and ground, otherwise use an inner ring.', 'اكبس بمندريل متدرج على الوش المكتوب عليه، متدقش بالشاكوش أبداً. مسار العمود لازم يكون مقسّى (حوالي 58 HRC) ومجلّخ، وإلا استخدم حلقة داخلية.'],
    },
    cut: 'z',
    parts: [
      { id: 'gear', name: ['Idler gear (housing)', 'الترس الوسيط (الهاوزنج)'], role: ['The bore of the gear is the housing; it must be round and to tolerance (N7) for the cup.', 'تجويف الترس هو الهاوزنج؛ لازم يكون مدوّر وعلى التفاوت (N7) عشان الكاب.'], mat: 'steel', ex: [0, 0, 0],
        s: [{ t: 'gear', ax: 'x', r: 3.2, teeth: 26, h: 1.6, ri: 1.6 }] },
      { id: 'cup', name: ['Drawn cup (outer shell)', 'الكاب المكبوس (الجلبة البرانية)'], role: ['Thin hardened shell with inward lips that keep the needles in.', 'جلبة رفيعة مقسّاة بحواف لجوه بتحبس الإبر.'], mat: 'steel', ex: [2.6, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[1.5, -0.8], [1.595, -0.8], [1.595, 0.8], [1.32, 0.8], [1.32, 0.72], [1.5, 0.72], [1.5, -0.72], [1.32, -0.72], [1.32, -0.8], [1.5, -0.8]] }] },
      { id: 'cage', name: ['Cage', 'القفص'], role: ['Keeps the needles parallel to the shaft so they do not skew.', 'بيخلي الإبر موازية للعمود فمتميلش.'], mat: 'brass', ex: [4.2, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 1.46, ri: 1.29, h: 0.05, p: [-0.685, 0, 0] }, { t: 'cyl', ax: 'x', r: 1.46, ri: 1.29, h: 0.05, p: [0.685, 0, 0] },
          { t: 'rollers', ax: 'x', n: 24, R: 1.375, r: 0.035, l: 1.36, a0: 7.5 }] },
      { id: 'needles', name: ['Needle rollers', 'الإبر'], role: ['24 needles Ø2.5 mm: line contact over the full length.', '24 إبرة قطرها 2.5 مم: تلامس على طول الإبرة كلها.'], mat: 'chrome', ex: [5.6, 0, 0],
        s: [{ t: 'rollers', ax: 'x', n: 24, R: 1.375, r: 0.125, l: 1.3 }] },
      { id: 'inner', name: ['Inner ring (IR 20x25x16)', 'الحلقة الداخلية (IR 20x25x16)'], role: ['Hardened ground raceway, used when the shaft itself is not hardened.', 'مسار مقسّى ومجلّخ، بيستخدم لما العمود نفسه مش مقسّى.'], mat: 'steel', ex: [7.4, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 64, pts: [[1.03, -0.8], [1.22, -0.8], [1.25, -0.77], [1.25, 0.77], [1.22, 0.8], [1.03, 0.8], [1.0, 0.77], [1.0, -0.77], [1.03, -0.8]] }] },
      { id: 'shaft', name: ['Fixed shaft (Ø20 mm)', 'العمود الثابت (20 مم)'], role: ['Stationary pin the gear turns on.', 'محور ثابت الترس بيلف عليه.'], mat: 'steel', ex: [-5, 0, 0], cut: false,
        s: [{ t: 'cyl', ax: 'x', r: 0.995, h: 6 }] },
    ],
    steps: ['gear', 'cup', 'cage', 'needles', 'inner', 'shaft'],
    anim: { mode: 'spin', label: ['Run', 'شغّل'], parts: { gear: SP(1), cup: SP(1), needles: SP(0.5), cage: SP(0.5) } },
    quiz: [
      { q: ['Why choose a needle bearing?', 'ليه نختار رولمان إبر؟'], a: ['High radial load with very little radial space', 'حمل قطري عالي في مساحة قطرية صغيرة جداً'], w: [['It takes heavy axial load', 'بيشيل حمل محوري تقيل'], ['It needs no hardened raceway', 'مش محتاج مسار مقسّى'], ['It self-aligns', 'بيظبط نفسه مع الميل']] },
      { q: ['How do you fit a drawn cup needle bearing?', 'بتركّب رولمان الإبر أبو كاب مكبوس إزاي؟'], a: ['Press it in with a mandrel on the marked end', 'تكبسه بمندريل على الوش المكتوب عليه'], w: [['Hammer it in on the cage', 'تدقه بالشاكوش على القفص'], ['Heat the cup with a torch', 'تسخن الكاب بالشعلة'], ['Glue it in place', 'تلزقه مكانه']] },
    ],
  });

  /* ---------- plain bronze bushing on a pivot pin ---------- */
  add({
    id: 'plain_bushing', cat: 'bearings',
    name: ['Plain bearing (bronze bushing)', 'جلبة برونز (كرسي انزلاقي)'],
    info: {
      what: ['A bronze sleeve pressed into a housing: the shaft slides on a thin grease or oil film. No rolling elements, so it is simple, compact and takes shock loads.', 'جلبة برونز متكبوسة في هاوزنج: العمود بيتزحلق على طبقة شحم أو زيت رفيعة. مفيهاش بلي، فبسيطة وصغيرة وبتستحمل الخبط.'],
      use: ['Pivot pins and levers on packaging and tablet press linkages, valve actuator pins, conveyor take-ups, slow oscillating shafts.', 'محاور وأذرع ميكانيزمات ماكينات التعبئة والمكابس، بنوز مشغلات المحابس، شدادات السيور، الأعمدة اللي بتتأرجح ببطء.'],
      how: ['Grease from the nipple goes through the lube hole into the groove and spreads over the bore; the film carries the load. Thrust washers take side load and the circlip holds the pin.', 'الشحم من البز بيدخل من خرم التزييت للمجرى ويتوزع على التجويف؛ والطبقة دي هي اللي بتشيل الحمل. ورد الزق بيشيل الحمل الجانبي والسيكلبس ماسك البنز.'],
      fail: ['Dry running gives scoring, heat and seizure; worn oval bore gives play and knocking; old grease hardens and blocks the groove.', 'الشغل على الناشف بيخدش ويسخّن ويقفش؛ التجويف لما يتاكل بيضوّل فيبقى فيه لعب وخبط؛ الشحم القديم بينشف ويسد المجرى.'],
      pm: ['Grease until fresh grease comes out at the ends. Check play by hand or with a dial gauge. When pressing a new bush, line up its lube hole with the housing grease hole; ream the bore if it closes in.', 'اشحم لحد ما الشحم الجديد يطلع من الأطراف. اتأكد من اللعب بإيدك أو بساعة قياس. وانت بتكبس جلبة جديدة، خلي خرم التزييت بتاعها على خرم الشحم في الهاوزنج؛ وريمر التجويف لو ضاق.'],
    },
    cut: 'z',
    parts: [
      { id: 'housing', name: ['Lever boss (housing)', 'بوس الدراع (الهاوزنج)'], role: ['Bore that holds the bush with an interference fit, with a grease hole on top.', 'تجويف ماسك الجلبة بتداخل، وفيه خرم شحم من فوق.'], mat: 'castg', ex: [0, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 56, pts: [[1.8, -1.6], [3.0, -1.6], [3.0, 1.6], [1.8, 1.6], [1.8, -1.6]] }, { t: 'box', w: 2.0, h: 5.65, d: 1.6, p: [0, -5.675, 0] }] },
      { id: 'bush', name: ['Bronze bush', 'الجلبة البرونز'], role: ['Bronze sleeve with a lube hole, a ring groove and a spiral groove to spread grease.', 'جلبة برونز فيها خرم تزييت ومجرى دائري ومجرى حلزوني عشان يوزع الشحم.'], mat: 'bronze', ex: [4, 0, 0],
        s: [{ t: 'lathe', ax: 'x', seg: 56, pts: [[1.55, -1.5], [1.79, -1.5], [1.79, 1.5], [1.55, 1.5], [1.5, 1.45], [1.5, 0.2], [1.62, 0.2], [1.62, -0.2], [1.5, -0.2], [1.5, -1.45], [1.55, -1.5]] },
          { t: 'cyl', r: 0.14, h: 0.34, p: [0, 1.65, 0], m: 'black' },
          { t: 'tube', path: helix(1.55, -1.25, 1.25, 1.25), r: 0.05, m: 'black' }] },
      { id: 'nipple', name: ['Grease nipple', 'بز الشحم'], role: ['Feeds grease to the bush lube hole.', 'بيوصّل الشحم لخرم تزييت الجلبة.'], mat: 'brass', ex: [0, 3, 0],
        s: [{ t: 'hex', r: 0.45, h: 0.35, p: [0, 3.17, 0] }, { t: 'cyl', r: 0.18, h: 0.5, p: [0, 3.6, 0] }, { t: 'sph', r: 0.27, p: [0, 3.95, 0] }] },
      { id: 'washer_a', name: ['Thrust washer (head side)', 'وردة الزق (ناحية الراس)'], role: ['Takes the side load between the pin head and the boss face.', 'بتشيل الحمل الجانبي بين راس البنز ووش البوس.'], mat: 'bronze', ex: [-3.5, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.6, ri: 1.5, h: 0.18, p: [-1.7, 0, 0] }] },
      { id: 'shaft', name: ['Pivot pin', 'البنز (المحور)'], role: ['Hardened headed pin with a groove for the circlip.', 'بنز مقسّى براس وفيه مجرى للسيكلبس.'], mat: 'steel', ex: [-8.5, 0, 0], cut: false,
        s: [{ t: 'lathe', ax: 'x', seg: 48, pts: [[0, -2.4], [2.3, -2.4], [2.4, -2.3], [2.4, -1.8], [1.48, -1.8], [1.48, 1.92], [1.36, 1.92], [1.36, 2.04], [1.48, 2.04], [1.48, 2.7], [1.38, 2.8], [0, 2.8], [0, -2.4]] }] },
      { id: 'washer_b', name: ['Thrust washer (clip side)', 'وردة الزق (ناحية السيكلبس)'], role: ['Second washer; leaves a small axial play for the grease film.', 'الوردة التانية؛ بتسيب لعب محوري صغير لطبقة الشحم.'], mat: 'bronze', ex: [5.5, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.6, ri: 1.5, h: 0.2, p: [1.72, 0, 0] }] },
      { id: 'circlip', name: ['Circlip (external)', 'سيكلبس خارجي'], role: ['Spring steel ring in the pin groove that stops the pin walking out.', 'حلقة صلب سوستة في مجرى البنز بتمنعه يطلع.'], mat: 'black', ex: [7, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 1.95, ri: 1.38, h: 0.1, p: [1.98, 0, 0] }, { t: 'box', w: 0.1, h: 0.45, d: 0.3, p: [1.98, 1.95, 0.32] }, { t: 'box', w: 0.1, h: 0.45, d: 0.3, p: [1.98, 1.95, -0.32] }] },
    ],
    steps: ['housing', 'bush', 'nipple', 'washer_a', 'shaft', 'washer_b', 'circlip'],
    anim: { mode: 'spin', label: ['Turn the pin', 'لف البنز'], parts: { shaft: SP(0.5), circlip: SP(0.5) } },
    quiz: [
      { q: ['When pressing in a new bush, where must its lube hole be?', 'وانت بتكبس جلبة جديدة، خرم التزييت بتاعها لازم يكون فين؟'], a: ['In line with the housing grease hole', 'على نفس خط خرم الشحم في الهاوزنج'], w: [['At the bottom, away from the load', 'تحت بعيد عن الحمل'], ['It does not matter', 'مش فارقة'], ['Blocked with grease first', 'تسده بالشحم الأول']] },
      { q: ['What carries the load in a plain bush?', 'إيه اللي بيشيل الحمل في الجلبة الانزلاقية؟'], a: ['A thin grease or oil film between pin and bush', 'طبقة شحم أو زيت رفيعة بين البنز والجلبة'], w: [['Small balls in the groove', 'بلي صغير في المجرى'], ['The circlip', 'السيكلبس'], ['Direct metal contact', 'تلامس معدن على معدن']] },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
