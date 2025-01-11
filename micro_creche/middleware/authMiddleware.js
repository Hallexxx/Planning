const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
  const token = req.cookies.auth_token || req.headers.authorization?.split(" ")[1]; 

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); 
      req.user = decoded; 
      res.locals.user = decoded; 
    } catch (err) {
      console.error("Erreur lors de la vérification du token :", err);
      req.user = null;
      res.locals.user = null;
    }
  } else {
    req.user = null; 
    res.locals.user = null;
  }

  next(); 
};

const authMiddleware = (req, res, next) => {
  const token = req.cookies.auth_token || req.headers.authorization?.split(" ")[1]; 

  if (!token) {
    return res.redirect("/auth/login?message=Vous devez être connecté pour accéder à cette page");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Token invalide ou expiré :", err);
      return res.redirect("/auth/login?message=Token invalide ou expiré. Veuillez vous reconnecter.");
    }

    req.user = decoded; 
    res.locals.user = decoded; 
    next(); 
  });
};

module.exports = { authenticateUser, authMiddleware };
