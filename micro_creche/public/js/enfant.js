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
                                childId: childId,   
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

    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const filterMicroCreche = document.getElementById('filterMicroCreche');
    const cards = document.querySelectorAll('.card');
    const parent = document.querySelector('.row');

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const filteredCards = Array.from(cards).filter((card) => {
            const name = card.querySelector(".card-title").textContent.toLowerCase();
            return name.includes(query);
        });

        updateCards(filteredCards);
    });

    filterMicroCreche.addEventListener("change", () => {
        const selectedMicroCreche = filterMicroCreche.value;
        const filteredCards = Array.from(cards).filter((card) => {
            const microCrecheId = card.getAttribute("data-microcreche");
            return selectedMicroCreche === "" || microCrecheId === selectedMicroCreche;
        });

        updateCards(filteredCards);
    });

    filterSelect.addEventListener("change", () => {
        const value = filterSelect.value;
        const sortedCards = Array.from(cards).sort((a, b) => {
            const nameA = a.querySelector(".card-title").textContent;
            const nameB = b.querySelector(".card-title").textContent;

            if (value === "nameAsc") {
                return nameA.localeCompare(nameB);
            } else if (value === "nameDesc") {
                return nameB.localeCompare(nameA);
            }
        });

        updateCards(sortedCards);
    });

    function updateCards(filteredCards) {
        parent.innerHTML = "";

        filteredCards.forEach((card) => {
            const column = document.createElement("div");
            column.classList.add("col-md-4"); 
            column.appendChild(card);
            parent.appendChild(column);
        });
    }

    document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
            const cardWrapper = event.target.closest(".card-wrapper"); 
            if (!cardWrapper) return; 
        
            const id = cardWrapper.getAttribute("data-id"); 
            if (!id) return; 

            const endpoint = cardWrapper.classList.contains("child-card")
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
                        cardWrapper.remove(); 
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
