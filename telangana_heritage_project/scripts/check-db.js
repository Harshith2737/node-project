"use strict";
const {sql}=require("drizzle-orm");
const {getDb}=require("../src/db");
getDb().execute(sql.raw("select current_database() as name, now() as checked_at"))
 .then(result=>console.log("Database connection OK:",result.rows[0].name))
 .catch(error=>{console.error("Database check failed:",error.message);process.exitCode=1;});
