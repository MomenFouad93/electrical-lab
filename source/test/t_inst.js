const EL = require('./load.js');
const I = EL.inst;
const log=(...a)=>console.log(...a);
function setup(tpl){ const c = EL.loadTemplate(tpl); EL.ctx.extra=[]; return c; }
function step(c,s){ EL.ctx.extra = EL.instElements(c); const sim = EL.runSeconds(c,s,EL.ctx); EL.instUpdate(c,sim,0.05); return sim; }
// DOL: voltage tests
let c = setup('dol');
const q=EL.partByTag(c,'QF1'), sb2=EL.partByTag(c,'SB2');
q.state.on=true; let sim=step(c,0.5);
const R=(s)=>EL.refOf(c,s);
I.sel='dmm'; I.dmm.dial='VAC'; I.dmm.jack='V';
I.probes.red=R('G1.L1'); I.probes.black=R('G1.N'); log('L1-N', EL.dmmRead(c,sim).t, EL.dmmRead(c,sim).u);
I.probes.red=R('G1.L1'); I.probes.black=R('G1.L2'); log('L1-L2', EL.dmmRead(c,sim).t);
I.probes.red=R('SB2.3'); I.probes.black=R('SB2.4'); log('across open start button', EL.dmmRead(c,sim).t, '(coil in series so ~230)');
I.probes.red=R('KM1.A1'); I.probes.black=R('KM1.A2'); log('coil V (not energized)', EL.dmmRead(c,sim).t);
I.dmm.dial='VDC'; log('VDC on AC', EL.dmmRead(c,sim).t, EL.dmmRead(c,sim).warn.length);
I.dmm.dial='VAC';
// L1 to PE (floating? PE is earth, N bonded) 
I.probes.red=R('G1.L1'); I.probes.black=R('G1.PE'); log('L1-PE', EL.dmmRead(c,sim).t);
// ohms with power on
I.dmm.dial='OHM'; I.probes.red=R('KM1.A1'); I.probes.black=R('KM1.A2'); let r=EL.dmmRead(c,sim); log('ohm coil live:', r.t, r.warn.length?'WARN':'');
q.state.on=false; sim=step(c,0.5);
r=EL.dmmRead(c,sim); log('coil resistance dead', r.t, r.u);
I.probes.red=R('M1.U1'); I.probes.black=R('M1.V1'); r=EL.dmmRead(c,sim); log('motor U1-V1 (delta fixed) ohms', r.t, r.u);
I.dmm.dial='CONT'; I.probes.red=R('SB1.1'); I.probes.black=R('SB1.2'); r=EL.dmmRead(c,sim); log('stop button continuity (NC)', r.t, r.beep);
I.probes.red=R('SB2.3'); I.probes.black=R('SB2.4'); r=EL.dmmRead(c,sim); log('start button continuity (NO)', r.t, r.beep);
// ammeter wrong use: leads in A jack across source -> fuse
q.state.on=true; sim=step(c,0.3);
I.dmm.dial='VAC'; I.dmm.jack='A'; I.probes.red=R('G1.L1'); I.probes.black=R('G1.N');
sim=step(c,0.2); log('A jack across L1-N: fuse blown', I.dmm.fuseBlown, '|', I.msg);
I.dmm.fuseBlown=false; I.dmm.jack='V';
// clamp on motor after start
I.sel='clamp'; I.clamp.dial='AAC'; I.clamp.inrush=true; I.clamp.peak=0; I.probes.clamp=R('KM1.2');
sb2.state.act=true; sim=step(c,0.5); sb2.state.act=false; sim=step(c,3);
r=EL.clampRead(c,sim); log('clamp on KM1.2 running', r.t, r.u, r.sub);
I.probes.clamp=R('M1.U1'); sim=step(c,0.1); log('clamp on motor U1', EL.clampRead(c,sim).t);
// megger
I.sel='meg'; q.state.on=false; EL.partByTag(c,'SB1').state.act=true; sim=step(c,0.3); EL.partByTag(c,'SB1').state.act=false;
I.probes.red=R('M1.U1'); I.probes.black=R('M1.PE'); I.meg.testing=true; I.meg.v=500;
r=EL.megRead(c,sim); log('megger U1-PE healthy', r.t, r.u, r.verdict);
EL.partByTag(c,'M1').fault='low_ins'; r=EL.megRead(c,sim); log('megger low ins', r.t, r.verdict);
EL.partByTag(c,'M1').fault='none';
q.state.on=true; sim=step(c,0.3); I.probes.red=R('QF1.2'); I.probes.black=R('G1.PE'); r=EL.megRead(c,sim); log('megger on live', r.t, r.state);
q.state.on=false; sim=step(c,0.3);
// VFD megger damage
c = setup('vfd'); const u=EL.partByTag(c,'U1'); sim=step(c,0.3);
I.sel='meg'; I.meg.testing=true; I.probes.red=R('M1.U1'); I.probes.black=R('M1.PE');
r=EL.megRead(c,sim); log('megger with VFD connected', r.t, r.warn.length, 'VFD damaged', u.state.damaged, u.fault);
// calibrator
c = setup('valves'); I.sel='cal'; I.cal.mode='src_mA'; I.cal.on=true;
const yv1=EL.partByTag(c,'YV1'), yv2=EL.partByTag(c,'YV2'), yv3=EL.partByTag(c,'YV3');
for (const [yv,nm] of [[yv1,'std 24V'],[yv2,'lp 12V'],[yv3,'I/P']]){
  I.probes.red=R(yv.tag+'.pos'); I.probes.black=R(yv.tag+'.neg');
  for (const mA of [4,12,20,24]) { I.cal.mA=mA; sim=step(c,2); const r=EL.calRead(c,sim); log(nm, mA,'mA -> pos', yv.state.pos.toFixed(2), 'V', yv.state.v.toFixed(2), r.main2, r.warn.length?'[compliance/warn]':''); }
}
// 4-20 loop: DMM in series
c = setup('loop'); I.sel='dmm'; I.dmm.dial='MA'; I.dmm.acdc='DC'; I.dmm.jack='mA';
const tb=EL.partByTag(c,'TB1'); tb.state.act=true; I.probes.red=R('TB1.1'); I.probes.black=R('TB1.2'); sim=step(c,0.3);
r=EL.dmmRead(c,sim); log('loop mA with DMM in series', r.t, r.u, 'AI', EL.partByTag(c,'A1').state.mA.toFixed(2));
// tester
I.sel='tester'; c=setup('dol'); EL.partByTag(c,'QF1').state.on=true; sim=step(c,0.5);
I.probes.red=R('G1.L1'); I.probes.black=R('G1.L2'); r=EL.testerRead(c,sim); log('tester L1-L2', r.levels.join(','), 'AC',r.ac);
I.probes.ncv=R('QF1.2'); log('NCV', EL.ncvRead(c,sim).det);
