import { Model } from '../model/model.js';
import { View } from '../view/view.js';
export class Controller {
    constructor(gameType, layout, deckType) {
        this.model = new Model(gameType, layout, deckType);
        this.view = new View(this.model.board);
        this.model.player1.bindDrawCard(this.view.playerDrawCard);
        this.model.player2.bindSendCardPlayToView(this.view.nonPlayerCardPlacementCB);
        this.model.bindSendCardPlayToView(this.view.nonPlayerCardPlacementCB);
        this.view.bindGetAvailCardSpaces(this.model.board.getAvailableSpaces);
        this.view.bindGetAvailTokenSpaces(this.model.player1.getAvailableTokenSpaces);
        this.view.bindSendCardPlayToModel(this.model.player1.playCard);
        this.view.bindSendTokenPlayToModel(this.model.player1.placeToken);
        this.view.bindUndoPlayCard(this.model.player1.undoPlayCard);
        this.view.bindUndoPlaceToken(this.model.player1.undoPlaceToken);
        this.model.createGame();
    }
}
