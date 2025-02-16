const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { isEmployer } = require("../middleware/employeurMiddleware");
const {
  addEmployeeAndSendInvitation,
  handleInvitation,
  acceptInvitation,
  declineInvitation
} = require("../controllers/invitationController");

router.use(authMiddleware);

router.post("/add", isEmployer, addEmployeeAndSendInvitation);

router.get("/handle", handleInvitation);

router.post("/accept", acceptInvitation);
router.post("/decline", declineInvitation);

module.exports = router;
