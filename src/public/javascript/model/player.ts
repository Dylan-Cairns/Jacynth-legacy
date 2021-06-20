import { Socket } from 'socket.io-client';

import { Card, Decktet } from './decktet.js';
import { BoardSpace, GameBoard } from './gameboard.js';

// game variables that never change
const PLAYER_INFLUENCE_TOKENS = 4;
const PLAYER_HAND_SIZE = 3;
// initial minimum values used in AI move selection
const CARD_VALUE_THRESHOLD = 6;
const SCORE_INCREASE_THRESHOLD = 4;

type AiMoveSearchResultsObj = {
  cardToPlay: Card;
  spaceToPlaceCard: BoardSpace;
  cardOnlyScore: number;
  spaceToPlaceToken: BoardSpace | undefined;
  tokenSpaceCardValue: number | undefined;
  withTokenScore: number | undefined;
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
    console.log(this.playerID);

    socket.on(
      'recieveCardDraw',
      (cardID: string | undefined, playerID: string) => {
        if (playerID !== this.playerID || !cardID) return;
        const card = this.deck.getCardByID(cardID);
        if (card) this.hand.push(card);
        console.log(
          'cardDraw, cardID, playerID, handArr',
          card?.getId(),
          this.playerID,
          this.hand
        );
        if (!card || !this.sendCardDrawtoView) return;
        this.sendCardDrawtoView(card);
      }
    );

    socket.on(
      'recievePlayerMove',
      (playerID, cardID, spaceID, tokenSpaceID) => {
        console.log(`${this.playerID} recievePlayerMove method`);
        console.log(
          'recieved playerid, cardid, spaceID, tokenSpaceID: ',
          playerID,
          cardID,
          spaceID
        );
        console.log('sendCardplaytoMoveCB?', this.sendCardPlaytoView);
        if (playerID !== this.playerID) return;
        if (!this.sendCardPlaytoView) return;

        const card = this.getCardFromHandByID(cardID);
        const space = this.gameBoard.getSpace(spaceID);
        console.log(
          'card from hand by id, spaceID',
          card?.getId(),
          space?.getID()
        );
        console.log('hand arr', this.hand);
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
  constructor(
    playerID: PlayerID,
    gameBoard: GameBoard,
    deck: Decktet,
    opponentID: PlayerID
  ) {
    super(playerID, gameBoard, deck);
    this.opponentID = opponentID;
  }

  private getAllAvailableMoves() {
    const currentHumanScore = this.gameBoard.getPlayerScore(this.opponentID);
    const currentComputerScore = this.gameBoard.getPlayerScore(this.playerID);
    const resultsArr = [] as AiMoveSearchResultsObj[];
    const adjustedCardValueThreshold =
      this.adjustMinThreshold(CARD_VALUE_THRESHOLD);
    // sort cards in hand by value. If it's not possible to increase the
    // score this turn, then at least we will only play the lowest valued card
    const handArr = this.getHandArr().sort((a, b) => {
      return a.getValue() - b.getValue();
    });
    //for each card in computers hand,
    handArr.forEach((card) => {
      this.gameBoard.getAvailableSpaces().forEach((availCardSpace) => {
        // see what the change in score will be for each open space on the board
        this.gameBoard.setCard(availCardSpace.getID(), card);
        const changeInHumanScore =
          this.gameBoard.getPlayerScore(this.opponentID) - currentHumanScore;
        const changeInComputerScore =
          this.gameBoard.getPlayerScore(this.playerID) - currentComputerScore;
        const cardOnlyScore = changeInComputerScore - changeInHumanScore;

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
            .getAvailableTokenSpaces(this.playerID)
            .forEach((availTokenSpace) => {
              const tokenSpaceCard = availTokenSpace.getCard();
              if (tokenSpaceCard) {
                // check whether the card value meets our mimnimum threshold
                const tokenSpaceCardValue = tokenSpaceCard.getValue();

                if (tokenSpaceCardValue >= adjustedCardValueThreshold) {
                  //if it does, create a resultsObj and push to results.
                  this.gameBoard.setPlayerToken(
                    availTokenSpace.getID(),
                    this.playerID
                  );
                  const tokenChangeInHumanScore =
                    this.gameBoard.getPlayerScore(this.opponentID) -
                    currentHumanScore;
                  const tokenChangeInComputerScore =
                    this.gameBoard.getPlayerScore(this.playerID) -
                    currentComputerScore;
                  const withTokenScore =
                    tokenChangeInComputerScore - tokenChangeInHumanScore;

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
              }
            });
        }
        // reset score after each card removal
        this.gameBoard.removeCardAndResolveBoard(availCardSpace.getID());
      });
    });
    return resultsArr;
  }

  computerTakeTurn = () => {
    const allMoves = this.getAllAvailableMoves();
    // remove token moves, then sort by score, if same score then randomize
    // (otherwise the computer will fill spaces in the board from top
    // left to bottom right sequentially)
    const cardOnlyMovesSorted = allMoves
      .filter((ele) => !ele.spaceToPlaceToken)
      .sort((a, b) => {
        const random = Math.random() > 0.5 ? 1 : -1;
        return b.cardOnlyScore - a.cardOnlyScore || random;
      });
    console.log('cardonlyMovesSorted', cardOnlyMovesSorted);
    const topCardOnlyMove = cardOnlyMovesSorted[0];
    const topCardOnlyScore = topCardOnlyMove.cardOnlyScore;
    const tokenMoveArr = this.filterAndSortTokenScoreResults(
      topCardOnlyScore,
      allMoves
    );
    console.log('tokenMovesSorted', tokenMoveArr);
    const topTokenMove = tokenMoveArr[0];

    // if there is at least 1 item in the tokenmove list after filtering,
    // that's our choice.
    const finalChoice = topTokenMove ? topTokenMove : topCardOnlyMove;
    // play card
    this.playCard(
      finalChoice.spaceToPlaceCard.getID(),
      finalChoice.cardToPlay.getId()
    );
    console.log(
      `${
        this.playerID
      } played ${finalChoice.cardToPlay.getName()} to ${finalChoice.spaceToPlaceCard.getID()}`
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
      console.log(
        `${
          this.playerID
        } played a token to ${finalChoice.spaceToPlaceToken?.getID()}`
      );
    }
    this.drawCard();
  };

  // helper fn to adjust requirements for placing an influence
  // token as the game progresses
  private adjustMinThreshold(hopedForAmt: number) {
    const spaceLeft = this.gameBoard.getRemainingSpacesNumber();
    const sizeOfTheBoard = Math.pow(this.gameBoard.getBoardSize(), 2);
    const settledForNumber = Math.ceil(
      hopedForAmt * (spaceLeft / sizeOfTheBoard)
    );

    return settledForNumber;
  }

  // helper fn to test wether a potential token placement meets minimum
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
}
