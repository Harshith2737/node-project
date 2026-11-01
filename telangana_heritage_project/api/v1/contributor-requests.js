"use strict";
const {and,desc,eq}=require("drizzle-orm");
const {contributorRequests}=require("../../src/db/schema");
const {context}=require("../../src/auth/identity");
const {consume}=require("../../src/shared/rate-limit");
const {api,method,body,text,sendJson,HttpError}=require("../../src/shared/http");
module.exports=api(async(req,res)=>{
 method(req,res,["POST"]);const c=await context(req);
 if(c.profile.role!=="tourist")throw new HttpError(409,"ROLE_NOT_ELIGIBLE","Only tourist accounts can request contributor access.");
 const reason=text(body(req).reason,"reason",20,1000);
 const [pending]=await c.db.select({id:contributorRequests.id}).from(contributorRequests)
  .where(and(eq(contributorRequests.userId,c.userId),eq(contributorRequests.status,"pending"))).orderBy(desc(contributorRequests.createdAt)).limit(1);
 if(pending)throw new HttpError(409,"REQUEST_ALREADY_PENDING","A contributor request is already awaiting review.");
 await consume(c.db,c.userId,"contributor-request",2,86400);
 const [created]=await c.db.insert(contributorRequests).values({userId:c.userId,reason,status:"pending"})
  .returning({id:contributorRequests.id,status:contributorRequests.status,createdAt:contributorRequests.createdAt});
 return sendJson(res,201,{message:"Contributor request submitted for review.",data:created});
});
