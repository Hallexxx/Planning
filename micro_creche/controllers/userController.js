const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const MicroCreche = require("../models/MicroCreche");
const Enfant = require("../models/Enfant");
const Employee = require("../models/Employee");


const signup = async (req, res) => {
  const { nom, prenom, email, password, role } = req.body;

  if (!nom || !prenom || !email || !password || !role) {
    return res.status(400).json({ message: "Veuillez remplir tous les champs" });
  }

  try {
    // Vérification si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création du nouvel utilisateur
    const newUser = new User({
      nom,
      prenom,
      email,
      password: hashedPassword,
      role,
    });

    // Sauvegarde dans la base de données
    await newUser.save();

    // Génération du token JWT
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Enregistrement du token dans un cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
    });

    res.redirect("/");
  } catch (error) {
    console.error("Erreur lors de la création du compte :", error); // Log de l'erreur
    res.status(500).json({ message: "Erreur lors de la création du compte" });
  }
};



const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Utilisateur non trouvé." });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Mot de passe incorrect." });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

  res.cookie("auth_token", token, { httpOnly: true });
  res.redirect("/");  // Redirection vers la page d'accueil ou le tableau de bord
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // ID utilisateur récupéré depuis le middleware d'authentification
    const user = await User.findById(userId).populate("microCreches");
    const microCreches = await MicroCreche.find({ owner: userId }).populate("employees enfants");
    const enfants = await Enfant.find({ microCreche: { $in: user.microCreches } });
    const employees = await Employee.find({ microCreche: { $in: user.microCreches } });

    res.render("profile", { user, microCreches, enfants, employees });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    res.status(500).send("Erreur serveur");
  }
};

module.exports = {
  signup,
  login,
  getProfile,
};
