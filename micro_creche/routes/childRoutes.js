const express = require("express");
const router = express.Router();
const { getAllChildren, getAddChildForm, addChild, getChildDetails, updateChildField } = require("../controllers/childController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.get("/child", getAllChildren); // Obtenir tous les enfants
router.get("/child/add", getAddChildForm); // Afficher le formulaire pour ajouter un enfant
router.post("/child/add", addChild); // Ajouter un enfant
router.get("/child/:id", getChildDetails);
router.post("/child/update-field", updateChildField);

module.exports = router;
