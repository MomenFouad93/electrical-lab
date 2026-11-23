/* Station cycles on the HMI (CTRL unit): start-up from empty, drain, washes and sanitisations.
   Each cycle is a list of steps; a step does something when it starts (go), waits for a condition (done)
   and has an estimate (est, seconds) so the trainee can compare the real timer with a hand calculation.
   Cycle progress lives in the CTRL unit state as numbers (cyN, cyI, cyT, cyTs, csN, ceN) so it survives a save. */
(function (g) {
  const EL = g.EL, PL = EL.plant, W = EL.water;
  if (!PL || !W) return;
  const E = (en, ar) => [en, ar];
  const CP = 4.186; // kJ/kg K
  const list = (s) => String(s || '').split(/[,\s]+/).filter(Boolean);

  function ctx(c, u) {
    const pl = c.plant, pr = u.props, st = u.state;
    const by = (t) => (t ? PL.byTag(pl, t) : null);
    const x = {
      c, pl, u, pr, st, by,
      lvl: (t) => { const k = typeof t === 'string' ? by(t) : t; return k ? (100 * (k.state.v || 0)) / Math.max(1, +k.props.vol) : 0; },
      T: (t) => { const k = typeof t === 'string' ? by(t) : t; return k && k.state.T != null ? k.state.T : 20; },
      tanks: () => pl.units.filter((k) => k.type === 'TANK'),
      drains: () => list(pr.drains).map(by).filter((k) => k && k.type === 'VALVE'),
      pous: () => pl.units.filter((k) => k.type === 'POU'),
      pumps: (grp) => pl.units.filter((k) => k.type === 'PUMP' && (!grp || k.props.grp === grp)),
      div: () => pl.units.find((k) => k.type === 'DIV') || null,
      loopHx: () => pl.units.find((k) => k.type === 'TEMP' && k.props.mode === 'loop') || null,
      roHx: () => pl.units.find((k) => k.type === 'TEMP' && k.props.mode !== 'loop') || null,
      one: (type, f) => pl.units.find((k) => k.type === type && (!f || f(k))) || null,
      /* change a unit for the cycle and remember how it was, so the cycle can put it back */
      set(k, key, v) { if (!k || k.type === 'CTRL') return; const sn = st._snap || (st._snap = {}); if (!(k.id in sn)) sn[k.id] = JSON.parse(JSON.stringify(k.props)); k.props[key] = v; },
      btn(key, v) { pr[key] = v; },
    };
    return x;
  }
  /* the valve on a tank's bottom drain */
  function drainOf(x, tank) {
    for (const p of x.pl.pipes) for (const [a, b] of [[p.a, p.b], [p.b, p.a]]) if (a === tank.id + '.out2') { const v = x.pl.units.find((k) => k.id === b.split('.')[0]); if (v && v.type === 'VALVE') return v; }
    return null;
  }
  /* gravity drain time to the 2 % low-level point: Torricelli through the drain line, q = a·sqrt(2gh/K), K = 1 (inlet + outlet) + 1.5·f·L/D */
  const EMPTY = 2;
  function drainT(x, tank, lvl) {
    const v = drainOf(x, tank); if (!v) return 0;
    const ps = x.pl.pipes.filter((p) => [p.a, p.b].some((r) => r.split('.')[0] === v.id) && +p.dn > 0);
    const p0 = ps[0], id = p0 ? (W.ID[p0.mat === 'pvc' ? 'pvc' : 'ss'][+p0.dn] || 26) / 1000 : 0.026;
    const L = ps.reduce((s, p) => s + (+p.len || 1), 0) || 2, K = 1 + (1.5 * 0.02 * L) / id;
    const H = +tank.props.hgt || 1, A = (+tank.props.vol / 1000) / H, a = (Math.PI * id * id) / 4; // m2
    const c = a * Math.sqrt((2 * 9.81) / K); // m3/s per sqrt(m)
    const h0 = ((lvl == null ? x.lvl(tank) : lvl) / 100) * H, h1 = (EMPTY / 100) * H;
    return h0 <= h1 ? 0 : ((2 * A) / c) * (Math.sqrt(h0) - Math.sqrt(h1));
  }
  const heatT = (kg, dT, kw) => (kw > 0 && dT > 0 ? (kg * CP * dT) / kw : 0);
  /* heat (or cool) a tank through an exchanger in its recirculation: full duty while the exchanger can use it,
     then an exponential approach because the outlet is capped at the set point. q = recirculation in kg/s. */
  function hxT(kg, T0, Tt, Tset, kw, q, extra) {
    const up = Tt > T0; if (up ? T0 >= Tt : T0 <= Tt) return 0;
    if (!(q > 0.01)) return heatT(kg, Math.abs(Tt - T0), kw + (extra || 0));
    const T1 = up ? Math.max(T0, Tset - kw / (CP * q * 1.15)) : Math.min(T0, Tset + kw / (CP * q * 1.15));
    if (up ? Tt <= T1 : Tt >= T1) return heatT(kg, Math.abs(Tt - T0), kw + (extra || 0));
    return heatT(kg, Math.abs(T1 - T0), kw + (extra || 0)) + (kg / q) * Math.log(Math.abs(Tset - T1) / Math.max(0.1, Math.abs(Tset - Tt)));
  }
  const hxQ = (hx, def) => (hx && Math.abs(hx.state.q || 0) > 0.01 ? Math.abs(hx.state.q) : def);
  const pumpsIdle = (x, grp) => x.pumps(grp).every((k) => Math.abs(k.state.s || 0) < 0.02);
  const prodStoppedByLevel = (x) => x.pumps('prod').some((k) => k.props.lvt && k.state.lstop);
  const divOk = (x) => { const d = x.div(); return !d || !d.state.div || prodStoppedByLevel(x); };
  const tag = (k, f) => (k ? k.tag : f || '-');
  const closeDrains = (x) => { for (const t of x.tanks()) { const d = drainOf(x, t); if (d) d.props.open = false; } for (const p of x.pous()) p.props.open = false; };

  /* ---------- step blocks used by several cycles ---------- */
  const stopAll = () => ({ n: E('Stop production and the loop, wait for the pumps to stop', 'وقّف الإنتاج واللوب واستنى الطلمبات تقف'),
    go(x) { x.btn('prod', false); x.btn('dist', false); x.btn('sanit', false); x.btn('lsan', false); }, done: (x) => pumpsIdle(x) && x.st.cyTs >= 3, est: () => 5 });
  /* never open a drain on a hot tank: scalding and the PVC drain lines */
  const coolFirst = (ts) => ({ n: E('Check every tank is below 60 °C before opening a drain (scalding, PVC drain lines)', 'اتأكد إن كل التانكات تحت 60 درجة قبل ما تفتح الصرف (حروق، ومواسير الصرف PVC)'),
    done: (x) => ts.every((t) => x.T(t) < 60), est: () => 0 });
  const stopProd = () => ({ n: E('Stop production (the loop keeps running from the PW tank)', 'وقّف الإنتاج (اللوب يفضل شغال من تانك الـPW)'),
    go(x) { x.btn('prod', false); }, done: (x) => pumpsIdle(x, 'prod') && x.st.cyTs >= 3, est: () => 5 });
  function roFlush(x) {
    const hp1 = x.by(x.pr.hp1), hp2 = x.by(x.pr.hp2), fv = x.by(x.pr.ffv);
    return [
      { n: E('Production on, product diverted to the break tank ' + tag(x.by(x.pr.stank)), 'الإنتاج شغال، والمية الخارجة متحوّلة لتانك الكسر ' + tag(x.by(x.pr.stank))),
        go(x) { x.btn('prod', true); x.st.cyDiv = 1; }, done: (x) => x.st.cyTs >= 5, est: () => 5 },
      { n: E('Fast flush 5 min: ' + tag(hp1) + ' and ' + tag(hp2) + ' down to 35 %, reject valve ' + tag(fv) + ' wide open. High cross-flow at low pressure sweeps both passes.', 'شطف سريع 5 دقايق: ' + tag(hp1) + ' و' + tag(hp2) + ' ينزلوا 35٪، ومحبس الريجكت ' + tag(fv) + ' مفتوح على الآخر. سرعة عالية على سطح الممبرين وضغط واطي بيكسح المرحلتين.'),
        go(x) { x.st.cyFF = 1; x.st.cyDiv = 1; if (hp1) x.set(hp1, 'spd', 35); if (hp2) x.set(hp2, 'spd', 35); if (fv) { x.set(fv, 'kv', 4); x.set(fv, 'open', true); } }, done: (x) => x.st.cyTs >= 300, est: () => 300 },
      { n: E('Back to normal pressure: product diverted until it is in spec for 2 min', 'رجوع للضغط العادي: المية بتتحوّل لحد ما تفضل جوه المواصفات دقيقتين'),
        go(x) { restore(x, [hp1, hp2, fv]); x.st.cyFF = 0; x.st.cyDiv = 0; }, done: (x) => x.st.cyTs >= 10 && divOk(x), est: () => 150 },
    ];
  }
  function loopFlush(x) {
    const s = [{ n: E('Loop pump on, production on automatic', 'طلمبة اللوب شغالة، والإنتاج أوتوماتيك'), go(x) { x.btn('dist', true); x.btn('prod', true); }, done: (x) => x.st.cyTs >= 5, est: () => 5 }];
    for (const p of x.pous()) s.push({ n: E('Flush ' + p.tag + ' for 3 min (open to drain, then close)', 'اشطف ' + p.tag + ' لمدة 3 دقايق (افتحها للصرف وبعدين اقفلها)'),
      go(x) { x.set(p, 'open', true); }, done: (x) => x.st.cyTs >= 180, end(x) { p.props.open = false; }, est: () => 180 });
    return s;
  }
  function roSanit(x) {
    const st = x.by(x.pr.stank), hx = x.roHx(), kg = () => (st ? st.state.v || 0 : 0) + 50, Ts = W.sanT(x.pl);
    const hp = [x.by(x.pr.hp1), x.by(x.pr.hp2)].filter(Boolean), fv = x.by(x.pr.ffv), aux = x.pl.units.filter((k) => (k.type === 'DOSE' && k.props.chem !== 'smbs') || k.type === 'DEG'); // SMBS stays on: the break tank water carries chlorine
    return [
      { n: E('Start: ' + (x.pr.dclose || '-') + ' to drain closes, ' + (x.pr.dopen || '-') + ' recycle opens, ' + hp.map((k) => k.tag).join(' and ') + ' slowed down (30 % / 45 %) and reject valve ' + tag(fv) + ' wide open (high cross-flow, about 2-3 bar on hot membranes), NaOH and degasser off (SMBS stays on), steam on ' + tag(hx), 'البداية: ' + (x.pr.dclose || '-') + ' اللي على الصرف بيقفل، و' + (x.pr.dopen || '-') + ' بتاع الرجوع بيفتح، و' + hp.map((k) => k.tag).join(' و') + ' يهدوا (30٪ / 45٪) ومحبس الريجكت ' + tag(fv) + ' يتفتح على الآخر (فلو عالي على الممبرين وحوالي 2-3 بار وهو سخن)، والصودا والديجاسر يقفلوا (الـSMBS يفضل شغال)، والبخار يفتح على ' + tag(hx)),
        go(x) { x.btn('prod', true); x.btn('sanit', true); hp.forEach((k, i) => x.set(k, 'spd', i ? 45 : 30)); if (fv) { x.set(fv, 'kv', 4); x.set(fv, 'open', true); } for (const k of aux) x.set(k, 'on', false); }, done: (x) => x.st.cyTs >= 5, est: () => 5 },
      { n: E('Heat ' + tag(st) + ' and the RO loop to ' + (Ts - 3) + ' °C (' + (hx ? hx.props.kwh : '-') + ' kW steam)', 'سخّن ' + tag(st) + ' ولوب الـRO لـ' + (Ts - 3) + ' درجة (بخار ' + (hx ? hx.props.kwh : '-') + ' ك.و)'),
        done: (x) => x.T(st) >= Ts - 3 || (x.st.held || 0) > 0 || !x.pr.sanit, est: (x) => hxT(kg(), x.T(st), Ts - 3, Ts, hx ? +hx.props.kwh : 0, hxQ(hx, 0.4)) },
      { n: E('Hold ' + (x.pr.hold || 30) + ' min at ' + (Ts - 3) + ' °C or more (break tank)', 'ثبّت ' + (x.pr.hold || 30) + ' دقيقة على ' + (Ts - 3) + ' درجة أو أكتر (تانك الكسر)'),
        done: (x) => !x.pr.sanit, est: (x) => Math.max(1, +x.pr.hold || 30) * 60 },
      { n: E('Cool ' + tag(st) + ' below 40 °C, pumps still slow, NaOH and degasser back on (' + (hx ? hx.props.kwc : '-') + ' kW chilled water, and fresh soft water replaces the reject sent to drain)', 'برّد ' + tag(st) + ' لتحت 40 درجة والطلمبات لسه بطيئة، والصودا والديجاسر يرجعوا (مية متلجة ' + (hx ? hx.props.kwc : '-') + ' ك.و، ومية سوفت جديدة بتعوّض الريجكت اللي رايح الصرف)'),
        go(x) { x.btn('prod', true); restore(x, aux); }, done: (x) => x.T(st) < 40, est: (x) => { const kw = (hx ? +hx.props.kwc : 0) + (Math.max(0, (+x.pr.qsoft || 0) - (+x.pr.qpw || 0)) / 3600) * CP * (58 - 20); return hxT(kg(), Math.max(x.T(st), Ts - 3), 40, hx ? +hx.props.set || 16 : 16, hx ? +hx.props.kwc : 0, hxQ(hx, 0.4), kw - (hx ? +hx.props.kwc : 0)); } },
      { n: E('Back to production: pumps and reject valve back to normal, product diverted until it is in spec for 2 min', 'رجوع للإنتاج: الطلمبات ومحبس الريجكت يرجعوا عادي، والمية بتتحوّل لحد ما تفضل جوه المواصفات دقيقتين'),
        go(x) { restore(x, hp.concat(aux, [fv])); }, done: (x) => x.st.cyTs >= 10 && divOk(x), est: () => 150 },
    ];
  }
  function loopSanit(x) {
    const tk = x.by(x.pr.ptank), hx = x.loopHx(), Ts = W.lsanT(x.pl), kg = () => (tk ? tk.state.v || 0 : 0) + 30;
    const uv = x.pl.units.filter((k) => k.type === 'UV'), pous = x.pous();
    return [
      { n: E('Start: production stops, points of use closed and tagged "HOT, do not use", UV off, loop pump on, steam on ' + tag(hx), 'البداية: الإنتاج يقف، نقط الاستخدام تتقفل ويتعلق عليها "سخن، ممنوع الاستخدام"، الـUV يتقفل، طلمبة اللوب شغالة، والبخار يفتح على ' + tag(hx)),
        go(x) { x.btn('prod', false); for (const p of pous) x.set(p, 'open', false); for (const k of uv) x.set(k, 'on', false); x.btn('dist', true); x.btn('lsan', true); }, done: (x) => x.st.cyTs >= 5, est: () => 5 },
      { n: E('Heat ' + tag(tk) + ' and the loop to ' + (Ts - 5) + ' °C (' + tag(hx) + ' outlet ' + Ts + ' °C, ' + (hx ? hx.props.kwh : '-') + ' kW steam)', 'سخّن ' + tag(tk) + ' واللوب لـ' + (Ts - 5) + ' درجة (خروج ' + tag(hx) + ' ‏' + Ts + ' درجة، بخار ' + (hx ? hx.props.kwh : '-') + ' ك.و)'),
        done: (x) => x.T(tk) >= Ts - 5 || (x.st.lheld || 0) > 0 || !x.pr.lsan, est: (x) => hxT(kg(), x.T(tk), Ts - 5, Ts, hx ? +hx.props.kwh : 0, hxQ(hx, 0.8)) },
      { n: E('Hold ' + (x.pr.lhold || 60) + ' min at ' + (Ts - 5) + ' °C or more, opening each point of use for 30 s so its outlet is sanitised too: bacteria killed (regular hot sanitisation stops biofilm forming; it does not remove an old one)', 'ثبّت ' + (x.pr.lhold || 60) + ' دقيقة على ' + (Ts - 5) + ' درجة أو أكتر، وافتح كل نقطة استخدام 30 ثانية عشان مخرجها يتعقم هو كمان: البكتيريا بتموت (التعقيم السخن المنتظم بيمنع البيوفيلم يتكوّن، لكن مش بيشيل بيوفيلم قديم)'),
        tick(x) { pous.forEach((p, i) => { const a = 60 + i * 60; p.props.open = x.st.cyTs >= a && x.st.cyTs < a + 30; }); }, end() { for (const p of pous) p.props.open = false; },
        done: (x) => !x.pr.lsan, est: (x) => Math.max(1, +x.pr.lhold || 60) * 60 },
      { n: E('Cool ' + tag(tk) + ' and the loop below 30 °C (' + (hx ? hx.props.kwc : '-') + ' kW chilled water). Vent filter heater on and vent open: cooling a steam-filled tank pulls a vacuum.', 'برّد ' + tag(tk) + ' واللوب لتحت 30 درجة (مية متلجة ' + (hx ? hx.props.kwc : '-') + ' ك.و). سخّان فلتر الهوا شغال والهوا مفتوح: تبريد تانك مليان بخار بيعمل فاكيوم.'),
        go(x) { x.btn('prod', false); }, // fresh water waits until the tank is cool
        done: (x) => x.T(tk) < 30, est: (x) => hxT(kg(), Math.max(x.T(tk), Ts - 5), 30, hx ? +hx.props.set || 25 : 25, hx ? +hx.props.kwc : 0, hxQ(hx, 0.8)) },
      { n: E('Production back on (it restarts by the tank level), UV on, points of use released', 'الإنتاج يرجع (بيشتغل لوحده حسب مستوى التانك)، الـUV يشتغل، ونقط الاستخدام تتفتح للاستخدام'),
        go(x) { restore(x, uv.concat(pous)); x.btn('prod', true); }, done: (x) => x.st.cyTs >= 5, est: () => 5 },
    ];
  }

  /* ---------- the cycles ---------- */
  const CY = (W.CYC = [
    {
      id: 'fill', grp: 'start', need: ['ptank', 'stank'],
      name: E('Start-up from empty (fill to full)', 'تشغيل من الصفر (لحد ما يتملي)'),
      desc: E('Starts the station as after a full drain: every tank at 0 % (the RO vessels stay full). Watch the raw tank, the break tank and the PW tank fill, the RO start with its first water sent back, the loop start at the minimum level, and the timer until the PW tank is full. Before the points of use are released: hot-sanitise the tank and loop, then sample (conductivity, TOC, micro).', 'بيشغّل المحطة كأنها لسه متصفية: كل التانكات على 0٪ (فيسلز الـRO بتفضل مليانة). شوف تانك المية الخام وتانك الكسر وتانك الـPW وهم بيتملوا، والـRO وهو بيبدأ وأول مية بترجع، واللوب وهو بيبدأ عند أقل مستوى، والتايمر لحد ما تانك الـPW يتملي. قبل ما نقط الاستخدام تتفتح للاستخدام: اعمل تعقيم سخن للتانك واللوب، وبعدين خد عينات (كونداكتيفيتي، TOC، ميكرو).'),
      steps(x) {
        const z = x.by(x.one('PUMP', (k) => k.props.stk && k.props.grp === 'prod') ? x.one('PUMP', (k) => k.props.stk && k.props.grp === 'prod').props.stk : ''), st = x.by(x.pr.stank), pw = x.by(x.pr.ptank);
        const lp = x.pumps('dist').find((k) => pw && k.props.lvt === pw.tag), lo = Math.max(5, Math.min(50, (lp ? Math.max(+lp.props.lon || 0, +lp.props.loff || 0) : 15) + 5)); // loop pump start level + margin
        const pq = (x) => { const d = x.div(); return d && !d.state.div && (d.state.q || 0) > 0.01 ? d.state.q : (+x.pr.qpw || 1000) / 3600; };
        return [
          { n: E('Station empty: every tank at 0 % (RO vessels stay full), drains and points of use closed, city inlet ' + (x.pr.inlet || '-') + ' open', 'المحطة فاضية: كل التانكات على 0٪ (فيسلز الـRO بتفضل مليانة)، الصرف ونقط الاستخدام مقفولين، ومحبس مية البلد ' + (x.pr.inlet || '-') + ' مفتوح'),
            go(x) { x.btn('prod', false); x.btn('dist', false); x.btn('sanit', false); x.btn('lsan', false); for (const t of x.tanks()) t.state.v = 0; for (const d of x.drains()) x.set(d, 'open', false); for (const p of x.pous()) x.set(p, 'open', false); const i = x.by(x.pr.inlet); if (i) i.props.open = true; for (const p of x.pumps()) { p.state.trip = 0; p.state.lpt = 0; } },
            done: (x) => x.st.cyTs >= 5, est: () => 5 },
          { n: E('Production ON: fill the raw tank ' + tag(z) + ' from the city water to 20 % (the feed pump starts there)', 'شغّل الإنتاج: املا تانك المية الخام ' + tag(z) + ' من مية البلد لـ20٪ (طلمبة التغذية بتبدأ عندها)'),
            go(x) { x.btn('prod', true); }, done: (x) => !z || (x.lvl(z) >= 20 && x.pumps('prod').some((k) => k.props.stk === z.tag && (k.state.q || 0) > 0.05)), est: (x) => (z ? Math.max(0, 0.2 * z.props.vol - (x.st.cyI > 1 ? z.state.v : 0)) / ((+x.pr.qin || 3000) / 3600) : 0) },
          { n: E('Pretreatment running (filter, softener, cartridge): fill the break tank ' + tag(st) + ' to 20 %', 'المعالجة الأولية شغالة (فلتر، سوفتنر، كارتريدج): املا تانك الكسر ' + tag(st) + ' لـ20٪'),
            done: (x) => !st || x.lvl(st) >= 20, est: (x) => { const f = x.pumps('prod').find((k) => z && k.props.stk === z.tag), q = f && (f.state.q || 0) > 0.05 ? f.state.q : (+x.pr.qsoft || 1400) / 3600; return st ? Math.max(0, 0.2 * st.props.vol - (x.st.cyI >= 2 ? st.state.v : 0)) / q : 0; } },
          { n: E('RO pass 1 and 2 start: the first water goes back to ' + tag(st) + ' until it is in spec for 2 min', 'المرحلة الأولى والتانية للـRO بيبدأوا: أول مية بترجع لـ' + tag(st) + ' لحد ما تفضل جوه المواصفات دقيقتين'),
            done: (x) => x.st.cyTs >= 10 && divOk(x), est: () => 150 },
          { n: E('Fill the PW tank ' + tag(pw) + ' to ' + lo + ' % (the loop pump minimum level)', 'املا تانك الـPW ' + tag(pw) + ' لـ' + lo + '٪ (أقل مستوى لطلمبة اللوب)'),
            done: (x) => !pw || x.lvl(pw) >= lo, est: (x) => { const q = pq(x); return pw ? Math.max(0, (lo / 100) * pw.props.vol - (x.st.cyI >= 4 ? pw.state.v : 0)) / q : 0; } },
          { n: E('Start the distribution loop and check the loop flow', 'شغّل لوب التوزيع واتأكد من الفلو في اللوب'),
            go(x) { x.btn('dist', true); }, done: (x) => x.st.cyTs >= 30 && x.pumps('dist').some((k) => Math.abs(k.state.q || 0) > 0.1), est: () => 30 },
          { n: E('Fill the PW tank ' + tag(pw) + ' to 90 % with the loop running (production stops by level)', 'املا تانك الـPW ' + tag(pw) + ' لـ90٪ واللوب شغال (الإنتاج بيقف بالمستوى)'),
            done: (x) => !pw || x.lvl(pw) >= 89.5 || prodStoppedByLevel(x), est: (x) => { const q = pq(x); return pw ? Math.max(0, 0.9 * pw.props.vol - (x.st.cyI >= 4 ? pw.state.v : (lo / 100) * pw.props.vol)) / q : 0; } },
        ];
      },
    },
    {
      id: 'drain', grp: 'drain', need: ['drains'], keep: true,
      name: E('Drain the whole station', 'تصفية المحطة كلها (درين)'),
      desc: E('Stops everything, closes the city water inlet and opens the bottom drain of every tank. The estimate uses Torricelli through the drain pipe (entry loss and pipe friction, valve loss not counted), so the real time is a little longer. RO vessels, filters and the softener stay full: membranes must never dry out. The station stays empty and stopped: run "Start-up from empty" to refill.', 'بيوقف كل حاجة، ويقفل دخول مية البلد، ويفتح صرف كل تانك من تحت. التقدير بقانون تورشيللي في ماسورة الصرف (فقد الدخول واحتكاك الماسورة، من غير فقد المحبس)، فالوقت الحقيقي بيطلع أطول شوية. فيسلز الـRO والفلاتر والسوفتنر بيفضلوا مليانين: الممبرين عمره ما ينشف. المحطة بتفضل فاضية وواقفة: شغّل "تشغيل من الصفر" عشان تملاها.'),
      steps(x) {
        const ts = x.tanks().filter((t) => drainOf(x, t));
        return [
          stopAll(), coolFirst(ts),
          { n: E('Close the city water inlet ' + (x.pr.inlet || '-'), 'اقفل دخول مية البلد ' + (x.pr.inlet || '-')), go(x) { const i = x.by(x.pr.inlet); if (i) i.props.open = false; }, done: (x) => x.st.cyTs >= 3, est: () => 3 },
          { n: E('Open the bottom drains: ' + ts.map((t) => tag(drainOf(x, t)) + ' (' + t.tag + ')').join(', '), 'افتح الصرف من تحت: ' + ts.map((t) => tag(drainOf(x, t)) + ' (' + t.tag + ')').join('، ')),
            go(x) { for (const t of ts) drainOf(x, t).props.open = true; }, done: (x) => ts.every((t) => x.lvl(t) < EMPTY), est: (x) => Math.max(0, ...ts.map((t) => drainT(x, t))) },
          { n: E('Close the drains: the station is empty and stopped', 'اقفل الصرف: المحطة فاضية وواقفة'), go(x) { for (const t of ts) drainOf(x, t).props.open = false; }, done: (x) => x.st.cyTs >= 3, est: () => 3 },
        ];
      },
      abort: (x) => closeDrains(x),
    },
    {
      id: 'drainpw', grp: 'drain', need: ['ptank'], keep: true,
      name: E('Drain the PW tank and loop only', 'تصفية تانك الـPW واللوب بس'),
      desc: E('Production and the loop stop, the PW tank drain and the points of use open. The RO side keeps its water.', 'الإنتاج واللوب بيقفوا، وصرف تانك الـPW ونقط الاستخدام بيفتحوا. ناحية الـRO بتفضل مليانة.'),
      steps(x) {
        const pw = x.by(x.pr.ptank), dv = pw ? drainOf(x, pw) : null;
        return [
          stopAll(), coolFirst(pw ? [pw] : []),
          { n: E('Open the drain ' + tag(dv) + ' of ' + tag(pw) + ' and the points of use (they let air in so the loop drains back; low-point drains not drawn)', 'افتح صرف ' + tag(pw) + ' ‏' + tag(dv) + ' ونقط الاستخدام (بتدخّل هوا عشان اللوب يصفّي؛ صرف أوطى النقط مش مرسوم)'),
            go(x) { if (dv) dv.props.open = true; for (const p of x.pous()) p.props.open = true; }, done: (x) => !pw || x.lvl(pw) < EMPTY, est: (x) => (pw ? drainT(x, pw) : 0) },
          { n: E('Close the drain and the points of use', 'اقفل الصرف ونقط الاستخدام'), go(x) { if (dv) dv.props.open = false; for (const p of x.pous()) p.props.open = false; }, done: (x) => x.st.cyTs >= 3, est: () => 3 },
        ];
      },
      abort: (x) => closeDrains(x),
    },
    {
      id: 'flushloop', grp: 'wash', need: ['ptank'],
      name: E('Flush the PW loop (points of use)', 'شطف لوب الـPW (نقط الاستخدام)'),
      desc: E('Opens every point of use in turn for 3 minutes with the loop running. Production refills the tank by itself.', 'بيفتح كل نقطة استخدام ورا التانية 3 دقايق واللوب شغال. الإنتاج بيعوّض التانك لوحده.'),
      steps: (x) => loopFlush(x).concat([{ n: E('Done: points of use closed', 'خلصنا: نقط الاستخدام مقفولة'), done: (x) => x.st.cyTs >= 3, est: () => 3 }]),
    },
    {
      id: 'flushro', grp: 'wash', need: ['hp1', 'ffv'],
      name: E('RO fast flush (low pressure)', 'شطف سريع للـRO (ضغط واطي)'),
      desc: E('Washes the membrane surface with a high flow at low pressure, product diverted to the break tank. Done after a stop and before a long standstill.', 'بيغسل سطح الممبرين بفلو عالي وضغط واطي، والمية الخارجة متحوّلة لتانك الكسر. بيتعمل بعد الوقفة وقبل وقفة طويلة.'),
      steps: (x) => roFlush(x),
    },
    {
      id: 'washall', grp: 'wash', need: ['hp1', 'ffv'],
      name: E('Whole station wash', 'غسيل المحطة كلها'),
      desc: E('Backwash of the sand filter, softener regeneration, new cartridge, RO fast flush, then a flush of every point of use. Pretreatment times are typical values (the backwash and brine water paths are not drawn).', 'باك واش لفلتر الرمل، ريجينريشن للسوفتنر، كارتريدج جديد، شطف سريع للـRO، وبعدين شطف كل نقط الاستخدام. أزمنة المعالجة الأولية قيم نموذجية (مسار مية الباك واش والملح مش مرسوم).'),
      steps(x) {
        const sf = x.one('FILTER', (k) => k.props.kind === 'sand'), so = x.one('SOFT'), cf = x.one('FILTER', (k) => /cart/.test(k.props.kind));
        const s = [stopProd()];
        if (sf) s.push({ n: E('Backwash the sand filter ' + sf.tag + ' (backwash 10 min, rinse 5 min)', 'باك واش لفلتر الرمل ' + sf.tag + ' (باك واش 10 دقايق، وشطف 5 دقايق)'), done: (x) => x.st.cyTs >= 900, end() { sf.state.clog = 0; }, est: () => 900 });
        if (so) s.push({ n: E('Regenerate the softener ' + so.tag + ' (brine draw, slow rinse, fast rinse: about 60 min), then check the outlet hardness before the RO', 'ريجينريشن للسوفتنر ' + so.tag + ' (سحب ملح، شطف بطيء، شطف سريع: حوالي 60 دقيقة)، وبعدين اقيس العسر في الخروج قبل الـRO'), done: (x) => x.st.cyTs >= 3600, end() { so.state.used = 0; so.state.left = 100; }, est: () => 3600 });
        if (cf) s.push({ n: E('Change the cartridge ' + cf.tag + ', vent the housing and flush the new cartridge to drain (10 min)', 'غيّر الكارتريدج ' + cf.tag + '، طلّع الهوا من الهاوسنج واشطف الكارتريدج الجديد للصرف (10 دقايق)'), done: (x) => x.st.cyTs >= 600, end() { cf.state.clog = 0; }, est: () => 600 });
        return s.concat(roFlush(x), loopFlush(x), [{ n: E('Done: back to normal production', 'خلصنا: رجوع للإنتاج العادي'), done: (x) => x.st.cyTs >= 3, est: () => 3 }]);
      },
    },
    {
      id: 'sanro', grp: 'san', need: ['stank'],
      name: E('Hot sanitisation of the RO (pass 1 + 2)', 'تعقيم سخن للـRO (المرحلتين)'),
      desc: E('Hot water recirculates through both RO passes and back to the break tank, never to the PW tank. Heat-up and cool-down estimates are energy balances: m × 4.186 × ΔT / kW.', 'مية سخنة بتلف على المرحلتين وترجع لتانك الكسر، ومش بتروح لتانك الـPW أبدًا. تقدير التسخين والتبريد بالطاقة: الكتلة × 4.186 × فرق الحرارة ÷ الكيلووات.'),
      steps: (x) => roSanit(x), abort(x) { x.btn('sanit', false); },
    },
    {
      id: 'sanloop', grp: 'san', need: ['ptank'],
      name: E('Hot sanitisation of the PW tank and loop', 'تعقيم سخن لتانك الـPW واللوب'),
      desc: E('Production stops and the loop exchanger heats the PW tank and loop with steam, holds, then cools with chilled water. Points of use stay closed.', 'الإنتاج بيقف والمبادل اللي على اللوب بيسخّن تانك الـPW واللوب بالبخار، يثبّت، وبعدين يبرّد بالمية المتلجة. نقط الاستخدام بتفضل مقفولة.'),
      steps: (x) => loopSanit(x), abort(x) { x.btn('lsan', false); x.btn('prod', true); },
    },
    {
      id: 'sanall', grp: 'san', need: ['stank', 'ptank'],
      name: E('Whole station hot sanitisation (RO, then tank and loop)', 'تعقيم سخن للمحطة كلها (الـRO وبعدين التانك واللوب)'),
      desc: E('The RO sanitisation first, then the PW tank and loop. The longest cycle: use 300x.', 'تعقيم الـRO الأول، وبعدين تانك الـPW واللوب. دي أطول دورة: استخدم 300x.'),
      steps: (x) => roSanit(x).concat(loopSanit(x)), abort(x) { x.btn('sanit', false); x.btn('lsan', false); x.btn('prod', true); },
    },
  ]);
  W.CYGRP = { start: E('Start-up and filling', 'التشغيل والملو'), drain: E('Drain', 'التصفية (درين)'), wash: E('Wash and flush', 'الغسيل والشطف'), san: E('Sanitisation', 'التعقيم') };

  W.cycAvail = function (c, u, C) { return C.need.every((k) => { const v = u.props[k]; return k === 'drains' ? list(v).some((t) => PL.byTag(c.plant, t)) : !!(v && PL.byTag(c.plant, v)); }) && (C.id !== 'sanloop' && C.id !== 'sanall' || ctx(c, u).loopHx()); };
  W.cycSteps = function (c, u, id) { const C = CY.find((k) => k.id === id); return C ? C.steps(ctx(c, u)) : []; };
  /* estimates per step from the present state (before starting) */
  W.cycEst = function (c, u, id) { const x = ctx(c, u); x.st = Object.assign({}, u.state, { cyI: 0, cyTs: 0 }); return W.cycSteps(c, u, id).map((s) => { try { return Math.max(0, s.est ? s.est(x) || 0 : 0); } catch (e) { return 0; } }); };
  W.cycRunning = (u) => (u && u.state && u.state.cyN ? CY[u.state.cyN - 1] || null : null);

  const tot = (pl, type) => pl.units.filter((k) => k.type === type).reduce((a, k) => a + (k.state.tot || 0), 0);
  function clear(st) { for (const k of Object.keys(st)) if (/^c[sexp]\d+$/.test(k)) delete st[k]; }
  W.cycStart = function (c, u, id) {
    const st = u.state, i = CY.findIndex((k) => k.id === id);
    if (i < 0 || st.cyN || !W.cycAvail(c, u, CY[i])) return false;
    const est = W.cycEst(c, u, id);
    clear(st);
    est.forEach((e, k) => { st['cp' + k] = e; });
    Object.assign(st, { cyN: i + 1, cyI: 0, cyT: 0, cyTs: 0, cyGo: 0, cyDone: 0, cyAb: 0, cyKh: 0, cyKc: 0, cyDiv: 0, cyFF: 0, cyD0: tot(c.plant, 'DRAIN'), cyP0: tot(c.plant, 'POU'), cyDr: 0, cyPo: 0, cySk: 0 });
    st._snap = {};
    EL.emit('alarm', { id: u.id, tag: u.tag }, { k: E('Cycle started', 'الدورة بدأت'), n: CY[i].name });
    return true;
  };
  function restore(x, only) {
    const sn = x.st._snap || {};
    const ids = only ? only.filter(Boolean).map((k) => k.id) : Object.keys(sn);
    for (const id of ids) { const k = x.pl.units.find((q) => q.id === id); if (k && sn[id]) { Object.assign(k.props, sn[id]); delete sn[id]; } }
  }
  function finish(x, C, ab) {
    const st = x.st;
    if (!C.keep || ab) restore(x);
    st._snap = {};
    if (ab && C.abort) C.abort(x);
    st.cyDiv = 0; st.cyFF = 0;
    st.cyDr = tot(x.pl, 'DRAIN') - (st.cyD0 || 0); st.cyPo = tot(x.pl, 'POU') - (st.cyP0 || 0);
    st.cyDone = st.cyN; st.cyAb = ab ? 1 : 0; st.cyN = 0;
    EL.emit('alarm', { id: x.u.id, tag: x.u.tag }, { k: ab ? E('Cycle stopped', 'الدورة وقفت') : E('Cycle complete', 'الدورة خلصت'), n: C.name });
  }
  W.cycStop = function (c, u) { const C = W.cycRunning(u); if (!C) return; const x = ctx(c, u); if (u.state.cyI != null) u.state['cs' + u.state.cyI] = u.state.cyTs || 0; finish(x, C, true); };
  W.cycSkip = function (u) { if (u.state.cyN) u.state.cySk = 1; };
  W.cycClear = function (u) { const st = u.state; st.cyDone = 0; st.cyAb = 0; clear(st); };

  /* called every tick from the CTRL step */
  W.cycStep = function (u, s) {
    const st = u.state;
    if (!st.cyN) return;
    const C = CY[st.cyN - 1];
    if (!C) { st.cyN = 0; return; }
    const x = ctx(s.c, u), steps = C.steps(x), dt = s.dt;
    st.cyT = (st.cyT || 0) + dt; st.cyTs = (st.cyTs || 0) + dt;
    for (const k of s.pl.units) if (k.type === 'TEMP') { const kw = k.state.kw || 0; if (kw > 0) st.cyKh += (kw * dt) / 3600; else st.cyKc += (-kw * dt) / 3600; }
    const i = st.cyI || 0, S = steps[i];
    if (!S) { finish(x, C, false); return; }
    if (!st.cyGo) { st.cyGo = 1; st['ce' + i] = S.est ? Math.max(0, S.est(x) || 0) : 0; if (S.go) S.go(x); return; }
    if (S.tick) S.tick(x);
    st.cyLate = S.est && st['ce' + i] > 0 && st.cyTs > Math.max(2 * st['ce' + i], st['ce' + i] + 600) ? 1 : 0; // taking far longer than the estimate: something is wrong
    if (st.cySk || S.done(x)) {
      st['cs' + i] = st.cyTs; if (st.cySk) st['cx' + i] = 1;
      if (S.end) S.end(x);
      st.cySk = 0; st.cyI = i + 1; st.cyTs = 0; st.cyGo = 0;
      if (st.cyI >= steps.length) finish(x, C, false);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
