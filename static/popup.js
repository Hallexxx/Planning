document.addEventListener('DOMContentLoaded', function () {
    var imgHover = document.getElementById('profile-container');
    var popup = document.getElementById('popup');
    var timer;

    imgHover.addEventListener('mouseenter', function () {
        clearTimeout(timer); 
        popup.style.display = 'flex';
    });

    imgHover.addEventListener('mouseleave', function () {
        timer = setTimeout(function () {
            popup.style.display = 'none';
        }, 1000);
    });
    
    popup.addEventListener('mouseenter', function () {
        clearTimeout(timer);
    });
    
    popup.addEventListener('mouseleave', function () {
        popup.style.display = 'none';
    });
    
});

function popUp() {
    const inscriptionPopup = document.getElementById("inscription");
    const log = document.getElementById("loginPopup");
    inscriptionPopup.style.display = "flex";
    log.style.display = "none";

}