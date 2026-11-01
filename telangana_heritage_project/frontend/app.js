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
  const filtered = places.filter((place) => {
    const matchesCategory = category === "all" || place.category === category;
    const searchable = [place.name, place.district, place.category, place.description]
      .join(" ").toLocaleLowerCase("en-IN");
    return matchesCategory && (!query || searchable.includes(query));
  });

  container.replaceChildren();
  if (filtered.length === 0) {
    container.append(makeElement("p", "empty-state", "No matching destinations found."));
    return;
  }

  for (const place of filtered) {
    const card = makeElement("article", "place");
    const image = makeElement("div", "place-img");
    image.append(makeElement("small", "", place.category + " • " + place.district));

    const body = makeElement("div", "place-body");
    body.append(
      makeElement("h3", "", place.name),
      makeElement("p", "", place.description)
    );
    const button = makeElement("button", "", "View details →");
    button.type = "button";
    button.addEventListener("click", () => placeInfo(place));
    body.append(button);
    card.append(image, body);
    container.append(card);
  }
}

function placeInfo(place) {
  const content = document.createElement("div");
  content.append(
    makeElement("h2", "", place.name),
    makeElement("p", "", place.district + " • " + place.category),
    makeElement("p", "", place.description),
    makeElement("h3", "", "Responsible visit")
  );

  const guidance = document.createElement("ul");
  [
    "Respect local customs and heritage rules.",
    "Avoid litter and single-use plastic.",
    "Prefer local businesses and lower-impact transport."
  ].forEach((item) => guidance.append(makeElement("li", "", item)));
  content.append(guidance);

  const sourceLinks = document.createElement("div");
  sourceLinks.className = "source-links";
  [
    ["Official destination information", place.officialSourceUrl],
    ["Coordinate reference", place.coordinateSourceUrl]
  ].forEach(([label, href]) => {
    try {
      const parsed = new URL(href);
      if (parsed.protocol !== "https:") return;
      const link = makeElement("a", "", label);
      link.href = parsed.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      sourceLinks.append(link);
    } catch {
      // Invalid source URLs are omitted rather than rendered as links.
    }
  });
  content.append(sourceLinks);

  const planButton = makeElement("button", "primary", "Plan a visit");
  planButton.type = "button";
  planButton.addEventListener("click", () => {
    closeModal();
    $("#plan")?.scrollIntoView({ behavior: "smooth" });
    const destinationSelect = $("#tripDestination");
    if (destinationSelect) {
      const district = place.district;
      const city = district === "Mulugu" || district === "Warangal" ? "Warangal"
        : district === "Hyderabad" ? "Hyderabad"
        : district === "Yadadri Bhuvanagiri" ? "Yadadri"
        : district === "Nirmal" ? "Adilabad" : "";
      if (city) destinationSelect.value = city;
    }
  });
  content.append(planButton);
  openCustom(content);
}

function generateTrip() {
  const destination = $("#tripDestination").value;
  const days = Number.parseInt($("#tripDays").value, 10);
  const interest = $("#tripInterest").value;

  const plans = {
    Warangal: [
      ["Day 1", "Warangal Fort → Thousand Pillar Temple", "Use local transport, carry a reusable bottle and support local food vendors."],
      ["Day 2", "Ramappa Temple → Ramappa Lake", "Visit respectfully and learn about Kakatiya heritage."],
      ["Day 3", "Local craft & food experience", "Choose local artisans and keep your visit low-waste."]
    ],
    Hyderabad: [
      ["Day 1", "Charminar → Chowmahalla Palace → Laad Bazaar", "Walk between nearby attractions where practical and support local shops."],
      ["Day 2", "Golconda Fort → Qutb Shahi Tombs", "Use shared transport and follow site preservation rules."],
      ["Day 3", "Museums + local food trail", "Explore living culture and choose local businesses."]
    ],
    Yadadri: [
      ["Day 1", "Yadadri Temple → Bhongir Fort", "Respect religious spaces and avoid disposable plastics."],
      ["Day 2", "Pochampally handloom experience", "Learn about Ikat and purchase directly from local makers."],
      ["Day 3", "Village & food experience", "Choose community-led experiences."]
    ],
    Adilabad: [
      ["Day 1", "Kuntala Waterfalls → nearby nature sites", "Stay on marked paths and carry all waste back."],
      ["Day 2", "Local culture & crafts", "Support local producers and guides."],
      ["Day 3", "Eco-tourism day", "Prefer small-group, low-impact activities."]
    ]
  };

  const itinerary = $("#itinerary");
  itinerary.replaceChildren();
  (plans[destination] || plans.Warangal).slice(0, days).forEach(([day, title, description]) => {
    const item = makeElement("div", "day");
    item.append(
      makeElement("b", "", day),
      makeElement("strong", "", title),
      makeElement("p", "", description)
    );
    itinerary.append(item);
  });
  itinerary.append(makeElement("p", "", "Interest: " + interest + " • Style: sustainable travel"));
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
    addText("p", "Sample responses only. A live AI guide needs a verified knowledge source and a configured AI service.");
    const input = makeElement("input");
    input.id = "aiq";
    input.type = "text";
    input.maxLength = 240;
    input.placeholder = "Ask about Hyderabad, Warangal or Pochampally";
    input.setAttribute("aria-label", "Question for the Telangana guide");
    const ask = makeElement("button", "primary", "Ask Guide");
    ask.type = "button";
    ask.addEventListener("click", aiAnswer);
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
function aiAnswer() {
  const question = ($("#aiq")?.value || "").trim().toLocaleLowerCase("en-IN");
  const answer = question.includes("warangal")
    ? "Explore Warangal Fort, Thousand Pillar Temple and Ramappa Temple. Check current visitor information before travelling."
    : question.includes("hyderabad")
      ? "Explore Charminar, Chowmahalla Palace, Golconda Fort and Qutb Shahi Tombs."
      : "The current guide is a local sample. Try asking about Hyderabad, Warangal or Pochampally.";
  $("#aiout").replaceChildren(makeElement("div", "result", answer));
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
init();
