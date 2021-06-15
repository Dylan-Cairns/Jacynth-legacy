import { Socket } from 'socket.io-client';
import { Card, Decktet } from './decktet.js';
import { BoardSpace, GameBoard } from './gameboard.js';
export declare type SendCardDrawtoViewCB = (card: Card) => void;
export declare type SendCardPlaytoViewCB = (card: Card, boardSpace: BoardSpace) => void;
export declare type SendTokenPlayToViewCB = (boardSpace: BoardSpace) => void;
export declare type PlayerID = 'Player1' | 'Player2' | 'Computer';
export declare class Player {
    protected playerID: PlayerID;
    protected hand: Card[];
    protected gameBoard: GameBoard;
    protected influenceTokens: number;
    protected sendCardPlaytoView: SendCardPlaytoViewCB | undefined;
    protected sendCardDrawtoView: SendCardDrawtoViewCB | undefined;
    protected sendTokenPlayToView: SendTokenPlayToViewCB | undefined;
    constructor(playerID: PlayerID, gameBoard: GameBoard);
    playCard: (spaceID: string, cardID: string) => boolean;
    undoPlayCard: (spaceID: string) => void;
    getAvailableTokenSpaces: () => BoardSpace[];
    placeToken: (spaceID: string) => boolean;
    undoPlaceToken: (spaceID: string) => void;
    getInfluenceTokensNo: () => number;
    getCardFromHandByID(cardID: string): Card | undefined;
    getHandArr(): Card[];
    getHandSize(): number;
    getScore: () => number;
    bindSendCardPlayToView(sendCardPlaytoView: SendCardPlaytoViewCB): void;
    bindSendTokenPlayToView(sendTokenPlayToViewCB: SendTokenPlayToViewCB): void;
    bindDrawCard(sendCardDrawtoView: SendCardDrawtoViewCB): void;
}
export declare class Player_MultiPlayer extends Player {
    socket: Socket;
    constructor(playerID: PlayerID, gameBoard: GameBoard, socket: Socket);
    drawCard: () => void;
    drawStartingHand(): void;
}
export declare class Player_SinglePlayer extends Player {
    deck: Decktet;
    constructor(playerID: PlayerID, gameBoard: GameBoard, deck: Decktet);
    drawCard: () => void;
    drawStartingHand(): void;
}
export declare class Player_ComputerPlayer extends Player_SinglePlayer {
    opponentID: PlayerID;
    constructor(playerID: PlayerID, gameBoard: GameBoard, deck: Decktet, opponentID: PlayerID);
    private getAllAvailableMoves;
    computerTakeTurn: () => void;
    private adjustMinThreshold;
    private filterAndSortTokenScoreResults;
}
