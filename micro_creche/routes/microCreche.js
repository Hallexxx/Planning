const express = require("express");
const router = express.Router();
const { getCreateForm, createMicroCreche , getDashboard, getMicroCrecheDetails, updateField} = require("../controllers/microCrecheController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware); 

router.get("/micro-creche/create", getCreateForm);

router.post("/micro-creche/create", createMicroCreche);

router.get("/micro-creche", getDashboard);

router.get("/micro-creche/:id", getMicroCrecheDetails);

router.post("/microcreche/update-field", updateField);


module.exports = router;
