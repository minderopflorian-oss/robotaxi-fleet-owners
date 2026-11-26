(()=>{
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});
  document.querySelectorAll('.fade').forEach(el=>io.observe(el));

  const map={
    '#guides':'/fleet.html#guides',
    '#faq':'/fleet.html',
    '#fund':'/fleet.html',
    '#bot':'/fleet.html',
    '#review':'/fleet.html',
    '#contact':'/fleet.html',
    '#masterplan':'/fleet.html',
    '#questions-for-tesla':'/',
    '#caas':'/',
    '#swarm':'/',
    '#join-the-swarm':'/',
    '#join':'/#join',
    '#invite':'/#join',
    '#waitlists':'/#watch',
    '#cyberfund':'/',
    '#stake':'/',
    '#partners':'/fleet.html',
    '#figure':'/',
    '#why':'/',
    '#proof':'/',
    '#growing':'/',
    '#miles':'/',
    '#europe':'/#watch',
    '#timeline':'/fleet.html',
    '#milestones':'/fleet.html',
    '#semi':'https://semiasaservice.eu',
    '#energy':'https://semiasaservice.eu',
    '#megapod':'https://semiasaservice.eu',
    '#austin':'/',
    '#austin-trip':'/'
  };
  const h=location.hash;
  if(map[h]){
    const dest=new URL(map[h], location.origin);
    const herePath=(location.pathname.replace(/index\.html$/,'')||'/');
    const destPath=(dest.pathname.replace(/index\.html$/,'')||'/');
    if(herePath!==destPath || location.hash!==dest.hash) location.replace(map[h]);
  }

  document.addEventListener('click',e=>{
    const a=e.target.closest && e.target.closest('a[href*="communities/1912893645050511710"]');
    if(!a)return;
    try{
      if(window.goatcounter&&goatcounter.count){
        if(!a.hasAttribute('data-goatcounter-click')) goatcounter.count({path:'join-community',title:'Join the community click',event:true});
        return;
      }
      const u='https://cybercabfleetowners.goatcounter.com/count?p='+encodeURIComponent('join-community')+'&t='+encodeURIComponent('Join the community click')+'&e=true';
      if(navigator.sendBeacon) navigator.sendBeacon(u); else (new Image()).src=u;
    }catch(_){}
  },true);
})();
