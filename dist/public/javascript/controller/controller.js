import { MultiplayerGameModel, SinglePlayerGameModel } from '../model/model.js';
import { MultiPlayerView, SinglePlayerView } from '../view/view.js';
export class Controller {
}
export class SinglePlayerController {
    constructor(layout, deckType) {
        this.model = new SinglePlayerGameModel(layout, deckType);
        this.view = new SinglePlayerView(this.model.board);
        this.model.currPlyr.bindDrawCard(this.view.playerDrawCardCB);
        this.model.opposPlyr.bindSendCardPlayToView(this.view.nonPlayerCardPlacementCB);
        this.model.opposPlyr.bindSendTokenPlayToView(this.view.nonPlayerTokenPlacementCB);
        this.model.bindSendCardPlayToView(this.view.nonPlayerCardPlacementCB);
        this.view.bindGetAvailCardSpaces(this.model.board.getAvailableSpaces);
        this.view.bindGetAvailTokenSpaces(this.model.currPlyr.getAvailableTokenSpaces);
        this.view.bindSendCardPlayToModel(this.model.currPlyr.playCard);
        this.view.bindSendTokenPlayToModel(this.model.currPlyr.placeToken);
        this.view.bindUndoPlayCard(this.model.currPlyr.undoPlayCard);
        this.view.bindUndoPlaceToken(this.model.currPlyr.undoPlaceToken);
        this.view.bindComputerTakeTurn(this.model.opposPlyr.computerTakeTurn);
        this.view.bindGetCardDrawFromModel(this.model.currPlyr.drawCard);
        this.view.bindGetCurrPlyrAvailTokens(this.model.currPlyr.getInfluenceTokensNo);
        this.view.bindGetOpponAvailTokens(this.model.opposPlyr.getInfluenceTokensNo);
        this.view.bindGetCurrPlyrScore(this.model.currPlyr.getScore);
        this.view.bindGetOpponentScore(this.model.opposPlyr.getScore);
        this.model.startGame(layout);
        this.view.enableCardHandDragging();
    }
}
export class MultiPlayerController {
    constructor(layout, deckType, currentPlayer, socket) {
        this.currentPlayer = currentPlayer;
        this.socket = socket;
        this.model = new MultiplayerGameModel(layout, deckType, socket, currentPlayer);
        this.view = new MultiPlayerView(this.model.board, socket, currentPlayer);
        this.model.currPlyr.bindDrawCard(this.view.playerDrawCardCB);
        this.model.opposPlyr.bindSendCardPlayToView(this.view.nonPlayerCardPlacementCB);
        this.model.opposPlyr.bindSendTokenPlayToView(this.view.nonPlayerTokenPlacementCB);
        this.model.bindSendCardPlayToView(this.view.nonPlayerCardPlacementCB);
        this.view.bindGetAvailCardSpaces(this.model.board.getAvailableSpaces);
        this.view.bindGetAvailTokenSpaces(this.model.currPlyr.getAvailableTokenSpaces);
        this.view.bindSendCardPlayToModel(this.model.currPlyr.playCard);
        this.view.bindSendTokenPlayToModel(this.model.currPlyr.placeToken);
        this.view.bindUndoPlayCard(this.model.currPlyr.undoPlayCard);
        this.view.bindUndoPlaceToken(this.model.currPlyr.undoPlaceToken);
        this.view.bindGetCardDrawFromModel(this.model.currPlyr.drawCard);
        this.view.bindGetCurrPlyrAvailTokens(this.model.currPlyr.getInfluenceTokensNo);
        this.view.bindGetOpponAvailTokens(this.model.opposPlyr.getInfluenceTokensNo);
        this.view.bindGetCurrPlyrScore(this.model.currPlyr.getScore);
        this.view.bindGetOpponentScore(this.model.opposPlyr.getScore);
        socket.emit('playerReady', currentPlayer);
    }
}
