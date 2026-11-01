"use strict";

(() => {
  const $ = (selector) => document.querySelector(selector);
  const element = (tag, text, className) => {
    const item = document.createElement(tag);
    if (text !== undefined) item.textContent = text;
    if (className) item.className = className;
    return item;
  };
  const modal = $("#modal");
  const modalContent = $("#modalContent");
  const originalOpenModal = window.openModal;
  const show = (content) => {
    modalContent.replaceChildren(content);
    modal.style.display = "grid";
    $("#modal .close")?.focus();
  };
  const formStatus = (form) => {
    const state = element("p", "", "form-status");
    state.setAttribute("aria-live", "polite");
    form.append(state);
    return state;
  };
  const setStatus = (state, message, isError = false) => {
    state.textContent = message;
    state.classList.toggle("is-error", isError);
  };
  const field = (form, caption, id, control) => {
    const label = element("label", caption, "form-label");
    label.htmlFor = id;
    control.id = id;
    control.name = id;
    form.append(label, control);
    return control;
  };
  async function api(url, options = {}) {
    if (!window.HeritageAuth?.isSignedIn()) throw new Error("Sign in to continue.");
    const response = await window.HeritageAuth.apiFetch(url, options);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "The request could not be completed.");
    return payload;
  }
  function signInPrompt(parent, message) {
    parent.append(element("p", message));
    const button = element("button", "Sign in", "primary");
    button.type = "button";
    button.addEventListener("click", () => window.openModal("login"));
    parent.append(button);
  }

  async function signIn() {
    const content = element("div");
    content.append(
      element("h2", "Welcome"),
      element("p", "Sign in or create an account to save trips, report issues and contribute to the culture archive.")
    );
    const mount = element("div", undefined, "clerk-sign-in");
    content.append(mount);
    show(content);
    const ready = await window.HeritageAuth?.mountSignIn(mount);
    if (!ready) mount.append(element("p", "Sign-in is unavailable until Clerk is configured for this domain.", "empty-state"));
  }

  async function archive() {
    const content = element("div");
    content.append(element("h2", "Community Culture Archive"),
      element("p", "Only moderator-approved community stories appear here."));
    const list = element("div", undefined, "archive-list");
    content.append(list);
    show(content);
    try {
      const response = await fetch("/api/v1/stories", { headers: { Accept: "application/json" } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Archive is unavailable.");
      if (!payload.data?.length) list.append(element("p", "No community stories have been approved yet.", "empty-state"));
      (payload.data || []).forEach((story) => {
        const card = element("article", undefined, "archive-story");
        card.append(element("h3", story.title), element("p", story.body),
          element("small", "Language: " + story.language));
        list.append(card);
      });
    } catch (error) {
      list.append(element("p", error.message, "empty-state"));
    }
  }

  async function storyForm() {
    const content = element("div");
    content.append(element("h2", "Contribute a Community Story"));
    show(content);
    if (!window.HeritageAuth?.isSignedIn()) {
      signInPrompt(content, "Sign in to request contributor access or submit a story.");
      return;
    }

    try {
      const profile = await window.HeritageAuth.getProfile();
      const form = element("form", undefined, "stacked-form");
      if (!["contributor", "admin"].includes(profile.role)) {
        content.append(element("p", "Community stories are reviewed before publication. Request contributor access to submit a story."));
        const reason = field(form, "Why would you like to contribute?", "contributorReason", element("textarea"));
        reason.rows = 4;
        reason.minLength = 20;
        reason.maxLength = 1000;
        reason.required = true;
        const submit = element("button", "Request contributor access", "primary full");
        submit.type = "submit";
        const state = formStatus(form);
        form.append(submit);
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          submit.disabled = true;
          setStatus(state, "Sending request…");
          try {
            const result = await api("/api/v1/contributor-requests", {
              method: "POST", body: JSON.stringify({ reason: reason.value })
            });
            form.replaceChildren(element("p", result.message, "success-message"));
          } catch (error) {
            setStatus(state, error.message, true);
            submit.disabled = false;
          }
        });
      } else {
        const title = field(form, "Story title", "storyTitle", element("input"));
        title.minLength = 3; title.maxLength = 120; title.required = true;
        const language = field(form, "Language", "storyLanguage", element("select"));
        [["en","English"],["te","Telugu"],["hi","Hindi"],["ur","Urdu"]].forEach(([value,label]) => {
          const option = element("option", label); option.value = value; language.append(option);
        });
        const body = field(form, "Story", "storyBody", element("textarea"));
        body.rows = 7; body.minLength = 20; body.maxLength = 8000; body.required = true;
        const submit = element("button", "Submit for moderation", "primary full");
        submit.type = "submit";
        const state = formStatus(form);
        form.append(submit);
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          submit.disabled = true;
          setStatus(state, "Submitting story…");
          try {
            const result = await api("/api/v1/stories", {
              method: "POST",
              body: JSON.stringify({ title: title.value, body: body.value, language: language.value })
            });
            form.replaceChildren(element("p", result.message, "success-message"));
          } catch (error) {
            setStatus(state, error.message, true);
            submit.disabled = false;
          }
        });
      }
      content.append(form);
    } catch (error) {
      content.append(element("p", error.message, "empty-state"));
    }
  }

  async function reportForm() {
    const content = element("div");
    content.append(element("h2", "Report a Heritage Issue"));
    show(content);
    if (!window.HeritageAuth?.isSignedIn()) {
      signInPrompt(content, "Sign in to create a preservation report and track its status.");
      return;
    }
    const form = element("form", undefined, "stacked-form");
    const destination = field(form, "Destination", "reportDestination", element("select"));
    try {
      const response = await fetch("/api/v1/destinations");
      const payload = await response.json();
      (payload.data || []).forEach((place) => {
        const option = element("option", place.name + " — " + place.district);
        option.value = place.slug;
        destination.append(option);
      });
    } catch {}
    const issue = field(form, "Issue type", "reportIssueType", element("select"));
    [["litter","Litter or waste"],["vandalism","Vandalism"],["damage","Site damage"],
      ["accessibility","Accessibility concern"],["safety","Visitor safety concern"],["other","Other issue"]]
      .forEach(([value,label]) => {
        const option = element("option", label); option.value = value; issue.append(option);
      });
    const description = field(form, "Description", "reportDescription", element("textarea"));
    description.rows = 5; description.minLength = 10; description.maxLength = 2000; description.required = true;
    const submit = element("button", "Send report", "primary full");
    submit.type = "submit";
    const state = formStatus(form);
    form.append(submit);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      submit.disabled = true;
      setStatus(state, "Sending report…");
      try {
        const result = await api("/api/v1/reports", {
          method: "POST",
          body: JSON.stringify({ destinationSlug: destination.value, issueType: issue.value, description: description.value })
        });
        form.replaceChildren(element("p", result.message, "success-message"),
          element("small", "Reference: " + result.data.id));
      } catch (error) {
        setStatus(state, error.message, true);
        submit.disabled = false;
      }
    });
    content.append(form);
  }

  async function activity() {
    const content = element("div");
    content.append(element("h2", "My Activity"));
    show(content);
    if (!window.HeritageAuth?.isSignedIn()) {
      signInPrompt(content, "Sign in to view your saved trips and heritage submissions.");
      return;
    }
    try {
      const result = await api("/api/v1/submissions");
      const sections = [
        ["Saved trips", result.trips || [], item => item.title + " · " + item.destination],
        ["Heritage reports", result.reports || [], item => item.issueType + " · " + item.status],
        ["Community stories", result.stories || [], item => item.title + " · " + item.status],
        ["Contributor requests", result.contributorRequests || [], item => "Contributor access · " + item.status]
      ];
      sections.forEach(([title,items,summary]) => {
        const section = element("section");
        section.append(element("h3", title));
        if (!items.length) section.append(element("p", "Nothing here yet.", "muted"));
        items.forEach(item => section.append(element("p", summary(item), "activity-row")));
        content.append(section);
      });
    } catch (error) {
      content.append(element("p", error.message, "empty-state"));
    }
  }

  async function reviewQueue() {
    const content = element("div");
    content.append(element("h2", "Moderation Review Queue"));
    const list = element("div", undefined, "review-queue");
    content.append(list);
    show(content);
    try {
      const result = await api("/api/v1/admin/queue");
      const groups = [
        ["Stories", result.stories || [], item => item.title, item => item.body, "stories",
          [["Approve","published"],["Reject","rejected"]]],
        ["Heritage reports", result.reports || [], item => item.destinationSlug + " · " + item.issueType,
          item => item.description, "reports",
          [["Triage","triaged"],["Resolve","resolved"],["Reject","rejected"]]],
        ["Contributor requests", result.contributorRequests || [], () => "Contributor access",
          item => item.reason, "contributor-requests",
          [["Approve","approved"],["Reject","rejected"]]]
      ];
      let count = 0;
      groups.forEach(([heading,items,title,description,path,actions]) => {
        const section = element("section");
        section.append(element("h3", heading));
        if (!items.length) section.append(element("p", "No items awaiting review.", "muted"));
        items.forEach(item => {
          count += 1;
          const card = element("article", undefined, "review-item");
          card.append(element("h4", title(item)), element("p", description(item)));
          actions.forEach(([label,status]) => {
            const button = element("button", label, "secondary");
            button.type = "button";
            button.addEventListener("click", async () => {
              button.disabled = true;
              try {
                await api("/api/v1/admin/" + path + "/" + encodeURIComponent(item.id), {
                  method: "PATCH", body: JSON.stringify({ status })
                });
                card.replaceChildren(element("p", "Review updated.", "success-message"));
              } catch (error) {
                card.append(element("p", error.message, "form-status is-error"));
                button.disabled = false;
              }
            });
            card.append(button);
          });
          section.append(card);
        });
        list.append(section);
      });
      if (!count) list.append(element("p", "Review queue is clear.", "success-message"));
    } catch (error) {
      list.append(element("p", error.message, "empty-state"));
    }
  }

  function saveTripButton() {
    const oldGenerate = window.generateTrip;
    if (typeof oldGenerate !== "function") return;
    window.generateTrip = () => {
      oldGenerate();
      const itinerary = $("#itinerary");
      if (!itinerary || itinerary.querySelector("[data-save-trip]")) return;
      const button = element("button", "Save itinerary to my account", "primary");
      button.type = "button";
      button.dataset.saveTrip = "true";
      button.addEventListener("click", async () => {
        if (!window.HeritageAuth?.isSignedIn()) {
          window.openModal("login");
          return;
        }
        const entries = [...itinerary.querySelectorAll(".day")].map((day,index) => ({
          day: day.querySelector("b")?.textContent || "Day " + (index + 1),
          title: day.querySelector("strong")?.textContent || "Visit",
          details: day.querySelector("p")?.textContent || "Visit responsibly."
        }));
        if (!entries.length) {
          alert("Generate an itinerary first.");
          return;
        }
        button.disabled = true;
        try {
          const duration = Number.parseInt($("#tripDays").value, 10);
          const result = await api("/api/v1/trips", {
            method: "POST",
            body: JSON.stringify({
              destination: $("#tripDestination").value,
              durationDays: duration,
              interest: $("#tripInterest").value,
              itinerary: entries
            })
          });
          itinerary.append(element("p", result.message, "success-message"));
        } catch (error) {
          itinerary.append(element("p", error.message, "form-status is-error"));
          button.disabled = false;
        }
      });
      itinerary.append(button);
    };
  }

  window.openModal = (type) => {
    const handlers = {
      login: signIn,
      archive,
      story: storyForm,
      report: reportForm,
      activity,
      review: reviewQueue
    };
    if (handlers[type]) {
      void handlers[type]();
      return;
    }
    if (typeof originalOpenModal === "function") originalOpenModal(type);
  };
  saveTripButton();
  void window.HeritageAuth?.init();
})();
