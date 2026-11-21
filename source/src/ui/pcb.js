/* PCB repair trainer: boards, tools, photo overlay, challenges */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, $ = ui.$;
  const X = (EL.pcb = { ed: null, board: null, solved: false, hint: 0, started: 0 });

  /* ---------- boards ---------- */
  const RET = (x1, x2, y) => ({ via: [{ x: x1, y }, { x: x2, y }] });
  const pads = (top) => [['TP1', 'PCB_PAD', top[0], top[1]], ['TP2', 'PCB_PAD', top[2], top[3]]];
  const BOARDS = {
    crack: {
      name: ['Dead LED: cracked trace', 'LED مش بتنور: مسار مشروخ'],
      sym: ['The power LED stays dark. The supply reads 5 V at the connector.', 'اللمبة الدليل مش بتنور. الكهرباء 5 فولت عند الكونكتور.'],
      goal: ['Find the break with the meter and bridge it with a jumper wire (blue) between two test pads.', 'دوّر على القطع بالجهاز وعدّيه بسلك بايباس (أزرق) بين نقطتين قياس.'],
      hints: [['Measure the voltage on both ends of R1. If R1 has 5 V on one end but the LED side has 0 V, the fault is between them.', 'قيس الجهد على طرفي R1. لو في 5 فولت على طرف والتاني 0، العطل بينهم.'], ['Switch the meter to continuity with the supply OFF and test between TP1 and TP2. No beep means the trace is cracked.', 'اقفل الكهرباء وقيس continuity بين TP1 وTP2. لو مفيش صوت المسار مقطوع.'], ['Switch to Build mode, pick the Jumper tool and wire TP1 to TP2.', 'ادخل وضع البناء، اختار أداة الجامبر ووصّل TP1 بـ TP2.']],
      spec: { parts: [['J1', 'PCB_PWR', 20, 60, { volt: 5 }], ['R1', 'PCB_R', 150, 40, { r: 330 }], ['D1', 'PCB_LED', 330, 40, { kind: 'green' }]].concat(pads([205, 130, 325, 130])),
        wires: [['J1.pos', 'R1.A'], ['R1.B', 'D1.A'], ['D1.K', 'J1.neg', RET(401, 55, 190)], ['R1.B', 'TP1.p'], ['D1.A', 'TP2.p']] },
      setup(c) { const w = c.wires[1]; w.cut = true; w.hidden = true; X.faultPart = null; X.faultWire = w.id; },
      check(c) { const d = c.parts.find((p) => p.tag === 'D1'); const jum = c.wires.some((w) => w.kind === 'jumper' && !w.cut); return d.state.b > 0.3 && jum ? ['ok'] : d.state.b > 0.3 ? ['partial', T(['It lights, but not with a jumper. A real cracked trace cannot be undone; bridge it.', 'بتنور، بس من غير جامبر. المسار المشروخ مش بيرجع، لازم تعديه بسلك.'])] : null; },
      done: ['Bridged. In a real repair, scrape the solder mask on both sides, tin the pads and solder a thin wire.', 'تمام. في الشغل الحقيقي: اكشط الورنيش من الناحيتين، قصدر النقطتين ولحّم سلك رفيع.'],
    },
    burnt: {
      name: ['Burnt resistor', 'مقاومة محروقة'],
      sym: ['No light on the 12 V indicator. The board smells slightly burnt.', 'مفيش إضاءة على مؤشر الـ12 فولت. والكارت ريحته محروقة شوية.'],
      goal: ['Find which part is open and replace it with a new one.', 'اعرف أنهي قطعة مقطوعة وغيّرها بواحدة جديدة.'],
      hints: [['A measured voltage across an open part equals the full supply. Look for the part with the whole 12 V across it.', 'الجهد على القطعة المقطوعة بيساوي الكهرباء كلها. دوّر على القطعة اللي عليها 12 فولت كاملة.'], ['Power off, take the resistance of R1 out of circuit. OL or very high means it is open.', 'اقفل الكهرباء وقيس مقاومة R1. لو OL أو كبيرة جدا يبقى مقطوعة.'], ['Select R1 and press Replace.', 'اختار R1 واضغط "غيّرها بقطعة جديدة".']],
      spec: { parts: [['J1', 'PCB_PWR', 20, 60, { volt: 12 }], ['F1', 'PCB_FUSE', 140, 10, { rating: 1 }], ['R1', 'PCB_R', 230, 70, { r: 1000 }], ['D1', 'PCB_LED', 380, 70, { kind: 'red' }]].concat(pads([225, 140, 375, 140])),
        wires: [['J1.pos', 'F1.A'], ['F1.B', 'R1.A'], ['R1.B', 'D1.A'], ['D1.K', 'J1.neg', RET(451, 55, 210)], ['R1.A', 'TP1.p'], ['D1.A', 'TP2.p']] },
      setup(c) { const r = c.parts.find((p) => p.tag === 'R1'); r.fault = 'open'; r.hid = true; X.faultPart = r.id; },
      check(c) { const d = c.parts.find((p) => p.tag === 'D1'); return d.state.b > 0.3 ? ['ok'] : null; },
      done: ['Fixed. A burnt resistor usually means something upstream drew too much current. Check the cause before you power it for long.', 'اتصلح. المقاومة المحروقة معناها غالبا إن حاجة سحبت تيار زيادة. شوف السبب قبل ما تشغلها كتير.'],
    },
    fuse: {
      name: ['Blown fuse that keeps blowing', 'فيوز بيتحرق تاني وتالت'],
      sym: ['12 V board, fuse is blown. A new fuse blows again at once.', 'كارت 12 فولت، الفيوز محروق. وأي فيوز جديد بيتحرق على طول.'],
      goal: ['Find why the fuse blows, replace the cause first, then the fuse.', 'اعرف ليه الفيوز بيتحرق، غيّر السبب الأول وبعدين الفيوز.'],
      hints: [['Do not replace the fuse yet. Power off and measure resistance across the supply rails after the fuse. A near-zero reading is a short.', 'متغيّرش الفيوز دلوقتي. اقفل الكهرباء وقيس المقاومة بين خطي الكهرباء بعد الفيوز. قراءة قريبة من الصفر يعني ماس.'], ['Look at which part is across the rails. A capacitor that reads a few ohms is shorted.', 'بص على القطعة اللي على الخطين. الكباسيتور اللي بيقرا كام أوم متقصر.'], ['Replace C1, then replace F1.', 'غيّر C1 وبعدين F1.']],
      spec: { parts: [['J1', 'PCB_PWR', 20, 80, { volt: 12 }], ['F1', 'PCB_FUSE', 120, 20, { rating: 1 }], ['C1', 'PCB_CAP', 130, 110, { uf: 100 }], ['U1', 'PCB_REG', 260, 60, { out: 5 }], ['R1', 'PCB_R', 380, 60, { r: 330 }], ['D1', 'PCB_LED', 500, 60, { kind: 'green' }]].concat(pads([230, 160, 350, 160])),
        wires: [['J1.pos', 'F1.A'], ['F1.B', 'U1.IN'], ['F1.B', 'C1.A'], ['C1.B', 'J1.neg', RET(201, 55, 230)], ['U1.GND', 'J1.neg', RET(299, 55, 230)], ['U1.OUT', 'R1.A'], ['R1.B', 'D1.A'], ['D1.K', 'J1.neg', RET(571, 55, 230)], ['U1.IN', 'TP1.p'], ['U1.OUT', 'TP2.p']] },
      setup(c) { const cp = c.parts.find((p) => p.tag === 'C1'), f = c.parts.find((p) => p.tag === 'F1'); cp.fault = 'short'; cp.hid = true; f.fault = 'open'; f.hid = true; X.faultPart = cp.id; },
      check(c) { const d = c.parts.find((p) => p.tag === 'D1'), cp = c.parts.find((p) => p.tag === 'C1'); return d.state.b > 0.3 && cp.fault === 'none' ? ['ok'] : null; },
      done: ['Fixed. Replacing only the fuse would have blown it again. Always find the cause first.', 'اتصلح. لو غيّرت الفيوز بس كان هيتحرق تاني. دوّر على السبب الأول دايما.'],
    },
    reg: {
      name: ['No output from the regulator', 'المنظم مش بيدي خرج'],
      sym: ['The 5 V logic rail is dead. The LED never lights even when the button is pressed.', 'خط الـ5 فولت ميت. اللمبة مش بتنور حتى لما تدوس الزرار.'],
      goal: ['Prove that the input is good and the output is missing, then replace the regulator.', 'اثبت إن الدخل سليم والخرج مفقود، وبعدين غيّر المنظم.'],
      hints: [['Measure U1 IN against GND (about 12 V) and OUT against GND. Good input and no output points at U1.', 'قيس IN مقابل GND (حوالي 12 فولت) وبعدين OUT مقابل GND. دخل سليم وخرج مفيش يبقى العطل في U1.'], ['The button is a momentary one: use Test mode and hold it while you measure.', 'الزرار لحظي: ادخل وضع الاختبار وامسكه وانت بتقيس.'], ['Select U1 and press Replace.', 'اختار U1 واضغط "غيّرها بقطعة جديدة".']],
      spec: { parts: [['J1', 'PCB_PWR', 20, 80, { volt: 12 }], ['SW1', 'PCB_SW', 120, 20], ['U1', 'PCB_REG', 250, 60, { out: 5 }], ['R1', 'PCB_R', 370, 60, { r: 330 }], ['D1', 'PCB_LED', 490, 60, { kind: 'amber' }]].concat(pads([215, 160, 335, 160])),
        wires: [['J1.pos', 'SW1.A'], ['SW1.B', 'U1.IN'], ['U1.GND', 'J1.neg', RET(289, 55, 230)], ['U1.OUT', 'R1.A'], ['R1.B', 'D1.A'], ['D1.K', 'J1.neg', RET(561, 55, 230)], ['SW1.B', 'TP1.p'], ['U1.OUT', 'TP2.p']] },
      setup(c) { const u = c.parts.find((p) => p.tag === 'U1'); u.fault = 'dead'; u.hid = true; X.faultPart = u.id; },
      check(c) { const d = c.parts.find((p) => p.tag === 'D1'); return d.state.b > 0.3 ? ['ok'] : null; },
      done: ['Fixed. Input present and output absent is the classic way to condemn a regulator.', 'اتصلح. دخل موجود وخرج مفيش هي الطريقة الكلاسيكية للحكم على منظم.'],
    },
    free: {
      name: ['Free board / your own photo', 'كارت حر / صورتك'],
      sym: ['Empty board with a 5 V input.', 'كارت فاضي ومعاه دخل 5 فولت.'],
      goal: ['Upload a photo of a real board, place parts over the tracks, draw traces and test them. Use the Cut tool to simulate a cracked trace.', 'ارفع صورة كارت حقيقي، حط القطع فوق المسارات، ارسم المسارات واختبرها. استخدم أداة القطع عشان تعمل مسار مشروخ.'],
      hints: [['Photo: use the Photo button. Resize it until the pads line up with your parts.', 'الصورة: زرار "صورة". كبّرها أو صغّرها لحد ما النقط تتطابق مع القطع.']],
      spec: { parts: [['J1', 'PCB_PWR', 20, 60, { volt: 5 }]], wires: [] },
      setup() { X.faultPart = null; },
      check() { return null; },
    },
  };
  X.boards = BOARDS;
  const ORDER = (X.order = ['crack', 'burnt', 'fuse', 'reg', 'free']);

  /* ---------- toolbar ---------- */
  X.setMode = function (m) {
    X.ed.setMode(m);
    for (const b of ui.$$('#pcbTb [data-m]')) b.classList.toggle('on', b.dataset.m === m);
    $('#v-pcb').dataset.mode = m;
  };
  function setTool(t) {
    const ed = X.ed;
    if (t === 'cut') ed.tool = 'cut'; else { ed.tool = 'wire'; ed.wireKind = t === 'jumper' ? 'jumper' : 'trace'; }
    ed.pending = null;
    for (const b of ui.$$('#pcbTb [data-tool]')) b.classList.toggle('on', b.dataset.tool === t);
    ed.setMode(ed.mode);
    ed.hint(t === 'cut' ? T(['Cut tool: tap a trace to crack it. Tap again to restore.', 'أداة القطع: اضغط على مسار تقطعه. اضغط تاني ترجّعه.']) : '');
    if (t === 'cut') setTimeout(() => ed.hint(''), 3500);
  }
  function syncPower() { const b = $('#pcbPower'); if (!b) return; b.classList.toggle('on', X.ed.mains); b.classList.toggle('off', !X.ed.mains); b.querySelector('span').textContent = X.ed.mains ? T(['Supply ON', 'الكهرباء شغالة']) : T(['Supply OFF', 'الكهرباء مفصولة']); }
  function buildToolbar() {
    const tb = $('#pcbTb'); tb.innerHTML = '';
    const mk = (cls, attrs, label) => h('button', Object.assign({ class: cls }, attrs), label);
    tb.appendChild(h('div', { class: 'seg' }, mk('btn on', { 'data-m': 'build', onclick: () => X.setMode('build') }, T(['Build', 'بناء'])), mk('btn', { 'data-m': 'test', onclick: () => X.setMode('test') }, T(['Test', 'اختبار']))));
    tb.appendChild(h('button', { class: 'btn pwr on', id: 'pcbPower', onclick: () => { X.ed.mains = !X.ed.mains; syncPower(); ui.click(); } }, h('span', { text: '' })));
    tb.appendChild(h('span', { class: 'sep' }));
    tb.appendChild(h('div', { class: 'seg' },
      mk('btn on', { 'data-tool': 'trace', onclick: () => setTool('trace'), title: T(['Draw a copper trace', 'ارسم مسار نحاس']) }, T(['Trace', 'مسار'])),
      mk('btn', { 'data-tool': 'jumper', onclick: () => setTool('jumper'), title: T(['Draw a bypass wire', 'ارسم سلك بايباس']) }, T(['Jumper', 'جامبر'])),
      mk('btn', { 'data-tool': 'cut', onclick: () => setTool('cut'), title: T(['Crack a trace', 'اقطع مسار']) }, T(['Cut', 'قطع']))));
    tb.appendChild(h('span', { class: 'sep' }));
    tb.appendChild(mk('btn pri', { onclick: () => EL.ui.diag && EL.ui.diag.open('pcb') }, T(['Diagnosis', 'دايجنوسس'])));
    tb.appendChild(mk('btn', { onclick: () => X.boardsDialog() }, T(['Boards', 'الكروت'])));
    tb.appendChild(mk('btn', { onclick: () => X.photoDialog() }, T(['Photo', 'صورة'])));
    tb.appendChild(h('span', { class: 'sep' }));
    tb.appendChild(mk('btn', { onclick: () => X.ed.undo() }, '↶')); tb.appendChild(mk('btn', { onclick: () => X.ed.redo() }, '↷'));
    tb.appendChild(mk('btn', { onclick: () => X.ed.zoomAt(0.8) }, '−')); tb.appendChild(mk('btn', { onclick: () => X.ed.zoomAt(1.25) }, '+'));
    tb.appendChild(mk('btn', { onclick: () => X.ed.fit() }, T(['Fit', 'ملّي'])));
    syncPower();
  }

  /* ---------- loading boards ---------- */
  X.load = function (id) {
    const b = BOARDS[id]; if (!b) return;
    EL.inst.probes = { red: null, black: null, clamp: null, ncv: null };
    const c = EL.build(Object.assign({ name: b.name }, b.spec));
    X.faultPart = null; X.faultWire = null;
    try { const tb = document.getElementById('ptoasts'); if (tb) tb.innerHTML = ''; } catch (e) { /* no DOM in node tests */ }
    b.setup(c);
    X.board = id; X.solved = false; X.hint = 0; X.started = Date.now(); X.replaced = 0;
    X.ed.showHidden = false;
    X.ed.mains = true; syncPower();
    X.ed.setCircuit(c); X.setMode('build'); setTool('trace');
    X.ed.photoStyle(X.ed.photoW, X.ed.photoOp);
    X.ed.select(null);
    X.renderTask();
    try { localStorage.setItem('ellab.pcbboard', id); } catch (e) {}
  };
  X.boardsDialog = function () {
    const list = h('div', { class: 'msgs' });
    for (const id of ORDER) {
      const b = BOARDS[id];
      list.appendChild(h('div', { class: 'card', style: { cursor: 'pointer' }, onclick: () => { m.remove(); X.load(id); } }, h('b', { text: T(b.name) }), h('p', { class: 'mute', text: T(b.sym) })));
    }
    const m = ui.modal([h('h3', { text: T(['Practice boards', 'كروت التدريب']) }), h('p', { class: 'mute', text: T(['Each board has a hidden fault. Measure, find it, repair it.', 'كل كارت فيه عطل مخفي. قيس، لاقيه، وصلّحه.']) }), list]);
  };
  X.photoDialog = function () {
    const ed = X.ed;
    let w = ed.photoW || 800, op = ed.photoOp == null ? 0.6 : ed.photoOp;
    const wr = h('input', { type: 'range', min: 200, max: 2400, step: 20, value: w, oninput: (e) => { w = +e.target.value; ed.photoStyle(w, op); } });
    const or = h('input', { type: 'range', min: 0.1, max: 1, step: 0.05, value: op, oninput: (e) => { op = +e.target.value; ed.photoStyle(w, op); } });
    const file = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onchange: (e) => {
      const f = e.target.files[0]; if (!f) return;
      const img = new Image(), url = URL.createObjectURL(f);
      img.onload = () => { // downscale for performance
        const k = Math.min(1, 1600 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        ed.photoStyle(Math.min(900, cv.width), op); ed.setPhoto(cv.toDataURL('image/jpeg', 0.82)); ed.fit();
        ui.toast(['Photo placed. Resize it so the pads line up, then add parts on top.', 'الصورة اتحطت. كبّرها أو صغّرها لحد ما النقط تتطابق، وبعدين حط القطع فوقها.'], 'ok', 5000);
      };
      img.src = url;
    } });
    const m = ui.modal([h('h3', { text: T(['Board photo', 'صورة الكارت']) }),
      h('p', { class: 'mute', text: T(['Take or choose a photo of the board (top view, good light). Place parts over its pads and draw the traces you see.', 'صوّر الكارت أو اختار صورة (من فوق وإضاءة كويسة). حط القطع فوق النقط وارسم المسارات اللي شايفها.']) }),
      h('div', { class: 'row wrap' }, h('label', { class: 'btn pri' }, T(['Take or choose photo', 'صوّر أو اختار صورة']), file), h('button', { class: 'btn', onclick: () => { ed.setPhoto(null); }, text: T(['Remove photo', 'شيل الصورة']) })),
      h('label', { class: 'f', text: T(['Photo size', 'حجم الصورة']) }), wr, h('label', { class: 'f', text: T(['Photo opacity', 'شفافية الصورة']) }), or,
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn', onclick: () => m.remove(), text: T(['Done', 'تمام']) }))]);
  };

  /* ---------- replace part ---------- */
  X.replace = function (p) {
    const d = EL.defs[p.type]; if (!d) return;
    X.ed.push();
    p.fault = 'none'; p.hid = false;
    if (d.init) d.init(p);
    X.replaced++;
    X.ed.touch(); X.ed.select(p.id);
    ui.click(); ui.toast(T(['Replaced ', 'اتغيّرت ']) + p.tag, 'ok', 2500);
  };

  /* ---------- task pane ---------- */
  X.renderTask = function () {
    const root = $('#ppane-task'); root.innerHTML = '';
    const b = BOARDS[X.board]; if (!b) return;
    const ed = X.ed;
    const status = h('div', { class: 'card ' + (X.solved ? 'okc' : ''), id: 'ptstatus' },
      h('b', { text: X.solved ? T(['Solved', 'اتصلح']) : T(['Not solved yet', 'لسه متصلحش']) }));
    root.appendChild(h('div', { class: 'card' }, h('h3', { text: T(b.name) }),
      h('label', { class: 'f', text: T(['Symptom', 'العطل']) }), h('p', { text: T(b.sym) }),
      h('label', { class: 'f', text: T(['Your job', 'المطلوب']) }), h('p', { text: T(b.goal) })));
    root.appendChild(status);
    if (X.solved && b.done) root.appendChild(h('div', { class: 'card' }, h('p', { text: T(b.done) })));
    root.appendChild(h('div', { class: 'row wrap' },
      h('button', { class: 'btn', onclick: () => { const hs = b.hints; const i = Math.min(X.hint, hs.length - 1); ui.toast(T(hs[i]), '', 9000); X.hint = Math.min(X.hint + 1, hs.length); X.renderTask(); }, text: T(['Hint', 'تلميح']) + (b.hints.length > 1 ? ' (' + Math.min(X.hint + 1, b.hints.length) + '/' + b.hints.length + ')' : '') }),
      h('button', { class: 'btn', onclick: () => { ed.showHidden = !ed.showHidden; ed.touch(); const p = X.faultPart && ed.c.parts.find((q) => q.id === X.faultPart); if (ed.showHidden && p) { ed.select(p.id); ui.toast(T(['The fault is on ', 'العطل في ']) + p.tag + ': ' + T(EL.defs[p.type].faults.find((f) => f[0] === p.fault)[1]), 'warn', 6000); } else if (ed.showHidden && X.faultWire) ui.toast(T(['The cracked trace is marked with an X.', 'المسار المشروخ عليه علامة X.']), 'warn', 5000); EL.pcb.renderTask(); }, text: ed.showHidden ? T(['Hide the fault', 'اخفي العطل']) : T(['Show the fault', 'اظهر العطل']) }),
      h('button', { class: 'btn', onclick: () => X.load(X.board), text: T(['Reset board', 'ابدأ الكارت من الأول']) }),
      h('button', { class: 'btn', onclick: () => X.boardsDialog(), text: T(['Other boards', 'كروت تانية']) })));
    root.appendChild(h('div', { class: 'card' }, h('h3', { text: T(['Method', 'الطريقة']) }),
      h('p', { class: 'mute', text: T(['1. Power off and look. 2. Measure the supply at the input. 3. Follow the signal and find where the voltage disappears. 4. With power off, check continuity or resistance of the suspect. 5. Repair, then power on and re-measure.', '1. اقفل الكهرباء وبص كويس. 2. قيس الكهرباء عند الدخل. 3. اتبع الإشارة لحد ما تلاقي الجهد بيختفي فين. 4. والكهرباء مقفولة قيس continuity أو المقاومة للقطعة المشتبه فيها. 5. صلّح، شغّل وقيس تاني.']) })));
    root.appendChild(h('div', { class: 'card' }, h('h3', { text: T(['Tools', 'الأدوات']) }),
      h('p', { class: 'mute', text: T(['Trace: copper track. Jumper: your bypass wire. Cut: crack a trace to practise. Test mode: probe with the meters, hold the tact switch.', 'مسار: خط نحاس. جامبر: سلك البايباس بتاعك. قطع: اعمل شرخ في مسار للتدريب. وضع الاختبار: قيس بالأجهزة وامسك الزرار الصغير.']) })));
  };

  /* ---------- solve tick ---------- */
  let last = 0;
  X.tick = function (sim) {
    const b = BOARDS[X.board]; if (!b || X.solved || !b.check) return;
    const r = b.check(X.ed.c, sim);
    if (!r) { if (X.note) { X.note = null; } return; }
    if (r[0] === 'ok') {
      X.solved = true; ui.beep(true);
      ui.toast(T(['Board repaired.', 'الكارت اتصلح.']), 'ok', 6000);
      X.renderTask();
    } else if (r[0] === 'partial' && Date.now() - last > 6000) { last = Date.now(); ui.toast(r[1], 'warn', 6000); }
  };

  /* ---------- init ---------- */
  X.onShow = function () { requestAnimationFrame(() => { X.ed.applyView(); }); syncPower(); X.pane(X._pane || 'task'); };
  X.pane = function (name) {
    X._pane = name;
    for (const b of ui.$$('#pside .stab')) b.classList.toggle('on', b.dataset.pp === name);
    for (const s of ui.$$('#pside .spane')) s.classList.toggle('on', s.id === 'ppane-' + name);
    if (name === 'meters' && ui.inst) ui.inst.render();
  };
  X.sheet = function (which) {
    const pal = $('#ppalette'), side = $('#pside');
    const wasPal = pal.classList.contains('open'), wasSide = side.classList.contains('open');
    pal.classList.remove('open'); side.classList.remove('open');
    if (which === 'palette' && !wasPal) pal.classList.add('open');
    if (which === 'side' && !wasSide) side.classList.add('open');
    for (const b of ui.$$('#pdock button')) b.classList.toggle('on', (b.dataset.s === 'palette' && pal.classList.contains('open')) || (b.dataset.s === 'side' && side.classList.contains('open') && b.dataset.p === X._pane));
  };
  X.init = function () {
    const host = $('#pcbHost');
    host.classList.add('pcbhost');
    const ed = (X.ed = EL.makeEditor(host, {
      kind: 'pcb',
      onSelect: () => { EL.bench.inspector(X.ed); if (X.ed.sel && window.innerWidth > 900) X.pane('part'); },
      onChange: () => { if (X.ed) X.ed.c.sim = null; },
      onProbe: () => ui.inst && ui.inst.onProbe(),
    }));
    const pl = $('#pplist'), search = $('#ppsearch');
    const rebuild = () => ui.buildPalette(pl, ed, search.value, (tapped) => { if (tapped && window.innerWidth <= 900) X.sheet(null); });
    search.addEventListener('input', rebuild); ui.onRefresh(rebuild); rebuild();
    buildToolbar();
    ui.onRefresh(() => { buildToolbar(); setTool(ed.tool === 'cut' ? 'cut' : ed.wireKind === 'jumper' ? 'jumper' : 'trace'); X.setMode(ed.mode); X.renderTask(); EL.bench.inspector(ed); });
    for (const b of ui.$$('#pside .stab')) b.addEventListener('click', () => X.pane(b.dataset.pp));
    for (const b of ui.$$('#pdock button')) b.addEventListener('click', () => {
      if (b.dataset.s === 'palette') X.sheet('palette'); else { X.pane(b.dataset.p); X.sheet('side'); }
    });
    document.addEventListener('keydown', (e) => { if ($('#v-pcb').classList.contains('on')) ed.keydown(e); });
    let id = 'crack'; try { id = localStorage.getItem('ellab.pcbboard') || id; } catch (e) {}
    X.load(BOARDS[id] ? id : 'crack');
    EL.bench.inspector(ed);
  };
})(typeof window !== 'undefined' ? window : globalThis);
