/* One fetch of data/cybercab-stats.json, then paint the remaining map widgets. */
window.CFO_STATS = window.CFO_STATS || fetch('data/cybercab-stats.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('stats');return r.json()});

async function loadEuMap(){
  if(document.getElementById('eu-map'))return;
  const host=document.getElementById('eu-map-host');
  if(!host)return;
  const r=await fetch('/img/eu-fsd-map.svg',{cache:'force-cache'});
  if(!r.ok)throw new Error('eu-map');
  host.innerHTML=await r.text();
}

function paintCityShare(d){
const C=d.city_share,$=i=>document.getElementById(i);if(!$('cities'))return;if(!C){$('cities').hidden=true;return}
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
const E=d.eu_fsd,$=i=>document.getElementById(i);if(!$('eu-fsd'))return;if(!E){$('eu-fsd').hidden=true;return}const by={};E.forEach(e=>by[e.iso]=e);document.querySelectorAll('#eu-map path').forEach(p=>{const e=by[p.dataset.iso];if(e)p.setAttribute('fill',e.status=='approved'?'#d4af6a':'#5e5038')});const A=E.filter(e=>e.status=='approved'),R=E.filter(e=>e.status!='approved');$('eu-n').textContent=A.length;const f=s=>s?new Date(s+'T12:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'date unclear';const row=(e,c)=>'<div style="display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #222"><span style="color:'+c+'">'+e.country+'</span><span style="color:#888;font-size:12px;text-align:right">'+f(e.date)+' · <a href="'+e.source+'" target="_blank" rel="noopener" style="color:#888">source</a></span></div>';$('eu-list').innerHTML='<div class="kicker" style="margin:0 0 6px">Allowed</div>'+A.map(e=>row(e,'#d4af6a')).join('')+'<div class="kicker" style="margin:22px 0 6px">Under review</div>'+R.map(e=>row(e,'#bbb')).join('');$('eu-next').textContent='Next: '+(d.eu_fsd_next||'')+'. A yes vote would allow it in all EU countries.';$('eu-src').textContent='Sources: RDW, national transport ministries and authorities, via tad-tracker.eu, Tesla North and @fsdeurope. Updated '+f(d.eu_fsd_updated)+'.'
}

window.CFO_STATS.then(async d=>{
  try{await loadEuMap()}catch(e){console.error('eu-map',e)}
  [paintCityShare,paintEuFsd].forEach(fn=>{
    try{fn(d)}catch(e){console.error('stats-ui',fn.name,e)}
  });
}).catch(()=>{});
