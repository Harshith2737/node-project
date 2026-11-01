"use strict";
const {api,method,sendJson}=require("../../src/shared/http");
const {context}=require("../../src/auth/identity");
module.exports=api(async(req,res)=>{
 method(req,res,["GET"]);const c=await context(req);
 return sendJson(res,200,{user:{id:c.userId,role:c.profile.role,createdAt:c.profile.createdAt}});
});
