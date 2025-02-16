const express = require("express");
const router = express.Router();
const { getAllChildren, getAddChildForm, addChild, getChildDetails, updateChildField, deleteChild } = require("../controllers/childController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { isEmployer } = require("../middleware/employeurMiddleware");

router.use(authMiddleware);

router.get("/child", isEmployer, getAllChildren); 
router.get("/child/add", isEmployer, getAddChildForm); 
router.post("/child/add", isEmployer, addChild); 
router.get("/child/:id", isEmployer, getChildDetails);
router.post("/child/update-field", isEmployer, updateChildField);
router.delete("/child/:id", isEmployer, deleteChild);

module.exports = router;
