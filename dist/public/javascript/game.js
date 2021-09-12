import { SinglePlayerController, MultiPlayerController } from './controller/controller.js';
import { MainMenuHandler, NickNameFormHandler } from './view/utils.js';
const nickNameFormHandler = new NickNameFormHandler(true, false);
const mainMenuHandler = new MainMenuHandler(false);
if (gameType === 'singleplayer') {
    const controller = new SinglePlayerController('basicDeck');
}
if (gameType === 'multiplayer') {
    const socket = io();
    let currPlyrID;
    socket.emit('getPlayerID', userID);
    socket.on('recievePlayerID', (playerID) => {
        currPlyrID = playerID;
        const controller = new MultiPlayerController('basicDeck', currPlyrID, socket);
    });
}
