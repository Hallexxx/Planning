const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.render("notification/notification", { notifications });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des notifications.");
    }
};

const toggleReadStatus = async (req, res) => {
    try {
      if (!req.user || (!req.user._id && !req.user.id)) {
        console.error("⛔ Utilisateur non authentifié.");
        return res.status(401).json({ error: "Utilisateur non authentifié." });
      }
      const notification = await Notification.findById(req.params.id);
      if (!notification) {
        console.error("⛔ Notification non trouvée :", req.params.id);
        return res.status(404).json({ error: "Notification non trouvée." });
      }
      const userId = req.user._id ? req.user._id.toString() : req.user.id.toString();
      if (notification.user.toString() !== userId) {
        console.error("⛔ Accès interdit à cette notification.");
        return res.status(403).json({ error: "Accès interdit à cette notification." });
      }
      // Bascule du statut
      notification.read = !notification.read;
      await notification.save();
      const message = notification.read
        ? "Notification marquée comme lue."
        : "Notification n'est plus marquée comme lue.";
      console.log("✅", message);
      res.status(200).json({ read: notification.read, message });
    } catch (error) {
      console.error("❌ Erreur dans toggleReadStatus :", error);
      res.status(500).json({ error: "Une erreur est survenue lors de la mise à jour." });
    }
};
  
  
  const markAllAsRead = async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).send("Utilisateur non authentifié.");
      }
      // Mise à jour en masse : seules les notifications non lues sont modifiées
      await Notification.updateMany(
        { user: req.user.id, read: false },
        { $set: { read: true } }
      );
      res.status(200).send("Toutes les notifications non lues ont été marquées comme lues.");
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour des notifications:", error);
      res.status(500).send("Une erreur est survenue lors de la mise à jour.");
    }
  };
  

const deleteNotification = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            console.error("⛔ Utilisateur non authentifié.");
            return res.status(401).send("Utilisateur non authentifié.");
        }

        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            console.error("⛔ Notification non trouvée :", req.params.id);
            return res.status(404).send("Notification non trouvée.");
        }

        if (!notification.user) {
            console.error("⚠️ La notification récupérée ne contient pas de champ 'user'.");
            return res.status(500).send("Erreur interne : La notification n'a pas d'utilisateur associé.");
        }

        if (notification.user.toString() !== req.user.id.toString()) {
            console.error("⛔ Accès interdit à cette notification.");
            return res.status(403).send("Accès interdit.");
        }

        await notification.deleteOne();

        return res.status(200).send("Notification supprimée.");
    } catch (error) {
        console.error("❌ Erreur lors de la suppression de la notification:", error);
        res.status(500).send("Une erreur est survenue lors de la suppression de la notification.");
    }
};

module.exports = { getNotifications, toggleReadStatus, deleteNotification, markAllAsRead };
