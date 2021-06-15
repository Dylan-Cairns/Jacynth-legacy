import {
  GameModel,
  GameType,
  Layout,
  MultiplayerGameModel,
  SinglePlayerGameModel
} from '../model/model.js';
import { DeckType } from '../model/decktet.js';
import { PlayerID } from '../model/player.js';
import { MultiPlayerView, View } from '../view/view.js';
import { io, Socket } from 'socket.io-client';

export class Controller {}

export class SinglePlayerController {
  model: SinglePlayerGameModel;
  view: View;
  constructor(gameType: GameType, layout: Layout, deckType: DeckType) {
    this.model = new SinglePlayerGameModel(gameType, layout, deckType);

    this.view = new View(this.model.board);

    this.model.player1.bindDrawCard(this.view.playerDrawCardCB);
    this.model.player2.bindSendCardPlayToView(
      this.view.nonPlayerCardPlacementCB
    );
    this.model.player2.bindSendTokenPlayToView(
      this.view.nonPlayerTokenPlacementCB
    );
    this.model.bindSendCardPlayToView(this.view.nonPlayerCardPlacementCB);

    this.view.bindGetAvailCardSpaces(this.model.board.getAvailableSpaces);
    this.view.bindGetAvailTokenSpaces(
      this.model.player1.getAvailableTokenSpaces
    );
    this.view.bindSendCardPlayToModel(this.model.player1.playCard);
    this.view.bindSendTokenPlayToModel(this.model.player1.placeToken);
    this.view.bindUndoPlayCard(this.model.player1.undoPlayCard);
    this.view.bindUndoPlaceToken(this.model.player1.undoPlaceToken);
    this.view.bindComputerTakeTurn(this.model.player2.computerTakeTurn);
    this.view.bindGetCardDrawFromModel(this.model.player1.drawCard);
    this.view.bindGetCurrPlyrAvailTokens(
      this.model.player1.getInfluenceTokensNo
    );
    this.view.bindGetOpponAvailTokens(this.model.player2.getInfluenceTokensNo);
    this.view.bindGetCurrPlyrScore(this.model.player1.getScore);
    this.view.bindGetOpponentScore(this.model.player2.getScore);

    this.model.createGame(layout);
  }
}

export class MultiPlayerController {
  model: MultiplayerGameModel;
  view: View;
  currentPlayer: PlayerID;
  socket: Socket;
  constructor(
    gameType: GameType,
    layout: Layout,
    deckType: DeckType,
    currentPlayer: PlayerID,
    socket: Socket
  ) {
    this.currentPlayer = currentPlayer;
    this.socket = socket;
    this.model = new MultiplayerGameModel(
      gameType,
      layout,
      deckType,
      socket,
      currentPlayer
    );

    this.view = new MultiPlayerView(this.model.board, this.socket);

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
    // this.view.bindComputerTakeTurn(this.model.player2.computerTakeTurn);
    this.view.bindGetCardDrawFromModel(this.model.currPlyr.drawCard);
    this.view.bindGetCurrPlyrAvailTokens(
      this.model.currPlyr.getInfluenceTokensNo
    );
    this.view.bindGetOpponAvailTokens(
      this.model.opposPlyr.getInfluenceTokensNo
    );
    this.view.bindGetCurrPlyrScore(this.model.currPlyr.getScore);
    this.view.bindGetOpponentScore(this.model.opposPlyr.getScore);

    // this.model.createGame(layout);
  }
}
