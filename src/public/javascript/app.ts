import {
  SinglePlayerController,
  MultiPlayerController
} from './controller/controller.js';
import { Layout, BOARD_LAYOUTS } from './model/model.js';
import { io } from 'socket.io-client';

// gametype variable passed in by express route
declare const gameType: 'singleplayer' | 'multiplayer';

// Start the game

if (gameType === 'singleplayer') {
  const controller = new SinglePlayerController('oldcity', 'basicDeck');
} else {
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
}

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
