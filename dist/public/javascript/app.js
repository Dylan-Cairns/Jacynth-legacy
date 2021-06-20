import {
  SinglePlayerController,
  MultiPlayerController
} from './controller/controller.js';
// import { io } from 'socket.io-client';
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
const menuButton = document.getElementById('menuButton');
const closeMenuButton = document.getElementById('closeMenuButton');
const menu = document.getElementById('menu-popup');
const rulesButton = document.getElementById('rulesButton');
const closeRulesButton = document.getElementById('closeRulesButton');
const rules = document.getElementById('rules');
const overlay = document.getElementById('overlay');
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
function openModal(modal) {
  if (modal == null) return;
  modal.classList.add('active');
  overlay.classList.add('active');
}
function closeModal(modal) {
  if (modal == null) return;
  modal.classList.remove('active');
  overlay.classList.remove('active');
}
