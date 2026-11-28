/* Draw from a picture or a PDF: the pure part (no DOM). Builds the catalog the AI may use, the prompt,
   and turns the AI answer into a checked panel / plant / mechanical result. Node-testable.
   The dialog is src/ui/import_ai.js. Real model calls go through EL.ai.ask (src/ai.js). */
(function (g) {
  const EL = g.EL;
  const AIM = (EL.aiImport = {});
  AIM.KINDS = ['panel', 'plant', 'mech'];
  AIM.LIM = { parts: 200, wires: 600, units: 120, pipes: 400, notes: 20, text: 300, mparts: 60, steps: 40 };
  /* panel part families the AI may use (PCB / board-only and pure electronics are left out) */
  const PANEL_CATS = ['source', 'protect', 'power', 'control', 'load', 'field', 'auto', 'wiring', 'draw'];
  const SKIP_T = /^(NOTE|FRAME_S|FRAME_M|FRAME_L|CAB\d|LUG|JBOX|LAMPH|WSW1|WSW2|WSWX|SOCK|MCU)$/;
  /* panel types that a P&ID may carry as linked field devices */
  const LINK_T = ['MOT3', 'MOT1', 'SOL', 'HTR', 'FLOAT', 'PROX', 'PHOTO', 'PRESS', 'FLOW', 'LIM', 'TX', 'TXV', 'PT100'];
  const SKIP_U = /^(CTRL)$/;
  /* plant props that hold a panel tag */
  const LINK_P = /^(motor|sol|lt|tt|htr|tx|sw|s1|s2|cyl|rup|rdn|lvt|stk)$/;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const str = (v, n) => String(v == null ? '' : v).replace(/[<>`]/g, '').replace(/\s+/g, ' ').trim().slice(0, n || AIM.LIM.text);
  const TAGRX = /[^A-Za-z0-9_\-\/+]/g;
  const tagOf = (v) => String(v == null ? '' : v).trim().replace(/\s+/g, '').replace(TAGRX, '').slice(0, 14);
  AIM.str = str; AIM.tagOf = tagOf;

  /* ---------------- catalog ---------------- */
  function pinIds(type) {
    const d = EL.defs[type];
    let pins = d.pins;
    if (typeof pins === 'function') { try { pins = EL.pinsOf(EL.newPart(type, 0, 0)); } catch (e) { pins = []; } }
    return (pins || []).map((p) => (p.label && p.label !== p.id && String(p.label).length <= 12 ? p.id + '(' + p.label + ')' : p.id));
  }
  function propTxt(p) {
    if (p.t === 'sel') return p.k + '=' + p.opts.map((o) => o[0]).join('/') + ' def ' + p.def;
    if (p.t === 'num') return p.k + '=' + p.min + '..' + p.max + ' def ' + p.def;
    if (p.t === 'bool') return p.k + '=true/false';
    if (p.t === 'text1') return p.k + '=text';
    return null;
  }
  AIM.panelTypes = function (all) {
    return Object.keys(EL.defs).filter((t) => {
      const d = EL.defs[t];
      if (all === 'link') return LINK_T.includes(t);
      return PANEL_CATS.includes(d.cat) && !SKIP_T.test(t);
    });
  };
  AIM.panelCatalog = function (which) {
    const L = [];
    for (const t of AIM.panelTypes(which)) {
      const d = EL.defs[t];
      const pr = (d.props || []).filter((p) => p.k !== 'locked').map(propTxt).filter(Boolean);
      L.push(t + ' | ' + d.name[0] + ' | ' + d.w + 'x' + d.h + ' | pins: ' + pinIds(t).join(' ') + (pr.length ? ' | ' + pr.join('; ') : ''));
    }
    return L.join('\n');
  };
  AIM.plantTypes = () => Object.keys(EL.plant.defs).filter((t) => !SKIP_U.test(t));
  AIM.plantCatalog = function () {
    const U = EL.plant.defs, L = [];
    for (const t of AIM.plantTypes()) {
      const d = U[t];
      const pr = Object.keys(d.props).filter((k) => k !== 'flip').map((k) => (LINK_P.test(k) && typeof d.props[k] === 'string' ? k + '=<panel tag>' : k + '=' + JSON.stringify(d.props[k])));
      if (t === 'TANK') pr.push('sw=[{"n":"LSH1","l":90,"t":<panel tag>}] (level switches, l in %)');
      L.push(t + ' | ' + d.name[0] + ' | ' + d.w + 'x' + d.h + ' | ports: ' + d.ports.map((p) => p[0]).join(' ') + (pr.length ? ' | ' + pr.join(' ') : ''));
    }
    return L.join('\n');
  };
  AIM.mechCatalog = function () {
    const M = EL.mech;
    if (!M || !M.lib) return '';
    return M.lib.map((c) => c.id + ' | ' + c.name[0]).join('\n');
  };

  /* ---------------- prompt ---------------- */
  const SYS = 'You read technical drawings from equipment manuals (wiring diagrams, P&IDs, mechanical drawings) and turn them into data for an offline training simulator for maintenance technicians. ' +
    'Use ONLY the types, pins and ports in the catalog you are given. Never invent a type, pin or port: if a device has no match, leave it out and say so in "unsure". ' +
    'Keep the device tags printed on the drawing when they exist (e.g. -KM1 becomes KM1). Tags: letters, digits, - _ / only, no dots, at most 14 characters, unique. ' +
    'Do not guess values you cannot read; say what you assumed in "notes". Return ONLY one JSON object, no prose before or after.';
  AIM.SYSTEM = SYS;
  const LAYOUT_PANEL = 'Layout (panel coordinates, same units as the catalog sizes w x h, grid 10): power circuit on the left, flowing top to bottom (supply at y=20, then protection, contactors, overloads, motor at the bottom); control circuit to the right of it starting at x=400, left to right in the order of the drawing, inputs above, coils and lamps below; PLC and power supply top right. No two parts may overlap: keep 30 or more between boxes. x and y are the top-left corner.';
  const LAYOUT_PLANT = 'Layout (plant coordinates, grid 10): flow from left to right, main line around y=300, tanks taller so put them higher (y about 80), instruments in line on the pipe between units, branches below. No overlaps: keep 40 or more between boxes. x and y are the top-left corner.';
  AIM.prompt = function (kind, o) {
    o = o || {};
    const lang = o.lang || 'Answer in English.';
    const extra = [];
    if (o.page) extra.push('Page hint from the user: ' + str(o.page, 120) + '. Look at that part of the document first.');
    if (o.note) extra.push('Note from the user: ' + str(o.note, 400));
    const textLang = 'Write "notes", "unsure" and all descriptive texts in this language: ' + lang + ' Tags, types, pins and ports stay exactly as in the catalog.';
    let t;
    if (kind === 'panel') {
      t = 'TASK: read the electrical wiring / schematic diagram and redraw it as a panel for the simulator.\n\n' +
        'PANEL CATALOG (type | name | size w x h | pins | props with allowed values):\n' + AIM.panelCatalog() + '\n\n' +
        'OUTPUT JSON:\n{"parts":[["TAG","TYPE",x,y,{"prop":value}]],"wires":[["TAG.pin","TAG.pin"]],"notes":["..."],"unsure":["..."]}\n' +
        'Rules: one "wires" entry per conductor between two pin ids that exist for those types (use the pin id, the part before any brackets). A terminal shared by several conductors appears in several wires. Use SRC3 / SRC1 / DC24 / PSU for the supply the drawing shows. Props only from the catalog list and only allowed values; leave out props you cannot read. ' +
        'If the drawing also shows the process (tank, pump, valves), you may add "units" and "pipes" as described for the plant, linked by tag.\n' + LAYOUT_PANEL;
    } else if (kind === 'plant') {
      t = 'TASK: read the P&ID / process flow diagram and redraw it as a process plant for the simulator.\n\n' +
        'PLANT CATALOG (type | name | size w x h | ports | props with defaults):\n' + AIM.plantCatalog() + '\n\n' +
        'OPTIONAL PANEL DEVICES that plant units can link to by tag (type | name | size | pins | props):\n' + AIM.panelCatalog('link') + '\n\n' +
        'OUTPUT JSON:\n{"units":[["TAG","TYPE",x,y,{"prop":value}]],"pipes":[["TAG.port","TAG.port",{"dn":25,"mat":"ss","len":5}]],"parts":[["TAG","TYPE",x,y,{}]],"wires":[],"notes":["..."],"unsure":["..."]}\n' +
        'Rules: one pipe per line between two ports; use JUNC (tee) for branches; a pipe options object is optional (dn one of 15 20 25 32 40 50 65 80, mat "ss" or "pvc", len in m). Each port takes one pipe; use a JUNC when more lines meet. ' +
        'Links: a pump with a motor gets "motor":"M1" and a panel part ["M1","MOT3",...]; a solenoid valve SOLV gets "sol":"Y1" with ["Y1","SOL",...]; tank level transmitter "lt":"B1" with ["B1","TXV",...]; tank level switches "sw":[{"n":"LSH1","l":90,"t":"SL1"}] with ["SL1","FLOAT",...]. "parts" and "wires" may be empty.\n' + LAYOUT_PLANT +
        ' Panel parts, if any, go in their own coordinate space with the layout of a panel (start at x=40, y=20, side by side).';
    } else {
      t = 'TASK: read the mechanical drawing (assembly, exploded view or section) and explain it to a maintenance technician.\n\n' +
        '3D LIBRARY (id | name) - for each part give the closest id or null:\n' + AIM.mechCatalog() + '\n\n' +
        'OUTPUT JSON:\n{"title":"...","summary":"2-4 sentences","how_it_works":"...","parts":[{"name":"...","qty":1,"material":"...","function":"...","lib":"id or null"}],"assembly_order":["step"],"checks":["inspection or maintenance check"],"notes":["..."],"unsure":["..."]}\n' +
        'Rules: list the parts as numbered on the drawing (balloon numbers in the name, e.g. "3 - shaft seal"). Material only if it is written or obvious; else "". "lib" must be an id from the list or null.';
    }
    return { system: SYS, text: t + '\n\n' + textLang + (extra.length ? '\n\n' + extra.join('\n') : '') };
  };

  /* ---------------- parsing ---------------- */
  /* close an answer cut off in the middle (model hit its length limit): drop the half item, close the brackets */
  function repair(s) {
    const st = []; let ins = false, esc = false, lastSafe = -1;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ins) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') ins = false; continue; }
      if (ch === '"') ins = true;
      else if (ch === '{' || ch === '[') st.push(ch);
      else if (ch === '}' || ch === ']') { st.pop(); lastSafe = i; }
      else if (ch === ',') lastSafe = i - 1;
    }
    if (!st.length && !ins) return s;
    let t = s.slice(0, lastSafe + 1);
    // recount the stack for the cut text
    const st2 = []; ins = false; esc = false;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (ins) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') ins = false; continue; }
      if (ch === '"') ins = true; else if (ch === '{' || ch === '[') st2.push(ch); else if (ch === '}' || ch === ']') st2.pop();
    }
    t = t.replace(/[,:\s]+$/, '');
    while (st2.length) t += st2.pop() === '{' ? '}' : ']';
    return t;
  }
  function loose(s) {
    return s.replace(/[“”„]/g, '"').replace(/[‘’]/g, "'")
      .replace(/^\s*\/\/.*$/gm, '').replace(/,\s*([}\]])/g, '$1');
  }
  /* find the JSON object in a model answer: code fences, prose around it, smart quotes, trailing commas, cut-off end */
  AIM.extractJSON = function (text) {
    let s = String(text == null ? '' : text);
    if (s.length > 400000) s = s.slice(0, 400000);
    const fence = s.match(/```(?:json|JSON)?\s*([\s\S]*?)(```|$)/);
    const cands = [];
    if (fence && fence[1].indexOf('{') >= 0) cands.push(fence[1]);
    cands.push(s);
    for (const c0 of cands) {
      const a = c0.indexOf('{'); if (a < 0) continue;
      const c = c0.slice(a);
      // balanced object first
      let depth = 0, ins = false, esc = false, end = -1;
      for (let i = 0; i < c.length; i++) {
        const ch = c[i];
        if (ins) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') ins = false; continue; }
        if (ch === '"') ins = true; else if (ch === '{') depth++; else if (ch === '}') { depth--; if (!depth) { end = i; break; } }
      }
      const tries = end > 0 ? [c.slice(0, end + 1)] : [];
      tries.push(repair(c.slice(0, c.lastIndexOf('}') + 1) || c), repair(c));
      for (const x of tries) {
        for (const y of [x, loose(x), repair(loose(x))]) { try { const o = JSON.parse(y); if (o && typeof o === 'object' && !Array.isArray(o)) return o; } catch (e) {} }
      }
    }
    const err = new Error('no JSON'); err.code = 'json'; throw err;
  };

  /* ---------------- validation ---------------- */
  const strList = (a, n) => (Array.isArray(a) ? a : a ? [a] : []).slice(0, n || AIM.LIM.notes).map((x) => str(typeof x === 'object' ? JSON.stringify(x) : x)).filter(Boolean);
  const snap = (v) => Math.round(v / 10) * 10;
  const num = (v) => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? +v : NaN);
  function uniqueTag(want, used, pre) {
    let t = tagOf(want) || pre + '1';
    if (!used.has(t)) return t;
    let n = 2; while (used.has(t + '_' + n)) n++;
    return t + '_' + n;
  }
  function cleanPanelProps(type, pr, drop, tag) {
    const d = EL.defs[type], out = {};
    if (!pr || typeof pr !== 'object') return out;
    for (const k of Object.keys(pr).slice(0, 30)) {
      const def = (d.props || []).find((p) => p.k === k);
      if (!def || !/^(sel|num|bool|text1)$/.test(def.t)) { drop.push(tag + ': prop ' + str(k, 20)); continue; }
      const v = pr[k];
      if (def.t === 'sel') {
        const o = def.opts.find((x) => String(x[0]).toLowerCase() === String(v).toLowerCase());
        if (o) out[k] = o[0]; else drop.push(tag + ': ' + k + '=' + str(v, 20));
      } else if (def.t === 'num') { const n = num(v); if (isFinite(n)) out[k] = clamp(n, def.min, def.max); else drop.push(tag + ': ' + k + '=' + str(v, 20)); }
      else if (def.t === 'bool') out[k] = v === true || v === 'true' || v === 1;
      else out[k] = str(v, 16).replace(/["'&]/g, '');
    }
    return out;
  }
  function findPin(type, pid) {
    const part = EL.newPart(type, 0, 0), want = String(pid == null ? '' : pid).trim();
    const pins = EL.pinsOf(part);
    let p = pins.find((q) => q.id === want);
    if (!p) p = pins.find((q) => q.id.toLowerCase() === want.toLowerCase());
    if (!p) p = pins.find((q) => q.label && String(q.label).toLowerCase() === want.toLowerCase());
    if (!p) p = pins.find((q) => q.label && String(q.label).toLowerCase().split(/[\s/]/)[0] === want.toLowerCase());
    return p ? p.id : null;
  }
  /* split 'TAG.pin'; tags may hold a dash or slash, the pin is after the last dot */
  const splitRef = (s) => { s = String(s == null ? '' : s).trim(); const i = s.lastIndexOf('.'); return i > 0 ? [s.slice(0, i), s.slice(i + 1)] : [s, '']; };

  /* panel: returns {parts, wires, dropped, renamed, moved} in EL.build format */
  AIM.validatePanel = function (o, rep) {
    rep = rep || newRep();
    const parts = [], tags = new Map(), used = new Set();
    const src = Array.isArray(o && o.parts) ? o.parts : [];
    if (src.length > AIM.LIM.parts) rep.dropped.push(src.length - AIM.LIM.parts + ' parts over the limit');
    for (const q0 of src.slice(0, AIM.LIM.parts)) {
      const q = Array.isArray(q0) ? q0 : q0 && typeof q0 === 'object' ? [q0.tag, q0.type, q0.x, q0.y, q0.props] : [];
      const type = String(q[1] == null ? '' : q[1]).trim().toUpperCase();
      const want = tagOf(q[0]);
      if (!EL.defs[type] || !AIM.panelTypes().concat(LINK_T).includes(type)) { rep.dropped.push((want || '?') + ': unknown type ' + str(q[1], 20)); continue; }
      const pre = EL.defs[type].prefix || 'X';
      const tag = uniqueTag(want || pre, used, pre);
      if (want && tag !== want) { rep.renamed.push(want + ' → ' + tag); }
      used.add(tag);
      if (want && !tags.has(want)) tags.set(want, tag);
      tags.set(tag, tag);
      const x = num(q[2]), y = num(q[3]);
      parts.push([tag, type, isFinite(x) ? snap(clamp(x, 0, 8000)) : null, isFinite(y) ? snap(clamp(y, 0, 8000)) : null, cleanPanelProps(type, q[4], rep.dropped, tag)]);
    }
    const byTag = new Map(parts.map((p) => [p[0], p]));
    const wires = [], seen = new Set();
    const ws = Array.isArray(o && o.wires) ? o.wires : [];
    for (const w0 of ws.slice(0, AIM.LIM.wires)) {
      const w = Array.isArray(w0) ? w0 : w0 && typeof w0 === 'object' ? [w0.a || w0.from, w0.b || w0.to] : [];
      const ends = [];
      for (const r of [w[0], w[1]]) {
        const [t0, pid] = splitRef(r), t = tags.get(tagOf(t0)), p = t && byTag.get(t);
        if (!p) { ends.push(null); rep.dropped.push('wire ' + str(w[0], 24) + ' – ' + str(w[1], 24) + ': no part ' + str(t0, 16)); break; }
        const pin = findPin(p[1], pid);
        if (!pin) { ends.push(null); rep.dropped.push('wire ' + str(w[0], 24) + ' – ' + str(w[1], 24) + ': ' + p[0] + ' has no pin ' + str(pid, 12)); break; }
        ends.push(p[0] + '.' + pin);
      }
      if (ends.length !== 2 || !ends[0] || !ends[1] || ends[0] === ends[1]) continue;
      const k = [ends[0], ends[1]].sort().join('|');
      if (seen.has(k)) continue; seen.add(k);
      wires.push([ends[0], ends[1]]);
    }
    if (ws.length > AIM.LIM.wires) rep.dropped.push(ws.length - AIM.LIM.wires + ' wires over the limit');
    rep.moved += AIM.layout(parts, (t) => EL.defs[t], panelLane);
    return { parts, wires, tags };
  };
  /* where a part goes when it has no place: power column left, control right, PLC top right */
  function panelLane(type) {
    const c = EL.defs[type].cat;
    if (c === 'source' || c === 'protect' || c === 'power') return { x: 40, y: 20 };
    if (type === 'MOT3' || type === 'OL' || type === 'CONT3') return { x: 40, y: 300 };
    if (c === 'auto') return { x: 700, y: 20 };
    if (c === 'wiring' || c === 'draw') return { x: 1100, y: 20 };
    return { x: 400, y: 250 };
  }
  function plantLane(type, i) { return { x: 40 + (i % 12) * 220, y: type === 'TANK' || type === 'STILL' ? 80 : 300 + Math.floor(i / 12) * 300 }; }

  /* move parts with no position or that overlap another one to the nearest free spot; returns the count moved */
  AIM.layout = function (items, defOf, lane, gap) {
    gap = gap == null ? 20 : gap;
    const placed = [], box = (it, x, y) => { const d = defOf(it[1]); return { x, y, w: (d && d.w) || 80, h: (d && d.h) || 80 }; };
    const hit = (a) => placed.some((b) => a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap);
    let moved = 0;
    const later = [];
    for (const it of items) {
      if (it[2] == null || it[3] == null) { later.push(it); continue; }
      const b = box(it, it[2], it[3]);
      if (hit(b)) { later.push(it); continue; }
      placed.push(b);
    }
    let i = 0;
    for (const it of later) {
      const L = lane(it[1], i++);
      const sx = it[2] != null ? it[2] : L.x, sy = it[3] != null ? it[3] : L.y;
      let spot = null;
      // search outwards: same column first (down), then next columns to the right
      for (let col = 0; col < 40 && !spot; col++) {
        for (let row = 0; row < 60 && !spot; row++) {
          const b = box(it, snap(sx + col * 120), snap(sy + row * 40));
          if (!hit(b)) spot = b;
        }
      }
      if (!spot) spot = box(it, snap(sx), snap(4000 + i * 200));
      placed.push(spot); it[2] = spot.x; it[3] = spot.y; moved++;
    }
    return moved;
  };

  function cleanPlantProps(type, pr, drop, tag) {
    const d = EL.plant.defs[type], out = {};
    if (!pr || typeof pr !== 'object') return out;
    for (const k of Object.keys(pr).slice(0, 40)) {
      const v = pr[k];
      if (type === 'TANK' && k === 'sw') {
        if (Array.isArray(v)) out.sw = v.slice(0, 4).filter((s) => s && typeof s === 'object').map((s) => Object.assign({ n: str(s.n, 10).replace(/["'&]/g, ''), l: clamp(+s.l || 0, 0, 100), t: tagOf(s.t).slice(0, 12) }, s.k === 'pnp' ? { k: 'pnp' } : {}));
        continue;
      }
      if (!(k in d.props)) { drop.push(tag + ': prop ' + str(k, 20)); continue; }
      const def = d.props[k];
      if (typeof def === 'number') { const n = num(v); if (isFinite(n)) out[k] = clamp(n, -1e6, 1e6); else drop.push(tag + ': ' + k + '=' + str(v, 20)); }
      else if (typeof def === 'boolean') out[k] = v === true || v === 'true' || v === 1;
      else if (typeof def === 'string') out[k] = LINK_P.test(k) ? tagOf(v).slice(0, 12) : str(v, 16).replace(/["'&]/g, '');
    }
    if (type === 'TANK' && out.style && !['open', 'cone', 'ibc', 'vessel'].includes(out.style)) delete out.style;
    if (type === 'SUPPLY' && out.style && !['main', 'ibc'].includes(out.style)) delete out.style;
    return out;
  }
  const DN = [15, 20, 25, 32, 40, 50, 65, 80];
  AIM.validatePlant = function (o, rep, panelTags) {
    rep = rep || newRep();
    const U = EL.plant.defs, units = [], tags = new Map(), used = new Set();
    const src = Array.isArray(o && o.units) ? o.units : [];
    if (src.length > AIM.LIM.units) rep.dropped.push(src.length - AIM.LIM.units + ' units over the limit');
    for (const q0 of src.slice(0, AIM.LIM.units)) {
      const q = Array.isArray(q0) ? q0 : q0 && typeof q0 === 'object' ? [q0.tag, q0.type, q0.x, q0.y, q0.props] : [];
      const type = String(q[1] == null ? '' : q[1]).trim().toUpperCase();
      const want = tagOf(q[0]).slice(0, 12);
      if (!U[type] || SKIP_U.test(type)) { rep.dropped.push((want || '?') + ': unknown unit ' + str(q[1], 20)); continue; }
      const tag = uniqueTag(want || U[type].pre, used, U[type].pre).slice(0, 12);
      if (want && tag !== want) rep.renamed.push(want + ' → ' + tag);
      used.add(tag); if (want && !tags.has(want)) tags.set(want, tag); tags.set(tag, tag);
      const x = num(q[2]), y = num(q[3]);
      units.push([tag, type, isFinite(x) ? snap(clamp(x, 0, 8000)) : null, isFinite(y) ? snap(clamp(y, 0, 8000)) : null, cleanPlantProps(type, q[4], rep.dropped, tag)]);
    }
    const byTag = new Map(units.map((u) => [u[0], u]));
    const pipes = [], seen = new Set(), busy = new Set();
    const ps = Array.isArray(o && o.pipes) ? o.pipes : [];
    for (const p0 of ps.slice(0, AIM.LIM.pipes)) {
      const p = Array.isArray(p0) ? p0 : p0 && typeof p0 === 'object' ? [p0.a || p0.from, p0.b || p0.to, p0.o || p0.opt] : [];
      const ends = [];
      for (const r of [p[0], p[1]]) {
        const [t0, port] = splitRef(r), t = tags.get(tagOf(t0)), u = t && byTag.get(t);
        if (!u) { rep.dropped.push('pipe ' + str(p[0], 24) + ' – ' + str(p[1], 24) + ': no unit ' + str(t0, 16)); break; }
        const ports = U[u[1]].ports.map((x) => x[0]);
        const pt = ports.find((x) => x === port) || ports.find((x) => x.toLowerCase() === String(port).toLowerCase());
        if (!pt) { rep.dropped.push('pipe ' + str(p[0], 24) + ' – ' + str(p[1], 24) + ': ' + u[0] + ' has no port ' + str(port, 12)); break; }
        ends.push(u[0] + '.' + pt);
      }
      if (ends.length !== 2 || ends[0] === ends[1]) continue;
      const k = [ends[0], ends[1]].sort().join('|');
      if (seen.has(k)) continue;
      if (busy.has(ends[0]) || busy.has(ends[1])) { rep.dropped.push('pipe ' + ends.join(' – ') + ': port already used (add a tee)'); continue; }
      seen.add(k); busy.add(ends[0]); busy.add(ends[1]);
      const opt = p[2] && typeof p[2] === 'object' ? p[2] : null, oo = {};
      if (opt && DN.includes(+opt.dn)) { oo.dn = +opt.dn; oo.mat = opt.mat === 'pvc' ? 'pvc' : 'ss'; oo.len = clamp(+opt.len || 5, 0.01, 2000); if (opt.loop) oo.loop = true; }
      pipes.push(Object.keys(oo).length ? [ends[0], ends[1], oo] : [ends[0], ends[1]]);
    }
    if (ps.length > AIM.LIM.pipes) rep.dropped.push(ps.length - AIM.LIM.pipes + ' pipes over the limit');
    // links to panel tags that do not exist are kept (the trainee can add the part) but reported
    if (panelTags) for (const u of units) for (const k of Object.keys(u[4])) {
      if (!LINK_P.test(k)) continue;
      const vals = k === 'sw' ? (u[4].sw || []).map((s) => s.t) : [u[4][k]];
      for (const v of vals) if (v && !panelTags.has(v)) rep.links.push(u[0] + '.' + k + ' → ' + v);
    }
    rep.moved += AIM.layout(units, (t) => U[t], plantLane, 40);
    return { units, pipes };
  };

  AIM.validateMech = function (o, rep) {
    rep = rep || newRep();
    const M = EL.mech || { lib: [], byId: {} };
    const ids = M.byId || {};
    const byName = (n) => { n = String(n || '').toLowerCase(); if (n.length < 3) return null; const c = (M.lib || []).find((x) => x.name[0].toLowerCase() === n) || (M.lib || []).find((x) => n.includes(x.name[0].toLowerCase()) || x.name[0].toLowerCase().includes(n)); return c ? c.id : null; };
    const r = { title: str(o && o.title, 120), summary: str(o && o.summary, 1200), how_it_works: str(o && (o.how_it_works || o.how), 2000), parts: [], assembly_order: strList(o && (o.assembly_order || o.assembly), AIM.LIM.steps), checks: strList(o && o.checks, AIM.LIM.steps) };
    const src = Array.isArray(o && o.parts) ? o.parts : [];
    for (const p of src.slice(0, AIM.LIM.mparts)) {
      if (!p || typeof p !== 'object') continue;
      const name = str(p.name, 120); if (!name) continue;
      let lib = typeof p.lib === 'string' && ids[p.lib.trim()] ? p.lib.trim() : null;
      if (!lib && p.lib && typeof p.lib === 'string' && p.lib !== 'null') { rep.dropped.push(name + ': library id ' + str(p.lib, 30)); lib = byName(p.lib); }
      const q = num(p.qty);
      r.parts.push({ name, qty: isFinite(q) ? clamp(Math.round(q), 0, 9999) : 1, material: str(p.material, 80), function: str(p.function || p.fn, 300), lib });
    }
    return r;
  };

  function newRep() { return { dropped: [], renamed: [], links: [], moved: 0, notes: [], unsure: [] }; }
  AIM.newRep = newRep;

  /* turn a parsed answer into a result: {kind, spec:{parts,wires,units,pipes}|mech, rep, counts} */
  AIM.check = function (kind, o) {
    const rep = newRep();
    rep.notes = strList(o && o.notes); rep.unsure = strList(o && o.unsure);
    if (kind === 'mech') { const m = AIM.validateMech(o, rep); return { kind, mech: m, rep, counts: { mparts: m.parts.length, matched: m.parts.filter((p) => p.lib).length } }; }
    const pan = AIM.validatePanel(o, rep);
    const pl = AIM.validatePlant(o, rep, new Set(pan.parts.map((p) => p[0])));
    const spec = { parts: pan.parts, wires: pan.wires, units: pl.units, pipes: pl.pipes };
    rep.dropped = rep.dropped.slice(0, 200);
    return { kind, spec, rep, counts: { parts: spec.parts.length, wires: spec.wires.length, units: spec.units.length, pipes: spec.pipes.length } };
  };

  /* build a lab circuit (panel + plant) from a checked spec, through the same hardening as a file import */
  AIM.build = function (res, name) {
    const s = res.spec;
    const c = EL.build({ name: name || 'From a drawing', parts: s.parts.map((p) => p.slice()), wires: s.wires });
    c.plant = EL.plant.build({ units: s.units.map((u) => u.slice()), pipes: s.pipes });
    const out = EL.deserialize(EL.serialize(c));
    if (!out.plant) out.plant = EL.plant.newPlant();
    return out;
  };
  /* the text the model gets, split into a cacheable catalog and the request; used for the size check */
  AIM.size = function (kind) { const p = AIM.prompt(kind, {}); return p.system.length + p.text.length; };

  /* one call: build the messages for EL.ai.ask from prepared files [{kind:'image'|'pdf', data, media}] */
  AIM.messages = function (kind, files, o) {
    const p = AIM.prompt(kind, o);
    const content = [];
    for (const f of files || []) {
      if (f.kind === 'pdf') content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data } });
      else content.push({ type: 'image', source: { type: 'base64', media_type: f.media || 'image/jpeg', data: f.data } });
    }
    content.push({ type: 'text', text: p.text });
    return { system: p.system, messages: [{ role: 'user', content }] };
  };
  AIM.run = async function (kind, files, o) {
    const m = AIM.messages(kind, files, o);
    const text = await EL.ai.ask(m.messages, { system: m.system, max: 16000, timeout: (o && o.timeout) || 240000 });
    let obj;
    try { obj = AIM.extractJSON(text); } catch (e) { const er = new Error('json'); er.code = 'json'; er.raw = String(text || '').slice(0, 4000); throw er; }
    const res = AIM.check(kind, obj);
    res.raw = text;
    return res;
  };
})(typeof window !== 'undefined' ? window : globalThis);
