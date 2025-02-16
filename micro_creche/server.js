const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const { authenticateUser, authMiddleware } = require("./middleware/authMiddleware"); 
const loadNotifications = require("./middleware/loadNotifications");


dotenv.config();

connectDB();

const app = express();

app.use(express.static("public"));
app.use(express.json()); 
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes); 

app.use(authenticateUser); 

app.use(loadNotifications);

const indexRoutes = require("./routes/index");
app.use("/", indexRoutes);

const microCrecheRoutes = require("./routes/microCreche");
app.use("/", microCrecheRoutes);

const childRoutes = require("./routes/childRoutes");
app.use("/", childRoutes);

const employeeRoutes = require("./routes/employeeRoutes");
app.use("/", employeeRoutes);

const planningRoutes = require("./routes/planning");
app.use("/planning", planningRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/", notificationRoutes);

const invitationRoutes = require("./routes/invitation");
app.use("/invitation", invitationRoutes);

app.use((err, req, res, next) => {
  console.error("Erreur:", err);  
  res.status(500).redirect('/error');  
});

app.use((req, res, next) => {
  res.status(404).redirect('/error'); 
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
