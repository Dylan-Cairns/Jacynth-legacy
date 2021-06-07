import { Model } from '../model/model.js';
import { View } from '../view/view.js';
export class Controller {
    constructor(gameType, layout) {
        this.handlePlayCard = (playerID, card, boardSpace) => {
            if (playerID === 'computerPlayer') {
                this.view.computerPlayCard(card, boardSpace);
            }
        };
        this.handleDrawCard = (card) => {
            console.log(`controller handleDrawCard method called`);
            console.log(this);
            this.view.playerDrawCard(card);
        };
        this.model = new Model('vsAI', 'razeway', this.handlePlayCard, this.handleDrawCard);
        this.view = new View(this.model.board);
    }
}
