document.addEventListener('DOMContentLoaded', function() {
    emailjs.init("SMtd3raQv-lBlSyUv");  

    const contactForm = document.getElementById('contactForm');
    contactForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const serviceID = 'service_tcrq5ix'; 
        const templateID = 'template_eqp2c22'; 

        emailjs.sendForm(serviceID, templateID, this)
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            Swal.fire({
                icon: 'success',
                title: 'Message envoyé !',
                text: 'Nous avons bien reçu votre message. Nous vous répondrons dans les meilleurs délais.',
                confirmButtonColor: '#3085d6'
            });
            contactForm.reset();
            closePopup();
        }, function(error) {
            console.log('FAILED...', error);
            Swal.fire({
                icon: 'error',
                title: 'Oups...',
                text: 'Échec de l\'envoi du message. Veuillez réessayer.',
                confirmButtonColor: '#d33'
            });
        });
    });

    const floatingChat = document.querySelector('.floating-chat');
    const chatWindow = document.querySelector('.chat');
    const closeButton = document.querySelector('.close-btn');
    
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    document.body.appendChild(overlay);
    
    const chatIcon = document.querySelector('.floating-chat i');

    floatingChat.addEventListener('click', function () {
        chatIcon.style.display = 'none';
        floatingChat.classList.add('expanded');
        overlay.style.display = 'block';
        chatWindow.style.visibility = 'visible';
        chatWindow.style.opacity = 1;
    });

    closeButton.addEventListener('click', function (e) {
        e.preventDefault();
        closePopup();
    });

    overlay.addEventListener('click', function () {
        closePopup();
    });

    contactForm.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    function closePopup() {
        chatIcon.style.display = 'block';
        floatingChat.classList.remove('expanded');
        overlay.style.display = 'none';
        chatWindow.style.visibility = 'hidden';
        chatWindow.style.opacity = 0;
    }
});

function closePopup() {
  chatIcon.style.display = 'block';  
  floatingChat.classList.remove('expanded');
  overlay.style.display = 'none';
  chatWindow.style.visibility = 'hidden';
  chatWindow.style.opacity = 0;
}

document.querySelectorAll(".editable").forEach((element) => {
    const editIcon = element.querySelector(".edit-icon");
    const fieldValue = element.querySelector(".field-value");
    const fieldName = element.dataset.field;

    editIcon.addEventListener("click", () => {
        element.classList.add("active");

        const currentValue = fieldValue.textContent.trim();
        fieldValue.innerHTML = `<input type="text" value="${currentValue}" class="form-control field-input">`;

        const input = fieldValue.querySelector(".field-input");
        input.focus();

        input.addEventListener("blur", async () => {
            const newValue = input.value.trim();

            if (newValue !== currentValue) {
                try {
                    const response = await fetch("/user/update-field", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                        field: fieldName,
                        value: newValue,
                        }),
                    });

                    const result = await response.json();
                    if (response.ok) {
                        fieldValue.textContent = newValue;
                        alert("Mise à jour réussie !");
                        window.location.reload();
                    } else {
                        console.error(result.error);
                        fieldValue.textContent = currentValue; 
                    }
                } catch (error) {
                    console.error("Erreur :", error);
                    fieldValue.textContent = currentValue; 
                }
            } else {
                fieldValue.textContent = currentValue;
            }

            element.classList.remove("active");
        });
    });
});

function showDetails(event) {
    const cell = event.currentTarget;

    const children = JSON.parse(cell.getAttribute('data-children') || '[]');
    const employees = JSON.parse(cell.getAttribute('data-employees') || '[]');

    const childrenList = document.getElementById('children-list');
    const employeesList = document.getElementById('employees-list');

    childrenList.innerHTML = children.map(name => `<li>${name}</li>`).join('');
    employeesList.innerHTML = employees.map(name => `<li>${name}</li>`).join('');

    const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
}

document.addEventListener('click', (event) => {
    const modal = document.querySelector('.modal.show');
    if (modal && !modal.contains(event.target)) {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        bootstrapModal.hide();
    }
});

function selectDay(day) {
    const params = new URLSearchParams(window.location.search);
    params.set('day', day);  
    window.history.pushState({}, '', '?' + params.toString());

    document.querySelectorAll('.day-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(button[onclick="selectDay('${day}')"]).classList.add('active');

    document.querySelectorAll('.day-details').forEach(detail => {
        if (detail.dataset.day === day) {
            detail.classList.remove('d-none');
        } else {
            detail.classList.add('d-none');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const day = params.get('day') || '<%= selectedDay %>'; 
    selectDay(day);
});

function toggleDetails(targetId, toggleButton) {
    const targetDiv = document.getElementById(targetId);
    const icon = toggleButton.querySelector('i');
    console.log("pass");
    const isVisible = targetDiv.style.display === 'block';
    console.log("non");
    targetDiv.style.display = isVisible ? 'none' : 'block';
    if (icon) {
        console.log("oui");
        icon.classList.toggle('bi-chevron-down', isVisible);
        icon.classList.toggle('bi-chevron-up', !isVisible);
    }
}

function generatePlanning(microCrecheId) {
    fetch(`/generate-planning/${microCrecheId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            alert("Planning généré avec succès !");
            window.location.reload();
        } else {
            alert(`Erreur : ${data.message}`);
        }
    })
    .catch(() => {
        alert("Une erreur est survenue.");
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get("role");

    if (role === "pro") {
        document.getElementById("pro-tab").classList.add("active");
        document.getElementById("pro").classList.add("show", "active");
        document.getElementById("employe-tab").classList.remove("active");
        document.getElementById("employe").classList.remove("show", "active");
    } else if (role === "employe") {
        document.getElementById("employe-tab").classList.add("active");
        document.getElementById("employe").classList.add("show", "active");
        document.getElementById("pro-tab").classList.remove("active");
        document.getElementById("pro").classList.remove("show", "active");
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const userMenuBtn = document.getElementById("userMenuBtn");
    const userDropdown = document.getElementById("userDropdown");
    const notificationBtn = document.getElementById("notificationBtn");
    const notificationsContainer = document.getElementById("notificationsContainer");
    const arrowIcon = document.querySelector(".bi-arrow-right");

    userMenuBtn.addEventListener("click", (e) => {
        e.preventDefault(); 
        const isVisible = userDropdown.style.display === "block";
        userDropdown.style.display = isVisible ? "none" : "block"; 
    });

    document.addEventListener("click", (e) => {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.style.display = "none"; 
        }
    });

    notificationBtn.addEventListener("click", () => {
        notificationsContainer.classList.toggle("active");
        arrowIcon.classList.toggle("rotate");
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get("error");

    if (errorMsg) {
        Swal.fire({
        icon: 'error',
        title: 'Accès refusé',
        text: errorMsg,
        position: 'bottom-end',
        toast: true,
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        customClass: {
            popup: 'animate__animated animate__fadeInDown'
        }
        });
        console.error("Erreur: " + errorMsg);
    }

    const btnLogin = document.getElementById("btnLogin");
    const btnSignup = document.getElementById("btnSignup");

    btnLogin.addEventListener("mouseenter", function(){
        gsap.to(btnLogin, { duration: 0.3, scale: 1.1 });
    });
    btnLogin.addEventListener("mouseleave", function(){
        gsap.to(btnLogin, { duration: 0.3, scale: 1 });
    });

    btnSignup.addEventListener("mouseenter", function(){
        gsap.to(btnSignup, { duration: 0.3, scale: 1.1 });
    });
    btnSignup.addEventListener("mouseleave", function(){
        gsap.to(btnSignup, { duration: 0.3, scale: 1 });
    });
});


