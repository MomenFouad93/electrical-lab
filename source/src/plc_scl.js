/* Ladder -> S7-1200 SCL external source (TIA Portal: External source files > Generate blocks from source) + PLC tag table.
   Pure: no DOM. EL.scl.convert(plcPart | lad JSON (object or text), circuit, { part, symbolic }) -> { scl, tags, warnings, beyond, cpu }
   EL.scl.tagsXlsx(tags) -> Uint8Array (.xlsx, sheet "PLC Tags" as TIA Portal imports it), EL.scl.tagsCsv(tags) -> text.
   Semantics follow src/ladder.js (EL.ladder.run): one rung result per network, every output of the network uses it. */
(function (g) {
  const EL = g.EL;
  const SC = (EL.scl = {});
  const E = (en, ar) => [en, ar];
  const LD = () => EL.ladder;
  const FULL = 27648;
  const S = (v, n) => String(v == null ? '' : v).replace(/[<>`"&]/g, '').slice(0, n);
  const num = (v, d, lo, hi) => { const x = +v; return isFinite(x) ? Math.max(lo, Math.min(hi, x)) : d; };
  const cmt = (s) => String(s == null ? '' : s).replace(/[\r\n\t]+/g, ' ').replace(/\(\*|\*\)/g, '').trim();

  /* ---------- the target CPU ---------- */
  SC.CPU = { nI: 14, nQ: 10, nAI: 2 };
  SC.cpuNote = function (part) {
    const rel = part && EL.defs[part.type] && EL.defs[part.type].diag && EL.defs[part.type].diag.rel;
    const v = rel ? 'DC/DC/RLY' : 'DC/DC/DC';
    return { name: 'CPU 1214C ' + v, text: 'S7-1200 CPU 1214C ' + v + ' (14 DI / 10 DO / 2 AI)' };
  };

  /* ---------- read and clean the program (same limits as EL.ladder.sanitize; unknown things are kept to be reported) ---------- */
  function cleanItems(arr, depth) {
    const out = [];
    if (!Array.isArray(arr)) return out;
    for (const it of arr.slice(0, 24)) {
      if (!it || typeof it !== 'object') continue;
      if (it.t === 'PAR') {
        if (depth >= 4) { out.push({ t: 'UNK', what: 'PAR (nested deeper than 4)' }); continue; }
        const br = (Array.isArray(it.br) ? it.br : []).slice(0, 6).map((b) => cleanItems(b, depth + 1)).filter((b) => b.length);
        if (br.length) out.push({ t: 'PAR', br });
      } else if (['NO', 'NC', 'P', 'N', 'CMP'].includes(it.t)) {
        const k = LD().sanitize({ nets: [{ s: [it], o: [] }] }).nets[0].s[0];
        if (k) out.push(k);
      } else out.push({ t: 'UNK', what: S(it.t, 12) || '?' });
    }
    return out;
  }
  function cleanOut(o) {
    if (!o || typeof o !== 'object') return null;
    if (LD().OUTS.includes(o.t)) return LD().sanitize({ nets: [{ s: [], o: [o] }] }).nets[0].o[0] || null;
    if (o.t === 'CTD') return { t: 'CTD', a: S(o.a, 4), pv: num(o.pv, 10, 0, 100000), ld: S(o.ld, 12) };
    if (o.t === 'CTUD') return { t: 'CTUD', a: S(o.a, 4), pv: num(o.pv, 10, 0, 100000), cd: S(o.cd, 12), r: S(o.r, 12), ld: S(o.ld, 12) };
    return { t: 'UNK', what: S(o.t, 12) || '?' };
  }
  SC.read = function (src) {
    let raw = src;
    if (src && src.props) raw = String(src.props.lad || '');
    if (typeof raw === 'string') { try { raw = raw ? JSON.parse(raw) : null; } catch (e) { return { v: 1, sym: {}, nets: [], bad: true }; } }
    const prog = { v: 1, sym: LD().sanitize(raw).sym, nets: [] };
    if (!raw || typeof raw !== 'object') return prog;
    for (const n of (Array.isArray(raw.nets) ? raw.nets : []).slice(0, 64)) {
      if (!n || typeof n !== 'object') continue;
      prog.nets.push({ c: S(n.c, 120), s: cleanItems(n.s, 0), o: (Array.isArray(n.o) ? n.o : []).slice(0, 6).map(cleanOut).filter(Boolean) });
    }
    return prog;
  };

  /* ---------- names ---------- */
  const RESERVED = new Set('AND OR XOR NOT MOD TRUE FALSE IF THEN ELSE ELSIF END_IF CASE OF END_CASE FOR TO BY DO END_FOR WHILE END_WHILE REPEAT UNTIL END_REPEAT EXIT CONTINUE RETURN GOTO BEGIN END VAR END_VAR VAR_TEMP VAR_INPUT VAR_OUTPUT VAR_IN_OUT REGION END_REGION FUNCTION FUNCTION_BLOCK DATA_BLOCK ORGANIZATION_BLOCK TYPE STRUCT BOOL INT DINT REAL WORD BYTE TIME MAIN FB_MAIN IDB_MAIN EN ENO'.split(' '));
  SC.tagName = function (s) {
    s = String(s == null ? '' : s).normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/%/g, ' pct ').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40).replace(/_+$/, '');
    if (!/[A-Za-z]/.test(s)) return '';
    if (/^\d/.test(s)) s = 'X_' + s;
    if (RESERVED.has(s.toUpperCase())) s += '_tag';
    return s;
  };
  function timeLit(sec) {
    let ms = Math.max(0, Math.round((+sec || 0) * 1000));
    const hh = Math.floor(ms / 3600000); ms -= hh * 3600000;
    const mm = Math.floor(ms / 60000); ms -= mm * 60000;
    const ss = Math.floor(ms / 1000); ms -= ss * 1000;
    const s = (hh ? hh + 'H' : '') + (mm ? mm + 'M' : '') + (ss ? ss + 'S' : '') + (ms ? ms + 'MS' : '');
    return 'T#' + (s || '0MS');
  }
  SC.timeLit = timeLit;

  /* ---------- convert ---------- */
  SC.convert = function (src, circuit, opts) {
    opts = opts || {};
    const part = opts.part || (src && src.props ? src : null);
    const io = part ? LD().ioOf(part) : { nI: 8, nQ: 6, rel: false };
    const prog = src && src.nets && !src.props ? SC.read(src) : SC.read(src);
    const symbolic = opts.symbolic !== false;
    const warnings = [];
    const warn = (lvl, ni, msg) => warnings.push({ lvl, ni, msg });
    const bitI = (a) => LD().bitInfo(a, io.nQ, io.nI);
    const wordI = (a) => LD().wordInfo(a);
    if (prog.bad) warn('todo', -1, E('The ladder program text could not be read (broken JSON): nothing was converted.', 'نص برنامج اللادر مش مقروء (JSON بايظ): مفيش حاجة اتحولت.'));

    /* -- pass 1: tags (I, Q, M, MW, IW, QW) and instances (timers, counters) -- */
    const tagMap = new Map(); // addr -> tag
    const used = new Set();
    const addUse = (a) => { a = LD().norm(a); if (a) used.add(a); };
    const walkU = (items) => items.forEach((it) => { if (it.t === 'PAR') it.br.forEach(walkU); else if (it.t === 'CMP') { addUse(it.a); addUse(it.b); } else if (it.a) addUse(it.a); });
    prog.nets.forEach((n) => { walkU(n.s); n.o.forEach((o) => { for (const k of ['a', 'b', 'in', 'out', 'r', 'cd', 'ld']) if (o[k]) addUse(o[k]); }); });
    const wired = (pin) => (part && circuit ? LD().wiredTo(circuit, part, pin) : []);
    const ioAddrs = [];
    if (part) {
      for (let i = 0; i < io.nI; i++) if (wired('I' + i).length) ioAddrs.push(LD().ioAddr('I', i));
      for (let i = 0; i < io.nQ; i++) if (wired('Q' + i).length) ioAddrs.push(LD().ioAddr('Q', i));
      if (wired('AI0').length) ioAddrs.push('IW64');
      if (wired('AI1').length) ioAddrs.push('IW66');
      if (wired('AO0').length) ioAddrs.push('QW80');
    }
    const order = (a) => { const b = bitI(a), w = wordI(a); if (b) return ({ I: 0, Q: 1, M: 2 })[b.area] * 1000 + b.i; if (w) return w.area === 'IW' ? 3000 + w.i : w.area === 'QW' ? 3100 : 3200 + (w.k || 0); return 9999; };
    const tagAddrs = [...new Set([...used, ...ioAddrs])].filter((a) => { const b = bitI(a), w = wordI(a); return (b && ['I', 'Q', 'M'].includes(b.area)) || (w && ['MW', 'IW', 'QW'].includes(w.area)); }).sort((x, y) => order(x) - order(y));
    const taken = new Set();
    const pinOf = (a) => { const b = bitI(a), w = wordI(a); if (b && b.area === 'I') return 'I' + b.i; if (b && b.area === 'Q') return 'Q' + b.i; if (w && w.area === 'IW') return 'AI' + w.i; if (w && w.area === 'QW') return 'AO0'; return null; };
    const tags = [];
    for (const a of tagAddrs) {
      const sym = prog.sym[a] || '', pin = pinOf(a), wl = pin ? wired(pin).filter((x) => !/:(pos|neg|L|N|PE|com)$/.test(x)) : [];
      const devs = [...new Set(wl.map((x) => x.split(':')[0]))];
      let base = SC.tagName(sym) || SC.tagName(devs.join('_')) || ('Tag_' + a.replace('.', '_'));
      let name = base, k = 2;
      while (taken.has(name.toLowerCase())) name = base + '_' + k++;
      taken.add(name.toLowerCase());
      const isBit = !!bitI(a);
      const comment = cmt([sym, devs.length ? 'wired: ' + wl.join(', ') : ''].filter(Boolean).join(' | ')).slice(0, 200);
      const t = { name, type: isBit ? 'Bool' : 'Int', addr: '%' + a, abs: a, comment };
      tags.push(t); tagMap.set(a, t);
    }
    const ref = (a) => { const t = tagMap.get(LD().norm(a)); return t ? (symbolic ? '"' + t.name + '"' : t.addr) : null; };

    // instances
    const inst = new Map(); // 'T1' -> { type, sym, kinds:Set }
    const instOf = (k, type, ni) => {
      let x = inst.get(k);
      if (!x) { x = { type, sym: prog.sym[k] || '', set: false }; inst.set(k, x); }
      if (type && !x.set) { x.type = type; x.set = true; }
      else if (type && x.type !== type) warn('warn', ni, E(k + ' is used as ' + x.type + ' and as ' + type + ': the code declares it once as ' + x.type + '. Use another number for the second box.', k + ' مستخدم كـ' + x.type + ' وكـ' + type + ': الكود بيعرّفه مرة واحدة كـ' + x.type + '. استخدم رقم تاني للبلوك التاني.'));
      return x;
    };
    const TT = { TON: 'TON_TIME', TOF: 'TOF_TIME', TP: 'TP_TIME', CTU: 'CTU_INT', CTD: 'CTD_INT', CTUD: 'CTUD_INT' };
    prog.nets.forEach((n, ni) => n.o.forEach((o) => {
      if (['TON', 'TOF', 'TP'].includes(o.t)) { const b = LD().bitInfo(o.a); if (b && b.area === 'T') instOf(b.k, TT[o.t], ni); }
      if (['CTU', 'CTD', 'CTUD'].includes(o.t)) { const b = LD().bitInfo(o.a); if (b && b.area === 'C') instOf(b.k, TT[o.t], ni); }
    }));
    // timers / counters only read: declare them so the code compiles; they stay 0 like in the lab
    for (const a of used) { const b = LD().bitInfo(a); if (b && (b.area === 'T' || b.area === 'C') && !inst.has(b.k)) { instOf(b.k, b.area === 'T' ? 'TON_TIME' : 'CTU_INT', -1); inst.get(b.k).set = false; inst.get(b.k).never = true; } }

    /* -- pass 2: code -- */
    const body = [];
    const edges = [];
    let needNorm = false, needReal = false;
    const todo = (ni, what, msgEn, msgAr) => { warn('todo', ni, E(msgEn, msgAr)); return '// TODO: ' + cmt(what); };

    function bitExpr(a, ni) {
      a = LD().norm(a);
      const b = bitI(a);
      if (!b) { warn('todo', ni, E('Network ' + (ni + 1) + ': "' + (a || '?') + '" is not a valid bit address for this CPU: it was written as FALSE (TODO in the code).', 'نتورك ' + (ni + 1) + ': "' + (a || '?') + '" مش عنوان بت صحيح للـCPU ده: اتكتب FALSE (TODO في الكود).')); return { e: 'FALSE (* TODO: ' + cmt(a || '?') + ' *)' }; }
      if (b.area === 'K') return { e: b.v ? 'TRUE' : 'FALSE' };
      if (b.area === 'T' || b.area === 'C') { const x = inst.get(b.k); return { e: '#' + b.k + (x && x.type === 'CTUD_INT' ? '.QU' : '.Q') }; }
      return { e: ref(a) || '%' + a };
    }
    function wordExpr(a, ni) {
      a = LD().norm(a);
      const w = wordI(a);
      if (!w) { warn('todo', ni, E('Network ' + (ni + 1) + ': "' + (a || '?') + '" is not a number or word address: it was written as 0 (TODO in the code).', 'نتورك ' + (ni + 1) + ': "' + (a || '?') + '" مش رقم ولا عنوان وورد: اتكتب 0 (TODO في الكود).')); return { e: '0 (* TODO: ' + cmt(a || '?') + ' *)', ty: 'INT' }; }
      if (w.area === 'K') { const v = w.v; if (Number.isInteger(v)) return Math.abs(v) <= 32767 ? { e: String(v), ty: 'INT' } : { e: String(v), ty: 'DINT' }; return { e: String(v), ty: 'REAL' }; }
      if (w.area === 'TV') { needReal = true; return { e: 'DINT_TO_REAL(TIME_TO_DINT(#' + w.k + '.ET)) / 1000.0', ty: 'REAL', paren: true }; }
      if (w.area === 'CV') return { e: '#' + w.k + '.CV', ty: 'INT' };
      return { e: ref(a) || '%' + a, ty: 'INT' };
    }
    const RANK = { INT: 0, DINT: 1, REAL: 2 };
    function conv(x, ty) {
      if (x.ty === ty) return x.paren ? '(' + x.e + ')' : x.e;
      if (/^-?\d+(\.\d+)?$/.test(x.e)) return ty === 'REAL' ? (x.e.includes('.') ? x.e : x.e + '.0') : x.e;
      return x.ty + '_TO_' + ty + '(' + x.e + ')';
    }
    const toInt = (x) => (x.ty === 'INT' ? (x.paren ? '(' + x.e + ')' : x.e) : x.ty + '_TO_INT(' + x.e + ')');
    function unify(list) { const ty = list.reduce((m, x) => (RANK[x.ty] > RANK[m] ? x.ty : m), 'INT'); return { ty, e: list.map((x) => conv(x, ty)) }; }
    function wordDest(a, ni, what) {
      a = LD().norm(a);
      const w = wordI(a);
      if (!w || !['MW', 'QW'].includes(w.area)) return null;
      return ref(a) || '%' + a;
    }

    function series(items, ni, path) {
      const terms = [];
      items.forEach((it, i) => {
        const key = path + i;
        if (it.t === 'PAR') {
          const br = it.br.map((b, bi) => { const t = series(b, ni, key + '/' + bi + ':'); return t.length > 1 ? '(' + t.join(' AND ') + ')' : t.length ? t[0] : 'TRUE'; });
          terms.push(br.length > 1 ? '(' + br.join(' OR ') + ')' : br[0]);
        } else if (it.t === 'CMP') {
          const u = unify([wordExpr(it.a, ni), wordExpr(it.b, ni)]);
          const op = it.op === '==' ? '=' : it.op;
          terms.push('(' + u.e[0] + ' ' + op + ' ' + u.e[1] + ')');
        } else if (it.t === 'NO') terms.push(bitExpr(it.a, ni).e);
        else if (it.t === 'NC') terms.push('NOT ' + bitExpr(it.a, ni).e);
        else if (it.t === 'P' || it.t === 'N') {
          const nm = (it.t === 'P' ? 'P_N' : 'N_N') + (ni + 1) + '_' + (edges.filter((x) => x.ni === ni).length + 1);
          edges.push({ ni, name: nm, type: it.t === 'P' ? 'R_TRIG' : 'F_TRIG', clk: bitExpr(it.a, ni).e, addr: LD().norm(it.a) });
          terms.push('#' + nm + '.Q');
        } else {
          warn('todo', ni, E('Network ' + (ni + 1) + ': the element "' + it.what + '" has no SCL translation: it was written as FALSE (TODO in the code).', 'نتورك ' + (ni + 1) + ': العنصر "' + it.what + '" ملوش ترجمة SCL: اتكتب FALSE (TODO في الكود).'));
          terms.push('FALSE (* TODO: ' + cmt(it.what) + ' *)');
        }
      });
      return terms;
    }

    prog.nets.forEach((n, ni) => {
      const L = [];
      L.push('// Network ' + (ni + 1) + ': ' + (cmt(n.c) || '(no comment)'));
      const e0 = edges.length;
      const terms = series(n.s, ni, '');
      for (const ed of edges.slice(e0)) L.push('#' + ed.name + '(CLK := ' + ed.clk + ');');
      let rung = terms.length ? terms.join(' AND ') : 'TRUE';
      if (rung.length > 90 && terms.length > 1) rung = terms.join('\n        AND ');
      L.push('#rung := ' + rung + ';');
      if (!n.o.length) L.push('// (this network has no output)');
      let gated = [];
      const flush = () => { if (gated.length) { L.push('IF #rung THEN'); for (const x of gated) L.push(...x.split('\n').map((y) => '    ' + y)); L.push('END_IF;'); gated = []; } };
      n.o.forEach((o) => {
        if (o.t === 'COIL' || o.t === 'SET' || o.t === 'RST') {
          const a = LD().norm(o.a), b = bitI(a);
          if (!b || !['Q', 'M'].includes(b.area)) { flush(); L.push(todo(ni, o.t + ' ' + (a || '?'), 'Network ' + (ni + 1) + ': ' + o.t + ' "' + (a || '?') + '" is not an output Q or memory bit M of this CPU (TODO in the code).', 'نتورك ' + (ni + 1) + ': ' + o.t + ' "' + (a || '?') + '" مش مخرج Q ولا بت ميموري M في الـCPU ده (TODO في الكود).')); return; }
          const d = ref(a) || '%' + a;
          if (o.t === 'COIL') { flush(); L.push(d + ' := #rung;'); }
          else gated.push(d + ' := ' + (o.t === 'SET' ? 'TRUE' : 'FALSE') + ';   // ' + (o.t === 'SET' ? 'set (S)' : 'reset (R)'));
          return;
        }
        if (['TON', 'TOF', 'TP'].includes(o.t)) {
          flush();
          const b = LD().bitInfo(o.a);
          if (!b || b.area !== 'T') { L.push(todo(ni, o.t + ' ' + (o.a || '?'), 'Network ' + (ni + 1) + ': timer name "' + (o.a || '?') + '" must be T0-T31 (TODO in the code).', 'نتورك ' + (ni + 1) + ': اسم التايمر "' + (o.a || '?') + '" لازم يكون T0-T31 (TODO في الكود).')); return; }
          L.push('#' + b.k + '(IN := #rung, PT := ' + timeLit(o.pt) + ');   // ' + o.t + ' ' + o.pt + ' s');
          return;
        }
        if (['CTU', 'CTD', 'CTUD'].includes(o.t)) {
          flush();
          const b = LD().bitInfo(o.a);
          if (!b || b.area !== 'C') { L.push(todo(ni, o.t + ' ' + (o.a || '?'), 'Network ' + (ni + 1) + ': counter name "' + (o.a || '?') + '" must be C0-C15 (TODO in the code).', 'نتورك ' + (ni + 1) + ': اسم العداد "' + (o.a || '?') + '" لازم يكون C0-C15 (TODO في الكود).')); return; }
          let pv = Math.round(+o.pv || 0);
          if (pv > 32767) { warn('warn', ni, E('Counter ' + b.k + ': preset ' + pv + ' is above 32767 (INT): written as 32767.', 'العداد ' + b.k + ': القيمة ' + pv + ' أكبر من 32767 (INT): اتكتبت 32767.')); pv = 32767; }
          const opt = (a) => (a ? bitExpr(a, ni).e : 'FALSE');
          if (o.t === 'CTU') L.push('#' + b.k + '(CU := #rung, R := ' + opt(o.r) + ', PV := ' + pv + ');   // up counter');
          else if (o.t === 'CTD') L.push('#' + b.k + '(CD := #rung, LD := ' + opt(o.ld) + ', PV := ' + pv + ');   // down counter');
          else L.push('#' + b.k + '(CU := #rung, CD := ' + opt(o.cd) + ', R := ' + opt(o.r) + ', LD := ' + opt(o.ld) + ', PV := ' + pv + ');   // up/down counter');
          return;
        }
        if (o.t === 'SCALE') {
          const d = wordDest(o.out, ni);
          if (!d) { flush(); L.push(todo(ni, 'SCALE OUT ' + (o.out || '?'), 'Network ' + (ni + 1) + ': SCALE output "' + (o.out || '?') + '" must be MW or QW80 (TODO in the code).', 'نتورك ' + (ni + 1) + ': خرج SCALE "' + (o.out || '?') + '" لازم يكون MW أو QW80 (TODO في الكود).')); return; }
          needNorm = true;
          const x = wordExpr(o.in, ni), xi = x.ty === 'INT' ? x.e : toInt(x);
          const lo = Number.isInteger(o.lo) ? o.lo + '.0' : String(o.lo), hi = Number.isInteger(o.hi) ? o.hi + '.0' : String(o.hi);
          gated.push('#norm := NORM_X(MIN := 0, VALUE := LIMIT(MN := 0, IN := ' + xi + ', MX := ' + FULL + '), MAX := ' + FULL + ');   // 0-27648 -> 0.0-1.0\n' +
            '#scaled := SCALE_X(MIN := ' + lo + ', VALUE := #norm, MAX := ' + hi + ');   // -> ' + o.lo + '..' + o.hi + '\n' + d + ' := REAL_TO_INT(#scaled);');
          return;
        }
        if (o.t === 'MOVE') {
          const d = wordDest(o.out, ni);
          if (!d) { flush(); L.push(todo(ni, 'MOVE OUT ' + (o.out || '?'), 'Network ' + (ni + 1) + ': MOVE output "' + (o.out || '?') + '" must be MW or QW80 (TODO in the code).', 'نتورك ' + (ni + 1) + ': خرج MOVE "' + (o.out || '?') + '" لازم يكون MW أو QW80 (TODO في الكود).')); return; }
          gated.push(d + ' := ' + toInt(wordExpr(o.in, ni)) + ';   // MOVE');
          return;
        }
        if (['ADD', 'SUB', 'MUL', 'DIV'].includes(o.t)) {
          const d = wordDest(o.out, ni);
          if (!d) { flush(); L.push(todo(ni, o.t + ' OUT ' + (o.out || '?'), 'Network ' + (ni + 1) + ': ' + o.t + ' output "' + (o.out || '?') + '" must be MW or QW80 (TODO in the code).', 'نتورك ' + (ni + 1) + ': خرج ' + o.t + ' "' + (o.out || '?') + '" لازم يكون MW أو QW80 (TODO في الكود).')); return; }
          const xa = wordExpr(o.a, ni), xb = wordExpr(o.b, ni);
          if (o.t === 'DIV') {
            const u = unify([xa, xb, { ty: 'REAL', e: '0.0' }]);
            const bz = conv(xb, xb.ty);
            gated.push('IF ' + bz + ' <> 0 THEN   // DIV: no result on a division by zero\n    ' + d + ' := REAL_TO_INT(' + u.e[0] + ' / ' + u.e[1] + ');\nEND_IF;');
          } else {
            const u = unify([xa, xb]), op = { ADD: '+', SUB: '-', MUL: '*' }[o.t];
            const ex = u.e[0] + ' ' + op + ' ' + u.e[1];
            gated.push(d + ' := ' + (u.ty === 'INT' ? ex : u.ty + '_TO_INT(' + ex + ')') + ';   // ' + o.t);
          }
          return;
        }
        flush();
        L.push(todo(ni, 'output ' + (o.what || o.t), 'Network ' + (ni + 1) + ': the output "' + (o.what || o.t) + '" has no SCL translation (TODO in the code).', 'نتورك ' + (ni + 1) + ': الخرج "' + (o.what || o.t) + '" ملوش ترجمة SCL (TODO في الكود).'));
      });
      flush();
      body.push(L);
    });

    /* -- the CPU limits -- */
    const beyond = [];
    for (const a of [...new Set([...used, ...ioAddrs])]) {
      const b = bitI(a), w = wordI(a);
      if (b && b.area === 'I' && b.i >= SC.CPU.nI) beyond.push(a);
      if (b && b.area === 'Q' && b.i >= SC.CPU.nQ) beyond.push(a);
      if (w && w.area === 'QW') beyond.push(a);
    }
    for (const a of beyond) {
      if (a === 'QW80') warn('warn', -1, E('QW80 (analog output): the CPU 1214C has no built-in analog output. Add a signal board with 1 analog output and check its address in the device configuration.', 'QW80 (خرج أنالوج): الـCPU 1214C مفيهوش خرج أنالوج. ضيف سيجنال بورد بخرج أنالوج واحد واتأكد من عنوانه في إعدادات الجهاز.'));
      else warn('warn', -1, E(a + ' is beyond the 14 DI / 10 DO of the CPU 1214C: add an I/O module.', a + ' أكبر من الـ14 مدخل / 10 مخرج بتوع الـCPU 1214C: ضيف موديول I/O.'));
    }
    if (io.rel && used.size) warn('info', -1, E('Relay outputs: in the lab each output has its own contact Qn-Cn. On the 1214C DC/DC/RLY the relays share the commons 1L (Q0.0-Q0.4) and 2L (Q0.5-Q1.1): check the wiring diagram.', 'مخارج الريلاي: في المعمل كل مخرج له كونتاكت لوحده Qn-Cn. في الـ1214C DC/DC/RLY الريليهات بتشترك في الكومن 1L (Q0.0-Q0.4) و2L (Q0.5-Q1.1): راجع رسم التوصيل.'));
    // on the real CPU MWn is the bytes MBn and MBn+1, the same memory as Mn.0-Mn.7 and M(n+1).0-M(n+1).7 (separate in the lab)
    const mBytes = new Set([...used].map((a) => bitI(a)).filter((b) => b && b.area === 'M').map((b) => b.i >> 3));
    for (const a of used) { const w = wordI(a); if (w && w.area === 'MW' && (mBytes.has(w.k) || mBytes.has(w.k + 1))) warn('warn', -1, E(a + ' uses the same memory bytes (MB' + w.k + ', MB' + (w.k + 1) + ') as the M bits of the program: on the real CPU they overwrite each other. Move the word (for example MW20).', a + ' بيستخدم نفس بايتات الميموري (MB' + w.k + ' و MB' + (w.k + 1) + ') اللي فيها بتات M في البرنامج: في الـCPU الحقيقي هيكتبوا على بعض. انقل الوورد (مثلا MW20).')); }
    for (const [k, x] of inst) if (x.never) warn('warn', -1, E(k + ' is read but no box drives it, so it stays 0 (declared as ' + x.type + ').', k + ' بيتقري ومفيش بلوك بيشغله، فهيفضل 0 (متعرّف كـ' + x.type + ').'));

    /* -- assemble the external source -- */
    const cpu = SC.cpuNote(part);
    const who = part ? part.tag + ' (' + ((EL.defs[part.type] && EL.defs[part.type].name && EL.defs[part.type].name[0]) || part.type) + ')' : 'ladder program';
    const o = [];
    o.push('FUNCTION_BLOCK "FB_Main"');
    o.push("{ S7_Optimized_Access := 'TRUE' }");
    o.push('VERSION : 0.1');
    o.push('//Generated by Electrical Lab from the ladder of ' + cmt(who) + ', ' + prog.nets.length + ' networks.');
    o.push('//Target: ' + cpu.text + '. Addresses: ' + (symbolic ? 'PLC tag names (import the tag table first).' : 'absolute (%I, %Q, %M, %MW, %IW).'));
    o.push('//Analog: 0-10 V = 0-27648 like the lab. Generated offline: compile and test it before you run a machine.');
    o.push('   VAR ');
    const ik = [...inst.keys()].sort((x, y) => (x[0] === y[0] ? +x.slice(1) - +y.slice(1) : x < y ? -1 : 1));
    for (const k of ik) { const x = inst.get(k); o.push('      ' + k + ' : ' + x.type + ';   // ' + (x.type.startsWith('C') ? 'IEC counter' : 'IEC timer') + ' (multi-instance)' + (x.sym ? ': ' + cmt(x.sym) : '') + (x.never ? ' (not driven)' : '')); }
    for (const ed of edges) o.push('      ' + ed.name + ' : ' + ed.type + ';   // ' + (ed.type === 'R_TRIG' ? 'rising' : 'falling') + ' edge of ' + ed.addr + ' in network ' + (ed.ni + 1));
    o.push('   END_VAR');
    o.push('');
    o.push('   VAR_TEMP ');
    o.push('      rung : Bool;   // result of the contacts of the current network');
    if (needNorm) { o.push('      norm : Real;   // NORM_X result 0.0-1.0'); o.push('      scaled : Real;   // SCALE_X result'); }
    o.push('   END_VAR');
    o.push('');
    o.push('');
    o.push('BEGIN');
    body.forEach((L, i) => { if (i) o.push('\t'); for (const l of L) o.push('\t' + l.replace(/\n/g, '\n\t')); });
    if (!body.length) o.push('\t// (empty program)');
    o.push('END_FUNCTION_BLOCK');
    o.push('');
    o.push('DATA_BLOCK "IDB_Main"');
    o.push("{ S7_Optimized_Access := 'TRUE' }");
    o.push('VERSION : 0.1');
    o.push('NON_RETAIN');
    o.push('"FB_Main"');
    o.push('');
    o.push('BEGIN');
    o.push('');
    o.push('END_DATA_BLOCK');
    o.push('');
    o.push('ORGANIZATION_BLOCK "Main"');
    o.push('TITLE = "Main Program Sweep (Cycle)"');
    o.push("{ S7_Optimized_Access := 'TRUE' }");
    o.push('VERSION : 0.1');
    o.push('');
    o.push('BEGIN');
    o.push('\t// OB1: call the converted ladder every scan');
    o.push('\t"IDB_Main"();');
    o.push('END_ORGANIZATION_BLOCK');
    o.push('');
    const scl = o.join('\r\n').replace(/\r?\n/g, '\r\n');
    return { scl, tags, warnings, beyond, cpu, symbolic, nets: prog.nets.length };
  };

  /* ---------- tag table: CSV and XLSX (sheet "PLC Tags", columns as TIA Portal exports them) ---------- */
  SC.COLS = ['Name', 'Path', 'Data Type', 'Logical Address', 'Comment', 'Hmi Visible', 'Hmi Accessible', 'Hmi Writeable', 'Typeobject ID', 'Version ID'];
  SC.rows = (tags) => tags.map((t) => [t.name, 'Default tag table', t.type, t.addr, t.comment || '', 'True', 'True', 'True', '', '']);
  SC.tagsCsv = function (tags) {
    const q = (v) => { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",;\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return '﻿' + [SC.COLS].concat(SC.rows(tags)).map((r) => r.map(q).join(',')).join('\r\n') + '\r\n';
  };

  // CRC32 + a zip writer with stored (uncompressed) entries
  let CRC_T = null;
  SC.crc32 = function (u8) {
    if (!CRC_T) { CRC_T = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c >>> 0; } }
    let c = 0xffffffff;
    for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const utf8 = (s) => new TextEncoder().encode(s);
  SC.zip = function (files, date) {
    const d = date || new Date(2026, 0, 1, 12, 0, 0);
    const dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;
    const parts = [], central = [];
    let off = 0;
    for (const f of files) {
      const name = utf8(f.name), data = typeof f.data === 'string' ? utf8(f.data) : f.data, crc = SC.crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, dt, true); lh.setUint16(12, dd, true); lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), name, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, dt, true); ch.setUint16(14, dd, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, name.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, off, true);
      central.push(new Uint8Array(ch.buffer), name);
      off += 30 + name.length + data.length;
    }
    const cdSize = central.reduce((s, x) => s + x.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(4, 0, true); end.setUint16(6, 0, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, off, true); end.setUint16(20, 0, true);
    const all = parts.concat(central, [new Uint8Array(end.buffer)]);
    const out = new Uint8Array(all.reduce((s, x) => s + x.length, 0));
    let p = 0; for (const x of all) { out.set(x, p); p += x.length; }
    return out;
  };
  const xe = (s) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const colName = (i) => String.fromCharCode(65 + i);
  SC.tagsXlsx = function (tags, sheet) {
    sheet = sheet || 'PLC Tags';
    const rows = [SC.COLS].concat(SC.rows(tags));
    const ss = [], ssi = new Map();
    const si = (v) => { v = String(v); if (!ssi.has(v)) { ssi.set(v, ss.length); ss.push(v); } return ssi.get(v); };
    let sd = '';
    rows.forEach((r, ri) => {
      sd += '<row r="' + (ri + 1) + '">';
      r.forEach((v, ci) => { if (v === '' || v == null) return; sd += '<c r="' + colName(ci) + (ri + 1) + '" t="s"' + (ri === 0 ? ' s="1"' : '') + '><v>' + si(v) + '</v></c>'; });
      sd += '</row>';
    });
    const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', RNS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n';
    const files = [
      { name: '[Content_Types].xml', data: X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>' },
      { name: '_rels/.rels', data: X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: X + '<workbook xmlns="' + NS + '" xmlns:r="' + RNS + '"><sheets><sheet name="' + xe(sheet) + '" sheetId="1" r:id="rId1"/></sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>' },
      { name: 'xl/worksheets/sheet1.xml', data: X + '<worksheet xmlns="' + NS + '" xmlns:r="' + RNS + '"><dimension ref="A1:' + colName(SC.COLS.length - 1) + rows.length + '"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols><col min="1" max="1" width="26" customWidth="1"/><col min="2" max="2" width="20" customWidth="1"/><col min="3" max="4" width="15" customWidth="1"/><col min="5" max="5" width="48" customWidth="1"/><col min="6" max="10" width="15" customWidth="1"/></cols><sheetData>' + sd + '</sheetData></worksheet>' },
      { name: 'xl/styles.xml', data: X + '<styleSheet xmlns="' + NS + '"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' },
      { name: 'xl/sharedStrings.xml', data: X + '<sst xmlns="' + NS + '" count="' + ss.length + '" uniqueCount="' + ss.length + '">' + ss.map((v) => '<si><t xml:space="preserve">' + xe(v) + '</t></si>').join('') + '</sst>' },
    ];
    return SC.zip(files);
  };

  /* file name safe part (PLC tag) */
  SC.fileBase = (part) => (SC.tagName(part && part.tag) || 'PLC');
})(typeof window !== 'undefined' ? window : globalThis);
