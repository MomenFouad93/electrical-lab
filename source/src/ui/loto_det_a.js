/* LOTO device details, part A: breakers, isolators, fuses, control devices */
(function (g) {
  const EL = g.EL, L = EL.lotoData, DT = EL.lotoDet;
  if (!DT || !DT.h) return;
  const D = DT, { tr2, t, pl, ln, wire, W, ico, padlock, tag, rect, glow, lbl, screwTop, air, arrow, rr, cc, hl, dk, sc, F } = DT.h;

  /* ================= breakers ================= */
  const POLEC = [W.L1, W.L2, W.L3];
  const mcbFront = (poles, o) => {
    const pw = 104, Wd = pw * poles, x0 = Math.round((420 - Wd) / 2);
    let s = '';
    for (let i = 0; i < poles; i++) s += rr(x0 + i * pw, 14, pw, 272, 9, 'grey') + screwTop(x0 + i * pw + pw / 2, 32, 10) + screwTop(x0 + i * pw + pw / 2, 268, 10);
    s += rect(x0 + 12, 52, Wd - 24, 118, 10, '#1d2230', 'stroke="#0b0f19" stroke-width="1.4"');
    for (let i = 0; i < poles; i++) s += rr(x0 + i * pw + 22, o.on ? 58 : 108, pw - 44, 56, 8, 'black') + hl(x0 + i * pw + 28, o.on ? 62 : 112, 8, 40, 4, 0.35);
    if (poles > 1) s += rr(x0 + 6, o.on ? 78 : 128, Wd - 12, 12, 5, 'dark');
    s += t(x0 + 22, 48, 'I', 12, '#cfd8ea') + t(x0 + 22, 190, 'O', 12, '#cfd8ea');
    if (poles < 3) s += t(x0 - 12, 36, tr2('Supply side', 'ناحية المصدر'), 11, '#ff9a8c', 'end') + t(x0 - 12, 50, tr2('always live', 'شغالة دايمًا'), 10, '#ff9a8c', 'end', 500) + t(x0 - 12, 280, tr2('Load side', 'ناحية الحمل'), 11, '#9fb0cf', 'end');
    s += rect(x0 + 14, 196, Wd - 28, 54, 6, '#f4f6fb') + t(x0 + Wd / 2, 220, 'C16', 22, '#273049', 'middle', 800) + t(x0 + Wd / 2, 240, poles + 'P  ' + (poles === 1 ? '230 V' : '400 V') + '  IEC 60898', 10, '#4a556f', 'middle', 700);
    if (o.lock) {
      if (poles === 1) s += rr(x0 - 8, 98, Wd + 16, 80, 10, 'red') + hl(x0 - 4, 102, Wd + 8, 10, 5, 0.35) + dk(x0 + Wd + 2, 138, 9) + padlock(x0 + Wd - 6, 104, 1.1) + tag(x0 - 56, 150, 0.9);
      else s += rr(x0 - 16, 104, Wd + 32, 54, 8, 'red') + hl(x0 - 12, 108, Wd + 24, 9, 4, 0.35) + dk(x0 + Wd + 8, 131, 9) + padlock(x0 + Wd + 4, 102, 1.1) + tag(x0 - 44, 150, 0.9);
    }
    return s;
  };
  const mcbInside = (poles, o) => {
    const pw = 104, Wd = pw * poles, x0 = Math.round((420 - Wd) / 2);
    let s = '';
    for (let i = 0; i < poles; i++) {
      const px = x0 + i * pw, col = poles === 2 ? [W.L1, W.L2][i] : POLEC[i];
      s += `<rect x="${px + 2}" y="14" width="${pw - 4}" height="272" rx="8" fill="#26304a" stroke="#8b94a8" stroke-width="1.6" opacity=".6"/>`;
      s += wire(`M${px + 52} 0 V24`, col, 9) + rr(px + 22, 22, 60, 28, 3, 'brass') + screwTop(px + 52, 36, 8);
      s += pl(`M${px + 52} 52 q22 22 0 46`, '#0b0f19', 11) + pl(`M${px + 52} 52 q22 22 0 46`, '#f08a2c', 8) + pl(`M${px + 56} 58 q14 16 0 34`, '#ffd29c', 1.6, 'opacity=".8"');
      for (let k = 0; k < 6; k++) s += `<ellipse cx="${px + 52}" cy="${108 + k * 8}" rx="17" ry="4.4" fill="none" stroke="#0b0f19" stroke-width="5"/><ellipse cx="${px + 52}" cy="${108 + k * 8}" rx="17" ry="4.4" fill="none" stroke="${F('copper', { h: 1 })}" stroke-width="3"/>`;
      s += rect(px + 48, 154, 8, 34, 2, '#cfd5e3', 'stroke="#141a28" stroke-width="1"') + wire(`M${px + 52} 100 V108`, col, 5);
      const ax = o.on ? px + 36 : px + 48, ay = o.on ? 230 : 196;
      s += wire(`M${px + 84} 214 L${ax} ${ay}`, '#d77a3a', 8) + `<circle cx="${px + 84}" cy="214" r="5.5" fill="#141a28"/>` + wire(`M${px + 52} 100 q40 10 32 114`, col, 4);
      s += rr(px + 24, 226, 22, 12, 2, 'copper') + `<circle cx="${ax}" cy="${ay + 2}" r="4.5" fill="#e9eef7" stroke="#141a28" stroke-width="1"/>`;
      for (let k = 0; k < 5; k++) s += `<rect x="${px + 8 + k * 4.5}" y="200" width="2.6" height="${44}" fill="#9aa3b5" stroke="#141a28" stroke-width=".6"/>`;
      s += wire(`M${px + 34} 238 V262 H${px + 52} V286`, col, 6) + rr(px + 22, 260, 60, 26, 3, 'brass') + screwTop(px + 52, 273, 8);
      if (!o.on) s += air(px + 34, 226, 12, '#ff6b5e');
    }
    if (poles > 1) s += rect(x0 + 10, 190, Wd - 20, 7, 3, '#ff6b5e', 'stroke="#141a28" stroke-width="1"');
    return s;
  };
  const mcbSpots = (poles, o) => {
    const Wd = 104 * poles, x0 = Math.round((420 - Wd) / 2);
    if (!o.inside) return [[x0 + 52, 140, poles > 1 ? 'Handle tie' : 'Toggle', poles > 1 ? 'رباط المقابض' : 'المقبض', poles > 1 ? 'The handles are tied together, so one move switches all poles. The lockout bar goes across all of them.' : 'Up is ON, down is OFF. The lockout clip sits over it and holds it down.', poles > 1 ? 'المقابض متربطة ببعض فحركة واحدة بتفصل كل البولات. بار اللوتو بيعدّي على كلها.' : 'فوق ON وتحت OFF. كليب اللوتو بيتحط عليه وبيمسكه تحت.'], [x0 + Wd / 2, 222, 'Rating label', 'لوحة البيانات', 'C16 = trips at 16 A thermal, magnetic at 5 to 10 times the rating. IEC 60898 is the household/light industrial standard.', 'C16 = بيفصل حراريًا عند 16 أمبير ومغناطيسيًا من 5 لـ10 أضعاف. IEC 60898 معيار المنازل والصناعة الخفيفة.'], [x0 + 52, 32, 'Terminals', 'الأطراف', 'Incoming supply at the top is still live on the terminal screw even when the breaker is OFF. Treat the top as live.', 'المصدر الداخل من فوق بيفضل عليه كهرباء على مسمار الطرف حتى لو البريكر OFF. اعتبر فوق شغال.']];
    return [[x0 + 52, 36, 'Terminal', 'الطرف', 'The supply screw. Always live from the busbar side.', 'مسمار المصدر. عليه كهرباء دايمًا من ناحية البسبار.'], [x0 + 70, 78, 'Bimetal (thermal)', 'البايمتال (حراري)', 'Heats and bends with overload current. Slow: it trips in seconds to minutes.', 'بيسخن وينحني مع تيار الحمل الزيادة. بطيء: بيفصل في ثواني لدقايق.'], [x0 + 52, 128, 'Coil and plunger (magnetic)', 'الملف والبلنجر (مغناطيسي)', 'A short circuit throws the plunger out in milliseconds and opens the contacts.', 'القصر بيرمي البلنجر في أجزاء من الثانية وبيفتح الكونتاكت.'], [x0 + 36, 240, 'Contacts', 'الكونتاكت', o.on ? 'Closed: current flows.' : 'Open: a few millimetres of air. Visible only when you open the breaker.', o.on ? 'مقفول: التيار بيعدّي.' : 'مفتوح: كام مللي هوا. مبيبانش إلا لما تفتح البريكر.'], [x0 + 20, 190, 'Arc chute', 'غرفة القوس', 'Steel plates split and cool the arc when the contacts open under load.', 'ألواح صلب بتقسّم القوس وتبرّده لما الكونتاكت يفتح تحت حمل.'], ...(poles > 1 ? [[x0 + Wd / 2, 193, 'Trip tie bar', 'بار الفصل المشترك', 'If one pole trips, this bar opens all poles. A 3-phase motor must never keep running on two phases.', 'لو بول فصل البار ده بيفتح الباقي. موتور 3 فاز مينفعش يفضل شغال على فازتين.']] : [])];
  };
  const mcbDef = (id, poles, nameEn, nameAr, simple, feeds, lockSteps) => D.def({
    id, group: 'elec', cls: 'iso', icon: poles === 1 ? 'mcb' : poles === 2 ? 'mcb' : 'mcb3_clip', ptype: poles === 1 ? 'mcb' : null, state: [['OFF', 'OFF'], ['ON', 'ON']],
    name: [nameEn, nameAr], simple, feeds,
    draw: (o) => (o.inside ? mcbInside(poles, o) : mcbFront(poles, o)),
    out: (o) => mcbSpots(poles, Object.assign({}, o, { inside: false })), in: (o) => mcbSpots(poles, Object.assign({}, o, { inside: true })),
    lock: lockSteps,
    prove: [['After switching OFF, test the load side with a two-pole tester across every pair and to earth.', 'بعد الـOFF اختبر ناحية الحمل بالتستر بين كل الأزواج ومع الأرضي.'], ['The supply side of the breaker stays live. Never touch its upper terminals.', 'ناحية المصدر في البريكر بتفضل شغالة. متلمسش أطرافه العليا.']],
    mistakes: [['Putting the lock on the cabinet door but not on the breaker toggle.', 'القفل على باب اللوحة مش على مقبض البريكر.'], ['Using a breaker that has tripped as an isolation point: a tripped breaker can be reset by someone else.', 'اعتبار بريكر فاصل (تريب) نقطة عزل: حد تاني ممكن يرجّعه.'], ['Forgetting that the breaker terminals above are live.', 'نسيان إن الأطراف العلوية شغالة.']],
    std: ['IEC 60947-2 / 60898. A breaker with a lockable handle is accepted as an isolation point only if it is marked as suitable for isolation.', 'IEC 60947-2 / 60898. البريكر ليه مقبض بيتقفل بيتقبل كنقطة عزل بس لو مكتوب عليه إنه صالح للعزل.'],
  });
  mcbDef('mcb1', 1, 'Breaker 1-pole (single phase, MCB)', 'ميني بريكر بول واحد (فاز واحد)', ['A DIN-rail breaker that protects one circuit and also switches it. A 1-pole breaker opens only the phase wire. For single phase isolation a 2-pole device (phase and neutral) is better. The clip over the toggle keeps it OFF.', 'بريكر DIN rail بيحمي دايرة وبيفصلها. البول الواحد بيفتح سلك الفاز بس. لعزل فاز واحد الأفضل بريكر 2 بول (فاز ونيوترال). الكليب فوق المقبض بيخليه OFF.'], ['Feeds: socket or lighting circuits, 230 V.', 'بيغذّي: دواير بريزات أو إنارة 230 فولت.'], [['Switch the breaker OFF.', 'اقفل البريكر OFF.'], ['Fit the MCB lockout clip over the toggle.', 'ركّب كليب لوتو الميني بريكر على المقبض.'], ['Add your padlock and tag.', 'حط قفلك والتاج.']]);
  mcbDef('mcb2', 2, 'Breaker 2-pole (two phases or phase + neutral)', 'بريكر 2 بول (فازتين أو فاز ونيوترال)', ['Two poles tied together. Used for two-phase loads (400 V between L1 and L2) or for single phase with neutral switching. Both poles open together, and the tied handle is locked with one bar.', 'بولين متربطين. بيتستخدم لأحمال فازتين (400 فولت بين L1 وL2) أو لفاز واحد مع قطع النيوترال. البولين بيفتحوا مع بعض والمقبض المربوط بيتقفل بقطعة واحدة.'], ['Feeds: small heaters, 400 V two-phase loads, or 230 V with neutral isolation.', 'بيغذّي: سخانات صغيرة، أحمال 400 فولت فازتين، أو 230 فولت مع عزل النيوترال.'], [['Switch OFF the tied handle.', 'اقفل المقبض المربوط OFF.'], ['Fit the multi-pole lockout bar across both toggles.', 'ركّب بار اللوتو على المقبضين.'], ['Add your padlock and tag.', 'حط قفلك والتاج.']]);
  mcbDef('mcb3', 3, 'Breaker 3-pole (three phase, MCB)', 'بريكر 3 بول (ثلاث فازات)', ['Three poles with a common trip bar. It protects and switches a three-phase circuit. A bar over the three tied toggles holds all of them OFF, and one padlock on the bar is enough for one person.', 'تلات بولات بيشتركوا في بار فصل. بيحمي ويفصل دايرة 3 فاز. بار فوق التلات مقابض بيمسكهم كلهم OFF وقفل واحد على البار يكفي لشخص واحد.'], ['Feeds: 3-phase motors and panels, 400 V.', 'بيغذّي: موتورات ولوحات 3 فاز 400 فولت.'], [['Switch OFF the three tied toggles.', 'اقفل التلات مقابض OFF.'], ['Fit the 3-pole lockout bar.', 'ركّب بار لوتو 3 بول.'], ['Add your padlock and tag. If several people work, add a hasp.', 'حط قفلك والتاج. لو ناس كتير ضيف هاسب.']]);
  D.byType.mcb = 'mcb1';

  /* ---- moulded case breaker ---- */
  D.def({
    id: 'mccb', group: 'elec', cls: 'iso', icon: 'mccb', ptype: 'mccb', state: [['OFF', 'OFF'], ['ON', 'ON']],
    name: ['Moulded case breaker (MCCB, 3 pole)', 'بريكر MCCB (3 بول)'],
    simple: ['The big breaker in a main panel. It has a wide handle with three positions: ON, OFF and TRIPPED (middle). A tripped breaker is not isolated: someone can reset it. Lock it in the OFF position with a wide-handle clip. Its trip settings are adjustable with dials.', 'البريكر الكبير في اللوحة الرئيسية. مقبضه عريض وليه 3 أوضاع: ON وOFF وفاصل (في النص). البريكر الفاصل مش معزول: حد ممكن يعمل ريسيت. اقفله على OFF بكليب مقبض عريض. إعدادات الفصل بتتظبط بمقابض دوّارة.'],
    feeds: ['Feeds: a machine or a sub-panel, up to hundreds of amps.', 'بيغذّي: ماكينة أو لوحة فرعية لحد مئات الأمبير.'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += rr(50, 12, 320, 276, 16, 'dark') + rr(66, 28, 288, 40, 6, 'black') + [0, 1, 2].map((i) => screwTop(110 + i * 100, 48, 11)).join('');
        s += rr(66, 232, 288, 40, 6, 'black') + [0, 1, 2].map((i) => screwTop(110 + i * 100, 252, 11)).join('');
        s += rect(94, 82, 232, 66, 10, '#10141f', 'stroke="#0b0f19"') + rr(o.on ? 104 : 196, 90, 120, 50, 8, 'black') + hl(o.on ? 110 : 202, 94, 8, 40, 4, 0.35) + t(116, 78, 'ON', 11, '#7cf09a') + t(304, 78, 'OFF', 11, '#ff8b80') + t(210, 164, 'TRIP', 10, '#ffd27a');
        s += cc(130, 198, 20, 'domeB') + `<path d="M130 198 L142 184" stroke="#e9eef7" stroke-width="4" stroke-linecap="round"/>` + t(130, 230, 'Ir', 11, '#cfd8ea') + cc(210, 198, 20, 'domeB') + `<path d="M210 198 L198 186" stroke="#e9eef7" stroke-width="4" stroke-linecap="round"/>` + t(210, 230, 'Im', 11, '#cfd8ea');
        s += rect(252, 178, 90, 44, 5, '#f4f6fb') + t(297, 198, '100 A', 18, '#273049', 'middle', 800) + t(297, 214, '3P  Icu 25 kA', 9, '#4a556f', 'middle', 700);
        if (o.lock) s += rr(90, 70, 250, 88, 12, 'red') + hl(94, 74, 242, 10, 5, 0.35) + dk(318, 114, 10) + padlock(300, 76, 1.2) + tag(52, 150, 1.0);
      } else {
        s += `<rect x="50" y="12" width="320" height="276" rx="16" fill="#26304a" stroke="#8b94a8" stroke-width="1.8" opacity=".65"/>`;
        for (let i = 0; i < 3; i++) {
          const px = 70 + i * 100, col = POLEC[i];
          s += wire(`M${px + 40} 0 V30`, col, 10) + rr(px + 10, 26, 60, 28, 4, 'copper') + screwTop(px + 40, 40, 9);
          s += wire(`M${px + 40} 54 V84`, col, 7) + rr(px + 26, 84, 28, 12, 2, 'copper') + wire(`M${px + 40} 54 H${px + 66} V72`, col, 6);
          const ax = o.on ? px + 38 : px + 80, ay = o.on ? 100 : 44;
          s += wire(`M${px + 66} 72 L${ax} ${ay}`, '#d77a3a', 9) + `<circle cx="${px + 66}" cy="72" r="6" fill="#141a28"/><circle cx="${ax}" cy="${ay + 2}" r="5" fill="#e9eef7" stroke="#141a28"/>`;
          for (let k = 0; k < 6; k++) s += `<rect x="${px + 6 + k * 4.4}" y="94" width="2.6" height="40" fill="#9aa3b5" stroke="#141a28" stroke-width=".6"/>`;
          s += pl(`M${px + 40} 136 q22 20 0 40`, '#0b0f19', 11) + pl(`M${px + 40} 136 q22 20 0 40`, '#f08a2c', 8);
          for (let k = 0; k < 5; k++) s += `<ellipse cx="${px + 40}" cy="${184 + k * 7}" rx="17" ry="4" fill="none" stroke="#0b0f19" stroke-width="5"/><ellipse cx="${px + 40}" cy="${184 + k * 7}" rx="17" ry="4" fill="none" stroke="${F('copper', { h: 1 })}" stroke-width="3"/>`;
          s += wire(`M${px + 40} 176 V184`, col, 5) + wire(`M${px + 40} 214 V258`, col, 7) + rr(px + 10, 252, 60, 28, 4, 'copper') + screwTop(px + 40, 266, 9);
          if (!o.on) s += air(px + 30, 100, 16, '#ff6b5e');
        }
        s += rect(66, 220, 288, 8, 3, '#ff6b5e', 'stroke="#141a28"');
      }
      return s;
    },
    out: [[210, 114, 'Wide handle', 'المقبض العريض', 'Three positions: ON, OFF and TRIP (middle). After a trip you must push it fully to OFF and then ON. The lockout clip holds it at OFF.', 'تلات أوضاع: ON وOFF وTRIP (في النص). بعد الفصل لازم تزوده لآخر OFF وبعدين ON. كليب اللوتو بيمسكه على OFF.'], [130, 198, 'Thermal dial (Ir)', 'مقبض الحراري (Ir)', 'Sets the overload current. Turned too high, the cable can overheat before the breaker trips.', 'بيظبط تيار الأوفرلود. لو عالي زيادة الكابل ممكن يسخن قبل ما البريكر يفصل.'], [210, 198, 'Magnetic dial (Im)', 'مقبض المغناطيسي (Im)', 'Sets the short-circuit pickup. Too high and a fault far away may not trip it.', 'بيظبط حد القصر. لو عالي زيادة قصر بعيد ممكن ميفصلهوش.'], [110, 48, 'Line terminals (top)', 'أطراف الدخل (فوق)', 'Always live: the lock does not make them safe.', 'دايمًا شغالة: القفل مش بيأمّنها.']],
    in: [[110, 40, 'Line lug', 'طرف الدخل', 'Copper lug for the cable or busbar. Live from the supply even when OFF.', 'طرف نحاس للكابل أو البسبار. عليه كهرباء من المصدر حتى OFF.'], [110, 98, 'Contact and arc chute', 'الكونتاكت وغرفة القوس', 'Heavy contacts open fast. The plates split the arc so it cools and goes out.', 'كونتاكت تقيل بيفتح بسرعة. الألواح بتقسّم القوس عشان يبرد ويطفي.'], [110, 156, 'Thermal bimetal', 'البايمتال الحراري', 'Bends with heat from overload current.', 'بينحني بسخونة تيار الأوفرلود.'], [110, 198, 'Magnetic coil', 'الملف المغناطيسي', 'A strong magnetic pull on a short circuit opens the contacts almost instantly.', 'سحب مغناطيسي قوي مع القصر بيفتح الكونتاكت فورًا.'], [210, 224, 'Common trip bar', 'بار الفصل المشترك', 'Joins the three poles so they open together.', 'بيربط التلات بولات فيفتحوا مع بعض.']],
    lock: [['Switch the handle fully to OFF (after a trip: push to OFF first).', 'حرّك المقبض لآخر OFF (بعد الفصل: زوده OFF الأول).'], ['Fit the wide-handle lockout clip.', 'ركّب كليب لوتو المقبض العريض.'], ['Add your padlock and tag. For a team add a hasp or a group lock box.', 'حط قفلك والتاج. للفريق ضيف هاسب أو صندوق أقفال.']],
    prove: [['Test the load terminals: all pairs and to earth. Test your tester on a known source before and after.', 'اختبر أطراف الحمل: كل الأزواج ومع الأرضي. جرّب التستر على مصدر معروف قبل وبعد.']],
    mistakes: [['Locking a tripped breaker: it is not OFF, only tripped.', 'قفل بريكر فاصل (تريب): مش OFF، ده فاصل بس.'], ['Trusting the line terminals after OFF: they are still live.', 'الاعتماد على أطراف الدخل بعد OFF: لسه شغالة.']],
    std: ['IEC 60947-2. Suitable for isolation only if marked with the isolator symbol.', 'IEC 60947-2. صالح للعزل بس لو عليه رمز العزل.'],
  });

  /* ================= rotary isolator ================= */
  D.def({
    id: 'rotary', group: 'elec', cls: 'iso', icon: 'rotary', ptype: 'rotary', state: [['0 OFF', '0 OFF'], ['I ON', 'I ON']],
    name: ['Rotary isolator (main switch)', 'سويتش عزل دوّار (مين سويتش)'],
    simple: ['A load-break switch with a turning handle. It opens all three phases together with a visible-style double break per pole. The handle has a hole for padlocks in the OFF position, so it locks directly. On a panel door it is also the door interlock.', 'سويتش بيفصل تحت حمل وليه مقبض بيلف. بيفتح التلات فازات مع بعض وكل بول ليه قطع مزدوج. المقبض فيه فتحة للأقفال في وضع OFF فبيتقفل على طول. وعلى باب اللوحة هو كمان قفل الباب.'],
    feeds: ['Feeds: a machine or a whole panel, usually 3-phase 400 V.', 'بيغذّي: ماكينة أو لوحة كاملة، غالبًا 3 فاز 400 فولت.'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += rr(96, 8, 228, 284, 16, 'grey') + [[110, 22], [310, 22], [110, 278], [310, 278]].map((p) => sc(p[0], p[1], 6)).join('');
        s += rr(116, 30, 188, 160, 12, 'yellow') + t(150, 62, 'I', 20, '#7a2a00') + t(210, 50, 'ON', 12, '#7a2a00', 'middle', 800) + t(270, 62, '0', 20, '#7a2a00') + t(268, 80, 'OFF', 10, '#7a2a00', 'middle', 800);
        s += cc(210, 120, 48, 'domeB') + cc(210, 120, 30, 'black');
        const rot = o.on ? -90 : 0;
        s += `<g transform="rotate(${rot} 210 120)"><rect x="196" y="108" width="116" height="24" rx="10" fill="${F('red', { h: 0 })}" stroke="#141a28" stroke-width="1.6"/><rect x="258" y="100" width="54" height="40" rx="14" fill="${F('red')}" stroke="#141a28" stroke-width="1.6"/>${hl(262, 104, 44, 7, 3, 0.45)}<rect x="304" y="114" width="26" height="12" rx="3" fill="${F('steel')}" stroke="#141a28" stroke-width="1.2"/><circle cx="321" cy="120" r="3.6" fill="#0e1119"/></g>`;
        s += rect(116, 204, 188, 68, 6, '#f4f6fb') + t(210, 232, '63 A', 24, '#273049', 'middle', 800) + t(210, 252, 'AC-23  IEC 60947-3', 11, '#4a556f') + t(210, 266, tr2('Isolator', 'عازل'), 9, '#4a556f', 'middle', 600);
        if (o.lock) s += padlock(308, 112, 1.35) + tag(246, 176, 1.0);
      } else {
        s += `<rect x="48" y="8" width="324" height="284" rx="14" fill="#26304a" stroke="#8b94a8" stroke-width="1.8" opacity=".6"/>`;
        s += rect(60, 117, 300, 8, 3, F('steel', { h: 0 }), 'stroke="#141a28" stroke-width="1"');
        [110, 210, 310].forEach((cx, i) => {
          const col = POLEC[i];
          s += wire(`M${cx - 34} 0 V30`, col, 8) + rr(cx - 56, 26, 44, 26, 3, 'copper') + screwTop(cx - 34, 39, 7) + t(cx - 34, 66, String(i * 2 + 1), 11, '#cfd8ea');
          s += wire(`M${cx - 34} 52 V121`, col, 6) + rr(cx - 46, 110, 24, 22, 3, 'steel') + `<circle cx="${cx - 34}" cy="121" r="6" fill="#e9eef7" stroke="#141a28"/>`;
          s += wire(`M${cx + 34} 121 V256`, col, 6) + rr(cx + 22, 110, 24, 22, 3, 'steel') + `<circle cx="${cx + 34}" cy="121" r="6" fill="#e9eef7" stroke="#141a28"/>`;
          s += rr(cx - 56, 250, 44, 28, 3, 'copper', {}).replace(/x="[\d.-]+"/, `x="${cx + 12}"`) + screwTop(cx + 34, 264, 7) + t(cx + 34, 292, String(i * 2 + 2), 11, '#cfd8ea');
          const rot = o.on ? 0 : 82;
          s += `<g transform="rotate(${rot} ${cx} 121)"><rect x="${cx - 46}" y="114" width="92" height="14" rx="5" fill="${F('brass', { h: 0 })}" stroke="#141a28" stroke-width="1.4"/><circle cx="${cx - 38}" cy="121" r="5" fill="#e9eef7" stroke="#141a28"/><circle cx="${cx + 38}" cy="121" r="5" fill="#e9eef7" stroke="#141a28"/></g>`;
          s += cc(cx, 121, 7, 'domeB');
          if (!o.on) s += air(cx + 10, 100, 18, '#ff6b5e') + air(cx - 28, 100, 18, '#ff6b5e');
        });
        s += rr(150, 196, 120, 40, 6, 'blue') + t(210, 220, tr2('Aux contact', 'كونتاكت مساعد'), 10, '#fff');
      }
      return s;
    },
    out: [[210, 120, 'Handle', 'المقبض', 'Turn to 0 (OFF). In OFF the handle tab lines up with the padlock hole, so you can lock it directly. It cannot be turned to I while locked.', 'لفّه على 0 (OFF). في OFF الفتحة بتتحاذى مع قفل اللوتو فتقفله على طول. مينفعش يتلف لـI وهو مقفول.'], [210, 232, 'Rating plate', 'لوحة البيانات', 'Check the rating (A), the utilisation category (AC-23 = motor loads) and that it is marked as an isolator.', 'اتأكد من الأمبير والفئة (AC-23 = أحمال موتور) وإنه مكتوب عليه عازل.'], [308, 30, 'Mounting screws', 'مسامير التثبيت', 'The enclosure is not the isolation. Behind it the line terminals stay live.', 'الغلاف مش هو العزل. وراه أطراف الدخل بتفضل شغالة.']],
    in: [[76, 39, 'Line terminals 1, 3, 5', 'أطراف الدخل 1 و3 و5', 'Incoming supply. Still live in OFF: keep fingers away.', 'المصدر الداخل. لسه شغال في OFF: بعّد إيدك.'], [76, 121, 'Fixed contacts', 'الكونتاكت الثابت', 'Silver-plated pads. Each pole has two, so the current is broken in two places.', 'مطلي فضة. كل بول فيه اتنين فالتيار بيتقطع في مكانين.'], [110, 121, 'Rotating bridge', 'الكوبري الدوّار', 'Turns 90 degrees with the handle. In OFF it stands upright: you can see the gap.', 'بيلف 90 درجة مع المقبض. في OFF بيقف عمودي: الفجوة واضحة.'], [210, 100, 'Air gap', 'فجوة الهوا', 'The gap in OFF is large and fixed by the cam, so the switch can be used as an isolator.', 'الفجوة في OFF كبيرة وثابتة بالكام فالسويتش يصلح عازل.'], [210, 216, 'Auxiliary contact', 'كونتاكت مساعد', 'Opens before the main contacts and tells the control circuit to stop first.', 'بيفتح قبل الرئيسي وبيقول للتحكم يوقّف الأول.']],
    lock: [['Stop the machine normally first (the isolator is not made to break big fault current).', 'وقّف الماكينة عادي الأول (السويتش مش معمول لقطع تيار القصر).'], ['Turn the handle to 0 (OFF).', 'لف المقبض على 0 (OFF).'], ['Put your personal padlock through the handle hole, add a tag. For several people use a hasp.', 'حط قفلك في فتحة المقبض وضيف تاج. لأكتر من شخص استخدم هاسب.']],
    prove: [['Open the panel (if your procedure allows) and test the load terminals with a two-pole tester, all pairs and to earth, proving the tester before and after.', 'افتح اللوحة (لو الإجراء بيسمح) واختبر أطراف الحمل بالتستر بين كل الأزواج ومع الأرضي، وجرّب التستر قبل وبعد.'], ['Remember: the line terminals of this isolator are still live.', 'افتكر: أطراف الدخل في السويتش ده لسه شغالة.']],
    mistakes: [['Locking the door interlock but not the handle.', 'قفل قفل الباب من غير قفل المقبض.'], ['Using the handle override to open the door and leaving the isolator ON.', 'استخدام مفتاح فتح الباب بالقوة وسيب السويتش ON.']],
    std: ['IEC 60947-3 and IEC 60204-1 (6.3): the supply disconnecting device must be lockable in OFF.', 'IEC 60947-3 وIEC 60204-1 (6.3): جهاز فصل التغذية لازم يتقفل في OFF.'],
  });

  /* ================= fuse switch / knife ================= */
  D.def({
    id: 'knife', group: 'elec', cls: 'iso', icon: 'knife', ptype: 'knife', state: [['Open', 'مفتوح'], ['Closed', 'مقفول']],
    name: ['Knife-blade (fuse) switch', 'سكينة فصل (فيوز سويتش)'],
    simple: ['An old but very clear isolator. The blades swing out of their jaws and you can see the gap with your own eyes. Many have fuses in the blades. Take care: the hinge side or the jaws on the line side can stay live.', 'عازل قديم بس واضح جدًا. الشفرات بتطلع من الفكوك وانت شايف الفجوة بعينك. كتير منها فيه فيوزات في الشفرات. خد بالك: ناحية الهينج أو الفكوك ناحية المصدر ممكن تفضل شغالة.'],
    feeds: ['Feeds: older motors and panels, 400 V.', 'بيغذّي: موتورات ولوحات قديمة 400 فولت.'],
    draw(o) {
      let s = rr(60, 12, 300, 276, 12, 'white') + rect(76, 28, 268, 244, 6, '#aab2c3', 'opacity=".25"');
      [110, 210, 310].forEach((cx, i) => {
        s += rr(cx - 20, 30, 40, 30, 4, 'copper') + rr(cx - 20, 236, 40, 30, 4, 'copper') + screwTop(cx, 45, 7) + screwTop(cx, 251, 7);
        s += rr(cx - 13, 56, 8, 26, 2, 'copper') + rr(cx + 5, 56, 8, 26, 2, 'copper');
        const ang = o.on ? 0 : 24 + i * 0;
        s += `<g transform="rotate(${-ang} ${cx} 236)"><rect x="${cx - 8}" y="62" width="16" height="176" rx="3" fill="${F('copper', { h: 1 })}" stroke="#141a28" stroke-width="1.4"/><rect x="${cx - 12}" y="116" width="24" height="76" rx="6" fill="${F('cream')}" stroke="#141a28" stroke-width="1.4"/><rect x="${cx - 14}" y="110" width="28" height="9" rx="3" fill="${F('brass')}" stroke="#141a28"/><rect x="${cx - 14}" y="189" width="28" height="9" rx="3" fill="${F('brass')}" stroke="#141a28"/></g>`;
      });
      const ang2 = o.on ? 0 : 24;
      s += `<g transform="rotate(${-ang2} 210 236)"><rect x="96" y="70" width="228" height="18" rx="6" fill="${F('black', { h: 0 })}" stroke="#141a28" stroke-width="1.4"/><rect x="196" y="44" width="28" height="30" rx="8" fill="${F('red')}" stroke="#141a28" stroke-width="1.4"/><rect x="204" y="40" width="12" height="10" rx="2" fill="${F('steel')}" stroke="#141a28"/><circle cx="210" cy="45" r="2.6" fill="#0e1119"/></g>`;
      if (!o.on) s += air(150, 90, 40, '#ff6b5e') + t(210, 283, tr2('The gap is visible', 'الفجوة باينة'), 12, '#2f8a4a');
      if (o.lock) s += padlock(o.on ? 220 : 228, 8, 1.1) + tag(336, 180, 0.9);
      return s;
    },
    hasInside: false,
    out: (o) => [[210, 56, 'Handle bar', 'ذراع التشغيل', 'Moves all three blades together. A padlock goes through the handle hole.', 'بيحرّك التلات شفرات مع بعض. القفل بيدخل في فتحة الذراع.'], [110, 150, 'Fuse in the blade', 'فيوز في الشفرة', 'Many knife switches carry the fuse in the blade: opening the switch also takes the fuse out of the circuit.', 'كتير من السكاكين فيها الفيوز في الشفرة: فتح السكينة بيطلّع الفيوز من الدايرة.'], [110, 245, 'Hinge terminal', 'طرف الهينج', 'The hinge is the line side on many boards: live even with the switch open. Check which side is the supply.', 'الهينج في لوحات كتير هو ناحية المصدر: شغال حتى والسكينة مفتوحة. اتأكد أنهي ناحية المصدر.'], [110, 70, 'Jaw (clip)', 'الفك', 'The blade seats into the jaw. Worn jaws overheat: look for burn marks.', 'الشفرة بتقعد في الفك. الفكوك البالية بتسخن: دوّر على علامات حرق.']],
    lock: [['Open the blades fully and check the gap by eye.', 'افتح الشفرات آخرها وشوف الفجوة بعينك.'], ['Fit a padlock through the handle hole or use a hasp and a cable lock.', 'حط قفل في فتحة الذراع أو استخدم هاسب وكابل لوتو.'], ['Add a tag.', 'حط تاج.']],
    prove: [['Test the load side of the fuses to each other and to earth.', 'اختبر ناحية الحمل بين الفيوزات وبعض ومع الأرضي.']],
    mistakes: [['Working at the hinge terminals thinking an open switch means dead.', 'الشغل على أطراف الهينج على أساس إن السكينة المفتوحة يعني ميتة.'], ['Opening a knife switch under heavy load: it can arc over.', 'فتح سكينة تحت حمل تقيل: ممكن يحصل قوس.']],
    std: ['A visible break is the strongest form of isolation.', 'الفصل المرئي هو أقوى شكل من العزل.'],
  });

  /* ================= fuse ================= */
  D.def({
    id: 'fuse', group: 'elec', cls: 'iso', icon: 'fuse', ptype: 'fuse', state: [['Fuse removed', 'الفيوز مشال'], ['Fuse in', 'الفيوز مركّب']],
    name: ['Fuse holder and fuse', 'قاعدة فيوز وفيوز'],
    simple: ['A fuse is a deliberate weak link: the thin element melts on overload or short circuit. A fuse holder with a pull-out carrier can isolate a circuit: take the fuse out and lock the carrier or the empty holder. Never refit a fuse of a different rating.', 'الفيوز نقطة ضعف متعمدة: السلك الرفيع بيدوب مع الأوفرلود أو القصر. قاعدة الفيوز اللي بيتسحب منها الحامل ممكن تعزل دايرة: شيل الفيوز واقفل الحامل أو القاعدة الفاضية. متركّبش فيوز بأمبير مختلف.'],
    feeds: ['Feeds: control circuits, small loads, motor branches.', 'بيغذّي: دواير تحكم، أحمال صغيرة، فروع موتورات.'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += rr(130, 10, 110, 280, 12, 'grey') + rr(150, 30, 70, 40, 4, 'brass') + rr(150, 230, 70, 40, 4, 'brass') + screwTop(185, 50, 9) + screwTop(185, 250, 9);
        s += rect(150, 82, 70, 136, 8, '#1d2230', 'stroke="#0b0f19"');
        if (o.on) s += rr(158, 92, 54, 116, 8, 'cream') + rr(152, 86, 66, 18, 5, 'brass') + rr(152, 196, 66, 18, 5, 'brass') + pl('M185 108 V192', '#c9a227', 2);
        else s += `<g transform="translate(150,10) rotate(0)">${rr(130, 70, 54, 116, 8, 'cream')}${rr(124, 64, 66, 18, 5, 'brass')}${rr(124, 174, 66, 18, 5, 'brass')}${pl('M157 88 V170', '#c9a227', 2)}</g>` + t(300, 56, tr2('Fuse in hand', 'الفيوز في إيدك'), 11, '#9fb0cf') + arrow(284, 64, 266, 80, '#9fb0cf');
        if (o.lock) s += rr(120, 76, 130, 150, 10, 'red') + hl(124, 80, 122, 10, 5, 0.35) + dk(236, 150, 9) + padlock(222, 76, 1.2) + tag(80, 140, 0.9);
      } else {
        s += rr(40, 100, 340, 100, 22, 'cream') + rr(30, 112, 26, 76, 6, 'brass') + rr(364, 112, 26, 76, 6, 'brass');
        let dots = ''; for (let i = 0; i < 90; i++) { dots += `<circle cx="${70 + (i * 37) % 280}" cy="${108 + (i * 23) % 84}" r="1.6" fill="#b79f6c" opacity=".55"/>`; }
        s += dots + wire('M56 150 H110 L124 128 L138 172 L152 128 L166 150 H250 L264 128 L278 172 L292 128 L306 150 H364', '#e9eef7', 3);
        s += `<path d="M175 150 h60" stroke="#ff6b5e" stroke-width="2" stroke-dasharray="3 3"/>` + rr(384, 138, 20, 24, 4, 'red');
        s += t(210, 240, tr2('Ceramic body filled with sand', 'جسم سيراميك مليان رمل'), 11, '#9fb0cf');
      }
      return s;
    },
    out: (o) => [[185, 50, 'Holder terminals', 'أطراف القاعدة', 'Both terminals of an empty holder can still be live on the supply side.', 'الطرفين في القاعدة الفاضية ممكن يفضلوا شغالين ناحية المصدر.'], [o.on ? 185 : 340, o.on ? 150 : 146, 'Fuse carrier', 'حامل الفيوز', 'Pulling it out opens the circuit. A lockout cover keeps it from being pushed back.', 'سحبه بيفتح الدايرة. غطا اللوتو بيمنع إنه يتدفع تاني.']],
    in: [[56, 150, 'End cap', 'الطرف النحاس', 'Contact surface. Poor contact here makes the fuse hot.', 'سطح التلامس. تلامس وحش هنا بيسخّن الفيوز.'], [138, 150, 'Narrow neck', 'عنق ضيق', 'The element is thinnest here, so it melts first on overload.', 'السلك هنا أرفع حتة فبيدوب الأول مع الأوفرلود.'], [210, 120, 'Sand filler', 'الرمل', 'Absorbs the energy and quenches the arc when the element melts.', 'بيمتص الطاقة ويطفي القوس لما السلك يدوب.'], [394, 150, 'Indicator', 'المؤشر', 'A small pin pops out when the fuse has blown.', 'دبوس صغير بيطلع لما الفيوز يحرق.']],
    lock: [['Switch the load off, then pull the fuse carrier or the fuse.', 'وقّف الحمل وبعدين اسحب حامل الفيوز أو الفيوز.'], ['Fit the fuse lockout cover over the carrier or the empty holder.', 'ركّب غطا لوتو الفيوز على الحامل أو القاعدة الفاضية.'], ['Add your padlock and tag. Keep the fuse with you.', 'حط قفلك والتاج. خلّي الفيوز معاك.']],
    prove: [['Test the load side of the holder with a two-pole tester.', 'اختبر ناحية الحمل في القاعدة بالتستر.']],
    mistakes: [['Replacing a blown fuse with a bigger one or a wire: the cable then protects the circuit by burning.', 'تغيير فيوز محروق بأكبر أو بسلك: الكابل هيبقى هو الحماية وهيحترق.'], ['Pulling a fuse under load: arcing.', 'سحب فيوز تحت حمل: قوس.']],
    std: ['IEC 60269. A fuse is protection, not an isolator, unless it is in a fuse-disconnector.', 'IEC 60269. الفيوز حماية مش عازل، إلا لو في فيوز ديسكونكتور.'],
  });

  /* ================= contactor ================= */
  D.def({
    id: 'contactor', group: 'elec', cls: 'ctrl', icon: 'contactor', lockable: false, state: [['De-energised', 'مفصول'], ['Energised', 'متغذي']],
    name: ['Contactor (motor switching)', 'كونتاكتور (تشغيل الموتور)'],
    simple: ['A contactor is an electrically operated switch. A coil pulls an armature in and three power contacts close. It starts and stops the motor all day, but it is NOT an isolator: contacts can weld shut, an armature can be pressed by hand or held in by a PLC output, and the terminals above it stay live. Isolate upstream.', 'الكونتاكتور مفتاح بيشتغل بالكهرباء. ملف بيشد الأرمتشر وتلات كونتاكتات قوة بيقفلوا. بيشغّل ويوقّف الموتور طول اليوم بس هو مش عازل: الكونتاكت ممكن يلحم، والأرمتشر ممكن حد يضغط عليه بإيده أو PLC يمسكه، والأطراف فوقه شغالة. اعزل من قبله.'],
    feeds: ['Feeds: a motor or heater, switched by a control signal.', 'بيغذّي: موتور أو سخان، بيتشغل بإشارة تحكم.'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += rr(100, 14, 220, 272, 12, 'dark') + [150, 210, 270].map((x, i) => rr(x - 22, 24, 44, 30, 4, 'steel') + screwTop(x, 39, 8) + t(x, 70, String(i * 2 + 1), 11, '#cfd8ea') + rr(x - 22, 246, 44, 30, 4, 'steel') + screwTop(x, 261, 8) + t(x, 238, String(i * 2 + 2), 11, '#cfd8ea')).join('');
        s += rect(130, 96, 160, 84, 6, '#f4f6fb') + t(210, 128, 'KM1', 26, '#273049', 'middle', 800) + t(210, 148, 'AC-3  25 A', 11, '#4a556f') + t(210, 164, tr2('Coil 24 V DC', 'ملف 24 فولت DC'), 11, '#4a556f');
        s += rr(112, 78, 22, 14, 3, 'steel') + t(123, 76, 'A1', 9, '#cfd8ea') + rr(112, 196, 22, 14, 3, 'steel') + t(123, 222, 'A2', 9, '#cfd8ea');
        s += rr(176, 192, 68, 34, 6, 'grey') + t(210, 213, tr2('push to test', 'اضغط للتجربة'), 9, '#4a556f', 'middle', 700) + (o.on ? glow(210, 209, 40, '#4fc16a') : '');
        s += rr(326, 60, 52, 90, 6, 'dark') + t(352, 88, '13', 9, '#cfd8ea') + t(352, 134, '14', 9, '#cfd8ea') + t(352, 112, 'AUX', 9, '#9fb0cf');
      } else {
        s += `<rect x="90" y="8" width="240" height="284" rx="12" fill="#26304a" stroke="#8b94a8" stroke-width="1.8" opacity=".6"/>`;
        const cy = o.on ? 112 : 130, ay = o.on ? 154 : 176;
        [150, 210, 270].forEach((x, i) => {
          const col = POLEC[i];
          s += wire(`M${x - 18} 0 V30`, col, 7) + rr(x - 40, 28, 44, 22, 3, 'steel') + wire(`M${x - 18} 50 V84`, col, 5) + rect(x - 36, 82, 20, 9, 2, '#e08f55', 'stroke="#141a28"');
          s += wire(`M${x + 18} 292 V270`, col, 7) + wire(`M${x + 18} 270 V84`, col, 5) + rect(x + 6, 82, 22, 9, 2, '#e08f55', 'stroke="#141a28"');
          s += rr(x - 38, cy, 72, 10, 2, 'copper') + `<circle cx="${x - 30}" cy="${cy}" r="3.5" fill="#e9eef7"/><circle cx="${x + 28}" cy="${cy}" r="3.5" fill="#e9eef7"/>` + `<rect x="${x - 3}" y="${cy + 10}" width="6" height="${ay - cy - 8}" fill="#8b94a8"/>`;
          if (!o.on) s += air(x - 20, 92, 28, '#ff6b5e');
        });
        s += pl(`M118 ${cy + 8} q-10 7 0 13 t0 13 t0 13 t0 13`, '#cfd5e3', 3) + pl(`M302 ${cy + 8} q10 7 0 13 t0 13 t0 13 t0 13`, '#cfd5e3', 3);
        s += rr(150, ay, 120, 22, 3, 'steel') + `<rect x="150" y="${ay + 22}" width="22" height="12" fill="#8b94a8"/><rect x="248" y="${ay + 22}" width="22" height="12" fill="#8b94a8"/>`;
        s += rr(140, 196, 140, 66, 4, 'dark');
        for (let k = 0; k < 6; k++) s += `<ellipse cx="210" cy="${206 + k * 9}" rx="36" ry="5" fill="none" stroke="#0b0f19" stroke-width="6"/><ellipse cx="210" cy="${206 + k * 9}" rx="36" ry="5" fill="none" stroke="${F('copper', { h: 1 })}" stroke-width="4"/>`;
        s += rect(190, 196, 40, 66, 2, '#5c6478', 'opacity=".6"') + t(210, 285, o.on ? tr2('Energised: the armature is pulled in', 'متغذي: الأرمتشر مشدود') : tr2('Spring holds the contacts open', 'السوستة ماسكة الكونتاكت مفتوح'), 11, '#9fb0cf');
        if (!o.on) s += air(150, ay + 38, 24, '#ffd27a') + t(334, 196, tr2('air gap', 'فجوة'), 10, '#ffd27a', 'end');
      }
      return s;
    },
    out: [[150, 39, 'Terminals 1, 3, 5 (line)', 'أطراف 1 و3 و5 (دخل)', 'Supply side: live all the time. Opening the contactor does not remove it.', 'ناحية المصدر: شغالة طول الوقت. فصل الكونتاكتور مبيشيلهاش.'], [210, 209, 'Test button', 'زرار التجربة', 'Pressing it closes the contacts by hand. A hand or a tool can start the motor even with the coil dead.', 'الضغط عليه بيقفل الكونتاكت بإيدك. إيد أو أداة تقدر تشغّل الموتور والملف ميت.'], [123, 85, 'Coil terminals A1/A2', 'أطراف الملف A1/A2', 'The coil can be fed from another panel. Isolating the power circuit does not remove that voltage.', 'الملف ممكن يتغذى من لوحة تانية. عزل دايرة القوة مبيشيلش الجهد ده.'], [286, 108, 'Rating label', 'لوحة البيانات', 'AC-3 = motor starting duty. Check the coil voltage before testing.', 'AC-3 = شغل تشغيل موتور. اتأكد من جهد الملف قبل ما تختبر.']],
    in: [[150, 112, 'Moving contacts', 'الكونتاكت المتحرك', 'Silver bridge contacts. They can weld together after a short circuit and then stay closed with the coil dead.', 'كوبري فضة. ممكن يلحموا بعد قصر ويفضلوا مقفولين والملف ميت.'], [118, 150, 'Return spring', 'سوستة الرجوع', 'Pushes the armature back and opens the contacts when the coil loses power.', 'بتزقّ الأرمتشر وتفتح الكونتاكت لما الملف يفصل.'], [210, 165, 'Armature', 'الأرمتشر', 'The moving iron. A PLC output, a relay or a hand can keep it pulled in.', 'الحديد المتحرك. خرج PLC أو ريلاي أو إيد تقدر تمسكه مشدود.'], [210, 230, 'Coil', 'الملف', 'A few watts hold the contacts. When the coil is dead it only means no control signal, not isolation.', 'كام وات بس بيمسكوا الكونتاكت. الملف الميت معناه مفيش إشارة تحكم، مش عزل.'], [172, 70, 'Fixed contacts', 'الكونتاكت الثابت', 'Upper pair is the line side, always live.', 'الزوج العلوي ناحية المصدر، شغال دايمًا.']],
    lock: [['A contactor cannot be locked as an isolation point.', 'الكونتاكتور مينفعش يتقفل كنقطة عزل.'], ['Isolate upstream: the breaker or the rotary isolator feeding it.', 'اعزل من قبله: البريكر أو السويتش اللي بيغذّيه.'], ['Treat its line terminals as live.', 'اعتبر أطرافه العلوية شغالة.']],
    prove: [['Test the motor side terminals 2, 4, 6 after isolating upstream.', 'اختبر أطراف الموتور 2 و4 و6 بعد العزل من فوق.']],
    mistakes: [['Switching the contactor off and starting work on the motor.', 'فصل الكونتاكتور والبدء في الشغل على الموتور.'], ['Believing "the PLC output is off, so it is safe".', 'اعتقاد إن "خرج الـPLC مطفي يبقى آمن".']],
    std: ['IEC 60947-4-1. Contactors are switching devices, not isolators.', 'IEC 60947-4-1. الكونتاكتور جهاز تشغيل مش عازل.'],
  });

  /* ================= emergency stop ================= */
  D.def({
    id: 'estop', group: 'elec', cls: 'ctrl', icon: 'estop', ptype: 'estop', state: [['Released', 'مفكوك'], ['Pressed (latched)', 'مضغوط (محبوس)']], block: ['A cover on a stop button only keeps people from pressing or releasing it. It does not cut any energy, so it is not LOTO.', 'غطا زرار الستوب بيمنع الناس من الضغط أو الفك بس. مش بيقطع أي طاقة، فمش لوتو.'],
    name: ['Emergency stop button', 'زرار الطوارئ'],
    simple: ['The red mushroom stops the machine fast in an emergency. Inside it opens two normally-closed contacts with a forced mechanism. It is a control device: it tells the controller to stop, it does not isolate the machine. You can put a cover on it, but that is not an isolation.', 'الزرار الأحمر بيوقّف الماكينة بسرعة في الطوارئ. جواه بيفتح كونتاكتين NC بميكانيزم إجباري. هو جهاز تحكم: بيقول للكنترولر يوقّف، مش بيعزل الماكينة. ممكن تحط عليه غطا بس ده مش عزل.'],
    feeds: ['Sits in the control circuit (24 V or 230 V).', 'موجود في دايرة التحكم (24 فولت أو 230 فولت).'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += rr(120, 200, 180, 70, 10, 'yellow') + rr(166, 160, 88, 44, 6, 'black');
        s += `<ellipse cx="210" cy="${o.on ? 128 : 112}" rx="104" ry="64" fill="${F('red')}" stroke="#141a28" stroke-width="1.6"/><ellipse cx="210" cy="${o.on ? 120 : 102}" rx="80" ry="40" fill="url(#lg_domeR) #e5483b"/><ellipse cx="170" cy="${o.on ? 100 : 82}" rx="30" ry="12" fill="#fff" opacity=".45" transform="rotate(-18 170 ${o.on ? 100 : 82})"/>`;
        s += t(210, 244, 'EMERGENCY STOP', 15, '#5a3a00', 'middle', 800);
        if (o.lock) s += `<path d="M96 ${o.on ? 128 : 112} a114 74 0 0 1 228 0 v6 q0 14 -14 14 h-200 q-14 0 -14 -14z" fill="#e5483b" opacity=".4" stroke="#fff" stroke-width="2"/>` + rr(280, 150, 60, 34, 8, 'red') + dk(310, 167, 7) + padlock(296, 126, 1.0) + tag(70, 140, 0.9) + t(210, 288, tr2('Cover only: NOT an isolation', 'غطا بس: مش عزل'), 12, '#ff8b80');
      } else {
        s += rr(110, 30, 200, 250, 14, 'dark', {}) + `<rect x="110" y="30" width="200" height="250" rx="14" fill="#26304a" stroke="#8b94a8" stroke-width="1.8" opacity=".6"/>`;
        s += rect(198, 40, 24, 110, 4, '#cfd5e3', 'stroke="#141a28"') + `<ellipse cx="210" cy="40" rx="44" ry="14" fill="${F('red')}" stroke="#141a28"/>`;
        s += pl(`M170 70 q-12 6 0 12 t0 12 t0 12`, '#cfd5e3', 3) + pl(`M250 70 q12 6 0 12 t0 12 t0 12`, '#cfd5e3', 3);
        const barY = o.on ? 150 : 190;
        [150, 270].forEach((x) => { s += rr(x - 44, 198, 88, 56, 5, 'dark') + rect(x - 36, 194, 22, 8, 2, '#e08f55') + rect(x + 14, 194, 22, 8, 2, '#e08f55') + wire(`M${x - 44} 230 H${x - 62}`, W.C24, 5) + wire(`M${x + 44} 230 H${x + 62}`, W.C24, 5) + rr(x - 38, barY, 76, 8, 2, 'copper') + (o.on ? air(x - 30, 182, 60, '#ff6b5e') : ''); });
        s += rect(204, 150, 12, 40, 2, '#8b94a8') + (o.on ? '' : '');
        s += t(210, 274, o.on ? tr2('Pressed: contacts forced open and latched', 'مضغوط: الكونتاكت اتفتح وانحبس') : tr2('Released: normally-closed contacts carry the signal', 'مفكوك: كونتاكت NC شايل الإشارة'), 11, '#9fb0cf');
      }
      return s;
    },
    out: [[210, 100, 'Mushroom head', 'الراس الفطر', 'Press to stop. It latches down. Twist or pull to release. A cover over it only blocks hands.', 'اضغط عشان توقّف. بيتحبس تحت. لف أو شد عشان تفك. الغطا بيمنع الإيدين بس.'], [138, 236, 'Yellow collar', 'الحلقة الصفرا', 'The yellow and red colours mean emergency. They are required by the standard.', 'الأصفر والأحمر معناهم طوارئ. المعيار بيطلبهم.']],
    in: [[150, 224, 'NC contact block', 'بلوك الكونتاكت NC', 'Two normally-closed contacts in series for redundancy. Pressing the button forces them open.', 'كونتاكتين NC على التوالي للأمان. الضغط على الزرار بيفتحهم بالقوة.'], [210, 120, 'Plunger and latch', 'الساق والمزلاج', 'Holds the button down after a press so it stays stopped until someone releases it on purpose.', 'بيمسك الزرار تحت بعد الضغط فيفضل واقف لحد ما حد يفكه قصدًا.'], [170, 82, 'Spring', 'السوستة', 'Pops the head up when it is released.', 'بتطلّع الراس لما يتفك.']],
    lock: [['An E-stop is not an isolation point. Do not use it for LOTO.', 'زرار الطوارئ مش نقطة عزل. متستخدمهوش في اللوتو.'], ['If your procedure asks for a button cover, fit it as an extra reminder only.', 'لو الإجراء بيطلب غطا الزرار، ركّبه كتذكرة إضافية بس.'], ['Isolate at the breaker or isolator.', 'اعزل عند البريكر أو السويتش.']],
    prove: [['Try to start the machine from its normal controls, then test the power terminals as usual.', 'جرّب تشغل الماكينة من الكنترول العادي وبعدين اختبر أطراف القوة زي المعتاد.']],
    mistakes: [['Pressing E-stop and starting work.', 'الضغط على الطوارئ والبدء في الشغل.'], ['Locking an E-stop and calling it "isolated".', 'قفل زرار الطوارئ وتسميته "معزول".']],
    std: ['ISO 13850 / IEC 60204-1: emergency stop is a protective measure, not an isolation (LOTO) method.', 'ISO 13850 / IEC 60204-1: الطوارئ إجراء حماية مش وسيلة عزل (لوتو).'],
  });
  D.byType.pushbtn = 'estop';

  /* ================= 24 V power supply ================= */
  D.def({
    id: 'psu24', group: 'elec', cls: 'source', icon: 'psu', lockable: false,
    name: ['24 V DC power supply (control voltage)', 'باور سبلاي 24 فولت DC (جهد التحكم)'],
    simple: ['It turns 230 V AC into 24 V DC for the PLC, sensors and relays. After the main isolator is OFF this unit may still be fed from another panel, and the control wires may carry foreign voltage. Its output capacitors hold charge for a few seconds. Isolate its own input breaker and prove 24 V is gone.', 'بيحوّل 230 فولت AC لـ24 فولت DC للـPLC والسنسورات والريلايات. بعد ما المين سويتش يبقى OFF الوحدة دي ممكن تفضل متغذية من لوحة تانية، وأسلاك التحكم ممكن فيها جهد غريب. الكباسيتورات في الخرج بتشيل شحنة كام ثانية. اعزل بريكر الدخل بتاعها وتأكد إن الـ24 فولت راحت.'],
    feeds: ['Feeds: PLC, sensors, relay coils, pilot lights.', 'بيغذّي: الـPLC والسنسورات وملفات الريلاي ولمبات البيان.'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += rr(130, 10, 160, 280, 10, 'steel') + rr(142, 20, 136, 38, 4, 'black') + [165, 210, 255].map((x) => screwTop(x, 36, 9)).join('') + t(165, 54, 'L', 10, '#cfd8ea') + t(210, 54, 'N', 10, '#cfd8ea') + t(255, 54, 'PE', 10, '#cfd8ea');
        s += rect(142, 232, 136, 46, 6, '#10141f') + [165, 210, 255].map((x) => screwTop(x, 250, 9)).join('') + t(165, 270, '+', 14, '#ff8b80') + t(255, 270, '−', 14, '#9fb0cf');
        s += rect(152, 82, 116, 128, 6, '#f4f6fb') + t(210, 114, '24 V DC', 22, '#273049', 'middle', 800) + t(210, 134, '10 A', 14, '#4a556f') + t(210, 154, 'IN 100-240 V AC', 10, '#4a556f') + cc(188, 184, 7, 'green') + t(204, 188, 'DC OK', 10, '#2f6b3a', 'start') + `<circle cx="244" cy="184" r="8" fill="#e08f55" stroke="#141a28"/><path d="M244 177 v14" stroke="#141a28" stroke-width="1.4"/>`;
      } else {
        const bx = (x, y, w, h, l1, l2) => rr(x, y, w, h, 6, 'dark') + t(x + w / 2, y + h / 2 - (l2 ? 2 : -4), l1, 10, '#fff', 'middle', 700) + (l2 ? t(x + w / 2, y + h / 2 + 11, l2, 10, '#fff', 'middle', 700) : '');
        s += wire('M0 150 H18', W.L1, 6) + bx(18, 116, 78, 68, tr2('Fuse', 'فيوز'), tr2('and filter', 'وفلتر')) + arrow(98, 150, 120, 150, '#ff9a8c');
        s += bx(122, 116, 70, 68, tr2('Rectifier', 'مقوّم')) + arrow(194, 150, 214, 150, '#ff9a8c');
        s += rr(130, 196, 22, 46, 6, 'blue') + rr(160, 196, 22, 46, 6, 'blue') + t(156, 262, tr2('Bulk capacitors', 'كباسيتورات كبيرة'), 10, '#ff9a8c') + t(156, 276, '325 V DC', 10, '#ff9a8c');
        s += bx(216, 116, 70, 68, tr2('Switching', 'سويتشنج'), tr2('transistor', 'ترانزستور')) + arrow(288, 150, 304, 150, '#ff9a8c');
        s += cc(318, 138, 11, 'copper') + cc(336, 138, 11, 'copper') + cc(318, 162, 11, 'copper') + cc(336, 162, 11, 'copper') + t(327, 192, tr2('Transformer', 'ترانس'), 10, '#9fb0cf') + t(327, 205, tr2('(isolates)', '(بيعزل)'), 10, '#9fb0cf') + wire('M348 150 H372', W.C24, 6);
        s += rr(374, 128, 40, 44, 6, 'blue') + t(394, 154, '24 V', 11, '#f6a623', 'middle', 800) + t(394, 184, tr2('output', 'كباسيتور'), 9, '#9fb0cf') + t(394, 196, tr2('caps', 'الخرج'), 9, '#9fb0cf');
      }
      return s;
    },
    hasInside: true,
    out: [[210, 22, 'AC input', 'دخل AC', 'Mains in. Isolate the breaker that feeds this terminal before touching.', 'كهرباء المين داخلة. اعزل البريكر اللي بيغذي الطرف ده قبل ما تلمس.'], [210, 114, '24 V DC output', 'خرج 24 فولت', 'Low voltage, but fed to many devices. A short can still burn a wire.', 'جهد واطي بس موصل لأجهزة كتير. القصر ممكن يحرق سلك.'], [188, 184, 'DC OK LED', 'لمبة DC OK', 'Green means output present. Off does not prove isolation: always measure.', 'أخضر يعني فيه خرج. لو طفت مش دليل عزل: قيس دايمًا.']],
    in: [[30, 126, 'Input fuse and filter', 'فيوز وفلتر الدخل', 'Protects the supply. The fuse may blow if the unit fails.', 'بيحمي المصدر. الفيوز ممكن يحرق لو الوحدة بوظت.'], [141, 206, 'Bulk capacitors', 'الكباسيتورات الكبيرة', 'Hold about 325 V DC for several seconds after the supply is cut. Wait before opening the unit.', 'بتشيل حوالي 325 فولت DC كام ثانية بعد قطع المصدر. استنى قبل ما تفتح الوحدة.'], [327, 150, 'Transformer', 'الترانس', 'Separates the mains side from the 24 V side. Both sides need their own check.', 'بيفصل ناحية المين عن ناحية الـ24 فولت. كل ناحية ليها قياسها.'], [394, 138, 'Output capacitors', 'كباسيتورات الخرج', 'Hold 24 V for a short time after switch-off.', 'بتشيل 24 فولت فترة قصيرة بعد الفصل.']],
    lock: [['The unit has no lock point. Lock the breaker that feeds its L and N input.', 'الوحدة مفيهاش نقطة قفل. اقفل البريكر اللي بيغذّي L وN.'], ['Check if the 24 V also comes from another source (a second PSU, a battery, an external signal).', 'اتأكد لو الـ24 فولت بتيجي كمان من مصدر تاني (باور تاني، بطارية، إشارة خارجية).']],
    prove: [['Measure the output + to − and to earth. Wait for the capacitors. Prove the meter on a known source.', 'قيس الخرج + مع − ومع الأرضي. استنى الكباسيتورات. جرّب الجهاز على مصدر معروف.']],
    mistakes: [['Forgetting that a 24 V circuit can be fed from a different panel.', 'نسيان إن دايرة 24 فولت ممكن تتغذى من لوحة تانية.'], ['Opening the unit seconds after switching off.', 'فتح الوحدة بعد الفصل بثواني.']],
    std: ['IEC 61558 / EN 61010: output may be SELV, the input is not.', 'IEC 61558 / EN 61010: الخرج ممكن يكون SELV لكن الدخل لأ.'],
  });

  /* ================= PLC ================= */
  D.def({
    id: 'plc', group: 'elec', cls: 'ctrl', icon: 'plc', lockable: false,
    name: ['PLC and its outputs', 'الـPLC وخرجه'],
    simple: ['The PLC decides, it does not isolate. A switched-off output, a "STOP" mode or a software interlock can fail or be changed. Output relays can stick. Some inputs and outputs are wired to a different supply, so a PLC with its own power off can still have live terminals (foreign voltage).', 'الـPLC بيقرر بس مش بيعزل. خرج مطفي أو وضع STOP أو انترلوك برمجي ممكن يفشل أو يتغير. ريلايات الخرج ممكن تلزق. بعض الدخول والخروج متوصلة بمصدر تاني، فـPLC مفصول عنه الكهرباء ممكن يفضل عليه جهد في أطرافه (جهد غريب).'],
    feeds: ['Controls: contactors, valves, lamps.', 'بيتحكم في: كونتاكتورات وفالفات ولمبات.'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += rr(20, 60, 380, 180, 8, 'dark');
        const mod = (x, w, name, leds, c) => rr(x, 72, w, 156, 5, 'grey') + t(x + w / 2, 94, name, 10, '#273049') + leds.map((on, i) => `<circle cx="${x + 12 + (i % 4) * ((w - 24) / 3)}" cy="${112 + Math.floor(i / 4) * 16}" r="4.4" fill="${on ? (c || '#4fc16a') : '#43506e'}" stroke="#141a28" stroke-width=".8"/>`).join('') + [0, 1, 2, 3].map((i) => screwTop(x + 12 + i * ((w - 24) / 3), 70, 5) + screwTop(x + 12 + i * ((w - 24) / 3), 232, 5)).join('');
        s += mod(30, 60, 'PS', [1], '#4fc16a') + mod(94, 80, 'CPU', [1, 0, 0, 0], '#4fc16a') + mod(178, 100, 'DI 8', [1, 0, 1, 0, 0, 1, 0, 0]) + mod(282, 108, 'DO 8 relay', [0, 0, 1, 0, 0, 0, 0, 0], '#ffd27a');
        s += t(210, 262, tr2('A dark LED does not mean dead', 'لمبة مطفية مش معناها ميت'), 11, '#9fb0cf');
      } else {
        s += rr(30, 40, 360, 220, 10, 'dark') + `<rect x="30" y="40" width="360" height="220" rx="10" fill="#26304a" stroke="#8b94a8" stroke-width="1.8" opacity=".6"/>`;
        s += rr(46, 56, 90, 70, 6, 'green') + t(91, 96, 'CPU', 14, '#fff') + arrow(138, 92, 160, 92, '#7cf09a');
        s += rr(162, 56, 96, 70, 6, 'dark') + t(210, 88, tr2('Optocoupler', 'أوبتوكابلر'), 10, '#fff') + t(210, 104, tr2('input', 'دخل'), 10, '#fff') + wire('M258 92 H312', W.C24, 5) + t(346, 66, tr2('from a sensor', 'من سنسور'), 10, '#9fb0cf') + rr(312, 72, 60, 40, 5, 'steel') + t(342, 96, '24 V', 11, '#273049');
        s += rr(162, 140, 96, 100, 6, 'dark') + t(210, 160, tr2('Relay output', 'خرج ريلاي'), 10, '#fff');
        for (let k = 0; k < 4; k++) s += `<ellipse cx="184" cy="${178 + k * 8}" rx="14" ry="3.4" fill="none" stroke="${F('copper', { h: 1 })}" stroke-width="3"/>`;
        s += rect(222, 186, 22, 8, 2, '#e08f55') + (o.on ? rect(222, 194, 22, 8, 2, '#e08f55') : '') + wire('M258 206 H312', W.L1, 6) + rr(312, 184, 64, 52, 5, 'yellow') + t(344, 206, tr2('Foreign', 'جهد'), 10, '#7a2a00') + t(344, 220, tr2('voltage', 'غريب'), 10, '#7a2a00') + t(344, 254, '230 V', 12, '#ff9a8c', 'middle', 800);
        s += t(210, 282, tr2('The PLC can be OFF and this terminal still live', 'الـPLC ممكن يبقى OFF والطرف ده شغال'), 11, '#ffd27a');
      }
      return s;
    },
    hasInside: true,
    out: [[60, 92, 'Power module', 'موديول التغذية', 'Its LED only says the module is fed. It does not say anything about the other circuits.', 'لمبته بتقول إن الموديول متغذي بس. مش بتقول حاجة عن باقي الدواير.'], [130, 112, 'CPU LEDs', 'لمبات الـCPU', 'RUN or STOP is software. Stop mode does not isolate any output wiring.', 'RUN أو STOP برنامج. وضع STOP مبيعزلش أي توصيل خرج.'], [230, 112, 'Input LEDs', 'لمبات الدخل', 'A lit LED means a signal is present, including a signal from another source.', 'اللمبة منورة تعني إن فيه إشارة، حتى لو من مصدر تاني.'], [336, 128, 'Output LEDs', 'لمبات الخرج', 'A dark LED does not prove the output wire is dead. A stuck relay or foreign voltage can still be there.', 'لمبة مطفية مش دليل إن سلك الخرج ميت. ريلاي لازق أو جهد غريب ممكن يكون موجود.']],
    in: [[56, 66, 'CPU', 'الـCPU', 'Runs the program. A bug or a forced output can switch a load on.', 'بيشغّل البرنامج. غلطة أو فورس لخرج ممكن يشغّل حمل.'], [172, 66, 'Optocoupler', 'أوبتوكابلر', 'Separates the field signal from the CPU with light. The field wire can still carry 24 V.', 'بيفصل إشارة الحقل عن الـCPU بالضوء. سلك الحقل ممكن يفضل عليه 24 فولت.'], [172, 150, 'Relay coil', 'ملف الريلاي', 'Pulls in the output contact. The contact can weld.', 'بيشد كونتاكت الخرج. الكونتاكت ممكن يلحم.'], [322, 194, 'Foreign voltage', 'جهد غريب', 'A load supply wired through the PLC terminals from another source. Isolate that source too.', 'تغذية حمل جاية من مصدر تاني على أطراف الـPLC. اعزل المصدر ده كمان.']],
    lock: [['A PLC has no lock point. Isolate the supply of the PLC and of every circuit wired to it.', 'الـPLC مفيهوش نقطة قفل. اعزل تغذية الـPLC وكل دايرة متوصلة بيه.'], ['Look for foreign-voltage labels (often orange wires or a warning sticker).', 'دوّر على علامات الجهد الغريب (غالبًا أسلاك برتقالي أو ستيكر تحذير).']],
    prove: [['Measure at the terminals you will touch, not at the PLC power input.', 'قيس عند الأطراف اللي هتلمسها مش عند تغذية الـPLC.']],
    mistakes: [['Putting the PLC in STOP and starting work.', 'وضع الـPLC على STOP والبدء في الشغل.'], ['Trusting a dark output LED.', 'الاعتماد على لمبة خرج مطفية.']],
    std: ['IEC 60204-1: software or control signals cannot replace electrical isolation.', 'IEC 60204-1: البرنامج وإشارات التحكم مينفعش تحل محل العزل الكهربائي.'],
  });
})(typeof window !== 'undefined' ? window : globalThis);
