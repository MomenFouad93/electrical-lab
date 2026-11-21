/* LOTO device details: a registry of shaded drawings (outside, inside, with lockout fitted) plus simple explanations.
   Each device: draw({inside, lock, on}) returns SVG for a 420 x 300 box; spots are numbered, tappable notes. */
(function (g) {
  const EL = g.EL, L = EL.lotoData, A = EL.lotoArt;
  if (!L || !A) return;
  const D = (EL.lotoDet = { list: [], map: {}, groups: [['elec', ['Electrical', 'كهرباء']], ['load', ['Machines and supply', 'ماكينات ومصادر']], ['fluid', ['Air and fluid', 'هوا وسوائل']], ['stored', ['Stored energy', 'طاقة مخزنة']], ['kit', ['LOTO kit', 'عدة اللوتو']]] });
  D.def = (o) => { D.list.push(o); D.map[o.id] = o; return o; };
  D.byType = {}; // isolation point type -> detail id (filled by def.ptype)
  const H = A.h, F = H.F, rr = H.rr, cc = H.cc, hl = H.hl, dk = H.dk, sc = H.screw;
  const tr2 = (en, ar) => EL.tr([en, ar]);
  const t = (x, y, s, sz, fill, an, w) => `<text x="${x}" y="${y}" font-size="${sz || 11}" font-weight="${w || 700}" fill="${fill || '#cfd8ea'}" text-anchor="${an || 'middle'}" font-family="system-ui,sans-serif">${s}</text>`;
  const pl = (d, c, w, extra) => `<path d="${d}" stroke="${c}" stroke-width="${w || 2}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}/>`;
  const ln = (x1, y1, x2, y2, c, w, extra) => pl(`M${x1} ${y1} L${x2} ${y2}`, c, w, extra);
  const wire = (d, col, w) => pl(d, '#0b0f19', (w || 5) + 2.4) + pl(d, col, w || 5);
  const W = { L1: '#b86a34', L2: '#8d95aa', L3: '#dfe4ef', N: '#3d7be0', PE: '#6fcf4a', DC: '#ff6b5e', C24: '#f6a623' };
  const ico = (key, x, y, s) => `<g transform="translate(${x},${y}) scale(${s})">${L.ICON[key] || ''}</g>`;
  const padlock = (x, y, s, c) => ico('padlock_' + (c || 'red'), x, y, s);
  const tag = (x, y, s) => ico('tag', x, y, s);
  const rect = (x, y, w, h, r, fill, extra) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r || 0}" fill="${fill}" ${extra || ''}/>`;
  const glow = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c || '#ff6b5e'}" opacity=".18"/>`;
  const lbl = (x, y, s, an) => t(x, y, s, 11, '#9fb0cf', an || 'middle', 600);
  const screwTop = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r || 7}" fill="${F('steel')}" stroke="#141a28" stroke-width="1.4"/><path d="M${x - (r || 7) * 0.6} ${y - (r || 7) * 0.3} L${x + (r || 7) * 0.6} ${y + (r || 7) * 0.3}" stroke="#141a28" stroke-width="1.6"/>`;
  const air = (x, y, w, c) => `<path d="M${x} ${y} h${w}" stroke="${c || '#ff6b5e'}" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  const arrow = (x1, y1, x2, y2, c) => { const a = Math.atan2(y2 - y1, x2 - x1), s = 7; return ln(x1, y1, x2, y2, c || '#7fd0ff', 2) + `<path d="M${x2} ${y2} l${-s * Math.cos(a - 0.45)} ${-s * Math.sin(a - 0.45)} M${x2} ${y2} l${-s * Math.cos(a + 0.45)} ${-s * Math.sin(a + 0.45)}" stroke="${c || '#7fd0ff'}" stroke-width="2" fill="none" stroke-linecap="round"/>`; };
  D.h = { tr2, t, pl, ln, wire, W, ico, padlock, tag, rect, glow, lbl, screwTop, air, arrow, rr, cc, hl, dk, sc, F };

  /* ================= 1. light switch ================= */
  D.def({
    id: 'wallsw', group: 'elec', cls: 'ctrl', icon: 'wallsw', ptype: 'wallsw', state: [['OFF', 'افصل'], ['ON', 'شغّل']],
    name: ['Light switch (single-phase lighting)', 'مفتاح إنارة (فاز واحد)'],
    simple: ['A wall switch breaks only the live wire of one lamp circuit. It is a control device, not an isolator: the wire is still live inside the box and on the supply side. For lighting work, switch off the lighting breaker and lock that. The red cover only stops people from switching a lamp on while you work on that one lamp.', 'مفتاح الحيط بيقطع سلك الفاز بتاع لمبة واحدة بس. ده جهاز تحكم مش عزل: السلك لسه عليه كهرباء جوه العلبة وناحية المصدر. في شغل الإنارة اقفل بريكر الإنارة وقفله هو. الغطاء الأحمر بس بيمنع حد يشغّل اللمبة وانت شغال عليها.'],
    feeds: ['Feeds: one lighting circuit, 230 V, single phase (L and N).', 'بيغذّي: دايرة إنارة 230 فولت فاز واحد (L وN).'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += rr(120, 14, 180, 272, 18, 'white') + rr(138, 32, 144, 236, 12, 'grey') + rr(152, 46, 116, 208, 10, 'white');
        s += rect(154, o.on ? 48 : 148, 112, 104, 9, '#fff', 'opacity=".7"') + pl('M156 150 h108', '#aab2c3', 2.2);
        s += `<rect x="154" y="${o.on ? 150 : 48}" width="112" height="104" rx="9" fill="#000" opacity=".07"/>`;
        s += t(210, 104, 'I', 26, '#8791a8') + t(210, 214, 'O', 26, '#8791a8');
        s += sc(210, 28, 5) + sc(210, 272, 5);
        if (o.lock) s += rr(106, 96, 208, 96, 14, 'red') + hl(110, 100, 200, 14, 7, 0.35) + dk(286, 144, 11) + padlock(272, 112, 1.1) + ln(120, 144, 262, 144, '#7d170f', 2, 'opacity=".5"') + tag(318, 142, 1.0);
      } else {
        s += rr(96, 16, 228, 268, 14, 'dark') + rect(108, 28, 204, 244, 8, '#0f1626');
        s += wire('M30 60 H140', W.L1, 7) + wire('M30 244 H140', W.L1, 7) + wire('M30 150 H100 V150', W.N, 6) + wire('M100 150 H390', W.N, 6);
        s += rr(132, 40, 52, 40, 4, 'brass') + rr(132, 220, 52, 40, 4, 'brass') + screwTop(158, 60, 8) + screwTop(158, 240, 8);
        s += wire('M184 60 H236 V92', W.L1, 7) + wire('M184 240 H236 V208', W.L1, 7);
        s += rr(224, 88, 24, 14, 3, 'copper') + rr(224, 198, 24, 14, 3, 'copper');
        if (o.on) s += `<path d="M236 96 V204" stroke="#141a28" stroke-width="13" stroke-linecap="round"/><path d="M236 96 V204" stroke="${F('copper', { h: 1 })}" stroke-width="9" stroke-linecap="round"/>`;
        else s += `<path d="M236 96 L204 190" stroke="#141a28" stroke-width="13" stroke-linecap="round"/><path d="M236 96 L204 190" stroke="${F('copper', { h: 1 })}" stroke-width="9" stroke-linecap="round"/>` + air(204, 204, 34) + `<circle cx="236" cy="96" r="5" fill="#141a28"/>`;
        s += pl('M262 110 q14 8 0 18 t0 18 t0 18', '#cfd5e3', 3) + rr(272, 80, 26, 140, 6, 'steel', 'opacity=".55"');
        if (!o.on) s += glow(222, 205, 18, '#4fc16a');
        s += t(210, 282, o.on ? tr2('ON: the blade bridges the gap', 'ON: الشفرة بتقفل الفجوة') : tr2('OFF: air gap', 'OFF: فجوة هوا'), 11, '#9fb0cf');
        if (o.lock) s += rr(272, 120, 40, 60, 6, 'red', 'opacity=".9"') + dk(292, 150, 6);
      }
      return s;
    },
    out: [[210, 100, 'Rocker', 'الروكر', 'The part you press. It only moves a small blade inside.', 'الجزء اللي بتضغط عليه. بيحرّك شفرة صغيرة جوه.'], [210, 28, 'Screws', 'المسامير', 'Hold the plate to the box. Behind them is live wiring even when the lamp is off.', 'بتثبت الغطا على العلبة. وراها أسلاك عليها كهرباء حتى لو اللمبة مطفية.']],
    in: [[158, 60, 'Live terminal', 'طرف الفاز الداخل', 'The brown wire is the live (phase) conductor coming from the breaker. It is live here whether the switch is on or off.', 'السلك البني هو الفاز جاي من البريكر. عليه كهرباء هنا سواء المفتاح شغال أو مطفي.'], [230, 130, 'Moving blade', 'الشفرة المتحركة', 'Closes or opens the gap between the two fixed contacts. A snap spring makes it move fast.', 'بتقفل أو بتفتح الفجوة بين الكونتاكتين. سوستة بتخليها تتحرك بسرعة.'], [222, 204, 'Air gap', 'الفجوة الهوائية', 'In OFF there is only a few millimetres of air. That is fine for a lamp, not enough for a safe isolation of a machine.', 'في وضع OFF فيه كام مللي هوا بس. كفاية للمبة مش كفاية لعزل ماكينة بأمان.'], [60, 150, 'Neutral passes by', 'النيوترال بيعدّي', 'The blue neutral is not switched. A lamp is not dead just because its switch is off.', 'النيوترال الأزرق مش بيتقطع. اللمبة مش ميتة لمجرد إن المفتاح مطفي.']],
    lock: [['Switch the lighting breaker OFF first. That is the real isolation.', 'اقفل بريكر الإنارة الأول. ده العزل الحقيقي.'], ['Fit the switch cover over the rocker (OFF position).', 'ركّب غطاء المفتاح على الروكر (وضع OFF).'], ['Add your padlock and tag so nobody switches the lamp on while you are in the fitting.', 'حط قفلك والتاج عشان محدش يشغّل اللمبة وانت في الكشاف.']],
    prove: [['Test the lamp terminals with a two-pole tester: L to N, L to earth, N to earth.', 'اختبر أطراف اللمبة بالتستر: L مع N، L مع الأرضي، N مع الأرضي.']],
    mistakes: [['Trusting the switch: the live wire is still in the box.', 'الاعتماد على المفتاح: سلك الفاز لسه في العلبة.'], ['Changing a lamp holder with the switch off but the breaker on.', 'تغيير ماسورة لمبة والمفتاح مطفي والبريكر شغال.']],
    std: ['IEC 60364-5-53: a switch for control is not a means of isolation for work.', 'IEC 60364-5-53: مفتاح التحكم مش وسيلة عزل للشغل.'],
  });

  /* ================= 2. plug and socket ================= */
  D.def({
    id: 'plug', group: 'elec', cls: 'iso', icon: 'plug', ptype: 'plug', state: [['Unplugged', 'مسحوبة'], ['Plugged in', 'متركبة']], stateLabel: ['Plug', 'الفيشة'],
    name: ['Plug and socket (single-phase 230 V)', 'فيشة وبريزة (230 فولت فاز واحد)'],
    simple: ['Pulling the plug is a real isolation: you can see the break. The danger is that someone plugs it back in. So the plug is covered with a plug lockout and your padlock, or it stays in your pocket. A cord machine can still hold charge in a capacitor for a few seconds.', 'سحب الفيشة عزل حقيقي: انت شايف الفصل بعينك. الخطر إن حد يرجّعها. عشان كده الفيشة بتتغطى بغطا لوتو وقفلك، أو بتفضل في جيبك. والماكينة اللي بفيشة ممكن تفضل شايلة شحنة في كباسيتور كام ثانية.'],
    feeds: ['Feeds: a cord-connected machine, 230 V, L + N + earth.', 'بيغذّي: ماكينة بفيشة 230 فولت L وN وأرضي.'],
    draw(o) {
      let s = rect(0, 0, 22, 300, 0, '#2a3248') + `<path d="M0 40 h22 M0 90 h22 M0 140 h22 M0 190 h22 M0 240 h22" stroke="#3a4560" stroke-width="2"/>`;
      const xb = o.on ? 100 : 182, tr = o.inside ? 0.28 : 1, pw = 124;
      s += `<path d="M${xb + pw} 150 q56 0 56 86" fill="none" stroke="#0b0f19" stroke-width="22" stroke-linecap="round"/><path d="M${xb + pw} 150 q56 0 56 86" fill="none" stroke="#3a3f4c" stroke-width="16" stroke-linecap="round"/>`;
      s += rr(xb - 58, 117, 60, 14, 3, 'brass') + rr(xb - 58, 177, 60, 14, 3, 'brass');
      s += `<g opacity="${tr}">${rr(xb, 72, pw, 156, 22, 'blue')}${hl(xb + 8, 78, pw - 16, 12, 6, 0.35)}</g>`;
      if (o.inside) {
        s += `<rect x="${xb}" y="72" width="${pw}" height="156" rx="22" fill="none" stroke="#7fb0ff" stroke-width="2"/>`;
        s += wire(`M${xb - 20} 124 H${xb + 56} V112 H${xb + pw + 10}`, W.L1, 7) + wire(`M${xb - 20} 184 H${xb + 56} V190 H${xb + pw + 10}`, W.N, 7) + wire(`M${xb + 10} 96 V152 H${xb + pw + 10}`, W.PE, 6);
        s += rr(xb + pw - 30, 96, 24, 100, 6, 'steel', 'opacity=".7"');
      } else s += t(xb + pw / 2, 164, '230 V', 22, '#fff', 'middle', 800);
      s += `<g opacity="${tr}">${rr(22, 56, 78, 188, 16, 'white')}${rr(32, 68, 58, 164, 10, 'grey')}</g>`;
      if (o.inside) {
        s += `<rect x="22" y="56" width="78" height="188" rx="16" fill="none" stroke="#cfd8ea" stroke-width="2"/>`;
        s += rr(36, 114, 62, 20, 5, 'brass') + rr(36, 174, 62, 20, 5, 'brass') + wire('M40 124 H0', W.L1, 7) + wire('M40 184 H0', W.N, 7) + wire('M56 70 V40 H0', W.PE, 6);
      } else s += rect(88, 114, 12, 20, 4, '#0b0f19') + rect(88, 174, 12, 20, 4, '#0b0f19') + sc(60, 66, 5) + sc(60, 234, 5);
      if (o.lock && !o.on) s += `<path d="M${xb - 8} 62 h${pw + 12} a22 22 0 0 1 22 22 v132 a22 22 0 0 1 -22 22 h-${pw + 12}z" fill="${F('red')}" stroke="#141a28" stroke-width="1.6" opacity="${o.inside ? 0.4 : 0.94}"/>` + hl(xb - 2, 68, pw, 10, 5, 0.35) + rr(xb + pw - 50, 228, 50, 36, 8, 'red') + dk(xb + pw - 25, 246, 6) + padlock(xb + pw - 34, 212, 1.15) + tag(xb - 4, 214, 0.85);
      if (!o.on) s += t(142, 34, tr2('Visible break', 'فصل مرئي'), 12, '#4fc16a') + arrow(142, 42, 142, 64, '#4fc16a');
      return s;
    },
    out: (o) => [[o.on ? 94 : 94, 124, 'Socket entry', 'مدخل البريزة', 'Shuttered slots over brass contacts. Live as long as the breaker feeding the socket is on.', 'فتحات بشتر فوق كونتاكتات نحاس. عليها كهرباء طول ما البريكر شغال.'], [(o.on ? 100 : 182) + 62, 100, 'Plug body', 'جسم الفيشة', 'Hold the plug, not the cable. After unplugging nothing on the pins is live.', 'امسك الفيشة مش الكابل. بعد السحب مفيش كهرباء على الرجلين.']],
    in: (o) => { const x = o.on ? 100 : 182; return [[x - 28, 124, 'Phase pin', 'رجل الفاز', 'One pin carries the phase, the other the neutral. A plug can be fitted either way round: never rely on which is which.', 'رجل بتحمل الفاز والتانية النيوترال. الفيشة ممكن تتركب بالعكس: متعتمدش على أنهي واحدة.'], [x - 28, 184, 'Neutral pin', 'رجل النيوترال', 'Also carries current. Treat it as live until proven dead.', 'كمان بتحمل تيار. اعتبرها عليها كهرباء لحد ما تثبت العكس.'], [x + 10, 100, 'Earth wire', 'سلك الأرضي', 'Earth (PE) is the safety path for the machine body. It connects first and leaves last.', 'الأرضي هو مسار الأمان لجسم الماكينة. بيوصل الأول ويفصل الآخر.'], [x + 112, 144, 'Cable clamp', 'مثبّت الكابل', 'Strain relief. A pulled cable that comes loose can bring a live wire to the outside.', 'بيمنع الشد. كابل اتشد وفك ممكن يوصّل سلك عليه كهرباء لبرا.']]; },
    lock: [['Switch the machine off normally, then pull the plug (hold the plug, not the cable).', 'وقّف الماكينة عادي وبعدين اسحب الفيشة (امسك الفيشة مش الكابل).'], ['Fit the plug lockout cover over the plug.', 'ركّب غطاء لوتو الفيشة.'], ['Add your padlock and tag. The key stays with you.', 'حط قفلك والتاج. المفتاح معاك.']],
    prove: [['Wait a few seconds for internal capacitors, then test the machine input: L to N, L to earth, N to earth.', 'استنى كام ثانية للكباسيتورات وبعدين اختبر دخل الماكينة: L مع N، L مع الأرضي، N مع الأرضي.']],
    mistakes: [['Leaving the plug unlocked on the floor: anyone can plug it back.', 'ترك الفيشة من غير قفل على الأرض: أي حد يرجّعها.'], ['Switching off at the machine and not unplugging.', 'الفصل من الماكينة من غير سحب الفيشة.']],
    std: ['A plug that you can see unplugged and keep under your control is accepted as isolation (OSHA 1910.147 note, IEC 60364).', 'الفيشة المسحوبة واللي بتتحكم فيها بتتقبل كعزل.'],
  });
})(typeof window !== 'undefined' ? window : globalThis);
