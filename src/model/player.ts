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

export type SendCardPlaytoViewCB = (
  playerID: PlayerType,
  card: Card,
  boardSpace: BoardSpace
) => void;

export type SendCardDrawtoViewCB = (card: Card) => void;

export type PlayerType = 'humanPlayer1' | 'humanPlayer2' | 'computerPlayer';

export class Player {
  protected playerID: PlayerType;
  protected hand: Card[];
  protected gameBoard: GameBoard;
  protected deck: Decktet;
  protected influenceTokens: number;
  protected sendCardPlaytoView: SendCardPlaytoViewCB;
  protected sendCardDrawtoView: SendCardDrawtoViewCB;

  constructor(
    playerID: PlayerType,
    gameBoard: GameBoard,
    deck: Decktet,
    sendCardPlaytoView: SendCardPlaytoViewCB,
    sendCardDrawtoView: SendCardDrawtoViewCB
  ) {
    this.playerID = playerID;
    this.gameBoard = gameBoard;
    this.deck = deck;
    this.hand = [];
    this.influenceTokens = PLAYER_INFLUENCE_TOKENS;
    this.sendCardPlaytoView = sendCardPlaytoView;
    this.sendCardDrawtoView = sendCardDrawtoView;
    console.log(`${this.playerID} created`);
    // Draw starting hand
    for (let i = 0; i < PLAYER_HAND_SIZE; i++) {
      this.drawCard();
    }
  }

  playCard(spaceID: string, card: Card) {
    if (!this.gameBoard.setCard(spaceID, card)) {
      return false;
    } else {
      this.hand = this.hand.filter((ele) => ele !== card);
      return true;
    }
  }

  undoPlayCard(spaceID: string, card: Card) {
    this.hand.push(card);
    this.gameBoard.getSpace(spaceID)?.removeCard();
  }

  drawCard() {
    const newCard = this.deck.drawCard();
    if (newCard) {
      this.hand.push(newCard);
      console.log(`${this.playerID} drawing card`);
      if (this.playerID !== 'computerPlayer') {
        this.sendCardDrawtoView(newCard);
      }
    }
  }

  placeToken(spaceID: string) {
    return this.gameBoard.setPlayerToken(spaceID, this.playerID);
  }

  getInfluenceTokensNo() {
    return this.influenceTokens;
  }

  getHandArr() {
    return this.hand;
  }

  getHandSize() {
    return this.hand.length;
  }
}

export class ComputerPlayer extends Player {
  opponentID: PlayerType;
  constructor(
    playerID: PlayerType,
    gameBoard: GameBoard,
    deck: Decktet,
    opponentID: PlayerType,
    onPlayCard: SendCardPlaytoViewCB,
    onDrawCard: SendCardDrawtoViewCB
  ) {
    super(playerID, gameBoard, deck, onPlayCard, onDrawCard);
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

  computerTakeTurn() {
    const allMoves = this.getAllAvailableMoves();
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
          finalChoice.cardToPlay
        );
        console.log(
          `${
            this.playerID
          } played ${finalChoice.cardToPlay.getName()} to ${finalChoice.spaceToPlaceCard.getID()}`
        );
        const spaceToPlaceToken = finalChoice.SpaceToPlaceToken;
        if (spaceToPlaceToken) {
          this.placeToken(spaceToPlaceToken.getID());
          console.log(
            `${
              this.playerID
            } played a token to ${finalChoice.SpaceToPlaceToken?.getID()}`
          );
        }
      } else {
        this.playCard(
          finalChoice.spaceToPlaceCard.getID(),
          finalChoice.cardToPlay
        );
        console.log(
          `${
            this.playerID
          } played ${finalChoice.cardToPlay.getName()} to ${finalChoice.spaceToPlaceCard.getID()}`
        );
      }
    }
    this.drawCard();
  }

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
