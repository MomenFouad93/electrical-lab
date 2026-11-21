/* Knowledge base A: motors, drives, contactors and relays, protection devices, cables and terminals */
(function (g) {
  const EL = g.EL, K = EL.kb, S = K.sym, F = K.find, M = K.mode, T = K.test, A = K.A;

  /* ======================= 3-phase motor ======================= */
  let t = K.type('motor', A('3-phase motor', 'موتور 3 فاز'), [
    A('Isolate and lock out first. Photograph the nameplate, the terminal box and every winding group before you move anything.', 'اعزل واعمل لوتو الأول. صوّر اللوحة والترمينال وكل مجموعات الملفات قبل ما تحرك أي حاجة.'),
    A('Read the burn pattern: all three phases evenly dark means overload or cooling. One phase dark means single phasing. One coil dark means a turn short.', 'اقرا شكل الحرق: التلات فازات غامقة بالتساوي يبقى أوفرلود أو تبريد. فاز واحدة غامقة يبقى فقد فاز. كويل واحد غامق يبقى لفات ماسة.'),
    A('Do not just rewind. Find why it failed, or the new winding fails the same way.', 'متعملش إعادة لف وخلاص. اعرف ليه باظ، وإلا الملف الجديد هيبوظ بنفس الطريقة.'),
  ]);
  S(t, 'no_hum', 'Does not start, hums', 'مش بيدور وبيهم');
  S(t, 'no_silent', 'Does not start, silent', 'مش بيدور وساكت');
  S(t, 'trips', 'Overload relay or breaker trips', 'الثيرمال أو البريكر بيفصل');
  S(t, 'hot', 'Runs too hot', 'سخن زيادة');
  S(t, 'noise', 'Noise or vibration', 'صوت أو رعشة');
  S(t, 'slow', 'Slow or weak', 'بطيء أو ضعيف');
  S(t, 'shock', 'Earth leakage trip or tingle on the frame', 'RCD بيفصل أو كهرباء على الهيكل');
  S(t, 'smell', 'Burnt smell or smoke', 'ريحة حريق أو دخان');
  F(t, 'w_all', 'All windings evenly dark or brown', 'كل الملفات غامقة أو بني بالتساوي', 'wind_all');
  F(t, 'w_one', 'One phase group burnt, the others look fine', 'مجموعة فاز واحدة محروقة والباقي سليم', 'wind_one');
  F(t, 'w_local', 'One or two coils burnt, the rest fine', 'كويل أو اتنين محروقين والباقي سليم', 'wind_local');
  F(t, 'w_between', 'Burn between two phase groups at the end turns', 'حرق بين مجموعتين عند أطراف اللفات', 'wind_between');
  F(t, 'wet', 'Water marks, rust or corrosion inside', 'علامات مياه أو صدا أو تآكل جوه', 'corrosion');
  F(t, 'br_blue', 'Bearing blue or discoloured, grease dry or leaking', 'الرولمان أزرق أو متغير اللون والشحم ناشف أو بيسرّب', 'bearing');
  F(t, 'rub', 'Rub marks on the rotor or stator bore', 'علامات احتكاك على الروتور أو الاستاتور', 'rub');
  F(t, 'bars', 'Cracked or broken rotor bars, melted aluminium', 'قضبان روتور مكسورة أو ألومنيوم دايب', 'rotorbars');
  F(t, 'tb_burnt', 'Terminal box burnt or connections discoloured', 'علبة الأطراف محروقة أو التوصيلات متغيرة اللون', 'terminal');
  F(t, 'tb_wrong', 'Links or connection do not match the supply', 'الكبارى أو التوصيل مش مطابق للمصدر', 'links');
  F(t, 'fan', 'Fan broken, cowl blocked or vents full of dust', 'المروحة مكسورة أو الغطا مسدود أو الفتحات مليانة تراب', 'fan');
  F(t, 'br_play', 'Shaft play or rough bearing by hand', 'الشافت فيه خلوص أو الرولمان خشن باليد', null);
  F(t, 'vfd', 'The motor is fed by a drive (VFD)', 'الموتور متغذي من انفرتر', null);
  F(t, 'flute', 'Fluting (frosted lines) in the bearing race', 'خطوط مثل التجميد (fluting) في مجرى الرولمان', 'bearing');
  M(t, 'overload', 'Mechanical overload or jammed load', 'حمل ميكانيكي زيادة أو معلق', 0.18, 'high', { trips: 0.8, hot: 0.7, no_hum: 0.4, slow: 0.3, smell: 0.3 }, { w_all: 0.7, br_blue: 0.15 },
    'Remove the mechanical cause (jam, tight belt, bad coupling, wrong pump duty). Check the running current against the nameplate and set the overload correctly. Rewind or replace if the winding is burnt.', 'شيل السبب الميكانيكي (تعليق، سير مشدود، كوبلنج، تشغيل مضخة غلط). قارن تيار التشغيل باللوحة واضبط الثيرمال. إعادة لف أو تغيير لو الملف اتحرق.',
    'Fit a correct overload relay. Trend the motor current.', 'ركّب ثيرمال مناسب. تابع تيار الموتور.');
  M(t, 'single', 'Single phasing (a lost phase)', 'فقد فاز (single phasing)', 0.14, 'high', { no_hum: 0.8, trips: 0.6, hot: 0.6, noise: 0.5, smell: 0.4 }, { w_one: 0.6, tb_burnt: 0.25 },
    'Find the open phase: blown fuse, burnt contactor pole, loose terminal or broken cable. Fix it before you touch the motor. Rewind only if the winding is burnt.', 'دوّر على الفاز المفتوحة: فيوز محروق، قطب كونتاكتور محروق، توصيلة سايبة أو كابل مقطوع. صلّحها قبل ما تلمس الموتور. إعادة لف لو الملف اتحرق.',
    'Add a phase-loss relay. Check contactor poles and terminal torque during PM.', 'ضيف ريلاي فقد فاز. افحص أقطاب الكونتاكتور وعزم الشد في الصيانة الدورية.');
  M(t, 'turn', 'Turn-to-turn short in a coil', 'لفات ماسة في كويل', 0.1, 'high', { hot: 0.6, trips: 0.4, noise: 0.4, smell: 0.5 }, { w_local: 0.8, w_all: 0.1 },
    'Rewind the stator. A local burn usually follows insulation ageing, a voltage spike (drive) or moisture. Check what stressed it.', 'إعادة لف الاستاتور. الحرق الموضعي غالبا من شيخوخة العزل أو سبايك جهد (انفرتر) أو رطوبة. شوف إيه اللي ضغط عليه.',
    'Use inverter-duty motors with a dv/dt or sine filter on long cable runs.', 'استخدم موتور inverter-duty مع فلتر dv/dt أو sine لو الكابل طويل.');
  M(t, 'pp_short', 'Phase-to-phase short at the end turns', 'ماس بين فازين عند أطراف اللفات', 0.06, 'high', { trips: 0.8, smell: 0.6, no_silent: 0.2, shock: 0.1 }, { w_between: 0.85 },
    'Rewind the stator and fit new phase separators. Check the supply for spikes.', 'إعادة لف الاستاتور وتركيب عوازل بين الفازات. افحص المصدر لسبايك.', null, null);
  M(t, 'earth', 'Insulation breakdown to earth (moisture or ageing)', 'انهيار العزل للأرضي (رطوبة أو شيخوخة)', 0.1, 'high', { shock: 0.85, trips: 0.3, smell: 0.2 }, { wet: 0.6, w_local: 0.2 },
    'Dry the windings and re-test. If the megger stays low, varnish or rewind. Check seals, drain holes and heaters on idle motors.', 'جفف الملفات وأعد القياس. لو الميجر لسه واطي ورنش أو إعادة لف. افحص الجوانات وفتحات الصرف وسخانات الموتور الواقف.',
    'Fit space heaters on idle motors. Megger on a schedule.', 'ركّب سخانات على الموتورات الواقفة. ميجر دوري.');
  M(t, 'bearing', 'Bearing failure', 'رولمان بايظ', 0.15, 'med', { noise: 0.9, hot: 0.4, slow: 0.2, no_hum: 0.2 }, { br_blue: 0.6, br_play: 0.7, rub: 0.4 },
    'Replace both bearings. Check shaft and housing fit, alignment, belt tension and the grease type and quantity.', 'غيّر الرولمانين. افحص مقاس الشافت والبيت، الاستقامة، شد السير ونوع وكمية الشحم.',
    'Grease to the schedule (not more). Align the coupling.', 'شحّم حسب الجدول (مش زيادة). اظبط الاستقامة.');
  M(t, 'supply', 'Low or unbalanced supply voltage', 'جهد المصدر واطي أو مش متزن', 0.06, 'med', { hot: 0.6, slow: 0.4, trips: 0.4, noise: 0.2 }, { w_all: 0.3 },
    'Find the cause upstream: loose joints, undersized cable, transformer tap, unbalanced single-phase loads.', 'دوّر على السبب قبل الموتور: وصلات سايبة، كابل صغير، تاب الترانس، أحمال أحادية مش متزنة.', null, null);
  M(t, 'wrongconn', 'Wrong star/delta connection for the supply', 'توصيل نجمة/دلتا غلط بالنسبة للمصدر', 0.04, 'high', { hot: 0.6, smell: 0.4, trips: 0.6, slow: 0.3 }, { tb_wrong: 0.85, w_all: 0.5 },
    'Connect to the nameplate: a 230/400 V motor runs in star on 400 V. Rewind if the winding was over-volted.', 'وصّل حسب اللوحة: موتور 230/400 فولت بيشتغل نجمة على 400. إعادة لف لو الملف اتعرض لجهد زيادة.', null, null);
  M(t, 'rotor', 'Broken rotor bars', 'قضبان روتور مكسورة', 0.04, 'med', { slow: 0.6, noise: 0.5, trips: 0.3, no_hum: 0.2 }, { bars: 0.8 },
    'Replace or re-cast the rotor. Look at how often it starts and at the load inertia.', 'غيّر أو أعد صب الروتور. بص على عدد مرات التشغيل وعزم القصور الذاتي للحمل.', null, null);
  M(t, 'vfdstress', 'Drive stress: bearing currents or voltage spikes', 'ضغط الانفرتر: تيارات رولمان أو سبايك جهد', 0.06, 'med', { noise: 0.5, hot: 0.2 }, { vfd: 0.9, flute: 0.8, br_blue: 0.3, w_local: 0.35 },
    'Fit a shaft grounding ring or insulated bearing, use shielded cable with 360 degree glands, add a dv/dt filter, lower the carrier frequency.', 'ركّب shaft grounding ring أو رولمان معزول، كابل مشيلد بجلاند 360 درجة، فلتر dv/dt، وقلل الكارير فريكونسي.', null, null);
  M(t, 'cooling', 'Poor cooling', 'تبريد ضعيف', 0.08, 'med', { hot: 0.9, trips: 0.3 }, { fan: 0.85, w_all: 0.5 },
    'Clean the fins and the fan cover, replace a broken fan, check the ambient temperature and the duty.', 'نضّف الزعانف وغطا المروحة، غيّر المروحة المكسورة، افحص درجة الحرارة المحيطة ونوع التشغيل.', null, null);
  M(t, 'looseterm', 'Loose or burnt terminal connection', 'توصيلة سايبة أو محروقة في الترمينال', 0.06, 'med', { no_hum: 0.3, hot: 0.3, trips: 0.3 }, { tb_burnt: 0.9 },
    'Cut back to clean copper, fit new lugs, torque to spec. Replace the terminal block if it is carbonised.', 'اقطع لحد نحاس نضيف، ركّب أطراف جديدة، اشد بالعزم المطلوب. غيّر الترمينال لو اتكربن.', null, null);
  T(t, 'shaft', 'Turn the shaft by hand', 'لف الشافت بإيدك', 'Power off and locked out, load disconnected. Turn the shaft slowly. Feel for smooth rotation, grinding or a lock.', 'الكهرباء مفصولة ولوتو، والحمل مفكوك. لف الشافت ببطء. حس بنعومة الدوران أو احتكاك أو تعشيق.',
    [['smooth', 'Smooth and free', 'ناعم وحر'], ['rough', 'Rough or grinding', 'خشن أو بيحتك'], ['locked', 'Stiff or locked', 'تقيل أو مقفول']],
    { bearing: { rough: 0.8, locked: 0.15, smooth: 0.05 }, rotor: { smooth: 0.6, rough: 0.3, locked: 0.1 }, vfdstress: { smooth: 0.5, rough: 0.5 }, overload: { smooth: 0.8, rough: 0.1, locked: 0.1 } }, 'smooth', 1);
  T(t, 'meg', 'Megger each winding to earth', 'ميجر كل ملف مع الأرضي', 'Isolated, leads lifted at the terminal box. 500 V DC for 1 minute from U, V and W to the frame. Healthy is above 5 MΩ at room temperature, never below 1 MΩ.', 'معزول والأسلاك مفكوكة من علبة الأطراف. 500 فولت DC لمدة دقيقة من U وV وW للهيكل. السليم فوق 5 ميجا أوم، وأبدا مش أقل من 1.',
    [['good', 'Above 5 MΩ', 'فوق 5 ميجا'], ['low', '0.5 to 5 MΩ', 'من 0.5 لـ5 ميجا'], ['bad', 'Below 0.5 MΩ', 'أقل من 0.5 ميجا']],
    { earth: { bad: 0.6, low: 0.35, good: 0.05 }, pp_short: { good: 0.5, low: 0.3, bad: 0.2 }, turn: { good: 0.6, low: 0.3, bad: 0.1 }, overload: { good: 0.5, low: 0.4, bad: 0.1 } }, 'good', 1.8,
    'Megger only on a dead, isolated winding. Disconnect any drive first.', 'ميجر على ملف ميت ومعزول بس. فك الانفرتر الأول.');
  T(t, 'res', 'Winding resistance U-V, V-W, W-U', 'مقاومة الملفات U-V وV-W وW-U', 'Isolated, links removed. Use a milli-ohm meter if you can. Compare the three readings.', 'معزول والكبارى مشالة. استخدم ميلي أوم ميتر لو متاح. قارن التلات قراءات.',
    [['bal', 'Balanced (within 3 %)', 'متزن (في حدود 3%)'], ['open', 'One reads open (OL)', 'واحدة OL'], ['unb', 'Unbalanced, one lower', 'مش متزن، واحدة أقل']],
    { turn: { unb: 0.7, bal: 0.25, open: 0.05 }, pp_short: { unb: 0.8, bal: 0.1, open: 0.1 }, single: { bal: 0.55, open: 0.35, unb: 0.1 }, looseterm: { bal: 0.5, unb: 0.4, open: 0.1 } }, 'bal', 1.6);
  T(t, 'volt', 'Supply voltage at the motor terminals', 'جهد المصدر عند أطراف الموتور', 'Live work. Measure L1-L2, L2-L3 and L3-L1 at the motor terminals with the contactor closed, trying to start.', 'شغل على كهرباء. قيس L1-L2 وL2-L3 وL3-L1 عند أطراف الموتور والكونتاكتور مقفول وبتحاول تشغّل.',
    [['ok', 'Balanced and correct', 'متزن وصح'], ['missing', 'One phase missing', 'فاز ناقصة'], ['unb', 'Unbalanced or low', 'مش متزن أو واطي']],
    { single: { missing: 0.85, unb: 0.1, ok: 0.05 }, supply: { unb: 0.9, ok: 0.05, missing: 0.05 }, looseterm: { ok: 0.4, unb: 0.5, missing: 0.1 } }, 'ok', 2.2,
    'Live work: CAT III/IV meter, insulated tools, site permit.', 'شغل على كهرباء: ميتر CAT III/IV، أدوات معزولة، تصريح الموقع.');
  T(t, 'amp', 'Clamp the three phase currents', 'قيس تيار الفازات التلاتة بالكلامب', 'Clamp each phase while running (or during the start if it will not run). Compare with the nameplate current.', 'كلامب على كل فاز وهو شغال (أو وقت التشغيل لو مش بيدور). قارن بتيار اللوحة.',
    [['norm', 'Balanced and normal', 'متزن وطبيعي'], ['high', 'Balanced but high', 'متزن بس عالي'], ['unb', 'Unbalanced', 'مش متزن'], ['zero', 'One phase zero', 'فاز بصفر']],
    { overload: { high: 0.85, norm: 0.1, unb: 0.05 }, single: { zero: 0.7, unb: 0.25, high: 0.05 }, turn: { unb: 0.55, high: 0.35, norm: 0.1 }, wrongconn: { high: 0.7, norm: 0.2, unb: 0.1 }, supply: { unb: 0.5, high: 0.4, norm: 0.1 }, bearing: { norm: 0.5, high: 0.45 }, cooling: { norm: 0.7, high: 0.3 }, rotor: { norm: 0.4, high: 0.4, unb: 0.2 } }, 'norm', 1.8);
  T(t, 'plate', 'Compare nameplate with the supply and the links', 'قارن اللوحة بالمصدر والكبارى', 'Read the nameplate voltage and connection (230/400 V Y/D). Compare with the supply and with how the links are fitted.', 'اقرا جهد وتوصيل اللوحة (230/400 فولت Y/D). قارنه بالمصدر وبوضع الكبارى.',
    [['match', 'Matches', 'مطابق'], ['mismatch', 'Does not match', 'مش مطابق']], { wrongconn: { mismatch: 0.9, match: 0.1 } }, 'match', 1);
  T(t, 'sound', 'Listen with the load decoupled', 'اسمع والحمل مفكوك', 'Run briefly with the load removed (only if the motor is not burnt). Listen at the bearings and the frame.', 'شغّله لحظات والحمل مفكوك (لو الموتور مش محروق). اسمع عند الرولمان والهيكل.',
    [['smooth', 'Smooth hum', 'همهمة ناعمة'], ['grind', 'Rumble or growl at the bearing', 'صوت خشن عند الرولمان'], ['beat', 'Pulsating hum, speed hunting', 'همهمة نابضة، السرعة بتتأرجح']],
    { bearing: { grind: 0.85, smooth: 0.1, beat: 0.05 }, rotor: { beat: 0.6, grind: 0.1, smooth: 0.3 }, single: { beat: 0.3, smooth: 0.3, grind: 0.4 }, vfdstress: { grind: 0.4, smooth: 0.4, beat: 0.2 } }, 'smooth', 1.4);
  T(t, 'cool', 'Check fan, cover and vents', 'افحص المروحة والغطا والفتحات', 'Remove the fan cover. Look at the fan, the fins and the air path. Check the ambient temperature.', 'شيل غطا المروحة. بص على المروحة والزعانف ومسار الهوا. افحص الحرارة المحيطة.',
    [['clear', 'Clean and intact', 'نضيف وسليم'], ['blocked', 'Dusty, blocked or broken', 'تراب أو مسدود أو مكسور']], { cooling: { blocked: 0.9, clear: 0.1 } }, 'clear', 1);

  /* ======================= VFD ======================= */
  t = K.type('vfd', A('Variable frequency drive (VFD)', 'انفرتر (VFD)'), [
    A('Isolate, lock out and wait for the DC bus to discharge (usually 5 to 10 minutes). Verify the DC bus is below 50 V before you open anything.', 'اعزل واعمل لوتو واستنى الـDC bus يفضى (غالبا 5 لـ10 دقايق). اتأكد إن الـDC bus تحت 50 فولت قبل ما تفتح أي حاجة.'),
    A('Write down the fault code and the fault history before you reset. The code points at the area, not always at the part.', 'اكتب كود العطل وتاريخ الأعطال قبل الريسيت. الكود بيشاور على المنطقة مش دايما على القطعة.'),
    A('Never megger through a drive. Disconnect the motor cable at the drive output first.', 'متعملش ميجر وانت متوصل بالانفرتر. فك كابل الموتور من خرج الانفرتر الأول.'),
  ]);
  S(t, 'dead', 'Display dead / no power-up', 'الشاشة ميتة / مبتشتغلش');
  S(t, 'ocf', 'Overcurrent fault (OC / short circuit)', 'عطل أوفركرنت (OC / ماس)');
  S(t, 'ovf', 'Overvoltage fault on the DC bus (OV)', 'عطل جهد DC bus عالي (OV)');
  S(t, 'uvf', 'Undervoltage fault (UV)', 'عطل جهد واطي (UV)');
  S(t, 'otf', 'Overtemperature fault (OH)', 'عطل حرارة (OH)');
  S(t, 'nomotor', 'Runs but motor does not turn', 'الانفرتر شغال والموتور مش بيدور');
  S(t, 'noref', 'Does not respond to start or speed reference', 'مبيستجيبش لأمر التشغيل أو السرعة');
  S(t, 'hunt', 'Speed unstable or noisy output', 'السرعة مش ثابتة أو خرج فيه ضوضاء');
  S(t, 'trip_up', 'Upstream breaker or fuse blows when powered', 'البريكر أو الفيوز قبله بيفصل عند التشغيل');
  F(t, 'f_caps', 'DC bus capacitors bulged or leaking', 'مكثفات الـDC bus منتفخة أو بتسرّب', 'capbulge');
  F(t, 'f_igbt', 'IGBT / power module cracked or burst', 'موديول الباور IGBT مكسور أو منفجر', 'igbt');
  F(t, 'f_rect', 'Input rectifier burnt or blackened', 'دايود الدخل (الريكتفاير) محروق', 'burnt');
  F(t, 'f_dust', 'Heat sink and fans full of dust or fan stopped', 'الهيت سينك والمراوح مليانة تراب أو مروحة واقفة', 'fan');
  F(t, 'f_term', 'Power terminals discoloured or loose', 'أطراف القدرة متغيرة اللون أو سايبة', 'terminal');
  F(t, 'f_wet', 'Moisture, condensation or corrosion on boards', 'رطوبة أو تكثف أو تآكل على الكروت', 'corrosion');
  F(t, 'f_pre', 'Pre-charge resistor or relay burnt', 'مقاومة أو ريلاي الشحن المسبق محروق', 'burnt');
  F(t, 'f_cable', 'Long motor cable (over 50 m) or unshielded', 'كابل موتور طويل (فوق 50 متر) أو من غير شيلد', null);
  F(t, 'f_brake', 'Fast stops or high inertia, no braking resistor', 'إيقاف سريع أو قصور ذاتي كبير من غير مقاومة فرامل', null);
  F(t, 'f_ctrl', 'Control board burnt or smelling', 'كارت الكنترول محروق أو ريحته', 'burnt');
  M(t, 'bus_caps', 'Worn DC bus capacitors', 'مكثفات DC bus ضعيفة', 0.14, 'med', { dead: 0.2, uvf: 0.4, hunt: 0.3, ovf: 0.2, ocf: 0.15 }, { f_caps: 0.85 },
    'Replace the capacitor bank (or the drive on small sizes). Check the ambient temperature and the fan.', 'غيّر بنك المكثفات (أو الانفرتر نفسه في الأحجام الصغيرة). افحص الحرارة المحيطة والمروحة.', 'Replace caps and fans at the vendor interval. Keep the cabinet cool.', 'غيّر المكثفات والمراوح بالمواعيد. خلي الدولاب بارد.');
  M(t, 'igbt', 'Failed IGBT / output stage', 'مرحلة الخرج IGBT بايظة', 0.14, 'high', { ocf: 0.85, trip_up: 0.4, nomotor: 0.3 }, { f_igbt: 0.8 },
    'Replace the power module and the gate driver, check the motor and cable for a short first, or the new module dies too.', 'غيّر الموديول والجيت درايفر، وافحص الموتور والكابل من الماس الأول وإلا الجديد هيموت.', 'Keep the carrier frequency sensible, check cable length and motor insulation.', 'خلي الكارير فريكونسي معقول، وافحص طول الكابل وعزل الموتور.');
  M(t, 'rect', 'Input rectifier failed', 'ريكتفاير الدخل بايظ', 0.1, 'high', { dead: 0.5, trip_up: 0.7, uvf: 0.3 }, { f_rect: 0.8 },
    'Replace the rectifier module. Check for surges on the supply and the input fuses.', 'غيّر موديول الريكتفاير. افحص السبايك على المصدر وفيوزات الدخل.', 'Fit a line reactor or surge protection on a dirty supply.', 'ركّب line reactor أو حماية سبايك لو المصدر مش نضيف.');
  M(t, 'precharge', 'Pre-charge circuit failed', 'دايرة الشحن المسبق بايظة', 0.07, 'med', { dead: 0.4, uvf: 0.5, trip_up: 0.2 }, { f_pre: 0.85 },
    'Replace the pre-charge resistor or relay. Find out what made it overheat (repeated power cycling, shorted bus).', 'غيّر مقاومة أو ريلاي الشحن المسبق. اعرف ليه سخنت (تشغيل وفصل متكرر، ماس في الـbus).', null, null);
  M(t, 'cooling', 'Overheating from blocked cooling or dead fan', 'سخونة من تبريد مسدود أو مروحة ميتة', 0.14, 'med', { otf: 0.9 }, { f_dust: 0.85 },
    'Clean the heat sink, replace the fan, derate or move the drive to a cooler spot.', 'نضّف الهيت سينك، غيّر المروحة، قلل الحمل أو انقل الانفرتر لمكان أبرد.', 'Clean on a schedule and filter cabinet air.', 'نضّف بجدول وفلتر هوا الدولاب.');
  M(t, 'motorcable', 'Fault in the motor or the motor cable', 'عطل في الموتور أو كابل الموتور', 0.16, 'high', { ocf: 0.7, nomotor: 0.4 }, { f_cable: 0.4 },
    'Disconnect the cable at the drive and megger the cable and motor separately. Repair the short or the earth fault.', 'فك الكابل من الانفرتر واعمل ميجر للكابل والموتور كل واحد لوحده. صلّح الماس أو تسريب الأرضي.', null, null);
  M(t, 'overvolt_regen', 'Regenerative overvoltage (too-fast ramp, no brake resistor)', 'جهد زيادة من الدوران العكسي (ramp سريع بدون مقاومة فرامل)', 0.1, 'med', { ovf: 0.9 }, { f_brake: 0.8 },
    'Lengthen the deceleration ramp, enable the DC bus controller, or fit a braking resistor and chopper.', 'طوّل زمن النزول، فعّل الـbus controller أو ركّب مقاومة فرامل مع chopper.', null, null);
  M(t, 'supplyuv', 'Low or dipping supply', 'مصدر واطي أو بينزل', 0.08, 'med', { uvf: 0.8, dead: 0.2 }, {}, 'Check the incoming voltage, joints, upstream breaker and transformer. Fit a line reactor if the supply is weak.', 'افحص جهد الدخل والوصلات والبريكر والترانس. ركّب line reactor لو المصدر ضعيف.', null, null);
  M(t, 'params', 'Wrong parameters or control wiring', 'بارامترات أو توصيل كنترول غلط', 0.18, 'low', { noref: 0.8, nomotor: 0.3, hunt: 0.4 }, {},
    'Check motor nameplate data, run source (terminal / keypad / bus), reference source and the DI wiring (PNP/NPN). Reset to defaults and set up again if unsure.', 'افحص بيانات لوحة الموتور، مصدر التشغيل (ترمينال/كيباد/بس) ومصدر السرعة وتوصيل الـDI (PNP/NPN). رجّع الافتراضي واعمل ضبط من الأول لو مش متأكد.', null, null);
  M(t, 'ctrlboard', 'Control board failed', 'كارت الكنترول بايظ', 0.06, 'med', { dead: 0.5, noref: 0.4, hunt: 0.3 }, { f_ctrl: 0.8, f_wet: 0.4 },
    'Replace the control board (check the firmware and parameter backup). Look for moisture and dust as the cause.', 'غيّر كارت الكنترول (انتبه للفيرموير ونسخة البارامترات). دوّر على الرطوبة والتراب كسبب.', null, null);
  M(t, 'emc', 'Noise (EMC): unshielded cable, bad earth', 'تشويش (EMC): كابل من غير شيلد وأرضي ضعيف', 0.07, 'low', { hunt: 0.8, noref: 0.4 }, { f_cable: 0.7 },
    'Separate power and signal cables, use shielded cable earthed 360 degrees, fix the earthing, add output filters if needed.', 'افصل كابلات القدرة عن الإشارة، استخدم كابل مشيلد متأرض 360 درجة، اظبط الأرضي، وضيف فلتر خرج لو لزم.', null, null);
  T(t, 'bus', 'DC bus voltage with the power off', 'جهد الـDC bus والكهرباء فاصلة', 'After the discharge time, measure DC+ to DC- at the drive terminals. Then switch on and measure it again: about 1.35 x the line voltage (540 V on 400 V).', 'بعد وقت التفريغ، قيس DC+ لـDC- عند أطراف الانفرتر. وبعدين شغّله وقيسه تاني: حوالي 1.35 ضرب جهد الخط (540 فولت على 400).',
    [['norm', 'About 1.35 x line voltage when on', 'حوالي 1.35 ضرب جهد الخط وهو شغال'], ['low', 'Too low or sagging', 'واطي أو بينزل'], ['zero', 'Zero with the supply on', 'صفر والكهرباء موصلة']],
    { rect: { zero: 0.6, low: 0.3, norm: 0.1 }, precharge: { zero: 0.6, low: 0.3, norm: 0.1 }, bus_caps: { low: 0.55, norm: 0.4, zero: 0.05 }, supplyuv: { low: 0.8, norm: 0.15, zero: 0.05 } }, 'norm', 2.4,
    'Wait for discharge and verify below 50 V before touching. The DC bus can hold lethal voltage.', 'استنى التفريغ واتأكد تحت 50 فولت قبل اللمس. الـDC bus ممكن يحتفظ بجهد قاتل.');
  T(t, 'in', 'Input voltage on R, S, T', 'جهد الدخل على R وS وT', 'Measure the three line-to-line voltages at the drive input terminals with the breaker on.', 'قيس التلات جهود بين الفازات عند أطراف دخل الانفرتر والبريكر موصل.',
    [['ok', 'Balanced and correct', 'متزن وصح'], ['bad', 'Missing, low or unbalanced', 'ناقص أو واطي أو مش متزن']], { supplyuv: { bad: 0.9, ok: 0.1 }, rect: { ok: 0.8, bad: 0.2 } }, 'ok', 2,
    'Live work. CAT III/IV meter and PPE.', 'شغل على كهرباء. ميتر CAT III/IV وأدوات وقاية.');
  T(t, 'diode', 'Diode test on the input bridge and the output', 'اختبار دايود على الريكتفاير والخرج', 'Power off, bus discharged. Diode-test R/S/T to DC+ and DC-, and U/V/W to DC+ and DC-. Each junction should read 0.3 to 0.5 V one way and OL the other.', 'الكهرباء فاصلة والـbus فاضي. دايود تست من R/S/T لـDC+ وDC-، ومن U/V/W لـDC+ وDC-. كل وصلة تقرا 0.3 لـ0.5 فولت في اتجاه وOL في التاني.',
    [['ok', 'All junctions normal', 'كل الوصلات طبيعية'], ['rect', 'Input junction shorted or open', 'وصلة دخل ماسة أو مفتوحة'], ['out', 'Output junction shorted', 'وصلة خرج ماسة']],
    { rect: { rect: 0.85, ok: 0.1, out: 0.05 }, igbt: { out: 0.85, ok: 0.1, rect: 0.05 } }, 'ok', 2, 'Disconnect the motor cable first.', 'فك كابل الموتور الأول.');
  T(t, 'mot', 'Megger and resistance of the motor cable and the motor (drive disconnected)', 'ميجر ومقاومة كابل الموتور والموتور (الانفرتر مفكوك)', 'Disconnect U, V, W at the drive. Megger the cable and the motor to earth (500 V). Check the three winding resistances.', 'فك U وV وW من الانفرتر. ميجر للكابل والموتور مع الأرضي (500 فولت). قيس مقاومة الملفات التلاتة.',
    [['ok', 'Insulation above 5 MΩ and balanced windings', 'العزل فوق 5 ميجا والملفات متزنة'], ['bad', 'Low insulation or short between phases', 'عزل واطي أو ماس بين فازات']], { motorcable: { bad: 0.9, ok: 0.1 }, igbt: { bad: 0.1, ok: 0.9 } }, 'ok', 2.2,
    'Never megger with the drive connected.', 'متعملش ميجر والانفرتر متوصل.');
  T(t, 'fan', 'Fan and heat sink', 'المروحة والهيت سينك', 'Switch on and watch the fans. Look at the heat sink fins and air path. Feel (power off) for dust build-up.', 'شغّل وبص على المراوح. بص على زعانف الهيت سينك ومسار الهوا. حس بتراكم التراب (والكهرباء فاصلة).',
    [['ok', 'Fans turn, clean', 'المراوح بتدور ونضيفة'], ['bad', 'Fan dead or fins clogged', 'مروحة ميتة أو زعانف مسدودة']], { cooling: { bad: 0.9, ok: 0.1 } }, 'ok', 1);
  T(t, 'fault', 'Read the fault code and the fault history', 'اقرا كود العطل وتاريخ الأعطال', 'Read the display or the keypad history. Note the code, the time and the speed or current at the trip.', 'اقرا الشاشة أو تاريخ الكيباد. اكتب الكود والوقت والسرعة أو التيار وقت الفصل.',
    [['accel', 'Trips during acceleration', 'بيفصل أثناء التسارع'], ['decel', 'Trips during deceleration', 'بيفصل أثناء النزول'], ['run', 'Trips at steady speed', 'بيفصل على سرعة ثابتة'], ['start', 'Trips at start or at power-up', 'بيفصل عند التشغيل أو أول ما يتوصل']],
    { overvolt_regen: { decel: 0.85, run: 0.1, accel: 0.03, start: 0.02 }, motorcable: { start: 0.45, accel: 0.4, run: 0.15 }, igbt: { start: 0.55, accel: 0.35, run: 0.1 }, bus_caps: { accel: 0.35, run: 0.35, start: 0.2, decel: 0.1 }, cooling: { run: 0.8, accel: 0.15, decel: 0.03, start: 0.02 } }, 'run', 1);
  T(t, 'ctl', 'Check the control terminals and parameters', 'افحص أطراف الكنترول والبارامترات', 'Check the run command source, reference source, DI wiring, and the motor data entered. Use the drive monitor to see the DI states.', 'افحص مصدر أمر التشغيل ومصدر السرعة وتوصيل الـDI وبيانات الموتور المدخلة. استخدم المونيتور اللي في الانفرتر عشان تشوف حالة الـDI.',
    [['ok', 'All correct', 'كله صح'], ['bad', 'Something wrong or missing', 'فيه حاجة غلط أو ناقصة']], { params: { bad: 0.85, ok: 0.15 }, emc: { ok: 0.7, bad: 0.3 } }, 'ok', 1.2);

  /* ======================= contactor / relay ======================= */
  t = K.type('contactor', A('Contactor or relay', 'كونتاكتور أو ريلاي'), [
    A('Isolate first. Photograph the contacts, the coil and the terminals. Compare all three poles.', 'اعزل الأول. صوّر الكونتاكتات والكويل والأطراف. قارن الأقطاب التلاتة.'),
    A('Pitted, blue or black contacts tell the story: sparking from low voltage, overload, or arc from a bounce.', 'الكونتاكتات المتآكلة أو الزرقا أو السودا بتحكي الحكاية: شرارة من جهد واطي أو أوفرلود أو قوس من ارتداد.'),
  ]);
  S(t, 'nopull', 'Does not pull in', 'مش بيشد');
  S(t, 'chatter', 'Chatters or buzzes', 'بيرعش أو بيطنّ');
  S(t, 'nodrop', 'Does not drop out', 'مش بينزل');
  S(t, 'hotc', 'Hot contacts or terminals', 'كونتاكتات أو أطراف سخنة');
  S(t, 'welded', 'Welded contacts', 'كونتاكتات لازقة');
  S(t, 'coilhot', 'Coil runs very hot or burnt', 'الكويل سخن جدا أو محروق');
  S(t, 'short_life', 'Short contact life', 'عمر الكونتاكتات قصير');
  F(t, 'c_pit', 'Contacts pitted, blue or black', 'كونتاكتات متآكلة أو زرقا أو سودا', 'contacts');
  F(t, 'c_weld', 'Contacts fused together', 'كونتاكتات ملتحمة', 'contacts');
  F(t, 'c_coil', 'Coil discoloured, melted or smells', 'الكويل متغير اللون أو دايب أو ريحته', 'coil');
  F(t, 'c_dust', 'Dust, oil or debris in the armature gap', 'تراب أو زيت أو أوساخ في فجوة الحديدة', null);
  F(t, 'c_term', 'Terminal screws loose or burnt insulation', 'مسامير الأطراف سايبة أو العزل محروق', 'terminal');
  F(t, 'c_broken', 'Cracked housing or broken spring', 'الجسم مكسور أو الزنبرك مقطوع', null);
  F(t, 'c_dc', 'Coil voltage on the label does not match the control supply', 'جهد الكويل المكتوب مش بيطابق مصدر الكنترول', null);
  F(t, 'c_inrush', 'Switches a motor or capacitor bank frequently', 'بيشغّل موتور أو بنك مكثفات كتير', null);
  M(t, 'worncont', 'Worn contacts (normal ageing)', 'كونتاكتات اتآكلت (عمر طبيعي)', 0.2, 'low', { hotc: 0.7, short_life: 0.3 }, { c_pit: 0.8, c_term: 0.1 },
    'Replace the contact kit or the contactor. Do not file the contacts. Check the utilisation category (AC-3 / AC-4).', 'غيّر طقم الكونتاكتات أو الكونتاكتور. متبردش الكونتاكتات. افحص فئة الاستخدام (AC-3 / AC-4).', 'Size for AC-3 and mechanical life; use AC-4 for jogging and plugging.', 'اختار حسب AC-3 والعمر الميكانيكي؛ استخدم AC-4 للتقطيع والعكس السريع.');
  M(t, 'overcur', 'Switching currents above the rating (inrush, jogging, overload)', 'قطع تيارات فوق التقدير (inrush، تقطيع، أوفرلود)', 0.14, 'med', { welded: 0.5, short_life: 0.6, hotc: 0.3 }, { c_weld: 0.6, c_pit: 0.5, c_inrush: 0.7 },
    'Use a larger contactor or the right utilisation category, add soft start or a pre-charge for capacitor loads.', 'استخدم كونتاكتور أكبر أو فئة استخدام مناسبة، وضيف soft start أو شحن مسبق لأحمال المكثفات.', null, null);
  M(t, 'lowvolt', 'Low coil voltage (weak control supply)', 'جهد كويل واطي (مصدر الكنترول ضعيف)', 0.12, 'med', { nopull: 0.5, chatter: 0.8, short_life: 0.4, welded: 0.3 }, {},
    'Measure the coil voltage while it pulls in. It must stay above 85 % of nominal. Fix the supply, the control cable drop or the PSU rating.', 'قيس جهد الكويل وهو بيشد. لازم يفضل فوق 85% من المقنن. صلّح المصدر أو هبوط الجهد في الكابل أو قدرة الباور.', null, null);
  M(t, 'coilfail', 'Coil burnt or open', 'كويل محروق أو مقطوع', 0.14, 'med', { nopull: 0.9, coilhot: 0.6 }, { c_coil: 0.8, c_dc: 0.4 },
    'Replace the coil. Find out why: overvoltage, wrong coil voltage, armature not closing (a dirty gap makes the coil overheat).', 'غيّر الكويل. اعرف ليه: جهد زيادة، جهد كويل غلط، الحديدة مش بتقفل (الفجوة الوسخة بتسخّن الكويل).', null, null);
  M(t, 'dirtygap', 'Dirt or rust in the armature gap', 'تراب أو صدا في فجوة الحديدة', 0.12, 'low', { chatter: 0.8, coilhot: 0.5, nopull: 0.2 }, { c_dust: 0.85 },
    'Clean the pole faces, check the shading ring and the return spring. Replace if the face is worn.', 'نضّف أسطح الحديدة، افحص حلقة الظل والزنبرك. غيّر لو السطح مآكل.', null, null);
  M(t, 'welded', 'Welded contacts from a short or long overload', 'كونتاكتات لحمت من ماس أو أوفرلود طويل', 0.1, 'high', { welded: 0.95, nodrop: 0.6 }, { c_weld: 0.9 },
    'Replace the contactor. Find the cause: a short that was not cleared in time, motor stall, or wrong breaker curve.', 'غيّر الكونتاكتور. اعرف السبب: ماس مااتفصلش بسرعة، أو موتور اتعلق، أو منحنى بريكر غلط.', null, null);
  M(t, 'looseterm', 'Loose terminal causing a hot connection', 'توصيلة سايبة بتسخن', 0.1, 'med', { hotc: 0.9 }, { c_term: 0.9 },
    'Cut back, re-terminate and torque to spec. Mark the screws and re-check at the next PM.', 'اقطع لحد نضيف، وصّل من جديد واشد بالعزم. علّم المسامير وراجع في الصيانة الجاية.', null, null);
  M(t, 'mech', 'Mechanical jam or broken spring', 'تعليق ميكانيكي أو زنبرك مقطوع', 0.06, 'low', { nodrop: 0.7, nopull: 0.3, chatter: 0.2 }, { c_broken: 0.85 }, 'Replace the contactor.', 'غيّر الكونتاكتور.', null, null);
  M(t, 'sneak', 'Backfeed or sneak circuit holding it in', 'تغذية عكسية أو دايرة تانية ماسكاه', 0.05, 'low', { nodrop: 0.7 }, {}, 'Check the control circuit for a sealed-in path, a leaking solid state output or a wrong wiring.', 'افحص دايرة الكنترول لمسار حجز أو خرج SSR بيسرّب أو توصيل غلط.', null, null);
  T(t, 'coilv', 'Coil voltage while it should pull in', 'جهد الكويل وهو المفروض يشد', 'Live. Measure at the coil terminals A1-A2 when the start command is given.', 'على كهرباء. قيس عند أطراف الكويل A1-A2 لما تدي أمر التشغيل.',
    [['full', 'Full voltage, but it does not pull in', 'جهد كامل ومش بيشد'], ['low', 'Low voltage (below 85 %)', 'جهد واطي (أقل من 85%)'], ['none', 'No voltage', 'مفيش جهد']],
    { coilfail: { full: 0.9, low: 0.05, none: 0.05 }, dirtygap: { full: 0.8, low: 0.15, none: 0.05 }, mech: { full: 0.8, low: 0.1, none: 0.1 }, lowvolt: { low: 0.9, full: 0.05, none: 0.05 } }, 'full', 2, 'Live work, use a CAT III meter.', 'شغل على كهرباء، ميتر CAT III.');
  T(t, 'coilr', 'Coil resistance (power off)', 'مقاومة الكويل (والكهرباء فاصلة)', 'Isolated, one coil lead lifted. Measure A1-A2. Compare with a new coil of the same type.', 'معزول وطرف كويل مفكوك. قيس A1-A2. قارن بكويل جديد من نفس النوع.',
    [['ok', 'Normal value', 'قيمة طبيعية'], ['open', 'Open (OL)', 'مفتوح (OL)'], ['low', 'Very low (shorted turns)', 'واطي جدا (لفات ماسة)']],
    { coilfail: { open: 0.55, low: 0.35, ok: 0.1 } }, 'ok', 1.6);
  T(t, 'contr', 'Contact resistance / voltage drop across each pole', 'مقاومة الكونتاكت / هبوط الجهد على كل قطب', 'Close the contactor by hand (or energise) and measure the voltage drop across each pole under load, or the resistance with the power off.', 'اقفل الكونتاكتور بإيدك (أو شغّله) وقيس هبوط الجهد على كل قطب تحت حمل، أو المقاومة والكهرباء فاصلة.',
    [['ok', 'Low and equal on all poles', 'واطي ومتساوي على كل الأقطاب'], ['bad', 'High or different on one pole', 'عالي أو مختلف على قطب']], { worncont: { bad: 0.8, ok: 0.2 }, overcur: { bad: 0.6, ok: 0.4 }, looseterm: { bad: 0.5, ok: 0.5 }, welded: { bad: 0.4, ok: 0.6 } }, 'ok', 1.8);
  T(t, 'drop', 'Does it drop out when the coil is de-energised?', 'هل بينزل لما تفصل الكويل؟', 'Remove the coil voltage and watch the armature. Try the manual test button if it has one.', 'شيل جهد الكويل وبص على الحديدة. جرّب زرار الاختبار اليدوي لو فيه.',
    [['yes', 'Drops out normally', 'بينزل عادي'], ['no', 'Stays closed', 'فاضل مقفول']], { welded: { no: 0.9, yes: 0.1 }, mech: { no: 0.6, yes: 0.4 }, sneak: { no: 0.1, yes: 0.9 } }, 'yes', 1);

  /* ======================= breaker / fuse ======================= */
  t = K.type('breaker', A('Breaker, MCCB or fuse', 'بريكر أو MCCB أو فيوز'), [
    A('Do not reset a tripped breaker again and again. Find out whether it was an overload, a short circuit or an earth fault.', 'متعملش ريسيت للبريكر الفاصل مرة بعد مرة. اعرف كان أوفرلود ولا ماس ولا تسريب أرضي.'),
    A('The handle position and the trip indicator tell you the type of trip. Photograph them first.', 'وضع الهاندل ومؤشر الفصل بيقولوك نوع الفصل. صوّرهم الأول.'),
  ]);
  S(t, 'trips', 'Trips immediately on reset', 'بيفصل على طول عند الريسيت');
  S(t, 'trips_load', 'Trips after some time under load', 'بيفصل بعد فترة تحت حمل');
  S(t, 'nuis', 'Trips randomly (nuisance)', 'بيفصل عشوائي');
  S(t, 'noreset', 'Will not reset or close', 'مش بيعمل ريسيت أو مش بيقفل');
  S(t, 'hotb', 'Breaker or terminals hot', 'البريكر أو الأطراف سخنة');
  S(t, 'fuse', 'Fuse blows', 'الفيوز بيتحرق');
  F(t, 'b_burnt', 'Burnt terminals or melted housing', 'أطراف محروقة أو جسم دايب', 'terminal');
  F(t, 'b_black', 'Soot or black marks inside', 'سناج أو علامات سودا جوه', 'burnt');
  F(t, 'b_loose', 'Loose cable lugs or screws', 'أطراف الكابلات أو المسامير سايبة', 'terminal');
  F(t, 'b_dc', 'Breaker type or curve does not suit the load', 'نوع أو منحنى البريكر مش مناسب للحمل', null);
  F(t, 'b_old', 'Old breaker, many trips, or in a hot panel', 'بريكر قديم أو فصل كتير أو في لوحة سخنة', null);
  F(t, 'b_flag', 'Trip indicator shows short circuit (magnetic)', 'مؤشر الفصل بيوضح ماس (مغناطيسي)', null);
  M(t, 'short', 'Short circuit downstream', 'ماس في الأحمال', 0.22, 'high', { trips: 0.9, fuse: 0.7 }, { b_flag: 0.8, b_black: 0.4 },
    'Isolate and find the short with a megger / ohm test section by section. Do not reset until found.', 'اعزل ودوّر على الماس بالميجر أو الأوم قسم قسم. متعملش ريسيت قبل ما تلاقيه.', null, null);
  M(t, 'overload', 'Overload', 'أوفرلود', 0.22, 'med', { trips_load: 0.9, hotb: 0.3, fuse: 0.4 }, {}, 'Measure the real load current with a clamp. Compare with the breaker and the cable ratings. Reduce or split the load.', 'قيس تيار الحمل الحقيقي بالكلامب. قارنه بتقدير البريكر والكابل. قلل أو قسّم الحمل.', null, null);
  M(t, 'earth', 'Earth leakage (RCD / RCBO)', 'تسريب أرضي (RCD / RCBO)', 0.14, 'high', { trips: 0.5, nuis: 0.6 }, {}, 'Disconnect circuits one by one and re-test to find the leaking one. Megger each circuit from L+N to earth.', 'افصل الدواير واحدة واحدة وجرّب لحد ما تلاقي اللي بتسرب. ميجر لكل دايرة من L+N للأرضي.', null, null);
  M(t, 'loosebr', 'Loose connection overheating the breaker', 'توصيلة سايبة بتسخّن البريكر', 0.12, 'med', { hotb: 0.9, nuis: 0.4, trips_load: 0.3 }, { b_burnt: 0.8, b_loose: 0.8 }, 'Replace the breaker if the housing or terminals are damaged. Re-terminate and torque everything.', 'غيّر البريكر لو الجسم أو الأطراف اتضرروا. وصّل من جديد واشد كل حاجة بالعزم.', null, null);
  M(t, 'wrongsize', 'Wrong curve or rating for the load (inrush)', 'منحنى أو تقدير غلط للحمل (inrush)', 0.12, 'low', { trips: 0.5, nuis: 0.5 }, { b_dc: 0.85 }, 'Use curve C or D for motor and transformer inrush, or an MPCB for motors. Keep the cable protected.', 'استخدم منحنى C أو D لتيار بدء الموتور والترانس، أو MPCB للموتورات. وخلي الكابل محمي.', null, null);
  M(t, 'aged', 'Worn breaker (ageing, repeated trips)', 'بريكر مستهلك (عمر أو فصل متكرر)', 0.08, 'low', { nuis: 0.6, noreset: 0.4 }, { b_old: 0.8 }, 'Replace the breaker.', 'غيّر البريكر.', null, null);
  T(t, 'load', 'Measure the load current', 'قيس تيار الحمل', 'Clamp each phase / the line with the load running. Compare with the breaker rating.', 'كلامب على كل فاز / الخط والحمل شغال. قارن بتقدير البريكر.',
    [['low', 'Well below the rating', 'أقل بكتير من التقدير'], ['near', 'Near or above the rating', 'قريب أو فوق التقدير']], { overload: { near: 0.9, low: 0.1 }, loosebr: { low: 0.7, near: 0.3 }, aged: { low: 0.8, near: 0.2 } }, 'low', 1.6);
  T(t, 'iso', 'Megger the downstream circuit (breaker off)', 'ميجر على الدايرة بعد البريكر (البريكر off)', 'Breaker off and locked out. Megger L-N, L-PE and N-PE of the downstream circuit with the loads disconnected.', 'البريكر off ولوتو. ميجر L-N وL-PE وN-PE للدايرة بعد البريكر والأحمال مفكوكة.',
    [['ok', 'All above 1 MΩ', 'الكل فوق 1 ميجا'], ['short', 'Near zero between L and N', 'قرب الصفر بين L وN'], ['earth', 'Low to earth', 'واطي مع الأرضي']], { short: { short: 0.85, ok: 0.1, earth: 0.05 }, earth: { earth: 0.85, ok: 0.1, short: 0.05 } }, 'ok', 2);
  T(t, 'torque', 'Check lug tightness and thermal image', 'افحص شد الأطراف وصورة حرارية', 'Isolated: re-torque the terminals. Or use a thermal camera on load: a terminal more than 10 K hotter than its neighbours is a bad joint.', 'والكهرباء فاصلة: اشد الأطراف بالعزم. أو كاميرا حرارية تحت حمل: طرف أسخن من اللي جنبه بأكتر من 10 درجات يبقى وصلة وحشة.',
    [['ok', 'All tight, no hot spot', 'كله مشدود ومفيش نقطة سخنة'], ['bad', 'A loose or hot connection', 'وصلة سايبة أو سخنة']], { loosebr: { bad: 0.9, ok: 0.1 } }, 'ok', 1.4);
  T(t, 'type', 'Check the curve and rating against the load', 'قارن المنحنى والتقدير بالحمل', 'Read the breaker label (B, C, D, current). Compare with the load type and the cable ampacity.', 'اقرا لابل البريكر (B وC وD والتيار). قارنه بنوع الحمل وسعة الكابل.',
    [['ok', 'Suitable', 'مناسب'], ['bad', 'Too small or wrong curve', 'صغير أو منحنى غلط']], { wrongsize: { bad: 0.9, ok: 0.1 } }, 'ok', 1);

  /* ======================= cables, terminals, panel wiring ======================= */
  t = K.type('wiring', A('Cable, terminal or panel wiring', 'كابل أو ترمينال أو توصيلات لوحة'), [
    A('Heat is the symptom. Find the hot joint before the insulation fails. A thermal camera under load finds it in seconds.', 'السخونة هي العرض. اعرف الوصلة السخنة قبل ما العزل يفشل. كاميرا حرارية تحت حمل بتلاقيها في ثواني.'),
    A('Photograph the burn, then isolate and look at the conductor, the ferrule and the screw.', 'صوّر الحرق وبعدين اعزل وبص على الموصل والفيرول والمسمار.'),
  ]);
  S(t, 'hotw', 'Terminal or cable is hot', 'الترمينال أو الكابل سخن');
  S(t, 'burntw', 'Burnt smell or smoke', 'ريحة حريق أو دخان');
  S(t, 'intermit', 'Intermittent faults', 'أعطال متقطعة');
  S(t, 'drop', 'Voltage drop / equipment under-voltage', 'هبوط جهد / معدات جهدها واطي');
  S(t, 'trip_w', 'Breaker trips on a cable circuit', 'البريكر بيفصل على دايرة كابل');
  S(t, 'shock_w', 'Leakage or shocks', 'تسريب أو كهرباء على الهيكل');
  F(t, 'w_brown', 'Insulation brown, hard or melted near a terminal', 'العزل بني أو ناشف أو دايب جنب الترمينال', 'terminal');
  F(t, 'w_green', 'Green or white crust on copper', 'قشرة خضرا أو بيضا على النحاس', 'corrosion');
  F(t, 'w_strand', 'Cut or broken strands at the lug', 'خيوط مقطوعة عند الطرف', null);
  F(t, 'w_nolug', 'No ferrule, bare strands under the screw', 'من غير فيرول وخيوط عريانة تحت المسمار', null);
  F(t, 'w_thin', 'Cable is smaller than the circuit needs', 'الكابل أصغر من اللي الدايرة محتاجاه', null);
  F(t, 'w_crush', 'Insulation crushed, nicked or chafed', 'العزل مهروس أو مجروح أو محتك', null);
  F(t, 'w_rodent', 'Rodent damage or chemical attack', 'قرض فئران أو تأثير كيماويات', null);
  F(t, 'w_bundle', 'Many cables bundled in a hot duct', 'كابلات كتير مجمعة في مجرى سخن', null);
  M(t, 'looseconn', 'Loose connection', 'توصيلة سايبة', 0.3, 'high', { hotw: 0.9, intermit: 0.7, burntw: 0.5, drop: 0.3 }, { w_brown: 0.8, w_strand: 0.2 },
    'Cut back to clean copper, fit a proper ferrule or lug, torque to spec. Replace the terminal if it is carbonised.', 'اقطع لحد نحاس نضيف، ركّب فيرول أو طرف مناسب، واشد بالعزم. غيّر الترمينال لو اتكربن.', null, null);
  M(t, 'undersize', 'Undersized cable or too many cables in a hot duct', 'كابل صغير أو كابلات كتير في مجرى سخن', 0.14, 'med', { hotw: 0.7, drop: 0.7, burntw: 0.3, trip_w: 0.3 }, { w_thin: 0.9, w_bundle: 0.7, w_brown: 0.3 },
    'Re-size per IEC 60364-5-52 with derating for grouping and temperature. Check the breaker protects the cable.', 'اعمل تحجيم جديد حسب IEC 60364-5-52 مع معامل التجميع والحرارة. اتأكد إن البريكر بيحمي الكابل.', null, null);
  M(t, 'corrode', 'Corrosion or moisture at the joint', 'تآكل أو رطوبة في الوصلة', 0.14, 'med', { intermit: 0.6, drop: 0.4, hotw: 0.4, shock_w: 0.3 }, { w_green: 0.9 },
    'Clean or replace the joint, protect with a sealed gland, use anti-oxidant on aluminium.', 'نضّف أو غيّر الوصلة، حط جلاند محكم، واستخدم مادة ضد الأكسدة على الألومنيوم.', null, null);
  M(t, 'insdamage', 'Damaged insulation (crush, chafe, rodent)', 'عزل متضرر (هرس، احتكاك، فئران)', 0.14, 'high', { trip_w: 0.7, shock_w: 0.7, burntw: 0.3, intermit: 0.3 }, { w_crush: 0.85, w_rodent: 0.85 },
    'Replace the damaged length (a joint is a weak point). Fix how it was damaged: sharp edge, no gland, no rodent protection.', 'غيّر الطول التالف (الوصلة نقطة ضعف). صلّح سبب التلف: حرف حاد، من غير جلاند، من غير حماية فئران.', null, null);
  M(t, 'strands', 'Cut strands or poor crimp', 'خيوط مقطوعة أو كبس ضعيف', 0.12, 'med', { hotw: 0.6, intermit: 0.6 }, { w_strand: 0.9, w_nolug: 0.6 },
    'Re-terminate with the right ferrule and a calibrated crimp tool. Pull-test.', 'وصّل من جديد بفيرول مناسب وكماشة معايرة. اعمل اختبار شد.', null, null);
  T(t, 'thermal', 'Thermal image or finger-safe temperature under load', 'صورة حرارية أو حرارة تحت حمل', 'With the circuit loaded, scan the terminals and cables with a thermal camera or an IR thermometer. Compare phases and neighbours.', 'والدايرة محملة، امسح الأطراف والكابلات بكاميرا حرارية أو IR. قارن الفازات واللي جنبها.',
    [['one', 'One point much hotter', 'نقطة واحدة أسخن بكتير'], ['all', 'The whole cable is warm', 'الكابل كله دافي'], ['cold', 'Nothing unusual', 'مفيش حاجة غريبة']],
    { looseconn: { one: 0.85, all: 0.05, cold: 0.1 }, strands: { one: 0.8, cold: 0.15, all: 0.05 }, undersize: { all: 0.8, one: 0.1, cold: 0.1 }, corrode: { one: 0.6, cold: 0.3, all: 0.1 }, insdamage: { cold: 0.7, one: 0.2, all: 0.1 } }, 'cold', 1.6, 'Do not touch live parts. Keep to the safe approach distance.', 'متلمسش أجزاء حية. التزم بمسافة الأمان.');
  T(t, 'vdrop', 'Voltage drop under load', 'هبوط الجهد تحت حمل', 'Measure the voltage at the source end and at the load end of the cable under full load. Drop over 3 % to 5 % is high.', 'قيس الجهد عند بداية الكابل وعند الحمل تحت حمل كامل. هبوط فوق 3% لـ5% يبقى عالي.',
    [['low', 'Under 3 %', 'أقل من 3%'], ['high', 'Over 5 %', 'فوق 5%']], { undersize: { high: 0.8, low: 0.2 }, looseconn: { high: 0.5, low: 0.5 }, corrode: { high: 0.5, low: 0.5 } }, 'low', 2, 'Live work, CAT III meter.', 'شغل على كهرباء، ميتر CAT III.');
  T(t, 'meg', 'Megger the cable between conductors and to earth', 'ميجر للكابل بين الموصلات والأرضي', 'Isolated, both ends disconnected. 500 V (or 1000 V) between each pair of conductors and to earth.', 'معزول والطرفين مفكوكين. 500 (أو 1000) فولت بين كل موصلين وللأرضي.',
    [['ok', 'Above 1 MΩ everywhere', 'فوق 1 ميجا في كل حتة'], ['bad', 'Low somewhere', 'واطي في حتة']], { insdamage: { bad: 0.85, ok: 0.15 }, corrode: { bad: 0.3, ok: 0.7 } }, 'ok', 1.8, 'Dead and isolated only. Discharge the cable after the test.', 'ميت ومعزول بس. فرّغ الكابل بعد الاختبار.');
  T(t, 'pull', 'Pull-test and re-torque the connections', 'اختبر الشد واشد الوصلات بالعزم', 'Isolated: pull each wire gently and re-torque the screws. Look at the strands and the ferrule.', 'والكهرباء فاصلة: اشد كل سلك بلطف واشد المسامير بالعزم. بص على الخيوط والفيرول.',
    [['ok', 'All firm', 'كله ثابت'], ['bad', 'A loose or badly crimped wire', 'سلك سايب أو كبسته وحشة']], { looseconn: { bad: 0.8, ok: 0.2 }, strands: { bad: 0.85, ok: 0.15 } }, 'ok', 1.2);
})(typeof window !== 'undefined' ? window : globalThis);
