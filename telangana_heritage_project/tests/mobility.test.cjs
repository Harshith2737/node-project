"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const mobility = require("../frontend/mobility");

test("Google Maps URL includes API version, named destination and travel mode", () => {
  const url = new URL(mobility.buildGoogleMapsDirectionsUrl([
    {name:"Ramappa Temple",district:"Mulugu"}
  ],"","driving"));
  assert.equal(url.origin,"https://www.google.com");
  assert.equal(url.pathname,"/maps/dir/");
  assert.equal(url.searchParams.get("api"),"1");
  assert.equal(url.searchParams.get("destination"),"Ramappa Temple, Mulugu, Telangana, India");
  assert.equal(url.searchParams.get("travelmode"),"driving");
  assert.equal(url.searchParams.has("origin"),false);
});

test("Google Maps route respects optional origin and transit mode", () => {
  const url = new URL(mobility.buildGoogleMapsDirectionsUrl([
    {name:"Charminar",district:"Hyderabad"}
  ],"Secunderabad Railway Station","transit"));
  assert.equal(url.searchParams.get("origin"),"Secunderabad Railway Station");
  assert.equal(url.searchParams.get("travelmode"),"transit");
});

test("multi-stop day plans become Google Maps waypoints in the selected order", () => {
  const url = new URL(mobility.buildGoogleMapsDirectionsUrl([
    {name:"Warangal Fort",district:"Warangal"},
    {name:"Thousand Pillar Temple",district:"Hanamkonda"},
    {name:"Ramappa Temple",district:"Mulugu"}
  ],"Warangal Railway Station","two-wheeler"));
  assert.equal(url.searchParams.get("origin"),"Warangal Railway Station");
  assert.equal(url.searchParams.get("destination"),"Ramappa Temple, Mulugu, Telangana, India");
  assert.equal(url.searchParams.get("waypoints"),"Warangal Fort, Warangal, Telangana, India|Thousand Pillar Temple, Hanamkonda, Telangana, India");
  assert.equal(url.searchParams.get("travelmode"),"two-wheeler");
});

test("unsupported travel modes fall back to driving", () => {
  const url = new URL(mobility.buildGoogleMapsDirectionsUrl([
    {name:"Charminar",district:"Hyderabad"}
  ],"","teleport"));
  assert.equal(url.searchParams.get("travelmode"),"driving");
});

test("directions builder rejects empty or unnamed destinations", () => {
  assert.throws(() => mobility.buildGoogleMapsDirectionsUrl([]),/At least one destination/);
  assert.throws(() => mobility.buildGoogleMapsDirectionsUrl([{district:"Mulugu"}]),/destination with a name/);
});
