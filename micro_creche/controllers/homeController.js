const moment = require("moment");
const MicroCreche = require("../models/MicroCreche");
const Planning = require("../models/Planning");

const mergeTimeSlots = (slots) => {
  const mergedSlots = [];

  slots.sort((a, b) => a.start.localeCompare(b.start));

  for (const slot of slots) {
    const lastSlot = mergedSlots[mergedSlots.length - 1];

    if (
      lastSlot &&
      lastSlot.end === slot.start &&
      JSON.stringify(lastSlot.children) === JSON.stringify(slot.children) &&
      JSON.stringify(lastSlot.employees) === JSON.stringify(slot.employees)
    ) {
      lastSlot.end = slot.end;
    } else {
      mergedSlots.push({ ...slot });
    }
    console.log("Slot children:", slot.children);
    console.log("Slot employees:", slot.employees);
  }

  return mergedSlots;
};

exports.getHomePage = async (req, res) => {
  try {
    const userAuthenticated = !!req.user;
    let microCreches = [];
    let plannings = [];

    if (userAuthenticated) {
      microCreches = await MicroCreche.find({ owner: req.user.id })
        .populate("enfants", "name horaires")
        .populate("employees", "name");

      if (microCreches.length > 0) {
        plannings = await Planning.find({
          microCreche: { $in: microCreches.map(mc => mc._id) },
        })
          .populate("microCreche", "name")
          .populate("slots.children", "name horaires")
          .populate("slots.employees", "name");
      }
    }

    // Initialisation de slotsByDay pour chaque planning
    plannings.forEach(planning => {
      planning.slotsByDay = {};

      // Remplir slotsByDay avec les données de planning
      planning.slots.forEach(slot => {
        const day = slot.day;

        if (!planning.slotsByDay[day]) {
          planning.slotsByDay[day] = [];
        }

        planning.slotsByDay[day].push({
          start: slot.start,
          end: slot.end,
          children: slot.children.filter(child => !!child), // Exclut les enfants supprimés
          employees: slot.employees.filter(emp => !!emp), // Exclut les employés supprimés
          missingEmployees: slot.missingEmployees || 0,
        });
      });
    });

    res.render("home", {
      userAuthenticated,
      microCreches,
      eligibleMicroCreches: microCreches.filter(
        mc => mc.employees.length > 0 && mc.enfants.length > 0
      ),
      plannings,
      daysOfWeek: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"],
    });
  } catch (error) {
    console.error("Erreur lors du chargement de la page d'accueil:", error);
    res.status(500).send("Une erreur s'est produite. Veuillez réessayer plus tard.");
  }
};

