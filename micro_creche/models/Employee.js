const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  microCreche: { type: mongoose.Schema.Types.ObjectId, ref: "MicroCreche", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  role: { type: String, default: "employee" }, 
  userAccount: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  addedAt: { type: Date, default: Date.now },
  workHoursPerWeek: { type: Number, required: true, min: 0 },
});

module.exports = mongoose.model("Employee", employeeSchema);
