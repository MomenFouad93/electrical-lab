/* Plant: process simulator linked to the electrical circuit.
   A plant lives in circuit.plant = { units: [...], pipes: [...] }.
   Pressures in bar (gauge), flows in L/s internally (shown as L/min), temperatures in C.
   Each tick: build a linear network (conductances + pump heads + fixed pressures), solve it,
   fix one-way branches and cavitating pumps, integrate tanks, then push sensor values into
   the linked circuit parts (floats, transmitters, pressure / flow switches, PT100) and read
   actuators back (motor speed for pumps, solenoid position, heater power). */
(function (g) {
  const EL = g.EL;
  const PL = (EL.plant = {});
  const E = (en, ar) => [en, ar];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const G_PIPE = 40, G_BIG = 80, G_FIX = 1e6;

  /* ---------------- unit definitions ---------------- */
  // ports: [id, x, y, dir]; dir is where the pipe leaves: l r u d
  const U = (PL.defs = {});
  const sw4 = () => [{ n: 'LSHH', l: 95, t: '' }, { n: 'LSH', l: 80, t: '' }, { n: 'LSL', l: 20, t: '' }, { n: 'LSLL', l: 8, t: '' }];
  U.SUPPLY = {
    pre: 'S', name: E('Water source / mains', 'مصدر مية / خط عمومي'), w: 100, h: 80,
    info: E('Fixed-pressure water source: a sump, a well or the city line. Set its pressure and temperature.', 'مصدر مية بضغط ثابت: بيارة أو بير أو خط المدينة. اظبط الضغط والحرارة.'),
    ports: [['out', 100, 40, 'r']],
    props: { bar: 0.3, temp: 20 },
  };
  U.DRAIN = {
    pre: 'D', name: E('Drain', 'صرف'), w: 80, h: 70,
    info: E('Open drain at 0 bar. Water only goes in.', 'صرف مفتوح على 0 بار. المية بتدخل بس.'),
    ports: [['in', 0, 24, 'l']], props: {},
  };
  U.TANK = {
    pre: 'T', name: E('Tank with level instruments', 'تانك بأجهزة مستوى'), w: 180, h: 240,
    info: E('Open tank. Top inlets are at the tank height, so a pump must lift the water up there. Bottom outlets are at the water head pressure. Link a level transmitter, up to 4 float switches, a heater and a temperature sensor to parts on the panel.', 'تانك مفتوح. المداخل من فوق على ارتفاع التانك، فالطلمبة لازم ترفع المية لحد هناك. والمخارج من تحت عليها ضغط عمود المية. اربط ترانسميتر مستوى ولحد 4 فلوتات وسخان وحساس حرارة بأجهزة في اللوحة.'),
    ports: [['inA', 40, 0, 'u'], ['inB', 140, 0, 'u'], ['out1', 180, 222, 'r'], ['out2', 0, 222, 'l']],
    props: { vol: 300, hgt: 1.5, lvl0: 40, t0: 20, lt: '', tt: '', htr: '' },
    init(u) { if (!Array.isArray(u.props.sw)) u.props.sw = sw4(); u.state = { v: u.props.vol * u.props.lvl0 / 100, T: u.props.t0, ovf: 0 }; },
  };
  U.PUMP = {
    pre: 'P', name: E('Centrifugal pump', 'طلمبة طرد مركزي'), w: 170, h: 100,
    info: E('Driven by a motor on the panel (link its tag). Head grows with speed squared. Closing the discharge lowers the flow and the motor current. An empty suction makes it cavitate (dry running).', 'بتشتغل بموتور في اللوحة (اربط اسمه). الضغط بيزيد مع مربع السرعة. قفل الطرد بيقلل التصرف وتيار الموتور. لو السحب فاضي بتعمل كافيتيشن (تشغيل على الناشف).'),
    ports: [['in', 170, 66, 'r'], ['out', 112, 0, 'u']],
    props: { motor: '', head: 15, qmax: 120, flip: false },
  };
  U.VALVE = {
    pre: 'V', name: E('Manual valve', 'محبس يدوي'), w: 80, h: 64,
    info: E('Ball valve. Tap it in Test mode to open or close it.', 'محبس بلف. اضغط عليه في وضع الاختبار عشان تفتحه أو تقفله.'),
    ports: [['a', 0, 44, 'l'], ['b', 80, 44, 'r']],
    props: { open: true, kv: 60 },
    init(u) { u.state = { pos: u.props.open ? 1 : 0 }; },
  };
  U.SOLV = {
    pre: 'YV', name: E('Solenoid valve (linked)', 'سولينويد فالف (مربوط)'), w: 80, h: 80,
    info: E('Normally closed. Opens when the linked solenoid on the panel is energised.', 'مقفول طبيعي. بيفتح لما السولينويد المربوط في اللوحة ياخد كهرباء.'),
    ports: [['a', 0, 60, 'l'], ['b', 80, 60, 'r']],
    props: { sol: '', kv: 60 },
  };
  U.CHECK = {
    pre: 'NRV', name: E('Check valve (NRV)', 'محبس عدم رجوع'), w: 70, h: 44,
    info: E('Lets water pass only in the arrow direction.', 'بيعدي المية في اتجاه السهم بس.'),
    ports: [['a', 0, 22, 'l'], ['b', 70, 22, 'r']], props: { kv: 80 },
  };
  U.FILTER = {
    pre: 'F', name: E('Filter (sand / cartridge)', 'فلتر (رمل / كارتريدج)'), w: 80, h: 150,
    info: E('Gets dirty with the water that passes. Watch the pressure drop rise, then backwash or change the cartridge.', 'بيتسد مع المية اللي بتعدي. راقب فرق الضغط وهو بيزيد، وبعدين اعمل باك واش أو غيّر الكارتريدج.'),
    ports: [['in', 0, 26, 'l'], ['out', 80, 130, 'r']],
    props: { kind: 'sand', dirt: 1 },
    init(u) { u.state = { clog: 0 }; },
  };
  U.RO = {
    pre: 'RO', name: E('RO membrane', 'ممبرين RO'), w: 220, h: 80,
    info: E('Reverse osmosis. Water passes the membrane only above the osmotic pressure (about 2 bar). Permeate rises with feed pressure and temperature. The reject valve sets the recovery.', 'تناضح عكسي. المية بتعدي الممبرين بس فوق الضغط الأسموزي (حوالي 2 بار). المية النقية بتزيد مع ضغط الدخول والحرارة. محبس الريجكت بيظبط نسبة الاسترجاع.'),
    ports: [['in', 0, 40, 'l'], ['perm', 220, 18, 'r'], ['rej', 220, 62, 'r']],
    props: { rej: 35, us: 600 },
  };
  U.HX = {
    pre: 'E', name: E('Plate heat exchanger', 'مبادل حراري ألواح'), w: 120, h: 120,
    info: E('Hot side top-left to bottom-right, cold side bottom-left to top-right (counter-flow). Both sides need flow to exchange heat.', 'الناحية السخنة من فوق شمال لتحت يمين، والباردة من تحت شمال لفوق يمين (عكس الاتجاه). لازم يكون فيه سريان في الناحيتين عشان يحصل تبادل.'),
    ports: [['hin', 0, 22, 'l'], ['cout', 120, 22, 'r'], ['cin', 0, 98, 'l'], ['hout', 120, 98, 'r']],
    props: { eff: 0.7 },
  };
  U.PT = {
    pre: 'PT', name: E('Pressure transmitter (linked)', 'ترانسميتر ضغط (مربوط)'), w: 60, h: 80,
    info: E('Sends the line pressure to a linked transmitter on the panel (TX 4-20 mA or 0-10 V).', 'بيبعت ضغط الخط لترانسميتر مربوط في اللوحة (4-20 ملي أو 0-10 فولت).'),
    ports: [['a', 0, 64, 'l'], ['b', 60, 64, 'r']], props: { tx: '', range: 10 },
  };
  U.PS = {
    pre: 'PS', name: E('Pressure switch (linked)', 'بريشر سويتش (مربوط)'), w: 60, h: 80,
    info: E('Operates the linked pressure switch on the panel when the line pressure is above the set point.', 'بيشغّل البريشر سويتش المربوط في اللوحة لما ضغط الخط يعدي نقطة الضبط.'),
    ports: [['a', 0, 64, 'l'], ['b', 60, 64, 'r']], props: { sw: '', set: 1.0 },
  };
  U.FS = {
    pre: 'FS', name: E('Flow switch (linked)', 'فلو سويتش (مربوط)'), w: 60, h: 70,
    info: E('Operates the linked flow switch on the panel when the flow is above the set point.', 'بيشغّل الفلو سويتش المربوط في اللوحة لما التصرف يعدي نقطة الضبط.'),
    ports: [['a', 0, 54, 'l'], ['b', 60, 54, 'r']], props: { sw: '', set: 10 },
  };
  U.TT = {
    pre: 'TT', name: E('Temperature sensor (linked)', 'حساس حرارة (مربوط)'), w: 60, h: 80,
    info: E('Sends the line temperature to a PT100 or a transmitter on the panel.', 'بيبعت حرارة الخط لـPT100 أو ترانسميتر في اللوحة.'),
    ports: [['a', 0, 64, 'l'], ['b', 60, 64, 'r']], props: { tx: '', range: 100 },
  };
  U.PG = {
    pre: 'PI', name: E('Pressure gauge', 'مانومتر ضغط'), w: 60, h: 80,
    info: E('Local dial gauge. Read the pressure at this point of the line.', 'عداد ضغط محلي. اقرا الضغط عند النقطة دي من الخط.'),
    ports: [['a', 0, 64, 'l'], ['b', 60, 64, 'r']], props: { range: 10 },
  };
  U.FM = {
    pre: 'FI', name: E('Flow meter', 'عداد تصرف'), w: 90, h: 60,
    info: E('Shows the flow in L/min and the total volume.', 'بيعرض التصرف باللتر في الدقيقة والحجم الكلي.'),
    ports: [['a', 0, 44, 'l'], ['b', 90, 44, 'r']], props: {},
    init(u) { u.state = { tot: 0 }; },
  };
  U.JUNC = {
    pre: 'J', name: E('Tee / cross', 'تي / كروس'), w: 36, h: 36,
    info: E('Joins up to 4 pipes at one point.', 'بيوصل لحد 4 مواسير في نقطة واحدة.'),
    ports: [['a', 0, 18, 'l'], ['b', 36, 18, 'r'], ['c', 18, 0, 'u'], ['d', 18, 36, 'd']], props: {},
  };
  PL.order = ['SUPPLY', 'TANK', 'PUMP', 'VALVE', 'SOLV', 'CHECK', 'FILTER', 'RO', 'HX', 'PG', 'FM', 'PT', 'PS', 'FS', 'TT', 'JUNC', 'DRAIN'];

  /* ---------------- model helpers ---------------- */
  PL.newPlant = () => ({ units: [], pipes: [] });
  PL.portsOf = function (u) {
    const d = U[u.type];
    if (!d) return [];
    return d.ports.map(([id, x, y, dir]) => (u.props.flip ? { id, x: d.w - x, y, dir: dir === 'l' ? 'r' : dir === 'r' ? 'l' : dir } : { id, x, y, dir }));
  };
  PL.portPos = function (u, id) { const q = PL.portsOf(u).find((p) => p.id === id); return q ? { x: u.x + q.x, y: u.y + q.y, dir: q.dir } : null; };
  PL.nextTag = function (pl, type) {
    const pre = U[type].pre; let n = 1;
    const used = new Set(pl.units.map((u) => u.tag));
    while (used.has(pre + n)) n++;
    return pre + n;
  };
  PL.add = function (pl, type, x, y, props, tag) {
    const d = U[type];
    const u = { id: 'U' + (PL._uid = (PL._uid || 0) + 1), type, x: Math.round(x || 0), y: Math.round(y || 0), tag: tag || PL.nextTag(pl, type), props: Object.assign(JSON.parse(JSON.stringify(d.props)), props ? JSON.parse(JSON.stringify(props)) : {}), state: {} };
    while (pl.units.some((o) => o.id === u.id)) u.id = 'U' + (PL._uid = PL._uid + 1);
    if (d.init) d.init(u);
    pl.units.push(u);
    return u;
  };
  PL.byTag = (pl, tag) => pl.units.find((u) => u.tag === tag);
  PL.connect = function (pl, a, b) {
    if (a === b) return null;
    if (pl.pipes.some((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a))) return null;
    const p = { id: 'L' + (PL._lid = (PL._lid || 0) + 1), a, b };
    while (pl.pipes.some((o) => o.id === p.id)) p.id = 'L' + (PL._lid = PL._lid + 1);
    pl.pipes.push(p);
    return p;
  };
  PL.remove = function (pl, id) {
    pl.units = pl.units.filter((u) => u.id !== id);
    pl.pipes = pl.pipes.filter((p) => p.a.split('.')[0] !== id && p.b.split('.')[0] !== id);
  };
  /* build from a compact spec: units [tag,type,x,y,props], pipes ['T1.out1','V1.a'] */
  PL.build = function (spec) {
    const pl = PL.newPlant();
    for (const [tag, type, x, y, props] of spec.units) PL.add(pl, type, x, y, props, tag);
    for (const [a, b] of spec.pipes) {
      const ra = PL.ref(pl, a), rb = PL.ref(pl, b);
      if (!ra || !rb) throw new Error('bad pipe ' + a + ' -> ' + b);
      PL.connect(pl, ra, rb);
    }
    return pl;
  };
  PL.ref = function (pl, s) {
    const i = s.lastIndexOf('.'), u = PL.byTag(pl, s.slice(0, i)), port = s.slice(i + 1);
    if (!u || !PL.portsOf(u).some((p) => p.id === port)) return null;
    return u.id + '.' + port;
  };
  PL.refLabel = function (pl, ref) { const [id, port] = ref.split('.'); const u = pl.units.find((x) => x.id === id); return u ? u.tag + ':' + port : ref; };

  /* ---------------- serialisation with validation ---------------- */
  const SAFE = (s, n) => String(s == null ? '' : s).replace(/[<>&"'`]/g, '').slice(0, n || 16);
  PL.sanitize = function (o) {
    const pl = PL.newPlant();
    if (!o || !Array.isArray(o.units)) return pl;
    for (const q of o.units.slice(0, 120)) {
      if (!q || !U[q.type]) continue;
      const d = U[q.type];
      const u = { id: SAFE(q.id, 12) || 'U' + (PL._uid = (PL._uid || 0) + 1), type: q.type, x: +q.x || 0, y: +q.y || 0, tag: SAFE(q.tag, 12) || d.pre, props: JSON.parse(JSON.stringify(d.props)), state: {} };
      if (d.init) d.init(u);
      const pr = q.props || {};
      for (const k of Object.keys(u.props)) if (pr[k] != null && typeof pr[k] === typeof u.props[k]) u.props[k] = typeof u.props[k] === 'string' ? SAFE(pr[k], 16) : typeof u.props[k] === 'number' ? (isFinite(pr[k]) ? pr[k] : u.props[k]) : pr[k];
      if (u.type === 'TANK' && Array.isArray(pr.sw)) u.props.sw = pr.sw.slice(0, 4).map((s) => ({ n: SAFE(s && s.n, 10), l: clamp(+(s && s.l) || 0, 0, 100), t: SAFE(s && s.t, 12) }));
      if (q.state && typeof q.state === 'object') for (const k of Object.keys(q.state)) if (typeof q.state[k] === 'number' && isFinite(q.state[k])) u.state[k] = q.state[k];
      const n = +String(u.id).slice(1); if (n > (PL._uid || 0)) PL._uid = n;
      pl.units.push(u);
    }
    const ids = new Set(pl.units.map((u) => u.id));
    for (const p of (o.pipes || []).slice(0, 400)) {
      if (!p || typeof p.a !== 'string' || typeof p.b !== 'string') continue;
      if (!ids.has(p.a.split('.')[0]) || !ids.has(p.b.split('.')[0])) continue;
      const w = PL.connect(pl, SAFE(p.a, 24), SAFE(p.b, 24));
      if (w && p.id) { w.id = SAFE(p.id, 12); const n = +String(w.id).slice(1); if (n > (PL._lid || 0)) PL._lid = n; }
    }
    return pl;
  };

  /* ---------------- links to the circuit ---------------- */
  const part = (c, tag) => (tag ? c.parts.find((p) => p.tag === tag) : null);
  PL.linkTypes = {
    motor: ['MOT3', 'MOT1', 'MOTDC'], sol: ['SOL'], htr: ['HTR'],
    float: ['FLOAT', 'LIM', 'PRESS', 'FLOW'], tx: ['TX', 'TXV'], temp: ['PT100', 'TX', 'TXV'], ps: ['PRESS', 'LIM', 'FLOAT', 'FLOW'], fs: ['FLOW', 'LIM', 'FLOAT', 'PRESS'],
  };
  function setAct(p, on) { if (p && p.state) p.state.act = !!on; }
  function setProc(p, pc) { if (!p) return; if (p.type === 'PT100') return; p.props.proc = Math.round(clamp(pc, 0, 100) * 10) / 10; }
  function motorSpeed(p) {
    if (!p || !p.state) return 0;
    let w = Math.abs(p.state.w || 0);
    if (p.type === 'MOT3' && p.state.seqdir === -1 && w > 0.05) w = -w; // reversed phase sequence
    return w;
  }

  /* ---------------- linear solver ---------------- */
  function gauss(A, b) {
    const n = b.length;
    for (let i = 0; i < n; i++) {
      let mx = i;
      for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[mx][i])) mx = r;
      if (mx !== i) { const t = A[i]; A[i] = A[mx]; A[mx] = t; const tb = b[i]; b[i] = b[mx]; b[mx] = tb; }
      const piv = A[i][i];
      if (Math.abs(piv) < 1e-14) continue;
      for (let r = i + 1; r < n; r++) {
        const f = A[r][i] / piv;
        if (!f) continue;
        const Ar = A[r], Ai = A[i];
        for (let k = i; k < n; k++) Ar[k] -= f * Ai[k];
        b[r] -= f * b[i];
      }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let s = b[i];
      for (let k = i + 1; k < n; k++) s -= A[i][k] * x[k];
      x[i] = Math.abs(A[i][i]) < 1e-14 ? 0 : s / A[i][i];
    }
    return x;
  }

  /* network: nodes (port refs + internal '#'), branches, fixed nodes */
  function buildNet(c, pl) {
    const nodes = new Map(), br = [], fixed = [];
    const N = (k) => { if (!nodes.has(k)) nodes.set(k, nodes.size); return nodes.get(k); };
    const B = (a, b, G, o) => { const x = Object.assign({ a: N(a), b: N(b), G, H: 0, one: false }, o || {}); br.push(x); return x; };
    const F = (k, P) => fixed.push({ n: N(k), P });
    for (const u of pl.units) {
      const id = u.id, p = (port) => id + '.' + port, st = u.state || (u.state = {}), pr = u.props;
      for (const q of PL.portsOf(u)) N(p(q.id));
      switch (u.type) {
        case 'SUPPLY': F(id + '#s', +pr.bar || 0); B(id + '#s', p('out'), 8, { u, k: 'src' }); break; // a real line or sump cannot give unlimited flow
        case 'DRAIN': F(id + '#d', 0); B(p('in'), id + '#d', G_BIG, { u, k: 'drain', one: true }); break;
        case 'TANK': {
          const h = (st.v / Math.max(1, +pr.vol)) * (+pr.hgt || 1);
          F(id + '#top', (+pr.hgt || 1) * 0.0981); F(id + '#bot', h * 0.0981); // top inlets sit at the tank height
          B(p('inA'), id + '#top', G_BIG, { u, k: 'tin', one: true });
          B(p('inB'), id + '#top', G_BIG, { u, k: 'tin', one: true });
          const empty = st.v <= 0.05;
          B(id + '#bot', p('out1'), G_BIG, { u, k: 'tout', oneRev: empty });
          B(id + '#bot', p('out2'), G_BIG, { u, k: 'tout', oneRev: empty });
          break;
        }
        case 'PUMP': {
          const m = part(c, pr.motor), s = motorSpeed(m);
          st.s = s;
          const H = (+pr.head || 10) * 0.0981 * s * s * (s < 0 ? 0.35 : 1);
          const Gp = ((+pr.qmax || 100) / 60) / Math.max(0.2, (+pr.head || 10) * 0.0981);
          B(p('in'), p('out'), Gp, { u, k: 'pump', H });
          break;
        }
        case 'VALVE': { const pos = st.pos == null ? (pr.open ? 1 : 0) : st.pos; if (pos > 0.01) B(p('a'), p('b'), (+pr.kv / 60) * pos * pos, { u, k: 'v' }); break; }
        case 'SOLV': { const s = part(c, pr.sol); const pos = s && s.state ? clamp(s.state.pos || 0, 0, 1) : 0; st.pos = pos; if (pos > 0.01) B(p('a'), p('b'), (+pr.kv / 60) * pos, { u, k: 'v' }); break; }
        case 'CHECK': B(p('a'), p('b'), +pr.kv / 60, { u, k: 'nrv', one: true }); break;
        case 'FILTER': { const base = pr.kind === 'cart' ? 2.0 : 3.0; B(p('in'), p('out'), base / (1 + 4 * (st.clog || 0)), { u, k: 'flt' }); break; }
        case 'RO': {
          const tcf = Math.exp(2640 * (1 / 298 - 1 / (273 + (st.Tf == null ? 20 : st.Tf))));
          B(p('in'), p('rej'), 0.25 * clamp(+pr.rej, 1, 100) / 100, { u, k: 'rej' });
          const r = clamp((st.rec || 0) / 100, 0, 0.95); // the brine gets saltier with recovery, so the osmotic back-pressure rises
          B(p('in'), p('perm'), 0.06 * tcf, { u, k: 'perm', H: -2.0 * (1 + 1 / (1 - r)) / 2, one: true });
          break;
        }
        case 'HX': B(p('hin'), p('hout'), 1.2, { u, k: 'hxh' }); B(p('cin'), p('cout'), 1.2, { u, k: 'hxc' }); break;
        case 'JUNC': for (const q of ['a', 'b', 'c', 'd']) B(id + '#j', p(q), G_BIG, { u, k: 'j' }); break;
        default: B(p('a'), p('b'), G_BIG, { u, k: 'inl' }); // PT PS FS TT PG FM
      }
    }
    for (const pp of pl.pipes) B(pp.a, pp.b, G_PIPE, { pipe: pp, k: 'pipe' });
    return { nodes, br, fixed };
  }

  /* one linear solve; branches with x.cs are flow sources (a starved pump delivers only what its suction gives) */
  function solveOnce(net, extra) {
    const n = net.nodes.size;
    const A = Array.from({ length: n }, () => new Array(n).fill(0)), b = new Array(n).fill(0);
    for (let i = 0; i < n; i++) A[i][i] += 1e-6;
    for (const f of net.fixed.concat(extra || [])) { A[f.n][f.n] += G_FIX; b[f.n] += G_FIX * f.P; }
    for (const x of net.br) {
      if (x.off || x.G <= 0) continue;
      const { a, b: bb } = x;
      if (x.cs != null) { b[a] -= x.cs; b[bb] += x.cs; continue; }
      const G = x.G, H = x.H;
      A[a][a] += G; A[bb][bb] += G; A[a][bb] -= G; A[bb][a] -= G;
      if (H) { b[a] -= G * H; b[bb] += G * H; }
    }
    return gauss(A, b);
  }
  const P_CAV = -0.6;
  function solveNet(net) {
    for (let it = 0; it < 10; it++) {
      const P = solveOnce(net);
      let changed = false;
      for (const x of net.br) {
        if (x.off) { x.q = 0; continue; }
        x.q = x.cs != null ? x.cs : x.G * (P[x.a] - P[x.b] + (x.H || 0));
        if (x.one && x.q < -1e-6) { x.off = true; changed = true; }
        if (x.oneRev && x.q > 1e-6) { x.off = true; changed = true; } // empty tank cannot deliver
        if (x.k === 'pump' && x.cs == null && P[x.a] < P_CAV + 0.05 && x.q > 1e-6) {
          // suction starved: hold the pump inlet at the vapour limit and see how much water reaches it
          x.off = true;
          const Pa = solveOnce(net, [{ n: x.a, P: P_CAV }])[x.a];
          x.off = false;
          x.cs = Math.max(0, Math.min(x.q, G_FIX * (Pa - P_CAV)));
          x.cav = true; changed = true;
        }
      }
      net.P = P;
      if (!changed) break;
    }
    for (const x of net.br) if (x.off) x.q = 0;
    return net;
  }

  /* temperatures: mix along the flow, heat exchangers change them */
  function temps(net, pl, prev) {
    const n = net.nodes.size, T = new Array(n).fill(20);
    for (const [k, i] of net.nodes) if (prev && prev[k] != null) T[i] = prev[k];
    const fixedT = new Map();
    for (const u of pl.units) {
      if (u.type === 'SUPPLY') fixedT.set(net.nodes.get(u.id + '#s'), +u.props.temp || 20);
      if (u.type === 'TANK') fixedT.set(net.nodes.get(u.id + '#bot'), u.state.T == null ? 20 : u.state.T);
    }
    const hx = new Map();
    for (const x of net.br) if (x.k === 'hxh' || x.k === 'hxc') { const id = x.u.id; if (!hx.has(id)) hx.set(id, {}); hx.get(id)[x.k] = x; }
    for (let pass = 0; pass < 10; pass++) {
      const sumQ = new Float64Array(n), sumQT = new Float64Array(n);
      const outT = new Map();
      for (const [, o] of hx) {
        const h = o.hxh, cc = o.hxc;
        if (!h || !cc) continue;
        const qh = Math.abs(h.q || 0), qc = Math.abs(cc.q || 0);
        const thi = T[(h.q || 0) >= 0 ? h.a : h.b], tci = T[(cc.q || 0) >= 0 ? cc.a : cc.b];
        let th = thi, tc = tci;
        if (qh > 1e-5 && qc > 1e-5) { const eff = clamp(+h.u.props.eff || 0.7, 0.05, 0.95), cmin = Math.min(qh, qc), qq = eff * cmin * (thi - tci); th = thi - qq / qh; tc = tci + qq / qc; }
        outT.set(h, th); outT.set(cc, tc);
        h.u.state.th = [thi, th]; h.u.state.tc = [tci, tc];
      }
      for (const x of net.br) {
        const q = x.q || 0;
        if (Math.abs(q) < 1e-7) continue;
        const from = q > 0 ? x.a : x.b, to = q > 0 ? x.b : x.a;
        const t = outT.has(x) ? outT.get(x) : T[from];
        sumQ[to] += Math.abs(q); sumQT[to] += Math.abs(q) * t;
      }
      for (let i = 0; i < n; i++) {
        if (fixedT.has(i)) { T[i] = fixedT.get(i); continue; }
        if (sumQ[i] > 1e-7) T[i] = sumQT[i] / sumQ[i];
      }
    }
    const out = {};
    for (const [k, i] of net.nodes) out[k] = T[i];
    return out;
  }

  /* ---------------- step ---------------- */
  PL.step = function (c, dt) {
    const pl = c.plant;
    if (!pl || !pl.units.length) return;
    for (const m of c.parts) if (m.state && 'pl' in m.state) delete m.state.pl;
    const net = solveNet(buildNet(c, pl));
    const P = {}, Q = {}, key = [];
    for (const [k, i] of net.nodes) { P[k] = net.P[i]; key[i] = k; }
    const Tn = temps(net, pl, pl._T);
    pl._T = Tn; pl._P = P;
    const q = (u, k) => net.br.filter((x) => x.u === u && x.k === k);
    for (const x of net.br) if (x.pipe) Q[x.pipe.id] = x.q;
    pl._Q = Q;
    for (const u of pl.units) {
      const st = u.state, pr = u.props, p = (port) => P[u.id + '.' + port] || 0, T = (port) => Tn[u.id + '.' + port];
      switch (u.type) {
        case 'SUPPLY': { const x = q(u, 'src')[0]; st.q = x ? x.q : 0; break; }
        case 'DRAIN': { const x = q(u, 'drain')[0]; st.q = x ? x.q : 0; st.tot = (st.tot || 0) + st.q * dt; break; }
        case 'TANK': {
          let qin = 0, vin = 0, hin = 0;
          for (const x of q(u, 'tin')) { qin += x.q; if (x.q > 0) { vin += x.q; hin += x.q * (Tn[key[x.a]] == null ? 20 : Tn[key[x.a]]); } }
          for (const x of q(u, 'tout')) { qin -= x.q; if (x.q < 0) { vin += -x.q; hin += -x.q * (Tn[key[x.b]] == null ? 20 : Tn[key[x.b]]); } }
          const vol = Math.max(1, +pr.vol);
          st.qin = qin;
          let v = st.v + qin * dt;
          st.ovf = 0;
          if (v > vol) { st.ovf = (v - vol) / dt; v = vol; }
          st.v = Math.max(0, v);
          const m = Math.max(5, st.v);
          if (vin > 1e-6) st.T += Math.min(1, (vin * dt) / m) * (hin / vin - st.T);
          const ht = part(c, pr.htr);
          st.heatW = 0;
          if (ht && ht.state && ht.state.v) { const R = (230 * 230) / (+ht.props.w || 1000); st.heatW = (ht.state.v * ht.state.v) / R; }
          if (st.heatW > 0) {
            if (st.v < 0.15 * vol) { if (ht && !ht.state.dry) { ht.state.dry = 1; EL.emit('trip', ht, 'heater above the water line: element dry'); } }
            else if (ht) ht.state.dry = 0;
            st.T += (st.heatW * dt) / (4186 * m);
          }
          st.T += -0.0004 * (st.T - 20) * dt;
          st.T = clamp(st.T, 0, 99);
          st.lvl = 100 * st.v / vol;
          // instruments
          const tx = part(c, pr.lt); if (tx) setProc(tx, st.lvl);
          const tt = part(c, pr.tt); if (tt) { if (tt.type === 'PT100') tt.props.temp = Math.round(st.T); else setProc(tt, st.T); }
          st.sw = (pr.sw || []).map((s) => {
            const pp = part(c, s.t), was = pp && pp.state ? !!pp.state.act : !!(st._sw && st._sw[s.n]);
            const on = st.lvl > (+s.l || 0) + (was ? -0.8 : 0.8);
            if (pp) setAct(pp, on);
            (st._sw || (st._sw = {}))[s.n] = on;
            return on;
          });
          break;
        }
        case 'PUMP': {
          const x = q(u, 'pump')[0];
          st.q = x ? x.q : 0; st.cav = !!(x && x.cav) || (Math.abs(st.s || 0) > 0.3 && p('in') < -0.5);
          st.dp = p('out') - p('in');
          const m = part(c, pr.motor);
          if (m && m.state) {
            const qmax = (+pr.qmax || 100) / 60 * Math.max(0.05, Math.abs(st.s || 0));
            m.state.pl = st.cav ? 0.2 : clamp(0.3 + 0.7 * Math.max(0, st.q) / qmax, 0.2, 1.15);
          }
          if (st.cav && !st._cw) { st._cw = 1; EL.emit('trip', { id: u.id, tag: u.tag }, 'pump cavitating / running dry'); }
          if (!st.cav) st._cw = 0;
          break;
        }
        case 'VALVE': { const tgt = pr.open ? 1 : 0; st.pos = st.pos == null ? tgt : st.pos + clamp(tgt - st.pos, -dt * 2, dt * 2); const x = q(u, 'v')[0]; st.q = x ? x.q : 0; break; }
        case 'SOLV': case 'CHECK': { const x = q(u, u.type === 'CHECK' ? 'nrv' : 'v')[0]; st.q = x ? x.q : 0; break; }
        case 'FILTER': {
          const x = q(u, 'flt')[0]; st.q = x ? x.q : 0; st.dp = p('in') - p('out');
          st.clog = Math.min(3, (st.clog || 0) + Math.abs(st.q) * dt * 0.00012 * (+pr.dirt || 1) * (pr.kind === 'cart' ? 2 : 1));
          break;
        }
        case 'RO': {
          const pm = q(u, 'perm')[0], rj = q(u, 'rej')[0];
          st.qp = pm ? Math.max(0, pm.q) : 0; st.qr = rj ? Math.max(0, rj.q) : 0;
          st.pin = p('in'); st.Tf = T('in') == null ? 20 : T('in');
          st.rec = st.qp + st.qr > 1e-5 ? (100 * st.qp) / (st.qp + st.qr) : 0;
          st.us = st.qp > 1e-4 ? (+pr.us || 600) * 0.02 * (1 + 0.6 * clamp(st.rec - 50, 0, 40) / 40) * (1 + 2.5 / Math.max(0.5, st.pin - 2)) / 1.4 : 0; // low pressure: salt passage stays, water flux drops
          break;
        }
        case 'HX': { const h = q(u, 'hxh')[0], cc = q(u, 'hxc')[0]; st.qh = h ? h.q : 0; st.qc = cc ? cc.q : 0; break; }
        case 'JUNC': break;
        default: {
          const x = q(u, 'inl')[0]; st.q = x ? x.q : 0; st.p = p('a'); st.T = T('a') == null ? 20 : T('a');
          if (u.type === 'PT') { const t = part(c, pr.tx); if (t) setProc(t, (100 * st.p) / Math.max(0.1, +pr.range)); }
          if (u.type === 'TT') { const t = part(c, pr.tx); if (t) { if (t.type === 'PT100') t.props.temp = Math.round(st.T); else setProc(t, (100 * st.T) / Math.max(1, +pr.range)); } }
          if (u.type === 'PS') { const s = part(c, pr.sw); const was = s && s.state ? !!s.state.act : !!st.on; st.on = st.p > +pr.set + (was ? -0.1 : 0.1); if (s) setAct(s, st.on); }
          if (u.type === 'FS') { const s = part(c, pr.sw); const lm = Math.abs(st.q) * 60; const was = s && s.state ? !!s.state.act : !!st.on; st.on = lm > +pr.set + (was ? -0.5 : 0.5); if (s) setAct(s, st.on); }
          if (u.type === 'FM') st.tot = (st.tot || 0) + Math.max(0, st.q) * dt;
        }
      }
    }
    pl._t = (pl._t || 0) + dt;
  };

  /* flow in L/min on a pipe (signed, a->b) */
  PL.pipeQ = (pl, id) => ((pl._Q && pl._Q[id]) || 0) * 60;
  PL.pressAt = (pl, ref) => (pl._P && pl._P[ref]) || 0;
  PL.tempAt = (pl, ref) => (pl._T && pl._T[ref] != null ? pl._T[ref] : 20);

  /* plant problems in plain words (used by the Diagnosis pane and the projects page) */
  PL.problems = function (c) {
    const pl = c.plant, out = [];
    if (!pl) return out;
    const tag = (t) => t && c.parts.some((p) => p.tag === t);
    const connected = new Set(); for (const p of pl.pipes) { connected.add(p.a); connected.add(p.b); }
    const running = pl.units.some((u) => u.type === 'PUMP' && Math.abs((u.state || {}).s || 0) > 0.3);
    for (const u of pl.units) {
      const st = u.state || {}, pr = u.props;
      const open = PL.portsOf(u).filter((q) => !connected.has(u.id + '.' + q.id)).map((q) => q.id);
      if (u.type === 'PUMP') {
        if (!pr.motor) out.push(['warn', u.tag, E('Pump has no motor linked. Pick the motor tag in its properties.', 'الطلمبة مش مربوطة بموتور. اختار اسم الموتور من خصائصها.')]);
        else if (!tag(pr.motor)) out.push(['bad', u.tag, E('Linked motor "' + pr.motor + '" is not on the panel.', 'الموتور المربوط "' + pr.motor + '" مش موجود في اللوحة.')]);
        if (st.cav) out.push(['bad', u.tag, E('Suction starved (cavitation / dry running): not enough water reaches the pump. Check the suction tank level, the suction valves and the filters.', 'السحب مش واصله مية كفاية (كافيتيشن / تشغيل على الناشف). افحص مستوى تانك السحب ومحابس السحب والفلاتر.')]);
        if (Math.abs(st.s || 0) > 0.5 && Math.abs(st.q || 0) * 60 < 2 && !st.cav) out.push(['warn', u.tag, E('Running against a closed discharge (dead head): no flow. A pump left like this overheats.', 'شغالة على طرد مقفول (ديد هيد): مفيش تصرف. الطلمبة لو فضلت كده بتسخن.')]);
        if (Math.abs(st.s || 0) < 0.05 && (st.q || 0) < -0.05) out.push(['warn', u.tag, E('Water flows backwards through the stopped pump. Fit a check valve on its discharge.', 'المية راجعة عكس من الطلمبة الواقفة. ركّب محبس عدم رجوع على الطرد.')]);
        if ((st.s || 0) < -0.05) out.push(['warn', u.tag, E('Motor turns backwards: the pump gives only a third of its head. Swap two phases.', 'الموتور بيلف عكس: الطلمبة بتدي تلت الضغط بس. بدّل فازتين.')]);
      }
      if (u.type === 'TANK') {
        if (st.ovf > 0.001) out.push(['bad', u.tag, E('Tank is overflowing.', 'التانك بيفيض.')]);
        if (pr.lt && !tag(pr.lt)) out.push(['warn', u.tag, E('Level transmitter link "' + pr.lt + '" not found on the panel.', 'ربط ترانسميتر المستوى "' + pr.lt + '" مش موجود في اللوحة.')]);
        for (const s of pr.sw || []) if (s.t && !tag(s.t)) out.push(['warn', u.tag, E(s.n + ' is linked to "' + s.t + '", which is not on the panel.', s.n + ' مربوط بـ"' + s.t + '" ومش موجود في اللوحة.')]);
      }
      if (u.type === 'FILTER' && (st.dp || 0) > (pr.kind === 'cart' ? 0.6 : 0.8)) out.push(['warn', u.tag, E('Filter is getting blocked (high pressure drop). Backwash or change it.', 'الفلتر بيتسد (فرق ضغط عالي). اعمل باك واش أو غيّره.')]);
      if (u.type === 'RO' && running) {
        if ((st.pin || 0) < 2.5) out.push(['warn', u.tag, E('Feed pressure below about 2.5 bar: almost no permeate.', 'ضغط الدخول أقل من 2.5 بار تقريبا: مفيش مية نقية تقريبا.')]);
        if ((st.rec || 0) > 80) out.push(['bad', u.tag, E('Recovery above 80 %: salts scale the membrane. Open the reject valve.', 'الاسترجاع فوق 80%: الأملاح بتترسب على الممبرين. افتح محبس الريجكت.')]);
        else if ((st.qr || 0) > 0.001 && (st.rec || 0) < 10) out.push(['warn', u.tag, E('Recovery below 10 %: most of the water goes to drain.', 'الاسترجاع أقل من 10%: معظم المية رايحة للصرف.')]);
        if ((st.Tf || 20) > 45) out.push(['bad', u.tag, E('Feed water above 45 °C: a polyamide membrane is damaged. Keep it near 25 °C.', 'مية الدخول فوق 45 درجة: الممبرين البولي أميد بيتلف. خليها حوالي 25 درجة.')]);
      }
      if (open.length && u.type !== 'TANK' && u.type !== 'JUNC') out.push(['info', u.tag, E('Open port: ' + open.join(', '), 'طرف مفتوح: ' + open.join('، '))]);
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
