"use strict";

let places = [];
let lastFocusedElement = null;

const $ = (selector) => document.querySelector(selector);

function makeElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

async function loadDestinations() {
  const endpoints = ["/api/v1/destinations", "./data/destinations.json"];
  let lastError;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const payload = await response.json();
      const records = Array.isArray(payload) ? payload : payload.data;
      if (!Array.isArray(records)) throw new Error("Invalid destination payload");
      return records;
    } catch (error) {
      lastError = error;
    }
  }

  console.error("Unable to load the destination catalogue:", lastError);
  const container = $("#places");
  if (container) {
    container.replaceChildren(makeElement("p", "empty-state", "Destination data is temporarily unavailable. Please refresh the page."));
  }
  return [];
}

function renderPlaces() {
  const container = $("#places");
  if (!container) return;
  const query = ($("#search")?.value || "").trim().toLocaleLowerCase("en-IN");
  const category = $("#category")?.value || "all";
  const district = $("#district")?.value || "all";
  const sort = $("#sort")?.value || "featured";
  const filtered = places.filter((place) => {
    const matchesCategory = category === "all" || place.category === category;
    const matchesDistrict = district === "all" || place.district === district;
    const searchable = [place.name,place.district,place.category,place.description,place.circuit].join(" ").toLocaleLowerCase("en-IN");
    return matchesCategory && matchesDistrict && (!query || searchable.includes(query));
  });
  if (sort === "name") filtered.sort((a,b)=>a.name.localeCompare(b.name,"en-IN"));
  else if (sort === "district") filtered.sort((a,b)=>a.district.localeCompare(b.district,"en-IN")||a.name.localeCompare(b.name,"en-IN"));
  const counter=$("#resultCount");
  if(counter) counter.textContent=filtered.length+" of "+places.length+" destinations";
  container.replaceChildren();
  if(!filtered.length){container.append(makeElement("p","empty-state","No matching destinations. Try another district, category or search term."));return;}
  for(const place of filtered){
    const card=makeElement("article","place");
    const image=makeElement("div","place-img");
    image.setAttribute("aria-label",place.name+" photo");
    if(place.imageUrl){
      const photo=document.createElement("img");
      photo.src=place.imageUrl;photo.alt=place.imageAlt||(place.name+" destination photo");
      photo.loading="lazy";photo.decoding="async";
      photo.addEventListener("error",()=>{
        photo.remove();image.querySelector(".image-credit")?.remove();image.classList.add("no-photo");
        image.append(makeElement("span","photo-fallback",place.category+" · "+place.district));
      },{once:true});
      image.append(photo);
      if(place.imageCredit) image.append(makeElement("small","image-credit",place.imageCredit));
    }else{
      image.classList.add("no-photo");image.append(makeElement("span","photo-fallback",place.category+" · "+place.district));
    }
    const body=makeElement("div","place-body");
    body.append(makeElement("small","place-meta",place.category+" · "+place.district),makeElement("h3","",place.name),makeElement("p","",place.description));
    if(place.circuit) body.append(makeElement("small","circuit-label",place.circuit));
    const actions=makeElement("div","place-actions");
    const button=makeElement("button","text-button","View details →");button.type="button";button.addEventListener("click",()=>placeInfo(place));
    const mapLink=makeElement("a","text-button","Map ↗");mapLink.href=place.coordinateSourceUrl;mapLink.target="_blank";mapLink.rel="noopener noreferrer";
    actions.append(button,mapLink);body.append(actions);card.append(image,body);container.append(card);
  }
}

function placeInfo(place) {
  const content=document.createElement("div");content.className="destination-detail";
  content.append(makeElement("p","place-meta",place.category+" · "+place.district),makeElement("h2","",place.name),makeElement("p","",place.description));
  if(place.imageUrl){
    const wrap=makeElement("figure","detail-photo");const photo=document.createElement("img");
    photo.src=place.imageUrl;photo.alt=place.imageAlt||(place.name+" destination photo");photo.loading="lazy";
    photo.addEventListener("error",()=>wrap.remove(),{once:true});wrap.append(photo);
    if(place.imageCredit){
      const caption=document.createElement("figcaption");
      caption.append(document.createTextNode(place.imageCredit+" · "));
      caption.append(document.createTextNode(place.imageChanges||"No changes made to the original photograph."));
      if(place.imageSourceUrl){const source=makeElement("a","","Photo source");source.href=place.imageSourceUrl;source.target="_blank";source.rel="noopener noreferrer";caption.append(source);}
      if(place.imageLicenseUrl){caption.append(document.createTextNode(" · "));const licence=makeElement("a","","Licence");licence.href=place.imageLicenseUrl;licence.target="_blank";licence.rel="noopener noreferrer";caption.append(licence);}
      wrap.append(caption);
    }
    content.append(wrap);
  }
  content.append(makeElement("h3","","Responsible visit"),makeElement("p","",place.visitorTip||"Respect local customs and site guidance, avoid litter and support local communities."));
  const guidance=document.createElement("ul");
  ["Confirm current opening details, access and local advisories before travelling.","Respect conservation signs, sacred spaces and the privacy of local residents.","Prefer local businesses and lower-impact transport where practical."].forEach(x=>guidance.append(makeElement("li","",x)));
  content.append(guidance);
  const links=makeElement("div","source-links");
  [["Official tourism / circuit reference",place.officialSourceUrl],["Approximate map location",place.coordinateSourceUrl]].forEach(([label,href])=>{
    try{const u=new URL(href);if(u.protocol!=="https:")return;const a=makeElement("a","",label);a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";links.append(a);}catch{}
  });
  content.append(links);
  const button=makeElement("button","primary","Find in trip planner");button.type="button";
  button.addEventListener("click",()=>{
    closeModal();$("#plan")?.scrollIntoView({behavior:"smooth"});const select=$("#tripDestination");if(!select)return;
    select.value=({
      Hyderabad:"Hyderabad",Hanamkonda:"Warangal & Mulugu",Warangal:"Warangal & Mulugu",Mulugu:"Warangal & Mulugu","Jayashankar Bhupalpally":"Warangal & Mulugu",
      "Yadadri Bhuvanagiri":"Yadadri & Pochampally","Rajanna Sircilla":"Yadadri & Pochampally",Jagtial:"Yadadri & Pochampally",
      Nirmal:"Adilabad & Basara",Adilabad:"Adilabad & Basara",Medak:"Medak & Sangareddy",Sangareddy:"Medak & Sangareddy",Vikarabad:"Medak & Sangareddy"
    })[place.district]||"All Telangana";
  });
  content.append(button);openCustom(content);
}

function generateTrip() {
  const region=$("#tripDestination")?.value||"All Telangana";
  const days=Number.parseInt($("#tripDays")?.value||"1",10);
  const interest=$("#tripInterest")?.value||"Mixed experiences";
  const pace=$("#tripPace")?.value||"balanced";
  const startDate=$("#tripStart")?.value||"";
  const districts={
    "Warangal & Mulugu":["Warangal","Hanamkonda","Mulugu","Jayashankar Bhupalpally"],
    "Hyderabad":["Hyderabad","Rangareddy","Medchal Malkajgiri"],
    "Yadadri & Pochampally":["Yadadri Bhuvanagiri","Rajanna Sircilla","Jagtial"],
    "Adilabad & Basara":["Nirmal","Adilabad","Mancherial","Kumuram Bheem Asifabad"],
    "Medak & Sangareddy":["Medak","Sangareddy","Vikarabad"],
    "South Telangana":["Nalgonda","Jogulamba Gadwal","Nagarkurnool","Mahabubnagar","Wanaparthy"],
    "All Telangana":[]
  };
  const allowed=districts[region]||[];
  let candidates=places.filter(p=>!allowed.length||allowed.includes(p.district));
  const cat={"History & Heritage":"Heritage","Nature":"Nature","Culture & Food":"Culture"}[interest];
  if(cat&&candidates.some(p=>p.category===cat))candidates=candidates.filter(p=>p.category===cat);
  if(!candidates.length)candidates=places.slice();
  const perDay=pace==="relaxed"?1:pace==="active"?3:2;
  const maxStops=Math.min(days*perDay,candidates.length);
  const itinerary=$("#itinerary");itinerary.replaceChildren();
  itinerary.append(makeElement("p","planner-summary",days+"-day "+region+" plan · "+interest+" · "+pace+" pace"+(startDate?" · Starts "+startDate:"")));
  candidates.slice(0,maxStops).forEach((place,index)=>{
    const day=Math.floor(index/perDay)+1;const item=makeElement("article","day");
    item.append(makeElement("small","place-meta","DAY "+day+" · "+place.category+" · "+place.district),makeElement("strong","",place.name),makeElement("p","",place.description),makeElement("p","planner-tip",place.visitorTip||"Confirm current access details and travel conditions before departure."));
    const link=makeElement("a","text-button","Open map ↗");link.href=place.coordinateSourceUrl;link.target="_blank";link.rel="noopener noreferrer";item.append(link);itinerary.append(item);
  });
  itinerary.append(makeElement("p","planner-disclaimer","Suggested discovery sequence only. It does not estimate travel times, confirm opening hours or reserve tickets. Check routes and local conditions before departure."));
  itinerary.append(makeElement("p","planner-save-note","You can save this itinerary after signing in, once your account and database are configured."));
}

function calculateCarbon() {
  const distanceInput = $("#distance");
  const kilometres = Number(distanceInput.value);
  const transport = $("#transport").value;
  const result = $("#carbonResult");

  if (!Number.isFinite(kilometres) || kilometres < 1 || kilometres > 10000) {
    result.textContent = "Enter a distance between 1 and 10,000 km.";
    distanceInput.focus();
    return;
  }

  const factors = { Bus: 0.08, Train: 0.04, Car: 0.18, Bike: 0.01 };
  const kilograms = (kilometres * (factors[transport] ?? 0.1)).toFixed(1);
  result.textContent = "Illustrative estimate: " + kilograms + " kg CO₂ for " + kilometres
    + " km by " + transport + ". Demo factors only; actual emissions vary by vehicle and occupancy.";
}

function openModal(type) {
  const content = document.createElement("div");
  const addText = (tag, text) => content.append(makeElement(tag, "", text));

  if (type === "login") {
    addText("h2", "Welcome");
    addText("p", "Authentication is not connected yet. This screen is a preview only.");
  } else if (type === "ai") {
    addText("h2", "Telangana Guide");
    addText("p", "Search the reviewed destination catalogue. Each result includes an official reference; this is source-linked search, not an AI-generated answer.");
    const input = makeElement("input");
    input.id = "aiq";
    input.type = "search";
    input.maxLength = 80;
    input.placeholder = "Try Ramappa Temple or Hyderabad";
    input.setAttribute("aria-label", "Search the Telangana destination catalogue");
    const ask = makeElement("button", "primary", "Search Guide");
    ask.id = "guideSearchButton";
    ask.type = "button";
    ask.addEventListener("click", aiAnswer);
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        void aiAnswer();
      }
    });
    content.append(input, ask, makeElement("div", "", ""));
    const output = content.lastElementChild;
    output.id = "aiout";
    output.setAttribute("aria-live", "polite");
  } else if (type === "story") {
    addText("h2", "Culture Archive");
    addText("p", "Story contributions are not stored yet. This workflow needs sign-in, moderation and persistent storage before accepting entries.");
  } else if (type === "festival") {
    addText("h2", "Telangana Festivals");
    const festivalItems = [
      ["Bathukamma", "Floral festival celebrating Telangana cultural identity."],
      ["Bonalu", "Traditional festival with deep local religious and cultural significance."],
      ["Sammakka Saralamma Jatara", "Major tribal-cultural gathering."]
    ];
    for (const [name, description] of festivalItems) {
      const paragraph = document.createElement("p");
      paragraph.append(makeElement("b", "", name), document.createTextNode(" • " + description));
      content.append(paragraph);
    }
  } else if (type === "report") {
    addText("h2", "Report a Heritage Issue");
    addText("p", "Report intake is not enabled yet. It will require validated submissions, rate limiting, safe storage and a moderation workflow.");
  } else {
    addText("p", "This section is unavailable.");
  }

  const closeButton = makeElement("button", "primary full", "Close");
  closeButton.type = "button";
  closeButton.addEventListener("click", closeModal);
  content.append(closeButton);
  openCustom(content);
}
async function aiAnswer() {
  const input = $("#aiq");
  const output = $("#aiout");
  const button = $("#guideSearchButton");
  if (!input || !output || !button) return;

  const question = input.value.trim();
  output.replaceChildren();
  if (question.length < 2) {
    output.append(makeElement("p", "empty-state", "Enter at least two characters, such as a place or district name."));
    return;
  }

  button.disabled = true;
  button.textContent = "Searching…";
  output.append(makeElement("p", "empty-state", "Searching reviewed destination records…"));

  try {
    const response = await fetch("/api/v1/guide?q=" + encodeURIComponent(question), {
      headers: { Accept: "application/json" }
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || "The guide search could not be completed.");
    }

    output.replaceChildren();
    if (!Array.isArray(payload.data) || payload.data.length === 0) {
      output.append(makeElement("p", "empty-state", "No reviewed destination matched that search. Try Hyderabad, Warangal, Mulugu, Nirmal or Pochampally."));
      return;
    }

    output.append(makeElement("p", "guide-disclaimer", payload.message));
    for (const item of payload.data) {
      const card = makeElement("article", "guide-result");
      card.append(
        makeElement("h3", "", item.name),
        makeElement("small", "guide-meta", item.district + " · " + item.category),
        makeElement("p", "", item.description),
        makeElement("small", "guide-note", item.sourceNotes)
      );

      const links = makeElement("div", "source-links");
      if (typeof item.officialSourceUrl === "string" && item.officialSourceUrl.startsWith("https://")) {
        const official = makeElement("a", "", "Official reference");
        official.href = item.officialSourceUrl;
        official.target = "_blank";
        official.rel = "noopener noreferrer";
        links.append(official);
      }
      if (typeof item.coordinateSourceUrl === "string" && item.coordinateSourceUrl.startsWith("https://")) {
        const map = makeElement("a", "", "Map reference");
        map.href = item.coordinateSourceUrl;
        map.target = "_blank";
        map.rel = "noopener noreferrer";
        links.append(map);
      }
      if (links.childNodes.length) card.append(links);
      output.append(card);
    }
  } catch (error) {
    output.replaceChildren(makeElement("p", "empty-state", error.message));
  } finally {
    button.disabled = false;
    button.textContent = "Search Guide";
  }
}

function openCustom(content) {
  lastFocusedElement = document.activeElement;
  const modal = $("#modal");
  const modalContent = $("#modalContent");
  modalContent.replaceChildren();
  if (typeof content === "string") {
    const paragraph = makeElement("p", "", content);
    modalContent.append(paragraph);
  } else {
    modalContent.append(content);
  }
  modal.style.display = "grid";
  $("#modal .close").focus();
}

function closeModal() {
  $("#modal").style.display = "none";
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") lastFocusedElement.focus();
  lastFocusedElement = null;
}

function installInteractions() {
  $("#search").addEventListener("input", renderPlaces);
  $("#category").addEventListener("change", renderPlaces);
  $("#district")?.addEventListener("change", renderPlaces);
  $("#sort")?.addEventListener("change", renderPlaces);
  $("#clearFilters")?.addEventListener("click",()=>{$("#search").value="";$("#category").value="all";if($("#district"))$("#district").value="all";if($("#sort"))$("#sort").value="featured";renderPlaces();});
  $("#modal").addEventListener("click", (event) => {
    if (event.target.id === "modal") closeModal();
  });

  document.addEventListener("keydown", (event) => {
    const modal = $("#modal");
    if (event.key === "Escape" && modal.style.display === "grid") closeModal();
    if (event.key !== "Tab" || modal.style.display !== "grid") return;

    const focusable = [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')]
      .filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });

  const menuToggle = $("#menuToggle");
  const nav = $("#primaryNav");
  menuToggle.addEventListener("click", () => {
    const nextOpen = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(nextOpen));
    nav.classList.toggle("is-open", nextOpen);
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));
}

async function init() {
  installInteractions();
  places = await loadDestinations();
  const districtSelect=$("#district");
  if(districtSelect){const districts=[...new Set(places.map(p=>p.district))].sort((a,b)=>a.localeCompare(b,"en-IN"));districtSelect.replaceChildren(new Option("All districts","all"),...districts.map(d=>new Option(d,d)));}
  renderPlaces();
  if (window.TelanganaHeritageMap) window.TelanganaHeritageMap.render(places);
  else {
    const mapList = $("#mapList");
    if (mapList) mapList.textContent = "Map module is unavailable. Use the destination cards above.";
  }
}

window.openModal = openModal;
window.closeModal = closeModal;
window.generateTrip = generateTrip;
window.calculateCarbon = calculateCarbon;
window.aiAnswer = aiAnswer;
window.renderPlaces = renderPlaces;
window.applyTrail = (value) => {
  const select=$("#tripDestination");
  const regions=["Warangal & Mulugu","Hyderabad","Yadadri & Pochampally","Adilabad & Basara","Medak & Sangareddy","South Telangana","All Telangana"];
  if(select&&regions.includes(value)){select.value=value;$("#plan")?.scrollIntoView({behavior:"smooth"});return;}
  if(["Nature","Culture","Heritage"].includes(value)){$("#category").value=value;$("#search").value="";if($("#district"))$("#district").value="all";$("#explore")?.scrollIntoView({behavior:"smooth"});renderPlaces();}
};
init();
