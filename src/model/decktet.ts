import fs = require('fs');
import parse = require('csv-parse/lib/sync');

export type Suit = 'Knots' | 'Leaves' | 'Moons' | 'Suns' | 'Waves' | 'Wyrms';
type Rank = 'Ace' | 'Numeral' | 'Crown' | 'Pawn' | 'Court';

type ArgObj = {
  name: string;
  rank: Rank;
  value: string;
  suit1: Suit;
  suit2: Suit;
  suit3: Suit;
};

export class Card {
  private name: string;
  private rank: Rank;
  private value: number;
  private suits: Suit[];

  constructor(argObj: ArgObj) {
    this.name = argObj.name;
    this.rank = argObj.rank;
    this.value = Number(argObj.value);
    this.suits = [];
    [argObj.suit1, argObj.suit2, argObj.suit3].forEach((suit) => {
      if (suit) this.suits.push(suit);
    });
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

  hasSuit(suit: Suit) {
    return this.suits.includes(suit);
  }
}

export class Decktet {
  private cards: Card[];

  constructor(argObj: { isBasicDeck: boolean }) {
    this.cards = [];
    // read card data from csv and convert to objects
    const inputStrings = fs.readFileSync('decktet_cards.csv', 'utf-8');
    const inputObjects = parse(inputStrings, { columns: true });
    if (argObj.isBasicDeck) {
      for (const obj of inputObjects) {
        if (['Ace', 'Numeral', 'Crown'].includes(obj.rank)) {
          const card = new Card(obj);
          this.cards.push(card);
        }
      }
    } else {
      for (const obj of inputObjects) {
        const card = new Card(obj);
        this.cards.push(card);
      }
    }
    this.shuffle();
  }

  drawCard() {
    return this.cards.pop();
  }

  getRemainingCards() {
    return this.cards.length;
  }

  shuffle() {
    for (let idx = this.getRemainingCards() - 1; idx > 0; idx--) {
      const newIndex = Math.floor(Math.random() * (idx + 1));
      const oldValue = this.cards[newIndex];
      this.cards[newIndex] = this.cards[idx];
      this.cards[idx] = oldValue;
    }
  }
}

// const deck = new Decktet({ isBasicDeck: true });
