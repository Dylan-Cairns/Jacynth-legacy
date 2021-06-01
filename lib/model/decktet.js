"use strict";
exports.__esModule = true;
exports.Decktet = exports.Card = void 0;
var fs = require("fs");
var parse = require("csv-parse/lib/sync");
var Card = /** @class */ (function () {
    function Card(argObj) {
        var _this = this;
        this.name = argObj.name;
        this.rank = argObj.rank;
        this.value = Number(argObj.value);
        this.suits = [];
        [argObj.suit1, argObj.suit2, argObj.suit3].forEach(function (suit) {
            if (suit)
                _this.suits.push(suit);
        });
    }
    Card.prototype.getName = function () {
        return this.name;
    };
    Card.prototype.getRank = function () {
        return this.rank;
    };
    Card.prototype.getValue = function () {
        return this.value;
    };
    Card.prototype.getAllSuits = function () {
        return this.suits;
    };
    Card.prototype.hasSuit = function (suit) {
        return this.suits.includes(suit);
    };
    return Card;
}());
exports.Card = Card;
var Decktet = /** @class */ (function () {
    function Decktet(argObj) {
        this.cards = [];
        // read card data from csv and convert to objects
        var inputStrings = fs.readFileSync('decktet_cards.csv', 'utf-8');
        var inputObjects = parse(inputStrings, { columns: true });
        if (argObj.isBasicDeck) {
            for (var _i = 0, inputObjects_1 = inputObjects; _i < inputObjects_1.length; _i++) {
                var obj = inputObjects_1[_i];
                if (['Ace', 'Numeral', 'Crown'].includes(obj.rank)) {
                    var card = new Card(obj);
                    this.cards.push(card);
                }
            }
        }
        else {
            for (var _a = 0, inputObjects_2 = inputObjects; _a < inputObjects_2.length; _a++) {
                var obj = inputObjects_2[_a];
                var card = new Card(obj);
                this.cards.push(card);
            }
        }
        this.shuffle();
    }
    Decktet.prototype.drawCard = function () {
        return this.cards.pop();
    };
    Decktet.prototype.getRemainingCards = function () {
        return this.cards.length;
    };
    Decktet.prototype.shuffle = function () {
        for (var idx = this.getRemainingCards() - 1; idx > 0; idx--) {
            var newIndex = Math.floor(Math.random() * (idx + 1));
            var oldValue = this.cards[newIndex];
            this.cards[newIndex] = this.cards[idx];
            this.cards[idx] = oldValue;
        }
    };
    return Decktet;
}());
exports.Decktet = Decktet;
// const deck = new Decktet({ isBasicDeck: true });
