/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { Socket } from 'socket.io-client';

import { Suit, Card, Decktet } from './decktet.js';
import { BoardSpace, GameBoard } from './gameboard.js';

// game variables that never change
const PLAYER_INFLUENCE_TOKENS = 4;
const PLAYER_HAND_SIZE = 3;
// initial minimum values used in AI move selection
const CARD_VALUE_THRESHOLD = 3;
const SCORE_INCREASE_THRESHOLD = 4.5;
// values used in scoring more ambigious moves
const ADJ_SPACE_SAME_SUIT = 0.25;
const LONG_SHOT_THEFT = 0.5;
const SAME_SUIT_IN_HAND = 0.5;
const GROWTH_POTENTIAL = 0.2;

type AiMoveSearchResultsObj = {
  cardToPlay: Card;
  spaceToPlaceCard: BoardSpace;
  score: number;
  spaceToPlaceToken: BoardSpace | undefined;
  tokenSpaceCardValue: number | undefined;
  log: string;
};

export type SendCardDrawtoViewCB = (card: Card) => void;
export type SendCardPlaytoViewCB = (card: Card, boardSpace: BoardSpace) => void;
export type SendTokenPlayToViewCB = (
  boardSpace: BoardSpace,
  playerID: PlayerID
) => void;

export type PlayerID = 'Player 1' | 'Player 2' | 'Computer';

export class Player {
  public playerID: PlayerID;
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
    // place the card on the board
    if (!this.gameBoard.setCard(spaceID, card)) {
      return false;
    } else {
      // add card play info to localStorage
      const movesJSON = localStorage.getItem('movesArr');
      const movesArr = movesJSON ? JSON.parse(movesJSON) : [];
      movesArr.push({
        player: this.playerID,
        cardToPlay: cardID,
        spaceToPlaceCard: spaceID
      });
      localStorage.setItem('movesArr', JSON.stringify(movesArr));
      // remove card from hand
      this.hand = this.hand.filter((ele) => ele !== card);
      // remove card from hand backup in local storage
      const handJSON = localStorage.getItem(`${this.playerID}-hand`);
      let handArr = handJSON ? JSON.parse(handJSON) : [];
      handArr = handArr.filter((ele: string) => ele !== card.getId());
      localStorage.setItem(`${this.playerID}-hand`, JSON.stringify(handArr));
      return true;
    }
  };

  undoPlayCard = (spaceID: string) => {
    const space = this.gameBoard.getSpace(spaceID);
    if (space) {
      const card = space.getCard();
      if (card) {
        // return card to hand
        this.hand.push(card);
        // return card to local storage backup
        const handJSON = localStorage.getItem(`${this.playerID}-hand`);
        if (handJSON) {
          const handArr = JSON.parse(handJSON);
          handArr.push(card.getId());
          localStorage.setItem(
            `${this.playerID}-hand`,
            JSON.stringify(handArr)
          );
        }
        // remove card from board
        this.gameBoard.removeCardAndResolveBoard(spaceID);
        // remove card play from localStorage
        const movesArr = JSON.parse(localStorage.getItem('movesArr') as string);
        movesArr.pop();
        localStorage.setItem('movesArr', JSON.stringify(movesArr));
      }
    }
  };

  getAvailableTokenSpaces = () => {
    return this.gameBoard.getAvailableTokenSpaces(this.playerID);
  };

  placeToken = (spaceID: string) => {
    if (this.influenceTokens > 0) {
      // remove 1 token from user total
      this.influenceTokens--;
      // place token
      this.gameBoard.setPlayerToken(spaceID, this.playerID);
      // record token play info in local storage
      this.recordTokenPlay(spaceID);
    }
    return true;
  };

  // identical to placeToken method except it does not add
  // a move entry to local storage
  restoreTokenPlay = (spaceID: string) => {
    if (this.influenceTokens > 0) {
      // remove 1 token from user total
      this.influenceTokens--;
      // place token
      this.gameBoard.setPlayerToken(spaceID, this.playerID);
      // record token play info in local storage
    }
  };

  private recordTokenPlay = (spaceID: string) => {
    const movesArr = JSON.parse(localStorage.getItem('movesArr') as string);
    movesArr.push({
      playerID: this.playerID,
      spaceToPlaceToken: spaceID
    });
    localStorage.setItem('movesArr', JSON.stringify(movesArr));
  };

  public undoPlaceToken = (spaceID: string) => {
    // restore user token
    this.influenceTokens++;
    // remove token from board
    this.gameBoard.removePlayerTokenAndResolveBoard(spaceID);
    // remove token play from local storage
    this.recordUndoTokenPlay(spaceID);
  };

  protected recordUndoTokenPlay = (spaceID: string) => {
    const movesArr = JSON.parse(localStorage.getItem('movesArr') as string);
    movesArr.pop();
    localStorage.setItem('movesArr', JSON.stringify(movesArr));
  };

  public getInfluenceTokensNo = () => {
    return this.influenceTokens;
  };

  getCardFromHandByID = (cardID: string) => {
    return this.hand.filter((card) => card.getId() === cardID)[0];
  };

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
        if (tokenSpace) this.sendTokenPlayToView(tokenSpace, this.playerID);
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
    // get card from deck
    const newCard = this.deck.drawCard();
    if (newCard) {
      // add new card to hand
      this.hand.push(newCard);
      // save info to local storage
      this.saveCardDrawToStorage(newCard);
      // send card to view
      if (this.sendCardDrawtoView) {
        this.sendCardDrawtoView(newCard);
      }
    }
  };

  private saveCardDrawToStorage(card: Card) {
    // save hand info to local storage
    const handJSON = localStorage.getItem(`${this.playerID}-hand`);
    const handArr = handJSON ? JSON.parse(handJSON) : [];
    handArr.push(card.getId());
    localStorage.setItem(`${this.playerID}-hand`, JSON.stringify(handArr));
    // add card to list of already played cards in local storage
    const playedCardsJSON = localStorage.getItem('playedCards');
    const playedCardsArr = playedCardsJSON ? JSON.parse(playedCardsJSON) : [];
    playedCardsArr.push(card.getId());
    localStorage.setItem('playedCards', JSON.stringify(playedCardsArr));
  }

  drawStartingHand() {
    for (let i = 0; i < PLAYER_HAND_SIZE; i++) {
      this.drawCard();
    }
  }

  restoreHand() {
    // restore hand from local storage
    const handJSON = localStorage.getItem(`${this.playerID}-hand`);
    if (handJSON) {
      const handArr = JSON.parse(handJSON);
      handArr.forEach((cardID: string) => {
        const card = this.deck.getCardByID(cardID) as Card;
        this.hand.push(card);
        if (this.playerID !== 'Computer') {
          if (this.sendCardDrawtoView) {
            this.sendCardDrawtoView(card);
          }
        }
      });
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

  computerTakeTurn = () => {
    const allMoves = this.getAllAvailableMoves(this.playerID, this.hand);

    this.blockTheft(false, allMoves);
    this.blockDiagTheft(false, allMoves);

    // remove token moves, then sort by score, if same score then randomize
    // (otherwise the computer will fill spaces in the board from top
    // left to bottom right sequentially)
    const cardOnlyMovesSorted = allMoves
      .filter((ele) => !ele.spaceToPlaceToken)
      .sort((a, b) => {
        const random = Math.random() > 0.5 ? 1 : -1;
        return b.score - a.score || random;
      });
    const topCardOnlyMove = cardOnlyMovesSorted[0];
    const topCardOnlyScore = topCardOnlyMove.score;
    const tokenMoveArr = this.filterAndSortTokenScoreResults(
      topCardOnlyScore,
      allMoves
    );
    console.log('cardOnlyMovesSorted', cardOnlyMovesSorted);
    console.log('tokenMovesArr', tokenMoveArr);
    const topTokenMove = tokenMoveArr[0];
    // call the blocktheft fn to check for potential theft and place a move to block it.

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
    if (finalChoice?.spaceToPlaceToken) {
      this.placeToken(finalChoice.spaceToPlaceToken.getID());
      if (this.sendTokenPlayToView) {
        this.sendTokenPlayToView(finalChoice.spaceToPlaceToken, this.playerID);
      }
    }
    this.drawCard();
  };

  // helper fn to adjust requirements for placing an influence
  // token as the game progresses
  private adjustMinThreshold(hopedForAmt: number) {
    const spaceLeft = this.gameBoard.getRemainingSpacesNumber();
    const sizeOfTheBoard = Math.pow(this.gameBoard.getBoardSize(), 2);
    // hack add on: don't go less than 50% of our original requirement
    const settledForNumber = Math.ceil(
      (hopedForAmt * spaceLeft) / sizeOfTheBoard
    );
    // Once there is 1/4 of the game left, reduce the threshold by half.
    // Then near the end of the game reduce to scale.
    if (spaceLeft / sizeOfTheBoard < 0.15) return settledForNumber;
    if (spaceLeft / sizeOfTheBoard < 0.25) return hopedForAmt * 0.5;

    return hopedForAmt;
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
        // if there is a theft risk, reduce the score of this move
        // by the number of cards in the at risk district.
        cardOnlyScore -= this.blockTheft(true);
        cardOnlyScore -= this.blockDiagTheft(true);

        const cardOnlyScoreObj = {
          cardToPlay: card,
          spaceToPlaceCard: availCardSpace,
          score: cardOnlyScore,
          spaceToPlaceToken: undefined,
          tokenSpaceCardValue: undefined,
          log: ''
        } as AiMoveSearchResultsObj;

        this.scoreintermediateMoves(cardOnlyScoreObj);

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
                const withTokenScore =
                  tokenChangeInComputerScore - tokenChangeInHumanScore;

                const withTokenScoreObj = {
                  cardToPlay: card,
                  spaceToPlaceCard: availCardSpace,
                  score: withTokenScore,
                  spaceToPlaceToken: availTokenSpace,
                  tokenSpaceCardValue: tokenSpaceCardValue,
                  log: ''
                } as AiMoveSearchResultsObj;

                const blockTheftAdjustment = this.blockTheft(true);
                withTokenScoreObj.score -= blockTheftAdjustment;
                withTokenScoreObj.log =
                  blockTheftAdjustment > 0
                    ? (withTokenScoreObj.log += `blocktheft -${blockTheftAdjustment} `)
                    : withTokenScoreObj.log;

                const blockDiagTheft = this.blockDiagTheft(true);
                withTokenScoreObj.score -= blockDiagTheft;
                withTokenScoreObj.log =
                  blockDiagTheft > 0
                    ? (withTokenScoreObj.log += `blockdiagtheft -${blockDiagTheft} `)
                    : withTokenScoreObj.log;

                const growth =
                  this.getDistrictsGrowthPotential(availTokenSpace);
                withTokenScoreObj.score += growth;
                withTokenScoreObj.log =
                  growth > 0
                    ? (withTokenScoreObj.log += `growth potential +${growth} `)
                    : withTokenScoreObj.log;

                this.extraPtforCardinHand(withTokenScoreObj);
                this.scoreintermediateMoves(withTokenScoreObj);
                this.searchForTheftOpportunity(withTokenScoreObj);

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

  // check if there is open space around a card when placing a token
  private getDistrictsGrowthPotential(boardSpace: BoardSpace) {
    const controlledSpaces = [] as BoardSpace[];
    const adjacentSpaces = [] as BoardSpace[];
    //get an array of all the board spaces controlled by this token
    for (const [, space] of this.gameBoard.getAllSpaces()) {
      for (const [, spaceID] of space.getControlledSuitsMap()) {
        if (
          spaceID === boardSpace.getID() &&
          !controlledSpaces.includes(space)
        ) {
          controlledSpaces.push(space);
        }
      }
    }
    // get an array of all spaces which are adjacent to one of the controlled spaces
    for (const space of controlledSpaces) {
      const adjSpaces = this.gameBoard.getAdjacentSpaces(space.getID());
      adjSpaces.forEach((adjSpace) => {
        if (!adjacentSpaces.includes(adjSpace)) {
          adjacentSpaces.push(adjSpace);
        }
      });
    }
    // filter for spaces that are available
    const availableAdjSpaces = adjacentSpaces.filter((space) =>
      this.gameBoard.getAvailableSpaces().includes(space)
    );
    return availableAdjSpaces.length * GROWTH_POTENTIAL;
  }

  // Method to detect and avoid territories being stolen.
  // Boolean checkforSelfKill determines wether the method adjusts the values of
  // an array of potential moves (raising the score of moves that avoid theft),
  //  or wether it returns the size of the largest found at risk district.
  // The former is used to avoid a district being stolen
  // by the enemies initiative. The latter is used to avoid making a move that
  // will provide an enemy a perfect opportunity to steal.

  private blockTheft(
    checkforSelfKill: boolean,
    movesArr: AiMoveSearchResultsObj[] = []
  ) {
    const suitArr = [
      'Knots',
      'Leaves',
      'Moons',
      'Suns',
      'Waves',
      'Wyrms'
    ] as Suit[];
    let largestAtRiskDistrictSize = 0;
    for (const space of this.gameBoard.getAvailableSpaces()) {
      const adjSpaces = this.gameBoard.getAdjacentSpaces(space.getID());
      // for each suit, check if there are adjacent spaces controlled by
      // an opponent.
      for (const suit of suitArr) {
        const spacesWSuit = adjSpaces.filter((adjSpace) =>
          adjSpace.getControlledSuitsMap().get(suit)
        );
        const controllingSpaces = [] as BoardSpace[];
        const playerIDs = [] as PlayerID[];

        let atRiskTokenSpaceID;

        spacesWSuit.forEach((spaceWSuit) => {
          const controllingSpaceID = spaceWSuit.getControllingSpaceID(suit)!;
          const controllingSpace = this.gameBoard.getSpace(controllingSpaceID)!;
          controllingSpaces.push(controllingSpace);
          const controllingPlayer = controllingSpace.getPlayerToken()!;
          if (!playerIDs.includes(controllingPlayer)) {
            playerIDs.push(controllingPlayer);
          }

          if (controllingPlayer === 'Computer') {
            atRiskTokenSpaceID = controllingSpaceID;
          }
        });
        // if we found 2 different player IDs, next move someone could
        // get their territory stolen. check whose card is higher.
        if (playerIDs.length > 1) {
          const sortedSpaces = controllingSpaces.sort(
            (spaceA, spaceB) =>
              spaceB.getCard()!.getValue()! - spaceA.getCard()!.getValue()!
          );
          const highValueSpace = sortedSpaces[0];

          if (highValueSpace?.getPlayerToken() !== this.playerID) {
            // if theft risk found, increase the score of any moves which will
            // block the theft by the size of the district that would be lost.
            if (!atRiskTokenSpaceID) return 0;

            const atRiskDistrictSize = this.gameBoard.getDistrict(
              atRiskTokenSpaceID,
              suit
            ).length;

            largestAtRiskDistrictSize = Math.max(
              largestAtRiskDistrictSize,
              atRiskDistrictSize
            );

            if (!checkforSelfKill) {
              const blockingMoves = movesArr.filter((move) => {
                if (
                  move.spaceToPlaceCard === space &&
                  !move.cardToPlay.getAllSuits().includes(suit)
                ) {
                  return true;
                }
                return false;
              });
              console.log('blockingMoves', blockingMoves);
              blockingMoves.forEach((move) => {
                move.score += atRiskDistrictSize;
                move.log += `atRiskDistrict + ${atRiskDistrictSize} `;
              });
            }
          }
        }
      }
    }
    return largestAtRiskDistrictSize;
  }

  // search for diagonal theft risks
  private blockDiagTheft(
    checkForSelfKill: boolean,
    movesArr: AiMoveSearchResultsObj[] = []
  ) {
    // create an array unplayedCards
    const referenceDeck = Array.from(this.deck.getReferenceDeck().values());
    const playedCards = this.gameBoard
      .getAllPlayedCards()
      .concat(this.hand)
      .map((card) => card.getId());
    const unplayedCards = referenceDeck.filter(
      (card) => !playedCards.includes(card.getId())
    );

    // get an array of all spaces on the board that are controlled by
    // the computer in any suit.
    const computerOwnedSpaces = Array.from(
      this.gameBoard.getAllSpaces().values()
    ).filter((space) => {
      const card = space.getCard();
      if (!card) return false;
      const suits = card.getAllSuits();
      for (const suit of suits) {
        const controlSpaceID = this.gameBoard.getControllingSpace(
          space.getID(),
          suit
        );
        if (!controlSpaceID) continue;
        const controllingPlayer = this.gameBoard
          .getSpace(controlSpaceID)!
          .getPlayerToken();
        if (controllingPlayer === this.playerID) return true;
      }
    });

    // track the largest at risk district.
    let atRiskDistrictSize = 0;

    // for each space, check if it's at risk of diagonal theft
    for (const space of computerOwnedSpaces) {
      const spaceID = space.getID();
      const card = space.getCard()!;
      const adjSpaces = this.gameBoard.getAdjacentSpaces(spaceID);
      const diagSpaces = this.gameBoard.getDiagonalSpaces(spaceID);

      for (const diagSpace of diagSpaces) {
        // if a diagonal space is unplayable ignore it
        if (!this.gameBoard.isPlayableSpace(diagSpace.getID())) continue;
        // check whether the diagspace shares 2 open adj spaces
        // with our potential move space.
        const commonadjSpaces = adjSpaces.filter((adjSpace) => {
          return (
            this.gameBoard.isPlayableSpace(adjSpace.getID()) &&
            this.gameBoard
              .getAdjacentSpaces(diagSpace.getID())
              .includes(adjSpace)
          );
        });
        // if there are less than 2 common adj available spaces, not a risk.
        if (commonadjSpaces.length < 2) continue;

        // at this point we have found a diagSpace which is potentially a theft risk.

        for (const suit of card.getAllSuits()) {
          const controlSpaceID = space.getControllingSpaceID(suit);
          // if this suit is not controlled by the computer, continue
          if (
            !controlSpaceID ||
            this.gameBoard.getSpace(controlSpaceID)!.getPlayerToken() !==
              this.playerID
          )
            continue;

          const district = this.gameBoard.getDistrict(spaceID, suit);

          const controlCardValue = this.gameBoard
            .getCard(controlSpaceID)
            ?.getValue()!;
          // if an unplayed card exists whith a higher value than our control card,
          // and there are at least 2 unplayed cards in that suit remaining,
          // the district is at risk of diagonal theft. update the atRiskDistrictSize
          // if this district is the largest yet seen.
          if (
            unplayedCards.some((card) => card.getValue() > controlCardValue) &&
            unplayedCards.filter((card) => card.getAllSuits().includes(suit))
              .length >= 2
          ) {
            atRiskDistrictSize = Math.max(atRiskDistrictSize, district.length);
          }
          if (!checkForSelfKill) {
            for (const move of movesArr) {
              if (adjSpaces.includes(move.spaceToPlaceCard)) {
                move.score += district.length;
                move.log += `block diag + ${district.length} `;
              }
            }
          }
        }
      }
    }
    return atRiskDistrictSize;
  }

  searchForTheftOpportunity(tokenMove: AiMoveSearchResultsObj) {
    const tokenSpaceSuits =
      tokenMove.spaceToPlaceToken?.getControlledSuitsMap();
    if (!tokenSpaceSuits) return;
    // get diagonal spaces
    const diagSpaces = this.gameBoard.getDiagonalSpaces(
      tokenMove.spaceToPlaceToken!.getID()
    );

    const adjacentSpaces = this.gameBoard.getAdjacentSpaces(
      tokenMove.spaceToPlaceToken!.getID()
    );
    // for each diagonal space
    for (const diagSpace of diagSpaces) {
      if (!diagSpace.getCard()) continue;
      // get the adjacent spaces that it has in common with the
      // space we are considering placing a token on, and make sure they are
      // playable
      const commonAdjSpaces = this.gameBoard
        .getAdjacentSpaces(diagSpace.getID())
        .filter(
          (adjSpace) =>
            adjacentSpaces.includes(adjSpace) &&
            this.gameBoard.isPlayableSpace(adjSpace.getID())
        );
      // there should be exactly two playable spaces in between.
      if (commonAdjSpaces.length !== 2) continue;

      const suits = diagSpace.getControlledSuitsMap();

      for (const [suit, ctrlspce] of suits) {
        if (!tokenSpaceSuits.get(suit)) continue;
        // we have found a card with the same suit as our token card

        const controlSpaceID = diagSpace.getControllingSpaceID(suit)!;
        const controlSpace = this.gameBoard.getSpace(controlSpaceID)!;
        if (controlSpace.getPlayerToken() === this.playerID) return;
        // it's controlled by an enemy
        const enemyCardValue = controlSpace.getCard()!.getValue();

        if (
          // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
          enemyCardValue > tokenMove.spaceToPlaceToken?.getCard()?.getValue()!
        )
          return;
        // our card is of a higher value.

        const cardsinHandWSameSuit = this.hand.filter(
          (card) =>
            card.getAllSuits().includes(suit) && tokenMove.cardToPlay !== card
        );
        if (cardsinHandWSameSuit.length < 1) return;
        // and we have another card with the same suit in our hand with which to make the connection.

        // We now know we have found an enemy territory which we can steal!
        // Get the size of the territory.

        const enemyDistrictSize = this.gameBoard.getDistrict(
          diagSpace.getID(),
          suit
        ).length;

        console.log('found diagonal theft opportunity!');
        console.log('space to attack:', diagSpace);
        console.log('attacking space', tokenMove.spaceToPlaceToken);
        console.log('suit: ', suit);
        console.log('cards in hand:', this.hand);
        tokenMove.score += 2 * enemyDistrictSize;
        tokenMove.log += `diagTheft + ${2 * enemyDistrictSize} `;
      }
    }
  }
  // add scoring to less obvious moves;
  // don't put good cards near opponent or next to uncontrolled cards of the same suit.
  // do put good cards near us.
  private scoreintermediateMoves(move: AiMoveSearchResultsObj) {
    // if we control the current card, nothing to do here.

    const cardSuits = move.cardToPlay.getAllSuits();
    const moveCombinedDistrict = [] as BoardSpace[];
    // get an array of all the spaces that are adjacent or one away
    // that are already a part of our district. we don't need to do anything
    // with those and can skip them in coming steps.
    for (const suit of cardSuits) {
      const district = this.gameBoard.getDistrict(
        move.spaceToPlaceCard.getID(),
        suit
      );
      district.forEach((space) => {
        if (!moveCombinedDistrict.includes(space))
          moveCombinedDistrict.push(space);
      });
    }
    // get an array of adjacent spaces
    const adjSpaces = this.gameBoard.getAdjacentSpaces(
      move.spaceToPlaceCard.getID()
    );
    // create oneaway array for later use.
    // if the adjacent space is playable, add *it's* adjacent spaces
    // to the list of spaces that are 1 space away
    const oneSpaceAwayArr = [] as BoardSpace[];
    for (const adjSpace of adjSpaces) {
      if (this.gameBoard.isPlayableSpace(adjSpace.getID())) {
        const oneaway = this.gameBoard.getAdjacentSpaces(adjSpace.getID());
        for (const oneawaySpace of oneaway) {
          if (
            oneawaySpace !== move.spaceToPlaceCard &&
            !oneSpaceAwayArr.includes(oneawaySpace) &&
            !moveCombinedDistrict.includes(oneawaySpace)
          )
            oneSpaceAwayArr.push(oneawaySpace);
        }
      }
      if (oneSpaceAwayArr.includes(adjSpace)) continue;
      // if we find an adjacent card that is the same suit that's not controlled by us,
      // reduce the value of this move.
      const card = adjSpace.getCard();
      if (!card) continue;
      const adjSuits = card.getAllSuits();
      for (const suit of adjSuits) {
        if (cardSuits.includes(suit)) {
          const adjcontrolSpaceID = adjSpace.getControllingSpaceID(suit);
          const adjControlSpace = adjcontrolSpaceID
            ? this.gameBoard.getSpace(adjcontrolSpaceID)
            : undefined;
          const adjControlPlayerID = adjControlSpace
            ? adjControlSpace.getPlayerToken()
            : undefined;

          if (adjControlPlayerID === 'Computer') continue;

          move.score -= ADJ_SPACE_SAME_SUIT;
          move.log += `adj space enemy same suit - ${ADJ_SPACE_SAME_SUIT}`;
        }
      }

      // next, check for territories or cards that are 1 space away.
      for (const oneAwaySpace of oneSpaceAwayArr) {
        const card = oneAwaySpace.getCard();
        if (!card) continue;
        const suits = card.getAllSuits();
        for (const suit of suits) {
          if (cardSuits.includes(suit)) {
            const oneawcontrolSpaceID =
              oneAwaySpace.getControllingSpaceID(suit);
            const oneawControlSpace = oneawcontrolSpaceID
              ? this.gameBoard.getSpace(oneawcontrolSpaceID)
              : undefined;
            const oneawControlPlayerID = oneawControlSpace
              ? oneawControlSpace.getPlayerToken()
              : undefined;

            if (oneawControlPlayerID === 'Computer') {
              move.score += ADJ_SPACE_SAME_SUIT;
              move.log += `adj space computer + ${ADJ_SPACE_SAME_SUIT} `;
            } else if (oneawControlPlayerID === 'Player 1') {
              const moveControlSpaceID =
                move.spaceToPlaceCard.getControllingSpaceID(suit);
              const moveControlSpace = moveControlSpaceID
                ? this.gameBoard.getSpace(moveControlSpaceID)
                : undefined;
              const moveControlPlayer = moveControlSpace
                ? moveControlSpace.getPlayerToken()
                : undefined;
              const moveControlCard = moveControlSpace
                ? moveControlSpace.getCard()!
                : undefined;

              if (
                moveControlPlayer === 'Computer' &&
                moveControlCard &&
                moveControlCard.getRank() > card.getRank()
              ) {
                // console.log('found a longshot theft opportunity');
                move.score += LONG_SHOT_THEFT;
                move.log += `long shot theft + ${LONG_SHOT_THEFT}`;
                // console.log('movespace', move.spaceToPlaceCard);
                // console.log('cardToPlay', move.cardToPlay);
                // console.log('oneawaySpace', oneAwaySpace);
              }

              // console.log('helps opp, decrease score');
              move.score -= ADJ_SPACE_SAME_SUIT;
              move.log += `oneawayspace same suit -${ADJ_SPACE_SAME_SUIT} `;
            }
          }
        }
      }
    }
  }

  private extraPtforCardinHand(move: AiMoveSearchResultsObj) {
    const tokenSpace = move.spaceToPlaceToken!;
    const card = tokenSpace.getCard();
    if (!card) throw new Error('no card on token space');
    let suits = card.getAllSuits();
    suits = suits.filter(
      (suit) => tokenSpace.getControllingSpaceID(suit) === tokenSpace.getID()
    );
    let points = 0;
    const filteredHand = this.hand.filter(
      (hcard) => hcard.getId() !== move.cardToPlay.getId()
    );
    for (const hCard of filteredHand) {
      const hSuits = hCard.getAllSuits();
      for (const hSuit of hSuits) {
        if (suits.includes(hSuit)) {
          points += SAME_SUIT_IN_HAND;
        }
      }
    }
    move.score += points;
    move.log += `same suit in hand + ${points}`;
  }

  // helper fn to test wether a potential token placement meets minimum reqs
  private filterAndSortTokenScoreResults(
    topCardScore: number,
    tokenScoreArr: AiMoveSearchResultsObj[]
  ): AiMoveSearchResultsObj[] {
    const adjustedScoreThreshold = this.adjustMinThreshold(
      SCORE_INCREASE_THRESHOLD
    );
    // check for withTokenScore to remove card-only results from the list.
    // Then remove results which don't raise the score by the minimum threshold
    // versus just playing a card
    tokenScoreArr = tokenScoreArr.filter(
      (ele) => ele.score - topCardScore >= adjustedScoreThreshold
    );
    // sort the array first by score,
    // then by the value of the card the token will be placed on
    return tokenScoreArr.sort(
      (a, b) =>
        b.score! - a.score! || b.tokenSpaceCardValue! - a.tokenSpaceCardValue!
    );
  }
}
