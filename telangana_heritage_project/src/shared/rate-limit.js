"use strict";
const {createHash}=require("node:crypto");
const {sql}=require("drizzle-orm");
const {rateLimitBuckets}=require("../db/schema");
const {HttpError}=require("./http");
async function consume(db,userId,scope,limit,seconds){
 const keyHash=createHash("sha256").update(userId+":"+scope).digest("hex");
 const [row]=await db.insert(rateLimitBuckets).values({keyHash,count:1,resetAt:new Date(Date.now()+seconds*1000)})
 .onConflictDoUpdate({target:rateLimitBuckets.keyHash,set:{
  count:sql.raw("CASE WHEN reset_at<=NOW() THEN 1 ELSE count+1 END"),
  resetAt:sql.raw("CASE WHEN reset_at<=NOW() THEN NOW()+make_interval(secs => "+Number(seconds)+") ELSE reset_at END")
 },where:sql.raw("reset_at<=NOW() OR count<"+Number(limit))})
 .returning({count:rateLimitBuckets.count});
 if(!row)throw new HttpError(429,"RATE_LIMITED","Submission limit reached. Try again later.");
}
module.exports={consume};
