"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const destinations = require("../frontend/data/destinations.json");
const listHandler = require("../api/v1/destinations");
const detailHandler = require("../api/v1/destinations/[slug]");
const healthHandler = require("../api/v1/health");

function invoke(handler, method, query) {
  const response = {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  handler({ method, query: query || {} }, response);
  return response;
}

test("destination records have unique slugs and complete source metadata", () => {
  const slugs = new Set();
  for (const item of destinations) {
    assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(slugs.has(item.slug), false, "duplicate slug: " + item.slug);
    slugs.add(item.slug);
    assert.ok(item.name);
    assert.ok(item.district);
    assert.ok(["Heritage", "Nature", "Culture"].includes(item.category));
    assert.ok(item.description);
    assert.ok(Number.isFinite(item.coordinates.latitude));
    assert.ok(item.coordinates.latitude >= -90 && item.coordinates.latitude <= 90);
    assert.ok(Number.isFinite(item.coordinates.longitude));
    assert.ok(item.coordinates.longitude >= -180 && item.coordinates.longitude <= 180);
    assert.match(item.officialSourceUrl, /^https:\/\//);
    assert.match(item.coordinateSourceUrl, /^https:\/\//);
  }
});

test("destination list API returns the complete public catalogue", () => {
  const response = invoke(listHandler, "GET");
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.count, destinations.length);
  assert.equal(response.body.data.length, destinations.length);
  assert.match(response.headers["cache-control"], /s-maxage=3600/);
});

test("destination list API filters by category and search query", () => {
  const heritage = invoke(listHandler, "GET", { category: "Heritage" });
  assert.equal(heritage.statusCode, 200);
  assert.ok(heritage.body.data.length > 0);
  assert.ok(heritage.body.data.every(item => item.category === "Heritage"));

  const query = invoke(listHandler, "GET", { q: "Pochampally" });
  assert.equal(query.statusCode, 200);
  assert.equal(query.body.count, 1);
  assert.equal(query.body.data[0].slug, "bhoodan-pochampally");
});

test("destination list API rejects invalid filters and oversized queries", () => {
  assert.equal(invoke(listHandler, "GET", { category: "Unknown" }).statusCode, 400);
  assert.equal(invoke(listHandler, "GET", { q: "x".repeat(81) }).statusCode, 400);
  assert.equal(invoke(listHandler, "POST").statusCode, 405);
});

test("destination detail API returns a record or a useful 404", () => {
  const found = invoke(detailHandler, "GET", { slug: "ramappa-temple" });
  assert.equal(found.statusCode, 200);
  assert.equal(found.body.data.name, "Ramappa Temple");

  const missing = invoke(detailHandler, "GET", { slug: "not-a-place" });
  assert.equal(missing.statusCode, 404);
});

test("health endpoint responds with an API status", () => {
  const response = invoke(healthHandler, "GET");
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.apiVersion, "v1");
});
