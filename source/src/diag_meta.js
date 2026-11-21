/* Diagnosis metadata for the original parts (new parts carry their own diag block).
   diag = { kind, feed:[pinA,pinB], volt(p), ac(p), active(p), pol:[A,K], pe:'PE', hazard, rating(p), thermal }  and  op = state keys an operator can change */
(function (g) {
  const EL = g.EL, D = EL.defs;
  const set = (k, m, op) => { if (!D[k]) return; D[k].diag = Object.assign({}, D[k].diag || {}, m); if (op) D[k].op = op; };
  const spec = (p) => EL.coilSpec(p);
  const nz = (x) => +x || 0;

  for (const k of ['SRC3', 'SRC1', 'DC24', 'PSU', 'TRAFO']) set(k, { kind: 'source' });
  set('BUS', { kind: 'wire' });
  for (const k of ['MCB1', 'MCB3']) set(k, { kind: 'protect', rating: (p) => nz(p.props.rating) }, ['on']);
  set('MPCB', { kind: 'protect', thermal: true, rating: (p) => nz(p.props.set) }, ['on']);
  set('ISOL3', { kind: 'protect', rating: (p) => nz(p.props.rating), isolator: true }, ['on']);
  set('RCD2', { kind: 'protect', rating: (p) => nz(p.props.rating), rcd: true }, ['on']);
  set('FUSE', { kind: 'protect', rating: (p) => nz(p.props.rating), fuse: true });
  set('OL', { kind: 'protect', thermal: true, rating: (p) => nz(p.props.set) });
  set('VFD', { kind: 'drive', hazard: true, thermal: true, active: (p) => !!p.state.run && !p.state.fault });
  for (const k of ['CONT3', 'RLY2', 'RLY4']) set(k, { kind: 'coil', feed: ['A1', 'A2'], volt: (p) => spec(p).v, ac: (p) => spec(p).ac, hazard: k === 'CONT3', active: (p) => !!p.state.closed });
  for (const k of ['TON', 'SDT']) set(k, { kind: 'logic', feed: ['A1', 'A2'], active: (p) => !!p.state.on });
  set('PB_NO', { kind: 'switch', mom: true, nc: false }, ['act']);
  set('PB_NC', { kind: 'switch', mom: true, nc: true }, ['act']);
  set('ESTOP', { kind: 'switch', estop: true, nc: true }, ['act']);
  set('SEL2', { kind: 'switch' }, ['act']);
  set('HOA', { kind: 'switch' }, ['pos']);
  for (const k of ['LIM', 'PRESS']) set(k, { kind: 'switch', sensor: true }, ['act']);
  set('PB2', { mom: true });
  set('ESTOP2', { estop: true, nc: true });
  set('KEY', { kind: 'switch' });
  set('MOT3', { kind: 'motor', feed: ['U1', 'V1', 'W1'], volt: () => 400, ac: () => true, hazard: true, pe: 'PE', thermalNeeded: true, active: (p) => (p.state.w || 0) > 0.3 });
  set('MOT1', { pe: 'PE', thermalNeeded: true });
  set('HTR', { pe: 'PE' });
  set('SOCK', { pe: 'PE' });
  set('LAMPH', { pe: 'PE' });
  set('LAMP', { kind: 'load', feed: ['X1', 'X2'], volt: (p) => parseInt(p.props.volt, 10), ac: (p) => /AC/.test(p.props.volt), active: (p) => (p.state.b || 0) > 0.3 });
  set('SOL', { kind: 'load', feed: ['pos', 'neg'], volt: () => 24, ac: () => false, hazard: true, active: (p) => (p.state.pos || 0) > 0.5 });
  set('RES', { kind: 'passive' });
  set('DIO', { kind: 'led', fail: 'open', pol: ['A', 'K'], feed: ['A', 'K'], active: (p) => (p.state.b || 0) > 0.3 });
  set('POT', { kind: 'passive' });
  set('TX', { kind: 'sensor' });
  set('AI250', { kind: 'passive' });
  set('PLCDI', { kind: 'input', active: (p) => !!p.state.on });
  set('PROX', { kind: 'sensor', active: (p) => !!p.state.active }, ['target']);
  set('PHOTO', { kind: 'sensor', active: (p) => !!p.state.active }, ['target']);
  /* new parts */
  set('LEDX', { feed: ['A', 'K'], pol: ['A', 'K'], active: (p) => (p.state.b || 0) > 0.3 });
  set('BUZ', { kind: 'load', feed: ['pos', 'neg'], active: (p) => !!p.state.on });
  set('MOT1', { kind: 'motor', hazard: true });
  set('MOTDC', { hazard: true });
  set('PLC24', { feed: ['LP', 'M'], volt: () => 24, ac: () => false, active: (p) => !!p.state.sup });
  set('PLC24R', { feed: ['LP', 'M'], volt: () => 24, ac: () => false, active: (p) => !!p.state.sup });
  set('MCU', { feed: ['V5', 'GND'], volt: () => 5, ac: () => false, active: (p) => !!p.state.sup });
  set('SAFE', { feed: ['A1', 'A2'], volt: () => 24, ac: () => false, active: (p) => !!p.state.ok });
  set('SSR', { feed: ['IN+', 'IN-'], active: (p) => !!p.state.on });
  set('OPTO', { active: (p) => !!p.state.on });
  set('RELAY5', { feed: ['A', 'B'], volt: (p) => +p.props.v, ac: () => false, active: (p) => !!p.state.on });
  set('CAPP', { pol: ['A', 'B'] });
  for (const k of ['IC8', 'IC14', 'IC16']) set(k, { active: (p) => !!p.state.pw });
  set('TOFF', { feed: ['A1', 'A2'], active: (p) => !!p.state.on });
  set('PHR', { active: (p) => !!p.state.ok });
  set('WSW1', {}, ['pos']); set('WSW2', {}, ['pos']); set('WSWX', {}, ['pos']);
  for (const k of ['PB_NO', 'PB_NC']) if (D[k]) D[k].diag.nc = k === 'PB_NC';
  /* PCB parts */
  const pcbActive = { PCB_LED: (p) => (p.state.b || 0) > 0.3 };
  for (const k of Object.keys(D)) if (/^PCB_/.test(k)) set(k, Object.assign({ kind: k === 'PCB_LED' ? 'led' : k === 'PCB_PWR' ? 'source' : k === 'PCB_PAD' ? 'wire' : k === 'PCB_FUSE' ? 'protect' : k === 'PCB_SW' ? 'switch' : k === 'PCB_REG' ? 'reg' : 'passive' }, k === 'PCB_LED' ? { pol: ['A', 'K'], feed: ['A', 'K'], active: pcbActive.PCB_LED } : {}, k === 'PCB_FUSE' ? { fuse: true, rating: (p) => nz(p.props.a || p.props.rating) } : {}), k === 'PCB_SW' ? ['act'] : null);
  if (D.PCB_D) D.PCB_D.diag.pol = ['A', 'K'];

  for (const k of ['MOT3', 'VFD', 'HTR']) if (D[k]) D[k].floatPE = true;
  if (D.VFD) D.VFD.ties = () => [['PE', 'PE2']]; // PE terminals of a drive are bonded together internally
  // a frame/PE terminal is earthed only when it is wired to the earth bar
  /* generic helpers used by the engine */
  EL.kindOf = (p) => { const d = D[p.type]; return d && d.diag ? d.diag.kind || 'unknown' : 'unknown'; };
})(typeof window !== 'undefined' ? window : globalThis);
