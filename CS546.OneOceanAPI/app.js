require('dotenv').config();

const express = require('express');
const { engine } = require('express-handlebars');
const session = require('express-session');
const path = require('path');
const configRoutes = require('./routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: 'AuthenticationState',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false
  })
);

app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

configRoutes(app);

module.exports = app;
