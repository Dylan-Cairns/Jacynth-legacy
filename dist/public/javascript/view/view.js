export class View {
    constructor(board, currPlyrID, opposPlyrID) {
        // END OF VIEW CLASS CONSTRUCTOR
        this.dragstartHandler = (event) => {
            this.removeControlledSpacesHighlighting();
            this.removeSpaceHighlighting();
            if (!event.dataTransfer)
                return;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.dropeffect = 'move';
            this.draggedElement = event.target;
            if (this.draggedElement.classList.contains('card')) {
                if (this.getAvailCardSpaces) {
                    this.highlightAvailableSpaces(this.getAvailCardSpaces);
                }
            }
            else if (this.draggedElement.classList.contains('influenceToken')) {
                if (this.getAvailTokenSpaces) {
                    this.highlightAvailableSpaces(this.getAvailTokenSpaces);
                }
            }
            this.pickupSound.play();
        };
        //preload game images
        this.preload_images = () => {
            const preloadImages = (srcArr) => {
                const loadImage = (src) => {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = function () {
                            resolve(img);
                        };
                        img.onerror = img.onabort = function () {
                            reject(src);
                        };
                        img.src = src;
                        this.preloadedImagesArr.push(img);
                    });
                };
                const promises = [];
                for (let i = 0; i < srcArr.length; i++) {
                    promises.push(loadImage(srcArr[i]));
                }
                return Promise.all(promises);
            };
            const srcArr = [
                '../assets/suns.svg',
                '../assets/moons.svg',
                '../assets/wyrms.svg',
                '../assets/knots.svg',
                '../assets/leaves.svg',
                '../assets/waves.svg',
                '../assets/meeple_player.svg',
                '../assets/meeple_enemy.svg',
                '../assets/sailor_losing.svg',
                '../assets/penitent_losing.svg',
                '../assets/sailor_winning.svg',
                '../assets/penitent_winning.svg',
                '../assets/dinner.png',
                '../assets/suits_ranks_basic.png'
            ];
            preloadImages(srcArr).then((imgs) => {
                // remove loading screen
                document.getElementById('spinner').style.visibility = 'hidden';
                document.getElementById('loadScreen').classList.remove('active');
            }, function (errImg) {
                console.log('image preloading failed!');
                console.log(errImg);
            });
        };
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
            // add drag drop listener
            cardDiv.addEventListener('dragstart', this.dragstartHandler);
            return cardDiv;
        };
        this.checkForGameEnd = () => {
            if (!this.getAvailCardSpaces ||
                !this.getCurrPlyrScore ||
                !this.getOpponentScore ||
                !this.getCurrPlyrAvailTokens ||
                !this.getOpponAvailTokens)
                throw new Error('callback methods are undefined');
            if (this.getRemainingSpaces && this.getRemainingSpaces() === 0) {
                this.disableAllCardDragging();
                this.disableAllTokenDragging();
                this.opponentIcon.classList.remove('active');
                this.currPlyrIcon.classList.remove('active');
                const currPlyrScore = this.getCurrPlyrScore();
                const opponentScore = this.getOpponentScore();
                if (currPlyrScore > opponentScore) {
                    this.winnerText.innerHTML = `${this.currPlyrID} wins`;
                }
                else if (opponentScore > currPlyrScore) {
                    this.winnerText.innerHTML = `${this.opposPlrID} wins`;
                }
                else {
                    this.winnerText.innerHTML = "It's a tie!";
                }
                // show game over message
                this.gameOverBox.style.visibility = 'visible';
                // if this was a single player game, reset local storage copy of in progress game
                if (this.resetStorage && gameType === 'singleplayer')
                    this.resetStorage();
                if (this.currPlyrID === 'Player 1' && this.addRecordtoDB)
                    this.addRecordtoDB();
                return true;
            }
            return false;
        };
        this.addCardToSpace = (cardDiv, spaceID) => {
            const boardSpace = document.getElementById(spaceID);
            boardSpace === null || boardSpace === void 0 ? void 0 : boardSpace.appendChild(cardDiv);
        };
        this.highlightAvailableSpaces = (getAvailableSpacesCallback) => {
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
        this.restoreGame = () => {
            this.updateScore();
            const handJSON = localStorage.getItem(`${this.currPlyrID}-hand`);
            const turnState = localStorage.getItem('turnStatus');
            switch (turnState) {
                case null:
                    this.enableCardHandDragging();
                    break;
                case 'playedCard':
                    this.disableAllCardDragging();
                    this.enableTokenDragging();
                    this.undoButton.disabled = false;
                    this.endTurnButton.disabled = false;
                    break;
                case 'playedToken':
                    this.disableAllCardDragging();
                    this.disableAllTokenDragging();
                    this.undoButton.disabled = false;
                    this.endTurnButton.disabled = false;
                    break;
            }
            // check wether there is move information stored in local backup. If so,
            // check wether a token has been played this turn. If a token was *not*
            // played this turn, and the user still has tokens,
            // then create a token in the users hand.
            const undoMovesJSON = localStorage.getItem('undoMoves');
            const undoMove = undoMovesJSON
                ? JSON.parse(undoMovesJSON).pop()
                : undefined;
            if (!(undoMove && undoMove.draggedEle === 'influenceToken') &&
                this.getCurrPlyrAvailTokens &&
                this.getCurrPlyrAvailTokens() > 0) {
                this.addInfluenceTokenToHand();
            }
        };
        this.playerDrawCardCB = (card) => {
            var _a;
            const cardDiv = this.createCard(card);
            (_a = this.playerHandContainer) === null || _a === void 0 ? void 0 : _a.appendChild(cardDiv);
            cardDiv.draggable = false;
        };
        this.nonPlayerCardPlacementCB = (card, boardSpace) => {
            this.removeControlledSpacesHighlighting();
            const cardDiv = this.createCard(card);
            cardDiv.classList.add('roll-in-top');
            this.addCardToSpace(cardDiv, boardSpace.getID());
            this.checkForGameEnd();
        };
        this.nonPlayerTokenPlacementCB = (boardSpace, playerID) => {
            const spaceID = boardSpace.getID();
            const token = playerID === this.currPlyrID
                ? this.createPlayerToken()
                : this.createEnemyToken();
            const spaceElement = document.getElementById(spaceID);
            spaceElement === null || spaceElement === void 0 ? void 0 : spaceElement.appendChild(token);
        };
        this.currPlyrID = currPlyrID;
        this.opposPlrID = opposPlyrID;
        this.app = document.querySelector('#root');
        this.gameBoard = document.querySelector('.gameboard');
        this.playerHandContainer = document.querySelector('.player-hand');
        this.influenceTokenContainer = document.querySelector('.influenceTokenContainer');
        this.undoButton = document.getElementById('undoButton');
        this.undoButton.disabled = true;
        this.endTurnButton = document.getElementById('endTurnButton');
        this.endTurnButton.disabled = true;
        this.currPlyrIcon = document.getElementById('playerIcon');
        this.opponentIcon = document.getElementById('enemyIcon');
        this.currPlyrHUD = document.getElementById('playerHUD');
        this.opponentHUD = document.getElementById('enemyHUD');
        this.currPlyrHUDID = document.getElementById('playerID');
        this.opponentHUDID = document.getElementById('enemyID');
        this.gameOverBox = document.getElementById('gameOverBox');
        this.preloadedImagesArr = [];
        this.disconnectedAlert = document.getElementById('disconnectedBox');
        this.winnerText = document.getElementById('winnerText');
        this.pickupSound = document.getElementById('pickupSound');
        this.dropSound = document.getElementById('dropSound');
        this.overlay = document.getElementById('overlay');
        this.newGameOptionsOverlay = document.getElementById('newGameOptionsOverlay');
        this.newGameMenu = document.getElementById('newGameOptionsModal');
        this.gameOptionsForm = document.getElementById('gameOptionsForm');
        this.howToPlayInfo = document.getElementById('howToPlayInfo');
        this.howToPlayButton = document.getElementById('howToPlayButton');
        //preload images
        this.preload_images();
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
            this.influenceTokenContainer.removeChild(this.influenceTokenContainer.firstChild);
        }
        this.movesArr = [];
        this.createBoardSpaces(board);
        // create initial influence token, only if this is:
        // - a new single player game (not restoring from backup)
        // - a multiplayer game
        if (!localStorage.getItem('layout') || gameType === 'multiplayer') {
            const token = this.createPlayerToken();
            this.influenceTokenContainer.appendChild(token);
        }
        // drag and drop methods
        const boardSpaces = document.querySelectorAll('.boardSpace');
        boardSpaces.forEach((space) => {
            space.addEventListener('dragover', function (event) {
                // prevent default to allow drop
                event.preventDefault();
            }, false);
        });
        boardSpaces.forEach((space) => {
            space.addEventListener('dragenter', function (event) {
                event.preventDefault();
                // highlight potential drop target when the draggable element enters it
                const targetSpace = event.target;
                if (targetSpace.classList) {
                    targetSpace.classList.add('dragenter');
                }
            }, false);
        });
        boardSpaces.forEach((space) => {
            space.addEventListener('dragleave', function (event) {
                // remove highlighting
                const targetSpace = event.target;
                if (targetSpace.classList) {
                    targetSpace.classList.remove('dragenter');
                }
            }, false);
        });
        boardSpaces.forEach((space) => {
            space.addEventListener('drop', (event) => {
                event.preventDefault();
                const targetSpace = event.target;
                targetSpace.classList.remove('dragenter');
                // check space is playable & required attributes are defined
                if (!(targetSpace.classList.contains('playable-space') &&
                    this.draggedElement &&
                    this.draggedElement.parentNode &&
                    targetSpace))
                    return;
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
                    //enable undo button
                    this.undoButton.disabled = false;
                    // play can end turn after placing a card
                    this.endTurnButton.disabled = false;
                    // set turn status in localStorage
                    if (gameType === 'singleplayer')
                        localStorage.setItem('turnStatus', 'playedCard');
                    // or place a token
                }
                else if (this.draggedElement.classList.contains('influenceToken')) {
                    this.draggedElement.parentNode.removeChild(this.draggedElement);
                    targetSpace.appendChild(this.draggedElement);
                    this.disableAllTokenDragging();
                    if (this.sendTokenPlayToModel) {
                        this.sendTokenPlayToModel(targetSpace.id);
                    }
                    this.undoButton.disabled = false;
                    // set turn status in localStorage
                    if (gameType === 'singleplayer')
                        localStorage.setItem('turnStatus', 'playedToken');
                }
                // save move information for undo
                const undoMoveObj = {
                    draggedEle: this.draggedElement,
                    targetSpace: targetSpace
                };
                this.movesArr.push(undoMoveObj);
                if (gameType === 'singleplayer') {
                    // Save move information to localStorage. We can't save the HTMLElement directoy
                    // because card elements have children which won't be included in the JSON object.
                    // We could make a custom method to jsonify the children elements, but it's easier
                    // to just find the elements on the page by id later.
                    const undoMovesArr = localStorage.getItem('undoMoves')
                        ? JSON.parse(localStorage.getItem('undoMoves'))
                        : [];
                    undoMovesArr.push({
                        draggedEle: undoMoveObj.draggedEle.id
                            ? undoMoveObj.draggedEle.id
                            : 'influenceToken',
                        targetSpace: undoMoveObj.targetSpace.id
                    });
                    localStorage.setItem('undoMoves', JSON.stringify(undoMovesArr));
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
            if (this.movesArr.length > 0 || localStorage.getItem('undoMoves')) {
                let moveObj;
                if (this.movesArr.length > 0) {
                    moveObj = this.movesArr.pop();
                    const undoMovesJSON = localStorage.getItem('undoMoves');
                    if (undoMovesJSON && gameType === 'singleplayer') {
                        const undoMoves = JSON.parse(undoMovesJSON);
                        undoMoves.pop();
                        localStorage.setItem('undoMoves', JSON.stringify(undoMoves));
                    }
                }
                else {
                    // if restoring from local storage, use the boardspace id and
                    //  card or token class name to find the right div in the page.
                    // after this the moveObj can be used as normal.
                    const undoMoves = JSON.parse(localStorage.getItem('undoMoves'));
                    moveObj = undoMoves.pop();
                    localStorage.setItem('undoMoves', JSON.stringify(undoMoves));
                    moveObj.targetSpace = this.gameBoard.querySelector(`#${moveObj.targetSpace}`);
                    moveObj.draggedEle =
                        moveObj.draggedEle === 'influenceToken'
                            ? moveObj.targetSpace.querySelector('.influenceToken')
                            : moveObj.targetSpace.querySelector('.card');
                }
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
                    // update turn status in storage for resuming game
                    if (gameType === 'singleplayer')
                        localStorage.removeItem('turnStatus');
                    // if it's a token, leave undo button active.
                }
                else if (cardOrTokenToUndo === null || cardOrTokenToUndo === void 0 ? void 0 : cardOrTokenToUndo.classList.contains('influenceToken')) {
                    targetSpace.removeChild(cardOrTokenToUndo);
                    this.influenceTokenContainer.appendChild(cardOrTokenToUndo);
                    if (this.undoPlaceToken) {
                        this.undoPlaceToken(targetSpace.id);
                    }
                    this.enableTokenDragging();
                    // update turn status in storage for resuming game
                    if (gameType === 'singleplayer')
                        localStorage.setItem('turnStatus', 'playedCard');
                }
            }
        });
        // show tips for new players if it's the users first time playing.
        if (!localStorage.userHasPlayedBefore) {
            this.howToPlayInfo.classList.add('active');
            this.overlay.classList.add('active');
            localStorage.userHasPlayedBefore = 'true';
        }
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
    createPlayerToken() {
        const tokenID = this.currPlyrID === 'Player 1' ? 'Player1' : 'Player2';
        const token = this.createElement('div', 'influenceToken', `${tokenID}Token`);
        token.addEventListener('dragstart', this.dragstartHandler);
        return token;
    }
    createEnemyToken() {
        const tokenID = this.currPlyrID === 'Player 1' ? 'Player2' : 'Player1';
        return this.createElement('div', 'influenceToken', `${tokenID}Token`, 'enemyToken');
    }
    updateScore() {
        if (this.getCurrPlyrScore &&
            this.getOpponentScore &&
            this.getCurrPlyrAvailTokens &&
            this.getOpponAvailTokens) {
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
            }
            else if (currPlyrScore < opponentScore) {
                this.opponentIcon.classList.remove('losing');
                this.opponentIcon.classList.add('winning');
                this.currPlyrIcon.classList.remove('winning');
                this.currPlyrIcon.classList.add('losing');
            }
        }
    }
    addInfluenceTokenToHand() {
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
    enableCardHandDragging() {
        const CardsArr = Array.from(this.playerHandContainer.querySelectorAll('.card'));
        CardsArr.forEach((ele) => {
            if (ele.classList.contains('card')) {
                ele.draggable = true;
                ele.classList.add('draggable');
            }
        });
    }
    disableAllCardDragging() {
        const CardsArr = Array.from(document.querySelectorAll('.card'));
        CardsArr.forEach((ele) => {
            if (ele.classList.contains('card') && ele.draggable) {
                ele.draggable = false;
                ele.classList.remove('draggable');
            }
        });
    }
    enableTokenDragging() {
        const token = this.influenceTokenContainer.firstChild;
        if (token) {
            token.draggable = true;
            token.classList.add('draggable');
        }
    }
    disableAllTokenDragging() {
        const tokenArr = Array.from(document.querySelectorAll('.influenceToken'));
        tokenArr.forEach((ele) => {
            if (ele.classList.contains('influenceToken') && ele.draggable) {
                ele.draggable = false;
                ele.classList.remove('draggable');
            }
        });
    }
    removeSpaceHighlighting() {
        Array.from(this.gameBoard.children).forEach((space) => {
            space.classList.remove('playable-space');
        });
    }
    // show decktet icons from custom font for pawns, courts, and crowns
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
    openModal(modal) {
        if (modal == null)
            return;
        modal.classList.add('active');
        this.overlay.classList.add('active');
    }
    closeModal(modal) {
        if (modal == null)
            return;
        modal.classList.remove('active');
        this.overlay.classList.remove('active');
    }
    highlightControlledSpaces(space) {
        const token = space.querySelector('.influenceToken');
        if (!token)
            return; // no token found, nothing to do.
        if (!this.getSpacesControlledByToken)
            throw new Error('callback not provided');
        const controlledSpaces = this.getSpacesControlledByToken(space.id);
        if (controlledSpaces.length === 0)
            return;
        for (const [spaceID, suit] of controlledSpaces) {
            const spaceEle = document.getElementById(spaceID);
            if (!spaceEle)
                throw new Error('space not found');
            const suitEle = spaceEle.querySelector(`.${suit}`);
            if (!suitEle)
                throw new Error('suit not found');
            if (token.classList.contains('Player1Token')) {
                suitEle.classList.add('p1-control');
            }
            else
                suitEle.classList.add('p2-control');
        }
    }
    removeControlledSpacesHighlighting() {
        document.querySelectorAll('.card-cell').forEach((ele) => {
            ele.classList.remove('p1-control');
            ele.classList.remove('p2-control');
        });
    }
    bindGetAvailCardSpaces(availCardSpacesCB) {
        this.getAvailCardSpaces = availCardSpacesCB;
    }
    bindGetAvailTokenSpaces(availTokenSpacesCB) {
        this.getAvailTokenSpaces = availTokenSpacesCB;
    }
    bindGetRemainingSpaces(remainingSpacesCB) {
        this.getRemainingSpaces = remainingSpacesCB;
    }
    bindSendCardPlayToModel(sendCardPlayToModelCB) {
        this.sendCardPlayToModel = sendCardPlayToModelCB;
    }
    bindSendTokenPlayToModel(sendTokenPlaytoModelCB) {
        this.sendTokenPlayToModel = sendTokenPlaytoModelCB;
    }
    bindUndoPlayCard(undoPlayCardCB) {
        this.undoPlayCard = undoPlayCardCB;
    }
    bindUndoPlaceToken(undoPlaceTokenCB) {
        this.undoPlaceToken = undoPlaceTokenCB;
    }
    bindComputerTakeTurn(computerTurnCB) {
        this.computerTakeTurn = computerTurnCB;
    }
    bindGetCardDrawFromModel(drawCardCB) {
        this.getCardDrawFromModel = drawCardCB;
    }
    bindGetCurrPlyrAvailTokens(availTokensCB) {
        this.getCurrPlyrAvailTokens = availTokensCB;
    }
    bindGetOpponAvailTokens(availTokensCB) {
        this.getOpponAvailTokens = availTokensCB;
    }
    bindGetCurrPlyrScore(getCurrPlyrScoreCB) {
        this.getCurrPlyrScore = getCurrPlyrScoreCB;
    }
    bindGetOpponentScore(getOpponentScoreCB) {
        this.getOpponentScore = getOpponentScoreCB;
    }
    bindStartGame(startGameCB) {
        this.startGame = startGameCB;
    }
    bindGetControlledSpaces(getControlledSpacesCB) {
        this.getSpacesControlledByToken = getControlledSpacesCB;
    }
    bindResetStorage(resetStorageCB) {
        this.resetStorage = resetStorageCB;
    }
    bindAddRecordtoDB(addRecordtoDBCB) {
        this.addRecordtoDB = addRecordtoDBCB;
    }
}
export class SinglePlayerView extends View {
    constructor(board, currPlyrID, opposPlyrID) {
        super(board, currPlyrID, opposPlyrID);
        this.endTurnButtonCB = () => {
            this.removeControlledSpacesHighlighting();
            this.pickupSound.play();
            this.currPlyrIcon.classList.remove('active');
            this.opponentIcon.classList.add('active');
            if (this.getCardDrawFromModel) {
                this.getCardDrawFromModel();
            }
            this.addInfluenceTokenToHand();
            this.enableCardHandDragging();
            this.disableAllTokenDragging();
            this.undoButton.disabled = true;
            this.endTurnButton.disabled = true;
            this.updateScore();
            this.currPlyrIcon.classList.add('active');
            this.opponentIcon.classList.remove('active');
            //set turn status in local storage
            localStorage.removeItem('turnStatus');
            localStorage.removeItem('undoMoves');
            if (!this.checkForGameEnd() && this.computerTakeTurn) {
                this.computerTakeTurn();
            }
            this.updateScore();
        };
        this.currPlyrHUDID.innerHTML = `Player`;
        this.opponentHUDID.innerHTML = `Computer`;
        this.currPlyrIcon.classList.add('player1Icon');
        this.opponentIcon.classList.add('player2Icon');
        this.currPlyrIcon.classList.add('losing');
        this.opponentIcon.classList.add('losing');
        // use single player specific endturn function
        this.endTurnButton.addEventListener('click', this.endTurnButtonCB);
        // set last used difficulty and layout setting as checked in menu
        const aiDifficulty = localStorage.getItem('difficulty');
        if (aiDifficulty) {
            const radioElement = document.getElementById(aiDifficulty);
            radioElement.checked = true;
        }
        const layout = localStorage.getItem('layoutChoice');
        if (layout) {
            const radioElement = document.getElementById(layout);
            radioElement.checked = true;
        }
        // if no game data in local storage, show new game layout menu.
        // if there IS game data, the view will be filled with the existing data,
        // which will be triggered from the controller.
        if (!localStorage.getItem('layout')) {
            this.newGameMenu.classList.add('active');
            this.newGameOptionsOverlay.classList.add('active');
        }
        // handle the new game options menu
        this.gameOptionsForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.newGameMenu.classList.remove('active');
            this.newGameOptionsOverlay.classList.remove('active');
            const formData = new FormData(this.gameOptionsForm);
            const layoutChoice = formData.get('layout');
            const aiDifficulty = formData.get('difficulty');
            if (!layoutChoice || !aiDifficulty || !this.startGame)
                return;
            // set difficulty setting in localstorage, for restoring
            // in progress games, as well as setting the default
            // in the new game menu
            localStorage.setItem('difficulty', aiDifficulty);
            localStorage.setItem('layoutChoice', layoutChoice);
            this.startGame(layoutChoice, aiDifficulty);
        });
    }
}
export class MultiPlayerView extends View {
    constructor(board, socket, currPlyrID, opposPlyrID) {
        super(board, currPlyrID, opposPlyrID);
        this.endTurnButtonCB = () => {
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
        this.socket = socket;
        this.currPlyrID = currPlyrID;
        if (this.currPlyrID === 'Player 1') {
            this.currPlyrHUDID.innerHTML = 'Player 1';
            this.currPlyrIcon.classList.add('player1Icon');
            this.currPlyrIcon.classList.add('losing');
            this.currPlyrIcon.classList.add('active');
        }
        else {
            this.currPlyrHUDID.innerHTML = 'Player 2';
            this.opponentHUDID.innerHTML = 'Player 1';
            this.opponentIcon.classList.add('player1Icon');
            this.opponentIcon.classList.add('losing');
            this.opponentIcon.classList.add('active');
            this.currPlyrIcon.classList.add('player2Icon');
            this.currPlyrIcon.classList.add('losing');
        }
        // Remove single player options from multiplayer menu
        const title = document.getElementById('difficultyTitle');
        title.remove();
        const difficultyRadios = document.getElementById('difficulty');
        difficultyRadios.remove();
        // get player 2 to choose layout
        if (currPlyrID === 'Player 2') {
            this.newGameMenu.classList.add('active');
            this.newGameOptionsOverlay.classList.add('active');
            this.gameOptionsForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.newGameMenu.classList.remove('active');
                this.newGameOptionsOverlay.classList.remove('active');
                const formData = new FormData(this.gameOptionsForm);
                const layoutChoice = formData.get('layout');
                if (!layoutChoice || !this.startGame)
                    return;
                this.startGame(layoutChoice);
            });
        }
        this.roomNumber = document.getElementById('roomNumber');
        this.endTurnButton.addEventListener('click', this.endTurnButtonCB);
        this.socket.on('connectToRoom', (roomNumber) => {
            this.roomNumber.innerHTML = `In game room ${roomNumber} as ${this.currPlyrID}`;
        });
        this.socket.on('p2Ready', () => {
            if (this.currPlyrID === 'Player 2')
                return;
            this.opponentHUDID.innerHTML = 'Player 2';
            this.opponentIcon.classList.add('player2Icon');
            this.opponentIcon.classList.add('losing');
        });
        this.socket.on('enableP1CardDragging', () => {
            if (this.currPlyrID === 'Player 1')
                this.enableCardHandDragging();
        });
        this.socket.on('beginNextTurn', (player) => {
            if (this.currPlyrID !== player)
                return;
            this.updateScore();
            this.currPlyrIcon.classList.add('active');
            this.opponentIcon.classList.remove('active');
            this.enableCardHandDragging();
        });
        socket.on('disconnect', () => {
            this.disconnectedAlert.style.visibility = 'visible';
        });
    }
    sendMoveToOpponent() {
        const cardID = this.movesArr[0].draggedEle.id;
        const spaceID = this.movesArr[0].targetSpace.id;
        let tokenMove;
        if (this.movesArr.length > 1) {
            tokenMove = this.movesArr[1].targetSpace.id;
        }
        this.socket.emit('sendPlayerMove', this.currPlyrID, cardID, spaceID, tokenMove);
    }
}
