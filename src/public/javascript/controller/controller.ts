import {
  GameModel,
  GameType,
  Layout,
  MultiplayerGameModel,
  SinglePlayerGameModel
} from '../model/model.js';
import { DeckType } from '../model/decktet.js';
import { PlayerID } from '../model/player.js';
import { MultiPlayerView, SinglePlayerView, View } from '../view/view.js';
import { io, Socket } from 'socket.io-client';

export class Controller {}

export class SinglePlayerController {
  model: SinglePlayerGameModel;
  view: SinglePlayerView;
  constructor(deckType: DeckType) {
    this.model = new SinglePlayerGameModel(deckType);

    this.view = new SinglePlayerView(this.model.board, 'Player 1');

    this.model.currPlyr.bindDrawCard(this.view.playerDrawCardCB);
    this.model.opposPlyr.bindSendCardPlayToView(
      this.view.nonPlayerCardPlacementCB
    );
    this.model.opposPlyr.bindSendTokenPlayToView(
      this.view.nonPlayerTokenPlacementCB
    );
    this.model.bindSendCardPlayToView(this.view.nonPlayerCardPlacementCB);

    this.view.bindGetAvailCardSpaces(this.model.board.getAvailableSpaces);
    this.view.bindGetAvailTokenSpaces(
      this.model.currPlyr.getAvailableTokenSpaces
    );
    this.view.bindSendCardPlayToModel(this.model.currPlyr.playCard);
    this.view.bindSendTokenPlayToModel(this.model.currPlyr.placeToken);
    this.view.bindUndoPlayCard(this.model.currPlyr.undoPlayCard);
    this.view.bindUndoPlaceToken(this.model.currPlyr.undoPlaceToken);
    this.view.bindComputerTakeTurn(this.model.opposPlyr.computerTakeTurn);
    this.view.bindGetCardDrawFromModel(this.model.currPlyr.drawCard);
    this.view.bindGetCurrPlyrAvailTokens(
      this.model.currPlyr.getInfluenceTokensNo
    );
    this.view.bindGetOpponAvailTokens(
      this.model.opposPlyr.getInfluenceTokensNo
    );
    this.view.bindGetCurrPlyrScore(this.model.currPlyr.getScore);
    this.view.bindGetOpponentScore(this.model.opposPlyr.getScore);
  }

  startGame(layout: Layout) {
    this.model.startGame(layout);
    this.view.enableCardHandDragging();
  }
}

export class MultiPlayerController {
  model: MultiplayerGameModel;
  view: View;
  currentPlayer: PlayerID;
  socket: Socket;
  constructor(deckType: DeckType, currentPlayer: PlayerID, socket: Socket) {
    this.currentPlayer = currentPlayer;
    this.socket = socket;
    this.model = new MultiplayerGameModel(deckType, socket, currentPlayer);

    this.view = new MultiPlayerView(this.model.board, socket, currentPlayer);

    this.model.currPlyr.bindDrawCard(this.view.playerDrawCardCB);
    this.model.opposPlyr.bindSendCardPlayToView(
      this.view.nonPlayerCardPlacementCB
    );
    this.model.opposPlyr.bindSendTokenPlayToView(
      this.view.nonPlayerTokenPlacementCB
    );
    this.model.bindSendCardPlayToView(this.view.nonPlayerCardPlacementCB);

    this.view.bindGetAvailCardSpaces(this.model.board.getAvailableSpaces);
    this.view.bindGetAvailTokenSpaces(
      this.model.currPlyr.getAvailableTokenSpaces
    );
    this.view.bindSendCardPlayToModel(this.model.currPlyr.playCard);
    this.view.bindSendTokenPlayToModel(this.model.currPlyr.placeToken);
    this.view.bindUndoPlayCard(this.model.currPlyr.undoPlayCard);
    this.view.bindUndoPlaceToken(this.model.currPlyr.undoPlaceToken);
    this.view.bindGetCardDrawFromModel(this.model.currPlyr.drawCard);
    this.view.bindGetCurrPlyrAvailTokens(
      this.model.currPlyr.getInfluenceTokensNo
    );
    this.view.bindGetOpponAvailTokens(
      this.model.opposPlyr.getInfluenceTokensNo
    );
    this.view.bindGetCurrPlyrScore(this.model.currPlyr.getScore);
    this.view.bindGetOpponentScore(this.model.opposPlyr.getScore);

    if (this.currentPlayer === 'Player 1')
      socket.emit('playerReady', currentPlayer);
  }
}
