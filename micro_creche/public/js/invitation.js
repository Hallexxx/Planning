document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if(message) {
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: decodeURIComponent(message),
        showConfirmButton: false,
        timer: 2000
      });
    }

    var typed = new Typed(".hero-title", {
        strings: ["Invitation à rejoindre la micro-crèche"],
        typeSpeed: 150,  
        backSpeed: 50,   
        loop: false,
    });    
});