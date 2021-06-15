import { BoardSpace, GameBoard } from '../model/gameboard.js';
import { Card } from '../model/decktet.js';
import { Socket } from 'socket.io-client';
export declare class View {
    app: Element;
    gameBoard: HTMLElement;
    playerHandContainer: HTMLElement;
    influenceTokenContainer: HTMLElement;
    undoButton: HTMLButtonElement;
    endTurnButton: HTMLButtonElement;
    player1HUD: HTMLElement;
    player2HUD: HTMLElement;
    player1Icon: HTMLElement;
    player2Icon: HTMLElement;
    pickupSound: HTMLMediaElement;
    dropSound: HTMLMediaElement;
    clickSound: HTMLMediaElement;
    draggedElement: HTMLElement | undefined;
    undoMovesArr: {
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
    getP1AvailableTokensNumber: (() => number) | undefined;
    getP2AvailableTokensNumber: (() => number) | undefined;
    getPlayer1Score: (() => void) | undefined;
    getPlayer2Score: (() => void) | undefined;
    constructor(board: GameBoard);
    endTurnButtonCB: () => void;
    createElement(tag: string, ...classNames: string[]): HTMLElement;
    createBoardSpaces(board: GameBoard): void;
    protected createCard: (card: Card) => HTMLElement;
    protected updateHUD(): void;
    protected addInfluenceTokenToHand(): void;
    protected enableCardHandDragging(): void;
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
    bindGetP1AvailableTokens(availTokensCB: () => number): void;
    bindGetP2AvailableTokens(availTokensCB: () => number): void;
    bindGetPlayer1Score(getPlayer1ScoreCB: () => void): void;
    bindGetPlayer2Score(getPlayer2ScoreCB: () => void): void;
}
export declare class SinglePlayerView extends View {
    constructor(board: GameBoard);
}
export declare class MultiPlayerView extends View {
    socket: Socket;
    constructor(board: GameBoard, socket: Socket);
    endTurnButtonCB: () => void;
}
