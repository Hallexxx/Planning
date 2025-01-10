function generatePlanning(microCrecheId) {
    fetch(`/generate-planning/${microCrecheId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
        alert("Planning généré avec succès !");
        location.reload(); // Recharge la page pour afficher le nouveau planning
        } else {
        alert(`Erreur : ${data.message}`);
        }
    })
    .catch(() => {
        alert("Une erreur est survenue.");
    });
}

window.addEventListener("DOMContentLoaded", () => {
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
              fieldValue.textContent = currentValue; // Réinitialiser si échec
            }
          } catch (error) {
            console.error("Erreur :", error);
            fieldValue.textContent = currentValue; // Réinitialiser si erreur
          }
        } else {
          fieldValue.textContent = currentValue; // Aucun changement
        }
  
        element.classList.remove("active");
      });
    });
  });
  
});
  