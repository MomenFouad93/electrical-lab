/* Draw from a picture or a PDF: the dialog. Pictures of a wiring diagram, a P&ID or a mechanical drawing (or the manual PDF)
   go to the optional AI helper with the user's own key; the answer is checked by src/ai_import.js and opened on the bench
   as a visit (the trainee's own bench is kept, like a ready project) or replaces the drawing. */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui, T = ui.T;
  const AIM = EL.aiImport, PJ = EL.projects;
  const UI = (EL.aiImportUI = {});
  const MAX_IMG = 10, MAX_PDF = 22 * 1024 * 1024, MAX_ALL = 30 * 1024 * 1024, LONG = 1568;
  const HOME = 'ellab.benchHome', LAST = 'ellab.projLast';
  const NAME = ['Drawing from a picture', 'رسمة من صورة'];
  /* a drawing read by the AI opens like a ready project (a visit), so it gets a project entry (not in the Projects list) */
  if (PJ && !PJ.map.ai) PJ.map.ai = { name: NAME, desc: ['Drawn by the AI helper from a picture or a PDF. Check it against the original.', 'اترسمت بمساعد الذكاء الاصطناعي من صورة أو PDF. راجعها على الأصل.'], tasks: [['Check every part and wire against the original drawing.', 'راجع كل جهاز وسلك على الرسمة الأصلية.']] };

  const KINDS = {
    panel: { ic: '⚡', name: ['Wiring diagram', 'رسمة كهربا'], to: ['→ Panel drawing', '← رسمة لوحة'], hint: ['Power and control circuit diagrams, terminal plans, PLC I/O pages.', 'دوائر القوى والكنترول، خطط الترمينال، صفحات مداخل ومخارج الـPLC.'] },
    plant: { ic: '💧', name: ['P&ID', 'P&ID'], to: ['→ Plant drawing', '← رسمة عملية'], hint: ['Piping and instrument diagrams, process flow diagrams of water or process skids.', 'رسومات المواسير والأجهزة، مخططات عمليات المية أو الشاسيهات.'] },
    mech: { ic: '⚙️', name: ['Mechanical drawing', 'رسمة ميكانيكا'], to: ['→ Explanation + parts list', '← شرح + قايمة قطع'], hint: ['Assembly, exploded or section views of pumps, valves, gearboxes...', 'رسومات تجميع أو مفككة أو قطاعات لطلمبات ومحابس وجيربوكسات...'] },
  };
  const st = { kind: 'panel', files: [], note: '', page: '', busy: false, err: null, errRaw: '', res: null, c: null };
  let box = null, modal = null;

  const lsg = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lss = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const B = () => EL.bench;
  const btn = (txt, fn, cls, at) => h('button', Object.assign({ type: 'button', class: 'btn ' + (cls || ''), onclick: fn, text: txt }, at || {}));
  const kb = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');

  /* ---------- files ---------- */
  function readAsDataURL(f) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); }); }
  function loadImg(url) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; }); }
  async function addImage(f) {
    if (st.files.filter((x) => x.kind === 'image').length >= MAX_IMG) { ui.toast(T(['Up to ', 'لحد ']) + MAX_IMG + T([' pictures at a time.', ' صور في المرة.']), 'warn'); return; }
    const url = URL.createObjectURL(f);
    try {
      const im = await loadImg(url);
      const k = Math.min(1, LONG / Math.max(im.naturalWidth, im.naturalHeight));
      const w = Math.max(1, Math.round(im.naturalWidth * k)), hh = Math.max(1, Math.round(im.naturalHeight * k));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = hh;
      const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, hh); x.drawImage(im, 0, 0, w, hh);
      const du = cv.toDataURL('image/jpeg', 0.85);
      const tc = document.createElement('canvas'), tk = 120 / Math.max(w, hh); tc.width = Math.round(w * tk); tc.height = Math.round(hh * tk); tc.getContext('2d').drawImage(cv, 0, 0, tc.width, tc.height);
      st.files.push({ kind: 'image', name: String(f.name || 'photo').slice(0, 60), data: du.slice(du.indexOf(',') + 1), media: 'image/jpeg', thumb: tc.toDataURL('image/jpeg', 0.7), size: Math.round(du.length * 0.75), w, h: hh });
    } catch (e) { ui.toast(['Could not read that picture.', 'مقدرتش أقرا الصورة دي.'], 'bad'); }
    finally { URL.revokeObjectURL(url); }
  }
  async function addPdf(f) {
    if (!/pdf$/i.test(f.type || '') && !/\.pdf$/i.test(f.name || '')) { ui.toast(['That is not a PDF file.', 'ده مش ملف PDF.'], 'bad'); return; }
    if (f.size > MAX_PDF) { ui.toast(T(['The PDF is too big (', 'الـPDF كبير (']) + kb(f.size) + T(['). The limit is 22 MB: send only the pages you need, or take photos of them.', '). الحد 22 ميجا: ابعت الصفحات اللي محتاجها بس، أو صوّرها.']), 'bad', 8000); return; }
    if (st.files.some((x) => x.kind === 'pdf')) st.files = st.files.filter((x) => x.kind !== 'pdf');
    try { const du = await readAsDataURL(f); st.files.push({ kind: 'pdf', name: String(f.name || 'manual.pdf').slice(0, 60), data: du.slice(du.indexOf(',') + 1), size: f.size }); }
    catch (e) { ui.toast(['Could not read that file.', 'مقدرتش أقرا الملف ده.'], 'bad'); }
  }
  async function onFiles(list, kind) {
    for (const f of [...(list || [])]) { if (kind === 'pdf') await addPdf(f); else if (/^image\//.test(f.type || '')) await addImage(f); else if (/\.pdf$/i.test(f.name || '')) await addPdf(f); }
    st.res = null; st.err = null; render();
  }

  /* ---------- run ---------- */
  function errText(e) {
    const m = String((e && e.message) || e || '');
    if (!navigator.onLine) return T(['You are offline. This needs the internet (the rest of the lab works offline).', 'إنت أوفلاين. ده محتاج نت (باقي المعمل شغال من غير نت).']);
    if (e && e.code === 'json') return T(['The AI answered, but not with a drawing in the expected format. Try again, add a note (for example "only page 2, the motor starter"), or use a sharper picture.', 'الذكاء الاصطناعي رد، بس مش برسمة بالشكل المطلوب. جرّب تاني، أو اكتب ملاحظة (مثلا "صفحة 2 بس، دايرة الموتور")، أو صورة أوضح.']);
    if (/api[_ -]?key|authentication|401|invalid x-api-key/i.test(m)) return T(['The AI service refused the key. Check the API key below.', 'خدمة الذكاء الاصطناعي رفضت المفتاح. راجع مفتاح الـAPI تحت.']) + ' (' + m.slice(0, 160) + ')';
    if (/too large|413|exceeds|maximum/i.test(m)) return T(['The files are too big for one request. Send fewer pages or smaller pictures.', 'الملفات كبيرة على طلب واحد. ابعت صفحات أقل أو صور أصغر.']) + ' (' + m.slice(0, 160) + ')';
    if (/overloaded|529|429|rate/i.test(m)) return T(['The AI service is busy right now. Wait a minute and try again.', 'خدمة الذكاء الاصطناعي مشغولة دلوقتي. استنى دقيقة وجرّب تاني.']) + ' (' + m.slice(0, 160) + ')';
    if (/abort/i.test(m)) return T(['No answer in time. Try again with fewer pages.', 'مفيش رد في الوقت. جرّب تاني بصفحات أقل.']);
    return m.slice(0, 400) || T(['Something went wrong.', 'حصلت مشكلة.']);
  }
  async function run() {
    if (st.busy) return;
    if (!st.files.length) { ui.toast(['Add a picture or a PDF first.', 'ضيف صورة أو PDF الأول.'], 'warn'); return; }
    if (!EL.ai.ready()) { st.err = T(['Add your API key first (below).', 'حط مفتاح الـAPI الأول (تحت).']); st.res = null; render(true); return; }
    if (!navigator.onLine) { st.err = errText(null); st.res = null; render(); return; }
    const total = st.files.reduce((a, f) => a + f.data.length, 0);
    if (total > MAX_ALL) { st.err = T(['The files are too big together. Remove some pictures or pages.', 'الملفات مع بعض كبيرة. شيل شوية صور أو صفحات.']); render(); return; }
    st.busy = true; st.err = null; st.errRaw = ''; st.res = null; st.c = null; render();
    try {
      const res = await AIM.run(st.kind, st.files, { note: st.note, page: st.page, lang: EL.ai.lang() });
      if (st.kind !== 'mech' && !res.counts.parts && !res.counts.units) { const e = new Error('empty'); e.code = 'json'; e.raw = res.raw; throw e; }
      st.res = res;
      if (res.kind !== 'mech') { st.c = AIM.build(res, T(NAME)); st.c.name = NAME.slice(); }
    } catch (e) { st.err = errText(e); st.errRaw = e && e.raw ? String(e.raw) : ''; }
    st.busy = false; render();
  }

  /* ---------- open the result ---------- */
  const hasWork = (c) => !!(c && (c.parts.length || (c.plant && c.plant.units && c.plant.units.length) || (c.line && c.line.els && c.line.els.length)));
  const isReady = (c) => !!(c && c.proj && PJ && PJ.map[c.proj.id]);
  function fresh() { const c = EL.deserialize(EL.serialize(st.c)); c.name = NAME.slice(); return c; }
  function put(c, view) {
    const b = B();
    EL.inst.probes = { red: null, black: null, clamp: null, ncv: null };
    b.ed.setCircuit(c); b.save();
    if (modal) modal.remove();
    ui.show('bench'); b.setMode('build');
    if (b.setView) b.setView(view);
    requestAnimationFrame(() => { if (b.view === 'panel') b.ed.fit(); else if (b.view === 'plant' && ui.plant) ui.plant.fit(); });
  }
  const viewFor = (c) => (c.parts.length ? 'panel' : 'plant');
  /* a visit: the own work goes aside (ellab.benchHome), like a ready project; "My bench" brings it back */
  function openVisit(view) {
    const cur = B().ed.c;
    if (isReady(cur)) lss(LAST, EL.serialize(cur)); else if (hasWork(cur)) lss(HOME, EL.serialize(cur));
    const c = fresh(); c.proj = { id: 'ai' };
    put(c, view || viewFor(c));
    ui.toast(['Opened as a visit: your own bench is kept (⌂ My bench). Check every part against the original.', 'اتفتحت كزيارة: المعمل بتاعك محفوظ (⌂ المعمل بتاعي). راجع كل جهاز على الأصل.'], 'ok', 7000);
  }
  function openReplace() {
    const cur = B().ed.c;
    if (isReady(cur)) lss(LAST, EL.serialize(cur));
    else if (hasWork(cur) && !confirm(T(['Replace your drawing on the bench with this one? (Save yours as a project first if you need it.)', 'تستبدل رسمتك اللي على المعمل بدي؟ (احفظ بتاعتك كمشروع الأول لو محتاجها.)']))) return;
    const c = fresh(); delete c.proj;
    put(c, viewFor(c));
    ui.toast(['The drawing is now your own bench drawing.', 'الرسمة بقت رسمة المعمل بتاعك.'], 'ok', 5000);
  }
  function copyJSON() {
    const r = st.res; if (!r) return;
    const txt = JSON.stringify(r.kind === 'mech' ? r.mech : { parts: r.spec.parts, wires: r.spec.wires, units: r.spec.units, pipes: r.spec.pipes, notes: r.rep.notes, unsure: r.rep.unsure }, null, 1);
    const fall = () => { const ta = h('textarea', { class: 'aim-json ltr', readonly: true }); ta.value = txt; ui.modal([h('h3', { text: 'JSON' }), ta]); ta.select(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => ui.toast(['Copied.', 'اتنسخ.'], 'ok'), fall); else fall();
  }

  /* ---------- previews ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (t, a, txt) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  function panelPreview(c) {
    if (!c.parts.length) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of c.parts) { const d = EL.defs[p.type]; x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + d.w); y1 = Math.max(y1, p.y + d.h); }
    const pad = 20, s = sv('svg', { viewBox: (x0 - pad) + ' ' + (y0 - pad) + ' ' + (x1 - x0 + 2 * pad) + ' ' + (y1 - y0 + 2 * pad), class: 'aim-pv', role: 'img' });
    for (const w of c.wires) { const a = EL.pinPos(EL.partById(c, w.a.split('.')[0]), w.a.split('.')[1]), b = EL.pinPos(EL.partById(c, w.b.split('.')[0]), w.b.split('.')[1]); if (a && b) s.appendChild(sv('path', { d: 'M' + a.x + ' ' + a.y + 'L' + b.x + ' ' + a.y + 'L' + b.x + ' ' + b.y, class: 'aim-w' })); }
    for (const p of c.parts) { const d = EL.defs[p.type]; s.appendChild(sv('rect', { x: p.x, y: p.y, width: d.w, height: d.h, rx: 6, class: 'aim-p' })); s.appendChild(sv('text', { x: p.x + d.w / 2, y: p.y + d.h / 2 + 8, class: 'aim-t' }, p.tag)); }
    return s;
  }
  function plantPreview(c) {
    if (!c.plant || !c.plant.units.length || !EL.plantArt) return null;
    const d = h('div', { class: 'aim-pv aim-pvp' });
    try { d.innerHTML = EL.plantArt.preview(c.plant, 520, 260); } catch (e) { return null; } // tags are sanitised by EL.plant.sanitize
    return d;
  }
  const ap = (el, x) => { if (x) el.append(x); };
  const list = (title, arr, cls) => (arr && arr.length ? h('div', { class: 'aim-l ' + (cls || '') }, h('b', { text: T(title) }), h('ul', null, arr.map((x) => h('li', { text: x })))) : null);

  /* ---------- render ---------- */
  function resultCard() {
    const r = st.res; if (!r) return null;
    const R = r.rep, out = h('div', { class: 'card ok aim-res' });
    if (r.kind === 'mech') {
      const m = r.mech;
      out.append(h('h3', { text: '⚙️ ' + (m.title || T(['Mechanical drawing', 'رسمة ميكانيكا'])) }));
      if (m.summary) out.append(h('p', { text: m.summary }));
      if (m.how_it_works) out.append(h('details', { open: true }, h('summary', { text: T(['How it works', 'بيشتغل إزاي']) }), h('p', { text: m.how_it_works })));
      if (m.parts.length) out.append(h('div', { class: 'aim-tw' }, h('table', { class: 'aim-tab' },
        h('tr', null, [T(['Part', 'القطعة']), T(['Qty', 'العدد']), T(['Material', 'الخامة']), T(['Function', 'الوظيفة']), '3D'].map((x) => h('th', { text: x }))),
        m.parts.map((p) => h('tr', null, h('td', { text: p.name }), h('td', { class: 'ltr', text: String(p.qty) }), h('td', { text: p.material || '–' }), h('td', { text: p.function || '' }),
          h('td', null, p.lib && EL.mechUI ? btn('🧊 3D', () => { if (modal) modal.remove(); EL.mechUI.open(p.lib); }, 'sm aim-3d', { title: T(EL.mech.byId[p.lib].name), 'aria-label': '3D: ' + T(EL.mech.byId[p.lib].name) }) : '–'))))));
      if (m.assembly_order.length) out.append(h('div', { class: 'aim-l' }, h('b', { text: T(['Assembly order', 'ترتيب التجميع']) }), h('ol', null, m.assembly_order.map((x) => h('li', { text: x })))));
      ap(out, list(['Checks', 'الفحوصات'], m.checks));
    } else {
      const n = r.counts;
      out.append(h('h3', { text: '✓ ' + T(['Drawing ready', 'الرسمة جاهزة']) }));
      out.append(h('div', { class: 'aim-cnt' },
        n.parts ? h('span', { text: n.parts + ' ' + T(['parts', 'جهاز']) }) : null, n.parts ? h('span', { text: n.wires + ' ' + T(['wires', 'سلك']) }) : null,
        n.units ? h('span', { text: n.units + ' ' + T(['units', 'وحدة']) }) : null, n.units ? h('span', { text: n.pipes + ' ' + T(['pipes', 'ماسورة']) }) : null,
        R.moved ? h('span', { class: 'warn-t', text: R.moved + ' ' + T(['placed by the lab (no place or overlapping)', 'اتحطوا بالمعمل (من غير مكان أو فوق بعض)']) }) : null));
      const pv = st.c && (panelPreview(st.c) || plantPreview(st.c)); ap(out, pv);
      if (st.c && st.c.parts.length && st.c.plant.units.length) { const p2 = plantPreview(st.c); if (p2) out.append(p2); }
    }
    ap(out, list(['AI notes', 'ملاحظات الذكاء الاصطناعي'], R.notes));
    ap(out, list(['Not sure (check these on the original)', 'مش متأكد (راجعها على الأصل)'], R.unsure, 'warn-l'));
    if (R.links.length) ap(out, list(['Links to panel tags that are not on the panel', 'روابط لتاجات مش موجودة في اللوحة'], R.links));
    if (R.renamed.length) ap(out, list(['Renamed (tag used twice)', 'اتغير اسمها (تاج متكرر)'], R.renamed));
    if (R.dropped.length) out.append(h('details', { class: 'aim-drop' }, h('summary', { text: R.dropped.length + ' ' + T(['items left out (not in the lab catalog)', 'حاجة اتشالت (مش في كتالوج المعمل)']) }), h('ul', null, R.dropped.slice(0, 120).map((x) => h('li', { class: 'ltr', text: x })))));
    const acts = h('div', { class: 'row wrap aim-acts' });
    if (r.kind === 'mech') {
      const first = r.mech.parts.find((p) => p.lib);
      if (first && EL.mechUI) acts.append(btn('🧊 ' + T(['Open in 3D library', 'افتح في مكتبة الـ3D']), () => { if (modal) modal.remove(); EL.mechUI.open(first.lib); }, 'pri', { id: 'aimOpen3d' }));
    } else if (st.c) {
      acts.append(btn('▶ ' + T(['Open on the bench', 'افتح على المعمل']), () => openVisit(), 'pri', { id: 'aimOpen' }));
      if (st.c.parts.length && st.c.plant.units.length) acts.append(btn('🏭 ' + T(['Open in Whole plant', 'افتح في المصنع كله']), () => openVisit('all'), '', { id: 'aimOpenAll' }));
      acts.append(btn(T(['Replace my drawing', 'استبدل رسمتي']), () => openReplace(), '', { id: 'aimReplace' }));
    }
    acts.append(btn('⧉ ' + T(['Copy JSON', 'انسخ JSON']), copyJSON, '', { id: 'aimCopy' }));
    out.append(acts);
    return out;
  }
  function render(openKey) {
    if (!box) return;
    box.innerHTML = '';
    box.append(h('h3', { text: '📷 ' + T(['Draw from a picture or PDF', 'ارسم من صورة أو PDF']) }),
      h('p', { class: 'mute sm', text: T(['Photograph a drawing from a manual or upload the PDF. The AI reads it and the lab draws it with its own parts, so you can run it, measure it and break it.', 'صوّر رسمة من الكتالوج أو ارفع الـPDF. الذكاء الاصطناعي بيقراها والمعمل بيرسمها بأجهزته، فتقدر تشغّلها وتقيس وتبوّظ.']) }));
    // kind
    const kinds = h('div', { class: 'aim-kinds', role: 'radiogroup' });
    for (const k of Object.keys(KINDS)) {
      const K = KINDS[k];
      kinds.append(h('button', { type: 'button', class: 'aim-kind' + (st.kind === k ? ' on' : ''), role: 'radio', 'aria-checked': st.kind === k ? 'true' : 'false', 'data-k': k, onclick: () => { st.kind = k; st.res = null; st.err = null; render(); } },
        h('span', { class: 'aim-ic', text: K.ic }), h('b', { text: T(K.name) }), h('span', { class: 'mute sm', text: T(K.to) })));
    }
    box.append(kinds, h('p', { class: 'mute sm aim-hint', text: T(KINDS[st.kind].hint) }));
    // files
    const fin = (kind, at) => h('input', Object.assign({ type: 'file', style: { display: 'none' }, onchange: (e) => { const fl = e.target.files; onFiles(fl, kind).then(() => { e.target.value = ''; }); } }, at));
    const files = h('div', { class: 'card aim-files' },
      h('div', { class: 'row wrap' },
        h('label', { class: 'btn', id: 'aimCam' }, '📷 ' + T(['Take a photo', 'صوّر']), fin('image', { accept: 'image/*', capture: 'environment' })),
        h('label', { class: 'btn', id: 'aimPics' }, '🖼 ' + T(['Pictures', 'صور']), fin('image', { accept: 'image/*', multiple: true, id: 'aimImgIn' })),
        h('label', { class: 'btn', id: 'aimPdf' }, '📄 PDF', fin('pdf', { accept: 'application/pdf,.pdf', id: 'aimPdfIn' }))),
      h('p', { class: 'mute sm', text: T(['Several pages are fine (up to 10 pictures). PDF up to 22 MB and 100 pages.', 'ينفع كذا صفحة (لحد 10 صور). الـPDF لحد 22 ميجا و100 صفحة.']) }));
    if (st.files.length) {
      const th = h('div', { class: 'aim-thumbs' });
      st.files.forEach((f, i) => th.append(h('div', { class: 'aim-th' }, f.kind === 'pdf' ? h('div', { class: 'aim-pdf', text: 'PDF' }) : h('img', { src: f.thumb, alt: '' }),
        h('span', { class: 'sm ltr', text: (f.kind === 'pdf' ? f.name + ' · ' : '') + kb(f.size) }),
        h('button', { type: 'button', class: 'aim-x', 'aria-label': T(['Remove', 'شيل']), title: T(['Remove', 'شيل']), text: '✕', onclick: () => { st.files.splice(i, 1); st.res = null; render(); } }))));
      files.append(th);
    }
    const page = h('input', { type: 'text', maxlength: 120, id: 'aimPage', value: st.page, placeholder: T(['e.g. page 12, or pages 30-33', 'مثلا صفحة 12، أو صفحات 30-33']), oninput: (e) => { st.page = e.target.value; } });
    const note = h('textarea', { rows: 2, maxlength: 400, id: 'aimNote', placeholder: T(['e.g. only the motor starter part', 'مثلا دايرة الموتور بس']), oninput: (e) => { st.note = e.target.value; } }); note.value = st.note;
    files.append(h('label', { class: 'f', text: T(['Which page (for a PDF, optional)', 'أنهي صفحة (للـPDF، اختياري)']) }), page, h('label', { class: 'f', text: T(['Note for the AI (optional)', 'ملاحظة للذكاء الاصطناعي (اختياري)']) }), note);
    box.append(files);
    // key + privacy
    const cfg = EL.ai.cfg();
    const key = h('input', { type: 'password', id: 'aimKey', value: cfg.key || '', placeholder: 'sk-ant-...', autocomplete: 'off', class: 'ltr' });
    const model = h('input', { type: 'text', id: 'aimModel', value: cfg.model || 'claude-sonnet-5-5', class: 'ltr' });
    const save = () => EL.ai.save({ key: key.value.trim(), model: model.value.trim() || 'claude-sonnet-5-5' });
    key.addEventListener('change', save); model.addEventListener('change', save);
    box.append(h('details', { class: 'card aim-key', open: openKey || !EL.ai.ready() ? true : null }, h('summary', { text: T(['AI key and model', 'مفتاح وموديل الذكاء الاصطناعي']) + (EL.ai.ready() ? ' ✓' : '') }),
      h('label', { class: 'f', text: 'API key' }), key, h('label', { class: 'f', text: T(['Model', 'الموديل']) }), model,
      h('div', { class: 'row', style: { marginTop: '6px' } }, btn(T(['Save', 'احفظ']), () => { save(); ui.toast(['Saved on this device.', 'اتحفظ على الجهاز ده.'], 'ok'); render(); }, 'sm'))));
    box.append(h('p', { class: 'aim-priv sm', text: '🔒 ' + T(['Privacy: the pictures and the PDF go to the AI service with your own key, and nowhere else. Do not upload confidential company drawings unless you are allowed to. Needs the internet; company networks often block it.', 'الخصوصية: الصور والـPDF بيتبعتوا لخدمة الذكاء الاصطناعي بمفتاحك إنت، ومش لحد تاني. متبعتش رسومات سرية للشركة إلا لو مسموحلك. محتاج نت؛ شبكات الشركات غالبا بتحجبه.']) }));
    // action
    const go = btn(st.busy ? '⏳ ' + T(['Reading the drawing...', 'بيقرا الرسمة...']) : '✨ ' + T(['Read and draw', 'اقرا وارسم']), () => { save(); run(); }, 'pri aim-go', Object.assign({ id: 'aimGo' }, st.busy || !st.files.length ? { disabled: true } : {}));
    box.append(h('div', { class: 'row wrap aim-run' }, go, st.busy ? h('span', { class: 'mute sm', text: T(['This can take a minute for a big page.', 'ده ممكن ياخد دقيقة للصفحة الكبيرة.']) }) : null));
    if (st.err) {
      const ec = h('div', { class: 'card bad aim-err', role: 'alert' }, h('p', { text: st.err }), h('div', { class: 'row wrap' }, btn('↻ ' + T(['Try again', 'جرّب تاني']), () => { save(); run(); }, 'pri', { id: 'aimRetry' })));
      if (st.errRaw) ec.append(h('details', null, h('summary', { text: T(['What the AI answered', 'الذكاء الاصطناعي رد بإيه']) }), h('pre', { class: 'aim-raw', text: st.errRaw.slice(0, 3000) })));
      box.append(ec);
    }
    const rc = resultCard(); if (rc) { box.append(rc); requestAnimationFrame(() => rc.scrollIntoView({ block: 'nearest' })); }
  }

  UI.open = function (kind) {
    if (kind && KINDS[kind]) { if (kind !== st.kind) { st.res = null; st.err = null; } st.kind = kind; }
    if (modal && modal.isConnected) modal.remove();
    box = h('div', { class: 'aim' });
    modal = ui.modal(box);
    const bx = modal.querySelector('.box'); if (bx) bx.classList.add('aim-box');
    render();
  };
  UI.state = st; // for tests
  document.addEventListener('click', (e) => { const b = e.target && e.target.closest && e.target.closest('#btnAiImport'); if (b) { UI.open(); if (ui.click) ui.click(); } });
  ui.onRefresh(() => { if (modal && modal.isConnected) render(); });
})(typeof window !== 'undefined' ? window : globalThis);
