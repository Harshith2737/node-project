"use strict";
const { eq } = require("drizzle-orm");
const { userProfiles, moderationEvents } = require("../../db/schema");
const { context, roles } = require("../../auth/identity");
const { api, method, body, text, sendJson, HttpError } = require("../../shared/http");

const ALLOWED = new Set(["tourist", "contributor", "moderator", "admin"]);

module.exports = api(async (req, res) => {
  method(req, res, ["PATCH"]);
  const c = await context(req);
  roles(c, ["moderator", "admin"]);

  const target = req.query?.userId;
  if (typeof target !== "string" || !/^user_[A-Za-z0-9]+$/.test(target)) {
    throw new HttpError(400, "INVALID_USER_ID", "A valid Clerk user ID is required.");
  }
  const role = text(body(req).role, "role", 4, 20);
  if (!ALLOWED.has(role)) throw new HttpError(400, "INVALID_ROLE", "Choose a supported account role.");

  if (c.profile.role !== "admin" && !["tourist", "contributor"].includes(role)) {
    throw new HttpError(403, "ADMIN_ROLE_REQUIRED", "Only administrators can grant moderator/admin roles.");
  }
  if (target === c.userId && c.profile.role === "admin" && role !== "admin") {
    throw new HttpError(409, "SELF_DEMOTION_BLOCKED", "An administrator cannot remove their own admin role here.");
  }

  const [existing] = await c.db.select({
    id: userProfiles.clerkUserId, role: userProfiles.role
  }).from(userProfiles).where(eq(userProfiles.clerkUserId, target)).limit(1);
  if (!existing) throw new HttpError(404, "USER_NOT_FOUND", "User must sign in before a role can be changed.");

  if (c.profile.role !== "admin" && ["moderator", "admin"].includes(existing.role)) {
    throw new HttpError(403, "ADMIN_ROLE_REQUIRED", "Moderators cannot change moderator or admin accounts.");
  }

  await c.db.batch([
    c.db.update(userProfiles).set({ role, updatedAt: new Date() })
      .where(eq(userProfiles.clerkUserId, target)),
    c.db.insert(moderationEvents).values({
      actorUserId: c.userId, targetType: "user_role", targetId: target, action: "set_" + role
    })
  ]);

  return sendJson(res, 200, { message: "User role updated.", data: { userId: target, role } });
});
