import express from 'express';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import eoc from 'express-openid-connect';
const { auth } = eoc;

import { SocketServer } from './routes/socket.js';
import { rest } from './routes/rest.js';
// import { authRouter } from './routes/auth.js';
import { viewRouter } from './routes/views.js';

// configuration

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.enable('trust proxy');

// middleware

app.use(express.static(path.join(__dirname, 'public')));
app.use('/favicon.ico', express.static('assets/favicon.ico'));
app.use(express.json());

console.log(process.env.NODE_ENV);
//redirect http to https
app.use(function (request, response, next) {
  if (process.env.NODE_ENV != 'development' && !request.secure) {
    return response.redirect('https://' + request.headers.host + request.url);
  }

  next();
});

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(
  auth({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_session_secret,
    baseURL: process.env.AUTH0_baseURL,
    clientID: process.env.AUTH0_clientID,
    issuerBaseURL: process.env.AUTH0_issuerBaseURL,
    routes: {
      login: false
    }
  })
);

//made isAuthenticated method available on all responses.
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.oidc.isAuthenticated();
  next();
});

// view routes
app.use('/', viewRouter);

// rest api routes
app.use('/rest', rest);

// authentication routes
// only using one route, just put the route code here rather than importing from auth.ts
// app.use('/auth', authRouter);
app.get('/login', (req, res) => res.oidc.login({ returnTo: '/' }));

app.get('/sign-up', (req, res) => {
  res.oidc.login({
    authorizationParams: {
      screen_hint: 'signup'
    },
    returnTo: 'https://jacynth.herokuapp.com/'
  });
});

// socket.io server
const sockServer = new SocketServer(io);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
