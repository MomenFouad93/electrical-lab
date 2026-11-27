/* Mechanical: hand tools and measuring tools (lying flat, longest dimension along X) */
(function (g) {
  const EL = g.EL, M = EL.mech, D = Math.PI / 180;
  const f3 = (v) => Math.round(v * 1000) / 1000;
  // points of an arc in a 2D outline (degrees, counter-clockwise from +x)
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
  // ext with ax 'y' maps outline [px, py] to world (px, z = -py): give points as [x, z]
  const XZ = (pts) => pts.map((q) => [q[0], -q[1]]);
  const rot2 = (pts, deg, cx, cy) => { const c = Math.cos(deg * D), s = Math.sin(deg * D); return pts.map(([x, y]) => [f3(cx + x * c - y * s), f3(cy + x * s + y * c)]); };
  const star = (n, ro, rin) => { const o = []; for (let i = 0; i < n * 2; i++) { const a = (i * 180) / n * D, r = i % 2 ? rin : ro; o.push([f3(Math.cos(a) * r), f3(Math.sin(a) * r)]); } return o; };

  /* ---------------- combination spanner 17 mm ---------------- */
  (function () {
    const hw = 0.86, R = 2.1, a = Math.asin(hw / R) / D;
    const open = [...arc(R, a, 360 - a, 36), ...arc(0.86, 270, 90, 10, -0.45, 0)];
    M.add({
      id: 'combination_spanner', cat: 'tools',
      name: ['Combination spanner (17 mm)', 'مفتاح بلدي وعين (مشترك) 17 مم'],
      info: {
        what: ['One spanner with an open end and a 12-point ring end of the same size. The size (17 mm) is the width across the flats of the nut.', 'مفتاح فيه ناحية مفتوحة وناحية عين (12 سنة) بنفس المقاس. المقاس (17 مم) هو عرض الصامولة بين الوشين.'],
        use: ['Everyday bolting on machines, pump bases, motor feet, pipe flanges and guards in every area of the site.', 'شغل الربط اليومي على المكن وقواعد الطلمبات ورجول المواتير وفلانشات المواسير والجاردات في كل مكان في المصنع.'],
        how: ['The ring end grips all six corners, so use it for the final tightening and to break tight bolts. The open end is 15° offset so you can flip it and keep turning in tight spaces.', 'العين بتمسك الست زوايا، فاستخدمها في الربط الأخير وفك المسامير الناشفة. الناحية المفتوحة مايلة 15 درجة عشان تقلبها وتكمل في الأماكن الضيقة.'],
        fail: ['Open jaws spread with abuse and round off nut corners; a cracked or worn ring slips under load and hurts hands.', 'البق المفتوح بيوسع من سوء الاستخدام ويبوّظ زوايا الصامولة، والعين المشروخة أو الدايبة بتفلت تحت الحمل وتعوّر الإيد.'],
        pm: ['Pull, do not push, the spanner. Never add a pipe extension or hammer on it. Replace it if the jaws are spread or the ring is worn.', 'اسحب المفتاح ناحيتك متزقّهوش. متركبش عليه ماسورة تطويل ومتخبطش عليه بشاكوش. غيّره لو البق وسع أو العين دابت.'],
      },
      cut: 'z',
      parts: [
        { id: 'plate', name: ['Steel plate (work piece)', 'لوح حديد (الشغلانة)'], role: ['The joint being bolted.', 'الوصلة اللي بنربطها.'], mat: 'castg', ex: [0, -4, 0],
          s: [{ t: 'box', w: 9, h: 1, d: 6, p: [1.5, -1.05, 0] }] },
        { id: 'bolt', name: ['Hex bolt head 17 mm', 'راس مسمار سداسي 17'], role: ['17 mm across flats: the size the spanner must match.', '17 مم بين الوشين: ده المقاس اللي المفتاح لازم يطابقه.'], mat: 'steel', ex: [0, 4.5, 0],
          s: [{ t: 'hex', r: 0.98, h: 1.1, p: [0, 0, 0] }, { t: 'cyl', r: 0.6, h: 1.2, p: [0, -1.0, 0] }] },
        { id: 'ring_end', name: ['Ring end (12-point)', 'ناحية العين (12 سنة)'], role: ['Closed ring that grips the corners of the nut: no slipping, for final torque.', 'عين مقفولة بتمسك زوايا الصامولة: مبتفلتش، للربط الأخير.'], mat: 'chrome', ex: [-3, 0, 0],
          s: [{ t: 'ext', d: 0.9, pts: XZ(arc(1.6, 0, 360, 40).slice(0, -1)), holes: [star(12, 1.0, 0.885)] }] },
        { id: 'shank', name: ['Shank (I-section)', 'الدراع (قطاع I)'], role: ['Forged I-beam handle: stiff but light. Size is stamped on it.', 'دراع مطروق على شكل I: جامد وخفيف. المقاس مختوم عليه.'], mat: 'chrome', ex: [0, 0, 0],
          s: [{ t: 'box', w: 16.9, h: 0.55, d: 1.45, p: [9.75, 0, 0] }, { t: 'box', w: 13, h: 0.04, d: 0.7, p: [9.75, 0.28, 0], m: 'steel' }, { t: 'box', w: 13, h: 0.04, d: 0.7, p: [9.75, -0.28, 0], m: 'steel' },
            { t: 'box', w: 1.2, h: 0.02, d: 0.35, p: [4.0, 0.3, 0], m: 'black' }] },
        { id: 'open_end', name: ['Open end (15° offset)', 'الناحية المفتوحة (مايلة 15°)'], role: ['Jaws grip two flats. Quick to slip on, but weaker than the ring.', 'البق بيمسك وشين بس. سريع في التركيب لكن أضعف من العين.'], mat: 'chrome', ex: [3, 0, 0],
          s: [{ t: 'ext', d: 0.75, pts: XZ(rot2(open, 15, 20, 0)) }] },
      ],
      steps: ['plate', 'bolt', 'ring_end', 'shank', 'open_end'],
      anim: { mode: 'toggle', label: ['Tighten', 'اربط'], parts: { ring_end: { rot: [0, 1, 0], a: [0, -30] }, shank: { rot: [0, 1, 0], a: [0, -30] }, open_end: { rot: [0, 1, 0], a: [0, -30] }, bolt: { rot: [0, 1, 0], a: [0, -30] } } },
      quiz: [
        { q: ['Which end do you use to break a very tight bolt?', 'تستخدم أنهي ناحية عشان تفك مسمار ناشف جداً؟'], a: ['The ring end', 'ناحية العين'], w: [['The open end', 'الناحية المفتوحة'], ['Either, with a pipe extension', 'أي ناحية مع ماسورة تطويل'], ['The open end with a hammer', 'المفتوحة مع شاكوش']] },
        { q: ['What does "17 mm" on the spanner mean?', 'يعني إيه 17 مم المكتوبة على المفتاح؟'], a: ['Width across the flats of the nut', 'عرض الصامولة بين الوشين'], w: [['Thread diameter of the bolt', 'قطر سن المسمار'], ['Length of the bolt', 'طول المسمار'], ['Thread pitch', 'خطوة السن']] },
      ],
    });
  })();

  /* ---------------- adjustable wrench 250 mm ---------------- */
  (function () {
    const end = [[-16.6, 0.4], [-16.75, 0], [-16.6, -0.4]];
    const upperL = XZ([[-16, -0.8], [4, -1.4], [5.0, -3.0], [7.6, -3.4], [7.6, -1.4], [5.6, -1.4], [5.6, 1.3], [7.6, 1.3], [7.6, 3.0], [6.5, 3.2], [5.0, 2.6], [4.0, 1.4], [-16, 0.8], ...end]);
    const upperR = XZ([[9.4, -3.4], [11.5, -3.35], [13.1, -3.0], [13.9, -2.1], [13.9, -0.85], [9.4, -0.85]]);
    const lower = XZ([[-16, -0.8], [4, -1.4], [5.0, -3.0], [7.6, -3.4], [9.4, -3.4], [11.5, -3.35], [13.1, -3.0], [13.9, -2.1], [13.9, -0.85], [9.4, -0.85], [9.4, 3.0], [7.6, 3.0], [6.5, 3.2], [5.0, 2.6], [4.0, 1.4], [-16, 0.8], ...end]);
    const win = XZ([[5.6, -1.4], [7.6, -1.4], [7.6, 1.3], [5.6, 1.3]]);
    const hang = { c: [-15.2, 0], r: 0.45 };
    const teeth = []; for (let z = -2.2; z <= 2.81; z += 0.3) teeth.push({ t: 'box', w: 0.25, h: 0.75, d: 0.13, p: [7.5, 0.125, f3(z)] });
    M.add({
      id: 'adjustable_wrench', cat: 'tools',
      name: ['Adjustable wrench (250 mm)', 'مفتاح فرنساوي (250 مم)'],
      info: {
        what: ['Spanner with one fixed jaw and one sliding jaw. A worm screw in the head moves the jaw through a rack.', 'مفتاح فيه بق ثابت وبق بيتحرك. حلزونة في الراس بتحرك البق عن طريق جريدة مسننة.'],
        use: ['Odd sizes, inch fittings and emergency jobs when the right spanner is not there: utilities, plumbing, water station fittings.', 'المقاسات الغريبة وتركيبات البوصة والشغل الطارئ لما المفتاح المظبوط مش موجود: المرافق والسباكة وتركيبات محطة المية.'],
        how: ['Roll the worm with your thumb until both jaws touch the flats with no play. Turn so the force goes into the fixed jaw, not the moving one.', 'لف الحلزونة بصباعك لحد ما البقين يقفلوا على الوشين من غير لعب. لف بحيث القوة تيجي على البق الثابت مش المتحرك.'],
        fail: ['Worn rack or worm lets the jaw open under load, the nut rounds off; a bent jaw does not close parallel.', 'لما الجريدة أو الحلزونة تدوب البق بيفتح تحت الحمل والصامولة تتبوّظ، والبق المعووج ميقفلش متوازي.'],
        pm: ['Keep the worm clean and lightly oiled. Check jaw play before use. Do not use it as a hammer or on very tight bolts.', 'خلي الحلزونة نضيفة ومزيتة خفيف. اتأكد من لعب البق قبل الاستخدام. متستخدموش شاكوش ولا على المسامير الناشفة جداً.'],
      },
      cut: 'y',
      parts: [
        { id: 'body', name: ['Body with fixed jaw', 'الجسم والبق الثابت'], role: ['Forged handle, head and fixed jaw in one piece. The head has the jaw slot and the worm window.', 'الدراع والراس والبق الثابت قطعة واحدة مطروقة. في الراس مجرى البق وشباك الحلزونة.'], mat: 'chrome', ex: [0, 0, 0],
          s: [{ t: 'ext', d: 0.25, p: [0, -0.375, 0], pts: lower, holes: [win, hang] },
            { t: 'ext', d: 0.75, p: [0, 0.125, 0], pts: upperL, holes: [hang] },
            { t: 'ext', d: 0.75, p: [0, 0.125, 0], pts: upperR }] },
        { id: 'pin', name: ['Worm axle pin', 'مسمار محور الحلزونة'], role: ['Pressed pin the worm turns on.', 'مسمار مكبوس الحلزونة بتلف عليه.'], mat: 'steel', ex: [0, 0, -7],
          s: [{ t: 'cyl', r: 0.2, h: 4.4, ax: 'z', p: [6.6, 0, 0] }] },
        { id: 'spring', name: ['Worm spring', 'سوستة الحلزونة'], role: ['Small spring inside the worm: stops it rattling and holds the setting.', 'سوستة صغيرة جوه الحلزونة: بتمنع الرزرزة وبتثبت الضبط.'], mat: 'steel', ex: [0, 3, -4], cut: false,
          s: [{ t: 'spring', R: 0.27, r: 0.05, turns: 5, len: 1.0, ax: 'z', p: [6.6, 0, -0.65] }] },
        { id: 'worm', name: ['Worm screw (knurled)', 'الحلزونة'], role: ['Thumb-turned screw; its thread meshes with the rack on the jaw.', 'بتلفها بصباعك، وسنها معشق في جريدة البق.'], mat: 'steel', o: [6.6, 0, 0], ex: [0, 3.5, 0],
          s: [{ t: 'cyl', r: 0.68, ri: 0.34, h: 2.4, ax: 'z' }, { t: 'spring', R: 0.74, r: 0.1, turns: 8, len: 2.3, ax: 'z' }] },
        { id: 'movable_jaw', name: ['Sliding jaw with rack', 'البق المتحرك والجريدة'], role: ['Jaw on a shank that slides in the head; the rack teeth on the shank are moved by the worm.', 'بق على ساق بيتزحلق في الراس، والجريدة المسننة على الساق الحلزونة بتحركها.'], mat: 'chrome', ex: [0, 0, 6],
          s: [{ t: 'ext', d: 1.0, pts: XZ([[9.4, 0.85], [13.9, 0.85], [13.9, 1.9], [13.0, 2.7], [11.5, 2.95], [9.4, 3.0]]) },
            { t: 'box', w: 1.8, h: 0.75, d: 5.4, p: [8.5, 0.125, 0.3] }, ...teeth] },
        { id: 'nut', name: ['Nut 17 mm (work piece)', 'صامولة 17 (الشغلانة)'], role: ['Jaws must sit fully on the flats.', 'البق لازم يقفل على الوشين كامل.'], mat: 'steel', ex: [5, 0, 0], cut: false,
          s: [{ t: 'hex', r: 0.98, h: 0.8, ri: 0.5, rot: [0, 30, 0], p: [12.0, 0, 0] }] },
      ],
      steps: ['body', 'movable_jaw', 'spring', 'worm', 'pin', 'nut'],
      anim: { mode: 'toggle', label: ['Open the jaw', 'افتح البق'], parts: { movable_jaw: { slide: [0, 0, 1.0] }, worm: { rot: [0, 0, 1], a: [0, 1200] } } },
      quiz: [
        { q: ['Which way should the force go on an adjustable wrench?', 'القوة المفروض تيجي على أنهي بق في المفتاح الفرنساوي؟'], a: ['Into the fixed jaw', 'على البق الثابت'], w: [['Into the sliding jaw', 'على البق المتحرك'], ['It does not matter', 'مش فارقة'], ['Along the handle', 'على طول الدراع']] },
        { q: ['The jaw opens by itself while you pull. Likely cause?', 'البق بيفتح لوحده وانت بتشد. السبب غالباً؟'], a: ['Worn worm or rack teeth', 'الحلزونة أو الجريدة دايبة'], w: [['Nut is too hard', 'الصامولة ناشفة'], ['Handle too short', 'الدراع قصير'], ['Too much oil', 'زيت كتير']] },
      ],
    });
  })();

  /* ---------------- torque wrench, click type, 1/2" drive ---------------- */
  (function () {
    const ticks = []; for (let i = 0; i <= 12; i++) ticks.push({ t: 'box', w: 0.05, h: 0.02, d: i % 4 === 0 ? 0.9 : 0.5, p: [f3(-3 + i * 0.5), 1.33, 0], m: 'black' });
    const grip = []; for (let i = 0; i < 6; i++) grip.push({ t: 'torus', R: 1.75, r: 0.08, ax: 'x', p: [f3(-13.5 + i * 1.7), 0, 0], m: 'black' });
    const mic = []; for (let k = 0; k < 20; k++) { const a = k * 18; mic.push({ t: 'box', w: 0.35, h: 0.02, d: 0.03, rot: [a, 0, 0], p: [-3.75, f3(1.62 * Math.cos(a * D)), f3(1.62 * Math.sin(a * D))], m: 'white' }); }
    M.add({
      id: 'torque_wrench', cat: 'tools',
      name: ['Torque wrench (click type, 1/2")', 'مفتاح عزم (تكة، 1/2 بوصة)'],
      info: {
        what: ['Ratchet wrench that clicks and gives a small jerk when the set torque is reached. Inside, a spring presses a toggle block against the end of the head lever.', 'مفتاح سقاطة بيدّي تكة وخبطة خفيفة لما يوصل للعزم المظبوط. جواه سوستة بتضغط بلوكة صغيرة (توجل) على آخر دراع الراس.'],
        use: ['Critical bolts: pump and motor feet, couplings, flanges with PTFE gaskets, tablet press turret and punch guide bolts, gearbox covers.', 'المسامير المهمة: رجول الطلمبات والمواتير، الكوبلنج، الفلانشات بجوانات تيفلون، مسامير برج المكبس وجايد البنط، أغطية الجيربوكس.'],
        how: ['Unlock the knob, turn the handle until the main scale plus the handle scale show the torque, lock it. Pull slowly at the centre of the grip and stop at the click. Torque = force × length to the drive.', 'فك القفل، لف الإيد لحد ما التدريج الأساسي مع تدريج الإيد يدوك العزم، واقفل. اسحب بالراحة من نص الإيد ووقف عند التكة. العزم = القوة × المسافة لحد المربع.'],
        fail: ['Out of calibration (spring fatigue, dropped tool), no click when overloaded, slipping ratchet pawl, scale moved because the lock was left open.', 'معايرته باظت (السوستة تعبت أو المفتاح وقع)، مبيدّيش تكة لما يتحمل زيادة، السقاطة بتفوّت، التدريج اتحرك عشان القفل كان مفتوح.'],
        pm: ['Store at the lowest setting, never use it to loosen bolts, never pull past the click. Calibrate every year or 5000 cycles (ISO 6789, ±4 %) and after any drop.', 'شيله على أقل قيمة، متفكش بيه مسامير، ومتكملش شد بعد التكة. معايرة كل سنة أو 5000 مرة (ISO 6789، ±4%) وبعد أي وقعة.'],
      },
      cut: 'z',
      parts: [
        { id: 'tube', name: ['Body tube', 'ماسورة الجسم'], role: ['Hollow body: holds the lever pivot, the spring and the adjuster.', 'الجسم المجوف: فيه محور الدراع والسوستة وجوزة الضبط.'], mat: 'chrome', ex: [0, 0, 0],
          s: [{ t: 'cyl', r: 1.3, ri: 1.1, h: 28, ax: 'x', p: [2, 0, 0] }, { t: 'cyl', r: 1.42, ri: 1.25, h: 1.0, ax: 'x', p: [15.5, 0, 0] }] },
        { id: 'scale', name: ['Main scale', 'التدريج الأساسي'], role: ['Lines on the tube: each line is a coarse torque step (for example 10 N·m).', 'خطوط على الماسورة: كل خط خطوة عزم كبيرة (مثلاً 10 نيوتن متر).'], mat: 'white', ex: [0, 3, 0], cut: false,
          s: [{ t: 'cyl', r: 1.315, ri: 1.3, h: 6.6, ax: 'x', p: [0, 0, 0], m: '#e9e4c8' }, ...ticks] },
        { id: 'head', name: ['Head and inner lever', 'الراس ودراعها الداخلي'], role: ['One forged piece: head outside, long lever inside the tube. It turns a little on the pivot pin when it clicks.', 'قطعة واحدة: الراس بره ودراع طويل جوه الماسورة. بتلف شوية على المحور لما تدّي تكة.'], mat: 'chrome', o: [14, 0, 0], ex: [16, 0, 0],
          s: [{ t: 'box', w: 14.6, h: 0.9, d: 0.7, p: [-5.3, 0, 0], cut: false }, { t: 'cyl', r1: 0.9, r2: 1.25, h: 2.6, ax: 'x', p: [3.3, 0, 0] },
            { t: 'cyl', r: 2.1, ri: 1.5, h: 1.6, p: [6.5, 0, 0] }, { t: 'cyl', r: 0.55, h: 0.35, p: [6.5, 0.95, 0], m: 'black' }, { t: 'box', w: 1.6, h: 0.3, d: 0.5, p: [6.5, 1.0, 0], m: 'black' }] },
        { id: 'ratchet', name: ['Ratchet and square drive', 'السقاطة والمربع'], role: ['Toothed wheel with a pawl, ends in the 1/2" square drive for the socket.', 'ترس مسنن عليه سقاطة، وآخره المربع نص بوصة اللي بيركب فيه اللقمة.'], mat: 'steel', o: [14, 0, 0], ex: [16, -4, 0], cut: false,
          s: [{ t: 'gear', r: 1.48, rr: 1.36, teeth: 24, h: 1.5, ri: 0.4, p: [6.5, 0, 0] }, { t: 'box', w: 1.27, h: 1.6, d: 1.27, p: [6.5, -1.55, 0] }] },
        { id: 'pivot_pin', name: ['Pivot pin', 'مسمار المحور'], role: ['The head lever rocks on this pin.', 'دراع الراس بيتأرجح على المسمار ده.'], mat: 'steel', ex: [0, 5, 0], cut: false,
          s: [{ t: 'cyl', r: 0.25, h: 2.9, p: [14, 0, 0] }] },
        { id: 'toggle', name: ['Toggle block (cam)', 'بلوكة التوجل (الكامة)'], role: ['Square block between lever and plunger. At the set torque it tips over: that is the click.', 'بلوكة مربعة بين الدراع والبستم. عند العزم المظبوط بتتقلب: دي التكة.'], mat: 'steel', o: [1.0, 0, 0], ex: [0, 0, 5], cut: false,
          s: [{ t: 'box', w: 0.7, h: 0.7, d: 0.7 }] },
        { id: 'plunger', name: ['Spring plunger', 'بستم السوستة'], role: ['Pushes the toggle with the spring force.', 'بيزق التوجل بقوة السوستة.'], mat: 'steel', ex: [0, 0, 5], cut: false,
          s: [{ t: 'cyl', r: 0.95, h: 1.0, ax: 'x', p: [-0.3, 0, 0] }, { t: 'cyl', r1: 0.35, r2: 0.7, h: 0.4, ax: 'x', p: [0.4, 0, 0] }] },
        { id: 'spring', name: ['Main spring', 'السوستة الرئيسية'], role: ['More compression = higher torque before the toggle tips.', 'كل ما تتضغط أكتر العزم يزيد قبل ما التوجل يتقلب.'], mat: 'steel', ex: [0, 0, 5], cut: false,
          s: [{ t: 'spring', R: 0.82, r: 0.14, turns: 12, len: 8.5, ax: 'x', p: [-5.05, 0, 0] }] },
        { id: 'adjuster', name: ['Adjusting screw', 'جوزة الضبط'], role: ['Threaded plug moved by the handle; it sets the spring compression.', 'سدادة مقلوظة الإيد بتحركها، بتحدد ضغط السوستة.'], mat: 'brass', ex: [0, 0, 5], cut: false,
          s: [{ t: 'cyl', r: 0.95, h: 2.4, ax: 'x', p: [-10.5, 0, 0] }, { t: 'spring', R: 1.0, r: 0.06, turns: 10, len: 2.2, ax: 'x', p: [-10.5, 0, 0] }] },
        { id: 'handle', name: ['Handle with micrometer scale', 'الإيد وتدريجها الدقيق'], role: ['Turn to set. Its ring of lines gives the fine steps between main scale lines.', 'بتلفها عشان تظبط. خطوطها بتدي الخطوات الصغيرة بين خطوط التدريج الأساسي.'], mat: 'black', ex: [-11, 0, 0],
          s: [{ t: 'cyl', r: 1.75, ri: 1.31, h: 11, ax: 'x', p: [-9.0, 0, 0], m: 'rubber' }, { t: 'cyl', r1: 1.45, r2: 1.75, h: 0.8, ax: 'x', p: [-3.9, 0, 0], m: 'chrome' }, ...grip, ...mic] },
        { id: 'lock_knob', name: ['Lock knob', 'زرار القفل'], role: ['Locks the handle so the setting cannot move while you work.', 'بيقفل الإيد عشان الضبط ميتحركش وانت شغال.'], mat: 'red', ex: [-17, 0, 0],
          s: [{ t: 'gear', r: 1.5, rr: 1.38, teeth: 24, h: 1.6, ax: 'x', p: [-15.3, 0, 0] }] },
      ],
      steps: ['tube', 'pivot_pin', 'head', 'ratchet', 'toggle', 'plunger', 'spring', 'adjuster', 'handle', 'lock_knob', 'scale'],
      anim: { mode: 'toggle', label: ['Pull to the click', 'اسحب للتكة'], parts: { head: { rot: [0, 1, 0], a: [0, 2.5] }, ratchet: { rot: [0, 1, 0], a: [0, 2.5] }, toggle: { rot: [0, 1, 0], a: [0, 35] }, plunger: { slide: [-0.25, 0, 0] } } },
      quiz: [
        { q: ['How should a click torque wrench be stored?', 'مفتاح العزم المفروض يتشال إزاي؟'], a: ['At its lowest setting', 'على أقل قيمة'], w: [['At the highest setting', 'على أعلى قيمة'], ['At the last torque used', 'على آخر عزم استخدمته'], ['Lock knob open', 'والقفل مفتوح']] },
        { q: ['Can you loosen a tight bolt with the torque wrench?', 'ينفع تفك مسمار ناشف بمفتاح العزم؟'], a: ['No, it damages the calibration', 'لأ، بيبوّظ المعايرة'], w: [['Yes, it is the strongest wrench', 'آه، ده أقوى مفتاح'], ['Yes, if you set it to maximum', 'آه لو ظبطته على الأعلى'], ['Only with an extension', 'بس مع تطويلة']] },
        { q: ['What makes the click?', 'إيه اللي بيعمل التكة؟'], a: ['The toggle block tips over against the spring', 'بلوكة التوجل بتتقلب ضد السوستة'], w: [['The ratchet pawl', 'سقاطة الترس'], ['The lock knob', 'زرار القفل'], ['The square drive', 'المربع']] },
      ],
    });
  })();

  /* ---------------- hex keys set (ISO 2936) ---------------- */
  (function () {
    const set = [[2, 5.0, 1.6], [2.5, 5.6, 1.8], [3, 6.3, 2.0], [4, 7.0, 2.5], [5, 8.0, 2.8], [6, 9.0, 3.2], [8, 10.0, 3.6], [10, 11.2, 4.0]];
    const rs = set.map((k) => f3((k[0] / 20) / Math.cos(30 * D)));
    const zs = []; let z = 0; rs.forEach((r, i) => { if (i) z += rs[i - 1] + r + 0.55; zs.push(z); }); const zc = z / 2; for (let i = 0; i < zs.length; i++) zs[i] = f3(zs[i] - zc);
    const hexHole = (zi, r) => { const o = []; for (let k = 0; k < 6; k++) { const a = (90 + k * 60) * D; o.push([f3(Math.cos(a) * (r + 0.03)), f3(-zi + Math.sin(a) * (r + 0.03))]); } return o; };
    const zmax = zs[zs.length - 1] + 1.1;
    const keys = set.map((k, i) => {
      const r = rs[i], L = k[1], l = k[2];
      return { id: 'key' + String(k[0]).replace('.', '_'), name: ['Hex key ' + k[0] + ' mm', 'مفتاح ألن ' + k[0] + ' مم'],
        role: [i === 0 ? 'Smallest key: grub screws and small panels. Long arm ' + (L * 10) + ' mm.' : 'Size ' + k[0] + ' mm across flats, long arm ' + (L * 10) + ' mm.', 'مقاس ' + k[0] + ' مم بين الوشين، الدراع الطويل ' + (L * 10) + ' مم.'],
        mat: 'black', ex: [0, f3(1.5 + i * 0.25), f3((i - 3.5) * 0.9)], cut: true,
        s: [{ t: 'hex', r, h: L - r, ax: 'x', p: [f3((L + r) / 2), 0, zs[i]] }, { t: 'hex', r, h: l - r, p: [0, f3((l + r) / 2), zs[i]] }, { t: 'sph', r: f3(r * 0.98), p: [0, 0, zs[i]] }] };
    });
    M.add({
      id: 'allen_keys', cat: 'tools',
      name: ['Hex (Allen) key set', 'طقم مفاتيح ألن'],
      info: {
        what: ['L-shaped hexagon bars, 2 to 10 mm, kept in a holder. Size = width across flats of the socket in the screw head.', 'عيدان سداسية على شكل L من 2 لحد 10 مم في حامل. المقاس = عرض الخرم السداسي في راس المسمار.'],
        use: ['Socket cap screws on packaging machines, change parts, guards, grub screws on pulleys and couplings, sensor brackets.', 'مسامير الألن في مكن التعبئة والتغليف، قطع التغيير، الجاردات، مسامير الزنق في البكر والكوبلنج، حوامل الحساسات.'],
        how: ['Short arm in the screw and long arm as a lever for torque; long arm in the screw for speed. Push the key fully into the socket before turning.', 'الدراع القصير في المسمار والطويل للعزم، والطويل في المسمار للسرعة. دخّل المفتاح للآخر في الخرم قبل ما تلف.'],
        fail: ['Rounded corners on the key or in the screw socket (wrong size, inch key in a metric screw, not fully inserted), twisted or cracked key.', 'زوايا المفتاح أو خرم المسمار اتبوّظت (مقاس غلط، مفتاح بوصة في مسمار مللي، مش داخل للآخر)، مفتاح ملووي أو مشروخ.'],
        pm: ['Use the exact metric size, replace keys with rounded ends, keep them in the holder in order so the size is found fast. Ball-end keys are only for light turning.', 'استخدم المقاس المللي المظبوط، غيّر المفتاح اللي طرفه اتبوّظ، رجّعه للحامل بالترتيب. مفتاح الكورة للف الخفيف بس.'],
      },
      cut: 'y',
      parts: [
        { id: 'holder', name: ['Holder', 'الحامل'], role: ['Plastic rack that keeps the keys in size order.', 'حامل بلاستيك بيحفظ المفاتيح بترتيب المقاس.'], mat: 'red', ex: [0, -4, 0],
          s: [{ t: 'ext', ax: 'x', d: 2.2, p: [2.4, 0, 0], pts: [[-0.9, -zmax], [0.9, -zmax], [0.9, zmax], [-0.9, zmax]].map((q) => [q[0], -q[1]]), holes: set.map((k, i) => hexHole(zs[i], rs[i])) }] },
        ...keys,
      ],
      quiz: [
        { q: ['How do you get the highest torque from a hex key?', 'تاخد أعلى عزم من مفتاح الألن إزاي؟'], a: ['Short arm in the screw, pull on the long arm', 'القصير في المسمار وتشد من الطويل'], w: [['Long arm in the screw', 'الطويل في المسمار'], ['Use the ball end', 'استخدم طرف الكورة'], ['Hit it with a hammer', 'تخبط عليه بشاكوش']] },
        { q: ['Why do hex screw sockets round off most often?', 'ليه خرم الألن بيتبوّظ أغلب الوقت؟'], a: ['Wrong or inch key, or key not fully inserted', 'مقاس غلط أو بوصة أو المفتاح مش داخل للآخر'], w: [['Too much grease', 'شحم كتير'], ['Screw too long', 'المسمار طويل'], ['Holder missing', 'الحامل مش موجود']] },
      ],
    });
  })();

  /* ---------------- vernier caliper 0-150 mm ---------------- */
  (function () {
    const main = []; for (let i = 0; i <= 150; i++) { const L = i % 10 === 0 ? 0.5 : i % 5 === 0 ? 0.38 : 0.26; main.push({ t: 'box', w: 0.012, h: 0.012, d: L, p: [f3(1.0 + i * 0.1), 0.18, f3(-0.7 + L / 2)], m: 'black' }); }
    const vern = []; for (let j = 0; j <= 10; j++) { const L = j % 5 === 0 ? 0.36 : 0.25; vern.push({ t: 'box', w: 0.012, h: 0.012, d: L, p: [f3(1.0 + j * 0.09), 0.381, f3(-0.15 + L / 2)], m: 'black' }); }
    M.add({
      id: 'vernier_caliper', cat: 'tools',
      name: ['Vernier caliper (0-150 mm)', 'قدمة ورنية (0-150 مم)'],
      info: {
        what: ['Measuring tool with a main scale on the beam and a vernier scale on the sliding jaw. Measures outside, inside and depth to 0.1 mm (finer types 0.05 or 0.02 mm).', 'أداة قياس فيها تدريج أساسي على المسطرة وتدريج ورنية على البق المتحرك. بتقيس بره وجوه والعمق لحد 0.1 مم (في أنواع 0.05 و0.02).'],
        use: ['Shaft and bore sizes, bearing and seal sizes before ordering, punch lengths, change part checks, spring lengths.', 'مقاس العمدان والخروم، مقاسات البلي والسيلات قبل الطلب، أطوال البنط، مراجعة قطع التغيير، أطوال السوست.'],
        how: ['Read the main scale mm just left of the vernier zero, then find the one vernier line that lines up exactly with a main line: its number × 0.1 mm is added. Example: 25 mm + line 4 = 25.4 mm.', 'اقرا الملليمترات على المسطرة قبل صفر الورنية، وبعدين دوّر على خط الورنية اللي ماشي مع خط في المسطرة بالظبط: رقمه × 0.1 مم يتزود. مثال: 25 مم + الخط 4 = 25.4 مم.'],
        fail: ['Zero error when the jaws are closed, worn or burred jaw tips, loose slider (play), bent depth rod, reading at an angle (parallax).', 'غلطة صفر والبقين مقفولين، أطراف البق دايبة أو فيها زوايد، الجرار سايب (لعب)، عمود العمق معووج، القراية من زاوية (خطأ نظر).'],
        pm: ['Clean the jaws and check zero before use, measure square with light even pressure, look straight at the scale, never use it as a scriber or spanner. Keep it in its box and in the calibration plan.', 'نضّف البق واتأكد من الصفر قبل الاستخدام، قيس مستقيم بضغط خفيف، بص على التدريج عمودي، متستخدمهاش شنكار ولا مفتاح. خليها في علبتها وفي خطة المعايرة.'],
      },
      cut: 'z',
      parts: [
        { id: 'beam', name: ['Beam with main scale and fixed jaws', 'المسطرة والتدريج الأساسي والبق الثابت'], role: ['Hardened beam, 1 mm divisions, with the fixed outside and inside jaws.', 'مسطرة مقساة بتدريج كل 1 مم، فيها البق الثابت للقياس الخارجي والداخلي.'], mat: 'sst', ex: [0, 0, 0],
          s: [{ t: 'box', w: 22.6, h: 0.35, d: 1.6, p: [9.7, 0, 0] },
            { t: 'ext', d: 0.35, pts: XZ([[-1.6, -0.8], [0, -0.8], [0, -4.2], [-0.25, -4.8], [-0.6, -4.8], [-1.6, -3.6]]) },
            { t: 'ext', d: 0.25, pts: XZ([[-0.9, 0.8], [0, 0.8], [0, 2.0], [-0.15, 2.4], [-0.4, 2.4], [-0.9, 1.4]]) }, ...main] },
        { id: 'depth_rod', name: ['Depth rod', 'عمود العمق'], role: ['Thin bar fixed to the slider that runs in a groove in the beam and comes out of the end for depth.', 'عود رفيع متثبت في الجرار ماشي في مجرى في المسطرة، بيطلع من آخرها لقياس العمق.'], mat: 'steel', ex: [0, -2.2, 0],
          s: [{ t: 'box', w: 17.5, h: 0.12, d: 0.35, p: [12.25, -0.11, 0] }] },
        { id: 'gib', name: ['Gib spring', 'سوستة الجرار (جيب)'], role: ['Leaf spring inside the slider: removes play so the jaw stays square.', 'سوستة شريحة جوه الجرار: بتلغي اللعب عشان البق يفضل مستقيم.'], mat: 'steel', ex: [24, 0, 3.5], cut: false,
          s: [{ t: 'box', w: 4.6, h: 0.3, d: 0.05, p: [2.75, 0, 0.83] }] },
        { id: 'slider', name: ['Sliding jaw with vernier', 'البق المتحرك والورنية'], role: ['Carries the moving jaws and the vernier scale: 10 lines over 9 mm, so each line = 0.1 mm.', 'شايل البق المتحرك وتدريج الورنية: 10 خطوط على 9 مم، يعني كل خط = 0.1 مم.'], mat: 'sst', ex: [24, 0, 0],
          s: [{ t: 'box', w: 5.5, h: 0.2, d: 2.06, p: [2.75, -0.275, 0] }, { t: 'box', w: 5.5, h: 0.2, d: 1.21, p: [2.75, 0.275, 0.455] },
            { t: 'box', w: 5.5, h: 0.75, d: 0.2, p: [2.75, 0, -0.93] }, { t: 'box', w: 5.5, h: 0.75, d: 0.2, p: [2.75, 0, 0.96] },
            { t: 'ext', d: 0.35, pts: XZ([[0, -1.0], [1.6, -1.0], [1.6, -3.6], [0.6, -4.8], [0.25, -4.8], [0, -4.2]]) },
            { t: 'ext', d: 0.25, pts: XZ([[0, 1.0], [0.9, 1.0], [0.9, 1.4], [0.4, 2.4], [0.15, 2.4], [0, 2.0]]) }, ...vern] },
        { id: 'thumb_wheel', name: ['Thumb roller', 'عجلة الصباع'], role: ['Lets you move the slider gently with the thumb for even pressure.', 'بتخليك تحرك الجرار بالراحة بصباعك عشان الضغط يبقى ثابت.'], mat: 'steel', ex: [24, 0, -3], cut: false,
          s: [{ t: 'gear', r: 0.35, rr: 0.3, teeth: 14, h: 0.3, p: [4.8, 0, -1.25] }, { t: 'cyl', r: 0.08, h: 0.8, p: [4.8, 0, -1.25] }] },
        { id: 'lock_screw', name: ['Lock screw', 'مسمار التثبيت'], role: ['Locks the slider to keep a reading or to use the caliper as a gauge.', 'بيثبت الجرار عشان تحتفظ بالقراية أو تستخدمها كمقاس ثابت.'], mat: 'steel', ex: [24, 3, 0], cut: false,
          s: [{ t: 'cyl', r: 0.12, h: 0.4, p: [3.9, 0.45, 0.6] }, { t: 'gear', r: 0.32, rr: 0.28, teeth: 16, h: 0.25, p: [3.9, 0.68, 0.6] }] },
      ],
      steps: ['beam', 'depth_rod', 'gib', 'slider', 'thumb_wheel', 'lock_screw'],
      anim: { mode: 'toggle', label: ['Open to 25.4 mm', 'افتح لـ 25.4 مم'], parts: { slider: { slide: [2.54, 0, 0] }, depth_rod: { slide: [2.54, 0, 0] }, gib: { slide: [2.54, 0, 0] }, thumb_wheel: { slide: [2.54, 0, 0] }, lock_screw: { slide: [2.54, 0, 0] } } },
      quiz: [
        { q: ['Vernier zero is just past 25 on the main scale and vernier line 4 lines up. Reading?', 'صفر الورنية بعد 25 على المسطرة بشوية وخط الورنية رقم 4 ماشي مع خط. القراية؟'], a: ['25.4 mm', '25.4 مم'], w: [['29 mm', '29 مم'], ['25.04 mm', '25.04 مم'], ['4.25 mm', '4.25 مم']] },
        { q: ['What do you check first, before measuring?', 'أول حاجة تتأكد منها قبل القياس؟'], a: ['Clean jaws and zero when closed', 'البق نضيف والصفر مظبوط وهو مقفول'], w: [['Battery level', 'البطارية'], ['That the lock screw is tight', 'إن مسمار التثبيت مربوط'], ['The depth rod is out', 'عمود العمق طالع']] },
      ],
    });
  })();

  /* ---------------- outside micrometer 0-25 mm (frame standing, spindle along X) ---------------- */
  (function () {
    const frame = [[-1.8, 0.9], [-1.8, -2.8], [-1.2, -4.2], [0, -4.9], [3.0, -4.9], [4.2, -4.2], [4.8, -2.8], [4.8, 1.0], [2.7, 1.0], [2.7, -1.0], [2.4, -2.6], [1.7, -3.3], [0.4, -3.3], [-0.1, -2.7], [-0.3, -1.0], [-0.3, 0.9]];
    const sl = [{ t: 'box', w: 2.8, h: 0.02, d: 0.025, p: [8.25, 0.955, 0], m: 'black' }];
    for (let i = 0; i <= 50; i++) { const x = f3(7.0 + i * 0.05); if (x > 9.6) break; const mm = i % 2 === 0, L = mm ? (i % 10 === 0 ? 0.34 : 0.24) : 0.18; sl.push({ t: 'box', w: 0.015, h: 0.02, d: L, p: [x, 0.952, f3(mm ? -L / 2 : L / 2)], m: 'black' }); }
    const th = []; for (let k = 0; k < 50; k++) { const a = k * 7.2, L = k % 5 === 0 ? 0.5 : 0.3; th.push({ t: 'box', w: L, h: 0.02, d: 0.025, rot: [a, 0, 0], p: [f3(7.38 + L / 2), f3(1.105 * Math.cos(a * D)), f3(1.105 * Math.sin(a * D))], m: 'black' }); }
    M.add({
      id: 'micrometer', cat: 'tools',
      name: ['Outside micrometer (0-25 mm)', 'ميكرومتر خارجي (0-25 مم)'],
      info: {
        what: ['Precision screw gauge: a spindle with a 0.5 mm pitch thread turns in a nut. One turn of the thimble = 0.5 mm, 50 thimble lines = 0.01 mm each.', 'مقياس دقيق بالقلاووظ: عمود سنه 0.5 مم بيلف في صامولة. لفة الجلبة = 0.5 مم، وعليها 50 خط كل خط = 0.01 مم.'],
        use: ['Shaft journal and bearing seat sizes, punch tip and tablet thickness checks, shim and gasket thickness, wear checks on rollers.', 'مقاس العمدان ومكان البلية، مراجعة رؤوس البنط وتخانة القرص، تخانة الشرائح والجوانات، قياس التآكل في الرولات.'],
        how: ['Read the last whole mm line on the sleeve, add 0.5 if a half line shows, then add the thimble line on the datum × 0.01. Example: 7 + 0.5 + 0.35 = 7.85 mm. Always close with the ratchet.', 'اقرا آخر ملليمتر ظاهر على الجلبة الثابتة، زوّد 0.5 لو خط النص باين، وبعدين زوّد خط الجلبة اللي على الخط الأفقي × 0.01. مثال: 7 + 0.5 + 0.35 = 7.85 مم. اقفل دايماً بالسقاطة.'],
        fail: ['Zero error, worn or dirty anvil faces, too much force (not using the ratchet), heat from the hand expanding the frame, sticky spindle.', 'غلطة صفر، وش السندان والعمود دايب أو وسخ، ضغط زيادة (من غير سقاطة)، حرارة الإيد بتمدد الفريم، العمود بيزرجن.'],
        pm: ['Wipe the faces, check zero with the faces closed (or a setting standard), hold it by the insulated pad, store with the faces slightly apart, calibrate on the plan.', 'امسح الوشوش، راجع الصفر وهي مقفولة (أو بمعيار ضبط)، امسكه من العازل، شيله والوشوش مفتوحة سنة، ومعايرة حسب الخطة.'],
      },
      cut: 'z',
      parts: [
        { id: 'frame', name: ['C-frame', 'الفريم (حرف C)'], role: ['Stiff forged frame that holds anvil and sleeve in line.', 'فريم جامد ماسك السندان والجلبة على خط واحد.'], mat: 'castg', ex: [0, 0, 0],
          s: [{ t: 'ext', ax: 'z', d: 0.9, pts: frame }] },
        { id: 'heat_pad', name: ['Insulating pads', 'العازل الحراري'], role: ['Hold the tool here so hand heat does not grow the frame.', 'امسك من هنا عشان حرارة إيدك متمددش الفريم.'], mat: 'black', ex: [0, -2.6, 0],
          s: [{ t: 'box', w: 3.4, h: 1.1, d: 1.1, p: [1.7, -4.1, 0] }] },
        { id: 'anvil', name: ['Anvil (carbide face)', 'السندان (وش كاربيد)'], role: ['Fixed measuring face, lapped flat.', 'وش القياس الثابت، ممسوح مستوي.'], mat: 'steel', ex: [-3, 0, 0],
          s: [{ t: 'cyl', r: 0.4, h: 1.2, ax: 'x', p: [-0.6, 0, 0] }, { t: 'cyl', r: 0.4, h: 0.12, ax: 'x', p: [-0.06, 0, 0], m: 'sic' }] },
        { id: 'sleeve', name: ['Sleeve (barrel) with mm scale', 'الجلبة الثابتة وتدريج المللي'], role: ['Datum line with whole mm on one side and half mm on the other.', 'خط أساسي، الملليمترات على ناحية وأنصاف المللي على الناحية التانية.'], mat: 'chrome', ex: [2, 0, 0],
          s: [{ t: 'lathe', ax: 'x', pts: sharp([[0.34, 4.8], [0.95, 4.8], [0.95, 10.6], [0.64, 10.6], [0.64, 7.4], [0.34, 7.4], [0.34, 4.8]], 0.01) }, ...sl] },
        { id: 'spindle_nut', name: ['Spindle nut (inside)', 'صامولة العمود (جوه)'], role: ['Precision threaded nut, 0.5 mm pitch, split so wear can be taken up.', 'صامولة دقيقة سنها 0.5 مم، مشقوقة عشان تعوض التآكل.'], mat: 'bronze', ex: [9, 0, 0],
          s: [{ t: 'cyl', r: 0.62, ri: 0.36, h: 2.4, ax: 'x', p: [8.6, 0, 0] }] },
        { id: 'adjust_nut', name: ['Adjusting nut', 'صامولة ضبط الخلوص'], role: ['Closes the split nut to remove thread play.', 'بتقفل الصامولة المشقوقة عشان تلغي لعب السن.'], mat: 'brass', ex: [9, 0, 0],
          s: [{ t: 'cyl', r: 0.85, ri: 0.36, h: 0.5, ax: 'x', p: [10.85, 0, 0] }] },
        { id: 'spindle', name: ['Spindle with 0.5 mm thread', 'العمود وسنه 0.5 مم'], role: ['Ground screw: each full turn moves the face 0.5 mm.', 'قلاووظ مجلّخ: كل لفة كاملة بتحرك الوش 0.5 مم.'], mat: 'chrome', ex: [3, 2.6, 0], cut: false,
          s: [{ t: 'cyl', r: 0.32, h: 12.0, ax: 'x', p: [6.0, 0, 0] }, { t: 'spring', R: 0.34, r: 0.045, turns: 48, len: 2.4, ax: 'x', p: [8.6, 0, 0] }] },
        { id: 'thimble', name: ['Thimble (50 lines)', 'الجلبة الدوارة (50 خط)'], role: ['Fixed to the spindle; 50 lines around, each = 0.01 mm.', 'متثبتة في العمود؛ عليها 50 خط، كل خط = 0.01 مم.'], mat: 'chrome', ex: [14, 0, 0],
          s: [{ t: 'lathe', ax: 'x', pts: sharp([[0.96, 7.0], [0.98, 7.0], [1.1, 7.35], [1.1, 11.6], [0.95, 11.9], [0.33, 11.9], [0.33, 11.6], [0.96, 11.6], [0.96, 7.0]], 0.01) }, ...th] },
        { id: 'ratchet', name: ['Ratchet stop', 'السقاطة (الطقطاقة)'], role: ['Slips at a fixed force so every reading has the same pressure.', 'بتفوّت عند قوة ثابتة عشان كل قراية بنفس الضغط.'], mat: 'chrome', ex: [15, 0, 0],
          s: [{ t: 'gear', r: 0.6, rr: 0.54, teeth: 16, h: 1.0, ax: 'x', p: [12.6, 0, 0] }, { t: 'cyl', r: 0.5, h: 0.3, ax: 'x', p: [12.0, 0, 0] }] },
        { id: 'lock', name: ['Spindle lock', 'قفل العمود'], role: ['Locks the spindle to hold a reading.', 'بيقفل العمود عشان يحتفظ بالقراية.'], mat: 'black', ex: [0, 4.5, 0],
          s: [{ t: 'cyl', r: 0.35, h: 0.5, p: [3.7, 1.25, 0] }, { t: 'box', w: 1.4, h: 0.25, d: 0.4, p: [4.2, 1.5, 0] }] },
      ],
      steps: ['frame', 'anvil', 'heat_pad', 'sleeve', 'spindle_nut', 'spindle', 'adjust_nut', 'thimble', 'ratchet', 'lock'],
      anim: { mode: 'toggle', label: ['Open to 7.85 mm', 'افتح لـ 7.85 مم'], parts: { spindle: { slide: [0.785, 0, 0], rot: [1, 0, 0], a: [0, -5652] }, thimble: { slide: [0.785, 0, 0], rot: [1, 0, 0], a: [0, -5652] }, ratchet: { slide: [0.785, 0, 0], rot: [1, 0, 0], a: [0, -5652] } } },
      quiz: [
        { q: ['Sleeve shows 7 mm and the half line, thimble line 35 is on the datum. Reading?', 'الجلبة باين عليها 7 مم وخط النص، وخط 35 على الخط الأفقي. القراية؟'], a: ['7.85 mm', '7.85 مم'], w: [['7.35 mm', '7.35 مم'], ['10.5 mm', '10.5 مم'], ['7.035 mm', '7.035 مم']] },
        { q: ['Why close the micrometer with the ratchet?', 'ليه تقفل الميكرومتر بالسقاطة؟'], a: ['Same measuring force every time', 'نفس قوة القياس كل مرة'], w: [['It is faster', 'أسرع'], ['To lock the spindle', 'عشان يقفل العمود'], ['To set zero', 'عشان يظبط الصفر']] },
      ],
    });
  })();

  /* ---------------- dial indicator on magnetic base ---------------- */
  (function () {
    const C = [12, 12];
    const dial = [{ t: 'cyl', r: 2.65, h: 0.04, ax: 'z', p: [C[0], C[1], 0.6], m: 'white' }, { t: 'torus', R: 2.78, r: 0.16, ax: 'z', p: [C[0], C[1], 0.72], m: 'chrome' },
      { t: 'cyl', r: 2.66, h: 0.06, ax: 'z', p: [C[0], C[1], 0.82], m: 'glass' }, { t: 'torus', R: 0.62, r: 0.03, ax: 'z', p: [C[0], C[1] + 1.15, 0.63], m: 'black' }];
    for (let k = 0; k < 100; k++) { const a = k * 3.6, L = k % 10 === 0 ? 0.42 : k % 5 === 0 ? 0.3 : 0.2, R = 2.5 - L / 2; dial.push({ t: 'box', w: 0.025, h: L, d: 0.01, rot: [0, 0, -a], p: [f3(C[0] + R * Math.sin(a * D)), f3(C[1] + R * Math.cos(a * D)), 0.625], m: 'black' }); }
    const rack = []; for (let y = 9.6; y <= 11.41; y += 0.12) rack.push({ t: 'box', w: 0.12, h: 0.05, d: 0.3, p: [11.74, f3(y), -0.4] });
    M.add({
      id: 'dial_indicator', cat: 'tools',
      name: ['Dial indicator on magnetic base', 'ساعة قياس على قاعدة مغناطيس'],
      info: {
        what: ['A plunger moves a rack, the rack turns a gear train and the needle. Usually 0.01 mm per line, one turn = 1 mm. The magnetic base and arm hold it in any position.', 'البستم بيحرك جريدة مسننة، والجريدة بتلف تروس والإبرة. غالباً كل خط 0.01 مم ولفة كاملة = 1 مم. القاعدة المغناطيس والدراع بيمسكوها في أي وضع.'],
        use: ['Shaft run-out and end play, pump and motor coupling alignment, flatness and parallelism of plates, setting of cams, guides and turret height on presses.', 'قياس التطويح والتلعب المحوري للعمدان، ضبط استقامة كوبلنج الطلمبة والموتور، استواء وتوازي الألواح، ضبط الكامات والدلايل وارتفاع البرج في المكابس.'],
        how: ['Touch the surface square to the plunger, preload about half a turn, set the bezel to zero, then turn the shaft. Total needle swing = total indicated run-out (TIR).', 'خلي البستم عمودي على السطح، اضغطه حوالي نص لفة، صفّر البرواز، ولف العمود. مدى حركة الإبرة كله = التطويح الكلي (TIR).'],
        fail: ['Sticky plunger from dirt or coolant, jumping needle from a damaged gear after a drop, base not holding on painted or thin steel, arm sag giving false readings.', 'البستم بيزرجن من الوسخ أو المياه، الإبرة بتنط من ترس مضروب بعد وقعة، القاعدة مش ماسكة على حديد مدهون أو رفيع، الدراع بيهبط فيدي قراية غلط.'],
        pm: ['Keep the plunger dry and clean (no oil), tighten all arm clamps, switch the magnet OFF before moving it, check it against a gauge block on the plan.', 'خلي البستم نضيف وناشف (من غير زيت)، اربط كل مفاصل الدراع، اقفل المغناطيس قبل ما تشيلها، وراجعها على بلوك معيار حسب الخطة.'],
      },
      cut: 'z',
      parts: [
        { id: 'base', name: ['Magnetic base', 'القاعدة المغناطيس'], role: ['Switchable magnet block with a V groove for round parts.', 'بلوك مغناطيس بيتفتح ويتقفل، تحته مجرى V للحاجات المدورة.'], mat: 'iron', ex: [0, 0, 0],
          s: [{ t: 'ext', ax: 'z', d: 5, pts: [[-2.5, 0], [-1.0, 0], [0, 1.0], [1.0, 0], [2.5, 0], [2.5, 5.5], [-2.5, 5.5]] }, { t: 'box', w: 0.4, h: 4.5, d: 5.02, p: [0, 3.25, 0], m: 'brass' }] },
        { id: 'switch', name: ['ON/OFF knob', 'مفتاح التشغيل'], role: ['Turns the inner magnet: ON holds, OFF releases.', 'بيلف المغناطيس اللي جوه: ON يمسك، OFF يسيب.'], mat: 'black', ex: [0, 0, 3], cut: false,
          s: [{ t: 'cyl', r: 0.9, h: 0.6, ax: 'z', p: [0, 3.0, 2.8] }, { t: 'box', w: 2.4, h: 0.45, d: 0.45, p: [0, 3.0, 3.25], m: 'red' }] },
        { id: 'post', name: ['Post', 'العمود الرأسي'], role: ['Steel rod screwed into the base.', 'عمود حديد مقلوظ في القاعدة.'], mat: 'chrome', ex: [0, 2, 0], cut: false,
          s: [{ t: 'cyl', r: 0.6, h: 14, p: [0, 12.5, 0] }, { t: 'hex', r: 0.9, h: 0.6, p: [0, 5.8, 0], m: 'steel' }] },
        { id: 'clamp', name: ['Swivel clamp', 'مفصل الزنق'], role: ['Holds the arm on the post at any height and angle.', 'بيمسك الدراع على العمود في أي ارتفاع وزاوية.'], mat: 'steel', ex: [0, 12, 0],
          s: [{ t: 'box', w: 2.2, h: 2.0, d: 3.6, p: [0, 12, -0.8] }, { t: 'cyl', r: 0.6, h: 1.2, ax: 'x', p: [1.6, 12, -0.8], m: 'black' }] },
        { id: 'arm', name: ['Arm', 'الدراع'], role: ['Horizontal rod that reaches the point to measure.', 'عمود أفقي بيوصل للنقطة اللي هتقيسها.'], mat: 'chrome', ex: [0, 12, -4], cut: false,
          s: [{ t: 'cyl', r: 0.5, h: 14, ax: 'x', p: [5.5, 12, -1.6] }] },
        { id: 'holder', name: ['Indicator holder', 'ماسك الساعة'], role: ['Small clamp that holds the back lug of the indicator.', 'زنقة صغيرة بتمسك ودن الساعة من ورا.'], mat: 'steel', ex: [3, 12, -4],
          s: [{ t: 'cyl', r: 0.8, h: 1.0, ax: 'z', p: [12, 12, -1.6] }, { t: 'cyl', r: 0.2, h: 1.0, ax: 'x', p: [13.1, 12, -1.6], m: 'black' }] },
        { id: 'case', name: ['Case, stem and lug', 'الجسم والرقبة والودن'], role: ['Holds the gears; the stem guides the plunger.', 'شايل التروس، والرقبة بتوجّه البستم.'], mat: 'chrome', ex: [0, 0, 0],
          s: [{ t: 'cyl', r: 2.9, ri: 2.65, h: 1.5, ax: 'z', p: [12, 12, 0] }, { t: 'cyl', r: 2.9, h: 0.2, ax: 'z', p: [12, 12, -0.65] },
            { t: 'cyl', r: 0.7, h: 0.5, ax: 'z', p: [12, 12, -1.0] }, { t: 'cyl', r: 0.45, ri: 0.22, h: 1.8, p: [12, 8.2, -0.4] }, { t: 'cyl', r: 0.4, ri: 0.22, h: 0.6, p: [12, 15.1, -0.4] }] },
        { id: 'plunger', name: ['Plunger with rack', 'البستم والجريدة'], role: ['Moves up when it touches the part; its rack turns the pinion.', 'بيطلع لفوق لما يلمس القطعة، وجريدته بتلف الترس الصغير.'], mat: 'steel', ex: [0, -5, 0], cut: false,
          s: [{ t: 'cyl', r: 0.2, h: 10.4, p: [12, 10.1, -0.4] }, { t: 'sph', r: 0.25, p: [12, 4.95, -0.4], m: 'ceramic' }, { t: 'cyl', r: 0.32, h: 0.3, p: [12, 15.5, -0.4] }, ...rack] },
        { id: 'spring', name: ['Return spring', 'سوستة الرجوع'], role: ['Pushes the plunger back down onto the surface.', 'بترجّع البستم لتحت على السطح.'], mat: 'steel', ex: [0, 0, 4.5], cut: false,
          s: [{ t: 'spring', R: 0.32, r: 0.04, turns: 8, len: 1.8, p: [12, 13.4, -0.4] }] },
        { id: 'gear_train', name: ['Pinion and large gear', 'الترس الصغير والترس الكبير'], role: ['Pinion on the rack, large gear on the same shaft: they multiply the movement.', 'ترس صغير على الجريدة وترس كبير على نفس العمود: بيكبّروا الحركة.'], mat: 'brass', o: [11.45, 10.5, 0], ex: [0, 0, 2.5], cut: false,
          s: [{ t: 'gear', r: 0.35, rr: 0.29, teeth: 10, h: 0.3, ax: 'z', p: [0, 0, -0.4] }, { t: 'gear', r: 1.3, rr: 1.24, teeth: 40, h: 0.12, ax: 'z', p: [0, 0, 0.1] }, { t: 'cyl', r: 0.05, h: 1.0, ax: 'z', p: [0, 0, -0.1], m: 'steel' }] },
        { id: 'dial', name: ['Dial face, bezel and glass', 'الوش والبرواز والإزاز'], role: ['100 lines of 0.01 mm. Turn the bezel to set zero; the small dial counts whole mm.', '100 خط كل خط 0.01 مم. لف البرواز عشان تصفّر، والعداد الصغير بيعد الملليمترات.'], mat: 'white', ex: [0, 0, 4.5], s: dial },
        { id: 'needle', name: ['Needle and centre pinion', 'الإبرة وترسها'], role: ['Driven by the large gear; one turn = 1 mm.', 'الترس الكبير بيلفها؛ لفة كاملة = 1 مم.'], mat: 'red', o: [12, 12, 0], ex: [0, 0, 7], cut: false,
          s: [{ t: 'box', w: 0.07, h: 2.6, d: 0.02, p: [0, 0.9, 0.7] }, { t: 'cyl', r: 0.14, h: 0.08, ax: 'z', p: [0, 0, 0.7], m: 'black' }, { t: 'cyl', r: 0.05, h: 0.8, ax: 'z', p: [0, 0, 0.3], m: 'steel' },
            { t: 'gear', r: 0.3, rr: 0.25, teeth: 10, h: 0.12, ax: 'z', p: [0, 0, 0.1], m: 'brass' }] },
        { id: 'shaft', name: ['Shaft being checked', 'العمود اللي بنقيسه'], role: ['Turn it slowly and watch the needle for run-out.', 'لفه بالراحة وبص على الإبرة عشان التطويح.'], mat: 'steel', ex: [0, -8, 0],
          s: [{ t: 'cyl', r: 2.4, h: 6, ax: 'z', p: [12, 2.4, -0.4] }] },
      ],
      steps: ['base', 'switch', 'post', 'clamp', 'arm', 'holder', 'case', 'plunger', 'spring', 'gear_train', 'needle', 'dial', 'shaft'],
      anim: { mode: 'toggle', label: ['High spot: +1.25 mm', 'نقطة عالية: +1.25 مم'], parts: { shaft: { slide: [0, 0.125, 0] }, plunger: { slide: [0, 0.125, 0] }, gear_train: { rot: [0, 0, 1], a: [0, 104] }, needle: { rot: [0, 0, 1], a: [0, -450] } } },
      quiz: [
        { q: ['On a 0.01 mm indicator the needle swings from -3 to +5 lines while the shaft turns. Run-out (TIR)?', 'في ساعة 0.01 مم الإبرة راحت من -3 لـ +5 خطوط والعمود بيلف. التطويح؟'], a: ['0.08 mm', '0.08 مم'], w: [['0.05 mm', '0.05 مم'], ['0.02 mm', '0.02 مم'], ['0.8 mm', '0.8 مم']] },
        { q: ['How should the plunger touch the surface?', 'البستم المفروض يلمس السطح إزاي؟'], a: ['Square to the surface, with a small preload', 'عمودي على السطح ومضغوط شوية'], w: [['At 45° for more travel', 'بزاوية 45 عشان مشوار أكبر'], ['Just touching with no preload', 'لمسة من غير ضغط'], ['Oiled for smooth travel', 'مزيت عشان يمشي ناعم']] },
      ],
    });
  })();

  /* ---------------- feeler gauge ---------------- */
  (function () {
    const blade = (L, w0, w1) => [...arc(w0 / 2, 90, 270, 12), ...arc(w1 / 2, -90, 90, 8, L - w1 / 2, 0)];
    const th = [0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 1.00];
    let y = 0; const parts = [];
    const cover = (id, yc, ex, nm) => ({ id, name: nm, role: ['Steel cover plate that protects the blades when folded.', 'غطا صاج بيحمي الريش وهي مقفولة.'], mat: 'steel', ex, s: [{ t: 'ext', d: 0.15, p: [0, yc, 0], pts: XZ(blade(10.6, 1.6, 1.2)), holes: [{ c: [0, 0], r: 0.2 }] }] });
    parts.push(cover('cover_bottom', -0.075, [0, -1.6, 0], ['Bottom cover', 'الغطا التحتاني']));
    th.forEach((t, i) => {
      const d = t / 10, a = 14 + i * 12;
      parts.push({ id: 'blade' + String(t.toFixed(2)).replace('.', '_'), name: ['Blade ' + t.toFixed(2) + ' mm', 'ريشة ' + t.toFixed(2) + ' مم'],
        role: [i === 0 ? 'Thinnest blade: bends easily, handle with care.' : 'Hardened spring steel, ' + t.toFixed(2) + ' mm thick, size etched on it.', i === 0 ? 'أرفع ريشة: بتتني بسهولة، خلي بالك منها.' : 'صاج سوست مقسّى تخانته ' + t.toFixed(2) + ' مم، والمقاس محفور عليه.'],
        mat: 'sst', ex: [0, f3(0.5 + i * 0.6), 0], o: [0, 0, 0],
        s: [{ t: 'ext', d: f3(d), p: [0, f3(y + d / 2), 0], rot: [0, a, 0], pts: XZ(blade(10, 1.27, 0.8)), holes: [{ c: [0, 0], r: 0.2 }] }] });
      y += d;
    });
    parts.push(cover('cover_top', f3(y + 0.075), [0, 7.4, 0], ['Top cover', 'الغطا الفوقاني']));
    parts.push({ id: 'screw', name: ['Pivot screw', 'مسمار المحور'], role: ['Holds the stack; tighten so blades stay where you put them.', 'ماسك الريش، اربطه لحد ما الريشة تقف مكانها.'], mat: 'steel', ex: [0, 9.8, 0], cut: false,
      s: [{ t: 'cyl', r: 0.19, h: f3(y + 0.5), p: [0, f3(y / 2), 0] }, { t: 'cyl', r: 0.45, h: 0.15, p: [0, f3(y + 0.225), 0] }] });
    parts.push({ id: 'nut', name: ['Knurled nut', 'صامولة مشرشرة'], role: ['Locks the pivot screw from below.', 'بتقفل مسمار المحور من تحت.'], mat: 'steel', ex: [0, -3.2, 0],
      s: [{ t: 'gear', r: 0.45, rr: 0.41, teeth: 18, h: 0.2, ri: 0.19, p: [0, -0.25, 0] }] });
    const anim = {}; th.forEach((t, i) => { anim['blade' + String(t.toFixed(2)).replace('.', '_')] = { rot: [0, 1, 0], a: [0, -(14 + i * 12)] }; });
    M.add({
      id: 'feeler_gauge', cat: 'tools',
      name: ['Feeler gauge set', 'طقم فيلر (مقياس خلوص)'],
      info: {
        what: ['Set of thin hardened blades of exact thickness (0.05 to 1.00 mm) on one pivot. Measures small gaps and clearances.', 'طقم ريش رفيعة مقساة بتخانات مظبوطة (من 0.05 لـ 1.00 مم) على محور واحد. بيقيس الفتحات والخلوصات الصغيرة.'],
        use: ['Coupling gap and angular alignment, bearing and gear clearances, sealing-jaw and knife gaps on blister and cartoner machines, sensor gaps, valve tappets.', 'فتحة الكوبلنج والاستقامة الزاوية، خلوص البلي والتروس، فتحة فكوك اللحام والسكاكين في مكن البليستر والكرتونة، مسافة الحساسات، تاكيهات البلوف.'],
        how: ['Slide one blade (or two stacked) into the gap: the right size goes in with a light drag. If a size slides loose and the next one will not enter, the gap is between them.', 'دخّل ريشة (أو اتنين فوق بعض) في الفتحة: المقاس الصح بيدخل بمسكة خفيفة. لو مقاس داخل سايب واللي بعده مش راضي يدخل، يبقى الفتحة بينهم.'],
        fail: ['Bent, kinked or rusty blades give wrong readings; worn tips; a loose pivot drops blades.', 'الريش المتنية أو المكسورة أو المصدّية بتدي قراية غلط، الأطراف بتدوب، والمحور السايب بيوقّع الريش.'],
        pm: ['Wipe clean and lightly oil after use, never force a blade into a gap, replace kinked blades, fold them back into the covers.', 'امسحها وزيّتها خفيف بعد الاستخدام، متزقش ريشة بالعافية، غيّر الريشة المتنية، ورجّعها جوه الغطا.'],
      },
      cut: 'y', parts,
      anim: { mode: 'toggle', label: ['Fold / unfold', 'اقفل / افتح'], parts: anim },
      quiz: [
        { q: ['The 0.20 blade slides in loose and the 0.30 will not enter. The gap is…', 'ريشة 0.20 داخلة سايبة و0.30 مش داخلة. الفتحة…'], a: ['Between 0.20 and 0.30 mm: try two blades stacked', 'بين 0.20 و0.30 مم: جرّب ريشتين فوق بعض'], w: [['0.20 mm exactly', '0.20 مم بالظبط'], ['0.50 mm', '0.50 مم'], ['Cannot be measured', 'مينفعش تتقاس']] },
        { q: ['What does a bent feeler blade do?', 'الريشة المتنية بتعمل إيه؟'], a: ['Gives a wrong reading: it drags or will not enter', 'بتدي قراية غلط: بتمسك أو مبتدخلش'], w: [['Nothing if you push harder', 'ولا حاجة لو زقيت جامد'], ['It reads more exactly', 'بتقيس أدق'], ['It is better for tight gaps', 'أحسن للفتحات الضيقة']] },
      ],
    });
  })();

  /* ---------------- 3-jaw bearing puller on a shaft ---------------- */
  (function () {
    const A = [0, 120, 240];
    const jaw = (i) => {
      const a = A[i], c = Math.cos(a * D), s = Math.sin(a * D), P = (x, r) => [x, f3(r * c), f3(r * s)];
      return { id: 'jaw' + (i + 1), name: ['Jaw ' + (i + 1), 'الرجل ' + (i + 1)], role: [i === 0 ? 'Hooked leg: the hook goes behind the ring that has the tight fit.' : 'Hooked leg, 120° from the others so the pull is even.', i === 0 ? 'رجل بخطاف: الخطاف بيمسك ورا الحلقة اللي ركبتها مزنوقة.' : 'رجل بخطاف، على 120 درجة من التانيين عشان الشد يبقى متساوي.'],
        mat: 'iron', ex: [7, f3(2.5 * c), f3(2.5 * s)],
        s: [{ t: 'box', w: 6.8, h: 0.7, d: 0.9, rot: [a, 0, 0], p: P(1.2, 3.0) }, { t: 'box', w: 0.65, h: 2.0, d: 0.9, rot: [a, 0, 0], p: P(-1.88, 2.35) }, { t: 'box', w: 1.3, h: 0.9, d: 0.95, rot: [a, 0, 0], p: P(4.6, 3.2) }] };
    };
    const pins = [], arms = [];
    A.forEach((a) => { const c = Math.cos(a * D), s = Math.sin(a * D); pins.push({ t: 'cyl', r: 0.22, h: 1.5, ax: 'z', rot: [a, 0, 0], p: [4.6, f3(3.2 * c), f3(3.2 * s)] }); arms.push({ t: 'box', w: 1.2, h: 2.6, d: 1.05, rot: [a, 0, 0], p: [4.6, f3(2.25 * c), f3(2.25 * s)] }); });
    M.add({
      id: 'bearing_puller', cat: 'tools',
      name: ['3-jaw bearing puller', 'بلّاعة (ساحبة) 3 رجول'],
      info: {
        what: ['Puller with three hooked jaws on a spider and a central forcing screw. The screw pushes on the shaft end while the jaws pull the bearing off.', 'ساحبة فيها 3 رجول بخطاف على عنكبوت ومسمار ضغط في النص. المسمار بيزق على طرف العمود والرجول بتسحب البلية.'],
        use: ['Removing bearings, pulleys, gears and coupling halves from motor and pump shafts and gearbox shafts.', 'فك البلي والبكر والتروس ونصوص الكوبلنج من عمدان المواتير والطلمبات والجيربوكس.'],
        how: ['Hook the jaws behind the ring with the interference fit (inner ring on a shaft), centre the screw point in the shaft centre hole, keep the jaws parallel and turn the screw steadily.', 'اربط الخطاطيف ورا الحلقة المزنوقة (الحلقة الداخلية على العمود)، حط سن المسمار في خرم سنتر العمود، خلي الرجول متوازية ولف المسمار بانتظام.'],
        fail: ['Jaws slip off when not square or not tight, pulling on the outer ring ruins the balls and races, a bent forcing screw, damaged shaft centre.', 'الرجول بتفلت لو مش عدلة أو مش مربوطة، السحب من الحلقة الخارجية بيبوّظ البلي والمجاري، مسمار الضغط بيتعوج، خرم السنتر بيتبوّظ.'],
        pm: ['Grease the forcing screw, check jaws for cracks and bent hooks, never hammer the screw or use an extension bar. Discard a pulled bearing; heat the ring if it will not move.', 'شحّم مسمار الضغط، افحص الرجول من الشروخ والخطاطيف المعووجة، متخبطش على المسمار ولا تطوّله. البلية اللي اتسحبت ترميها، ولو ناشفة سخّن الحلقة.'],
      },
      cut: 'z',
      parts: [
        { id: 'shaft', name: ['Motor shaft', 'عمود الموتور'], role: ['Shaft with a centre hole at the end for the screw point.', 'العمود وفي آخره خرم سنتر لسن المسمار.'], mat: 'steel', ex: [-5, 0, 0],
          s: [{ t: 'cyl', r: 1.25, h: 5, ax: 'x', p: [-2.5, 0, 0] }, { t: 'cyl', r: 1.6, h: 7, ax: 'x', p: [-8.5, 0, 0] }, { t: 'cone', r1: 0.01, r2: 0.3, h: 0.3, ax: '-x', p: [-0.14, 0, 0], m: 'black' }] },
        { id: 'bearing', name: ['Bearing (6205)', 'بلية (6205)'], role: ['Inner ring has the tight fit on the shaft: pull on that ring.', 'الحلقة الداخلية مزنوقة على العمود: اسحب منها هي.'], mat: 'steel', ex: [0, 0, 0],
          s: [{ t: 'cyl', r: 2.6, ri: 2.25, h: 1.5, ax: 'x', p: [-0.75, 0, 0] }, { t: 'cyl', r: 1.6, ri: 1.25, h: 1.5, ax: 'x', p: [-0.75, 0, 0] }, { t: 'balls', n: 9, R: 1.93, r: 0.38, ax: 'x', p: [-0.75, 0, 0], m: 'chrome' }] },
        jaw(0), jaw(1), jaw(2),
        { id: 'spider', name: ['Spider (yoke)', 'العنكبوت (اليوك)'], role: ['Three-arm yoke that carries the jaws and the threaded centre.', 'جسم بـ 3 دراعات شايل الرجول والسن اللي في النص.'], mat: 'red', ex: [7, 0, 0],
          s: [{ t: 'cyl', r: 1.3, h: 1.8, ax: 'x', p: [4.7, 0, 0] }, ...arms] },
        { id: 'pins', name: ['Jaw pins', 'مسامير الرجول'], role: ['Let each jaw swing so it can sit on different sizes.', 'بتخلي كل رجل تتحرك عشان تقعد على مقاسات مختلفة.'], mat: 'steel', ex: [7, 0, 0], s: pins },
        { id: 'nut', name: ['Centre nut', 'الصامولة اللي في النص'], role: ['Threaded centre that the forcing screw turns in.', 'السن اللي مسمار الضغط بيلف فيه.'], mat: 'steel', ex: [11, 0, 0],
          s: [{ t: 'hex', r: 1.1, h: 1.2, ri: 0.6, ax: 'x', p: [6.2, 0, 0] }] },
        { id: 'screw', name: ['Forcing screw', 'مسمار الضغط'], role: ['Fine-thread screw with a hardened point that pushes on the shaft centre.', 'مسمار سنه ناعم وطرفه مقسّى بيزق على سنتر العمود.'], mat: 'steel', ex: [17, 0, 0], cut: false,
          s: [{ t: 'cyl', r: 0.55, h: 12.4, ax: 'x', p: [6.8, 0, 0] }, { t: 'spring', R: 0.6, r: 0.07, turns: 40, len: 10, ax: 'x', p: [6.5, 0, 0] }, { t: 'cone', r1: 0.05, r2: 0.45, h: 0.6, ax: '-x', p: [0.3, 0, 0] }, { t: 'hex', r: 1.0, h: 1.4, ax: 'x', p: [13.7, 0, 0] }] },
      ],
      steps: ['shaft', 'bearing', 'spider', 'jaw1', 'jaw2', 'jaw3', 'pins', 'nut', 'screw'],
      anim: { mode: 'toggle', label: ['Pull the bearing', 'اسحب البلية'], parts: { screw: { rot: [1, 0, 0], a: [0, 2160] }, spider: { slide: [1.6, 0, 0] }, jaw1: { slide: [1.6, 0, 0] }, jaw2: { slide: [1.6, 0, 0] }, jaw3: { slide: [1.6, 0, 0] }, pins: { slide: [1.6, 0, 0] }, nut: { slide: [1.6, 0, 0] }, bearing: { slide: [1.6, 0, 0] } } },
      quiz: [
        { q: ['A bearing is tight on the shaft. Where should the jaws pull?', 'البلية مزنوقة على العمود. الرجول تشد منين؟'], a: ['Behind the inner ring', 'ورا الحلقة الداخلية'], w: [['On the outer ring', 'من الحلقة الخارجية'], ['On the seal', 'من السيل'], ['Anywhere, it is the same', 'أي حتة، كله واحد']] },
        { q: ['The jaws keep slipping. What is wrong?', 'الرجول بتفلت كل شوية. إيه الغلط؟'], a: ['Jaws not parallel or screw not centred', 'الرجول مش متوازية أو المسمار مش في السنتر'], w: [['Screw is greased', 'المسمار متشحم'], ['Bearing is too cold', 'البلية ساقعة'], ['Three jaws are too many', 'تلات رجول كتير']] },
      ],
    });
  })();

  /* ---------------- lever grease gun ---------------- */
  M.add({
    id: 'grease_gun', cat: 'tools',
    name: ['Lever grease gun', 'مسدس شحم بدراع'],
    info: {
      what: ['Hand pump for grease: the lever drives a small piston that pushes grease at high pressure through the hose to a grease nipple. A spring follower feeds grease from the cartridge.', 'طلمبة شحم يدوي: الدراع بيحرك بستم صغير بيزق الشحم بضغط عالي في الخرطوم لحد البزبوز. بستم بسوستة بيغذي الشحم من الخرطوشة.'],
        use: ['Lubrication rounds: motor and pump bearings, conveyor and fan bearings, chain tensioners, press and blister machine nipples. Food-grade (H1) grease near product.', 'جولات التشحيم: بلي المواتير والطلمبات، بلي السيور والمراوح، شدّادات الجنازير، بزابيز المكابس والبليستر. شحم آمن غذائياً (H1) جنب المنتج.'],
    how: ['Each full lever stroke gives a fixed shot (about 1 g). Clean the nipple, push the coupler square onto it, give the number of strokes in the PM plan, then tilt to release.', 'كل ضغطة كاملة بتطلّع كمية ثابتة (حوالي 1 جرام). نضّف البزبوز، ركّب الراس عليه عدل، ادّي عدد الضغطات اللي في خطة الصيانة، وبعدين ميّل عشان تفك.'],
    fail: ['Air lock (no grease although you pump), coupler leaking around the nipple, cracked hose, worn coupler jaws, mixed grease types.', 'هوا محبوس (بتضغط ومفيش شحم)، الراس بتسرّب حوالين البزبوز، خرطوم مشروخ، فكوك الراس دابت، خلط أنواع شحم.'],
    pm: ['Label each gun with one grease type, bleed air after a new cartridge, keep the coupler clean and capped, never over-grease: too much grease overheats bearings and pushes out seals.', 'كل مسدس عليه نوع شحم واحد مكتوب، طلّع الهوا بعد كل خرطوشة جديدة، خلي الراس نضيفة ومتغطية، ومتزوّدش الشحم: الزيادة بتسخّن البلي وتطلّع السيلات.'],
  },
  cut: 'z',
  parts: [
    { id: 'barrel', name: ['Barrel', 'الماسورة'], role: ['Tube that holds the grease cartridge.', 'الماسورة اللي فيها خرطوشة الشحم.'], mat: 'red', ex: [0, 0, 0],
      s: [{ t: 'cyl', r: 3.0, ri: 2.86, h: 30, ax: 'x', p: [15, 0, 0] }] },
    { id: 'head', name: ['Pump head', 'راس الطلمبة'], role: ['Screws on the barrel; holds the pump cylinder, check valve and lever pivot.', 'بتتربط على الماسورة؛ فيها سلندر الطلمبة والبلف اللي بيمنع الرجوع ومحور الدراع.'], mat: 'castg', ex: [-8, 0, 0],
      s: [{ t: 'cyl', r: 3.4, h: 5.8, ax: 'x', p: [-1.1, 0, 0] }, { t: 'box', w: 3.2, h: 2.8, d: 2.6, p: [-2.4, 4.3, 0] }, { t: 'box', w: 0.9, h: 2.2, d: 1.8, p: [-3.8, 5.6, 0] },
        { t: 'cyl', r: 0.8, h: 1.2, ax: 'x', p: [-4.4, 4.2, 0] }, { t: 'sph', r: 0.25, p: [-3.3, 4.2, 0], m: 'chrome' }] },
    { id: 'piston', name: ['Pump piston', 'بستم الطلمبة'], role: ['Pushed down by the lever: it forces one shot of grease out.', 'الدراع بيزقه لتحت: بيطلّع دفعة شحم.'], mat: 'chrome', ex: [-8, 5, 0], cut: false,
      s: [{ t: 'cyl', r: 0.45, h: 3.0, p: [-2.0, 4.6, 0] }, { t: 'cyl', r: 0.6, h: 0.3, p: [-2.0, 6.15, 0] }] },
    { id: 'lever', name: ['Lever', 'الدراع'], role: ['Long lever gives the high pressure; it springs back up after each stroke.', 'الدراع الطويل بيدّي الضغط العالي، وبيرجع لفوق بعد كل ضغطة.'], mat: 'steel', o: [-3.8, 6.4, 0], ex: [-8, 9, 0], cut: false,
      s: [{ t: 'box', w: 24, h: 0.8, d: 1.2, rot: [0, 0, 12], p: [11.74, 2.49, 0] }, { t: 'cyl', r: 0.9, h: 8, ax: 'x', rot: [0, 0, 12], p: [18.8, 4.0, 0], m: 'black' }, { t: 'cyl', r: 0.3, h: 1.6, ax: 'z', m: 'black' }] },
    { id: 'hose', name: ['High-pressure hose', 'خرطوم ضغط عالي'], role: ['Flexible hose with crimped ends to reach hidden nipples.', 'خرطوم مرن أطرافه مكبوسة عشان يوصل للبزابيز البعيدة.'], mat: 'black', ex: [-15, 0, 0], cut: false,
      s: [{ t: 'tube', r: 0.42, path: [[-5.0, 4.2, 0], [-8, 4.2, 0], [-11, 3.0, 0], [-13, 0.5, 0], [-13.6, -2.0, 0]] }, { t: 'cyl', r: 0.6, h: 1.4, ax: 'x', p: [-5.6, 4.2, 0], m: 'steel' }, { t: 'cyl', r: 0.6, h: 1.2, p: [-13.6, -2.1, 0], m: 'steel' }] },
    { id: 'coupler', name: ['Coupler (4-jaw)', 'راس التشحيم (4 فكوك)'], role: ['Spring jaws snap onto the grease nipple and seal on it.', 'فكوك بسوستة بتمسك على البزبوز وتقفل عليه.'], mat: 'brass', ex: [-20, -3, 0], cut: false,
      s: [{ t: 'hex', r: 0.75, h: 1.2, p: [-13.6, -3.3, 0] }, { t: 'cyl', r: 0.55, h: 1.0, p: [-13.6, -4.4, 0] }, { t: 'cyl', r: 0.35, ri: 0.2, h: 0.3, p: [-13.6, -5.0, 0], m: 'steel' }] },
    { id: 'cartridge', name: ['Grease cartridge (400 g)', 'خرطوشة شحم (400 جم)'], role: ['Standard cartridge; the open end faces the head.', 'خرطوشة قياسية، الناحية المفتوحة ناحية الراس.'], mat: '#c9a35a', ex: [0, 0, 8],
      s: [{ t: 'cyl', r: 2.78, ri: 2.66, h: 23, ax: 'x', p: [12.1, 0, 0] }, { t: 'cyl', r: 2.6, h: 22.8, ax: 'x', p: [12.2, 0, 0], m: 'grease' }] },
    { id: 'follower', name: ['Follower plunger', 'بستم الدفع'], role: ['Seals in the barrel and pushes grease to the pump inlet.', 'بيقفل في الماسورة ويزق الشحم لمدخل الطلمبة.'], mat: 'black', ex: [0, 0, 8],
      s: [{ t: 'cyl', r: 2.8, h: 0.5, ax: 'x', p: [24.0, 0, 0] }, { t: 'cyl', r: 2.5, h: 0.2, ax: 'x', p: [24.35, 0, 0], m: 'steel' }] },
    { id: 'spring', name: ['Follower spring', 'سوستة الدفع'], role: ['Keeps the follower pressing on the grease.', 'مخلية بستم الدفع ضاغط على الشحم دايماً.'], mat: 'steel', ex: [0, 0, 8], cut: false,
      s: [{ t: 'spring', R: 2.35, r: 0.16, turns: 7, len: 5.5, ax: 'x', p: [27.2, 0, 0] }] },
    { id: 'end_cap', name: ['End cap', 'الغطا الخلفي'], role: ['Closes the back of the barrel and guides the rod; it has the air-bleed slot.', 'بيقفل ضهر الماسورة ويوجّه العمود؛ وفيه مجرى طلوع الهوا.'], mat: 'red', ex: [6, 0, 0],
      s: [{ t: 'cyl', r: 3.2, h: 1.6, ax: 'x', p: [30.2, 0, 0] }] },
    { id: 'rod', name: ['Follower rod and T-handle', 'العمود ويد الشد'], role: ['Pull it back to load a cartridge; it shows how much grease is left.', 'اسحبه لورا عشان تركب الخرطوشة، وبيوريك فاضل قد إيه شحم.'], mat: 'steel', ex: [12, 0, 0], cut: false,
      s: [{ t: 'cyl', r: 0.4, h: 21.5, ax: 'x', p: [35.1, 0, 0] }, { t: 'box', w: 0.8, h: 4.0, d: 0.8, p: [46.0, 0, 0], m: 'black' }] },
  ],
  steps: ['barrel', 'cartridge', 'follower', 'spring', 'end_cap', 'rod', 'head', 'piston', 'lever', 'hose', 'coupler'],
  anim: { mode: 'toggle', label: ['Pump stroke', 'اضغط الدراع'], parts: { lever: { rot: [0, 0, 1], a: [0, -11] }, piston: { slide: [0, -0.45, 0] } } },
  quiz: [
    { q: ['You pump but no grease comes out after a new cartridge. First check?', 'بتضغط ومفيش شحم بيطلع بعد خرطوشة جديدة. أول حاجة تعملها؟'], a: ['Bleed the trapped air', 'طلّع الهوا المحبوس'], w: [['Change the hose', 'غيّر الخرطوم'], ['Pump faster', 'اضغط أسرع'], ['Heat the gun', 'سخّن المسدس']] },
    { q: ['What happens if a bearing gets too much grease?', 'إيه اللي يحصل لو البلية خدت شحم زيادة؟'], a: ['It runs hot and can push out the seals', 'بتسخن وممكن تطلّع السيلات'], w: [['It lasts longer', 'بتعيش أكتر'], ['Nothing, extra comes out', 'ولا حاجة، الزيادة بتطلع'], ['It gets quieter forever', 'صوتها بيوطى على طول']] },
  ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
