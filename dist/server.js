import express from 'express';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import eoc from 'express-openid-connect';
const { auth, requiresAuth } = eoc;
import { SocketServer } from './routes/socket.js';
import { rest } from './routes/rest.js';
import { authRouter } from './routes/auth.js';
import { htmlRouter } from './routes/html.js';
// configuration
dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/favicon.ico', express.static('assets/favicon.ico'));
app.use(express.json());
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_session_secret,
    baseURL: process.env.AUTH0_baseURL,
    clientID: process.env.AUTH0_clientID,
    issuerBaseURL: process.env.AUTH0_issuerBaseURL
}));
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.oidc.isAuthenticated();
    res.locals.activeRoute = req.originalUrl;
    next();
});
// routes
// rest api routes
app.use('/api/v1/rest', rest);
// authentication routes
app.use('/api/v1/auth/', authRouter);
// HTML routes
app.use('/', htmlRouter);
// app.get('/', (req, res) => {
//   res.render('home');
// });
// app.get('/singleplayer', async (req, res) => {
//   // if user is logged in, check if they have chosen a nickname yet.
//   let hasNick = true;
//   if (res.locals.isAuthenticated && req.oidc.user) {
//     const result = await Utils.hasNickname(req.oidc.user.sub);
//     if (result !== undefined) hasNick = result;
//   }
//   res.render('game', {
//     gameType: 'singleplayer',
//     hasNick: hasNick
//   });
// });
// app.get('/multiplayer', async (req, res) => {
//   // if user is logged in, check if they have chosen a nickname yet.
//   if (req.oidc.user && req.oidc.user.sub) console.log(req.oidc.user.sub);
//   let hasNick = true;
//   if (res.locals.isAuthenticated && req.oidc.user) {
//     const result = await Utils.hasNickname(req.oidc.user.sub);
//     if (result !== undefined) hasNick = result;
//   }
//   res.render('game', {
//     gameType: 'multiplayer',
//     hasNick: hasNick
//   });
// });
// app.get('/profile', requiresAuth(), (req, res) => {
//   res.render('profile');
// });
// app.get('/highscores', (req, res) => {
//   res.render('highscores');
// });
const sockServer = new SocketServer(io);
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
