import { GameBoard } from './gameboard.js';
import { Decktet, DeckType } from './decktet.js';
import { PlayerID, Player_MultiPlayer, Player_SinglePlayer, Player_ComputerPlayer, SendCardPlaytoViewCB } from './player.js';
import { Socket } from 'socket.io-client';
export declare type GameType = 'multiPlayer' | 'singlePlayer' | 'solitaire';
export declare type Layout = 'razeway' | 'towers' | 'oldcity' | 'solitaire';
export declare const BOARD_LAYOUTS: {
    razeway: string[];
    towers: string[];
    oldcity: string[];
    solitaire: string[];
};
export declare class GameModel {
    board: GameBoard;
    deck: Decktet;
    sendCardPlaytoView: SendCardPlaytoViewCB | undefined;
    constructor(layout: Layout, deckType: DeckType);
    bindSendCardPlayToView(sendCardPlaytoView: SendCardPlaytoViewCB): void;
}
export declare class SinglePlayerGameModel extends GameModel {
    currPlyr: Player_SinglePlayer;
    opposPlyr: Player_ComputerPlayer;
    constructor(layout: Layout, deckType: DeckType);
    startGame(layout: Layout): void;
    private createLayout;
}
export declare class MultiplayerGameModel extends GameModel {
    socket: Socket;
    currPlyr: Player_MultiPlayer;
    opposPlyr: Player_MultiPlayer;
    constructor(layout: Layout, deckType: DeckType, socket: Socket, currPlyrID: PlayerID);
    drawStartingHands(): void;
}
