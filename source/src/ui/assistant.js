/* Assistant: rule-based circuit checker, "why not energised", text/voice commands, missions, fault challenge */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, $ = ui.$, I = EL.inst;
  const A = (ui.assist = {});
  const ed = () => EL.bench.ed;

  /* ---------- netlist helpers ---------- */
  const FEED = { LAMP: ['X1', 'X2'], SOL: ['pos', 'neg'], CONT3: ['A1', 'A2'], RLY2: ['A1', 'A2'], RLY4: ['A1', 'A2'], TON: ['A1', 'A2'], SDT: ['A1', 'A2'], RES: ['A', 'B'], DIO: ['A', 'K'], TX: ['pos', 'neg'], PLCDI: ['I0', 'M'] };
  function pinList(p) { return EL.pinsOf(p).map((q) => q.id); }
  function contactPairs(p) {
    const ids = pinList(p).filter((x) => /^\d+$/.test(x)).map(Number), out = [];
    const has = (n) => ids.includes(n);
    for (const n of ids) {
      if (n % 2 === 1 && has(n + 1)) out.push([String(n), String(n + 1)]);
      if (n > 10 && n % 10 === 1 && has(n + 3)) out.push([String(n), String(n + 3)]);
      if (n === 15) { if (has(16)) out.push(['15', '16']); if (has(18)) out.push(['15', '18']); }
    }
    return out;
  }
  function wireNets(c) {
    const uf = new EL.UF();
    for (const w of c.wires) { if (w.cut) continue; uf.add(w.a); uf.add(w.b); uf.union(w.a, w.b); }
    return uf;
  }
  const label = (c, ref) => EL.refLabel(c, ref);
  const num = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(1));
  const vd = {};
  function vdiff(c, sim, a, b) {
    const k = a + '|' + b; if (vd[k] != null && vd.t === sim) return vd[k];
    if (vd.t !== sim) { for (const key of Object.keys(vd)) delete vd[key]; vd.t = sim; }
    let r = 0;
    try { const v = EL.voltsBetween(c, sim, a, b); r = v ? Math.max(v.ac, Math.abs(v.dc)) : 0; } catch (e) {}
    vd[k] = r; return r;
  }
  function ratedOf(p) {
    if (p.type === 'LAMP') return parseInt(p.props.volt, 10);
    if (/^(CONT3|RLY2|RLY4|TON|SDT)$/.test(p.type)) return EL.coilSpec(p).v;
    if (p.type === 'SOL') return 24;
    return 20;
  }

  /* trace from one terminal back to a live net, listing open contacts on the way */
  function traceOpen(c, sim, startRef, refOther, thr, blocked) {
    const uf = wireNets(c);
    const nets = new Map(); // net -> a representative pin
    const adj = new Map();
    const add = (n, e) => { if (!adj.has(n)) adj.set(n, []); adj.get(n).push(e); };
    const rep = (ref) => { const n = uf.find(ref); if (!nets.has(n)) nets.set(n, ref); return n; };
    for (const p of c.parts) {
      for (const q of pinList(p)) rep(p.id + '.' + q);
      for (const [a, b] of contactPairs(p)) { const na = rep(p.id + '.' + a), nb = rep(p.id + '.' + b); if (na !== nb) { add(na, { to: nb, part: p, a, b }); add(nb, { to: na, part: p, a: b, b: a }); } }
      if (p.type === 'MCB1' || p.type === 'FUSE') { /* pairs 1-2 already */ }
    }
    const s = rep(startRef);
    const prev = new Map([[s, null]]), q = [s];
    let hit = null;
    while (q.length) {
      const n = q.shift();
      if (n !== s && vdiff(c, sim, nets.get(n), refOther) >= thr) { hit = n; break; }
      for (const e of adj.get(n) || []) if (!prev.has(e.to) && !(blocked && blocked.has(e.part.id + '|' + [e.a, e.b].sort().join('/')))) { prev.set(e.to, { from: n, e }); q.push(e.to); }
    }
    if (!hit) return { found: false };
    const path = []; let n = hit;
    while (prev.get(n)) { const pv = prev.get(n); path.push(pv.e); n = pv.from; }
    path.reverse();
    const closed = (e) => sim.elems.some((x) => x.part === e.part.id && ((x.na === e.part.id + '.' + e.a && x.nb === e.part.id + '.' + e.b) || (x.na === e.part.id + '.' + e.b && x.nb === e.part.id + '.' + e.a)));
    // opens listed from the live source toward the load
    const opens = path.filter((e) => !closed(e)).reverse();
    return { found: true, opens, path, volt: vdiff(c, sim, nets.get(hit), refOther) };
  }

  const ordp = (o) => { const x = parseInt(o.a, 10), y = parseInt(o.b, 10); return (isNaN(x) || isNaN(y) ? o.a < o.b : x < y) ? o.a + '-' + o.b : o.b + '-' + o.a; };
  function earthRef(c, p) { const s = c.parts.find((x) => x.type === 'SRC3' || x.type === 'SRC1'); return s ? s.id + '.PE' : p.id + '.PE'; }
  function groupOpens(list, volt, outArr) {
    const m = new Map();
    for (const o of list) { const k = o.part.id; if (!m.has(k)) m.set(k, { part: o.part, prs: [] }); const g1 = m.get(k), t = ordp(o); if (!g1.prs.includes(t)) g1.prs.push(t); }
    for (const { part, prs } of m.values()) {
      const hn = hintFor(part, {});
      outArr.push({ l: 'warn', t: ['Open point: ' + part.tag + ' (contact' + (prs.length > 1 ? 's ' : ' ') + prs.join(', ') + ') ' + (prs.length > 1 ? 'are' : 'is') + ' open. Live voltage upstream: ' + num(volt) + ' V. ' + hn[0], 'نقطة مفتوحة: ' + part.tag + ' (كونتاكت ' + prs.join('، ') + ') مفتوح. الجهد قبله: ' + num(volt) + ' فولت. ' + hn[1]] });
    }
  }
  function routes(c, sim, start, ref, thr) {
    const blocked = new Set(), res = [];
    for (let k = 0; k < 3; k++) {
      const r = traceOpen(c, sim, start, ref, thr, blocked);
      if (!r.found || !r.opens.length) break;
      res.push(r); const o = r.opens[r.opens.length - 1]; blocked.add(o.part.id + '|' + [o.a, o.b].sort().join('/'));
    }
    return res;
  }
  function hintFor(p, e) {
    const st = p.state || {};
    if (/^(MCB1|MCB3|MPCB|ISOL3)$/.test(p.type)) {
      if (p.props.locked) return ['It is locked out (LOTO). Remove the lock first.', 'مقفول بلوتو. شيل القفل الأول.'];
      if (st.tripped) return ['It tripped (' + (st.cause || '') + '). Find the cause, then reset it and switch ON.', 'فاصل (' + (st.cause || '') + '). دوّر على السبب وبعدين رجّعه وشغله ON.'];
      if (!st.on) return ['It is OFF. Switch it ON in Test mode.', 'هو OFF. شغله ON في وضع الاختبار.'];
      if (p.fault !== 'none') return ['It is ON but a pole does not conduct: the breaker is faulty.', 'هو ON بس بول مش بيوصل: البريكر عطلان.'];
    }
    if (p.type === 'PB_NO') return ['This normally open pushbutton needs to be pressed. Hold it in Test mode.', 'الزرار NO محتاج يتضغط. اضغط عليه في وضع الاختبار.'];
    if (p.type === 'PB_NC') return ['This normally closed button should be closed at rest. Check it is not pressed or wired on its NO contact.', 'الزرار NC المفروض يكون مقفول وهو سايب. اتأكد إنه مش مضغوط ومش موصل على الـNO.'];
    if (p.type === 'ESTOP') return ['The emergency stop is pressed in. Release it.', 'زرار الطوارئ مضغوط. فكّه.'];
    if (p.type === 'OL' && e && (e.a === '97' || e.a === '98')) return ['Contact 97-98 closes only when the overload trips (it feeds the trip lamp). This is normal while the motor is healthy.', 'كونتاكت 97-98 بيقفل لما الأوفرلود يفصل بس (بيغذي لمبة العطل). ده طبيعي والموتور سليم.'];
    if (p.type === 'OL') return st.tripped ? ['The overload relay tripped. Wait to cool, then reset it (click it).', 'الأوفرلود فاصل. استنى يبرد وبعدين اعمله Reset (اضغط عليه).'] : ['An overload contact (95-96) is open or not wired in the control circuit.', 'كونتاكت الأوفرلود (95-96) مفتوح أو مش متوصل في دايرة التحكم.'];
    if (p.type === 'FUSE') return ['The fuse may be blown or removed. Test it with continuity.', 'الفيوز ممكن يكون محروق أو مش متركب. اختبره بالـcontinuity.'];
    if (/^(CONT3|RLY2|RLY4)$/.test(p.type)) return ['This contact is open because the coil is not energised (or the contact is NO). Energise the coil.', 'الكونتاكت مفتوح لأن الكويل مش شغال (أو الكونتاكت NO). شغّل الكويل.'];
    if (p.type === 'TON' || p.type === 'SDT') return ['A timer contact only changes after the preset time.', 'كونتاكت التايمر بيتغير بعد الوقت المضبوط بس.'];
    if (p.type === 'LIM' || p.type === 'PRESS') return ['A limit or pressure switch contact: click it in Test mode to operate it.', 'كونتاكت ليميت أو بريشر: اضغط عليه في وضع الاختبار عشان تفعّله.'];
    return ['This contact is open.', 'الكونتاكت مفتوح.'];
  }

  A.why = function (p) {
    const e = ed(), c = e.c, sim = c.sim, out = [];
    if (!sim) return [{ l: 'warn', t: ['Wait a moment for the simulation to run.', 'استنى لحظة لحد ما المحاكاة تشتغل.'] }];
    if (!e.mains && true) out.push({ l: 'warn', t: ['The supply switch is OFF (top bar).', 'مفتاح الكهرباء مقفول (فوق).'] });
    if (p.type === 'MOT3') return whyMotor(c, sim, p, out);
    const f = FEED[p.type];
    if (!f) {
      out.push({ l: 'ok', t: [p.tag + ': no direct supply check for this part. Use the Part tab to see the live voltage on each terminal.', p.tag + ': مفيش فحص مباشر للجهاز ده. شوف تبويب الجهاز عشان تشوف الجهد على كل طرف.'] });
      return out;
    }
    const ra = p.id + '.' + f[0], rb = p.id + '.' + f[1], rated = ratedOf(p);
    const wired = (ref) => c.wires.some((w) => w.a === ref || w.b === ref);
    const miss = [f[0], f[1]].filter((x) => !wired(p.id + '.' + x));
    if (miss.length) { out.push({ l: 'bad', t: ['Terminal ' + miss.map((x) => p.tag + ':' + x).join(', ') + ' is not wired to anything.', 'الطرف ' + miss.map((x) => p.tag + ':' + x).join(', ') + ' مش متوصل بحاجة.'] }); return out; }
    const v = vdiff(c, sim, ra, rb);
    const ok = v >= 0.8 * rated;
    if (ok) {
      out.push({ l: 'ok', t: [p.tag + ' gets ' + num(v) + ' V across its terminals (rated ' + rated + ' V). It is supplied correctly.', p.tag + ' واصله ' + num(v) + ' فولت على أطرافه (المقنن ' + rated + '). التغذية سليمة.'] });
      if (p.state && p.state.burnt) out.push({ l: 'bad', t: ['It is burnt: it received a wrong voltage earlier. Replace it and check the supply type (AC or DC) and level.', 'هو محروق: جاله جهد غلط قبل كده. غيّره واتأكد من نوع الجهد (AC أو DC) ومستواه.'] });
      else if (p.fault && p.fault !== 'none') out.push({ l: 'bad', t: ['A fault is set on this part (' + p.fault + ') even though the supply is correct.', 'فيه عطل متحط على الجهاز ده (' + p.fault + ') رغم إن التغذية سليمة.'] });
      else if (/^(CONT3|RLY2|RLY4)$/.test(p.type) && !p.state.closed) out.push({ l: 'warn', t: ['The coil is supplied but not picked: check the coil rating, AC or DC type.', 'الكويل واصله جهد بس مش بيشد: اتأكد من مقنن الكويل ونوعه AC أو DC.'] });
      else out.push({ l: 'ok', t: ['It should be working. If it does not look like it, wait: some parts need time.', 'المفروض شغال. لو شكله مش شغال استنى شوية: فيه أجهزة بتحتاج وقت.'] });
      return out;
    }
    // too high
    if (v > 1.3 * rated && v > 30) { out.push({ l: 'bad', t: [p.tag + ' gets ' + num(v) + ' V but is rated ' + rated + ' V. Too much voltage burns it.', p.tag + ' واصله ' + num(v) + ' فولت والمقنن ' + rated + '. جهد زيادة بيحرقه.'] }); return out; }
    // too low: trace upstream
    out.push({ l: 'bad', t: [p.tag + ' has only ' + num(v) + ' V across it, it needs about ' + rated + ' V.', p.tag + ' عليه ' + num(v) + ' فولت بس ومحتاج حوالي ' + rated + ' فولت.'] });
    const thr = 0.4 * rated;
    const q1 = routes(c, sim, ra, rb, thr), q2 = routes(c, sim, rb, ra, thr);
    const qs = q1.length ? q1 : q2;
    const any1 = traceOpen(c, sim, ra, rb, thr), any2 = traceOpen(c, sim, rb, ra, thr);
    if (qs.length) groupOpens([].concat(...qs.map((r) => r.opens)), qs[0].volt, out);
    else if (any1.found || any2.found) out.push({ l: 'warn', t: ['A live point is reachable through wires but no open contact explains the loss. Look for a loose or missing wire, or a part with a fault (use the multimeter along the path).', 'فيه نقطة فيها كهربا ممكن توصلها بالأسلاك بس مفيش كونتاكت مفتوح بيفسر الفقد. دوّر على سلك مفقود أو جهاز عطلان (استخدم الملتيميتر على المسار).'] });
    else out.push({ l: 'bad', t: ['No live point is connected to this part at all. Wire it to the supply (and to neutral or 0 V on the other side). If the supply is OFF, switch it on.', 'مفيش أي نقطة فيها كهربا متوصلة بالجهاز ده. وصّله بالمصدر (والنيوترال أو 0 فولت من الناحية التانية). ولو الكهرباء مفصولة شغلها.'] });
    return out;
  };
  function whyMotor(c, sim, p, out) {
    const ph = ['U1', 'V1', 'W1'].map((x) => p.id + '.' + x);
    const wired = ph.filter((r) => c.wires.some((w) => w.a === r || w.b === r)).length;
    if (wired < 3) { out.push({ l: 'bad', t: [p.tag + ': only ' + wired + ' of 3 phase terminals are wired.', p.tag + ': ' + wired + ' من 3 أطراف فاز بس متوصلين.'] }); return out; }
    const vs = [[0, 1], [1, 2], [0, 2]].map(([a, b]) => vdiff(c, sim, ph[a], ph[b]));
    const live = vs.filter((x) => x > 300).length;
    if (live === 3) {
      out.push({ l: 'ok', t: [p.tag + ' gets 3-phase voltage (' + vs.map(num).join(' / ') + ' V).', p.tag + ' واصله جهد 3 فاز (' + vs.map(num).join(' / ') + ' فولت).'] });
      const rpm = Math.abs(p.state.w) * 60 / (2 * Math.PI);
      if (p.fault !== 'none') out.push({ l: 'bad', t: ['Fault on the motor: ' + p.fault + '.', 'عطل في الموتور: ' + p.fault + '.'] });
      if (rpm < 100) out.push({ l: 'warn', t: ['Voltage is present but the motor is not turning: seized rotor, wrong winding connection or overload.', 'الجهد موجود بس الموتور مش بيلف: روتور محبوس أو توصيل ملفات غلط أو أوفرلود.'] });
      else out.push({ l: 'ok', t: ['Running at ' + Math.round(rpm) + ' rpm, ' + (p.state.amps || 0).toFixed(1) + ' A.', 'شغال على ' + Math.round(rpm) + ' لفة/د، ' + (p.state.amps || 0).toFixed(1) + ' أمبير.'] });
      return out;
    }
    out.push({ l: 'bad', t: [p.tag + ' has no full 3-phase supply (' + vs.map(num).join(' / ') + ' V between phases).', p.tag + ' مش واصله 3 فاز كاملة (' + vs.map(num).join(' / ') + ' فولت بين الفازات).'] });
    const live1 = vs.filter((x) => x > 300).length;
    if (live1 === 1 && live1 < 3) out.push({ l: 'warn', t: ['Two phases only: single phasing. One phase is cut upstream (fuse, contactor pole, breaker pole or wiring).', 'فاز واحد مقطوع: single phasing. فيه فاز مقطوع قبل الموتور (فيوز أو بول كونتاكتور أو بول بريكر أو توصيل).'] });
    // trace each dead phase terminal upstream toward a live point (reference: earth)
    const er = earthRef(c, p), all = []; let vv = 0;
    for (const r0 of ph) {
      if (vdiff(c, sim, r0, er) >= 150) continue;
      const rs = routes(c, sim, r0, er, 150);
      for (const r of rs) { all.push(...r.opens); vv = r.volt; }
    }
    groupOpens(all, vv, out);
    return out;
  };

  /* ---------- circuit review ---------- */
  A.check = function () {
    const e = ed(), c = e.c, sim = c.sim, out = [];
    const add = (l, en, ar) => out.push({ l, t: [en, ar] });
    if (!c.parts.length) { add('warn', 'The bench is empty. Add parts or load a ready circuit.', 'المعمل فاضي. ضيف أجهزة أو حمّل دايرة جاهزة.'); return out; }
    const wired = (ref) => c.wires.some((w) => (w.a === ref || w.b === ref) && !w.cut);
    const uf = wireNets(c);
    for (const p of c.parts) {
      const need = FEED[p.type] || (p.type === 'MOT3' ? ['U1', 'V1', 'W1'] : null);
      if (need) { const m = need.filter((x) => !wired(p.id + '.' + x)); if (m.length) add('bad', p.tag + ': terminal ' + m.join(', ') + ' is not connected.', p.tag + ': الطرف ' + m.join(', ') + ' مش متوصل.'); }
    }
    if (sim && sim.shorts && sim.shorts.length) {
      const tags = new Set(); for (const isl of sim.shorts) for (const x of isl.elems) { const pp = c.parts.find((q) => q.id === x.part); if (pp) tags.add(pp.tag); }
      add('bad', 'Short circuit detected near: ' + [...tags].slice(0, 8).join(', ') + '. Two live points touch each other without a load. Find the wire that bridges them.', 'فيه شورت قرب: ' + [...tags].slice(0, 8).join(', ') + '. نقطتين فيهم كهربا متوصلين ببعض من غير حمل. دوّر على السلك اللي بيوصلهم.');
    }
    // motors
    const prot = (p) => {
      const seen = new Set(), q = [p.id]; let hit = false;
      while (q.length) {
        const id = q.pop(); if (seen.has(id)) continue; seen.add(id);
        const pp = EL.partById(c, id); if (!pp) continue;
        if (id !== p.id && /^(OL|MPCB|VFD)$/.test(pp.type)) hit = true;
        for (const w of c.wires) { const [a] = w.a.split('.'), [b] = w.b.split('.'); if (a === id && !seen.has(b)) { if (/^(SRC3|SRC1|BUS)$/.test(EL.partById(c, b).type)) continue; q.push(b); } else if (b === id && !seen.has(a)) { if (/^(SRC3|SRC1|BUS)$/.test(EL.partById(c, a).type)) continue; q.push(a); } }
      }
      return hit;
    };
    for (const p of c.parts.filter((x) => x.type === 'MOT3')) {
      const fla = EL.KW_I[p.props.kw] || 0;
      if (!prot(p)) add('warn', p.tag + ' has no overload protection (thermal overload relay, motor protection breaker or drive) in its supply path.', p.tag + ' مفيش حماية أوفرلود (ثيرمال أو MPCB أو انفرتر) في مسار تغذيته.');
      if (!wired(p.id + '.PE')) add('warn', p.tag + ': the motor frame (PE) is not connected to earth.', p.tag + ': هيكل الموتور (PE) مش متوصل بالأرضي.');
      if (p.props.conn === 'star') add('warn', p.tag + ' is connected in star on 400 V (the nameplate says delta at 400 V). It will run weak and overheat under load.', p.tag + ' موصل نجمة على 400 فولت (اللوحة بتقول دلتا على 400). هيبقى ضعيف وهيسخن تحت الحمل.');
      for (const o of c.parts.filter((x) => x.type === 'OL')) if (fla && (o.props.set < 0.85 * fla || o.props.set > 1.2 * fla)) add('warn', o.tag + ' is set to ' + o.props.set + ' A but ' + p.tag + ' (' + p.props.kw + ' kW) draws ' + fla + ' A. Set it between about 0.95 and 1.1 of the nameplate current.', o.tag + ' مضبوط على ' + o.props.set + ' أمبير ولكن ' + p.tag + ' (' + p.props.kw + ' كيلو وات) بياخد ' + fla + ' أمبير. اضبطه بين 0.95 و1.1 من تيار اللوحة.');
      for (const b of c.parts.filter((x) => /^(MCB3|MCB1)$/.test(x.type))) if (fla && +b.props.rating < fla * 1.2 && b.props.curve !== 'D' && false) add('warn', b.tag + ' may trip on motor start.', b.tag + ' ممكن يفصل وقت بدء الموتور.');
    }
    // coils and lamps
    if (sim) for (const p of c.parts) {
      if (/^(CONT3|RLY2|RLY4)$/.test(p.type)) {
        const cs = EL.coilSpec(p), v = p.state.vcoil || 0;
        if (p.state.burnt) add('bad', p.tag + ' coil is burnt (it got a wrong voltage). Replace it.', 'كويل ' + p.tag + ' محروق (جاله جهد غلط). غيّره.');
        else if (v > 0.5 * cs.v && !p.state.closed) add('warn', p.tag + ' coil gets ' + num(v) + ' V but does not pick: check AC/DC type (' + (cs.ac ? 'AC' : 'DC') + ' coil).', 'كويل ' + p.tag + ' واصله ' + num(v) + ' فولت ومش بيشد: اتأكد من النوع (' + (cs.ac ? 'AC' : 'DC') + ').');
        else if (p.state.closed) add('ok', p.tag + ' is energised and closed (' + num(v) + ' V on the coil).', p.tag + ' شغال ومقفول (' + num(v) + ' فولت على الكويل).');
      }
      if (p.type === 'LAMP') {
        const r = EL.eRead(sim, p.id, 'l'), v = Math.max(r.vac, Math.abs(r.vdc)), V = parseInt(p.props.volt, 10);
        if (p.state.burnt || p.fault === 'burnt') add('bad', p.tag + ' is burnt out.', p.tag + ' محروقة.');
        else if (v > 1.3 * V) add('bad', p.tag + ' gets ' + num(v) + ' V but is rated ' + V + ' V: it will burn.', p.tag + ' واصلها ' + num(v) + ' فولت والمقنن ' + V + ': هتتحرق.');
        else if (v > 0.8 * V) add('ok', p.tag + ' is lit (' + num(v) + ' V).', p.tag + ' منورة (' + num(v) + ' فولت).');
      }
      if (p.type === 'MOT3') {
        const rpm = Math.abs(p.state.w) * 60 / (2 * Math.PI);
        if (rpm > 100) add('ok', p.tag + ' runs at ' + Math.round(rpm) + ' rpm (' + (p.state.amps || 0).toFixed(1) + ' A, ' + (p.state.dir < 0 ? 'reverse' : 'forward') + ').', p.tag + ' بيلف ' + Math.round(rpm) + ' لفة/د (' + (p.state.amps || 0).toFixed(1) + ' أمبير، ' + (p.state.dir < 0 ? 'عكسي' : 'أمامي') + ').');
      }
      if (/^(MCB1|MCB3|MPCB)$/.test(p.type) && p.state.tripped) add('warn', p.tag + ' is tripped (' + (p.state.cause || '') + ').', p.tag + ' فاصل (' + (p.state.cause || '') + ').');
      if (p.type === 'OL' && p.state.tripped) add('warn', p.tag + ' is tripped (overload).', p.tag + ' فاصل (أوفرلود).');
    }
    if (!out.some((x) => x.l === 'bad')) {
      const run = c.parts.some((p) => (p.type === 'MOT3' && Math.abs(p.state.w) > 10) || (p.type === 'LAMP' && p.state.b > 0.5));
      out.unshift(run ? { l: 'ok', t: ['No wiring errors found, and the circuit is working.', 'مفيش أخطاء توصيل، والدايرة شغالة.'] } : { l: 'ok', t: ['No wiring errors found. Nothing is running yet: switch the supply and operate the buttons in Test mode.', 'مفيش أخطاء توصيل. لسه مفيش حاجة شغالة: شغّل الكهرباء واضغط الأزرار في وضع الاختبار.'] });
    } else out.unshift({ l: 'bad', t: ['Problems found. Fix the red items first.', 'فيه مشاكل. صلّح الأحمر الأول.'] });
    return out;
  };

  /* ---------- chat UI ---------- */
  let log, input, mic, recog = null;
  function say(items, who) {
    const wrap = h('div', { class: 'msgs', style: { marginBottom: '6px' } });
    if (who === 'me') wrap.appendChild(h('div', { class: 'msg me', text: items }));
    else for (const it of Array.isArray(items) ? items : [items]) {
      if (typeof it === 'string') wrap.appendChild(h('div', { class: 'msg', text: it }));
      else wrap.appendChild(h('div', { class: 'msg ' + (it.l || ''), text: (it.l === 'ok' ? '✔ ' : it.l === 'bad' ? '✖ ' : it.l === 'warn' ? '! ' : '') + T(it.t) }));
    }
    log.appendChild(wrap); log.scrollTop = log.scrollHeight;
  }
  A.explain = function (p) { B(); say([{ l: '', t: ['Why is ' + p.tag + ' not energised?', 'ليه ' + p.tag + ' مش شغال؟'] }], 'me'); say(A.why(p)); EL.bench.openPane('assist'); };
  const B = () => {};

  /* ---------- part synonyms and commands ---------- */
  const SYN = {
    SRC3: '3 phase|three phase|3-phase|supply|mains|مصدر|كهربا|3 فاز|ثلاث فاز', SRC1: 'single phase|1 phase|1-phase|فاز واحد|230 supply', DC24: 'dc supply|battery|dc source|بطارية|مصدر dc|دي سي', PSU: 'psu|power supply|باور سبلاي|باور', TRAFO: 'transformer|trafo|ترانس|محول',
    MCB1: 'mcb|breaker|circuit breaker|ميني بريكر|بريكر|قاطع|فاصل', MCB3: 'mcb 3|3 pole breaker|3p breaker|بريكر 3|بريكر ثلاثي|بريكر 3 فاز', MPCB: 'mpcb|motor protection|gv2|حماية موتور|بريكر موتور', ISOL3: 'isolator|disconnect switch|سويتش عزل|ايزولاتور|عزل', FUSE: 'fuse|فيوز', BUS: 'bus bar|busbar|terminal bar|neutral bar|بار|نيوترال بار',
    VFD: 'vfd|inverter|drive|انفرتر|درايف|فريكونسي', PB_NO: 'start button|push button|pushbutton|button|start|زرار|ضاغط|ستارت|زر تشغيل', PB_NC: 'stop button|stop|nc button|ستوب|زرار ستوب|زر ايقاف|زر إيقاف', ESTOP: 'emergency|e-stop|estop|طوارئ|ايمرجنسي', SEL2: 'selector|selector switch|سلكتور|مفتاح اختيار', HOA: 'hoa|hand off auto', LIM: 'limit switch|limit|ليميت', PRESS: 'pressure switch|بريشر',
    CONT3: 'contactor|كونتاكتور|ملامس', RLY2: 'relay|ريلاي|ريلي|ريليه', RLY4: 'relay 4|4 pole relay|ريلاي 4', TON: 'timer|on delay|تايمر', SDT: 'star delta timer|star-delta timer|تايمر ستار دلتا', OL: 'overload|thermal|اوفرلود|أوفرلود|ثيرمال|حراري',
    MOT3: 'motor|موتور|محرك', LAMP: 'lamp|light|indicator|pilot|لمبة|لمبه|بيان|لمبات', SOL: 'solenoid|valve|سولينويد|فالف|صمام|solenoid valve', RES: 'resistor|resistance|مقاومة', DIO: 'diode|led|دايود|ليد', POT: 'potentiometer|pot|بوتنشيومتر', TX: 'transmitter|ترانسميتر|4-20 transmitter|حساس 4-20', AI250: '250 ohm|250 resistor', PROX: 'proximity|sensor|proxy|سنسور|بروكسيميتي|حساس', PLCDI: 'plc|plc input|مدخل plc|مدخل',
  };
  const TPLK = { dol: 'dol|direct on line|direct|مباشر|ستارت ستوب|start stop|start-stop', stardelta: 'star delta|star-delta|stardelta|نجمة|ستار دلتا|ستار-دلتا', fwdrev: 'forward reverse|forward-reverse|reversing|عكس|ذهاب وعودة|ريفيرس', vfd: 'vfd|inverter|drive|انفرتر', loop: '4-20|4 20|loop|لوب|ترانسميتر', valves: 'valve|solenoid|فالف|سولينويد|صمامات', sensor: 'sensor|proximity|plc input|سنسور|حساس', basic: 'basic|simple|lamp|أساسية|اساسية|بسيطة|لمبة', psu: 'psu|power supply|باور|24v control|تحكم 24' };
  const AR = '٠١٢٣٤٥٦٧٨٩';
  const norm = (s) => s.replace(/[٠-٩]/g, (d) => AR.indexOf(d)).replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase();
  function bestPart(txt) {
    const t = norm(txt); let best = null, bs = 0;
    for (const [type, syn] of Object.entries(SYN)) for (const a of syn.split('|')) { const al = norm(a); if (t.includes(al) && al.length > bs) { bs = al.length; best = type; } }
    if (!best) for (const [type, d] of Object.entries(EL.defs)) { const nm = norm(d.name[0]); if (t.includes(nm)) { best = type; break; } }
    return best;
  }
  function bestTpl(txt) { const t = norm(txt); let best = null, bs = 0; for (const [id, syn] of Object.entries(TPLK)) for (const a of syn.split('|')) { const al = norm(a); if (t.includes(al) && al.length > bs) { bs = al.length; best = id; } } return best; }
  function findTag(txt) { const m = String(txt).toUpperCase().match(/\b([A-Z]{1,3}\d{1,2})\b/g) || []; const c = ed().c; return m.filter((x) => EL.partByTag(c, x)); }
  function endpoint(txt) {
    const c = ed().c, s = String(txt).toUpperCase().replace(/[:\-]/g, '.').replace(/\s+(PIN|TERMINAL|الطرف|طرف)\s*/g, '.').trim();
    let m = s.match(/([A-Z]{1,3}\d{1,2})[\s.]+([A-Z0-9]{1,3})/);
    if (m) { const p = EL.partByTag(c, m[1]); if (p) { const pin = EL.pinsOf(p).find((q) => q.id.toUpperCase() === m[2] || String(q.label).toUpperCase() === m[2]); if (pin) return { part: p, pin: pin.id }; return { part: p, bad: m[2] }; } }
    m = s.match(/([A-Z]{1,3}\d{1,2})/); if (m) { const p = EL.partByTag(c, m[1]); if (p) return { part: p }; }
    return null;
  }
  const ACT = { add: 'add|put|place|insert|drop|ضيف|حط|هات|ركب|زود|اضف|اضيف', del: 'delete|remove|erase|امسح|احذف|شيل|ازل', conn: 'connect|wire|link|join|وصل|اربط|وصّل|وصله', press: 'press|push|click|operate|اضغط|دوس|اضغظ', on: 'switch on|turn on|power on|close|شغل|اقفل|شغّل|فعل', off: 'switch off|turn off|power off|open|افصل|اطفي|اطفى|وقف|اقفل المفتاح', clear: 'clear all|clear|reset|new circuit|امسح الكل|ابدا من جديد|جديد|نضف', check: 'check|review|verify|inspect|test my|افحص|راجع|شوف الدايره|صح ولا غلط|تمام|اتاكد|فحص', why: 'why|not working|not energi|مش شغال|ليه|مش بيشتغل|مش بتشتغل|مش منور', build: 'build|draw|make|create|show me|load|open|ارسم|اعمل|ابني|ركب لي|افتح|حمل|اعرض|هات لي', inst: 'use|take|pick|select|خد|استخدم|اختار', meas: 'measure|read|قيس|قياس|اقيس', help: 'help|what can|مساعده|ايه اللي|تعمل ايه' };
  const has = (t, k) => ACT[k].split('|').some((a) => t.includes(norm(a)));

  A.run = function (txt) {
    txt = (txt || '').trim(); if (!txt) return;
    say(txt, 'me');
    const e = ed(), c = e.c, t = norm(txt);
    const tags = findTag(txt);
    try {
      // clear
      if (has(t, 'clear') && !has(t, 'check') && !/\w\d/.test(t.replace(/clear/, ''))) { EL.bench.clearAll(); say([{ l: 'ok', t: ['Bench cleared.', 'المعمل اتمسح.'] }]); return; }
      // why / not working
      if (has(t, 'why')) {
        const p = tags.length ? EL.partByTag(c, tags[0]) : e.part();
        if (p) { say(A.why(p)); return; }
        say([{ l: 'warn', t: ['Tell me which part, for example: why KM1 is not working.', 'قولي أنهي جهاز، مثلًا: ليه KM1 مش شغال.'] }]); return;
      }
      if (has(t, 'check') && !has(t, 'build')) { say(A.check()); return; }
      // measure between
      if (has(t, 'meas') && tags.length >= 1) {
        const m = txt.match(/([A-Za-z]{1,3}\d{1,2}[\s.:]+[A-Za-z0-9]{1,3}).*?(?:and|to|between|بين|و|مع|على|ل)\s*([A-Za-z]{1,3}\d{1,2}[\s.:]+[A-Za-z0-9]{1,3})/i);
        if (m) {
          const a = endpoint(m[1]), b = endpoint(m[2]);
          if (a && a.pin && b && b.pin) {
            const d = I.dmm; I.sel = 'dmm'; d.jack = 'V';
            d.dial = /ohm|resist|مقاومه|اوم/.test(t) ? 'OHM' : /contin|توصيل/.test(t) ? 'CONT' : /dc|مستمر|24/.test(t) ? 'VDC' : 'VAC';
            I.probes.red = a.part.id + '.' + a.pin; I.probes.black = b.part.id + '.' + b.pin; EL.bench.setMode('test'); ui.inst.render(); EL.bench.openPane('meters');
            setTimeout(() => { const o = EL.dmmRead(c, c.sim); say([{ l: 'ok', t: ['Multimeter (' + d.dial + ') between ' + a.part.tag + ':' + a.pin + ' and ' + b.part.tag + ':' + b.pin + ': ' + o.t + ' ' + o.u, 'ملتيميتر (' + d.dial + ') بين ' + a.part.tag + ':' + a.pin + ' و ' + b.part.tag + ':' + b.pin + ': ' + o.t + ' ' + o.u] }].concat((o.warn || []).map((w) => ({ l: 'warn', t: w })))); }, 400);
            return;
          }
        }
      }
      // instrument choice
      for (const [id, nm, syn] of EL.instList) { if ((has(t, 'inst') || has(t, 'meas')) && syn.split(' ').some((w) => w.length > 2 && t.includes(norm(w)))) { ui.inst.choose(id); EL.bench.openPane('meters'); say([{ l: 'ok', t: [T(nm) + ' is ready on the Meters tab. Tap terminals on the circuit to place the probes. Try Learn mode to see what each button does.', T(nm) + ' جاهز في تبويب الأجهزة. اضغط على الأطراف في الدايرة عشان تحط البروبات. جرّب وضع التعلم عشان تشوف كل زرار بيعمل إيه.'] }]); return; } }
      // connect
      if (has(t, 'conn')) {
        const sp = txt.split(/\s+(?:to|with|and|ب|مع|الى|إلى|لـ)\s+|\s+و\s+/i);
        if (sp.length >= 2) {
          const a = endpoint(sp[0]), b = endpoint(sp.slice(1).join(' '));
          if (a && b) {
            if (!a.pin || !b.pin) { const x = !a.pin ? a : b; say([{ l: 'warn', t: [(x.bad ? 'Pin "' + x.bad + '" does not exist on ' + x.part.tag + '. ' : 'Which terminal of ' + x.part.tag + '? ') + 'Available: ' + EL.pinsOf(x.part).map((q) => q.id).join(', '), (x.bad ? 'الطرف "' + x.bad + '" مش موجود على ' + x.part.tag + '. ' : 'أنهي طرف من ' + x.part.tag + '؟ ') + 'المتاح: ' + EL.pinsOf(x.part).map((q) => q.id).join(', ')] }]); return; }
            const w = e.connect(a.part.id + '.' + a.pin, b.part.id + '.' + b.pin);
            if (w) say([{ l: 'ok', t: ['Connected ' + a.part.tag + ':' + a.pin + ' to ' + b.part.tag + ':' + b.pin + '.', 'وصّلت ' + a.part.tag + ':' + a.pin + ' بـ ' + b.part.tag + ':' + b.pin + '.'] }]);
            return;
          }
        }
        say([{ l: 'warn', t: ['Say it like: connect KM1 A1 to G1 N (part tag, then terminal).', 'قولها كده: وصل KM1 A1 بـ G1 N (اسم الجهاز وبعده الطرف).'] }]); return;
      }
      // delete
      if (has(t, 'del') && tags.length) { for (const tg of tags) { const p = EL.partByTag(c, tg); e.select(p.id); e.delSel(); } say([{ l: 'ok', t: ['Removed ' + tags.join(', ') + '.', 'شلت ' + tags.join(', ') + '.'] }]); return; }
      // press / switch
      if ((has(t, 'press') || has(t, 'on') || has(t, 'off')) && tags.length) {
        EL.bench.setMode('test');
        for (const tg of tags) {
          const p = EL.partByTag(c, tg), d = EL.defs[p.type];
          if (!d.press) { say([{ l: 'warn', t: [tg + ' cannot be operated by hand.', tg + ' مينفعش يتشغل بالإيد.'] }]); continue; }
          const wantOn = has(t, 'on') || has(t, 'press'), wantOff = has(t, 'off') && !has(t, 'on');
          const isOn = !!(p.state.on || p.state.act);
          if (/^(MCB1|MCB3|MPCB|ISOL3)$/.test(p.type) && ((wantOff && !isOn) || (wantOn && isOn && !p.state.tripped))) { say([{ l: 'ok', t: [tg + (isOn ? ' is already ON.' : ' is already OFF.'), tg + (isOn ? ' شغال بالفعل.' : ' مفصول بالفعل.')] }]); continue; }
          const r = d.press(p, { type: 'down', lx: 20, ly: 20 });
          if (/^PB|ESTOP|LIM|PRESS/.test(p.type) && p.type !== 'ESTOP') setTimeout(() => d.press(p, { type: 'up' }), 400);
          say([{ l: r && r.msg ? 'warn' : 'ok', t: r && r.msg ? r.msg : ['Operated ' + tg + '.', 'شغّلت ' + tg + '.'] }]);
        }
        return;
      }
      // build / template
      const tp = bestTpl(txt);
      if (tp && (has(t, 'build') || /دايره|circuit|starter|مشغل/.test(t)) && !has(t, 'add')) { EL.bench.loadTemplate(tp); say([{ l: 'ok', t: ['Loaded: ' + T(EL.templates[tp].name) + '. ' + T(EL.templates[tp].desc), 'حمّلت: ' + T(EL.templates[tp].name) + '. ' + T(EL.templates[tp].desc)] }]); return; }
      // add
      if (has(t, 'add') || has(t, 'build')) {
        const type = bestPart(txt);
        if (type) {
          const n = Math.min(8, +(t.match(/(\d+)\s*(?:x|pcs)?\s/) || [0, 1])[1] || 1);
          EL.bench.setMode('build');
          let last = null; for (let i = 0; i < n; i++) last = e.addPart(type);
          say([{ l: 'ok', t: ['Added ' + n + ' x ' + T(EL.defs[type].name) + (n === 1 ? ' (' + last.tag + ')' : '') + '. Drag to place, tap two terminals to wire.', 'ضفت ' + n + ' × ' + T(EL.defs[type].name) + (n === 1 ? ' (' + last.tag + ')' : '') + '. اسحبه تحطه ومسك طرفين توصلهم.'] }]); return;
        }
      }
      if (has(t, 'help')) { help(); return; }
      say([{ l: 'warn', t: ['I did not understand. Try: "add contactor", "load star delta", "connect KM1 A1 to G1 N", "press SB2", "why KM1 is not working", "check my circuit", "use megger".', 'مافهمتش. جرّب: "ضيف كونتاكتور" أو "افتح دايرة ستار دلتا" أو "وصل KM1 A1 بـ G1 N" أو "اضغط SB2" أو "ليه KM1 مش شغال" أو "افحص الدايرة" أو "استخدم الميجر".'] }]);
    } catch (er) { console.error(er); say([{ l: 'bad', t: ['Something went wrong: ' + er.message, 'حصل خطأ: ' + er.message] }]); }
  };
  function help() {
    say([{ l: '', t: ['I can: add parts, load ready circuits, connect two terminals, press buttons, switch breakers, pick an instrument, measure between two terminals, explain why a part is not working, and review the circuit. This is a rule-based helper that knows the lab\'s own simulation, not a general AI.', 'أقدر: أضيف أجهزة، وأحمّل دوائر جاهزة، وأوصّل طرفين، وأضغط أزرار، وأشغل بريكرات، وأختار جهاز قياس، وأقيس بين طرفين، وأقولك ليه جهاز مش شغال، وأراجع الدايرة. ده مساعد بقواعد جوه المعمل نفسه، مش ذكاء اصطناعي عام.'] }]);
  }

  /* ---------- missions ---------- */
  const MIS = [
    { id: 'lamp', t: ['Light a pilot lamp', 'نوّر لمبة بيان'], d: ['Connect a supply to a lamp so it lights (230 V lamp on 230 V, or a 24 V lamp on a 24 V source).', 'وصّل مصدر بلمبة عشان تنور (لمبة 230 على 230، أو 24 على 24).'], ok: (c) => c.parts.some((p) => p.type === 'LAMP' && p.state.b > 0.6) },
    { id: 'run', t: ['Run a motor', 'شغّل موتور'], d: ['Make a motor turn above 1000 rpm using a contactor (build it or load the DOL circuit).', 'خلي موتور يلف فوق 1000 لفة باستخدام كونتاكتور (ابنيه أو حمّل دايرة DOL).'], ok: (c) => c.parts.some((p) => p.type === 'MOT3' && Math.abs(p.state.w) * 60 / 6.2832 > 1000) && c.parts.some((p) => p.type === 'CONT3') },
    { id: 'v24', t: ['Measure 24 V DC', 'قيس 24 فولت DC'], d: ['With the multimeter on V⎓, read between 23 and 25 V on a 24 V source.', 'بالملتيميتر على V⎓ اقرا بين 23 و25 فولت على مصدر 24 فولت.'], ok: (c, sim) => { if (I.sel !== 'dmm' || I.dmm.dial !== 'VDC' || !I.probes.red || !I.probes.black) return false; const o = EL.dmmRead(c, sim); return o.val != null && o.val > 23 && o.val < 25; } },
    { id: 'inrush', t: ['Catch the motor inrush', 'امسك تيار بدء الموتور'], d: ['Use the clamp meter in INRUSH mode on a motor phase and start the motor. Peak above 15 A.', 'استخدم الكلامب على INRUSH على فاز موتور وشغّل الموتور. القيمة العليا فوق 15 أمبير.'], ok: () => I.clamp.inrush && I.clamp.peak > 15 },
    { id: 'meg', t: ['Insulation test a motor', 'اختبر عزل موتور'], d: ['Supply OFF, megger leads on a motor winding and PE, hold TEST. Get a reading above 10 MΩ.', 'الكهرباء مفصولة، ليدات الميجر على ملف موتور والـPE، اضغط TEST. اوصل لقراءة فوق 10 ميجا.'], ok: () => I.meg.result != null && I.meg.result > 1e7 },
    { id: 'ma', t: ['Source 12 mA into a loop', 'ابعت 12 ملي في لوب'], d: ['With the calibrator in Source mA, send 12 mA into a load so that 12 mA actually flows.', 'بالكاليبريتور على Source mA ابعت 12 ملي في حمل بحيث التيار الفعلي يبقى 12 ملي.'], ok: (c, sim) => { if (!(I.sel === 'cal' && I.cal.on && I.cal.mode === 'src_mA' && I.cal.mA > 11.9 && I.cal.mA < 12.1)) return false; const e = sim.e('_cal', 'cal'); return !!e && Math.abs(e.r_.idc * 1000 - I.cal.mA) < 0.1; } },
    { id: 'trip', t: ['Trip an overload', 'خلّي أوفرلود يفصل'], d: ['Make a thermal overload or a breaker trip (for example by setting the overload too low).', 'خلّي ثيرمال أو بريكر يفصل (مثلًا بتظبيط الأوفرلود واطي).'], ok: (c) => c.parts.some((p) => (p.type === 'OL' || /^(MCB1|MCB3|MPCB)$/.test(p.type)) && p.state.tripped) },
  ];
  const done = new Set(); try { (JSON.parse(localStorage.getItem('ellab.missions') || '[]')).forEach((x) => done.add(x)); } catch (e) {}
  A.tick = function (sim) {
    const c = ed().c; let ch = false;
    for (const m of MIS) if (!done.has(m.id)) { let r = false; try { r = m.ok(c, sim); } catch (e) {} if (r) { done.add(m.id); ch = true; ui.toast(T(['Mission done: ', 'خلّصت مهمة: ']) + T(m.t), 'ok', 5000); } }
    if (ch) { try { localStorage.setItem('ellab.missions', JSON.stringify([...done])); } catch (e) {} renderMissions(); }
  };
  let misEl, chEl, logEl;
  function renderMissions() {
    if (!misEl) return; misEl.innerHTML = '';
    for (const m of MIS) misEl.appendChild(h('div', { class: 'kv' }, h('span', {}, h('b', { text: (done.has(m.id) ? '✔ ' : '○ ') + T(m.t) }), h('div', { class: 'mute', style: { fontSize: '12px' }, text: T(m.d) }))));
  }

  /* ---------- fault challenge ---------- */
  let chal = null;
  A.inject = function () {
    const c = ed().c;
    const cands = c.parts.filter((p) => /^(MOT3|LAMP|CONT3|RLY2|SOL|FUSE|OL|MCB3|MCB1|PB_NO|PB_NC|TX|PSU)$/.test(p.type) && EL.defs[p.type].faults && EL.defs[p.type].faults.length > 1);
    if (!cands.length) { ui.toast(['Load a circuit first.', 'حمّل دايرة الأول.'], 'warn'); return; }
    for (const p of c.parts) if (p.hid) { p.fault = 'none'; p.hid = false; }
    const p = cands[Math.floor(Math.random() * cands.length)], fs = EL.defs[p.type].faults.filter((f) => f[0] !== 'none'), f = fs[Math.floor(Math.random() * fs.length)];
    p.fault = f[0]; p.hid = true; chal = { id: p.id, fault: f[0] };
    ed().touch(); renderChal(); EL.bench.inspector(ed());
    ui.toast(['A hidden fault was injected. Find it.', 'اتحط عطل مخفي. دوّر عليه.'], 'warn', 4000);
  };
  function renderChal() {
    if (!chEl) return; chEl.innerHTML = '';
    chEl.appendChild(h('div', { class: 'row wrap' }, h('button', { class: 'btn pri', onclick: A.inject, text: T(['Inject a hidden fault', 'حط عطل مخفي']) })));
    if (!chal) { chEl.appendChild(h('p', { class: 'mute', text: T(['A random part gets a hidden fault. Use the meters to find which part and what fault, then answer here.', 'جهاز عشوائي بياخد عطل مخفي. استخدم الأجهزة تلاقي أنهي جهاز وإيه العطل وبعدين جاوب هنا.']) })); return; }
    const c = ed().c, parts = c.parts.filter((p) => EL.defs[p.type].faults && EL.defs[p.type].faults.length > 1);
    const ps = h('select', {}, parts.map((p) => h('option', { value: p.id, text: p.tag + ' - ' + T(EL.defs[p.type].name) })));
    const fs = h('select', {});
    const fill = () => { fs.innerHTML = ''; const p = EL.partById(c, ps.value); if (p) EL.defs[p.type].faults.filter((f) => f[0] !== 'none').forEach((f) => fs.appendChild(h('option', { value: f[0], text: T(f[1]) }))); };
    ps.addEventListener('change', fill); fill();
    chEl.appendChild(h('label', { class: 'f', text: T(['Which part?', 'أنهي جهاز؟']) })); chEl.appendChild(ps);
    chEl.appendChild(h('label', { class: 'f', text: T(['What fault?', 'إيه العطل؟']) })); chEl.appendChild(fs);
    const res = h('div', { style: { marginTop: '6px' } });
    chEl.appendChild(h('div', { class: 'row wrap', style: { marginTop: '8px' } },
      h('button', { class: 'btn ok', onclick: () => { const okP = ps.value === chal.id, okF = fs.value === chal.fault; res.className = 'msg ' + (okP && okF ? 'ok' : okP ? 'warn' : 'bad'); res.textContent = okP && okF ? T(['Correct! Part and fault are right.', 'صح! الجهاز والعطل صح.']) : okP ? T(['Right part, wrong fault type.', 'الجهاز صح بس نوع العطل غلط.']) : T(['Not that part. Keep measuring.', 'مش الجهاز ده. كمّل قياس.']); }, text: T(['Check my answer', 'اتأكد من إجابتي']) }),
      h('button', { class: 'btn', onclick: () => { const p = EL.partById(c, chal.id); res.className = 'msg'; res.textContent = p.tag + ': ' + T(EL.defs[p.type].faults.find((f) => f[0] === chal.fault)[1]); ed().showHidden = true; ed().touch(); }, text: T(['Show the answer', 'وريني الإجابة']) }),
      h('button', { class: 'btn', onclick: () => { const p = EL.partById(c, chal.id); if (p) { p.fault = 'none'; p.hid = false; } chal = null; ed().showHidden = false; ed().touch(); renderChal(); EL.bench.inspector(ed()); }, text: T(['Remove the fault', 'شيل العطل']) })));
    chEl.appendChild(res);
  }
  A.init = function () {
    const root = $('#pane-assist'); root.innerHTML = '';
    log = h('div', { style: { maxHeight: '38vh', overflow: 'auto', marginBottom: '8px' } });
    input = h('input', { type: 'text', placeholder: T(['Type or speak a command...', 'اكتب أو قول أمر...']), onkeydown: (e) => { if (e.key === 'Enter') { const v = input.value; input.value = ''; A.run(v); } } });
    const SR = g.SpeechRecognition || g.webkitSpeechRecognition;
    mic = h('button', { class: 'btn', title: T(['Voice', 'صوت']), text: '🎤', onclick: () => {
      if (!SR) { ui.toast(['Voice input is not supported in this browser. Use the keyboard microphone key on your phone, or type.', 'الإدخال الصوتي مش مدعوم في المتصفح ده. استخدم زرار المايك في كيبورد التليفون أو اكتب.'], 'warn', 6000); return; }
      if (recog) { recog.stop(); return; }
      recog = new SR(); recog.lang = EL.langInfo().sp; recog.interimResults = false; recog.maxAlternatives = 1;
      recog.onresult = (ev) => { const tx = ev.results[0][0].transcript; input.value = ''; A.run(tx); };
      recog.onend = () => { recog = null; mic.classList.remove('on'); }; recog.onerror = (ev) => { recog = null; mic.classList.remove('on'); ui.toast(['Voice error: ' + ev.error, 'خطأ في الصوت: ' + ev.error], 'warn'); };
      try { recog.start(); mic.classList.add('on'); } catch (e) { recog = null; }
    } });
    const chips = h('div', { class: 'row wrap', style: { margin: '6px 0' } });
    const mk = (en, ar, cmd) => chips.appendChild(h('button', { class: 'btn sm', onclick: () => A.run(cmd[EL.lang === 'ar' ? 1 : 0]), text: T([en, ar]) }));
    mk('Check my circuit', 'افحص دايرتي', ['check my circuit', 'افحص الدايرة']); mk('DOL starter', 'ستارت ستوب', ['build dol starter', 'ارسم دايرة ستارت ستوب']); mk('Star delta', 'ستار دلتا', ['build star delta', 'ارسم ستار دلتا']); mk('Add contactor', 'ضيف كونتاكتور', ['add contactor', 'ضيف كونتاكتور']); mk('Help', 'مساعدة', ['help', 'مساعدة']);
    misEl = h('div'); chEl = h('div'); logEl = h('div');
    root.append(h('h3', { text: T(['Assistant', 'المساعد']) }), log, h('div', { class: 'row' }, input, mic), chips,
      h('details', { open: true }, h('summary', { style: { cursor: 'pointer', fontWeight: '700', margin: '10px 0' }, text: T(['Missions', 'مهام']) }), misEl),
      h('details', {}, h('summary', { style: { cursor: 'pointer', fontWeight: '700', margin: '10px 0' }, text: T(['Fault finding practice', 'تدريب على إيجاد الأعطال']) }), chEl),
      h('details', {}, h('summary', { style: { cursor: 'pointer', fontWeight: '700', margin: '10px 0' }, text: T(['Event log', 'سجل الأحداث']) }), logEl));
    ui.onLog = () => { logEl.innerHTML = ''; ui.logs.slice(-25).reverse().forEach((l) => logEl.appendChild(h('div', { class: 'kv' }, h('span', { text: l.m })))); };
    renderMissions(); renderChal();
    say([{ l: '', t: ['Hi. Ask me to build a circuit, check it, or explain why something is not working. Voice works on browsers that support it.', 'أهلًا. اطلب مني أبني دايرة أو أفحصها أو أشرح ليه حاجة مش شغالة. الصوت بيشتغل على المتصفحات اللي بتدعمه.'] }]);
    ui.onRefresh(() => { input.placeholder = T(['Type or speak a command...', 'اكتب أو قول أمر...']); renderMissions(); renderChal(); });
  };
})(typeof window !== 'undefined' ? window : globalThis);
