"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const frontend = path.join(__dirname, "..", "frontend");
const html = fs.readFileSync(path.join(frontend, "index.html"), "utf8");
const vercel = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "vercel.json"), "utf8"));

test("homepage has unique navigation targets and a dedicated private memories section", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, "HTML IDs should be unique");
  assert.match(html, /href="#memories"/);
  assert.match(html, /<section id="memories"/);
  assert.match(html, /id="memoryPhotos"[^>]+capture="environment"/);
});

test("homepage includes canonical, search and social preview metadata", () => {
  for (const meta of [
    /name="description"/,
    /name="robots"/,
    /name="googlebot"/,
    /property="og:title"/,
    /property="og:description"/,
    /property="og:image" content="https:\/\/tgheritage\.vercel\.app\/heritage-social-card\.png"/,
    /property="og:image:type" content="image\/png"/,
    /name="twitter:card"/,
    /rel="canonical" href="https:\/\/tgheritage\.vercel\.app\/"/
  ]) assert.match(html, meta);
  const structured = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(structured, "JSON-LD structured data should be present");
  const data = JSON.parse(st¶»§q«^