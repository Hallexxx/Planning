const Child = require("../models/Enfant"); // Modèle de l'enfant
const MicroCreche = require("../models/MicroCreche");

exports.getAllChildren = async (req, res) => {
  try {
    const children = await Child.find().populate("microCreche");
    res.render("enfants/index_child", { children });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la récupération des enfants.");
  }
};

exports.getAddChildForm = async (req, res) => {
  try {
    const microCreches = await MicroCreche.find(); // Récupère toutes les micro-crèches
    res.render("enfants/create", { microCreches });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la récupération des micro-crèches.");
  }
};

exports.addChild = async (req, res) => {
  const { name, dateOfBirth, microCrecheId, horaires } = req.body; // Données de l'enfant

  // Valider que chaque horaire suit le format attendu "xh-xxh"
  const validTimeFormat = (time) => /^(\d{1,2})h-(\d{1,2})h$/.test(time);

  const horairesValid = Object.values(horaires).every(time => !time || validTimeFormat(time));

  if (!horairesValid) {
    return res.status(400).send("Les horaires doivent être au format 'xh-xxh'.");
  }

  try {
    // Créer l'enfant
    const newChild = new Child({
      name,
      dateOfBirth,
      microCreche: microCrecheId,
      horaires: {
        lundi: horaires.lundi,
        mardi: horaires.mardi,
        mercredi: horaires.mercredi,
        jeudi: horaires.jeudi,
        vendredi: horaires.vendredi,
      },
    });

    await newChild.save();

    // Mettre à jour la micro-crèche pour inclure l'enfant
    await MicroCreche.findByIdAndUpdate(
      microCrecheId,
      { $push: { enfants: newChild._id } }, // Ajouter l'enfant à la liste des enfants
      { new: true }
    );

    res.redirect("/child"); // Redirection vers la liste des enfants
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de l'ajout de l'enfant.");
  }
};

exports.deleteChild = async (req, res) => {
  try {
    const child = await Child.findByIdAndDelete(req.params.id);

    if (child) {
      // Retirer l'enfant de la micro-crèche
      await MicroCreche.findByIdAndUpdate(child.microCreche, {
        $pull: { enfants: child._id },
      });
    }

    res.redirect("/child");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la suppression de l'enfant.");
  }
};
  

exports.getChildDetails = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id).populate("microCreche");
    if (!child) {
      return res.status(404).send("Enfant non trouvé.");
    }
    res.render("enfants/details", { child });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la récupération des détails de l'enfant.");
  }
};
