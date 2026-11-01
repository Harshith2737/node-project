"use strict";
const {desc,eq}=require("drizzle-orm");
const {savedTrips}=require("../../src/db/schema");
const {context}=require("../../src/auth/identity");
const {consume}=require("../../src/shared/rate-limit");
const {api,method,body,text,sendJson,HttpError}=require("../../src/shared/http");
module.exports=api(async(req,res)=>{
 method(req,res,["GET","POST"]);const c=await context(req);
 if(req.method==="GET"){
  const data=await c.db.select().from(savedTrips).where(eq(savedTrips.ownerUserId,c.userId)).orderBy(desc(savedTrips.createdAt)).limit(50);
  return sendJson(res,200,{count:data.length,data});
 }
 const b=body(req),destination=text(b.destination,"destination",2,80),title=b.title===undefined?destination+" trip":text(b.title,"title",2,100);
 const interest=text(b.interest,"interest",2,80),durationDays=Number(b.durationDays);
 if(!Number.isInteger(durationDays)||durationDays<1||durationDays>7)throw new HttpError(400,"INVALID_DURATION","Trip duration must be 1 to 7 days.");
 if(!Array.isArray(b.itinerary)||b.itinerary.length<1||b.itinerary.length>21)throw new HttpError(400,"INVALID_ITINERARY","Provide 1 to 21 itinerary entries.");
 const itinerary=b.itinerary.map((x,i)=>{
  if(!x||typeof x!=="object"||Array.isArray(x))throw new HttpError(400,"INVALID_ITINERARY","Each itinerary entry must be an object.");
  return {day:text(String(x.day||"Day "+(i+1)),"day",1,20),title:text(x.title,"itinerary title",2,160),details:text(x.details,"itinerary details",2,500)};
 });
 await consume(c.db,c.userId,"save-trip",20,3600);
 const [created]=await c.db.insert(savedTrips).values({ownerUserId:c.userId,title,destination,durationDays,interest,itinerary})
  .returning({id:savedTrips.id,title:savedTrips.title,createdAt:savedTrips.createdAt});
 return sendJson(res,201,{message:"Trip saved to your account.",data:created});
});
