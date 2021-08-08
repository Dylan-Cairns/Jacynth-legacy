export class BoardSpace {
    constructor(id) {
        this.id = id;
        this.card = undefined;
        this.playerToken = undefined;
        this.controllingSpaceBySuit = new Map();
    }
    setCard(card) {
        if (this.getCard())
            throw new Error('space already has card');
        this.card = card;
        return true;
    }
    setPlayerToken(playerID) {
        if (!this.getCard())
            return false;
        if (this.getPlayerToken())
            return false;
        this.playerToken = playerID;
        return true;
    }
    setControlbySuit(suit, id) {
        if (!this.getCard())
            throw new Error('no card on space, cannot be claimed');
        this.controllingSpaceBySuit.set(suit, id);
    }
    getID() {
        return this.id;
    }
    getCard() {
        return this.card;
    }
    getPlayerToken() {
        return this.playerToken;
    }
    getControlledSuitsMap() {
        return this.controllingSpaceBySuit;
    }
    getControllingSpaceID(suit) {
        return this.controllingSpaceBySuit.get(suit);
    }
    removeCard() {
        this.card = undefined;
    }
    removePlayerToken() {
        this.playerToken = undefined;
        this.resetSuitsControlMap();
    }
    resetSuitsControlMap() {
        this.controllingSpaceBySuit = new Map();
    }
}
export class GameBoard {
    constructor(boardSize) {
        this.getSpace = (spaceID) => {
            if (this.spaces.get(spaceID) !== undefined) {
                return this.spaces.get(spaceID);
            }
        };
        this.getRemainingSpacesNumber = () => {
            return this.remainingSpaces;
        };
        this.getAvailableSpaces = () => {
            const results = [];
            this.spaces.forEach((space) => {
                const id = space.getID();
                if (this.isPlayableSpace(id)) {
                    results.push(space);
                }
            });
            return results;
        };
        this.resolveInfluence = (boardSpace) => {
            const card = boardSpace.getCard();
            if (!card)
                throw new Error('no card on space');
            const suits = card.getAllSuits();
            suits.forEach((suit) => {
                const district = this.getDistrict(boardSpace.getID(), suit);
                let spacesWithTokens = district.filter((space) => space.getPlayerToken());
                if (spacesWithTokens.length > 0) {
                    spacesWithTokens = spacesWithTokens.sort((spaceA, spaceB) => {
                        const cardA = spaceA.getCard();
                        const cardB = spaceB.getCard();
                        if (!cardA || !cardB)
                            throw new Error('no card on space during resolveInfluence');
                        const cardAValue = cardA.getValue();
                        const cardBValue = cardB.getValue();
                        return cardBValue - cardAValue;
                    });
                    const controllingSpace = spacesWithTokens[0];
                    district.forEach((space) => {
                        space.setControlbySuit(suit, controllingSpace.getID());
                    });
                }
            });
        };
        this.resolveInflunceForEntireBoard = () => {
            this.spaces.forEach((space) => {
                space.resetSuitsControlMap();
            });
            this.spaces.forEach((space) => {
                if (space.getCard()) {
                    this.resolveInfluence(space);
                }
            });
        };
        this.removeCardAndResolveBoard = (spaceID) => {
            const space = this.spaces.get(spaceID);
            if (space) {
                space.removeCard();
                space.resetSuitsControlMap();
            }
            this.remainingSpaces++;
            this.resolveInflunceForEntireBoard();
        };
        this.removePlayerTokenAndResolveBoard = (spaceID) => {
            var _a;
            (_a = this.spaces.get(spaceID)) === null || _a === void 0 ? void 0 : _a.removePlayerToken();
            this.resolveInflunceForEntireBoard();
        };
        // get all spaces which a player can place a token on.
        // A valid space must have a card, must not have a token already,
        // and must not be part of another players district in any suit.
        this.getAvailableTokenSpaces = (playerID) => {
            // for each space on the board
            const results = [];
            for (const [, space] of this.spaces) {
                // if no card or already has token, move to next space
                if (!space.getCard() || space.getPlayerToken())
                    continue;
                const controlSuits = space.getControlledSuitsMap();
                // if controlledsuitsMap is empty, it's definitely available.
                if (controlSuits.size === 0) {
                    results.push(space);
                    continue;
                }
                else {
                    // check if the controlling space belongs to another player for each suit.
                    let ownedByOtherPlayer = false;
                    for (const [, controllingId] of controlSuits) {
                        const spaceToCheckOwnerOf = this.getSpace(controllingId);
                        if (!spaceToCheckOwnerOf)
                            throw new Error('reference to nonexistant space');
                        if (spaceToCheckOwnerOf.getPlayerToken() !== playerID) {
                            ownedByOtherPlayer = true;
                            break;
                        }
                    }
                    // if it doesn't belong to any other player, add it to the results
                    if (!ownedByOtherPlayer)
                        results.push(space);
                }
            }
            return results;
        };
        this.setPlayerToken = (spaceID, playerID) => {
            const currentSpace = this.getSpace(spaceID);
            if (!currentSpace)
                throw new Error('attempt to claim nonexistant space');
            const currentCard = currentSpace.getCard();
            if (!currentCard)
                throw new Error('cannot claim empty space');
            if (currentSpace.getPlayerToken())
                return false;
            // check if space is on the list of available token spaces
            const availableSpaces = this.getAvailableTokenSpaces(playerID);
            if (!availableSpaces.includes(currentSpace)) {
                console.log('space to place token: ', currentSpace);
                console.log('playeriD: ', playerID);
                console.log('board: ', this.spaces);
                throw new Error('cannot place token on controlled space');
            }
            // if no marker and not controlled by another player, place
            // marker and claim all districts
            currentSpace.setPlayerToken(playerID);
            this.resolveInflunceForEntireBoard();
            return true;
        };
        this.getPlayerScore = (playerID) => {
            let score = 0;
            this.spaces.forEach((space) => {
                if (space.getCard()) {
                    space.getControlledSuitsMap().forEach((controllingSpaceID) => {
                        const controllingSpace = this.spaces.get(controllingSpaceID);
                        const controllingPlayerID = controllingSpace === null || controllingSpace === void 0 ? void 0 : controllingSpace.getPlayerToken();
                        if (controllingPlayerID === playerID)
                            score += 1;
                    });
                }
            });
            return score;
        };
        this.getSpacesControlledByToken = (spaceID) => {
            const resultsTuples = [];
            for (const [id, space] of this.spaces) {
                const card = space.getCard();
                if (!card)
                    continue;
                const controlMap = space.getControlledSuitsMap();
                for (const [suit, controllingSpaceID] of controlMap) {
                    if (controllingSpaceID === spaceID) {
                        resultsTuples.push([space.getID(), suit]);
                    }
                }
            }
            return resultsTuples;
        };
        // return an array of all played cards on the board.
        // used by the computer player.
        this.getAllPlayedCards = () => {
            const cards = [];
            for (const [, space] of this.spaces) {
                const card = space.getCard();
                if (card)
                    cards.push(card);
            }
            return cards;
        };
        this.boardSize = boardSize;
        this.remainingSpaces = boardSize * boardSize;
        this.spaces = new Map();
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                const newID = `x${x}y${y}`;
                const newSpace = new BoardSpace(newID);
                this.spaces.set(newID, newSpace);
            }
        }
    }
    getBoardSize() {
        return this.boardSize;
    }
    getAllSpaces() {
        return this.spaces;
    }
    getCard(spaceID) {
        var _a;
        return (_a = this.spaces.get(spaceID)) === null || _a === void 0 ? void 0 : _a.getCard();
    }
    getPlayerToken(spaceID) {
        var _a;
        return (_a = this.spaces.get(spaceID)) === null || _a === void 0 ? void 0 : _a.getPlayerToken();
    }
    getControllingSpace(spaceID, suit) {
        var _a;
        return (_a = this.spaces.get(spaceID)) === null || _a === void 0 ? void 0 : _a.getControllingSpaceID(suit);
    }
    setCard(spaceID, card) {
        const space = this.getSpace(spaceID);
        if (!space)
            return false;
        if (!space.setCard(card))
            return false;
        this.remainingSpaces--;
        this.resolveInflunceForEntireBoard();
        return true;
    }
    getAdjacentSpaces(spaceID) {
        const x = parseInt(spaceID[1]);
        const y = parseInt(spaceID[3]);
        const results = [];
        const adjArr = [
            [x - 1, y],
            [x, y - 1],
            [x + 1, y],
            [x, y + 1]
        ];
        adjArr.forEach((coord) => {
            const x = coord[0];
            const y = coord[1];
            if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize) {
                const space = this.spaces.get(`x${coord[0]}y${coord[1]}`);
                if (space)
                    results.push(space);
            }
        });
        return results;
    }
    getDiagonalSpaces(spaceID) {
        const x = parseInt(spaceID[1]);
        const y = parseInt(spaceID[3]);
        const diagArr = [
            [x - 1, y - 1],
            [x + 1, y - 1],
            [x - 1, y + 1],
            [x + 1, y + 1]
        ];
        const resultsArr = [];
        for (const coord of diagArr) {
            const space = this.spaces.get(`x${coord[0]}y${coord[1]}`);
            if (space)
                resultsArr.push(space);
        }
        return resultsArr;
    }
    // To be available, a space must be empty
    // and adjacent to an already played card
    isPlayableSpace(spaceID) {
        const space = this.spaces.get(spaceID);
        if (!space)
            return false;
        if (space.getCard())
            return false;
        const adjArr = this.getAdjacentSpaces(spaceID);
        for (let idx = 0; idx < adjArr.length; idx++) {
            if (adjArr[idx].getCard()) {
                return true;
            }
        }
        return false;
    }
    getDistrict(spaceID, suit) {
        const results = [];
        const currentSpace = this.getSpace(spaceID);
        if (!currentSpace)
            return results;
        const currentCard = currentSpace.getCard();
        if (!currentCard || !currentCard.hasSuit(suit))
            return results;
        results.push(currentSpace);
        const searchConnectedTiles = (spaceID, suit) => {
            this.getAdjacentSpaces(spaceID).forEach((space) => {
                if (!results.includes(space)) {
                    const card = space.getCard();
                    if (card) {
                        if (card.getAllSuits().includes(suit)) {
                            results.push(space);
                            searchConnectedTiles(space.getID(), suit);
                        }
                    }
                }
            });
        };
        searchConnectedTiles(spaceID, suit);
        return results;
    }
}
