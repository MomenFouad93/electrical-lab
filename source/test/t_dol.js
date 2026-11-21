const EL = require('./load.js');
const spec = {
  name: 'DOL',
  parts: [
    ['G1','SRC3',40,20], ['QF1','MCB3',40,140,{rating:16,curve:'C'}], ['KM1','CONT3',40,290,{coil:'230VAC'}],
    ['FR1','OL',40,540,{set:3.5}], ['M1','MOT3',30,740,{kw:1.5,conn:'delta'}],
    ['FU1','FUSE',360,40,{rating:2}], ['SB1','PB_NC',340,170], ['SB2','PB_NO',420,170],
    ['HL1','LAMP',500,300,{volt:'230VAC',color:'green'}], ['HL2','LAMP',560,300,{volt:'230VAC',color:'red'}],
  ],
  wires: [
    ['G1.L1','QF1.1'],['G1.L2','QF1.3'],['G1.L3','QF1.5'],
    ['QF1.2','KM1.1'],['QF1.4','KM1.3'],['QF1.6','KM1.5'],
    ['KM1.2','FR1.1'],['KM1.4','FR1.3'],['KM1.6','FR1.5'],
    ['FR1.2','M1.U1'],['FR1.4','M1.V1'],['FR1.6','M1.W1'],['G1.PE','M1.PE'],
    ['QF1.2','FU1.1'],['FU1.2','SB1.1'],['SB1.2','SB2.3'],['SB1.2','KM1.13'],['SB2.4','KM1.14'],['SB2.4','FR1.95'],['FR1.96','KM1.A1'],['KM1.A2','G1.N'],
    ['FU1.2','KM1.23'],['KM1.24','HL1.X1'],['HL1.X2','G1.N'],
    ['FU1.2','FR1.97'],['FR1.98','HL2.X1'],['HL2.X2','G1.N'],
  ],
};
const c = EL.build(spec);
const q = EL.partByTag(c,'QF1'), sb2 = EL.partByTag(c,'SB2'), sb1 = EL.partByTag(c,'SB1'), km = EL.partByTag(c,'KM1'), m = EL.partByTag(c,'M1'), fr = EL.partByTag(c,'FR1');
let sim = EL.runSeconds(c, 1);
console.log('breaker off: KM closed?', km.state.closed, 'coilV', km.state.vcoil);
q.state.on = true;
sim = EL.runSeconds(c, 0.5);
console.log('breaker on: V at FU1.1 =', EL.cabs(sim.vacAt(EL.refOf(c,'FU1.1'))).toFixed(1));
console.log('KM1 closed', km.state.closed);
sb2.state.act = true; sim = EL.runSeconds(c, 0.3);
console.log('press start: KM1 closed', km.state.closed, 'coil V', km.state.vcoil.toFixed(1));
sb2.state.act = false; sim = EL.runSeconds(c, 0.3);
console.log('released: KM1 closed (seal-in)', km.state.closed);
let t=0;
for (let i=0;i<6;i++){ sim = EL.runSeconds(c, 0.5); t+=0.5; console.log('t',t,'speed',m.state.w.toFixed(3),'amps',m.state.amps.toFixed(2),'dir',m.state.dir, 'volts', m.state.volts.toFixed(0)); }
console.log('OL heat', fr.state.heat.toFixed(4), 'QF heat', q.state.heat.toFixed(3), 'QF amps', q.state.amps.toFixed(2));
sb1.state.act = true; sim = EL.runSeconds(c, 0.3); sb1.state.act=false; sim = EL.runSeconds(c,0.2);
console.log('stop: KM1 closed', km.state.closed);
sim = EL.runSeconds(c, 5); console.log('coast speed', m.state.w.toFixed(3));
// lamps
const hl1 = EL.partByTag(c,'HL1'); console.log('HL1 b', hl1.state.b);
// overload trip: set OL too low
fr.props.set = 1.0; sb2.state.act = true; EL.runSeconds(c,0.3); sb2.state.act=false;
let n=0; while(!fr.state.tripped && n<2000){ EL.runSeconds(c,0.1); n++; }
console.log('OL tripped after', n*0.1,'s, KM1 closed', km.state.closed, 'HL2 b', EL.partByTag(c,'HL2').state.b);
