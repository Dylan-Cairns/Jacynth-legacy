import { Suit, Card } from './decktet.js';
import { PlayerID } from './player.js';
export declare class BoardSpace {
    private id;
    private card;
    private playerToken;
    private controllingSpaceBySuit;
    constructor(id: string);
    setCard(card: Card): boolean;
    setPlayerToken(player: string): boolean;
    setControlbySuit(suit: Suit, id: string): void;
    getID(): string;
    getCard(): Card | undefined;
    getPlayerToken(): string | undefined;
    getControlledSuitsMap(): Map<Suit, string>;
    getControllingSpaceID(suit: Suit): string | undefined;
    removeCard(): void;
    removePlayerToken(): void;
    resetSuitsControlMap(): void;
}
export declare class GameBoard {
    private boardSize;
    private spaces;
    private remainingSpaces;
    constructor(boardSize: number);
    getBoardSize(): number;
    getSpace: (spaceID: string) => BoardSpace | undefined;
    getAllSpaces(): Map<string, BoardSpace>;
    getCard(spaceID: string): Card | undefined;
    getPlayerToken(spaceID: string): string | undefined;
    getControllingSpace(spaceID: string, suit: Suit): string | undefined;
    getRemainingSpacesNumber(): number;
    setCard(spaceID: string, card: Card): boolean;
    getAdjacentSpaces(spaceID: string): BoardSpace[];
    isPlayableSpace(spaceID: string): boolean;
    getAvailableSpaces: () => BoardSpace[];
    getDistrict(SpaceID: string, suit: Suit): BoardSpace[];
    setPlayerToken(spaceID: string, playerID: PlayerID): boolean;
    resolveInfluenceConflicts: (boardSpace: BoardSpace) => void;
    getAvailableTokenSpaces: (playerID: PlayerID) => BoardSpace[];
    getPlayerScore: (playerID: string) => number;
    resolveInflunceForEntireBoard: () => void;
    removeCardAndResolveBoard: (spaceID: string) => void;
    removePlayerTokenAndResolveBoard: (spaceID: string) => void;
}
