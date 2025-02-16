const express = require("express");
const router = express.Router();
const { authMiddleware, authenticateUser } = require("../middleware/authMiddleware");
const { getProfile, updateField} = require("../controllers/userController");
const { getHomePage, sendMessage, error } = require("../controllers/homeController");
const { generatePlanning } = require("../controllers/planningController");
const { isEmployer } = require("../middleware/employeurMiddleware");
const rateLimit = require("express-rate-limit");

router.get("/profile", getProfile);

router.get("/error", error);

router.post("/user/update-field", updateField);

router.get("/", authenticateUser, getHomePage);

router.post("/generate-planning/:microCrecheId", isEmployer, generatePlanning);

const messageLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 3, 
    message: "Vous avez atteint la limite de messages autorisés. Veuillez réessayer plus tard.",
});
  
router.post("/send-message", messageLimiter, sendMessage);

router.get("/terms", (req, res) => {
    res.render('legal/conditions'); 
});

router.get("/privacy", (req, res) => {
    res.render('legal/privacy'); 
});

router.get("/cgv", (req, res) => {
    res.render('legal/cgv'); 
});

module.exports = router;
