import { BoardSpace, GameBoard } from '../model/gameboard.js';
import { Card } from '../model/decktet.js';

export class View {
  app: Element;
  gameBoard: Element;
  drawDeck: Element;
  playerHandGrid: Element;

  constructor(board: GameBoard) {
    this.app = this.getElement('#root')!;
    this.gameBoard = this.getElement('.gameboard')!;
    this.drawDeck = this.getElement('drawDeck')!;
    this.playerHandGrid = this.getElement('.player-hand')!;
    this.createBoardSpaces(board);
  }

  getElement(selector: string) {
    const element = document.querySelector(selector);

    return element;
  }

  createElement(tag: string, ...classNames: string[]) {
    const element = document.createElement(tag);
    if (classNames) element.classList.add(...classNames);

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
      spaceDiv.classList.add('boardSpace');
      spaceDiv.id = spaceID;
      // if board width is even, swap color of starting tile for each new row
      if (isBoardWidthEven) {
        if (x === 0 && y > 0) {
          isDark = !isDark;
        }
      }
      // alternate dark and light tiles of the board
      if (isDark) {
        spaceDiv.classList.add('dark-square');
        isDark = false;
      } else {
        isDark = true;
      }
      this.gameBoard.appendChild(spaceDiv);
    });
  }

  createCard(card: Card) {
    // get the values from the card
    const id = card.getId();
    const suits = card.getAllSuits();
    const cardComponents = [] as Element[];
    const value = card.getValue();
    // create the card
    const cardDiv = this.createElement('div', 'card');
    cardDiv.id = id;
    // create and append the children
    const valueDiv = this.createElement('div', `card-cell`);
    valueDiv.textContent = this.prepareValueForDisplay(value);
    suits.forEach((suit) => {
      cardComponents.push(this.createElement('div', 'card-cell', suit));
    });
    if (suits.length < 2) {
      const placeHolderDiv = this.createElement('div', `card-cell`);
      cardComponents.push(placeHolderDiv);
    }
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
    const boardSpace = document.getElementById(spaceID);
    boardSpace?.appendChild(cardDiv);
  }

  addTokenToSpace(player: 'player1' | 'player2', spaceID: string) {
    const boardSpace = this.getElement(spaceID);
    boardSpace?.appendChild(this.createToken(player));
  }

  playerDrawCard(card: Card) {
    const cardDiv = this.createCard(card);
    cardDiv.draggable = true;
    this.playerHandGrid?.appendChild(cardDiv);
  }

  playerPlayCard(card: Card, boardSpace: BoardSpace) {
    this.getElement;
  }

  computerPlayCard(card: Card, boardSpace: BoardSpace) {
    const cardDiv = this.createCard(card);
    this.addCardToSpace(cardDiv, boardSpace.getID());
  }

  bindPlayerPlayCard = (callback: () => Map<string, BoardSpace>) => {
    let draggedCard: HTMLElement;

    // get all available spaces from the model
    document.addEventListener('dragstart', (event) => {
      draggedCard = event.target as HTMLElement;
      this.highlightAvailableCardSpaces(callback);
    });

    document.addEventListener(
      'dragover',
      function (event) {
        // prevent default to allow drop
        event.preventDefault();
      },
      false
    );

    document.addEventListener(
      'dragenter',
      function (event) {
        // highlight potential drop target when the draggable element enters it
        const targetSpace = event.target as HTMLInputElement;
        if (targetSpace.classList) {
          targetSpace.classList.add('dragenter');
        }
      },
      false
    );

    document.addEventListener(
      'dragleave',
      function (event) {
        // remove highlighting
        const targetSpace = event.target as HTMLInputElement;
        if (targetSpace.classList) {
          targetSpace.classList.remove('dragenter');
        }
      },
      false
    );

    document.addEventListener('drop', (event) => {
      event.preventDefault();
      const targetSpace = event.target as HTMLInputElement;
      if (targetSpace.classList.contains('playable-space')) {
        if (draggedCard && draggedCard.parentNode && targetSpace) {
          draggedCard.draggable = false;
          draggedCard.parentNode.removeChild(draggedCard);
          targetSpace.appendChild(draggedCard);
        }
      }
    });

    document.addEventListener('dragend', (event) => {
      // remove all available spaces highlighting
      const draggedCard = event.target as HTMLElement;
      Array.from(this.gameBoard.children).forEach((space) => {
        space.classList.remove('playable-space');
      });
    });
  };

  highlightAvailableCardSpaces = (
    getAvailableSpacesCallback: () => Map<string, BoardSpace>
  ) => {
    const availableSpaces = getAvailableSpacesCallback();
    availableSpaces.forEach((space) => {
      const spaceID = space.getID();
      const availableSpace = document.getElementById(spaceID);
      if (availableSpace) {
        availableSpace.classList.add('playable-space');
      }
    });
  };

  private prepareValueForDisplay(value: number) {
    switch (value) {
      case 0:
        return '.';
      case 1:
        return 'A';
      case 10:
        return '*';
      case 11:
        return '#';
      case 12:
        return '%%';
      default:
        return String(value);
    }
  }
}
