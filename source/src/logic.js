/* Tiny logic language for the PLC and MCU parts.
   One line per output:   Q0 = (I0 or Q0) and I1        Q1 = TON(Q0, 3)        OUT0 = AI0 > 5
   Names: I0.. (inputs, also DI0/IN0), Q0.. (outputs, also DQ0/OUT0), M0.. (memory), AI0.. (analog in).
   Operators: not, and, or, xor, + - * /, > < >= <= == !=. Functions: TON TOF TP RISE FALL SR BLINK ABS MIN MAX. */
(function (g) {
  const EL = g.EL;
  const L = (EL.logic = {});
  const E = (en, ar) => [en, ar];

  function tokenize(src) {
    const out = [];
    const re = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z_0-9]*)|(>=|<=|==|!=|[-+*/()<>=,]))/y;
    let i = 0;
    while (i < src.length) {
      re.lastIndex = i;
      const m = re.exec(src);
      if (!m) { if (/^\s*$/.test(src.slice(i))) break; throw { msg: E('Unexpected character "' + src.slice(i).trim()[0] + '"', 'حرف غير مفهوم "' + src.slice(i).trim()[0] + '"') }; }
      i = re.lastIndex;
      if (m[1] != null) out.push({ t: 'n', v: parseFloat(m[1]) });
      else if (m[2] != null) out.push({ t: 'id', v: m[2].toUpperCase() });
      else out.push({ t: 'op', v: m[3] });
    }
    return out;
  }

  const NAME = /^(?:(?:I|DI|IN)(\d+)|(?:Q|DQ|OUT)(\d+)|M(\d+)|AI(\d+)|AO(\d+)|TRUE|FALSE|HIGH|LOW)$/;
  function canon(id) {
    const m = NAME.exec(id);
    if (!m) return null;
    if (m[1] != null) return 'I' + m[1];
    if (m[2] != null) return 'Q' + m[2];
    if (m[3] != null) return 'M' + m[3];
    if (m[4] != null) return 'AI' + m[4];
    if (m[5] != null) return 'AO' + m[5];
    return id;
  }

  function parseLine(src, refs, nodes) {
    const tk = tokenize(src);
    let k = 0;
    const peek = () => tk[k], next = () => tk[k++];
    const isOp = (v) => peek() && peek().t === 'op' && peek().v === v;
    const isId = (v) => peek() && peek().t === 'id' && peek().v === v;
    function expr() { return orE(); }
    function orE() { let a = xorE(); while (isId('OR')) { next(); const b = xorE(), A = a; a = (e, dt) => (A(e, dt) || b(e, dt) ? 1 : 0); } return a; }
    function xorE() { let a = andE(); while (isId('XOR')) { next(); const b = andE(), A = a; a = (e, dt) => ((A(e, dt) ? 1 : 0) ^ (b(e, dt) ? 1 : 0)); } return a; }
    function andE() { let a = cmpE(); while (isId('AND')) { next(); const b = cmpE(), A = a; a = (e, dt) => (A(e, dt) && b(e, dt) ? 1 : 0); } return a; }
    function cmpE() {
      let a = sumE();
      const t = peek();
      if (t && t.t === 'op' && ['>', '<', '>=', '<=', '==', '!='].includes(t.v)) {
        next(); const b = sumE(), A = a, o = t.v;
        a = (e, dt) => { const x = A(e, dt), y = b(e, dt); return (o === '>' ? x > y : o === '<' ? x < y : o === '>=' ? x >= y : o === '<=' ? x <= y : o === '==' ? x === y : x !== y) ? 1 : 0; };
      }
      return a;
    }
    function sumE() { let a = termE(); while (isOp('+') || isOp('-')) { const o = next().v, b = termE(), A = a; a = o === '+' ? (e, dt) => A(e, dt) + b(e, dt) : (e, dt) => A(e, dt) - b(e, dt); } return a; }
    function termE() { let a = unE(); while (isOp('*') || isOp('/')) { const o = next().v, b = unE(), A = a; a = o === '*' ? (e, dt) => A(e, dt) * b(e, dt) : (e, dt) => { const d = b(e, dt); return d ? A(e, dt) / d : 0; }; } return a; }
    function unE() {
      if (isId('NOT')) { next(); const a = unE(); return (e, dt) => (a(e, dt) ? 0 : 1); }
      if (isOp('-')) { next(); const a = unE(); return (e, dt) => -a(e, dt); }
      return prim();
    }
    function prim() {
      const t = next();
      if (!t) throw { msg: E('Expression ends too early', 'الجملة ناقصة') };
      if (t.t === 'n') return () => t.v;
      if (t.t === 'op' && t.v === '(') { const a = expr(); if (!isOp(')')) throw { msg: E('Missing )', 'ناقص قوس )') }; next(); return a; }
      if (t.t === 'id') {
        if (isOp('(')) {
          next();
          const args = [];
          if (!isOp(')')) { args.push(expr()); while (isOp(',')) { next(); args.push(expr()); } }
          if (!isOp(')')) throw { msg: E('Missing ) after ' + t.v, 'ناقص قوس ) بعد ' + t.v) }; next();
          return func(t.v, args);
        }
        const c = canon(t.v);
        if (!c) throw { msg: E('Unknown name "' + t.v + '". Use I0, Q0, M0, AI0, AO0.', 'اسم غير معروف "' + t.v + '". استخدم I0 وQ0 وM0 وAI0 وAO0.') };
        if (c === 'TRUE' || c === 'HIGH') return () => 1;
        if (c === 'FALSE' || c === 'LOW') return () => 0;
        if (c[0] === 'I' || c[0] === 'Q' || c[0] === 'A') refs.read.add(c); else refs.read.add(c);
        return (e) => e.get(c);
      }
      throw { msg: E('Unexpected "' + t.v + '"', 'مش مفهوم "' + t.v + '"') };
    }
    function func(name, args) {
      const st = { t: 0, out: 0, prev: 0, on: false };
      nodes.push(st);
      const need = (n) => { if (args.length !== n) throw { msg: E(name + ' needs ' + n + ' argument(s)', name + ' محتاجة ' + n + ' قيم') }; };
      switch (name) {
        case 'TON': need(2); return (e, dt) => { const x = args[0](e, dt), T = args[1](e, dt); if (x) { st.t += dt; st.out = st.t >= T - 1e-9 ? 1 : 0; } else { st.t = 0; st.out = 0; } return st.out; };
        case 'TOF': need(2); return (e, dt) => { const x = args[0](e, dt), T = args[1](e, dt); if (x) { st.out = 1; st.t = 0; } else if (st.out) { st.t += dt; if (st.t >= T - 1e-9) st.out = 0; } return st.out; };
        case 'TP': need(2); return (e, dt) => { const x = args[0](e, dt) ? 1 : 0, T = args[1](e, dt); if (x && !st.prev && !st.on) { st.on = true; st.t = 0; } st.prev = x; if (st.on) { st.t += dt; if (st.t >= T - 1e-9) st.on = false; } return st.on ? 1 : 0; };
        case 'RISE': need(1); return (e, dt) => { const x = args[0](e, dt) ? 1 : 0, r = x && !st.prev ? 1 : 0; st.prev = x; return r; };
        case 'FALL': need(1); return (e, dt) => { const x = args[0](e, dt) ? 1 : 0, r = !x && st.prev ? 1 : 0; st.prev = x; return r; };
        case 'SR': need(2); return (e, dt) => { const s = args[0](e, dt), r = args[1](e, dt); if (r) st.out = 0; else if (s) st.out = 1; return st.out; };
        case 'BLINK': need(1); return (e, dt) => { const T = Math.max(0.1, args[0](e, dt)); return Math.floor(e.time / T) % 2 === 0 ? 1 : 0; };
        case 'ABS': need(1); return (e, dt) => Math.abs(args[0](e, dt));
        case 'MIN': need(2); return (e, dt) => Math.min(args[0](e, dt), args[1](e, dt));
        case 'MAX': need(2); return (e, dt) => Math.max(args[0](e, dt), args[1](e, dt));
        default: throw { msg: E('Unknown function ' + name + '. Available: TON TOF TP RISE FALL SR BLINK ABS MIN MAX', 'دالة غير معروفة ' + name + '. المتاح: TON TOF TP RISE FALL SR BLINK ABS MIN MAX') };
      }
    }
    // line: [target =] expr
    let target = null;
    if (tk.length >= 2 && tk[0].t === 'id' && tk[1].t === 'op' && tk[1].v === '=') {
      target = canon(tk[0].v);
      if (!target || !/^(?:[QM]|AO)\d+$/.test(target)) throw { msg: E('Left side must be an output (Q0, OUT0), analog output (AO0) or memory (M0)', 'الطرف الشمال لازم يكون خرج (Q0) أو خرج أنالوج (AO0) أو ميموري (M0)') };
      k = 2;
    }
    const fn = expr();
    if (k < tk.length) throw { msg: E('Extra text after the expression: "' + (tk[k].v) + '"', 'كلام زيادة بعد الجملة: "' + tk[k].v + '"') };
    if (!target) throw { msg: E('Write it as  Q0 = ...', 'اكتبها بالشكل  Q0 = ...') };
    refs.write.add(target);
    return { target, fn };
  }

  /* compile a whole program; never throws */
  L.compile = function (text) {
    const prog = { lines: [], errors: [], nodes: [], refs: { read: new Set(), write: new Set() }, text: String(text || '') };
    String(text || '').split(/\n|;/).forEach((raw, i) => {
      const s = raw.replace(/(\/\/|#).*$/, '').trim();
      if (!s) return;
      try { prog.lines.push(parseLine(s, prog.refs, prog.nodes)); } catch (e) { prog.errors.push({ line: i + 1, src: s, msg: e.msg || E(String(e), String(e)) }); }
    });
    return prog;
  };
  /* env: {get(name), set(name, value), time}. Runs every line once. */
  L.run = function (prog, env, dt) {
    for (const ln of prog.lines) {
      let v = ln.fn(env, dt);
      if (ln.target[0] === 'Q') v = v ? 1 : 0;
      env.set(ln.target, v);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
