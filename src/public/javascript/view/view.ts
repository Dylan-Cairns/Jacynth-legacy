import { BoardSpace, GameBoard } from '../model/gameboard.js';
import { Layout } from '../model/model.js';
import { Card } from '../model/decktet.js';
import { PlayerID } from '../model/player.js';
import { Socket } from 'socket.io-client';

export class View {
  currPlyrID: PlayerID;
  app: Element;
  gameBoard: HTMLElement;
  playerHandContainer: HTMLElement;
  influenceTokenContainer: HTMLElement;
  undoButton: HTMLButtonElement;
  endTurnButton: HTMLButtonElement;
  currPlyrHUD: HTMLElement;
  currPlyrHUDID: HTMLElement;
  opponentHUD: HTMLElement;
  opponentHUDID: HTMLElement;
  currPlyrIcon: HTMLElement;
  opponentIcon: HTMLElement;
  gameOverBox: HTMLElement;
  winnerText: HTMLElement;
  disconnectedAlert: HTMLElement;
  pickupSound: HTMLMediaElement;
  dropSound: HTMLMediaElement;
  menuButton: HTMLButtonElement;
  closeMenuButton: HTMLButtonElement;
  menu: HTMLElement;
  rulesButton: HTMLButtonElement;
  closeRulesButton: HTMLButtonElement;
  rules: HTMLElement;
  overlay: HTMLElement;
  chooseLayoutOverlay: HTMLElement;
  chooseLayoutMenu: HTMLElement;
  layoutButtons: NodeListOf<HTMLButtonElement>;
  howToPlayInfo: HTMLElement;
  howToPlayButton: HTMLButtonElement;
  draggedElement: HTMLElement | undefined;
  movesArr: {
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
  computerTakeTurn: (() => void) | undefined;
  getCardDrawFromModel: (() => void) | undefined;
  getCurrPlyrAvailTokens: (() => number) | undefined;
  getOpponAvailTokens: (() => number) | undefined;
  getCurrPlyrScore: (() => void) | undefined;
  getOpponentScore: (() => void) | undefined;
  chooseLayout: ((layout: Layout) => void) | undefined;
  getSpacesControlledByToken:
    | ((spaceID: string) => [string, string][])
    | undefined;

  constructor(board: GameBoard, currPlyrID: PlayerID) {
    this.currPlyrID = currPlyrID;
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
    this.undoButton.disabled = true;
    this.endTurnButton = document.getElementById(
      'endTurnButton'
    ) as HTMLButtonElement;
    this.endTurnButton.disabled = true;
    this.currPlyrIcon = document.getElementById('playerIcon') as HTMLElement;
    this.opponentIcon = document.getElementById('enemyIcon') as HTMLElement;
    this.currPlyrHUD = document.getElementById('playerHUD') as HTMLElement;
    this.opponentHUD = document.getElementById('enemyHUD') as HTMLElement;
    this.currPlyrHUDID = document.getElementById('playerID') as HTMLElement;
    this.opponentHUDID = document.getElementById('enemyID') as HTMLElement;
    this.gameOverBox = document.getElementById('gameOverBox') as HTMLElement;
    this.disconnectedAlert = document.getElementById(
      'disconnectedBox'
    ) as HTMLElement;
    this.winnerText = document.getElementById('winnerText') as HTMLElement;
    this.pickupSound = document.getElementById(
      'clickSound'
    ) as HTMLMediaElement;
    this.dropSound = document.getElementById('dropSound') as HTMLMediaElement;
    this.menuButton = document.getElementById(
      'menuButton'
    ) as HTMLButtonElement;
    this.closeMenuButton = document.getElementById(
      'closeMenuButton'
    ) as HTMLButtonElement;
    this.menu = document.getElementById('menu-popup') as HTMLElement;
    this.rulesButton = document.getElementById(
      'rulesButton'
    ) as HTMLButtonElement;
    this.closeRulesButton = document.getElementById(
      'closeRulesButton'
    ) as HTMLButtonElement;
    this.rules = document.getElementById('rules') as HTMLElement;
    this.overlay = document.getElementById('overlay') as HTMLElement;
    this.chooseLayoutOverlay = document.getElementById(
      'chooseLayoutOverlay'
    ) as HTMLElement;
    this.chooseLayoutMenu = document.getElementById(
      'chooseLayout'
    ) as HTMLElement;
    this.layoutButtons = document.querySelectorAll(
      '.layoutButton'
    ) as NodeListOf<HTMLButtonElement>;
    this.howToPlayInfo = document.getElementById(
      'howToPlayInfo'
    ) as HTMLElement;
    this.howToPlayButton = document.getElementById(
      'howToPlayButton'
    ) as HTMLButtonElement;

    // make sure board and hand are empty
    while (this.gameBoard.firstChild) {
      this.gameBoard.removeChild(this.gameBoard.firstChild);
    }
    const oldCards = this.playerHandContainer.getElementsByClassName('card');
    while (oldCards.length > 0) {
      if (oldCards[0].parentNode)
        oldCards[0].parentNode.removeChild(oldCards[0]);
    }
    while (this.influenceTokenContainer.firstChild) {
      this.influenceTokenContainer.removeChild(
        this.influenceTokenContainer.firstChild
      );
    }

    this.movesArr = [];
    this.createBoardSpaces(board);
    // create initial influence token
    const token = this.createPlayerToken();
    this.influenceTokenContainer.appendChild(token);

    // drag and drop methods

    const boardSpaces = document.querySelectorAll('.boardSpace');

    boardSpaces.forEach((space) => {
      space.addEventListener(
        'dragover',
        function (event) {
          // prevent default to allow drop
          event.preventDefault();
        },
        false
      );
    });

    boardSpaces.forEach((space) => {
      space.addEventListener(
        'dragenter',
        function (event) {
          event.preventDefault();
          // highlight potential drop target when the draggable element enters it
          const targetSpace = event.target as HTMLInputElement;
          if (targetSpace.classList) {
            targetSpace.classList.add('dragenter');
          }
        },
        false
      );
    });

    boardSpaces.forEach((space) => {
      space.addEventListener(
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
    });

    boardSpaces.forEach((space) => {
      space.addEventListener('drop', (event) => {
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
          this.dropSound.play();
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
            this.movesArr.push({
              draggedEle: this.draggedElement,
              targetSpace: targetSpace
            });
            //enable undo button
            this.undoButton.disabled = false;
            // play can end turn after placing a card
            this.endTurnButton.disabled = false;
            // or place a token
          } else if (this.draggedElement.classList.contains('influenceToken')) {
            this.draggedElement.parentNode.removeChild(this.draggedElement);
            targetSpace.appendChild(this.draggedElement);
            this.disableAllTokenDragging();
            if (this.sendTokenPlayToModel) {
              this.sendTokenPlayToModel(targetSpace.id);
            }
            // save move information for undo
            this.movesArr.push({
              draggedEle: this.draggedElement,
              targetSpace: targetSpace
            });
            this.undoButton.disabled = false;
          }
        }
      });
    });

    document.addEventListener('dragend', () => {
      // remove all available spaces highlighting
      this.removeSpaceHighlighting();
    });

    // highlight which spaces are controlled by a certain token
    boardSpaces.forEach((space) => {
      space.addEventListener('click', () => {
        this.removeControlledSpacesHighlighting();
        this.highlightControlledSpaces(space);
      });
    });

    this.howToPlayButton.addEventListener('click', () => {
      this.howToPlayInfo.classList.remove('active');
      this.overlay.classList.remove('active');
    });

    this.undoButton.addEventListener('click', () => {
      this.removeControlledSpacesHighlighting();
      this.removeSpaceHighlighting();
      this.pickupSound.play();
      if (this.movesArr.length > 0) {
        const moveObj = this.movesArr.pop()!;
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
          this.endTurnButton.disabled = true;
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

    // menu modals and buttons
    this.menuButton.addEventListener('click', () => {
      this.removeControlledSpacesHighlighting();
      this.removeSpaceHighlighting();
      this.openModal(this.menu);
    });

    this.closeMenuButton.addEventListener('click', () => {
      this.closeModal(this.menu);
    });

    this.overlay.addEventListener('click', () => {
      const modals = document.querySelectorAll('.modal.active');
      modals.forEach((modal) => {
        this.closeModal(modal);
      });
    });

    this.rulesButton.addEventListener('click', () => {
      this.openModal(this.rules);
    });

    this.closeRulesButton.addEventListener('click', () => {
      rules.classList.remove('active');
    });

    this.rules.addEventListener('click', (event) => {
      if (event.target === this.rules) {
        rules.classList.remove('active');
      }
    });
  }

  protected dragstartHandler = (event: any) => {
    this.removeControlledSpacesHighlighting();
    this.removeSpaceHighlighting();
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropeffect = 'move';
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
    this.pickupSound.play();
  };

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

  protected createCard = (card: Card) => {
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
    // add drag drop listener
    cardDiv.addEventListener('dragstart', this.dragstartHandler);

    return cardDiv;
  };

  protected createPlayerToken() {
    const tokenID = this.currPlyrID === 'Player 1' ? 'Player1' : 'Player2';
    const token = this.createElement(
      'div',
      'influenceToken',
      `${tokenID}Token`
    );
    token.addEventListener('dragstart', this.dragstartHandler);
    return token;
  }

  protected createEnemyToken() {
    const tokenID = this.currPlyrID === 'Player 1' ? 'Player2' : 'Player1';
    return this.createElement(
      'div',
      'influenceToken',
      `${tokenID}Token`,
      'enemyToken'
    );
  }

  protected updateScore() {
    if (
      this.getCurrPlyrScore &&
      this.getOpponentScore &&
      this.getCurrPlyrAvailTokens &&
      this.getOpponAvailTokens
    ) {
      const currPlyrScore = this.getCurrPlyrScore();
      const opponentScore = this.getOpponentScore();
      const currPlyrTokens = this.getCurrPlyrAvailTokens();
      const opponentTokens = this.getOpponAvailTokens();
      this.currPlyrHUD.textContent = `Score ${currPlyrScore} Tokens ${currPlyrTokens}`;
      this.opponentHUD.textContent = `Score ${opponentScore} Tokens ${opponentTokens}`;

      if (currPlyrScore > opponentScore) {
        this.currPlyrIcon.classList.remove('losing');
        this.currPlyrIcon.classList.add('winning');
        this.opponentIcon.classList.remove('winning');
        this.opponentIcon.classList.add('losing');
      } else if (currPlyrScore < opponentScore) {
        this.opponentIcon.classList.remove('losing');
        this.opponentIcon.classList.add('winning');
        this.currPlyrIcon.classList.remove('winning');
        this.currPlyrIcon.classList.add('losing');
      }
    }
  }

  protected checkForGameEnd = () => {
    if (
      !this.getAvailCardSpaces ||
      !this.getCurrPlyrScore ||
      !this.getOpponentScore ||
      !this.getCurrPlyrAvailTokens ||
      !this.getOpponAvailTokens
    )
      throw new Error('callback methods are undefined');
    if (this.getAvailCardSpaces().length === 0) {
      this.disableAllCardDragging();
      this.disableAllTokenDragging();
      this.opponentIcon.classList.remove('active');
      this.currPlyrIcon.classList.remove('active');
      const currPlyrScore = this.getCurrPlyrScore();
      const opponentScore = this.getOpponentScore();
      if (currPlyrScore > opponentScore) {
        this.winnerText.innerHTML = `${this.currPlyrID} wins`;
      } else if (opponentScore > currPlyrScore) {
        this.winnerText.innerHTML =
          this.winnerText.innerHTML = `${this.opponentHUDID.innerText} wins`;
      } else {
        this.winnerText.innerHTML = "It's a tie!";
      }
      this.gameOverBox.style.visibility = 'visible';
      return true;
    }
    return false;
  };

  protected addInfluenceTokenToHand() {
    // if there's already a token in hand, return
    if (this.influenceTokenContainer.querySelector('.influenceToken')) {
      return;
    }
    if (this.getCurrPlyrAvailTokens) {
      if (this.getCurrPlyrAvailTokens() > 0) {
        const token = this.createPlayerToken();
        this.influenceTokenContainer.appendChild(token);
      }
    }
  }

  public enableCardHandDragging() {
    const CardsArr = Array.from(
      this.playerHandContainer.querySelectorAll('.card')
    ) as HTMLElement[];
    CardsArr.forEach((ele) => {
      if (ele.classList.contains('card')) {
        ele.draggable = true;
      }
    });
  }

  protected disableAllCardDragging() {
    const CardsArr = Array.from(
      document.querySelectorAll('.card')
    ) as HTMLElement[];
    CardsArr.forEach((ele) => {
      if (ele.classList.contains('card') && ele.draggable) {
        ele.draggable = false;
      }
    });
  }

  protected enableTokenDragging() {
    const token = this.influenceTokenContainer.firstChild as HTMLElement;
    if (token) {
      token.draggable = true;
    }
  }

  protected disableAllTokenDragging() {
    const tokenArr = Array.from(
      document.querySelectorAll('.influenceToken')
    ) as HTMLElement[];
    tokenArr.forEach((ele) => {
      if (ele.classList.contains('influenceToken') && ele.draggable) {
        ele.draggable = false;
      }
    });
  }

  protected addCardToSpace = (cardDiv: HTMLElement, spaceID: string) => {
    const boardSpace = document.getElementById(spaceID);
    boardSpace?.appendChild(cardDiv);
  };

  protected highlightAvailableSpaces = (
    getAvailableSpacesCallback: () => BoardSpace[]
  ) => {
    this.removeControlledSpacesHighlighting();
    const availableSpaces = getAvailableSpacesCallback();
    availableSpaces.forEach((space) => {
      const spaceID = space.getID();
      const availableSpace = document.getElementById(spaceID);
      if (availableSpace) {
        availableSpace.classList.add('playable-space');
      }
    });
  };

  protected removeSpaceHighlighting() {
    Array.from(this.gameBoard.children).forEach((space) => {
      space.classList.remove('playable-space');
    });
  }
  // show decktet icons from custom font for pawns, courts, and crowns
  protected prepareValueForDisplay(value: number) {
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

  protected openModal(modal: Element | HTMLElement) {
    if (modal == null) return;
    modal.classList.add('active');
    this.overlay.classList.add('active');
  }

  protected closeModal(modal: Element | HTMLElement) {
    if (modal == null) return;
    modal.classList.remove('active');
    this.overlay.classList.remove('active');
  }

  protected highlightControlledSpaces(space: Element) {
    const token = space.querySelector('.influenceToken');
    if (!token) return; // no token found, nothing to do.
    if (!this.getSpacesControlledByToken)
      throw new Error('callback not provided');
    const controlledSpaces = this.getSpacesControlledByToken(space.id);
    if (controlledSpaces.length === 0) return;
    for (const [spaceID, suit] of controlledSpaces) {
      const spaceEle = document.getElementById(spaceID);
      if (!spaceEle) throw new Error('space not found');
      const suitEle = spaceEle.querySelector(`.${suit}`);
      if (!suitEle) throw new Error('suit not found');
      if (token.classList.contains('Player1Token')) {
        suitEle.classList.add('p1-control');
      } else suitEle.classList.add('p2-control');
    }
  }

  protected removeControlledSpacesHighlighting() {
    document.querySelectorAll('.card-cell').forEach((ele) => {
      ele.classList.remove('p1-control');
      ele.classList.remove('p2-control');
    });
  }

  playerDrawCardCB = (card: Card) => {
    const cardDiv = this.createCard(card);
    this.playerHandContainer?.appendChild(cardDiv);
    cardDiv.draggable = false;
  };

  nonPlayerCardPlacementCB = (card: Card, boardSpace: BoardSpace) => {
    const cardDiv = this.createCard(card);
    cardDiv.classList.add('roll-in-top');
    this.addCardToSpace(cardDiv, boardSpace.getID());
    this.checkForGameEnd();
  };

  nonPlayerTokenPlacementCB = (boardSpace: BoardSpace) => {
    const spaceID = boardSpace.getID();
    const token = this.createEnemyToken();
    const spaceElement = document.getElementById(spaceID);
    spaceElement?.appendChild(token);
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

  bindComputerTakeTurn(computerTurnCB: () => void) {
    this.computerTakeTurn = computerTurnCB;
  }

  bindGetCardDrawFromModel(drawCardCB: () => void) {
    this.getCardDrawFromModel = drawCardCB;
  }

  bindGetCurrPlyrAvailTokens(availTokensCB: () => number) {
    this.getCurrPlyrAvailTokens = availTokensCB;
  }

  bindGetOpponAvailTokens(availTokensCB: () => number) {
    this.getOpponAvailTokens = availTokensCB;
  }

  bindGetCurrPlyrScore(getCurrPlyrScoreCB: () => void) {
    this.getCurrPlyrScore = getCurrPlyrScoreCB;
  }

  bindGetOpponentScore(getOpponentScoreCB: () => void) {
    this.getOpponentScore = getOpponentScoreCB;
  }

  bindCreateLayout(createLayoutCB: (layout: Layout) => void) {
    this.chooseLayout = createLayoutCB;
  }

  bindGetControlledSpaces(
    getControlledSpacesCB: (spaceID: string) => [string, string][]
  ) {
    this.getSpacesControlledByToken = getControlledSpacesCB;
  }
}

export class SinglePlayerView extends View {
  constructor(board: GameBoard, currPlyrID: PlayerID) {
    super(board, currPlyrID);
    this.currPlyrHUDID.innerHTML = `Player`;
    this.opponentHUDID.innerHTML = `Computer`;
    this.currPlyrIcon.classList.add('player1Icon');
    this.opponentIcon.classList.add('player2Icon');
    this.currPlyrIcon.classList.add('losing');
    this.opponentIcon.classList.add('losing');
    // use single player specific endturn function
    this.endTurnButton.addEventListener('click', this.endTurnButtonCB);
    // show layout menu
    this.chooseLayoutMenu.classList.add('active');
    this.chooseLayoutOverlay.classList.add('active');

    this.layoutButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.chooseLayoutMenu.classList.remove('active');
        this.chooseLayoutOverlay.classList.remove('active');
        const layoutChoice = button.dataset.layout as Layout;
        if (!layoutChoice || !this.chooseLayout) return;
        this.chooseLayout(layoutChoice);

        this.howToPlayInfo.classList.add('active');
        this.overlay.classList.add('active');
      });
    });
  }

  endTurnButtonCB = () => {
    this.removeControlledSpacesHighlighting();
    this.pickupSound.play();
    this.currPlyrIcon.classList.remove('active');
    this.opponentIcon.classList.add('active');
    if (this.computerTakeTurn) {
      this.computerTakeTurn();
    }
    if (this.getCardDrawFromModel) {
      this.getCardDrawFromModel();
    }
    this.addInfluenceTokenToHand();
    this.enableCardHandDragging();
    this.disableAllTokenDragging();
    this.undoButton.disabled = true;
    this.endTurnButton.disabled = true;
    this.updateScore();
    this.checkForGameEnd();
    this.currPlyrIcon.classList.add('active');
    this.opponentIcon.classList.remove('active');
  };
}

export class MultiPlayerView extends View {
  socket: Socket;
  roomNumber: HTMLElement;
  constructor(board: GameBoard, socket: Socket, currPlyrID: PlayerID) {
    super(board, currPlyrID);
    this.socket = socket;
    this.currPlyrID = currPlyrID;

    if (this.currPlyrID === 'Player 1') {
      this.currPlyrHUDID.innerHTML = 'Player 1';
      this.currPlyrIcon.classList.add('player1Icon');
      this.currPlyrIcon.classList.add('losing');
      this.currPlyrIcon.classList.add('active');
      this.howToPlayInfo.classList.add('active');
      this.overlay.classList.add('active');
    } else {
      this.currPlyrHUDID.innerHTML = 'Player 2';
      this.opponentHUDID.innerHTML = 'Player 1';
      this.opponentIcon.classList.add('player1Icon');
      this.opponentIcon.classList.add('losing');
      this.opponentIcon.classList.add('active');
      this.currPlyrIcon.classList.add('player2Icon');
      this.currPlyrIcon.classList.add('losing');
    }
    // get player 2 to choose layout
    if (currPlyrID === 'Player 2') {
      this.chooseLayoutMenu.classList.add('active');
      this.chooseLayoutOverlay.classList.add('active');

      this.layoutButtons.forEach((button) => {
        button.addEventListener('click', () => {
          this.chooseLayoutMenu.classList.remove('active');
          this.chooseLayoutOverlay.classList.remove('active');
          const layoutChoice = button.dataset.layout as Layout;
          if (!layoutChoice || !this.chooseLayout) return;
          this.chooseLayout(layoutChoice);
          this.howToPlayInfo.classList.add('active');
          this.overlay.classList.add('active');
        });
      });
    }

    this.roomNumber = document.getElementById(
      'roomNumber'
    ) as HTMLButtonElement;

    this.endTurnButton.addEventListener('click', this.endTurnButtonCB);

    this.socket.on('connectToRoom', (roomNumber) => {
      this.roomNumber.innerHTML = `In game room ${roomNumber} as ${this.currPlyrID}`;
    });

    this.socket.on('p2Ready', () => {
      if (this.currPlyrID === 'Player 2') return;
      this.opponentHUDID.innerHTML = 'Player 2';
      this.opponentIcon.classList.add('player2Icon');
      this.opponentIcon.classList.add('losing');
    });

    this.socket.on('enableP1CardDragging', () => {
      if (this.currPlyrID === 'Player 1') this.enableCardHandDragging();
    });

    this.socket.on('beginNextTurn', (player) => {
      if (this.currPlyrID !== player) return;
      this.updateScore();
      this.currPlyrIcon.classList.add('active');
      this.opponentIcon.classList.remove('active');
      this.enableCardHandDragging();
      this.checkForGameEnd();
    });

    socket.on('disconnect', () => {
      this.disconnectedAlert.style.visibility = 'visible';
    });
  }

  endTurnButtonCB = () => {
    this.removeControlledSpacesHighlighting();
    this.pickupSound.play();
    if (this.getCardDrawFromModel) {
      this.getCardDrawFromModel();
    }
    this.addInfluenceTokenToHand();
    this.disableAllTokenDragging();
    this.disableAllCardDragging();
    this.undoButton.disabled = true;
    this.endTurnButton.disabled = true;
    this.updateScore();
    this.sendMoveToOpponent();
    // reset moves array
    this.movesArr = [];
    this.currPlyrIcon.classList.remove('active');
    this.opponentIcon.classList.add('active');
    this.checkForGameEnd();
  };

  sendMoveToOpponent() {
    const cardID = this.movesArr[0].draggedEle.id;
    const spaceID = this.movesArr[0].targetSpace.id;
    let tokenMove;
    if (this.movesArr.length > 1) {
      tokenMove = this.movesArr[1].targetSpace.id;
    }
    this.socket.emit(
      'sendPlayerMove',
      this.currPlyrID,
      cardID,
      spaceID,
      tokenMove
    );
  }
}
