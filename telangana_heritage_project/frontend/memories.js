"use strict";
(() => {
  const $ = selector => document.querySelector(selector);
  const state = { memories: [], urls: new Map(), loading: false };

  function element(tag, value, className) {
    const node = document.createElement(tag);
    if (value !== undefined && value !== null) node.textContent = value;
    if (className) node.className = className;
    return node;
  }
  function status(message, isError = false) {
    const target = $("#memoryUploadStatus");
    if (!target) return;
    target.textContent = message;
    target.classList.toggle("is-error", isError);
  }
  function clearImageUrls() {
    for (const url of state.urls.values()) URL.revokeObjectURL(url);
    state.urls.clear();
  }
  function setSignedIn(signedIn) {
    $("#memoryLocked").hidden = signedIn;
    $("#memoryWorkspace").hidden = !signedIn;
    if (signedIn) {
      void loadMemories();
    } else {
      clearImageUrls();
      state.memories = [];
      const empty = element("div", "", "memory-empty");
      empty.append(element("h3", "Your private journal"), element("p", "Sign in to see your saved moments."));
      $("#memoryGallery").replaceChildren(empty);
      $("#memoryCount").textContent = "0";
      $("#memoryPlaceCount").textContent = "Across 0 destinations";
    }
  }
  async function request(url, options = {}) {
    if (!window.HeritageAuth?.apiFetch) throw new Error("Sign-in is not ready. Please try again.");
    const response = await window.HeritageAuth.apiFetch(url, options);
    if (response.status === 401) throw new Error("Your session has expired. Please sign in again.");
    if (!response.ok) {
      const type = response.headers.get("content-type") || "";
      const body = type.includes("json") ? await response.json() : null;
      throw new Error(body?.message || "The request could not be completed.");
    }
    return response;
  }
  async function loadMemories() {
    try {
      const response = await request("/api/v1/stories?resource=memories");
      const payload = await response.json();
      state.memories = Array.isArray(payload.data) ? payload.data : [];
      render();
    } catch (error) {
      status(error.message, true);
    }
  }
  async function imageUrl(memory) {
    if (state.urls.has(memory.id)) return state.urls.get(memory.id);
    const response = await request(memory.imageUrl);
    const url = URL.createObjectURL(await response.blob());
    state.urls.set(memory.id, url);
    return url;
  }
  function render() {
    const query = ($("#memorySearch").value || "").trim().toLowerCase();
    const rows = state.memories.filter(memory =>
      [memory.caption, memory.destinationName].join(" ").toLowerCase().includes(query)
    );
    $("#memoryCount").textContent = String(state.memories.length);
    const places = new Set(state.memories.map(memory => memory.destinationName).filter(Boolean));
    $("#memoryPlaceCount").textContent = "Across " + places.size + " destinations";
    const gallery = $("#memoryGallery");
    gallery.replaceChildren();
    if (!rows.length) {
      const empty = element("div", "", "memory-empty");
      empty.append(
        element("h3", query ? "No matching memories" : "Your journal is ready"),
        element("p", query ? "Try another place or caption." : "Save your first photo above and it will appear here.")
      );
      gallery.append(empty);
      return;
    }
    for (const memory of rows) {
      const card = element("article", undefined, "memory-card");
      const photoWrap = element("div", undefined, "memory-photo-wrap");
      const image = element("img", undefined, "memory-photo");
      image.alt = memory.caption || ("Saved memory from " + (memory.destinationName || "Telangana"));
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => {
        if (image.isConnected) image.replaceWith(element("div", "Photo unavailable", "memory-photo-placeholder"));
      }, { once: true });
      photoWrap.append(image);

      const body = element("div", undefined, "memory-card-body");
      body.append(
        element("div", memory.destinationName || "TELANGANA MOMENT", "memory-place"),
        element("p", memory.caption || "A moment worth remembering", "memory-caption"),
        element("div", new Date(memory.createdAt).toLocaleDateString(undefined, {
          day: "numeric", month: "short", year: "numeric"
        }), "memory-card-date")
      );
      const actions = element("div", undefined, "memory-card-actions");
      const postcard = element("button", "Create postcard");
      postcard.type = "button";
      postcard.addEventListener("click", () => void createPostcard(memory, postcard));
      const remove = element("button", "Delete", "memory-delete");
      remove.type = "button";
      remove.addEventListener("click", () => void deleteMemory(memory, remove));
      actions.append(postcard, remove);
      body.append(actions);
      card.append(photoWrap, body);
      gallery.append(card);
      void imageUrl(memory).then(url => {
        if (image.isConnected) image.src = url;
      }).catch(() => {
        if (image.isConnected) image.replaceWith(element("div", "Photo unavailable", "memory-photo-placeholder"));
      });
    }
  }
  async function optimisePhoto(file) {
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Photo processing is unavailable in this browser.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const type of ["image/webp", "image/jpeg"]) {
        for (const quality of [0.84, 0.72, 0.60, 0.48]) {
          const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality));
          if (blob && blob.size <= 2_000_000) {
            return await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => reject(new Error("Photo could not be prepared."));
              reader.readAsDataURL(blob);
            });
          }
        }
      }
      throw new Error("This photo is too large to optimise. Try a smaller image.");
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
  async function uploadPhotos() {
    if (state.loading) return;
    const files = Array.from($("#memoryPhotos").files || []);
    if (!files.length) return status("Choose at least one photo first.", true);
    if (files.length > 10) return status("Save up to 10 photos at a time.", true);
    state.loading = true;
    const button = $("#memoryUploadButton");
    button.disabled = true;
    const caption = $("#memoryCaption").value.trim();
    const destinationName = $("#memoryDestination").value.trim();
    let saved = 0;
    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
          throw new Error("Choose JPEG, PNG or WebP photo files only.");
        }
        status("Preparing photo " + (index + 1) + " of " + files.length + "…");
        const imageDataUrl = await optimisePhoto(file);
        status("Saving photo " + (index + 1) + " of " + files.length + "…");
        await request("/api/v1/stories?resource=memories", {
          method: "POST",
          body: JSON.stringify({ imageDataUrl, caption, destinationName })
        });
        saved++;
      }
      $("#memoryPhotos").value = "";
      $("#memoryCaption").value = "";
      status(saved + (saved === 1 ? " memory saved to your private journal." : " memories saved to your private journal."));
      await loadMemories();
    } catch (error) {
      status(saved ? saved + " saved. " + error.message : error.message, true);
    } finally {
      state.loading = false;
      button.disabled = false;
    }
  }
  async function deleteMemory(memory, button) {
    if (!window.confirm("Delete this photo from your private journal?")) return;
    button.disabled = true;
    try {
      await request("/api/v1/stories?resource=memories&id=" + encodeURIComponent(memory.id), { method: "DELETE" });
      const url = state.urls.get(memory.id);
      if (url) URL.revokeObjectURL(url);
      state.urls.delete(memory.id);
      state.memories = state.memories.filter(item => item.id !== memory.id);
      render();
      status("Memory deleted.");
    } catch (error) {
      status(error.message, true);
      button.disabled = false;
    }
  }
  async function createPostcard(memory, button) {
    button.disabled = true;
    try {
      const image = new Image();
      image.src = await imageUrl(memory);
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1500;
      const context = canvas.getContext("2d");
      const scale = Math.max(canvas.width / image.naturalWidth, 1080 / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.fillStyle = "#17392f";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.beginPath();
      context.rect(0, 0, 1200, 1080);
      context.clip();
      context.drawImage(image, (1200 - width) / 2, (1080 - height) / 2, width, height);
      context.restore();
      const fade = context.createLinearGradient(0, 870, 0, 1080);
      fade.addColorStop(0, "rgba(16,43,34,0)");
      fade.addColorStop(1, "rgba(16,43,34,.85)");
      context.fillStyle = fade;
      context.fillRect(0, 850, 1200, 230);
      context.fillStyle = "#e8cf9b";
      context.font = "bold 28px Arial";
      context.fillText("TELANGANA • A MEMORY TO KEEP", 78, 1160);
      context.fillStyle = "#fff8e9";
      context.font = "bold 54px Georgia";
      context.fillText((memory.destinationName || "My Telangana Journey").slice(0, 34), 76, 1240);
      context.font = "26px Arial";
      drawCaption(context, memory.caption || "A moment worth remembering", 80, 1310, 1030, 38);
      context.fillStyle = "#b8c8b6";
      context.font = "20px Arial";
      context.fillText("EXPLORE • PRESERVE • SUSTAIN", 80, 1445);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("Postcard could not be created.");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "telangana-memory-postcard.jpg";
      link.click();
      URL.revokeObjectURL(url);
      status("Your postcard is ready.");
    } catch (error) {
      status(error.message, true);
    } finally {
      button.disabled = false;
    }
  }
  function drawCaption(context, value, x, y, maxWidth, lineHeight) {
    const words = value.split(/\s+/);
    let line = "";
    let lines = 0;
    for (const word of words) {
      const next = line ? line + " " + word : word;
      if (context.measureText(next).width > maxWidth && line) {
        context.fillText(line, x, y);
        y += lineHeight;
        lines++;
        line = word;
        if (lines >= 1) break;
      } else line = next;
    }
    if (line) context.fillText(line, x, y);
  }

  $("#memoryUploadButton")?.addEventListener("click", () => void uploadPhotos());
  $("#memorySearch")?.addEventListener("input", render);
  document.addEventListener("heritage-auth-state", event => setSignedIn(Boolean(event.detail?.signedIn)));
  if (window.HeritageAuth?.init) {
    void window.HeritageAuth.init()
      .then(() => setSignedIn(window.HeritageAuth.isSignedIn()))
      .catch(() => setSignedIn(false));
  }
})();
