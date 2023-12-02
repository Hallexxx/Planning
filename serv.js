const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 8000;

app.use(express.static('static'));

app.use(express.static('assets'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
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
    res.render('home'); // Render la page home.ejs
});


//////////////////////////////////////////// ROUTE POST /////////////////////////////////////////////////////////////////

///////////////////////////////////// REGISTER ////////////////////////////////////////////////////////


app.post('/register', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer l'utilisateur dans la base de données avec le nom, le mot de passe haché et l'image choisie
    connection.query('INSERT INTO profile (username, password) VALUES (?, ?, ?, ?, ?)', [username, hashedPassword], (error, results) => {
        if (error) {
            console.error('Erreur lors de l\'inscription : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de l\'inscription' });
        }else{
            console.log('Utilisateur inscrit avec succès. ID de l\'utilisateur :', results.insertId);
            // return res.json({ success: true, message: 'Inscription réussie' });
            res.redirect('/');
        }
        
    }); 
});


///////////////////////////////////// LOGIN ////////////////////////////////////////////////////////


app.post('/login', async (req, res) => {
    const username = req.body.usernameLogin;
    const password = req.body.passwordLogin;

    connection.query('SELECT * FROM profile WHERE username = ?', [username], async (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des informations d\'identification : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de la connexion' });
        }

        if (results.length === 0) {
            // L'utilisateur n'existe pas
            return res.json({ success: false, message: 'L\'utilisateur n\'existe pas' });
        }

        const hashedPassword = results[0].hashed_password;
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


// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
