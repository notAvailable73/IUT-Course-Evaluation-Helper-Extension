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

const rajafunction = function() {
   
    chrome.storage.local.get(['Rating', 'Feedback'], function(result) 
    {
        let rating = result.Rating;
        let feedback = result.Feedback;

        
        if (rating === undefined || rating === null || rating === "") {
            rating = "4";
        }

        // Select the nth checkbox (assuming you want to check a radio button)
        let nthCheckBox = document.querySelector(`input[type="radio"][value="${rating}"]`);
        if (nthCheckBox) {
            nthCheckBox.click();
        }

        // If no feedback is stored, use default value "N/A"
        if (feedback === undefined || feedback === null || feedback === "") {
            feedback = "N/A";
        }

        // Fill textareas with feedback
        var textareas = document.getElementsByClassName('form-control');
        for (let i = 0; i < textareas.length - 3; i++) {
            textareas[i].value = feedback;
        }
    });
};


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) 
{
    if (request.message == "submit")
    {
        rajafunction();
    }
});