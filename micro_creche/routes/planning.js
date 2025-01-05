app.post("/generate-planning/:microCrecheId", async (req, res) => {
    try {
      const microCreche = await MicroCreche.findById(req.params.microCrecheId).populate("enfants employees");
      if (!microCreche) return res.status(404).send("Micro-crèche introuvable.");
  
      // Filtrer les enfants et employés
      const slots = generateSlots(microCreche);
  
      const planning = await Planning.create({
        microCreche: microCreche._id,
        date: new Date(),
        slots,
      });
  
      res.status(200).json({ message: "Planning généré avec succès", planning });
    } catch (error) {
      console.error(error);
      res.status(500).send("Erreur lors de la génération du planning.");
    }
});
  
function generateSlots(microCreche) {
    // Exemple : création des créneaux avec des enfants et employés assignés
    return [
      {
        start: "08:00",
        end: "17:00",
        children: microCreche.enfants.slice(0, 3), // Max 3 enfants
        employees: microCreche.employees.slice(0, 1), // 1 employé
      },
    ];
}
  