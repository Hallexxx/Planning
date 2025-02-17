const express = require("express");
const { getNotifications, toggleReadStatus, deleteNotification, markAllAsRead} = require("../controllers/notificationController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware); 

router.get("/alert", getNotifications);

router.post('/toggle-read/:id', toggleReadStatus);

router.post('/mark-all-read', markAllAsRead);

router.delete("/notifications/:id/delete", deleteNotification);

module.exports = router;
