/* Line: top-view packaging line for medicine cartons (single lane), on a 0.5 m grid.
   circuit.line = { els: [...], carton: {L,W,H,g}, run: true }
   Elements chain by position: the exit point and heading of one element must meet the entry of the next.
   Cartons travel along the route with the speed of the element they are on, keep distance (no overlap),
   change orientation on turners and twists, are checked (guide fit, curve fit, stability, pitch at the
   checkweigher, print gap, label face), flagged for reject and removed at the reject station. */
(function (g) {
  const EL = g.EL;
  const LN = (EL.line = {});
  const E = (en, ar) => [en, ar];
  const CELL = 500;
  LN.CELL = CELL;
  const DIR = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // E S W N (screen y down)
  const ORI = ['fa', 'fl', 'edge', 'end'];
  LN.ORI = ORI;
  LN.oriName = { fa: E('flat, long side across', 'نايمة، الطول بالعرض'), fl: E('flat, long side along', 'نايمة، الطول بالطول'), edge: E('standing on its long edge', 'واقفة على جنبها الطويل'), end: E('standing on its end flap', 'واقفة على طرفها') };
  /* footprint of a carton for an orientation: along the flow, across, height */
  LN.foot = function (c, o) {
    const L = +c.L, W = +c.W, H = +c.H;
    if (o === 'fl') return { al: L, ac: W, h: H };
    if (o === 'edge') return { al: L, ac: H, h: W };
    if (o === 'end') return { al: W, ac: H, h: L };
    return { al: W, ac: L, h: H };
  };

  /* ---------- element definitions ---------- */
  const D = (LN.defs = {});
  const conv = { speed: 30, chain: 152.4, guide: 125 };
  D.SRC = { pre: 'CT', name: E('Cartoner discharge (start)', 'خروج الكارتونر (البداية)'), cells: 1, sink: false, props: { rate: 120, ori: 'fa', speed: 30 },
    info: E('Cartons come out here at the cartoner rate. Horizontal cartoners close the end flaps from the sides, so cartons leave lying flat with the long side across the flow.', 'العلب بتطلع من هنا بمعدل الكارتونر. الكارتونر الأفقي بيقفل الأطراف من الجناب، فالعلب بتطلع نايمة وطولها بالعرض على الخط.') };
  D.CONV = { pre: 'C', name: E('Flat-top chain conveyor', 'سير جنزير فلات توب'), cells: 'len', props: Object.assign({ len: 3, belt: false }, conv),
    info: E('Single-lane conveyor. Guide width = carton width across the flow + 3 to 5 mm. Chain widths 82.5, 114.3, 152.4, 190.5 mm.', 'سير بخط واحد. عرض الجايد = عرض العلبة بالعرض + 3 لـ5 مم. عرض الجنزير 82.5 أو 114.3 أو 152.4 أو 190.5 مم.') };
  D.CURVE = { pre: 'K', name: E('90° curve', 'كيرف 90 درجة'), cells: 2, curve: true, props: Object.assign({ left: true, ri: 500 }, conv),
    info: E('Changes the direction, not the carton orientation. Long cartons along the flow may not pass a tight curve.', 'بيغيّر الاتجاه بس، مش وضع العلبة. العلبة الطويلة بالطول ممكن ماتعديش من كيرف ضيق.') };
  D.BUF = { pre: 'B', name: E('Accumulation conveyor (buffer)', 'سير تجميع (بافر)'), cells: 'len', props: Object.assign({ len: 6, hl: 80, ll: 30 }, conv, { speed: 50 }),
    info: E('Holds cartons when a machine after it stops. When it is full to the high-level eye, the cartoner stops; it restarts below the low-level eye.', 'بيشيل العلب لما ماكينة بعده تقف. لما يتملى لحد حساس المستوى العالي الكارتونر بيقف، ويرجع يشتغل تحت حساس المستوى الواطي.') };
  D.GAP = { pre: 'G', name: E('Spacing belt', 'سير فتح مسافات'), cells: 1, props: { speed: 45, chain: 152.4, guide: 125, belt: true },
    info: E('Runs faster than the conveyor before it, so the gap between cartons opens.', 'بيمشي أسرع من السير اللي قبله، فالمسافة بين العلب بتزيد.') };
  D.CW = { pre: 'CW', name: E('Checkweigher', 'ميزان تشيك ويجر'), cells: 2, machine: true, props: { speed: 45, guide: 125, chain: 152.4, belt: true, pan: 300, nom: 40, tol: 2, maxcpm: 300 },
    info: E('Weighs every carton and rejects under or over weight. Only one carton may be on the weigh pan: pitch must be at least pan length + carton length.', 'بيوزن كل علبة ويرفض الناقصة أو الزايدة. لازم علبة واحدة بس على كفة الميزان: المسافة لازم تبقى أكبر من طول الكفة + طول العلبة.') };
  D.SER = { pre: 'SN', name: E('Serialization: print + camera', 'سيريالايزيشن: طباعة + كاميرا'), cells: 2, machine: true, props: { speed: 45, guide: 125, chain: 152.4, belt: true, mingap: 40, maxcpm: 300 },
    info: E('Prints the GS1 DataMatrix (GTIN, serial, lot, expiry) and reads it back. Cartons must lie flat, be stable and have a gap so the sensor sees each one.', 'بيطبع كود GS1 داتا ماتريكس (GTIN والسيريال واللوط والصلاحية) ويقراه تاني. العلبة لازم تبقى نايمة وثابتة وبينها وبين اللي قدامها مسافة عشان الحساس يشوف كل واحدة.') };
  D.TE = { pre: 'TE', name: E('Tamper-evident labeler', 'ليبلر قفل العلبة'), cells: 1, machine: true, props: { speed: 45, guide: 125, chain: 152.4, maxcpm: 300 },
    info: E('Puts seals over both end flaps from the sides. The carton must be flat with the long side across, so the flaps face the applicators.', 'بيحط ليبل على الطرفين من الجناب. العلبة لازم تبقى نايمة وطولها بالعرض عشان الأطراف تبقى قصاد اللصاقات.') };
  D.REJ = { pre: 'R', name: E('Reject station + locked bin', 'محطة رفض + صندوق مقفول'), cells: 1, machine: true, props: { speed: 45, guide: 125, chain: 152.4, bin: 200, air: true, consec: 5 },
    info: E('Blows out every flagged carton into a locked bin. A sensor confirms each reject; if the bin is full the line stops.', 'بينفخ أي علبة مرفوضة في صندوق مقفول. حساس بيتأكد من كل رفض، ولو الصندوق اتملى الخط بيقف.') };
  D.TURN = { pre: 'TU', name: E('Bump turner (90° in plane)', 'ترنر يلف العلبة 90 درجة'), cells: 1, machine: true, props: { speed: 50, guide: 125, chain: 152.4, maxcpm: 150 },
    info: E('A pin catches one corner and the carton pivots: flat-across becomes flat-along and back. Needs a flat carton with length/width ≥ 1.3.', 'بين بيمسك ركن العلبة فتلف: النايمة بالعرض تبقى نايمة بالطول والعكس. محتاج العلبة نايمة وطولها على عرضها ≥ 1.3.') };
  D.TWIST = { pre: 'TW', name: E('Twist belt (stand up / lay down)', 'سير ملفوف (يوقف / ينيّم)'), cells: 2, machine: true, props: { speed: 35, guide: 70, chain: 152.4, maxcpm: 200 },
    info: E('Turns the carton 90° about the flow axis: flat-along stands on its long edge, flat-across stands on its end (unstable). Keep it slow.', 'بيلف العلبة 90 درجة حوالين اتجاه الخط: النايمة بالطول بتقف على جنبها الطويل، والنايمة بالعرض بتقف على طرفها (مش ثابتة). خليه بطيء.') };
  D.CP = { pre: 'CP', name: E('Case packer (end)', 'كيس باكر (النهاية)'), cells: 2, sink: true, machine: true, props: { per: 96, maxcpm: 140, need: 'fl', change: 4 },
    info: E('Collates cartons into a shipper case and counts cases. It needs the cartons in the orientation it is set for.', 'بيجمّع العلب في كرتونة شحن ويعد الكراتين. محتاج العلب في الوضع اللي متظبط عليه.') };
  D.EXIT = { pre: 'X', name: E('Line exit', 'نهاية الخط'), cells: 1, sink: true, props: {},
    info: E('Counts good cartons leaving the line.', 'بيعد العلب السليمة اللي خارجة من الخط.') };
  LN.order = ['SRC', 'CONV', 'CURVE', 'GAP', 'CW', 'SER', 'TE', 'REJ', 'BUF', 'TURN', 'TWIST', 'CP', 'EXIT'];
  LN.CHAINS = [82.5, 114.3, 152.4, 190.5];

  /* ---------- geometry ---------- */
  const add = (a, b, k) => [a[0] + b[0] * (k == null ? 1 : k), a[1] + b[1] * (k == null ? 1 : k)];
  const cc = (cell) => [cell[0] * CELL + CELL / 2, cell[1] * CELL + CELL / 2];
  LN.len = (e) => (D[e.type].cells === 'len' ? Math.max(1, Math.min(24, Math.round(+e.props.len || 1))) : D[e.type].cells);
  LN.geom = function (e) {
    const d = DIR[e.d & 3], o = [e.x, e.y], n = LN.len(e);
    const lft = DIR[(e.d + 3) & 3], rgt = DIR[(e.d + 1) & 3];
    if (D[e.type].curve) {
      const side = e.props.left ? lft : rgt, nd = e.props.left ? (e.d + 3) & 3 : (e.d + 1) & 3;
      const cells = [o, add(o, d), add(o, side), add(add(o, d), side)];
      const a = add(cc(o), d, -CELL / 2), ctr = add(a, side, 750), b = add(cc(add(add(o, d), side)), side, CELL / 2);
      return { cells, a, b, din: e.d, dout: nd, curve: true, ctr, R: 750, side, len: (Math.PI / 2) * 750 };
    }
    const cells = []; for (let k = 0; k < n; k++) cells.push(add(o, d, k));
    const a = add(cc(o), d, -CELL / 2), b = add(cc(cells[cells.length - 1]), d, CELL / 2);
    return { cells, a, b, din: e.d, dout: e.d, len: n * CELL };
  };
  /* point and heading at distance s along an element */
  LN.at = function (e, G, s) {
    if (!G.curve) { const d = DIR[G.din]; return { x: G.a[0] + d[0] * s, y: G.a[1] + d[1] * s, h: G.din }; }
    const t = Math.max(0, Math.min(1, s / G.len)), d0 = DIR[G.din];
    const ang = t * Math.PI / 2;
    // start vector from centre to a, rotate towards b
    const v0 = [G.a[0] - G.ctr[0], G.a[1] - G.ctr[1]];
    const sign = e.props.left ? -1 : 1; // screen coords: left turn rotates counter-clockwise visually
    const ca = Math.cos(sign * ang), sa = Math.sin(sign * ang);
    const v = [v0[0] * ca - v0[1] * sa, v0[0] * sa + v0[1] * ca];
    void d0;
    return { x: G.ctr[0] + v[0], y: G.ctr[1] + v[1], h: G.din, ang: sign * ang };
  };

  /* ---------- model ---------- */
  LN.newLine = () => ({ els: [], carton: { L: 120, W: 60, H: 25, g: 40 }, run: true });
  LN.nextTag = function (ln, type) { const pre = D[type].pre; let n = 1; const used = new Set(ln.els.map((e) => e.tag)); while (used.has(pre + n)) n++; return pre + n; };
  LN.add = function (ln, type, x, y, d, props, tag) {
    const e = { id: 'E' + (LN._eid = (LN._eid || 0) + 1), type, x: Math.round(x), y: Math.round(y), d: (d | 0) & 3, tag: tag || LN.nextTag(ln, type), props: Object.assign(JSON.parse(JSON.stringify(D[type].props)), props || {}), st: {} };
    while (ln.els.some((o) => o.id === e.id)) e.id = 'E' + (LN._eid = LN._eid + 1);
    ln.els.push(e); LN.dirty(ln);
    return e;
  };
  /* append after the current end of the line, in its direction */
  LN.append = function (ln, type, props) {
    const r = LN.route(ln), last = r.els[r.els.length - 1];
    if (!last) return LN.add(ln, type, 1, 2, 0, props);
    const G = LN.geom(last), d = G.dout;
    const cell = [Math.floor((G.b[0] + DIR[d][0] * CELL / 2) / CELL), Math.floor((G.b[1] + DIR[d][1] * CELL / 2) / CELL)];
    return LN.add(ln, type, cell[0], cell[1], d, props);
  };
  LN.remove = function (ln, id) { ln.els = ln.els.filter((e) => e.id !== id); LN.dirty(ln); };
  LN.dirty = (ln) => { ln._r = null; };
  LN.build = function (spec) {
    const ln = LN.newLine();
    if (spec.carton) Object.assign(ln.carton, spec.carton);
    for (const [type, props] of spec.els) { if (!ln.els.length) LN.add(ln, type, spec.x || 1, spec.y || 2, spec.d || 0, props); else LN.append(ln, type, props); }
    return ln;
  };

  /* route: from the source, follow exit point + heading to the next element's entry */
  LN.route = function (ln) {
    if (ln._r) return ln._r;
    const r = { els: [], segs: [], total: 0, broken: null };
    const src = ln.els.find((e) => e.type === 'SRC');
    if (src) {
      const seen = new Set();
      let e = src;
      while (e && !seen.has(e.id)) {
        seen.add(e.id);
        const G = LN.geom(e);
        r.els.push(e); r.segs.push({ e, G, s0: r.total }); r.total += G.len;
        if (D[e.type].sink) break;
        const nx = ln.els.find((o) => !seen.has(o.id) && (() => { const g2 = LN.geom(o); return Math.abs(g2.a[0] - G.b[0]) < 1 && Math.abs(g2.a[1] - G.b[1]) < 1 && g2.din === G.dout; })());
        if (!nx) { r.broken = e; break; }
        e = nx;
      }
    }
    ln._r = r;
    return r;
  };
  LN.segAt = function (r, s) { let lo = 0, hi = r.segs.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (r.segs[m].s0 <= s) lo = m; else hi = m - 1; } return r.segs[lo]; };
  LN.pos = function (r, s) { const sg = LN.segAt(r, s); if (!sg) return null; const p = LN.at(sg.e, sg.G, s - sg.s0); p.seg = sg; return p; };

  /* ---------- static checks (before running) ---------- */
  LN.checks = function (ln) {
    const out = [], r = LN.route(ln), c = ln.carton;
    const add = (lvl, e, msg) => out.push({ lvl, id: e ? e.id : null, tag: e ? e.tag : '', msg });
    if (!ln.els.some((e) => e.type === 'SRC')) { add('warn', null, E('Add a cartoner discharge to start the line.', 'ضيف خروج الكارتونر عشان الخط يبدأ.')); return out; }
    if (r.broken) add('bad', r.broken, E('The line stops after ' + r.broken.tag + ': nothing is lined up at its exit (same cell, same direction). Use "Add at the end of the line".', 'الخط بيقف بعد ' + r.broken.tag + ': مفيش حاجة متركبة على خروجه (نفس الخانة ونفس الاتجاه). استخدم "ضيف في آخر الخط".'));
    else if (!r.els.some((e) => D[e.type].sink)) add('warn', r.els[r.els.length - 1], E('The line has no end: finish it with a case packer or an exit.', 'الخط مالوش نهاية: اختمه بكيس باكر أو نهاية خط.'));
    const src = r.els[0];
    let ori = src.props.ori, vPrev = +src.props.speed, rate = +src.props.rate;
    for (const e of r.els.slice(1)) {
      const p = e.props, f = LN.foot(c, ori);
      if (e.type === 'TURN' && +p.speed > 0) { const pitch = (+p.speed * 1000) / rate, dg = Math.hypot(f.al, f.ac); if (pitch < dg + 20) add('bad', e, E('Turner needs a gap: pitch ' + Math.round(pitch) + ' mm < carton diagonal ' + Math.round(dg) + ' + 20 mm. Put a spacing belt or speed up before it.', 'الترنر محتاج مسافة: ' + Math.round(pitch) + ' مم أقل من قطر العلبة ' + Math.round(dg) + ' + 20 مم. حط سير فتح مسافات أو سرّع قبله.')); }
      if (e.type === 'TURN') { if (ori === 'fa' || ori === 'fl') { if (Math.max(+c.L, +c.W) / Math.min(+c.L, +c.W) < 1.3) add('bad', e, E('Bump turner needs length/width ≥ 1.3; this carton is too square.', 'الترنر محتاج الطول على العرض ≥ 1.3، والعلبة دي مربعة قوي.')); ori = ori === 'fa' ? 'fl' : 'fa'; } else add('bad', e, E('A bump turner can only turn flat cartons.', 'الترنر بيلف العلب النايمة بس.')); }
      if (e.type === 'TWIST') ori = { fl: 'edge', fa: 'end', edge: 'fl', end: 'fa' }[ori];
      const f2 = LN.foot(c, ori);
      if (p.guide != null) {
        const gw = +p.guide, need = (e.type === 'TWIST' || e.type === 'TURN' ? Math.max(f.ac, f2.ac) : f2.ac);
        if (gw < need + 2) add('bad', e, E('Guides ' + gw + ' mm are too narrow for a carton ' + need + ' mm across: jam. Set ' + (need + 3) + '-' + (need + 5) + ' mm.', 'الجايد ' + gw + ' مم ضيق على علبة عرضها ' + need + ' مم: هتزنق. خليه ' + (need + 3) + '-' + (need + 5) + ' مم.'));
        else if (gw > need + 8) add('warn', e, E('Guides ' + gw + ' mm are too wide for ' + need + ' mm: the carton skews (bad print, labels, jams).', 'الجايد ' + gw + ' مم واسع على ' + need + ' مم: العلبة هتلف (طباعة وليبل وحش وزنق).'));
        if (p.chain && +p.chain < f2.ac * 0.6) add('warn', e, E('Chain ' + p.chain + ' mm is narrow for a carton ' + f2.ac + ' mm across.', 'الجنزير ' + p.chain + ' مم ضيق على علبة عرضها ' + f2.ac + ' مم.'));
      }
      if (e.type === 'CURVE') {
        const Ri = +p.ri, Gw = +p.guide;
        if (Math.sqrt((Ri + f2.ac) ** 2 + (f2.al / 2) ** 2) > Ri + Gw - 1) add('bad', e, E('Curve too tight for this carton (inner radius ' + Ri + ' mm, carton ' + f2.al + ' along): it will jam. Use a bigger radius or turn the carton first.', 'الكيرف ضيق على العلبة دي (نص قطر داخلي ' + Ri + ' مم، العلبة ' + f2.al + ' بالطول): هتزنق. كبّر النص قطر أو لف العلبة الأول.'));
      }
      const tip = f2.h / Math.min(f2.al, f2.ac);
      if (tip > 3) add('bad', e, E('A standing carton tips over here (height/base ' + tip.toFixed(1) + ').', 'العلبة الواقفة هتقع هنا (الارتفاع على القاعدة ' + tip.toFixed(1) + ').'));
      else if (tip > 2 && +p.speed > 30) add('warn', e, E('Standing carton at ' + p.speed + ' m/min: keep it ≤ 30 m/min.', 'علبة واقفة على ' + p.speed + ' متر/د: خليها ≤ 30 متر/د.'));
      if (p.speed != null && vPrev > 0) {
        const step = +p.speed / vPrev, lim = f2.h > f2.al ? 1.3 : 1.5;
        if (step > lim + 0.01) add('warn', e, E('Speed jumps ×' + step.toFixed(2) + ' from the conveyor before (limit ×' + lim + '): cartons may tip or shingle.', 'السرعة بتنط ×' + step.toFixed(2) + ' عن السير اللي قبله (الحد ×' + lim + '): العلب ممكن تقع أو تركب على بعض.'));
        const pitch = (+p.speed * 1000) / rate;
        if (pitch < f2.al + 10) add('bad', e, E('At ' + p.speed + ' m/min the pitch is ' + Math.round(pitch) + ' mm, less than the carton (' + f2.al + ' mm) + 10: this conveyor cannot carry ' + rate + ' cartons/min.', 'على ' + p.speed + ' متر/د المسافة ' + Math.round(pitch) + ' مم، أقل من العلبة (' + f2.al + ' مم) + 10: السير ده مش هيشيل ' + rate + ' علبة/د.'));
        else if (step < 0.99 && e.type !== 'BUF' && e.type !== 'TWIST') add('warn', e, E('Slower than the element before it (' + p.speed + ' < ' + vPrev + ' m/min): cartons will back up. Keep the V-curve: speed rises along the line.', 'أبطأ من اللي قبله (' + p.speed + ' < ' + vPrev + ' متر/د): العلب هتتكوم. حافظ على منحنى V: السرعة تزيد على طول الخط.'));
      }
      if (p.maxcpm != null && +p.maxcpm < rate * 1.1) add(+p.maxcpm < rate ? 'bad' : 'warn', e, E(e.tag + ' handles ' + p.maxcpm + ' cartons/min, the cartoner makes ' + rate + '. Downstream machines need 110-130 % of the cartoner rate.', e.tag + ' بيشيل ' + p.maxcpm + ' علبة/د والكارتونر بيطلع ' + rate + '. الماكينات بعد الكارتونر محتاجة 110-130% من معدله.'));
      if (e.type === 'CW') { const pitch = (+p.speed * 1000) / rate, dwell = (+p.pan - f2.al) / (+p.speed * 1000 / 60); if (pitch < +p.pan) add('bad', e, E('Pitch ' + Math.round(pitch) + ' mm < weigh pan ' + p.pan + ' mm: two cartons on the pan, false rejects. Speed up the conveyor before it.', 'المسافة ' + Math.round(pitch) + ' مم أقل من الكفة ' + p.pan + ' مم: علبتين على الكفة ورفض غلط. سرّع السير اللي قبله.')); else if (dwell < 0.15) add('warn', e, E('Only ' + Math.round(dwell * 1000) + ' ms on the pan (need ≥ 150 ms for the load cell to settle): use a longer pan or a lower speed.', 'العلبة بتقعد ' + Math.round(dwell * 1000) + ' ملي ثانية بس على الكفة (محتاج ≥ 150 عشان اللود سيل يستقر): طوّل الكفة أو قلل السرعة.')); if (ori !== 'fa' && ori !== 'fl') add('bad', e, E('A checkweigher needs a flat carton.', 'الميزان محتاج العلبة نايمة.')); }
      if (e.type === 'SER' && ori !== 'fa' && ori !== 'fl') add('bad', e, E('Serialization prints on the top panel: the carton must lie flat.', 'السيريالايزيشن بيطبع على الوش اللي فوق: العلبة لازم تبقى نايمة.'));
      if (e.type === 'TE' && ori !== 'fa') add('bad', e, E('The labeler needs the end flaps to the sides (flat, long side across).', 'الليبلر محتاج الأطراف على الجناب (نايمة وطولها بالعرض).'));
      if (e.type === 'CP' && ori !== p.need) add('bad', e, E('Case packer is set for ' + p.need + ' but cartons arrive ' + ori + '.', 'الكيس باكر متظبط على ' + p.need + ' والعلب واصلة ' + ori + '.'));
      if (p.speed != null) vPrev = +p.speed;
    }
    let cw = -1, rj = -1; r.els.forEach((e, i) => { if (e.type === 'CW' || e.type === 'SER' || e.type === 'TE') cw = i; if (e.type === 'REJ') rj = i; });
    const on = new Set(r.els.map((e) => e.id));
    for (const e of ln.els) if (!on.has(e.id) && e.type !== 'SRC') add('warn', e, E(e.tag + ' is not on the carton path: nothing reaches it.', e.tag + ' مش على مسار العلب: مفيش حاجة بتوصله.'));
    if (cw >= 0 && (rj < 0 || rj < cw)) add('bad', r.els[cw], E('No reject station after ' + r.els[cw].tag + ': a bad carton could reach the case (GMP).', 'مفيش محطة رفض بعد ' + r.els[cw].tag + ': علبة غلط ممكن توصل الكرتونة (GMP).'));
    return out;
  };

  /* ---------- simulation ---------- */
  let seed = 12345; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  LN.reset = function (ln) { ln.cartons = []; ln.stats = { made: 0, good: 0, rej: {}, cases: 0, inCase: 0, tr: [], t: 0, done: [], stops: 0 }; ln.jam = null; ln.held = false; for (const e of ln.els) e.st = {}; LN.dirty(ln); };
  function speedOf(c, e) {
    let v = +e.props.speed || 30;
    if (e.props.motor) { const m = c.parts.find((p) => p.tag === e.props.motor); v *= m && m.state ? Math.max(0, Math.abs(m.state.w || 0)) : 0; }
    return v * 1000 / 60; // mm/s
  }
  LN.step = function (c, dt) {
    const ln = c.line;
    if (!ln || !ln.els.length) return;
    if (!ln.cartons) LN.reset(ln);
    const r = LN.route(ln), S = ln.stats, car = ln.carton;
    S.t += dt;
    if (!r.els.length || !ln.run) return;
    const src = r.els[0], sp = src.props;
    // high / low level eyes on buffers
    let held = false;
    for (const sg of r.segs) if (sg.e.type === 'BUF') {
      let occ = 0; for (const k of ln.cartons) if (k.s >= sg.s0 && k.s < sg.s0 + sg.G.len) occ += LN.foot(car, k.o).al;
      const fill = occ / sg.G.len, st = sg.e.st;
      st.fill = fill;
      if (fill >= sg.e.props.hl / 100) { if (!st.held) S.stops++; st.held = true; }
      if (fill <= sg.e.props.ll / 100) st.held = false;
      held = held || !!st.held;
    }
    ln.held = held;
    for (const e of r.els) if (e.type === 'CP' && e.st.busy > 0) e.st.busy = Math.max(0, e.st.busy - dt);
    // spawn
    src.st.acc = (src.st.acc || 0) + dt * (+sp.rate / 60);
    if (src.st.acc >= 1) {
      const f = LN.foot(car, sp.ori), last = ln.cartons[ln.cartons.length - 1];
      const room = !last || last.s - LN.foot(car, last.o).al / 2 >= f.al / 2;
      if (room && !ln.held && !src.st.stop && !ln.jam) { ln.cartons.push({ id: ++S.made, s: f.al / 2, o: sp.ori, born: S.t, w: +car.g + gauss() * 0.6 + (+car.dg || 0), flag: null, skew: 0, done: {} }); src.st.acc -= 1; }
      else src.st.acc = Math.min(src.st.acc, 1.5);
    }
    // move from the front of the line backwards so each carton sees its leader's new position
    const end = r.total;
    for (let i = 0; i < ln.cartons.length; i++) {
      const k = ln.cartons[i];
      if (k.jam) continue;
      const sg = LN.segAt(r, k.s), e = sg.e;
      let v = speedOf(c, e);
      if (e.st.stop) v = 0;
      if (e.type === 'CP' && e.st.busy > 0) v = 0;
      let ns = k.s + v * dt;
      const lead = ln.cartons[i - 1];
      const fa = LN.foot(car, k.o).al;
      if (lead) { const lim = lead.s - LN.foot(car, lead.o).al / 2 - fa / 2; if (ns > lim) ns = Math.max(k.s, lim); }
      // entering a new element: apply its effect once
      const sg2 = LN.segAt(r, ns);
      if (sg2 !== sg || !k.done[sg2.e.id]) {
        if (!k.done[sg2.e.id] && ns - sg2.s0 >= Math.min(sg2.G.len / 2, 1e9)) {
          k.done[sg2.e.id] = 1;
          const res = enter(c, ln, sg2.e, k, i);
          if (res === 'jam') { k.jam = true; ln.jam = { id: sg2.e.id, tag: sg2.e.tag, msg: k.jamMsg }; ns = sg2.s0 + sg2.G.len / 2; }
          if (res === 'remove') { ln.cartons.splice(i, 1); i--; continue; }
        }
      }
      k.s = ns;
      if (k.s >= end - 1) {
        const last = r.els[r.els.length - 1];
        if (D[last.type].sink) { finish(ln, k, last); ln.cartons.splice(i, 1); i--; }
        else k.s = end - 1;
      }
    }
    // rate in the last 60 s
    S.done = S.done.filter((t) => S.t - t <= 60);
  };
  function flag(k, why) { if (!k.flag) k.flag = why; }
  function enter(c, ln, e, k, i) {
    const p = e.props, car = ln.carton, f = LN.foot(car, k.o), S = ln.stats;
    if (p.guide != null && +p.guide < f.ac + 2) { k.jamMsg = E('Carton jammed in ' + e.tag + ': guides ' + p.guide + ' mm, carton ' + f.ac + ' mm across.', 'العلبة زنقت في ' + e.tag + ': الجايد ' + p.guide + ' مم والعلبة ' + f.ac + ' مم بالعرض.'); return 'jam'; }
    if (p.guide != null && +p.guide > f.ac + 8) k.skew = 1;
    if (e.type === 'CURVE' && Math.sqrt((+p.ri + f.ac) ** 2 + (f.al / 2) ** 2) > +p.ri + +p.guide - 1) { k.jamMsg = E('Carton stuck in curve ' + e.tag + ': radius too tight for its length along the flow.', 'العلبة وقفت في الكيرف ' + e.tag + ': النص قطر ضيق على طولها.'); return 'jam'; }
    if (f.h / f.al > 3) { k.jamMsg = E('Carton tipped over in ' + e.tag + ' (standing on its end).', 'العلبة وقعت في ' + e.tag + ' (كانت واقفة على طرفها).'); return 'jam'; }
    if (e.type === 'TURN') { const lead = ln.cartons[i - 1]; if (lead && !lead.jam && lead.s - LN.foot(car, lead.o).al / 2 - (k.s + f.al / 2) < 10) { k.jamMsg = E('Cartons touching at turner ' + e.tag + ': they wedge. Put a spacing belt before it.', 'العلب لازقة في بعض عند الترنر ' + e.tag + ': بتزنق. حط سير فتح مسافات قبله.'); return 'jam'; } }
    if (e.type === 'TURN') { if (k.o === 'fa' || k.o === 'fl') k.o = k.o === 'fa' ? 'fl' : 'fa'; else { k.jamMsg = E('Standing carton jammed in turner ' + e.tag + '.', 'علبة واقفة زنقت في الترنر ' + e.tag + '.'); return 'jam'; } }
    if (e.type === 'TWIST') k.o = { fl: 'edge', fa: 'end', edge: 'fl', end: 'fa' }[k.o];
    if (e.type === 'CW') {
      const pan = +p.pan, s0 = k.s;
      const onPan = ln.cartons.filter((o) => o !== k && Math.abs(o.s - s0) < pan).length;
      if (onPan) { flag(k, 'pan'); }
      else if (Math.abs(k.w - +p.nom) > +p.tol) flag(k, 'weight');
      if (k.o !== 'fa' && k.o !== 'fl') flag(k, 'weight');
    }
    if (e.type === 'SER') {
      const lead = ln.cartons[i - 1], gap = lead ? lead.s - LN.foot(car, lead.o).al / 2 - (k.s + f.al / 2) : 1e9;
      if (k.o !== 'fa' && k.o !== 'fl') flag(k, 'print');
      else if (gap < +p.mingap) flag(k, 'print');
      else if (k.skew && rnd() < 0.3) flag(k, 'grade');
      else k.serial = 1;
    }
    if (e.type === 'TE' && k.o !== 'fa') flag(k, 'label');
    if (e.type === 'REJ' && !k.flag) e.st.run = 0;
    if (e.type === 'REJ' && k.flag) {
      if (!p.air) { ln.run = false; ln.jam = { id: e.id, tag: e.tag, msg: E('Reject not confirmed at ' + e.tag + ' (no air): the bad carton stayed on the line. Line stopped: remove it by hand and fix the air.', 'الرفض ما اتأكدش عند ' + e.tag + ' (مفيش هوا): العلبة الغلط فضلت على الخط. الخط وقف: شيلها بإيدك وصلّح الهوا.') }; k.jam = true; k.jamMsg = ln.jam.msg; return null; }
      e.st.run = (e.st.run || 0) + 1;
      if (+p.consec > 0 && e.st.run >= +p.consec) { ln.run = false; e.st.run = 0; ln.jam = { id: e.id, tag: e.tag, msg: E(p.consec + ' rejects in a row at ' + e.tag + ': line stopped. Find the cause before you restart.', p.consec + ' رفض ورا بعض عند ' + e.tag + ': الخط وقف. دوّر على السبب قبل ما تشغّل.') }; }
      e.st.bin = (e.st.bin || 0) + 1;
      S.rej[k.flag] = (S.rej[k.flag] || 0) + 1;
      if (e.st.bin >= +p.bin) { ln.run = false; ln.jam = { id: e.id, tag: e.tag, msg: E('Reject bin full: line stopped. Empty the bin.', 'صندوق الرفض اتملى: الخط وقف. فضّي الصندوق.') }; }
      return 'remove';
    }
    if (e.type === 'CP' && k.o !== p.need) { k.jamMsg = E('Wrong orientation at case packer ' + e.tag + ' (' + k.o + ', needs ' + p.need + ').', 'وضع غلط عند الكيس باكر ' + e.tag + ' (' + k.o + '، محتاج ' + p.need + ').'); return 'jam'; }
    return null;
  }
  function finish(ln, k, e) {
    const S = ln.stats;
    if (k.flag) { S.rej['escaped'] = (S.rej['escaped'] || 0) + 1; S.escaped = (S.escaped || 0) + 1; ln.run = false; ln.jam = { id: e.id, tag: e.tag, msg: E('A bad carton reached ' + e.tag + ' (' + (LN.REJ[k.flag] || [k.flag])[0] + '): GMP breach. Line stopped: quarantine the case.', 'علبة غلط وصلت ' + e.tag + ' (' + (LN.REJ[k.flag] || [k.flag, k.flag])[1] + '): مخالفة GMP. الخط وقف: اعزل الكرتونة.') }; return; }
    S.good++; S.done.push(S.t); S.tr.push(S.t - k.born); if (S.tr.length > 200) S.tr.shift();
    if (e.type === 'CP') { S.inCase++; if (S.inCase >= +e.props.per) { S.inCase = 0; S.cases++; e.st.busy = Math.max(0, +e.props.change || 0); } }
  }
  LN.clearJam = function (ln) { if (!ln.cartons) return; ln.cartons = ln.cartons.filter((k) => !k.jam); ln.jam = null; ln.run = true; for (const e of ln.els) if (e.type === 'REJ') e.st.bin = 0; };
  LN.rate = (ln) => (ln.stats ? ln.stats.done.length * (60 / Math.max(1, Math.min(60, ln.stats.t))) : 0);
  LN.transit = (ln) => (ln.stats && ln.stats.tr.length ? ln.stats.tr.reduce((a, b) => a + b, 0) / ln.stats.tr.length : 0);
  LN.REJ = { pan: E('two on the weigh pan', 'علبتين على الكفة'), weight: E('wrong weight', 'وزن غلط'), print: E('code not printed / read', 'الكود ما اتطبعش / ما اتقراش'), grade: E('bad code grade (skewed carton)', 'جودة كود وحشة (علبة ملفوفة)'), label: E('label on the wrong face', 'ليبل على وش غلط'), escaped: E('bad cartons that reached the end', 'علب غلط وصلت للآخر') };

  /* ---------- serialisation ---------- */
  const SAFE = (s, n) => String(s == null ? '' : s).replace(/[<>&"'`]/g, '').slice(0, n || 16);
  LN.sanitize = function (o) {
    const ln = LN.newLine();
    if (!o || typeof o !== 'object') return ln;
    if (o.carton) for (const k of ['L', 'W', 'H', 'g']) { const v = +o.carton[k]; if (isFinite(v) && v > 0 && v < 2000) ln.carton[k] = v; }
    ln.run = o.run !== false;
    for (const q of (Array.isArray(o.els) ? o.els : []).slice(0, 200)) {
      if (!q || !D[q.type]) continue;
      const e = { id: SAFE(q.id, 12) || 'E' + (LN._eid = (LN._eid || 0) + 1), type: q.type, x: Math.max(-200, Math.min(400, Math.round(+q.x || 0))), y: Math.max(-200, Math.min(400, Math.round(+q.y || 0))), d: (+q.d || 0) & 3, tag: SAFE(q.tag, 10) || D[q.type].pre, props: JSON.parse(JSON.stringify(D[q.type].props)), st: {} };
      const pr = q.props || {};
      for (const k of Object.keys(e.props)) if (pr[k] != null && typeof pr[k] === typeof e.props[k]) e.props[k] = typeof e.props[k] === 'string' ? SAFE(pr[k], 12) : typeof e.props[k] === 'number' ? (isFinite(pr[k]) ? pr[k] : e.props[k]) : pr[k];
      if (typeof pr.motor === 'string') e.props.motor = SAFE(pr.motor, 12);
      const n = +String(e.id).slice(1); if (n > (LN._eid || 0)) LN._eid = n;
      ln.els.push(e);
    }
    return ln;
  };
  LN.plain = (ln) => ({ carton: ln.carton, run: ln.run !== false, els: ln.els.map((e) => ({ id: e.id, type: e.type, x: e.x, y: e.y, d: e.d, tag: e.tag, props: e.props })) });
})(typeof window !== 'undefined' ? window : globalThis);
