/* Instruments: multimeter, clamp meter, insulation tester, mA calibrator, voltage tester, NCV pen */
(function (g) {
  const EL = g.EL;
  const { Z, VS, IS, cabs } = EL;

  EL.ctx = { mains: true, extra: [] };
  const I = (EL.inst = {
    sel: 'dmm', active: 'red', learn: false,
    probes: { red: null, black: null, clamp: null, ncv: null },
    dmm: { dial: 'VAC', jack: 'V', hold: false, held: null, manual: false, rangeMax: null, minmax: false, min: null, max: null, rel: false, relRef: 0, hz: false, acdc: 'AC', fuseBlown: false, shuntBlown: false },
    clamp: { dial: 'AAC', hold: false, held: null, inrush: false, peak: 0, minmax: false },
    meg: { v: 500, testing: false, t: 0, result: null },
    cal: { mode: 'src_mA', mA: 12, V: 5, on: false },
    tester: { self: false },
    ncv: { hi: true },
    msg: '',
  });
  EL.instNeeds = { dmm: ['red', 'black'], clamp: ['clamp'], meg: ['red', 'black'], cal: ['red', 'black'], tester: ['red', 'black'], ncv: ['ncv'] };

  /* ---------- formatting ---------- */
  function sig(v, unit, forceMilli) {
    const a = Math.abs(v);
    if (forceMilli) return (v * 1000).toFixed(a * 1000 >= 100 ? 1 : 2);
    if (a >= 1000) return v.toFixed(0);
    if (a >= 100) return v.toFixed(1);
    if (a >= 10) return v.toFixed(2);
    if (a >= 1) return v.toFixed(3);
    return v.toFixed(4);
  }
  function fmtOhm(r) {
    if (!isFinite(r) || r > 60e6) return { t: 'OL', u: 'Ω' };
    if (r < 600) return { t: r.toFixed(r < 100 ? 2 : 1), u: 'Ω' };
    if (r < 6000) return { t: (r / 1e3).toFixed(3), u: 'kΩ' };
    if (r < 60000) return { t: (r / 1e3).toFixed(2), u: 'kΩ' };
    if (r < 600000) return { t: (r / 1e3).toFixed(1), u: 'kΩ' };
    if (r < 6e6) return { t: (r / 1e6).toFixed(3), u: 'MΩ' };
    return { t: (r / 1e6).toFixed(2), u: 'MΩ' };
  }
  EL.fmtOhm = fmtOhm;

  EL.instClean = function (c) {
    const ok = (r) => !r || EL.partById(c, r.split('.')[0]);
    for (const k of Object.keys(I.probes)) if (!ok(I.probes[k])) I.probes[k] = null;
  };

  /* ---------- elements injected into the live simulation each tick ---------- */
  EL.instElements = function (c) {
    const out = [], P = I.probes;
    // multimeter in current mode, or leads left in a current jack
    const d = I.dmm;
    if (I.sel === 'dmm' && P.red && P.black && d.dial !== 'OFF' && !d.fuseBlown) {
      const wantI = d.dial === 'MA' || d.dial === 'A';
      let Rm = 0;
      if (d.jack === 'A') Rm = 0.03; else if (d.jack === 'mA') Rm = 1.8;
      if (wantI && d.jack === 'V') Rm = 0; // open: leads in the wrong jack
      if (Rm > 0) out.push(Z(P.red, P.black, Rm, 0, { tag: 'dmm', part: '_dmm' }));
    }
    const k = I.cal;
    if (I.sel === 'cal' && k.on && P.red && P.black) {
      if (k.mode === 'src_mA') out.push(IS(P.black, P.red, k.mA / 1000, { vmax: 24, tag: 'cal', part: '_cal' }));
      else if (k.mode === 'src_V') { const n = '#cal:i'; out.push(VS(P.black, n, { vdc: k.V, tag: 'calv', part: '_cal' }), Z(n, P.red, 50, 0, { tag: 'cal', part: '_cal' })); }
      else if (k.mode === 'meas_mA') out.push(Z(P.red, P.black, 15, 0, { tag: 'cal', part: '_cal' }));
      else if (k.mode === 'loop') { const n = '#cal:i'; out.push(VS(P.black, n, { vdc: 24, tag: 'calv', part: '_cal' }), Z(n, P.red, 20, 0, { tag: 'cal', part: '_cal' })); }
      else if (k.mode === 'sim_tx') out.push(IS(P.red, P.black, k.mA / 1000, { vmin: 3, tag: 'cal', part: '_cal' }));
    }
    return out;
  };

  /* ---------- helpers ---------- */
  function ctxDead(extra) { return Object.assign({}, EL.ctx, { dead: true, extra, gmin: 1e-13 }); }
  EL.voltsBetween = function (c, sim, a, b) {
    if (!a || !b) return null;
    if (sim.sameIsland(a, b)) return { dc: sim.vdc(a, b), ac: cabs(sim.vac(a, b)), f: sim.freqAt(a), acC: sim.vac(a, b), merged: false };
    const f = sim.freqAt(a) || sim.freqAt(b);
    const s2 = EL.simulate(c, Object.assign({}, EL.ctx, { extra: (EL.ctx.extra || []).concat([Z(a, b, 1e7, 0, { tag: 'm', part: '_m' })]), forceF: f || 0 }));
    const e = s2.e('_m', 'm');
    return { dc: e.r_.vdc, ac: cabs(e.r_.vac), f: f, acC: e.r_.vac, merged: true };
  };
  EL.ohmsBetween = function (c, sim, a, b, opt) {
    opt = opt || {};
    const vlive = EL.voltsBetween(c, sim, a, b);
    const live = vlive && (Math.abs(vlive.dc) > 5 || vlive.ac > 5);
    const test = opt.testV || 0.4;
    const s2 = EL.simulate(c, ctxDead([VS(b, a, { vdc: test, tag: 'o', part: '_o' })]));
    const e = s2.e('_o', 'o');
    const i = e.r_.idc;
    const r = i > 1e-12 ? test / i - 0.2 : Infinity; // minus nothing: lead resistance added below
    return { r: isFinite(r) ? Math.max(0, r) + 0.2 : Infinity, live, vlive };
  };
  EL.diodeBetween = function (c, a, b) {
    const s2 = EL.simulate(c, ctxDead([VS(b, '#d:i', { vdc: 3.0, tag: 'o', part: '_o' }), Z('#d:i', a, 2700, 0, { tag: 'z', part: '_o' })]));
    const nd = s2.sim ? 0 : 0;
    const va = s2.vdcAt(a), vb = s2.vdcAt(b);
    return va - vb;
  };

  /* ---------- digital multimeter ---------- */
  EL.dmmRead = function (c, sim) {
    const d = I.dmm, P = I.probes;
    const o = { t: '----', u: '', sub: '', warn: [], beep: false, mode: d.dial, val: null };
    if (d.dial === 'OFF') { o.t = ''; return o; }
    if (d.fuseBlown) { o.t = 'FUSE'; o.warn.push(['Meter fuse is blown. Replace it.', 'فيوز الميتر محروق. غيّره.']); return o; }
    const shuntMode = d.jack !== 'V';
    const cur = d.dial === 'MA' || d.dial === 'A';
    if (!P.red || !P.black) { o.sub = EL.tr(['Place both probes on terminals', 'حط البروبين على أطراف']); return o; }
    if (cur) {
      if (d.jack === 'V') { o.t = '0.000'; o.u = d.dial === 'MA' ? 'mA' : 'A'; o.warn.push(['Move the red lead to the ' + (d.dial === 'MA' ? 'mA' : '10A') + ' jack for current.', 'انقل الليد الأحمر لفتحة ' + (d.dial === 'MA' ? 'mA' : '10A') + ' عشان تقيس تيار.']); return o; }
      if (d.dial === 'MA' && d.jack === 'A') o.warn.push(['Red lead is in the A jack while the dial is on mA: allowed, but use the mA jack for small currents.', 'الليد في فتحة A والدايل على mA: ينفع لكن استخدم فتحة mA للتيار الصغير.']);
      if (d.dial === 'A' && d.jack === 'mA') o.warn.push(['Dial is on A but the lead is in the mA jack. Fuse is 0.44 A.', 'الدايل على A والليد في فتحة mA. الفيوز 0.44 أمبير.']);
      const e = sim.e('_dmm', 'dmm');
      if (!e) return o;
      const r = e.r_;
      let v = d.acdc === 'AC' ? cabs(r.iac) : r.idc;
      if (Math.abs(v) < 2e-6) v = 0;
      o.val = v; o.u = (d.dial === 'MA' ? 'mA' : 'A') + (d.acdc === 'AC' ? '~' : '⎓');
      o.t = d.dial === 'MA' ? (v * 1000).toFixed(Math.abs(v * 1000) >= 100 ? 1 : 2) : v.toFixed(Math.abs(v) >= 1 ? 3 : 4);
      if (Math.abs(v) > (d.dial === 'MA' ? 0.4 : 10)) o.t = 'OL';
      if (e.r_ && Math.abs(r.vdc) + cabs(r.vac) > 1) o.warn.push(['Voltage across the meter in current mode. Is it in series?', 'فيه جهد على الميتر في وضع التيار. هل هو على التوالي؟']);
      return o;
    }
    if (shuntMode) { o.t = 'Err'; o.warn.push(['Red lead is in a current jack! The meter is acting as a short. Move it to VΩ.', 'الليد الأحمر في فتحة التيار! الميتر شغال كأنه شورت. انقله لفتحة VΩ.']); return o; }
    if (d.dial === 'VAC' || d.dial === 'VDC' || d.dial === 'MV') {
      const v = EL.voltsBetween(c, sim, P.red, P.black);
      if (!v) return o;
      if (d.dial === 'VAC') {
        o.val = v.ac; o.u = 'V~';
        if (d.hz) { o.t = v.ac > 5 ? v.f.toFixed(1) : '0.0'; o.u = 'Hz'; o.val = v.f; }
        else { o.t = sig(v.ac); if (v.dc > 5) o.warn.push(['DC voltage is also present (' + v.dc.toFixed(1) + ' V). Switch to DC.', 'فيه جهد DC كمان (' + v.dc.toFixed(1) + ' فولت). حوّل على DC.']); if (v.ac > 1000) o.t = 'OL'; }
      } else if (d.dial === 'VDC') {
        o.val = v.dc; o.u = 'V⎓'; o.t = sig(v.dc); if (Math.abs(v.dc) > 1000) o.t = 'OL';
        if (v.ac > 5) o.warn.push(['AC voltage is also present (' + v.ac.toFixed(1) + ' V). Switch to AC.', 'فيه جهد AC كمان (' + v.ac.toFixed(1) + ' فولت). حوّل على AC.']);
      } else {
        o.val = v.dc; o.u = 'mV⎓'; if (Math.abs(v.dc) > 0.6) { o.t = 'OL'; } else o.t = (v.dc * 1000).toFixed(1);
      }
      if (v.merged) o.sub = EL.tr(['probes on separate circuits', 'البروبات على دايرتين منفصلتين']);
      return o;
    }
    if (d.dial === 'OHM' || d.dial === 'CONT') {
      const r = EL.ohmsBetween(c, sim, P.red, P.black);
      if (r.live) { o.t = 'OL'; o.u = 'Ω'; o.warn.push(['Circuit is live (' + (Math.max(Math.abs(r.vlive.dc), r.vlive.ac)).toFixed(0) + ' V). Never measure ohms on a live circuit. Switch off first.', 'الدايرة عليها كهرباء (' + (Math.max(Math.abs(r.vlive.dc), r.vlive.ac)).toFixed(0) + ' فولت). متقيسش أوم والكهرباء موجودة. افصل الأول.']); return o; }
      let f = fmtOhm(r.r);
      o.val = r.r; o.t = f.t; o.u = f.u;
      if (d.dial === 'CONT') { o.u = f.u; o.beep = r.r < 30; o.sub = o.beep ? EL.tr(['continuity', 'فيه توصيل']) : ''; }
      return o;
    }
    if (d.dial === 'DIODE') {
      const v = EL.diodeBetween(c, P.red, P.black);
      o.val = v; o.u = 'V';
      o.t = v > 2.9 ? 'OL' : v.toFixed(3);
      o.sub = v > 2.9 ? EL.tr(['open / reverse biased', 'مفتوح / عكسي']) : EL.tr(['forward drop', 'هبوط أمامي']);
      return o;
    }
    return o;
  };

  /* ---------- clamp meter ---------- */
  EL.clampRead = function (c, sim) {
    const d = I.clamp, P = I.probes;
    const o = { t: '----', u: '', sub: '', warn: [], beep: false };
    if (d.dial === 'OFF') { o.t = ''; return o; }
    if (d.dial === 'AAC' || d.dial === 'ADC') {
      if (!P.clamp) { o.sub = EL.tr(['Tap a terminal to clamp around its wire', 'اضغط على طرف عشان تحط الكلامب على السلك']); return o; }
      const ref = P.clamp, pi = sim.iPin(ref), pn = EL.pin(EL.partById(c, ref.split('.')[0]), ref.split('.')[1]);
      let v = d.dial === 'AAC' ? cabs(pi.ac) : Math.abs(pi.dc);
      if (v < 0.005) v = 0;
      o.val = v; o.u = d.dial === 'AAC' ? 'A~' : 'A⎓';
      o.t = v >= 100 ? v.toFixed(1) : v >= 10 ? v.toFixed(2) : v.toFixed(3);
      const part = EL.partById(c, ref.split('.')[0]);
      if (part && part.type === 'BUS') o.warn.push(['A bar has no single conductor to clamp. Clamp on a device terminal.', 'البار مفيهوش سلك واحد تحط عليه الكلامب. حطه على طرف جهاز.']);
      if (v > 400) o.t = 'OL';
      if (d.inrush) { o.sub = 'INRUSH peak ' + d.peak.toFixed(1) + ' A'; }
      else if (d.minmax) o.sub = 'MAX ' + d.peak.toFixed(2) + ' A';
      return o;
    }
    // voltage / ohm with leads: reuse DMM logic with a temporary state
    const save = I.dmm.dial, sj = I.dmm.jack, sh = I.dmm.hold;
    const map = { VAC: 'VAC', VDC: 'VDC', OHM: 'OHM', CONT: 'CONT' };
    I.dmm.dial = map[d.dial] || 'VAC'; I.dmm.jack = 'V';
    const r = EL.dmmRead(c, sim);
    I.dmm.dial = save; I.dmm.jack = sj;
    return r;
  };

  /* ---------- insulation tester ---------- */
  EL.megRead = function (c, sim) {
    const m = I.meg, P = I.probes;
    const o = { t: '----', u: 'MΩ', sub: '', warn: [], state: 'idle', bar: 0 };
    if (!P.red || !P.black) { o.sub = EL.tr(['Place the leads (usually on a phase and on PE)', 'حط الليدات (عادة على فاز وعلى PE)']); return o; }
    const vl = EL.voltsBetween(c, sim, P.red, P.black);
    if (vl && (Math.abs(vl.dc) > 30 || vl.ac > 30)) { o.t = 'LIVE'; o.u = 'V'; o.state = 'live'; o.sub = (vl.ac > 30 ? vl.ac : Math.abs(vl.dc)).toFixed(0) + ' V'; o.warn.push(['Voltage present. Test refused. Isolate and lock out first.', 'فيه جهد. الاختبار اترفض. اعزل واقفل لوتو الأول.']); return o; }
    if (!m.testing) { o.sub = EL.tr(['Hold TEST to apply ' + m.v + ' V', 'اضغط TEST عشان يطبق ' + m.v + ' فولت']); return o; }
    const s2 = EL.simulate(c, ctxDead([VS(P.black, P.red, { vdc: m.v, tag: 'g', part: '_g' })]));
    const e = s2.e('_g', 'g');
    const i = e.r_.idc;
    const R = i > 1e-15 ? m.v / i : Infinity;
    // damage electronics in the tested island
    const isl = s2.isl(P.red);
    const hit = [];
    if (isl) for (const p of c.parts) {
      const d = EL.defs[p.type];
      if (!d.electronic || p.state.damaged) continue;
      const vs = [];
      for (const pin of EL.pinsOf(p)) { const nd = s2.net(EL.P(p, pin.id)); if (isl.Vdc.has(nd)) vs.push(isl.Vdc.get(nd)); }
      if (vs.length >= 1 && Math.max(...vs) - Math.min(...vs, 0) > 60 || vs.some((x) => Math.abs(x) > 60 && isl.nodes.length)) {
        // only if the part has pins at the elevated potential
        const hot = vs.some((x) => Math.abs(x) > 60);
        if (hot) hit.push(p);
      }
    }
    if (hit.length) {
      for (const p of hit) { p.state.damaged = true; p.fault = 'dead'; EL.emit('burn', p, 'megger'); }
      o.warn.push(['Electronics were connected: ' + hit.map((p) => p.tag).join(', ') + ' damaged by the test voltage! Disconnect drives, PSUs and PLC cards before a megger test.', 'كان فيه إلكترونيات متوصلة: ' + hit.map((p) => p.tag).join(', ') + ' اتلفت من جهد الاختبار! افصل الانفرترات والباور والكروت قبل الميجر.']);
    }
    o.state = 'test'; m.result = R;
    if (R >= 1e10) { o.t = '>10000'; }
    else if (R >= 1e6) { o.t = (R / 1e6) >= 1000 ? (R / 1e6).toFixed(0) : (R / 1e6) >= 100 ? (R / 1e6).toFixed(0) : (R / 1e6).toFixed(1); }
    else if (R >= 1e3) { o.t = (R / 1e6).toFixed(3); } else o.t = (R / 1e6).toFixed(4);
    const mo = R / 1e6;
    o.verdict = mo >= 100 ? 'GOOD' : mo >= 10 ? 'OK' : mo >= 1 ? 'MARGINAL' : 'FAIL';
    o.bar = Math.max(0, Math.min(1, (Math.log10(Math.max(mo, 0.001)) + 3) / 7));
    o.val = R;
    return o;
  };

  /* ---------- calibrator ---------- */
  EL.calRead = function (c, sim) {
    const k = I.cal, P = I.probes;
    const o = { t: '----', u: 'mA', sub: '', warn: [], main2: '', ok: true };
    if (!P.red || !P.black) { o.sub = EL.tr(['Place OUT+ (red) and OUT- (black) on terminals', 'حط OUT+ (أحمر) وOUT- (أسود) على أطراف']); }
    const e = sim.e('_cal', 'cal');
    if (k.mode === 'src_mA') {
      o.t = k.mA.toFixed(2); o.u = 'mA';
      if (k.on && e) {
        const i = e.r_.idc * 1000;
        o.main2 = i.toFixed(2) + ' mA  ' + Math.abs(e.r_.vdc).toFixed(1) + ' V';
        if (e.lim || Math.abs(i - k.mA) > 0.05) { o.ok = false; o.warn.push(['Compliance limit: the load needs more than 24 V for this current. The calibrator cannot push it.', 'وصل حد الجهد: الحمل محتاج أكتر من 24 فولت للتيار ده. الكاليبريتور مش قادر يدفعه.']); }
        else if (Math.abs(i) < 0.01 && k.mA > 0.5) { o.ok = false; o.warn.push(['No current flows: open circuit or leads not on the load.', 'مفيش تيار بيمشي: دايرة مفتوحة أو الليدات مش على الحمل.']); }
      }
    } else if (k.mode === 'src_V') { o.t = k.V.toFixed(3); o.u = 'V'; if (k.on && e) { o.main2 = (e.r_.idc * 1000).toFixed(2) + ' mA'; if (Math.abs(e.r_.idc) > 0.025) o.warn.push(['Load too heavy for the voltage output (limit about 25 mA).', 'الحمل تقيل على خرج الجهد (الحد حوالي 25 ملي).']); } }
    else if (k.mode === 'meas_mA') { o.u = 'mA'; if (e) { o.t = (e.r_.idc * 1000).toFixed(3); o.main2 = (Math.max(0, (e.r_.idc * 1000 - 4) / 16 * 100)).toFixed(1) + ' %'; } }
    else if (k.mode === 'loop') { o.u = 'mA'; if (e) { o.t = (e.r_.idc * 1000).toFixed(3); o.main2 = 'loop 24 V'; } }
    else if (k.mode === 'sim_tx') { o.t = k.mA.toFixed(2); if (k.on && e) o.main2 = 'sink ' + (Math.abs(e.r_.idc) * 1000).toFixed(2) + ' mA'; }
    return o;
  };

  /* ---------- two-pole voltage tester ---------- */
  EL.testerRead = function (c, sim) {
    const P = I.probes;
    const o = { levels: [], ac: false, dc: false, pos: false, neg: false, v: 0, warn: [], msg: '' };
    const LV = [12, 24, 50, 120, 230, 400, 690];
    if (I.tester.self) { o.self = true; o.levels = LV.slice(0, 2); o.msg = EL.tr(['Self test OK (battery good)', 'اختبار ذاتي سليم (البطارية كويسة)']); return o; }
    if (!P.red || !P.black) { o.msg = EL.tr(['Place both probes', 'حط البروبين']); return o; }
    const v = EL.voltsBetween(c, sim, P.red, P.black);
    if (!v) return o;
    const mag = Math.max(v.ac, Math.abs(v.dc));
    o.v = mag; o.ac = v.ac > 6; o.dc = Math.abs(v.dc) > 6; o.pos = v.dc > 6; o.neg = v.dc < -6;
    o.levels = LV.filter((x) => mag >= x * 0.95);
    o.live = mag > 6;
    o.msg = o.live ? '' : EL.tr(['No voltage detected', 'مفيش جهد']);
    return o;
  };

  /* ---------- non-contact voltage pen ---------- */
  EL.ncvRead = function (c, sim) {
    const ref = I.probes.ncv, o = { det: false, msg: '' };
    if (!ref) { o.msg = EL.tr(['Tap a terminal to hold the pen next to its wire', 'اضغط على طرف عشان تقرّب القلم من السلك']); return o; }
    const v = cabs(sim.vacAt(ref)), thr = I.ncv.hi ? 20 : 90;
    const dc = Math.abs(sim.vdcAt(ref));
    o.v = v;
    o.det = v >= thr;
    if (!o.det && dc > 20) o.msg = EL.tr(['DC voltage is not detected by an NCV pen.', 'القلم مش بيكشف جهد DC.']);
    return o;
  };

  /* ---------- per-tick updates (after sim) ---------- */
  EL.instUpdate = function (c, sim, dt) {
    const d = I.dmm;
    const e = sim.e('_dmm', 'dmm');
    if (e && !d.fuseBlown) {
      const cur = Math.max(cabs(e.r_.iac), Math.abs(e.r_.idc));
      const lim = d.jack === 'A' ? 11 : 0.44;
      if (cur > lim) {
        d.fuseBlown = true; I.msg = EL.tr(['BANG! Meter fuse blown: you put the ' + (d.jack === 'A' ? '10A' : 'mA') + ' jack across a live source.', 'فرقعة! فيوز الميتر اتحرق: حطيت فتحة ' + (d.jack === 'A' ? '10A' : 'mA') + ' على مصدر شغال.']);
        EL.emit('fuse', null, I.msg);
      }
    }
    // min/max and hold on the displayed value
    const r = EL.dmmRead(c, sim);
    if (r.val != null && isFinite(r.val)) {
      if (d.minmax) { d.min = d.min == null ? r.val : Math.min(d.min, r.val); d.max = d.max == null ? r.val : Math.max(d.max, r.val); }
    }
    const k = I.clamp;
    if (I.sel === 'clamp' && I.probes.clamp && (k.dial === 'AAC' || k.dial === 'ADC')) {
      const pi = sim.iPin(I.probes.clamp), v = k.dial === 'AAC' ? cabs(pi.ac) : Math.abs(pi.dc);
      if (k.inrush || k.minmax) k.peak = Math.max(k.peak, v);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
