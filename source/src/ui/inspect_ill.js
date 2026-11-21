/* Illustrated defect gallery for the Inspect tab.
   These are drawn reference pictures, not photographs. Each one shows what the defect looks like next to a healthy part, with a short caption. */
(function (g) {
  const EL = g.EL;
  const ILL = (EL.ill = {});
  const A = (a, b) => [a, b];
  const W = 160, H = 110;
  const frame = (inner, bg) => '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img"><rect width="' + W + '" height="' + H + '" rx="8" fill="' + (bg || '#14233b') + '"/>' + inner + '</svg>';
  const defs = '<defs><radialGradient id="ill_scorch"><stop offset="0" stop-color="#050302" stop-opacity=".95"/><stop offset=".45" stop-color="#2a1608" stop-opacity=".85"/><stop offset="1" stop-color="#6b3b12" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="ill_crust"><stop offset="0" stop-color="#d9f2e3"/><stop offset="1" stop-color="#4fae8a"/></radialGradient>' +
    '<linearGradient id="ill_metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8edf5"/><stop offset="1" stop-color="#8d98ab"/></linearGradient></defs>';
  const put = (id, cap, body, bg) => { ILL[id] = { cap, svg: () => frame(defs + body, bg) }; };

  /* ---- stator end windings (12 arc segments) ---- */
  function stator(cols, extra) {
    let s = '<circle cx="80" cy="55" r="46" fill="#3b4558"/><circle cx="80" cy="55" r="19" fill="#14233b"/>';
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * 2 * Math.PI - Math.PI / 2 + 0.05, a1 = ((i + 1) / 12) * 2 * Math.PI - Math.PI / 2 - 0.05, ro = 42, ri = 24;
      const p = (a, r) => (80 + r * Math.cos(a)).toFixed(1) + ' ' + (55 + r * Math.sin(a)).toFixed(1);
      s += '<path d="M' + p(a0, ro) + ' A' + ro + ' ' + ro + ' 0 0 1 ' + p(a1, ro) + ' L' + p(a1, ri) + ' A' + ri + ' ' + ri + ' 0 0 0 ' + p(a0, ri) + ' Z" fill="' + cols[i] + '" stroke="#0c1423" stroke-width="1"/>';
    }
    return s + (extra || '');
  }
  const Cu = '#c9762f', Bk = '#1b1008', Br = '#5a3216';
  const three = (c) => [c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2]];

  put('wind_all', {
    title: A('Winding evenly burnt', 'الملفات محروقة بالتساوي'),
    look: A('All three phase groups are dark brown or black to the same degree. The varnish is brittle and the smell is sharp.', 'التلات مجموعات غامقة بني أو أسود بنفس الدرجة. الورنيش هش والريحة حادة.'),
    mean: A('Overload, long running on low voltage, blocked cooling or a wrong connection. The motor was hot for a long time.', 'أوفرلود، تشغيل طويل على جهد واطي، تبريد مسدود أو توصيل غلط. الموتور فضل سخن فترة طويلة.'),
  }, stator([Br, Br, Br, Br, Br, Br, Br, Br, Br, Br, Br, Br]));
  put('wind_one', {
    title: A('One phase group burnt', 'مجموعة فاز واحدة محروقة'),
    look: A('One of the three groups (every third coil) is black, the other two still look copper coloured.', 'واحدة من التلات مجموعات (كل كويل تالت) سودا، والاتنين التانيين لسه لونهم نحاسي.'),
    mean: A('Single phasing: the motor ran on two phases and the winding that carried the extra current burnt.', 'فقد فاز: الموتور اشتغل على فازتين والملف اللي شال التيار الزيادة اتحرق.'),
  }, stator(three([Cu, Cu, Bk])));
  put('wind_local', {
    title: A('Local burn on one coil', 'حرق موضعي في كويل'),
    look: A('One coil, or two next to each other, is burnt black. The rest of the winding looks normal.', 'كويل أو اتنين جنب بعض محروقين. باقي الملف شكله طبيعي.'),
    mean: A('Turn-to-turn short: weak insulation, a voltage spike (often from a drive), or moisture.', 'لفات ماسة: عزل ضعيف أو سبايك جهد (غالبا من انفرتر) أو رطوبة.'),
  }, stator([Cu, Cu, Cu, Cu, Bk, Br, Cu, Cu, Cu, Cu, Cu, Cu]));
  put('wind_between', {
    title: A('Burn between two phase groups', 'حرق بين مجموعتين'),
    look: A('The dark patch sits where two different phase groups touch at the end turns.', 'البقعة الغامقة في مكان تلامس مجموعتين مختلفتين عند أطراف اللفات.'),
    mean: A('Phase-to-phase short: the separator paper failed or moved. Common after a spike or a loose winding.', 'ماس بين فازين: ورق العزل بين المجموعات باظ أو اتحرك. شائع بعد سبايك أو ملف سايب.'),
  }, stator([Cu, Cu, Cu, Cu, Bk, Bk, Cu, Cu, Cu, Cu, Cu, Cu]));

  put('capbulge', {
    title: A('Bulged electrolytic capacitor', 'مكثف إلكتروليتي منتفخ'),
    look: A('A healthy can has a flat top with a shallow cross score. A failed one has a domed top, an opened vent and brown residue on the board.', 'المكثف السليم له سطح مستوي وعليه خط خفيف. البايظ سطحه منتفخ والفتحة اتفتحت وفيه بقايا بني على الكارت.'),
    mean: A('Dried out or overheated. Replace it, and check the neighbours and the ripple current.', 'ناشف أو سخن زيادة. غيّره وافحص اللي جنبه وتيار الريبل.'),
  }, '<rect x="8" y="68" width="144" height="34" rx="3" fill="#1f6b43"/>' +
    '<rect x="24" y="30" width="30" height="40" rx="3" fill="#3a5fa8"/><ellipse cx="39" cy="30" rx="15" ry="5" fill="#8fa6d6"/><path d="M32 29l14 3M46 29l-14 3" stroke="#2c4a82" stroke-width="1.3"/><rect x="25" y="36" width="6" height="32" fill="#e6edf7" opacity=".8"/>' +
    '<rect x="98" y="38" width="30" height="32" rx="3" fill="#3a5fa8"/><path d="M98 38Q113 12 128 38Z" fill="#8fa6d6"/><path d="M104 28l9 8 9-8" stroke="#1f3560" stroke-width="1.6" fill="none"/><rect x="99" y="42" width="6" height="26" fill="#e6edf7" opacity=".8"/>' +
    '<path d="M100 70q6 12 22 0q-2 12-10 9q-10 4-12-9z" fill="#8a5a1c"/><path d="M122 62q6 4 2 10" stroke="#8a5a1c" stroke-width="2" fill="none"/>' +
    '<text x="39" y="14" fill="#9fb0cf" font-size="9" text-anchor="middle">OK</text><text x="113" y="14" fill="#ff8a80" font-size="9" text-anchor="middle">!</text>');

  put('burnt', {
    title: A('Burnt component and scorched board', 'قطعة محروقة وكارت متفحم'),
    look: A('A black or brown halo around a part, a split body, a carbonised board and a smell. A good resistor keeps its colour bands.', 'هالة سودا أو بني حوالين القطعة وجسم مشقوق وكارت متفحم وريحة. المقاومة السليمة بتحتفظ بألوانها.'),
    mean: A('That part took too much current or heat. Find what drove it: a short downstream, a failed neighbour, or the wrong value.', 'القطعة دي استحملت تيار أو حرارة زيادة. دوّر على السبب: ماس بعدها أو قطعة جنبها باظت أو قيمة غلط.'),
  }, '<rect x="6" y="14" width="148" height="86" rx="4" fill="#1f6b43"/>' +
    '<path d="M16 30H144M16 84H144" stroke="#d9b350" stroke-width="3"/>' +
    '<circle cx="80" cy="56" r="36" fill="url(#ill_scorch)"/>' +
    '<rect x="52" y="48" width="56" height="16" rx="6" fill="#c9a870"/><rect x="62" y="48" width="5" height="16" fill="#7a3b10"/><rect x="73" y="48" width="5" height="16" fill="#111"/><rect x="84" y="48" width="9" height="16" fill="#050302"/>' +
    '<path d="M86 48l4 6-4 4 4 6" stroke="#000" stroke-width="1.4" fill="none"/>' +
    '<rect x="14" y="42" width="30" height="12" rx="5" fill="#c9a870"/><rect x="20" y="42" width="4" height="12" fill="#7a3b10"/><rect x="27" y="42" width="4" height="12" fill="#2a63c6"/><rect x="34" y="42" width="4" height="12" fill="#d33"/>' +
    '<path d="M70 38q-4-10 2-16M80 36q-4-12 3-20M92 38q-3-9 2-14" stroke="#9fb0cf" stroke-width="2" fill="none" opacity=".45"/>');

  put('solder', {
    title: A('Cracked (cold) solder joint', 'لحام مشروخ (بارد)'),
    look: A('A good joint is shiny and shaped like a small volcano. A cracked one is dull and grainy, with a hairline ring around the pin.', 'اللحام الكويس لامع وشكله زي بركان صغير. المشروخ مطفي وخشن وحوالين الرجل خط شعري.'),
    mean: A('Intermittent contact. It shows up when the board warms up or is tapped. Re-solder with fresh solder and flux.', 'تلامس متقطع. بيظهر لما الكارت يسخن أو تخبط عليه. أعد اللحام بقصدير وفلكس جديد.'),
  }, '<rect x="6" y="16" width="148" height="82" rx="4" fill="#1f6b43"/>' +
    '<circle cx="46" cy="56" r="22" fill="#d9b350"/><path d="M28 62q18-34 36 0q-18 8-36 0z" fill="url(#ill_metal)"/><rect x="43" y="22" width="6" height="40" fill="#9aa3b3"/><ellipse cx="40" cy="52" rx="5" ry="3" fill="#fff" opacity=".7"/>' +
    '<circle cx="116" cy="56" r="22" fill="#d9b350"/><path d="M98 62q18-26 36 0q-18 8-36 0z" fill="#7b7d83"/><rect x="113" y="22" width="6" height="40" fill="#8a8f99"/><circle cx="116" cy="54" r="10" fill="none" stroke="#1a1d24" stroke-width="1.8" stroke-dasharray="3 2"/><path d="M104 62l4-3M126 61l-4-4" stroke="#1a1d24" stroke-width="1.4"/>' +
    '<text x="46" y="94" fill="#cfe" font-size="9" text-anchor="middle">OK</text><text x="116" y="94" fill="#ffb4a8" font-size="9" text-anchor="middle">crack</text>');

  put('corrosion', {
    title: A('Corrosion and crust', 'تآكل وقشرة'),
    look: A('Green, blue or white crystalline crust on pins, pads or screws, often with a sticky film. Healthy contacts are bright metal.', 'قشرة بلورية خضرا أو زرقا أو بيضا على الأطراف أو النقط أو المسامير، وغالبا فيه طبقة لزجة. الأطراف السليمة معدن لامع.'),
    mean: A('Moisture, condensation or leaked chemical. Clean, find the water path, then seal or relocate.', 'رطوبة أو تكثف أو كيماويات. نضّف، ودوّر على مسار المية، وبعدين اعزل أو انقل.'),
  }, '<rect x="6" y="20" width="148" height="70" rx="4" fill="#1d2433"/>' +
    [0, 1, 2, 3, 4].map((i) => '<rect x="' + (18 + i * 27) + '" y="36" width="12" height="42" rx="2" fill="url(#ill_metal)"/>').join('') +
    '<ellipse cx="72" cy="48" rx="13" ry="9" fill="url(#ill_crust)"/><ellipse cx="99" cy="62" rx="12" ry="12" fill="url(#ill_crust)"/><ellipse cx="45" cy="70" rx="9" ry="7" fill="url(#ill_crust)"/><circle cx="126" cy="44" r="7" fill="url(#ill_crust)"/>' +
    '<path d="M60 76q10 10 22 0" stroke="#4fae8a" stroke-width="3" fill="none" opacity=".6"/>');

  put('terminal', {
    title: A('Burnt terminal or loose connection', 'ترمينال محروق أو توصيلة سايبة'),
    look: A('Brown or black insulation near the screw, melted plastic on the terminal block, a discoloured screw head and bright, pitted copper.', 'عزل بني أو أسود جنب المسمار، بلاستيك دايب على الترمينال، رأس مسمار متغير اللون ونحاس متآكل.'),
    mean: A('High resistance at the joint made heat. Cut back, re-terminate and torque the screw to spec.', 'مقاومة عالية في الوصلة عملت حرارة. اقطع وجدد التوصيل واشد المسمار بالعزم.'),
  }, '<rect x="10" y="44" width="140" height="44" rx="5" fill="#cfd5df"/>' +
    [0, 1, 2].map((i) => '<rect x="' + (18 + i * 44) + '" y="50" width="36" height="32" rx="3" fill="#e9edf3"/><circle cx="' + (36 + i * 44) + '" cy="62" r="8" fill="#9aa3b3"/><path d="M' + (31 + i * 44) + ' 62h10" stroke="#555" stroke-width="2"/>').join('') +
    '<ellipse cx="80" cy="60" rx="24" ry="22" fill="url(#ill_scorch)"/><circle cx="80" cy="62" r="8" fill="#3a2a1a"/><path d="M76 62h8" stroke="#000" stroke-width="2"/><path d="M62 74q10 6 22 2" stroke="#6b3b12" stroke-width="5" fill="none"/>' +
    [0, 1, 2].map((i) => '<rect x="' + (30 + i * 44) + '" y="14" width="12" height="32" fill="' + (i === 1 ? '#6b4a2a' : '#d9b350') + '"/>').join('') +
    '<path d="M74 30q-6-8 0-14M86 32q-5-10 2-16" stroke="#9fb0cf" stroke-width="2" fill="none" opacity=".4"/>');

  put('bearing', {
    title: A('Failed bearing', 'رولمان بايظ'),
    look: A('Blue or straw colour on the races, dry black grease or grease thrown outside the housing, rough turning by hand, scored balls.', 'لون أزرق أو قشي على المجاري، شحم أسود ناشف أو شحم مرمي برة البيت، دوران خشن، وبلي مخدوش.'),
    mean: A('Overheating, lost lubrication, misalignment or shaft currents. Replace both bearings and find the cause.', 'سخونة أو فقد تشحيم أو عدم استقامة أو تيارات شافت. غيّر الاتنين وادور على السبب.'),
  }, '<circle cx="80" cy="55" r="44" fill="#8d98ab"/><circle cx="80" cy="55" r="22" fill="#14233b"/>' +
    '<path d="M44 30A44 44 0 0 1 80 11" stroke="#3a6bd6" stroke-width="9" fill="none" opacity=".8"/><path d="M118 82A44 44 0 0 1 90 98" stroke="#d6a43a" stroke-width="9" fill="none" opacity=".75"/>' +
    [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = (i / 8) * 2 * Math.PI; return '<circle cx="' + (80 + 33 * Math.cos(a)).toFixed(1) + '" cy="' + (55 + 33 * Math.sin(a)).toFixed(1) + '" r="6.5" fill="' + (i === 2 ? '#6e7686' : '#dfe5ef') + '"/>'; }).join('') +
    '<path d="M122 60q18 4 20 20q-12 6-22-6z" fill="#2a1d0e" opacity=".9"/>');

  put('rub', {
    title: A('Rotor rub marks', 'علامات احتكاك الروتور'),
    look: A('A bright polished arc on one side of the rotor or the stator bore, scratches, and metal dust. Healthy surfaces are evenly dull.', 'قوس لامع مصقول على جنب من الروتور أو تجويف الاستاتور، خدوش، وتراب معدن. الأسطح السليمة باهتة بالتساوي.'),
    mean: A('Worn bearing, bent shaft, or a loose end shield. The air gap is no longer even.', 'رولمان بايظ أو شافت معوج أو غطا سايب. الفجوة الهوائية بقت مش متساوية.'),
  }, '<circle cx="80" cy="55" r="46" fill="#3b4558"/><circle cx="80" cy="55" r="36" fill="#14233b"/><circle cx="76" cy="57" r="34" fill="#7d8799"/><circle cx="76" cy="57" r="10" fill="#14233b"/>' +
    '<path d="M42 40A34 34 0 0 1 56 28" stroke="#f4f7fb" stroke-width="5" fill="none"/><path d="M40 46l6-3M43 52l6-2M45 36l5-4" stroke="#f4f7fb" stroke-width="1.6"/>');

  put('rotorbars', {
    title: A('Broken rotor bar', 'قضيب روتور مكسور'),
    look: A('Cracks or gaps in the end ring, melted aluminium splashes, and dark burn marks at one bar.', 'شروخ أو فجوات في الحلقة الطرفية، رشات ألومنيوم دايب، وحرق عند قضيب.'),
    mean: A('Repeated hard starts or a high-inertia load. Speed hunts and the current swings.', 'تشغيل شاق متكرر أو حمل ذو قصور ذاتي كبير. السرعة بتتأرجح والتيار بيتذبذب.'),
  }, '<circle cx="80" cy="55" r="46" fill="#aab3c2"/><circle cx="80" cy="55" r="30" fill="#7d8799"/><circle cx="80" cy="55" r="9" fill="#14233b"/>' +
    [...Array(16).keys()].map((i) => { const a = (i / 16) * 2 * Math.PI; const x1 = 80 + 14 * Math.cos(a), y1 = 55 + 14 * Math.sin(a), x2 = 80 + 44 * Math.cos(a), y2 = 55 + 44 * Math.sin(a); return '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="' + (i === 3 ? '#14233b' : '#e4e9f1') + '" stroke-width="' + (i === 3 ? 4 : 3) + '"/>'; }).join('') +
    '<circle cx="' + (80 + 38 * Math.cos(3 / 16 * 2 * Math.PI)).toFixed(1) + '" cy="' + (55 + 38 * Math.sin(3 / 16 * 2 * Math.PI)).toFixed(1) + '" r="7" fill="#2a1608"/><circle cx="118" cy="82" r="3" fill="#e4e9f1"/>');

  put('links', {
    title: A('Star and delta terminal links', 'كبارى النجمة والدلتا'),
    look: A('Left: star, the bottom three terminals are joined by one bar. Right: delta, three links join top and bottom.', 'شمال: نجمة، التلات أطراف اللي تحت متوصلين بشريط واحد. يمين: دلتا، تلات كبارى بين فوق وتحت.'),
    mean: A('Match the nameplate: 230/400 V means star on 400 V, delta on 230 V. Wrong links over-volt or under-volt the windings.', 'طابق اللوحة: 230/400 يعني نجمة على 400 ودلتا على 230. كبارى غلط بتدي جهد زيادة أو أقل للملفات.'),
  }, [0, 1].map((k) => { const ox = k ? 88 : 8; const top = [0, 1, 2].map((i) => '<circle cx="' + (ox + 12 + i * 22) + '" cy="40" r="6" fill="#e0b55a"/>').join(''); const bot = [0, 1, 2].map((i) => '<circle cx="' + (ox + 12 + i * 22) + '" cy="78" r="6" fill="#e0b55a"/>').join(''); const links = k ? [0, 1, 2].map((i) => '<rect x="' + (ox + 8 + i * 22) + '" y="36" width="8" height="46" rx="3" fill="#cfd5df" opacity=".9"/>').join('') : '<rect x="' + (ox + 6) + '" y="74" width="56" height="8" rx="3" fill="#cfd5df" opacity=".9"/>'; return '<rect x="' + ox + '" y="26" width="64" height="66" rx="5" fill="#2b3550"/>' + top + bot + links; }).join('') +
    '<text x="40" y="104" fill="#9fb0cf" font-size="9" text-anchor="middle">Y</text><text x="120" y="104" fill="#9fb0cf" font-size="9" text-anchor="middle">Δ</text>');

  put('fan', {
    title: A('Broken or clogged cooling fan', 'مروحة تبريد مكسورة أو مسدودة'),
    look: A('A missing or cracked blade, a cover full of dust and fluff, fins clogged with dirt, a fan that spins slowly.', 'ريشة ناقصة أو مشروخة، غطا مليان تراب وزغب، زعانف مسدودة، ومروحة بتلف بطيء.'),
    mean: A('Heat cannot leave the machine. Clean or replace, and check the ambient temperature.', 'الحرارة مش عارفة تخرج. نضّف أو غيّر، وافحص الحرارة المحيطة.'),
  }, '<circle cx="80" cy="55" r="46" fill="#2b3550"/><circle cx="80" cy="55" r="40" fill="none" stroke="#5d6c8a" stroke-width="2"/>' +
    [0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * 2 * Math.PI; const len = i === 2 ? 14 : 34; return '<path d="M80 55L' + (80 + len * Math.cos(a)).toFixed(1) + ' ' + (55 + len * Math.sin(a)).toFixed(1) + '" stroke="#cfd5df" stroke-width="9" stroke-linecap="round"/>'; }).join('') +
    '<circle cx="80" cy="55" r="9" fill="#111"/>' + [[50, 80], [112, 36], [100, 84], [58, 30], [124, 62]].map((p) => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="7" fill="#8d8d83" opacity=".7"/>').join(''));

  put('contacts', {
    title: A('Worn or burnt contacts', 'كونتاكتات مستهلكة أو محروقة'),
    look: A('New contacts are smooth, bright silver. Worn ones are pitted, black or blue, with craters and sometimes welded beads.', 'الكونتاكتات الجديدة ناعمة ولامعة. المستهلكة متآكلة وسودا أو زرقا وفيها حفر وأحيانا حبيبات ملحومة.'),
    mean: A('Arcing from switching too much current, low coil voltage chatter, or end of life. Replace the set, never file them.', 'قوس كهربي من تيار زيادة أو رعشة من جهد كويل واطي أو انتهاء العمر. غيّر الطقم ولا تبرده.'),
  }, '<rect x="8" y="20" width="68" height="70" rx="5" fill="#2b3550"/><rect x="84" y="20" width="68" height="70" rx="5" fill="#2b3550"/>' +
    '<rect x="22" y="30" width="40" height="14" rx="3" fill="url(#ill_metal)"/><rect x="22" y="62" width="40" height="14" rx="3" fill="url(#ill_metal)"/>' +
    '<rect x="98" y="30" width="40" height="14" rx="3" fill="#6f7685"/><rect x="98" y="62" width="40" height="14" rx="3" fill="#6f7685"/>' +
    '<circle cx="112" cy="37" r="5" fill="#111"/><circle cx="126" cy="38" r="4" fill="#2a4ba0"/><circle cx="118" cy="69" r="6" fill="#0b0b0b"/><circle cx="132" cy="70" r="3.5" fill="#2a4ba0"/><circle cx="104" cy="70" r="3" fill="#cfd5df"/>' +
    '<text x="42" y="14" fill="#cfe" font-size="9" text-anchor="middle">OK</text><text x="118" y="14" fill="#ffb4a8" font-size="9" text-anchor="middle">worn</text>');

  put('coil', {
    title: A('Burnt coil', 'كويل محروق'),
    look: A('Discoloured or melted bobbin, brittle brown wire insulation, a blister, and a smell. A healthy coil is evenly coloured and firm.', 'بوبينة متغيرة اللون أو دايبة، عزل سلك بني هش، فقاعة، وريحة. الكويل السليم لونه متساوي وصلب.'),
    mean: A('Overvoltage, wrong coil type, or a stuck armature that made the coil carry its inrush current continuously.', 'جهد زيادة أو نوع كويل غلط أو حديدة معلقة خلت الكويل شايل تيار البدء طول الوقت.'),
  }, '<rect x="20" y="30" width="120" height="54" rx="6" fill="#222c42"/><rect x="26" y="22" width="8" height="70" rx="2" fill="#4a5a82"/><rect x="126" y="22" width="8" height="70" rx="2" fill="#4a5a82"/>' +
    [...Array(12).keys()].map((i) => '<path d="M' + (38 + i * 7.2) + ' 32V82" stroke="' + (i > 6 ? '#5a2a10' : '#c9762f') + '" stroke-width="5"/>').join('') +
    '<ellipse cx="108" cy="58" rx="22" ry="26" fill="url(#ill_scorch)"/><path d="M96 46q8-6 16 2q6 10-2 16q-10 4-14-8z" fill="#1b0f06"/>');

  put('igbt', {
    title: A('Burst power module', 'موديول قدرة منفجر'),
    look: A('A crack or a blown hole in the black case, soot around it, melted terminals, and a smell of burnt epoxy.', 'شرخ أو فتحة في الجسم الأسود، سناج حواليه، أطراف دايبة، وريحة إيبوكسي محروق.'),
    mean: A('Short circuit at the output or a gate-drive fault. Check the motor and cable before fitting a new module.', 'ماس في الخرج أو عطل جيت درايفر. افحص الموتور والكابل قبل تركيب موديول جديد.'),
  }, '<rect x="10" y="26" width="140" height="62" rx="5" fill="#1b1f29"/><circle cx="24" cy="38" r="5" fill="#8d98ab"/><circle cx="136" cy="38" r="5" fill="#8d98ab"/><circle cx="24" cy="76" r="5" fill="#8d98ab"/><circle cx="136" cy="76" r="5" fill="#8d98ab"/>' +
    '<ellipse cx="86" cy="56" rx="30" ry="22" fill="url(#ill_scorch)"/><path d="M70 44l14 10-6 8 16 6M84 54l12-14M96 68l10 8" stroke="#000" stroke-width="2" fill="none"/><path d="M80 52l8-2 4 8-8 4z" fill="#d6a43a"/>' +
    '<rect x="44" y="12" width="8" height="14" fill="#d9b350"/><rect x="70" y="12" width="8" height="14" fill="#d9b350"/><rect x="96" y="12" width="8" height="14" fill="#d9b350"/>');

  put('trace', {
    title: A('Lifted or burnt track', 'مسار مرفوع أو محروق'),
    look: A('A copper track that has curled off the board, a black gap in the track, or a pad that came away with the leg.', 'مسار نحاس اتقشر من الكارت أو فجوة سودا في المسار أو نقطة لحام جت مع الرجل.'),
    mean: A('Overcurrent through that track or mechanical damage. Bridge it with a wire jumper and find why it carried too much.', 'تيار زيادة في المسار ده أو ضرر ميكانيكي. عدّيه بسلك وادور ليه شال تيار كتير.'),
  }, '<rect x="6" y="16" width="148" height="82" rx="4" fill="#1f6b43"/><path d="M14 40H60M100 40H146M14 76H146" stroke="#d9b350" stroke-width="5"/>' +
    '<path d="M60 40q10-14 24-6q8 6 16 6" stroke="#d9b350" stroke-width="5" fill="none"/><ellipse cx="80" cy="42" rx="18" ry="10" fill="url(#ill_scorch)"/><circle cx="14" cy="40" r="7" fill="#d9b350"/><circle cx="146" cy="40" r="7" fill="#d9b350"/><circle cx="14" cy="40" r="3" fill="#14233b"/><circle cx="146" cy="40" r="3" fill="#14233b"/>');

  put('mov', {
    title: A('Blackened varistor or fuse', 'فاريستور أو فيوز اسود'),
    look: A('A disc varistor with a crack, a chipped edge or a black scorch. A glass fuse with a dark smear or a vaporised wire.', 'فاريستور قرصي مشروخ أو مكسور الحافة أو متفحم. فيوز زجاج بتلطيخ غامق أو سلك متبخر.'),
    mean: A('The board saw a serious surge or a sustained overvoltage. The part sacrificed itself: replace it and check the supply.', 'الكارت اتعرض لسبايك كبير أو جهد زيادة مستمر. القطعة ضحّت بنفسها: غيّرها وافحص المصدر.'),
  }, '<rect x="6" y="16" width="148" height="82" rx="4" fill="#1f6b43"/><path d="M70 98V70M90 98V70" stroke="#9aa3b3" stroke-width="4"/>' +
    '<circle cx="80" cy="46" r="26" fill="#2a63c6"/><circle cx="80" cy="46" r="26" fill="url(#ill_scorch)"/><path d="M80 22l-6 14 8 6-6 10" stroke="#000" stroke-width="2" fill="none"/>' +
    '<rect x="14" y="78" width="40" height="12" rx="6" fill="#d8eaf3" opacity=".85"/><rect x="26" y="82" width="16" height="4" fill="#222"/>' +
    '<rect x="104" y="78" width="40" height="12" rx="6" fill="#d8eaf3" opacity=".85"/><path d="M110 84h28" stroke="#9aa3b3" stroke-dasharray="3 3"/>');

  /* illustration lookup helpers */
  ILL.has = (id) => !!ILL[id] && typeof ILL[id].svg === 'function';
  ILL.html = (id) => (ILL.has(id) ? ILL[id].svg() : '');
  ILL.ids = () => Object.keys(ILL).filter((k) => ILL[k] && ILL[k].cap);
})(typeof window !== 'undefined' ? window : globalThis);
