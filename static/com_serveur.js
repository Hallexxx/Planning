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
        const usernameLogin = document.getElementById('usernameLog').value;
        const passwordLogin = document.getElementById('passwordLog').value;

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

document.addEventListener('DOMContentLoaded', function () {
    const addEmployeeButton = document.getElementById('addEmployeeButton');
    const addEmployeeForm = document.getElementById('addEmployeeForm');
    const employeeForm = document.getElementById('employeeForm');

    addEmployeeButton.addEventListener('click', function () {
        // Affichez ou cachez le formulaire selon l'état actuel
        addEmployeeForm.style.display = (addEmployeeForm.style.display === 'none' || addEmployeeForm.style.display === '') ? 'block' : 'none';
    });

    employeeForm.addEventListener('submit', function (event) {
        event.preventDefault();
    
        // Récupérez les valeurs du formulaire
        const firstname = document.getElementById('firstname').value;
        const lastname = document.getElementById('lastname').value;
        const workDays = document.getElementById('workDays').value;
        const workHours = document.getElementById('workHours').value;
    
        // Utilisez fetch ou XMLHttpRequest pour envoyer les informations au serveur
        fetch('/addEmployee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firstname, lastname, workDays, workHours }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Réponse du serveur :', data);
    
            if (data.success) {
                // Affichez une alerte
                alert(data.message);
                addEmployeeForm.style.display = 'none';
            } else {
                console.error('Erreur lors de la demande d\'ajout d\'employé:', data.message);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la demande d\'ajout d\'employé:', error);
        });
    });   
    const addEnfantButton = document.getElementById('addEnfantButton');
    const addEnfantForm = document.getElementById('addEnfantForm');
    const enfantForm = document.getElementById('enfantForm');
    addEnfantButton.addEventListener('click', function () {
        console.log("oui");
        addEnfantForm.style.display = (addEnfantForm.style.display === 'none' || addEnfantForm.style.display === '') ? 'block' : 'none';
        console.log("non");
    });
});
