const moment = require("moment");
const MicroCreche = require("../models/MicroCreche");
const Planning = require("../models/Planning");
const Notification = require('../models/Notification');
const transporter = require("../config/nodemailer");

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
    }
    return mergedSlots;
};

const generateTimeIntervals = (startHour, endHour, intervalMinutes = 15) => {
    const intervals = [];
    for (let hour = startHour; hour < endHour; hour++) {
        for (let min = 0; min < 60; min += intervalMinutes) {
            const start = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
            const endHour = min + intervalMinutes >= 60 ? hour + 1 : hour;
            const endMin = (min + intervalMinutes) % 60;
            const end = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
            intervals.push({ start, end });
        }
    }
    return intervals;
};

const getSlotClass = (childrenCount) => {
    if (childrenCount < 3) return "bg-blue";
    if (childrenCount <= 6) return "bg-orange";
    return "bg-red";
};

exports.getHomePage = async (req, res) => {
    try {
        const user = req.user;
        let notifications = [];
        if (user) {
            notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(3);
        }
        let microCreches = [];
        let plannings = [];
        let slots = []; 
        let totalMissingHoursGlobal = 0;

        if (user) {
            microCreches = await MicroCreche.find({ owner: req.user.id })
                .populate("enfants", "name horaires")
                .populate("employees", "name");

            if (microCreches.length > 0) {
                plannings = await Planning.find({
                microCreche: { $in: microCreches.map((mc) => mc._id) },
                })
                .populate("microCreche", "name")
                .populate("slots.children", "name horaires")
                .populate("slots.employees", "name");

                slots = plannings.flatMap(planning => planning.slots);

                totalMissingHoursGlobal = plannings.reduce((total, planning) => {
                const missingHours = planning.slots.reduce(
                    (sum, slot) => sum + (slot.missingEmployees || 0) * 0.5,
                    0
                );
                return total + missingHours;
                }, 0);
            }
        }

        const daysOfWeek = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"];
        const startHour = 7;
        const endHour = 19;
        const intervalMinutes = 30;
        const timeIntervals = generateTimeIntervals(startHour, endHour, intervalMinutes);

        const todayIndex = Math.max(0, Math.min(4, new Date().getDay() - 1)); 
        const selectedDay = (req.query.day || daysOfWeek[todayIndex] || "").trim().toLowerCase();


        const getPresenceTimes = (slots) => {
            let childrenPresence = {};
            let employeesPresence = {};
        
            slots.forEach((slot) => {
                if (!slot || !slot.day) {
                    console.warn("Créneau mal formé ou sans 'day':", slot);
                    return;
                }
        
                const day = slot.day.trim().toLowerCase();

                if (day !== selectedDay.toLowerCase()) return;
        
                const children = slot.children || [];
                const employees = slot.employees || [];
        
                children.forEach((child) => {
                    if (!child || !child._id) {
                        console.warn("Données de l'enfant mal formées:", child);
                        return;
                    }
                    const childId = child._id.toString();
                    if (!childrenPresence[childId]) {
                        childrenPresence[childId] = {
                            name: child.name,
                            startTime: slot.start,
                            endTime: slot.end,
                        };
                    } else {
                        const currentStart = moment(childrenPresence[childId].startTime, "HH:mm");
                        const currentEnd = moment(childrenPresence[childId].endTime, "HH:mm");
        
                        if (moment(slot.start, "HH:mm").isBefore(currentStart)) {
                            childrenPresence[childId].startTime = slot.start;
                        }
                        if (moment(slot.end, "HH:mm").isAfter(currentEnd)) {
                            childrenPresence[childId].endTime = slot.end;
                        }
                    }
                });
        
                employees.forEach((employee) => {
                    if (!employee || !employee._id) {
                        console.warn("Données de l'employé mal formées:", employee);
                        return;
                    }
                    const employeeId = employee._id.toString();
                    if (!employeesPresence[employeeId]) {
                        employeesPresence[employeeId] = {
                            name: employee.name,
                            startTime: slot.start,
                            endTime: slot.end,
                        };
                    } else {
                        const currentStart = moment(employeesPresence[employeeId].startTime, "HH:mm");
                        const currentEnd = moment(employeesPresence[employeeId].endTime, "HH:mm");
        
                        if (moment(slot.start, "HH:mm").isBefore(currentStart)) {
                            employeesPresence[employeeId].startTime = slot.start;
                        }
                        if (moment(slot.end, "HH:mm").isAfter(currentEnd)) {
                            employeesPresence[employeeId].endTime = slot.end;
                        }
                    }
                });
            });
        
            return { childrenPresence, employeesPresence };
        };
        
        const { childrenPresence, employeesPresence } = getPresenceTimes(slots);

        res.render("home", {
            user,
            microCreches,
            eligibleMicroCreches: microCreches.filter(
                (mc) => mc.employees.length > 0 && mc.enfants.length > 0
            ),
            getSlotClass,
            plannings,
            slots,
            daysOfWeek,
            timeIntervals,
            totalMissingHoursGlobal,
            selectedDay, 
            childrenPresence,
            employeesPresence,
            moment,
            iconType: 'error', 
            notifications,
        });
    } catch (error) {
        console.error("Erreur lors du chargement de la page d'accueil:", error);
        res.status(500).redirect('/error');
    }
};
  
exports.sendMessage = async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
  
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }
  
    const mailOptions = {
      from: `"Form Contact" <${process.env.EMAIL}>`,
      to: process.env.EMAIL,
      subject: "Nouveau message depuis le formulaire de contact",
      html: `
        <h3>Nouveau message reçu</h3>
        <p><strong>Nom :</strong> ${firstName} ${lastName}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Message :</strong></p>
        <p>${message}</p>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: "Votre message a été envoyé avec succès." });
    } catch (error) {
      console.error("Erreur lors de l'envoi du mail :", error);
      return res.status(500).json({ message: "Erreur lors de l'envoi du message." });
    }
};

exports.error = (req, res) => {
    res.render("error");
};