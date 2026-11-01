"use strict";
const { desc, eq } = require("drizzle-orm");
const { stories, heritageReports, contributorRequests } = require("../../db/schema");
const { context, roles } = require("../../auth/identity");
const { api, method, sendJson } = require("../../shared/http");

module.exports = api(async (req, res) => {
  method(req, res, ["GET"]);
  const c = await context(req);
  roles(c, ["moderator", "admin"]);

  const [pendingStories, pendingReports, pendingRequests] = await Promise.all([
    c.db.select().from(stories).where(eq(stories.status, "pending"))
      .orderBy(desc(stories.createdAt)).limit(50),
    c.db.select().from(heritageReports).where(eq(heritageReports.status, "pending"))
      .orderBy(desc(heritageReports.createdAt)).limit(50),
    c.db.select().from(contributorRequests).where(eq(contributorRequests.status, "pending"))
      .orderBy(desc(contributorRequests.createdAt)).limit(50)
  ]);

  return sendJson(res, 200, {
    stories: pendingStories,
    reports: pendingReports,
    contributorRequests: pendingRequests
  });
});
