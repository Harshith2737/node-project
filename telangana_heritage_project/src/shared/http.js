"use strict";
class HttpError extends Error { constructor(statusCode,code,message){super(message);this.statusCode=statusCode;this.code=code;} }
function sendJson(res,code,data){
  res.setHeader("Content-Type","application/json; charset=utf-8");
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  return res.status(code).json(data);
}
function method(req,res,allowed){
  if(!allowed.includes(req.method)){res.setHeader("Allow",allowed.join(", "));throw new HttpError(405,"METHOD_NOT_ALLOWED","Method not allowed.");}
}
function body(req){
  const length=Number(req.headers?.["content-length"]||0);
  if(length>32768)throw new HttpError(413,"PAYLOAD_TOO_LARGE","Request must be 32 KB or smaller.");
  let value=req.body;
  if(typeof value==="string"){try{value=JSON.parse(value);}catch{throw new HttpError(400,"INVALID_JSON","Body must be valid JSON.");}}
  if(!value||typeof value!=="object"||Array.isArray(value))throw new HttpError(400,"INVALID_BODY","A JSON object is required.");
  if(Buffer.byteLength(JSON.stringify(value),"utf8")>32768)throw new HttpError(413,"PAYLOAD_TOO_LARGE","Request must be 32 KB or smaller.");
  return value;
}
function text(value,field,min,max){
  if(typeof value!=="string")throw new HttpError(400,"INVALID_FIELD",field+" must be text.");
  const normalized=value.trim();
  if(normalized.length<min||normalized.length>max)throw new HttpError(400,"INVALID_FIELD",field+" must be "+min+" to "+max+" characters.");
  return normalized;
}
function api(handler){
  return async(req,res)=>{try{return await handler(req,res);}catch(error){
    const code=Number.isInteger(error.statusCode)?error.statusCode:500;
    if(code>=500)console.error("API error",{requestId:req.headers?.["x-vercel-id"]||null,code:error.code||"INTERNAL_ERROR"});
    return sendJson(res,code,{error:error.code||"INTERNAL_ERROR",message:code>=500?"Request could not be completed.":error.message});
  }};
}
module.exports={HttpError,sendJson,method,body,text,api};
