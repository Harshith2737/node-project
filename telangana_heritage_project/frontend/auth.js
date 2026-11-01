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
    const login = document.getElementById("loginButton");
    const user = document.getElementById("userButtonContainer");
    const activity = document.getElementById("activityButton");
    const review = document.getElementById("reviewQueueButton");
    if (!login || !user || !clerk) return;

    const signedIn = Boolean(clerk.isSignedIn);
    if (lastSignedInState !== signedIn) {
      lastSignedInState = signedIn;
      document.dispatchEvent(new CustomEvent("heritage-auth-state", { detail: { signedIn } }));
    }
    login.hidden = signedIn;
    user.hidden = !signedIn;
    if (activity) activity.hidden = !signedIn;
    if (review) review.hidden = !signedIn ||
      !currentProfile || !["moderator", "admin"].includes(currentProfile.role);

    if (signedIn && !mountedUserButton) {
      const mountPoint = document.createElement("div");
      user.replaceChildren(mountPoint);
      clerk.mountUserButton(mountPoint);
      mountedUserButton = true;
    } else if (!signedIn && mountedUserButton) {
      user.replaceChildren();
      mountedUserButton = false;
      currentProfile = null;
    }
  }

  async function init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      try {
        const response = await fetch("/api/v1/config", {
          headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error("Authentication configuration is unavailable.");
        const config = await response.json();
        const publishableKey = config.publishableKey;
        if (!config.authEnabled || typeof publishableKey !== "string" ||
            !publishableKey.startsWith("pk_")) return false;

        const encodedDomain = publishableKey.split("_")[2];
        if (!encodedDomain) throw new Error("Invalid Clerk publishable key.");
        const domain = atob(encodedDomain).replace(/\$$/, "");
        if (!/^[a-z0-9.-]+$/i.test(domain)) throw new Error("Invalid Clerk application domain.");

        const frontendApi = "https://" + domain + "/npm/";
        await loadScript(frontendApi + "@clerk/ui@1.42.2/dist/ui.browser.js");
        await loadScript(frontendApi + "@clerk/clerk-js@6.42.1/dist/clerk.browser.js", {
          "data-clerk-publishable-key": publishableKey
        });

        clerk = window.Clerk || null;
        if (!clerk || typeof clerk.load !== "function") {
          throw new Error("Clerk browser SDK did not initialise.");
        }
        await clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });
        if (typeof clerk.addListener === "function") {
          clerk.addListener(() => {
            refreshHeader();
            void syncProfile();
          });
        }
        refreshHeader();
        void syncProfile();
        return true;
      } catch (error) {
        console.error("Authentication initialisation:", error.message);
        return false;
      }
    })();
    return initPromise;
  }

  async function apiFetch(url, options = {}) {
    if (!await init() || !clerk) throw new Error("Sign-in is not configured yet.");
    const token = await clerk.session?.getToken();
    if (!token) throw new Error("Sign in to continue.");
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", "Bearer " + token);
    if (options.body) headers.set("Content-Type", "application/json");
    return fetch(url, { ...options, headers });
  }

  async function getProfile() {
    const response = await apiFetch("/api/v1/me");
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "Profile could not be loaded.");
    return payload.user;
  }

  async function syncProfile() {
    if (!clerk || !clerk.isSignedIn) {
      currentProfile = null;
      refreshHeader();
      return;
    }
    try {
      currentProfile = await getProfile();
    } catch (error) {
      currentProfile = null;
      console.warn("Profile sync:", error.message);
    }
    refreshHeader();
  }

  async function mountSignIn(target) {
    if (!await init() || !clerk) return false;
    clerk.mountSignIn(target);
    return true;
  }

  window.HeritageAuth = {
    init,
    apiFetch,
    getProfile,
    syncProfile,
    mountSignIn,
    isSignedIn: () => Boolean(clerk && clerk.isSignedIn)
  };

  void init();
})();
