const express = require("express");
const router = express.Router();
const { getCreateForm, createMicroCreche , getDashboard, getMicroCrecheDetails, updateField} = require("../controllers/microCrecheController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { isEmployer, checkEmployeeOwnership, checkUserEmployeeLink } = require("../middleware/employeurMiddleware");

router.use(authMiddleware); 

router.get("/micro-creche/create", isEmployer, getCreateForm);

router.post("/micro-creche/create", isEmployer, createMicroCreche);

router.get("/micro-creche", isEmployer, getDashboard);

router.get("/micro-creche/:id", isEmployer, getMicroCrecheDetails);

router.post("/microcreche/update-field", isEmployer, updateField);


module.exports = router;
