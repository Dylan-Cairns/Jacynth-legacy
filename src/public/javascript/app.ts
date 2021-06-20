import {
  SinglePlayerController,
  MultiPlayerController
} from './controller/controller.js';
import { Layout, BOARD_LAYOUTS } from './model/model.js';
import { PlayerID } from './model/player.js';

// page menu buttons
const menuButton = document.getElementById('menuButton') as HTMLButtonElement;
const closeMenuButton = document.getElementById(
  'closeMenuButton'
) as HTMLButtonElement;
const menu = document.getElementById('menu-popup') as HTMLElement;
const rulesButton = document.getElementById('rulesButton') as HTMLButtonElement;
const closeRulesButton = document.getElementById(
  'closeRulesButton'
) as HTMLButtonElement;
const rules = document.getElementById('rules') as HTMLElement;
const overlay = document.getElementById('overlay') as HTMLElement;
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

if (gameType === 'singleplayer') {
  chooseLayout.classList.add('active');
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
      layout,
      'basicDeck',
      currPlyrID,
      socket
    );
  });
}

layoutButtons.forEach((button) => {
  button.addEventListener('click', () => {
    chooseLayout.classList.remove('active');
    const layout = button.dataset.layout as Layout;
    if (!layout) return;
    if (gameType === 'singleplayer') {
      const controller = new SinglePlayerController(layout, 'basicDeck');
    } else {
      socket.emit('chooseLayout', layout);
    }
  });
});

menuButton.addEventListener('click', () => {
  openModal(menu);
});

closeMenuButton.addEventListener('click', () => {
  closeModal(menu);
});

overlay.addEventListener('click', () => {
  const modals = document.querySelectorAll('.modal.active');
  modals.forEach((modal) => {
    closeModal(modal);
  });
});

rulesButton.addEventListener('click', () => {
  openModal(rules);
});

closeRulesButton.addEventListener('click', () => {
  rules.classList.remove('active');
});

rules.addEventListener('click', (event) => {
  if (event.target === rules) {
    rules.classList.remove('active');
  }
});

function openModal(modal: Element | HTMLElement) {
  if (modal == null) return;
  modal.classList.add('active');
  overlay.classList.add('active');
}

function closeModal(modal: Element | HTMLElement) {
  if (modal == null) return;
  modal.classList.remove('active');
  overlay.classList.remove('active');
}
