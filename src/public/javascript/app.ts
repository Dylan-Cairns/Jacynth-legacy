import {
  SinglePlayerController,
  MultiPlayerController,
  Controller
} from './controller/controller.js';
import { Layout, BOARD_LAYOUTS } from './model/model.js';
import { PlayerID } from './model/player.js';

// TODO: resolve import error when using 'import' on client side.
// For now, declare the socket variables here.
declare const socket: any;
declare const io: any;

// gametype variable passed in by express route
declare const gameType: 'singleplayer' | 'multiplayer';

let controller: Controller;

if (gameType === 'singleplayer') {
  controller = new SinglePlayerController('basicDeck');
}

if (gameType === 'multiplayer') {
  const socket = io();
  let currPlyrID: PlayerID;

  socket.emit('getPlayerID');

  socket.on('recievePlayerID', (playerID: PlayerID) => {
    currPlyrID = playerID;
    const controller = new MultiPlayerController(
      'basicDeck',
      currPlyrID,
      socket
    );
  });
}
