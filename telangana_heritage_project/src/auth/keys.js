"use strict";

function clerkKeysAreValid(env = process.env) {
  const publishableKey = typeof env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string"
    ? env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    : "";
  const secretKey = typeof env.CLERK_SECRET_KEY === "string"
    ? env.CLERK_SECRET_KEY
    : "";

  const livePair = publishableKey.startsWith("pk_live_") &&
    secretKey.startsWith("sk_live_");
  const testPair = publishableKey.startsWith("pk_test_") &&
    secretKey.startsWith("sk_test_");

  return livePair || (env.VERCEL_ENV !== "production" && testPair);
}

module.exports = { clerkKeysAreValid };
