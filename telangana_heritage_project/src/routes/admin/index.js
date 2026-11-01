"use strict";

const { sendJson } = require("../../shared/http");
const queue = require("./queue");
const stories = require("./stories");
const reports = require("./reports");
const contributorRequests = require("./contributor-requests");
const users = require("./users");

const handlers = new Map([
  ["queue", queue],
  ["stories", stories],
  ["reports", reports],
  ["contributor-requests", contributorRequests],
  ["users", users]
]);

module.exports = async function adminRouter(req, res) {
  const rawPath = req.query?.path;
  const segments = Array.isArray(rawPath) ? rawPath :
    typeof rawPath === "string" ? rawPath.split("/").filter(Boolean) : [];

  if (segments.length === 1 && segments[0] === "queue") {
    return queue(req, res);
  }
  if (segments.length !== 2) {
    return sendJson(res, 404, { error: "NOT_FOUND", message: "Route not found." });
  }

  const [resource, id] = segments;
  const handler = handlers.get(resource);
  if (!handler || resource === "queue" || !id || id.length > 128 || id.includes("/")) {
    return sendJson(res, 404, { error: "NOT_FOUND", message: "Route not found." });
  }

  req.query = { ...(req.query || {}) };
  if (resource === "users") req.query.userId = id;
  else req.query.id = id;

  return handler(req, res);
};
