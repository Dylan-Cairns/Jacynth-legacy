import { Layout, MultiplayerGameModel, SinglePlayerGameModel } from '../model/model.js';
import { DeckType } from '../model/decktet.js';
import { PlayerID } from '../model/player.js';
import { SinglePlayerView, View } from '../view/view.js';
import { Socket } from 'socket.io-client';
export declare class Controller {
}
export declare class SinglePlayerController {
    model: SinglePlayerGameModel;
    view: SinglePlayerView;
    constructor(layout: Layout, deckType: DeckType);
}
export declare class MultiPlayerController {
    model: MultiplayerGameModel;
    view: View;
    currentPlayer: PlayerID;
    socket: Socket;
    constructor(layout: Layout, deckType: DeckType, currentPlayer: PlayerID, socket: Socket);
}
