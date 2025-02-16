const MicroCreche = require("../models/MicroCreche");
const Employee = require("../models/Employee"); 
const Child = require("../models/Enfant"); 
const Planning = require("../models/Planning");
const User = require("../models/User");
const mongoose = require("mongoose");

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

const deleteMicrocreche = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID invalide" });
    }

    try {
        const microcreche = await MicroCreche.findById(id);

        if (!microcreche) {
            return res.status(404).json({ error: "Micro-crèche non trouvée" });
        }

        await Enfant.deleteMany({ microCreche: id });

        await Employee.deleteMany({ microCreche: id });

        await Planning.deleteMany({ microCreche: id });

        await User.updateMany(
            { microCreches: id },
            { $pull: { microCreches: id } }
        );

        await microcreche.deleteOne();

        res.status(200).json({ success: true, message: "Micro-crèche supprimée avec succès." });
    } catch (error) {
        console.error("Erreur lors de la suppression de la micro-crèche :", error);
        res.status(500).json({ error: "Erreur serveur lors de la suppression de la micro-crèche." });
    }
};

const updateField = async (req, res) => {
    try {
        console.log("Données reçues dans le backend :", req.body);

        const { microCrecheId, field, value } = req.body;

        const validFields = ["name", "address", "description"];
        if (!validFields.includes(field)) {
            return res.status(400).json({ error: "Champ invalide" });
        }

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
  deleteMicrocreche,
};
