"use strict";
const { eq } = require("drizzle-orm");
const { contributorRequests, userProfiles, moderationEvents } = require("../../db/schema");
const { context, roles } = require("../../auth/identity");
const { api, method, body, text, sendJson, HttpError } = require("../../shared/http");

module.exports = api(async (req, res) => {
  method(req, res, ["PATCH"]);
  const c = await context(req);
  roles(c, ["moderator", "admin"]);

  const id = req.query?.id;
  if (typeof id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new HttpError(400, "INVALID_ID", "A valid contributor request ID is required.");
  }

  const status = text(body(req).status, "status", 1, 20);
  if (!["approved", "rejected"].includes(status)) {
    throw new HttpError(400, "INVALID_STATUS", "Request status must be approved or rejected.");
  }

  const [existing] = await c.db.select({
    id: contributorRequests.id,
    userId: contributorRequests.userId,
    status: contributorRequests.status
  }).from(contributorRequests).where(eq(contributorRequests.id, id)).limit(1);

  if (!existing) throw new HttpError(404, "REQUEST_NOT_FOUND", "Contributor request not found.");
  if (existing.status !== "pending") {
    throw new HttpError(409, "ALREADY_REVIEWED", "This contributor request was already reviewed.");
  }

  const reviewedAt = new Date();
  const statements = [
    c.db.update(contributorRequests).set({
      status, reviewedBy: c.userId, reviewedAt
    }).where(eq(contributorRequests.id, id)),
    c.db.insert(moderationEvents).values({
      actorUserId: c.userId, targetType: "contributor_request", targetId: id, action: status
    })
  ];
  if (status === "approved") {
    statements.push(c.db.update(userProfiles).set({
      role: "contributor", updatedAt: reviewedAt
    }).where(eq(userProfiles.clerkUserId, existing.userId)));
  }

  await c.db.batch(statements);
  return sendJson(res, 200, {
    message: status === "approved" ? "Contributor access approved." : "Contributor request rejected.",
    data: { id, status }
  });
});
