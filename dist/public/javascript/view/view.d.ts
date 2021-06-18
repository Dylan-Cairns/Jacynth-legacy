import { BoardSpace, GameBoard } from '../model/gameboard.js';
import { Card } from '../model/decktet.js';
import { PlayerID } from '../model/player.js';
import { Socket } from 'socket.io-client';
export declare class View {
    app: Element;
    gameBoard: HTMLElement;
    playerHandContainer: HTMLElement;
    influenceTokenContainer: HTMLElement;
    undoButton: HTMLButtonElement;
    endTurnButton: HTMLButtonElement;
    currPlyrHUD: HTMLElement;
    opponentHUD: HTMLElement;
    currPlyrIcon: HTMLElement;
    opponentIcon: HTMLElement;
    pickupSound: HTMLMediaElement;
    dropSound: HTMLMediaElement;
    clickSound: HTMLMediaElement;
    draggedElement: HTMLElement | undefined;
    movesArr: {
        draggedEle: HTMLElement;
        targetSpace: HTMLElement;
    }[];
    getAvailCardSpaces: (() => BoardSpace[]) | undefined;
    getAvailTokenSpaces: (() => BoardSpace[]) | undefined;
    sendCardPlayToModel: ((cardID: string, spaceID: string) => boolean) | undefined;
    sendTokenPlayToModel: ((spaceID: string) => boolean) | undefined;
    undoPlayCard: ((spaceID: string) => void) | undefined;
    undoPlaceToken: ((spaceID: string) => void) | undefined;
    computerTakeTurn: (() => void) | undefined;
    getCardDrawFromModel: (() => void) | undefined;
    getCurrPlyrAvailTokens: (() => number) | undefined;
    getOpponAvailTokens: (() => number) | undefined;
    getCurrPlyrScore: (() => void) | undefined;
    getOpponentScore: (() => void) | undefined;
    constructor(board: GameBoard);
    createElement(tag: string, ...classNames: string[]): HTMLElement;
    createBoardSpaces(board: GameBoard): void;
    protected createCard: (card: Card) => HTMLElement;
    protected updateHUD(): void;
    protected addInfluenceTokenToHand(): void;
    enableCardHandDragging(): void;
    protected disableAllCardDragging(): void;
    protected enableTokenDragging(): void;
    protected disableAllTokenDragging(): void;
    protected addCardToSpace: (cardDiv: HTMLElement, spaceID: string) => void;
    protected highlightAvailableSpaces: (getAvailableSpacesCallback: () => BoardSpace[]) => void;
    protected prepareValueForDisplay(value: number): string;
    playerDrawCardCB: (card: Card) => void;
    nonPlayerCardPlacementCB: (card: Card, boardSpace: BoardSpace) => void;
    nonPlayerTokenPlacementCB: (boardSpace: BoardSpace) => void;
    bindGetAvailCardSpaces(availCardSpacesCB: () => BoardSpace[]): void;
    bindGetAvailTokenSpaces(availTokenSpacesCB: () => BoardSpace[]): void;
    bindSendCardPlayToModel(sendCardPlayToModelCB: (cardID: string, spaceID: string) => boolean): void;
    bindSendTokenPlayToModel(sendTokenPlaytoModelCB: (spaceID: string) => boolean): void;
    bindUndoPlayCard(undoPlayCardCB: (spaceID: string) => void): void;
    bindUndoPlaceToken(undoPlaceTokenCB: (spaceID: string) => void): void;
    bindComputerTakeTurn(computerTurnCB: () => void): void;
    bindGetCardDrawFromModel(drawCardCB: () => void): void;
    bindGetCurrPlyrAvailTokens(availTokensCB: () => number): void;
    bindGetOpponAvailTokens(availTokensCB: () => number): void;
    bindGetCurrPlyrScore(getCurrPlyrScoreCB: () => void): void;
    bindGetOpponentScore(getOpponentScoreCB: () => void): void;
}
export declare class SinglePlayerView extends View {
    constructor(board: GameBoard);
    endTurnButtonCB(): void;
}
export declare class MultiPlayerView extends View {
    socket: Socket;
    currPlyrID: PlayerID;
    roomNumber: HTMLElement;
    constructor(board: GameBoard, socket: Socket, currPlyrID: PlayerID);
    endTurnButtonCB: () => void;
    sendMoveToOpponent(): void;
}
