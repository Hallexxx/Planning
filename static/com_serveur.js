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
                loadCalendarData();
            } else {
                alert('La connexion a échoué. Veuillez réessayer.');
            }
        })        
        .catch(error => {
            console.error('Erreur lors de la demande de connexion:', error);
        });


    });
});


///////////////////////////////////// AJOUT EMPLOYES ////////////////////////////////////////////////////////


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
        const workDays = Array.from(document.querySelectorAll('input[name="workDays[]"]:checked')).map(day => day.value);
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
                window.location.reload();
            } else {
                console.error('Erreur lors de la demande d\'ajout d\'employé:', data.message);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la demande d\'ajout d\'employé:', error);
        });
    });   
});

document.addEventListener('DOMContentLoaded', function () {
    const addEnfantButton = document.getElementById('addEnfantButton');
    const addEnfantForm = document.getElementById('addEnfantForm');
    const enfantForm = document.getElementById('enfantForm');
    
    addEnfantButton.addEventListener('click', function () {
        // Affichez ou cachez le formulaire selon l'état actuel
        addEnfantForm.style.display = (addEnfantForm.style.display === 'none' || addEnfantForm.style.display === '') ? 'block' : 'none';
    });

    enfantForm.addEventListener('submit', function (event) {
        event.preventDefault();
    
        // Récupérez les valeurs du formulaire
        const firstname = document.getElementById('firstname').value;
        const lastname = document.getElementById('lastname').value;
        const age = document.getElementById('age').value;
        const daycareDays = Array.from(document.querySelectorAll('input[name="daycareDays[]"]:checked')).map(day => day.value);
        const daycareHours = Array.from(document.querySelectorAll('input[name="daycareHours[]"]')).map(hour => hour.value);
    
        // Utilisez fetch ou XMLHttpRequest pour envoyer les informations au serveur
        fetch('/addChild', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firstname, lastname, age, daycareDays, daycareHours }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Réponse du serveur :', data);
    
            if (data.success) {
                // Affichez une alerte
                alert(data.message);
                addEnfantForm.style.display = 'none';
                window.location.reload();
            } else {
                console.error('Erreur lors de la demande d\'ajout d\'enfant:', data.message);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la demande d\'ajout d\'enfant:', error);
        });
    });
});



///////////////////////////////////// BUTTON DELETE SUPPRESSION ENFANTS ////////////////////////////////////////////////////////


function afficherBoutonSupprimer(element) {
    // Ajoutez une classe CSS pour afficher le bouton "Supprimer"
    element.querySelector('.btn-supprimer').classList.add('visible');
}

function cacherBoutonSupprimer(element) {
    // Supprimez la classe CSS pour cacher le bouton "Supprimer"
    element.querySelector('.btn-supprimer').classList.remove('visible');
}

document.addEventListener('DOMContentLoaded', function () {
    const childContainers = document.querySelectorAll('.container_enfants');

    childContainers.forEach(container => {
        const childId = container.getAttribute('data-child-id');

        container.querySelector('.btn-supprimer').addEventListener('click', async function () {
            const confirmation = window.confirm("Voulez-vous vraiment supprimer cet enfant ?");
        
            if (confirmation) {
                await deleteChild(childId);
            }
        });        
    });
});

async function deleteChild(childId) {
    try {
        const response = await fetch(`/deleteChild/${childId}`, { method: 'DELETE' });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const result = await response.json();
        console.log(result);

        window.location.reload(); // Recharge la page après la suppression
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'enfant : ' + error.message);
        // Gérer l'erreur ici (afficher un message à l'utilisateur, etc.)
    }
}


///////////////////////////////////// SUPPRESSION EMPLOYES ////////////////////////////////////////////////////////


document.addEventListener('DOMContentLoaded', function () {
    const employeeContainers = document.querySelectorAll('.container_employes');

    employeeContainers.forEach(container => {
        const employeeId = container.getAttribute('data-employee-id');

        container.querySelector('.delete-button').addEventListener('click', async function () {
            const confirmation = window.confirm("Voulez-vous vraiment supprimer cet employé ?");

            if (confirmation) {
                await deleteEmployee(employeeId);
            }
        });
    });
});

async function deleteEmployee(employeeId) {
    try {
        const response = await fetch(`/deleteEmployee/${employeeId}`, { method: 'DELETE' });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const result = await response.json();
        console.log(result);

        window.location.reload(); // Recharge la page après la suppression
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'employé : ' + error.message);
        // Gérer l'erreur ici (afficher un message à l'utilisateur, etc.)
    }
}


///////////////////////////////////// MODIFICATION EMPLOYES ////////////////////////////////////////////////////////


// Fonction pour ouvrir le formulaire de modification
function openEditForm(employeeId) {
    // Utilisez AJAX pour récupérer les détails de l'employé côté serveur
    fetch(`/getEmployeeDetails/${employeeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const employeeDetails = data.employeeDetails;
                // Appelez une fonction pour afficher le formulaire de modification avec les détails récupérés
                displayEditForm(employeeDetails);
            } else {
                console.error('Erreur lors de la récupération des détails de l\'employé');
            }
        })
        .catch(error => {
            console.error('Erreur AJAX : ' + error.message);
        });
}

function displayEditForm(employeeDetails) {
    // Assurez-vous que l'élément existe avant de manipuler ses propriétés
    const editForm = document.getElementById('editEmployeeForm');
    if (editForm) {
        // Affichez le formulaire de modification, remplissez-le avec les détails récupérés
        editForm.style.display = 'block';

        // Remplissez le formulaire avec les détails récupérés
        document.getElementById('editEmployeeId').value = employeeDetails.id;
        document.getElementById('editFirstName').value = employeeDetails.firstname;
        document.getElementById('editLastName').value = employeeDetails.lastname;

        // Cochez les jours de travail appropriés
        employeeDetails.workDays.forEach(day => {
            document.getElementById(`edit${day}`).checked = true;
        });

        document.getElementById('editWorkHours').value = employeeDetails.workHours;
    } else {
        console.error('L\'élément avec l\'ID "editEmployeeForm" n\'a pas été trouvé.');
    }
}


// Fonction pour fermer le formulaire de modification
function closeEditForm() {
    // Fermez la fenêtre modale ou masquez le formulaire selon votre méthode d'affichage
    const editForm = document.getElementById('editEmployeeForm');
    editForm.style.display = 'none';
}


///////////////////////////////////// MODIFICATION ENFANTS  ////////////////////////////////////////////////////////


function openEditChildForm(childId) {
    // Utilisez AJAX pour récupérer les détails de l'enfant côté serveur
    fetch(`/getChildDetails/${childId}`)
        .then(response => response.json())
        .then(data => {
            console.log('Réponse JSON du serveur :', data);
            if (data.success) {
                const childDetails = data.childDetails;
                // Appelez une fonction pour afficher le formulaire de modification avec les détails récupérés
                displayEditChildForm(childDetails);
            } else {
                console.error('Erreur lors de la récupération des détails de l\'enfant');
            }
        })
        .catch(error => {
            console.error('Erreur AJAX : ' + error.message);
        });
}


function displayEditChildForm(childDetails) {
    // Assurez-vous que l'élément existe avant de manipuler ses propriétés
    const editChildForm = document.getElementById('editEnfantForm');
    if (editChildForm) {
        // Affichez le formulaire de modification, remplissez-le avec les détails récupérés
        editChildForm.style.display = 'block';

        // Remplissez le formulaire avec les détails récupérés
        document.getElementById('editChildId').value = childDetails.id;
        document.getElementById('editFirstname').value = childDetails.firstname;
        document.getElementById('editLastname').value = childDetails.lastname;
        document.getElementById('editAge').value = childDetails.age;

        // Cochez les jours de garde appropriés si editDaycareDays est défini et est un tableau
        if (childDetails.editDaycareDays && Array.isArray(childDetails.editDaycareDays)) {
            childDetails.editDaycareDays.forEach(day => {
                const checkbox = document.getElementById(`editDaycare${day}`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }

        // Remplissez les heures de garde si editDaycareHoursStart et editDaycareHoursEnd sont définis et sont des tableaux
        if (
            childDetails.editDaycareDays && Array.isArray(childDetails.editDaycareDays) &&
            childDetails.editDaycareHoursStart && Array.isArray(childDetails.editDaycareHoursStart) &&
            childDetails.editDaycareHoursEnd && Array.isArray(childDetails.editDaycareHoursEnd) &&
            childDetails.editDaycareHoursStart.length === childDetails.editDaycareHoursEnd.length
        ) {
            childDetails.editDaycareDays.forEach((day, index) => {
                const checkbox = document.getElementById(`editDaycare${day}`);
                const inputStart = document.getElementById(`editDaycareHours${index + 1}Start`);
                const inputEnd = document.getElementById(`editDaycareHours${index + 1}End`);

                if (checkbox && inputStart && inputEnd) {
                    checkbox.checked = true;
                    inputStart.value = childDetails.editDaycareHoursStart[index];
                    inputEnd.value = childDetails.editDaycareHoursEnd[index];
                }
            });
        }
        } else {
            console.error('L\'élément avec l\'ID "editEnfantForm" n\'a pas été trouvé.');
        }
}




// Fonction pour fermer le formulaire de modification des enfants
function closeEditChildForm() {
    // Fermez la fenêtre modale ou masquez le formulaire selon votre méthode d'affichage
    const editChildForm = document.getElementById('editChildForm');
    editChildForm.style.display = 'none';
}
