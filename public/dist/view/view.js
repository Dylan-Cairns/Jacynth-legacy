export class View {
    constructor(board) {
        this.createCard = (card) => {
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
        };
        this.createToken = (playerID) => {
            return this.createElement('div', `card-cell token ${playerID}`);
        };
        this.addCardToSpace = (cardDiv, spaceID) => {
            const boardSpace = document.getElementById(spaceID);
            boardSpace === null || boardSpace === void 0 ? void 0 : boardSpace.appendChild(cardDiv);
        };
        this.addTokenToSpace = (playerID, spaceID) => {
            const boardSpace = this.getElement(spaceID);
            boardSpace === null || boardSpace === void 0 ? void 0 : boardSpace.appendChild(this.createToken(playerID));
        };
        this.playerDrawCard = (card) => {
            var _a;
            const cardDiv = this.createCard(card);
            cardDiv.draggable = true;
            (_a = this.playerHandContainer) === null || _a === void 0 ? void 0 : _a.appendChild(cardDiv);
        };
        // playerPlayCard(card: Card, boardSpace: BoardSpace) {
        //   this.getElement;
        // }
        this.nonPlayerCardPlacement = (card, boardSpace) => {
            const cardDiv = this.createCard(card);
            this.addCardToSpace(cardDiv, boardSpace.getID());
        };
        this.bindPlayerInterface = (availCardSpacesCB, availTokenSpacesCB, sendCardPlayToModelCB, sendTokenPlaytoModelCB, undoPlayCardCB, undoPlaceTokenCB) => {
            let draggedElement;
            // arr of spaces where a card or token has been played, for undo
            let undoMovesArr;
            // get all available spaces from the model
            document.addEventListener('dragstart', (event) => {
                draggedElement = event.target;
                if (draggedElement.classList.contains('card')) {
                    this.highlightAvailableSpaces(availCardSpacesCB);
                }
                else if (draggedElement.classList.contains('influenceToken')) {
                    this.highlightAvailableSpaces(availTokenSpacesCB);
                }
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
                // remove highlighting
                const targetSpace = event.target;
                if (targetSpace.classList) {
                    targetSpace.classList.remove('dragenter');
                }
            }, false);
            document.addEventListener('drop', (event) => {
                event.preventDefault();
                const targetSpace = event.target;
                targetSpace.classList.remove('dragenter');
                // check space is playable & required attributes are defined
                if (targetSpace.classList.contains('playable-space') &&
                    draggedElement.parentNode &&
                    targetSpace) {
                    // if dragged item is a card, place the card,
                    // disable dragging of remaining cards and enable dragging token,
                    // and invoke playcard callback to trigger change in model
                    if (draggedElement.classList.contains('card')) {
                        const playerCardsArr = Array.from(draggedElement.parentNode.children);
                        playerCardsArr.forEach((ele) => {
                            if (ele.classList.contains('card') && ele.draggable) {
                                ele.draggable = false;
                            }
                            else if (ele.classList.contains('influenceTokenContainer')) {
                                const token = ele.firstElementChild;
                                token.draggable = true;
                            }
                        });
                        draggedElement.parentNode.removeChild(draggedElement);
                        targetSpace.appendChild(draggedElement);
                        sendCardPlayToModelCB(targetSpace.id, draggedElement.id);
                        // save move information for undo
                        undoMovesArr.push({
                            draggedEle: draggedElement,
                            targetSpace: targetSpace
                        });
                        //enable undo button
                        this.undoButton.disabled = false;
                        // or place a token
                    }
                    else if (draggedElement.classList.contains('influenceToken')) {
                        draggedElement.parentNode.removeChild(draggedElement);
                        targetSpace.appendChild(draggedElement);
                        draggedElement.draggable = false;
                        sendTokenPlaytoModelCB(targetSpace.id);
                        // save move information for undo
                        undoMovesArr.push({
                            draggedEle: draggedElement,
                            targetSpace: targetSpace
                        });
                        this.undoButton.disabled = false;
                    }
                }
            });
            document.addEventListener('dragend', (event) => {
                // remove all available spaces highlighting
                const draggedCard = event.target;
                Array.from(this.gameBoard.children).forEach((space) => {
                    space.classList.remove('playable-space');
                });
            });
            this.undoButton.addEventListener('click', () => {
                if (undoMovesArr.length > 0) {
                    const moveObj = undoMovesArr.pop();
                    const cardOrTokenToUndo = moveObj.draggedEle;
                    const targetSpace = moveObj.targetSpace;
                    if (cardOrTokenToUndo.classList.contains('card')) {
                        this.playerHandContainer.appendChild(cardOrTokenToUndo);
                        targetSpace.removeChild(cardOrTokenToUndo);
                        undoPlayCardCB(targetSpace.id);
                        if (undoMovesArr.length === 0)
                            this.undoButton.disabled = true;
                    }
                    else if (cardOrTokenToUndo === null || cardOrTokenToUndo === void 0 ? void 0 : cardOrTokenToUndo.classList.contains('influenceToken')) {
                        this.playerHandContainer.appendChild(cardOrTokenToUndo);
                        targetSpace.removeChild(cardOrTokenToUndo);
                        undoPlaceTokenCB(targetSpace.id);
                        if (undoMovesArr.length === 0)
                            this.undoButton.disabled = true;
                    }
                }
            });
        };
        this.highlightAvailableSpaces = (getAvailableSpacesCallback) => {
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
        this.gameBoard = this.getElement('.gameboard');
        this.drawDeck = this.getElement('drawDeck');
        this.playerHandContainer = this.getElement('.player-hand');
        this.undoButton = document.getElementById('undoButton');
        console.log(this.undoButton);
        this.endTurnButton = document.getElementById('endTurnButton');
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
            }
            else {
                isDark = true;
            }
            this.gameBoard.appendChild(spaceDiv);
        });
    }
    prepareValueForDisplay(value) {
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
}
