(()=>{
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});
  document.querySelectorAll('.fade').forEach(el=>io.observe(el));

  const here=location.pathname.replace(/index\.html$/,'') || '/';
  const map={
    '#guides':'/fleet.html#guides',
    '#faq':'/fleet.html#faq',
    '#fund':'/fleet.html#fund',
    '#bot':'/fleet.html#bot',
    '#review':'/fleet.html#contact',
    '#contact':'/fleet.html#contact',
    '#masterplan':'/fleet.html',
    '#questions-for-tesla':'/',
    '#caas':'/',
    '#swarm':'/',
    '#join-the-swarm':'/',
    '#waitlists':'/#watch',
    '#cyberfund':'/',
    '#stake':'/',
    '#partners':'/fleet.html#contact',
    '#figure':'/#why',
    '#europe':'/#watch',
    '#milestones':'/fleet.html#timeline',
    '#semi':'https://semiasaservice.eu',
    '#energy':'https://semiasaservice.eu',
    '#megapod':'https://semiasaservice.eu',
    '#austin-trip':'/#austin'
  };
  const h=location.hash;
  if(map[h] && !(here.startsWith('/fleet') && map[h].startsWith('/fleet'))){
    location.replace(map[h]);
  }

  document.addEventListener('click',e=>{
    const a=e.target.closest && e.target.closest('a[href*="communities/1912893645050511710"]');
    if(!a)return;
    try{if(window.goatcounter&&goatcounter.count)goatcounter.count({path:'join-community',title:'Join the community click',event:true});}catch(_){}
  });
})();
