"use strict";
const {api,method,sendJson}=require("../../src/shared/http");
const {clerkKeysAreValid}=require("../../src/auth/keys");

module.exports=api(async(req,res)=>{
  method(req,res,["GET","HEAD"]);
  const authEnabled=clerkKeysAreValid();
  const publishableKey=authEnabled
    ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    : null;
  return sendJson(res,200,{authEnabled,publishableKey});
});
