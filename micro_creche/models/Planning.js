const mongoose = require("mongoose");

const planningSchema = new mongoose.Schema({
  microCreche: { type: mongoose.Schema.Types.ObjectId, ref: "MicroCreche", required: true },
  date: { type: Date, required: true },
  slots: [
    {
      day: { type: String, required: true },  // Jour de la semaine (Lundi, Mardi, etc.)
      start: { type: String, required: true },  // Heure de début (ex : "08:00")
      end: { type: String, required: true },  // Heure de fin (ex : "17:00")
      children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Enfant" }],  // Enfants affectés à ce créneau
      employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],  // Employés affectés à ce créneau
      missingEmployees: { type: Number, default: 0 },  // Nombre d'employés manquants
    },
  ],
});

module.exports = mongoose.model("Planning", planningSchema);
