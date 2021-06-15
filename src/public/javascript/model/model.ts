import { GameBoard } from './gameboard.js';
import { Card, Decktet, DeckType } from './decktet.js';
import {
  PlayerID,
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

export class GameModel {
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

export class SinglePlayerGameModel extends GameModel {
  deck: Decktet;
  player1: Player_SinglePlayer;
  player2: Player_ComputerPlayer;
  constructor(gameType: GameType, layout: Layout, deckType: DeckType) {
    super(gameType, layout, deckType);
    this.deck = new Decktet(deckType);

    this.player1 = new Player_SinglePlayer('Player1', this.board, this.deck);
    this.player2 = new Player_ComputerPlayer(
      'Computer',
      this.board,
      this.deck,
      'Player1'
    );
  }

  public createGame(layout: Layout) {
    this.createLayout(this.board, this.deck, layout);
    this.player1.drawStartingHand();
    this.player2.drawStartingHand();
  }

  private createLayout(board: GameBoard, deck: Decktet, layout: Layout) {
    const handleInitialPlacement = (spaceID: string) => {
      const card = deck.drawCard()!;
      console.log('card', card);
      const space = this.board.getSpace(spaceID)!;
      board.setCard(spaceID, card);
      console.log('boardspace', space);
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

export class MultiplayerGameModel extends GameModel {
  socket: Socket;
  currPlyr: Player_MultiPlayer;
  opposPlyr: Player_MultiPlayer;
  initialCards: Card[];
  currPlyrID: PlayerID;
  constructor(
    gameType: GameType,
    layout: Layout,
    deckType: DeckType,
    socket: Socket,
    currPlyrID: PlayerID
  ) {
    super(gameType, layout, deckType);
    this.socket = socket;
    this.initialCards = [];
    this.currPlyrID = currPlyrID;
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

    this.currPlyr = new Player_MultiPlayer(currPlyrID, this.board, this.socket);

    const opposingPlyr = currPlyrID === 'Player1' ? 'Player2' : 'Player1';

    this.opposPlyr = new Player_MultiPlayer(
      opposingPlyr,
      this.board,
      this.socket
    );
    this.createGame(layout);
  }

  private createGame(layout: Layout) {
    this.currPlyr.drawStartingHand();
    this.opposPlyr.drawStartingHand();
  }

  public createLayout(board: GameBoard, deck: Decktet, layout: Layout) {
    const handleInitialPlacement = (spaceID: string) => {
      const card = deck.drawCard()!;
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
