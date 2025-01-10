document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".card[data-child-id]").forEach((childCard) => {
      const childId = childCard.getAttribute("data-child-id");
  
      childCard.querySelectorAll(".editable").forEach((element) => {
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
                const response = await fetch("/child/update-field", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    childId: childId,   // Envoi l'ID de l'enfant
                    field: fieldName,   // Envoi le champ spécifique (horaires.lundi, horaires.mardi, etc.)
                    value: newValue,    // Nouvelle valeur
                  }),
                });
  
                const result = await response.json();
                if (response.ok) {
                    fieldValue.textContent = newValue;
                    alert("Mise à jour réussie !");
                    window.location.reload();
                } else {
                  console.error(result.error);
                  fieldValue.textContent = currentValue; // Réinitialise si erreur
                }
              } catch (error) {
                console.error("Erreur :", error);
                fieldValue.textContent = currentValue; // Réinitialise si erreur
              }
            } else {
              fieldValue.textContent = currentValue; // Aucun changement
            }
  
            element.classList.remove("active");
          });
        });
      });
    });
  });
  