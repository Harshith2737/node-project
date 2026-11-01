"use strict";

const { migrate } = require("drizzle-orm/neon-http/migrator");
const { getDb } = require("../src/db");

async function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log("Skipping database migration outside the production environment.");
    return;
  }

  try {
    await migrate(getDb(), { migrationsFolder: "./db/migrations" });
    console.log("Production database migrations are up to date.");
  } catch (error) {
    console.error("Production database migration failed:", error.message);
    process.exitCode = 1;
  }
}

main();
