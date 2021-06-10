import { Model } from '../model/model.js';
import { View } from '../view/view.js';
export class Controller {
    constructor(gameType, layout, deckType) {
        this.bindPlayCard = (playerID, card, boardSpace) => {
            console.log('play card method called');
            if (playerID === 'computerPlayer') {
                this.view.computerPlayCard(card, boardSpace);
            }
        };
        this.handleDrawCard = (card) => {
            console.log(`controller handleDrawCard method called`);
            this.view.playerDrawCard(card);
        };
        this.createBoundAvailTokensCallBack = (callback, playerId) => {
            return () => {
                return callback.call(this, playerId);
            };
        };
        this.model = new Model(gameType, layout, deckType);
        this.view = new View(this.model.board);
        // bind availtokens callback to playerID
        const availTokensCallBack = this.createBoundAvailTokensCallBack(this.model.board.getAvailableTokenSpaces, 'humanPlayer1');
        this.view.bindPlayerInterface(this.model.board.getAvailableSpaces, availTokensCallBack);
        if (gameType === 'vsAI') {
            this.model.vsAI(this.bindPlayCard, this.handleDrawCard);
        }
    }
}
