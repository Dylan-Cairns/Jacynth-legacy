import { Model } from '../model/model.js';
import { View } from '../view/view.js';
export class Controller {
    constructor(gameType, layout) {
        this.handlePlayCard = (playerID, card, boardSpace) => {
            console.log('play card method called');
            if (playerID === 'computerPlayer') {
                this.view.computerPlayCard(card, boardSpace);
            }
        };
        this.handleDrawCard = (card) => {
            console.log(`controller handleDrawCard method called`);
            this.view.playerDrawCard(card);
        };
        this.model = new Model('vsAI', 'razeway');
        this.view = new View(this.model.board);
        if (gameType === 'vsAI') {
            this.model.vsAI(this.handlePlayCard, this.handleDrawCard);
        }
        this.view.bindPlayerPlayCard(this.model.board.getAvailableSpaces);
    }
}
