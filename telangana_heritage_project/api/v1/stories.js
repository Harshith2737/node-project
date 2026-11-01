"use strict";
const {desc,eq}=require("drizzle-orm");
const {getDb}=require("../../src/db");
const {stories}=require("../../src/db/schema");
const {context,roles}=require("../../src/auth/identity");
const {consume}=require("../../src/shared/rate-limit");
const {api,method,body,text,sendJson,HttpError}=require("../../src/shared/http");
const memoriesApi = require("../../src/api/memories");
module.exports=api(async(req,res)=>{
 const resource = req.query?.resource || new URL(req.url, "https://tgheritage.vercel.app").searchParams.get("resource");
 if (resource === "memories") return memoriesApi(req,res);
 method(req,res,["GET","POST"]);
 if(req.method==="GET"){
  const data=await getDb().select({id:stories.id,title:stories.title,body:stories.body,language:stories.language,createdAt:stories.createdAt})
   .from(stories).where(eq(stories.status,"published")).orderBy(desc(stories.createdAt)).limit(50);
  return sendJson(res,200,{count:data.length,data});
 }
 const c=await context(req);roles(c,["contributor","admin"]);
 const b=body(req),title=text(b.title,"title",3,120),content=text(b.body,"body",20,8000);
 const language=b.language===undefined?"en":text(b.language,"language",2,12);
 if(!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(language))throw new HttpError(400,"INVALID_LANGUAGE","Use a language code such as en or te.");
 await consume(c.db,c.userId,"story-submit",5,3600);
 const [created]=await c.db.insert(stories).values({authorUserId:c.userId,title,body:content,language,status:"pending"})
  .returning({id:stories.id,status:stories.status,createdAt:stories.createdAt});
 return sendJson(res,201,{message:"Story received and pending moderator review.",data:created});
});
