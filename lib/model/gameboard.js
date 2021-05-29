class gameBoard {
  constructor(boardSize) {
    this.boardSize = boardSize;
    this.spaces = [];
    for (let y = 0; y < boardSize; y++) {
      this.spaces.push([]);
      for (let x = 0; x < boardSize; x++) {
        let space = {
          id: `x${x} y${y}`,
          card: "",
          player: "",
          controlSuits: {},
        };

        this.spaces[y].push(space);
      }
    }
  }

  setCard(x, y, card) {
    this.spaces[y][x].card = card;
  }

  setControllingPlayer(x, y, player) {
    this.spaces[y][x].player = player;
  }

  setControllingTile(x, y, suit, tile) {
    this.spaces[y][x].controlSuits[suit] = tile;
  }

  getCard(x, y) {
    console.log("accessing getter");
    return this.spaces[y][x].card;
  }

  getControllingPlayer(x, y) {
    return this.spaces[y][x].player;
  }

  getControllingTile(x, y, suit) {
    return this.spaces[y][x].controlSuits;
  }

  getAdjacentSpaces(x, y) {
    let results = [];
    if (x - 1 >= 0) results.push(this.spaces[y][x - 1]);
    if (y - 1 >= 0) results.push(this.spaces[y - 1][x]);
    if (x + 1 < this.boardSize) results.push(this.spaces[y][x + 1]);
    if (y + 1 < this.boardSize) results.push(this.spaces[y + 1][x]);
    return results;
  }

  // To be available, a space must be empty
  // and adjacent to an already played card
  isPlayableSpace(x, y) {
    if (this.spaces[y][x].card) return false;

    let adjArr = this.getAdjacentSpaces(x, y);
    for (let idx = 0; idx < adjArr.length; idx++) {
      if (adjArr[idx].card) {
        return true;
      }
    }
    return false;
  }

  getAvailableSpaces() {
    let results = {};
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (this.isPlayableSpace(x, y)) {
          let space = this.spaces[y][x];
          results[space.id] = space;
        }
      }
    }
    return results;
  }
}

let board = new gameBoard(5);
board.setCard(4, 4, {
  id: "haha",
  name: "take a walk",
  player: "me",
  suits: {},
});
// console.log("adj spaces: ", board.getAdjacentSpaces(0, 0));
console.log(board.getAvailableSpaces());
