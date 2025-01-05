const mongoose = require("mongoose");

const enfantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  microCreche: { type: mongoose.Schema.Types.ObjectId, ref: "MicroCreche", required: true },
  horaires: {
    lundi: { type: String, required: false },
    mardi: { type: String, required: false },
    mercredi: { type: String, required: false },
    jeudi: { type: String, required: false },
    vendredi: { type: String, required: false },
  },
});

module.exports = mongoose.model("Enfant", enfantSchema);