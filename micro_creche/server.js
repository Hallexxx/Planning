const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const { authenticateUser, authMiddleware } = require("./middleware/authMiddleware"); // Importer les middlewares d'authentification

// Chargement des variables d'environnement depuis .env
dotenv.config();

// Connexion à la base de données
connectDB();

const app = express();

// Middleware pour gérer les fichiers statiques (CSS, JS, images)
app.use(express.static("public"));
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes); 

app.use(authenticateUser); 

// Définition des routes
const indexRoutes = require("./routes/index");
app.use("/", indexRoutes);

const microCrecheRoutes = require("./routes/microCreche");
app.use("/", microCrecheRoutes);

const childRoutes = require("./routes/childRoutes");
app.use("/", childRoutes);

const employeeRoutes = require("./routes/employeeRoutes");
app.use("/", employeeRoutes);


// Lancer le serveur sur le port défini dans le fichier .env
app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
