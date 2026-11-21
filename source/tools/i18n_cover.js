const fs=require('fs'),path=require('path');
const acorn=require('/opt/npm-tools/node_modules/acorn'),walk=require('/opt/npm-tools/node_modules/acorn-walk');
const root=path.join(__dirname,'..');const keys=require(root+'/i18n/keys.json');
const AR=/[؀-ۿ]/;
const covered=new Set();
const norm=(s)=>s.replace(/\{\d+\}/g,'').replace(/\s+/g,' ').trim();
for(const k of keys)covered.add(norm(k.ar));
const files=[];(function w(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory())w(p);else if(/\.js$/.test(f))files.push(p);}})(path.join(root,'src'));
let miss=[];
for(const p of files){if(/i18n/.test(p))continue;const src=fs.readFileSync(p,'utf8');const ast=acorn.parse(src,{ecmaVersion:2022,locations:true});
 walk.full(ast,(n)=>{let v=null;if(n.type==='Literal'&&typeof n.value==='string')v=n.value;if(n.type==='TemplateElement')v=n.value.cooked;
  if(v&&AR.test(v)){const key=norm(v);let ok=covered.has(key);
   if(!ok){/* partial of dynamic template? check if any covered ar contains */ for(const c of covered){ if(c.includes(key)){ok=true;break;} } }
   if(!ok)miss.push(path.relative(root,p)+':'+n.loc.start.line+': '+v.slice(0,70));}});}
console.log('uncovered arabic literals',miss.length);console.log(miss.slice(0,80).join('\n'));
