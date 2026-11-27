/* Project documents generated from the drawing: bill of materials, PLC I/O list, wire list (from/to, size),
   site cable list (plant <-> panel) and terminal plan. Shown in a dialog with CSV download and print. */
(function (g) {
  const EL = g.EL, ui = EL.ui, h = EL.h, T = ui.T;
  const DOC = (ui.docs = {});
  const C = () => EL.bench.ed.c;
  const csvCell = (v) => { const s = String(v == null ? '' : v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const nm = (x) => (Array.isArray(x) ? T(x) : String(x || ''));

  function propText(p) {
    const d = EL.defs[p.type], out = [];
    for (const pr of d.props || []) {
      if (!pr || !pr.k || pr.t === 'text' || pr.k === 'prog' || pr.k === 'lad' || pr.k === 'mode') continue;
      const v = p.props[pr.k]; if (v == null || v === '' || typeof v === 'object') continue;
      let vv = v; if (pr.opts) { const o = pr.opts.find((q) => String(q[0]) === String(v)); if (o) vv = Array.isArray(o[1]) ? T(o[1]) : o[1]; }
      out.push(nm(pr.label) + ': ' + vv + (pr.unit ? ' ' + pr.unit : ''));
    }
    return out.join(' · ');
  }
  DOC.bom = function (c) {
    return c.parts.filter((p) => { const d = EL.defs[p.type]; return d && d.cat !== 'draw' && !d.board; }).sort((a, b) => String(a.tag).localeCompare(String(b.tag), undefined, { numeric: true }))
      .map((p) => [p.tag || '', nm(EL.defs[p.type].name), p.type, propText(p)]);
  };
  /* wires with numbers; the net walk lets the I/O list name the field device behind a terminal */
  DOC.wires = function (c) {
    const tagOf = (ref) => { const [id, pin] = ref.split('.'); const p = c.parts.find((x) => x.id === id); return p ? (p.tag || p.type) + ':' + pin : ref; };
    const WS = EL.WIRE, ed = EL.bench && EL.bench.ed, roleOf = ed && ed.roleOf ? ed.roleOf : () => null;
    const colName = { L1: ['brown', 'بني'], L2: ['black', 'أسود'], L3: ['grey', 'رمادي'], N: ['blue', 'أزرق'], PE: ['green-yellow', 'أخضر-أصفر'], pos: ['red (+24 V)', 'أحمر (+24)'], neg: ['blue (0 V)', 'أزرق (0 فولت)'] };
    return c.wires.map((w, i) => {
      const mm = WS ? WS.mm2(c, w) : null, auto = WS && !WS.ok(w.mm2), r = roleOf(w.id);
      return ['W' + (i + 1), tagOf(w.a), tagOf(w.b), mm ? mm + ' mm²' + (auto ? ' (' + T(['standard', 'قياسي']) + ')' : '') : '', w.color || (r && colName[r] ? T(colName[r]) : '')];
    });
  };
  function neighbours(c, ref, depth) {
    const out = [], seen = new Set([ref]); let front = [ref];
    for (let k = 0; k < (depth || 2); k++) {
      const next = [];
      for (const r of front) for (const w of c.wires) {
        const o = w.a === r ? w.b : w.b === r ? w.a : null; if (!o || seen.has(o)) continue; seen.add(o);
        const [id] = o.split('.'), p = c.parts.find((x) => x.id === id); if (!p) continue;
        if (/^TERM|^JBOX|^LUG/.test(p.type)) { for (const q of EL.pinsOf(p)) { const r2 = id + '.' + q.id; if (!seen.has(r2) && sameTerminal(o, r2)) { seen.add(r2); next.push(r2); } } out.push({ via: (p.tag || p.type) + ':' + o.split('.')[1] }); }
        else out.push({ dev: (p.tag || p.type) + ':' + o.split('.')[1], name: nm(EL.defs[p.type].name) });
      }
      front = next;
    }
    return out;
  }
  function sameTerminal(a, b) { const pa = a.split('.')[1], pb = b.split('.')[1]; const n = (s) => s.replace(/[ab]$/i, '').replace(/^(\d+)[._-]?[12]$/, '$1'); return n(pa) === n(pb); }
  DOC.io = function (c) {
    const LD = EL.ladder, rows = [];
    for (const p of c.parts) {
      const d = EL.defs[p.type]; if (!d || (d.diag || {}).kind !== 'plc') continue;
      const prog = p.props.mode === 'ladder' && LD ? LD.progOf(p) : null;
      for (const q of EL.pinsOf(p)) {
        let addr = null, kind = '';
        let m = /^I(\d+)$/.exec(q.id); if (m) { const i = +m[1]; addr = 'I' + (i >> 3) + '.' + (i & 7); kind = 'DI'; }
        if ((m = /^Q(\d+)$/.exec(q.id))) { const i = +m[1]; addr = 'Q' + (i >> 3) + '.' + (i & 7); kind = 'DO'; }
        if ((m = /^AI(\d+)$/.exec(q.id))) { addr = 'IW' + (64 + 2 * +m[1]); kind = 'AI'; }
        if ((m = /^AO(\d+)$/.exec(q.id))) { addr = 'QW' + (64 + 2 * +m[1]); kind = 'AO'; }
        if (!addr) continue;
        const nb = neighbours(c, p.id + '.' + q.id, 3), dev = nb.filter((x) => x.dev).map((x) => x.dev + ' (' + x.name + ')').join(', '), via = nb.filter((x) => x.via).map((x) => x.via).join(', ');
        const sym = prog && LD.symName ? LD.symName(prog, addr) : '';
        if (!dev && !sym) continue;
        rows.push([(p.tag || p.type), kind, addr, sym || '', dev || '-', via]);
      }
    }
    return rows;
  };
  DOC.cables = function (c) {
    const L = ui.floor ? ui.floor.links() : [];
    const FN = { motor: ['Motor power', 'باور الموتور'], sol: ['Valve coil', 'كويل المحبس'], cyl: ['Cylinder valve coil', 'كويل محبس السلندر'], s1: ['Sensor at the filler', 'حساس عند الفيلر'], s2: ['Sensor at the capper', 'حساس عند الكابس'], rup: ['Cylinder up sensor', 'حساس السلندر فوق'], rdn: ['Cylinder down sensor', 'حساس السلندر تحت'], lt: ['Level transmitter', 'ترانسميتر مستوى'], tt: ['Temperature', 'حرارة'], htr: ['Heater', 'سخان'], tx: ['Transmitter', 'ترانسميتر'] };
    return L.map((l, i) => ['C' + (i + 1), (l.u.tag || '') + ' (' + nm((EL.plant.defs[l.u.type] || {}).name) + ')', (l.p.tag || '') + ' (' + nm(EL.defs[l.p.type].name) + ')', FN[l.why] ? T(FN[l.why]) : T(['Level switch ', 'سويتش مستوى ']) + l.why]);
  };
  DOC.terminals = function (c) {
    const rows = [];
    for (const p of c.parts) {
      if (!/^TERM/.test(p.type)) continue;
      for (const q of EL.pinsOf(p)) {
        const ws = c.wires.filter((w) => w.a === p.id + '.' + q.id || w.b === p.id + '.' + q.id);
        if (!ws.length) continue;
        const other = ws.map((w) => { const o = w.a === p.id + '.' + q.id ? w.b : w.a, [id, pin] = o.split('.'), pp = c.parts.find((x) => x.id === id); return pp ? (pp.tag || pp.type) + ':' + pin : o; });
        rows.push([(p.tag || p.type) + ':' + q.id, other.join(', ')]);
      }
    }
    return rows;
  };
  const SHEETS = [
    ['bom', ['Bill of materials', 'قايمة المكونات (BOM)'], [['Tag', 'التاج'], ['Device', 'الجهاز'], ['Type', 'النوع'], ['Data', 'البيانات']], DOC.bom],
    ['io', ['PLC I/O list', 'قايمة مداخل ومخارج الـPLC'], [['PLC', 'الـPLC'], ['Kind', 'النوع'], ['Address', 'العنوان'], ['Symbol', 'الاسم'], ['Field device', 'الجهاز في الموقع'], ['Via terminal', 'عن طريق ترمينال']], DOC.io],
    ['cables', ['Site cable list', 'قايمة كابلات الموقع'], [['Cable', 'الكابل'], ['Plant item', 'جهاز العملية'], ['Panel device', 'جهاز اللوحة'], ['Function', 'الوظيفة']], DOC.cables],
    ['wires', ['Wire list (from / to)', 'قايمة الأسلاك (من / إلى)'], [['Wire', 'السلك'], ['From', 'من'], ['To', 'إلى'], ['Size', 'المقطع'], ['Colour', 'اللون']], DOC.wires],
    ['terms', ['Terminal plan', 'خطة الترمينالات'], [['Terminal', 'الترمينال'], ['Connected to', 'متوصل بـ']], DOC.terminals],
  ];
  DOC.open = function (which) {
    const c = C(); let cur = which || 'bom';
    const tabs = h('div', { class: 'seg doc-tabs' }), body = h('div', { class: 'doc-body' });
    const title = (c.name ? nm(c.name) : T(['My drawing', 'الرسمة بتاعتي']));
    function show() {
      for (const b of tabs.children) b.classList.toggle('on', b.dataset.k === cur);
      const S = SHEETS.find((x) => x[0] === cur), rows = S[3](c);
      body.innerHTML = '';
      body.append(h('div', { class: 'row doc-acts' },
        h('span', { class: 'mute', text: rows.length + ' ' + T(['rows', 'سطر']) }),
        h('button', { type: 'button', class: 'btn', text: '⬇ CSV', onclick: () => ui.download('lab-' + ((c.proj && c.proj.id) || 'drawing') + '-' + S[0] + '.csv', '﻿' + [S[2].map((x) => T(x))].concat(rows).map((r) => r.map(csvCell).join(',')).join('\r\n'), 'text/csv') }),
        h('button', { type: 'button', class: 'btn', text: '🖨 ' + T(['Print', 'اطبع']), onclick: () => print(S, rows) })));
      if (!rows.length) { body.append(h('p', { class: 'mute', text: T(['Nothing to list yet in this drawing.', 'لسه مفيش حاجة تتكتب في الرسمة دي.']) })); return; }
      const tb = h('table', { class: 'doc-t' }); tb.append(h('thead', {}, h('tr', {}, S[2].map((x) => h('th', { text: T(x) })))));
      const bd = h('tbody'); for (const r of rows) bd.append(h('tr', {}, r.map((v, i) => h('td', { class: i < 3 ? 'ltr' : '', text: String(v) })))); tb.append(bd);
      body.append(h('div', { class: 'doc-wrap' }, tb));
    }
    for (const S of SHEETS) tabs.append(h('button', { type: 'button', class: 'btn', 'data-k': S[0], text: T(S[1]), onclick: () => { cur = S[0]; show(); } }));
    ui.modal(h('div', { class: 'doc' }, h('h3', { text: '📄 ' + T(['Project documents', 'مستندات المشروع']) + ' · ' + title }), h('p', { class: 'mute small', text: T(['Made from the drawing, so they always match it. Use them like the real panel documents: check, mark up and file.', 'متعملة من الرسمة، فبتطابقها دايمًا. استخدمها زي مستندات اللوحة الحقيقية: راجع وعلّم واحفظ.']) }), tabs, body));
    show();
  };
  function print(S, rows) {
    const esc = (s) => String(s).replace(/[&<>]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[x]));
    const dir = document.documentElement.dir || 'ltr', c = C();
    const html = `<!doctype html><html dir="${dir}"><meta charset="utf-8"><title>${esc(T(S[1]))}</title><style>body{font:12px Segoe UI,Arial,sans-serif;margin:18px}h1{font-size:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:4px 6px;text-align:start}th{background:#242269;color:#fff}tr:nth-child(even) td{background:#eef1f6}</style><h1>${esc(T(S[1]))} · ${esc(c.name ? nm(c.name) : '')}</h1><p>${esc(new Date().toISOString().slice(0, 10))}</p><table><tr>${S[2].map((x) => '<th>' + esc(T(x)) + '</th>').join('')}</tr>${rows.map((r) => '<tr>' + r.map((v) => '<td>' + esc(v) + '</td>').join('') + '</tr>').join('')}</table>`;
    const w = g.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank');
    if (!w) ui.toast(['Allow pop-ups to print, or use CSV.', 'اسمح بالنوافذ المنبثقة عشان تطبع، أو استخدم CSV.'], 'warn');
    else setTimeout(() => { try { w.print(); } catch (e) {} }, 600);
  }
})(typeof window !== 'undefined' ? window : globalThis);
