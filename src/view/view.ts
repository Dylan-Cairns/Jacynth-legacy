import { BoardSpace, GameBoard } from '../model/gameboard.js';
import { Card } from '../model/decktet.js';
import { PlayerID } from '../model/player.js';

export class View {
  app: Element;
  gameBoard: HTMLElement;
  playerHandContainer: HTMLElement;
  influenceTokenContainer: HTMLElement;
  undoButton: HTMLButtonElement;
  endTurnButton: HTMLButtonElement;
  draggedElement: HTMLElement | undefined;
  undoMovesArr: {
    draggedEle: HTMLElement;
    targetSpace: HTMLElement;
  }[];
  getAvailCardSpaces: (() => BoardSpace[]) | undefined;
  getAvailTokenSpaces: (() => BoardSpace[]) | undefined;
  sendCardPlayToModel:
    | ((cardID: string, spaceID: string) => boolean)
    | undefined;
  sendTokenPlayToModel: ((spaceID: string) => boolean) | undefined;
  undoPlayCard: ((spaceID: string) => void) | undefined;
  undoPlaceToken: ((spaceID: string) => void) | undefined;

  constructor(board: GameBoard) {
    this.app = document.querySelector('#root')! as HTMLElement;
    this.gameBoard = document.querySelector('.gameboard')! as HTMLElement;
    this.playerHandContainer = document.querySelector(
      '.player-hand'
    )! as HTMLElement;
    this.influenceTokenContainer = document.querySelector(
      '.influenceTokenContainer'
    )!;
    this.undoButton = document.getElementById(
      'undoButton'
    ) as HTMLButtonElement;
    this.endTurnButton = document.getElementById(
      'endTurnButton'
    ) as HTMLButtonElement;
    this.undoMovesArr = [];
    this.createBoardSpaces(board);

    // on dragstart, get all available spaces from the model
    document.addEventListener('dragstart', (event) => {
      this.draggedElement = event.target as HTMLElement;
      if (this.draggedElement.classList.contains('card')) {
        if (this.getAvailCardSpaces) {
          this.highlightAvailableSpaces(this.getAvailCardSpaces);
        }
      } else if (this.draggedElement.classList.contains('influenceToken')) {
        if (this.getAvailTokenSpaces) {
          this.highlightAvailableSpaces(this.getAvailTokenSpaces);
        }
      }
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
      targetSpace.classList.remove('dragenter');
      // check space is playable & required attributes are defined
      if (
        targetSpace.classList.contains('playable-space') &&
        this.draggedElement &&
        this.draggedElement.parentNode &&
        targetSpace
      ) {
        // if dragged item is a card, place the card,
        // disable dragging of remaining cards and enable dragging token,
        // and invoke playcard callback to trigger change in model
        if (this.draggedElement.classList.contains('card')) {
          this.disableAllCardDragging();
          this.enableTokenDragging();

          this.draggedElement.parentNode.removeChild(this.draggedElement);
          targetSpace.appendChild(this.draggedElement);
          if (this.sendCardPlayToModel) {
            this.sendCardPlayToModel(targetSpace.id, this.draggedElement.id);
          }
          // save move information for undo
          this.undoMovesArr.push({
            draggedEle: this.draggedElement,
            targetSpace: targetSpace
          });
          //enable undo button
          this.undoButton.disabled = false;
          // or place a token
        } else if (this.draggedElement.classList.contains('influenceToken')) {
          this.draggedElement.parentNode.removeChild(this.draggedElement);
          targetSpace.appendChild(this.draggedElement);
          this.disableAllTokenDragging();
          if (this.sendTokenPlayToModel) {
            this.sendTokenPlayToModel(targetSpace.id);
          }
          // save move information for undo
          this.undoMovesArr.push({
            draggedEle: this.draggedElement,
            targetSpace: targetSpace
          });
          this.undoButton.disabled = false;
        }
      }
    });

    document.addEventListener('dragend', () => {
      // remove all available spaces highlighting
      Array.from(this.gameBoard.children).forEach((space) => {
        space.classList.remove('playable-space');
      });
    });

    this.undoButton.addEventListener('click', () => {
      if (this.undoMovesArr.length > 0) {
        const moveObj = this.undoMovesArr.pop()!;
        const cardOrTokenToUndo = moveObj.draggedEle;
        const targetSpace = moveObj.targetSpace;
        // if first item in undo list is card,
        // replace the card, invoke the model to reset board control,
        // re-enable card dragging, disable token dragging
        // & disable the undo button
        if (cardOrTokenToUndo.classList.contains('card')) {
          targetSpace.removeChild(cardOrTokenToUndo);
          this.playerHandContainer.appendChild(cardOrTokenToUndo);
          if (this.undoPlayCard) {
            this.undoPlayCard(targetSpace.id);
          }
          this.enableCardHandDragging();
          this.disableAllTokenDragging();
          this.undoButton.disabled = true;
          // if it's a token, leave undo button active.
        } else if (cardOrTokenToUndo?.classList.contains('influenceToken')) {
          targetSpace.removeChild(cardOrTokenToUndo);
          this.influenceTokenContainer.appendChild(cardOrTokenToUndo);
          if (this.undoPlaceToken) {
            this.undoPlaceToken(targetSpace.id);
          }
          this.enableTokenDragging();
        }
      }
    });
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

  createCard = (card: Card) => {
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
  };

  enableCardHandDragging() {
    const CardsArr = Array.from(
      this.playerHandContainer.querySelectorAll('.card')
    ) as HTMLElement[];
    CardsArr.forEach((ele) => {
      if (ele.classList.contains('card')) {
        ele.draggable = true;
      }
    });
  }

  disableAllCardDragging() {
    const CardsArr = Array.from(
      document.querySelectorAll('.card')
    ) as HTMLElement[];
    CardsArr.forEach((ele) => {
      if (ele.classList.contains('card') && ele.draggable) {
        ele.draggable = false;
      }
    });
  }

  enableTokenDragging() {
    const token = this.influenceTokenContainer.firstChild as HTMLElement;
    if (token) {
      token.draggable = true;
    }
  }

  disableAllTokenDragging() {
    const tokenArr = Array.from(
      document.querySelectorAll('.influenceToken')
    ) as HTMLElement[];
    tokenArr.forEach((ele) => {
      if (ele.classList.contains('influenceToken') && ele.draggable) {
        ele.draggable = false;
      }
    });
  }

  createToken = (playerID: PlayerID) => {
    return this.createElement('div', `card-cell token ${playerID}`);
  };

  addCardToSpace = (cardDiv: HTMLElement, spaceID: string) => {
    const boardSpace = document.getElementById(spaceID);
    boardSpace?.appendChild(cardDiv);
  };

  addTokenToSpace = (playerID: PlayerID, spaceID: string) => {
    const boardSpace = document.getElementById(spaceID);
    boardSpace?.appendChild(this.createToken(playerID));
  };

  playerDrawCard = (card: Card) => {
    const cardDiv = this.createCard(card);
    cardDiv.draggable = true;
    this.playerHandContainer?.appendChild(cardDiv);
  };

  // playerPlayCard(card: Card, boardSpace: BoardSpace) {
  //   this.getElement;
  // }

  highlightAvailableSpaces = (
    getAvailableSpacesCallback: () => BoardSpace[]
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
        return '1';
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

  nonPlayerCardPlacementCB = (card: Card, boardSpace: BoardSpace) => {
    const cardDiv = this.createCard(card);
    this.addCardToSpace(cardDiv, boardSpace.getID());
  };

  bindGetAvailCardSpaces(availCardSpacesCB: () => BoardSpace[]) {
    this.getAvailCardSpaces = availCardSpacesCB;
  }

  bindGetAvailTokenSpaces(availTokenSpacesCB: () => BoardSpace[]) {
    this.getAvailTokenSpaces = availTokenSpacesCB;
  }

  bindSendCardPlayToModel(
    sendCardPlayToModelCB: (cardID: string, spaceID: string) => boolean
  ) {
    this.sendCardPlayToModel = sendCardPlayToModelCB;
  }

  bindSendTokenPlayToModel(
    sendTokenPlaytoModelCB: (spaceID: string) => boolean
  ) {
    this.sendTokenPlayToModel = sendTokenPlaytoModelCB;
  }

  bindUndoPlayCard(undoPlayCardCB: (spaceID: string) => void) {
    this.undoPlayCard = undoPlayCardCB;
  }

  bindUndoPlaceToken(undoPlaceTokenCB: (spaceID: string) => void) {
    this.undoPlaceToken = undoPlaceTokenCB;
  }
}
