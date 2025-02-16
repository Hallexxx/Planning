function showDetails(event) {
    const cell = event.currentTarget;
    const employees = JSON.parse(cell.getAttribute('data-employees') || '[]');
    const employeesList = document.getElementById('employees-list');
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
    const currentDay = params.get('day') || '<%= selectedDay %>';
    params.set('day', day);  
    window.history.pushState({}, '', '?' + params.toString());
    document.querySelectorAll('.day-button').forEach(button => {
        button.classList.remove('active');
    });
    const selectedButton = document.querySelector(`.day-button[onclick="selectDay('${day}')"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    } else {
        console.warn(`Bouton pour le jour '${day}' non trouvé.`);
    }
    document.querySelectorAll('.day-details').forEach(detail => {
        if (detail.dataset.day === day) {
            detail.style.display = 'block';
        } else {
            detail.style.display = 'none';
        }
    });
    if (currentDay !== day) { 
        params.set('day', day);
        window.location.href = '?' + params.toString(); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const day = params.get('day') || '<%= selectedDay %>'; 
    selectDay(day);
});

function toggleDetails(targetId, toggleButton) {
    const targetDiv = document.getElementById(targetId);
    const icon = toggleButton.querySelector('i');
    
    const isVisible = targetDiv.style.display === 'block';
    targetDiv.style.display = isVisible ? 'none' : 'block';
    
    if (icon) {
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

////////// CODE JS ENFANTS //////////

function showChildDetails(event) {
    const cell = event.currentTarget;

    const children = JSON.parse(cell.getAttribute('data-children') || '[]');

    const childrenList = document.getElementById('children-list');
    childrenList.innerHTML = children.map(name => `<li>${name}</li>`).join('');

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
    const currentDay = params.get('day') || '<%= selectedDay %>';
    params.set('day', day);  
    window.history.pushState({}, '', '?' + params.toString());

    document.querySelectorAll('.day-button').forEach(button => {
        button.classList.remove('active');
    });

    const selectedButton = document.querySelector(`.day-button[onclick="selectDay('${day}')"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    } else {
        console.warn(`Bouton pour le jour '${day}' non trouvé.`);
    }

    document.querySelectorAll('.day-details').forEach(detail => {
        if (detail.dataset.day === day) {
            detail.style.display = 'block';
        } else {
            detail.style.display = 'none';
        }
    });

    if (currentDay !== day) { 
        params.set('day', day);
        window.location.href = '?' + params.toString(); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const day = params.get('day') || '<%= selectedDay %>'; 
    selectDay(day);
});

function toggleDetails(targetId, toggleButton) {
    const targetDiv = document.getElementById(targetId);
    const icon = toggleButton.querySelector('i');
    
    const isVisible = targetDiv.style.display === 'block';
    targetDiv.style.display = isVisible ? 'none' : 'block';
    
    if (icon) {
        icon.classList.toggle('bi-chevron-down', isVisible);
        icon.classList.toggle('bi-chevron-up', !isVisible);
    }
}
