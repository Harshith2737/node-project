"use strict";
const { verifyToken } = require("@clerk/backend");
const { eq } = require("drizzle-orm");
const { getDb } = require("../db");
const { userProfiles } = require("../db/schema");
const { HttpError } = require("../shared/http");
const { clerkKeysAreValid } = require("./keys");

function authorizedParties(){
  const out=String(process.env.APP_ORIGINS||"").split(",").map(x=>x.trim()).filter(Boolean);
  for(const host of [process.env.VERCEL_URL,process.env.VERCEL_BRANCH_URL]){
    if(host&&/^[a-z0-9.-]+$/i.test(host))out.push("https://"+host);
  }
  return [...new Set(out)];
}
async function authenticate(req){
  const match=/^Bearer\\s+(.+)$/i.exec(req.headers?.authorization||"");
  if(!match)throw new HttpError(401,"AUTH_REQUIRED","Sign in to continue.");
  if(!clerkKeysAreValid())throw new HttpError(503,"AUTH_NOT_CONFIGURED","Authentication requires a matching Clerk key pair for this environment.");
  const parties=authorizedParties();
  if(!parties.length)throw new HttpError(503,"AUTH_ORIGINS_NOT_CONFIGURED","Application origins are not configured.");
  try{
    const token=await verifyToken(match[1],{secretKey:process.env.CLERK_SECRET_KEY,authorizedParties:parties});
    if(!token.sub)throw new Error("Missing subject");
    return token.sub;
  }catch{throw new HttpError(401,"INVALID_SESSION","Session is invalid or expired. Sign in again.");}
}
async function context(req){
  const userId=await authenticate(req),db=getDb();
  await db.insert(userProfiles).values({clerkUserId:userId,role:"tourist"}).onConflictDoNothing();
  const [profile]=await db.select().from(userProfiles).where(eq(userProfiles.clerkUserId,userId)).limit(1);
  if(!profile)throw new HttpError(500,"PROFILE_UNAVAILABLE","Profile unavailable.");
  return {userId,profile,db};
}
function roles(ctx,allowed){if(!allowed.includes(ctx.profile.role))throw new HttpError(403,"INSUFFICIENT_ROLE","Your account does not have permission.");}
module.exports={context,roles,authorizedParties};
