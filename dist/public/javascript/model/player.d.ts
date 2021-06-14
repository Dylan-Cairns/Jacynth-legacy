import { Card, Decktet } from './decktet.js';
import { BoardSpace, GameBoard } from './gameboard.js';
export declare type SendCardDrawtoViewCB = (card: Card) => void;
export declare type SendCardPlaytoViewCB = (card: Card, spaceID: BoardSpace) => void;
export declare type SendTokenPlayToViewCB = (boardSpace: BoardSpace) => void;
export declare type PlayerID = 'Player1' | 'Player2' | 'Computer';
export declare class Player {
    protected playerID: PlayerID;
    protected hand: Card[];
    protected gameBoard: GameBoard;
    protected deck: Decktet;
    protected influenceTokens: number;
    protected sendCardPlaytoView: SendCardPlaytoViewCB | undefined;
    protected sendCardDrawtoView: SendCardDrawtoViewCB | undefined;
    protected sendTokenPlayToView: SendTokenPlayToViewCB | undefined;
    constructor(playerID: PlayerID, gameBoard: GameBoard, deck: Decktet);
    playCard: (spaceID: string, cardID: string) => boolean;
    undoPlayCard: (spaceID: string) => void;
    drawCard: () => void;
    drawStartingHand(): void;
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
export declare class ComputerPlayer extends Player {
    opponentID: PlayerID;
    constructor(playerID: PlayerID, gameBoard: GameBoard, deck: Decktet, opponentID: PlayerID);
    private getAllAvailableMoves;
    computerTakeTurn: () => void;
    private adjustMinThreshold;
    private filterAndSortTokenScoreResults;
}
