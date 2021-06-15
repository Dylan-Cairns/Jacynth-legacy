import { GameBoard } from './gameboard.js';
import { Card, Decktet, DeckType } from './decktet.js';
import { Player_MultiPlayer, Player_SinglePlayer, Player_ComputerPlayer, SendCardPlaytoViewCB } from './player.js';
import { Socket } from 'socket.io-client';
export declare type GameType = 'multiPlayer' | 'singlePlayer' | 'solitaire';
export declare type Layout = 'razeway' | 'towers' | 'oldcity' | 'solitaire';
export declare class Game {
    board: GameBoard;
    sendCardPlaytoView: SendCardPlaytoViewCB | undefined;
    constructor(gameType: GameType, layout: Layout, deckType: DeckType);
    bindSendCardPlayToView(sendCardPlaytoView: SendCardPlaytoViewCB): void;
}
export declare class SinglePlayerGameModel extends Game {
    deck: Decktet;
    player1: Player_SinglePlayer;
    player2: Player_ComputerPlayer;
    constructor(gameType: GameType, layout: Layout, deckType: DeckType);
    createGame(layout: Layout): void;
    private createLayout;
}
export declare class MultiplayerGameModel extends Game {
    socket: Socket;
    player1: Player_MultiPlayer;
    player2: Player_MultiPlayer;
    initialCards: Card[];
    constructor(gameType: GameType, layout: Layout, deckType: DeckType, socket: Socket);
    private createGame;
    createLayout(board: GameBoard, deck: Decktet, layout: Layout): void;
}
