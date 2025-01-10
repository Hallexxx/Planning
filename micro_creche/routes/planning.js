const express = require("express");
const { getChildPlannings, getEmployeePlannings,  generatePDF} = require("../controllers/planningController");
const { authMiddleware, authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// Route pour afficher les plannings des enfants
router.get("/child", authenticateUser, getChildPlannings);

// Route pour afficher les plannings des employés
router.get("/employee", authenticateUser, getEmployeePlannings);

// router.get('/generate-pdf', generatePDF);

module.exports = router;
