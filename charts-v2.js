/* charts-v2: interactive SVG charts for cybercabfleetowners.com (own code, no library).
   Reads data/cybercab-stats.json. Black, white and gold. */
(function(){
const NS='http://www.w3.org/2000/svg',DAY=864e5,MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const nf=v=>Math.round(v).toLocaleString('en-US');
const ab=v=>v>=1e9?(v/1e9).toFixed(v>=1e10?1:2)+'B':v>=1e6?(v/1e6).toFixed(v>=1e7?1:2).replace(/\.?0+$/,'')+'M':v>=1e3?Math.round(v/1e3)+'K':String(Math.round(v));
const fd=(t,y)=>{const d=new Date(t);return d.getDate()+' '+MO[d.getMonth()]+(y?' '+d.getFullYear():'')};
const pd=s=>{const p=s.slice(0,10).split('-');return new Date(+p[0],+p[1]-1,+p[2],12).getTime()};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* style */
const css=`.cv2w{position:relative;touch-action:pan-y}
.cv2tip{position:absolute;z-index:5;pointer-events:none;display:none;background:#0b0b0b;border:1px solid rgba(212,175,106,.55);color:#fff;font:400 12.5px/1.45 Inter,system-ui,sans-serif;padding:7px 10px;border-radius:8px;max-width:260px;box-shadow:0 8px 24px rgba(0,0,0,.6);text-align:left;font-variant-numeric:tabular-nums}
.cv2tip b{color:#f1d9a0;font-weight:500}.cv2tip .d{display:block;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#d4af6a;margin-bottom:2px}
.cv2tip a{color:#f1d9a0;pointer-events:auto}.cv2tip.pin{pointer-events:auto}
.cv2seg{display:inline-flex;border:1px solid #333;border-radius:999px;padding:2px;gap:2px;font-size:12px}
.cv2seg button{background:none;border:0;color:#9a9a9a;padding:5px 12px;border-radius:999px;cursor:pointer;font:inherit}
.cv2seg button.on{background:#d4af6a;color:#000}
.cv2pulse{animation:cv2p 1.6s ease-in-out infinite}@keyframes cv2p{0%,100%{r:5;opacity:1}50%{r:10;opacity:.25}}
.cv2ev{cursor:pointer}.cv2ev line{transition:stroke-opacity .15s}.cv2ev:hover line{stroke-opacity:1}
.cv2tk{width:100%;max-width:640px;margin:26px auto 0;height:62px;position:relative;overflow:hidden;text-align:center}
.cv2tk>div{position:absolute;inset:0;transition:opacity .6s,transform .6s;opacity:0;transform:translateY(12px)}
.cv2tk>div.on{opacity:1;transform:none}.cv2tk .d{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#d4af6a}
.cv2tk .t{font-size:15px;color:#ddd;margin-top:4px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.cv2tk a{color:#ddd;border-bottom:1px solid rgba(212,175,106,.35)}
.cv2pills{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:22px auto 0}
.cv2pill{border-left:2px solid #d4af6a;padding:2px 14px 2px 10px;text-align:left}.cv2pill.my{border-color:#777}
.cv2pill b{display:block;font-size:26px;font-weight:300;color:#fff;font-variant-numeric:tabular-nums;line-height:1.1}
.cv2pill span{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:#9a9a9a}
.cv2bar{display:flex;height:16px;border-radius:8px;overflow:hidden;background:#1a1a1a}
.cv2bar i{display:block;height:100%;transition:opacity .2s}.cv2bar:hover i{opacity:.45}.cv2bar i:hover{opacity:1}
.cv2leg{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:6px 18px;margin-top:12px;font-size:13px;color:#ddd;text-align:left}
.cv2leg span{display:flex;align-items:center;gap:8px}.cv2leg em{font-style:normal;color:#9a9a9a;margin-left:auto;font-variant-numeric:tabular-nums}
.cv2leg s{width:10px;height:10px;border-radius:2px;flex:0 0 10px}
@media (prefers-reduced-motion:reduce){.cv2pulse{animation:none}.cv2tk>div{transition:none}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

/* generic helpers */
function el(p,tag,a,txt){const e=document.createElementNS(NS,tag);for(const k in a)e.setAttribute(k,a[k]);if(txt!=null)e.textContent=txt;p.appendChild(e);return e}
function wrap(svg){const w=svg.parentElement;if(!w.classList.contains('cv2w')){const d=document.createElement('div');d.className='cv2w';svg.parentNode.insertBefore(d,svg);d.appendChild(svg)}
 const W=svg.parentElement;let t=W.querySelector('.cv2tip');if(!t){t=document.createElement('div');t.className='cv2tip';W.appendChild(t)}return t}
function place(tip,svg,cx,cy){const w=tip.parentElement.getBoundingClientRect(),tw=tip.offsetWidth,th=tip.offsetHeight;let x=cx-w.left+14,y=cy-w.top-th-12;
 if(x+tw>w.width)x=cx-w.left-tw-14;if(x<0)x=Math.max(0,Math.min(w.width-tw,cx-w.left-tw/2));if(y<0)y=cy-w.top+16;tip.style.left=x+'px';tip.style.top=y+'px'}
/* hover: pts=[{x,y,html}] in viewBox coords; nearest by x, crosshair + dot */
function hover(svg,W,H,pts,o){o=o||{};const tip=wrap(svg);let g=svg.querySelector('g.cv2x');if(g)g.remove();g=el(svg,'g',{class:'cv2x','pointer-events':'none',opacity:0});
 const ln=el(g,'line',{y1:o.top||10,y2:H-(o.bottom||30),stroke:'#f1d9a0','stroke-opacity':.45,'stroke-dasharray':'2 3'}),dot=el(g,'circle',{r:5,fill:'#000',stroke:'#f1d9a0','stroke-width':2});
 const vx=e=>{const b=svg.getBoundingClientRect();return (e.clientX-b.left)/b.width*W};
 svg.onpointermove=e=>{if(tip.classList.contains('pin'))return;const x=vx(e);let p=null;
  if(o.at)p=o.at(x);else{let best=1e9;for(const q of pts){const d=Math.abs(q.x-x);if(d<best){best=d;p=q}}}
  if(!p){g.setAttribute('opacity',0);tip.style.display='none';return}
  ln.setAttribute('x1',p.x);ln.setAttribute('x2',p.x);dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);g.setAttribute('opacity',1);
  tip.innerHTML=p.html;tip.style.display='block';place(tip,svg,e.clientX,e.clientY)};
 svg.onpointerleave=e=>{if(e.pointerType==='mouse'){g.setAttribute('opacity',0);if(!tip.classList.contains('pin'))tip.style.display='none'}};
 return {tip,g}}
function niceStep(max,n){const s=Math.pow(10,Math.floor(Math.log10(max/n)));return [1,2,2.5,5,10].map(m=>m*s).find(v=>max/v<=n)}
function widthOf(svg,def){const w=svg.parentElement.getBoundingClientRect().width||def;return Math.round(Math.max(340,Math.min(def,w)))}
function onResize(fn){let t,last=innerWidth;addEventListener('resize',()=>{if(Math.abs(innerWidth-last)<30)return;last=innerWidth;clearTimeout(t);t=setTimeout(fn,200)})}
window.cv2Hover=hover;

/* 1. Robotaxi miles: history + forecast band + events + live now */
function milesChart(d){const svg=document.getElementById('mt-chu');if(!svg||!d.tracker)return;const K=d.tracker,U=K.unsupervised;
 const tu=Date.parse(U.ts),g=U.wow||.17,glo=U.wow_lo!=null?U.wow_lo:.10,ghi=U.wow_hi!=null?U.wow_hi:.24,wk=U.rate_s*7*86400,tE=pd('2026-12-31');
 const EV=(d.events||[]).map(e=>({t:pd(e.date),d:e.date,text:e.text,url:e.url||null,kind:e.kind||''})).sort((a,b)=>a.t-b.t);
 const hist=K.unsup_history.map(p=>({t:pd(p.date),v:p.miles,n:p.note||''})).filter(p=>p.t<tu).sort((a,b)=>a.t-b.t);
 let range=localStorage.getItem('cv2range')||'30';
 const ctl=document.getElementById('mt-range');
 if(ctl){ctl.innerHTML='<div class="cv2seg" role="group" aria-label="Chart range"><button data-r="30">Last 30 days</button><button data-r="all">Since July</button></div>';
  ctl.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.r===range);b.onclick=()=>{range=b.dataset.r;try{localStorage.setItem('cv2range',range)}catch(_){}ctl.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));draw()}})}
 let liveTxt=null,liveT=null;
 function draw(){const now=Date.now(),nowV=U.miles+U.rate_s*(now-tu)/1e3,W=widthOf(svg,700),sm=W<520,H=sm?300:340,L=sm?44:58,R=sm?14:22,T=34,B=34;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);while(svg.firstChild)svg.removeChild(svg.firstChild);
  const fc=(gr,t)=>{const w=(t-now)/(7*DAY);return nowV+wk*(Math.pow(1+gr,w)-1)/gr};
  const H0=hist.concat([{t:now,v:nowV,n:'live counter'}]);
  const x0=range==='all'?H0[0].t:now-30*DAY,x1=tE;
  const vAt=t=>{if(t>=now)return fc(g,t);for(let i=1;i<H0.length;i++)if(H0[i].t>=t){const a=H0[i-1],c=H0[i];return a.v+(c.v-a.v)*(t-a.t)/((c.t-a.t)||1)}return nowV};
  const Hs=[{t:x0,v:vAt(x0)}].concat(H0.filter(p=>p.t>x0));
  const yTop=fc(ghi,tE)*1.04,step=niceStep(yTop,sm?4:5),ymax=Math.ceil(yTop/step)*step;
  const X=t=>L+(t-x0)/(x1-x0)*(W-L-R),Y=v=>T+(1-v/ymax)*(H-T-B),base=Y(0);
  const defs=el(svg,'defs',{}),lg=el(defs,'linearGradient',{id:'cv2ga',x1:0,y1:0,x2:0,y2:1});el(lg,'stop',{offset:0,'stop-color':'#d4af6a','stop-opacity':.55});el(lg,'stop',{offset:1,'stop-color':'#d4af6a','stop-opacity':.04});
  for(let v=0;v<=ymax+1;v+=step){el(svg,'line',{x1:L,x2:W-R,y1:Y(v),y2:Y(v),stroke:'#1f1f1f'});el(svg,'text',{x:L-8,y:Y(v)+4,'text-anchor':'end','font-size':12,fill:'#777'},v?ab(v):'0')}
  /* x ticks: 1st (and 15th when room) of each month */
  const ticks=[];for(let dd=new Date(x0);dd.getTime()<=x1;dd.setDate(dd.getDate()+1)){const day=dd.getDate();if(day===1||(range!=='all'&&!sm&&day===15))ticks.push(dd.getTime())}
  ticks.forEach(t=>el(svg,'text',{x:X(t),y:H-B+20,'text-anchor':'middle','font-size':12,fill:'#777'},fd(t)));
  const step2=Math.max(DAY/2,(x1-now)/80),F=[];for(let t=now;t<=x1+1;t+=step2)F.push(t);if(F[F.length-1]<x1)F.push(x1);
  const pl=a=>a.map(p=>X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)).join(' L');
  el(svg,'path',{d:'M'+pl(F.map(t=>[t,fc(ghi,t)]))+' L'+pl(F.slice().reverse().map(t=>[t,fc(glo,t)]))+' Z',fill:'#d4af6a','fill-opacity':.13});
  el(svg,'path',{d:'M'+pl(F.map(t=>[t,fc(g,t)]))+` L${X(x1)},${base} L${X(now)},${base} Z`,fill:'#d4af6a','fill-opacity':.05});
  el(svg,'path',{d:'M'+pl(F.map(t=>[t,fc(g,t)])),fill:'none',stroke:'#d4af6a','stroke-width':2.5,'stroke-dasharray':'7 6','stroke-linecap':'round'});
  el(svg,'path',{d:'M'+pl(Hs.map(p=>[p.t,p.v]))+` L${X(now)},${base} L${X(x0)},${base} Z`,fill:'url(#cv2ga)'});
  el(svg,'path',{d:'M'+pl(Hs.map(p=>[p.t,p.v])),fill:'none',stroke:'#f1d9a0','stroke-width':3,'stroke-linejoin':'round'});
  Hs.slice(1,-1).forEach(p=>el(svg,'circle',{cx:X(p.t),cy:Y(p.v),r:range==='all'?3:2.5,fill:'#000',stroke:'#f1d9a0','stroke-width':1.5}));
  /* events */
  const evPts=[];EV.filter(e=>e.t>=x0&&e.t<=x1).forEach(e=>{const x=X(e.t),a=el(svg,'g',{class:'cv2ev'});
   el(a,'line',{x1:x,x2:x,y1:T-6,y2:H-B,stroke:'#9a9a9a','stroke-opacity':.45,'stroke-dasharray':'2 4'});
   el(a,'rect',{x:x-3.5,y:T-13,width:7,height:7,transform:`rotate(45 ${x} ${T-9.5})`,fill:'#000',stroke:'#d4af6a','stroke-width':1.5});
   el(a,'rect',{x:x-6,y:T-16,width:12,height:H-B-T+16,fill:'transparent'});evPts.push({x,e})});
  /* now line + live dot + labels */
  const xn=X(now),yn=Y(nowV);el(svg,'line',{x1:xn,x2:xn,y1:T-4,y2:H-B,stroke:'#fff','stroke-opacity':.55,'stroke-width':1});
  if(!RM)el(svg,'circle',{cx:xn,cy:yn,r:5,fill:'#f1d9a0',class:'cv2pulse'});el(svg,'circle',{cx:xn,cy:yn,r:4.5,fill:'#f1d9a0',stroke:'#000','stroke-width':1.5});
  liveTxt=el(svg,'text',{x:xn-8,y:T+10,'text-anchor':'end','font-size':sm?12:13,fill:'#fff'},'now · '+nf(nowV));liveT=now;
  const fe=fc(g,x1);el(svg,'circle',{cx:X(x1),cy:Y(fe),r:4,fill:'#d4af6a'});
  el(svg,'text',{x:X(x1)-6,y:Y(fe)-34,'text-anchor':'end','font-size':sm?13:14,fill:'#f1d9a0','font-weight':500},'~'+ab(fe)+' by 31 Dec');
  el(svg,'text',{x:X(x1)-6,y:Y(fe)-17,'text-anchor':'end','font-size':11,fill:'#9a9a9a'},'band '+Math.round(glo*100)+'–'+Math.round(ghi*100)+'% per week');
  /* hover */
  const at=x=>{const ev=evPts.find(p=>Math.abs(p.x-x)<=6);if(ev){const e=ev.e;return {x:ev.x,y:Y(vAt(e.t)),html:`<span class="d">${fd(e.t,1)}</span>${esc(e.text)}`+(e.url?`<br><a href="${esc(e.url)}" target="_blank" rel="noopener">Source ↗</a>`:''),ev:e}}
   const t=x0+(x-L)/(W-L-R)*(x1-x0);if(t<x0||t>x1)return null;const fut=t>now;if(!fut){const hp=H0.filter(q=>q.t>=x0).reduce((a,q)=>Math.abs(q.t-t)<Math.abs(a.t-t)?q:a,H0[H0.length-1]);if(Math.abs(X(hp.t)-x)<=8)return {x:X(hp.t),y:Y(hp.v),html:`<span class="d">${hp.t===now?'Now · live':fd(hp.t,1)}</span><b>${nf(hp.v)}</b> driverless miles`+(hp.n&&!/counter/.test(hp.n)?`<br><span style="color:#9a9a9a">${esc(hp.n)}</span>`:'')};const v=vAt(t);return {x,y:Y(v),html:`<span class="d">${fd(t,1)}</span><b>~${ab(v)}</b> driverless miles<br><span style="color:#9a9a9a">between reported points</span>`}}const v=vAt(t);
   return {x,y:Y(v),html:`<span class="d">${fd(t,1)}${fut?' · forecast':''}</span><b>${fut?'~'+ab(v):nf(v)}</b> driverless miles`+(fut?`<br><span style="color:#9a9a9a">band ${ab(fc(glo,t))}–${ab(fc(ghi,t))}</span>`:'')}};
  const h=hover(svg,W,H,[],{at,top:T-4,bottom:B});
  svg.onclick=e=>{const b=svg.getBoundingClientRect(),p=at((e.clientX-b.left)/b.width*W);if(!p||!p.ev)return;
   if(e.pointerType==='mouse'||!('ontouchstart' in window)){if(p.ev.url)open(p.ev.url,'_blank','noopener')}
   else{h.tip.classList.add('pin');h.tip.innerHTML=p.html;h.tip.style.display='block';place(h.tip,svg,e.clientX,e.clientY);setTimeout(()=>document.addEventListener('click',function z(ev){if(!h.tip.contains(ev.target)){h.tip.classList.remove('pin');h.tip.style.display='none';document.removeEventListener('click',z)}}),0)}};
  svg.setAttribute('aria-label',`Robotaxi driverless miles: ${nf(nowV)} now, forecast about ${ab(fe)} by 31 December at ${Math.round(g*100)}% weekly growth`);
 }
 draw();onResize(draw);
 setInterval(()=>{if(liveTxt)liveTxt.textContent='now · '+nf(U.miles+U.rate_s*(Date.now()-tu)/1e3)},1000);
 setInterval(draw,10*60*1000);
 const fn=document.getElementById('mt-fnote2');if(fn)fn.innerHTML=`Solid = Tesla's published counter and earlier reported totals. Dashed = forecast at ${esc(U.wow_note||Math.round(g*100)+'% week-over-week growth')}, shaded band ${Math.round(glo*100)}–${Math.round(ghi*100)}%. Diamonds mark events, hover or tap for details. Forecasts are illustrations, not predictions.`;
}

/* 2. Events ticker */
function ticker(d){const box=document.getElementById('mt-ticker');if(!box)return;const E=(d.events||[]).slice().sort((a,b)=>a.date<b.date?1:-1).slice(0,6);if(!E.length){box.hidden=true;return}
 box.classList.add('cv2tk');box.setAttribute('aria-live','off');
 box.innerHTML=E.map((e,i)=>`<div class="${i?'':'on'}"><span class="d">${fd(pd(e.date),1)}</span><div class="t">${e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.text)}</a>`:esc(e.text)}</div></div>`).join('');
 if(RM||E.length<2)return;let i=0,hold=false;box.onmouseenter=()=>hold=true;box.onmouseleave=()=>hold=false;
 setInterval(()=>{if(hold||document.hidden)return;const k=box.children;k[i].classList.remove('on');i=(i+1)%k.length;k[i].classList.add('on')},4500)}

/* 3. City split of driverless miles */
function cities(d){const box=document.getElementById('mt-cities'),C=d.city_share;if(!box||!C||!C.unsupervised){if(box)box.hidden=true;return}
 const U=C.unsupervised.slice().sort((a,b)=>b.miles-a.miles),tot=U.reduce((s,c)=>s+c.miles,0),col=['#f1d9a0','#d4af6a','#a8823e','#7d6232','#5c4825','#3f321b','#2c2414'];
 box.innerHTML=`<p class="small" style="margin:0 0 8px;text-align:left">Where those driverless miles were driven · ${nf(tot)} mi as of ${fd(pd(C.as_of),1)}</p>`+
  `<div class="cv2bar">${U.map((c,i)=>`<i style="width:${c.miles/tot*100}%;background:${col[i%col.length]}" title="${esc(c.city)}: ${nf(c.miles)} mi (${(c.miles/tot*100).toFixed(1)}%)"></i>`).join('')}</div>`+
  `<div class="cv2leg">${U.map((c,i)=>`<span><s style="background:${col[i%col.length]}"></s>${esc(c.city)}<em>${ab(c.miles)} · ${(c.miles/tot*100).toFixed(1)}%</em></span>`).join('')}</div>`+
  ((C.new_driverless||[]).length?`<p class="src" style="text-align:left;margin-top:8px">New since this report: ${C.new_driverless.map(n=>esc(n.city)+' (driverless since '+fd(pd(n.since))+')').join(', ')}. More per city in <a href="#cities" style="color:var(--gold2)">Share by city</a>.</p>`:'')}

/* 4. Texas fleet: Cybercab vs Model Y */
function fleet(d){const svg=document.getElementById('cc-chart');if(!svg)return;
 const P=(d.cybercabs||[]).map(c=>{const my=c.model_y!=null?c.model_y:(c.total_robotaxis!=null?c.total_robotaxis-c.count:null);return {t:pd(c.date),date:c.date,cc:c.count,my,tot:my!=null?c.count+my:null}}).sort((a,b)=>a.t-b.t);if(!P.length)return;
 const last=P[P.length-1],lt=P.filter(p=>p.my!=null).slice(-1)[0];
 const pills=document.getElementById('cc-pills');if(pills&&lt){pills.innerHTML=`<div class="cv2pill"><b>${nf(lt.cc)}</b><span>Cybercab</span></div><div class="cv2pill my"><b>${nf(lt.my)}</b><span>Model Y</span></div><div class="cv2pill" style="border-color:#fff"><b>${nf(lt.tot)}</b><span>Robotaxis in Texas · ${fd(lt.t)}</span></div>`}
 function draw(){const W=widthOf(svg,700),sm=W<520,H=sm?280:320,L=sm?40:52,R=sm?12:20,T=28,B=40;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);while(svg.firstChild)svg.removeChild(svg.firstChild);
  const t0=P[0].t-DAY,t1=last.t+DAY,X=t=>L+(t-t0)/(t1-t0)*(W-L-R);
  const vmax=Math.max(...P.map(p=>p.tot||p.cc)),stp=niceStep(vmax*1.1,sm?4:5),ymax=Math.ceil(vmax*1.12/stp)*stp,Y=v=>T+(1-v/ymax)*(H-T-B);
  for(let v=0;v<=ymax;v+=stp){el(svg,'line',{x1:L,x2:W-R,y1:Y(v),y2:Y(v),stroke:'#1f1f1f'});el(svg,'text',{x:L-8,y:Y(v)+4,'text-anchor':'end','font-size':12,fill:'#777'},nf(v))}
  const minGap=Math.min(...P.slice(1).map((p,i)=>X(p.t)-X(P[i].t)),60),bw=Math.max(8,Math.min(34,minGap*.7));
  const pts=[];P.forEach((p,i)=>{const x=X(p.t);
   el(svg,'rect',{x:x-bw/2,y:Y(p.cc),width:bw,height:Y(0)-Y(p.cc),rx:2,fill:'#d4af6a'});
   if(p.my!=null)el(svg,'rect',{x:x-bw/2+.75,y:Y(p.tot)+.75,width:bw-1.5,height:Math.max(0,Y(p.cc)-Y(p.tot)-2),rx:2,fill:'#262626',stroke:'#8a8a8a','stroke-width':1.5});
   const showLbl=i===P.length-1||i===0||(X(p.t)-X(P[Math.max(0,i-1)].t)>44&&(i===P.length-1||X(P[i+1].t)-x>44));
   if(showLbl)el(svg,'text',{x,y:Y(p.tot||p.cc)-8,'text-anchor':'middle','font-size':12,fill:'#fff'},nf(p.tot||p.cc));
   pts.push({x,y:Y(p.tot||p.cc),html:`<span class="d">${fd(p.t,1)}</span><b>${nf(p.cc)}</b> Cybercab`+(p.my!=null?`<br>${nf(p.my)} Model Y<br><span style="color:#9a9a9a">${nf(p.tot)} total · Cybercab ${Math.round(p.cc/p.tot*100)}%</span>`:'<br><span style="color:#9a9a9a">Model Y count not reported</span>')})});
  /* x labels: first, last, and month starts */
  const xl=[P[0].t,last.t];xl.forEach((t,i)=>el(svg,'text',{x:X(t),y:H-B+20,'text-anchor':i?'end':'start','font-size':12,fill:'#777'},fd(t)));
  /* crossover marker */
  const cx=P.find(p=>p.my!=null&&p.cc>p.my);if(cx){const x=X(cx.t);el(svg,'line',{x1:x,x2:x,y1:T-6,y2:H-B,stroke:'#f1d9a0','stroke-opacity':.5,'stroke-dasharray':'2 4'});
   el(svg,'text',{x:x+(x>W*.6?-6:6),y:T-10,'text-anchor':x>W*.6?'end':'start','font-size':12,fill:'#f1d9a0'},fd(cx.t)+': Cybercabs pass Model Y')}
  /* legend */
  const lx=L+4;el(svg,'rect',{x:lx,y:T+2,width:10,height:10,rx:2,fill:'#d4af6a'});el(svg,'text',{x:lx+16,y:T+11,'font-size':12,fill:'#ccc'},'Cybercab');
  el(svg,'rect',{x:lx+86,y:T+2,width:10,height:10,rx:2,fill:'#262626',stroke:'#8a8a8a'});el(svg,'text',{x:lx+102,y:T+11,'font-size':12,fill:'#ccc'},'Model Y');
  hover(svg,W,H,pts,{top:T,bottom:B});svg.setAttribute('aria-label',`Texas Robotaxi fleet: ${lt?nf(lt.cc)+' Cybercab and '+nf(lt.my)+' Model Y on '+fd(lt.t,1):nf(last.cc)+' Cybercabs'}`)}
 draw();onResize(draw);
 const note=document.getElementById('cc-note'),cx=P.find(p=>p.my!=null&&p.cc>p.my);if(note&&lt){const lead=lt.cc>=lt.my;
  note.textContent=`Latest (${fd(lt.t,1)}): ${nf(lt.cc)} Cybercab vs ${nf(lt.my)} Model Y, ${Math.round(lt.cc/lt.tot*100)}% Cybercab.`+(cx?(lead?` Cybercabs have led since ${fd(cx.t)}.`:` Cybercabs first passed Model Y on ${fd(cx.t)} (${nf(cx.cc)} vs ${nf(cx.my)}); new Model Y registrations put Model Y back ahead.`):'')}}

function go(){fetch('data/cybercab-stats.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{window.CV2_DATA=d;
 [milesChart,ticker,cities,fleet].forEach(f=>{try{f(d)}catch(e){console.error('charts-v2',f.name,e)}})}).catch(()=>{})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
})();
