// Hands-on tools that come with the Classroom courses.
import {AREAS,READINESS,READY_LEVELS,READY_POINTS,COST_FIELDS,COURSES} from './content.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=(v,d=2)=>Number.isFinite(v)?v.toLocaleString('en-GB',{minimumFractionDigits:d,maximumFractionDigits:d}):'–';
const DISCLAIMER='Educational tool , not financial advice . It shows costs only , based on the numbers you enter . Check every number with your own suppliers and advisers .';

/* ================= Readiness check ================= */
export function readyLevel(score){let l=READY_LEVELS[0];for(const x of READY_LEVELS)if(score>=x.min)l=x;return l.name}
export function scoreReadiness(answers){
 const area={};
 READINESS.forEach(q=>{const a=answers[q.id];if(a==null)return;(area[q.area]=area[q.area]||[]).push(a/3)});
 const keys=Object.keys(AREAS),per={};keys.forEach(k=>per[k]=area[k]?area[k].reduce((x,y)=>x+y,0)/area[k].length:0);
 const score=Math.round(100*keys.reduce((s,k)=>s+per[k],0)/keys.length);
 const weak=[...keys].sort((a,b)=>per[a]-per[b]||keys.indexOf(a)-keys.indexOf(b)).slice(0,3);
 return {score,level:readyLevel(score),weak,per};
}
let ANS={};
export async function renderReadiness(el,C){
 let saved=null;if(C.U&&!C.S.demo||C.U&&C.S.demo){try{saved=await C.S.getReadiness()}catch(e){}}
 const fresh=new URLSearchParams(location.hash.split('?')[1]||'').has('retake');
 if(saved&&!fresh&&!Object.keys(ANS).length)return showResult(el,C,{...scoreReadiness(saved.answers&&Object.keys(saved.answers).length?saved.answers:{}),score:saved.score,level:saved.level,weak:saved.weak,answers:saved.answers||{}},true,saved.at);
 const groups=Object.keys(AREAS);
 el.innerHTML=`<p><a href="#classroom/start">← Start here</a></p>
 <div class="card tool-hero"><span class="tag">Tool</span><h2>Readiness check</h2><p class="muted">15 questions , about 5 minutes . You get a readiness score out of 100 , your 3 weakest areas with the lesson for each , and your next 3 steps .${C.U?'':' Sign in to save your result and earn '+READY_POINTS+' points .'}</p>
 <div class="bar"><i id="rqbar" style="width:0%"></i></div><div class="pct" id="rqn">0 / 15 answered</div></div>
 ${groups.map(g=>`<div class="card rq-area"><h4>${esc(AREAS[g].name)}</h4>${READINESS.filter(q=>q.area===g).map(q=>`<div class="rq" data-q="${q.id}"><div class="rqt">${esc(q.t)}</div><div class="opts">${q.o.map((o,i)=>`<button type="button" class="opt ${ANS[q.id]===i?'on':''}" data-v="${i}">${esc(o)}</button>`).join('')}</div></div>`).join('')}</div>`).join('')}
 <div class="row" style="justify-content:center;margin:20px 0"><button class="gbtn" id="rqgo" style="max-width:320px" disabled>See my readiness score</button></div>
 <p class="tiny" style="text-align:center;margin-top:-8px">Admins can see saved readiness answers and may use them to offer relevant help or resources .</p>`;
 const upd=()=>{const n=Object.keys(ANS).length;$('rqbar').style.width=(100*n/15)+'%';$('rqn').textContent=`${n} / 15 answered`;$('rqgo').disabled=n<15};
 el.querySelectorAll('.rq').forEach(r=>r.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{ANS[r.dataset.q]=+b.dataset.v;r.querySelectorAll('.opt').forEach(x=>x.classList.toggle('on',x===b));upd()}));
 upd();
 $('rqgo').onclick=async()=>{const r={...scoreReadiness(ANS),answers:{...ANS}};let ok=false;
  if(C.U){try{await C.S.saveReadiness(r);ok=true}catch(e){console.error(e);C.toast('Could not save your result . Try again in a moment .')}}
  ANS={};if(ok){history.replaceState(null,'','#tools/readiness');await C.refresh(true);return}
  showResult(el,C,r,false,Date.now(),!C.U)};
}
function ring(score){const r=54,c=2*Math.PI*r,off=c*(1-score/100);return `<svg viewBox="0 0 130 130" width="150" height="150"><circle cx="65" cy="65" r="${r}" fill="none" stroke="#222" stroke-width="12"/><circle cx="65" cy="65" r="${r}" fill="none" stroke="#d4af6a" stroke-width="12" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 65 65)"/><text x="65" y="70" text-anchor="middle" fill="#fff" font-size="34" font-weight="600" font-family="Inter,sans-serif">${score}</text><text x="65" y="92" text-anchor="middle" fill="#8a8a8a" font-size="11" font-family="Inter,sans-serif">out of 100</text></svg>`}
function showResult(el,C,r,saved,at,pending){
 const per=r.per||scoreReadiness(r.answers||{}).per;
 el.innerHTML=`<p><a href="#classroom/start">← Start here</a></p>
 <div class="card tool-hero res"><div class="ring">${ring(r.score)}</div><div><span class="tag">Your readiness</span><h2>${esc(r.level)}</h2>
 <p class="muted">${saved?`Saved to your profile${at?' on '+new Date(at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):''} . Completing the check earns ${READY_POINTS} points once .`:pending?'Sign in to save this result to your profile and earn '+READY_POINTS+' points .':'Not saved .'}</p>
 <div class="row">${pending?'<button class="gbtn" id="rqsign">Sign in to save</button>':''}<a class="gbtn o" style="text-decoration:none;text-align:center" href="#tools/readiness?retake=1" id="rqre">Retake the check</a></div><p class="tiny">Admins can see saved readiness answers and may use them to offer relevant help or resources .</p></div></div>
 ${Object.keys(per).length&&r.answers&&Object.keys(r.answers).length?`<div class="card" style="padding:18px;margin-top:14px"><h4 style="margin:0 0 12px">By area</h4>${Object.keys(AREAS).map(k=>`<div class="arow"><span>${esc(AREAS[k].name)}</span><div class="bar"><i style="width:${Math.round(per[k]*100)}%"></i></div><b>${Math.round(per[k]*100)}</b></div>`).join('')}</div>`:''}
 <div class="two"><div class="card" style="padding:18px"><h4 style="margin:0 0 10px">Your 3 weakest areas</h4><ol class="steps">${r.weak.map(k=>{const L=AREAS[k].lesson;return `<li><b>${esc(AREAS[k].name)}</b><br><span class="muted">Lesson : </span><a href="#classroom/${L[0]}">${esc(L[2])}</a></li>`}).join('')}</ol></div>
 <div class="card" style="padding:18px"><h4 style="margin:0 0 10px">Your next 3 steps</h4><ol class="steps">${r.weak.map(k=>`<li>${esc(AREAS[k].step)}</li>`).join('')}</ol></div></div>
 <p class="tiny" style="margin-top:12px">The score is a self-check to plan your learning , not advice or a rating of any business .</p>`;
 const s=$('rqsign');if(s)s.onclick=()=>{ANS={...(r.answers||{})};C.authForm()};
 $('rqre').onclick=()=>{ANS={}};
}

/* ================= Admin : readiness leads ================= */
export async function renderLeads(el,C){
 if(!C.isAdmin()){el.innerHTML='<div class="card about"><h3>Admins only</h3><p>This view is only for forum admins .</p></div>';return}
 let rows=[];try{rows=await C.S.adminReadiness()}catch(e){el.innerHTML='<p class="muted">Could not load readiness results .</p>';return}
 let profs=C.st.profiles;try{profs=(await C.S.load()).profiles}catch(e){}
 rows=rows.map(r=>({...r,p:profs.find(p=>p.uid===r.uid)||{}})).sort((a,b)=>b.score-a.score);
 el.innerHTML=`<div class="vhead"><h2>Readiness leads <span class="muted" style="font-size:16px">${rows.length}</span></h2><button class="gbtn o" id="lcsv" style="width:auto;padding:9px 16px">Download CSV</button></div>
 <p class="muted">Admins only . Members sorted by readiness score . Answers stay private to the member and admins .</p>
 <div class="card" style="overflow:auto"><table class="ltab"><tr><th>#</th><th>Member</th><th>City</th><th>Fleet plan</th><th>Score</th><th>Level</th><th>Weakest areas</th><th>Checked</th><th>Last seen</th></tr>
 ${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.p.name||r.uid)}</td><td>${esc(r.p.city||'')}</td><td>${esc(r.p.plan||'')}</td><td><b class="gold">${r.score}</b></td><td>${esc(r.level)}</td><td>${(r.weak||[]).map(k=>esc(AREAS[k]?.name||k)).join(' , ')}</td><td>${r.at?new Date(r.at).toLocaleDateString('en-GB'):''}</td><td>${r.p.lastSeen?new Date(r.p.lastSeen).toLocaleDateString('en-GB'):''}</td></tr>`).join('')||'<tr><td colspan="9" class="muted">No results yet .</td></tr>'}</table></div>`;
 $('lcsv').onclick=()=>{const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const csv=['name,city,plan,score,level,weakest,checked',...rows.map(r=>[r.p.name,r.p.city,r.p.plan,r.score,r.level,(r.weak||[]).join(' | '),r.at?new Date(r.at).toISOString().slice(0,10):''].map(q).join(','))].join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='readiness-leads.csv';a.click()};
}

/* ================= Cost-per-km calculator ================= */
let CUR='€',VAL={},EXA=new Set();
const PARTS=[['vehicle','Vehicle (financing or write-off)'],['energy','Energy'],['maint','Maintenance and tyres'],['insurance','Insurance'],['cleaning','Cleaning'],['parking','Parking or depot'],['software','Software , platform and fees']];
const COLORS={vehicle:'#d4af6a',energy:'#f2f2f2',maint:'#9a7b3e',insurance:'#bfbfbf',cleaning:'#e8c98a',parking:'#6f6f6f',software:'#5a4520'};
export function costCalc(v){
 const need=['price','months','kwhPrice','kwhKm','insurance','cleaning','maint','parking','software','kmDay','days','util'];
 const miss=need.filter(k=>!(Number.isFinite(v[k])));if(miss.length)return {miss};
 if(v.months<=0||v.kmDay<=0||v.days<=0||v.util<=0||v.util>100)return {miss:[],bad:true};
 const n=v.months,res=Number.isFinite(v.residual)?v.residual:0,r=(Number.isFinite(v.rate)?v.rate:0)/1200;
 const vehicle=r>0?(v.price-res/Math.pow(1+r,n))*r/(1-Math.pow(1+r,-n)):(v.price-res)/n;
 const km=v.kmDay*v.days;
 const m={vehicle,energy:v.kwhPrice*v.kwhKm*km,maint:v.maint*km,insurance:v.insurance,cleaning:v.cleaning,parking:v.parking,software:v.software};
 const month=Object.values(m).reduce((a,b)=>a+b,0);
 return {m,month,km,perKm:month/km,perPaxKm:month/km/(v.util/100),perDay:month/v.days};
}
function chart(R){
 const sm=innerWidth<600,W=sm?380:560,LX=sm?150:210,FS=sm?12:13,rowH=34,H=PARTS.length*rowH+10,max=Math.max(...Object.values(R.m),1);
 return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Cost breakdown per month">${PARTS.map(([k,l],i)=>{const w=Math.max(2,(W-LX-90)*R.m[k]/max),y=i*rowH+6,lab=sm&&l.length>20?l.slice(0,19)+'…':l;return `<text x="0" y="${y+17}" fill="#ccc" font-size="${FS}" font-family="Inter,sans-serif">${esc(lab)}</text><rect x="${LX}" y="${y+4}" width="${w}" height="18" rx="4" fill="${COLORS[k]}"/><text x="${LX+6+w}" y="${y+17}" fill="#fff" font-size="${FS-1}" font-family="Inter,sans-serif">${CUR} ${nf(R.m[k],0)} · ${Math.round(100*R.m[k]/R.month)}%</text>`}).join('')}</svg>`;
}
export async function renderCostKm(el,C){
 const groups=[...new Set(COST_FIELDS.map(f=>f.g))];
 const unit=u=>u.replace('cur',CUR);
 el.innerHTML=`<p><a href="#classroom/econ">← Cybercab Economics Guide</a></p>
 <div class="card tool-hero"><span class="tag">Tool</span><h2>Cost-per-km calculator</h2><p class="muted">Enter your own numbers to see what one car costs per km , per day and per month . Costs only .</p><div class="disc">${DISCLAIMER}</div>
 <div class="row"><label class="muted" style="font-size:13px">Currency <select id="ccur" class="sel">${['€','$','£'].map(c=>`<option ${c===CUR?'selected':''}>${c}</option>`).join('')}</select></label><button class="gbtn o" id="cex" style="width:auto;padding:9px 16px">Fill example values</button><button class="lnk" id="cclr">Clear all</button></div></div>
 <div id="cexw" class="exw" hidden>Example values in use : these are placeholders , not prices or facts . Replace every gold field with your own numbers .</div>
 <div class="ctool"><div class="cin">${groups.map(g=>`<div class="card cgrp"><h4>${g}</h4>${COST_FIELDS.filter(f=>f.g===g).map(f=>`<label class="cf"><span>${esc(f.l)}</span><span class="ciw"><input inputmode="decimal" data-k="${f.k}" placeholder="${f.opt?'optional':'your number'}"><em>${esc(unit(f.u))}</em></span></label>`).join('')}</div>`).join('')}</div>
 <div class="cout"><div class="card" style="padding:18px" id="cres"></div>
 <div class="card f" style="padding:18px;margin-top:14px"><h4 style="margin:0">Your scenarios</h4><div class="row" style="margin-top:10px"><input id="cname" maxlength="60" placeholder="Scenario name , e.g. Home depot 2027" style="flex:1;min-width:160px"><button class="gbtn" id="csave" style="width:auto">Save</button></div><div id="cscen" style="margin-top:10px"></div></div></div></div>`;
 const inputs=[...el.querySelectorAll('input[data-k]')];
 const fill=()=>inputs.forEach(i=>{const k=i.dataset.k;i.value=VAL[k]??'';i.classList.toggle('ex',EXA.has(k))});
 const read=()=>{const v={};inputs.forEach(i=>{const x=parseFloat(String(i.value).replace(',','.'));if(Number.isFinite(x))v[i.dataset.k]=x});return v};
 const draw=()=>{const v=read(),R=costCalc(v),box=$('cres');$('cexw').hidden=!EXA.size;
  if(R.miss){box.innerHTML=R.bad?'<p class="muted">Check your numbers : period , km per day , days and utilisation must be above zero , and utilisation at most 100 % .</p>':`<h4 style="margin:0 0 8px">Results</h4><p class="muted">Fill in ${R.miss.length} more field${R.miss.length>1?'s':''} to see your cost per km .</p>`;el._R=null;return}
  el._R={R,v,ex:EXA.size>0};
  box.innerHTML=`${EXA.size?'<div class="exs">Includes example values</div>':''}<div class="kpis"><div><span>Cost per km</span><b>${CUR} ${nf(R.perKm)}</b></div><div><span>Per km with a passenger</span><b>${CUR} ${nf(R.perPaxKm)}</b></div><div><span>Cost per day</span><b>${CUR} ${nf(R.perDay,0)}</b></div><div><span>Cost per month</span><b>${CUR} ${nf(R.month,0)}</b></div></div>
  <p class="tiny">${nf(R.km,0)} km per month . Per km with a passenger = cost per km ÷ utilisation .</p><h4 style="margin:14px 0 6px">Cost breakdown per month</h4>${chart(R)}
  <div class="row"><button class="gbtn o" id="cpng" style="width:auto;padding:9px 16px">Download PNG</button><button class="gbtn o" id="cpdf" style="width:auto;padding:9px 16px">Save as PDF</button></div><p class="tiny">${DISCLAIMER}</p>`;
  $('cpng').onclick=()=>png(el._R);$('cpdf').onclick=()=>pdf(el._R)};
 inputs.forEach(i=>i.oninput=()=>{const k=i.dataset.k;VAL[k]=i.value;EXA.delete(k);i.classList.remove('ex');draw()});
 $('ccur').onchange=e=>{CUR=e.target.value;renderCostKm(el,C)};
 $('cex').onclick=()=>{COST_FIELDS.forEach(f=>{VAL[f.k]=String(f.ex);EXA.add(f.k)});fill();draw()};
 $('cclr').onclick=()=>{VAL={};EXA.clear();fill();draw()};
 const scen=async()=>{const box=$('cscen');if(!C.U){box.innerHTML='<p class="muted" style="margin:0">Sign in to save scenarios to your profile .</p>';return}
  let list=[];try{list=await C.S.listScenarios()}catch(e){}
  box.innerHTML=list.length?list.map(s=>`<div class="scn"><div><b>${esc(s.name)}</b><div class="tiny">${esc(s.currency||'')} ${nf(s.results?.perKm)} per km · ${s.at?new Date(s.at).toLocaleDateString('en-GB'):''}${s.results?.ex?' · example values':''}</div></div><button class="lnk" data-load="${s.id}">Load</button><button class="lnk" data-del="${s.id}">Delete</button></div>`).join(''):'<p class="muted" style="margin:0">No saved scenarios yet .</p>';
  box.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{const s=list.find(x=>x.id===b.dataset.load);CUR=s.currency||CUR;VAL={};EXA.clear();Object.entries(s.inputs||{}).forEach(([k,v])=>VAL[k]=String(v));renderCostKm(el,C)});
  box.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{await C.S.deleteScenario(b.dataset.del);scen()})};
 $('csave').onclick=async()=>{if(!C.U){C.authForm();return}if(!el._R){C.toast('Fill in all fields first .');return}const n=$('cname').value.trim()||'Scenario '+new Date().toLocaleDateString('en-GB');
  const {R,v,ex}=el._R;try{await C.S.saveScenario({name:n.slice(0,60),currency:CUR,inputs:v,results:{perKm:R.perKm,perPaxKm:R.perPaxKm,perDay:R.perDay,perMonth:R.month,kmMonth:R.km,ex}});$('cname').value='';C.toast('Scenario saved .');scen()}catch(e){console.error(e);C.toast('Could not save the scenario .')}};
 fill();draw();scen();
}
function summaryRows(v){return COST_FIELDS.filter(f=>Number.isFinite(v[f.k])).map(f=>[f.l,`${v[f.k]} ${f.u.replace('cur',CUR)}`])}
function png({R,v,ex}){
 const W=1200,H=1500,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 g.fillStyle='#000';g.fillRect(0,0,W,H);g.fillStyle='#d4af6a';g.font='600 22px Inter,sans-serif';g.fillText('CYBERCAB FLEET OWNERS',60,80);
 g.fillStyle='#fff';g.font='600 46px Inter,sans-serif';g.fillText('Cost-per-km summary',60,145);
 g.fillStyle='#8a8a8a';g.font='22px Inter,sans-serif';g.fillText(new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})+(ex?'  ·  includes example values':''),60,185);
 const k=[['Cost per km',CUR+' '+nf(R.perKm)],['Per km with a passenger',CUR+' '+nf(R.perPaxKm)],['Cost per day',CUR+' '+nf(R.perDay,0)],['Cost per month',CUR+' '+nf(R.month,0)]];
 k.forEach(([l,val],i)=>{const x=60+(i%2)*550,y=230+Math.floor(i/2)*130;g.strokeStyle='#333';g.lineWidth=2;g.strokeRect(x,y,520,110);g.fillStyle='#8a8a8a';g.font='22px Inter,sans-serif';g.fillText(l,x+24,y+40);g.fillStyle='#d4af6a';g.font='600 40px Inter,sans-serif';g.fillText(val,x+24,y+88)});
 g.fillStyle='#fff';g.font='600 28px Inter,sans-serif';g.fillText('Cost breakdown per month',60,540);
 const max=Math.max(...Object.values(R.m),1);PARTS.forEach(([key,l],i)=>{const y=570+i*58;g.fillStyle='#ccc';g.font='22px Inter,sans-serif';g.fillText(l,60,y+28);const w=Math.max(4,520*R.m[key]/max);g.fillStyle=COLORS[key];g.fillRect(470,y+8,w,28);g.fillStyle='#fff';g.fillText(`${CUR} ${nf(R.m[key],0)} · ${Math.round(100*R.m[key]/R.month)}%`,480+w,y+30)});
 g.fillStyle='#fff';g.font='600 28px Inter,sans-serif';g.fillText('Your inputs',60,1010);g.font='20px Inter,sans-serif';
 summaryRows(v).forEach(([l,val],i)=>{const x=60+(i%2)*550,y=1050+Math.floor(i/2)*34;g.fillStyle='#8a8a8a';g.fillText(l.length>34?l.slice(0,33)+'…':l,x,y);g.fillStyle='#fff';g.fillText(val,x+360,y)});
 g.fillStyle='#8a8a8a';g.font='18px Inter,sans-serif';wrap(g,DISCLAIMER,60,1360,1080,26);g.fillStyle='#d4af6a';g.fillText('cybercabfleetowners.com/forum',60,1460);
 c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='cost-per-km-summary.png';a.click()});
}
function wrap(g,t,x,y,w,lh){let line='';t.split(' ').forEach(word=>{const test=line+word+' ';if(g.measureText(test).width>w){g.fillText(line,x,y);line=word+' ';y+=lh}else line=test});g.fillText(line,x,y)}
function pdf({R,v,ex}){
 const w=window.open('','_blank');if(!w)return;
 w.document.write(`<!doctype html><html><head><title>Cost-per-km summary</title><style>body{font-family:Inter,Arial,sans-serif;color:#111;margin:40px}h1{font-weight:600;margin:0 0 4px}.b{color:#a8842f;letter-spacing:.2em;font-size:12px}.k{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}.k div{border:1px solid #ccc;border-radius:8px;padding:12px}.k b{display:block;font-size:22px;color:#a8842f}table{border-collapse:collapse;width:100%;margin:10px 0}td{border-bottom:1px solid #eee;padding:6px 4px;font-size:13px}small{color:#666}</style></head><body>
 <div class="b">CYBERCAB FLEET OWNERS</div><h1>Cost-per-km summary</h1><small>${new Date().toLocaleDateString('en-GB')}${ex?' · includes example values':''}</small>
 <div class="k"><div>Cost per km<b>${CUR} ${nf(R.perKm)}</b></div><div>Per km with a passenger<b>${CUR} ${nf(R.perPaxKm)}</b></div><div>Cost per day<b>${CUR} ${nf(R.perDay,0)}</b></div><div>Cost per month<b>${CUR} ${nf(R.month,0)}</b></div></div>
 <h3>Cost breakdown per month</h3><table>${PARTS.map(([k,l])=>`<tr><td>${esc(l)}</td><td>${CUR} ${nf(R.m[k],0)}</td><td>${Math.round(100*R.m[k]/R.month)}%</td></tr>`).join('')}</table>
 <h3>Your inputs</h3><table>${summaryRows(v).map(([l,x])=>`<tr><td>${esc(l)}</td><td>${esc(x)}</td></tr>`).join('')}</table><p><small>${DISCLAIMER}</small></p><small>cybercabfleetowners.com/forum</small>
 <script>setTimeout(()=>print(),300)<\/script></body></html>`);w.document.close();
}
