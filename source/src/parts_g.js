/* Parts G: more board-level parts: varistor, resettable fuse, crystal, thyristors, TVS */
(function (g) {
  const EL = g.EL;
  const { P, Z } = EL;
  const D = EL.defs;
  const T = EL.T, pin = EL.mkpin;
  const F0 = ['none', ['None', 'سليم']];
  const wl = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="wl"/>`;
  const smoke = (x, y) => `<g class="smoke"><circle cx="${x}" cy="${y}" r="5" fill="#222" opacity=".8"/><circle cx="${x + 6}" cy="${y - 6}" r="4" fill="#444" opacity=".7"/></g>`;
  const mk = (o) => Object.assign({ cat: 'elec', pcb: true, faults: [F0], props: [], diag: { kind: 'passive' } }, o);

  /* ---------- MOV (varistor): surge absorber that fails shorted ---------- */
  D.MOV = mk({
    prefix: 'RV', name: ['Varistor (MOV)', 'فاريستور (MOV)'], w: 50, h: 80,
    info: ['Surge absorber across the mains. Open circuit in normal use (megohms). It clamps spikes. After a big surge or long overvoltage it ages and finally fails SHORT: it blows the fuse in front of it or burns. A MOV that reads low or looks cracked or blackened must be replaced.', 'ماص سبايك على خط المين. في الحالة العادية مفتوح (ميجا أوم). بيقص السبايك. بعد سبايك كبير أو جهد زيادة فترة بيتعب وفي الآخر بيتعطل ماس: بيحرق الفيوز اللي قبله أو بيتحرق. الفاريستور اللي بيقرا واطي أو مشروخ أو أسود لازم يتغير.'],
    pins: [pin('A', 'A', 25, 0, 'u'), pin('B', 'B', 25, 80, 'd')],
    props: [{ k: 'vrms', label: ['Rated AC voltage (V)', 'الجهد المقنن AC (فولت)'], t: 'sel', opts: [[130, '130 V'], [275, '275 V (230 V mains)'], [320, '320 V'], [385, '385 V (400 V mains)'], [460, '460 V']], def: 275 }],
    faults: [F0, ['short', ['Failed shorted', 'اتعطل ماس']], ['leak', ['Aged (leaks 50 kohm)', 'تعبان (بيسرّب 50 كيلو)']], ['open', ['Open', 'مفتوح']]],
    diag: { kind: 'passive', fail: 'short' },
    elements(p) {
      const st = p.state;
      if (st.burnt || p.fault === 'short') return [Z(P(p, 'A'), P(p, 'B'), 0.3, 0, { tag: 's' })];
      if (p.fault === 'open') return [];
      return [Z(P(p, 'A'), P(p, 'B'), p.fault === 'leak' ? 50000 : 1e8, 0, { tag: 'v' })];
    },
    update(p, sim, dt) {
      const st = p.state, e = EL.eRead(sim, p.id, st.burnt || p.fault === 'short' ? 's' : 'v'), vr = +p.props.vrms;
      st.vac = e.vac; st.vdc = e.vdc;
      if (!st.burnt && p.fault !== 'short' && (e.vac > vr * 1.2 || Math.abs(e.vdc) > vr * 1.5)) { st.stress = (st.stress || 0) + dt; if (st.stress > 0.4) { st.burnt = true; EL.emit('burn', p, 'varistor failed shorted (overvoltage)'); } } else if (!st.burnt) st.stress = 0;
    },
    draw(p) {
      const b = p.state.burnt || p.fault === 'short';
      return wl(25, 0, 25, 16) + wl(25, 64, 25, 80) + `<circle cx="25" cy="40" r="24" fill="${b ? '#2a1a12' : '#2a63c6'}" stroke="#0e1626" stroke-width="2"/><path d="M12 52 L38 28 M38 28 l-6 0 M38 28 l0 6" stroke="#e8edf5" stroke-width="2.5" fill="none"/>` + T(25, 76, p.props.vrms + 'V', 'psub') + (b ? smoke(22, 18) : '');
    },
  });

  /* ---------- PTC resettable fuse ---------- */
  D.PTCF = mk({
    prefix: 'F', name: ['Resettable fuse (PTC)', 'فيوز قابل للريسيت (PTC)'], w: 50, h: 80,
    info: ['Low resistance until the current passes its trip value, then it heats and its resistance jumps to kilohms. It stays tripped while power is applied and resets after the power is removed for a few seconds. Used on USB, sensor supplies and small boards.', 'مقاومته صغيرة لحد ما التيار يعدي قيمة الفصل، وبعدين بيسخن ومقاومته تقفز لكيلو أوم. بيفضل فاصل وهو متوصل وبيعمل ريسيت بعد ما تشيل الكهرباء كام ثانية. بيستخدم في USB وتغذية السنسورات والكروت الصغيرة.'],
    pins: [pin('A', 'A', 25, 0, 'u'), pin('B', 'B', 25, 80, 'd')],
    props: [{ k: 'hold', label: ['Hold current (A)', 'تيار التحمل (أمبير)'], t: 'sel', opts: [[0.1, '0.1 A'], [0.5, '0.5 A'], [1.1, '1.1 A'], [2.5, '2.5 A']], def: 0.5 }],
    faults: [F0, ['open', ['Open', 'مفتوح']], ['high', ['Degraded (high resistance)', 'متدهور (مقاومة عالية)']]],
    diag: { kind: 'protect', fuse: true, rating: (p) => +p.props.hold },
    init(p) { p.state = { trip: false, cool: 0 }; },
    elements(p) {
      if (p.fault === 'open') return [];
      const st = p.state, h = +p.props.hold;
      return [Z(P(p, 'A'), P(p, 'B'), st.trip ? 5000 : p.fault === 'high' ? 40 : Math.max(0.15, 0.4 / h), 0, { tag: 'r' })];
    },
    update(p, sim, dt) {
      const st = p.state, e = EL.eRead(sim, p.id, 'r'), i = Math.max(e.iac, Math.abs(e.idc)), h = +p.props.hold;
      st.amps = i;
      if (!st.trip && i > h * 2) { st.heat = (st.heat || 0) + dt * (i / h - 1); if (st.heat > 1) { st.trip = true; EL.emit('trip', p, 'PTC fuse tripped'); } } else if (!st.trip) st.heat = Math.max(0, (st.heat || 0) - dt);
      if (st.trip) { const v = Math.max(e.vac, Math.abs(e.vdc)); if (v < 0.6) { st.cool += dt; if (st.cool > 3) { st.trip = false; st.heat = 0; st.cool = 0; } } else st.cool = 0; }
    },
    draw(p) { const t = p.state.trip; return wl(25, 0, 25, 16) + wl(25, 64, 25, 80) + `<rect x="10" y="16" width="30" height="48" rx="4" fill="${t ? '#7a3b1a' : '#c9b060'}" stroke="#0e1626" stroke-width="2"/><path d="M16 56 L22 56 L22 28 L34 28" stroke="#222" stroke-width="2.5" fill="none"/>` + T(25, 76, p.props.hold + ' A', 'psub'); },
  });

  /* ---------- crystal ---------- */
  D.XTAL = mk({
    prefix: 'Y', name: ['Crystal / resonator', 'كريستال'], w: 70, h: 50,
    info: ['Sets the clock frequency of a microcontroller. For a DC meter it looks like an open circuit. A cracked or dead crystal makes the board dead or erratic: check the clock with an oscilloscope, not with a multimeter.', 'بيحدد تردد الكلوك للمعالج. للميتر DC شكله دايرة مفتوحة. كريستال مشروخ أو ميت بيخلي الكارت ميت أو غير منتظم: افحص الكلوك بأوسيلوسكوب مش بالملتيميتر.'],
    pins: [pin('A', 'A', 0, 25, 'l'), pin('B', 'B', 70, 25, 'r')],
    props: [{ k: 'f', label: ['Frequency', 'التردد'], t: 'sel', opts: [['32.768 kHz', '32.768 kHz'], ['4 MHz', '4 MHz'], ['8 MHz', '8 MHz'], ['12 MHz', '12 MHz'], ['16 MHz', '16 MHz'], ['25 MHz', '25 MHz']], def: '8 MHz' }],
    faults: [F0, ['dead', ['Cracked / not oscillating', 'مشروخ / مش بيدبدب']]],
    elements(p) { return [Z(P(p, 'A'), P(p, 'B'), 1e9, 0, { tag: 'x', noAC: false })]; },
    draw(p) { return wl(0, 25, 18, 25) + wl(52, 25, 70, 25) + `<rect x="18" y="12" width="34" height="26" rx="4" fill="${p.fault === 'dead' ? '#444' : '#b9c0cf'}" stroke="#0e1626" stroke-width="2"/><path d="M27 17 V33 M43 17 V33" stroke="#222" stroke-width="2.5"/><rect x="30" y="18" width="10" height="14" fill="#222" opacity=".55"/>` + T(35, 46, p.props.f, 'psub'); },
  });

  /* ---------- TVS diode ---------- */
  D.TVS = mk({
    prefix: 'DT', name: ['TVS diode (surge clamp)', 'TVS دايود (قص سبايك)'], w: 40, h: 80,
    info: ['Clamps spikes above its breakdown voltage to protect a rail or a data line. Fails shorted when the surge energy is too big. If a TVS across a supply reads a short, it did its job and must be replaced, and the cause of the surge looked for.', 'بيقص السبايك فوق جهد الانهيار عشان يحمي خط باور أو داتا. بيتعطل ماس لو طاقة السبايك أكبر منه. لو TVS على التغذية بيقرا ماس يبقى أدى دوره ولازم يتغير ويتدور على سبب السبايك.'],
    pins: [pin('A', 'A', 20, 0, 'u'), pin('K', 'K', 20, 80, 'd')],
    props: [{ k: 'vbr', label: ['Breakdown voltage (V)', 'جهد الانهيار (فولت)'], t: 'sel', opts: [[6.8, '6.8 V (5 V rail)'], [15, '15 V (12 V rail)'], [28, '28 V (24 V rail)'], [36, '36 V'], [58, '58 V']], def: 28 }, { k: 'dir', label: ['Type', 'النوع'], t: 'sel', opts: [['uni', 'Unidirectional'], ['bi', 'Bidirectional']], def: 'uni' }],
    faults: [F0, ['short', ['Failed shorted', 'اتعطل ماس']], ['open', ['Open', 'مفتوح']]],
    diag: { kind: 'diode', fail: 'short' },
    elements(p) {
      const st = p.state;
      if (st.burnt || p.fault === 'short') return [Z(P(p, 'A'), P(p, 'K'), 0.15, 0, { tag: 's' })];
      if (p.fault === 'open') return [];
      const v = +p.props.vbr, out = [{ kind: 'D', a: P(p, 'K'), b: P(p, 'A'), vf: v, rd: 1.5, tag: 'r' }];
      out.push(p.props.dir === 'bi' ? { kind: 'D', a: P(p, 'A'), b: P(p, 'K'), vf: v, rd: 1.5, tag: 'f' } : { kind: 'D', a: P(p, 'A'), b: P(p, 'K'), vf: 0.7, rd: 0.5, tag: 'f' });
      return out;
    },
    update(p, sim, dt) {
      const st = p.state; if (st.burnt || p.fault === 'short' || p.fault === 'open') return;
      const r = EL.eRead(sim, p.id, 'r'), pw = Math.abs(r.idc) * +p.props.vbr;
      st.pw = pw;
      if (pw > 20) { st.heat = (st.heat || 0) + dt; if (st.heat > 0.5) { st.burnt = true; EL.emit('burn', p, 'TVS failed shorted (clamping too much current)'); } } else st.heat = Math.max(0, (st.heat || 0) - dt);
    },
    draw(p) { const b = p.state.burnt || p.fault === 'short'; return wl(20, 0, 20, 24) + wl(20, 56, 20, 80) + `<path d="M8 24 H32 L20 56 Z" fill="${b ? '#2a1a12' : '#e8edf5'}" fill-opacity="${b ? 1 : 0.15}" stroke="#e8edf5" stroke-width="2"/><path d="M8 56 H32 M8 56 l-4 -5 M32 56 l4 5" stroke="#e8edf5" stroke-width="2.5" fill="none"/>` + (p.props.dir === 'bi' ? `<path d="M8 24 l-4 5 M32 24 l4 -5" stroke="#e8edf5" stroke-width="2.5" fill="none"/>` : '') + T(34, 44, p.props.vbr + 'V', 'psub', 'start') + (b ? smoke(24, 30) : ''); },
  });

  /* ---------- SCR (latches in DC) ---------- */
  D.SCR = mk({
    prefix: 'Q', name: ['Thyristor (SCR)', 'ثايرستور (SCR)'], w: 70, h: 90,
    info: ['A gate pulse (a few mA, gate positive against K) turns it ON and it stays on by itself while the anode current stays above the holding current (about 5 mA). Only removing the current (or reversing the anode) turns it off. This is a DC latching demo; on AC a real SCR turns off every half cycle and phase control is not simulated. Faults: shorted, open, no triggering.', 'نبضة على الجيت (كام ملي، الجيت موجب بالنسبة لـK) بتشغله وبيفضل شغال لوحده طول ما تيار الأنود فوق تيار الإمساك (حوالي 5 ملي). مفيش غير فصل التيار (أو عكس الأنود) يطفيه. ده عرض latching على DC؛ في AC الـSCR الحقيقي بيفصل كل نص موجة والتحكم بالطور مش متحاكى. الأعطال: ماس، مفتوح، مش بيتشغل.'],
    pins: [pin('A', 'A', 35, 0, 'u'), pin('K', 'K', 35, 90, 'd'), pin('G', 'G', 0, 60, 'l')],
    props: [{ k: 'amps', label: ['Current rating (A)', 'تيار التحمل (أمبير)'], t: 'sel', opts: [[1, '1 A'], [4, '4 A'], [8, '8 A'], [16, '16 A']], def: 4 }],
    faults: [F0, ['short', ['Shorted', 'ماس']], ['open', ['Open', 'مفتوح']], ['nogate', ['Gate dead (never triggers)', 'الجيت ميت (مش بيتشغل)']]],
    diag: { kind: 'passive', fail: 'short' }, electronic: true,
    init(p) { p.state = { on: false }; },
    elements(p) {
      const st = p.state;
      if (st.burnt || p.fault === 'short') return [Z(P(p, 'A'), P(p, 'K'), 0.3, 0, { tag: 's' })];
      const out = [{ kind: 'D', a: P(p, 'G'), b: P(p, 'K'), vf: 0.7, rd: 60, tag: 'g' }];
      if (p.fault === 'open') return out;
      out.push(st.on ? { kind: 'D', a: P(p, 'A'), b: P(p, 'K'), vf: 1.0, rd: 0.3, tag: 'a' } : Z(P(p, 'A'), P(p, 'K'), 1e8, 0, { tag: 'a0' }));
      return out;
    },
    update(p, sim, dt) {
      const st = p.state; if (st.burnt || p.fault === 'short' || p.fault === 'open') { st.on = p.fault === 'short'; return; }
      const gg = EL.eRead(sim, p.id, 'g'), a = EL.eRead(sim, p.id, st.on ? 'a' : 'a0'), vak = sim.vdc(P(p, 'A'), P(p, 'K'));
      st.ig = Math.abs(gg.idc); st.amps = Math.abs(a.idc);
      if (!st.on && p.fault !== 'nogate' && st.ig > 0.0015 && vak > 0.9) st.on = true;
      else if (st.on && (st.amps < 0.005 || vak < -0.3)) st.on = false;
      if (st.on && st.amps > +p.props.amps * 1.5) { st.hot = (st.hot || 0) + dt; if (st.hot > 1.5) { st.burnt = true; EL.emit('burn', p, 'SCR overcurrent'); } } else st.hot = Math.max(0, (st.hot || 0) - dt);
    },
    draw(p) { const st = p.state, on = st.on || p.fault === 'short'; return wl(35, 0, 35, 22) + wl(35, 68, 35, 90) + wl(0, 60, 24, 60) + `<circle cx="35" cy="45" r="24" fill="${on ? 'rgba(145,195,97,.2)' : 'none'}" stroke="${st.burnt ? '#F55B41' : '#e8edf5'}" stroke-width="2"/><path d="M23 30 H47 L35 52 Z" fill="${on ? '#91C361' : 'none'}" fill-opacity=".5" stroke="#e8edf5" stroke-width="2.5"/><path d="M23 54 H47 M35 54 L24 60" stroke="#e8edf5" stroke-width="2.5" fill="none"/>` + T(8, 54, 'G', 'psub') + (st.burnt ? smoke(36, 28) : ''); },
  });

  /* ---------- TRIAC (AC switch, no phase control) ---------- */
  D.TRIAC = mk({
    prefix: 'Q', name: ['Triac', 'ترياك (TRIAC)'], w: 70, h: 90,
    info: ['AC switch. A gate current (a few mA) turns it on, and it stays on while the load current is above the holding current. Used for heater and lamp control, often driven by an optocoupler triac. Here it conducts fully when triggered, phase control (dimming) is not simulated. Faults: shorted (always on), open, gate dead.', 'مفتاح AC. تيار الجيت (كام ملي) بيشغله وبيفضل شغال طول ما تيار الحمل فوق تيار الإمساك. بيستخدم للتحكم في السخانات واللمبات وغالبا بيتشغل من أوبتوكابلر ترياك. هنا بيوصل كامل لما يتشغل، التحكم بالطور (دمّر) مش متحاكى. الأعطال: ماس (دايما شغال)، مفتوح، جيت ميت.'],
    pins: [pin('MT2', 'MT2', 35, 0, 'u'), pin('MT1', 'MT1', 35, 90, 'd'), pin('G', 'G', 0, 60, 'l')],
    props: [{ k: 'amps', label: ['Current rating (A)', 'تيار التحمل (أمبير)'], t: 'sel', opts: [[1, '1 A'], [4, '4 A'], [8, '8 A'], [16, '16 A']], def: 8 }],
    faults: [F0, ['short', ['Shorted (always on)', 'ماس (دايما شغال)']], ['open', ['Open', 'مفتوح']], ['nogate', ['Gate dead (never triggers)', 'الجيت ميت (مش بيتشغل)']]],
    diag: { kind: 'passive', fail: 'short' }, electronic: true,
    init(p) { p.state = { on: false }; },
    elements(p) {
      const st = p.state, out = [Z(P(p, 'G'), P(p, 'MT1'), 90, 0, { tag: 'g' })];
      if (st.burnt || p.fault === 'short') return [Z(P(p, 'MT2'), P(p, 'MT1'), 0.3, 0, { tag: 's' })];
      if (p.fault === 'open') return out;
      out.push(Z(P(p, 'MT2'), P(p, 'MT1'), st.on ? 0.5 : 1e7, 0, { tag: 'm' }));
      return out;
    },
    update(p, sim, dt) {
      const st = p.state; if (st.burnt || p.fault === 'short' || p.fault === 'open') { st.on = p.fault === 'short'; return; }
      const gg = EL.eRead(sim, p.id, 'g'), m = EL.eRead(sim, p.id, 'm');
      st.ig = Math.max(gg.iac, Math.abs(gg.idc)); st.amps = Math.max(m.iac, Math.abs(m.idc));
      if (p.fault !== 'nogate' && st.ig > 0.003) st.on = true; else if (st.on && st.amps < 0.01) st.on = false;
      if (st.on && st.amps > +p.props.amps * 1.5) { st.hot = (st.hot || 0) + dt; if (st.hot > 1.5) { st.burnt = true; EL.emit('burn', p, 'triac overcurrent'); } } else st.hot = Math.max(0, (st.hot || 0) - dt);
    },
    draw(p) { const st = p.state, on = st.on || p.fault === 'short'; return wl(35, 0, 35, 22) + wl(35, 68, 35, 90) + wl(0, 60, 24, 60) + `<circle cx="35" cy="45" r="24" fill="${on ? 'rgba(145,195,97,.2)' : 'none'}" stroke="${st.burnt ? '#F55B41' : '#e8edf5'}" stroke-width="2"/><path d="M22 34 H48 M22 56 H48" stroke="#e8edf5" stroke-width="2.5"/><path d="M26 34 L35 50 L44 34 Z M26 56 L35 40 L44 56 Z" fill="${on ? '#91C361' : 'none'}" fill-opacity=".5" stroke="#e8edf5" stroke-width="2"/><path d="M24 60 L28 56" stroke="#e8edf5" stroke-width="2"/>` + T(8, 54, 'G', 'psub') + (st.burnt ? smoke(36, 28) : ''); },
  });
})(typeof window !== 'undefined' ? window : globalThis);
