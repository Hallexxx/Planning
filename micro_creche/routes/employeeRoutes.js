const express = require("express");
const router = express.Router();
const { getAllEmployees, getAddEmployeeForm, addEmployee, getEmployeeDetails, updateEmployeeField } = require("../controllers/employeeController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/employee", getAllEmployees); 
router.get("/employee/add", getAddEmployeeForm); 
router.post("/employee/add", addEmployee); 
router.get("/employee/:id", getEmployeeDetails); 
router.post('/employee/update-field', updateEmployeeField);

module.exports = router;
