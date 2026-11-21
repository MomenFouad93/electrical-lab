/* Ladder (LAD) for the compact PLC, Siemens-style addresses.
   Program JSON: { v:1, sym:{ 'I0.0':'Start' }, nets:[ { c:'comment', s:[items], o:[outputs] } ] }
   items:   {t:'NO'|'NC'|'P'|'N', a:'I0.0'}  {t:'CMP', op:'<', a:'MW10', b:'90'}  {t:'PAR', br:[[items],[items]]}
   outputs: {t:'COIL'|'SET'|'RST', a:'Q0.0'}  {t:'TON'|'TOF'|'TP', a:'T1', pt:5}  {t:'CTU', a:'C1', pv:10, r:'I0.3'}
            {t:'SCALE', in:'IW64', lo:0, hi:100, out:'MW10'}  {t:'MOVE', in:'50', out:'MW12'}  {t:'ADD'|'SUB'|'MUL'|'DIV', a, b, out}
   Bits: I0.0-I0.7, Q0.0-Q0.n, M0.0-M15.7, T0-T31 (timer done), C0-C15 (counter done), TRUE / FALSE.
   Words: MW0-MW62, IW64 / IW66 (analog in, 0-10 V = 0-27648), QW80 (analog out), T1 (elapsed s), C1 (count), numbers. */
(function (g) {
  const EL = g.EL;
  const LD = (EL.ladder = {});
  const E = (en, ar) => [en, ar];
  const FULL = 27648;
  LD.FULL = FULL;
  LD.CONTACTS = ['NO', 'NC', 'P', 'N', 'CMP'];
  LD.OUTS = ['COIL', 'SET', 'RST', 'TON', 'TOF', 'TP', 'CTU', 'SCALE', 'MOVE', 'ADD', 'SUB', 'MUL', 'DIV'];
  LD.OPS = ['<', '<=', '>', '>=', '==', '<>'];

  /* ---------- addresses ---------- */
  const BIT = /^(I|Q|M)(\d{1,2})\.([0-7])$/, TIM = /^T(\d{1,2})$/, CNT = /^C(\d{1,2})$/, MW = /^MW(\d{1,2})$/;
  LD.norm = (a) => String(a == null ? '' : a).trim().toUpperCase().replace(/\s+/g, '');
  LD.bitInfo = function (a, nQ) {
    a = LD.norm(a);
    if (a === 'TRUE' || a === 'FALSE') return { area: 'K', v: a === 'TRUE' };
    let m = BIT.exec(a);
    if (m) {
      const byte = +m[2], bit = +m[3];
      if (m[1] === 'I') return byte === 0 ? { area: 'I', i: bit } : null;
      if (m[1] === 'Q') return byte === 0 && bit < (nQ || 6) ? { area: 'Q', i: bit } : null;
      return byte < 16 ? { area: 'M', i: byte * 8 + bit } : null;
    }
    if ((m = TIM.exec(a)) && +m[1] < 32) return { area: 'T', k: 'T' + +m[1] };
    if ((m = CNT.exec(a)) && +m[1] < 16) return { area: 'C', k: 'C' + +m[1] };
    return null;
  };
  LD.wordInfo = function (a) {
    a = LD.norm(a);
    if (/^-?\d+(\.\d+)?$/.test(a)) return { area: 'K', v: +a };
    let m;
    if ((m = MW.exec(a)) && +m[1] <= 62) return { area: 'MW', k: +m[1] };
    if (a === 'IW64') return { area: 'IW', i: 0 };
    if (a === 'IW66') return { area: 'IW', i: 1 };
    if (a === 'QW80') return { area: 'QW', i: 0 };
    if ((m = TIM.exec(a)) && +m[1] < 32) return { area: 'TV', k: 'T' + +m[1] };
    if ((m = CNT.exec(a)) && +m[1] < 16) return { area: 'CV', k: 'C' + +m[1] };
    return null;
  };

  /* ---------- sanitising (files, pasted text, editor) ---------- */
  const S = (v, n) => String(v == null ? '' : v).replace(/[<>`"&]/g, '').slice(0, n);
  const num = (v, d, lo, hi) => { const x = +v; return isFinite(x) ? Math.max(lo, Math.min(hi, x)) : d; };
  function cleanItems(arr, depth) {
    if (!Array.isArray(arr)) return [];
    const out = [];
    for (const it of arr.slice(0, 24)) {
      if (!it || typeof it !== 'object') continue;
      if (it.t === 'PAR' && depth < 4) {
        const br = (Array.isArray(it.br) ? it.br : []).slice(0, 6).map((b) => cleanItems(b, depth + 1)).filter((b) => b.length);
        if (br.length) out.push({ t: 'PAR', br });
      } else if (it.t === 'CMP') out.push({ t: 'CMP', op: LD.OPS.includes(it.op) ? it.op : '<', a: S(it.a, 12), b: S(it.b, 12) });
      else if (['NO', 'NC', 'P', 'N'].includes(it.t)) out.push({ t: it.t, a: S(it.a, 12) });
    }
    return out;
  }
  function cleanOut(o) {
    if (!o || !LD.OUTS.includes(o.t)) return null;
    if (['COIL', 'SET', 'RST'].includes(o.t)) return { t: o.t, a: S(o.a, 12) };
    if (['TON', 'TOF', 'TP'].includes(o.t)) return { t: o.t, a: S(o.a, 4), pt: num(o.pt, 5, 0, 3600) };
    if (o.t === 'CTU') return { t: 'CTU', a: S(o.a, 4), pv: num(o.pv, 10, 0, 100000), r: S(o.r, 12) };
    if (o.t === 'SCALE') return { t: 'SCALE', in: S(o.in, 12), lo: num(o.lo, 0, -1e6, 1e6), hi: num(o.hi, 100, -1e6, 1e6), out: S(o.out, 12) };
    if (o.t === 'MOVE') return { t: 'MOVE', in: S(o.in, 12), out: S(o.out, 12) };
    return { t: o.t, a: S(o.a, 12), b: S(o.b, 12), out: S(o.out, 12) };
  }
  LD.sanitize = function (o) {
    const prog = { v: 1, sym: {}, nets: [] };
    if (!o || typeof o !== 'object') return prog;
    if (o.sym && typeof o.sym === 'object') for (const k of Object.keys(o.sym).slice(0, 200)) { const kk = LD.norm(S(k, 12)); if (kk && kk !== '__PROTO__') prog.sym[kk] = S(o.sym[k], 24); }
    for (const n of (Array.isArray(o.nets) ? o.nets : []).slice(0, 64)) {
      if (!n || typeof n !== 'object') continue;
      prog.nets.push({ c: S(n.c, 120), s: cleanItems(n.s, 0), o: (Array.isArray(n.o) ? n.o : []).slice(0, 6).map(cleanOut).filter(Boolean) });
    }
    return prog;
  };
  const CACHE = new WeakMap();
  LD.progOf = function (p) {
    const t = String(p.props.lad || '');
    let c = CACHE.get(p);
    if (!c || c.text !== t) {
      let prog;
      try { prog = LD.sanitize(t ? JSON.parse(t) : null); } catch (e) { prog = LD.sanitize(null); prog.bad = true; }
      c = { text: t, prog }; CACHE.set(p, c);
    }
    return c.prog;
  };
  LD.toText = (prog) => JSON.stringify(prog);

  /* ---------- memory access ---------- */
  function mem(st, nQ) {
    st.mb = st.mb || new Array(128).fill(0);
    st.mw = st.mw || {};
    st.tm = st.tm || {};
    st.ct = st.ct || {};
    st.ed = st.ed || {};
    return {
      bit(a) {
        const b = LD.bitInfo(a, nQ);
        if (!b) return 0;
        if (b.area === 'K') return b.v ? 1 : 0;
        if (b.area === 'I') return st.i[b.i] ? 1 : 0;
        if (b.area === 'Q') return st.q[b.i] ? 1 : 0;
        if (b.area === 'M') return st.mb[b.i] ? 1 : 0;
        if (b.area === 'T') return st.tm[b.k] && st.tm[b.k].q ? 1 : 0;
        if (b.area === 'C') return st.ct[b.k] && st.ct[b.k].q ? 1 : 0;
        return 0;
      },
      setBit(a, v) {
        const b = LD.bitInfo(a, nQ);
        if (!b) return;
        if (b.area === 'Q') st.q[b.i] = v ? 1 : 0;
        else if (b.area === 'M') st.mb[b.i] = v ? 1 : 0;
      },
      word(a) {
        const w = LD.wordInfo(a);
        if (!w) return 0;
        if (w.area === 'K') return w.v;
        if (w.area === 'MW') return st.mw[w.k] || 0;
        if (w.area === 'IW') return Math.round(Math.max(0, Math.min(10, st.ai[w.i] || 0)) / 10 * FULL);
        if (w.area === 'QW') return Math.round(((st.ao && st.ao[0]) || 0) / 10 * FULL);
        if (w.area === 'TV') return st.tm[w.k] ? Math.round(st.tm[w.k].et * 10) / 10 : 0;
        if (w.area === 'CV') return st.ct[w.k] ? st.ct[w.k].cv : 0;
        return 0;
      },
      setWord(a, v) {
        const w = LD.wordInfo(a);
        if (!w || !isFinite(v)) return;
        v = Math.max(-32768, Math.min(32767, Math.round(v)));
        if (w.area === 'MW') st.mw[w.k] = v;
        else if (w.area === 'QW' && st.ao) st.ao[0] = Math.max(0, Math.min(10, (v / FULL) * 10));
      },
    };
  }
  LD.mem = mem;
  function cmp(op, x, y) {
    switch (op) { case '<': return x < y; case '<=': return x <= y; case '>': return x > y; case '>=': return x >= y; case '==': return x === y; case '<>': return x !== y; }
    return false;
  }

  /* ---------- scan ---------- */
  const TRACE = new WeakMap(); // part -> [ {items:{path:{pin,pout,st,val}}, outs:[...], rung} ]
  LD.trace = (p) => TRACE.get(p) || [];
  LD.run = function (p, st, dt, circuit, nQ) {
    const prog = LD.progOf(p), M = mem(st, nQ), tr = [];
    let errs = prog.bad ? 1 : 0;
    prog.nets.forEach((n, ni) => {
      const t = { items: {}, outs: [], rung: false };
      const series = (items, pin, path) => {
        items.forEach((it, i) => {
          const key = path + i;
          let pout = false, s = false, val;
          if (it.t === 'PAR') {
            const outs = it.br.map((b, bi) => series(b, pin, key + '/' + bi + ':'));
            pout = outs.some(Boolean); s = pout;
          } else if (it.t === 'CMP') {
            const x = M.word(it.a), y = M.word(it.b);
            s = cmp(it.op, x, y); val = [x, y]; pout = pin && s;
          } else {
            const v = M.bit(it.a);
            if (it.t === 'NO') s = !!v;
            else if (it.t === 'NC') s = !v;
            else { const ek = ni + ':' + key, prev = st.ed[ek] || 0; st.ed[ek] = v; s = it.t === 'P' ? !!(v && !prev) : !!(!v && prev); }
            val = v; pout = pin && s;
          }
          t.items[key] = { pin, pout, st: s, val };
          pin = pout;
        });
        return pin;
      };
      const rung = series(n.s, true, '');
      t.rung = rung;
      n.o.forEach((o, oi) => {
        let eno = rung, val;
        switch (o.t) {
          case 'COIL': M.setBit(o.a, rung); break;
          case 'SET': if (rung) M.setBit(o.a, 1); break;
          case 'RST': if (rung) M.setBit(o.a, 0); break;
          case 'TON': case 'TOF': case 'TP': {
            const b = LD.bitInfo(o.a); if (!b || b.area !== 'T') { errs++; break; }
            const T = st.tm[b.k] || (st.tm[b.k] = { et: 0, q: 0, run: 0, pin: 0 }), pt = +o.pt || 0;
            if (o.t === 'TON') { if (rung) { T.et = Math.min(pt, T.et + dt); T.q = T.et >= pt ? 1 : 0; } else { T.et = 0; T.q = 0; } }
            else if (o.t === 'TOF') { if (rung) { T.q = 1; T.et = 0; } else if (T.q) { T.et = Math.min(pt, T.et + dt); if (T.et >= pt) T.q = 0; } }
            else { if (rung && !T.pin && !T.run) { T.run = 1; T.et = 0; } if (T.run) { T.et = Math.min(pt, T.et + dt); if (T.et >= pt) T.run = 0; } else if (!rung) T.et = 0; T.q = T.run ? 1 : 0; }
            T.pin = rung ? 1 : 0; T.pt = pt;
            eno = !!T.q; val = T.et;
            break;
          }
          case 'CTU': {
            const b = LD.bitInfo(o.a); if (!b || b.area !== 'C') { errs++; break; }
            const C = st.ct[b.k] || (st.ct[b.k] = { cv: 0, q: 0, pin: 0 });
            if (o.r && M.bit(o.r)) C.cv = 0; else if (rung && !C.pin) C.cv = Math.min(32767, C.cv + 1);
            C.pin = rung ? 1 : 0; C.q = C.cv >= (+o.pv || 0) ? 1 : 0; C.pv = +o.pv || 0;
            eno = !!C.q; val = C.cv;
            break;
          }
          case 'SCALE': {
            if (rung) { const x = Math.max(0, Math.min(FULL, M.word(o.in))); val = o.lo + (x / FULL) * (o.hi - o.lo); M.setWord(o.out, val); }
            val = [M.word(o.in), M.word(o.out)];
            break;
          }
          case 'MOVE': if (rung) M.setWord(o.out, M.word(o.in)); val = [M.word(o.in), M.word(o.out)]; break;
          default: {
            const x = M.word(o.a), y = M.word(o.b);
            if (rung) { let r = 0; if (o.t === 'ADD') r = x + y; else if (o.t === 'SUB') r = x - y; else if (o.t === 'MUL') r = x * y; else { if (y === 0) { eno = false; errs++; } else r = x / y; } if (eno) M.setWord(o.out, r); }
            val = [x, y, M.word(o.out)];
          }
        }
        t.outs[oi] = { pin: rung, eno, val };
      });
      tr.push(t);
    });
    TRACE.set(p, tr);
    st.err = errs;
    return tr;
  };

  /* ---------- where is the circuit around a PLC terminal ---------- */
  LD.wiredTo = function (c, p, pinId) {
    if (!c) return [];
    const ref = p.id + '.' + pinId, out = [];
    for (const w of c.wires) {
      if (w.cut) continue;
      const o = w.a === ref ? w.b : w.b === ref ? w.a : null;
      if (o) { const q = c.parts.find((x) => x.id === o.split('.')[0]); if (q && q !== p) out.push(q.tag + ':' + o.split('.')[1]); }
    }
    return out;
  };
  const pinOf = (b) => (b.area === 'I' ? 'I' + b.i : b.area === 'Q' ? 'Q' + b.i : null);

  /* ---------- who writes an address ---------- */
  function writers(prog, a) {
    a = LD.norm(a); const out = [];
    prog.nets.forEach((n, ni) => n.o.forEach((o) => {
      const w = ['COIL', 'SET', 'RST', 'TON', 'TOF', 'TP', 'CTU'].includes(o.t) ? LD.norm(o.a) : LD.norm(o.out);
      if (w === a) out.push(ni);
    }));
    return out;
  }
  LD.writers = writers;
  LD.symName = (prog, a) => (prog.sym && prog.sym[LD.norm(a)]) || '';
  const lab = (prog, a) => { const s = LD.symName(prog, a); return LD.norm(a) + (s ? ' (' + s + ')' : ''); };

  /* ---------- why is a rung FALSE ---------- */
  LD.why = function (p, ni, c) {
    const prog = LD.progOf(p), n = prog.nets[ni], t = LD.trace(p)[ni], st = p.state, nQ = (EL.defs[p.type].diag || {}).nQ || 6;
    if (!n || !t) return [];
    if (t.rung) {
      const qs = n.o.filter((o) => o.t === 'COIL' && /^Q/.test(LD.norm(o.a))).map((o) => LD.bitInfo(o.a, nQ)).filter(Boolean);
      if (qs.length) {
        const b0 = qs[0], rel = (EL.defs[p.type].diag || {}).rel, to = LD.wiredTo(c, p, 'Q' + b0.i).join(', ') || '-';
        return [{ ok: true, msg: E('Power flows through the whole rung: output Q0.' + b0.i + ' is ON. If the device on it does not work, measure at ' + p.tag + ':Q' + b0.i + (rel ? ' (the contact needs supply on C' + b0.i + ')' : '') + ', then the wire to ' + to + ', the coil, and its return to N / 0 V.', 'الباور معدي في السطر كله: المخرج Q0.' + b0.i + ' شغال. لو الجهاز اللي عليه مش شغال، قيس عند ' + p.tag + ':Q' + b0.i + (rel ? ' (الكونتاكت محتاج تغذية على C' + b0.i + ')' : '') + '، وبعدين السلك لـ' + to + '، والكويل، والرجوع لـN / 0 فولت.') }];
      }
      return [{ ok: true, msg: E('Power flows through the whole rung. The outputs are ON.', 'الباور معدي في السطر كله. المخارج شغالة.') }];
    }
    const lines = [];
    const conducts = (items, path) => items.every((it, i) => { const key = path + i; return it.t === 'PAR' ? it.br.some((b, bi) => conducts(b, key + '/' + bi + ':')) : !!(t.items[key] && t.items[key].st); });
    const opens = (items, path) => { const out = []; items.forEach((it, i) => { const key = path + i, r = t.items[key]; if (!r) return; if (it.t === 'PAR') { if (!it.br.some((b, bi) => conducts(b, key + '/' + bi + ':'))) out.push({ par: it, key }); } else if (!r.st) out.push({ it, r, key }); }); return out; };
    const walk = (items, path, depth) => {
      for (const o of opens(items, path)) {
        if (o.par) {
          lines.push({ path: o.key, par: true, msg: E('None of the ' + o.par.br.length + ' parallel paths is closed:', 'ولا مسار من الـ' + o.par.br.length + ' مسارات المتوازية مقفول:') });
          o.par.br.forEach((b, bi) => { const first = opens(b, o.key + '/' + bi + ':')[0]; if (first && first.it) lines.push(Object.assign({ path: first.key, sub: true }, explain(first.it, first.r))); else if (first && first.par) walk(b, o.key + '/' + bi + ':', depth + 1); });
        } else lines.push(Object.assign({ path: o.key }, explain(o.it, o.r)));
      }
    };
    function explain(it, r) {
      if (it.t === 'CMP') { const kb = LD.wordInfo(it.b) && LD.wordInfo(it.b).area === 'K', bb = kb ? '' : ', ' + lab(prog, it.b) + ' = ' + r.val[1], tr = wordTrail(it.a); return { msg: E(lab(prog, it.a) + ' = ' + r.val[0] + bb + ': "' + r.val[0] + ' ' + it.op + ' ' + r.val[1] + '" is false, so the compare blocks.' + tr[0], lab(prog, it.a) + ' = ' + r.val[0] + bb + ': "' + r.val[0] + ' ' + it.op + ' ' + r.val[1] + '" مش صح، فالمقارنة قافلة.' + tr[1]) }; }
      if (false) return { msg: E(lab(prog, it.a) + ' = ' + r.val[0] + ', ' + it.b + ' = ' + r.val[1] + ': "' + r.val[0] + ' ' + it.op + ' ' + r.val[1] + '" is false, so the compare blocks.', lab(prog, it.a) + ' = ' + r.val[0] + ' و' + it.b + ' = ' + r.val[1] + ': "' + r.val[0] + ' ' + it.op + ' ' + r.val[1] + '" مش صح، فالمقارنة قافلة.') };
      const a = LD.norm(it.a), b = LD.bitInfo(a, nQ), v = r.val ? 1 : 0;
      let base;
      if (it.t === 'NO') base = E(lab(prog, a) + ' = 0, so the NO contact is open.', lab(prog, a) + ' = 0، فالكونتاكت NO مفتوح.');
      else if (it.t === 'NC') base = E(lab(prog, a) + ' = 1, so the NC contact is open.', lab(prog, a) + ' = 1، فالكونتاكت NC مفتوح.');
      else base = E('Waiting for a ' + (it.t === 'P' ? '0 to 1' : '1 to 0') + ' change of ' + lab(prog, a) + '. An edge contact closes for one scan only.', 'مستني ' + lab(prog, a) + ' يتغير من ' + (it.t === 'P' ? '0 لـ1' : '1 لـ0') + '. كونتاكت الحافة بيقفل لدورة واحدة بس.');
      const hint = b ? source(a, b, v, it.t) : E('Unknown address.', 'عنوان مش معروف.');
      return { msg: [base[0] + ' ' + hint[0], base[1] + ' ' + hint[1]] };
    }
    function source(a, b, v, kind) {
      if (b.area === 'I') {
        const w = LD.wiredTo(c, p, 'I' + b.i), vin = st.i[b.i] ? '24 V' : '0 V';
        if (!w.length) return E('Nothing is wired to terminal I' + b.i + ' of ' + p.tag + '.', 'مفيش حاجة متوصلة على طرف I' + b.i + ' في ' + p.tag + '.');
        return E('The input sees ' + vin + ' from ' + w.join(', ') + '. Either that device really is in this state, or it or its wire to ' + p.tag + ':I' + b.i + ' is faulty: check with the meter.', 'المدخل شايف ' + vin + ' من ' + w.join('، ') + '. يا إما الجهاز ده فعلا في الحالة دي، يا إما هو أو سلكه لـ' + p.tag + ':I' + b.i + ' فيه عطل: افحص بالميتر.');
      }
      if (b.area === 'T') {
        const T = st.tm && st.tm[b.k], ws = writers(prog, a);
        if (!ws.length) return E('No timer box uses ' + a + '.', 'مفيش بلوك تايمر بيستخدم ' + a + '.');
        if (kind === 'NC' && v) return E('Timer ' + a + ' has finished (' + (T ? T.et.toFixed(1) : 0) + ' s), so its NC contact is open.', 'التايمر ' + a + ' خلص (' + (T ? T.et.toFixed(1) : 0) + ' ث)، فالكونتاكت NC بتاعه مفتوح.');
        return E('Timer ' + a + ' has run ' + (T ? T.et.toFixed(1) : '0.0') + ' of ' + (T && T.pt != null ? T.pt : '?') + ' s (enabled in network ' + (ws[0] + 1) + ').', 'التايمر ' + a + ' عدّى ' + (T ? T.et.toFixed(1) : '0.0') + ' من ' + (T && T.pt != null ? T.pt : '?') + ' ث (بيشتغل من نتورك ' + (ws[0] + 1) + ').');
      }
      if (b.area === 'Q' || b.area === 'M' || b.area === 'C') {
        const ws = writers(prog, a);
        const sets = setsOf(a);
        if (sets.set.length) return E('It is latched: set in network ' + sets.set.map((x) => x + 1).join(', ') + (sets.rst.length ? ', reset in network ' + sets.rst.map((x) => x + 1).join(', ') : ', and nothing resets it') + '. Remove the cause, then reset.', 'متثبت (لاتش): بيتعمل SET في نتورك ' + sets.set.map((x) => x + 1).join('، ') + (sets.rst.length ? ' وبيتعمل RESET في نتورك ' + sets.rst.map((x) => x + 1).join('، ') : ' ومفيش حاجة بتعمله ريست') + '. شيل السبب وبعدين اعمل ريست.');
        if (kind === 'NC' && v) return E('This is an interlock: it holds this rung off while ' + lab(prog, a) + ' is ON.', 'ده إنترلوك: بيمنع السطر ده طول ما ' + lab(prog, a) + ' شغال.');
        if (!ws.length) return E('Nothing in the program sets ' + a + '.', 'مفيش حاجة في البرنامج بتشغّل ' + a + '.');
        return E('It is set in network ' + ws.map((x) => x + 1).join(', ') + ': look there first.', 'بيتشغل في نتورك ' + ws.map((x) => x + 1).join('، ') + ': بص هناك الأول.');
      }
      return E('', '');
    }
    function setsOf(a) { a = LD.norm(a); const o = { set: [], rst: [] }; prog.nets.forEach((nn, k) => nn.o.forEach((x) => { if (LD.norm(x.a) === a && x.t === 'SET') o.set.push(k); if (LD.norm(x.a) === a && x.t === 'RST') o.rst.push(k); })); return o; }
    function wordTrail(a) {
      const w = LD.wordInfo(a); if (!w || w.area !== 'MW') return ['', ''];
      let src = null; prog.nets.forEach((nn, k) => nn.o.forEach((x) => { if ((x.t === 'SCALE' || x.t === 'MOVE') && LD.norm(x.out) === LD.norm(a)) src = { k, x }; }));
      if (!src) return ['', ''];
      const wi = LD.wordInfo(src.x.in);
      if (!wi || wi.area !== 'IW') return [' (' + LD.norm(a) + ' comes from network ' + (src.k + 1) + '.)', ' (' + LD.norm(a) + ' جاي من نتورك ' + (src.k + 1) + '.)'];
      const v = (st.ai[wi.i] || 0).toFixed(2), to = LD.wiredTo(c, p, 'AI' + wi.i).join(', ') || '-';
      return [' ' + LD.norm(a) + ' comes from network ' + (src.k + 1) + ' (' + src.x.t + ' of ' + LD.norm(src.x.in) + '): AI' + wi.i + ' reads ' + v + ' V from ' + to + '. If that does not match the real process, check the transmitter and its wiring.', ' ' + LD.norm(a) + ' جاي من نتورك ' + (src.k + 1) + ' (' + src.x.t + ' لـ' + LD.norm(src.x.in) + '): AI' + wi.i + ' بيقرا ' + v + ' فولت من ' + to + '. لو ده مش مطابق للعملية الحقيقية، افحص الترانسميتر وتوصيله.'];
    }
    walk(n.s, '', 0);
    lines.sort((x, y) => (x.par || x.sub ? 1 : 0) - (y.par || y.sub ? 1 : 0));
    if (!lines.length) lines.push({ msg: E('The rung is FALSE.', 'السطر FALSE.') });
    return lines;
  };

  /* ---------- static program check ---------- */
  LD.check = function (prog, p, c) {
    const out = [], nQ = (EL.defs[p.type].diag || {}).nQ || 6, rel = (EL.defs[p.type].diag || {}).rel;
    const add = (lvl, ni, msg) => out.push({ lvl, ni, msg });
    const reads = new Map(), coils = new Map();
    const noteRead = (a, ni) => { a = LD.norm(a); if (!reads.has(a)) reads.set(a, ni); };
    const checkBit = (a, ni, what) => { if (!LD.bitInfo(a, nQ)) add('bad', ni, E(what + ' "' + (a || '?') + '" is not a valid bit address (I0.0-I0.7, Q0.0-Q0.' + (nQ - 1) + ', M0.0-M15.7, T0-T31, C0-C15).', what + ' "' + (a || '?') + '" مش عنوان بت صحيح (I0.0-I0.7، Q0.0-Q0.' + (nQ - 1) + '، M0.0-M15.7، T0-T31، C0-C15).')); };
    const checkWord = (a, ni, what) => { if (!LD.wordInfo(a)) add('bad', ni, E(what + ' "' + (a || '?') + '" is not a number or word address (MW0-MW62, IW64, IW66, QW80, T1, C1).', what + ' "' + (a || '?') + '" مش رقم ولا عنوان وورد (MW0-MW62، IW64، IW66، QW80، T1، C1).')); };
    const walk = (items, ni) => items.forEach((it) => {
      if (it.t === 'PAR') { it.br.forEach((b) => walk(b, ni)); return; }
      if (it.t === 'CMP') { checkWord(it.a, ni, 'Compare'); checkWord(it.b, ni, 'Compare'); noteRead(it.a, ni); noteRead(it.b, ni); return; }
      checkBit(it.a, ni, 'Contact'); noteRead(it.a, ni);
    });
    prog.nets.forEach((n, ni) => {
      walk(n.s, ni);
      if (!n.o.length) add('warn', ni, E('Network ' + (ni + 1) + ' has no output, so it does nothing.', 'نتورك ' + (ni + 1) + ' مفيهوش خرج، فمش بيعمل حاجة.'));
      n.o.forEach((o) => {
        if (['COIL', 'SET', 'RST'].includes(o.t)) {
          const b = LD.bitInfo(o.a, nQ);
          if (!b || !['Q', 'M'].includes(b.area)) add('bad', ni, E('Coil "' + (o.a || '?') + '" must be an output Q0.0-Q0.' + (nQ - 1) + ' or a memory bit M.', 'الكويل "' + (o.a || '?') + '" لازم يكون مخرج Q0.0-Q0.' + (nQ - 1) + ' أو بت ميموري M.'));
          else if (o.t === 'COIL') { const k = LD.norm(o.a); if (!coils.has(k)) coils.set(k, []); coils.get(k).push(ni); }
        } else if (['TON', 'TOF', 'TP'].includes(o.t)) {
          const b = LD.bitInfo(o.a); if (!b || b.area !== 'T') add('bad', ni, E('Timer name must be T0-T31.', 'اسم التايمر لازم يكون T0-T31.'));
          if (!(o.pt > 0)) add('warn', ni, E('Timer ' + o.a + ' has a preset of 0 s.', 'التايمر ' + o.a + ' وقته 0 ث.'));
        } else if (o.t === 'CTU') {
          const b = LD.bitInfo(o.a); if (!b || b.area !== 'C') add('bad', ni, E('Counter name must be C0-C15.', 'اسم العداد لازم يكون C0-C15.'));
          if (o.r) { checkBit(o.r, ni, 'Counter reset'); noteRead(o.r, ni); }
        } else if (o.t === 'SCALE') {
          checkWord(o.in, ni, 'SCALE input'); noteRead(o.in, ni);
          if (!/^MW\d/.test(LD.norm(o.out)) && LD.norm(o.out) !== 'QW80') add('bad', ni, E('SCALE output must be a word MW or QW80.', 'خرج SCALE لازم يكون وورد MW أو QW80.'));
          if (o.hi === o.lo) add('warn', ni, E('SCALE high and low limits are equal.', 'الحد العالي والواطي في SCALE متساويين.'));
        } else {
          for (const k of o.t === 'MOVE' ? ['in'] : ['a', 'b']) { checkWord(o[k], ni, o.t); noteRead(o[k], ni); }
          if (!/^MW\d/.test(LD.norm(o.out)) && LD.norm(o.out) !== 'QW80') add('bad', ni, E(o.t + ' output must be a word MW or QW80.', 'خرج ' + o.t + ' لازم يكون وورد MW أو QW80.'));
          if (o.t === 'DIV' && LD.wordInfo(o.b) && LD.wordInfo(o.b).area === 'K' && +o.b === 0) add('bad', ni, E('Division by zero.', 'قسمة على صفر.'));
        }
      });
    });
    for (const [a, nets] of coils) if (nets.length > 1) add('warn', nets[1], E('Double coil: ' + a + ' is written in networks ' + nets.map((x) => x + 1).join(' and ') + '. Only the last one counts.', 'كويل مكرر: ' + a + ' مكتوب في نتورك ' + nets.map((x) => x + 1).join(' و') + '. الأخير بس هو اللي بيتنفذ.'));
    for (const [a, ni] of reads) {
      const b = LD.bitInfo(a, nQ), w = LD.wordInfo(a);
      if (b && ['Q', 'M', 'T', 'C'].includes(b.area) && !writers(prog, a).length) add('warn', ni, E(a + ' is read but nothing in the program sets it, so it stays 0.', a + ' بيتقري لكن مفيش حاجة في البرنامج بتشغله، فهيفضل 0.'));
      if (!b && w && w.area === 'MW' && !writers(prog, a).length) add('warn', ni, E(a + ' is read but never written, so it stays 0.', a + ' بيتقري ومحدش بيكتب فيه، فهيفضل 0.'));
      if (b && b.area === 'I' && c && !LD.wiredTo(c, p, 'I' + b.i).length) add('warn', ni, E(a + ' is used, but nothing is wired to terminal I' + b.i + ' of ' + p.tag + '.', a + ' مستخدم، لكن مفيش حاجة متوصلة على طرف I' + b.i + ' في ' + p.tag + '.'));
      if (w && w.area === 'IW' && c && !LD.wiredTo(c, p, 'AI' + w.i).length) add('warn', ni, E(a + ' reads analog input AI' + w.i + ', but nothing is wired to it.', a + ' بيقرا المدخل الأنالوج AI' + w.i + ' ومفيش حاجة متوصلة عليه.'));
    }
    if (c) for (const [a] of coils) {
      const b = LD.bitInfo(a, nQ);
      if (b && b.area === 'Q') {
        const wired = LD.wiredTo(c, p, 'Q' + b.i).length && (!rel || LD.wiredTo(c, p, 'C' + b.i).length);
        if (!wired) add('warn', coils.get(a)[0], E('Output ' + a + ' is used, but terminal ' + (rel ? 'Q' + b.i + ' / C' + b.i : 'Q' + b.i) + ' of ' + p.tag + ' is not wired, so it switches nothing.', 'المخرج ' + a + ' مستخدم، لكن طرف ' + (rel ? 'Q' + b.i + ' / C' + b.i : 'Q' + b.i) + ' في ' + p.tag + ' مش متوصل، فمش هيشغل حاجة.'));
      }
    }
    return out;
  };

  /* addresses used in a program (for the watch table) */
  LD.used = function (prog) {
    const s = new Set();
    const walk = (items) => items.forEach((it) => { if (it.t === 'PAR') it.br.forEach(walk); else if (it.t === 'CMP') { s.add(LD.norm(it.a)); s.add(LD.norm(it.b)); } else s.add(LD.norm(it.a)); });
    prog.nets.forEach((n) => { walk(n.s); n.o.forEach((o) => { for (const k of ['a', 'b', 'in', 'out', 'r']) if (o[k]) s.add(LD.norm(o[k])); }); });
    return [...s].filter((a) => a && !/^-?\d/.test(a) && a !== 'TRUE' && a !== 'FALSE').sort();
  };
})(typeof window !== 'undefined' ? window : globalThis);
