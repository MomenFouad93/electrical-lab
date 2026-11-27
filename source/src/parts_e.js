/* Parts E: automation. PLC with a small program, MCU board, SSR, safety relay, photo sensor, PT100 */
(function (g) {
  const EL = g.EL;
  const { P, INT, Z, VS } = EL;
  const RC = EL.R_CLOSED;
  const D = EL.defs;
  const T = EL.T, body = EL.body, pin = EL.mkpin;
  const F0 = ['none', ['None', 'سليم']];
  const wl = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="wl"/>`;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const smoke = (x, y) => `<g class="smoke"><circle cx="${x}" cy="${y}" r="5" fill="#222" opacity=".8"/><circle cx="${x + 6}" cy="${y - 6}" r="4" fill="#444" opacity=".7"/></g>`;

  /* ---- compiled program cache (not serialised) ---- */
  const PROGS = new WeakMap();
  function progOf(p) {
    const t = String(p.props.prog || '');
    let c = PROGS.get(p);
    if (!c || c.text !== t) { c = { text: t, prog: EL.logic.compile(t) }; PROGS.set(p, c); }
    return c.prog;
  }
  EL.progOf = progOf;
  function zeros(n) { return new Array(n).fill(0); }
  function mkEnv(st, circuit, nQ) {
    return {
      time: (circuit && circuit.time) || 0,
      get(n) {
        if (n.startsWith('AI')) return st.ai[+n.slice(2)] || 0;
        if (n.startsWith('AO')) return st.ao[+n.slice(2)] || 0;
        const k = +n.slice(1);
        return (n[0] === 'I' ? st.i : n[0] === 'Q' ? st.q : st.m)[k] || 0;
      },
      set(n, v) {
        if (n.startsWith('AO')) { st.ao[+n.slice(2)] = Math.max(0, Math.min(10, v)); return; }
        const k = +n.slice(1);
        if (n[0] === 'Q') { if (k < nQ) st.q[k] = v ? 1 : 0; } else st.m[k] = v;
      },
    };
  }
  const DEFAULT_PROG = 'Q0 = (I0 or Q0) and I1   // I0 = START (NO button), I1 = STOP (NC contact wired to the input)\nQ1 = TON(Q0, 3)           // Q1 comes on 3 s after Q0';

  /* ================= PLC ================= */
  function plc(kind, o) {
    o = o || {}; // options (S7CPU): nI, nQ, nAO, w, h, pins
    const rel = kind === 'R', nQ = o.nQ || (rel ? 4 : 6), nI = o.nI || 8, nAO = o.nAO != null ? o.nAO : rel ? 0 : 1, w = o.w || 270, h = o.h || 150;
    const pins = o.pins ? o.pins.slice() : [pin('LP', 'L+', 24, 0, 'u', { role: 'pos' }), pin('M', 'M', 52, 0, 'u', { role: 'neg' })];
    if (o.pins) { /* pins given by the caller */ } else if (rel) for (let i = 0; i < nQ; i++) pins.push(pin('Q' + i, 'Q' + i, 96 + 40 * i, 0, 'u'), pin('C' + i, 'C' + i, 96 + 40 * i + 20, 0, 'u'));
    else { for (let i = 0; i < nQ; i++) pins.push(pin('Q' + i, 'Q' + i, 96 + 24 * i, 0, 'u')); pins.push(pin('AO0', 'AO0', 96 + 24 * nQ + 8, 0, 'u')); }
    if (!o.pins) { for (let i = 0; i < nI; i++) pins.push(pin('I' + i, 'I' + i, 20 + 24 * i, h, 'd'));
      pins.push(pin('AI0', 'AI0', 218, h, 'd'), pin('AI1', 'AI1', 244, h, 'd')); }
    return {
      cat: 'auto', prefix: 'PLC', name: rel ? ['PLC 24 V DC, relay outputs', 'PLC 24 فولت DC بخرج ريلاي'] : ['PLC 24 V DC, transistor outputs', 'PLC 24 فولت DC بخرج ترانزستور'], w, h,
      info: rel
        ? ['Compact PLC: 8 digital inputs (24 V DC), 4 relay outputs (dry contacts Qn-Cn, 6 A), 2 analog inputs 0-10 V. Write the program as lines like  Q0 = (I0 or Q0) and I1  in the Properties panel. Click RUN/STOP on the front to switch mode.', 'PLC صغير: 8 مداخل ديجيتال 24 فولت DC و4 مخارج ريلاي (كونتاكت جاف Qn-Cn بـ6 أمبير) ومدخلين أنالوج 0-10 فولت. اكتب البرنامج على شكل سطور زي  Q0 = (I0 or Q0) and I1  في لوحة الخصائص. اضغط RUN/STOP على الواجهة لتغيير الوضع.']
        : ['Compact PLC: 8 digital inputs (24 V DC, sinking: wire a switch from +24 V to the input), 6 sourcing transistor outputs Q0-Q5 (24 V, 0.5 A each, short-circuit protected), 2 analog inputs 0-10 V and 1 analog output. Write the program in the Properties panel. Click RUN/STOP on the front to switch mode.', 'PLC صغير: 8 مداخل ديجيتال 24 فولت DC (وصّل مفتاح من +24 للمدخل) و6 مخارج ترانزستور Q0-Q5 (24 فولت و0.5 أمبير لكل واحد ومحمية من الماس) ومدخلين أنالوج 0-10 فولت وخرج أنالوج. اكتب البرنامج في لوحة الخصائص. اضغط RUN/STOP على الواجهة لتغيير الوضع.'],
      pins,
      props: [{ k: 'mode', label: ['Programming language', 'لغة البرمجة'], t: 'sel', opts: [['text', 'Text lines'], ['ladder', 'Ladder (LAD)']], def: 'text' }, { k: 'prog', label: ['Program (one line per output)', 'البرنامج (سطر لكل خرج)'], t: 'text', rows: 7, max: 600, def: DEFAULT_PROG, when: (p) => p.props.mode !== 'ladder' }, { k: 'lad', t: 'hidden', def: '' }],
      faults: [F0, ['dead', ['PLC dead (no power-up)', 'الـPLC ميت']], ['in0', ['Input I0 channel damaged', 'قناة المدخل I0 تالفة']], ['out0', ['Output Q0 damaged', 'المخرج Q0 تالف']]],
      diag: { kind: 'plc', nI, nQ, rel }, electronic: true, op: ['run'],
      init(p) { p.state = { run: true, sup: false, i: zeros(nI), q: zeros(nQ), m: zeros(16), ai: zeros(2), ao: zeros(1), ovl: zeros(nQ), weld: zeros(nQ), v: 0 }; },
      elements(p, ctx) {
        const st = p.state, out = [];
        if (st.burnt) return out;
        out.push(Z(P(p, 'LP'), P(p, 'M'), 24 / 0.12, 0, { tag: 'sup', noAC: true }));
        for (let i = 0; i < nI; i++) out.push(Z(P(p, 'I' + i), P(p, 'M'), 3500, 0, { tag: 'i' + i, noAC: true }));
        out.push(Z(P(p, 'AI0'), P(p, 'M'), 100000, 0, { tag: 'ai0', noAC: true }), Z(P(p, 'AI1'), P(p, 'M'), 100000, 0, { tag: 'ai1', noAC: true }));
        for (let i = 0; i < nQ; i++) {
          const on = st.sup && st.run && st.q[i] && !st.ovl[i] && !(i === 0 && p.fault === 'out0');
          if (rel) { if (on || st.weld[i]) out.push(Z(P(p, 'Q' + i), P(p, 'C' + i), RC, 0, { tag: 'q' + i })); }
          else out.push(on ? Z(P(p, 'LP'), P(p, 'Q' + i), 0.4, 0, { tag: 'q' + i }) : Z(P(p, 'Q' + i), P(p, 'M'), 1e6, 0, { tag: 'q' + i, noAC: true }));
        }
        if (!rel && nAO) {
          if (st.sup && st.ao[0] > 0.01) out.push(VS(P(p, 'M'), INT(p, 'ao'), { vdc: st.ao[0], tag: 'ao' }), Z(INT(p, 'ao'), P(p, 'AO0'), 500, 0, { tag: 'aoz' }));
          else out.push(Z(P(p, 'AO0'), P(p, 'M'), 1e6, 0, { tag: 'aoz', noAC: true }));
        }
        return out;
      },
      update(p, sim, dt, ctx, circuit) {
        const st = p.state, r = EL.eRead(sim, p.id, 'sup'), v = Math.abs(r.vdc);
        st.v = v;
        if (!st.burnt && (r.vac > 60 || v > 36)) { st.burnt = true; EL.emit('burn', p, 'overvoltage on the 24 V supply'); }
        st.sup = !st.burnt && p.fault !== 'dead' && v >= 19.2 && v <= 30;
        if (!st.sup) { st.q = zeros(nQ); st.i = zeros(nI); st.ao = zeros(1); return; }
        for (let i = 0; i < nI; i++) {
          const vi = i === 0 && p.fault === 'in0' ? 0 : sim.vdc(P(p, 'I' + i), P(p, 'M'));
          if (vi >= 15) st.i[i] = 1; else if (vi <= 5) st.i[i] = 0;
        }
        for (let k = 0; k < 2; k++) st.ai[k] = Math.max(0, Math.min(10, sim.vdc(P(p, 'AI' + k), P(p, 'M'))));
        if (p.props.mode === 'ladder' && EL.ladder) {
          if (st.run) EL.ladder.run(p, st, dt, circuit, nQ); else { st.q = zeros(nQ); st.err = 0; }
        } else {
          const prog = progOf(p);
          st.err = prog.errors.length;
          if (st.run) EL.logic.run(prog, mkEnv(st, circuit, nQ), dt); else st.q = zeros(nQ);
        }
        for (let i = 0; i < nQ; i++) {
          if (st.ovl[i] > 0) st.ovl[i] = Math.max(0, st.ovl[i] - dt);
          if (st.q[i] && st.run) {
            const e = EL.eRead(sim, p.id, 'q' + i);
            const lim = rel ? 12 : 0.8;
            if (Math.max(Math.abs(e.idc), e.iac) > lim) {
              if (rel) { if (Math.max(Math.abs(e.idc), e.iac) > 15 && !st.weld[i]) { st.weld[i] = 1; EL.emit('burn', p, 'relay contact welded on Q' + i); } }
              else { st.ovl[i] = 3; EL.emit('trip', p, 'output Q' + i + ' short-circuit protection'); }
            }
          }
        }
      },
      press(p, ev) {
        if (ev.type !== 'down') return;
        if (ev.lx != null && ev.ly != null && ev.lx > 150 && ev.lx < 262 && ev.ly > 62 && ev.ly < 92) { p.state.run = !p.state.run; EL.emit('click', p); return { msg: p.state.run ? ['PLC in RUN.', 'الـPLC في وضع RUN.'] : ['PLC in STOP. Outputs are off.', 'الـPLC في STOP. كل المخارج مفصولة.'] }; }
      },
      draw(p) {
        const st = p.state;
        let r = body(w, h) + `<rect x="8" y="18" width="${w - 16}" height="${h - 38}" rx="6" fill="#1a2238" stroke="#7b879f"/>`;
        r += wl(24, 0, 24, 18) + wl(52, 0, 52, 18);
        for (let i = 0; i < nQ; i++) { const x = rel ? 96 + 40 * i : 96 + 24 * i; r += wl(x, 0, x, 18) + (rel ? wl(x + 20, 0, x + 20, 18) : '') + `<circle cx="${x + (rel ? 10 : 0)}" cy="30" r="4.5" class="led ${st.q[i] && st.sup && st.run && !st.ovl[i] ? 'ledg' : ''}"/>` + T(x + (rel ? 10 : 0), 46, 'Q' + i, 'psub'); }
        if (!rel) r += wl(96 + 24 * nQ + 8, 0, 96 + 24 * nQ + 8, 18) + T(96 + 24 * nQ + 8, 46, 'AO0', 'psub');
        for (let i = 0; i < nI; i++) { const x = 20 + 24 * i; r += wl(x, h, x, h - 20) + `<circle cx="${x}" cy="${h - 34}" r="4.5" class="led ${st.i[i] ? 'ledg' : ''}"/>` + T(x, h - 48, 'I' + i, 'psub'); }
        r += wl(218, h, 218, h - 20) + wl(244, h, 244, h - 20) + T(218, h - 30, (st.ai[0] || 0).toFixed(1) + 'V', 'psub') + T(244, h - 30, (st.ai[1] || 0).toFixed(1) + 'V', 'psub');
        r += T(24, 46, 'L+', 'psub') + T(52, 46, 'M', 'psub');
        const run = st.sup && st.run;
        r += `<rect x="150" y="64" width="112" height="26" rx="5" fill="${!st.sup ? '#3a1f1f' : run ? '#1f4a2a' : '#4a3d12'}" stroke="#7b879f"/>` + T(206, 82, !st.sup ? 'NO POWER' : run ? 'RUN' : 'STOP', 'pbtn');
        r += T(78, 82, rel ? 'PLC 24V / REL' : 'PLC 24V / TR', 'ptitle') + (p.props.mode === 'ladder' ? T(34, 64, 'LAD', 'psub') : '');
        if (st.err) r += T(206, 104, 'PROGRAM ERROR', 'psub');
        if (st.burnt) r += smoke(40, 40);
        for (let i = 0; i < nQ; i++) if (st.ovl[i] > 0) r += T(206, 116, 'Q' + i + ' SHORT', 'psub');
        return r;
      },
    };
  }
  D.PLC24 = plc('T');
  D.PLC24R = plc('R');

  /* ---- compact CPU in the S7-1200 style: CPU 1214C DC/DC/DC, 14 DI, 10 DQ (transistor, sourcing), 2 AI 0-10 V, no AO ----
     pin ids I0..I13 = I0.0..I0.7, I1.0..I1.5 ; Q0..Q9 = Q0.0..Q0.7, Q1.0, Q1.1 ; the ladder maps byte 1 to index 8 + bit */
  (function () {
    const nI = 14, nQ = 10, w = 480, h = 180, X0 = 84, DX = 24;
    const adr = (k, i) => k + (i >> 3) + '.' + (i & 7);
    const pins = [pin('LP', 'L+', 20, 0, 'u', { role: 'pos' }), pin('M', 'M', 44, 0, 'u', { role: 'neg' })];
    for (let i = 0; i < nI; i++) pins.push(pin('I' + i, adr('I', i), X0 + DX * i, 0, 'u'));
    pins.push(pin('AI0', 'AI0', 432, 0, 'u'), pin('AI1', 'AI1', 456, 0, 'u'));
    for (let i = 0; i < nQ; i++) pins.push(pin('Q' + i, adr('Q', i), X0 + DX * i, h, 'd'));
    const d = plc('T', { nI, nQ, nAO: 0, w, h, pins });
    d.prefix = 'PLC';
    d.name = ['PLC S7-1200 style CPU 1214C DC/DC/DC', 'PLC نوع S7-1200 (CPU 1214C DC/DC/DC)'];
    d.info = ['Compact CPU like the S7-1200 CPU 1214C DC/DC/DC: 14 digital inputs 24 V DC (I0.0-I0.7, I1.0-I1.5, sinking: wire a switch from +24 V to the input), 10 sourcing transistor outputs (Q0.0-Q0.7, Q1.0, Q1.1, 24 V, 0.5 A each), 2 analog inputs 0-10 V (IW64, IW66), no analog output. Program it in the Programming tab (ladder) and export the code for the real CPU. Click RUN/STOP on the front to switch mode.', 'CPU صغير زي S7-1200 CPU 1214C DC/DC/DC: 14 مدخل ديجيتال 24 فولت DC (I0.0-I0.7 و I1.0-I1.5، وصّل المفتاح من +24 للمدخل)، و10 مخارج ترانزستور (Q0.0-Q0.7 و Q1.0 و Q1.1، 24 فولت و0.5 أمبير لكل واحد)، ومدخلين أنالوج 0-10 فولت (IW64 و IW66)، ومفيش خرج أنالوج. برمجه من تاب البرمجة (لادر) وطلّع الكود للـCPU الحقيقي. اضغط RUN/STOP على الواجهة لتغيير الوضع.'];
    d.diag = Object.assign({}, d.diag, { cpu: '1214C', feed: ['LP', 'M'], volt: () => 24, ac: () => false, active: (p) => !!p.state.sup });
    d.props = d.props.map((x) => (x.k === 'mode' ? Object.assign({}, x, { def: 'ladder' }) : x));
    d.press = function (p, ev) {
      if (ev.type !== 'down') return;
      if (ev.lx != null && ev.ly != null && ev.lx > 10 && ev.lx < 92 && ev.ly > 46 && ev.ly < 126) { p.state.run = !p.state.run; EL.emit('click', p); return { msg: p.state.run ? ['CPU in RUN.', 'الـCPU في وضع RUN.'] : ['CPU in STOP. Outputs are off.', 'الـCPU في STOP. كل المخارج مفصولة.'] }; }
    };
    const led = (x, y, on, c) => `<rect x="${x - 4}" y="${y - 3}" width="8" height="6" rx="1" fill="${on ? c : '#2a2e33'}" stroke="#16181b" stroke-width=".8"/>`;
    const term = (x, y) => `<rect x="${x - 9}" y="${y}" width="18" height="16" rx="2" fill="#2b2f34" stroke="#121417"/><circle cx="${x}" cy="${y + 8}" r="4" fill="#9aa2ab" stroke="#4b5158"/><line x1="${x - 2.5}" y1="${y + 8}" x2="${x + 2.5}" y2="${y + 8}" stroke="#3a3f45" stroke-width="1.4"/>`;
    d.draw = function (p) {
      const st = p.state, run = st.sup && st.run, txt = (x, y, s, sz, c, a) => `<text x="${x}" y="${y}" font-size="${sz}" fill="${c}" text-anchor="${a || 'middle'}" font-family="Arial, sans-serif">${s}</text>`;
      let r = `<rect x="0" y="0" width="${w}" height="${h}" rx="5" fill="#3d4247" stroke="#1d2024" stroke-width="1.5"/>`;
      // terminal covers (top: supply, DI, AI ; bottom: DQ)
      r += `<rect x="4" y="2" width="${w - 8}" height="34" rx="3" fill="#2f3338"/><rect x="4" y="${h - 36}" width="${X0 + DX * nQ - 2}" height="34" rx="3" fill="#2f3338"/>`;
      for (const q of pins) r += q.y === 0 ? wl(q.x, 0, q.x, 4) + term(q.x, 4) : wl(q.x, h, q.x, h - 4) + term(q.x, h - 20); // the editor prints the pin labels
      // front: status LEDs, I/O LEDs, label, Ethernet port
      r += `<rect x="10" y="46" width="82" height="80" rx="3" fill="#33373c" stroke="#25282c"/>`;
      r += led(22, 58, run, '#3ddc6a') + txt(30, 61, 'RUN', 7, '#c9ced4', 'start');
      r += led(22, 74, st.sup && !st.run, '#f0b429') + txt(30, 77, 'STOP', 7, '#c9ced4', 'start');
      r += led(22, 90, st.sup && !!st.err, '#ff4d3d') + txt(30, 93, 'ERROR', 7, '#c9ced4', 'start');
      r += led(22, 106, false, '#f0b429') + txt(30, 109, 'MAINT', 7, '#c9ced4', 'start');
      r += txt(51, 121, 'RUN / STOP', 6, '#8f979f');
      r += `<rect x="104" y="46" width="${w - 116}" height="22" rx="2" fill="#33373c"/>`;
      for (let i = 0; i < nI; i++) { const x = 116 + 16 * i; r += led(x, 54, st.sup && st.i[i], '#3ddc6a') + txt(x, 65, (i >> 3) + '.' + (i & 7), 5.5, '#aeb5bc'); }
      r += txt(116 + 16 * nI + 4, 57, 'DI', 6.5, '#aeb5bc', 'start');
      r += `<rect x="104" y="${h - 66}" width="${16 * nQ + 30}" height="22" rx="2" fill="#33373c"/>`;
      for (let i = 0; i < nQ; i++) { const x = 116 + 16 * i, on = run && st.q[i] && !st.ovl[i]; r += led(x, h - 58, on, '#3ddc6a') + txt(x, h - 47, (i >> 3) + '.' + (i & 7), 5.5, '#aeb5bc'); }
      r += txt(116 + 16 * nQ + 2, h - 55, 'DQ', 6.5, '#aeb5bc', 'start');
      r += txt(110, 90, 'CPU 1214C', 14, '#eef1f4', 'start') + txt(110, 104, 'DC/DC/DC', 9, '#c9ced4', 'start');
      r += txt(250, 90, p.props.mode === 'ladder' ? 'LAD' : 'TEXT', 8, '#8f979f', 'start') + txt(250, 104, (st.ai[0] || 0).toFixed(1) + ' V  ' + (st.ai[1] || 0).toFixed(1) + ' V', 8, '#8f979f', 'start') + txt(250, 76, 'AI0  AI1', 7, '#8f979f', 'start');
      r += `<rect x="${w - 70}" y="${h - 68}" width="52" height="42" rx="3" fill="#1d2024" stroke="#0e1012"/><rect x="${w - 60}" y="${h - 60}" width="32" height="24" rx="1" fill="#0b0c0e" stroke="#5c636b"/><rect x="${w - 50}" y="${h - 38}" width="12" height="4" fill="#0b0c0e" stroke="#5c636b"/>`;
      r += led(w - 62, h - 64, run, '#3ddc6a') + led(w - 26, h - 64, run, '#f0b429') + txt(w - 44, h - 18, 'X1 P1', 6.5, '#aeb5bc');
      if (!st.sup) r += txt(w / 2 + 60, 125, 'NO POWER', 9, '#ff8a7a');
      if (st.err) r += txt(w / 2 + 60, 125, 'PROGRAM ERROR', 9, '#ff8a7a');
      for (let i = 0; i < nQ; i++) if (st.ovl[i] > 0) { r += txt(w / 2 + 60, 137, adr('Q', i) + ' SHORT', 9, '#ff8a7a'); break; }
      if (st.burnt) r += smoke(60, 60);
      return r;
    };
    D.S7CPU = d;
  })();

  /* ================= MCU board, 5 V logic ================= */
  D.MCU = {
    cat: 'auto', prefix: 'MCU', name: ['MCU board 5 V (Arduino style)', 'كارت ميكروكنترولر 5 فولت (زي Arduino)'], w: 200, h: 110,
    info: ['Small 5 V microcontroller board. Pins D0-D5 are inputs, or outputs if the program writes Q0-Q5 (Qn drives Dn). Each pin supplies at most 40 mA: an LED without a resistor destroys the pin. A0 and A1 read 0-5 V as AI0 and AI1. Program in the Properties panel.', 'كارت ميكروكنترولر 5 فولت. الأطراف D0-D5 مداخل أو مخارج لو البرنامج بيكتب Q0-Q5 (Qn بيشغل Dn). كل طرف يديك 40 ملي أمبير بالكتير: LED من غير مقاومة بيحرق الطرف. A0 وA1 بيقروا 0-5 فولت كـAI0 وAI1. البرنامج في لوحة الخصائص.'],
    pins: [pin('V5', '5V', 24, 0, 'u', { role: 'pos' }), pin('GND', 'GND', 52, 0, 'u', { role: 'neg' })].concat([0, 1, 2, 3, 4, 5].map((i) => pin('D' + i, 'D' + i, 20 + 24 * i, 110, 'd'))).concat([pin('A0', 'A0', 160, 0, 'u'), pin('A1', 'A1', 184, 0, 'u')]),
    props: [{ k: 'prog', label: ['Program', 'البرنامج'], t: 'text', rows: 6, max: 500, def: 'Q0 = BLINK(1)            // D0 blinks every 1 s\nQ1 = I2                  // D1 follows D2' }],
    faults: [F0, ['dead', ['Board dead', 'الكارت ميت']]], electronic: true, diag: { kind: 'mcu' },
    init(p) { p.state = { sup: false, i: zeros(6), q: zeros(6), m: zeros(8), ai: zeros(2), ao: [], dmg: zeros(6), ov: zeros(6), out: zeros(6), v: 0 }; },
    elements(p) {
      const st = p.state, out = [];
      if (st.burnt) return out;
      out.push(Z(P(p, 'V5'), P(p, 'GND'), 100, 0, { tag: 'sup', noAC: true }), Z(P(p, 'A0'), P(p, 'GND'), 1e6, 0, { tag: 'a0', noAC: true }), Z(P(p, 'A1'), P(p, 'GND'), 1e6, 0, { tag: 'a1', noAC: true }));
      for (let i = 0; i < 6; i++) {
        if (st.dmg[i]) continue;
        if (st.out[i]) out.push(st.sup && st.q[i] ? Z(P(p, 'V5'), P(p, 'D' + i), 25, 0, { tag: 'd' + i }) : Z(P(p, 'D' + i), P(p, 'GND'), 25, 0, { tag: 'd' + i }));
        else out.push(Z(P(p, 'D' + i), P(p, 'GND'), 100000, 0, { tag: 'd' + i, noAC: true }));
      }
      return out;
    },
    update(p, sim, dt, ctx, circuit) {
      const st = p.state, r = EL.eRead(sim, p.id, 'sup'), v = Math.abs(r.vdc);
      st.v = v;
      if (!st.burnt && (r.vac > 20 || v > 7)) { st.burnt = true; EL.emit('burn', p, 'overvoltage on the 5 V pin'); }
      st.sup = !st.burnt && p.fault !== 'dead' && v >= 4.5 && v <= 5.6;
      const prog = progOf(p);
      st.err = prog.errors.length;
      for (let i = 0; i < 6; i++) st.out[i] = prog.refs.write.has('Q' + i) ? 1 : 0;
      if (!st.sup) { st.q = zeros(6); return; }
      for (let i = 0; i < 6; i++) { const vi = sim.vdc(P(p, 'D' + i), P(p, 'GND')); if (!st.out[i] || st.dmg[i]) { if (vi >= 3) st.i[i] = 1; else if (vi <= 1.5) st.i[i] = 0; } }
      for (let k = 0; k < 2; k++) st.ai[k] = Math.max(0, Math.min(5, sim.vdc(P(p, 'A' + k), P(p, 'GND'))));
      EL.logic.run(prog, mkEnv(st, circuit, 6), dt);
      for (let i = 0; i < 6; i++) {
        if (!st.out[i] || st.dmg[i]) continue;
        const e = EL.eRead(sim, p.id, 'd' + i);
        if (Math.abs(e.idc) > 0.04) { st.ov[i] += dt; if (st.ov[i] > 0.3) { st.dmg[i] = 1; EL.emit('burn', p, 'pin D' + i + ' overloaded (more than 40 mA)'); } } else st.ov[i] = Math.max(0, st.ov[i] - dt);
      }
    },
    draw(p) {
      const st = p.state;
      let r = body(200, 110) + `<rect x="8" y="14" width="184" height="84" rx="6" fill="#0f4a47" stroke="#2f9c8a"/>` + wl(24, 0, 24, 14) + wl(52, 0, 52, 14) + wl(160, 0, 160, 14) + wl(184, 0, 184, 14);
      r += T(24, 28, '5V', 'psub') + T(52, 28, 'GND', 'psub') + T(160, 28, 'A0', 'psub') + T(184, 28, 'A1', 'psub');
      for (let i = 0; i < 6; i++) { const x = 20 + 24 * i; r += wl(x, 110, x, 98) + T(x, 90, 'D' + i, 'psub') + `<circle cx="${x}" cy="76" r="4" class="led ${(st.out[i] ? st.q[i] : st.i[i]) && st.sup && !st.dmg[i] ? 'ledg' : ''}"/>` + (st.dmg[i] ? `<path d="M${x - 5} 70 L${x + 5} 82 M${x + 5} 70 L${x - 5} 82" stroke="#F55B41" stroke-width="2"/>` : ''); }
      r += `<rect x="70" y="38" width="60" height="22" rx="3" fill="#1a2238" stroke="#7b879f"/>` + T(100, 53, 'MCU', 'pbtn') + `<circle cx="22" cy="44" r="4" class="led ${st.sup ? 'ledg' : ''}"/>`;
      if (st.err) r += T(100, 70, 'PROGRAM ERROR', 'psub');
      if (st.burnt) r += smoke(40, 30);
      return r;
    },
  };

  /* ================= SSR ================= */
  D.SSR = {
    cat: 'auto', prefix: 'KS', name: ['Solid state relay (24 V DC to 230 V AC)', 'سوليد ستيت ريلاي (دخل 24 DC وخرج 230 AC)'], w: 100, h: 120,
    info: ['Input 3-32 V DC (+ and -). Output switches AC load A-B with no moving parts. Real SSRs leak a few mA when off: a small lamp can glow faintly. Fault: shorted output (always on), the common failure mode.', 'دخل 3-32 فولت DC (+ و-). الخرج بيقفل حمل AC بين A وB من غير أجزاء متحركة. الـSSR الحقيقي بيسرّب كام ملي أمبير وهو فاصل: لمبة صغيرة ممكن تنور بضعف. العطل: الخرج ماس (دايما شغال)، وده العطل الأشهر.'],
    pins: [pin('IN+', '+', 25, 0, 'u'), pin('IN-', '-', 75, 0, 'u'), pin('A', 'A', 25, 120, 'd'), pin('B', 'B', 75, 120, 'd')],
    props: [{ k: 'amps', label: ['Output rating (A)', 'تيار الخرج (أمبير)'], t: 'sel', opts: [[5, '5 A'], [10, '10 A'], [25, '25 A'], [40, '40 A']], def: 10 }],
    faults: [F0, ['shorted', ['Output shorted (always on)', 'الخرج ماس (دايما شغال)']], ['open', ['Output open (never on)', 'الخرج مفتوح (مش بيشتغل)']]],
    electronic: true, diag: { kind: 'logic' },
    init(p) { p.state = { on: false }; },
    elements(p) {
      const st = p.state, out = [Z(P(p, 'IN+'), P(p, 'IN-'), 2200, 0, { tag: 'in', noAC: true })];
      if (st.burnt || p.fault === 'open') return out;
      const on = st.on || p.fault === 'shorted';
      out.push(Z(P(p, 'A'), P(p, 'B'), on ? 0.05 : 100000, 0, { tag: 'o' }));
      return out;
    },
    update(p, sim, dt) {
      const st = p.state, vin = sim.vdc(P(p, 'IN+'), P(p, 'IN-'));
      st.on = vin >= 4 && vin <= 36;
      if (vin > 36 || vin < -5) { st.burnt = true; EL.emit('burn', p, 'input overvoltage'); }
      const o = EL.eRead(sim, p.id, 'o');
      st.amps = Math.max(o.iac, Math.abs(o.idc));
      if (st.amps > +p.props.amps * 1.5) { st.hot = (st.hot || 0) + dt; if (st.hot > 2 && p.fault === 'none') { p.fault = 'shorted'; EL.emit('burn', p, 'SSR output failed shorted'); } } else st.hot = Math.max(0, (st.hot || 0) - dt);
    },
    draw(p) {
      const st = p.state;
      return body(100, 120) + wl(25, 0, 25, 22) + wl(75, 0, 75, 22) + wl(25, 98, 25, 120) + wl(75, 98, 75, 120) + `<rect x="10" y="22" width="80" height="76" rx="5" fill="#1a2238" stroke="#7b879f"/><circle cx="28" cy="38" r="5" class="led ${st.on ? 'ledg' : ''}"/>` + T(56, 42, 'SSR', 'pbtn') + T(50, 62, '24VDC > 230VAC', 'psub') + T(50, 78, (+p.props.amps) + ' A', 'psub') + (st.burnt ? smoke(24, 30) : '');
    },
  };

  /* ================= Safety relay ================= */
  D.SAFE = {
    cat: 'auto', prefix: 'KS', name: ['Safety relay (2 channel, E-stop)', 'ريلاي أمان (قناتين، طوارئ)'], w: 150, h: 140,
    info: ['Monitors a two-channel E-stop. Supply A1(+)/A2(-) 24 V DC. Channel 1: S11 to S12, channel 2: S21 to S22 (wire the two E-stop contacts). Start: wire S33 to S34 through a START button (manual reset) or set Auto. When both channels are closed and reset is done, outputs 13-14 and 23-24 close. If one channel opens, both outputs drop. A cross-short between channels is detected and blocks the start.', 'بيراقب زرار طوارئ بقناتين. التغذية A1(+)/A2(-) 24 فولت DC. القناة 1: S11 لـS12 والقناة 2: S21 لـS22 (وصّل كونتاكتين الطوارئ). التشغيل: وصّل S33 بـS34 عن طريق زرار START (ريسيت يدوي) أو اختار Auto. لما القناتين مقفولين والريسيت اتعمل المخارج 13-14 و23-24 بتقفل. لو قناة فتحت المخرجين بيقعوا. ماس بين القناتين بيتكشف ويمنع التشغيل.'],
    pins: [pin('A1', 'A1', 20, 0, 'u', { role: 'pos' }), pin('A2', 'A2', 50, 0, 'u', { role: 'neg' }), pin('13', '13', 95, 0, 'u'), pin('14', '14', 125, 0, 'u'), pin('23', '23', 150, 48, 'r'), pin('24', '24', 150, 84, 'r'), pin('S11', 'S11', 15, 140, 'd'), pin('S12', 'S12', 40, 140, 'd'), pin('S21', 'S21', 65, 140, 'd'), pin('S22', 'S22', 90, 140, 'd'), pin('S33', 'S33', 115, 140, 'd'), pin('S34', 'S34', 140, 140, 'd')],
    props: [{ k: 'reset', label: ['Reset', 'الريسيت'], t: 'sel', opts: [['manual', 'Manual (START button)'], ['auto', 'Automatic']], def: 'manual' }],
    faults: [F0, ['dead', ['Dead', 'ميت']], ['welded', ['Output contacts welded (does not drop)', 'الكونتاكتات لاصقة (مش بتفصل)']]],
    electronic: true, diag: { kind: 'safety' }, op: [],
    init(p) { p.state = { sup: false, ch1: false, ch2: false, ok: false, cross: false, startSeen: false }; },
    elements(p) {
      const st = p.state, out = [];
      if (st.burnt) return out;
      out.push(Z(P(p, 'A1'), P(p, 'A2'), 24 / 0.08, 0, { tag: 'sup', noAC: true }));
      const src = (n, pn) => { out.push(VS(P(p, 'A2'), INT(p, n), { vdc: st.sup ? 24 : 0, tag: 'v' + n }), Z(INT(p, n), P(p, pn), 100, 0, { tag: 'z' + n, noAC: true })); };
      src('s1', 'S11'); src('s2', 'S21'); src('s3', 'S33');
      out.push(Z(P(p, 'S12'), P(p, 'A2'), 4000, 0, { tag: 'k1', noAC: true }), Z(P(p, 'S22'), P(p, 'A2'), 4000, 0, { tag: 'k2', noAC: true }), Z(P(p, 'S34'), P(p, 'A2'), 4000, 0, { tag: 'k3', noAC: true }));
      if (st.ok || p.fault === 'welded') out.push(Z(P(p, '13'), P(p, '14'), RC, 0, { tag: 'o1' }), Z(P(p, '23'), P(p, '24'), RC, 0, { tag: 'o2' }));
      return out;
    },
    update(p, sim, dt) {
      const st = p.state, r = EL.eRead(sim, p.id, 'sup'), v = Math.abs(r.vdc);
      if (r.vac > 60 || v > 36) { if (!st.burnt) EL.emit('burn', p, 'overvoltage'); st.burnt = true; }
      st.sup = !st.burnt && p.fault !== 'dead' && v >= 19.2 && v <= 30;
      if (!st.sup) { if (p.fault !== 'welded') st.ok = false; st.startSeen = false; st.ch1 = st.ch2 = false; return; }
      const a2 = P(p, 'A2'), n = (x) => sim.uf.find(P(p, x));
      const v12 = sim.vdc(P(p, 'S12'), a2), v22 = sim.vdc(P(p, 'S22'), a2), v34 = sim.vdc(P(p, 'S34'), a2);
      st.ch1 = v12 >= 15; st.ch2 = v22 >= 15;
      st.cross = n('S11') === n('S21') || n('S12') === n('S22') || n('S11') === n('S22') || n('S12') === n('S21');
      const chOK = st.ch1 && st.ch2 && !st.cross;
      if (!chOK) { if (p.fault !== 'welded') st.ok = false; st.startSeen = false; return; }
      if (p.props.reset === 'auto') { st.ok = true; return; }
      const startHigh = v34 >= 15;
      if (!startHigh) st.startSeen = true;
      if (st.startSeen && startHigh && !st.ok) st.ok = true;
    },
    draw(p) {
      const st = p.state;
      let r = body(150, 140) + `<rect x="8" y="16" width="130" height="108" rx="5" fill="#8a7a10" stroke="#0e1626"/>` + T(73, 40, 'SAFETY RELAY', 'pbtn');
      r += [20, 50, 95, 125].map((x) => wl(x, 0, x, 16)).join('') + wl(150, 48, 138, 48) + wl(150, 84, 138, 84);
      r += [15, 40, 65, 90, 115, 140].map((x) => wl(x, 140, x, 124)).join('');
      r += `<circle cx="24" cy="60" r="4.5" class="led ${st.sup ? 'ledg' : ''}"/>` + T(38, 63, 'PWR', 'psub') + `<circle cx="24" cy="76" r="4.5" class="led ${st.ch1 ? 'ledg' : ''}"/>` + T(38, 79, 'CH1', 'psub') + `<circle cx="24" cy="92" r="4.5" class="led ${st.ch2 ? 'ledg' : ''}"/>` + T(38, 95, 'CH2', 'psub') + `<circle cx="84" cy="60" r="4.5" class="led ${st.ok ? 'ledg' : ''}"/>` + T(100, 63, 'OUT', 'psub');
      if (st.cross) r += T(73, 112, 'CROSS FAULT', 'psub');
      if (st.burnt) r += smoke(30, 40);
      r += T(20, 28, 'A1', 'psub') + T(50, 28, 'A2', 'psub') + T(95, 28, '13', 'psub') + T(125, 28, '14', 'psub') + T(126, 52, '23', 'psub') + T(126, 88, '24', 'psub');
      r += ['S11', 'S12', 'S21', 'S22', 'S33', 'S34'].map((t, i) => T(15 + 25 * i, 118, t, 'psub')).join('');
      return r;
    },
  };
  D.ESTOP2 = {
    cat: 'control', prefix: 'SB', name: ['Emergency stop 2-channel (latching)', 'زرار طوارئ بقناتين (بيثبت)'], w: 80, h: 90,
    info: ['Mushroom head with two NC contacts: 11-12 and 21-22. Latches when pushed. Wire each contact to its own channel of a safety relay. Click again to twist-release.', 'زرار فطر بكونتاكتين NC: 11-12 و21-22. بيثبت لما يتضغط. وصّل كل كونتاكت في قناة منفصلة من ريلاي الأمان. اضغط تاني لفكه.'],
    pins: [pin('11', '11', 20, 0, 'u'), pin('12', '12', 20, 90, 'd'), pin('21', '21', 60, 0, 'u'), pin('22', '22', 60, 90, 'd')],
    props: [], faults: [F0, ['open1', ['Contact 11-12 stuck open', 'الكونتاكت 11-12 مفتوح']], ['open2', ['Contact 21-22 stuck open', 'الكونتاكت 21-22 مفتوح']], ['weld', ['Contacts welded (do not open when pressed)', 'الكونتاكتات لاصقة (مش بتفتح)']]],
    diag: { kind: 'switch' }, op: ['act'],
    init(p) { p.state = { act: false }; },
    elements(p) { const cl = !p.state.act || p.fault === 'weld'; const o = []; if (cl && p.fault !== 'open1') o.push(Z(P(p, '11'), P(p, '12'), RC, 0, { tag: 'a' })); if (cl && p.fault !== 'open2') o.push(Z(P(p, '21'), P(p, '22'), RC, 0, { tag: 'b' })); return o; },
    press(p, ev) { if (ev.type === 'down') { p.state.act = !p.state.act; EL.emit('click', p); } },
    draw(p) {
      const act = p.state.act;
      return wl(20, 0, 20, 20) + wl(60, 0, 60, 20) + wl(20, 70, 20, 90) + wl(60, 70, 60, 90) + `<circle cx="40" cy="42" r="26" fill="#FDC300" stroke="#0e1626" stroke-width="2"/><circle cx="40" cy="42" r="20" fill="${act ? '#8c2a1c' : '#F55B41'}" stroke="#0e1626"/>` + (act ? '' : `<circle cx="33" cy="35" r="5" fill="#fff" opacity=".25"/>`) + T(40, 84, act ? 'LATCHED' : 'E-STOP', 'psub');
    },
  };

  /* ================= Sensors ================= */
  D.PHOTO = Object.assign({}, D.PROX, {
    name: ['Photoelectric sensor (3-wire)', 'سنسور ضوئي (3 سلك)'],
    info: ['Diffuse photoelectric sensor. BN = +24 V, BU = 0 V, BK = output. Click the sensor to place an object in front of it. Lens dirt or misalignment is the usual field failure.', 'سنسور ضوئي. البني = +24 فولت والأزرق = 0 والأسود = الخرج. اضغط عليه عشان تحط جسم قدامه. اتساخ العدسة أو عدم المحاذاة هو العطل المعتاد في الحقل.'],
    faults: [F0, ['dead', ['Dead', 'ميت']], ['dirty', ['Lens dirty (does not detect)', 'العدسة وسخة (مش بتكشف)']]],
    update(p, sim, dt) {
      const st = p.state, v = sim.vdc(P(p, 'BN'), P(p, 'BU'));
      st.sup = p.fault !== 'dead' && v >= 10 && v <= 30;
      const o = EL.eRead(sim, p.id, 'o');
      if (st.active && Math.abs(o.idc) > 0.3) st.scT = 2;
      if (st.scT > 0) { st.scT -= dt; st.active = false; return; }
      st.active = st.sup && p.fault !== 'dirty' && (st.target !== (p.props.logic === 'NC'));
    },
    draw(p) {
      const st = p.state;
      let r = `<line x1="15" y1="120" x2="15" y2="96" stroke="#8a5a2b" stroke-width="3"/><line x1="45" y1="120" x2="45" y2="96" stroke="#222" stroke-width="3"/><line x1="75" y1="120" x2="75" y2="96" stroke="#47BFD9" stroke-width="3"/>`;
      r += `<rect x="12" y="24" width="66" height="72" rx="6" fill="#4a2a2a" stroke="#7b879f" stroke-width="2"/><rect x="18" y="8" width="54" height="16" rx="3" fill="#F55B41" opacity=".5" stroke="#7b879f"/><circle cx="45" cy="16" r="5" fill="#F55B41"/>`;
      r += `<circle cx="45" cy="58" r="9" fill="${st.active ? '#FDC300' : '#1a2238'}" stroke="#0e1626"/>` + T(45, 90, p.props.out + ' ' + p.props.logic, 'psub');
      if (st.target) r += `<rect x="20" y="-12" width="50" height="12" fill="#c9ccd6" stroke="#0e1626"/>`;
      if (p.fault === 'dirty') r += `<path d="M30 12 q6 -4 10 2 q4 6 -2 8 q-8 2 -8 -10z" fill="#6b5a2a" opacity=".8"/>`;
      return r;
    },
  });
  D.PHOTO.diag = { kind: 'sensor' };
  D.PROX.diag = { kind: 'sensor' };

  D.PT100 = {
    cat: 'field', prefix: 'RT', name: ['PT100 temperature sensor', 'حساس حرارة PT100'], w: 70, h: 100, pcb: true,
    info: ['RTD: 100 ohm at 0 C, +0.385 ohm per degree. Measure with a multimeter in ohm with the circuit off. 138.5 ohm is 100 C. Open = infinite (wire break), shorted = below 60 ohm.', 'حساس مقاومة: 100 أوم عند 0 درجة وبيزيد 0.385 أوم لكل درجة. قيسه بالملتيميتر على أوم والدايرة فاصلة. 138.5 أوم = 100 درجة. مفتوح = مالانهاية (كابل مقطوع)، ماس = أقل من 60 أوم.'],
    pins: [pin('A', 'A', 20, 0, 'u'), pin('B', 'B', 50, 0, 'u')],
    props: [{ k: 'temp', label: ['Temperature (C)', 'الحرارة (درجة)'], t: 'num', min: -100, max: 600, step: 1, def: 25 }],
    faults: [F0, ['open', ['Open (wire break)', 'مفتوح (كابل مقطوع)']], ['short', ['Shorted', 'ماس']], ['drift', ['Drift +8 C', 'انحراف +8 درجة']]],
    diag: { kind: 'sensor' },
    elements(p) {
      if (p.fault === 'open') return [];
      const t = +p.props.temp + (p.fault === 'drift' ? 8 : 0), r = p.fault === 'short' ? 0.5 : 100 * (1 + 3.9083e-3 * t - 5.775e-7 * t * t);
      return [Z(P(p, 'A'), P(p, 'B'), Math.max(r, 1), 0, { tag: 'r' })];
    },
    draw(p) {
      const t = +p.props.temp, hot = Math.max(0, Math.min(1, t / 300));
      return wl(20, 0, 20, 20) + wl(50, 0, 50, 20) + `<rect x="14" y="20" width="42" height="14" rx="3" fill="#7b879f" stroke="#0e1626"/><rect x="28" y="34" width="14" height="52" rx="6" fill="#c9ccd6" stroke="#0e1626"/><rect x="31" y="${86 - 10 - 40 * hot}" width="8" height="${10 + 40 * hot}" rx="3" fill="rgb(${Math.round(80 + 170 * hot)},${Math.round(150 - 90 * hot)},${Math.round(220 - 170 * hot)})"/>` + T(35, 98, t + ' C', 'psub');
    },
  };
  D.PT100.cat = 'field';
})(typeof window !== 'undefined' ? window : globalThis);
