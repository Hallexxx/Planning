const express = require("express");
const router = express.Router();
const { 
    getAllEmployees, 
    getAddEmployeeForm, 
    getEmployeeDetails, 
    updateEmployeeField, 
    deleteEmployee,
} = require("../controllers/employeeController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { isEmployer, checkEmployeeOwnership, checkUserEmployeeLink } = require("../middleware/employeurMiddleware");
const { sendInvitation } = require("../controllers/invitationController");

router.use(authMiddleware);

router.get("/employee", isEmployer, getAllEmployees); 
router.get("/employee/add", isEmployer, getAddEmployeeForm); 
router.post('/employee/update-field', checkEmployeeOwnership, updateEmployeeField);
router.get("/employee/my-details", checkUserEmployeeLink, (req, res) => {
    res.redirect(`/employee/${req.employee._id}`);
});  
router.delete("/employee/:id", isEmployer, deleteEmployee);
router.get("/employee/send-invitation/:id", isEmployer, sendInvitation);
router.get("/employee/:id", checkEmployeeOwnership, getEmployeeDetails); 

module.exports = router;
