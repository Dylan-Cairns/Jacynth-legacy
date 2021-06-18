import {
  SinglePlayerController,
  MultiPlayerController
} from './controller/controller.js';
import { Layout, BOARD_LAYOUTS } from './model/model.js';
import { io } from 'socket.io-client';

const singlePlayerBttn = document.getElementById(
  'singlePlayerBttn'
) as HTMLButtonElement;
const multiPlayerBttn = document.getElementById(
  'multiPlayerBttn'
) as HTMLButtonElement;

singlePlayerBttn.addEventListener('click', () => {
  const controller = new SinglePlayerController('oldcity', 'basicDeck');
});

multiPlayerBttn.addEventListener('click', () => {
  console.log('multiplayer button clicked');
  const socket = io();
  let currPlyrID;

  socket.emit('getPlayerID');

  socket.on('recievePlayerID', (playerID) => {
    console.log('recieved player id', playerID);
    currPlyrID = playerID;

    if (currPlyrID) {
      const controller = new MultiPlayerController(
        'oldcity',
        'basicDeck',
        currPlyrID,
        socket
      );
    }
  });

  // TODO: IMPLEMENT MENU TO CHOOSE LAYOUT AND DECKTYPE
});
