// Chrome/Edge expose `chrome`; Firefox exposes `browser`. Both support promises through this handle.
const ext = globalThis.browser ?? globalThis.chrome;

const DEFAULT_RATING = "5";
const DEFAULT_FEEDBACK = "N/A";
const COMMAND_TYPE = "IUT_EVALUATION_COMMAND";

const form = document.getElementById("ratingForm");
const feedbackInput = document.getElementById("feedback");
const autoFillInput = document.getElementById("autoFill");
const fillCurrentBtn = document.getElementById("fillCurrentBtn");
const fillTextBtn = document.getElementById("fillTextBtn");
const submitAllBtn = document.getElementById("submitAllBtn");
const statusText = document.getElementById("status");
const pageStateText = document.getElementById("pageState");

const actionButtons = [fillCurrentBtn, fillTextBtn, submitAllBtn];

async function getStoredSettings() {
  const result = await ext.storage.local.get(["Rating", "Feedback", "AutoFillText"]);
  return {
    rating: result.Rating || DEFAULT_RATING,
    feedback: result.Feedback || DEFAULT_FEEDBACK,
    autoFillText: result.AutoFillText !== false
  };
}

function saveSettings(settings) {
  return ext.storage.local.set({
    Rating: settings.rating,
    Feedback: settings.feedback,
    AutoFillText: settings.autoFillText
  });
}

// The popup talks to the page's content script directly (no background script needed),
// which keeps one code path for Chrome service workers and Firefox event pages.
async function sendCommand(command, settings) {
  try {
    const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
    if (!tab || tab.id == null) {
      return { ok: false, error: "No active tab found." };
    }

    const response = await ext.tabs.sendMessage(tab.id, {
      type: COMMAND_TYPE,
      command,
      settings
    });
    return response || { ok: false, error: "No response from the page." };
  } catch (error) {
    return {
      ok: false,
      error: "Open an IUT SIS evaluation page or reload the current SIS tab."
    };
  }
}

function getSelectedSettings() {
  const checkedRating = document.querySelector('input[name="rating"]:checked');
  return {
    rating: checkedRating ? checkedRating.value : DEFAULT_RATING,
    feedback: feedbackInput.value.trim() || DEFAULT_FEEDBACK,
    autoFillText: autoFillInput.checked
  };
}

function setStatus(message, type = "info") {
  statusText.textContent = message;
  statusText.dataset.type = type;
}

function setBusy(isBusy) {
  actionButtons.forEach((button) => {
    button.disabled = isBusy || button.dataset.available !== "true";
  });
  form.setAttribute("aria-busy", String(isBusy));
}

function setAvailability(state) {
  const canFill = Boolean(state && state.page === "course");
  const canSubmitAll = Boolean(state && state.page === "list" && state.courseCount > 0);

  fillCurrentBtn.dataset.available = String(canFill);
  fillTextBtn.dataset.available = String(canFill);
  submitAllBtn.dataset.available = String(canSubmitAll);
  fillCurrentBtn.disabled = !canFill;
  fillTextBtn.disabled = !canFill;
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
  autoFillInput.checked = settings.autoFillText;

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

// Save as you go: the popup closes the moment it loses focus, and auto-fill
// reads these saved values when the next course page loads.
feedbackInput.addEventListener("input", () => saveSettings(getSelectedSettings()));
autoFillInput.addEventListener("change", () => saveSettings(getSelectedSettings()));
document.querySelectorAll('input[name="rating"]').forEach((radio) => {
  radio.addEventListener("change", () => saveSettings(getSelectedSettings()));
});

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

  setStatus("Submitted current course. Returning to evaluation list...", "success");
});

fillTextBtn.addEventListener("click", async function () {
  const settings = getSelectedSettings();
  await saveSettings(settings);

  setBusy(true);
  const response = await sendCommand("fillText", settings);
  setBusy(false);

  if (!response.ok) {
    setStatus(response.error || "Could not fill the text boxes.", "error");
    return;
  }

  setStatus(
    response.feedbackCount === 1
      ? "Filled 1 text box."
      : `Filled ${response.feedbackCount} text boxes.`,
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
