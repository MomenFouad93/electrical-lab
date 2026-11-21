/* Guide tab: reference and how to use the app */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, $ = ui.$;
  const G = (EL.guide = {});
  const S = (en, ar) => [en, ar];
  const SECTIONS = [
    { id: 'start', title: S('Start here', 'ابدأ من هنا'), body: [
      S('Bench tab: drag a part from the left list into the drawing, or tap it to add it in the middle. Tap one terminal and then another to draw a wire. Drag from a terminal also works.', 'تبويب المعمل: اسحب أي قطعة من القايمة اللي على الشمال للرسم، أو اضغط عليها تتضاف في النص. اضغط على طرف وبعدين طرف تاني ترسم سلك. وسحب من الطرف بيشتغل برضه.'),
      S('Build mode edits the circuit. Test mode runs it: press buttons, turn selectors, put meter probes on terminals.', 'وضع البناء بيعدل الدائرة. وضع الاختبار بيشغلها: دوس الزراير، لف السلكتور، وحط بروبات الأجهزة على الأطراف.'),
      S('Ready-made circuits (the Ready circuits button) load a working example. Break it with the fault list in the Part tab and find the fault with the meters.', 'الدوائر الجاهزة (زرار دوائر جاهزة) بتحمّل مثال شغال. بوّظه من قايمة الأعطال في تبويب الجهاز ودوّر على العطل بالأجهزة.'),
      S('The assistant understands short commands in Arabic or English: "add a contactor", "connect KM1:A1 to L1", "why is the motor not running", "load star-delta". The microphone button uses the speech recognition of your browser, so it needs Chrome or Safari and an internet connection on some phones. The assistant is rule based, it is not a language model.', 'المساعد بيفهم أوامر قصيرة بالعربي أو الإنجليزي: "ضيف كونتاكتور"، "وصّل KM1:A1 على L1"، "ليه الموتور مش شغال"، "حمّل نجمة مثلث". زرار الميكروفون بيستخدم التعرف على الصوت اللي في المتصفح، يعني محتاج Chrome أو Safari وفي بعض التليفونات إنترنت. المساعد شغال بقواعد، مش نموذج لغة.'),
    ] },
    { id: 'diag', title: S('Diagnosis and guided troubleshooting', 'التشخيص والبحث عن العطل بالخطوات'), body: [
      S('Bench and PCB repair both have a Diagnosis button. Draw a circuit or a board, press it, and the built-in engine runs the drawing through test scenarios. It tells you what is right, what is wrong, where, and what will not light or run. Marks appear on the drawing.', 'تبويب المعمل وتبويب إصلاح الكروت فيهم زرار التشخيص. ارسم دايرة أو كارت واضغطه، والمحرك المدمج بيشغّل الرسم على سيناريوهات اختبار. بيقولك إيه الصح وإيه الغلط وفين وإيه اللي مش هيشتغل. العلامات بتظهر على الرسم.'),
      S('Guided troubleshooting: tell it the symptom. It suggests what to measure first, you enter what you got, and it narrows the suspects until one is left. On PCB repair it can also hide a fault in the board for you to find.', 'البحث بالخطوات: قوله العرض. هيقترح تقيس إيه الأول، وانت تكتب القراءة، وهو يضيّق المشتبه فيهم لحد ما يفضل واحد. في إصلاح الكروت ممكن كمان يخبّي عطل في الكارت تدوّر عليه.'),
      S('Engine choice: Built-in works offline and needs nothing. Built-in + AI adds a second opinion from an online model and needs internet and your own API key. The key stays in this browser. A company network may block it, the built-in engine does not depend on it.', 'اختيار المحرك: المدمج بيشتغل أوفلاين وميحتاجش حاجة. المدمج + AI بيضيف رأي تاني من نموذج أونلاين وبيحتاج نت ومفتاح API بتاعك. المفتاح بيفضل في المتصفح. شبكة الشركة ممكن تحجبه، والمحرك المدمج مش معتمد عليه.'),
      S('Solved cases: every case you save makes the same fault more likely next time. Export the file to share it with a colleague.', 'الحالات المحلولة: كل حالة بتحفظها بتخلي نفس العطل أقرب في المرة الجاية. صدّر الملف وابعته لزميلك.'),
    ] },
    { id: 'inspect', title: S('Inspect tab: photo, symptoms, causes', 'تبويب الفحص: صورة وأعراض وأسباب'), body: [
      S('Pick the equipment (motor, drive, contactor, breaker, wiring, single-phase motor, power supply, PLC, board, sensor, transformer, solenoid, heater, HMI, UPS). Take or choose a photo, or work without one. Tap Mark, tap the photo where you see something and name it.', 'اختار المعدة (موتور، انفرتر، كونتاكتور، بريكر، تسليك، موتور فاز واحد، باور سبلاي، PLC، كارت، سنسور، محول، سولينويد، سخان، HMI، UPS). صوّر أو اختار صورة، أو اشتغل من غير صورة. اضغط علّم، واضغط على الصورة مكان اللي شايفه وسمّيه.'),
      S('Answer What is wrong and What do you see. Only answer what you can see. The list of likely causes ranks itself as you add facts and shows the fix and how to prevent it.', 'جاوب إيه اللي غلط وإيه اللي شايفه. جاوب اللي شايفه بس. قايمة الأسباب المحتملة بترتب نفسها كل ما تضيف حقيقة وبتوريك الحل وإزاي تمنعه.'),
      S('Next check is the guided loop: it asks you to look for something or measure something, you tap what you got, and it eliminates suspects until the cause is clear. Use Undo if you tapped the wrong answer.', 'الفحص الجاي هو الحلقة الموجهة: بتطلب منك تبص على حاجة أو تقيس حاجة، وانت بتضغط اللي لقيته، وهي بتستبعد المشتبه فيهم لحد ما السبب يبان. استخدم تراجع لو ضغطت إجابة غلط.'),
      S('Teach the app: when you know the real cause, save the case. The ranking improves from your cases. You can add your own cause too. Cases stay on this device. Export and Import move them between devices.', 'علّم التطبيق: لما تعرف السبب الحقيقي احفظ الحالة. الترتيب بيتحسن من حالاتك. وتقدر تضيف سبب من عندك. الحالات بتفضل على الجهاز ده. التصدير والاستيراد بينقلوها بين الأجهزة.'),
      S('Optional online AI can look at the photo. The photo and your notes go to the AI service, so do not use it for anything confidential. The offline method works without it. The Gallery button shows drawn references of common defects: burnt windings, bulged capacitors, cracked solder, corrosion, overheated terminals, worn contacts, bearing damage.', 'الـAI الأونلاين الاختياري ممكن يبص على الصورة. الصورة وملاحظاتك بتروح لخدمة الـAI، فمتستخدموش لحاجة سرية. الطريقة الأوفلاين بتشتغل من غيره. زرار المعرض فيه رسومات مرجعية لأعطال شائعة: ملفات محروقة، كباسيتورات منفوخة، لحام مشروخ، تآكل، أطراف سخنت، كونتاكتات بالية، رولمان تالف.'),
      S('The report button saves an HTML file with the photo, marks, causes, checks and equipment details.', 'زرار التقرير بيحفظ ملف HTML فيه الصورة والعلامات والأسباب والفحوصات وبيانات المعدة.'),
    ] },
    { id: 'parts', title: S('Parts, boards and templates', 'القطع والكروت والقوالب'), body: [
      S('The toolbox groups parts as sources, protection, drives, control (contactors, relays, timers, pushbuttons, selectors, lamps), automation (PLC and I/O), loads, field devices (sensors), wiring (terminals and cables) and electronics. Use the search box on the left to find a part by name.', 'صندوق القطع مقسم: مصادر، حماية، انفرترات، تحكم (كونتاكتورات ورليهات وتايمرات وزراير وسلكتورات ولمبات)، أتمتة (PLC ومداخل ومخارج)، أحمال، حساسات وحقل، توصيلات (ترمينالات وكابلات) وإلكترونيات. استخدم خانة البحث على الشمال تلاقي القطعة بالاسم.'),
      S('PCB repair has practice boards with a hidden fault: a cracked trace, a burnt resistor, a blown fuse, a dead regulator, a transistor driver, an optocoupler, a relay driver, a mains power supply, a USB 5 V port and a 230 V board with a varistor. There is also a free board: take a photo of your own board and place parts over its pads.', 'إصلاح الكروت فيه كروت تدريب بعطل مخفي: مسار مشروخ، مقاومة محروقة، فيوز محروق، ريجيلاتر ميت، ترانزستور درايفر، أوبتوكوبلر، درايفر ريلاي، باور سبلاي 230 فولت، بورت USB 5 فولت وكارت 230 فولت فيه فاريستور. وفيه كارت حر: صوّر الكارت بتاعك وحط القطع على نقطه.'),
    ] },
    { id: 'meters', title: S('Meters: safe use', 'الأجهزة: الاستخدام الآمن'), body: [
      S('Multimeter: red probe in VΩ jack for voltage and ohms, in mA or 10 A jack only for current in series. Never measure voltage with the leads in a current jack. That is the classic way to blow a fuse or a meter.', 'الملتيميتر: البروب الأحمر في فتحة VΩ للجهد والأوم، وفي فتحة mA أو 10A للتيار على التوالي بس. متقيسش جهد والبروب في فتحة التيار. دي أشهر طريقة تحرق بيها فيوز أو جهاز.'),
      S('Resistance and continuity: de-energise first. A meter on ohms across a live circuit reads nonsense and can be damaged.', 'المقاومة والـcontinuity: افصل الكهرباء الأول. القياس بالأوم على دائرة عليها كهرباء بيدي قراءة غلط وممكن يبوّظ الجهاز.'),
      S('Clamp meter: clamp ONE conductor only. Two conductors cancel out. Use INRUSH to catch the motor starting current.', 'الكلامب: اقفل على سلك واحد بس. سلكين بيلغوا بعض. استخدم INRUSH تمسك تيار بدء الموتور.'),
      S('Insulation tester (megger): only on a dead, isolated circuit. 500 V for 400 V motors, 250 V for electronics-adjacent wiring, 1000 V for higher ratings. Disconnect drives and electronics first, the test voltage destroys them. Hold TEST and wait for the reading to settle.', 'ميجر العزل: على دائرة ميتة ومفصولة بس. 500 فولت لموتورات 400 فولت، 250 للأسلاك القريبة من الإلكترونيات، 1000 للأعلى. افصل الانفرترات والإلكترونيات الأول، جهد الاختبار بيحرقها. امسك TEST واستنى القراءة تثبت.'),
      S('mA calibrator: source mode feeds a signal (4 to 20 mA, 24 mA, volts) into a loop or a coil. Measure mode reads the loop. Check the loop is not powered by the PLC while you inject.', 'الكاليبراتور: وضع المصدر بيدي إشارة (4 إلى 20 مللي، 24 مللي، فولت) في لوب أو ملف. وضع القياس بيقرا اللوب. اتأكد إن اللوب مش مغذي من الـPLC وانت بتحقن.'),
      S('Voltage tester and NCV pen: they say "something is live", never "this is dead". Always prove dead with a two-pole tester, and prove the tester on a known live source before and after.', 'تستر الجهد وقلم NCV: بيقولوا "فيه كهرباء"، مش بيقولوا "ده ميت". اثبت إنه ميت بتستر ذو قطبين، واثبت التستر على مصدر معروف شغال قبل وبعد.'),
    ] },
    { id: 'loto', title: S('Lock out, tag out, try out', 'LOTO: عزل وقفل وتعليق'), body: [
      S('Order: prepare and notify, normal stop, isolate every energy source, apply your own lock and tag, release or block stored energy, then verify with a try-out and a tester (prove-test-prove).', 'الترتيب: تجهيز وإبلاغ، إيقاف عادي، عزل كل مصادر الطاقة، تركيب القفل والتاج بتاعك، تفريغ أو تثبيت الطاقة المخزنة، وبعدين تحقق بمحاولة تشغيل وتستر (اثبت-اختبر-اثبت).'),
      S('One person, one lock, one key. Never use someone else\'s lock. Group lockout uses a lock box: each worker puts a personal lock on the box.', 'شخص واحد، قفل واحد، مفتاح واحد. متستخدمش قفل حد تاني. القفل الجماعي بيستخدم صندوق: كل عامل بيحط قفله الشخصي على الصندوق.'),
      S('Stored energy: air receivers, springs, raised loads, capacitors, hot or pressurised lines. Release or block it, and keep checking.', 'الطاقة المخزنة: خزانات هوا، سوست، أحمال مرفوعة، كباسيتورات، خطوط سخنة أو عليها ضغط. فرّغها أو ثبّتها، وفضل تتأكد.'),
      S('Removing a lock: the person who fitted it removes it, after the area is clear and everyone is informed.', 'فك القفل: اللي ركّبه هو اللي يفكه، بعد ما المنطقة تتخلى ويتم إبلاغ الكل.'),
      S('Master board: one page with a sample of everything. Light switch, plug, breakers, rotary isolator, a small control panel, motors, a drive, valves, an air receiver, stored energy and the LOTO kit. Switch to After LOTO to see how each one is isolated and explained in simple words. Green is an isolation device, amber is control only, blue is stored energy.', 'اللوحة الشاملة: صفحة واحدة فيها عينة من كل حاجة. مفتاح إنارة، فيشة، بريكرات، أيزوليتور دوّار، لوحة تحكم صغيرة، موتورات، انفرتر، فالفات، خزان هوا، طاقة مخزنة وعدة اللوتو. اختار بعد اللوتو تشوف كل واحد بيتعزل إزاي ومشروح ببساطة. الأخضر جهاز عزل، الأصفر تحكم بس، الأزرق طاقة مخزنة.'),
      S('Tap any tile or any device in the catalog or in the trainer to open its window. Outside shows the real shape, Inside is a cutaway, and LOTO applied shows the lockout fitted. Tap the blue numbers for what each part does. Pinch or scroll to zoom. You can add your own photo of the real device and label its parts.', 'اضغط على أي كارت أو أي جهاز في الكتالوج أو في التدريب يفتح نافذته. من برا بيوري الشكل، من جوه قطاع، واللوتو متركب بيوري اللوتو. اضغط على الأرقام الزرقا تعرف كل جزء بيعمل إيه. كبّر بالقرص أو العجلة. تقدر تضيف صورتك للجهاز الحقيقي وتسمّي أجزاءه.'),
      S('Find the mistakes: twelve technicians describe what they did, you mark each Safe or Not safe. In the trainer, Review my isolation checks your lock, tag, stored energy and verification, with the standard behind each point. It does not change your score. Online AI is optional.', 'اكتشف الغلطة: اتناشر فني بيوصفوا اللي عملوه، وانت بتعلّم على كل واحد آمن أو مش آمن. في التدريب، زرار راجع عزلي بيراجع القفل والتاج والطاقة المخزنة والتحقق، مع المعيار وراء كل نقطة. مبيغيّرش درجتك. الـAI الأونلاين اختياري.'),
    ] },
    { id: 'pcb', title: S('Board repair method', 'طريقة إصلاح الكروت'), body: [
      S('Look first: burnt marks, bulged capacitors, cracked solder, lifted pads. Then power on and measure the input, then follow the signal until the voltage disappears.', 'بص الأول: علامات حرق، كباسيتورات منفوخة، لحام مشروخ، نقط مرفوعة. بعدها شغّل وقيس الدخل، واتبع الإشارة لحد ما الجهد يختفي.'),
      S('Power off for continuity and resistance. A cracked trace reads open between two pads that should be the same net. Bridge it with a thin wire jumper, soldered on both ends.', 'اقفل الكهرباء لقياس الـcontinuity والمقاومة. المسار المشروخ بيقرا مفتوح بين نقطتين المفروض نفس الشبكة. عدّيه بسلك رفيع ملحوم من الطرفين.'),
      S('A blown fuse is a symptom. Check for a short before replacing it, and use the same rating.', 'الفيوز المحروق عرض مش سبب. شوف في ماس قبل ما تغيّره، وبنفس القيمة.'),
      S('Never put an insulation tester on a populated board.', 'متحطش ميجر عزل على كارت عليه قطع.'),
    ] },
    { id: 'colors', title: S('Wire colours (IEC)', 'ألوان الأسلاك'), body: [
      S('L1 brown, L2 black, L3 grey, neutral blue, protective earth green and yellow. DC: + red, − blue. The bench draws them in these colours. Check what your plant standard says, older panels differ.', 'L1 بني، L2 أسود، L3 رمادي، النيوترال أزرق، الأرضي أخضر وأصفر. DC: الموجب أحمر والسالب أزرق. المعمل بيرسمهم بالألوان دي. راجع معيار مصنعك، اللوحات القديمة بتختلف.'),
    ] },
    { id: 'terms', title: S('Terminal numbers', 'ترقيم الأطراف'), body: [
      S('Contactor power poles: 1-2, 3-4, 5-6 (also L1-T1, L2-T2, L3-T3). Coil: A1 and A2. Auxiliary contacts: first digit is the position, second digit is the function. 13-14 and 23-24 normally open, 21-22 and 31-32 normally closed. Overload relay: 95-96 normally closed, 97-98 normally open.', 'أقطاب القدرة في الكونتاكتور: 1-2، 3-4، 5-6 (أو L1-T1، L2-T2، L3-T3). الملف: A1 وA2. الكونتاكتات المساعدة: الرقم الأول مكانه والتاني وظيفته. 13-14 و23-24 مفتوح عادة، 21-22 و31-32 مقفول عادة. الأوفرلود: 95-96 مقفول عادة، 97-98 مفتوح عادة.'),
      S('Motor terminals: U1 V1 W1 and W2 U2 V2. Star: join W2 U2 V2. Delta: U1-W2, V1-U2, W1-V2.', 'أطراف الموتور: U1 V1 W1 وW2 U2 V2. نجمة: وصّل W2 U2 V2 ببعض. دلتا: U1-W2 وV1-U2 وW1-V2.'),
    ] },
    { id: 'cat', title: S('Meter safety categories', 'فئات أمان الأجهزة'), body: [
      S('CAT II: wall sockets and plug-in loads. CAT III: distribution boards and panels. CAT IV: the origin of supply. Use a meter and leads rated for the category and the voltage, and keep the fingers behind the guards.', 'CAT II: المقابس والأحمال اللي بتتوصل بفيشة. CAT III: لوحات التوزيع واللوحات. CAT IV: مصدر الدخل. استخدم جهاز وأسلاك مناسبة للفئة والجهد، وخلي صوابعك ورا الحماية.'),
    ] },
    { id: 'limits', title: S('What this app is and is not', 'التطبيق ده إيه وإيه مش هو'), body: [
      S('It is a simplified training simulator. It teaches reasoning and safe order of work. It does not replace the maker\'s documentation, your site permit to work or a competent person.', 'ده محاكي تدريبي مبسّط. بيعلّم التفكير وترتيب الشغل الآمن. مش بديل عن كتالوج الشركة المصنعة ولا تصريح الشغل بتاع الموقع ولا شخص مؤهل.'),
      S('Everything runs in your browser. Nothing is sent anywhere. Your bench is saved on this device only. Use Save / open to keep a file or send it to a friend.', 'كل حاجة شغالة في المتصفح بتاعك. مفيش حاجة بتتبعت لأي مكان. المعمل بيتحفظ على الجهاز ده بس. استخدم حفظ / فتح تحتفظ بملف أو تبعته لصاحبك.'),
    ] },
  ];
  G.init = function () { ui.onRefresh(G.render); G.render(); };
  G.onShow = function () { if (!G.drawn) G.render(); };
  G.render = function () {
    const root = $('#guideRoot'); if (!root) return;
    root.innerHTML = ''; G.drawn = true;
    root.appendChild(h('h2', { text: T(['Guide', 'الدليل']) }));
    root.appendChild(h('p', { class: 'mute', text: T(['Short notes you can read before you start. Tap a title to open it.', 'ملاحظات قصيرة تقراها قبل ما تبدأ. اضغط على العنوان تفتحه.']) }));
    let first = true;
    for (const s of SECTIONS) {
      const body = h('div', { class: 'gbody' }, s.body.map((t) => h('p', { text: T(t) })));
      const open = first; first = false;
      body.style.display = open ? '' : 'none';
      const head = h('button', { class: 'ghead', onclick: () => { body.style.display = body.style.display === 'none' ? '' : 'none'; head.classList.toggle('on', body.style.display !== 'none'); } }, h('span', { text: T(s.title) }), h('span', { text: '▾' }));
      head.classList.toggle('on', open);
      root.appendChild(h('div', { class: 'card gsec' }, head, body));
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
