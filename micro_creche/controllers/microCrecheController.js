const MicroCreche = require("../models/MicroCreche");
const Employee = require("../models/Employee"); // Modèle pour les employés
const Child = require("../models/Enfant"); // Modèle pour les enfants

exports.getMicroCrecheDetails = async (req, res) => {
  try {
    const microCreche = await MicroCreche.findById(req.params.id).populate("owner"); // Récupérer la micro-crèche
    if (!microCreche) {
      return res.status(404).send("Micro-crèche introuvable.");
    }

    const children = await Child.find({ microCreche: microCreche._id }); // Enfants associés
    const employees = await Employee.find({ microCreche: microCreche._id }); // Employés associés

    res.render("microCreche/details", {
      microCreche,
      children,
      employees,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des détails :", error);
    res.status(500).send("Erreur serveur.");
  }
};

exports.getDashboard = async (req, res) => {
  try {
    // Récupérer toutes les micro-crèches de l'utilisateur
    const microCreches = await MicroCreche.find({ owner: req.user.id });

    // Récupérer les enfants et les employés associés à ces micro-crèches
    const children = await Child.find({ microCreche: { $in: microCreches.map(mc => mc._id) } });
    const employees = await Employee.find({ microCreche: { $in: microCreches.map(mc => mc._id) } });

    res.render("microCreche/index_creche", {
      microCreches,
      children,
      employees,
      user: req.user,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des micro-crèches:", error);
    res.status(500).send("Erreur serveur.");
  }
};

exports.getCreateForm = (req, res) => {
    res.render("microCreche/create", { message: null, user: req.user });
};

// Gérer la création d'une micro-crèche
exports.createMicroCreche = async (req, res) => {
    console.log("Requête reçue :", req.body);
    console.log("Utilisateur connecté :", req.user);
  const { name, address, description } = req.body;

  if (!name || !address) {
    return res.render("microCreche/create", {
      message: "Veuillez remplir tous les champs obligatoires.",
    });
  }

  try {
    // Vérifiez que l'utilisateur est connecté
    if (!req.user) {
      return res.render("microCreche/create", {
        message: "Vous devez être connecté pour créer une micro-crèche.",
      });
    }

    // Créer et sauvegarder la micro-crèche
    const newMicroCreche = new MicroCreche({
      name,
      address,
      description: description || null, // Description facultative
      owner: req.user.id, // ID de l'utilisateur connecté
    });

    await newMicroCreche.save();
    res.redirect(`/micro-creche/${newMicroCreche._id}`); // Redirection après succès
  } catch (error) {
    console.error("Erreur lors de la création de la micro-crèche:", error);
    res.render("microCreche/create", {
      message: "Une erreur s'est produite. Veuillez réessayer.",
    });
  }
};
