"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const config=require("../api/v1/config");
const me=require("../api/v1/me");
const stories=require("../api/v1/stories");
const reports=require("../api/v1/reports");
const trips=require("../api/v1/trips");
const submissions=require("../api/v1/submissions");
const contributorRequests=require("../api/v1/contributor-requests");
const adminRouter=require("../src/routes/admin");
const queue=require("../src/routes/admin/queue");
const moderateStory=require("../src/routes/admin/stories");
const moderateReport=require("../src/routes/admin/reports");
const reviewContributor=require("../src/routes/admin/contributor-requests");
const updateRole=require("../src/routes/admin/users");
const {authorizedParties,roles}=require("../src/auth/identity");

function response(){return{
  headers:{},statusCode:200,body:null,
  setHeader(name,value){this.headers[name.toLowerCase()]=value;},
  status(code){this.statusCode=code;return this;},
  json(value){this.body=value;return this;}
};}
async function invoke(handler,method,query={},body){
 const res=response();
 await handler({method,query,body,headers:{}},res);
 return res;
}
async function withEnv(values,fn){
 const old={};
 for(const [key,value] of Object.entries(values)){
  old[key]=process.env[key];
  if(value===undefined)delete process.env[key];else process.env[key]=value;
 }
 try{return await fn();}
 finally{for(const [key,value] of Object.entries(old)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
}

test("public Clerk configuration exposes only the publishable key",async()=>{
 await withEnv({NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:"pk_test_public",CLERK_SECRET_KEY:"sk_test_private"},async()=>{
  const res=await invoke(config,"GET");
  assert.equal(res.statusCode,200);
  assert.equal(res.body.authEnabled,true);
  assert.equal(res.body.publishableKey,"pk_test_public");
  assert.equal(JSON.stringify(res.body).includes("sk_test_private"),false);
  assert.equal(res.headers["cache-control"],"no-store");
 });
});

test("all protected endpoints reject requests without a bearer token",async()=>{
 const cases=[
  [me,"GET"],
  [stories,"POST",{}, {title:"A valid story",body:"A sufficiently long story body for the protected endpoint."}],
  [stories,"GET",{resource:"memories"}],
  [stories,"GET",{resource:"memories",id:"11111111-1111-4111-8111-111111111111"}],
  [stories,"POST",{resource:"memories"},{imageDataUrl:"data:image/jpeg;base64,/9j/2Q=="}],
  [stories,"DELETE",{resource:"memories",id:"11111111-1111-4111-8111-111111111111"}],
  [reports,"POST",{}, {destinationSlug:"charminar",issueType:"litter",description:"Waste needs attention near the visitor entrance."}],
  [trips,"GET"],
  [submissions,"GET"],
  [contributorRequests,"POST",{}, {reason:"I can contribute local history and useful community knowledge."}],
  [queue,"GET"],
  [moderateStory,"PATCH",{id:"11111111-1111-4111-8111-111111111111"},{status:"published"}],
  [moderateReport,"PATCH",{id:"11111111-1111-4111-8111-111111111111"},{status:"resolved"}],
  [reviewContributor,"PATCH",{id:"11111111-1111-4111-8111-111111111111"},{status:"approved"}],
  [updateRole,"PATCH",{userId:"user_123456789"},{role:"contributor"}]
 ];
 for(const [handler,verb,query,payload] of cases){
  const res=await invoke(handler,verb,query,payload);
  assert.equal(res.statusCode,401,verb+" endpoint must require Clerk authentication");
  assert.equal(res.body.error,"AUTH_REQUIRED");
 }
});

test("consolidated admin router preserves protected route dispatch",async()=>{
 const id="11111111-1111-4111-8111-111111111111";
 const cases=[
  ["GET",["queue"]],
  ["PATCH",["stories",id]],
  ["PATCH",["reports",id]],
  ["PATCH",["contributor-requests",id]],
  ["PATCH",["users","user_123456789"]]
 ];
 for(const [verb,path] of cases){
  const res=await invoke(adminRouter,verb,{path},{status:"published",role:"contributor"});
  assert.equal(res.statusCode,401,verb+" /admin/"+path.join("/")+" must still require authentication");
  assert.equal(res.body.error,"AUTH_REQUIRED");
 }
 const missing=await invoke(adminRouter,"GET",{path:["unknown"]});
 assert.equal(missing.statusCode,404);
});

test("admin router dispatches catch-all routes from the canonical request URL",async()=>{
 const id="11111111-1111-4111-8111-111111111111";
 const cases=[
  ["GET","/api/v1/admin/queue"],
  ["PATCH","/api/v1/admin/stories/"+id],
  ["PATCH","/api/v1/admin/reports/"+id],
  ["PATCH","/api/v1/admin/contributor-requests/"+id],
  ["PATCH","/api/v1/admin/users/user_123456789"]
 ];
 for(const [verb,url] of cases){
  const res=response();
  await adminRouter({method:verb,url,query:{},body:{status:"published",role:"contributor"},headers:{}},res);
  assert.equal(res.statusCode,401,verb+" "+url+" must dispatch to an authenticated handler");
  assert.equal(res.body.error,"AUTH_REQUIRED");
 }
});

test("write endpoints reject invalid methods before database access",async()=>{
 const report=await invoke(reports,"GET");
 assert.equal(report.statusCode,405);
 assert.equal(report.headers.allow,"POST");
 const story=await invoke(stories,"DELETE");
 assert.equal(story.statusCode,405);
 assert.equal(story.headers.allow,"GET, POST");
});

test("Clerk authorized parties use exact configured origins and Vercel hosts",async()=>{
 await withEnv({
  APP_ORIGINS:"https://heritage.example, https://preview.example",
  VERCEL_URL:"heritage-git-preview.vercel.app",
  VERCEL_BRANCH_URL:"heritage-preview.vercel.app"
 },async()=>{
  assert.deepEqual(authorizedParties(),[
   "https://heritage.example","https://preview.example",
   "https://heritage-git-preview.vercel.app","https://heritage-preview.vercel.app"
  ]);
 });
});

test("server-side role check rejects unprivileged users",()=>{
 assert.throws(()=>roles({profile:{role:"tourist"}},["moderator","admin"]),
  error=>error.statusCode===403&&error.code==="INSUFFICIENT_ROLE");
 assert.doesNotThrow(()=>roles({profile:{role:"admin"}},["moderator","admin"]));
});
