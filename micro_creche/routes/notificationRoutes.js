const express = require("express");
const { getNotifications, toggleReadStatus, deleteNotification} = require("../controllers/notificationController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware); 

router.get("/alert", getNotifications);

router.post("/notifications/toggle-read/:id", toggleReadStatus);

router.delete("/notifications/:id/delete", deleteNotification);

module.exports = router;
