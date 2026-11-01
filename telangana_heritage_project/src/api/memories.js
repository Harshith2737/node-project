"use strict";

const { randomUUID } = require("node:crypto");
const { and, desc, eq } = require("drizzle-orm");
const { get, put, del } = require("@vercel/blob");
const { context } = require("../auth/identity");
const { travelMemories } = require("../db/schema");
const { consume } = require("../shared/rate-limit");
const { api, method, body, sendJson, HttpError } = require("../shared/http");
const { decodeImageDataUrl, optionalText } = require("../shared/memory-uploads");

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_JSON_BYTES = 3_000_000;

function uploadPayload(req) {
  let value = req.body;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      throw new HttpError(400, "INVALID_JSON", "Body must be valid JSON.");
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "INVALID_BODY", "A JSON object is required.");
  }
  if (Buffer.byteLength(JSON.stringify(value), "utf8") > MAX_JSON_BYTES) {
    throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Photo upload request is too large.");
  }
  return value;
}

function memoryId(value) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new HttpError(400, "INVALID_MEMORY_ID", "A valid memory ID is required.");
  }
  return value;
}

module.exports = api(async (req, res) => {
  method(req, res, ["GET", "POST", "DELETE"]);
  const user = await context(re¶»§q«^