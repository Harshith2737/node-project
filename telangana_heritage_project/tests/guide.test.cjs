"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const destinations = require("../frontend/data/destinations.json");
const guideHandler = require("../api/v1/guide");

async function invoke(handler, method, query) {
  const response = {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  await handler({ method, query: query || {} }, response);
  return response;
}

test("guide search retrieves a known destination with authoritative references", async () => {
  const response = await invoke(guideHandler, "GET", { q: "Ramappa Temple" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.mode, "curated-catalogue-search");
  assert.equal(response.body.generativeAI, false);
  assert.equal(response.body.count, 1);
  assert.equal(response.body.data[0].slug, "ramappa-temple");
  assert.equal(response.body.data[0].officialSourceUrl, destinations.find(item => item.slug === "ramappa-temple").officialSourceUrl);
  assert.match(response.body.data[0].officialSourceUrl, /^https:\/\//);
  assert.match(response.body.data[0].coordinateSourceUrl, /^https:\/\//);
});

test("guide search finds multiple places in a district and caps results", async () => {
  const response = await invoke(guideHandler, "GET", { q: "Hyderabad" });
  assert.equal(response.statusCode, 200);
  assert.ok(response.body.count >= 2);
  assert.ok(response.body.count <= 5);
  assert.ok(response.body.data.every(item => item.district === "Hyderabad"));
});

test("guide search returns an empty result instead of inventing an answer", async () => {
  const response = await invoke(guideHandler, "GET", { q: "place-that-is-not-in-the-reviewed-catalogue" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.count, 0);
  assert.deepEqual(response.body.data, []);
  assert.equal(response.body.generativeAI, false);
});

test("guide search validates methods and user input", async () => {
  const wrongMethod = await invoke(guideHandler, "POST", { q: "Warangal" });
  const repeatedQuery = await invoke(guideHandler, "GET", { q: ["Warangal", "Hyderabad"] });
  const tooShort = await invoke(guideHandler, "GET", { q: "x" });
  const tooLong = await invoke(guideHandler, "GET", { q: "x".repeat(81) });
  const noWords = await invoke(guideHandler, "GET", { q: "!!!" });
  assert.equal(wrongMethod.statusCode, 405);
  assert.equal(repeatedQuery.statusCode, 400);
  assert.equal(tooShort.statusCode, 400);
  assert.equal(tooLong.statusCode, 400);
  assert.equal(noWords.statusCode, 400);
});
