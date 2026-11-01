const places=[
{name:"Charminar",district:"Hyderabad",cat:"Heritage",desc:"Iconic monument and gateway to Hyderabad's historic old city.",x:55,y:36},
{name:"Golconda Fort",district:"Hyderabad",cat:"Heritage",desc:"Historic fort complex known for its architecture and Deccan history.",x:48,y:41},
{name:"Ramappa Temple",district:"Mulugu",cat:"Heritage",desc:"Kakatiya-era temple and UNESCO World Heritage site at Palampet.",x:63,y:51},
{name:"Warangal Fort",district:"Warangal",cat:"Heritage",desc:"Historic Kakatiya fort complex with distinctive gateways.",x:61,y:45},
{name:"Kuntala Waterfalls",district:"Nirmal",cat:"Nature",desc:"A major waterfall destination in northern Telangana.",x:36,y:20},
{name:"Pochampally",district:"Yadadri Bhuvanagiri",cat:"Culture",desc:"Famous for handloom Ikat weaving and textile traditions.",x:59,y:38}
];
function renderPlaces(){let q=(document.getElementById("search").value||"").toLowerCase(),c=document.getElementById("category").value;let a=places.filter(p=>(c==="all"||p.cat===c)&&(`${p.name} ${p.district} ${p.cat}`.toLowerCase().includes(q)));document.getElementById("places").innerHTML=a.map(p=>`<article class="place"><div class="place-img"><small>${p.cat} • ${p.district}</small></div><div class="place-body"><h3>${p.name}</h3><p>${p.desc}</p><button onclick='placeInfo(${JSON.stringify(p)})'>View details →</button></div></article>`).join("")||"<p>No matching destinations found.</p>";}
function renderMap(){
  const box=document.getElementById("mapBox"),list=document.getElementById("mapList");
  box.replaceChildren();list.replaceChildren();
  places.forEach(p=>{
    const marker=document.createElement("button");
    marker.type="button";marker.className="marker";
    marker.style.left=p.x+"%";marker.style.top=p.y+"%";
    marker.title=p.name;marker.setAttribute("aria-label","View "+p.name);
    marker.addEventListener("click",()=>placeInfo(p));box.appendChild(marker);
    const item=document.createElement("button");item.type="button";item.className="map-item";
    const name=document.createElement("b");name.textContent=p.name;
    const meta=document.createElement("small");meta.textContent=p.district+" • "+p.cat;
    item.append(name,meta);item.addEventListener("click",()=>placeInfo(p));list.appendChild(item);
  });
}
function placeInfo(p){openCustom(`<h2>${p.name}</h2><p><b>${p.district}</b> • ${p.cat}</p><p>${p.desc}</p><h3>Responsible visit</h3><ul><li>Respect local customs and heritage rules.</li><li>Avoid litter and single-use plastic.</li><li>Prefer local businesses and public transport.</li></ul><button class="primary" onclick="closeModal();document.getElementById('plan').scrollIntoView()">Plan a visit</button>`)}
function generateTrip(){let d=document.getElementById("tripDestination").value,days=document.getElementById("tripDays").value,interest=document.getElementById("tripInterest").value;let plans={Warangal:[["Day 1","Warangal Fort → Thousand Pillar Temple","Use local transport, carry a reusable bottle and support local food vendors."],["Day 2","Ramappa Temple → Ramappa Lake","Visit respectfully and spend time learning about Kakatiya heritage."],["Day 3","Local craft & food experience","Choose verified local artisans and keep your visit low-waste."]],Hyderabad:[["Day 1","Charminar → Chowmahalla Palace → Laad Bazaar","Walk between nearby attractions where practical and support local shops."],["Day 2","Golconda Fort → Qutb Shahi Tombs","Use shared/public transport and follow site preservation rules."],["Day 3","Museums + local food trail","Explore living culture and choose local businesses."]],Yadadri:[["Day 1","Yadadri Temple → Bhongir Fort","Respect religious spaces and avoid disposable plastics."],["Day 2","Pochampally handloom experience","Learn about Ikat and purchase directly from local makers."],["Day 3","Village & food experience","Choose community-led experiences."]],Adilabad:[["Day 1","Kuntala Waterfalls → nearby nature sites","Stay on marked paths and carry all waste back."],["Day 2","Local culture & crafts","Support local producers and guides."],["Day 3","Eco-tourism day","Prefer small-group, low-impact activities."]]};let n=parseInt(days),arr=plans[d]||plans.Warangal;document.getElementById("itinerary").innerHTML=arr.slice(0,n).map(x=>`<div class="day"><b>${x[0]}</b><strong>${x[1]}</strong><p>${x[2]}</p></div>`).join("")+`<p><b>Interest:</b> ${interest} &nbsp; <b>Style:</b> sustainable travel</p>`}
function calculateCarbon(){
  const distanceInput=document.getElementById("distance");
  const km=Number(distanceInput.value),transport=document.getElementById("transport").value;
  const result=document.getElementById("carbonResult");
  if(!Number.isFinite(km)||km<1||km>10000){
    result.textContent="Enter a distance between 1 and 10,000 km.";
    distanceInput.focus();return;
  }
  const factors={Bus:.08,Train:.04,Car:.18,Bike:.01};
  const kg=(km*(factors[transport]??.1)).toFixed(1);
  result.textContent="Illustrative estimate: "+kg+" kg CO₂ for "+km+" km by "+transport+". Demo factors only.";
}
function openModal(type){let c={login:`<h2>Welcome back</h2><p>Demo only. Authentication is not connected.</p><input placeholder="Email"><input placeholder="Password" type="password"><button class="primary full" onclick="closeModal()">Close demo</button>`,ai:`<h2>AI Telangana Guide</h2><p>Sample responses only; no live AI service is connected.</p><input id="aiq" placeholder="e.g. What can I see in Warangal?"><button class="primary" onclick="aiAnswer()">Ask Guide</button><div id="aiout"></div>`,story:`<h2>Culture Archive</h2><p>Contribution prototype only. Entries are not stored or sent.</p><input placeholder="Your name"><select><option>Oral history</option><option>Craft</option><option>Recipe</option><option>Festival</option></select><textarea placeholder="Tell us your story..."></textarea><button class="primary" onclick="closeModal()">Close demo</button>`,festival:`<h2>Telangana Festivals</h2><p><b>Bathukamma</b> • Floral festival celebrating Telangana's cultural identity.</p><p><b>Bonalu</b> • Traditional festival with deep local religious and cultural significance.</p><p><b>Sammakka Saralamma Jatara</b> • Major tribal-cultural gathering.</p>`,report:`<h2>Report a Heritage Issue</h2><p>Reporting prototype only. Reports are not stored or sent.</p><input placeholder="Location"><select><option>Garbage</option><option>Vandalism</option><option>Structural damage</option><option>Pollution</option><option>Other</option></select><textarea placeholder="Describe the issue"></textarea><button class="primary" onclick="closeModal()">Close demo</button>`}[type];openCustom(c)}
function aiAnswer(){let q=(document.getElementById("aiq").value||"").toLowerCase(),ans=q.includes("warangal")?"Try Warangal Fort, Thousand Pillar Temple and Ramappa Temple. A two-day trip works well, with public/local transport where practical.":q.includes("hyderabad")?"Start with Charminar, Chowmahalla Palace, Golconda Fort and Qutb Shahi Tombs.":"I can help with Telangana heritage, sustainable routes, local culture and itinerary planning. Try asking about Hyderabad, Warangal or Pochampally.";document.getElementById("aiout").innerHTML=`<div class="result">${ans}</div>`}
let lastFocusedElement=null;
function openCustom(html){
  lastFocusedElement=document.activeElement;
  document.getElementById("modalContent").innerHTML=html;
  document.getElementById("modal").style.display="grid";
  document.querySelector("#modal .close").focus();
}
function closeModal(){
  document.getElementById("modal").style.display="none";
  if(lastFocusedElement&&typeof lastFocusedElement.focus==="function")lastFocusedElement.focus();
  lastFocusedElement=null;
}
window.onclick=e=>{if(e.target.id==="modal")closeModal()};
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&document.getElementById("modal").style.display==="grid")closeModal();
});
const menuToggle=document.getElementById("menuToggle");
const primaryNav=document.getElementById("primaryNav");
menuToggle.addEventListener("click",()=>{
  const isOpen=menuToggle.getAttribute("aria-expanded")==="true";
  menuToggle.setAttribute("aria-expanded",String(!isOpen));
  primaryNav.classList.toggle("is-open",!isOpen);
});
primaryNav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{
  primaryNav.classList.remove("is-open");menuToggle.setAttribute("aria-expanded","false");
}));
renderPlaces();renderMap();