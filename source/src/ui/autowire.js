/* Create panel parts already wired, from the Plant links and the Ladder view:
   a DOL motor starter for a pump, a float / switch / transmitter on the next free PLC terminal,
   a solenoid on a free PLC output, and a "PLC kit" (MCB + 24 V supply + relay PLC). */
(function (g) {
  const EL = g.EL, ui = EL.ui, T = ui.T;
  const AW = (ui.autowire = {});
  const B = () => EL.bench;
  const C = () => B().ed.c;
  const ref = (p, pin) => p.id + '.' + pin;
  const W = (c, a, b) => EL.addWire(c, a, b);
  const wired = (c, p, pin) => c.wires.some((w) => w.a === ref(p, pin) || w.b === ref(p, pin));
  function spot(c, w) {
    let x = 40;
    for (const p of c.parts) { const d = EL.defs[p.type]; x = Math.max(x, p.x + (d.w || 100) + 80); }
    return { x, y: 20 };
  }
  function source(c, at) { return c.parts.find((p) => p.type === 'SRC3') || EL.addPart(c, 'SRC3', at.x, at.y); }
  const plcOf = (c) => c.parts.find((p) => p.type === 'PLC24R' || p.type === 'PLC24');
  function freeIn(c, plc) { for (let i = 0; i < 8; i++) if (!wired(c, plc, 'I' + i)) return i; return -1; }
  function freeAI(c, plc) { for (let i = 0; i < 2; i++) if (!wired(c, plc, 'AI' + i)) return i; return -1; }
  function freeQ(c, plc) { const rel = plc.type === 'PLC24R', n = rel ? 4 : 6; for (let i = 0; i < n; i++) if (!wired(c, plc, 'Q' + i)) return i; return -1; }
  function setSym(plc, addr, name) {
    if (!plc || !name) return;
    let o = null; try { o = plc.props.lad ? JSON.parse(plc.props.lad) : null; } catch (e) { o = null; }
    if (!o) return;
    o.sym = o.sym || {}; if (!o.sym[addr]) o.sym[addr] = String(name).slice(0, 24);
    plc.props.lad = JSON.stringify(EL.ladder.sanitize(o));
  }
  function done(msg) { const ed = B().ed; ed.render(); ed.changed(); B().save(); ui.toast(msg, 'ok', 6000); }

  /* motor with a direct-on-line starter and start / stop buttons */
  AW.motor = function () {
    const c = C(); B().ed.push();
    const at = spot(c), src = source(c, { x: at.x, y: 20 });
    const x = src.x === at.x ? at.x : at.x;
    const qm = EL.addPart(c, 'MPCB', x, 150, { set: 3.5 }); qm.state.on = true;
    const km = EL.addPart(c, 'CONT3', x, 320, { coil: '230VAC' });
    const m = EL.addPart(c, 'MOT3', x + 10, 600, { kw: 1.5, conn: 'delta' });
    const sb1 = EL.addPart(c, 'PB_NC', x + 290, 330), sb2 = EL.addPart(c, 'PB_NO', x + 370, 330);
    W(c, ref(src, 'L1'), ref(qm, '1')); W(c, ref(src, 'L2'), ref(qm, '3')); W(c, ref(src, 'L3'), ref(qm, '5'));
    W(c, ref(qm, '2'), ref(km, '1')); W(c, ref(qm, '4'), ref(km, '3')); W(c, ref(qm, '6'), ref(km, '5'));
    W(c, ref(km, '2'), ref(m, 'U1')); W(c, ref(km, '4'), ref(m, 'V1')); W(c, ref(km, '6'), ref(m, 'W1')); W(c, ref(src, 'PE'), ref(m, 'PE'));
    W(c, ref(qm, '2'), ref(sb1, '1')); W(c, ref(sb1, '2'), ref(sb2, '3')); W(c, ref(sb2, '4'), ref(km, 'A1')); W(c, ref(sb1, '2'), ref(km, '13')); W(c, ref(km, '14'), ref(km, 'A1')); W(c, ref(km, 'A2'), ref(src, 'N'));
    done(T(['Created on the panel: ', 'اتعمل في اللوحة: ']) + qm.tag + ', ' + km.tag + ', ' + m.tag + T([' with stop ', ' مع زرار إيقاف ']) + sb1.tag + T([' and start ', ' وزرار تشغيل ']) + sb2.tag + T([' (direct-on-line starter). Press ', ' (تشغيل مباشر). اضغط ']) + sb2.tag + T([' in Test mode to run the pump.', ' في وضع الاختبار عشان الطلمبة تشتغل.']));
    return m.tag;
  };
  /* contact device: float, pressure or flow switch. high = trips on a high value: wired NC (fail-safe) */
  AW.contact = function (type, name, high) {
    const c = C(); B().ed.push();
    const at = spot(c), plc = plcOf(c);
    const s = EL.addPart(c, type, at.x, 620);
    if (!plc) { done(T(['Created ', 'اتعمل ']) + s.tag + T([' on the panel. Wire its contact (C, NC, NO) into your control circuit.', ' في اللوحة. وصّل الكونتاكت بتاعه (C وNC وNO) في دايرة التحكم.'])); return s.tag; }
    const i = freeIn(c, plc);
    W(c, ref(plc, 'LP'), ref(s, '11'));
    if (i < 0) { done(T(['Created ', 'اتعمل ']) + s.tag + T([', but the PLC has no free input. Wire it yourself.', '، بس الـPLC مفيهوش مدخل فاضي. وصّله بنفسك.'])); return s.tag; }
    W(c, ref(s, high ? '12' : '14'), ref(plc, 'I' + i));
    setSym(plc, 'I0.' + i, (name || s.tag) + (high ? ' OK (NC)' : ''));
    done(T(['Created ', 'اتعمل ']) + s.tag + T([', wired to ', '، متوصل على ']) + plc.tag + ':I' + i + ' = I0.' + i + (high ? T([' through its NC contact (fail-safe: 1 = healthy, 0 = high level or broken wire).', ' من الكونتاكت NC (أمان: 1 = سليم، 0 = مستوى عالي أو سلك مقطوع).']) : T([' through its NO contact (1 = operated).', ' من الكونتاكت NO (1 = متفعّل).'])));
    return s.tag;
  };
  AW.transmitter = function (kind, name) {
    const c = C(); B().ed.push();
    const at = spot(c), plc = plcOf(c);
    const t = EL.addPart(c, 'TXV', at.x, 620, { kind: kind || 'level', proc: 0 });
    if (!plc) { done(T(['Created ', 'اتعمل ']) + t.tag + T([' (0-10 V). Feed it +24 V / 0 V and wire OUT to an analog input.', ' (0-10 فولت). غذّيه +24 / 0 فولت ووصّل OUT على مدخل أنالوج.'])); return t.tag; }
    W(c, ref(plc, 'LP'), ref(t, 'pos')); W(c, ref(plc, 'M'), ref(t, 'com'));
    const k = freeAI(c, plc);
    if (k >= 0) { W(c, ref(t, 'out'), ref(plc, 'AI' + k)); setSym(plc, k ? 'IW66' : 'IW64', name || t.tag); }
    done(T(['Created ', 'اتعمل ']) + t.tag + (k >= 0 ? T([', wired to ', '، متوصل على ']) + plc.tag + ':AI' + k + ' = ' + (k ? 'IW66' : 'IW64') + T([' (0-27648 = 0-100 %). Use SCALE in the ladder.', ' (0-27648 = 0-100%). استخدم SCALE في اللادر.']) : T([', but the PLC has no free analog input.', '، بس الـPLC مفيهوش مدخل أنالوج فاضي.'])));
    return t.tag;
  };
  AW.solenoid = function () {
    const c = C(); B().ed.push();
    const at = spot(c), plc = plcOf(c);
    const s = EL.addPart(c, 'SOL', at.x, 620, { model: 'std' });
    if (!plc) { done(T(['Created ', 'اتعمل ']) + s.tag + T([' (24 V). Wire + and − to your 24 V control.', ' (24 فولت). وصّل + و− على تحكم 24 فولت.'])); return s.tag; }
    const q = freeQ(c, plc);
    if (q >= 0) {
      if (plc.type === 'PLC24R') { W(c, ref(plc, 'LP'), ref(plc, 'C' + q)); W(c, ref(plc, 'Q' + q), ref(s, 'pos')); } else W(c, ref(plc, 'Q' + q), ref(s, 'pos'));
      W(c, ref(s, 'neg'), ref(plc, 'M'));
    }
    done(T(['Created ', 'اتعمل ']) + s.tag + (q >= 0 ? T([', driven by output Q0.', '، شغال من المخرج Q0.']) + q + '.' : '.'));
    return s.tag;
  };
  AW.simple = function (type) {
    const c = C(); B().ed.push();
    const at = spot(c), p = EL.addPart(c, type, at.x, 620);
    done(T(['Created ', 'اتعمل ']) + p.tag + T([' on the panel. Wire it to its supply.', ' في اللوحة. وصّله بالتغذية بتاعته.']));
    return p.tag;
  };
  /* a relay PLC with its MCB and 24 V supply, ready for ladder */
  AW.plcKit = function () {
    const c = C(); B().ed.push();
    const at = spot(c), src = source(c, { x: at.x, y: 20 });
    const x = at.x + (src.x === at.x ? 0 : 0);
    const f = EL.addPart(c, 'MCB1', x, src.x === at.x ? 170 : 20, { rating: 6 }); f.state.on = true;
    const ps = EL.addPart(c, 'PSU', x + 90, src.x === at.x ? 170 : 20);
    const plc = EL.addPart(c, 'PLC24R', x, src.x === at.x ? 380 : 230);
    W(c, ref(src, 'L1'), ref(f, '1')); W(c, ref(f, '2'), ref(ps, 'L')); W(c, ref(src, 'N'), ref(ps, 'N')); W(c, ref(src, 'PE'), ref(ps, 'PE'));
    W(c, ref(ps, 'pos'), ref(plc, 'LP')); W(c, ref(ps, 'neg'), ref(plc, 'M'));
    for (let i = 0; i < 4; i++) W(c, ref(f, '2'), ref(plc, 'C' + i));
    plc.props.mode = 'ladder';
    plc.props.lad = JSON.stringify({ v: 1, sym: {}, nets: [] });
    done(T(['Created ', 'اتعمل ']) + f.tag + ' + ' + ps.tag + ' + ' + plc.tag + T([': the PLC has 24 V and its relay commons C0-C3 get 230 V from ', ': الـPLC واخد 24 فولت والكومنز C0-C3 واخدين 230 فولت من ']) + f.tag + T(['. Wire inputs and outputs, then add networks.', '. وصّل المداخل والمخارج وبعدين ضيف نتوركات.']));
    return plc;
  };
})(typeof window !== 'undefined' ? window : globalThis);
