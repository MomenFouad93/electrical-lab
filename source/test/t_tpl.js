const EL = require('./load.js');
const log = (...a)=>console.log(...a);
function press(p, on){ p.state.act = on; }
// ---- Star delta
{
  const c = EL.loadTemplate('stardelta');
  const q=EL.partByTag(c,'QF1'), km1=EL.partByTag(c,'KM1'), km2=EL.partByTag(c,'KM2'), km3=EL.partByTag(c,'KM3'), kt=EL.partByTag(c,'KT1'), m=EL.partByTag(c,'M1'), sb2=EL.partByTag(c,'SB2'), fr=EL.partByTag(c,'FR1');
  kt.props.time = 4;
  q.state.on = true; EL.runSeconds(c,0.3);
  press(sb2,true); EL.runSeconds(c,0.3); press(sb2,false);
  let maxI=0, phase='';
  for (let t=0;t<9;t+=0.5){
    const sim = EL.runSeconds(c,0.5);
    maxI=Math.max(maxI,m.state.amps);
    log('SD t',(t+0.8).toFixed(1),'KM1',km1.state.closed,'KM2(star)',km2.state.closed,'KM3(delta)',km3.state.closed,'speed',m.state.w.toFixed(2),'amps',m.state.amps.toFixed(2),'Vw',m.state.volts.toFixed(0));
  }
  log('short?', c.sim.shorts.length, 'QF tripped', q.state.tripped, 'OL heat', fr.state.heat.toFixed(3));
}
// ---- Fwd / rev
{
  const c = EL.loadTemplate('fwdrev');
  const q=EL.partByTag(c,'QF1'), km1=EL.partByTag(c,'KM1'), km2=EL.partByTag(c,'KM2'), m=EL.partByTag(c,'M1'), sb2=EL.partByTag(c,'SB2'), sb3=EL.partByTag(c,'SB3'), sb1=EL.partByTag(c,'SB1');
  q.state.on = true; EL.runSeconds(c,0.3);
  press(sb2,true); EL.runSeconds(c,0.3); press(sb2,false); EL.runSeconds(c,4);
  log('FWD: KM1',km1.state.closed,'KM2',km2.state.closed,'dir',m.state.dir,'speed',m.state.w.toFixed(2));
  press(sb3,true); EL.runSeconds(c,0.3); press(sb3,false);
  log('press REV while FWD: KM1',km1.state.closed,'KM2',km2.state.closed,'(interlock should keep KM2 off)');
  press(sb1,true); EL.runSeconds(c,0.3); press(sb1,false); EL.runSeconds(c,6);
  press(sb3,true); EL.runSeconds(c,0.3); press(sb3,false); EL.runSeconds(c,4);
  log('REV: KM1',km1.state.closed,'KM2',km2.state.closed,'dir',m.state.dir,'speed',m.state.w.toFixed(2), 'shorts', c.sim.shorts.length);
}
// ---- VFD
{
  const c = EL.loadTemplate('vfd');
  const q=EL.partByTag(c,'QF1'), u=EL.partByTag(c,'U1'), m=EL.partByTag(c,'M1'), sa=EL.partByTag(c,'SA1');
  q.state.on = true; EL.runSeconds(c,3);
  log('VFD powered: bus',u.state.bus.toFixed(0),'V');
  sa.state.act = true; EL.runSeconds(c,8);
  log('VFD run: f',u.state.f.toFixed(1),'Hz fref',u.state.fref,'motor speed',m.state.w.toFixed(2),'rpm',m.state.rpm,'Imotor',m.state.amps.toFixed(2),'Iout',(u.state.iout||0).toFixed(2),'fault',u.state.fault, 'Vw', m.state.volts.toFixed(0));
  const rv = EL.partByTag(c,'RV1'); rv.props.pos = 20; EL.runSeconds(c,5);
  log('pos 20%: f',u.state.f.toFixed(1),'speed',m.state.w.toFixed(2),'I',m.state.amps.toFixed(2),'Vw',m.state.volts.toFixed(0));
  sa.state.act = false; EL.runSeconds(c,6); q.state.on=false; EL.runSeconds(c,20);
  log('after off: f',u.state.f.toFixed(1),'bus',u.state.bus.toFixed(0));
}
// ---- Loop
{
  const c = EL.loadTemplate('loop'); const a=EL.partByTag(c,'A1'), tb=EL.partByTag(c,'TB1'), b=EL.partByTag(c,'B1');
  EL.runSeconds(c,0.5); log('LOOP mA',a.state.mA.toFixed(3),'TX V',b.state.v.toFixed(2));
  b.props.proc=100; EL.runSeconds(c,0.2); log('100%:',a.state.mA.toFixed(3));
  tb.state.act = true; EL.runSeconds(c,0.2); log('loop opened: AI mA',a.state.mA.toFixed(3));
}
// ---- sensor
{
  const c = EL.loadTemplate('sensor'); const a=EL.partByTag(c,'A1'), b=EL.partByTag(c,'B1');
  EL.runSeconds(c,0.5); log('SENSOR no target DI',a.state.on,a.state.v.toFixed(2));
  b.state.target=true; EL.runSeconds(c,0.3); log('target DI',a.state.on,a.state.v.toFixed(2));
}
// ---- PSU relay
{
  const c = EL.loadTemplate('psu'); const q=EL.partByTag(c,'QF1'), ps=EL.partByTag(c,'PS1'), sa=EL.partByTag(c,'SA1'), ka=EL.partByTag(c,'KA1'), hl=EL.partByTag(c,'HL1');
  q.state.on=true; EL.runSeconds(c,0.5); log('PSU ok',ps.state.ok);
  sa.state.act=true; EL.runSeconds(c,0.5); log('KA1 closed',ka.state.closed,'lamp b',hl.state.b);
}
// ---- valves
{
  const c = EL.loadTemplate('valves'); const g=EL.partByTag(c,'G1'); const sa=EL.partByTag(c,'SA1'), yv4=EL.partByTag(c,'YV4');
  sa.state.act=true; EL.runSeconds(c,1); log('YV4 std on 24V pos',yv4.state.pos.toFixed(2), 'I', (yv4.state.i*1000).toFixed(0),'mA');
}
// ---- DOL: short circuit through two phases
{
  const c = EL.loadTemplate('dol'); const q=EL.partByTag(c,'QF1');
  EL.addWire(c, EL.refOf(c,'QF1.2'), EL.refOf(c,'QF1.4'));
  q.state.on=true; EL.runSeconds(c,0.3); log('L1-L2 short: QF1 tripped',q.state.tripped, q.state.cause);
}
