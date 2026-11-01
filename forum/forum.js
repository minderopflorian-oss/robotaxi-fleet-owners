import {firebaseConfig} from './config.js';
import {CATS,LEVELS,WEEKLY,COURSES,WELCOME,STARTERS} from './content.js';
import {demoStore,liveStore} from './store.js';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const linkify=s=>esc(s).replace(/https?:\/\/[^\s<]+/g,u=>`<a href="${u}" target="_blank" rel="nofollow ugc noopener">${u}</a>`);
const ago=t=>{if(!t)return'';const s=(Date.now()-t)/1e3;if(s<60)return'now';if(s<3600)return Math.floor(s/60)+'m';if(s<86400)return Math.floor(s/3600)+'h';if(s<86400*30)return Math.floor(s/86400)+'d';return new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short'})};
const ytThumb=s=>{const m=String(s).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([\w-]{11})/);return m?`https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`:''};
const okImg=u=>/^(https:\/\/[^\s"'<>]+|\/img\/[\w.-]+)\.(png|jpe?g|webp|gif)(\?[^\s"'<>]*)?$/i.test(u||'');
const catName=id=>(CATS.find(c=>c.id===id)||{name:id}).name;
const ICON={like:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 11v9H4v-9h3zm0 0 4-7a2 2 0 0 1 3 2l-1 4h5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7"/></svg>',
 cmt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v11H9l-5 4z"/></svg>',
 cal:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af6a" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'};

let S=null,st={posts:[],comments:[],profiles:[],admins:[],events:[]},U=null,cat='all',tab='community',calMonth=null,board='all',mq='';
const isAdmin=()=>U&&st.admins.includes(U.uid);
const me=()=>U&&st.profiles.find(p=>p.uid===U.uid);
const prof=uid=>st.profiles.find(p=>p.uid===uid)||{};

/* ---------- points & levels ---------- */
function points(since=0){
 const pts={};const add=(u,n=1)=>{if(u)pts[u]=(pts[u]||0)+n};
 st.posts.forEach(p=>{if(p.hidden)return;if(p.created>=since)add(p.uid);Object.entries(p.likes||{}).forEach(([u,t])=>{if(t>=since&&u!==p.uid)add(p.uid)})});
 st.comments.forEach(c=>{if(c.created>=since)add(c.uid);Object.entries(c.likes||{}).forEach(([u,t])=>{if(t>=since&&u!==c.uid)add(c.uid)})});
 return pts;
}
let PTS={};
const levelOf=uid=>{const p=PTS[uid]||0;let l=LEVELS[0];for(const x of LEVELS)if(p>=x.min)l=x;return l};
function av(uid,name,photo,size=40,badge=true){
 const w=(name||'?').replace(/[^\p{L}\p{N} ]/gu,'').trim().split(/\s+/).filter(Boolean),i=((w[0]||'?')[0]+(w.length>1?w[w.length-1][0]:'')).toUpperCase();
 const lv=badge&&uid?`<span class="lv">${levelOf(uid).n}</span>`:'';
 return `<span class="av" style="width:${size}px;height:${size}px;font-size:${Math.round(size*.38)}px" title="${esc(name)}">${photo?`<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer" loading="lazy">`:esc(i)}${lv}</span>`;
}
const teamBadge=uid=>st.admins.includes(uid)?'<span class="bad">Admin</span>':'';

/* ---------- boot ---------- */
async function boot(){
 const demo=!firebaseConfig||new URLSearchParams(location.search).has('preview');
 const emu=new URLSearchParams(location.search).has('emulator')&&/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
 S=emu?await liveStore({apiKey:'demo-key',projectId:'demo-forum',authDomain:'localhost',emulator:true}):demo?demoStore():await liveStore(firebaseConfig);
 $('demo').hidden=!S.demo;if(emu){$('demo').hidden=false;$('demo').textContent='Emulator test mode';}
 S.onAuth(async u=>{U=u;await refresh()});
 window.addEventListener('hashchange',route);
 $('write').onclick=()=>composer();$('write').onkeydown=e=>{if(e.key==='Enter')composer()};
 $('sidebtn').onclick=()=>U?profileForm():authForm();
 $('mclose').onclick=closeModal;$('modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
 document.querySelector('[data-go="start"]').onclick=e=>{e.preventDefault();location.hash='#classroom/start'};
 renderPills();
}
async function refresh(){
 try{st=await S.load()}catch(e){console.error(e);$('feed').innerHTML='<p class="muted">Could not load the forum . Please try again later .</p>'}
 PTS=points(0);render();
}
function render(){renderWho();renderSide();renderEvent();route()}
function route(){
 const h=location.hash.slice(1)||'community',[t,arg]=h.split('/');
 if(t==='post'){showTab('community');const p=st.posts.find(x=>x.id===arg);if(p)openPost(p);return}
 if(t==='start'){location.hash='#classroom/start';return}
 showTab(['community','classroom','calendar','members','map','leaderboards','about'].includes(t)?t:'community',arg);
}
function showTab(t,arg){window.scrollTo(0,0);
 tab=t;document.querySelectorAll('.ftabs a[data-tab]').forEach(a=>a.classList.toggle('on',a.dataset.tab===t));
 document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!=='v-'+t);
 ({community:renderFeed,classroom:()=>renderClassroom(arg),calendar:renderCalendar,members:renderMembers,map:renderMap,leaderboards:renderBoards,about:renderAbout})[t]();
}

/* ---------- header / sidebar ---------- */
function renderWho(){
 const m=me();
 $('who').innerHTML=U?`${av(U.uid,m?.name,m?.photo,28)}<button id="wprof">Profile</button><button id="wout">Sign out</button>`:`<button class="gold" id="win">Sign in</button>`;
 if(U){$('wprof').onclick=profileForm;$('wout').onclick=()=>S.signOut()}else $('win').onclick=authForm;
 $('meav').innerHTML=U?av(U.uid,m?.name,m?.photo,38):av('','?','',38,false);
 $('sidebtn').textContent=U?'Edit your profile':'Join the forum';
}
function renderSide(){
 const on=st.profiles.filter(p=>p.lastSeen&&Date.now()-p.lastSeen<5*60e3).length;
 $('smembers').textContent=st.profiles.length;$('sonline').textContent=Math.max(on,U?1:0);$('sadmins').textContent=st.admins.length;
 $('savs').innerHTML=[...st.profiles].sort((a,b)=>(b.lastSeen||0)-(a.lastSeen||0)).slice(0,8).map(p=>av(p.uid,p.name,p.photo,32,false)).join('');
}

/* ---------- calendar helpers ---------- */
function occurrences(from,to){
 const out=[];
 for(let d=new Date(from);d<to;d.setDate(d.getDate()+1)){
  WEEKLY.forEach(w=>{if(d.getDay()===w.dow){const [h,m]=w.time.split(':');const t=new Date(d);t.setHours(+h,+m,0,0);if(t>=from&&t<to)out.push({...w,start:+t,weekly:true})}});
 }
 st.events.forEach(e=>{if(e.start>=+from&&e.start<+to)out.push(e)});
 return out.sort((a,b)=>a.start-b.start);
}
function renderEvent(){
 const n=new Date(),nx=occurrences(n,new Date(+n+14*864e5))[0];
 if(!nx){$('eventline').innerHTML='';return}
 const s=(nx.start-Date.now())/1e3,when=s<3600?`in ${Math.max(1,Math.round(s/60))} minutes`:s<86400?`in ${Math.round(s/3600)} hours`:`in ${Math.round(s/86400)} days`;
 $('eventline').innerHTML=`${ICON.cal}<a href="#calendar"><b>${esc(nx.title)}</b> is happening ${when}</a>`;
}

/* ---------- community ---------- */
function renderPills(){
 const main=CATS.filter(c=>!c.more),more=CATS.filter(c=>c.more);
 const moreOn=more.some(c=>c.id===cat);
 $('pills').innerHTML=`<button class="pill ${cat==='all'?'on':''}" data-c="all">All</button>`+main.map(c=>`<button class="pill ${cat===c.id?'on':''}" data-c="${c.id}">${esc(c.name)}</button>`).join('')+
  (window._more||moreOn?more.map(c=>`<button class="pill ${cat===c.id?'on':''}" data-c="${c.id}">${esc(c.name)}</button>`).join(''):`<button class="pill" data-c="more">More…</button>`);
 $('pills').querySelectorAll('.pill').forEach(b=>b.onclick=()=>{if(b.dataset.c==='more'){window._more=1}else cat=b.dataset.c;renderPills();renderFeed()});
}
function renderFeed(){
 let ps=st.posts.filter(p=>(!p.hidden||isAdmin()||(U&&p.uid===U.uid))&&(cat==='all'||p.cat===cat));
 ps.sort((a,b)=>(b.pinned-a.pinned)||(Math.max(b.created,b.lastCommentAt||0)-Math.max(a.created,a.lastCommentAt||0)));
 if(!ps.length){$('feed').innerHTML=`<div class="card post"><p class="muted" style="margin:0">No posts here yet . Be the first : click Write something .</p>${isAdmin()&&!st.posts.length?'<div class="row"><button class="gbtn" id="seed">Add the welcome thread and starter posts</button></div>':''}</div>`;const sd=$('seed');if(sd)sd.onclick=seed;return}
 $('feed').innerHTML=ps.map(card).join('');
 $('feed').querySelectorAll('.post').forEach(el=>{const p=st.posts.find(x=>x.id===el.dataset.id);
  el.onclick=e=>{if(e.target.closest('.act[data-like]'))return;location.hash='#post/'+p.id};
  el.querySelector('[data-like]').onclick=e=>{e.stopPropagation();like(p)}});
}
function card(p){
 const th=okImg(p.img)?p.img:ytThumb(p.body);
 const liked=U&&p.likes&&p.likes[U.uid];
 return `<article class="post ${p.pinned?'pinned':''}" data-id="${p.id}" style="${p.hidden?'opacity:.45':''}">
 <div class="ph1">${av(p.uid,p.name,p.photo,42)}<div class="meta"><div class="n">${esc(p.name)}${teamBadge(p.uid)}</div><div class="s">${ago(p.created)} · ${esc(catName(p.cat))}${p.hidden?' · hidden':''}</div></div>${p.pinned?'<span class="pin">Pinned</span>':''}</div>
 <div class="pbody"><div class="ptxt"><h3>${esc(p.title)}</h3><p class="prev">${esc(p.body)}</p></div>${th?`<img class="thumb" src="${esc(th)}" alt="" loading="lazy">`:''}</div>
 <div class="pfoot"><button class="act ${liked?'on':''}" data-like aria-label="Like">${ICON.like}<span>${p.likeCount||0}</span></button><span class="act">${ICON.cmt}<span>${p.commentCount||0}</span></span>
 ${p.commenters?.length?`<span class="cav">${p.commenters.map(c=>av(c.u,c.n,c.p,26,false)).join('')}</span>`:''}${p.lastCommentAt?`<span class="last">Last comment ${ago(p.lastCommentAt)} ago</span>`:''}</div></article>`;
}
async function guard(){if(!U){authForm();return false}if(!U.verified){verifyNote();return false}return true}
async function like(p){if(!await guard())return;if(p.uid===U.uid){toast('You cannot like your own post .');return}try{await S.toggleLike(p)}catch(e){toast('Could not save your like .')}await refresh();if(location.hash==='#post/'+p.id)openPost(st.posts.find(x=>x.id===p.id))}
async function seed(){await S.createPost({...WELCOME,pinned:true});for(const s of STARTERS){await S.createPost(s)}await refresh()}

function openPost(p){
 const cs=st.comments.filter(c=>c.pid===p.id).sort((a,b)=>a.created-b.created);
 const liked=U&&p.likes&&p.likes[U.uid],th=okImg(p.img)?p.img:'',mine=U&&p.uid===U.uid;
 modal(`<div class="ph1">${av(p.uid,p.name,p.photo,44)}<div class="meta"><div class="n">${esc(p.name)}${teamBadge(p.uid)} <span class="muted" style="font-weight:400;font-size:13px">Level ${levelOf(p.uid).n} · ${esc(levelOf(p.uid).name)}</span></div><div class="s">${ago(p.created)} · ${esc(catName(p.cat))}</div></div></div>
 <h2>${esc(p.title)}</h2><div class="full">${linkify(p.body)}${th?`<img src="${esc(th)}" alt="">`:''}</div>
 <div class="pfoot"><button class="act ${liked?'on':''}" id="plike">${ICON.like}<span>${p.likeCount||0}</span></button><span class="act">${ICON.cmt}<span>${p.commentCount||0}</span></span>
 <button class="lnk" id="prep">Report</button>${mine?'<button class="lnk" id="pedit">Edit</button><button class="lnk" id="pdel">Delete</button>':''}</div>
 ${isAdmin()?`<div class="adm"><button data-m="pin">${p.pinned?'Unpin':'Pin'}</button><button data-m="hide">${p.hidden?'Unhide':'Hide'}</button><button data-m="lock">${p.locked?'Unlock comments':'Lock comments'}</button><button data-m="del">Delete</button>${p.uid!==U.uid?'<button data-m="ban">Ban author</button>':''}</div>`:''}
 <div class="cmts">${cs.map(c=>{const cl=U&&c.likes&&c.likes[U.uid];return `<div class="cmt" data-c="${c.id}">${av(c.uid,c.name,c.photo,34)}<div class="cb"><div class="cn">${esc(c.name)}${teamBadge(c.uid)} <span class="muted" style="font-weight:400;font-size:12px">${ago(c.created)}</span></div><div class="ct">${linkify(c.body)}</div><div class="cf"><button class="act ${cl?'on':''}" data-cl>${ICON.like}<span>${c.likeCount||0}</span></button>${(U&&c.uid===U.uid)||isAdmin()?'<button class="lnk" data-cd>Delete</button>':'<button class="lnk" data-cr>Report</button>'}</div></div></div>`}).join('')||'<p class="muted">No comments yet .</p>'}
 ${p.locked?'<p class="muted">Comments are closed .</p>':`<div class="cbox"><textarea id="ctext" maxlength="2000" placeholder="${U?'Your comment':'Sign in to comment'}"></textarea><button id="csend">Comment</button></div><div class="err" id="cerr"></div>`}</div>`);
 $('plike').onclick=()=>like(p);
 $('prep').onclick=()=>report({postId:p.id});
 if(mine){$('pedit').onclick=()=>composer(p);$('pdel').onclick=async()=>{if(confirm('Delete this post ?')){await S.mod(p.id,{delete:true});closeModal();await refresh()}}}
 document.querySelectorAll('.adm [data-m]').forEach(b=>b.onclick=async()=>{const m=b.dataset.m;
  if(m==='del'&&!confirm('Delete this post ?'))return;if(m==='ban'&&!confirm('Ban this member from posting ?'))return;
  if(m==='ban')await S.ban(p.uid);else await S.mod(p.id,m==='pin'?{pinned:!p.pinned}:m==='hide'?{hidden:!p.hidden}:m==='lock'?{locked:!p.locked}:{delete:true});
  await refresh();if(m==='del')closeModal();else openPost(st.posts.find(x=>x.id===p.id))});
 document.querySelectorAll('.cmt').forEach(el=>{const c=cs.find(x=>x.id===el.dataset.c);
  el.querySelector('[data-cl]').onclick=async()=>{if(!await guard())return;if(c.uid===U.uid){toast('You cannot like your own comment .');return}await S.toggleCommentLike(c);await refresh();openPost(st.posts.find(x=>x.id===p.id))};
  const d=el.querySelector('[data-cd]');if(d)d.onclick=async()=>{if(confirm('Delete this comment ?')){await S.deleteComment(c);await refresh();openPost(st.posts.find(x=>x.id===p.id))}};
  const r=el.querySelector('[data-cr]');if(r)r.onclick=()=>report({postId:p.id,commentId:c.id})});
 const send=$('csend');if(send)send.onclick=async()=>{if(!await guard())return;const t=$('ctext').value.trim();if(!t)return;send.disabled=true;
  try{await S.addComment(p,t);await refresh();openPost(st.posts.find(x=>x.id===p.id))}catch(e){$('cerr').textContent='Could not post your comment . Wait a few seconds between comments and try again .';send.disabled=false}};
}
function composer(p){
 if(!U){authForm();return}if(!U.verified){verifyNote();return}
 modal(`<h2>${p?'Edit post':'Write something'}</h2><div class="f">
 <label>Category</label><select id="fc">${CATS.map(c=>`<option value="${c.id}" ${(p?p.cat:(cat!=='all'?cat:'intros'))===c.id?'selected':''}>${esc(c.full)}</option>`).join('')}</select>
 <label>Title</label><input id="ft" maxlength="140" value="${esc(p?.title)}" placeholder="Give your post a clear title">
 <label>Post</label><textarea id="fb" maxlength="5000" placeholder="Share your plan , question or win . No financial advice , no promises of returns , no personal data .">${esc(p?.body)}</textarea>
 <label>Image link (optional , https , png / jpg / webp)</label><input id="fi" maxlength="400" value="${esc(p?.img)}" placeholder="https://…">
 <div class="row"><button class="gbtn" id="fs">${p?'Save':'Post'}</button><span class="tiny">YouTube links get a thumbnail automatically .</span></div><div class="err" id="fe"></div></div>`);
 $('fs').onclick=async()=>{const o={cat:$('fc').value,title:$('ft').value.trim(),body:$('fb').value.trim(),img:$('fi').value.trim()};
  if(o.title.length<3)return $('fe').textContent='Add a title of at least 3 characters .';
  if(!o.body)return $('fe').textContent='Write something first .';
  if(o.img&&!okImg(o.img))return $('fe').textContent='The image link must start with https:// and end in .png , .jpg , .webp or .gif .';
  if((o.body.match(/https?:\/\//g)||[]).length>3)return $('fe').textContent='Please keep it to 3 links or fewer .';
  $('fs').disabled=true;
  try{p?await S.editPost(p.id,o):await S.createPost(o);closeModal();await refresh()}catch(e){console.error(e);$('fe').textContent='Could not post . New members can post once a minute . Try again shortly .';$('fs').disabled=false}};
}
async function report(o){if(!U){authForm();return}const r=prompt('What is wrong with this post or comment ?');if(r===null)return;await S.report({...o,reason:r.slice(0,500)});toast('Thanks . A moderator will take a look .')}

/* ---------- classroom ---------- */
function renderClassroom(id){
 const done=new Set(me()?.done||[]),el=$('v-classroom');
 const pct=c=>Math.round(100*c.lessons.filter(l=>done.has(l.id)).length/c.lessons.length);
 const c=COURSES.find(x=>x.id===id);
 if(!c){el.innerHTML=`<div class="vhead"><h2>Classroom</h2><span class="muted">${U?'Your progress is saved to your profile .':'Sign in to track your progress .'}</span></div><div class="grid">${COURSES.map(c=>`<div class="card course" data-c="${c.id}"><div class="cov">${c.cover?`<img src="${c.cover}" alt="">`:'<img src="/img/forum-emblem.png" alt="">'}</div><div class="cb"><h4>${esc(c.title)}</h4><p>${esc(c.desc)}</p><div class="bar"><i style="width:${pct(c)}%"></i></div><div class="pct">${pct(c)}% · ${c.lessons.length} lessons</div></div></div>`).join('')}</div>`;
  el.querySelectorAll('.course').forEach(x=>x.onclick=()=>location.hash='#classroom/'+x.dataset.c);return}
 el.innerHTML=`<p><a href="#classroom">← Classroom</a></p><div class="card" style="padding:20px"><h2>${esc(c.title)}</h2><p class="muted">${esc(c.desc)}</p><div class="bar"><i style="width:${pct(c)}%"></i></div><div class="pct">${pct(c)}% complete</div>
 <ul class="lessons">${c.lessons.map((l,i)=>`<li><button class="chk ${done.has(l.id)?'on':''}" data-l="${l.id}" aria-label="Mark as done">${done.has(l.id)?'✓':''}</button><div><div class="lt">${i+1} . ${esc(l.t)}</div><div class="ld">${esc(l.d)} ${l.url?`<a href="${esc(l.url)}" ${l.url.startsWith('http')?'target="_blank" rel="noopener"':''}>Open</a>`:l.go?`<a href="#" data-go="${l.go}">Open</a>`:''}</div></div></li>`).join('')}</ul></div>`;
 el.querySelectorAll('.chk').forEach(b=>b.onclick=async()=>{if(!U){authForm();return}await S.setDone(b.dataset.l,!done.has(b.dataset.l));await refresh()});
 el.querySelectorAll('[data-go]').forEach(a=>a.onclick=e=>{e.preventDefault();const g=a.dataset.go;
  if(g==='welcome'){const w=st.posts.find(p=>p.pinned);location.hash=w?'#post/'+w.id:'#community'}
  else if(g==='profile'){U?profileForm():authForm()}
  else{cat=g==='intro'?'intros':g;renderPills();location.hash='#community';composer()}});
}

/* ---------- calendar ---------- */
function renderCalendar(){
 const n=new Date();calMonth=calMonth||new Date(n.getFullYear(),n.getMonth(),1);
 const y=calMonth.getFullYear(),m=calMonth.getMonth(),first=new Date(y,m,1),start=new Date(first);start.setDate(1-((first.getDay()+6)%7));
 const end=new Date(start);end.setDate(start.getDate()+42);
 const ev=occurrences(start,end),cells=[];
 for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const de=ev.filter(e=>new Date(e.start).toDateString()===d.toDateString());
  cells.push(`<td class="${d.toDateString()===n.toDateString()?'today':''}" style="${d.getMonth()!==m?'opacity:.35':''}"><span class="d">${d.getDate()}</span>${de.map(e=>`<span class="ev" title="${esc(e.title)}">${esc(new Date(e.start).toTimeString().slice(0,5))} ${esc(e.title)}</span>`).join('')}</td>`)}
 const up=occurrences(n,new Date(+n+21*864e5)).slice(0,8);
 $('v-calendar').innerHTML=`<div class="vhead"><h2>Calendar</h2><div class="calnav"><button id="cp">‹</button><b>${first.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</b><button id="cn">›</button></div></div>
 <div class="card" style="padding:10px;overflow:auto"><table class="cal"><tr>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<th>${d}</th>`).join('')}</tr>${[0,1,2,3,4,5].map(r=>'<tr>'+cells.slice(r*7,r*7+7).join('')+'</tr>').join('')}</table></div>
 <h3 style="margin:24px 0 12px;font-weight:500">Upcoming</h3>${up.map(e=>{const d=new Date(e.start);return `<div class="card evrow"><div class="dt"><span>${d.toLocaleDateString('en-GB',{weekday:'short'}).toUpperCase()}</span><b>${d.getDate()}</b></div><div style="flex:1"><h4>${esc(e.title)}</h4><p>${d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} Amsterdam time · ${esc(e.desc||'')} ${e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener">Open</a>`:''}</p></div>${isAdmin()&&!e.weekly?`<button class="lnk" data-del="${e.id}">Remove</button>`:''}</div>`}).join('')}
 ${isAdmin()?`<div class="card f" style="padding:18px;margin-top:18px"><h3 style="margin:0">Add an event</h3><label>Title</label><input id="et" maxlength="100" placeholder="X Space : depot planning Q&A"><label>Date and time (your local time)</label><input id="ed" type="datetime-local"><label>Short description</label><input id="ex" maxlength="200"><label>Link (X Space , YouTube live , etc.)</label><input id="eu" maxlength="300" placeholder="https://x.com/i/spaces/…"><div class="row"><button class="gbtn" id="es">Add event</button></div></div>`:'<p class="tiny">Weekly threads run on X and here . Live sessions such as X Spaces appear here when they are scheduled .</p>'}`;
 $('cp').onclick=()=>{calMonth=new Date(y,m-1,1);renderCalendar()};$('cn').onclick=()=>{calMonth=new Date(y,m+1,1);renderCalendar()};
 document.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{await S.deleteEvent(b.dataset.del);await refresh()});
 const es=$('es');if(es)es.onclick=async()=>{const t=$('et').value.trim(),d=$('ed').value;if(!t||!d)return toast('Add a title and a date .');const u=$('eu').value.trim();await S.addEvent({title:t,start:+new Date(d),desc:$('ex').value.trim(),url:/^https:\/\//.test(u)?u:''});await refresh()};
}

/* ---------- members ---------- */
function renderMembers(){
 const on=p=>p.lastSeen&&Date.now()-p.lastSeen<5*60e3;
 let ms=st.profiles.filter(p=>!mq||(p.name+' '+p.city+' '+p.plan).toLowerCase().includes(mq.toLowerCase()));
 ms.sort((a,b)=>(PTS[b.uid]||0)-(PTS[a.uid]||0)||(b.joined||0)-(a.joined||0));
 $('v-members').innerHTML=`<div class="vhead"><h2>Members <span class="muted" style="font-size:16px">${st.profiles.length}</span></h2><input class="search" id="mq" placeholder="Search name , city or plan" value="${esc(mq)}"></div>
 ${ms.map(p=>{const l=levelOf(p.uid);return `<div class="card mrow">${av(p.uid,p.name,p.photo,52)}<div class="mi"><div class="mn">${esc(p.name)}${teamBadge(p.uid)} <span class="muted" style="font-weight:400;font-size:13px">Level ${l.n} · ${esc(l.name)}</span></div><div class="mc">${p.city?esc(p.city)+' · ':''}Joined ${p.joined?new Date(p.joined).toLocaleDateString('en-GB',{month:'short',year:'numeric'}):''} ${on(p)?'· <span class="on">● Online</span>':''}</div>${p.plan?`<div class="mp">Fleet plan : ${esc(p.plan)}</div>`:''}${p.bio?`<div class="mc">${esc(p.bio)}</div>`:''}</div><div class="muted" style="font-size:13px;text-align:right"><b style="color:var(--g2);font-size:16px">${PTS[p.uid]||0}</b><br>points</div></div>`}).join('')}`;
 const q=$('mq');q.oninput=()=>{mq=q.value;renderMembers();const n=$('mq');n.focus();n.setSelectionRange(n.value.length,n.value.length)};
}

/* ---------- map ---------- */
let MAP=null,PLACES=null;
async function places(){if(PLACES)return PLACES;const [a,b]=await Promise.all([fetch('/data/fleet-map.json').then(r=>r.json()).catch(()=>[]),fetch('/data/community-members.json').then(r=>r.json()).catch(()=>[])]);PLACES={fleet:a,members:b};return PLACES}
async function renderMap(){
 const d=await places();
 if(!MAP){MAP=L.map('fmap',{worldCopyJump:true}).setView([35,-30],2);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}).addTo(MAP)}
 setTimeout(()=>MAP.invalidateSize(),50);
 if(MAP._lay)MAP._lay.clearLayers();MAP._lay=L.layerGroup().addTo(MAP);
 const g={};d.members.forEach(x=>{const k=x.lat+','+x.lon;(g[k]=g[k]||{...x,n:0}).n++});
 Object.values(g).forEach(c=>L.circleMarker([c.lat,c.lon],{radius:Math.min(3+Math.sqrt(c.n)*2,12),color:'#777',weight:1,fillColor:'#777',fillOpacity:.45}).addTo(MAP._lay).bindPopup(`<b>${esc(c.place)}</b><br>${c.n} X Community member${c.n>1?'s':''}`));
 d.fleet.forEach(x=>L.circleMarker([x.lat,x.lon],{radius:6,color:'#000',weight:1,fillColor:'#c9a54c',fillOpacity:.95}).addTo(MAP._lay).bindPopup(`<b>${esc(x.handle)}</b><br>${esc(x.place)}${x.fleet?'<br>Fleet : '+esc(x.fleet):''}`));
 const fm=st.profiles.filter(p=>typeof p.lat==='number');
 fm.forEach(p=>L.circleMarker([p.lat,p.lon],{radius:8,color:'#d4af6a',weight:2,fillColor:'#fff',fillOpacity:1}).addTo(MAP._lay).bindPopup(`<b>${esc(p.name)}</b><br>${esc(p.city)}${p.plan?'<br>Fleet plan : '+esc(p.plan):''}<br>Level ${levelOf(p.uid).n}`));
 $('mapcount').textContent=`${fm.length} forum members · ${d.fleet.length} fleet plans · ${d.members.length} X members`;
}
async function geocode(city){
 const d=await places(),k=city.toLowerCase().trim();
 const hit=[...d.fleet,...d.members].find(x=>x.place.toLowerCase()===k||x.place.toLowerCase().split(',')[0]===k.split(',')[0]);
 if(hit)return{lat:hit.lat,lon:hit.lon};
 try{const r=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&featuretype=city&q='+encodeURIComponent(city)).then(r=>r.json());if(r[0])return{lat:Math.round(+r[0].lat*100)/100,lon:Math.round(+r[0].lon*100)/100}}catch(e){}
 return null;
}

/* ---------- leaderboards ---------- */
function renderBoards(){
 const D=864e5,mk=(t,since)=>{const p=points(since);const rows=Object.entries(p).sort((a,b)=>b[1]-a[1]).slice(0,10);
  return `<div class="card board"><h4>${t}</h4><ol>${rows.map(([u,n],i)=>{const q=prof(u);return `<li><span class="rk">${i+1}</span>${av(u,q.name,q.photo,30)}<span class="bn">${esc(q.name||'Member')}</span><span class="bp">+${n}</span></li>`}).join('')||'<li class="muted">No points yet</li>'}</ol></div>`};
 const my=U?levelOf(U.uid):null,cnt=l=>st.profiles.filter(p=>levelOf(p.uid).n===l.n).length,tot=st.profiles.length||1;
 const nxt=my&&LEVELS.find(l=>l.min>(PTS[U.uid]||0));
 $('v-leaderboards').innerHTML=`<div class="vhead"><h2>Leaderboards</h2><span class="muted">${U?`You : level ${my.n} · ${PTS[U.uid]||0} points${nxt?` · ${nxt.min-(PTS[U.uid]||0)} to level ${nxt.n}`:''}`:'Sign in to see your level'}</span></div>
 <div class="card levels">${LEVELS.map(l=>`<div><span class="lvn ${my&&my.n===l.n?'me':''}">${l.n}</span><span>Level ${l.n} · ${esc(l.name)}<small>${l.min} points · ${Math.round(100*cnt(l)/tot)}% of members</small></span></div>`).join('')}</div>
 <div class="boards">${mk('Last 7 days',Date.now()-7*D)}${mk('Last 30 days',Date.now()-30*D)}${mk('All time',0)}</div>
 <p class="tiny" style="margin-top:14px">Points : 1 for each post , 1 for each comment and 1 for each like your posts and comments receive from other members .</p>`;
}

/* ---------- about ---------- */
function renderAbout(){
 $('v-about').innerHTML=`<div class="card about"><img src="/img/forum-emblem.png" alt="" style="width:120px;border-radius:12px;float:right;margin:0 0 10px 16px"><h3>Cybercab Fleet Owners forum</h3>
 <p>The home base of the Tesla Cybercab Fleet Owners community . Future robotaxi fleet owners meet here to share their city and plan , work through the guides and help each other with hubs , charging , insurance and operations .</p>
 <p><b>${st.profiles.length}</b> forum members · <b>${st.posts.filter(p=>!p.hidden).length}</b> posts · Free to join with Google or email . The community on X stays open too : <a href="https://x.com/i/communities/1912893645050511710" target="_blank" rel="noopener">join the X Community</a> .</p>
 <h3 style="margin-top:20px">House rules</h3><ul><li>Be respectful . Debate ideas , not people .</li><li>No financial advice and no promises of returns .</li><li>No spam , no selling and no self-promotion .</li><li>Keep personal data out : no phone numbers , addresses or ID details .</li><li>Post in the right category . Off-topic is for everything else .</li></ul>
 <h3 style="margin-top:20px">Moderation</h3><p>Moderators can pin , hide , lock or remove posts and block members who break the rules . Use Report on any post or comment . New members can post once a minute .</p>
 <h3 style="margin-top:20px">Privacy</h3><p>We store your display name , profile photo , the city and plan you choose to share , and your posts . Your email address is used only to sign in and is never shown . Ask a moderator to delete your account and posts at any time .</p>
 <p class="tiny">Independent community , not affiliated with Tesla , Inc . Nothing in this forum is financial advice .</p></div>`;
}

/* ---------- auth & profile ---------- */
function authForm(){
 modal(`<h2>Join the forum</h2><p class="muted">Free . Sign in to post , like , comment and track your progress .</p>
 <button class="gsi" id="ag"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>Continue with Google</button>
 <div class="or">or with email</div><div class="f"><label>Name (shown to members)</label><input id="an" maxlength="40" placeholder="Only needed for a new account"><label>Email</label><input id="ae" type="email" autocomplete="email"><label>Password</label><input id="ap" type="password" autocomplete="current-password" minlength="8">
 <div class="row"><button class="gbtn" id="ai">Sign in</button><button class="gbtn o" id="au">Create account</button><button class="lnk" id="ar">Forgot password</button></div><div class="err" id="aerr"></div></div>
 <p class="tiny">By joining you accept the house rules . We never show your email address .</p>`);
 const err=t=>$('aerr').textContent=t,msg=e=>(e.code||'').replace('auth/','').replace(/-/g,' ')||'something went wrong';
 $('ag').onclick=async()=>{try{await S.signInGoogle();closeModal()}catch(e){err('Google sign-in failed : '+msg(e))}};
 $('ai').onclick=async()=>{try{await S.signInEmail($('ae').value.trim(),$('ap').value);closeModal()}catch(e){err('Sign-in failed : '+msg(e))}};
 $('au').onclick=async()=>{const n=$('an').value.trim();if(n.length<2)return err('Add your name first .');if($('ap').value.length<8)return err('Use a password of at least 8 characters .');
  try{await S.signUpEmail(n,$('ae').value.trim(),$('ap').value);if(S.demo)closeModal();else modal('<h2>Check your email</h2><p>We sent you a link to confirm your address . After you click it , come back and press Continue .</p><div class="row"><button class="gbtn" id="vc">Continue</button></div>'),$('vc').onclick=async()=>{await S.refreshUser();closeModal()}}catch(e){err('Could not create the account : '+msg(e))}};
 $('ar').onclick=async()=>{const e=$('ae').value.trim();if(!e)return err('Enter your email first .');try{await S.resetPw(e);err('Check your email for a reset link .')}catch(x){err('Could not send the reset email .')}};
}
function verifyNote(){modal('<h2>Confirm your email</h2><p>Click the link we emailed you , then press Continue . Google sign-in skips this step .</p><div class="row"><button class="gbtn" id="vc">Continue</button><button class="gbtn o" id="vr">Send the link again</button></div>');$('vc').onclick=async()=>{await S.refreshUser();closeModal()};$('vr').onclick=async()=>{await S.resendVerify();toast('Sent .')}}
function profileForm(){
 const p=me()||{};
 modal(`<h2>Your profile</h2><div class="f"><label>Name</label><input id="pn" maxlength="40" value="${esc(p.name)}"><label>City (shown on the map at city level)</label><input id="pc" maxlength="60" value="${esc(p.city)}" placeholder="e.g. Austin, TX"><label>Fleet plan</label><input id="pp" maxlength="120" value="${esc(p.plan)}" placeholder="e.g. 2 cars in 2027 , then a small depot"><label>About you</label><textarea id="pb" maxlength="280" style="min-height:80px">${esc(p.bio)}</textarea>
 <div class="row"><button class="gbtn" id="ps">Save</button>${S.demo?'<button class="lnk" id="preset">Reset preview data</button>':''}</div><div class="err" id="perr"></div></div>`);
 if(S.demo)$('preset').onclick=()=>S.reset();
 $('ps').onclick=async()=>{const o={name:$('pn').value.trim().slice(0,40),city:$('pc').value.trim(),plan:$('pp').value.trim(),bio:$('pb').value.trim()};if(o.name.length<2)return $('perr').textContent='Add a name .';
  $('ps').disabled=true;if(o.city&&o.city!==p.city){const g=await geocode(o.city);if(g){o.lat=g.lat;o.lon=g.lon}}else if(!o.city){o.lat=null;o.lon=null}
  try{await S.saveProfile(o);closeModal();await refresh()}catch(e){$('perr').textContent='Could not save .';$('ps').disabled=false}};
}

/* ---------- modal & toast ---------- */
function modal(h){$('mbody').innerHTML=h;$('modal').hidden=false;document.body.style.overflow='hidden'}
function closeModal(){if($('modal').hidden)return;$('modal').hidden=true;document.body.style.overflow='';if(location.hash.startsWith('#post/'))history.replaceState(null,'','#community')}
function toast(t){const d=document.createElement('div');d.textContent=t;d.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111;border:1px solid #d4af6a;color:#fff;padding:10px 18px;border-radius:10px;z-index:200;font-size:14px';document.body.appendChild(d);setTimeout(()=>d.remove(),3000)}

boot();
