/* LOTO master board: one page with a sample of every isolation device, machine, stored energy and kit item.
   Before / after LOTO view, tap any tile for the inside view, and a "find the mistakes" audit. */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, L = EL.lotoData, DT = EL.lotoDet, LB = EL.lotoBoard;
  if (!DT || !LB) return;
  const M = (EL.lotoMaster = { mode: 'before', ans: {}, checked: false });
  const A = (a, b) => [a, b];

  const ZONES = [
    { id: 'src', c: '#9aa3b5', t: A('1. Supply: where the energy comes from', '1. المصدر: الطاقة جاية منين'), d: A('The plant supply has three live phases and a neutral. Single phase takes one phase and the neutral (230 V). Two phase takes two phases (400 V). Three phase takes all three. Every isolator below cuts this energy downstream. The supply itself stays live.', 'مصدر المصنع فيه تلات فازات ونيوترال. الفاز الواحد بياخد فاز ونيوترال (230 فولت). الفازتين ياخدوا فازتين (400 فولت). التلات فاز ياخد التلاتة. كل أيزوليتور تحت بيقطع الطاقة دي بعده. المصدر نفسه بيفضل شغال.'), ids: ['supply'] },
    { id: 'one', c: '#3d7be0', t: A('2. Single and two phase points', '2. نقط الفاز الواحد والفازتين'), d: A('Lighting, sockets and small machines. A switch only controls. The breaker or the plug is the real isolation.', 'إنارة وبرايز وماكينات صغيرة. المفتاح بيتحكم بس. البريكر أو الفيشة هما العزل الحقيقي.'), ids: ['wallsw', 'plug', 'mcb1', 'mcb2'] },
    { id: 'three', c: '#f6a623', t: A('3. Three phase isolation', '3. عزل التلات فاز'), d: A('Machines and panels. These devices cut all three phases together and take a padlock or a lockout clip.', 'ماكينات ولوحات. الأجهزة دي بتقطع التلات فازات مع بعض وبتاخد قفل أو كليب لوتو.'), ids: ['mcb3', 'mccb', 'fuse', 'knife', 'rotary'] },
    { id: 'panel', c: '#4fc16a', t: A('4. Small control panel', '4. لوحة تحكم صغيرة'), d: A('One isolator on the door cuts the power. The buttons, the E-stop, the contactor and the PLC only control. Some terminals stay live even when the panel is isolated.', 'أيزوليتور واحد على الباب بيقطع الكهرباء. الأزرار والطوارئ والكونتاكتور والـPLC بتتحكم بس. فيه أطراف بتفضل شغالة حتى لو اللوحة معزولة.'), ids: ['panel', 'estop', 'contactor', 'psu24', 'plc'] },
    { id: 'mach', c: '#47BFD9', t: A('5. Machines (the loads)', '5. الماكينات (الأحمال)'), d: A('A machine is dead only after the isolator upstream is locked and the terminals test at 0 V.', 'الماكينة ميتة بعد ما الأيزوليتور اللي قبلها يتقفل والأطراف تقيس 0 فولت بس.'), ids: ['motor1', 'motor3', 'vfd'] },
    { id: 'fluid', c: '#7fd0ff', t: A('6. Air and fluid', '6. هوا وسوائل'), d: A('Close and lock the valve, then bleed the pressure that stays trapped downstream.', 'اقفل الفالف واقفله بقفل وبعدين فرّغ الضغط المحبوس بعده.'), ids: ['ballvalve', 'gatevalve', 'butterfly', 'qdc', 'frl'] },
    { id: 'stored', c: '#ff8b6a', t: A('7. Stored energy', '7. طاقة مخزنة'), d: A('Energy that is still there after the switch is off: pressure, charge, weight, springs and heat. Release it, then prove it is gone.', 'طاقة لسه موجودة بعد ما المفتاح يتفصل: ضغط وشحنة ووزن وسوست وحرارة. فرّغها وبعدين اثبت إنها اختفت.'), ids: ['receiver', 'accum', 'capbank', 'ram', 'spring', 'hotpipe'] },
    { id: 'kit', c: '#e5483b', t: A('8. LOTO kit', '8. عدة اللوتو'), d: A('What you carry: your own padlock, a hasp for the crew, a group box, a tag and a tester.', 'اللي بتشيله معاك: قفلك الشخصي وهاسب للفريق وصندوق جماعي وتاج وتستر.'), ids: ['padlock', 'hasp', 'lockbox', 'tag', 'tester'] },
  ];

  /* what the board shows once LOTO is applied */
  const APPLIED = {
    supply: A('The source is not locked here. Lock the isolator downstream, then test L1 L2 L3 and earth.', 'المصدر مش بيتقفل هنا. اقفل الأيزوليتور اللي بعده وبعدين اختبر L1 L2 L3 والأرضي.'),
    wallsw: A('Control only. The lamp wire is still live in the box. Lock the lighting breaker instead.', 'تحكم بس. سلك اللمبة لسه شغال في العلبة. اقفل بريكر الإنارة بدله.'),
    plug: A('Unplugged, plug lockout over the pins, padlock and tag. Prove 0 V at the machine.', 'الفيشة مسحوبة، غطا لوتو على الفيشة، قفل وتاج. اثبت 0 فولت عند الماكينة.'),
    mcb1: A('OFF, clip on the toggle, padlock, tag. Test the load side: 0 V.', 'OFF، كليب على الذراع، قفل وتاج. اختبر ناحية الحمل: 0 فولت.'),
    mcb2: A('Both poles OFF, 2-pole clip, padlock, tag. Test L to N and L to earth.', 'القطبين OFF، كليب 2 بول، قفل وتاج. اختبر L مع N وL مع الأرضي.'),
    mcb3: A('All three poles OFF, 3-pole clip, padlock, tag. Test L1 L2 L3 and earth.', 'التلات أقطاب OFF، كليب 3 بول، قفل وتاج. اختبر L1 L2 L3 والأرضي.'),
    mccb: A('OFF, handle lockout, padlock, tag. Test every phase pair and to earth.', 'OFF، لوتو على المقبض، قفل وتاج. اختبر كل فازين ومع الأرضي.'),
    fuse: A('Fuse carrier pulled out and locked in its holder, or the fuse switch OFF and locked. Test.', 'حامل الفيوز مسحوب ومقفول في مكانه، أو سويتش الفيوز OFF ومقفول. اختبر.'),
    knife: A('Blade open, padlock through the handle hole, tag. Test the load side.', 'السكينة مفتوحة، قفل في فتحة المقبض، تاج. اختبر ناحية الحمل.'),
    rotary: A('Handle at 0, padlock in the built-in hole, tag. Test downstream. The top terminals stay live.', 'المقبض على 0، قفل في الفتحة الجاهزة، تاج. اختبر اللي بعده. الأطراف اللي فوق بتفضل شغالة.'),
    panel: A('Main isolator OFF and padlocked, tag. Open the door, then prove-test-prove. Keep clear of the live top terminals.', 'الأيزوليتور الرئيسي OFF ومقفول، تاج. افتح الباب وبعدين جرّب-اختبر-جرّب. ابعد عن الأطراف الشغالة اللي فوق.'),
    estop: A('Control only. Pressing it stops the machine, it does not isolate it. Lock the main isolator.', 'تحكم بس. الضغط عليه بيوقف الماكينة لكن مبيعزلهاش. اقفل الأيزوليتور الرئيسي.'),
    contactor: A('Control only. Its contacts can stick closed. Isolate upstream and test.', 'تحكم بس. الكونتاكتات ممكن تلزق. اعزل قبله واختبر.'),
    psu24: A('Source of 24 V. Isolate its 230 V input, wait for the output to fall, test 0 V.', 'مصدر 24 فولت. اعزل دخل الـ230 فولت واستنى الخرج ينزل واختبر 0 فولت.'),
    plc: A('Control only. A program can start outputs by itself. Isolate upstream and test.', 'تحكم بس. البرنامج ممكن يشغّل مخارج لوحده. اعزل قبله واختبر.'),
    motor1: A('Dead only when its breaker or plug is locked. Then discharge the run capacitor.', 'ميت لما البريكر أو الفيشة تتقفل بس. وبعدين فرّغ كباسيتور التشغيل.'),
    motor3: A('Dead only when its isolator is locked. Test U V W at the terminals. The shaft can still be turned by the load.', 'ميت لما الأيزوليتور يتقفل بس. اختبر U V W عند الأطراف. العمود ممكن يتلف بالحمل.'),
    vfd: A('Lock its isolator, wait the label time, prove the DC bus is at 0 V.', 'اقفل الأيزوليتور بتاعه، استنى الوقت المكتوب، اثبت إن الـDC bus على 0 فولت.'),
    ballvalve: A('Lever closed, valve lockout, padlock, tag. Bleed downstream pressure to 0 bar.', 'الذراع مقفول، لوتو الفالف، قفل وتاج. فرّغ الضغط اللي بعده لـ0 بار.'),
    gatevalve: A('Wheel closed, wheel cover, padlock, tag. Bleed to 0 bar.', 'العجلة مقفولة، غطا العجلة، قفل وتاج. فرّغ لـ0 بار.'),
    butterfly: A('Lever closed in its notch, lockout plate, padlock, tag. Bleed to 0 bar.', 'الذراع مقفول في فتحته، لوح لوتو، قفل وتاج. فرّغ لـ0 بار.'),
    qdc: A('Coupling disconnected, lockout cap on the socket, padlock, tag. Vent the machine side.', 'الوصلة مفصولة، غطا لوتو على السوكت، قفل وتاج. فرّغ ناحية الماكينة.'),
    frl: A('Dump valve pulled shut (it vents the machine), padlock through its hole, tag. Gauge at 0 bar.', 'فالف التفريغ مقفول بالسحب (بيفرّغ الماكينة)، قفل في فتحته، تاج. العداد 0 بار.'),
    receiver: A('Inlet valve locked closed, drain open, gauge at 0 bar. Keep the drain open.', 'فالف الدخل مقفول بقفل، الدرين مفتوح، العداد 0 بار. سيب الدرين مفتوح.'),
    accum: A('Pump locked out, bleed valve open to tank, oil gauge at 0 bar. The gas pre-charge stays.', 'الطلمبة مقفولة، فالف التفريغ مفتوح للتانك، عداد الزيت 0 بار. شحنة الغاز بتفضل.'),
    capbank: A('Supply locked, wait done, discharged with a resistor stick. Meter reads 0 V.', 'المصدر مقفول، الانتظار خلص، التفريغ بعصاية مقاومة. الجهاز بيقرا 0 فولت.'),
    ram: A('Air isolated and vented, safety block under the ram, padlock on the block.', 'الهوا معزول ومفرّغ، بلوكة أمان تحت الرام، قفل على البلوكة.'),
    spring: A('Spring released or held by a pin. The pin carries a padlock.', 'السوستة متحررة أو ماسكها بنّ. البنّ عليه قفل.'),
    hotpipe: A('Isolated, drained and cooled. Surface below the limit, area barriered and tagged.', 'معزولة ومصرّفة ومبردة. حرارة السطح أقل من الحد، المنطقة محاطة بحاجز وتاج.'),
    padlock: A('Your own lock, your own key. The key stays on you.', 'قفلك انت ومفتاحك انت. المفتاح معاك.'),
    hasp: A('One hasp, one lock per worker. It stays until the last lock is off.', 'هاسب واحد وقفل لكل عامل. بيفضل لحد ما آخر قفل يتشال.'),
    lockbox: A('Keys of the point locks go in the box. Every worker locks the box.', 'مفاتيح أقفال النقط جوه الصندوق. كل عامل بيقفل الصندوق.'),
    tag: A('Name, date, reason and phone. Filled in before it is hung.', 'الاسم والتاريخ والسبب والتليفون. بيتملى قبل ما يتعلق.'),
    tester: A('Prove on a known source, test the point, prove again.', 'جرّب على مصدر معروف، اختبر النقطة، جرّب تاني.'),
  };
  const KIND = { iso: [A('Isolation device', 'جهاز عزل'), 'ok'], ctrl: [A('Control only', 'تحكم بس'), 'warn'], load: [A('Machine', 'ماكينة'), ''], source: [A('Energy source', 'مصدر طاقة'), ''], stored: [A('Stored energy', 'طاقة مخزنة'), 'info'], tool: [A('Kit item', 'من العدة'), ''] };
  const short = (d) => { const s = T(d.simple); const m = s.match(/^.*?[.!؟](\s|$)/); return m ? m[0].trim() : s; };
  const ic = (k, s) => L.icon(k, s || 72);

  /* ---------- tile ---------- */
  const lockedLook = (d) => d.cls === 'iso' || (d.cls === 'stored' && d.lockable !== false);
  function badges(d) {
    if (M.mode !== 'after') return null;
    const b = h('div', { class: 'mb-bd' });
    if (lockedLook(d)) { b.appendChild(h('span', { class: 'mb-b lk', html: ic('padlock_red', 26), title: 'lock' })); b.appendChild(h('span', { class: 'mb-b tg', html: ic('tag', 26) })); }
    else if (d.cls === 'ctrl') b.appendChild(h('span', { class: 'mb-b wn', text: '!' }));
    else if (d.cls === 'stored' || d.cls === 'load' || d.cls === 'source') b.appendChild(h('span', { class: 'mb-b ck', text: '✓' }));
    return b;
  }
  function tile(d) {
    const after = M.mode === 'after';
    const k = KIND[d.cls] || KIND.load;
    const wrap = h('div', { class: 'mb-tile' + (after ? ' k-' + d.cls : ''), role: 'button', tabindex: 0, onclick: () => LB.openDetail(d.id, after && d.lockable !== false && (d.cls === 'iso' || d.cls === 'stored' || d.cls === 'ctrl') ? { lock: true } : {}) });
    wrap.appendChild(h('div', { class: 'mb-ic' }, h('span', { html: ic(d.icon, 72) }), badges(d)));
    const tx = h('div', { class: 'mb-tx' }, h('b', { text: T(d.name) }), h('div', {}, h('span', { class: 'pill ' + k[1], text: T(k[0]) })), h('p', { text: short(d) }));
    if (after && APPLIED[d.id]) tx.appendChild(h('p', { class: 'mb-ap', text: T(APPLIED[d.id]) }));
    tx.appendChild(h('span', { class: 'mb-go', text: T(['Tap to look inside', 'اضغط عشان تشوف جوه']) }));
    wrap.appendChild(tx);
    return wrap;
  }

  /* ---------- audit: find the mistakes ---------- */
  const AUDIT = [
    ['rotary', A('Handle at 0, my padlock in the hole, tag on, tested 0 V downstream.', 'المقبض على 0، قفلي في الفتحة، التاج متعلق، واختبرت 0 فولت بعده.'), true, A('Correct: isolate, lock, tag, test.', 'صح: عزل وقفل وتاج واختبار.')],
    ['wallsw', A('I switched the lamp off at the wall switch and hung a tag on it.', 'طفيت اللمبة من مفتاح الحيط وعلقت عليه تاج.'), false, A('A switch is control, not isolation. The live wire is still in the box. Lock the lighting breaker.', 'المفتاح تحكم مش عزل. سلك الفاز لسه في العلبة. اقفل بريكر الإنارة.')],
    ['estop', A('E-stop pressed. I keep my hand near the reset so nobody releases it.', 'ضغطت الطوارئ وبفضل قريب من الريسيت عشان محدش يفكها.'), false, A('An E-stop is not isolation and a hand is not a lock. Lock the main isolator.', 'الطوارئ مش عزل واليد مش قفل. اقفل الأيزوليتور الرئيسي.')],
    ['ballvalve', A('Valve lever closed, lockout and padlock fitted. I did not look at the gauge.', 'ذراع الفالف مقفول، ركبت اللوتو والقفل. مبصتش على العداد.'), false, A('Pressure can be trapped downstream. Bleed it and read 0 bar.', 'الضغط ممكن يكون محبوس بعد الفالف. فرّغه واقرا 0 بار.')],
    ['receiver', A('Inlet locked, drain left open, gauge reads 0 bar after a minute.', 'الدخل مقفول، الدرين مفتوح، والعداد 0 بار بعد دقيقة.'), true, A('Correct: stored air is released and proven.', 'صح: الهوا المخزن اتفرّغ واتثبت.')],
    ['capbank', A('Drive supply locked. I opened the cover straight away to save time.', 'مصدر الانفرتر مقفول. فتحت الغطا على طول عشان أوفر وقت.'), false, A('The capacitors hold charge for minutes. Wait and prove 0 V on the DC bus.', 'الكباسيتورات بتشيل شحنة دقايق. استنى واثبت 0 فولت على الـDC bus.')],
    ['padlock', A('Padlock on, the only key is in my overall pocket.', 'القفل متركب والمفتاح الوحيد في جيب الأوفرول.'), true, A('Correct: one lock, one key, with its owner.', 'صح: قفل واحد ومفتاح واحد مع صاحبه.')],
    ['ram', A('Air valve closed and vented. The ram is up and I will reach under it quickly.', 'فالف الهوا مقفول ومفرّغ. الرام مرفوع وهمد إيدي تحته بسرعة.'), false, A('Gravity can drop it. Put a mechanical safety block under it and lock it.', 'الجاذبية ممكن تنزله. حط بلوكة أمان ميكانيكية تحته واقفلها.')],
    ['plug', A('Unplugged, plug lockout over the pins, my padlock and tag.', 'الفيشة مسحوبة، غطا لوتو عليها، قفلي والتاج.'), true, A('Correct: a visible break plus a lock.', 'صح: فصل مرئي مع قفل.')],
    ['hasp', A('Three of us on the job. We share my padlock to keep it simple.', 'إحنا تلاتة في الشغل. بنستخدم قفلي لوحده عشان نبسطها.'), false, A('Each person needs a personal lock on the hasp.', 'كل شخص محتاج قفل شخصي على الهاسب.')],
    ['tester', A('Tested the terminals and got 0 V. I did not prove the tester first.', 'اختبرت الأطراف وقرا 0 فولت. مجرّبتش التستر قبلها.'), false, A('A dead tester also shows 0 V. Prove, test, prove.', 'التستر الميت بيقرا 0 فولت كمان. جرّب، اختبر، جرّب.')],
    ['accum', A('Pump locked, bleed valve open to tank, oil gauge at 0 bar.', 'الطلمبة مقفولة، فالف التفريغ مفتوح للتانك، عداد الزيت 0 بار.'), true, A('Correct. The gas pre-charge staying is normal.', 'صح. بقاء شحنة الغاز طبيعي.')],
  ];
  function renderAudit(root) {
    const bad = AUDIT.filter((a) => !a[2]).length;
    root.appendChild(h('div', { class: 'card' }, h('b', { text: T(['Find the mistakes', 'اكتشف الغلطة']) }), h('p', { class: 'mute', text: T(['Twelve technicians describe what they did. Mark each one Safe or Not safe, then check. Tap a picture to look inside the device.', 'اتناشر فني بيوصفوا اللي عملوه. علّم على كل واحد: آمن أو مش آمن، وبعدين اتأكد. اضغط على الصورة تشوف جوه الجهاز.']) })));
    AUDIT.forEach(([id, said, ok, why]) => {
      const d = DT.map[id]; if (!d) return;
      const a = M.ans[id], res = M.checked ? (a === undefined ? 'miss' : (a === ok ? 'ok' : 'wrong')) : '';
      const set = (v) => { if (M.checked) return; M.ans[id] = v; M.rerender(); };
      const card = h('div', { class: 'card mb-au ' + (res ? 'r-' + res : '') },
        h('div', { class: 'row', style: { alignItems: 'flex-start' } }, h('span', { class: 'mb-aic', html: ic(d.icon, 56), onclick: () => LB.openDetail(id), style: { cursor: 'pointer' } }),
          h('div', { class: 'grow' }, h('b', { text: T(d.name) }), h('p', { style: { margin: '4px 0' }, text: '“' + T(said) + '”' }))),
        h('div', { class: 'row wrap' }, h('button', { class: 'btn sm' + (a === true ? ' on' : ''), onclick: () => set(true), text: T(['Safe', 'آمن']) }), h('button', { class: 'btn sm' + (a === false ? ' on' : ''), onclick: () => set(false), text: T(['Not safe', 'مش آمن']) })));
      if (M.checked) card.appendChild(h('p', { class: 'mb-why', text: (res === 'ok' ? '✔ ' : '✖ ' + T(['Not quite. ', 'مش بالظبط. '])) + T(why) }));
      root.appendChild(card);
    });
    const right = AUDIT.filter(([id, , ok]) => M.ans[id] === ok).length, caught = AUDIT.filter(([id, , ok]) => !ok && M.ans[id] === false).length, falseAlarm = AUDIT.filter(([id, , ok]) => ok && M.ans[id] === false).length;
    if (M.checked) root.appendChild(h('div', { class: 'card' }, h('b', { text: T(['Result: ', 'النتيجة: ']) + right + ' / ' + AUDIT.length }), h('p', { text: T(['Unsafe items found: ', 'الأخطاء اللي لقيتها: ']) + caught + ' / ' + bad + (falseAlarm ? T(['. Safe items you marked unsafe: ', '. حاجات آمنة علّمتها مش آمنة: ']) + falseAlarm : '') + '.' })));
    root.appendChild(h('div', { class: 'row', style: { margin: '8px 0 16px' } }, M.checked ? h('button', { class: 'btn', onclick: () => { M.ans = {}; M.checked = false; M.rerender(); }, text: T(['Try again', 'جرّب تاني']) }) : h('button', { class: 'btn pri', onclick: () => { M.checked = true; M.rerender(); }, text: T(['Check my answers', 'راجع إجاباتي']) })));
  }

  /* ---------- page ---------- */
  M.render = function (root, rerender) {
    M.rerender = rerender;
    root.appendChild(h('h3', { text: T(['Master board', 'اللوحة الشاملة']) }));
    root.appendChild(h('p', { class: 'mute', text: T(['A sample of everything you meet on site: switches, valves, single, two and three phase, a small control panel, machines, stored energy and the LOTO kit. Switch to "After LOTO" to see how each one is isolated. Tap any tile for the inside view.', 'عينة من كل اللي بتقابله في الموقع: مفاتيح وفالفات وفاز واحد وفازتين وتلات فازات ولوحة تحكم صغيرة وماكينات وطاقة مخزنة وعدة اللوتو. اختار "بعد اللوتو" تشوف كل واحد بيتعزل إزاي. اضغط على أي كارت تشوف جوه.']) }));
    const sg = h('div', { class: 'seg', style: { marginBottom: '10px' } });
    for (const [id, nm] of [['before', ['Before LOTO', 'قبل اللوتو']], ['after', ['After LOTO', 'بعد اللوتو']], ['audit', ['Find the mistakes', 'اكتشف الغلطة']]]) sg.appendChild(h('button', { class: 'btn' + (M.mode === id ? ' on' : ''), onclick: () => { M.mode = id; rerender(); }, text: T(nm) }));
    root.appendChild(sg);
    if (M.mode === 'audit') { renderAudit(root); return; }
    if (M.mode === 'after') root.appendChild(h('div', { class: 'mb-leg' },
      h('span', { class: 'mb-lg ok', text: T(['Green: isolation device, locked and tagged', 'أخضر: جهاز عزل، مقفول وعليه تاج']) }),
      h('span', { class: 'mb-lg wn', text: T(['Amber: control only, never rely on it', 'أصفر: تحكم بس، متعتمدش عليه']) }),
      h('span', { class: 'mb-lg bl', text: T(['Blue: stored energy released and proven', 'أزرق: طاقة مخزنة اتفرّغت واتثبتت']) }),
      h('span', { class: 'mb-lg gr', text: T(['Grey: machine or source, dead only after isolation', 'رمادي: ماكينة أو مصدر، ميت بعد العزل بس']) })));
    const chips = h('div', { class: 'row wrap', style: { margin: '6px 0 4px' } });
    ZONES.forEach((z) => chips.appendChild(h('button', { class: 'btn sm', onclick: () => { const el = root.querySelector('#mbz_' + z.id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, text: T(z.t).replace(/^\d+\.\s*/, '').split(':')[0] })));
    root.appendChild(chips);
    ZONES.forEach((z) => {
      const ds = z.ids.map((i) => DT.map[i]).filter(Boolean);
      root.appendChild(h('div', { class: 'mb-zone', id: 'mbz_' + z.id, style: '--zc:' + z.c }, h('h3', { text: T(z.t) }), h('p', { class: 'mute', text: T(z.d) })));
      const grid = h('div', { class: 'mb-grid' }); ds.forEach((d) => grid.appendChild(tile(d))); root.appendChild(grid);
    });
    root.appendChild(h('p', { class: 'mute sm', style: { marginTop: '14px' }, text: T(['Pictures are drawings for training. Your equipment may look different: add your own photos inside each device window.', 'الصور رسومات للتدريب. معداتك ممكن تبان مختلفة: ضيف صورك انت جوه نافذة كل جهاز.']) }));
  };
  M.zones = ZONES; M.audit = AUDIT; M.applied = APPLIED;
})(typeof window !== 'undefined' ? window : globalThis);
