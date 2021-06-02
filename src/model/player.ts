import { Card, Decktet } from './decktet';
import { BoardSpace, GameBoard } from './gameboard';

export class Player {
  id: string;
  hand: Card[];
  gameBoard: GameBoard;
  deck: Decktet;

  constructor(id: string, gameBoard: GameBoard, deck: Decktet) {
    this.id = id;
    this.gameBoard = gameBoard;
    this.deck = deck;
    this.hand = [];
    const HAND_SIZE = 3;
    for (let i = 0; i < HAND_SIZE; i++) {
      this.hand.push(this.deck.drawCard() as Card);
    }
  }

  playCard(spaceID: string, card: Card) {
    if (this.gameBoard.setCard(spaceID, card)) return false;
  }
}
