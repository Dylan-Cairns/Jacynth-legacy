import express from 'express';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import pkg from 'express-openid-connect';
const { auth } = pkg;
// game objects used by server side multiplayer code
import { Decktet } from './public/javascript/model/decktet.js';
import { storeGameResult } from './queries.js';
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
app.get('/', (req, res) => {
    res.render('home');
});
app.get('/singleplayer', (req, res) => {
    res.render('game', { gameType: 'singleplayer' });
});
app.get('/multiplayer', (req, res) => {
    res.render('game', { gameType: 'multiplayer' });
});
app.get('/profile', (req, res) => {
    res.render('profile', {
        user: req.oidc.user
    });
});
// rest api routes
app.post('/storeSPGameResult', (req, res) => {
    let user1ID = 'guest';
    let user1Nick = 'guest';
    if (res.locals.isAuthenticated && req.oidc.user) {
        user1ID = req.oidc.user.sub;
        user1Nick = req.oidc.user.nickname;
    }
    req.body['user1ID'] = user1ID;
    req.body['user1Nick'] = user1Nick;
    storeGameResult(req, res);
});
// authentication routes
app.get('/sign-up/:page', (req, res) => {
    res.oidc.login({
        authorizationParams: {
            screen_hint: 'signup'
        }
    });
});
app.get('/login/:page', (req, res) => {
    const { page } = req.params;
    res.oidc.login({
        returnTo: page
    });
});
app.get('/logout/:page', (req, res) => {
    const { page } = req.params;
    res.oidc.logout({
        returnTo: page
    });
});
const roomsGameData = [];
io.on('connection', (socket) => {
    console.log('a user connected');
    let currRoomNo = 0;
    let foundRoom = false;
    let room = io.sockets.adapter.rooms.get(`room-${currRoomNo}`);
    while (!foundRoom) {
        room = io.sockets.adapter.rooms.get(`room-${currRoomNo}`);
        // go to next room if current room is full.
        if (room && room.size === 2) {
            currRoomNo++;
            // if room already has 1 player: check if the game already started.
            // if so, go to next room. otherwise join as player 2.
        }
        else if (room &&
            room.size === 1 &&
            roomsGameData[currRoomNo] &&
            roomsGameData[currRoomNo].p2ready == true) {
            currRoomNo++;
        }
        else {
            // otherwise, the room is empty, or only has 1 player & has not been started.
            // we can join the room.
            foundRoom = true;
        }
    }
    console.log(`join room-${currRoomNo}`);
    socket.join(`room-${currRoomNo}`);
    room = io.sockets.adapter.rooms.get(`room-${currRoomNo}`);
    let playerID;
    const deck = new Decktet('basicDeck');
    socket.on('getPlayerID', () => {
        if (!roomsGameData[currRoomNo] || (room && room.size === 1)) {
            playerID = 'Player 1';
            // if the game data obj doesn't exist create it. Or overwrite the existing
            // object if we are the first player in the game room.
            roomsGameData[currRoomNo] = {
                roomName: `room-${currRoomNo}`,
                layoutSpaces: undefined,
                layoutCards: [],
                p1Connected: true,
                p1ready: false,
                p2Connected: false,
                p2ready: false,
                cardDeck: deck
            };
        }
        else {
            playerID = 'Player 2';
            roomsGameData[currRoomNo].p2Connected = true;
        }
        socket.emit('recievePlayerID', playerID);
    });
    socket.on('chooseLayout', (layout) => {
        io.to(`room-${currRoomNo}`).emit('beginGame', layout);
    });
    // draw cards for the starting layout. they will be sent later once the
    // playerReady command is recieved from both players
    socket.on('createStartingLayout', (layoutArr) => {
        console.log('getStartingLayout called');
        // if this is the first player initiated call to this method,
        // draw the cards for the layout. Otherwise ignore it.
        if (!roomsGameData[currRoomNo].layoutSpaces) {
            console.log('drawing cards & generating layout');
            roomsGameData[currRoomNo].layoutSpaces = layoutArr;
            layoutArr.forEach((spaceID) => {
                var _a, _b;
                const card = (_a = roomsGameData[currRoomNo].cardDeck) === null || _a === void 0 ? void 0 : _a.drawCard();
                if (!card)
                    return;
                (_b = roomsGameData[currRoomNo].layoutCards) === null || _b === void 0 ? void 0 : _b.push(card);
            });
        }
    });
    const drawCardCB = (playerID) => {
        var _a;
        console.log('drawCard called');
        const card = (_a = roomsGameData[currRoomNo].cardDeck) === null || _a === void 0 ? void 0 : _a.drawCard();
        if (!card)
            return;
        io.to(`room-${currRoomNo}`).emit('recieveCardDraw', card.getId(), playerID);
    };
    // respond to player request to draw a card
    socket.on('drawCard', drawCardCB);
    socket.on('playerReady', (currPlyrID) => {
        var _a;
        // Send players the current room number to display in the UI
        io.to(`room-${currRoomNo}`).emit('connectToRoom', currRoomNo);
        if (currPlyrID === 'Player 1') {
            roomsGameData[currRoomNo].p1ready = true;
        }
        else {
            roomsGameData[currRoomNo].p2ready = true;
        }
        // if both players are ready, start the game!
        if (roomsGameData[currRoomNo].p1ready &&
            roomsGameData[currRoomNo].p2ready) {
            // send initial layout
            (_a = roomsGameData[currRoomNo].layoutSpaces) === null || _a === void 0 ? void 0 : _a.forEach((spaceID, idx) => {
                if (roomsGameData[currRoomNo].layoutCards.length === 0)
                    return;
                const card = roomsGameData[currRoomNo].layoutCards[idx];
                if (!card)
                    return;
                io.to(`room-${currRoomNo}`).emit('recieveLayoutCard', card.getId(), spaceID);
            });
            // draw 3 cards for each player
            [0, 0, 0].forEach((ele) => drawCardCB('Player 1'));
            [0, 0, 0].forEach((ele) => drawCardCB('Player 2'));
            io.to(`room-${currRoomNo}`).emit('enableP1CardDragging');
            io.to(`room-${currRoomNo}`).emit('p2Ready');
        }
    });
    socket.on('sendPlayerMove', (playerID, cardID, SpaceID, TokenSpaceID) => {
        console.log('socket emit sendPlayerMove method recieved by server');
        console.log(playerID, cardID, SpaceID, TokenSpaceID);
        socket
            .to(`room-${currRoomNo}`)
            .emit('recievePlayerMove', playerID, cardID, SpaceID, TokenSpaceID);
        // next player start turn
        const nextPlayer = playerID === 'Player 1' ? 'Player 2' : 'Player 1';
        socket.to(`room-${currRoomNo}`).emit('beginNextTurn', nextPlayer);
    });
    socket.on('disconnect', () => {
        console.log(`${playerID} disconnected`);
        io.in(`room-${currRoomNo}`).disconnectSockets(true);
    });
});
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
