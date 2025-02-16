const express = require("express");
const { getChildPlannings, getEmployeePlannings} = require("../controllers/planningController");
const { authMiddleware, authenticateUser } = require("../middleware/authMiddleware");
const { isEmployer } = require("../middleware/employeurMiddleware");
const { checkEmployeeOwnership } = require("../middleware/employeurMiddleware");

const router = express.Router();

router.get("/child", checkEmployeeOwnership, getChildPlannings);

router.get("/employee", checkEmployeeOwnership, getEmployeePlannings);

module.exports = router;
