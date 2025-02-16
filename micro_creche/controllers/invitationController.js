const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Employee = require("../models/Employee");
const MicroCreche = require("../models/MicroCreche");
const Notification = require("../models/Notification");

exports.addEmployeeAndSendInvitation = async (req, res) => {
    const { name, email, phone, role, microCrecheId, workHoursPerWeek } = req.body;

    try {
        const invitationToken = crypto.randomBytes(32).toString("hex");
        const invitationExpiration = Date.now() + 60 * 60 * 1000; 

        const newEmployee = new Employee({
            name,
            email,
            phone,
            role: role || "employee",
            microCreche: microCrecheId,
            workHoursPerWeek,
            invitationToken,
            invitationExpiration,
        });

        await newEmployee.save();

        const invitationUrl = `${process.env.BASE_URL}/invitation/handle?token=${invitationToken}&employeeId=${newEmployee._id}`;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"Planète Crèche" <${process.env.EMAIL}>`,
            to: email,
            subject: "Invitation à rejoindre une micro-crèche",
            html: `
                <h1>Bienvenue dans l'équipe !</h1>
                <p>Vous avez été invité(e) à rejoindre la micro-crèche.</p>
                <a href="${invitationUrl}" style="padding:10px 20px;background-color:#007bff;color:white;text-decoration:none;border-radius:5px;">Rejoindre maintenant</a>
                <p>Ce lien est valide pendant une heure.</p>
            `,
        });

        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).redirect("/error");
    }
};

exports.handleInvitation = async (req, res) => {
    const { token, employeeId } = req.query;

    try {
        if (!employeeId) {
            return res.status(400).send("ID de l'employé manquant.");
        }

        const employee = await Employee.findOne({
            _id: employeeId,
            invitationToken: token,
        }).populate("microCreche");

        if (!employee) {
            return res.status(400).send("Le lien d'invitation est invalide.");
        }

        const invitationExpirationTime = new Date(employee.invitationExpiration).getTime();
        if (invitationExpirationTime < Date.now()) {
            return res.status(400).send("Le lien d'invitation est expiré.");
        }

        if (employee.userAccount) {
            return res.redirect("/?message=Vous+avez+déjà+accepté+l'invitation");
        }

        if (req.user) {
            return res.render("employees/acceptInvitation", {
                employee,
                microCreche: employee.microCreche,
                employeeId: employee._id,
                token,
            });
        }

        return res.render("auth/login", {
            message: "Connectez-vous pour accepter l'invitation.",
            token,
            employeeId,
        });
    } catch (error) {
        console.error(error);
        res.status(500).redirect("/error");
    }
};

exports.acceptInvitation = async (req, res) => {
    const { employeeId, microCrecheId } = req.body;

    try {
        const employee = await Employee.findById(employeeId).populate("microCreche");
        if (!employee || employee.invitationExpiration < Date.now()) {
            return res.status(400).send("Invitation invalide ou expirée.");
        }
        if (employee.userAccount) {
            return res.redirect("/?message=Vous+avez+déjà+accepté+l'invitation");
        }
        if (!req.user || !req.user.id) {
            console.error("Utilisateur non connecté ou req.user._id manquant :", req.user);
            return res.redirect("/login");
        }

        employee.userAccount = req.user.id;
        await employee.save();

        console.log("Utilisateur connecté :", req.user);
        console.log("Propriétaire de la micro-crèche :", employee.microCreche.owner);

        await Notification.create({
            user: req.user.id,
            title: "Invitation acceptée",
            description: `Vous avez rejoint la micro-crèche ${employee.microCreche.name}.`,
        });

        await Notification.create({
            user: employee.microCreche.owner,
            title: "Invitation acceptée",
            description: `${req.user.nom} a accepté l'invitation et a rejoint la micro-crèche ${employee.microCreche.name}.`,
        });

        res.redirect(`/?message=Invitation+acceptée`);
    } catch (error) {
        console.error(error);
        res.status(500).redirect("/error");
    }
};
  
exports.declineInvitation = async (req, res) => {
    const { employeeId, microCrecheId } = req.body;

    try {
        const employee = await Employee.findById(employeeId).populate("microCreche");

        if (!employee) {
            return res.status(400).send("Employé non trouvé.");
        }

        await Notification.create({
            user: req.user.id,
            title: "Invitation refusée",
            description: `Vous avez refusé l'invitation à rejoindre la micro-crèche ${employee.microCreche.name}.`,
        });

        await Notification.create({
            user: employee.microCreche.owner,
            title: "Invitation refusée",
            description: `${req.user.nom} a refusé l'invitation à rejoindre la micro-crèche ${employee.microCreche.name}.`,
        });

        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).redirect("/error");
    }
};

exports.sendInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id).populate("microCreche");

        if (!employee) {
            console.error("Employé non trouvé");
            return res.redirect("/?error=Employé+non+trouvé");
        }

        if (employee.userAccount) {
            console.error("L'employé a déjà accepté l'invitation");
            return res.redirect("/?error=L'employé+a+déjà+accepté+l'invitation");
        }

        const invitationToken = crypto.randomBytes(32).toString("hex");
        const invitationExpiration = Date.now() + 60 * 60 * 1000; 

        employee.invitationToken = invitationToken;
        employee.invitationExpiration = invitationExpiration;
        await employee.save();

        const invitationUrl = `${process.env.BASE_URL}/invitation/handle?token=${invitationToken}&employeeId=${employee._id}`;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"Planète Crèche" <${process.env.EMAIL}>`,
            to: employee.email,
            subject: "Invitation à rejoindre une micro-crèche",
            html: `
                <h1>Bienvenue dans l'équipe !</h1>
                <p>Vous avez été invité(e) à rejoindre la micro-crèche <strong>${employee.microCreche.name}</strong>.</p>
                <a href="${invitationUrl}" style="padding:10px 20px;background-color:#007bff;color:white;text-decoration:none;border-radius:5px;">Accepter l'invitation</a>
                <p>Ce lien est valide pendant une heure.</p>
            `,
        });

        console.log("Invitation envoyée à :", employee.email);
        return res.redirect("/?message=Invitation+envoyée");
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'invitation :", error);
        return res.redirect("/error");
    }
};
