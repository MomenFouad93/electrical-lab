const EL = require('./load.js');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const part = (c, tag) => c.parts.find((p) => p.tag === tag);

/* ---- 1. PLC24 start/stop latch with a 24 V lamp on Q0 ---- */
{
  const c = EL.build({
    name: 'plc', parts: [['G', 'DC24', 0, 0, { volt: 24 }], ['PLC', 'PLC24', 200, 0], ['S1', 'PB_NO', 0, 200], ['S2', 'PB_NC', 80, 200], ['H1', 'LAMP', 400, 300, { volt: '24VDC' }]],
    wires: [['G.pos', 'PLC.LP'], ['G.neg', 'PLC.M'], ['G.pos', 'S1.3'], ['S1.4', 'PLC.I0'], ['G.pos', 'S2.1'], ['S2.2', 'PLC.I1'], ['PLC.Q0', 'H1.X1'], ['H1.X2', 'G.neg']],
  });
  EL.runSeconds(c, 1, {});
  const plc = part(c, 'PLC'), lamp = part(c, 'H1');
  ok(plc.state.sup, 'PLC powered');
  ok(plc.state.i[1] === 1 && plc.state.i[0] === 0, 'I1 (stop NC) high, I0 low');
  ok(!plc.state.q[0], 'Q0 off at start');
  part(c, 'S1').state.act = true; EL.runSeconds(c, 0.5, {});
  ok(plc.state.q[0] === 1, 'Q0 on after START');
  part(c, 'S1').state.act = false; EL.runSeconds(c, 0.5, {});
  ok(plc.state.q[0] === 1, 'Q0 latched after release');
  ok(lamp.state.b > 0.5 || lamp.state.on || lamp.state.lit, 'lamp on: ' + JSON.stringify(lamp.state));
  part(c, 'S2').state.act = true; EL.runSeconds(c, 0.5, {});
  ok(plc.state.q[0] === 0, 'Q0 off after STOP');
  part(c, 'S2').state.act = false; EL.runSeconds(c, 0.5, {});
  ok(plc.state.q[0] === 0, 'stays off');
  // TON: Q1 after 3 s
  part(c, 'S1').state.act = true; EL.runSeconds(c, 0.3, {}); part(c, 'S1').state.act = false;
  EL.runSeconds(c, 1.5, {}); ok(plc.state.q[1] === 0, 'Q1 not yet at 1.8 s');
  EL.runSeconds(c, 2, {}); ok(plc.state.q[1] === 1, 'Q1 on after 3 s');
  // broken stop wire stops the machine
  EL.runSeconds(c, 0.2, {});
  const wire = c.wires.find((w) => w.a === part(c, 'S2').id + '.2' || w.b === part(c, 'S2').id + '.2');
  c.wires = c.wires.filter((w) => w !== wire); EL.runSeconds(c, 0.5, {});
  ok(plc.state.q[0] === 0, 'broken stop wire drops Q0 (fail safe)');
  // short on output
  c.wires.push(...[]);
}

/* ---- 2. program errors ---- */
{
  const pr = EL.logic.compile('Q0 = I0 and\nQ1 = foo\nX = 3\nQ2 = TON(I0)');
  ok(pr.errors.length === 4, 'four errors reported: ' + pr.errors.map((e) => e.msg[0]).join(' | '));
}

/* ---- 3. safety relay ---- */
{
  const c = EL.build({
    name: 'safe', parts: [['G', 'DC24', 0, 0, { volt: 24 }], ['K', 'SAFE', 200, 0, { reset: 'manual' }], ['ES', 'ESTOP2', 0, 200], ['ST', 'PB_NO', 80, 200]],
    wires: [['G.pos', 'K.A1'], ['G.neg', 'K.A2'], ['K.S11', 'ES.11'], ['ES.12', 'K.S12'], ['K.S21', 'ES.21'], ['ES.22', 'K.S22'], ['K.S33', 'ST.3'], ['ST.4', 'K.S34']],
  });
  EL.runSeconds(c, 1, {});
  const k = part(c, 'K');
  ok(k.state.sup && k.state.ch1 && k.state.ch2, 'both channels closed');
  ok(!k.state.ok, 'not armed before START');
  part(c, 'ST').state.act = true; EL.runSeconds(c, 0.3, {}); part(c, 'ST').state.act = false; EL.runSeconds(c, 0.3, {});
  ok(k.state.ok, 'armed after START');
  part(c, 'ES').state.act = true; EL.runSeconds(c, 0.3, {});
  ok(!k.state.ok, 'E-stop drops the relay');
  part(c, 'ES').state.act = false; EL.runSeconds(c, 0.5, {});
  ok(!k.state.ok, 'does not restart by itself (manual reset)');
  part(c, 'ST').state.act = true; EL.runSeconds(c, 0.3, {}); part(c, 'ST').state.act = false; EL.runSeconds(c, 0.3, {});
  ok(k.state.ok, 'restarts after START');
  // cross short
  part(c, 'ES').state.act = true; EL.runSeconds(c, 0.3, {}); part(c, 'ES').state.act = false;
  EL.addWire(c, k.id + '.S12', k.id + '.S22'); EL.runSeconds(c, 0.5, {});
  part(c, 'ST').state.act = true; EL.runSeconds(c, 0.3, {}); part(c, 'ST').state.act = false; EL.runSeconds(c, 0.3, {});
  ok(k.state.cross && !k.state.ok, 'cross short blocks the start');
}

/* ---- 4. cable, terminals, RCD, socket ---- */
{
  const c = EL.build({
    name: 'rcd', parts: [['G', 'SRC1', 0, 0], ['F', 'RCD2', 0, 100, { sens: 30 }], ['X', 'SOCK', 0, 300, { w: 1000 }]],
    wires: [['G.L', 'F.L1'], ['G.N', 'F.N1'], ['F.L2', 'X.L'], ['F.N2', 'X.N'], ['G.PE', 'X.PE']],
  });
  const f = part(c, 'F'), x = part(c, 'X');
  f.state.on = true; EL.runSeconds(c, 1, {});
  ok(!f.state.tripped && x.state.amps > 4, 'socket draws ' + x.state.amps.toFixed(2) + ' A');
  x.fault = 'leak'; EL.runSeconds(c, 1, {});
  ok(f.state.tripped, 'RCD trips on 50 mA leakage');
  f.state.tripped = false; f.state.on = true; x.fault = 'none'; f.fault = 'wont_trip'; x.fault = 'leak'; EL.runSeconds(c, 1, {});
  ok(!f.state.tripped, 'faulty RCD does not trip');
}
{
  const c = EL.build({
    name: 'cab', parts: [['G', 'DC24', 0, 0, { volt: 24 }], ['W', 'CAB2', 100, 0, { sec: 0.5, len: 200 }], ['R', 'RES', 300, 0, { r: 10 }]],
    wires: [['G.pos', 'W.a1'], ['W.b1', 'R.A'], ['R.B', 'W.b2'], ['W.a2', 'G.neg']],
  });
  EL.runSeconds(c, 1, {});
  const w = part(c, 'W');
  // 200 m of 0.5 mm2 : 7 ohm per core, 14 ohm loop, with 10 ohm load: I = 24/24 = 1 A
  ok(Math.abs(w.state.amps - 1) < 0.05, 'cable drop: ' + w.state.amps.toFixed(3) + ' A (expect 1.0)');
}

console.log(fail ? fail + ' FAILED' : 'ALL OK');
process.exit(fail ? 1 : 0);
