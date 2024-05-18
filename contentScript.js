setTimeout(function () {
    let nthCheckBox = document.querySelectorAll('input[type="radio"][value="5"]');
    for (let i = 0; i < nthCheckBox.length; i++) {
        nthCheckBox[i].click();
    }

    var textareas = document.getElementsByClassName('form-control');

    for (let i = 0; i < textareas.length - 3; i++) {
        textareas[i].value = "N/A";
    }
}, 500); 
 