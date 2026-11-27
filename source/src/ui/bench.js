/* Bench tab: palette, toolbar, inspector, simulation loop */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, $ = ui.$;
  const CATS = [['board', ['Board parts', 'قطع الدائرة']], ['source', ['Sources', 'مصادر']], ['protect', ['Protection', 'حماية']], ['power', ['Drives', 'انفرتر']], ['control', ['Control', 'تحكم']], ['auto', ['Automation (PLC, I/O)', 'أتمتة (PLC ومداخل ومخارج)']], ['load', ['Loads', 'أحمال']], ['field', ['Field devices', 'حساسات وحقل']], ['wiring', ['Wiring, terminals, cables', 'توصيلات وترمينالات وكابلات']], ['elec', ['Electronics', 'إلكترونيات']], ['draw', ['Labels and frames', 'أسماء وإطارات']]];
  const PCB_ORDER = ['board', 'elec', 'load', 'field', 'wiring', 'draw'];
  const B = (EL.bench = { ed: null, speed: 1, paused: false, simTime: 0 });

  /* ---------- palette ---------- */
  function previewSvg(type, ed0) {
    const d = EL.defs[type], p = EL.newPart(type, 0, 0);
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', `-6 -6 ${d.w + 12} ${d.h + 12}`);
    try { const rf = B.ed && B.ed.real && ed0 !== 'pcb' && EL.real && EL.real[type]; s.innerHTML = rf ? rf(p, d) : d.draw(p); } catch (e) { s.innerHTML = ''; }
    return s;
  }
  function buildPalette(root, ed, q, onAdd) {
    root.innerHTML = '';
    const term = (q || '').trim().toLowerCase();
    const cats = ed.kind === 'pcb' ? PCB_ORDER.map((k) => CATS.find((c) => c[0] === k)).filter(Boolean) : CATS;
    for (const [cat, nm] of cats) {
      const types = Object.keys(EL.defs).filter((k) => EL.defs[k].cat === cat && !EL.defs[k].hidden && (ed.kind === 'pcb' ? !!(EL.defs[k].board || EL.defs[k].pcb) : !EL.defs[k].board));
      const shown = types.filter((k) => !term || EL.defs[k].name.join(' ').toLowerCase().includes(term) || k.toLowerCase().includes(term));
      if (!shown.length) continue;
      const grp = h('div', { class: 'pgrp' });
      const items = h('div', { class: 'pitems' });
      const head = h('div', { class: 'pgh', onclick: () => { items.style.display = items.style.display === 'none' ? '' : 'none'; } }, h('span', { text: T(nm) }), h('span', { text: '▾' }));
      for (const k of shown) {
        const d = EL.defs[k];
        const it = h('div', { class: 'pit', title: T(d.name) }, previewSvg(k, ed.kind), h('span', { text: T(d.name) }));
        it.addEventListener('pointerdown', (e) => paletteDrag(e, k, d, ed, onAdd));
        items.appendChild(it);
      }
      grp.appendChild(head); grp.appendChild(items); root.appendChild(grp);
    }
  }
  function setModeOf(ed, m) { if (ed === B.ed) B.setMode(m); else if (EL.pcb) EL.pcb.setMode(m); }
  function paletteDrag(e, type, d, ed, onAdd) {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY; let ghost = null, moved = false;
    const mv = (ev) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) { moved = true; ghost = h('div', { class: 'ghost', text: T(d.name) }); document.body.appendChild(ghost); }
      if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; }
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      if (ghost) ghost.remove();
      if (moved) {
        const r = ed.host.getBoundingClientRect();
        if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
          if (ed.mode !== 'build') setModeOf(ed, 'build');
          const w = ed.toWorld(ev.clientX, ev.clientY); ed.addPart(type, w.x, w.y); if (onAdd) onAdd();
        }
      } else {
        if (ed.mode !== 'build') setModeOf(ed, 'build');
        ed.addPart(type); if (onAdd) onAdd(true);
      }
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }
  EL.ui.buildPalette = buildPalette;

  /* ---------- inspector ---------- */
  const fmtV = (v) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));
  function inspector(ed) {
    if (ed === B.ed && B.view && B.view !== 'panel') { if (B.sideFor) B.sideFor(); return; }
    const root = $(ed.kind === 'pcb' ? '#ppane-part' : '#pane-part');
    root.innerHTML = '';
    const p = ed.part();
    if (!p) {
      const w = ed.selWire && ed.c.wires.find((x) => x.id === ed.selWire);
      if (w && ed.kind !== 'pcb' && EL.WIRE) { wireCard(ed, w, root); return; }
      if (w) {
        root.appendChild(h('div', { class: 'card' }, h('h3', { text: T(['Wire', 'سلك']) }), h('p', { class: 'ltr', text: EL.refLabel(ed.c, w.a) + '  to  ' + EL.refLabel(ed.c, w.b) }),
          h('p', { class: 'mute', text: T(['Drag the yellow dot to move the wire path. Delete removes the wire.', 'اسحب النقطة الصفرا عشان تغير مسار السلك. زرار الحذف بيشيله.']) }),
          h('div', { class: 'row wrap' }, h('button', { class: 'btn bad', onclick: () => ed.delSel(), text: T(['Delete wire', 'احذف السلك']) }),
            ed.kind === 'pcb' ? h('button', { class: 'btn', onclick: () => { ed.toggleCut(w.id); inspector(ed); }, text: w.cut ? T(['Restore trace', 'رجّع المسار']) : T(['Cut trace', 'اقطع المسار']) }) : null)));
        return;
      }
      root.appendChild(h('div', { class: 'card' }, h('h3', { text: T(['Nothing selected', 'مفيش حاجة متحددة']) }), h('p', { class: 'mute', text: T(['Tap a part to see its details, properties and live values. Tap a terminal in Build mode to start a wire.', 'اضغط على أي جهاز عشان تشوف تفاصيله وخصائصه وقيمه الحية. اضغط على طرف في وضع البناء عشان تبدأ سلك.']) })));
      return;
    }
    const d = EL.defs[p.type];
    const tagIn = h('input', { type: 'text', value: p.tag, maxlength: 10, onchange: (e) => { ed.push(); p.tag = e.target.value.trim() || p.tag; ed.touch(); }, style: { maxWidth: '110px' } });
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'row' }, tagIn, h('div', { class: 'grow' }, h('b', { text: T(d.name) }))),
      h('p', { class: 'mute', text: T(d.info || ['', '']) }),
      h('div', { class: 'row wrap' },
        ed.mode === 'build' ? [h('button', { class: 'btn', onclick: () => { ed.dup(); }, text: T(['Duplicate', 'نسخ']) }), h('button', { class: 'btn bad', onclick: () => ed.delSel(), text: T(['Delete', 'حذف']) })] : null)));
    if (/^(MOT3|MOT1)$/.test(p.type) && EL.motorPlate && ed.kind !== 'pcb') root.appendChild(plateCard(p));
    if (d.props && d.props.length) {
      const card = h('div', { class: 'card' }, h('h3', { text: T(['Properties', 'الخصائص']) }));
      for (const pr of d.props) {
        if (pr.t === 'hidden' || (pr.when && !pr.when(p))) continue;
        let inp;
        if (pr.t === 'sel') inp = h('select', { onchange: (e) => { ed.push(); const v = pr.opts.find((o) => String(o[0]) === e.target.value)[0]; p.props[pr.k] = v; ed.touch(); if (pr.k === 'mode' || /^(MOT3|MOT1)$/.test(p.type)) inspector(ed); } }, pr.opts.map((o) => h('option', { value: o[0], selected: String(o[0]) === String(p.props[pr.k]) ? true : null, text: o[1] })));
        else if (pr.t === 'num') inp = h('input', { type: 'number', min: pr.min, max: pr.max, step: pr.step || 1, value: p.props[pr.k], onchange: (e) => { ed.push(); p.props[pr.k] = Math.max(pr.min, Math.min(pr.max, +e.target.value || pr.def)); ed.touch(); } });
        else if (pr.t === 'text') inp = h('textarea', { rows: pr.rows || 4, maxlength: pr.max || 160, spellcheck: false, class: 'code', value: p.props[pr.k], onchange: (e) => { ed.push(); p.props[pr.k] = e.target.value; ed.touch(); } });
        else if (pr.t === 'text1') inp = h('input', { type: 'text', maxlength: pr.max || 14, value: p.props[pr.k], onchange: (e) => { ed.push(); p.props[pr.k] = e.target.value.trim() || pr.def; ed.touch(); } });
        else if (pr.t === 'bool') inp = h('button', { class: 'btn ' + (p.props[pr.k] ? 'on' : ''), onclick: () => { ed.push(); p.props[pr.k] = !p.props[pr.k]; ed.touch(); inspector(ed); }, text: p.props[pr.k] ? T(['Yes', 'أيوه']) : T(['No', 'لأ']) });
        else inp = h('span', { text: String(p.props[pr.k]) });
        card.appendChild(h('label', { class: 'f', text: T(pr.label) })); card.appendChild(inp);
      }
      if ((EL.defs[p.type].diag || {}).kind === 'plc' && EL.ui.ladder) card.appendChild(h('div', { class: 'row wrap', style: { marginTop: '8px' } }, h('button', { class: 'btn pri', onclick: () => EL.ui.ladder.openFor(p), text: T(['Open ladder editor', 'افتح محرر اللادر']) })));
      root.appendChild(card);
    }
    if (d.faults && d.faults.length > 1) {
      const hidden = p.hid && !ed.showHidden;
      const card = h('div', { class: 'card' }, h('h3', { text: T(['Fault simulation', 'محاكاة عطل']) }));
      if (hidden) card.appendChild(h('p', { class: 'mute', text: T(['A fault is hidden on some part. Find it with the meters.', 'فيه عطل مخفي في جهاز. دوّر عليه بالأجهزة.']) }));
      else card.appendChild(h('select', { onchange: (e) => { ed.push(); p.fault = e.target.value; p.hid = false; ed.touch(); } }, d.faults.map((f) => h('option', { value: f[0], selected: p.fault === f[0] ? true : null, text: T(f[1]) }))));
      root.appendChild(card);
    }
    // live
    const live = h('div', { class: 'card', id: ed.kind === 'pcb' ? 'plive' : 'live' });
    root.appendChild(live);
    if (ed.kind === 'pcb') {
      if (d.faults && d.faults.length > 1) root.appendChild(h('div', { class: 'row wrap' }, h('button', { class: 'btn', onclick: () => EL.pcb.replace(p), text: T(['Replace with a new part', 'غيّرها بقطعة جديدة']) })));
    } else root.appendChild(h('div', { class: 'row wrap' }, h('button', { class: 'btn', onclick: () => EL.ui.assist && EL.ui.assist.explain(p), text: T(['Why is it not energised?', 'ليه مش شغال؟']) })));
    B.updateLive(true);
  }
  B.inspector = inspector;
  /* panel wire: size, Iz, live current and temperature, replace after a burn */
  function wireCard(ed, w, root) {
    const WS = EL.WIRE, mm = WS.mm2(ed.c, w), auto = !WS.ok(w.mm2), kind = WS.kindOf(ed.c, w);
    const sel = h('select', { 'aria-label': T(['Wire size', 'مقاس السلك']), onchange: (e) => { ed.setWireMm2(w.id, e.target.value ? +e.target.value : null); inspector(ed); } },
      [h('option', { value: '', selected: auto ? true : null, text: T(['Auto', 'تلقائي']) + ': \u200E' + mm + ' mm²\u200E ' + T(kind === 'C' ? ['control', 'كنترول'] : ['power', 'باور']) })].concat(WS.sizes.map((x) => h('option', { value: String(x), selected: !auto && +w.mm2 === x ? true : null, text: '\u200E' + x + ' mm²  (Iz ' + WS.iz[x] + ' A)\u200E' }))));
    root.appendChild(h('div', { class: 'card wcard' }, h('h3', { text: T(['Wire', 'سلك']) }),
      h('p', { class: 'ltr', text: EL.refLabel(ed.c, w.a) + '  to  ' + EL.refLabel(ed.c, w.b) }),
      w.burnt ? h('div', { class: 'wburnt', text: '🔥 ' + T(['The insulation burnt and the wire is open. Replace it, best with a bigger size, and fix what overloaded it.', 'العزل اتحرق والسلك مفتوح. غيّره، والأحسن بمقاس أكبر، وصلّح سبب الحمل الزيادة.']) }) : null,
      h('label', { class: 'f', text: T(['Wire size (cross-section)', 'مقاس السلك (المقطع)']) }), h('div', { class: 'wrow' }, sel, h('b', { class: 'ltr', text: 'Iz ' + WS.iz[mm] + ' A' })),
      h('div', { id: 'wlive' }),
      h('p', { class: 'mute', text: T(WS.std) }),
      h('p', { class: 'mute', text: T(['Drag the yellow dot to move the wire path. Delete removes the wire. In Test the wire heats when its current is above Iz: orange above 70 °C, red above 120 °C; at about 2.5 x Iz for a while the insulation burns (shown about 2 x faster than a real cable).', 'اسحب النقطة الصفرا عشان تغيّر مسار السلك. زرار الحذف بيشيله. في الاختبار السلك بيسخن لما تياره يزيد عن Iz: برتقاني فوق 70 درجة، أحمر فوق 120؛ وعند حوالي 2.5 ضعف Iz فترة العزل بيتحرق (أسرع من الكابل الحقيقي بحوالي مرتين).']) }),
      h('div', { class: 'row wrap' }, w.burnt ? h('button', { class: 'btn pri', onclick: () => { ed.replaceWire(w.id); inspector(ed); }, text: T(['Replace wire', 'غيّر السلك']) }) : null,
        h('button', { class: 'btn bad', onclick: () => ed.delSel(), text: T(['Delete wire', 'احذف السلك']) }))));
    B.updateLive(true);
  }
  function wireLive(ed, w) {
    const WS = EL.WIRE, s = ed.c.wth && ed.c.wth[w.id], I = w.cut ? 0 : (ed.c.sim && ed.c.sim.wireI && ed.c.sim.wireI.get(w.id)) || 0, iz = WS.izOf(ed.c, w), Tc = WS.temp(ed.c, w);
    const pc = Math.min(100, (100 * I) / iz), cls = Tc >= WS.tHot || I > 2.2 * iz ? 'w2' : Tc > WS.tMax || I > iz ? 'w1' : '';
    const st = w.burnt ? T(['burnt', 'محروق']) : Tc >= WS.tSc ? T(['insulation damaged', 'العزل بيتلف']) : Tc > WS.tMax ? T(['overloaded, heating', 'حمل زيادة وبيسخن']) : I > iz ? T(['above Iz', 'فوق Iz']) : T(['OK', 'سليم']);
    return `<div class="wbar"><i class="${cls}" style="width:${pc.toFixed(0)}%"></i></div>` +
      `<div class="kv"><span>${T(['Current', 'التيار'])}</span><b class="ltr">${I < 0.005 ? '0' : I.toFixed(2)} A / Iz ${iz} A (${Math.round((100 * I) / iz)} %)</b></div>` +
      `<div class="kv"><span>${T(['Temperature', 'الحرارة'])}</span><b class="ltr">${Math.round(Tc)} °C</b></div><div class="kv"><span>${T(['State', 'الحالة'])}</span><b>${st}</b></div>` + (s || I ? '' : `<p class="mute">${T(['Switch to Test to see the current.', 'اختار اختبار عشان تشوف التيار.'])}</p>`);
  }
  /* motor rating plate (IEC 60034-1 style) */
  function plateCard(p) {
    const np = EL.motorPlate(p), f = (x) => String(x), a = (x) => (+x).toFixed(x < 10 ? 2 : 1), Y = p.props.conn === 'star', six = p.props.conn === '6wire';
    const row = (cells) => h('div', { class: 'np-r' }, cells.map(([k, v]) => h('span', {}, h('em', { text: k + ' ' }), v)));
    let rows;
    if (np.ph === 3) rows = [row([['P:', f(np.kw) + ' kW'], ['U:', np.uD + 'V Δ / ' + np.uY + 'V Y'], ['', np.hz + ' Hz']]), row([['In:', a(np.iD) + ' A (Δ) / ' + a(np.iY) + ' A (Y)'], ['cosφ:', np.cos.toFixed(2)]]), row([['n:', np.rpm + ' rpm'], ['', np.poles + 'P'], ['η:', np.eta + ' %']]), row([['Isol.Cl:', np.ins], ['', np.duty + ' Cont.'], ['', np.ip]])];
    else rows = [row([['P:', f(np.kw) + ' kW'], ['U:', '230 V 1~'], ['', np.hz + ' Hz']]), row([['In:', a(np.inom) + ' A'], ['cosφ:', np.cos.toFixed(2)]]), row([['n:', np.rpm + ' rpm'], ['', np.poles + 'P'], ['η:', np.eta + ' %']]), row([['Isol.Cl:', np.ins], ['', np.duty + ' Cont.'], ['', np.ip]])];
    const conn = np.ph === 3 ? (np.volt === '230D' ? (Y ? ['Connected in Y on 400 V: correct, line current ' + a(np.iY) + ' A.', 'متوصل ستار على 400: صح، تيار الخط ' + a(np.iY) + ' أمبير.'] : six ? ['Star-delta: run in Δ needs a 400 V Δ winding. This 230/400 V winding must stay in Y on 400 V.', 'ستار-دلتا محتاج ملفات 400 دلتا. الملفات 230/400 دي لازم تفضل ستار على 400.'] : ['Linked in Δ on 400 V: wrong for a 230 V Δ winding, it will overheat. Use Y.', 'متوصل دلتا على 400: غلط لملفات 230 دلتا، هيسخن. خليه ستار.']) : (Y ? ['Linked in Y on 400 V: windings get only 230 V (1/3 torque). Δ is the running connection.', 'متوصل ستار على 400: الملفات واخدة 230 بس (ثلث العزم). الدلتا هو توصيل التشغيل.'] : ['Δ on 400 V: rated connection, line current ' + a(np.iD) + ' A.', 'دلتا على 400: التوصيل المقنن، تيار الخط ' + a(np.iD) + ' أمبير.'])) : ['Set the overload relay to In.', 'اضبط الأوفرلود على In.'];
    return h('div', { class: 'card' }, h('h3', { text: T(['Nameplate', 'لوحة بيانات الموتور']) }),
      h('div', { class: 'nplate', role: 'img', 'aria-label': T(['Motor nameplate', 'لوحة بيانات الموتور']) },
        h('div', { class: 'np-h' }, h('b', { text: (np.ph === 3 ? '3~' : '1~') + ' MOTOR ' + np.ie }), h('span', { text: 'IEC ' + np.frame + ' · ' + np.ip })), rows,
        h('div', { class: 'np-f' }, h('span', { text: 'IEC 60034-1' }), h('span', { text: np.ie ? 'IEC 60034-30-1 ' + np.ie : 'capacitor run' }))),
      h('p', { class: 'mute np-note', text: T(conn) }),
      h('p', { class: 'mute', text: T(['Set the overload relay or motor breaker to In (allowed 0.9 to 1.15 x). Efficiency is the IE3 minimum, cosφ and speed are typical catalogue values.', 'اضبط الأوفرلود أو بريكر الموتور على In (المسموح من 0.9 لـ 1.15 ضعف). الكفاءة هي أقل قيمة لـ IE3، و cosφ والسرعة قيم كتالوج معتادة.']) }));
  }
  const STATEMAP = [['w', ['Speed (rpm)', 'السرعة (لفة/د)'], (v) => Math.round(Math.abs(v) * 60 / (2 * Math.PI))], ['amps', ['Current (A)', 'التيار (أمبير)'], (v) => (+v).toFixed(2)], ['iout', ['Output current (A)', 'تيار الخرج (أمبير)'], (v) => (+v).toFixed(2)], ['f', ['Frequency (Hz)', 'التردد (هرتز)'], (v) => (+v).toFixed(1)], ['bus', ['DC bus (V)', 'الـDC bus (فولت)'], (v) => Math.round(v)], ['heat', ['Thermal load (%)', 'الحمل الحراري (%)'], (v) => Math.round(v * 100)], ['closed', ['Contacts closed', 'الكونتاكت مقفول'], (v) => (v ? 'YES' : 'no')], ['on', ['On', 'شغال'], (v) => (v ? 'YES' : 'no')], ['tripped', ['Tripped', 'فاصل'], (v) => (v ? 'YES' : 'no')], ['act', ['Operated', 'متفعّل'], (v) => (v ? 'YES' : 'no')]];
  let liveSig = '';
  let wliveSig = '';
  B.updateLive = function (force) {
    const ed = B.active(), p = ed && ed.part(), live = $(ed && ed.kind === 'pcb' ? '#plive' : '#live');
    if (!p && ed && ed.kind !== 'pcb' && ed.selWire && EL.WIRE) {
      const w = ed.c.wires.find((x) => x.id === ed.selWire), el = $('#wlive');
      if (w && el) { const s2 = wireLive(ed, w); if (s2 !== wliveSig || force) { el.innerHTML = s2; wliveSig = s2; } }
      return;
    }
    if (!p || !live) return;
    const sim = ed.c.sim; let s = '';
    const rows = [];
    for (const [k, lab, f] of STATEMAP) if (p.state && p.state[k] != null && typeof p.state[k] !== 'object' && !(k === 'f' && p.type === 'MOT3')) rows.push([T(lab), String(f(p.state[k]))]);
    s += rows.map((r) => `<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
    if (sim) {
      s += `<table class="t" style="margin-top:8px"><tr><th>${T(['Pin', 'الطرف'])}</th><th>${T(['V (vs PE)', 'جهد (مقابل الأرضي)'])}</th><th>${T(['I (A)', 'تيار'])}</th></tr>`;
      for (const q of EL.pinsOf(p)) {
        const ref = p.id + '.' + q.id; let vac = 0, vdc = 0, ia = 0;
        try { vac = EL.cabs(sim.vacAt(ref)); vdc = sim.vdcAt(ref); const i = sim.iPin(ref); ia = Math.max(EL.cabs(i.ac), Math.abs(i.dc)); } catch (e) {}
        const vs = (vac > 0.5 ? fmtV(vac) + ' V~ ' : '') + (Math.abs(vdc) > 0.2 ? fmtV(vdc) + ' V⎓' : '');
        s += `<tr><td>${q.label == null ? q.id : q.label}</td><td class="n">${vs || '0'}</td><td class="n">${ia < 0.005 ? '-' : ia.toFixed(2)}</td></tr>`;
      }
      s += '</table>';
    }
    if (s !== liveSig || force) { live.innerHTML = '<h3>' + T(['Live values', 'القيم الحية']) + '</h3>' + s; liveSig = s; }
  };

  /* ---------- toolbar + side panes ---------- */
  B.setMode = function (m) {
    B.ed.setMode(m);
    for (const b of ui.$$('#modeSeg .btn')) b.classList.toggle('on', b.dataset.m === m);
    $('#v-bench').dataset.mode = m;
  };
  function openSheet(id, on) {
    for (const x of ['palette', 'side']) { const el = $('#' + x); if (el) el.classList.toggle('open', x === id && on !== false && !el.classList.contains('open') ? true : (x === id && on === false ? false : false)); }
  }
  B.sheet = function (which) {
    const pal = $('#palette'), side = $('#side');
    const wasPal = pal.classList.contains('open'), wasSide = side.classList.contains('open');
    pal.classList.remove('open'); side.classList.remove('open');
    if (which === 'palette' && !wasPal) pal.classList.add('open');
    if (which === 'side' && !wasSide) side.classList.add('open');
    for (const b of ui.$$('#dock button')) b.classList.toggle('on', (b.dataset.s === 'palette' && pal.classList.contains('open')) || (b.dataset.s === 'side' && side.classList.contains('open')));
  };
  B.pane = function (name) {
    for (const b of ui.$$('#stabs .stab')) b.classList.toggle('on', b.dataset.p === name);
    for (const s of ui.$$('#side .spane')) s.classList.toggle('on', s.id === 'pane-' + name);
    if (name === 'meters' && ui.inst) ui.inst.render();
  };
  B.openPane = (name) => { B.pane(name); if (window.innerWidth > 900 && ui.panels) ui.panels.show('r'); if (window.innerWidth <= 900) { $('#side').classList.add('open'); $('#palette').classList.remove('open'); } };

  B.templatesDialog = function () {
    const list = h('div', { class: 'msgs' });
    for (const id of EL.templateList) {
      const t = EL.templates[id];
      list.appendChild(h('div', { class: 'card', style: { cursor: 'pointer' }, onclick: () => { m.remove(); B.loadTemplate(id); } }, h('b', { text: T(t.name) }), h('p', { class: 'mute', text: T(t.desc) })));
    }
    const m = ui.modal([h('h3', { text: T(['Ready-made circuits', 'دوائر جاهزة']) }), h('p', { class: 'mute', text: T(['Pick one to load it on the bench. You can then change it, break it, and measure it.', 'اختار واحدة تتحمّل على المعمل. وتقدر تعدل فيها وتبوّظها وتقيسها.']) }), list]);
  };
  B.loadTemplate = function (id) {
    const c = EL.loadTemplate(id);
    EL.inst.probes = { red: null, black: null, clamp: null, ncv: null };
    B.ed.setCircuit(c); B.setMode('build');
    ui.toast(T(EL.templates[id].name) + ': ' + T(EL.templates[id].desc), 'ok', 7000);
    B.save();
  };
  B.clearAll = function () {
    if (B.ed.c.parts.length && !confirm(T(['Clear the whole bench?', 'تمسح المعمل كله؟']))) return;
    EL.inst.probes = { red: null, black: null, clamp: null, ncv: null };
    B.ed.setCircuit(EL.newCircuit()); B.save();
  };
  B.fileDialog = function () {
    const ta = h('textarea', { rows: 6, placeholder: 'JSON' });
    const m = ui.modal([h('h3', { text: T(['Save and load', 'حفظ وفتح']) }),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn pri', onclick: () => { ui.download((B.ed.c.name ? 'lab-' + String(T(B.ed.c.name)).replace(/\W+/g, '-') : 'my-circuit') + '.json', EL.serialize(B.ed.c)); }, text: T(['Download circuit file', 'نزّل ملف الدائرة']) }),
        h('label', { class: 'btn' }, T(['Open file', 'افتح ملف']), h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' }, onchange: (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { B.ed.setCircuit(EL.deserialize(r.result)); m.remove(); ui.toast(['Circuit loaded.', 'اتفتحت الدائرة.'], 'ok'); } catch (er) { ui.toast(['Bad file.', 'الملف غلط.'], 'bad'); } }; r.readAsText(f); } }))),
      h('label', { class: 'f', text: T(['Or paste circuit text:', 'أو الصق نص الدائرة:']) }), ta,
      h('button', { class: 'btn', style: { marginTop: '6px' }, onclick: () => { try { B.ed.setCircuit(EL.deserialize(ta.value)); m.remove(); } catch (er) { ui.toast(['Bad text.', 'النص غلط.'], 'bad'); } }, text: T(['Load pasted text', 'حمّل النص']) }),
      h('button', { class: 'btn', style: { marginTop: '6px', marginInlineStart: '6px' }, onclick: () => { ta.value = EL.serialize(B.ed.c); ta.select(); }, text: T(['Show text of this circuit', 'اعرض نص الدائرة دي']) })]);
  };
  B.save = function () { try { localStorage.setItem('ellab.bench', EL.serialize(B.ed.c)); } catch (e) {} };

  /* ---------- simulation loop ---------- */
  let last = 0, acc = 0, liveT = 0, saveT = 0;
  B.active = () => (ui.activeEd ? ui.activeEd() : B.ed);
  function step(ed, dt) {
    const c = ed.c;
    dt = dt || EL.TICK;
    EL.instClean(c);
    EL.ctx.mains = ed.mains;
    EL.ctx.extra = EL.instElements(c);
    const sim = EL.tick(c, dt, EL.ctx);
    EL.instUpdate(c, sim, dt);
    return sim;
  }
  B.step = step;
  function handleEvents(ed) {
    const ev = EL.events.splice(0, EL.events.length);
    for (const e of ev) {
      if (e.type === 'click') ui.click();
      else if (e.type === 'trip') { ui.buzz(200); ui.toast(T(['Tripped: ', 'فصل: ']) + (e.tag || '') + ' (' + (e.msg || '') + ')', 'warn'); }
      else if (e.type === 'burn') { ui.buzz(500); ui.toast(T(['Burnt: ', 'اتحرق: ']) + (e.tag || '') + (e.msg ? ' (' + e.msg + ')' : ''), 'bad', 7000); }
      else if (e.type === 'fault') ui.toast(T(['Drive fault on ', 'عطل على الانفرتر ']) + (e.tag || '') + ' (' + (e.msg || '') + ')', 'bad');
      else if (e.type === 'fuse') ui.toast(e.msg, 'bad', 7000);
      else if (e.type === 'alarm') ui.toast(T(['Alarm: ', 'إنذار: ']) + (e.tag || '') + ' (' + (e.msg && e.msg.k ? T(e.msg.k) + ': ' + T(e.msg.n) : e.msg || '') + ')', 'warn');
    }
  }
  B.frame = function (now) {
    const ed = B.active();
    if (!ed) return;
    const dt = Math.min(0.25, (now - last) / 1000 || 0); last = now;
    let sim = ed.c.sim;
    if (!B.paused) {
      acc += dt * B.speed;
      const t0 = performance.now(); let n = 0;
      const DT = B.speed >= 300 && !ed.c.parts.length ? 1 : EL.TICK; // 300x: process-only projects step 1 s at a time
      while (acc >= DT && n < 40) { sim = step(ed, DT); acc -= DT; n++; if (performance.now() - t0 > 14) { acc = 0; break; } }
      if (n === 0 && !sim) sim = step(ed);
    }
    handleEvents(ed);
    if (sim) {
      ed.frame(sim);
      if (ui.inst) ui.inst.frame(sim, now);
      liveT += dt;
      if (liveT > 0.25) { liveT = 0; B.updateLive(); if (ed === B.ed && ui.assist && ui.assist.tick) ui.assist.tick(sim); if (EL.pcb && ed === EL.pcb.ed && EL.pcb.tick) EL.pcb.tick(sim); }
      const tm = $('#simclock'); if (tm) tm.textContent = fmtT(ed.c.time || 0);
    }
    saveT += dt; if (saveT > 6) { saveT = 0; if (ed === B.ed) B.save(); }
  };
  function fmtT(s) { const m = Math.floor(s / 60); return (m ? m + 'm ' : '') + (s % 60).toFixed(0) + 's'; }

  /* Display options: real look or symbols, phase colours, auto-wire of phases, panel parts */
  B.lookMenu = function () {
    const ed = B.ed, get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
    const opt = (title, key, cur, list, apply) => h('div', { class: 'lk-row' }, h('b', { text: T(title) }), h('div', { class: 'seg' }, list.map(([v, n]) => h('button', { type: 'button', class: 'btn' + (cur === v ? ' on' : ''), text: T(n), onclick: (e) => { set(key, v); for (const b of e.currentTarget.parentNode.children) b.classList.toggle('on', b === e.currentTarget); apply(v); } }))));
    const m = ui.modal(h('div', { class: 'lk' }, h('h3', { text: T(['View options', 'العرض']) }),
      opt(['Look of the devices', 'شكل الأجهزة'], 'ellab.real', ed.real ? '1' : '0', [['1', ['Real look', 'شكل حقيقي']], ['0', ['Symbols', 'رموز']]], (v) => { ed.real = v === '1'; ed.render(); B.rebuildPalette && B.rebuildPalette(); }),
      opt(['Phase wire colours', 'ألوان أسلاك الفازات'], 'ellab.phcol', get('ellab.phcol', 'iec'), [['iec', ['Brown Black Grey (IEC)', 'بني أسود رمادي (IEC)']], ['ryb', ['Red Yellow Blue', 'أحمر أصفر أزرق']]], () => { ed.render(); B.rebuildPalette && B.rebuildPalette(); }),
      opt(['After wiring one phase', 'بعد ما تربط فاز واحد'], 'ellab.autoPhase', get('ellab.autoPhase', 'on'), [['on', ['Offer the other phases', 'اقترح باقي الفازات']], ['off', ['Do not ask', 'متسألش']]], () => {}),
      h('p', { class: 'mute', text: T(['Wires: drag from one terminal to another, or tap a terminal then tap the second one. Both work.', 'الأسلاك: اسحب من طرف لطرف، أو اضغط على طرف وبعدين على التاني. الاتنين شغالين.']) }),
      h('p', { class: 'mute', text: T(['Panel building: add a Mounting plate, DIN rails and Wire ducts from the parts list (Drawing group). Devices dropped near a rail clip onto it.', 'تجميع اللوحة: ضيف ضهر لوحة وريلات DIN ومجاري أسلاك من قايمة الأجهزة (مجموعة الرسم). أي جهاز تحطه جنب الريل بيتركّب عليه.']) }),
      h('button', { type: 'button', class: 'btn pri', text: T(['Build a sample panel on rails', 'اعمل لوحة مثال على الريلات']), onclick: () => { m.remove(); B.sampleRails(); } })));
  };
  B.sampleRails = function () {
    const ed = B.ed; if (ed.c.parts.length && !confirm(T(['Replace the drawing with a sample panel on DIN rails?', 'أبدّل الرسمة بلوحة مثال على ريلات DIN؟']))) return;
    ed.push(); ed.c.parts = []; ed.c.wires = [];
    const add = (t, x, y, pr) => EL.addPart(ed.c, t, x, y, pr);
    add('PLATE', 0, 0); add('DUCTH', 40, 40); add('RAIL60', 40, 150); add('DUCTH', 40, 300); add('RAIL60', 40, 380); add('DUCTH', 40, 530 - 60);
    const g = add('SRC3', 60, -120);
    const q = add('MCB3', 60, 112), k = add('CONT3', 200, 57), f = add('OL', 470, 92);
    const sb1 = add('PB_NC', 60, 347), sb2 = add('PB_NO', 140, 347), hl = add('LAMP', 220, 352), t = add('TERM8', 320, 357), m = add('MOT3', 300, 620);
    for (const p of [q, k, f, sb1, sb2, hl, t]) ed.snapRail(p);
    g.tag = 'G1'; q.tag = 'QF1'; k.tag = 'KM1'; f.tag = 'FR1'; sb1.tag = 'SB1'; sb2.tag = 'SB2'; hl.tag = 'HL1'; t.tag = 'X1'; m.tag = 'M1';
    ed.select(null); ed.render(); ed.changed(); ed.fit();
    ui.toast(['Sample panel: wire G1 to QF1 (try the auto phase offer), then QF1 to KM1, KM1 to FR1, FR1 to the motor.', 'لوحة مثال: اربط G1 بالـQF1 (جرّب اقتراح باقي الفازات)، وبعدين QF1 بالـKM1، والـKM1 بالـFR1، والـFR1 بالموتور.'], 'info', 9000);
  };
  B.init = function () {
    const host = $('#benchHost');
    const ed = (B.ed = EL.makeEditor(host, {
      kind: 'bench',
      onSelect: () => inspector(B.ed),
      onChange: () => { if (B.ed) { B.ed.c.sim = null; } },
      onProbe: () => ui.inst && ui.inst.onProbe(),
    }));
    // palette
    const pl = $('#plist'), search = $('#psearch');
    try { ed.real = localStorage.getItem('ellab.real') !== '0'; } catch (e) { ed.real = true; }
    const rebuild = () => {
      if (B.view === 'plant' && ui.plant) return ui.plant.palette(pl, search.value);
      if (B.view === 'line' && ui.line) return ui.line.palette(pl, search.value);
      buildPalette(pl, ed, search.value, (tapped) => { if (tapped && window.innerWidth <= 900) B.sheet(null); });
    };
    B.rebuildPalette = rebuild;
    search.addEventListener('input', rebuild); ui.onRefresh(rebuild); rebuild();
    // toolbar
    for (const b of ui.$$('#modeSeg .btn')) b.addEventListener('click', () => B.setMode(b.dataset.m));
    $('#btnPower').addEventListener('click', () => { ed.mains = !ed.mains; syncPower(); ui.click(); });
    function syncPower() { const b = $('#btnPower'); b.classList.toggle('on', ed.mains); b.classList.toggle('off', !ed.mains); b.querySelector('span').textContent = ed.mains ? T(['Supply ON', 'الكهرباء شغالة']) : T(['Supply OFF', 'الكهرباء مفصولة']); }
    ui.onRefresh(syncPower); syncPower();
    $('#btnPause').addEventListener('click', (e) => { B.paused = !B.paused; e.currentTarget.classList.toggle('on', B.paused); });
    $('#btnSpeed').addEventListener('click', (e) => { const s = B.ed.c.parts.length ? [1, 5, 20, 60] : [1, 5, 20, 60, 300]; B.speed = s[(s.indexOf(B.speed) + 1) % s.length]; e.currentTarget.textContent = B.speed + 'x'; ui.toast(T(['Simulation speed ', 'سرعة المحاكاة ']) + B.speed + 'x', '', 1500); });
    $('#btnUndo').addEventListener('click', () => ed.undo()); $('#btnRedo').addEventListener('click', () => ed.redo());
    const vz = (f) => (B.view === 'plant' && ui.plant ? ui.plant.zoom(f) : B.view === 'line' && ui.line ? ui.line.zoom(f) : ed.zoomAt(f));
    $('#btnZin').addEventListener('click', () => vz(1.25)); $('#btnZout').addEventListener('click', () => vz(0.8)); $('#btnFit').addEventListener('click', () => (B.view === 'all' && ui.plant ? (ui.plant.fit(), ed.fit()) : B.view === 'plant' && ui.plant ? ui.plant.fit() : B.view === 'line' && ui.line ? ui.line.fit() : ed.fit()));
    $('#btnTpl').addEventListener('click', () => B.templatesDialog());
    $('#btnFile').addEventListener('click', () => B.fileDialog());
    $('#btnClear').addEventListener('click', () => B.clearAll());
    $('#btnLook').addEventListener('click', () => B.lookMenu());
    $('#btnMute').addEventListener('click', (e) => { ui.muted = !ui.muted; e.currentTarget.classList.toggle('on', ui.muted); if (ui.muted) ui.beep(false); });
    // side tabs
    for (const b of ui.$$('#stabs .stab')) b.addEventListener('click', () => B.pane(b.dataset.p));
    for (const b of ui.$$('#dock button')) b.addEventListener('click', () => {
      const s = b.dataset.s, pane = b.dataset.p;
      if (s === 'palette') B.sheet('palette'); else { if (pane) B.pane(pane); if (!$('#side').classList.contains('open') || b.classList.contains('on') === false) { B.sheet('side'); } else B.sheet('side'); }
    });
    B.setMode('build');
    ui.onRefresh(() => inspector(B.ed));
    document.addEventListener('keydown', (e) => {
      if (!$('#v-bench').classList.contains('on') || document.querySelector('.modal')) return;
      if (B.view === 'plant' && ui.plant) ui.plant.keydown(e); else if (B.view === 'line' && ui.line) ui.line.keydown(e); else B.ed.keydown(e);
    });
    // restore
    let restored = false;
    try { const s = localStorage.getItem('ellab.bench'); if (s) { const c = EL.deserialize(s); if (c.parts.length || (c.line && c.line.els.length) || (c.plant && c.plant.units && c.plant.units.length)) { ed.setCircuit(c); restored = true; } } } catch (e) {}
    if (!restored) B.loadTemplate('dol');
    inspector(ed);
  };
})(typeof window !== 'undefined' ? window : globalThis);
