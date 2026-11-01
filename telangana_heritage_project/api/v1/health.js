"use strict";

module.exports = function healthHandler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(200).json({
    status: "ok",
    service: "telangana-heritage-api",
    apiVersion: "v1",
    timestamp: new Date().toISOString()
  });
};
