"use strict";

const destinations = require("../../../frontend/data/destinations.json");

module.exports = function destinationBySlugHandler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const slug = typeof req.query.slug === "string" ? req.query.slug.trim().toLowerCase() : "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return res.status(400).json({ error: "A valid destination slug is required." });
  }

  const destination = destinations.find(function (item) {
    return item.slug === slug;
  });
  if (!destination) {
    return res.status(404).json({ error: "Destination not found." });
  }

  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(200).json({ apiVersion: "v1", data: destination });
};
