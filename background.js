chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) // Listen request
{
    if (request.submit) // if submit is pressed
    {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs)
        {
           chrome.tabs.sendMessage(tabs[0].id, {message: "Start Evaluate"}); // send the message to content.js
        });
    }
});