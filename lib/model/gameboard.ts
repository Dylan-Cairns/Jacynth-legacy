import { Suit, Card, Decktet } from './decktet';

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
    if (this.getCard()) throw new Error('space already occupied by card');
    this.card = card;
  }

  setPlayerToken(player: string) {
    if (!this.getCard()) throw new Error('no card on space, cannot be claimed');
    this.playerToken = player;
  }

  setControlbySuit(suit: Suit, id: string) {
    if (!this.getCard()) throw new Error('no card on space, cannot be claimed');
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
        const newID = `x${x}y${y}`;
        const newSpace = new BoardSpace(newID);
        this.spaces.set(newID, newSpace);
      }
    }
  }

  getSpace(id: string) {
    if (this.spaces.get(id) !== undefined) {
      return this.spaces.get(id);
    }
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
    const x = parseInt(id[1]);
    const y = parseInt(id[3]);
    const results = [] as BoardSpace[];
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
        if (space) results.push(space);
      }
    });
    return results;
  }

  // To be available, a space must be empty
  // and adjacent to an already played card
  isPlayableSpace(id: string): boolean {
    const space = this.spaces.get(id);
    if (!space) return false;
    if (space.getCard()) return false;

    const adjArr = this.getAdjacentSpaces(id);
    for (let idx = 0; idx < adjArr.length; idx++) {
      if (adjArr[idx].getCard()) {
        return true;
      }
    }
    return false;
  }

  getAvailableSpaces(): Map<string, BoardSpace> {
    const results = new Map();
    this.spaces.forEach((space) => {
      const id = space.getID();
      if (this.isPlayableSpace(id)) {
        results.set(id, space);
      }
    });
    return results;
  }

  getDistrict(id: string, suit: Suit): BoardSpace[] {
    const results = [] as BoardSpace[];
    const currentSpace = this.getSpace(id);
    if (!currentSpace || !suit) return results;
    const currentCard = currentSpace.getCard();
    if (!currentCard || !currentCard.hasSuit(suit)) return results;

    results.push(currentSpace);

    const searchConnectedTiles = (id: string, suit: Suit) => {
      this.getAdjacentSpaces(id).forEach((space) => {
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
    searchConnectedTiles(id, suit);
    return results;
  }

  setPlayerToken(id: string, player: string): boolean {
    const currentSpace = this.getSpace(id);
    if (!currentSpace) return false;
    const currentCard = currentSpace.getCard();
    if (!currentCard) return false;
    if (currentSpace.getPlayerToken()) return false;

    // check if card belongs to another players district in any suit
    const suits = currentCard.getAllSuits();
    for (const suit of suits) {
      const district = this.getDistrict(id, suit);
      for (const space of district) {
        if (space.getPlayerToken() && space.getPlayerToken() !== player) {
          return false;
        }
      }
    }
    // if no marker and not controlled by another player, place
    // marker and claim all districts
    currentSpace.setPlayerToken(player);
    for (const suit of suits) {
      const district = this.getDistrict(id, suit);
      for (const space of district) {
        space.setControlbySuit(suit, id);
      }
    }
    return true;
  }

  setCard(id: string, card: Card) {
    const space = this.getSpace(id);
    if (space) space.setCard(card);
    // resolve any influence conflicts
    const suits = card.getAllSuits();
    suits.forEach((suit) => {
      const district = this.getDistrict(id, suit);
      let spacesWithTokens = district.filter((space) => space.getPlayerToken());
      if (spacesWithTokens.length > 1) {
        spacesWithTokens = spacesWithTokens.sort((a, b) => {
          const ele1 = a.getCard()?.getValue() as number;
          const ele2 = b.getCard()?.getValue() as number;
          return ele1 - ele2;
        });
        const controllingSpace = spacesWithTokens[0];
        district.forEach((space) => {
          space.setControlbySuit(suit, controllingSpace.getID());
        });
      }
    });
  }
}
const deck = new Decktet({ isBasicDeck: true });
const board = new GameBoard(5);

board.spaces.forEach((space) => {
  const id = space.getID();
  const card = deck.drawCard() as Card;
  board.setCard(id, card);
});
console.log('x0y0', board.getSpace('x0y0')?.getCard()?.getAllSuits());
console.log('x0y1', board.getSpace('x0y1')?.getCard()?.getAllSuits());
console.log('x1y0', board.getSpace('x1y0')?.getCard()?.getAllSuits());
board.setPlayerToken('x0y0', 'player1');
board
  .getSpace('x0y0')
  ?.getCard()
  ?.getAllSuits()
  ?.forEach((suit) =>
    console.log(`district for ${suit}: `, board.getDistrict('x0y0', suit))
  );

const space1Suits = board.getCard('x0y0')?.getAllSuits() as Suit[];
space1Suits?.forEach((suit) => {
  const district = board.getDistrict('x0y0', suit);
  if (district.length > 1) {
    const space = district[district.length - 1];
    console.log(board.setPlayerToken(space.getID(), 'player2'));
  }
});
