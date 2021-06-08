export class View {
    constructor(board) {
        this.bindPlayerPlayCard = (callback) => {
            let draggedCard;
            document.addEventListener('dragstart', (event) => {
                draggedCard = event.target;
                this.highlightAvailableCardSpaces(callback);
            });
            document.addEventListener('dragover', function (event) {
                // prevent default to allow drop
                event.preventDefault();
            }, false);
            document.addEventListener('dragenter', function (event) {
                // highlight potential drop target when the draggable element enters it
                const targetSpace = event.target;
                if (targetSpace.classList) {
                    targetSpace.classList.add('dragenter');
                }
            }, false);
            document.addEventListener('dragleave', function (event) {
                // highlight potential drop target when the draggable element enters it
                const targetSpace = event.target;
                if (targetSpace.classList) {
                    targetSpace.classList.remove('dragenter');
                }
            }, false);
            document.addEventListener('drop', (event) => {
                event.preventDefault();
                const targetSpace = event.target;
                if (targetSpace.classList.contains('playable-space')) {
                    if (draggedCard && draggedCard.parentNode && targetSpace) {
                        draggedCard.draggable = false;
                        draggedCard.parentNode.removeChild(draggedCard);
                        targetSpace.appendChild(draggedCard);
                    }
                }
            });
            document.addEventListener('dragend', (event) => {
                const draggedCard = event.target;
                Array.from(this.gameBoard.children).forEach((space) => {
                    space.classList.remove('playable-space');
                });
            });
        };
        this.highlightAvailableCardSpaces = (getAvailableSpacesCallback) => {
            const availableSpaces = getAvailableSpacesCallback();
            availableSpaces.forEach((space) => {
                const spaceID = space.getID();
                const availableSpace = document.getElementById(spaceID);
                if (availableSpace) {
                    availableSpace.classList.add('playable-space');
                }
            });
        };
        this.app = this.getElement('#root');
        this.gameBoard = this.getElement('.gameboard-grid-container');
        this.drawDeck = this.getElement('drawDeck');
        this.playerHandGrid = this.getElement('.player-hand-grid-container');
        this.createBoardSpaces(board);
    }
    getElement(selector) {
        const element = document.querySelector(selector);
        return element;
    }
    createElement(tag, ...classNames) {
        const element = document.createElement(tag);
        if (classNames)
            element.classList.add(...classNames);
        return element;
    }
    createBoardSpaces(board) {
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
            spaceDiv.id = spaceID;
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
            }
            else {
                isDark = true;
            }
            this.gameBoard.appendChild(spaceDiv);
        });
    }
    createCard(card) {
        // get the values from the card
        const id = card.getId();
        const suits = card.getAllSuits();
        const cardComponents = [];
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
    createToken(player) {
        return this.createElement('div', `card-cell token ${player}`);
    }
    addCardToSpace(cardDiv, spaceID) {
        const boardSpace = document.getElementById(spaceID);
        boardSpace === null || boardSpace === void 0 ? void 0 : boardSpace.appendChild(cardDiv);
    }
    addTokenToSpace(player, spaceID) {
        const boardSpace = this.getElement(spaceID);
        boardSpace === null || boardSpace === void 0 ? void 0 : boardSpace.appendChild(this.createToken(player));
    }
    playerDrawCard(card) {
        var _a;
        const cardDiv = this.createCard(card);
        cardDiv.draggable = true;
        (_a = this.playerHandGrid) === null || _a === void 0 ? void 0 : _a.appendChild(cardDiv);
    }
    playerPlayCard(card, boardSpace) {
        this.getElement;
    }
    computerPlayCard(card, boardSpace) {
        const cardDiv = this.createCard(card);
        this.addCardToSpace(cardDiv, boardSpace.getID());
    }
    prepareValueForDisplay(value) {
        switch (value) {
            case 0:
                return '.';
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
