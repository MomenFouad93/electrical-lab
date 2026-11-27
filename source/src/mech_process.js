/* Mechanical: tanks and pharma process equipment (vessels vertical on Y; exchangers and traps with flow along X) */
(function (g) {
  const EL = g.EL, M = EL.mech, D = Math.PI / 180;
  const f3 = (v) => Math.round(v * 1000) / 1000;
  const arc = (r, a0, a1, n, cx, cy) => { const o = []; for (let i = 0; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * D; o.push([f3((cx || 0) + Math.cos(a) * r), f3((cy || 0) + Math.sin(a) * r)]); } return o; };
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
  const YZ = (pts) => pts.map(([y, z]) => [f3(-y), f3(-z)]);   // ext with ax 'x': give outline points as world [y, z]
  // Euler XYZ (degrees) for "pitch about the local X axis, then turn about Y" (impeller blades)
  const eulerYX = (psi, th) => { psi *= D; th *= D; const s = Math.sin(psi), c = Math.cos(psi), st = Math.sin(th), ct = Math.cos(th);
    return [f3(Math.atan2(st, c * ct) / D), f3(Math.asin(s * ct) / D), f3(Math.atan2(-s * st, c) / D)]; };

  /* ---------------- jacketed mixing tank (500 L) ---------------- */
  (function () {
    const R = 40, t = 0.4, yb = 70, yt = 160, hd = 20;   // inside radius, wall, straight shell bottom/top, 2:1 head depth
    const out = [], inn = [];
    for (let k = 0; k <= 12; k++) { const a = (k / 12) * 90 * D; out.push([f3((R + t) * Math.sin(a)), f3(yb - (hd + t) * Math.cos(a))]); }
    for (let k = 12; k >= 0; k--) { const a = (k / 12) * 90 * D; out.push([f3((R + t) * Math.sin(a)), f3(yt + (hd + t) * Math.cos(a))]); }
    for (let k = 0; k <= 12; k++) { const a = (k / 12) * 90 * D; inn.push([f3(R * Math.sin(a)), f3(yt + hd * Math.cos(a))]); }
    for (let k = 12; k >= 0; k--) { const a = (k / 12) * 90 * D; inn.push([f3(R * Math.sin(a)), f3(yb - hd * Math.cos(a))]); }
    const shell = [...out, ...inn, out[0]];
    const headY = (r) => f3(yt + (hd + t) * Math.sqrt(1 - (r / (R + t)) ** 2));
    const legs = [], baffles = [], blades = [], holes = [];
    [90, 210, 330].forEach((a) => { const x = f3(48 * Math.cos(a * D)), z = f3(48 * Math.sin(a * D)); legs.push({ t: 'cyl', r: 3, h: 80, p: [x, 40, z] }, { t: 'box', w: 10, h: 1.5, d: 10, p: [x, 0.75, z] }, { t: 'box', w: 6, h: 10, d: 1, rot: [0, -a, 0], p: [f3(45.5 * Math.cos(a * D)), 76, f3(45.5 * Math.sin(a * D))] }); });
    [45, 135, 225, 315].forEach((a) => baffles.push({ t: 'box', w: 6, h: 80, d: 0.6, rot: [0, -a, 0], p: [f3(35 * Math.cos(a * D)), 112, f3(35 * Math.sin(a * D))] }));
    [0, 90, 180, 270].forEach((a) => blades.push({ t: 'box', w: 16, h: 6, d: 0.8, rot: eulerYX(-a, 45), p: [f3(12 * Math.cos(a * D)), 75, f3(12 * Math.sin(a * D))] }));
    [[35, 8], [65, 12], [95, 14], [125, 12], [155, 6]].forEach(([b, n]) => holes.push({ t: 'balls', n, R: f3(4 * Math.sin(b * D)), r: 0.35, p: [-22, f3(146 + 4 * Math.cos(b * D)), 0], m: 'black', a0: b }));
    const clamps = []; [0, 90, 180, 270].forEach((a) => clamps.push({ t: 'box', w: 2, h: 3, d: 2, rot: [0, -a, 0], p: [f3(22 + 13.6 * Math.cos(a * D)), 188.6, f3(13.6 * Math.sin(a * D))], m: 'steel' }));
    M.add({
      id: 'mixing_tank', cat: 'process',
      name: ['Jacketed mixing tank (500 L)', 'تانك خلط بجاكيت (500 لتر)'],
      info: {
        what: ['Stainless steel vessel (316L inside) with dished heads, a heating/cooling jacket and a top-entry agitator: motor, gearbox, mechanical seal, shaft and impeller. Baffles stop the liquid just swirling.', 'تانك استانلس (316L من جوه) برؤوس مقببة وجاكيت تسخين وتبريد وخلاط من فوق: موتور وجيربوكس وميكانيكال سيل وعمود وريشة. البافلز بتمنع السائل إنه يلف بس في دوامة.'],
        use: ['Preparing solutions, syrups and suspensions, binder solution for granulation, coating suspension, buffers; cleaned in place (CIP) through the spray ball.', 'تحضير المحاليل والشراب والمعلقات، محلول البايندر للتحبيب، معلق التغطية، البفرات؛ وبيتنضف في مكانه (CIP) عن طريق السبراي بول.'],
        how: ['The gearbox cuts the motor speed and raises torque; the pitched-blade impeller pushes liquid down and the baffles turn it into top-to-bottom flow. Hot water, steam or chilled water in the jacket heats or cools through the wall. The vent filter lets the tank breathe without letting dirt in.', 'الجيربوكس بيقلل سرعة الموتور ويزود العزم، والريشة المايلة بتزق السائل لتحت والبافلز بتحوله لحركة من فوق لتحت. المية السخنة أو البخار أو المية المتلجة في الجاكيت بتسخّن أو تبرد من خلال الحيطة. فلتر الفنت بيخلي التانك يتنفس من غير ما يدخله وسخ.'],
        fail: ['Mechanical seal leak (drips on the top head, product risk), gearbox oil leak or noise, worn bearings and vibration, jacket leak into product, blocked spray ball holes (failed CIP), wet or blocked vent filter (vacuum can collapse the tank), cracked sight glass.', 'تسريب الميكانيكال سيل (نقط على الراس، خطر على المنتج)، تسريب زيت أو صوت في الجيربوكس، بلي دايب ورعشة، تسريب من الجاكيت للمنتج، خروم السبراي بول مسدودة (CIP فاشل)، فلتر الفنت مبلول أو مسدود (الفاكيوم ممكن يطبّق التانك)، زجاج السايت جلاس مشروخ.'],
        pm: ['Check the seal and its barrier fluid, gearbox oil level and vibration; replace clamp gaskets on schedule; integrity-test and change the vent filter; riboflavin test the spray coverage; test the jacket safety valve; calibrate temperature and level; passivate after welding.', 'راجع السيل وسائل البارير، زيت الجيربوكس والرعشة؛ غيّر جوانات الكلامب في ميعادها؛ اعمل integrity test للفلتر وغيّره؛ اختبار ريبوفلافين لتغطية الرش؛ اختبر صمام أمان الجاكيت؛ عاير الحرارة والمنسوب؛ والباسيفيشن بعد أي لحام.'],
      },
      cut: 'z',
      parts: [
        { id: 'shell', name: ['Vessel shell and dished heads', 'جسم التانك والرؤوس المقببة'], role: ['316L shell with 2:1 elliptical heads, polished inside, nozzles welded on.', 'جسم 316L برؤوس بيضاوية 2:1، مصقول من جوه، والنوزلات ملحومة عليه.'], mat: 'sst', ex: [0, 0, 0],
          s: [{ t: 'lathe', seg: 64, pts: shell }, { t: 'cyl', r: 9, h: 4, p: [0, 181, 0] }, { t: 'flange', r: 12, ri: 3, h: 2, holes: 8, pcd: 10.5, hr: 0.6, p: [0, 184, 0] }, { t: 'cyl', r: 3, h: 6, p: [0, 47, 0] }] },
        { id: 'jacket', name: ['Heating/cooling jacket', 'الجاكيت (تسخين وتبريد)'], role: ['Outer wall around the shell; the media flows in the gap. Has its own safety valve.', 'حيطة بره حوالين الجسم والسائل بيمشي في الفراغ. ليه صمام أمان لوحده.'], mat: 'sst', ex: [0, 0, 0],
          s: [{ t: 'cyl', r: 44.8, ri: 44.4, h: 80, p: [0, 112, 0] }, { t: 'cyl', r: 44.8, ri: 40.4, h: 0.6, p: [0, 152, 0] }, { t: 'cyl', r: 44.8, ri: 40.4, h: 0.6, p: [0, 72, 0] },
            { t: 'cyl', r: 44.3, ri: 40.5, h: 79, p: [0, 112, 0], m: 'water', cut: true },
            { t: 'cyl', r: 2, h: 6, ax: 'x', p: [47.8, 77, 0] }, { t: 'flange', r: 3.5, ri: 2, h: 0.8, ax: 'x', holes: 4, p: [51, 77, 0] },
            { t: 'cyl', r: 2, h: 6, ax: 'x', p: [47.8, 147, 0] }, { t: 'flange', r: 3.5, ri: 2, h: 0.8, ax: 'x', holes: 4, p: [51, 147, 0] }] },
        { id: 'legs', name: ['Legs with feet', 'الرجول والقواعد'], role: ['Three legs welded on pads; feet can be bolted or sit on load cells.', 'تلات رجول ملحومين على بادات، والقواعد بتتربط أو تقعد على لود سيلز.'], mat: 'sst', ex: [0, -25, 0], s: legs },
        { id: 'baffles', name: ['Baffles', 'البافلز (الحواجز)'], role: ['Four strips near the wall that stop the vortex and improve mixing.', 'أربع شرايح جنب الحيطة بتمنع الدوامة وتحسن الخلط.'], mat: 'sst', ex: [0, 0, 0], s: baffles },
        { id: 'bottom_valve', name: ['Bottom outlet valve', 'محبس التفريغ السفلي'], role: ['Flush-bottom valve: no dead leg under the tank; air-actuated.', 'محبس على مستوى القاع: مفيش رجل ميتة تحت التانك؛ بيشتغل بالهوا.'], mat: 'sst', ex: [0, -40, 0],
          s: [{ t: 'sph', r: 4, p: [0, 40, 0] }, { t: 'cyl', r: 2, h: 12, ax: 'x', p: [6, 40, 0] }, { t: 'cyl', r: 3, h: 0.6, ax: 'x', p: [12, 40, 0] }, { t: 'cyl', r: 5, h: 12, p: [0, 30, 0], m: 'grey' }] },
        { id: 'shaft', name: ['Agitator shaft', 'عمود الخلاط'], role: ['Stainless shaft from the gearbox through the seal into the product.', 'عمود استانلس من الجيربوكس عن طريق السيل لحد المنتج.'], mat: 'sst', ex: [0, 70, 0], cut: false,
          s: [{ t: 'cyl', r: 2.5, h: 128, p: [0, 134, 0] }] },
        { id: 'impeller', name: ['Pitched-blade impeller', 'ريشة مايلة (إمبلر)'], role: ['Four blades at 45°: pump the liquid down for good top-to-bottom mixing.', 'أربع ريش على 45 درجة: بتزق السائل لتحت عشان يتقلب كويس.'], mat: 'sst', ex: [75, 30, 0], cut: false,
          s: [{ t: 'cyl', r: 4, h: 8, p: [0, 75, 0] }, ...blades] },
        { id: 'seal', name: ['Mechanical seal housing', 'هاوزينج الميكانيكال سيل'], role: ['Rotating carbon face against a stationary SiC face seals the shaft; often double with a barrier fluid.', 'وش كربون دوار على وش سيليكون كاربيد ثابت بيقفل حوالين العمود؛ وغالباً دبل وبينهم سائل بارير.'], mat: 'sst', ex: [0, 110, 0],
          s: [{ t: 'cyl', r: 7, ri: 4.5, h: 10, p: [0, 190, 0] }, { t: 'cyl', r: 7, ri: 2.6, h: 1, p: [0, 185.5, 0] }, { t: 'cyl', r: 4.2, ri: 2.5, h: 1, p: [0, 188, 0], m: 'carbon' }, { t: 'cyl', r: 4.3, ri: 2.6, h: 1, p: [0, 189, 0], m: 'sic' },
            { t: 'spring', R: 3.5, r: 0.25, turns: 4, len: 2.4, p: [0, 191.5, 0], m: 'steel' }, { t: 'cyl', r: 1, h: 3, ax: 'x', p: [8, 192, 0] }] },
        { id: 'gearbox', name: ['Gearbox and lantern', 'الجيربوكس والفانوس'], role: ['Reduces motor speed to about 60-150 rpm and carries the shaft bearings.', 'بيقلل سرعة الموتور لحوالي 60-150 لفة وشايل بلي العمود.'], mat: 'blue', ex: [0, 140, 0],
          s: [{ t: 'cyl', r: 14, h: 1.5, p: [0, 195.75, 0], m: 'sst' }, { t: 'box', w: 30, h: 16, d: 26, p: [0, 204.5, 0] }, { t: 'cyl', r: 1.2, h: 1.5, p: [10, 213, 8], m: 'yellow' }] },
        { id: 'motor', name: ['Motor', 'الموتور'], role: ['Totally enclosed fan-cooled motor, often on a VFD for speed control.', 'موتور مقفول بمروحة تبريد، وغالباً على VFD عشان تتحكم في السرعة.'], mat: 'blue', ex: [0, 170, 0],
          s: [{ t: 'cyl', r: 11, h: 30, p: [0, 227.5, 0] }, { t: 'cyl', r: 11.5, h: 6, p: [0, 245.5, 0], m: 'grey' }, { t: 'box', w: 8, h: 8, d: 8, p: [14, 226, 0] }] },
        { id: 'spray_ball', name: ['CIP spray ball', 'سبراي بول للـ CIP'], role: ['Static ball on a dip pipe: sprays the whole inside, including the top head, during CIP.', 'كورة ثابتة على ماسورة: بترش كل التانك من جوه حتى الراس اللي فوق وقت الـ CIP.'], mat: 'sst', ex: [-45, 50, 0], cut: false,
          s: [{ t: 'cyl', r: 3, h: 6, p: [-22, headY(22) + 2, 0] }, { t: 'cyl', r: 4, h: 1, p: [-22, headY(22) + 5.5, 0] }, { t: 'cyl', r: 1.27, h: 42, p: [-22, 169, 0] }, { t: 'sph', r: 4, p: [-22, 146, 0] }, ...holes] },
        { id: 'manway', name: ['Manway with hinged lid', 'فتحة التفتيش (مان واي)'], role: ['Opening for inspection and charging powders; lid with gasket and swing clamps.', 'فتحة للتفتيش وتعبئة البودرة؛ غطا بجوان وكلابات.'], mat: 'sst', ex: [40, 35, 0],
          s: [{ t: 'cyl', r: 12, ri: 11.5, h: 13, p: [22, 181.5, 0] }, { t: 'cyl', r: 13.5, h: 1.5, p: [22, 188.75, 0] }, { t: 'box', w: 3, h: 2, d: 6, p: [36.5, 188.75, 0] }, { t: 'box', w: 8, h: 1, d: 1, p: [22, 190.2, 0], m: 'black' }, ...clamps] },
        { id: 'sight_glass', name: ['Sight glass', 'السايت جلاس (زجاج الرؤية)'], role: ['Glass window to look inside while mixing.', 'شباك إزاز تبص منه جوه وانت بتخلط.'], mat: 'sst', ex: [0, 35, -30],
          s: [{ t: 'cyl', r: 5, h: 6, p: [0, headY(24) + 1.5, -24] }, { t: 'cyl', r: 5, h: 1, p: [0, headY(24) + 5, -24], m: 'glass' }, { t: 'torus', R: 5.6, r: 0.6, p: [0, headY(24) + 4.4, -24] }, { t: 'cyl', r: 5.6, ri: 4, h: 0.8, p: [0, headY(24) + 5.9, -24] }] },
        { id: 'vent_filter', name: ['Vent filter (0.2 µm)', 'فلتر الفنت (0.2 ميكرون)'], role: ['Hydrophobic filter in a housing: air in and out, no particles or microbes in.', 'فلتر طارد للمية في هاوزينج: الهوا يدخل ويخرج من غير جزيئات ولا ميكروبات.'], mat: 'sst', ex: [30, 60, 30],
          s: [{ t: 'cyl', r: 2, h: 6, p: [14, headY(22.8) + 2, 18] }, { t: 'cyl', r: 4.5, h: 18, p: [14, headY(22.8) + 14, 18] }, { t: 'sph', r: 4.5, half: true, p: [14, headY(22.8) + 23, 18] }, { t: 'torus', R: 4.8, r: 0.5, p: [14, headY(22.8) + 6, 18] }] },
      ],
      steps: ['shell', 'jacket', 'legs', 'baffles', 'bottom_valve', 'shaft', 'impeller', 'seal', 'gearbox', 'motor', 'spray_ball', 'manway', 'sight_glass', 'vent_filter'],
      anim: { mode: 'spin', label: ['Run the agitator', 'شغّل الخلاط'], parts: { shaft: { rot: [0, 1, 0] }, impeller: { rot: [0, 1, 0] } } },
      quiz: [
        { q: ['What do the baffles do?', 'البافلز وظيفتها إيه؟'], a: ['Stop the vortex and turn swirl into top-to-bottom mixing', 'تمنع الدوامة وتحول اللف لخلط من فوق لتحت'], w: [['Heat the product', 'تسخن المنتج'], ['Hold the shaft straight', 'تمسك العمود عدل'], ['Clean the tank', 'تنضف التانك']] },
        { q: ['Drips on the top head next to the shaft usually mean…', 'نقط على راس التانك جنب العمود غالباً معناها…'], a: ['Mechanical seal leak', 'تسريب في الميكانيكال سيل'], w: [['Jacket leak', 'تسريب في الجاكيت'], ['Vent filter wet', 'فلتر الفنت مبلول'], ['Normal condensation, ignore', 'تكثيف عادي، سيبه']] },
        { q: ['Why must the vent filter not be blocked when the tank is emptied or cooled?', 'ليه فلتر الفنت لازم ميكونش مسدود وقت التفريغ أو التبريد؟'], a: ['Vacuum can collapse the vessel', 'الفاكيوم ممكن يطبّق التانك'], w: [['The motor overloads', 'الموتور يتحمل زيادة'], ['The jacket freezes', 'الجاكيت يتلج'], ['The spray ball stops', 'السبراي بول يقف']] },
      ],
    });
  })();

  /* ---------------- static CIP spray ball ---------------- */
  (function () {
    const C = -16.5, holes = [];
    [[35, 8], [65, 12], [95, 14], [125, 12], [155, 6]].forEach(([b, n]) => holes.push({ t: 'balls', n, R: f3(3.25 * Math.sin(b * D)), r: 0.2, p: [0, f3(C + 3.25 * Math.cos(b * D)), 0], m: 'black', a0: b }));
    holes.push({ t: 'sph', r: 0.2, p: [0, C - 3.25, 0], m: 'black' });
    const ballPts = [[1.29, 4.4], [1.5, 4.4], [1.5, 2.88]]; for (let k = 1; k <= 16; k++) { const a = (27.5 + (k / 16) * 152.5) * D; ballPts.push([f3(3.25 * Math.sin(a)), f3(3.25 * Math.cos(a))]); }
    ballPts.push([0, -3.25], [0, -3.0]); for (let k = 15; k >= 0; k--) { const a = (25.5 + (k / 16) * 154.5) * D; ballPts.push([f3(3.0 * Math.sin(a)), f3(3.0 * Math.cos(a))]); } ballPts.push([1.29, 4.4]);
    M.add({
      id: 'spray_ball', cat: 'process',
      name: ['Static CIP spray ball', 'سبراي بول ثابت للـ CIP'],
      info: {
        what: ['Hollow stainless ball with drilled holes on the end of a dip pipe. CIP liquid sprays from the holes onto the top of the tank and runs down the walls.', 'كورة استانلس مجوفة فيها خروم في آخر ماسورة نازلة في التانك. سائل الـ CIP بيترش من الخروم على سقف التانك ويجري على الحيطان.'],
        use: ['Cleaning in place of tanks, IBC bins, hoppers and receivers in the water station, solution prep and liquid filling lines.', 'تنضيف التانكات والبنز والهوبرات والريسيفرز في مكانها: محطة المية، تحضير المحاليل، خطوط تعبئة السوائل.'],
        how: ['Holes point up, sideways and down so every surface, nozzle and the manway is wetted. It needs the right flow and pressure (about 30 L/min per metre of tank circumference, 1-2.5 bar). A bottom hole lets it drain dry.', 'الخروم موجهة لفوق وللجنب ولتحت عشان كل سطح ونوزل والمان واي يتغسل. محتاج تدفق وضغط مظبوطين (حوالي 30 لتر/دقيقة لكل متر من محيط التانك، 1-2.5 بار). خرم تحت بيخليه ينشف.'],
        fail: ['Blocked holes from debris, low pump pressure or worn pump, ball dropped off (clip missing), shadow zones behind new fittings: all show up as a failed riboflavin coverage test or residues.', 'خروم مسدودة بوسخ، ضغط الطلمبة واطي أو الطلمبة دايبة، الكورة وقعت (الكليب مش موجود)، أماكن ضل ورا تركيبة جديدة: كله بيبان في اختبار الريبوفلافين أو بواقي.'],
        pm: ['Inspect holes and clip at each opening, check supply pressure and flow on every CIP, keep a strainer upstream, repeat the riboflavin test after any change inside the tank, change the clamp gasket on schedule.', 'افحص الخروم والكليب كل ما تفتح، راجع الضغط والتدفق كل CIP، خلي فيه مصفاة قبله، أعد اختبار الريبوفلافين بعد أي تغيير جوه التانك، وغيّر جوان الكلامب في ميعاده.'],
      },
      cut: 'z',
      parts: [
        { id: 'nozzle', name: ['Tank top nozzle with ferrule', 'نوزل السقف بالفيرول'], role: ['Short pipe welded in the tank head, with a clamp ferrule on top.', 'ماسورة قصيرة ملحومة في سقف التانك وفوقها فيرول للكلامب.'], mat: 'sst', ex: [0, 0, 0],
          s: [{ t: 'cyl', r: 8, h: 0.5, p: [0, -0.25, 0] }, { t: 'cyl', r: 2.6, ri: 2.4, h: 5.6, p: [0, 2.8, 0] }, { t: 'cyl', r1: 3.2, r2: 2.8, ri: 2.4, h: 1.0, p: [0, 6.1, 0] }] },
        { id: 'gasket', name: ['Clamp gasket (EPDM)', 'جوان الكلامب (EPDM)'], role: ['Hygienic gasket with a bead that sits in the ferrule grooves.', 'جوان صحي ليه بروز بيقعد في مجرى الفيرول.'], mat: 'epdm', ex: [0, 4, 0],
          s: [{ t: 'cyl', r: 3.2, ri: 2.4, h: 0.3, p: [0, 6.75, 0] }] },
        { id: 'lance', name: ['Blind cap with dip pipe', 'الغطا والماسورة النازلة'], role: ['Ferrule cap with the dip pipe welded through it: sets the ball height in the tank.', 'غطا فيرول ملحوم فيه الماسورة: بيحدد ارتفاع الكورة في التانك.'], mat: 'sst', ex: [0, 26, 0],
          s: [{ t: 'cyl', r1: 2.8, r2: 3.2, h: 1.0, p: [0, 7.4, 0] }, { t: 'cyl', r: 1.27, ri: 1.1, h: 25.9, p: [0, -1.05, 0] }, { t: 'cyl', r1: 2.5, r2: 2.1, ri: 1.1, h: 0.6, p: [0, 12.2, 0] }] },
        { id: 'clamp', name: ['Tri-clamp', 'الكلامب (Tri-clamp)'], role: ['Hinged clamp: pulls the two tapered ferrules together on the gasket.', 'كلامب بمفصلة: بيشد الفيرولين المسلوبين على الجوان.'], mat: 'sst', ex: [9, 6, 0],
          s: [{ t: 'torus', R: 3.45, r: 0.55, p: [0, 6.75, 0] }, { t: 'box', w: 1.0, h: 0.8, d: 1.4, p: [4.2, 6.75, 0] }, { t: 'box', w: 0.3, h: 1.8, d: 1.6, p: [4.9, 6.75, 0], m: 'steel' }] },
        { id: 'ball', name: ['Spray ball', 'كورة الرش'], role: ['Hollow ball with holes up, sideways and down, and a drain hole at the bottom.', 'كورة مجوفة فيها خروم لفوق وللجنب ولتحت، وخرم تصفية تحت.'], mat: 'sst', ex: [0, -6, 0],
          s: [{ t: 'lathe', pts: ballPts, p: [0, C, 0] }, ...holes] },
        { id: 'pin', name: ['Retaining pin and clip', 'التيلة والكليب'], role: ['Holds the ball on the pipe; the ball can be pulled off for inspection.', 'ماسك الكورة على الماسورة؛ تقدر تشيلها عشان تفحصها.'], mat: 'steel', ex: [6, -6, 0], cut: false,
          s: [{ t: 'cyl', r: 0.15, h: 3.6, ax: 'z', p: [0, -13.2, 0] }, { t: 'tube', r: 0.08, path: [[0, -13.2, 1.8], [1.6, -13.5, 1.3], [2.0, -14.1, 0], [1.6, -13.5, -1.3], [0, -13.2, -1.8]] }] },
        { id: 'inlet', name: ['CIP supply connection', 'وصلة توريد الـ CIP'], role: ['Supply pipe from the CIP skid, clamped on the cap.', 'ماسورة التوريد من وحدة الـ CIP، متربطة بكلامب على الغطا.'], mat: 'sst', ex: [0, 33, 0],
          s: [{ t: 'cyl', r1: 2.1, r2: 2.5, ri: 1.1, h: 0.6, p: [0, 12.8, 0] }, { t: 'torus', R: 2.7, r: 0.42, p: [0, 12.5, 0] }, { t: 'tube', r: 1.27, path: [[0, 13.1, 0], [0, 16, 0], [1.5, 18.2, 0], [4, 19, 0], [12, 19, 0]] }] },
      ],
      steps: ['nozzle', 'gasket', 'lance', 'clamp', 'ball', 'pin', 'inlet'],
      quiz: [
        { q: ['How do you prove a spray ball cleans every surface?', 'تثبت إزاي إن السبراي بول بيغسل كل حتة؟'], a: ['Riboflavin coverage test under UV light', 'اختبار ريبوفلافين وتشوف بالأشعة البنفسجية'], w: [['Look at the outside of the tank', 'تبص على التانك من بره'], ['Measure the motor current', 'تقيس تيار الموتور'], ['Weigh the tank', 'توزن التانك']] },
        { q: ['CIP results got worse; supply pressure is normal but flow is low. Likely cause?', 'نتايج الـ CIP بقت أوحش؛ الضغط طبيعي بس التدفق قليل. السبب المحتمل؟'], a: ['Blocked holes in the ball', 'خروم الكورة مسدودة'], w: [['Too many holes', 'خروم كتير'], ['Gasket too new', 'الجوان جديد'], ['Tank is too clean', 'التانك نضيف زيادة']] },
      ],
    });
  })();

  /* ---------------- sanitary sight glass (DN80 clamp type) ---------------- */
  M.add({
    id: 'sight_glass', cat: 'process',
    name: ['Sanitary sight glass (DN80, clamp type)', 'سايت جلاس صحي (DN80، بكلامب)'],
    info: {
      what: ['Thick borosilicate glass disc clamped between two hygienic gaskets on a tank nozzle, so you can see inside without opening the tank.', 'قرص إزاز بوروسيليكات تخين متزنق بين جوانين صحيين على نوزل التانك، عشان تشوف جوه من غير ما تفتح.'],
      use: ['Tank tops and sides in solution prep, the PW/WFI storage tanks and reactors; often paired with a sight-glass lamp.', 'سقف وجناب التانكات في تحضير المحاليل وتانكات المية PW/WFI والمفاعلات؛ وغالباً معاه لمبة سايت جلاس.'],
      how: ['The tapered ferrule and retaining ring are pulled together by the clamp; the gaskets seal both faces of the glass and keep metal from touching it.', 'الفيرول المسلوب والحلقة الماسكة بيتشدوا على بعض بالكلامب؛ الجوانات بتقفل وشين الإزاز وتمنع الحديد يلمسه.'],
      fail: ['Chips or cracks (glass breakage risk to product), leaks from hard or extruded gaskets, scratches or fogging that hide the view, glass cracked by uneven clamping or thermal shock.', 'تشطيف أو شرخ (خطر كسر إزاز في المنتج)، تسريب من جوانات ناشفة أو مضغوطة لبره، خدوش أو شبورة تغطي الرؤية، شرخ من زنق مش متساوي أو صدمة حرارية.'],
      pm: ['Inspect the glass before each batch per the glass breakage SOP, tighten the clamp by hand evenly, never hit or lever on the glass, replace gaskets (FDA EPDM or PTFE) on schedule, avoid cold water on hot glass.', 'افحص الإزاز قبل كل باتش حسب إجراء كسر الإزاز، اربط الكلامب بالإيد بالتساوي، متخبطش ولا تعتل على الإزاز، غيّر الجوانات (EPDM أو PTFE معتمدة) في ميعادها، ومتحطش مية ساقعة على إزاز سخن.'],
    },
    cut: 'z',
    parts: [
      { id: 'nozzle', name: ['Nozzle with ferrule', 'النوزل والفيرول'], role: ['Short pipe welded in the tank head, tapered ferrule on top.', 'ماسورة قصيرة ملحومة في التانك وفوقها فيرول مسلوب.'], mat: 'sst', ex: [0, 0, 0],
        s: [{ t: 'cyl', r: 8.5, h: 0.5, p: [0, -6.25, 0] }, { t: 'cyl', r: 4.3, ri: 4.0, h: 5, p: [0, -3.5, 0] }, { t: 'cyl', r1: 5.3, r2: 4.6, ri: 4.0, h: 1.0, p: [0, -0.5, 0] }] },
      { id: 'gasket1', name: ['Lower gasket', 'الجوان التحتاني'], role: ['Seals the ferrule face to the glass and ring.', 'بيقفل بين وش الفيرول والإزاز والحلقة.'], mat: 'ptfe', ex: [0, 2.5, 0],
        s: [{ t: 'cyl', r: 5.3, ri: 4.0, h: 0.3, p: [0, 0.15, 0] }] },
      { id: 'glass', name: ['Glass disc (borosilicate)', 'قرص الإزاز (بوروسيليكات)'], role: ['Thick, heat-resistant glass rated for the tank pressure.', 'إزاز تخين بيستحمل الحرارة ومحسوب لضغط التانك.'], mat: 'glass', ex: [0, 5, 0],
        s: [{ t: 'cyl', r: 4.6, h: 1.5, p: [0, 1.05, 0] }] },
      { id: 'gasket2', name: ['Upper gasket', 'الجوان الفوقاني'], role: ['Cushions the glass under the retaining ring.', 'مخدة للإزاز تحت الحلقة الماسكة.'], mat: 'epdm', ex: [0, 7.5, 0],
        s: [{ t: 'cyl', r: 4.6, ri: 3.6, h: 0.3, p: [0, 1.95, 0] }] },
      { id: 'ring', name: ['Retaining ring', 'الحلقة الماسكة'], role: ['Holds the glass; its tapered edge mates with the clamp.', 'ماسكة الإزاز، وحرفها المسلوب بيركب في الكلامب.'], mat: 'sst', ex: [0, 10.5, 0],
        s: [{ t: 'lathe', pts: sharp([[4.65, 0.3], [5.3, 0.3], [4.95, 1.3], [4.95, 2.9], [3.6, 2.9], [3.6, 2.1], [4.65, 2.1], [4.65, 0.3]], 0.015) }] },
      { id: 'clamp', name: ['Tri-clamp with wing nut', 'الكلامب بالصامولة الفراشة'], role: ['Pulls ring and ferrule together evenly. Tighten by hand.', 'بيشد الحلقة والفيرول على بعض بالتساوي. يتربط بالإيد.'], mat: 'sst', ex: [11, 0.5, 0],
        s: [{ t: 'lathe', pts: sharp([[4.65, -1.05], [6.1, -1.05], [6.1, 1.35], [5.0, 1.35], [5.0, 1.3], [5.35, 0.3], [5.35, 0.0], [4.65, -1.0], [4.65, -1.05]], 0.015) },
          { t: 'box', w: 1.2, h: 1.0, d: 1.6, p: [6.6, 0.15, 0] }, { t: 'box', w: 0.3, h: 2.2, d: 2.0, p: [7.4, 0.15, 0], m: 'steel' }] },
    ],
    steps: ['nozzle', 'gasket1', 'glass', 'gasket2', 'ring', 'clamp'],
    quiz: [
      { q: ['You find a small chip on the sight glass before a batch. What do you do?', 'لقيت تشطيفة صغيرة في السايت جلاس قبل الباتش. تعمل إيه؟'], a: ['Stop and follow the glass breakage procedure; replace the glass', 'وقف واتبع إجراء كسر الإزاز وغيّره'], w: [['Ignore it if it does not leak', 'سيبه طالما مش بيسرّب'], ['Tighten the clamp more', 'اربط الكلامب أكتر'], ['Cover it with tape', 'غطيه بشريط لزق']] },
      { q: ['Why is there a gasket on both sides of the glass?', 'ليه فيه جوان على الناحيتين من الإزاز؟'], a: ['To seal and to keep metal from touching and cracking the glass', 'عشان يقفل وكمان يمنع الحديد يلمس الإزاز ويشرخه'], w: [['To make it thicker', 'عشان يبقى أتخن'], ['For electrical insulation', 'للعزل الكهربا'], ['To change the colour', 'عشان يغير اللون']] },
    ],
  });

  /* ---------------- shell and tube heat exchanger (fixed tube sheets, 2 tube passes) ---------------- */
  (function () {
    const tubes = [];
    for (let k = 0; k < 6; k++) for (const sg of [1, -1]) {
      const y = f3(sg * (1.3 + k * 2.165)), off = k % 2 ? 1.25 : 0;
      for (let z = -12 + off; z <= 12; z += 2.5) if (Math.hypot(y, z) <= 11.6) tubes.push({ t: 'cyl', r: 0.95, ri: 0.8, h: 156.6, ax: 'x', seg: 12, p: [0, y, f3(z)] });
    }
    const baffle = (x, top) => { const c = 6.45, a0 = Math.acos(c / 12.9) / D; const pts = top ? arc(12.9, a0, 360 - a0, 40) : arc(12.9, -180 + a0, 180 - a0, 40); return { t: 'ext', ax: 'x', d: 0.6, p: [x, 0, 0], pts: YZ(pts) }; };
    const BX = [-45, -15, 15, 45];
    const rods = [], RP = [[0, 12.35], [0, -12.35], [12.2, 0], [-12.2, 0]];
    RP.forEach(([y, z]) => { rods.push({ t: 'cyl', r: 0.55, h: 150, ax: 'x', p: [0, y, z] }); [[-75, -45], [-45, -15], [-15, 15], [15, 45], [45, 75]].forEach(([a, b]) => rods.push({ t: 'cyl', r: 0.85, ri: 0.56, h: b - a - 0.6, ax: 'x', p: [f3((a + b) / 2), y, z], m: 'steel' })); });
    const studs = (x0, x1) => { const o = []; for (let i = 0; i < 12; i++) { const a = ((i + 0.5) / 12) * 360 * D, y = f3(15.5 * Math.cos(a)), z = f3(15.5 * Math.sin(a)); o.push({ t: 'cyl', r: 0.55, h: f3(x1 - x0), ax: 'x', p: [f3((x0 + x1) / 2), y, z], m: 'steel' }, { t: 'hex', r: 0.95, h: 0.9, ax: 'x', p: [f3(x0 + 0.45), y, z], m: 'steel' }, { t: 'hex', r: 0.95, h: 0.9, ax: 'x', p: [f3(x1 - 0.45), y, z], m: 'steel' }); } return o; };
    const noz = (x, sg, r) => [{ t: 'cyl', r, ri: f3(r - 0.4), h: 8, p: [x, f3(sg * (13 + 4)), 0] }, { t: 'flange', r: f3(r + 2.5), ri: f3(r - 0.4), h: 1.2, holes: 4, p: [x, f3(sg * 21.6), 0] }];
    const saddle = (x) => [{ t: 'ext', ax: 'x', d: 2, p: [x, 0, 0], pts: YZ([[-22, -12], [-22, 12], ...arc(13.5, 117.3, 242.7, 16)]) }, { t: 'box', w: 5, h: 1, d: 26, p: [x, -22.5, 0] }];
    M.add({
      id: 'shell_tube_hx', cat: 'process',
      name: ['Shell and tube heat exchanger', 'مبادل حراري شيل آند تيوب'],
      info: {
        what: ['A bundle of tubes inside a shell. One fluid flows through the tubes (here two passes, split by a partition plate in the front channel), the other flows around the tubes in the shell, guided by baffles.', 'حزمة مواسير جوه غلاف. سائل بيمشي جوه المواسير (هنا مشوارين، بيفصلهم لوح في الراس الأمامي)، والتاني بيمشي حوالين المواسير في الغلاف والبافلز بتوجهه.'],
        use: ['Steam heaters for hot water and PW loop sanitisation, WFI point-of-use coolers, clean steam generators, chilled-water coolers. Pharma water service uses double tube sheets so a leak cannot mix the fluids.', 'سخانات بخار للمية السخنة وتعقيم لوب الـ PW، مبردات WFI عند نقط الاستخدام، مولدات البخار النظيف، مبردات المية المتلجة. في المية الدوائية بيستخدموا دبل تيوب شيت عشان أي تسريب ميخلطش السوائل.'],
        how: ['Heat passes through the tube walls. Baffles make the shell fluid cross the tubes several times (better heat transfer) and support the tubes against vibration. Tube ends are expanded or welded into the tube sheets.', 'الحرارة بتعدي من حيطان المواسير. البافلز بتخلي سائل الغلاف يعدي على المواسير كذا مرة (نقل حرارة أحسن) وبتسند المواسير ضد الرعشة. أطراف المواسير متوسعة أو ملحومة في التيوب شيت.'],
        fail: ['Tube leak (cross-contamination, conductivity rise, steam in the product side), fouling and scale (outlet temperature drops, pressure drop rises), gasket leaks at the channels, tube wear at baffles from vibration, corrosion.', 'تسريب ماسورة (خلط، الكوندكتيفيتي بتعلى، بخار في ناحية المنتج)، ترسيب وقشور (حرارة الخروج بتقل وفرق الضغط بيزيد)، تسريب جوانات الرؤوس، تآكل المواسير عند البافلز من الرعشة، صدا.'],
        pm: ['Trend inlet/outlet temperatures and pressure drop, pressure or helium test the tubes on schedule, clean chemically or mechanically, replace channel gaskets when opened, keep the shell vented and drained, test the safety valve.', 'تابع حرارة الدخول والخروج وفرق الضغط، اختبر المواسير بالضغط أو الهيليوم في ميعاده، نضّف كيماوي أو ميكانيكي، غيّر جوانات الرؤوس كل ما تتفتح، خلي الغلاف متنفس ومتصفي، واختبر صمام الأمان.'],
      },
      cut: 'z',
      parts: [
        { id: 'tubesheet_a', name: ['Front tube sheet', 'التيوب شيت الأمامي'], role: ['Thick drilled plate: tube ends are expanded into it.', 'لوح تخين مخروم: أطراف المواسير متوسعة فيه.'], mat: 'sst', ex: [0, 0, 0],
          s: [{ t: 'flange', r: 17, h: 3, ax: 'x', holes: 12, pcd: 15.5, hr: 0.6, p: [-76.5, 0, 0] }] },
        { id: 'tie_rods', name: ['Tie rods and spacers', 'شدّادات ومسافات'], role: ['Hold the baffles at the right spacing.', 'ماسكين البافلز على المسافات المظبوطة.'], mat: 'sst', ex: [0, 0, 0], s: rods },
        { id: 'baffles', name: ['Segmental baffles', 'البافلز (حواجز مقطوعة)'], role: ['25 % cut, alternating top and bottom: the shell fluid zig-zags across the tubes.', 'مقطوعة 25% بالتبادل فوق وتحت: سائل الغلاف بيمشي زجزاج على المواسير.'], mat: 'sst', ex: [0, 0, 0],
          s: BX.map((x, i) => baffle(x, i % 2 === 1)) },
        { id: 'tubes', name: ['Tube bundle (19 mm)', 'حزمة المواسير (19 مم)'], role: ['Thin-wall tubes on a triangular pitch; the heat passes through their walls.', 'مواسير رفيعة الحيطة على تقسيمة مثلثة؛ الحرارة بتعدي من حيطانها.'], mat: 'sst', ex: [0, 0, 0], s: tubes },
        { id: 'shell', name: ['Shell with nozzles', 'الغلاف والنوزلات'], role: ['Pressure shell; shell-side inlet on top at one end, outlet at the bottom of the other.', 'غلاف الضغط؛ دخول ناحية الغلاف من فوق في طرف والخروج من تحت في الطرف التاني.'], mat: 'sst', ex: [0, 40, 0],
          s: [{ t: 'cyl', r: 13.5, ri: 13.0, h: 145, ax: 'x', p: [0, 0, 0] }, { t: 'flange', r: 17, ri: 13.0, h: 2.5, ax: 'x', holes: 12, pcd: 15.5, hr: 0.6, p: [-73.75, 0, 0] }, { t: 'flange', r: 17, ri: 13.0, h: 2.5, ax: 'x', holes: 12, pcd: 15.5, hr: 0.6, p: [73.75, 0, 0] },
            ...noz(-62, 1, 4), ...noz(62, -1, 4)] },
        { id: 'saddles', name: ['Saddle supports', 'الكراسي (السروج)'], role: ['Welded to the shell; one end is often slotted for thermal growth.', 'ملحومة في الغلاف؛ وغالباً واحدة فيها خرم مشقوق للتمدد الحراري.'], mat: 'castg', ex: [0, 40, 0], s: [...saddle(-45), ...saddle(45)] },
        { id: 'tubesheet_b', name: ['Rear tube sheet', 'التيوب شيت الخلفي'], role: ['Second tube sheet at the return end.', 'التيوب شيت التاني عند ناحية الرجوع.'], mat: 'sst', ex: [0, 0, 0],
          s: [{ t: 'flange', r: 17, h: 3, ax: 'x', holes: 12, pcd: 15.5, hr: 0.6, p: [76.5, 0, 0] }] },
        { id: 'gasket_a', name: ['Front gasket', 'الجوان الأمامي'], role: ['Seals the channel to the tube sheet, including the partition plate rib.', 'بيقفل بين الراس والتيوب شيت ومعاه ضلع لوح الفصل.'], mat: 'black', ex: [-15, 0, 0],
          s: [{ t: 'cyl', r: 17, ri: 13.0, h: 0.3, ax: 'x', p: [-78.15, 0, 0] }, { t: 'box', w: 0.3, h: 0.6, d: 26, p: [-78.15, 0, 0] }] },
        { id: 'channel_a', name: ['Front channel with partition', 'الراس الأمامي ولوح الفصل'], role: ['Tube-side inlet and outlet; the partition plate makes two passes.', 'دخول وخروج ناحية المواسير؛ لوح الفصل بيعمل مشوارين.'], mat: 'sst', ex: [-30, 0, 0],
          s: [{ t: 'cyl', r: 13.5, ri: 13.0, h: 16.7, ax: 'x', p: [-89.15, 0, 0] }, { t: 'flange', r: 17, ri: 13.0, h: 2.5, ax: 'x', holes: 12, pcd: 15.5, hr: 0.6, p: [-79.55, 0, 0] }, { t: 'flange', r: 17, ri: 13.0, h: 2.5, ax: 'x', holes: 12, pcd: 15.5, hr: 0.6, p: [-98.75, 0, 0] },
            { t: 'flange', r: 17, h: 2.5, ax: 'x', holes: 12, pcd: 15.5, hr: 0.6, p: [-101.25, 0, 0] }, { t: 'box', w: 19.2, h: 0.6, d: 26, p: [-89.4, 0, 0] },
            ...noz(-89, 1, 3.5), ...noz(-89, -1, 3.5), ...studs(-82.5, -71.5), ...studs(-103.5, -96.5)] },
        { id: 'gasket_b', name: ['Rear gasket', 'الجوان الخلفي'], role: ['Seals the return bonnet.', 'بيقفل الراس الخلفي.'], mat: 'black', ex: [15, 0, 0],
          s: [{ t: 'cyl', r: 17, ri: 13.0, h: 0.3, ax: 'x', p: [78.15, 0, 0] }] },
        { id: 'channel_b', name: ['Rear return bonnet', 'الراس الخلفي (الرجوع)'], role: ['Turns the tube-side flow back into the second pass.', 'بيرجّع سائل المواسير للمشوار التاني.'], mat: 'sst', ex: [30, 0, 0],
          s: [{ t: 'flange', r: 17, ri: 13.0, h: 2.5, ax: 'x', holes: 12, pcd: 15.5, hr: 0.6, p: [79.55, 0, 0] }, { t: 'cyl', r: 13.5, ri: 13.0, h: 10, ax: 'x', p: [85.8, 0, 0] },
            { t: 'lathe', ax: 'x', pts: [[13.5, 90.8], [13.0, 90.8], ...arc(1, 0, 90, 10).map(([c, s]) => [f3(13.0 * c), f3(90.8 + 6 * s)]).slice(1), [0, 97.3], ...arc(1, 90, 0, 10).map(([c, s]) => [f3(13.5 * c), f3(90.8 + 6.5 * s)]).slice(1)] },
            ...studs(71.5, 82.5)] },
      ],
      steps: ['tubesheet_a', 'tie_rods', 'baffles', 'tubes', 'shell', 'saddles', 'tubesheet_b', 'gasket_a', 'channel_a', 'gasket_b', 'channel_b'],
      quiz: [
        { q: ['Outlet temperature keeps falling and pressure drop rises over months. Likely cause?', 'حرارة الخروج بتقل وفرق الضغط بيزيد على مدار شهور. السبب المحتمل؟'], a: ['Fouling or scale on the tubes', 'ترسيب وقشور على المواسير'], w: [['Gasket too tight', 'الجوان مربوط زيادة'], ['Too many baffles', 'بافلز كتير'], ['Saddle loose', 'الكرسي سايب']] },
        { q: ['What do the baffles do on the shell side?', 'البافلز بتعمل إيه في ناحية الغلاف؟'], a: ['Make the fluid cross the tubes and support the tubes', 'بتخلي السائل يعدي على المواسير وبتسندها'], w: [['Seal the tube side', 'بتقفل ناحية المواسير'], ['Filter the water', 'بتفلتر المية'], ['Hold the gaskets', 'بتمسك الجوانات']] },
        { q: ['Why do pharma water exchangers use double tube sheets?', 'ليه مبادلات المية الدوائية بدبل تيوب شيت؟'], a: ['A leak drains outside instead of mixing the fluids', 'أي تسريب بينزل بره بدل ما يخلط السوائل'], w: [['Better heat transfer', 'نقل حرارة أحسن'], ['Cheaper to make', 'أرخص'], ['Less pressure drop', 'فرق ضغط أقل']] },
      ],
    });
  })();

  /* ---------------- gasketed plate heat exchanger ---------------- */
  (function () {
    const N = 40, pitch = 0.35, YC = 42, rr = 3;
    const outline = [...arc(rr, 0, 90, 6, 28 - rr, 11 - rr), ...arc(rr, 90, 180, 6, -28 + rr, 11 - rr), ...arc(rr, 180, 270, 6, -28 + rr, -11 + rr), ...arc(rr, 270, 360, 6, 28 - rr, -11 + rr)];   // [y, z]
    const ports = [[23, 7.5], [23, -7.5], [-23, 7.5], [-23, -7.5]];
    const plates = [], gaskets = [];
    const corners = [[26.6, 9.6], [26.6, -9.6], [-26.6, -9.6], [-26.6, 9.6]], loop = [];
    corners.forEach((c, k) => { const d = corners[(k + 1) % 4]; for (let j = 0; j < 8; j++) loop.push([f3(c[0] + ((d[0] - c[0]) * j) / 8), f3(c[1] + ((d[1] - c[1]) * j) / 8)]); });
    for (let i = 0; i < N; i++) {
      const x = f3(0.2 + i * pitch);
      plates.push({ t: 'ext', ax: 'x', d: 0.08, p: [x, YC, 0], pts: YZ(outline), holes: ports.map(([y, z]) => ({ c: [-y, -z], r: 2.3 })) });
      gaskets.push({ t: 'tube', r: 0.1, closed: true, sharp: true, path: loop.map(([y, z]) => [f3(x + 0.12), f3(YC + y), z]) });
      const zs = i % 2 ? -7.5 : 7.5;
      gaskets.push({ t: 'torus', R: 2.8, r: 0.1, ax: 'x', p: [f3(x + 0.12), YC + 23, zs] }, { t: 'torus', R: 2.8, r: 0.1, ax: 'x', p: [f3(x + 0.12), YC - 23, zs] });
    }
    const L = f3(0.2 + N * pitch);   // pack length
    const portN = ports.flatMap(([y, z]) => [{ t: 'cyl', r: 2.8, ri: 2.3, h: 8, ax: 'x', p: [-8, YC + y, z] }, { t: 'flange', r: 5, ri: 2.3, h: 1.2, ax: 'x', holes: 4, p: [-12.6, YC + y, z] }]);
    const bolts = []; [[YC + 20, 17.2], [YC + 20, -17.2], [YC - 20, 17.2], [YC - 20, -17.2]].forEach(([y, z]) => bolts.push({ t: 'cyl', r: 1.0, h: f3(L + 14), ax: 'x', p: [f3((-6 + L + 8) / 2), y, z] }, { t: 'hex', r: 1.9, h: 1.8, ax: 'x', p: [-4.9, y, z] }, { t: 'hex', r: 1.9, h: 1.8, ax: 'x', p: [f3(L + 3 + 0.9), y, z] }));
    M.add({
      id: 'plate_hx', cat: 'process',
      name: ['Gasketed plate heat exchanger', 'مبادل حراري ألواح بجوانات'],
      info: {
        what: ['A pack of thin pressed stainless plates with rubber gaskets, squeezed between a fixed frame plate and a movable pressure plate by tie bolts. The two fluids flow in alternate gaps.', 'باكو ألواح استانلس رفيعة مكبوسة بجوانات كاوتش، متزنقة بين لوح ثابت ولوح ضغط متحرك بمسامير شد طويلة. السائلين بيمشوا في الفراغات بالتبادل.'],
        use: ['Utility heating and cooling: chilled water, cooling tower isolation, hot water for HVAC, heat recovery; in product service only with suitable (often double-wall) plates.', 'تسخين وتبريد المرافق: المية المتلجة، فصل برج التبريد، المية السخنة للتكييف، استرجاع الحرارة؛ وفي خدمة المنتج بس بألواح مناسبة (غالباً دبل وول).'],
        how: ['Corrugated (chevron) plates make strong turbulence, so a small unit moves a lot of heat. Gaskets steer each fluid into every second gap and ring-seal the other ports; flows are counter-current.', 'الألواح المتعرجة (شيفرون) بتعمل اضطراب قوي فوحدة صغيرة بتنقل حرارة كتير. الجوانات بتوجه كل سائل لفراغ وفراغ وبتقفل حوالين البورتات التانية؛ والسريان عكس بعض.'],
        fail: ['External drips from aged or displaced gaskets, internal leak through a cracked or pinholed plate (fluids mix), fouling (pressure drop up, duty down), plates damaged by over-tightening.', 'نقط من بره من جوانات قديمة أو زاحت، تسريب داخلي من لوح مشروخ أو مخروم (السوائل تختلط)، ترسيب (فرق الضغط يزيد والكفاءة تقل)، ألواح اتبوّظت من الربط الزيادة.'],
        pm: ['Tighten evenly, crosswise, to the nameplate pack length ("A" dimension), never beyond. Clean plates, check them with dye penetrant, replace gaskets as a set, keep tie bolt threads greased.', 'اربط بالتساوي وبالتقاطع لحد طول الباكو المكتوب على اللوحة (مقاس A) ومتعدّهوش. نضّف الألواح وافحصها بالصبغة، غيّر الجوانات طقم كامل، وخلي سن المسامير متشحم.'],
      },
      cut: 'z',
      parts: [
        { id: 'frame', name: ['Fixed frame plate with ports', 'اللوح الثابت والبورتات'], role: ['Heavy fixed plate carrying the four pipe connections.', 'لوح تقيل ثابت شايل وصلات المواسير الأربعة.'], mat: 'blue', ex: [0, 0, 0],
          s: [{ t: 'box', w: 4, h: 78, d: 32, p: [-2, 39, 0] }, ...portN.map((q) => ({ ...q, m: 'sst' }))] },
        { id: 'carrying_bar', name: ['Carrying bar', 'العمود الحامل (فوق)'], role: ['Top bar that the plates and the pressure plate hang on.', 'العمود اللي فوق الألواح ولوح الضغط متعلقين عليه.'], mat: 'sst', ex: [0, 8, 0],
          s: [{ t: 'box', w: 52, h: 3, d: 3, p: [26, 75.5, 0] }] },
        { id: 'guide_bar', name: ['Guide bar', 'عمود الدليل (تحت)'], role: ['Bottom bar that keeps the plates in line.', 'العمود اللي تحت بيخلي الألواح على خط واحد.'], mat: 'sst', ex: [0, -6, 0],
          s: [{ t: 'box', w: 52, h: 3, d: 3, p: [26, 7.5, 0] }] },
        { id: 'column', name: ['Support column', 'العمود الساند'], role: ['Holds the far end of both bars.', 'ماسك آخر العمودين.'], mat: 'blue', ex: [26, 0, 0],
          s: [{ t: 'box', w: 4, h: 77, d: 6, p: [54, 38.5, 0] }, { t: 'box', w: 10, h: 1, d: 12, p: [54, 0.5, 0] }] },
        { id: 'plates', name: ['Heat transfer plates', 'ألواح نقل الحرارة'], role: ['Pressed 0.5-0.8 mm stainless plates with four port holes.', 'ألواح استانلس مكبوسة 0.5-0.8 مم فيها أربع خروم بورت.'], mat: 'sst', ex: [20, 0, 0], s: plates },
        { id: 'gaskets', name: ['Plate gaskets', 'جوانات الألواح'], role: ['Perimeter gasket plus ring gaskets around the two ports not used by that gap.', 'جوان على المحيط وجوانات حلقية حوالين البورتين اللي مش للفراغ ده.'], mat: 'black', ex: [20, 0, 32], cut: false, s: gaskets },
        { id: 'pressure_plate', name: ['Pressure (movable) plate', 'لوح الضغط (المتحرك)'], role: ['Slides on the bars; the tie bolts pull it against the pack.', 'بيتزحلق على العمدان، ومسامير الشد بتشده على الباكو.'], mat: 'blue', ex: [36, 0, 0],
          s: [{ t: 'box', w: 3, h: 60, d: 30, p: [f3(L + 1.5), YC, 0] }, { t: 'cyl', r: 1.2, h: 2, ax: 'z', p: [f3(L + 1.5), 73, 0], m: 'black' }, { t: 'box', w: 1, h: 2, d: 1, p: [f3(L + 1.5), 72.5, 1.6], m: 'steel' }] },
        { id: 'tie_bolts', name: ['Tie bolts and nuts', 'مسامير الشد والصواميل'], role: ['Long bolts that set the pack length ("A" dimension).', 'مسامير طويلة بتحدد طول الباكو (مقاس A).'], mat: 'steel', ex: [0, 0, 0], cut: false, s: bolts },
      ],
      steps: ['frame', 'guide_bar', 'carrying_bar', 'column', 'plates', 'gaskets', 'pressure_plate', 'tie_bolts'],
      quiz: [
        { q: ['How tight do you pull the plate pack?', 'تربط باكو الألواح لحد فين؟'], a: ['To the nameplate pack length ("A" dimension), evenly', 'لحد طول الباكو المكتوب (مقاس A) وبالتساوي'], w: [['As tight as possible', 'لآخر ما تقدر'], ['Until it stops dripping, any length', 'لحد ما يبطل ينقط بأي طول'], ['Hand tight only', 'بالإيد بس']] },
        { q: ['The two fluids are mixing but nothing drips outside. Likely cause?', 'السائلين بيختلطوا ومفيش نقط بره. السبب المحتمل؟'], a: ['A cracked or pinholed plate', 'لوح مشروخ أو مخروم'], w: [['Loose tie bolt', 'مسمار شد سايب'], ['Dirty frame plate', 'اللوح الثابت وسخ'], ['Guide bar bent', 'عمود الدليل معووج']] },
      ],
    });
  })();

  /* ---------------- float and thermostatic steam trap ---------------- */
  (function () {
    const P = [4.2, -2.2, -1];   // lever pivot
    const bolts = []; for (let i = 0; i < 8; i++) { const a = ((i + 0.5) / 8) * 360 * D, x = f3(8.5 * Math.cos(a)), y = f3(8.5 * Math.sin(a)); bolts.push({ t: 'cyl', r: 0.32, h: 3.0, ax: 'z', p: [x, y, 3.3] }, { t: 'hex', r: 0.62, h: 0.5, ax: 'z', p: [x, y, 4.75] }); }
    const fl = Math.hypot(5.8, 1.2), fa = Math.atan2(-1.2, 5.8) / D;
    M.add({
      id: 'steam_trap', cat: 'process',
      name: ['Steam trap (float and thermostatic)', 'مصيدة بخار (عوامة وثيرموستاتيك)'],
      info: {
        what: ['Automatic valve that lets condensate and air out but keeps steam in. A ball float opens the main valve as condensate collects; a thermostatic capsule vents air.', 'محبس أوتوماتيك بيطلّع الكوندنسيت والهوا ويحجز البخار. عوامة كورة بتفتح البلف الرئيسي لما الكوندنسيت يتجمع، وكبسولة ثيرموستاتيك بتطلّع الهوا.'],
        use: ['Steam heat exchangers and tank jackets, autoclaves, HVAC steam heaters and humidifiers, clean steam users and drip legs on steam mains.', 'مبادلات البخار وجاكيتات التانكات، الأوتوكلاف، سخانات البخار والمرطبات في التكييف، مستخدمي البخار النظيف ونقط الصرف على خطوط البخار.'],
        how: ['Condensate level lifts the float, the lever pulls the valve head off the seat and discharge follows the load continuously. At start-up the cool capsule is open and lets air out; at steam temperature it expands and closes.', 'منسوب الكوندنسيت بيرفع العوامة، والدراع بيبعّد راس البلف عن السيت والتصريف بيمشي مع الحمل على طول. في التشغيل الكبسولة ساقعة ومفتوحة فتطلّع الهوا، ولما توصل لحرارة البخار تتمدد وتقفل.'],
        fail: ['Failed open: live steam blowing through (hot outlet, energy loss, high back pressure). Failed closed or flooded float: water-logging, cold equipment, water hammer. Dirt on the seat, failed air vent gives slow start-up.', 'عطلانة مفتوحة: بخار حي بيعدي (الخروج سخن جداً، فاقد طاقة، ضغط رجوع عالي). عطلانة مقفولة أو العوامة اتملت: غرق بالمية، المعدة ساقعة، خبط مية. وسخ على السيت، والهوّاية البايظة بتبطّأ التشغيل.'],
        pm: ['Survey all traps at least yearly with ultrasound and temperature, clean the strainer before the trap, fit it level with the float arm moving vertically, below the equipment with a drop; renew internals with a repair kit.', 'افحص كل المصايد مرة في السنة على الأقل بالألتراساوند والحرارة، نضّف المصفاة اللي قبلها، ركّبها أفقي والعوامة بتتحرك رأسي، تحت المعدة وبميل؛ وجدد الأجزاء الداخلية بطقم إصلاح.'],
      },
      cut: 'z',
      parts: [
        { id: 'body', name: ['Body', 'الجسم'], role: ['Ductile-iron chamber; inlet high on one side, outlet low on the other.', 'غرفة حديد زهر مرن؛ الدخول عالي من ناحية والخروج واطي من الناحية التانية.'], mat: 'castg', ex: [0, 0, 0],
          s: [{ t: 'lathe', ax: 'z', seg: 56, pts: sharp([[0, -6], [8, -6], [8, 2], [9, 2], [9, 3], [7.2, 3], [7.2, -5], [0, -5], [0, -6]], 0.03) },
            { t: 'cyl', r: 1.6, h: 5, ax: 'x', p: [-9.4, 4, -1] }, { t: 'hex', r: 2.0, h: 1.6, ax: 'x', p: [-11.9, 4, -1] },
            { t: 'cyl', r: 1.6, h: 5, ax: 'x', p: [8.7, -5, -1] }, { t: 'hex', r: 2.0, h: 1.6, ax: 'x', p: [11.2, -5, -1] }] },
        { id: 'seat', name: ['Main valve seat', 'سيت البلف الرئيسي'], role: ['Hardened stainless orifice in front of the outlet.', 'فتحة استانلس مقساة قدام الخروج.'], mat: 'sst', ex: [0, 0, 2], cut: false,
          s: [{ t: 'cyl', r: 0.9, ri: 0.35, h: 1.0, ax: 'x', p: [5.2, -5.0, -1] }] },
        { id: 'pivot', name: ['Pivot frame', 'فريم المحور'], role: ['Bracket that carries the lever pin, screwed to the seat boss.', 'كتيفة شايلة مسمار الدراع، متربطة على قاعدة السيت.'], mat: 'sst', ex: [0, 0, 3], cut: false,
          s: [{ t: 'box', w: 0.8, h: 3.8, d: 0.3, p: [4.4, -3.8, -2.1] }, { t: 'cyl', r: 0.18, h: 1.7, ax: 'z', p: [4.2, -2.2, -1.25] }] },
        { id: 'lever', name: ['Lever with valve head', 'الدراع وراس البلف'], role: ['Turns the float lift into opening of the valve head.', 'بيحوّل طلوع العوامة لفتح راس البلف.'], mat: 'sst', o: P, ex: [0, 0, 4.5], cut: false,
          s: [{ t: 'box', w: f3(fl), h: 0.4, d: 0.5, rot: [0, 0, f3(fa)], p: [-2.9, 0.6, 0] }, { t: 'box', w: 0.5, h: 2.9, d: 0.5, rot: [0, 0, 6], p: [0.15, -1.35, 0] }, { t: 'cyl', r: 0.7, h: 0.3, ax: 'x', p: [0.35, -2.8, 0], m: 'ptfe' }] },
        { id: 'float', name: ['Ball float', 'العوامة (كورة)'], role: ['Sealed stainless ball: rises with the condensate level.', 'كورة استانلس مقفولة: بتطلع مع منسوب الكوندنسيت.'], mat: 'sst', o: P, ex: [0, 0, 8.5], cut: false,
          s: [{ t: 'sph', r: 3.3, p: [-5.8, 1.2, 0] }] },
        { id: 'air_vent', name: ['Thermostatic air vent', 'الهوّاية الثيرموستاتيك'], role: ['Balanced-pressure capsule: open when cool to release air, closed at steam temperature.', 'كبسولة بضغط متوازن: مفتوحة وهي ساقعة عشان تطلّع الهوا، ومقفولة على حرارة البخار.'], mat: 'copper', ex: [0, 0, 5], cut: false,
          s: [{ t: 'cyl', r: 1.5, h: 0.8, p: [3.6, 4.3, -1] }, { t: 'torus', R: 1.5, r: 0.12, p: [3.6, 4.3, -1] }, { t: 'cyl', r: 0.18, h: 0.8, p: [3.6, 5.0, -1], m: 'sst' }, { t: 'cyl', r: 0.6, ri: 0.2, h: 0.5, p: [3.6, 5.6, -1], m: 'sst' }] },
        { id: 'gasket', name: ['Cover gasket', 'جوان الغطا'], role: ['Graphite gasket between body and cover.', 'جوان جرافيت بين الجسم والغطا.'], mat: 'grey', ex: [0, 0, 10],
          s: [{ t: 'cyl', r: 9, ri: 7.2, h: 0.3, ax: 'z', p: [0, 0, 3.15] }] },
        { id: 'cover', name: ['Cover', 'الغطا'], role: ['Bolted cover: remove it to reach all the internals in line.', 'غطا بمسامير: بتشيله وتوصل لكل الأجزاء من غير ما تفك المواسير.'], mat: 'castg', ex: [0, 0, 14],
          s: [{ t: 'lathe', ax: 'z', seg: 56, pts: sharp([[0, 3.3], [9, 3.3], [9, 4.5], [7, 4.6], [4, 5.3], [0, 5.5]], 0.03) }] },
        { id: 'bolts', name: ['Cover bolts', 'مسامير الغطا'], role: ['Tighten crosswise to the stated torque.', 'اربطها بالتقاطع بالعزم المكتوب.'], mat: 'steel', ex: [0, 0, 20], s: bolts },
      ],
      steps: ['body', 'seat', 'pivot', 'lever', 'float', 'air_vent', 'gasket', 'cover', 'bolts'],
      anim: { mode: 'toggle', label: ['Condensate rises', 'الكوندنسيت يعلى'], parts: { float: { rot: [0, 0, 1], a: [0, -15] }, lever: { rot: [0, 0, 1], a: [0, -15] } } },
      quiz: [
        { q: ['The trap outlet is very hot and you hear continuous hissing. The trap has…', 'خروج المصيدة سخن جداً وفيه صفير مستمر. المصيدة…'], a: ['Failed open, passing live steam', 'عطلانة مفتوحة وبتعدي بخار حي'], w: [['Failed closed', 'عطلانة مقفولة'], ['Working normally', 'شغالة طبيعي'], ['Lost its air vent only', 'الهوّاية بس اللي باظت']] },
        { q: ['What lets air out at start-up?', 'إيه اللي بيطلّع الهوا وقت التشغيل؟'], a: ['The thermostatic air vent', 'الهوّاية الثيرموستاتيك'], w: [['The ball float', 'العوامة'], ['The cover gasket', 'جوان الغطا'], ['The main seat', 'السيت الرئيسي']] },
      ],
    });
  })();
})(typeof window !== 'undefined' ? window : globalThis);
