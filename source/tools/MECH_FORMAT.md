# Mechanical component format (EL.mech.add)

One file per group: `src/mech_<group>.js`, wrapped like:

```js
/* Mechanical: <group> */
(function (g) {
  const EL = g.EL, M = EL.mech;
  M.add({ ... });
})(typeof window !== 'undefined' ? window : globalThis);
```

Text is always a pair `[English, Arabic]`. Arabic is Egyptian technical Arabic as a technician speaks it (e.g. "محبس كورة", "جلبة", "رولمان بلي", "ميكانيكال سيل", "جوان"), English terms may stay in Latin letters inside the Arabic. Keep each text to 1-3 short sentences. Facts must be correct; no brand names.

```js
M.add({
  id: 'ball_valve',            // [a-z0-9_]
  cat: 'valves',               // tools fasteners valves actuators pumps motors transmission bearings seals process power
  name: ['Ball valve (2-piece)', 'محبس كورة (قطعتين)'],
  info: {
    what: [en, ar],   // what it is
    use:  [en, ar],   // where you find it in a plant / on machines (pharma site: water, HVAC, packaging, granulation...)
    how:  [en, ar],   // how it works
    fail: [en, ar],   // common failures and their signs
    pm:   [en, ar],   // checks, maintenance, installation tips
  },
  cut: 'z',            // cutaway plane: keeps the -z half (normal of the cut along this axis). 'x' | 'y' | 'z'
  parts: [             // ordered as they are assembled (first = base part)
    { id: 'body', name: ['Body', 'الجسم'], role: ['Holds pressure and carries the end connections.', 'شايل الضغط وفيه أطراف التوصيل.'],
      mat: 'cast',               // default material of the shapes
      o: [0, 0, 0],              // part origin (pivot for animation). Shapes are relative to it
      ex: [0, -4, 0],            // offset at full explode (spread parts along the assembly axis, clear of each other)
      cut: true,                 // false = never cut (balls, bolts, springs look better whole)
      s: [ /* shapes */ ] },
  ],
  steps: ['body', 'seat1', ...],          // optional assembly order for the Assemble game (default: parts order)
  anim: { mode: 'toggle', label: ['Open / close', 'افتح / اقفل'],   // or mode 'spin' (continuous, label ['Run','شغّل'])
          parts: { ball: { rot: [0, 1, 0], a: [0, 90] }, stem: { rot: [0, 1, 0], a: [0, 90] },     // rotate about part origin, degrees a[0]->a[1]
                   plunger: { slide: [0, 0.6, 0] } } },                                          // toggle: moves 0 -> slide; spin: rot uses speed (rad/s x4), slide oscillates
  quiz: [ { q: [en, ar], a: [en, ar], w: [[en, ar], [en, ar], [en, ar]] } ],   // 2-4 questions, a = right answer, w = wrong ones
});
```

## Units and orientation (needed so the Workshop can place parts)
- 1 unit = 1 cm. Real proportions. Ground is -Y, up is +Y.
- Valves, strainers, check valves, couplings, pumps, motors, gearbox input, seals, bearings: **main axis / flow along X**. Valve stems and handles up (+Y). Motor feet down, shaft sticks out toward **+X**. Pump: shaft toward **-X** (motor side), discharge up (+Y), suction on +X end.
- Bearings and seals: axis X, centred at the origin.
- Tanks and vessels: vertical, axis Y, bottom at y = 0 or centred.
- Tools: lying flat-ish, longest dimension along X.

## Shapes (`s` list). Common keys: `t` type, `p` [x,y,z] position, `rot` [rx,ry,rz] degrees, `ax` 'y' (default) | 'x' | 'z' | '-x' | '-y' | '-z' axis of revolving shapes, `m` material (overrides part mat), `sc` [sx,sy,sz] scale, `cut:false`.
| t | keys | notes |
|---|---|---|
| box | w h d | |
| cyl | r h (r1 top r2 bottom for taper) ri (inner radius -> thick tube) seg open | solid cylinder or tube |
| cone | r1 (top) r2 (bottom) h | |
| sph | r half | |
| torus | R r arc(deg) | O-ring; ring lies in the plane normal to `ax` |
| lathe | pts [[radius, y], ...] seg | revolve a profile around `ax`. Close it (last point = first) for solids with a wall |
| hex | r (corner radius) h ri | nut / bolt head |
| gear | r rr(root) teeth h ri | spur gear, thickness h along ax |
| ext | pts [[x,z]...] holes [[pts]] or [{c:[x,z], r}] d bevel | 2D outline extruded d along ax (outline lies in the plane normal to ax) |
| flange | r ri h holes pcd hr | disc with bore and bolt holes |
| spring | R r turns len | coil spring along ax |
| tube | path [[x,y,z]...] r closed sharp rs | pipe / belt / chain path / wire (use closed for belts) |
| balls | n R r a0 | n balls on a ring of radius R around ax |
| rollers | n R r (r1 r2 taper) l tilt a0 | n rollers parallel to ax on ring R (tilt deg for tapered bearings) |
| vanes | n r1 r2 h curve(deg) thick | impeller vanes around ax |

## Materials (`mat` / `m`)
steel sst cast(blue painted) castg(grey cast) iron brass bronze copper alu chrome rubber epdm viton ptfe carbon sic ceramic plastic red yellow green blue orange black white grey felt wood glass water oil grease, or any '#rrggbb'.

## Check your work
`node tools/mech_shot.js <id> [more ids]` builds the app and writes `/tmp/mech/<id>_a.png` (assembled), `_b.png` (exploded), `_c.png` (cutaway), `_d.png` (operate end state). Look at every image. `node tools/mech_shot.js --check` lists format errors for all components.
