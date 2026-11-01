// Static forum content : categories, classroom, recurring calendar, levels and starter threads.
export const CATS=[
 {id:'intros',name:'Intros',full:'Introduce yourself and your city'},
 {id:'planning',name:'Fleet planning',full:'Fleet planning and hubs'},
 {id:'charging',name:'Charging & depots',full:'Charging and depots'},
 {id:'insurance',name:'Insurance & ops',full:'Insurance and operations'},
 {id:'wins',name:'Wins',full:'Wins : steps you took this week'},
 {id:'news',name:'News',full:'Cybercab and robotaxi news'},
 {id:'funding',name:'Funding',full:'Funding (general questions only)',more:true},
 {id:'offtopic',name:'Off-topic',full:'Off-topic',more:true}
];
export const LEVELS=[
 {n:1,min:0,name:'Explorer'},{n:2,min:5,name:'Rider'},{n:3,min:20,name:'Planner'},
 {n:4,min:65,name:'Builder'},{n:5,min:155,name:'Operator'},{n:6,min:515,name:'Hub Builder'},
 {n:7,min:2015,name:'Fleet Captain'},{n:8,min:8015,name:'Fleet Owner'},{n:9,min:33015,name:'Legend'}
];
// Weekly rhythm of the community (Europe/Amsterdam). Admins can add one-off events such as X Spaces in the Calendar tab.
export const WEEKLY=[
 {id:'w-mon',dow:1,time:'18:00',title:'News roundup',desc:'What moved in Cybercab and robotaxi this week . Thread on X and here in News .',url:'https://x.com/i/communities/1912893645050511710'},
 {id:'w-wed',dow:3,time:'18:00',title:'Fleet economics question',desc:'One question on the cost side of ownership . Answer in Fleet planning .',url:'https://x.com/i/communities/1912893645050511710'},
 {id:'w-fri',dow:5,time:'18:00',title:'Show your plan',desc:'Members share their city , fleet size and timeline . Post yours in Fleet planning .',url:'https://x.com/i/communities/1912893645050511710'},
 {id:'w-sun',dow:0,time:'20:00',title:'Weekly community update',desc:'New members , the road to 1,000 and the best posts of the week .',url:'https://x.com/i/communities/1912893645050511710'}
];
const REQ='/#guides';
export const COURSES=[
 {id:'start',title:'Start here',desc:'Your first three steps in the forum .',lessons:[
  {id:'start-1',t:'Read the welcome thread and house rules',d:'Two minutes . How the forum works and what is not allowed .',go:'welcome'},
  {id:'start-2',t:'Introduce yourself',d:'Your city , your plan and your timeline . Post in Intros .',go:'intro'},
  {id:'start-3',t:'Add your city to your profile',d:'So you show up on the map and in the member directory .',go:'profile'}]},
 {id:'ready',title:'The 2027 Readiness Guide',desc:'The free short starter : what is known , fleet size and a checklist .',cover:'/img/guide-cover.png',lessons:[
  {id:'ready-1',t:'Download the guide',d:'9 pages , PDF , free .',url:'/files/cybercab-2027-readiness-guide.pdf'},
  {id:'ready-2',t:'Work through the readiness checklist',d:'Tick off what you already have and note what is missing .',url:'/guide.html'},
  {id:'ready-3',t:'Share one open question in Fleet planning',d:'Members and moderators help you find the answer .',go:'planning'}]},
 {id:'impl',title:'The Fleet Implementation Guide',desc:'The full plan : city , depot , charging , cleaning , insurance , rules and funding routes .',lessons:[
  ['The 90-Day Fleet Plan','Six steps , ninety days .'],
  ['Why Fleets : Owning the Mile','The car becomes productive capital .'],
  ['The Window Is Opening','What changes around the car , and what is still unknown .'],
  ['Pick Your City','It starts with a city : five tests to run .'],
  ['Where Owners Fit','How a city tips and where owner cars may fit .'],
  ['How the Owner Model Could Work','Three scenarios and the open questions .'],
  ['Built for Uptime','What keeps a robotaxi on the road .'],
  ['The Depot','Parking , charging and cleaning in one place .'],
  ['The Four Pillars','The building blocks of a working fleet .'],
  ['Cost per Kilometre','How the running cost of one car adds up .'],
  ['Funding Your Fleet','The main routes to fund the cars .'],
  ['Rules of the Road','Caps , geofences and what to ask Tesla .','https://x.com/fminderop/status/2116834074094407941'],
  ['Start Small , Scale Smart','Lessons for a first car and the next ones .'],
  ['Your 90-Day Readiness Plan','Put it together into your own plan .']
 ].map((l,i)=>({id:'impl-'+(i+1),t:l[0],d:l[1]+(l[2]?' Video chapter on X .':' Request the guide by email .'),url:l[2]||REQ}))},
 {id:'econ',title:'Cybercab Economics Guide',desc:'How the cost of running one robotaxi adds up , per km and per mile .',lessons:[
  {id:'econ-1',t:'Request the Economics Guide',d:'24 pages . Credit @CernBasher and AJ @alojoh .',url:REQ},
  {id:'econ-2',t:'Discuss your cost assumptions',d:'Share your inputs in Fleet planning and compare with others .',go:'planning'}]},
 {id:'fund',title:'Funding & Depreciation Guide',desc:'Ways to fund a fleet and keep depreciation under control .',lessons:[
  {id:'fund-1',t:'Request the Funding & Depreciation Guide',d:'18 pages . Credit Michiel van Duijn , Tesla to Mars episode 39 .',url:REQ},
  {id:'fund-2',t:'Ask a general funding question',d:'General questions only . No financial advice in the forum .',go:'funding'}]},
 {id:'hubs',title:'Charging & Depot Hubs Guide',desc:'How to size , build , staff and finance a hub that charges , cleans and parks robotaxis .',lessons:[
  {id:'hubs-1',t:'Request the Charging & Depot Hubs Guide',d:'13 pages . Based on a real hub model .',url:REQ},
  {id:'hubs-2',t:'Share your depot or charging idea',d:'Post it in Charging & depots .',go:'charging'}]},
 {id:'watch',title:'Watch and listen',desc:'Video chapters and podcast episodes from the community .',lessons:[
  {id:'watch-1',t:'Cybercab Fleet Owners on YouTube',d:'Shorts and chapters .',url:'https://www.youtube.com/@CybercabFleetOwners'},
  {id:'watch-2',t:'Tesla to Mars #38 : robotaxi shepherds and AI economies',d:'How everyday investors and local operators can own a piece of the fleet .',url:'https://share.transistor.fm/s/c4f7cb03'}]}
];
export const WELCOME={
 title:'Welcome : start here and read the house rules',
 cat:'intros',
 body:`Welcome to the Cybercab Fleet Owners forum . This is the place to meet other future robotaxi fleet owners , compare plans and help each other get ready .

Start here :
1 . Introduce yourself in Intros : your city , your plan and your timeline .
2 . Add your city to your profile so you show up on the map .
3 . Open the Classroom and start with the free 2027 Readiness Guide .

House rules :
• Be respectful . Debate ideas , not people .
• No financial advice and no promises of returns .
• No spam , no selling and no self-promotion .
• Keep personal data out : no phone numbers , addresses or ID details .
• Post in the right category . Off-topic is for everything else .

Moderators may edit , hide or remove posts that break these rules . See something wrong ? Use Report on the post .`
};
export const STARTERS=[
 {cat:'intros',title:'Introduce yourself : where will your first Cybercab drive ?',body:'Tell us your city , how many cars you have in mind and when you hope to start . Short is fine . Then say hi to the person above you .'},
 {cat:'planning',title:'Show your plan : what does your first 90 days look like ?',body:'City , number of cars , where they park and charge , and the one thing you still need to figure out .'},
 {cat:'charging',title:'Home charger , depot or fast charging : what is your plan ?',body:'Where will your cars charge and get cleaned ? Share what you found about grid capacity in your area .'},
 {cat:'insurance',title:'What have insurers told you so far about covering a robotaxi ?',body:'Share what you asked and what you heard back , without names or personal details .'},
 {cat:'news',title:'Cybercabs now outnumber Model Ys in the Texas fleet',body:'Since 27 October 2026 Cybercabs outnumber Model Ys in the Texas robotaxi fleet : 544 vs 507 . Source : Texas DMV registrations via @herbertong . What does this change for your timeline ?'}
];
