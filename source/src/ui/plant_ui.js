/* Plant view: process canvas (tanks, pumps, pipes) linked to the bench circuit. */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T, $ = ui.$;
  const PL = EL.plant, PA = EL.plantArt;
  const NS = 'http://www.w3.org/2000/svg';
  const PU = (ui.plant = { sel: null, selPipe: null, view: { x: 40, y: 40, k: 0.8 }, pending: null });
  const B = () => EL.bench;
  const C = () => B().ed.c;
  const plant = (make) => { const c = C(); if (!c.plant && make) c.plant = PL.newPlant(); return c.plant; };
  const esc = PA.esc;

  let host, svg, world, layPipes, layUnits, layPorts, layOver, tools, lastRender = 0;

  PU.init = function () {
    host = $('#plantHost');
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'cv plcv');
    svg.innerHTML = PA.defs + '<rect x="-20000" y="-20000" width="40000" height="40000" fill="url(#plGrid)" class="pl-bg"/>';
    world = document.createElementNS(NS, 'g');
    layPipes = document.createElementNS(NS, 'g'); layUnits = document.createElementNS(NS, 'g'); layPorts = document.createElementNS(NS, 'g'); layOver = document.createElementNS(NS, 'g');
    world.append(layPipes, layUnits, layPorts, layOver);
    svg.appendChild(world);
    host.appendChild(svg);
    chrome();
    if (ui.cycles) ui.cycles.init(host);
    ui.onRefresh(() => { if (tools) tools.remove(); const old = $('#plEmpty'); if (old) old.remove(); chrome(); PU.render(true); });
    bindPointer();
  };

  function chrome() {
    tools = h('div', { class: 'pl-tools' },
      h('button', { class: 'btn sm pri', onclick: () => PU.addMenu(), text: '+ ' + T(['Add', 'إضافة']) }),
      h('button', { class: 'btn sm', onclick: () => PU.zoom(1.2), text: '+', 'aria-label': 'zoom in' }), h('button', { class: 'btn sm', onclick: () => PU.zoom(1 / 1.2), text: '−', 'aria-label': 'zoom out' }),
      h('button', { class: 'btn sm', onclick: () => PU.fit(), text: T(['Fit', 'ملّي']) }),
      h('button', { class: 'btn sm bad pl-del', onclick: () => PU.delSel(), text: T(['Delete', 'حذف']) }),
      h('button', { class: 'btn sm', onclick: () => PU.waterGuide(), text: T(['Water guide', 'دليل المية']) }),
      ui.cycles ? ui.cycles.toolButton() : null);
    host.appendChild(tools);
    host.appendChild(h('div', { class: 'pl-empty', id: 'plEmpty' },
      h('b', { text: T(['No process yet', 'مفيش عملية لسه']) }),
      h('p', { class: 'mute', text: T(['Add a tank, a pump and valves, then join their ports with pipes. Link the pump to a motor on the panel and the sensors to floats and transmitters.', 'ضيف تانك وطلمبة ومحابس، وبعدين وصّل أطرافهم بمواسير. اربط الطلمبة بموتور في اللوحة والحساسات بفلوتات وترانسميترات.']) }),
      h('div', { class: 'row wrap', style: { justifyContent: 'center' } },
        h('button', { class: 'btn pri', onclick: () => PU.addMenu(), text: '+ ' + T(['Add a unit', 'ضيف وحدة']) }),
        h('button', { class: 'btn', onclick: () => ui.show('projects'), text: T(['Open a ready project', 'افتح مشروع جاهز']) }))));
  }

  /* ---------- view ---------- */
  function applyView() { world.setAttribute('transform', `translate(${PU.view.x},${PU.view.y}) scale(${PU.view.k})`); }
  PU.zoom = function (f, cx, cy) {
    const r = host.getBoundingClientRect(), v = PU.view;
    cx = cx == null ? r.width / 2 : cx - r.left; cy = cy == null ? r.height / 2 : cy - r.top;
    const k = Math.max(0.08, Math.min(3, v.k * f));
    v.x = cx - ((cx - v.x) * k) / v.k; v.y = cy - ((cy - v.y) * k) / v.k; v.k = k; applyView();
  };
  PU.fit = function () {
    const pl = plant(); if (!host) return;
    const r = host.getBoundingClientRect();
    if (!pl || !pl.units.length || !r.width) { PU.view = { x: 40, y: 40, k: 0.8 }; applyView(); return; }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const u of pl.units) { const d = PL.defs[u.type]; x0 = Math.min(x0, u.x - 20); y0 = Math.min(y0, u.y - 40); x1 = Math.max(x1, u.x + d.w + 110); y1 = Math.max(y1, u.y + d.h + 50); }
    const phone = (g.innerWidth || 1000) <= 700 || (g.innerHeight || 800) <= 500; // the device, not the canvas: a laptop with both columns shown is not a phone
    const cy = $('#plCyc'), side = !phone && cy && cy.style.display !== 'none' && !cy.classList.contains('min') ? cy.offsetWidth + 16 : 0; // leave room for the cycles panel
    const rtl = getComputedStyle(host).direction === 'rtl', W0 = r.width - side;
    let k = Math.max(0.1, Math.min(1.4, Math.min(W0 / (x1 - x0), (r.height - 40) / (y1 - y0)) * 0.95));
    if (phone) {
      // phones: fill the height above the cycles sheet so the drawing stays readable, then pan sideways
      let bottom = r.height;
      if (cy && cy.style.display !== 'none') bottom = Math.min(bottom, cy.getBoundingClientRect().top - r.top);
      const avail = Math.max(120, bottom - 56), kh = Math.min(0.45, (avail - 10) / (y1 - y0));
      if (kh > k) { PU.view = { k: kh, x: (rtl ? r.width - 10 - x1 * kh : 10 - x0 * kh), y: 52 + (avail - (y1 - y0) * kh) / 2 - y0 * kh }; applyView(); return; }
    }
    PU.view = { k, x: (rtl ? 0 : side) + (W0 - (x1 - x0) * k) / 2 - x0 * k, y: 40 + (r.height - 40 - (y1 - y0) * k) / 2 - y0 * k };
    applyView();
  };
  PU.focus = function (u, force) {
    if (!u || !host) return;
    const r = host.getBoundingClientRect(), d = PL.defs[u.type], v = PU.view;
    const sx = v.x + (u.x + d.w / 2) * v.k, sy = v.y + (u.y + d.h / 2) * v.k;
    if (force || sx < 30 || sx > r.width - 30 || sy < 50 || sy > r.height - 30 || v.k < 0.5) { if (v.k < 0.5 && r.width < 700) v.k = 0.55; v.x = r.width / 2 - (u.x + d.w / 2) * v.k; v.y = Math.min(r.height * 0.4, r.height / 2) - (u.y + d.h / 2) * v.k; applyView(); }
  };
  const toWorld = (cx, cy) => { const r = svg.getBoundingClientRect(), v = PU.view; return { x: (cx - r.left - v.x) / v.k, y: (cy - r.top - v.y) / v.k }; };
  PU.toWorld = toWorld;

  /* ---------- render ---------- */
  PU.render = function (force) {
    if (!svg) return;
    const pl = plant(), now = performance.now();
    if (!force && now - lastRender < 90) return;
    lastRender = now;
    const empty = !pl || !pl.units.length;
    const em = $('#plEmpty'); if (em) em.style.display = empty ? '' : 'none';
    tools.querySelector('.pl-del').style.display = PU.sel || PU.selPipe ? '' : 'none';
    if (!pl) { layPipes.innerHTML = ''; layUnits.innerHTML = ''; layPorts.innerHTML = ''; layOver.innerHTML = ''; return; }
    if (PU.sel && !pl.units.some((u) => u.id === PU.sel)) PU.sel = null;
    if (PU.selPipe && !pl.pipes.some((p) => p.id === PU.selPipe)) PU.selPipe = null;
    let ps = '';
    for (const p of pl.pipes) {
      const [ia, pa] = p.a.split('.'), [ib, pb] = p.b.split('.');
      const ua = pl.units.find((u) => u.id === ia), ub = pl.units.find((u) => u.id === ib);
      if (!ua || !ub) continue;
      const A = PL.portPos(ua, pa), Bp = PL.portPos(ub, pb);
      if (!A || !Bp) continue;
      const q = PL.pipeQ(pl, p.id), d = q < 0 ? PA.route(Bp, A) : PA.route(A, Bp), flow = Math.abs(q) > 0.3;
      const T0 = PL.tempAt(pl, p.a), hot = T0 > 38;
      ps += `<g data-pipe="${p.id}">` + `<path d="${d}" class="pl-hit"/>` +
        `<path d="${d}" fill="none" stroke="#3d4656" stroke-width="18" stroke-linejoin="round"/>` +
        `<path d="${d}" fill="none" stroke="${PU.selPipe === p.id ? '#47BFD9' : '#a3adbb'}" stroke-width="15" stroke-linejoin="round"/>` +
        `<path d="${d}" fill="none" stroke="#e3e8ee" stroke-width="3" stroke-linejoin="round" opacity=".45" transform="translate(0,-4)"/>` +
        `<path d="${d}" fill="none" stroke="${flow ? (hot ? '#ff7a55' : '#3aa2e6') : '#2a3446'}" stroke-width="8" stroke-linejoin="round"/>` +
        (flow ? `<path d="${d}" class="pl-flow" style="animation-duration:${Math.max(0.25, 6 / Math.min(60, Math.abs(q))).toFixed(2)}s"/>` : '') +
        flange(A) + flange(Bp) + (+p.dn > 0 ? pipeLab(A, Bp, p, q) : '') + '</g>';
    }
    layPipes.innerHTML = ps;
    let us = '';
    const mode = B().ed.mode;
    for (const u of pl.units) us += `<g data-u="${u.id}" transform="translate(${u.x},${u.y})" class="pl-unit${PU.sel === u.id ? ' sel' : ''}">${PU.sel === u.id ? selBox(u) : ''}${PA.draw(u)}</g>`;
    layUnits.innerHTML = us;
    let po = '';
    if (mode === 'build' || PU.pending) {
      const used = new Set(); for (const p of pl.pipes) { used.add(p.a); used.add(p.b); }
      for (const u of pl.units) for (const q of PL.portsOf(u)) {
        const ref = u.id + '.' + q.id, x = u.x + q.x, y = u.y + q.y, pend = PU.pending === ref;
        po += `<g data-port="${ref}"><circle cx="${x}" cy="${y}" r="15" fill="transparent"/><circle cx="${x}" cy="${y}" r="${pend ? 8 : 5.5}" class="pl-port${used.has(ref) ? ' used' : ''}${pend ? ' pend' : ''}"/></g>`;
      }
    }
    layPorts.innerHTML = po;
    if (force && ui.cycles) ui.cycles.update(true);
  };
  function pipeLab(A, Bp, p, q) {
    const pi = EL.water.pipeInfo(p, q / 60, PL.tempAt(plant(), p.a)), x = (A.x + Bp.x) / 2, y = (A.y + Bp.y) / 2 - 12;
    const bad = p.loop && Math.abs(q) > 0.01 && pi.v < 0.9;
    return `<text class="${bad ? 'pl-bad' : 'pl-s'}" x="${x}" y="${y}" text-anchor="middle">DN${p.dn}${Math.abs(q) > 0.01 ? ' ' + pi.v.toFixed(2) + ' m/s' : ''}</text>`;
  }
  function flange(P) {
    // flange pair with bolts where the pipe meets the unit nozzle
    const v = P.dir === 'u' || P.dir === 'd';
    const o = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] }[P.dir];
    let s = '';
    for (const k of [3.5, 9]) {
      const x = P.x + o[0] * k, y = P.y + o[1] * k;
      s += v ? `<rect x="${x - 14}" y="${y - 2.6}" width="28" height="5.2" rx="1" fill="#b9c2ce" stroke="#3d4656"/>` : `<rect x="${x - 2.6}" y="${y - 14}" width="5.2" height="28" rx="1" fill="#b9c2ce" stroke="#3d4656"/>`;
    }
    const x = P.x + o[0] * 6.25, y = P.y + o[1] * 6.25;
    for (const d of [-11, 11]) s += `<circle cx="${v ? x + d : x}" cy="${v ? y : y + d}" r="1.7" fill="#3d4656"/>`;
    return s;
  }
  function selBox(u) { const d = PL.defs[u.type]; return `<rect x="-8" y="-24" width="${d.w + 16}" height="${d.h + 40}" rx="8" fill="rgba(71,191,217,.08)" stroke="#47BFD9" stroke-dasharray="6 4"/>`; }
  PU.frame = function () { if (B().view === 'plant' || B().view === 'all') PU.render(); };

  /* ---------- pointer ---------- */
  function bindPointer() {
    const ptrs = new Map();
    let g0 = null, pinch = null;
    svg.addEventListener('pointerdown', (e) => {
      svg.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: PU.view.k }; g0 = null; return; }
      const t = e.target.closest ? e.target : null;
      const port = t && t.closest('[data-port]'), unit = t && t.closest('[data-u]'), pipe = t && t.closest('[data-pipe]'), act = t && t.closest('[data-act]');
      g0 = { x: e.clientX, y: e.clientY, moved: false, vx: PU.view.x, vy: PU.view.y };
      if (port) { g0.port = port.dataset.port; return; }
      if (unit) { const u = plant().units.find((x) => x.id === unit.dataset.u); g0.unit = u; g0.ux = u.x; g0.uy = u.y; g0.act = act && act.dataset.act; return; }
      if (pipe) { g0.pipe = pipe.dataset.pipe; return; }
      g0.bg = true;
    });
    svg.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); PU.zoom((pinch.k * d) / pinch.d / PU.view.k, (a.x + b.x) / 2, (a.y + b.y) / 2); return; }
      if (!g0) return;
      const dx = e.clientX - g0.x, dy = e.clientY - g0.y;
      if (!g0.moved && Math.hypot(dx, dy) > (e.pointerType === 'touch' ? 12 : 7)) { g0.moved = true; if (g0.unit && B().ed.mode === 'build') B().ed.push(); }
      if (!g0.moved) return;
      if (g0.port) { const w = toWorld(e.clientX, e.clientY), a = portXY(g0.port); layOver.innerHTML = `<line x1="${a.x}" y1="${a.y}" x2="${w.x}" y2="${w.y}" class="pl-rubber"/>`; return; }
      if (g0.unit && B().ed.mode === 'build') { g0.unit.x = Math.round((g0.ux + dx / PU.view.k) / 10) * 10; g0.unit.y = Math.round((g0.uy + dy / PU.view.k) / 10) * 10; PU.render(true); return; }
      if (g0.bg || g0.pipe || (g0.unit && B().ed.mode !== 'build')) { PU.view.x = g0.vx + dx; PU.view.y = g0.vy + dy; applyView(); }
    });
    const end = (e) => {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      if (!g0) return;
      const G = g0; g0 = null; layOver.innerHTML = '';
      if (G.port) {
        if (G.moved) { const el = document.elementFromPoint(e.clientX, e.clientY), tp = el && el.closest && el.closest('[data-port]'); if (tp) pipeTo(G.port, tp.dataset.port); }
        else if (PU.pending && PU.pending !== G.port) pipeTo(PU.pending, G.port);
        else { PU.pending = PU.pending === G.port ? null : G.port; hint(); PU.render(true); }
        return;
      }
      if (G.moved) { if (G.unit) changed(); return; }
      if (G.unit) {
        if (G.unit.type === 'CTRL' && G.act && WT()) { B().ed.push(); const m = WT().ctrlAct(G.unit, G.act); if (m) { ui.click(); ui.toast(G.unit.tag + ': ' + T(m), '', 1800); } changed(); }
        else if (G.unit.type === 'BOTTLE' && G.act === 'reset') { B().ed.push(); PL.bottleReset(G.unit); ui.click(); ui.toast(G.unit.tag + ': ' + T(['jam reset', 'الزرجنة اتعملها ريست']), 'ok', 1800); changed(); }
        else if (G.act === 'toggle' || ((G.unit.type === 'VALVE' || G.unit.type === 'POU') && B().ed.mode === 'test')) toggleValve(G.unit);
        select(G.unit.id, null);
      } else if (G.pipe) select(null, G.pipe);
      else { select(null, null); if (PU.pending) { PU.pending = null; hint(); } }
    };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.addEventListener('wheel', (e) => { e.preventDefault(); PU.zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); }, { passive: false });
  }
  function portXY(ref) { const [id, port] = ref.split('.'); const u = plant().units.find((x) => x.id === id); return PL.portPos(u, port); }
  function hint() { const ed = B().ed; if (ed.hint) ed.hint(PU.pending ? T(['Tap another port to lay the pipe', 'اضغط على طرف تاني عشان تمد الماسورة']) : ''); }
  function pipeTo(a, b) {
    PU.pending = null; hint();
    if (a.split('.')[0] === b.split('.')[0]) { ui.toast(['A pipe needs two different units.', 'الماسورة محتاجة وحدتين مختلفتين.'], 'warn'); PU.render(true); return; }
    const pl0 = plant(true);
    if (pl0.pipes.some((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))) { ui.toast(['These two ports are already joined.', 'الطرفين دول متوصلين أصلا.'], 'warn'); PU.render(true); return; }
    B().ed.push();
    const p = PL.connect(pl0, a, b);
    if (p) { ui.click(); ui.toast(T(['Pipe laid: ', 'اتمدت ماسورة: ']) + PL.refLabel(plant(), a) + ' → ' + PL.refLabel(plant(), b), 'ok', 2500); PU.selPipe = p.id; PU.sel = null; }
    changed();
  }
  function toggleValve(u) {
    B().ed.push(); u.props.open = !u.props.open; ui.click();
    ui.toast(u.tag + ': ' + (u.props.open ? T(['opening', 'بيفتح']) : T(['closing', 'بيقفل'])), '', 1800);
    changed();
  }
  function changed() { PU.render(true); PU.inspector(); B().save(); }
  function select(id, pipe) { PU.sel = id; PU.selPipe = pipe; PU.render(true); PU.inspector(); if (id || pipe) { if (window.innerWidth <= 900 && !$('#side').classList.contains('open')) { /* keep canvas free on phones */ } } }
  PU.select = select;
  const WG = {
    steps: [
      ['Break tank: city water falls in through an air gap (protects the city main) and gives the pumps a steady supply.', 'تانك الكسر: مية البلد بتنزل فيه من فتحة هوا (بتحمي خط البلد) وبيدي الطلمبات مية ثابتة.'],
      ['Multimedia (sand) filter removes dirt and turbidity (SDI). Backwash at about 0.8 bar ΔP or every 48 h.', 'فلتر الرمل (مالتي ميديا) بيشيل الوساخة والعكارة (SDI). باك واش لما فرق الضغط يوصل 0.8 بار أو كل 48 ساعة.'],
      ['Activated carbon (or SMBS dosing) removes chlorine. Chlorine destroys RO membranes and the damage cannot be undone: never bypass the ORP alarm.', 'الكربون النشط (أو حقن SMBS) بيشيل الكلور. الكلور بيبوّظ ممبرين الـRO ومالوش رجوع: ممنوع تعمل باي باس لإنذار الـORP.'],
      ['Softener swaps Ca/Mg for Na so the RO and EDI do not scale. Check salt and hardness (< 1 mg/L) every shift.', 'السوفتنر بيبدّل الكالسيوم والماغنسيوم بصوديوم عشان الـRO والـEDI ما يعملوش قشور. افحص الملح والعسر (أقل من 1) كل وردية.'],
      ['Antiscalant dosing protects the RO concentrate side. 5 µm and 1 µm cartridges are the last guard: change at 0.8 bar ΔP.', 'مانع الترسيب بيحمي ناحية الريجكت في الـRO. كارتريدج 5 و1 ميكرون آخر حماية: غيّره عند 0.8 بار.'],
      ['RO pass 1 (high-pressure pump, about 11-13 bar) removes about 98 % of salts. The pump trips on low suction pressure.', 'الـRO الأولى (طلمبة ضغط عالي حوالي 11-13 بار) بتشيل حوالي 98٪ من الأملاح. الطلمبة بتفصل لو ضغط السحب وطي.'],
      ['NaOH between the passes turns CO2 into bicarbonate so RO pass 2 can remove it. Pass 2 brings the water to about 1 µS/cm.', 'الصودا بين المرحلتين بتحول الـCO2 لبيكربونات فالـRO التانية تقدر تشيله. التانية بتنزل المية لحوالي 1 ميكروسيمنز.'],
      ['EDI polishes to about 0.1 µS/cm with DC power and resin. It needs soft, chlorine-free water and trips on low flow.', 'الـEDI بيلمّع لحوالي 0.1 ميكروسيمنز بكهربا DC وريزن. محتاج مية سوفت من غير كلور وبيفصل لو الفلو قليل.'],
      ['UV 254 nm kills bacteria; the divert valve sends water to drain above about 1.1 µS/cm, so bad water never enters the PW tank.', 'الـUV 254 بيقتل البكتيريا، ومحبس التحويل بيرمي المية على الصرف فوق حوالي 1.1، فالمية الوحشة عمرها ما تدخل تانك الـPW.'],
      ['PW tank (316L, spray ball, hydrophobic 0.2 µm vent filter, heated on hot tanks). Generation starts at 65 % and stops at 90 %.', 'تانك الـPW (ستانلس 316L، سبراي بول، فلتر تهوية 0.2 ميكرون هيدروفوبيك، بسخان في التنكات السخنة). التوليد بيبدأ عند 65٪ ويقف عند 90٪.'],
      ['PW loop never stops: at least 1 m/s at the return (Re > 10 000), dead legs ≤ 2 D, UV on, sanitise at 80 °C on schedule.', 'لوب الـPW عمره ما يقف: 1 م/ث على الأقل في الراجع (Re فوق 10000)، الرجل الميتة 2 قطر بالكتير، الـUV شغال، وتعقيم 80 درجة في ميعاده.'],
      ['The still (MED) boils PW with plant steam (about 6 bar) and condenses WFI. It removes bacteria and endotoxin (3 log or more).', 'المقطّر (MED) بيغلي الـPW ببخار المصنع (حوالي 6 بار) ويكثف WFI. بيشيل البكتيريا والإندوتوكسين (3 لوج أو أكتر).'],
      ['WFI is stored and circulated hot (80-85 °C, never below 70 °C). POU coolers cool it only at the point of use.', 'الـWFI بيتخزن ويلف سخن (80-85 درجة، عمره ما ينزل تحت 70). المبردات بتبرده عند نقطة الاستخدام بس.'],
      ['Limits: conductivity by the USP Stage 1 table at the actual temperature, not compensated (1.1 at 20 °C, 1.3 at 25 °C); Ph. Eur. PW 4.3 at 20 °C. TOC ≤ 500 ppb. Bacteria are lab results against action levels: PW 100 CFU/mL, WFI 10 CFU/100 mL. WFI endotoxin < 0.25 EU/mL.', 'الحدود: الكونداكتيفيتي بجدول USP Stage 1 على الحرارة الفعلية من غير تعويض (1.1 على 20 درجة، 1.3 على 25)؛ والأوروبي للـPW ‏4.3 على 20 درجة. TOC ‏500 ppb أو أقل. البكتيريا نتايج معمل قدام حدود إجراء: PW ‏100 CFU/مل، WFI ‏10 CFU لكل 100 مل. إندوتوكسين الـWFI أقل من 0.25.'],
      ['Pure steam (optional) is made from PW; its condensate must meet WFI quality. It feeds autoclaves and SIP.', 'البيور ستيم (اختياري) بيتعمل من الـPW، والمتكثف منه لازم يطابق الـWFI. بيغذي الأوتوكلاف والـSIP.'],
    ],
    elec: [
      ['Raw feed pump 1.5 kW: VFD (constant pressure) or DOL.', 'طلمبة التغذية 1.5 ك.و: انفرتر (ضغط ثابت) أو DOL.'],
      ['RO high-pressure pumps 3 kW and 2.2 kW: VFD with a 15 s ramp; trips: suction < 0.7 bar, discharge > 16 bar, ORP > 350 mV.', 'طلمبات الضغط العالي 3 و2.2 ك.و: انفرتر برامب 15 ثانية؛ فصل: سحب أقل من 0.7 بار، طرد فوق 16 بار، ORP فوق 350.'],
      ['Dosing pumps 0.02-0.1 kW, 230 V, paced by the feed flow meter (pulse or 4-20 mA).', 'طلمبات الحقن 0.02-0.1 ك.و، 230 فولت، ماشية على عداد التغذية (بلس أو 4-20 ملي).'],
      ['EDI DC power supply 0.5-1 kW: enabled only with product and reject flow above minimum.', 'باور سبلاي الـEDI ‏0.5-1 ك.و: بيشتغل بس لو فلو المنتج والريجكت فوق الحد الأدنى.'],
      ['PW loop pump 2.2 kW VFD, WFI loop pump 1.5 kW VFD: stop on tank LL, alarm below 0.9 m/s return velocity.', 'طلمبة لوب الـPW ‏2.2 ك.و انفرتر، والـWFI ‏1.5 ك.و انفرتر: بيقفوا على LL للتانك، وإنذار تحت 0.9 م/ث في الراجع.'],
      ['Sanitisation heater 36-54 kW (or a steam HX); vent filter heaters 50-100 W; UV lamps 150 W each.', 'سخان التعقيم 36-54 ك.و (أو مبادل بخار)؛ سخانات فلتر التهوية 50-100 وات؛ لمبات الـUV ‏150 وات.'],
      ['Instruments: LT and TT on tanks, PT and ΔPT across filters, FT on feed, permeate and loop, conductivity on each RO pass and the loop return, TOC on the return, UV intensity.', 'الأجهزة: LT وTT على التنكات، PT وفرق ضغط على الفلاتر، FT على التغذية والمية النقية واللوب، كونداكتيفيتي على كل مرحلة RO وراجع اللوب، TOC على الراجع، وشدة الـUV.'],
    ],
  };
  PU.waterGuide = function () {
    const ol = (arr) => h('ol', null, arr.map((x) => h('li', { text: T(x) })));
    ui.modal([h('h3', { text: T(['Pharma water: from city water to WFI', 'مية الدوا: من مية البلد لحد الـWFI']) }), h('div', { class: 'ln-guidebox' }, ol(WG.steps), h('h3', { text: T(['Motors, electrics and instruments', 'المواتير والكهربا والأجهزة']) }), h('ul', null, WG.elec.map((x) => h('li', { text: T(x) }))),
      h('p', { class: 'mute sm', text: T(['Typical values for training, not validated design values. Bacteria growth and membrane damage run faster than real life so you can see them.', 'قيم نموذجية للتدريب، مش قيم تصميم معتمدة. نمو البكتيريا وتلف الممبرين أسرع من الحقيقة عشان تقدر تشوفهم.']) }),
      h('div', { class: 'row wrap' }, h('button', { class: 'btn pri', onclick: () => { document.querySelector('.modal') && document.querySelector('.modal').remove(); EL.projects.open('water', 'plant'); }, text: T(['Open the ready PW / WFI plant', 'افتح محطة الـPW / WFI الجاهزة']) })))]);
  };
  PU.delSel = function () {
    const pl = plant(); if (!pl) return;
    if (PU.sel) { B().ed.push(); PL.remove(pl, PU.sel); PU.sel = null; changed(); }
    else if (PU.selPipe) { B().ed.push(); pl.pipes = pl.pipes.filter((p) => p.id !== PU.selPipe); PU.selPipe = null; changed(); }
  };
  PU.keydown = function (e) {
    if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && B().ed.mode === 'build') { PU.delSel(); e.preventDefault(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.shiftKey ? B().ed.redo() : B().ed.undo(); e.preventDefault(); }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'y') { B().ed.redo(); e.preventDefault(); }
    else if (e.key === 'Escape') { PU.pending = null; hint(); select(null, null); }
  };

  /* ---------- add units ---------- */
  PU.add = function (type, x, y) {
    const pl = plant(true), d = PL.defs[type];
    if (x == null) {
      if (pl.units.length) { let x1 = -1e9, y0 = 1e9; for (const o of pl.units) { x1 = Math.max(x1, o.x + PL.defs[o.type].w); y0 = Math.min(y0, o.y); } x = x1 + 70; y = y0 + 40; }
      else { const r = host.getBoundingClientRect(), w = toWorld(r.left + r.width / 2, r.top + r.height / 2); x = w.x - d.w / 2; y = w.y - d.h / 2; }
    }
    B().ed.push();
    const u = PL.add(pl, type, Math.round(x / 10) * 10, Math.round(y / 10) * 10);
    if (B().ed.mode !== 'build') B().setMode('build');
    select(u.id, null); B().save();
    PU.focus(u);
    ui.toast(T(['Added ', 'اتضاف ']) + u.tag + '. ' + T(['Drag it into place, then tap a port to lay a pipe.', 'اسحبه لمكانه، وبعدين اضغط على طرف عشان تمد ماسورة.']), 'ok', 4000);
    return u;
  };
  PU.addMenu = function () {
    const grid = h('div', { class: 'pl-menu' });
    const m = ui.modal([h('h3', { text: T(['Add a process unit', 'ضيف وحدة للعملية']) }), grid]);
    for (const k of PL.order) grid.appendChild(h('button', { class: 'pl-mi', onclick: () => { m.remove(); PU.add(k); } }, previewIcon(k), h('span', { text: T(PL.defs[k].name) })));
  };
  function previewIcon(type) {
    const d = PL.defs[type], u = { id: 'x', type, x: 0, y: 0, tag: d.pre + '1', props: JSON.parse(JSON.stringify(d.props)), state: {} };
    if (d.init) d.init(u);
    if (type === 'TANK') u.state.lvl = 55;
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', `-14 -30 ${d.w + 28} ${d.h + 60}`);
    s.innerHTML = PA.defs + PA.draw(u);
    return s;
  }
  /* palette (left panel) when the Plant view is on */
  PU.palette = function (root, q) {
    root.innerHTML = '';
    const term = (q || '').trim().toLowerCase();
    const items = h('div', { class: 'pitems' });
    for (const k of PL.order) {
      const d = PL.defs[k];
      if (term && !T(d.name).toLowerCase().includes(term) && !k.toLowerCase().includes(term)) continue;
      const it = h('div', { class: 'pit', title: T(d.name) }, previewIcon(k), h('span', { text: T(d.name) }));
      it.addEventListener('pointerdown', (e) => paletteDrag(e, k));
      items.appendChild(it);
    }
    root.appendChild(h('div', { class: 'pgrp' }, h('div', { class: 'pgh' }, h('span', { text: T(['Process units', 'وحدات العملية']) })), items));
  };
  function paletteDrag(e, type) {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY; let ghost = null, moved = false;
    const mv = (ev) => { if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) { moved = true; ghost = h('div', { class: 'ghost', text: T(PL.defs[type].name) }); document.body.appendChild(ghost); } if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; } };
    const up = (ev) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      if (ghost) ghost.remove();
      if (moved) { const r = host.getBoundingClientRect(); if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) { const w = toWorld(ev.clientX, ev.clientY), d = PL.defs[type]; PU.add(type, w.x - d.w / 2, w.y - d.h / 2); } }
      else { PU.add(type); if (window.innerWidth <= 900) B().sheet(null); }
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }

  /* ---------- inspector (Part pane) ---------- */
  const partOpts = (types, cur) => {
    const c = C(), list = c.parts.filter((p) => types.includes(p.type));
    const opts = [h('option', { value: '', text: T(['(not linked)', '(مش مربوط)']) }), h('option', { value: '__new', text: '+ ' + T(['Create it on the panel, wired', 'اعمله في اللوحة متوصل']) })].concat(list.map((p) => h('option', { value: p.tag, selected: p.tag === cur ? true : null, text: p.tag + '  ' + T(EL.defs[p.type].name) })));
    if (cur && !list.some((p) => p.tag === cur)) opts.push(h('option', { value: cur, selected: true, text: cur + ' ⚠ ' + T(['not on the panel', 'مش في اللوحة']) }));
    return opts;
  };
  const PROPLAB = {
    bar: ['Pressure (bar)', 'الضغط (بار)'], temp: ['Temperature (°C)', 'الحرارة (درجة)'], vol: ['Volume (L)', 'الحجم (لتر)'], hgt: ['Height (m)', 'الارتفاع (متر)'], lvl0: ['Start level (%)', 'مستوى البداية (%)'], t0: ['Start temperature (°C)', 'حرارة البداية (درجة)'],
    lt: ['Level transmitter (panel)', 'ترانسميتر المستوى (اللوحة)'], tt: ['Temperature sensor (panel)', 'حساس الحرارة (اللوحة)'], htr: ['Heater (panel)', 'السخان (اللوحة)'],
    motor: ['Motor (panel)', 'الموتور (اللوحة)'], head: ['Max head (m)', 'أقصى رفع (متر)'], qmax: ['Max flow (L/min)', 'أقصى تصرف (لتر/د)'], flip: ['Mirror', 'اقلبه'],
    open: ['Open', 'مفتوح'], kv: ['Size (L/min at 1 bar)', 'المقاس (لتر/د عند 1 بار)'], sol: ['Solenoid (panel)', 'السولينويد (اللوحة)'],
    kind: ['Type', 'النوع'], dirt: ['Dirt in the water (x)', 'الوساخة في المية (x)'], rej: ['Reject valve opening (%)', 'فتحة محبس الريجكت (%)'], us: ['Feed conductivity (µS/cm)', 'موصلية الدخول (ميكروسيمنز)'],
    wq: ['Water quality', 'جودة المية'], on: ['Switched on', 'شغال'], rec: ['Recovery (%)', 'الاسترجاع (%)'], fv: ['Inlet float valve closes at (%, 0 = none)', 'عوامة الدخول بتقفل عند (%، 0 = مفيش)'], q0: ['Water in it at the start', 'المية اللي فيه في الأول'], jkt: ['Steam jacket holds (°C, 0 = off)', 'جاكيت البخار بيثبّت (درجة، 0 = مقفول)'],
    dn: ['Size (DN, 0 = old free size)', 'المقاس (DN، 0 = المقاس القديم)'], vt: ['Valve type', 'نوع المحبس'], qbep: ['Duty flow (m³/h, 0 = simple pump)', 'تصرف التشغيل (م³/س، 0 = طلمبة بسيطة)'], hbep: ['Duty head (m)', 'رفع التشغيل (متر)'], eta: ['Pump efficiency (0-1)', 'كفاءة الطلمبة (0-1)'],
    local: ['Run without the panel (local VFD)', 'تشتغل من غير اللوحة (انفرتر محلي)'], spd: ['VFD speed (%)', 'سرعة الانفرتر (%)'], lvt: ['Level control: tank', 'تحكم بالمستوى: التانك'], lon: ['Start at level (%)', 'تبدأ عند مستوى (%)'], loff: ['Stop at level (%)', 'تقف عند مستوى (%)'],
    mrej: ['Salt rejection (%)', 'نسبة رفض الأملاح (%)'], area: ['Membrane area (x, number of elements)', 'مساحة الممبرين (x، عدد العناصر)'], cap: ['Resin capacity (m³ of city water)', 'سعة الريزن (م³ مية بلد)'], chem: ['Chemical', 'الكيماوي'],
    int: ['Lamp intensity (%)', 'شدة اللمبة (%)'], nm: ['Wavelength (nm)', 'الطول الموجي (نانومتر)'], steam: ['Steam on', 'البخار شغال'], grade: ['Check against', 'قارنه بـ'], lim: ['Divert above (µS/cm compensated to 25 °C)', 'حوّل فوق (ميكروسيمنز معوّضة على 25 درجة)'], stk: ['Suction tank (stops below 10 %)', 'تانك السحب (تقف تحت 10٪)'], psl: ['Low suction trip (bar, 0 = off)', 'فصل ضغط سحب واطي (بار، 0 = مقفول)'],
    san: ['Hot sanitisation temperature (°C)', 'حرارة التعقيم السخن (درجة)'], hold: ['Hold at temperature (min)', 'مدة التثبيت على الحرارة (دقيقة)'], stank: ['Tank checked for the temperature', 'التانك اللي بتتقاس حرارته'],
    prod: ['Production on', 'الإنتاج شغال'], sanit: ['Hot sanitisation running', 'التعقيم السخن شغال'], dist: ['Distribution loop on', 'لوب التوزيع شغال'], grp: ['Station group (HMI)', 'مجموعة المحطة (HMI)'], sanrun: ['Keeps running during hot sanitisation', 'تفضل شغالة وقت التعقيم السخن'],
    kwh: ['Steam heating duty (kW, 0 = no limit)', 'قدرة التسخين بالبخار (ك.و، 0 = من غير حد)'], kwc: ['Chilled-water cooling duty (kW, 0 = no limit)', 'قدرة التبريد بالمية المتلجة (ك.و، 0 = من غير حد)'], dclose: ['Valves closed during hot sanitisation', 'محابس بتتقفل وقت التعقيم السخن'], dopen: ['Valves opened during hot sanitisation', 'محابس بتتفتح وقت التعقيم السخن'],
    ves: ['Pressure vessels (drawing)', 'عدد الفيسلز (في الرسمة)'], pass: ['RO pass (1 or 2, 0 = not shown)', 'مرحلة الـRO (1 أو 2، 0 = مش ظاهرة)'],
    tmax: ['Divert above temperature (°C, 0 = off)', 'حوّل فوق حرارة (درجة، 0 = مقفول)'], hot: ['Hot-water sanitisable membrane (to 85 °C)', 'ممبرين بيستحمل التعقيم بالمية السخنة (لحد 85 درجة)'], ins: ['Insulated (keeps its heat)', 'معزول (بيحافظ على حرارته)'],
    style: ['Drawing style', 'شكل الرسمة'], stock: ['Liquid in it (L, 0 = endless)', 'الكمية اللي فيه (لتر، 0 = مالهاش آخر)'],
    s1: ['S1: bottle under the filler (panel sensor)', 'S1: زجاجة تحت التعبئة (سنسور في اللوحة)'], s2: ['S2: bottle under the capper (panel sensor)', 'S2: زجاجة تحت الكابس (سنسور في اللوحة)'],
    cyl: ['Capping cylinder: 5/2 valve coil (panel)', 'سلندر الغطا: كويل فالف 5/2 (اللوحة)'], rup: ['Cylinder up reed switch (panel, optional)', 'ريد سويتش السلندر فوق (اللوحة، اختياري)'], rdn: ['Cylinder down reed switch (panel, optional)', 'ريد سويتش السلندر تحت (اللوحة، اختياري)'],
    bvol: ['Bottle volume (L)', 'حجم الزجاجة (لتر)'], rate: ['Bottles fed per minute', 'زجاجات داخلة في الدقيقة'], speed: ['Belt speed at full motor speed (m/min)', 'سرعة السير على أقصى سرعة موتور (م/د)'],
    eff: ['Effectiveness (0-1)', 'الكفاءة (0-1)'], tx: ['Transmitter (panel)', 'الترانسميتر (اللوحة)'], range: ['Range (full scale)', 'المدى (أقصى قراءة)'], sw: ['Switch (panel)', 'السويتش (اللوحة)'], set: ['Set point', 'نقطة الضبط'],
  };
  const LT = PL.linkTypes;
  const WT = () => EL.water;
  const ENUM = {
    kind: () => [['sand', T(['Sand / multimedia', 'رمل / مالتي ميديا'])], ['carbon', T(['Activated carbon (removes chlorine)', 'كربون نشط (بيشيل الكلور)'])], ['cart', T(['Cartridge 5 µm', 'كارتريدج 5 ميكرون'])], ['cart1', T(['Cartridge 1 µm', 'كارتريدج 1 ميكرون'])]],
    chem: () => [['naoh', T(['NaOH (between RO passes)', 'صودا كاوية (بين مرحلتين الـRO)'])], ['smbs', T(['SMBS (removes chlorine)', 'SMBS (بيشيل الكلور)'])], ['anti', T(['Antiscalant (before RO)', 'مانع ترسيب (قبل الـRO)'])], ['naocl', T(['NaOCl (chlorine)', 'كلور NaOCl'])]],
    grade: () => Object.keys(WT().GRADES).map((k) => [k, T(WT().GRADES[k])]),
    wq: () => [['city', T(['City water', 'مية البلد'])], ['well', T(['Well water (hard)', 'مية بير (عسرة)'])], ['pw', T(['Purified water', 'مية منقاة'])], ['wfi', 'WFI']],
    q0: () => ENUM.wq(),
    vt: () => [['dia', T(['Diaphragm (PW / WFI)', 'دايافرام (PW / WFI)'])], ['ball', T(['Ball (pretreatment)', 'بلف (المعالجة الأولية)'])], ['bfly', T(['Butterfly', 'فراشة'])]],
    dn: (u) => (u.type === 'POU' ? [] : [[0, T(['Old free size (L/min at 1 bar)', 'المقاس القديم (لتر/د عند 1 بار)'])]]).concat(WT().DN.map((d) => [d, 'DN' + d + '  Kv ' + (WT().KV[u.props.vt] || WT().KV.dia)[d]])),
    nm: () => [[254, '254 nm: ' + T(['kills bacteria', 'بيقتل البكتيريا'])], [185, '185 nm: ' + T(['also lowers TOC', 'وكمان بيقلل الـTOC'])]],
    stk: () => ENUM.lvt(),
    stank: () => ENUM.lvt(),
    grp: () => [['', T(['(none: own controls)', '(مفيش: تحكمها لوحدها)'])], ['prod', T(['Production', 'الإنتاج'])], ['dist', T(['Distribution loop', 'لوب التوزيع'])]],
    style: (u) => (u.type === 'SUPPLY' ? [['main', T(['Mains / sump', 'خط عمومي / بيارة'])], ['ibc', T(['IBC tote 1000 L on a stand', 'تانك IBC ‏1000 لتر على حامل'])]]
      : [['open', T(['Open tank', 'تانك مفتوح'])], ['cone', T(['Stainless, cone bottom, on legs', 'ستانلس بقاع مخروطي على رجول'])], ['ibc', T(['IBC tote 1000 L', 'تانك IBC ‏1000 لتر'])], ['vessel', T(['Closed pressure vessel on legs', 'وعاء ضغط مقفول على رجول'])]]),
    lvt: () => [['', T(['(none)', '(مفيش)'])]].concat((plant() ? plant().units.filter((x) => x.type === 'TANK') : []).map((t) => [t.tag, t.tag + '  ' + t.props.vol + ' L'])),
  };
  /* a 3-wire sensor (PROX / PHOTO) on the panel, fed from the PLC 24 V and wired to a free input */
  function mkSensor(type, name, props) {
    const c = C(), ed = B().ed; ed.push();
    let x = 40; for (const p of c.parts) { const d = EL.defs[p.type]; x = Math.max(x, p.x + (d.w || 100) + 80); }
    const s = EL.addPart(c, type, x, 620, props || {}), plc = c.parts.find((p) => p.type === 'PLC24R' || p.type === 'PLC24');
    let msg = T(['Created ', 'اتعمل ']) + s.tag + T([' (3-wire PNP). Wire BN to +24 V, BU to 0 V and BK to a PLC input.', ' (‏3 سلك PNP). وصّل BN على +24 وBU على 0 وBK على مدخل PLC.']);
    if (plc) {
      const used = (pin) => c.wires.some((w) => w.a === plc.id + '.' + pin || w.b === plc.id + '.' + pin);
      let i = 0; while (i < 8 && used('I' + i)) i++;
      EL.addWire(c, plc.id + '.LP', s.id + '.BN'); EL.addWire(c, s.id + '.BU', plc.id + '.M');
      if (i < 8) { EL.addWire(c, s.id + '.BK', plc.id + '.I' + i); msg = T(['Created ', 'اتعمل ']) + s.tag + T([', fed from ', '، متغذي من ']) + plc.tag + T([' and wired to ', ' ومتوصل على ']) + plc.tag + ':I' + i + ' = I0.' + i + ' (' + (name || s.tag) + ').'; }
    }
    ed.render(); ed.changed(); B().save(); ui.toast(msg, 'ok', 6000);
    return s.tag;
  }
  PU.inspector = function () {
    if (B().view !== 'plant') return;
    const root = $('#pane-part'); root.innerHTML = '';
    const pl = plant();
    const u = pl && PU.sel ? pl.units.find((x) => x.id === PU.sel) : null;
    const pipe = pl && PU.selPipe ? pl.pipes.find((x) => x.id === PU.selPipe) : null;
    const edit = (fn) => { B().ed.push(); fn(); changed(); };
    if (pipe) {
      root.appendChild(h('div', { class: 'card' }, h('h3', { text: T(['Pipe', 'ماسورة']) }), h('p', { class: 'ltr', text: PL.refLabel(pl, pipe.a) + '  →  ' + PL.refLabel(pl, pipe.b) }),
        h('div', { class: 'kv' }, h('span', { text: T(['Flow', 'التصرف']) }), h('b', { id: 'plPipeQ', text: Math.abs(PL.pipeQ(pl, pipe.id)).toFixed(1) + ' L/min' })),
        h('label', { class: 'f', text: T(['Pipe size', 'مقاس الماسورة']) }),
        h('select', { onchange: (e) => edit(() => { const d = +e.target.value; if (d) { pipe.dn = d; pipe.mat = pipe.mat || 'ss'; pipe.len = pipe.len || 5; } else { delete pipe.dn; delete pipe.mat; delete pipe.len; delete pipe.loop; } }) }, [h('option', { value: 0, text: T(['Free size (no friction model)', 'مقاس حر (من غير حساب احتكاك)']) })].concat(WT().DN.map((d) => h('option', { value: d, selected: d === +pipe.dn ? true : null, text: 'DN' + d + '  (ID ' + WT().ID[pipe.mat === 'pvc' ? 'pvc' : 'ss'][d] + ' mm)' })))),
        +pipe.dn > 0 ? h('div', null,
          h('label', { class: 'f', text: T(['Material', 'الخامة']) }),
          h('select', { onchange: (e) => edit(() => { pipe.mat = e.target.value; }) }, [['ss', T(['316L stainless tube (PW / WFI)', 'ستانلس 316L (PW / WFI)'])], ['pvc', T(['PVC-U (pretreatment)', 'PVC-U (المعالجة الأولية)'])]].map(([a, b]) => h('option', { value: a, selected: a === pipe.mat ? true : null, text: b }))),
          h('label', { class: 'f', text: T(['Length (m)', 'الطول (متر)']) }),
          h('input', { type: 'number', value: pipe.len, min: 0.01, max: 2000, step: 'any', onchange: (e) => { const x = +e.target.value; if (x > 0 && x <= 2000) edit(() => { pipe.len = x; }); } }),
          h('label', { class: 'f', text: T(['Part of a distribution loop (keep ≥ 1 m/s)', 'جزء من لوب توزيع (لازم ≥ 1 م/ث)']) }),
          h('button', { class: 'btn ' + (pipe.loop ? 'on' : ''), onclick: () => edit(() => { pipe.loop = !pipe.loop; }), text: pipe.loop ? T(['Yes', 'أيوه']) : T(['No', 'لأ']) }),
          h('div', { id: 'plPipeV', style: { marginTop: '8px' } })) : null,
        h('div', { class: 'row wrap', style: { marginTop: '8px' } }, h('button', { class: 'btn bad', onclick: () => PU.delSel(), text: T(['Delete pipe', 'احذف الماسورة']) }))));
      return;
    }
    if (!u) {
      const card = h('div', { class: 'card' }, h('h3', { text: T(['Process (plant)', 'العملية']) }),
        h('p', { class: 'mute', text: T(['Build mode: drag units, tap a port then another port to lay a pipe. Test mode: tap valves to open or close them. A pump turns when its linked motor on the panel turns, or on its own local VFD.', 'وضع البناء: اسحب الوحدات، واضغط على طرف وبعدين طرف تاني عشان تمد ماسورة. وضع الاختبار: اضغط على المحابس تفتحها أو تقفلها. الطلمبة بتلف لما الموتور المربوط في اللوحة يلف، أو على انفرتر محلي خاص بيها.']) }),
        h('button', { class: 'btn pri', onclick: () => PU.addMenu(), text: '+ ' + T(['Add a unit', 'ضيف وحدة']) }));
      root.appendChild(card);
      root.appendChild(h('div', { class: 'card', id: 'plProblems' }));
      PU.updateLive(true);
      return;
    }
    const d = PL.defs[u.type];
    const tagIn = h('input', { type: 'text', value: u.tag, maxlength: 10, style: { maxWidth: '110px' }, onchange: (e) => { const v = e.target.value.replace(/[^\w\-.]/g, '').slice(0, 10); if (v) edit(() => { u.tag = v; }); } });
    const actions = [];
    if (u.type === 'VALVE') actions.push(h('button', { class: 'btn ' + (u.props.open ? 'bad' : 'ok'), onclick: () => toggleValve(u), text: u.props.open ? T(['Close valve', 'اقفل المحبس']) : T(['Open valve', 'افتح المحبس']) }));
    if (u.type === 'FILTER') actions.push(h('button', { class: 'btn ok', onclick: () => edit(() => { u.state.clog = 0; ui.toast(u.tag + ': ' + T(/cart/.test(u.props.kind) ? ['new cartridge fitted', 'اتركب كارتريدج جديد'] : ['backwashed, clean again', 'اتعمله باك واش ونضف']), 'ok'); }), text: T(/cart/.test(u.props.kind) ? ['Change cartridge', 'غيّر الكارتريدج'] : ['Backwash', 'باك واش']) }));
    if (u.type === 'POU') actions.push(h('button', { class: 'btn ' + (u.props.open ? 'bad' : 'ok'), onclick: () => toggleValve(u), text: u.props.open ? T(['Close', 'اقفل']) : T(['Open (draw water)', 'افتح (اسحب مية)']) }));
    if (u.type === 'PUMP' && u.state.trip) actions.push(h('button', { class: 'btn warn', onclick: () => edit(() => { u.state.trip = 0; u.state.lpt = 0; }), text: T(['Reset trip', 'ريست الفصل']) }));
    if (u.type === 'SOFT') actions.push(h('button', { class: 'btn ok', onclick: () => edit(() => { u.state.used = 0; u.state.left = 100; ui.toast(u.tag + ': ' + T(['regenerated with brine', 'اتعمله ريجينريشن بالملح']), 'ok'); }), text: T(['Regenerate', 'ريجينريشن']) }));
    if (u.type === 'FILTER' && u.props.kind === 'carbon') actions.push(h('button', { class: 'btn', onclick: () => edit(() => { u.state.bv = 0; ui.toast(u.tag + ': ' + T(['new carbon', 'كربون جديد']), 'ok'); }), text: T(['Replace carbon', 'غيّر الكربون']) }));
    if (u.type === 'RO') actions.push(h('button', { class: 'btn', onclick: () => edit(() => { u.state.scale = 0; ui.toast(u.tag + ': ' + T(['acid cleaning done: scale removed', 'اتعمل غسيل حمضي: القشور اتشالت']), 'ok'); }), text: T(['Acid clean (CIP)', 'غسيل حمضي (CIP)']) }), h('button', { class: 'btn', onclick: () => edit(() => { u.state.dmg = 0; u.state.cl2h = 0; u.state.scale = 0; ui.toast(u.tag + ': ' + T(['new membranes fitted', 'اتركب ممبرين جديد']), 'ok'); }), text: T(['Replace membranes', 'غيّر الممبرين']) }));
    if (u.type === 'EDI') actions.push(h('button', { class: 'btn', onclick: () => edit(() => { u.state.scale = 0; }), text: T(['Clean the stack', 'نضّف الستاك']) }));
    if (u.type === 'UV') actions.push(h('button', { class: 'btn', onclick: () => edit(() => { u.props.int = 100; u.props.on = true; }), text: T(['New lamp', 'لمبة جديدة']) }));
    if (u.type === 'PUMP' && WT()) actions.push(h('select', { class: 'pl-preset', onchange: (e) => { const P = WT().PUMPS[e.target.value]; if (P) edit(() => { Object.assign(u.props, { qbep: P.q, hbep: P.h, eta: P.eta }); if (!u.props.motor) u.props.local = true; }); } }, [h('option', { value: '', text: T(['Pick a pump size…', 'اختار مقاس طلمبة…']) })].concat(Object.keys(WT().PUMPS).map((k) => h('option', { value: k, text: T(WT().PUMPS[k].n) })))));
    if (u.type === 'TANK' && WT()) actions.push(h('select', { class: 'pl-preset', onchange: (e) => { const vol = +e.target.value; if (vol) edit(() => { const lv = u.state.v / Math.max(1, +u.props.vol); u.props.vol = vol; u.props.hgt = WT().tankDims(vol).H; u.state.v = lv * vol; }); } }, [h('option', { value: '', text: T(['Tank size…', 'مقاس التانك…']) })].concat(WT().TANKS.map((v) => h('option', { value: v, selected: v === +u.props.vol ? true : null, text: v + ' L  (Ø' + WT().tankDims(v).D.toFixed(2) + ' × ' + WT().tankDims(v).H + ' m)' })))));
    if (u.type === 'BOTTLE') actions.push(h('button', { class: 'btn ' + (u.state.jam ? 'warn' : ''), onclick: () => edit(() => { PL.bottleReset(u); ui.toast(u.tag + ': ' + T(['jam reset', 'الزرجنة اتعملها ريست']), 'ok'); }), text: T(['Reset jam', 'ريست الزرجنة']) }), h('button', { class: 'btn', onclick: () => edit(() => PL.bottleReset(u, true)), text: T(['Clear belt and counters', 'فضّي السير والعدادات']) }));
    if (u.type === 'SUPPLY' && +u.props.stock > 0) actions.push(h('button', { class: 'btn ok', onclick: () => edit(() => { u.state.left = +u.props.stock; ui.toast(u.tag + ': ' + T(['refilled', 'اتملا تاني']), 'ok'); }), text: T(['Refill', 'املاه تاني']) }));
    if (u.type === 'TANK') actions.push(h('button', { class: 'btn', onclick: () => edit(() => { u.state.v = (+u.props.vol * +u.props.lvl0) / 100; u.state.T = +u.props.t0; }), text: T(['Reset level', 'رجّع المستوى']) }), h('button', { class: 'btn', onclick: () => edit(() => { u.state.v = 0; }), text: T(['Empty it', 'فضّيه']) }));
    if (B().ed.mode === 'build') actions.push(h('button', { class: 'btn', onclick: () => edit(() => { u.props.flip = !u.props.flip; }), text: T(['Mirror', 'اقلبه']) }), h('button', { class: 'btn bad', onclick: () => PU.delSel(), text: T(['Delete', 'حذف']) }));
    root.appendChild(h('div', { class: 'card' }, h('div', { class: 'row' }, tagIn, h('div', { class: 'grow' }, h('b', { text: T(d.name) }))), h('p', { class: 'mute', text: T(d.info) }), h('div', { class: 'row wrap' }, actions)));
    // properties
    const card = h('div', { class: 'card' }, h('h3', { text: T(['Properties and links', 'الخصائص والربط']) }));
    for (const k of Object.keys(d.props)) {
      if (k === 'flip' || (k === 'sw' && u.type === 'TANK')) continue;
      const v = u.props[k];
      let inp;
      const bl = u.type === 'BOTTLE' ? { s1: LT.sense, s2: LT.sense, rup: LT.sense, rdn: LT.sense, cyl: LT.sol } : {};
      const link = bl[k] || { lt: LT.tx, tt: LT.temp, htr: LT.htr, motor: LT.motor, sol: LT.sol, tx: u.type === 'TT' ? LT.temp : LT.tx }[k] || null;
      const swLink = (u.type === 'PS' || u.type === 'FS') && k === 'sw';
      const pick = (e, make) => { const val = e.target.value; if (val === '__new') { const tag = make(); if (tag) { u.props[k] = tag; changed(); } } else edit(() => { u.props[k] = val; }); };
      const AW = ui.autowire;
      const maker = u.type === 'BOTTLE' && k !== 'motor' ? (k === 'cyl' ? () => AW.solenoid() : () => mkSensor(k === 's1' || k === 's2' ? 'PHOTO' : 'PROX', u.tag + ' ' + k.toUpperCase())) : { motor: () => AW.motor(), lt: () => AW.transmitter('level', 'LT ' + u.tag), tt: () => AW.transmitter('temp', 'TT ' + u.tag), htr: () => AW.simple('HTR'), sol: () => AW.solenoid(), tx: () => AW.transmitter(u.type === 'TT' ? 'temp' : 'press', u.tag) }[k];
      if (link) inp = h('select', { onchange: (e) => pick(e, maker) }, partOpts(link, v));
      else if (swLink) inp = h('select', { onchange: (e) => pick(e, () => AW.contact(u.type === 'PS' ? 'PRESS' : 'FLOW', u.tag, false)) }, partOpts(u.type === 'PS' ? LT.ps : LT.fs, v));
      else if (ENUM[k] && !(k === 'dn' && u.type === 'POU' && false)) { const ops = ENUM[k](u); inp = h('select', { onchange: (e) => edit(() => { const x = e.target.value; u.props[k] = typeof v === 'number' ? +x : x; }) }, ops.map(([a, b]) => h('option', { value: a, selected: String(a) === String(v) ? true : null, text: b }))); }
      else if (typeof v === 'boolean') inp = h('button', { class: 'btn ' + (v ? 'on' : ''), onclick: () => edit(() => { u.props[k] = !u.props[k]; }), text: v ? T(['Yes', 'أيوه']) : T(['No', 'لأ']) });
      else if (typeof v === 'number') inp = h('input', { type: 'number', value: v, step: 'any', onchange: (e) => { let x = +e.target.value; if (k === 'ves') x = Math.round(Math.max(1, Math.min(6, x))); if (k === 'pass') x = Math.round(Math.max(0, Math.min(2, x))); if (isFinite(x)) edit(() => { u.props[k] = Math.max(k === 'temp' || k === 't0' ? 0 : k === 'vol' || k === 'hgt' || k === 'range' ? 0.1 : 0, Math.min(k === 'eff' ? 0.95 : ['lvl0', 'rej', 'spd', 'int', 'lon', 'loff', 'mrej', 'fv', 'san', 'tmax'].includes(k) ? 100 : 100000, x)); if (u.type === 'TANK' && (k === 'vol')) u.state.v = Math.min(u.state.v, x); if (u.type === 'SUPPLY' && k === 'stock') u.state.left = u.props.stock; if (k === 'bvol') u.props.bvol = Math.max(0.01, u.props.bvol); }); } });
      else continue;
      card.appendChild(h('label', { class: 'f', text: T(PROPLAB[k] || [k, k]) })); card.appendChild(inp);
    }
    root.appendChild(card);
    if (u.type === 'TANK') {
      const sc = h('div', { class: 'card' }, h('h3', { text: T(['Level switches', 'سويتشات المستوى']) }), h('p', { class: 'mute sm', text: T(['A switch operates when the liquid is above its level. Float: a contact (FLOAT on the panel). PNP: a 3-wire capacitive sensor on the tank wall (BN +24 V, BK output, BU 0 V), linked to a 3-wire sensor on the panel.', 'السويتش بيشتغل لما السايل يبقى فوق مستواه. فلوت: كونتاكت (FLOAT في اللوحة). PNP: سنسور كاباسيتيف 3 سلك على جدار التانك (BN ‏+24، BK الخرج، BU صفر)، مربوط بسنسور 3 سلك في اللوحة.']) }));
      u.props.sw.forEach((s, i) => {
        const pnp = s.k === 'pnp';
        sc.appendChild(h('div', { class: 'pl-swrow k4' },
          h('input', { type: 'text', value: s.n, maxlength: 10, 'aria-label': T(['Name', 'الاسم']), onchange: (e) => edit(() => { s.n = e.target.value.replace(/[^\w\-.]/g, '').slice(0, 10); }) }),
          h('input', { type: 'number', value: s.l, min: 0, max: 100, 'aria-label': T(['Level (%)', 'المستوى (%)']), onchange: (e) => edit(() => { s.l = Math.max(0, Math.min(100, +e.target.value || 0)); }) }),
          h('select', { 'aria-label': T(['Kind', 'النوع']), onchange: (e) => edit(() => { if (e.target.value === 'pnp') s.k = 'pnp'; else delete s.k; }) }, [['float', T(['Float', 'فلوت'])], ['pnp', 'PNP']].map(([a, b]) => h('option', { value: a, selected: (pnp ? 'pnp' : 'float') === a ? true : null, text: b }))),
          h('select', { 'aria-label': T(['Panel part', 'الجهاز في اللوحة']), onchange: (e) => { const val = e.target.value; if (val === '__new') { s.t = pnp ? mkSensor('PROX', u.tag + ' ' + s.n, { logic: (+s.l || 0) >= 50 ? 'NC' : 'NO' }) : ui.autowire.contact('FLOAT', s.n, (+s.l || 0) >= 50); changed(); } else edit(() => { s.t = val; }); } }, partOpts(pnp ? LT.pnp : LT.float, s.t))));
      });
      root.appendChild(sc);
    }
    root.appendChild(h('div', { class: 'card', id: 'plLive' }));
    PU.updateLive(true);
  };
  let liveSig = '';
  PU.updateLive = function (force) {
    if (ui.cycles) ui.cycles.update();
    if (B().view !== 'plant') return;
    const pl = plant();
    const pb = $('#plProblems');
    if (pb) {
      const pr = PL.problems(C());
      const s = pr.map((x) => x[0] + x[1] + T(x[2])).join('|');
      if (force || s !== liveSig) {
        liveSig = s;
        pb.innerHTML = '';
        pb.appendChild(h('h3', { text: T(['Process check', 'فحص العملية']) }));
        if (!pr.length) pb.appendChild(h('p', { class: 'mute', text: pl && pl.units.length ? T(['No problems found.', 'مفيش مشاكل.']) : T(['Empty.', 'فاضي.']) }));
        for (const [lvl, tag, msg] of pr) pb.appendChild(h('div', { class: 'pl-prob ' + lvl, onclick: () => { const u = pl.units.find((x) => x.tag === tag); if (u) select(u.id, null); } }, h('b', { text: tag }), ' ', T(msg)));
      }
    }
    const lv = $('#plLive');
    if (lv && pl && PU.sel) {
      const u = pl.units.find((x) => x.id === PU.sel); if (!u) return;
      const st = u.state, rows = [];
      const r = (k, v) => rows.push(`<div class="kv"><span>${esc(T(k))}</span><b class="ltr">${esc(v)}</b></div>`);
      const L = (q) => (Math.abs(q || 0) * 60).toFixed(1) + ' L/min';
      if (u.type === 'TANK') { r(['Level', 'المستوى'], (st.lvl || 0).toFixed(1) + ' %'); r(['Volume', 'الحجم'], (st.v || 0).toFixed(0) + ' L'); r(['Net in-flow', 'صافي الداخل'], ((st.qin || 0) * 60).toFixed(1) + ' L/min'); r(['Temperature', 'الحرارة'], (st.T || 20).toFixed(1) + ' °C'); if (st.heatW) r(['Heater', 'السخان'], Math.round(st.heatW) + ' W'); }
      if (u.type === 'PUMP') { r(['Speed', 'السرعة'], Math.round(Math.abs(st.s || 0) * 100) + ' %'); r(['Flow', 'التصرف'], L(st.q)); r(['Pressure rise', 'فرق الضغط'], (st.dp || 0).toFixed(2) + ' bar'); r(['Suction', 'السحب'], PL.pressAt(pl, u.id + '.in').toFixed(2) + ' bar'); r(['Discharge', 'الطرد'], PL.pressAt(pl, u.id + '.out').toFixed(2) + ' bar'); }
      if (['VALVE', 'SOLV', 'CHECK', 'FM', 'PT', 'PS', 'FS', 'TT', 'PG', 'SUPPLY', 'DRAIN'].includes(u.type)) r(['Flow', 'التصرف'], L(st.q));
      if (u.type === 'VALVE' || u.type === 'SOLV') r(['Opening', 'الفتحة'], Math.round((st.pos || 0) * 100) + ' %');
      if (['PT', 'PS', 'FS', 'TT', 'PG'].includes(u.type)) { r(['Pressure', 'الضغط'], (st.p || 0).toFixed(2) + ' bar'); r(['Temperature', 'الحرارة'], (st.T || 20).toFixed(1) + ' °C'); }
      if (u.type === 'FILTER') { r(['Flow', 'التصرف'], L(st.q)); r(['Pressure drop', 'فرق الضغط'], (st.dp || 0).toFixed(2) + ' bar'); r(['Dirt load', 'الوساخة'], Math.round(Math.min(100, (st.clog || 0) * 50)) + ' %'); }
      if (u.type === 'RO') { r(['Feed pressure', 'ضغط الدخول'], (st.pin || 0).toFixed(2) + ' bar'); r(['Permeate', 'المية النقية'], L(st.qp)); r(['Reject', 'الريجكت'], L(st.qr)); r(['Recovery', 'الاسترجاع'], Math.round(st.rec || 0) + ' %'); r(['Permeate quality', 'جودة المية'], st.us ? Math.round(st.us) + ' µS/cm' : '-'); r(['Feed temperature', 'حرارة الدخول'], (st.Tf || 20).toFixed(1) + ' °C'); }
      if (u.type === 'HX' && st.th) { r(['Hot side', 'الناحية السخنة'], st.th[0].toFixed(1) + ' → ' + st.th[1].toFixed(1) + ' °C, ' + L(st.qh)); r(['Cold side', 'الناحية الباردة'], st.tc[0].toFixed(1) + ' → ' + st.tc[1].toFixed(1) + ' °C, ' + L(st.qc)); }
      if (u.type === 'FM') r(['Total', 'الإجمالي'], Math.round(st.tot || 0) + ' L');
      if (u.type === 'SUPPLY' && +u.props.stock > 0) r(['Left in it', 'الباقي فيه'], Math.round(st.left == null ? +u.props.stock : st.left) + ' / ' + Math.round(+u.props.stock) + ' L');
      if (u.type === 'BOTTLE') { r(['Belt', 'السير'], st.jam ? 'JAM' : (Math.abs(st.v || 0) * 60).toFixed(1) + ' m/min'); r(['Bottles on the belt', 'الزجاجات على السير'], String(st.n || 0)); r(['Filling flow', 'تصرف التعبئة'], L(st.fq)); r(['Cylinder', 'السلندر'], Math.round((st.ext || 0) * 100) + ' %'); r(['S1 / S2', 'S1 / S2'], (st.s1 ? 1 : 0) + ' / ' + (st.s2 ? 1 : 0)); r(['Good / bad', 'سليم / بايظ'], (st.ok || 0) + ' / ' + (st.bad || 0)); r(['Spilled', 'اللي وقع'], (st.spill || 0).toFixed(2) + ' L'); }
      const Wt = WT();
      if (u.type === 'TANK') { const e = Wt.tankETA(u); if (e) { r(e.fill ? ['Reaches 90 % in', 'يوصل 90٪ في'] : ['Falls to 10 % in', 'ينزل لـ 10٪ في'], Wt.fmtT(e.s)); r(e.fill ? ['Full fill 0-100 % at this flow', 'ملو كامل 0-100٪ بالتصرف ده'] : ['Full empty at this flow', 'تفريغ كامل بالتصرف ده'], Wt.fmtT(e.full)); } }
      if (u.type === 'PUMP') { r(['Flow', 'التصرف'], (Math.abs(st.q || 0) * 3.6).toFixed(2) + ' m³/h'); r(['Shaft power', 'قدرة العمود'], (st.kw || 0).toFixed(2) + ' kW'); if (u.props.lvt) r(['Level control', 'تحكم المستوى'], st.lstop ? T(['stopped by level', 'واقفة بالمستوى']) : T(['running', 'شغالة'])); }
      if (u.type === 'SOFT') { r(['Flow', 'التصرف'], L(st.q)); r(['Resin left', 'الريزن الباقي'], Math.round(st.left == null ? 100 : st.left) + ' %'); }
      if (u.type === 'EDI') { r(['Product', 'المنتج'], L(st.qp)); r(['Reject', 'الريجكت'], L(st.qr)); r(['DC power', 'كهربا DC'], st.dc ? 'ON' : 'OFF'); }
      if (u.type === 'STILL') { r(['WFI out', 'الـWFI الخارج'], L(st.qd)); r(['Blowdown', 'البلو داون'], L(st.qb)); }
      if (u.type === 'DIV') r(['Position', 'الوضع'], st.div ? T(['to drain', 'للصرف']) : T(['to the tank', 'للتانك']));
      if (u.type === 'RO' && st.cl2h) r(['Chlorine exposure', 'التعرض للكلور'], Math.round(st.cl2h) + ' ppm·h');
      const wq = u.type === 'TANK' ? st.wq : (u.type === 'QA' || u.type === 'POU') ? st.wq : u.type === 'RO' ? st.wf : null;
      if (wq) {
        const Tq = u.type === 'TANK' ? st.T : u.type === 'QA' || u.type === 'POU' ? st.T : st.Tf;
        r(['Conductivity (raw)', 'الكونداكتيفيتي (خام)'], Wt.fmt(Wt.condRaw(wq, Tq), 3) + ' µS/cm'); r(['Hardness', 'العسر'], Wt.fmt(wq[1], 2) + ' mg/L'); r(['Chlorine', 'الكلور'], Wt.fmt(wq[2], 3) + ' mg/L'); r(['TOC', 'TOC'], Wt.fmt(wq[3], 0) + ' ppb'); r(['Silica', 'السيليكا'], Wt.fmt(wq[4], 3) + ' ppm'); r(['Bacteria', 'البكتيريا'], Wt.fmt(wq[5], 3) + ' CFU/mL'); r(['Endotoxin', 'الإندوتوكسين'], Wt.fmt(wq[6], 4) + ' EU/mL'); r(['CO2', 'CO2'], Wt.fmt(wq[8], 2) + ' ppm');
        if (u.type === 'QA' || u.type === 'POU') for (const x of Wt.spec(wq, Tq, u.props.grade)) rows.push(`<div class="kv ${x.ok ? 'okc' : 'badc'}"><span>${esc(T(x.k))}</span><b class="ltr">${esc(Wt.fmt(x.val, x.d) + ' ' + x.unit + (x.min ? ' ≥ ' : ' ≤ ') + x.lim + (x.ok ? '  ✓' : '  ✗'))}</b></div>`);
      }
      const s = rows.join('');
      if (force || s !== lv._s) { lv._s = s; lv.innerHTML = `<h3>${esc(T(['Live values', 'القيم الحية']))}</h3>` + s; }
    }
    const pq = $('#plPipeQ'); if (pq && pl && PU.selPipe) pq.textContent = Math.abs(PL.pipeQ(pl, PU.selPipe)).toFixed(1) + ' L/min';
    const pv = $('#plPipeV'); if (pv && pl && PU.selPipe) {
      const pp = pl.pipes.find((x) => x.id === PU.selPipe), pi = pp && WT().pipeInfo(pp, PL.pipeQ(pl, pp.id) / 60, PL.tempAt(pl, pp.a));
      if (pi) { const s = `<div class="kv"><span>${esc(T(['Velocity', 'السرعة']))}</span><b class="ltr">${pi.v.toFixed(2)} m/s</b></div><div class="kv"><span>Reynolds</span><b class="ltr">${Math.round(pi.Re)}</b></div><div class="kv"><span>${esc(T(['Pressure drop', 'فقد الضغط']))}</span><b class="ltr">${pi.dp.toFixed(3)} bar</b></div><div class="kv"><span>L / D</span><b class="ltr">${pi.LD.toFixed(1)}</b></div>`; if (s !== pv._s) { pv._s = s; pv.innerHTML = s; } }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
