const Employee = require("../models/Employee"); // Modèle de l'employé
const MicroCreche = require("../models/MicroCreche");
const mongoose = require("mongoose");

const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().populate("microCreche");
    res.render("employees/index_employe", { employees });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la récupération des employés.");
  }
};

const getAddEmployeeForm = async (req, res) => {
  try {
    const microCreches = await MicroCreche.find(); 
    res.render("employees/create", { microCreches });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la récupération des micro-crèches.");
  }
};

const addEmployee = async (req, res) => {
  const { name, email, phone, role, microCrecheId, workHoursPerWeek } = req.body;

  try {
    const newEmployee = new Employee({
      name,
      email,
      phone,
      role: role || "employee",
      microCreche: microCrecheId,
      workHoursPerWeek,
    });

    await newEmployee.save();

    await MicroCreche.findByIdAndUpdate(
      microCrecheId,
      { $push: { employees: newEmployee._id } }, 
      { new: true }
    );

    res.redirect("/employee");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de l'ajout de l'employé.");
  }
};


const getEmployeeDetails = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate("microCreche");
    if (!employee) {
      return res.status(404).send("Employé non trouvé.");
    }
    res.render("employees/details", { employee });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la récupération des détails de l'employé.");
  }
};

const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID invalide" });
  }

  try {
    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({ error: "Employé non trouvé" });
    }

    await MicroCreche.findByIdAndUpdate(employee.microCreche, {
      $pull: { employees: id },
    });

    res.status(200).json({ success: true, message: "Employé supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'employé :", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression de l'employé" });
  }
};


const updateEmployeeField = async (req, res) => {
  try {
    const { employeeId, field, value } = req.body;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ error: "ID de l'employé invalide" });
    }

    const validFields = ["name", "email", "phone", "role", "workHoursPerWeek"];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: "Champ invalide" });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { [field]: value },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ error: "Employé non trouvé" });
    }

    res.status(200).json({ message: "Mise à jour réussie", employee: updatedEmployee });
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = { updateEmployeeField, deleteEmployee, getEmployeeDetails, addEmployee, getAddEmployeeForm, getAllEmployees };


