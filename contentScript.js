// setTimeout(function () {
//     let nthCheckBox = document.querySelectorAll('input[type="radio"][value="4"]');
//     for (let i = 0; i < nthCheckBox.length; i++) {
//         nthCheckBox[i].click();
//     }

//     var textareas = document.getElementsByClassName('form-control');

//     for (let i = 0; i < textareas.length - 3; i++) {
//         textareas[i].value = "N/A";
//     }
// }, 500);


console.log("Content script is running");

const rajafunction = function() {
    chrome.storage.local.get(['Rating', 'Feedback'], function(result) {
        let rating = result.Rating;
        let feedback = result.Feedback;

        if (rating === undefined || rating === null || rating === "") {
            rating = "4";
        }

        let nthCheckBox = document.querySelectorAll(`input[type="radio"][value="${rating}"]`);
        
        for (let i = 0; i < nthCheckBox.length; i++) {
            nthCheckBox[i].click();
        }

        if (feedback === undefined || feedback === null || feedback === "") {
            feedback = "N/A";
        }

        var textareas = document.getElementsByClassName('form-control');
        for (let i = 0; i < textareas.length - 3; i++) {
            textareas[i].value = feedback;
        }
    });
};


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) 
{
    console.log("Content script received a message:", request);
    if (request.message == "submit")
    {
        console.log("Submit message received");
        rajafunction();
    }
});