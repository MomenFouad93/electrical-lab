/* Knowledge base B: single-phase motor, power supplies, PLC and I/O, generic PCB, sensors, transformers, solenoids, heaters, HMI, UPS */
(function (g) {
  const EL = g.EL, K = EL.kb, S = K.sym, F = K.find, M = K.mode, T = K.test, A = K.A;

  /* ======================= single-phase motor ======================= */
  let t = K.type('motor1', A('Single-phase motor (capacitor)', 'موتور فاز واحد (بمكثف)'), [
    A('Isolate and discharge the capacitor before you touch it (a start capacitor holds charge).', 'اعزل وفرّغ المكثف قبل ما تلمسه (مكثف التقويم بيحتفظ بشحنة).'),
    A('A motor that hums but does not turn, and turns if spun by hand, points straight at the capacitor or the start winding.', 'موتور بيهم ومش بيدور وبيدور لو لفيته بإيدك، يبقى المكثف أو ملف التقويم على طول.'),
  ]);
  S(t, 'hum', 'Hums, does not start', 'بيهم ومش بيدور');
  S(t, 'spin', 'Starts only if spun by hand', 'بيدور بس لو لفيته بإيدك');
  S(t, 'silent', 'Dead silent', 'ساكت خالص');
  S(t, 'slow', 'Slow or weak', 'بطيء أو ضعيف');
  S(t, 'trip', 'Trips the breaker or thermal', 'بيفصل البريكر أو الثيرمال');
  S(t, 'hot', 'Overheats', 'بيسخن');
  S(t, 'noise', 'Noisy', 'صوت عالي');
  S(t, 'smell', 'Burnt smell', 'ريحة حريق');
  F(t, 'cap_bulge', 'Capacitor bulged, leaking or burst', 'المكثف منتفخ أو بيسرّب أو منفجر', 'capbulge');
  F(t, 'cap_burnt', 'Capacitor body burnt or terminals melted', 'جسم المكثف محروق أو الأطراف دايبة', 'burnt');
  F(t, 'w_start', 'Start (auxiliary) winding burnt', 'ملف التقويم (المساعد) محروق', 'wind_one');
  F(t, 'w_main', 'Main winding burnt', 'الملف الرئيسي محروق', 'wind_one');
  F(t, 'w_both', 'Both windings dark', 'الملفين غامقين', 'wind_all');
  F(t, 'sw_burnt', 'Centrifugal switch burnt, stuck or broken', 'السويتش الطارد محروق أو معلق أو مكسور', 'burnt');
  F(t, 'br_blue', 'Bearing blue, dry or rough', 'الرولمان أزرق أو ناشف أو خشن', 'bearing');
  F(t, 'wet', 'Water, rust or insects inside', 'مياه أو صدا أو حشرات جوه', 'corrosion');
  M(t, 'cap', 'Run or start capacitor failed', 'مكثف التشغيل أو التقويم بايظ', 0.35, 'low', { hum: 0.9, spin: 0.9, slow: 0.5, hot: 0.3, silent: 0.05 }, { cap_bulge: 0.9, cap_burnt: 0.7 },
    'Replace the capacitor with the same µF and a voltage rating at least equal. Use the right type: a run capacitor is not a start capacitor.', 'غيّر المكثف بنفس الميكروفاراد وجهد مساوي أو أعلى. استخدم النوع الصح: مكثف التشغيل غير مكثف التقويم.', 'Keep the motor cool and avoid frequent starts.', 'خلي الموتور بارد وقلل مرات التشغيل.');
  M(t, 'switch', 'Centrifugal switch or start relay failed', 'السويتش الطارد أو ريلاي التقويم بايظ', 0.1, 'med', { hum: 0.7, spin: 0.4, hot: 0.5, trip: 0.4, smell: 0.4 }, { sw_burnt: 0.9 }, 'Replace the switch or relay, check the capacitor too.', 'غيّر السويتش أو الريلاي وافحص المكثف كمان.', null, null);
  M(t, 'startw', 'Start winding open or burnt', 'ملف التقويم مفتوح أو محروق', 0.1, 'high', { hum: 0.7, spin: 0.6, smell: 0.4, hot: 0.3 }, { w_start: 0.9 }, 'Rewind the motor, or replace it. Check why the start circuit stayed on.', 'إعادة لف أو تغيير الموتور. اعرف ليه دايرة التقويم فضلت شغالة.', null, null);
  M(t, 'mainw', 'Main winding burnt or shorted', 'الملف الرئيسي محروق أو ماس', 0.1, 'high', { silent: 0.5, trip: 0.7, smell: 0.7, hot: 0.5, hum: 0.2 }, { w_main: 0.9, w_both: 0.6 }, 'Rewind or replace. Look for overload or a stalled load as the cause.', 'إعادة لف أو تغيير. دوّر على أوفرلود أو حمل معلق كسبب.', null, null);
  M(t, 'bearing', 'Bearing failure', 'رولمان بايظ', 0.15, 'med', { noise: 0.9, hot: 0.4, slow: 0.3, trip: 0.2 }, { br_blue: 0.85 }, 'Replace both bearings and check the alignment.', 'غيّر الرولمانين وافحص الاستقامة.', null, null);
  M(t, 'supply', 'No supply or loose connection', 'مفيش كهرباء أو توصيلة سايبة', 0.12, 'low', { silent: 0.9 }, {}, 'Check voltage at the motor terminals, then the plug, switch, thermal and the connections.', 'قيس الجهد عند أطراف الموتور، وبعدين الفيشة والمفتاح والثيرمال والتوصيلات.', null, null);
  M(t, 'overload', 'Overload or jammed load', 'حمل زيادة أو معلق', 0.1, 'med', { trip: 0.7, hot: 0.7, slow: 0.4, hum: 0.3 }, {}, 'Free the load, check the gearbox, pump or fan. Compare the current to the nameplate.', 'حرّر الحمل، افحص الجيربوكس أو المضخة أو المروحة. قارن التيار باللوحة.', null, null);
  T(t, 'cap', 'Test the capacitor (disconnected and discharged)', 'اختبر المكثف (مفكوك ومفرّغ)', 'Measure the capacitance with an LCR or the meter capacitance range. Within ±10 % of the label is good. Zero or open means failed. Low means worn.', 'قيس السعة بجهاز LCR أو رنج السعة في الميتر. في حدود ±10% من المكتوب يبقى سليم. صفر أو open يبقى بايظ. أقل يبقى ضعيف.',
    [['ok', 'Within 10 % of the label', 'في حدود 10% من المكتوب'], ['low', 'More than 10 % low', 'أقل بأكتر من 10%'], ['dead', 'Zero, open or shorted', 'صفر أو open أو ماس']],
    { cap: { dead: 0.5, low: 0.45, ok: 0.05 } }, 'ok', 1.5, 'Short the terminals through a resistor first to discharge it.', 'اعمل شورت على الأطراف بمقاومة الأول عشان تفرّغه.');
  T(t, 'wres', 'Winding resistance: main, start and common', 'مقاومة الملفات: رئيسي وتقويم والمشترك', 'Isolated and capacitor out. Measure Common-Main, Common-Start and Main-Start. Main + Start should equal Main-Start. The start winding is usually higher than main.', 'معزول والمكثف مفكوك. قيس المشترك-رئيسي والمشترك-تقويم ورئيسي-تقويم. مجموع الرئيسي والتقويم لازم يساوي الرئيسي-تقويم. ملف التقويم غالبا أعلى من الرئيسي.',
    [['ok', 'Both windings read plausible values', 'الملفين بيقرأوا قيم منطقية'], ['startopen', 'Start winding open', 'ملف التقويم مفتوح'], ['mainopen', 'Main winding open', 'الرئيسي مفتوح'], ['low', 'Very low (shorted turns)', 'واطي جدا (لفات ماسة)']],
    { startw: { startopen: 0.8, ok: 0.1, low: 0.1 }, mainw: { mainopen: 0.4, low: 0.4, ok: 0.2 }, cap: { ok: 0.9, startopen: 0.05, mainopen: 0.05 }, switch: { ok: 0.7, startopen: 0.25, mainopen: 0.05 }, supply: { ok: 0.9, startopen: 0.05, mainopen: 0.05 } }, 'ok', 1.6);
  T(t, 'shaft', 'Turn the shaft by hand', 'لف الشافت بإيدك', 'Power off. Spin the shaft: it should turn freely and smoothly.', 'الكهرباء فاصلة. لف الشافت: المفروض يدور بحرية ونعومة.',
    [['free', 'Free and smooth', 'حر وناعم'], ['rough', 'Rough or stiff', 'خشن أو تقيل']], { bearing: { rough: 0.85, free: 0.15 }, overload: { free: 0.5, rough: 0.5 } }, 'free', 1);
  T(t, 'volt', 'Voltage at the motor terminals while trying to start', 'جهد عند أطراف الموتور وقت المحاولة', 'Measure across the supply terminals when switched on.', 'قيس عند أطراف التغذية وهو متوصل.',
    [['ok', 'Normal', 'طبيعي'], ['none', 'No voltage', 'مفيش جهد'], ['low', 'Low', 'واطي']], { supply: { none: 0.85, low: 0.1, ok: 0.05 }, cap: { ok: 0.85, low: 0.1, none: 0.05 } }, 'ok', 1.6, 'Live work.', 'شغل على كهرباء.');

  /* ======================= power supply ======================= */
  t = K.type('psu', A('Power supply (SMPS / DC supply)', 'باور سبلاي (SMPS / تغذية DC)'), [
    A('Isolate and wait for the primary capacitor to discharge before opening. Mains-side voltage is lethal.', 'اعزل واستنى المكثف الابتدائي يفضى قبل ما تفتح. جهد الدخل خطر على الحياة.'),
    A('Most dead supplies fail in the same order: input fuse, bridge rectifier, primary switch, then bulged electrolytics on the output side.', 'أغلب الباور سبلاي الميتة بتبوظ بنفس الترتيب: فيوز الدخل، دايود الجسر، ترانزستور السويتشنج، وبعدين مكثفات الخرج المنتفخة.'),
  ]);
  S(t, 'dead', 'No output at all', 'مفيش خرج خالص');
  S(t, 'tick', 'Clicking or hiccup (restarts)', 'صوت تكتكة أو بيعيد التشغيل');
  S(t, 'low', 'Output voltage low or sags under load', 'الخرج واطي أو بينزل تحت حمل');
  S(t, 'high', 'Output voltage too high', 'الخرج عالي');
  S(t, 'ripple', 'Noisy output, equipment resets', 'خرج فيه ضوضاء، الأجهزة بتعمل ريست');
  S(t, 'hot', 'Runs very hot', 'سخن جدا');
  S(t, 'fuseblow', 'Input fuse or breaker blows', 'فيوز أو بريكر الدخل بيفصل');
  S(t, 'smell', 'Burnt smell', 'ريحة حريق');
  F(t, 'cap_out', 'Output electrolytic capacitors bulged', 'مكثفات الخرج منتفخة', 'capbulge');
  F(t, 'cap_pri', 'Primary bulk capacitor bulged or leaking', 'المكثف الابتدائي الكبير منتفخ أو بيسرّب', 'capbulge');
  F(t, 'fuse_open', 'Input fuse blown, glass dark', 'فيوز الدخل محروق والزجاجة غامقة', null);
  F(t, 'burn_pri', 'Burnt area on the primary side (bridge, MOSFET, resistor)', 'منطقة محروقة في الابتدائي (جسر، موسفت، مقاومة)', 'burnt');
  F(t, 'burn_sec', 'Burnt area on the output side (diode, regulator)', 'منطقة محروقة في الخرج (دايود، منظم)', 'burnt');
  F(t, 'solder', 'Cracked solder joints around the transformer or connectors', 'لحام مشروخ حوالين الترانس أو الكونكتورات', 'solder');
  F(t, 'dust', 'Dust and blocked fan', 'تراب ومروحة مسدودة', 'fan');
  F(t, 'opto', 'Optocoupler or feedback part discoloured', 'الأوبتوكبلر أو جزء التغذية العكسية متغير اللون', 'burnt');
  M(t, 'fuse', 'Input fuse blown (secondary fault)', 'فيوز الدخل محروق (سببه عطل تاني)', 0.15, 'high', { dead: 0.9, fuseblow: 0.5 }, { fuse_open: 0.9, burn_pri: 0.4 }, 'Do not just replace the fuse. Check the bridge, the primary MOSFET and the bulk capacitor for a short first.', 'متغيرش الفيوز وخلاص. افحص الجسر وموسفت الابتدائي والمكثف الكبير من الماس الأول.', null, null);
  M(t, 'bridge', 'Shorted bridge rectifier or primary switch', 'جسر دايود أو سويتش ابتدائي ماس', 0.2, 'high', { dead: 0.9, fuseblow: 0.9, smell: 0.4 }, { burn_pri: 0.8, fuse_open: 0.7 }, 'Replace the bridge and the MOSFET together with the start-up and gate resistors and the PWM IC if it is damaged.', 'غيّر الجسر والموسفت مع مقاومات البدء والجيت وآي سي الـPWM لو اتضرر.', null, null);
  M(t, 'caps_old', 'Dried output electrolytics', 'مكثفات خرج ناشفة', 0.25, 'low', { ripple: 0.8, low: 0.5, tick: 0.6, hot: 0.3 }, { cap_out: 0.9 }, 'Replace all output electrolytics with low-ESR types of the same rating. Check the ESR if you can.', 'غيّر كل مكثفات الخرج بنوع low-ESR بنفس القيمة. قيس ESR لو تقدر.', 'Replace on a schedule in hot cabinets. Derate the supply to 70 % load.', 'غيّر بجدول في الدواليب السخنة. حمّل السبلاي 70% بس.');
  M(t, 'bulk', 'Failed primary bulk capacitor', 'المكثف الابتدائي الكبير بايظ', 0.1, 'med', { tick: 0.6, ripple: 0.5, dead: 0.4, hot: 0.2 }, { cap_pri: 0.9 }, 'Replace it with the same value and voltage, high-temperature type.', 'غيّره بنفس القيمة والجهد ونوع حرارة عالية.', null, null);
  M(t, 'feedback', 'Feedback loop fault (optocoupler / reference)', 'عطل حلقة التغذية العكسية (أوبتوكبلر / مرجع)', 0.1, 'med', { high: 0.9, low: 0.3, tick: 0.2 }, { opto: 0.8 }, 'Replace the optocoupler and the shunt reference (TL431) and check the resistors in the divider.', 'غيّر الأوبتوكبلر والمرجع (TL431) وافحص مقاومات المقسم.', null, null);
  M(t, 'overload', 'Overloaded or shorted output', 'الخرج محمل زيادة أو ماس', 0.15, 'med', { tick: 0.7, low: 0.5, hot: 0.5, dead: 0.2 }, { burn_sec: 0.4 }, 'Disconnect the load and re-test. Find the faulty load or the cable short. Check the supply rating against the real load current.', 'افصل الحمل وجرّب. دوّر على الحمل البايظ أو ماس الكابل. قارن قدرة السبلاي بالتيار الحقيقي.', null, null);
  M(t, 'solder', 'Cracked solder joints (heat cycling)', 'لحام مشروخ (من التسخين والتبريد)', 0.1, 'med', { tick: 0.5, dead: 0.3, ripple: 0.3 }, { solder: 0.9 }, 'Reflow the joints on the transformer, connectors and heavy parts.', 'أعد لحام الترانس والكونكتورات والقطع الثقيلة.', null, null);
  M(t, 'cool', 'Overheating from dust or fan failure', 'سخونة من تراب أو مروحة', 0.08, 'low', { hot: 0.9, tick: 0.3 }, { dust: 0.9 }, 'Clean, replace the fan, add space or ventilation around the supply.', 'نضّف، غيّر المروحة، ووسّع مسافة أو تهوية حوالين السبلاي.', null, null);
  T(t, 'fuse', 'Check the input fuse (power off)', 'افحص فيوز الدخل (الكهرباء فاصلة)', 'Remove the fuse and test continuity.', 'شيل الفيوز واعمل كونتينيوتي.',
    [['good', 'Continuity', 'موصل'], ['blown', 'Open', 'مقطوع']], { fuse: { blown: 0.95, good: 0.05 }, bridge: { blown: 0.8, good: 0.2 } }, 'good', 0.8);
  T(t, 'bridge', 'Diode-test the bridge rectifier and the bulk capacitor for a short', 'اختبر الجسر والمكثف الكبير (ماس)', 'Power off and discharged. Diode test each bridge leg; ohm across the bulk capacitor: should charge up, never read a hard short.', 'الكهرباء فاصلة والمكثف مفرّغ. دايود تست على كل رجل في الجسر، وأوم على المكثف الكبير: لازم يشحن وأبدا ميقراش ماس صلب.',
    [['ok', 'All junctions normal, no short', 'كل الوصلات طبيعية ومفيش ماس'], ['short', 'A bridge leg or bulk cap shorted', 'رجل جسر أو المكثف ماس']], { bridge: { short: 0.9, ok: 0.1 }, fuse: { short: 0.6, ok: 0.4 } }, 'ok', 1.8, 'Discharge the bulk capacitor first through a resistor.', 'فرّغ المكثف الكبير بمقاومة الأول.');
  T(t, 'dc', 'Measure the DC output unloaded and loaded', 'قيس خرج الـDC بدون حمل وبحمل', 'First with the load disconnected, then with the load connected. Watch for a drop.', 'الأول والحمل مفكوك، وبعدين والحمل موصل. راقب أي هبوط.',
    [['ok', 'Correct in both', 'صح في الحالتين'], ['sag', 'Correct unloaded, drops loaded', 'صح من غير حمل وبينزل بحمل'], ['high', 'Too high', 'عالي'], ['zero', 'Zero in both', 'صفر في الحالتين']],
    { overload: { sag: 0.6, zero: 0.2, ok: 0.2 }, caps_old: { sag: 0.5, ok: 0.4, zero: 0.1 }, feedback: { high: 0.8, ok: 0.1, sag: 0.1 }, fuse: { zero: 0.95, ok: 0.05 }, bridge: { zero: 0.95, ok: 0.05 }, bulk: { sag: 0.4, zero: 0.2, ok: 0.4 } }, 'ok', 1.4);
  T(t, 'ripple', 'Look at the output ripple with a scope', 'بص على ريبل الخرج بالأوسيلوسكوب', 'Bandwidth limit on, AC coupled, short ground spring. A 24 V supply should show below about 100 mV peak-to-peak.', 'حد النطاق شغال، AC، وسلك أرضي قصير. سبلاي 24 فولت المفروض يظهر أقل من حوالي 100 ملي فولت.',
    [['low', 'Clean', 'نضيف'], ['high', 'Large ripple or spikes', 'ريبل كبير أو سبايك']], { caps_old: { high: 0.85, low: 0.15 }, bulk: { high: 0.6, low: 0.4 }, solder: { high: 0.4, low: 0.6 } }, 'low', 2);

  /* ======================= PLC and I/O ======================= */
  t = K.type('plc', A('PLC, I/O card or field wiring', 'PLC أو كارت I/O أو توصيلات الحقل'), [
    A('Check the LEDs first: power, run, error, and each channel LED. They tell you if the fault is in the field or in the card.', 'ابدأ بالليدات: باور، رن، إيرور، وليد كل قناة. بتقولك العطل في الحقل ولا في الكارت.'),
    A('Compare the LED with the real voltage at the terminal. LED on and voltage present, but the program does not see it, means the card or program. LED off and voltage absent, means the field.', 'قارن الليد بالجهد الحقيقي على الترمينال. الليد منور والجهد موجود والبرنامج مش شايفه يبقى الكارت أو البرنامج. الليد مطفي ومفيش جهد يبقى الحقل.'),
  ]);
  S(t, 'noinput', 'Input not seen by the PLC', 'مدخل مش باين في الـPLC');
  S(t, 'nooutput', 'Output does not switch the load', 'مخرج مش بيشغّل الحمل');
  S(t, 'stuckin', 'Input always on', 'مدخل دايما on');
  S(t, 'stuckout', 'Output always on', 'مخرج دايما on');
  S(t, 'stop', 'PLC in stop or fault', 'PLC في ستوب أو عطل');
  S(t, 'rand', 'Random or intermittent behaviour', 'تصرف عشوائي أو متقطع');
  S(t, 'comm', 'Communication lost with a node', 'الاتصال فاقد مع نود');
  S(t, 'analog', 'Analog value wrong or jumping', 'قيمة أنالوج غلط أو بتقفز');
  F(t, 'led_in_off', 'Channel LED off with the sensor active', 'ليد القناة مطفي والسنسور فعال', null);
  F(t, 'led_in_on', 'Channel LED on but the program does not react', 'ليد القناة منور والبرنامج مش بيتفاعل', null);
  F(t, 'led_out_on', 'Output LED on but the load is dead', 'ليد المخرج منور والحمل ميت', null);
  F(t, 'burn_term', 'Burnt output terminal or relay contact', 'ترمينال مخرج أو كونتاكت ريلاي محروق', 'burnt');
  F(t, 'wet', 'Moisture or corrosion in the cabinet', 'رطوبة أو تآكل في الدولاب', 'corrosion');
  F(t, 'psu_low', '24 V supply low or noisy', 'مصدر 24 فولت واطي أو فيه ضوضاء', null);
  F(t, 'shield', 'Shield not earthed or power cable runs next to signal cable', 'الشيلد مش متأرض أو كابل القدرة جنب كابل الإشارة', null);
  F(t, 'err_led', 'SF/BF/ERR LED on', 'ليد SF/BF/ERR منور', null);
  F(t, 'swap', 'Sinking / sourcing (NPN / PNP) mismatch', 'عدم توافق sinking / sourcing (NPN / PNP)', null);
  M(t, 'sensor', 'Field sensor or switch faulty', 'سنسور أو مفتاح الحقل بايظ', 0.25, 'low', { noinput: 0.9, stuckin: 0.4, rand: 0.3 }, { led_in_off: 0.9 }, 'Test the sensor on the bench with a 24 V supply and a meter. Replace it, check the alignment and the cable.', 'اختبر السنسور على الترابيزة بمصدر 24 فولت وميتر. غيّره وافحص الاستقامة والكابل.', null, null);
  M(t, 'fieldwire', 'Broken, shorted or loose field wire', 'سلك حقل مقطوع أو ماس أو سايب', 0.2, 'med', { noinput: 0.8, rand: 0.7, stuckin: 0.3, nooutput: 0.3 }, { led_in_off: 0.8, wet: 0.3 }, 'Follow the loop with a continuity test, check the terminals and the junction box.', 'تتبع الدايرة بكونتينيوتي وافحص الأطراف وصندوق التوصيل.', null, null);
  M(t, 'card_in', 'Input channel damaged', 'قناة الدخل بايظة', 0.08, 'med', { noinput: 0.5, stuckin: 0.7 }, { led_in_on: 0.5 }, 'Move the signal to a spare channel and update the address. Replace the card later.', 'انقل الإشارة لقناة احتياطي وعدّل العنوان. غيّر الكارت بعدين.', null, null);
  M(t, 'card_out', 'Output channel or relay damaged', 'قناة المخرج أو الريلاي بايظ', 0.12, 'med', { nooutput: 0.7, stuckout: 0.7 }, { burn_term: 0.9, led_out_on: 0.7 }, 'Use a spare channel or add an interposing relay. Fit a flyback diode / RC on inductive loads.', 'استخدم قناة احتياطي أو ضيف ريلاي وسيط. ركّب دايود فلاي باك / RC على الأحمال الحثية.', 'Always use interposing relays on contactor coils and solenoids; add a flyback diode.', 'استخدم دايما ريلاي وسيط لكويلات الكونتاكتور والسولينويد وضيف دايود.');
  M(t, 'load', 'The load or its circuit (fuse, coil, valve)', 'الحمل أو دايرته (فيوز، كويل، فالف)', 0.15, 'low', { nooutput: 0.8 }, { led_out_on: 0.9 }, 'Measure at the load terminals with the output on. Voltage present means the load; absent means the wiring or the card.', 'قيس عند أطراف الحمل والمخرج on. جهد موجود يبقى الحمل؛ غايب يبقى التوصيل أو الكارت.', null, null);
  M(t, 'power24', '24 V supply problem', 'مشكلة مصدر 24 فولت', 0.1, 'med', { stop: 0.5, rand: 0.6, noinput: 0.3, analog: 0.3 }, { psu_low: 0.9 }, 'Measure under load, replace the supply or add capacity. Check the common returns.', 'قيس تحت حمل، غيّر السبلاي أو زوّد القدرة. افحص الأرضيات المشتركة.', null, null);
  M(t, 'emc', 'Electrical noise (EMC / earthing)', 'تشويش كهربي (EMC / أرضي)', 0.1, 'low', { rand: 0.8, analog: 0.8, comm: 0.6 }, { shield: 0.9 }, 'Earth the shield at one end (or both with an equipotential), segregate cables, add suppression on inductive loads.', 'أرّض الشيلد من طرف (أو الاتنين مع equipotential)، افصل الكابلات، وضيف suppression على الأحمال الحثية.', null, null);
  M(t, 'wiretype', 'Wrong wiring type (sinking / sourcing)', 'نوع التوصيل غلط (sinking / sourcing)', 0.06, 'low', { noinput: 0.8, stuckin: 0.3 }, { swap: 0.9 }, 'Match the sensor type to the card: PNP sensors to sourcing inputs, NPN to sinking, or use the right common.', 'طابق السنسور مع الكارت: PNP لمداخل sourcing وNPN لـsinking، أو استخدم الكومن الصح.', null, null);
  M(t, 'hw', 'CPU, module or bus fault', 'عطل CPU أو موديول أو بس', 0.07, 'high', { stop: 0.9, comm: 0.7 }, { err_led: 0.9 }, 'Read the diagnostic buffer, check the module LEDs and the bus cable and termination, replace the module.', 'اقرا الـdiagnostic buffer وليدات الموديول وكابل البس والتيرمينيشن، وغيّر الموديول.', null, null);
  M(t, 'prog', 'Program logic or forced I/O', 'منطق البرنامج أو I/O متفرضة (force)', 0.09, 'low', { stuckin: 0.5, stuckout: 0.6, nooutput: 0.4, noinput: 0.2 }, { led_in_on: 0.8 }, 'Go online, check forced bits, compare to the backup, look at the interlock conditions.', 'ادخل أونلاين، افحص البتات المفروضة، قارن بالنسخة الاحتياطية، وبص على شروط الإنترلوك.', null, null);
  T(t, 'led', 'Compare the channel LED with the real terminal voltage', 'قارن ليد القناة بالجهد الحقيقي على الترمينال', 'Measure at the input terminal against the common while the sensor is active. For outputs, measure at the output terminal with the output on.', 'قيس على ترمينال المدخل ضد الكومن والسنسور فعال. للمخارج قيس على ترمينال المخرج والمخرج on.',
    [['volt_led', 'Voltage present and LED on', 'جهد موجود والليد منور'], ['volt_noled', 'Voltage present but LED off', 'جهد موجود والليد مطفي'], ['novolt', 'No voltage at the terminal', 'مفيش جهد على الترمينال']],
    { sensor: { novolt: 0.9, volt_led: 0.05, volt_noled: 0.05 }, fieldwire: { novolt: 0.9, volt_led: 0.05, volt_noled: 0.05 }, card_in: { volt_noled: 0.8, volt_led: 0.15, novolt: 0.05 }, prog: { volt_led: 0.85, volt_noled: 0.1, novolt: 0.05 }, wiretype: { volt_noled: 0.5, novolt: 0.4, volt_led: 0.1 }, power24: { novolt: 0.5, volt_noled: 0.3, volt_led: 0.2 } }, 'volt_led', 1.4, 'Live low-voltage work, use fused leads.', 'شغل على جهد واطي، استخدم ليدز بفيوز.');
  T(t, 'out', 'Measure at the load with the output on', 'قيس عند الحمل والمخرج on', 'Force or command the output on and measure at the load terminals.', 'فعّل المخرج وقيس على أطراف الحمل.',
    [['volt', 'Voltage present at the load', 'جهد موجود عند الحمل'], ['none', 'No voltage at the load', 'مفيش جهد عند الحمل']], { load: { volt: 0.9, none: 0.1 }, card_out: { none: 0.9, volt: 0.1 }, fieldwire: { none: 0.85, volt: 0.15 } }, 'volt', 1.4);
  T(t, 'sup', 'Check the 24 V supply under load', 'افحص مصدر 24 فولت تحت حمل', 'Measure at the PLC power terminals and at the far end of the field supply.', 'قيس عند أطراف باور الـPLC وعند آخر نقطة في تغذية الحقل.',
    [['ok', 'Steady 24 V (±10 %)', '24 فولت ثابت (±10%)'], ['bad', 'Low, drooping or noisy', 'واطي أو بينزل أو فيه ضوضاء']], { power24: { bad: 0.9, ok: 0.1 }, emc: { ok: 0.6, bad: 0.4 } }, 'ok', 1.3);
  T(t, 'diag', 'Read the CPU diagnostic buffer and the module LEDs', 'اقرا الـdiagnostic buffer وليدات الموديول', 'Go online with the programming software, read the buffer, note the module and the error code.', 'ادخل أونلاين بسوفتوير البرمجة، اقرا الـbuffer، واكتب الموديول وكود الخطأ.',
    [['none', 'No error', 'مفيش خطأ'], ['module', 'Module or bus error', 'خطأ موديول أو بس'], ['wire', 'Wire break or short flagged', 'كسر أو ماس في السلك مسجل']], { hw: { module: 0.9, none: 0.1 }, fieldwire: { wire: 0.3, none: 0.6, module: 0.1 }, prog: { none: 0.9, module: 0.05, wire: 0.05 } }, 'none', 1);
  T(t, 'force', 'Check forced I/O and the program logic', 'افحص الـI/O المفروضة ومنطق البرنامج', 'Go online and list forced bits. Trace the rung that drives the output or reads the input.', 'ادخل أونلاين واعرض البتات المفروضة. تتبع الرانج اللي بيشغّل المخرج أو بيقرا المدخل.',
    [['ok', 'Nothing forced, logic as designed', 'مفيش force والمنطق زي التصميم'], ['bad', 'Forced bit or logic mistake', 'بت مفروضة أو غلط في المنطق']], { prog: { bad: 0.85, ok: 0.15 } }, 'ok', 1.2);

  /* ======================= generic PCB / electronic board ======================= */
  t = K.type('pcb', A('Electronic board (PCB)', 'كارت إلكتروني (PCB)'), [
    A('Photograph both sides under good light at an angle. Heat damage, swollen parts and cracked joints show best in low-angle light.', 'صوّر الوجهين بإضاءة كويسة وبزاوية. التلف الحراري والقطع المنتفخة واللحامات المشروخة بتبان أحسن بإضاءة مائلة.'),
    A('Power rails first. Measure input, then each regulated rail, before you chase any signal.', 'خطوط الباور الأول. قيس الدخل وبعدين كل خط منظم قبل ما تتبع أي إشارة.'),
    A('Look for the common failures: bulged electrolytics, burnt resistors, cracked joints on heavy parts, and corrosion.', 'دوّر على الأعطال الشائعة: مكثفات منتفخة، مقاومات محروقة، لحامات مشروخة في القطع التقيلة، وتآكل.'),
  ]);
  S(t, 'dead', 'Dead, no LEDs, no display', 'ميت، مفيش ليدات ولا شاشة');
  S(t, 'reset', 'Resets or restarts randomly', 'بيعمل ريست أو ريستارت عشوائي');
  S(t, 'hot', 'A part gets very hot', 'قطعة بتسخن جدا');
  S(t, 'fuse', 'Fuse blows or supply goes into protection', 'الفيوز بيتحرق أو المصدر بيدخل حماية');
  S(t, 'io', 'Inputs or outputs not working', 'مداخل أو مخارج مش شغالة');
  S(t, 'inter', 'Intermittent, changes when tapped or warmed', 'متقطع، بيتغير لما تخبط عليه أو يسخن');
  S(t, 'weird', 'Wrong values or odd behaviour', 'قيم غلط أو تصرف غريب');
  S(t, 'smell', 'Burnt smell', 'ريحة حريق');
  F(t, 'cap_bulge', 'Electrolytic capacitor bulged or leaking', 'مكثف إلكتروليتي منتفخ أو بيسرّب', 'capbulge');
  F(t, 'res_burnt', 'Resistor burnt, discoloured or cracked', 'مقاومة محروقة أو متغيرة اللون أو مشروخة', 'burnt');
  F(t, 'ic_crack', 'IC or transistor cracked, blown or burn mark', 'آي سي أو ترانزستور مشروخ أو منفجر أو أثر حرق', 'burnt');
  F(t, 'trace_burnt', 'Track lifted or burnt', 'مسار مرفوع أو محروق', 'trace');
  F(t, 'joint', 'Cracked or dull solder joints on connectors or heavy parts', 'لحامات مشروخة أو مطفية على الكونكتورات أو القطع التقيلة', 'solder');
  F(t, 'corr', 'Green or white corrosion, flux residue or liquid', 'تآكل أخضر أو أبيض أو بقايا فلكس أو سوائل', 'corrosion');
  F(t, 'mov', 'Varistor (MOV) or fuse blackened', 'فاريستور أو فيوز اسود', 'mov');
  F(t, 'conn', 'Connector pins bent, burnt or pushed back', 'دبابيس الكونكتور مكسورة أو محروقة أو ارتدّت', 'terminal');
  F(t, 'crystal', 'Crystal or oscillator cracked', 'كريستال أو أوسيليتور مشروخ', null);
  F(t, 'relay', 'Relay contacts pitted or coil burnt', 'كونتاكتات الريلاي متآكلة أو الكويل محروق', 'coil');
  M(t, 'caps', 'Failed electrolytic capacitors', 'مكثفات إلكتروليتية بايظة', 0.28, 'low', { reset: 0.7, dead: 0.3, weird: 0.4, inter: 0.3, hot: 0.2 }, { cap_bulge: 0.9 }, 'Replace the electrolytics (low ESR, same voltage and temperature rating). Measure ESR before you decide.', 'غيّر المكثفات الإلكتروليتية (low ESR، نفس الجهد والحرارة). قيس ESR قبل ما تقرر.', 'Fit better capacitors and keep boards cool.', 'استخدم مكثفات أحسن وخلي الكروت باردة.');
  M(t, 'joints', 'Cracked solder joints (cold joints)', 'لحامات مشروخة (باردة)', 0.2, 'low', { inter: 0.9, reset: 0.4, io: 0.4, dead: 0.2 }, { joint: 0.9 }, 'Reflow the suspect joints, with fresh solder on connectors, transformers and relays.', 'أعد لحام اللحامات المشكوك فيها، بقصدير جديد على الكونكتورات والترانسات والريلايهات.', null, null);
  M(t, 'short', 'Shorted component on a power rail', 'قطعة ماس على خط باور', 0.12, 'high', { fuse: 0.8, hot: 0.8, dead: 0.5, smell: 0.4 }, { ic_crack: 0.5, res_burnt: 0.4, trace_burnt: 0.4 }, 'Find the short: inject current-limited voltage and find the hot part with a thermal camera or alcohol on the board. Replace that part.', 'دوّر على الماس: حقن جهد بحد تيار وهات القطعة السخنة بكاميرا حرارية أو كحول على الكارت. غيّر القطعة.', null, null);
  M(t, 'surge', 'Surge or spike damage (MOV, TVS, input stage)', 'تلف من سبايك أو surge (MOV, TVS, مرحلة الدخل)', 0.1, 'med', { dead: 0.7, fuse: 0.5 }, { mov: 0.9, ic_crack: 0.3 }, 'Replace the protection parts and the damaged input components. Improve the surge protection on the supply.', 'غيّر قطع الحماية والمكونات المتضررة في الدخل. حسّن حماية السبايك على التغذية.', null, null);
  M(t, 'corrosion', 'Moisture or corrosion damage', 'تلف من رطوبة أو تآكل', 0.1, 'med', { weird: 0.6, inter: 0.5, io: 0.5, dead: 0.3 }, { corr: 0.9 }, 'Clean with isopropyl alcohol and a soft brush, dry fully, replace corroded parts, and coat the board. Fix the leak or condensation.', 'نضّف بأيزوبروبيل وفرشة ناعمة، جفف تماما، غيّر القطع المتآكلة، وحط ورنيش حماية. صلّح التسريب أو التكثف.', null, null);
  M(t, 'connector', 'Connector or cable failure', 'عطل كونكتور أو كابل', 0.1, 'low', { inter: 0.7, io: 0.6, dead: 0.2 }, { conn: 0.9, joint: 0.3 }, 'Replace the connector or crimp, re-seat and secure the cable.', 'غيّر الكونكتور أو الكبس، وأعد التركيب وثبّت الكابل.', null, null);
  M(t, 'ic', 'Damaged IC or transistor', 'آي سي أو ترانزستور تالف', 0.08, 'high', { weird: 0.5, io: 0.6, hot: 0.5, dead: 0.3 }, { ic_crack: 0.9 }, 'Replace the part with an exact equivalent, then find what killed it (overvoltage, short on the output, ESD).', 'غيّر القطعة بمكافئ مطابق، وبعدين اعرف إيه اللي قتلها (جهد زيادة، ماس في الخرج، ESD).', null, null);
  M(t, 'relay', 'Relay worn or burnt', 'ريلاي مستهلك أو محروق', 0.08, 'low', { io: 0.7, inter: 0.4 }, { relay: 0.9 }, 'Replace the relay with the same type. Add suppression across inductive loads.', 'غيّر الريلاي بنفس النوع. ضيف suppression على الأحمال الحثية.', null, null);
  M(t, 'clock', 'Crystal or oscillator failure', 'عطل كريستال أو أوسيليتور', 0.03, 'low', { dead: 0.4, weird: 0.6 }, { crystal: 0.9 }, 'Replace the crystal and its load capacitors.', 'غيّر الكريستال ومكثفاته.', null, null);
  T(t, 'rails', 'Measure the power rails', 'قيس خطوط الباور', 'Measure input, then every regulated rail (5 V, 3.3 V and so on) against ground. Compare with the schematic or the markings.', 'قيس الدخل وبعدين كل خط منظم (5 فولت، 3.3 فولت وهكذا) ضد الأرضي. قارن بالمخطط أو العلامات.',
    [['ok', 'All rails correct', 'كل الخطوط صح'], ['none', 'Input present, a rail is missing', 'الدخل موجود وخط ناقص'], ['low', 'A rail is low or noisy', 'خط واطي أو فيه ضوضاء'], ['noin', 'No input power', 'مفيش دخل']],
    { caps: { low: 0.55, ok: 0.3, none: 0.1, noin: 0.05 }, short: { none: 0.4, low: 0.4, noin: 0.1, ok: 0.1 }, surge: { noin: 0.5, none: 0.4, ok: 0.1 }, joints: { ok: 0.5, low: 0.15, none: 0.2, noin: 0.15 }, connector: { noin: 0.3, ok: 0.5, none: 0.1, low: 0.1 }, ic: { ok: 0.5, none: 0.3, low: 0.2 } }, 'ok', 1.5, 'Take care with mains-side and large capacitors.', 'انتبه من جهة المين والمكثفات الكبيرة.');
  T(t, 'esr', 'Check capacitors (ESR or capacitance, in circuit if you can)', 'افحص المكثفات (ESR أو سعة)', 'Use an ESR meter in circuit, or remove and measure. High ESR or low capacitance means worn.', 'استخدم ESR ميتر على الكارت، أو فك وقيس. ESR عالي أو سعة قليلة يبقى مستهلك.',
    [['ok', 'All fine', 'كله سليم'], ['bad', 'One or more high ESR / low value', 'واحد أو أكتر ESR عالي أو سعة قليلة']], { caps: { bad: 0.9, ok: 0.1 } }, 'ok', 1.8, 'Discharge capacitors before you test.', 'فرّغ المكثفات قبل الاختبار.');
  T(t, 'shortc', 'Resistance of each power rail to ground (power off)', 'مقاومة كل خط باور للأرضي (الكهرباء فاصلة)', 'Unpowered. Measure each rail to ground. Near zero ohms is a short; compare with an identical good board if you have one.', 'من غير كهرباء. قيس كل خط للأرضي. قرب الصفر يبقى ماس؛ قارن بكارت سليم مماثل لو عندك.',
    [['ok', 'Plausible value', 'قيمة منطقية'], ['short', 'Near zero', 'قرب الصفر']], { short: { short: 0.85, ok: 0.15 }, ic: { short: 0.3, ok: 0.7 }, surge: { short: 0.4, ok: 0.6 } }, 'ok', 1.5);
  T(t, 'tap', 'Tap, flex and warm the board while it runs', 'خبّط ولوّي وسخّن الكارت وهو شغال', 'Gently tap parts with an insulated tool, flex the board slightly, warm it with a hot-air gun on low or cool it with a freeze spray, and watch whether the fault changes.', 'خبّط بخفة بأداة معزولة، لوّي الكارت شوية، سخّنه بهيتر هوا على واطي أو بردّه بسبراي تبريد، وراقب هل العطل بيتغير.',
    [['same', 'No change', 'مفيش تغيير'], ['changes', 'The fault comes and goes', 'العطل بيظهر ويختفي']], { joints: { changes: 0.85, same: 0.15 }, connector: { changes: 0.7, same: 0.3 }, caps: { changes: 0.25, same: 0.75 }, corrosion: { changes: 0.4, same: 0.6 } }, 'same', 1.1, 'Never apply freeze spray to a powered mains-side area.', 'متستخدمش سبراي تبريد على منطقة مين شغالة.');
  T(t, 'diode', 'Diode test on suspect semiconductors', 'دايود تست على أشباه الموصلات المشكوك فيها', 'Unpowered. Test diodes, transistors and MOSFETs in circuit; a reading near 0 V both ways is a short, open both ways is open. Remove one leg to confirm.', 'من غير كهرباء. اختبر الدايودات والترانزستورات والموسفتات على الكارت؛ قراءة قرب 0 فولت في الاتجاهين ماس، وopen في الاتجاهين مفتوح. شيل رجل للتأكيد.',
    [['ok', 'Normal', 'طبيعي'], ['bad', 'Shorted or open', 'ماس أو مفتوح']], { ic: { bad: 0.85, ok: 0.15 }, short: { bad: 0.6, ok: 0.4 }, surge: { bad: 0.4, ok: 0.6 } }, 'ok', 1.6);

  /* ======================= sensors and instruments ======================= */
  t = K.type('sensor', A('Sensor or transmitter', 'سنسور أو ترانسميتر'), [
    A('Separate the three: the sensor itself, the cable, and the input it feeds. Test the sensor with a simulator or a known good one.', 'افصل التلاتة: السنسور نفسه، الكابل، والمدخل اللي بيغذيه. اختبر السنسور بسيميوليتر أو واحد سليم.'),
    A('For 4-20 mA loops: below 3.6 mA means a break, above 21 mA means a short or an overrange.', 'في لوب 4-20 مللي: أقل من 3.6 معناه كسر، وأكتر من 21 معناه ماس أو أوفررنج.'),
  ]);
  S(t, 'nosig', 'No signal', 'مفيش إشارة');
  S(t, 'stuck', 'Stuck at a value', 'ثابت على قيمة');
  S(t, 'drift', 'Reading drifts or is wrong', 'القراءة بتنحرف أو غلط');
  S(t, 'noisy', 'Unstable or jumping', 'مش ثابت أو بيقفز');
  S(t, 'false', 'False triggers', 'تشغيل كاذب');
  S(t, 'miss', 'Misses detections', 'بيفوّت الكشف');
  F(t, 's_dirty', 'Sensing face dirty, covered or damaged', 'وش السنسور وسخ أو مغطى أو متضرر', null);
  F(t, 's_cable', 'Cable damaged, kinked or water in the gland', 'الكابل تالف أو مثني أو مياه في الجلاند', 'corrosion');
  F(t, 's_mount', 'Mounting loose, misaligned or wrong distance', 'التثبيت سايب أو غير مظبوط أو المسافة غلط', null);
  F(t, 's_heat', 'Exposed to heat, vibration or washdown', 'معرض لحرارة أو اهتزاز أو غسيل', null);
  F(t, 's_led', 'Indicator LED does not change', 'ليد المؤشر مش بيتغير', null);
  F(t, 's_imp', 'Impulse line blocked or has air or condensate (pressure)', 'خط الإمبلس مسدود أو فيه هوا أو مياه (ضغط)', null);
  M(t, 'dirty', 'Dirty or misaligned sensing face', 'وش السنسور وسخ أو مش مظبوط', 0.22, 'low', { miss: 0.8, false: 0.4, drift: 0.4 }, { s_dirty: 0.9, s_mount: 0.8 }, 'Clean the face, correct the distance and alignment, tighten the mount.', 'نضّف الوش، اظبط المسافة والاستقامة، واشد التثبيت.', null, null);
  M(t, 'cable', 'Cable or connector fault', 'عطل كابل أو كونكتور', 0.25, 'med', { nosig: 0.6, noisy: 0.7, stuck: 0.3, false: 0.4 }, { s_cable: 0.9 }, 'Check continuity and insulation of the cable, replace the cable or the M12 connector, seal the gland.', 'افحص كونتينيوتي وعزل الكابل، غيّر الكابل أو الكونكتور M12، واحكم الجلاند.', null, null);
  M(t, 'dead', 'Sensor failed (electronics or element)', 'السنسور باظ (إلكترونيات أو عنصر)', 0.2, 'low', { nosig: 0.8, stuck: 0.6 }, { s_led: 0.8, s_heat: 0.4 }, 'Replace the sensor and find what killed it: heat, vibration, overvoltage or a wiring error.', 'غيّر السنسور واعرف إيه اللي قتله: حرارة، اهتزاز، جهد زيادة أو غلط توصيل.', null, null);
  M(t, 'supply', 'Wrong or low supply voltage', 'جهد التغذية غلط أو واطي', 0.1, 'low', { nosig: 0.5, drift: 0.6, noisy: 0.4 }, {}, 'Measure at the sensor terminals under load. Fix the supply or the voltage drop in a long cable.', 'قيس عند أطراف السنسور تحت حمل. صلّح المصدر أو هبوط الجهد في الكابل الطويل.', null, null);
  M(t, 'drift', 'Calibration drift or ageing', 'انحراف المعايرة أو عمر', 0.12, 'low', { drift: 0.9 }, { s_heat: 0.4 }, 'Re-calibrate with a reference; replace if it will not hold.', 'عاير بمرجع؛ غيّره لو مش بيثبت.', 'Calibrate on a schedule against traceable standards.', 'عاير بجدول على مراجع متتبعة.');
  M(t, 'emc', 'Electrical noise on the signal', 'تشويش كهربي على الإشارة', 0.1, 'low', { noisy: 0.9, false: 0.6, drift: 0.2 }, {}, 'Use shielded twisted pair, earth the shield at one end, separate from power cables, add filtering.', 'استخدم كابل مشيلد مجدول، أرّض الشيلد من طرف، افصله عن كابلات القدرة، وضيف فلتر.', null, null);
  M(t, 'process', 'Process connection problem (blocked line, air, wrong range)', 'مشكلة في توصيلة العملية (خط مسدود، هوا، رينج غلط)', 0.08, 'low', { stuck: 0.5, drift: 0.7, noisy: 0.4 }, { s_imp: 0.9 }, 'Purge and clear the impulse line, check the isolation valves and the range settings.', 'نضّف الخط وطلّع الهوا، افحص فالفات العزل وإعدادات الرينج.', null, null);
  T(t, 'led', 'Watch the indicator LED while you present a target', 'بص على ليد المؤشر وانت بتقرّب هدف', 'Present and remove a target. The LED should follow. For analog sensors, use a simulated input.', 'قرّب وبعّد هدف. الليد المفروض يتبع. للسنسورات الأنالوج استخدم دخل مصطنع.',
    [['follows', 'LED follows the target', 'الليد بيتبع الهدف'], ['stuck', 'LED does not change', 'الليد مش بيتغير'], ['flick', 'LED flickers', 'الليد بيرعش']], { dead: { stuck: 0.9, follows: 0.05, flick: 0.05 }, dirty: { stuck: 0.5, flick: 0.3, follows: 0.2 }, cable: { follows: 0.7, flick: 0.2, stuck: 0.1 }, emc: { follows: 0.6, flick: 0.4 }, supply: { stuck: 0.5, flick: 0.4, follows: 0.1 } }, 'follows', 1);
  T(t, 'supply', 'Voltage at the sensor terminals', 'الجهد عند أطراف السنسور', 'Measure supply voltage at the sensor itself while the circuit is loaded.', 'قيس جهد التغذية عند السنسور نفسه والدايرة محملة.',
    [['ok', 'Within spec', 'في المواصفات'], ['bad', 'Low or missing', 'واطي أو غايب']], { supply: { bad: 0.9, ok: 0.1 }, cable: { bad: 0.4, ok: 0.6 } }, 'ok', 1.2);
  T(t, 'loop', 'Loop current or output signal with a calibrator', 'تيار اللوب أو إشارة الخرج بمعايِر', 'Measure the 4-20 mA loop in series, or the output at the PLC end versus the sensor end. Or inject a known signal at the PLC input.', 'قيس لوب 4-20 مللي على التوالي، أو الخرج عند الـPLC مقابل السنسور. أو احقن إشارة معروفة على مدخل الـPLC.',
    [['ok', 'Matches the process', 'مطابق للعملية'], ['break', 'Below 3.6 mA (break)', 'أقل من 3.6 مللي (كسر)'], ['over', 'Above 21 mA', 'فوق 21 مللي'], ['off', 'Different from the process, not a fault value', 'مختلف عن العملية بدون قيمة عطل']],
    { cable: { break: 0.4, ok: 0.3, off: 0.3 }, dead: { break: 0.4, over: 0.3, off: 0.3 }, drift: { off: 0.8, ok: 0.2 }, process: { off: 0.8, ok: 0.2 }, dirty: { ok: 0.5, off: 0.5 } }, 'ok', 1.6);
  T(t, 'cableT', 'Test the cable: continuity and insulation', 'اختبر الكابل: كونتينيوتي وعزل', 'Isolated, disconnected at both ends. Continuity of each core, insulation between cores and to the shield.', 'معزول ومفكوك من الطرفين. كونتينيوتي كل سلك، وعزل بين الأسلاك والشيلد.',
    [['ok', 'Good', 'سليم'], ['bad', 'Open, short or low insulation', 'مفتوح أو ماس أو عزل واطي']], { cable: { bad: 0.85, ok: 0.15 }, emc: { ok: 0.8, bad: 0.2 } }, 'ok', 1.6);
  T(t, 'swap', 'Swap with a known good sensor', 'بدّل بسنسور سليم', 'Fit a known good sensor of the same type on the same cable and see if the fault follows.', 'ركّب سنسور سليم من نفس النوع على نفس الكابل وشوف العطل بيتبع ولا لأ.',
    [['fixed', 'The fault goes away', 'العطل راح'], ['same', 'The fault stays', 'العطل فاضل']], { dead: { fixed: 0.9, same: 0.1 }, drift: { fixed: 0.85, same: 0.15 }, dirty: { fixed: 0.5, same: 0.5 }, cable: { same: 0.9, fixed: 0.1 }, supply: { same: 0.9, fixed: 0.1 }, emc: { same: 0.9, fixed: 0.1 }, process: { same: 0.9, fixed: 0.1 } }, 'same', 1.8);

  /* ======================= transformer ======================= */
  t = K.type('trafo', A('Transformer or control transformer', 'ترانس أو ترانس كنترول'), [
    A('Check the primary and secondary fuses and the nameplate voltages first. Hum and heat are usually overload or core issues.', 'افحص فيوزات الابتدائي والثانوي وجهود اللوحة الأول. الهمهمة والسخونة غالبا أوفرلود أو مشكلة في القلب.'),
  ]);
  S(t, 'nosec', 'No output voltage', 'مفيش جهد خرج');
  S(t, 'lowsec', 'Output voltage low', 'جهد الخرج واطي');
  S(t, 'hot', 'Runs hot', 'سخن');
  S(t, 'hum', 'Loud hum or buzz', 'همهمة أو طنين عالي');
  S(t, 'fuse', 'Primary fuse or breaker blows', 'فيوز أو بريكر الابتدائي بيفصل');
  S(t, 'smell', 'Burnt smell', 'ريحة حريق');
  F(t, 'w_burnt', 'Winding insulation burnt or varnish bubbled', 'عزل الملف محروق أو الورنيش منفوخ', 'wind_all');
  F(t, 'term', 'Terminals or tap connections burnt', 'الأطراف أو توصيلات التاب محروقة', 'terminal');
  F(t, 'loose', 'Core laminations loose or bolts loose', 'شرائح القلب سايبة أو المسامير سايبة', null);
  F(t, 'oil', 'Oil leak or dark oil (oil-filled)', 'تسريب زيت أو زيت غامق (زيتي)', null);
  M(t, 'overload', 'Overloaded secondary', 'الثانوي محمل زيادة', 0.3, 'med', { hot: 0.8, lowsec: 0.6, fuse: 0.3, smell: 0.2 }, { w_burnt: 0.3 }, 'Reduce the load or fit a larger transformer. Inrush of contactor coils also counts: check the VA.', 'قلل الحمل أو ركّب ترانس أكبر. تيار بدء الكونتاكتورات محسوب كمان: افحص الـVA.', null, null);
  M(t, 'shortturn', 'Shorted turns or winding fault', 'لفات ماسة أو عطل في الملف', 0.2, 'high', { hot: 0.8, fuse: 0.7, smell: 0.7, lowsec: 0.5 }, { w_burnt: 0.9 }, 'Replace or rewind. Look for a downstream short as the cause.', 'غيّر أو أعد اللف. دوّر على ماس في الأحمال كسبب.', null, null);
  M(t, 'open', 'Open winding or blown protection', 'ملف مفتوح أو حماية محروقة', 0.2, 'med', { nosec: 0.9 }, { term: 0.4 }, 'Check the fuses first, then the winding resistances, then the terminals.', 'افحص الفيوزات الأول وبعدين مقاومة الملفات وبعدين الأطراف.', null, null);
  M(t, 'tap', 'Wrong tap or primary voltage', 'تاب غلط أو جهد ابتدائي غلط', 0.1, 'low', { lowsec: 0.8, hot: 0.3, hum: 0.4 }, {}, 'Compare the primary supply with the tap. Move the tap or fix the supply.', 'قارن جهد المصدر بالتاب. غيّر التاب أو صلّح المصدر.', null, null);
  M(t, 'looseterm', 'Loose connection or burnt terminal', 'توصيلة سايبة أو ترمينال محروق', 0.12, 'med', { lowsec: 0.4, hot: 0.4, nosec: 0.3 }, { term: 0.9 }, 'Re-terminate and torque.', 'وصّل من جديد واشد بالعزم.', null, null);
  M(t, 'core', 'Loose core or overexcitation', 'قلب سايب أو إثارة زيادة', 0.08, 'low', { hum: 0.9 }, { loose: 0.9 }, 'Tighten the core, check the supply for overvoltage or DC offset.', 'اشد القلب، وافحص المصدر لجهد زيادة أو DC.', null, null);
  T(t, 'pri', 'Measure primary voltage and tap', 'قيس الجهد الابتدائي والتاب', 'Live: measure the voltage on the primary terminals and compare with the tap used.', 'على كهرباء: قيس الجهد على الابتدائي وقارنه بالتاب المستخدم.',
    [['ok', 'Matches the tap', 'مطابق للتاب'], ['bad', 'Does not match', 'مش مطابق'], ['none', 'No primary voltage', 'مفيش جهد ابتدائي']], { tap: { bad: 0.9, ok: 0.1 }, open: { none: 0.2, ok: 0.8 } }, 'ok', 1.4, 'Live work, CAT III meter.', 'شغل على كهرباء، ميتر CAT III.');
  T(t, 'sec', 'Measure secondary no-load and loaded', 'قيس الثانوي بدون حمل وبحمل', 'Measure the secondary voltage with the load disconnected and then connected.', 'قيس جهد الثانوي والحمل مفكوك وبعدين موصل.',
    [['ok', 'Correct in both', 'صح في الحالتين'], ['sag', 'Correct unloaded, low loaded', 'صح بدون حمل وواطي بحمل'], ['none', 'Zero unloaded', 'صفر بدون حمل'], ['low', 'Low unloaded', 'واطي بدون حمل']], { overload: { sag: 0.7, ok: 0.2, low: 0.1 }, shortturn: { low: 0.5, sag: 0.3, none: 0.2 }, open: { none: 0.9, ok: 0.1 }, tap: { low: 0.8, ok: 0.1, sag: 0.1 }, looseterm: { sag: 0.4, none: 0.3, low: 0.2, ok: 0.1 } }, 'ok', 1.4);
  T(t, 'res', 'Winding resistance and continuity (isolated)', 'مقاومة الملفات وكونتينيوتي (معزول)', 'Isolated: measure primary and secondary resistances and compare with the data sheet or an identical unit.', 'معزول: قيس مقاومة الابتدائي والثانوي وقارن بالداتا شيت أو وحدة مماثلة.',
    [['ok', 'Plausible', 'منطقية'], ['open', 'Open', 'مفتوح'], ['low', 'Much lower than expected', 'أقل بكتير من المتوقع']], { open: { open: 0.85, ok: 0.1, low: 0.05 }, shortturn: { low: 0.5, ok: 0.45, open: 0.05 } }, 'ok', 1.5);
  T(t, 'meg', 'Megger primary to secondary and to earth', 'ميجر ابتدائي لثانوي وللأرضي', 'Isolated: 500 V between windings and from each to the core.', 'معزول: 500 فولت بين الملفات ومن كل ملف للقلب.',
    [['ok', 'Above 5 MΩ', 'فوق 5 ميجا'], ['bad', 'Low', 'واطي']], { shortturn: { bad: 0.4, ok: 0.6 } }, 'ok', 1.6);

  /* ======================= solenoid valve / actuator ======================= */
  t = K.type('solenoid', A('Solenoid valve or actuator', 'سولينويد فالف أو أكتشويتور'), [
    A('Check three things in order: voltage at the coil, the coil resistance, and the mechanical side (dirt, pressure, wrong port).', 'افحص تلاتة بالترتيب: الجهد عند الكويل، مقاومة الكويل، والجانب الميكانيكي (أوساخ، ضغط، بورت غلط).'),
    A('A coil that burns repeatedly is usually from overvoltage, a jammed plunger or constant heat. Fix the cause.', 'كويل بيحترق باستمرار غالبا من جهد زيادة أو بلنجر معلق أو حرارة دايمة. صلّح السبب.'),
  ]);
  S(t, 'noact', 'Does not move', 'مش بيتحرك');
  S(t, 'stuckopen', 'Stays open or leaks through', 'فاضل مفتوح أو بيسرّب');
  S(t, 'slow', 'Slow or weak action', 'حركة بطيئة أو ضعيفة');
  S(t, 'hot', 'Coil hot or burnt', 'الكويل سخن أو محروق');
  S(t, 'hum', 'Hums or buzzes (AC coil)', 'بيطنّ (كويل AC)');
  S(t, 'trip', 'Fuse or output trips', 'فيوز أو مخرج بيفصل');
  S(t, 'leak', 'Leaks externally', 'بيسرّب من برة');
  F(t, 'coil_burnt', 'Coil burnt, discoloured or melted', 'الكويل محروق أو متغير اللون أو دايب', 'coil');
  F(t, 'dirt', 'Dirt, scale or debris inside the valve', 'أوساخ أو رواسب أو شوائب جوه الفالف', null);
  F(t, 'seal', 'Seal swollen, hard or torn', 'الجوان منتفخ أو ناشف أو متقطع', null);
  F(t, 'plunger', 'Plunger scored, rusty or stuck', 'البلنجر مخدوش أو صدي أو معلق', null);
  F(t, 'wet', 'Water in the coil housing or connector', 'مياه في غلاف الكويل أو الكونكتور', 'corrosion');
  F(t, 'press', 'Operating pressure outside the valve range', 'ضغط التشغيل خارج رينج الفالف', null);
  M(t, 'coil', 'Coil burnt or open', 'كويل محروق أو مقطوع', 0.3, 'low', { noact: 0.9, hot: 0.7, trip: 0.3 }, { coil_burnt: 0.9, wet: 0.4 }, 'Replace the coil (same voltage, AC / DC, and size). Find why: overvoltage, constant ON, stuck plunger.', 'غيّر الكويل (نفس الجهد، AC/DC، والمقاس). اعرف ليه: جهد زيادة، on دايما، بلنجر معلق.', null, null);
  M(t, 'dirt', 'Debris or scale blocking the valve', 'شوائب أو رواسب معطلة الفالف', 0.2, 'low', { stuckopen: 0.7, slow: 0.6, noact: 0.3, hum: 0.4, hot: 0.3 }, { dirt: 0.9, plunger: 0.5 }, 'Clean or replace the valve, fit a strainer upstream.', 'نضّف أو غيّر الفالف، وركّب سترينر قبله.', 'Fit a strainer and flush the line.', 'ركّب سترينر ونضّف الخط.');
  M(t, 'seal', 'Worn seal or diaphragm', 'جوان أو دايافرام مستهلك', 0.18, 'low', { stuckopen: 0.6, leak: 0.9 }, { seal: 0.9 }, 'Replace the seal kit and check the media compatibility.', 'غيّر طقم الجوانات وافحص توافقها مع المائع.', null, null);
  M(t, 'volt', 'Low voltage at the coil', 'جهد واطي عند الكويل', 0.12, 'low', { noact: 0.5, slow: 0.7, hum: 0.5 }, {}, 'Measure at the coil under operation. Fix the supply or the voltage drop.', 'قيس عند الكويل وهو شغال. صلّح المصدر أو هبوط الجهد.', null, null);
  M(t, 'pressure', 'Pressure outside the valve limits', 'ضغط خارج حدود الفالف', 0.08, 'low', { noact: 0.4, slow: 0.5, stuckopen: 0.3 }, { press: 0.9 }, 'Compare the line pressure with the valve data (min / max differential). Choose a servo-assisted or direct-acting valve accordingly.', 'قارن ضغط الخط ببيانات الفالف (أدنى / أقصى فرق). اختار فالف servo أو direct حسب الحالة.', null, null);
  M(t, 'wiring', 'Connector or wiring fault', 'عطل كونكتور أو توصيل', 0.08, 'low', { noact: 0.7, trip: 0.3 }, { wet: 0.7 }, 'Check the connector, seals, and the cable. Fix the leak into the connector.', 'افحص الكونكتور والجوانات والكابل. صلّح التسريب في الكونكتور.', null, null);
  M(t, 'plunger', 'Plunger stuck or damaged', 'بلنجر معلق أو تالف', 0.08, 'med', { noact: 0.7, hum: 0.8, hot: 0.6 }, { plunger: 0.9 }, 'Replace the valve body or the plunger assembly.', 'غيّر جسم الفالف أو طقم البلنجر.', null, null);
  T(t, 'v', 'Voltage at the coil when commanded on', 'جهد الكويل لما بتشغله', 'Measure at the coil terminals with the valve commanded on.', 'قيس عند أطراف الكويل والفالف مفعّل.',
    [['ok', 'Rated voltage', 'الجهد المقنن'], ['low', 'Low', 'واطي'], ['none', 'None', 'مفيش']], { volt: { low: 0.9, ok: 0.05, none: 0.05 }, wiring: { none: 0.85, low: 0.1, ok: 0.05 }, coil: { ok: 0.9, low: 0.05, none: 0.05 } }, 'ok', 1.4, 'Live work. Check the voltage rating before you measure.', 'شغل على كهرباء. اتأكد من تقدير الجهد قبل القياس.');
  T(t, 'r', 'Coil resistance (isolated)', 'مقاومة الكويل (معزول)', 'Disconnect the coil and measure the resistance. Compare with the data or with a new coil.', 'فك الكويل وقيس المقاومة. قارن بالبيانات أو بكويل جديد.',
    [['ok', 'Plausible', 'منطقية'], ['open', 'Open', 'مفتوح'], ['low', 'Very low', 'واطي جدا']], { coil: { open: 0.6, low: 0.3, ok: 0.1 } }, 'ok', 1.4);
  T(t, 'click', 'Listen and feel for the plunger click with the coil energised', 'اسمع وحس طقة البلنجر والكويل متغذي', 'Energise and listen. Hold a screwdriver tip on the nut: it should be magnetised.', 'غذّي واسمع. حط مفك على الصامولة: المفروض تتمغنط.',
    [['click', 'Clear click / magnetised', 'طقة واضحة / ممغنط'], ['none', 'Nothing', 'مفيش'], ['hum', 'Hums but does not move', 'بيطنّ ومش بيتحرك']], { coil: { none: 0.85, click: 0.1, hum: 0.05 }, plunger: { hum: 0.6, none: 0.3, click: 0.1 }, dirt: { click: 0.4, hum: 0.4, none: 0.2 }, volt: { hum: 0.4, none: 0.3, click: 0.3 }, seal: { click: 0.9, none: 0.05, hum: 0.05 } }, 'click', 1);
  T(t, 'press', 'Check the line pressure and flow direction', 'افحص ضغط الخط واتجاه التدفق', 'Read the gauge. Check the arrow on the body against the flow direction.', 'اقرا المانومتر. قارن السهم على الجسم باتجاه التدفق.',
    [['ok', 'Within the valve range', 'في رينج الفالف'], ['bad', 'Out of range or reversed', 'خارج الرينج أو معكوس']], { pressure: { bad: 0.9, ok: 0.1 } }, 'ok', 1);
  T(t, 'manual', 'Operate the manual override and inspect the internals', 'شغّل الأوفرايد اليدوي وافحص الداخل', 'Pressure off and locked out. Use the manual override, then dismantle and inspect the plunger, spring and seal.', 'الضغط مفصول ولوتو. استخدم الأوفرايد اليدوي، وبعدين فك وافحص البلنجر والزنبرك والجوان.',
    [['ok', 'Clean and moves freely', 'نضيف وبيتحرك بحرية'], ['dirty', 'Dirty or scored', 'وسخ أو مخدوش'], ['seal', 'Seal damaged', 'الجوان تالف']], { dirt: { dirty: 0.85, ok: 0.1, seal: 0.05 }, plunger: { dirty: 0.7, ok: 0.2, seal: 0.1 }, seal: { seal: 0.9, ok: 0.05, dirty: 0.05 } }, 'ok', 2.2, 'Release the pressure and lock out before opening.', 'فرّغ الضغط واعمل لوتو قبل الفتح.');

  /* ======================= heater ======================= */
  t = K.type('heater', A('Heater or heating element', 'سخان أو عنصر تسخين'), [
    A('Heaters fail open. Measure resistance of each element, then the insulation to earth.', 'السخانات بتفصل مفتوحة. قيس مقاومة كل عنصر وبعدين العزل للأرضي.'),
    A('Compare the resistance with V squared over P from the nameplate.', 'قارن المقاومة بقيمة V تربيع على P من اللوحة.'),
  ]);
  S(t, 'cold', 'No heat', 'مفيش تسخين');
  S(t, 'weak', 'Weak heat', 'تسخين ضعيف');
  S(t, 'trip', 'Breaker or RCD trips', 'البريكر أو الـRCD بيفصل');
  S(t, 'overheat', 'Overheats or cycles on the limit', 'بيسخن زيادة أو بيفصل على الليمت');
  S(t, 'smell', 'Burnt smell', 'ريحة حريق');
  F(t, 'el_burnt', 'Element broken, blistered or glowing patches', 'عنصر مكسور أو منتفخ أو بقع مضيئة', 'burnt');
  F(t, 'term', 'Terminals burnt or loose', 'الأطراف محروقة أو سايبة', 'terminal');
  F(t, 'scale', 'Scale or deposits on the element', 'رواسب أو قشرة على العنصر', null);
  F(t, 'wet', 'Moisture in the terminal box or insulation', 'رطوبة في علبة الأطراف أو العزل', 'corrosion');
  F(t, 'tstat', 'Thermostat or limit stuck or burnt', 'الثرموستات أو الليمت معلق أو محروق', 'burnt');
  M(t, 'open', 'Element open', 'عنصر مفتوح', 0.3, 'low', { cold: 0.9, weak: 0.4 }, { el_burnt: 0.9 }, 'Replace the element. Look for scale, dry running or hot spots as the cause.', 'غيّر العنصر. دوّر على رواسب أو تشغيل جاف أو بقع ساخنة كسبب.', null, null);
  M(t, 'earth', 'Insulation leakage to earth', 'تسريب عزل للأرضي', 0.18, 'high', { trip: 0.9 }, { wet: 0.8 }, 'Dry and megger. If it stays low replace the element (MgO insulation absorbs moisture).', 'جفف وعمل ميجر. لو فضل واطي غيّر العنصر (عزل MgO بيمتص الرطوبة).', null, null);
  M(t, 'term', 'Loose or burnt terminal', 'ترمينال سايب أو محروق', 0.15, 'med', { weak: 0.5, cold: 0.4, smell: 0.6 }, { term: 0.9 }, 'Re-terminate with proper lugs rated for the temperature, torque to spec.', 'وصّل من جديد بأطراف مقننة للحرارة واشد بالعزم.', null, null);
  M(t, 'stat', 'Thermostat or limit fault', 'عطل ثرموستات أو ليمت', 0.15, 'med', { cold: 0.5, overheat: 0.8 }, { tstat: 0.9 }, 'Replace the thermostat and the limit device. Test its setpoint.', 'غيّر الثرموستات والليمت. اختبر السيت بوينت.', null, null);
  M(t, 'scale', 'Scaled element (poor heat transfer)', 'عنصر عليه رواسب (نقل حرارة ضعيف)', 0.1, 'low', { weak: 0.5, overheat: 0.7 }, { scale: 0.9 }, 'Descale or replace, treat the water.', 'أزل الرواسب أو غيّر، وعالج المياه.', null, null);
  M(t, 'phase', 'Missing phase or blown fuse', 'فاز مفقودة أو فيوز محروق', 0.12, 'low', { weak: 0.7, cold: 0.3 }, {}, 'Check the supply to each element group.', 'افحص التغذية لكل مجموعة عناصر.', null, null);
  T(t, 'r', 'Resistance of each element', 'مقاومة كل عنصر', 'Isolated: measure each element. Expected R = V squared / P.', 'معزول: قيس كل عنصر. المقاومة المتوقعة = V تربيع / P.',
    [['ok', 'Within 10 % of expected', 'في حدود 10% من المتوقع'], ['open', 'Open', 'مفتوح'], ['high', 'Much higher', 'أعلى بكتير']], { open: { open: 0.95, ok: 0.03, high: 0.02 }, scale: { ok: 0.8, high: 0.2 }, phase: { ok: 0.85, open: 0.15 }, term: { ok: 0.7, high: 0.2, open: 0.1 } }, 'ok', 1.4);
  T(t, 'meg', 'Megger element to earth', 'ميجر العنصر للأرضي', 'Isolated, 500 V. Hot or damp elements read lower; dry them out first.', 'معزول، 500 فولت. العناصر السخنة أو الرطبة بتقرا أقل؛ جففها الأول.',
    [['ok', 'Above 1 MΩ', 'فوق 1 ميجا'], ['bad', 'Low', 'واطي']], { earth: { bad: 0.9, ok: 0.1 } }, 'ok', 1.5);
  T(t, 'amp', 'Clamp the heater current', 'قيس تيار السخان بالكلامب', 'Clamp each phase when it should be heating. Compare with the nameplate.', 'كلامب على كل فاز والمفروض بيسخن. قارن باللوحة.',
    [['ok', 'Normal', 'طبيعي'], ['low', 'Low or zero on a phase', 'قليل أو صفر على فاز'], ['zero', 'Zero on all', 'صفر على الكل']], { open: { low: 0.5, zero: 0.3, ok: 0.2 }, phase: { low: 0.6, ok: 0.3, zero: 0.1 }, stat: { zero: 0.5, ok: 0.5 }, term: { low: 0.5, ok: 0.3, zero: 0.2 } }, 'ok', 1.6);
  T(t, 'stat', 'Test the thermostat / limit continuity', 'اختبر كونتينيوتي الثرموستات / الليمت', 'Isolated: check continuity at room temperature and observe the action when heated or reset.', 'معزول: افحص الكونتينيوتي على حرارة الغرفة وراقب التصرف عند التسخين أو الريسيت.',
    [['ok', 'Closed and operates', 'مقفول وبيشتغل'], ['bad', 'Open, stuck or wrong setpoint', 'مفتوح أو معلق أو سيت بوينت غلط']], { stat: { bad: 0.9, ok: 0.1 } }, 'ok', 1.3);

  /* ======================= HMI / display ======================= */
  t = K.type('hmi', A('HMI, display or operator panel', 'HMI أو شاشة أو لوحة تحكم'), [
    A('Check the 24 V at its terminals before you blame the screen. Most dead HMIs are a supply or a connection problem.', 'قيس الـ24 فولت على أطرافها قبل ما تلوم الشاشة. أغلب الـHMI الميتة مشكلة مصدر أو توصيل.'),
  ]);
  S(t, 'dark', 'Dark screen', 'شاشة سودا');
  S(t, 'boot', 'Stuck at boot or restarts', 'واقفة على البوت أو بتعيد التشغيل');
  S(t, 'touch', 'Touch does not respond or is offset', 'اللمس مش شغال أو مزاح');
  S(t, 'comm', 'Lost communication with the PLC', 'فقد الاتصال مع الـPLC');
  S(t, 'lines', 'Lines, flicker or dim picture', 'خطوط أو رعشة أو صورة خافتة');
  S(t, 'freeze', 'Freezes or slow', 'بتهنج أو بطيئة');
  F(t, 'cracked', 'Screen cracked or pressure marks', 'الشاشة مكسورة أو علامات ضغط', null);
  F(t, 'ingress', 'Moisture or dust behind the gasket', 'رطوبة أو تراب ورا الجوان', 'corrosion');
  F(t, 'cap', 'Bulged capacitors on the supply board', 'مكثفات منتفخة على كارت الباور', 'capbulge');
  F(t, 'comport', 'Communication connector or cable damaged', 'كونكتور أو كابل الاتصال تالف', 'terminal');
  F(t, 'back', 'Backlight dim or one half dark', 'الإضاءة الخلفية خافتة أو نص الشاشة غامق', null);
  M(t, 'supply', 'Low or missing 24 V', '24 فولت واطي أو غايب', 0.28, 'low', { dark: 0.7, boot: 0.8, freeze: 0.3 }, {}, 'Measure at the HMI terminals under load. Fix the supply or the voltage drop.', 'قيس عند أطراف الـHMI تحت حمل. صلّح المصدر أو هبوط الجهد.', null, null);
  M(t, 'backlight', 'Backlight failed', 'الإضاءة الخلفية باظت', 0.15, 'low', { dark: 0.5, lines: 0.8 }, { back: 0.9 }, 'Replace the backlight or the panel, or the unit. The image may still be visible with a torch.', 'غيّر الإضاءة أو الشاشة أو الوحدة. الصورة ممكن تتشاف بكشاف.', null, null);
  M(t, 'touch', 'Touch layer damaged or needs calibration', 'طبقة اللمس تالفة أو محتاجة معايرة', 0.15, 'low', { touch: 0.95 }, { cracked: 0.7 }, 'Calibrate the touch. Replace the touch layer or the unit if it is damaged.', 'عاير اللمس. غيّر طبقة اللمس أو الوحدة لو تالفة.', null, null);
  M(t, 'comm', 'Communication cable or settings', 'كابل أو إعدادات الاتصال', 0.2, 'low', { comm: 0.95 }, { comport: 0.9 }, 'Check the cable, IP / baud / node address, and the PLC port.', 'افحص الكابل وعنوان IP أو baud أو node والبورت في الـPLC.', null, null);
  M(t, 'cards', 'Failing electrolytics on the supply board', 'مكثفات الباور على الكارت بتضعف', 0.1, 'low', { boot: 0.7, dark: 0.4, freeze: 0.3 }, { cap: 0.9 }, 'Replace the capacitors or the unit.', 'غيّر المكثفات أو الوحدة.', null, null);
  M(t, 'software', 'Corrupt project or full memory', 'مشروع تالف أو ذاكرة ممتلئة', 0.1, 'low', { boot: 0.5, freeze: 0.9 }, {}, 'Reload the project from backup, clear the logs, update the firmware.', 'أعد تحميل المشروع من النسخة الاحتياطية، امسح اللوجز، وحدّث الفيرموير.', null, null);
  M(t, 'ingress', 'Moisture or dust ingress', 'تسرب رطوبة أو تراب', 0.1, 'med', { dark: 0.4, lines: 0.5, touch: 0.5, boot: 0.3 }, { ingress: 0.9 }, 'Dry and clean the board, replace the gasket, protect with the correct IP rating.', 'جفف ونضّف الكارت، غيّر الجوان، واستخدم IP مناسب.', null, null);
  T(t, 'supply', 'Voltage at the HMI terminals', 'جهد عند أطراف الـHMI', 'Measure the 24 V at the HMI power terminals while it tries to start.', 'قيس الـ24 فولت عند أطراف باور الـHMI وهي بتحاول تشتغل.',
    [['ok', 'Correct and steady', 'صح وثابت'], ['bad', 'Low, absent or dropping', 'واطي أو غايب أو بينزل']], { supply: { bad: 0.9, ok: 0.1 }, cards: { ok: 0.7, bad: 0.3 } }, 'ok', 1.2);
  T(t, 'torch', 'Shine a torch at an angle on the dark screen', 'سلّط كشاف بزاوية على الشاشة السودا', 'If a faint picture is visible, the screen is running and the backlight has failed.', 'لو ظهرت صورة خافتة يبقى الشاشة شغالة والإضاءة هي اللي باظت.',
    [['image', 'Faint image visible', 'صورة خافتة ظاهرة'], ['none', 'Nothing', 'مفيش']], { backlight: { image: 0.9, none: 0.1 }, supply: { none: 0.95, image: 0.05 } }, 'none', 0.8);
  T(t, 'com', 'Check the cable and the communication settings', 'افحص الكابل وإعدادات الاتصال', 'Ping or check the link LEDs; compare IP / baud / address in the HMI and the PLC.', 'اعمل ping أو بص على ليدات الرابط؛ قارن IP أو baud أو العنوان في الـHMI والـPLC.',
    [['ok', 'Link up and settings match', 'الرابط شغال والإعدادات متطابقة'], ['bad', 'No link or mismatch', 'مفيش رابط أو عدم تطابق']], { comm: { bad: 0.9, ok: 0.1 } }, 'ok', 1.2);
  T(t, 'touch', 'Run the touch calibration or the touch test screen', 'شغّل معايرة اللمس أو شاشة اختبار اللمس', 'Open the touch test or calibrate. Check if the offset is uniform.', 'افتح اختبار اللمس أو المعايرة. شوف الإزاحة منتظمة ولا لأ.',
    [['ok', 'Responds correctly', 'بيستجيب صح'], ['bad', 'Dead zones or offset', 'مناطق ميتة أو إزاحة']], { touch: { bad: 0.9, ok: 0.1 } }, 'ok', 1);

  /* ======================= UPS and batteries ======================= */
  t = K.type('ups', A('UPS or battery system', 'UPS أو بطاريات'), [
    A('Batteries are the first suspect: age over 3 to 5 years, heat, or swollen cases.', 'البطاريات أول مشتبه: العمر فوق 3 لـ5 سنين، الحرارة، أو الأجسام المنتفخة.'),
    A('Do not open sealed batteries. Wear eye protection and insulate your tools.', 'متفتحش البطاريات المقفولة. استخدم نظارة وأدوات معزولة.'),
  ]);
  S(t, 'nobackup', 'Short or no backup time', 'وقت الاحتياطي قصير أو مفيش');
  S(t, 'alarm', 'Battery alarm or replace-battery light', 'إنذار بطارية أو ليد استبدال');
  S(t, 'noturn', 'Does not turn on', 'مش بيشتغل');
  S(t, 'bypass', 'Stuck on bypass', 'واقف على البايباس');
  S(t, 'hot', 'Hot or smells', 'سخن أو ريحة');
  S(t, 'fan', 'Fan noise or fan alarm', 'صوت مروحة أو إنذار مروحة');
  S(t, 'overload', 'Overload alarm', 'إنذار أوفرلود');
  F(t, 'swollen', 'Battery case swollen or leaking', 'جسم البطارية منتفخ أو بيسرّب', 'capbulge');
  F(t, 'age', 'Batteries older than 4 years', 'البطاريات أقدم من 4 سنين', null);
  F(t, 'term', 'Battery terminals corroded or loose', 'أطراف البطارية متآكلة أو سايبة', 'corrosion');
  F(t, 'dust', 'Dust or blocked vents', 'تراب أو فتحات مسدودة', 'fan');
  F(t, 'hotroom', 'Room hotter than 30 °C', 'الغرفة أسخن من 30 درجة', null);
  F(t, 'loadhigh', 'Load close to or above the rating', 'الحمل قريب من التقدير أو فوقه', null);
  M(t, 'batt', 'Batteries at end of life', 'البطاريات انتهى عمرها', 0.4, 'low', { nobackup: 0.9, alarm: 0.8, noturn: 0.3 }, { age: 0.8, swollen: 0.8 }, 'Replace the whole string at once with the same type. Log the date.', 'غيّر السلسلة كلها مرة واحدة بنفس النوع. سجل التاريخ.', 'Replace on a schedule and keep the room cool (every 10 K above 25 °C halves battery life).', 'غيّر بجدول وخلي الغرفة باردة (كل 10 درجات فوق 25 بتنصّف عمر البطارية).');
  M(t, 'term', 'Loose or corroded battery connection', 'توصيلة بطارية سايبة أو متآكلة', 0.1, 'med', { nobackup: 0.5, alarm: 0.5, hot: 0.5 }, { term: 0.9 }, 'Clean, re-terminate and torque the links.', 'نضّف ووصّل من جديد واشد الوصلات بالعزم.', null, null);
  M(t, 'overload', 'Overloaded UPS', 'UPS محمل زيادة', 0.15, 'low', { overload: 0.9, bypass: 0.7, hot: 0.4, nobackup: 0.4 }, { loadhigh: 0.9 }, 'Reduce the load, spread it, or upsize the UPS. Allow 20 % headroom.', 'قلل الحمل أو وزعه أو كبّر الـUPS. سيب 20% هامش.', null, null);
  M(t, 'cooling', 'Poor cooling', 'تبريد ضعيف', 0.12, 'low', { fan: 0.9, hot: 0.8, bypass: 0.3 }, { dust: 0.9, hotroom: 0.8 }, 'Clean the vents, replace the fan, improve the room cooling.', 'نضّف الفتحات، غيّر المروحة، وحسّن تبريد الغرفة.', null, null);
  M(t, 'charger', 'Charger fault', 'عطل الشاحن', 0.1, 'med', { alarm: 0.6, nobackup: 0.6 }, {}, 'Measure the float voltage; compare with the battery spec; service the charger or replace the unit.', 'قيس جهد الفلوت؛ قارنه بمواصفات البطارية؛ صلّح الشاحن أو غيّر الوحدة.', null, null);
  M(t, 'power', 'Inverter or power-stage failure', 'عطل الإنفرتر أو مرحلة القدرة', 0.08, 'high', { noturn: 0.6, bypass: 0.7, hot: 0.4 }, {}, 'Call service or replace the unit; check input fuses and DC fuses first.', 'اتصل بالصيانة أو غيّر الوحدة؛ افحص فيوزات الدخل والـDC الأول.', null, null);
  T(t, 'bv', 'Battery string voltage on charge and under load', 'جهد سلسلة البطاريات تحت الشحن وتحت حمل', 'On float, measure the string and each block. Then discharge briefly and watch the voltage.', 'على الفلوت قيس السلسلة وكل بلوك. وبعدين فرّغ لحظات وراقب الجهد.',
    [['ok', 'Blocks equal and steady', 'البلوكات متساوية وثابتة'], ['weak', 'One or more blocks low', 'بلوك أو أكتر واطي'], ['drop', 'Collapses under load', 'بينهار تحت حمل']], { batt: { weak: 0.5, drop: 0.4, ok: 0.1 }, term: { ok: 0.4, drop: 0.3, weak: 0.3 }, charger: { weak: 0.5, ok: 0.4, drop: 0.1 }, overload: { ok: 0.6, drop: 0.3, weak: 0.1 } }, 'ok', 1.6, 'Wear eye protection; do not short the terminals.', 'نظارة وقاية؛ متعملش شورت على الأطراف.');
  T(t, 'self', 'Run the UPS self-test or a load test', 'شغّل اختبار ذاتي أو اختبار حمل', 'Use the UPS self-test or a controlled load test and note the runtime.', 'استخدم الاختبار الذاتي للـUPS أو اختبار حمل منضبط وسجل زمن التشغيل.',
    [['pass', 'Passes with good runtime', 'ناجح بزمن كويس'], ['fail', 'Fails or short runtime', 'فاشل أو زمن قصير']], { batt: { fail: 0.9, pass: 0.1 }, term: { fail: 0.6, pass: 0.4 }, overload: { fail: 0.4, pass: 0.6 } }, 'pass', 1.4);
  T(t, 'load', 'Read the load percentage and compare to the rating', 'اقرا نسبة الحمل وقارنها بالتقدير', 'Read the load on the UPS display and clamp the output.', 'اقرا الحمل من شاشة الـUPS وقيس الخرج بالكلامب.',
    [['ok', 'Under 80 %', 'أقل من 80%'], ['high', 'Over 80 %', 'فوق 80%']], { overload: { high: 0.9, ok: 0.1 } }, 'ok', 0.8);
  T(t, 'thermal', 'Thermal check of the battery connections and vents', 'فحص حراري لوصلات البطارية والفتحات', 'Thermal camera or IR on the links, fuses and vents.', 'كاميرا حرارية أو IR على الوصلات والفيوزات والفتحات.',
    [['ok', 'No hot spot', 'مفيش نقطة سخنة'], ['hot', 'A hot link or vent area', 'وصلة أو فتحة سخنة']], { term: { hot: 0.85, ok: 0.15 }, cooling: { hot: 0.6, ok: 0.4 } }, 'ok', 1.3);
})(typeof window !== 'undefined' ? window : globalThis);
