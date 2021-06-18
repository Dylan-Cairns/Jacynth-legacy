import {
  SinglePlayerController,
  MultiPlayerController
} from './controller/controller.js';
// import { io } from 'socket.io-client';
const singlePlayerBttn = document.getElementById('singlePlayerBttn');
const multiPlayerBttn = document.getElementById('multiPlayerBttn');
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
