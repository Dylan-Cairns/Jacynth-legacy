board
  .getSpace('x0y0')
  ?.getCard()
  ?.getAllSuits()
  ?.forEach((suit) =>
    console.log(`district for ${suit}: `, board.getDistrict('x0y0', suit))
  );