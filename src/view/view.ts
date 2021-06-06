import { BoardSpace, GameBoard } from '../model/gameboard';
import { Card } from '../model/decktet';

export class View {
  app: Element;
  gameBoard: Element;
  drawDeck: Element;
  playerHandGrid: Element;

  constructor(board: GameBoard) {
    this.app = this.getElement('#root')!;
    this.gameBoard = this.getElement('.gameboard-grid-container')!;
    this.drawDeck = this.getElement('drawDeck')!;
    this.playerHandGrid = this.getElement('player-hand-grid-container')!;
    this.createBoardSpaces(board);
  }

  getElement(selector: string) {
    const element = document.querySelector(selector);

    return element;
  }

  createElement(tag: string, className: string) {
    const element = document.createElement(tag);
    if (className) element.classList.add(className);

    return element;
  }

  createBoardSpaces(board: GameBoard) {
    const spacesMap = board.getAllSpaces();
    const dimensions = board.getBoardSize();
    let isDark = false;
    const isBoardWidthEven = dimensions % 2 === 0;

    spacesMap.forEach((spaceObj) => {
      const spaceDiv = document.createElement('div');
      const spaceID = spaceObj.getID();
      const x = Number(spaceID[1]);
      const y = Number(spaceID[3]);
      spaceDiv.className += 'gameboard-grid-item';
      spaceDiv.dataset.id = spaceID;
      // if board width is even, swap color of starting tile for each new row
      if (isBoardWidthEven) {
        if (x === 0 && y > 0) {
          isDark = !isDark;
        }
      }
      // alternate dark and light tiles of the board
      if (isDark) {
        spaceDiv.className += ' dark-square';
        isDark = false;
      } else {
        isDark = true;
      }
      this.gameBoard.appendChild(spaceDiv);
    });
  }

  createCard(card: Card) {
    // get the values from the card
    const suits = card.getAllSuits();
    const cardComponents = [] as Element[];
    const value = card.getValue();
    // create the card
    const cardDiv = this.createElement('div', 'card-container');
    // create and append the children
    const valueDiv = this.createElement('div', `card-cell ${value}`);
    valueDiv.textContent = String(value);
    suits.forEach((suit) => {
      cardComponents.push(this.createElement('div', `card-cell ${suit}`));
    });
    cardComponents.push(valueDiv);
    cardComponents.forEach((ele) => {
      cardDiv.appendChild(ele);
    });
    return cardDiv;
  }

  createToken(player: 'player1' | 'player2') {
    return this.createElement('div', `card-cell token ${player}`);
  }

  addCardToSpace(cardDiv: HTMLElement, spaceID: string) {
    const boardSpace = this.getElement(spaceID);
    boardSpace?.appendChild(cardDiv);
  }

  addTokenToSpace(player: 'player1' | 'player2', spaceID: string) {
    const boardSpace = this.getElement(spaceID);
    boardSpace?.appendChild(this.createToken(player));
  }

  playerDrawCard(card: Card) {
    const cardDiv = this.createCard(card);
    this.playerHandGrid?.appendChild(cardDiv);
  }

  playerPlayCard(card: Card, boardSpace: BoardSpace) {
    this.playerHandGrid;
  }

  computerPlayCard(card: Card, boardSpace: BoardSpace) {
    const cardDiv = this.createCard(card);
    this.addCardToSpace(cardDiv, boardSpace.getID());
  }
}
