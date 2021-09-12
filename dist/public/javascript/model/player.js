// game variables that never change
const PLAYER_INFLUENCE_TOKENS = 4;
const PLAYER_HAND_SIZE = 3;
// initial minimum values used in AI move selection
const CARD_VALUE_THRESHOLD = 3;
const SCORE_INCREASE_THRESHOLD = 3;
// values used in scoring more ambigious moves
const ADJ_SPACE_SAME_SUIT = 0.25;
const LONG_SHOT_THEFT = 0.5;
const SAME_SUIT_IN_HAND = 0.5;
const GROWTH_POTENTIAL = 0.2;
export class Player {
    constructor(playerID, gameType, gameBoard, deck) {
        this.playCard = (spaceID, cardID) => {
            const card = this.getCardFromHandByID(cardID);
            if (!card)
                return false;
            // place the card on the board
            if (!this.gameBoard.setCard(spaceID, card)) {
                return false;
            }
            else {
                // remove card from hand
                this.hand = this.hand.filter((ele) => ele !== card);
                if (this.gameType === 'singlePlayer') {
                    // add card play info to localStorage
                    const movesJSON = localStorage.getItem('movesArr');
                    const movesArr = movesJSON ? JSON.parse(movesJSON) : [];
                    movesArr.push({
                        player: this.playerID,
                        cardToPlay: cardID,
                        spaceToPlaceCard: spaceID
                    });
                    localStorage.setItem('movesArr', JSON.stringify(movesArr));
                    // remove card from hand backup in local storage
                    const handJSON = localStorage.getItem(`${this.playerID}-hand`);
                    let handArr = handJSON ? JSON.parse(handJSON) : [];
                    handArr = handArr.filter((ele) => ele !== card.getId());
                    localStorage.setItem(`${this.playerID}-hand`, JSON.stringify(handArr));
                }
                return true;
            }
        };
        this.undoPlayCard = (spaceID) => {
            const space = this.gameBoard.getSpace(spaceID);
            if (space) {
                const card = space.getCard();
                if (card) {
                    // return card to hand
                    this.hand.push(card);
                    // remove card from board
                    this.gameBoard.removeCardAndResolveBoard(spaceID);
                    if (this.gameType === 'singlePlayer') {
                        // return card to local storage backup
                        const handJSON = localStorage.getItem(`${this.playerID}-hand`);
                        if (handJSON) {
                            const handArr = JSON.parse(handJSON);
                            handArr.push(card.getId());
                            localStorage.setItem(`${this.playerID}-hand`, JSON.stringify(handArr));
                        }
                        // remove card play from localStorage
                        const movesArr = JSON.parse(localStorage.getItem('movesArr'));
                        movesArr.pop();
                        localStorage.setItem('movesArr', JSON.stringify(movesArr));
                    }
                }
            }
        };
        this.getAvailableTokenSpaces = () => {
            return this.gameBoard.getAvailableTokenSpaces(this.playerID);
        };
        this.placeToken = (spaceID) => {
            if (this.influenceTokens > 0) {
                // remove 1 token from user total
                this.influenceTokens--;
                // place token
                this.gameBoard.setPlayerToken(spaceID, this.playerID);
                // record token play info in local storage
                if (this.gameType === 'singlePlayer')
                    this.recordTokenPlay(spaceID);
            }
            return true;
        };
        // identical to placeToken method except it does not add
        // a move entry to local storage
        this.restoreTokenPlay = (spaceID) => {
            if (this.influenceTokens > 0) {
                // remove 1 token from user total
                this.influenceTokens--;
                // place token
                this.gameBoard.setPlayerToken(spaceID, this.playerID);
                // record token play info in local storage
            }
        };
        this.recordTokenPlay = (spaceID) => {
            const movesArr = JSON.parse(localStorage.getItem('movesArr'));
            movesArr.push({
                playerID: this.playerID,
                spaceToPlaceToken: spaceID
            });
            localStorage.setItem('movesArr', JSON.stringify(movesArr));
        };
        this.undoPlaceToken = (spaceID) => {
            // restore user token
            this.influenceTokens++;
            // remove token from board
            this.gameBoard.removePlayerTokenAndResolveBoard(spaceID);
            // remove token play from local storage
            if (this.gameType === 'singlePlayer')
                this.recordUndoTokenPlay(spaceID);
        };
        this.recordUndoTokenPlay = (spaceID) => {
            const movesArr = JSON.parse(localStorage.getItem('movesArr'));
            movesArr.pop();
            localStorage.setItem('movesArr', JSON.stringify(movesArr));
        };
        this.getInfluenceTokensNo = () => {
            return this.influenceTokens;
        };
        this.getCardFromHandByID = (cardID) => {
            return this.hand.filter((card) => card.getId() === cardID)[0];
        };
        this.getScore = () => {
            return this.gameBoard.getPlayerScore(this.playerID);
        };
        this.playerID = playerID;
        this.gameType = gameType;
        this.gameBoard = gameBoard;
        this.deck = deck;
        this.hand = [];
        this.influenceTokens = PLAYER_INFLUENCE_TOKENS;
    }
    getHandArr() {
        return this.hand;
    }
    getHandSize() {
        return this.hand.length;
    }
    bindSendCardPlayToView(sendCardPlaytoView) {
        this.sendCardPlaytoView = sendCardPlaytoView;
    }
    bindSendTokenPlayToView(sendTokenPlayToViewCB) {
        this.sendTokenPlayToView = sendTokenPlayToViewCB;
    }
    bindDrawCard(sendCardDrawtoView) {
        this.sendCardDrawtoView = sendCardDrawtoView;
    }
}
export class Player_MultiPlayer extends Player {
    constructor(playerID, gameType, gameBoard, deck, socket) {
        super(playerID, gameType, gameBoard, deck);
        this.drawCard = () => {
            this.socket.emit('drawCard', this.playerID);
        };
        this.socket = socket;
        socket.on('recieveCardDraw', (cardID, playerID) => {
            if (playerID !== this.playerID || !cardID)
                return;
            const card = this.deck.getCardByID(cardID);
            if (card)
                this.hand.push(card);
            if (!card || !this.sendCardDrawtoView)
                return;
            this.sendCardDrawtoView(card);
        });
        socket.on('recievePlayerMove', (playerID, cardID, spaceID, tokenSpaceID) => {
            if (playerID !== this.playerID)
                return;
            if (!this.sendCardPlaytoView)
                return;
            const card = this.getCardFromHandByID(cardID);
            const space = this.gameBoard.getSpace(spaceID);
            if (!card || !space)
                return;
            this.playCard(spaceID, cardID);
            this.sendCardPlaytoView(card, space);
            if (!tokenSpaceID || !this.sendTokenPlayToView)
                return;
            this.placeToken(tokenSpaceID);
            const tokenSpace = this.gameBoard.getSpace(tokenSpaceID);
            if (tokenSpace)
                this.sendTokenPlayToView(tokenSpace, this.playerID);
        });
    }
    drawStartingHand() {
        for (let i = 0; i < PLAYER_HAND_SIZE; i++) {
            this.drawCard();
        }
    }
}
export class Player_SinglePlayer extends Player {
    constructor(playerID, gameType, gameBoard, deck) {
        super(playerID, gameType, gameBoard, deck);
        this.drawCard = () => {
            // get card from deck
            const newCard = this.deck.drawCard();
            if (newCard) {
                // add new card to hand
                this.hand.push(newCard);
                // save info to local storage
                if (this.gameType === 'singlePlayer')
                    this.saveCardDrawToStorage(newCard);
                // send card to view
                if (this.sendCardDrawtoView) {
                    this.sendCardDrawtoView(newCard);
                }
            }
        };
    }
    saveCardDrawToStorage(card) {
        // save hand info to local storage
        const handJSON = localStorage.getItem(`${this.playerID}-hand`);
        const handArr = handJSON ? JSON.parse(handJSON) : [];
        handArr.push(card.getId());
        localStorage.setItem(`${this.playerID}-hand`, JSON.stringify(handArr));
        // add card to list of already played cards in local storage
        const playedCardsJSON = localStorage.getItem('playedCards');
        const playedCardsArr = playedCardsJSON ? JSON.parse(playedCardsJSON) : [];
        playedCardsArr.push(card.getId());
        localStorage.setItem('playedCards', JSON.stringify(playedCardsArr));
    }
    drawStartingHand() {
        for (let i = 0; i < PLAYER_HAND_SIZE; i++) {
            this.drawCard();
        }
    }
    restoreHand() {
        // restore hand from local storage
        const playerID = this.playerID === 'Player 1' ? 'Player 1' : 'Computer';
        const handJSON = localStorage.getItem(`${playerID}-hand`);
        if (handJSON) {
            const handArr = JSON.parse(handJSON);
            handArr.forEach((cardID) => {
                const card = this.deck.getCardByID(cardID);
                this.hand.push(card);
                if (this.playerID !== 'Computer') {
                    if (this.sendCardDrawtoView) {
                        this.sendCardDrawtoView(card);
                    }
                }
            });
        }
    }
}
export class Player_ComputerPlayer extends Player_SinglePlayer {
    constructor(playerID, gameType, gameBoard, deck, opponentID, getOpponentTokensNumCB, placeOpponentTokenCB, removeOpponentTokenCB) {
        super(playerID, gameType, gameBoard, deck);
        this.computerTakeTurn = () => {
            const allMoves = this.getAllAvailableMoves(this.playerID, this.hand);
            // don't use additional AI rules for easy difficulty
            if (this.aiDifficulty !== 'easyAI') {
                this.blockTheft(false, allMoves);
                this.blockDiagTheft(false, allMoves);
            }
            // remove token moves, then sort by score, if same score then randomize
            // (otherwise the computer will fill spaces in the board from top
            // left to bottom right sequentially)
            const cardOnlyMovesSorted = allMoves
                .filter((ele) => !ele.spaceToPlaceToken)
                .sort((a, b) => {
                const random = Math.random() > 0.5 ? 1 : -1;
                return b.score - a.score || random;
            });
            const topCardOnlyMove = cardOnlyMovesSorted[0];
            const topCardOnlyScore = topCardOnlyMove.score;
            const tokenMoveArr = this.filterAndSortTokenScoreResults(topCardOnlyScore, allMoves);
            console.log('cardOnlyMovesSorted', cardOnlyMovesSorted);
            console.log('tokenMovesArr', tokenMoveArr);
            const topTokenMove = tokenMoveArr[0];
            // call the blocktheft fn to check for potential theft and place a move to block it.
            // if there is at least 1 item in the tokenmove list after filtering,
            // that's our choice.
            const finalChoice = topTokenMove ? topTokenMove : topCardOnlyMove;
            // play card
            this.playCard(finalChoice.spaceToPlaceCard.getID(), finalChoice.cardToPlay.getId());
            if (this.sendCardPlaytoView) {
                this.sendCardPlaytoView(finalChoice.cardToPlay, finalChoice.spaceToPlaceCard);
            }
            // if token play information exists, play token
            if (finalChoice === null || finalChoice === void 0 ? void 0 : finalChoice.spaceToPlaceToken) {
                this.placeToken(finalChoice.spaceToPlaceToken.getID());
                if (this.sendTokenPlayToView) {
                    this.sendTokenPlayToView(finalChoice.spaceToPlaceToken, this.playerID);
                }
            }
            this.drawCard();
        };
        this.opponentID = opponentID;
        this.getOpponentTokensNum = getOpponentTokensNumCB;
        this.placeOpponentToken = placeOpponentTokenCB;
        this.removeOpponentToken = removeOpponentTokenCB;
        this.aiDifficulty = 'easyAI'; // default value
    }
    // helper fn to adjust requirements for placing an influence
    // token as the game progresses
    adjustMinThreshold(hopedForAmt) {
        const spaceLeft = this.gameBoard.getRemainingSpacesNumber();
        const sizeOfTheBoard = Math.pow(this.gameBoard.getBoardSize(), 2);
        // hack add on: don't go less than 50% of our original requirement
        const settledForNumber = Math.ceil((hopedForAmt * spaceLeft) / sizeOfTheBoard);
        // Once there is 1/4 of the game left, reduce the threshold by half.
        // Then near the end of the game reduce to scale.
        if (spaceLeft / sizeOfTheBoard < 0.15)
            return settledForNumber;
        if (spaceLeft / sizeOfTheBoard < 0.25)
            return hopedForAmt * 0.5;
        return hopedForAmt;
    }
    getAllAvailableMoves(playerID, availableCards) {
        // switch search between current player or opponent player
        const opponentID = playerID === this.playerID ? this.opponentID : this.playerID;
        const currentHumanScore = this.gameBoard.getPlayerScore(opponentID);
        const currentComputerScore = this.gameBoard.getPlayerScore(playerID);
        const resultsArr = [];
        const adjustedCardValueThreshold = this.adjustMinThreshold(CARD_VALUE_THRESHOLD);
        const handArr = this.getHandArr().sort((a, b) => {
            return a.getValue() - b.getValue();
        });
        //for each card in computers hand,
        handArr.forEach((card) => {
            this.gameBoard.getAvailableSpaces().forEach((availCardSpace) => {
                // see what the change in score will be for each open space on the board
                this.gameBoard.setCard(availCardSpace.getID(), card);
                const changeInHumanScore = this.gameBoard.getPlayerScore(opponentID) - currentHumanScore;
                const changeInComputerScore = this.gameBoard.getPlayerScore(playerID) - currentComputerScore;
                const cardOnlyScore = changeInComputerScore - changeInHumanScore;
                // if there is a theft risk, reduce the score of this move
                // by the number of cards in the at risk district.
                const cardOnlyScoreObj = {
                    cardToPlay: card,
                    spaceToPlaceCard: availCardSpace,
                    score: cardOnlyScore,
                    spaceToPlaceToken: undefined,
                    tokenSpaceCardValue: undefined,
                    log: ''
                };
                // don't use additional AI rules for easy difficulty
                if (this.aiDifficulty !== 'easyAI') {
                    const blockTheftAdjustment = this.blockTheft(true);
                    cardOnlyScoreObj.score -= blockTheftAdjustment;
                    cardOnlyScoreObj.log =
                        blockTheftAdjustment > 0
                            ? (cardOnlyScoreObj.log += `blocktheft -${blockTheftAdjustment} `)
                            : cardOnlyScoreObj.log;
                    const blockDiagTheft = this.blockDiagTheft(true);
                    cardOnlyScoreObj.score -= blockDiagTheft;
                    cardOnlyScoreObj.log =
                        blockDiagTheft > 0
                            ? (cardOnlyScoreObj.log += `blockdiagtheft -${blockDiagTheft} `)
                            : cardOnlyScoreObj.log;
                    this.scoreintermediateMoves(cardOnlyScoreObj);
                }
                resultsArr.push(cardOnlyScoreObj);
                // then also check what the change in score will be when placing a token
                // in any space meeting the minimum card valuerequirements
                if (this.influenceTokens > 0) {
                    this.gameBoard
                        .getAvailableTokenSpaces(playerID)
                        .forEach((availTokenSpace) => {
                        const tokenSpaceCard = availTokenSpace.getCard();
                        if (!tokenSpaceCard)
                            return;
                        // check whether the card value meets our minimum threshold
                        const tokenSpaceCardValue = tokenSpaceCard.getValue();
                        if (tokenSpaceCardValue >= adjustedCardValueThreshold) {
                            //if it does, create a resultsObj and push to results.
                            this.gameBoard.setPlayerToken(availTokenSpace.getID(), playerID);
                            const tokenChangeInHumanScore = this.gameBoard.getPlayerScore(opponentID) - currentHumanScore;
                            const tokenChangeInComputerScore = this.gameBoard.getPlayerScore(playerID) -
                                currentComputerScore;
                            const withTokenScore = tokenChangeInComputerScore - tokenChangeInHumanScore;
                            const withTokenScoreObj = {
                                cardToPlay: card,
                                spaceToPlaceCard: availCardSpace,
                                score: withTokenScore,
                                spaceToPlaceToken: availTokenSpace,
                                tokenSpaceCardValue: tokenSpaceCardValue,
                                log: ''
                            };
                            // don't use additional AI rules for easy difficulty
                            if (this.aiDifficulty !== 'easyAI') {
                                const blockTheftAdjustment = this.blockTheft(true);
                                withTokenScoreObj.score -= blockTheftAdjustment;
                                withTokenScoreObj.log =
                                    blockTheftAdjustment > 0
                                        ? (withTokenScoreObj.log += `blocktheft -${blockTheftAdjustment} `)
                                        : withTokenScoreObj.log;
                                const blockDiagTheft = this.blockDiagTheft(true);
                                withTokenScoreObj.score -= blockDiagTheft;
                                withTokenScoreObj.log =
                                    blockDiagTheft > 0
                                        ? (withTokenScoreObj.log += `blockdiagtheft -${blockDiagTheft} `)
                                        : withTokenScoreObj.log;
                                this.searchForTheftOpportunity(withTokenScoreObj);
                            }
                            const growth = this.getDistrictsGrowthPotential(availTokenSpace);
                            withTokenScoreObj.score += growth;
                            withTokenScoreObj.tokenSpaceBonuses = growth;
                            withTokenScoreObj.log =
                                growth > 0
                                    ? (withTokenScoreObj.log += `growth potential +${growth} `)
                                    : withTokenScoreObj.log;
                            this.extraPtforCardinHand(withTokenScoreObj);
                            this.scoreintermediateMoves(withTokenScoreObj);
                            resultsArr.push(withTokenScoreObj);
                            // reset score after each token removal
                            this.gameBoard.removePlayerTokenAndResolveBoard(availTokenSpace.getID());
                        }
                    });
                }
                // reset score after each card removal
                this.gameBoard.removeCardAndResolveBoard(availCardSpace.getID());
            });
        });
        return resultsArr;
    }
    // check if there is open space around a card when placing a token
    getDistrictsGrowthPotential(boardSpace) {
        const controlledSpaces = [];
        const adjacentSpaces = [];
        //get an array of all the board spaces controlled by this token
        for (const [, space] of this.gameBoard.getAllSpaces()) {
            for (const [, spaceID] of space.getControlledSuitsMap()) {
                if (spaceID === boardSpace.getID() &&
                    !controlledSpaces.includes(space)) {
                    controlledSpaces.push(space);
                }
            }
        }
        // get an array of all spaces which are adjacent to one of the controlled spaces
        for (const space of controlledSpaces) {
            const adjSpaces = this.gameBoard.getAdjacentSpaces(space.getID());
            adjSpaces.forEach((adjSpace) => {
                if (!adjacentSpaces.includes(adjSpace)) {
                    adjacentSpaces.push(adjSpace);
                }
            });
        }
        // filter for spaces that are available
        const availableAdjSpaces = adjacentSpaces.filter((space) => this.gameBoard.getAvailableSpaces().includes(space));
        return Number((availableAdjSpaces.length * GROWTH_POTENTIAL).toPrecision(2));
    }
    // Method to detect and avoid territories being stolen.
    // Boolean checkforSelfKill determines wether the method adjusts the values of
    // an array of potential moves (raising the score of moves that avoid theft),
    //  or wether it returns the size of the largest found at risk district.
    // The former is used to avoid a district being stolen
    // by the enemies initiative. The latter is used to avoid making a move that
    // will provide an enemy a perfect opportunity to steal.
    blockTheft(checkforSelfKill, movesArr = []) {
        // if opponent has no tokens, no need to worry about theft.
        if (this.getOpponentTokensNum() === 0)
            return 0;
        const suitArr = [
            'Knots',
            'Leaves',
            'Moons',
            'Suns',
            'Waves',
            'Wyrms'
        ];
        let largestAtRiskDistrictSize = 0;
        for (const space of this.gameBoard.getAvailableSpaces()) {
            const adjSpaces = this.gameBoard.getAdjacentSpaces(space.getID());
            // for each suit, check if there are adjacent spaces controlled by
            // an opponent.
            for (const suit of suitArr) {
                const spacesWSuit = adjSpaces.filter((adjSpace) => adjSpace.getControlledSuitsMap().get(suit));
                const controllingSpaces = [];
                const playerIDs = [];
                let atRiskTokenSpaceID;
                spacesWSuit.forEach((spaceWSuit) => {
                    const controllingSpaceID = spaceWSuit.getControllingSpaceID(suit);
                    const controllingSpace = this.gameBoard.getSpace(controllingSpaceID);
                    controllingSpaces.push(controllingSpace);
                    const controllingPlayer = controllingSpace.getPlayerToken();
                    if (!playerIDs.includes(controllingPlayer)) {
                        playerIDs.push(controllingPlayer);
                    }
                    if (controllingPlayer === 'Computer') {
                        atRiskTokenSpaceID = controllingSpaceID;
                    }
                });
                // if we found 2 different player IDs, next move someone could
                // get their territory stolen. check whose card is higher.
                if (playerIDs.length > 1) {
                    const sortedSpaces = controllingSpaces.sort((spaceA, spaceB) => spaceB.getCard().getValue() - spaceA.getCard().getValue());
                    const highValueSpace = sortedSpaces[0];
                    if ((highValueSpace === null || highValueSpace === void 0 ? void 0 : highValueSpace.getPlayerToken()) !== this.playerID) {
                        // if theft risk found, increase the score of any moves which will
                        // block the theft by the size of the district that would be lost.
                        if (!atRiskTokenSpaceID)
                            return 0;
                        const atRiskDistrictSize = this.gameBoard.getDistrict(atRiskTokenSpaceID, suit).length;
                        largestAtRiskDistrictSize = Math.max(largestAtRiskDistrictSize, atRiskDistrictSize);
                        if (!checkforSelfKill) {
                            const blockingMoves = movesArr.filter((move) => {
                                if (move.spaceToPlaceCard === space &&
                                    !move.cardToPlay.getAllSuits().includes(suit)) {
                                    return true;
                                }
                                return false;
                            });
                            console.log('blockingMoves', blockingMoves);
                            blockingMoves.forEach((move) => {
                                move.score += atRiskDistrictSize;
                                move.log += `block theft + ${atRiskDistrictSize} `;
                            });
                        }
                    }
                }
            }
        }
        return largestAtRiskDistrictSize;
    }
    // search for diagonal theft risks
    blockDiagTheft(checkForSelfKill, movesArr = []) {
        var _a;
        // if opponent has no tokens, no need to worry about theft.
        if (this.getOpponentTokensNum() === 0)
            return 0;
        // create an array unplayedCards
        const referenceDeck = Array.from(this.deck.getReferenceDeck().values());
        const playedCards = this.gameBoard
            .getAllPlayedCards()
            .concat(this.hand)
            .map((card) => card.getId());
        const unplayedCards = referenceDeck.filter((card) => !playedCards.includes(card.getId()));
        // get an array of all spaces on the board that are controlled by
        // the computer in any suit.
        const computerOwnedSpaces = Array.from(this.gameBoard.getAllSpaces().values()).filter((space) => {
            const card = space.getCard();
            if (!card)
                return false;
            const suits = card.getAllSuits();
            for (const suit of suits) {
                const controlSpaceID = this.gameBoard.getControllingSpace(space.getID(), suit);
                if (!controlSpaceID)
                    continue;
                const controllingPlayer = this.gameBoard
                    .getSpace(controlSpaceID)
                    .getPlayerToken();
                if (controllingPlayer === this.playerID)
                    return true;
            }
        });
        // track the largest at risk district.
        let atRiskDistrictSize = 0;
        // for each space, check if it's at risk of diagonal theft
        for (const space of computerOwnedSpaces) {
            const spaceID = space.getID();
            const card = space.getCard();
            const adjSpaces = this.gameBoard.getAdjacentSpaces(spaceID);
            const diagSpaces = this.gameBoard.getDiagonalSpaces(spaceID);
            for (const diagSpace of diagSpaces) {
                // check whether a diagonal space either:
                // 1. is playable.
                // 2. has a card which matches any suit of our card and is unclaimed.
                // if it matches neither of these cases, it is not a risk. continue
                const diagCard = diagSpace.getCard();
                if (!(this.gameBoard.isPlayableSpace(diagSpace.getID()) ||
                    (diagCard &&
                        diagCard
                            .getAllSuits()
                            .some((suit) => card.getAllSuits().includes(suit)) &&
                        diagSpace.getControlledSuitsMap().size === 0)))
                    continue;
                // check whether the diagspace shares 2 open adj spaces
                // with our potential move space.
                const commonadjSpaces = adjSpaces.filter((adjSpace) => {
                    return (this.gameBoard.isPlayableSpace(adjSpace.getID()) &&
                        this.gameBoard
                            .getAdjacentSpaces(diagSpace.getID())
                            .includes(adjSpace));
                });
                // if there are less than 2 common adj available spaces, not a risk.
                if (commonadjSpaces.length < 2)
                    continue;
                // at this point we have found a diagSpace which is potentially a theft risk.
                for (const suit of card.getAllSuits()) {
                    const controlSpaceID = space.getControllingSpaceID(suit);
                    // if this suit is not controlled by the computer, continue
                    if (!controlSpaceID ||
                        this.gameBoard.getSpace(controlSpaceID).getPlayerToken() !==
                            this.playerID)
                        continue;
                    const district = this.gameBoard.getDistrict(spaceID, suit);
                    const controlCardValue = (_a = this.gameBoard
                        .getCard(controlSpaceID)) === null || _a === void 0 ? void 0 : _a.getValue();
                    // if an unplayed card exists whith a higher value than our control card,
                    // and there are at least 2 unplayed cards in that suit remaining,
                    // the district is at risk of diagonal theft. update the atRiskDistrictSize
                    // if this district is the largest yet seen.
                    if (unplayedCards.some((card) => card.getValue() > controlCardValue) &&
                        unplayedCards.filter((card) => card.getAllSuits().includes(suit))
                            .length >= 2) {
                        atRiskDistrictSize = Math.max(atRiskDistrictSize, district.length);
                    }
                    if (!checkForSelfKill) {
                        for (const move of movesArr) {
                            if (adjSpaces.includes(move.spaceToPlaceCard)) {
                                move.score += district.length;
                                move.log += `block diag + ${district.length} `;
                            }
                        }
                    }
                }
            }
        }
        return atRiskDistrictSize;
    }
    searchForTheftOpportunity(tokenMove) {
        var _a, _b, _c;
        const tokenSpaceSuits = (_a = tokenMove.spaceToPlaceToken) === null || _a === void 0 ? void 0 : _a.getControlledSuitsMap();
        if (!tokenSpaceSuits)
            return;
        // get diagonal spaces
        const diagSpaces = this.gameBoard.getDiagonalSpaces(tokenMove.spaceToPlaceToken.getID());
        const adjacentSpaces = this.gameBoard.getAdjacentSpaces(tokenMove.spaceToPlaceToken.getID());
        // for each diagonal space
        for (const diagSpace of diagSpaces) {
            if (!diagSpace.getCard())
                continue;
            // get the adjacent spaces that it has in common with the
            // space we are considering placing a token on, and make sure they are
            // playable
            const commonAdjSpaces = this.gameBoard
                .getAdjacentSpaces(diagSpace.getID())
                .filter((adjSpace) => adjacentSpaces.includes(adjSpace) &&
                this.gameBoard.isPlayableSpace(adjSpace.getID()));
            // there should be exactly two playable spaces in between.
            if (commonAdjSpaces.length !== 2)
                continue;
            const suits = diagSpace.getControlledSuitsMap();
            for (const [suit, ctrlspce] of suits) {
                if (!tokenSpaceSuits.get(suit))
                    continue;
                // we have found a card with the same suit as our token card
                const controlSpaceID = diagSpace.getControllingSpaceID(suit);
                const controlSpace = this.gameBoard.getSpace(controlSpaceID);
                if (controlSpace.getPlayerToken() === this.playerID)
                    return;
                // it's controlled by an enemy
                const enemyCardValue = controlSpace.getCard().getValue();
                if (
                // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
                enemyCardValue > ((_c = (_b = tokenMove.spaceToPlaceToken) === null || _b === void 0 ? void 0 : _b.getCard()) === null || _c === void 0 ? void 0 : _c.getValue()))
                    return;
                // our card is of a higher value.
                const cardsinHandWSameSuit = this.hand.filter((card) => card.getAllSuits().includes(suit) && tokenMove.cardToPlay !== card);
                if (cardsinHandWSameSuit.length < 1)
                    return;
                // and we have another card with the same suit in our hand with which to make the connection.
                // We now know we have found an enemy territory which we can steal!
                // Get the size of the territory.
                const enemyDistrictSize = this.gameBoard.getDistrict(diagSpace.getID(), suit).length;
                console.log('found diagonal theft opportunity!');
                console.log('space to attack:', diagSpace);
                console.log('attacking space', tokenMove.spaceToPlaceToken);
                console.log('suit: ', suit);
                console.log('cards in hand:', this.hand);
                tokenMove.score += 2 * enemyDistrictSize;
                tokenMove.log += `diagTheft + ${2 * enemyDistrictSize} `;
            }
        }
    }
    // add scoring to less obvious moves;
    // don't put good cards near opponent or next to uncontrolled cards of the same suit.
    // do put good cards near us.
    scoreintermediateMoves(move) {
        const cardSuits = move.cardToPlay.getAllSuits();
        const moveCombinedDistrict = [];
        // get an array of all the spaces that are adjacent or one away
        // that are already a part of our district. we don't need to do anything
        // with those and can skip them in coming steps.
        for (const suit of cardSuits) {
            const district = this.gameBoard.getDistrict(move.spaceToPlaceCard.getID(), suit);
            district.forEach((space) => {
                if (!moveCombinedDistrict.includes(space))
                    moveCombinedDistrict.push(space);
            });
        }
        // get an array of adjacent spaces
        const adjSpaces = this.gameBoard
            .getAdjacentSpaces(move.spaceToPlaceCard.getID())
            .filter((space) => !moveCombinedDistrict.includes(space));
        // console.log('adjacent spaces arr for intermediate move scoring', adjSpaces);
        // create oneaway array for later use.
        // if the adjacent space is playable, add *it's* adjacent spaces
        // to the list of spaces that are 1 space away
        const oneSpaceAwayArr = [];
        for (const adjSpace of adjSpaces) {
            if (this.gameBoard.isPlayableSpace(adjSpace.getID())) {
                const oneaway = this.gameBoard.getAdjacentSpaces(adjSpace.getID());
                for (const oneawaySpace of oneaway) {
                    if (oneawaySpace !== move.spaceToPlaceCard &&
                        !oneSpaceAwayArr.includes(oneawaySpace) &&
                        !moveCombinedDistrict.includes(oneawaySpace))
                        oneSpaceAwayArr.push(oneawaySpace);
                }
            }
            // if we find an adjacent card that is the same suit that's not controlled by us,
            // reduce the value of this move.
            const card = adjSpace.getCard();
            if (!card)
                continue;
            const adjSuits = card.getAllSuits();
            for (const suit of adjSuits) {
                if (cardSuits.includes(suit)) {
                    const adjcontrolSpaceID = adjSpace.getControllingSpaceID(suit);
                    const adjControlSpace = adjcontrolSpaceID
                        ? this.gameBoard.getSpace(adjcontrolSpaceID)
                        : undefined;
                    const adjControlPlayerID = adjControlSpace
                        ? adjControlSpace.getPlayerToken()
                        : undefined;
                    if (adjControlPlayerID === 'Computer') {
                        console.log('intermediate scoring method, found adj card with same suit, but not controlled by computer. this message should never be seen. ');
                        continue;
                    }
                    move.score -= ADJ_SPACE_SAME_SUIT;
                    move.log += `same suit in adj space that's not ours: - ${ADJ_SPACE_SAME_SUIT} `;
                }
            }
            // next, check for territories or cards that are 1 space away.
            for (const oneAwaySpace of oneSpaceAwayArr) {
                const card = oneAwaySpace.getCard();
                if (!card)
                    continue;
                const suits = card.getAllSuits();
                for (const suit of suits) {
                    if (cardSuits.includes(suit)) {
                        const oneawcontrolSpaceID = oneAwaySpace.getControllingSpaceID(suit);
                        const oneawControlSpace = oneawcontrolSpaceID
                            ? this.gameBoard.getSpace(oneawcontrolSpaceID)
                            : undefined;
                        const oneawControlPlayerID = oneawControlSpace
                            ? oneawControlSpace.getPlayerToken()
                            : undefined;
                        if (oneawControlPlayerID === 'Computer') {
                            move.score += ADJ_SPACE_SAME_SUIT;
                            move.log += `oneaway space w same suit that is controlled by us + ${ADJ_SPACE_SAME_SUIT} `;
                        }
                        else if (oneawControlPlayerID === 'Player 1') {
                            const moveControlSpaceID = move.spaceToPlaceCard.getControllingSpaceID(suit);
                            const moveControlSpace = moveControlSpaceID
                                ? this.gameBoard.getSpace(moveControlSpaceID)
                                : undefined;
                            const moveControlPlayer = moveControlSpace
                                ? moveControlSpace.getPlayerToken()
                                : undefined;
                            const moveControlCard = moveControlSpace
                                ? moveControlSpace.getCard()
                                : undefined;
                            if (moveControlPlayer === 'Computer' &&
                                moveControlCard &&
                                moveControlCard.getRank() > card.getRank()) {
                                // console.log('found a longshot theft opportunity');
                                move.score += LONG_SHOT_THEFT;
                                move.log += `long shot theft + ${LONG_SHOT_THEFT} `;
                                // console.log('movespace', move.spaceToPlaceCard);
                                // console.log('cardToPlay', move.cardToPlay);
                                // console.log('oneawaySpace', oneAwaySpace);
                            }
                            else {
                                move.score -= ADJ_SPACE_SAME_SUIT;
                                move.log += `oneawayspace same suit (${suit}) -${ADJ_SPACE_SAME_SUIT} `;
                            }
                        }
                    }
                }
            }
        }
    }
    extraPtforCardinHand(move) {
        const tokenSpace = move.spaceToPlaceToken;
        const card = tokenSpace.getCard();
        if (!card)
            throw new Error('no card on token space');
        let suits = card.getAllSuits();
        suits = suits.filter((suit) => tokenSpace.getControllingSpaceID(suit) === tokenSpace.getID());
        let points = 0;
        const filteredHand = this.hand.filter((hcard) => hcard.getId() !== move.cardToPlay.getId());
        for (const hCard of filteredHand) {
            const hSuits = hCard.getAllSuits();
            for (const hSuit of hSuits) {
                if (suits.includes(hSuit)) {
                    points += SAME_SUIT_IN_HAND;
                }
            }
        }
        move.score += points;
        if (move.tokenSpaceBonuses)
            move.tokenSpaceBonuses += points;
        if (points > 0)
            move.log += `same suit in hand + ${points} `;
    }
    // helper fn to test wether a potential token placement meets minimum reqs
    filterAndSortTokenScoreResults(topCardScore, tokenScoreArr) {
        const adjustedScoreThreshold = this.adjustMinThreshold(SCORE_INCREASE_THRESHOLD);
        // Remove results which don't raise the score by the minimum threshold
        // versus just playing a card. For this check we also temporarily remove the
        // growth potential bonus and card in hand w same suit bonus
        //  - otherwise the higher score created by this
        // bonus causes the AI to place a token even when the same game
        // score would be achieved without placing a token.
        tokenScoreArr = tokenScoreArr.filter((ele) => {
            return (ele.tokenSpaceBonuses &&
                ele.score - topCardScore - ele.tokenSpaceBonuses >=
                    adjustedScoreThreshold);
        });
        // sort the array first by score,
        // then by the value of the card the token will be placed on
        return tokenScoreArr.sort((a, b) => b.score - a.score || b.tokenSpaceCardValue - a.tokenSpaceCardValue);
    }
}
