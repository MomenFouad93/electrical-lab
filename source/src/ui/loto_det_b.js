/* LOTO device details, part B: machines, drives, supply types and the small control panel */
(function (g) {
  const EL = g.EL, L = EL.lotoData, DT = EL.lotoDet;
  if (!DT || !DT.h) return;
  const D = DT, { tr2, t, pl, ln, wire, W, ico, padlock, tag, rect, glow, lbl, screwTop, air, arrow, rr, cc, hl, dk, sc, F } = DT.h;
  const POLEC = [W.L1, W.L2, W.L3];
  const wave = (x0, y0, w, amp, ph, col, cyc) => { let d = ''; const n = 60; for (let i = 0; i <= n; i++) { const x = x0 + w * i / n, y = y0 - amp * Math.sin((i / n) * cyc * 2 * Math.PI + ph); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '; } return pl(d, col, 2.6); };

  /* ================= 3-phase motor ================= */
  D.def({
    id: 'motor3', group: 'load', cls: 'load', icon: 'motor', lockable: false, state: [['Star (Y)', 'نجمة (Y)'], ['Delta (Δ)', 'دلتا (Δ)']], stateLabel: ['Links', 'الوصلات'],
    name: ['Three-phase motor', 'موتور 3 فاز'],
    simple: ['The motor is the load, not an isolation point. Isolate it at the breaker, the starter or a local isolator, then prove the terminal box is dead. Even after isolation the shaft can keep turning (inertia, a fan, the driven load) and a turning motor can feed voltage back. Wait for it to stop and block the shaft if people work near it.', 'الموتور هو الحمل مش نقطة عزل. اعزله عند البريكر أو الستارتر أو سويتش محلي وبعدين اتأكد إن علبة التوصيل ميتة. حتى بعد العزل العمود ممكن يفضل يلف (قصور ذاتي أو مروحة أو الحمل) والموتور اللي بيلف ممكن يرجّع جهد. استنى لحد ما يقف وثبّت العمود لو فيه ناس شغالين جنبه.'],
    feeds: ['Fed by: a 3-phase contactor and breaker (400 V).', 'متغذي من: كونتاكتور وبريكر 3 فاز (400 فولت).'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += rr(60, 100, 230, 110, 20, 'cyan') + [86, 106, 126, 146, 166, 186, 206, 226, 246, 266].map((x) => `<path d="M${x} 106 v98" stroke="#16596b" stroke-width="5" opacity=".75"/>`).join('') + hl(66, 106, 218, 8, 4, 0.4);
        s += rr(22, 112, 44, 86, 10, 'dark') + [34, 44, 54].map((x) => `<path d="M${x} 118 v74" stroke="#10141f" stroke-width="3"/>`).join('');
        s += rr(288, 116, 20, 78, 6, 'dark') + rr(306, 142, 90, 26, 3, 'steel') + rect(330, 136, 22, 6, 2, '#10141f') + `<circle cx="396" cy="155" r="0" fill="none"/>`;
        s += rr(130, 62, 90, 42, 6, 'dark') + rr(136, 56, 78, 14, 4, 'steel') + [150, 175, 200].map((x) => screwTop(x, 63, 4)).join('');
        s += rr(80, 210, 56, 26, 4, 'dark') + rr(214, 210, 56, 26, 4, 'dark') + rect(60, 236, 230, 10, 3, '#2a3248');
        s += rect(152, 150, 90, 40, 3, '#f4f6fb') + t(197, 166, '3~ 400 V  Δ/Y', 8.5, '#273049') + t(197, 180, '7.5 kW  IP55', 8.5, '#273049');
        s += `<path d="M330 120 q10 -14 20 0" fill="none" stroke="#ffd27a" stroke-width="2"/><path d="M348 120 l6 -6 m-6 6 l8 2" stroke="#ffd27a" stroke-width="2" fill="none"/>` + t(352, 108, tr2('turning shaft', 'عمود بيلف'), 10, '#ffd27a');
      } else {
        s += `<circle cx="108" cy="150" r="100" fill="#26304a" stroke="#8b94a8" stroke-width="2"/><circle cx="108" cy="150" r="78" fill="#10141f"/>`;
        for (let i = 0; i < 24; i++) { const a = i * 15 * Math.PI / 180, c = POLEC[i % 3]; s += `<rect x="${108 + 74 * Math.cos(a) - 5}" y="${150 + 74 * Math.sin(a) - 5}" width="10" height="10" rx="2" fill="${c}" stroke="#141a28" transform="rotate(${i * 15 + 90} ${108 + 74 * Math.cos(a)} ${150 + 74 * Math.sin(a)})"/>`; }
        s += `<circle cx="108" cy="150" r="58" fill="#586178" stroke="#141a28" stroke-width="2"/>`;
        for (let i = 0; i < 20; i++) { const a = i * 18 * Math.PI / 180; s += `<circle cx="${108 + 48 * Math.cos(a)}" cy="${150 + 48 * Math.sin(a)}" r="3.6" fill="#e9eef7" stroke="#141a28" stroke-width=".8"/>`; }
        s += `<circle cx="108" cy="150" r="20" fill="${F('steel')}" stroke="#141a28" stroke-width="2"/><rect x="102" y="140" width="12" height="20" rx="2" fill="#141a28" opacity=".6"/>`;
        s += rr(222, 20, 190, 150, 8, 'dark') + t(317, 38, tr2('Terminal box', 'علبة التوصيل'), 11, '#cfd8ea');
        const top = [['U1', 258], ['V1', 316], ['W1', 374]], bot = [['W2', 258], ['U2', 316], ['V2', 374]];
        top.forEach((p, i) => { s += rr(p[1] - 14, 52, 28, 22, 3, 'brass') + t(p[1], 48, p[0], 10, '#cfd8ea') + wire(`M${p[1]} 52 V20`, POLEC[i], 5); });
        bot.forEach((p) => { s += rr(p[1] - 14, 108, 28, 22, 3, 'brass') + t(p[1], 148, p[0], 10, '#cfd8ea'); });
        if (!o.on) s += rr(250, 84, 132, 10, 3, 'copper') + wire('M258 94 V108', '#d77a3a', 5) + wire('M316 94 V108', '#d77a3a', 5) + wire('M374 94 V108', '#d77a3a', 5) + t(317, 164, tr2('Star: W2 U2 V2 joined (400 V)', 'نجمة: W2 وU2 وV2 متوصلين (400 فولت)'), 10, '#ffd27a');
        else { [258, 316, 374].forEach((x, i) => { s += wire(`M${x} 74 L${[316, 374, 258][i]} 108`, '#d77a3a', 5); }); s += t(317, 164, tr2('Delta: each winding between two phases', 'دلتا: كل ملف بين فازتين'), 10, '#ffd27a'); }
        s += pl('M108 72 V30 H222', W.PE, 4);
      }
      return s;
    },
    out: [[240, 150, 'Nameplate', 'لوحة الموتور', 'Read the voltage, the connection (Y or Δ), the current and the IP rating. The connection decides how the terminal box is wired.', 'اقرا الجهد والتوصيل (Y أو Δ) والتيار والـIP. التوصيل بيحدد توصيل علبة الأطراف.'], [175, 63, 'Terminal box', 'علبة التوصيل', 'Open it only after the circuit is isolated and proven dead.', 'متفتحهاش إلا بعد العزل والتأكد إنها ميتة.'], [352, 155, 'Shaft', 'العمود', 'A turning shaft can catch clothes. It can also keep turning after isolation.', 'العمود اللي بيلف ممكن يمسك هدوم. وممكن يفضل يلف بعد العزل.'], [44, 155, 'Cooling fan cover', 'غطا المروحة', 'The fan blows air over the fins. Keep covered; it stops last.', 'المروحة بتنفخ هوا على الزعانف. خليها مغطية؛ بتقف آخر حاجة.']],
    in: [[108, 90, 'Stator windings', 'ملفات الستاتور', 'Three sets of coils, one per phase, make a rotating magnetic field.', 'تلات مجموعات ملفات، واحدة لكل فاز، بتعمل مجال مغناطيسي دوّار.'], [108, 150, 'Rotor', 'الروتور', 'Copper or aluminium bars in an iron core. The field drags it around.', 'قضبان نحاس أو ألومنيوم في قلب حديد. المجال بيسحبه.'], [258, 64, 'Winding ends U1 V1 W1', 'أطراف الملفات U1 V1 W1', 'Six ends come to the box. Links decide star or delta.', 'ستة أطراف بتيجي للعلبة. الوصلات بتحدد نجمة أو دلتا.'], [316, 98, 'Links', 'الوصلات', 'Wrong links on a 400 V supply burn the motor or leave it weak.', 'وصلات غلط على 400 فولت بتحرق الموتور أو بتخليه ضعيف.'], [170, 30, 'Earth', 'الأرضي', 'Connects the frame to earth. Never remove it.', 'بيوصل البدن بالأرضي. متشيلوش أبدًا.']],
    lock: [['Isolate at the starter or breaker and lock it there (the motor itself has no lock point).', 'اعزل عند الستارتر أو البريكر واقفل هناك (الموتور نفسه مفيهوش نقطة قفل).'], ['Wait until the shaft has stopped; block it if people are close.', 'استنى لحد ما العمود يقف؛ ثبّته لو فيه ناس قريبين.'], ['Test U1, V1, W1 to each other and to earth before touching.', 'اختبر U1 وV1 وW1 مع بعض ومع الأرضي قبل ما تلمس.']],
    prove: [['Prove-test-prove with a two-pole tester on the terminal box, six pairs.', 'اختبر بالتستر على علبة الأطراف، 6 أزواج، وجرّب التستر قبل وبعد.']],
    mistakes: [['Working on the motor because "it stopped".', 'الشغل على الموتور لأنه "وقف".'], ['Opening the box with the machine still turning and generating voltage.', 'فتح العلبة والماكينة لسه بتلف وبتولّد جهد.']],
    std: ['IEC 60034. A turning motor can act as a generator; isolate the drive and wait for standstill.', 'IEC 60034. الموتور اللي بيلف ممكن يشتغل كمولّد؛ اعزل ثم استنى السكون.'],
  });

  /* ================= single-phase motor ================= */
  D.def({
    id: 'motor1', group: 'load', cls: 'load', icon: 'motor', lockable: false,
    name: ['Single-phase motor with run capacitor', 'موتور فاز واحد بكباسيتور'],
    simple: ['A small 230 V motor, common on fans, pumps and compressors. It has a main winding and a second winding fed through a capacitor to start the turning. The capacitor can hold a painful charge for minutes after switch-off. Isolate the supply, then discharge the capacitor through a resistor before touching it.', 'موتور صغير 230 فولت، موجود في المراوح والطلمبات والكباسات. فيه ملف رئيسي وملف تاني بيتغذى عن طريق كباسيتور عشان يبدأ اللف. الكباسيتور ممكن يفضل شايل شحنة بتوجع بعد الفصل بدقايق. اعزل المصدر وبعدين فرّغ الكباسيتور بمقاومة قبل ما تلمسه.'],
    feeds: ['Fed by: a 2-pole breaker or a plug, 230 V.', 'متغذي من: بريكر 2 بول أو فيشة 230 فولت.'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += rr(80, 110, 210, 100, 18, 'cyan') + [100, 118, 136, 154, 172, 190, 208, 226, 244, 262].map((x) => `<path d="M${x} 116 v88" stroke="#16596b" stroke-width="4" opacity=".7"/>`).join('') + hl(86, 114, 198, 7, 3, 0.4);
        s += rr(50, 120, 34, 80, 8, 'dark') + rr(288, 124, 18, 72, 6, 'dark') + rr(304, 148, 80, 24, 3, 'steel');
        s += rr(120, 52, 110, 52, 14, 'blue') + hl(128, 58, 90, 6, 3, 0.4) + t(175, 84, '25 µF  450 V', 11, '#fff', 'middle', 800) + rect(116, 100, 118, 6, 2, '#10141f');
        s += rr(98, 210, 50, 22, 4, 'dark') + rr(226, 210, 50, 22, 4, 'dark') + rect(80, 232, 210, 8, 3, '#2a3248');
        s += rr(310, 100, 70, 36, 5, 'dark') + t(345, 122, '230 V 1~', 11, '#cfd8ea');
      } else {
        s += `<circle cx="130" cy="160" r="104" fill="#26304a" stroke="#8b94a8" stroke-width="2"/><circle cx="130" cy="160" r="80" fill="#10141f"/>`;
        [0, 90, 180, 270].forEach((a, i) => { const r = a * Math.PI / 180; s += `<circle cx="${130 + 74 * Math.cos(r)}" cy="${160 + 74 * Math.sin(r)}" r="12" fill="${i % 2 ? '#dfe4ef' : '#b86a34'}" stroke="#141a28"/>`; });
        s += `<circle cx="130" cy="160" r="52" fill="#586178" stroke="#141a28" stroke-width="2"/>` + `<circle cx="130" cy="160" r="20" fill="${F('steel')}" stroke="#141a28" stroke-width="2"/>`;
        s += wire('M200 160 H246', W.L1, 6) + rr(246, 30, 124, 60, 12, 'blue') + t(308, 66, '25 µF  450 V', 12, '#fff', 'middle', 800);
        s += wire('M256 90 V150 H208', '#dfe4ef', 6) + wire('M370 60 H378 V218 H330', W.N, 6) + rr(250, 190, 90, 56, 8, 'dark') + t(295, 222, tr2('Terminals', 'الأطراف'), 11, '#cfd8ea');
        s += t(210, 14, tr2('Stored charge: discharge before touching', 'شحنة مخزنة: فرّغ قبل اللمس'), 11, '#ffd27a');
      }
      return s;
    },
    hasInside: true,
    out: [[130, 62, 'Run capacitor', 'كباسيتور التشغيل', 'The blue can on top. It stores energy even when the motor is unplugged.', 'العلبة الزرقا فوق. بتخزّن طاقة حتى والموتور مفصول.'], [345, 146, 'Nameplate', 'لوحة البيانات', 'Voltage, speed, power and capacitor value.', 'الجهد والسرعة والقدرة وقيمة الكباسيتور.'], [270, 160, 'Cooling fins', 'الزعانف', 'Dust and oil on the fins make the motor run hot.', 'الغبار والزيت على الزعانف بيخلّوا الموتور يسخن.']],
    in: [[130, 106, 'Main winding', 'الملف الرئيسي', 'Fed directly from the supply.', 'بيتغذى مباشرة من المصدر.'], [130, 234, 'Start (auxiliary) winding', 'ملف المساعد', 'Fed through the capacitor. The capacitor shifts the phase so a rotating field forms.', 'بيتغذى من الكباسيتور. الكباسيتور بيزحزح الفاز فيتكوّن مجال دوّار.'], [262, 44, 'Capacitor', 'الكباسيتور', 'Can keep several hundred volts after switch-off. Discharge through a resistor, never with a screwdriver.', 'ممكن يفضل عليه مئات الفولت بعد الفصل. فرّغه بمقاومة مش بمفك.'], [130, 160, 'Rotor', 'الروتور', 'Plain cage rotor, same as a 3-phase motor.', 'روتور قفص عادي زي موتور 3 فاز.']],
    lock: [['Isolate the 230 V supply: breaker or plug, lock it.', 'اعزل مصدر 230 فولت: بريكر أو فيشة، واقفله.'], ['Wait a minute and discharge the capacitor through a resistor.', 'استنى دقيقة وفرّغ الكباسيتور بمقاومة.']],
    prove: [['Measure across the capacitor terminals: it should read 0 V.', 'قيس على أطراف الكباسيتور: لازم يقرا صفر.']],
    mistakes: [['Touching the capacitor terminals after unplugging.', 'لمس أطراف الكباسيتور بعد سحب الفيشة.'], ['Short-circuiting the capacitor with a screwdriver: sparks and damage.', 'عمل قصر على الكباسيتور بمفك: شرر وتلف.']],
    std: ['IEC 60034 / IEC 61010. Capacitors can hold a charge: use a discharge resistor.', 'IEC 60034 / IEC 61010. الكباسيتور ممكن يشيل شحنة: استخدم مقاومة تفريغ.'],
  });

  /* ================= VFD ================= */
  D.def({
    id: 'vfd', group: 'load', cls: 'load', icon: 'vfd', lockable: false, state: [['Running', 'شغال'], ['Isolated 10 s ago', 'معزول من 10 ثواني'], ['After 5 min', 'بعد 5 دقايق']], multi: true,
    name: ['Variable frequency drive (VFD)', 'انفرتر (VFD)'],
    simple: ['A drive rectifies the mains into a DC bus (about 560 V on 400 V) held by large capacitors, then builds a new AC for the motor. After you isolate and lock the supply, the capacitors keep the bus charged for minutes. The drive label gives the waiting time (often 5 minutes). Measure DC+ to DC- and wait until it is near zero.', 'الانفرتر بيقوّم المين لـDC bus (حوالي 560 فولت على 400) ماسكه كباسيتورات كبيرة، وبعدين بيعمل AC جديد للموتور. بعد ما تعزل وتقفل المصدر الكباسيتورات بتفضل شايلة الـbus دقايق. لوحة الانفرتر مكتوب عليها وقت الانتظار (غالبًا 5 دقايق). قيس DC+ مع DC- واستنى لحد ما يقرب من الصفر.'],
    feeds: ['Feeds: a motor with adjustable speed. Control terminals can have separate supplies.', 'بيغذّي: موتور بسرعة متغيرة. أطراف التحكم ممكن يكون ليها مصدر منفصل.'],
    draw(o) {
      let s = '';
      const k = o.k || 0, v = [560, 540, 8][k];
      if (!o.inside) {
        s += rr(110, 10, 200, 280, 12, 'dark') + rr(126, 24, 168, 62, 6, 'glass') + t(210, 64, k === 0 ? '50.0 Hz' : '- - -', 28, k === 0 ? '#7cf09a' : '#3a4a60', 'middle', 800, 'monospace');
        s += [[150, 'green'], [182, 'red'], [214, 'grey'], [246, 'grey']].map((p) => rr(p[0] - 14, 102, 28, 20, 5, p[1])).join('') + cc(210, 160, 20, 'domeB') + `<path d="M210 146 v14" stroke="#cfd8ea" stroke-width="3"/>`;
        s += rect(130, 192, 160, 40, 4, '#f4f6fb') + t(210, 207, tr2('DANGER', 'خطر'), 11, '#c0281d', 'middle', 800) + t(210, 219, tr2('Wait 5 min after power off', 'استنى 5 دقايق بعد الفصل'), 8.5, '#c0281d', 'middle', 700) + t(210, 229, tr2('DC bus capacitors', 'كباسيتورات الـDC bus'), 8, '#4a556f');
        s += rect(126, 240, 168, 40, 4, '#10141f') + ['R', 'S', 'T', 'DC+', 'DC−', 'U', 'V', 'W'].map((l, i) => screwTop(140 + i * 20, 258, 6) + t(140 + i * 20, 275, l, 7, '#cfd8ea', 'middle', 600)).join('');
      } else {
        s += rr(10, 40, 90, 90, 6, 'dark') + t(55, 78, tr2('Rectifier', 'مقوّم'), 11, '#fff') + t(55, 94, tr2('6 diodes', '6 دايودات'), 10, '#cfd8ea') + wire('M0 70 H10', W.L1, 6) + wire('M0 85 H10', W.L2, 6) + wire('M0 100 H10', W.L3, 6);
        s += arrow(102, 85, 130, 85, '#ff9a8c') + rr(132, 40, 100, 90, 6, 'dark') + rr(146, 66, 30, 52, 6, 'blue') + rr(188, 66, 30, 52, 6, 'blue') + t(182, 56, tr2('DC bus capacitors', 'كباسيتورات الـDC bus'), 10, '#ffd27a');
        s += arrow(234, 85, 262, 85, '#ff9a8c') + rr(264, 40, 100, 90, 6, 'dark') + t(314, 78, tr2('Inverter', 'إنفرتر'), 11, '#fff') + t(314, 94, 'IGBT', 10, '#cfd8ea') + wire('M364 70 H420', POLEC[0], 6) + wire('M364 85 H420', POLEC[1], 6) + wire('M364 100 H420', POLEC[2], 6);
        s += rect(40, 160, 340, 100, 8, '#10141f', 'stroke="#2a3248"') + t(210, 184, tr2('DC bus voltage', 'جهد الـDC bus'), 12, '#9fb0cf');
        s += rect(60, 200, 300, 24, 5, '#1a2236') + rect(60, 200, 300 * v / 560, 24, 5, v > 50 ? '#e5483b' : '#4fc16a') + t(210, 218, v + ' V', 15, '#fff', 'middle', 800);
        s += t(210, 246, k === 0 ? tr2('Running: bus is about 560 V', 'شغال: الـbus حوالي 560 فولت') : k === 1 ? tr2('Isolated, but the bus is still lethal', 'معزول، بس الـbus لسه قاتل') : tr2('Near zero: measure to confirm', 'قرب الصفر: قيس عشان تتأكد'), 12, v > 50 ? '#ff9a8c' : '#7cf09a');
      }
      return s;
    },
    out: [[282, 34, 'Display', 'الشاشة', 'A dark display does not mean the DC bus is discharged.', 'شاشة مطفية مش معناها الـbus اتفضى.'], [298, 212, 'Warning label', 'لوحة التحذير', 'Gives the waiting time before covers are opened.', 'بتكتب وقت الانتظار قبل فتح الأغطية.'], [210, 252, 'DC+ DC- terminals', 'أطراف DC+ وDC-', 'Measure here between DC+ and DC-. Use a meter rated for the bus voltage (1000 V).', 'قيس هنا بين DC+ وDC-. استخدم جهاز يتحمل جهد الـbus (1000 فولت).']],
    in: [[28, 46, 'Rectifier', 'المقوّم', 'Six diodes turn the 3-phase AC into DC.', 'ست دايودات بيحولوا الـ3 فاز لـDC.'], [186, 96, 'DC bus capacitors', 'كباسيتورات الـbus', 'Big electrolytic capacitors. They discharge slowly through bleeder resistors.', 'كباسيتورات كبيرة. بتفضى ببطء عن طريق مقاومات تفريغ.'], [346, 46, 'Inverter', 'الإنفرتر', 'IGBTs cut the DC into a new AC for the motor. Output cables are also live while it runs.', 'IGBT بيقطع الـDC لـAC جديد للموتور. كابلات الخرج شغالة وهو شغال.'], [80, 214, 'Bus meter', 'مؤشر الـbus', 'Shows how the voltage falls after isolation. Real drives have a bleeder that can fail: always measure.', 'بيوريك الجهد بينزل إزاي بعد العزل. الانفرتر الحقيقي ليه مقاومة تفريغ ممكن تفشل: قيس دايمًا.']],
    lock: [['Isolate and lock the supply of the drive (breaker or rotary isolator).', 'اعزل واقفل مصدر الانفرتر (بريكر أو سويتش روتاري).'], ['Wait the time printed on the drive.', 'استنى الوقت المكتوب على الانفرتر.'], ['Measure DC+ to DC- and to earth; it must be near zero.', 'قيس DC+ مع DC- ومع الأرضي؛ لازم يقرب من الصفر.']],
    prove: [['Prove your meter on a known source, measure the bus, prove again.', 'جرّب الجهاز على مصدر معروف، قيس الـbus، جرّب تاني.']],
    mistakes: [['Opening the cover a few seconds after switching off.', 'فتح الغطا بعد الفصل بثواني.'], ['Measuring with a meter not rated for the bus voltage.', 'القياس بجهاز مش متصنف لجهد الـbus.']],
    std: ['IEC 61800-5-1: drives must carry a warning and the discharge time.', 'IEC 61800-5-1: الانفرتر لازم يكون عليه تحذير ووقت التفريغ.'],
  });

  /* ================= supply types ================= */
  D.def({
    id: 'supply', group: 'load', cls: 'source', icon: 'supply', lockable: true, defLock: false,
    name: ['Supply types: single, two and three phase', 'أنواع المصدر: فاز واحد وفازتين وتلات فازات'],
    simple: ['Single phase is a live wire (L) and a neutral (N): 230 V. A two-phase load is fed from two of the three phases: 400 V between them, no neutral. Three phase has three live wires 120 degrees apart: 400 V between any two, 230 V from each to neutral. Each one needs a device that opens all its live wires, and a test between every pair plus to earth.', 'الفاز الواحد سلك فاز (L) ونيوترال (N): 230 فولت. حمل الفازتين متغذي من فازتين من التلاتة: 400 فولت بينهم ومفيش نيوترال. الـ3 فاز تلات أسلاك بينهم 120 درجة: 400 فولت بين أي اتنين و230 من كل واحد للنيوترال. كل نوع محتاج جهاز يفتح كل أسلاكه، واختبار بين كل زوج وبين كل سلك والأرضي.'],
    draw(o) {
      let s = '';
      const C = [[6, 130], [146, 130], [286, 130]];
      if (!o.inside) {
        const head = (x0, title, sub) => t(x0 + 65, 22, title, 13, '#FDC300', 'middle', 800) + t(x0 + 65, 38, sub, 10, '#9fb0cf', 'middle', 600);
        s += head(6, tr2('Single phase', 'فاز واحد'), '230 V') + head(146, tr2('Two phase', 'فازتين'), '400 V') + head(286, tr2('Three phase', 'تلات فازات'), '400 V');
        const lines = (x0, list, sp) => list.map((l, i) => wire(`M${x0 + 20 + i * sp} 62 V200`, l[1], 8) + t(x0 + 20 + i * sp, 54, l[0], 10, '#cfd8ea')).join('');
        s += lines(6, [['L', W.L1], ['N', W.N], ['PE', W.PE]], 40) + lines(146, [['L1', W.L1], ['L2', W.L2], ['PE', W.PE]], 40) + lines(286, [['L1', W.L1], ['L2', W.L2], ['L3', W.L3], ['N', W.N], ['PE', W.PE]], 24);
        s += t(71, 226, '230 V', 14, '#ffd27a', 'middle', 800) + t(71, 242, 'L–N', 10, '#9fb0cf') + t(211, 226, '400 V', 14, '#ffd27a', 'middle', 800) + t(211, 242, 'L1–L2', 10, '#9fb0cf') + t(351, 226, '400 V  L–L', 13, '#ffd27a', 'middle', 800) + t(351, 244, '230 V  L–N', 12, '#ffd27a', 'middle', 700);
        if (o.lock) s += ico('mcb', 28, 120, 1.15) + ico('mcb', 156, 120, 1.15) + ico('mcb', 180, 120, 1.15) + ico('mcb3_clip', 296, 120, 1.2) + padlock(22, 178, 0.62) + padlock(172, 178, 0.62) + padlock(340, 178, 0.62);
      } else {
        const lab = (x0, a, b1, b2) => t(x0 + 65, 140, a, 12, '#cfd8ea', 'middle', 700) + t(x0 + 65, 155, b1, 9.5, '#9fb0cf', 'middle', 600) + t(x0 + 65, 168, b2, 9.5, '#9fb0cf', 'middle', 600);
        s += wave(8, 80, 124, 36, 0, W.L1, 1.5) + lab(6, tr2('Single phase', 'فاز واحد'), tr2('3 tests:', '3 اختبارات:'), 'L–N  L–PE  N–PE');
        s += wave(148, 80, 124, 30, 0, W.L1, 1.5) + wave(148, 80, 124, 30, -2.094, W.L2, 1.5) + lab(146, tr2('Two phase', 'فازتين'), tr2('3 tests:', '3 اختبارات:'), 'L1–L2  L1–PE  L2–PE');
        s += wave(288, 80, 124, 28, 0, W.L1, 1.5) + wave(288, 80, 124, 28, -2.094, W.L2, 1.5) + wave(288, 80, 124, 28, -4.188, W.L3, 1.5) + lab(286, tr2('Three phase', 'تلات فازات'), tr2('6 tests:', '6 اختبارات:'), tr2('3 phase pairs, 3 to earth', '3 بين الفازات و3 مع الأرضي'));
        s += rect(10, 182, 400, 104, 8, '#10141f', 'stroke="#2a3248"') + t(210, 204, tr2('Pairs for a three-phase circuit', 'أزواج دايرة 3 فاز'), 12, '#FDC300') + ['L1–L2', 'L2–L3', 'L1–L3', 'L1–PE', 'L2–PE', 'L3–PE'].map((p, i) => rr(24 + i * 64, 216, 56, 26, 5, 'dark') + t(52 + i * 64, 233, p, 11, '#fff', 'middle', 700)).join('') + t(210, 266, tr2('Add N to earth when a neutral is present', 'ضيف N مع الأرضي لو فيه نيوترال'), 11, '#9fb0cf');
      }
      return s;
    },
    out: [[71, 110, 'Single phase', 'فاز واحد', 'Lighting, sockets, small machines. Isolate with a 2-pole device (L and N).', 'إنارة وبريزات وماكينات صغيرة. اعزل بجهاز 2 بول (L وN).'], [211, 110, 'Two phase', 'فازتين', 'Two of the three phases: 400 V between them. There is no neutral, so both wires are live to earth.', 'فازتين من التلاتة: 400 فولت بينهم. مفيش نيوترال فالاتنين شغالين بالنسبة للأرضي.'], [351, 110, 'Three phase', 'تلات فازات', 'Motors and big loads. Open all three together.', 'موتورات وأحمال كبيرة. افتح التلاتة مع بعض.']],
    in: [[70, 60, 'Sine wave', 'موجة جيبية', 'The voltage swings between plus and minus 50 times per second.', 'الجهد بيتأرجح بين موجب وسالب 50 مرة في الثانية.'], [210, 60, 'Phase shift', 'فرق الطور', 'Two phases of a 3-phase system are 120 degrees apart, so L1–L2 is 400 V, not 460 V.', 'فازتين من نظام 3 فاز بينهم 120 درجة، فبين L1 وL2 400 فولت مش 460.'], [350, 60, 'Three waves', 'تلات موجات', 'Evenly spaced waves give a smooth rotating field in a motor.', 'موجات متساوية البعد بتدّي مجال دوّار ناعم في الموتور.'], [40, 196, 'Test pairs', 'أزواج الاختبار', 'Test every pair; a single test can miss a live wire.', 'اختبر كل زوج؛ اختبار واحد ممكن يفوّت سلك شغال.']],
    lock: [['Pick a device that opens every live wire of the circuit.', 'اختار جهاز بيفتح كل الأسلاك الشغالة للدايرة.'], ['Lock it and tag it.', 'اقفله وحط تاج.'], ['Test every pair listed in the cutaway view.', 'اختبر كل الأزواج المكتوبة في الشكل الداخلي.']],
    prove: [['Prove-test-prove with a rated two-pole tester.', 'اختبر بتستر بقطبين متصنف، قبل وبعد.']],
    mistakes: [['Testing one pair and calling it dead.', 'اختبار زوج واحد والحكم إنها ميتة.'], ['Isolating only the phase in a single-phase circuit.', 'عزل الفاز بس في دايرة فاز واحد.']],
    std: ['IEC 60364-5-53 and the site LOTO procedure.', 'IEC 60364-5-53 وإجراء اللوتو في الموقع.'],
  });
})(typeof window !== 'undefined' ? window : globalThis);
