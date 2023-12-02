async function choixUser(element) {

    const userId = element.getAttribute('id-user');
        
    await fetch('/UserId', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    })
    window.location.href = "/";
}

async function decoProfile() {
        
    await fetch('/UserId', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: -1 }),
    })
    window.location.reload();
}


///////////////////////////////////// LOGIN POST ////////////////////////////////////////////////////////


document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.getElementById('loginButton');
    const loginPopup = document.getElementById('loginPopup');
    const closePopup = document.getElementById('closePopup');
    const closepopup = document.getElementById('closepopup');
    const inscription = document.getElementById('inscription');

    loginButton.addEventListener('click', function () {
        loginPopup.style.display = 'block';
    });

    closePopup.addEventListener('click', function () {
        loginPopup.style.display = 'none';
    });

    closepopup.addEventListener('click', function () {
        inscription.style.display = 'none';
    });

    // Ajoutez un événement pour gérer la soumission du formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        // Récupérez les valeurs du formulaire et envoyez-les au serveur via une requête AJAX
        const usernameLogin = document.getElementById('usernameLogin').value;
        const passwordLogin = document.getElementById('passwordLogin').value;

        // Utilisez fetch ou XMLHttpRequest pour envoyer les informations de connexion au serveur
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ usernameLogin, passwordLogin }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Réponse du serveur :', data);
        
            // Gérez la réponse du serveur ici
            if (data.success) {
                loginPopup.style.display = 'none';
                window.location.reload();
            } else {
                alert('La connexion a échoué. Veuillez réessayer.');
            }
        })        
        .catch(error => {
            console.error('Erreur lors de la demande de connexion:', error);
        });


    });
});