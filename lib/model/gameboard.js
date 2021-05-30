class boardSpace {
  constructor(id) {
    this.id = id;
    this.card = "";
    this.playerToken = "";
    this.controllingSpaceBySuit = new Map();
  }

  setCard(card) {
    this.card = card;
  }

  setPlayerToken() {
    this.playerToken = this.playerToken;
  }

  setControlbySuit(suit, space) {
    this.controllingSpaceBySuit.set(suit, space);
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

  getControllingSpace(suit) {
    return this.controllingSpaceBySuit.get(suit);
  }
}

class gameBoard {
  constructor(boardSize) {
    this.boardSize = boardSize;
    this.spaces = new Map();
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        let newID = `x${x}y${y}`;
        let newSpace = new boardSpace(newID);
        this.spaces.set(newID, newSpace);
      }
    }
  }

  setCard(id, card) {
    this.spaces.get(id).setCard(card);
  }

  setControllingPlayer(id, player) {
    this.spaces.get(id).setPlayerToken(player);
  }

  setControllingTile(id, suit, space) {
    this.spaces.get(id).setControlbySuit(suit, space);
  }

  getCard(id) {
    return this.spaces.get(id);
  }

  getPlayerToken(id) {
    return this.spaces.get(id).getPlayerToken();
  }

  getControllingSpace(id, suit) {
    return this.spaces.get(id).getControllingSpace(suit);
  }

  getAdjacentSpaces(id) {
    let x = parseInt(id[1]);
    let y = parseInt(id[3]);
    let results = [];

    if (x - 1 >= 0) results.push(this.spaces.get(`x${x - 1}y${y}`));
    if (y - 1 >= 0) results.push(this.spaces.get(`x${x}y${y - 1}`));
    if (x + 1 < this.boardSize) results.push(this.spaces.get(`x${x + 1}y${y}`));
    if (y + 1 < this.boardSize) results.push(this.spaces.get(`x${x}y${y + 1}`));

    return results;
  }

  // To be available, a space must be empty
  // and adjacent to an already played card
  isPlayableSpace(id) {
    if (this.spaces.get(id).getCard()) return false;

    let adjArr = this.getAdjacentSpaces(id);
    for (let idx = 0; idx < adjArr.length; idx++) {
      if (adjArr[idx].getCard()) {
        return true;
      }
    }
    return false;
  }

  getAvailableSpaces() {
    let results = new Map();
    this.spaces.forEach((space) => {
      let id = space.getID();
      if (this.isPlayableSpace(id)) {
        results.set(id, space);
      }
    });
    return results;
  }

  getDistrict() {}
}

let board = new gameBoard(5);
console.log("adj spaces: ", board.getAdjacentSpaces("x1y1"));
