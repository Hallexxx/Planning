const Employee = require("../models/Employee"); // Modèle de l'employé
const MicroCreche = require("../models/MicroCreche");
const mongoose = require("mongoose");

const getAllEmployees = async (req, res) => {
    try {
        const userMicroCreches = await MicroCreche.find({ owner: req.user.id });
        
        const microCrecheIds = userMicroCreches.map(mc => mc._id);
        
        const employees = await Employee.find({ 
        microCreche: { $in: microCrecheIds }
        }).populate("microCreche");
        
        res.render("employees/index_employe", { employees, microCreches: userMicroCreches });
    } catch (error) {
        console.error(error);
        res.status(500).redirect('/error');
    }
};

const getAddEmployeeForm = async (req, res) => {
    try {
        const microCreches = await MicroCreche.find(); 
        res.render("employees/create", { microCreches });
    } catch (error) {
        console.error(error);
        res.status(500).redirect('/error');
    }
};

const getEmployeeDetails = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send("ID invalide");
        }

        const employee = await Employee.findById(id).populate("microCreche");

        if (!employee) {
            return res.status(404).send("Employé non trouvé.");
        }

        const isOwner = employee.microCreche && employee.microCreche.owner
        ? employee.microCreche.owner.toString() === req.user.id.toString()
        : false;

        res.render("employees/details", { employee, isOwner });
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
        res.status(500).redirect('/error');
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
        res.status(500).redirect('/error');
    }
};

module.exports = { 
  updateEmployeeField, 
  deleteEmployee, 
  getEmployeeDetails, 
  getAddEmployeeForm, 
  getAllEmployees, 
};