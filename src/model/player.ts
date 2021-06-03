import { BADNAME } from 'dns';
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

export class Player {
  protected playerID: string;
  protected hand: Card[];
  protected gameBoard: GameBoard;
  protected deck: Decktet;
  protected influenceTokens: number;

  constructor(playerID: string, gameBoard: GameBoard, deck: Decktet) {
    this.playerID = playerID;
    this.gameBoard = gameBoard;
    this.deck = deck;
    this.hand = [];
    this.influenceTokens = PLAYER_INFLUENCE_TOKENS;
    for (let i = 0; i < PLAYER_HAND_SIZE; i++) {
      this.hand.push(this.deck.drawCard() as Card);
    }
  }

  playCard(spaceID: string, card: Card) {
    if (this.gameBoard.setCard(spaceID, card)) {
      return false;
    } else {
      const newCard = this.deck.drawCard();
      if (newCard) this.hand.push();
      return true;
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
  opponentID: string;
  constructor(
    playerID: string,
    gameBoard: GameBoard,
    deck: Decktet,
    opponentID: string
  ) {
    super(playerID, gameBoard, deck);
    this.opponentID = opponentID;
  }

  private getAllAvailableMoves() {
    const currentHumanScore = this.gameBoard.getPlayerScore(this.opponentID);
    const currentComputerScore = this.gameBoard.getPlayerScore(this.playerID);

    const resultsArr = [] as AiMoveSearchResultsObj[];
    //for each card in computers hand
    this.getHandArr().forEach((card) => {
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
              const SCORE_INCREASE_THRESHOLD = 4;
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
      const aTokenScore = a.withTokenScore || 0;
      const bTokenScore = b.withTokenScore || 0;
      return aTokenScore - bTokenScore;
    })[0];

    let finalChoice = topCardOnlyMove;

    // If the top score from placing a token is higher than from only placing a card,
    // choose the move that places a token as well as a card.
    // Otherwise only place a card. Minimum threshold for token placement
    //  was already tested in getAllAvailableMoves method, no need to test again.
    if (this.influenceTokens > 0) {
      if (topTokenMove.withTokenScore && topTokenMove.SpaceToPlaceToken) {
        if (topTokenMove.withTokenScore > topCardOnlyMove.cardOnlyScore) {
          finalChoice = topTokenMove;
          this.playCard(
            finalChoice.spaceToPlaceCard.getID(),
            finalChoice.cardToPlay
          );
          const spaceToPlaceToken = finalChoice.SpaceToPlaceToken;
          if (spaceToPlaceToken) {
            this.placeToken(spaceToPlaceToken.getID());
          }
        }
      }
    } else {
      this.playCard(
        finalChoice.spaceToPlaceCard.getID(),
        finalChoice.cardToPlay
      );
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
