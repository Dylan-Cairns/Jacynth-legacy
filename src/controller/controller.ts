import { Model, GameType, Layout } from '../model/model.js';
import { Card } from '../model/decktet.js';
import { View } from '../view/view.js';
import { BoardSpace } from '../model/gameboard.js';
import { PlayerType } from '../model/player.js';

export class Controller {
  model: Model;
  view: View;

  constructor(gameType: GameType, layout: Layout) {
    this.model = new Model('vsAI', 'razeway');
    this.view = new View(this.model.board);
    if (gameType === 'vsAI') {
      this.model.vsAI(this.handlePlayCard, this.handleDrawCard);
    }
  }

  handlePlayCard = (
    playerID: PlayerType,
    card: Card,
    boardSpace: BoardSpace
  ) => {
    console.log('play card method called');
    if (playerID === 'computerPlayer') {
      this.view.computerPlayCard(card, boardSpace);
    }
  };

  handleDrawCard = (card: Card) => {
    console.log(`controller handleDrawCard method called`);
    this.view.playerDrawCard(card);
  };
}
