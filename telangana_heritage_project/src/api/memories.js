"use strict";

const { randomUUID, createHash } = require("node:crypto");
const { Readable } = require("node:stream");
const { and, desc, eq } = require("drizzle-orm");
const { get, put, del } = require("@vercel/blob");
const { context } = require("../auth/identity");
const { travelMemories } = require("../db/schema");
const { consume } = require("../shared/rate-limit");
const { api, method, sendJson, HttpError } = require("../shared/http");
const { decodeImageDataUrl, optionalText } = require("../shared/memory-uploads");

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_JSON_BYTES = 3_000_000;

function payload(req) {
  if (Number(req.headers?.["content-length"] || 0) > MAX_JSON_BYTES) {
    throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Photo upload request is too large.");
  }
  let value = req.body;
  if (typeof value === "string") {
    try { value = JSON.parse(value); }
    catch { throw new HttpError(400, "INVALID_JSON", "Body must be valid JSON."); }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "INVALID_BODY", "A JSON object is required.");
  }
  if (Buffer.byteLength(JSON.stringify(value), "utf8") > MAX_JSON_BYTES) {
    throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Photo upload request is too large.");
  }
  return value;
}

function validId(value) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new HttpError(400, "INVALID_MEMORY_ID", "A valid memory ID is required.");
  }
  return value;
}

module.exports = api(async (req, res) => {
  method(req, res, ["GET", "POST", "DELETE"]);
  const user = await context(req);
  const db = user.db;
  const id = req.query?.id || new URL(req.url, "https://tgheritage.vercel.app").searchParams.get("id");

  if (req.method === "GET" && id) {
    const memoryId = validId(id);
    const [memory] = await db.select().from(travelMemories)
      .where(and(eq(travelMemories.id, memoryId), eq(travelMemories.ownerUserId, user.userId))).limit(1);
    if (!memory) throw new HttpError(404, "MEMORY_NOT_FOUND", "This memory was not found.");
    const result = await get(memory.blobPath, { access: "private", ifNoneMatch: req.headers?.["if-none-match"] });
    if (!result) throw new HttpError(404, "PHOTO_NOT_FOUND", "The saved photo is unavailable.");
    res.setHeader("Content-Type", memory.contentType);
    res.setHeader("Content-Disposition", "inline; filename=\"heritage-memory\"");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    if (result.blob?.etag) res.setHeader("ETag", result.blob.etag);
    if (result.statusCode === 304) return res.status(304).end();
    res.status(200);
    if (typeof result.stream?.pipe === "function") return result.stream.pipe(res);
    return Readable.fromWeb(result.stream).pipe(res);
  }

  if (req.method === "GET") {
    const rows = await db.select({
      id: travelMemories.id,
      caption: travelMemories.caption,
      destinationName: travelMemories.destinationName,
      createdAt: travelMemories.createdAt
    }).from(travelMemories)
      .where(eq(travelMemories.ownerUserId, user.userId))
      .orderBy(desc(travelMemories.createdAt)).limit(120);
    return sendJson(res, 200, { count: rows.length, data: rows.map(row => ({
      ...row, imageUrl: "/api/v1/stories?resource=memories&id=" + encodeURIComponent(row.id)
    })) });
  }

  if (req.method === "POST") {
    const b = payload(req);
    const image = decodeImageDataUrl(b.imageDataUrl);
    const caption = optionalText(b.caption, "Caption", 220);
    const destinationName = optionalText(b.destinationName, "Destination", 100);
    await consume(db, user.userId, "travel-memory-upload", 12, 3600);

    const ownerFolder = createHash("sha256").update(user.userId).digest("hex").slice(0, 20);
    const blobPath = "travel-memories/" + ownerFolder + "/" + randomUUID() + "." + image.extension;
    const blob = await put(blobPath, image.buffer, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: image.contentType,
      cacheControlMaxAge: 60
    });
    try {
      const [created] = await db.insert(travelMemories).values({
        ownerUserId: user.userId,
        blobPath: blob.pathname,
        contentType: image.contentType,
        fileSize: image.buffer.length,
        caption,
        destinationName
      }).returning({
        id: travelMemories.id,
        caption: travelMemories.caption,
        destinationName: travelMemories.destinationName,
        createdAt: travelMemories.createdAt
      });
      return sendJson(res, 201, { message: "Saved to your private travel journal.", data: created });
    } catch (error) {
      await del(blob.pathname, { access: "private" }).catch(() => {});
      throw error;
    }
  }

  const deleteId = validId(id || payload(req).id);
  const [memory] = await db.select().from(travelMemories)
    .where(and(eq(travelMemories.id, deleteId), eq(travelMemories.ownerUserId, user.userId))).limit(1);
  if (!memory) throw new HttpError(404, "MEMORY_NOT_FOUND", "This memory was not found.");
  await del(memory.blobPath, { access: "private" });
  await db.delete(travelMemories).where(and(
    eq(travelMemories.id, deleteId),
    eq(travelMemories.ownerUserId, user.userId)
  ));
  return sendJson(res, 200, { message: "Memory deleted." });
});
