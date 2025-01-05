const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
  const token = req.cookies.auth_token; // Récupérer le token JWT depuis le cookie

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); 
      req.user = decoded; // Ajouter les infos utilisateur au req
      res.locals.user = decoded; // Ajouter également aux templates si nécessaire
    } catch (err) {
      console.error("Erreur lors de la vérification du token :", err);
      req.user = null; // Si le token est invalide
      res.locals.user = null;
    }
  } else {
    req.user = null; // Aucun token trouvé
    res.locals.user = null;
  }
  next(); // Passer au middleware suivant
};

// Middleware pour protéger les routes
const authMiddleware = (req, res, next) => {
  const token = req.cookies.auth_token || req.headers.authorization?.split(" ")[1]; // Récupérer le token depuis les cookies ou l'en-tête Authorization

  if (!token) {
    // Si aucun token n'est présent, l'utilisateur n'est pas autorisé
    return res.redirect("/auth/login?message=Vous devez être connecté pour accéder à cette page");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // Si le token est invalide ou expiré, rediriger vers la page de connexion
      return res.redirect("/auth/login?message=Token invalide ou expiré. Veuillez vous reconnecter.");
    }
    req.user = decoded; // Ajouter les informations décodées du token à req.user pour les utiliser dans les routes protégées
    next(); // Passer au middleware suivant ou à la route protégée
  });
};

module.exports = { authenticateUser, authMiddleware };
