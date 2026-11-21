/* LOTO data: devices, isolation point types, scenarios, rules */
(function (g) {
  const EL = g.EL;
  const L = (EL.lotoData = {});

  /* ---------- icons (viewBox 0 0 64 64) ---------- */
  const pad = (c) => `<path d="M22 30 v-9 a10 10 0 0 1 20 0 v9" fill="none" stroke="#d5dae6" stroke-width="5"/><rect x="15" y="29" width="34" height="27" rx="5" fill="${c}" stroke="#1a1a1a" stroke-width="2"/><circle cx="32" cy="41" r="3.5" fill="#1a1a1a"/><rect x="30.5" y="43" width="3" height="8" fill="#1a1a1a"/>`;
  const ICON = {
    padlock_red: pad('#d33'), padlock_blue: pad('#2f6fd8'), padlock_yellow: pad('#f1c40f'), padlock_master: pad('#2a2a2a'),
    hasp: '<rect x="8" y="22" width="48" height="20" rx="3" fill="#e5483b" stroke="#222" stroke-width="2"/><g fill="#222"><circle cx="17" cy="32" r="3.5"/><circle cx="27" cy="32" r="3.5"/><circle cx="37" cy="32" r="3.5"/><circle cx="47" cy="32" r="3.5"/></g><path d="M8 32 h-4 v14 h12" fill="none" stroke="#bbb" stroke-width="3"/>',
    lockbox: '<rect x="8" y="14" width="48" height="38" rx="5" fill="#e5483b" stroke="#222" stroke-width="2"/><rect x="14" y="20" width="36" height="6" rx="2" fill="#222"/><rect x="26" y="32" width="12" height="14" rx="2" fill="#f0f0f0" stroke="#222"/>',
    mcb_clip: '<rect x="24" y="8" width="16" height="48" rx="3" fill="#ddd" stroke="#222" stroke-width="2"/><rect x="27" y="14" width="10" height="16" fill="#444"/><path d="M40 22 h10 v14 h-10" fill="#e5483b" stroke="#222" stroke-width="2"/><circle cx="45" cy="29" r="2" fill="#222"/>',
    mcb3_clip: '<g fill="#ddd" stroke="#222" stroke-width="2"><rect x="8" y="12" width="14" height="40" rx="3"/><rect x="25" y="12" width="14" height="40" rx="3"/><rect x="42" y="12" width="14" height="40" rx="3"/></g><rect x="5" y="26" width="54" height="12" rx="3" fill="#e5483b" stroke="#222" stroke-width="2"/><circle cx="32" cy="32" r="3" fill="#222"/>',
    mccb_clip: '<rect x="8" y="14" width="48" height="36" rx="4" fill="#bbb" stroke="#222" stroke-width="2"/><rect x="18" y="22" width="28" height="12" fill="#333"/><path d="M14 40 h36 v10 h-36z" fill="#e5483b" stroke="#222" stroke-width="2"/><circle cx="32" cy="45" r="2.5" fill="#222"/>',
    ball_lock: '<rect x="4" y="26" width="56" height="12" fill="#9aa3b5" stroke="#222" stroke-width="2"/><circle cx="32" cy="32" r="12" fill="#cfd5e3" stroke="#222" stroke-width="2"/><path d="M32 32 L52 14" stroke="#222" stroke-width="5"/><rect x="38" y="14" width="22" height="14" rx="3" fill="#e5483b" stroke="#222" stroke-width="2"/><circle cx="49" cy="21" r="2.5" fill="#222"/>',
    gate_lock: '<circle cx="32" cy="30" r="20" fill="#e5483b" stroke="#222" stroke-width="2"/><circle cx="32" cy="30" r="12" fill="#cfd5e3" stroke="#222" stroke-width="2"/><path d="M32 18 v24 M20 30 h24" stroke="#222" stroke-width="3"/><rect x="28" y="48" width="8" height="12" fill="#9aa3b5" stroke="#222" stroke-width="2"/>',
    butterfly_lock: '<rect x="4" y="30" width="56" height="10" fill="#9aa3b5" stroke="#222" stroke-width="2"/><ellipse cx="32" cy="35" rx="6" ry="16" fill="#cfd5e3" stroke="#222" stroke-width="2"/><path d="M32 20 v-10" stroke="#222" stroke-width="5"/><path d="M20 10 h24 v8 h-24z" fill="#e5483b" stroke="#222" stroke-width="2"/>',
    plug_lock: '<path d="M14 24 h30 a8 8 0 0 1 8 8 v4 a8 8 0 0 1 -8 8 h-30z" fill="#e5483b" stroke="#222" stroke-width="2"/><rect x="2" y="28" width="12" height="4" fill="#bbb"/><rect x="2" y="36" width="12" height="4" fill="#bbb"/><circle cx="34" cy="34" r="5" fill="#222"/><path d="M52 34 h8" stroke="#222" stroke-width="3"/>',
    cable_lock: '<circle cx="32" cy="30" r="20" fill="none" stroke="#bbb" stroke-width="3" stroke-dasharray="4 2"/><rect x="26" y="46" width="12" height="14" rx="3" fill="#e5483b" stroke="#222" stroke-width="2"/><circle cx="32" cy="53" r="2.5" fill="#222"/>',
    qdc_lock: '<rect x="4" y="26" width="22" height="12" fill="#9aa3b5" stroke="#222" stroke-width="2"/><rect x="38" y="26" width="22" height="12" fill="#9aa3b5" stroke="#222" stroke-width="2"/><rect x="22" y="20" width="22" height="24" rx="4" fill="#e5483b" stroke="#222" stroke-width="2"/><circle cx="33" cy="32" r="3" fill="#222"/>',
    fuse_lock: '<rect x="20" y="8" width="24" height="40" rx="5" fill="#f2ead2" stroke="#222" stroke-width="2"/><rect x="16" y="46" width="32" height="12" rx="3" fill="#e5483b" stroke="#222" stroke-width="2"/><circle cx="32" cy="52" r="2.5" fill="#222"/><path d="M32 14 v28" stroke="#c9a227" stroke-width="3"/>',
    pb_cover: '<circle cx="32" cy="34" r="20" fill="#e5483b" stroke="#222" stroke-width="2"/><circle cx="32" cy="34" r="10" fill="#fff3" stroke="#222"/><rect x="29" y="50" width="6" height="8" fill="#bbb"/>',
    switch_lock: '<rect x="14" y="8" width="36" height="48" rx="5" fill="#eee" stroke="#222" stroke-width="2"/><rect x="24" y="18" width="16" height="28" rx="3" fill="#e5483b" stroke="#222" stroke-width="2"/>',
    tag: '<rect x="14" y="4" width="36" height="56" rx="4" fill="#fff" stroke="#c00" stroke-width="3"/><rect x="14" y="4" width="36" height="16" fill="#c00"/><text x="32" y="16" font-size="9" font-weight="700" fill="#fff" text-anchor="middle">DANGER</text><path d="M20 30 h24 M20 38 h24 M20 46 h16" stroke="#555" stroke-width="2"/><circle cx="32" cy="8" r="0" fill="#000"/>',
    tester: '<rect x="24" y="4" width="16" height="36" rx="4" fill="#d9342b" stroke="#222" stroke-width="2"/><g fill="#ffeb3b"><rect x="28" y="9" width="8" height="3"/><rect x="28" y="15" width="8" height="3"/><rect x="28" y="21" width="8" height="3"/></g><path d="M28 40 L14 60 M36 40 L50 60" stroke="#222" stroke-width="3"/>',
    block: '<path d="M6 52 L58 52 L58 38 Z" fill="#f1c40f" stroke="#222" stroke-width="2"/><path d="M14 52 l8 -4 l8 4 l8 -4 l8 4" fill="none" stroke="#222" stroke-width="2"/>',
    bleed: '<rect x="4" y="28" width="40" height="10" fill="#9aa3b5" stroke="#222" stroke-width="2"/><circle cx="48" cy="33" r="10" fill="#cfd5e3" stroke="#222" stroke-width="2"/><path d="M48 33 L58 20" stroke="#222" stroke-width="4"/><g fill="#7fd0ff"><circle cx="54" cy="46" r="2"/><circle cx="58" cy="52" r="2"/></g>',
    dstick: '<rect x="28" y="6" width="8" height="30" rx="3" fill="#2b3550" stroke="#222" stroke-width="2"/><rect x="24" y="36" width="16" height="10" rx="2" fill="#ca6" stroke="#222" stroke-width="2"/><path d="M32 46 L20 60 M32 46 L44 60" stroke="#222" stroke-width="3"/>',
    // isolation points
    rotary: '<rect x="8" y="8" width="48" height="48" rx="5" fill="#ddd" stroke="#222" stroke-width="2"/><rect x="18" y="18" width="28" height="28" rx="14" fill="#f1c40f" stroke="#222" stroke-width="2"/><path d="M32 32 v-12" stroke="#222" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="32" r="3" fill="#222"/>',
    knife: '<rect x="8" y="8" width="48" height="48" rx="4" fill="#ddd" stroke="#222" stroke-width="2"/><rect x="20" y="14" width="24" height="36" fill="#333"/><rect x="26" y="20" width="12" height="16" fill="#e5483b"/>',
    mcb: '<rect x="20" y="6" width="24" height="52" rx="3" fill="#ddd" stroke="#222" stroke-width="2"/><rect x="26" y="12" width="12" height="18" fill="#333"/><rect x="29" y="14" width="6" height="8" fill="#eee"/><text x="32" y="48" font-size="9" text-anchor="middle" fill="#222" font-weight="700">C16</text>',
    mccb: '<rect x="8" y="10" width="48" height="44" rx="5" fill="#8f98ab" stroke="#222" stroke-width="2"/><rect x="18" y="20" width="28" height="14" rx="3" fill="#222"/><rect x="26" y="22" width="12" height="10" fill="#eee"/><text x="32" y="48" font-size="9" text-anchor="middle" fill="#fff" font-weight="700">100A</text>',
    plug: '<path d="M14 20 h30 a10 10 0 0 1 10 10 v4 a10 10 0 0 1 -10 10 h-30z" fill="#2f6fd8" stroke="#222" stroke-width="2"/><rect x="2" y="25" width="12" height="5" fill="#bbb"/><rect x="2" y="34" width="12" height="5" fill="#bbb"/><path d="M54 32 h8" stroke="#222" stroke-width="3"/>',
    fuse: '<rect x="22" y="6" width="20" height="52" rx="5" fill="#f2ead2" stroke="#222" stroke-width="2"/><rect x="18" y="4" width="28" height="10" rx="3" fill="#888" stroke="#222"/><path d="M32 16 v28" stroke="#c9a227" stroke-width="3"/>',
    pushbtn: '<circle cx="32" cy="32" r="22" fill="#e5483b" stroke="#222" stroke-width="3"/><circle cx="32" cy="32" r="13" fill="#ff7a68" stroke="#222"/>',
    estop: '<rect x="8" y="42" width="48" height="14" rx="3" fill="#f1c40f" stroke="#222" stroke-width="2"/><circle cx="32" cy="30" r="20" fill="#e5483b" stroke="#222" stroke-width="3"/>',
    ballvalve: '<rect x="2" y="26" width="60" height="14" fill="#9aa3b5" stroke="#222" stroke-width="2"/><circle cx="32" cy="33" r="14" fill="#cfd5e3" stroke="#222" stroke-width="2"/><path d="M32 33 L12 12" stroke="#222" stroke-width="5"/><rect x="2" y="6" width="20" height="10" rx="3" fill="#2f6fd8" stroke="#222"/>',
    gatevalve: '<rect x="2" y="38" width="60" height="14" fill="#9aa3b5" stroke="#222" stroke-width="2"/><rect x="26" y="26" width="12" height="16" fill="#777" stroke="#222"/><path d="M32 26 v-14" stroke="#222" stroke-width="4"/><circle cx="32" cy="10" r="10" fill="none" stroke="#2f6fd8" stroke-width="5"/>',
    butterfly: '<rect x="2" y="34" width="60" height="14" fill="#9aa3b5" stroke="#222" stroke-width="2"/><ellipse cx="32" cy="41" rx="6" ry="16" fill="#cfd5e3" stroke="#222" stroke-width="2"/><path d="M32 26 v-14" stroke="#222" stroke-width="5"/><rect x="18" y="6" width="28" height="8" rx="3" fill="#2f6fd8" stroke="#222"/>',
    qdc: '<rect x="2" y="26" width="26" height="12" fill="#9aa3b5" stroke="#222" stroke-width="2"/><rect x="36" y="26" width="26" height="12" fill="#9aa3b5" stroke="#222" stroke-width="2"/><rect x="24" y="20" width="16" height="24" rx="3" fill="#cfd5e3" stroke="#222" stroke-width="2"/>',
    wallsw: '<rect x="14" y="8" width="36" height="48" rx="5" fill="#eee" stroke="#222" stroke-width="2"/><rect x="24" y="16" width="16" height="32" rx="3" fill="#bbb" stroke="#222" stroke-width="2"/>',
    motor: '<rect x="8" y="16" width="40" height="32" rx="4" fill="#47bfd9" stroke="#222" stroke-width="2"/><rect x="48" y="26" width="12" height="12" fill="#999" stroke="#222"/><circle cx="28" cy="32" r="8" fill="#0c1423"/>',
    cyl: '<rect x="6" y="20" width="36" height="24" rx="3" fill="#cfd5e3" stroke="#222" stroke-width="2"/><rect x="42" y="29" width="18" height="6" fill="#888" stroke="#222"/><rect x="54" y="20" width="6" height="24" fill="#555"/>',
    vfd: '<rect x="12" y="4" width="40" height="56" rx="4" fill="#2b3550" stroke="#789" stroke-width="2"/><rect x="18" y="10" width="28" height="12" fill="#0b1c17"/><circle cx="24" cy="34" r="3" fill="#2f7d3f"/><circle cx="34" cy="34" r="3" fill="#a33a2a"/>',
    pump: '<circle cx="28" cy="34" r="20" fill="#9aa3b5" stroke="#222" stroke-width="2"/><circle cx="28" cy="34" r="8" fill="#222"/><rect x="44" y="26" width="18" height="10" fill="#9aa3b5" stroke="#222"/><rect x="26" y="6" width="10" height="10" fill="#9aa3b5" stroke="#222"/>',
    conveyor: '<rect x="4" y="30" width="56" height="12" rx="6" fill="#555" stroke="#222" stroke-width="2"/><circle cx="12" cy="36" r="5" fill="#999"/><circle cx="52" cy="36" r="5" fill="#999"/><rect x="22" y="18" width="12" height="12" fill="#c79a5a" stroke="#222"/>',
    press: '<rect x="12" y="4" width="40" height="12" fill="#777" stroke="#222" stroke-width="2"/><rect x="28" y="16" width="8" height="22" fill="#cfd5e3" stroke="#222"/><rect x="14" y="38" width="36" height="8" fill="#e5483b" stroke="#222" stroke-width="2"/><rect x="8" y="48" width="48" height="10" fill="#555" stroke="#222"/>',
    tank: '<rect x="14" y="10" width="36" height="44" rx="14" fill="#9aa3b5" stroke="#222" stroke-width="2"/><circle cx="32" cy="32" r="8" fill="#fff" stroke="#222"/><path d="M32 32 L36 27" stroke="#c00" stroke-width="2"/>',
  };
  L.ICON = ICON;
  L.icon = (k, size) => `<svg viewBox="0 0 64 64" width="${size || 64}" height="${size || 64}">${ICON[k] || ''}</svg>`;

  /* ---------- isolation point types ---------- */
  L.ptypes = {
    rotary: { name: ['Rotary isolator / disconnect switch', 'سويتش عزل دوّار'], icon: 'rotary', integral: true, iso: true, kind: 'elec' },
    knife: { name: ['Knife-blade disconnect', 'سكينة فصل'], icon: 'knife', integral: true, iso: true, kind: 'elec' },
    mcb: { name: ['Miniature circuit breaker (DIN rail)', 'ميني بريكر (على DIN rail)'], icon: 'mcb', iso: true, kind: 'elec' },
    mccb: { name: ['Moulded case circuit breaker', 'بريكر MCCB'], icon: 'mccb', iso: true, kind: 'elec' },
    plug: { name: ['Plug and socket', 'فيشة وبريزة'], icon: 'plug', iso: true, kind: 'elec' },
    fuse: { name: ['Fuse holder / fuse switch', 'قاعدة فيوز'], icon: 'fuse', iso: true, kind: 'elec' },
    wallsw: { name: ['Light switch', 'مفتاح إنارة'], icon: 'wallsw', iso: false, kind: 'elec' },
    pushbtn: { name: ['Stop pushbutton', 'زرار ستوب'], icon: 'pushbtn', iso: false, kind: 'ctrl' },
    estop: { name: ['Emergency stop', 'زرار طوارئ'], icon: 'estop', iso: false, kind: 'ctrl' },
    ballvalve: { name: ['Ball valve (lever)', 'بول فالف (ذراع)'], icon: 'ballvalve', iso: true, kind: 'fluid' },
    gatevalve: { name: ['Gate / globe valve (wheel)', 'جيت فالف (عجلة)'], icon: 'gatevalve', iso: true, kind: 'fluid' },
    butterfly: { name: ['Butterfly valve (lever)', 'باترفلاي فالف'], icon: 'butterfly', iso: true, kind: 'fluid' },
    qdc: { name: ['Quick-disconnect air coupling', 'وصلة هوا سريعة'], icon: 'qdc', iso: true, kind: 'fluid' },
  };

  /* ---------- toolbox ---------- */
  // kind: lock | device | tag | tool. fits: point types it can secure.
  L.devices = [
    { id: 'pl_red', kind: 'lock', icon: 'padlock_red', name: ['Personal safety padlock (red)', 'قفل أمان شخصي (أحمر)'], desc: ['One lock, one key, one person. The key stays in your pocket. Used on every isolation point you work on.', 'قفل واحد ومفتاح واحد وشخص واحد. المفتاح بيفضل معاك. بيتحط على كل نقطة عزل بتشتغل عليها.'], tip: ['Never lend your key and never use a lock that is not yours.', 'ماتدّيش مفتاحك لحد وماتستخدمش قفل مش بتاعك.'] },
    { id: 'pl_blue', kind: 'lock', icon: 'padlock_blue', name: ['Department padlock (blue, keyed alike)', 'قفل القسم (أزرق، نفس المفتاح)'], desc: ['Shared by a team, keys are alike. Use it only if your procedure allows shared locks. It does NOT replace your personal lock.', 'مشترك للفريق ومفاتيحه متشابهة. استخدمه لو الإجراء بيسمح بس. وهو مبيغنيش عن قفلك الشخصي.'], tip: ['Anyone with a copy can open it, so it is weak protection for a person at risk.', 'أي حد معاه نسخة يفتحه، فحماية ضعيفة للشخص اللي في خطر.'] },
    { id: 'pl_yel', kind: 'lock', icon: 'padlock_yellow', name: ['Visitor / contractor padlock (yellow)', 'قفل الزائر / المقاول (أصفر)'], desc: ['Issued to contractors and visitors who work on the equipment.', 'بيتصرف للمقاولين والزوار اللي هيشتغلوا على الماكينة.'], tip: ['Same rule: personal key, personal tag.', 'نفس القاعدة: مفتاح شخصي وتاج شخصي.'] },
    { id: 'pl_master', kind: 'lock', icon: 'padlock_master', name: ['Master-key padlock (black)', 'قفل ماستر (أسود)'], desc: ['Supervisor lock that also opens other locks. It is not for normal lockout: it removes the protection of personal locks.', 'قفل مشرف بيفتح أقفال تانية. مش للوتو العادي: بيشيل حماية الأقفال الشخصية.'], tip: ['Only for emergency removal by an authorised person.', 'للإزالة في الطوارئ بواسطة شخص مفوّض بس.'] },
    { id: 'hasp', kind: 'device', icon: 'hasp', name: ['Multi-lock hasp (6 holes)', 'هاسب متعدد الأقفال (6 فتحات)'], fits: ['rotary', 'knife', 'mccb', 'mcb', 'ballvalve', 'gatevalve', 'butterfly', 'plug', 'fuse', 'qdc'], needsHole: true, desc: ['A hinged bar with several holes. Fit it on the point (through the hole of the isolator, or through another lockout device) so every worker adds a personal lock. Group lockout.', 'ذراع بمفصلة وفيه أكتر من فتحة. بيتركب على النقطة (في فتحة السويتش أو في جهاز لوتو تاني) وكل عامل يحط قفله. لوتو جماعي.'], tip: ['A hasp does not lock anything by itself: it needs a locking device or a hole underneath it.', 'الهاسب لوحده مبيقفلش حاجة: محتاج جهاز لوتو أو فتحة تحته.'] },
    { id: 'lockbox', kind: 'device', icon: 'lockbox', name: ['Group lock box', 'صندوق أقفال جماعي'], fits: [], group: true, desc: ['Holds the keys of the locks on several points. Each worker puts their personal lock on the box, so the keys can be released only when everyone is done.', 'بيحفظ مفاتيح الأقفال بتاعة نقط كتير. كل عامل بيحط قفله الشخصي على الصندوق، فالمفاتيح مبتتفتحش غير لما الكل يخلّص.'], tip: ['Use it for long jobs with many isolation points and many people.', 'استخدمه للشغل الطويل اللي فيه نقط عزل كتير وعمال كتير.'] },
    { id: 'mcb_clip', kind: 'device', icon: 'mcb_clip', name: ['MCB lockout clip (1 pole)', 'كليب لوتو لميني بريكر (1 بول)'], fits: ['mcb'], desc: ['Clips over the toggle of a DIN-rail breaker and has a padlock hole. Fits one or two poles.', 'بيتركب على مقبض الميني بريكر وفيه فتحة للقفل. بيناسب بول أو اتنين.'], tip: ['Does not fit a moulded-case breaker with a wide handle.', 'مبيناسبش بريكر MCCB ده مقبضه عريض.'] },
    { id: 'mcb3_clip', kind: 'device', icon: 'mcb3_clip', name: ['Multi-pole MCB lockout bar (3 pole)', 'بار لوتو لبريكر 3 بول'], fits: ['mcb'], desc: ['Bar that holds several MCB toggles OFF together. Good for 3-phase DIN-rail breakers.', 'بار بيمسك أكتر من مقبض ميني بريكر على OFF مع بعض. كويس للبريكرات 3 فاز.'], tip: ['Handle ties and gang-bars must hold all poles OFF.', 'لازم يمسك كل البولات على OFF.'] },
    { id: 'mccb_clip', kind: 'device', icon: 'mccb_clip', name: ['MCCB / wide handle lockout', 'لوتو MCCB / مقبض عريض'], fits: ['mccb'], desc: ['Covers the wide handle of a moulded-case breaker and takes a padlock.', 'بيغطي المقبض العريض لبريكر MCCB وبياخد قفل.'], tip: ['Fits handles from about 10 to 30 mm thick.', 'بيناسب مقابض من 10 لـ 30 مم سمك.'] },
    { id: 'ball_lock', kind: 'device', icon: 'ball_lock', name: ['Ball / lever valve lockout', 'لوتو بول فالف (ذراع)'], fits: ['ballvalve', 'butterfly'], desc: ['Clamps around the pipe and the lever so the lever cannot move. Fits quarter-turn valves.', 'بيتثبت على الماسورة والذراع فالذراع ميتحركش. للفالفات ربع لفة.'], tip: ['Close the valve first, then fit it. It does not fit a wheel valve.', 'اقفل الفالف الأول وبعدين ركّبه. مبيناسبش فالف بعجلة.'] },
    { id: 'gate_lock', kind: 'device', icon: 'gate_lock', name: ['Gate / globe valve wheel cover', 'غطاء عجلة جيت فالف'], fits: ['gatevalve'], desc: ['Two-piece cover that traps the handwheel. Adjustable for most wheel sizes.', 'غطاء من قطعتين بيحبس العجلة. بيتظبط على أغلب المقاسات.'], tip: ['Close the valve fully before fitting the cover.', 'اقفل الفالف تمامًا قبل ما تركب الغطاء.'] },
    { id: 'bfly_lock', kind: 'device', icon: 'butterfly_lock', name: ['Butterfly valve lockout', 'لوتو باترفلاي فالف'], fits: ['butterfly'], desc: ['Plate that holds the butterfly handle in the closed notch.', 'بلاطة بتمسك ذراع الباترفلاي في الوضع المقفول.'], tip: ['Made for the notched-plate handles of butterfly valves.', 'مصنوع لذراع الباترفلاي اللي بنتش.'] },
    { id: 'plug_lock', kind: 'device', icon: 'plug_lock', name: ['Plug lockout (cover)', 'لوتو فيشة (غطاء)'], fits: ['plug'], desc: ['Encloses the plug after you unplug it so nobody can plug it back in.', 'بيغلّف الفيشة بعد ما تفصلها فمحدش يرجّعها.'], tip: ['Unplug first, then lock the plug and keep it in sight.', 'افصل الفيشة الأول وبعدين اقفلها وخلّيها قدام عينك.'] },
    { id: 'cable_lock', kind: 'device', icon: 'cable_lock', name: ['Cable lockout (adjustable)', 'كابل لوتو (قابل للتعديل)'], fits: ['gatevalve', 'ballvalve', 'butterfly', 'knife', 'rotary', 'qdc', 'mccb'], desc: ['A steel cable loop with a lock. Works on odd shapes, several valves at once or a lever that no clip fits.', 'حلقة كابل صلب بقفل. بتشتغل على الأشكال الغريبة أو أكتر من فالف مع بعض أو ذراع مفيش كليب بيناسبه.'], tip: ['Pull the cable tight so the handle cannot move.', 'شد الكابل كويس عشان المقبض ميتحركش.'] },
    { id: 'qdc_lock', kind: 'device', icon: 'qdc_lock', name: ['Pneumatic quick-disconnect lockout', 'لوتو وصلة هوا سريعة'], fits: ['qdc'], desc: ['Fits over a disconnected air coupling so it cannot be reconnected. Disconnect, then vent downstream air.', 'بيتركب على وصلة الهوا بعد فصلها فمتتوصلش تاني. افصل وبعدين فرّغ الهوا اللي بعدها.'], tip: ['Never lock a coupling that is still connected and pressurised.', 'ماتقفلش وصلة لسه متوصلة وعليها ضغط.'] },
    { id: 'fuse_lock', kind: 'device', icon: 'fuse_lock', name: ['Fuse holder lockout', 'لوتو قاعدة فيوز'], fits: ['fuse'], desc: ['Holds the fuse carrier in the open position or takes the fuse out and locks the empty holder.', 'بيمسك حامل الفيوز مفتوح أو بتشيل الفيوز وتقفل القاعدة الفاضية.'], tip: ['Removing a fuse is not isolation unless it is locked out.', 'شيل الفيوز مش عزل إلا لو اتقفل لوتو.'] },
    { id: 'pb_cover', kind: 'device', icon: 'pb_cover', name: ['Pushbutton / E-stop cover', 'غطاء زرار / طوارئ'], fits: ['pushbtn', 'estop'], control: true, desc: ['Locks a control pushbutton in place. This is only for control devices: a locked stop button does not isolate energy.', 'بيقفل زرار تحكم في مكانه. للتحكم بس: زرار ستوب مقفول مبيعزلش الطاقة.'], tip: ['Never the only protection. Use it with a real isolation point.', 'عمره ما يكون الحماية الوحيدة. استخدمه مع نقطة عزل حقيقية.'] },
    { id: 'sw_lock', kind: 'device', icon: 'switch_lock', name: ['Wall switch cover', 'غطاء مفتاح حيط'], fits: ['wallsw'], desc: ['Covers a light switch. Suitable for lighting circuits only.', 'بيغطي مفتاح إنارة. للإنارة بس.'], tip: ['Not for machine isolation.', 'مش لعزل الماكينات.'] },
    { id: 'tag', kind: 'tag', icon: 'tag', name: ['DANGER do not operate tag', 'تاج خطر لا تشغّل'], desc: ['Every lock gets a tag with the name of the person, the date, the reason and contact details. The tag warns others and tells them whom to call.', 'كل قفل ليه تاج فيه اسم الشخص والتاريخ والسبب وطريقة الاتصال. التاج بيحذر الباقي وبيقولهم يكلموا مين.'], tip: ['A tag alone is not a lock. Use a tag with a lock wherever a lock can be fitted.', 'التاج لوحده مش قفل. استخدمه مع القفل في أي مكان ينفع فيه قفل.'] },
    { id: 'tester', kind: 'tool', icon: 'tester', name: ['Two-pole voltage tester', 'تستر جهد بقطبين'], desc: ['The proving tool for the dead check. Use it between all phases and to earth.', 'الأداة اللي بتثبت إن مفيش جهد. استخدمه بين كل الفازات وبين الفازات والأرضي.'], tip: ['Prove-test-prove.', 'اختبر على مصدر معروف، اختبر الدايرة، واختبر المصدر تاني.'] },
    { id: 'block', kind: 'tool', icon: 'block', name: ['Safety block / pin (gravity)', 'بلوكة / بنّ أمان (للجاذبية)'], desc: ['Holds a raised part (a press ram, a lift) mechanically so it cannot fall.', 'بيمسك جزء مرفوع (رام مكبس أو رافعة) ميكانيكيًا فمايقعش.'], tip: ['Gravity is an energy source: isolating air does not stop a ram from falling.', 'الجاذبية مصدر طاقة: عزل الهوا مبيمنعش الرام من إنه يقع.'] },
    { id: 'bleed', kind: 'tool', icon: 'bleed', name: ['Bleed / exhaust valve', 'فالف تفريغ / عادم'], desc: ['Releases trapped pressure (air or fluid) after the supply is isolated and locked.', 'بيفرّغ الضغط المحبوس (هوا أو سائل) بعد عزل المصدر وقفله.'], tip: ['Open slowly, stand to the side, then check the gauge reads zero.', 'افتحه براحة وقف على الجنب وبعدين اتأكد إن العداد صفر.'] },
    { id: 'dstick', kind: 'tool', icon: 'dstick', name: ['Discharge stick (resistive)', 'عصاية تفريغ (بمقاومة)'], desc: ['Safely discharges capacitors. Drive DC bus capacitors also bleed by themselves in a few minutes.', 'بتفرّغ الكباسيتورات بأمان. وكباسيتورات الـDC bus في الانفرتر بتفضى بنفسها في دقايق.'], tip: ['After discharge, measure to prove it.', 'بعد التفريغ قيس عشان تثبت.'] },
  ];
  L.dev = (id) => L.devices.find((d) => d.id === id);

  /* ---------- scenarios ---------- */
  // node: id, x, y, icon, label; link: [from,to]; point: isolation point nodes
  L.scenarios = [
    {
      id: 'conv', name: ['Conveyor motor: replace a worn coupling', 'سير ناقل: تغيير كابلنج مهترئ'], icon: 'conveyor', level: 1,
      task: ['You must replace the coupling between the motor and the gearbox of a conveyor. Isolate the machine and make it safe.', 'لازم تغيّر الكابلنج بين الموتور والجيربوكس في سير ناقل. اعزل الماكينة وخليها آمنة.'],
      crew: ['You'],
      nodes: [
        { id: 'src', x: 20, y: 60, icon: 'knife', label: ['Mains 400 V', 'كهرباء 400 فولت'] },
        { id: 'p1', x: 150, y: 60, point: 'qs1' }, { id: 'drv', x: 300, y: 60, icon: 'rotary', label: ['Motor starter', 'ستارتر الموتور'], plain: true },
        { id: 'mot', x: 440, y: 60, icon: 'motor', label: ['Conveyor motor', 'موتور السير'] },
        { id: 'p2', x: 150, y: 190, point: 'f1' }, { id: 'p3', x: 300, y: 190, point: 'stop' }, { id: 'p4', x: 440, y: 190, point: 'es' },
      ],
      links: [['src', 'p1'], ['p1', 'drv'], ['drv', 'mot'], ['p2', 'drv']],
      points: [
        { id: 'qs1', type: 'rotary', name: ['QS1 main isolator (panel door)', 'QS1 سويتش العزل الرئيسي'], feeds: ['elec'], needed: true },
        { id: 'f1', type: 'mcb', name: ['F1 control circuit breaker (24 V from the line PLC panel)', 'F1 بريكر التحكم (24 فولت من لوحة الـPLC)'], feeds: ['ctrl'], needed: true, note: ['This circuit is fed from a different panel, so QS1 does not switch it off.', 'الدايرة دي متغذية من لوحة تانية، فـQS1 مبيفصلهاش.'] },
        { id: 'stop', type: 'pushbtn', name: ['SB1 stop pushbutton', 'SB1 زرار ستوب'], feeds: [], needed: false },
        { id: 'es', type: 'estop', name: ['SB0 emergency stop', 'SB0 زرار طوارئ'], feeds: [], needed: false },
      ],
      energies: [
        { id: 'elec', kind: 'elec', name: ['Electrical: 400 V supply to the motor', 'كهرباء: 400 فولت للموتور'], pts: ['qs1'], release: null, verify: 'tester', pairs: ['L1-L2', 'L2-L3', 'L1-L3', 'L1-PE', 'L2-PE', 'L3-PE'] },
        { id: 'ctrl', kind: 'elec', name: ['Electrical: 24 V control from another panel', 'كهرباء: تحكم 24 فولت من لوحة تانية'], pts: ['f1'], release: null, verify: 'tester24' },
      ],
    },
    {
      id: 'press', name: ['Pneumatic press: clear a jam under the ram', 'مكبس نيوماتيك: شيل تعليقة تحت الرام'], icon: 'press', level: 2,
      task: ['A part is jammed under the ram of a small pneumatic press. You will reach into the tool area. Isolate every energy source of the press.', 'قطعة محشورة تحت رام مكبس نيوماتيك صغير. هتدخل إيدك في منطقة الأدوات. اعزل كل مصادر الطاقة للمكبس.'],
      crew: ['You'],
      nodes: [
        { id: 'air', x: 20, y: 40, icon: 'ballvalve', label: ['Plant air 6 bar', 'هوا المصنع 6 بار'], plain: true },
        { id: 'p1', x: 150, y: 40, point: 'air' }, { id: 'tank', x: 290, y: 40, icon: 'tank', label: ['Air receiver', 'خزان الهوا'], plain: true },
        { id: 'cyl', x: 430, y: 40, icon: 'press', label: ['Press cylinder + ram', 'سلندر المكبس والرام'] },
        { id: 'p2', x: 150, y: 190, point: 'qs' }, { id: 'p3', x: 290, y: 190, point: 'start' },
      ],
      links: [['air', 'p1'], ['p1', 'tank'], ['tank', 'cyl'], ['p2', 'cyl']],
      points: [
        { id: 'air', type: 'ballvalve', name: ['V1 compressed air supply valve', 'V1 فالف هوا الضغط'], feeds: ['pneu'], needed: true },
        { id: 'qs', type: 'mccb', name: ['QF2 press power breaker (solenoid valves and PLC)', 'QF2 بريكر المكبس (السولينويد والـPLC)'], feeds: ['elec'], needed: true },
        { id: 'start', type: 'pushbtn', name: ['Two-hand start pushbutton', 'زرار تشغيل باليدين'], feeds: [], needed: false },
      ],
      energies: [
        { id: 'elec', kind: 'elec', name: ['Electrical: 230 V to the valve solenoids and PLC', 'كهرباء: 230 فولت للسولينويد والـPLC'], pts: ['qs'], release: null, verify: 'tester1' },
        { id: 'pneu', kind: 'pneu', name: ['Pneumatic: 6 bar in the lines, receiver and cylinder', 'نيوماتيك: 6 بار في الخطوط والخزان والسلندر'], pts: ['air'], release: { label: ['Open the bleed valve and vent the air', 'افتح فالف التفريغ وفرّغ الهوا'], id: 'bleed' }, verify: 'gauge' },
        { id: 'grav', kind: 'grav', name: ['Gravity: the raised ram can fall', 'جاذبية: الرام المرفوع ممكن يقع'], pts: [], release: { label: ['Fit the safety block under the ram', 'ركّب بلوكة الأمان تحت الرام'], id: 'block' }, verify: 'visual' },
      ],
    },
    {
      id: 'pump', name: ['VFD pump skid: change a mechanical seal', 'سكيد طلمبة بانفرتر: تغيير ميكانيكال سيل'], icon: 'pump', level: 3,
      task: ['The mechanical seal of a pump leaks. The pump is run by a VFD. You will open the pump casing and work near the drive terminals. Isolate everything.', 'الميكانيكال سيل بتاع الطلمبة بيسرّب. والطلمبة بتتشغل بانفرتر. هتفتح بدن الطلمبة وتشتغل جنب ترمينالات الانفرتر. اعزل كل حاجة.'],
      crew: ['You'],
      nodes: [
        { id: 'src', x: 10, y: 40, icon: 'knife', label: ['Mains 400 V', 'كهرباء 400 فولت'], plain: true },
        { id: 'p1', x: 120, y: 40, point: 'qs' }, { id: 'vfd', x: 250, y: 40, icon: 'vfd', label: ['VFD (DC bus)', 'انفرتر (DC bus)'] },
        { id: 'pump', x: 380, y: 40, icon: 'pump', label: ['Pump', 'الطلمبة'] },
        { id: 'p2', x: 380, y: 160, point: 'suc' }, { id: 'p3', x: 500, y: 160, point: 'dis' },
        { id: 'p4', x: 120, y: 190, point: 'ctrl' },
      ],
      links: [['src', 'p1'], ['p1', 'vfd'], ['vfd', 'pump'], ['p2', 'pump'], ['p3', 'pump'], ['p4', 'vfd']],
      points: [
        { id: 'qs', type: 'rotary', name: ['QS1 drive isolator', 'QS1 سويتش عزل الانفرتر'], feeds: ['elec', 'cap'], needed: true },
        { id: 'ctrl', type: 'mcb', name: ['F2 24 V control supply of the VFD', 'F2 تغذية تحكم 24 فولت للانفرتر'], feeds: ['elec24'], needed: true },
        { id: 'suc', type: 'gatevalve', name: ['V1 suction valve (wheel)', 'V1 فالف السحب (عجلة)'], feeds: ['hyd'], needed: true },
        { id: 'dis', type: 'butterfly', name: ['V2 discharge valve (lever)', 'V2 فالف الطرد (ذراع)'], feeds: ['hyd'], needed: true },
      ],
      energies: [
        { id: 'elec', kind: 'elec', name: ['Electrical: 400 V to the drive and motor', 'كهرباء: 400 فولت للانفرتر والموتور'], pts: ['qs'], release: null, verify: 'tester', pairs: ['L1-L2', 'L2-L3', 'L1-L3', 'L1-PE', 'L2-PE', 'L3-PE'] },
        { id: 'elec24', kind: 'elec', name: ['Electrical: 24 V control supply', 'كهرباء: تغذية تحكم 24 فولت'], pts: ['ctrl'], release: null, verify: 'tester24' },
        { id: 'cap', kind: 'cap', name: ['Stored electrical: drive DC bus capacitors (up to about 560 V)', 'كهرباء مخزنة: كباسيتورات DC bus (لحد 560 فولت)'], pts: ['qs'], release: { label: ['Wait for the DC bus to discharge (drive label: 5 minutes)', 'استنى الـDC bus يفضى (لوحة الانفرتر: 5 دقايق)'], id: 'wait' }, verify: 'dcbus' },
        { id: 'hyd', kind: 'hyd', name: ['Hydraulic: water pressure in the casing (4 bar)', 'ضغط مياه في بدن الطلمبة (4 بار)'], pts: ['suc', 'dis'], release: { label: ['Open the casing drain and relieve the pressure', 'افتح درين البدن وفرّغ الضغط'], id: 'bleed' }, verify: 'gauge' },
      ],
    },
    {
      id: 'group', name: ['Packaging line: three people, one job (group lockout)', 'خط تعبئة: 3 أفراد وشغل واحد (لوتو جماعي)'], icon: 'conveyor', level: 3,
      task: ['You, Ahmed and Mona will work on different parts of the packaging line at the same time. Every one of you must be protected by a personal lock on the main breaker, and the air must be isolated too.', 'انت وأحمد ومنى هتشتغلوا على أجزاء مختلفة من خط التعبئة في نفس الوقت. كل واحد فيكم لازم يتحمي بقفل شخصي على البريكر الرئيسي، والهوا لازم يتعزل كمان.'],
      crew: ['You', 'Ahmed', 'Mona'],
      nodes: [
        { id: 'src', x: 10, y: 40, icon: 'knife', label: ['Mains 400 V', 'كهرباء 400 فولت'], plain: true },
        { id: 'p1', x: 130, y: 40, point: 'main' }, { id: 'line', x: 270, y: 40, icon: 'conveyor', label: ['Packaging line', 'خط التعبئة'] },
        { id: 'air', x: 10, y: 190, icon: 'ballvalve', label: ['Plant air', 'هوا المصنع'], plain: true },
        { id: 'p2', x: 130, y: 190, point: 'air' }, { id: 'p3', x: 400, y: 190, point: 'plug' },
      ],
      links: [['src', 'p1'], ['p1', 'line'], ['air', 'p2'], ['p2', 'line'], ['p3', 'line']],
      points: [
        { id: 'main', type: 'mccb', name: ['QF1 main breaker (100 A)', 'QF1 البريكر الرئيسي (100 أمبير)'], feeds: ['elec'], needed: true, group: true },
        { id: 'air', type: 'ballvalve', name: ['V1 air supply valve', 'V1 فالف الهوا'], feeds: ['pneu'], needed: true, group: true },
        { id: 'plug', type: 'plug', name: ['Labeller plug (230 V socket)', 'فيشة ماكينة الليبل (230 فولت)'], feeds: ['elec2'], needed: true, group: false },
      ],
      energies: [
        { id: 'elec', kind: 'elec', name: ['Electrical: 400 V line supply', 'كهرباء: 400 فولت للخط'], pts: ['main'], release: null, verify: 'tester', pairs: ['L1-L2', 'L2-L3', 'L1-L3', 'L1-PE', 'L2-PE', 'L3-PE'] },
        { id: 'elec2', kind: 'elec', name: ['Electrical: 230 V labeller plug', 'كهرباء: 230 فولت فيشة الليبل'], pts: ['plug'], release: null, verify: 'tester1' },
        { id: 'pneu', kind: 'pneu', name: ['Pneumatic: 6 bar in the line', 'نيوماتيك: 6 بار في الخط'], pts: ['air'], release: { label: ['Open the bleed valve and vent the air', 'افتح فالف التفريغ وفرّغ الهوا'], id: 'bleed' }, verify: 'gauge' },
      ],
    },
    {
      id: 'plugmach', name: ['Cord-connected dosing machine', 'ماكينة جرعات بفيشة'], icon: 'tank', level: 1,
      task: ['The dosing machine is plugged into a socket and uses compressed air for the pinch valve. Replace the dosing nozzle safely.', 'ماكينة الجرعات متوصلة بفيشة وبتستخدم هوا مضغوط للـpinch valve. غيّر الدوزنج نوزل بأمان.'],
      crew: ['You'],
      nodes: [
        { id: 'sock', x: 10, y: 50, icon: 'plug', label: ['Socket 230 V', 'بريزة 230 فولت'], plain: true },
        { id: 'p1', x: 150, y: 50, point: 'plug' }, { id: 'mach', x: 300, y: 50, icon: 'tank', label: ['Dosing machine', 'ماكينة الجرعات'] },
        { id: 'p2', x: 150, y: 190, point: 'qdc' }, { id: 'p3', x: 300, y: 190, point: 'sw' },
      ],
      links: [['sock', 'p1'], ['p1', 'mach'], ['p2', 'mach'], ['p3', 'mach']],
      points: [
        { id: 'plug', type: 'plug', name: ['Machine power plug', 'فيشة الماكينة'], feeds: ['elec'], needed: true },
        { id: 'qdc', type: 'qdc', name: ['Air quick coupling', 'وصلة الهوا السريعة'], feeds: ['pneu'], needed: true },
        { id: 'sw', type: 'wallsw', name: ['Room light switch (lighting only)', 'مفتاح إنارة الأوضة (إنارة بس)'], feeds: [], needed: false },
      ],
      energies: [
        { id: 'elec', kind: 'elec', name: ['Electrical: 230 V at the machine', 'كهرباء: 230 فولت عند الماكينة'], pts: ['plug'], release: null, verify: 'tester1' },
        { id: 'pneu', kind: 'pneu', name: ['Pneumatic: 6 bar trapped after the coupling', 'نيوماتيك: 6 بار محبوسة بعد الوصلة'], pts: ['qdc'], release: { label: ['Open the bleed valve and vent the air', 'افتح فالف التفريغ وفرّغ الهوا'], id: 'bleed' }, verify: 'gauge' },
      ],
    },
  ];

  /* ---------- the 6 steps ---------- */
  L.steps = [
    ['Prepare', 'تحضير'], ['Shut down', 'إيقاف'], ['Isolate', 'عزل'], ['Lock and tag', 'قفل وتاج'], ['Release stored energy', 'تفريغ الطاقة المخزنة'], ['Verify', 'تحقق'],
  ];

  /* ---------- rules content for the guide / rules tab ---------- */
  L.rules = [
    [['What LOTO is', 'يعني إيه لوتو'], ['Lock-out tag-out is the procedure that makes a machine safe to work on: every energy source is isolated, locked with a personal padlock, tagged, released and proven dead before anyone touches it.', 'لوتو (قفل وتاج) هو الإجراء اللي بيخلّي الماكينة آمنة للشغل عليها: كل مصدر طاقة بيتعزل ويتقفل بقفل شخصي وبيتحط عليه تاج وبتتفرّغ طاقته وبيتثبت إنه ميت قبل ما حد يلمس.']],
    [['The six steps', 'الست خطوات'], ['1) Prepare: know the energy sources, inform the people. 2) Shut down normally. 3) Isolate every source. 4) Lock and tag each point. 5) Release stored energy. 6) Verify: try to start, then prove with a tester.', '1) تحضير: اعرف مصادر الطاقة وبلّغ الناس. 2) إيقاف عادي. 3) اعزل كل مصدر. 4) اقفل وحط تاج على كل نقطة. 5) فرّغ الطاقة المخزنة. 6) تحقق: جرّب التشغيل وبعدين اثبت بالتستر.']],
    [['Energy types', 'أنواع الطاقة'], ['Electrical, pneumatic, hydraulic, gravity (raised parts), spring tension, thermal, chemical, and stored electrical energy in capacitors (a drive DC bus holds up to about 560 V for minutes).', 'كهربا، نيوماتيك، هيدروليك، جاذبية (أجزاء مرفوعة)، شد سوست، حرارة، كيماويات، وطاقة كهربية مخزنة في الكباسيتورات (الـDC bus في الانفرتر بيفضل لحد حوالي 560 فولت لدقايق).']],
    [['What is NOT isolation', 'اللي مش بيعتبر عزل'], ['A stop pushbutton, an emergency stop, a selector switch, a PLC output or a software interlock is a control device. It can fail or be pressed by someone else. Only a device that physically breaks the energy path (isolator, breaker, valve, unplugged plug) is an isolation point.', 'زرار ستوب أو طوارئ أو سلكتور أو خرج PLC أو إنترلوك سوفتوير ده جهاز تحكم. ممكن يتعطل أو حد تاني يضغطه. نقطة العزل هي الجهاز اللي بيقطع مسار الطاقة فعليًا (سويتش عزل أو بريكر أو فالف أو فيشة مفصولة).']],
    [['Locks and keys', 'الأقفال والمفاتيح'], ['One lock, one key, one person. Your key stays with you. You remove only your own lock. If a person is not available, a defined removal procedure (supervisor, checks, inspection) is followed; master keys and bolt cutters are the last resort.', 'قفل واحد ومفتاح واحد وشخص واحد. مفتاحك معاك. وبتشيل قفلك إنت بس. لو الشخص مش موجود بيتتبع إجراء إزالة محدد (مشرف وفحوصات ومعاينة)، والماستر كي أو القاطع هو الحل الأخير.']],
    [['Tags', 'التاجات'], ['A tag carries the worker name, date, reason and contact. It is attached to every lock. Tag only (no lock) is accepted only when a lock cannot be fitted, with extra safeguards.', 'التاج فيه اسم العامل والتاريخ والسبب والاتصال. بيتحط مع كل قفل. التاج لوحده (من غير قفل) مقبول لما القفل ميتركبش بس، مع احتياطات زيادة.']],
    [['Group lockout', 'اللوتو الجماعي'], ['Each worker puts a personal lock on the hasp of every point, or on a group lock box that holds the keys of the point locks. The machine returns to service only when the last personal lock is removed.', 'كل عامل بيحط قفله الشخصي على الهاسب بتاع كل نقطة، أو على صندوق أقفال جماعي فيه مفاتيح أقفال النقط. الماكينة مبترجعش للخدمة غير لما آخر قفل شخصي يتشال.']],
    [['Verification', 'التحقق'], ['Try to start the machine from its normal controls (with everybody clear), then prove with a tester: test on a known live source, test every pair and to earth, test the known source again. Check gauges for fluid pressure and the drive DC bus. Do not trust a single result.', 'جرّب تشغل الماكينة من أزرارها العادية (والكل بعيد) وبعدين اثبت بالتستر: اختبر على مصدر معروف، اختبر كل زوج وللأرضي، اختبر المصدر المعروف تاني. اتأكد من عدادات الضغط وفولت الـDC bus. ماتعتمدش على قراءة واحدة.']],
  ];
})(typeof window !== 'undefined' ? window : globalThis);
