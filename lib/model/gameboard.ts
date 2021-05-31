export {};
const { Card, Decktet } = require("./decktet");

class BoardSpace {
  id: string;
  card: Card | undefined;
  playerToken: string | undefined;
  controllingSpaceBySuit: Map<Suit, string>;

  constructor(id: string) {
    this.id = id;
    this.card = undefined;
    this.playerToken = undefined;
    this.controllingSpaceBySuit = new Map();
  }

  setCard(card: Card) {
    this.card = card;
  }

  setPlayerToken(player: string) {
    this.playerToken = player;
  }

  setControlbySuit(suit: Suit, id: string) {
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

  getControllingSpaceID(suit: Suit) {
    return this.controllingSpaceBySuit.get(suit);
  }
}

class GameBoard {
  boardSize: number;
  spaces: Map<string, BoardSpace>;
  constructor(boardSize: number) {
    this.boardSize = boardSize;
    this.spaces = new Map();
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        let newID = `x${x}y${y}`;
        let newSpace = new BoardSpace(newID);
        this.spaces.set(newID, newSpace);
      }
    }
  }

  getSpace(id: string) {
    return this.spaces.get(id);
  }

  getCard(id: string) {
    return this.spaces.get(id)?.getCard();
  }

  getPlayerToken(id: string) {
    return this.spaces.get(id)?.getPlayerToken();
  }

  getControllingSpace(id: string, suit: Suit) {
    return this.spaces.get(id)?.getControllingSpaceID(suit);
  }

  getAdjacentSpaces(id: string): BoardSpace[] {
    let x = parseInt(id[1]);
    let y = parseInt(id[3]);
    let results = [];

    if (x - 1 >= 0) results.push(this.spaces.get(`x${x - 1}y${y}`)!);
    if (y - 1 >= 0) results.push(this.spaces.get(`x${x}y${y - 1}`)!);
    if (x + 1 < this.boardSize)
      results.push(this.spaces.get(`x${x + 1}y${y}`)!);
    if (y + 1 < this.boardSize)
      results.push(this.spaces.get(`x${x}y${y + 1}`)!);

    return results;
  }

  // To be available, a space must be empty
  // and adjacent to an already played card
  isPlayableSpace(id: string) {
    if (this.spaces.get(id)?.getCard()) return false;

    let adjArr = this.getAdjacentSpaces(id);
    for (let idx = 0; idx < adjArr.length; idx++) {
      if (adjArr[idx].getCard()) {
        return true;
      }
    }
    return false;
  }

  getAvailableSpaces(): Map<string, BoardSpace> {
    let results = new Map();
    this.spaces.forEach((space) => {
      let id = space.getID();
      if (this.isPlayableSpace(id)) {
        results.set(id, space);
      }
    });
    return results;
  }

  getDistrict(id: string, suit: Suit) {
    let space = this.getSpace(id);
    let card = space?.getCard();
    if (typeof card === Card) {
      if (!card.hasSuit(suit)) return [];
    }
    let results = [] as BoardSpace[];
    results.push(space);

    let searchConnectedTiles = (id: string, suit: Suit) => {
      this.getAdjacentSpaces(id).forEach((space) => {
        if (!results.includes(space)) {
          if (
            this.spaces
              .get(space.getID())
              .getCard()
              .getAllSuits()
              .includes(suit)
          ) {
            results.push(this.spaces.get(space.getID()));
            searchConnectedTiles(space.getID(), suit);
          }
        }
      });
    };

    searchConnectedTiles(id, suit);

    return results;
  }

  setPlayerToken(id, player) {
    let currentSpace = this.getSpace(id);
    if (currentSpace.getPlayerToken()) return false;
    // check if card belongs to another players district in any suit
    let suits = currentSpace.getCard().getAllSuits();
    for (let suit of suits) {
      let district = this.getDistrict(id, suit);
      for (let space of district) {
        if (space.getPlayerToken() && space.getPlayerToken() !== player) {
          return false;
        }
      }
    }
    // if no marker and not controlled by another player, place
    // marker and claim all districts
    currentSpace.setPlayerToken(player);
    for (let suit of suits) {
      let district = this.getDistrict(id, suit);
      for (let space of district) {
        space.setControlbySuit(suit, id);
      }
    }
  }
}
let deck = new Decktet({ isBasicDeck: true });
let board = new GameBoard(5);

board.spaces.forEach((space) => space.setCard(deck.drawCard()));

board.setPlayerToken("x0y0", "player1");
console.log(board.getSpace("x0y0"));
