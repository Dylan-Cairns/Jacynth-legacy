import { GameBoard } from './gameboard.js';
import { Decktet, DeckType } from './decktet.js';
import { Player, ComputerPlayer, SendCardPlaytoViewCB } from './player.js';
export declare type GameType = 'vsAI' | 'solitaire';
export declare type Layout = 'razeway' | 'towers' | 'oldcity' | 'solitaire';
export declare class Model {
    board: GameBoard;
    deck: Decktet;
    player1: Player;
    player2: ComputerPlayer;
    sendCardPlaytoView: SendCardPlaytoViewCB | undefined;
    constructor(gameType: GameType, layout: Layout, deckType: DeckType);
    createGame(layout: Layout): void;
    bindSendCardPlayToView(sendCardPlaytoView: SendCardPlaytoViewCB): void;
    private createLayout;
}
