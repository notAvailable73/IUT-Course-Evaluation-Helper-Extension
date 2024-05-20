const fillTheTextBoxes = function () {
    chrome.storage.local.get('Feedback', function (result) {
        let feedback = result.Feedback;
        if (feedback === undefined || feedback === null || feedback === "") {
            feedback = "N/A";
        }
        var textareas = document.getElementsByClassName('form-control');
        for (let i = 0; i < textareas.length; i++) {
            textareas[i].value = feedback;

            // trigger the user interaction true
            textareas[i].dispatchEvent(new Event('input', { bubbles: true }));
            textareas[i].dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

}

const checkTheRadios = function () {
    chrome.storage.local.get('Rating', function (result) {
        let rating = result.Rating; 
        let nthCheckBox = document.querySelectorAll(`input[type="radio"][value="${rating}"]`);

        for (let i = 0; i < nthCheckBox.length; i++) {
            nthCheckBox[i].click();
        }
    })
};



const evaluate = function () { 
    fillTheTextBoxes();
    checkTheRadios();
};


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) 
{
    // console.log("Content script received a message:", request);
    if (request.message == "Start Evaluate") { 
        evaluate();
    }
});