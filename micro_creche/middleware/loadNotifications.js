const Notification = require("../models/Notification");

const loadNotifications = async (req, res, next) => {
  try {
    if (req.user) { 
      const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
      res.locals.notifications = notifications;
    }
    next(); 
  } catch (error) {
    console.error("Erreur lors du chargement des notifications:", error);
    next();
  }
};

module.exports = loadNotifications;