document.getElementById('ratingForm').addEventListener('submit', function(event) {
    event.preventDefault();  
 
    var rating = document.querySelector('input[name="rating"]:checked').value;

    chrome.storage.local.set({'Rating': rating});

   
 
    console.log("Selected rating: " + rating);

    chrome.storage.local.get('Rating', function(result) {
      console.log('Stored Rating: ' + result.Rating);
  });
    
    var feedback = document.getElementById('feedback').value;

    chrome.storage.local.set({'Feedback': feedback});
 
    console.log("Feedback: " + feedback);

    chrome.storage.local.get('Feedback', function(result) 
    {
      console.log('Stored feedback: ' + result.Feedback);
    });

    chrome.runtime.sendMessage({submit:true});
 
  });