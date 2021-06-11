import { Card, Decktet } from './decktet.js';
import { BoardSpace, GameBoard } from './gameboard.js';

const PLAYER_INFLUENCE_TOKENS = 4;
const PLAYER_HAND_SIZE = 3;

type AiMoveSearchResultsObj = {
  cardToPlay: Card;
  spaceToPlaceCard: BoardSpace;
  cardOnlyScore: number;
  SpaceToPlaceToken: BoardSpace | undefined;
  withTokenScore: number | undefined;
};

export type SendCardDrawtoViewCB = (card: Card) => void;
export type SendCardPlaytoViewCB = (card: Card, spaceID: BoardSpace) => void;
export type SendTokenPlayToViewCB = (boardSpace: BoardSpace) => void;

export type PlayerID = 'Player1' | 'Player2' | 'Computer';

export class Player {
  protected playerID: PlayerID;
  protected hand: Card[];
  protected gameBoard: GameBoard;
  protected deck: Decktet;
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
    console.log(`${this.playerID} created`);
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

export class ComputerPlayer extends Player {
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

        const resultsObj = {
          cardToPlay: card,
          spaceToPlaceCard: availCardSpace,
          cardOnlyScore: cardOnlyScore,
          SpaceToPlaceToken: undefined,
          withTokenScore: undefined
        } as AiMoveSearchResultsObj;

        resultsArr.push(resultsObj);
        // then also check what the change in score will be when placing a token
        // in any space meeting the minimum requirements
        if (this.influenceTokens > 0) {
          this.gameBoard
            .getAvailableTokenSpaces(this.playerID)
            .forEach((availTokenSpace) => {
              const CARD_VALUE_THRESHOLD = 5;
              const SCORE_INCREASE_THRESHOLD = 3;
              const adjustedCardValueThreshold =
                this.adjustMinThreshold(CARD_VALUE_THRESHOLD);
              const cardValue = availTokenSpace.getCard()?.getValue();
              if (cardValue && cardValue >= adjustedCardValueThreshold) {
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
                const adjustedScoreThreshold = this.adjustMinThreshold(
                  SCORE_INCREASE_THRESHOLD
                );
                if (withTokenScore >= cardOnlyScore + adjustedScoreThreshold) {
                  resultsObj['SpaceToPlaceToken'] = availTokenSpace;
                  resultsObj['withTokenScore'] = withTokenScore;
                }
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

  computerTakeTurn = () => {
    const allMoves = this.getAllAvailableMoves();
    console.log(allMoves);
    const topCardOnlyMove = allMoves.sort((a, b) => {
      return a.cardOnlyScore - b.cardOnlyScore;
    })[0];
    const topTokenMove = allMoves.sort((a, b) => {
      // two undefined values should be treated as equal ( 0 )
      if (
        typeof a.withTokenScore === 'undefined' &&
        typeof b.withTokenScore === 'undefined'
      )
        return 0;
      // if a is undefined and b isn't a should have a lower index in the array
      else if (typeof a.withTokenScore === 'undefined') return 1;
      // if b is undefined and a isn't a should have a higher index in the array
      else if (typeof b.withTokenScore === 'undefined') return -1;
      // if both numbers are defined compare as normal
      else return a.withTokenScore - b.withTokenScore;
    })[0];

    let finalChoice = topCardOnlyMove;

    // If the top score from placing a token is higher than from only placing a card,
    // choose the move that places a token as well as a card.
    // Otherwise only place a card. Minimum threshold for token placement
    //  was already tested in getAllAvailableMoves method, no need to test again.
    if (this.influenceTokens > 0) {
      if (
        topTokenMove?.withTokenScore &&
        topTokenMove?.SpaceToPlaceToken &&
        topTokenMove?.withTokenScore > topCardOnlyMove.cardOnlyScore
      ) {
        finalChoice = topTokenMove;
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
        console.log(
          `${
            this.playerID
          } played ${finalChoice.cardToPlay.getName()} to ${finalChoice.spaceToPlaceCard.getID()}`
        );
        const spaceToPlaceToken = finalChoice.SpaceToPlaceToken;
        if (spaceToPlaceToken) {
          this.placeToken(spaceToPlaceToken.getID());
          if (this.sendTokenPlayToView) {
            this.sendTokenPlayToView(spaceToPlaceToken);
          }
          console.log(
            `${
              this.playerID
            } played a token to ${finalChoice.SpaceToPlaceToken?.getID()}`
          );
        }
      } else {
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
        console.log(
          `${
            this.playerID
          } played ${finalChoice.cardToPlay.getName()} to ${finalChoice.spaceToPlaceCard.getID()}`
        );
      }
    }
    this.drawCard();
  };

  // helper fn to adjust requirements for placing an influence
  // token as the game progresses
  private adjustMinThreshold(hopedForAmt: number) {
    const spaceLeft = this.gameBoard.getAvailableSpaces().length;
    const sizeOfTheBoard = this.gameBoard.getBoardSize();
    const settledForNumber = Math.ceil(
      hopedForAmt * (spaceLeft / sizeOfTheBoard)
    );

    return settledForNumber;
  }
}
