"use strict";
const {getDb}=require("../src/db");
const {userProfiles}=require("../src/db/schema");
async function main(){
 const id=process.env.INITIAL_ADMIN_CLERK_USER_ID;
 if(!id||!/^user_[A-Za-z0-9]+$/.test(id))throw new Error("Set INITIAL_ADMIN_CLERK_USER_ID to the verified Clerk account ID.");
 await getDb().insert(userProfiles).values({clerkUserId:id,role:"admin"})
 .onConflictDoUpdate({target:userProfiles.clerkUserId,set:{role:"admin",updatedAt:new Date()}});
 console.log("Initial administrator role assigned.");
}
main().catch(error=>{console.error("Admin bootstrap failed:",error.message);process.exitCode=1;});
