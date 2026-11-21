/* Parts B: control devices, contactor, relays, timers, thermal overload */
(function (g) {
  const EL = g.EL;
  const { P, INT, Z, VS, cabs } = EL;
  const RC = EL.R_CLOSED;
  const D = EL.defs;
  const T = EL.T, body = EL.body, pin = EL.mkpin;

  /* ---------------- operator switches ---------------- */
  function sw(o) {
    return {
      cat: 'control', prefix: o.prefix || 'SB', name: o.name, info: o.info, w: 40, h: 90, kind: o.kind, mode: o.mode,
      pins: [pin(o.p1, o.p1, 20, 0, 'u'), pin(o.p2, o.p2, 20, 90, 'd')],
      props: [],
      faults: [['none', ['None', 'سليم']], ['open', ['Contact never closes (dirty / broken)', 'الكونتاكت مش بيوصل (متسخ / مكسور)']], ['shorted', ['Contact stuck closed', 'الكونتاكت لاصق مقفول']]],
      init(p) { p.state = { act: false, hold: false }; },
      closed(p) {
        if (p.fault === 'open') return false;
        if (p.fault === 'shorted') return true;
        return o.kind === 'NO' ? p.state.act : !p.state.act;
      },
      elements(p) { return this.closed(p) ? [Z(P(p, o.p1), P(p, o.p2), RC, 0, { tag: 'k' })] : []; },
      press(p, ev) {
        const s = p.state;
        if (o.mode === 'mom') {
          if (ev.type === 'down') { if (s.hold) { s.hold = false; s.act = false; } else s.act = true; EL.emit('click', p); }
          else if (ev.type === 'up') { if (!s.hold) s.act = false; }
          else if (ev.type === 'hold') s.hold = true;
        } else if (ev.type === 'down') { s.act = !s.act; EL.emit('click', p); }
      },
      draw(p) {
        const s = p.state, act = s.act;
        let r = '';
        const cy = 36;
        r += `<line x1="20" y1="0" x2="20" y2="20" class="wl"/><line x1="20" y1="70" x2="20" y2="90" class="wl"/>`;
        if (o.id === 'ESTOP') {
          r += `<circle cx="20" cy="${cy}" r="19" fill="#FDC300" stroke="#0e1626" stroke-width="2"/><circle cx="20" cy="${cy}" r="14" fill="${act ? '#8c2a1c' : '#F55B41'}" stroke="#0e1626"/>` + (act ? '' : `<circle cx="16" cy="${cy - 5}" r="4" fill="#fff" opacity=".25"/>`);
          r += T(20, cy + 3, act ? '' : '', 'pbtn') + T(20, 82, act ? 'LATCHED' : 'E-STOP', 'psub');
        } else if (o.id === 'SEL2') {
          r += `<circle cx="20" cy="${cy}" r="16" fill="#1a2238" stroke="#7b879f" stroke-width="2"/><rect x="${act ? 22 : 15}" y="${act ? 22 : 18}" width="6" height="${act ? 18 : 18}" rx="3" fill="#e8edf5" transform="rotate(${act ? 40 : -40} 20 ${cy})"/>`;
          r += T(20, 82, act ? 'ON' : 'OFF', 'psub');
        } else {
          const col = o.kind === 'NC' ? '#F55B41' : '#91C361';
          r += `<circle cx="20" cy="${cy}" r="17" fill="#1a2238" stroke="#7b879f" stroke-width="2"/><circle cx="20" cy="${cy}" r="${act ? 11 : 13}" fill="${col}" stroke="#0e1626"/>`;
          r += T(20, cy + 4, o.kind === 'NC' ? 'O' : 'I', 'pbtn');
          if (s.hold) r += `<path d="M30 22 l4 -4" stroke="#FDC300" stroke-width="2"/><text class="psub" x="38" y="20" text-anchor="start">hold</text>`;
          r += T(20, 82, o.kind === 'NC' ? 'NC' : 'NO', 'psub');
        }
        const on = this.closed(p);
        r += `<circle cx="20" cy="92" r="0"/>`;
        return r + `<rect x="2" y="86" width="36" height="3" fill="${on ? 'var(--green)' : 'transparent'}"/>`;
      },
    };
  }
  EL.mkSw = sw;
  D.PB_NO = sw({ id: 'PB_NO', name: ['Pushbutton NO (start)', 'زرار تشغيل NO'], kind: 'NO', mode: 'mom', p1: '3', p2: '4', info: ['Normally open pushbutton. Contact 3-4 closes only while you press it. Use it as START.', 'زرار NO. الكونتاكت 3-4 بيقفل وانت ضاغط بس. بيستخدم كـSTART.'] });
  D.PB_NC = sw({ id: 'PB_NC', name: ['Pushbutton NC (stop)', 'زرار إيقاف NC'], kind: 'NC', mode: 'mom', p1: '1', p2: '2', info: ['Normally closed pushbutton. Contact 1-2 is closed at rest and opens while you press it. Use it as STOP.', 'زرار NC. الكونتاكت 1-2 مقفول وهو سايب وبيفتح وانت ضاغط. بيستخدم كـSTOP.'] });
  D.ESTOP = sw({ id: 'ESTOP', name: ['Emergency stop (latching)', 'زرار طوارئ (بيثبت)'], kind: 'NC', mode: 'latch', p1: '1', p2: '2', info: ['Mushroom head, NC contact 1-2, latches when pushed. Click again to twist-release.', 'زرار فطر طوارئ بكونتاكت NC 1-2 وبيثبت لما يتضغط. اضغط تاني لفكه.'] });
  D.SEL2 = sw({ id: 'SEL2', name: ['Selector switch 2-position', 'سلكتور سويتش وضعين'], kind: 'NO', mode: 'latch', p1: '3', p2: '4', info: ['Maintained 2-position selector with one NO contact 3-4. Click to turn.', 'سلكتور وضعين بكونتاكت NO واحد 3-4. اضغط عشان تلفه.'] });

  D.HOA = {
    cat: 'control', prefix: 'SA', name: ['Selector Hand-Off-Auto', 'سلكتور Hand-Off-Auto'], w: 70, h: 100,
    info: ['3-position selector. HAND closes 13-14, AUTO closes 23-24, OFF opens both. Click the left, centre or right of the knob.', 'سلكتور 3 أوضاع. HAND بيقفل 13-14 وAUTO بيقفل 23-24 وOFF بيفتح الاتنين. اضغط يمين أو وسط أو شمال.'],
    pins: [pin('13', '13', 20, 0, 'u'), pin('14', '14', 20, 100, 'd'), pin('23', '23', 50, 0, 'u'), pin('24', '24', 50, 100, 'd')],
    props: [], faults: [['none', ['None', 'سليم']], ['open', ['Contacts never close', 'الكونتاكتات مش بتوصل']]],
    init(p) { p.state = { pos: '0' }; },
    elements(p) {
      const out = [];
      if (p.fault === 'open') return out;
      if (p.state.pos === 'H') out.push(Z(P(p, '13'), P(p, '14'), RC, 0, { tag: 'h' }));
      if (p.state.pos === 'A') out.push(Z(P(p, '23'), P(p, '24'), RC, 0, { tag: 'a' }));
      return out;
    },
    press(p, ev) { if (ev.type !== 'down') return; p.state.pos = ev.lx < 24 ? 'H' : ev.lx > 46 ? 'A' : '0'; EL.emit('click', p); },
    draw(p) {
      const pos = p.state.pos, ang = pos === 'H' ? -45 : pos === 'A' ? 45 : 0;
      return `<line x1="20" y1="0" x2="20" y2="20" class="wl"/><line x1="50" y1="0" x2="50" y2="20" class="wl"/><line x1="20" y1="80" x2="20" y2="100" class="wl"/><line x1="50" y1="80" x2="50" y2="100" class="wl"/>` +
        `<circle cx="35" cy="48" r="20" fill="#1a2238" stroke="#7b879f" stroke-width="2"/><rect x="31" y="30" width="8" height="22" rx="4" fill="#e8edf5" transform="rotate(${ang} 35 48)"/>` +
        T(12, 78, 'H', 'pbtn') + T(35, 78, '0', 'pbtn') + T(58, 78, 'A', 'pbtn');
    },
  };
  function limit(id, nm, info, prefix) {
    return {
      cat: 'control', prefix, name: nm, info, w: 70, h: 90,
      pins: [pin('11', 'C', 35, 0, 'u'), pin('12', 'NC', 18, 90, 'd'), pin('14', 'NO', 52, 90, 'd')],
      props: [], faults: [['none', ['None', 'سليم']], ['open', ['Contacts dirty (never close)', 'الكونتاكتات متسخة']], ['stuck', ['Stuck actuated', 'لاصق على وضع التشغيل']]],
      init(p) { p.state = { act: false }; },
      elements(p) {
        const act = p.fault === 'stuck' ? true : p.state.act;
        if (p.fault === 'open') return [];
        return act ? [Z(P(p, '11'), P(p, '14'), RC, 0, { tag: 'no' })] : [Z(P(p, '11'), P(p, '12'), RC, 0, { tag: 'nc' })];
      },
      press(p, ev) { if (ev.type === 'down') { p.state.act = !p.state.act; EL.emit('click', p); } },
      draw(p) {
        const act = p.fault === 'stuck' ? true : p.state.act;
        return `<line x1="35" y1="0" x2="35" y2="22" class="wl"/><line x1="18" y1="68" x2="18" y2="90" class="wl"/><line x1="52" y1="68" x2="52" y2="90" class="wl"/>` +
          `<line x1="35" y1="22" x2="${act ? 52 : 18}" y2="66" stroke="#e8edf5" stroke-width="2.5"/><circle cx="35" cy="22" r="3" fill="#e8edf5"/>` +
          `<rect x="${act ? 12 : 2}" y="30" width="14" height="8" rx="2" fill="#FDC300" opacity=".0"/>` + T(35, 80, act ? 'ACTUATED' : 'FREE', 'psub');
      },
    };
  }
  EL.mkLimit = limit;
  D.LIM = limit('LIM', ['Limit switch (changeover)', 'ليميت سويتش (CO)'], ['Changeover limit switch. Click to actuate it. At rest C-NC is closed; actuated C-NO is closed.', 'ليميت سويتش CO. اضغط عليه عشان يتشغل. وهو حر C-NC مقفول وبعد التشغيل C-NO مقفول.'], 'SQ');
  D.PRESS = limit('PRESS', ['Pressure switch (changeover)', 'بريشر سويتش (CO)'], ['Pressure switch with a changeover contact. Click to simulate pressure reached.', 'بريشر سويتش بكونتاكت CO. اضغط عليه عشان تعمل إن الضغط وصل.'], 'BP');

  /* ---------------- coil devices ---------------- */
  const COILS = [['24VDC', '24 V DC'], ['24VAC', '24 V AC'], ['48VDC', '48 V DC'], ['110VAC', '110 V AC'], ['230VAC', '230 V AC'], ['400VAC', '400 V AC']];
  function coilSpec(p) { const s = String(p.props.coil || '230VAC'); return { v: parseInt(s, 10), ac: /AC$/.test(s) }; }
  EL.coilSpec = coilSpec;
  function coilElement(p, tag, a, b, VA, W) {
    const c = coilSpec(p);
    if (c.ac) {
      const zt = (c.v * c.v) / VA, r = 0.1 * zt, x = Math.sqrt(zt * zt - r * r);
      return Z(P(p, a), P(p, b), r, x / (2 * Math.PI * 50), { tag });
    }
    return Z(P(p, a), P(p, b), (c.v * c.v) / W, 0, { tag });
  }
  /* shared coil logic; returns whether coil is energised enough to hold/pick */
  function coilStep(p, sim, dt, tag) {
    const c = coilSpec(p), st = p.state;
    const r = EL.eRead(sim, p.id, tag);
    const vrel = c.ac ? r.vac : Math.abs(r.vdc);
    st.vcoil = vrel; st.icoil = c.ac ? r.iac : Math.abs(r.idc);
    st.vac = r.vac; st.vdc = Math.abs(r.vdc);
    const over = vrel > 1.3 * c.v || (c.ac && Math.abs(r.vdc) > 0.5 * c.v) || (!c.ac && r.vac > 1.3 * c.v);
    if (over) { st.stress = (st.stress || 0) + dt; if (st.stress > 0.4) { st.burnt = true; st.closed = false; EL.emit('burn', p); return false; } }
    else st.stress = Math.max(0, (st.stress || 0) - dt);
    const pick = c.ac ? 0.85 : 0.8, hold = 0.5;
    return vrel >= (st.closed ? hold : pick) * c.v && !over;
  }
  function coilFaults() { return [['none', ['None', 'سليم']], ['open_coil', ['Coil open circuit', 'الكويل مقطوع']], ['burnt', ['Coil burnt', 'الكويل محروق']], ['no_close', ['Contacts will not close (jammed)', 'الكونتاكتات مش بتقفل (مشكلة ميكانيكية)']], ['welded', ['Contacts welded closed', 'الكونتاكتات ملحومة مقفولة']]]; }
  function coilOK(p) { return !(p.state.burnt || p.fault === 'open_coil' || p.fault === 'burnt'); }
  function coilUpdate(p, sim, dt) {
    const st = p.state, was = st.closed;
    if (!coilOK(p)) { st.t = 0; if (p.fault !== 'welded') st.closed = false; }
    else {
      const e = coilStep(p, sim, dt, 'coil');
      if (e) { st.t = (st.t || 0) + dt; if (st.t >= 0.03 && p.fault !== 'no_close') st.closed = true; } else { st.t = 0; st.closed = false; }
    }
    if (p.fault === 'welded') st.closed = true;
    st.energized = coilOK(p) && st.t > 0;
    if (was !== st.closed) EL.emit('click', p);
  }
  const burntMark = (x, y) => `<g class="smoke"><circle cx="${x}" cy="${y}" r="5" fill="#222" opacity=".8"/><circle cx="${x + 6}" cy="${y - 6}" r="4" fill="#444" opacity=".7"/></g>`;

  D.CONT3 = {
    cat: 'control', prefix: 'KM', name: ['Contactor 3-pole', 'كونتاكتور 3 بول'], w: 240, h: 210,
    info: ['Power contactor. Coil A1-A2 closes the 3 power poles (1-2, 3-4, 5-6) and aux NO 13-14, 23-24, and opens aux NC 31-32, 41-42. Check the coil voltage before energising: a 24 V coil on 230 V burns out.', 'كونتاكتور قدرة. الكويل A1-A2 بيقفل البولات (1-2، 3-4، 5-6) والمساعدين NO 13-14 و23-24 وبيفتح NC 31-32 و41-42. راجع جهد الكويل قبل التشغيل: كويل 24 فولت على 230 بيتحرق.'],
    pins: [['1', 20], ['3', 50], ['5', 80], ['A1', 115], ['13', 145], ['23', 170], ['31', 195], ['41', 220]].map(([i, x]) => pin(i, i, x, 0, 'u'))
      .concat([['2', 20], ['4', 50], ['6', 80], ['A2', 115], ['14', 145], ['24', 170], ['32', 195], ['42', 220]].map(([i, x]) => pin(i, i, x, 210, 'd'))),
    props: [{ k: 'coil', label: ['Coil voltage', 'جهد الكويل'], t: 'sel', opts: COILS, def: '230VAC' }],
    faults: coilFaults(),
    init(p) { p.state = { closed: false, t: 0 }; },
    elements(p) {
      const out = [], st = p.state;
      if (coilOK(p)) out.push(coilElement(p, 'coil', 'A1', 'A2', 8, 2.4));
      if (st.closed) {
        [['1', '2'], ['3', '4'], ['5', '6']].forEach(([a, b], i) => out.push(Z(P(p, a), P(p, b), RC, 0, { tag: 'k' + i })));
        out.push(Z(P(p, '13'), P(p, '14'), RC, 0, { tag: 'no1' }), Z(P(p, '23'), P(p, '24'), RC, 0, { tag: 'no2' }));
      } else out.push(Z(P(p, '31'), P(p, '32'), RC, 0, { tag: 'nc1' }), Z(P(p, '41'), P(p, '42'), RC, 0, { tag: 'nc2' }));
      return out;
    },
    update: coilUpdate,
    draw(p) {
      const st = p.state, cl = st.closed;
      let r = body(240, 210);
      for (const x of [20, 50, 80]) r += `<line x1="${x}" y1="0" x2="${x}" y2="80" class="wl"/><line x1="${x}" y1="130" x2="${x}" y2="210" class="wl"/><circle cx="${x}" cy="80" r="3" fill="#e8edf5"/><circle cx="${x}" cy="130" r="3" fill="#e8edf5"/>` + (cl ? `<line x1="${x}" y1="80" x2="${x}" y2="130" stroke="#91C361" stroke-width="3"/>` : `<line x1="${x}" y1="80" x2="${x + 14}" y2="122" stroke="#e8edf5" stroke-width="2.5"/>`);
      const aux = (x, no) => `<line x1="${x}" y1="0" x2="${x}" y2="85" class="wl"/><line x1="${x}" y1="125" x2="${x}" y2="210" class="wl"/>` + ((no ? cl : !cl) ? `<line x1="${x}" y1="85" x2="${x}" y2="125" stroke="#91C361" stroke-width="3"/>` : `<line x1="${x}" y1="85" x2="${x + 10}" y2="120" stroke="#e8edf5" stroke-width="2.5"/>`);
      r += aux(145, true) + aux(170, true) + aux(195, false) + aux(220, false);
      const lit = st.energized;
      r += `<line x1="115" y1="0" x2="115" y2="78" class="wl"/><line x1="115" y1="132" x2="115" y2="210" class="wl"/>`;
      r += `<rect x="99" y="78" width="32" height="54" rx="4" fill="${lit ? '#2b5a8a' : '#1a2238'}" stroke="${lit ? '#47BFD9' : '#7b879f'}" stroke-width="2"/>`;
      r += T(115, 101, 'KM', 'pbtn') + T(115, 116, (p.props.coil || '').replace('VAC', 'V~').replace('VDC', 'V='), 'psub');
      r += T(60, 156, 'NO', 'psub') + T(157, 150, 'NO', 'psub') + T(207, 150, 'NC', 'psub') + T(120, 40, '', 'psub');
      if (st.burnt || p.fault === 'burnt') r += burntMark(115, 90);
      return r;
    },
  };
  function relayDef(n, nm, prefix) {
    const w = 60 + n * 40, h = 130;
    const pins = [pin('A1', 'A1', 20, 0, 'u'), pin('A2', 'A2', 20, h, 'd')];
    for (let i = 0; i < n; i++) {
      const base = (i + 1) * 10, x = 70 + i * 40;
      pins.push(pin(base + 1 + '', base + 1 + '', x, 0, 'u'), pin(base + 2 + '', base + 2 + '', x - 10, h, 'd'), pin(base + 4 + '', base + 4 + '', x + 10, h, 'd'));
    }
    return {
      cat: 'control', prefix: prefix || 'KA', name: nm, w, h,
      info: ['Control relay with ' + n + ' changeover contacts. Coil A1-A2. Each contact: 11 common, 12 normally closed, 14 normally open (then 21/22/24 ...).', 'ريلاي تحكم بعدد ' + n + ' كونتاكت CO. الكويل A1-A2. كل كونتاكت: 11 كومن و12 NC و14 NO (وبعدها 21/22/24 ...).'],
      pins, props: [{ k: 'coil', label: ['Coil voltage', 'جهد الكويل'], t: 'sel', opts: COILS, def: '24VDC' }],
      faults: coilFaults(),
      init(p) { p.state = { closed: false, t: 0 }; },
      elements(p) {
        const out = [], cl = p.state.closed;
        if (coilOK(p)) out.push(coilElement(p, 'coil', 'A1', 'A2', 2, 0.9));
        for (let i = 0; i < n; i++) { const b = (i + 1) * 10; out.push(Z(P(p, b + 1 + ''), P(p, (cl ? b + 4 : b + 2) + ''), RC, 0, { tag: 'c' + i })); }
        return out;
      },
      update: coilUpdate,
      draw(p) {
        const cl = p.state.closed, lit = p.state.energized;
        let r = body(w, h);
        r += `<line x1="20" y1="0" x2="20" y2="46" class="wl"/><line x1="20" y1="84" x2="20" y2="${h}" class="wl"/>`;
        r += `<rect x="6" y="46" width="28" height="38" rx="4" fill="${lit ? '#2b5a8a' : '#1a2238'}" stroke="${lit ? '#47BFD9' : '#7b879f'}" stroke-width="2"/>` + T(20, 69, 'K', 'pbtn');
        for (let i = 0; i < n; i++) {
          const x = 70 + i * 40;
          r += `<line x1="${x}" y1="0" x2="${x}" y2="40" class="wl"/><line x1="${x - 10}" y1="${h}" x2="${x - 10}" y2="92" class="wl"/><line x1="${x + 10}" y1="${h}" x2="${x + 10}" y2="92" class="wl"/>`;
          r += `<line x1="${x}" y1="40" x2="${cl ? x + 10 : x - 10}" y2="90" stroke="${cl ? '#91C361' : '#e8edf5'}" stroke-width="2.5"/>`;
        }
        r += T(w / 2, 14, (p.props.coil || '').replace('VAC', 'V~').replace('VDC', 'V='), 'psub').replace('x="' + w / 2 + '"', 'x="' + (w / 2 + 12) + '"');
        if (p.state.burnt || p.fault === 'burnt') r += burntMark(20, 58);
        return r;
      },
    };
  }
  EL.mkRelay = relayDef;
  EL.coilFns = { coilElement, coilUpdate, coilOK, coilFaults, coilSpec };
  D.RLY2 = relayDef(2, ['Relay 2 changeover', 'ريلاي 2 كونتاكت CO'], 'KA');
  D.RLY4 = relayDef(4, ['Relay 4 changeover', 'ريلاي 4 كونتاكت CO'], 'KA');

  D.TON = {
    cat: 'control', prefix: 'KT', name: ['On-delay timer', 'تايمر On-delay'], w: 100, h: 120,
    info: ['On-delay timer, 24-240 V AC/DC supply on A1-A2. After the set time the changeover contact moves: 15-18 closes, 15-16 opens. Power off resets it.', 'تايمر On-delay بتغذية 24-240 فولت AC/DC على A1-A2. بعد الزمن المضبوط الكونتاكت بيتحول: 15-18 بيقفل و15-16 بيفتح. فصل الكهرباء بيصفّره.'],
    pins: [pin('A1', 'A1', 20, 0, 'u'), pin('A2', 'A2', 20, 120, 'd'), pin('15', '15', 75, 0, 'u'), pin('16', '16', 60, 120, 'd'), pin('18', '18', 85, 120, 'd')],
    props: [{ k: 'time', label: ['Delay (s)', 'الزمن (ثانية)'], t: 'num', min: 0.5, max: 60, step: 0.5, def: 5 }],
    faults: [['none', ['None', 'سليم']], ['dead', ['Dead (never times out)', 'ميت (مش بيعد)']]],
    electronic: true,
    init(p) { p.state = { t: 0, done: false, on: false }; },
    elements(p) {
      const out = [];
      if (!p.state.burnt) out.push(Z(P(p, 'A1'), P(p, 'A2'), 15000, 0, { tag: 'in' }));
      out.push(Z(P(p, '15'), P(p, p.state.done ? '18' : '16'), RC, 0, { tag: 'c' }));
      return out;
    },
    update(p, sim, dt) {
      const r = EL.eRead(sim, p.id, 'in'), v = Math.max(r.vac, Math.abs(r.vdc)), st = p.state;
      if (v > 280) { st.burnt = true; EL.emit('burn', p); }
      st.on = !st.burnt && v >= 20 && p.fault !== 'dead';
      if (st.on) { st.t += dt; if (st.t >= p.props.time) st.done = true; } else { st.t = 0; st.done = false; }
    },
    draw(p) {
      const st = p.state, f = Math.min(1, st.t / p.props.time);
      return body(100, 120) + `<line x1="20" y1="0" x2="20" y2="20" class="wl"/><line x1="75" y1="0" x2="75" y2="40" class="wl"/><line x1="60" y1="120" x2="60" y2="92" class="wl"/><line x1="85" y1="120" x2="85" y2="92" class="wl"/>` +
        `<line x1="75" y1="40" x2="${st.done ? 85 : 60}" y2="90" stroke="${st.done ? '#91C361' : '#e8edf5'}" stroke-width="2.5"/>` +
        `<rect x="8" y="30" width="46" height="46" rx="5" fill="#1a2238" stroke="#7b879f"/><text class="pbtn" x="31" y="50" text-anchor="middle">ON</text><text class="pbtn" x="31" y="64" text-anchor="middle">${p.props.time}s</text>` +
        `<rect x="10" y="84" width="40" height="6" rx="3" fill="#0e1626"/><rect x="10" y="84" width="${40 * f}" height="6" rx="3" fill="#47BFD9"/>` + `<circle cx="42" cy="22" r="4" class="led ${st.on ? 'ledg' : ''}"/>` + (st.burnt ? burntMark(20, 40) : '');
    },
  };
  D.SDT = {
    cat: 'control', prefix: 'KT', name: ['Star-delta timer', 'تايمر ستار-دلتا'], w: 130, h: 120,
    info: ['Star-delta timer. On power: STAR contact 17-18 closes at once. After the set time it opens, and after a short dead time (0.1 s) the DELTA contact 27-28 closes. Power off resets.', 'تايمر ستار-دلتا. عند التغذية كونتاكت الستار 17-18 بيقفل فورًا. بعد الزمن بيفتح، وبعد زمن ميت قصير (0.1 ثانية) كونتاكت الدلتا 27-28 بيقفل. فصل الكهرباء بيصفّره.'],
    pins: [pin('A1', 'A1', 20, 0, 'u'), pin('A2', 'A2', 20, 120, 'd'), pin('17', '17', 65, 0, 'u'), pin('18', '18', 65, 120, 'd'), pin('27', '27', 105, 0, 'u'), pin('28', '28', 105, 120, 'd')],
    props: [{ k: 'time', label: ['Star time (s)', 'زمن الستار (ثانية)'], t: 'num', min: 1, max: 60, step: 0.5, def: 6 }],
    faults: [['none', ['None', 'سليم']], ['dead', ['Dead (stays in star)', 'ميت (يفضل ستار)']]],
    electronic: true,
    init(p) { p.state = { t: 0, on: false }; },
    contacts(p) { const st = p.state, T1 = p.props.time; return { star: st.on && st.t < T1, delta: st.on && st.t >= T1 + 0.1 }; },
    elements(p) {
      const out = [], c = this.contacts(p);
      if (!p.state.burnt) out.push(Z(P(p, 'A1'), P(p, 'A2'), 15000, 0, { tag: 'in' }));
      if (c.star) out.push(Z(P(p, '17'), P(p, '18'), RC, 0, { tag: 'star' }));
      if (c.delta) out.push(Z(P(p, '27'), P(p, '28'), RC, 0, { tag: 'delta' }));
      return out;
    },
    update(p, sim, dt) {
      const r = EL.eRead(sim, p.id, 'in'), v = Math.max(r.vac, Math.abs(r.vdc)), st = p.state;
      if (v > 280) { st.burnt = true; EL.emit('burn', p); }
      const was = JSON.stringify(this.contacts(p));
      st.on = !st.burnt && v >= 20 && p.fault !== 'dead';
      if (st.on) st.t += dt; else st.t = 0;
      if (was !== JSON.stringify(this.contacts(p))) EL.emit('click', p);
    },
    draw(p) {
      const c = this.contacts(p), st = p.state;
      let r = body(130, 120) + `<line x1="20" y1="0" x2="20" y2="20" class="wl"/>`;
      r += `<rect x="8" y="26" width="46" height="46" rx="5" fill="#1a2238" stroke="#7b879f"/><text class="pbtn" x="31" y="46" text-anchor="middle">Y-Δ</text><text class="pbtn" x="31" y="60" text-anchor="middle">${p.props.time}s</text>`;
      r += `<line x1="65" y1="0" x2="65" y2="46" class="wl"/><line x1="65" y1="120" x2="65" y2="80" class="wl"/><line x1="65" y1="46" x2="${c.star ? 65 : 76}" y2="80" stroke="${c.star ? '#91C361' : '#e8edf5'}" stroke-width="2.5"/>`;
      r += `<line x1="105" y1="0" x2="105" y2="46" class="wl"/><line x1="105" y1="120" x2="105" y2="80" class="wl"/><line x1="105" y1="46" x2="${c.delta ? 105 : 116}" y2="80" stroke="${c.delta ? '#91C361' : '#e8edf5'}" stroke-width="2.5"/>`;
      r += T(65, 100, 'STAR', 'psub') + T(105, 100, 'DELTA', 'psub');
      r += `<circle cx="42" cy="14" r="4" class="led ${st.on ? 'ledg' : ''}"/>` + `<rect x="10" y="84" width="40" height="6" rx="3" fill="#0e1626"/><rect x="10" y="84" width="${Math.min(40, 40 * st.t / p.props.time)}" height="6" rx="3" fill="#47BFD9"/>`;
      return r + (st.burnt ? burntMark(20, 40) : '');
    },
  };

  D.OL = {
    cat: 'control', prefix: 'FR', name: ['Thermal overload relay', 'ثيرمال أوفرلود'], w: 160, h: 140,
    info: ['Thermal overload relay. Wire its poles 2-4-6 to the motor. Set the dial to the motor nameplate current. On overload it trips: NC 95-96 opens (cuts the coil) and NO 97-98 closes. Click it to reset after it cools.', 'ثيرمال أوفرلود. بولات 2-4-6 للموتور. اضبط الدايل على تيار لوحة الموتور. عند الأوفرلود بيفصل: 95-96 NC بيفتح (بيقطع الكويل) و97-98 NO بيقفل. اضغط عليه عشان تعمل Reset بعد ما يبرد.'],
    pins: [pin('1', '1', 20, 0, 'u'), pin('3', '3', 50, 0, 'u'), pin('5', '5', 80, 0, 'u'), pin('2', '2', 20, 140, 'd'), pin('4', '4', 50, 140, 'd'), pin('6', '6', 80, 140, 'd'),
      pin('95', '95', 115, 0, 'u'), pin('96', '96', 115, 140, 'd'), pin('97', '97', 145, 0, 'u'), pin('98', '98', 145, 140, 'd')],
    props: [{ k: 'set', label: ['Current setting (A)', 'ضبط التيار (أمبير)'], t: 'num', min: 0.2, max: 40, step: 0.1, def: 3.5 }, { k: 'cls', label: ['Trip class', 'كلاس الفصل'], t: 'sel', opts: [[10, 'Class 10'], [20, 'Class 20'], [30, 'Class 30']], def: 10 }],
    faults: [['none', ['None', 'سليم']], ['bad95', ['95-96 contact open', 'كونتاكت 95-96 مفتوح']], ['pole_open', ['Pole 4 not conducting', 'البول 4 مش بيوصل']]],
    init(p) { p.state = { heat: 0, tripped: false }; },
    elements(p) {
      const out = [], st = p.state;
      [['1', '2'], ['3', '4'], ['5', '6']].forEach(([a, b], i) => { if (!(p.fault === 'pole_open' && i === 1)) out.push(Z(P(p, a), P(p, b), RC, 0, { tag: 'k' + i })); });
      if (!st.tripped && p.fault !== 'bad95') out.push(Z(P(p, '95'), P(p, '96'), RC, 0, { tag: 'nc' }));
      if (st.tripped) out.push(Z(P(p, '97'), P(p, '98'), RC, 0, { tag: 'no' }));
      return out;
    },
    update(p, sim, dt) {
      const st = p.state, Iset = +p.props.set;
      const cur = [0, 1, 2].map((i) => { const r = EL.eRead(sim, p.id, 'k' + i); return Math.max(r.iac, Math.abs(r.idc)); });
      const I = Math.max(...cur), mn = Math.min(...cur);
      st.amps = I;
      if (st.tripped) { st.heat = Math.max(0, st.heat - dt * st.heat / 100); return; }
      const x = I / Iset;
      if (x > 1.05) {
        let K = 508 * (p.props.cls / 10);
        if (I > 0.5 * Iset && mn < 0.5 * I) K /= 4; // single phasing
        st.heat += dt * (x * x - 1) / K;
      } else st.heat = Math.max(0, st.heat - dt * st.heat / 100);
      if (st.heat >= 1) { st.tripped = true; EL.emit('trip', p, 'overload'); }
    },
    press(p, ev) {
      if (ev.type !== 'down') return;
      const st = p.state;
      if (st.tripped) {
        if (st.heat > 0.65) return { msg: ['Still hot. Wait for the bimetal to cool, then reset.', 'لسه سخن. استنى البايمتال يبرد وبعدين Reset.'] };
        st.tripped = false; st.heat = 0; EL.emit('click', p); return { msg: ['Overload reset.', 'تم عمل Reset للأوفرلود.'] };
      }
    },
    draw(p) {
      const st = p.state;
      let r = body(160, 140);
      for (const x of [20, 50, 80]) r += `<line x1="${x}" y1="0" x2="${x}" y2="50" class="wl"/><line x1="${x}" y1="90" x2="${x}" y2="140" class="wl"/><path d="M${x} 50 q8 10 0 20 q-8 10 0 20" fill="none" stroke="#FDC300" stroke-width="2.5"/>`;
      r += `<line x1="115" y1="0" x2="115" y2="48" class="wl"/><line x1="115" y1="140" x2="115" y2="92" class="wl"/><line x1="145" y1="0" x2="145" y2="48" class="wl"/><line x1="145" y1="140" x2="145" y2="92" class="wl"/>`;
      r += `<line x1="115" y1="48" x2="${st.tripped ? 125 : 115}" y2="92" stroke="${st.tripped ? '#e8edf5' : '#91C361'}" stroke-width="2.5"/><line x1="145" y1="48" x2="${st.tripped ? 145 : 155}" y2="92" stroke="${st.tripped ? '#91C361' : '#e8edf5'}" stroke-width="2.5"/>`;
      r += `<rect x="12" y="100" width="${136}" height="6" rx="3" fill="#0e1626"/><rect x="12" y="100" width="${Math.min(136, 136 * st.heat)}" height="6" rx="3" fill="${st.heat > 0.7 ? '#F55B41' : '#FDC300'}"/>`;
      r += T(80, 122, 'Ir ' + (+p.props.set).toFixed(1) + ' A  cl.' + p.props.cls, 'psub');
      r += `<rect x="96" y="108" width="52" height="16" rx="3" fill="${st.tripped ? '#F55B41' : '#1a2238'}" stroke="#7b879f"/>` + T(122, 120, st.tripped ? 'TRIP' : 'OK', 'pbtn');
      return r;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
