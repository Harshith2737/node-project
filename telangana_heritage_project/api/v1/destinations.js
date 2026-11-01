"use strict";

const destinations = require("../../frontend/data/destinations.json");
const ALLOWED_CATEGORIES = new Set(["Heritage", "Nature", "Culture"]);

module.exports = function destinationsHandler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

  if (rawQuery.length > 80) {
    return res.status(400).json({ error: "Search query must be 80 characters or fewer." });
  }
  if (category && category !== "all" && !ALLOWED_CATEGORIES.has(category)) {
    return res.status(400).json({ error: "Unsupported destination category." });
  }

  const normalizedQuery = rawQuery.toLocaleLowerCase("en-IN");
  const result = destinations.filter(function (destination) {
    const categoryMatches = !category || category === "all" || destination.category === category;
    const searchableText = [
      destination.name,
      destination.district,
      destination.category,
      destination.description
    ].join(" ").toLocaleLowerCase("en-IN");
    return categoryMatches && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });

  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(200).json({
    apiVersion: "v1",
    count: result.length,
    data: result
  });
};
