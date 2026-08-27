const DEFAULT_RATING = "5";
const DEFAULT_FEEDBACK = "N/A";

const form = document.getElementById("ratingForm");
const feedbackInput = document.getElementById("feedback");
const fillCurrentBtn = document.getElementById("fillCurrentBtn");
const submitAllBtn = document.getElementById("submitAllBtn");
const statusText = document.getElementById("status");
const pageStateText = document.getElementById("pageState");

function getStoredSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["Rating", "Feedback"], function (result) {
      resolve({
        rating: result.Rating || DEFAULT_RATING,
        feedback: result.Feedback || DEFAULT_FEEDBACK
      });
    });
  });
}

function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      Rating: settings.rating,
      Feedback: settings.feedback
    }, resolve);
  });
}

function sendCommand(command, settings) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: "IUT_EVALUATION_COMMAND",
      command,
      settings
    }, function (response) {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }

      resolve(response || { ok: false, error: "No response received." });
    });
  });
}

function getSelectedSettings() {
  const checkedRating = document.querySelector('input[name="rating"]:checked');
  return {
    rating: checkedRating ? checkedRating.value : DEFAULT_RATING,
    feedback: feedbackInput.value.trim() || DEFAULT_FEEDBACK
  };
}

function setStatus(message, type = "info") {
  statusText.textContent = message;
  statusText.dataset.type = type;
}

function setBusy(isBusy) {
  fillCurrentBtn.disabled = isBusy || fillCurrentBtn.dataset.available !== "true";
  submitAllBtn.disabled = isBusy || submitAllBtn.dataset.available !== "true";
  form.setAttribute("aria-busy", String(isBusy));
}

function setAvailability(state) {
  const canFill = state && state.page === "course";
  const canSubmitAll = state && state.page === "list" && state.courseCount > 0;

  fillCurrentBtn.dataset.available = String(canFill);
  submitAllBtn.dataset.available = String(canSubmitAll);
  fillCurrentBtn.disabled = !canFill;
  submitAllBtn.disabled = !canSubmitAll;

  if (!state || state.page === "unsupported") {
    pageStateText.textContent = "Open an SIS evaluation page.";
    return;
  }

  if (state.page === "course") {
    pageStateText.textContent = "Ready to submit this course.";
    return;
  }

  pageStateText.textContent = state.courseCount === 1
    ? "1 course link found."
    : `${state.courseCount} course links found.`;
}

async function initialize() {
  const settings = await getStoredSettings();
  const ratingInput = document.querySelector(`input[name="rating"][value="${settings.rating}"]`);
  (ratingInput || document.querySelector(`input[name="rating"][value="${DEFAULT_RATING}"]`)).checked = true;
  feedbackInput.value = settings.feedback;

  const pageState = await sendCommand("getPageState");
  if (pageState.ok) {
    setAvailability(pageState);
    if (pageState.page === "unsupported") {
      setStatus("Open the SIS evaluation list or a course evaluation page.", "error");
    } else {
      setStatus("Ready.");
    }
  } else {
    setAvailability({ page: "unsupported" });
    setStatus(pageState.error, "error");
  }
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  const settings = getSelectedSettings();
  await saveSettings(settings);

  setBusy(true);
  setStatus("Filling and submitting current course...");
  const response = await sendCommand("submitCurrent", settings);
  setBusy(false);

  if (!response.ok) {
    setStatus(response.error || "Could not submit the current course.", "error");
    return;
  }

  setStatus(
    `Submitted current course. Returning to evaluation list...`,
    "success"
  );
});

submitAllBtn.addEventListener("click", async function () {
  const settings = getSelectedSettings();
  await saveSettings(settings);

  setBusy(true);
  setStatus("Submitting listed courses...");
  const response = await sendCommand("submitAll", settings);
  setBusy(false);

  if (!response.ok) {
    setStatus(response.error || "Could not submit listed courses.", "error");
    return;
  }

  const failedText = response.failedCount > 0 ? ` ${response.failedCount} failed.` : "";
  setStatus(`Submitted ${response.successCount}/${response.totalCount} courses.${failedText}`, "success");
});

initialize();
