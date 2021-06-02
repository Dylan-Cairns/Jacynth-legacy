"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(id, gameBoard, deck) {
        this.id = id;
        this.gameBoard = gameBoard;
        this.deck = deck;
        this.hand = [];
        const HAND_SIZE = 3;
        for (let i = 0; i < HAND_SIZE; i++) {
            this.hand.push(this.deck.drawCard());
        }
    }
    playCard(spaceID, card) {
        if (this.gameBoard.setCard(spaceID, card))
            return false;
    }
}
exports.Player = Player;
