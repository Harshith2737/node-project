"use strict";
const {api,method,sendJson}=require("../../src/shared/http");
module.exports=api(async(req,res)=>{
 method(req,res,["GET","HEAD"]);
 const key=process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY||"";
 return sendJson(res,200,{authEnabled:key.startsWith("pk_"),publishableKey:key.startsWith("pk_")?key:null});
});
