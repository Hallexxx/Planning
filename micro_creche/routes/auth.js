// /routes/auth.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/signup/employe", (req, res) => {
    res.render("signup/signup_employe");  // Page de formulaire pour les employés
});

// Route pour afficher le formulaire d'inscription pour les professionnels
router.get("/signup/pro", (req, res) => {
res.render("signup/signup_pro");  // Page de formulaire pour les professionnels
});

// Route pour traiter l'inscription
router.post("/signup", userController.signup);

// Route pour afficher le formulaire de connexion
router.get("/login", (req, res) => {
  const message = req.query.message || null;
  res.render("login/login", { message });
});

router.get("/logout", (req, res) => {
  res.clearCookie("auth_token"); // Supprime le cookie contenant le token
  res.redirect("/"); // Redirige vers la page d'accueil
});

// Route pour traiter la connexion
router.post("/login", userController.login);

module.exports = router;
