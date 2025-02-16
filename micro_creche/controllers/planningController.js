const moment = require("moment");
const MicroCreche = require("../models/MicroCreche");
const Employee = require("../models/Employee");
const Planning = require("../models/Planning");
// const puppeteer = require('puppeteer');
// const path = require('path');
// const ejs = require('ejs');
// const User = require("../models/User");
// const fs = require('fs');

const MAX_CONSECUTIVE_HOURS = 6; 
const DAILY_MAX_HOURS = 8; 
const MIN_BREAK_TIME = 0.5; 
const BREAK_INTERVAL = "11:00-15:30"; 

const breakAssignments = new Map();

function isTimeWithinInterval(time, interval) {
    const [start, end] = interval.split('-');
    const startTime = moment(start, 'HH:mm');
    const endTime = moment(end, 'HH:mm');
    const currentTime = moment(time, 'HH:mm');
    return currentTime.isSameOrAfter(startTime) && currentTime.isBefore(endTime);
}

// function calculateConsecutiveHours(lastSlots, currentStartTime) {
//     let consecutiveHoursWorked = 0;
//     console.log("🎯 Calcul des heures consécutives...");
    
//     if (!lastSlots || lastSlots.length === 0) {
//         console.log("⛔ Aucune donnée de créneau.");
//         return 0;
//     }

//     lastSlots.sort((a, b) => moment(a.end, "HH:mm").diff(moment(b.end, "HH:mm")));
    
//     const currentStart = moment(currentStartTime, "HH:mm");
//     if (!currentStart.isValid()) {
//         console.log("⛔ Heure de début invalide.");
//         return 0;
//     }
    
//     console.log(`Heure de départ : ${currentStartTime}`);
    
//     for (let i = lastSlots.length - 1; i >= 0; i--) {
//         const slot = lastSlots[i];
//         const slotEndTime = moment(slot.end, "HH:mm");
//         console.log(`- Créneau: ${slot.start} - ${slot.end} / Début calcul: ${currentStartTime}`);
//         console.log(`Comparaison entre ${currentStartTime} et ${slot.end}`);
//         const diffMinutes = currentStart.diff(slotEndTime, "minutes");
//         console.log(`Différence en minutes: ${diffMinutes}`);
//         if (diffMinutes <= 30 && diffMinutes >= 0) {
//         consecutiveHoursWorked += 0.5;
//         console.log(`✅ Continuité trouvée. Total des heures consécutives : ${consecutiveHoursWorked}`);
//         currentStartTime = slot.start;
//         } else {
//         console.log(`⛔ Pas de continuité entre ${slot.end} et ${currentStartTime}`);
//         break;
//         }
//     }
    
//     console.log(`✅ Total des heures consécutives travaillées: ${consecutiveHoursWorked}`);
//     return consecutiveHoursWorked;
// }

function computeBreakParameters(employee, record, slot, missingHoursByDay, childrenCount) {
    let availableDailyWork = DAILY_MAX_HOURS - (record.workingBeforeBreak + record.workingAfterBreak);
    let breakTrigger = false;
    let breakDuration = MIN_BREAK_TIME; 
    
    if (record.workingBeforeBreak >= MAX_CONSECUTIVE_HOURS) {
        breakTrigger = true;
        if (childrenCount < 10) {
            breakDuration = 1.0;
        } else {
            breakDuration = 0.5;
        }
    } else if (record.workingBeforeBreak >= 4 && availableDailyWork >= 4) {
        if (!missingHoursByDay[slot.day] || missingHoursByDay[slot.day] <= 0) {
            if (childrenCount < 10) {
                breakTrigger = true;
                breakDuration = 1.5;
            } else {
                breakTrigger = true;
                breakDuration = 0.5;
            }
        }
    }
    
    return { breakTrigger, breakDuration };
}

function insertBreakForEmployee(employee, slot, duration, employeeHoursAssigned) {
    const breakStart = moment(slot.start, 'HH:mm');
    const breakEnd = breakStart.clone().add(duration, 'hours');
    console.log(`🛑 Insertion pause pour ${employee.name} (${employee._id}) - Jour: ${slot.day}, Heure: ${breakStart.format('HH:mm')} à ${breakEnd.format('HH:mm')}`);
    
    slot.breaks = slot.breaks || [];
    slot.breaks.push({
        employeeId: employee._id,
        duration: duration,
        start: breakStart.format('HH:mm'),
        end: breakEnd.format('HH:mm')
    });

    if (!employeeHoursAssigned[employee._id].daily[slot.day]) {
        employeeHoursAssigned[employee._id].daily[slot.day] = { 
            workingBeforeBreak: 0, 
            workingAfterBreak: 0, 
            breakTaken: false, 
            breakEnd: null 
        };
    }
    employeeHoursAssigned[employee._id].daily[slot.day].breakTaken = true;
    employeeHoursAssigned[employee._id].daily[slot.day].breakEnd = breakEnd.format('HH:mm');

    for (let time = breakStart.clone(); time.isBefore(breakEnd); time.add(30, 'minutes')) {
        const key = `${slot.day}-${time.format('HH:mm')}`;
        breakAssignments.set(key, (breakAssignments.get(key) || 0) + 1);
    }
}

function assignEmployeesToSlots(slots, employees, employeeHoursAssigned, missingHoursByDay) {
    breakAssignments.clear();

    slots.sort((a, b) => moment(a.start, 'HH:mm').diff(moment(b.start, 'HH:mm')));

    for (let slot of slots) {
        const numChildren = slot.children.length;
        const numEmployeesNeeded = numChildren <= 3 ? 1 : numChildren <= 12 ? 2 : Math.ceil(numChildren / 6);
        let assignedEmployees = [];
        let remainingChildren = numChildren;

        let availableEmployees = employees.filter(employee => {
            const assigned = employeeHoursAssigned[employee._id] || { total: 0, daily: {} };
            const dailyRecord = assigned.daily[slot.day] || { 
                workingBeforeBreak: 0, 
                workingAfterBreak: 0, 
                breakTaken: false, 
                breakEnd: null 
            };
            if (dailyRecord.breakTaken && dailyRecord.breakEnd) {
                if (moment(slot.start, "HH:mm").isBefore(moment(dailyRecord.breakEnd, "HH:mm"))) {
                    return false;
                }
            }
            const totalDaily = dailyRecord.workingBeforeBreak + dailyRecord.workingAfterBreak;
            return totalDaily < DAILY_MAX_HOURS && (employee.workHoursPerWeek - assigned.total) > 0;
        });

        for (let employee of availableEmployees) {
            if (assignedEmployees.length >= numEmployeesNeeded || remainingChildren <= 0) {
                break;
            }

            let record = employeeHoursAssigned[employee._id].daily[slot.day];
            if (!record) {
                record = { workingBeforeBreak: 0, workingAfterBreak: 0, breakTaken: false, breakEnd: null };
                employeeHoursAssigned[employee._id].daily[slot.day] = record;
            }

            if (!record.breakTaken) {
                let { breakTrigger, breakDuration } = computeBreakParameters(employee, record, slot, missingHoursByDay, slot.children.length);
                if (breakTrigger && isTimeWithinInterval(slot.start, BREAK_INTERVAL)) {
                    const breakSlotKey = `${slot.day}-${slot.start}`;
                    const currentBreakCount = breakAssignments.get(breakSlotKey) || 0;
                    const isLastPossibleSlotForBreak = moment(slot.start, "HH:mm").isAfter(moment("14:30", "HH:mm"));
                    if (currentBreakCount < 1 || isLastPossibleSlotForBreak) {
                        console.log(`⏳ ${employee.name} (${employee._id}) a besoin d'une pause après ${record.workingBeforeBreak} heures travaillées. Planification d'une pause de ${breakDuration} heure(s).`);
                        insertBreakForEmployee(employee, slot, breakDuration, employeeHoursAssigned);
                        continue;
                    } else {
                        console.log(`🚨 ${employee.name} (${employee._id}) nécessite une pause, mais le créneau ${slot.start} n'est pas disponible pour la pause.`);
                        continue;
                    }
                } else {
                    assignedEmployees.push(employee);
                    remainingChildren -= Math.min(3, remainingChildren);
                    record.workingBeforeBreak += 0.5;
                    employeeHoursAssigned[employee._id].total += 0.5;
                }
            } else {
                if (record.breakEnd && moment(slot.start, "HH:mm").isBefore(moment(record.breakEnd, "HH:mm"))) {
                    continue;
                } else {
                    let allowedAfter = DAILY_MAX_HOURS - record.workingBeforeBreak;
                    if (record.workingAfterBreak >= allowedAfter) {
                        continue;
                    } else {
                        assignedEmployees.push(employee);
                        remainingChildren -= Math.min(3, remainingChildren);
                        record.workingAfterBreak += 0.5;
                        employeeHoursAssigned[employee._id].total += 0.5;
                    }
                }
            }
        }

        if (assignedEmployees.length < numEmployeesNeeded) {
            slot.missingEmployees = numEmployeesNeeded - assignedEmployees.length;
            missingHoursByDay[slot.day] += 0.5;
        }

        slot.employees = assignedEmployees;
    }

    return slots;
}

exports.generatePlanning = async (req, res) => {
    try {
        const { microCrecheId } = req.params;
        const microCreche = await MicroCreche.findById(microCrecheId).populate("enfants employees");

        if (!microCreche) {
            return res.status(404).json({ success: false, message: "Micro-crèche introuvable" });
        }

        if (microCreche.enfants.length === 0 || microCreche.employees.length === 0) {
            return res.status(400).json({ success: false, message: "Micro-crèche non éligible pour un planning." });
        }

        const daysOfWeek = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"];
        const slots = [];
        const employeeHoursAssigned = {}; 
        const missingHoursByDay = {};

        microCreche.employees.forEach(employee => {
            employeeHoursAssigned[employee._id] = { total: 0, daily: {} };
        });

        daysOfWeek.forEach(day => {
            missingHoursByDay[day] = 0;
            for (let hour = 6; hour < 20; hour++) {
                for (let minute of [0, 30]) {
                    const start = `${hour}:${minute.toString().padStart(2, "0")}`;
                    const end = moment(start, "HH:mm").add(30, "minutes").format("HH:mm");
                    const childrenInSlot = microCreche.enfants.filter(child => {
                        const schedule = child.horaires[day];
                        return schedule && isTimeWithinInterval(start, schedule);
                    });
                    slots.push({ day, start, end, children: childrenInSlot, employees: [], missingEmployees: 0 });
                }
            }
        });

        const bestPlanning = assignEmployeesToSlots(slots, microCreche.employees, employeeHoursAssigned, missingHoursByDay);

        const planning = new Planning({
            microCreche: microCreche._id,
            date: new Date(),
            slots: bestPlanning,
        });

        await planning.save();
        res.status(200).json({
            success: true,
            message: "Planning généré avec succès.",
            planning,
            missingHoursByDay,
        });
    } catch (error) {
        console.error("Erreur lors de la génération du planning:", error);
        res.status(500).json({ success: false, message: "Erreur lors de la génération du planning." });
    }
};

function generateTimeIntervals(startHour, endHour, intervalMinutes = 15) {
    const intervals = [];
    for (let hour = startHour; hour < endHour; hour++) {
        for (let min = 0; min < 60; min += intervalMinutes) {
            const start = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
            const endHourCalc = (min + intervalMinutes) >= 60 ? hour + 1 : hour;
            const endMin = (min + intervalMinutes) % 60;
            const end = `${String(endHourCalc).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
            intervals.push({ start, end });
        }
    }
    return intervals;
}

const getPresenceTimes = (slots, req, filterEmployeeId = null) => {
    let employeesPresence = {};
    const daysOfWeek = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"];
    const todayIndex = Math.max(0, Math.min(4, new Date().getDay() - 1)); 
    const selectedDay = (req?.query?.day || daysOfWeek[todayIndex]).trim().toLowerCase();

    slots.forEach((slot) => {
        if (!slot || !slot.day) return;
        const day = slot.day.trim().toLowerCase();
        if (day !== selectedDay) return;

        const formattedStart =
        typeof slot.start === "string" ? slot.start : moment(slot.start).format("HH:mm");
        const formattedEnd =
        typeof slot.end === "string" ? slot.end : moment(slot.end).format("HH:mm");

        const employees = slot.employees || [];
        employees.forEach((emp) => {
            if (!emp || !emp._id) return;
            if (filterEmployeeId && String(emp._id) !== String(filterEmployeeId)) return;
            const empId = String(emp._id);
            if (!employeesPresence[empId]) {
                employeesPresence[empId] = {
                    name: emp.name,
                    startTime: formattedStart,
                    endTime: formattedEnd,
                    day: day 
                };
            } else {
                const currentStart = moment(employeesPresence[empId].startTime, "HH:mm");
                const currentEnd = moment(employeesPresence[empId].endTime, "HH:mm");
                if (moment(formattedStart, "HH:mm").isBefore(currentStart)) {
                    employeesPresence[empId].startTime = formattedStart;
                }
                if (moment(formattedEnd, "HH:mm").isAfter(currentEnd)) {
                    employeesPresence[empId].endTime = formattedEnd;
                }
            }
        });
    });
    return { employeesPresence };
};

exports.getChildPlannings = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect("/auth/login?message=Vous devez être connecté pour accéder à cette page");
        }

        const daysOfWeek = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"];
        const todayIndex = Math.max(0, Math.min(4, new Date().getDay() - 1));
        const selectedDay = (req.query.day || daysOfWeek[todayIndex]).trim().toLowerCase();

        let microCreches = [];
        if (req.user.role === "pro") {
            microCreches = await MicroCreche.find({ owner: req.user.id });
        }
        
        else if (req.user.role === "employe") {
            const employee = await Employee.findOne({ userAccount: req.user.id }).populate("microCreche");
            if (!employee || !employee.microCreche) {
                return res.status(404).send("Aucune micro‑crèche associée à votre compte.");
            }
            microCreches = [employee.microCreche];
        } else {
            return res.redirect("/?message=Accès non autorisé.");
        }

        if (microCreches.length === 0) {
            return res.render("planning/childPlannings", {
                title: "Planning des enfants",
                plannings: [],
                selectedDay,
                daysOfWeek,
                microCreches,
                childrenPresence: {},
                message: "Vous n'avez pas encore de micro‑crèche.",
                user: req.user,
            });
        }

        const plannings = await Planning.find({
        microCreche: { $in: microCreches.map(mc => mc._id) },
        })
        .populate("microCreche", "name")
        .populate("slots.children", "name");

        let message = "";
        if (plannings.length === 0) {
            message = "Aucun planning trouvé.";
        }

        const slots = plannings.flatMap(planning => planning.slots);
        const childrenPresence = getChildrenPresence(slots);

        let eligibleMicroCreches = [];
        if (req.user.role === "pro") {
            eligibleMicroCreches = microCreches.filter(mc => mc.enfants && mc.enfants.length > 0);
        }

        res.render("planning/childPlannings", {
            title: "Planning des enfants",
            plannings,
            selectedDay,
            daysOfWeek,
            microCreches,
            childrenPresence,
            timeIntervals: generateTimeIntervals(7, 19, 30),
            moment,
            getSlotClass,
            message,
            user: req.user,
            eligibleMicroCreches,
        });
    } catch (error) {
        console.error("Erreur lors du chargement des plannings des enfants :", error);
        res.status(500).send("Une erreur s'est produite.");
    }
};

function getChildrenPresence(slots) {
    const presence = {};
    slots.forEach(slot => {
        if (!slot || !slot.day) return;
            const day = slot.day.trim().toLowerCase();
        if (!presence[day]) {
            presence[day] = [];
        }
      slot.children.forEach(child => {
            if (!child || !child.name) return;
                let existing = presence[day].find(c => c.name === child.name);
                if (existing) {
                    if (moment(slot.start, "HH:mm").isBefore(moment(existing.startTime, "HH:mm"))) {
                        existing.startTime = slot.start;
                    }
                    if (moment(slot.end, "HH:mm").isAfter(moment(existing.endTime, "HH:mm"))) {
                        existing.endTime = slot.end;
                    }
                } else {
                presence[day].push({
                    name: child.name,
                    startTime: slot.start,  
                    endTime: slot.end,     
                    day: day
                });
            }
        });
    });
    return presence;
}

const getSlotClass = (childrenCount) => {
    if (childrenCount < 3) return "bg-blue";
    if (childrenCount <= 6) return "bg-orange";
    return "bg-red";
};

exports.getEmployeePlannings = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect("/auth/login?message=Vous devez être connecté pour accéder à cette page");
        }

        const selectedDay = (req.query.day || "").trim().toLowerCase();
        const daysOfWeek = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"];
        let message = "";
        let microCreche_populate = [];
        
        if (req.user.role === "pro") {
            microCreche_populate = await MicroCreche.find({ owner: req.user.id })
                .populate("enfants", "name horaires")
                .populate("employees", "name");
            const microCreches = await MicroCreche.find({ owner: req.user.id });
            if (microCreches.length === 0) {
                message = "Vous n'avez pas encore de micro‑crèche.";
            }

            const plannings = await Planning.find({
                microCreche: { $in: microCreches.map((mc) => mc._id) },
            })
                .populate("microCreche", "name")
                .populate("slots.employees", "name");

            if (plannings.length === 0) {
                message = message || "Vous n'avez pas encore de planning.";
            }

            const slots = plannings.flatMap((planning) => planning.slots);
            const { employeesPresence } = getPresenceTimes(slots, req); 

            return res.render("planning/employeePlannings", {
                title: "Planning de vos employés",
                plannings,
                selectedDay,
                microCreches,
                daysOfWeek,
                employeesPresence,
                moment,
                getSlotClass,
                message,
                user: req.user,
                eligibleMicroCreches: microCreche_populate.filter(
                (mc) => mc.employees.length > 0 && mc.enfants.length > 0
                ),
            });
        }
        else if (req.user.role === "employe") {
            const employee = await Employee.findOne({ userAccount: req.user.id }).populate("microCreche");
            if (!employee) {
                return res.render("planning/employeePlannings", {
                title: "Planning de l'employé",
                plannings: [],
                selectedDay,
                employee: null,
                daysOfWeek,
                employeesPresence: {},
                moment,
                getSlotClass,
                message: "Vous ne pouvez pas accéder à cette page pour l'instant.",
                user: req.user,
                });
            }
            let microCrecheMessage = "";
            if (!employee.microCreche) {
                microCrecheMessage = "Aucune micro‑crèche associée à votre compte.";
            }

            const plannings = await Planning.find({
                microCreche: employee.microCreche ? employee.microCreche._id : null,
            })
                .populate("microCreche", "name")
                .populate("slots.employees", "name");

            if (plannings.length === 0) {
                message = message || "Vous n'avez pas encore de planning.";
            } else {
                message = microCrecheMessage || "";
            }

            const slots = plannings.flatMap((planning) => planning.slots);
            const { employeesPresence } = getPresenceTimes(slots, req, employee._id);

            return res.render("planning/employeePlannings", {
                title: "Planning de l'employé",
                plannings,
                selectedDay,
                employee,
                daysOfWeek,
                employeesPresence,
                moment,
                getSlotClass,
                message,
                user: req.user,
            });
        } else {
            return res.redirect("/?message=Accès non autorisé.");
        }
    } catch (error) {
        console.error("Erreur lors du chargement du planning :", error);
        res.status(500).send("Une erreur s'est produite.");
    }
};