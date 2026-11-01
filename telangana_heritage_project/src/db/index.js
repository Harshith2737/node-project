"use strict";
const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");
const schema = require("./schema");
let db;
function getDb() {
  if (db) return db;
  if (!process.env.DATABASE_URL) {
    const error = new Error("Database integration is not configured.");
    error.statusCode = 503; error.code = "DATABASE_NOT_CONFIGURED"; throw error;
  }
  db = drizzle(neon(process.env.DATABASE_URL), { schema });
  return db;
}
module.exports = { getDb };
