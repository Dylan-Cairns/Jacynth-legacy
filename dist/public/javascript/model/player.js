// game variables that never change
const PLAYER_INFLUENCE_TOKENS = 4;
const PLAYER_HAND_SIZE = 3;
// minimum values used in AI move analysis
const CARD_VALUE_THRESHOLD = 5;
const SCORE_INCREASE_THRESHOLD = 4;
export class Player {
    constructor(playerID, gameBoard) {
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
    constructor(playerID, gameBoard, socket) {
        super(playerID, gameBoard);
        this.drawCard = () => {
            this.socket.emit('drawCard');
        };
        this.socket = socket;
        socket.on('recieveCardDraw', (newCard) => {
            if (newCard) {
                this.hand.push(newCard);
                if (this.playerID !== 'Computer') {
                    if (this.sendCardDrawtoView) {
                        this.sendCardDrawtoView(newCard);
                    }
                }
            }
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
        super(playerID, gameBoard);
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
        this.deck = deck;
    }
    drawStartingHand() {
        for (let i = 0; i < PLAYER_HAND_SIZE; i++) {
            this.drawCard();
        }
    }
}
export class Player_ComputerPlayer extends Player_SinglePlayer {
    constructor(playerID, gameBoard, deck, opponentID) {
        super(playerID, gameBoard, deck);
        this.computerTakeTurn = () => {
            var _a;
            const allMoves = this.getAllAvailableMoves();
            // remove token moves, then sort by score, if same score then randomize
            // (otherwise the computer will fill spaces in the board from top
            // left to bottom right sequentially)
            const cardOnlyMovesSorted = allMoves
                .filter((ele) => !ele.spaceToPlaceToken)
                .sort((a, b) => {
                const random = Math.random() > 0.5 ? 1 : -1;
                return b.cardOnlyScore - a.cardOnlyScore || random;
            });
            console.log('cardonlyMovesSorted', cardOnlyMovesSorted);
            const topCardOnlyMove = cardOnlyMovesSorted[0];
            const topCardOnlyScore = topCardOnlyMove.cardOnlyScore;
            const tokenMoveArr = this.filterAndSortTokenScoreResults(topCardOnlyScore, allMoves);
            console.log('tokenMovesSorted', tokenMoveArr);
            const topTokenMove = tokenMoveArr[0];
            // if there is at least 1 item in the tokenmove list after filtering,
            // that's our choice.
            const finalChoice = topTokenMove ? topTokenMove : topCardOnlyMove;
            // play card
            this.playCard(finalChoice.spaceToPlaceCard.getID(), finalChoice.cardToPlay.getId());
            console.log(`${this.playerID} played ${finalChoice.cardToPlay.getName()} to ${finalChoice.spaceToPlaceCard.getID()}`);
            if (this.sendCardPlaytoView) {
                this.sendCardPlaytoView(finalChoice.cardToPlay, finalChoice.spaceToPlaceCard);
            }
            // if token play information exists, play token
            if ((finalChoice === null || finalChoice === void 0 ? void 0 : finalChoice.withTokenScore) && (finalChoice === null || finalChoice === void 0 ? void 0 : finalChoice.spaceToPlaceToken)) {
                this.placeToken(finalChoice.spaceToPlaceToken.getID());
                if (this.sendTokenPlayToView) {
                    this.sendTokenPlayToView(finalChoice.spaceToPlaceToken);
                }
                console.log(`${this.playerID} played a token to ${(_a = finalChoice.spaceToPlaceToken) === null || _a === void 0 ? void 0 : _a.getID()}`);
            }
            this.drawCard();
        };
        this.opponentID = opponentID;
    }
    getAllAvailableMoves() {
        const currentHumanScore = this.gameBoard.getPlayerScore(this.opponentID);
        const currentComputerScore = this.gameBoard.getPlayerScore(this.playerID);
        const resultsArr = [];
        const adjustedCardValueThreshold = this.adjustMinThreshold(CARD_VALUE_THRESHOLD);
        // sort cards in hand by value. If it's not possible to increase the
        // score this turn, then at least we will only play the lowest valued card
        const handArr = this.getHandArr().sort((a, b) => {
            return a.getValue() - b.getValue();
        });
        //for each card in computers hand,
        handArr.forEach((card) => {
            this.gameBoard.getAvailableSpaces().forEach((availCardSpace) => {
                // see what the change in score will be for each open space on the board
                this.gameBoard.setCard(availCardSpace.getID(), card);
                const changeInHumanScore = this.gameBoard.getPlayerScore(this.opponentID) - currentHumanScore;
                const changeInComputerScore = this.gameBoard.getPlayerScore(this.playerID) - currentComputerScore;
                const cardOnlyScore = changeInComputerScore - changeInHumanScore;
                const cardOnlyScoreObj = {
                    cardToPlay: card,
                    spaceToPlaceCard: availCardSpace,
                    cardOnlyScore: cardOnlyScore,
                    spaceToPlaceToken: undefined,
                    tokenSpaceCardValue: undefined,
                    withTokenScore: undefined
                };
                resultsArr.push(cardOnlyScoreObj);
                // then also check what the change in score will be when placing a token
                // in any space meeting the minimum card valuerequirements
                if (this.influenceTokens > 0) {
                    this.gameBoard
                        .getAvailableTokenSpaces(this.playerID)
                        .forEach((availTokenSpace) => {
                        const tokenSpaceCard = availTokenSpace.getCard();
                        if (tokenSpaceCard) {
                            // check whether the card value meets our mimnimum threshold
                            const tokenSpaceCardValue = tokenSpaceCard.getValue();
                            if (tokenSpaceCardValue >= adjustedCardValueThreshold) {
                                //if it does, create a resultsObj and push to results.
                                this.gameBoard.setPlayerToken(availTokenSpace.getID(), this.playerID);
                                const tokenChangeInHumanScore = this.gameBoard.getPlayerScore(this.opponentID) -
                                    currentHumanScore;
                                const tokenChangeInComputerScore = this.gameBoard.getPlayerScore(this.playerID) -
                                    currentComputerScore;
                                const withTokenScore = tokenChangeInComputerScore - tokenChangeInHumanScore;
                                const withTokenScoreObj = {
                                    cardToPlay: card,
                                    spaceToPlaceCard: availCardSpace,
                                    cardOnlyScore: cardOnlyScore,
                                    spaceToPlaceToken: availTokenSpace,
                                    tokenSpaceCardValue: tokenSpaceCardValue,
                                    withTokenScore: withTokenScore
                                };
                                resultsArr.push(withTokenScoreObj);
                                // reset score after each token removal
                                this.gameBoard.removePlayerTokenAndResolveBoard(availTokenSpace.getID());
                            }
                        }
                    });
                }
                // reset score after each card removal
                this.gameBoard.removeCardAndResolveBoard(availCardSpace.getID());
            });
        });
        return resultsArr;
    }
    // helper fn to adjust requirements for placing an influence
    // token as the game progresses
    adjustMinThreshold(hopedForAmt) {
        const spaceLeft = this.gameBoard.getRemainingSpacesNumber();
        const sizeOfTheBoard = Math.pow(this.gameBoard.getBoardSize(), 2);
        const settledForNumber = Math.ceil(hopedForAmt * (spaceLeft / sizeOfTheBoard));
        return settledForNumber;
    }
    // helper fn to test wether a potential token placement meets minimum
    filterAndSortTokenScoreResults(topCardScore, tokenScoreArr) {
        const adjustedCardValueThreshold = this.adjustMinThreshold(CARD_VALUE_THRESHOLD);
        const adjustedScoreThreshold = this.adjustMinThreshold(SCORE_INCREASE_THRESHOLD);
        // check for withTokenScore to remove card-only results from the list.
        // Then remove results which don't raise the score by the minimum threshold
        // versus just playing a card
        tokenScoreArr = tokenScoreArr.filter((ele) => ele.withTokenScore !== undefined &&
            ele.withTokenScore - topCardScore >= adjustedScoreThreshold);
        // sort the array first by score,
        // then by the value of the card the token will be placed on
        return tokenScoreArr.sort((a, b) => b.withTokenScore - a.withTokenScore ||
            b.tokenSpaceCardValue - a.tokenSpaceCardValue);
    }
}
