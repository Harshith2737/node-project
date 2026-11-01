"use strict";

(function attachHeritageMobility(root) {
  const MAPS_DIRECTIONS = "https://www.google.com/maps/dir/";
  const ALLOWED_MODES = new Set(["driving","transit","walking","bicycling","two-wheeler"]);

  function placeLabel(place) {
    if (!place || typeof place.name !== "string" || !place.name.trim()) {
      throw new TypeError("A destination with a name is required.");
    }
    return [place.name.trim(),place.district,"Telangana","India"]
      .filter((part) => typeof part === "string" && part.trim())
      .join(", ");
  }

  function buildGoogleMapsDirectionsUrl(stops, origin = "", travelMode = "driving") {
    if (!Array.isArray(stops) || stops.length === 0) {
      throw new TypeError("At least one destination is required.");
    }
    const params = new URLSearchParams();
    params.set("api","1");
    params.set("destination",placeLabel(stops[stops.length - 1]));
    const start = typeof origin === "string" ? origin.trim() : "";
    if (start) params.set("origin",start);
    if (stops.length > 1) params.set("waypoints",stops.slice(0,-1).map(placeLabel).join("|"));
    params.set("travelmode",ALLOWED_MODES.has(travelMode) ? travelMode : "driving");
    return MAPS_DIRECTIONS + "?" + params.toString();
  }

  const api = Object.freeze({placeLabel,buildGoogleMapsDirectionsUrl});
  root.HeritageMobility = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
