(()=>{const n=document.getElementById('cfn');if(!n)return;const b=n.querySelector('.burger'),dds=[...n.querySelectorAll('.dd')];
const set=(d,o)=>{d.classList.toggle('open',o);d.querySelector('button').setAttribute('aria-expanded',o)};
const closeAll=x=>dds.forEach(d=>{if(d!==x)set(d,false)});const shut=()=>{closeAll();n.classList.remove('open');b.setAttribute('aria-expanded','false')};
b.addEventListener('click',()=>{const o=n.classList.toggle('open');b.setAttribute('aria-expanded',o)});
dds.forEach(d=>d.querySelector('button').addEventListener('click',()=>{closeAll(d);set(d,!d.classList.contains('open'))}));
n.querySelectorAll('.links a').forEach(a=>a.addEventListener('click',shut));
document.addEventListener('click',e=>{if(!n.contains(e.target))shut()});document.addEventListener('keydown',e=>{if(e.key==='Escape')shut()})})();
