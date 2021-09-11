import { SinglePlayerController, MultiPlayerController } from './controller/controller.js';
import { MainMenuHandler, NickNameFormHandler } from './view/utils.js';
const nickNameFormHandler = new NickNameFormHandler(true);
const mainMenuHandler = new MainMenuHandler(false, false);
if (gameType === 'singleplayer') {
    const controller = new SinglePlayerController('basicDeck');
}
if (gameType === 'multiplayer') {
    const socket = io();
    let currPlyrID;
    socket.emit('getPlayerID');
    socket.on('recievePlayerID', (playerID) => {
        currPlyrID = playerID;
        const controller = new MultiPlayerController('basicDeck', currPlyrID, socket);
    });
}
