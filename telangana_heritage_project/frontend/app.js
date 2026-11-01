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

function routeOptions() {
  return {
    origin: $("#tripOrigin")?.value || "",
    mode: $("#tripTravelMode")?.value || "driving"
  };
}

function destinationDirectionsUrl(place) {
  const { origin, mode } = routeOptions();
  return window.HeritageMobility.buildGoogleMapsDirectionsUrl([place], origin, mode);
}

function createExternalLink(label, href, className = "mobility-link") {
  const link = makeElement("a", className, label);
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function createCopyDestinationButton(place) {
  const button = makeElement("button", "mobility-copy", "Copy destination");
  button.type = "button";
  button.addEventListener("click", async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(window.HeritageMobility.placeLabel(place));
      button.textContent = "Copied";
      button.classList.add("copied");
      window.setTimeout(() => {
        button.textContent = "Copy destination";
        button.classList.remove("copied");
      }, 1800);
    } catch {
      button.textContent = "Copy unavailable";
    }
  });
  return button;
}

function appendRideOptions(container) {
  const rides = makeElement("section", "ride-handoff");
  rides.append(
    makeElement("h3", "", "Need a cab or auto?"),
    makeElement("p", "ride-copy", "Copy the destination above, then enter it in the provider app. You will confirm pickup, price and availability there.")
  );
  const providers = makeElement("div", "ride-provider-grid");
  const uber = makeElement("article", "ride-provider");
  uber.append(
    makeElement("strong", "", "Uber"),
    makeElement("p", "", "Enter your pickup and this destination on Uber's official ride page."),
    createExternalLink("Continue to Uber ↗", "https://www.uber.com/in/en/ride/")
  );
  const rapido = makeElement("article", "ride-provider");
  rapido.append(
    makeElement("strong", "", "Rapido"),
    makeElement("p", "", "Check bike, auto and cab service availability in the official app."),
    createExternalLink("Open Rapido ↗", "https://www.rapido.bike/"),
    makeElement("div", "app-store-links", "")
  );
  const storeLinks = rapido.lastElementChild;
  storeLinks.append(
    createExternalLink("Android app ↗", "https://play.google.com/store/apps/details?id=com.rapido.passenger", "mobility-secondary"),
    createExternalLink("iPhone app ↗", "https://apps.apple.com/in/app/rapido-bike-taxi-auto-cabs/id1198464606", "mobility-secondary")
  );
  providers.append(uber, rapido);
  rides.append(providers);
  rides.append(makeElement("p", "age-note", "Adult account holders only. Provider age rules apply; passengers under 18 must be accompanied by an adult. Confirm driver details and vehicle number plate before boarding."));
  container.append(rides);
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
    const searchable = [place.name, place.district, place.category, place.description, place.circuit]
      .join(" ").toLocaleLowerCase("en-IN");
    return matchesCategory && matchesDistrict && (!query || searchable.includes(query));
  });
  if (sort === "name") filtered.sort((a,b) => a.name.localeCompare(b.name,"en-IN"));
  else if (sort === "district") filtered.sort((a,b) => a.district.localeCompare(b.district,"en-IN") || a.name.localeCompare(b.name,"en-IN"));
  const counter = $("#resultCount");
  if (counter) counter.textContent = filtered.length + " of " + places.length + " destinations";
  container.replaceChildren();
  if (!filtered.length) {
    container.append(makeElement("p","empty-state","No matching destinations. Try another district, category or search term."));
    return;
  }
  for (const place of filtered) {
    const card = makeElement("article","place");
    const image = makeElement("div","place-img");
    image.setAttribute("aria-label",place.name + " photo");
    if (place.imageUrl) {
      const photo = document.createElement("img");
      photo.src = place.imageUrl; photo.alt = place.imageAlt || (place.name + " destination photo");
      photo.loading = "lazy"; photo.decoding = "async";
      photo.addEventListener("error",() => {
        photo.remove(); image.querySelector(".image-credit")?.remove(); image.classList.add("no-photo");
        image.append(makeElement("span","photo-fallback",place.category + " · " + place.district));
      },{once:true});
      image.append(photo);
      if (place.imageCredit) image.append(makeElement("small","image-credit",place.imageCredit));
    } else {
      image.classList.add("no-photo");
      image.append(makeElement("span","photo-fallback",place.category + " · " + place.district));
    }
    const body = makeElement("div","place-body");
    body.append(
      makeElement("small","place-meta",place.category + " · " + place.district),
      makeElement("h3","",place.name),
      makeElement("p","",place.description)
    );
    if (place.circuit) body.append(makeElement("small","circuit-label",place.circuit));
    const actions = makeElement("div","place-actions");
    const details = makeElement("button","text-button","View details →");
    details.type = "button";
    details.addEventListener("click",() => placeInfo(place));
    const maps = createExternalLink("Directions ↗",destinationDirectionsUrl(place),"text-button");
    maps.setAttribute("aria-label","Open Google Maps directions to " + place.name);
    actions.append(details,maps);
    body.append(actions);
    card.append(image,body);
    container.append(card);
  }
}

function placeInfo(place) {
  const content = document.createElement("div");
  content.className = "destination-detail";
  content.append(
    makeElement("p","place-meta",place.category + " · " + place.district),
    makeElement("h2","",place.name),
    makeElement("p","",place.description)
  );
  if (place.imageUrl) {
    const wrap = makeElement("figure","detail-photo");
    const photo = document.createElement("img");
    photo.src = place.imageUrl;
    photo.alt = place.imageAlt || (place.name + " destination photo");
    photo.loading = "lazy";
    photo.addEventListener("error",() => wrap.remove(),{once:true});
    wrap.append(photo);
    if (place.imageCredit) {
      const caption = document.createElement("figcaption");
      caption.append(document.createTextNode(place.imageCredit + " · "));
      caption.append(document.createTextNode(place.imageChanges || "No changes made to the original photograph."));
      if (place.imageSourceUrl) caption.append(createExternalLink("Photo source",place.imageSourceUrl,""));
      if (place.imageLicenseUrl) caption.append(createExternalLink("Licence",place.imageLicenseUrl,""));
      wrap.append(caption);
    }
    content.append(wrap);
  }

  content.append(
    makeElement("h3","","Responsible visit"),
    makeElement("p","",place.visitorTip || "Respect local customs and site guidance, avoid litter and support local communities.")
  );
  const guidance = document.createElement("ul");
  [
    "Confirm current opening details, access and local advisories before travelling.",
    "Respect conservation signs, sacred spaces and the privacy of local residents.",
    "Prefer local businesses and lower-impact transport where practical."
  ].forEach((item) => guidance.append(makeElement("li","",item)));
  content.append(guidance);

  const gettingThere = makeElement("section","destination-getting-there");
  gettingThere.append(
    makeElement("h3","","Get directions"),
    makeElement("p","","Google Maps opens the destination by name and district. Add a starting point in the trip planner to use the same pickup for route links.")
  );
  const directionActions = makeElement("div","mobility-actions");
  directionActions.append(
    createExternalLink("Directions in Google Maps ↗",destinationDirectionsUrl(place),"primary"),
    createCopyDestinationButton(place)
  );
  gettingThere.append(directionActions);
  appendRideOptions(gettingThere);
  content.append(gettingThere);

  const sourceLinks = makeElement("div","source-links");
  [
    ["Official tourism / circuit reference",place.officialSourceUrl],
    ["Approximate map location",place.coordinateSourceUrl]
  ].forEach(([label,href]) => {
    try {
      const parsed = new URL(href);
      if (parsed.protocol !== "https:") return;
      sourceLinks.append(createExternalLink(label,parsed.href,""));
    } catch {}
  });
  content.append(sourceLinks);

  const planButton = makeElement("button","primary","Add to trip planning");
  planButton.type = "button";
  planButton.addEventListener("click",() => {
    closeModal();
    $("#plan")?.scrollIntoView({behavior:"smooth"});
    const select = $("#tripDestination");
    if (!select) return;
    select.value = ({
      Hyderabad:"Hyderabad",Hanamkonda:"Warangal & Mulugu",Warangal:"Warangal & Mulugu",Mulugu:"Warangal & Mulugu","Jayashankar Bhupalpally":"Warangal & Mulugu",
      "Yadadri Bhuvanagiri":"Yadadri & Pochampally","Rajanna Sircilla":"Yadadri & Pochampally",Jagtial:"Yadadri & Pochampally",
      Nirmal:"Adilabad & Basara",Adilabad:"Adilabad & Basara",Medak:"Medak & Sangareddy",Sangareddy:"Medak & Sangareddy",Vikarabad:"Medak & Sangareddy"
    })[place.district] || "All Telangana";
  });
  content.append(planButton);
  openCustom(content);
}

function generateTrip() {
  const region = $("#tripDestination")?.value || "All Telangana";
  const days = Number.parseInt($("#tripDays")?.value || "1",10);
  const interest = $("#tripInterest")?.value || "Mixed experiences";
  const pace = $("#tripPace")?.value || "balanced";
  const startDate = $("#tripStart")?.value || "";
  const origin = ($("#tripOrigin")?.value || "").trim();
  const travelMode = $("#tripTravelMode")?.value || "driving";
  const regionDistricts = {
    "Warangal & Mulugu":["Warangal","Hanamkonda","Mulugu","Jayashankar Bhupalpally"],
    "Hyderabad":["Hyderabad","Rangareddy","Medchal Malkajgiri"],
    "Yadadri & Pochampally":["Yadadri Bhuvanagiri","Rajanna Sircilla","Jagtial"],
    "Adilabad & Basara":["Nirmal","Adilabad","Mancherial","Kumuram Bheem Asifabad"],
    "Medak & Sangareddy":["Medak","Sangareddy","Vikarabad"],
    "South Telangana":["Nalgonda","Jogulamba Gadwal","Nagarkurnool","Mahabubnagar","Wanaparthy"],
    "All Telangana":[]
  };
  const allowedDistricts = regionDistricts[region] || [];
  let candidates = places.filter((place) => !allowedDistricts.length || allowedDistricts.includes(place.district));
  const interestCategory = {"History & Heritage":"Heritage","Nature":"Nature","Culture & Food":"Culture"}[interest];
  if (interestCategory && candidates.some((place) => place.category === interestCategory)) {
    candidates = candidates.filter((place) => place.category === interestCategory);
  }
  if (!candidates.length) candidates = places.slice();

  const stopsPerDay = pace === "relaxed" ? 1 : pace === "active" ? 3 : 2;
  const maxStops = Math.min(days * stopsPerDay,candidates.length);
  const selected = candidates.slice(0,maxStops);
  const itinerary = $("#itinerary");
  itinerary.replaceChildren();

  const summary = days + "-day " + region + " plan · " + interest + " · " + pace + " pace" + (startDate ? " · Starts " + startDate : "");
  itinerary.append(makeElement("p","planner-summary",summary));

  const grouped = [];
  selected.forEach((place,index) => {
    const dayIndex = Math.floor(index / stopsPerDay);
    if (!grouped[dayIndex]) grouped[dayIndex] = [];
    grouped[dayIndex].push(place);
  });

  grouped.forEach((dayPlaces,dayIndex) => {
    const dayNumber = dayIndex + 1;
    const dayCard = makeElement("section","day-plan");
    dayCard.append(
      makeElement("small","place-meta","DAY " + dayNumber + " · " + dayPlaces.length + " planned stop" + (dayPlaces.length === 1 ? "" : "s")),
      makeElement("h3","","Day " + dayNumber)
    );
    const stopList = makeElement("ol","day-stop-list");
    dayPlaces.forEach((place) => {
      const item = document.createElement("li");
      item.append(
        makeElement("strong","",place.name),
        makeElement("span","",place.district + " · " + place.category),
        makeElement("p","",place.description),
        makeElement("small","planner-tip",place.visitorTip || "Confirm current access and travel conditions before departure.")
      );
      stopList.append(item);
    });
    dayCard.append(stopList);

    const routeOrigin = dayIndex === 0 ? origin : window.HeritageMobility.placeLabel(grouped[dayIndex - 1][grouped[dayIndex - 1].length - 1]);
    const routeUrl = window.HeritageMobility.buildGoogleMapsDirectionsUrl(dayPlaces,routeOrigin,travelMode);
    const actions = makeElement("div","mobility-actions");
    actions.append(createExternalLink("Open Day " + dayNumber + " route in Google Maps ↗",routeUrl,"primary"));
    actions.append(createCopyDestinationButton(dayPlaces[dayPlaces.length - 1]));
    dayCard.append(actions);
    itinerary.append(dayCard);
  });

  itinerary.append(makeElement("p","planner-disclaimer",
    "Route order is a suggested itinerary, not a live-traffic optimisation. Google Maps calculates navigation; ride providers show their own prices and availability. If no starting point is entered, Maps may use your device location when permitted."));
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
