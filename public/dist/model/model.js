import { GameBoard } from './gameboard.js';
import { Decktet } from './decktet.js';
import { Player, ComputerPlayer } from './player.js';
const SOLITAIRE_BOARD_DIMENSIONS = 4;
const TWOPLAYER_BOARD_DIMENSIONS = 6;
const BOARD_LAYOUTS = {
    razeway: ['x0y0', 'x1y1', 'x2y2', 'x3y3', 'x4y4', 'x5y5'],
    towers: ['x1y1', 'x4y1', 'x1y4', 'x4y4'],
    oldcity: ['x3y0', 'x4y1', 'x0y3', 'x5y3', 'x1y4', 'x3y5'],
    solitaire: ['x0y0', 'x0y3', 'x0y3', 'x3y3']
};
export class Model {
    constructor(gameType, layout, deckType) {
        const dimensions = layout === 'solitaire'
            ? SOLITAIRE_BOARD_DIMENSIONS
            : TWOPLAYER_BOARD_DIMENSIONS;
        this.deck = new Decktet(deckType);
        this.board = new GameBoard(dimensions);
        this.player1 = new Player('Player1', this.board, this.deck);
        this.player2 = new ComputerPlayer('Computer', this.board, this.deck, 'Player1');
    }
    createGame() {
        this.createLayout(this.board, this.deck, 'razeway');
        this.player1.drawStartingHand();
        this.player2.drawStartingHand();
    }
    bindSendCardPlayToView(sendCardPlaytoView) {
        this.sendCardPlaytoView = sendCardPlaytoView;
    }
    createLayout(board, deck, layout) {
        const handleInitialPlacement = (spaceID) => {
            const card = deck.drawCard();
            const space = this.board.getSpace(spaceID);
            board.setCard(spaceID, card);
            if (this.sendCardPlaytoView)
                this.sendCardPlaytoView(card, space);
        };
        switch (layout) {
            case 'razeway':
                BOARD_LAYOUTS.razeway.forEach((spaceID) => handleInitialPlacement(spaceID));
                break;
            case 'towers':
                BOARD_LAYOUTS.towers.forEach((spaceID) => handleInitialPlacement(spaceID));
                break;
            case 'oldcity':
                BOARD_LAYOUTS.oldcity.forEach((spaceID) => handleInitialPlacement(spaceID));
                break;
            case 'solitaire':
                BOARD_LAYOUTS.solitaire.forEach((spaceID) => handleInitialPlacement(spaceID));
                break;
        }
    }
}
