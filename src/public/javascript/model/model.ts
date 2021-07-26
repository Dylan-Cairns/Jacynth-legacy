import { GameBoard } from './gameboard.js';
import { Card, Decktet, DeckType } from './decktet.js';
import {
  PlayerID,
  Player_MultiPlayer,
  Player_SinglePlayer,
  Player_ComputerPlayer,
  SendCardPlaytoViewCB,
  SendTokenPlayToViewCB
} from './player.js';
import { io, Socket } from 'socket.io-client';

export type GameType = 'multiPlayer' | 'singlePlayer' | 'solitaire';
export type Layout = 'razeway' | 'towers' | 'oldcity' | 'solitaire';

const SOLITAIRE_BOARD_DIMENSIONS = 4;
const TWOPLAYER_BOARD_DIMENSIONS = 6;
export const BOARD_LAYOUTS = {
  razeway: ['x0y0', 'x1y1', 'x2y2', 'x3y3', 'x4y4', 'x5y5'],
  towers: ['x1y1', 'x4y1', 'x1y4', 'x4y4'],
  oldcity: ['x2y0', 'x4y1', 'x0y2', 'x5y3', 'x1y4', 'x3y5'],
  solitaire: ['x0y0', 'x0y3', 'x0y3', 'x3y3']
};

export class GameModel {
  board: GameBoard;
  deck: Decktet;
  sendCardPlaytoView: SendCardPlaytoViewCB | undefined;
  sendTokenPlaytoView: SendTokenPlayToViewCB | undefined;

  constructor(deckType: DeckType) {
    this.board = new GameBoard(TWOPLAYER_BOARD_DIMENSIONS);
    this.deck = new Decktet(deckType);
  }

  bindSendCardPlayToView(sendCardPlaytoView: SendCardPlaytoViewCB) {
    this.sendCardPlaytoView = sendCardPlaytoView;
  }

  bindSendTokenPlayToView(sendTokenPlayToView: SendTokenPlayToViewCB) {
    this.sendTokenPlaytoView = sendTokenPlayToView;
  }
}

export class SinglePlayerGameModel extends GameModel {
  currPlyr: Player_SinglePlayer;
  opposPlyr: Player_ComputerPlayer;
  constructor(deckType: DeckType) {
    super(deckType);

    this.currPlyr = new Player_SinglePlayer('Player 1', this.board, this.deck);
    this.opposPlyr = new Player_ComputerPlayer(
      'Computer',
      this.board,
      this.deck,
      'Player 1',
      this.currPlyr.getInfluenceTokensNo,
      this.currPlyr.placeToken,
      this.currPlyr.undoPlaceToken
    );
  }

  public startGame(layout: Layout) {
    this.createLayout(this.deck, layout);
    this.currPlyr.drawStartingHand();
    this.opposPlyr.drawStartingHand();
  }

  public restoreGame() {
    this.restoreLayout();
    this.restorePlayedMoves();
    this.currPlyr.restoreHand();
    this.opposPlyr.restoreHand();
    this.deck.restoreDeck(this.currPlyr.playerID, this.opposPlyr.playerID);
    this.board.resolveInflunceForEntireBoard();
  }

  public resetStorage = () => {
    localStorage.removeItem('layout');
    localStorage.removeItem('playedCards');
    localStorage.removeItem('movesArr');
    localStorage.removeItem('undoMoves');
    localStorage.removeItem('turnStatus');
    localStorage.removeItem(`${this.currPlyr.playerID}-hand`);
    localStorage.removeItem(`${this.opposPlyr.playerID}-hand`);
  };

  private restorePlayedMoves() {
    // check if local save data exists. If so, add the cards and tokens
    // to the board in the same order as originally played.
    const movesJSON = localStorage.getItem('movesArr');
    if (movesJSON) {
      const movesArr = JSON.parse(movesJSON);
      for (let idx = 0; idx < movesArr.length; idx++) {
        const obj = movesArr[idx];
        if (obj.cardToPlay) {
          const card = this.deck.getCardByID(obj.cardToPlay)!;
          const space = this.board.getSpace(obj.spaceToPlaceCard)!;
          this.board.setCard(obj.spaceToPlaceCard, card);
          if (this.sendCardPlaytoView) this.sendCardPlaytoView(card, space);
        } else if (obj.spaceToPlaceToken) {
          const space = this.board.getSpace(obj.spaceToPlaceToken)!;

          if (this.currPlyr.playerID === obj.playerID) {
            this.currPlyr.restoreTokenPlay(obj.spaceToPlaceToken);
          } else {
            this.opposPlyr.restoreTokenPlay(obj.spaceToPlaceToken);
          }

          if (this.sendTokenPlaytoView)
            this.sendTokenPlaytoView(space, obj.playerID);
        }
      }
    }
  }

  private createLayout(deck: Decktet, layout: Layout) {
    const layoutStorArr = [] as { cardID: string; spaceID: string }[];

    const handleInitialPlacementCB = (spaceID: string) => {
      const card = deck.drawCard()!;
      const space = this.board.getSpace(spaceID)!;
      this.board.setCard(spaceID, card);
      if (this.sendCardPlaytoView) this.sendCardPlaytoView(card, space);
      // add card info to array which will be saved in local storage
      layoutStorArr.push({ cardID: card.getId(), spaceID: spaceID });
    };

    const layoutArr = BOARD_LAYOUTS[layout];
    layoutArr.forEach((spaceID) => handleInitialPlacementCB(spaceID));

    //save layout info to local storage
    localStorage.setItem('layout', JSON.stringify(layoutStorArr));
  }

  private restoreLayout() {
    // check for stored layout info
    const layoutJSON = localStorage.getItem('layout');
    if (layoutJSON) {
      const layoutArr = JSON.parse(layoutJSON);
      layoutArr.forEach((obj: { cardID: string; spaceID: string }) => {
        const card = this.deck.getCardByID(obj.cardID)!;
        const space = this.board.getSpace(obj.spaceID)!;
        this.board.setCard(obj.spaceID, card);
        if (this.sendCardPlaytoView) this.sendCardPlaytoView(card, space);
      });
    }
  }
}

export class MultiplayerGameModel extends GameModel {
  socket: Socket;
  currPlyr: Player_MultiPlayer;
  opposPlyr: Player_MultiPlayer;
  constructor(deckType: DeckType, socket: Socket, currPlyrID: PlayerID) {
    super(deckType);
    this.socket = socket;

    socket.on('recieveLayoutCard', (cardID, spaceID) => {
      const space = this.board.getSpace(spaceID);
      if (!cardID || !space) return;
      const card = this.deck.getCardByID(cardID);
      if (!card) return;
      this.board.setCard(spaceID, card);
      if (this.sendCardPlaytoView) this.sendCardPlaytoView(card, space);
    });

    this.currPlyr = new Player_MultiPlayer(
      currPlyrID,
      this.board,
      this.deck,
      this.socket
    );

    const opposingPlyr = currPlyrID === 'Player 1' ? 'Player 2' : 'Player 1';

    this.opposPlyr = new Player_MultiPlayer(
      opposingPlyr,
      this.board,
      this.deck,
      this.socket
    );
  }

  public createLayout = (layout: Layout) => {
    const layoutArr = BOARD_LAYOUTS[layout];
    this.socket.emit('createStartingLayout', layoutArr);
    this.socket.emit('playerReady', 'Player 2');
  };
}
