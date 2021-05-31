document.addEventListener("DOMContentLoaded", () => {
  const gameBoard = document.querySelector(".gameboard-grid-container");

  //Set board size in js and css
  const BOARD_DIMENSIONS = 6;
  document.documentElement.style.setProperty(
    "--gameboard-spaces-width",
    String(BOARD_DIMENSIONS)
  );

  const boardSpaces = [];

  //Create checkered board with id's. Fn works for even or odd number size grids.
  function createBoard(grid, spaces, width) {
    console.log("fn called");
    let isDark = false;
    let isBoardWidthEven = width % 2 === 0;
    for (let idx = 0; idx < width * width; idx++) {
      const space = document.createElement("div");
      space.className += "gameboard-grid-item";
      space.dataset.id = String(idx);

      // if board width is even, swap color of starting tile for each new row
      if (isBoardWidthEven) {
        if (idx > 0 && idx % width === 0) {
          isDark = isDark ? false : true;
        }
      }

      if (isDark) {
        space.className += " dark-square";
        isDark = false;
      } else {
        isDark = true;
      }

      grid.appendChild(space);
      spaces.push(space);
    }
  }
  createBoard(gameBoard, boardSpaces, BOARD_DIMENSIONS);
});
