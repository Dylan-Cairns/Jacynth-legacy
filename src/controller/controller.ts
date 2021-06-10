import { Model, GameType, Layout } from '../model/model.js';
import { Card, DeckType } from '../model/decktet.js';
import { View } from '../view/view.js';
import { BoardSpace } from '../model/gameboard.js';
import { PlayerType } from '../model/player.js';

export class Controller {
  model: Model;
  view: View;

  constructor(gameType: GameType, layout: Layout, deckType: DeckType) {
    this.model = new Model(gameType, layout, deckType);
    this.view = new View(this.model.board);

    // bind availtokens callback to playerID
    const availTokensCallBack = this.createBoundAvailTokensCallBack(
      this.model.board.getAvailableTokenSpaces,
      'humanPlayer1'
    );

    this.view.bindPlayerInterface(
      this.model.board.getAvailableSpaces,
      availTokensCallBack,
      this.model.player1?.playCard
    );
    if (gameType === 'vsAI') {
      this.model.vsAI(this.handleNonPlayerCardPlacement, this.handleDrawCard);
    }
  }

  handleNonPlayerCardPlacement = (
    playerID: PlayerType,
    card: Card,
    boardSpace: BoardSpace
  ) => {
    console.log('non player card placement called ');
    this.view.computerPlayCard(card, boardSpace);
  };

  handleDrawCard = (card: Card) => {
    console.log(`controller handleDrawCard method called`);
    this.view.playerDrawCard(card);
  };

  createBoundAvailTokensCallBack = (
    callback: (playerId: PlayerType) => BoardSpace[],
    playerId: PlayerType
  ) => {
    return () => {
      return callback.call(this, playerId);
    };
  };
}
