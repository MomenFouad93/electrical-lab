/* Diagnosis panel: verdict, findings, what works, marks on the drawing, guided troubleshooting, AI review, solved cases */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, $ = ui.$;
  const Dg = EL.diag, Ts = EL.ts, U = Dg.util;
  const DU = (ui.diag = { inst: {} });
  const fix1 = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2));
  const newState = () => ({ res: null, stale: false, marks: true, ts: null, ai: { text: '', busy: false, err: '' }, open: {}, auto: false, engine: 'builtin', busy: false });
  const hasHidden = (c) => c.parts.some((p) => p.hid) || c.wires.some((w) => w.hidden);

  /* ---------- plumbing ---------- */
  DU.attach = function (kind, ed, root, openPane) {
    const I = (DU.inst[kind] = { kind, ed, root, st: newState(), openPane });
    ed.hooks.push(() => {
      const st = I.st;
      if (st.res && !st.stale) { st.stale = true; ed.clearMarks(); }
      if (st.auto) { clearTimeout(I.timer); I.timer = setTimeout(() => DU.run(kind, true), 900); }
      else if (st.stale && I.root.classList.contains('on')) paintStale(I);
    });
    ui.onRefresh(() => render(I));
    render(I);
    return I;
  };
  DU.open = function (kind, run) {
    const I = DU.inst[kind]; if (!I) return;
    I.openPane();
    if (run !== false) DU.run(kind);
  };
  function paintStale(I) { const el = I.root.querySelector('.dg-stale'); if (el) el.style.display = ''; }

  DU.run = function (kind, quiet) {
    const I = DU.inst[kind]; if (!I) return;
    const st = I.st, ed = I.ed;
    st.busy = true; render(I);
    setTimeout(() => {
      const t0 = performance.now();
      try {
        EL.ctx.mains = ed.mains;
        st.res = Dg.analyze(ed.c);
        st.ms = performance.now() - t0; st.stale = false;
        ed.setMarks(st.marks ? st.res.marks : []);
      } catch (e) { st.res = null; st.err = String(e && e.message || e); console.error(e); }
      st.busy = false; render(I);
      if (st.engine === 'ai' && EL.ai.ready() && !quiet) DU.aiReview(kind);
    }, 30);
  };

  /* ---------- small pieces ---------- */
  const SEVCLS = { error: 'bad', warn: 'warn', info: 'info', ok: 'ok' };
  const SEVTXT = { error: ['Error', 'خطأ'], warn: ['Fix', 'تحسين'], info: ['Note', 'ملاحظة'], ok: ['OK', 'سليم'] };
  const ICON = {
    ok: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#2fb170"/><path d="M6.5 12.5l3.6 3.6 7.4-8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    warn: '<svg viewBox="0 0 24 24"><path d="M12 2l11 20H1z" fill="#f5a524" stroke="#f5a524" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 9v6M12 18.2v.1" stroke="#1b1300" stroke-width="2.4" stroke-linecap="round"/></svg>',
    bad: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#e5484d"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>',
    empty: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="none" stroke="#5d6c8a" stroke-width="2" stroke-dasharray="3 3"/></svg>',
    q: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#f5a524"/><text x="12" y="17.5" text-anchor="middle" font-size="16" font-weight="800" fill="#1b1300">?</text></svg>',
  };
  const ic = (k, sz) => h('span', { class: 'dg-ic', style: { width: (sz || 22) + 'px', height: (sz || 22) + 'px' }, html: ICON[k] });
  const card = (cls, ...kids) => h('div', { class: 'card dg ' + (cls || '') }, ...kids);
  const btn = (txt, fn, cls) => h('button', { class: 'btn ' + (cls || ''), onclick: fn, text: txt });

  function showRefs(I, refs) {
    const ed = I.ed; if (!refs || !refs.length) return;
    const first = String(refs[0]); const pid = first.split('.')[0];
    if (ed.c.parts.some((p) => p.id === pid)) ed.select(pid);
    ed.focusRef(first);
    if (window.innerWidth <= 900) { const side = I.kind === 'bench' ? $('#side') : $('#pside'); if (side) side.classList.remove('open'); const dk = I.kind === 'bench' ? $('#dock') : $('#pdock'); if (dk) for (const b of dk.querySelectorAll('button')) b.classList.remove('on'); }
  }

  /* ---------- main render ---------- */
  function render(I) {
    const root = I.root, st = I.st, ed = I.ed;
    root.innerHTML = '';
    const run = h('div', { class: 'row wrap', style: { marginBottom: '8px' } },
      h('button', { class: 'btn pri grow dg-run', onclick: () => DU.run(I.kind), text: st.busy ? T(['Checking...', 'بفحص...']) : T(['Run diagnosis', 'شغّل الدايجنوسس']) }),
      h('button', { class: 'btn' + (st.marks ? ' on' : ''), title: T(['Show marks on the drawing', 'اظهر العلامات على الرسم']), onclick: () => { st.marks = !st.marks; ed.setMarks(st.marks && st.res && !st.stale ? st.res.marks : []); render(I); }, text: T(['Marks', 'علامات']) }));
    root.appendChild(run);
    const eng = h('div', { class: 'row wrap', style: { marginBottom: '6px' } },
      h('span', { class: 'mute', text: T(['Engine', 'المحرك']) }),
      h('div', { class: 'seg' },
        h('button', { class: 'btn sm' + (st.engine === 'builtin' ? ' on' : ''), onclick: () => { st.engine = 'builtin'; render(I); }, text: T(['Built-in (offline)', 'مدمج (أوفلاين)']) }),
        h('button', { class: 'btn sm' + (st.engine === 'ai' ? ' on' : ''), onclick: () => { st.engine = 'ai'; render(I); }, text: T(['Built-in + AI', 'مدمج + ذكاء اصطناعي']) })),
      h('label', { class: 'row', style: { gap: '4px', marginInlineStart: 'auto' } }, h('input', { type: 'checkbox', checked: st.auto ? true : null, style: { width: 'auto', minHeight: 0 }, onchange: (e) => { st.auto = e.target.checked; if (st.auto) DU.run(I.kind, true); } }), h('span', { class: 'mute', text: T(['Auto', 'تلقائي']) })));
    root.appendChild(eng);
    root.appendChild(h('div', { class: 'dg-stale mute', style: { display: st.stale ? '' : 'none' }, text: T(['The drawing changed. Run the diagnosis again.', 'الرسم اتغير. شغّل الدايجنوسس تاني.']) }));
    if (st.err) root.appendChild(card('bad', h('b', { text: T(['The check failed', 'الفحص فشل']) }), h('p', { class: 'ltr mute', text: st.err })));
    const res = st.res;
    if (!res) {
      root.appendChild(card('', h('h3', { text: T(['Diagnosis', 'دايجنوسس']) }),
        h('p', { text: T(['Draw a circuit or a board, then press the button. I run it through test scenarios and tell you what is right, what is wrong, where, and what will not light or run. Marks appear on the drawing.', 'ارسم دايرة أو كارت وبعدين دوس الزرار. هشغّلها في سيناريوهات اختبار وأقولك إيه الصح وإيه الغلط وفين، وإيه اللي مش هيشتغل أو مش هينور. العلامات بتظهر على الرسم.']) }),
        legend()));
      troubleCard(I, root); aiCard(I, root); casesCard(I, root);
      return;
    }
    root.appendChild(verdictCard(I, res));
    if (res.findings.length) root.appendChild(findingsCard(I, res));
    if (res.table.length) root.appendChild(tableCard(I, res));
    if (!st.ai.skip) aiOut(I, root);
    troubleCard(I, root); aiCard(I, root); casesCard(I, root);
  }

  function legend() {
    const li = (k, txt) => h('span', { class: 'dg-leg' }, ic(k, 16), h('span', { text: T(txt) }));
    return h('div', { class: 'row wrap dg-legend' }, li('bad', ['Wrong / broken', 'غلط / بايظ']), li('q', ['Check here', 'اتأكد هنا']), li('warn', ['Note', 'ملاحظة']), li('ok', ['Works', 'شغال']));
  }

  function verdictCard(I, res) {
    const V = { ok: ['Looks correct', 'سليمة', 'ok'], warn: ['Works, needs fixes', 'شغالة بس محتاجة تصليح', 'warn'], fail: ['Has errors', 'فيها أخطاء', 'bad'], empty: ['Nothing to check', 'مفيش حاجة تتفحص', 'empty'] }[res.verdict];
    const nErr = res.findings.filter((f) => f.sev === 'error').length, nWarn = res.findings.filter((f) => f.sev === 'warn').length;
    const works = res.table.filter((r) => r.status === 'works').length, bad = res.table.filter((r) => r.status !== 'works' && r.status !== 'untested').length;
    return card('dg-verdict v-' + V[2],
      h('div', { class: 'row' }, ic(V[2], 34), h('div', { class: 'grow' }, h('div', { class: 'dg-vt', text: T(V) }), h('div', { class: 'mute', text: T(res.summary) }))),
      h('div', { class: 'row wrap dg-chips' },
        nErr ? h('span', { class: 'pill bad', text: nErr + ' ' + (nErr === 1 ? T(['error', 'خطأ']) : T(['errors', 'أخطاء'])) }) : null,
        nWarn ? h('span', { class: 'pill warn', text: nWarn + ' ' + T(['to fix', 'تحسين']) }) : null,
        works ? h('span', { class: 'pill ok', text: works + ' ' + T(['working', 'شغالة']) }) : null,
        bad ? h('span', { class: 'pill bad', text: bad + ' ' + T(['not working', 'مش شغالة']) }) : null,
        h('span', { class: 'mute', style: { marginInlineStart: 'auto', fontSize: '11px' }, text: res.scenarios + ' ' + T(['tests', 'اختبار']) + ' · ' + Math.round(I.st.ms || 0) + ' ms' })),
      res.blind ? h('p', { class: 'mute', text: T(['This board has a hidden fault. I only report what you would see on the bench, not the cause.', 'الكارت ده فيه عطل مخفي. بقولك اللي هتشوفه على الترابيزة بس، مش السبب.']) }) : null,
      legend());
  }

  function findingsCard(I, res) {
    const c = card('', h('h3', { text: T(['What I found', 'اللي لقيته']) }));
    res.findings.forEach((f, i) => {
      const k = 'f' + i, open = I.st.open[k];
      const head = h('div', { class: 'dg-fh', onclick: () => { I.st.open[k] = !open; render(I); } },
        h('span', { class: 'pill ' + SEVCLS[f.sev], text: T(SEVTXT[f.sev]) }), h('span', { class: 'grow', text: T(f.msg) }), h('span', { class: 'mute', text: open ? '▴' : '▾' }));
      const body = open ? h('div', { class: 'dg-fb' },
        f.why ? h('p', { text: T(f.why) }) : null,
        f.steps && f.steps.length ? h('ul', { class: 'dg-steps' }, f.steps.map((s) => h('li', { text: T(s) }))) : null,
        f.fix ? h('p', {}, h('b', { text: T(['Fix: ', 'الحل: ']) }), T(f.fix)) : null,
        f.std ? h('p', { class: 'mute ltr', text: f.std }) : null,
        h('div', { class: 'row wrap' },
          f.refs && f.refs.length ? btn(T(['Show on drawing', 'وريني على الرسم']), () => showRefs(I, f.refs), 'sm') : null,
          f.troubleshoot ? btn(T(['Troubleshoot', 'تحديد العطل']), () => startTrouble(I, f.troubleshoot), 'sm pri') : null)) : null;
      c.appendChild(h('div', { class: 'dg-f ' + SEVCLS[f.sev] }, head, body));
    });
    return c;
  }

  function tableCard(I, res) {
    const c = card('', h('h3', { text: T(['What works and what does not', 'إيه اللي شغال وإيه اللي لأ']) }));
    const ST = { works: ['ok', ['Works', 'شغال']], never: ['bad', ['Will not work', 'مش هيشتغل']], untested: ['q', ['Only on a condition', 'بشرط']], symptom: ['bad', ['Should work, does not', 'المفروض يشتغل ومش شغال']] };
    for (const r of res.table) {
      const k = 't' + r.id, open = I.st.open[k], s = ST[r.status] || ST.never;
      c.appendChild(h('div', { class: 'dg-t' },
        h('div', { class: 'dg-th', onclick: () => { if (r.why || r.status === 'symptom') { I.st.open[k] = !open; render(I); } else showRefs(I, [r.id]); } },
          ic(s[0], 18), h('b', { class: 'ltr', text: r.tag }), h('span', { class: 'mute grow', text: T(r.name) }), h('span', { class: 'pill ' + (s[0] === 'ok' ? 'ok' : s[0] === 'q' ? 'warn' : 'bad'), text: T(s[1]) })),
        open ? h('div', { class: 'dg-fb' },
          r.blockedBy ? h('p', { text: T(['It waits for ', 'مستني ']) + r.blockedBy + T([', which does not work.', '، وده مش شغال.']) }) : null,
          r.why && r.why.length ? h('ul', { class: 'dg-steps' }, r.why.map((x) => h('li', { text: T(x) }))) : null,
          h('div', { class: 'row wrap' }, btn(T(['Show on drawing', 'وريني على الرسم']), () => showRefs(I, [r.id]), 'sm'),
            r.status !== 'works' ? btn(T(['Troubleshoot', 'تحديد العطل']), () => startTrouble(I, r.id), 'sm pri') : null)) : null));
    }
    return c;
  }

  /* ---------- AI ---------- */
  function aiOut(I, root) {
    const a = I.st.ai; if (!a.text && !a.busy && !a.err) return;
    root.appendChild(card('dg-ai', h('h3', { text: T(['AI review', 'مراجعة الذكاء الاصطناعي']) }),
      a.busy ? h('p', { class: 'mute', text: T(['Asking...', 'بسأل...']) }) : null,
      a.err ? h('p', { class: 'bad-t', text: a.err }) : null,
      a.text ? h('div', { class: 'dg-aitext', text: a.text }) : null));
  }
  function aiCard(I, root) {
    const cfg = EL.ai.cfg();
    const key = h('input', { type: 'password', placeholder: 'sk-ant-...', value: cfg.key || '', autocomplete: 'off', class: 'ltr' });
    const model = h('input', { type: 'text', value: cfg.model, class: 'ltr' });
    const det = h('details', { class: 'card dg', open: I.st.open.ai ? true : null, ontoggle: (e) => { I.st.open.ai = e.target.open; } },
      h('summary', { text: T(['AI mode (optional, online)', 'وضع الذكاء الاصطناعي (اختياري، أونلاين)']) }),
      h('p', { class: 'mute', text: T(['Needs internet and your own API key. The key stays in this browser only. A company network may block it. The built-in engine above works without any of this.', 'محتاج نت ومفتاح API بتاعك. المفتاح بيفضل في المتصفح ده بس. شبكة الشركة ممكن تحجبه. المحرك المدمج فوق بيشتغل من غير ده كله.']) }),
      h('label', { class: 'f', text: 'API key' }), key, h('label', { class: 'f', text: T(['Model', 'الموديل']) }), model,
      h('div', { class: 'row wrap', style: { marginTop: '8px' } },
        btn(T(['Save', 'احفظ']), () => { EL.ai.save({ key: key.value.trim(), model: model.value.trim() || 'claude-sonnet-5-5' }); ui.toast(['Saved on this device.', 'اتحفظ على الجهاز ده.'], 'ok'); }, 'sm'),
        btn(T(['Review this drawing with AI', 'راجع الرسم بالذكاء الاصطناعي']), () => { EL.ai.save({ key: key.value.trim(), model: model.value.trim() || 'claude-sonnet-5-5' }); DU.aiReview(I.kind); }, 'sm pri')));
    root.appendChild(det);
  }
  DU.aiReview = async function (kind) {
    const I = DU.inst[kind], st = I.st, ed = I.ed;
    st.ai = { text: '', busy: true, err: '' }; render(I);
    try {
      const res = st.res || Dg.analyze(ed.c);
      const found = res.findings.map((f) => '- [' + f.sev + '] ' + f.msg[0]).join('\n') || '(none)';
      const works = res.table.map((r) => '- ' + r.tag + ': ' + r.status).join('\n') || '(none)';
      const q = 'Here is a circuit drawn in a training/design tool.\n\n' + EL.ai.describe(ed.c) + '\n\nOUR BUILT-IN CHECKER SAYS (it simulates the circuit):\n' + found + '\n\nDEVICE STATUS:\n' + works +
        '\n\nReview it as a senior engineer. 1) Is it correct and safe? 2) What will not work and why? 3) What does the checker miss (standards, protection, selectivity, cable sizing, EMC, wiring practice)? 4) Concrete fixes. Keep it under 300 words. ' + EL.ai.lang();
      st.ai.text = await EL.ai.ask([{ role: 'user', content: q }]);
    } catch (e) { st.ai.err = String(e.message || e); }
    st.ai.busy = false; render(I);
  };

  /* ---------- cases ---------- */
  function casesCard(I, root) {
    const list = Ts.cases.list();
    const det = h('details', { class: 'card dg', open: I.st.open.cases ? true : null, ontoggle: (e) => { I.st.open.cases = e.target.open; } },
      h('summary', { text: T(['My solved cases (', 'الحالات اللي حليتها (']) + list.length + ')' }),
      h('p', { class: 'mute', text: T(['Every case you save makes the same fault more likely next time. Export the file to share it with a colleague.', 'كل حالة بتحفظها بتخلي نفس العطل أقرب في المرة الجاية. صدّر الملف وابعته لزميلك.']) }));
    list.slice(-12).reverse().forEach((r, i) => {
      det.appendChild(h('div', { class: 'dg-case' }, h('div', { class: 'grow' }, h('b', { text: T(r.label || ['', '']) }), h('div', { class: 'mute', style: { fontSize: '11px' }, text: (r.circuit ? T(r.circuit) + ' · ' : '') + new Date(r.t).toLocaleDateString() + ' · ' + (r.steps || 0) + ' ' + T(['checks', 'فحص']) })),
        btn('✕', () => { Ts.cases.remove(list.length - 1 - i); render(I); }, 'sm')));
    });
    const file = h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' }, onchange: (e) => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const n = Ts.cases.import(String(rd.result)); ui.toast(T(['Imported ', 'استوردت ']) + n, 'ok'); render(I); } catch (er) { ui.toast(['Not a cases file.', 'مش ملف حالات.'], 'bad'); } }; rd.readAsText(f); } });
    det.appendChild(h('div', { class: 'row wrap', style: { marginTop: '6px' } }, btn(T(['Export', 'تصدير']), () => ui.download('my-cases.json', Ts.cases.export()), 'sm'), h('label', { class: 'btn sm' }, T(['Import', 'استيراد']), file)));
    root.appendChild(det);
  }

  /* ---------- guided troubleshooting ---------- */
  function troubleCard(I, root) {
    const st = I.st, t = st.ts;
    const c = card('dg-ts', h('h3', { text: T(['Guided troubleshooting', 'تحديد العطل خطوة بخطوة']) }));
    root.appendChild(c);
    if (!t) {
      c.appendChild(h('p', { text: T(['Something does not work on the real machine or board? Tell me the symptom. I suggest what to measure first, you tell me what you got, and I narrow the suspects until one is left.', 'فيه حاجة مش شغالة في الماكينة أو الكارت الحقيقي؟ قولي العرض. هقولك تقيس إيه الأول، وانت تقولي طلع إيه، وأنا أضيّق الشكوك لحد ما يفضل واحد.']) }));
      c.appendChild(h('div', { class: 'row wrap' }, btn(T(['Start', 'ابدأ']), () => startTrouble(I), 'pri'), btn(T(['Give me a hidden fault to find', 'حطلي عطل مخفي ألاقيه']), () => challenge(I))));
      return;
    }
    if (t.phase === 'setup') return setupView(I, c, t);
    if (t.phase === 'compute') return computeView(I, c, t);
    return loopView(I, c, t);
  }
  function startTrouble(I, focusId) {
    const ed = I.ed, c = ed.c;
    if (!c.parts.length) { ui.toast(['Draw something first.', 'ارسم حاجة الأول.'], 'warn'); return; }
    const blind = hasHidden(c);
    const design = Dg.heal(U.clone(c));
    const logged = ed.finishLog ? ed.finishLog() : [];
    const sym = blind ? Ts.autoSymptoms(c) : {};
    if (focusId && !(focusId in sym)) sym[focusId] = false;
    I.st.ts = { phase: 'setup', sym, blind, useLog: logged.length > 0, logged, procDefault: Ts.defaultProc(design), design };
    I.st.open.ts = true; render(I); I.openPane();
    const el = I.root.querySelector('.dg-ts'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' });
  }
  function challenge(I) {
    const ed = I.ed;
    if (hasHidden(ed.c) && !confirm(T(['The drawing already has a hidden fault. Add another?', 'الرسم فيه عطل مخفي أصلا. أضيف تاني؟']))) return;
    ed.push && ed.push();
    const hh = Ts.challenge(ed.c);
    if (!hh) { ui.toast(['I could not find a fault that shows a symptom here.', 'ملقتش عطل بيطلع عرض في الدايرة دي.'], 'warn'); return; }
    ed.render(); ed.changed();
    ui.toast(['A fault is hidden somewhere. Switch to Test mode, run the machine and find it.', 'فيه عطل مخفي في حتة. روح وضع الاختبار وشغّل الماكينة ودوّر عليه.'], 'ok', 6000);
    I.st.ts = null; I.st.res = null; render(I);
  }
  function setupView(I, c, t) {
    const ed = I.ed, d = t.design;
    c.appendChild(h('h4', { text: T(['1. What does it do wrong?', '1. إيه اللي بيعمله غلط؟']) }));
    const devs = d.parts.filter((p) => U.isFunctional(p) && (U.meta(p).active || U.meta(p).feed));
    const prot = d.parts.filter((p) => U.meta(p).kind === 'protect' && !U.meta(p).fuse);
    if (t.blind) c.appendChild(h('p', { class: 'mute', text: T(['I filled this in from what the board does now. Change it if you saw something else.', 'ملّيت ده من اللي الكارت بيعمله دلوقتي. غيّره لو شفت حاجة تانية.']) }));
    const row = (key, p, labels) => {
      const cur = t.sym[key];
      const b = (val, txt, cls) => h('button', { class: 'btn sm' + (cur === val ? ' ' + cls : ''), onclick: () => { if (val === undefined) delete t.sym[key]; else t.sym[key] = val; render(I); }, text: T(txt) });
      return h('div', { class: 'dg-sym' }, h('b', { class: 'ltr', text: p.tag }), h('span', { class: 'mute grow', text: T(EL.defs[p.type].name) }),
        h('div', { class: 'seg' }, b(true, labels[0], 'ok'), b(false, labels[1], 'bad'), b(undefined, ['?', '؟'], 'on')));
    };
    for (const p of devs) c.appendChild(row(p.id, p, [['Works', 'شغال'], ['Does not', 'مش شغال']]));
    for (const p of prot) c.appendChild(row('trip:' + p.id, p, [['Tripped', 'فاصل'], ['On', 'شغال']]));
    c.appendChild(h('h4', { text: T(['2. What did you do before it failed?', '2. عملت إيه قبل ما يبوظ؟']) }));
    const proc = t.useLog && t.logged.length ? t.logged : t.procDefault;
    const lines = Ts.procText(d, proc);
    c.appendChild(lines.length ? h('ol', { class: 'dg-steps' }, lines.map((s) => h('li', { text: T(s) }))) : h('p', { class: 'mute', text: T(['Nothing to operate. I will just power it up.', 'مفيش حاجة تتشغل. هشغّلها بس.']) }));
    c.appendChild(h('div', { class: 'row wrap' },
      t.logged.length ? btn(T(['Use my Test-mode steps (', 'استخدم خطواتي في الاختبار (']) + t.logged.length + ')', () => { t.useLog = true; render(I); }, 'sm' + (t.useLog ? ' on' : '')) : null,
      btn(T(['Standard steps (switch on, press start)', 'خطوات عادية (شغّل واضغط ستارت)']), () => { t.useLog = false; render(I); }, 'sm' + (!t.useLog || !t.logged.length ? ' on' : ''))));
    const n = Object.keys(t.sym).length;
    c.appendChild(h('div', { class: 'row wrap', style: { marginTop: '8px' } }, btn(T(['Find the fault', 'دوّر على العطل']), () => computeStart(I, t, proc), 'pri' + (n ? '' : ' dim')), btn(T(['Cancel', 'إلغاء']), () => { I.st.ts = null; ed.clearMarks(); render(I); })));
    if (!n) c.appendChild(h('p', { class: 'mute', text: T(['Mark at least one device as "does not work".', 'علّم جهاز واحد على الأقل "مش شغال".']) }));
  }
  function computeStart(I, t, proc) {
    if (!Object.keys(t.sym).length) { ui.toast(['Mark the symptom first.', 'علّم العرض الأول.'], 'warn'); return; }
    const ed = I.ed;
    t.phase = 'compute'; render(I);
    setTimeout(() => {
      try {
        t.sess = Ts.begin(ed.c, { reality: ed.c, symptoms: t.sym, proc, init: ed.opInit });
      } catch (e) { console.error(e); t.phase = 'setup'; ui.toast(String(e.message || e), 'bad'); render(I); return; }
      const tick = () => {
        if (I.st.ts !== t) return;
        const done = Ts.work(t.sess, 14);
        const bar = I.root.querySelector('.dg-prog i'); if (bar) bar.style.width = Math.round(Ts.progress(t.sess) * 100) + '%';
        if (done) { t.phase = 'loop'; t.skipN = 0; render(I); } else setTimeout(tick, 0);
      };
      tick();
    }, 30);
  }
  function computeView(I, c, t) {
    c.appendChild(h('p', { text: T(['Trying every possible single fault on your drawing...', 'بجرّب كل عطل ممكن على رسمك...']) }));
    c.appendChild(h('div', { class: 'dg-prog' }, h('i')));
  }

  function loopView(I, c, t) {
    const ed = I.ed, sess = t.sess;
    const nx = Ts.next(sess), gs = Ts.groups(sess, nx.ranked);
    const top = gs[0];
    const done = top && (top.p >= 0.75 || !nx.best);
    // title row
    c.appendChild(h('div', { class: 'row wrap' }, h('span', { class: 'mute', text: sess.hyps.length + ' ' + T(['possible faults · ', 'عطل ممكن · ']) + sess.obs.length + ' ' + T(['checks done', 'فحص اتعمل']) }), h('span', { class: 'grow' }), btn(T(['Start over', 'من الأول']), () => { I.st.ts = null; ed.clearMarks(); render(I); }, 'sm')));
    if (sess.healthyMatches) c.appendChild(h('div', { class: 'dg-warnbox' }, T(['Careful: the drawing itself behaves the same way, with no fault at all. The problem may be in the design, not in a part. Run the diagnosis first.', 'خلي بالك: الرسم نفسه بيتصرف بنفس الشكل من غير أي عطل. ممكن المشكلة في التصميم مش في قطعة. شغّل الدايجنوسس الأول.'])));
    if (top && nx.ranked[0].h.mm > 0) c.appendChild(h('div', { class: 'dg-warnbox' }, T(['No single fault explains all your answers. Re-check a reading, or there may be two faults.', 'مفيش عطل واحد بيفسر كل إجاباتك. راجع قراية، أو ممكن يكون فيه عطلين.'])));
    // suspects
    c.appendChild(h('h4', { text: T(['Suspects', 'الشكوك']) }));
    gs.slice(0, 5).forEach((g1, i) => {
      if (g1.p < 0.01 && i > 0) return;
      c.appendChild(h('div', { class: 'dg-sus', onclick: () => markSuspect(I, g1.main) },
        h('div', { class: 'dg-bar' }, h('i', { style: { width: Math.max(2, Math.round(g1.p * 100)) + '%' } })),
        h('span', { class: 'dg-sl', text: T(g1.label) }), h('b', { class: 'ltr', text: Math.round(g1.p * 100) + '%' })));
    });
    if (done) return concludeView(I, c, t, gs);
    nextView(I, c, t, nx);
    historyView(I, c, t);
  }
  function markSuspect(I, hh, quiet) {
    const ed = I.ed, marks = [];
    if (hh.kind === 'wire') for (const r of hh.refs) marks.push({ ref: r, sym: 'q', txt: hh.label });
    else marks.push({ ref: hh.pid, sym: 'q', txt: hh.label });
    ed.setMarks(marks); if (!quiet) ed.focusRef(marks[0].ref);
  }

  function nextView(I, c, t, nx) {
    const ed = I.ed, sess = t.sess, cd = nx.best.cd, d = Ts.describe(sess, cd);
    const outs = Ts.outcomes(sess, cd, nx.live);
    const blind = t.blind;
    c.appendChild(h('h4', { text: T(['Next check', 'الفحص الجاي']) }));
    const box = h('div', { class: 'dg-next' }, h('div', { class: 'dg-nt', text: T(d.title) }), h('p', { text: T(d.how) }),
      d.safety ? h('div', { class: 'dg-safe', text: T(d.safety) }) : null);
    c.appendChild(box);
    const acts = h('div', { class: 'row wrap' });
    acts.appendChild(btn(T(['Show it', 'وريني فين']), () => { const ref = cd.ref || (cd.pid + (cd.a ? '.' + cd.a : '')); markNext(I, cd, ref); }, 'sm'));
    if (cd.k !== 'obs' && cd.k !== 'trip') acts.appendChild(btn(T(['Put the meter probes there', 'حط البروبات هناك']), () => putProbes(I, cd), 'sm'));
    if (blind) acts.appendChild(btn(T(['Measure it for me', 'قيسها أنت']), () => { const r = Ts.readReality(sess, cd); toastRead(cd, r); answer(I, cd, r.out, r.value); }, 'sm pri'));
    acts.appendChild(btn(T(['Skip', 'تخطّى']), () => { sess.skip.add(cd.key); render(I); }, 'sm'));
    c.appendChild(acts);
    c.appendChild(h('p', { class: 'mute', style: { margin: '8px 0 4px' }, text: T(['What did you get?', 'طلع إيه؟']) }));
    const ob = h('div', { class: 'dg-outs' });
    for (const o of outs) {
      const lab = d[o.key] || [o.key, o.key];
      const sub = o.top.length && o.p > 0.01 ? o.top.slice(0, 2).map((x) => T(x.label)).join(' / ') : T(['no suspect expects this', 'مفيش شك متوقع ده']);
      ob.appendChild(h('button', { class: 'dg-out', onclick: () => answer(I, cd, o.key) }, h('b', { text: T(lab) }), h('span', { class: 'mute', text: Math.round(o.p * 100) + '% · ' + sub })));
    }
    c.appendChild(ob);
    if (cd.k === 'volt' || cd.k === 'amp' || cd.k === 'ohm' || cd.k === 'contact') {
      const unit = cd.k === 'volt' ? 'V' : cd.k === 'amp' ? 'A' : 'Ω';
      const inp = h('input', { type: 'text', inputmode: 'decimal', placeholder: T(['Or type the reading (', 'أو اكتب القراية (']) + unit + (cd.k === 'ohm' || cd.k === 'contact' ? T([', OL for open', '، OL للمفتوح']) : '') + ')', class: 'ltr' });
      const go = () => { const raw = inp.value.trim(); if (!raw) return; const x = /^(ol|inf|open|∞)/i.test(raw) ? Infinity : parseFloat(raw.replace(',', '.')); if (isNaN(x)) { ui.toast(['Type a number.', 'اكتب رقم.'], 'warn'); return; } answer(I, cd, Ts.classOf(cd, x), x); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      c.appendChild(h('div', { class: 'row' }, inp, btn(T(['OK', 'تمام']), go, 'sm')));
    }
    if (d.tip) c.appendChild(h('p', { class: 'mute dg-tip', text: T(d.tip) }));
    markNext(I, cd, cd.ref || (cd.pid + (cd.a ? '.' + cd.a : '')), true);
  }
  function markNext(I, cd, ref, quiet) {
    const ed = I.ed; ed.setMarks([{ ref: ref, sym: 'q', txt: ['Check here', 'افحص هنا'] }].concat(cd.pole && cd.k === 'volt' ? [{ ref: cd.pole, sym: 'w', txt: ['Black lead here', 'الأسود هنا'] }] : []));
    if (!quiet) ed.focusRef(ref);
  }
  function toastRead(cd, r) {
    const v = r.value;
    const txt = cd.k === 'volt' ? fix1(v) + ' V' : cd.k === 'amp' ? fix1(v) + ' A' : cd.k === 'ohm' || cd.k === 'contact' ? (isFinite(v) && v < 5e7 ? fix1(v) + ' Ω' : 'OL') : T(r.out === 'yes' ? ['Yes', 'أيوه'] : ['No', 'لأ']);
    ui.toast(T(['Reading: ', 'القراية: ']) + txt, 'ok', 3000);
  }
  function putProbes(I, cd) {
    const ed = I.ed, X = EL.inst;
    if (ed.mode !== 'test') { if (I.kind === 'bench') EL.bench.setMode('test'); else EL.pcb.setMode('test'); }
    if (cd.k === 'volt') { X.sel = 'dmm'; X.dmm.dial = cd.ac === false ? 'VDC' : 'VAC'; X.dmm.jack = 'V'; X.probes.red = cd.ref; X.probes.black = cd.pole; }
    else if (cd.k === 'amp') { X.sel = 'clamp'; X.clamp.dial = 'AAC'; X.probes.clamp = cd.ref; }
    else { X.sel = 'dmm'; X.dmm.dial = 'OHM'; X.dmm.jack = 'V'; X.probes.red = cd.pid + '.' + cd.a; X.probes.black = cd.pid + '.' + cd.b; }
    if (ui.inst) { ui.inst.render(); ui.inst.onProbe && ui.inst.onProbe(); }
    if (I.kind === 'bench') EL.bench.openPane('meters'); else { EL.pcb.pane('meters'); EL.pcb.sheet && window.innerWidth <= 900 && EL.pcb.sheet('side'); }
    ui.toast(cd.k === 'ohm' || cd.k === 'contact' ? ['Probes placed. For a real measurement the part must be isolated first (LOTO).', 'البروبات اتحطت. في الحقيقي لازم تعزل القطعة الأول (لوتو).'] : ['Probes placed. Read the meter.', 'البروبات اتحطت. اقرا الجهاز.'], 'ok', 4500);
  }
  function answer(I, cd, out, value) { Ts.answer(I.st.ts.sess, cd, out, value); render(I); }
  function historyView(I, c, t) {
    const sess = t.sess; if (!sess.obs.length) return;
    c.appendChild(h('h4', { text: T(['Your answers', 'إجاباتك']) }));
    const ul = h('div', { class: 'dg-hist' });
    sess.obs.forEach((o) => { const d = Ts.describe(sess, o.cd); ul.appendChild(h('div', { class: 'dg-hi' }, h('span', { class: 'grow', text: T(d.title) }), h('b', { text: o.value != null && isFinite(o.value) ? (o.cd.k === 'volt' ? fix1(o.value) + ' V' : o.cd.k === 'amp' ? fix1(o.value) + ' A' : fix1(o.value) + ' Ω') : T(d[o.out] || [o.out, o.out]) }))); });
    c.appendChild(ul);
    c.appendChild(btn(T(['Undo last answer', 'امسح آخر إجابة']), () => { Ts.undo(sess); render(I); }, 'sm'));
  }

  function concludeView(I, c, t, gs) {
    const ed = I.ed, sess = t.sess, top = gs[0], hh = top.main;
    c.appendChild(h('h4', { text: T(['Most likely', 'الأرجح']) }));
    const fixT = Ts.fixOf(hh), tip = Ts.tipFor(hh);
    c.appendChild(h('div', { class: 'dg-concl' },
      h('div', { class: 'row' }, ic('bad', 26), h('div', { class: 'grow' }, h('div', { class: 'dg-vt', text: T(top.label) }), h('div', { class: 'mute', text: Math.round(top.p * 100) + '% ' + T(['sure', 'متأكد']) + (top.hs.length > 1 ? ' · ' + T(['these cannot be told apart by measuring; the repair is the same', 'دول مينفعش تفرق بينهم بالقياس؛ والإصلاح واحد']) : '') }))),
      h('p', {}, h('b', { text: T(['What to do: ', 'تعمل إيه: ']) }), T(fixT)),
      tip ? h('p', { class: 'mute', text: T(tip) }) : null));
    if (gs[1] && gs[1].p >= 0.08) c.appendChild(h('p', { class: 'mute', text: T(['Next most likely: ', 'اللي بعده: ']) + T(gs[1].label) + ' (' + Math.round(gs[1].p * 100) + '%)' }));
    const acts = h('div', { class: 'row wrap' });
    acts.appendChild(btn(T(['Show on drawing', 'وريني على الرسم']), () => { markSuspect(I, hh); }, 'sm'));
    if (t.blind) acts.appendChild(btn(T(['Fix it in the simulator and test', 'صلّحه في المحاكي وجرّب']), () => {
      const v = Ts.verifyFix(sess, hh); ed.push && ed.push(); Ts.applyFix(ed.c, hh); ed.setMarks([]); ed.render(); ed.changed();
      ui.toast(v.ok ? ['Fixed. The symptom is gone.', 'اتصلح. العرض راح.'] : ['Repaired this part, but the symptom is still there. There may be a second fault.', 'صلّحت القطعة بس العرض لسه موجود. ممكن فيه عطل تاني.'], v.ok ? 'ok' : 'warn', 6000);
      Ts.saveCase(sess, hh); I.st.ts = null; render(I);
    }, 'sm pri'));
    acts.appendChild(btn(T(['Save as a solved case', 'احفظها كحالة محلولة']), () => { Ts.saveCase(sess, hh); ui.toast(['Saved. It will count next time.', 'اتحفظت. هتتحسب المرة الجاية.'], 'ok'); render(I); }, 'sm'));
    c.appendChild(acts);
    c.appendChild(h('p', { class: 'mute', text: T(['If you disagree, undo the last answer and try the other check.', 'لو مش موافق، امسح آخر إجابة وجرّب فحص تاني.']) }));
    historyView(I, c, t);
    markSuspect(I, hh, true);
    // AI second opinion
    if (EL.ai.ready()) c.appendChild(btn(T(['Ask AI for a second opinion', 'اسأل الذكاء الاصطناعي رأي تاني']), () => aiTrouble(I), 'sm'));
  }
  async function aiTrouble(I) {
    const st = I.st, t = st.ts, sess = t.sess, ed = I.ed;
    st.ai = { text: '', busy: true, err: '' }; render(I);
    try {
      const nx = Ts.next(sess), gs = Ts.groups(sess, nx.ranked);
      const sym = Object.keys(sess.symptoms).map((k) => { const id = k.replace('trip:', ''); const p = EL.partById(ed.c, id); return (p ? p.tag : id) + (k.startsWith('trip:') ? (sess.symptoms[k] ? ' tripped' : ' not tripped') : sess.symptoms[k] ? ' works' : ' does NOT work'); }).join(', ');
      const ans = sess.obs.map((o) => '- ' + Ts.describe(sess, o.cd).title[0] + ': ' + (o.value != null && isFinite(o.value) ? o.value : o.out)).join('\n');
      const q = 'Troubleshooting a circuit.\n\n' + EL.ai.describe(sess.design) + '\n\nSYMPTOMS: ' + sym + '\nMEASUREMENTS SO FAR:\n' + (ans || '(none)') + '\n\nOUR SIMULATION-BASED RANKING:\n' + gs.slice(0, 5).map((g1) => '- ' + g1.label[0] + ' ' + Math.round(g1.p * 100) + '%').join('\n') + '\n\nGive a second opinion: do you agree? What would you check first, and what could the model have missed (intermittent, EMC, mechanical, wrong settings)? Under 200 words. ' + EL.ai.lang();
      st.ai.text = await EL.ai.ask([{ role: 'user', content: q }]);
    } catch (e) { st.ai.err = String(e.message || e); }
    st.ai.busy = false; render(I);
  }
})(typeof window !== 'undefined' ? window : globalThis);
