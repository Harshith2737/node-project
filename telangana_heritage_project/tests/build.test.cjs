"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const buildScript = path.join(__dirname, "../scripts/build.js");

test("preview builds skip production database migrations", () => {
  const result = spawnSync(process.execPath, [buildScript], {
    encoding: "utf8",
    env: { ...process.env, VERCEL_ENV: "preview", DATABASE_URL: "" }
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Skipping database migration outside the production environment/);
});

test("production builds fail closed when the database is not configured", () => {
  const result = spawnSync(process.execPath, [buildScript], {
    encoding: "utf8",
    env: { ...process.env, VERCEL_ENV: "production", DATABASE_URL: "" }
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Database integration is not configured/);
});
