(function () {
  "use strict";

  const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  let mapInstance = null;
  let markerLayer = null;
  let markerBySlug = new Map();

  function textElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function makePopup(destination) {
    const wrapper = document.createElement("div");
    wrapper.className = "destination-popup";
    wrapper.append(
      textElement("strong", "destination-popup__title", destination.name),
      textElement("span", "destination-popup__district", destination.district + " • " + destination.category),
      textElement("p", "destination-popup__description", destination.description)
    );

    const links = document.createElement("div");
    links.className = "destination-popup__links";

    const official = document.createElement("a");
    official.href = destination.officialSourceUrl;
    official.target = "_blank";
    official.rel = "noopener noreferrer";
    official.textContent = "Official destination information";

    const coordinates = document.createElement("a");
    coordinates.href = destination.coordinateSourceUrl;
    coordinates.target = "_blank";
    coordinates.rel = "noopener noreferrer";
    coordinates.textContent = "Coordinate source";

    links.append(official, coordinates);
    wrapper.append(links);
    return wrapper;
  }

  function makeDestinationButton(destination, onSelect) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-item";
    button.setAttribute("aria-label", "Show " + destination.name + " on map");
    button.append(
      textElement("b", "", destination.name),
      textElement("small", "", destination.district + " • " + destination.category)
    );
    button.addEventListener("click", function () {
      const marker = markerBySlug.get(destination.slug);
      if (!marker || !mapInstance) return;
      mapInstance.flyTo(marker.getLatLng(), Math.max(mapInstance.getZoom(), 12), {
        animate: true,
        duration: 0.45
      });
      marker.openPopup();
      if (typeof onSelect === "function") onSelect(destination);
    });
    return button;
  }

  function showMapFallback(container, message) {
    container.replaceChildren(textElement("p", "map-fallback", message));
  }

  function render(destinations) {
    const container = document.getElementById("mapBox");
    const list = document.getElementById("mapList");
    if (!container || !list) return;

    list.replaceChildren();
    markerBySlug = new Map();

    if (!Array.isArray(destinations) || destinations.length === 0) {
      showMapFallback(container, "No mapped destinations are available yet.");
      return;
    }

    if (!window.L) {
      showMapFallback(container, "The map library could not be loaded. Use the destination list to browse locations.");
      destinations.forEach(function (destination) {
        list.append(makeDestinationButton(destination));
      });
      return;
    }

    if (!mapInstance) {
      mapInstance = window.L.map(container, {
        scrollWheelZoom: false,
        preferCanvas: true
      }).setView([17.95, 79.1], 7);

      const tileMeta = document.querySelector('meta[name="map-tile-url"]');
      const tileUrl = tileMeta && tileMeta.content ? tileMeta.content : DEFAULT_TILE_URL;

      window.L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
      }).addTo(mapInstance);

      markerLayer = window.L.layerGroup().addTo(mapInstance);
    } else {
      markerLayer.clearLayers();
    }

    const bounds = [];
    destinations.forEach(function (destination) {
      const point = destination.coordinates;
      if (!point || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) return;

      const marker = window.L.marker([point.latitude, point.longitude], {
        title: destination.name,
        alt: "Map marker for " + destination.name,
        riseOnHover: true
      }).bindPopup(makePopup(destination));

      marker.addTo(markerLayer);
      markerBySlug.set(destination.slug, marker);
      bounds.push([point.latitude, point.longitude]);
      list.append(makeDestinationButton(destination));
    });

    if (bounds.length > 1) {
      mapInstance.fitBounds(bounds, { padding: [24, 24], maxZoom: 8 });
    } else if (bounds.length === 1) {
      mapInstance.setView(bounds[0], 12);
    }

    // Recalculate map dimensions after responsive layout changes.
    window.requestAnimationFrame(function () {
      if (mapInstance) mapInstance.invalidateSize();
    });
  }

  window.TelanganaHeritageMap = Object.freeze({ render: render });
}());
