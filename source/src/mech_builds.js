/* Mechanical workshop projects: a base drawn here plus build points (slots). Each slot lists the library
   items that can go there; ok:false items are wrong choices with the reason shown after "Check". */
(function (g) {
  const EL = g.EL, M = EL.mech;
  const nm = (en, ar) => [en, ar];
  const Z = (s) => s; // readability

  /* ---------- 1. Jacketed mixing tank (pharma) ---------- */
  M.addBuild({
    id: 'tank', name: nm('Jacketed mixing tank (pharma)', 'تانك خلط بجاكيت (أدوية)'),
    intro: nm('Fit the drive, shaft seal, CIP spray ball, relief valve, sight glass and bottom outlet valve. Then check and run.', 'ركّب الموتور والجيربوكس وسيل العمود وكورة الرش (CIP) وصمام الأمان والسايت جلاس ومحبس التفريغ. بعدين افحص وشغّل.'),
    anim: { mode: 'spin', parts: { agitator: { rot: [0, 1, 0], speed: 0.4 } } },
    done: nm('The agitator turns. Check: no leak at the seal, the bottom valve drains fully, CIP reaches every surface.', 'القلّاب بيلف. افحص: مفيش تسريب من السيل، محبس التفريغ بيصفّي للآخر، والـCIP بيوصل لكل الأسطح.'),
    base: [
      { id: 'shell', name: nm('Vessel shell', 'جسم التانك'), role: nm('Stainless 316L shell with dished heads.', 'جسم ستانلس 316L بغطيان مقببة.'), mat: 'sst',
        s: [Z({ t: 'lathe', pts: [[0, 32], [30, 34], [48, 40], [56, 50], [58, 60], [58, 150], [56, 160], [48, 170], [30, 176], [0, 178], [0, 176], [29, 174], [47, 168], [55, 158], [56, 150], [56, 60], [55, 52], [47, 42], [29, 36], [0, 34]], seg: 64 })] },
      { id: 'jacket', name: nm('Heating / cooling jacket', 'الجاكيت (تسخين / تبريد)'), role: nm('Steam or chilled water flows here, outside the product.', 'بخار أو مية مثلجة بتلف هنا بره المنتج.'), mat: 'sst',
        s: [{ t: 'cyl', r: 62, ri: 59, h: 84, p: [0, 98, 0] }, { t: 'cyl', r: 4, h: 14, ax: 'x', p: [66, 70, 0] }, { t: 'cyl', r: 4, h: 14, ax: 'x', p: [66, 132, 0] }] },
      { id: 'legs', name: nm('Legs', 'الرجول'), role: nm('Three legs with levelling feet.', 'تلات رجول برجل ضبط.'), mat: 'sst', cut: false,
        s: [0, 120, 240].map((a) => ({ t: 'cyl', r: 3.5, h: 62, p: [Math.cos(a * Math.PI / 180) * 50, 31, Math.sin(a * Math.PI / 180) * 50] })) },
      { id: 'nozzles', name: nm('Nozzles', 'النوزلات'), role: nm('Top nozzles for the drive and fittings, bottom outlet.', 'نوزلات فوق للموتور والإكسسوارات، ومخرج تحت.'), mat: 'sst',
        s: [{ t: 'cyl', r: 12, h: 8, p: [0, 180, 0] }, { t: 'flange', r: 16, ri: 4, h: 2, holes: 8, p: [0, 185, 0] },
          { t: 'cyl', r: 5, h: 8, p: [28, 178, 0] }, { t: 'cyl', r: 6, h: 8, p: [-28, 178, 14] }, { t: 'cyl', r: 5, h: 8, p: [0, 177, -32] },
          { t: 'cyl', r: 4, ri: 3, h: 16, p: [0, 26, 0] }, { t: 'tube', path: [[0, 18, 0], [0, 12, 0], [4, 8, 0], [14, 8, 0]], r: 4, sharp: true }] },
      { id: 'agitator', name: nm('Agitator shaft and impeller', 'عمود القلاب والريشة'), role: nm('Pitched-blade impeller near the bottom mixes the batch.', 'ريشة مايلة قرب القاع بتقلّب الباتش.'), mat: 'sst', cut: false,
        s: [{ t: 'cyl', r: 2.2, h: 140, p: [0, 112, 0] }, { t: 'cyl', r: 5, h: 8, p: [0, 52, 0] }, { t: 'vanes', n: 4, r1: 4, r2: 26, h: 5, curve: 10, thick: 1.4, p: [0, 52, 0] }] },
      { id: 'baffles', name: nm('Baffles', 'الحواجز (بافلز)'), role: nm('Stop the liquid swirling as a whole so it really mixes.', 'بتمنع السائل يلف كله مع بعض عشان يتخلط فعلاً.'), mat: 'sst',
        s: [0, 90, 180, 270].map((a) => ({ t: 'box', w: 1, h: 90, d: 6, p: [Math.cos(a * Math.PI / 180) * 52, 105, Math.sin(a * Math.PI / 180) * 52], rot: [0, -a, 0] })) },
    ],
    slots: [
      { id: 'motor', name: nm('Drive motor', 'موتور التشغيل'), p: [0, 300, 0], rot: [0, 0, -90], size: 72, need: true, lp: [-95, 305, 0],
        opts: { induction_motor: { ok: true, why: nm('TEFC motor, shaft down into the gearbox. Right.', 'موتور مقفول بمروحة وعموده لتحت في الجيربوكس. صح.') } } },
      { id: 'gear', name: nm('Gearbox', 'الجيربوكس'), p: [0, 236, 0], rot: [0, 0, -90], size: 50, need: true, lp: [95, 250, 0],
        opts: { helical_gearbox: { ok: true, why: nm('Inline helical box: lowers 1450 rpm to agitator speed with high efficiency.', 'جيربوكس هيليكال على خط واحد بيقلل 1450 لفة لسرعة القلاب بكفاءة عالية.') },
          worm_gearbox: { ok: true, why: nm('Works, lower efficiency; mount the motor horizontal on its input.', 'ينفع بس كفاءته أقل، والموتور بيتركب أفقي على الدخل بتاعه.'), place: { rot: [0, 0, 0] } } } },
      { id: 'seal', name: nm('Shaft seal', 'سيل العمود'), p: [0, 199, 0], rot: [0, 0, -90], size: 26, need: true, lp: [-95, 205, 0], hint: nm('Sterile product: what stops leaks and contamination where the shaft enters?', 'منتج معقم: إيه اللي يمنع التسريب والتلوث مكان دخول العمود؟'),
        miss: nm('Without a seal the tank leaks and gets contaminated at the shaft.', 'من غير سيل التانك هيسرب ويتلوث عند العمود.'),
        opts: { mech_seal_cartridge: { ok: true, why: nm('Double cartridge seal with sterile barrier fluid: the pharma standard for agitators.', 'سيل كارتريدج مزدوج بسائل حاجز معقم: ده المعيار في قلابات الأدوية.') },
          mech_seal_single: { ok: false, why: nm('A single seal leaks a little to the outside and has no barrier: not for sterile batches.', 'السيل السنجل بيسرب شوية لبره ومفيهوش حاجز: مينفعش للباتشات المعقمة.') },
          gland_packing: { ok: false, why: nm('Packing must leak to work and sheds fibres: never on a GMP product tank.', 'الحشو لازم يسرب عشان يشتغل وبيرمي ألياف: ممنوع على تانك منتج GMP.') },
          lip_seal: { ok: false, why: nm('Lip seals are for oil at low pressure, they wear and cannot be cleaned or sterilised.', 'الأويل سيل للزيت وضغط واطي، بيدوب ومينفعش يتنضف أو يتعقم.') } } },
      { id: 'cip', name: nm('CIP spray ball', 'كورة الرش (CIP)'), p: [28, 166, 0], size: 18, need: true, lp: [95, 172, 0],
        opts: { spray_ball: { ok: true, why: nm('Static spray ball wets the whole inside during cleaning in place.', 'كورة الرش الثابتة بتغسل كل الجدار من جوه في الـCIP.') } } },
      { id: 'relief', name: nm('Pressure relief valve', 'صمام الأمان'), p: [0, 193, -32], size: 24, need: true, lp: [95, 212, -30],
        opts: { safety_valve: { ok: true, why: nm('Spring relief valve protects against over-pressure. On a product vessel use a sanitary type or a rupture disc; test it yearly.', 'صمام أمان بسوستة بيحمي من الضغط الزيادة. على تانك منتج استخدم نوع صحي أو قرص انفجار (رابشر ديسك)؛ ويتختبر كل سنة.') },
          ball_valve: { ok: false, why: nm('A ball valve does not open by itself on pressure: it is not a protection.', 'محبس الكورة مش بيفتح لوحده مع الضغط: مش حماية.') } } },
      { id: 'sight', name: nm('Sight glass', 'السايت جلاس'), p: [-28, 188, 14], rot: [0, 0, 90], size: 20, need: false, lp: [-95, 160, 30],
        opts: { sight_glass: { ok: true, why: nm('Lets the operator see the batch without opening the tank.', 'بيخلي العامل يشوف الباتش من غير ما يفتح التانك.') } } },
      { id: 'outlet', name: nm('Bottom outlet valve', 'محبس التفريغ تحت'), p: [30, 8, 0], size: 30, need: true, lp: [80, -4, 0], hint: nm('The tank must drain to the last drop and be cleanable.', 'التانك لازم يصفّي لآخر نقطة ويتنضف.'),
        opts: { diaphragm_valve: { ok: true, why: nm('Diaphragm valve: no cavities, drainable and cleanable. Right for pharma.', 'محبس دايافرام: مفيهوش تجاويف، بيصفّي وبيتنضف. صح للأدوية.') },
          ball_valve: { ok: false, why: nm('Product gets trapped in the body cavity around the ball: hard to clean.', 'المنتج بيتحبس في التجويف حوالين الكورة: صعب يتنضف.') },
          butterfly_valve: { ok: false, why: nm('Disc and shaft stay in the flow and leave dead spots: avoid on a product outlet.', 'الطبة والعمود في سكة السائل وبيعملوا أماكن ميتة: ابعد عنه على مخرج المنتج.') },
          gate_valve: { ok: false, why: nm('Gate valves have a pocket under the wedge: not hygienic.', 'محبس السكينة فيه جيب تحت البوابة: مش صحي.') } } },
    ],
  });

  /* ---------- 2. Pump skid ---------- */
  M.addBuild({
    id: 'pump', name: nm('Pump skid', 'شاسيه طلمبة'),
    intro: nm('Build a water transfer pump: motor, coupling, pump, suction strainer and valve, discharge check valve and control valve.', 'ابني طلمبة نقل مية: موتور، كوبلنج، طلمبة، مصفاة ومحبس سحب، ومحبس عدم رجوع ومحبس تحكم على الطرد.'),
    done: nm('Running. Align the coupling with a dial or laser, then check vibration and bearing temperature.', 'شغالة. اظبط استعدال الكوبلنج بالساعة أو الليزر، وبعدين افحص الاهتزاز وحرارة البلي.'),
    base: [
      { id: 'plate', name: nm('Baseplate', 'الشاسيه'), role: nm('Rigid steel base, grouted to the floor.', 'قاعدة حديد جامدة متثبتة في الأرض.'), mat: 'blue',
        s: [{ t: 'box', w: 150, h: 6, d: 46, p: [0, 3, 0] }, { t: 'box', w: 150, h: 2, d: 4, p: [0, 7, 21] }, { t: 'box', w: 150, h: 2, d: 4, p: [0, 7, -21] }] },
      { id: 'pipes', name: nm('Pipework', 'المواسير'), role: nm('Suction from the tank on the right, discharge to the plant above.', 'السحب من التانك على اليمين، والطرد للمصنع فوق.'), mat: 'sst',
        s: [{ t: 'tube', path: [[160, 28, 0], [46, 28, 0]], r: 3.4 }, { t: 'tube', path: [[24, 44, 0], [24, 104, 0], [34, 114, 0], [90, 114, 0]], r: 2.8, sharp: true }] },
    ],
    slots: [
      { id: 'motor', name: nm('Motor', 'الموتور'), p: [-46, 27, 0], size: 54, need: true, lp: [-85, 52, 0], opts: { induction_motor: { ok: true, why: nm('Foot-mounted motor, shaft toward the pump.', 'موتور على رجول وعموده ناحية الطلمبة.') } } },
      { id: 'coupling', name: nm('Coupling', 'الكوبلنج'), p: [-9, 27, 0], size: 16, need: true, lp: [-22, -12, 30],
        opts: { jaw_coupling: { ok: true, why: nm('Flexible jaw coupling takes small misalignment and shocks.', 'كوبلنج مرن بالعنكبوت بيستحمل انحراف بسيط وصدمات.') }, gear_coupling: { ok: true, why: nm('Gear coupling: strong, needs grease.', 'كوبلنج تروس: قوي ومحتاج شحم.') }, keyed_shaft: { ok: false, why: nm('A plain shaft and key does not join two shafts.', 'عمود وخابور لوحدهم مش بيوصّلوا عمودين ببعض.') } } },
      { id: 'pump', name: nm('Pump', 'الطلمبة'), p: [22, 28, 0], size: 46, need: true, lp: [34, -14, 30],
        opts: { centrifugal_pump: { ok: true, why: nm('Centrifugal pump: right for clean water transfer.', 'طلمبة طاردة مركزية: مناسبة لنقل المية النضيفة.') }, gear_pump: { ok: false, why: nm('Gear pumps are for viscous liquids, not large water flows.', 'طلمبة التروس للسوائل التقيلة مش لكميات مية كبيرة.') },
          aodd_pump: { ok: false, why: nm('Air diaphragm pumps pulse and use a lot of air: not for continuous water transfer.', 'طلمبة الدايافرام بالهوا بتنبض وبتصرف هوا كتير: مش لنقل مية مستمر.') } } },
      { id: 'strainer', name: nm('Suction strainer', 'مصفاة السحب'), p: [78, 28, 0], size: 22, need: true, lp: [84, 50, 0], opts: { y_strainer: { ok: true, why: nm('Catches debris before it reaches the impeller.', 'بتمسك الشوائب قبل ما توصل للريشة.') } } },
      { id: 'suction', name: nm('Suction isolation valve', 'محبس عزل السحب'), p: [118, 28, 0], size: 22, need: true, lp: [132, 2, 28],
        opts: { gate_valve: { ok: true, why: nm('Full bore, low loss: good on suction, always fully open.', 'فتحة كاملة وفقد قليل: كويس على السحب ويكون مفتوح على الآخر.') }, ball_valve: { ok: true, why: nm('Full-bore ball valve also fine for isolation.', 'محبس كورة فتحة كاملة كمان ينفع للعزل.') }, butterfly_valve: { ok: true, why: nm('OK on larger lines; keep it fully open.', 'ينفع في المقاسات الكبيرة ويفضل مفتوح على الآخر.') },
          globe_valve: { ok: false, why: nm('High pressure drop on suction causes cavitation.', 'فقد ضغط عالي على السحب بيعمل تكهف (كافيتيشن).') } } },
      { id: 'check', name: nm('Discharge non-return', 'محبس عدم الرجوع'), p: [24, 62, 0], rot: [0, 0, 90], size: 20, need: true, lp: [-28, 74, 0],
        opts: { swing_check_valve: { ok: true, why: nm('Stops reverse flow, so the pump cannot spin backwards when it stops.', 'بيمنع الرجوع، فالطلمبة متلفّش بالعكس لما تقف.') }, ball_valve: { ok: false, why: nm('Manual valve: does not stop backflow by itself.', 'محبس يدوي: مش بيمنع الرجوع لوحده.') } } },
      { id: 'control', name: nm('Discharge control valve', 'محبس التحكم على الطرد'), p: [24, 90, 0], rot: [0, 0, 90], size: 22, need: true, lp: [60, 98, 0],
        opts: { globe_valve: { ok: true, why: nm('Globe valve throttles smoothly: right to set the flow.', 'محبس جلوب بيخنق بنعومة: صح لضبط التصرف.') }, gate_valve: { ok: false, why: nm('Gate valves wear and vibrate when throttled.', 'محبس السكينة بيدوب ويرعش لو اتخنق.') }, ball_valve: { ok: false, why: nm('Throttling erodes the seats.', 'الخنق بياكل السيتات.') }, butterfly_valve: { ok: true, why: nm('Acceptable for coarse control on bigger lines.', 'مقبول للتحكم التقريبي في المقاسات الكبيرة.') } } },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
