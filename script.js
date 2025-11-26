
const initialize = function () { // Load previous values
  chrome.storage.local.get(['Rating', 'Feedback'], function (result) {

    let rating = result.Rating;
    if (rating === undefined || rating === null || rating === "") { // Default vallue assign for first installation
      rating = "5";
    }
    let nthCheckBox = document.querySelector(`input[name="rating"][value="${rating}"]`);
    nthCheckBox.click();


    let feedback = result.Feedback;
    if (feedback === undefined || feedback === null || feedback === "") { // Default vallue assign for first installation
      feedback = "N/A";
    }
    var textarea = document.getElementById('feedback');
    textarea.value = feedback;
  })
}

initialize();


document.getElementById('ratingForm').addEventListener('submit', function (event) { // if submit button is pressed
  event.preventDefault();

  var rating = document.querySelector('input[name="rating"]:checked').value;
  chrome.storage.local.set({ 'Rating': rating }); //save the value in local storage


  var feedback = document.getElementById('feedback').value;
  chrome.storage.local.set({ 'Feedback': feedback }); //save the value in local storage


  chrome.runtime.sendMessage({ submit: true }); // send message to background.js when submit is pressed

});


document.getElementById('submitAllBtn').addEventListener('click', function (event) { // if submit all button is pressed
  event.preventDefault();
  const courseLinks = document.querySelectorAll(".course-action > a");
  if (courseLinks.length === 0) {
    alert("No course evaluation links found on this page. go to'https://sis.iutoic-dhaka.edu/evaluation-list'");
    return;
  }

  const basePayload = {
    "course_allocation_detail_id": "",
    "answers": [
      { "question_id": 1, "value": 5 },
      { "question_id": 2, "value": 5 },
      { "question_id": 3, "value": 5 },
      { "question_id": 4, "value": 5 },
      { "question_id": 5, "value": "N/A" },
      { "question_id": 6, "value": 5 },
      { "question_id": 7, "value": "N/A" },
      { "question_id": 8, "value": 5 },
      { "question_id": 9, "value": 5 },
      { "question_id": 10, "value": 5 },
      { "question_id": 11, "value": 5 },
      { "question_id": 12, "value": 5 },
      { "question_id": 13, "value": "N/A" },
      { "question_id": 14, "value": 5 },
      { "question_id": 15, "value": 5 },
      { "question_id": 16, "value": 5 },
      { "question_id": 17, "value": 5 },
      { "question_id": 18, "value": "N/A" },
      { "question_id": 19, "value": 5 },
      { "question_id": 20, "value": 5 },
      { "question_id": 21, "value": 5 },
      { "question_id": 22, "value": 5 },
      { "question_id": 23, "value": "N/A" },
      { "question_id": 24, "value": 5 },
      { "question_id": 25, "value": 5 },
      { "question_id": 26, "value": 5 },
      { "question_id": 27, "value": "N/A" },
      { "question_id": 28, "value": 5 },
      { "question_id": 29, "value": 5 },
      { "question_id": 30, "value": 5 },
      { "question_id": 31, "value": 5 },
      { "question_id": 32, "value": 5 },
      { "question_id": 33, "value": 5 },
      { "question_id": 34, "value": "N/A" },
      { "question_id": 35, "value": "N/A" },
      { "question_id": 36, "value": "N/A" }
    ]
  };
  function getCookie(name) {
    return document.cookie.split("; ").find(row => row.startsWith(name + "="))?.split("=")[1];
  }

  const xsrfToken = getCookie("XSRF-TOKEN");
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

  courseLinks.forEach(async (a) => {
    const parts = a.href.split("/");
    const id = parts.pop() || parts.pop(); // handles trailing slash
    console.log(a.href);

    const payload = {
      ...basePayload,
      course_allocation_detail_id: id
    };

    fetch("https://sis.iutoic-dhaka.edu/api/course-evaluate", {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken,
        "X-XSRF-TOKEN": xsrfToken,
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Sec-GPC": "1"
      },
      body: JSON.stringify(payload)
    })
      .then(r => r.json().catch(() => r.text()))
      .then(data => console.log("Response:", data))
      .catch(err => console.error("Error:", err));

  })
  chrome.runtime.sendMessage({ submitAll: true }); // send message to background.js when submit all is pressed
});
