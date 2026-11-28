/* Mechanical 3D: builds three.js groups from EL.mech component data and runs one viewer per host
   (orbit / pinch zoom, explode, cutaway with coloured section caps, part pick, labels, operate animation,
   workshop slots). Renders only when something changed. */
(function (g) {
  const EL = g.EL;
  const M = (EL.mech = EL.mech || {});
  const D2R = Math.PI / 180;
  let T = null;

  /* ---------------- materials ---------------- */
  const MAT = {
    steel: [0xb9c0c9, 0.85, 0.32], sst: [0xd9dee4, 0.9, 0.18], cast: [0x2f62b0, 0.15, 0.55], castg: [0x6d727a, 0.35, 0.7],
    iron: [0x55595f, 0.6, 0.6], brass: [0xd2a845, 0.9, 0.3], bronze: [0xb27c3b, 0.85, 0.4], copper: [0xc8743a, 0.9, 0.35],
    alu: [0xcbd0d6, 0.8, 0.35], chrome: [0xe8ecf0, 1, 0.08], rubber: [0x1d1d20, 0, 0.9], epdm: [0x2a2530, 0, 0.85],
    viton: [0x5a2a1e, 0, 0.8], ptfe: [0xf1f0ea, 0, 0.55], carbon: [0x2b2b2e, 0.2, 0.45], sic: [0x5a6068, 0.35, 0.25],
    ceramic: [0xece7da, 0, 0.3], plastic: [0x2a2d33, 0, 0.6], red: [0xd23a2a, 0.1, 0.5], yellow: [0xf2c21b, 0.1, 0.5],
    green: [0x3aa356, 0.1, 0.5], blue: [0x2b5fb5, 0.1, 0.5], orange: [0xe8742a, 0.1, 0.5], black: [0x202226, 0.3, 0.6],
    white: [0xf0f0f0, 0, 0.5], grey: [0x8a9099, 0.2, 0.6], felt: [0x8a7a55, 0, 0.95], wood: [0x9b6b3d, 0, 0.8],
    glass: [0xbfe6ff, 0, 0.05, 0.28], water: [0x3fa0e8, 0, 0.1, 0.38], oil: [0xd9a227, 0, 0.2, 0.6], grease: [0xc9b25a, 0, 0.6],
  };
  function matSpec(m) {
    if (typeof m === 'string' && /^#[0-9a-f]{6}$/i.test(m)) return [parseInt(m.slice(1), 16), 0.1, 0.55];
    return MAT[m] || MAT.steel;
  }
  function mkMat(m) {
    const s = matSpec(m);
    const o = { color: s[0], metalness: s[1], roughness: s[2] };
    if (s[3] != null) { o.transparent = true; o.opacity = s[3]; o.depthWrite = false; }
    const mt = new T.MeshStandardMaterial(o); mt.userData.op = s[3] != null ? s[3] : 1; return mt;
  }

  /* ---------------- geometry ---------------- */
  const V2 = (a, b) => new T.Vector2(a, b), V3 = (a) => new T.Vector3(a[0] || 0, a[1] || 0, a[2] || 0);
  function axisMatrix(ax) { // geometry is built along Y; turn it to the requested axis
    const m = new T.Matrix4();
    if (ax === 'x') m.makeRotationZ(-Math.PI / 2); else if (ax === 'z') m.makeRotationX(Math.PI / 2); else if (ax === '-y') m.makeRotationX(Math.PI);
    else if (ax === '-x') m.makeRotationZ(Math.PI / 2); else if (ax === '-z') m.makeRotationX(-Math.PI / 2);
    return m;
  }
  function circlePath(path, r, n, cx, cy) { for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; const x = (cx || 0) + Math.cos(a) * r, y = (cy || 0) + Math.sin(a) * r; i ? path.lineTo(x, y) : path.moveTo(x, y); } return path; }
  function extrudeY(shape, depth, bevel) { // extrude a 2D (x,z-plane) shape along Y, centred
    const geo = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: !!bevel, bevelThickness: bevel || 0, bevelSize: bevel || 0, bevelSegments: 2, curveSegments: 24 });
    geo.translate(0, 0, -depth / 2); geo.applyMatrix4(new T.Matrix4().makeRotationX(-Math.PI / 2)); return geo;
  }
  /* creased normals: smooth across gentle curves, sharp at real edges (a lathe ring keeps flat faces) */
  function creased(geo, deg) {
    const g2 = geo.index ? geo.toNonIndexed() : geo; geo !== g2 && geo.dispose();
    const pos = g2.attributes.position, n = pos.count, cos = Math.cos((deg || 32) * D2R);
    const fn = new Float32Array(n), nx = new Float32Array(n / 3 * 3), a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
    const FN = [];
    for (let i = 0; i < n; i += 3) {
      a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
      const v = new T.Vector3().subVectors(c, b).cross(new T.Vector3().subVectors(a, b)); const L = v.length(); FN.push(L > 1e-12 ? v.divideScalar(L) : null);
    }
    const key = (i) => Math.round(pos.getX(i) * 1e4) + '_' + Math.round(pos.getY(i) * 1e4) + '_' + Math.round(pos.getZ(i) * 1e4);
    const map = new Map();
    for (let i = 0; i < n; i++) { const k = key(i); let l = map.get(k); if (!l) map.set(k, (l = [])); l.push(i); }
    const out = new Float32Array(n * 3), acc = new T.Vector3();
    for (let i = 0; i < n; i++) {
      const f = FN[(i / 3) | 0]; if (!f) continue; acc.set(0, 0, 0);
      for (const j of map.get(key(i))) { const g = FN[(j / 3) | 0]; if (g && g.dot(f) >= cos) acc.add(g); }
      if (acc.lengthSq() < 1e-12) acc.copy(f); acc.normalize(); out[i * 3] = acc.x; out[i * 3 + 1] = acc.y; out[i * 3 + 2] = acc.z;
    }
    void fn; void nx;
    g2.setAttribute('normal', new T.BufferAttribute(out, 3)); return g2;
  }
  M.creased = (geo, deg) => { T = T || EL.THREE; return creased(geo, deg); };
  const GEO = {
    box: (s) => new T.BoxGeometry(s.w || 1, s.h || 1, s.d || 1),
    cyl: (s) => {
      const h = s.h || 1, seg = s.seg || 40;
      if (s.ri) { const r1 = s.r1 != null ? s.r1 : s.r, r2 = s.r2 != null ? s.r2 : s.r; return creased(new T.LatheGeometry([V2(s.ri, -h / 2), V2(r2, -h / 2), V2(r1, h / 2), V2(s.ri, h / 2), V2(s.ri, -h / 2)], seg)); }
      return new T.CylinderGeometry(s.r1 != null ? s.r1 : s.r, s.r2 != null ? s.r2 : s.r, h, seg, 1, !!s.open);
    },
    cone: (s) => new T.CylinderGeometry(s.r1 || 0.001, s.r2 != null ? s.r2 : s.r || 1, s.h || 1, s.seg || 40),
    sph: (s) => new T.SphereGeometry(s.r || 1, s.seg || 32, Math.max(8, (s.seg || 32) >> 1), 0, Math.PI * 2, 0, s.half ? Math.PI / 2 : Math.PI),
    torus: (s) => { const geo = new T.TorusGeometry(s.R || 1, s.r || 0.1, 14, s.seg || 56, s.arc ? s.arc * D2R : Math.PI * 2); geo.rotateX(Math.PI / 2); return geo; },
    lathe: (s) => creased(new T.LatheGeometry((s.pts || []).map((q) => V2(Math.max(0, q[0]), q[1])), s.seg || 48), s.crease),
    hex: (s) => {
      const h = s.h || 1, r = s.r || 1;
      if (s.ri) return creased(new T.LatheGeometry([V2(s.ri, -h / 2), V2(r, -h / 2), V2(r, h / 2), V2(s.ri, h / 2), V2(s.ri, -h / 2)], 6));
      return new T.CylinderGeometry(r, r, h, 6);
    },
    gear: (s) => {
      const n = s.teeth || 20, ro = s.r || 2, rr = s.rr || ro * (1 - 2.4 / n) , sh = new T.Shape();
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, da = (Math.PI * 2) / n;
        const pts = [[rr, a0], [ro, a0 + da * 0.22], [ro, a0 + da * 0.48], [rr, a0 + da * 0.7]];
        pts.forEach(([r, a], k) => { const x = Math.cos(a) * r, y = Math.sin(a) * r; i === 0 && k === 0 ? sh.moveTo(x, y) : sh.lineTo(x, y); });
      }
      sh.closePath();
      if (s.ri) sh.holes.push(circlePath(new T.Path(), s.ri, 32));
      return extrudeY(sh, s.h || 0.5);
    },
    ext: (s) => {
      const sh = new T.Shape(); (s.pts || []).forEach((q, i) => (i ? sh.lineTo(q[0], q[1]) : sh.moveTo(q[0], q[1]))); sh.closePath();
      for (const hl of s.holes || []) { const p = new T.Path(); if (hl.c) circlePath(p, hl.r, 28, hl.c[0], hl.c[1]); else hl.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); sh.holes.push(p); }
      return extrudeY(sh, s.d || 0.5, s.bevel);
    },
    flange: (s) => {
      const sh = circlePath(new T.Shape(), s.r || 2, 64);
      if (s.ri) sh.holes.push(circlePath(new T.Path(), s.ri, 48));
      const n = s.holes || 0, pcd = s.pcd || ((s.r || 2) + (s.ri || 0)) / 2, hr = s.hr || (s.r || 2) * 0.08;
      for (let i = 0; i < n; i++) { const a = ((i + 0.5) / n) * Math.PI * 2; sh.holes.push(circlePath(new T.Path(), hr, 16, Math.cos(a) * pcd, Math.sin(a) * pcd)); }
      return extrudeY(sh, s.h || 0.3);
    },
    spring: (s) => {
      const R = s.R || 1, turns = s.turns || 6, len = s.len || 3, pts = [], N = Math.max(40, turns * 24);
      for (let i = 0; i <= N; i++) { const t = i / N, a = t * turns * Math.PI * 2; pts.push(new T.Vector3(Math.cos(a) * R, -len / 2 + t * len, Math.sin(a) * R)); }
      return new T.TubeGeometry(new T.CatmullRomCurve3(pts), N, s.r || 0.08, 8, false);
    },
    tube: (s) => {
      const pts = (s.path || [[0, 0, 0], [0, 1, 0]]).map(V3);
      const curve = new T.CatmullRomCurve3(pts, !!s.closed, s.sharp ? 'catmullrom' : 'centripetal', s.sharp ? 0.05 : 0.5);
      return new T.TubeGeometry(curve, s.seg || Math.max(24, pts.length * 12), s.r || 0.1, s.rs || 10, !!s.closed);
    },
  };
  function shapeMeshes(s, mat) { // returns list of meshes (groups of repeated items return many)
    const out = [];
    if (s.t === 'balls' || s.t === 'rollers' || s.t === 'vanes') {
      const n = s.n || 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (s.a0 || 0) * D2R;
        let geo;
        if (s.t === 'balls') { geo = new T.SphereGeometry(s.r || 0.2, 20, 14); geo.translate(Math.cos(a) * s.R, 0, Math.sin(a) * s.R); }
        else if (s.t === 'rollers') {
          geo = new T.CylinderGeometry(s.r1 != null ? s.r1 : s.r, s.r2 != null ? s.r2 : s.r, s.l || 0.5, 20);
          if (s.tilt) geo.rotateZ(-s.tilt * D2R);
          geo.translate(s.R, 0, 0); geo.rotateY(-a);
        } else {
          const r1 = s.r1 || 0.5, r2 = s.r2 || 2, cv = (s.curve || 40) * D2R, th = s.thick || 0.12, K = 12, L = [], R = [];
          for (let k = 0; k <= K; k++) {
            const t = k / K, rad = r1 + (r2 - r1) * t, an = cv * t;
            const x = Math.cos(an) * rad, y = Math.sin(an) * rad, nx = -Math.sin(an), ny = Math.cos(an);
            L.push([x + nx * th / 2, y + ny * th / 2]); R.unshift([x - nx * th / 2, y - ny * th / 2]);
          }
          const sh = new T.Shape(); [...L, ...R].forEach((q, k) => (k ? sh.lineTo(q[0], q[1]) : sh.moveTo(q[0], q[1]))); sh.closePath();
          geo = extrudeY(sh, s.h || 0.6); geo.rotateY(-a);
        }
        out.push(geo);
      }
    } else {
      const f = GEO[s.t]; if (!f) return out; out.push(f(s));
    }
    const m4 = axisMatrix(s.ax);
    const rot = new T.Matrix4().makeRotationFromEuler(new T.Euler(...(s.rot || [0, 0, 0]).map((x) => (x || 0) * D2R)));
    const tr = new T.Matrix4().makeTranslation(...(s.p || [0, 0, 0]).concat([0, 0, 0]).slice(0, 3));
    const sc = s.sc ? new T.Matrix4().makeScale(...s.sc) : null;
    return out.map((geo) => { geo.applyMatrix4(m4); if (sc) geo.applyMatrix4(sc); geo.applyMatrix4(rot); geo.applyMatrix4(tr); geo.computeVertexNormals && !geo.attributes.normal && geo.computeVertexNormals(); return new T.Mesh(geo, mat); });
  }

  /* build a component: returns { root, parts: Map(id -> {g, base, ex, meshes, caps, def}) } */
  M.build = function (c, opt) {
    T = T || EL.THREE; opt = opt || {};
    const root = new T.Group(); root.name = c.id;
    const parts = new Map();
    for (const p of c.parts) {
      const grp = new T.Group(); grp.name = p.id; grp.userData.pid = p.id; grp.userData.cid = c.id;
      const base = V3(p.o || [0, 0, 0]), meshes = [], caps = [];
      for (const s of p.s) {
        const mat = mkMat(s.m || p.mat || 'steel');
        if (opt.clip && p.cut !== false && s.cut !== false) { mat.clippingPlanes = [opt.clip]; mat.clipShadows = true; mat.side = T.FrontSide; }
        for (const mesh of shapeMeshes(s, mat)) {
          mesh.userData.pid = p.id; mesh.userData.cid = c.id; grp.add(mesh); meshes.push(mesh);
          if (opt.clip && p.cut !== false && s.cut !== false && !mat.transparent) {
            const cm = new T.MeshBasicMaterial({ color: opt.capColor || 0xe05a3a, side: T.BackSide, clippingPlanes: [opt.clip] });
            const cap = new T.Mesh(mesh.geometry, cm); cap.userData.pid = p.id; cap.userData.cap = true; cap.visible = false; grp.add(cap); caps.push(cap);
          }
        }
      }
      grp.position.copy(base); grp.userData.rest = grp.quaternion.clone();
      root.add(grp);
      parts.set(p.id, { g: grp, base, ex: V3(p.ex || [0, 0, 0]), meshes, caps, def: p });
    }
    return { root, parts, c };
  };

  /* ---------------- viewer ---------------- */
  let envTex = null;
  function environment(renderer) {
    if (envTex) return envTex;
    const pm = new T.PMREMGenerator(renderer), sc = new T.Scene();
    const room = new T.Mesh(new T.BoxGeometry(20, 12, 20), new T.MeshBasicMaterial({ color: 0x3a4250, side: T.BackSide })); sc.add(room);
    const panel = (c, x, y, z, w, h, ry, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); sc.add(m); };
    panel(0xffffff, 0, 5.9, 0, 10, 6, 0, Math.PI / 2); panel(0xcfe3ff, -9.9, 2, 0, 6, 4, Math.PI / 2); panel(0xfff1d6, 9.9, 1, 3, 5, 3, -Math.PI / 2); panel(0x8090a8, 0, -5.9, 0, 20, 20, 0, Math.PI / 2);
    envTex = pm.fromScene(sc, 0.04).texture; pm.dispose(); return envTex;
  }

  M.viewer = function (host, o) {
    T = T || EL.THREE; o = o || {};
    if (!T) { host.textContent = 'three.js missing'; return null; }
    let renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: !!o.keep }); }
    catch (e) { host.innerHTML = '<div class="mc-nogl">' + EL.ui.T(['3D needs WebGL. Turn on hardware acceleration in the browser.', 'العرض 3D محتاج WebGL. شغّل تسريع الكارت في المتصفح.']) + '</div>'; return null; }
    renderer.setPixelRatio(Math.min(2, g.devicePixelRatio || 1)); renderer.localClippingEnabled = true;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    const cv = renderer.domElement; cv.className = 'mc-cv'; host.appendChild(cv);
    const lab = document.createElement('div'); lab.className = 'mc-labels'; host.appendChild(lab);
    const scene = new T.Scene(); scene.background = new T.Color(o.bg || 0x18202e); scene.environment = environment(renderer);
    scene.add(new T.HemisphereLight(0xdfe8ff, 0x26303f, 0.9));
    const sun = new T.DirectionalLight(0xffffff, 1.6); sun.position.set(5, 9, 7); scene.add(sun);
    const fill = new T.DirectionalLight(0xbfd4ff, 0.5); fill.position.set(-6, 3, -4); scene.add(fill);
    const grid = new T.GridHelper(40, 40, 0x2c3a52, 0x222c3d); grid.visible = o.grid !== false; scene.add(grid);
    const cam = new T.PerspectiveCamera(35, 1, 0.05, 2000);
    const clip = new T.Plane(new T.Vector3(0, 0, -1), 1e5);
    const V = { renderer, scene, cam, clip, host, cv, cur: null, k: 0, kT: 0, cut: false, labels: false, sel: null, hidden: new Set(), anim: 0, animT: 0, run: false, spin: 0, auto: false, onPick: null, dirty: true, items: [] };
    const orb = { th: 0.75, ph: 1.05, d: 10, tgt: new T.Vector3(), vth: 0, vph: 0 };
    function placeCam() {
      orb.ph = Math.max(0.08, Math.min(Math.PI - 0.08, orb.ph));
      cam.position.set(orb.tgt.x + orb.d * Math.sin(orb.ph) * Math.sin(orb.th), orb.tgt.y + orb.d * Math.cos(orb.ph), orb.tgt.z + orb.d * Math.sin(orb.ph) * Math.cos(orb.th));
      cam.lookAt(orb.tgt); V.dirty = true;
    }
    V.fit = function (obj, keepAngle) {
      obj = obj || V.focusObj || scene;
      const box = obj.isBoxProxy ? obj.box : new T.Box3().setFromObject(obj, true); if (box.isEmpty()) return;
      const sph = box.getBoundingSphere(new T.Sphere());
      orb.tgt.copy(sph.center); orb.d = Math.max(0.5, sph.radius / Math.sin((cam.fov * D2R) / 2) * 1.08);
      if (!keepAngle) { orb.th = 0.75; orb.ph = 1.08; }
      cam.near = orb.d / 200; cam.far = orb.d * 50; cam.updateProjectionMatrix();
      grid.position.y = box.min.y - 0.01; const gs = Math.max(1, sph.radius / 6); grid.scale.setScalar(gs);
      placeCam();
    };
    function resize() {
      const w = host.clientWidth || 300, h = host.clientHeight || 300;
      renderer.setSize(w, h, false); cv.style.width = w + 'px'; cv.style.height = h + 'px'; cam.aspect = w / h; cam.updateProjectionMatrix(); V.dirty = true; if (V.kick) V.kick();
    }
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null; if (ro) ro.observe(host); resize();

    /* component on stage */
    V.clear = function () {
      for (const it of V.items) { scene.remove(it.root); it.root.traverse((m) => { if (m.isMesh) { m.geometry.dispose(); m.material.dispose(); } }); }
      V.items = []; V.cur = null; V.sel = null; V.hidden.clear(); lab.innerHTML = ''; V.dirty = true;
    };
    V.show = function (c, o2) {
      V.clear(); o2 = o2 || {};
      const it = M.build(c, { clip, capColor: 0xe0633f }); scene.add(it.root); V.items.push(it); V.cur = it; V.focusObj = it.root;
      const ax = c.cut || 'z'; clip.normal.set(ax === 'x' ? -1 : 0, ax === 'y' ? -1 : 0, ax === 'z' ? -1 : 0);
      V.k = V.kT = o2.k || 0; V.anim = 0; V.animT = 0; V.run = false; V.spin = 0; V.setCut(!!o2.cut); V.apply(); V.fit(it.root); return it;
    };
    V.add = function (c, place) { // extra component (workshop): place = {p, r, size}
      const it = M.build(c, {}); const box = new T.Box3().setFromObject(it.root), sph = box.getBoundingSphere(new T.Sphere());
      const holder = new T.Group(); it.root.position.sub(sph.center); holder.add(it.root);
      if (place.size) holder.scale.setScalar(place.size / (sph.radius * 2));
      if (place.r) holder.rotation.set(...place.r.map((x) => x * D2R));
      if (place.p) holder.position.set(...place.p);
      scene.add(holder); const rec = { root: holder, parts: it.parts, c, tag: place.tag }; V.items.push(rec); V.dirty = true; return rec;
    };
    V.remove = function (rec) { const i = V.items.indexOf(rec); if (i < 0) return; scene.remove(rec.root); rec.root.traverse((m) => { if (m.isMesh) { m.geometry.dispose(); m.material.dispose(); } }); V.items.splice(i, 1); V.dirty = true; };
    V.fitAll = function () { const grp = new T.Box3(); for (const it of V.items) grp.expandByObject(it.root); if (grp.isEmpty()) return; const tmp = new T.Object3D(); V.fit({ isBoxProxy: true, box: grp }, true); void tmp; };
    V.fitK = function (k) { // frame the current component as it will look at explode k
      if (!V.cur) return;
      for (const pp of V.cur.parts.values()) pp.g.position.copy(pp.base).addScaledVector(pp.ex, k);
      V.cur.root.updateMatrixWorld(true); V.fit(V.cur.root, true);
      for (const pp of V.cur.parts.values()) pp.g.position.copy(pp.base).addScaledVector(pp.ex, V.k);
    };
    V.setCut = function (on) { V.cut = !!on; clip.constant = on ? 0 : 1e5; if (V.cur) for (const pp of V.cur.parts.values()) for (const cp of pp.caps) cp.visible = on && !V.hidden.has(pp.def.id); V.dirty = true; };
    V.setExplode = function (k, now) { V.kT = Math.max(0, Math.min(1, k)); if (now) V.k = V.kT; V.dirty = true; };
    V.select = function (pid) { V.sel = pid; V.apply(); if (V.onPick) V.onPick(pid); };
    V.setHidden = function (pid, hid) { hid ? V.hidden.add(pid) : V.hidden.delete(pid); V.apply(); V.setCut(V.cut); };
    V.apply = function () { // highlight, ghost, hide
      if (!V.cur) return;
      for (const [pid, pp] of V.cur.parts) {
        const vis = !V.hidden.has(pid); pp.g.visible = vis;
        for (const m of pp.meshes) {
          const mt = m.material, ghost = V.sel && V.sel !== pid;
          mt.emissive && mt.emissive.setHex(V.sel === pid ? 0x3a2a05 : 0x000000);
          const op = ghost ? Math.min(0.22, mt.userData.op) : mt.userData.op;
          mt.transparent = op < 1; mt.opacity = op; mt.depthWrite = op >= 1; mt.needsUpdate = true;
        }
        for (const cp of pp.caps) cp.material.color.setHex(V.sel && V.sel !== pid ? 0x6a5148 : V.sel === pid ? 0xffb020 : 0xe0633f);
      }
      V.dirty = true;
    };
    V.operate = function (on) { if (!V.cur || !V.cur.c.anim) return; const a = V.cur.c.anim; if (a.mode === 'spin') V.run = on != null ? on : !V.run; else V.animT = on != null ? (on ? 1 : 0) : V.animT ? 0 : 1; V.dirty = true; };
    V.setLabels = function (on) { V.labels = !!on; lab.innerHTML = ''; V.dirty = true; };

    function animParts(it, k, a, spin) {
      if (!it.c.anim) return;
      for (const pid in it.c.anim.parts || {}) {
        const pp = it.parts.get(pid), m = it.c.anim.parts[pid]; if (!pp) continue;
        const ang = it.c.anim.mode === 'spin' ? spin * (m.speed || 1) : ((m.a ? m.a[0] + (m.a[1] - m.a[0]) * a : 0) * D2R);
        if (m.rot) { pp.g.quaternion.copy(pp.g.userData.rest); pp.g.rotateOnAxis(V3(m.rot).normalize(), ang); }
        if (m.slide) { const s = it.c.anim.mode === 'spin' ? (Math.sin(spin * (m.speed || 1)) + 1) / 2 : a; pp.g.position.copy(pp.base).addScaledVector(pp.ex, k).addScaledVector(V3(m.slide), s); }
      }
    }
    function update(dt) {
      let busy = false;
      if (Math.abs(V.kT - V.k) > 1e-3) { V.k += (V.kT - V.k) * Math.min(1, dt * 8); busy = true; } else V.k = V.kT;
      if (Math.abs(V.animT - V.anim) > 1e-3) { V.anim += Math.sign(V.animT - V.anim) * Math.min(Math.abs(V.animT - V.anim), dt * 1.2); busy = true; }
      if (V.run) { V.spin += dt * 4; busy = true; }
      for (const it of V.items) {
        const k = it === V.cur ? V.k : 0;
        for (const pp of it.parts.values()) if (!pp.flying) pp.g.position.copy(pp.base).addScaledVector(pp.ex, k);
        if (it === V.cur || it.running) animParts(it, k, it === V.cur ? V.anim : 1, V.spin);
        for (const pp of it.parts.values()) if (pp.flying) { const f = pp.flying; f.t = Math.min(1, f.t + dt * 1.6); pp.g.position.lerpVectors(f.from, f.to, 1 - Math.pow(1 - f.t, 3)); if (f.t >= 1) pp.flying = null; busy = true; }
      }
      if (V.auto && !drag) { orb.th += dt * 0.35; placeCam(); busy = true; }
      if (Math.abs(orb.vth) + Math.abs(orb.vph) > 1e-4 && !drag) { orb.th += orb.vth; orb.ph += orb.vph; orb.vth *= 0.9; orb.vph *= 0.9; placeCam(); busy = true; }
      if (V.items.some((it) => it.running)) { V.spin += 0; busy = true; }
      return busy;
    }
    const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    V.slotPos = [];
    function proj(v3, w, h) { const c = v3.clone().project(cam); return c.z > 1 ? null : { x: (c.x + 1) / 2 * w, y: (1 - c.y) / 2 * h }; }
    /* callout anchor: a point that is really on the part as seen from the camera (the box centre of a casing is often
       inside it, on another part). Searched when the view is still, kept in part coordinates while it moves. */
    const anc = new Map(), labW = new Map();
    function anchorOf(pid, pp, w, h, still) {
      const a = anc.get(pid);
      if (a) return a.p.clone().applyMatrix4(pp.g.matrixWorld);
      const b = new T.Box3(); for (const m of pp.meshes) b.expandByObject(m);
      const ctr = b.getCenter(new T.Vector3());
      if (!still) return ctr;
      const r = host.getBoundingClientRect(), c0 = proj(ctr, w, h), cand = [ctr], v = new T.Vector3();
      for (const m of pp.meshes) {
        const pos = m.geometry && m.geometry.attributes && m.geometry.attributes.position; if (!pos) continue;
        const st = Math.max(1, Math.floor(pos.count / 10));
        for (let i = 0; i < pos.count; i += st) cand.push(v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).clone().lerp(m.getWorldPosition(new T.Vector3()), 0.12));
      }
      const pts = cand.map((p) => ({ p, q: proj(p, w, h) })).filter((o) => o.q && o.q.x > 4 && o.q.y > 4 && o.q.x < w - 4 && o.q.y < h - 4);
      if (c0) pts.sort((x, y) => Math.hypot(x.q.x - c0.x, x.q.y - c0.y) - Math.hypot(y.q.x - c0.x, y.q.y - c0.y));
      let best = null;
      for (const o of pts.slice(0, 24)) {
        const hit = V.pickAt(r.left + o.q.x, r.top + o.q.y); if (!hit) continue;
        let ob = hit.object; while (ob && !(ob.userData && ob.userData.pid)) ob = ob.parent;
        if (ob && ob.userData.pid === pid) { best = hit.point.clone(); break; }
      }
      // hidden inside other parts: point at its nearest surface point (a ring's box centre is in its hole)
      if (!best) best = (pts.find((o) => o.p !== ctr) || { p: ctr }).p;
      pp.g.updateMatrixWorld();
      anc.set(pid, { p: best.clone().applyMatrix4(pp.g.matrixWorld.clone().invert()) });
      return best;
    }
    function drawLabels(busy) {
      const w = host.clientWidth, h = host.clientHeight; let s = '';
      if (V.cur !== drawLabels.cur) { anc.clear(); drawLabels.cur = V.cur; }
      busy = busy || ptr.size > 0 || V.auto; // while the user turns the model, the anchors ride along (searched again when it stops)
      if (!busy) { const sig = cam.position.toArray().map((x) => x.toFixed(3)).join() + '|' + V.k.toFixed(3) + V.cut + V.hidden.size + V.anim.toFixed(3) + w + 'x' + h; if (sig !== drawLabels.sig) { anc.clear(); drawLabels.sig = sig; } }
      if (V.labels && V.cur) {
        /* callouts: anchor dot on the part, label in a column left or right of the model, leader line between */
        const items = [], fk = (g.innerWidth || 1200) <= 900 ? 'm' : 'd';
        for (const [pid, pp] of V.cur.parts) {
          if (V.hidden.has(pid) || !pp.meshes.length || !pp.g.visible) continue;
          const q = proj(anchorOf(pid, pp, w, h, !busy), w, h); if (!q) continue;
          const name = EL.ui.T(pp.def.name);
          items.push({ pid, x: q.x, y: q.y, name, lw: Math.min(labW.get(fk + name) || 120, w / 2 - 16) });
        }
        if (items.length) {
          let minX = Infinity, maxX = -Infinity; for (const it of items) { minX = Math.min(minX, it.x); maxX = Math.max(maxX, it.x); }
          const cx = (minX + maxX) / 2, narrow = w < 520;
          const colL = Math.max(8, Math.min(minX - 40, w * 0.3)), colR = Math.min(w - 8, Math.max(maxX + 40, w * 0.7));
          const sides = { L: items.filter((it) => it.x < cx), R: items.filter((it) => it.x >= cx) };
          let lines = '';
          for (const sd of ['L', 'R']) {
            const arr = sides[sd].sort((a, b) => a.y - b.y), lh = narrow ? 19 : 22;
            const gap = Math.max(lh, Math.min(narrow ? 22 : 26, arr.length > 1 ? (h - 24) / (arr.length - 1) : 99));
            for (let i = 0; i < arr.length; i++) arr[i].ly = Math.max(12, arr[i].y);
            for (let i = 1; i < arr.length; i++) if (arr[i].ly < arr[i - 1].ly + gap) arr[i].ly = arr[i - 1].ly + gap;
            const over = arr.length ? arr[arr.length - 1].ly - (h - 12) : 0;
            if (over > 0) { for (const it of arr) it.ly -= over; for (let i = arr.length - 2; i >= 0; i--) if (arr[i].ly > arr[i + 1].ly - gap) arr[i].ly = arr[i + 1].ly - gap; }
            for (const it of arr) {
              // keep the whole label inside the view: the column moves in when the label would be cut at the edge
              const lx = sd === 'L' ? Math.max(colL, it.lw + 6) : Math.min(colR, w - it.lw - 6);
              lines += '<polyline points="' + it.x.toFixed(0) + ',' + it.y.toFixed(0) + ' ' + (lx + (sd === 'L' ? 14 : -14)).toFixed(0) + ',' + it.ly.toFixed(0) + ' ' + lx.toFixed(0) + ',' + it.ly.toFixed(0) + '"/><circle cx="' + it.x.toFixed(0) + '" cy="' + it.y.toFixed(0) + '" r="3.5"/>';
              s += '<button type="button" class="mc-lab co ' + sd + (V.sel === it.pid ? ' on' : '') + '" data-pid="' + esc(it.pid) + '" title="' + esc(it.name) + '" style="left:' + lx.toFixed(0) + 'px;top:' + it.ly.toFixed(0) + 'px"><i>i</i><span>' + esc(it.name) + '</span></button>';
            }
          }
          s = '<svg class="mc-lead" width="' + w + '" height="' + h + '">' + lines + '</svg>' + s;
        }
      }
      V.slotPos = [];
      if (V.extra) for (const L of V.extra()) {
        const q = proj(new T.Vector3(...L.p), w, h); if (!q) continue; V.slotPos.push({ id: L.id, x: q.x, y: q.y });
        s += '<button type="button" class="mc-slot' + (L.cls ? ' ' + L.cls : '') + '" data-slot="' + esc(L.id) + '" style="left:' + q.x.toFixed(0) + 'px;top:' + q.y.toFixed(0) + 'px">' + esc(L.text) + '</button>';
      }
      if (lab.innerHTML !== s) {
        lab.innerHTML = s;
        /* measure the label widths (per name and font size); when one changed, draw again with it */
        let fresh = false; const fk = (g.innerWidth || 1200) <= 900 ? 'm' : 'd';
        for (const e of lab.querySelectorAll('.mc-lab.co')) { const k = fk + e.title, ow = e.offsetWidth; if (ow && Math.abs((labW.get(k) || 0) - ow) > 1) { labW.set(k, ow); fresh = true; } }
        if (fresh) V.kick();
      }
    }
    lab.addEventListener('click', (e) => { const b = e.target.closest('[data-slot]'); if (b && V.onSlot) { V.onSlot(b.dataset.slot); return; } const l = e.target.closest('[data-pid]'); if (l) V.select(V.sel === l.dataset.pid ? null : l.dataset.pid); });
    V.slotAt = function (cx, cy, max) { const r = host.getBoundingClientRect(); let best = null, bd = max || 90; for (const q of V.slotPos) { const d = Math.hypot(cx - r.left - q.x, cy - r.top - q.y); if (d < bd) { bd = d; best = q.id; } } return best; };
    let last = 0, raf = 0, alive = true;
    function loop(t) {
      raf = 0; if (!alive) return;
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
      const busy = update(dt);
      if (V.dirty || busy) { V.dirty = false; renderer.render(scene, cam); drawLabels(busy); } // drawLabels may ask for one more frame (new label widths)
      if (busy || V.dirty) raf = requestAnimationFrame(loop); else last = 0;
    }
    V.kick = function () { V.dirty = true; if (!raf && alive) raf = requestAnimationFrame(loop); };
    const _kick = V.kick;
    ['setCut', 'setExplode', 'apply', 'operate', 'setLabels', 'fit', 'fitAll'].forEach((k) => { const f = V[k]; V[k] = function () { const r = f.apply(V, arguments); _kick(); return r; }; });
    V.renderNow = function () { update(0.016); renderer.render(scene, cam); drawLabels(false); };
    V.dispose = function () { alive = false; if (ro) ro.disconnect(); V.clear(); renderer.dispose(); cv.remove(); lab.remove(); };
    V.orbit = orb; V.placeCam = placeCam;
    V.view = function (th, ph) { orb.th = th; orb.ph = ph; placeCam(); V.kick(); };

    /* pointer: rotate (1 finger / left), pan (2 fingers / right or shift), pinch / wheel zoom, tap to pick */
    const ptr = new Map(); let drag = null, pinch = 0;
    const ray = new T.Raycaster();
    V.pickAt = function (cx, cy) {
      const r = cv.getBoundingClientRect(), nd = new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(nd, cam);
      const objs = []; for (const it of V.items) it.root.traverse((m) => { if (m.isMesh && m.visible && !m.userData.cap && m.parent.visible) objs.push(m); });
      const hits = ray.intersectObjects(objs, false).filter((h) => !V.cut || !V.cur || h.object.material.clippingPlanes == null || clip.distanceToPoint(h.point) >= -1e-6);
      return hits[0] || null;
    };
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptr.size === 1) drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, pan: e.button === 2 || e.shiftKey, moved: false };
      else if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); if (drag) drag.pan = true; }
      V.auto = V.auto && false; orb.vth = orb.vph = 0;
    });
    cv.addEventListener('pointermove', (e) => {
      if (!ptr.has(e.pointerId) || !drag) return;
      ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptr.size === 2) {
        const [a, b] = [...ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) { orb.d = Math.max(0.3, orb.d * (pinch / d)); } pinch = d;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; if (drag.mx != null) panBy(mx - drag.mx, my - drag.my); drag.mx = mx; drag.my = my; drag.moved = true; placeCam(); V.kick(); return;
      }
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) drag.moved = true;
      if (drag.pan) panBy(dx, dy); else { orb.th -= dx * 0.008; orb.ph -= dy * 0.008; orb.vth = -dx * 0.002; orb.vph = -dy * 0.002; }
      placeCam(); V.kick();
    });
    function panBy(dx, dy) {
      const k = (orb.d * Math.tan((cam.fov * D2R) / 2) * 2) / (host.clientHeight || 400);
      const right = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
      orb.tgt.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
    }
    function up(e) {
      if (!ptr.has(e.pointerId)) return; ptr.delete(e.pointerId);
      if (ptr.size === 0 && drag) {
        if (!drag.moved && e.type === 'pointerup') { const hit = V.pickAt(e.clientX, e.clientY); if (V.onTap) V.onTap(hit, e); else V.select(hit && hit.object.userData.cid === (V.cur && V.cur.c.id) ? hit.object.userData.pid : null); }
        drag = null; pinch = 0; V.kick();
      } else if (ptr.size === 1) { pinch = 0; if (drag) { drag.mx = null; const q = [...ptr.values()][0]; drag.x = q.x; drag.y = q.y; } }
    }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('wheel', (e) => { e.preventDefault(); orb.d = Math.max(0.3, orb.d * (e.deltaY > 0 ? 1.1 : 1 / 1.1)); placeCam(); V.kick(); }, { passive: false });
    V.kick();
    return V;
  };
})(typeof window !== 'undefined' ? window : globalThis);
