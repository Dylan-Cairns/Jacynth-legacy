import { BoardSpace, GameBoard } from './gameboard.js';
import { Card, Decktet } from './decktet.js';
import {
  Player,
  ComputerPlayer,
  BindPlayCardCallback,
  BindDrawCardCallback
} from './player.js';

export type GameType = 'vsAI' | 'solitaire';
export type Layout = 'razeway' | 'towers' | 'oldcity' | 'solitaire';

const SOLITAIRE_BOARD_DIMENSIONS = 4;
const TWOPLAYER_BOARD_DIMENSIONS = 6;

export class Model {
  board: GameBoard;
  deck: Decktet;

  constructor(
    gameType: GameType,
    layout: Layout,
    bindPlayCardCallback: BindPlayCardCallback,
    bindDrawCardCallback: BindDrawCardCallback
  ) {
    const dimensions =
      layout === 'solitaire'
        ? SOLITAIRE_BOARD_DIMENSIONS
        : TWOPLAYER_BOARD_DIMENSIONS;

    this.deck = new Decktet('basicDeck');
    this.board = new GameBoard(dimensions);

    if (gameType === 'vsAI') {
      this.vsAI(bindPlayCardCallback, bindDrawCardCallback);
    }
  }

  vsAI(
    bindPlayCardCallback: BindPlayCardCallback,
    bindDrawCardCallback: BindDrawCardCallback
  ) {
    const humanPlayer1 = new Player(
      'humanPlayer1',
      this.board,
      this.deck,
      bindPlayCardCallback,
      bindDrawCardCallback
    );

    const computerPlayer1 = new ComputerPlayer(
      'computerPlayer',
      this.board,
      this.deck,
      'humanPlayer1',
      bindPlayCardCallback,
      bindDrawCardCallback
    );
  }

  createLayout(board: GameBoard, deck: Decktet, layout: Layout) {
    switch (layout) {
      case 'razeway':
        board.setCard('x0y0', deck.drawCard()!);
        board.setCard('x1y1', deck.drawCard()!);
        board.setCard('x2y2', deck.drawCard()!);
        board.setCard('x3y3', deck.drawCard()!);
        board.setCard('x4y4', deck.drawCard()!);
        board.setCard('x5y5', deck.drawCard()!);
        break;
      case 'towers':
        board.setCard('x1y1', deck.drawCard()!);
        board.setCard('x4y1', deck.drawCard()!);
        board.setCard('x1y4', deck.drawCard()!);
        board.setCard('x4y4', deck.drawCard()!);
        break;
      case 'oldcity':
        board.setCard('x3y0', deck.drawCard()!);
        board.setCard('x4y1', deck.drawCard()!);
        board.setCard('x0y3', deck.drawCard()!);
        board.setCard('x5y3', deck.drawCard()!);
        board.setCard('x1y4', deck.drawCard()!);
        board.setCard('x3y5', deck.drawCard()!);
        break;
      case 'solitaire':
        board.setCard('x0y0', deck.drawCard()!);
        board.setCard('x0y3', deck.drawCard()!);
        board.setCard('x0y3', deck.drawCard()!);
        board.setCard('x3y3', deck.drawCard()!);
        break;
    }
  }
}
