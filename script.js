document.getElementById('ratingForm').addEventListener('submit', function(event) {
    event.preventDefault();  
 
    var rating = document.querySelector('input[name="rating"]:checked').value;
 
    console.log("Selected rating: " + rating);
    
    var feedback = document.getElementById('feedback').value;
 
    console.log("Feedback: " + feedback);
 
  });