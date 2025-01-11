const express = require("express");
const router = express.Router();
const { getAllChildren, getAddChildForm, addChild, getChildDetails, updateChildField, deleteChild } = require("../controllers/childController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.get("/child", getAllChildren); 
router.get("/child/add", getAddChildForm); 
router.post("/child/add", addChild); 
router.get("/child/:id", getChildDetails);
router.post("/child/update-field", updateChildField);
router.delete("/child/:id", deleteChild);

module.exports = router;
