"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const state = { memories: [], objectUrls: new Map(), observer: null, loading: false };
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    if (className) node.className = className;
    return node;
  };

  function status(message, isError = false) {
    const target = $("#memoryUploadStatus");
    if (!target) return;
    target.textContent = message;
    target.classList.toggle("is-error", isError);
  }

  function revokeUrls() {
    for (const url of state.objectUrls.values()) URL.revokeObjectURL(url);
    state.objectUrls.clear();
  }

  function lockedView(signedIn) {
    $("#memoryLocked").hidden = signedIn;
    $("#memoryWorkspace").hidden = !signedIn;
    if (!signedIn) {
      state.observer?.disconnect();
      state.observer = null;
      revokeUrls();
      state.memories = [];
      const empty = el("div", "", "memory-empty");
      empty.append(el("span", "üîê"), el("h3", "Sign in to see your saved moments"), el("p", "Your photos will appear here after you sign in."));
      $("#memoryGallery").replaceChildren(empty);
      $("#memoryCount").textContent = "0";
      $("#memoryPlaceCount").textContent = "0 places";
    }
  }

  async function api(url, options) {
    if (!window.HeritageAuth?.isSignedIn()) throw new Error("Sign in to continue.");
    const response = await ∂ªßq´^