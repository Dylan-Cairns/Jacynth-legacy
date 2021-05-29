const fs = require("fs");
// const parse = require("csv-parse");
const parse = require("csv-parse/lib/sync");

class Card {
  constructor(argObj) {
    this.name = argObj.name;
    this.rank = argObj.rank;
    this.value = parseInt(argObj.value);
    this.suits = [argObj.suit1, argObj.suit2, argObj.suit3];
  }

  getName() {
    return this.name;
  }

  getRank() {
    return this.rank;
  }

  getValue() {
    return this.value;
  }

  getAllSuits() {
    return this.suits;
  }

  hasSuit(suit) {
    return this.suits.includes(suit);
  }
}

class Decktet {
  constructor(argObj) {
    this.cards = [];
    // read card data from csv and convert to objects
    let inputStrings = fs.readFileSync("decktet_cards.csv", "utf-8");
    let inputObjects = parse(inputStrings, { columns: true });
    // console.log(inputObjects);
    if (argObj.isBasicDeck) {
      for (let obj of inputObjects) {
        if (["Ace", "Numeral", "Crown"].includes(obj.rank)) {
          let card = new Card(obj);
          this.cards.push(card);
        }
      }
    } else {
      for (let obj of inputObjects) {
        let card = new Card(obj);
        this.cards.push(card);
      }
    }
    this.shuffle();
  }

  drawCard() {
    return this.cards.pop();
  }

  getNumberofCards() {
    return this.cards.length;
  }

  shuffle() {
    for (let idx = this.getNumberofCards() - 1; idx > 0; idx--) {
      const newIndex = Math.floor(Math.random() * (idx + 1));
      const oldValue = this.cards[newIndex];
      this.cards[newIndex] = this.cards[idx];
      this.cards[idx] = oldValue;
    }
  }
}

let decktet = new Decktet({ isBasicDeck: true });
