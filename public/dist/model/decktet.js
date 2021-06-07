const RAW_CARD_OBJECTS = [
    {
        name: 'Ace of Knots',
        rank: 'Ace',
        value: '1',
        suit1: 'Knots',
        suit2: '',
        suit3: ''
    },
    {
        name: 'Ace of Leaves',
        rank: 'Ace',
        value: '1',
        suit1: 'Leaves',
        suit2: '',
        suit3: ''
    },
    {
        name: 'Ace of Moons',
        rank: 'Ace',
        value: '1',
        suit1: 'Moons',
        suit2: '',
        suit3: ''
    },
    {
        name: 'Ace of Suns',
        rank: 'Ace',
        value: '1',
        suit1: 'Suns',
        suit2: '',
        suit3: ''
    },
    {
        name: 'Ace of Waves',
        rank: 'Ace',
        value: '1',
        suit1: 'Waves',
        suit2: '',
        suit3: ''
    },
    {
        name: 'Ace of Wyrms',
        rank: 'Ace',
        value: '1',
        suit1: 'Wyrms',
        suit2: '',
        suit3: ''
    },
    {
        name: 'the AUTHOR',
        rank: 'Numeral',
        value: '2',
        suit1: 'Moons',
        suit2: 'Knots',
        suit3: ''
    },
    {
        name: 'the DESERT',
        rank: 'Numeral',
        value: '2',
        suit1: 'Suns',
        suit2: 'Wyrms',
        suit3: ''
    },
    {
        name: 'the ORIGIN',
        rank: 'Numeral',
        value: '2',
        suit1: 'Waves',
        suit2: 'Leaves',
        suit3: ''
    },
    {
        name: 'the JOURNEY',
        rank: 'Numeral',
        value: '3',
        suit1: 'Moons',
        suit2: 'Waves',
        suit3: ''
    },
    {
        name: 'the PAINTER',
        rank: 'Numeral',
        value: '3',
        suit1: 'Suns',
        suit2: 'Knots',
        suit3: ''
    },
    {
        name: 'the SAVAGE',
        rank: 'Numeral',
        value: '3',
        suit1: 'Leaves',
        suit2: 'Wyrms',
        suit3: ''
    },
    {
        name: 'the BATTLE',
        rank: 'Numeral',
        value: '4',
        suit1: 'Wyrms',
        suit2: 'Knots',
        suit3: ''
    },
    {
        name: 'the MOUNTAIN',
        rank: 'Numeral',
        value: '4',
        suit1: 'Moons',
        suit2: 'Suns',
        suit3: ''
    },
    {
        name: 'the SAILOR',
        rank: 'Numeral',
        value: '4',
        suit1: 'Waves',
        suit2: 'Leaves',
        suit3: ''
    },
    {
        name: 'the DISCOVERY',
        rank: 'Numeral',
        value: '5',
        suit1: 'Suns',
        suit2: 'Waves',
        suit3: ''
    },
    {
        name: 'the FOREST',
        rank: 'Numeral',
        value: '5',
        suit1: 'Moons',
        suit2: 'Leaves',
        suit3: ''
    },
    {
        name: 'the SOLDIER',
        rank: 'Numeral',
        value: '5',
        suit1: 'Wyrms',
        suit2: 'Knots',
        suit3: ''
    },
    {
        name: 'the LUNATIC',
        rank: 'Numeral',
        value: '6',
        suit1: 'Moons',
        suit2: 'Waves',
        suit3: ''
    },
    {
        name: 'the MARKET',
        rank: 'Numeral',
        value: '6',
        suit1: 'Leaves',
        suit2: 'Knots',
        suit3: ''
    },
    {
        name: 'the PENITENT',
        rank: 'Numeral',
        value: '6',
        suit1: 'Suns',
        suit2: 'Wyrms',
        suit3: ''
    },
    {
        name: 'the CASTLE',
        rank: 'Numeral',
        value: '7',
        suit1: 'Suns',
        suit2: 'Knots',
        suit3: ''
    },
    {
        name: 'the CAVE',
        rank: 'Numeral',
        value: '7',
        suit1: 'Waves',
        suit2: 'Wyrms',
        suit3: ''
    },
    {
        name: 'the CHANCE MEETING',
        rank: 'Numeral',
        value: '7',
        suit1: 'Moons',
        suit2: 'Leaves',
        suit3: ''
    },
    {
        name: 'the BETRAYAL',
        rank: 'Numeral',
        value: '8',
        suit1: 'Wyrms',
        suit2: 'Knots',
        suit3: ''
    },
    {
        name: 'the DIPLOMAT',
        rank: 'Numeral',
        value: '8',
        suit1: 'Moons',
        suit2: 'Suns',
        suit3: ''
    },
    {
        name: 'the MILL',
        rank: 'Numeral',
        value: '8',
        suit1: 'Waves',
        suit2: 'Leaves',
        suit3: ''
    },
    {
        name: 'the DARKNESS',
        rank: 'Numeral',
        value: '9',
        suit1: 'Waves',
        suit2: 'Wyrms',
        suit3: ''
    },
    {
        name: 'the MERCHANT',
        rank: 'Numeral',
        value: '9',
        suit1: 'Leaves',
        suit2: 'Knots',
        suit3: ''
    },
    {
        name: 'the PACT',
        rank: 'Numeral',
        value: '9',
        suit1: 'Moons',
        suit2: 'Suns',
        suit3: ''
    },
    {
        name: 'the WINDFALL',
        rank: 'Crown',
        value: '10',
        suit1: 'Knots',
        suit2: '',
        suit3: ''
    },
    {
        name: 'the END',
        rank: 'Crown',
        value: '10',
        suit1: 'Leaves',
        suit2: '',
        suit3: ''
    },
    {
        name: 'the HUNTRESS',
        rank: 'Crown',
        value: '10',
        suit1: 'Moons',
        suit2: '',
        suit3: ''
    },
    {
        name: 'the BARD',
        rank: 'Crown',
        value: '10',
        suit1: 'Suns',
        suit2: '',
        suit3: ''
    },
    {
        name: 'the SEA',
        rank: 'Crown',
        value: '10',
        suit1: 'Waves',
        suit2: '',
        suit3: ''
    },
    {
        name: 'the CALAMITY',
        rank: 'Crown',
        value: '10',
        suit1: 'Wyrms',
        suit2: '',
        suit3: ''
    },
    {
        name: 'the EXCUSE',
        rank: 'Excuse',
        value: '0',
        suit1: '',
        suit2: '',
        suit3: ''
    },
    {
        name: 'the BORDERLAND',
        rank: 'Pawn',
        value: '11',
        suit1: 'Waves',
        suit2: 'Leaves',
        suit3: 'Wyrms'
    },
    {
        name: 'the HARVEST',
        rank: 'Pawn',
        value: '11',
        suit1: 'Moons',
        suit2: 'Suns',
        suit3: 'Leaves'
    },
    {
        name: 'the LIGHT KEEPER',
        rank: 'Pawn',
        value: '11',
        suit1: 'Suns',
        suit2: 'Waves',
        suit3: 'Knots'
    },
    {
        name: 'the WATCHMAN',
        rank: 'Pawn',
        value: '11',
        suit1: 'Moons',
        suit2: 'Wyrms',
        suit3: 'Knots'
    },
    {
        name: 'the CONSUL',
        rank: 'Court',
        value: '12',
        suit1: 'Moons',
        suit2: 'Waves',
        suit3: 'Knots'
    },
    {
        name: 'the ISLAND',
        rank: 'Court',
        value: '12',
        suit1: 'Suns',
        suit2: 'Waves',
        suit3: 'Wyrms'
    },
    {
        name: 'the RITE',
        rank: 'Court',
        value: '12',
        suit1: 'Moons',
        suit2: 'Leaves',
        suit3: 'Wyrms'
    },
    {
        name: 'the WINDOW',
        rank: 'Court',
        value: '12',
        suit1: 'Suns',
        suit2: 'Leaves',
        suit3: 'Knots'
    }
];
export class Card {
    constructor(argObj) {
        this.name = argObj.name;
        this.rank = argObj.rank;
        this.value = Number(argObj.value);
        this.suits = [];
        [argObj.suit1, argObj.suit2, argObj.suit3].forEach((suit) => {
            if (suit)
                this.suits.push(suit);
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
    hasSuit(suit) {
        return this.suits.includes(suit);
    }
}
export class Decktet {
    constructor(deckType) {
        this.cards = [];
        if (deckType === 'basicDeck') {
            for (const obj of RAW_CARD_OBJECTS) {
                if (['Ace', 'Numeral', 'Crown'].includes(obj.rank)) {
                    const card = new Card(obj);
                    this.cards.push(card);
                }
            }
        }
        else {
            for (const obj of RAW_CARD_OBJECTS) {
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
