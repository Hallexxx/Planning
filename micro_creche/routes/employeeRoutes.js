const express = require("express");
const router = express.Router();
const { getAllEmployees, getAddEmployeeForm, addEmployee, getEmployeeDetails } = require("../controllers/employeeController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/employee", getAllEmployees); // Obtenir tous les employés
router.get("/employee/add", getAddEmployeeForm); // Afficher le formulaire pour ajouter un employé
router.post("/employee/add", addEmployee); // Ajouter un employé
router.get("/employee/:id", getEmployeeDetails); // Afficher un employé spécifique
// router.get("/employee/:id/edit", getAddEmployeeForm); 
// router.post("/employee/:id/edit", addEmployee); 
// router.get("/employee/:id/delete", getEmployeeDetails);
// router.post("/employee/:id/delete", getEmployeeDetails);

module.exports = router;
