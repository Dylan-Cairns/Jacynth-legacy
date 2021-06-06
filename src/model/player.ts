import { Card, Decktet } from './decktet';
import { BoardSpace, GameBoard } from './gameboard';

const PLAYER_INFLUENCE_TOKENS = 4;
const PLAYER_HAND_SIZE = 3;

type AiMoveSearchResultsObj = {
  cardToPlay: Card;
  spaceToPlaceCard: BoardSpace;
  cardOnlyScore: number;
  SpaceToPlaceToken: BoardSpace | undefined;
  withTokenScore: number | undefined;
};

export type BindPlayCardCallback = (
  playerID: PlayerType,
  card: Card,
  boardSpace: BoardSpace
) => void;

export type BindDrawCardCallback = (card: Card) => void;

export type PlayerType = 'humanPlayer1' | 'humanPlayer2' | 'computerPlayer';

export class Player {
  protected playerID: PlayerType;
  protected hand: Card[];
  protected gameBoard: GameBoard;
  protected deck: Decktet;
  protected influenceTokens: number;
  protected onPlayCard: BindPlayCardCallback;
  protected onDrawCard: BindDrawCardCallback;

  constructor(
    playerID: PlayerType,
    gameBoard: GameBoard,
    deck: Decktet,
    onPlayCard: BindPlayCardCallback,
    onDrawCard: BindDrawCardCallback
  ) {
    this.playerID = playerID;
    this.gameBoard = gameBoard;
    this.deck = deck;
    this.hand = [];
    this.influenceTokens = PLAYER_INFLUENCE_TOKENS;
    this.onPlayCard = onPlayCard;
    this.onDrawCard = onDrawCard;
    // Draw starting hand
    for (let i = 0; i < PLAYER_HAND_SIZE; i++) {
      this.hand.push(this.deck.drawCard() as Card);
    }
  }

  playCard(spaceID: string, card: Card) {
    if (!this.gameBoard.setCard(spaceID, card)) {
      return false;
    } else {
      this.hand = this.hand.filter((ele) => ele !== card);
      this.drawCard();
      return true;
    }
  }

  drawCard() {
    const newCard = this.deck.drawCard();
    if (newCard) {
      this.hand.push(newCard);

      if (this.playerID !== 'computerPlayer') {
        this.onDrawCard(newCard);
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
    onPlayCard: BindPlayCardCallback,
    onDrawCard: BindDrawCardCallback
  ) {
    super(playerID, gameBoard, deck, onPlayCard, onDrawCard);
    this.opponentID = opponentID;
  }

  getAllAvailableMoves() {
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

  chooseBestMove() {
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
  }

  // helper fn to adjust requirements for placing an influence
  // token as the game progresses
  adjustMinThreshold(hopedForAmt: number) {
    const spaceLeft = this.gameBoard.getAvailableSpaces().size;
    const sizeOfTheBoard = this.gameBoard.getBoardSize();
    const settledForNumber = Math.ceil(
      hopedForAmt * (spaceLeft / sizeOfTheBoard)
    );

    return settledForNumber;
  }
}

// const deck = new Decktet({ isBasicDeck: true });
// const board = new GameBoard(6);
// board.setCard('x0y0', deck.drawCard()!);
// board.setCard('x0y5', deck.drawCard()!);
// board.setCard('x5y0', deck.drawCard()!);
// board.setCard('x5y5', deck.drawCard()!);
// // console.log(board.getAvailableSpaces());
// const computerPlayer1 = new ComputerPlayer(
//   'Computer1',
//   board,
//   deck,
//   'Computer2'
// );
// const computerPlayer2 = new ComputerPlayer(
//   'Computer2',
//   board,
//   deck,
//   'Computer1'
// );
// // console.log(computerPlayer1.chooseBestMove());

// let turnNumber = 1;
// while (board.getAvailableSpaces().size > 0) {
//   console.log(`Turn number ${turnNumber}`);
//   computerPlayer1.chooseBestMove();
//   computerPlayer2.chooseBestMove();
//   const p1score = board.getPlayerScore('Computer1');
//   const p2score = board.getPlayerScore('Computer2');
//   console.log(`Score = P1: ${p1score} vs P2: ${p2score}`);
//   turnNumber++;
// }
// console.log(`Game over.`);
// const p1score = board.getPlayerScore('Computer1');
// const p2score = board.getPlayerScore('Computer2');
// console.log(`Final score = P1: ${p1score} vs P2: ${p2score}`);
