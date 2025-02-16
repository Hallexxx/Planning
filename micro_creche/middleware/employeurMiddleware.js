const Employee = require("../models/Employee");

const isEmployer = function(req, res, next) {
    if (req.user && req.user.role === "pro") {
        return next();
    } else {
        console.error("Accès refusé : Seuls les employeurs ont accès à cette page");
        return res.redirect("/?error=Seuls les employeurs ont accès à cette page");
    }
};

const checkEmployeeOwnership = async (req, res, next) => {
    try {
        const employeeId = req.params.id || req.body.employeeId;
        
        const employee = await Employee.findById(employeeId).populate("microCreche");
        // if (!employee) {
        //     console.error("Employé introuvable");
        //     return res.redirect("/?error=Vous devez etre associé à un employé pour accéder à cette ressource");
        // }

        if (req.user.role === "pro") {
            if (req.user && req.user.role === "pro") {
                return next();
            } else {
                console.error("Accès refusé : La micro‑crèche de l'employé n'est pas liée à votre compte");
                return res.redirect("/?error=Vous n'avez pas accès à cette ressource");
            }
        } else if (req.user.role === "employe") {
            if (employee.userAccount && employee.userAccount.toString() === req.user.id.toString()) {
                return next();
            } else {
                console.error("Accès refusé : Cet employé n'est pas associé à votre compte");
                return res.redirect("/?error=Vous devez etre associé à un employé pour accéder à cette ressource");
            }
        } else {
            console.error("Rôle inconnu pour l'utilisateur");
            return res.redirect("/?error=Accès refusé");
        }
    } catch (err) {
        console.error("Erreur lors de la vérification de l'employé :", err);
        return res.redirect("/?error=Une erreur s'est produite");
    }
};

const checkUserEmployeeLink = async (req, res, next) => {
    try {
        if (!req.user) {
            console.error("Utilisateur non authentifié");
            return res.redirect("/auth/login?error=Vous devez être connecté");
        }
        if (req.user.role !== "employe") {
            return next();
        }
        const employee = await Employee.findOne({ userAccount: req.user.id });
        if (!employee) {
            console.error("Aucun employé associé à cet utilisateur");
            return res.redirect("/?error=Vous n'êtes encore associé à aucun employé");
        }
        req.employee = employee;
        next();
    } catch (err) {
        console.error("Erreur lors de la vérification de l'employé lié :", err);
        return res.redirect("/?error=Une erreur s'est produite");
    }
};

module.exports = { isEmployer, checkEmployeeOwnership, checkUserEmployeeLink };