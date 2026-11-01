"use strict";
const {migrate}=require("drizzle-orm/neon-http/migrator");
const {getDb}=require("../src/db");
migrate(getDb(),{migrationsFolder:"./db/migrations"})
 .then(()=>console.log("Database migrations applied."))
 .catch(error=>{console.error("Migration failed:",error.message);process.exitCode=1;});
