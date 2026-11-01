"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const frontend = path.join(__dirname, "..", "frontend");
const html = fs.readFileSync(path.join(frontend, "index.html"), "utf8");
test("homepage has canonical, Open Graph, Twitter and JSON-LD metadata", () => {
  for (const pattern of [
    /name="description"/, /name="robots"/, /property="og:title"/,
    /property="og:description"/, /property="og:image"/, /name="twitter:card"/,
    /rel="canonical"/, /application\/ld\+json/
  ]) assert.match(html, pattern);
});
test("homepage exposes a private memories journal section", () => {
  assert.match(html, /id="memories"/);
  assert.match(html, /id="memoryPhotos"/);
});
