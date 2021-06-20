import { SinglePlayerController, MultiPlayerController } from './controller/controller.js';
// page menu buttons
const menuButton = document.getElementById('menuButton');
const closeMenuButton = document.getElementById('closeMenuButton');
const menu = document.getElementById('menu-popup');
const rulesButton = document.getElementById('rulesButton');
const closeRulesButton = document.getElementById('closeRulesButton');
const rules = document.getElementById('rules');
const overlay = document.getElementById('overlay');
const chooseLayout = document.getElementById('chooseLayout');
const layoutButtons = document.querySelectorAll('.layoutButton');
if (gameType === 'singleplayer') {
    chooseLayout.classList.add('active');
}
if (gameType === 'multiplayer') {
    const socket = io();
    let currPlyrID;
    socket.emit('getPlayerID');
    socket.on('recievePlayerID', (playerID) => {
        console.log('recieved player id', playerID);
        currPlyrID = playerID;
        if (currPlyrID === 'Player 2')
            chooseLayout.classList.add('active');
    });
    socket.on('beginGame', (layout) => {
        if (!currPlyrID)
            return;
        const controller = new MultiPlayerController(layout, 'basicDeck', currPlyrID, socket);
    });
}
layoutButtons.forEach((button) => {
    button.addEventListener('click', () => {
        chooseLayout.classList.remove('active');
        const layout = button.dataset.layout;
        if (!layout)
            return;
        if (gameType === 'singleplayer') {
            const controller = new SinglePlayerController(layout, 'basicDeck');
        }
        else {
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
function openModal(modal) {
    if (modal == null)
        return;
    modal.classList.add('active');
    overlay.classList.add('active');
}
function closeModal(modal) {
    if (modal == null)
        return;
    modal.classList.remove('active');
    overlay.classList.remove('active');
}
