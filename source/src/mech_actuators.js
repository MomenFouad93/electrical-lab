/* Mechanical: solenoids & pneumatics (solenoid valve, 5/2 valve, ISO cylinder, rack & pinion actuator, FRL unit) */
(function (g) {
  const EL = g.EL, M = EL.mech, D = Math.PI / 180;
  // 2D helpers for 'ext' outlines (same as mech_valves.js)
  const arc = (r, a0, a1, n, cu, cv) => { const o = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * D; o.push([(cu || 0) + r * Math.cos(a), (cv || 0) + r * Math.sin(a)]); } return o; };
  const band = (r, ri, a0, a1, n) => arc(r, a0, a1, n).concat(arc(ri, a1, a0, n));
  const rr = (u0, u1, v0, v1, r) => [].concat(arc(r, 270, 360, 4, u1 - r, v0 + r), arc(r, 0, 90, 4, u1 - r, v1 - r), arc(r, 90, 180, 4, u0 + r, v1 - r), arc(r, 180, 270, 4, u0 + r, v0 + r));
  const onX = (p) => p.map((q) => [-q[0], -q[1]]); // ext ax 'x': points as [y, z]
  const onY = (p) => p.map((q) => [q[0], -q[1]]); // ext ax 'y': points as [x, z]
  const hX = (y, z, r) => ({ c: [-y, -z], r }), hY = (x, z, r) => ({ c: [x, -z], r });
  const C4 = (a, b) => [[a, b], [-a, b], [a, -b], [-a, -b]];
  // box from x/y ranges (used for the middle layer of block bodies), z depth d centred at z
  const bx = (x0, x1, y0, y1, d, z, m) => { const o = { t: 'box', w: x1 - x0 - 0.003, h: y1 - y0 - 0.003, d, p: [(x0 + x1) / 2, (y0 + y1) / 2, z || 0] }; if (m) o.m = m; return o; };

  /* ---------- 2/2 solenoid valve, direct acting, normally closed, G1/4 brass ---------- */
  // body: front/back skins + middle layer (z ±0.62) carrying the passages so the cut shows them
  const svMid = [
    [[-2.2, -1.4], [2.2, -1.4], [2.2, -0.7], [-0.15, -0.7], [-0.15, 0.0], [-1.1, 0.0], [-1.1, -0.7], [-2.2, -0.7]],
    [[0.15, -0.45], [1.1, -0.45], [1.1, 0.3], [2.2, 0.3], [2.2, 1.0], [0.7, 1.0], [0.7, 0.0], [0.15, 0.0]],
    [[-2.2, 0.3], [-0.7, 0.3], [-0.7, 1.0], [-2.2, 1.0]]];
  M.add({
    id: 'solenoid_valve', cat: 'actuators',
    name: ['Solenoid valve 2/2 (direct acting, NC)', 'محبس سولينويد 2/2 (مباشر، مقفول عادي NC)'],
    info: {
      what: ['Electrically operated on/off valve. A coil pulls a steel plunger off a small orifice; a spring closes it again.', 'محبس فتح وقفل بالكهربا. الكويل بيشد بلنجر حديد من على خرم صغير، والسوستة بتقفله تاني.'],
      use: ['Water, air and steam dosing and on/off: CIP water, humidifier steam, coating pan air, cooling water on machines, purge lines.', 'فتح وقفل وجرعات للمية والهوا والبخار: مية الـ CIP، بخار المرطبات، هوا حلّة الكوتنج، مية تبريد المكن، خطوط البيرج.'],
      how: ['Coil off: the spring and the line pressure hold the seal on the orifice. Coil on: the magnetic field pulls the plunger up to the fixed core and flow passes. Direct acting works from 0 bar.', 'الكويل فاصل: السوستة وضغط الخط ماسكين الجوان على الخرم. الكويل شغال: المجال المغناطيسي بيشد البلنجر لفوق للقلب الثابت فالسريان يعدّي. المباشر بيشتغل من صفر بار.'],
      fail: ['Coil burnt (open circuit, smell, dark colour), valve hums or buzzes on AC (broken shading ring, dirt under the plunger), passing when closed (dirty or worn seal), stuck plunger.', 'الكويل محروق (مفتوح، ريحة، لونه غامق)، المحبس بيزن أو بيطن على الـ AC (حلقة التظليل مكسورة أو وساخة تحت البلنجر)، بيعدّي وهو مقفول (الجوان وسخ أو دايب)، بلنجر لازق.'],
      pm: ['Check coil voltage and resistance, never energise a coil off its tube (it burns), fit a strainer before it, keep the arrow with the flow, replace seal and plunger with a repair kit.', 'اتأكد من فولت الكويل ومقاومته، أبداً متشغلش الكويل وهو برا الأنبوبة (هيتحرق)، ركّب مصفاة قبله، خلي السهم مع السريان، وغيّر الجوان والبلنجر بطقم إصلاح.'],
    },
    cut: 'z',
    parts: [
      { id: 'body', name: ['Valve body', 'جسم المحبس'], role: ['Brass body with the ports, the orifice and the seat.', 'جسم نحاس فيه المداخل والخرم والكرسي.'], mat: 'brass', ex: [0, 0, 0],
        s: [{ t: 'box', w: 4.4, h: 2.4, d: 0.774, p: [0, -0.2, 1.0115] }, { t: 'box', w: 4.4, h: 2.4, d: 0.774, p: [0, -0.2, -1.0115] }].concat(
          svMid.map((pts) => ({ t: 'ext', ax: 'z', d: 1.24, pts })),
          [-2.23, 2.23].map((x) => ({ t: 'ext', ax: 'x', d: 0.06, p: [x, 0, 0], pts: onX(rr(-1.4, 1.0, -1.4, 1.4, 0.05)), holes: [hX(-0.2, 0, 0.5)] })),
          [-1.65, 1.65].map((x) => ({ t: 'spring', ax: 'x', R: 0.51, r: 0.035, turns: 6, len: 1.0, p: [x, -0.2, 0] })),
          [{ t: 'cyl', r: 1.0, ri: 0.7, h: 0.5, p: [0, 1.25, 0] }, { t: 'cyl', r: 0.3, ri: 0.15, h: 0.12, p: [0, 0.06, 0] },
            { t: 'cone', r1: 0.001, r2: 0.35, h: 0.6, ax: 'x', p: [0.6, -1.0, 1.42], m: 'black' }, { t: 'box', w: 1.6, h: 0.18, d: 0.04, p: [-0.5, -1.0, 1.42], m: 'black' }]) },
      { id: 'seal', name: ['Seal (plunger tip)', 'الجوان (في طرف البلنجر)'], role: ['Rubber pad in the plunger tip that shuts the orifice.', 'قطعة كاوتش في طرف البلنجر بتقفل الخرم.'], mat: 'viton', ex: [0, 0.5, 3.5],
        s: [{ t: 'cyl', r: 0.32, h: 0.18, p: [0, 0.21, 0] }] },
      { id: 'plunger', name: ['Plunger (armature)', 'البلنجر (الآرميتشر)'], role: ['Magnetic stainless plunger that moves inside the core tube.', 'بلنجر ستانلس مغناطيسي بيتحرك جوه أنبوبة القلب.'], mat: 'steel', ex: [0, 1.0, 3.5],
        s: [{ t: 'lathe', pts: [[0.32, 0.12], [0.57, 0.12], [0.57, 2.95], [0.3, 2.95], [0.3, 2.2], [0, 2.2], [0, 0.3], [0.32, 0.3], [0.32, 0.12]] }] },
      { id: 'spring', name: ['Return spring', 'سوستة الرجوع'], role: ['Pushes the plunger down to close when the coil is off.', 'بتزق البلنجر لتحت يقفل لما الكويل يفصل.'], mat: 'steel', ex: [0, 1.8, 3.5], cut: false,
        s: [{ t: 'spring', R: 0.24, r: 0.04, turns: 6, len: 0.9, p: [0, 2.65, 0] }] },
      { id: 'core_tube', name: ['Core tube with fixed core', 'أنبوبة القلب بالقلب الثابت'], role: ['Sealed stainless tube; the fixed core on top carries the copper shading ring for AC.', 'أنبوبة ستانلس مقفولة، والقلب الثابت فوق فيه حلقة التظليل النحاس للـ AC.'], mat: 'sst', ex: [0, 2.0, 0],
        s: [{ t: 'hex', r: 1.1, ri: 0.8, h: 0.35, p: [0, 1.675, 0] }, { t: 'cyl', r: 0.68, ri: 0.6, h: 3.3, p: [0, 2.85, 0] },
          { t: 'cyl', r: 0.594, h: 1.6, p: [0, 3.9, 0], m: 'steel' }, { t: 'torus', R: 0.4, r: 0.05, p: [0, 3.13, 0], m: 'copper' }, { t: 'cyl', r: 0.3, h: 1.3, p: [0, 5.35, 0], m: 'steel' }] },
      { id: 'coil', name: ['Coil', 'الكويل (الملف)'], role: ['Copper winding in epoxy; slides over the core tube. Voltage is printed on it.', 'لفة نحاس في إيبوكسي، بتتركب على أنبوبة القلب. الفولت مكتوب عليها.'], mat: 'black', ex: [0, 6.5, 0],
        s: [{ t: 'ext', ax: 'y', d: 3.2, p: [0, 3.5, 0], pts: onY(rr(-1.5, 1.5, -1.5, 1.5, 0.3)), holes: [hY(0, 0, 1.262)] },
          { t: 'cyl', r: 1.25, ri: 0.74, h: 2.96, p: [0, 3.5, 0], m: 'copper' }, { t: 'cyl', r: 1.25, ri: 0.74, h: 0.117, p: [0, 1.96, 0] }, { t: 'cyl', r: 1.25, ri: 0.74, h: 0.117, p: [0, 5.04, 0] },
          { t: 'box', w: 0.997, h: 1.6, d: 1.6, p: [-2.0, 3.5, 0] }] },
      { id: 'coil_nut', name: ['Coil nut', 'صامولة الكويل'], role: ['Holds the coil on the core tube.', 'ماسكة الكويل على أنبوبة القلب.'], mat: 'steel', ex: [0, 7.0, 0],
        s: [{ t: 'cyl', r: 0.75, ri: 0.32, h: 0.05, p: [0, 5.125, 0] }, { t: 'hex', r: 0.65, ri: 0.36, h: 0.45, p: [0, 5.375, 0] }] },
      { id: 'connector', name: ['Plug connector (DIN)', 'الفيشة (DIN)'], role: ['Plug with gasket and screw; carries the supply to the coil pins.', 'فيشة بجوان ومسمار، بتوصّل الكهربا لأطراف الكويل.'], mat: 'grey', ex: [-3, 6.5, 0],
        s: [{ t: 'box', w: 1.8, h: 2.4, d: 2.0, p: [-3.44, 3.5, 0] }, { t: 'box', w: 0.08, h: 1.6, d: 1.6, p: [-2.5, 3.5, 0], m: 'black' },
          { t: 'cyl', r: 0.55, h: 1.0, p: [-3.44, 1.8, 0], m: 'black' }, { t: 'cyl', ax: 'x', r: 0.2, h: 0.3, p: [-4.49, 3.5, 0], m: 'steel' }] },
    ],
    steps: ['body', 'seal', 'plunger', 'spring', 'core_tube', 'coil', 'coil_nut', 'connector'],
    anim: { mode: 'toggle', label: ['Energise / off', 'شغّل / افصل'], parts: { plunger: { slide: [0, 0.15, 0] }, seal: { slide: [0, 0.15, 0] } } },
    quiz: [
      { q: ['An AC solenoid valve hums loudly when energised. Likely cause?', 'محبس سولينويد AC بيطن جامد وهو شغال. السبب الأغلب؟'], a: ['Broken shading ring or dirt stops the plunger closing the gap', 'حلقة التظليل مكسورة أو وساخة مانعة البلنجر يقفل الفجوة'], w: [['Supply voltage too high only', 'الفولت عالي بس'], ['Wrong flow direction', 'اتجاه السريان غلط'], ['The connector gasket is missing', 'جوان الفيشة ناقص']] },
      { q: ['Why must a coil never be energised off the valve?', 'ليه الكويل ميتشغلش وهو مفكوك من المحبس؟'], a: ['Without the iron path the current stays high and the coil burns', 'من غير القلب الحديد التيار بيفضل عالي والكويل يتحرق'], w: [['It can fly off', 'ممكن يطير'], ['It loses its magnet', 'بيفقد المغناطيس'], ['Nothing happens', 'مفيش حاجة']] },
      { q: ['NC means…', 'NC معناها…'], a: ['Closed with no power', 'مقفول من غير كهربا'], w: [['Closed with power', 'مقفول بالكهربا'], ['No coil', 'مفيهوش كويل'], ['Needs no cable', 'مش محتاج كابل']] },
    ],
  });

  /* ---------- 5/2 single-solenoid spool valve, spring return ---------- */
  const v5Mid = [[-3.6, -1.6, 0.5, 1.2], [-0.8, 0.8, 0.5, 1.2], [1.6, 3.6, 0.5, 1.2], [-3.6, -2.8, -1.2, -0.5], [-2.0, -0.4, -1.2, -0.5], [0.4, 2.0, -1.2, -0.5], [2.8, 3.6, -1.2, -0.5]];
  const v5Cap = onX(rr(-1.2, 1.2, -1.1, 1.1, 0.2));
  const fit = (x, dir) => [{ t: 'hex', r: 0.75, h: 0.3, p: [x, dir * 1.35, 0] }, { t: 'cyl', r: 0.6, ri: 0.3, h: 0.9, p: [x, dir * 1.95, 0] }, { t: 'cyl', r: 0.5, ri: 0.3, h: 0.25, p: [x, dir * 2.52, 0], m: 'blue' }];
  M.add({
    id: 'valve_5_2', cat: 'actuators',
    name: ['5/2 valve (single solenoid, spring return)', 'بلف 5/2 (سولينويد واحد، رجوع بسوستة)'],
    info: {
      what: ['Directional valve with 5 ports and 2 positions. A sliding spool connects supply to one cylinder side and vents the other.', 'بلف توجيه 5 فتحات ووضعين. سبول بيتزحلق يوصل الهوا لناحية من السلندر ويفرّغ الناحية التانية.'],
      use: ['Drives double-acting cylinders on packaging machines: cartoner pushers, blister feeders, reject gates, label and capsule handling.', 'بيشغّل السلندرات الدبل أكتنج في مكن التعبئة: دفّاعات الكارتونر، تغذية البليستر، بوابات الرفض، مسك الليبل والكبسول.'],
      how: ['Port 1 = supply, 2 and 4 = outputs, 3 and 5 = exhausts. At rest the spring keeps 1 to 2 and 4 to 5. The solenoid opens a small pilot, pilot air pushes the piston and spool over: 1 to 4 and 2 to 3.', 'فتحة 1 = الدخول، 2 و4 = الخروج للسلندر، 3 و5 = التفريغ. وهو مرتاح السوستة بتخلي 1 مع 2 و4 مع 5. السولينويد بيفتح بايلوت صغير، وهوا البايلوت يزق البستم والسبول: 1 مع 4 و2 مع 3.'],
      fail: ['Air blowing from an exhaust all the time (worn spool seals), valve does not shift (low pilot pressure, dirt, burnt coil), sticky spool from oil or water in the air.', 'هوا طالع من التفريغ على طول (جوانات السبول دايبة)، البلف مبيحولش (ضغط بايلوت قليل، وساخة، كويل محروق)، سبول لازق من زيت أو مية في الهوا.'],
      pm: ['Test with the manual override button, check the LED and coil voltage, keep air dry and filtered, replace silencers when blocked, change the seal kit when exhausts leak.', 'جرّب بزرار التشغيل اليدوي، شوف اللمبة وفولت الكويل، خلي الهوا ناشف ومفلتر، غيّر السايلنسرات لما تتسد، وغيّر طقم الجوانات لما التفريغ يسرّب.'],
    },
    cut: 'z',
    parts: [
      { id: 'body', name: ['Valve body', 'جسم البلف'], role: ['Aluminium body with the spool bore and ports 1 to 5.', 'جسم ألومنيوم فيه مجرى السبول والفتحات من 1 لـ 5.'], mat: 'alu', ex: [0, 0, 0],
        s: [{ t: 'box', w: 7.2, h: 2.4, d: 0.597, p: [0, 0, 0.8015] }, { t: 'box', w: 7.2, h: 2.4, d: 0.597, p: [0, 0, -0.8015] }].concat(v5Mid.map((q) => bx(q[0], q[1], q[2], q[3], 1.0))) },
      { id: 'spool', name: ['Spool', 'السبول'], role: ['Lands block, grooves connect neighbouring ports.', 'الأكتاف بتقفل، والمجاري بتوصل الفتحات اللي جنب بعض.'], mat: 'sst', ex: [0, 0, 4], cut: false,
        s: [{ t: 'lathe', ax: 'x', pts: [[0, -3.5], [0.49, -3.5], [0.49, -2.75], [0.3, -2.75], [0.3, -0.85], [0.49, -0.85], [0.49, -0.35], [0.3, -0.35], [0.3, 1.55], [0.49, 1.55], [0.49, 2.05], [0.3, 2.05], [0.3, 3.0], [0, 3.0], [0, -3.5]] }] },
      { id: 'spool_seals', name: ['Spool seals', 'جوانات السبول'], role: ['O-rings on the lands seal between the ports.', 'أورينجات على الأكتاف بتقفل بين الفتحات.'], mat: 'black', ex: [0, 0, 6], cut: false,
        s: [-3.1, -0.6, 1.8].map((x) => ({ t: 'torus', ax: 'x', R: 0.42, r: 0.075, p: [x, 0, 0] })) },
      { id: 'piston', name: ['Pilot piston', 'بستم البايلوت'], role: ['Pilot air on this piston pushes the spool over.', 'هوا البايلوت على البستم ده بيزق السبول.'], mat: 'alu', ex: [-3, 0, 4], cut: false,
        s: [{ t: 'cyl', ax: 'x', r: 0.78, h: 0.4, p: [-5.0, 0, 0] }, { t: 'cyl', ax: 'x', r: 0.3, h: 1.3, p: [-4.15, 0, 0] }, { t: 'torus', ax: 'x', R: 0.72, r: 0.07, p: [-5.0, 0, 0], m: 'black' }] },
      { id: 'spring', name: ['Return spring', 'سوستة الرجوع'], role: ['Pushes the spool back when the solenoid is off.', 'بترجّع السبول لما السولينويد يفصل.'], mat: 'steel', ex: [4, 0, 4], cut: false,
        s: [{ t: 'spring', ax: 'x', R: 0.4, r: 0.06, turns: 8, len: 3.1, p: [3.65, 0, 0] }] },
      { id: 'end_cap', name: ['End cap (spring side)', 'غطا الطرف (ناحية السوستة)'], role: ['Closes the bore and holds the spring.', 'بيقفل المجرى وماسك السوستة.'], mat: 'black', ex: [5, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 1.597, p: [4.4, 0, 0], pts: v5Cap, holes: [hX(0, 0, 0.6)] }, { t: 'ext', ax: 'x', d: 0.2, p: [5.3, 0, 0], pts: v5Cap }] },
      { id: 'pilot_cap', name: ['Pilot end cap', 'غطا البايلوت'], role: ['Houses the pilot piston.', 'فيه بستم البايلوت.'], mat: 'black', ex: [-4, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 1.797, p: [-4.5, 0, 0], pts: v5Cap, holes: [hX(0, 0, 0.8)] }] },
      { id: 'pilot', name: ['Solenoid pilot with manual override', 'سولينويد البايلوت بزرار يدوي'], role: ['Small solenoid valve that sends pilot air; the button shifts it by hand.', 'سولينويد صغير بيبعت هوا البايلوت، والزرار بيحوّله باليد.'], mat: 'black', ex: [-7, 0, 0],
        s: [{ t: 'box', w: 0.997, h: 2.4, d: 2.2, p: [-5.9, 0, 0] }, { t: 'box', w: 2.6, h: 2.6, d: 2.2, p: [-7.7, 0.1, 0] },
          { t: 'cyl', ax: 'x', r: 0.4, h: 0.6, p: [-9.3, 0.1, 0], m: 'sst' }, { t: 'hex', ax: 'x', r: 0.5, h: 0.3, p: [-9.15, 0.1, 0], m: 'steel' },
          { t: 'cyl', r: 0.25, h: 0.3, p: [-5.9, 1.35, 0], m: 'yellow' }, { t: 'box', w: 1.8, h: 1.2, d: 1.8, p: [-7.7, 2.0, 0], m: 'grey' }] },
      { id: 'fittings', name: ['Push-in fittings (ports 2, 4)', 'وصلات الخراطيم (فتحات 2 و4)'], role: ['Outputs to the cylinder: 4 goes to one side, 2 to the other.', 'الخروج للسلندر: 4 لناحية و2 للناحية التانية.'], mat: 'chrome', ex: [0, 3, 0],
        s: fit(-1.2, 1).concat(fit(1.2, 1)) },
      { id: 'supply_fitting', name: ['Supply fitting (port 1)', 'وصلة الدخول (فتحة 1)'], role: ['Compressed air in.', 'دخول الهوا المضغوط.'], mat: 'chrome', ex: [0, -3, 0],
        s: fit(0, -1) },
      { id: 'silencers', name: ['Exhaust silencers (ports 3, 5)', 'سايلنسرات التفريغ (فتحات 3 و5)'], role: ['Sintered bronze plugs that quieten the exhaust.', 'طبات برونز ملبّد بتهدّي صوت التفريغ.'], mat: 'bronze', ex: [0, -3, 0],
        s: [-2.4, 2.4].map((x) => [{ t: 'hex', r: 0.6, h: 0.3, p: [x, -1.35, 0], m: 'brass' }, { t: 'cyl', r: 0.45, h: 1.3, p: [x, -2.15, 0] }]).flat() },
    ],
    steps: ['spool', 'spool_seals', 'body', 'spring', 'end_cap', 'piston', 'pilot_cap', 'pilot', 'fittings', 'supply_fitting', 'silencers'],
    anim: { mode: 'toggle', label: ['Energise / off', 'شغّل / افصل'], parts: { spool: { slide: [1.2, 0, 0] }, spool_seals: { slide: [1.2, 0, 0] }, piston: { slide: [1.2, 0, 0] } } },
    quiz: [
      { q: ['On a 5/2 valve, port 1 is…', 'في البلف 5/2 فتحة 1 هي…'], a: ['Supply (compressed air in)', 'الدخول (الهوا المضغوط)'], w: [['Exhaust', 'التفريغ'], ['Output to the cylinder', 'الخروج للسلندر'], ['Pilot only', 'البايلوت بس']] },
      { q: ['Air blows continuously from one silencer with the cylinder stopped. Likely?', 'هوا طالع على طول من سايلنسر والسلندر واقف. الأغلب؟'], a: ['Worn spool seal or a leaking cylinder piston seal', 'جوان السبول دايب أو جوان بستم السلندر بيسرّب'], w: [['Coil burnt', 'الكويل محروق'], ['Supply pressure too low', 'ضغط الدخول قليل'], ['Silencer blocked', 'السايلنسر مسدود']] },
      { q: ['The coil is dead but you must move the cylinder for a check. You use…', 'الكويل بايظ ومحتاج تحرك السلندر للفحص. تستخدم…'], a: ['The manual override button (with the guards and area safe)', 'زرار التشغيل اليدوي (والحمايات والمكان آمن)'], w: [['A screwdriver on the spool', 'مفك على السبول'], ['Remove the silencer', 'تفك السايلنسر'], ['Raise the pressure', 'تعلّي الضغط']] },
    ],
  });

  /* ---------- pneumatic cylinder, ISO 15552 tie-rod, bore 50, stroke 100, double acting ---------- */
  const pcSq = onX(rr(-3.25, 3.25, -3.25, 3.25, 0.3)), pcTR = C4(2.33, 2.33);
  const pcHoles = pcTR.map((q) => hX(q[0], q[1], 0.32));
  M.add({
    id: 'pneumatic_cylinder', cat: 'actuators',
    name: ['Pneumatic cylinder (ISO 15552, double acting)', 'سلندر هوا (ISO 15552، دبل أكتنج)'],
    info: {
      what: ['Linear actuator: air on one side of the piston pushes the rod out, air on the other side pulls it in.', 'مشغّل خطي: الهوا على ناحية من البستم بيطلّع الذراع، وعلى الناحية التانية بيدخّله.'],
      use: ['Pushers, lifts, gates and clamps on cartoners, blister and case packers, tablet press guards, dust collector dampers.', 'الدفّاعات والرفع والبوابات والكلامبات في الكارتونر والبليستر والكيس باكر، حمايات مكن الكبس، دامبرات مجمع التراب.'],
      how: ['Force = pressure x piston area (bore 50 at 6 bar ≈ 1.2 kN out). Cushion spears enter the cushion seals near the end, trapping air to slow the piston; needle screws set the cushioning. The magnet in the piston works the reed sensors.', 'القوة = الضغط × مساحة البستم (قطر 50 على 6 بار ≈ 1.2 كيلو نيوتن للخروج). سنون التهدئة بتدخل في جوانات التهدئة قرب الآخر فتحبس هوا يهدّي البستم، ومسامير الإبرة بتظبط التهدئة. المغناطيس اللي في البستم بيشغّل الحساسات.'],
      fail: ['Air passing across the piston (worn piston seal: weak, drifts), leak at the rod (worn rod seal, scored rod), banging at the ends (cushion wrongly set), rod bent by side load.', 'هوا بيعدّي من البستم (جوان البستم دايب: ضعيف وبيزحف)، تسريب عند الذراع (جوان الذراع دايب أو الذراع مخدوش)، خبط في الآخر (التهدئة مش مظبوطة)، ذراع معووج من حمل جانبي.'],
      pm: ['Align the load to avoid side force, use a floating joint, keep the rod clean, set speed with exhaust flow controls, check reed sensors, replace the seal kit when it leaks.', 'اظبط الحمل على خط الذراع عشان مفيش قوة جانبية، استخدم وصلة عايمة، خلي الذراع نضيف، اظبط السرعة بمنظمات على التفريغ، افحص الحساسات، وغيّر طقم الجوانات لما يسرّب.'],
    },
    cut: 'z',
    parts: [
      { id: 'barrel', name: ['Barrel', 'الجسم (الماسورة)'], role: ['Honed aluminium tube the piston slides in.', 'ماسورة ألومنيوم مصقولة من جوه البستم بيتزحلق فيها.'], mat: 'alu', ex: [0, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.8, ri: 2.5, h: 12.394, p: [0.7, 0, 0] }] },
      { id: 'rear_cap', name: ['Rear end cap', 'الغطا الخلفي'], role: ['Closes the rear, carries port and cushion seal and the adjusting needle.', 'بيقفل من ورا، وفيه فتحة الهوا وجوان التهدئة ومسمار الضبط.'], mat: 'alu', ex: [-6, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 0.997, p: [-6.0, 0, 0], pts: pcSq, holes: [hX(0, 0, 0.95)].concat(pcHoles) }, { t: 'ext', ax: 'x', d: 1.397, p: [-7.2, 0, 0], pts: pcSq, holes: pcHoles },
          { t: 'torus', ax: 'x', R: 1.0, r: 0.12, p: [-5.65, 0, 0], m: 'black' }, { t: 'cyl', r: 0.55, ri: 0.35, h: 0.25, p: [-6.7, 3.375, 0] }, { t: 'cyl', r: 0.2, h: 0.3, p: [-7.5, 3.4, 0], m: 'brass' }] },
      { id: 'piston', name: ['Piston with magnet', 'البستم بالمغناطيس'], role: ['Aluminium piston; the magnet ring triggers the position sensors.', 'بستم ألومنيوم، وحلقة المغناطيس بتشغّل حساسات المكان.'], mat: 'alu', ex: [2, 0, 9],
        s: [{ t: 'lathe', ax: 'x', pts: [[0.62, -5.3], [2.0, -5.3], [2.0, -4.9], [2.45, -4.9], [2.45, -4.6], [2.0, -4.6], [2.0, -4.0], [2.45, -4.0], [2.45, -3.7], [2.0, -3.7], [2.0, -3.3], [0.62, -3.3], [0.62, -5.3]] },
          { t: 'cyl', ax: 'x', r: 2.38, ri: 2.02, h: 0.597, p: [-4.3, 0, 0], m: 'black' }] },
      { id: 'piston_seals', name: ['Piston seals', 'جوانات البستم'], role: ['Two lip seals, one for each pressure direction.', 'جوانين شفة، واحد لكل اتجاه ضغط.'], mat: 'rubber', ex: [-1, 0, 9],
        s: [{ t: 'cyl', ax: 'x', r: 2.48, ri: 2.02, h: 0.397, p: [-5.1, 0, 0] }, { t: 'cyl', ax: 'x', r: 2.48, ri: 2.02, h: 0.397, p: [-3.5, 0, 0] }] },
      { id: 'piston_nut', name: ['Piston nut (rear cushion spear)', 'صامولة البستم (سن التهدئة الخلفي)'], role: ['Locks the piston on the rod and enters the rear cushion seal.', 'بتقفل البستم على الذراع وبتدخل في جوان التهدئة الخلفي.'], mat: 'steel', ex: [-3, 0, 9],
        s: [{ t: 'cyl', ax: 'x', r: 0.9, h: 0.997, p: [-5.8, 0, 0] }] },
      { id: 'rod', name: ['Piston rod', 'الذراع (البستن رود)'], role: ['Hard-chromed rod; the front cushion sleeve sits behind the piston.', 'ذراع مكروم صلب، وجلبة التهدئة الأمامية ورا البستم.'], mat: 'chrome', ex: [6, 0, 9],
        s: [{ t: 'cyl', ax: 'x', r: 0.6, h: 2.0, p: [-4.3, 0, 0] }, { t: 'cyl', ax: 'x', r: 1.25, h: 1.0, p: [-2.8, 0, 0], m: 'steel' }, { t: 'cyl', ax: 'x', r: 1.0, h: 15.2, p: [5.3, 0, 0] },
          { t: 'cyl', ax: 'x', r: 0.8, h: 2.2, p: [14.0, 0, 0], m: 'steel' }, { t: 'spring', ax: 'x', R: 0.8, r: 0.05, turns: 10, len: 2.0, p: [14.0, 0, 0], m: 'steel' }] },
      { id: 'front_cap', name: ['Front end cap', 'الغطا الأمامي'], role: ['Rod-side cap with port, cushion seal and the rod guide.', 'غطا ناحية الذراع، فيه فتحة الهوا وجوان التهدئة ودليل الذراع.'], mat: 'alu', ex: [8, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 0.997, p: [7.4, 0, 0], pts: pcSq, holes: [hX(0, 0, 1.3)].concat(pcHoles) }, { t: 'ext', ax: 'x', d: 2.297, p: [9.05, 0, 0], pts: pcSq, holes: [hX(0, 0, 1.3)].concat(pcHoles) },
          { t: 'torus', ax: 'x', R: 1.35, r: 0.12, p: [7.05, 0, 0], m: 'black' }, { t: 'cyl', r: 0.55, ri: 0.35, h: 0.25, p: [8.6, 3.375, 0] }, { t: 'cyl', r: 0.2, h: 0.3, p: [9.6, 3.4, 0], m: 'brass' }] },
      { id: 'rod_seal', name: ['Rod bush, seal and wiper', 'جلبة وجوان ومسّاحة الذراع'], role: ['Bush guides the rod, the seal holds the air, the wiper keeps dirt out.', 'الجلبة بتوجّه الذراع، الجوان بيمسك الهوا، والمسّاحة بتمنع الوساخة تدخل.'], mat: 'bronze', ex: [11, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 1.28, ri: 1.02, h: 1.2, p: [8.5, 0, 0] }, { t: 'cyl', ax: 'x', r: 1.28, ri: 1.02, h: 0.4, p: [9.3, 0, 0], m: 'rubber' }, { t: 'cyl', ax: 'x', r: 1.28, ri: 1.02, h: 0.5, p: [9.95, 0, 0], m: 'rubber' }] },
      { id: 'tie_rods', name: ['Tie rods and nuts', 'الجوايط والصواميل'], role: ['Four rods clamp both caps onto the barrel.', 'أربع جوايط بيزنقوا الغطاين على الماسورة.'], mat: 'steel', ex: [0, 8, 0],
        s: [].concat(...pcTR.map((q) => [{ t: 'cyl', ax: 'x', r: 0.3, h: 18.9, p: [1.15, q[0], q[1]] }, { t: 'hex', ax: 'x', r: 0.55, h: 0.45, p: [-8.125, q[0], q[1]] }, { t: 'hex', ax: 'x', r: 0.55, h: 0.45, p: [10.425, q[0], q[1]] }])) },
    ],
    steps: ['rod', 'piston', 'piston_seals', 'piston_nut', 'barrel', 'rear_cap', 'rod_seal', 'front_cap', 'tie_rods'],
    anim: { mode: 'toggle', label: ['Extend / retract', 'طلّع / دخّل'], parts: { piston: { slide: [10, 0, 0] }, piston_seals: { slide: [10, 0, 0] }, piston_nut: { slide: [10, 0, 0] }, rod: { slide: [10, 0, 0] } } },
    quiz: [
      { q: ['Bore 50 mm at 6 bar. Approximate push force?', 'قطر 50 مم على 6 بار. قوة الدفع تقريباً؟'], a: ['About 1.2 kN (≈120 kg)', 'حوالي 1.2 كيلو نيوتن (≈120 كيلو)'], w: [['About 30 N', 'حوالي 30 نيوتن'], ['About 12 kN', 'حوالي 12 كيلو نيوتن'], ['It depends only on stroke', 'بتعتمد على المشوار بس']] },
      { q: ['The cylinder slams at the end of stroke. First adjustment?', 'السلندر بيخبط في آخر المشوار. أول ظبط؟'], a: ['Close the cushion needle a little and check the exhaust flow control', 'اقفل مسمار التهدئة شوية وراجع منظم التفريغ'], w: [['Raise the pressure', 'علّي الضغط'], ['Remove the silencer', 'فك السايلنسر'], ['Grease the tie rods', 'شحّم الجوايط']] },
      { q: ['Which part makes the reed sensor switch?', 'أنهي جزء بيشغّل حساس الريد؟'], a: ['The magnet ring in the piston', 'حلقة المغناطيس اللي في البستم'], w: [['The tie rods', 'الجوايط'], ['The wiper', 'المسّاحة'], ['The air pressure', 'ضغط الهوا']] },
    ],
  });

  /* ---------- rack and pinion actuator, double acting (spring sets optional) ---------- */
  const raBody = onX(rr(-4.2, 4.2, -4.0, 4.0, 0.8));
  const y0 = Math.sqrt(3.15 * 3.15 - 1.1 * 1.1), aC = Math.asin(1.1 / 3.15) / D;
  const raMidP = [[4.2, 1.1]].concat(arc(0.8, 0, 90, 4, 3.4, 3.2), arc(0.8, 90, 180, 4, -3.4, 3.2), [[-4.2, 1.1], [-y0, 1.1]]).concat(arc(3.15, 180 - aC, aC, 16).slice(1, -1), [[y0, 1.1]]);
  const raMidN = raMidP.map((q) => [q[0], -q[1]]);
  const rackPts = (sg) => { // teeth along x on the pinion side of the rack; sg = +1 rack at +z (left piston), -1 at -z (right piston)
    const o = sg > 0 ? [[-4.0, 2.6], [3.0, 2.6], [3.0, 1.68]] : [[4.0, -2.6], [-3.0, -2.6], [-3.0, -1.68]];
    const pc = 0.673, xs = []; for (let x = sg > 0 ? 2.7 : -2.7; sg > 0 ? x > -1.1 : x < 1.1; x -= sg * pc) xs.push(x);
    for (const xc of xs) o.push([xc + sg * 0.17, sg * 1.68], [xc + sg * 0.07, sg * 1.38], [xc - sg * 0.07, sg * 1.38], [xc - sg * 0.17, sg * 1.68]);
    o.push(sg > 0 ? [-4.0, 1.68] : [4.0, -1.68]); return onY(o);
  };
  const piston = (sg) => { const c = sg * 4.8; return [{ t: 'cyl', ax: 'x', r: 3.1, h: 0.6, p: [c - sg * 0.5, 0, 0] }, { t: 'cyl', ax: 'x', r: 2.8, h: 0.4, p: [c, 0, 0] }, { t: 'cyl', ax: 'x', r: 3.1, h: 0.6, p: [c + sg * 0.5, 0, 0] }, { t: 'torus', ax: 'x', R: 2.95, r: 0.17, p: [c, 0, 0], m: 'black' }]; };
  M.add({
    id: 'pneumatic_actuator', cat: 'actuators',
    name: ['Pneumatic actuator (rack and pinion)', 'أكتيواتور هوا (راك وبينيون)'],
    info: {
      what: ['Quarter-turn actuator: two opposed pistons with racks turn a pinion 90°. Mounted on ball and butterfly valves.', 'مشغّل ربع لفة: بستمين قصاد بعض فيهم جريدة مسننة بيلفوا ترس 90 درجة. بيتركب على محابس الكورة والفراشة.'],
      use: ['Automatic on/off valves on purified water, CIP and SIP circuits, chilled water, HVAC dampers and process tanks.', 'المحابس الأوتوماتيك على المية المنقاة ودوائر الـ CIP والـ SIP والمية المثلجة ودامبرات التكييف والتانكات.'],
      how: ['Air into port A fills the centre chamber and drives the pistons outwards: the racks turn the pinion and the valve opens. Air into port B (or the springs in the spring-return version) drives them back to close.', 'الهوا في فتحة A بيملا الغرفة اللي في النص ويزق البستمين لبره، الجرايد بتلف البينيون فالمحبس يفتح. الهوا في فتحة B (أو السوست في نوع الرجوع بالسوستة) بيرجّعهم يقفل.'],
      fail: ['Slow or partial stroke (low air, leaking piston O-ring, worn guide), air leak at the top (pinion O-ring), wrong end position (travel stops out of adjustment), springs broken.', 'حركة بطيئة أو ناقصة (هوا قليل، أورينج البستم بيسرّب، الدليل دايب)، تسريب هوا من فوق (أورينج البينيون)، وضع النهاية غلط (مسامير الحد مش مظبوطة)، سوست مكسورة.'],
      pm: ['Check the position indicator against the valve, set the travel stop screws, keep air dry, never open a spring-return actuator without the long end-cap bolts and the right procedure (stored spring energy).', 'قارن مبين الوضع بالمحبس، اظبط مسامير الحد، خلي الهوا ناشف، وأبداً متفتحش أكتيواتور بسوست غير بالمسامير الطويلة والإجراء الصح (طاقة السوست المخزنة).'],
    },
    cut: 'z',
    parts: [
      { id: 'body', name: ['Body', 'الجسم'], role: ['Extruded aluminium body with the piston bore and NAMUR air ports.', 'جسم ألومنيوم مسحوب فيه مجرى البستمين وفتحات الهوا NAMUR.'], mat: 'alu', ex: [0, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 8.247, p: [-5.3765, 0, 0], pts: raBody, holes: [hX(0, 0, 3.15)] }, { t: 'ext', ax: 'x', d: 8.247, p: [5.3765, 0, 0], pts: raBody, holes: [hX(0, 0, 3.15)] },
          { t: 'ext', ax: 'x', d: 2.497, pts: onX(raMidP) }, { t: 'ext', ax: 'x', d: 2.497, pts: onX(raMidN) },
          { t: 'cyl', ax: 'z', r: 0.45, ri: 0.25, h: 0.3, p: [-1.2, 1.2, 4.15] }, { t: 'cyl', ax: 'z', r: 0.45, ri: 0.25, h: 0.3, p: [1.2, 1.2, 4.15] }] },
      { id: 'pinion', name: ['Pinion (output shaft)', 'البينيون (عمود الخرج)'], role: ['Gear shaft turned by both racks; the bottom drives the valve stem.', 'عمود ترس بتلفه الجريدتين، وطرفه اللي تحت بيلف عمود المحبس.'], mat: 'chrome', ex: [0, 11, 0],
        s: [{ t: 'gear', r: 1.65, rr: 1.35, teeth: 14, h: 3.4 }, { t: 'cyl', r: 1.05, h: 10.8, p: [0, 0.2, 0] }, { t: 'box', w: 1.0, h: 0.8, d: 1.6, p: [0, 6.0, 0] }, { t: 'box', w: 0.9, h: 0.1, d: 0.9, p: [0, -5.25, 0], m: 'black' }] },
      { id: 'thrust_washer', name: ['Thrust washer and pinion O-ring', 'وردة الدفع وأورينج البينيون'], role: ['Low-friction washer under the circlip; the O-ring keeps the air in.', 'وردة قليلة الاحتكاك تحت السيكلبس، والأورينج بيمسك الهوا جوه.'], mat: 'ptfe', ex: [0, 14, 0],
        s: [{ t: 'cyl', r: 1.6, ri: 1.06, h: 0.15, p: [0, 4.275, 0] }, { t: 'torus', R: 1.12, r: 0.06, p: [0, 3.9, 0], m: 'black' }] },
      { id: 'circlip', name: ['Circlip', 'السيكلبس (حلقة الزنق)'], role: ['Holds the pinion in the body.', 'ماسك البينيون في الجسم.'], mat: 'black', ex: [0, 14.5, 0],
        s: [{ t: 'ext', ax: 'y', d: 0.12, p: [0, 4.43, 0], pts: onY(band(1.45, 1.06, 25, 335, 24)) }] },
      { id: 'piston_a', name: ['Piston A with rack', 'البستم A بالجريدة'], role: ['Left piston; its rack drives the pinion from one side.', 'البستم الشمال، جريدته بتلف البينيون من ناحية.'], mat: 'alu', ex: [-14, 0, 0],
        s: piston(-1).concat([{ t: 'ext', ax: 'y', d: 3.0, pts: rackPts(1) }]) },
      { id: 'piston_b', name: ['Piston B with rack', 'البستم B بالجريدة'], role: ['Right piston; its rack drives the pinion from the other side.', 'البستم اليمين، جريدته بتلف البينيون من الناحية التانية.'], mat: 'alu', ex: [14, 0, 0],
        s: piston(1).concat([{ t: 'ext', ax: 'y', d: 3.0, pts: rackPts(-1) }]) },
      { id: 'springs', name: ['Spring sets (spring-return version only)', 'أطقم السوست (نوع الرجوع بالسوستة بس)'], role: ['Close the valve on air failure; double-acting actuators have none.', 'بتقفل المحبس لو الهوا قطع، والدبل أكتنج مفيهوش.'], mat: 'yellow', ex: [0, 0, 10],
        s: [-1, 1].map((sg) => [1.4, -1.4].map((z) => ({ t: 'spring', ax: 'x', R: 0.7, r: 0.12, turns: 7, len: 3.8, p: [sg * 7.55, 0, z] }))).flat() },
      { id: 'end_cap_a', name: ['End cap A', 'غطا الطرف A'], role: ['Closes the outer chamber; the stop screw sets the end position.', 'بيقفل الغرفة الخارجية، ومسمار الحد بيظبط وضع النهاية.'], mat: 'alu', ex: [-11, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 0.8, p: [-9.9, 0, 0], pts: raBody }, { t: 'hex', ax: 'x', r: 0.5, h: 0.4, p: [-10.5, 0, 0], m: 'steel' }].concat(C4(3.3, 3.1).map((q) => ({ t: 'hex', ax: 'x', r: 0.35, h: 0.25, p: [-10.425, q[0], q[1]], m: 'steel' }))) },
      { id: 'end_cap_b', name: ['End cap B', 'غطا الطرف B'], role: ['Closes the other outer chamber.', 'بيقفل الغرفة الخارجية التانية.'], mat: 'alu', ex: [11, 0, 0],
        s: [{ t: 'ext', ax: 'x', d: 0.8, p: [9.9, 0, 0], pts: raBody }, { t: 'hex', ax: 'x', r: 0.5, h: 0.4, p: [10.5, 0, 0], m: 'steel' }].concat(C4(3.3, 3.1).map((q) => ({ t: 'hex', ax: 'x', r: 0.35, h: 0.25, p: [10.425, q[0], q[1]], m: 'steel' }))) },
      { id: 'indicator', name: ['Position indicator', 'مبين الوضع'], role: ['Turns with the pinion: shows the valve position, stripe in line with the pipe = open, across = closed.', 'بيلف مع البينيون وبيبين وضع المحبس: الشريطة على خط الماسورة = مفتوح، عمودي عليها = مقفول.'], mat: 'yellow', ex: [0, 13, 0],
        s: [{ t: 'cyl', r: 2.6, h: 0.5, p: [0, 6.65, 0] }, { t: 'box', w: 0.5, h: 0.12, d: 4.6, p: [0, 6.96, 0], m: 'black' }, { t: 'cone', r1: 0.001, r2: 0.45, h: 0.7, ax: 'z', p: [0, 6.96, 2.55], m: 'black' }] },
    ],
    steps: ['body', 'pinion', 'thrust_washer', 'circlip', 'piston_a', 'piston_b', 'springs', 'end_cap_a', 'end_cap_b', 'indicator'],
    anim: { mode: 'toggle', label: ['Air to A (open) / B (close)', 'هوا على A (فتح) / B (قفل)'], parts: { piston_a: { slide: [-2.36, 0, 0] }, piston_b: { slide: [2.36, 0, 0] }, pinion: { rot: [0, 1, 0], a: [0, -90] }, indicator: { rot: [0, 1, 0], a: [0, -90] } } },
    quiz: [
      { q: ['Air goes to port A (centre chamber). The pistons move…', 'الهوا دخل فتحة A (الغرفة اللي في النص). البستمين بيتحركوا…'], a: ['Outwards, turning the pinion to open', 'لبره، فيلفوا البينيون يفتح'], w: [['Inwards', 'لجوه'], ['Only one moves', 'واحد بس بيتحرك'], ['They do not move; the pinion slides', 'مبيتحركوش، البينيون بيتزحلق']] },
      { q: ['Before opening a spring-return actuator you must…', 'قبل ما تفتح أكتيواتور بسوست لازم…'], a: ['Remove air and follow the procedure to release the stored spring force safely', 'تفصل الهوا وتمشي على الإجراء عشان تفك قوة السوست المخزنة بأمان'], w: [['Just unscrew the caps quickly', 'تفك الأغطية بسرعة'], ['Apply air to port B', 'تدخل هوا على B'], ['Grease the circlip', 'تشحّم السيكلبس']] },
    ],
  });

  /* ---------- FRL unit: filter, regulator, lubricator (modular, G1/4) ---------- */
  const mBody = (cx, rects) => [bx(cx - 2, cx + 2, -2, 2, 1.397, 1.3015), bx(cx - 2, cx + 2, -2, 2, 1.397, -1.3015)].concat(rects.map((q) => bx(cx + q[0], cx + q[1], q[2], q[3], 1.2)));
  const bowl = (cx) => ({ t: 'lathe', p: [cx, 0, 0], pts: [[1.5, -2.003], [1.7, -2.003], [1.7, -8.2], [1.4, -8.8], [0.5, -9.0], [0.3, -9.0], [0.3, -8.8], [1.2, -8.6], [1.5, -8.1], [1.5, -2.003]] });
  const frCon = onX(rr(-1.7, 1.7, -1.7, 1.7, 0.3));
  M.add({
    id: 'frl_unit', cat: 'actuators',
    name: ['FRL unit (filter, regulator, lubricator)', 'وحدة FRL (فلتر، منظم، مزيّتة)'],
    info: {
      what: ['Air preparation unit at the machine inlet: the filter removes water and dirt, the regulator sets a steady pressure, the lubricator adds an oil mist.', 'وحدة تجهيز الهوا عند دخول المكنة: الفلتر بيشيل المية والوساخة، المنظم بيثبّت الضغط، والمزيّتة بتضيف رذاذ زيت.'],
      use: ['At the air inlet of every packaging machine, tablet press and coater. In clean areas and for oil-free valves the lubricator is often left out.', 'عند دخول الهوا لكل مكنة تعبئة ومكنة كبس وكوتنج. في المناطق النضيفة ومع البلوف اللي مش محتاجة زيت بيتشال المزيّتة غالباً.'],
      how: ['Filter: louvres spin the air, water is thrown to the bowl, the element stops particles. Regulator: the knob compresses a spring on a diaphragm that opens the valve poppet until outlet pressure balances it. Lubricator: a venturi draws oil up the siphon tube and drips it into the air.', 'الفلتر: الريش بتلف الهوا فالمية تترمي في الكاس، والعنصر بيمسك الجزيئات. المنظم: المقبض بيضغط سوستة على دايافرام بيفتح البلف لحد ما ضغط الخروج يوازنه. المزيّتة: فنشوري بيسحب الزيت من أنبوبة السيفون ويقطّره في الهوا.'],
      fail: ['Water in the bowl above the baffle (drain blocked), element blocked (pressure drop), regulator creeping or venting (torn diaphragm, dirty poppet), bowl crazed by solvents (danger of burst).', 'مية في الكاس فوق الحاجز (الصرف مسدود)، العنصر مسدود (فقد ضغط)، المنظم بيزحف أو بيطلّع هوا (دايافرام مقطوع أو البلف وسخ)، الكاس مشروخ من المذيبات (خطر انفجار).'],
      pm: ['Drain the bowl daily or check the auto drain, change the element on pressure drop, clean bowls with soap and water only, keep the bowl guard fitted, set pressure with the knob pulled out then push it in to lock.', 'صفّي الكاس كل يوم أو اتأكد من الصرف الأوتوماتيك، غيّر العنصر لما الضغط يقع، نضف الكاسات بمية وصابون بس، خلي واقي الكاس متركب، اظبط الضغط والمقبض مشدود لبره وبعدين اضغطه يقفل.'],
    },
    cut: 'z',
    parts: [
      { id: 'filter_body', name: ['Filter body', 'جسم الفلتر'], role: ['Inlet goes down to the bowl; outlet comes up from inside the element.', 'الدخول بينزل للكاس، والخروج طالع من جوه العنصر.'], mat: 'alu', ex: [0, 0, 0],
        s: mBody(-4.5, [[-2, 2, 0.55, 2], [-1.0, -0.4, -2, 0.55], [-2, -1.5, -2, -0.55], [0.4, 2, -2, -0.55]]) },
      { id: 'filter_element', name: ['Deflector and filter element', 'الريش وعنصر الفلتر'], role: ['Louvres swirl the air; the sintered element stops particles; the baffle keeps water calm below.', 'الريش بتلف الهوا، العنصر الملبّد بيمسك الجزيئات، والحاجز بيهدّي المية تحت.'], mat: 'bronze', ex: [0, -3.5, 0],
        s: [{ t: 'vanes', n: 10, r1: 0.97, r2: 1.45, h: 0.5, curve: 30, thick: 0.08, p: [-4.5, -2.3, 0], m: 'black' }, { t: 'cyl', r: 0.95, ri: 0.6, h: 4.0, p: [-4.5, -4.6, 0] },
          { t: 'cyl', r: 1.4, h: 0.15, p: [-4.5, -6.9, 0], m: 'black' }, { t: 'cyl', r: 0.3, h: 0.3, p: [-4.5, -6.7, 0], m: 'black' }, { t: 'cyl', r: 0.15, h: 4.6, p: [-4.5, -4.5, 0], m: 'steel' }] },
      { id: 'filter_bowl', name: ['Filter bowl', 'كاس الفلتر'], role: ['Clear bowl that collects water; the collar locks it to the body.', 'كاس شفاف بيجمع المية، والطوق بيقفله على الجسم.'], mat: 'glass', ex: [0, -10, 0],
        s: [bowl(-4.5), { t: 'cyl', r: 1.95, ri: 1.703, h: 0.8, p: [-4.5, -2.45, 0], m: 'grey' }] },
      { id: 'drain', name: ['Bowl drain', 'صرف الكاس'], role: ['Twist or automatic drain for the collected water.', 'صرف بالبرم أو أوتوماتيك للمية المتجمعة.'], mat: 'black', ex: [0, -12.5, 0],
        s: [{ t: 'cyl', r: 0.45, h: 0.8, p: [-4.5, -9.4, 0] }, { t: 'cyl', r: 0.15, h: 0.5, p: [-4.5, -10.05, 0] }] },
      { id: 'regulator_body', name: ['Regulator body', 'جسم المنظم'], role: ['Inlet chamber, valve seat, outlet chamber and the sensing hole to the diaphragm.', 'غرفة الدخول والكرسي وغرفة الخروج وخرم الإحساس للدايافرام.'], mat: 'alu', ex: [0, 0, 0],
        s: mBody(0, [[-2, -0.45, -2, -1.6], [0.45, 2, -2, -1.6], [-2, -1.3, -1.6, -0.55], [0.6, 2, -1.6, -0.55], [-0.9, -0.3, -0.9, -0.55], [0.3, 0.6, -0.9, -0.55], [-0.9, -0.5, -0.55, 0.55], [-2, -0.25, 0.55, 2], [0.25, 2, 0.55, 2]]) },
      { id: 'poppet', name: ['Valve poppet and spring', 'البلف (البوبيت) وسوستته'], role: ['Pushed open by the diaphragm stem, closed by its small spring.', 'ساق الدايافرام بيفتحه، وسوستته الصغيرة بتقفله.'], mat: 'steel', ex: [0, -6, 0], cut: false,
        s: [{ t: 'cyl', r: 0.45, h: 0.3, p: [0, -1.05, 0], m: 'rubber' }, { t: 'cyl', r: 0.12, h: 2.9, p: [0, 0.55, 0] }, { t: 'spring', R: 0.3, r: 0.05, turns: 5, len: 1.0, p: [0, -1.7, 0] }, { t: 'cyl', r: 0.6, h: 0.4, p: [0, -2.2, 0], m: 'black' }] },
      { id: 'diaphragm', name: ['Diaphragm', 'الدايافرام'], role: ['Outlet pressure under it balances the spring above it.', 'ضغط الخروج تحته بيوازن السوستة اللي فوقه.'], mat: 'rubber', ex: [0, 2, 0],
        s: [{ t: 'cyl', r: 1.75, h: 0.1, p: [0, 2.05, 0] }, { t: 'cyl', r: 1.2, h: 0.15, p: [0, 2.175, 0], m: 'steel' }] },
      { id: 'reg_spring', name: ['Range spring', 'سوستة الضبط'], role: ['Its force, set by the knob, sets the outlet pressure.', 'قوتها اللي المقبض بيظبطها بتحدد ضغط الخروج.'], mat: 'steel', ex: [0, 3, 5], cut: false,
        s: [{ t: 'spring', R: 0.9, r: 0.12, turns: 6, len: 2.8, p: [0, 3.65, 0] }, { t: 'cyl', r: 1.0, h: 0.15, p: [0, 5.125, 0] }] },
      { id: 'bonnet', name: ['Bonnet', 'البونيه'], role: ['Spring housing on top of the regulator.', 'بيت السوستة فوق المنظم.'], mat: 'grey', ex: [0, 6, 0],
        s: [{ t: 'cyl', r: 1.8, ri: 1.55, h: 3.8, p: [0, 4.15, 0] }, { t: 'cyl', r: 1.8, ri: 0.4, h: 0.3, p: [0, 6.2, 0] }] },
      { id: 'knob', name: ['Adjusting knob', 'مقبض الضبط'], role: ['Pull out, turn clockwise for more pressure, push in to lock.', 'اسحبه لبره، لف مع عقارب الساعة لضغط أعلى، واضغطه يقفل.'], mat: 'black', o: [0, 0, 0], ex: [0, 9, 0], cut: false,
        s: [{ t: 'cyl', r: 0.35, h: 2.0, p: [0, 6.2, 0], m: 'steel' }, { t: 'cyl', r: 1.5, h: 1.2, p: [0, 7.4, 0] }, { t: 'vanes', n: 16, r1: 1.4, r2: 1.6, h: 1.0, curve: 0, thick: 0.18, p: [0, 7.4, 0] }] },
      { id: 'gauge', name: ['Pressure gauge', 'عداد الضغط'], role: ['Shows the regulated outlet pressure.', 'بيبين ضغط الخروج بعد المنظم.'], mat: 'black', ex: [0, 0, 6],
        s: [{ t: 'cyl', ax: 'z', r: 0.2, h: 0.5, p: [0, 0, 2.25], m: 'brass' }, { t: 'cyl', ax: 'z', r: 1.3, h: 0.7, p: [0, 0, 2.85] }, { t: 'cyl', ax: 'z', r: 1.15, h: 0.02, p: [0, 0, 3.21], m: 'white' }, { t: 'box', w: 0.9, h: 0.07, d: 0.03, rot: [0, 0, 35], p: [0.2, 0.15, 3.24], m: 'red' }] },
      { id: 'lubricator', name: ['Lubricator body with sight dome', 'جسم المزيّتة بقبة الرؤية'], role: ['Venturi throat in the body; oil drips through the sight dome into the air; the screw sets drops per minute.', 'فيه زور فنشوري، والزيت بيقطّر من قبة الرؤية في الهوا، والمسمار بيظبط عدد النقط في الدقيقة.'], mat: 'alu', ex: [0, 0, 0],
        s: mBody(4.5, [[-2, -1.4, -2, -0.55], [-1.1, 2, -2, -0.55], [-0.6, 0.6, -0.55, -0.25], [-0.6, -0.12, 0.25, 0.55], [0.12, 0.6, 0.25, 0.55], [-2, -0.12, 0.55, 2], [0.12, 2, 0.55, 2]]).concat([
          { t: 'cyl', r: 0.9, h: 0.2, p: [4.5, 2.1, 0] }, { t: 'sph', r: 0.8, half: true, p: [4.5, 2.2, 0], m: 'glass' }, { t: 'cyl', r: 0.25, h: 0.4, p: [4.5, 3.2, 0], m: 'brass' },
          { t: 'tube', r: 0.07, path: [[5.3, -8.3, 0], [5.3, -2.0, 0]], m: 'steel' }]) },
      { id: 'lub_bowl', name: ['Lubricator bowl with oil', 'كاس المزيّتة بالزيت'], role: ['Holds the oil; air pressure on it pushes oil up the siphon tube.', 'فيه الزيت، وضغط الهوا عليه بيطلّع الزيت في أنبوبة السيفون.'], mat: 'glass', ex: [0, -8, 0],
        s: [bowl(4.5), { t: 'cyl', r: 1.95, ri: 1.703, h: 0.8, p: [4.5, -2.45, 0], m: 'grey' }, { t: 'cyl', r: 1.45, h: 3.8, p: [4.5, -6.2, 0], m: 'oil' }] },
      { id: 'connectors', name: ['Module connectors and port blocks', 'وصلات الموديولات وبلوكات الفتحات'], role: ['Clamp the modules together with O-rings; the end blocks carry the G1/4 pipe threads.', 'بتربط الموديولات ببعض بأورينجات، وبلوكات الطرف فيها سن المواسير G1/4.'], mat: 'grey', ex: [0, 0, 6],
        s: [-2.25, 2.25].map((x) => [{ t: 'ext', ax: 'x', d: 0.497, p: [x, 0, 0], pts: frCon, holes: [hX(0, 0, 0.55)] }, { t: 'torus', ax: 'x', R: 0.75, r: 0.1, p: [x, 0, 0], m: 'black' }]).flat().concat(
          [-6.75, 6.75].map((x) => [{ t: 'ext', ax: 'x', d: 0.497, p: [x, 0, 0], pts: frCon, holes: [hX(0, 0, 0.55)] }, { t: 'spring', ax: 'x', R: 0.56, r: 0.04, turns: 4, len: 0.45, p: [x, 0, 0], m: 'steel' }]).flat()) },
    ],
    steps: ['filter_body', 'filter_element', 'filter_bowl', 'drain', 'regulator_body', 'poppet', 'diaphragm', 'reg_spring', 'bonnet', 'knob', 'gauge', 'lubricator', 'lub_bowl', 'connectors'],
    anim: { mode: 'toggle', label: ['Turn knob: more pressure', 'لف المقبض: ضغط أعلى'], parts: { knob: { rot: [0, 1, 0], a: [0, 360] }, diaphragm: { slide: [0, -0.15, 0] }, poppet: { slide: [0, -0.15, 0] } } },
    quiz: [
      { q: ['Order of the units in the air flow?', 'ترتيب الوحدات مع اتجاه الهوا؟'], a: ['Filter, then regulator, then lubricator', 'فلتر، بعده منظم، بعده مزيّتة'], w: [['Lubricator, filter, regulator', 'مزيّتة، فلتر، منظم'], ['Regulator, lubricator, filter', 'منظم، مزيّتة، فلتر'], ['Any order works', 'أي ترتيب ينفع']] },
      { q: ['The filter bowl looks cloudy and crazed. What do you do?', 'كاس الفلتر شكله معكّر ومشروخ شعر. تعمل إيه؟'], a: ['Isolate and replace the bowl: it can burst', 'اعزل وغيّر الكاس: ممكن ينفجر'], w: [['Clean it with solvent', 'نضفه بمذيب'], ['Tighten the collar', 'اربط الطوق'], ['Lower the pressure and keep using it', 'وطّي الضغط وكمّل']] },
      { q: ['Why push the regulator knob in after setting?', 'ليه تضغط مقبض المنظم لجوه بعد الضبط؟'], a: ['It locks the setting so vibration cannot change it', 'بيقفل الضبطة عشان الرعشة متغيرهاش'], w: [['It opens the drain', 'بيفتح الصرف'], ['It starts the lubricator', 'بيشغّل المزيّتة'], ['It resets the gauge', 'بيصفّر العداد']] },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
