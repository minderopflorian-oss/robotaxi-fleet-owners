/* Referral: ?ref=<handle> -> localStorage, added to forms and community links */
(function(){var K='cfo_ref',q=new URLSearchParams(location.search).get('ref');
function clean(h){return (h||'').replace(/^@/,'').replace(/[^A-Za-z0-9_]/g,'').slice(0,15)}
if(q&&clean(q)){try{localStorage.setItem(K,clean(q))}catch(e){}}
function get(){try{return localStorage.getItem(K)||''}catch(e){return ''}}
window.cfoRef=get;
function apply(){var r=get();if(!r)return;
document.querySelectorAll('form').forEach(function(f){if(f.querySelector('input[name="ref"]'))return;var i=document.createElement('input');i.type='hidden';i.name='ref';i.value=r;f.appendChild(i)});
document.querySelectorAll('a[href*="x.com/i/communities/"]').forEach(function(a){if(a.dataset.ref)return;a.dataset.ref=r;var u=new URL(a.href);u.searchParams.set('ref',r);a.href=u.toString();
a.addEventListener('click',function(){try{var c=JSON.parse(localStorage.getItem('cfo_ref_clicks')||'[]');c.push({ref:r,t:Date.now(),link:a.href});localStorage.setItem('cfo_ref_clicks',JSON.stringify(c.slice(-50)))}catch(e){}})})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
document.addEventListener('submit',function(e){var r=get();if(r&&e.target.tagName==='FORM'&&!e.target.querySelector('input[name="ref"]')){var i=document.createElement('input');i.type='hidden';i.name='ref';i.value=r;e.target.appendChild(i)}},true);
})();
