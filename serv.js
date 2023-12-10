const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const moment = require('moment');



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


///////////////////////////////////// AFFICHAGE ENFANTS ////////////////////////////////////////////////////////


app.get('/enfants', (req, res) => {
    const logUser = res.locals.logUser;
    const userId = req.session.logUser.id;

    if (!req.session.logUser || !req.session.logUser.id) {
        console.error('Erreur : Utilisateur non connecté');
        return res.redirect('/');
    }

    connection.query(
        'SELECT c.*, cs.dayOfWeek, cs.daycareHoursStart, cs.daycareHoursEnd, ds.dayName ' +
        'FROM children c ' +
        'LEFT JOIN child_schedule_hours cs ON c.id = cs.child_id ' +
        'LEFT JOIN jours_semaine ds ON cs.dayOfWeek = ds.id ' +
        'WHERE c.user_id = ?',
        [userId],
        (error, results, fields) => {
            if (error) {
                console.error('Erreur lors de la récupération des enfants : ' + error.message);
                return res.json({ success: false, message: 'Erreur lors de la récupération des enfants' });
            }

            const childrenResults = results.reduce((acc, row) => {
                const childId = row.id;
                if (!acc[childId]) {
                    acc[childId] = {
                        id: row.id,
                        user_id: row.user_id,
                        firstname: row.firstname,
                        lastname: row.lastname,
                        age: row.age,
                        child_schedules: [],
                    };
                }

                if (row.dayOfWeek) {
                    acc[childId].child_schedules.push({
                        dayOfWeek: row.dayOfWeek,
                        dayName: row.dayName,
                        daycareHoursStart: row.daycareHoursStart,
                        daycareHoursEnd: row.daycareHoursEnd,
                    });
                }

                return acc;
            }, {});

            const childrenArray = Object.values(childrenResults);

            res.render('enfants', { children: childrenArray, profile: logUser });
        }
    );
});


///////////////////////////////////// AJOUT ENFANTS PLANNING ////////////////////////////////////////////////////////


app.get('/childrens', (req, res) => {
    const userId = req.session.logUser.id;

    connection.query('SELECT * FROM children WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des enfants : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de la récupération des enfants' });
        }

        const events = [];

        if (results && results.length > 0) {
            results.forEach(child => {
                const event = {
                    title: `${child.firstname} ${child.lastname}`,
                    start: `${child.daycareDays}T${child.daycareHours.split(',')[0]}`,
                    end: `${child.daycareDays}T${child.daycareHours.split(',')[1]}`,
                };
                events.push(event);
            });
        }

        res.json({ success: true, events });
    });
});




///////////////////////////////////// AFFICHAGE EMPLOYES ////////////////////////////////////////////////////////


app.get('/employes', (req, res) => {
    const logUser = res.locals.logUser;
    const userId = req.session.logUser.id;

    if (!req.session.logUser || !req.session.logUser.id) {
        console.error('Erreur : Utilisateur non connecté');
        return res.redirect('/');
    }

    connection.query('SELECT * FROM employees WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des employés : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de la récupération des employés' });
        }

        // Ajoutez workDays à la requête SQL
        connection.query('SELECT * FROM employee_schedules WHERE employee_id IN (?)', [results.map(e => e.id)], (error, schedules) => {
            if (error) {
                console.error('Erreur lors de la récupération des horaires des employés : ' + error.message);
                return res.json({ success: false, message: 'Erreur lors de la récupération des horaires des employés' });
            }

            // Associez les jours de travail aux employés
            results.forEach(employee => {
                const employeeSchedules = schedules.filter(schedule => schedule.employee_id === employee.id);
                employee.workDays = employeeSchedules.map(schedule => schedule.day_id);
            });

            // Rendez la page EJS avec les résultats des employés
            res.render('employes', { employees: results, profile: logUser });
        });
    });
});



///////////////////////////////////// AJOUT EMPLOYES PLANNING ////////////////////////////////////////////////////////


app.get('/employees', (req, res) => {
    const userId = req.session.logUser.id;

    connection.query('SELECT * FROM employees WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des employés : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de la récupération des employés' });
        }

        const events = [];

        results.forEach(employee => {
            const event = {
                title: `${employee.firstname} ${employee.lastname}`,
                start: `${employee.workDays}T${employee.workHours[0]}`,
                end: `${employee.workDays}T${employee.workHours[1]}`,
            };
            events.push(event);
        });

        res.json({ success: true, events });
    });
});


///////////////////////////////////// AJOUT EMPLOYES PLANNING ////////////////////////////////////////////////////////


async function getChildDaycareHours(childId) {
    const sqlQuery = `
        SELECT daycareHoursStart, daycareHoursEnd
        FROM child_hours
        WHERE child_id = ${childId};
    `;

    return new Promise((resolve, reject) => {
        connection.query(sqlQuery, (error, results) => {
            if (error) {
                console.error('Erreur lors de la récupération des heures de garde de l\'enfant : ' + error.message);
                reject(error);
            } else {
                if (results.length > 0) {
                    const childStartHour = results[0].daycareHoursStart;
                    const childEndHour = results[0].daycareHoursEnd;

                    resolve({ childStartHour, childEndHour });
                } else {
                    console.error('Aucune heure de garde trouvée pour l\'enfant avec l\'ID ' + childId);
                    reject(new Error('Aucune heure de garde trouvée pour l\'enfant avec l\'ID ' + childId));
                }
            }
        });
    });
}


///////////////////////////////////// ASSIGNEMENT EMPLOYES ////////////////////////////////////////////////////////


function assignEmployeesToChildren(employees, childSchedules, events) {
    events.forEach(event => {
        const titleParts = event.title.split(':');

        if (titleParts.length > 1) {
            const childId = titleParts[1] ? titleParts[1].trim() : null;

            if (childId) {
                const childSchedule = childSchedules.find(schedule => schedule.childId === parseInt(childId, 10));

                if (childSchedule) {
                    const { daycareHoursStart, daycareHoursEnd } = childSchedule;

                    console.log('Heure de début de garde de l\'enfant : ' + daycareHoursStart);
                    console.log('Heure de fin de garde de l\'enfant : ' + daycareHoursEnd);

                    event.start = moment().isoWeekday(childSchedule.dayOfWeek).hour(daycareHoursStart);
                    event.end = moment().isoWeekday(childSchedule.dayOfWeek).hour(daycareHoursEnd);
                } else {
                    console.error('Aucun horaire de garde trouvé pour l\'enfant avec l\'ID ' + childId);
                }
            } else {
                console.error('Le titre de l\'événement ne contient pas de childId valide.');
            }
        } else {
            console.error('Le titre de l\'événement ne contient pas de séparateur ":".');
        }
    });
}

///////////////////////////////////// DONNEES ENFANTS ////////////////////////////////////////////////////////


async function getChildData(userId) {
    return new Promise((resolve, reject) => {
        // Remplacez les champs et la logique suivante par vos propres besoins
        connection.query('SELECT id, daycareHoursStart, daycareHoursEnd FROM child_schedule_hours WHERE child_schedule_id = ?', [userId], (error, results) => {
            if (error) {
                console.error('Erreur lors de la récupération des données des enfants : ' + error.message);
                reject(error);
            } else {
                const childrenData = results.map(result => ({
                    id: result.id,
                    daycareHoursStart: result.daycareHoursStart,
                    daycareHoursEnd: result.daycareHoursEnd,
                    // Ajoutez d'autres champs au besoin
                }));
                resolve(childrenData);
            }
        });
    });
}

///////////////////////////////////// DONNEES EMPLOYES ////////////////////////////////////////////////////////


async function getEmployeeData(userId) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT id, workDays, workHours FROM employees WHERE user_id = ?', [userId], (error, results) => {
            if (error) {
                console.error('Erreur lors de la récupération des données des employés : ' + error.message);
                reject(error);
            } else {
                const employeesData = results.map(result => ({
                    id: result.id,
                    workDays: result.workDays,
                    workHours: result.workHours,
                    // Ajoutez d'autres champs au besoin
                }));
                resolve(employeesData);
            }
        });
    });
}

///////////////////////////////////// AJOUT EMPLOYES PLANNING ////////////////////////////////////////////////////////


function getChildSchedules(userId) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT id, child_id, dayOfWeek, daycareHoursStart, daycareHoursEnd FROM child_schedules WHERE child_id IN (SELECT id FROM children WHERE user_id = ?)', [userId], (error, results) => {
            if (error) {
                console.error('Erreur lors de la récupération des horaires de garde des enfants : ' + error.message);
                reject(error);
            } else {
                const childSchedules = results.map(result => ({
                    id: result.id,
                    childId: result.child_id,
                    dayOfWeek: result.dayOfWeek,
                    daycareHoursStart: result.daycareHoursStart,
                    daycareHoursEnd: result.daycareHoursEnd,
                    // Ajoutez d'autres champs au besoin
                }));
                resolve(childSchedules);
            }
        });
    });
}


///////////////////////////////////// PLANNING ////////////////////////////////////////////////////////


app.get('/planning', async (req, res) => {
    const userId = req.session.logUser ? req.session.logUser.id : null;

    try {
        if (userId) {
            // Récupérez les données des enfants, des employés et les horaires de garde des enfants
            const childrenResults = await getChildData(userId);
            const employeesResults = await getEmployeeData(userId);
            const childSchedules = await getChildSchedules(userId);
    
            // Créez un tableau pour stocker les événements du calendrier
            const events = [];
    
            childrenResults.forEach(child => {
                if (child.daycareHours) { // Vérifiez si daycareHours est défini
                    const daycareHoursParts = child.daycareHours.split(',');
    
                    if (daycareHoursParts.length === 2) {
                        const childEvent = {
                            title: `Enfant:${child.id}`,
                            start: moment().isoWeekday(child.daycareDays).hour(daycareHoursParts[0]),
                            end: moment().isoWeekday(child.daycareDays).hour(daycareHoursParts[1]),
                            color: 'blue',
                        };                                              
                        events.push(childEvent);
                    } else {
                        console.error(`Format invalide pour daycareHours pour l'enfant avec l'ID ${child.id}`);
                    }
                } else {
                    console.error(`Aucune valeur daycareHours pour l'enfant avec l'ID ${child.id}`);
                }
            });
    
            // Assignez les employés aux enfants en fonction des horaires de garde
            assignEmployeesToChildren(employeesResults, childSchedules, events);
    
            res.json({ success: true, events });
        } else {
            // Si l'utilisateur n'est pas connecté, renvoyez un planning vide
            res.json({ success: true, events: [] });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données du planning : ' + error.message);
        res.json({ success: false, message: 'Erreur lors de la récupération des données du planning' });
    }
});


///////////////////////////////////// AJOUT EMPLOYES PLANNING ////////////////////////////////////////////////////////


app.get('/childSchedules', (req, res) => {
    const userId = req.session.logUser.id;

    connection.query('SELECT * FROM children WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des horaires de garde des enfants : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de la récupération des horaires de garde des enfants' });
        }

        res.json({ success: true, childSchedules: results });
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


///////////////////////////////////// AJOUT EMPLOYES ////////////////////////////////////////////////////////


app.post('/addEmployee', (req, res) => {
    const userId = req.session.logUser.id;
    const { firstname, lastname, workDays, workHours } = req.body;

    const newEmployee = {
        firstname,
        lastname,
        workHours,
        user_id: userId,
    };

    connection.beginTransaction(async (err) => {
        if (err) {
            console.error('Erreur lors du démarrage de la transaction : ' + err.message);
            return res.json({ success: false, message: 'Erreur lors de l\'ajout de l\'employé' });
        }

        try {
            const { insertId: employeeId } = await insertEmployee(newEmployee);

            await insertEmployeeSchedules(employeeId, workDays);

            connection.commit((commitErr) => {
                if (commitErr) {
                    return connection.rollback(() => {
                        console.error('Erreur lors de la validation de la transaction : ' + commitErr.message);
                        return res.json({ success: false, message: 'Erreur lors de l\'ajout de l\'employé' });
                    });
                }

                console.log('Employé ajouté avec succès. ID de l\'employé :', employeeId);
                res.json({ success: true, message: 'Employé ajouté avec succès.' });
            });
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'employé : ' + error.message);
            connection.rollback(() => {
                res.json({ success: false, message: 'Erreur lors de l\'ajout de l\'employé' });
            });
        }
    });
});

async function insertEmployee(employee) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO employees SET ?', employee, (error, results) => {
            if (error) {
                console.error('Erreur lors de l\'ajout de l\'employé : ' + error.message);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

async function insertEmployeeSchedules(employeeId, workDays) {
    const values = workDays.map(day => [employeeId, day]);

    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO employee_schedules (employee_id, day_id) VALUES ?', [values], (error, results) => {
            if (error) {
                console.error('Erreur lors de l\'ajout des jours de travail : ' + error.message);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}



///////////////////////////////////// AJOUT ENFANTS ////////////////////////////////////////////////////////

function getDayOfWeek(dayName) {
    switch (dayName) {
        case 'Lundi':
            return 1;
        case 'Mardi':
            return 2;
        case 'Mercredi':
            return 3;
        case 'Jeudi':
            return 4;
        case 'Vendredi':
            return 5;
        // Ajoutez les autres jours au besoin
        default:
            return 0; // ou une valeur par défaut appropriée
    }
}

app.post('/addChild', (req, res) => {
    const userId = req.session.logUser.id;

    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const age = req.body.age;

    const daycareDays = Array.isArray(req.body.daycareDays) ? req.body.daycareDays : [req.body.daycareDays];
    const daycareHours = Array.isArray(req.body.daycareHours) ? req.body.daycareHours : [req.body.daycareHours];

    console.log('Valeurs reçues du formulaire :', firstname, lastname, age, daycareDays, daycareHours);

    if (typeof firstname === 'undefined' || firstname.trim() === '') {
        return res.status(400).json({ success: false, message: "Le prénom de l'enfant est requis." });
    }

    const sqlInsertChild = 'INSERT INTO children (firstname, lastname, age, user_id) VALUES (?, ?, ?, ?)';
    const valuesInsertChild = [firstname, lastname, age, userId];

    connection.query(sqlInsertChild, valuesInsertChild, (errorInsertChild, resultsInsertChild) => {
        if (errorInsertChild) {
            console.error('Erreur lors de l\'ajout de l\'enfant : ' + errorInsertChild.message);
            return res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout de l\'enfant' });
        }

        console.log('Enfant ajouté avec succès. ID de l\'enfant :', resultsInsertChild.insertId);

        const childId = resultsInsertChild.insertId;

        const sqlInsertChildHours = 'INSERT INTO child_schedule_hours (child_id, dayOfWeek, daycareHoursStart, daycareHoursEnd) VALUES (?, ?, ?, ?)';

        for (let i = 0; i < daycareDays.length; i++) {
            const day = daycareDays[i];

            if (day) {
                // Assurez-vous que l'index est valide pour daycareHours
                if (i < daycareHours.length) {
                    const dayHours = daycareHours[i];

                    // Ajoutez une vérification supplémentaire pour s'assurer qu'il y a des heures spécifiées
                    if (dayHours && typeof dayHours === 'string' && dayHours.trim() !== '') {
                        const hours = dayHours.split('-');

                        const startHour = hours[0] ? hours[0].trim() : '';
                        const endHour = hours[1] ? hours[1].trim() : '';

                        console.log('Valeurs pour l\'insertion des heures de garde :', childId, day, startHour, endHour);

                        const valuesInsertChildHours = [childId, getDayOfWeek(day), startHour, endHour];

                        connection.query(sqlInsertChildHours, valuesInsertChildHours, (errorInsertChildHours, resultsInsertChildHours) => {
                            if (errorInsertChildHours) {
                                console.error('Erreur lors de l\'ajout des heures de garde : ' + errorInsertChildHours.message);
                            } else {
                                console.log('Heures de garde ajoutées avec succès. ID des heures de garde :', resultsInsertChildHours.insertId);
                            }
                        });
                    } else {
                        console.error('Heures de garde invalides pour le jour ' + day);
                    }
                } else {
                    console.error('Index en dehors de la plage pour daycareHours : ' + i);
                }
            }
        }

        res.redirect('/enfants');
    });
});



///////////////////////////////////// SUPPRESSION ENFANTS ////////////////////////////////////////////////////////


app.delete('/deleteChild/:childId', (req, res) => {
    const childId = req.params.childId;

    // Commencez par supprimer les entrées liées dans la table child_schedule_hours
    connection.query('DELETE FROM child_schedule_hours WHERE child_id = ?', [childId], (errorChildScheduleHours, resultsChildScheduleHours) => {
        if (errorChildScheduleHours) {
            console.error('Erreur lors de la suppression des heures de garde de l\'enfant : ' + errorChildScheduleHours.message);
            return res.json({ success: false, message: 'Erreur lors de la suppression des heures de garde de l\'enfant' });
        }

        // Ensuite, supprimez l'enfant de la table children
        connection.query('DELETE FROM children WHERE id = ?', [childId], (errorChildren, resultsChildren) => {
            if (errorChildren) {
                console.error('Erreur lors de la suppression de l\'enfant : ' + errorChildren.message);
                return res.json({ success: false, message: 'Erreur lors de la suppression de l\'enfant' });
            }

            console.log('Enfant supprimé avec succès');
            return res.json({ success: true, message: 'Enfant supprimé avec succès' });
        });
    });
});


///////////////////////////////////// SUPPRESSION EMPLOYES ////////////////////////////////////////////////////////


app.delete('/deleteEmployee/:employeeId', async (req, res) => {
    const employeeId = req.params.employeeId;

    try {
        // Supprimez d'abord les horaires d'employé associés
        await new Promise((resolve, reject) => {
            connection.query('DELETE FROM employee_schedules WHERE employee_id = ?', [employeeId], (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        // Ensuite, supprimez l'employé lui-même
        await new Promise((resolve, reject) => {
            connection.query('DELETE FROM employees WHERE id = ?', [employeeId], (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        console.log('Employé supprimé avec succès');
        return res.json({ success: true, message: 'Employé supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'employé : ' + error.message);
        return res.json({ success: false, message: 'Erreur lors de la suppression de l\'employé' });
    }
});


// Exemple pour récupérer les détails d'un employé
app.get('/getEmployeeDetails/:employeeId', (req, res) => {
    const employeeId = req.params.employeeId;

    // Effectuez une requête SQL pour récupérer les détails de l'employé en fonction de l'ID
    const sql = 'SELECT * FROM employees WHERE id = ?';
    connection.query(sql, [employeeId], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des détails de l\'employé : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de la récupération des détails de l\'employé' });
        }

        // Retournez les détails sous forme de JSON
        return res.json({ success: true, employeeDetails: results[0] });
    });
});


///////////////////////////////////// MODIFICATION EMPLOYES ////////////////////////////////////////////////////////


app.post('/editEmployee', (req, res) => {
    const employeeId = req.body.editEmployeeId;
    const editedFirstName = req.body.editFirstName;
    const editedLastName = req.body.editLastName;
    const editedWorkDays = req.body.editWorkDays; // Si vous utilisez les jours de travail
    const editedWorkHours = req.body.editWorkHours;

    console.log('ID de l\'employé à mettre à jour :', employeeId);
    console.log('Nouveaux détails :', editedFirstName, editedLastName, editedWorkDays, editedWorkHours);

    // Effectuez une requête SQL pour mettre à jour les informations de l'employé
    const updateEmployeeSql = 'UPDATE employees SET firstname = ?, lastname = ?, workHours = ? WHERE id = ?';
    const employeeValues = [editedFirstName, editedLastName, editedWorkHours, employeeId];

    connection.query(updateEmployeeSql, employeeValues, (error, employeeResults) => {
        if (error) {
            console.error('Erreur lors de la mise à jour des informations de l\'employé : ' + error.message);
            return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour des informations de l\'employé' });
        }

        const editedWorkHoursStart = req.body.editWorkHoursStart;  // Assurez-vous que le champ correspondant existe dans votre formulaire
        const editedWorkHoursEnd = req.body.editWorkHoursEnd;      // Assurez-vous que le champ correspondant existe dans votre formulaire

        console.log('Nouveaux horaires de travail :', editedWorkHoursStart, editedWorkHoursEnd);

        // Mise à jour des jours de travail dans la table employee_schedules
        const deleteScheduleSql = 'DELETE FROM employee_schedules WHERE employee_id = ?';
        connection.query(deleteScheduleSql, [employeeId], (deleteError, deleteResults) => {
            if (deleteError) {
                console.error('Erreur lors de la suppression des anciens horaires de travail : ' + deleteError.message);
                return res.status(500).json({ success: false, message: 'Erreur lors de la suppression des anciens horaires de travail' });
            }

            // Insertion des nouveaux horaires de travail
            const insertScheduleSql = 'INSERT INTO employee_schedules (employee_id, day_id, workHoursStart, workHoursEnd) VALUES (?, ?, ?, ?)';
            
            // Itérer sur les jours de travail et les insérer dans la table
            editedWorkDays.forEach(day => {
                const scheduleValues = [employeeId, day, editedWorkHoursStart, editedWorkHoursEnd];
                connection.query(insertScheduleSql, scheduleValues, (insertError, insertResults) => {
                    if (insertError) {
                        console.error('Erreur lors de l\'ajout des nouveaux horaires de travail : ' + insertError.message);
                        return res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout des nouveaux horaires de travail' });
                    }
                });
            });

            console.log('Informations de l\'employé mises à jour avec succès');
            res.redirect('/employes');
        });
    })
});


app.post('/editChild', (req, res) => {
    const childId = req.body.editChildId;
    const editedFirstName = req.body.editFirstName;
    const editedLastName = req.body.editLastName;
    const editedAge = req.body.editAge;
    const editedWorkDays = req.body.editWorkDays;
    const editedWorkHoursStart = req.body.editWorkHoursStart;
    const editedWorkHoursEnd = req.body.editWorkHoursEnd;

    console.log('ID de l\'enfant à mettre à jour :', childId);
    console.log('Nouveaux détails :', editedFirstName, editedLastName, editedAge, editedWorkDays, editedWorkHoursStart, editedWorkHoursEnd);

    // Vérifiez que les heures de garde sont définies
    if (editedWorkHoursStart === undefined || editedWorkHoursEnd === undefined) {
        return res.status(400).json({ success: false, message: 'Les heures de garde doivent être spécifiées' });
    }

    // Effectuez une requête SQL pour mettre à jour les informations de l'enfant
    const updateChildSql = 'UPDATE children SET firstname = ?, lastname = ?, age = ? WHERE id = ?';
    const childValues = [editedFirstName, editedLastName, editedAge, childId];

    connection.query(updateChildSql, childValues, (error, childResults) => {
        if (error) {
            console.error('Erreur lors de la mise à jour des informations de l\'enfant : ' + error.message);
            return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour des informations de l\'enfant' });
        }

        // Supprimez les anciens horaires de travail de l'enfant
        const deleteScheduleSql = 'DELETE FROM child_schedule_hours WHERE child_id = ?';
        connection.query(deleteScheduleSql, [childId], (deleteError, deleteResults) => {
            if (deleteError) {
                console.error('Erreur lors de la suppression des anciens horaires de travail de l\'enfant : ' + deleteError.message);
                return res.status(500).json({ success: false, message: 'Erreur lors de la suppression des anciens horaires de travail de l\'enfant' });
            }

            // Insérez les nouveaux horaires de travail
            const insertScheduleSql = 'INSERT INTO child_schedule_hours (child_id, dayOfWeek, daycareHoursStart, daycareHoursEnd) VALUES (?, ?, ?, ?)';

            // Itérez sur les jours de travail et insérez-les dans la table
            editedWorkDays.forEach((day, index) => {
                const scheduleValues = [childId, day, editedWorkHoursStart[index], editedWorkHoursEnd[index]];
                connection.query(insertScheduleSql, scheduleValues, (insertError, insertResults) => {
                    if (insertError) {
                        console.error('Erreur lors de l\'ajout des nouveaux horaires de travail de l\'enfant : ' + insertError.message);
                        return res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout des nouveaux horaires de travail de l\'enfant' });
                    }
                });
            });


            console.log('Informations de l\'enfant mises à jour avec succès');
            res.redirect('/enfantss');
        });
    });
});




app.get('/getChildDetails/:childId', (req, res) => {
    const childId = req.params.childId;

    // Effectuez une requête SQL pour récupérer les détails de l'enfant en fonction de l'ID
    const sql = 'SELECT * FROM children WHERE id = ?';
    connection.query(sql, [childId], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des détails de l\'enfant : ' + error.message);
            return res.json({ success: false, message: 'Erreur lors de la récupération des détails de l\'enfant' });
        }

        // Retournez les détails sous forme de JSON
        return res.json({ success: true, childDetails: results[0] });
    });
});


///////////////////////////////////// LANCEMENT DU PORT ////////////////////////////////////////////////////////

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
