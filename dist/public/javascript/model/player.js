// game variables that never change
const PLAYER_INFLUENCE_TOKENS = 4;
const PLAYER_HAND_SIZE = 3;
// initial minimum values used in AI move selection
const CARD_VALUE_THRESHOLD = 7;
const SCORE_INCREASE_THRESHOLD = 4;
export class Player {
    constructor(playerID, gameBoard, deck) {
        this.playCard = (spaceID, cardID) => {
            const card = this.getCardFromHandByID(cardID);
            if (!card)
                return false;
            if (!this.gameBoard.setCard(spaceID, card)) {
                return false;
            }
            else {
                this.hand = this.hand.filter((ele) => ele !== card);
                return true;
            }
        };
        this.undoPlayCard = (spaceID) => {
            const space = this.gameBoard.getSpace(spaceID);
            if (space) {
                const card = space.getCard();
                if (card) {
                    this.hand.push(card);
                    this.gameBoard.removeCardAndResolveBoard(spaceID);
                }
            }
        };
        this.getAvailableTokenSpaces = () => {
            return this.gameBoard.getAvailableTokenSpaces(this.playerID);
        };
        this.placeToken = (spaceID) => {
            if (this.influenceTokens > 0) {
                this.influenceTokens--;
                return this.gameBoard.setPlayerToken(spaceID, this.playerID);
            }
            return false;
        };
        this.undoPlaceToken = (spaceID) => {
            this.influenceTokens++;
            return this.gameBoard.removePlayerTokenAndResolveBoard(spaceID);
        };
        this.getInfluenceTokensNo = () => {
            return this.influenceTokens;
        };
        this.getScore = () => {
            return this.gameBoard.getPlayerScore(this.playerID);
        };
        this.playerID = playerID;
        this.gameBoard = gameBoard;
        this.deck = deck;
        this.hand = [];
        this.influenceTokens = PLAYER_INFLUENCE_TOKENS;
    }
    getCardFromHandByID(cardID) {
        return this.hand.filter((card) => card.getId() === cardID)[0];
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
    constructor(playerID, gameBoard, deck, socket) {
        super(playerID, gameBoard, deck);
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
                this.sendTokenPlayToView(tokenSpace);
        });
    }
    drawStartingHand() {
        for (let i = 0; i < PLAYER_HAND_SIZE; i++) {
            this.drawCard();
        }
    }
}
export class Player_SinglePlayer extends Player {
    constructor(playerID, gameBoard, deck) {
        super(playerID, gameBoard, deck);
        this.drawCard = () => {
            const newCard = this.deck.drawCard();
            if (newCard) {
                this.hand.push(newCard);
                if (this.playerID !== 'Computer') {
                    if (this.sendCardDrawtoView) {
                        this.sendCardDrawtoView(newCard);
                    }
                }
            }
        };
    }
    drawStartingHand() {
        for (let i = 0; i < PLAYER_HAND_SIZE; i++) {
            this.drawCard();
        }
    }
}
export class Player_ComputerPlayer extends Player_SinglePlayer {
    constructor(playerID, gameBoard, deck, opponentID, getOpponentTokensNumCB, placeOpponentTokenCB, removeOpponentTokenCB) {
        super(playerID, gameBoard, deck);
        // TODO: overhaul this method to use a weighted system taking into account
        // the current parameters and also
        // - considering growth potential of a district when placing a token
        // - blocking an opponent when no better move is available
        this.computerTakeTurn = () => {
            const allMoves = this.getAllAvailableMoves(this.playerID, this.hand);
            this.blockTheft(false, allMoves);
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
                    this.sendTokenPlayToView(finalChoice.spaceToPlaceToken);
                }
            }
            this.drawCard();
        };
        this.opponentID = opponentID;
        this.getOpponentTokensNum = getOpponentTokensNumCB;
        this.placeOpponentToken = placeOpponentTokenCB;
        this.removeOpponentToken = removeOpponentTokenCB;
    }
    // helper fn to adjust requirements for placing an influence
    // token as the game progresses
    adjustMinThreshold(hopedForAmt) {
        const spaceLeft = this.gameBoard.getRemainingSpacesNumber();
        const sizeOfTheBoard = Math.pow(this.gameBoard.getBoardSize(), 2);
        // hack add on: don't go less than 50% of our original requirement
        let settledForNumber = Math.ceil(hopedForAmt * Math.max(0.5, spaceLeft / sizeOfTheBoard));
        // hack add on: don't start reducing threshold until middle half of the game
        if (spaceLeft / sizeOfTheBoard > 0.25)
            settledForNumber = hopedForAmt;
        return settledForNumber;
    }
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
        return availableAdjSpaces.length;
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
                let cardOnlyScore = changeInComputerScore - changeInHumanScore;
                // if there is a theft risk, reduce the score of this move by a large number.
                // TODO: adjust the score by the num of cards in the at risk district instead
                cardOnlyScore -= this.blockTheft(true);
                const cardOnlyScoreObj = {
                    cardToPlay: card,
                    spaceToPlaceCard: availCardSpace,
                    score: cardOnlyScore,
                    spaceToPlaceToken: undefined,
                    tokenSpaceCardValue: undefined
                };
                this.scoreintermediateMoves(cardOnlyScoreObj);
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
                            let withTokenScore = tokenChangeInComputerScore - tokenChangeInHumanScore;
                            withTokenScore -= this.blockTheft(true);
                            withTokenScore +=
                                this.getDistrictsGrowthPotential(availTokenSpace) * 0.25;
                            const withTokenScoreObj = {
                                cardToPlay: card,
                                spaceToPlaceCard: availCardSpace,
                                score: withTokenScore,
                                spaceToPlaceToken: availTokenSpace,
                                tokenSpaceCardValue: tokenSpaceCardValue
                            };
                            this.scoreintermediateMoves(withTokenScoreObj);
                            this.searchForTheftOpportunity(withTokenScoreObj);
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
    // Method to detect and avoid territories being stolen.
    // Boolean checkforSelfKill determines wether the method adjusts the values of
    // an array of potential moves, or wether it returns the size of the largest
    // found at risk district. The former is used to avoid a district being stolen
    // by the enemies initiative. The latter is used to avoid making a move that
    // will provide an enemy a perfect opportunity to steal.
    blockTheft(checkforSelfKill, movesArr = []) {
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
            // different opponents.
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
                    const sortedSpaces = controllingSpaces.sort((spaceA, spaceB) => { var _a, _b; 
                    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
                    return ((_a = spaceB.getCard()) === null || _a === void 0 ? void 0 : _a.getValue()) - ((_b = spaceA.getCard()) === null || _b === void 0 ? void 0 : _b.getValue()); });
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
                            blockingMoves.forEach((move) => (move.score += atRiskDistrictSize));
                        }
                    }
                }
            }
        }
        return largestAtRiskDistrictSize;
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
            }
        }
    }
    // add scoring to less obvious moves;
    // don't put good cards near opponent or next to uncontrolled cards of the same suit.
    // do put good cards near us.
    scoreintermediateMoves(move) {
        // if we control the current card, nothing to do here.
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
        const adjSpaces = this.gameBoard.getAdjacentSpaces(move.spaceToPlaceCard.getID());
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
            if (oneSpaceAwayArr.includes(adjSpace))
                continue;
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
                    if (adjControlPlayerID === 'Computer')
                        continue;
                    move.score -= 1;
                    // console.log(
                    //   'reduce score of placing a tile near an uncontrolled tile of same suit'
                    // );
                    // console.log('adjspace', adjSpace);
                    // console.log('moveSpace', move.spaceToPlaceCard);
                    // console.log('cardToPlay', move.cardToPlay);
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
                        // found a card 1 space away with the same suit as
                        // the card we are considering playing.
                        // if it's controlled by us, increase score.
                        // otherwise decrease score.
                        // console.log(
                        //   'found a card that is one away from another card of same suit'
                        // );
                        // console.log('spacetoPlay: ', move.spaceToPlaceCard);
                        // console.log('cardtoPlay', move.cardToPlay);
                        // console.log('oneawayspace', oneAwaySpace);
                        const oneawcontrolSpaceID = oneAwaySpace.getControllingSpaceID(suit);
                        const oneawControlSpace = oneawcontrolSpaceID
                            ? this.gameBoard.getSpace(oneawcontrolSpaceID)
                            : undefined;
                        const oneawControlPlayerID = oneawControlSpace
                            ? oneawControlSpace.getPlayerToken()
                            : undefined;
                        // console.log('oneawaycontrollingPID', oneawControlPlayerID);
                        if (oneawControlPlayerID === 'Computer') {
                            // console.log('helps us, increase score');
                            move.score += 0.5;
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
                                move.score += 0.75;
                                // console.log('movespace', move.spaceToPlaceCard);
                                // console.log('cardToPlay', move.cardToPlay);
                                // console.log('oneawaySpace', oneAwaySpace);
                            }
                            // console.log('helps opp, decrease score');
                            move.score -= 0.5;
                        }
                    }
                }
            }
        }
    }
    // helper fn to test wether a potential token placement meets minimum reqs
    filterAndSortTokenScoreResults(topCardScore, tokenScoreArr) {
        const adjustedCardValueThreshold = this.adjustMinThreshold(CARD_VALUE_THRESHOLD);
        const adjustedScoreThreshold = this.adjustMinThreshold(SCORE_INCREASE_THRESHOLD);
        // check for withTokenScore to remove card-only results from the list.
        // Then remove results which don't raise the score by the minimum threshold
        // versus just playing a card
        tokenScoreArr = tokenScoreArr.filter((ele) => ele.score - topCardScore >= adjustedScoreThreshold);
        // sort the array first by score,
        // then by the value of the card the token will be placed on
        return tokenScoreArr.sort((a, b) => b.score - a.score || b.tokenSpaceCardValue - a.tokenSpaceCardValue);
    }
}
