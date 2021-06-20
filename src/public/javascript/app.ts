import {
  SinglePlayerController,
  MultiPlayerController,
  Controller
} from './controller/controller.js';
import { Layout, BOARD_LAYOUTS } from './model/model.js';
import { PlayerID } from './model/player.js';

const chooseLayoutOverlay = document.getElementById(
  'chooseLayoutOverlay'
) as HTMLElement;
const chooseLayout = document.getElementById('chooseLayout') as HTMLElement;
const layoutButtons = document.querySelectorAll(
  '.layoutButton'
) as NodeListOf<HTMLButtonElement>;

// TODO: resolve import error when using 'import' on client side.
// For now, declare the socket variables here.
declare const socket: any;
declare const io: any;

// gametype variable passed in by express route
declare const gameType: 'singleplayer' | 'multiplayer';

let controller: any;

if (gameType === 'singleplayer') {
  controller = new SinglePlayerController('basicDeck');
  chooseLayout.classList.add('active');
  chooseLayoutOverlay.classList.add('active');
}

if (gameType === 'multiplayer') {
  const socket = io();
  let currPlyrID: PlayerID;

  socket.emit('getPlayerID');

  socket.on('recievePlayerID', (playerID: PlayerID) => {
    console.log('recieved player id', playerID);
    currPlyrID = playerID;

    if (currPlyrID === 'Player 2') chooseLayout.classList.add('active');
  });

  socket.on('beginGame', (layout: Layout) => {
    if (!currPlyrID) return;
    const controller = new MultiPlayerController(
      'basicDeck',
      currPlyrID,
      socket
    );
  });
}

layoutButtons.forEach((button) => {
  button.addEventListener('click', () => {
    chooseLayout.classList.remove('active');
    chooseLayoutOverlay.classList.remove('active');
    const layoutChoice = button.dataset.layout as Layout;
    if (!layoutChoice) return;
    if (gameType === 'singleplayer') {
      controller.startGame(layoutChoice);
    } else {
      socket.emit('chooseLayout', layoutChoice);
    }
  });
});
