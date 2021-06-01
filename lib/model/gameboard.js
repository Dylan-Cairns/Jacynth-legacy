"use strict";
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
exports.__esModule = true;
var decktet_1 = require("./decktet");
var BoardSpace = /** @class */ (function () {
    function BoardSpace(id) {
        this.id = id;
        this.card = undefined;
        this.playerToken = undefined;
        this.controllingSpaceBySuit = new Map();
    }
    BoardSpace.prototype.setCard = function (card) {
        if (this.getCard())
            throw new Error('space already occupied by card');
        this.card = card;
    };
    BoardSpace.prototype.setPlayerToken = function (player) {
        if (!this.getCard())
            throw new Error('no card on space, cannot be claimed');
        this.playerToken = player;
    };
    BoardSpace.prototype.setControlbySuit = function (suit, id) {
        if (!this.getCard())
            throw new Error('no card on space, cannot be claimed');
        this.controllingSpaceBySuit.set(suit, id);
    };
    BoardSpace.prototype.getID = function () {
        return this.id;
    };
    BoardSpace.prototype.getCard = function () {
        return this.card;
    };
    BoardSpace.prototype.getPlayerToken = function () {
        return this.playerToken;
    };
    BoardSpace.prototype.getControlledSuitsMap = function () {
        return this.controllingSpaceBySuit;
    };
    BoardSpace.prototype.getControllingSpaceID = function (suit) {
        return this.controllingSpaceBySuit.get(suit);
    };
    return BoardSpace;
}());
var GameBoard = /** @class */ (function () {
    function GameBoard(boardSize) {
        this.boardSize = boardSize;
        this.spaces = new Map();
        for (var y = 0; y < boardSize; y++) {
            for (var x = 0; x < boardSize; x++) {
                var newID = "x" + x + "y" + y;
                var newSpace = new BoardSpace(newID);
                this.spaces.set(newID, newSpace);
            }
        }
    }
    GameBoard.prototype.getSpace = function (id) {
        if (this.spaces.get(id) !== undefined) {
            return this.spaces.get(id);
        }
    };
    GameBoard.prototype.getCard = function (id) {
        var _a;
        return (_a = this.spaces.get(id)) === null || _a === void 0 ? void 0 : _a.getCard();
    };
    GameBoard.prototype.getPlayerToken = function (id) {
        var _a;
        return (_a = this.spaces.get(id)) === null || _a === void 0 ? void 0 : _a.getPlayerToken();
    };
    GameBoard.prototype.getControllingSpace = function (id, suit) {
        var _a;
        return (_a = this.spaces.get(id)) === null || _a === void 0 ? void 0 : _a.getControllingSpaceID(suit);
    };
    GameBoard.prototype.getAdjacentSpaces = function (id) {
        var _this = this;
        var x = parseInt(id[1]);
        var y = parseInt(id[3]);
        var results = [];
        var adjArr = [
            [x - 1, y],
            [x, y - 1],
            [x + 1, y],
            [x, y + 1]
        ];
        adjArr.forEach(function (coord) {
            var x = coord[0];
            var y = coord[1];
            if (x >= 0 && x < _this.boardSize && y >= 0 && y < _this.boardSize) {
                var space = _this.spaces.get("x" + coord[0] + "y" + coord[1]);
                if (space)
                    results.push(space);
            }
        });
        return results;
    };
    // To be available, a space must be empty
    // and adjacent to an already played card
    GameBoard.prototype.isPlayableSpace = function (id) {
        var space = this.spaces.get(id);
        if (!space)
            return false;
        if (space.getCard())
            return false;
        var adjArr = this.getAdjacentSpaces(id);
        for (var idx = 0; idx < adjArr.length; idx++) {
            if (adjArr[idx].getCard()) {
                return true;
            }
        }
        return false;
    };
    GameBoard.prototype.getAvailableSpaces = function () {
        var _this = this;
        var results = new Map();
        this.spaces.forEach(function (space) {
            var id = space.getID();
            if (_this.isPlayableSpace(id)) {
                results.set(id, space);
            }
        });
        return results;
    };
    GameBoard.prototype.getDistrict = function (id, suit) {
        var _this = this;
        var results = [];
        var currentSpace = this.getSpace(id);
        if (!currentSpace || !suit)
            return results;
        var currentCard = currentSpace.getCard();
        if (!currentCard || !currentCard.hasSuit(suit))
            return results;
        results.push(currentSpace);
        var searchConnectedTiles = function (id, suit) {
            _this.getAdjacentSpaces(id).forEach(function (space) {
                if (!results.includes(space)) {
                    var card = space.getCard();
                    if (card) {
                        if (card.getAllSuits().includes(suit)) {
                            results.push(space);
                            searchConnectedTiles(space.getID(), suit);
                        }
                    }
                }
            });
        };
        searchConnectedTiles(id, suit);
        return results;
    };
    GameBoard.prototype.setPlayerToken = function (id, player) {
        var currentSpace = this.getSpace(id);
        if (!currentSpace)
            return false;
        var currentCard = currentSpace.getCard();
        if (!currentCard)
            return false;
        if (currentSpace.getPlayerToken())
            return false;
        // check if card belongs to another players district in any suit
        var suits = currentCard.getAllSuits();
        for (var _i = 0, suits_1 = suits; _i < suits_1.length; _i++) {
            var suit = suits_1[_i];
            var district = this.getDistrict(id, suit);
            for (var _a = 0, district_1 = district; _a < district_1.length; _a++) {
                var space = district_1[_a];
                if (space.getPlayerToken() && space.getPlayerToken() !== player) {
                    return false;
                }
            }
        }
        // if no marker and not controlled by another player, place
        // marker and claim all districts
        currentSpace.setPlayerToken(player);
        for (var _b = 0, suits_2 = suits; _b < suits_2.length; _b++) {
            var suit = suits_2[_b];
            var district = this.getDistrict(id, suit);
            for (var _c = 0, district_2 = district; _c < district_2.length; _c++) {
                var space = district_2[_c];
                space.setControlbySuit(suit, id);
            }
        }
        return true;
    };
    GameBoard.prototype.setCard = function (id, card) {
        var _this = this;
        var space = this.getSpace(id);
        if (space)
            space.setCard(card);
        // resolve any influence conflicts
        var suits = card.getAllSuits();
        suits.forEach(function (suit) {
            var district = _this.getDistrict(id, suit);
            var spacesWithTokens = district.filter(function (space) { return space.getPlayerToken(); });
            if (spacesWithTokens.length > 1) {
                spacesWithTokens = spacesWithTokens.sort(function (a, b) {
                    var _a, _b;
                    var ele1 = (_a = a.getCard()) === null || _a === void 0 ? void 0 : _a.getValue();
                    var ele2 = (_b = b.getCard()) === null || _b === void 0 ? void 0 : _b.getValue();
                    return ele1 - ele2;
                });
                var controllingSpace_1 = spacesWithTokens[0];
                district.forEach(function (space) {
                    space.setControlbySuit(suit, controllingSpace_1.getID());
                });
            }
        });
    };
    return GameBoard;
}());
var deck = new decktet_1.Decktet({ isBasicDeck: true });
var board = new GameBoard(5);
board.spaces.forEach(function (space) {
    var id = space.getID();
    var card = deck.drawCard();
    board.setCard(id, card);
});
console.log('x0y0', (_b = (_a = board.getSpace('x0y0')) === null || _a === void 0 ? void 0 : _a.getCard()) === null || _b === void 0 ? void 0 : _b.getAllSuits());
console.log('x0y1', (_d = (_c = board.getSpace('x0y1')) === null || _c === void 0 ? void 0 : _c.getCard()) === null || _d === void 0 ? void 0 : _d.getAllSuits());
console.log('x1y0', (_f = (_e = board.getSpace('x1y0')) === null || _e === void 0 ? void 0 : _e.getCard()) === null || _f === void 0 ? void 0 : _f.getAllSuits());
board.setPlayerToken('x0y0', 'player1');
(_j = (_h = (_g = board
    .getSpace('x0y0')) === null || _g === void 0 ? void 0 : _g.getCard()) === null || _h === void 0 ? void 0 : _h.getAllSuits()) === null || _j === void 0 ? void 0 : _j.forEach(function (suit) {
    return console.log("district for " + suit + ": ", board.getDistrict('x0y0', suit));
});
var space1Suits = (_k = board.getCard('x0y0')) === null || _k === void 0 ? void 0 : _k.getAllSuits();
space1Suits === null || space1Suits === void 0 ? void 0 : space1Suits.forEach(function (suit) {
    var district = board.getDistrict('x0y0', suit);
    if (district.length > 1) {
        var space = district[district.length - 1];
        console.log(board.setPlayerToken(space.getID(), 'player2'));
    }
});
