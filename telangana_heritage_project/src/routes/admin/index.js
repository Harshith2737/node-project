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

function routeSegments(req) {
  // Vercel's catch-all path may be represented differently across runtimes.
  // Prefer the canonical request URL, then fall back to the parsed query value.
  if (typeof req.url === "string") {
    try {
      const pathname = new URL(req.url, "https://vercel.invalid").pathname;
      const prefix = "/api/v1/admin/";
      const offset = pathname.lastIndexOf(prefix);
      if (offset >= 0) {
        return pathname.slice(offset + prefix.length)
          .split("/")
          .filter(Boolean)
          .map(segment => decodeURIComponent(segment));
      }
    } catch {
      return [];
    }
  }

  const rawPath = req.query?.path;
  return Array.isArray(rawPath) ? rawPath :
    typeof rawPath === "string" ? rawPath.split("/").filter(Boolean) : [];
}

module.exports = async function adminRouter(req, res) {
  const segments = routeSegments(req);

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
