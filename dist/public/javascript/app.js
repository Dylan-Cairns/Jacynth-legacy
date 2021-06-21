import { SinglePlayerController, MultiPlayerController } from './controller/controller.js';
let controller;
if (gameType === 'singleplayer') {
    controller = new SinglePlayerController('basicDeck');
}
if (gameType === 'multiplayer') {
    const socket = io();
    let currPlyrID;
    socket.emit('getPlayerID');
    socket.on('recievePlayerID', (playerID) => {
        console.log('recieved player id', playerID);
        currPlyrID = playerID;
        const controller = new MultiPlayerController('basicDeck', currPlyrID, socket);
    });
}
