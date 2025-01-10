const mongoose = require("mongoose");

const planningSchema = new mongoose.Schema({
  microCreche: { type: mongoose.Schema.Types.ObjectId, ref: "MicroCreche", required: true },
  date: { type: Date, required: true },
  slots: [
    {
      day: { type: String, required: true }, 
      start: { type: String, required: true },  
      end: { type: String, required: true },  
      children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Enfant" }],  
      employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],  
      missingEmployees: { type: Number, default: 0 },  
    },
  ],
});

module.exports = mongoose.model("Planning", planningSchema);
