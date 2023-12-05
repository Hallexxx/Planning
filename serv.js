const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');



const app = express();
const port = process.env.PORT || 8000;

app.use(express.static('static'));

app.use(express.static('assets'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'creche_planning'
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
      console.error('Erreur de connexion à la base de données : ' + err.message);
    } else {
      console.log(`Connecté à la base de données MySQL`);
    }
});

/* Definition de l'user */

app.use(session({
    secret: 'votre_clé_secrète',
    resave: false,
    saveUninitialized: true
}));
app.use((req, res, next) => {
    // Middleware pour rendre l'ID de l'utilisateur disponible dans toutes les routes
    res.locals.logUser = req.session.logUser;
    next();
});

//////////////////////////////////////////// ROUTE GET /////////////////////////////////////////////////////////////////

///////////////////////////////////// HOME ////////////////////////////////////////////////////////

app.get('/', (req, res) => {
    const logUser = res.locals.logUser;
    res.render('home', {profile: logUser});
});


///////////////////////////////////// ENFANTS ////////////////////////////////////////////////////////


app.get('/enfants', (req, res) => {
    const logUser = res.locals.logUser;
    const userId = req.session.logUser.id;

    // Vérifiez si req.session.logUser est défini
    if (!req.session.logUser || !req.session.logUser.id) {
        // Gérez le cas où logUser ou son id ne sont pas définis
        console.error('Erreur : Utilisateur non connecté');
        return res.redirect('/'); // Redirigez l'utilisateur vers la page d'accueil ou une page de connexion
    }

    // Récupérez les informations des enfants liés à l'utilisateur connecté depuis la base de données
    connection.query('SELECT * FROM children WHERE user_id = ?', [userId], (error, childrenResults) => {
        if (error) {
            console.error('Erreur lors de la récupération des enfants : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de la récupération des enfants' });
        }

        // Rendez la page EJS avec les résultats des enfants
        res.render('enfants', { children: childrenResults, profile: logUser });
    });
});

app.get('/childrens', (req, res) => {
    const userId = req.session.logUser.id;

    connection.query('SELECT * FROM children WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des enfants : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de la récupération des enfants' });
        }

        // Créez un tableau pour stocker les informations des enfants
        const children = [];

        // Parcourez les résultats de la requête pour construire les informations des enfants
        results.forEach(child => {
            const childInfo = {
                firstname: child.firstname,
                lastname: child.lastname,
                age: child.age,
                daycareDays: child.daycareDays.split(','), // Convertissez la chaîne en tableau
                daycareHours: child.daycareHours.split(','), // Convertissez la chaîne en tableau
                // Ajoutez d'autres propriétés si nécessaire
            };
            children.push(childInfo);
        });

        // Renvoyez les informations des enfants au format JSON
        res.json({ success: true, children });
    });
});


///////////////////////////////////// EMPLOYES ////////////////////////////////////////////////////////


app.get('/employees', (req, res) => {
    const userId = req.session.logUser.id;

    connection.query('SELECT * FROM employees WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des employés : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de la récupération des employés' });
        }

        // Créez un tableau pour stocker les événements du calendrier
        const events = [];

        // Parcourez les résultats de la requête pour construire les événements
        results.forEach(employee => {
            const event = {
                title: `${employee.firstname} ${employee.lastname}`,
                start: `${employee.workDays}T${employee.workHours[0]}`, // Supposons que workDays et workHours sont des colonnes de votre table
                end: `${employee.workDays}T${employee.workHours[1]}`,
                // Ajoutez d'autres propriétés d'événement si nécessaire
            };
            events.push(event);
        });

        // Renvoyez les événements au format JSON
        res.json({ success: true, events });
    });
});


app.get('/employes', (req, res) => {
    const logUser = res.locals.logUser;
    const userId = req.session.logUser.id;

    // Vérifiez si req.session.logUser est défini
    if (!req.session.logUser || !req.session.logUser.id) {
        // Gérez le cas où logUser ou son id ne sont pas définis
        console.error('Erreur : Utilisateur non connecté');
        return res.redirect('/'); // Redirigez l'utilisateur vers la page d'accueil ou une page de connexion
    }


    connection.query('SELECT * FROM employees WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des employés : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de la récupération des employés' });
        }

        // Rendez la page EJS avec les résultats des employés
        res.render('employes', { employees: results, profile: logUser});
    });
});


//////////////////////////////////////////// ROUTE POST /////////////////////////////////////////////////////////////////

///////////////////////////////////// USERID ////////////////////////////////////////////////////////


app.post('/UserId', (req, res) => {
    const reqUserId = req.body.userId;

    if (reqUserId != -1){
        console.log("{ message: 'Id utilisateur chargé :", req.body.userId, "}");

        // Utilisez la table correcte, qui est "users" dans ce cas
        connection.query('SELECT * FROM users WHERE id = ?', [reqUserId], (error, userResults) => {
            if (error) {
                console.error('Erreur lors de la récupération des informations de l\'utilisateur : ' + error.message);
                return;
            }

            req.session.logUser = userResults[0];
            res.redirect('/');
        });
    } else {
        console.log("{ message: 'Utilisateur déconnecté' }");
        req.session.logUser = undefined;
        res.redirect('/');
    }
});


///////////////////////////////////// REGISTER ////////////////////////////////////////////////////////


app.post('/register', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer l'utilisateur dans la base de données avec le nom, le mot de passe haché et l'image choisie
    connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (error, results) => {
        if (error) {
            console.error('Erreur lors de l\'inscription : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de l\'inscription' });
        } else {
            console.log('Utilisateur inscrit avec succès. ID de l\'utilisateur :', results.insertId);

            // Récupérer les informations de l'utilisateur nouvellement créé
            connection.query('SELECT * FROM users WHERE id = ?', [results.insertId], (error, userResults) => {
                if (error) {
                    console.error('Erreur lors de la récupération des informations de l\'utilisateur : ' + error.message);
                    return res.json({ success: false, message: 'Erreur lors de la création du compte' });
                }

                // Stocker les informations de l'utilisateur dans la session
                req.session.logUser = userResults[0];

                // Rediriger vers la page d'accueil
                res.redirect('/');
            });
        }
    });
});


///////////////////////////////////// LOGIN ////////////////////////////////////////////////////////


app.post('/login', async (req, res) => {
    const username = req.body.usernameLogin; // Utilisez le nom correct du champ du formulaire
    const password = req.body.passwordLogin; // Utilisez le nom correct du champ du formulaire

    connection.query('SELECT * FROM users WHERE username = ?', [username], async (error, results) => {
        console.log('SQL Query:', 'SELECT * FROM users WHERE username = ?', [username]);
        if (error) {
            console.error('Erreur lors de la récupération des informations d\'identification : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de la connexion' });
        }

        if (results.length === 0) {
            // L'utilisateur n'existe pas
            return res.json({ success: false, message: 'L\'utilisateur n\'existe pas' });
        }

        const hashedPassword = results[0].password; // Utiliser la colonne 'password'
        const passwordMatch = await bcrypt.compare(password, hashedPassword);

        if (passwordMatch) {
            req.session.logUser = results[0];
            return res.json({ success: true, message: 'Connexion réussie' });
        } else {
            // Mot de passe incorrect
            return res.json({ success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }
    });
});

///////////////////////////////////// EMPLOYES ////////////////////////////////////////////////////////


app.post('/addEmployee', (req, res) => {
    const userId = req.session.logUser.id;

    // Récupérez les propriétés nécessaires du corps de la requête
    const { firstname, lastname, photo, workDays, workHours } = req.body;
    // Ajoutez userId aux données de l'employé
    const newEmployee = {
        firstname,
        lastname,
        workDays,
        workHours,
        user_id: userId,
    };

    connection.query('INSERT INTO employees SET ?', newEmployee, (error, results) => {
        if (error) {
            console.error('Erreur lors de l\'ajout de l\'employé : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de l\'ajout de l\'employé' });
        }

        console.log('Employé ajouté avec succès. ID de l\'employé :', results.insertId);

        // Redirigez l'utilisateur vers la page des employés
        res.redirect('/employes');
    });
});


///////////////////////////////////// ENFANTS ////////////////////////////////////////////////////////


app.post('/addChild', (req, res) => {
    const userId = req.session.logUser.id;

    // Récupérez les propriétés nécessaires du corps de la requête
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const age = req.body.age;
    const daycareDays = req.body.daycareDays.join(','); // Convertissez le tableau en chaîne
    const daycareHours = req.body.daycareHours.join(','); // Convertissez le tableau en chaîne

    console.log('Valeurs reçues du formulaire :', firstname, lastname, age, daycareDays, daycareHours);

    if (typeof firstname === 'undefined' || firstname.trim() === '') {
        return res.status(400).json({ success: false, message: "Le prénom de l'enfant est requis." });
    }

    // Ajoutez userId aux données de l'enfant directement dans la requête SQL
    const sql = 'INSERT INTO children (firstname, lastname, age, daycareDays, daycareHours, user_id) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [firstname, lastname, age, daycareDays, daycareHours, userId];

    connection.query(sql, values, (error, results) => {
        if (error) {
            console.error('Erreur lors de l\'ajout de l\'enfant : ' + error.message);
            return res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout de l\'enfant' });
        }

        console.log('Enfant ajouté avec succès. ID de l\'enfant :', results.insertId);

        // Renvoyer une réponse avec un message de succès
        res.json({ success: true, message: "Ajout de l'enfant réussi." });
    });
});


// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
