import { GameBoard } from './gameboard.js';
import { Decktet } from './decktet.js';
import { Player_MultiPlayer, Player_SinglePlayer, Player_ComputerPlayer } from './player.js';
const SOLITAIRE_BOARD_DIMENSIONS = 4;
const TWOPLAYER_BOARD_DIMENSIONS = 6;
const BOARD_LAYOUTS = {
    razeway: ['x0y0', 'x1y1', 'x2y2', 'x3y3', 'x4y4', 'x5y5'],
    towers: ['x1y1', 'x4y1', 'x1y4', 'x4y4'],
    oldcity: ['x2y0', 'x4y1', 'x0y2', 'x5y3', 'x1y4', 'x3y5'],
    solitaire: ['x0y0', 'x0y3', 'x0y3', 'x3y3']
};
export class GameModel {
    constructor(gameType, layout, deckType) {
        const dimensions = layout === 'solitaire'
            ? SOLITAIRE_BOARD_DIMENSIONS
            : TWOPLAYER_BOARD_DIMENSIONS;
        this.board = new GameBoard(dimensions);
    }
    bindSendCardPlayToView(sendCardPlaytoView) {
        this.sendCardPlaytoView = sendCardPlaytoView;
    }
}
export class SinglePlayerGameModel extends GameModel {
    constructor(gameType, layout, deckType) {
        super(gameType, layout, deckType);
        this.deck = new Decktet(deckType);
        this.player1 = new Player_SinglePlayer('Player1', this.board, this.deck);
        this.player2 = new Player_ComputerPlayer('Computer', this.board, this.deck, 'Player1');
    }
    createGame(layout) {
        this.createLayout(this.board, this.deck, layout);
        this.player1.drawStartingHand();
        this.player2.drawStartingHand();
    }
    createLayout(board, deck, layout) {
        const handleInitialPlacement = (spaceID) => {
            const card = deck.drawCard();
            console.log('card', card);
            const space = this.board.getSpace(spaceID);
            board.setCard(spaceID, card);
            console.log('boardspace', space);
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
export class MultiplayerGameModel extends GameModel {
    constructor(gameType, layout, deckType, socket) {
        super(gameType, layout, deckType);
        this.socket = socket;
        this.initialCards = [];
        const dimensions = layout === 'solitaire'
            ? SOLITAIRE_BOARD_DIMENSIONS
            : TWOPLAYER_BOARD_DIMENSIONS;
        this.board = new GameBoard(dimensions);
        socket.on('recieveInitialCard', (newCard) => {
            if (newCard) {
                this.initialCards.push(newCard);
            }
        });
        this.player1 = new Player_MultiPlayer('Player1', this.board, this.socket);
        this.player2 = new Player_MultiPlayer('Player2', this.board, this.socket);
        this.createGame(layout);
    }
    createGame(layout) {
        this.player1.drawStartingHand();
        this.player2.drawStartingHand();
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
