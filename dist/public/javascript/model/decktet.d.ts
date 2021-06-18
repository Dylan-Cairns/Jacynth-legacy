export declare type Suit = 'Knots' | 'Leaves' | 'Moons' | 'Suns' | 'Waves' | 'Wyrms';
export declare type DeckType = 'basicDeck' | 'extendedDeck';
declare type Rank = 'Ace' | 'Numeral' | 'Crown' | 'Pawn' | 'Court';
declare type RawCardObj = {
    name: string;
    id: string;
    rank: Rank;
    value: string;
    suit1: Suit;
    suit2: Suit;
    suit3: Suit;
};
export declare class Card {
    private name;
    private id;
    private rank;
    private value;
    private suits;
    constructor(argObj: RawCardObj);
    getName(): string;
    getId(): string;
    getRank(): Rank;
    getValue(): number;
    getAllSuits(): Suit[];
    hasSuit(suit: Suit): boolean;
}
export declare class Decktet {
    private cards;
    constructor(deckType: DeckType);
    drawCard(): Card | undefined;
    getRemainingCards(): number;
    shuffle(): void;
    getCardByID(cardID: string): Card | undefined;
}
export {};
