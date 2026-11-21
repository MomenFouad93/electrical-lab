/* More PCB practice boards (transistor driver, optocoupler input, relay driver, PSU, USB protection, mains board) */
(function (g) {
  const EL = g.EL, X = EL.pcb, T = (a) => EL.tr(a);
  if (!X || !X.boards) return;
  const B = X.boards;
  const V = (...pts) => ({ via: pts.map((p) => ({ x: p[0], y: p[1] })) });
  const pad = (tag, x, y) => [tag, 'PCB_PAD', x, y];
  const lit = (c, tag) => { const d = c.parts.find((p) => p.tag === tag); return d && d.state.b > 0.3; };
  const part = (c, tag) => c.parts.find((p) => p.tag === tag);
  const hide = (c, tag, fault) => { const p = part(c, tag); p.fault = fault; p.hid = true; X.faultPart = p.id; };
  const METHOD = [['Measure the supply at the input first, then follow the signal to the point where the voltage disappears.', 'قيس الكهرباء عند الدخل الأول، وبعدين اتبع الإشارة لحد النقطة اللي الجهد بيختفي عندها.']];

  B.npn = {
    name: ['Transistor driver: LED never lights', 'درايفر ترانزستور: الـLED مش بتنور'],
    sym: ['A 12 V board drives an LED through an NPN transistor. The LED stays dark.', 'كارت 12 فولت بيشغل LED عن طريق ترانزستور NPN. الـLED مطفية.'],
    goal: ['Decide if the base drive or the transistor itself is at fault, then replace the faulty part.', 'اعرف العطل في تغذية القاعدة ولا في الترانزستور نفسه، وغيّر القطعة المعيوبة.'],
    hints: [['Measure base to emitter (B to E) on Q1. About 0.65 V means the base is being driven correctly.', 'قيس بين القاعدة والإيميتر (B و E) على Q1. حوالي 0.65 فولت يعني القاعدة متغذية صح.'], ['With the base fine, measure collector to emitter (C to E). Almost the full 12 V means the transistor does not conduct, although it is driven.', 'والقاعدة سليمة قيس بين الكولكتور والإيميتر (C وE). لو قريب من 12 فولت كاملة يبقى الترانزستور مش بيوصل رغم إنه متغذي.'], ['Select Q1 and press Replace.', 'اختار Q1 واضغط "غيّرها بقطعة جديدة".']],
    spec: { parts: [['J1', 'PCB_PWR', 20, 60, { volt: 12 }], ['R1', 'PCB_R', 150, 20, { r: 680 }], ['D1', 'PCB_LED', 270, 20, { kind: 'green' }], ['Q1', 'NPN', 330, 80, { model: 'small' }], ['R2', 'PCB_R', 160, 112, { r: 10000 }], pad('TP1', 240, 160), pad('TP2', 430, 60)],
      wires: [['J1.pos', 'R1.A'], ['R1.B', 'D1.A'], ['D1.K', 'Q1.C'], ['J1.pos', 'R2.A', V([98, 72], [98, 125])], ['R2.B', 'Q1.B'], ['Q1.E', 'J1.neg', V([385, 215], [55, 215])], ['R2.B', 'TP1.p'], ['Q1.C', 'TP2.p']] },
    setup(c) { hide(c, 'Q1', 'open_c'); },
    check(c) { return lit(c, 'D1') && part(c, 'Q1').fault === 'none' ? ['ok'] : null; },
    done: ['Fixed. Base at 0.65 V and full supply across C to E is the textbook sign of an open transistor.', 'اتصلح. القاعدة 0.65 فولت وجهد كامل بين C وE هي العلامة الكلاسيكية لترانزستور مفتوح.'],
  };

  B.opto = {
    name: ['Optocoupler input channel is dead', 'قناة دخل أوبتوكابلر ميتة'],
    sym: ['A 24 V field signal is wired to an optocoupler. The 5 V side indicator LED never lights.', 'إشارة حقل 24 فولت متوصلة على أوبتوكابلر. LED جانب الـ5 فولت مش بتنور أبدا.'],
    goal: ['Find which side of the optocoupler is dead and replace it.', 'اعرف أنهي ناحية في الأوبتوكابلر ميتة وغيّره.'],
    hints: [['Measure across the resistor R1. If it has 0 V, no current flows through the input LED.', 'قيس على طرفي المقاومة R1. لو 0 فولت يبقى مفيش تيار في LED الدخل.'], ['Then measure between pins A and K of U1: nearly the full 24 V means the input LED is open.', 'وبعدين قيس بين A وK في U1: قريب من 24 فولت كاملة يعني LED الدخل مفتوحة.'], ['Select U1 and press Replace.', 'اختار U1 واضغط "غيّرها بقطعة جديدة".']],
    spec: { parts: [['J1', 'PCB_PWR', 20, 60, { volt: 24 }], ['R1', 'PCB_R', 130, 40, { r: 2200 }], ['U1', 'OPTO', 250, 60, { ctr: 100 }], ['R2', 'PCB_R', 360, 150, { r: 330 }], ['D1', 'PCB_LED', 450, 150, { kind: 'green' }], ['J2', 'PCB_PWR', 560, 120, { volt: 5 }], pad('TP1', 215, 110), pad('TP2', 340, 205)],
      wires: [['J1.pos', 'R1.A'], ['R1.B', 'U1.A'], ['U1.K', 'J1.neg', V([270, 200], [55, 200])], ['J2.pos', 'U1.C', V([595, 60])], ['U1.E', 'R2.A'], ['R2.B', 'D1.A'], ['D1.K', 'J2.neg'], ['R1.B', 'TP1.p'], ['U1.E', 'TP2.p']] },
    setup(c) { hide(c, 'U1', 'dead_led'); },
    check(c) { return lit(c, 'D1') && part(c, 'U1').fault === 'none' ? ['ok'] : null; },
    done: ['Fixed. The field side (24 V) and logic side (5 V) are isolated, so each side is checked against its own 0 V.', 'اتصلح. جانب الحقل (24 فولت) وجانب المنطق (5 فولت) معزولين، فكل جانب بيتقاس مقابل الـ0 فولت بتاعه.'],
  };

  B.relay = {
    name: ['Relay driver: relay never clicks', 'درايفر ريلاي: الريلاي مبيشدش'],
    sym: ['A transistor should switch a 12 V relay and light a lamp on its contact. Nothing happens and there is no click.', 'ترانزستور المفروض يشغل ريلاي 12 فولت وينور لمبة على الكونتاكت. مفيش حاجة بتحصل ومفيش صوت.'],
    goal: ['Find why the relay does not pull in. Measure the coil, then replace the faulty part.', 'اعرف ليه الريلاي مبيشدش. قيس الكويل وبعدين غيّر القطعة المعيوبة.'],
    hints: [['Measure across the relay coil (A to B) with the transistor on. The full 12 V across a coil with nothing flowing means the coil is open.', 'قيس على كويل الريلاي (A وB) والترانزستور شغال. 12 فولت كاملة على كويل ومفيش تيار يعني الكويل مقطوع.'], ['The diode D2 across the coil absorbs the switch-off spike. It is not the cause here.', 'الدايود D2 على الكويل بيمتص سبايك الفصل. مش هو السبب هنا.'], ['Select K1 and press Replace.', 'اختار K1 واضغط "غيّرها بقطعة جديدة".']],
    spec: { parts: [['J1', 'PCB_PWR', 20, 140, { volt: 12 }], ['K1', 'RELAY5', 280, 60, { v: 12 }], ['D2', 'PCB_D', 150, 85, {}], ['Q1', 'NPN', 240, 190, { model: 'small' }], ['R2', 'PCB_R', 130, 220, { r: 4700 }], ['J2', 'PCB_PWR', 560, 60, { volt: 12 }], ['R3', 'PCB_R', 400, 140, { r: 1000 }], ['D3', 'PCB_LED', 500, 140, { kind: 'amber' }], pad('TP1', 215, 130), pad('TP2', 380, 40)],
      wires: [['J1.pos', 'K1.A', V([55, 60])], ['J1.pos', 'R2.A', V([98, 152], [98, 233])], ['R2.B', 'Q1.B'], ['K1.B', 'Q1.C'], ['Q1.E', 'J1.neg', V([295, 300], [55, 300])], ['D2.K', 'K1.A', V([221, 60])], ['D2.A', 'K1.B', V([157, 150])], ['J2.pos', 'K1.COM', V([595, 40], [360, 40])], ['K1.NO', 'R3.A'], ['R3.B', 'D3.A'], ['D3.K', 'J2.neg'], ['K1.B', 'TP1.p'], ['K1.COM', 'TP2.p']] },
    setup(c) { hide(c, 'K1', 'open_coil'); },
    check(c) { return lit(c, 'D3') && part(c, 'K1').fault === 'none' ? ['ok'] : null; },
    done: ['Fixed. The relay contacts are isolated from the coil: the lamp has its own supply.', 'اتصلح. كونتاكتات الريلاي معزولة عن الكويل: اللمبة ليها مصدر لوحدها.'],
  };

  B.psu = {
    name: ['Mains PSU: no DC output', 'باور سبلاي مين: مفيش خرج DC'],
    sym: ['A transformer and a bridge make 24 V DC for an indicator. The LED is dark. The 230 V supply is on.', 'ترانس وكوبري بيعملوا 24 فولت DC لمؤشر. الـLED مطفية. كهرباء 230 فولت موصلة.'],
    goal: ['Follow the power from the mains to the LED, find where it stops, and replace the faulty part. Use VAC for the AC parts and VDC after the bridge.', 'اتبع الكهرباء من المين لحد الـLED، لاقي فين بتقف، وغيّر القطعة المعيوبة. استخدم VAC للجزء AC وVDC بعد الكوبري.'],
    hints: [['Measure 230 V AC across the transformer primary (P1 to P2). If it is there, the supply is fine.', 'قيس 230 فولت AC على ابتدائي الترانس (P1 وP2). لو موجودة يبقى المصدر سليم.'], ['Measure the AC across the secondary (S1 to S2). Zero with a good primary points to the transformer.', 'قيس الـAC على الثانوي (S1 وS2). صفر مع ابتدائي سليم يشاور على الترانس.'], ['Power off and measure the primary winding resistance: OL means open. Replace T1.', 'اقفل الكهرباء وقيس مقاومة ملف الابتدائي: OL يعني مقطوع. غيّر T1.']],
    spec: { parts: [['S1', 'SRC1', 20, 10, {}], ['T1', 'TRAFO', 160, 110, { pri: 230, sec: 24 }], ['BR1', 'BRIDGE', 330, 150, { cap: 2200 }], ['R1', 'PCB_R', 330, 300, { r: 2200 }], ['D1', 'PCB_LED', 430, 300, { kind: 'green' }], pad('TP1', 120, 200), pad('TP2', 450, 200)],
      wires: [['S1.L', 'T1.P1'], ['S1.N', 'T1.P2'], ['T1.S1', 'BR1.AC1'], ['T1.S2', 'BR1.AC2'], ['BR1.POS', 'R1.A'], ['R1.B', 'D1.A'], ['D1.K', 'BR1.NEG', V([501, 240])], ['T1.S1', 'TP1.p'], ['BR1.POS', 'TP2.p']] },
    setup(c) { hide(c, 'T1', 'open_pri'); },
    check(c) { return lit(c, 'D1') && part(c, 'T1').fault === 'none' ? ['ok'] : null; },
    done: ['Fixed. 230 V on the primary and nothing on the secondary is the classic open transformer.', '230 فولت على الابتدائي ولا حاجة على الثانوي هي علامة الترانس المقطوع.'],
  };

  B.usb = {
    name: ['USB 5 V port: dead, polyfuse tripped', 'منفذ USB 5 فولت: ميت والـPTC فصل'],
    sym: ['The 5 V rail behind the USB port is dead. A resettable fuse (PTC) sits in the line.', 'خط الـ5 فولت بعد منفذ USB ميت. فيه فيوز قابل للريسيت (PTC) في الخط.'],
    goal: ['The PTC is only a symptom. Find what overloads it, replace that part, then power cycle so the PTC can reset.', 'الـPTC عرض بس. اعرف إيه اللي بيحمّله، غيّر القطعة دي، وبعدين افصل الكهرباء كام ثانية عشان الـPTC يعمل ريسيت.'],
    hints: [['Measure across the PTC (A to B). A tripped PTC drops nearly the full 5 V across it.', 'قيس على الـPTC (A وB). الـPTC الفاصل بيكون عليه تقريبا الـ5 فولت كاملة.'], ['Power off and measure resistance between the rail and ground: a few tenths of an ohm means a short across it. Look at the protection diode.', 'اقفل الكهرباء وقيس المقاومة بين الخط والجراوند: كام عُشر أوم يعني ماس. بص على دايود الحماية.'], ['Replace DT1, then switch the supply off for a few seconds so the PTC cools and resets.', 'غيّر DT1 وبعدين اقفل الكهرباء كام ثانية عشان الـPTC يبرد ويعمل ريسيت.']],
    spec: { parts: [['U1', 'USB5', 20, 20, {}], ['F1', 'PTCF', 15, 143, { hold: 0.5 }], ['DT1', 'TVS', 100, 143, { vbr: 6.8, dir: 'uni' }], ['R1', 'PCB_R', 170, 210, { r: 330 }], ['D1', 'PCB_LED', 270, 210, { kind: 'green' }], pad('TP1', -34, 108), pad('TP2', 190, 270)],
      wires: [['U1.VBUS', 'F1.A'], ['F1.B', 'DT1.K'], ['DT1.K', 'R1.A'], ['R1.B', 'D1.A'], ['D1.K', 'U1.GND', V([380, 223], [380, 130], [130, 130])], ['DT1.A', 'U1.GND', V([120, 130], [130, 130])], ['F1.A', 'TP1.p', V([40, 120])], ['R1.A', 'TP2.p', V([177, 282])]] },
    setup(c) { hide(c, 'DT1', 'short'); },
    check(c) { return lit(c, 'D1') && part(c, 'DT1').fault === 'none' ? ['ok'] : null; },
    done: ['Fixed. A PTC trips on an overload and keeps tripped until power is removed. The shorted TVS had clamped the rail.', 'اتصلح. الـPTC بيفصل عند الحمل الزيادة وبيفضل فاصل لحد ما الكهرباء تتشال. الـTVS الماس كان ماسك الخط.'],
  };

  B.mov = {
    name: ['230 V board: fuse blows, varistor suspected', 'كارت 230 فولت: الفيوز بيتحرق والفاريستور مشكوك فيه'],
    sym: ['A lamp board on 230 V is dead and the fuse is blown. A new fuse blows at once.', 'كارت لمبة على 230 فولت ميت والفيوز محروق. أي فيوز جديد بيتحرق فورا.'],
    goal: ['Find the part that shorts the supply, replace it first, then the fuse.', 'اعرف القطعة اللي بتعمل ماس على المصدر، غيّرها الأول وبعدين الفيوز.'],
    hints: [['Do not just replace the fuse. With power off and the fuse out, measure the resistance across the lamp and across the varistor RV1.', 'متغيّرش الفيوز وخلاص. والكهرباء مقفولة والفيوز مشال، قيس المقاومة على اللمبة وعلى الفاريستور RV1.'], ['A varistor must read megohms. A few ohms means it failed shorted after a surge.', 'الفاريستور لازم يقرا ميجا أوم. كام أوم يعني اتعطل ماس بعد سبايك.'], ['Replace RV1, then F1.', 'غيّر RV1 وبعدين F1.']],
    spec: { parts: [['S1', 'SRC1', 20, 10, {}], ['F1', 'PCB_FUSE', 20, 130, { rating: 1 }], ['RV1', 'MOV', 190, 110, { vrms: 275 }], ['H1', 'LAMP', 290, 110, { volt: '230V AC' }], pad('TP1', 130, 200), pad('TP2', 330, 230)],
      wires: [['S1.L', 'F1.A'], ['F1.B', 'RV1.A', V([91, 100], [215, 100])], ['F1.B', 'H1.X1', V([91, 100], [310, 100])], ['RV1.B', 'S1.N', V([215, 220], [70, 220])], ['H1.X2', 'S1.N', V([310, 220], [70, 220])], ['F1.B', 'TP1.p'], ['H1.X2', 'TP2.p']] },
    setup(c) { hide(c, 'RV1', 'short'); const f = part(c, 'F1'); f.fault = 'open'; f.hid = true; },
    check(c) { const l = c.parts.find((p) => p.tag === 'H1'); return l && l.state.b > 0.3 && part(c, 'RV1').fault === 'none' && part(c, 'F1').fault === 'none' ? ['ok'] : null; },
    done: ['Fixed. A varistor ends its life as a short and takes the fuse with it. Look for the surge source.', 'اتصلح. الفاريستور بينهي عمره ماس وبياخد الفيوز معاه. دوّر على مصدر السبايك.'],
  };

  // keep the free board last
  const i = X.order.indexOf('free'); if (i >= 0) X.order.splice(i, 1);
  X.order.push('npn', 'opto', 'relay', 'psu', 'usb', 'mov', 'free');
})(typeof window !== 'undefined' ? window : globalThis);
