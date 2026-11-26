/* One fetch of data/cybercab-stats.json, then paint every tracker and map widget. */
window.CFO_STATS = window.CFO_STATS || fetch('data/cybercab-stats.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('stats');return r.json()});

async function loadEuMap(){
  if(document.getElementById('eu-map'))return;
  const host=document.getElementById('eu-map-host');
  if(!host)return;
  const r=await fetch('/img/eu-fsd-map.svg',{cache:'force-cache'});
  if(!r.ok)throw new Error('eu-map');
  host.innerHTML=await r.text();
}

function paintCybercabs(d){
const P=(d.cybercabs||[]).slice().sort((a,b)=>a.date<b.date?-1:1);if(!P.length)return;const l=P[P.length-1];
document.getElementById('cc-latest').innerHTML=`<span class="gold" style="font-size:28px;font-weight:300">${l.count}</span> registered Cybercabs on ${new Date(Date.parse(l.date)).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}`+(l.total_robotaxis?` · ${l.total_robotaxis} robotaxis in total`:'');
}

function paintMembers(d){
const svg=document.getElementById('mb-chart');if(!svg)return;
const P=(d.members||[]).map(x=>({t:Date.parse(x.date),v:x.count})).sort((a,b)=>a.t-b.t);if(!P.length){svg.parentElement.hidden=true;return}
const W=700,H=320,L=52,R=20,T=34,B=48,day=864e5,t0=P[0].t,l=P[P.length-1],tE=Date.parse('2026-12-31'),t1=Math.max(tE,l.t+day);
let b0=P[0];for(const p of P){if(l.t-p.t<=14*day){b0=p;break}}const nd=(l.t-b0.t)/day,pace=nd>0?(l.v-b0.v)/nd:0;
const left=Math.max(0,(tE-l.t)/day),proj=Math.round(l.v+pace*left),need=left>0?(1000-l.v)/left:0,more=Math.max(0,need-pace);
const vmin=Math.floor((Math.min(...P.map(p=>p.v))-20)/50)*50,vmax=Math.ceil(Math.max(1000,proj,...P.map(p=>p.v))/50)*50+50;
const x=t=>L+(t-t0)/(t1-t0)*(W-L-R),y=v=>T+(1-(v-vmin)/(vmax-vmin))*(H-T-B);
const D=P.map((p,k)=>k?Math.max(0,p.v-P[k-1].v):0),dmax=Math.max(1,...D),bh=50,bw=6;
const f=t=>new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short'});let g='';
const st=Math.max(50,Math.ceil((vmax-vmin)/5/50)*50);for(let v=vmin;v<=vmax;v+=st)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#222"/><text x="${L-8}" y="${y(v)+4}" fill="#777" font-size="13" text-anchor="end">${v}</text>`;
[t0,Date.parse('2026-11-01'),Date.parse('2026-12-01'),tE].forEach((t,i)=>{if(t<t0||(i&&i<3&&Math.abs(x(t)-x(t0))<60))return;g+=`<text x="${x(t)}" y="${H-B+22}" fill="#777" font-size="13" text-anchor="${i==0?'start':i==3?'end':'middle'}">${f(t)}</text>`});
P.forEach((p,k)=>{if(k&&D[k]>0){const h=D[k]/dmax*bh;g+=`<rect x="${x(p.t)-bw/2}" y="${H-B-h}" width="${bw}" height="${h}" rx="2" fill="rgba(212,175,106,.4)"/>`}});
if(left>0){g+=`<line x1="${x(l.t)}" y1="${y(l.v)}" x2="${x(tE)}" y2="${y(1000)}" stroke="#fff" stroke-width="1.2" stroke-dasharray="7 6" opacity=".8"/><text x="${x(tE)-4}" y="${y(1000)-10}" fill="#fff" font-size="14" text-anchor="end">goal: 1,000</text>`;
g+=`<line x1="${x(l.t)}" y1="${y(l.v)}" x2="${x(tE)}" y2="${y(proj)}" stroke="#d4af6a" stroke-width="2.5" stroke-dasharray="2 6" stroke-linecap="round"/><text x="${x(tE)-4}" y="${y(proj)+40}" fill="#d4af6a" font-size="14" text-anchor="end">~${proj} by 31 Dec</text><text x="${(x(l.t)+x(tE))/2}" y="${y((l.v+proj)/2)+24}" fill="#d4af6a" font-size="13" text-anchor="middle">trend at current pace</text>`}
g+=`<polyline points="${P.map(p=>x(p.t)+','+y(p.v)).join(' ')}" fill="none" stroke="#f1d9a0" stroke-width="3" stroke-linejoin="round"/><circle cx="${x(l.t)}" cy="${y(l.v)}" r="4.5" fill="#000" stroke="#f1d9a0" stroke-width="2"/><text x="${x(l.t)}" y="${y(l.v)-12}" fill="#fff" font-size="15" text-anchor="middle">${l.v}</text>`;
svg.innerHTML=g;if(window.cv2Hover)cv2Hover(svg,W,H,P.map((p,k)=>({x:x(p.t),y:y(p.v),html:`<span class="d">${f(p.t)}</span><b>${p.v}</b> members`+(k&&D[k]>0?` · +${D[k]} that day`:'')})),{top:T,bottom:B});document.getElementById('mb-latest').innerHTML=`<span class="gold" style="font-size:28px;font-weight:300">${l.v}</span> members on ${new Date(l.t).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}`;
const r1=v=>(Math.round(v*10)/10).toLocaleString('en-US');const c=document.getElementById('mb-trend');if(c&&left>0){c.innerHTML=proj>=1000?`At the current pace of ${r1(pace)}/day we reach ~${proj} by 31 December, past our 1,000 goal. Invite a fleet-minded friend!`:`At the current pace of ${r1(pace)}/day we reach ~${proj} by 31 December. ${r1(more)} more per day gets us to 1,000. Invite a fleet-minded friend!`;c.hidden=false}
}

function paintMileStrip(d){
const el=document.getElementById('mt-strip');if(!el)return;
const C=(d.cybercabs||[]).filter(c=>c.total_robotaxis).sort((a,b)=>a.date<b.date?-1:1),M=(d.miles||[]).slice().sort((a,b)=>a.date<b.date?-1:1);
const n=v=>Math.round(v).toLocaleString('en-US'),items=[];const fleet=C.length?C[C.length-1]:null;
if(M.length){const m=M[M.length-1];items.push([n(m.miles),'Autonomous miles','as of '+m.date]);
 if(fleet)items.push([n(m.miles/fleet.total_robotaxis),'Avg miles per Robotaxi','']);
 if(M.length>=2&&fleet){const day=864e5,tl=Date.parse(m.date);let b=M[0];for(const x of M){if(tl-Date.parse(x.date)>=7*day)b=x}const days=(tl-Date.parse(b.date))/day;if(days>0)items.push([(((m.miles-b.miles)/days)/fleet.total_robotaxis).toFixed(1),'Miles per Robotaxi per day',Math.round(days)+'-day average'])}}
if(fleet)items.push([Math.round(fleet.count/fleet.total_robotaxis*100)+'%','Cybercab share of fleet',fleet.count+' of '+fleet.total_robotaxis]);
if(!items.length)return;
el.innerHTML=items.map(([v,l,s])=>`<div class="stat"><div class="n gold">${v}</div><div class="l">${l}</div>${s?`<div class="src" style="margin-top:4px">${s}</div>`:''}</div>`).join('');
el.hidden=false;document.getElementById('mt-note').hidden=false;
}

function paintTexasMpd(d){
const P=(d.texas_mpd||[]).map(p=>({t:Date.parse(p.week_end),v:p.mpd})).sort((a,b)=>a.t-b.t),svg=document.getElementById('tx-chart');if(P.length<2){svg.parentElement.hidden=true;return}
const W=700,H=260,L=44,R=20,T=34,B=36,t0=P[0].t,t1=P[P.length-1].t,vmax=Math.ceil(Math.max(...P.map(p=>p.v))*1.15/25)*25,x=t=>L+(t-t0)/(t1-t0)*(W-L-R),y=v=>T+(1-v/vmax)*(H-T-B);let g='';
for(let v=0;v<=vmax;v+=25)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#222"/><text x="${L-8}" y="${y(v)+4}" fill="#777" font-size="13" text-anchor="end">${v}</text>`;
const f=t=>new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short'});[0,Math.floor(P.length/2),P.length-1].forEach((k,i)=>g+=`<text x="${x(P[k].t)}" y="${H-B+22}" fill="#777" font-size="13" text-anchor="${['start','middle','end'][i]}">${f(P[k].t)}</text>`);
g+=`<polyline points="${P.map(p=>x(p.t)+','+y(p.v)).join(' ')}" fill="none" stroke="#f1d9a0" stroke-width="3" stroke-linejoin="round"/>`;P.forEach(p=>g+=`<circle cx="${x(p.t)}" cy="${y(p.v)}" r="3" fill="#000" stroke="#f1d9a0" stroke-width="2"/>`);
const l=P[P.length-1],s=P.find(p=>p.t>=Date.parse('2026-09-01'));g+=`<text x="${x(l.t)}" y="${y(l.v)-12}" fill="#fff" font-size="15" text-anchor="end">${l.v}</text>`;if(s)g+=`<text x="${x(s.t)}" y="${y(s.v)+24}" fill="#aaa" font-size="13" text-anchor="middle">${s.v}</text>`;svg.innerHTML=g;if(window.cv2Hover)cv2Hover(svg,W,H,P.map(p=>({x:x(p.t),y:y(p.v),html:`<span class="d">Week to ${f(p.t)}</span><b>${p.v}</b> miles per Robotaxi per day`})),{top:T,bottom:B});
document.getElementById('tx-latest').innerHTML=`<span class="gold" style="font-size:28px;font-weight:300">${l.v}</span> driverless miles per Texas Robotaxi per day, week to ${f(l.t)}`+(s?` · up from ${s.v} in early September`:'');
const S=d.texas_mpd_source||{},TM=(d.texas_miles||[]).slice(-1)[0];document.getElementById('tx-src').innerHTML=(TM?`Texas-city driverless miles (Austin, Dallas, Houston): ${TM.miles.toLocaleString('en-US')} as of ${f(Date.parse(TM.date))}. `:'')+`Source: <a href="${S.url}" target="_blank" rel="noopener" style="color:var(--gold2)">@teslayoda</a>, from Tesla's Robotaxi safety report and Texas DMV registrations. Points between start and end read from the published chart (approx.). Registered is not the same as in service.`;
const st=document.getElementById('mt-strip');if(st){st.insertAdjacentHTML('beforeend',`<div class="stat"><div class="n gold">${l.v}</div><div class="l">Miles per Robotaxi per day (Texas)</div><div class="src" style="margin-top:4px">Texas-only, week to ${f(l.t)}</div></div>`);st.hidden=false}
}

function paintCityShare(d){
const C=d.city_share,$=i=>document.getElementById(i);if(!C){$('cities').hidden=true;return}
const U=C.unsupervised.slice().sort((a,b)=>b.pct-a.pct),mx=U[0].pct;
const G={'Austin, TX':[-97.74,30.27],'Dallas, TX':[-96.8,32.78],'Houston, TX':[-95.37,29.76],'Miami, FL':[-80.19,25.76],'Orlando, FL':[-81.38,28.54],'Tampa, FL':[-82.46,27.95],'San Francisco, CA':[-122.42,37.77],'San Antonio, TX':[-98.49,29.42],'Phoenix, AZ':[-112.07,33.45],'Las Vegas, NV':[-115.14,36.17],'Jacksonville, FL':[-81.66,30.33],'Fort Worth, TX':[-97.33,32.76]},px=c=>[(c[0]+125)*11,(49.5-c[1])*14];let m='';
const lbl=(n,x,y,dx,anc,col)=>`<text x="${x+dx}" y="${y+(n.startsWith('San A')?20:5)}" fill="${col}" font-size="17" text-anchor="${anc}">${n.split(',')[0]}</text>`;
C.upcoming.forEach(n=>{if(!G[n])return;const[x,y]=px(G[n]);m+=`<circle cx="${x}" cy="${y}" r="5" fill="#d4af6a"/>`+lbl(n,x,y,n.startsWith('San A')?-6:9,n.startsWith('San A')?'end':'start','#d4af6a')});
C.supervised.forEach(n=>{if(!G[n])return;const[x,y]=px(G[n]);m+=`<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="#fff" stroke-width="2"/>`+lbl(n,x,y,10,'start','#ddd')});
U.forEach(c=>{if(!G[c.city])return;const[x,y]=px(G[c.city]),r=4+Math.sqrt(c.pct)*2.2,L={'Austin, TX':[-r-4,'end'],'Dallas, TX':[r+4,'start'],'Houston, TX':[r+4,'start'],'Miami, FL':[-r-4,'end'],'Orlando, FL':[r+4,'start'],'Tampa, FL':[-r-4,'end']}[c.city]||[r+4,'start'];m+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".9" stroke="#000" stroke-width="1"/>`+lbl(c.city,x,y,L[0],L[1],'#fff')});
const N=C.new_driverless||[];N.forEach(c=>{if(!G[c.city])return;const[x,y]=px(G[c.city]);m+=`<circle cx="${x}" cy="${y}" r="5" fill="#fff" stroke="#000" stroke-width="1.5"/><text x="${x-8}" y="${y-12}" fill="#fff" font-size="17" text-anchor="end">${c.city.split(',')[0]}</text>`});$('cs-pins').innerHTML=m;
$('cs-bars').innerHTML=U.map(c=>`<div style="display:grid;grid-template-columns:110px 1fr 44px;align-items:center;gap:10px;margin:10px 0;font-size:14px"><span style="color:#ddd">${c.city}</span><span style="height:12px;background:#1a1a1a;border-radius:6px;overflow:hidden"><span style="display:block;height:100%;width:${c.pct/mx*100}%;background:linear-gradient(90deg,#d4af6a,#f1d9a0);border-radius:6px"></span></span><span class="gold" style="text-align:right">${c.pct.toFixed(1)}%</span></div>`).join('')+N.map(c=>`<div style="display:grid;grid-template-columns:110px 1fr;align-items:center;gap:10px;margin:10px 0;font-size:14px"><span style="color:#ddd">${c.city}</span><span style="color:#9a9a9a;font-size:13px">Driverless since ${new Date(c.since+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}, not in Tesla's report yet</span></div>`).join('');
const tag=(t,b)=>`<span style="display:inline-block;margin:4px 6px 4px 0;padding:5px 12px;border-radius:999px;font-size:13px;${b}">${t}</span>`,lab=t=>`<div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#9a9a9a;margin:10px 0 4px">${t}</div>`;
$('cs-tags').innerHTML=lab('Supervised')+C.supervised.map(t=>tag(t,'border:1px solid #f1d9a0;color:#f1d9a0')).join('')+lab('Coming soon')+C.upcoming.map(t=>tag(t,'border:1px dashed #666;color:#bbb')).join('');
$('cs-src').innerHTML=`Share of unsupervised Robotaxi miles by city. Source: <a href="${C.source.url}" target="_blank" rel="noopener" style="color:var(--gold2)">${C.source.text}</a>, as of ${new Date(Date.parse(C.as_of)).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}. Idea via <a href="${C.source.credit_url}" target="_blank" rel="noopener" style="color:var(--gold2)">${C.source.credit_text}</a>. Not affiliated with Tesla.`;
}

function paintEuFsd(d){
const E=d.eu_fsd,$=i=>document.getElementById(i);if(!E){$('eu-fsd').hidden=true;return}const by={};E.forEach(e=>by[e.iso]=e);document.querySelectorAll('#eu-map path').forEach(p=>{const e=by[p.dataset.iso];if(e)p.setAttribute('fill',e.status=='approved'?'#d4af6a':'#5e5038')});const A=E.filter(e=>e.status=='approved'),R=E.filter(e=>e.status!='approved');$('eu-n').textContent=A.length;const f=s=>s?new Date(s+'T12:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'date unclear';const row=(e,c)=>'<div style="display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #222"><span style="color:'+c+'">'+e.country+'</span><span style="color:#888;font-size:12px;text-align:right">'+f(e.date)+' · <a href="'+e.source+'" target="_blank" rel="noopener" style="color:#888">source</a></span></div>';$('eu-list').innerHTML='<div class="kicker" style="margin:0 0 6px">Allowed</div>'+A.map(e=>row(e,'#d4af6a')).join('')+'<div class="kicker" style="margin:22px 0 6px">Under review</div>'+R.map(e=>row(e,'#bbb')).join('');$('eu-next').textContent='Next: '+(d.eu_fsd_next||'')+'. A yes vote would allow it in all EU countries.';$('eu-src').textContent='Sources: RDW, national transport ministries and authorities, via tad-tracker.eu, Tesla North and @fsdeurope. Updated '+f(d.eu_fsd_updated)+'.'
}

window.CFO_STATS.then(async d=>{
  try{await loadEuMap()}catch(e){console.error('eu-map',e)}
  [paintCybercabs,paintMembers,paintMileStrip,paintTexasMpd,paintCityShare,paintEuFsd].forEach(fn=>{
    try{fn(d)}catch(e){console.error('stats-ui',fn.name,e)}
  });
}).catch(()=>{const g=document.getElementById('growing');if(g)g.hidden=true});
