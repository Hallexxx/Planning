const mongoose = require("mongoose");

const microCrecheSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true }, 
  description: { type: String, required: false }, 
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  enfants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Enfant" }],
});

module.exports = mongoose.model("MicroCreche", microCrecheSchema);
