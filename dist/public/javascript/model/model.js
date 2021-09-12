var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GameBoard } from './gameboard.js';
import { Decktet } from './decktet.js';
import { Player_MultiPlayer, Player_SinglePlayer, Player_ComputerPlayer } from './player.js';
export const BOARD_LAYOUTS = {
    razeway: ['x0y0', 'x1y1', 'x2y2', 'x3y3', 'x4y4', 'x5y5'],
    towers: ['x1y1', 'x4y1', 'x1y4', 'x4y4'],
    oldcity: ['x2y0', 'x4y1', 'x0y2', 'x5y3', 'x1y4', 'x3y5'],
    solitaire: ['x0y0', 'x0y3', 'x0y3', 'x3y3']
};
const SOLITAIRE_BOARD_DIMENSIONS = 4;
const TWOPLAYER_BOARD_DIMENSIONS = 6;
export class GameModel {
    constructor(deckType, gameType) {
        this.board = new GameBoard(TWOPLAYER_BOARD_DIMENSIONS);
        this.deck = new Decktet(deckType);
        this.gameType = gameType;
    }
    bindSendCardPlayToView(sendCardPlaytoView) {
        this.sendCardPlaytoView = sendCardPlaytoView;
    }
    bindSendTokenPlayToView(sendTokenPlayToView) {
        this.sendTokenPlaytoView = sendTokenPlayToView;
    }
}
export class SinglePlayerGameModel extends GameModel {
    constructor(deckType, gameType) {
        super(deckType, gameType);
        this.resetStorage = () => {
            localStorage.removeItem('layout');
            localStorage.removeItem('playedCards');
            localStorage.removeItem('movesArr');
            localStorage.removeItem('undoMoves');
            localStorage.removeItem('turnStatus');
            localStorage.removeItem(`Player 1-hand`);
            localStorage.removeItem(`Computer-hand`);
        };
        this.addRecordtoDB = () => __awaiter(this, void 0, void 0, function* () {
            // user1 ID will either be guest or authenticated user ID.
            // that determination is handled server side,
            // so user1ID is not added here.
            const gameResults = {
                user1Score: this.currPlyr.getScore(),
                user2ID: this.opposPlyr.aiDifficulty,
                user2Score: this.opposPlyr.getScore(),
                layout: this.layout
            };
            (() => __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield fetch('/rest/storeSPGameResult', {
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json'
                        },
                        method: 'post',
                        body: JSON.stringify(gameResults)
                    });
                    const message = yield response;
                    console.log(message);
                }
                catch (error) {
                    console.log(error);
                }
            }))();
        });
        this.currPlyr = new Player_SinglePlayer('Player 1', gameType, this.board, this.deck);
        this.opposPlyr = new Player_ComputerPlayer('Computer', gameType, this.board, this.deck, 'Player 1', this.currPlyr.getInfluenceTokensNo, this.currPlyr.placeToken, this.currPlyr.undoPlaceToken);
    }
    startGame(layout, aiDifficulty = 'easyAI') {
        this.createLayout(this.deck, layout);
        this.currPlyr.drawStartingHand();
        this.opposPlyr.drawStartingHand();
        this.opposPlyr.aiDifficulty = aiDifficulty;
    }
    restoreGame() {
        this.restoreLayout();
        this.restorePlayedMoves();
        this.currPlyr.restoreHand();
        this.opposPlyr.restoreHand();
        this.opposPlyr.aiDifficulty = localStorage.getItem('difficulty');
        this.deck.restoreDeck(this.currPlyr.playerID, this.opposPlyr.playerID);
        this.board.resolveInflunceForEntireBoard();
    }
    restorePlayedMoves() {
        // check if local save data exists. If so, add the cards and tokens
        // to the board in the same order as originally played.
        const movesJSON = localStorage.getItem('movesArr');
        if (movesJSON) {
            const movesArr = JSON.parse(movesJSON);
            for (let idx = 0; idx < movesArr.length; idx++) {
                const obj = movesArr[idx];
                if (obj.cardToPlay) {
                    const card = this.deck.getCardByID(obj.cardToPlay);
                    const space = this.board.getSpace(obj.spaceToPlaceCard);
                    this.board.setCard(obj.spaceToPlaceCard, card);
                    if (this.sendCardPlaytoView)
                        this.sendCardPlaytoView(card, space);
                }
                else if (obj.spaceToPlaceToken) {
                    const space = this.board.getSpace(obj.spaceToPlaceToken);
                    if (this.currPlyr.playerID === obj.playerID) {
                        this.currPlyr.restoreTokenPlay(obj.spaceToPlaceToken);
                    }
                    else {
                        this.opposPlyr.restoreTokenPlay(obj.spaceToPlaceToken);
                    }
                    if (this.sendTokenPlaytoView)
                        this.sendTokenPlaytoView(space, obj.playerID);
                }
            }
        }
    }
    createLayout(deck, layout) {
        this.layout = layout;
        const layoutStorArr = [];
        const handleInitialPlacementCB = (spaceID) => {
            const card = deck.drawCard();
            const space = this.board.getSpace(spaceID);
            this.board.setCard(spaceID, card);
            if (this.sendCardPlaytoView)
                this.sendCardPlaytoView(card, space);
            // add card info to array which will be saved in local storage
            layoutStorArr.push({ cardID: card.getId(), spaceID: spaceID });
        };
        const layoutArr = BOARD_LAYOUTS[layout];
        layoutArr.forEach((spaceID) => handleInitialPlacementCB(spaceID));
        //save layout info to local storage
        localStorage.setItem('layout', JSON.stringify(layoutStorArr));
    }
    restoreLayout() {
        // check for stored layout info
        const layoutJSON = localStorage.getItem('layout');
        this.layout = localStorage.getItem('layoutChoice');
        if (layoutJSON) {
            const layoutArr = JSON.parse(layoutJSON);
            layoutArr.forEach((obj) => {
                const card = this.deck.getCardByID(obj.cardID);
                const space = this.board.getSpace(obj.spaceID);
                this.board.setCard(obj.spaceID, card);
                if (this.sendCardPlaytoView)
                    this.sendCardPlaytoView(card, space);
            });
        }
    }
}
export class MultiplayerGameModel extends GameModel {
    constructor(deckType, gameType, socket, currPlyrID) {
        super(deckType, gameType);
        this.createLayout = (layout) => {
            this.layout = layout;
            const layoutArr = BOARD_LAYOUTS[layout];
            this.socket.emit('createStartingLayout', layout, layoutArr);
            this.socket.emit('playerReady', 'Player 2');
        };
        this.addRecordtoDB = () => __awaiter(this, void 0, void 0, function* () {
            // user IDs are added server side.
            const player1Score = this.currPlyr.getScore();
            const player2Score = this.opposPlyr.getScore();
            console.log('add record to DB request sent');
            this.socket.emit('addRecordtoDB', player1Score, player2Score);
        });
        this.socket = socket;
        socket.on('recieveLayoutCard', (cardID, spaceID) => {
            const space = this.board.getSpace(spaceID);
            if (!cardID || !space)
                return;
            const card = this.deck.getCardByID(cardID);
            if (!card)
                return;
            this.board.setCard(spaceID, card);
            if (this.sendCardPlaytoView)
                this.sendCardPlaytoView(card, space);
        });
        this.currPlyr = new Player_MultiPlayer(currPlyrID, gameType, this.board, this.deck, this.socket);
        const opposingPlyr = currPlyrID === 'Player 1' ? 'Player 2' : 'Player 1';
        this.opposPlyr = new Player_MultiPlayer(opposingPlyr, gameType, this.board, this.deck, this.socket);
    }
}
