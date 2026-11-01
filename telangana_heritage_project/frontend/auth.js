"use strict";

(() => {
  let clerk = null;
  let initPromise = null;
  let mountedUserButton = false;
  let currentProfile = null;
  let lastSignedInState = null;

  function loadScript(src, attributes = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      Object.entries(attributes).forEach(([key, value]) => script.setAttribute(key, value));
      script.onload = resolve;
      script.onerror = () => reject(new Error("Clerk authentication UI could not be loaded."));
      document.head.appendChild(script);
    });
  }

  function refreshHeader() {
    const signedIn = Boolean(clerk && clerk.isSignedIn);
    if (lastSignedInState !== signedIn) {
      lastSignedInState = signedIn;
      document.dispatchEvent(new CustomEvent("heritage-auth-state", { detail: { signedIn } }));
    }
    const login = document.getElementById("loginButton");
    const user = document.getElementById("userButtonContainer");
    const activity = document.getElementById("activityButton");
    const review = document.getElementById("reviewQueueButton");
    if (!login || !user || !clerk) return;

    login.hidden = signedIn;
    user.hidden = !signedIn;
    if (activity) activity.hidden = !signedIn;
    if (review) review.hidden = !signedIn ||
      !currentProfile || !["moderator", "admin"].includes(currentProfile.role);

    if (signedIn && !mountedUs¶»§q«^