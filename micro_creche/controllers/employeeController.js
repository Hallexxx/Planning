const Employee = require("../models/Employee"); // Modèle de l'employé
const MicroCreche = require("../models/MicroCreche");

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().populate("microCreche");
    res.render("employees/index_employe", { employees });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la récupération des employés.");
  }
};

exports.getAddEmployeeForm = async (req, res) => {
  try {
    const microCreches = await MicroCreche.find(); // Récupère toutes les micro-crèches
    res.render("employees/create", { microCreches });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la récupération des micro-crèches.");
  }
};

exports.addEmployee = async (req, res) => {
  const { name, email, phone, role, microCrecheId, workHoursPerWeek } = req.body;

  try {
    // Créer l'employé
    const newEmployee = new Employee({
      name,
      email,
      phone,
      role: role || "employee",
      microCreche: microCrecheId,
      workHoursPerWeek,
    });

    await newEmployee.save();

    // Mettre à jour la micro-crèche
    await MicroCreche.findByIdAndUpdate(
      microCrecheId,
      { $push: { employees: newEmployee._id } }, // Ajouter l'employé à la liste
      { new: true }
    );

    res.redirect("/employee"); // Redirection vers la liste des employés
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de l'ajout de l'employé.");
  }
};


exports.getEmployeeDetails = async (req, res) => {
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

// Suppression d'un employé
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (employee) {
      // Retirer l'employé de la micro-crèche
      await MicroCreche.findByIdAndUpdate(employee.microCreche, {
        $pull: { employees: employee._id },
      });
    }

    res.redirect("/employee");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la suppression de l'employé.");
  }
};

