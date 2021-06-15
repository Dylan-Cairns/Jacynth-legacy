import express from 'express';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Server, Socket } from 'socket.io';
import { Decktet } from './public/javascript/model/decktet.js';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// middleware
app.use(express.static(path.join(__dirname, 'public')));

// routes

app.get('/', (req, res) => {
  res.sendFile('/public/game.html', { root: __dirname });
});

// socket.io

type roomDataObject = {
  roomName: string;
  player1ID: string;
  player1SocketID: string;
  cardDeck: Decktet;
};

const MAX_ROOMS = 10;
const PLAYERS_PER_ROOM = 2;
const roomsGameData = [] as roomDataObject[];
let currRoomNo = 0;

io.on('connection', (socket) => {
  console.log('a user connected');

  //Increase currRoomNo if current room is full.
  const room = io.sockets.adapter.rooms.get('room-' + currRoomNo)!;
  if (room && room.size > 1) currRoomNo++;

  socket.join('room-' + currRoomNo);

  //Send this event to everyone in the room.
  io.sockets
    .in('room-' + currRoomNo)
    .emit('connectToRoom', 'You are in room no. ' + currRoomNo);

  roomsGameData[currRoomNo].cardDeck = new Decktet('basicDeck');

  socket.on('drawCard', (playerID: string) => {
    const card = roomsGameData[currRoomNo].cardDeck.drawCard();
    io.to('room-' + currRoomNo).emit('recieveCardDraw', card, playerID);
  });

  socket.on('getInitialCard', () => {
    const card = roomsGameData[currRoomNo].cardDeck.drawCard();
    io.to('room-' + currRoomNo).emit('recieveInitialCard', card);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
