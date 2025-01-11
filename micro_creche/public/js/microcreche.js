document.addEventListener("DOMContentLoaded", () => {
  const microCrecheContainer = document.querySelector(".card-body");
  const microCrecheId = microCrecheContainer.getAttribute("data-microcreche-id");

  document.querySelectorAll(".editable").forEach((element) => {
    const editIcon = element.querySelector(".edit-icon");
    const fieldValue = element.querySelector(".editable-content");
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
            const response = await fetch("/microcreche/update-field", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                microCrecheId: microCrecheId,
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

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const card = event.target.closest(".card");
      const id = card.getAttribute("data-id"); 
      const endpoint = card.classList.contains("child-card")
        ? `/child/${id}`
        : `/employee/${id}`;

      if (confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
        try {
          const response = await fetch(endpoint, {
            method: "DELETE",
          });

          const result = await response.json();
          if (response.ok) {
            alert(result.message);
            card.remove(); // Supprime la carte du DOM
          } else {
            alert("Erreur : " + result.error);
          }
        } catch (error) {
          console.error("Erreur :", error);
          alert("Une erreur s'est produite. Veuillez réessayer.");
        }
      }
    });
  });
});
