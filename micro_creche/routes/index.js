const express = require("express");
const router = express.Router();
const moment = require("moment");
const { authMiddleware, authenticateUser } = require("../middleware/authMiddleware");
const MicroCreche = require("../models/MicroCreche");
const Planning = require("../models/Planning");
const { getProfile } = require("../controllers/userController");

router.get("/profile", getProfile);

const isTimeWithinInterval = (time, interval) => {
  const [start, end] = interval.split("-").map(t => t.trim());
  const timeMoment = moment(time, "HH:mm");
  const startMoment = moment(start, "HH:mm");
  const endMoment = moment(end, "HH:mm");
  return timeMoment.isSameOrAfter(startMoment) && timeMoment.isBefore(endMoment);
};

// Page d'accueil
router.get("/", authenticateUser, async (req, res) => {
  try {
    const userAuthenticated = !!req.user;
    let microCreches = [];
    let plannings = [];

    if (userAuthenticated) {
      // Récupérer les micro-crèches avec enfants et employés
      microCreches = await MicroCreche.find({ owner: req.user.id })
        .populate("enfants", "name") // Charge uniquement les noms des enfants
        .populate("employees", "name"); // Charge uniquement les noms des employés

      console.log("Micro-crèches chargées:", microCreches);

      if (microCreches.length > 0) {
        // Récupérer les plannings avec leurs slots, enfants et employés
        plannings = await Planning.find({
          microCreche: { $in: microCreches.map(mc => mc._id) },
        })
          .populate("microCreche", "name") // Charge uniquement le nom des micro-crèches
          .populate("slots.children", "name") // Charge les noms des enfants dans les slots
          .populate("slots.employees", "name"); // Charge les noms des employés dans les slots

        console.log("Plannings récupérés pour chaque micro-crèche.");
      }
    }

    // Rendu de la vue avec les données récupérées
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
});

// Génération du planning
router.post("/generate-planning/:microCrecheId", async (req, res) => {
  try {
    const microCreche = await MicroCreche.findById(req.params.microCrecheId).populate("enfants employees");

    if (!microCreche) {
      console.log("Micro-crèche introuvable.");
      return res.status(404).json({ success: false, message: "Micro-crèche introuvable" });
    }

    if (microCreche.enfants.length === 0 || microCreche.employees.length === 0) {
      console.log("Micro-crèche non éligible pour le planning.");
      return res.status(400).json({ success: false, message: "Micro-crèche non éligible pour un planning." });
    }

    const daysOfWeek = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"];
    const slots = [];

    // Suivi des heures travaillées par chaque employé sur la semaine entière
    const employeeHoursAssigned = microCreche.employees.reduce((acc, employee) => {
      acc[employee._id] = { total: 0, daily: {} }; // Total des heures travaillées et par jour pour chaque employé
      return acc;
    }, {});

    // Création des créneaux horaires
    for (let day of daysOfWeek) {
      for (let hour = 6; hour < 20; hour++) {
        const start = `${hour}:00`;
        const end = `${hour + 1}:00`;

        const childrenInSlot = microCreche.enfants.filter(child => {
          const schedule = child.horaires[day];
          return schedule && isTimeWithinInterval(`${hour}:00`, schedule);
        });

        slots.push({ day, start, end, children: childrenInSlot, employees: [], missingEmployees: 0 });
      }
    }

    // Affectation des employés aux créneaux horaires
    for (let slot of slots) {
      let remainingChildren = slot.children.length;
      let assignedEmployees = [];
      const availableEmployees = microCreche.employees.filter(employee => {
        // Vérifier si l'employé a des heures disponibles pour travailler
        const assignedHours = getTotalAssignedHours(employee._id, employeeHoursAssigned);
        return employee.workHoursPerWeek - assignedHours.total > 0;
      });

      // Nombre d'employés nécessaires : diviser le nombre d'enfants par 3
      const numEmployeesNeeded = Math.ceil(remainingChildren / 3);

      // On assigne les employés disponibles à chaque créneau horaire, en respectant le nombre d'enfants
      while (remainingChildren > 0 && assignedEmployees.length < numEmployeesNeeded) {
        // Chercher un employé disponible
        const employee = availableEmployees.find(emp => {
          const assignedHours = getTotalAssignedHours(emp._id, employeeHoursAssigned);
          const maxAvailableHours = emp.workHoursPerWeek - assignedHours.total;
          return maxAvailableHours > 0 && !assignedEmployees.includes(emp); // Vérifier qu'il n'est pas déjà assigné
        });

        if (!employee) {
          // Si aucun employé n'est disponible, on ajoute des employés manquants
          slot.missingEmployees = numEmployeesNeeded - assignedEmployees.length;
          break;
        }

        // Calculer combien d'enfants cet employé va garder
        const childrenForThisEmployee = Math.min(3, remainingChildren);

        // Affecter l'employé au créneau (une heure de travail par créneau, peu importe le nombre d'enfants)
        assignedEmployees.push(employee);
        remainingChildren -= childrenForThisEmployee;

        // Mettre à jour les heures de travail de l'employé pour ce créneau (1 heure par créneau, peu importe le nombre d'enfants)
        if (!employeeHoursAssigned[employee._id].daily[slot.day]) {
          employeeHoursAssigned[employee._id].daily[slot.day] = 0;
        }
        employeeHoursAssigned[employee._id].daily[slot.day] += 1; // 1 heure pour ce créneau

        // Mettre à jour les heures totales de l'employé pour la semaine
        employeeHoursAssigned[employee._id].total += 1; // 1 heure pour ce créneau
      }

      // Attribuer les employés au créneau
      slot.employees = assignedEmployees;

      // Vérifier si tous les enfants ont été assignés
      if (remainingChildren > 0) {
        slot.missingEmployees = Math.ceil(remainingChildren / 3);
      }
    }

    // Fonction pour obtenir le total des heures assignées à un employé
    function getTotalAssignedHours(employeeId, employeeHoursAssigned) {
      return employeeHoursAssigned[employeeId] || { total: 0, daily: {} };
    }

    // Sauvegarde du planning généré
    const planning = new Planning({
      microCreche: microCreche._id,
      date: new Date(),
      slots,
    });

    await planning.save();
    console.log("Planning généré et sauvegardé avec succès.");
    res.status(200).json({ success: true, message: "Planning généré avec succès." });
  } catch (error) {
    console.error("Erreur lors de la génération du planning:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la génération du planning." });
  }
});




module.exports = router;
