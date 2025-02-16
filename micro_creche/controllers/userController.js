const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const MicroCreche = require("../models/MicroCreche");
const Child = require("../models/Enfant");
const Employee = require("../models/Employee");
const Planning = require("../models/Planning");
const nodemailer = require('nodemailer');
const transporter = require("../config/nodemailer");
const crypto = require("crypto");

const signup = async (req, res) => {
    const { nom, prenom, email, password, role } = req.body;

    if (!nom || !prenom || !email || !password || !role) {
        console.log("Veuillez remplir tous les champs.");
        return res.render("signup/signup_employe", {
            message: "Veuillez remplir tous les champs.",
            token: req.query.token || "",
            user: null
        });
    }

    const { token: invitationToken, employeeId } = req.query;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("Cet email est déjà utilisé.");
            return res.render("signup/signup_employe", {
                message: "Cet email est déjà utilisé.",
                token: req.query.token || "",
                user: null
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            nom,
            prenom,
            email,
            password: hashedPassword,
            role,
        });

        await newUser.save();

        const authToken = jwt.sign(
            { id: newUser._id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.cookie("auth_token", authToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 3600000,
        });

        if (invitationToken && employeeId) {
            return res.redirect(`/invitation/handle?token=${invitationToken}&employeeId=${employeeId}`);
        } else {
            return res.redirect("/");
        }
    } catch (error) {
        console.error("Erreur lors de la création du compte :", error);
        return res.status(500).render("signup/signup_employe", {
            message: "Erreur lors de la création du compte.",
            token: req.query.token || "",
            user: null
        });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log("Utilisateur non trouvé.");
            return res.render("login/login", {
                message: "Utilisateur non trouvé.",
                token: req.query.token || "",
                employeeId: req.query.employeeId || "",
                iconType: req.query.iconType || 'error', 
                user: null 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Mot de passe incorrect.");
            return res.render("login/login", {
                message: "Mot de passe incorrect.",
                token: req.query.token || "",
                employeeId: req.query.employeeId || "",
                iconType: req.query.iconType || 'error', 
                user: null  
            });
        }

        const authToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.cookie("auth_token", authToken, { httpOnly: true });

        if (req.query.token && req.query.employeeId) {
            return res.redirect(`/invitation/handle?token=${req.query.token}&employeeId=${req.query.employeeId}`);
        } else {
            return res.redirect("/");
        }
    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        return res.status(500).render("login/login", {
            message: "Erreur lors de la connexion.",
            token: req.query.token || "",
            employeeId: req.query.employeeId || "",
            iconType: req.query.iconType || 'error', 
            user: null  
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).populate("microCreches");
    
        if (req.user.role === "pro") {
            const microCreches = await MicroCreche.find({ owner: userId })
            .populate("employees enfants")
            .exec();
            const microCrecheIds = microCreches.map(creche => creche._id);
    
            const enfants = await Child.find({ microCreche: { $in: microCrecheIds } })
            .populate("microCreche");
            const employees = await Employee.find({ microCreche: { $in: microCrecheIds } })
            .populate("microCreche");
    
            const plannings = await Planning.find({
                microCreche: { $in: microCrecheIds },
            }).exec();
    
            res.render("profile", { 
                user, 
                microCreches, 
                enfants, 
                employees, 
                plannings 
            });
        } else if (req.user.role === "employe") {
            const microCreches = [];
            const enfants = [];
            const employees = [];
            const plannings = await Planning.find({ userAccount: userId }).populate("microCreche");
            const employee = await Employee.findOne({ userAccount: userId }).populate("microCreche");
            // if (!employee) {
            //     return res.render("profile", {
            //         user, 
            //         employee, 
            //         microCreches, 
            //         enfants, 
            //         employees,
            //         plannings,
            //     });
            // }
            res.render("profile", { 
                user, 
                employee, 
                microCreches, 
                enfants, 
                employees,
                plannings
            });
        } else {
            return res.redirect("/?error=Accès non autorisé");
        }
    } catch (error) {
      console.error("Erreur lors de la récupération du profil :", error);
      res.status(500).send("Erreur serveur");
    }
};

const updateField = async (req, res) => {
    try {
        const userId = req.user.id; 
        console.log("Données reçues dans le backend :", req.body);

        const { field, value } = req.body;

        const validFields = ["nom", "prenom", "email", "role"];
        if (!validFields.includes(field)) {
            return res.status(400).json({ error: "Champ invalide" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { [field]: value },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        res.status(200).json({ message: "Mise à jour réussie", user: updatedUser });
    } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        console.log('user', user, email);
        if (!user) {
            return res.render('login/login', { 
                message: 'Si cet email est enregistré, vous recevrez bientôt un lien de réinitialisation.',
                token: "", 
                employeeId: "",
                iconType: 'info', 
                user: req.user || null
            });
        }
    
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();
    
        const resetLink = `${process.env.BASE_URL}/auth/reset-password?token=${token}`;
  
        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL,
            subject: 'Réinitialisation de votre mot de passe',
            html: `
            <!DOCTYPE html>
            <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Réinitialisation de votre mot de passe</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        .fade-in {
                            animation: fadeIn 1s ease-in-out;
                        }
                        .btn-reset {
                            background-color: #007bff;
                            color: #ffffff !important;
                            padding: 10px 20px;
                            text-decoration: none;
                            border-radius: 5px;
                            transition: background-color 0.3s ease;
                            display: inline-block;
                        }
                        .btn-reset:hover {
                            background-color: #0056b3;
                        }
                    </style>
                </head>
                <body>
                    <div class="container my-4 fade-in">
                        <div class="card">
                            <div class="card-header bg-primary text-white text-center">
                                <h2>Réinitialisation de votre mot de passe</h2>
                            </div>
                            <div class="card-body">
                                <p>Vous recevez cet email car vous (ou quelqu'un d'autre) avez demandé la réinitialisation du mot de passe de votre compte.</p>
                                <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe. Ce lien expirera dans une heure.</p>
                                <div class="text-center my-4">
                                    <a href="${resetLink}" class="btn-reset">Réinitialiser le mot de passe</a>
                                </div>
                                <p>Si vous n'avez pas fait cette demande, veuillez ignorer cet email et votre mot de passe restera inchangé.</p>
                            </div>
                            <div class="card-footer text-muted text-center">
                                &copy; ${new Date().getFullYear()} Votre Société. Tous droits réservés.
                            </div>
                        </div>
                    </div>
                </body>
            </html>
            `,
        };
  
        await transporter.sendMail(mailOptions);
            res.render('login/login', { 
            message: 'Si cet email est enregistré, vous recevrez bientôt un lien de réinitialisation.',
            token: "", 
            employeeId: "",
            iconType: 'info', 
            user: req.user || null
        });

    } catch (error) {
      console.error('Erreur dans forgotPassword :', error);
      res.status(500).render('login/forgot-password', { 
        message: 'Erreur serveur. Veuillez réessayer plus tard.',
        user: req.user || null
      });
    }
};

const resetPassword = async (req, res) => {
    const { token, password, confirmPassword } = req.body;
    try {
        if (password !== confirmPassword) {
            return res.render('login/reset-password', { token, user: req.user || null, message: 'Les mots de passe ne correspondent pas.' });
        }
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.render('login/reset-password', { token, user: req.user || null, message: 'Le token est invalide ou expiré.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        res.render('login/login', { 
            token: "", 
            employeeId: "",
            user: req.user || null,
            iconType: 'success',
            message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.' });
    } catch (error) {
        console.error('Erreur dans resetPassword :', error);
        res.status(500).render('login/reset-password', { token, user: req.user || null, message: 'Erreur serveur. Veuillez réessayer.' });
    }
};

module.exports = {
  signup,
  login,
  getProfile,
  updateField,
  forgotPassword,
  resetPassword,
};
