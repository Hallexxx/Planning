const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const MicroCreche = require("../models/MicroCreche");
const Child = require("../models/Enfant");
const Employee = require("../models/Employee");
const Planning = require("../models/Planning");

const signup = async (req, res) => {
  const { nom, prenom, email, password, role } = req.body;

  if (!nom || !prenom || !email || !password || !role) {
    return res.status(400).json({ message: "Veuillez remplir tous les champs" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      nom,
      prenom,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

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
  res.redirect("/");  
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate("microCreches");

    const microCreches = await MicroCreche.find({ owner: userId })
      .populate("employees enfants")
      .exec();

    const enfants = await Child.find().populate("microCreche");

    const employees = await Employee.find().populate("microCreche");

    const plannings = await Planning.find({
      microCreche: { $in: user.microCreches.map((creche) => creche._id) },
    }).exec();

    res.render("profile", { user, microCreches, enfants, employees, plannings });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    res.status(500).send("Erreur serveur");
  }
};

const updateField = async (req, res) => {
  try {
    const userId = req.user.id; 
    console.log("Données reçues dans le backend :", req.body);

    const { field, value } = req.body;

    const validFields = ["nom", "prenom", "email", "role"];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: "Champ invalide" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { [field]: value },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.status(200).json({ message: "Mise à jour réussie", user: updatedUser });
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


module.exports = {
  signup,
  login,
  getProfile,
  updateField,
};
