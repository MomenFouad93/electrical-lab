/* LOTO trainer: scenarios, six-step flow, lock/tag, verification, scoring; device catalog; rules */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, $ = ui.$, D = EL.lotoData;
  const LO = (EL.loto = { run: null, tab: 'practice', mode: 'learn', cat: 'all' });
  const CATMAP = { rotary: 'panels', knife: 'panels', mcb: 'panels', mccb: 'panels', fuse: 'electrical', plug: 'electrical', wallsw: 'switches', pushbtn: 'switches', estop: 'switches', ballvalve: 'valves', gatevalve: 'valves', butterfly: 'valves', qdc: 'pneumatics' };
  const CATS = [['all', ['All', 'الكل']], ['panels', ['Panels', 'لوحات']], ['electrical', ['Electrical', 'كهرباء']], ['switches', ['Switches', 'سويتشات']], ['valves', ['Valves', 'فالفات']], ['pneumatics', ['Pneumatics', 'نيوماتيك']], ['locks', ['Padlocks and tags', 'أقفال وتاجات']], ['tools', ['Tools', 'أدوات']]];
  const opLabel = {
    rotary: [['Switch OFF', 'افصل OFF'], ['Switch ON', 'شغّل ON']], knife: [['Open the blade', 'افتح السكينة'], ['Close the blade', 'اقفل السكينة']], mcb: [['Switch OFF', 'افصل OFF'], ['Switch ON', 'شغّل ON']], mccb: [['Switch OFF', 'افصل OFF'], ['Switch ON', 'شغّل ON']],
    plug: [['Unplug', 'اسحب الفيشة'], ['Plug in', 'ركّب الفيشة']], fuse: [['Pull the fuse', 'شيل الفيوز'], ['Insert the fuse', 'ركّب الفيوز']], ballvalve: [['Close the valve', 'اقفل الفالف'], ['Open the valve', 'افتح الفالف']], gatevalve: [['Close the valve', 'اقفل الفالف'], ['Open the valve', 'افتح الفالف']], butterfly: [['Close the valve', 'اقفل الفالف'], ['Open the valve', 'افتح الفالف']], qdc: [['Disconnect the coupling', 'افصل الوصلة'], ['Connect the coupling', 'وصّل الوصلة']],
    pushbtn: [['Press STOP', 'اضغط STOP'], ['Release', 'سيب الزرار']], estop: [['Press the E-stop', 'اضغط الطوارئ'], ['Release', 'فك الطوارئ']], wallsw: [['Switch off', 'اطفي'], ['Switch on', 'شغّل']],
  };
  const dev = D.dev;
  const pts = () => LO.run.sc.points;
  const pst = (id) => LO.run.pt[id];
  const pdef = (id) => pts().find((p) => p.id === id);
  const energy = (id) => LO.run.sc.energies.find((e) => e.id === id);

  /* ---------- run state ---------- */
  function newRun(sc) {
    const r = { sc, pt: {}, en: {}, f: { notified: false, reviewed: false, stopped: false, tried: false, declared: false, firstIso: null, wait: 0, block: false }, ts: {}, mistakes: [], log: [], sel: sc.points.find((p) => p.needed).id, cfg: { dev: null, hasp: false, lock: 'pl_red', tag: true, owner: 0 }, done: false, openSet: new Set([0]), lastCur: 0 };
    for (const p of sc.points) r.pt[p.id] = { on: true, dev: null, hasp: false, locks: [], tag: 0 };
    for (const e of sc.energies) { r.en[e.id] = { rel: false, gauge: false }; r.ts[e.id] = { before: false, after: false, tested: [] }; }
    return r;
  }
  function fb(kind, msg, pen, key) {
    const R = LO.run;
    if (pen) { const k = key || msg[0]; if (!R.mistakes.some((m) => m.k === k)) R.mistakes.push({ k, text: msg, pen }); }
    ui.toast(msg, kind, 5200);
    R.log.unshift({ kind, msg }); if (R.log.length > 30) R.log.pop();
  }
  const isoDone = (e) => e.pts.every((pid) => !pst(pid).on);
  const locked = (pid) => pst(pid).locks.length > 0;
  const allIso = () => pts().filter((p) => p.needed).every((p) => !pst(p.id).on);

  /* ---------- actions ---------- */
  function operate(pid) {
    const R = LO.run, p = pdef(pid), s = pst(pid);
    if (s.locks.length && s.on === false) { fb('warn', ['This point is locked out. Nobody can switch it back on. (That is the purpose.)', 'النقطة دي مقفولة لوتو. محدش يقدر يرجّعها. (وده الهدف.)']); return; }
    if (s.on) {
      if (!R.f.stopped && R.f.firstIso == null) { R.f.firstIso = 'before'; fb('bad', ['You isolated before stopping the machine normally. Always do a normal stop first: isolating under load can damage the machine and can be dangerous.', 'عزلت قبل ما توقف الماكينة وقفة عادية. اعمل وقفة عادية الأول: العزل والماكينة بتشتغل ممكن يبوّظ الماكينة وخطر.'], 5, 'noshutdown'); }
      s.on = false;
      const t = D.ptypes[p.type];
      if (!t.iso) fb('warn', ['A control device is pressed. This is not isolation: the energy source is still connected.', 'جهاز تحكم اتضغط. ده مش عزل: مصدر الطاقة لسه متوصل.']);
      else fb('ok', [T(p.name) + ': isolated.', T(p.name) + ': اتعزلت.']);
    } else {
      s.on = true; fb('', ['Switched back on (restored).', 'رجّعتها شغالة.']);
    }
    LO.render();
  }
  function applyLock(pid) {
    const R = LO.run, p = pdef(pid), s = pst(pid), c = R.cfg, t = D.ptypes[p.type];
    if (s.on) { fb('bad', ['Do not lock a point that is still ON. Isolate it first, then lock it.', 'ماتقفلش نقطة لسه شغالة. اعزلها الأول وبعدين اقفلها.'], 5, 'lock_on_' + pid); return; }
    const d = c.dev ? dev(c.dev) : null;
    if (!d && !t.integral) { fb('bad', ['This ' + T(t.name) + ' has no padlock hole. Choose a lockout device that fits it.', T(t.name) + ' مفيهوش فتحة قفل. اختار جهاز لوتو بيناسبه.'], 3, 'nodev_' + pid); return; }
    if (d && !d.fits.includes(p.type)) { fb('bad', [T(d.name) + ' does not fit ' + T(t.name) + '. It fits: ' + d.fits.map((x) => T(D.ptypes[x].name)).join(', ') + '.', T(d.name) + ' مبيناسبش ' + T(t.name) + '. بيناسب: ' + d.fits.map((x) => T(D.ptypes[x].name)).join('، ') + '.'], 3, 'wrongdev_' + pid + d.id); return; }
    if (d && d.control && !t.iso) fb('warn', ['You locked a control device. It is not an isolation point, so it protects nobody.', 'قفلت جهاز تحكم. ده مش نقطة عزل فمبيحميش حد.']);
    const L = dev(c.lock);
    if (c.lock === 'pl_master') { fb('bad', ['A master-key lock opens other locks. It must not be used as a personal lock.', 'قفل الماستر بيفتح أقفال تانية. مينفعش يتستخدم كقفل شخصي.'], 5, 'master'); return; }
    if (c.lock === 'pl_blue') fb('warn', ['A shared department lock is not personal protection: anyone with a copy of the key can open it.', 'قفل القسم المشترك مش حماية شخصية: أي حد معاه نسخة مفتاح يفتحه.']);
    if (s.locks.length && !(s.hasp || c.hasp)) { fb('bad', ['There is only one hole on this point. Use a multi-lock hasp so every worker can add a lock.', 'فيه فتحة واحدة بس على النقطة دي. استخدم هاسب متعدد الأقفال عشان كل عامل يحط قفله.'], 4, 'needhasp_' + pid); return; }
    if (s.locks.some((l) => l.owner === c.owner)) { fb('warn', [R.sc.crew[c.owner] + ' already has a lock on this point.', R.sc.crew[c.owner] + ' عنده قفل على النقطة دي بالفعل.']); return; }
    if (!s.locks.length) { s.dev = c.dev; s.hasp = c.hasp; }
    else if (c.hasp) s.hasp = true;
    if (s.locks.length >= 6) return;
    s.locks.push({ owner: c.owner, lock: c.lock });
    if (c.tag) s.tag = Math.max(s.tag, 0) + 1;
    fb('ok', [(R.sc.crew[c.owner]) + ' locked ' + T(p.name) + (c.tag ? ' and attached a tag.' : '. No tag attached yet.'), R.sc.crew[c.owner] + ' قفل ' + T(p.name) + (c.tag ? ' وحط تاج.' : '. مفيش تاج لسه.')]);
    LO.render();
  }
  function removeLocks(pid) { const s = pst(pid); s.locks = []; s.dev = null; s.hasp = false; s.tag = 0; LO.render(); }
  function release(e) {
    const R = LO.run, a = R.en[e.id];
    if (!e.pts.every((pid) => !pst(pid).on && locked(pid))) { fb('bad', ['Isolate and lock the sources first, then release the stored energy.', 'اعزل واقفل المصادر الأول وبعدين فرّغ الطاقة المخزنة.'], 6, 'releaseearly_' + e.id); return; }
    if (e.release.id === 'wait') { R.f.wait += 1; fb('', ['Waiting... DC bus now ' + busV().toFixed(0) + ' V.', 'بنستنى... الـDC bus دلوقتي ' + busV().toFixed(0) + ' فولت.']); if (busV() < 50) a.rel = true; }
    else if (e.release.id === 'block') { a.rel = true; R.f.block = true; fb('ok', ['The safety block is under the ram.', 'بلوكة الأمان تحت الرام.']); }
    else { a.rel = true; fb('ok', ['Pressure vented through the bleed valve.', 'الضغط اتفرّغ من فالف التفريغ.']); }
    LO.render();
  }
  const busV = () => (LO.run.sc.points.some((p) => p.id === 'qs') && !pst('qs').on ? 560 * Math.exp(-LO.run.f.wait * 60 / 90) : 560);

  function tryStart() {
    const R = LO.run;
    if (!R.f.stopped) { fb('warn', ['Stop the machine normally before you start the verification.', 'وقّف الماكينة وقفة عادية قبل ما تبدأ التحقق.']); }
    if (!allIso()) { fb('bad', ['The machine STARTS! It is not isolated. This is exactly why you verify.', 'الماكينة اشتغلت! مش معزولة. ده بالظبط سبب التحقق.'], 10, 'trystart'); return; }
    R.f.tried = true; fb('ok', ['Nothing happens when you press START. Put every control back to OFF.', 'مفيش حاجة بتحصل لما تضغط START. رجّع كل الكنترولز OFF.']); LO.render();
  }
  function prove(e) {
    const t = LO.run.ts[e.id];
    if (!t.before) { t.before = true; fb('ok', ['Tester proved on a known live source: it works.', 'التستر اتأكدنا إنه شغال على مصدر معروف.']); }
    else if (t.tested.length >= pairsOf(e).length && !t.after) { t.after = true; fb('ok', ['Tester proved again after the tests: the dead result is valid.', 'التستر اتأكدنا منه تاني بعد الاختبار: نتيجة "ميت" صحيحة.']); }
    else fb('warn', ['Finish testing all pairs first, then prove the tester again.', 'خلّص اختبار كل الأزواج الأول وبعدين اتأكد من التستر تاني.']);
    LO.render();
  }
  const pairsOf = (e) => (e.verify === 'tester' ? e.pairs : e.verify === 'tester1' ? ['L-N', 'L-PE', 'N-PE'] : e.verify === 'tester24' ? ['+24V to 0V', '+24V to PE'] : []);
  function testPair(e, pr) {
    const t = LO.run.ts[e.id], live = !isoDone(e);
    if (!t.before) fb('bad', ['You tested without proving the tester first. If the tester is dead it shows 0 V on live parts.', 'اختبرت من غير ما تثبت إن التستر شغال. لو التستر ميت هيوري 0 فولت على حاجة شغالة.'], 4, 'unproven_' + e.id);
    if (!t.tested.includes(pr)) t.tested.push(pr);
    const v = e.verify === 'tester' ? (/PE/.test(pr) ? 231 : 400) : e.verify === 'tester1' ? 230 : 24;
    t.last = { pr, v: live ? v : 0 };
    if (live) fb('bad', ['LIVE: ' + pr + ' reads ' + v + ' V! The source is not isolated. Stop and fix it.', 'فيه جهد: ' + pr + ' بيقرا ' + v + ' فولت! المصدر مش معزول. وقّف وصلّح.']);
    LO.render();
  }
  function gaugeRead(e) { const a = LO.run.en[e.id]; a.gauge = true; fb(a.rel ? 'ok' : 'bad', [a.rel ? 'Gauge reads 0 bar.' : 'Gauge reads ' + (e.kind === 'hyd' ? '4' : '6') + ' bar. Pressure is still trapped.', a.rel ? 'العداد بيقرا 0 بار.' : 'العداد بيقرا ' + (e.kind === 'hyd' ? '4' : '6') + ' بار. الضغط لسه محبوس.']); LO.render(); }
  function verifyOk(e) {
    const R = LO.run, a = R.en[e.id], t = R.ts[e.id];
    if (e.verify.startsWith('tester')) return isoDone(e) && t.before && t.after && t.tested.length >= pairsOf(e).length;
    if (e.verify === 'gauge') return a.rel && a.gauge;
    if (e.verify === 'dcbus') return busV() < 50 && a.gauge;
    if (e.verify === 'visual') return R.f.block && a.gauge;
    return false;
  }

  /* ---------- scoring ---------- */
  function score() {
    const R = LO.run, sc = R.sc, out = [], need = pts().filter((p) => p.needed);
    let total = 0; const add = (k, got, max, note) => { out.push({ k, got, max, note }); total += got; };
    add(['Prepare', 'تحضير'], (R.f.notified ? 5 : 0) + (R.f.reviewed ? 5 : 0), 10, ['Inform people and identify every energy source.', 'بلّغ الناس وحدد كل مصادر الطاقة.']);
    add(['Shut down', 'إيقاف'], R.f.stopped && R.f.firstIso !== 'before' ? 10 : R.f.stopped ? 4 : 0, 10, ['Normal stop before isolating.', 'وقفة عادية قبل العزل.']);
    add(['Isolate', 'عزل'], Math.round(20 * need.filter((p) => !pst(p.id).on).length / need.length), 20, ['Every real isolation point must be OFF.', 'كل نقطة عزل حقيقية لازم تبقى OFF.']);
    let lt = 0; for (const p of need) { const s = pst(p.id); let v = 0; if (s.locks.length && !s.on) { v = 0.5; if (s.tag) v += 0.25; const crewOk = !p.group || sc.crew.every((_, i) => s.locks.some((l) => l.owner === i)); if (crewOk) v += 0.25; } lt += v; }
    add(['Lock and tag', 'قفل وتاج'], Math.round(25 * lt / need.length), 25, ['A fitting device, a personal lock and a tag on every point (all workers on group points).', 'جهاز مناسب وقفل شخصي وتاج على كل نقطة (وكل العمال على النقط الجماعية).']);
    const rel = sc.energies.filter((e) => e.release); add(['Stored energy', 'طاقة مخزنة'], rel.length ? Math.round(15 * rel.filter((e) => R.en[e.id].rel).length / rel.length) : 15, 15, ['Vent, block or discharge after isolating.', 'فرّغ أو ثبّت أو اتأكد من التفريغ بعد العزل.']);
    const ve = sc.energies.filter((e) => e.verify), okc = ve.filter(verifyOk).length;
    add(['Verify', 'تحقق'], (R.f.tried ? 5 : 0) + Math.round(15 * okc / ve.length), 20, ['Try to start, then prove-test-prove, gauges and DC bus.', 'جرّب التشغيل وبعدين اختبر-اختبر-اختبر والعدادات والـDC bus.']);
    const pen = Math.min(40, R.mistakes.reduce((a, m) => a + m.pen, 0));
    return { rows: out, total: Math.max(0, Math.min(100, total - pen)), raw: total, pen };
  }
  function declare() {
    const R = LO.run;
    const unsafe = !allIso() || sc_unreleased();
    if (unsafe) fb('bad', ['You declared the machine safe while energy is still present. This would be a serious violation.', 'أعلنت إن الماكينة آمنة والطاقة لسه موجودة. ده مخالفة خطيرة.'], 15, 'declared_unsafe');
    R.f.declared = true; R.done = true; LO.render();
  }
  const sc_unreleased = () => LO.run.sc.energies.some((e) => e.release && !LO.run.en[e.id].rel);

  /* ---------- diagnosis: review my isolation (does not change the score) ---------- */
  function review(R) {
    const sc = R.sc, out = [], add = (kind, en, ar, ref) => out.push({ kind, text: [en, ar], ref: ref || null });
    const nameOf = (p) => T(p.name);
    // 1 prepare, 2 stop
    if (!R.f.notified) add('warn', 'Operators and neighbours are not informed yet.', 'المشغلين والجيران لسه متبلغوش.', 'OSHA 1910.147(d)(1)');
    if (!R.f.reviewed) add('warn', 'You have not reviewed the energy sources of this machine.', 'لسه مراجعتش مصادر الطاقة في الماكينة دي.', 'OSHA 1910.147(d)(1)');
    if (R.f.firstIso === 'before') add('bad', 'A point was isolated before the normal stop. This can damage the machine and is unsafe.', 'اتعزلت نقطة قبل الوقفة العادية. ده ممكن يبوّظ الماكينة وغير آمن.', 'OSHA 1910.147(d)(2)');
    else if (!R.f.stopped) add('warn', 'The machine has not been stopped normally yet.', 'الماكينة لسه موقفتهاش وقفة عادية.', 'OSHA 1910.147(d)(2)');
    // 3, 4: points
    for (const p of pts()) {
      const st = pst(p.id), t = D.ptypes[p.type];
      if (p.needed) {
        if (st.on) add('bad', nameOf(p) + (t.kind === 'fluid' ? ' is still open.' : ' is still ON.') + ' It is a real isolation point.', nameOf(p) + (t.kind === 'fluid' ? ' لسه مفتوحة.' : ' لسه ON.') + ' وهي نقطة عزل حقيقية.', 'OSHA 1910.147(d)(3)');
        else if (!st.locks.length) add('bad', nameOf(p) + ' is OFF but not locked. Someone can switch it back on.', nameOf(p) + ' OFF بس مش مقفولة. أي حد يقدر يرجّعها.', 'OSHA 1910.147(d)(4)');
        else {
          const names = st.locks.map((l) => sc.crew[l.owner]).join(', ');
          if (!st.tag) add('warn', nameOf(p) + ' is locked (' + names + ') but has no tag. The tag tells others who and why.', nameOf(p) + ' مقفولة (' + names + ') بس من غير تاج. التاج بيقول مين وليه.', 'OSHA 1910.147(d)(4)');
          else add('ok', nameOf(p) + ': isolated, locked and tagged (' + names + ').', nameOf(p) + ': معزولة ومقفولة وعليها تاج (' + names + ').', null);
          if (p.group && !sc.crew.every((_, i) => st.locks.some((l) => l.owner === i))) add('warn', nameOf(p) + ' is a group point but not every worker has a lock on it.', nameOf(p) + ' نقطة جماعية بس مش كل عامل عليها قفله.', 'OSHA 1910.147(f)(3)');
          if (st.locks.some((l) => l.lock === 'pl_blue')) add('warn', nameOf(p) + ' uses a shared department lock. Use a personal lock.', nameOf(p) + ' عليها قفل القسم المشترك. استخدم قفل شخصي.', 'OSHA 1910.147(c)(5)');
        }
      } else {
        if (!st.on) add('warn', nameOf(p) + ' is a control device. Pressing it is not isolation.', nameOf(p) + ' جهاز تحكم. الضغط عليه مش عزل.', 'ISO 14118');
        if (st.locks.length) add('warn', 'A lock is on ' + nameOf(p) + ', a control device. It protects nobody.', 'فيه قفل على ' + nameOf(p) + ' وهو جهاز تحكم. مبيحميش حد.', 'OSHA 1910.147(d)(4)');
      }
    }
    // 5: stored energy
    for (const e of sc.energies.filter((x) => x.release)) {
      const a = R.en[e.id];
      if (a.rel) add('ok', T(e.name) + ': released.', T(e.name) + ': اتفرّغت.', null);
      else add(e.pts.every((pid) => !pst(pid).on && locked(pid)) ? 'bad' : 'warn', T(e.name) + ' has not been released. It can still move or shock after the switch is off.', T(e.name) + ' لسه متفرّغتش. ممكن تتحرك أو تكهرب بعد ما المفتاح يتفصل.', 'OSHA 1910.147(d)(5)');
    }
    // 6: verification
    if (!R.f.tried) add('warn', 'You have not tried to start the machine (the "try-out" check).', 'لسه مجرّبتش تشغيل الماكينة (فحص الـtry-out).', 'OSHA 1910.147(d)(6)');
    for (const e of sc.energies.filter((x) => x.verify)) {
      const t = R.ts[e.id], need = pairsOf(e).length;
      if (verifyOk(e)) { add('ok', T(e.name) + ': verified.', T(e.name) + ': اتحقق منها.', null); continue; }
      if (e.verify.startsWith('tester')) {
        if (!isoDone(e)) { add('bad', T(e.name) + ': the source is not isolated, so a test would read live.', T(e.name) + ': المصدر مش معزول، فالاختبار هيقرا جهد.', 'EN 50110-1'); continue; }
        const miss = [];
        if (!t.before) miss.push(['prove the tester on a known source first', 'جرّب التستر على مصدر معروف الأول']);
        if (t.tested.length < need) miss.push(['test every pair (' + t.tested.length + '/' + need + ')', 'اختبر كل الأزواج (' + t.tested.length + '/' + need + ')']);
        if (!t.after) miss.push(['prove the tester again after testing', 'جرّب التستر تاني بعد الاختبار']);
        add('warn', T(e.name) + ': ' + miss.map((m) => m[0]).join('; ') + '.', T(e.name) + ': ' + miss.map((m) => m[1]).join('؛ ') + '.', 'EN 50110-1 / IEC 61243-3');
      } else if (e.verify === 'gauge') add('warn', T(e.name) + ': read the gauge after bleeding. It must show 0 bar.', T(e.name) + ': اقرا العداد بعد التفريغ. لازم يقرا 0 بار.', 'ISO 4414 / ISO 4413');
      else if (e.verify === 'dcbus') add('warn', T(e.name) + ': wait and read the DC bus. It must fall below 50 V.', T(e.name) + ': استنى واقرا الـDC bus. لازم ينزل تحت 50 فولت.', 'IEC 61800-5-1');
      else if (e.verify === 'visual') add('warn', T(e.name) + ': confirm the safety block is in place and read the gauge.', T(e.name) + ': اتأكد إن بلوكة الأمان في مكانها واقرا العداد.', 'ISO 14118');
    }
    if (R.mistakes.length) add('info', 'Mistakes so far: ' + R.mistakes.map((m) => m.text[0]).join(' | '), 'غلطات لحد دلوقتي: ' + R.mistakes.map((m) => m.text[1]).join(' | '), null);
    const worst = out.some((x) => x.kind === 'bad') ? 'bad' : out.some((x) => x.kind === 'warn') ? 'warn' : 'ok';
    const nextBad = out.find((x) => x.kind === 'bad') || out.find((x) => x.kind === 'warn');
    return { items: out, state: worst, next: nextBad ? nextBad.text : null };
  }
  function reviewText(R, rv) {
    const sc = R.sc;
    return 'Scenario: ' + sc.name[0] + '\nTask: ' + sc.task[0] + '\nCrew: ' + sc.crew.join(', ') + '\n\nPOINTS:\n' + pts().map((p) => { const s = pst(p.id); return '- ' + p.name[0] + ' (' + (D.ptypes[p.type].iso ? 'isolation device' : 'control device') + (p.needed ? ', needs isolation' : '') + '): ' + (s.on ? 'ON' : 'OFF') + ', locks: ' + (s.locks.length ? s.locks.map((l) => sc.crew[l.owner]).join('/') : 'none') + ', tag: ' + (s.tag ? 'yes' : 'no') + (s.dev ? ', device: ' + dev(s.dev).name[0] : ''); }).join('\n') + '\n\nSTORED ENERGY:\n' + (sc.energies.filter((e) => e.release).map((e) => '- ' + e.name[0] + ': ' + (R.en[e.id].rel ? 'released' : 'NOT released')).join('\n') || '(none)') + '\n\nOUR BUILT-IN REVIEW:\n' + rv.items.map((x) => '- [' + x.kind + '] ' + x.text[0]).join('\n');
  }
  async function aiReview(R) {
    const rv = (R.rev = R.rev || {}); rv.ai = { text: '', busy: true, err: '' }; LO.render();
    try {
      const q = 'A trainee is practising lockout/tagout on a simulator. Here is the current state.\n\n' + reviewText(R, review(R)) + '\n\nReview the isolation like a senior safety engineer (OSHA 1910.147, ISO 14118, EN 50110-1 as relevant). 1) What is unsafe or missing? 2) What did the built-in review miss? 3) The single next step. Keep it under 220 words. ' + EL.ai.lang();
      rv.ai.text = await EL.ai.ask([{ role: 'user', content: q }]);
    } catch (e) { rv.ai.err = String(e.message || e); }
    rv.ai.busy = false; LO.render();
  }
  function reviewCard(R) {
    const rv = (R.rev = R.rev || { shown: false, ai: null });
    const card = h('div', { class: 'card', style: { marginTop: '10px' } }, h('b', { text: T(['Review my isolation (diagnosis)', 'راجع عزلي (تشخيص)']) }),
      h('p', { class: 'mute', text: T(['Checks the lock, tag, stored energy and verification you have done so far. It does not change your score.', 'بيراجع القفل والتاج والطاقة المخزنة والتحقق اللي عملته لحد دلوقتي. مبيغيّرش درجتك.']) }));
    card.appendChild(h('div', { class: 'row wrap' }, h('button', { class: 'btn sm' + (rv.shown ? ' on' : ''), onclick: () => { rv.shown = !rv.shown; LO.render(); }, text: T(['Built-in review', 'مراجعة مدمجة']) }),
      h('button', { class: 'btn sm', onclick: () => { if (!EL.ai.ready()) { ui.toast(['Online AI needs your API key. Add it in the Bench tab, Diagnosis, AI mode. The built-in review works without it.', 'الـAI الأونلاين محتاج مفتاح الـAPI. ضيفه في تبويب المعمل، التشخيص، وضع الـAI. المراجعة المدمجة بتشتغل من غيره.'], 'warn', 6000); return; } aiReview(R); }, text: T(['Ask online AI', 'اسأل الـAI أونلاين']) })));
    if (rv.shown) {
      const r = review(R);
      const ico = { ok: '✔', bad: '✖', warn: '!', info: 'i' };
      card.appendChild(h('div', { class: 'lr-sum ' + r.state, text: r.state === 'ok' ? T(['Everything done so far is correct.', 'كل اللي عملته لحد دلوقتي صح.']) : T(['Next: ', 'الخطوة الجاية: ']) + T(r.next) }));
      r.items.forEach((x) => card.appendChild(h('div', { class: 'lr-it ' + x.kind }, h('span', { class: 'lr-ic', text: ico[x.kind] }), h('div', { class: 'grow' }, h('div', { text: T(x.text) }), x.ref ? h('div', { class: 'mute', style: { fontSize: '11px' }, text: x.ref }) : null))));
    }
    if (rv.ai && (rv.ai.busy || rv.ai.text || rv.ai.err)) card.appendChild(h('div', { class: 'dg-ai', style: { marginTop: '8px' } }, rv.ai.busy ? h('p', { class: 'mute', text: T(['Asking...', 'بسأل...']) }) : null, rv.ai.err ? h('p', { class: 'bad-t', text: rv.ai.err }) : null, rv.ai.text ? h('div', { class: 'dg-aitext', text: rv.ai.text }) : null));
    return card;
  }
  LO.review = review;

  /* ---------- UI ---------- */
  LO.init = function () { LO.render(); ui.onRefresh(() => LO.render()); };
  LO.onShow = () => LO.render();
  LO.start = (id) => { const sc = D.scenarios.find((x) => x.id === id); if (sc) { LO.tab = 'trainer'; LO.run = newRun(sc); LO.render(); } };
  LO.render = function () {
    const root = $('#lotoRoot'); if (!root) return;
    const scrollTop = root.parentElement.scrollTop;
    root.innerHTML = ''; root.classList.remove('wide');
    const tabs = h('div', { class: 'seg', style: { marginBottom: '12px' } });
    for (const [id, nm] of [['practice', ['Practice board', 'بورد التدريب']], ['board', ['Master board', 'اللوحة الشاملة']], ['trainer', ['Trainer', 'التدريب']], ['catalog', ['Locks, keys and tags', 'الأقفال والمفاتيح والتاجات']], ['rules', ['Rules', 'القواعد']]]) tabs.appendChild(h('button', { class: 'btn' + (LO.tab === id ? ' on' : ''), onclick: () => { LO.tab = id; LO.render(); }, text: T(nm) }));
    root.appendChild(tabs);
    if (LO.tab === 'practice' && EL.lotoPractice) EL.lotoPractice.render(root, () => LO.render()); else if (LO.tab === 'board' && EL.lotoMaster) EL.lotoMaster.render(root, () => LO.render()); else if (LO.tab === 'catalog') renderCatalog(root); else if (LO.tab === 'rules') renderRules(root); else if (!LO.run) renderPick(root); else renderRun(root);
    root.parentElement.scrollTop = scrollTop;
  };

  function renderPick(root) {
    root.appendChild(h('h3', { text: T(['Lock-out tag-out trainer', 'تدريب اللوتو (قفل وتاج)']) }));
    root.appendChild(h('p', { class: 'mute', text: T(['Pick a machine. You will go through the six steps: prepare, shut down, isolate, lock and tag, release stored energy, verify. In Learn mode the app shows which device fits which point. In Exam mode it does not.', 'اختار ماكينة. هتعدّي على الست خطوات: تحضير، إيقاف، عزل، قفل وتاج، تفريغ الطاقة المخزنة، تحقق. في وضع التعلم التطبيق بيوريك أنهي جهاز بيناسب أنهي نقطة. وفي وضع الامتحان لأ.']) }));
    root.appendChild(h('div', { class: 'seg', style: { marginBottom: '10px' } },
      h('button', { class: 'btn' + (LO.mode === 'learn' ? ' on' : ''), onclick: () => { LO.mode = 'learn'; LO.render(); }, text: T(['Learn mode', 'وضع التعلم']) }),
      h('button', { class: 'btn' + (LO.mode === 'exam' ? ' on' : ''), onclick: () => { LO.mode = 'exam'; LO.render(); }, text: T(['Exam mode', 'وضع الامتحان']) })));
    const grid = h('div', { class: 'catgrid' });
    for (const sc of D.scenarios) grid.appendChild(h('div', { class: 'dev', style: { cursor: 'pointer', flexDirection: 'column' }, onclick: () => { LO.run = newRun(sc); LO.render(); } },
      h('div', { class: 'row' }, h('span', { html: D.icon(sc.icon, 56) }), h('div', {}, h('b', { text: T(sc.name) }), h('div', { class: 'mute', text: T(['Level ', 'المستوى ']) + sc.level + ' / 3' }))),
      h('p', { class: 'mute', text: T(sc.task) })));
    root.appendChild(grid);
  }

  function diagram(R) {
    const sc = R.sc;
    const NS = 'http://www.w3.org/2000/svg';
    let s = '';
    const nm = {}; for (const n of sc.nodes) nm[n.id] = n;
    for (const [a, b] of sc.links) { const A = nm[a], B = nm[b]; s += `<line x1="${A.x + 36}" y1="${A.y + 36}" x2="${B.x + 36}" y2="${B.y + 36}" stroke="#46587c" stroke-width="3" stroke-dasharray="6 5"/>`; }
    for (const n of sc.nodes) {
      if (n.point) {
        const p = pdef(n.point), st = pst(n.point), t = D.ptypes[p.type];
        const ring = st.on ? '#e5483b' : st.locks.length ? '#4fc16a' : '#FDC300';
        const sel = R.sel === n.point;
        s += `<g data-pt="${p.id}" style="cursor:pointer" transform="translate(${n.x},${n.y})"><rect x="-6" y="-6" width="84" height="104" rx="12" fill="${sel ? 'rgba(71,191,217,.18)' : 'rgba(255,255,255,.03)'}" stroke="${ring}" stroke-width="${sel ? 4 : 3}"/><g transform="translate(4,0)">${D.icon(t.icon, 64).replace(/^<svg[^>]*>|<\/svg>$/g, '').replace(/^/, '<svg viewBox="0 0 64 64" width="64" height="64">') + '</svg>'}</g><text x="36" y="76" text-anchor="middle" font-size="11" font-weight="700" fill="${ring}">${st.on ? 'ON' : st.locks.length ? 'LOCKED' : 'OFF'}</text><text x="36" y="90" text-anchor="middle" font-size="9" fill="#aab6d3">${p.name[0].split(' ')[0]}</text>${st.locks.length ? `<g transform="translate(46,-8) scale(.4)">${D.icon('padlock_red', 64).replace(/<\/?svg[^>]*>/g, '')}</g>` : ''}</g>`;
      } else {
        s += `<g transform="translate(${n.x},${n.y})"><svg viewBox="0 0 64 64" width="72" height="72" x="0" y="0">${D.icon(n.icon, 64).replace(/<\/?svg[^>]*>/g, '')}</svg><text x="36" y="86" text-anchor="middle" font-size="10" fill="#c9d4ea">${T(n.label)}</text></g>`;
      }
    }
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 600 300'); svg.style.width = '100%'; svg.style.background = '#0a111e'; svg.style.borderRadius = '12px'; svg.style.border = '1px solid #25344f';
    svg.innerHTML = s;
    svg.addEventListener('click', (e) => { const gp = e.target.closest('[data-pt]'); if (gp) { R.sel = gp.dataset.pt; LO.render(); } });
    return svg;
  }

  function stepDone(i) {
    const R = LO.run, sc = R.sc;
    if (i === 0) return R.f.notified && R.f.reviewed;
    if (i === 1) return R.f.stopped;
    if (i === 2) return allIso();
    if (i === 3) return pts().filter((p) => p.needed).every((p) => locked(p.id) && pst(p.id).tag > 0);
    if (i === 4) return sc.energies.filter((e) => e.release).every((e) => R.en[e.id].rel);
    if (i === 5) return R.f.tried && sc.energies.every(verifyOk);
  }

  function renderRun(root) {
    const R = LO.run, sc = R.sc, cur = [0, 1, 2, 3, 4, 5].find((i) => !stepDone(i));
    root.appendChild(h('div', { class: 'lotobar' },
      h('button', { class: 'btn', onclick: () => { LO.run = null; LO.render(); }, text: (EL.isRtl() ? '→ ' : '← ') + T(['Machines', 'الماكينات']) }),
      h('b', { class: 'grow', text: T(sc.name) }),
      h('span', { class: 'pill', text: LO.mode === 'learn' ? T(['Learn mode', 'وضع التعلم']) : T(['Exam mode', 'وضع الامتحان']) }),
      h('button', { class: 'btn', onclick: () => { LO.run = newRun(sc); LO.render(); }, text: T(['Restart', 'ابدأ تاني']) })));
    root.appendChild(h('p', { text: T(sc.task) }));
    const steps = h('div', { class: 'steps' });
    D.steps.forEach((s, i) => steps.appendChild(h('div', { class: 'stp' + (stepDone(i) ? ' done' : i === cur ? ' cur' : ''), text: (i + 1) + '. ' + T(s) })));
    root.appendChild(steps);
    if (R.done) { renderScore(root); return; }
    const grid = h('div', { class: 'lgrid' });
    const left = h('div', {}), right = h('div', {});
    left.appendChild(diagram(R));
    // machine state + log
    const log = h('div', { class: 'msgs', style: { marginTop: '8px' } });
    R.log.slice(0, 4).forEach((l) => log.appendChild(h('div', { class: 'msg ' + (l.kind || ''), text: T(l.msg) })));
    left.appendChild(log);
    // selected point panel
    left.appendChild(pointPanel(R));
    left.appendChild(reviewCard(R));
    grid.appendChild(left);
    // steps accordion
    const acc = h('div', {});
    if (cur !== R.lastCur) { R.openSet.add(cur); R.lastCur = cur; }
    const sec = (i, body) => acc.appendChild(h('details', { class: 'card', open: R.openSet.has(i) ? true : null, ontoggle: (e) => { if (e.target.open) R.openSet.add(i); else R.openSet.delete(i); } }, h('summary', { style: { cursor: 'pointer', fontWeight: '700' }, text: (stepDone(i) ? '✔ ' : '') + (i + 1) + '. ' + T(D.steps[i]) }), body));
    sec(0, h('div', {}, hint(['Know every energy source and tell the people who are affected before you do anything.', 'اعرف كل مصدر طاقة وبلّغ الناس المتأثرة قبل ما تعمل أي حاجة.']),
      h('div', { class: 'row wrap' }, h('button', { class: 'btn' + (R.f.notified ? ' ok' : ''), onclick: () => { R.f.notified = true; fb('ok', ['Operators and neighbours informed.', 'بلّغت المشغلين والجيران.']); LO.render(); }, text: (R.f.notified ? '✔ ' : '') + T(['Inform operators', 'بلّغ المشغلين']) }),
        h('button', { class: 'btn' + (R.f.reviewed ? ' ok' : ''), onclick: () => { R.f.reviewed = true; energyList(); }, text: (R.f.reviewed ? '✔ ' : '') + T(['Review energy sources', 'راجع مصادر الطاقة']) })),
      h('div', { class: 'mute', style: { marginTop: '6px' }, text: R.f.reviewed ? sc.energies.map((e) => '• ' + T(e.name)).join('\n') : '', style2: '' })));
    sec(1, h('div', {}, hint(['Stop the machine with its normal controls before isolating. Isolating a running machine can damage it.', 'وقّف الماكينة بالكنترولز العادية قبل العزل. عزل ماكينة شغالة ممكن يبوّظها.']),
      h('button', { class: 'btn' + (R.f.stopped ? ' ok' : ' pri'), onclick: () => { R.f.stopped = true; fb('ok', ['Machine stopped with the normal STOP.', 'الماكينة وقفت بالـSTOP العادي.']); LO.render(); }, text: (R.f.stopped ? '✔ ' : '') + T(['Normal stop', 'وقفة عادية']) })));
    const rows = h('div', {});
    for (const p of pts()) { const st = pst(p.id), t = D.ptypes[p.type], ol = opLabel[p.type] || [['Operate', 'شغّل'], ['Restore', 'رجّع']]; rows.appendChild(h('div', { class: 'kv', style: { alignItems: 'center' } }, h('span', { style: { cursor: 'pointer' }, onclick: () => { R.sel = p.id; LO.render(); } }, h('span', { html: D.icon(t.icon, 28), style: { verticalAlign: 'middle', marginInlineEnd: '6px' } }), T(p.name)), h('button', { class: 'btn sm' + (st.on ? '' : ' on'), onclick: () => operate(p.id), text: T(st.on ? ol[0] : ol[1]) }))); }
    sec(2, h('div', {}, hint(['Operate every device that cuts an energy source. A stop button or an E-stop is not an isolation device.', 'شغّل كل جهاز بيقطع مصدر طاقة. زرار الستوب أو الطوارئ مش جهاز عزل.']), rows));
    sec(3, h('div', {}, hint(['Fit a lockout device that fits the point, add your personal padlock and a tag. Select a point in the diagram, then use the panel under it.', 'ركّب جهاز لوتو بيناسب النقطة وحط قفلك الشخصي وتاج. اختار نقطة من الرسم وبعدين استخدم اللوحة اللي تحتها.']),
      h('div', {}, ...pts().map((p) => h('div', { class: 'kv' }, h('span', { text: T(p.name) }), h('b', { text: locked(p.id) ? (pst(p.id).tag ? T(['locked + tag', 'قفل + تاج']) : T(['locked, no tag', 'قفل من غير تاج'])) : '-' }))))));
    const er = h('div', {});
    const relEn = sc.energies.filter((e) => e.release);
    if (!relEn.length) er.appendChild(h('p', { class: 'mute', text: T(['No stored energy in this machine.', 'مفيش طاقة مخزنة في الماكينة دي.']) }));
    for (const e of relEn) {
      const a = R.en[e.id], extra = e.release.id === 'wait' ? h('div', { class: 'mute', text: T(['DC bus: ', 'DC bus: ']) + busV().toFixed(0) + ' V   (' + R.f.wait + ' min)' }) : null;
      er.appendChild(h('div', { class: 'kv', style: { alignItems: 'center' } }, h('span', {}, T(e.name), extra), h('button', { class: 'btn sm' + (a.rel ? ' ok' : ''), onclick: () => release(e), text: (a.rel ? '✔ ' : '') + T(e.release.label) })));
    }
    sec(4, h('div', {}, hint(['After the sources are isolated and locked, release trapped pressure, hold raised parts and let capacitors discharge.', 'بعد ما المصادر تتعزل وتتقفل، فرّغ الضغط المحبوس وثبّت الأجزاء المرفوعة وسيب الكباسيتورات تفضى.']), er));
    sec(5, verifyBody(R));
    grid.appendChild(right); right.appendChild(acc);
    root.appendChild(grid);
    root.appendChild(h('div', { class: 'row', style: { margin: '14px 0' } }, h('button', { class: 'btn pri', onclick: declare, text: T(['Declare zero energy: finish and score', 'إعلان الطاقة صفر: خلّص وشوف النتيجة']) })));
    function energyList() { fb('', ['Energy sources: ' + sc.energies.map((e) => T([e.name[0], e.name[1]])).join('; '), 'مصادر الطاقة: ' + sc.energies.map((e) => e.name[1]).join('؛ ')]); LO.render(); }
  }
  function hint(t) { return LO.mode === 'learn' ? h('p', { class: 'mute', style: { margin: '4px 0 8px' }, text: T(t) }) : null; }

  function pointPanel(R) {
    const p = pdef(R.sel), st = pst(R.sel), t = D.ptypes[p.type], c = R.cfg;
    const card = h('div', { class: 'card', style: { marginTop: '10px' } });
    card.appendChild(h('div', { class: 'row' }, h('span', { html: D.icon(t.icon, 44) }), h('div', { class: 'grow' }, h('b', { text: T(p.name) }), h('div', { class: 'mute', text: T(t.name) + (LO.mode === 'learn' ? (t.integral ? T([' - has a padlock hole', ' - فيه فتحة قفل']) : t.iso ? T([' - needs a lockout device', ' - محتاج جهاز لوتو']) : T([' - control device, not isolation', ' - جهاز تحكم، مش عزل'])) : '') }))));
    if (p.note && LO.mode === 'learn') card.appendChild(h('p', { class: 'mute', text: T(p.note) }));
    const inside = EL.lotoBoard && EL.lotoDet && EL.lotoDet.byType[p.type];
    if (inside) card.appendChild(h('div', { class: 'row wrap', style: { margin: '6px 0 0' } }, h('button', { class: 'btn sm', onclick: () => EL.lotoBoard.openDetail(inside), text: '🔍 ' + T(['Look inside this device', 'شوف جوه الجهاز ده']) })));
    const ol = opLabel[p.type] || [['Operate', 'شغّل'], ['Restore', 'رجّع']];
    card.appendChild(h('div', { class: 'row wrap', style: { margin: '8px 0' } }, h('button', { class: 'btn' + (st.on ? '' : ' on'), onclick: () => operate(p.id), text: T(st.on ? ol[0] : ol[1]) }), st.locks.length ? h('button', { class: 'btn sm', onclick: () => removeLocks(p.id), text: T(['Remove my locks (undo)', 'شيل أقفالي (تراجع)']) }) : null));
    // device chooser
    const picks = (title, items, get, set, hintfn) => {
      const box = h('div', { class: 'tools', style: { marginBottom: '8px' } });
      for (const it of items) { const d = it && dev(it.id); box.appendChild(h('div', { class: 'tool' + (get() === (it ? it.id : null) ? ' sel' : ''), onclick: () => { set(it ? it.id : null); LO.render(); } }, h('span', { html: it ? D.icon(d.icon, 48) : D.icon('padlock_red', 48) }), h('div', { text: it ? T(d.name) : T(['Padlock directly (no device)', 'قفل على طول (من غير جهاز)']) }), hintfn && it ? hintfn(d) : null)); }
      return h('div', {}, h('label', { class: 'f', text: title }), box);
    };
    const fitHint = (d) => LO.mode === 'learn' ? h('div', { class: 'fit' + (d.fits && d.fits.includes(p.type) ? '' : ' no'), text: d.fits && d.fits.includes(p.type) ? '✔ ' + T(['fits', 'بيناسب']) : T(['no', 'لأ']) }) : null;
    const devs = [null].concat(D.devices.filter((d) => d.kind === 'device' && d.id !== 'hasp' && d.id !== 'lockbox'));
    card.appendChild(picks(T(['1. Lockout device', '1. جهاز اللوتو']), devs, () => c.dev, (v) => { c.dev = v; }, fitHint));
    card.appendChild(h('div', { class: 'row', style: { margin: '4px 0' } }, h('button', { class: 'btn sm' + (c.hasp ? ' on' : ''), onclick: () => { c.hasp = !c.hasp; LO.render(); }, text: (c.hasp ? '✔ ' : '') + T(['2. Add multi-lock hasp', '2. ضيف هاسب متعدد الأقفال']) })));
    card.appendChild(picks(T(['3. Padlock (your key stays with you)', '3. القفل (المفتاح معاك)']), D.devices.filter((d) => d.kind === 'lock'), () => c.lock, (v) => { c.lock = v; }));
    if (R.sc.crew.length > 1) card.appendChild(h('div', {}, h('label', { class: 'f', text: T(['Lock owner', 'صاحب القفل']) }), h('select', { onchange: (e) => { c.owner = +e.target.value; } }, R.sc.crew.map((n, i) => h('option', { value: i, selected: c.owner === i ? true : null, text: n })))));
    card.appendChild(h('div', { class: 'row wrap', style: { margin: '8px 0' } }, h('button', { class: 'btn' + (c.tag ? ' on' : ''), onclick: () => { c.tag = !c.tag; LO.render(); }, text: (c.tag ? '✔ ' : '') + T(['4. Attach tag', '4. حط تاج']) }), h('button', { class: 'btn pri', onclick: () => applyLock(p.id), text: T(['Apply lock', 'ركّب القفل']) })));
    if (st.locks.length) card.appendChild(h('div', { class: 'mute', text: T(['On this point: ', 'على النقطة: ']) + (st.dev ? T(dev(st.dev).name) + ' + ' : '') + (st.hasp ? 'hasp + ' : '') + st.locks.map((l) => R.sc.crew[l.owner]).join(', ') + (st.tag ? ' + ' + st.tag + ' tag' : '') }));
    return card;
  }

  function verifyBody(R) {
    const sc = R.sc, body = h('div', {});
    body.appendChild(hint(['First try to start the machine from its normal controls. Then prove it dead with the tester (prove-test-prove) and check gauges and the DC bus.', 'جرّب تشغل الماكينة من كنترولها العادي الأول. وبعدين اثبت إنها ميتة بالتستر (اختبر-اختبر-اختبر) واتأكد من العدادات والـDC bus.']));
    body.appendChild(h('div', { class: 'row wrap', style: { marginBottom: '8px' } }, h('button', { class: 'btn' + (R.f.tried ? ' ok' : ''), onclick: tryStart, text: (R.f.tried ? '✔ ' : '') + T(['Press START (try to start)', 'اضغط START (جرّب التشغيل)']) })));
    for (const e of sc.energies) {
      const t = R.ts[e.id], card = h('div', { class: 'card', style: { background: 'var(--bg)' } });
      card.appendChild(h('div', { class: 'row' }, h('b', { class: 'grow', text: T(e.name) }), h('span', { class: 'pill ' + (verifyOk(e) ? 'ok' : ''), text: verifyOk(e) ? T(['verified', 'متأكد']) : T(['not verified', 'مش متأكد']) })));
      if (e.verify.startsWith('tester')) {
        card.appendChild(h('div', { class: 'row wrap', style: { margin: '6px 0' } }, h('button', { class: 'btn sm' + (t.before ? ' ok' : ''), onclick: () => prove(e), text: (t.before ? '✔ ' : '') + T(['A. Prove tester (known source)', 'أ. اختبر التستر على مصدر معروف']) })));
        const ps = h('div', { class: 'row wrap' });
        for (const pr of pairsOf(e)) ps.appendChild(h('button', { class: 'btn sm' + (t.tested.includes(pr) ? ' ok' : ''), onclick: () => testPair(e, pr), text: pr }));
        card.appendChild(h('div', {}, h('label', { class: 'f', text: T(['B. Test every pair', 'ب. اختبر كل الأزواج']) }), ps));
        if (t.last) card.appendChild(h('div', { class: 'msg ' + (t.last.v ? 'bad' : 'ok'), style: { marginTop: '6px' }, text: t.last.pr + ': ' + t.last.v + ' V' }));
        card.appendChild(h('div', { class: 'row wrap', style: { margin: '6px 0' } }, h('button', { class: 'btn sm' + (t.after ? ' ok' : ''), onclick: () => prove(e), text: (t.after ? '✔ ' : '') + T(['C. Prove tester again', 'ج. اختبر التستر تاني']) })));
      } else if (e.verify === 'gauge') card.appendChild(h('button', { class: 'btn sm', onclick: () => gaugeRead(e), text: T(['Read the pressure gauge', 'اقرا عداد الضغط']) }));
      else if (e.verify === 'dcbus') card.appendChild(h('div', { class: 'row wrap' }, h('button', { class: 'btn sm', onclick: () => { R.en[e.id].gauge = true; fb(busV() < 50 ? 'ok' : 'bad', ['DC bus reads ' + busV().toFixed(0) + ' V' + (busV() < 50 ? '.' : '. Still dangerous: wait more.'), 'الـDC bus بيقرا ' + busV().toFixed(0) + ' فولت' + (busV() < 50 ? '.' : '. لسه خطر: استنى أكتر.')]); LO.render(); }, text: T(['Measure the DC bus (+ to -)', 'قيس الـDC bus (+ مع -)']) }), h('button', { class: 'btn sm', onclick: () => { if (!pst('qs').on && locked('qs')) { R.f.wait += 1; fb('', ['DC bus now ' + busV().toFixed(0) + ' V', 'الـDC bus دلوقتي ' + busV().toFixed(0) + ' فولت']); if (busV() < 50) R.en[e.id].rel = true; LO.render(); } else fb('bad', ['Isolate and lock the drive first.', 'اعزل واقفل الانفرتر الأول.'], 6, 'releaseearly_' + e.id); }, text: T(['Wait 1 minute', 'استنى دقيقة']) })));
      else if (e.verify === 'visual') card.appendChild(h('button', { class: 'btn sm', onclick: () => { R.en[e.id].gauge = true; fb(R.f.block ? 'ok' : 'bad', [R.f.block ? 'The block holds the ram.' : 'Nothing holds the ram! It can fall.', R.f.block ? 'البلوكة ماسكة الرام.' : 'مفيش حاجة ماسكة الرام! ممكن يقع.']); LO.render(); }, text: T(['Check that the ram is mechanically held', 'اتأكد إن الرام ممسوك ميكانيكيًا']) }));
      body.appendChild(card);
    }
    return body;
  }

  function renderScore(root) {
    const R = LO.run, s = score();
    const grade = s.total >= 90 ? ['Safe to work. Well done.', 'آمن للشغل. شغل ممتاز.', 'ok'] : s.total >= 70 ? ['Needs improvement. Review the mistakes.', 'محتاج تحسين. راجع الأخطاء.', 'warn'] : ['Unsafe. This would be a violation on site.', 'مش آمن. ده يعتبر مخالفة في الموقع.', 'bad'];
    const card = h('div', { class: 'card ' + grade[2] }, h('h3', { text: T(['Result: ', 'النتيجة: ']) + s.total + ' / 100' }), h('p', { text: T(grade) }));
    for (const r of s.rows) card.appendChild(h('div', { class: 'kv' }, h('span', {}, T(r.k), h('div', { class: 'mute', style: { fontSize: '12px' }, text: T(r.note) })), h('b', { text: r.got + ' / ' + r.max })));
    if (s.pen) card.appendChild(h('div', { class: 'kv' }, h('span', { text: T(['Penalties for mistakes', 'خصم الأخطاء']) }), h('b', { text: '-' + s.pen })));
    root.appendChild(card);
    if (R.mistakes.length) { const m = h('div', { class: 'card bad' }, h('h3', { text: T(['Mistakes', 'الأخطاء']) })); R.mistakes.forEach((x) => m.appendChild(h('div', { class: 'kv' }, h('span', { text: T(x.text) }), h('b', { text: '-' + x.pen })))); root.appendChild(m); }
    const need = pts().filter((p) => p.needed);
    root.appendChild(h('div', { class: 'card' }, h('h3', { text: T(['What the correct isolation looks like', 'شكل العزل الصح']) }), ...need.map((p) => h('div', { class: 'kv' }, h('span', { text: T(p.name) }), h('b', { text: (D.ptypes[p.type].integral ? T(['padlock + tag', 'قفل + تاج']) : T(['lockout device + padlock + tag', 'جهاز لوتو + قفل + تاج'])) })))));
    root.appendChild(h('div', { class: 'row' }, h('button', { class: 'btn pri', onclick: () => { LO.run = newRun(R.sc); LO.render(); }, text: T(['Try again', 'جرّب تاني']) }), h('button', { class: 'btn', onclick: () => { LO.run = null; LO.render(); }, text: T(['Other machines', 'ماكينات تانية']) })));
  }

  /* ---------- catalog ---------- */
  function catOf(d) { if (d.kind === 'lock' || d.kind === 'tag') return 'locks'; if (d.kind === 'tool') return 'tools'; const cs = new Set((d.fits || []).map((x) => CATMAP[x])); return cs; }
  function renderCatalog(root) {
    root.appendChild(h('h3', { text: T(['Lockout devices, padlocks, keys and tags', 'أجهزة اللوتو والأقفال والمفاتيح والتاجات']) }));
    root.appendChild(h('p', { class: 'mute', text: T(['What each device is and which isolation point it fits. A device fits only the point types shown in green.', 'كل جهاز إيه هو وبيناسب أنهي نقطة عزل. الجهاز بيناسب النقط الخضرا بس.']) }));
    const f = h('div', { class: 'row wrap', style: { marginBottom: '10px' } });
    for (const [id, nm] of CATS) f.appendChild(h('button', { class: 'btn sm' + (LO.cat === id ? ' on' : ''), onclick: () => { LO.cat = id; LO.render(); }, text: T(nm) }));
    root.appendChild(f);
    const grid = h('div', { class: 'catgrid' });
    for (const d of D.devices) {
      const c = catOf(d);
      if (LO.cat !== 'all' && !(typeof c === 'string' ? c === LO.cat : c.has(LO.cat))) continue;
      const did = EL.lotoBoard && EL.lotoBoard.devMap[d.id];
      const card = h('div', { class: 'dev', style: did ? { cursor: 'pointer' } : null, onclick: did ? () => EL.lotoBoard.openDetail(did) : null }, h('span', { html: D.icon(d.icon, 72) }), h('div', {}, h('b', { text: T(d.name) }), h('p', { style: { margin: '4px 0' }, text: T(d.desc) }),
        d.fits ? h('div', {}, h('span', { class: 'mute', text: T(['Fits: ', 'بيناسب: ']) }), ...d.fits.map((x) => h('span', { class: 'fit', text: T(D.ptypes[x].name) })), d.control ? h('div', { class: 'mute', text: T(['Control device only. Not an isolation point.', 'جهاز تحكم بس. مش نقطة عزل.']) }) : null) : null,
        h('p', { class: 'mute', style: { margin: '4px 0' }, text: '💡 ' + T(d.tip) }), did ? h('span', { class: 'mb-go', text: T(['Tap to look inside', 'اضغط عشان تشوف جوه']) }) : null));
      grid.appendChild(card);
    }
    root.appendChild(grid);
    root.appendChild(h('h3', { style: { marginTop: '18px' }, text: T(['Isolation point types', 'أنواع نقط العزل']) }));
    const g2 = h('div', { class: 'catgrid' });
    for (const [id, t] of Object.entries(D.ptypes)) {
      const fitting = D.devices.filter((d) => d.fits && d.fits.includes(id));
      g2.appendChild(h('div', { class: 'dev' }, h('span', { html: D.icon(t.icon, 64) }), h('div', {}, h('b', { text: T(t.name) }), h('div', { class: 'mute', text: t.iso ? (t.integral ? T(['Has a padlock hole: padlock directly or hasp.', 'فيه فتحة قفل: قفل على طول أو هاسب.']) : T(['Needs a lockout device.', 'محتاج جهاز لوتو.'])) : T(['Control device: not an isolation point.', 'جهاز تحكم: مش نقطة عزل.']) }), h('div', {}, ...fitting.map((d) => h('span', { class: 'fit', text: T(d.name) }))))));
    }
    root.appendChild(g2);
  }
  function renderRules(root) {
    root.appendChild(h('h3', { text: T(['LOTO rules in short', 'قواعد اللوتو باختصار']) }));
    for (const [t, b] of D.rules) root.appendChild(h('div', { class: 'card' }, h('b', { text: T(t) }), h('p', { text: T(b) })));
    root.appendChild(h('p', { class: 'mute', text: T(['This is a training aid. On site, follow your company LOTO procedure and the applicable standard.', 'ده تطبيق تدريب. في الموقع اتبع إجراء اللوتو بتاع الشركة والمعيار المطبق.']) }));
  }
})(typeof window !== 'undefined' ? window : globalThis);
