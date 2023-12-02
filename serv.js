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

// Routes
app.get('/', (req, res) => {
    res.render('home'); // Render la page home.ejs
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
