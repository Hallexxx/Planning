const moment = require("moment");
const MicroCreche = require("../models/MicroCreche");
const Planning = require("../models/Planning");
const puppeteer = require('puppeteer');
const path = require('path');

const isTimeWithinInterval = (time, interval) => {
  const [start, end] = interval.split("-").map(t => t.trim());
  const timeMoment = moment(time, "HH:mm");
  const startMoment = moment(start, "HH:mm");
  const endMoment = moment(end, "HH:mm");
  return timeMoment.isSameOrAfter(startMoment) && timeMoment.isBefore(endMoment);
};

exports.generatePlanning = async (req, res) => {
  try {
    const microCreche = await MicroCreche.findById(req.params.microCrecheId).populate("enfants employees");

    if (!microCreche) {
      return res.status(404).json({ success: false, message: "Micro-crèche introuvable" });
    }

    if (microCreche.enfants.length === 0 || microCreche.employees.length === 0) {
      return res.status(400).json({ success: false, message: "Micro-crèche non éligible pour un planning." });
    }

    const daysOfWeek = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"];
    const slots = [];
    const employeeHoursAssigned = microCreche.employees.reduce((acc, employee) => {
      acc[employee._id] = { total: 0, daily: {} };
      return acc;
    }, {});

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

    for (let slot of slots) {
      let remainingChildren = slot.children.length;
      let assignedEmployees = [];
      const availableEmployees = microCreche.employees.filter(employee => {
        const assignedHours = getTotalAssignedHours(employee._id, employeeHoursAssigned);
        return employee.workHoursPerWeek - assignedHours.total > 0;
      });

      const numEmployeesNeeded = Math.ceil(remainingChildren / 3);

      while (remainingChildren > 0 && assignedEmployees.length < numEmployeesNeeded) {
        const employee = availableEmployees.find(emp => {
          const assignedHours = getTotalAssignedHours(emp._id, employeeHoursAssigned);
          return emp.workHoursPerWeek - assignedHours.total > 0 && !assignedEmployees.includes(emp);
        });

        if (!employee) {
          slot.missingEmployees = numEmployeesNeeded - assignedEmployees.length;
          break;
        }

        assignedEmployees.push(employee);
        remainingChildren -= Math.min(3, remainingChildren);

        if (!employeeHoursAssigned[employee._id].daily[slot.day]) {
          employeeHoursAssigned[employee._id].daily[slot.day] = 0;
        }
        employeeHoursAssigned[employee._id].daily[slot.day] += 1;
        employeeHoursAssigned[employee._id].total += 1;
      }

      slot.employees = assignedEmployees;
      if (remainingChildren > 0) {
        slot.missingEmployees = Math.ceil(remainingChildren / 3);
      }
    }

    function getTotalAssignedHours(employeeId, employeeHoursAssigned) {
      return employeeHoursAssigned[employeeId] || { total: 0, daily: {} };
    }

    const planning = new Planning({
      microCreche: microCreche._id,
      date: new Date(),
      slots,
    });

    await planning.save();
    res.status(200).json({ success: true, message: "Planning généré avec succès." });
  } catch (error) {
    console.error("Erreur lors de la génération du planning:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la génération du planning." });
  }
};

exports.getChildPlannings = async (req, res) => {
    try {
      const microCreches = await MicroCreche.find({ owner: req.user.id });
  
      if (microCreches.length === 0) {
        return res.status(404).send("Aucune micro-crèche associée à votre compte.");
      }
  
      const plannings = await Planning.find({
        microCreche: { $in: microCreches.map(mc => mc._id) },
      }).populate("microCreche", "name").populate("slots.children", "name");
  
      if (plannings.length === 0) {
        return res.status(404).send("Aucun planning trouvé.");
      }
  
      res.render("planning/childPlannings", {
        title: "Planning des enfants",
        plannings,
        daysOfWeek: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] 
      });
    } catch (error) {
      console.error("Erreur lors du chargement des plannings des enfants :", error);
      res.status(500).send("Une erreur s'est produite.");
    }
};
  
exports.getEmployeePlannings = async (req, res) => {
    try {
        const microCreches = await MicroCreche.find({ owner: req.user.id });

        if (microCreches.length === 0) {
        return res.status(404).send("Aucune micro-crèche associée à votre compte.");
        }

        const plannings = await Planning.find({
        microCreche: { $in: microCreches.map(mc => mc._id) },
        }).populate("microCreche", "name").populate("slots.employees", "name");

        if (plannings.length === 0) {
        return res.status(404).send("Aucun planning trouvé.");
        }

        res.render("planning/employeePlannings", {
        title: "Planning des employés",
        plannings,
        daysOfWeek: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] 
        });
    } catch (error) {
        console.error("Erreur lors du chargement des plannings des employés :", error);
        res.status(500).send("Une erreur s'est produite.");
    }
};

const ejs = require('ejs')

exports.generatePDF = async (req, res) => {
  try {
    const contentPath = path.join(__dirname, '../views/home.ejs'); 

    ejs.renderFile(contentPath, {}, async (err, html) => {
      if (err) {
        console.error('Erreur lors du rendu EJS :', err);
        return res.status(500).send('Erreur lors du rendu de la page EJS.');
      }

      // Créer une instance de Puppeteer pour contrôler le navigateur
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      // Charger le HTML rendu dans Puppeteer
      await page.setContent(html);

      // Générer le PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        landscape: false, // Si tu veux un PDF en orientation portrait
      });

      // Renvoyer le PDF au client pour téléchargement
      res.contentType("application/pdf");
      res.send(pdfBuffer);

      // Fermer le navigateur
      await browser.close();
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    res.status(500).send('Erreur lors de la génération du PDF.');
  }
};



