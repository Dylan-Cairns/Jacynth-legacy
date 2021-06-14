import { GameBoard } from './gameboard.js';
import { Card, Decktet, DeckType } from './decktet.js';
import {
  Player,
  Player_MultiPlayer,
  Player_SinglePlayer,
  Player_ComputerPlayer,
  SendCardPlaytoViewCB
} from './player.js';
import { io, Socket } from 'socket.io-client';

export type GameType = 'multiPlayer' | 'singlePlayer' | 'solitaire';
export type Layout = 'razeway' | 'towers' | 'oldcity' | 'solitaire';

const SOLITAIRE_BOARD_DIMENSIONS = 4;
const TWOPLAYER_BOARD_DIMENSIONS = 6;
const BOARD_LAYOUTS = {
  razeway: ['x0y0', 'x1y1', 'x2y2', 'x3y3', 'x4y4', 'x5y5'],
  towers: ['x1y1', 'x4y1', 'x1y4', 'x4y4'],
  oldcity: ['x2y0', 'x4y1', 'x0y2', 'x5y3', 'x1y4', 'x3y5'],
  solitaire: ['x0y0', 'x0y3', 'x0y3', 'x3y3']
};

export class Game {
  board: GameBoard;
  sendCardPlaytoView: SendCardPlaytoViewCB | undefined;

  constructor(gameType: GameType, layout: Layout, deckType: DeckType) {
    const dimensions =
      layout === 'solitaire'
        ? SOLITAIRE_BOARD_DIMENSIONS
        : TWOPLAYER_BOARD_DIMENSIONS;

    this.board = new GameBoard(dimensions);
  }

  bindSendCardPlayToView(sendCardPlaytoView: SendCardPlaytoViewCB) {
    this.sendCardPlaytoView = sendCardPlaytoView;
  }
}

export class SinglePlayer extends Game {
  deck: Decktet;
  player1: Player_SinglePlayer;
  player2: Player_ComputerPlayer;
  constructor(gameType: GameType, layout: Layout, deckType: DeckType) {
    super(gameType, layout, deckType);
    this.deck = new Decktet(deckType);

    const dimensions =
      layout === 'solitaire'
        ? SOLITAIRE_BOARD_DIMENSIONS
        : TWOPLAYER_BOARD_DIMENSIONS;

    this.board = new GameBoard(dimensions);
    this.player1 = new Player_SinglePlayer('Player1', this.board, this.deck);
    this.player2 = new Player_ComputerPlayer(
      'Computer',
      this.board,
      this.deck,
      'Player1'
    );
    this.createGame(layout);
  }

  public createGame(layout: Layout) {
    this.createLayout(this.board, this.deck, layout);
    this.player1.drawStartingHand();
    this.player2.drawStartingHand();
  }

  private createLayout(board: GameBoard, drawCardCB: Decktet, layout: Layout) {
    const handleInitialPlacement = (spaceID: string) => {
      const card = drawCardCB.drawCard()!;
      const space = this.board.getSpace(spaceID)!;
      board.setCard(spaceID, card);
      if (this.sendCardPlaytoView) this.sendCardPlaytoView(card, space);
    };
    switch (layout) {
      case 'razeway':
        BOARD_LAYOUTS.razeway.forEach((spaceID) =>
          handleInitialPlacement(spaceID)
        );
        break;
      case 'towers':
        BOARD_LAYOUTS.towers.forEach((spaceID) =>
          handleInitialPlacement(spaceID)
        );
        break;
      case 'oldcity':
        BOARD_LAYOUTS.oldcity.forEach((spaceID) =>
          handleInitialPlacement(spaceID)
        );
        break;
      case 'solitaire':
        BOARD_LAYOUTS.solitaire.forEach((spaceID) =>
          handleInitialPlacement(spaceID)
        );
        break;
    }
  }
}

export class Multiplayer extends Game {
  socket: Socket;
  player1: Player_MultiPlayer;
  player2: Player_MultiPlayer;
  initialCards: Card[];
  constructor(
    gameType: GameType,
    layout: Layout,
    deckType: DeckType,
    socket: Socket
  ) {
    super(gameType, layout, deckType);
    this.socket = socket;
    this.initialCards = [];
    const dimensions =
      layout === 'solitaire'
        ? SOLITAIRE_BOARD_DIMENSIONS
        : TWOPLAYER_BOARD_DIMENSIONS;
    this.board = new GameBoard(dimensions);

    socket.on('recieveInitialCard', (newCard: Card | undefined) => {
      if (newCard) {
        this.initialCards.push(newCard);
      }
    });

    this.player1 = new Player_MultiPlayer('Player1', this.board, this.socket);
    this.player2 = new Player_MultiPlayer('Player2', this.board, this.socket);
    this.createGame(layout);
  }

  private getLayoutCard() {
    this.socket.emit('getInitialCard');
  }

  private getAllLayoutCards(layout: Layout) {
    BOARD_LAYOUTS[layout].forEach((ele) => {
      this.getLayoutCard();
    });
  }

  private createGame(layout: Layout) {
    this.createLayout(this.board, this.initialCards, layout);
    this.player1.drawStartingHand();
    this.player2.drawStartingHand();
  }

  private createLayout(board: GameBoard, cardsArr: Card[], layout: Layout) {
    const handleInitialPlacement = (spaceID: string) => {
      const card = cardsArr.pop()!;
      const space = this.board.getSpace(spaceID)!;
      board.setCard(spaceID, card);
      if (this.sendCardPlaytoView) this.sendCardPlaytoView(card, space);
    };
    switch (layout) {
      case 'razeway':
        BOARD_LAYOUTS.razeway.forEach((spaceID) =>
          handleInitialPlacement(spaceID)
        );
        break;
      case 'towers':
        BOARD_LAYOUTS.towers.forEach((spaceID) =>
          handleInitialPlacement(spaceID)
        );
        break;
      case 'oldcity':
        BOARD_LAYOUTS.oldcity.forEach((spaceID) =>
          handleInitialPlacement(spaceID)
        );
        break;
      case 'solitaire':
        BOARD_LAYOUTS.solitaire.forEach((spaceID) =>
          handleInitialPlacement(spaceID)
        );
        break;
    }
  }
}
