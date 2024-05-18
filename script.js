
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


