/* Explain mode ("?") on the bench: tap any terminal or device to learn what it is for, with IEC terminal
   numbering rules (A1/A2, 1-6, 13-14, 21-22, 95-98, U V W, BN BK BU, PLC I/Q...) and where it is wired now. */
(function (g) {
  const EL = g.EL, ui = EL.ui, h = EL.h, T = ui.T;
  const X = (ui.explain = { on: false });
  const P = (en, ar) => [en, ar];
  const D = () => EL.defs;

  /* what a terminal is, from its id and the device family */
  EL.pinHelp = function (p, pin) {
    const d = D()[p.type] || {}, t = p.type;
    if (d.pinHelp && d.pinHelp[pin]) return d.pinHelp[pin];
    const three = /^(MCB3|ISOL3|MPCB|CONT3|OL|RCD4|CB3|ACB|MCB1|MCB2|FUSE)$/.test(t);
    const has = (id) => EL.pinsOf(p).some((q) => q.id === id);
    let m;
    /* devices whose terminal names mean something else than the generic rules below */
    if (t === 'VFD') {
      if (/^[RST]$/.test(pin)) return P('Drive mains input ' + pin + '/L' + ' RST'.indexOf(pin) + ': the 3-phase supply, through its own fuses or breaker.', 'دخل الكهربا للإنفرتر ' + pin + '/L' + ' RST'.indexOf(pin) + ': التغذية 3 فاز، من فيوزات أو بريكر خاص بيه.');
      if (/^[UVW]$/.test(pin)) return P('Drive output ' + pin + ' to the motor ' + pin + '1. Variable voltage and frequency: no contactor switching and no capacitors between the drive and the motor while it runs.', 'خرج الإنفرتر ' + pin + ' للموتور ' + pin + '1. جهد وتردد متغير: متفصلش بكونتاكتور ومتحطش مكثفات بين الإنفرتر والموتور وهو شغال.');
      if (pin === 'BP' || pin === 'BN') return P('DC bus ' + (pin === 'BP' ? 'DC+' : 'DC-') + ' (about 560 V DC, for a braking resistor or unit). It stays charged for minutes after switch-off: wait the time on the label and measure 0 V before touching.', 'الـDC bus ' + (pin === 'BP' ? 'DC+' : 'DC-') + ' (حوالي 560 فولت DC، لمقاومة أو وحدة فرملة). بيفضل مشحون دقايق بعد الفصل: استنى الوقت المكتوب وقيس 0 فولت قبل ما تلمس.');
      if (/^DI\d$/.test(pin)) return P('Drive digital input ' + pin + ' (run / direction command): 24 V from P24 here = on.', 'مدخل ديجيتال للإنفرتر ' + pin + ' (أمر تشغيل / اتجاه): 24 فولت من P24 هنا = شغال.');
      if (pin === 'AI1') return P('Drive analog input AI1: the speed reference, 0-10 V from the +10V potentiometer or a PLC analog output.', 'مدخل أنالوج للإنفرتر AI1: مرجع السرعة، 0-10 فولت من البوتنشيوميتر على +10V أو خرج أنالوج من الـPLC.');
    }
    if (t === 'RCD2') return /1$/.test(pin) ? P('RCD supply side (' + pin[0] + ' in). L and N both pass through the RCD: it compares their currents.', 'قاطع التسريب ناحية المصدر (دخول ' + pin[0] + '). الـL والـN الاتنين بيعدوا جوه القاطع: بيقارن تياراتهم.') : P('RCD load side (' + pin[0] + ' out). Never join this N to another circuit\'s N, or the RCD trips.', 'قاطع التسريب ناحية الحمل (خروج ' + pin[0] + '). متوصلش النيوترال ده بنيوترال دايرة تانية، وإلا القاطع يفصل.');
    if (t === 'SAFE' && (pin === 'A1' || pin === 'A2')) return P('Safety relay supply ' + pin + (pin === 'A1' ? ' (+24 V).' : ' (0 V).'), 'تغذية ريلاي الأمان ' + pin + (pin === 'A1' ? ' (+24 فولت).' : ' (0 فولت).'));
    if (t === 'SAFE' && /^[12][34]$/.test(pin)) return P('Safety output (enabling contact) ' + pin[0] + '3-' + pin[0] + '4, normally open: closes only when both E-stop channels are healthy and reset was pressed. It feeds the contactor coils.', 'خرج الأمان (كونتاكت السماح) ' + pin[0] + '3-' + pin[0] + '4 مفتوح عادي: بيقفل بس لما قناتين الطوارئ سليمين واتعمل ريسيت. بيغذي كويلات الكونتاكتورات.');
    if (/^(TON|TOFF)$/.test(t) && /^1[568]$/.test(pin)) return P('Timed changeover contact: 15 = common, 16 = normally closed, 18 = normally open. 15-18 closes and 15-16 opens ' + (t === 'TON' ? 'when the set time has passed after A1-A2 got power.' : 'while B1 has voltage; they fall back the set time after B1 loses it.'), 'كونتاكت تحويل بالوقت: 15 = المشترك، 16 = مقفول عادي، 18 = مفتوح عادي. 15-18 بيقفل و15-16 بيفتح ' + (t === 'TON' ? 'لما الزمن المظبوط يعدي بعد ما A1-A2 ياخدوا كهربا.' : 'طول ما B1 عليه جهد، وبيرجعوا بعد الزمن المظبوط من ما B1 يفقده.'));
    if (t === 'SDT' && /^[12][78]$/.test(pin)) return pin[0] === '1' ? P('Star contact 17-18: closes at power-on (star contactor), opens when the time is up.', 'كونتاكت الستار 17-18: بيقفل أول ما الكهربا تيجي (كونتاكتور الستار)، وبيفتح لما الزمن يخلص.') : P('Delta contact 27-28: closes a short dead time after the star contact opens (delta contactor).', 'كونتاكت الدلتا 27-28: بيقفل بعد زمن ميت قصير من فتح كونتاكت الستار (كونتاكتور الدلتا).');
    if ((m = /^(\d)([124])$/.exec(pin)) && has(m[1] + '1') && has(m[1] + '2') && has(m[1] + '4')) {
      const k = m[1];
      return P('Changeover contact ' + k + '1-' + k + '2-' + k + '4: ' + k + '1 = common, ' + k + '2 = normally closed (NC), ' + k + '4 = normally open (NO). This is ' + { 1: 'the common', 2: 'the NC side', 4: 'the NO side' }[m[2]] + '.',
        'كونتاكت تحويل ' + k + '1-' + k + '2-' + k + '4: ' + k + '1 = المشترك، ' + k + '2 = مقفول عادي (NC)، ' + k + '4 = مفتوح عادي (NO). ده ' + { 1: 'المشترك', 2: 'ناحية الـNC', 4: 'ناحية الـNO' }[m[2]] + '.');
    }
    if (pin === 'L') return P('Line (phase) L: 230 V to N. Single-phase supply in.', 'الخط (الفاز) L: 230 فولت للنيوترال. دخول التغذية فاز واحد.');
    if ((m = /^C(\d)$/.exec(pin)) && (D()[t].diag || {}).kind === 'plc') return P('Common of relay output Q0.' + m[1] + ': bring the supply of the load here (24 V DC or 230 V AC); the relay passes it to Q0.' + m[1] + '.', 'المشترك بتاع مخرج الريلاي Q0.' + m[1] + ': هات تغذية الحمل هنا (24 فولت DC أو 230 AC)؛ الريلاي بيعديها لـQ0.' + m[1] + '.');
    if (t === 'TRAFO' && /^[PS][12]$/.test(pin)) return pin[0] === 'P' ? P('Primary ' + pin + ': the transformer input (400 or 230 V), through its own fuse.', 'الابتدائي ' + pin + ': دخل المحول (400 أو 230 فولت)، من فيوز خاص بيه.') : P('Secondary ' + pin + ': the control voltage out to the control circuit (fuse it; earth one side if the drawing says so).', 'الثانوي ' + pin + ': جهد الكنترول خارج لدايرة الكنترول (حط عليه فيوز؛ ووصّل طرف بالأرضي لو الرسمة بتقول كده).');
    if (pin === 'A1') return P('Coil terminal A1: the control supply comes in here (+ or L). When A1 and A2 get the coil voltage, the device pulls in.', 'طرف الكويل A1: الكنترول بيدخل هنا (+ أو L). لما A1 وA2 ياخدوا جهد الكويل، الجهاز يلقط.');
    if (pin === 'A2') return P('Coil terminal A2: the return of the coil (0 V or N).', 'طرف الكويل A2: الراجع بتاع الكويل (0 فولت أو النيوترال).');
    if (three && /^[135]$/.test(pin)) return P('Main pole, supply side (' + { 1: 'L1', 3: 'L2', 5: 'L3' }[pin] + '). Odd numbers = line in, from the source.', 'قطب رئيسي ناحية المصدر (' + { 1: 'L1', 3: 'L2', 5: 'L3' }[pin] + '). الأرقام الفردية = دخول الخط من المصدر.');
    if (three && /^[246]$/.test(pin)) return P('Main pole, load side (' + { 2: 'T1', 4: 'T2', 6: 'T3' }[pin] + '). Even numbers = out to the load (motor, next device).', 'قطب رئيسي ناحية الحمل (' + { 2: 'T1', 4: 'T2', 6: 'T3' }[pin] + '). الأرقام الزوجية = خروج للحمل (موتور أو الجهاز اللي بعده).');
    if (pin === '95' || pin === '96') return P('Overload trip contact 95-96, normally closed: put it in series with the contactor coil so a trip drops the motor.', 'كونتاكت فصل الأوفرلود 95-96 مقفول عادي: يتحط على التوالي مع كويل الكونتاكتور عشان لما يفصل يوقع الموتور.');
    if (pin === '97' || pin === '98') return P('Overload signal contact 97-98, normally open: closes on trip, for a fault lamp or a PLC input.', 'كونتاكت إشارة الأوفرلود 97-98 مفتوح عادي: بيقفل لما يفصل، للمبة عطل أو مدخل PLC.');
    if ((m = /^(\d)([1-4])$/.exec(pin)) && /^(CONT|CONT3|RELAY|KA|AUX|TIMER|TON|TOF|SAFE|PB_|PB2|HOA|ESTOP|SEL|KEY|MPCB|LIM)/.test(t)) {
      const no = m[2] === '3' || m[2] === '4';
      return P('Auxiliary contact ' + m[1] + (no ? '3-' + m[1] + '4' : '1-' + m[1] + '2') + ': the first digit is the contact number, the second ' + (no ? '3-4 = normally open (NO): closes when the device operates.' : '1-2 = normally closed (NC): opens when the device operates.'),
        'كونتاكت مساعد ' + m[1] + (no ? '3-' + m[1] + '4' : '1-' + m[1] + '2') + ': الرقم الأول رقم الكونتاكت، والتاني ' + (no ? '3-4 = مفتوح عادي (NO): بيقفل لما الجهاز يشتغل.' : '1-2 = مقفول عادي (NC): بيفتح لما الجهاز يشتغل.'));
    }
    if (/^(PB_NO|PB_NC|PB2|ESTOP|SEL2|KEY)$/.test(t) && /^[1-4]$/.test(pin)) return pin === '3' || pin === '4' ? P('Contact block 3-4, normally open: closes while the button is pressed (or the selector is turned).', 'بلوك كونتاكت 3-4 مفتوح عادي: بيقفل وانت ضاغط الزرار (أو لافف السلكتور).') : P('Contact block 1-2, normally closed: opens when the button is pressed. Stop and E-stop use NC so a broken wire also stops.', 'بلوك كونتاكت 1-2 مقفول عادي: بيفتح لما تضغط. الإيقاف والطوارئ بيستخدموا NC عشان السلك المقطوع كمان يوقف.');
    if (/^L[123]$/.test(pin)) return P('Phase ' + pin + ' (400 V between phases, 230 V to N).', 'الفاز ' + pin + ' (400 فولت بين الفازات، 230 للنيوترال).');
    if (pin === 'N') return P('Neutral: the return of single-phase loads. Never switch N alone.', 'النيوترال: راجع الأحمال الفاز الواحد. متفصلش النيوترال لوحده أبداً.');
    if (pin === 'PE') return P('Protective earth (green-yellow): every metal body and motor frame goes here. Never fused, never switched.', 'أرضي الحماية (أخضر وأصفر): كل جسم معدن وجسم موتور يتوصل هنا. مفيش عليه فيوز ولا سويتش.');
    if ((m = /^([UVW])([12]?)$/.exec(pin)) && /^MOT|VFD|GEN/.test(t)) return P('Motor winding ' + pin + (m[2] === '2' ? ': end of the winding, joined in star or delta on the terminal board.' : ': start of the winding, comes from the contactor / drive.'), 'ملف الموتور ' + pin + (m[2] === '2' ? ': نهاية الملف، بيتوصل ستار أو دلتا على بورد الأطراف.' : ': بداية الملف، جاي من الكونتاكتور أو الإنفرتر.'));
    const sens = has('BN') && has('BK') && has('BU');
    if (pin === 'BN' && sens) return P('Sensor brown wire: +24 V supply.', 'سلك الحساس البني: +24 فولت.');
    if (pin === 'BU' && sens) return P('Sensor blue wire: 0 V supply.', 'سلك الحساس الأزرق: 0 فولت.');
    if (pin === 'BK' && sens) return P('Sensor black wire: the output. PNP gives +24 V to the PLC input when the sensor sees its target.', 'سلك الحساس الأسود: الخرج. الـPNP بيدي +24 فولت لمدخل الـPLC لما الحساس يشوف الهدف.');
    if (pin === 'LP' || pin === 'L+') return P('PLC 24 V DC supply (+).', 'تغذية الـPLC 24 فولت DC (+).');
    if (pin === 'M' && (D()[t].diag || {}).kind === 'plc') return P('PLC 0 V (M): the reference of inputs, outputs and analog signals.', 'صفر الـPLC (M): مرجع المداخل والمخارج والإشارات الأنالوج.');
    if ((m = /^I(\d+)$/.exec(pin)) && (D()[t].diag || {}).kind === 'plc') { const i = +m[1]; return P('Digital input I' + (i >> 3) + '.' + (i & 7) + ': 24 V here = 1 in the program.', 'مدخل ديجيتال I' + (i >> 3) + '.' + (i & 7) + ': 24 فولت هنا = 1 في البرنامج.'); }
    if ((m = /^Q(\d+)$/.exec(pin)) && (D()[t].diag || {}).kind === 'plc') { const i = +m[1]; return P('Digital output Q' + (i >> 3) + '.' + (i & 7) + ': the program switches the load here (coil, lamp, valve). Return the load to 0 V.', 'مخرج ديجيتال Q' + (i >> 3) + '.' + (i & 7) + ': البرنامج بيشغّل الحمل من هنا (كويل، لمبة، محبس). رجّع الحمل على 0 فولت.'); }
    if (/^AI\d$/.test(pin) && (D()[t].diag || {}).kind === 'plc') return P('Analog input (0-10 V / 4-20 mA with a shunt): a transmitter value, read as a number (IW64...).', 'مدخل أنالوج (0-10 فولت أو 4-20 مللي بمقاومة): قيمة ترانسميتر بتتقري كرقم (IW64...).');
    if (pin === 'X1' || pin === 'X2') return P('Lamp terminal ' + pin + ': X1 supply, X2 return.', 'طرف اللمبة ' + pin + ': X1 التغذية وX2 الراجع.');
    if (pin === 'pos' || pin === '+') return P('Positive (+) terminal.', 'الطرف الموجب (+).');
    if (pin === 'neg' || pin === '-') return P('Negative (-) / 0 V terminal.', 'الطرف السالب (-) / 0 فولت.');
    if (/^S(11|12|21|22)$/.test(pin)) return P('Safety relay input channel ' + pin + ': the E-stop NC contacts (two channels) are wired here, so a single fault is detected.', 'مدخل قناة ريلاي الأمان ' + pin + ': كونتاكتات الطوارئ NC (قناتين) بتتوصل هنا عشان أي عطل واحد يتكشف.');
    if (/^S3[34]$/.test(pin)) return P('Safety relay reset loop S33-S34: the reset button and the NC feedback contacts of the controlled contactors go here.', 'دايرة ريسيت ريلاي الأمان S33-S34: زرار الريسيت وكونتاكتات الفيدباك NC للكونتاكتورات بتتوصل هنا.');
    const lab = (EL.pinsOf(p).find((q) => q.id === pin) || {}).label || pin;
    return P('Terminal ' + lab + ' of ' + (D()[t].name || [t])[0] + '.', 'طرف ' + lab + ' في ' + (D()[t].name || [t, t])[1] + '.');
  };

  let box = null;
  function close() { if (box) { box.remove(); box = null; } }
  function wiredTo(c, ref) {
    const out = [];
    for (const w of c.wires) { const o = w.a === ref ? w.b : w.b === ref ? w.a : null; if (!o) continue; const [id, pin] = o.split('.'), q = c.parts.find((x) => x.id === id); if (q) out.push((q.tag || q.type) + ':' + pin); }
    return out;
  }
  function show(host, title, text, extra) {
    close();
    box = h('div', { class: 'xp-box', role: 'dialog' },
      h('div', { class: 'xp-h' }, h('b', { text: title }), h('button', { type: 'button', class: 'xp-x', 'aria-label': T(['Close', 'اقفل']), text: '×', onclick: close })),
      h('p', { text }), extra || null);
    host.appendChild(box);
  }
  /* called by the editor before its own handling; returns true when it used the tap */
  X.tap = function (ed, host, t) {
    if (!X.on || ed.kind === 'pcb') return false;
    const c = ed.c;
    if (t.k === 'pin') {
      const [id, pin] = t.ref.split('.'), p = c.parts.find((x) => x.id === id); if (!p) return true;
      const ws = wiredTo(c, t.ref), lab = (EL.pinsOf(p).find((q) => q.id === pin) || {}).label || pin;
      show(host, '❓ ' + (p.tag || p.type) + ' : ' + lab, T(EL.pinHelp(p, pin)),
        h('p', { class: 'mute', text: ws.length ? T(['Wired now to: ', 'متوصل دلوقتي بـ: ']) + ws.join(', ') : T(['Not wired yet.', 'لسه مش متوصل.']) }));
      return true;
    }
    if (t.k === 'part') {
      const p = c.parts.find((x) => x.id === t.id); if (!p) return true;
      const d = D()[p.type], pins = EL.pinsOf(p);
      const list = h('div', { class: 'xp-pins' }, pins.slice(0, 40).map((q) => h('button', { type: 'button', class: 'chip', text: q.label || q.id, onclick: () => X.tap(ed, host, { k: 'pin', ref: p.id + '.' + q.id }) })));
      show(host, '❓ ' + (p.tag || '') + ' · ' + T(d.name), d.info ? T(d.info) : '', h('div', {}, h('p', { class: 'mute small', text: T(['Tap a terminal to learn what it is for:', 'اضغط على أي طرف تعرف بيعمل إيه:']) }), list));
      return true;
    }
    close(); return true;
  };
  X.set = function (on) { X.on = !!on; close(); const b = document.getElementById('btnExplain'); if (b) b.classList.toggle('on', X.on); document.body.classList.toggle('xp-mode', X.on); if (X.on) ui.toast(['Explain mode: tap any device or terminal. Tap ? again to go back to work.', 'وضع الشرح: اضغط على أي جهاز أو طرف. اضغط ؟ تاني عشان ترجع تشتغل.'], 'info', 4500); };
  X.close = close;
})(typeof window !== 'undefined' ? window : globalThis);
