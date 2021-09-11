import {
  SinglePlayerController,
  MultiPlayerController
} from './controller/controller.js';
import { PlayerID } from './model/player.js';
import { MainMenuHandler, NickNameFormHandler } from './view/utils.js';

// TODO: resolve import error when using 'import' on client side.
// For now, declare the io variables here.
declare const io: any;

// gametype variable passed in by express route
declare const gameType: 'singleplayer' | 'multiplayer';

declare const hasNick: boolean;

const nickNameFormHandler = new NickNameFormHandler(true);

const mainMenuHandler = new MainMenuHandler(false, false);

if (gameType === 'singleplayer') {
  const controller = new SinglePlayerController('basicDeck');
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
