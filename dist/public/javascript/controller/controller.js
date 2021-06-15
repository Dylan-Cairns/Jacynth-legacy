import { SinglePlayerGameModel } from '../model/model.js';
import { View } from '../view/view.js';
export class Controller {
}
export class SinglePlayerController {
    constructor(gameType, layout, deckType) {
        this.model = new SinglePlayerGameModel(gameType, layout, deckType);
        this.view = new View(this.model.board);
        this.model.player1.bindDrawCard(this.view.playerDrawCardCB);
        this.model.player2.bindSendCardPlayToView(this.view.nonPlayerCardPlacementCB);
        this.model.player2.bindSendTokenPlayToView(this.view.nonPlayerTokenPlacementCB);
        this.model.bindSendCardPlayToView(this.view.nonPlayerCardPlacementCB);
        this.view.bindGetAvailCardSpaces(this.model.board.getAvailableSpaces);
        this.view.bindGetAvailTokenSpaces(this.model.player1.getAvailableTokenSpaces);
        this.view.bindSendCardPlayToModel(this.model.player1.playCard);
        this.view.bindSendTokenPlayToModel(this.model.player1.placeToken);
        this.view.bindUndoPlayCard(this.model.player1.undoPlayCard);
        this.view.bindUndoPlaceToken(this.model.player1.undoPlaceToken);
        this.view.bindComputerTakeTurn(this.model.player2.computerTakeTurn);
        this.view.bindGetCardDrawFromModel(this.model.player1.drawCard);
        this.view.bindGetP1AvailableTokens(this.model.player1.getInfluenceTokensNo);
        this.view.bindGetP2AvailableTokens(this.model.player2.getInfluenceTokensNo);
        this.view.bindGetPlayer1Score(this.model.player1.getScore);
        this.view.bindGetPlayer2Score(this.model.player2.getScore);
        this.model.createGame(layout);
    }
}
export class MultiPlayerController {
    constructor(gameType, layout, deckType) {
        this.model = new SinglePlayerGameModel(gameType, layout, deckType);
        this.view = new View(this.model.board);
        this.model.player1.bindDrawCard(this.view.playerDrawCardCB);
        this.model.player2.bindSendCardPlayToView(this.view.nonPlayerCardPlacementCB);
        this.model.player2.bindSendTokenPlayToView(this.view.nonPlayerTokenPlacementCB);
        this.model.bindSendCardPlayToView(this.view.nonPlayerCardPlacementCB);
        this.view.bindGetAvailCardSpaces(this.model.board.getAvailableSpaces);
        this.view.bindGetAvailTokenSpaces(this.model.player1.getAvailableTokenSpaces);
        this.view.bindSendCardPlayToModel(this.model.player1.playCard);
        this.view.bindSendTokenPlayToModel(this.model.player1.placeToken);
        this.view.bindUndoPlayCard(this.model.player1.undoPlayCard);
        this.view.bindUndoPlaceToken(this.model.player1.undoPlaceToken);
        this.view.bindComputerTakeTurn(this.model.player2.computerTakeTurn);
        this.view.bindGetCardDrawFromModel(this.model.player1.drawCard);
        this.view.bindGetP1AvailableTokens(this.model.player1.getInfluenceTokensNo);
        this.view.bindGetP2AvailableTokens(this.model.player2.getInfluenceTokensNo);
        this.view.bindGetPlayer1Score(this.model.player1.getScore);
        this.view.bindGetPlayer2Score(this.model.player2.getScore);
        this.model.createGame(layout);
    }
}
