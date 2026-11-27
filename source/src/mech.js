/* Mechanical section: registry of 3D components (EL.mech.add) and workshop builds (EL.mech.addBuild).
   Data files src/mech_*.js only describe shapes and text; src/ui/mech3d.js turns them into three.js meshes.
   Format: tools/MECH_FORMAT.md */
(function (g) {
  const EL = g.EL;
  const M = (EL.mech = EL.mech || {});
  M.lib = M.lib || []; M.byId = M.byId || {}; M.builds = M.builds || []; M.errors = M.errors || [];
  M.cats = [
    { id: 'tools', ic: '🔧', name: ['Hand tools & measuring', 'العدة وأدوات القياس'] },
    { id: 'fasteners', ic: '🔩', name: ['Fasteners & joints', 'المسامير والوصلات'] },
    { id: 'valves', ic: '🚰', name: ['Valves', 'المحابس'] },
    { id: 'actuators', ic: '⚡', name: ['Solenoids & pneumatics', 'السولينويد والنيوماتيك'] },
    { id: 'pumps', ic: '💧', name: ['Pumps', 'الطلمبات'] },
    { id: 'motors', ic: '⚙️', name: ['Motors & gearboxes', 'المواتير والجيربوكس'] },
    { id: 'transmission', ic: '⛓️', name: ['Belts, chains & couplings', 'السيور والجنازير والكوبلنج'] },
    { id: 'bearings', ic: '◎', name: ['Bearings', 'البلي (الرولمان)'] },
    { id: 'seals', ic: '⭕', name: ['Seals & gaskets', 'الجوانات والسيلات'] },
    { id: 'process', ic: '🛢️', name: ['Tanks & pharma equipment', 'التانكات ومعدات الأدوية'] },
  ];
  const SHAPES = ['box', 'cyl', 'cone', 'sph', 'torus', 'lathe', 'hex', 'gear', 'ext', 'flange', 'spring', 'tube', 'balls', 'rollers', 'vanes'];
  const pair = (x) => Array.isArray(x) && x.length === 2 && typeof x[0] === 'string' && typeof x[1] === 'string';
  M.check = function (c) {
    const e = [];
    if (!c || typeof c.id !== 'string' || !/^[a-z0-9_]+$/.test(c.id)) e.push('bad id');
    if (!M.cats.some((k) => k.id === c.cat)) e.push(c.id + ': unknown cat ' + c.cat);
    if (!pair(c.name)) e.push(c.id + ': name must be [en, ar]');
    for (const k of ['what', 'use', 'how', 'fail', 'pm']) if (!c.info || !pair(c.info[k])) e.push(c.id + ': info.' + k + ' must be [en, ar]');
    if (!Array.isArray(c.parts) || !c.parts.length) e.push(c.id + ': no parts');
    const ids = new Set();
    for (const p of c.parts || []) {
      if (!p.id || ids.has(p.id)) e.push(c.id + ': part id missing or repeated ' + p.id); ids.add(p.id);
      if (!pair(p.name)) e.push(c.id + '.' + p.id + ': name must be [en, ar]');
      if (!pair(p.role)) e.push(c.id + '.' + p.id + ': role must be [en, ar]');
      if (!Array.isArray(p.s) || !p.s.length) e.push(c.id + '.' + p.id + ': no shapes');
      for (const s of p.s || []) if (!SHAPES.includes(s.t)) e.push(c.id + '.' + p.id + ': unknown shape ' + s.t);
    }
    for (const s of c.steps || []) if (!ids.has(s)) e.push(c.id + ': step ' + s + ' is not a part');
    if (c.anim) for (const pid in c.anim.parts || {}) if (!ids.has(pid)) e.push(c.id + ': anim part ' + pid + ' missing');
    for (const q of c.quiz || []) if (!pair(q.q) || !pair(q.a) || !Array.isArray(q.w) || q.w.length < 2 || !q.w.every(pair)) e.push(c.id + ': bad quiz item');
    return e;
  };
  M.add = function (c) {
    const e = M.check(c);
    if (e.length) { M.errors.push(...e); if (typeof console !== 'undefined') console.warn('mech', e); return; }
    if (M.byId[c.id]) { M.errors.push('duplicate ' + c.id); return; }
    M.lib.push(c); M.byId[c.id] = c;
  };
  M.addBuild = function (b) { M.builds.push(b); };
  M.steps = (c) => (c.steps && c.steps.length ? c.steps : c.parts.map((p) => p.id));
  M.part = (c, id) => c.parts.find((p) => p.id === id);
})(typeof window !== 'undefined' ? window : globalThis);
