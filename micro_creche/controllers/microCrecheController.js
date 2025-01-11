const MicroCreche = require("../models/MicroCreche");
const Employee = require("../models/Employee"); 
const Child = require("../models/Enfant"); 

const getMicroCrecheDetails = async (req, res) => {
  try {
    const microCreche = await MicroCreche.findById(req.params.id).populate("owner");
    if (!microCreche) {
      return res.status(404).send("Micro-crèche introuvable.");
    }

    const children = await Child.find({ microCreche: microCreche._id }); 
    const employees = await Employee.find({ microCreche: microCreche._id }); 

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

const getDashboard = async (req, res) => {
  try {
    const microCreches = await MicroCreche.find({ owner: req.user.id });

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

const getCreateForm = (req, res) => {
    res.render("microCreche/create", { message: null, user: req.user });
};

const createMicroCreche = async (req, res) => {
    console.log("Requête reçue :", req.body);
    console.log("Utilisateur connecté :", req.user);
  const { name, address, description } = req.body;

  if (!name || !address) {
    return res.render("microCreche/create", {
      message: "Veuillez remplir tous les champs obligatoires.",
    });
  }

  try {
    if (!req.user) {
      return res.render("microCreche/create", {
        message: "Vous devez être connecté pour créer une micro-crèche.",
      });
    }

    const newMicroCreche = new MicroCreche({
      name,
      address,
      description: description || null, 
      owner: req.user.id,
    });

    await newMicroCreche.save();
    res.redirect(`/micro-creche/${newMicroCreche._id}`); 
  } catch (error) {
    console.error("Erreur lors de la création de la micro-crèche:", error);
    res.render("microCreche/create", {
      message: "Une erreur s'est produite. Veuillez réessayer.",
    });
  }
};

const updateField = async (req, res) => {
  try {
    console.log("Données reçues dans le backend :", req.body);

    const { microCrecheId, field, value } = req.body;

    // Champs autorisés à être modifiés
    const validFields = ["name", "address", "description"];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: "Champ invalide" });
    }

    // Mise à jour de la micro-crèche avec l'ID spécifié
    const updatedMicroCreche = await MicroCreche.findByIdAndUpdate(
      microCrecheId,
      { [field]: value },
      { new: true, runValidators: true }
    );

    if (!updatedMicroCreche) {
      return res.status(404).json({ error: "Micro-crèche non trouvée" });
    }

    res.status(200).json({ message: "Mise à jour réussie", microCreche: updatedMicroCreche });
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


module.exports = {
  updateField,
  getCreateForm,
  createMicroCreche,
  getDashboard,
  getMicroCrecheDetails,
};
