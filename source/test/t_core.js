require('../src/core.js');
const EL = globalThis.EL;
// minimal fake defs
EL.defs.X = { pins: [{id:'a'},{id:'b'}] };
function mk(parts, wires){ return {parts, wires}; }
// Test 1: DC 24V source with 100 + 200 ohm divider
EL.defs.S = { pins:[{id:'p'},{id:'n'}] };
EL.models.S = { elements:(p)=>[EL.VS(EL.P(p,'n'),EL.P(p,'p'),{vdc:24})] };
EL.models.R = { elements:(p)=>[EL.Z(EL.P(p,'a'),EL.P(p,'b'),p.r,0,{tag:'r'})] };
EL.defs.R = EL.defs.X;
const c = mk([{id:'S1',type:'S'},{id:'R1',type:'R',r:100},{id:'R2',type:'R',r:200}],
 [{a:'S1.p',b:'R1.a'},{a:'R1.b',b:'R2.a'},{a:'R2.b',b:'S1.n'}]);
let sim = EL.simulate(c);
console.log('mid node V', sim.vdcAt('R1.b')-sim.vdcAt('S1.n'), 'expect 16');
console.log('I', sim.e('R1','r').r_.idc, 'expect 0.08');
// Test 2: AC source with RL
EL.models.L = { elements:(p)=>[EL.Z(EL.P(p,'a'),EL.P(p,'b'),p.r,p.l,{tag:'z'})] };
EL.defs.L = EL.defs.X;
EL.models.A = { elements:(p)=>[EL.VS(EL.P(p,'n'),EL.P(p,'p'),{vac:230,ph:0,f:50})] };
EL.defs.A = EL.defs.S;
const c2 = mk([{id:'A1',type:'A'},{id:'L1',type:'L',r:300,l:1}],
 [{a:'A1.p',b:'L1.a'},{a:'L1.b',b:'A1.n'}]);
sim = EL.simulate(c2);
const z = Math.hypot(300, 2*Math.PI*50);
console.log('I ac', EL.cabs(sim.e('L1','z').r_.iac), 'expect', 230/z);
// Test 3: current source with compliance 24V into 1k (24mA -> 24 V limit exactly) and 2k (limit)
EL.models.C = { elements:(p)=>[EL.IS(EL.P(p,'n'),EL.P(p,'p'),p.i,{vmax:24, tag:'c'})] };
EL.defs.C = EL.defs.S;
for (const Rv of [500, 1000, 2000]) {
  const c3 = mk([{id:'C1',type:'C',i:0.024},{id:'R1',type:'R',r:Rv}],
   [{a:'C1.p',b:'R1.a'},{a:'R1.b',b:'C1.n'}]);
  sim = EL.simulate(c3);
  console.log('R',Rv,'I(mA)', (sim.e('R1','r').r_.idc*1000).toFixed(3), 'V', sim.e('R1','r').r_.vdc.toFixed(2));
}
// Test 4: diode
EL.models.D = { elements:(p)=>[{kind:'D',a:EL.P(p,'a'),b:EL.P(p,'b'),vf:2,rd:1,tag:'d'}] };
EL.defs.D = EL.defs.X;
const c4 = mk([{id:'S1',type:'S'},{id:'R1',type:'R',r:1000},{id:'D1',type:'D'}],
 [{a:'S1.p',b:'R1.a'},{a:'R1.b',b:'D1.a'},{a:'D1.b',b:'S1.n'}]);
sim = EL.simulate(c4);
console.log('LED I mA', (sim.e('D1','d').r_.idc*1000).toFixed(3),'expect ~21.99');
// reversed
const c5 = mk([{id:'S1',type:'S'},{id:'R1',type:'R',r:1000},{id:'D1',type:'D'}],
 [{a:'S1.p',b:'R1.a'},{a:'R1.b',b:'D1.b'},{a:'D1.a',b:'S1.n'}]);
sim = EL.simulate(c5);
console.log('LED reversed I', sim.e('D1','d').r_.idc);
// Test 6: megger: 500V DC across 1e9 ohm
const c6 = mk([{id:'R1',type:'R',r:1e9}],[]);
sim = EL.simulate(c6,{extra:[EL.VS('R1.b','R1.a',{vdc:500,tag:'m'})]});
console.log('megger I', sim.e('_x','m')?.r_?.idc, 'expect', 500/1e9);
