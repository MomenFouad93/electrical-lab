/* Instrument documentation: every control explained (EN / AR) */
(function (g) {
  const EL = g.EL;
  const D = (EL.instDocs = {});
  D.dmm = {
    name: ['Digital multimeter (Fluke style)', 'ملتيميتر ديجيتال (زي فلوك)'],
    intro: ['Measures voltage, resistance, continuity, diodes and current. Rule: pick the function on the dial AND put the red lead in the matching jack, then touch the probes.', 'بيقيس جهد ومقاومة وتوصيل وديود وتيار. القاعدة: اختار الوظيفة من الدايل، وحط الليد الأحمر في الفتحة المناسبة، وبعدها المس بالبروبات.'],
    ctl: [
      ['OFF', ['OFF', 'OFF'], ['Meter is off. Turn the dial here when you store it or change a fuse.', 'الميتر مقفول. حط الدايل هنا وانت بتحفظه أو بتغير الفيوز.']],
      ['VAC', ['V~ (AC volts)', 'V~ جهد متردد'], ['AC voltage, shown as RMS. Use it on mains (230 / 400 V), transformer secondaries and drive outputs. Press Hz to see the frequency. Probes in parallel with the load.', 'جهد متردد بقيمة RMS. للكهرباء 230 / 400 فولت وثانوي الترانس وخرج الانفرتر. اضغط Hz تشوف التردد. البروبات على التوازي.']],
      ['VDC', ['V⎓ (DC volts)', 'V⎓ جهد مستمر'], ['DC voltage for 24 V control, PSU outputs and batteries. Red on +, black on −. A minus sign means the leads are reversed.', 'جهد مستمر لدوائر 24 فولت وخرج الباور والبطاريات. الأحمر على + والأسود على −. علامة سالب معناها الليدات معكوسة.']],
      ['MV', ['mV⎓ (millivolts)', 'mV⎓ مللي فولت'], ['Small DC signals: thermocouples, shunt drops. Maximum 600 mV, above that the display shows OL.', 'إشارات DC صغيرة: ثيرموكابل وهبوط جهد شنط. الأقصى 600 مللي فولت، فوقه بيظهر OL.']],
      ['OHM', ['Ω (resistance)', 'Ω مقاومة'], ['Resistance of a winding, heater, resistor or cable. The circuit must be dead and isolated. The meter sends 0.4 V itself, so a live circuit gives a wrong reading and can damage the meter. Use REL to cancel the lead resistance.', 'مقاومة ملف أو سخان أو مقاومة أو كابل. لازم الدايرة تكون مفصولة ومعزولة. الميتر بيبعت جهد 0.4 فولت بنفسه، فلو فيه كهرباء القراءة بتبقى غلط وممكن الميتر يتبوظ. استخدم REL عشان تشيل مقاومة الليدات.']],
      ['CONT', ['Continuity (beeper)', 'توصيل (بيبر)'], ['Beeps when the resistance is under about 30 Ω. Fast check of wires, fuses and contacts. Dead circuits only.', 'بيصفّر لما المقاومة تحت 30 أوم تقريبًا. فحص سريع للأسلاك والفيوزات والكونتاكتات. على دوائر مفصولة بس.']],
      ['DIODE', ['Diode test', 'اختبار الدايود'], ['Shows the forward drop: about 0.5 to 0.7 V for silicon, 1.8 to 3 V for an LED. Red on the anode. Reverse or open shows OL.', 'بيعرض الهبوط الأمامي: حوالي 0.5 لـ 0.7 فولت للسيليكون و1.8 لـ 3 للـLED. الأحمر على الأنود. العكسي أو المفتوح بيظهر OL.']],
      ['MA', ['mA (small current)', 'mA تيار صغير'], ['DC/AC current up to 400 mA, in series with the load (break the circuit and put the meter in the gap). Red lead goes in the mA jack. Fuse is 440 mA.', 'تيار صغير لحد 400 مللي، على التوالي مع الحمل (اقطع الدايرة وحط الميتر في الفتحة). الليد الأحمر في فتحة mA. الفيوز 440 مللي.']],
      ['A', ['A (10 A current)', 'A تيار 10 أمبير'], ['Current up to 10 A, in series. Red lead in the 10 A jack. Fuse is 11 A. Never put it across a voltage source: it is a short circuit.', 'تيار لحد 10 أمبير، على التوالي. الليد الأحمر في فتحة 10A. الفيوز 11 أمبير. ماتحطوش على مصدر جهد: ده شورت.']],
      ['jack', ['Jacks (10A / mA / COM / VΩ)', 'الفتحات (10A / mA / COM / VΩ)'], ['COM is always the black lead. VΩ is for volts, ohms, continuity and diode. mA and 10A are only for current. Leaving the red lead in a current jack while measuring voltage makes a short across the source and blows the fuse.', 'COM دايمًا للأسود. VΩ للفولت والأوم والتوصيل والدايود. mA و10A للتيار بس. لو سبت الأحمر في فتحة تيار وقست جهد بتعمل شورت على المصدر وبيحرق الفيوز.']],
      ['HOLD', ['HOLD', 'HOLD'], ['Freezes the display so you can read it after you take the probes off, for example in a tight panel.', 'بيثبّت القراءة عشان تقراها بعد ما تشيل البروبات، زي في لوحة ضيقة.']],
      ['RANGE', ['RANGE', 'RANGE'], ['Switches between auto range and manual range, and steps the range up in manual. Manual range reads faster and stays stable when the value jumps around.', 'بيبدل بين الرينج الأوتوماتيك واليدوي وبيطلّع الرينج في اليدوي. اليدوي أسرع وثابت لما القيمة بتتنطط.']],
      ['MINMAX', ['MIN MAX', 'MIN MAX'], ['Records the lowest and highest values. Press again to cycle live, MAX, MIN, then off. Useful for supply dips and motor start.', 'بيسجل أقل وأعلى قيمة. اضغط تاني تلف: حي، MAX، MIN، وبعدين يقفل. مفيد لهبوط الجهد وبدء الموتور.']],
      ['REL', ['REL Δ (relative)', 'REL Δ (نسبي)'], ['Takes the current reading as zero and shows differences from it. Touch the leads together first in the Ω range to remove the lead resistance.', 'بياخد القراءة الحالية كصفر ويعرض الفرق عنها. في الأوم لمّ البروبين الأول عشان تشيل مقاومة الليدات.']],
      ['HZ', ['Hz', 'Hz'], ['Shows the frequency of the AC voltage (V~ range). Mains is 50 Hz. A drive output changes with the speed setting.', 'بيعرض تردد الجهد المتردد (على V~). الكهرباء 50 هرتز. وخرج الانفرتر بيتغير مع السرعة.']],
      ['YEL', ['Yellow key (~ / ⎓)', 'الزرار الأصفر (~ / ⎓)'], ['Switches the current ranges between AC and DC. Voltage ranges have separate dial positions.', 'بيبدل تيار AC و DC على رينجات التيار. الجهد ليه أوضاع منفصلة على الدايل.']],
      ['safety', ['Safety', 'السلامة'], ['Check the meter and leads before use (cracked insulation, correct CAT rating, good fuse). Prove-test-prove: test on a known live source, test the circuit, test the known source again. Keep one hand away from the panel when possible.', 'افحص الميتر والليدات قبل الاستخدام (عزل مشروخ، تصنيف CAT مناسب، فيوز سليم). اختبر على مصدر معروف، وبعدين الدايرة، وبعدين المصدر المعروف تاني. وابعد إيدك التانية عن اللوحة لو تقدر.']],
    ],
  };
  D.clamp = {
    name: ['Clamp meter', 'كلامب ميتر'],
    intro: ['Measures current without breaking the circuit by clamping around ONE conductor. It also has voltage, resistance and continuity with leads.', 'بيقيس التيار من غير ما تقطع الدايرة، بتحط الفك حوالين سلك واحد بس. وفيه كمان جهد ومقاومة وتوصيل بالليدات.'],
    ctl: [
      ['OFF', ['OFF', 'OFF'], ['Meter off.', 'الميتر مقفول.']],
      ['AAC', ['A~ (AC current)', 'A~ تيار متردد'], ['Clamp one phase wire of a motor to read its line current. Compare it with the nameplate current. Clamp two conductors of the same circuit and the fields cancel and the reading is about zero.', 'اقفل الفك على فاز واحد من الموتور واقرا تيار الخط وقارنه بتيار اللوحة. لو قفلت على سلكين من نفس الدايرة المجالات بتتلاشى والقراءة بتبقى صفر تقريبًا.']],
      ['ADC', ['A⎓ (DC current)', 'A⎓ تيار مستمر'], ['DC current with a hall sensor, for example 24 V loads and DC buses. Use ZERO in the air before measuring.', 'تيار مستمر بحساس هول، زي أحمال 24 فولت. اعمل ZERO في الهوا قبل القياس.']],
      ['VAC', ['V~', 'V~'], ['AC volts with leads, same as the multimeter.', 'جهد متردد بالليدات، زي الملتيميتر.']],
      ['VDC', ['V⎓', 'V⎓'], ['DC volts with leads.', 'جهد مستمر بالليدات.']],
      ['OHM', ['Ω', 'Ω'], ['Resistance with leads, circuit dead.', 'مقاومة بالليدات والدايرة مفصولة.']],
      ['CONT', ['Continuity', 'توصيل'], ['Beeper for continuity with leads, circuit dead.', 'بيبر للتوصيل بالليدات والدايرة مفصولة.']],
      ['jaw', ['Jaw and trigger', 'الفك والزناد'], ['Press the trigger to open the jaw, close it around one conductor. In this lab, tap a terminal on the circuit to clamp around its wire. The wire must be in the middle of the jaw.', 'اضغط الزناد يفتح الفك وقفله حوالين سلك. في المعمل اضغط على طرف في الدايرة عشان تحط الفك على سلكه. السلك لازم يبقى في نص الفك.']],
      ['HOLD', ['HOLD', 'HOLD'], ['Freezes the displayed value.', 'بيثبّت القراءة.']],
      ['INRUSH', ['INRUSH', 'INRUSH'], ['Captures the starting (inrush) current. Press INRUSH, then start the motor: the peak stays on the screen. A direct-on-line motor draws 6 to 8 times its running current for a moment; a star-delta start draws about one third of that.', 'بيلقط تيار البدء. اضغط INRUSH وشغّل الموتور: القيمة العالية بتفضل ظاهرة. موتور DOL بيسحب 6 لـ 8 أضعاف تياره العادي لحظة، وستار دلتا بيسحب تلتها تقريبًا.']],
      ['MINMAX', ['MIN MAX', 'MIN MAX'], ['Records the highest current seen (peak) until you reset it.', 'بيسجل أعلى تيار ظهر لحد ما تصفّره.']],
      ['ZERO', ['ZERO', 'ZERO'], ['Cancels the sensor offset on A⎓ and clears the recorded peak.', 'بيشيل الأوفست بتاع الحساس على A⎓ وبيمسح القيمة المسجلة.']],
    ],
  };
  D.meg = {
    name: ['Insulation tester (megger)', 'ميجر (جهاز اختبار العزل)'],
    intro: ['Applies a high DC voltage (250 to 1000 V) between a conductor and earth to measure insulation resistance in MΩ. Used on motors, cables and busbars. It is never used on a live circuit.', 'بيطبق جهد DC عالي (250 لـ 1000 فولت) بين الموصل والأرضي عشان يقيس مقاومة العزل بالميجا أوم. بيستخدم على الموتورات والكابلات والبارات. وعمره ما بيستخدم على دايرة عليها كهرباء.'],
    ctl: [
      ['volt', ['Test voltage (250 / 500 / 1000 V)', 'جهد الاختبار (250 / 500 / 1000 فولت)'], ['Choose by the rating of the equipment: 500 V for equipment up to 500 V (typical 400 V motor), 1000 V for 690 V equipment, 250 V for sensitive or low voltage control wiring.', 'اختار حسب جهد الجهاز: 500 فولت للأجهزة لحد 500 فولت (موتور 400 فولت العادي) و1000 فولت لأجهزة 690 فولت و250 فولت للتحكم الحساس.']],
      ['LINE', ['LINE (red lead)', 'LINE (الليد الأحمر)'], ['Goes on the conductor under test, for example a motor winding terminal.', 'بيتوصل على الموصل اللي بتختبره، زي طرف ملف الموتور.']],
      ['EARTH', ['EARTH (black lead)', 'EARTH (الليد الأسود)'], ['Goes on earth (PE) or the motor frame. For phase-to-phase tests put it on another winding.', 'بيتوصل على الأرضي أو هيكل الموتور. ولاختبار بين الفازات حطه على ملف تاني.']],
      ['TEST', ['TEST (hold)', 'TEST (اضغط واستنى)'], ['Hold it to apply the voltage. The reading rises as the cable charges, so wait about 60 seconds. If the meter finds more than 30 V on the circuit it refuses to test. After the test, the meter discharges the circuit through itself: keep the leads on until the reading drops.', 'اضغط عليه عشان يطبق الجهد. القراءة بتطلع تدريجيًا لأن الكابل بيشحن، فاستنى حوالي 60 ثانية. لو لقى أكتر من 30 فولت على الدايرة بيرفض الاختبار. بعد الاختبار بيفرغ الدايرة بنفسه: سيب الليدات لحد ما القراءة تنزل.']],
      ['read', ['Reading and verdict', 'القراءة والحكم'], ['Above 100 MΩ is excellent, 10 to 100 MΩ is acceptable for an LV motor, 1 to 10 MΩ is marginal (dry and re-test), under 1 MΩ fails. Trend matters: record each test and compare with the last one.', 'فوق 100 ميجا ممتاز، من 10 لـ 100 مقبول لموتور جهد منخفض، من 1 لـ 10 ضعيف (جفف وأعد الاختبار)، وتحت 1 ميجا فاشل. الاتجاه مهم: سجل كل اختبار وقارن بالسابق.']],
      ['safe', ['Safety', 'السلامة'], ['Isolate and lock out first. Disconnect drives, PSUs, PLC cards and electronic sensors: the test voltage destroys them. Do not touch the leads or the winding during or just after a test.', 'اعزل واقفل لوتو الأول. افصل الانفرترات والباور وكروت الـPLC والحساسات الإلكترونية: جهد الاختبار بيحرقها. ماتلمسش الليدات أو الملف أثناء الاختبار أو بعده على طول.']],
    ],
  };
  D.cal = {
    name: ['mA calibrator / loop source', 'كاليبريتور mA / مصدر لوب'],
    intro: ['Generates or measures a 4 to 20 mA loop signal and voltage signals. Used to check transmitters, I/P converters, valve positioners, PLC analog inputs and solenoids.', 'بيولّد أو بيقيس إشارة لوب 4 لـ 20 ملي وإشارات جهد. للتأكد من الترانسميترات وI/P والبوزشنرز ومداخل PLC التناظرية والسولينويدات.'],
    ctl: [
      ['mode', ['Mode', 'الوضع'], ['SOURCE mA drives current into a device (OUT+ red to the device +, OUT− black to the device −). SOURCE V gives 0 to 10 V. MEASURE mA reads a loop in series. LOOP POWER gives 24 V and reads the current. SIM TX behaves like a transmitter, pulling the set current from an external 24 V supply.', 'SOURCE mA بيدفع تيار في الجهاز (OUT+ الأحمر على + الجهاز و OUT− الأسود على −). SOURCE V بيدي 0 لـ 10 فولت. MEASURE mA بيقرا لوب على التوالي. LOOP POWER بيدي 24 فولت وبيقرا التيار. SIM TX بيتصرف كترانسميتر وبيسحب التيار المضبوط من 24 فولت خارجي.']],
      ['pct', ['0 / 25 / 50 / 75 / 100 %', '0 / 25 / 50 / 75 / 100 %'], ['Jumps to 4, 8, 12, 16 and 20 mA, the standard calibration check points. Valve 0 % is closed and 100 % is open on an air-to-open actuator.', 'بيروح على 4 و8 و12 و16 و20 ملي، نقط المعايرة المعتادة. الفالف 0٪ مقفول و100٪ مفتوح على أكتيويتر air-to-open.']],
      ['24', ['24 mA', '24 مللي'], ['Over-range value used to test whether a device or solenoid reacts at high current. A solenoid coil designed for 24 V DC draws current by its resistance: a 24 mA signal is too weak for a standard 24 V solenoid but enough for an I/P converter.', 'قيمة فوق المدى لاختبار رد فعل جهاز أو سولينويد عند تيار عالي. كويل سولينويد 24 فولت DC بيسحب تيار حسب مقاومته: إشارة 24 ملي ضعيفة على سولينويد 24 فولت عادي لكنها كفاية لـ I/P.']],
      ['step', ['+ / − and step size', '+ / − وحجم الخطوة'], ['Changes the output by the step. Coarse is 1 mA, fine is 0.01 mA. You can also type the value.', 'بيغير الخرج بمقدار الخطوة. الكبيرة 1 ملي والدقيقة 0.01 ملي. وتقدر تكتب القيمة.']],
      ['out', ['OUTPUT ON / OFF', 'OUTPUT ON / OFF'], ['Nothing leaves the terminals until you switch the output on. Switch it off before you move the leads.', 'مفيش أي خرج على الأطراف لحد ما تشغل الـOUTPUT. اقفله قبل ما تنقل الليدات.']],
      ['comp', ['Compliance', 'الكومبلاينس'], ['The calibrator can drive only up to about 24 V. If the load needs more voltage for the set current, the output saturates and the warning appears. Typical cause: a high resistance, an open contact or the wrong terminals.', 'الكاليبريتور بيدفع لحد 24 فولت تقريبًا. لو الحمل محتاج جهد أعلى للتيار المضبوط الخرج بيتشبع وبتظهر الرسالة. السبب المعتاد: مقاومة عالية أو كونتاكت مفتوح أو أطراف غلط.']],
    ],
  };
  D.tester = {
    name: ['Two-pole voltage tester', 'تستر جهد بقطبين'],
    intro: ['A tester with an LED ladder and no need for a range selection. It loads the circuit a little, so it ignores ghost voltages. It is the correct tool to prove that a circuit is dead.', 'تستر بسلم ليدات من غير اختيار رينج. بيحمّل الدايرة شوية فمابيتخدعش بالجهود الوهمية. وهو الأداة الصح لإثبات إن الدايرة ميتة.'],
    ctl: [
      ['ladder', ['LED ladder (12 to 690 V)', 'سلم الليدات (12 لـ 690 فولت)'], ['The highest lit LED is the voltage range. The ladder is approximate: use a multimeter for an exact value.', 'أعلى ليد منور هو مدى الجهد. السلم تقريبي: استخدم الملتيميتر للقيمة بالظبط.']],
      ['pol', ['+ / − polarity', 'القطبية + / −'], ['Shows DC polarity. Both AC lamps lit means AC.', 'بيبين قطبية الـDC. لو الاتنين منورين معناها AC.']],
      ['self', ['Self test', 'اختبار ذاتي'], ['Touch the two probes together or press the self-test to light the ladder from the internal battery. Do this before and after you test a circuit: prove-test-prove.', 'لمّ البروبين أو اضغط الاختبار الذاتي عشان السلم ينور من البطارية. اعمله قبل وبعد اختبار الدايرة: اختبر-اختبر-اختبر.']],
      ['prove', ['Prove-test-prove', 'اختبر-اختبر-اختبر'], ['1) Test on a known live source. 2) Test the circuit you want to prove dead, every pair (L-L, L-PE, L-N). 3) Test the known source again. If step 3 fails, the result of step 2 is worthless.', '1) اختبر على مصدر معروف إنه شغال. 2) اختبر الدايرة اللي عايز تثبت إنها ميتة، كل الأزواج (فاز-فاز، فاز-أرضي، فاز-نيوترال). 3) اختبر المصدر المعروف تاني. لو الخطوة 3 فشلت يبقى نتيجة 2 ملهاش قيمة.']],
    ],
  };
  D.ncv = {
    name: ['Non-contact voltage pen', 'قلم فاز (كشف بدون لمس)'],
    intro: ['Detects the AC electric field around a live wire without touching it. Quick screening only: it never proves a circuit is dead.', 'بيكشف المجال الكهربي المتردد حوالين سلك شغال من غير لمس. للفحص السريع بس: مستحيل يثبت إن الدايرة ميتة.'],
    ctl: [
      ['led', ['LED and beeper', 'الليد والبيبر'], ['Lights and beeps when AC voltage is detected near the tip.', 'بينور ويصفّر لما يكشف جهد متردد قريب من الطرف.']],
      ['sens', ['HI / LO sensitivity', 'الحساسية HI / LO'], ['HI detects about 20 V and up, LO about 90 V and up. Use LO to ignore weak stray fields next to a live cable.', 'HI بيكشف من حوالي 20 فولت وLO من حوالي 90 فولت. استخدم LO عشان تتجاهل المجالات الضعيفة جنب كابل شغال.']],
      ['limits', ['Limits', 'العيوب'], ['It does not detect DC. Shielded or armoured cable can hide the field. A silent pen does not mean dead: use the two-pole tester or a multimeter.', 'مش بيكشف DC. الكابل المغلف أو المدرّع بيخبي المجال. القلم الساكت مش معناه ميت: استخدم التستر أو الملتيميتر.']],
    ],
  };
  EL.instList = [
    ['dmm', ['Multimeter', 'ملتيميتر'], 'multimeter meter dmm fluke avo volt ohm voltmeter ملتيميتر ميتر افو أفو فلوك فولتميتر اوميتر أوميتر قياس'],
    ['clamp', ['Clamp meter', 'كلامب ميتر'], 'clamp clampmeter amp ammeter current كلامب امبير أمبير تيار'],
    ['meg', ['Megger', 'ميجر'], 'megger insulation tester meg ميجر ميغر عزل ميجا'],
    ['cal', ['mA calibrator', 'كاليبريتور'], 'calibrator mA 4-20 loop source calibration كاليبريتور معايرة لوب مصدر ملي'],
    ['tester', ['Voltage tester', 'تستر جهد'], 'tester voltage two pole fluke t6 t150 تستر فولت'],
    ['ncv', ['NCV pen', 'قلم فاز'], 'ncv pen non contact phase detector قلم فاز فازة'],
  ];
})(typeof window !== 'undefined' ? window : globalThis);
