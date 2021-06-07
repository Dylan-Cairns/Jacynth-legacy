import { Model, GameType, Layout } from '../model/model.js';
import { Card, Decktet } from '../model/decktet.js';
import { View } from '../view/view.js';
import { BoardSpace } from '../model/gameboard.js';
import { Player, PlayerType } from '../model/player.js';

export class Controller {
  model: Model;
  view: View;

  constructor(gameType: GameType, layout: Layout) {
    this.model = new Model(
      'vsAI',
      'razeway',
      this.handlePlayCard,
      this.handleDrawCard
    );
    this.view = new View(this.model.board);
  }

  handlePlayCard(playerID: PlayerType, card: Card, boardSpace: BoardSpace) {
    if (playerID === 'computerPlayer') {
      this.view.computerPlayCard(card, boardSpace);
    }
  }

  handleDrawCard(card: Card) {
    this.view.playerDrawCard(card);
  }
}
