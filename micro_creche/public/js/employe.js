document.addEventListener("DOMContentLoaded", () => {
  const employeeContainer = document.querySelector(".card");
  const employeeId = employeeContainer.getAttribute("data-employee-id");

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
            const response = await fetch("/employee/update-field", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeId: employeeId, 
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
});
