import { Model, GameType, Layout } from '../model/model.js';
import { Card, DeckType } from '../model/decktet.js';
import { View } from '../view/view.js';
import { BoardSpace } from '../model/gameboard.js';
import { PlayerID } from '../model/player.js';

export class Controller {
  model: Model;
  view: View;

  constructor(gameType: GameType, layout: Layout, deckType: DeckType) {
    this.model = new Model(gameType, layout, deckType);
    this.view = new View(this.model.board);

    this.model.player1.bindDrawCard(this.view.playerDrawCard);
    this.model.player2.bindSendCardPlayToView(this.view.nonPlayerCardPlacement);
    this.model.bindSendCardPlayToView(this.view.nonPlayerCardPlacement);

    this.view.bindPlayerInterface(
      this.model.board.getAvailableSpaces,
      this.model.player1.getAvailableTokenSpaces,
      this.model.player1.playCard,
      this.model.player1.placeToken,
      this.model.player1.undoPlayCard,
      this.model.player1.undoPlaceToken
    );

    this.model.createGame();
  }
}
