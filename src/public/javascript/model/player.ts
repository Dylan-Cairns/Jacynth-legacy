import { Socket } from 'socket.io-client';

import { Suit, Card, Decktet } from './decktet.js';
import { BoardSpace, GameBoard } from './gameboard.js';

// game variables that never change
const PLAYER_INFLUENCE_TOKENS = 4;
const PLAYER_HAND_SIZE = 3;
// initial minimum values used in AI move selection
const CARD_VALUE_THRESHOLD = 7;
const SCORE_INCREASE_THRESHOLD = 3;

type AiMoveSearchResultsObj = {
  cardToPlay: Card;
  spaceToPlaceCard: BoardSpace;
  cardOnlyScore: number;
  spaceToPlaceToken: BoardSpace | undefined;
  tokenSpaceCardValue: number | undefined;
  withTokenScore: number | undefined;
};

type MiniMaxSearchObj = {
  cardToPlay: Card;
  spaceToPlaceCard: BoardSpace;
  spaceToPlaceToken: BoardSpace | undefined;
  score: number;
};

export type SendCardDrawtoViewCB = (card: Card) => void;
export type SendCardPlaytoViewCB = (card: Card, boardSpace: BoardSpace) => void;
export type SendTokenPlayToViewCB = (boardSpace: BoardSpace) => void;

export type PlayerID = 'Player 1' | 'Player 2' | 'Computer';

export class Player {
  protected playerID: PlayerID;
  protected hand: Card[];
  protected deck: Decktet;
  protected gameBoard: GameBoard;
  protected influenceTokens: number;
  protected sendCardPlaytoView: SendCardPlaytoViewCB | undefined;
  protected sendCardDrawtoView: SendCardDrawtoViewCB | undefined;
  protected sendTokenPlayToView: SendTokenPlayToViewCB | undefined;

  constructor(playerID: PlayerID, gameBoard: GameBoard, deck: Decktet) {
    this.playerID = playerID;
    this.gameBoard = gameBoard;
    this.deck = deck;
    this.hand = [];
    this.influenceTokens = PLAYER_INFLUENCE_TOKENS;
  }

  playCard = (spaceID: string, cardID: string) => {
    const card = this.getCardFromHandByID(cardID);
    if (!card) return false;
    if (!this.gameBoard.setCard(spaceID, card)) {
      return false;
    } else {
      this.hand = this.hand.filter((ele) => ele !== card);
      return true;
    }
  };

  undoPlayCard = (spaceID: string) => {
    const space = this.gameBoard.getSpace(spaceID);
    if (space) {
      const card = space.getCard();
      if (card) {
        this.hand.push(card);
        this.gameBoard.removeCardAndResolveBoard(spaceID);
      }
    }
  };

  getAvailableTokenSpaces = () => {
    return this.gameBoard.getAvailableTokenSpaces(this.playerID);
  };

  placeToken = (spaceID: string) => {
    if (this.influenceTokens > 0) {
      this.influenceTokens--;
      return this.gameBoard.setPlayerToken(spaceID, this.playerID);
    }
    return false;
  };

  undoPlaceToken = (spaceID: string) => {
    this.influenceTokens++;
    return this.gameBoard.removePlayerTokenAndResolveBoard(spaceID);
  };

  getInfluenceTokensNo = () => {
    return this.influenceTokens;
  };

  getCardFromHandByID(cardID: string): Card | undefined {
    return this.hand.filter((card) => card.getId() === cardID)[0];
  }

  getHandArr() {
    return this.hand;
  }

  getHandSize() {
    return this.hand.length;
  }

  getScore = () => {
    return this.gameBoard.getPlayerScore(this.playerID);
  };

  bindSendCardPlayToView(sendCardPlaytoView: SendCardPlaytoViewCB) {
    this.sendCardPlaytoView = sendCardPlaytoView;
  }

  bindSendTokenPlayToView(sendTokenPlayToViewCB: SendTokenPlayToViewCB) {
    this.sendTokenPlayToView = sendTokenPlayToViewCB;
  }

  bindDrawCard(sendCardDrawtoView: SendCardDrawtoViewCB) {
    this.sendCardDrawtoView = sendCardDrawtoView;
  }
}

export class Player_MultiPlayer extends Player {
  socket: Socket;
  constructor(
    playerID: PlayerID,
    gameBoard: GameBoard,
    deck: Decktet,
    socket: Socket
  ) {
    super(playerID, gameBoard, deck);
    this.socket = socket;

    socket.on(
      'recieveCardDraw',
      (cardID: string | undefined, playerID: string) => {
        if (playerID !== this.playerID || !cardID) return;
        const card = this.deck.getCardByID(cardID);
        if (card) this.hand.push(card);
        if (!card || !this.sendCardDrawtoView) return;
        this.sendCardDrawtoView(card);
      }
    );

    socket.on(
      'recievePlayerMove',
      (playerID, cardID, spaceID, tokenSpaceID) => {
        if (playerID !== this.playerID) return;
        if (!this.sendCardPlaytoView) return;

        const card = this.getCardFromHandByID(cardID);
        const space = this.gameBoard.getSpace(spaceID);
        if (!card || !space) return;

        this.playCard(spaceID, cardID);
        this.sendCardPlaytoView(card, space);

        if (!tokenSpaceID || !this.sendTokenPlayToView) return;
        this.placeToken(tokenSpaceID);
        const tokenSpace = this.gameBoard.getSpace(tokenSpaceID);
        if (tokenSpace) this.sendTokenPlayToView(tokenSpace);
      }
    );
  }

  drawCard = () => {
    this.socket.emit('drawCard', this.playerID);
  };

  drawStartingHand() {
    for (let i = 0; i < PLAYER_HAND_SIZE; i++) {
      this.drawCard();
    }
  }
}

export class Player_SinglePlayer extends Player {
  constructor(playerID: PlayerID, gameBoard: GameBoard, deck: Decktet) {
    super(playerID, gameBoard, deck);
  }

  drawCard = () => {
    const newCard = this.deck.drawCard();
    if (newCard) {
      this.hand.push(newCard);
      if (this.playerID !== 'Computer') {
        if (this.sendCardDrawtoView) {
          this.sendCardDrawtoView(newCard);
        }
      }
    }
  };

  drawStartingHand() {
    for (let i = 0; i < PLAYER_HAND_SIZE; i++) {
      this.drawCard();
    }
  }
}

export class Player_ComputerPlayer extends Player_SinglePlayer {
  opponentID: PlayerID;
  getOpponentTokensNum: () => number;
  placeOpponentToken: (spaceID: string) => boolean;
  removeOpponentToken: (spaceID: string) => void;
  constructor(
    playerID: PlayerID,
    gameBoard: GameBoard,
    deck: Decktet,
    opponentID: PlayerID,
    getOpponentTokensNumCB: () => number,
    placeOpponentTokenCB: (spaceID: string) => boolean,
    removeOpponentTokenCB: (spaceID: string) => void
  ) {
    super(playerID, gameBoard, deck);
    this.opponentID = opponentID;
    this.getOpponentTokensNum = getOpponentTokensNumCB;
    this.placeOpponentToken = placeOpponentTokenCB;
    this.removeOpponentToken = removeOpponentTokenCB;
  }

  private generatePossibleCardsinFutureHands() {
    const allCardIDs = [] as string[];
    const deckLength = this.deck.getReferenceDeck().size;
    // create an array of all possible card ids.
    for (let idx = 0; idx < deckLength; idx++) {
      allCardIDs.push(String(idx));
    }

    const cardsInPlay = [] as string[];
    // get the ID of every card on the board
    this.gameBoard.getAllSpaces().forEach((space) => {
      const card = space.getCard();
      if (card) cardsInPlay.push(card.getId());
    });
    // get the id of the cards in the computers hand
    this.hand.forEach((card) => cardsInPlay.push(card.getId()));

    const availableCardIDS = allCardIDs.filter(
      (cardID) => !cardsInPlay.includes(cardID)
    );

    const availableCards = [] as Card[];

    availableCardIDS.forEach((cardID) => {
      const card = this.deck.getCardByID(cardID);
      if (card) availableCards.push(card);
    });

    return availableCards;
  }

  // helper fn to adjust requirements for placing an influence
  // token as the game progresses
  private adjustMinThreshold(hopedForAmt: number) {
    const spaceLeft = this.gameBoard.getRemainingSpacesNumber();
    const sizeOfTheBoard = Math.pow(this.gameBoard.getBoardSize(), 2);
    // hack add on: don't go less than 50% of our original requirement
    let settledForNumber = Math.ceil(
      hopedForAmt * Math.max(0.5, spaceLeft / sizeOfTheBoard)
    );
    // hack add on: don't start reducing threshold until middle half of the game
    if (spaceLeft / sizeOfTheBoard > 0.25) settledForNumber = hopedForAmt;

    return settledForNumber;
  }
  // Method to detect and avoid territories being stolen.
  // TODO: update the method to increase the score of the potential blocking moves
  // by the size of the at risk district and defer to the computerTakeTurn
  // method to actually place the card
  private blockTheft(
    cardMoves: AiMoveSearchResultsObj[],
    tokenMoves: AiMoveSearchResultsObj[]
  ) {
    const suitArr = [
      'Knots',
      'Leaves',
      'Moons',
      'Suns',
      'Waves',
      'Wyrms'
    ] as Suit[];
    for (const space of this.gameBoard.getAvailableSpaces()) {
      const adjSpaces = this.gameBoard.getAdjacentSpaces(space.getID());
      // for each suit, check if there are adjacent spaces controlled by
      // different opponents.
      for (const suit of suitArr) {
        const spacesWSuit = adjSpaces.filter((adjSpace) =>
          adjSpace.getControlledSuitsMap().get(suit)
        );
        const controllingSpaces = [] as BoardSpace[];
        const playerIDs = [] as PlayerID[];

        spacesWSuit.forEach((spaceWSuit) => {
          const controllingSpaceID = spaceWSuit.getControllingSpaceID(suit)!;
          const controllingSpace = this.gameBoard.getSpace(controllingSpaceID)!;
          controllingSpaces.push(controllingSpace);
          const controllingPlayer = controllingSpace.getPlayerToken()!;
          if (!playerIDs.includes(controllingPlayer))
            playerIDs.push(controllingPlayer);
        });
        // if we found 2 different player IDs, next move someone could
        // get their territory stolen. check whose card is higher.
        if (playerIDs.length > 1) {
          const highValueSpace = controllingSpaces.sort(
            (spaceA, spaceB) =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
              spaceB.getCard()?.getValue()! - spaceA.getCard()?.getValue()!
          )[0];
          if (highValueSpace?.getControllingSpaceID(suit) !== this.playerID) {
            console.log('found potential steal risk!');
            console.log(space.getID(), suit);

            const filterMovesCB = (move: AiMoveSearchResultsObj) => {
              if (
                move.spaceToPlaceCard === space &&
                !move.cardToPlay.getAllSuits().includes(suit)
              ) {
                return true;
              }
              return false;
            };

            const cardOnlyblockMoves = cardMoves.filter((move) =>
              filterMovesCB(move)
            );
            const tokenBlockMoves = tokenMoves.filter((move) =>
              filterMovesCB(move)
            );
            console.log('card block moves arr: ', cardOnlyblockMoves);
            console.log('tokenBlockMovesarr', tokenBlockMoves);
            const topCardOnlyMove = cardOnlyblockMoves[0];
            const topTokenMove = tokenBlockMoves[0];
            // if there is at least 1 item in the tokenmove list after filtering,
            // that's our choice.
            const finalChoice = topTokenMove ? topTokenMove : topCardOnlyMove;
            // play card

            // if no play that can defend from the theft was found, continue.
            if (!finalChoice) continue;

            this.playCard(
              finalChoice.spaceToPlaceCard.getID(),
              finalChoice.cardToPlay.getId()
            );
            if (this.sendCardPlaytoView) {
              this.sendCardPlaytoView(
                finalChoice.cardToPlay,
                finalChoice.spaceToPlaceCard
              );
            }
            // if token play information exists, play token
            if (finalChoice?.withTokenScore && finalChoice?.spaceToPlaceToken) {
              this.placeToken(finalChoice.spaceToPlaceToken.getID());
              if (this.sendTokenPlayToView) {
                this.sendTokenPlayToView(finalChoice.spaceToPlaceToken);
              }
            }
            this.drawCard();

            return true;
          }
        }
      }
    }
    return false;
  }

  private hasTheftRisk() {
    const suitArr = [
      'Knots',
      'Leaves',
      'Moons',
      'Suns',
      'Waves',
      'Wyrms'
    ] as Suit[];
    for (const space of this.gameBoard.getAvailableSpaces()) {
      const adjSpaces = this.gameBoard.getAdjacentSpaces(space.getID());
      // for each suit, check if there are adjacent spaces controlled by
      // different opponents.
      for (const suit of suitArr) {
        const spacesWSuit = adjSpaces.filter((adjSpace) =>
          adjSpace.getControlledSuitsMap().get(suit)
        );
        const controllingSpaces = [] as BoardSpace[];
        const playerIDs = [] as PlayerID[];

        spacesWSuit.forEach((spaceWSuit) => {
          const controllingSpaceID = spaceWSuit.getControllingSpaceID(suit)!;
          const controllingSpace = this.gameBoard.getSpace(controllingSpaceID)!;
          controllingSpaces.push(controllingSpace);
          const controllingPlayer = controllingSpace.getPlayerToken()!;
          if (!playerIDs.includes(controllingPlayer))
            playerIDs.push(controllingPlayer);
        });
        // if we found 2 different player IDs, next move someone could
        // get their territory stolen. check whose card is higher.
        if (playerIDs.length > 1) {
          const highValueSpace = controllingSpaces.sort(
            (spaceA, spaceB) =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
              spaceB.getCard()?.getValue()! - spaceA.getCard()?.getValue()!
          )[0];
          if (highValueSpace?.getControllingSpaceID(suit) !== this.playerID) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // helper fn to test wether a potential token placement meets minimum reqs
  private filterAndSortTokenScoreResults(
    topCardScore: number,
    tokenScoreArr: AiMoveSearchResultsObj[]
  ): AiMoveSearchResultsObj[] {
    const adjustedCardValueThreshold =
      this.adjustMinThreshold(CARD_VALUE_THRESHOLD);
    const adjustedScoreThreshold = this.adjustMinThreshold(
      SCORE_INCREASE_THRESHOLD
    );
    // check for withTokenScore to remove card-only results from the list.
    // Then remove results which don't raise the score by the minimum threshold
    // versus just playing a card
    tokenScoreArr = tokenScoreArr.filter(
      (ele) =>
        ele.withTokenScore !== undefined &&
        ele.withTokenScore! - topCardScore >= adjustedScoreThreshold
    );
    // sort the array first by score,
    // then by the value of the card the token will be placed on
    return tokenScoreArr.sort(
      (a, b) =>
        b.withTokenScore! - a.withTokenScore! ||
        b.tokenSpaceCardValue! - a.tokenSpaceCardValue!
    );
  }

  private getAllAvailableMoves(playerID: PlayerID, availableCards: Card[]) {
    // switch search between current player or opponent player
    const opponentID =
      playerID === this.playerID ? this.opponentID : this.playerID;

    const currentHumanScore = this.gameBoard.getPlayerScore(opponentID);
    const currentComputerScore = this.gameBoard.getPlayerScore(playerID);
    const resultsArr = [] as AiMoveSearchResultsObj[];
    const adjustedCardValueThreshold =
      this.adjustMinThreshold(CARD_VALUE_THRESHOLD);

    const handArr = this.getHandArr().sort((a, b) => {
      return a.getValue() - b.getValue();
    });
    //for each card in computers hand,
    handArr.forEach((card) => {
      this.gameBoard.getAvailableSpaces().forEach((availCardSpace) => {
        // see what the change in score will be for each open space on the board
        this.gameBoard.setCard(availCardSpace.getID(), card);
        const changeInHumanScore =
          this.gameBoard.getPlayerScore(opponentID) - currentHumanScore;
        const changeInComputerScore =
          this.gameBoard.getPlayerScore(playerID) - currentComputerScore;
        let cardOnlyScore = changeInComputerScore - changeInHumanScore;
        // if there is a theft risk, reduce the score of this move by a large number.
        // TODO: adjust the score by the num of cards in the at risk district instead
        if (this.hasTheftRisk()) cardOnlyScore -= 10;

        const cardOnlyScoreObj = {
          cardToPlay: card,
          spaceToPlaceCard: availCardSpace,
          cardOnlyScore: cardOnlyScore,
          spaceToPlaceToken: undefined,
          tokenSpaceCardValue: undefined,
          withTokenScore: undefined
        } as AiMoveSearchResultsObj;

        resultsArr.push(cardOnlyScoreObj);
        // then also check what the change in score will be when placing a token
        // in any space meeting the minimum card valuerequirements
        if (this.influenceTokens > 0) {
          this.gameBoard
            .getAvailableTokenSpaces(playerID)
            .forEach((availTokenSpace) => {
              const tokenSpaceCard = availTokenSpace.getCard();
              if (!tokenSpaceCard) return;
              // check whether the card value meets our minimum threshold
              const tokenSpaceCardValue = tokenSpaceCard.getValue();
              if (tokenSpaceCardValue >= adjustedCardValueThreshold) {
                //if it does, create a resultsObj and push to results.
                this.gameBoard.setPlayerToken(
                  availTokenSpace.getID(),
                  playerID
                );
                const tokenChangeInHumanScore =
                  this.gameBoard.getPlayerScore(opponentID) - currentHumanScore;
                const tokenChangeInComputerScore =
                  this.gameBoard.getPlayerScore(playerID) -
                  currentComputerScore;
                let withTokenScore =
                  tokenChangeInComputerScore - tokenChangeInHumanScore;

                if (this.hasTheftRisk()) withTokenScore -= 10;

                const withTokenScoreObj = {
                  cardToPlay: card,
                  spaceToPlaceCard: availCardSpace,
                  cardOnlyScore: cardOnlyScore,
                  spaceToPlaceToken: availTokenSpace,
                  tokenSpaceCardValue: tokenSpaceCardValue,
                  withTokenScore: withTokenScore
                } as AiMoveSearchResultsObj;

                resultsArr.push(withTokenScoreObj);
                // reset score after each token removal
                this.gameBoard.removePlayerTokenAndResolveBoard(
                  availTokenSpace.getID()
                );
              }
            });
        }
        // reset score after each card removal
        this.gameBoard.removeCardAndResolveBoard(availCardSpace.getID());
      });
    });
    return resultsArr;
  }
  // TODO: overhaul this method to use a weighted system taking into account
  // the current parameters and also
  // - considering growth potential of a district when placing a token
  // - blocking an opponent when no better move is available

  computerTakeTurn = () => {
    const allMoves = this.getAllAvailableMoves(this.playerID, this.hand);
    // remove token moves, then sort by score, if same score then randomize
    // (otherwise the computer will fill spaces in the board from top
    // left to bottom right sequentially)
    const cardOnlyMovesSorted = allMoves
      .filter((ele) => !ele.spaceToPlaceToken)
      .sort((a, b) => {
        const random = Math.random() > 0.5 ? 1 : -1;
        return b.cardOnlyScore - a.cardOnlyScore || random;
      });
    const topCardOnlyMove = cardOnlyMovesSorted[0];
    const topCardOnlyScore = topCardOnlyMove.cardOnlyScore;
    const tokenMoveArr = this.filterAndSortTokenScoreResults(
      topCardOnlyScore,
      allMoves
    );
    const topTokenMove = tokenMoveArr[0];
    // call the blocktheft fn to check for potential theft and place a move to block it.
    if (this.blockTheft(cardOnlyMovesSorted, tokenMoveArr)) return;

    // if there is at least 1 item in the tokenmove list after filtering,
    // that's our choice.
    const finalChoice = topTokenMove ? topTokenMove : topCardOnlyMove;
    // play card
    this.playCard(
      finalChoice.spaceToPlaceCard.getID(),
      finalChoice.cardToPlay.getId()
    );
    if (this.sendCardPlaytoView) {
      this.sendCardPlaytoView(
        finalChoice.cardToPlay,
        finalChoice.spaceToPlaceCard
      );
    }
    // if token play information exists, play token
    if (finalChoice?.withTokenScore && finalChoice?.spaceToPlaceToken) {
      this.placeToken(finalChoice.spaceToPlaceToken.getID());
      if (this.sendTokenPlayToView) {
        this.sendTokenPlayToView(finalChoice.spaceToPlaceToken);
      }
    }
    this.drawCard();
  };

  // an experiment to implement minimax which predictably didn't work well
  // given the nature of this game. It was interesting though!
  computerTakeTurnMinimax = () => {
    const MAXSEARCHDEPTH = 2;

    const getAvailableMovesMinimax = (cards: Card[], playerID: PlayerID) => {
      const results = [] as MiniMaxSearchObj[];
      const availableSpaces = this.gameBoard.getAvailableSpaces();

      availableSpaces.forEach((space) => {
        cards.forEach((card) => {
          const cardOnly = {
            cardToPlay: card,
            spaceToPlaceCard: space,
            spaceToPlaceToken: undefined,
            score: 0
          };
          results.push(cardOnly);
        });
      });

      return results;
    };

    const minimax = (maximizing = true, depth = 0) => {
      const cardonlyMovesArr = [] as MiniMaxSearchObj[];
      const tokenmovesArr = [] as MiniMaxSearchObj[];

      const boardSpacesRemaining = this.gameBoard.getRemainingSpacesNumber();

      if (boardSpacesRemaining === 0 || depth === MAXSEARCHDEPTH) {
        const computerScore = this.gameBoard.getPlayerScore(this.playerID);
        const opponentScore = this.gameBoard.getPlayerScore(this.opponentID);

        if (boardSpacesRemaining === 0) {
          if (computerScore > opponentScore) return { score: 100 - depth };
          else if (opponentScore > computerScore)
            return { score: -100 + depth };
          else return { score: computerScore - opponentScore };
        }
        return { score: computerScore - opponentScore };
      }

      let bestMove;

      if (maximizing) {
        let availableMoves = [] as MiniMaxSearchObj[];
        // if first move, use cards in hand. Otherwise use all potential cards
        if (depth === 0) {
          availableMoves = getAvailableMovesMinimax(this.hand, this.playerID);
        } else {
          availableMoves = getAvailableMovesMinimax(
            this.generatePossibleCardsinFutureHands(),
            this.playerID
          );
        }
        // try each move
        availableMoves.forEach((move) => {
          this.gameBoard.setCard(
            move.spaceToPlaceCard.getID(),
            move.cardToPlay
          );
          // if computer still has influence tokens, test each placement choice
          // that meets minimum requirements
          if (this.influenceTokens > 0) {
            const tokenSpaces = this.gameBoard.getAvailableTokenSpaces(
              this.playerID
            );

            tokenSpaces.forEach((tokenSpace) => {
              const tokenSpaceCard = tokenSpace.getCard();
              if (tokenSpaceCard && tokenSpaceCard.getValue() > 6) {
                this.placeToken(tokenSpace.getID());

                const tokenMove = {
                  cardToPlay: move.cardToPlay,
                  spaceToPlaceCard: move.spaceToPlaceCard,
                  spaceToPlaceToken: tokenSpace,
                  score: 0
                };

                const result = minimax(false, depth + 1);
                if (result && result.score) tokenMove.score = result.score;

                tokenmovesArr.push(tokenMove);

                this.undoPlaceToken(tokenMove.spaceToPlaceToken.getID());
              }
            });
          }

          const result = minimax(false, depth + 1);
          if (result && result.score) move.score = result.score;

          cardonlyMovesArr.push(move);
          // undo move

          this.gameBoard.removeCardAndResolveBoard(
            move.spaceToPlaceCard.getID()
          );
        });

        const bestCardOnlyMove = cardonlyMovesArr.sort(
          (moveA, moveB) => moveB.score - moveA.score
        )[0];
        const bestTokenMove = tokenmovesArr.sort(
          (moveA, moveB) => moveB.score - moveA.score
        )[0];
        // only choose token move if it scores at least 2 more points than card only move
        if (bestTokenMove) {
          bestMove =
            bestTokenMove.score - bestCardOnlyMove.score > 1
              ? bestTokenMove
              : bestCardOnlyMove;
        } else {
          bestMove = bestCardOnlyMove;
        }
      }
      if (!maximizing) {
        let availableMoves = [] as MiniMaxSearchObj[];
        availableMoves = getAvailableMovesMinimax(
          this.generatePossibleCardsinFutureHands(),
          this.opponentID
        );

        availableMoves.forEach((move) => {
          this.gameBoard.setCard(
            move.spaceToPlaceCard.getID(),
            move.cardToPlay
          );

          if (this.getOpponentTokensNum() > 0) {
            const tokenSpaces = this.gameBoard.getAvailableTokenSpaces(
              this.opponentID
            );

            tokenSpaces.forEach((tokenSpace) => {
              const tokenSpaceCard = tokenSpace.getCard();
              if (tokenSpaceCard && tokenSpaceCard.getValue() > 6) {
                this.placeOpponentToken(tokenSpace.getID());

                const tokenMove = {
                  cardToPlay: move.cardToPlay,
                  spaceToPlaceCard: move.spaceToPlaceCard,
                  spaceToPlaceToken: tokenSpace,
                  score: 0
                };

                const result = minimax(true, depth + 1);
                if (result && result.score) tokenMove.score = result.score;

                tokenmovesArr.push(tokenMove);

                this.removeOpponentToken(tokenMove.spaceToPlaceToken.getID());
              }
            });
          }

          const result = minimax(false, depth + 1);
          if (result && result.score) move.score = result.score;

          cardonlyMovesArr.push(move);
          // undo move

          this.gameBoard.removeCardAndResolveBoard(
            move.spaceToPlaceCard.getID()
          );
        });
        const bestCardOnlyMove = cardonlyMovesArr.sort(
          (moveA, moveB) => moveB.score - moveA.score
        )[0];
        const bestTokenMove = tokenmovesArr.sort(
          (moveA, moveB) => moveB.score - moveA.score
        )[0];
        // only choose token move if it scores at least 2 more points than card only move
        if (bestTokenMove) {
          bestMove =
            bestTokenMove.score - bestCardOnlyMove.score > 1
              ? bestTokenMove
              : bestCardOnlyMove;
        } else {
          bestMove = bestCardOnlyMove;
        }
      }
      return bestMove;
    };
    const topMove = minimax() as MiniMaxSearchObj;
    console.log('minimax finished', topMove);
    this.playCard(topMove.spaceToPlaceCard.getID(), topMove.cardToPlay.getId());
    if (this.sendCardPlaytoView)
      this.sendCardPlaytoView(topMove.cardToPlay, topMove.spaceToPlaceCard);
    if (topMove.spaceToPlaceToken) {
      this.placeToken(topMove.spaceToPlaceToken.getID());
      if (this.sendTokenPlayToView)
        this.sendTokenPlayToView(topMove.spaceToPlaceToken);
    }
    this.drawCard();
  };
}
