import { SinglePlayerController, MultiPlayerController } from './controller/controller.js';
const chooseLayoutOverlay = document.getElementById('chooseLayoutOverlay');
const chooseLayout = document.getElementById('chooseLayout');
const layoutButtons = document.querySelectorAll('.layoutButton');
let controller;
if (gameType === 'singleplayer') {
    controller = new SinglePlayerController('basicDeck');
    chooseLayout.classList.add('active');
    chooseLayoutOverlay.classList.add('active');
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
        const controller = new MultiPlayerController('basicDeck', currPlyrID, socket);
    });
}
layoutButtons.forEach((button) => {
    button.addEventListener('click', () => {
        chooseLayout.classList.remove('active');
        chooseLayoutOverlay.classList.remove('active');
        const layoutChoice = button.dataset.layout;
        if (!layoutChoice)
            return;
        if (gameType === 'singleplayer') {
            controller.startGame(layoutChoice);
        }
        else {
            socket.emit('chooseLayout', layoutChoice);
        }
    });
});
