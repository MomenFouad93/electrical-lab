/* SVG circuit editor: parts, wires, probes, pan/zoom, build/test modes */
(function (g) {
  const EL = g.EL, h = EL.h, ui = EL.ui;
  const NS = 'http://www.w3.org/2000/svg';
  const ROLE_COL = { L1: '#c07a33', L2: '#69718a', L3: '#b8c0d0', N: '#47BFD9', PE: 'url(#pegy)', pos: '#F55B41', neg: '#5a74e8', sec: '#e0bb62', '24V': '#F55B41', '0V': '#5a74e8' };
  const ROLE_PRI = ['PE', 'N', 'L1', 'L2', 'L3', 'pos', 'neg', '24V', '0V', 'sec'];
  const PAIR_PARTS = { MCB1: [['1', '2', 'L1']], FUSE: [['1', '2', 'L1']], MCB3: 3, MPCB: 3, ISOL3: 3, CONT3: 3, OL: 3 };
  const DIRV = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };

  EL.makeEditor = function (host, opts) {
    opts = Object.assign({ kind: 'bench', grid: 10 }, opts || {});
    const pcb = opts.kind === 'pcb';
    const ed = {
      c: EL.newCircuit(), mode: 'build', sel: null, selWire: null, pending: null, tool: 'wire', wireKind: 'trace',
      view: { x: 30, y: 30, k: 0.85 }, undoS: [], redoS: [], mains: true, kind: opts.kind, photo: null, showHidden: false,
    };
    host.innerHTML = '<svg class="cv" xmlns="' + NS + '"><g class="vp"><g class="photo"></g><g class="grid"></g><g class="back"></g><g class="parts"></g><g class="wires"></g><g class="probes"></g><g class="pins"></g><g class="over"></g><g class="marks"></g></g></svg><div class="hint" style="display:none"><span></span></div>';
    const svg = host.querySelector('svg'), vp = svg.querySelector('.vp');
    const L = { photo: vp.querySelector('.photo'), grid: vp.querySelector('.grid'), back: vp.querySelector('.back'), parts: vp.querySelector('.parts'), wires: vp.querySelector('.wires'), probes: vp.querySelector('.probes'), pins: vp.querySelector('.pins'), over: vp.querySelector('.over'), marks: vp.querySelector('.marks') };
    const hintEl = host.querySelector('.hint'), hintSp = hintEl.querySelector('span');
    /* wire size for new wires (panel bench only): bottom-left chip, like a wire spool picker */
    ed.newMm2 = null;
    if (!pcb && opts.kind === 'bench' && EL.WIRE) {
      try { const v = +localStorage.getItem('ellab.wireMm2'); if (EL.WIRE.ok(v)) ed.newMm2 = v; } catch (e) {}
      const chip = document.createElement('label'); chip.className = 'wsz';
      const sw = document.createElement('i'), lab = document.createElement('span'), sel = document.createElement('select');
      sw.className = 'wsz-sw'; sw.setAttribute('aria-hidden', 'true');
      chip.append(sw, lab, sel); host.appendChild(chip);
      const paint = () => {
        const WS = EL.WIRE, v = ed.newMm2;
        lab.textContent = EL.tr(['Wire', 'مقطع السلك']);
        chip.title = EL.tr(['Size of the next wires you draw. Select a wire to change its own size. ', 'مقاس الأسلاك اللي هترسمها بعد كده. اختار سلك عشان تغيّر مقاسه هو. ']) + EL.tr(WS.std);
        sel.innerHTML = '';
        const o0 = document.createElement('option'); o0.value = ''; o0.textContent = EL.tr(['Auto (1.5 power / 0.75 control)', 'تلقائي (1.5 باور / 0.75 كنترول)']); sel.appendChild(o0);
        for (const mm of WS.sizes) { const o = document.createElement('option'); o.value = String(mm); o.textContent = '\u200E' + mm + ' mm² (' + WS.iz[mm] + ' A)\u200E' + (mm < 1.5 ? ' ' + EL.tr(['control', 'كنترول']) : ''); sel.appendChild(o); }
        sel.value = v ? String(v) : '';
        sw.style.height = (v ? WS.width[v] : 2.6) * 1.6 + 'px';
      };
      sel.addEventListener('change', () => {
        const v = +sel.value; ed.newMm2 = EL.WIRE.ok(v) ? v : null;
        try { if (ed.newMm2) localStorage.setItem('ellab.wireMm2', String(ed.newMm2)); else localStorage.removeItem('ellab.wireMm2'); } catch (e) {}
        paint(); sel.blur();
      });
      chip.addEventListener('pointerdown', (e) => e.stopPropagation());
      paint(); if (ui.onRefresh) ui.onRefresh(paint);
      ed.wireChip = { el: chip, paint };
    }
    const cache = { art: new Map(), nodes: new Map(), pins: new Map(), wires: new Map() };
    ed.svg = svg; ed.host = host;

    /* ---------- view ---------- */
    function applyView() {
      vp.setAttribute('transform', `translate(${ed.view.x},${ed.view.y}) scale(${ed.view.k})`);
      if (ed.marksOn) scaleMarks();
      const gs = opts.grid * 4, k = ed.view.k, r = svg.getBoundingClientRect();
      // grid lines (only when zoomed in enough)
      if (k < 0.35) { L.grid.innerHTML = ''; return; }
      const x0 = Math.floor(-ed.view.x / k / gs) * gs, y0 = Math.floor(-ed.view.y / k / gs) * gs;
      const x1 = x0 + r.width / k + gs, y1 = y0 + r.height / k + gs;
      let s = '';
      for (let x = x0; x < x1; x += gs) s += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/>`;
      for (let y = y0; y < y1; y += gs) s += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>`;
      L.grid.innerHTML = s;
    }
    ed.applyView = applyView;
    ed.toWorld = (cx, cy) => {
      const r = svg.getBoundingClientRect();
      return { x: (cx - r.left - ed.view.x) / ed.view.k, y: (cy - r.top - ed.view.y) / ed.view.k };
    };
    ed.zoomAt = (f, cx, cy) => {
      const r = svg.getBoundingClientRect();
      if (cx == null) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
      const nk = Math.max(0.2, Math.min(3, ed.view.k * f)), w = ed.toWorld(cx, cy);
      ed.view.k = nk; ed.view.x = cx - r.left - w.x * nk; ed.view.y = cy - r.top - w.y * nk;
      applyView();
    };
    ed.fit = () => {
      const c = ed.c, r = svg.getBoundingClientRect();
      if (!c.parts.length || !r.width) { ed.view = { x: 30, y: 30, k: 0.85 }; applyView(); return; }
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const p of c.parts) { const d = EL.defs[p.type]; x0 = Math.min(x0, p.x - 20); y0 = Math.min(y0, p.y - 25); x1 = Math.max(x1, p.x + d.w + 40); y1 = Math.max(y1, p.y + d.h + 25); }
      const k = Math.max(0.2, Math.min(1.3, Math.min(r.width / (x1 - x0), r.height / (y1 - y0)) * 0.95));
      ed.view = { k, x: (r.width - (x1 - x0) * k) / 2 - x0 * k, y: (r.height - (y1 - y0) * k) / 2 - y0 * k };
      applyView();
    };

    /* ---------- undo ---------- */
    ed.push = () => { ed.undoS.push(EL.serialize(ed.c)); if (ed.undoS.length > 60) ed.undoS.shift(); ed.redoS = []; };
    function restore(s) {
      const sel = ed.sel;
      ed.c = EL.deserialize(s);
      restoreExtras(s);
      ed.sel = ed.c.parts.some((p) => p.id === sel) ? sel : null; ed.selWire = null;
      ed.render(); ed.changed();
    }
    ed.undo = () => { if (!ed.undoS.length) return; ed.redoS.push(EL.serialize(ed.c)); restore(ed.undoS.pop()); };
    ed.redo = () => { if (!ed.redoS.length) return; ed.undoS.push(EL.serialize(ed.c)); restore(ed.redoS.pop()); };
    function restoreExtras(s) { /* cut wires survive in wire objects (w.cut) */ }
    ed.hooks = [];
    ed.changed = () => { if (opts.onChange) opts.onChange(ed); for (const f of ed.hooks) { try { f(ed); } catch (e) {} } };

    /* ---------- mode / hint ---------- */
    ed.setMode = (m) => {
      ed.mode = m; ed.pending = null; ed.selWire = null; refreshPins();
      host.classList.toggle('testmode', m === 'test');
      L.wires.style.pointerEvents = m === 'test' && !(pcb && ed.tool === 'cut') ? 'none' : '';
      showHint();
      if (opts.onMode) opts.onMode(ed);
    };
    function showHint(msg) {
      const m = msg || (ed.pending ? EL.tr(['Tap the second terminal to finish the wire', 'اضغط على الطرف التاني عشان تكمل السلك']) : '');
      hintEl.style.display = m ? 'flex' : 'none'; hintSp.textContent = m;
    }
    ed.hint = showHint;

    /* ---------- circuit set ---------- */
    ed.setCircuit = (c, noFit) => {
      ed.c = c; ed.sel = null; ed.selWire = null; ed.pending = null; ed.undoS = []; ed.redoS = [];
      ed.clearMarks(); ed.resetLog();
      ed.render(); if (!noFit) requestAnimationFrame(() => ed.fit()); ed.changed();
    };

    /* ---------- roles for wire colors ---------- */
    let roleMap = new Map();
    ed.roleOf = (wid) => roleMap.get(wid) || null;
    function computeRoles() {
      const c = ed.c, uf = new EL.UF(), role = new Map();
      for (const w of c.wires) { uf.add(w.a); uf.add(w.b); uf.union(w.a, w.b); }
      const pinRole = (ref) => { const [id, pn] = ref.split('.'); const p = c.parts.find((x) => x.id === id); if (!p) return null; const q = EL.pin(p, pn); return q && q.role; };
      const setR = (nd, r) => { const old = role.get(nd); if (!old || ROLE_PRI.indexOf(r) < ROLE_PRI.indexOf(old)) role.set(nd, r); };
      for (const w of c.wires) for (const ref of [w.a, w.b]) { const r = pinRole(ref); if (r) setR(uf.find(ref), r); }
      for (let pass = 0; pass < 3; pass++) for (const p of c.parts) {
        const pp = PAIR_PARTS[p.type]; if (!pp) continue;
        const pairs = Array.isArray(pp) ? pp : [['1', '2', 'L1'], ['3', '4', 'L2'], ['5', '6', 'L3']];
        for (const [a, b, r0] of pairs) {
          const ra = p.id + '.' + a, rb = p.id + '.' + b;
          if (!uf.parent || true) { try { uf.add(ra); uf.add(rb); } catch (e) {} }
          const na = uf.find(ra), nb = uf.find(rb), A = role.get(na), B = role.get(nb);
          if (A && !B && /^L\d/.test(A)) role.set(nb, A); else if (B && !A && /^L\d/.test(B)) role.set(na, B);
          else if (A && !B && (A === 'N' || A === 'pos' || A === 'neg')) role.set(nb, A);
        }
      }
      roleMap = new Map(); for (const w of c.wires) roleMap.set(w.id, role.get(uf.find(w.a)) || null);
    }

    /* ---------- routing ---------- */
    const S = 16;
    function leg(p, q) {
      const dx = q.x - p.x, dy = q.y - p.y, ax = Math.abs(dx), ay = Math.abs(dy), d = Math.min(ax, ay);
      return ax >= ay ? { x: p.x + Math.sign(dx) * (ax - d), y: p.y } : { x: p.x, y: p.y + Math.sign(dy) * (ay - d) };
    }
    let fastRoute = false, occ = null, obsCache = null;
    function obsRects() {
      if (obsCache) return obsCache;
      const o = [];
      for (const p of ed.c.parts) { const d = EL.defs[p.type]; if (d) o.push({ l: p.x - 6, t: p.y - 6, r: p.x + d.w + 6, b: p.y + d.h + 6 }); }
      return o;
    }
    function segHit(p, q, r, s) {
      const l = r.l + s, t = r.t + s, rr = r.r - s, bb = r.b - s;
      if (Math.abs(p.y - q.y) < 0.01) { if (p.y <= t || p.y >= bb) return false; return Math.max(p.x, q.x) > l && Math.min(p.x, q.x) < rr; }
      if (Math.abs(p.x - q.x) < 0.01) { if (p.x <= l || p.x >= rr) return false; return Math.max(p.y, q.y) > t && Math.min(p.y, q.y) < bb; }
      return false;
    }
    function occAdd(pts) {
      if (!occ) return;
      for (let i = 0; i < pts.length - 1; i++) {
        const p = pts[i], q = pts[i + 1];
        if (Math.abs(p.y - q.y) < 0.01) { const k = Math.round(p.y); (occ.h.get(k) || occ.h.set(k, []).get(k)).push([Math.min(p.x, q.x), Math.max(p.x, q.x)]); }
        else if (Math.abs(p.x - q.x) < 0.01) { const k = Math.round(p.x); (occ.v.get(k) || occ.v.set(k, []).get(k)).push([Math.min(p.y, q.y), Math.max(p.y, q.y)]); }
      }
    }
    function occPen(map, k, lo, hi) {
      if (!occ) return 0;
      const l = map.get(Math.round(k)); if (!l) return 0;
      let t = 0; for (const [x1, x2] of l) { const o = Math.min(hi, x2) - Math.max(lo, x1); if (o > 0) t += o; }
      return t * 0.9;
    }
    function autoRoute(a, b, L0) {
      const n0 = L0.length; if (n0 < 4) return null;
      const O = obsRects();
      let clear = true;
      for (let i = 1; i <= n0 - 3 && clear; i++) for (const r of O) if (segHit(L0[i], L0[i + 1], r, 4)) { clear = false; break; }
      if (clear) return null;
      const a1 = L0[1], b1 = L0[n0 - 2];
      const xsS = new Set([a1.x, b1.x, (a1.x + b1.x) / 2]), ysS = new Set([a1.y, b1.y, (a1.y + b1.y) / 2]);
      const minx = Math.min(a1.x, b1.x) - 240, maxx = Math.max(a1.x, b1.x) + 240, miny = Math.min(a1.y, b1.y) - 240, maxy = Math.max(a1.y, b1.y) + 240;
      for (const r of O) for (const off of [0, 9, 18]) { xsS.add(r.l - off); xsS.add(r.r + off); ysS.add(r.t - off); ysS.add(r.b + off); }
      const xs = [...xsS].filter((x) => x >= minx && x <= maxx).sort((p, q) => p - q), ys = [...ysS].filter((y) => y >= miny && y <= maxy).sort((p, q) => p - q);
      const NX = xs.length, NY = ys.length, N = NX * NY;
      const inside = (x, y) => { for (const r of O) if (x > r.l && x < r.r && y > r.t && y < r.b) return true; return false; };
      const blocked = new Uint8Array(N);
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (inside(xs[i], ys[j])) blocked[j * NX + i] = 1;
      const ia = xs.indexOf(a1.x), ja = ys.indexOf(a1.y), ib = xs.indexOf(b1.x), jb = ys.indexOf(b1.y);
      if (ia < 0 || ja < 0 || ib < 0 || jb < 0) return null;
      const sIdx = ja * NX + ia, gIdx = jb * NX + ib;
      blocked[sIdx] = 0; blocked[gIdx] = 0;
      const edgeFree = (x1, y1, x2, y2) => { const p = { x: x1, y: y1 }, q = { x: x2, y: y2 }; for (const r of O) if (segHit(p, q, r, 0)) return false; return true; };
      const dist = new Float64Array(N * 2).fill(Infinity), prev = new Int32Array(N * 2).fill(-1), done = new Uint8Array(N * 2);
      const heap = [];
      const push = (c, st) => { heap.push([c, st]); let i = heap.length - 1; while (i > 0) { const pa = (i - 1) >> 1; if (heap[pa][0] <= heap[i][0]) break; [heap[pa], heap[i]] = [heap[i], heap[pa]]; i = pa; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
      const ad = DIRV[a.dir || 'u'], ax0 = ad[0] !== 0 ? 0 : 1;
      dist[sIdx * 2 + ax0] = 0; push(0, sIdx * 2 + ax0);
      let goal = -1;
      while (heap.length) {
        const [c, st] = pop();
        if (done[st]) continue; done[st] = 1;
        const idx = st >> 1, ax = st & 1, i = idx % NX, j = (idx / NX) | 0;
        if (idx === gIdx) { goal = st; break; }
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NX || nj >= NY) continue;
          const nidx = nj * NX + ni; if (blocked[nidx]) continue;
          if (idx === sIdx && di === -ad[0] && dj === -ad[1]) continue;
          const nax = di !== 0 ? 0 : 1;
          if (!edgeFree(xs[i], ys[j], xs[ni], ys[nj])) continue;
          const len = Math.abs(xs[ni] - xs[i]) + Math.abs(ys[nj] - ys[j]);
          const pen = nax === 0 ? occPen(occ && occ.h, ys[j], Math.min(xs[i], xs[ni]), Math.max(xs[i], xs[ni])) : occPen(occ && occ.v, xs[i], Math.min(ys[j], ys[nj]), Math.max(ys[j], ys[nj]));
          const nc = c + len + pen + (nax !== ax ? 28 : 0), nst = nidx * 2 + nax;
          if (nc < dist[nst]) { dist[nst] = nc; prev[nst] = st; push(nc, nst); }
        }
      }
      if (goal < 0) return null;
      const path = []; for (let st = goal; st >= 0; st = prev[st]) path.push({ x: xs[(st >> 1) % NX], y: ys[((st >> 1) / NX) | 0] });
      path.reverse();
      const pts = [a].concat(path, [b]), out = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const q = out[out.length - 1]; if (Math.abs(q.x - pts[i].x) < 0.1 && Math.abs(q.y - pts[i].y) < 0.1) continue;
        if (out.length >= 2) { const pp = out[out.length - 2]; if ((Math.abs(pp.x - q.x) < 0.1 && Math.abs(q.x - pts[i].x) < 0.1) || (Math.abs(pp.y - q.y) < 0.1 && Math.abs(q.y - pts[i].y) < 0.1)) { out[out.length - 1] = pts[i]; continue; } }
        out.push(pts[i]);
      }
      return out;
    }
    function route(a, b, bend, w) {
      if (!pcb) { const L0 = legacyRoute(a, b, bend); if (fastRoute || !w || bend || (w && w.via)) return L0; return autoRoute(a, b, L0) || L0; }
      if (pcb) {
        const list = [a].concat((w && w.via) || [], [b]), out = [a];
        for (let i = 0; i < list.length - 1; i++) { const c = leg(list[i], list[i + 1]); if (Math.abs(c.x - out[out.length - 1].x) > 0.1 || Math.abs(c.y - out[out.length - 1].y) > 0.1) out.push(c); out.push(list[i + 1]); }
        return out;
      }
      return null;
    }
    function legacyRoute(a, b, bend) {
      const o = (p) => ({ x: p.x + DIRV[p.dir || 'u'][0] * S, y: p.y + DIRV[p.dir || 'u'][1] * S });
      const a1 = o(a), b1 = o(b);
      const av = a.dir === 'u' || a.dir === 'd', bv = b.dir === 'u' || b.dir === 'd';
      const pts = [a, a1];
      if (av && bv) {
        let my;
        if (a.dir === 'd' && b.dir === 'u') my = a1.y <= b1.y ? (a1.y + b1.y) / 2 : a1.y;
        else if (a.dir === 'u' && b.dir === 'd') my = a1.y >= b1.y ? (a1.y + b1.y) / 2 : a1.y;
        else my = a.dir === 'd' ? Math.max(a1.y, b1.y) : Math.min(a1.y, b1.y);
        my += bend || 0; pts.push({ x: a1.x, y: my }, { x: b1.x, y: my });
      } else if (!av && !bv) {
        let mx = a.dir === 'r' ? Math.max(a1.x, b1.x) : Math.min(a1.x, b1.x);
        if (a.dir !== b.dir) mx = (a1.x + b1.x) / 2;
        mx += bend || 0; pts.push({ x: mx, y: a1.y }, { x: mx, y: b1.y });
      } else if (av) pts.push({ x: a1.x, y: b1.y });
      else pts.push({ x: b1.x, y: a1.y });
      pts.push(b1, b);
      const out = [pts[0]];
      for (let i = 1; i < pts.length; i++) { const q = out[out.length - 1]; if (Math.abs(q.x - pts[i].x) > 0.1 || Math.abs(q.y - pts[i].y) > 0.1) out.push(pts[i]); }
      return out;
    }
    function ptsD(pts) { return pts.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' '); }
    function wirePts(w) {
      const A = refPos(w.a), B = refPos(w.b);
      return A && B ? route(A, B, w.bend, w) : null;
    }
    function refPos(ref) { const [id, pn] = ref.split('.'); const p = ed.c.parts.find((x) => x.id === id); return p ? EL.pinPos(p, pn) : null; }
    ed.refPos = refPos;

    /* ---------- render ---------- */
    function pinKey(p) { return EL.pinsOf(p).map((q) => q.id + q.x + ',' + q.y + q.dir).join('|'); }
    ed.render = function () {
      L.back.innerHTML = ''; L.parts.innerHTML = ''; L.pins.innerHTML = ''; L.wires.innerHTML = '';
      cache.art.clear(); cache.nodes.clear(); cache.pins.clear(); cache.wires.clear();
      computeRoles();
      for (const p of ed.c.parts) mkPart(p);
      fastRoute = true; for (const w of ed.c.wires) mkWire(w); fastRoute = false; geomAll();
      applyView(); refreshPins();
    };
    function mkPart(p) {
      const d = EL.defs[p.type]; if (!d) return;
      const g1 = document.createElementNS(NS, 'g');
      g1.setAttribute('class', 'part' + (d.press ? ' press' : '') + (d.back ? ' back' : '')); g1.dataset.id = p.id;
      g1.innerHTML = `<rect class="hit" x="0" y="0" width="${d.w}" height="${d.hitH || d.h}"/><g class="art"></g><rect class="selbox" x="-5" y="-5" width="${d.w + 10}" height="${d.h + 10}" rx="9"/><text class="tag" x="${d.w + 6}" y="13"></text>`;
      g1.setAttribute('transform', `translate(${p.x},${p.y})`);
      (d.back ? L.back : L.parts).appendChild(g1);
      const g2 = document.createElementNS(NS, 'g'); g2.dataset.pid = p.id; g2.setAttribute('transform', `translate(${p.x},${p.y})`);
      L.pins.appendChild(g2);
      cache.nodes.set(p.id, { g: g1, art: g1.querySelector('.art'), tag: g1.querySelector('.tag'), sel: g1, pg: g2 });
      buildPins(p);
      drawArt(p, true);
    }
    function buildPins(p) {
      const n = cache.nodes.get(p.id); if (!n) return;
      let s = '';
      const realLab = ed.real && !pcb && EL.real && EL.real[p.type];
      for (const q of EL.pinsOf(p)) {
        const dv = DIRV[q.dir || 'u'];
        const lx = q.x + dv[0] * 12 + (dv[0] ? (dv[0] > 0 ? 0 : 0) : 0), ly = q.y + dv[1] * 12 + (dv[1] > 0 ? 6 : 0);
        const anchor = dv[0] > 0 ? 'start' : dv[0] < 0 ? 'end' : 'middle';
        s += `<g class="pin" data-pin="${p.id}.${q.id}"><circle class="hitc" cx="${q.x}" cy="${q.y}" r="${pcb ? 10 : 11}"/><circle class="dot" cx="${q.x}" cy="${q.y}" r="${pcb ? 6 : 4.6}"/>${(pcb && EL.defs[p.type].board) || realLab ? '' : `<text x="${lx}" y="${ly + 3}" text-anchor="${anchor}">${q.label == null ? q.id : q.label}</text>`}</g>`;
      }
      n.pg.innerHTML = s; cache.pins.set(p.id, pinKey(p));
    }
    function drawArt(p, force) {
      const n = cache.nodes.get(p.id), d = EL.defs[p.type]; if (!n) return;
      let s;
      try { const rf = ed.real && !pcb && EL.real && EL.real[p.type]; s = rf ? rf(p, d) : d.draw(p); } catch (e) { s = `<rect class="pbody" width="${d.w}" height="${d.h}"/><text class="psub" x="4" y="14">draw error</text>`; console.error(p.type, e); }
      if (p.fault && p.fault !== 'none' && !(p.hid && !ed.showHidden)) s += `<g transform="translate(${d.w - 14},-6)"><circle r="8" fill="#F55B41"/><text class="pbtn" y="4" text-anchor="middle">!</text></g>`;
      if (force || cache.art.get(p.id) !== s) { n.art.innerHTML = s; cache.art.set(p.id, s); }
      if (n.tag.textContent !== p.tag) n.tag.textContent = p.tag;
      if (cache.pins.get(p.id) !== pinKey(p)) buildPins(p);
    }
    function mkWire(w) {
      const gw = document.createElementNS(NS, 'g'); gw.dataset.wid = w.id;
      gw.innerHTML = '<path class="wire"></path><path class="wirehit"></path><g class="wmark"></g>';
      L.wires.appendChild(gw);
      cache.wires.set(w.id, { g: gw, p: gw.children[0], hit: gw.children[1], mark: gw.children[2], col: '', cls: '' });
      geomWire(w);
    }
    function geomWire(w) {
      const n = cache.wires.get(w.id); if (!n) return;
      const pts = wirePts(w); if (!pts) { n.p.setAttribute('d', ''); return; }
      occAdd(pts);
      const d = ptsD(pts);
      n.p.setAttribute('d', d); n.hit.setAttribute('d', d); n.pts = pts;
      let col;
      if (pcb) col = w.kind === 'jumper' ? '#58b8ff' : '#d9a441';
      else { const rr = roleMap.get(w.id); col = (w.color) || (!pcb && EL.real && EL.real.scheme() === 'ryb' && /^L[123]$/.test(rr || '') ? EL.real.phCol(rr) : ROLE_COL[rr]) || '#cfd8ee'; }
      n.p.style.stroke = col;
      if (!pcb) { if (EL.WIRE && EL.WIRE.ok(w.mm2)) n.p.style.setProperty('--ww', EL.WIRE.width[w.mm2]); else n.p.style.removeProperty('--ww'); }
      if (pcb) n.p.style.strokeWidth = w.kind === 'jumper' ? 3 : 7;
      if (pcb && w.kind === 'jumper') n.p.style.strokeDasharray = '';
      wireLook(w, n);
    }
    /* cut / burnt marks on the current path (no re-route) */
    function wireLook(w, n) {
      const pts = n.pts; n.cutS = !!w.cut; if (!pts) return;
      let m = '';
      const q = pts[Math.floor(pts.length / 2)], q2 = pts[Math.floor((pts.length - 1) / 2)], mx = (q.x + q2.x) / 2, my = (q.y + q2.y) / 2;
      if (w.cut) m = `<path class="cutmark" d="M${mx - 7} ${my - 7} L${mx + 7} ${my + 7} M${mx + 7} ${my - 7} L${mx - 7} ${my + 7}"/>`;
      if (w.burnt && !pcb) m = `<g class="burnmark" transform="translate(${mx.toFixed(1)},${my.toFixed(1)})"><circle r="10" fill="#2b1a12" stroke="#F55B41" stroke-width="2"/><path d="M0 -6 C4 -2 5 2 0 6 C-5 2 -4 -2 0 -6Z" fill="#F55B41"/></g>`;
      if (!pcb) n.g.classList.toggle('burnt', !!w.burnt);
      n.mark.innerHTML = (w.cut && (!w.hidden || ed.showHidden)) ? m : '';
      n.p.style.opacity = w.burnt && !pcb ? '1' : w.cut && (!w.hidden || ed.showHidden) ? '.25' : '1';
    }
    function geomAll() { occ = { h: new Map(), v: new Map() }; obsCache = obsRects(); try { for (const w of ed.c.wires) geomWire(w); } finally { occ = null; obsCache = null; } }
    function refreshPins() {
      for (const el of L.pins.querySelectorAll('.pin')) el.classList.toggle('pend', el.dataset.pin === ed.pending);
      for (const n of cache.nodes.values()) n.sel.classList.toggle('sel', n.sel.dataset.id === ed.sel);
      for (const [id, n] of cache.wires) { n.p.classList.toggle('sel', id === ed.selWire); }
      drawSelHandle();
    }
    function drawSelHandle() {
      L.over.innerHTML = '';
      if (!ed.selWire) return;
      const n = cache.wires.get(ed.selWire), w = ed.c.wires.find((x) => x.id === ed.selWire);
      if (!n || !n.pts || !w) return;
      const pts = n.pts;
      let s = '';
      if (pcb) {
        const A = refPos(w.a), B = refPos(w.b), hp = w.via && w.via[0] ? w.via[0] : { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
        s += `<circle class="bendh" cx="${hp.x}" cy="${hp.y}" r="9" fill="#FDC300" stroke="#222" stroke-width="2"/>`;
      } else if (pts.length >= 4) {
        const i = Math.floor(pts.length / 2) - 1, a = pts[i], b = pts[i + 1];
        s += `<circle class="bendh" cx="${(a.x + b.x) / 2}" cy="${(a.y + b.y) / 2}" r="9" fill="#FDC300" stroke="#222" stroke-width="2"/>`;
      }
      L.over.innerHTML = s;
    }
    ed.select = (id, wid) => { ed.sel = id || null; ed.selWire = wid || null; refreshPins(); if (opts.onSelect) opts.onSelect(ed); };
    ed.part = () => ed.c.parts.find((p) => p.id === ed.sel);

    /* ---------- per-frame ---------- */
    ed.frame = function (sim) {
      for (const p of ed.c.parts) drawArt(p);
      // wires: energised + current
      let refV = 0;
      if (sim && pcb) { const pw = ed.c.parts.find((q) => q.type === 'PCB_PWR'); if (pw) try { refV = sim.vdcAt(pw.id + '.neg'); } catch (e) {} }
      if (sim) for (const w of ed.c.wires) {
        const n = cache.wires.get(w.id); if (!n) continue;
        if (!pcb && n.cutS !== !!w.cut) { wireLook(w, n); if (w.burnt && ed.selWire === w.id && opts.onSelect) opts.onSelect(ed); }
        let en = false, cur = false;
        try {
          const vac = EL.cabs(sim.vacAt(w.a)), vdc = pcb ? Math.abs(sim.vdcAt(w.a) - refV) : Math.abs(sim.vdcAt(w.a));
          en = pcb ? vdc > 1.5 : vac > 20 || vdc > 5;
          const i = sim.iPin(w.a); cur = !w.cut && (EL.cabs(i.ac) > 0.03 || Math.abs(i.dc) > 0.003) && en;
        } catch (e) {}
        let hot = '';
        if (!pcb && ed.c.wth && ed.c.wth[w.id] && !w.cut) { const T = EL.WIRE.temp(ed.c, w); hot = T >= EL.WIRE.tHot ? ' hot2' : T > EL.WIRE.tMax ? ' hot1' : ''; }
        const cls = (en ? ' en' : '') + (cur ? ' cur' : '') + hot;
        if (n.cls !== cls) { n.cls = cls; n.p.setAttribute('class', 'wire' + cls + (ed.selWire === w.id ? ' sel' : '')); }
      }
      drawProbes();
    };
    function drawProbes() {
      const I = EL.inst; let s = '';
      if (ed.mode === 'test' || true) for (const k of ['red', 'black', 'clamp', 'ncv']) {
        const ref = I.probes[k]; if (!ref) continue;
        const pos = refPos(ref); if (!pos) continue;
        const dv = DIRV[pos.dir || 'u'], x = pos.x + dv[0] * 20, y = pos.y + dv[1] * 20;
        const col = { red: '#e03a3a', black: '#222', clamp: '#FDC300', ncv: '#47BFD9' }[k];
        const lab = { red: '+', black: '−', clamp: 'A', ncv: 'V' }[k];
        s += `<g class="probe"><line x1="${pos.x}" y1="${pos.y}" x2="${x}" y2="${y}" stroke="${col}" stroke-width="3"/>` +
          (k === 'clamp' || k === 'ncv' ? `<circle cx="${pos.x}" cy="${pos.y}" r="13" fill="none" stroke="${col}" stroke-width="4"/>` : '') +
          `<circle cx="${x}" cy="${y}" r="9" fill="${col}" stroke="#fff" stroke-width="1.5"/><text x="${x}" y="${y + 4}">${lab}</text></g>`;
      }
      if (cache.probeS !== s) { L.probes.innerHTML = s; cache.probeS = s; }
    }

    /* ---------- editing ops ---------- */
    function free(x, y, d) {
      return !ed.c.parts.some((p) => { const q = EL.defs[p.type]; return x < p.x + q.w + 14 && x + d.w + 14 > p.x && y < p.y + q.h + 14 && y + d.h + 14 > p.y; });
    }
    /* DIN rail: a device dropped near a rail clips onto it (centre on the rail) and lines up with its neighbour */
    function snapRail(p) {
      if (pcb || !EL.real) return false;
      const d = EL.defs[p.type]; if (!d || d.back || d.cat === 'draw') return false;
      const cy = p.y + d.h / 2;
      for (const r of ed.c.parts) {
        const rd = EL.defs[r.type]; if (!rd || !rd.rail) continue;
        const ry = r.y + rd.h / 2;
        if (Math.abs(cy - ry) > 45 || p.x + d.w < r.x + 4 || p.x > r.x + rd.w - 4) continue;
        p.y = Math.round(ry - d.h / 2);
        if (p.x < r.x) p.x = r.x + 4; if (p.x + d.w > r.x + rd.w) p.x = Math.max(r.x + 4, r.x + rd.w - d.w - 4);
        const mates = ed.c.parts.filter((q) => { if (q === p) return false; const qd = EL.defs[q.type]; return qd && !qd.back && qd.cat !== 'draw' && Math.abs(q.y + qd.h / 2 - ry) <= 1; }).sort((a, b) => a.x - b.x);
        for (const q of mates) { const qd = EL.defs[q.type], gap = p.x - (q.x + qd.w); if (gap >= 0 && gap < 24) p.x = q.x + qd.w + 6; }
        for (let k = 0; k < mates.length + 1; k++) { // never on top of a neighbour: move to the next free place on the right
          const hit = mates.find((q) => p.x < q.x + EL.defs[q.type].w + 4 && p.x + d.w + 4 > q.x); if (!hit) break;
          p.x = hit.x + EL.defs[hit.type].w + 6;
        }
        return true;
      }
      return false;
    }
    ed.snapRail = snapRail;
    ed.addPart = function (type, x, y, props, noPush) {
      const d = EL.defs[type]; if (!d) return null;
      const r = svg.getBoundingClientRect();
      if (x == null) { const w = ed.toWorld(r.left + r.width / 2, r.top + r.height / 2); x = w.x - d.w / 2; y = w.y - d.h / 2; x = Math.round(x / 10) * 10; y = Math.round(y / 10) * 10; for (let i = 0; i < 60 && !free(x, y, d); i++) { x += 30; if (i % 8 === 7) { x -= 240; y += 30; } } }
      else { x = Math.round((x - d.w / 2) / 10) * 10; y = Math.round((y - d.h / 2) / 10) * 10; }
      if (!noPush) ed.push();
      const p = EL.addPart(ed.c, type, x, y, props);
      if (snapRail(p)) ui.toast(['Clipped onto the DIN rail.', 'اتركّب على الريل.'], 'info', 1800);
      mkPart(p); ed.select(p.id); ed.changed();
      return p;
    };
    ed.delSel = function () {
      if (ed.selWire) { ed.push(); ed.c.wires = ed.c.wires.filter((w) => w.id !== ed.selWire); const n = cache.wires.get(ed.selWire); if (n) n.g.remove(); cache.wires.delete(ed.selWire); ed.selWire = null; computeRoles(); geomAll(); refreshPins(); ed.changed(); return; }
      if (!ed.sel) return;
      ed.push();
      const id = ed.sel;
      EL.removePart(ed.c, id);
      const n = cache.nodes.get(id); if (n) { n.g && 0; n.sel.remove(); n.pg.remove(); } cache.nodes.delete(id);
      ed.render(); ed.select(null); ed.changed();
    };
    ed.removeWire = (id) => { ed.c.wires = ed.c.wires.filter((w) => w.id !== id); ed.render(); ed.changed(); };
    ed.dup = function () {
      const p = ed.part(); if (!p) return;
      ed.push();
      const q = EL.addPart(ed.c, p.type, p.x + 30, p.y + 30, JSON.parse(JSON.stringify(p.props)));
      mkPart(q); ed.select(q.id); ed.changed();
    };
    ed.connect = function (a, b, o) {
      if (!a || !b || a === b) return null;
      ed.push();
      if (!pcb && ed.newMm2 && !(o && o.mm2)) o = Object.assign({ mm2: ed.newMm2 }, o || {});
      const w = EL.addWire(ed.c, a, b, o);
      if (!w) { ed.undoS.pop(); ui.toast(['Those two terminals are already wired.', 'الطرفين متوصلين بالفعل.'], 'warn'); return null; }
      computeRoles(); mkWire(w); geomAll(); ed.changed();
      return w;
    };
    ed.touch = function () { computeRoles(); geomAll(); for (const p of ed.c.parts) drawArt(p, true); ed.changed(); };
    ed.moveGeom = function (p) {
      const n = cache.nodes.get(p.id); if (!n) return;
      fastRoute = true;
      n.g.setAttribute('transform', `translate(${p.x},${p.y})`); n.pg.setAttribute('transform', `translate(${p.x},${p.y})`);
      geomAll();
    };
    ed.setWireMm2 = function (wid, mm2) {
      const w = ed.c.wires.find((x) => x.id === wid); if (!w) return;
      ed.push(); if (EL.WIRE.ok(mm2)) w.mm2 = +mm2; else delete w.mm2; geomWire(w); refreshPins(); ed.changed();
    };
    ed.replaceWire = function (wid) {
      const w = ed.c.wires.find((x) => x.id === wid); if (!w) return;
      ed.push(); EL.WIRE.replace(w, ed.c); geomWire(w); refreshPins(); ed.changed();
    };
    ed.toggleCut = function (wid) {
      const w = ed.c.wires.find((x) => x.id === wid); if (!w) return;
      ed.push(); w.cut = !w.cut; w.hidden = false; geomWire(w); ed.changed();
    };
    ed.setPhoto = function (url) {
      ed.photo = url;
      L.photo.innerHTML = url ? `<image href="${url}" x="0" y="0" width="${ed.photoW || 800}" opacity="${ed.photoOp == null ? 0.6 : ed.photoOp}" preserveAspectRatio="xMinYMin meet"/>` : '';
    };
    ed.photoStyle = function (w, op) { ed.photoW = w; ed.photoOp = op; if (ed.photo) ed.setPhoto(ed.photo); };

    /* ---------- probes ---------- */
    function placeProbe(ref) {
      const I = EL.inst, need = EL.instNeeds[I.sel];
      if (!need) return false;
      if (need.length === 1) { const k = need[0]; I.probes[k] = I.probes[k] === ref ? null : ref; }
      else {
        const k = need.indexOf(I.active) >= 0 ? I.active : need[0], o = need[1 - need.indexOf(k)];
        if (I.probes[k] === ref) I.probes[k] = null;
        else if (I.probes[o] === ref) { I.probes[o] = null; I.probes[k] = ref; }
        else { I.probes[k] = ref; if (!I.probes[o]) I.active = o; }
      }
      ui.click(); drawProbes(); if (opts.onProbe) opts.onProbe(ed);
      return true;
    }
    ed.placeProbe = placeProbe;


    /* ---------- diagnosis marks ---------- */
    const MK = {
      x: { fill: '#e5484d', glyph: '<path d="M-4.5 -4.5L4.5 4.5M4.5 -4.5L-4.5 4.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>' },
      q: { fill: '#f5a524', glyph: '<text y="4.6" text-anchor="middle" font-size="14" font-weight="800" fill="#1b1300">?</text>' },
      w: { fill: '#3b82f6', glyph: '<text y="4.6" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">!</text>' },
      ok: { fill: '#2fb170', glyph: '<path d="M-4.6 0.4L-1.4 3.6L4.8 -3.6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' },
    };
    ed.marksOn = false; ed.markList = [];
    function markXY(ref) {
      if (!ref) return null;
      if (ref.indexOf('.') > 0) { const q = refPos(ref); if (q) return { x: q.x + 13, y: q.y - 13 }; }
      const pid = ref.split('.')[0], p = ed.c.parts.find((x) => x.id === pid), d = p && EL.defs[p.type];
      return p && d ? { x: p.x + 2, y: p.y + 2 } : null;
    }
    function scaleMarks() {
      const k = Math.max(0.55, Math.min(1.9, 1 / ed.view.k));
      for (const g1 of L.marks.querySelectorAll('.mk')) g1.setAttribute('transform', `translate(${g1.dataset.x},${g1.dataset.y}) scale(${k})`);
    }
    ed.setMarks = function (list) {
      ed.markList = list || []; ed.marksOn = ed.markList.length > 0;
      let s = '';
      ed.markList.forEach((m, i) => {
        const xy = markXY(m.ref), st = MK[m.sym]; if (!xy || !st) return;
        s += `<g class="mk ${m.sym}${m.sym === 'x' ? ' pulse' : ''}" data-i="${i}" data-x="${xy.x.toFixed(1)}" data-y="${xy.y.toFixed(1)}"><circle r="11.5" fill="${st.fill}" stroke="#0b0f19" stroke-width="2"/>${st.glyph}${m.txt ? '<title>' + String(EL.tr(m.txt)).replace(/</g, '&lt;') + '</title>' : ''}</g>`;
      });
      L.marks.innerHTML = s; if (ed.marksOn) scaleMarks();
    };
    ed.clearMarks = function () { ed.markList = []; ed.marksOn = false; L.marks.innerHTML = ''; };
    ed.focusRef = function (ref) {
      const xy = markXY(ref) || (function () { const q = refPos(ref); return q; })(); if (!xy) return;
      const r = svg.getBoundingClientRect(); if (!r.width) return;
      ed.view.x = r.width / 2 - xy.x * ed.view.k; ed.view.y = r.height / 2 - xy.y * ed.view.k; applyView();
    };
    /* what the operator did in Test mode (used to replay the same steps on suspect faults) */
    ed.resetLog = function () { ed.oplog = []; ed.opInit = EL.ts ? EL.ts.snapOps(ed.c) : {}; ed.opT = ed.c.time || 0; };
    ed.oplog = []; ed.opInit = {};
    function logOps(p, before) {
      if (!EL.ts) return;
      for (const k of EL.ts.opKeys(p)) {
        if (before[k] === p.state[k]) continue;
        const now = ed.c.time || 0;
        if (ed.oplog.length) ed.oplog[ed.oplog.length - 1].t = Math.max(0.3, Math.min(12, now - ed.opT)); else ed.opLead = Math.max(0, now - ed.opT);
        ed.opT = now;
        if (!ed.opInit[p.id]) { ed.opInit[p.id] = {}; for (const q of EL.ts.opKeys(p)) ed.opInit[p.id][q] = q === k ? before[k] : p.state[q]; }
        else if (!(k in ed.opInit[p.id])) ed.opInit[p.id][k] = before[k];
        ed.oplog.push({ id: p.id, k, v: p.state[k], t: 2 });
        if (ed.oplog.length > 60) ed.oplog.shift();
      }
    }
    ed.finishLog = function () { if (ed.oplog.length) ed.oplog[ed.oplog.length - 1].t = Math.max(1, Math.min(8, (ed.c.time || 0) - ed.opT)); return ed.oplog.map((x) => Object.assign({}, x)); };
    const snapKeys = (p) => { const o = {}; for (const k of (EL.ts ? EL.ts.opKeys(p) : [])) o[k] = p.state[k]; return o; };

    /* ---------- pointer handling ---------- */
    const ptrs = new Map();
    let gest = null, pinchD = 0, lp = null;
    function targetOf(e) {
      const t = e.target;
      if (t.closest) {
        const bh = t.closest('.bendh'); if (bh) return { k: 'bend' };
        const pin = t.closest('[data-pin]'); if (pin) return { k: 'pin', ref: pin.dataset.pin };
        const part = t.closest('.part'); if (part) return { k: 'part', id: part.dataset.id, el: t };
        const wr = t.closest('[data-wid]'); if (wr) return { k: 'wire', id: wr.dataset.wid };
      }
      return { k: 'bg' };
    }
    svg.addEventListener('pointerdown', (e) => {
      ui.unlockAudio();
      if (e.button === 2) return;
      svg.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) { gest = { k: 'pinch' }; const [a, b] = [...ptrs.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); clearLP(); return; }
      if (ptrs.size > 2) return;
      const mkEl = e.target.closest && e.target.closest('.mk');
      if (mkEl) { if (opts.onMark) opts.onMark(ed.markList[+mkEl.dataset.i], +mkEl.dataset.i); gest = null; return; }
      let t = targetOf(e); const w = ed.toWorld(e.clientX, e.clientY);
      if (ui.explain && ui.explain.on && !pcb && t.k !== 'bg' && t.k !== 'bend' && ptrs.size <= 1) { gest = null; ui.explain.tap(ed, host, t); return; }
      // Test mode, zoomed out (phones, Whole plant): a tap on a terminal of a switch / button operates the device;
      // with no meter tool a terminal tap always goes to the device
      if (t.k === 'pin' && ed.mode === 'test' && !pcb) {
        const pid = t.ref.split('.')[0], pp = ed.c.parts.find((x) => x.id === pid), dd = pp && EL.defs[pp.type];
        const noMeter = !(EL.inst && EL.instNeeds && EL.instNeeds[EL.inst.sel]);
        if (dd && dd.press && (ed.view.k < 0.9 || noMeter)) { const pe = L.parts.querySelector('.part[data-id="' + pid + '"]'); t = { k: 'part', id: pid, el: pe || e.target }; }
      }
      gest = { k: 'none', t, sx: e.clientX, sy: e.clientY, moved: false, w0: w, v0: { x: ed.view.x, y: ed.view.y } };
      if (t.k === 'pin') {
        if (ed.mode === 'test') { placeProbe(t.ref); gest.k = 'done'; return; }
        gest.k = 'wiredrag'; gest.from = t.ref;
      } else if (t.k === 'part') {
        const p = ed.c.parts.find((x) => x.id === t.id);
        if (ed.mode === 'test') {
          ed.select(p.id);
          const d = EL.defs[p.type];
          if (d.press) {
            const lx = w.x - p.x, ly = w.y - p.y, btn = t.el.closest && t.el.closest('[data-btn]');
            const before = snapKeys(p);
            const r = d.press(p, { type: 'down', lx, ly, btn: btn ? btn.dataset.btn : null });
            logOps(p, before);
            if (r && r.msg) ui.toast(r.msg, 'warn');
            gest.k = 'press'; gest.pid = p.id;
            lp = setTimeout(() => { if (gest && gest.k === 'press') { const b2 = snapKeys(p); d.press(p, { type: 'hold', lx, ly }); logOps(p, b2); gest.held = true; } }, 600);
            ed.pulse && ed.pulse();
          } else gest.k = 'selonly';
        } else {
          ed.select(p.id); gest.k = 'partdrag'; gest.p = p; gest.px = p.x; gest.py = p.y; gest.pushed = false;
        }
      } else if (t.k === 'wire') {
        if (ed.mode === 'build') {
          if (pcb && ed.tool === 'cut') { ed.toggleCut(t.id); gest.k = 'done'; return; }
          ed.select(null, t.id); gest.k = 'done';
        } else if (pcb && ed.tool === 'cut') { ed.toggleCut(t.id); gest.k = 'done'; }
        else gest.k = 'pan';
      } else if (t.k === 'bend') {
        gest.k = pcb ? 'via' : 'bend'; gest.wire = ed.c.wires.find((x) => x.id === ed.selWire); gest.b0 = gest.wire ? gest.wire.bend || 0 : 0; gest.pushed = false;
      } else { gest.k = 'pan'; }
    });
    function clearLP() { if (lp) { clearTimeout(lp); lp = null; } }
    svg.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) {
        return;
      }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!gest) return;
      if (gest.k === 'pinch' && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchD) ed.zoomAt(d / pinchD, (a.x + b.x) / 2, (a.y + b.y) / 2);
        pinchD = d; return;
      }
      const dx = e.clientX - gest.sx, dy = e.clientY - gest.sy;
      if (!gest.moved && Math.hypot(dx, dy) > 6) gest.moved = true;
      if (!gest.moved) return;
      const w = ed.toWorld(e.clientX, e.clientY);
      if (gest.k === 'pan') { ed.view.x = gest.v0.x + dx; ed.view.y = gest.v0.y + dy; applyView(); }
      else if (gest.k === 'partdrag') {
        if (!gest.pushed) { ed.push(); gest.pushed = true; }
        gest.p.x = Math.round((gest.px + (w.x - gest.w0.x)) / 10) * 10; gest.p.y = Math.round((gest.py + (w.y - gest.w0.y)) / 10) * 10;
        ed.moveGeom(gest.p);
      } else if (gest.k === 'wiredrag') {
        const A = refPos(gest.from); if (!A) return;
        const el = document.elementFromPoint(e.clientX, e.clientY), pin = el && el.closest && el.closest('[data-pin]');
        const to = pin ? refPos(pin.dataset.pin) : w;
        gest.to = pin ? pin.dataset.pin : null;
        for (const q of L.pins.querySelectorAll('.pin.hot')) q.classList.remove('hot');
        if (pin) pin.classList.add('hot');
        L.over.innerHTML = `<path d="${ptsD(route(A, Object.assign({ dir: pin ? to.dir : opposite(A.dir) }, to)))}" fill="none" stroke="#FDC300" stroke-width="3" stroke-dasharray="6 5"/>`;
      } else if (gest.k === 'via' && gest.wire) {
        if (!gest.pushed) { ed.push(); gest.pushed = true; }
        const A = refPos(gest.wire.a), B = refPos(gest.wire.b), q = { x: Math.round(w.x / 10) * 10, y: Math.round(w.y / 10) * 10 };
        const dd = Math.abs((B.y - A.y) * q.x - (B.x - A.x) * q.y + B.x * A.y - B.y * A.x) / (Math.hypot(B.x - A.x, B.y - A.y) || 1);
        gest.wire.via = dd < 8 ? null : [q];
        geomWire(gest.wire); drawSelHandle();
      } else if (gest.k === 'bend' && gest.wire) {
        if (!gest.pushed) { ed.push(); gest.pushed = true; }
        const n = cache.wires.get(gest.wire.id), pts = n.pts, i = Math.floor(pts.length / 2) - 1, a = pts[i], b = pts[i + 1];
        const horiz = Math.abs(a.y - b.y) < 0.5;
        gest.wire.bend = Math.round(gest.b0 + (horiz ? w.y - gest.w0.y : w.x - gest.w0.x));
        geomWire(gest.wire); drawSelHandle();
      }
    });
    function opposite(d) { return { u: 'd', d: 'u', l: 'r', r: 'l' }[d || 'u']; }
    /* after a wire between two 3-phase terminals (L1 -> 1, 2 -> U1 ...), offer to wire the other phases the same way */
    const GROUPS = [['L1', 'L2', 'L3'], ['1', '3', '5'], ['2', '4', '6'], ['U1', 'V1', 'W1'], ['U2', 'V2', 'W2'], ['W2', 'U2', 'V2'], ['U', 'V', 'W'], ['R', 'S', 'T'], ['T1', 'T2', 'T3'], ['L1', 'N1', 'L2']];
    function groupOf(ref) {
      const [id, pn] = ref.split('.'), p = ed.c.parts.find((x) => x.id === id); if (!p) return null;
      const ids = EL.pinsOf(p).map((q) => q.id);
      if (p.type === 'RCD2') return null;
      for (const g of GROUPS) { const i = g.indexOf(pn); if (i >= 0 && g.every((x) => ids.includes(x))) return { id, g, i }; }
      return null;
    }
    let phaseBox = null;
    function closePhases() { if (phaseBox) { phaseBox.remove(); phaseBox = null; } }
    function suggestPhases(a, b) {
      closePhases();
      let off = false; try { off = localStorage.getItem('ellab.autoPhase') === 'off'; } catch (e) {}
      if (off) return;
      const A = groupOf(a), B = groupOf(b); if (!A || !B || A.id === B.id || A.i !== B.i) return;
      const used = (ref) => ed.c.wires.some((w) => w.a === ref || w.b === ref);
      const pairs = [];
      for (let i = 0; i < 3; i++) { if (i === A.i) continue; const ra = A.id + '.' + A.g[i], rb = B.id + '.' + B.g[i]; if (!used(ra) && !used(rb)) pairs.push([ra, rb, A.g[i]]); }
      if (!pairs.length) return;
      const pick = pairs.map(() => true);
      const T2 = (x) => EL.tr(x), mk = (tag, cls, txt, f) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; if (f) e.addEventListener('click', f); return e; };
      phaseBox = mk('div', 'phase-ask');
      phaseBox.append(mk('b', '', '⚡ ' + T2(['Wire the other ' + pairs.length + ' phases the same way?', 'اربط باقي الفازات (' + pairs.length + ') بنفس الطريقة؟'])));
      const chips = mk('div', 'pa-chips');
      pairs.forEach((pr, i) => { const c = mk('button', 'chip on', '✓ ' + pr[2], () => { pick[i] = !pick[i]; c.classList.toggle('on', pick[i]); c.textContent = (pick[i] ? '✓ ' : '') + pr[2]; }); c.type = 'button'; chips.append(c); });
      const row = mk('div', 'pa-row');
      const yes = mk('button', 'btn pri', T2(['Wire them', 'اربطها']) + ' ✓', () => { closePhases(); let n = 0; pairs.forEach((pr, i) => { if (pick[i] && ed.connect(pr[0], pr[1])) n++; }); if (n > 1) ed.undoS.splice(ed.undoS.length - (n - 1), n - 1); if (n) ui.toast(EL.tr(['Wired ' + n + ' more phase(s).', 'اتربط ' + n + ' فاز كمان.']), 'ok', 2200); refreshPins(); });
      const no = mk('button', 'btn', T2(['No', 'لا']), closePhases);
      const never = mk('button', 'linkb', T2(["Don't ask again", 'متسألنيش تاني']), () => { try { localStorage.setItem('ellab.autoPhase', 'off'); } catch (e) {} closePhases(); ui.toast(['You can turn it back on from Display.', 'تقدر ترجّعه من زرار العرض.'], 'info'); });
      [yes, no].forEach((x) => { x.type = 'button'; }); never.type = 'button';
      row.append(yes, no); phaseBox.append(chips, row, never);
      host.appendChild(phaseBox);
      setTimeout(() => { if (phaseBox) yes.focus({ preventScroll: true }); }, 30);
      clearTimeout(suggestPhases.t); suggestPhases.t = setTimeout(closePhases, 15000);
    }
    ed.suggestPhases = suggestPhases;
    function end(e) {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      clearLP();
      if (!gest) return;
      if (gest.k === 'pinch') { if (ptrs.size < 2) { gest = null; pinchD = 0; } return; }
      const g1 = gest; gest = null;
      for (const q of L.pins.querySelectorAll('.pin.hot')) q.classList.remove('hot');
      if (g1.k === 'press') {
        const p = ed.c.parts.find((x) => x.id === g1.pid), d = p && EL.defs[p.type];
        if (d && d.press) { const b3 = p ? snapKeys(p) : {}; d.press(p, { type: 'up' }); if (p) logOps(p, b3); }
        return;
      }
      if (g1.k === 'wiredrag') {
        L.over.innerHTML = '';
        if (g1.moved && g1.to && g1.to !== g1.from) {
          ed.pending = null; const w1 = ed.connect(g1.from, g1.to, pcb ? { kind: ed.wireKind } : null); showHint(); refreshPins(); if (w1 && !pcb) suggestPhases(g1.from, g1.to);
        } else if (!g1.moved) {
          if (ed.pending && ed.pending !== g1.from) { const a = ed.pending; ed.pending = null; const w1 = ed.connect(a, g1.from, pcb ? { kind: ed.wireKind } : null); if (w1 && !pcb) suggestPhases(a, g1.from); }
          else ed.pending = ed.pending === g1.from ? null : g1.from;
          showHint(); refreshPins();
        }
        return;
      }
      if (g1.k === 'pan' && !g1.moved && g1.t && g1.t.k === 'wire' && ed.mode === 'test' && !pcb) { ed.select(null, g1.t.id); return; }
      if (g1.k === 'pan' && !g1.moved) { if (ed.pending) { ed.pending = null; showHint(); } ed.select(null); refreshPins(); return; }
      if (g1.k === 'partdrag') { if (g1.moved && g1.p && snapRail(g1.p)) ed.moveGeom(g1.p); fastRoute = false; geomAll(); if (g1.moved) ed.changed(); }
      if (g1.k === 'bend' || g1.k === 'via') drawSelHandle();
    }
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('wheel', (e) => { e.preventDefault(); ed.zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); }, { passive: false });
    svg.addEventListener('contextmenu', (e) => e.preventDefault());
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => applyView()) : null;
    if (ro) ro.observe(host);

    ed.keydown = function (e) {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && ed.mode === 'build') { ed.delSel(); e.preventDefault(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.shiftKey ? ed.redo() : ed.undo(); e.preventDefault(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'y') { ed.redo(); e.preventDefault(); }
      else if (e.key === 'Escape') { ed.pending = null; ed.select(null); showHint(); }
    };
    ed.refresh = refreshPins;
    ed.render();
    return ed;
  };
})(typeof window !== 'undefined' ? window : globalThis);
