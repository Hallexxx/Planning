const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/signup/employe", (req, res) => {
  const token = req.query.token || null;
  const message = req.query.message || null;
    res.render("signup/signup_employe", { message,token,user: req.user || null }); 
});

router.get("/signup/pro", (req, res) => {
  const token = req.query.token || null;
  const message = req.query.message || null;
  res.render("signup/signup_pro", { message,token,user: req.user || null }); 
});

router.post("/signup", userController.signup);

router.get("/login", (req, res) => {
  const message = req.query.message || null;
  const token = req.query.token || null;
  const employeeId = req.query.employeeId || "";
  res.render("login/login", { message, token, employeeId, user: req.user || null });
});

router.post("/login", userController.login);

router.get("/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.redirect("/");
});

router.get('/forgot-password', (req, res) => {
  res.render('login/forgot-password', { message: null, user: req.user || null });
});

router.post('/forgot-password', userController.forgotPassword);

router.get('/reset-password', (req, res) => {
  const { token } = req.query;
  res.render('login/reset-password', { token, message: null, user: req.user || null });
});

router.post('/reset-password', userController.resetPassword);


module.exports = router;
