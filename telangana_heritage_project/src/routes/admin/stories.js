"use strict";
const { eq } = require("drizzle-orm");
const { stories, moderationEvents } = require("../../db/schema");
const { context, roles } = require("../../auth/identity");
const { api, method, body, text, sendJson, HttpError } = require("../../shared/http");

module.exports = api(async (req, res) => {
  method(req, res, ["PATCH"]);
  const c = await context(req);
  roles(c, ["moderator", "admin"]);

  const id = req.query?.id;
  if (typeof id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new HttpError(400, "INVALID_ID", "A valid story ID is required.");
  }

  const input = body(req);
  const status = text(input.status, "status", 1, 20);
  if (!["published", "rejected"].includes(status)) {
    throw new HttpError(400, "INVALID_STATUS", "Story status must be published or rejected.");
  }
  const notes = input.notes === undefined ? null : text(input.notes, "notes", 1, 500);
  const [existing] = await c.db.select({ id: stories.id }).from(stories)
    .where(eq(stories.id, id)).limit(1);
  if (!existing) throw new HttpError(404, "STORY_NOT_FOUND", "Story not found.");

  const reviewedAt = new Date();
  await c.db.batch([
    c.db.update(stories).set({
      status, reviewedBy: c.userId, reviewedAt, updatedAt: reviewedAt
    }).where(eq(stories.id, id)),
    c.db.insert(moderationEvents).values({
      actorUserId: c.userId, targetType: "story", targetId: id, action: status, notes
    })
  ]);

  return sendJson(res, 200, {
    message: "Story review updated.",
    data: { id, status, reviewedAt }
  });
});
