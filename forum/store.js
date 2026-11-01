// Data layer. Live = Firebase (Auth + Firestore, free Spark plan). Demo = localStorage preview.
import {WELCOME,STARTERS} from './content.js';
const now=()=>Date.now();
const rid=()=>Math.random().toString(36).slice(2,12);
const ms=v=>v&&v.toMillis?v.toMillis():(typeof v==='number'?v:0);

/* ---------------- Demo (preview) ---------------- */
export function demoStore(){
 const KEY='cfo-forum-preview-v1';
 let db=JSON.parse(localStorage.getItem(KEY)||'null');
 if(!db){
  const H=3600e3,D=24*H,t=now();
  const team={uid:'team',name:'Cybercab Fleet Owners',photo:'/img/forum-avatar-team.png',city:'',plan:'',bio:'Team account',joined:t-40*D,lastSeen:t};
  const S=[['s1','Sample member A','Bordeaux, France',44.84,-0.58,'1 car , then 2 to 4'],['s2','Sample member B','Denver, CO',39.74,-104.99,'Start with 1 , then grow'],['s3','Sample member C','Zoetermeer, Netherlands',52.06,4.49,'3 cars in 2027']]
   .map(([uid,name,city,lat,lon,plan],i)=>({uid,name,photo:'',city,lat,lon,plan,bio:'Sample profile shown in preview mode only .',joined:t-(10+i)*D,lastSeen:t-(i?3*H:60e3)}));
  const posts=[],comments=[];
  const mk=(o,ago,uid='team')=>{const p={id:rid(),uid,name:uid==='team'?team.name:S.find(s=>s.uid===uid).name,photo:uid==='team'?team.photo:'',img:'',pinned:false,hidden:false,locked:false,likes:{},likeCount:0,commentCount:0,commenters:[],lastCommentAt:0,created:t-ago,...o};posts.push(p);return p};
  const w=mk({...WELCOME,pinned:true},3*D);
  const st=STARTERS.map((s,i)=>mk(s,(2-i*.35)*D));
  const cm=(p,uid,body,ago)=>{const u=S.find(s=>s.uid===uid);comments.push({id:rid(),pid:p.id,uid,name:u.name,photo:'',body,created:t-ago,likes:{},likeCount:0});p.commentCount++;p.lastCommentAt=Math.max(p.lastCommentAt,t-ago);p.commenters=[{u:uid,n:u.name,p:''},...p.commenters.filter(c=>c.u!==uid)].slice(0,5)};
  cm(st[0],'s1','Hi all : Bordeaux here . Planning one car first , then two to four more once the numbers are clear .',20*H);
  cm(st[0],'s2','Denver . Starting with one and learning as I go .',9*H);
  cm(st[0],'s3','Zoetermeer , Netherlands . Waiting for EU approval but planning a small depot already .',2*H);
  cm(st[2],'s3','Grid capacity is the hard part in NL . Looking at a shared depot with flexible contract .',5*H);
  cm(w,'s2','Thanks , clear rules .',30*H);
  const like=(p,uid,ago)=>{p.likes[uid]=t-ago;p.likeCount++};
  like(w,'s1',D);like(w,'s2',20*H);like(w,'s3',4*H);like(st[0],'s1',10*H);like(st[0],'s3',3*H);like(st[2],'s2',6*H);like(st[4],'s1',5*H);like(st[4],'s2',2*H);like(st[4],'s3',H);
  w.img='/img/forum-emblem.png';
  const sp=mk({cat:'wins',title:'Win : picked my city and booked a meeting with a parking garage',body:'Small step , but the garage owner is open to a few charging spots for robotaxis . Next : ask about grid capacity .'},6*H,'s1');
  like(sp,'s2',4*H);like(sp,'s3',2*H);
  const priv={};[[S[0],72,'Preparing',['insurance','charging','team']],[S[1],38,'Exploring',['permits','depot','insurance']],[S[2],55,'Planning',['charging','permits','funding']]].forEach(([p,sc,lv,wk],i)=>{p.ready=sc;p.readyLevel=lv;p.readyAt=t-(i+1)*H*5;priv[p.uid]={score:sc,level:lv,weak:wk,answers:{},at:p.readyAt}});
  db={posts,comments,profiles:[team,...S],admins:['team'],events:[],me:null,priv,scen:[]};
  localStorage.setItem(KEY,JSON.stringify(db));
 }
 const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
 const me=()=>db.me&&db.profiles.find(p=>p.uid===db.me);
 let cb=()=>{};
 const api={
  demo:true,
  onAuth(f){cb=f;setTimeout(()=>f(me()?{uid:db.me,verified:true}:null),0)},
  async signInGoogle(){return api._login('You (preview)')},
  async signInEmail(e){return api._login(e.split('@')[0])},
  async signUpEmail(n){return api._login(n)},
  async resetPw(){},async resendVerify(){},async refreshUser(){},
  async _login(name){let p=db.profiles.find(x=>x.uid==='me');if(!p){p={uid:'me',name,photo:'',city:'',plan:'',bio:'',joined:now(),lastSeen:now(),done:[]};db.profiles.push(p)}db.me='me';db.admins.includes('me')||db.admins.push('me');save();cb({uid:'me',verified:true})},
  async signOut(){db.me=null;save();cb(null)},
  async load(){const p=me();if(p){p.lastSeen=now();save()}return JSON.parse(JSON.stringify({posts:db.posts,comments:db.comments,profiles:db.profiles,admins:db.admins,events:db.events}))},
  async createPost(o){const p=me();db.posts.push({id:rid(),uid:p.uid,name:p.name,photo:p.photo,cat:o.cat,title:o.title,body:o.body,img:o.img||'',pinned:!!o.pinned,hidden:false,locked:false,likes:{},likeCount:0,commentCount:0,commenters:[],lastCommentAt:0,created:now()});save()},
  async editPost(id,o){Object.assign(db.posts.find(p=>p.id===id),o,{edited:now()});save()},
  async toggleLike(post){const p=db.posts.find(x=>x.id===post.id),u=db.me;if(p.likes[u]){delete p.likes[u];p.likeCount--}else{p.likes[u]=now();p.likeCount++}save()},
  async toggleCommentLike(c){const x=db.comments.find(y=>y.id===c.id),u=db.me;if(x.likes[u]){delete x.likes[u];x.likeCount--}else{x.likes[u]=now();x.likeCount++}save()},
  async addComment(post,body){const p=db.posts.find(x=>x.id===post.id),m=me();db.comments.push({id:rid(),pid:p.id,uid:m.uid,name:m.name,photo:m.photo,body,created:now(),likes:{},likeCount:0});p.commentCount++;p.lastCommentAt=now();p.commenters=[{u:m.uid,n:m.name,p:m.photo},...p.commenters.filter(c=>c.u!==m.uid)].slice(0,5);save()},
  async deleteComment(c){db.comments=db.comments.filter(x=>x.id!==c.id);save()},
  async mod(id,o){if(o.delete)db.posts=db.posts.filter(p=>p.id!==id);else Object.assign(db.posts.find(p=>p.id===id),o);save()},
  async saveProfile(o){Object.assign(me(),o);save()},
  async setDone(lid,on){const p=me();p.done=p.done||[];p.done=on?[...new Set([...p.done,lid])]:p.done.filter(x=>x!==lid);save()},
  async addEvent(e){db.events.push({id:rid(),...e});save()},
  async deleteEvent(id){db.events=db.events.filter(e=>e.id!==id);save()},
  async report(){},async ban(){},
  async saveReadiness(r){const p=me();db.priv=db.priv||{};db.priv[p.uid]={...r,at:now()};p.ready=r.score;p.readyLevel=r.level;p.readyAt=now();save()},
  async getReadiness(){return (db.priv||{})[db.me]||null},
  async adminReadiness(){return Object.entries(db.priv||{}).map(([uid,r])=>({uid,...r}))},
  async listScenarios(){return (db.scen||[]).filter(x=>x.uid===db.me).sort((a,b)=>b.at-a.at)},
  async saveScenario(o){db.scen=db.scen||[];db.scen.push({id:rid(),uid:db.me,...o,at:now()});save()},
  async deleteScenario(id){db.scen=(db.scen||[]).filter(x=>x.id!==id);save()},
  reset(){localStorage.removeItem(KEY);location.reload()}
 };
 return api;
}

/* ---------------- Live (Firebase Spark, free) ---------------- */
export async function liveStore(cfg){
 const V='10.14.1',B=`https://www.gstatic.com/firebasejs/${V}/`;
 const {initializeApp}=await import(B+'firebase-app.js');
 const A=await import(B+'firebase-auth.js');
 const F=await import(B+'firebase-firestore.js');
 const app=initializeApp(cfg),auth=A.getAuth(app),db=F.getFirestore(app);
 if(cfg.emulator){A.connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});F.connectFirestoreEmulator(db,'127.0.0.1',8080)}
 const {doc,collection,getDocs,getDoc,setDoc,updateDoc,deleteDoc,addDoc,query,orderBy,limit,writeBatch,serverTimestamp:ts,increment,deleteField,collectionGroup,arrayUnion,arrayRemove}=F;
 let user=null,cb=()=>{};
 const conv=d=>{const o={id:d.id,...d.data()};for(const k of ['created','lastCommentAt','joined','lastSeen','lastPostAt','edited','start','readyAt','at'])if(o[k])o[k]=ms(o[k]);if(o.likes)for(const k in o.likes)o.likes[k]=ms(o.likes[k]);return o};
 const profRef=()=>doc(db,'profiles',user.uid);
 A.onAuthStateChanged(auth,async u=>{
  user=u;
  if(u){try{const r=profRef(),s=await getDoc(r);
   if(!s.exists())await setDoc(r,{name:(u.displayName||(u.email||'member').split('@')[0]).slice(0,40),photo:u.photoURL||'',city:'',plan:'',bio:'',joined:ts(),lastSeen:ts(),done:[]});
   else await updateDoc(r,{lastSeen:ts()});
  }catch(e){/* profile already created by a parallel auth event */}}
  cb(u?{uid:u.uid,verified:u.emailVerified,email:u.email}:null);
 });
 setInterval(()=>{if(user)updateDoc(profRef(),{lastSeen:ts()}).catch(()=>{})},240e3);
 const me=async()=>conv(await getDoc(profRef()));
 return {
  demo:false,
  onAuth(f){cb=f},
  async signInGoogle(){await A.signInWithPopup(auth,new A.GoogleAuthProvider())},
  async signInEmail(e,p){await A.signInWithEmailAndPassword(auth,e,p)},
  async signUpEmail(n,e,p){const c=await A.createUserWithEmailAndPassword(auth,e,p);await A.updateProfile(c.user,{displayName:n});await A.sendEmailVerification(c.user,{url:location.origin+'/forum/'});for(let i=0;i<6;i++){try{await updateDoc(doc(db,'profiles',c.user.uid),{name:n.slice(0,40)});break}catch(e){await new Promise(r=>setTimeout(r,700))}}},
  async resetPw(e){await A.sendPasswordResetEmail(auth,e)},
  async resendVerify(){await A.sendEmailVerification(auth.currentUser,{url:location.origin+'/forum/'})},
  async refreshUser(){await auth.currentUser.reload();await auth.currentUser.getIdToken(true);cb({uid:auth.currentUser.uid,verified:auth.currentUser.emailVerified,email:auth.currentUser.email})},
  async signOut(){await A.signOut(auth)},
  async load(){
   const [p,c,pr,ad,ev]=await Promise.all([
    getDocs(query(collection(db,'posts'),orderBy('created','desc'),limit(300))),
    getDocs(query(collectionGroup(db,'comments'),limit(2000))),
    getDocs(query(collection(db,'profiles'),limit(2000))),
    getDocs(collection(db,'admins')),
    getDocs(collection(db,'events'))]);
   return {posts:p.docs.map(conv),comments:c.docs.map(conv),profiles:pr.docs.map(d=>({uid:d.id,...conv(d)})),admins:ad.docs.map(d=>d.id),events:ev.docs.map(conv)};
  },
  async createPost(o){const m=await me(),b=writeBatch(db),r=doc(collection(db,'posts'));
   b.set(r,{uid:user.uid,name:m.name,photo:m.photo||'',cat:o.cat,title:o.title,body:o.body,img:o.img||'',pinned:!!o.pinned,hidden:false,locked:false,likes:{},likeCount:0,commentCount:0,commenters:[],lastCommentAt:null,lastCommentId:'',created:ts()});
   b.update(profRef(),{lastPostAt:ts()});await b.commit()},
  async editPost(id,o){await updateDoc(doc(db,'posts',id),{title:o.title,body:o.body,cat:o.cat,img:o.img||'',edited:ts()})},
  async toggleLike(p){const r=doc(db,'posts',p.id);await updateDoc(r,p.likes[user.uid]?{['likes.'+user.uid]:deleteField(),likeCount:increment(-1)}:{['likes.'+user.uid]:ts(),likeCount:increment(1)})},
  async toggleCommentLike(c){const r=doc(db,'posts',c.pid,'comments',c.id);await updateDoc(r,c.likes[user.uid]?{['likes.'+user.uid]:deleteField(),likeCount:increment(-1)}:{['likes.'+user.uid]:ts(),likeCount:increment(1)})},
  async addComment(p,body){const m=await me(),b=writeBatch(db),r=doc(collection(db,'posts',p.id,'comments'));
   b.set(r,{pid:p.id,uid:user.uid,name:m.name,photo:m.photo||'',body,created:ts(),likes:{},likeCount:0});
   b.update(doc(db,'posts',p.id),{commentCount:increment(1),lastCommentAt:ts(),lastCommentId:r.id,commenters:[{u:user.uid,n:m.name,p:m.photo||''},...(p.commenters||[]).filter(c=>c.u!==user.uid)].slice(0,5)});
   b.update(profRef(),{lastCommentAt:ts()});await b.commit()},
  async deleteComment(c){await deleteDoc(doc(db,'posts',c.pid,'comments',c.id))},
  async mod(id,o){const r=doc(db,'posts',id);if(o.delete)await deleteDoc(r);else await updateDoc(r,o)},
  async saveProfile(o){await updateDoc(profRef(),o)},
  async setDone(lid,on){await updateDoc(profRef(),{done:on?arrayUnion(lid):arrayRemove(lid)})},
  async addEvent(e){await addDoc(collection(db,'events'),{...e,created:ts()})},
  async deleteEvent(id){await deleteDoc(doc(db,'events',id))},
  async report(o){await addDoc(collection(db,'reports'),{...o,by:user.uid,created:ts()})},
  async ban(uid){await setDoc(doc(db,'banned',uid),{at:ts()})},
  async saveReadiness(r){const b=writeBatch(db);b.set(doc(db,'profiles',user.uid,'private','readiness'),{answers:r.answers,score:r.score,level:r.level,weak:r.weak,at:ts()});b.update(profRef(),{ready:r.score,readyLevel:r.level,readyAt:ts()});await b.commit()},
  async getReadiness(){const s=await getDoc(doc(db,'profiles',user.uid,'private','readiness'));return s.exists()?conv(s):null},
  async adminReadiness(){const s=await getDocs(collectionGroup(db,'private'));return s.docs.filter(d=>d.id==='readiness').map(d=>({uid:d.ref.parent.parent.id,...conv(d)}))},
  async listScenarios(){const s=await getDocs(collection(db,'profiles',user.uid,'scenarios'));return s.docs.map(d=>({...conv(d),at:ms(d.data().at)})).sort((a,b)=>b.at-a.at)},
  async saveScenario(o){await addDoc(collection(db,'profiles',user.uid,'scenarios'),{name:o.name,currency:o.currency,inputs:o.inputs,results:o.results,at:ts()})},
  async deleteScenario(id){await deleteDoc(doc(db,'profiles',user.uid,'scenarios',id))}
 };
}
