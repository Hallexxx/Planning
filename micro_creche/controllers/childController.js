const Child = require("../models/Enfant"); 
const MicroCreche = require("../models/MicroCreche");
const mongoose = require("mongoose");

const getAllChildren = async (req, res) => {
    try {
        const userMicroCreches = await MicroCreche.find({ owner: req.user.id });
        const microCrecheIds = userMicroCreches.map(mc => mc._id);
        
        const children = await Child.find({ 
        microCreche: { $in: microCrecheIds }
        }).populate("microCreche");

        res.render("enfants/index_child", { children, microCreches: userMicroCreches });
    } catch (error) {
        console.error(error); 
        res.status(500).send("Erreur lors de la récupération des enfants.");
    }
};

const getAddChildForm = async (req, res) => {
    try {
        const microCreches = await MicroCreche.find(); 
        res.render("enfants/create", { microCreches });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des micro-crèches.");
    }
};

const addChild = async (req, res) => {
    const { name, dateOfBirth, microCrecheId, horaires } = req.body;

    const validTimeFormat = (time) => /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.test(time);

    const horairesValid = Object.values(horaires).every(time => !time || validTimeFormat(time));

    if (!horairesValid) {
        return res.status(400).send("Les horaires doivent être au format 'hh:mm-hh:mm' ou 'hhh'.");
    }

    const standardizeTimeFormat = (time) => {
        if (!time) return null;
        return time
        .replace(/h/g, ":")
        .replace(/:(\d{1})$/, ":$10");
    };

    const standardizedHoraires = Object.fromEntries(
        Object.entries(horaires).map(([day, time]) => [day, standardizeTimeFormat(time)])
    );

    try {
        const newChild = new Child({
            name,
            dateOfBirth,
            microCreche: microCrecheId,
            horaires: {
                lundi: standardizedHoraires.lundi,
                mardi: standardizedHoraires.mardi,
                mercredi: standardizedHoraires.mercredi,
                jeudi: standardizedHoraires.jeudi,
                vendredi: standardizedHoraires.vendredi,
            },
        });

        await newChild.save();

        await MicroCreche.findByIdAndUpdate(
        microCrecheId,
            { $push: { enfants: newChild._id } }, 
            { new: true }
        );

        res.redirect("/child");
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de l'ajout de l'enfant.");
    }
};


const deleteChild = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID invalide" });
    }

    try {
        const child = await Child.findByIdAndDelete(id);

        if (!child) {
            return res.status(404).json({ error: "Enfant non trouvé" });
        }

        await MicroCreche.findByIdAndUpdate(child.microCreche, {
            $pull: { enfants: id },
        });

        res.status(200).json({ success: true, message: "Enfant supprimé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'enfant :", error);
        res.status(500).json({ error: "Erreur serveur lors de la suppression de l'enfant" });
    }
};
  
const getChildDetails = async (req, res) => {
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

const updateChildField = async (req, res) => {
    try {
        const { childId, field, value } = req.body;

        if (!mongoose.Types.ObjectId.isValid(childId)) {
            return res.status(400).json({ error: "ID de l'enfant invalide" });
        }

        if (field === 'name' || field === 'dateOfBirth') {
            const updatedChild = await Child.findByIdAndUpdate(
                childId,
                { [field]: value }, 
                { new: true, runValidators: true }
            );

            if (!updatedChild) {
                return res.status(404).json({ error: "Enfant non trouvé" });
            }

            return res.status(200).json({ message: "Mise à jour réussie", child: updatedChild });
        }

        const validDays = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"];
        const day = field.split(".")[1]; 

        if (validDays.includes(day)) {
            const updatedChild = await Child.findByIdAndUpdate(
                childId,
                { [`horaires.${day}`]: value }, 
                { new: true, runValidators: true }
            );

            if (!updatedChild) {
                return res.status(404).json({ error: "Enfant non trouvé" });
            }

            return res.status(200).json({ message: "Mise à jour des horaires réussie", child: updatedChild });
        }

        return res.status(400).json({ error: "Champ invalide ou non pris en charge" });
    } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

module.exports = { getAllChildren, getAddChildForm, addChild, deleteChild, getChildDetails, updateChildField };