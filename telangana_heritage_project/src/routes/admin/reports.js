"use strict";
const { eq } = require("drizzle-orm");
const { heritageReports, moderationEvents } = require("../../db/schema");
const { context, roles } = require("../../auth/identity");
const { api, method, body, text, sendJson, HttpError } = require("../../shared/http");

module.exports = api(async (req, res) => {
  method(req, res, ["PATCH"]);
  const c = await context(req);
  roles(c, ["moderator", "admin"]);

  const id = req.query?.id;
  if (typeof id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new HttpError(400, "INVALID_ID", "A valid report ID is required.");
  }

  const input = body(req);
  const status = text(input.status, "status", 1, 20);
  if (!["triaged", "resolved", "rejected"].includes(status)) {
    throw new HttpError(400, "INVALID_STATUS", "Report status must be triaged, resolved or rejected.");
  }
  const priority = input.priority === undefined ? undefined : text(input.priority, "priority", 1, 10);
  if (priority !== undefined && !["normal", "high"].includes(priority)) {
    throw new HttpError(400, "INVALID_PRIORITY", "Priority must be normal or high.");
  }
  const notes = input.notes === undefined ? null : text(input.notes, "notes", 1, 500);
  const [existing] = await c.db.select({ id: heritageReports.id }).from(heritageReports)
    .where(eq(heritageReports.id, id)).limit(1);
  if (!existing) throw new HttpError(404, "REPORT_NOT_FOUND", "Report not found.");

  const reviewedAt = new Date();
  const values = { status, reviewedBy: c.userId, reviewedAt, updatedAt: reviewedAt };
  if (priority !== undefined) values.priority = priority;

  await c.db.batch([
    c.db.update(heritageReports).set(values).where(eq(heritageReports.id, id)),
    c.db.insert(moderationEvents).values({
      actorUserId: c.userId, targetType: "heritage_report", targetId: id, action: status, notes
    })
  ]);

  return sendJson(res, 200, {
    message: "Heritage report review updated.",
    data: { id, status, priority: priority || "normal", reviewedAt }
  });
});
