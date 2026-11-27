/* Mechanical: valves (example component kept first: ball valve) */
(function (g) {
  const EL = g.EL, M = EL.mech;
  M.add({
    id: 'ball_valve', cat: 'valves',
    name: ['Ball valve (2-piece)', 'محبس كورة (قطعتين)'],
    info: {
      what: ['Quarter-turn on/off valve. A drilled ball turns 90° between the seats.', 'محبس فتح وقفل بربع لفة. كورة مخرومة بتلف 90 درجة بين جوانين (سيتات).'],
      use: ['Isolation of utilities: compressed air, chilled water, steam condensate, nitrogen, drains. Not used for fine throttling.', 'عزل المرافق: هوا مضغوط، مية مثلجة، كوندنسيت، نيتروجين، صرف. مش للتحكم الدقيق في الكمية.'],
      how: ['Handle in line with the pipe = open, across the pipe = closed. The PTFE seats wipe the ball and seal against it.', 'الدراع على خط الماسورة يبقى مفتوح، عمودي عليها يبقى مقفول. السيتات التيفلون بتمسح الكورة وبتقفل عليها.'],
      fail: ['Leak through when closed (scratched ball, worn seats from throttling), stem leak at the gland, handle hard to turn (deposits, dry seats).', 'تسريب وهو مقفول (الكورة مخدوشة أو السيتات دابت من الاستخدام كخانق)، تسريب من الجلاند حوالين العمود، الدراع ناشف (رواسب أو سيتات ناشفة).'],
      pm: ['Cycle rarely used valves monthly, tighten the gland nut a little for stem leaks, never use it half open, replace seats and packing with a repair kit.', 'افتح واقفل المحابس اللي مش بتشتغل كل شهر، اربط صامولة الجلاند شوية لو العمود بيسرب، متسيبهوش نص فتحة، غيّر السيتات والحشو بطقم إصلاح.'],
    },
    cut: 'z',
    parts: [
      { id: 'body', name: ['Body', 'الجسم'], role: ['Main pressure shell with one pipe end and the stem neck.', 'جسم الضغط الأساسي وفيه طرف ماسورة ورقبة العمود.'], mat: 'sst', ex: [0, 0, 0],
        s: [{ t: 'lathe', ax: 'x', pts: [[1.25, -4.4], [2.2, -4.4], [2.2, -3.2], [3.4, -3.2], [3.4, 2.6], [2.4, 2.6], [2.4, -1.4], [1.25, -2.2], [1.25, -4.4]] },
          { t: 'hex', r: 2.5, h: 1.4, ri: 2.15, ax: 'x', p: [-3.8, 0, 0] },
          { t: 'cyl', r: 1.45, ri: 0.95, h: 2.0, p: [0, 4.1, 0] }] },
      { id: 'stem', name: ['Stem', 'العمود (الستيم)'], role: ['Turns the ball. Fitted from inside so pressure cannot blow it out.', 'بيلف الكورة. بيتركب من جوه عشان الضغط ميطلعهوش لبره.'], mat: 'steel', ex: [0, 7, 0], cut: false,
        s: [{ t: 'cyl', r: 0.42, h: 4.2, p: [0, 3.9, 0] }, { t: 'cyl', r: 0.9, h: 0.25, p: [0, 3.0, 0] }, { t: 'box', w: 0.5, h: 0.6, d: 0.84, p: [0, 6.1, 0] }] },
      { id: 'seat1', name: ['Seat (inlet)', 'سيت الدخول'], role: ['PTFE ring that seals against the ball.', 'حلقة تيفلون بتقفل على الكورة.'], mat: 'ptfe', ex: [-3.2, 0, 0],
        s: [{ t: 'cyl', r: 2.1, ri: 1.3, h: 0.45, ax: 'x', p: [-1.75, 0, 0] }] },
      { id: 'ball', name: ['Ball', 'الكورة'], role: ['Drilled ball: bore in line = flow, turned 90° = shut.', 'كورة مخرومة: الخرم على الخط يعدّي، تلفها 90 درجة تقفل.'], mat: 'chrome', ex: [0, 0, 7],
        s: [{ t: 'sph', r: 2.05 }, { t: 'cyl', r: 1.22, h: 3.3, ax: 'x', m: 'black' }, { t: 'box', w: 0.55, h: 0.5, d: 0.9, p: [0, 1.95, 0], m: 'black' }] },
      { id: 'seat2', name: ['Seat (outlet)', 'سيت الخروج'], role: ['Second PTFE seat, clamped by the end cap.', 'السيت التاني، بيتزنق بغطا الطرف.'], mat: 'ptfe', ex: [3.4, 0, 0],
        s: [{ t: 'cyl', r: 2.1, ri: 1.3, h: 0.45, ax: 'x', p: [1.75, 0, 0] }] },
      { id: 'endcap', name: ['End cap (2nd piece)', 'غطا الطرف (القطعة التانية)'], role: ['Screws into the body, holds the seats and gives the second pipe end.', 'بيتربط في الجسم وماسك السيتات وفيه طرف الماسورة التاني.'], mat: 'sst', ex: [6.5, 0, 0],
        s: [{ t: 'lathe', ax: 'x', pts: [[1.25, 2.0], [2.35, 2.0], [2.35, 2.6], [3.4, 2.6], [3.4, 3.4], [2.2, 3.4], [2.2, 4.4], [1.25, 4.4], [1.25, 2.0]] },
          { t: 'hex', r: 2.5, h: 1.2, ri: 2.15, ax: 'x', p: [3.9, 0, 0] }] },
      { id: 'packing', name: ['Stem packing', 'حشو العمود (باكنج)'], role: ['PTFE rings squeezed around the stem to stop leaks.', 'حلقات تيفلون متزنقة حوالين العمود تمنع التسريب.'], mat: 'ptfe', ex: [0, 9.5, 0],
        s: [{ t: 'cyl', r: 0.93, ri: 0.44, h: 0.9, p: [0, 4.6, 0] }] },
      { id: 'gland', name: ['Gland nut', 'صامولة الجلاند'], role: ['Compresses the packing. Tighten a little if the stem weeps.', 'بتضغط الحشو. اربطها شوية لو العمود بينقّط.'], mat: 'steel', ex: [0, 11, 0],
        s: [{ t: 'hex', r: 1.15, ri: 0.44, h: 0.55, p: [0, 5.35, 0] }] },
      { id: 'handle', name: ['Lever handle', 'الدراع'], role: ['Shows the position: in line = open.', 'بيوريك الوضع: على الخط يبقى مفتوح.'], mat: 'steel', o: [0, 6.2, 0], ex: [0, 13, 0], cut: false,
        s: [{ t: 'box', w: 9, h: 0.3, d: 1.1, p: [3.9, 0, 0] }, { t: 'box', w: 4.2, h: 0.7, d: 1.4, p: [6.4, 0, 0], m: 'yellow' }, { t: 'hex', r: 0.7, h: 0.5, p: [0, 0.4, 0] }] },
    ],
    steps: ['body', 'stem', 'seat1', 'ball', 'seat2', 'endcap', 'packing', 'gland', 'handle'],
    anim: { mode: 'toggle', label: ['Open / close', 'افتح / اقفل'], parts: { ball: { rot: [0, 1, 0], a: [0, 90] }, stem: { rot: [0, 1, 0], a: [0, 90] }, handle: { rot: [0, 1, 0], a: [0, 90] } } },
    quiz: [
      { q: ['The lever is across the pipe. The valve is…', 'الدراع عمودي على الماسورة. المحبس…'], a: ['Closed', 'مقفول'], w: [['Open', 'مفتوح'], ['Half open', 'نص فتحة'], ['Locked out', 'مقفول بلوتو']] },
      { q: ['Why should a ball valve not be left half open?', 'ليه منسيبش محبس الكورة نص فتحة؟'], a: ['The jet erodes the seats and it will leak when closed', 'الاندفاع بياكل السيتات فيسرّب وهو مقفول'], w: [['The handle breaks', 'الدراع يتكسر'], ['The pipe vibrates loose', 'الماسورة تفك من الرعشة'], ['It is not possible', 'مينفعش أصلاً']] },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* Mechanical: more valves (gate, globe, butterfly, diaphragm, swing check, safety, needle, Y strainer) */
(function (g) {
  const EL = g.EL, M = EL.mech, D = Math.PI / 180;
  // 2D helpers for 'ext' outlines. arc/band/rr give [u, v] points; onX/onY turn world-plane points into shape coords.
  const arc = (r, a0, a1, n, cu, cv) => { const o = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * D; o.push([(cu || 0) + r * Math.cos(a), (cv || 0) + r * Math.sin(a)]); } return o; };
  const band = (r, ri, a0, a1, n) => arc(r, a0, a1, n).concat(arc(ri, a1, a0, n));
  const rr = (u0, u1, v0, v1, r) => [].concat(arc(r, 270, 360, 4, u1 - r, v0 + r), arc(r, 0, 90, 4, u1 - r, v1 - r), arc(r, 90, 180, 4, u0 + r, v1 - r), arc(r, 180, 270, 4, u0 + r, v0 + r));
  const onX = (p) => p.map((q) => [-q[0], -q[1]]); // ext ax 'x': points as [y, z]
  const onY = (p) => p.map((q) => [q[0], -q[1]]); // ext ax 'y': points as [x, z]
  const hX = (y, z, r) => ({ c: [-y, -z], r }), hY = (x, z, r) => ({ c: [x, -z], r });
  const flX = (x, r, ri, h, n, pcd, hr) => ({ t: 'flange', ax: 'x', r, ri, h, holes: n, pcd, hr, p: [x, 0, 0] });
  const C4 = (a, b) => [[a, b], [-a, b], [a, -b], [-a, -b]];

  /* ---------- gate valve: DN50 PN16 flanged, OS&Y rising stem ---------- */
  const gFl = onY(rr(-3.0, 3.0, -5.0, 5.0, 1.0)), gHole = onY(rr(-1.7, 1.7, -3.6, 3.6, 0.6)), gBolt = C4(2.3, 4.4);
  M.add({
    id: 'gate_valve', cat: 'valves',
    name: ['Gate valve (wedge, rising stem)', 'محبس سكينة (بوابة) بعمود طالع'],
    info: {
      what: ['Multi-turn isolation valve. A wedge slides down across the bore and is pressed between two seat rings.', 'محبس عزل بكذا لفة. سكينة (ودج) بتنزل تقفل الماسورة وبتتزنق بين حلقتين سيت.'],
      use: ['Main isolation on cooling water, fire water, city water and HVAC headers where the valve stays fully open or fully closed.', 'عزل رئيسي على مية التبريد ومية الحريق ومية المدينة وخطوط التكييف، اللي المحبس فيها يا مفتوح عالآخر يا مقفول.'],
      how: ['Turning the handwheel turns the bronze yoke nut; the stem cannot turn, so it rises and lifts the wedge clear of the bore. The visible stem height shows the position.', 'لف الطارة بيلف صامولة اليوك البرونز، والعمود مبيلفش فبيطلع لفوق ويرفع السكينة من الماسورة. طول العمود الظاهر بيقولك هو مفتوح ولا مقفول.'],
      fail: ['Gland leak, passing when closed (wedge or seats eroded by throttling, dirt in the seat), stem bent or thread worn, wedge stuck after years without operation.', 'تسريب من الجلاند، بيعدّي وهو مقفول (السكينة أو السيتات اتاكلت من الخنق أو فيه وساخة)، عمود معووج أو سنه داب، سكينة لازقة من قلة التشغيل.'],
      pm: ['Never use it to throttle. Grease the stem thread, exercise it once or twice a year, tighten gland nuts evenly, back the wheel off a quarter turn from fully open.', 'متستخدموش للخنق. شحّم سن العمود، شغّله مرة أو مرتين في السنة، اربط صواميل الجلاند بالتساوي، ولما تفتحه عالآخر ارجع ربع لفة.'],
    },
    cut: 'z',
    parts: [
      { id: 'body', name: ['Body', 'الجسم'], role: ['Cast body with flanges, wedge chamber and the bonnet joint.', 'جسم زهر فيه الفلانشات وغرفة السكينة ووش ركوب البونيه.'], mat: 'cast', ex: [0, 0, 0],
        s: [flX(-7.9, 8.25, 2.5, 1.8, 4, 6.25, 0.9), flX(7.9, 8.25, 2.5, 1.8, 4, 6.25, 0.9),
          { t: 'cyl', ax: 'x', r: 5.1, ri: 2.5, h: 0.2, p: [-8.9, 0, 0] }, { t: 'cyl', ax: 'x', r: 5.1, ri: 2.5, h: 0.2, p: [8.9, 0, 0] },
          { t: 'lathe', ax: 'x', pts: [[2.5, -6.997], [4.6, -6.997], [3.6, -5.6], [3.6, -2.403], [2.5, -2.403], [2.5, -6.997]] },
          { t: 'lathe', ax: 'x', pts: [[2.5, 2.403], [3.6, 2.403], [3.6, 5.6], [4.6, 6.997], [2.5, 6.997], [2.5, 2.403]] },
          { t: 'ext', ax: 'x', d: 0.7, p: [-2.05, 0, 0], pts: onX(rr(-4.6, 6.2, -4.2, 4.2, 0.8)), holes: [hX(0, 0, 2.5)] },
          { t: 'ext', ax: 'x', d: 0.7, p: [2.05, 0, 0], pts: onX(rr(-4.6, 6.2, -4.2, 4.2, 0.8)), holes: [hX(0, 0, 2.5)] },
          { t: 'box', w: 3.4, h: 10.8, d: 0.6, p: [0, 0.8, 3.9] }, { t: 'box', w: 3.4, h: 10.8, d: 0.6, p: [0, 0.8, -3.9] },
          { t: 'box', w: 3.4, h: 0.6, d: 7.2, p: [0, -4.3, 0] },
          { t: 'ext', ax: 'y', d: 0.8, p: [0, 6.6, 0], pts: gFl, holes: [gHole].concat(gBolt.map((q) => hY(q[0], q[1], 0.4))) }] },
      { id: 'seat1', name: ['Seat ring (inlet)', 'حلقة السيت (الدخول)'], role: ['Bronze ring screwed into the body; the wedge face seals on it.', 'حلقة برونز متربطة في الجسم، وش السكينة بيقفل عليها.'], mat: 'bronze', ex: [-12, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 3.1, ri: 2.5, h: 0.5, p: [-1.45, 0, 0] }] },
      { id: 'seat2', name: ['Seat ring (outlet)', 'حلقة السيت (الخروج)'], role: ['Second seat; a wedge seals on both sides.', 'السيت التاني، السكينة بتقفل على الناحيتين.'], mat: 'bronze', ex: [12, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 3.1, ri: 2.5, h: 0.5, p: [1.45, 0, 0] }] },
      { id: 'wedge', name: ['Wedge (gate)', 'السكينة (الودج)'], role: ['Slightly tapered disc that is jammed between the seats when closed.', 'قرص مسلوب شوية بيتزنق بين السيتين وهو مقفول.'], mat: 'castg', ex: [0, 0, 12],
        s: [{ t: 'cyl', ax: 'x', r: 3.2, h: 2.36 }, { t: 'box', w: 1.8, h: 1.6, d: 2.4, p: [0, 3.6, 0] }] },
      { id: 'stem', name: ['Stem (rising, non-turning)', 'العمود (طالع، مبيلفش)'], role: ['T-head hooks into the wedge; the acme thread at the top runs in the yoke nut.', 'راسه T متعشقة في السكينة، والسن اللي فوق ماشي في صامولة اليوك.'], mat: 'steel', ex: [0, 4, 12], cut: false,
        s: [{ t: 'cyl', r: 0.6, h: 21.4, p: [0, 14.3, 0] }, { t: 'box', w: 1.0, h: 0.5, d: 1.4, p: [0, 3.85, 0] }, { t: 'spring', R: 0.62, r: 0.07, turns: 22, len: 9, p: [0, 20.3, 0] }] },
      { id: 'gasket', name: ['Bonnet gasket', 'جوان البونيه'], role: ['Seals the body to bonnet joint.', 'بيقفل الوصلة بين الجسم والبونيه.'], mat: 'grey', ex: [0, 4, 0],
        s: [{ t: 'ext', ax: 'y', d: 0.15, p: [0, 7.075, 0], pts: onY(rr(-2.9, 2.9, -4.9, 4.9, 0.9)), holes: [gHole].concat(gBolt.map((q) => hY(q[0], q[1], 0.4))) }] },
      { id: 'bonnet', name: ['Bonnet and yoke', 'البونيه واليوك'], role: ['Closes the body, holds the stuffing box and carries the yoke that takes the stem thrust.', 'بيقفل الجسم، وفيه صندوق الحشو، واليوك اللي شايل قوة العمود.'], mat: 'cast', ex: [0, 8, 0],
        s: [{ t: 'ext', ax: 'y', d: 0.8, p: [0, 7.55, 0], pts: gFl, holes: [gHole].concat(gBolt.map((q) => hY(q[0], q[1], 0.4))) },
          { t: 'cyl', r: 4.0, ri: 3.5, h: 3.0, sc: [0.52, 1, 1], p: [0, 9.45, 0] },
          { t: 'cyl', r: 4.0, ri: 1.8, h: 0.6, sc: [0.52, 1, 1], p: [0, 11.25, 0] },
          { t: 'cyl', r: 1.7, ri: 1.0, h: 2.6, p: [0, 12.85, 0] },
          { t: 'ext', ax: 'y', d: 0.6, p: [0, 11.85, 0], pts: onY(rr(-3.5, 3.5, -0.9, 0.9, 0.4)), holes: [hY(0, 0, 1.0)] },
          { t: 'cyl', r: 0.22, h: 3.4, p: [-2.0, 13.85, 0], m: 'steel' }, { t: 'cyl', r: 0.22, h: 3.4, p: [2.0, 13.85, 0], m: 'steel' },
          { t: 'box', w: 0.8, h: 10.0, d: 1.4, p: [-3.1, 17.15, 0] }, { t: 'box', w: 0.8, h: 10.0, d: 1.4, p: [3.1, 17.15, 0] },
          { t: 'cyl', r: 1.6, ri: 0.86, h: 1.6, p: [0, 22.6, 0] },
          { t: 'box', w: 2.1, h: 1.2, d: 1.4, p: [-2.45, 22.4, 0] }, { t: 'box', w: 2.1, h: 1.2, d: 1.4, p: [2.45, 22.4, 0] }] },
      { id: 'bonnet_bolts', name: ['Bonnet bolts', 'مسامير البونيه'], role: ['Studs and nuts clamp body, gasket and bonnet. Tighten crosswise.', 'جوايط وصواميل بتزنق الجسم والجوان والبونيه. اربط بالتقاطع.'], mat: 'steel', ex: [0, 2, 0],
        s: [].concat(...gBolt.map((q) => [{ t: 'cyl', r: 0.35, h: 3.0, p: [q[0], 7.1, q[1]] }, { t: 'hex', r: 0.62, h: 0.5, p: [q[0], 5.95, q[1]] }, { t: 'hex', r: 0.62, h: 0.5, p: [q[0], 8.2, q[1]] }])) },
      { id: 'packing', name: ['Gland packing rings', 'حلقات حشو الجلاند'], role: ['Rings squeezed around the stem to stop leaks along it.', 'حلقات متزنقة حوالين العمود تمنع التسريب على طوله.'], mat: 'ptfe', ex: [0, 21, 0],
        s: [12.1, 12.5, 12.9, 13.3].map((y) => ({ t: 'cyl', r: 0.98, ri: 0.62, h: 0.36, p: [0, y, 0] })) },
      { id: 'gland', name: ['Gland follower and flange', 'الجلاند (الضاغط والفلانشة)'], role: ['Pressed down by two nuts to compress the packing.', 'بيتضغط بصامولتين عشان يزنق الحشو.'], mat: 'steel', ex: [0, 23, 0],
        s: [{ t: 'cyl', r: 0.97, ri: 0.65, h: 1.0, p: [0, 14.0, 0] },
          { t: 'ext', ax: 'y', d: 0.5, p: [0, 14.75, 0], pts: onY(rr(-2.5, 2.5, -0.85, 0.85, 0.6)), holes: [hY(0, 0, 0.65), hY(-2.0, 0, 0.28), hY(2.0, 0, 0.28)] },
          { t: 'hex', r: 0.45, ri: 0.27, h: 0.4, p: [-2.0, 15.2, 0] }, { t: 'hex', r: 0.45, ri: 0.27, h: 0.4, p: [2.0, 15.2, 0] }] },
      { id: 'yoke_nut', name: ['Yoke nut (stem nut)', 'صامولة اليوك'], role: ['Bronze nut turned by the handwheel; it drives the stem up and down.', 'صامولة برونز الطارة بتلفها، وهي اللي بتطلّع وتنزّل العمود.'], mat: 'bronze', ex: [0, 18, 0],
        s: [{ t: 'cyl', r: 0.84, ri: 0.62, h: 3.2, p: [0, 23.3, 0] }, { t: 'cyl', r: 1.3, ri: 0.62, h: 0.4, p: [0, 23.6, 0] }] },
      { id: 'handwheel', name: ['Handwheel', 'الطارة (الهاندويل)'], role: ['Turn anticlockwise to open. Keyed to the yoke nut and held by a nut.', 'لف عكس عقارب الساعة يفتح. متركبة على صامولة اليوك ومربوطة بصامولة.'], mat: 'iron', o: [0, 24.35, 0], ex: [0, 20, 0], cut: false,
        s: [{ t: 'torus', R: 4.4, r: 0.38, p: [0, -0.2, 0] }, { t: 'cyl', r: 1.1, ri: 0.86, h: 0.9 },
          { t: 'box', w: 8.6, h: 0.4, d: 0.5, p: [0, -0.1, 0] }, { t: 'box', w: 0.5, h: 0.4, d: 8.6, p: [0, -0.1, 0] },
          { t: 'hex', r: 1.25, ri: 0.98, h: 0.4, p: [0, 0.65, 0], m: 'steel' }] },
    ],
    steps: ['body', 'seat1', 'seat2', 'wedge', 'stem', 'gasket', 'bonnet', 'bonnet_bolts', 'packing', 'gland', 'yoke_nut', 'handwheel'],
    anim: { mode: 'toggle', label: ['Open / close', 'افتح / اقفل'], parts: { wedge: { slide: [0, 5.8, 0] }, stem: { slide: [0, 5.8, 0] }, handwheel: { rot: [0, 1, 0], a: [0, 720] } } },
    quiz: [
      { q: ['How do you know a rising-stem gate valve is open without turning it?', 'تعرف ازاي إن محبس السكينة بالعمود الطالع مفتوح من غير ما تلفه؟'], a: ['The stem sticks out high above the handwheel', 'العمود طالع لفوق عن الطارة'], w: [['The handwheel is warm', 'الطارة سخنة'], ['The gland is leaking', 'الجلاند بيسرّب'], ['The flanges are painted red', 'الفلانشات متدهنة أحمر']] },
      { q: ['Why must a gate valve not be used half open?', 'ليه محبس السكينة ميتسابش نص فتحة؟'], a: ['The flow vibrates the wedge and erodes the wedge and seats', 'السريان بيرعّش السكينة ويآكلها هي والسيتات'], w: [['The stem will turn by itself', 'العمود هيلف لوحده'], ['The bonnet gasket will freeze', 'جوان البونيه هيتجمد'], ['It uses more electricity', 'بيصرف كهربا أكتر']] },
      { q: ['The gland weeps a little. First action?', 'الجلاند بينقّط شوية. أول حاجة تعملها؟'], a: ['Tighten both gland nuts evenly a little', 'اربط صامولتين الجلاند بالتساوي شوية'], w: [['Replace the wedge', 'غيّر السكينة'], ['Tighten the bonnet bolts hard', 'اربط مسامير البونيه جامد'], ['Close the valve fully and leave it', 'اقفله عالآخر وسيبه']] },
    ],
  });

  /* ---------- globe valve: DN25 PN40 flanged, rising stem and handwheel ---------- */
  const glSq = onY(rr(-2.6, 2.6, -2.6, 2.6, 0.6)), glB = C4(1.95, 1.95);
  M.add({
    id: 'globe_valve', cat: 'valves',
    name: ['Globe valve', 'محبس جلوب (كرسي)'],
    info: {
      what: ['Multi-turn valve where a plug lifts off a horizontal seat. The S-shaped passage makes it good for throttling.', 'محبس بكذا لفة، فيه طبة (ديسك) بتترفع من على كرسي أفقي. الممر على شكل S فبيصلح للخنق والتحكم.'],
      use: ['Steam and condensate lines, boiler feed, bypasses of control valves and steam traps, cooling water regulation.', 'خطوط البخار والكوندنسيت، تغذية الغلاية، باي باس محابس التحكم والمصايد، ظبط مية التبريد.'],
      how: ['Flow enters under the seat and lifts through it. Turning the wheel screws the stem up, lifting the plug; a small lift gives fine control.', 'السريان بيدخل تحت الكرسي ويطلع منه لفوق. لف الطارة بيطلّع العمود ويرفع الطبة، ورفعة صغيرة بتدي تحكم دقيق.'],
      fail: ['Seat and plug wire-drawing (leak through), gland leak, stem thread worn, high pressure drop if installed backwards.', 'الكرسي والطبة بيتحفروا خطوط من البخار (تسريب وهو مقفول)، تسريب من الجلاند، سن العمود داب، فقد ضغط عالي لو متركب بالعكس.'],
      pm: ['Install with the body arrow in the flow direction (pressure under the seat). Lap or replace seat and plug together, repack the gland, grease the thread.', 'ركّبه والسهم اللي على الجسم مع اتجاه السريان (الضغط تحت الكرسي). اعمل لابنج أو غيّر الكرسي والطبة مع بعض، غيّر الحشو، وشحّم السن.'],
    },
    cut: 'z',
    parts: [
      { id: 'body', name: ['Body', 'الجسم'], role: ['Globe-shaped body with the internal partition (bridge) that carries the seat.', 'جسم كروي جواه الحاجز اللي شايل الكرسي.'], mat: 'castg', ex: [0, 0, 0],
        s: [flX(-7.0, 5.75, 1.25, 1.6, 4, 4.25, 0.7), flX(7.0, 5.75, 1.25, 1.6, 4, 4.25, 0.7),
          { t: 'cyl', ax: 'x', r: 3.4, ri: 1.25, h: 0.2, p: [-7.9, 0, 0] }, { t: 'cyl', ax: 'x', r: 3.4, ri: 1.25, h: 0.2, p: [7.9, 0, 0] },
          { t: 'lathe', ax: 'x', pts: [[1.25, -6.197], [2.6, -6.197], [2.0, -5.4], [2.0, -3.603], [1.25, -3.603], [1.25, -6.197]] },
          { t: 'lathe', ax: 'x', pts: [[1.25, 3.603], [2.0, 3.603], [2.0, 5.4], [2.6, 6.197], [1.25, 6.197], [1.25, 3.603]] },
          { t: 'ext', ax: 'x', d: 0.6, p: [-3.3, 0, 0], pts: onX(arc(3.6, 0, 350, 35)), holes: [hX(0, 0, 1.25)] },
          { t: 'ext', ax: 'x', d: 0.6, p: [3.3, 0, 0], pts: onX(arc(3.6, 0, 350, 35)), holes: [hX(0, 0, 1.25)] },
          { t: 'ext', ax: 'x', d: 6.0, pts: onX(band(3.6, 3.0, 32, 328, 30)) },
          { t: 'ext', ax: 'y', d: 2.0, p: [0, 3.4, 0], pts: glSq, holes: [hY(0, 0, 1.6)].concat(glB.map((q) => hY(q[0], q[1], 0.3))) },
          { t: 'ext', ax: 'y', d: 0.5, p: [0, 0.25, 0], pts: onY(rr(-1.9, 1.9, -2.7, 2.7, 0.3)), holes: [hY(0, 0, 0.95)] },
          { t: 'ext', ax: 'x', d: 0.5, p: [-1.65, 0, 0], pts: onX(arc(3.0, -85, 85, 16)) },
          { t: 'ext', ax: 'x', d: 0.5, p: [1.65, 0, 0], pts: onX(arc(3.0, 80, 280, 18)) }] },
      { id: 'seat_ring', name: ['Seat ring', 'الكرسي (السيت)'], role: ['Hardened stainless ring screwed into the bridge; the plug closes on it.', 'حلقة ستانلس مقساة متربطة في الحاجز، الطبة بتقفل عليها.'], mat: 'sst', ex: [0, 0, 9],
        s: [{ t: 'cyl', r: 1.15, ri: 0.8, h: 0.3, p: [0, 0.65, 0] }] },
      { id: 'plug', name: ['Plug (disc)', 'الطبة (الديسك)'], role: ['Conical plug on the stem end; it swivels so it seats square.', 'طبة مخروطية في آخر العمود، بتلف حر عشان تقعد مظبوط على الكرسي.'], mat: 'sst', ex: [0, 2, 9],
        s: [{ t: 'lathe', pts: [[0, 0.8], [0.75, 0.8], [1.15, 1.2], [1.15, 1.85], [0.5, 2.0], [0, 2.0], [0, 0.8]] }] },
      { id: 'stem', name: ['Stem', 'العمود'], role: ['Threaded stem: turns and rises in the yoke bush, pushing the plug.', 'عمود مسنن بيلف ويطلع في جلبة اليوك وبيزق الطبة.'], mat: 'steel', ex: [0, 4, 9], cut: false,
        s: [{ t: 'cyl', r: 0.5, h: 14, p: [0, 8.6, 0] }, { t: 'spring', R: 0.52, r: 0.06, turns: 16, len: 4.5, p: [0, 11.9, 0] }] },
      { id: 'gasket', name: ['Bonnet gasket', 'جوان البونيه'], role: ['Spiral-wound gasket between body and bonnet.', 'جوان سبايرال بين الجسم والبونيه.'], mat: 'grey', ex: [0, 3, 0],
        s: [{ t: 'ext', ax: 'y', d: 0.1, p: [0, 4.45, 0], pts: glSq, holes: [hY(0, 0, 1.6)].concat(glB.map((q) => hY(q[0], q[1], 0.3))) }] },
      { id: 'bonnet', name: ['Bonnet and yoke', 'البونيه واليوك'], role: ['Closes the body, holds the packing and the threaded yoke bush for the stem.', 'بيقفل الجسم، وفيه الحشو وجلبة اليوك المسننة للعمود.'], mat: 'castg', ex: [0, 6, 0],
        s: [{ t: 'ext', ax: 'y', d: 0.8, p: [0, 4.9, 0], pts: glSq, holes: [hY(0, 0, 0.9)].concat(glB.map((q) => hY(q[0], q[1], 0.3))) },
          { t: 'cyl', r: 1.4, ri: 0.9, h: 2.7, p: [0, 6.65, 0] },
          { t: 'box', w: 0.6, h: 7.2, d: 1.2, p: [-2.1, 8.9, 0] }, { t: 'box', w: 0.6, h: 7.2, d: 1.2, p: [2.1, 8.9, 0] },
          { t: 'cyl', r: 1.2, ri: 0.52, h: 1.2, p: [0, 13.1, 0], m: 'bronze' },
          { t: 'box', w: 1.6, h: 0.9, d: 1.2, p: [-1.6, 13.0, 0] }, { t: 'box', w: 1.6, h: 0.9, d: 1.2, p: [1.6, 13.0, 0] }] },
      { id: 'bonnet_bolts', name: ['Bonnet bolts', 'مسامير البونيه'], role: ['Four bolts clamp the bonnet. Tighten crosswise.', 'أربع مسامير بتربط البونيه. اربط بالتقاطع.'], mat: 'steel', ex: [0, 4.4, 0],
        s: [].concat(...glB.map((q) => [{ t: 'cyl', r: 0.28, h: 2.2, p: [q[0], 4.3, q[1]] }, { t: 'hex', r: 0.5, h: 0.4, p: [q[0], 5.5, q[1]] }])) },
      { id: 'packing', name: ['Stem packing', 'حشو العمود'], role: ['Packing rings around the stem stop steam leaking out.', 'حلقات حشو حوالين العمود تمنع البخار يطلع.'], mat: 'ptfe', ex: [0, 15, 0],
        s: [5.8, 6.25, 6.7, 7.15].map((y) => ({ t: 'cyl', r: 0.88, ri: 0.52, h: 0.4, p: [0, y, 0] })) },
      { id: 'gland_nut', name: ['Gland nut', 'صامولة الجلاند'], role: ['Screws onto the stuffing box and presses the packing.', 'بتتربط على صندوق الحشو وبتضغط الحشو.'], mat: 'brass', ex: [0, 16, 0],
        s: [{ t: 'cyl', r: 0.88, ri: 0.52, h: 0.65, p: [0, 7.68, 0] }, { t: 'cyl', r: 1.6, ri: 1.4, h: 0.8, p: [0, 7.6, 0] }, { t: 'hex', r: 1.6, ri: 0.6, h: 0.5, p: [0, 8.25, 0] }] },
      { id: 'handwheel', name: ['Handwheel', 'الطارة'], role: ['Fixed on the stem top; it rises with the stem. Clockwise closes.', 'متركبة فوق العمود وبتطلع معاه. مع عقارب الساعة يقفل.'], mat: 'red', o: [0, 14.6, 0], ex: [0, 11, 0], cut: false,
        s: [{ t: 'torus', R: 3.2, r: 0.3 }, { t: 'cyl', r: 0.8, ri: 0.5, h: 0.7 }].concat([90, 210, 330].map((a) => ({ t: 'box', w: 2.6, h: 0.3, d: 0.4, rot: [0, a, 0], p: [1.8 * Math.cos(a * D), 0, -1.8 * Math.sin(a * D)] })), [{ t: 'hex', r: 0.7, h: 0.4, p: [0, 0.6, 0], m: 'steel' }]) },
    ],
    steps: ['body', 'seat_ring', 'plug', 'stem', 'gasket', 'bonnet', 'bonnet_bolts', 'packing', 'gland_nut', 'handwheel'],
    anim: { mode: 'toggle', label: ['Open / close', 'افتح / اقفل'], parts: { plug: { slide: [0, 0.7, 0] }, stem: { slide: [0, 0.7, 0], rot: [0, 1, 0], a: [0, 540] }, handwheel: { slide: [0, 0.7, 0], rot: [0, 1, 0], a: [0, 540] } } },
    quiz: [
      { q: ['Which valve is better for throttling steam: gate or globe?', 'أنهي أحسن لخنق البخار: السكينة ولا الجلوب؟'], a: ['Globe', 'الجلوب'], w: [['Gate', 'السكينة'], ['Both the same', 'الاتنين زي بعض'], ['Neither can be used on steam', 'ولا واحد ينفع على البخار']] },
      { q: ['The arrow on a globe valve body shows…', 'السهم اللي على جسم محبس الجلوب معناه…'], a: ['Flow direction: pressure enters under the seat', 'اتجاه السريان: الضغط يدخل تحت الكرسي'], w: [['The way to turn the wheel', 'اتجاه لف الطارة'], ['Where to lift it from', 'تشيله منين'], ['The drain side', 'ناحية الصرف']] },
    ],
  });

  /* ---------- butterfly valve: DN100 wafer, lever with notch plate ---------- */
  const notch = [[-3.5, -3.5], [3.5, -3.5]];
  notch.push([7.5 * Math.cos(-8 * D), 7.5 * Math.sin(-8 * D)]);
  for (let i = 0; i <= 9; i++) { const t = i * 10; [[7.5, t - 1.6], [6.9, t - 1.6], [6.9, t + 1.6], [7.5, t + 1.6]].forEach((q) => notch.push([q[0] * Math.cos(q[1] * D), q[0] * Math.sin(q[1] * D)])); }
  notch.push([7.5 * Math.cos(98 * D), 7.5 * Math.sin(98 * D)], [-3.5, 3.5]);
  const bfB = C4(2.47, 2.47);
  M.add({
    id: 'butterfly_valve', cat: 'valves',
    name: ['Butterfly valve (wafer, lever)', 'محبس فراشة (ويفر، بدراع)'],
    info: {
      what: ['Quarter-turn valve: a thin disc on a shaft turns 90° inside a rubber-lined ring. Short and light for big pipes.', 'محبس ربع لفة: قرص رفيع على عمود بيلف 90 درجة جوه حلقة مبطنة كاوتش. قصير وخفيف للمواسير الكبيرة.'],
      use: ['Chilled and cooling water, AHU coils, cooling towers, purified-water pretreatment and large air ducts.', 'مية التبريد والمية المثلجة، كويلات الـ AHU، أبراج التبريد، المعالجة الأولية للمية، ودكتات الهوا الكبيرة.'],
      how: ['Disc edge pressed into the EPDM liner = tight shut-off. Lever across the pipe = closed, in line = open. The notch plate holds the lever at 10° steps.', 'حرف القرص بيضغط في بطانة الـ EPDM فيقفل محكم. الدراع عمودي على الماسورة مقفول، وعلى خطها مفتوح. لوحة السنون بتمسك الدراع كل 10 درجات.'],
      fail: ['Liner torn or swollen (passing, stiff lever), shaft leak at the neck, disc edge damaged, liner pulled out by wrong flange gaskets.', 'البطانة مقطوعة أو منفوخة (بيعدّي أو الدراع ناشف)، تسريب من الرقبة عند العمود، حرف القرص مضروب، البطانة اتسحبت بسبب جوانات فلانشات غلط.'],
      pm: ['Install between flanges with the disc slightly open and no extra gaskets (the liner is the gasket). Centre it on the bolts, cycle it regularly.', 'ركّبه بين الفلانشات والقرص مفتوح سنة ومن غير جوانات زيادة (البطانة هي الجوان). سنتره على المسامير، وحرّكه كل فترة.'],
    },
    cut: 'z',
    parts: [
      { id: 'body', name: ['Body', 'الجسم'], role: ['Wafer ring clamped between the pipe flanges, with the shaft neck and ISO top pad.', 'حلقة ويفر بتتزنق بين فلانشات الماسورة، فيها رقبة العمود وقاعدة التركيب ISO.'], mat: 'cast', ex: [0, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 8.0, ri: 5.9, h: 4.6 },
          { t: 'cyl', r: 1.7, ri: 0.95, h: 4.8, p: [0, 10.0, 0] }, { t: 'cone', r1: 1.7, r2: 2.6, h: 0.8, p: [0, 7.9, 0] },
          { t: 'ext', ax: 'y', d: 0.9, p: [0, 12.85, 0], pts: onY(rr(-3.5, 3.5, -3.5, 3.5, 1.0)), holes: [hY(0, 0, 0.95)].concat(bfB.map((q) => hY(q[0], q[1], 0.4))) },
          { t: 'cyl', r: 1.5, ri: 0.95, h: 2.4, p: [0, -8.8, 0] }, { t: 'cyl', r: 1.5, h: 0.4, p: [0, -10.2, 0] }] },
      { id: 'liner', name: ['Liner (seat)', 'البطانة (السيت)'], role: ['EPDM sleeve: the seat for the disc and the gasket on both flange faces.', 'جلبة EPDM: هي السيت بتاع القرص وهي الجوان على وشين الفلانشة.'], mat: 'epdm', ex: [-11, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 5.92, ri: 5.0, h: 5.0 }, { t: 'cyl', ax: 'x', r: 7.0, ri: 5.0, h: 0.2, p: [-2.4, 0, 0] }, { t: 'cyl', ax: 'x', r: 7.0, ri: 5.0, h: 0.2, p: [2.4, 0, 0] }] },
      { id: 'bushings', name: ['Shaft bushings', 'جلب العمود'], role: ['Bronze bushes guide the shaft at top and bottom.', 'جلب برونز بتوجّه العمود فوق وتحت.'], mat: 'bronze', ex: [0, 0, 10],
        s: [{ t: 'cyl', r: 0.93, ri: 0.77, h: 1.6, p: [0, 9.0, 0] }, { t: 'cyl', r: 0.93, ri: 0.77, h: 1.6, p: [0, -8.6, 0] }] },
      { id: 'disc', name: ['Disc', 'القرص (الفراشة)'], role: ['Stainless lens-shaped disc pinned to the shaft.', 'قرص ستانلس على شكل عدسة متثبت في العمود بتيلة.'], mat: 'sst', ex: [11, 0, 0],
        s: [{ t: 'lathe', ax: 'x', pts: [[0, -1.0], [1.6, -0.9], [3.6, -0.55], [4.97, -0.2], [4.97, 0.2], [3.6, 0.55], [1.6, 0.9], [0, 1.0], [0, -1.0]] },
          { t: 'cyl', r: 1.15, h: 9.8 }, { t: 'cyl', ax: 'z', r: 0.18, h: 2.6, p: [0, 3.2, 0], m: 'black' }, { t: 'cyl', ax: 'z', r: 0.18, h: 2.6, p: [0, -3.2, 0], m: 'black' }] },
      { id: 'shaft', name: ['Shaft', 'العمود'], role: ['Turns the disc; square top end takes the lever or an actuator.', 'بيلف القرص، وطرفه المربع فوق بيركب عليه الدراع أو الأكتيواتور.'], mat: 'sst', ex: [0, 0, 13], cut: false,
        s: [{ t: 'cyl', r: 0.75, h: 23.4, p: [0, 2.1, 0] }, { t: 'box', w: 1.06, h: 1.6, d: 1.06, p: [0, 14.6, 0] }] },
      { id: 'stem_seals', name: ['Shaft O-rings', 'أورينجات العمود'], role: ['Two O-rings in the neck keep water from leaking up the shaft.', 'أورينجين في الرقبة يمنعوا المية تطلع على العمود.'], mat: 'epdm', ex: [0, 0, 10], cut: false,
        s: [{ t: 'torus', R: 0.84, r: 0.09, p: [0, 11.0, 0] }, { t: 'torus', R: 0.84, r: 0.09, p: [0, 11.6, 0] }] },
      { id: 'notch_plate', name: ['Notch plate', 'لوحة السنون (الإندكس)'], role: ['Toothed plate: the lever latch drops into a notch every 10°.', 'لوحة مسننة: سقاطة الدراع بتنزل في سنة كل 10 درجات.'], mat: 'steel', ex: [0, 4, 0],
        s: [{ t: 'ext', ax: 'y', d: 0.3, p: [0, 13.45, 0], pts: onY(notch), holes: [hY(0, 0, 0.95)].concat(bfB.map((q) => hY(q[0], q[1], 0.4))) }] },
      { id: 'lever', name: ['Lever with latch', 'الدراع بالسقاطة'], role: ['Squeeze the trigger to lift the latch, turn, release to lock. Parallel to the disc.', 'اضغط الزناد عشان ترفع السقاطة، لف، وسيب عشان يقفل. موازي للقرص.'], mat: 'steel', o: [0, 14.4, 0], ex: [0, 8, 0], cut: false,
        s: [{ t: 'box', w: 2.0, h: 1.0, d: 2.2, p: [0, 0, 0.3] }, { t: 'box', w: 1.0, h: 0.4, d: 20, p: [0, 0.3, 11] },
          { t: 'box', w: 1.6, h: 1.3, d: 7, p: [0, 0.35, 18.5], m: 'red' }, { t: 'box', w: 0.6, h: 0.3, d: 5, p: [0, -0.35, 12] },
          { t: 'box', w: 0.5, h: 1.1, d: 0.4, p: [0, -0.65, 7.2] }, { t: 'hex', r: 0.8, h: 0.5, p: [0, 0.75, 0] }] },
    ],
    steps: ['body', 'liner', 'bushings', 'disc', 'shaft', 'stem_seals', 'notch_plate', 'lever'],
    anim: { mode: 'toggle', label: ['Open / close', 'افتح / اقفل'], parts: { disc: { rot: [0, 1, 0], a: [0, 90] }, shaft: { rot: [0, 1, 0], a: [0, 90] }, lever: { rot: [0, 1, 0], a: [0, 90] } } },
    quiz: [
      { q: ['The lever is in line with the pipe. The butterfly valve is…', 'الدراع على خط الماسورة. محبس الفراشة…'], a: ['Open', 'مفتوح'], w: [['Closed', 'مقفول'], ['Half open', 'نص فتحة'], ['Out of the notch', 'خارج من السنة']] },
      { q: ['Fitting a wafer butterfly valve: what about flange gaskets?', 'وانت بتركب محبس فراشة ويفر: الجوانات بتاعة الفلانشة؟'], a: ['None: the rubber liner seals on the flanges', 'ولا حاجة: البطانة الكاوتش بتقفل على الفلانشات'], w: [['Two thick gaskets each side', 'جوانين تخان في كل ناحية'], ['Paper gaskets with grease', 'جوانات ورق بشحم'], ['Thread tape on the faces', 'شريط تفلون على الوشوش']] },
      { q: ['Why is the disc slightly open when the valve is bolted in?', 'ليه القرص بيبقى مفتوح سنة وانت بتربط المحبس؟'], a: ['So the flanges do not crush the disc edge into the liner', 'عشان الفلانشات متكبسش حرف القرص في البطانة'], w: [['To vent air', 'عشان يطلع الهوا'], ['To check the lever', 'عشان تجرب الدراع'], ['It is not needed', 'مش لازم']] },
    ],
  });

  /* ---------- diaphragm valve: sanitary weir type, DN25 tri-clamp, 316L ---------- */
  // body centre built from slices along X: each slice is the block section with the flow channel; the channel floor rises over the weir
  const dvSec = (hb) => {
    const o = [[2.0, -3.0], [-2.4, -3.0], [-2.4, 3.0], [2.0, 3.0], [2.0, 2.2]];
    if (hb >= 0) return o.concat([[hb, 2.2], [hb, -2.2], [2.0, -2.2]]);
    const a1 = Math.acos(hb / 1.1) / D;
    return o.concat([[0, 2.2]], arc(1.1, 90, a1, 8), arc(1.1, 360 - a1, 270, 8), [[0, -2.2], [2.0, -2.2]]);
  };
  const dvXs = [0.45, 0.8, 1.15, 1.5, 1.85, 2.2, 2.8], dvHb = (x) => (x <= 0.45 ? 0.55 : Math.max(-1.1, 0.55 - (x - 0.45) * 0.892));
  const dvSlices = [{ t: 'ext', ax: 'x', d: 0.897, pts: onX(dvSec(0.55)) }];
  for (let i = 0; i < dvXs.length - 1; i++) { const a = dvXs[i], b = dvXs[i + 1], hb = dvHb((a + b) / 2); for (const sg of [-1, 1]) dvSlices.push({ t: 'ext', ax: 'x', d: b - a - 0.003, p: [sg * (a + b) / 2, 0, 0], pts: onX(dvSec(hb)) }); }
  const dvDia = onY(rr(-2.75, 2.75, -2.15, 2.15, 0.6)), dvB = C4(2.4, 2.6);
  M.add({
    id: 'diaphragm_valve', cat: 'valves',
    name: ['Diaphragm valve (sanitary, weir type)', 'محبس دايافرام صحي (نوع الوير)'],
    info: {
      what: ['A flexible diaphragm is pressed down onto a weir in the body. The fluid only touches the polished body and the diaphragm.', 'دايافرام مرن بيتضغط لتحت على وير (حاجز) في الجسم. السائل بيلمس الجسم المصقول والدايافرام بس.'],
      use: ['Purified water and WFI loops, CIP/SIP lines, product transfer and sampling points in pharma. Mounted at an angle so it drains fully.', 'لوبات المية المنقاة (PW) والـ WFI، خطوط CIP/SIP، نقل المنتج ونقط العينات في الأدوية. بيتركب مايل عشان يصفّي خالص.'],
      how: ['Turning the handwheel drives the stem and compressor down; the compressor pushes the PTFE/EPDM diaphragm onto the weir. No stem packing touches the fluid.', 'لف الطارة بينزّل العمود والكومبريسور، والكومبريسور بيضغط الدايافرام PTFE/EPDM على الوير. مفيش حشو عمود بيلمس السائل.'],
      fail: ['Diaphragm cracked or creased (leak at the bonnet joint or through the weir), PTFE face cold-flowed after SIP, bonnet bolts loosened by heat cycles, compressor stud pulled out.', 'الدايافرام مشروخ أو متكسّر (تسريب من وصلة البونيه أو من على الوير)، وش الـ PTFE اتفرطح بعد التعقيم بالبخار، مسامير البونيه فكت من التسخين والتبريد، مسمار الكومبريسور اتخلع.'],
      pm: ['Change diaphragms on a schedule (after a set number of SIP cycles). Re-torque bonnet bolts cold after the first SIP, do not over-close, check the leak hole on the bonnet.', 'غيّر الدايافرام بجدول (بعد عدد معين من دورات SIP). اربط مسامير البونيه وهي باردة بعد أول SIP، متزودش في القفل، وبص على فتحة التسريب في البونيه.'],
    },
    cut: 'z',
    parts: [
      { id: 'body', name: ['Body with weir', 'الجسم بالوير'], role: ['Forged 316L body, polished inside, with the weir and tri-clamp ferrule ends.', 'جسم 316L مطروق مصقول من جوه، فيه الوير وأطراف تراي كلامب.'], mat: 'sst', ex: [0, 0, 0],
        s: dvSlices.concat([
          { t: 'ext', ax: 'x', d: 0.4, p: [-3.0, 0, 0], pts: onX(rr(-2.4, 2.0, -3.0, 3.0, 0.4)), holes: [hX(0, 0, 1.1)] },
          { t: 'ext', ax: 'x', d: 0.4, p: [3.0, 0, 0], pts: onX(rr(-2.4, 2.0, -3.0, 3.0, 0.4)), holes: [hX(0, 0, 1.1)] },
          { t: 'lathe', ax: 'x', pts: [[1.1, 3.2], [1.27, 3.2], [1.27, 5.0], [1.6, 5.45], [2.52, 5.6], [2.52, 5.95], [1.1, 5.95], [1.1, 3.2]] },
          { t: 'lathe', ax: 'x', pts: [[1.1, -5.95], [2.52, -5.95], [2.52, -5.6], [1.6, -5.45], [1.27, -5.0], [1.27, -3.2], [1.1, -3.2], [1.1, -5.95]] }]) },
      { id: 'ptfe_face', name: ['Diaphragm PTFE face', 'وش الدايافرام PTFE'], role: ['Wetted PTFE layer that seals on the weir.', 'طبقة PTFE اللي بتلمس السائل وبتقفل على الوير.'], mat: 'ptfe', ex: [0, 5, 0],
        s: [{ t: 'ext', ax: 'y', d: 0.15, p: [0, 2.075, 0], pts: dvDia }] },
      { id: 'epdm_backing', name: ['Diaphragm EPDM backing', 'ضهر الدايافرام EPDM'], role: ['Rubber cushion behind the PTFE, with the threaded stud for the compressor.', 'مخدة كاوتش ورا الـ PTFE وفيها المسمار اللي بيتربط في الكومبريسور.'], mat: 'epdm', ex: [0, 6.5, 0],
        s: [{ t: 'ext', ax: 'y', d: 0.3, p: [0, 2.3, 0], pts: dvDia }, { t: 'cyl', r: 0.25, h: 0.8, p: [0, 2.85, 0], m: 'steel' }] },
      { id: 'compressor', name: ['Compressor', 'الكومبريسور (الضاغط)'], role: ['Shaped pusher that presses the diaphragm evenly onto the weir.', 'ضاغط متشكل بيكبس الدايافرام بالتساوي على الوير.'], mat: 'castg', ex: [0, 8, 0],
        s: [{ t: 'lathe', pts: [[0, 2.45], [1.9, 2.45], [2.1, 2.7], [2.1, 3.3], [0.9, 3.4], [0.9, 4.6], [0, 4.6], [0, 2.45]] }] },
      { id: 'stem', name: ['Stem', 'العمود'], role: ['Threaded stem; the handwheel nut drives it up and down.', 'عمود مسنن، صامولة الطارة بتطلّعه وتنزّله.'], mat: 'sst', ex: [0, 8, 5], cut: false,
        s: [{ t: 'cyl', r: 0.5, h: 5.8, p: [0, 6.5, 0] }, { t: 'spring', R: 0.52, r: 0.06, turns: 12, len: 3.0, p: [0, 7.4, 0] }] },
      { id: 'bonnet', name: ['Bonnet', 'البونيه'], role: ['Stainless housing that clamps the diaphragm rim and guides the compressor.', 'جسم ستانلس بيزنق حرف الدايافرام وبيوجّه الكومبريسور.'], mat: 'sst', ex: [0, 12, 0],
        s: [{ t: 'ext', ax: 'y', d: 0.6, p: [0, 2.75, 0], pts: onY(rr(-3.1, 3.1, -3.1, 3.1, 0.6)), holes: [hY(0, 0, 2.3)].concat(dvB.map((q) => hY(q[0], q[1], 0.33))) },
          { t: 'cyl', r: 2.8, ri: 2.3, h: 2.6, p: [0, 4.35, 0] }, { t: 'cyl', r: 2.8, ri: 0.6, h: 0.5, p: [0, 5.9, 0] }, { t: 'cyl', r: 1.1, ri: 0.52, h: 1.6, p: [0, 6.95, 0] }] },
      { id: 'handwheel', name: ['Handwheel', 'الطارة'], role: ['Non-rising wheel with the threaded nut inside. Clockwise closes.', 'طارة مبتطلعش وجواها الصامولة المسننة. مع عقارب الساعة يقفل.'], mat: 'blue', o: [0, 8.6, 0], ex: [0, 13, 0], cut: false,
        s: [{ t: 'lathe', pts: [[0.53, -0.8], [2.9, -0.65], [3.2, -0.35], [3.2, 0.3], [2.9, 0.55], [1.3, 0.8], [0.53, 0.8], [0.53, -0.8]] },
          { t: 'vanes', n: 12, r1: 3.0, r2: 3.35, h: 0.5, curve: 0, thick: 0.3 }] },
      { id: 'indicator', name: ['Position indicator', 'مبين الوضع'], role: ['Red cap on the stem top: up = open, hidden = closed.', 'غطا أحمر فوق العمود: طالع = مفتوح، مستخبي = مقفول.'], mat: 'red', ex: [0, 15, 0],
        s: [{ t: 'cyl', r: 0.45, h: 0.6, p: [0, 9.7, 0] }] },
      { id: 'bonnet_bolts', name: ['Bonnet bolts', 'مسامير البونيه'], role: ['Four bolts clamp the diaphragm between bonnet and body. Torque crosswise, cold.', 'أربع مسامير بتزنق الدايافرام بين البونيه والجسم. اربط بالتقاطع وهو بارد.'], mat: 'steel', ex: [0, 24, 0],
        s: [].concat(...dvB.map((q) => [{ t: 'cyl', r: 0.3, h: 2.6, p: [q[0], 1.9, q[1]] }, { t: 'hex', r: 0.55, h: 0.45, p: [q[0], 3.275, q[1]] }])) },
      { id: 'clamp_gasket', name: ['Tri-clamp gasket', 'جوان التراي كلامب'], role: ['EPDM gasket between the two ferrule faces.', 'جوان EPDM بين وشين الفيرول.'], mat: 'white', ex: [5, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.45, ri: 1.1, h: 0.3, p: [6.1, 0, 0] }] },
      { id: 'clamp', name: ['Tri-clamp', 'كلامب التراي كلامب'], role: ['Hinged clamp squeezes the two ferrules and the gasket together by hand.', 'كلامب بمفصلة بيزنق الفيرولين والجوان مع بعض باليد.'], mat: 'sst', ex: [9, 0, 0],
        s: [{ t: 'torus', ax: 'x', R: 2.75, r: 0.42, p: [6.1, 0, 0] }, { t: 'box', w: 0.6, h: 0.8, d: 0.8, p: [6.1, -3.1, 0] },
          { t: 'cyl', ax: 'z', r: 0.2, h: 1.8, p: [6.1, 3.15, 0] }, { t: 'box', w: 0.4, h: 1.2, d: 1.8, p: [6.1, 3.9, 0] }] },
    ],
    steps: ['body', 'ptfe_face', 'epdm_backing', 'compressor', 'stem', 'bonnet', 'handwheel', 'indicator', 'bonnet_bolts', 'clamp_gasket', 'clamp'],
    anim: { mode: 'toggle', label: ['Close / open', 'اقفل / افتح'], parts: { ptfe_face: { slide: [0, -1.45, 0] }, epdm_backing: { slide: [0, -1.45, 0] }, compressor: { slide: [0, -1.45, 0] }, stem: { slide: [0, -1.45, 0] }, indicator: { slide: [0, -1.45, 0] }, handwheel: { rot: [0, 1, 0], a: [0, -720] } } },
    quiz: [
      { q: ['Why is the diaphragm valve preferred on a WFI loop?', 'ليه محبس الدايافرام هو المفضل على لوب الـ WFI؟'], a: ['No dead pockets and no stem packing touching the water; it drains and sterilises well', 'مفيش جيوب ميتة ولا حشو عمود بيلمس المية، وبيصفّي ويتعقم كويس'], w: [['It is the cheapest valve', 'أرخص محبس'], ['It opens fastest', 'أسرع واحد يفتح'], ['It needs no maintenance', 'مش محتاج صيانة']] },
      { q: ['Water drips from the small hole in the bonnet. This means…', 'فيه مية بتنقّط من الخرم الصغير في البونيه. ده معناه…'], a: ['The diaphragm is cracked: replace it', 'الدايافرام مشروخ: غيّره'], w: [['Normal condensation', 'تكثيف عادي'], ['The handwheel is loose', 'الطارة سايبة'], ['The clamp gasket leaks', 'جوان الكلامب بيسرّب']] },
    ],
  });

  /* ---------- swing check valve: DN50 PN16 flanged, bolted cover ---------- */
  const scTop = onY(rr(-3.3, 3.3, -3.8, 3.8, 0.5)), scHole = onY(rr(-2.4, 2.4, -3.1, 3.1, 0.5)), scB = C4(2.85, 3.45), scPin = [-2.2, 3.1, 0];
  M.add({
    id: 'swing_check_valve', cat: 'valves',
    name: ['Swing check valve', 'محبس عدم رجوع (سوينج)'],
    info: {
      what: ['Non-return valve: a hinged disc swings open with forward flow and falls shut on the seat when flow stops or reverses.', 'محبس عدم رجوع: ديسك على مفصلة بيتفتح مع السريان وبيقع يقفل على الكرسي لما السريان يقف أو يرجع.'],
      use: ['Pump discharges, cooling water and condensate returns, parallel pumps, to stop back flow and reverse spinning of pumps.', 'طرد الطلمبات، رجوع مية التبريد والكوندنسيت، الطلمبات اللي شغالة على التوازي، عشان يمنع الرجوع ولف الطلمبة بالعكس.'],
      how: ['Flow pressure lifts the disc about its hinge pin. Weight and back pressure close it. Works horizontal, or vertical with upward flow only.', 'ضغط السريان بيرفع الديسك حوالين بنز المفصلة. وزنه والضغط الراجع بيقفلوه. يشتغل أفقي، أو رأسي والسريان طالع لفوق بس.'],
      fail: ['Water hammer slam on pump stop, disc stuck open by dirt, worn hinge pin (disc misses the seat and passes), cover gasket leak.', 'خبطة (واتر هامر) لما الطلمبة تقف، ديسك معلق مفتوح من الوساخة، بنز المفصلة داب (الديسك ميقعدش على الكرسي فيعدّي)، تسريب من جوان الغطا.'],
      pm: ['Fit with the arrow in the flow direction, about 5 pipe diameters away from the pump. Open the cover to check pin, disc nut and seat.', 'ركّبه والسهم مع اتجاه السريان وعلى بعد حوالي 5 أقطار من الطلمبة. افتح الغطا وافحص البنز وصامولة الديسك والكرسي.'],
    },
    cut: 'z',
    parts: [
      { id: 'body', name: ['Body', 'الجسم'], role: ['Cast body with flanges and a large top opening for the disc.', 'جسم زهر بفلانشات وفتحة كبيرة من فوق للديسك.'], mat: 'cast', ex: [0, 0, 0],
        s: [flX(-8.9, 8.25, 2.5, 1.8, 4, 6.25, 0.9), flX(8.9, 8.25, 2.5, 1.8, 4, 6.25, 0.9),
          { t: 'lathe', ax: 'x', pts: [[2.5, -7.997], [4.4, -7.997], [3.5, -6.8], [3.5, -3.603], [2.5, -3.603], [2.5, -7.997]] },
          { t: 'lathe', ax: 'x', pts: [[2.5, 3.603], [3.5, 3.603], [3.5, 6.8], [4.4, 7.997], [2.5, 7.997], [2.5, 3.603]] },
          { t: 'ext', ax: 'x', d: 0.6, p: [-3.3, 0, 0], pts: onX(arc(4.6, 0, 350, 35)), holes: [hX(0, 0, 2.5)] },
          { t: 'ext', ax: 'x', d: 0.6, p: [3.3, 0, 0], pts: onX(arc(4.6, 0, 350, 35)), holes: [hX(0, 0, 2.5)] },
          { t: 'ext', ax: 'x', d: 5.994, pts: onX(band(4.6, 4.0, 50, 310, 30)) },
          { t: 'ext', ax: 'y', d: 2.6, p: [0, 3.7, 0], pts: scTop, holes: [scHole].concat(scB.map((q) => hY(q[0], q[1], 0.3))) },
          { t: 'cone', r1: 0.001, r2: 0.6, h: 1.0, ax: 'x', p: [1.0, 3.7, 3.85], m: 'white' }, { t: 'box', w: 2.6, h: 0.3, d: 0.1, p: [-0.8, 3.7, 3.85], m: 'white' }] },
      { id: 'seat_ring', name: ['Seat ring', 'حلقة الكرسي'], role: ['Bronze seat on the inlet side; the disc closes against it.', 'كرسي برونز ناحية الدخول، الديسك بيقفل عليه.'], mat: 'bronze', ex: [-14, 0, 0],
        s: [{ t: 'cyl', ax: 'x', r: 3.2, ri: 2.5, h: 0.4, p: [-2.8, 0, 0] }] },
      { id: 'disc', name: ['Disc', 'الديسك'], role: ['Heavy disc hanging on the arm; it covers the seat when closed.', 'ديسك تقيل متعلق في الدراع، بيغطي الكرسي وهو مقفول.'], mat: 'castg', o: scPin, ex: [0, 8, 0],
        s: [{ t: 'cyl', ax: 'x', r: 2.95, h: 0.8, p: [0, -3.1, 0] }, { t: 'cyl', ax: 'x', r: 0.75, h: 0.7, p: [0.75, -3.1, 0] }, { t: 'hex', ax: 'x', r: 0.7, h: 0.4, p: [1.3, -3.1, 0], m: 'steel' }] },
      { id: 'hinge_arm', name: ['Hinge arm', 'دراع المفصلة'], role: ['Carries the disc and swings on the hinge pin.', 'شايل الديسك وبيتمرجح على بنز المفصلة.'], mat: 'steel', o: scPin, ex: [0, 12, 0],
        s: [{ t: 'cyl', ax: 'z', r: 0.65, ri: 0.42, h: 1.8 }, { t: 'box', w: 0.5, h: 3.2, d: 1.0, p: [0.8, -1.6, 0] }] },
      { id: 'hinge_pin', name: ['Hinge pin', 'بنز المفصلة'], role: ['Pin through the body bosses, sealed by two plugs.', 'بنز معدّي في بوزات الجسم ومقفول بطبتين.'], mat: 'sst', ex: [0, 12, 8],
        s: [{ t: 'cyl', ax: 'z', r: 0.4, h: 7.4, p: scPin }, { t: 'hex', ax: 'z', r: 0.7, h: 0.4, p: [-2.2, 3.1, 4.0] }, { t: 'hex', ax: 'z', r: 0.7, h: 0.4, p: [-2.2, 3.1, -4.0] }] },
      { id: 'gasket', name: ['Cover gasket', 'جوان الغطا'], role: ['Seals the cover joint.', 'بيقفل وصلة الغطا.'], mat: 'grey', ex: [0, 15.5, 0],
        s: [{ t: 'ext', ax: 'y', d: 0.12, p: [0, 5.06, 0], pts: scTop, holes: [scHole].concat(scB.map((q) => hY(q[0], q[1], 0.3))) }] },
      { id: 'cover', name: ['Cover', 'الغطا'], role: ['Bolted cover: remove it to inspect the disc without taking the valve out.', 'غطا بمسامير: تفكه تفحص الديسك من غير ما تفك المحبس من الخط.'], mat: 'cast', ex: [0, 18, 0],
        s: [{ t: 'ext', ax: 'y', d: 1.0, p: [0, 5.62, 0], pts: scTop, holes: scB.map((q) => hY(q[0], q[1], 0.3)) }, { t: 'box', w: 4.0, h: 0.5, d: 0.8, p: [0, 6.35, 0] }] },
      { id: 'cover_bolts', name: ['Cover bolts', 'مسامير الغطا'], role: ['Four bolts hold the cover. Tighten crosswise.', 'أربع مسامير ماسكة الغطا. اربط بالتقاطع.'], mat: 'steel', ex: [0, 22, 0],
        s: [].concat(...scB.map((q) => [{ t: 'cyl', r: 0.28, h: 2.4, p: [q[0], 4.9, q[1]] }, { t: 'hex', r: 0.5, h: 0.4, p: [q[0], 6.32, q[1]] }])) },
    ],
    steps: ['body', 'seat_ring', 'disc', 'hinge_arm', 'hinge_pin', 'gasket', 'cover', 'cover_bolts'],
    anim: { mode: 'toggle', label: ['Flow on / off', 'سريان / وقوف'], parts: { disc: { rot: [0, 0, 1], a: [0, 55] }, hinge_arm: { rot: [0, 0, 1], a: [0, 55] } } },
    quiz: [
      { q: ['A swing check valve is fitted in a vertical pipe with flow going down. Result?', 'محبس عدم رجوع سوينج متركب في ماسورة رأسية والسريان نازل لتحت. النتيجة؟'], a: ['The disc hangs open and does not stop back flow', 'الديسك يفضل مفتوح ومش هيمنع الرجوع'], w: [['It works normally', 'يشتغل عادي'], ['The pump trips', 'الطلمبة تفصل'], ['The cover leaks', 'الغطا يسرّب']] },
      { q: ['After the pump stops, the pump turns backwards. Most likely?', 'بعد ما الطلمبة تقف بتلف بالعكس. الأغلب إيه؟'], a: ['The check valve disc is stuck open or worn', 'ديسك محبس عدم الرجوع معلق مفتوح أو دايب'], w: [['Wrong motor rotation', 'اتجاه الموتور غلط'], ['Low suction pressure', 'ضغط السحب واطي'], ['The coupling is loose', 'الكوبلنج سايب']] },
    ],
  });

  /* ---------- safety valve: spring-loaded, angle body, 1/2" x 3/4", with lifting lever ---------- */
  M.add({
    id: 'safety_valve', cat: 'valves',
    name: ['Safety valve (spring PRV with lever)', 'صمام أمان (بسوستة وذراع رفع)'],
    info: {
      what: ['Self-acting valve that opens when the pressure under the disc beats the spring force, then recloses after the pressure drops.', 'صمام بيشتغل لوحده: يفتح لما الضغط تحت الديسك يغلب قوة السوستة، ويقفل تاني لما الضغط ينزل.'],
      use: ['Steam boilers and headers, air receivers, compressors, autoclaves, pressure vessels, clean-steam generators.', 'غلايات وخطوط البخار، تانكات الهوا، الكمبروسرات، الأوتوكلاف، أوعية الضغط، مولدات البخار النظيف.'],
      how: ['The nozzle pressure pushes the disc up against the spring. At set pressure it lifts; the huddling skirt makes it pop open fully. Outlet is sideways (angle body). The lever lifts it by hand to test.', 'ضغط النوزل بيزق الديسك لفوق ضد السوستة. عند ضغط الضبط يرفع، والجيبة اللي حوالين الديسك بتخليه يفتح مرة واحدة. الخروج من الجنب (جسم زاوية). الذراع بيرفعه باليد للاختبار.'],
      fail: ['Simmering or passing below set pressure (dirty or damaged seat), stuck closed (corrosion, paint, no testing), set pressure drifted, outlet pipe blocked or not drained.', 'بيرشح أو بيعدّي قبل ضغط الضبط (الكرسي وسخ أو مضروب)، لازق ومبيفتحش (صدا أو دهان أو مفيش اختبار)، ضغط الضبط اتغير، ماسورة الخروج مسدودة أو مش بتصفّي.'],
      pm: ['Never adjust or block it on site: set and seal it in a calibrated workshop. Lift the lever regularly under pressure, keep the seal and tag, pipe the outlet to a safe place.', 'متظبطوش ولا تسده في الموقع: يتظبط ويتختم في ورشة معايرة. ارفع الذراع كل فترة وهو تحت ضغط، حافظ على الختم والتيكت، ووصّل الخروج لمكان آمن.'],
    },
    cut: 'z',
    parts: [
      { id: 'body', name: ['Body (angle)', 'الجسم (زاوية)'], role: ['Bronze angle body: inlet from below, outlet to the side.', 'جسم برونز زاوية: الدخول من تحت والخروج من الجنب.'], mat: 'bronze', ex: [0, 0, 0],
        s: [{ t: 'ext', ax: 'y', d: 3.2, p: [0, 1.0, 0], pts: onY(band(2.0, 1.45, 40, 320, 28)) },
          { t: 'ext', ax: 'x', d: 0.45, p: [1.7, 1.0, 0], pts: onX(rr(-1.6, 1.6, -1.35, 1.35, 0.1)), holes: [hX(0, 0, 0.95)] },
          { t: 'lathe', ax: 'x', p: [0, 1.0, 0], pts: [[0.95, 1.926], [1.45, 1.926], [1.45, 3.0], [0.95, 3.0], [0.95, 1.926]] },
          { t: 'hex', ax: 'x', r: 1.65, ri: 0.95, h: 1.2, p: [3.6, 1.0, 0] },
          { t: 'cyl', r: 2.0, ri: 0.82, h: 0.6, p: [0, -0.9, 0] }, { t: 'cyl', r: 1.3, ri: 0.82, h: 0.8, p: [0, -1.6, 0] },
          { t: 'hex', r: 2.05, ri: 1.2, h: 0.6, p: [0, 2.9, 0] }] },
      { id: 'nozzle', name: ['Nozzle (inlet and seat)', 'النوزل (الدخول والكرسي)'], role: ['Screwed-in nozzle: its thread is the inlet and its top lip is the seat.', 'نوزل متربط: سنه هو الدخول وحرفه اللي فوق هو الكرسي.'], mat: 'sst', ex: [0, -5, 0],
        s: [{ t: 'lathe', pts: [[0.6, -2.0], [0.8, -2.0], [0.8, -0.6], [0.95, -0.6], [0.95, -0.1], [0.75, 0.2], [0.6, 0.2], [0.6, -2.0]] },
          { t: 'cyl', r: 1.05, ri: 0.6, h: 1.6, p: [0, -3.4, 0] }, { t: 'spring', R: 1.06, r: 0.05, turns: 8, len: 1.5, p: [0, -3.4, 0] },
          { t: 'hex', r: 1.5, ri: 0.6, h: 0.6, p: [0, -2.3, 0] }] },
      { id: 'disc', name: ['Disc and holder', 'الديسك والحامل'], role: ['Disc seals on the nozzle; the holder skirt forms the huddling chamber that makes it pop.', 'الديسك بيقفل على النوزل، وجيبة الحامل بتعمل غرفة بتخليه ينط يفتح.'], mat: 'sst', ex: [0, 0, 6],
        s: [{ t: 'cyl', r: 0.85, h: 0.3, p: [0, 0.35, 0] }, { t: 'cyl', r: 1.25, ri: 1.0, h: 0.75, p: [0, 0.175, 0], m: 'steel' }, { t: 'cyl', r: 1.25, h: 0.35, p: [0, 0.725, 0], m: 'steel' }] },
      { id: 'spindle', name: ['Spindle', 'العمود (السبندل)'], role: ['Transfers the spring force to the disc; the lift nut on top lets the lever raise it.', 'بينقل قوة السوستة للديسك، وصامولة الرفع اللي فوق بتخلي الذراع يرفعه.'], mat: 'steel', ex: [0, 1.0, 10], cut: false,
        s: [{ t: 'cyl', r: 0.25, h: 10.1, p: [0, 5.95, 0] }, { t: 'hex', r: 0.45, h: 0.4, p: [0, 10.8, 0] }] },
      { id: 'lower_washer', name: ['Lower spring plate', 'وردة السوستة التحتانية'], role: ['Seats the spring on the disc holder.', 'بتقعّد السوستة على حامل الديسك.'], mat: 'steel', ex: [0, 2.5, 6],
        s: [{ t: 'cyl', r: 1.05, ri: 0.27, h: 0.25, p: [0, 1.025, 0] }] },
      { id: 'spring', name: ['Spring', 'السوستة'], role: ['Its compression sets the opening pressure.', 'ضغطها هو اللي بيحدد ضغط الفتح.'], mat: 'steel', ex: [0, 3.5, 6], cut: false,
        s: [{ t: 'spring', R: 0.82, r: 0.17, turns: 7, len: 5.4, p: [0, 3.85, 0] }] },
      { id: 'upper_washer', name: ['Upper spring plate', 'وردة السوستة الفوقانية'], role: ['The adjusting screw presses on it.', 'مسمار الضبط بيضغط عليها.'], mat: 'steel', ex: [0, 5, 6],
        s: [{ t: 'cyl', r: 1.05, ri: 0.27, h: 0.25, p: [0, 6.675, 0] }] },
      { id: 'bonnet', name: ['Bonnet (spring housing)', 'البونيه (بيت السوستة)'], role: ['Screws onto the body and encloses the spring.', 'بيتربط على الجسم وقافل على السوستة.'], mat: 'bronze', ex: [0, 3, 0],
        s: [{ t: 'hex', r: 2.05, ri: 1.2, h: 0.6, p: [0, 3.5, 0] }, { t: 'cyl', r: 1.45, ri: 1.15, h: 4.8, p: [0, 6.2, 0] }, { t: 'cyl', r: 1.45, ri: 0.57, h: 0.5, p: [0, 8.85, 0] }] },
      { id: 'adj_screw', name: ['Adjusting screw', 'مسمار الضبط'], role: ['Screwing it in compresses the spring and raises the set pressure.', 'لما تربطه بيضغط السوستة ويعلّي ضغط الفتح.'], mat: 'steel', ex: [0, 7, 0], cut: false,
        s: [{ t: 'cyl', r: 0.55, ri: 0.3, h: 3.4, p: [0, 8.5, 0] }, { t: 'spring', R: 0.56, r: 0.04, turns: 10, len: 2.6, p: [0, 8.6, 0] }] },
      { id: 'lock_nut', name: ['Lock nut', 'صامولة الزرجنة'], role: ['Locks the adjusting screw at the set point.', 'بتزرجن مسمار الضبط على الضبطة.'], mat: 'steel', ex: [0, 9, 0],
        s: [{ t: 'hex', r: 0.9, ri: 0.65, h: 0.4, p: [0, 9.3, 0] }] },
      { id: 'cap', name: ['Cap (sealed)', 'الطاقية (متختومة)'], role: ['Covers the adjustment; it is wire-sealed after setting.', 'بتغطي الضبط وبتتختم بسلك بعد الضبط.'], mat: 'bronze', ex: [0, 11, 0],
        s: [{ t: 'lathe', pts: [[1.45, 8.3], [1.7, 8.3], [1.7, 9.3], [1.15, 9.75], [1.15, 12.3], [0, 12.3], [0, 12.0], [0.9, 12.0], [0.9, 9.6], [1.45, 9.2], [1.45, 8.3]] },
          { t: 'box', w: 0.6, h: 0.7, d: 0.25, p: [-0.7, 12.6, 0.5] }, { t: 'box', w: 0.6, h: 0.7, d: 0.25, p: [-0.7, 12.6, -0.5] }] },
      { id: 'lever', name: ['Lifting lever', 'ذراع الرفع (للاختبار)'], role: ['Raise it to lift the disc by hand and prove the valve is free.', 'ارفعه عشان ترفع الديسك باليد وتتأكد إن الصمام مش لازق.'], mat: 'steel', o: [-0.7, 12.6, 0], ex: [0, 13.5, 0], cut: false,
        s: [{ t: 'cyl', ax: 'z', r: 0.15, h: 1.3 }, { t: 'box', w: 6.5, h: 0.35, d: 0.45, p: [3.25, 0.25, 0] }, { t: 'sph', r: 0.35, p: [6.5, 0.25, 0], m: 'red' },
          { t: 'box', w: 0.25, h: 1.9, d: 0.4, p: [0.15, -1.0, 0] }, { t: 'box', w: 1.1, h: 0.22, d: 0.3, p: [0.75, -2.09, 0.4] }, { t: 'box', w: 1.1, h: 0.22, d: 0.3, p: [0.75, -2.09, -0.4] }] },
    ],
    steps: ['body', 'nozzle', 'disc', 'spindle', 'lower_washer', 'spring', 'upper_washer', 'bonnet', 'adj_screw', 'lock_nut', 'cap', 'lever'],
    anim: { mode: 'toggle', label: ['Lift / reseat', 'ارفع / يقفل'], parts: { disc: { slide: [0, 0.3, 0] }, spindle: { slide: [0, 0.3, 0] }, lower_washer: { slide: [0, 0.3, 0] }, lever: { rot: [0, 0, 1], a: [0, 14] } } },
    quiz: [
      { q: ['A safety valve simmers at normal pressure. Correct action?', 'صمام الأمان بيرشح على الضغط العادي. التصرف الصح؟'], a: ['Report it and have it serviced and reset in a workshop', 'بلّغ وابعته ورشة يتصان ويتظبط'], w: [['Tighten the adjusting screw', 'اربط مسمار الضبط'], ['Plug the outlet', 'اسد الخروج'], ['Tie the lever down', 'اربط الذراع لتحت']] },
      { q: ['What sets the opening pressure?', 'إيه اللي بيحدد ضغط الفتح؟'], a: ['Spring compression from the adjusting screw', 'ضغط السوستة بمسمار الضبط'], w: [['Lever position', 'وضع الذراع'], ['Outlet pipe size', 'مقاس ماسورة الخروج'], ['Cap tightness', 'ربط الطاقية']] },
      { q: ['Why lift the test lever only with pressure above about 75% of set?', 'ليه ترفع ذراع الاختبار والضغط فوق حوالي 75% من الضبط؟'], a: ['So the flow blows dirt off the seat and the disc does not drag on it', 'عشان السريان ينضف الكرسي والديسك ميتسحبش عليه'], w: [['To save steam', 'عشان توفر بخار'], ['It is not allowed at all', 'ممنوع خالص'], ['To reset the set point', 'عشان تصفّر الضبط']] },
    ],
  });

  /* ---------- needle valve: 1/4" instrument valve, bar-stock body ---------- */
  // body = front/back skins + a middle layer (z ±0.45) that carries the drilled passages, so the section shows them
  const nvMid = [
    [[-2.4, -1.1], [2.4, -1.1], [2.4, -0.55], [1.2, -0.55], [1.2, 0.25], [0.45, 0.25], [0.45, 0.2], [0.15, 0.2], [0.15, -0.45], [-1.2, -0.45], [-1.2, -0.55], [-2.4, -0.55]],
    [[-2.4, 0.55], [-1.2, 0.55], [-1.2, -0.15], [-0.15, -0.15], [-0.15, 0.2], [-0.45, 0.2], [-0.45, 1.1], [-2.4, 1.1]],
    [[0.45, 0.55], [2.4, 0.55], [2.4, 1.1], [0.45, 1.1]]];
  M.add({
    id: 'needle_valve', cat: 'valves',
    name: ['Needle valve (instrument)', 'محبس إبرة (للأجهزة)'],
    info: {
      what: ['Small multi-turn valve with a long tapered needle in a small orifice, for fine flow control and isolation of instruments.', 'محبس صغير بكذا لفة، فيه إبرة مسلوبة طويلة في خرم صغير، للتحكم الدقيق وعزل الأجهزة.'],
      use: ['Pressure gauge and transmitter isolation, sampling points on PW and steam, purge and gas flow setting, manifolds.', 'عزل عدادات الضغط والترانسميترات، نقط العينات على المية والبخار، ظبط تدفق البيرج والغازات، المانيفولد.'],
      how: ['Turning the handle screws the stem; the needle point moves in and out of the seat orifice so the opening changes very gradually.', 'لف الذراع بيحرّك العمود على السن، فطرف الإبرة بيدخل ويطلع من خرم الكرسي والفتحة بتتغير بالراحة جداً.'],
      fail: ['Seat damaged by over-tightening (passes when closed), packing leak at the stem, blocked orifice, galled threads on stainless.', 'الكرسي اتضرب من الربط الزيادة (بيعدّي وهو مقفول)، تسريب من الحشو عند العمود، الخرم مسدود، السن بيمسك ويتقطع (galling) في الستانلس.'],
      pm: ['Close finger-tight only, never with a wrench on the handle. Adjust the packing nut a little if it weeps, keep the bonnet lock tight, use thread sealant on NPT ports.', 'اقفله بإيدك بس، أبداً متستخدمش مفتاح على الذراع. اربط صامولة الحشو شوية لو بينقّط، خلي البونيه مربوط، واستخدم مانع تسريب على سن الـ NPT.'],
    },
    cut: 'z',
    parts: [
      { id: 'body', name: ['Body (bar stock)', 'الجسم (بار مصمت)'], role: ['Stainless block with female ports, the drilled passages and the seat orifice.', 'بلوك ستانلس فيه مداخل سن داخلي والممرات المخرومة وخرم الكرسي.'], mat: 'sst', ex: [0, 0, 0],
        s: [{ t: 'box', w: 4.8, h: 2.2, d: 0.647, p: [0, 0, 0.7765] }, { t: 'box', w: 4.8, h: 2.2, d: 0.647, p: [0, 0, -0.7765] }].concat(
          nvMid.map((pts) => ({ t: 'ext', ax: 'z', d: 0.9, pts })),
          [-2.43, 2.43].map((x) => ({ t: 'ext', ax: 'x', d: 0.06, p: [x, 0, 0], pts: onX(rr(-1.1, 1.1, -1.1, 1.1, 0.05)), holes: [hX(0, 0, 0.55)] })),
          [-1.8, 1.8].map((x) => ({ t: 'spring', ax: 'x', R: 0.56, r: 0.04, turns: 6, len: 1.1, p: [x, 0, 0] }))) },
      { id: 'bonnet_seal', name: ['Bonnet seal', 'جوان البونيه'], role: ['PTFE ring that seals the bonnet thread.', 'حلقة تيفلون بتقفل سن البونيه.'], mat: 'ptfe', ex: [0, 2.5, 0],
        s: [{ t: 'cyl', r: 0.75, ri: 0.43, h: 0.08, p: [0, 1.14, 0] }] },
      { id: 'bonnet', name: ['Bonnet', 'البونيه'], role: ['Screwed into the body; holds the stem thread and the packing.', 'متربط في الجسم، فيه سن العمود والحشو.'], mat: 'sst', ex: [0, 3.5, 0],
        s: [{ t: 'cyl', r: 0.42, ri: 0.32, h: 0.6, p: [0, 0.85, 0] }, { t: 'hex', r: 0.95, ri: 0.36, h: 0.8, p: [0, 1.58, 0] }, { t: 'cyl', r: 0.75, ri: 0.5, h: 1.2, p: [0, 2.58, 0] }] },
      { id: 'stem', name: ['Stem with needle tip', 'العمود بطرف الإبرة'], role: ['Fine-thread stem; the long taper meters the flow.', 'عمود سنه ناعم، والسلبة الطويلة بتظبط التدفق.'], mat: 'sst', ex: [0, 2, 3.5], cut: false,
        s: [{ t: 'cone', r1: 0.3, r2: 0.02, h: 0.6, p: [0, 0.25, 0] }, { t: 'cyl', r: 0.3, h: 4.4, p: [0, 2.75, 0] }, { t: 'spring', R: 0.31, r: 0.03, turns: 12, len: 1.0, p: [0, 1.5, 0] }] },
      { id: 'packing', name: ['Stem packing', 'حشو العمود'], role: ['PTFE packing below the gland nut seals the stem.', 'حشو تيفلون تحت صامولة الجلاند بيقفل على العمود.'], mat: 'ptfe', ex: [0, 5.5, 0],
        s: [{ t: 'cyl', r: 0.49, ri: 0.31, h: 0.8, p: [0, 2.6, 0] }] },
      { id: 'packing_nut', name: ['Packing nut', 'صامولة الحشو'], role: ['Tighten a little to stop a stem leak.', 'اربطها شوية توقف تسريب العمود.'], mat: 'sst', ex: [0, 6.5, 0],
        s: [{ t: 'hex', r: 0.85, ri: 0.36, h: 0.55, p: [0, 3.455, 0] }, { t: 'cyl', r: 0.48, ri: 0.31, h: 0.2, p: [0, 3.1, 0] }] },
      { id: 'handle', name: ['T-bar handle', 'الذراع (T)'], role: ['Fixed to the stem with a set screw; close by hand only.', 'متثبت في العمود بمسمار زنق، يتقفل باليد بس.'], mat: 'sst', o: [0, 4.55, 0], ex: [0, 7, 0], cut: false,
        s: [{ t: 'cyl', r: 0.45, ri: 0.3, h: 0.7 }, { t: 'cyl', ax: 'x', r: 0.18, h: 4.4 }, { t: 'sph', r: 0.3, p: [2.2, 0, 0], m: 'black' }, { t: 'sph', r: 0.3, p: [-2.2, 0, 0], m: 'black' }] },
    ],
    steps: ['body', 'bonnet_seal', 'bonnet', 'stem', 'packing', 'packing_nut', 'handle'],
    anim: { mode: 'toggle', label: ['Open / close', 'افتح / اقفل'], parts: { stem: { slide: [0, 0.45, 0], rot: [0, 1, 0], a: [0, 720] }, handle: { slide: [0, 0.45, 0], rot: [0, 1, 0], a: [0, 720] } } },
    quiz: [
      { q: ['How tight should a needle valve be closed?', 'محبس الإبرة يتقفل قد إيه؟'], a: ['Finger tight: extra force damages the needle and seat', 'بإيدك بس: الزيادة بتبوظ الإبرة والكرسي'], w: [['With a pipe wrench', 'بمفتاح جاز'], ['Until the handle bends', 'لحد ما الذراع يتني'], ['Half a turn past tight', 'نص لفة بعد ما يقفل']] },
      { q: ['Main reason a needle valve gives fine control?', 'السبب الرئيسي إن محبس الإبرة بيدي تحكم دقيق؟'], a: ['Long taper plus fine thread change the gap very slowly', 'السلبة الطويلة والسن الناعم بيغيروا الفتحة بالراحة'], w: [['It has a big bore', 'خرمه واسع'], ['It is quarter-turn', 'ربع لفة'], ['It has a spring', 'فيه سوستة']] },
    ],
  });

  /* ---------- Y strainer: DN50 PN16 flanged, bolted cap with drain plug ---------- */
  // leg axis u points down-stream and down at 45 deg; L(d, w) = point on the section plane, w across the leg
  const yu = [Math.SQRT1_2, -Math.SQRT1_2], yv = [Math.SQRT1_2, Math.SQRT1_2], yP0 = [-2.4, -1.6];
  const L = (d, w) => [yP0[0] + d * yu[0] + w * yv[0], yP0[1] + d * yu[1] + w * yv[1]];
  const L3 = (d, w, z) => L(d, w).concat([z || 0]);
  const yEx = (k) => [k * yu[0], k * yu[1], 0];
  const ySkin = [[-5.0, 2.2], [-4.0, 3.2], [2.2, 3.2], [3.2, 2.2], [3.2, -2.52], L(4.5, 3.2), L(4.5, -3.2), L(0, -3.2), [-5.0, -3.2]];
  const yMid = [
    [[-5.0, 2.5], [-5.0, 3.2], [3.2, 3.2], [3.2, 2.5], [-3.32, 2.5], L(1.0, 2.25), L(1.0, 1.75), [-4.03, 2.5]],
    [[-5.0, -2.5], L(0.7, -2.0), L(1.0, -2.0), L(1.0, -2.6), L(4.5, -2.6), L(4.5, -3.2), L(0, -3.2), [-5.0, -3.2]],
    [[3.2, -2.5], L(4.5, 2.6), L(4.5, 3.2), [3.2, -2.52]]];
  const yLeg = (d, sh) => Object.assign({ rot: [0, 0, 45], p: L3(d, 0) }, sh);
  const yBP = [[2.76, 0], [-2.76, 0], [0, 2.76], [0, -2.76]];
  M.add({
    id: 'y_strainer', cat: 'valves',
    name: ['Y strainer', 'مصفاة Y (فلتر واي)'],
    info: {
      what: ['Pipeline strainer: a cylindrical stainless screen in an inclined leg catches dirt before it reaches pumps, valves and meters.', 'مصفاة على الخط: شبكة ستانلس اسطوانية في رجل مايلة بتمسك الوساخة قبل ما توصل للطلمبات والمحابس والعدادات.'],
      use: ['Before pumps, control valves, steam traps, heat exchangers and flow meters on water, steam and air lines.', 'قبل الطلمبات ومحابس التحكم والمصايد والمبادلات الحرارية وعدادات التدفق على خطوط المية والبخار والهوا.'],
      how: ['Flow enters the open end of the screen, passes out through the mesh and leaves by the outlet. Dirt stays inside the screen and collects at the cap.', 'السريان بيدخل من فتحة الشبكة المفتوحة، يعدّي من الشبكة لبره ويطلع من المخرج. الوساخة بتفضل جوه الشبكة وتتجمع عند الغطا.'],
      fail: ['Blocked screen (high differential pressure, pump starving, low flow), torn screen (dirt passes), cap gasket leak, seized drain plug.', 'الشبكة مسدودة (فرق ضغط عالي، الطلمبة بتجوع، تدفق قليل)، شبكة مقطوعة (الوساخة بتعدّي)، تسريب من جوان الغطا، طبة الصرف ماسكة.'],
      pm: ['Isolate and drain before opening. Clean the screen when the differential pressure rises, check the mesh, replace the cap gasket. On steam fit it with the leg on its side to avoid condensate pockets.', 'اعزل وصفّي قبل الفتح. نضف الشبكة لما فرق الضغط يعلى، افحص الشبكة، غيّر جوان الغطا. على البخار ركّبه والرجل نايمة على جنبها عشان ميتجمعش كوندنسيت.'],
    },
    cut: 'z',
    parts: [
      { id: 'body', name: ['Body', 'الجسم'], role: ['Cast body with the inclined screen leg and the inlet partition that holds the screen mouth.', 'جسم زهر فيه الرجل المايلة والحاجز اللي ماسك بوق الشبكة.'], mat: 'cast', ex: [0, 0, 0],
        s: [flX(-10.6, 8.25, 2.5, 1.8, 4, 6.25, 0.9), flX(10.6, 8.25, 2.5, 1.8, 4, 6.25, 0.9),
          { t: 'lathe', ax: 'x', pts: [[2.5, -9.697], [4.4, -9.697], [3.2, -8.5], [3.2, -5.003], [2.5, -5.003], [2.5, -9.697]] },
          { t: 'lathe', ax: 'x', pts: [[2.5, 3.203], [3.2, 3.203], [3.2, 8.5], [4.4, 9.697], [2.5, 9.697], [2.5, 3.203]] },
          { t: 'ext', ax: 'z', d: 0.897, p: [0, 0, 2.7515], pts: ySkin }, { t: 'ext', ax: 'z', d: 0.897, p: [0, 0, -2.7515], pts: ySkin }].concat(
          yMid.map((pts) => ({ t: 'ext', ax: 'z', d: 4.6, pts })),
          [yLeg(7.05, { t: 'cyl', r: 3.2, ri: 2.6, h: 5.094 }), yLeg(10.0, { t: 'flange', r: 4.6, ri: 2.6, h: 0.8, holes: 4, pcd: 3.9, hr: 0.35 }),
            { t: 'cone', r1: 0.001, r2: 0.6, h: 1.0, ax: 'x', p: [0.2, 1.6, 3.25], m: 'white' }, { t: 'box', w: 2.6, h: 0.3, d: 0.1, p: [-1.6, 1.6, 3.25], m: 'white' }]) },
      { id: 'screen', name: ['Screen (stainless mesh)', 'الشبكة (ستانلس)'], role: ['Perforated or mesh cylinder; its open end sits in the body partition.', 'اسطوانة شبكة أو مخرّمة، بوقها المفتوح قاعد في حاجز الجسم.'], mat: 'sst', ex: yEx(10.5), cut: false,
        s: [yLeg(5.0, { t: 'spring', R: 2.0, r: 0.035, turns: 55, len: 7.6 }), yLeg(5.0, { t: 'rollers', n: 16, R: 2.0, r: 0.03, l: 7.6 }),
          yLeg(1.2, { t: 'cyl', r: 2.06, ri: 1.9, h: 0.4 }), yLeg(8.8, { t: 'cyl', r: 2.06, ri: 1.9, h: 0.4 })] },
      { id: 'gasket', name: ['Cap gasket', 'جوان الغطا'], role: ['Seals the cap to the leg flange.', 'بيقفل الغطا على فلانشة الرجل.'], mat: 'grey', ex: yEx(10),
        s: [yLeg(10.45, { t: 'cyl', r: 3.5, ri: 2.6, h: 0.1 })] },
      { id: 'cap', name: ['Cap (cover)', 'الغطا'], role: ['Bolted cover that holds the screen in place; removed to clean the screen.', 'غطا بمسامير ماسك الشبكة مكانها، بيتفك عشان تنضف الشبكة.'], mat: 'cast', ex: yEx(11),
        s: [yLeg(10.9, { t: 'flange', r: 4.6, h: 0.8, holes: 4, pcd: 3.9, hr: 0.35 }), yLeg(10.2, { t: 'cyl', r: 2.16, ri: 1.9, h: 0.6 }), yLeg(11.7, { t: 'cyl', r: 1.0, ri: 0.45, h: 0.8 })] },
      { id: 'cap_bolts', name: ['Cap bolts', 'مسامير الغطا'], role: ['Four bolts on the cap. Tighten crosswise.', 'أربع مسامير على الغطا. اربط بالتقاطع.'], mat: 'steel', ex: yEx(14.5),
        s: [].concat(...yBP.map((q) => [{ t: 'cyl', r: 0.3, h: 2.0, rot: [0, 0, 45], p: L3(10.45, q[0], q[1]) }, { t: 'hex', r: 0.55, h: 0.4, rot: [0, 0, 45], p: L3(11.5, q[0], q[1]) }])) },
      { id: 'drain_plug', name: ['Drain plug', 'طبة الصرف'], role: ['Unscrew to blow down dirt without taking the cap off.', 'فكها عشان تطرد الوساخة من غير ما تفك الغطا.'], mat: 'brass', ex: yEx(15),
        s: [yLeg(11.7, { t: 'cyl', r: 0.45, h: 1.4 }), yLeg(12.35, { t: 'hex', r: 0.7, h: 0.5 })] },
    ],
    steps: ['body', 'screen', 'gasket', 'cap', 'cap_bolts', 'drain_plug'],
    anim: { mode: 'toggle', label: ['Open drain / close', 'افتح الصرف / اقفل'], parts: { drain_plug: { slide: yEx(1.6) } } },
    quiz: [
      { q: ['Pump suction pressure keeps falling; the Y strainer gauge difference is high. Likely?', 'ضغط سحب الطلمبة بينزل، وفرق ضغط المصفاة Y عالي. الأغلب إيه؟'], a: ['Blocked screen: isolate, drain and clean it', 'الشبكة مسدودة: اعزل وصفّي ونضف'], w: [['Torn screen', 'الشبكة مقطوعة'], ['Pump runs too slow', 'الطلمبة بطيئة'], ['Cap gasket leak', 'جوان الغطا بيسرّب']] },
      { q: ['Where does the dirt collect in a Y strainer?', 'الوساخة بتتجمع فين في المصفاة Y؟'], a: ['Inside the screen, towards the cap', 'جوه الشبكة ناحية الغطا'], w: [['Outside the screen near the outlet', 'بره الشبكة جنب المخرج'], ['In the inlet flange', 'في فلانشة الدخول'], ['It passes downstream', 'بتعدّي للخط']] },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
