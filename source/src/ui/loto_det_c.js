/* LOTO device details, part C: valves, air and fluid, stored energy */
(function (g) {
  const EL = g.EL, L = EL.lotoData, DT = EL.lotoDet;
  if (!DT || !DT.h) return;
  const D = DT, { tr2, t, pl, ln, wire, W, ico, padlock, tag, rect, glow, lbl, screwTop, air, arrow, rr, cc, hl, dk, sc, F } = DT.h;
  const WATER = '#3d8fe0', AIR = '#9fd8ff';
  const flowArrows = (x1, x2, y, c) => [0, 1, 2].map((i) => arrow(x1 + (x2 - x1) * i / 3, y, x1 + (x2 - x1) * i / 3 + 22, y, c || '#7fd0ff')).join('');
  const flange = (x, y, h) => rr(x, y, 16, h, 3, 'dark');
  const pipeH = (x1, x2, y, h) => rr(x1, y, x2 - x1, h, 3, 'steel');
  const STATE_VALVE = [['Closed', 'مقفول'], ['Open', 'مفتوح']];
  const VBLOCK = ['The lockout device blocks the lever or wheel. The valve cannot be opened while the padlock is on.', 'جهاز اللوتو بيمنع الذراع أو العجلة. الفالف ميتفتحش وقفلك عليه.'];

  /* ================= ball valve ================= */
  D.def({
    id: 'ballvalve', group: 'fluid', cls: 'iso', icon: 'ballvalve', ptype: 'ballvalve', state: STATE_VALVE, block: VBLOCK,
    name: ['Ball valve (quarter turn lever)', 'بول فالف (ربع لفة بذراع)'],
    simple: ['Inside is a ball with a hole. Lever along the pipe: the hole lines up and water or air flows. Lever across the pipe: the solid side faces the flow and it stops. You see the position from the lever, which is why it is the favourite isolation valve. The lockout clamps the lever so it cannot turn. Pressure can still be trapped downstream: release it before work.', 'جوه الفالف كورة فيها فتحة. الذراع مع الماسورة: الفتحة معدّلة والمياه أو الهوا بيعدّي. الذراع عمودي: الجزء المصمت قدام السريان وبيقف. بتعرف الوضع من الذراع عشان كده هو أحب فالف للعزل. جهاز اللوتو بيمسك الذراع فمبيلفش. الضغط ممكن يفضل محبوس بعد الفالف: فرّغه قبل الشغل.'],
    feeds: ['Isolates: water, air, oil or gas lines.', 'بيعزل: خطوط مياه أو هوا أو زيت أو غاز.'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += pipeH(30, 390, 132, 44) + flange(60, 120, 68) + flange(344, 120, 68) + rr(156, 110, 108, 88, 22, 'steel') + cc(210, 154, 28, 'ball');
        s += rr(200, 80, 20, 36, 4, 'dark');
        if (o.on) s += `<rect x="40" y="62" width="210" height="22" rx="10" fill="${F('red', { h: 0 })}" stroke="#141a28" stroke-width="1.6"/><rect x="40" y="58" width="68" height="30" rx="10" fill="${F('red')}" stroke="#141a28" stroke-width="1.6"/>` + cc(210, 74, 9, 'steel');
        else s += `<rect x="198" y="2" width="24" height="84" rx="10" fill="${F('red', { h: 1 })}" stroke="#141a28" stroke-width="1.6"/><rect x="190" y="2" width="40" height="30" rx="10" fill="${F('red')}" stroke="#141a28" stroke-width="1.6"/>` + cc(210, 74, 9, 'steel');
        s += t(210, 232, o.on ? tr2('Lever along the pipe = OPEN', 'الذراع مع الماسورة = مفتوح') : tr2('Lever across the pipe = CLOSED', 'الذراع عمودي = مقفول'), 12, o.on ? '#7fd0ff' : '#4fc16a');
        if (o.lock) s += rr(160, 20, 44, 100, 8, 'red', {}) + rr(198, 108, 36, 60, 6, 'red') + dk(182, 44, 8) + padlock(236, 70, 1.0) + tag(290, 40, 0.9);
      } else {
        s += rect(30, 118, 360, 72, 0, '#0e1b33') + rect(30, 128, 360, 52, 0, '#14335f', 'opacity=".7"') + pl('M30 118 H390 M30 190 H390', '#8f99ae', 5);
        s += rr(150, 98, 120, 112, 24, 'steel', {}) + `<rect x="150" y="98" width="120" height="112" rx="24" fill="#26304a" opacity=".55"/>`;
        s += rr(176, 124, 12, 56, 3, 'white') + rr(232, 124, 12, 56, 3, 'white');
        s += `<circle cx="210" cy="154" r="46" fill="url(#lg_ball) #9aa3b5" stroke="#141a28" stroke-width="2"/>`;
        if (o.on) { s += rect(166, 138, 88, 32, 0, '#14335f') + flowArrows(46, 160, 154, AIR) + flowArrows(260, 380, 154, AIR) + pl('M166 138 H254 M166 170 H254', '#141a28', 3); }
        else s += rect(194, 110, 32, 88, 0, '#0e1b33') + pl('M194 110 V198 M226 110 V198', '#141a28', 3) + flowArrows(46, 150, 154, AIR) + `<g stroke="#ff6b5e" stroke-width="3"><path d="M160 130 v48"/></g>` + t(296, 154, tr2('no flow', 'مفيش سريان'), 12, '#ff9a8c');
        s += rr(200, 60, 20, 60, 3, 'dark') + cc(210, 60, 9, 'steel') + rect(184, 52, 52, 10, 3, '#f6cf3a', 'stroke="#141a28"');
        s += t(210, 244, tr2('Pressure upstream, maybe trapped downstream', 'ضغط قبل الفالف، وممكن محبوس بعده'), 10, '#9fb0cf');
      }
      return s;
    },
    out: (o) => [[210, o.on ? 74 : 20, 'Lever', 'الذراع', 'Shows the position: along the pipe is open, across is closed. The lockout clamps it.', 'بيوري الوضع: مع الماسورة مفتوح، عرضي مقفول. جهاز اللوتو بيمسكه.'], [210, 154, 'Valve body', 'جسم الفالف', 'The ball sits inside. Rated for a pressure: check the marking.', 'الكورة جوه. متصنف لضغط معين: شوف المكتوب عليه.'], [76, 154, 'Flanged pipe', 'ماسورة بفلنشة', 'Pressure can sit on both sides of a closed valve.', 'الضغط ممكن يكون على الناحيتين لما الفالف يتقفل.']],
    in: (o) => [[210, 154, 'Ball with bore', 'الكورة بفتحة', o.on ? 'The hole lines up with the pipe: full flow.' : 'The solid side blocks the pipe.', o.on ? 'الفتحة معدّلة على الماسورة: سريان كامل.' : 'الجزء المصمت بيسد الماسورة.'], [182, 130, 'Seat', 'الجلبة', 'Soft seats (PTFE) seal the ball. A worn seat leaks even when closed.', 'جلب ناعمة (PTFE) بتأمّن الكورة. جلبة بالية بتسرّب حتى والفالف مقفول.'], [210, 60, 'Stem', 'الساق', 'Turns the ball 90 degrees. Packing around it keeps the fluid in.', 'بتلف الكورة 90 درجة. الحشو حواليها بيمنع التسريب.'], [356, 154, 'Downstream side', 'ناحية ما بعد الفالف', 'Trapped pressure here must be vented before the pipe is opened.', 'الضغط المحبوس هنا لازم يتفرّغ قبل فتح الماسورة.']],
    lock: [['Close the valve (lever across the pipe).', 'اقفل الفالف (الذراع عرضي).'], ['Fit the ball valve lockout over the lever and pipe.', 'ركّب لوتو البول فالف على الذراع والماسورة.'], ['Add padlock and tag, then bleed the downstream pressure.', 'حط القفل والتاج وبعدين فرّغ الضغط اللي بعد الفالف.']],
    prove: [['Open the bleed valve or read the gauge: it must show 0 bar and stay at 0.', 'افتح فالف التفريغ أو اقرا العداد: لازم 0 بار ويفضل 0.']],
    mistakes: [['Closing the valve but leaving it unlocked.', 'قفل الفالف من غير قفل لوتو.'], ['Opening the line without bleeding the trapped pressure.', 'فتح الخط من غير تفريغ الضغط المحبوس.']],
    std: ['ISO 5211 / the site LOTO procedure. Always verify zero pressure.', 'ISO 5211 / إجراء اللوتو في الموقع. اتأكد دايمًا من الضغط صفر.'],
  });

  /* ================= gate valve ================= */
  D.def({
    id: 'gatevalve', group: 'fluid', cls: 'iso', icon: 'gatevalve', ptype: 'gatevalve', state: STATE_VALVE, block: VBLOCK,
    name: ['Gate / globe valve (handwheel)', 'جيت فالف (عجلة)'],
    simple: ['You turn a wheel many times and a wedge slides across the pipe. A rising stem shows the position: stem up is open, stem down is closed. The wheel is easy to turn with a wrench, so the lockout must trap the wheel. Count the turns and do not trust a valve that turns too freely: the wedge may be loose or broken.', 'بتلف عجلة لفات كتير ووتد بيتحرك قدام الماسورة. الساق الطالعة بتوري الوضع: فوق مفتوح وتحت مقفول. العجلة سهل تتلف بمفتاح فلازم غطا اللوتو يحبسها. عدّ اللفات ومتثقش في فالف بيلف بسهولة زيادة: الوتد ممكن يكون مفكوك أو مكسور.'],
    feeds: ['Isolates: water, steam, oil lines.', 'بيعزل: خطوط مياه وبخار وزيت.'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += pipeH(30, 390, 200, 40) + flange(66, 188, 64) + flange(338, 188, 64) + rr(166, 160, 88, 96, 10, 'brass') + rr(180, 100, 60, 64, 6, 'steel');
        const sy = o.on ? 8 : 60;
        s += rr(204, sy + 30, 12, 80, 2, 'steel') + `<ellipse cx="210" cy="${sy + 22}" rx="68" ry="16" fill="${F('blue')}" stroke="#141a28" stroke-width="1.6"/><path d="M146 ${sy + 22} q64 -22 128 0" fill="none" stroke="#fff" opacity=".4" stroke-width="2"/><ellipse cx="210" cy="${sy + 22}" rx="10" ry="4" fill="#143572"/>`;
        s += t(210, 280, o.on ? tr2('Stem up = OPEN', 'الساق فوق = مفتوح') : tr2('Stem down = CLOSED', 'الساق تحت = مقفول'), 12, o.on ? '#7fd0ff' : '#4fc16a');
        if (o.lock) s += `<ellipse cx="210" cy="${(o.on ? 8 : 60) + 22}" rx="80" ry="26" fill="${F('red')}" stroke="#141a28" stroke-width="1.6" opacity=".95"/>` + hl(150, (o.on ? 8 : 60) + 8, 120, 8, 4, 0.4) + rr(268, (o.on ? 8 : 60) + 22, 40, 24, 6, 'red') + dk(288, (o.on ? 8 : 60) + 34, 6) + padlock(268, (o.on ? 8 : 60) + 36, 1.0) + tag(120, (o.on ? 8 : 60) + 50, 0.8);
      } else {
        s += rect(30, 190, 360, 56, 0, '#0e1b33') + rect(30, 198, 360, 40, 0, '#14335f', 'opacity=".7"') + pl('M30 190 H390 M30 246 H390', '#8f99ae', 5);
        s += rr(150, 130, 120, 126, 14, 'brass', {}) + `<rect x="150" y="130" width="120" height="126" rx="14" fill="#26304a" opacity=".55"/>`;
        const gy = o.on ? 110 : 190;
        s += rr(176, gy, 68, 62, 4, 'steel') + `<path d="M176 ${gy + 14} L244 ${gy + 14}" stroke="#141a28"/>`;
        s += rr(204, 20, 12, gy - 14, 2, 'steel') + [0, 1, 2, 3, 4, 5].map((i) => `<path d="M202 ${30 + i * 12} h16" stroke="#586178" stroke-width="2"/>`).join('');
        s += `<ellipse cx="210" cy="20" rx="56" ry="13" fill="${F('blue')}" stroke="#141a28" stroke-width="1.6"/>`;
        if (o.on) s += flowArrows(40, 150, 218, AIR) + flowArrows(270, 380, 218, AIR); else s += flowArrows(40, 140, 218, AIR) + t(320, 222, tr2('no flow', 'مفيش سريان'), 12, '#ff9a8c') + `<path d="M160 196 v44" stroke="#ff6b5e" stroke-width="3"/>`;
      }
      return s;
    },
    out: (o) => [[210, (o.on ? 8 : 60) + 22, 'Handwheel', 'العجلة', 'Turn clockwise to close. The lockout cover traps it.', 'لف مع عقارب الساعة للقفل. غطا اللوتو بيحبسها.'], [210, o.on ? 70 : 150, 'Rising stem', 'الساق الطالعة', o.on ? 'Visible stem: valve open.' : 'Stem hidden: valve closed.', o.on ? 'الساق باينة: الفالف مفتوح.' : 'الساق مستخبية: الفالف مقفول.'], [210, 205, 'Body', 'الجسم', 'Pressure rating and flow arrow are cast on it.', 'الضغط المسموح وسهم السريان مطبوعين عليه.']],
    in: (o) => [[210, o.on ? 140 : 220, 'Wedge (gate)', 'الوتد', 'Slides across the pipe. A loose or broken wedge leaves the valve apparently closed but leaking.', 'بيتحرك قدام الماسورة. وتد مفكوك أو مكسور بيخلي الفالف شكله مقفول وبيسرّب.'], [210, 60, 'Threaded stem', 'الساق المسننة', 'Many turns move the wedge a little: slow and precise.', 'لفات كتير بتحرك الوتد شوية: بطيء ودقيق.'], [162, 244, 'Seat', 'الجلبة', 'The wedge seals against the seat rings.', 'الوتد بيقفل على حلقات الجلبة.'], [210, 20, 'Wheel', 'العجلة', 'Hand force only. Do not use a wrench on the lockout cover.', 'بالإيد بس. متستخدمش مفتاح على غطا اللوتو.']],
    lock: [['Close the valve fully by hand (count the turns).', 'اقفل الفالف تمام بإيدك (عدّ اللفات).'], ['Fit the wheel cover over the handwheel.', 'ركّب غطا العجلة.'], ['Add padlock and tag, then bleed the line.', 'حط القفل والتاج وبعدين فرّغ الخط.']],
    prove: [['Check the gauge or open the bleed point: pressure must be zero and stay zero.', 'شوف العداد أو افتح نقطة التفريغ: الضغط لازم يبقى صفر ويفضل صفر.']],
    mistakes: [['Trusting a valve that turns without resistance.', 'الثقة في فالف بيلف من غير مقاومة.'], ['Locking a valve that is only partly closed.', 'قفل فالف مقفول جزئيًا.']],
    std: ['A single valve may leak: for hazardous fluids use double block and bleed.', 'فالف واحد ممكن يسرّب: للسوائل الخطرة استخدم double block and bleed.'],
  });

  /* ================= butterfly valve ================= */
  D.def({
    id: 'butterfly', group: 'fluid', cls: 'iso', icon: 'butterfly', ptype: 'butterfly', state: STATE_VALVE, block: VBLOCK,
    name: ['Butterfly valve (lever with notch plate)', 'باترفلاي فالف (ذراع بلوح تثبيت)'],
    simple: ['A disc on a stem turns a quarter turn inside the pipe. The lever is held in notches on a plate: parallel to the pipe is open, across is closed. The lockout plate fits in a notch and takes a padlock. A rubber liner makes the seal, so check it for wear.', 'قرص على ساق بيلف ربع لفة جوه الماسورة. الذراع بيتثبت في فتحات على لوح: مع الماسورة مفتوح وعرضي مقفول. لوح اللوتو بيدخل في فتحة وبياخد قفل. البطانة المطاط هي اللي بتأمّن فشوف إنها سليمة.'],
    feeds: ['Isolates: large water and air lines.', 'بيعزل: خطوط مياه وهوا كبيرة.'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += pipeH(30, 390, 150, 60) + flange(76, 134, 92) + flange(328, 134, 92) + rr(178, 116, 64, 128, 14, 'blue') + rr(200, 76, 20, 44, 3, 'steel');
        s += rr(150, 98, 120, 24, 8, 'black') + (o.on ? '' : '');
        const lx = o.on ? 90 : 190;
        s += o.on ? `<rect x="80" y="62" width="200" height="22" rx="10" fill="${F('black', { h: 0 })}" stroke="#141a28" stroke-width="1.6"/><rect x="80" y="58" width="60" height="30" rx="10" fill="${F('black')}" stroke="#141a28"/>` : `<rect x="198" y="6" width="24" height="84" rx="10" fill="${F('black', { h: 1 })}" stroke="#141a28" stroke-width="1.6"/><rect x="190" y="6" width="40" height="30" rx="10" fill="${F('black')}" stroke="#141a28"/>`;
        s += rr(236, 84, 60, 24, 4, 'steel') + [250, 266, 282].map((x) => dk(x, 96, 3.5)).join('');
        s += t(210, 270, o.on ? tr2('Lever along the pipe = OPEN', 'الذراع مع الماسورة = مفتوح') : tr2('Lever across the pipe = CLOSED', 'الذراع عرضي = مقفول'), 12, o.on ? '#7fd0ff' : '#4fc16a');
        if (o.lock) s += rr(236, 78, 66, 36, 6, 'red') + dk(284, 96, 6) + padlock(262, 108, 1.0) + tag(318, 130, 0.8);
      } else {
        s += rect(30, 140, 360, 72, 0, '#0e1b33') + rect(30, 150, 360, 52, 0, '#14335f', 'opacity=".7"') + pl('M30 140 H390 M30 212 H390', '#8f99ae', 5);
        s += rr(186, 128, 48, 96, 8, 'blue', {}) + `<rect x="186" y="128" width="48" height="96" rx="8" fill="#26304a" opacity=".6"/>`;
        s += o.on ? `<ellipse cx="210" cy="176" rx="4" ry="44" fill="${F('ball')}" stroke="#141a28" stroke-width="1.6"/>` + flowArrows(40, 160, 176, AIR) + flowArrows(260, 380, 176, AIR) : `<rect x="205" y="132" width="10" height="88" rx="3" fill="${F('ball', { h: 1 })}" stroke="#141a28" stroke-width="1.6"/>` + flowArrows(40, 150, 176, AIR) + t(310, 180, tr2('no flow', 'مفيش سريان'), 12, '#ff9a8c');
        s += rr(200, 70, 20, 62, 3, 'steel') + cc(210, 176, 9, 'steel');
        s += t(210, 250, tr2('Rubber liner seals against the disc', 'البطانة المطاط بتأمّن على القرص'), 11, '#9fb0cf');
      }
      return s;
    },
    out: (o) => [[o.on ? 100 : 210, o.on ? 74 : 20, 'Lever', 'الذراع', 'Held in a notch. Parallel to the pipe = open.', 'متثبت في فتحة. مع الماسورة = مفتوح.'], [266, 96, 'Notch plate', 'لوح الفتحات', 'The lockout plate goes through the closed notch and takes a padlock.', 'لوح اللوتو بيدخل في فتحة القفل وبياخد القفل.'], [210, 190, 'Wafer body', 'الجسم الرقيق', 'Sits between two pipe flanges. Bolts hold the whole stack.', 'بيتحط بين فلنشتين. المسامير بتمسك الكل.']],
    in: (o) => [[210, 176, 'Disc', 'القرص', o.on ? 'Edge on to the flow: low resistance.' : 'Face on to the flow: blocks it.', o.on ? 'الحرف قدام السريان: مقاومة قليلة.' : 'الوش قدام السريان: بيسده.'], [210, 100, 'Stem', 'الساق', 'Turns the disc 90 degrees.', 'بتلف القرص 90 درجة.'], [190, 214, 'Liner', 'البطانة', 'Rubber seat. A damaged liner leaks when closed.', 'مطاط الأمان. بطانة تالفة بتسرّب والفالف مقفول.']],
    lock: [['Close the valve (lever across the pipe) and let it seat in the closed notch.', 'اقفل الفالف (الذراع عرضي) وخليه يقعد في فتحة القفل.'], ['Fit the butterfly lockout plate.', 'ركّب لوح لوتو الباترفلاي.'], ['Add padlock and tag. Bleed the pressure.', 'حط القفل والتاج. فرّغ الضغط.']],
    prove: [['Gauge to zero, drain open, no flow.', 'العداد صفر والدرين مفتوح ومفيش سريان.']],
    mistakes: [['Leaving the lever in the open notch and locking it.', 'ترك الذراع في فتحة الفتح وقفلها.']],
    std: ['API 609 / the site LOTO procedure.', 'API 609 / إجراء اللوتو في الموقع.'],
  });

  /* ================= quick air coupling ================= */
  D.def({
    id: 'qdc', group: 'fluid', cls: 'iso', icon: 'qdc', ptype: 'qdc', state: [['Disconnected', 'مفصول'], ['Connected', 'متوصل']], stateLabel: ['Coupling', 'الوصلة'], block: ['You cannot lock a coupling that is joined. Disconnect it first, then fit the lockout cap.', 'مينفعش تقفل وصلة متوصلة. افصلها الأول وبعدين ركّب الغطا.'],
    name: ['Quick-disconnect air coupling', 'وصلة هوا سريعة'],
    simple: ['A push-fit pair for compressed air. Pull the sleeve and the plug comes out. On a good coupling the supply side shuts automatically, but the machine side keeps its pressure until you vent it. The lockout cap covers the socket so the plug cannot go back in.', 'وصلة بتتركب بالدفع للهوا المضغوط. اسحب الكم والفيشة بتطلع. في الوصلة الكويسة ناحية المصدر بتقفل لوحدها، بس ناحية الماكينة بتفضل فيها ضغط لحد ما تفرّغه. غطا اللوتو بيغطي السوكت فالفيشة متدخلش تاني.'],
    feeds: ['Isolates: compressed air to a tool or machine.', 'بيعزل: الهوا المضغوط لأداة أو ماكينة.'],
    draw(o) {
      let s = '';
      const gap = o.on ? 0 : 70;
      s += rr(8, 130, 74, 38, 6, 'blue');
      s += rr(80, 112, 100, 74, 10, 'brass') + `<path d="M96 116 v66 M110 116 v66 M124 116 v66" stroke="#6e4d0e" stroke-width="2" opacity=".6"/>` + rr(150, 124, 50, 50, 8, 'steel');
      s += `<g transform="translate(${gap},0)">${rr(196, 132, 56, 34, 6, 'steel')}${rr(250, 138, 50, 22, 4, 'steel')}${rr(296, 130, 56, 38, 6, 'blue')}</g>`;
      if (!o.on) s += t(150, 92, tr2('Supply side', 'ناحية المصدر'), 11, '#9fb0cf') + t(330, 92, tr2('Machine side', 'ناحية الماكينة'), 11, '#9fb0cf') + t(330, 220, tr2('Vent the machine side', 'فرّغ ناحية الماكينة'), 11, '#ffd27a') + arrow(330, 190, 330, 206, '#ffd27a');
      if (o.lock && !o.on) s += rr(150, 98, 70, 104, 10, 'red') + hl(154, 102, 62, 9, 4, 0.4) + dk(185, 150, 8) + padlock(172, 168, 1.0) + tag(100, 190, 0.8);
      return s;
    },
    hasInside: false,
    out: (o) => [[130, 112, 'Socket with sleeve', 'السوكت بالكم', 'Pull back the sleeve to release the plug.', 'اسحب الكم عشان تفك الفيشة.'], [(o.on ? 200 : 270) + 40, 150, 'Plug', 'الفيشة', 'Fits into the socket. The machine side still holds air if the hose is closed.', 'بتدخل في السوكت. ناحية الماكينة بتفضل فيها هوا لو الخرطوم مقفول.'], [40, 150, 'Supply hose', 'خرطوم المصدر', 'Live as long as the plant air is on.', 'شغال طول ما هوا المصنع شغال.']],
    lock: [['Switch the machine off, then close the main air valve if possible.', 'وقّف الماكينة وبعدين اقفل فالف الهوا الرئيسي لو أمكن.'], ['Pull the sleeve and disconnect the coupling.', 'اسحب الكم وافصل الوصلة.'], ['Vent the machine side, fit the lockout cap, add padlock and tag.', 'فرّغ ناحية الماكينة وركّب الغطا وحط القفل والتاج.']],
    prove: [['Gauge on the machine side reads 0 bar, no hiss from the bleed valve.', 'عداد ناحية الماكينة 0 بار ومفيش صفير من فالف التفريغ.']],
    mistakes: [['Disconnecting and leaving the plug hanging on the hose with no lock.', 'فصل الوصلة وترك الفيشة متدلية من غير قفل.']],
    std: ['A coupling with the plug out is a break you can see; add a lock so it cannot be reconnected.', 'وصلة مفصولة هي فصل مرئي؛ حط قفل عشان محدش يوصلها.'],
  });

  /* ================= FRL unit ================= */
  D.def({
    id: 'frl', group: 'fluid', cls: 'iso', icon: 'frl', ptype: null, state: [['Closed and vented', 'مقفول ومفرّغ'], ['Open', 'مفتوح']], block: VBLOCK,
    name: ['Air service unit with lockable dump valve (FRL)', 'وحدة هوا (فلتر وريجيلاتر) بفالف تفريغ بيتقفل'],
    simple: ['The filter, regulator and lubricator that sit in front of a machine. Many have a slide valve with a padlock hole. Slid shut, it cuts the supply AND opens the downstream to the atmosphere, so the machine air is vented in one move. That is the best isolation for compressed air at a machine.', 'الفلتر والريجيلاتر واللوبريكيتور اللي قدام الماكينة. كتير منهم فيه فالف سحب بفتحة قفل. لما يتقفل بيقطع المصدر وبيفتح ناحية الماكينة للجو، فالهوا بيتفرّغ في حركة واحدة. ده أحسن عزل للهوا المضغوط عند الماكينة.'],
    feeds: ['Isolates: compressed air to a machine, and vents it.', 'بيعزل: الهوا المضغوط للماكينة وبيفرّغه.'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += rr(8, 134, 34, 44, 6, 'blue') + rr(374, 134, 38, 44, 6, 'blue');
        const kx = o.on ? 44 : 10;
        s += rr(52, 96, 46, 124, 6, 'steel') + rr(kx, 146, 52, 24, 5, 'red') + hl(kx + 3, 149, 46, 5, 3, 0.4) + `<circle cx="${kx + 12}" cy="158" r="5" fill="#141a28"/>`;
        s += rr(104, 90, 78, 140, 8, 'blue') + rr(116, 150, 54, 70, 8, 'cream') + t(143, 134, 'F', 22, '#fff', 'middle', 800);
        s += rr(188, 90, 78, 140, 8, 'steel') + cc(227, 66, 28, 'white') + `<path d="M227 66 L242 50" stroke="#c0281d" stroke-width="3"/><circle cx="227" cy="66" r="3" fill="#141a28"/>` + rr(208, 112, 38, 30, 6, 'black') + t(227, 180, 'R', 22, '#273049', 'middle', 800);
        s += rr(272, 90, 78, 140, 8, 'orange') + rr(284, 150, 54, 70, 8, 'cream') + t(311, 134, 'L', 22, '#fff', 'middle', 800);
        s += rr(350, 142, 24, 28, 4, 'steel');
        s += t(210, 262, o.on ? tr2('Knob pushed in: air flows', 'الزرار مدفوع: الهوا ماشي') : tr2('Knob pulled out: air cut and machine side vented', 'الزرار مسحوب: المصدر اتقطع وناحية الماكينة اتفرّغت'), 11, o.on ? '#9fb0cf' : '#4fc16a');
        if (o.lock && !o.on) s += padlock(2, 166, 1.0) + tag(10, 70, 0.8);
      } else {
        s += rr(30, 70, 360, 150, 14, 'dark', {}) + `<rect x="30" y="70" width="360" height="150" rx="14" fill="#26304a" stroke="#8b94a8" stroke-width="2" opacity=".6"/>`;
        s += rect(40, 128, 84, 34, 4, '#14335f') + t(82, 150, tr2('IN 6 bar', 'دخل 6 بار'), 12, '#fff') + rect(296, 128, 84, 34, 4, '#14335f') + t(338, 150, tr2('OUT', 'خرج'), 12, '#fff');
        s += rect(124, 112, 172, 66, 4, '#0e1b33') + rect(204, 178, 12, 36, 0, '#0e1b33') + t(210, 232, tr2('EXH (exhaust)', 'EXH (العادم)'), 10, '#ffd27a');
        s += o.on ? rect(160, 118, 40, 54, 4, '#cfd5e3', 'stroke="#141a28"') + flowArrows(50, 124, 145, AIR) + flowArrows(214, 296, 145, AIR) : rect(236, 118, 40, 54, 4, '#cfd5e3', 'stroke="#141a28"') + arrow(210, 170, 210, 208, '#ffd27a') + t(210, 100, tr2('Supply blocked, machine side vents', 'المصدر مسدود وناحية الماكينة بتتفرّغ'), 11, '#ff9a8c');
      }
      return s;
    },
    out: (o) => [[o.on ? 70 : 36, 158, 'Lockable slide valve', 'فالف السحب القابل للقفل', 'Push in to open, pull out to shut and vent. The hole takes a padlock.', 'ادفعه للفتح واسحبه للقفل والتفريغ. الفتحة بتاخد قفل.'], [227, 66, 'Pressure gauge', 'عداد الضغط', 'Reads the machine side pressure. It must fall to 0.', 'بيقرا ضغط ناحية الماكينة. لازم ينزل لـ0.'], [143, 196, 'Filter bowl', 'كاس الفلتر', 'Drains water and dirt. Depressurise before removing the bowl.', 'بيطلّع المياه والوسخ. فرّغ الضغط قبل ما تفك الكاس.'], [311, 196, 'Lubricator', 'اللوبريكيتور', 'Adds a mist of oil for pneumatic tools.', 'بيضيف رذاذ زيت للأدوات النيوماتيك.']],
    in: (o) => [[o.on ? 180 : 256, 124, 'Slide valve spool', 'سحاب الفالف', 'Shut: the supply is blocked and the machine side connects to the exhaust.', 'مقفول: المصدر مسدود وناحية الماكينة موصلة بالعادم.'], [210, 196, 'Exhaust port', 'فتحة العادم', 'The trapped air leaves here. You hear a hiss that stops.', 'الهوا المحبوس بيخرج من هنا. بتسمع صفير وبيوقف.'], [60, 118, 'Supply', 'المصدر', 'Always full of pressure upstream of the valve.', 'دايمًا فيه ضغط قبل الفالف.']],
    lock: [['Slide the valve shut. The machine side vents with a hiss.', 'اقفل بالسحب. ناحية الماكينة بتتفرّغ بصفير.'], ['Pass your padlock through the hole in the valve.', 'دخّل قفلك في الفتحة.'], ['Add a tag and read the gauge: 0 bar.', 'حط تاج واقرا العداد: 0 بار.']],
    prove: [['Gauge reads 0. Try pushing a tool trigger: nothing moves.', 'العداد 0. جرّب تدوس زناد الأداة: مفيش حركة.']],
    mistakes: [['Locking a valve that has no exhaust and leaving air trapped.', 'قفل فالف من غير عادم وترك الهوا محبوس.']],
    std: ['ISO 4414 / ISO 14118: vent stored pneumatic energy.', 'ISO 4414 / ISO 14118: فرّغ الطاقة النيوماتيك المخزنة.'],
  });

  /* ================= air receiver ================= */
  const gauge = (cx, cy, r, v, max, unit, under) => {
    const a = (-135 + 270 * Math.min(1, v / max)) * Math.PI / 180;
    let ticks = ''; for (let i = 0; i <= 8; i++) { const b = (-135 + 270 * i / 8) * Math.PI / 180; ticks += `<path d="M${cx + (r - 9) * Math.sin(b)} ${cy - (r - 9) * Math.cos(b)} L${cx + (r - 3) * Math.sin(b)} ${cy - (r - 3) * Math.cos(b)}" stroke="#273049" stroke-width="2"/>`; }
    const na = (-135 + 270 * Math.min(1, v / max)) * Math.PI / 180;
    return `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="${F('steel')}" stroke="#141a28" stroke-width="1.4"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#f4f6fb" stroke="#141a28"/>${ticks}<path d="M${cx} ${cy} L${cx + (r - 8) * Math.sin(na)} ${cy - (r - 8) * Math.cos(na)}" stroke="#c0281d" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="3.4" fill="#141a28"/><text x="${cx}" y="${under ? cy + r + 18 : cy + r * 0.62}" font-size="${under ? 11 : Math.max(8, r * 0.34)}" font-weight="800" fill="${under ? '#cfd8ec' : '#273049'}" text-anchor="middle" font-family="system-ui">${v} ${unit}</text>`;
  };
  D.gauge = gauge;
  D.def({
    id: 'receiver', group: 'stored', cls: 'stored', icon: 'tank', lockable: true, defLock: false, state: [['Vented (0 bar)', 'مفرّغ (0 بار)'], ['Pressurised (6 bar)', 'تحت ضغط (6 بار)']], stateLabel: ['Tank', 'الخزان'], block: ['The inlet valve is locked closed and the drain is open: the tank cannot be pressurised.', 'فالف الدخل مقفول بالقفل والدرين مفتوح: الخزان مينفعش يتضغط.'],
    name: ['Air receiver (pressure vessel)', 'خزان هوا (وعاء ضغط)'],
    simple: ['A tank full of compressed air stays dangerous long after the compressor stops. Isolate the inlet valve and lock it, open the drain and the bleed, and wait until the gauge reads zero. A closed drain with a blocked outlet still holds pressure, so open it fully and leave it open while you work.', 'خزان مليان هوا مضغوط بيفضل خطر بعد ما الكباس يقف بوقت طويل. اعزل فالف الدخل واقفله، افتح الدرين والتفريغ، واستنى لحد ما العداد يقرا صفر. درين مقفول مع طلعة مسدودة بيفضل فيه ضغط، فافتحه كامل وسيبه مفتوح وانت شغال.'],
    feeds: ['Stores: compressed air for tools and cylinders.', 'بيخزّن: هوا مضغوط للأدوات والسلندرات.'],
    draw(o) {
      let s = '';
      const bar = o.on ? 6 : 0;
      s += rr(130, 60, 160, 200, 40, 'blue') + hl(142, 72, 10, 160, 5, 0.35) + rr(176, 258, 20, 14, 2, 'steel') + rr(224, 258, 20, 14, 2, 'steel') + rect(110, 266, 200, 10, 3, '#2a3248');
      s += rr(194, 36, 32, 28, 4, 'steel') + gauge(210, 26, 18, bar, 10, 'bar');
      if (!o.inside) {
        s += rr(290, 100, 56, 22, 4, 'steel') + (o.lock ? '' : '') + rr(340, 96, 26, 30, 4, 'steel');
        s += rr(40, 118, 94, 18, 3, 'steel') + rr(60, 98, 14, 20, 2, 'steel') + rr(48, 84, 38, 16, 6, o.lock ? 'red' : 'red');
        s += rr(222, 276, 28, 18, 3, 'brass') + `<path d="M236 294 v-2" stroke="#fff"/>` + (o.on ? '' : `<g fill="${AIR}" opacity=".9"><circle cx="236" cy="296" r="2"/></g>`);
        s += rr(298, 60, 40, 18, 4, 'brass') + t(318, 54, tr2('Safety valve', 'سيفتي فالف'), 10, '#9fb0cf');
        s += t(210, 168, '500 L  11 bar', 14, '#fff', 'middle', 800);
        if (o.lock) s += rr(40, 80, 54, 44, 6, 'red') + dk(66, 102, 7) + padlock(56, 120, 1.0) + tag(100, 70, 0.8);
      } else {
        for (let i = 0; i < 70; i++) { const x = 146 + ((i * 53) % 130), y = 80 + ((i * 37) % 160); s += `<circle cx="${x}" cy="${y}" r="${o.on ? 2.4 : 1.2}" fill="${AIR}" opacity="${o.on ? 0.9 : 0.35}"/>`; }
        s += t(210, 168, o.on ? tr2('Dots = compressed air', 'النقط = هوا مضغوط') : tr2('Empty: 0 bar', 'فاضي: 0 بار'), 13, '#fff', 'middle', 800);
      }
      return s;
    },
    out: [[210, 26, 'Pressure gauge', 'عداد الضغط', 'Must read zero before any work. A broken gauge shows zero too: confirm with the drain.', 'لازم يقرا صفر قبل أي شغل. عداد بايظ بيقرا صفر كمان: أكّد بالدرين.'], [66, 92, 'Inlet isolation valve', 'فالف عزل الدخل', 'Close and lock it. Pressure from the compressor cannot refill the tank.', 'اقفله واقفله بقفل. ضغط الكباس مش هيملا الخزان.'], [236, 286, 'Drain valve', 'فالف الدرين', 'Open it fully to empty water and air. Leave it open while working.', 'افتحه كامل لتفريغ المياه والهوا. سيبه مفتوح وانت شغال.'], [318, 66, 'Safety valve', 'سيفتي فالف', 'Opens at the vessel rating. Never block or paint it.', 'بيفتح عند ضغط الوعاء. متسدهوش ومتدهنهوش.']],
    in: (o) => [[210, 120, 'Compressed air', 'الهوا المضغوط', 'Stored energy. A burst vessel is far more dangerous than a burst hose.', 'طاقة مخزنة. انفجار الوعاء أخطر بكتير من انفجار الخرطوم.'], [210, 26, 'Gauge', 'العداد', 'Tells you what is left inside.', 'بيقولك إيه اللي لسه جوه.']],
    lock: [['Close and lock the inlet valve.', 'اقفل واقفل فالف الدخل.'], ['Open the drain and the bleed valve fully.', 'افتح الدرين وفالف التفريغ كامل.'], ['Wait for the gauge to reach 0 bar and keep the drain open.', 'استنى العداد لـ0 بار وسيب الدرين مفتوح.']],
    prove: [['Gauge at 0 and no air at the drain. Check again after a minute: pressure can creep back.', 'العداد 0 ومفيش هوا من الدرين. اتأكد تاني بعد دقيقة: الضغط ممكن يرجع.']],
    mistakes: [['Believing the tank is empty because the compressor is off.', 'الاعتقاد إن الخزان فاضي لأن الكباس واقف.'], ['Closing the drain again after bleeding.', 'قفل الدرين تاني بعد التفريغ.']],
    std: ['PED 2014/68/EU and local pressure vessel rules.', 'PED 2014/68/EU وقواعد أوعية الضغط المحلية.'],
  });

  /* ================= hydraulic accumulator ================= */
  D.def({
    id: 'accum', group: 'stored', cls: 'stored', icon: 'accum', lockable: false, state: [['Fluid vented', 'السائل مفرّغ'], ['Charged system', 'النظام تحت ضغط']], stateLabel: ['System', 'النظام'],
    name: ['Hydraulic accumulator', 'أكيومليتور هيدروليك'],
    simple: ['A steel bottle with a rubber bladder filled with nitrogen. The oil side stores pressure that can move a cylinder minutes after the pump stops. Isolate the pump, open the manual bleed valve to tank, and watch the gauge fall to zero. The gas side keeps its pre-charge: never loosen the accumulator itself.', 'زجاجة صلب فيها مثانة مطاط مليانة نيتروجين. ناحية الزيت بتخزّن ضغط يقدر يحرك سلندر بعد ما الطلمبة تقف بدقايق. اعزل الطلمبة، افتح فالف التفريغ اليدوي للتانك، وراقب العداد لحد الصفر. ناحية الغاز بتفضل فيها الشحنة: متفكش الأكيومليتور نفسه.'],
    feeds: ['Stores: hydraulic energy for clamps and presses.', 'بيخزّن: طاقة هيدروليك للمشابك والمكابس.'],
    draw(o) {
      let s = '';
      const fl = o.on ? 160 : 0;
      s += rr(150, 40, 120, 190, 50, 'orange') + hl(160, 60, 10, 150, 5, 0.35) + rr(194, 20, 32, 28, 4, 'steel') + rr(188, 228, 44, 32, 4, 'steel') + rect(100, 250, 220, 10, 3, '#2a3248');
      s += gauge(330, 110, 30, fl, 250, 'bar', 1) + gauge(90, 110, 30, 100, 250, 'bar N₂', 1) + pl('M232 244 H330 V162', '#8f99ae', 7) + pl('M188 40 H90 V102', '#8f99ae', 4);
      if (o.inside) {
        s += `<path d="M160 60 q50 -20 100 0 v90 q-50 30 -100 0z" fill="#9fd8ff" opacity=".35" stroke="#7fd0ff" stroke-width="2"/>`;
        s += `<path d="M156 150 q54 ${o.on ? 10 : 40} 108 0 v70 q-54 40 -108 0z" fill="#a85a10" opacity=".8" stroke="#ffb36a" stroke-width="2"/>` + t(210, 100, 'N₂', 16, '#fff', 'middle', 800) + t(210, 205, tr2('Oil', 'زيت'), 14, '#fff', 'middle', 800);
        s += `<path d="M156 150 q54 ${o.on ? 10 : 40} 108 0" fill="none" stroke="#f4f6fb" stroke-width="3"/>`;
      } else s += t(210, 140, tr2('Accumulator', 'أكيومليتور'), 14, '#273049', 'middle', 800) + t(210, 158, '10 L  250 bar', 11, '#273049', 'middle', 700);
      s += t(210, 284, o.on ? tr2('Oil side holds system pressure', 'ناحية الزيت شايلة ضغط النظام') : tr2('Oil side vented; the gas pre-charge stays', 'ناحية الزيت اتفرّغت؛ شحنة الغاز بتفضل'), 11, '#9fb0cf');
      return s;
    },
    hasInside: true,
    out: [[330, 110, 'Oil-side gauge', 'عداد ناحية الزيت', 'Falls to 0 after the bleed valve is opened. This is the one you check.', 'بينزل لـ0 بعد فتح فالف التفريغ. ده اللي بتتأكد منه.'], [90, 110, 'Gas-side gauge', 'عداد ناحية الغاز', 'The nitrogen pre-charge stays. It is normal and it is not isolated by the bleed.', 'شحنة النيتروجين بتفضل. ده طبيعي والتفريغ مش بيعزلها.'], [210, 30, 'Gas valve', 'فالف الغاز', 'Only trained people charge or discharge the gas.', 'الناس المتدربة بس هي اللي بتشحن أو تفرّغ الغاز.'], [210, 244, 'Oil port', 'مدخل الزيت', 'Connects to the hydraulic circuit through the isolation block.', 'بيتوصل بدايرة الهيدروليك من خلال بلوك العزل.']],
    in: (o) => [[210, 100, 'Nitrogen gas', 'غاز النيتروجين', 'Compressed gas that pushes the oil out when the pump stops.', 'غاز مضغوط بيزق الزيت لما الطلمبة تقف.'], [210, 150, 'Bladder', 'المثانة', 'A rubber bag that separates the gas from the oil.', 'كيس مطاط بيفصل الغاز عن الزيت.'], [210, 205, 'Oil', 'الزيت', 'High pressure oil can inject through skin. Never feel for leaks by hand.', 'زيت ضغط عالي ممكن يخترق الجلد. متدورش على تسريب بإيدك.']],
    lock: [['Switch the pump off and isolate and lock its supply.', 'وقّف الطلمبة واعزل واقفل مصدرها.'], ['Open the manual bleed valve to tank (it may have a lock).', 'افتح فالف التفريغ اليدوي للتانك (ممكن يكون ليه قفل).'], ['Watch the gauge fall to 0 bar.', 'راقب العداد لحد 0 بار.']],
    prove: [['Gauge on the oil side at 0 bar after the bleed. Try to move the machine: nothing happens.', 'عداد ناحية الزيت 0 بار بعد التفريغ. جرّب تحرّك الماكينة: مفيش حركة.']],
    mistakes: [['Loosening a fitting with oil pressure still inside.', 'فك وصلة والزيت لسه تحت ضغط.'], ['Forgetting the accumulator when the pump is isolated.', 'نسيان الأكيومليتور لما الطلمبة تتعزل.']],
    std: ['ISO 4413: hydraulic systems must have a way to relieve stored energy.', 'ISO 4413: أنظمة الهيدروليك لازم يكون فيها وسيلة لتفريغ الطاقة المخزنة.'],
  });

  /* ================= capacitor bank ================= */
  D.def({
    id: 'capbank', group: 'stored', cls: 'stored', icon: 'capbank', lockable: false, state: [['Discharged (0 V)', 'مفرّغ (0 فولت)'], ['Charged (560 V)', 'مشحون (560 فولت)']], stateLabel: ['Capacitors', 'الكباسيتورات'],
    name: ['Capacitor bank (drive DC bus)', 'بنك كباسيتورات (DC bus الانفرتر)'],
    simple: ['Capacitors store charge like a bottle stores water. After the supply is switched off, a bank of drive capacitors can hold 560 V for minutes. Wait the label time, then prove zero with a meter between + and − and to earth. A discharge stick with a resistor (never a screwdriver) discharges a bank safely.', 'الكباسيتور بيخزّن شحنة زي الإزازة بتخزّن مياه. بعد قطع المصدر بنك كباسيتورات الانفرتر ممكن يفضل شايل 560 فولت دقايق. استنى الوقت المكتوب وبعدين اثبت الصفر بجهاز بين + و− ومع الأرضي. عصاية التفريغ بمقاومة (مش مفك أبدًا) بتفرّغ البنك بأمان.'],
    feeds: ['Stores: charge in drives, power supplies, motor capacitors.', 'بيخزّن: شحنة في الانفرترات والباور سبلاي وكباسيتورات الموتور.'],
    draw(o) {
      let s = '';
      const col = o.on ? '#ff6b5e' : '#4fc16a';
      [60, 140, 220, 300].forEach((x, i) => { s += `<rect x="${x}" y="80" width="64" height="120" rx="8" fill="${F('blue', { h: 1 })}" stroke="#141a28" stroke-width="1.6"/><rect x="${x}" y="80" width="64" height="18" rx="6" fill="${F('steel')}" stroke="#141a28"/><rect x="${x + 46}" y="104" width="8" height="84" fill="#fff" opacity=".55"/>` + t(x + 22, 150, i % 2 ? '−' : '+', 22, '#fff', 'middle', 800) + `<circle cx="${x + 32}" cy="70" r="7" fill="#aab2c3" stroke="#141a28"/>`; });
      s += pl('M92 70 V52 H252 V70', '#ff6b5e', 4) + pl('M172 70 V40 H332 V70', '#5aa0ff', 4) + rr(60, 214, 304, 22, 3, 'copper');
      s += rect(100, 244, 220, 32, 6, '#10141f', 'stroke="#2a3248"') + t(210, 266, o.on ? '560 V' : '0 V', 20, col, 'middle', 800);
      if (o.inside) { for (let i = 0; i < 4; i++) { s += `<path d="M${74 + i * 80} 110 h32 M${74 + i * 80} 118 h32 M${74 + i * 80} 126 h32 M${74 + i * 80} 134 h32" stroke="#f4f6fb" stroke-width="2" opacity=".8"/>`; } s += t(210, 26, tr2('Foil layers rolled with electrolyte', 'طبقات رقاقة ملفوفة مع إلكتروليت'), 11, '#9fb0cf'); }
      if (!o.on) s += ico('dstick', 346, 76, 1.2) + t(372, 232, tr2('Discharge stick', 'عصاية تفريغ'), 10, '#9fb0cf');
      return s;
    },
    out: [[92, 70, 'Terminals', 'الأطراف', 'Plus and minus. Do not bridge them with a tool.', 'موجب وسالب. متوصلهمش بأداة.'], [100, 176, 'Polarity marking', 'علامة القطبية', 'Wrong polarity can make an electrolytic capacitor burst.', 'قطبية غلط ممكن تفجّر الكباسيتور الإلكتروليتي.'], [116, 260, 'Voltage reading', 'قراية الجهد', 'Prove it with a meter rated for the bus voltage: before and after the work.', 'اثبته بجهاز متصنف لجهد الـbus: قبل وبعد الشغل.']],
    in: [[100, 120, 'Foil layers', 'طبقات الرقاقة', 'Two foils separated by paper soaked in electrolyte. The charge sits on the foils.', 'رقاقتين بينهم ورق مشبّع بإلكتروليت. الشحنة قاعدة على الرقايق.'], [254, 176, 'Electrolyte', 'الإلكتروليت', 'A liquid that can leak or dry out with age.', 'سائل ممكن يسرّب أو يجف مع العمر.'], [340, 150, 'Bleeder path', 'مسار التفريغ', 'A resistor discharges the bank slowly. If it fails the charge stays.', 'مقاومة بتفرّغ البنك ببطء. لو فشلت الشحنة بتفضل.']],
    lock: [['Isolate and lock the supply of the drive.', 'اعزل واقفل مصدر الانفرتر.'], ['Wait the time printed on the label.', 'استنى الوقت المكتوب على اللوحة.'], ['Measure + to −, + to earth, − to earth: all near 0 V.', 'قيس + مع −، + مع الأرضي، − مع الأرضي: كلهم قريب من 0 فولت.']],
    prove: [['Prove the meter, measure, prove the meter again.', 'جرّب الجهاز، قيس، جرّب الجهاز تاني.']],
    mistakes: [['Discharging with a screwdriver: arc, burn and damage.', 'التفريغ بمفك: قوس وحرق وتلف.']],
    std: ['IEC 61800-5-1; EN 50110-1.', 'IEC 61800-5-1؛ EN 50110-1.'],
  });

  /* ================= raised ram (gravity) ================= */
  D.def({
    id: 'ram', group: 'stored', cls: 'stored', icon: 'press', lockable: true, defLock: false, state: [['Ram down', 'الرام تحت'], ['Ram raised', 'الرام مرفوع']], stateLabel: ['Ram', 'الرام'], block: ['With the safety block under the ram, the ram cannot come down even if the air is released.', 'والبلوكة تحت الرام، الرام مش هينزل حتى لو الهوا اتفرّغ.'],
    name: ['Raised press ram (gravity)', 'رام مكبس مرفوع (جاذبية)'],
    simple: ['A ram held up by air or oil pressure has potential energy: if the pressure leaks away it falls with its whole weight. Isolation and venting is not enough. Put a mechanical safety block or pin under it, and only then work in the tool area. The block is part of the lockout and takes your padlock.', 'الرام اللي ماسكه هوا أو زيت عنده طاقة وضع: لو الضغط سرّب بينزل بوزنه كله. العزل والتفريغ مش كفاية. حط بلوكة أمان ميكانيكية أو بنّ تحته، وبعدين اشتغل في منطقة الأدوات. البلوكة جزء من اللوتو وبتاخد قفلك.'],
    feeds: ['Stores: gravity energy of a raised mass.', 'بيخزّن: طاقة جاذبية لكتلة مرفوعة.'],
    draw(o) {
      let s = '';
      const ry = o.on || o.lock ? 92 : 150;
      s += rr(60, 20, 18, 250, 3, 'steel') + rr(342, 20, 18, 250, 3, 'steel') + rr(60, 20, 300, 30, 6, 'dark') + rr(60, 250, 300, 20, 4, 'dark');
      s += rr(184, 50, 52, 24, 4, 'blue') + `<rect x="200" y="74" width="20" height="${ry - 74 + 4}" rx="3" fill="${F('steel', { h: 1 })}" stroke="#141a28" stroke-width="1.4"/>` + rr(140, ry, 140, 36, 6, 'red') + hl(146, ry + 4, 128, 6, 3, 0.4) + rr(150, 236, 120, 14, 3, 'steel');
      if (!o.inside) { }
      else s += `<rect x="184" y="50" width="52" height="24" fill="none"/>` + `<path d="M190 66 h40" stroke="${AIR}" stroke-width="3"/>` + t(210, 292, tr2('Air pressure in the cylinder holds the ram up', 'ضغط الهوا في السلندر هو اللي ماسك الرام'), 11, '#9fb0cf');
      if (o.lock) s += `<path d="M150 ${ry + 36} L270 ${ry + 36} L270 236 L150 236 Z" fill="url(#lg_hazard) #f6cf3a" stroke="#141a28" stroke-width="1.6"/>` + padlock(260, 190, 1.0) + tag(100, 200, 0.8);
      else if (o.on) s += t(210, 224, tr2('Nothing holds it if the air leaks', 'مفيش حاجة ماسكاه لو الهوا سرّب'), 12, '#ff9a8c') + arrow(210, ry + 44, 210, 214, '#ff6b5e');
      return s;
    },
    out: (o) => [[210, (o.on || o.lock ? 92 : 150) + 18, 'Ram', 'الرام', 'The moving head. When raised, its weight is carried by the air, not by metal.', 'الراس المتحركة. وهي مرفوعة وزنها شايله الهوا مش المعدن.'], [210, 62, 'Cylinder', 'السلندر', 'Vented and locked as well, but never relied on alone.', 'بيتفرّغ ويتقفل كمان بس مش بنعتمد عليه لوحده.'], [210, 236, 'Tool area', 'منطقة الأدوات', 'Where hands go. The reason for the block.', 'مكان الإيدين. ده سبب البلوكة.']],
    in: (o) => [[210, 62, 'Air side', 'ناحية الهوا', 'Pressure here lifts and holds the ram.', 'الضغط هنا بيرفع الرام وبيمسكه.'], [210, 110, 'Rod', 'الساق', 'Carries the force down to the ram.', 'بتنقل القوة للرام.']],
    lock: [['Stop the press and isolate and lock the air and the power.', 'وقّف المكبس واعزل واقفل الهوا والكهرباء.'], ['Raise the ram if needed and insert the safety block under it.', 'ارفع الرام لو لازم وحط بلوكة الأمان تحته.'], ['Put your padlock on the block and a tag on the press.', 'حط قفلك على البلوكة والتاج على المكبس.']],
    prove: [['Lower the ram gently on the block, then check that it rests firmly.', 'نزّل الرام بهدوء على البلوكة وتأكد إنه واقف ثابت.']],
    mistakes: [['Trusting the air valve alone.', 'الاعتماد على فالف الهوا لوحده.'], ['Reaching in because the cycle is stopped.', 'مد الإيد لأن الدورة واقفة.']],
    std: ['ISO 14118 / OSHA 1910.147: block or restrain gravity loads.', 'ISO 14118 / OSHA 1910.147: ثبّت أو احبس الأحمال اللي بتنزل بالجاذبية.'],
  });

  /* ================= spring energy ================= */
  D.def({
    id: 'spring', group: 'stored', cls: 'stored', icon: 'spring', lockable: true, defLock: false, state: [['Released', 'متحرر'], ['Compressed (loaded)', 'مضغوطة (محمّلة)']], stateLabel: ['Spring', 'السوستة'], block: ['The retaining pin traps the spring. It cannot spring out while the pin and padlock are on.', 'البنّ ماسك السوستة. مش هتطلع والبنّ والقفل عليها.'],
    name: ['Spring under load (clamp, brake, return spring)', 'سوستة تحت حمل (مشبك، فرامل، سوستة رجوع)'],
    simple: ['A compressed spring keeps pushing even with every supply cut. Spring-applied brakes, clamps and return springs can move or throw parts when you loosen a bolt. Block the movement with a pin or a clamp, or release the spring slowly under control, before you open anything that holds it.', 'السوستة المضغوطة بتفضل تزق حتى لو كل المصادر اتقطعت. الفرامل بالسوست والمشابك وسوست الرجوع ممكن تحرك أو ترمي قطع لما تفك مسمار. امسك الحركة ببنّ أو مشبك، أو فك السوستة ببطء وبتحكم، قبل ما تفتح أي حاجة ماسكاها.'],
    feeds: ['Stores: mechanical energy in a compressed spring.', 'بيخزّن: طاقة ميكانيكية في سوستة مضغوطة.'],
    draw(o) {
      let s = '';
      const len = o.on ? 90 : 160;
      s += rr(40, 106, 22, 90, 4, 'dark') + rr(62 + len + 70, 106, 22, 90, 4, 'dark') + `<rect x="62" y="146" width="${len + 70}" height="10" rx="3" fill="${F('steel')}" stroke="#141a28"/>`;
      const x0 = 62 + 8, x1 = 62 + len + 62, n = 9; let d = `M${x0} 151`; for (let i = 1; i <= n; i++) d += ` L${x0 + (x1 - x0) * (i - 0.5) / n} ${i % 2 ? 112 : 190}`; d += ` L${x1} 151`;
      s += `<path d="${d}" fill="none" stroke="#141a28" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${F('steel', { h: 1 })}" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      if (o.on && !o.lock) s += t(210, 246, tr2('Energy stored: it will push when released', 'طاقة مخزنة: هتزق لما تتحرر'), 12, '#ff9a8c') + arrow(240, 100, 290, 100, '#ff6b5e');
      if (o.lock) s += rr(120, 80, 14, 140, 3, 'red') + rr(100, 200, 60, 26, 6, 'red') + dk(130, 213, 6) + padlock(140, 170, 1.0) + tag(260, 200, 0.8) + t(210, 266, tr2('Pin holds the spring', 'البنّ ماسك السوستة'), 12, '#4fc16a');
      return s;
    },
    hasInside: false,
    out: (o) => [[x1pos(o), 108, 'Spring', 'السوستة', 'Compressed length is shorter than free length. The difference is the stored energy.', 'الطول وهي مضغوطة أقصر من طولها الحر. الفرق ده هو الطاقة المخزنة.'], [51, 151, 'Fixed end plate', 'لوح التثبيت', 'The bolts here carry the whole spring force.', 'المسامير هنا شايلة قوة السوستة كلها.'], [62 + (o.on ? 90 : 160) + 58, 151, 'Guide rod', 'ساق التوجيه', 'Keeps the spring straight so it does not buckle out.', 'بتخلي السوستة مستقيمة فمتنحنيش.']],
    lock: [['Release or block the spring before loosening any bolt.', 'حرّر السوستة أو ثبّتها قبل ما تفك أي مسمار.'], ['Fit a retaining pin or a clamp.', 'ركّب بنّ تثبيت أو مشبك.'], ['Padlock the pin and tag it.', 'حط قفل على البنّ والتاج.']],
    prove: [['Try to move the part by hand: it must stay put.', 'جرّب تحرك القطعة بإيدك: لازم تفضل ثابتة.']],
    mistakes: [['Loosening the bolts that retain a loaded spring.', 'فك مسامير بتمسك سوستة محمّلة.']],
    std: ['ISO 14118: restrain springs and other stored mechanical energy.', 'ISO 14118: ثبّت السوست وأي طاقة ميكانيكية مخزنة.'],
  });
  function x1pos(o) { return 62 + (o.on ? 90 : 160) / 2 + 40; }

  /* ================= hot pipe ================= */
  D.def({
    id: 'hotpipe', group: 'stored', cls: 'stored', icon: 'hotpipe', lockable: true, defLock: false, state: [['Cooled (30 C)', 'بردت (30 م)'], ['Hot (180 C)', 'سخنة (180 م)']], stateLabel: ['Pipe', 'الماسورة'], block: ['The barrier and tag stop access until the temperature is confirmed.', 'الحاجز والتاج بيمنعوا الوصول لحد ما الحرارة تتأكد.'],
    name: ['Hot pipe or vessel (thermal energy)', 'ماسورة أو وعاء سخن (طاقة حرارية)'],
    simple: ['Heat is also stored energy. A steam line is isolated and locked like any other, but the metal and the fluid stay hot for hours. Let it cool or wear the right PPE, and verify the surface temperature with a thermometer before touching or opening. Opening a hot line can release steam or hot condensate.', 'الحرارة كمان طاقة مخزنة. خط البخار بيتعزل ويتقفل زي أي خط، بس المعدن والسائل بيفضلوا سخنين ساعات. سيبه يبرد أو البس الوقاية المناسبة، وقيس حرارة السطح بترمومتر قبل ما تلمس أو تفتح. فتح خط سخن ممكن يطلّع بخار أو مياه سخنة.'],
    feeds: ['Stores: heat in the metal and the fluid.', 'بيخزّن: حرارة في المعدن والسائل.'],
    draw(o) {
      let s = '';
      const hot = o.on;
      s += rr(20, 130, 380, 54, 6, hot ? 'orange' : 'steel') + hl(24, 134, 372, 8, 4, 0.4) + [70, 150, 230, 310].map((x) => rr(x, 124, 12, 66, 3, 'dark')).join('');
      if (hot) for (let i = 0; i < 4; i++) s += `<path d="M${60 + i * 80} 116 q-10 -16 0 -30 t0 -30" fill="none" stroke="#ff8b6a" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
      s += rr(180, 206, 60, 64, 8, 'white') + t(210, 240, hot ? '180°' : '30°', 22, hot ? '#c0281d' : '#2f6b3a', 'middle', 800) + t(210, 258, tr2('surface', 'السطح'), 10, '#4a556f') + `<path d="M210 192 v14" stroke="#cfd5e3" stroke-width="3"/>`;
      if (o.inside) s += rr(20, 130, 380, 54, 6, 'steel', {}) + `<rect x="20" y="138" width="380" height="38" fill="${hot ? '#d9482b' : '#3d8fe0'}" opacity=".8"/>` + t(210, 162, hot ? tr2('Hot steam or fluid inside', 'بخار أو سائل سخن جوه') : tr2('Cool fluid, drained', 'سائل بارد، متفرّغ'), 12, '#fff', 'middle', 800);
      if (o.lock) s += rr(250, 62, 100, 50, 6, 'red') + t(300, 84, 'HOT', 16, '#fff', 'middle', 800) + t(300, 100, tr2('Do not touch', 'متلمسش'), 10, '#fff') + tag(60, 70, 0.9);
      return s;
    },
    hasInside: true,
    out: (o) => [[330, 158, 'Insulation or bare metal', 'العزل أو المعدن', 'Bare metal can burn on contact. Insulation hides the real temperature.', 'المعدن العاري بيحرق باللمس. العزل بيخبّي الحرارة الحقيقية.'], [238, 214, 'Thermometer', 'الترمومتر', 'Infrared or contact reading of the surface before touching.', 'قراية حرارة السطح بالأشعة أو بالتلامس قبل اللمس.']].concat(o.on ? [[150, 92, 'Steam leak', 'تسريب بخار', 'Invisible near the pipe and very dangerous.', 'مبيبانش قريب من الماسورة وخطر جدًا.']] : []),
    in: [[360, 158, 'Fluid inside', 'السائل جوه', 'Isolate, drain and vent the line before opening a flange.', 'اعزل وصرّف وفرّغ الخط قبل ما تفتح فلنشة.']],
    lock: [['Isolate and lock the steam or hot fluid valves.', 'اعزل واقفل فالفات البخار أو السائل السخن.'], ['Drain, vent and let it cool.', 'صرّف وفرّغ وسيبه يبرد.'], ['Check the surface temperature, then tag and barrier the area.', 'قيس حرارة السطح وبعدين تاج وحاجز للمنطقة.']],
    prove: [['Thermometer reading below your procedure limit (for example 45 C).', 'قراية الترمومتر أقل من حد الإجراء (مثلا 45 م).']],
    mistakes: [['Touching to "feel if it is cool".', 'اللمس عشان "تحس إنه بارد".'], ['Opening a flange on a line that is isolated but still hot.', 'فتح فلنشة على خط معزول بس لسه سخن.']],
    std: ['EN 563 / ISO 13732-1: touchable surface temperature limits.', 'EN 563 / ISO 13732-1: حدود حرارة الأسطح اللي بتتلمس.'],
  });

  /* ================= kit: padlock ================= */
  D.def({
    id: 'padlock', group: 'kit', cls: 'tool', icon: 'padlock_red', lockable: false, state: [['Locked', 'مقفول'], ['Open', 'مفتوح']], stateLabel: ['Padlock', 'القفل'],
    name: ['LOTO padlock (one person, one lock, one key)', 'قفل اللوتو (شخص واحد، قفل واحد، مفتاح واحد)'],
    simple: ['A lockout padlock is keyed to one person. Only you hold the key, so only you can remove your lock. It carries your name. If you leave the job, your lock stays on until you come back. Nobody removes another person\'s lock without the written site procedure. Use a lock only for LOTO, never for a locker or a toolbox.', 'قفل اللوتو بتاع شخص واحد. المفتاح معاك انت بس، فانت بس اللي تفتحه. عليه اسمك. لو سبت الشغل قفلك يفضل مكانه لحد ما ترجع. محدش يشيل قفل حد تاني من غير الإجراء المكتوب في الموقع. استخدم القفل للوتو بس، مش للدولاب ولا صندوق العدة.'],
    feeds: ['Purpose: personal control of the isolation device.', 'الغرض: تحكم شخصي في جهاز العزل.'],
    draw(o) {
      let s = '';
      const open = !!o.on;
      if (!o.inside) {
        s += `<g transform="${open ? 'translate(0,-24) rotate(-30 270 130)' : ''}"><path d="M150 132 V86 a60 60 0 0 1 120 0 V132" fill="none" stroke="#141a28" stroke-width="24" stroke-linecap="round"/><path d="M150 132 V86 a60 60 0 0 1 120 0 V132" fill="none" stroke="${F('steel')}" stroke-width="16" stroke-linecap="round"/></g>`;
        s += rr(110, 128, 200, 132, 18, 'red') + hl(118, 134, 184, 14, 7, 0.4) + cc(210, 184, 14, 'dark') + rect(205, 184, 10, 26, 3, '#141a28') + rr(138, 226, 144, 26, 4, 'white') + t(210, 243, 'A. ALI  -  MAINT.', 10, '#273049', 'middle', 800);
        if (open) s += cc(386, 190, 17, 'brass') + `<circle cx="386" cy="190" r="6" fill="#0c1424"/>` + rr(318, 185, 56, 10, 3, 'brass') + rect(326, 195, 8, 8, 1, '#c8962b') + rect(342, 195, 8, 12, 1, '#c8962b') + rect(358, 195, 8, 7, 1, '#c8962b');
        s += t(210, 284, open ? tr2('Open: the key is in the lock', 'مفتوح: المفتاح في القفل') : tr2('Locked: the only key stays in your pocket', 'مقفول: المفتاح الوحيد في جيبك'), 11, open ? '#ffd27a' : '#4fc16a');
      } else {
        s += rr(60, 50, 300, 210, 22, 'red', {}) + rect(76, 66, 268, 178, 12, '#0f1626');
        s += rr(86, 140, 248, 64, 6, 'brass', {}) + `<path d="M76 140 H344" stroke="#4fc16a" stroke-width="1.6" stroke-dasharray="5 4"/>`;
        const H = [20, 30, 16, 26, 22], X = [136, 176, 216, 256, 296];
        X.forEach((x, i) => {
          const bt = open ? 140 : 196 - H[i];
          s += `<path d="M${x} 80 l-7 6 l14 6 l-14 6 l14 6 l-7 6" stroke="#8f99ae" stroke-width="2" fill="none"/>`;
          s += rr(x - 10, 118, 20, bt - 118, 2, 'white') + rr(x - 10, bt, 20, H[i], 2, 'steel');
        });
        if (open) { let d = 'M92 214 V150'; X.forEach((x, i) => { d += ` L${x - 14} 150 L${x} ${140 + H[i]} L${x + 14} 150`; }); d += ' L312 150 V214 Z'; s += `<path d="${d}" fill="${F('brass', { h: 1 })}" stroke="#141a28" stroke-width="1.6"/>`; }
        s += t(210, 280, open ? tr2('Key lifts every pin exactly to the shear line: the plug turns', 'المفتاح بيرفع كل بنّ لخط القص بالظبط: الأسطوانة بتلف') : tr2('No key: driver pins cross the shear line and block the plug', 'من غير مفتاح: البنوط بتعدّي خط القص وبتمنع الأسطوانة'), 10.5, open ? '#ffd27a' : '#4fc16a');
      }
      return s;
    },
    out: (o) => [[210, 52, 'Shackle', 'العروة', 'The hardened loop that goes through the hasp. Use a lock with a short shackle so it cannot be pried.', 'الحلقة الصلبة اللي بتدخل في الهاسب. استخدم قفل بعروة قصيرة عشان محدش يفتحه بالقوة.'], [210, 184, 'Keyhole', 'فتحة المفتاح', 'Unique key. No master key for the group, except the supervisor\'s emergency one kept under control.', 'مفتاح فريد. مفيش ماستر كي للمجموعة، إلا مفتاح الطوارئ بتاع المشرف تحت التحكم.'], [272, 239, 'Name plate', 'لوحة الاسم', 'Your name and department, so everybody knows who is working. Add a tag with phone and date.', 'اسمك وقسمك عشان الكل يعرف مين شغال. ضيف تاج بالتليفون والتاريخ.']].concat(o.on ? [[386, 190, 'Key', 'المفتاح', 'Remove it and keep it on you the whole time. Never leave it in the lock.', 'شيله واحتفظ بيه معاك طول الوقت. متسيبوش في القفل أبدًا.']] : []),
    in: (o) => [[216, 160, 'Pin stack', 'مجموعة البنوط', 'Each stack has a driver pin and a bottom pin of a different length.', 'كل عمود فيه بنّ علوي وبنّ سفلي بأطوال مختلفة.'], [336, 140, 'Shear line', 'خط القص', 'Only the right key lines every pin up with this line. That is what lets the plug turn.', 'المفتاح الصح بس هو اللي بيخلي كل البنوط على الخط ده. ده اللي بيخلي الأسطوانة تلف.'], [136, 92, 'Spring', 'السوستة', 'Pushes the pins down into the plug when there is no key.', 'بتزق البنوط لتحت جوه الأسطوانة لما مفيش مفتاح.']],
    lock: [['Put the shackle through the hole of the isolation device or the hasp.', 'دخّل العروة في فتحة جهاز العزل أو الهاسب.'], ['Push the shackle closed until it clicks. Pull it to test.', 'اقفل العروة لحد ما تسمع كليك. اسحبها تجرّب.'], ['Keep the key on you and add your tag.', 'خلّي المفتاح معاك وضيف التاج بتاعك.']],
    mistakes: [['Leaving the key in the lock or in a drawer.', 'ترك المفتاح في القفل أو في درج.'], ['Using a common padlock that has a duplicate key.', 'استخدام قفل عادي ليه مفتاح مكرر.']],
    std: ['OSHA 1910.147(c)(5): lockout devices must be durable, standardised and identifiable.', 'OSHA 1910.147(c)(5): أجهزة اللوتو لازم تكون متينة وموحّدة ومعروف صاحبها.'],
  });

  /* ================= kit: hasp ================= */
  D.def({
    id: 'hasp', group: 'kit', cls: 'tool', icon: 'hasp', lockable: false, state: [['One lock', 'قفل واحد'], ['Three people', '3 أشخاص']], stateLabel: ['Locks', 'الأقفال'],
    name: ['Multi-lock hasp (several workers, one isolation point)', 'هاسب متعدد الأقفال (أكتر من شخص على نقطة عزل)'],
    simple: ['When more than one person works on a machine, one hasp gives every person a hole for their own padlock. The hasp stays on until the last lock is removed, so the first person to finish cannot re-energise the machine while the others are still inside. Six holes is common.', 'لما أكتر من شخص يشتغل على ماكينة، الهاسب بيدّي كل واحد فتحة لقفله. الهاسب بيفضل لحد ما آخر قفل يتشال، فأول واحد يخلّص ميقدرش يشغّل الماكينة والباقيين لسه جواها. ستة فتحات هو المعتاد.'],
    feeds: ['Used with: breakers, valves, plugs that have only one lock hole.', 'بيتستخدم مع: بريكرات وفالفات وفيش فيها فتحة قفل واحدة.'],
    draw(o) {
      let s = '';
      s += rr(8, 96, 96, 112, 10, 'dark') + `<path d="M24 132 h60 a14 14 0 0 1 0 38 h-60" fill="none" stroke="#141a28" stroke-width="13" stroke-linecap="round"/><path d="M24 132 h60 a14 14 0 0 1 0 38 h-60" fill="none" stroke="${F('steel')}" stroke-width="8" stroke-linecap="round"/>`;
      s += rr(96, 124, 296, 54, 14, 'red') + hl(102, 128, 284, 10, 5, 0.4) + cc(110, 151, 7, 'steel');
      const xs = [160, 200, 240, 280, 320, 360], cols = ['red', 'blue', 'yellow'];
      xs.forEach((x, i) => { s += `<circle cx="${x}" cy="151" r="11" fill="#141a28"/><circle cx="${x}" cy="151" r="8" fill="#0c1424"/>`; });
      const n = o.on ? 3 : 1;
      for (let i = 0; i < n; i++) s += padlock(xs[i] - 22, 140, 0.7, cols[i]);
      s += t(210, 262, o.on ? tr2('Three locks: the machine stays isolated until all three are off', 'ثلاث أقفال: الماكينة تفضل معزولة لحد ما التلاتة يتشالوا') : tr2('One person, one lock', 'شخص واحد، قفل واحد'), 11, '#9fb0cf');
      return s;
    },
    hasInside: false,
    out: (o) => [[240, 128, 'Hasp jaw', 'فك الهاسب', 'Folds over the staple or the handle of the device and closes with the locks.', 'بيتقفل على الحلقة أو مقبض الجهاز وبيتثبت بالأقفال.'], [60, 150, 'Staple', 'الحلقة', 'The lock hole of the isolation device. Without the hasp only one lock fits here.', 'فتحة القفل في جهاز العزل. من غير الهاسب بيدخل قفل واحد بس.'], [xsLock(0), 196, 'First lock', 'القفل الأول', 'Each person puts on their own lock before starting work.', 'كل شخص بيحط قفله قبل ما يبدأ الشغل.'], [360, 128, 'Spare holes', 'الفتحات الفاضية', 'Do not share a lock or add a second lock of someone else. If you need a hole, use another hasp.', 'متشاركش قفل ومتحطش قفل حد غيرك. لو محتاج فتحة استخدم هاسب تاني.']],
    lock: [['Fit the hasp over the staple of the isolation device.', 'ركّب الهاسب على حلقة جهاز العزل.'], ['Every worker adds their own padlock and tag.', 'كل عامل بيحط قفله والتاج بتاعه.'], ['Remove only your own lock when you finish. The last person releases the device.', 'شيل قفلك انت بس لما تخلّص. آخر واحد هو اللي بيفك الجهاز.']],
    mistakes: [['Taking the hasp off because "my part is done".', 'شيل الهاسب لأن "شغلي خلص".'], ['Two people sharing one lock.', 'اتنين بيشاركوا قفل واحد.']],
    std: ['OSHA 1910.147(f)(3): group lockout gives each employee personal control.', 'OSHA 1910.147(f)(3): الـgroup lockout بيدّي كل موظف تحكم شخصي.'],
  });
  function xsLock(i) { return [160, 200, 240, 280, 320, 360][i]; }

  /* ================= kit: group lock box ================= */
  D.def({
    id: 'lockbox', group: 'kit', cls: 'tool', icon: 'lockbox', lockable: false, state: [['Closed', 'مقفول'], ['Open', 'مفتوح']], stateLabel: ['Box', 'الصندوق'],
    name: ['Group lock box (big jobs, many isolation points)', 'صندوق أقفال جماعي (شغل كبير ونقاط عزل كتير)'],
    simple: ['On a big job there are many isolation points. The authorised person locks each point with a lock and puts that lock\'s key inside the group box. Every worker then puts their own lock on the box. The keys stay trapped until the last worker removes their lock. One lock per worker on one box releases many points.', 'في الشغل الكبير فيه نقاط عزل كتير. الشخص المسؤول بيقفل كل نقطة بقفل وبيحط مفتاح القفل ده جوه الصندوق الجماعي. كل عامل بعد كده بيحط قفله على الصندوق. المفاتيح بتفضل محبوسة لحد ما آخر عامل يشيل قفله. قفل واحد لكل عامل على صندوق واحد بيحكم نقاط كتير.'],
    feeds: ['Used with: a written group lockout procedure.', 'بيتستخدم مع: إجراء مكتوب للـgroup lockout.'],
    draw(o) {
      let s = '';
      const open = !!o.on;
      if (!o.inside) {
        s += rr(90, 110, 240, 140, 14, 'red') + hl(98, 116, 224, 12, 6, 0.35) + t(210, 214, tr2('GROUP LOCKOUT BOX', 'صندوق اللوتو الجماعي'), 13, '#fff', 'middle', 800) + t(210, 232, tr2('Keys inside', 'المفاتيح جوه'), 10, '#ffe0dc');
        if (open) s += pl('M104 112 L124 68 M316 112 L296 68', '#8f99ae', 5) + rr(110, 36, 200, 32, 10, 'yellow') + rect(100, 112, 220, 22, 6, '#0f1626') + [0, 1, 2, 3].map((i) => `<circle cx="${136 + i * 50}" cy="122" r="9" fill="${['#c0281d', '#2f6bd0', '#f6cf3a', '#9aa3b5'][i]}" stroke="#141a28"/>`).join('');
        else s += rr(90, 78, 240, 40, 12, 'yellow') + rect(130, 92, 160, 10, 5, '#141a28') + rr(300, 112, 24, 36, 4, 'steel') + padlock(278, 124, 0.9) + tag(346, 126, 0.8);
      } else {
        s += rr(60, 50, 300, 210, 18, 'red', {}) + rect(76, 66, 268, 178, 10, '#0f1626');
        const L = ['A', 'B', 'C', 'M'], C = ['#c0281d', '#2f6bd0', '#f6cf3a', '#9aa3b5'];
        L.forEach((l, i) => { const x = 118 + i * 62; s += `<path d="M${x} 84 v28" stroke="#8f99ae" stroke-width="2"/>` + cc(x, 124, 13, 'brass') + `<circle cx="${x}" cy="124" r="5" fill="#0c1424"/>` + rr(x - 4, 136, 8, 52, 2, 'brass') + rect(x + 4, 160, 8, 6, 1, '#c8962b') + rect(x + 4, 174, 8, 6, 1, '#c8962b') + `<rect x="${x - 20}" y="196" width="40" height="22" rx="4" fill="${C[i]}" stroke="#141a28"/>` + t(x, 212, l, 13, i === 2 || i === 3 ? '#141a28' : '#fff', 'middle', 800); });
        s += t(210, 238, tr2('Each key belongs to a lock on one isolation point', 'كل مفتاح بتاع قفل على نقطة عزل'), 10, '#9fb0cf') + t(210, 280, tr2('A, B, C: keys of point locks   M: spare key under supervisor control', 'A وB وC: مفاتيح أقفال النقاط   M: مفتاح احتياطي مع المشرف'), 10, '#9fb0cf');
      }
      return s;
    },
    out: (o) => o.on ? [[210, 52, 'Open lid', 'الغطا مفتوح', 'Only the authorised person opens the box, to put keys in. Then it is closed and locked.', 'المسؤول بس هو اللي بيفتح الصندوق عشان يحط المفاتيح. وبعدين بيتقفل ويتقفل بقفل.']] : [[210, 98, 'Key slot', 'فتحة المفاتيح', 'Keys go in here and cannot come out once the box is locked.', 'المفاتيح بتدخل هنا ومبتطلعش بعد ما الصندوق يتقفل.'], [290, 130, 'Hasp for personal locks', 'هاسب الأقفال الشخصية', 'Every worker adds a personal lock here. The box opens only when all have removed theirs.', 'كل عامل بيحط قفل شخصي هنا. الصندوق مبيتفتحش إلا لما الكل يشيل قفله.'], [346, 126, 'Tag', 'التاج', 'States who is responsible and what job this box belongs to.', 'بيقول مين المسؤول والصندوق ده تبع أنهي شغل.']],
    in: [[118, 124, 'Key A', 'مفتاح A', 'The key of the lock on isolation point A. It is trapped in the box.', 'مفتاح القفل على نقطة العزل A. محبوس في الصندوق.'], [304, 124, 'Master key M', 'المفتاح الاحتياطي M', 'Only for emergency removal, under the written procedure.', 'للطوارئ بس، حسب الإجراء المكتوب.'], [342, 212, 'Key tags', 'تاجات المفاتيح', 'A letter or number that matches the point list.', 'حرف أو رقم بيطابق قائمة النقاط.']],
    lock: [['Lock every isolation point with its own lock.', 'اقفل كل نقطة عزل بقفلها.'], ['Put the keys of those locks in the box.', 'حط مفاتيح الأقفال دي في الصندوق.'], ['Close the box. Every worker locks it with a personal lock.', 'اقفل الصندوق. كل عامل بيقفله بقفله الشخصي.']],
    mistakes: [['Leaving a key outside the box.', 'ترك مفتاح برا الصندوق.'], ['Closing the box before checking the list of points.', 'قفل الصندوق قبل مراجعة قائمة النقاط.']],
    std: ['OSHA 1910.147(f)(3)(ii): group lockout procedures.', 'OSHA 1910.147(f)(3)(ii): إجراءات group lockout.'],
  });

  /* ================= kit: tag ================= */
  D.def({
    id: 'tag', group: 'kit', cls: 'tool', icon: 'tag', lockable: false, state: [['Blank', 'فاضي'], ['Filled in', 'متملي']], stateLabel: ['Tag', 'التاج'],
    name: ['Danger tag (who, when, why)', 'تاج الخطر (مين ومتى وليه)'],
    simple: ['The tag tells everyone who put the lock on, why, and how to reach them. A lock stops the device. A tag says what is happening. A tag alone is never enough where a lock can be fitted. Fill it before you hang it, with a permanent marker.', 'التاج بيقول للكل مين حط القفل وليه وإزاي توصله. القفل بيوقف الجهاز. والتاج بيقول إيه اللي بيحصل. التاج لوحده مش كفاية لو ينفع تحط قفل. املاه قبل ما تعلقه بقلم ثابت.'],
    feeds: ['Hangs on: the lock or the isolation device.', 'بيتعلق على: القفل أو جهاز العزل.'],
    draw(o) {
      let s = '';
      const f = !!o.on;
      s += `<path d="M210 14 q-26 -8 -26 18" fill="none" stroke="#cfd5e3" stroke-width="3"/>`;
      s += rr(120, 24, 180, 262, 12, 'white') + `<rect x="120" y="44" width="180" height="46" fill="${F('red')}" stroke="#141a28" stroke-width="1.6"/>` + `<circle cx="210" cy="34" r="6" fill="#0c1424"/>` + t(210, 78, tr2('DANGER', 'خطر'), 28, '#fff', 'middle', 800) + t(210, 112, tr2('DO NOT OPERATE', 'ممنوع التشغيل'), 14, '#c0281d', 'middle', 800);
      const rows = [['Name', 'الاسم', 'A. Ali', 'أ. علي'], ['Dept', 'القسم', 'Maintenance', 'الصيانة'], ['Date', 'التاريخ', '28/10/2026', '28/10/2026'], ['Reason', 'السبب', 'Bearing change', 'تغيير رولمان'], ['Phone', 'التليفون', 'Ext. 214', 'داخلي 214']];
      rows.forEach((r, i) => { const y = 142 + i * 30; s += t(132, y, tr2(r[0], r[1]) + ':', 11, '#4a556f', 'start', 700) + `<path d="M178 ${y + 4} H288" stroke="#8f99ae" stroke-width="1.2"/>`; if (f) s += `<text x="182" y="${y}" font-size="13" font-weight="700" fill="#1f3fa0" font-style="italic" font-family="'Segoe Script','Comic Sans MS',cursive,system-ui">${tr2(r[2], r[3])}</text>`; });
      s += t(210, 280, tr2('Only the person named here removes it', 'اللي اسمه هنا بس هو اللي يشيله'), 8.5, '#c0281d', 'middle', 800);
      return s;
    },
    hasInside: false,
    out: [[290, 58, 'Header', 'العنوان', 'Red and white, so it is seen from far. The word DANGER cannot be missed.', 'أحمر وأبيض عشان يتشاف من بعيد. كلمة خطر مش ممكن تفوتك.'], [294, 138, 'Name and department', 'الاسم والقسم', 'Who locked it. Other workers can ask this person before doing anything.', 'مين اللي قفل. أي عامل ممكن يسأله قبل أي حاجة.'], [294, 228, 'Reason', 'السبب', 'What work is being done. It stops someone starting the machine "to check".', 'الشغل اللي بيتعمل. بيمنع حد يشغّل الماكينة "يشوفها".'], [294, 258, 'Phone', 'التليفون', 'So that the owner is reachable if there is a question.', 'عشان صاحب القفل يتوصله لو فيه سؤال.']],
    lock: [['Fill in name, department, date, reason and phone before hanging.', 'املا الاسم والقسم والتاريخ والسبب والتليفون قبل ما تعلق.'], ['Hang it on the padlock or the isolation device with a plastic tie.', 'علقه على القفل أو جهاز العزل بشريط بلاستيك.']],
    mistakes: [['Hanging a blank tag.', 'تعليق تاج فاضي.'], ['Using a tag with no lock where a lock can be fitted.', 'استخدام تاج من غير قفل لما ينفع القفل.']],
    std: ['ANSI Z535.5 / OSHA 1910.145: danger tags.', 'ANSI Z535.5 / OSHA 1910.145: تاجات الخطر.'],
  });

  /* ================= kit: voltage tester (prove-test-prove) ================= */
  D.def({
    id: 'tester', group: 'kit', cls: 'tool', icon: 'tester', lockable: false, multi: true, state: [['1. Prove', '1. جرّب'], ['2. Test the point', '2. اختبر النقطة'], ['3. Prove again', '3. جرّب تاني']], stateLabel: ['Step', 'الخطوة'],
    name: ['Two-pole voltage tester: prove, test, prove', 'تستر جهد ثنائي القطب: جرّب، اختبر، جرّب'],
    simple: ['A zero reading means nothing if the tester is broken. So you prove it works on a known live source, test the isolated point, then prove it again on the known source. Only then is zero believable. Use a two-pole tester that is rated for the voltage and tested on every phase and to earth.', 'قراية الصفر ملهاش معنى لو التستر بايظ. فانت بتجرّبه على مصدر معروف، وبتختبر النقطة المعزولة، وبعدين بتجرّبه تاني على المصدر المعروف. ساعتها بس الصفر يتصدق. استخدم تستر ثنائي القطب متصنف للجهد، واختبر كل فاز ومع الأرضي.'],
    feeds: ['Used after: isolation and lock, before touching conductors.', 'بيتستخدم بعد: العزل والقفل، قبل ما تلمس موصلات.'],
    draw(o) {
      let s = '';
      const k = o.k || 0, v = k === 1 ? 0 : 230;
      const titles = [tr2('1. Prove on a known live source', '1. جرّب على مصدر معروف شغال'), tr2('2. Test the isolated point', '2. اختبر النقطة المعزولة'), tr2('3. Prove again on the known source', '3. جرّب تاني على المصدر المعروف')];
      s += t(210, 40, titles[k], 13, '#ffd27a', 'middle', 800);
      if (k === 1) {
        s += rr(8, 92, 96, 118, 10, 'dark') + [0, 1, 2].map((i) => rr(24, 106 + i * 32, 62, 22, 3, 'brass') + t(55, 122 + i * 32, ['L1', 'L2', 'L3'][i], 11, '#141a28', 'middle', 800)).join('') + padlock(66, 62, 0.7) + t(56, 232, tr2('Isolated point, locked', 'النقطة المعزولة، مقفولة'), 10, '#9fb0cf');
      } else {
        s += rr(8, 92, 96, 118, 10, 'white') + `<circle cx="38" cy="150" r="9" fill="#141a28"/><circle cx="74" cy="150" r="9" fill="#141a28"/><rect x="50" y="170" width="8" height="18" rx="2" fill="#141a28"/>` + t(56, 114, '230 V', 13, '#c0281d', 'middle', 800) + t(56, 232, tr2('Known live source', 'مصدر معروف شغال'), 10, '#9fb0cf');
      }
      s += ln(168, 130, 98, k === 1 ? 118 : 150, '#141a28', 7) + ln(168, 130, 98, k === 1 ? 118 : 150, '#c0281d', 4) + ln(168, 176, 98, k === 1 ? 150 : 150, '#0b0f19', 7) + ln(168, 176, 98, k === 1 ? 150 : 150, '#aab2c3', 4);
      s += rr(166, 96, 220, 112, 18, 'yellow') + hl(172, 100, 208, 12, 6, 0.4) + rect(186, 112, 130, 46, 6, '#10141f', 'stroke="#141a28"') + t(251, 146, v + ' V', 26, v ? '#ff6b5e' : '#4fc16a', 'middle', 800);
      [12, 24, 50, 120, 230, 400].forEach((lv, i) => { const x = 192 + i * 24, lit = v >= lv; s += `<circle cx="${x}" cy="184" r="7" fill="${lit ? (lv >= 50 ? '#ff6b5e' : '#f6cf3a') : '#2a3248'}" stroke="#141a28"/>` + t(x, 202, String(lv), 8, '#273049', 'middle', 700); });
      s += cc(352, 136, 15, 'dark') + t(352, 140, 'TEST', 8, '#cfd8ea', 'middle', 800);
      s += t(210, 262, k === 1 ? tr2('0 V is only believable because steps 1 and 3 prove the tester', '0 فولت يتصدق لأن الخطوتين 1 و3 أثبتوا إن التستر سليم') : tr2('The tester shows the voltage: it works', 'التستر بيقرا الجهد: يعني شغال'), 11, k === 1 ? '#4fc16a' : '#9fb0cf');
      s += t(210, 282, k === 1 ? tr2('Test L1-L2, L2-L3, L1-L3 and each to earth', 'اختبر L1-L2 وL2-L3 وL1-L3 وكل واحد مع الأرضي') : '', 10, '#9fb0cf');
      return s;
    },
    hasInside: false,
    out: (o) => [[104, 150, 'Probe tips', 'أطراف الفحص', 'Touch only the insulated handles. Hold both tips firmly on bare metal.', 'امسك المقابض المعزولة بس. اضغط الطرفين على معدن عاري.'], [326, 108, 'Display', 'الشاشة', 'Shows the voltage level. A dark display on a test point is the result we want only after a good prove.', 'بتوري مستوى الجهد. الشاشة المطفية على نقطة الاختبار هي اللي عايزينها بعد تجربة سليمة بس.'], [352, 186, 'LED ladder', 'سلم الـLED', 'Each light is a voltage step. It works without a battery on most models.', 'كل لمبة درجة جهد. بيشتغل من غير بطارية في أغلب الموديلات.'], [352, 136, 'Test button', 'زرار الاختبار', 'Press it to apply a load that proves the tester and drains ghost voltage.', 'اضغط عليه عشان يحط حمل يثبت التستر ويفرّغ الجهد الوهمي.']],
    prove: [['Prove: known live source reads voltage.', 'جرّب: مصدر معروف شغال يقرا جهد.'], ['Test: every phase pair and every phase to earth reads 0.', 'اختبر: كل فازين وكل فاز مع الأرضي يقرا 0.'], ['Prove again: the known source reads voltage again.', 'جرّب تاني: المصدر المعروف يقرا جهد تاني.']],
    mistakes: [['Testing only L1 to N on a three-phase machine.', 'اختبار L1 مع N بس على ماكينة ثلاث فاز.'], ['Using a non-contact pen as the only proof.', 'استخدام قلم عدم تلامس كإثبات وحيد.'], ['Skipping the second prove.', 'تجاوز التجربة التانية.']],
    std: ['IEC 61243-3 (two-pole voltage detectors); EN 50110-1.', 'IEC 61243-3 (كاشفات الجهد ثنائية القطب)؛ EN 50110-1.'],
  });

  /* ================= small control panel ================= */
  D.def({
    id: 'panel', group: 'elec', cls: 'iso', icon: 'panel', ptype: 'panel', state: [['Isolator OFF', 'الأيزوليتور OFF'], ['Isolator ON', 'الأيزوليتور ON']], stateLabel: ['Main isolator', 'الأيزوليتور الرئيسي'], block: ['The padlock on the isolator handle stops it from going to ON.', 'القفل على مقبض الأيزوليتور بيمنعه يروح ON.'],
    name: ['Small control panel (door and inside)', 'لوحة تحكم صغيرة (من برا ومن جوه)'],
    simple: ['A panel has one main isolator on the door. Turn it OFF and lock it, and everything downstream of it is dead. But the terminals on the isolator\'s supply side are still live, because the isolator is fed from the plant. So the panel has a live zone even when it is off. The buttons, the E-stop and the PLC are control devices: they stop the machine but do not isolate it. Open the door only after the isolator is locked, then test with the tester.', 'اللوحة فيها أيزوليتور رئيسي على الباب. اقفله OFF وقفله بقفل وكل اللي بعده يبقى ميت. بس أطراف المصدر في الأيزوليتور نفسها لسه عليها كهرباء لأنه متغذي من المصنع. يعني اللوحة فيها منطقة شغالة حتى وهي مطفية. الأزرار والـE-stop والـPLC أجهزة تحكم: بتوقف الماكينة لكن مبتعزلهاش. افتح الباب بعد ما تقفل الأيزوليتور بس، وبعدين اختبر بالتستر.'],
    feeds: ['Feeds: the machine motors and controls on this panel.', 'بيغذّي: موتورات وتحكم الماكينة اللي على اللوحة دي.'],
    draw(o) {
      let s = '';
      if (!o.inside) {
        s += rr(52, 6, 316, 288, 12, 'grey') + rr(64, 18, 292, 264, 8, 'white') + [44, 96, 200, 252].map((y) => rr(54, y, 10, 22, 2, 'dark')).join('');
        s += rr(92, 34, 120, 70, 6, 'black') + t(152, 62, tr2('RUN', 'شغال'), 20, '#4fc16a', 'middle', 800) + t(152, 84, 'M1  1450 rpm', 10, '#7fd0ff', 'middle', 700);
        s += cc(248, 52, 12, 'green') + cc(284, 52, 12, 'red') + cc(320, 52, 12, 'orange');
        s += cc(124, 160, 32, 'yellow') + cc(124, 160, 22, 'red') + hl(110, 146, 24, 6, 3, 0.5);
        s += cc(212, 160, 17, 'black') + `<path d="M212 160 L222 150" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`;
        s += cc(266, 160, 14, 'green') + cc(310, 160, 14, 'red');
        const on = o.on;
        s += rr(168, 216, 84, 56, 8, 'yellow') + `<g transform="rotate(${on ? -90 : 0} 210 244)">${rr(180, 233, 60, 22, 8, 'red')}</g>` + t(160, 248, on ? 'ON' : 'OFF', 11, '#cfd8ea', 'end', 800) + t(210, 210, 'I', 12, '#273049', 'middle', 800);
        s += rr(84, 222, 56, 40, 4, 'white') + `<path d="M112 228 l-18 32 h36 z" fill="#f6cf3a" stroke="#141a28" stroke-width="1.6"/><text x="112" y="256" text-anchor="middle" font-size="14" font-weight="800" fill="#141a28">!</text>`;
        if (o.lock) s += rr(242, 232, 24, 22, 3, 'steel') + padlock(236, 236, 0.9) + tag(304, 218, 0.8);
      } else {
        s += rr(40, 6, 340, 288, 10, 'grey') + rect(52, 18, 316, 264, 4, '#c9ced9');
        s += rr(60, 22, 300, 18, 3, 'dark') + rr(60, 264, 300, 16, 3, 'dark') + rr(60, 138, 300, 6, 1, 'steel') + rr(60, 200, 300, 6, 1, 'steel');
        /* main isolator and its live line side */
        s += `<rect x="62" y="44" width="88" height="72" rx="6" fill="#ff6b5e" opacity=".22" stroke="#ff6b5e" stroke-dasharray="5 4" stroke-width="2"/>`;
        s += [0, 1, 2].map((i) => wire(`M${84 + i * 22} 66 V40`, [W.L1, W.L2, W.L3][i], 6)).join('') + rr(70, 66, 72, 44, 6, 'yellow') + [0, 1, 2].map((i) => screwTop(84 + i * 22, 75, 6)).join('') + cc(106, 94, 10, 'red');
        s += t(106, 132, tr2('Isolator, top LIVE', 'الأيزوليتور، فوق شغال'), 9, '#c0281d', 'middle', 800);
        s += [0, 1, 2].map((i) => rr(168 + i * 24, 52, 20, 56, 3, 'white') + rect(172 + i * 24, 60, 12, 12, 2, i === 1 ? '#c0281d' : '#8f99ae')).join('') + t(204, 132, tr2('MCBs', 'مفاتيح صغيرة'), 9, '#273049', 'middle', 800);
        s += rr(256, 52, 96, 56, 5, 'green') + t(304, 86, '24 V DC', 12, '#fff', 'middle', 800) + t(304, 132, tr2('24 V supply', 'مصدر 24 فولت'), 9, '#273049', 'middle', 800);
        s += rr(66, 144, 68, 54, 5, 'dark') + [0, 1, 2].map((i) => screwTop(82 + i * 22, 154, 5)).join('') + t(100, 184, 'K1', 12, '#cfd8ea', 'middle', 800);
        s += t(100, 218, tr2('Contactor', 'كونتاكتور'), 9, '#273049', 'middle', 800);
        s += rr(150, 144, 130, 54, 5, 'steel') + [0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${166 + i * 20}" cy="156" r="4" fill="${i < 3 ? '#4fc16a' : '#2a3248'}"/>`).join('') + t(215, 184, 'PLC', 14, '#273049', 'middle', 800) + t(215, 218, tr2('PLC', 'PLC'), 9, '#273049', 'middle', 800);
        s += [0, 1, 2, 3, 4, 5, 6, 7].map((i) => rr(66 + i * 36, 228, 30, 22, 3, 'brass') + t(81 + i * 36, 243, String(i + 1), 9, '#141a28', 'middle', 800)).join('') + t(210, 276, tr2('Terminals', 'الترمينالات'), 9, '#cfd8ea', 'middle', 800);
        if (o.on) s += rect(52, 18, 316, 264, 4, '#ff6b5e', 'opacity=".12"');
      }
      return s;
    },
    out: (o) => [[210, 244, 'Main isolator handle', 'مقبض الأيزوليتور الرئيسي', 'The only isolation device you lock. It has a door interlock: the door will not open while it is ON.', 'ده جهاز العزل الوحيد اللي بتقفله. عليه إنترلوك للباب: الباب مبيفتحش وهو ON.', 'rotary'], [124, 160, 'Emergency stop', 'زرار الطوارئ', 'It stops the machine fast. It is NOT isolation: it can be released and the machine restarts.', 'بيوقف الماكينة بسرعة. مش عزل: ممكن يتحرر والماكينة تشتغل.', 'estop'], [212, 160, 'Selector', 'السلكتور', 'A control device. Never a safe stop for work.', 'جهاز تحكم. مش إيقاف آمن للشغل.'], [152, 62, 'Display', 'الشاشة', 'It shows the machine state. A dark screen does not mean the panel is dead.', 'بتوري حالة الماكينة. شاشة مطفية مش معناها إن اللوحة ميتة.'], [112, 244, 'Danger label', 'ملصق الخطر', 'It warns that live parts remain inside even with the isolator OFF.', 'بيحذّر إن فيه أجزاء شغالة جوه حتى والأيزوليتور OFF.']],
    in: (o) => [[106, 54, 'Isolator and live terminals', 'الأيزوليتور وأطرافه الشغالة', 'The dashed red box is live all the time. Do not touch the top terminals, even when OFF and locked.', 'المربع الأحمر المتقطع شغال طول الوقت. متلمسش الأطراف اللي فوق حتى لو OFF ومقفول.', 'rotary'], [196, 64, 'Circuit breakers', 'قواطع الدوائر', 'Protect each circuit. Switching them off is not a lock-out of the panel.', 'بتحمي كل دايرة. فصلها مش لوتو للوحة.', 'mcb3'], [340, 64, '24 V supply', 'مصدر الـ24 فولت', 'Its output can hold a charge for some seconds. Its input is on the live side.', 'خرجه ممكن يفضل فيه شحنة كام ثانية. ودخله على الناحية الشغالة.', 'psu24'], [124, 174, 'Contactor', 'الكونتاكتور', 'Switches the motor. It is a control device, not isolation.', 'بيشغّل الموتور. جهاز تحكم مش عزل.', 'contactor'], [262, 160, 'PLC', 'الـPLC', 'Its program can start outputs by itself. Isolate before touching the wiring.', 'برنامجه ممكن يشغّل مخارج لوحده. اعزل قبل ما تلمس التوصيلات.', 'plc'], [352, 222, 'Terminal strip', 'صف الترمينالات', 'Foreign voltage (from another panel) can be present even when this one is dead. Test them.', 'ممكن يكون فيه جهد غريب (من لوحة تانية) حتى لو دي ميتة. اختبرهم.']],
    lock: [['Stop the machine in the normal way, then turn the main isolator to OFF.', 'وقّف الماكينة بالطريقة العادية وبعدين لف الأيزوليتور الرئيسي OFF.'], ['Fit your padlock and tag on the isolator handle.', 'حط قفلك والتاج على مقبض الأيزوليتور.'], ['Open the door, then test with the tester: prove, test, prove. Keep clear of the live top terminals.', 'افتح الباب وبعدين اختبر بالتستر: جرّب، اختبر، جرّب. ابعد عن الأطراف الشغالة اللي فوق.']],
    prove: [['Two-pole tester on every phase and to earth at the load terminals: 0 V.', 'تستر ثنائي على كل فاز ومع الأرضي عند أطراف الحمل: 0 فولت.']],
    mistakes: [['Working inside with only the E-stop pressed.', 'الشغل جوه واللوحة معمولها E-stop بس.'], ['Defeating the door interlock with the isolator ON.', 'تعطيل إنترلوك الباب والأيزوليتور ON.'], ['Touching the top terminals of the isolator.', 'لمس الأطراف اللي فوق في الأيزوليتور.']],
    std: ['IEC 60204-1: the supply disconnecting device and door interlock; EN 50110-1.', 'IEC 60204-1: جهاز فصل المصدر وإنترلوك الباب؛ EN 50110-1.'],
  });
})(typeof window !== 'undefined' ? window : globalThis);
