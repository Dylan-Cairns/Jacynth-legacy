import express from 'express';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
dotenv.config();

// some game objects used by server side multiplayer code
import { Card, Decktet } from './public/javascript/model/decktet.js';
import { BoardSpace } from './public/javascript/model/gameboard.js';

import { getUsers } from './queries.js';

console.log(process.env.DB_user, process.env.DB_password);

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

console.log('app loaded');
app.get('/users', getUsers);

// app.use((req, res) => {
//   res.status(404).redirect('/');
// });

// socket.io

type roomDataObject = {
  roomName: string;
  layoutSpaces: string[] | undefined;
  layoutCards: Card[];
  p1Connected: boolean;
  p1ready: boolean;
  p2Connected: boolean;
  p2ready: boolean;
  cardDeck: Decktet | undefined;
};

const roomsGameData = [] as roomDataObject[];

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
    } else if (
      room &&
      room.size === 1 &&
      roomsGameData[currRoomNo] &&
      roomsGameData[currRoomNo].p2ready == true
    ) {
      currRoomNo++;
    } else {
      // otherwise, the room is empty, or only has 1 player & has not been started.
      // we can join the room.
      foundRoom = true;
    }
  }

  console.log(`join room-${currRoomNo}`);
  socket.join(`room-${currRoomNo}`);
  room = io.sockets.adapter.rooms.get(`room-${currRoomNo}`);

  let playerID: 'Player 1' | 'Player 2';

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
    } else {
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
      layoutArr.forEach((spaceID: BoardSpace) => {
        const card = roomsGameData[currRoomNo].cardDeck?.drawCard();
        if (!card) return;
        roomsGameData[currRoomNo].layoutCards?.push(card);
      });
    }
  });

  const drawCardCB = (playerID: 'Player 1' | 'Player 2') => {
    console.log('drawCard called');
    const card = roomsGameData[currRoomNo].cardDeck?.drawCard();
    if (!card) return;
    io.to(`room-${currRoomNo}`).emit('recieveCardDraw', card.getId(), playerID);
  };

  // respond to player request to draw a card
  socket.on('drawCard', drawCardCB);

  socket.on('playerReady', (currPlyrID: 'Player 1' | 'Player 2') => {
    // Send players the current room number to display in the UI
    io.to(`room-${currRoomNo}`).emit('connectToRoom', currRoomNo);
    if (currPlyrID === 'Player 1') {
      roomsGameData[currRoomNo].p1ready = true;
    } else {
      roomsGameData[currRoomNo].p2ready = true;
    }
    // if both players are ready, start the game!
    if (
      roomsGameData[currRoomNo].p1ready &&
      roomsGameData[currRoomNo].p2ready
    ) {
      // send initial layout
      roomsGameData[currRoomNo].layoutSpaces?.forEach(
        (spaceID: string, idx) => {
          if (roomsGameData[currRoomNo].layoutCards.length === 0) return;
          const card = roomsGameData[currRoomNo].layoutCards[idx];
          if (!card) return;
          io.to(`room-${currRoomNo}`).emit(
            'recieveLayoutCard',
            card.getId(),
            spaceID
          );
        }
      );
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
