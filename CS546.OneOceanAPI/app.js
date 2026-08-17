import 'dotenv/config';

import express from 'express';
import { engine } from 'express-handlebars';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import configRoutes from './routes/index.js';
import { exposeUserToViews, loggerMiddleware, globalErrorHandler } from './middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    name: 'AuthenticationState',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017',
      dbName: process.env.MONGO_DB_NAME || 'oneocean'
    })
  })
);

app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

//expose session user to all views (placed AFTER session, BEFORE routes)
app.use(exposeUserToViews);

//logger Middleware (placed BEFORE routes so every request is logged)
app.use(loggerMiddleware);

//register all application routes
configRoutes(app);

//global Error Handler Middleware (MUST be registered LAST after configRoutes)
app.use(globalErrorHandler);

export default app;