document.addEventListener("DOMContentLoaded", () => {
    const microCrecheContainer = document.querySelector(".card-body"); // Container principal
    const microCrecheId = microCrecheContainer.getAttribute("data-microcreche-id"); // ID de la micro-crèche
  
    document.querySelectorAll(".editable").forEach((editableElement) => {
      const editIcon = editableElement.querySelector(".edit-icon");
      const fieldValue = editableElement.querySelector("p");
      const fieldName = editableElement.dataset.field;
  
      editIcon.addEventListener("click", () => {
        editableElement.classList.add("active");
  
        const currentValue = fieldValue.textContent.trim();
        fieldValue.innerHTML = `<input type="text" value="${currentValue}" class="form-control field-input">`;
  
        const input = fieldValue.querySelector(".field-input");
        input.focus();
  
        input.addEventListener("blur", async () => {
          const newValue = input.value.trim();
  
          if (newValue !== currentValue) {
            try {
              const response = await fetch("/microcreche/update-field", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  microCrecheId: microCrecheId, // ID de la micro-crèche
                  field: fieldName,            // Nom du champ (adresse, description, etc.)
                  value: newValue,             // Nouvelle valeur
                }),
              });
  
              const result = await response.json();
              if (response.ok) {
                fieldValue.textContent = newValue;
                alert("Mise à jour réussie !");
              } else {
                console.error(result.error);
                fieldValue.textContent = currentValue; // Restaurer l'ancienne valeur en cas d'échec
              }
            } catch (error) {
              console.error("Erreur :", error);
              fieldValue.textContent = currentValue; // Restaurer l'ancienne valeur en cas d'erreur
            }
          } else {
            fieldValue.textContent = currentValue; // Pas de modification, restauration
          }
  
          editableElement.classList.remove("active");
        });
      });
    });
  });
  