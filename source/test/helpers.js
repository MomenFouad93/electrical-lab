module.exports = `
const scr = async (tag, dx=0, dy=0) => { const r = await p.evaluate((tag)=>{ const ed=EL.bench.ed; const q=ed.c.parts.find(x=>x.tag===tag); const d=EL.defs[q.type]; const b=ed.svg.getBoundingClientRect(); return {x:b.left+ed.view.x+(q.x+d.w/2)*ed.view.k, y:b.top+ed.view.y+(q.y+d.h/2)*ed.view.k}; }, tag); return {x:r.x+dx,y:r.y+dy}; };
const clickPart = async (tag, dx=0, dy=0) => { const q = await scr(tag,dx,dy); await p.mouse.click(q.x,q.y); };
const pinXY = async (ref) => await p.evaluate((ref)=>{ const ed=EL.bench.ed; const [t,pn]=ref.split('.'); const q=ed.c.parts.find(x=>x.tag===t); const pp=EL.pinPos(q,pn); const b=ed.svg.getBoundingClientRect(); return {x:b.left+ed.view.x+pp.x*ed.view.k, y:b.top+ed.view.y+pp.y*ed.view.k}; }, ref);
`;
