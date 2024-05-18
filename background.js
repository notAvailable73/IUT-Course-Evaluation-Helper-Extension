chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) 
{
    if (request.submit)
    {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs)
        {
           chrome.tabs.sendMessage(tabs[0].id, {message: "submit"});
        });
    }
});