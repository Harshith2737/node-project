"use strict";
const catalogue=require("../../frontend/data/destinations.json");
const {heritageReports}=require("../../src/db/schema");
const {context}=require("../../src/auth/identity");
const {consume}=require("../../src/shared/rate-limit");
const {api,method,body,text,sendJson,HttpError}=require("../../src/shared/http");
const slugs=new Set(catalogue.map(x=>x.slug)),issues=new Set(["litter","vandalism","damage","accessibility","safety","other"]);
module.exports=api(async(req,res)=>{
 method(req,res,["POST"]);const c=await context(req),b=body(req);
 const destinationSlug=text(b.destinationSlug,"destinationSlug",3,100).toLowerCase();
 if(!slugs.has(destinationSlug))throw new HttpError(400,"INVALID_DESTINATION","Choose a destination from the catalogue.");
 const issueType=text(b.issueType,"issueType",3,30).toLowerCase();
 if(!issues.has(issueType))throw new HttpError(400,"INVALID_ISSUE_TYPE","Choose a supported issue type.");
 const description=text(b.description,"description",10,2000);
 const latitude=b.latitude===undefined||b.latitude===null||b.latitude===""?null:Number(b.latitude);
 const longitude=b.longitude===undefined||b.longitude===null||b.longitude===""?null:Number(b.longitude);
 if((latitude===null)!==(longitude===null)||(latitude!==null&&(!Number.isFinite(latitude)||latitude< -90||latitude>90||!Number.isFinite(longitude)||longitude< -180||longitude>180)))throw new HttpError(400,"INVALID_COORDINATES","Provide both valid latitude and longitude.");
 await consume(c.db,c.userId,"heritage-report",10,3600);
 const [created]=await c.db.insert(heritageReports).values({reporterUserId:c.userId,destinationSlug,issueType,description,latitude,longitude,status:"pending"})
  .returning({id:heritageReports.id,status:heritageReports.status,createdAt:heritageReports.createdAt});
 return sendJson(res,201,{message:"Heritage report received for moderation.",data:created});
});
