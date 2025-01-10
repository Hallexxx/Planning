const express = require("express");
const router = express.Router();
const { authMiddleware, authenticateUser } = require("../middleware/authMiddleware");
const { getProfile, updateField} = require("../controllers/userController");
const { getHomePage } = require("../controllers/homeController");
const { generatePlanning,  generatePDF} = require("../controllers/planningController");

router.get("/profile", getProfile);

router.post("/user/update-field", updateField);

router.get("/", authenticateUser, getHomePage);

router.post("/generate-planning/:microCrecheId", generatePlanning);

router.get('/generate-pdf', generatePDF);

module.exports = router;
