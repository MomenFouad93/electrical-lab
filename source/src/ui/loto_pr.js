/* LOTO practice board: plug in, run, isolate, lock, release, test. The simulation behind loto_pr_art.js. */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, L = EL.lotoData, A = EL.lotoPrArt, LB = EL.lotoBoard;
  if (!L || !A || !LB) return;
  const PR = (EL.lotoPractice = { job: 'free', show: true, tool: null, sel: null, iv: null, demo: 0 });
  const $ = (el, id) => el.querySelector('#' + id);
  const pair = (a, b) => [a, b];

  /* ---------- point names and roles ---------- */
  const N = {
    plugB: pair('Blue plug (1-phase 230 V)', 'الفيشة الزرقاء (فاز واحد 230 فولت)'), plugR: pair('Red plug (3-phase 400 V)', 'الفيشة الحمرا (3 فاز 400 فولت)'),
    q1: pair('Rotary isolator Q1', 'سويتش العزل الدوّار Q1'), mccbA: pair('MCCB A (feeds motor M1)', 'بريكر MCCB A (بيغذي الموتور M1)'),
    mccbB: pair('MCCB B (feeds the pump)', 'بريكر MCCB B (بيغذي الطلمبة)'), mcbC: pair('3-pole MCB C (feeds the compressor)', 'ميني بريكر C تلات أقطاب (بيغذي الكمبروسور)'),
    pb1: pair('START pushbutton', 'زرار START'), pb2: pair('STOP pushbutton', 'زرار STOP'), pb3: pair('CYL OUT pushbutton', 'زرار CYL OUT'), pb4: pair('CYL IN pushbutton', 'زرار CYL IN'),
    pb5: pair('E-STOP pushbutton', 'زرار الطوارئ E-STOP'), pb6: pair('RESET pushbutton', 'زرار RESET'),
    bvA: pair('Air isolator valve BV-A', 'محبس عزل الهوا BV-A'), dump: pair('Dump valve', 'محبس التفريغ'), w1: pair('Water supply valve W1', 'محبس مدخل المياه W1'),
    w2: pair('Water outlet valve W2', 'محبس مخرج المياه W2'), w3: pair('Drain valve W3 (big red)', 'محبس الصرف W3 (الأحمر الكبير)'),
    tp1: pair('Test point: Q1 line side', 'نقطة قياس: ناحية دخل Q1'), tp2: pair('Test point: Q1 load side', 'نقطة قياس: ناحية خرج Q1'), tp3: pair('Test point: pump terminals', 'نقطة قياس: أطراف الطلمبة'),
    tp4: pair('Test point: compressor terminals', 'نقطة قياس: أطراف الكمبروسور'), tp5: pair('Test point: blue socket', 'نقطة قياس: البريزة الزرقاء'),
    motor: pair('Motor M1', 'الموتور M1'), comp: pair('Compressor C1', 'الكمبروسور C1'), recv: pair('Air receiver', 'خزان الهوا'), frl: pair('FRL unit (filter, regulator, lubricator)', 'وحدة FRL (فلتر وريجيوليتور ومزيّت)'),
    cyl: pair('Air cylinder', 'سلندر الهوا'), pump: pair('Water pump P1', 'طلمبة المياه P1'), vess: pair('Water vessel V1', 'خزان المياه V1'),
    g1: pair('Gauge G1 (air after the isolator)', 'عداد G1 (هوا بعد العزل)'), g2: pair('Gauge G2 (receiver)', 'عداد G2 (الخزان)'), g3: pair('Gauge G3 (water loop)', 'عداد G3 (لوب المياه)'), g4: pair('Gauge G4 (vessel)', 'عداد G4 (الخزان)'),
  };
  const CAT = { plugB: 'src', plugR: 'src', q1: 'brk', mccbA: 'brk', mccbB: 'brk', mcbC: 'brk', pb1: 'ctrl', pb2: 'ctrl', pb3: 'ctrl', pb4: 'ctrl', pb5: 'ctrl', pb6: 'ctrl', bvA: 'valve', w1: 'valve', w2: 'valve', dump: 'vent', w3: 'vent', motor: 'load', comp: 'load', pump: 'load', cyl: 'load', frl: 'load', recv: 'store', vess: 'store', g1: 'gauge', g2: 'gauge', g3: 'gauge', g4: 'gauge', tp1: 'tp', tp2: 'tp', tp3: 'tp', tp4: 'tp', tp5: 'tp' };
  const CATD = {
    src: pair('Energy source. Unplug it, then lock the plug away so nobody can plug it back in.', 'مصدر طاقة. اسحب الفيشة وبعدين اقفلها عشان محدش يرجّعها.'),
    brk: pair('Isolating device. Switch it OFF, fit a lockout device, add your padlock and a tag.', 'جهاز عزل. اقفله OFF وركّب جهاز لوتو وحط قفلك وتاج.'),
    ctrl: pair('Control device only. It starts or stops the machine but does not isolate it.', 'جهاز تحكم بس. بيشغّل أو بيوقّف الماكينة لكن مبيعزلهاش.'),
    valve: pair('Isolating valve. Close it, fit a lockout device, add your padlock and a tag. Pressure can stay trapped after it.', 'محبس عزل. اقفله وركّب جهاز لوتو وحط قفلك وتاج. الضغط ممكن يفضل محبوس بعده.'),
    vent: pair('Vent or drain valve. Open it after the supply is locked to release the trapped pressure, then read the gauge.', 'محبس تفريغ أو صرف. افتحه بعد ما تقفل المصدر عشان تفرّغ الضغط المحبوس، وبعدين اقرا العداد.'),
    load: pair('Load. It is dead only after the source upstream is isolated, locked and tested.', 'حِمل. بيبقى ميت بعد ما المصدر اللي قبله يتعزل ويتقفل ويتختبر بس.'),
    store: pair('Stored energy. It keeps its pressure after the supply is off. Release it and read the gauge.', 'طاقة مخزنة. بيفضل محتفظ بالضغط بعد ما المصدر يتفصل. فرّغه واقرا العداد.'),
    gauge: pair('Gauge. It must read 0 bar before work starts.', 'عداد. لازم يقرا 0 بار قبل ما الشغل يبدأ.'),
    tp: pair('Test point. Use the tester here: prove it on the proving unit, test, then prove it again.', 'نقطة قياس. استخدم التستر هنا: اثبته على وحدة الإثبات وبعدين اختبر وبعدين اثبته تاني.'),
  };
  const W = {
    on: pair('ON', 'ON'), off: pair('OFF', 'OFF'), open: pair('Open', 'مفتوح'), closed: pair('Closed', 'مقفول'), plugged: pair('Plugged in', 'مركّبة'), unplugged: pair('Unplugged', 'مسحوبة'),
    locked: pair('Locked out', 'مقفول لوتو'), unlocked: pair('Not locked', 'مش مقفول'), live: pair('Live', 'فيه جهد'), dead: pair('Dead', 'ميت'), reading: pair('Reading', 'القراءة'),
  };

  /* what can take a lock, which way it must be to be isolated */
  const LKP = { q1: { type: 'rotary', integral: true }, mccbA: { type: 'mccb' }, mccbB: { type: 'mccb' }, mcbC: { type: 'mcb' }, plugB: { type: 'plug' }, plugR: { type: 'plug' }, bvA: { type: 'ballvalve' }, dump: { type: 'ballvalve' }, w1: { type: 'ballvalve' }, w2: { type: 'ballvalve' }, w3: { type: 'gatevalve' }, pb1: { type: 'pushbtn' }, pb2: { type: 'pushbtn' }, pb3: { type: 'pushbtn' }, pb4: { type: 'pushbtn' }, pb5: { type: 'estop' }, pb6: { type: 'pushbtn' } };
  const SW = ['q1', 'mccbA', 'mccbB', 'mcbC'], VALVE = ['bvA', 'w1', 'w2', 'w3', 'dump'], PLUG = ['plugB', 'plugR'];
  const safe = (id) => (SW.includes(id) ? !S.st[id] : PLUG.includes(id) ? !S.st[id] : id === 'dump' || id === 'w3' ? !!S.st[id] : VALVE.includes(id) ? !S.st[id] : true);

  /* ---------- state ---------- */
  let S = null;
  function fresh() {
    const lk = {}; for (const k of Object.keys(LKP)) lk[k] = { dev: null, locks: [], tag: 0 };
    return {
      st: { plugB: false, plugR: false, q1: true, mccbA: true, mccbB: true, mcbC: true, bvA: true, dump: false, w1: true, w2: false, w3: false },
      latchM: false, solC: false, estop: false, compRun: false, Prec: 0, Pdown: 0, Pw: 0, cyl: 0, chg: 0, chgE: 0, lk, tl: [], tries: [], log: [], res: null, readout: null, cylTrap: false,
    };
  }
  PR.reset = () => { PR.demo++; S = fresh(); PR.tool = null; PR.sel = null; };
  PR.reset();

  const bump = (id) => { S.chg++; if (SW.includes(id) || PLUG.includes(id)) S.chgE++; };
  /* ---------- derived electrical state ---------- */
  function dv() {
    const c = S.st, red = c.plugR, blue = c.plugB, d = { red, blue, ctrl: blue };
    d.tp1 = red && c.mccbA; d.tp2 = d.tp1 && c.q1; d.tp3 = red && c.mccbB; d.tp4 = red && c.mcbC; d.tp5 = blue;
    d.motor = S.latchM && d.tp2 && d.ctrl && !S.estop; d.pump = d.tp3;
    return d;
  }
  function settle() {
    const d = dv();
    if (!(d.tp2 && d.ctrl)) S.latchM = false;
    if (!d.ctrl || S.estop) S.solC = false;
  }
  const volts = (id) => { const d = dv(); const m = { tp1: d.tp1 && 400, tp2: d.tp2 && 400, tp3: d.tp3 && 400, tp4: d.tp4 && 400, tp5: d.tp5 && 230 }; return m[id] || 0; };

  /* ---------- simulation tick (pressures, motion) ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function tick() {
    const d = dv(), c = S.st;
    if (!d.tp4) S.compRun = false; else if (S.Prec < 5) S.compRun = true; else if (S.Prec >= 6) S.compRun = false;
    if (S.compRun) S.Prec = Math.min(6, S.Prec + 0.25);
    if (c.bvA) {
      if (c.dump) { S.Prec = Math.max(0, S.Prec - 0.25); S.Pdown = Math.max(0, S.Pdown - 0.5); }
      else S.Pdown = clamp(S.Pdown + clamp(S.Prec - S.Pdown, -0.6, 0.6), 0, 6);
    } else if (c.dump) S.Pdown = Math.max(0, S.Pdown - 0.5);
    let tgt = null;
    if (c.w3) tgt = 0; else if (d.pump && c.w1) tgt = c.w2 ? 1.5 : 4; else if (c.w2) tgt = 0;
    if (tgt !== null) { const r = c.w3 ? 0.6 : 0.35; S.Pw = clamp(S.Pw + clamp(tgt - S.Pw, -r, r), 0, 6); }
    if (S.Prec < 0.05) S.Prec = 0; if (S.Pdown < 0.05) S.Pdown = 0; if (S.Pw < 0.05) S.Pw = 0;
    const want = S.solC && S.Pdown >= 2 ? 1 : 0;
    S.cyl = clamp(S.cyl + clamp(want - S.cyl, -0.25, 0.25), 0, 1);
    settle();
  }

  /* ---------- feedback ---------- */
  function say(kind, msg, raw) {
    const m = raw ? msg : T(msg);
    S.log.unshift({ kind, msg: m }); if (S.log.length > 40) S.log.pop();
    ui.toast(m, kind, 4200);
  }
  const nm = (id) => T(N[id]);
  const stateW = (id) => {
    if (PLUG.includes(id)) return S.st[id] ? W.plugged : W.unplugged;
    if (SW.includes(id)) return S.st[id] ? W.on : W.off;
    if (VALVE.includes(id)) return S.st[id] ? W.open : W.closed;
    return null;
  };
  const lockedAt = (id) => { const l = S.lk[id]; return !!l && (!!l.dev || l.locks.length > 0); };

  /* ---------- operate a point ---------- */
  function press(id) {
    const d = dv();
    if (lockedAt(id)) { say('warn', pair('This control is covered by a lockout device. Remove it first.', 'الزرار مغطى بجهاز لوتو. شيله الأول.')); return; }
    S.sel = id;
    if (id === 'pb1') {
      let ok = false, why = null;
      if (!d.ctrl) why = pair('No control supply. Plug in the blue plug.', 'مفيش كهرباء تحكم. ركّب الفيشة الزرقاء.');
      else if (S.estop) why = pair('The E-stop is active. Press RESET first.', 'الطوارئ شغالة. اضغط RESET الأول.');
      else if (!d.tp2) why = pair('The motor cannot start: no 400 V at Q1. Check the red plug, MCCB A and Q1.', 'الموتور مش هيشتغل: مفيش 400 فولت عند Q1. شوف الفيشة الحمرا وMCCB A وQ1.');
      else { S.latchM = true; ok = true; }
      S.tries.push({ w: 'motor', chg: S.chgE, valid: d.ctrl && !S.estop, ok: !ok });
      if (ok) say('warn', pair('Motor M1 started.', 'الموتور M1 اشتغل.')); else say('good', why);
    } else if (id === 'pb2') {
      S.latchM = false; say('info', d.tp1 ? pair('Motor stopped. The terminals above Q1 are still live.', 'الموتور وقف. الأطراف اللي فوق Q1 لسه فيها جهد.') : pair('Motor stopped.', 'الموتور وقف.'));
    } else if (id === 'pb3') {
      if (!d.ctrl) { say('info', pair('No control supply. Plug in the blue plug.', 'مفيش كهرباء تحكم. ركّب الفيشة الزرقاء.')); S.tries.push({ w: 'cyl', chg: S.chg, valid: false, ok: true }); return; }
      if (S.estop) { say('info', pair('The E-stop is active. Press RESET first.', 'الطوارئ شغالة. اضغط RESET الأول.')); return; }
      S.solC = true;
      const moves = S.Pdown >= 2;
      S.tries.push({ w: 'cyl', chg: S.chg, valid: true, ok: !moves });
      if (moves) {
        if (!S.st.bvA) { S.Pdown = Math.max(0, S.Pdown - 1); S.cylTrap = true; say('bad', pair('The cylinder moved on trapped air! The isolator is closed but air was still stored.', 'السلندر اتحرك بالهوا المحبوس! المحبس مقفول لكن الهوا كان لسه مخزّن.')); } else say('warn', pair('The cylinder moved out.', 'السلندر خرج.'));
      } else say('good', pair('No air pressure: the cylinder did not move.', 'مفيش ضغط هوا: السلندر مااتحركش.'));
    } else if (id === 'pb4') {
      S.solC = false; say('info', pair('The cylinder returns.', 'السلندر بيرجع.'));
    } else if (id === 'pb5') {
      S.estop = true; S.latchM = false; S.solC = false;
      say('warn', pair('E-stop pressed. The machine stopped but the supply is still live. An E-stop is not isolation.', 'ضغطت الطوارئ. الماكينة وقفت لكن الكهرباء لسه موجودة. الطوارئ مش عزل.'));
    } else if (id === 'pb6') {
      S.estop = false; say('info', pair('E-stop released.', 'الطوارئ اتفكّت.'));
    }
  }
  function operate(id) {
    if (id.startsWith('pb')) { press(id); return; }
    if (!LKP[id]) { info(id); return; }
    if (lockedAt(id)) { say('warn', pair('Locked out. Remove the lock first.', 'مقفول لوتو. شيل القفل الأول.')); return; }
    S.st[id] = !S.st[id]; bump(id); S.readout = null;
    settle();
    say('info', nm(id) + ': ' + T(stateW(id)), true);
  }
  function info(id) {
    S.sel = id;
  }

  /* ---------- tools: lock devices, padlocks, tags, key, tester ---------- */
  const holes = (id) => { const l = S.lk[id]; if (l.dev === 'hasp') return 6; if (l.dev) return 1; return LKP[id].integral ? 3 : 0; };
  function useTool(id) {
    const tool = PR.tool, kit = tool === 'key' ? { kind: 'key' } : L.dev(tool);
    if (kit.kind === 'tool') {
      if (!id.startsWith('tp')) { say('warn', pair('Tap one of the yellow test points.', 'دوس على واحدة من نقط القياس الصفرا.')); return; }
      const v = volts(id), pend = S.tl.filter((e) => e.k === 'test').length;
      S.tl.push({ k: 'test', pt: id, v, chg: S.chgE }); S.readout = { id, v };
      say(v ? 'bad' : 'good', nm(id) + ': ' + v + ' V', true);
      return;
    }
    if (id.startsWith('tp')) { say('warn', pair('Pick the tester first.', 'اختار التستر الأول.')); return; }
    if (!LKP[id]) { say('warn', pair('Nothing to lock here. Isolate the source upstream.', 'مفيش حاجة تتقفل هنا. اعزل المصدر اللي قبله.')); return; }
    const l = S.lk[id];
    if (kit.kind === 'key') {
      if (l.tag) { l.tag = 0; say('info', pair('Tag removed.', 'التاج اتشال.')); } else if (l.locks.length) { l.locks.pop(); say('info', pair('Padlock removed.', 'القفل اتشال.')); } else if (l.dev) { l.dev = null; say('info', pair('Lockout device removed.', 'جهاز اللوتو اتشال.')); } else { say('warn', pair('Nothing to remove here.', 'مفيش حاجة تتشال هنا.')); return; }
      bump(id); S.readout = null; return;
    }
    if (kit.kind === 'tag') {
      if (!safe(id)) { say('warn', pair('Put it in the safe position first (OFF, closed, unplugged or, for a vent valve, open).', 'حطه في الوضع الآمن الأول (OFF أو مقفول أو مسحوب، أو مفتوح لو محبس تفريغ).')); return; }
      if (l.tag) { say('warn', pair('A tag is already fitted.', 'التاج متركّب أصلاً.')); return; }
      l.tag = 1; bump(id); say('good', pair('Tag fitted.', 'التاج اتركّب.')); return;
    }
    if (!safe(id)) { say('warn', pair('Put it in the safe position first (OFF, closed, unplugged or, for a vent valve, open).', 'حطه في الوضع الآمن الأول (OFF أو مقفول أو مسحوب، أو مفتوح لو محبس تفريغ).')); return; }
    if (kit.kind === 'lock') {
      if (!holes(id)) { say('warn', pair('Fit a lockout device first. The padlock needs a hole.', 'ركّب جهاز لوتو الأول. القفل محتاج فتحة.')); return; }
      if (l.locks.length >= holes(id)) { say('warn', pair('No free hole. Add a multi-lock hasp.', 'مفيش فتحة فاضية. ضيف هاسب متعدد الأقفال.')); return; }
      l.locks.push(tool); bump(id);
      if (tool === 'pl_master') say('warn', pair('Master padlock fitted. It is not for personal lockout.', 'ركّبت قفل الماستر. مش للوتو الشخصي.')); else say('good', pair('Padlock fitted.', 'القفل اتركّب.'));
      return;
    }
    if (kit.kind === 'device') {
      if (!(kit.fits || []).includes(LKP[id].type)) { say('warn', pair('This device does not fit here.', 'الجهاز ده مش بيركب هنا.')); return; }
      if (l.dev && !(l.dev !== 'hasp' && tool === 'hasp')) { say('warn', pair('A lockout device is already fitted.', 'فيه جهاز لوتو متركّب أصلاً.')); return; }
      l.dev = tool; bump(id); say('good', pair('Lockout device fitted.', 'جهاز اللوتو اتركّب.'));
      if (kit.control) say('warn', pair('This is a control device. Locking it does not isolate anything.', 'ده جهاز تحكم. قفله مبيعزلش حاجة.'));
    }
  }
  function prove() {
    S.tl.push({ k: 'prove', chg: S.chgE }); say('good', pair('Tester proved on the proving unit.', 'التستر اتثبت على وحدة الإثبات.'));
  }

  /* ---------- the check ---------- */
  const proper = (id) => { const l = S.lk[id]; return safe(id) && !!l && l.locks.length > 0 && l.tag > 0 && (holes(id) > 0); };
  function ptp(pts) {
    const tl = S.tl, last = pts.map((p) => { for (let i = tl.length - 1; i >= 0; i--) if (tl[i].k === 'test' && tl[i].pt === p) return i; return -1; });
    if (last.some((i) => i < 0) || last.some((i) => tl[i].chg !== S.chgE || tl[i].v > 0)) return false;
    const first = Math.min(...last), end = Math.max(...last);
    return tl.slice(0, first).some((e) => e.k === 'prove') && tl.slice(end + 1).some((e) => e.k === 'prove');
  }
  const tried = (w) => S.tries.some((t) => t.w === w && t.chg === (w === 'motor' ? S.chgE : S.chg) && t.valid && t.ok);
  const noMaster = () => !Object.values(S.lk).some((l) => l.locks.includes('pl_master'));
  const any = (ids) => ids.some(proper);
  const JOBS = {
    free: { name: pair('Free play', 'تجربة حرة'), goal: pair('Plug in, run the board and try everything. There is no checklist.', 'ركّب الفيش وشغّل البورد وجرّب كل حاجة. مفيش تشيك ليست.'), chk: null },
    motor: {
      name: pair('Change motor M1', 'تغيير الموتور M1'), goal: pair('Make motor M1 safe to work on.', 'خلّي الموتور M1 آمن للشغل عليه.'),
      chk: () => [
        [any(['q1', 'mccbA', 'plugR']), pair('Q1, MCCB A or the red plug is OFF with a lockout device, padlock and tag', 'Q1 أو MCCB A أو الفيشة الحمرا في وضع OFF بجهاز لوتو وقفل وتاج')],
        [ptp(['tp2']), pair('Prove, test at Q1 load side (TP2) shows 0 V, prove again', 'إثبات، قياس عند خرج Q1 (TP2) يطلع 0 فولت، إثبات تاني')],
        [tried('motor'), pair('Try start after locking: the motor did not run (control supply on)', 'تجربة تشغيل بعد القفل: الموتور مااشتغلش (كهرباء التحكم موجودة)')],
        [noMaster(), pair('Personal padlocks only, no master padlock', 'أقفال شخصية بس، من غير قفل الماستر')],
      ],
    },
    cyl: {
      name: pair('Service the air cylinder', 'صيانة سلندر الهوا'), goal: pair('Make the air cylinder safe to work on.', 'خلّي سلندر الهوا آمن للشغل عليه.'),
      chk: () => [
        [proper('bvA'), pair('Air isolator BV-A is closed with a lockout device, padlock and tag', 'محبس عزل الهوا BV-A مقفول بجهاز لوتو وقفل وتاج')],
        [S.st.dump && S.Pdown < 0.1, pair('Dump valve open and gauge G1 reads 0 bar', 'محبس التفريغ مفتوح وعداد G1 بيقرا 0 بار')],
        [tried('cyl'), pair('Try CYL OUT after locking: the cylinder did not move (control supply on)', 'تجربة CYL OUT بعد القفل: السلندر مااتحركش (كهرباء التحكم موجودة)')],
        [noMaster(), pair('Personal padlocks only, no master padlock', 'أقفال شخصية بس، من غير قفل الماستر')],
      ],
    },
    water: {
      name: pair('Inspect the water vessel', 'فحص خزان المياه'), goal: pair('Make the water vessel safe to open.', 'خلّي خزان المياه آمن للفتح.'),
      chk: () => [
        [any(['mccbB', 'plugR']), pair('Pump isolated: MCCB B or the red plug is OFF with a lockout device, padlock and tag', 'الطلمبة معزولة: MCCB B أو الفيشة الحمرا OFF بجهاز لوتو وقفل وتاج')],
        [ptp(['tp3']), pair('Prove, test at the pump terminals (TP3) shows 0 V, prove again', 'إثبات، قياس عند أطراف الطلمبة (TP3) يطلع 0 فولت، إثبات تاني')],
        [proper('w1'), pair('Supply valve W1 is closed with a lockout device, padlock and tag', 'محبس المدخل W1 مقفول بجهاز لوتو وقفل وتاج')],
        [S.st.w3 && S.Pw < 0.1, pair('Drain valve W3 open and gauge G4 reads 0 bar', 'محبس الصرف W3 مفتوح وعداد G4 بيقرا 0 بار')],
        [noMaster(), pair('Personal padlocks only, no master padlock', 'أقفال شخصية بس، من غير قفل الماستر')],
      ],
    },
    comp: {
      name: pair('Service the compressor', 'صيانة الكمبروسور'), goal: pair('Make the compressor and its receiver safe to work on.', 'خلّي الكمبروسور والخزان بتاعه آمنين للشغل عليهم.'),
      chk: () => [
        [any(['mcbC', 'plugR']), pair('Compressor isolated: MCB C or the red plug is OFF with a lockout device, padlock and tag', 'الكمبروسور معزول: MCB C أو الفيشة الحمرا OFF بجهاز لوتو وقفل وتاج')],
        [ptp(['tp4']), pair('Prove, test at the compressor terminals (TP4) shows 0 V, prove again', 'إثبات، قياس عند أطراف الكمبروسور (TP4) يطلع 0 فولت، إثبات تاني')],
        [S.Prec < 0.1, pair('Receiver emptied: gauge G2 reads 0 bar (open the air isolator and the dump valve)', 'الخزان اتفرّغ: عداد G2 بيقرا 0 بار (افتح محبس العزل ومحبس التفريغ)')],
        [noMaster(), pair('Personal padlocks only, no master padlock', 'أقفال شخصية بس، من غير قفل الماستر')],
      ],
    },
  };
  PR.jobs = JOBS;
  function check() {
    const j = JOBS[PR.job];
    if (!j.chk) { say('info', pair('Pick a job to be checked.', 'اختار شغلانة عشان تتراجع.')); return; }
    const rows = j.chk(), okAll = rows.every((r) => r[0]);
    S.res = { rows, ok: okAll, trap: S.cylTrap && PR.job === 'cyl' };
    say(okAll ? 'good' : 'warn', okAll ? pair('Safe to start work.', 'آمن تبدأ الشغل.') : pair('Not safe yet. See the checklist.', 'لسه مش آمن. شوف التشيك ليست.'));
  }

  /* ---------- guided demo ("show me") ---------- */
  function powerUp() { S.st.plugB = true; S.st.plugR = true; settle(); }
  function setSw(id, v) { if (!!S.st[id] !== v) { S.st[id] = v; bump(id); settle(); } }
  function fit(id, tool) { const t = PR.tool; PR.tool = tool; useTool(id); PR.tool = t; }
  const DEMO = {
    motor: [
      [pair('Plug in both plugs and start the motor.', 'ركّب الفيشتين وشغّل الموتور.'), () => { powerUp(); press('pb1'); }],
      [pair('1. Stop the machine normally with STOP.', '1. وقّف الماكينة عادي بزرار STOP.'), () => press('pb2')],
      [pair('2. Switch the isolator Q1 to 0.', '2. حوّل سويتش العزل Q1 على 0.'), () => { setSw('q1', false); say('info', nm('q1') + ': ' + T(W.off), true); }],
      [pair('3. Put your padlock in the isolator hole.', '3. حط قفلك في فتحة السويتش.'), () => fit('q1', 'pl_red')],
      [pair('4. Add the DANGER tag.', '4. ضيف تاج الخطر.'), () => fit('q1', 'tag')],
      [pair('5. Prove the tester on the proving unit.', '5. اثبت التستر على وحدة الإثبات.'), prove],
      [pair('6. Test at Q1 load side: 0 V.', '6. اختبر عند خرج Q1: 0 فولت.'), () => { PR.tool = 'tester'; useTool('tp2'); PR.tool = null; }],
      [pair('7. Prove the tester again.', '7. اثبت التستر تاني.'), prove],
      [pair('8. Try START: nothing moves. Safe to work.', '8. جرّب START: مفيش حاجة بتتحرك. آمن تشتغل.'), () => { press('pb1'); }],
    ],
    cyl: [
      [pair('Plug in both plugs. The receiver fills.', 'ركّب الفيشتين. الخزان بيتملي.'), () => powerUp()],
      [pair('1. Close the air isolator BV-A.', '1. اقفل محبس عزل الهوا BV-A.'), () => { setSw('bvA', false); say('info', nm('bvA') + ': ' + T(W.closed), true); }],
      [pair('2. Fit the valve lockout.', '2. ركّب لوتو المحبس.'), () => fit('bvA', 'ball_lock')],
      [pair('3. Add your padlock.', '3. حط قفلك.'), () => fit('bvA', 'pl_red')],
      [pair('4. Add the DANGER tag.', '4. ضيف تاج الخطر.'), () => fit('bvA', 'tag')],
      [pair('5. Open the dump valve to release the trapped air.', '5. افتح محبس التفريغ عشان الهوا المحبوس يخرج.'), () => { setSw('dump', true); say('info', nm('dump') + ': ' + T(W.open), true); }],
      [pair('6. Wait until gauge G1 reads 0 bar.', '6. استنى لحد ما عداد G1 يقرا 0 بار.'), () => {}, 6500],
      [pair('7. Try CYL OUT: the cylinder does not move.', '7. جرّب CYL OUT: السلندر مش بيتحرك.'), () => press('pb3')],
    ],
    water: [
      [pair('Plug in both plugs. The pump builds pressure.', 'ركّب الفيشتين. الطلمبة بتعمل ضغط.'), () => powerUp()],
      [pair('1. Switch MCCB B off and lock it.', '1. اقفل MCCB B وحط عليه لوتو.'), () => { setSw('mccbB', false); fit('mccbB', 'mccb_clip'); fit('mccbB', 'pl_red'); fit('mccbB', 'tag'); }],
      [pair('2. Prove, test the pump terminals, prove again.', '2. إثبات، اختبر أطراف الطلمبة، إثبات تاني.'), () => { prove(); PR.tool = 'tester'; useTool('tp3'); PR.tool = null; prove(); }],
      [pair('3. Close the supply valve W1 and lock it.', '3. اقفل محبس المدخل W1 وركّب عليه لوتو.'), () => { setSw('w1', false); fit('w1', 'ball_lock'); fit('w1', 'pl_red'); fit('w1', 'tag'); }],
      [pair('4. Open the drain valve W3 to release the pressure.', '4. افتح محبس الصرف W3 عشان الضغط يخرج.'), () => { setSw('w3', true); }],
      [pair('5. Wait until gauge G4 reads 0 bar.', '5. استنى لحد ما عداد G4 يقرا 0 بار.'), () => {}, 6500],
    ],
    comp: [
      [pair('Plug in both plugs. The compressor fills the receiver.', 'ركّب الفيشتين. الكمبروسور بيملّي الخزان.'), () => powerUp()],
      [pair('1. Switch MCB C off and lock it.', '1. اقفل MCB C وحط عليه لوتو.'), () => { setSw('mcbC', false); fit('mcbC', 'mcb3_clip'); fit('mcbC', 'pl_red'); fit('mcbC', 'tag'); }],
      [pair('2. Prove, test the compressor terminals, prove again.', '2. إثبات، اختبر أطراف الكمبروسور، إثبات تاني.'), () => { prove(); PR.tool = 'tester'; useTool('tp4'); PR.tool = null; prove(); }],
      [pair('3. Open the dump valve to empty the receiver.', '3. افتح محبس التفريغ عشان الخزان يتفرّغ.'), () => { setSw('dump', true); }],
      [pair('4. Wait until gauge G2 reads 0 bar.', '4. استنى لحد ما عداد G2 يقرا 0 بار.'), () => {}, 6500],
    ],
  };
  PR.runDemo = (rerender) => {
    const steps = DEMO[PR.job]; if (!steps) { say('info', pair('Pick a job first.', 'اختار شغلانة الأول.')); return; }
    const job = PR.job; PR.reset(); PR.job = job; const tok = ++PR.demo; S.demoCap = null; PR.show = true;
    let i = 0;
    const next = () => {
      if (tok !== PR.demo) return;
      if (i >= steps.length) { S.demoCap = null; settle(); check(); rerender(); return; }
      const st = steps[i++]; S.demoCap = st[0]; try { st[1](); } catch (e) { /* keep going */ }
      rerender();
      setTimeout(next, st[2] || (i === 1 ? 4500 : 2600));
    };
    next();
  };

  /* ---------- drawing the state ---------- */
  function paintBoard(svg) {
    const d = dv(), c = S.st, show = PR.show, set = (id, k, v) => { const e = $(svg, id); if (e) e.setAttribute(k, v); return e; };
    const lamp = (id, on, col) => set(id, 'fill', on ? col : { lmpL1: '#1f3b27', lmpL2: '#1f3b27', lmpL3: '#1f3b27', lmpN: '#1f3b27', lmpRun: '#1f3b27', lmpPS: '#1f3b27', lmpCyl: '#3a2f12', lmpEst: '#3a1512' }[id]);
    /* plugs */
    const place = (key, hx, sx, sy, col) => {
      const on = c[key], px = on ? sx : hx, py = on ? sy : 330, pg = $(svg, key);
      pg.setAttribute('transform', `translate(${px} ${py}) scale(${on ? 1.12 : 1})`);
      const dpath = on ? `M${hx} 184 C ${hx} 150, ${sx + 140} 150, ${sx + 40} ${sy - 30} S ${sx} ${sy - 10} ${sx} ${sy}` : `M${hx} 184 V${py - 12}`;
      set('cab' + key.slice(-1), 'd', dpath); set('cab' + key.slice(-1) + 'i', 'd', dpath);
    };
    place('plugB', 960, 420, 262); place('plugR', 1040, 560, 262);
    lamp('lmpL1', d.red, '#39e46f'); lamp('lmpL2', d.red, '#39e46f'); lamp('lmpL3', d.red, '#39e46f'); lamp('lmpN', d.blue, '#39e46f');
    lamp('lmpRun', d.motor, '#39e46f'); lamp('lmpPS', S.compRun, '#39e46f'); lamp('lmpCyl', S.solC, '#ffb02e'); lamp('lmpEst', S.estop, '#ff3b30');
    set('q1k', 'transform', `rotate(${c.q1 ? 90 : 0} 204 390)`);
    const brk = (id, on, w) => { set(id + 'h', 'transform', `translate(0 ${on ? 0 : w})`); const t = $(svg, id + 's'); t.textContent = on ? 'ON' : 'OFF'; t.setAttribute('fill', on ? '#6cf08a' : '#ff9a90'); };
    brk('mA', c.mccbA, 30); brk('mB', c.mccbB, 30); brk('mC', c.mcbC, 30);
    const vlv = (id, on) => { set(id + 'l', 'transform', `rotate(${on ? 0 : -90} ${A.PT[{ bvA: 'bvA', dmp: 'dump', w1: 'w1', w2: 'w2' }[id]].x} ${A.PT[{ bvA: 'bvA', dmp: 'dump', w1: 'w1', w2: 'w2' }[id]].y})`); };
    vlv('bvA', c.bvA); vlv('dmp', c.dump); vlv('w1', c.w1); vlv('w2', c.w2);
    for (const [id, on] of [['bvAs', c.bvA], ['dmps', c.dump], ['w1s', c.w1], ['w2s', c.w2], ['w3s', c.w3]]) { const t = $(svg, id); t.textContent = on ? 'OPEN' : 'CLOSED'; t.setAttribute('fill', on ? '#1b6b2a' : '#a31f16'); }
    set('w3w', 'transform', `rotate(${c.w3 ? 120 : 0} 792 1100)`);
    /* energy colours */
    const live = '#ff7a1a', dead = '#555';
    for (const [id, on] of [['ldQ1a', d.tp1], ['ldQ1b', d.tp2], ['ldAi', d.red], ['ldAo', d.tp1], ['ldBi', d.red], ['ldBo', d.tp3], ['ldCi', d.red], ['ldCo', d.tp4], ['ldSB', d.blue], ['ldSR', d.red], ['ldCmp', d.tp4], ['ldPmp', d.tp3]]) { const e = $(svg, id); e.setAttribute('fill', on ? live : dead); e.style.display = show ? '' : 'none'; }
    set('wM', 'stroke', show && d.tp2 ? live : '#333'); set('wB', 'stroke', show && d.tp3 ? live : '#333'); set('wC', 'stroke', show && d.tp4 ? live : '#333');
    const tubeCol = (p) => (show && p > 0.2 ? '#4aa8ff' : '#2f5d9e');
    for (const id of ['t1', 't2']) set(id, 'stroke', tubeCol(S.Prec));
    for (const id of ['t3', 't4', 't5']) set(id, 'stroke', tubeCol(S.Pdown));
    for (const id of ['pw1', 'pw2', 'pw3']) set(id + 'c', 'stroke', show && S.Pw > 0.2 ? '#7fd0ff' : '#b9e6c0');
    /* gauges */
    const GC = { g1: [594, 836], g2: [322, 810], g3: [400, 1060], g4: [560, 1158] };
    for (const [id, p] of [['g1', S.Pdown], ['g2', S.Prec], ['g3', S.Pw], ['g4', S.Pw]]) { set(id + 'n', 'transform', `rotate(${-135 + p / 10 * 270} ${GC[id][0]} ${GC[id][1]})`); $(svg, id + 't').textContent = p.toFixed(1); }
    set('vesF', 'height', (S.Pw / 4 * 58).toFixed(1)); set('vesF', 'y', (1200 - S.Pw / 4 * 58).toFixed(1));
    set('cyR', 'transform', `translate(${(-48 * (1 - S.cyl)).toFixed(1)} 0)`);
    /* motion */
    const cls = (id, k, on) => { const e = $(svg, id); if (e) e.classList.toggle(k, !!on); };
    cls('fanM', 'run', d.motor); cls('pumpI', 'run', d.pump); cls('compG', 'shake', S.compRun);
    set('flow', 'opacity', d.pump && c.w1 && c.w2 && !c.w3 ? 0.9 : 0); cls('flow', 'flowing', d.pump && c.w1 && c.w2 && !c.w3);
    set('dmpf', 'opacity', c.dump && (S.Pdown > 0.1 || (c.bvA && S.Prec > 0.1)) ? 1 : 0); set('w3f', 'opacity', c.w3 && S.Pw > 0.1 ? 1 : 0);
    /* locks and tags */
    for (const id of Object.keys(A.LK)) {
      const k = A.LK[id], l = S.lk[id], g = $(svg, 'lk_' + id); let o = '';
      if (l.dev) o += A.ic(L.dev(l.dev).icon, k.x - k.s / 2, k.y - k.s / 2, k.s);
      l.locks.forEach((t, i) => {
        const sz = k.s * 0.62, ox = id === 'q1' ? 298 - sz / 2 + (i > 2 ? 26 : 0) : k.x - k.s * 0.45 + (i % 3) * k.s * 0.4, oy = id === 'q1' ? 350 + (i % 3) * 20 : k.y + k.s * 0.05 + Math.floor(i / 3) * 14;
        o += A.ic(L.dev(t).icon, ox, oy, sz);
      });
      if (l.tag) o += A.ic('tag', k.x + k.s * 0.2, k.y + k.s * 0.28, k.s * 0.7);
      g.innerHTML = o;
    }
    /* selection, tester points, hand */
    const sel = $(svg, 'sel'), sp = PR.sel && A.PT[PR.sel];
    if (sp) { sel.setAttribute('cx', sp.x); sel.setAttribute('cy', sp.y); sel.setAttribute('r', Math.min(sp.r, 60) + 4); } else { sel.setAttribute('cx', -80); sel.setAttribute('cy', -80); }
    $(svg, 'tps').style.display = PR.tool === 'tester' ? '' : 'none';
    const tn = $(svg, 'tpn'); tn.innerHTML = '';
    if (S.readout) { const p = A.PT[S.readout.id]; tn.innerHTML = `<rect x="${p.x + 16}" y="${p.y - 30}" width="74" height="26" rx="5" fill="${S.readout.v ? '#d9342b' : '#1f8f3a'}" stroke="#111" stroke-width="2"/><text x="${p.x + 53}" y="${p.y - 12}" text-anchor="middle" fill="#fff" font-size="16">${S.readout.v} V</text>`; }
    svg.querySelectorAll('.kit').forEach((e) => e.classList.toggle('on', e.dataset.tool === PR.tool));
  }

  /* ---------- page ---------- */
  PR.render = function (root, rerender) {
    if (PR.iv) { clearInterval(PR.iv); PR.iv = null; }
    root.classList.add('wide');
    const wrap = h('div', { class: 'pr-wrap' });
    const boardCol = h('div', { class: 'pr-boardcol' });
    const cap = h('div', { class: 'pr-cap' });
    const box = h('div', { class: 'pr-board' });
    box.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${A.W} ${A.H}" class="prsvg">${A.svg()}</svg>`;
    const svg = box.firstChild; let zv = null;
    const focus = (x, y, k) => { if (zv) { if (k === 1) zv.reset(); else zv.focus(x, y, k); } };
    const chips = h('div', { class: 'pr-focus' });
    for (const [nmv, x, y, k] of [[['All', 'الكل'], 550, 750, 1], [['Electrical', 'كهرباء'], 450, 680, 1.4], [['Air', 'هوا'], 450, 880, 1.4], [['Water', 'مياه'], 450, 1250, 1.4]]) chips.appendChild(h('button', { class: 'btn sm', onclick: () => focus(x, y, k), text: T(nmv) }));
    chips.appendChild(h('button', { class: 'btn sm', onclick: () => zv && zv.zoom(1.4), text: '+' })); chips.appendChild(h('button', { class: 'btn sm', onclick: () => zv && zv.zoom(1 / 1.4), text: '−' }));
    boardCol.appendChild(chips); boardCol.appendChild(cap); boardCol.appendChild(box);

    const task = h('div', { class: 'pr-task' }), side = h('div', { class: 'pr-side' });
    const draw = () => {
      paintBoard(svg);
      /* caption over the board: demo step or the last thing tapped */
      cap.innerHTML = '';
      if (S.demoCap) cap.appendChild(h('div', { class: 'pr-demo', text: T(S.demoCap) }));
      else if (PR.sel && N[PR.sel]) {
        const id = PR.sel, sw = stateW(id), p = { g1: S.Pdown, g2: S.Prec, g3: S.Pw, g4: S.Pw }[id];
        cap.appendChild(h('div', { class: 'pr-info' }, h('b', { text: nm(id) + (sw ? ': ' + T(sw) : p != null ? ': \u200E' + p.toFixed(1) + ' bar' : '') + (LKP[id] && lockedAt(id) ? ' (' + T(W.locked) + ')' : '') }), h('span', { text: ' ' + T(CATD[CAT[id]]) })));
      } else cap.appendChild(h('div', { class: 'pr-info mute', text: T(['Tap a part to operate it. Pick a tool from the kit, then tap a part to fit it.', 'دوس على أي جزء عشان تشغّله. اختار أداة من العدة وبعدين دوس على الجزء عشان تركّبها.']) }));
      renderTask(); renderSide();
    };
    const rr = () => draw();
    const pickTool = (id) => { PR.tool = PR.tool === id ? null : id; rr(); };
    const renderTask = () => {
      task.innerHTML = '';
      const sel = h('select', { class: 'pr-sel', onchange: (e) => { PR.job = e.target.value; S.res = null; rr(); } });
      for (const k of Object.keys(JOBS)) sel.appendChild(h('option', { value: k, text: T(JOBS[k].name), selected: PR.job === k }));
      task.appendChild(h('h3', { text: T(['Practice board', 'بورد التدريب']) }));
      task.appendChild(h('p', { class: 'mute', text: T(['Plug in the plugs from the wall, run the board, then isolate it the way you would on site.', 'ركّب الفيش من الحيطة وشغّل البورد وبعدين اعزله زي ما بتعمل في الموقع.']) }));
      task.appendChild(h('label', { class: 'pr-lab', text: T(['Job', 'الشغلانة']) })); task.appendChild(sel);
      task.appendChild(h('p', { class: 'mute', text: T(JOBS[PR.job].goal) }));
      task.appendChild(h('div', { class: 'row', style: { flexWrap: 'wrap', gap: '6px', margin: '8px 0' } },
        h('button', { class: 'btn', onclick: () => { powerUp(); say('info', pair('Both plugs are in.', 'الفيشتين متركّبين.')); rr(); }, text: T(['Power up', 'شغّل البورد']) }),
        h('button', { class: 'btn', onclick: () => PR.runDemo(rr), text: T(['Show me', 'وريني']) }),
        h('button', { class: 'btn pri', onclick: () => { check(); rr(); }, text: T(['Check my isolation', 'راجع العزل بتاعي']) }),
        h('button', { class: 'btn', onclick: () => { PR.reset(); PR.job = PR.job; rr(); }, text: T(['Reset board', 'ابدأ من الأول']) })));
      task.appendChild(h('label', { class: 'pr-chk' }, h('input', { type: 'checkbox', checked: PR.show, onchange: (e) => { PR.show = e.target.checked; rr(); } }), h('span', { text: T(['Show live energy on the board', 'اعرض الطاقة الشغالة على البورد']) })));
      if (S.res) {
        const r = S.res;
        task.appendChild(h('div', { class: 'pr-res ' + (r.ok ? 'ok' : 'no') },
          h('b', { text: T(r.ok ? ['Safe to start work', 'آمن تبدأ الشغل'] : ['Not safe yet', 'لسه مش آمن']) }),
          h('ul', {}, ...r.rows.map((x) => h('li', { class: x[0] ? 'y' : 'n', text: (x[0] ? '✓ ' : '✗ ') + T(x[1]) }))),
          r.trap ? h('p', { class: 'mute', text: T(['The cylinder moved on trapped air during your session.', 'السلندر اتحرك بالهوا المحبوس أثناء التجربة.']) }) : null));
      }
    };
    let statBox = null;
    const updateStat = () => {
      if (!statBox) return; const d = dv(); statBox.innerHTML = '';
      for (const [cls, t] of [[d.red, '\u200E400 V ' + T(d.red ? W.live : W.dead)], [d.blue, '\u200E230 V ' + T(d.blue ? W.live : W.dead)], [S.Prec > 0.1 || S.Pdown > 0.1, T(['Air', 'هوا']) + ' \u200E' + Math.max(S.Prec, S.Pdown).toFixed(1) + ' bar'], [S.Pw > 0.1, T(['Water', 'مياه']) + ' \u200E' + S.Pw.toFixed(1) + ' bar']]) statBox.appendChild(h('span', { class: 'pr-chip ' + (cls ? 'live' : ''), text: t }));
    };
    const renderSide = () => {
      side.innerHTML = '';
      statBox = h('div', { class: 'pr-stat' }); side.appendChild(statBox); updateStat();
      const hand = PR.tool === 'key' ? T(['Key: remove a tag, padlock or device', 'المفتاح: شيل تاج أو قفل أو جهاز']) : PR.tool ? T(L.dev(PR.tool).name) : T(['nothing', 'مفيش']);
      side.appendChild(h('div', { class: 'pr-hand' }, h('b', { text: T(['In hand', 'في إيدك']) + ': ' }), h('span', { text: hand })));
      if (PR.tool === 'tester') side.appendChild(h('div', { class: 'row', style: { gap: '6px', margin: '6px 0', flexWrap: 'wrap' } }, h('button', { class: 'btn sm', onclick: () => { prove(); rr(); }, text: T(['Prove tester', 'اثبت التستر']) }), h('span', { class: 'mute', text: T(['Tap a yellow test point on the board.', 'دوس على نقطة قياس صفرا في البورد.']) })));
      const kit = h('div', { class: 'pr-kit' });
      for (const k of A.KIT) kit.appendChild(h('button', { class: 'pr-k' + (PR.tool === k ? ' on' : ''), title: k === 'key' ? '' : T(L.dev(k).name), onclick: () => pickTool(k) },
        h('span', { html: k === 'key' ? `<svg viewBox="0 0 64 64" width="34" height="34">${A.keyIcon(0, 0, 64)}</svg>` : L.icon(L.dev(k).icon, 34) }),
        h('small', { text: k === 'key' ? T(['Key', 'مفتاح']) : T(L.dev(k).name).split(' (')[0] })));
      side.appendChild(h('h4', { text: T(['Kit', 'العدة']) })); side.appendChild(kit);
      side.appendChild(h('h4', { text: T(['Log', 'السجل']) }));
      side.appendChild(h('div', { class: 'pr-log' }, ...S.log.slice(0, 7).map((x) => h('div', { class: 'l ' + x.kind, text: x.msg }))));
    };
    zv = LB.zoomify(svg, { x: 0, y: 0, w: A.W, h: A.H }, { maxZoom: 6, onTap: (e, p, el) => {
      const tl = el && el.closest && el.closest('[data-tool]'); if (tl) { pickTool(tl.dataset.tool); return; }
      const pt = el && el.closest && el.closest('[data-pt]'); if (!pt) { PR.sel = null; rr(); return; }
      const id = pt.dataset.pt; PR.sel = id;
      if (PR.tool) useTool(id); else if (A.PT[id]) operate(id);
      rr();
    } });
    wrap.appendChild(task); wrap.appendChild(boardCol); wrap.appendChild(side);
    root.appendChild(wrap);
    draw();
    PR.iv = setInterval(() => { if (!svg.isConnected) { clearInterval(PR.iv); PR.iv = null; return; } tick(); paintBoard(svg); updateStat(); }, 200);
  };
})(typeof window !== 'undefined' ? window : globalThis);
