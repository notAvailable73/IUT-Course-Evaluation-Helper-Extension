const DEFAULT_SETTINGS = {
  rating: "5",
  feedback: "N/A"
};

const TEXT_QUESTION_IDS = new Set([5, 7, 13, 18, 23, 27, 34, 35, 36]);
const QUESTION_COUNT = 36;
const EVALUATION_LIST_URL = "https://sis.iutoic-dhaka.edu/evaluation-list";
const COURSE_SUBMIT_SELECTOR = "#e50u > div > div > div > div > div.kt-portlet__body > div > div > div > div:nth-child(2) > div > div:nth-child(10) > button";

function normalizeSettings(settings) {
  return {
    rating: settings && settings.rating ? String(settings.rating) : DEFAULT_SETTINGS.rating,
    feedback: settings && settings.feedback ? String(settings.feedback) : DEFAULT_SETTINGS.feedback
  };
}

function dispatchInputEvents(element) {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function fillCurrentCourse(settings) {
  const normalized = normalizeSettings(settings);
  const feedbackFields = document.querySelectorAll("textarea.form-control, input.form-control[type='text']");
  const ratingFields = document.querySelectorAll(`input[type="radio"][value="${normalized.rating}"]`);

  feedbackFields.forEach((field) => {
    field.value = normalized.feedback;
    dispatchInputEvents(field);
  });

  ratingFields.forEach((field) => {
    field.click();
    dispatchInputEvents(field);
  });

  if (feedbackFields.length === 0 && ratingFields.length === 0) {
    return {
      ok: false,
      error: "No evaluation fields were found on this page."
    };
  }

  return {
    ok: true,
    feedbackCount: feedbackFields.length,
    ratingCount: ratingFields.length
  };
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function findCurrentCourseSubmitButton() {
  const exactButton = document.querySelector(COURSE_SUBMIT_SELECTOR);
  if (exactButton) {
    return exactButton;
  }

  const candidates = Array.from(document.querySelectorAll("button, input[type='submit']"));
  return candidates.find((candidate) => {
    const text = (candidate.textContent || candidate.value || "").trim().toLowerCase();
    return text === "submit" || text.includes("submit");
  }) || null;
}

async function submitCurrentCourse(settings) {
  const fillResult = fillCurrentCourse(settings);
  if (!fillResult.ok) {
    return fillResult;
  }

  await wait(150);

  const submitButton = findCurrentCourseSubmitButton();
  if (!submitButton) {
    return {
      ok: false,
      error: "Could not find the SIS submit button on this course page."
    };
  }

  if (submitButton.disabled) {
    return {
      ok: false,
      error: "The SIS submit button is disabled. Check required fields and try again."
    };
  }

  submitButton.click();

  setTimeout(() => {
    window.location.assign(EVALUATION_LIST_URL);
  }, 1200);

  return {
    ok: true,
    feedbackCount: fillResult.feedbackCount,
    ratingCount: fillResult.ratingCount,
    redirectedTo: EVALUATION_LIST_URL
  };
}

function getCourseIdFromUrl(value) {
  try {
    const url = new URL(value, window.location.href);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch (error) {
    return "";
  }
}

function getCourseLinks() {
  const links = Array.from(document.querySelectorAll(
    '.course-action a[href*="/evaluate-course/"], a[href*="/evaluate-course/"]'
  ));
  const seen = new Set();

  return links
    .map((link) => ({
      href: link.href,
      id: getCourseIdFromUrl(link.href)
    }))
    .filter((course) => {
      if (!course.id || seen.has(course.id)) {
        return false;
      }
      seen.add(course.id);
      return true;
    });
}

function getCookie(name) {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  if (!cookie) {
    return "";
  }

  return decodeURIComponent(cookie.split("=").slice(1).join("="));
}

function buildAnswers(settings) {
  const normalized = normalizeSettings(settings);
  const rating = Number(normalized.rating);

  return Array.from({ length: QUESTION_COUNT }, (_, index) => {
    const questionId = index + 1;
    return {
      question_id: questionId,
      value: TEXT_QUESTION_IDS.has(questionId) ? normalized.feedback : rating
    };
  });
}

async function submitCourse(course, settings, csrfToken, xsrfToken) {
  const response = await fetch("https://sis.iutoic-dhaka.edu/api/course-evaluate", {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrfToken || "",
      "X-XSRF-TOKEN": xsrfToken || "",
      "X-Requested-With": "XMLHttpRequest"
    },
    body: JSON.stringify({
      course_allocation_detail_id: course.id,
      answers: buildAnswers(settings)
    })
  });

  let body = null;
  try {
    body = await response.json();
  } catch (error) {
    body = await response.text().catch(() => "");
  }

  return {
    courseId: course.id,
    ok: response.ok,
    status: response.status,
    body
  };
}

async function submitAll(settings) {
  const courses = getCourseLinks();
  if (courses.length === 0) {
    return {
      ok: false,
      error: "No course evaluation links were found on this page."
    };
  }

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || "";
  const xsrfToken = getCookie("XSRF-TOKEN");

  const results = await Promise.all(
    courses.map((course) => submitCourse(course, settings, csrfToken, xsrfToken)
      .catch((error) => ({
        courseId: course.id,
        ok: false,
        status: 0,
        error: error.message
      })))
  );

  const successCount = results.filter((result) => result.ok).length;

  return {
    ok: successCount > 0,
    totalCount: results.length,
    successCount,
    failedCount: results.length - successCount,
    results,
    error: successCount === 0 ? "SIS rejected every course submission." : undefined
  };
}

function getPageState() {
  if (window.location.pathname.startsWith("/evaluate-course/")) {
    return {
      ok: true,
      page: "course",
      courseCount: 0
    };
  }

  if (window.location.pathname.startsWith("/evaluation-list")) {
    return {
      ok: true,
      page: "list",
      courseCount: getCourseLinks().length
    };
  }

  return {
    ok: true,
    page: "unsupported",
    courseCount: 0
  };
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request && request.message === "Start Evaluate") {
    sendResponse(fillCurrentCourse());
    return false;
  }

  if (!request || request.type !== "IUT_EVALUATION_COMMAND") {
    return false;
  }

  if (request.command === "getPageState") {
    sendResponse(getPageState());
    return false;
  }

  if (request.command === "submitCurrent") {
    submitCurrentCourse(request.settings).then(sendResponse);
    return true;
  }

  if (request.command === "fillCurrent") {
    sendResponse(fillCurrentCourse(request.settings));
    return false;
  }

  if (request.command === "submitAll") {
    submitAll(request.settings).then(sendResponse);
    return true;
  }

  sendResponse({ ok: false, error: "Unknown command." });
  return false;
});
