"use strict";
const {desc,eq}=require("drizzle-orm");
const {stories,heritageReports,savedTrips,contributorRequests}=require("../../src/db/schema");
const {context}=require("../../src/auth/identity");
const {api,method,sendJson}=require("../../src/shared/http");
module.exports=api(async(req,res)=>{
 method(req,res,["GET"]);const c=await context(req);
 const [userStories,reports,trips,requests]=await Promise.all([
  c.db.select().from(stories).where(eq(stories.authorUserId,c.userId)).orderBy(desc(stories.createdAt)).limit(50),
  c.db.select().from(heritageReports).where(eq(heritageReports.reporterUserId,c.userId)).orderBy(desc(heritageReports.createdAt)).limit(50),
  c.db.select().from(savedTrips).where(eq(savedTrips.ownerUserId,c.userId)).orderBy(desc(savedTrips.createdAt)).limit(50),
  c.db.select().from(contributorRequests).where(eq(contributorRequests.userId,c.userId)).orderBy(desc(contributorRequests.createdAt)).limit(20)
 ]);
 return sendJson(res,200,{stories:userStories,reports,trips,contributorRequests:requests});
});
