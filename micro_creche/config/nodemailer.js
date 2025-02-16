const nodemailer = require("nodemailer");

// Création d'un transporteur Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // Vous pouvez remplacer par un autre service SMTP si nécessaire
  auth: {
    user: process.env.EMAIL, // Adresse email (définie dans .env)
    pass: process.env.EMAIL_PASSWORD, // Mot de passe ou clé d'application (définie dans .env)
  },
});

// Exporter le transporteur pour l'utiliser dans les autres fichiers
module.exports = transporter;
