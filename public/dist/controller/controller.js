import { Model } from '../model/model.js';
import { View } from '../view/view.js';
export class Controller {
    constructor(gameType, layout, deckType) {
        this.model = new Model(gameType, layout, deckType);
        this.view = new View(this.model.board);
        this.model.player1.bindDrawCard(this.view.playerDrawCard);
        this.model.player2.bindSendCardPlayToView(this.view.nonPlayerCardPlacement);
        this.model.bindSendCardPlayToView(this.view.nonPlayerCardPlacement);
        this.view.bindPlayerInterface(this.model.board.getAvailableSpaces, this.model.player1.getAvailableTokenSpaces, this.model.player1.playCard, this.model.player1.placeToken, this.model.player1.undoPlayCard, this.model.player1.undoPlaceToken);
        this.model.createGame();
    }
}
