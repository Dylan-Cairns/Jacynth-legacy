import { BoardSpace, GameBoard } from './gameboard';
import { Card, Decktet } from './decktet';
import { Player, ComputerPlayer } from './player';

export class Model {
  constructor(gameType: 'vsAI') {
    if (gameType === 'vsAI') {
      this.vsAI();
    }
  }

  vsAI() {
    const deck = new Decktet({ isBasicDeck: true });
    const board = new GameBoard(6);
    board.setCard('x0y0', deck.drawCard()!);
    board.setCard('x0y5', deck.drawCard()!);
    board.setCard('x5y0', deck.drawCard()!);
    board.setCard('x5y5', deck.drawCard()!);

    const computerPlayer1 = new ComputerPlayer(
      'Computer1',
      board,
      deck,
      'Computer2'
    );

    let turnNumber = 1;
    while (board.getAvailableSpaces().size > 0) {
      console.log(`Turn number ${turnNumber}`);
      computerPlayer1.chooseBestMove();
      computerPlayer2.chooseBestMove();
      const p1score = board.getPlayerScore('Computer1');
      const p2score = board.getPlayerScore('Computer2');
      console.log(`Score = P1: ${p1score} vs P2: ${p2score}`);
      turnNumber++;
    }
    console.log(`Game over.`);
    const p1score = board.getPlayerScore('Computer1');
    const p2score = board.getPlayerScore('Computer2');
    console.log(`Final score = P1: ${p1score} vs P2: ${p2score}`);
  }
}
